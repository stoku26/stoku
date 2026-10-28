/*
 * Lejet e përdoruesve (v230): çka mund të përdorë secila llogari në Stoku. E përbashkët për telefonin dhe PC-në.
 *
 * Firestore: lejet/{uid} = { lejet: { stoku: true, stokuFshi: false, ... }, kontrolluarSe, kontrolluarNga, emri }
 *   - Pa dokument: llogari e re, ende pa u kontrolluar: i ka KREJT lejet, derisa administratori ta kontrollojë.
 *   - Çelës që mungon (p.sh. një leje e shtuar më vonë): e lejuar.
 *   - Leja e një pjese (p.sh. "stoku") vlen edhe për veprimet brenda saj ("stokuFshi"...): pa pjesën, s'ka as veprime.
 *     Prindi mund të ketë prind (v240: "stokuPlusMinus" → "stokuNdrysho" → "stoku"): kontrollohet krejt zinxhiri.
 * Rregullat (v230): dokumentin e shkruan vetëm administratori; secila llogari e lexon vetëm të vetin.
 * Administratori (mendurberisha) i ka gjithmonë krejt lejet; faqja "Përdoruesit" te Cilësimet është vetëm e tij.
 * Lejet i zbaton aplikacioni (fsheh pjesët dhe butonat që s'lejohen); përdoruesi s'mund t'i ndryshojë vetë.
 * v241: lejet "me zgjedhje" (zgjedhje: true, p.sh. "marketet" = merchandiser) janë të FIKURA kur mungojnë: s'i marrin
 *   llogaritë ekzistuese. Vlera e tyre vjen nga regjistrimi (perdoruesit/{uid}.merchandiser) derisa administratori ta
 *   ndezë/fikë vetë (atëherë ruhet këtu si true/false dhe fiton). "Lejo krejt"/"Ndalo krejt" s'i prekin (meZgjedhjet).
 * v231: çka s'lejohet zhduket krejt, pa asnjë mesazh (as "s'të lejohet", as listë te Llogaria): përdoruesi s'e di as
 *   që ekziston. Pa "stoku" kryefaqja e telefonit është pjesa e parë e lejuar; pa "pc" kompjuteri hap versionin e
 *   telefonit (index.html e lexon lejen e ruajtur këtu, KEY_LOKALE); "Dërgo në PC" kërkon edhe "pc".
 */
