/*
 * Ruajtja e dyqanit në Firebase (Firestore), e ndarë në disa dokumente — e përbashkët për telefonin dhe PC-në.
 *
 * Pse: një dokument i Firestore-it pranon maksimum 1 MB. Më parë krejt dyqani (produktet + afatet) ishte
 * në një dokument të vetëm, pra kishte kufi (~6.000 produkte, ose afate të grumbulluara në disa muaj).
 *
 * Tani:
 *   dyqane/{uid}                    → kryesori: folderat, renditja, shënimet e fshirjeve, sa "pjesë" ka
 *   dyqane/{uid}/pjeset/p0, p1, …   → produktet dhe afatet, të ndara sipas një hash-i të çelësit;
 *                                     secila pjesë mbahet nën ~600 KB. Kur dyqani rritet, shtohen pjesë.
 * Pra s'ka më kufi praktik (500 pjesë × 600 KB), dhe leximi mbetet i lirë (1 + numri i pjesëve).
 *
 * Logjika e bashkimit (bashkimi.js) s'ndryshon: faqja merr gjithmonë gjendjen e plotë të bashkuar
 * { foldera, produktet, afatet, fshira, rendiKoha } dhe kthen gjendjen e re; ndarja bëhet vetëm këtu.
 *
 * Përputhshmëria:
 *  - Dokumenti i vjetër (me produktet/afatet brenda kryesorit) lexohet dhe bashkohet; në ruajtjen e parë
 *    kalon vetë në pjesë. Një pajisje me version të vjetër që shkruan sërish në kryesor s'humb asgjë:
 *    ato lista bashkohen përsëri në ruajtjen tjetër.
 *  - Nëse rregullat e Firebase-it ende s'e lejojnë nënkoleksionin "pjeset", punohet si më parë
 *    (një dokument) dhe raportohet `modaPjeseve: false`, pa humbur asgjë.
 */
