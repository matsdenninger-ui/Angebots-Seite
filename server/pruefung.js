/**
 * Prüft die eingehende Anfrage, bevor sie in die Liste geschrieben wird.
 *
 * Grundsatz: Auswahlfelder müssen aus der Liste stammen — sonst fällt die Zeile
 * aus jeder Auswertung. Freitext wird gekürzt statt abgelehnt, damit niemand ein
 * ausgefülltes Formular wegen zwei Zeichen zu viel verliert.
 */

import { LISTEN, ALLE_GEWERKE, PFLICHTFELDER, MAX_LAENGE, GEWERKE_GRUPPEN } from './felder.js';

const EMAIL_MUSTER = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const PLZ_MUSTER = /^[0-9]{4,5}$/;

const BESCHRIFTUNG = {
  art: 'Art der Zusammenarbeit',
  firma: 'Firma',
  ansprechpartner: 'Ansprechpartner',
  email: 'E-Mail',
  telefon: 'Telefon',
  plz: 'PLZ',
  ort: 'Ort',
  hauptgewerk: 'Hauptgewerk',
  einsatzradius: 'Einsatzgebiet'
};

/** Steuerzeichen raus — sie zerlegen sonst die Excel-Zelle. Zeilenumbrüche bleiben. */
function text(wert, max) {
  if (typeof wert !== 'string') return '';
  const sauber = wert
    .replace(/\r\n/g, '\n')
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '')
    .trim();
  return max ? sauber.slice(0, max) : sauber;
}

function liste(wert) {
  if (Array.isArray(wert)) return wert;
  if (typeof wert === 'string' && wert) return [wert];
  return [];
}

export function anfragePruefen(eingabe) {
  const fehler = [];
  const anfrage = {};

  /* --- Auswahlfelder: müssen aus dem Menü kommen --- */
  const auswahlFelder = [
    'art',
    'mitarbeiter',
    'kolonnen',
    'einsatzradius',
    'kapazitaet',
    'auftragsgroesse',
    'erfahrungWohnungsbau',
    'anlass',
    'woherKennenSieUns'
  ];

  for (const feld of auswahlFelder) {
    const wert = text(eingabe[feld], 120);
    if (!wert) continue;
    if (!LISTEN[feld].includes(wert)) {
      fehler.push(`${BESCHRIFTUNG[feld] ?? feld}: „${wert}“ steht nicht zur Auswahl.`);
      continue;
    }
    anfrage[feld] = wert;
  }

  /* --- Gewerke --- */
  const hauptgewerk = text(eingabe.hauptgewerk, 120);
  if (hauptgewerk) {
    if (!ALLE_GEWERKE.includes(hauptgewerk)) {
      fehler.push(`Hauptgewerk: „${hauptgewerk}“ steht nicht zur Auswahl.`);
    } else {
      anfrage.hauptgewerk = hauptgewerk;
    }
  }

  const gewerke = liste(eingabe.gewerke)
    .map((g) => text(g, 120))
    .filter((g) => ALLE_GEWERKE.includes(g) && g !== anfrage.hauptgewerk);
  const eindeutig = [...new Set(gewerke)];
  if (eindeutig.length > 40) {
    fehler.push('Mehr als 40 Gewerke ausgewählt — bitte auf das Wesentliche beschränken.');
  }
  anfrage.gewerke = eindeutig;

  /* Bereiche werden abgeleitet, nicht abgefragt — spart eine Frage im Formular. */
  const gesamt = [anfrage.hauptgewerk, ...eindeutig].filter(Boolean);
  anfrage.gewerkeGruppen = GEWERKE_GRUPPEN.filter((gruppe) =>
    gruppe.gewerke.some((g) => gesamt.includes(g))
  ).map((gruppe) => gruppe.name);

  /* --- Nachweise: Mehrfachauswahl aus der Liste --- */
  anfrage.nachweise = [
    ...new Set(
      liste(eingabe.nachweise)
        .map((n) => text(n, 120))
        .filter((n) => LISTEN.nachweise.includes(n))
    )
  ];

  /* --- Freitext --- */
  for (const feld of [
    'firma',
    'ansprechpartner',
    'funktion',
    'strasse',
    'plz',
    'ort',
    'telefon',
    'mobil',
    'email',
    'website',
    'leistung',
    'referenzen',
    'nachricht',
    'haftpflichtSumme',
    'objekt'
  ]) {
    const wert = text(eingabe[feld], MAX_LAENGE[feld]);
    if (wert) anfrage[feld] = wert;
  }

  /* --- Sonderprüfungen --- */
  if (anfrage.email && !EMAIL_MUSTER.test(anfrage.email)) {
    fehler.push('E-Mail: Die Adresse sieht nicht wie eine E-Mail-Adresse aus.');
  }
  if (anfrage.plz && !PLZ_MUSTER.test(anfrage.plz)) {
    fehler.push('PLZ: Bitte vier- oder fünfstellig angeben.');
  }
  if (anfrage.website && !/^https?:\/\//i.test(anfrage.website)) {
    anfrage.website = `https://${anfrage.website}`;
  }

  const jahr = text(eingabe.gruendungsjahr, 4);
  if (jahr) {
    const zahl = Number(jahr);
    const heute = new Date().getFullYear();
    if (!Number.isInteger(zahl) || zahl < 1800 || zahl > heute) {
      fehler.push(`Gründungsjahr: Bitte eine Jahreszahl zwischen 1800 und ${heute} angeben.`);
    } else {
      anfrage.gruendungsjahr = zahl;
    }
  }

  const verfuegbar = text(eingabe.verfuegbarAb, 10);
  if (verfuegbar) {
    const d = new Date(verfuegbar);
    if (Number.isNaN(d.getTime())) {
      fehler.push('Verfügbar ab: Bitte ein gültiges Datum angeben.');
    } else {
      anfrage.verfuegbarAb = verfuegbar;
    }
  }

  /* --- Pflichtfelder --- */
  for (const feld of PFLICHTFELDER) {
    const wert = anfrage[feld];
    const leer = wert === undefined || wert === '' || (Array.isArray(wert) && wert.length === 0);
    if (leer) fehler.push(`${BESCHRIFTUNG[feld] ?? feld}: Pflichtangabe.`);
  }

  /* --- Einwilligung --- */
  const einwilligung = eingabe.einwilligung;
  if (einwilligung !== true && einwilligung !== 'true' && einwilligung !== 'on') {
    fehler.push('Bitte der Speicherung Ihrer Angaben zustimmen.');
  }

  return { fehler, anfrage };
}
