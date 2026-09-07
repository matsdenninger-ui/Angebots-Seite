/**
 * Schreibt jede Anfrage in die Excel-Liste.
 *
 * Zwei Dateien, bewusst getrennt:
 *   data/anfragen.jsonl   append-only, die Wahrheit. Wird nie überschrieben.
 *   data/<liste>.xlsx     die Arbeitsdatei der GWB. Wird ergänzt, nicht neu gebaut,
 *                         damit von Hand gepflegte Spalten wie "Stand der Dinge"
 *                         stehen bleiben.
 *
 * Schreibvorgänge laufen nacheinander (siehe warteschlange), sonst können zwei
 * gleichzeitige Anfragen die Datei zerlegen.
 */

import ExcelJS from 'exceljs';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { SPALTEN, LISTEN, GEWERKE_GRUPPEN } from './felder.js';

const DATEN_ORDNER = process.env.DATEN_ORDNER
  ? path.resolve(process.env.DATEN_ORDNER)
  : path.resolve(process.cwd(), 'data');

const EXCEL_DATEI = process.env.EXCEL_DATEI
  ? path.resolve(process.env.EXCEL_DATEI)
  : path.join(DATEN_ORDNER, 'GWB_Nachunternehmerliste.xlsx');

const JSONL_DATEI = path.join(DATEN_ORDNER, 'anfragen.jsonl');
const BLATT_ANFRAGEN = 'Anfragen';
const BLATT_LISTEN = 'Listen';
const BLATT_HINWEIS = 'So funktioniert es';
const MENUE_BIS_ZEILE = 5000;

/* Farben in Anlehnung an das Erscheinungsbild der GWB. */
const FARBE_KOPF = 'FF1F3A5F';
const FARBE_KOPF_MANUELL = 'FF5B6B7C';
const FARBE_HINWEIS = 'FFF2F5F8';

export { EXCEL_DATEI, JSONL_DATEI, DATEN_ORDNER };

/* --- Warteschlange: ein Schreibvorgang nach dem anderen ------------------- */

let warteschlange = Promise.resolve();

function nacheinander(aufgabe) {
  const ergebnis = warteschlange.then(aufgabe, aufgabe);
  // Ein Fehler darf die Kette nicht abreißen lassen.
  warteschlange = ergebnis.then(
    () => undefined,
    () => undefined
  );
  return ergebnis;
}

/* --- Hilfsfunktionen ------------------------------------------------------ */

function spaltenBuchstabe(index) {
  let n = index;
  let s = '';
  while (n > 0) {
    const rest = (n - 1) % 26;
    s = String.fromCharCode(65 + rest) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** Name der Excel-Namensdefinition zu einer Auswahlliste. */
function listenName(liste) {
  return `liste_${liste}`;
}

/** Datum ohne Uhrzeit — Excel zeigt sonst 00:00:00 an. */
function nurDatum(wert) {
  if (!wert) return null;
  const d = wert instanceof Date ? wert : new Date(wert);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

/* --- Arbeitsmappe anlegen ------------------------------------------------- */

function blattListenAnlegen(wb) {
  const ws = wb.addWorksheet(BLATT_LISTEN, { properties: { tabColor: { argb: FARBE_KOPF } } });

  ws.getCell('A1').value = 'Auswahllisten — hier ändern, die Menüs im Blatt „Anfragen" ändern sich mit.';
  ws.getCell('A1').font = { bold: true, size: 12, color: { argb: FARBE_KOPF } };
  ws.getCell('A2').value =
    'Neue Einträge unten anhängen. Wer eine Zeile mittendrin löscht, reißt ein Loch in das Menü — lieber überschreiben.';
  ws.getCell('A2').font = { italic: true, size: 9, color: { argb: 'FF5B6B7C' } };

  const namen = Object.keys(LISTEN);
  namen.forEach((name, i) => {
    const spalte = i + 1;
    const buchstabe = spaltenBuchstabe(spalte);
    const kopf = ws.getCell(4, spalte);
    kopf.value = name;
    kopf.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    kopf.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FARBE_KOPF } };
    kopf.alignment = { vertical: 'middle', horizontal: 'left' };

    LISTEN[name].forEach((wert, j) => {
      ws.getCell(5 + j, spalte).value = wert;
    });

    ws.getColumn(spalte).width = Math.max(18, ...LISTEN[name].map((w) => w.length + 2));

    const von = 5;
    const bis = 5 + LISTEN[name].length - 1;
    wb.definedNames.add(`'${BLATT_LISTEN}'!$${buchstabe}$${von}:$${buchstabe}$${bis}`, listenName(name));
  });

  /* Gewerke stehen in einer eigenen Spalte, damit auch das Hauptgewerk ein Menü bekommt. */
  const gewerkeSpalte = namen.length + 2;
  const gb = spaltenBuchstabe(gewerkeSpalte);
  const kopf = ws.getCell(4, gewerkeSpalte);
  kopf.value = 'Gewerke (alle)';
  kopf.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  kopf.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FARBE_KOPF } };

  let zeile = 5;
  for (const gruppe of GEWERKE_GRUPPEN) {
    for (const gewerk of gruppe.gewerke) {
      ws.getCell(zeile, gewerkeSpalte).value = gewerk;
      ws.getCell(zeile, gewerkeSpalte + 1).value = gruppe.name;
      zeile += 1;
    }
  }
  ws.getColumn(gewerkeSpalte).width = 38;
  ws.getColumn(gewerkeSpalte + 1).width = 30;
  ws.getCell(4, gewerkeSpalte + 1).value = 'Bereich';
  ws.getCell(4, gewerkeSpalte + 1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getCell(4, gewerkeSpalte + 1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: FARBE_KOPF }
  };
  wb.definedNames.add(`'${BLATT_LISTEN}'!$${gb}$5:$${gb}$${zeile - 1}`, 'liste_gewerke');

  ws.views = [{ state: 'frozen', ySplit: 4 }];
  return ws;
}

