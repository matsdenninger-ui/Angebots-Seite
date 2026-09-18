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
   Sitz, Mitarbeiterzahl.
2. **Gewerke** — das Gewerkeverzeichnis der GWB: 88 Gewerke in sechs Bereichen,
   mit Suche und Mehrfachauswahl. Das Hauptgewerk wird aus der Auswahl gefüllt.
3. **Kapazität** — Einsatzgebiet, eigene Kolonnen oder Sub, freie Kapazität,
   verfügbar ab, Auftragsgröße, Erfahrung im Wohnungsbau, Referenzen.
4. **Nachweise** — PQ-VOB, Freistellungsbescheinigung, Unbedenklichkeits­-
   bescheinigungen, Haftpflicht, ISO/SCC. Dazu Anlagen (max. 5 × 10 MB).
5. **Abschluss** — Anlass, Objektbezug, *„Woher kennen Sie uns?“*, Nachricht,
   Einwilligung.

Die Frage „Woher kennen Sie uns?“ ist bewusst aus der Interessentenliste
übernommen: sie misst die *erste Berührung*, nicht den Weg dieser Anfrage.

### Die Kostenstelle

Jedes Gewerk trägt in `felder.js` seine Kostenstelle aus eurem Verzeichnis
(`{ nr: 6400, name: 'Estricharbeiten' }`). Sie steht **nicht** im Formular —
ein Bewerber kann mit eurer Kostenstellensystematik nichts anfangen, und
`/api/felder` liefert die Gewerke deshalb nur mit Namen aus. Beim Eingang hängt
der Server die Nummer des Hauptgewerks selbst an die Zeile: Spalte **KSt**.

Im Blatt „Listen" steht das Verzeichnis vollständig mit Bereich und Kostenstelle.

### Mitarbeiterzahl

Der Bewerber tippt eine Zahl. Die **Größenklasse** (1–4, 5–9, 10–19, 20–49,
50–99, 100 und mehr) leitet der Server daraus ab und schreibt sie in eine
eigene Spalte — so bleibt die Angabe genau und trotzdem gruppiert auswertbar.
Die Klassengrenzen stehen in `groessenklasseZu` in `server/felder.js`.

### Gewerke oder Auswahlmenüs ändern

Alles steht in **`server/felder.js`** — und nur dort. Formular, Prüfung, das
Blatt „Listen“ und die Excel-Spalten ziehen aus derselben Datei. Nach einer
Änderung:

```bash
npm run excel:rebuild   # überträgt neue Spalten in die bestehende Datei
```

---

## Einbau in die bestehende Website

Die Seite bringt ihren eigenen kleinen Server mit (Node). Sie ist **nicht** an
einen Pfad gebunden: Verweise und Serveraufrufe werden zur Laufzeit aus der
eigenen Adresse abgeleitet. Sie läuft deshalb unverändert auf eigener Domain,
unter einem Unterpfad und im iframe.

### Variante A — Unterpfad: `gwb-wohnungsbau.de/partner/`

Für den Besucher am unauffälligsten: gleiche Domain, gleiches Zertifikat, ein
Menüpunkt mehr. Der bestehende Webserver reicht den Pfad an die Partnerseite
durch, alles andere an der Website bleibt unberührt.

Fertige Vorlage: `betrieb/nginx-unterpfad.conf`. Danach im Menü der Hauptseite
auf `/partner/` verlinken — sinnvoll neben „Stellenangebote".

### Variante B — Eigene Adresse: `partner.gwb-wohnungsbau.de`

Wenn niemand an die Konfiguration der Hauptseite heran will oder soll. Braucht
einen DNS-Eintrag und ein eigenes Zertifikat, dafür sind beide Seiten technisch
voneinander unabhängig.

Vorlage: `betrieb/nginx-subdomain.conf`.

### Variante C — iframe im CMS

Wenn am Webserver gar nichts geändert werden kann: eine leere Seite im CMS
anlegen und einbetten.

```html
<iframe src="https://partner.gwb-wohnungsbau.de/"
        style="width:100%;height:1400px;border:0"
        title="Anfrage für Nachunternehmer und Lieferanten"></iframe>
```

Der schwächste Weg: feste Höhe, doppelte Kopfzeile, und Vor- und Zurück im
Browser verhalten sich merkwürdig. Nur, wenn A und B ausscheiden.

### Zuerst prüfen: Läuft Node auf eurem Hosting?

Das ist die Weiche, an der alles hängt. Klassische Webhosting-Pakete (IONOS,
Strato, All-Inkl im Standardtarif) können **PHP, aber kein Node** — dort lässt
sich dieser Dienst nicht betreiben.

