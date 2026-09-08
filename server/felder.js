/**
 * Einzige Quelle der Wahrheit für Formular, Excel-Spalten und Auswahlmenüs.
 *
 * Die Struktur folgt der Logik der GWB-Interessentenliste:
 *   - Freitext bleibt Freitext ("Stand der Dinge" ist dort die wertvollste Spalte),
 *   - alles Auswertbare kommt aus einem Menü,
 *   - Daten stehen in eigenen Spalten, nicht im Satz.
 *
 * Wer eine Auswahl ändern will, ändert sie hier. Formular, Excel-Blatt "Listen"
 * und die Gültigkeitsprüfung ziehen alle aus dieser Datei.
 */

/**
 * Das Gewerkeverzeichnis der GWB — übernommen aus der internen Liste.
 *
 * "nr" ist die Kostenstelle aus dem Verzeichnis. Sie steht NICHT im Formular:
 * ein Bewerber kann mit unserer Kostenstellensystematik nichts anfangen. In die
 * Excel-Datei wird sie mitgeschrieben, damit sich eine Anfrage ohne Nachschlagen
 * in die Kostenrechnung einordnen lässt.
 *
 * Reihenfolge und Schreibweise sind bewusst unverändert übernommen. Wer hier
 * etwas ändert, ändert es im Formular, in der Prüfung und im Blatt "Listen"
 * gleichzeitig.
 */
