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

/** Gewerke, gruppiert nach Bauabschnitt — die Einordnung, die die GWB braucht. */
export const GEWERKE_GRUPPEN = [
  {
    id: 'rohbau',
    name: 'Rohbau & Erdarbeiten',
    hinweis: 'Alles bis zum Rohbauabnahme-Termin.',
    gewerke: [
      'Abbruch & Entsorgung',
      'Erdarbeiten & Verbau',
      'Spezialtiefbau & Gründung',
      'Kanal- & Entwässerungsarbeiten',
      'Rohbau (Maurer- & Betonarbeiten)',
      'Beton-Fertigteile',
      'Bewehrung / Betonstahl',
      'Gerüstbau',
      'Kran- & Geräteverleih',
      'Baustelleneinrichtung & Container'
    ]
  },
  {
    id: 'huelle',
    name: 'Gebäudehülle',
    hinweis: 'Dach, Fassade, Fenster — der wetterdichte Abschluss.',
    gewerke: [
      'Zimmer- & Holzbauarbeiten',
      'Dachdecker- & Klempnerarbeiten',
      'Bauwerksabdichtung',
      'WDVS & Fassadenarbeiten',
      'Außenputz',
      'Fenster & Außentüren',
      'Sonnenschutz, Rollladen & Raffstore',
      'Metallbau, Schlosser & Geländer',
      'Balkon- & Terrassenbeläge'
    ]
  },
  {
    id: 'tga',
    name: 'Technische Gebäudeausrüstung',
    hinweis: 'Der Bereich mit den längsten Vorlaufzeiten.',
    gewerke: [
      'Heizung & Sanitär',
      'Wärmepumpe & Geothermie',
      'Lüftungstechnik',
      'Elektroinstallation',
      'Photovoltaik & Speicher',
      'E-Ladeinfrastruktur',
      'Aufzugsanlagen',
      'Blitzschutz',
      'Brandmelde- & Sicherheitstechnik',
      'Mess-, Steuer- & Regeltechnik',
      'Messdienst & Heizkostenverteilung'
    ]
  },
  {
    id: 'ausbau',
    name: 'Innenausbau',
    hinweis: 'Vom Estrich bis zur Schließanlage.',
    gewerke: [
      'Estricharbeiten',
      'Trockenbau',
      'Innenputz',
      'Fliesen- & Natursteinarbeiten',
      'Bodenbeläge & Parkett',
      'Maler- & Lackierarbeiten',
      'Innentüren',
      'Tischler & Einbaumöbel',
      'Treppenbau',
      'Schließanlagen & Briefkastenanlagen',
      'Baureinigung'
    ]
  },
  {
    id: 'aussen',
    name: 'Außenanlagen',
    hinweis: 'Was nach der Schlüsselübergabe sichtbar bleibt.',
    gewerke: [
      'Garten- & Landschaftsbau',
      'Pflaster- & Straßenbau',
      'Zäune, Tore & Einfriedungen',
      'Tiefgaragenausstattung & Markierung',
      'Spielplatz- & Außenmöblierung',
      'Winterdienst & Grünpflege'
    ]
  },
  {
    id: 'planung',
    name: 'Planung & Bauleitung',
    hinweis: 'Freiberufliche Leistungen und Fachplanung.',
    gewerke: [
      'Architektur & Objektüberwachung',
      'Tragwerksplanung',
      'TGA-Fachplanung',
      'Bauphysik & Schallschutz',
      'Energieberatung & GEG-Nachweis',
      'Brandschutzplanung & Prüfsachverständige',
      'Vermessung',
      'Baugrundgutachten',
      'SiGeKo',
      'Bauleitung & Poliere (Personalgestellung)'
    ]
  },
  {
    id: 'material',
    name: 'Material & Lieferung',
    hinweis: 'Für Lieferanten ohne eigene Montageleistung.',
    gewerke: [
      'Transportbeton',
      'Mauerwerk & Baustoffe',
      'Betonstahl & Stahlhandel',
      'Dämmstoffe',
      'Fenster & Türen (Herstellung)',
      'Sanitärobjekte & Armaturen',
      'Fliesen & Naturstein (Handel)',
      'Bodenbeläge (Handel)',
      'Küchen',
      'Aufzüge (Herstellung)',
      'Photovoltaik-Komponenten',
      'Gerüst- & Schalungsmaterial'
    ]
  }
];

export const ALLE_GEWERKE = GEWERKE_GRUPPEN.flatMap((g) => g.gewerke);

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
  mitarbeiter: [
    '1–4',
    '5–9',
    '10–19',
    '20–49',
    '50–99',
    '100 und mehr'
  ],
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
  { bereich: 'bewerber', key: 'mitarbeiter', header: 'Mitarbeiter', breite: 12, liste: 'mitarbeiter' },
  { bereich: 'bewerber', key: 'hauptgewerk', header: 'Hauptgewerk', breite: 28 },
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
