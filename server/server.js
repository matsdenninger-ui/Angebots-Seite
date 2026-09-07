/**
 * Partnerseite der GWB — Server.
 *
 * Nimmt das Formular entgegen, prüft es, schreibt die Zeile in die Excel-Liste
 * und schickt auf Wunsch eine Benachrichtigung.
 */

import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

import { GEWERKE_GRUPPEN, LISTEN_BEWERBER, PFLICHTFELDER } from './felder.js';
import { anfragePruefen } from './pruefung.js';
import { anfrageSpeichern, nachtragen, DATEN_ORDNER, EXCEL_DATEI } from './excel.js';
import { eingangMelden, bestaetigungSenden, mailAktiv } from './mail.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WURZEL = path.resolve(__dirname, '..');
const OEFFENTLICH = path.join(WURZEL, 'public');
const ANLAGEN_ORDNER = path.join(DATEN_ORDNER, 'anlagen');
const PORT = Number(process.env.PORT ?? 3000);

/* --- Anlagen: nur Dokumente, höchstens fünf, je 10 MB -------------------- */

const ERLAUBTE_TYPEN = new Map([
  ['application/pdf', '.pdf'],
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['application/msword', '.doc'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx']
]);

const upload = multer({
  storage: multer.diskStorage({
    destination: async (req, datei, weiter) => {
      await fs.mkdir(ANLAGEN_ORDNER, { recursive: true });
      weiter(null, ANLAGEN_ORDNER);
    },
    filename: (req, datei, weiter) => {
      /* Der Originalname geht in die Excel-Spalte, auf der Platte steht ein
         unverfänglicher Name — sonst schreibt jemand "../../etc/passwd". */
      const endung = ERLAUBTE_TYPEN.get(datei.mimetype) ?? '';
      weiter(null, `${Date.now()}-${crypto.randomUUID()}${endung}`);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 5, fields: 200 },
  fileFilter: (req, datei, weiter) => {
    if (ERLAUBTE_TYPEN.has(datei.mimetype)) return weiter(null, true);
    weiter(new Error(`Dateityp nicht erlaubt: ${datei.originalname}`));
  }
});

/* --- Einfache Bremse gegen Massenversand --------------------------------- */

const zugriffe = new Map();
const FENSTER_MS = 10 * 60 * 1000;
const MAX_PRO_FENSTER = 5;

function bremse(req, res, weiter) {
  const jetzt = Date.now();
  const wer = req.ip ?? 'unbekannt';
  const liste = (zugriffe.get(wer) ?? []).filter((t) => jetzt - t < FENSTER_MS);
  if (liste.length >= MAX_PRO_FENSTER) {
    return res.status(429).json({
      ok: false,
      fehler: [
        'Von dieser Verbindung sind in kurzer Zeit mehrere Anfragen eingegangen. ' +
          'Bitte versuchen Sie es in einigen Minuten erneut oder rufen Sie uns an.'
      ]
    });
  }
  liste.push(jetzt);
  zugriffe.set(wer, liste);
  weiter();
}

/* Alte Einträge aufräumen, damit die Map nicht wächst. */
setInterval(() => {
  const jetzt = Date.now();
  for (const [wer, liste] of zugriffe) {
    const frisch = liste.filter((t) => jetzt - t < FENSTER_MS);
    if (frisch.length) zugriffe.set(wer, frisch);
    else zugriffe.delete(wer);
  }
}, FENSTER_MS).unref();

/* --- App ------------------------------------------------------------------ */

const app = express();
app.set('trust proxy', Number(process.env.PROXY_EBENEN ?? 1));
app.disable('x-powered-by');

app.use((req, res, weiter) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  weiter();
});

app.use(express.static(OEFFENTLICH, { extensions: ['html'] }));

/**
 * Das Formular holt Gewerke und Menüs von hier — eine Quelle, keine Dopplung.
 *
 * Ausgeliefert wird ausschließlich LISTEN_BEWERBER. Status, Absagegründe und
 * die Kürzel der Bearbeiter sind Verwaltungssache und verlassen den Server
 * nicht: diese Antwort kann jeder Besucher im Browser mitlesen.
 */
app.get('/api/felder', (req, res) => {
  res.json({
    gewerkeGruppen: GEWERKE_GRUPPEN,
    listen: LISTEN_BEWERBER,
    pflichtfelder: PFLICHTFELDER
  });
});

app.post('/api/anfrage', bremse, (req, res) => {
  upload.array('anlagen', 5)(req, res, async (uploadFehler) => {
    if (uploadFehler) {
      const text =
        uploadFehler.code === 'LIMIT_FILE_SIZE'
          ? 'Eine Datei ist größer als 10 MB.'
          : uploadFehler.message;
      return res.status(400).json({ ok: false, fehler: [text] });
    }

    try {
      /* Honeypot: ein für Menschen unsichtbares Feld. Ist es gefüllt, war es ein Bot.
         Wir antworten freundlich und werfen die Anfrage weg. */
      if (req.body?.webseite) {
        await entferneAnlagen(req.files);
        return res.json({ ok: true, inExcel: true });
      }

      const { fehler, anfrage } = anfragePruefen(req.body ?? {});
      if (fehler.length) {
        await entferneAnlagen(req.files);
        return res.status(400).json({ ok: false, fehler });
      }

      const jetzt = new Date();
      anfrage._id = crypto.randomUUID();
      anfrage._eingang = jetzt.toISOString();
      anfrage._einwilligung = jetzt.toISOString();
      anfrage._anlagen = (req.files ?? []).map((d) => ({
        name: d.originalname,
        datei: path.basename(d.path),
        groesse: d.size
      }));

      const ergebnis = await anfrageSpeichern(anfrage);

      if (!ergebnis.inExcel) {
        console.error(
          `[excel] Anfrage ${anfrage._id} konnte nicht eingetragen werden: ${ergebnis.fehler}. ` +
            'Sie steht in anfragen.jsonl und wird beim nächsten Eingang nachgetragen.'
        );
      }

      /* Mails laufen nebenher — der Absender wartet nicht auf den SMTP-Server. */
      eingangMelden(
        anfrage,
        ergebnis.inExcel ? null : 'Hinweis: Die Excel-Datei war gesperrt. Zeile wird nachgetragen.'
      ).catch(() => {});
      bestaetigungSenden(anfrage).catch(() => {});

      res.json({ ok: true, inExcel: ergebnis.inExcel });
    } catch (fehler) {
      console.error('[anfrage] unerwarteter Fehler:', fehler);
      await entferneAnlagen(req.files);
      res.status(500).json({
        ok: false,
        fehler: [
          'Auf unserer Seite ist etwas schiefgegangen. Bitte rufen Sie uns an — ' +
            'wir nehmen die Angaben gern am Telefon auf.'
        ]
      });
    }
  });
});

/* --- Verwaltung ----------------------------------------------------------
   Alles unterhalb dieser Linie ist Sache der GWB und nur mit dem
   Wartungsschlüssel erreichbar. Ohne gesetzten Schlüssel gibt es die Routen
   gar nicht.
   ------------------------------------------------------------------------ */

function wartungsSchluesselStimmt(req) {
  const erwartet = process.env.WARTUNGS_SCHLUESSEL;
  if (!erwartet) return false;
  const geschickt = req.get('X-Wartungs-Schluessel') ?? '';
  return (
    geschickt.length === erwartet.length &&
    crypto.timingSafeEqual(Buffer.from(geschickt), Buffer.from(erwartet))
  );
}

/** Trägt nach, was bei gesperrter Excel-Datei liegen geblieben ist. */
app.post('/api/nachtragen', async (req, res) => {
  if (!process.env.WARTUNGS_SCHLUESSEL) {
    return res.status(404).json({ ok: false, fehler: ['Nicht eingerichtet.'] });
  }
  if (!wartungsSchluesselStimmt(req)) {
    return res.status(403).json({ ok: false, fehler: ['Kein Zugriff.'] });
  }

  try {
    const ergebnis = await nachtragen();
    res.json({ ok: true, ...ergebnis });
  } catch (fehler) {
    res.status(500).json({ ok: false, fehler: [fehler.message] });
  }
});

/**
 * Lebenszeichen für Überwachung und Ladebalancer.
 *
 * Öffentlich steht hier nur, dass der Server läuft — der Name der Excel-Datei
 * und der Zustand des Mailversands gehen niemanden von außen etwas an. Mit dem
 * Wartungsschlüssel gibt es die Einzelheiten.
 */
app.get('/api/status', (req, res) => {
  if (!wartungsSchluesselStimmt(req)) return res.json({ ok: true });
  res.json({ ok: true, mail: mailAktiv, excel: path.basename(EXCEL_DATEI) });
});

async function entferneAnlagen(dateien) {
  for (const d of dateien ?? []) {
    await fs.unlink(d.path).catch(() => {});
  }
}

app.listen(PORT, () => {
  console.log(`GWB Partnerseite läuft auf http://localhost:${PORT}`);
  console.log(`Excel-Liste: ${EXCEL_DATEI}`);
  console.log(`Mailversand: ${mailAktiv ? 'eingerichtet' : 'nicht eingerichtet'}`);
});