export const GEWERKE_GRUPPEN = [
  {
    id: 'bau',
    name: 'Bau- und Ausbaugewerke',
    hinweis: 'Von der Baugrube bis zur Schließanlage.',
    gewerke: [
      { nr: 100, name: 'Verbauarbeiten' },
      { nr: 100, name: 'Erdarbeiten' },
      { nr: 200, name: 'Rohbauarbeiten' },
      { nr: 200, name: 'Fremdüberwachung Rohbau' },
      { nr: 200, name: 'Spezialtiefbau' },
      { nr: 200, name: 'Blitzschutz Gründung' },
      { nr: 200, name: 'Beschichtung Tiefgaragenboden' },
      { nr: 201, name: 'Tiefgaragen-Bodenbeschichtung' },
      { nr: 202, name: 'Klinkerarbeiten' },
      { nr: 500, name: 'Zimmerarbeiten' },
      { nr: 600, name: 'Dachdeckerarbeiten' },
      { nr: 600, name: 'Balkon- und Dachterassenplatten' },
      { nr: 601, name: 'TG-Decke Abdichtung' },
      { nr: 700, name: 'Leichtwände Gipsdielen' },
      { nr: 800, name: 'Innenputz' },
      { nr: 802, name: 'Trockenbauarbeiten' },
      { nr: 900, name: 'Fertigteilgaragen' },
      { nr: 2100, name: 'WDVS-Fassade' },
      { nr: 2100, name: 'Fassade Holz' },
      { nr: 2200, name: 'Fenster / Rollladen / Haustüren' },
      { nr: 2200, name: 'BK-Anlage (in Schlosser enthalten)' },
      { nr: 2600, name: 'Garagentor / Brandschutztor' },
      { nr: 2800, name: 'Fugenversiegelung' },
      { nr: 2900, name: 'Gerüstbau' },
      { nr: 4300, name: 'Sanitärinstallation / Heizung' },
      { nr: 4300, name: 'Geothermiebohrungen' },
      { nr: 4400, name: 'Grundleitungen (auf dem Grundstück)' },
      { nr: 4400, name: 'Kanalanschluß' },
      { nr: 4500, name: 'Elektroinstallation' },
      { nr: 4500, name: 'E-Mobilität TG' },
      { nr: 4600, name: 'Aufzug' },
      { nr: 4800, name: 'Lüftung / Klima' },
      { nr: 4900, name: 'Bes. Einrichtungen' },
      { nr: 4900, name: 'Brandmeldeanlage' },
      { nr: 5401, name: 'Solar und PV-Anlagen' },
      { nr: 6100, name: 'Fertigtreppen' },
      { nr: 6200, name: 'Natur- und Betonwerksteinarbeiten' },
      { nr: 6300, name: 'Fliesen (Wand+Boden)' },
      { nr: 6400, name: 'Estricharbeiten' },
      { nr: 6401, name: 'Oberbodenarbeiten' },
      { nr: 6500, name: 'Schlosserarbeiten innen/außen' },
      { nr: 6600, name: 'Stahlzargen (in 6700 enthalten)' },
      { nr: 6700, name: 'Schreinerarbeiten Türen' },
      { nr: 6700, name: 'Schreiner Abstellschränke, Keller' },
      { nr: 6800, name: 'Malerarbeiten' },
      { nr: 6801, name: 'Betonspachtelarbeiten' },
      { nr: 7179, name: 'Schließanlage' }
    ]
  },
  {
    id: 'abbruch',
    name: 'Abbruch- und Erschließung',
    hinweis: 'Was vor dem ersten Spatenstich passiert.',
    gewerke: [
      { nr: 100, name: 'Abbruch / Baureifmachung' },
      { nr: 100, name: 'Trennung Hausanschlüsse' }
    ]
  },
  {
    id: 'projektierung',
    name: 'Projektierung / Ingenieurleistungen',
    hinweis: 'Planung, Nachweise und baubegleitende Gutachten.',
    gewerke: [
      { nr: 5200, name: 'Statik Allgemein+Bewehrungspläne' },
      { nr: 5200, name: 'Prüfstatik Allgemein' },
      { nr: 5200, name: 'Wärmeschutznachweis' },
      { nr: 5200, name: 'Schallschutznachweis' },
      { nr: 5300, name: 'Baugenehmigung' },
      { nr: 5400, name: 'Bodengutachter' },
      { nr: 5400, name: 'Vermesser' },
      { nr: 5500, name: 'Entwässerungsgesuch' },
      { nr: 5500, name: 'Planung Haustechnik' },
      { nr: 5500, name: 'Elektroplanung' },
      { nr: 5500, name: 'Schallschutzgutachten' },
      { nr: 5500, name: 'SiGeKo' },
      { nr: 5500, name: 'Brandschutzsachverständiger' },
      { nr: 5500, name: 'Gutachter Tiefgaragenentlüftung' },
      { nr: 5500, name: 'Beweissicherung Nachbargebäude' },
      { nr: 5500, name: 'Lüftungsgutachten Wohnungen' },
      { nr: 5500, name: 'Schadstoffgutachten' },
      { nr: 5500, name: 'sonstige baubegleitende Gutachter' }
    ]
  },
  {
    id: 'hausanschluesse',
    name: 'Hausanschlüsse',
    hinweis: 'Anschlüsse an die Versorgungsnetze.',
    gewerke: [
      { nr: 9100, name: 'Hausanschluß Gas' },
      { nr: 9100, name: 'Hausanschluß Wasser' },
      { nr: 9100, name: 'Hausanschluß Strom' },
      { nr: 9100, name: 'Hausanschluß Telekom' },
      { nr: 9100, name: 'Hausanschluß Kabelanschluß' }
    ]
  },
  {
    id: 'aussen',
    name: 'Aussenanlagen',
    hinweis: 'Was nach der Schlüsselübergabe sichtbar bleibt.',
    gewerke: [
      { nr: 9200, name: 'Müllboxen' },
      { nr: 9200, name: 'Gehweg anteilig' },
      { nr: 9200, name: 'Außenanlagen' },
      { nr: 9200, name: 'Außenanlagen Bepflanzung' }
    ]
  },
  {
    id: 'sonstiges',
    name: 'Sonstiges',
    hinweis: 'Baustelleneinrichtung und Dienstleistungen rund um das Bauvorhaben.',
    gewerke: [
      { nr: 7900, name: 'Sonstiges Reinigung' },
      { nr: 7900, name: 'Sonstiges Bautoilette (über Rohbau)' },
      { nr: 7900, name: 'Sonstiges Kernbohrungen' },
      { nr: 7900, name: 'Sonstiges Container' },
      { nr: 7900, name: 'Sonstiges Baustellenabsperrung' },
      { nr: 7900, name: 'Sonstiges Anmietung öffentlicher Flächen' },
      { nr: 7900, name: 'Sonstiges Bauzaun (über Baustellenabsperrung)' },
      { nr: 7900, name: 'Sonstiges Bauwasser' },
      { nr: 7900, name: 'Sonstiges Baustrom' },
      { nr: 7900, name: 'Sonstiges Makler' },
      { nr: 7900, name: 'Sonstiges Finanzdienstleister' },
      { nr: 7900, name: 'Sonstiges' }
    ]
  }
];

/** Alle Gewerkenamen — dagegen prüft der Server. */
export const ALLE_GEWERKE = GEWERKE_GRUPPEN.flatMap((g) => g.gewerke.map((w) => w.name));

