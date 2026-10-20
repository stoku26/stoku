// v238: u nxor nga index.html dhe pc.html (CSP pa 'unsafe-inline': faqet s'kanë më skripta të brendshme). Kur ndryshon, rrite ?v= te index.html dhe pc.html dhe sw.js.
// Emri i llogarisë së fundit (para se të ngarkohet krejt aplikacioni), te elementi me id nga data-id
(function () {
  var s = document.currentScript;
  try { var h0 = JSON.parse(localStorage.getItem('stoku:porta:hyrja') || 'null'); var el = s && document.getElementById(s.getAttribute('data-id')); if (el && h0 && h0.emri) el.textContent = h0.emri; } catch (e) { /* ok */ }
})();
