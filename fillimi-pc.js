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
  // v310: ngjyrat e temës (Cilësimet → Pamja → Ngjyrat), para vizatimit; si temat.js zbato()
  (function () {
    var o = null;
    try { o = JSON.parse(localStorage.getItem('stoku:ngjyrat') || 'null'); } catch (e) {}
    var e = parseInt(o && o.e, 10), c = parseInt(o && o.c, 10);
    if (e >= 2 && e <= 10) document.documentElement.setAttribute('data-ngj-e', String(e));
    if (c >= 2 && c <= 10) document.documentElement.setAttribute('data-ngj-c', String(c));
  })();

// v238: emri i llogarisë së fundit poshtë logos, që në vizatimin e parë (si skripti i vjetër brenda HTML-së): elementi
// s'ekziston ende kur lexohet ky skedar, prandaj e vendos një MutationObserver sapo parseri ta krijojë
(function () {
  var emri = '';
  try { var h0 = JSON.parse(localStorage.getItem('stoku:porta:hyrja') || 'null'); emri = h0 && h0.emri ? String(h0.emri) : ''; } catch (e) { /* ok */ }
  if (!emri || typeof MutationObserver === 'undefined') return;
  function provo() { var el = document.getElementById('sbpBrandNen'); if (!el) return false; el.textContent = emri; return true; }
  var v = new MutationObserver(function () { if (provo()) v.disconnect(); });
  v.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', function () { provo(); v.disconnect(); });
})();

// v362 (pronari: "logoja e krejt ja nisin prap prej fillimi ... me bo njo kishe osht tu u mush ose loading"): pas rinisjes për versionin
// e ri, ekrani i përditësimit (logoja + rrethi, CSS te faqja) mbetet derisa faqja e re të jetë gati, pastaj zbehet.
(function () {
  var po = false;
  try { po = sessionStorage.getItem('stoku:perditesimi') === '1'; sessionStorage.removeItem('stoku:perditesimi'); } catch (e) { /* ok */ }
  if (!po) return;
  var h = document.documentElement, hequr = false;
  h.classList.add('stk-perditesim');
  function hiq() {
    if (hequr) return; hequr = true;
    h.classList.add('stk-perditesim-fund');
    setTimeout(function () { h.classList.remove('stk-perditesim', 'stk-perditesim-fund'); }, 400);
  }
  window.addEventListener('load', function () { setTimeout(hiq, 500); });
  setTimeout(hiq, 8000); // siguria: s'mbetet kurrë mbi faqe
})();