/** Gewerkename -> Kostenstelle. Für die Excel-Spalte "KSt". */
export const GEWERK_NUMMER = new Map(
  GEWERKE_GRUPPEN.flatMap((g) => g.gewerke.map((w) => [w.name, w.nr]))
);

/* ==========================================================================
   ZWEI BEREICHE — die Trennlinie dieses Projekts

   BEWERBER   Alles, was der Auftragnehmer im Formular sieht und ausfüllt.
              Wird über /api/felder ausgeliefert und ist damit öffentlich.
   VERWALTUNG Alles, was nur die GWB sieht: Bewertung, Status, Absagegründe,
              Bearbeiter-Kürzel. Verlässt den Server nie, steht ausschließlich
              in der Excel-Datei.

   Wer hier eine Liste einsortiert, entscheidet damit, ob ein Bewerber sie zu
   sehen bekommt. Im Zweifel: VERWALTUNG.
   ========================================================================== */

/** Auswahlmenüs im Formular. Öffentlich — jeder Besucher kann sie abrufen. */
export const LISTEN_BEWERBER = {
  art: [
    'Nachunternehmer (Ausführung)',
    'Lieferant (Material)',
    'Nachunternehmer und Lieferant',
    'Planung / Dienstleistung'
  ],
  /* Wird nicht gefragt, sondern aus der eingetippten Mitarbeiterzahl abgeleitet
     (siehe groessenklasseZu). Steht als Menü in der Excel-Datei, damit sich
     danach filtern lässt. */
  groessenklasse: ['1–4', '5–9', '10–19', '20–49', '50–99', '100 und mehr'],
  kolonnen: [
    'ausschließlich eigene Mitarbeiter',
    'überwiegend eigene, teils Nachunternehmer',
    'überwiegend Nachunternehmer',
    'reiner Handel / Lieferung'
  ],
  einsatzradius: [
    'bis 25 km um Kaarst',
    'bis 50 km (Großraum Düsseldorf)',
    'bis 100 km (NRW)',
    'bundesweit'
  ],
  kapazitaet: [
    'sofort frei',
    'frei innerhalb von 4 Wochen',
    'frei im laufenden Quartal',
    'erst im nächsten Jahr',
    'nach Absprache je Projekt'
  ],
  auftragsgroesse: [
    'bis 25.000 €',
    '25.000 – 100.000 €',
    '100.000 – 250.000 €',
    '250.000 – 500.000 €',
    'über 500.000 €'
  ],
  erfahrungWohnungsbau: [
    'ja, regelmäßig für Bauträger',
    'ja, vereinzelt',
    'nein, anderer Schwerpunkt'
  ],
  nachweise: [
    'Präqualifikation (PQ-VOB)',
    'Eintrag Handwerksrolle / Meisterbetrieb',
    'Freistellungsbescheinigung § 48b EStG',
    'Unbedenklichkeitsbescheinigung Finanzamt',
    'Unbedenklichkeitsbescheinigung Sozialversicherung',
    'Unbedenklichkeitsbescheinigung Berufsgenossenschaft',
    'Betriebshaftpflicht ab 3 Mio. €',
    'Erklärung Mindestlohn (MiLoG)',
    'ISO 9001',
    'SCC / SCP',
    'Fachbetrieb nach WHG'
  ],
  woherKennenSieUns: [
    'Bauschild / Baustelle gesehen',
    'bereits für die GWB gearbeitet',
    'Empfehlung eines Kollegen',
    'Empfehlung durch Architekt / Planer',
    'Google-Suche',
    'Website der GWB',
    'Ausschreibungsportal',
    'Innung / Kammer / Verband',
    'Messe',
    'Presse / Lokalzeitung',
    'Instagram / Facebook',
    'sonstiges'
  ],
  anlass: [
    'allgemeine Aufnahme in den Bieterkreis',
    'Bezug auf ein konkretes Objekt',
    'Bezug auf eine laufende Ausschreibung',
    'Nachfrage zu einer früheren Anfrage'
  ],
};

/**
 * Auswahlmenüs, die nur in der Excel-Datei vorkommen.
 *
 * Diese Listen werden NICHT über /api/felder ausgeliefert. Ein Bewerber soll
 * weder unsere Absagegründe noch die Kürzel der Bearbeiter zu sehen bekommen.
 */
