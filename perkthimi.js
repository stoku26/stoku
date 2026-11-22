/*
 * v355 (pronari: "A munesh gjuhen anglisht 100% me ja qit komplet web appit, jo ne kod po veq ne pamje ose ui edhe me majt men"):
 * gjuha e pamjes. Kodi mbetet shqip; kur zgjidhet "English" (Cilësimet → Pamja → Gjuha), çdo tekst që shfaqet (tekstet e faqes,
 * placeholder, title, aria-label, dritaret, njoftimet e vogla) përkthehet nga fjalori i përbashkët `perkthimi/en.json` (i njëjti
 * edhe për Android-in), i futur këtu nga `python3 teste/perkthimi-gjenero.py` te `perkthimi-en.js`.
 * - "fjalet": teksti i plotë shqip → anglisht (krahasohet pa hapësirat anash).
 * - "modelet": [shprehje e rregullt, anglisht] për tekstet me numra/emra: $1 = grupi siç është, @1 = grupi i përkthyer.
 * - Teksti me " · " ndahet në pjesë dhe secila përkthehet veç (p.sh. "testmorina · para 17 ditësh").
 * Të dhënat e përdoruesit (emrat e produkteve, grupeve, kolegëve) s'preken kur s'përputhen saktë me një tekst të Stoku-t; elementet me
 * `data-pa-perkthim` s'përkthehen fare. Ndërrimi i gjuhës e rihap faqen.
 */
(function (root) {
  'use strict';
  var KEY = 'stoku:gjuha';
  var gjuha = 'sq';
  try { gjuha = localStorage.getItem(KEY) === 'en' ? 'en' : 'sq'; } catch (e) { /* ok */ }
  var D = root.STOKU_FJALORI_EN || { fjalet: {}, modelet: [] };
  var FJ = D.fjalet || {};
  var MOD = (D.modelet || []).map(function (m) { try { return [new RegExp(m[0]), m[1]]; } catch (e) { return null; } }).filter(Boolean);

  function perktheBerthamen(t) {
    if (!t) return t;
    if (Object.prototype.hasOwnProperty.call(FJ, t)) return FJ[t];
    if (/\s\s|\n/.test(t)) { var nj = t.replace(/\s+/g, ' '); if (Object.prototype.hasOwnProperty.call(FJ, nj)) return FJ[nj]; }
    for (var i = 0; i < MOD.length; i++) {
      var m = MOD[i][0].exec(t);
      if (m) {
        return MOD[i][1].replace(/([$@])(\d)/g, function (_, s, n) {
          var g = m[+n]; if (g === undefined) return '';
          return s === '@' ? perkthe(g) : g;
        });
      }
    }
    return null;
  }
  // Teksti i plotë → anglisht (ose i njëjti kur s'njihet). Ruhen hapësirat anash.
  function perkthe(t) {
    if (gjuha !== 'en' || t == null) return t;
    var s = String(t);
    var m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s), mes = m[2];
    if (!mes) return s;
    var r = perktheBerthamen(mes);
    if (r == null && mes.indexOf(' · ') !== -1) {
      var pj = mes.split(' · '), ndr = false;
      pj = pj.map(function (p) { var x = perktheBerthamen(p); if (x != null) { ndr = true; return x; } return p; });
      if (ndr) r = pj.join(' · ');
    }
    if (r == null && mes.indexOf('\n') !== -1) {
      var rr = mes.split('\n'), nd2 = false;
      rr = rr.map(function (p) { var x = perktheBerthamen(p.trim()); if (x != null) { nd2 = true; return p.replace(p.trim(), x); } return p; });
      if (nd2) r = rr.join('\n');
    }
    return r == null ? s : m[1] + r + m[3];
  }

  var ATR = ['placeholder', 'title', 'aria-label', 'alt'];
  var PA = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, NOSCRIPT: 1, CODE: 1 };
  function iLejuar(el) {
    for (var e = el; e && e.nodeType === 1; e = e.parentNode) {
      if (PA[e.tagName] || e.hasAttribute('data-pa-perkthim') || e.isContentEditable) return false;
    }
    return true;
  }
  function tekst(n) {
    if (!n.parentNode || !iLejuar(n.parentNode)) return;
    var v = n.data, r = perkthe(v);
    if (r !== v) n.data = r;
  }
  function atribute(el) {
    if (!iLejuar(el)) return;
    for (var i = 0; i < ATR.length; i++) {
      var v = el.getAttribute(ATR[i]);
      if (v) { var r = perkthe(v); if (r !== v) el.setAttribute(ATR[i], r); }
    }
    if (el.tagName === 'INPUT' && (el.type === 'button' || el.type === 'submit') && el.value) {
      var rv = perkthe(el.value); if (rv !== el.value) el.value = rv;
    }
  }
  function nenPeme(n) {
    if (n.nodeType === 3) { tekst(n); return; }
    if (n.nodeType !== 1 && n.nodeType !== 9 && n.nodeType !== 11) return;
    if (n.nodeType === 1) { if (!iLejuar(n)) return; atribute(n); }
    var w = document.createTreeWalker(n, 5 /* ELEMENT | TEXT */, null), x;
    while ((x = w.nextNode())) { if (x.nodeType === 3) tekst(x); else atribute(x); }
  }

  if (gjuha === 'en' && root.document) {
    var doc = root.document;
    doc.documentElement.setAttribute('lang', 'en');
    new MutationObserver(function (l) {
      for (var i = 0; i < l.length; i++) {
        var m = l[i];
        if (m.type === 'childList') { for (var j = 0; j < m.addedNodes.length; j++) nenPeme(m.addedNodes[j]); }
        else if (m.type === 'characterData') tekst(m.target);
        else if (m.type === 'attributes') atribute(m.target);
      }
      if (doc.title) { var tt = perkthe(doc.title); if (tt !== doc.title) doc.title = tt; }
    }).observe(doc.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATR.concat(['value']) });
    if (doc.body) nenPeme(doc.body);
    doc.addEventListener('DOMContentLoaded', function () { nenPeme(doc.documentElement); });
  }

  root.StokuGjuha = {
    gjuha: function () { return gjuha; },
    eshteEn: function () { return gjuha === 'en'; },
    t: perkthe,
    // Ndërrimi: ruhet në këtë pajisje, faqja rihapet (tekstet vizatohen sërish në gjuhën e re)
    vendos: function (g) {
      g = g === 'en' ? 'en' : 'sq';
      try { localStorage.setItem(KEY, g); } catch (e) { /* ok */ }
      if (g !== gjuha && root.location) root.location.reload();
    }
  };
})(typeof window !== 'undefined' ? window : this);