(function (root) {
  'use strict';

  var PJESA_SYNIMI = 600 * 1024;   // madhësia e synuar e një pjese (bajt)
  var PJESA_MAKS = 900 * 1024;     // mbi këtë, shtohen pjesë
  var PJESE_MAKS = 400;            // kufi sigurie për transaksionin (Firestore: 500 shkrime)

  var koduesi = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
  function bajt(x) { var s = JSON.stringify(x); return koduesi ? koduesi.encode(s).length : s.length * 2; }

  function hash(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function celesiProduktit(p) { return p.kategoriaId + '::' + p.barkodi; }
  function kohaP(p) { return (p && typeof p.prekurSe === 'number') ? p.prekurSe : 0; }
  function kohaA(a) { return (a && typeof a.ndryshuarSe === 'number') ? a.ndryshuarSe : 0; }

  // Bashkon kryesorin + pjesët në gjendjen e plotë (një produkt/afat që del në dy vende → merret më i riu)
  function bashkoPjeset(kryesori, pjeset) {
    if (!kryesori && !(pjeset && pjeset.length)) return null;
    kryesori = kryesori || {};
    var pm = {}, am = {};
    function shtoP(p) {
      if (!p || typeof p.barkodi !== 'string' || typeof p.kategoriaId !== 'string') return;
      var k = celesiProduktit(p);
      if (!pm[k] || kohaP(p) > kohaP(pm[k])) pm[k] = p;
    }
    function shtoA(a) {
      if (!a || !a.id) return;
      if (!am[a.id] || kohaA(a) > kohaA(am[a.id])) am[a.id] = a;
    }
    (kryesori.produktet || []).forEach(shtoP); // dokumenti i vjetër / pajisje me version të vjetër
    (kryesori.afatet || []).forEach(shtoA);
    (pjeset || []).forEach(function (pj) {
      if (!pj) return;
      (pj.produktet || []).forEach(shtoP);
      (pj.afatet || []).forEach(shtoA);
    });
    var g = {};
    Object.keys(kryesori).forEach(function (k) { if (k !== 'produktet' && k !== 'afatet' && k !== 'pjeset') g[k] = kryesori[k]; });
    g.produktet = Object.keys(pm).map(function (k) { return pm[k]; });
    g.afatet = Object.keys(am).map(function (k) { return am[k]; });
    return g;
  }

  // Ndan gjendjen e plotë: kryesori (pa listat e mëdha) + n pjesë (n s'zvogëlohet kurrë, që pjesët të mbeten të qëndrueshme)
  function ndajNePjese(gjendja, nMeparshem) {
    var kryesori = {};
    Object.keys(gjendja || {}).forEach(function (k) { if (k !== 'produktet' && k !== 'afatet') kryesori[k] = gjendja[k]; });
    var produktet = (gjendja && gjendja.produktet) || [], afatet = (gjendja && gjendja.afatet) || [];
    var n = Math.max(1, nMeparshem || 0, Math.ceil((bajt(produktet) + bajt(afatet)) / PJESA_SYNIMI));
    for (;;) {
      var pjeset = [];
      for (var i = 0; i < n; i++) pjeset.push({ produktet: [], afatet: [] });
      produktet.forEach(function (p) { pjeset[hash('p:' + celesiProduktit(p)) % n].produktet.push(p); });
      afatet.forEach(function (a) { pjeset[hash('a:' + a.id) % n].afatet.push(a); });
      var eMadhe = pjeset.some(function (pj) { return bajt(pj) > PJESA_MAKS; });
      if (!eMadhe || n >= PJESE_MAKS) { kryesori.pjeset = n; return { kryesori: kryesori, pjeset: pjeset }; }
      n = Math.min(PJESE_MAKS, n * 2);
    }
  }

  /**
   * fs: funksionet e Firestore-it { doc, getDoc, setDoc, runTransaction, onSnapshot, collection }
   * db: instanca e Firestore-it; uidFn: () => uid i përdoruesit aktual (ose null)
   */
  function krijo(fs, db, uidFn) {
    var modaPjeseve = true; // bëhet false kur rregullat e Firebase-it s'e lejojnë ende "pjeset"
    function refKryesor() { return fs.doc(db, 'dyqane', uidFn()); }
    function refPjesa(i) { return fs.doc(db, 'dyqane', uidFn(), 'pjeset', 'p' + i); }
    function sLejohet(e) { return e && (e.code === 'permission-denied' || /permission/i.test(String(e.message || ''))); }
    function gabim(e) { return { ok: false, kodi: e && e.code, arsye: String((e && e.message) || e) }; }

    async function merrPjeset(kryesori, merrFn) {
      var n = (kryesori && Number(kryesori.pjeset)) || 0;
      var te = [];
      for (var i = 0; i < n; i++) te.push(merrFn(refPjesa(i)));
      var sn = await Promise.all(te);
      return sn.map(function (s) { return s.exists() ? s.data() : null; });
    }

    async function merr() {
      if (!uidFn()) return { ok: false, arsye: 'pa-hyrje' };
      try {
        var s = await fs.getDoc(refKryesor());
        var k = s.exists() ? s.data() : null;
        var pjeset = [];
        if (modaPjeseve) {
          try { pjeset = await merrPjeset(k, fs.getDoc); }
          catch (e) { if (!sLejohet(e)) throw e; modaPjeseve = false; }
        }
        return { ok: true, gjendja: bashkoPjeset(k, pjeset) };
      } catch (e) { return gabim(e); }
    }

    // Lexim + bashkim + shkrim në një transaksion (dy pajisje njëkohësisht s'ia fshijnë ndryshimet njëra-tjetrës)
    async function bashkoDheRuaj(fnBashko) {
      if (!uidFn()) return { ok: false, arsye: 'pa-hyrje' };
      if (modaPjeseve) {
        try {
          var g = await fs.runTransaction(db, async function (tx) {
            var s = await tx.get(refKryesor());
            var k = s.exists() ? s.data() : null;
            var nPara = (k && Number(k.pjeset)) || 0;
            var teVjetrat = [];
            for (var i = 0; i < nPara; i++) teVjetrat.push(await tx.get(refPjesa(i)));
            var pjesetPara = teVjetrat.map(function (x) { return x.exists() ? x.data() : null; });
            var eRe = fnBashko(bashkoPjeset(k, pjesetPara));
            var nd = ndajNePjese(eRe, nPara);
            tx.set(refKryesor(), nd.kryesori);
            nd.pjeset.forEach(function (pj, i) {
              var para = pjesetPara[i];
              if (!para || JSON.stringify(para) !== JSON.stringify(pj)) tx.set(refPjesa(i), pj); // vetëm pjesët që ndryshuan
            });
            return eRe;
          });
          return { ok: true, gjendja: g, modaPjeseve: true };
        } catch (e) {
          if (!sLejohet(e)) return gabim(e);
          modaPjeseve = false; // rregullat e vjetra: vazhdo si më parë, pa humbur asgjë
        }
      }
      try {
        var gj = await fs.runTransaction(db, async function (tx) {
          var s = await tx.get(refKryesor());
          var eRe = fnBashko(bashkoPjeset(s.exists() ? s.data() : null, []));
          var dok = Object.assign({}, eRe);
          if (s.exists() && s.data().pjeset) dok.pjeset = s.data().pjeset;
          tx.set(refKryesor(), dok);
          return eRe;
        });
        return { ok: true, gjendja: gj, modaPjeseve: false };
      } catch (e2) { return gabim(e2); }
    }

    // Ruajtje e drejtpërdrejtë (pa bashkim) — përdoret vetëm si rezervë
    async function ruaj(gjendja) {
      return bashkoDheRuaj(function () { return gjendja; });
    }

    // Dëgjim i drejtpërdrejtë: kryesori + pjesët; thirret cb(gjendjaEPlote, kaShkrimeNePritje)
    function degjo(cb, cbGabim) {
      if (!uidFn()) return function () {};
      var kryesori, kaKryesor = false, pjesetSipasId = {}, kaPjese = !modaPjeseve, pritje = { k: false, p: false };
      function njofto() {
        if (!kaKryesor || !kaPjese) return;
        var n = (kryesori && Number(kryesori.pjeset)) || 0;
        var pjeset = [];
        for (var i = 0; i < n; i++) pjeset.push(pjesetSipasId['p' + i] || null);
        if (modaPjeseve && pjeset.some(function (p) { return p === null; })) return; // pjesët e reja ende s'kanë mbërritur
        cb(bashkoPjeset(kryesori, modaPjeseve ? pjeset : []), pritje.k || pritje.p);
      }
      var ndal1 = fs.onSnapshot(refKryesor(), function (s) {
        kryesori = s.exists() ? s.data() : null; kaKryesor = true; pritje.k = s.metadata.hasPendingWrites;
        njofto();
      }, function (e) { if (cbGabim) cbGabim(e); });
      var ndal2 = function () {};
      if (modaPjeseve) {
        ndal2 = fs.onSnapshot(fs.collection(db, 'dyqane', uidFn(), 'pjeset'), function (s) {
          pjesetSipasId = {};
          s.forEach(function (d) { pjesetSipasId[d.id] = d.data(); });
          kaPjese = true; pritje.p = s.metadata.hasPendingWrites;
          njofto();
        }, function (e) {
          if (sLejohet(e)) { modaPjeseve = false; kaPjese = true; njofto(); return; }
          if (cbGabim) cbGabim(e);
        });
      }
      return function () { try { ndal1(); } catch (e) { /* ok */ } try { ndal2(); } catch (e) { /* ok */ } };
    }

    return { merr: merr, bashkoDheRuaj: bashkoDheRuaj, ruaj: ruaj, degjo: degjo, modaPjeseve: function () { return modaPjeseve; } };
  }

  var api = { krijo: krijo, bashkoPjeset: bashkoPjeset, ndajNePjese: ndajNePjese };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.StokuRuajtja = api;
})(typeof self !== 'undefined' ? self : this);
