# GWB Partneranfrage

Landing Page, über die Nachunternehmer und Lieferanten ihre Anfrage an die
**GWB Gewerbe- und Wohnungsbau GmbH** stellen. Jede abgeschickte Anfrage landet
automatisch als neue Zeile in einer Excel-Liste — niemand tippt etwas ab.

```
Formular  →  Prüfung  →  data/anfragen.jsonl  →  Excel-Liste  →  (optional) E-Mail
```

---

## Schnellstart

```bash
npm install
npm start          # http://localhost:3000
```

Beim ersten Absenden legt der Server `data/GWB_Nachunternehmerliste.xlsx` an.
Ohne `.env` läuft alles mit den Voreinstellungen; E-Mails werden dann nicht
verschickt, die Anfragen landen trotzdem vollständig in der Excel-Datei.

Für den Betrieb: `cp .env.example .env` und ausfüllen.

---

## Zwei Bereiche: Bewerber und Verwaltung

Die Seite ist **ausschließlich** dafür da, dass ein Auftragnehmer sich bewirbt
und seine Angaben macht. Alles, was mit der Bewertung dieser Bewerbung zu tun
hat, ist Verwaltungssache und für den Bewerber unsichtbar.

| | **Bewerber** | **Verwaltung** |
| --- | --- | --- |
| Wo | Landing Page, `/api/felder`, `/api/anfrage` | Excel-Datei, `data/`, `/api/nachtragen` |
| Wer | jeder Besucher | nur die GWB |
| Inhalt | Firma, Kontakt, Gewerke, Kapazität, Nachweise, Nachricht | Stand der Dinge, Status, Termine, Absagegrund, Bearbeiter-Kürzel |
| Im Code | `LISTEN_BEWERBER`, `SPALTEN` mit `bereich: 'bewerber'` | `LISTEN_VERWALTUNG`, `SPALTEN` mit `bereich: 'verwaltung'` |

### Was der Bewerber sieht

Die Landing Page und die 34 Spalten, die aus seinem eigenen Formular stammen.
`/api/felder` liefert nur `LISTEN_BEWERBER` — diese Antwort kann jeder im
Browser mitlesen, deshalb steht dort nichts Internes.

### Was nur die Verwaltung sieht

Die zehn grauen Spalten in der Excel-Datei — **Stand der Dinge**, Status, die
Termin-Daten (Unterlagen angefordert / Gespräch / in Bieterkreis), letzter
Kontakt, Absagegrund — samt ihrer Auswahlmenüs. Sie verlassen den Server nie:

- Sie stehen nicht in `/api/felder`.
- Sie stehen nicht in `/api/status` (dort steht öffentlich nur `{"ok": true}`;
  Einzelheiten gibt es mit dem Wartungsschlüssel).
- Sie lassen sich nicht von außen setzen. Wer eine Anfrage von Hand baut und
  `status=beauftragt` mitschickt, kommt damit nicht durch: `pruefung.js` prüft
  nur gegen `LISTEN_BEWERBER`, alles andere fällt weg.
- Sie stehen nicht in der Benachrichtigungsmail.
- Sie werden bei einem neuen Eingang nicht überschrieben.

Die Grenze ist an einer Stelle im Code definiert. Wer in `server/felder.js` eine
Spalte hinzufügt, muss `bereich` setzen — und entscheidet damit, ob ein Bewerber
sie zu sehen bekommt. **Im Zweifel: `'verwaltung'`.**

In der Excel-Datei ist dieselbe Grenze an der Kopffarbe zu erkennen: blau kommt
vom Bewerber, grau gehört der GWB.

---

## Die Excel-Datei

Die Arbeitsmappe hat drei Blätter:

| Blatt | Inhalt |
| --- | --- |
| **So funktioniert es** | Kurzanleitung für den Empfang: welche Spalten wem gehören, was bei Problemen zu tun ist. |
| **Anfragen** | Die Liste. Eine Zeile je Anfrage. |
| **Listen** | Die Auswahlmenüs. Wer hier einen Eintrag ergänzt, ergänzt ihn im Menü der Liste mit. |

