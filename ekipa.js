/*
 * Ekipa — pjesa e përbashkët e telefonit (index.html) dhe kompjuterit (pc.html) për tabin "Ekipa".
 *
 * Çka ka brenda:
 *  1. krijoCloud(fs, db, auth, platforma) — leximet/shkrimet në Firestore për ekipën:
 *       perdoruesit/{uid}              → emri + prania (aktivSe, online, platforma)
 *       perdoruesit/{uid}/njoftimet    → njoftimet personale (p.sh. "Blerta e hoqi nga rafti Qumështin tënd")
 *       ekipa_feed                     → aktiviteti i ekipës (kush çka hoqi, shtoi, lajmëroi…)
 *       ekipa_chat                     → chat-i i ekipës
 *     Dyqani i secilit (dyqane/{uid}) mbetet i PRONARIT: askush tjetër s'shkruan aty. Kur një koleg e heq nga
 *     rafti një afat të skaduar të dikujt tjetër, i dërgon pronarit një njoftim; aplikacioni i pronarit e zbaton
 *     vetë (vetëm nëse afati ka skaduar vërtet dhe s'është ndryshuar pas heqjes).
 *  2. Funksione të pastra (pa DOM, testohen me node): koha relative, prania, mbivendosja e heqjeve,
 *     kalendari, statistikat, teksti i aktivitetit.
 *  3. krijoKontrollues(o) — mban gjendjen e ekipës (anëtarët, afatet e secilit, aktivitetin, chat-in,
 *     njoftimet) dhe dëgjuesit; faqja (telefon/PC) vetëm e vizaton kur thirret o.ndryshoi(…).
 */
