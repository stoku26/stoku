/*
 * Stoku Beta (telefoni): pamja e re nga dizajni "Stoku Premium". S'ka logjikë të vetën: përdor elementet
 * dhe funksionet e index.html (të kopjuar nga beta/nderto.py) dhe vetëm shton/rirendit pamjen.
 * Grepat (thirren nga kodi i aplikacionit):
 *   StokuBeta.pasFolderave(cont)       pas çdo vizatimi të folderave (faqja kryesore)
 *   StokuBeta.kartaAfatit(k, a, st, n) për çdo kartë afati
 *   StokuBeta.gati()                   kur aplikacioni u ngarkua (StokuBetaAPI ekziston)
 */
(function () {
  'use strict';
  document.documentElement.classList.add('sb');

  var API = null;
  var PRAGU_PAK = 5; // "Sasi e ulët" = 1–5 copë (si parazgjedhja te kompjuteri)
  var NGJYRAT_FOLDERAVE = [
    ['#d9e4f7', '#5b86c9'], ['#d5eedc', '#4f9a6e'], ['#f6e3c4', '#c08a3e'], ['#f6d9d6', '#c46a5f'],
    ['#e6dcf3', '#8a6cc0'], ['#f3d8e0', '#b85f7c'], ['#dcebc9', '#6f9a45'], ['#f3dfcb', '#b27a45']
  ];
  var MUAJT = ['Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor', 'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'];
  var MUAJT_SHKURT = ['Jan', 'Shk', 'Mar', 'Pri', 'Maj', 'Qer', 'Kor', 'Gus', 'Sht', 'Tet', 'Nën', 'Dhj'];

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, tekst) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (tekst !== undefined && tekst !== null) e.textContent = tekst;
    return e;
  }
  function svg(d, madh) {
    var s = madh || 20;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
  }
  var IK = {
    kamera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle>',
    plus: '<path d="M12 5v14M5 12h14"></path>',
    shigjeta: '<path d="m6 9 6 6 6-6"></path>'
  };
  function numer(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function fillimiISotem() { var d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }
  function AF() { return window.StokuAfatet; }

  // ---------- Faqja kryesore: përmbledhja, folderat me ngjyrë, "Ndryshuar së fundi" ----------
  function pasFolderave(cont) {
    if (!API || !cont) return;
    var produktet = API.produktet();
    var foldera = API.foldera();
    var sot = fillimiISotem();
    var pak = 0, zero = 0, sotN = 0;
    produktet.forEach(function (p) {
      var s = Number(p.sasia) || 0;
      if (s <= 0) zero++; else if (s <= PRAGU_PAK) pak++;
      if ((p.prekurSe || 0) >= sot) sotN++;
    });

    var krye = el('div', 'sb-home-krye');
    var karta = el('div', 'sb-summary');
    var lart = el('div', 'sb-summary__top');
    var majtas = el('div');
    majtas.appendChild(el('div', 'sb-summary__label', 'Produkte gjithsej'));
    majtas.appendChild(el('div', 'sb-summary__value', numer(produktet.length)));
    lart.appendChild(majtas);
    if (sotN) lart.appendChild(el('span', 'sb-pill', sotN + ' ndryshuar sot'));
    karta.appendChild(lart);
    var stats = el('div', 'sb-stats');
    [[numer(foldera.length), 'Folderat', ''], [numer(pak), 'Sasi e ulët', ' sb-stat__value--near'], [numer(zero), 'Sasi 0', ' sb-stat__value--exp']].forEach(function (x) {
      var q = el('div', 'sb-stat');
      q.appendChild(el('span', 'sb-stat__value' + x[2], x[0]));
      q.appendChild(el('span', 'sb-stat__label', x[1]));
      stats.appendChild(q);
    });
    karta.appendChild(stats);
    krye.appendChild(karta);

    var koka = el('div', 'sb-section__head');
    koka.appendChild(el('h2', 'sb-section__title', 'Folderat'));
    var ri = el('button', 'sb-link', '+ Folder i ri');
    ri.type = 'button';
    ri.addEventListener('click', function () { var b = $('btnKrijoFolder'); if (b) b.click(); });
    koka.appendChild(ri);
    krye.appendChild(koka);
    cont.insertBefore(krye, cont.firstChild);

    // Katrori me ngjyrë te çdo folder (ngjyrat me radhë)
    Array.prototype.forEach.call(cont.querySelectorAll('.folder-karta'), function (k, i) {
      var c = NGJYRAT_FOLDERAVE[i % NGJYRAT_FOLDERAVE.length];
      var q = el('span', 'sb-folder__swatch');
      q.style.background = c[0];
      k.insertBefore(q, k.firstChild);
    });

    // Ndryshuar së fundi
    var tefundit = produktet.filter(function (p) { return p.prekurSe; })
      .sort(function (a, b) { return (b.prekurSe || 0) - (a.prekurSe || 0); }).slice(0, 5);
    if (tefundit.length) {
      var seks = el('div', 'sb-home-fund');
      var kk = el('div', 'sb-section__head');
      kk.appendChild(el('h2', 'sb-section__title', 'Ndryshuar së fundi'));
      seks.appendChild(kk);
      var lista = el('div', 'sb-list');
      tefundit.forEach(function (p) {
        var r = el('button', 'sb-row');
        r.type = 'button';
        var m = el('span', 'sb-row__main');
        var emri = el('span', 'sb-row__name', p.emri || 'Pa emër');
        if (!p.emri) emri.classList.add('sb-row__name--bosh');
        m.appendChild(emri);
        var fe = foldera.filter(function (f) { return f.id === p.kategoriaId; })[0];
        m.appendChild(el('span', 'sb-row__code', p.barkodi + (fe ? '  ·  ' + fe.emri : '')));
        r.appendChild(m);
        var s = Number(p.sasia) || 0;
        r.appendChild(el('span', 'sb-row__qty' + (s <= 0 ? ' sb-row__qty--exp' : s <= PRAGU_PAK ? ' sb-row__qty--near' : ''), numer(s)));
        r.addEventListener('click', function () { API.hapFolderin(p.kategoriaId); });
        lista.appendChild(r);
      });
      seks.appendChild(lista);
      cont.appendChild(seks);
    }
    perditesoDyqanin();
  }

  // Rreshti mbi titull: emri i përdoruesit (ose "Vetëm në këtë telefon")
  function perditesoDyqanin() {
    var d = $('sbDyqani');
    if (!d || !API) return;
    var u = null;
    try { u = API.perdoruesi(); } catch (e) { /* ok */ }
    d.textContent = u ? (API.emri() || 'Llogaria ime') + ' · Stoku Beta' : 'Vetëm në këtë telefon · Stoku Beta';
  }

  // ---------- Karta e afatit: kutia e ditëve majtas, "Furnizuesi · N copë · data" ----------
  function kartaAfatit(k, a, st, n) {
    var af = AF();
    var kutia = el('div', 'sb-days');
    var madh = '', vogel = '';
    if (st === 'hequr') { madh = '✓'; vogel = 'hequr'; kutia.classList.add('sb-days--rem'); }
    else if (n === null || n === undefined) { madh = '–'; vogel = 'pa datë'; kutia.classList.add('sb-days--exp'); }
    else if (n < 0) { madh = String(-n); vogel = -n === 1 ? 'ditë më parë' : 'ditë më parë'; kutia.classList.add('sb-days--exp'); }
    else if (n === 0) { madh = 'Sot'; vogel = 'skadon'; kutia.classList.add('sb-days--exp'); }
    else if (n >= 60) { madh = String(Math.round(n / 30)); vogel = 'muaj'; kutia.classList.add(st === 'afer' ? 'sb-days--near' : 'sb-days--ok'); }
    else { madh = String(n); vogel = n === 1 ? 'ditë' : 'ditë'; kutia.classList.add(st === 'afer' ? 'sb-days--near' : 'sb-days--ok'); }
    kutia.appendChild(el('span', 'sb-days__big', madh));
    kutia.appendChild(el('span', 'sb-days__small', vogel));
    var zgjedh = k.querySelector('.af-zgjedh');
    k.insertBefore(kutia, zgjedh ? zgjedh.nextSibling : k.firstChild);

    var nen = k.querySelector('.af-nen');
    var pjeset = [a.furnizuesi, af ? af.sasiaTekst(a) : '', a.data && af ? af.formato(a.data) : ''].filter(Boolean);
    if (!nen) {
      nen = el('div', 'af-nen');
      var emri = k.querySelector('.af-emri');
      if (emri) emri.parentNode.insertBefore(nen, emri.nextSibling);
    }
    nen.textContent = pjeset.join(' · ');
    if (a.emri && a.barkodi) {
      var kod = el('div', 'sb-af-kodi', a.barkodi);
      nen.parentNode.insertBefore(kod, nen.nextSibling);
    }
  }

  // ---------- Header-i: logo katrore + emri + "Stoku" ----------
  function ndertoKoken() {
    var h = document.querySelector('header');
    var logo = $('logoSlika');
    if (!h || !logo || $('sbBrand')) return;
    var b = el('div', 'sb-brand');
    b.id = 'sbBrand';
    var l = el('span', 'sb-logo');
    var img = el('img');
    img.src = '../icon-192.png'; img.alt = '';
    l.appendChild(img);
    b.appendChild(l);
    var t = el('div', 'sb-brand__tekst');
    var dy = el('span', 'sb-store');
    dy.id = 'sbDyqani';
    t.appendChild(dy);
    t.appendChild(el('span', 'sb-title', 'Stoku'));
    b.appendChild(t);
    logo.parentNode.insertBefore(b, logo.nextSibling);
    function sinkronizo() { b.style.display = logo.style.display === 'none' ? 'none' : ''; }
    new MutationObserver(sinkronizo).observe(logo, { attributes: true, attributeFilter: ['style'] });
    sinkronizo();
    perditesoDyqanin();
  }

  // ---------- Afatet: veprimet si në dizajn (Fotografo e madhe, Shto, Excel me menu) ----------
  function ndertoAfatet() {
    var foto = $('afFotografo'), shto = $('afShto'), gal = $('afGaleria'), imp = $('afImporto'), eks = $('afEksporto');
    if (!foto || !shto || !imp || !eks || $('sbAfVeprime')) return;
    var rreshti1 = foto.parentNode, rreshti2 = imp.parentNode;
    var v = el('div', 'sb-actions');
    v.id = 'sbAfVeprime';

    foto.className = 'sb-action-primary';
    foto.innerHTML = '<span class="sb-action-primary__ik">' + svg(IK.kamera, 22) + '</span>' +
      '<span><span class="sb-action-primary__title">Fotografo fletën</span>' +
      '<span class="sb-action-primary__sub">Afatet lexohen nga foto automatikisht</span></span>';
    var kutiaFoto = el('div', 'sb-action-primary-kuti');
    kutiaFoto.appendChild(foto);
    if (gal) { gal.className = 'sb-action-galeria'; gal.removeAttribute('style'); kutiaFoto.appendChild(gal); }
    v.appendChild(kutiaFoto);

    shto.className = 'sb-action';
    shto.removeAttribute('style');
    shto.innerHTML = svg(IK.plus, 18) + '<span>Shto</span>';
    v.appendChild(shto);

    var excelKuti = el('div', 'sb-excel');
    var excel = el('button', 'sb-action');
    excel.type = 'button';
    excel.setAttribute('aria-haspopup', 'true');
    excel.setAttribute('aria-expanded', 'false');
    excel.innerHTML = '<span class="sb-xls">XLS</span><span>Excel</span>' + svg(IK.shigjeta, 16);
    var menu = el('div', 'sb-menu');
    menu.hidden = true;
    imp.className = 'sb-menu__item'; eks.className = 'sb-menu__item';
    menu.appendChild(imp); menu.appendChild(eks);
    excel.addEventListener('click', function (ev) {
      ev.stopPropagation();
      menu.hidden = !menu.hidden;
      excel.setAttribute('aria-expanded', menu.hidden ? 'false' : 'true');
    });
    [imp, eks].forEach(function (b) { b.addEventListener('click', function () { menu.hidden = true; excel.setAttribute('aria-expanded', 'false'); }); });
    document.addEventListener('click', function (ev) { if (!menu.hidden && !excelKuti.contains(ev.target)) { menu.hidden = true; excel.setAttribute('aria-expanded', 'false'); } });
    excelKuti.appendChild(excel);
    excelKuti.appendChild(menu);
    v.appendChild(excelKuti);

    rreshti1.parentNode.insertBefore(v, rreshti1);
    rreshti1.hidden = true;
    rreshti2.hidden = true;

    var tit = $('afTitulli');
    if (tit) {
      tit.textContent = 'Afatet';
      var d = new Date();
      var muaji = el('span', 'sb-muaji', MUAJT[d.getMonth()] + ' ' + d.getFullYear());
      tit.parentNode.insertBefore(muaji, tit.nextSibling);
    }

    // Numrat te filtrat (Të gjitha 7, Të skaduara 2…)
    var lista = $('afLista');
    if (lista) new MutationObserver(numratEFiltrave).observe(lista, { childList: true });
    numratEFiltrave();
  }
  function numratEFiltrave() {
    var af = AF();
    if (!API || !af) return;
    var n = af.numero(API.afatet());
    var v = { aktive: n.aktive, skaduar: n.skaduar + n['pa-date'], afer: n.afer, ok: n.ok, hequr: n.hequr };
    Array.prototype.forEach.call(document.querySelectorAll('#afFiltrat button'), function (b) {
      var f = b.getAttribute('data-f');
      var c = b.querySelector('.sb-chip__count');
      if (!c) { c = el('span', 'sb-chip__count'); b.appendChild(c); }
      c.textContent = v[f] === undefined ? '' : String(v[f]);
    });
  }

  // ---------- Afat i ri: datat e shpejta ----------
  function ndertoDatatEShpejta() {
    var fusha = $('afatData');
    if (!fusha || $('sbDatat')) return;
    var mbajtesi = fusha.closest('.lx-dy') || fusha.parentNode;
    var kuti = el('div', 'sb-dates-kuti');
    kuti.id = 'sbDatat';
    kuti.appendChild(el('div', 'sb-field-label', 'Data e shpejtë'));
    var rr = el('div', 'sb-dates');
    var zgjedhjet = [['1 javë', 7, 0], ['2 javë', 14, 0], ['1 muaj', 0, 1], ['3 muaj', 0, 3]];
    var butonat = [];
    zgjedhjet.forEach(function (z) {
      var b = el('button', 'sb-date');
      b.type = 'button';
      b.setAttribute('aria-pressed', 'false');
      b.appendChild(el('span', 'sb-date__day'));
      b.appendChild(el('span', 'sb-date__mon'));
      b.appendChild(el('span', 'sb-date__sa', z[0]));
      b._data = function () {
        var d = new Date(); d.setHours(12, 0, 0, 0);
        if (z[1]) d.setDate(d.getDate() + z[1]);
        if (z[2]) d.setMonth(d.getMonth() + z[2]);
        return d;
      };
      b.addEventListener('click', function () {
        var d = b._data();
        var iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        var af = AF();
        fusha.value = af && af.formatoPerFushe ? af.formatoPerFushe(iso) : iso;
        fusha.dispatchEvent(new Event('input', { bubbles: true }));
        fusha.dispatchEvent(new Event('change', { bubbles: true }));
        shenoAktivin();
      });
      butonat.push(b);
      rr.appendChild(b);
    });
    function rifresko() {
      butonat.forEach(function (b) {
        var d = b._data();
        b.children[0].textContent = String(d.getDate()).padStart(2, '0');
        b.children[1].textContent = MUAJT_SHKURT[d.getMonth()];
      });
      shenoAktivin();
    }
    function shenoAktivin() {
      var af = AF();
      var iso = af && af.lexoDatenEFushes ? af.lexoDatenEFushes(fusha.value) : '';
      butonat.forEach(function (b) {
        var d = b._data();
        var i2 = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        b.setAttribute('aria-pressed', iso && iso === i2 ? 'true' : 'false');
      });
    }
    kuti.appendChild(rr);
    fusha.addEventListener('input', shenoAktivin);
    var dlg = $('dlgAfat');
    if (dlg) new MutationObserver(function () { if (dlg.classList.contains('hapur')) rifresko(); }).observe(dlg, { attributes: true, attributeFilter: ['class'] });
    mbajtesi.parentNode.insertBefore(kuti, mbajtesi);
    rifresko();
  }

  // Ngjyra e shiritit të shfletuesit: sfondi i betës (jo bluja e Stoku-t)
  function ngjyraEShiritit() {
    var m = $('metaTema');
    if (!m) return;
    function vendos() {
      var v = getComputedStyle(document.documentElement).getPropertyValue('--sb-bg').trim() || '#f6f5f2';
      if (m.getAttribute('content') !== v) m.setAttribute('content', v);
    }
    new MutationObserver(vendos).observe(m, { attributes: true, attributeFilter: ['content'] });
    new MutationObserver(vendos).observe(document.documentElement, { attributes: true, attributeFilter: ['data-tema'] });
    vendos();
  }

  function gati() {
    API = window.StokuBetaAPI;
    ndertoKoken();
    ndertoAfatet();
    ndertoDatatEShpejta();
    ngjyraEShiritit();
    var fl = $('folderaLista');
    if (fl && !fl.querySelector('.sb-home-krye')) pasFolderave(fl);
  }

  window.StokuBeta = { pasFolderave: pasFolderave, kartaAfatit: kartaAfatit, gati: gati };
})();