export const LISTEN_VERWALTUNG = {
  status: [
    'neu',
    'Unterlagen angefordert',
    'Gespräch vereinbart',
    'im Bieterkreis',
    'beauftragt',
    'abgelehnt',
    'zurückgestellt'
  ],
  absagegrund: [
    'Gewerk bereits ausreichend besetzt',
    'Preis nicht wettbewerbsfähig',
    'keine Kapazität zum benötigten Termin',
    'Nachweise unvollständig',
    'Einsatzgebiet passt nicht',
    'Referenzen nicht passend',
    'keine Rückmeldung mehr',
    'unbekannt'
  ],
  /* Kürzel der Bearbeiter — bitte einmal gegen die Wirklichkeit prüfen. */
  bearbeiter: ['Am.', 'AS.', 'BU', 'GWB']
};

/** Beide Bereiche zusammen — nur die Excel-Datei braucht das. */
export const LISTEN = { ...LISTEN_BEWERBER, ...LISTEN_VERWALTUNG };

/**
 * Excel-Spalten in der Reihenfolge, in der sie im Blatt stehen.
 *
 *   bereich  'bewerber'   — kommt aus dem Formular, wird beim Eingang geschrieben
 *            'verwaltung' — pflegt die GWB von Hand, bleibt bei jedem Eingang stehen
 *   key      Feldname aus dem Formular (bei 'verwaltung' immer null)
 *   header   Spaltenüberschrift
 *   breite   Spaltenbreite
 *   liste    Name der Auswahlliste für das Menü in Excel
 *   typ      'datum' | 'text' | 'zahl'
 *
 * Die Kopfzeile färbt sich nach 'bereich': blau für den Bewerber, grau für die
 * Verwaltung. Wer eine Spalte hinzufügt, muss sich also entscheiden.
 */