function blattHinweisAnlegen(wb) {
  const ws = wb.addWorksheet(BLATT_HINWEIS, { properties: { tabColor: { argb: 'FFB08D57' } } });
  ws.getColumn(1).width = 4;
  ws.getColumn(2).width = 34;
  ws.getColumn(3).width = 95;

  const zeilen = [
    ['t', 'Nachunternehmer- und Lieferantenliste', ''],
    [
      'i',
      '',
      'Diese Datei füllt sich selbst. Jede Anfrage, die über die Partnerseite eingeht, landet als neue Zeile im Blatt „Anfragen" — ohne dass jemand etwas abtippt.'
    ],
    ['h', 'Welche Spalten wem gehören', ''],
    [
      'z',
      'Blau: kommt vom Formular',
      'Wird beim Eingang geschrieben und danach nicht mehr angefasst. Wer hier korrigiert, korrigiert nur die Anzeige — die Originalangabe steht in anfragen.jsonl.'
    ],
    [
      'z',
      'Grau: pflegt die GWB',
      '„Stand der Dinge", Status, die Termin-Daten und der Absagegrund. Diese Spalten bleiben beim nächsten Eingang unangetastet.'
    ],
    ['h', 'Die drei Regeln aus der Interessentenliste gelten weiter', ''],
    [
      'z',
      'Datum in die Spalte, nicht in den Satz.',
      'Statt „Unterlagen angefordert, AS 12.09.26" genügt „Unterlagen angefordert" im Text und das Datum in der Datumsspalte. Strg + Punkt setzt das heutige Datum.'
    ],
    [
      'z',
      '„Stand der Dinge" bleibt Freitext.',
      'Es ist die wertvollste Spalte. Sie wird nicht gekürzt und nicht in ein Menü gepresst.'
    ],
    [
      'z',
      'Alles Auswertbare kommt aus dem Menü.',
      'Wer frei hineinschreibt, fällt aus jeder Zählung. Fehlt ein Eintrag im Menü, wird er im Blatt „Listen" ergänzt.'
    ],
    ['h', 'Wenn etwas klemmt', ''],
    [
      'z',
      'Das Menü fehlt in einer Zeile',
      'Die Menüs reichen bis Zeile ' +
        MENUE_BIS_ZEILE +
        '. Darunter: eine Zeile mit Menü markieren, kopieren, in die neuen Zeilen einfügen.'
    ],
    [
      'z',
      'Datumsangaben erscheinen als Zahl',
      'Spalte markieren → Start → Zahlenformat → „Datum, kurz".'
    ],
    [
      'z',
      'Die Datei ist beschädigt',
      'Kein Grund zur Sorge: anfragen.jsonl enthält jede eingegangene Anfrage im Original. „npm run excel:rebuild" baut die Datei daraus neu auf und überträgt die von Hand gepflegten Spalten mit.'
    ],
    [
      'z',
      'Die Datei war beim Eingang geöffnet',
      'Windows sperrt geöffnete Dateien. Der Server merkt das, behält die Anfrage in anfragen.jsonl und trägt sie beim nächsten Eingang nach. Sicherer ist, die Datei geschlossen zu lassen.'
    ]
  ];

  let r = 1;
  for (const [art, links, rechts] of zeilen) {
    const zelle = ws.getCell(r, 1);
    if (art === 't') {
      zelle.value = links;
      zelle.font = { bold: true, size: 16, color: { argb: FARBE_KOPF } };
      ws.mergeCells(r, 1, r, 3);
      ws.getRow(r).height = 24;
    } else if (art === 'h') {
      zelle.value = links;
      zelle.font = { bold: true, size: 12, color: { argb: FARBE_KOPF } };
      ws.mergeCells(r, 1, r, 3);
      ws.getRow(r).height = 22;
    } else if (art === 'i') {
      ws.getCell(r, 2).value = rechts;
      ws.mergeCells(r, 2, r, 3);
      ws.getCell(r, 2).alignment = { wrapText: true, vertical: 'top' };
      ws.getRow(r).height = 32;
    } else {
      ws.getCell(r, 2).value = links;
      ws.getCell(r, 2).font = { bold: true };
      ws.getCell(r, 2).alignment = { wrapText: true, vertical: 'top' };
      ws.getCell(r, 3).value = rechts;
      ws.getCell(r, 3).alignment = { wrapText: true, vertical: 'top' };
      ws.getCell(r, 2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FARBE_HINWEIS } };
      ws.getCell(r, 3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FARBE_HINWEIS } };
      ws.getRow(r).height = 34;
    }
    r += 1;
  }
  return ws;
}