(function (root) {
  'use strict';

  // Lista e plotë e lejeve, në grupe (renditja = renditja te faqja e administratorit). prindi: leja e pjesës
  var KATALOGU = [
    { grupi: 'Stoku', lejet: [
      { k: 'stoku', emri: 'Stoku', pershkrim: 'Sheh folderat dhe produktet.' },
      { k: 'stokuShto', emri: 'Shto produkte të reja', pershkrim: 'Një barkod që s\'është ende në folder.', prindi: 'stoku' },
      { k: 'stokuNdrysho', emri: 'Ndrysho produktet', pershkrim: 'Sasia, emri, furnizuesi dhe zhvendosja në folder tjetër.', prindi: 'stoku' },
      // v240: më parë leje e grupit (pronari, kolona "+/-"); tash si lejet e tjera, e lejuar për krejt llogaritë
      { k: 'stokuPlusMinus', emri: 'Sasia e shpejtë (+/-)', pershkrim: 'Butonat + dhe - te lista e produkteve dhe numërimi kur skanon me kamerë një produkt që e ke.', prindi: 'stokuNdrysho' },
      { k: 'stokuFshi', emri: 'Fshi produkte dhe foldera', pershkrim: 'Edhe "Fshi krejt" brenda një folderi.', prindi: 'stoku' },
      { k: 'stokuFoldera', emri: 'Krijo dhe ndrysho folderat', pershkrim: '"Folder i ri", emri, ikona dhe renditja e folderave.', prindi: 'stoku' },
      { k: 'stokuImporto', emri: 'Importo stokun', pershkrim: 'Nga fotoja e një flete (me AI) ose nga Excel në kompjuter.', prindi: 'stoku' }
    ] },
    { grupi: 'Afatet', lejet: [
      { k: 'afatet', emri: 'Afatet', pershkrim: 'Sheh afatet e skadimit të produkteve.' },
      { k: 'afatetShto', emri: 'Shto afate', prindi: 'afatet' },
      { k: 'afatetNdrysho', emri: 'Ndrysho afatet', pershkrim: 'Data, sasia, "U hoq nga rafti" dhe "Rikthe si aktiv".', prindi: 'afatet' },
      { k: 'afatetFshi', emri: 'Fshi afate', prindi: 'afatet' },
      { k: 'afatetAI', emri: 'Lexo fletën me AI', pershkrim: 'Fotoja e fletës me afate (edhe fletët që vijnë nga telefoni te kompjuteri).', prindi: 'afatet' },
      { k: 'afatetImporto', emri: 'Importo afate nga Excel', prindi: 'afatet' },
      { k: 'marketet', emri: 'Merchandiser (disa markete)', pershkrim: 'Afatet sipas marketeve, me GPS. E zgjedh vetë kur hap llogarinë ("Punoj si merchandiser"); këtu ia ndez ose ia fik.', prindi: 'afatet', zgjedhje: true }
    ] },
    { grupi: 'Grupi', lejet: [
      { k: 'grupi', emri: 'Grupi', pershkrim: 'Kolegët, afatet e grupit, aktiviteti dhe kalendari.' },
      { k: 'grupiHeq', emri: 'Hiq nga rafti produktet e kolegëve', pershkrim: '"Unë e hoqa" te afatet e skaduara të kolegëve (kolegu e miraton).', prindi: 'grupi' },
      { k: 'grupiKerkesat', emri: 'Kërkesat për heqje', pershkrim: 'Kërkoji një kolegu ose krejt grupit ta heqë një produkt nga rafti.', prindi: 'grupi' }
    ] },
    { grupi: 'Skanimi dhe skedarët', lejet: [
      { k: 'kamera', emri: 'Skano me kamerë', pershkrim: 'Barkodi me kamerën e telefonit, te stoku dhe te afatet.' },
      // v263: e lejuar për krejt llogaritë (si çdo leje e re); pa "Skano me kamerë" s'ka as këtë
      { k: 'skanimShpejt', emri: 'Skanim i shpejtë', pershkrim: 'Brenda folderit te Stoku: kamera s\'mbyllet dhe çdo barkod shtohet menjëherë te lista me sasitë.', prindi: 'kamera' },
      { k: 'eksportExcel', emri: 'Eksporto në Excel', pershkrim: 'Stoku dhe afatet.' },
      { k: 'eksportPdf', emri: 'Eksporto në PDF', pershkrim: 'Etiketat me barkod (në kompjuter edhe raporti).' },
      { k: 'dergoNePc', emri: 'Dërgo skedarët në PC', pershkrim: 'Excel-i dhe PDF-ja nga telefoni te Stoku në kompjuter (kërkon edhe "Stoku në kompjuter").' }
    ] },
    { grupi: 'Pajisjet', lejet: [
      { k: 'ora', emri: 'Ora e dorës', pershkrim: 'Lidhja e Galaxy Watch ose Apple Watch.' },
      { k: 'pc', emri: 'Stoku në kompjuter', pershkrim: 'Versioni për kompjuter. Pa të, në kompjuter hapet versioni i telefonit.' }
    ] }
  ];
  var CELESAT = [], PRINDI = {}, LEJA = {}, ZGJEDHJE = {};
  KATALOGU.forEach(function (g) {
    g.lejet.forEach(function (l) { CELESAT.push(l.k); LEJA[l.k] = l; if (l.prindi) PRINDI[l.k] = l.prindi; if (l.zgjedhje) ZGJEDHJE[l.k] = true; });
  });

  // lejet: null (pa dokument / llogari e pakontrolluar) ose { çelësi: bool }
  function lejohet(lejet, k) {
    if (ZGJEDHJE[k]) return zgjedhja(lejet, k) === true && (!PRINDI[k] || lejohet(lejet, PRINDI[k]));
    if (!lejet || typeof lejet !== 'object') return true;
    if (lejet[k] === false) return false;
    var p = PRINDI[k];
    return p ? lejohet(lejet, p) : true;
  }
  // Leja me zgjedhje: true / false kur e ka caktuar administratori, null kur s'është caktuar (vlen regjistrimi)
  function zgjedhja(lejet, k) { return lejet && typeof lejet === 'object' && typeof lejet[k] === 'boolean' ? lejet[k] : null; }
  // Vetëm çelësat e katalogut, gjithmonë bool (që mungon = e lejuar); ato me zgjedhje vetëm kur janë caktuar
  function pastro(lejet) {
    var o = {};
    CELESAT.forEach(function (k) {
      if (ZGJEDHJE[k]) { if (zgjedhja(lejet, k) !== null) o[k] = lejet[k]; return; }
      o[k] = !(lejet && lejet[k] === false);
    });
    return o;
  }
  function krejt(vlera) {
    var o = {};
    CELESAT.forEach(function (k) { if (!ZGJEDHJE[k]) o[k] = !!vlera; });
    return o;
  }
  // "Lejo krejt" / "Ndalo krejt" s'e ndërrojnë zgjedhjen e caktuar më parë (p.sh. merchandiser)
  function meZgjedhjet(lejetERe, teVjetrat) {
    var o = Object.assign({}, lejetERe);
    Object.keys(ZGJEDHJE).forEach(function (k) { if (zgjedhja(o, k) === null && zgjedhja(teVjetrat, k) !== null) o[k] = teVjetrat[k]; });
    return o;
  }
  // Sa leje (nga katalogu) janë ndaluar (ato me zgjedhje s'janë ndalime)
  function teNdaluara(lejet) {
    if (!lejet) return 0;
    return CELESAT.filter(function (k) { return !ZGJEDHJE[k] && lejet[k] === false; }).length;
  }
  // Statusi i një llogarie për listën e administratorit: 'ri' (pa u kontrolluar) | 'krejt' | 'kufizuar'
  function statusi(dok) {
    if (!dok || !dok.kontrolluarSe) return 'ri';
    return teNdaluara(dok.lejet) ? 'kufizuar' : 'krejt';
  }

  // fs: { doc, collection, setDoc, onSnapshot }
  function krijo(fs, db, uidFn) {
    return {
      // Lejet e kësaj llogarie, në kohë reale: cb(null) kur s'ka dokument (krejt të lejuara)
      degjoTimet: function (cb, cbGabim) {
        var uid = uidFn();
        if (!uid) { cb(null); return function () {}; }
        return fs.onSnapshot(fs.doc(db, 'lejet', uid), function (s) {
          cb(s.exists() ? (s.data() || {}) : null);
        }, function (e) { if (cbGabim) cbGabim(e); });
      },
      // Administratori: lejet e krejt llogarive { uid: dokumenti }
      degjoKrejt: function (cb, cbGabim) {
        return fs.onSnapshot(fs.collection(db, 'lejet'), function (s) {
          var m = {};
          s.forEach(function (d) { m[d.id] = d.data() || {}; });
          cb(m);
        }, function (e) { if (cbGabim) cbGabim(e); });
      },
      // Administratori: ruan lejet e një llogarie dhe e shënon si të kontrolluar
      ruaj: ruaj,
      // Administratori: disa llogari njëherësh (lista: [{ uid, lejet, emri }]) → { ok, n, gabime, arsye }
      ruajShume: function (lista, info) {
        return Promise.all((lista || []).map(function (x) {
          return ruaj(x.uid, x.lejet, { nga: info && info.nga, emri: x.emri });
        })).then(function (r) {
          var gab = r.filter(function (x) { return !x.ok; });
          return { ok: !gab.length, n: r.length - gab.length, gabime: gab.length, arsye: gab.length ? gab[0].arsye : '' };
        });
      }
    };
    function ruaj(uid, lejet, info) {
      info = info || {};
      return fs.setDoc(fs.doc(db, 'lejet', uid), {
        lejet: pastro(lejet), kontrolluarSe: Date.now(),
        kontrolluarNga: String(info.nga || '').slice(0, 60), emri: String(info.emri || '').slice(0, 60)
      }).then(function () { return { ok: true }; }, function (e) {
        return { ok: false, arsye: e && (e.code === 'permission-denied' || /permission|insufficient/i.test(String(e.message || ''))) ? 'leje' : 'rrjeti' };
      });
    }
  }

  // Lejet e kësaj pajisjeje (telefoni ose PC): dokumenti i llogarisë në kohë reale, i ruajtur edhe në localStorage, që
  // kufizimet të vlejnë që në hapje (edhe pa internet, edhe para se Firebase të dijë a je hyrë). Administratori dhe
  // vizitori (pa llogari) s'kanë kufizime; me daljen nga llogaria fshihen edhe lejet e ruajtura.
  // o: { cloud() → api i krijo(), gati() → a dihet hyrja, uid() → uid|null, admin() → bool, ndryshoi(lejet, para, gjatePunes) }
  // gjatePunes = true kur ndryshimi vjen nga administratori ndërsa aplikacioni është hapur (jo në hapje)
  var KEY_LOKALE = 'stoku:lejet:v1';
  function lexoLokale() {
    try {
      var x = JSON.parse(localStorage.getItem(KEY_LOKALE) || 'null');
      return x && typeof x.uid === 'string' && x.lejet && typeof x.lejet === 'object' ? x : null;
    } catch (e) { return null; }
  }
  function ruajLokale(uid, l) {
    try { if (uid && l) localStorage.setItem(KEY_LOKALE, JSON.stringify({ uid: uid, lejet: l })); else localStorage.removeItem(KEY_LOKALE); } catch (e) { /* ok */ }
  }
  function krijoGjendjen(o) {
    var lejet = null, uidAktual, ndal = null;
    function vendos(l, gjatePunes) {
      var para = lejet;
      lejet = l;
      if (JSON.stringify(para) !== JSON.stringify(l)) { try { o.ndryshoi(l, para, !!gjatePunes); } catch (e) { /* ok */ } }
    }
    function ndalDegjuesin() { if (ndal) { try { ndal(); } catch (e) { /* ok */ } ndal = null; } }
    // Thirret në hapje dhe sa herë ndryshon llogaria (hyrja, dalja) ose bëhet gati cloud-i
    function rinis() {
      if (o.gati && !o.gati()) {
        // Ende s'dihet a je hyrë: lejet e fundit të kësaj pajisjeje, derisa të përgjigjet Firebase
        if (uidAktual === undefined) { var x = lexoLokale(); if (x) vendos(pastro(x.lejet)); }
        return;
      }
      var uid = o.uid() || null, admin = !!(uid && o.admin());
      if (uid === uidAktual && (ndal || !uid || admin)) return;
      ndalDegjuesin();
      uidAktual = uid;
      if (!uid || admin) { ruajLokale(null); vendos(null); return; }
      var x2 = lexoLokale();
      vendos(x2 && x2.uid === uid ? pastro(x2.lejet) : null);
      var c = o.cloud();
      if (!c || !c.degjoTimet) return;
      var iPari = true;
      ndal = c.degjoTimet(function (dok) {
        if ((o.uid() || null) !== uid) return;
        var l = dok && dok.lejet && typeof dok.lejet === 'object' ? pastro(dok.lejet) : null;
        ruajLokale(uid, l);
        vendos(l, !iPari);
        iPari = false;
      }, function () { /* p.sh. rregullat para v230: mbeten lejet e ruajtura (ose krejt të lejuara) */ });
    }
    return {
      rinis: rinis,
      lejohet: function (k) { return lejohet(lejet, k); },
      lejet: function () { return lejet; }
    };
  }

  var api = { KATALOGU: KATALOGU, CELESAT: CELESAT, LEJA: LEJA, PRINDI: PRINDI, ZGJEDHJE: ZGJEDHJE, lejohet: lejohet, pastro: pastro, krejt: krejt,
    zgjedhja: zgjedhja, meZgjedhjet: meZgjedhjet, teNdaluara: teNdaluara, statusi: statusi, krijo: krijo, krijoGjendjen: krijoGjendjen, KEY_LOKALE: KEY_LOKALE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.StokuLejet = api;
})(typeof self !== 'undefined' ? self : this);
