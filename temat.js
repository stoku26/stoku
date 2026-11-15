/* v310: temat e ngjyrave (pronari: "10 per dark mode 10 per white mode ... te cilesimet > pamja"), për telefonin (index.html)
 * dhe kompjuterin (pc.html). Zgjedhja ruhet vetëm në këtë pajisje: localStorage "stoku:ngjyrat" = {"e": 1..10, "c": 1..10}.
 * <html data-ngj-e="N" data-ngj-c="N"> (pa atribut = tema 1); ngjyrat te css/stoku-temat.css. fillimi-tel.js / fillimi-pc.js
 * i vendosin atributet para vizatimit të parë (pa kërcim ngjyrash).
 * Cilësimet → Pamja: "Ngjyrat" si rresht që hapet e mbyllet; te "E errët" vetëm 10 të errëtat, te "E çelët" vetëm 10 të çelëtat,
 * te "Automatike" dy rreshta (e errëta dhe e çelëta), secili hapet veç e veç.
 * Lista e ngjyrave (midis TEMAT-FILLIMI dhe TEMAT-FUNDI) është E GJENERUAR nga teste/temat-gjenero.py: mos e ndrysho me dorë. */
(function (root) {
  'use strict';
  /* TEMAT-FILLIMI */
  var DATA = {
    erreta: [
      { n: 1, emri: 'Mesnata', bg: '#0f1115', surface: '#171a20', line: '#2a2e36', ink: '#eceef2', accent: '#2f6fd8' },
      { n: 2, emri: 'Grafit', bg: '#111112', surface: '#1c1c1e', line: '#323236', ink: '#f2f2f4', accent: '#0a6cdc' },
      { n: 3, emri: 'Oqeani', bg: '#0a1220', surface: '#101b2e', line: '#22324d', ink: '#e9f1fb', accent: '#0e7490' },
      { n: 4, emri: 'Smeraldi', bg: '#0b1513', surface: '#11201c', line: '#22392f', ink: '#eaf5f0', accent: '#0b7a66' },
      { n: 5, emri: 'Ametisti', bg: '#120f1a', surface: '#1b1727', line: '#322b45', ink: '#f1eef8', accent: '#7c4ddb' },
      { n: 6, emri: 'Mokë', bg: '#14110e', surface: '#1e1915', line: '#362e26', ink: '#f4efe9', accent: '#2b6cb0' },
      { n: 7, emri: 'Indigo', bg: '#0e0f1c', surface: '#161830', line: '#2b2f55', ink: '#eef0fb', accent: '#5850ec' },
      { n: 8, emri: 'E zezë (OLED)', bg: '#000000', surface: '#0f0f11', line: '#26262b', ink: '#f5f5f7', accent: '#2563eb' },
      { n: 9, emri: 'Akull', bg: '#0f172a', surface: '#1e293b', line: '#334155', ink: '#f1f5f9', accent: '#0369a1' },
      { n: 10, emri: 'Trëndafili', bg: '#150f14', surface: '#20161e', line: '#3a2a37', ink: '#f8eef4', accent: '#be185d' }
    ],
    celeta: [
      { n: 1, emri: 'Letër', bg: '#f6f5f2', surface: '#ffffff', line: '#e6e4df', ink: '#14161b', accent: '#1f5fc4' },
      { n: 2, emri: 'Borë', bg: '#f4f6f9', surface: '#ffffff', line: '#e1e6ed', ink: '#0f172a', accent: '#2563eb' },
      { n: 3, emri: 'Qielli', bg: '#eef6fc', surface: '#ffffff', line: '#d3e5f3', ink: '#0b2239', accent: '#0369a1' },
      { n: 4, emri: 'Mente', bg: '#f0f7f3', surface: '#ffffff', line: '#d4e7dc', ink: '#0f241b', accent: '#0b7a66' },
      { n: 5, emri: 'Livando', bg: '#f6f3fc', surface: '#ffffff', line: '#e2d9f3', ink: '#1b1430', accent: '#6d28d9' },
      { n: 6, emri: 'Rërë', bg: '#f7f2ea', surface: '#fffdf9', line: '#e5dacb', ink: '#231c14', accent: '#0f766e' },
      { n: 7, emri: 'Indigo', bg: '#f3f4fb', surface: '#ffffff', line: '#dcdff2', ink: '#141631', accent: '#4f46e5' },
      { n: 8, emri: 'Kontrast i lartë', bg: '#ffffff', surface: '#ffffff', line: '#c9cdd3', ink: '#000000', accent: '#0047ab' },
      { n: 9, emri: 'Shkëmb', bg: '#f1f5f9', surface: '#ffffff', line: '#dbe2ea', ink: '#0f172a', accent: '#1e293b' },
      { n: 10, emri: 'Trëndafili', bg: '#fbf3f6', surface: '#ffffff', line: '#eed6e0', ink: '#2a1320', accent: '#be185d' }
    ]
  };
  /* TEMAT-FUNDI */
  var KEY = 'stoku:ngjyrat';

  function nr(v) { v = parseInt(v, 10); return v >= 1 && v <= 10 ? v : 1; }
  function lexo() {
    var o = null;
    try { o = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { /* ok */ }
    return { e: nr(o && o.e), c: nr(o && o.c) };
  }
  function ruaj(z) {
    try {
      if (z.e === 1 && z.c === 1) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, JSON.stringify({ e: z.e, c: z.c }));
    } catch (e) { /* ok */ }
  }
  // Vendos atributet te <html> sipas zgjedhjes
  function zbato() {
    var z = lexo(), r = document.documentElement;
    if (z.e > 1) r.setAttribute('data-ngj-e', String(z.e)); else r.removeAttribute('data-ngj-e');
    if (z.c > 1) r.setAttribute('data-ngj-c', String(z.c)); else r.removeAttribute('data-ngj-c');
    return z;
  }
  // Ngjyra e sfondit të temës së zgjedhur (shiriti i telefonit / meta theme-color)
  function sfondi(tema) {
    var z = lexo();
    return tema === 'dark' ? DATA.erreta[z.e - 1].bg : DATA.celeta[z.c - 1].bg;
  }

  var SHIGJETA = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"></path></svg>';
  var hapur = { e: false, c: false }; // vetëm sa është faqja e hapur

  function el(tag, klasa) { var x = document.createElement(tag); if (klasa) x.className = klasa; return x; }
  function miniatura(t, klasa) {
    var m = el('span', klasa);
    m.style.background = t.bg; m.style.borderColor = t.line;
    var a = el('i', 'tm-a'), b = el('i', 'tm-b'), c = el('i', 'tm-c');
    a.style.background = t.ink; b.style.background = t.surface; b.style.borderColor = t.line; c.style.background = t.accent;
    m.appendChild(a); m.appendChild(b); m.appendChild(c);
    return m;
  }
  function grupi(k, titulli, kurNdryshon) {
    var lista = k === 'e' ? DATA.erreta : DATA.celeta, z = lexo(), aktivi = z[k];
    var g = el('div', 'tm-grupi'); g.setAttribute('data-k', k);
    var krye = el('button', 'tm-krye'); krye.type = 'button'; krye.setAttribute('aria-expanded', hapur[k] ? 'true' : 'false');
    krye.appendChild(miniatura(lista[aktivi - 1], 'tm-mini tm-mini--krye'));
    var tk = el('span', 'tm-krye-tekst'), b = el('b'), s = el('span');
    b.textContent = titulli; s.textContent = aktivi + '. ' + lista[aktivi - 1].emri;
    tk.appendChild(b); tk.appendChild(s); krye.appendChild(tk);
    var sh = el('span', 'tm-shigjeta'); sh.innerHTML = SHIGJETA; krye.appendChild(sh);
    var rr = el('div', 'tm-rrjeta'); rr.hidden = !hapur[k];
    krye.addEventListener('click', function () {
      hapur[k] = !hapur[k];
      rr.hidden = !hapur[k];
      krye.setAttribute('aria-expanded', hapur[k] ? 'true' : 'false');
    });
    lista.forEach(function (t) {
      var kb = el('button', 'tm-karta'); kb.type = 'button';
      kb.setAttribute('aria-pressed', t.n === aktivi ? 'true' : 'false');
      kb.setAttribute('aria-label', t.n + '. ' + t.emri);
      kb.setAttribute('data-n', String(t.n));
      kb.appendChild(miniatura(t, 'tm-mini'));
      var e = el('span', 'tm-emri'); e.textContent = t.emri; kb.appendChild(e);
      kb.addEventListener('click', function () {
        var zz = lexo(); zz[k] = t.n; ruaj(zz); zbato();
        if (kurNdryshon) kurNdryshon();
      });
      rr.appendChild(kb);
    });
    g.appendChild(krye); g.appendChild(rr);
    return g;
  }
  // Vizaton rreshtat "Ngjyrat" brenda `vendi` sipas mënyrës ('auto' | 'light' | 'dark'); kurNdryshon thirret pasi zgjidhet një temë
  function vizato(vendi, menyra, kurNdryshon) {
    if (!vendi) return;
    var ri = function () { vizato(vendi, menyra, kurNdryshon); if (kurNdryshon) kurNdryshon(); };
    vendi.innerHTML = '';
    if (menyra !== 'light') vendi.appendChild(grupi('e', menyra === 'auto' ? 'Ngjyrat e temës së errët' : 'Ngjyrat', ri));
    if (menyra !== 'dark') vendi.appendChild(grupi('c', menyra === 'auto' ? 'Ngjyrat e temës së çelët' : 'Ngjyrat', ri));
  }
  // Teksti i shkurtër për rreshtin "Pamja" te menyja e Cilësimeve
  function emri(tema) {
    var z = lexo();
    return tema === 'dark' ? DATA.erreta[z.e - 1].emri : DATA.celeta[z.c - 1].emri;
  }

  root.StokuTemat = { erreta: DATA.erreta, celeta: DATA.celeta, KEY: KEY, lexo: lexo, ruaj: ruaj, zbato: zbato, sfondi: sfondi, vizato: vizato, emri: emri };
})(typeof window !== 'undefined' ? window : this);