function blattAnfragenAnlegen(wb) {
  const ws = wb.addWorksheet(BLATT_ANFRAGEN, {
    properties: { tabColor: { argb: FARBE_KOPF } },
    views: [{ state: 'frozen', xSplit: 4, ySplit: 1 }]
  });

  SPALTEN.forEach((spalte, i) => {
    const nr = i + 1;
    const zelle = ws.getCell(1, nr);
    zelle.value = spalte.header;
    zelle.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
    zelle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: spalte.bereich === 'verwaltung' ? FARBE_KOPF_MANUELL : FARBE_KOPF }
    };
    zelle.alignment = { wrapText: true, vertical: 'middle', horizontal: 'left' };
    zelle.border = { bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } } };
    ws.getColumn(nr).width = spalte.breite ?? 18;
  });
  ws.getRow(1).height = 32;

  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: SPALTEN.length } };
  menuesSetzen(ws, MENUE_BIS_ZEILE);
  return ws;
}

/**
 * Setzt Auswahlmenüs und Zahlenformate.
 *
 * Die Menüs werden als Bereich gesetzt (A2:A5000), nicht Zelle für Zelle.
 * Zellweise angelegt, würde Excel 5000 leere Zeilen anlegen — die Datei wäre
 * groß, langsam und jede neue Anfrage landete am Ende dieser Wüste.
 */
function menuesSetzen(ws, bisZeile) {
  ws.dataValidations.model = {};

  SPALTEN.forEach((spalte, i) => {
    const nr = i + 1;
    const buchstabe = spaltenBuchstabe(nr);
    const bereich = `${buchstabe}2:${buchstabe}${bisZeile}`;

    const quelle =
      spalte.header === 'Hauptgewerk'
        ? 'liste_gewerke'
        : spalte.liste
          ? listenName(spalte.liste)
          : null;

    if (quelle) {
      ws.dataValidations.add(bereich, {
        type: 'list',
        allowBlank: true,
        formulae: [`=${quelle}`],
        showErrorMessage: false
      });
    }

    if (spalte.typ === 'datum') {
      ws.getColumn(nr).numFmt = 'DD.MM.YYYY';
    }
  });
}

