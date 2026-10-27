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
 *   - v256: brenda RREZJA_M (60 m) nga pika e ruajtur, plus pasaktësia e GPS-it deri në PASAKTESIA_MAKS_M (40 m), pra më së
 *     shumti 100 m = je te ai market; më i afërti fiton. Me pasaktësi mbi PASAKTESIA_E_PRANUESHME_M (150 m) GPS-i s'thotë dot
 *     a je brenda: s'je te asnjë. (Deri te v255: 250 m + deri 150 m, ndaj në shtëpi afër një marketi dilte "Je te: …".)
 *   - v257: dy markete fqinje (p.sh. matanë rrugës): kur ndryshimi i largësive deri te to është më i vogël se
 *     max(PAQARTESIA_MIN_M, PAQARTESIA_K × pasaktësia), GPS-i s'i dallon: mbetet marketi aktiv (nëse është njëri prej tyre),
 *     përndryshe s'zgjidhet vetë asnjë ("Ku je?" me to në krye). gjejMarketin(); gjej() mbetet si më parë.
 *   - Zgjedhja me dorë vlen DORE_MS para GPS-it (brenda qendrave tregtare GPS-i gabon), përveç kur GPS-i (i saktë) të tregon
 *     qartë larg atij marketi (mbi LARG_M + pasaktësia, v256). Jashtë krejt marketeve, pas një zgjedhjeje nga GPS-i, aktiv bëhet
 *     "Krejt marketet" (null).
 *   - Vendndodhja e personit s'ruhet dhe s'dërgohet askund: krahasohet vetëm në pajisje me pikat e marketeve.
 * v250: marketet janë TË PËRBASHKËTA për krejt merchandiserët: lista e secilit = pikat e Stoku-t (sinkronizoMePikat).
 *   Merchandiseri s'i fshin e s'ua ndërron emrin; shton market vetëm kur është brenda tij, me vendndodhje të saktë
 *   (≤ SAKTESIA_MAKS_M) dhe kur s'ka asnjë market tjetër brenda LIDHJA_M. Emrin e ndryshon dhe pikën e fshin vetëm administratori.
 * v253: dy markete mund të jenë afër njëri-tjetrit (p.sh. dy anët e rrugës, rreth 50 m): "i njëjti vend" = brenda AFER_M
 *   (20 m). Merchandiseri: deri në AFER_M + pasaktësia e GPS-it (≤ LIDHJA_M) s'shtohet ("afer": prit sa të saktësohet ose
 *   zgjidhe atë); administratori (shenja në hartë) vetëm brenda AFER_M.
 */
