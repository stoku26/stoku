/*
 * v319: shfletuesit e vjetër (Chrome < 84, p.sh. shfletuesi i TV-ve LG webOS dhe telefonat e vjetër) s'e njohin `gap` te flex-i:
 * ikona dhe teksti ngjiten (pronari: "tekstet afer ikonave jan shum"). Ky skedar vepron VETËM kur flex-gap mungon: çdo kontejneri
 * flex me gap i jep klasën `pg-r` (rresht) ose `pg-c` (kolonë) dhe ndryshoren --pg-r/--pg-c; CSS-ja (style më poshtë) e kthen
 * hapësirën me margin (pg-para / pg-pas te fëmijët). Në shfletuesit e rinj s'bën asgjë.
 */
(function () {
  'use strict';
  function kaFlexGap() {
    var d = document.createElement('div');
    d.style.cssText = 'display:flex;flex-direction:column;row-gap:1px;position:absolute;visibility:hidden;pointer-events:none';
    d.appendChild(document.createElement('div'));
    d.appendChild(document.createElement('div'));
    document.body.appendChild(d);
    var ok = d.scrollHeight === 1;
    document.body.removeChild(d);
    return ok;
  }
  function vlera(v) { return v && v !== 'normal' && v !== '0px' ? v : null; }
  // Elementët e flex-it (edhe teksti i lirë): elementi që ka diçka pas vetes merr "pg-pas" (hapësirë pas, që `margin-left: auto`
  // i tjetrit të punojë si më parë); vetëm elementi që vjen pas tekstit merr "pg-para", sepse tekstit s'i jepet margin.
  function shenjo(el) {
    var para = null, f = el.childNodes;
    for (var i = 0; i < f.length; i++) {
      var n = f[i];
      if (n.nodeType === 1) {
        var s = getComputedStyle(n);
        n.classList.remove('pg-para'); n.classList.remove('pg-pas');
        if (s.display === 'none' || s.position === 'absolute' || s.position === 'fixed') continue;
        if (para && para.nodeType === 1) para.classList.add('pg-pas');
        else if (para) n.classList.add('pg-para');
        para = n;
      } else if (n.nodeType === 3 && /\S/.test(n.nodeValue)) {
        if (para && para.nodeType === 1) para.classList.add('pg-pas');
        para = n;
      }
    }
  }
  function shiko(el) {
    if (el.nodeType !== 1) return;
    if (el.__pg) { shenjo(el); return; }
    var s = getComputedStyle(el);
    if (s.display !== 'flex' && s.display !== 'inline-flex') return;
    var kol = s.flexDirection.indexOf('column') === 0;
    var g = kol ? vlera(s.rowGap) : vlera(s.columnGap);
    var g2 = s.flexWrap !== 'nowrap' ? (kol ? vlera(s.columnGap) : vlera(s.rowGap)) : null;
    if (!g && !g2) return;
    el.__pg = 1;
    if (g) { el.style.setProperty('--pg', g); el.classList.add(kol ? 'pg-c' : 'pg-r'); }
    if (g2) { el.style.setProperty('--pg2', g2); el.classList.add(kol ? 'pg-cw' : 'pg-rw'); }
    shenjo(el);
  }
  function shikoNen(rr) {
    if (rr.nodeType !== 1) return;
    shiko(rr);
    var l = rr.getElementsByTagName('*');
    for (var i = 0; i < l.length; i++) shiko(l[i]);
  }
  function nis() {
    if (kaFlexGap() && !window.__stokuTestPaGap) return; // __stokuTestPaGap: vetëm për testet (teste/v319-tv.js)
    document.documentElement.classList.add('pa-flex-gap');
    var st = document.createElement('style');
    st.textContent =
      '.pg-r>.pg-para{margin-left:var(--pg)}.pg-r>.pg-pas{margin-right:var(--pg)}' +
      '.pg-c>.pg-para{margin-top:var(--pg)}.pg-c>.pg-pas{margin-bottom:var(--pg)}' +
      '.pg-rw>*{margin-bottom:var(--pg2)}' +
      '.pg-cw>*{margin-right:var(--pg2)}';
    document.head.appendChild(st);
    shikoNen(document.body);
    var radhe = [], pritet = false;
    function puno() { pritet = false; var r = radhe; radhe = []; for (var i = 0; i < r.length; i++) shikoNen(r[i]); }
    new MutationObserver(function (m) {
      for (var i = 0; i < m.length; i++) {
        if (m[i].type === 'attributes') { m[i].target.__pg = 0; radhe.push(m[i].target); }
        else if (m[i].target.__pg) radhe.push(m[i].target); // fëmijët e një kontejneri me gap ndryshuan
        for (var j = 0; j < m[i].addedNodes.length; j++) radhe.push(m[i].addedNodes[j]);
      }
      if (!pritet && radhe.length) { pritet = true; requestAnimationFrame(puno); }
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
    // elementet që bëhen flex vetëm pas një klikimi ose ndryshimi faqeje (klasë e re): kontroll i plotë pak më vonë
    var tPlote = 0;
    function plote() { clearTimeout(tPlote); tPlote = setTimeout(function () { shikoNen(document.body); }, 120); }
    document.addEventListener('click', plote, true);
    window.addEventListener('hashchange', plote);
    window.addEventListener('resize', plote);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', nis);
  else nis();
})();
