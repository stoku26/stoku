// v238: u nxor nga pc.html (CSP pa 'unsafe-inline': faqet s'kanë më skripta të brendshme). Kur ndryshon, rrite ?v= te pc.html dhe sw.js.
  // v231: llogaria pa lejen "Stoku në kompjuter" (lejet.js, të ruajtura në këtë pajisje) hap versionin e telefonit,
  // pa asnjë mesazh (index.html e lexon të njëjtën leje dhe s'kthehet këtu)
  (function () {
    try {
      var lj = JSON.parse(localStorage.getItem('stoku:lejet:v1') || 'null');
      if (lj && lj.lejet && lj.lejet.pc === false) { window.__stokuPaPc = true; location.replace('./'); }
    } catch (e) { /* ok */ }
  })();
  // Adresa e pastër: shfaqet stoku.site/#/... në vend të stoku.site/pc.html#/...
  // (rifreskimi hap stoku.site/, që në kompjuter të kthen vetë këtu, në të njëjtën faqe)
  (function () {
    if (window.__stokuPaPc) return;
    try {
      var dosja = location.pathname.replace(/[^\/]*$/, '');
      if (location.pathname !== dosja || location.search) history.replaceState(history.state, '', dosja + location.hash);
    } catch (e) { /* ok */ }
  })();
  // Tema dhe ngjyra vendosen para vizatimit (pa dridhje ndriçimi)
  (function () {
    var o = null;
    try { o = JSON.parse(localStorage.getItem('stoku:pc:opsione:v1') || 'null'); } catch (e) {}
    var t = o && o.tema;
    if (t !== 'dark' && t !== 'light') {
      t = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-tema', t);
    if (o && (o.dendesia === 'kompakte' || o.dendesia === 'gjere')) document.documentElement.setAttribute('data-dendesia', o.dendesia);
    if (o && o.madhesia === 'e_madhe') document.documentElement.setAttribute('data-madhesi', 'e_madhe');
  })();