(function (root) {
  'use strict';

  var ONLINE_MS = 4 * 60 * 1000;   // pa shenjë jete më shumë se kaq → s'numërohet më "online"
  var RRAHJA_MS = 90 * 1000;       // sa shpesh aplikacioni i hapur thotë "jam këtu"
  var MUAJT = ['Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor', 'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'];
  var DITET_SHKURT = ['Hën', 'Mar', 'Mër', 'Enj', 'Pre', 'Sht', 'Die'];

  function AF() {
    if (root.StokuAfatet) return root.StokuAfatet;
    if (typeof module !== 'undefined' && module.exports && typeof require === 'function') return require('./afatet.js'); // testet me node
    return null;
  }
  function dy(n) { return (n < 10 ? '0' : '') + n; }
  function isoDites(d) { return d.getFullYear() + '-' + dy(d.getMonth() + 1) + '-' + dy(d.getDate()); }
  function emriNgaEmail(email) { return String(email || '').replace(/@stoku-app\.local$/, ''); }

  // ======================================================================================
  // 1. Cloud
  // ======================================================================================
  function krijoCloud(fs, db, auth, platforma) {
    function uid() { return auth.currentUser ? auth.currentUser.uid : null; }
    function emri() { return auth.currentUser ? emriNgaEmail(auth.currentUser.email) : ''; }
    function gabim(e) { return { ok: false, kodi: e && e.code, arsye: String((e && e.message) || e) }; }
    function pastro(o) { var r = {}; Object.keys(o).forEach(function (k) { if (o[k] !== undefined) r[k] = o[k]; }); return r; }
    function listaNga(s) { var l = []; s.forEach(function (d) { l.push(Object.assign({}, d.data(), { id: d.id })); }); return l; }

    // ---------- Prania: "online tani" / "parë para 5 min" ----------
    var rrahjaKohez = null, praniaNisur = false;
    function rrahZemren(online) {
      if (!uid()) return Promise.resolve();
      return fs.setDoc(fs.doc(db, 'perdoruesit', uid()), { aktivSe: Date.now(), online: online !== false, platforma: platforma }, { merge: true })
        .catch(function () { /* pa internet — provohet sërish */ });
    }
    function nisPranine() {
      clearInterval(rrahjaKohez);
      if (!uid()) return;
      praniaNisur = true;
      if (!document.hidden) rrahZemren(true);
      rrahjaKohez = setInterval(function () { if (!document.hidden) rrahZemren(true); }, RRAHJA_MS);
    }
    function ndalPranine() {
      clearInterval(rrahjaKohez); rrahjaKohez = null;
      if (praniaNisur && uid()) rrahZemren(false);
      praniaNisur = false;
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', function () { if (praniaNisur && uid()) rrahZemren(!document.hidden); });
      window.addEventListener('pagehide', function () { if (praniaNisur && uid()) rrahZemren(false); });
    }

    return {
      nisPranine: nisPranine,
      ndalPranine: ndalPranine,

      // Anëtarët (perdoruesit/*) me praninë, në kohë reale
      degjoAnetaret: function (cb, cbGabim) {
        return fs.onSnapshot(fs.collection(db, 'perdoruesit'), function (s) {
          cb(listaNga(s).map(function (x) {
            return { uid: x.id, emri: x.perdoruesi || x.emri || x.id, aktivSe: x.aktivSe || x.kycurSe || 0, online: x.online === true, platforma: x.platforma || '' };
          }));
        }, function (e) { if (cbGabim) cbGabim(e); });
      },

      // ---------- Aktiviteti ----------
      shtoNgjarje: async function (ng) {
        if (!uid()) return { ok: false, arsye: 'pa-hyrje' };
        try {
          var r = await fs.addDoc(fs.collection(db, 'ekipa_feed'), pastro(Object.assign({}, ng, { uid: uid(), emri: emri(), koha: Date.now() })));
          return { ok: true, id: r.id };
        } catch (e) { return gabim(e); }
      },
      degjoNgjarjet: function (cb, n, cbGabim) {
        var q = fs.query(fs.collection(db, 'ekipa_feed'), fs.orderBy('koha', 'desc'), fs.limit(n || 150));
        return fs.onSnapshot(q, function (s) { cb(listaNga(s)); }, function (e) { if (cbGabim) cbGabim(e); });
      },

      // ---------- Chat ----------
      dergoMesazh: async function (tekst) {
        tekst = String(tekst || '').trim().slice(0, 2000);
        if (!tekst) return { ok: false, arsye: 'bosh' };
        if (!uid()) return { ok: false, arsye: 'pa-hyrje' };
        try {
          var r = await fs.addDoc(fs.collection(db, 'ekipa_chat'), { uid: uid(), emri: emri(), tekst: tekst, koha: Date.now() });
          return { ok: true, id: r.id };
        } catch (e) { return gabim(e); }
      },
      degjoChatin: function (cb, n, cbGabim) {
        var q = fs.query(fs.collection(db, 'ekipa_chat'), fs.orderBy('koha', 'desc'), fs.limit(n || 150));
        return fs.onSnapshot(q, function (s) { cb(listaNga(s)); }, function (e) { if (cbGabim) cbGabim(e); });
      },
      fshijMesazhin: async function (id) {
        try { await fs.deleteDoc(fs.doc(db, 'ekipa_chat', id)); return { ok: true }; } catch (e) { return gabim(e); }
      },

      // ---------- Njoftimet personale ----------
      dergoNjoftim: async function (pronariUid, nj) {
        if (!uid()) return { ok: false, arsye: 'pa-hyrje' };
        try {
          await fs.addDoc(fs.collection(db, 'perdoruesit', pronariUid, 'njoftimet'),
            pastro(Object.assign({}, nj, { uid: uid(), emri: emri(), koha: Date.now(), lexuar: false })));
          return { ok: true };
        } catch (e) { return gabim(e); }
      },
      degjoNjoftimetEPalexuara: function (cb, cbGabim) {
        if (!uid()) return function () {};
        var q = fs.query(fs.collection(db, 'perdoruesit', uid(), 'njoftimet'), fs.where('lexuar', '==', false));
        return fs.onSnapshot(q, function (s) { cb(listaNga(s)); }, function (e) { if (cbGabim) cbGabim(e); });
      },
      merrNjoftimet: async function (n) {
        if (!uid()) return { ok: false, lista: [] };
        try {
          var s = await fs.getDocs(fs.query(fs.collection(db, 'perdoruesit', uid(), 'njoftimet'), fs.orderBy('koha', 'desc'), fs.limit(n || 40)));
          return { ok: true, lista: listaNga(s) };
        } catch (e) { var g = gabim(e); g.lista = []; return g; }
      },
      shenoTeLexuara: async function (ids) {
        if (!uid() || !ids || !ids.length) return { ok: true };
        try {
          var b = fs.writeBatch(db);
          ids.slice(0, 400).forEach(function (id) { b.update(fs.doc(db, 'perdoruesit', uid(), 'njoftimet', id), { lexuar: true }); });
          await b.commit();
          return { ok: true };
        } catch (e) { return gabim(e); }
      }
    };
  }

  // ======================================================================================
  // 2. Funksione të pastra
  // ======================================================================================
  function eshteOnline(a, tani) {
    tani = tani || Date.now();
    return !!a && a.online === true && (tani - (a.aktivSe || 0)) < ONLINE_MS;
  }

  function kohaRelative(ts, tani) {
    if (!ts) return '';
    tani = tani || Date.now();
    var d = tani - ts;
    if (d < 60000) return 'tani';
    if (d < 3600000) return 'para ' + Math.floor(d / 60000) + ' min';
    var dt = new Date(ts), sot = new Date(tani);
    var ora = dy(dt.getHours()) + ':' + dy(dt.getMinutes());
    if (isoDites(dt) === isoDites(sot)) return 'sot ' + ora;
    var dje = new Date(tani); dje.setDate(dje.getDate() - 1);
    if (isoDites(dt) === isoDites(dje)) return 'dje ' + ora;
    return dy(dt.getDate()) + '.' + dy(dt.getMonth() + 1) + (dt.getFullYear() !== sot.getFullYear() ? '.' + dt.getFullYear() : '') + ' ' + ora;
  }

  // Titulli i grupit të ditës në listat me kohë (aktiviteti, chat-i)
  function titulliDites(ts, tani) {
    tani = tani || Date.now();
    var dt = new Date(ts), sot = new Date(tani);
    if (isoDites(dt) === isoDites(sot)) return 'Sot';
    var dje = new Date(tani); dje.setDate(dje.getDate() - 1);
    if (isoDites(dt) === isoDites(dje)) return 'Dje';
    return dy(dt.getDate()) + '.' + dy(dt.getMonth() + 1) + '.' + dt.getFullYear();
  }

  function tekstiPranise(a, tani) {
    tani = tani || Date.now();
    if (eshteOnline(a, tani)) return 'Online tani';
    if (a && a.aktivSe) return 'Parë ' + kohaRelative(a.aktivSe, tani);
    return 'S\'është parë ende';
  }
  function tekstiPlatformes(p) { return p === 'pc' ? 'në kompjuter' : p === 'tel' ? 'në telefon' : ''; }

  // Heqjet nga rafti të bëra nga kolegët (nga aktiviteti) → afati tregohet "i hequr" te të gjithë,
  // edhe para se aplikacioni i pronarit ta ketë zbatuar në dyqanin e tij.
  function hartaEHeqjeve(ngjarjet) {
    var m = {};
    (ngjarjet || []).forEach(function (ng) {
      if (ng.lloji !== 'hequr' || !ng.pronariUid || !ng.afatId) return;
      var k = ng.pronariUid + '|' + ng.afatId;
      if (!m[k] || m[k].koha < ng.koha) m[k] = ng;
    });
    return m;
  }
  function mbivendosHeqjen(afat, pronariUid, harta) {
    var ng = harta && harta[pronariUid + '|' + afat.id];
    if (!ng || afat.statusi === 'hequr' || (afat.ndryshuarSe || 0) >= ng.koha) return afat;
    return Object.assign({}, afat, { statusi: 'hequr', hequrSe: ng.koha, hequrNga: ng.emri });
  }
  // A duhet ta zbatojë pronari heqjen që i dërgoi një koleg? Vetëm për afate të skaduara vërtet, dhe jo nëse
  // pronari e ka ndryshuar afatin pas heqjes (p.sh. e ktheu si aktiv).
  function duhetZbatuarHeqja(afat, nj) {
    if (!afat || !nj || afat.statusi === 'hequr') return false;
    if (AF().statusi(afat) !== 'skaduar') return false;
    return (afat.ndryshuarSe || 0) < (nj.koha || 0);
  }

  var RENDI_STATUSIT = { skaduar: 4, 'pa-date': 3, afer: 2, ok: 1, hequr: 0 };
  function statusiMeIKeq(lista) {
    var m = null;
    lista.forEach(function (a) { var s = AF().statusi(a); if (m === null || RENDI_STATUSIT[s] > RENDI_STATUSIT[m]) m = s; });
    return m;
  }

  // Kalendari i një muaji: çdo ditë me afatet që skadojnë atë ditë dhe ngjyrën (statusi më i keq i atyre ende në raft)
  function kalendari(afatet, viti, muaji, tani) {
    var sot = isoDites(new Date(tani || Date.now()));
    var sipasDites = {};
    (afatet || []).forEach(function (a) { if (a.data) (sipasDites[a.data] = sipasDites[a.data] || []).push(a); });
    var e1 = new Date(viti, muaji, 1);
    var zbrazet = (e1.getDay() + 6) % 7; // e hëna = kolona e parë
    var nDite = new Date(viti, muaji + 1, 0).getDate();
    var qelizat = [];
    var i;
    for (i = 0; i < zbrazet; i++) qelizat.push(null);
    for (var d = 1; d <= nDite; d++) {
      var iso = viti + '-' + dy(muaji + 1) + '-' + dy(d);
      var lista = sipasDites[iso] || [];
      var neRaft = lista.filter(function (a) { return AF().statusi(a) !== 'hequr'; });
      qelizat.push({
        iso: iso, dita: d, sot: iso === sot, afatet: lista, neRaft: neRaft.length,
        statusi: neRaft.length ? statusiMeIKeq(neRaft) : (lista.length ? 'hequr' : null)
      });
    }
    while (qelizat.length % 7) qelizat.push(null);
    var shuma = { skaduar: 0, afer: 0, ok: 0, hequr: 0 };
    qelizat.forEach(function (q) { if (q && q.statusi && shuma[q.statusi] !== undefined) shuma[q.statusi]++; });
    return { titulli: MUAJT[muaji] + ' ' + viti, viti: viti, muaji: muaji, qelizat: qelizat, ditet: DITET_SHKURT, ditetMeStatus: shuma };
  }

  // Statistikat e ekipës. anetaret: [{ uid, emri, afatet }] (afatet tashmë me heqjet e mbivendosura)
  function statistikat(anetaret, tani) {
    tani = tani || Date.now();
    var A = AF();
    var dt = new Date(tani);
    var fillimiMuajit = new Date(dt.getFullYear(), dt.getMonth(), 1).getTime();
    var para30 = tani - 30 * 86400000;
    var r = { aktive: 0, skaduara: 0, afer: 0, ok: 0, javes: 0, sot: 0, hequrMuajit: 0, hequrSot: 0, perAnetar: [], furnizuesit: [], heqesit: [] };
    var fur = {}, heq = {};
    var sotIso = isoDites(dt);
    (anetaret || []).forEach(function (m) {
      var x = { uid: m.uid, emri: m.emri, aktive: 0, skaduara: 0, afer: 0, hequr30: 0 };
      (m.afatet || []).forEach(function (a) {
        var st = A.statusi(a);
        if (st === 'hequr') {
          var hs = a.hequrSe || 0;
          if (hs >= fillimiMuajit) r.hequrMuajit++;
          if (hs && isoDites(new Date(hs)) === sotIso) r.hequrSot++;
          if (hs >= para30) {
            x.hequr30++;
            var kush = a.hequrNga || m.emri || '';
            if (kush) heq[kush] = (heq[kush] || 0) + 1;
          }
          return;
        }
        r.aktive++; x.aktive++;
        if (st === 'skaduar') { r.skaduara++; x.skaduara++; }
        else if (st === 'afer') { r.afer++; x.afer++; }
        else if (st === 'ok') r.ok++;
        var n = A.ditetDeri(a.data);
        if (n !== null && n >= 0 && n <= 7) r.javes++;
        if (n === 0) r.sot++;
        if ((st === 'skaduar' || st === 'afer') && a.furnizuesi) fur[a.furnizuesi] = (fur[a.furnizuesi] || 0) + 1;
      });
      r.perAnetar.push(x);
    });
    function rendit(h) { return Object.keys(h).map(function (k) { return { emri: k, n: h[k] }; }).sort(function (a, b) { return b.n - a.n || a.emri.localeCompare(b.emri, 'sq'); }).slice(0, 5); }
    r.furnizuesit = rendit(fur);
    r.heqesit = rendit(heq);
    r.perAnetar.sort(function (a, b) { return b.skaduara - a.skaduara || b.aktive - a.aktive || String(a.emri).localeCompare(String(b.emri), 'sq'); });
    return r;
  }

  // Teksti i një ngjarjeje të aktivitetit: { kush, cfare, detaje, lloji }
  function tekstiNgjarjes(ng, uidIm) {
    var kush = ng.uid === uidIm ? 'Ti' : (ng.emri || 'Dikush');
    var A = AF();
    var dataTx = ng.data && A ? A.formato(ng.data) : '';
    switch (ng.lloji) {
      case 'hequr':
        var iKujt = !ng.pronariUid || ng.pronariUid === ng.uid ? '' : (ng.pronariUid === uidIm ? 'produkt i yti' : 'i përket: ' + (ng.pronariEmri || 'kolegut'));
        return { lloji: 'hequr', kush: kush, cfare: (ng.uid === uidIm ? 'e hoqe' : 'e hoqi') + ' nga rafti: ' + (ng.produkti || ng.barkodi || 'produkt'),
          detaje: [iKujt, dataTx ? 'skadoi më ' + dataTx : '', ng.sasia ? ng.sasia + ' copë' : ''].filter(Boolean).join(' · ') };
      case 'lajmeruar':
        return { lloji: 'lajmeruar', kush: kush, cfare: (ng.uid === uidIm ? 'e lajmërove' : 'e lajmëroi') + ' furnizuesin' + (ng.furnizuesi ? ' ' + ng.furnizuesi : ''),
          detaje: ng.n ? ng.n + (ng.n === 1 ? ' produkt afër skadimit' : ' produkte afër skadimit') : '' };
      case 'afate-te-reja':
        return { lloji: 'afate-te-reja', kush: kush, cfare: (ng.uid === uidIm ? 'shtove ' : 'shtoi ') + (ng.n || 1) + ((ng.n || 1) === 1 ? ' afat të ri' : ' afate të reja'),
          detaje: ng.ngaFoto ? 'nga fleta e fotografuar' : '' };
      case 'rikthyer':
        return { lloji: 'rikthyer', kush: kush, cfare: (ng.uid === uidIm ? 'e ktheve' : 'e ktheu') + ' në raft: ' + (ng.produkti || ng.barkodi || 'produkt'), detaje: '' };
      case 'anetar-i-ri':
        return { lloji: 'anetar-i-ri', kush: kush, cfare: ng.uid === uidIm ? 'u bashkove me ekipën' : 'u bashkua me ekipën', detaje: '' };
      default:
        return { lloji: ng.lloji || '', kush: kush, cfare: ng.tekst || '', detaje: '' };
    }
  }

  // Teksti i një njoftimi personal (zilja + njoftimi i sistemit)
  function tekstiNjoftimit(nj) {
    if (nj.lloji === 'hequr') {
      var A = AF();
      return (nj.emri || 'Një koleg') + ' e hoqi nga rafti: ' + (nj.produkti || nj.barkodi || 'produkt') +
        (nj.data && A ? ' (skadoi më ' + A.formato(nj.data) + ')' : '');
    }
    return nj.tekst || '';
  }

  // ======================================================================================
  // 3. Kontrolluesi — gjendja + dëgjuesit; faqja vetëm vizaton
  // ======================================================================================
  // o = {
  //   cloud()        → window.__stokuCloud
  //   uidIm()        → uid i llogarisë aktuale (ose null)
  //   emriIm()       → emri i përdoruesit aktual
  //   afatetEMia()   → afatet lokale (të freskëta, pa pritur cloud-in)
  //   zbatoHeqjet(lista) → pronari zbaton heqjet e kolegëve në dyqanin e vet
  //   njofto({ titulli, teksti, tag, pamja }) → njoftim i sistemit (nëse lejohet)
  //   ndryshoi(cfare) → rivizato
  // }
  var KEY_CHAT_LEXUAR = 'stoku:ekipa:chat-lexuar';
  var KEY_NJOFTUAR = 'stoku:ekipa:njoftuar';

  function krijoKontrollues(o) {
    var gj = {
      anetaret: [], dyqanet: {}, ngarkuarSe: 0, dukeNgarkuar: false, gabimNgarkimi: '',
      ngjarjet: [], ngjarjetGati: false, chat: [], chatGati: false, chatHapur: false,
      njoftimetPalexuara: [], mesazhiFundit: null, hapur: false
    };
    var d = {};
    var chatNisurSe = 0, rifreskimKohez = {}, afateTeReja = { n: 0, ngaFoto: false, kohez: null };

    function E() { var c = o.cloud && o.cloud(); return (c && c.ekipa) || null; }
    function ndal(k) { if (d[k]) { try { d[k](); } catch (e) { /* ok */ } d[k] = null; } }
    function lexo(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function shkruaj(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ok */ } }
    function thirr(cfare) { try { o.ndryshoi(cfare); } catch (e) { if (root.console) console.error(e); } }

    // ---------- Njoftimet e sistemit: secila vetëm një herë ----------
    function uNjoftua(id) {
      var l = []; try { l = JSON.parse(lexo(KEY_NJOFTUAR) || '[]'); } catch (e) { l = []; }
      if (l.indexOf(id) !== -1) return true;
      l.push(id); if (l.length > 200) l = l.slice(-200);
      shkruaj(KEY_NJOFTUAR, JSON.stringify(l));
      return false;
    }

    // ---------- Gjithmonë, sa kohë je i kyçur ----------
    function nisGjithmone() {
      var e = E();
      ndalGjithmone(true);
      if (!e || !o.uidIm()) return;
      e.nisPranine();
      d.njoftimet = e.degjoNjoftimetEPalexuara(function (lista) {
        lista.sort(function (a, b) { return (b.koha || 0) - (a.koha || 0); });
        gj.njoftimetPalexuara = lista;
        var heqjet = lista.filter(function (n) { return n.lloji === 'hequr'; });
        if (heqjet.length && o.zbatoHeqjet) { try { o.zbatoHeqjet(heqjet); } catch (er) { /* ok */ } }
        lista.forEach(function (n) {
          if (uNjoftua('nj:' + n.id)) return;
          if ((Date.now() - (n.koha || 0)) < 2 * 86400000 && o.njofto) o.njofto({ titulli: 'Stoku · Ekipa', teksti: tekstiNjoftimit(n), tag: 'ek-nj-' + n.id, pamja: 'njoftimet' });
        });
        thirr('njoftimet');
      }, function () { /* p.sh. rregullat ende pa u vendosur — thjesht s'ka njoftime */ });
      chatNisurSe = Date.now();
      d.chatFundit = e.degjoChatin(function (lista) {
        var m = lista[0] || null;
        gj.mesazhiFundit = m;
        if (m && m.uid !== o.uidIm() && m.koha > chatNisurSe - 5000 && !uNjoftua('ch:' + m.id)) {
          var neChat = gj.chatHapur && !document.hidden;
          if (!neChat && o.njofto) o.njofto({ titulli: (m.emri || 'Ekipa') + ' · Chat', teksti: m.tekst, tag: 'ek-chat', pamja: 'chat' });
        }
        if (gj.chatHapur && !document.hidden) shenoChatinTeLexuar();
        thirr('chat-fundit');
      }, 1, function () { /* ok */ });
      if (gj.hapur) hap(); // Ekipa ishte e hapur kur u hyr në llogari → lidhu tani
    }
    function ndalGjithmone(vetemDegjuesit) {
      ndal('njoftimet'); ndal('chatFundit');
      if (!vetemDegjuesit) {
        var e = E(); if (e) e.ndalPranine();
        mbyll();
        gj.njoftimetPalexuara = []; gj.mesazhiFundit = null; gj.dyqanet = {}; gj.ngarkuarSe = 0; gj.anetaret = [];
        gj.ngjarjet = []; gj.ngjarjetGati = false; gj.chat = []; gj.chatGati = false;
        thirr('te-gjitha');
      }
    }

    // ---------- Kur hapet tabi Ekipa ----------
    function hap() {
      var e = E();
      gj.hapur = true;
      if (!e || !o.uidIm()) { thirr('te-gjitha'); return; }
      if (!d.anetaret) {
        d.anetaret = e.degjoAnetaret(function (lista) {
          var kishte = gj.anetaret.length;
          gj.anetaret = lista;
          if (!kishte || (!gj.ngarkuarSe && !gj.dukeNgarkuar)) ngarkoDyqanet();
          else if (gj.ngarkuarSe && !gj.dukeNgarkuar) {
            // Një anëtar i ri u bashkua ndërkohë → merr vetëm afatet e tij
            lista.forEach(function (a) { if (a.uid !== o.uidIm() && !gj.dyqanet[a.uid]) rifreskoDyqanin(a.uid); });
          }
          thirr('anetaret');
        }, function () { gj.gabimNgarkimi = 'rregullat'; thirr('anetaret'); });
      } else if (Date.now() - gj.ngarkuarSe > 3 * 60 * 1000) {
        ngarkoDyqanet();
      }
      if (!d.ngjarjet) {
        d.ngjarjet = e.degjoNgjarjet(function (lista) {
          var teRejaNgaTjeret = gj.ngjarjetGati ? lista.filter(function (ng) {
            return ng.uid !== o.uidIm() && !gj.ngjarjet.some(function (x) { return x.id === ng.id; });
          }) : [];
          gj.ngjarjet = lista;
          gj.ngjarjetGati = true;
          // Një koleg shtoi afate ose hoqi të vetat → rifresko vetëm dyqanin e tij
          teRejaNgaTjeret.forEach(function (ng) {
            if (ng.lloji === 'afate-te-reja' || ng.lloji === 'rikthyer' || (ng.lloji === 'hequr' && ng.pronariUid === ng.uid)) rifreskoDyqanin(ng.uid);
          });
          thirr('ngjarjet');
        }, 150, function () { gj.ngjarjetGati = true; thirr('ngjarjet'); });
      }
      thirr('te-gjitha');
    }
    function mbyll() {
      gj.hapur = false;
      ndal('anetaret'); ndal('ngjarjet');
      mbyllChatin();
    }

    // ---------- Afatet e secilit (lexim, jo dëgjim: stoku ndryshon shpesh, s'ia vlen) ----------
    async function ngarkoDyqanet() {
      var c = o.cloud && o.cloud();
      if (!c || !c.merrDyqaninEPerdoruesit || gj.dukeNgarkuar) return;
      gj.dukeNgarkuar = true; gj.gabimNgarkimi = '';
      thirr('dyqanet');
      var uidIm = o.uidIm();
      var tjeret = gj.anetaret.filter(function (a) { return a.uid !== uidIm; });
      var rez = await Promise.all(tjeret.map(function (a) { return c.merrDyqaninEPerdoruesit(a.uid); }));
      rez.forEach(function (r, i) {
        var g = r && r.ok && r.gjendja;
        if (g) gj.dyqanet[tjeret[i].uid] = { afatet: g.afatet || [], merrurSe: Date.now() };
        else if (!gj.dyqanet[tjeret[i].uid]) gj.dyqanet[tjeret[i].uid] = { afatet: [], merrurSe: 0, gabim: true };
      });
      gj.ngarkuarSe = Date.now();
      gj.dukeNgarkuar = false;
      thirr('dyqanet');
    }
    function rifreskoDyqanin(uid) {
      clearTimeout(rifreskimKohez[uid]);
      rifreskimKohez[uid] = setTimeout(async function () {
        var c = o.cloud && o.cloud();
        if (!c || !c.merrDyqaninEPerdoruesit) return;
        var r = await c.merrDyqaninEPerdoruesit(uid);
        if (r && r.ok && r.gjendja) { gj.dyqanet[uid] = { afatet: r.gjendja.afatet || [], merrurSe: Date.now() }; thirr('dyqanet'); }
      }, 2500);
    }

    // Anëtarët me afatet e tyre (heqjet e kolegëve të mbivendosura); i imi nga të dhënat lokale
    function anetaretMeAfate() {
      var uidIm = o.uidIm();
      var harta = hartaEHeqjeve(gj.ngjarjet);
      var lista = gj.anetaret.slice();
      if (uidIm && !lista.some(function (a) { return a.uid === uidIm; })) lista.push({ uid: uidIm, emri: o.emriIm(), aktivSe: Date.now(), online: true });
      return lista.map(function (a) {
        var burimi = a.uid === uidIm ? (o.afatetEMia() || []) : ((gj.dyqanet[a.uid] && gj.dyqanet[a.uid].afatet) || []);
        return Object.assign({}, a, {
          uneJam: a.uid === uidIm,
          ngarkuar: a.uid === uidIm || !!gj.dyqanet[a.uid],
          afatet: burimi.map(function (af) {
            return Object.assign(mbivendosHeqjen(af, a.uid, harta), { pronariUid: a.uid, pronariEmri: a.emri });
          })
        });
      }).sort(function (x, y) {
        if (x.uneJam !== y.uneJam) return x.uneJam ? -1 : 1;
        var ox = eshteOnline(x), oy = eshteOnline(y);
        if (ox !== oy) return ox ? -1 : 1;
        return String(x.emri).localeCompare(String(y.emri), 'sq');
      });
    }

    // ---------- Heqja nga rafti ----------
    // afat: nga anetaretMeAfate() (ka pronariUid/pronariEmri). Për të miat, faqja thërret shenoHequr e vet.
    async function heqAfatinEKolegut(afat) {
      var e = E();
      if (!e) return { ok: false, arsye: 'pa-lidhje' };
      var r = await e.dergoNjoftim(afat.pronariUid, {
        lloji: 'hequr', afatId: afat.id, produkti: afat.emri || afat.barkodi || '', barkodi: afat.barkodi || '', data: afat.data || ''
      });
      if (!r.ok) return r;
      var ng = { lloji: 'hequr', pronariUid: afat.pronariUid, pronariEmri: afat.pronariEmri || '', afatId: afat.id,
        produkti: afat.emri || afat.barkodi || '', barkodi: afat.barkodi || '', data: afat.data || '', sasia: typeof afat.sasia === 'number' ? afat.sasia : undefined };
      // Shfaqet menjëherë si i hequr (pa pritur dëgjuesin e aktivitetit)
      gj.ngjarjet = [Object.assign({ id: 'lokal-' + Date.now(), uid: o.uidIm(), emri: o.emriIm(), koha: Date.now() }, ng)].concat(gj.ngjarjet);
      thirr('ngjarjet');
      e.shtoNgjarje(ng);
      return { ok: true };
    }

    // ---------- Aktiviteti nga faqja (heqje e vetes, lajmërim, afate të reja) ----------
    function ngjarje(ng) {
      var e = E();
      if (!e || !o.uidIm()) return;
      e.shtoNgjarje(ng);
    }
    // Afatet e reja mblidhen 20 s, që "shtoi 12 afate" të dalë një herë, jo 12 herë
    function afateTeRejaU(n, ngaFoto) {
      if (!n || !E() || !o.uidIm()) return;
      afateTeReja.n += n;
      afateTeReja.ngaFoto = afateTeReja.ngaFoto || !!ngaFoto;
      clearTimeout(afateTeReja.kohez);
      afateTeReja.kohez = setTimeout(dergoAfateTeReja, 20000);
    }
    function dergoAfateTeReja() {
      clearTimeout(afateTeReja.kohez); afateTeReja.kohez = null;
      if (!afateTeReja.n) return;
      ngjarje({ lloji: 'afate-te-reja', n: afateTeReja.n, ngaFoto: afateTeReja.ngaFoto });
      afateTeReja.n = 0; afateTeReja.ngaFoto = false;
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', dergoAfateTeReja);
      document.addEventListener('visibilitychange', function () { if (document.hidden) dergoAfateTeReja(); });
    }

    // ---------- Chat ----------
    function hapChatin() {
      var e = E();
      gj.chatHapur = true;
      if (!e) { thirr('chat'); return; }
      if (!d.chat) {
        d.chat = e.degjoChatin(function (lista) {
          gj.chat = lista.slice().reverse(); // më i vjetri lart
          gj.chatGati = true;
          if (gj.chatHapur && !document.hidden) shenoChatinTeLexuar();
          thirr('chat');
        }, 150, function () { gj.chatGati = true; thirr('chat'); });
      }
      shenoChatinTeLexuar();
      thirr('chat');
    }
    function mbyllChatin() { gj.chatHapur = false; ndal('chat'); }
    function shenoChatinTeLexuar() {
      var m = gj.mesazhiFundit || gj.chat[gj.chat.length - 1];
      if (m && m.koha) { shkruaj(KEY_CHAT_LEXUAR, String(m.koha)); thirr('chat-fundit'); }
    }
    function kaChatTePalexuar() {
      var m = gj.mesazhiFundit;
      if (!m || m.uid === o.uidIm()) return false;
      return (Number(lexo(KEY_CHAT_LEXUAR)) || 0) < (m.koha || 0);
    }
    async function dergoMesazh(tekst) {
      var e = E();
      if (!e) return { ok: false, arsye: 'pa-lidhje' };
      return e.dergoMesazh(tekst);
    }
    async function fshijMesazhin(id) { var e = E(); return e ? e.fshijMesazhin(id) : { ok: false }; }

    // ---------- Zilja ----------
    async function merrNjoftimet() {
      var e = E();
      if (!e) return [];
      var r = await e.merrNjoftimet(40);
      var lista = (r && r.lista) || [];
      var heqjet = lista.filter(function (n) { return n.lloji === 'hequr'; });
      if (heqjet.length && o.zbatoHeqjet) { try { o.zbatoHeqjet(heqjet); } catch (er) { /* ok */ } }
      return lista;
    }
    async function shenoNjoftimetTeLexuara() {
      var e = E();
      var ids = gj.njoftimetPalexuara.map(function (n) { return n.id; });
      if (!e || !ids.length) return;
      gj.njoftimetPalexuara = [];
      thirr('njoftimet');
      await e.shenoTeLexuara(ids);
    }

    return {
      gj: gj,
      nisGjithmone: nisGjithmone, ndalGjithmone: ndalGjithmone,
      hap: hap, mbyll: mbyll, ngarkoDyqanet: ngarkoDyqanet,
      anetaretMeAfate: anetaretMeAfate,
      heqAfatinEKolegut: heqAfatinEKolegut,
      ngjarje: ngjarje, afateTeReja: afateTeRejaU,
      hapChatin: hapChatin, mbyllChatin: mbyllChatin, kaChatTePalexuar: kaChatTePalexuar, shenoChatinTeLexuar: shenoChatinTeLexuar,
      dergoMesazh: dergoMesazh, fshijMesazhin: fshijMesazhin,
      merrNjoftimet: merrNjoftimet, shenoNjoftimetTeLexuara: shenoNjoftimetTeLexuara,
      numriNjoftimeve: function () { return gj.njoftimetPalexuara.length; },
      kaLidhje: function () { return !!E() && !!o.uidIm(); }
    };
  }

  var api = {
    ONLINE_MS: ONLINE_MS, MUAJT: MUAJT, DITET_SHKURT: DITET_SHKURT,
    krijoCloud: krijoCloud, krijoKontrollues: krijoKontrollues,
    eshteOnline: eshteOnline, kohaRelative: kohaRelative, titulliDites: titulliDites,
    tekstiPranise: tekstiPranise, tekstiPlatformes: tekstiPlatformes,
    hartaEHeqjeve: hartaEHeqjeve, mbivendosHeqjen: mbivendosHeqjen, duhetZbatuarHeqja: duhetZbatuarHeqja,
    kalendari: kalendari, statistikat: statistikat, tekstiNgjarjes: tekstiNgjarjes, tekstiNjoftimit: tekstiNjoftimit,
    isoDites: isoDites
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.StokuEkipa = api;
})(typeof self !== 'undefined' ? self : this);