### Zwei Sorten Spalten

Blau kommt vom Bewerber, grau pflegt die GWB — siehe oben. **Die grauen Spalten
überlebt jeder neue Eingang**, weil der Server nur Zeilen anhängt und die Datei
nicht neu baut.

Die Konventionen der Interessentenliste gelten unverändert weiter: das Datum
steht in der Datumsspalte statt im Satz, „Stand der Dinge“ bleibt Freitext, und
alles Auswertbare kommt aus einem Menü.

### Warum eine eigene Datei und nicht die Interessentenliste?

Die Interessentenliste erfasst Kaufinteressenten — andere Fragen, andere
Auswertung. Nachunternehmer dort einzumischen, würde beide Listen unbrauchbar
machen. Soll die Liste woanders liegen (Netzlaufwerk, Sharepoint-Ordner), setzt
man in `.env`:

```
EXCEL_DATEI=/mnt/gwb/Listen/GWB_Nachunternehmerliste.xlsx
```

### Wenn die Datei gerade geöffnet ist

Windows sperrt geöffnete Dateien. Der Server merkt das und lässt die Anfrage
nicht fallen: sie steht in `data/anfragen.jsonl` und wird beim nächsten Eingang
nachgetragen. Sofort nachtragen geht auch:

```bash
curl -X POST http://localhost:3000/api/nachtragen \
     -H "X-Wartungs-Schluessel: $WARTUNGS_SCHLUESSEL"
```

(Der Endpunkt ist nur erreichbar, wenn `WARTUNGS_SCHLUESSEL` in `.env` gesetzt ist.)

### Notfall: Datei kaputt oder verloren

`data/anfragen.jsonl` ist die eigentliche Wahrheit — eine Zeile je Anfrage, im
Original, wird nie überschrieben. Daraus baut sich die Arbeitsmappe neu:

```bash
npm run excel:rebuild
```

Die von Hand gepflegten Spalten werden über eine verborgene Id aus der alten
Datei übernommen, die alte Datei bleibt als `.bak` liegen.

---

## Fragen im Formular

Fünf Schritte, rund vier Minuten. Pflicht sind nur neun Felder — der Rest hilft
bei der Einordnung, blockiert aber niemanden.

1. **Unternehmen** — Art der Zusammenarbeit, Firma, Ansprechpartner, Kontakt,
   Sitz, Größe.
2. **Gewerke** — 69 Gewerke in sieben Bereichen, mit Suche und Mehrfachauswahl.
   Das Hauptgewerk wird aus der Auswahl gefüllt.
3. **Kapazität** — Einsatzgebiet, eigene Kolonnen oder Sub, freie Kapazität,
   verfügbar ab, Auftragsgröße, Erfahrung im Wohnungsbau, Referenzen.
4. **Nachweise** — PQ-VOB, Freistellungsbescheinigung, Unbedenklichkeits­-
   bescheinigungen, Haftpflicht, ISO/SCC. Dazu Anlagen (max. 5 × 10 MB).
5. **Abschluss** — Anlass, Objektbezug, *„Woher kennen Sie uns?“*, Nachricht,
   Einwilligung.

Die Frage „Woher kennen Sie uns?“ ist bewusst aus der Interessentenliste
übernommen: sie misst die *erste Berührung*, nicht den Weg dieser Anfrage.

### Gewerke oder Auswahlmenüs ändern

Alles steht in **`server/felder.js`** — und nur dort. Formular, Prüfung, das
Blatt „Listen“ und die Excel-Spalten ziehen aus derselben Datei. Nach einer
Änderung:

```bash
npm run excel:rebuild   # überträgt neue Spalten in die bestehende Datei
```

---

## Aufbau

