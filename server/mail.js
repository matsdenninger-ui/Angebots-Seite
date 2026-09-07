/**
 * Benachrichtigung per E-Mail — optional.
 *
 * Ohne SMTP_HOST in der Umgebung passiert hier nichts. Die Anfrage steht dann
 * trotzdem in der Excel-Liste; die Mail ist nur die Schulterklopfen-Funktion,
 * damit niemand die Datei stündlich öffnen muss.
 */

import nodemailer from 'nodemailer';
import { SPALTEN } from './felder.js';

let transport = null;

if (process.env.SMTP_HOST) {
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined
  });
}

export const mailAktiv = Boolean(transport && process.env.MAIL_AN);

function zeilenText(anfrage) {
  return SPALTEN.filter((s) => s.key && !s.key.startsWith('_'))
    .map((s) => {
      const wert = anfrage[s.key];
      if (wert === undefined || wert === null || wert === '') return null;
      const kopf = s.header.replace(/\n/g, ' ');
      return `${kopf}: ${Array.isArray(wert) ? wert.join(', ') : wert}`;
    })
    .filter(Boolean)
    .join('\n');
}

/**
 * Schickt die Eingangsbenachrichtigung an die GWB.
 * Fehler werden geschluckt und nur geloggt — eine gescheiterte Mail darf die
 * Anfrage nicht scheitern lassen.
 */
export async function eingangMelden(anfrage, hinweis) {
  if (!mailAktiv) return { verschickt: false, grund: 'nicht eingerichtet' };

  const betreff = `Partneranfrage: ${anfrage.firma ?? 'ohne Firmenname'} — ${
    anfrage.hauptgewerk ?? 'ohne Gewerk'
  }`;

  const text = [
    'Über die Partnerseite ist eine neue Anfrage eingegangen.',
    '',
    zeilenText(anfrage),
    '',
    anfrage._anlagen?.length
      ? `Anlagen: ${anfrage._anlagen.map((a) => a.name).join(', ')}`
      : 'Anlagen: keine',
    '',
    hinweis ?? '',
    '',
    'Die Zeile steht bereits in der Nachunternehmerliste.'
  ].join('\n');

  try {
    await transport.sendMail({
      from: process.env.MAIL_VON ?? process.env.SMTP_USER,
      to: process.env.MAIL_AN,
      replyTo: anfrage.email,
      subject: betreff,
      text
    });
    return { verschickt: true };
  } catch (fehler) {
    console.error('[mail] Benachrichtigung fehlgeschlagen:', fehler.message);
    return { verschickt: false, grund: fehler.message };
  }
}

/** Kurze Eingangsbestätigung an den Absender. */
export async function bestaetigungSenden(anfrage) {
  if (!mailAktiv || !anfrage.email) return { verschickt: false };

  const text = [
    `Guten Tag ${anfrage.ansprechpartner ?? ''},`.trim(),
    '',
    'vielen Dank für Ihre Anfrage. Sie ist bei uns eingegangen und liegt jetzt in der',
    'Nachunternehmer- und Lieferantenliste der GWB.',
    '',
    'Wir melden uns, sobald in Ihrem Gewerk etwas ansteht — in der Regel innerhalb',
    'von zehn Arbeitstagen. Wenn Sie bis dahin nichts hören, heißt das nicht, dass',
    'Ihre Anfrage verloren ist: wir kommen auf den Bieterkreis zurück, sobald das',
    'nächste Objekt in die Ausschreibung geht.',
    '',
    'Ihre Angaben im Überblick:',
    `Firma: ${anfrage.firma ?? '—'}`,
    `Hauptgewerk: ${anfrage.hauptgewerk ?? '—'}`,
    anfrage.gewerke?.length ? `weitere Gewerke: ${anfrage.gewerke.join(', ')}` : null,
    `Einsatzgebiet: ${anfrage.einsatzradius ?? '—'}`,
    '',
    'Mit freundlichen Grüßen',
    'GWB Gewerbe- und Wohnungsbau GmbH',
    'Alte Heerstraße 18, 41564 Kaarst'
  ]
    .filter((z) => z !== null)
    .join('\n');

  try {
    await transport.sendMail({
      from: process.env.MAIL_VON ?? process.env.SMTP_USER,
      to: anfrage.email,
      subject: 'Ihre Anfrage bei der GWB Gewerbe- und Wohnungsbau GmbH',
      text
    });
    return { verschickt: true };
  } catch (fehler) {
    console.error('[mail] Bestätigung fehlgeschlagen:', fehler.message);
    return { verschickt: false, grund: fehler.message };
  }
}
