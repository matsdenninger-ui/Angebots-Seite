/**
 * Partnerseite der GWB — Formularlogik.
 *
 * Gewerke und Auswahlmenüs kommen aus /api/felder, damit Seite, Prüfung und
 * Excel-Blatt niemals auseinanderlaufen. Wer eine Auswahl ändern will, ändert
 * server/felder.js — hier steht nichts doppelt.
 */

(() => {
  'use strict';

  const $ = (auswahl, wurzel = document) => wurzel.querySelector(auswahl);
  const $$ = (auswahl, wurzel = document) => [...wurzel.querySelectorAll(auswahl)];

  const formular = $('#anfrageformular');
  const fehlerkasten = $('#fehlerkasten');
  const fehlerliste = $('#fehlerliste');
  const zurueckKnopf = $('#zurueck');
  const weiterKnopf = $('#weiter');
  const absendenKnopf = $('#absenden');
  const schrittstand = $('#schrittstand');
  const fortschritt = $('#fortschritt');
  const erfolgsmeldung = $('#erfolg');

  const schritte = $$('.schritt', formular);
  const LETZTER = schritte.length;
  let aktuell = 1;
  let felder = null;

  /* ====================================================================== */
  /*  Felder laden                                                          */
  /* ====================================================================== */

  async function felderLaden() {
    const antwort = await fetch('/api/felder');
    if (!antwort.ok) throw new Error(`Server antwortete mit ${antwort.status}`);
    return antwort.json();
  }

  function menuesFuellen() {
    for (const select of $$('select[data-liste]')) {
      const werte = felder.listen[select.dataset.liste] ?? [];
      const leer = new Option(
        select.required ? 'Bitte wählen' : 'keine Angabe',
        ''
      );
      leer.disabled = select.required;
      leer.selected = true;
      select.append(leer);
      for (const wert of werte) select.append(new Option(wert, wert));
    }
  }

  function artFuellen() {
    const behaelter = $('#artAuswahl');
    behaelter.innerHTML = '';
    felder.listen.art.forEach((wert, i) => {
      const label = document.createElement('label');
      const eingabe = document.createElement('input');
      eingabe.type = 'radio';
      eingabe.name = 'art';
      eingabe.value = wert;
      eingabe.required = true;
      eingabe.id = `art-${i}`;
      label.append(eingabe, document.createTextNode(wert));
      behaelter.append(label);
    });
  }

  function nachweiseFuellen() {
    const behaelter = $('#nachweiseAuswahl');
    behaelter.innerHTML = '';
    felder.listen.nachweise.forEach((wert, i) => {
      const label = document.createElement('label');
      const eingabe = document.createElement('input');
      eingabe.type = 'checkbox';
      eingabe.name = 'nachweise';
      eingabe.value = wert;
      eingabe.id = `nachweis-${i}`;
      label.append(eingabe, document.createTextNode(wert));
      behaelter.append(label);
    });
  }

  /* ====================================================================== */
  /*  Gewerke                                                               */
  /* ====================================================================== */

  function gewerkeschauBauen() {
    const schau = $('#gewerkeschau');
    schau.innerHTML = '';
    for (const gruppe of felder.gewerkeGruppen) {
      const karte = document.createElement('article');
      karte.className = 'gewerkeschau__gruppe';

      const titel = document.createElement('h3');
      titel.textContent = gruppe.name;

      const hinweis = document.createElement('p');
      hinweis.className = 'gewerkeschau__hinweis';
      hinweis.textContent = gruppe.hinweis;

      const liste = document.createElement('ul');
      liste.className = 'marken';
      for (const gewerk of gruppe.gewerke) {
        const eintrag = document.createElement('li');
        eintrag.textContent = gewerk;
        liste.append(eintrag);
      }

      karte.append(titel, hinweis, liste);
      schau.append(karte);
    }
  }

  function gewerkeauswahlBauen() {
    const behaelter = $('#gewerkeAuswahl');
    behaelter.innerHTML = '';

    felder.gewerkeGruppen.forEach((gruppe, index) => {
      const block = document.createElement('details');
      block.className = 'gewerkegruppe';
      block.dataset.gruppe = gruppe.id;
      /* Der erste Bereich steht offen, damit sofort sichtbar ist, worum es geht. */
      block.open = index === 0;

      const kopf = document.createElement('summary');
      const name = document.createElement('span');
      name.textContent = gruppe.name;
      const zaehler = document.createElement('span');
      zaehler.className = 'gewerkegruppe__zaehler';
      zaehler.hidden = true;
      kopf.append(name, zaehler);

      const liste = document.createElement('div');
      liste.className = 'gewerkegruppe__liste';

      for (const gewerk of gruppe.gewerke) {
        const label = document.createElement('label');
        label.dataset.suchtext = gewerk.toLowerCase();
        const eingabe = document.createElement('input');
        eingabe.type = 'checkbox';
        eingabe.name = 'gewerke';
        eingabe.value = gewerk;
        label.append(eingabe, document.createTextNode(gewerk));
        liste.append(label);
      }

      block.append(kopf, liste);
      behaelter.append(block);
    });

    behaelter.addEventListener('change', (ereignis) => {
      if (ereignis.target.name === 'gewerke') gewerkeAktualisieren();
    });
  }

  function gewaehlteGewerke() {
    return $$('input[name="gewerke"]:checked').map((e) => e.value);
  }

  /**
   * Hält Zähler, Hauptgewerk-Menü und Auswahlstand im Takt mit den Haken.
   * Das Hauptgewerk wird auf die gewählten Gewerke eingeschränkt — wer nichts
   * ankreuzt, bekommt die vollständige Liste, damit niemand feststeckt.
   */
  function gewerkeAktualisieren() {
    const gewaehlt = gewaehlteGewerke();

    for (const block of $$('.gewerkegruppe')) {
      const anzahl = $$('input:checked', block).length;
      const zaehler = $('.gewerkegruppe__zaehler', block);
      zaehler.textContent = String(anzahl);
      zaehler.hidden = anzahl === 0;
    }

    const stand = $('#auswahlstand');
    if (gewaehlt.length === 0) {
      stand.textContent =
        'Noch keine Gewerke gewählt. Ohne Auswahl steht Ihnen unten die vollständige Liste zur Verfügung.';
    } else {
      stand.textContent = `${gewaehlt.length} ${
        gewaehlt.length === 1 ? 'Gewerk' : 'Gewerke'
      } gewählt: ${gewaehlt.join(', ')}`;
    }

    const haupt = $('#hauptgewerk');
    const bisher = haupt.value;
    const quelle = gewaehlt.length ? gewaehlt : felder.gewerkeGruppen.flatMap((g) => g.gewerke);

    haupt.innerHTML = '';
    const leer = new Option('Bitte wählen', '');
    leer.disabled = true;
    haupt.append(leer);
    for (const gewerk of quelle) haupt.append(new Option(gewerk, gewerk));

    if (quelle.includes(bisher)) haupt.value = bisher;
    else if (quelle.length === 1) haupt.value = quelle[0];
    else haupt.value = '';
  }

  function sucheEinrichten() {
    const suche = $('#gewerkeSuche');
    suche.addEventListener('input', () => {
      const begriff = suche.value.trim().toLowerCase();

      $$('.gewerkegruppe').forEach((block, index) => {
        let sichtbar = 0;
        for (const label of $$('label', block)) {
          const passt = !begriff || label.dataset.suchtext.includes(begriff);
          label.hidden = !passt;
          if (passt) sichtbar += 1;
        }
        block.hidden = sichtbar === 0;

        if (begriff) {
          block.open = true;
        } else {
          /* Suche geleert: wieder einklappen — außer der Bereich enthält eine
             Auswahl, die will man sehen. */
          block.open = index === 0 || $$('input:checked', block).length > 0;
        }
      });
    });

    $('#auswahlLeeren').addEventListener('click', () => {
      for (const haken of $$('input[name="gewerke"]:checked')) haken.checked = false;
      gewerkeAktualisieren();
    });
  }

  /* ====================================================================== */
  /*  Zeichenzähler und Dateiliste                                          */
  /* ====================================================================== */

  function zaehlerEinrichten() {
    for (const anzeige of $$('.zaehler')) {
      const feld = document.getElementById(anzeige.dataset.fuer);
      if (!feld) continue;
      const max = Number(feld.getAttribute('maxlength'));
      const aktualisieren = () => {
        anzeige.textContent = feld.value.length ? `${feld.value.length} / ${max} Zeichen` : '';
      };
      feld.addEventListener('input', aktualisieren);
      aktualisieren();
    }
  }

  function dateilisteEinrichten() {
    const eingabe = $('#anlagen');
    const liste = $('#dateiliste');
    const MAX = 10 * 1024 * 1024;

    eingabe.addEventListener('change', () => {
      liste.innerHTML = '';
      for (const datei of eingabe.files) {
        const eintrag = document.createElement('li');
        const zuGross = datei.size > MAX;
        eintrag.dataset.zuGross = zuGross ? 'ja' : 'nein';
        const name = document.createElement('span');
        name.textContent = datei.name;
        const groesse = document.createElement('span');
        groesse.textContent = zuGross
          ? `${megabyte(datei.size)} — zu groß`
          : megabyte(datei.size);
        eintrag.append(name, groesse);
        liste.append(eintrag);
      }
    });
  }

  function megabyte(bytes) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  /* ====================================================================== */
  /*  Schrittsteuerung                                                      */
  /* ====================================================================== */

  const BESCHRIFTUNG = {
    art: 'Art der Zusammenarbeit',
    firma: 'Firma',
    ansprechpartner: 'Ansprechpartner',
    email: 'E-Mail',
    telefon: 'Telefon',
    plz: 'PLZ',
    ort: 'Ort',
    hauptgewerk: 'Hauptgewerk',
    einsatzradius: 'Einsatzgebiet',
    einwilligung: 'Einverständnis'
  };

  /** Prüft nur den sichtbaren Schritt. Gibt die Fehlermeldungen zurück. */
  function schrittPruefen(nummer) {
    const abschnitt = schritte[nummer - 1];
    const meldungen = [];
    const pflicht = $$('[required]', abschnitt);
    const erledigt = new Set();

    for (const feld of pflicht) {
      /* Radiogruppen nur einmal prüfen. */
      if (feld.type === 'radio') {
        if (erledigt.has(feld.name)) continue;
        erledigt.add(feld.name);
        const gewaehlt = $$(`input[name="${feld.name}"]:checked`, abschnitt).length > 0;
        markieren($$(`input[name="${feld.name}"]`, abschnitt), gewaehlt);
        if (!gewaehlt) meldungen.push(`${BESCHRIFTUNG[feld.name] ?? feld.name}: bitte auswählen.`);
        continue;
      }

      const gefuellt =
        feld.type === 'checkbox' ? feld.checked : feld.value.trim().length > 0;
      let inOrdnung = gefuellt;
      let text = `${BESCHRIFTUNG[feld.name] ?? feld.name}: bitte ausfüllen.`;

      if (gefuellt && feld.type === 'email' && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(feld.value.trim())) {
        inOrdnung = false;
        text = 'E-Mail: Die Adresse sieht nicht wie eine E-Mail-Adresse aus.';
      }
      if (gefuellt && feld.id === 'plz' && !/^[0-9]{4,5}$/.test(feld.value.trim())) {
        inOrdnung = false;
        text = 'PLZ: Bitte vier- oder fünfstellig angeben.';
      }
      if (feld.id === 'einwilligung' && !feld.checked) {
        text = 'Bitte der Speicherung Ihrer Angaben zustimmen.';
      }

      markieren([feld], inOrdnung);
      if (!inOrdnung) meldungen.push(text);
    }

    return meldungen;
  }

  function markieren(elemente, inOrdnung) {
    for (const element of elemente) {
      if (inOrdnung) element.removeAttribute('aria-invalid');
      else element.setAttribute('aria-invalid', 'true');
    }
  }

  function fehlerZeigen(meldungen) {
    fehlerliste.innerHTML = '';
    if (meldungen.length === 0) {
      fehlerkasten.hidden = true;
      return;
    }
    for (const meldung of meldungen) {
      const eintrag = document.createElement('li');
      eintrag.textContent = meldung;
      fehlerliste.append(eintrag);
    }
    fehlerkasten.hidden = false;
    fehlerkasten.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function schrittZeigen(nummer) {
    aktuell = Math.min(Math.max(nummer, 1), LETZTER);

    schritte.forEach((abschnitt, i) => {
      abschnitt.hidden = i + 1 !== aktuell;
    });

    $$('li', fortschritt).forEach((eintrag, i) => {
      eintrag.classList.toggle('ist-aktiv', i + 1 === aktuell);
      eintrag.classList.toggle('ist-fertig', i + 1 < aktuell);
    });

    zurueckKnopf.hidden = aktuell === 1;
    weiterKnopf.hidden = aktuell === LETZTER;
    absendenKnopf.hidden = aktuell !== LETZTER;
    schrittstand.textContent = `Schritt ${aktuell} von ${LETZTER}`;

    if (aktuell === LETZTER) zusammenfassungBauen();

    const erstes = $('input:not([type="hidden"]), select, textarea', schritte[aktuell - 1]);
    erstes?.focus({ preventScroll: true });
  }

  /* ====================================================================== */
  /*  Zusammenfassung vor dem Absenden                                      */
  /* ====================================================================== */

  function zusammenfassungBauen() {
    const daten = new FormData(formular);
    const gewerke = gewaehlteGewerke();
    const anlagen = $('#anlagen').files;

    const zeilen = [
      ['Art', daten.get('art')],
      ['Firma', daten.get('firma')],
      ['Ansprechpartner', daten.get('ansprechpartner')],
      ['Kontakt', [daten.get('telefon'), daten.get('email')].filter(Boolean).join(' · ')],
      ['Sitz', [daten.get('plz'), daten.get('ort')].filter(Boolean).join(' ')],
      ['Hauptgewerk', daten.get('hauptgewerk')],
      ['weitere Gewerke', gewerke.filter((g) => g !== daten.get('hauptgewerk')).join(', ')],
      ['Einsatzgebiet', daten.get('einsatzradius')],
      ['freie Kapazität', daten.get('kapazitaet')],
      ['Nachweise', daten.getAll('nachweise').join(', ')],
      ['Anlagen', anlagen.length ? [...anlagen].map((d) => d.name).join(', ') : '']
    ].filter(([, wert]) => wert);

    const kasten = $('#zusammenfassung');
    kasten.innerHTML = '';

    const titel = document.createElement('p');
    titel.className = 'zusammenfassung__titel';
    titel.textContent = 'Das schicken Sie ab';

    const liste = document.createElement('dl');
    for (const [bezeichnung, wert] of zeilen) {
      const dt = document.createElement('dt');
      dt.textContent = bezeichnung;
      const dd = document.createElement('dd');
      dd.textContent = wert;
      liste.append(dt, dd);
    }

    kasten.append(titel, liste);
  }

  /* ====================================================================== */
  /*  Absenden                                                              */
  /* ====================================================================== */

  async function absenden(ereignis) {
    ereignis.preventDefault();

    /* Alle Schritte prüfen, nicht nur den letzten — sonst rutscht etwas durch,
       das per Tastatur übersprungen wurde. */
    const jeSchritt = schritte.map((_, i) => schrittPruefen(i + 1));
    const alle = jeSchritt.flat();

    if (alle.length) {
      /* Zum ersten Schritt springen, in dem etwas fehlt. */
      const erster = jeSchritt.findIndex((meldungen) => meldungen.length > 0);
      schrittZeigen(erster + 1);
      fehlerZeigen(alle);
      return;
    }

    fehlerZeigen([]);
    absendenKnopf.disabled = true;
    absendenKnopf.textContent = 'Wird gesendet …';

    try {
      const antwort = await fetch('/api/anfrage', {
        method: 'POST',
        body: new FormData(formular)
      });
      const ergebnis = await antwort.json().catch(() => ({}));

      if (!antwort.ok || !ergebnis.ok) {
        fehlerZeigen(
          ergebnis.fehler ?? [
            'Die Anfrage konnte nicht übermittelt werden. Bitte versuchen Sie es erneut oder rufen Sie uns an.'
          ]
        );
        return;
      }

      formular.hidden = true;
      $('.fortschritt').hidden = true;
      /* Die Einleitung erklärt das Ausfüllen — nach dem Absenden ist sie erledigt. */
      $('#formularEinleitung').hidden = true;
      erfolgsmeldung.hidden = false;
      erfolgsmeldung.scrollIntoView({ block: 'center', behavior: 'smooth' });
    } catch {
      fehlerZeigen([
        'Keine Verbindung zum Server. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.'
      ]);
    } finally {
      absendenKnopf.disabled = false;
      absendenKnopf.textContent = 'Anfrage absenden';
    }
  }

  /* ====================================================================== */
  /*  Start                                                                 */
  /* ====================================================================== */

  async function starten() {
    try {
      felder = await felderLaden();
    } catch (fehler) {
      $('#gewerkeschau').innerHTML =
        '<p class="platzhalter">Die Gewerkeliste konnte nicht geladen werden. Bitte laden Sie die Seite neu.</p>';
      fehlerZeigen([
        'Das Formular konnte nicht vollständig geladen werden. Bitte laden Sie die Seite neu oder rufen Sie uns an.'
      ]);
      console.error(fehler);
      return;
    }

    menuesFuellen();
    artFuellen();
    nachweiseFuellen();
    gewerkeschauBauen();
    gewerkeauswahlBauen();
    sucheEinrichten();
    gewerkeAktualisieren();
    zaehlerEinrichten();
    dateilisteEinrichten();

    weiterKnopf.addEventListener('click', () => {
      const meldungen = schrittPruefen(aktuell);
      fehlerZeigen(meldungen);
      if (meldungen.length === 0) schrittZeigen(aktuell + 1);
    });

    zurueckKnopf.addEventListener('click', () => {
      fehlerZeigen([]);
      schrittZeigen(aktuell - 1);
    });

    /* Enter in einem Textfeld soll weiterblättern, nicht absenden. */
    formular.addEventListener('keydown', (ereignis) => {
      if (ereignis.key !== 'Enter') return;
      const ziel = ereignis.target;
      if (ziel.tagName === 'TEXTAREA' || ziel.type === 'submit') return;
      ereignis.preventDefault();
      if (aktuell < LETZTER) weiterKnopf.click();
    });

    formular.addEventListener('submit', absenden);

    schrittZeigen(1);
  }

  starten();
})();