```
public/          Landing Page (kein Build-Schritt, keine externen CDNs)
  index.html
  styles.css     Farben ganz oben unter --gwb-*
  app.js         Schritte, Gewerkeauswahl, Prüfung im Browser
server/
  server.js      Express, POST /api/anfrage
  felder.js      Gewerke, Auswahllisten, Excel-Spalten — die einzige Quelle
  pruefung.js    Prüfung auf dem Server
  excel.js       Anhängen, Neuaufbau, Warteschlange
  mail.js        Benachrichtigung + Eingangsbestätigung (optional)
  rebuild-excel.js
data/            Excel-Liste, anfragen.jsonl, Anlagen (nicht im Repository)
```

### Schnittstellen

| Route | Bereich | Zweck |
| --- | --- | --- |
| `GET /api/felder` | Bewerber | Gewerke und die Auswahlmenüs des Formulars |
| `POST /api/anfrage` | Bewerber | Anfrage entgegennehmen (multipart, mit Anlagen) |
| `GET /api/status` | beide | öffentlich nur `{"ok": true}`; mit Wartungsschlüssel die Einzelheiten |
| `POST /api/nachtragen` | Verwaltung | Liegengebliebene Anfragen nachtragen (Wartungsschlüssel) |

Mehr gibt es nicht. Es existiert keine Route, über die sich der Inhalt der Liste
abrufen ließe — wer die Anfragen sehen will, öffnet die Excel-Datei.

---

## Was geprüft wird

- **Auswahlfelder** müssen aus der Liste in `felder.js` stammen. Ein frei
  erfundener Wert wird abgewiesen, nicht durchgereicht — sonst fällt die Zeile
  aus jeder Auswertung.
- **Freitext** wird gekürzt statt abgelehnt, damit niemand ein ausgefülltes
  Formular wegen zwei Zeichen zu viel verliert. Steuerzeichen fliegen raus.
- **Anlagen**: nur PDF, JPG, PNG, DOC, DOCX. Höchstens fünf, je 10 MB. Auf der
  Platte bekommen sie einen unverfänglichen Namen; der Originalname geht in die
  Excel-Spalte.
- **Bremse**: fünf Anfragen je Verbindung und zehn Minuten.
- **Honigtopf**: ein für Menschen unsichtbares Feld. Ist es gefüllt, war es ein
  Bot — die Anfrage wird verworfen, die Antwort bleibt freundlich.

Gleichzeitige Anfragen werden nacheinander in die Datei geschrieben (getestet
mit 25 parallelen Eingängen: 25 Zeilen, lückenlose lfd. Nummern).

---

## Vor dem Livegang

- [ ] Kontaktdaten im Fuß und in der Erfolgsmeldung gegen das Impressum prüfen
      (Telefon, E-Mail, Links zu Impressum und Datenschutz stehen aktuell als
      Platzhalter in `public/index.html`, markiert durch einen Kommentar über
      dem `<footer>`).
- [ ] Farben unter `--gwb-*` in `public/styles.css` gegen das Corporate Design
      abgleichen; das Logo im Kopf (`.marke__zeichen`) durch die echte Bilddatei
      ersetzen.
- [ ] Datenschutzerklärung um die Verarbeitung dieser Formulardaten ergänzen —
      der Einwilligungstext im Formular ersetzt sie nicht.
- [ ] `.env` anlegen: `MAIL_AN` auf das Postfach setzen, das die Anfragen sehen
      soll, `WARTUNGS_SCHLUESSEL` vergeben.
- [ ] Kürzel in `LISTEN.bearbeiter` (`felder.js`) einmal gegen die Wirklichkeit
      prüfen — sie stammen aus der Interessentenliste.
- [ ] Hinter einen Reverse Proxy mit TLS stellen und `PROXY_EBENEN` passend
      setzen, sonst greift die Bremse für alle Besucher gemeinsam.
- [ ] `data/` sichern — dort liegen Anfragen und Anlagen.