async function mappeAnlegen() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'GWB Partneranfrage';
  wb.created = new Date();
  blattHinweisAnlegen(wb);
  blattAnfragenAnlegen(wb);
  blattListenAnlegen(wb);
  return wb;
}

async function mappeLaden() {
  if (!existsSync(EXCEL_DATEI)) {
    return { wb: await mappeAnlegen(), neu: true };
  }
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(EXCEL_DATEI);
  if (!wb.getWorksheet(BLATT_ANFRAGEN)) {
    throw new Error(`In ${EXCEL_DATEI} fehlt das Blatt "${BLATT_ANFRAGEN}".`);
  }
  return { wb, neu: false };
}

/* --- Zeile aus einer Anfrage bauen ---------------------------------------- */

export function zeileAusAnfrage(anfrage, lfdNr) {
  return SPALTEN.map((spalte) => {
    if (spalte.bereich === 'verwaltung') return null;
    if (spalte.key === '_lfdNr') return lfdNr;
    if (spalte.key === '_eingang') return nurDatum(anfrage._eingang);
    if (spalte.key === '_einwilligung') return nurDatum(anfrage._einwilligung);
    if (spalte.key === '_anlagen') {
      return anfrage._anlagen?.length ? anfrage._anlagen.map((a) => a.name).join(', ') : null;
    }

    const wert = anfrage[spalte.key];
    if (wert === undefined || wert === null || wert === '') return null;
    if (Array.isArray(wert)) return wert.join(', ');
    if (spalte.typ === 'datum') return nurDatum(wert);
    if (spalte.typ === 'zahl') {
      const zahl = Number(wert);
      return Number.isFinite(zahl) ? zahl : wert;
    }
    return wert;
  });
}

/* --- Öffentliche Schnittstelle -------------------------------------------- */

/** Hängt die Anfrage an anfragen.jsonl an. Läuft immer, auch wenn Excel klemmt. */
async function inJsonlSchreiben(anfrage) {
  await fs.mkdir(DATEN_ORDNER, { recursive: true });
  await fs.appendFile(JSONL_DATEI, `${JSON.stringify(anfrage)}\n`, 'utf8');
}

async function jsonlLesen() {
  if (!existsSync(JSONL_DATEI)) return [];
  const inhalt = await fs.readFile(JSONL_DATEI, 'utf8');
  return inhalt
    .split('\n')
    .filter((z) => z.trim())
    .map((z) => JSON.parse(z));
}

/**
 * Trägt eine Anfrage in die Excel-Datei ein.
 * Wirft nur, wenn die Datei nicht geschrieben werden kann — die Anfrage selbst
 * ist zu diesem Zeitpunkt bereits in anfragen.jsonl gesichert.
 */
async function excelErgaenzen() {
  const { wb, neu } = await mappeLaden();
  const ws = wb.getWorksheet(BLATT_ANFRAGEN);

  /* Welche Anfragen stehen schon drin? Die Id steht in einer versteckten Spalte hinten. */
  const idSpalte = SPALTEN.length + 1;
  const vorhanden = new Set();
  ws.eachRow({ includeEmpty: false }, (zeile, nr) => {
    if (nr === 1) return;
    const id = zeile.getCell(idSpalte).value;
    if (id) vorhanden.add(String(id));
  });

  const alle = await jsonlLesen();
  const offen = alle.filter((a) => !vorhanden.has(a._id));
  if (offen.length === 0 && !neu) return { ergaenzt: 0, datei: EXCEL_DATEI };

  let lfdNr = vorhanden.size;
  let naechsteZeile = Math.max(ws.rowCount, 1) + 1;

  for (const anfrage of offen) {
    lfdNr += 1;
    const werte = zeileAusAnfrage(anfrage, lfdNr);
    const zeile = ws.getRow(naechsteZeile);
    werte.forEach((wert, i) => {
      if (wert !== null && wert !== undefined) zeile.getCell(i + 1).value = wert;
    });
    zeile.getCell(idSpalte).value = anfrage._id;
    zeile.alignment = { vertical: 'top', wrapText: true };
    zeile.commit?.();
    naechsteZeile += 1;
  }

  /* Die Menüs reichen immer mindestens bis MENUE_BIS_ZEILE — und weiter, wenn
     die Liste darüber hinausgewachsen ist. */
  menuesSetzen(ws, Math.max(MENUE_BIS_ZEILE, naechsteZeile - 1));

  const idKopf = ws.getCell(1, idSpalte);
  idKopf.value = 'Id (nicht ändern)';
  idKopf.font = { bold: true, size: 9, color: { argb: 'FFB0B7BF' } };
  ws.getColumn(idSpalte).width = 38;
  ws.getColumn(idSpalte).hidden = true;

  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: SPALTEN.length } };

  await fs.mkdir(path.dirname(EXCEL_DATEI), { recursive: true });
  const temp = `${EXCEL_DATEI}.tmp`;
  await wb.xlsx.writeFile(temp);
  await fs.rename(temp, EXCEL_DATEI);

  return { ergaenzt: offen.length, datei: EXCEL_DATEI };
}

