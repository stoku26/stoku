/*
 * Marketet (v241): për ata që punojnë në disa markete brenda ditës (p.sh. merchandiserët). E përbashkët për telefonin
 * dhe PC-në. Pa asnjë market (si deri tash) s'ndryshon asgjë: afatet shihen krejt bashkë.
 *
 * Marketi: { id, emri, lat, lng, ndryshuarSe, p }   (lat/lng = vendndodhja e ruajtur me "Ruaj vendndodhjen këtu"; opsionale;
 *   p (v246) = id e pikës së përbashkët pikat/{p}, nga e cila merr emrin kur e ndryshon administratori)
 *   - Lista ruhet te dyqani i llogarisë (sinkronizohet si folderat, bashkimi.js), lokalisht te KEY_LISTA.
 *   - Afati e mban marketin te fusha `m` (id-ja). Te kopjet për kolegët dhe serverin shtohet `mk` (emri i marketit).
 * Marketi aktiv ("Je te: …") është i kësaj pajisjeje (KEY_AKTIV): { id | null, menyra: 'gps' | 'dore', koha }.
 *   - GPS-i kontrollohet kur hapet aplikacioni (jo më shpesh se KONTROLLI_MS) dhe vetëm kur të paktën një market ka
 *     vendndodhje: kush s'i përdor marketet s'pyetet kurrë për vendndodhjen.
 *   - Brenda RREZJA_M nga pika e ruajtur (plus pasaktësia e GPS-it, deri në 150 m) = je te ai market; më i afërti fiton.
 *   - Zgjedhja me dorë vlen DORE_MS para GPS-it (brenda qendrave tregtare GPS-i gabon). Jashtë krejt marketeve, pas një
 *     zgjedhjeje nga GPS-i, aktiv bëhet "Krejt marketet" (null).
 *   - Vendndodhja e personit s'ruhet dhe s'dërgohet askund: krahasohet vetëm në pajisje me pikat e marketeve.
 */