export const SPALTEN = [
  { bereich: 'bewerber', key: '_lfdNr', header: 'lfd.\nNr', breite: 6, typ: 'zahl' },
  { bereich: 'bewerber', key: '_eingang', header: 'Eingang\nAnfrage', breite: 12, typ: 'datum' },
  { bereich: 'bewerber', key: 'art', header: 'Art', breite: 22, liste: 'art' },
  { bereich: 'bewerber', key: 'firma', header: 'Firma', breite: 30 },
  { bereich: 'bewerber', key: 'ansprechpartner', header: 'Ansprech-\npartner', breite: 22 },
  { bereich: 'bewerber', key: 'funktion', header: 'Funktion', breite: 18 },
  { bereich: 'bewerber', key: 'strasse', header: 'Straße', breite: 24 },
  { bereich: 'bewerber', key: 'plz', header: 'PLZ', breite: 8 },
  { bereich: 'bewerber', key: 'ort', header: 'Ort', breite: 18 },
  { bereich: 'bewerber', key: 'telefon', header: 'Telefon', breite: 18 },
  { bereich: 'bewerber', key: 'mobil', header: 'Mobil', breite: 18 },
  { bereich: 'bewerber', key: 'email', header: 'E-Mail', breite: 28 },
  { bereich: 'bewerber', key: 'website', header: 'Website', breite: 24 },
  { bereich: 'bewerber', key: 'gruendungsjahr', header: 'seit', breite: 7, typ: 'zahl' },
  { bereich: 'bewerber', key: 'mitarbeiter', header: 'Mitarbeiter', breite: 11, typ: 'zahl' },
  { bereich: 'bewerber', key: 'groessenklasse', header: 'Größen-\nklasse', breite: 12, liste: 'groessenklasse' },
  { bereich: 'bewerber', key: 'hauptgewerkNr', header: 'KSt', breite: 7, typ: 'zahl' },
  { bereich: 'bewerber', key: 'hauptgewerk', header: 'Hauptgewerk', breite: 30 },
  { bereich: 'bewerber', key: 'gewerke', header: 'weitere Gewerke', breite: 40 },
  { bereich: 'bewerber', key: 'gewerkeGruppen', header: 'Bereiche', breite: 24 },
  { bereich: 'bewerber', key: 'leistung', header: 'Leistungsbeschreibung', breite: 45 },
  { bereich: 'bewerber', key: 'kolonnen', header: 'arbeitet mit', breite: 26, liste: 'kolonnen' },
  { bereich: 'bewerber', key: 'einsatzradius', header: 'Einsatzgebiet', breite: 22, liste: 'einsatzradius' },
  { bereich: 'bewerber', key: 'kapazitaet', header: 'freie Kapazität', breite: 22, liste: 'kapazitaet' },
  { bereich: 'bewerber', key: 'verfuegbarAb', header: 'verfügbar\nab', breite: 12, typ: 'datum' },
  { bereich: 'bewerber', key: 'auftragsgroesse', header: 'Auftragsgröße', breite: 20, liste: 'auftragsgroesse' },
  { bereich: 'bewerber', key: 'erfahrungWohnungsbau', header: 'Erfahrung\nWohnungsbau', breite: 24, liste: 'erfahrungWohnungsbau' },
  { bereich: 'bewerber', key: 'referenzen', header: 'Referenzen', breite: 40 },
  { bereich: 'bewerber', key: 'nachweise', header: 'Nachweise', breite: 40 },
  { bereich: 'bewerber', key: 'haftpflichtSumme', header: 'Haftpflicht\nDeckung', breite: 14 },
  { bereich: 'bewerber', key: 'anlass', header: 'Anlass', breite: 26, liste: 'anlass' },
  { bereich: 'bewerber', key: 'objekt', header: 'Objekt', breite: 12 },
  { bereich: 'bewerber', key: 'woherKennenSieUns', header: 'Woher kennen\nSie uns?', breite: 24, liste: 'woherKennenSieUns' },
  { bereich: 'bewerber', key: 'nachricht', header: 'Nachricht des Absenders', breite: 45 },
  { bereich: 'bewerber', key: '_anlagen', header: 'Anlagen', breite: 30 },
  { bereich: 'bewerber', key: '_einwilligung', header: 'Einwilligung\nam', breite: 12, typ: 'datum' },
  /* --- Ab hier: Verwaltung. Kein Bewerber sieht diese Spalten je. ------- */
  { bereich: 'verwaltung', key: null, header: 'Stand der Dinge', breite: 45 },
  { bereich: 'verwaltung', key: null, header: 'Status', breite: 20, liste: 'status' },
  { bereich: 'verwaltung', key: null, header: 'Unterlagen\nangefordert am', breite: 14, typ: 'datum' },
  { bereich: 'verwaltung', key: null, header: 'durch', breite: 8, liste: 'bearbeiter' },
  { bereich: 'verwaltung', key: null, header: 'Gespräch\nam', breite: 12, typ: 'datum' },
  { bereich: 'verwaltung', key: null, header: 'durch', breite: 8, liste: 'bearbeiter' },
  { bereich: 'verwaltung', key: null, header: 'in Bieterkreis\nam', breite: 14, typ: 'datum' },
  { bereich: 'verwaltung', key: null, header: 'durch', breite: 8, liste: 'bearbeiter' },
  { bereich: 'verwaltung', key: null, header: 'letzter\nKontakt am', breite: 12, typ: 'datum' },
  { bereich: 'verwaltung', key: null, header: 'Absagegrund', breite: 30, liste: 'absagegrund' }
];

/**
 * Ordnet eine Mitarbeiterzahl der Größenklasse zu.
 *
 * Der Bewerber tippt eine Zahl — die ist genauer und schneller getippt als ein
 * Menü ausgeklappt. Die Klasse leiten wir daraus ab, damit sich die Liste
 * trotzdem gruppiert auswerten lässt.
 */
export function groessenklasseZu(anzahl) {
  if (!Number.isFinite(anzahl) || anzahl < 1) return null;
  if (anzahl < 5) return '1–4';
  if (anzahl < 10) return '5–9';
  if (anzahl < 20) return '10–19';
  if (anzahl < 50) return '20–49';
  if (anzahl < 100) return '50–99';
  return '100 und mehr';
}

/** Felder, ohne die eine Anfrage nicht bearbeitbar ist. */
export const PFLICHTFELDER = [
  'art',
  'firma',
  'ansprechpartner',
  'email',
  'telefon',
  'plz',
  'ort',
  'hauptgewerk',
  'einsatzradius'
];

/** Obergrenzen für Freitext — schützt die Excel-Zellen vor Romanen. */
export const MAX_LAENGE = {
  firma: 120,
  ansprechpartner: 80,
  funktion: 80,
  strasse: 120,
  plz: 10,
  ort: 80,
  telefon: 40,
  mobil: 40,
  email: 120,
  website: 160,
  leistung: 1500,
  referenzen: 1500,
  nachricht: 2000,
  haftpflichtSumme: 40,
  objekt: 40,
  gruendungsjahr: 4
};