So findet man es heraus:

| Frage | Wo nachsehen |
| --- | --- |
| Welcher Hoster? | Rückwärtsauflösung der Domain-IP, oder die Rechnung im Postfach |
| Webhosting oder eigener Server? | Beim Hoster einloggen → „Meine Produkte" / „Verträge". Steht dort *Webhosting* oder *Hosting-Paket*, ist es geteilt; *VPS*, *Cloud Server* oder *Dedicated* heißt eigener Server |
| Läuft PHP? | Eine Datei `test.php` mit `<?php phpinfo();` hochladen und aufrufen |
| Wer betreut die Seite? | Impressum der eigenen Website, dort steht oft „Realisierung: …" |

Ergibt die Prüfung „nur Webhosting", gibt es drei Wege: einen kleinen virtuellen
Server dazunehmen (ab etwa 5 € im Monat), die Serverseite auf PHP umbauen, oder
das Formular an Microsoft 365 anbinden.

### Der Dienst dahinter

Bei allen drei Varianten läuft im Hintergrund derselbe Node-Dienst.

```bash
sudo cp betrieb/gwb-partnerseite.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now gwb-partnerseite
```

Voraussetzungen: ein Linux-Server mit Node 20 oder neuer, erreichbar für den
Webserver. Ein kleiner virtueller Server genügt — die Seite hat keine Datenbank
und keinen nennenswerten Betrieb.

**Wichtig:** `PROXY_EBENEN` in der `.env` muss zur Zahl der vorgeschalteten
Proxys passen (bei nginx davor: `1`). Sonst sieht der Server bei allen
Besuchern dieselbe Adresse und die Bremse gegen Massenversand greift für alle
gemeinsam.

---

## Erscheinungsbild

Nachgebaut nach dem Auftritt der GWB unter gwb-wohnungsbau.de:

- **Grün als einzige Akzentfarbe**, sonst Weiß und Dunkelgrau. Kein zweiter
  Akzent.
- **Kopf** wie dort: Wortmarke links (großes grünes „GWB", grüner Strich,
  klein der Zusatz), Telefonnummer prominent rechts, darunter die Navigation
  rechtsbündig — der aktive Punkt grau hinterlegt.
- **Vollbreites Bild**, direkt darunter das **grüne Claim-Band**
  („über 30 Jahre Kompetenz im Wohnungsbau").
- **Abschnittstitel in grünen Versalien**, normale Strichstärke.
- **Flach**: keine abgerundeten Ecken, keine Schatten, schlichte Grotesk
  (Arial-Stack, keine Fremdschrift wird nachgeladen).

Zwei Dinge konnte ich nicht aus der Quelle übernehmen, weil die Domain aus der
Entwicklungsumgebung nicht erreichbar war — beide stehen in der Liste
„Vor dem Livegang": der exakte Grünwert und das Bühnenfoto.

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
- [ ] `--gwb-gruen` in `public/styles.css` gegen den echten Hausfarbwert
      prüfen. Der jetzige Wert `#7fb434` ist aus einem Bildschirmfoto der
      Hauptseite **geschätzt**, nicht aus deren CSS ausgelesen. Eine Zeile,
      der Rest der Seite zieht mit.
- [ ] Bühnenbild einsetzen: Foto nach `public/bild/` legen und in
      `public/styles.css` unter `.buehne` die Zeile `--buehne-bild` setzen.
      Solange sie fehlt, steht dort eine neutrale graue Fläche.
- [ ] Wortmarke: Der Kopf setzt „GWB" derzeit als Text (grün, grüner Strich,
      Zusatz darunter). Wenn es die Logodatei gibt, ersetzt sie `.marke`.
- [ ] Datenschutzerklärung um die Verarbeitung dieser Formulardaten ergänzen —
      der Einwilligungstext im Formular ersetzt sie nicht.
- [ ] `.env` anlegen: `MAIL_AN` auf das Postfach setzen, das die Anfragen sehen
      soll, `WARTUNGS_SCHLUESSEL` vergeben.
- [ ] Kürzel in `LISTEN.bearbeiter` (`felder.js`) einmal gegen die Wirklichkeit
      prüfen — sie stammen aus der Interessentenliste.
- [ ] Hinter einen Reverse Proxy mit TLS stellen und `PROXY_EBENEN` passend
      setzen, sonst greift die Bremse für alle Besucher gemeinsam.
- [ ] `data/` sichern — dort liegen Anfragen und Anlagen.