(function (root) {
  'use strict';

  var RREZJA_M = 250;
  var PASAKTESIA_MAKS_M = 150;
  var DORE_MS = 3 * 3600 * 1000;
  var KONTROLLI_MS = 2 * 60 * 1000;
  var KEY_LISTA = 'stoku:marketet:v1';
  var KEY_AKTIV = 'stoku:marketi:aktiv';
  var EMRI_MAKS = 60;

  function numer(x) { return typeof x === 'number' && isFinite(x); }
  function kaVend(m) { return !!m && numer(m.lat) && numer(m.lng) && Math.abs(m.lat) <= 90 && Math.abs(m.lng) <= 180; }

  // Lista e pastër (një rresht i dëmtuar nga cloud-i s'e rrëzon faqen): vetëm marketet me id dhe emër
  function pastro(l) {
    var pare = {};
    return (Array.isArray(l) ? l : []).filter(function (m) {
      if (!m || typeof m !== 'object' || typeof m.id !== 'string' || !m.id || pare[m.id]) return false;
      pare[m.id] = true;
      return true;
    }).map(function (m) {
      var x = { id: m.id, emri: String(m.emri == null ? '' : m.emri).trim().slice(0, EMRI_MAKS) || 'Market' };
      if (kaVend(m)) { x.lat = m.lat; x.lng = m.lng; }
      if (numer(m.ndryshuarSe)) x.ndryshuarSe = m.ndryshuarSe;
      if (typeof m.p === 'string' && m.p && m.p.length <= 40) x.p = m.p;
      return x;
    });
  }
  function idERe() { return 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function rendit(l) { return l.slice().sort(function (a, b) { return a.emri.localeCompare(b.emri, 'sq'); }); }
  function sipasId(l, id) { for (var i = 0; i < (l || []).length; i++) if (l[i].id === id) return l[i]; return null; }
  function emri(l, id) { var m = sipasId(l, id); return m ? m.emri : ''; }
  function emriINormalizuar(e) { return String(e || '').trim().toLowerCase().replace(/\s+/g, ' '); }
  function ekzistonEmri(l, e, pervecId) {
    var n = emriINormalizuar(e);
    return (l || []).some(function (m) { return m.id !== pervecId && emriINormalizuar(m.emri) === n; });
  }

  // Largësia në metra mes dy pikave (formula haversine)
  function largesia(a, b) {
    var R = 6371000, rad = Math.PI / 180;
    var dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  // Marketi ku je (më i afërti brenda rrezes), ose null. poz: { lat, lng, sakt (metra) }
  function gjej(l, poz) {
    if (!poz || !numer(poz.lat) || !numer(poz.lng)) return null;
    var kufiri = RREZJA_M + Math.min(numer(poz.sakt) ? Math.max(0, poz.sakt) : 0, PASAKTESIA_MAKS_M);
    var mi = null, dMin = Infinity;
    (l || []).forEach(function (m) {
      if (!kaVend(m)) return;
      var d = largesia(m, poz);
      if (d <= kufiri && d < dMin) { dMin = d; mi = m; }
    });
    return mi ? { marketi: mi, largesia: Math.round(dMin) } : null;
  }

  // ---------- v246: pikat e përbashkëta të Stoku-t (pikat/{id}) ----------
  // Pika: { id, emri, lat, lng, krijuarNga, krijuarNgaEmri, emriNgaAdmini }. Çdo market me vendndodhje bëhet pikë; një
  // merchandiser tjetër që arrin aty e gjen vetë ("Je te: X") pa e shtuar sërish. Emri i pikës (i administratorit) fiton.
  var LIDHJA_M = 60; // marketi i vjetër (pa pikë) lidhet me një pikë me të njëjtin emër brenda kësaj largësie
  function pastroPikat(l) {
    return (Array.isArray(l) ? l : []).filter(function (x) { return x && typeof x.id === 'string' && x.id && kaVend(x); }).map(function (x) {
      return { id: x.id, emri: String(x.emri == null ? '' : x.emri).trim().slice(0, EMRI_MAKS) || 'Market', lat: x.lat, lng: x.lng,
        krijuarNga: x.krijuarNga || '', krijuarNgaEmri: x.krijuarNgaEmri || '', emriNgaAdmini: x.emriNgaAdmini === true };
    });
  }
  // Pikat afër (deri në maksM metra), më e afërta e para: [{ pika, largesia }]
  function pikatAfer(pikat, poz, maksM, n) {
    if (!poz || !numer(poz.lat) || !numer(poz.lng)) return [];
    return pastroPikat(pikat).map(function (x) { return { pika: x, largesia: Math.round(largesia(x, poz)) }; })
      .filter(function (x) { return x.largesia <= maksM; })
      .sort(function (a, b) { return a.largesia - b.largesia; }).slice(0, n || 8);
  }
  // Marketi im i lidhur me pikën (ose null)
  function sipasPikes(l, pikaId) { for (var i = 0; i < (l || []).length; i++) if (l[i].p === pikaId) return l[i]; return null; }
  // Market i ri nga një pikë e përbashkët
  function ngaPika(pika, tani) {
    return { id: idERe(), emri: pika.emri, lat: pika.lat, lng: pika.lng, p: pika.id, ndryshuarSe: tani || Date.now() };
  }
  // Emrat nga pikat: marketi i lidhur merr emrin e pikës (kur e ndryshon administratori ose krijuesi). → { marketet, n }
  function emratNgaPikat(l, pikat, tani) {
    var h = {}, n = 0;
    pastroPikat(pikat).forEach(function (x) { h[x.id] = x; });
    var r = (l || []).map(function (m) {
      var x = m.p && h[m.p];
      if (!x || x.emri === m.emri) return m;
      n++;
      return Object.assign({}, m, { emri: x.emri, ndryshuarSe: tani || Date.now() });
    });
    return { marketet: r, n: n };
  }
  // Marketi i vjetër me vendndodhje por pa pikë: pika ekzistuese me të njëjtin emër, afër (ose null = krijo të re)
  function pikaPerMarketin(pikat, m) {
    if (!kaVend(m)) return null;
    var n = emriINormalizuar(m.emri), mi = null, dMin = Infinity;
    pastroPikat(pikat).forEach(function (x) {
      var d = largesia(x, m);
      if (d <= LIDHJA_M && emriINormalizuar(x.emri) === n && d < dMin) { dMin = d; mi = x; }
    });
    return mi;
  }
  // A mund ta ndryshojë uid-i emrin e kësaj pike (krijuesi, derisa s'e ka caktuar administratori)
  function mundTaRiemertoje(pika, uid) { return !!pika && !pika.emriNgaAdmini && pika.krijuarNga === uid; }

  // Afatet e një marketi (id null = krejt)
  function filtro(afatet, id) { return id ? (afatet || []).filter(function (a) { return a && a.m === id; }) : (afatet || []); }
  // Kopje e afateve me emrin e marketit (`mk`) për kolegët dhe serverin
  function meEmra(afatet, l) {
    if (!l || !l.length) return afatet || [];
    var h = {};
    l.forEach(function (m) { h[m.id] = m.emri; });
    return (afatet || []).map(function (a) { return a && a.m && h[a.m] ? Object.assign({}, a, { mk: h[a.m] }) : a; });
  }
  // Afatet që s'kanë market (ose marketi u fshi) → te `id` (kur krijohet marketi i parë). Kthen { afatet, n }
  function vendosPaMarket(afatet, l, id, tani) {
    var n = 0, ka = {};
    (l || []).forEach(function (m) { ka[m.id] = true; });
    var r = (afatet || []).map(function (a) {
      if (!a || (a.m && ka[a.m])) return a;
      n++;
      return Object.assign({}, a, { m: id, ndryshuarSe: tani || Date.now() });
    });
    return { afatet: r, n: n };
  }
  // Grupimi për pamjen e administratorit: [{ id, emri, afatet }] (marketet sipas emrit, "Pa market" në fund)
  function grupo(afatet, l) {
    var g = {}, rend = [];
    rendit(pastro(l)).forEach(function (m) { g[m.id] = { id: m.id, emri: m.emri, afatet: [] }; rend.push(m.id); });
    var pa = { id: '', emri: 'Pa market', afatet: [] };
    (afatet || []).forEach(function (a) { if (a) (a.m && g[a.m] ? g[a.m] : pa).afatet.push(a); });
    var rez = rend.map(function (id) { return g[id]; }).filter(function (x) { return x.afatet.length; });
    if (pa.afatet.length) rez.push(pa);
    return rez;
  }

  // ---------- Marketi aktiv i kësaj pajisjeje ----------
  function lexoAktivin() {
    try {
      var x = JSON.parse(localStorage.getItem(KEY_AKTIV) || 'null');
      if (x && (x.id === null || typeof x.id === 'string')) return { id: x.id, menyra: x.menyra === 'dore' ? 'dore' : 'gps', koha: Number(x.koha) || 0, kontrolluarSe: Number(x.kontrolluarSe) || 0 };
    } catch (e) { /* ok */ }
    return { id: null, menyra: 'gps', koha: 0, kontrolluarSe: 0 };
  }
  function ruajAktivin(a) { try { localStorage.setItem(KEY_AKTIV, JSON.stringify(a)); } catch (e) { /* ok */ } return a; }
  // Përgjigjja e GPS-it → aktivi i ri. gjetur: rezultati i gjej() ose null (jashtë krejt marketeve)
  function pasGps(aktivi, gjetur, tani) {
    tani = tani || Date.now();
    var a = Object.assign({}, aktivi, { kontrolluarSe: tani });
    if (a.menyra === 'dore' && tani - a.koha < DORE_MS) return a; // zgjedhja me dorë fiton për disa orë
    if (gjetur) return { id: gjetur.marketi.id, menyra: 'gps', koha: tani, kontrolluarSe: tani };
    return { id: null, menyra: 'gps', koha: tani, kontrolluarSe: tani };
  }
  function kaPika(l) { return (l || []).some(kaVend); }
  function duhetKontrolli(l, aktivi, tani) { return kaPika(l) && (tani || Date.now()) - ((aktivi && aktivi.kontrolluarSe) || 0) >= KONTROLLI_MS; }

  // Vendndodhja e tanishme: cb(null, { lat, lng, sakt }) ose cb('pa-gps' | 'leje' | 'kohe' | 'gabim')
  function pozita(cb, saktesiELarte) {
    var g = typeof navigator !== 'undefined' && navigator.geolocation;
    if (!g) { cb('pa-gps'); return; }
    var mbaroi = false;
    function nje(e, p) { if (mbaroi) return; mbaroi = true; cb(e, p); }
    try {
      g.getCurrentPosition(function (p) {
        nje(null, { lat: p.coords.latitude, lng: p.coords.longitude, sakt: p.coords.accuracy });
      }, function (e) {
        nje(e && e.code === 1 ? 'leje' : e && e.code === 3 ? 'kohe' : 'gabim');
      }, { enableHighAccuracy: saktesiELarte !== false, timeout: 15000, maximumAge: 0 }); // gjithmonë e freskët: një pikë e vjetër (p.sh. e marketit të kaluar) e ngatërron marketin
    } catch (e) { nje('gabim'); }
  }
  // Teksti për përdoruesin kur GPS-i s'punon
  function tekstiGabimit(e) {
    return e === 'leje' ? 'Stoku s\'ka leje për vendndodhjen. Lejoje te cilësimet e shfletuesit ose të aplikacionit, ose zgjidhe marketin me dorë.'
      : e === 'pa-gps' ? 'Kjo pajisje s\'e jep vendndodhjen. Zgjidhe marketin me dorë.'
      : e === 'kohe' ? 'Vendndodhja s\'u gjet me kohë (brenda ndërtesës GPS-i dobësohet). Provo sërish ose zgjidhe marketin me dorë.'
      : 'Vendndodhja s\'u gjet. Provo sërish ose zgjidhe marketin me dorë.';
  }

  var api = {
    RREZJA_M: RREZJA_M, DORE_MS: DORE_MS, KONTROLLI_MS: KONTROLLI_MS, KEY_LISTA: KEY_LISTA, KEY_AKTIV: KEY_AKTIV, EMRI_MAKS: EMRI_MAKS,
    pastro: pastro, idERe: idERe, rendit: rendit, sipasId: sipasId, emri: emri, ekzistonEmri: ekzistonEmri, kaVend: kaVend,
    largesia: largesia, gjej: gjej, filtro: filtro, meEmra: meEmra, vendosPaMarket: vendosPaMarket, grupo: grupo,
    lexoAktivin: lexoAktivin, ruajAktivin: ruajAktivin, pasGps: pasGps, kaPika: kaPika, duhetKontrolli: duhetKontrolli,
    pozita: pozita, tekstiGabimit: tekstiGabimit,
    LIDHJA_M: LIDHJA_M, pastroPikat: pastroPikat, pikatAfer: pikatAfer, sipasPikes: sipasPikes, ngaPika: ngaPika,
    emratNgaPikat: emratNgaPikat, pikaPerMarketin: pikaPerMarketin, mundTaRiemertoje: mundTaRiemertoje
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.StokuMarketet = api;
})(typeof self !== 'undefined' ? self : this);