/**
 * Nimmt eine Anfrage entgegen: erst sichern, dann in Excel eintragen.
 * Scheitert das Eintragen (Datei gerade geöffnet), gilt die Anfrage trotzdem als
 * angenommen — sie wird beim nächsten Eingang oder per excel:rebuild nachgetragen.
 */
export async function anfrageSpeichern(anfrage) {
  await inJsonlSchreiben(anfrage);
  try {
    const ergebnis = await nacheinander(() => excelErgaenzen());
    return { gesichert: true, inExcel: true, ...ergebnis };
  } catch (fehler) {
    return { gesichert: true, inExcel: false, fehler: fehler.message };
  }
}

/** Trägt alles nach, was noch nicht in der Excel-Datei steht. */
export async function nachtragen() {
  return nacheinander(() => excelErgaenzen());
}

/**
 * Baut die Excel-Datei aus anfragen.jsonl neu auf.
 * Die von Hand gepflegten Spalten werden über die Id aus der alten Datei übernommen.
 */
export async function neuAufbauen() {
  return nacheinander(async () => {
    const idSpalte = SPALTEN.length + 1;
    const gepflegt = new Map();

    if (existsSync(EXCEL_DATEI)) {
      const alt = new ExcelJS.Workbook();
      await alt.xlsx.readFile(EXCEL_DATEI);
      const ws = alt.getWorksheet(BLATT_ANFRAGEN);
      if (ws) {
        ws.eachRow({ includeEmpty: false }, (zeile, nr) => {
          if (nr === 1) return;
          const id = zeile.getCell(idSpalte).value;
          if (!id) return;
          const werte = {};
          SPALTEN.forEach((spalte, i) => {
            if (spalte.bereich !== 'verwaltung') return;
            const wert = zeile.getCell(i + 1).value;
            if (wert !== null && wert !== undefined && wert !== '') werte[i] = wert;
          });
          if (Object.keys(werte).length) gepflegt.set(String(id), werte);
        });
      }
      await fs.copyFile(EXCEL_DATEI, `${EXCEL_DATEI}.${Date.now()}.bak`);
    }

    const wb = await mappeAnlegen();
    const ws = wb.getWorksheet(BLATT_ANFRAGEN);
    const alle = await jsonlLesen();

    alle.forEach((anfrage, i) => {
      const zeile = ws.getRow(i + 2);
      zeileAusAnfrage(anfrage, i + 1).forEach((wert, j) => {
        if (wert !== null && wert !== undefined) zeile.getCell(j + 1).value = wert;
      });
      const uebernahme = gepflegt.get(anfrage._id);
      if (uebernahme) {
        for (const [index, wert] of Object.entries(uebernahme)) {
          zeile.getCell(Number(index) + 1).value = wert;
        }
      }
      zeile.getCell(idSpalte).value = anfrage._id;
      zeile.alignment = { vertical: 'top', wrapText: true };
    });

    const idKopf = ws.getCell(1, idSpalte);
    idKopf.value = 'Id (nicht ändern)';
    idKopf.font = { bold: true, size: 9, color: { argb: 'FFB0B7BF' } };
    ws.getColumn(idSpalte).width = 38;
    ws.getColumn(idSpalte).hidden = true;

    await fs.mkdir(path.dirname(EXCEL_DATEI), { recursive: true });
    await wb.xlsx.writeFile(EXCEL_DATEI);
    return { zeilen: alle.length, uebernommen: gepflegt.size, datei: EXCEL_DATEI };
  });
}
