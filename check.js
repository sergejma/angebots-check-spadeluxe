/* ============================================================
   Angebots-Check · Eckdaten des Angebots in die Beschreibung, Pflichtfeld Modell
   Ergänzt app.js und muss davor eingebunden sein: Beim Absenden schreibt dieses
   Skript Marke und Modell, Preis, Umfang, Zeitpunkt und Stellplatz als Text in das
   Feld „Description". Erst danach sendet app.js. Der Berater ruft an und bespricht
   den Check am Telefon, auf Wunsch folgt das Probesitzen in der Ausstellung.
   ============================================================ */

(() => {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const ohne = (params.get('ohne') || '').split(',');

  // ?ohne=header (nur für ganzseitige Bildschirmfotos): ohne die feste Kopfzeile.
  if (ohne.indexOf('header') !== -1) {
    const kopf = document.getElementById('site-header');
    if (kopf) kopf.remove();
  }
  // ?ohne=cookies (nur für Bildschirmfotos): zählt wie „Nur Notwendige".
  if (ohne.indexOf('cookies') !== -1) {
    try {
      if (!localStorage.getItem('cookie-consent')) localStorage.setItem('cookie-consent', 'essential');
    } catch (e) { /* privater Modus */ }
  }

  // ---------- Vorschau der Bestätigung ----------
  // ?vorschau=danke legt den Eintrag an, den app.js nach dem Absenden selbst schreibt; ?vorschau=formular setzt zurück.
  const vorschau = params.get('vorschau');
  if (vorschau === 'danke') {
    try { sessionStorage.setItem('spa_lead_angebots-check', JSON.stringify({ first: 'Anna', funnel: 'angebots-check', ort: 'Nürnberg (Fürth)' })); } catch (e) { /* privater Modus */ }
  } else if (vorschau === 'formular') {
    try { sessionStorage.removeItem('spa_lead_angebots-check'); } catch (e) { /* privater Modus */ }
  }

  // ---------- Chips: Mehrfachauswahl (Umfang) und Einfachauswahl (Zeitpunkt, Stellplatz) ----------
  function chipGruppe(selector, mehrfach) {
    const chips = document.querySelectorAll(selector + ' .chip');
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        if (mehrfach) {
          chip.setAttribute('aria-pressed', chip.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
        } else {
          chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
        }
      });
    });
    return () => Array.from(chips).filter((c) => c.getAttribute('aria-pressed') === 'true').map((c) => c.dataset.wert || c.textContent.trim());
  }
  const umfang = chipGruppe('[data-umfang]', true);
  const zeitpunkt = chipGruppe('[data-zeitpunkt]', false);
  const stellplatz = chipGruppe('[data-stellplatz]', false);

  // ---------- Pflichtfeld Modell ----------
  const form = document.getElementById('lead-form');
  const modell = document.getElementById('lead-modell');
  const modellFehler = document.getElementById('err-lead-modell');
  const preis = document.getElementById('lead-preis');
  const beschreibung = document.getElementById('lead-description');

  function modellOk() {
    const ok = !!(modell && modell.value.trim().length >= 2);
    if (modellFehler) modellFehler.textContent = ok ? '' : 'Bitte Marke oder Modell aus Ihrem Angebot eintragen.';
    if (modell) modell.classList.toggle('is-invalid', !ok);
    return ok;
  }
  if (modell) modell.addEventListener('input', () => { if (modell.value.trim().length >= 2) modellOk(); });

  if (form) {
    form.addEventListener('submit', (ev) => {
      if (!modellOk()) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        modell.focus();
        return;
      }
      const teile = ['Angebots-Check, Berater ruft an und bespricht den Vergleich am Telefon'];
      teile.push('Marke und Modell: ' + modell.value.trim());
      if (preis && preis.value.trim()) teile.push('Angebotspreis: ' + preis.value.trim());
      const u = umfang(); teile.push('Im Angebot enthalten: ' + (u.length ? u.join(', ') : 'keine Angabe'));
      const z = zeitpunkt(); if (z.length) teile.push('Zeitpunkt: ' + z[0]);
      const st = stellplatz(); if (st.length) teile.push('Stellplatz: ' + st[0]);
      if (beschreibung) beschreibung.value = teile.join(' · ').slice(0, 1900);
    }, true);
  }
})();