(function (root) {
  'use strict';

  var RREZJA_M = 60; // v256: ishte 250
  var PASAKTESIA_MAKS_M = 40; // v256: ishte 150
  var PASAKTESIA_E_PRANUESHME_M = 150; // v256: me pasaktësi më të madhe s'dihet a je brenda marketit
  var LARG_M = 300; // v256: zgjedhja me dorë bie kur GPS-i të tregon më larg se kaq (+ pasaktësia) nga ai market
  var PAQARTESIA_MIN_M = 10, PAQARTESIA_K = 0.8; // v257: markete fqinje që GPS-i s'i dallon (shih gjejMarketin)
  var DORE_MS = 3 * 3600 * 1000;
  var KONTROLLI_MS = 2 * 60 * 1000;
  var KEY_LISTA = 'stoku:marketet:v1';
  var KEY_AKTIV = 'stoku:marketi:aktiv';
  var EMRI_MAKS = 60;
  var SAKTESIA_MAKS_M = 100; // v250: market i ri vetëm me vendndodhje të saktë (jo "e përafërt" e telefonit, ±1-3 km)

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
    if (numer(poz.sakt) && poz.sakt > PASAKTESIA_E_PRANUESHME_M) return null; // v256: vendndodhja shumë e përafërt
    var kufiri = RREZJA_M + Math.min(numer(poz.sakt) ? Math.max(0, poz.sakt) : 0, PASAKTESIA_MAKS_M);
    var mi = null, dMin = Infinity;
    (l || []).forEach(function (m) {
      if (!kaVend(m)) return;
      var d = largesia(m, poz);
      if (d <= kufiri && d < dMin) { dMin = d; mi = m; }
    });
    return mi ? { marketi: mi, largesia: Math.round(dMin) } : null;
  }

  // v257: si gjej(), por me marketet fqinje: kur disa markete brenda rrezes janë aq afër sa GPS-i s'i dallon (largësitë
  // ndryshojnë më pak se max(PAQARTESIA_MIN_M, PAQARTESIA_K × pasaktësia)), mbetet aktivId (nëse është njëri prej tyre),
  // përndryshe { paqarte: true, kandidatet: [{ marketi, largesia }…] } (më i afërti i pari). Pa asnjë: null.
  function gjejMarketin(l, poz, aktivId) {
    if (!poz || !numer(poz.lat) || !numer(poz.lng)) return null;
    if (numer(poz.sakt) && poz.sakt > PASAKTESIA_E_PRANUESHME_M) return null;
    var s = numer(poz.sakt) ? Math.max(0, poz.sakt) : 0;
    var kufiri = RREZJA_M + Math.min(s, PASAKTESIA_MAKS_M), c = [];
    (l || []).forEach(function (m, i) { if (!kaVend(m)) return; var d = largesia(m, poz); if (d <= kufiri) c.push({ marketi: m, d: d, i: i }); });
    if (!c.length) return null;
    c.sort(function (a, b) { return a.d - b.d || a.i - b.i; });
    var pragu = Math.max(PAQARTESIA_MIN_M, PAQARTESIA_K * s);
    var afer = c.filter(function (x) { return x.d - c[0].d < pragu; });
    if (afer.length > 1) {
      var a = aktivId ? afer.filter(function (x) { return x.marketi.id === aktivId; })[0] : null;
      if (a) return { marketi: a.marketi, largesia: Math.round(a.d) };
      return { paqarte: true, kandidatet: afer.map(function (x) { return { marketi: x.marketi, largesia: Math.round(x.d) }; }) };
    }
    return { marketi: c[0].marketi, largesia: Math.round(c[0].d) };
  }

  // ---------- v246: pikat e përbashkëta të Stoku-t (pikat/{id}) ----------
  // Pika: { id, emri, lat, lng, krijuarNga, krijuarNgaEmri, emriNgaAdmini }. Çdo market me vendndodhje bëhet pikë; një
  // merchandiser tjetër që arrin aty e gjen vetë ("Je te: X") pa e shtuar sërish. Emri i pikës (i administratorit) fiton.
  // Brenda kësaj largësie është "i njëjti vend": marketi i vjetër (pa pikë) lidhet me pikën aty; v250: aty s'shtohet market tjetër
  // v253: vetëm me të njëjtin emër (ose brenda AFER_M); kufiri i sipërm i pasaktësisë kur shton merchandiseri
  var LIDHJA_M = 60;
  // v253: dy markete s'janë më afër se kaq (kufiri i administratorit; merchandiseri: plus pasaktësia e GPS-it)
  var AFER_M = 20;
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
  // Market i ri nga një pikë e përbashkët. v250: id e qëndrueshme ('k' + pika): dy pajisje të të njëjtit merchandiser e
  // shtojnë të njëjtin market (sinkronizimi i dyqanit s'e dyfishon)
  function ngaPika(pika, tani) {
    return { id: 'k' + pika.id, emri: pika.emri, lat: pika.lat, lng: pika.lng, p: pika.id, ndryshuarSe: tani || Date.now() };
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
  // Pika në të njëjtin vend, ose null. v253: brenda AFER_M (çfarëdo emri) ose brenda LIDHJA_M me të njëjtin emër (marketi i
  // vjetër pa pikë): një market tjetër mund të jetë 50 m larg
  function pikaPerMarketin(pikat, m) {
    if (!kaVend(m)) return null;
    var n = m.emri ? emriINormalizuar(m.emri) : '';
    var a = pikatAfer(pikat, m, LIDHJA_M, 50).filter(function (x) { return x.largesia <= AFER_M || (n && emriINormalizuar(x.pika.emri) === n); })[0];
    return a ? a.pika : null;
  }
  // Më i afërti (nga lista) brenda maksM metrave, ose null: { marketi, largesia }
  function mAfer(l, poz, maksM) {
    var mi = null, dMin = Infinity;
    (l || []).forEach(function (m) { if (!kaVend(m)) return; var d = largesia(m, poz); if (d <= maksM && d < dMin) { dMin = d; mi = m; } });
    return mi ? { marketi: mi, largesia: Math.round(dMin) } : null;
  }
  // v250: marketi (nga lista) në të njëjtin vend (v253: brenda AFER_M), ose null: { marketi, largesia }
  function marketiNeVend(l, poz) {
    if (!poz || !numer(poz.lat) || !numer(poz.lng)) return null;
    return mAfer(l, poz, AFER_M);
  }
  // v253: shenja e administratorit në hartë: pika e Stoku-t brenda AFER_M, ose null: { pika, largesia }
  function pikaShumeAfer(pikat, poz) {
    if (!poz || !numer(poz.lat) || !numer(poz.lng)) return null;
    return pikatAfer(pikat, poz, AFER_M, 1)[0] || null;
  }
  // v250: a mund të shtohet një market këtu? → null (po) ose { arsye: 'pasakte', sakt } | { arsye: 'ekziston', emri, marketi?, pika? }
  // v253: | { arsye: 'afer', emri, largesia, sakt } (një market brenda AFER_M + pasaktësia: s'dihet a je te ai apo te fqinji)
  function kontrolloShtimin(poz, l, pikat) {
    if (!poz || !numer(poz.lat) || !numer(poz.lng)) return { arsye: 'pasakte', sakt: 0 };
    if (!numer(poz.sakt) || poz.sakt > SAKTESIA_MAKS_M) return { arsye: 'pasakte', sakt: Math.round(numer(poz.sakt) ? poz.sakt : 0) };
    var mv = marketiNeVend(l, poz);
    if (mv) return { arsye: 'ekziston', emri: mv.marketi.emri, marketi: mv.marketi };
    var pk = pikatAfer(pikat, poz, AFER_M, 1)[0];
    if (pk) return { arsye: 'ekziston', emri: pk.pika.emri, pika: pk.pika };
    var kufiri = Math.min(LIDHJA_M, AFER_M + Math.max(0, poz.sakt));
    var a = mAfer(l, poz, kufiri), b = pikatAfer(pikat, poz, kufiri, 1)[0];
    var x = a && (!b || a.largesia <= b.largesia) ? { emri: a.marketi.emri, largesia: a.largesia } : b ? { emri: b.pika.emri, largesia: b.largesia } : null;
    if (x) return { arsye: 'afer', emri: x.emri, largesia: x.largesia, sakt: Math.round(poz.sakt) };
    return null;
  }
  // v250: lista e merchandiserit = pikat e Stoku-t. Çdo pikë → market (ngaPika); emri dhe vendndodhja nga pika; marketi i
  // vjetër pa pikë lidhet me pikën në të njëjtin vend; dy markete me të njëjtën pikë → mbetet një (i dyti vetëm nëse ka afate).
  // serveri = lista vjen nga serveri: vetëm atëherë marketi i një pike që mungon (e fshiu administratori) hiqet, kur s'ka afate
  // dhe s'është krijuar a ndryshuar në 10 minutat e fundit (pika e re e një pajisjeje tjetër mund të mos ketë ardhur ende).
  // → { marketet, ndryshuar, hequr: [id] }
  var FRESKET_MS = 10 * 60 * 1000;
  function sinkronizoMePikat(l, pikat, afatet, serveri, tani) {
    tani = tani || Date.now();
    var pk = pastroPikat(pikat), h = {}, perdorur = {}, ndr = false, hequr = [], meAfate = {}, r = [];
    pk.forEach(function (x) { h[x.id] = x; });
    (afatet || []).forEach(function (a) { if (a && a.m) meAfate[a.m] = true; });
    var plota = serveri && pk.length < 3000, lidhja = {};
    // një pikë = një market: fiton ai me afate (p.sh. marketi i vjetër pa pikë, në të njëjtin vend, ndaj atij nga pika)
    (l || []).forEach(function (m) {
      var pid = m.p ? (h[m.p] ? m.p : null) : (kaVend(m) ? ((pikaPerMarketin(pk, m) || {}).id || null) : null);
      if (!pid) return;
      lidhja[m.id] = pid;
      if (!perdorur[pid] || (meAfate[m.id] && !meAfate[perdorur[pid]])) perdorur[pid] = m.id;
    });
    (l || []).forEach(function (m) {
      if (m.p && !h[m.p]) { // pika s'është më (e fshiu administratori)
        if (plota && !meAfate[m.id] && tani - (m.ndryshuarSe || 0) > FRESKET_MS) { hequr.push(m.id); ndr = true; return; }
        r.push(m); return;
      }
      var pid = lidhja[m.id], x = pid ? h[pid] : null;
      if (x && perdorur[pid] !== m.id) { // e njëjta pikë edhe te një market tjetër
        if (!meAfate[m.id]) { hequr.push(m.id); ndr = true; return; }
        if (!m.p) { r.push(m); return; } // i vjetër me afate: mbetet si është
      }
      if (x && !m.p) { m = Object.assign({}, m, { p: pid, ndryshuarSe: tani }); ndr = true; } // i vjetër: lidhet me pikën në të njëjtin vend
      if (x && (m.emri !== x.emri || m.lat !== x.lat || m.lng !== x.lng)) {
        m = Object.assign({}, m, { emri: x.emri, lat: x.lat, lng: x.lng, ndryshuarSe: tani }); ndr = true;
      }
      r.push(m);
    });
    pk.forEach(function (x) { if (!perdorur[x.id]) { r.push(ngaPika(x, tani)); ndr = true; } });
    return { marketet: r, ndryshuar: ndr, hequr: hequr };
  }

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
  // v256: a të tregon GPS-i qartë larg marketit id (më larg se LARG_M + pasaktësia)? Pa vendndodhje ose me pozitë të përafërt: jo
  function largNgaMarketi(l, id, poz) {
    var m = sipasId(l, id);
    if (!m || !kaVend(m) || !poz || !numer(poz.lat) || !numer(poz.lng)) return false;
    var s = numer(poz.sakt) ? Math.max(0, poz.sakt) : 0;
    if (s > PASAKTESIA_E_PRANUESHME_M) return false;
    return largesia(m, poz) > LARG_M + s;
  }
  // Përgjigjja e GPS-it → aktivi i ri. gjetur: rezultati i gjej() ose null (jashtë krejt marketeve).
  // larg (v256): largNgaMarketi() për marketin e zgjedhur me dorë
  function pasGps(aktivi, gjetur, tani, larg) {
    tani = tani || Date.now();
    var a = Object.assign({}, aktivi, { kontrolluarSe: tani });
    if (a.menyra === 'dore' && tani - a.koha < DORE_MS && !larg) return a; // zgjedhja me dorë fiton për disa orë
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
    RREZJA_M: RREZJA_M, PASAKTESIA_MAKS_M: PASAKTESIA_MAKS_M, PASAKTESIA_E_PRANUESHME_M: PASAKTESIA_E_PRANUESHME_M, LARG_M: LARG_M,
    largNgaMarketi: largNgaMarketi, DORE_MS: DORE_MS, gjejMarketin: gjejMarketin, PAQARTESIA_MIN_M: PAQARTESIA_MIN_M, PAQARTESIA_K: PAQARTESIA_K, KONTROLLI_MS: KONTROLLI_MS, KEY_LISTA: KEY_LISTA, KEY_AKTIV: KEY_AKTIV, EMRI_MAKS: EMRI_MAKS,
    pastro: pastro, idERe: idERe, rendit: rendit, sipasId: sipasId, emri: emri, ekzistonEmri: ekzistonEmri, kaVend: kaVend,
    largesia: largesia, gjej: gjej, filtro: filtro, meEmra: meEmra, vendosPaMarket: vendosPaMarket, grupo: grupo,
    lexoAktivin: lexoAktivin, ruajAktivin: ruajAktivin, pasGps: pasGps, kaPika: kaPika, duhetKontrolli: duhetKontrolli,
    pozita: pozita, tekstiGabimit: tekstiGabimit,
    LIDHJA_M: LIDHJA_M, AFER_M: AFER_M, pikaShumeAfer: pikaShumeAfer, pastroPikat: pastroPikat, pikatAfer: pikatAfer, sipasPikes: sipasPikes, ngaPika: ngaPika,
    emratNgaPikat: emratNgaPikat, pikaPerMarketin: pikaPerMarketin,
    SAKTESIA_MAKS_M: SAKTESIA_MAKS_M, marketiNeVend: marketiNeVend, kontrolloShtimin: kontrolloShtimin, sinkronizoMePikat: sinkronizoMePikat
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.StokuMarketet = api;
})(typeof self !== 'undefined' ? self : this);
