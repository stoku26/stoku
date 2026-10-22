// v238: u nxor nga pc.html (CSP pa 'unsafe-inline': faqet s'kanë më skripta të brendshme). Kur ndryshon, rrite ?v= te pc.html dhe sw.js.
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }
  function el(tag, klasa, tekst) {
    var e = document.createElement(tag);
    if (klasa) e.className = klasa;
    if (tekst !== undefined && tekst !== null) e.textContent = tekst;
    return e;
  }
  var IKONA = {
    ndrysho: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>',
    zhvendos: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"></path><path d="m12 11 3 2-3 2"></path><path d="M8 13h7"></path></svg>',
    fshij: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path></svg>',
    folder: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"></path></svg>',
    kap: '<svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden="true"><circle cx="2.5" cy="3" r="1.4"></circle><circle cx="7.5" cy="3" r="1.4"></circle><circle cx="2.5" cy="8" r="1.4"></circle><circle cx="7.5" cy="8" r="1.4"></circle><circle cx="2.5" cy="13" r="1.4"></circle><circle cx="7.5" cy="13" r="1.4"></circle></svg>',
    me: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2"></circle><circle cx="12" cy="12" r="2"></circle><circle cx="19" cy="12" r="2"></circle></svg>',
    zero: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M5.6 5.6l12.8 12.8"></path></svg>',
    pak: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 2 21h20Z"></path><path d="M12 10v4"></path></svg>'
  };

  // ================= Formatimet =================
  var NF = (function () { try { return new Intl.NumberFormat('sq-AL'); } catch (e) { return null; } })();
  function num(n) { return NF ? NF.format(n) : String(n); }
  function dy(n) { return (n < 10 ? '0' : '') + n; }
  function dataOra(ms) {
    if (!ms) return '';
    var d = new Date(ms);
    return dy(d.getDate()) + '.' + dy(d.getMonth() + 1) + '.' + d.getFullYear() + ' ' + dy(d.getHours()) + ':' + dy(d.getMinutes());
  }
  function kohaRelative(ms) {
    if (!ms) return '–';
    var tani = Date.now(), dif = Math.max(0, tani - ms);
    var d = new Date(ms), sot = new Date(); sot.setHours(0, 0, 0, 0);
    if (dif < 60000) return 'tani';
    if (dif < 3600000) return 'para ' + Math.floor(dif / 60000) + ' min';
    if (ms >= sot.getTime()) return 'sot ' + dy(d.getHours()) + ':' + dy(d.getMinutes());
    if (ms >= sot.getTime() - 86400000) return 'dje ' + dy(d.getHours()) + ':' + dy(d.getMinutes());
    return dy(d.getDate()) + '.' + dy(d.getMonth() + 1) + '.' + d.getFullYear();
  }
  function produkteTekst(n) { return num(n) + ' ' + (n === 1 ? 'produkt' : 'produkte'); }
  // v215: numri me emrin në njëjës ose shumës ("1 afat", "3 afate")
  function nrEmer(n, nje, shume) { return num(n) + ' ' + (n === 1 ? nje : shume); }
  function normalizo(s) {
    return String(s || '').toLowerCase().replace(/ë/g, 'e').replace(/ç/g, 'c');
  }

  // ================= Baza lokale (e njëjta me versionin e telefonit) =================
  var KEY_FOLDERA = 'stoku:foldera:v1';
  var KEY_PRODUKTET = 'stoku:produktet:v2';
  var KEY_FSHIRE = 'stoku:fshira:v1';
  var KEY_RENDI_KOHA = 'stoku:rendi-foldera-koha';
  var KEY_PC = 'stoku:pc:opsione:v1';
  var FOLDERAT_PARAZGJEDHUR = [
    { id: 'ushqimore', emri: 'Ushqimore' }, { id: 'pije', emri: 'Pije' },
    { id: 'higjiene', emri: 'Higjiene' }, { id: 'fresh', emri: 'Fresh' }
  ];
  var MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  var foldera = [];
  var produktet = {};
  var fshira = { produktet: {}, foldera: {}, afatet: {}, marketet: {} };
  var afatet = [];
  var KEY_AFATET = 'stoku:afatet:v1';
  // v241: marketet (marketet.js): lista sinkronizohet si folderat; marketi i zgjedhur është i këtij kompjuteri
  var MK = window.StokuMarketet;
  var marketet = [];
  var marketiAktiv = MK.lexoAktivin();
  var rendiFolderaveKoha = 0;
  // Instalim i ri (asnjë e dhënë ende): "Çka ka të re" s'ka kuptim — shënohet si e parë pa u treguar
  var __pajisjeERe = false;
  try { __pajisjeERe = !localStorage.getItem(KEY_FOLDERA); } catch (e) { /* ok */ } // folderat shkruhen që në hapjen e parë të çdo versioni
  // Prova si vizitor (porta.js, v217): të dhënat e kësaj faqeje janë shembull, të asnjë llogarie: s'sinkronizohen kurrë dhe
  // s'shkojnë te Grupi. Hyrja me llogari bëhet te porta (ajo i fshin dhe e rinis faqen).
  function ngaVizitori() { return !!(window.StokuPorta && window.StokuPorta.ngaVizitori && window.StokuPorta.ngaVizitori()); }

  function celesi(kid, b) { return kid + '::' + b; }

  function lexoJSON(k, parazgjedhur) {
    try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v === null ? parazgjedhur : v; } catch (e) { return parazgjedhur; }
  }

  function ngarkoBazen() {
    var f = lexoJSON(KEY_FOLDERA, null), p = lexoJSON(KEY_PRODUKTET, null);
    if (Array.isArray(f) && p && typeof p === 'object') {
      // Një rresht i dëmtuar (null, pa id…) hiqet, që të mos e rrëzojë krejt faqen
      foldera = window.StokuBashkimi.pastroFolderat(f);
      produktet = {};
      window.StokuBashkimi.pastroProduktet(Object.keys(p).map(function (k) { return p[k]; })).forEach(function (x) { produktet[celesi(x.kategoriaId, x.barkodi)] = x; });
    }
    else {
      foldera = FOLDERAT_PARAZGJEDHUR.map(function (x) { return { id: x.id, emri: x.emri }; });
      produktet = {};
      try {
        localStorage.setItem(KEY_FOLDERA, JSON.stringify(foldera));
        localStorage.setItem(KEY_PRODUKTET, JSON.stringify(produktet));
      } catch (e) { /* ok */ }
    }
    var t = lexoJSON(KEY_FSHIRE, null);
    fshira = {
      produktet: (t && t.produktet && typeof t.produktet === 'object') ? t.produktet : {},
      foldera: (t && t.foldera && typeof t.foldera === 'object') ? t.foldera : {},
      afatet: (t && t.afatet && typeof t.afatet === 'object') ? t.afatet : {},
      marketet: (t && t.marketet && typeof t.marketet === 'object') ? t.marketet : {}
    };
    marketet = MK.pastro(lexoJSON(MK.KEY_LISTA, []));
    var af0 = lexoJSON(KEY_AFATET, []);
    afatet = window.StokuBashkimi.pastroAfatet(af0);
    rendiFolderaveKoha = parseInt(localStorage.getItem(KEY_RENDI_KOHA) || '0', 10) || 0;
  }

  function shkruajLokalisht() {
    try {
      localStorage.setItem(KEY_FOLDERA, JSON.stringify(foldera));
      localStorage.setItem(KEY_PRODUKTET, JSON.stringify(produktet));
      localStorage.setItem(KEY_FSHIRE, JSON.stringify(fshira));
      localStorage.setItem(KEY_RENDI_KOHA, String(rendiFolderaveKoha || 0));
      localStorage.setItem(KEY_AFATET, JSON.stringify(afatet));
      localStorage.setItem(MK.KEY_LISTA, JSON.stringify(marketet));
      dergoAfatetPerNjoftiminDitor();
      if (typeof planifikoMesimin === 'function') planifikoMesimin();
      return true;
    } catch (e) {
      toast('Ruajtja dështoi: memoria e shfletuesit është plot.');
      return false;
    }
  }

  // Njoftimi ditor (te telefoni) e merr listën e afateve nga serveri: edhe ndryshimet e bëra këtu i dërgohen atij.
  var afatetDitorKohez = null;
  function dergoAfatetPerNjoftiminDitor() {
    clearTimeout(afatetDitorKohez);
    afatetDitorKohez = setTimeout(function () {
      var e = window.__stokuCloud && window.__stokuCloud.ekipa;
      // v231: pa lejen "Afatet" serveri merr listë bosh (s'vjen njoftimi ditor, ora s'tregon produkte)
      if (e && e.dergoAfatetPerOrarin && perdoruesi()) e.dergoAfatetPerOrarin(lejaELlogarise('afatet') ? MK.meEmra(afatet, marketet) : []).catch(function () { /* ok */ });
    }, 4000);
  }

  // Çdo ndryshim i përdoruesit kalon këtu: ruhet, rivizatohet dhe sinkronizohet.
  function ruaj() {
    if (!shkruajLokalisht()) return;
    rivizato();
    planifikoSinkronizimin();
  }

  ngarkoBazen();
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* ok */ }

  // Një skedë tjetër e këtij shfletuesi (p.sh. versioni i telefonit) ndryshoi të dhënat: rilexo.
  window.addEventListener('storage', function (e) {
    if ([KEY_FOLDERA, KEY_PRODUKTET, KEY_FSHIRE, KEY_RENDI_KOHA, KEY_AFATET].indexOf(e.key) === -1) return;
    ngarkoBazen();
    rivizato();
  });

  // ================= Opsionet e kompjuterit =================
  var ops = { tema: 'auto', dendesia: 'normale', madhesia: 'normale', rendi: 'koha:-1', madhFaqes: 100 };
  (function () {
    var o = lexoJSON(KEY_PC, null);
    if (!o || typeof o !== 'object') return;
    if (['auto', 'light', 'dark'].indexOf(o.tema) !== -1) ops.tema = o.tema;
    if (['kompakte', 'normale', 'gjere'].indexOf(o.dendesia) !== -1) ops.dendesia = o.dendesia;
    if (o.madhesia === 'e_madhe' || o.madhesia === 'normale') ops.madhesia = o.madhesia;
    if (typeof o.rendi === 'string' && /^(koha|emri|sasia|barkodi|folderi):-?1$/.test(o.rendi)) ops.rendi = o.rendi;
    if ([0, 50, 100, 250, 500].indexOf(o.madhFaqes) !== -1) ops.madhFaqes = o.madhFaqes;
  })();
  function ruajOps() { try { localStorage.setItem(KEY_PC, JSON.stringify(ops)); } catch (e) { /* ok */ } }

  function temaEfektive() {
    if (ops.tema !== 'auto') return ops.tema;
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }
  function zbatoPamjen() {
    var r = document.documentElement;
    var t = temaEfektive();
    r.setAttribute('data-tema', t);
    r.removeAttribute('data-aksent'); // "Ngjyra kryesore" u hoq në v128
    if (ops.dendesia === 'normale') r.removeAttribute('data-dendesia'); else r.setAttribute('data-dendesia', ops.dendesia);
    if (ops.madhesia === 'e_madhe') r.setAttribute('data-madhesi', 'e_madhe'); else r.removeAttribute('data-madhesi');
    $('metaTema').setAttribute('content', t === 'dark' ? '#0f1115' : '#f6f5f2');
    // Çelësi i shpejtë "Tema" në fund të anësores
    Array.prototype.forEach.call(document.querySelectorAll('#sbpTema button'), function (b) {
      b.setAttribute('aria-pressed', b.dataset.v === t ? 'true' : 'false');
    });
  }
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var ndryshoiSistemi = function () { if (ops.tema === 'auto') zbatoPamjen(); };
    if (mq.addEventListener) mq.addEventListener('change', ndryshoiSistemi); else if (mq.addListener) mq.addListener(ndryshoiSistemi);
  }
  zbatoPamjen();

  // ================= Toast (me "Zhbëj") =================
  var toastKohe = null, toastVeprimi = null;
  function toast(mesazh, opsionet) {
    opsionet = opsionet || {};
    $('toastTekst').textContent = mesazh;
    var b = $('toastBtn');
    toastVeprimi = opsionet.veprimi || null;
    b.classList.toggle('fsheh', !toastVeprimi);
    b.textContent = opsionet.butoni || 'Zhbëj';
    $('toast').classList.add('hapur');
    clearTimeout(toastKohe);
    toastKohe = setTimeout(mbyllToast, opsionet.ms || (toastVeprimi ? 9000 : 3200));
  }
  function mbyllToast() { $('toast').classList.remove('hapur'); toastVeprimi = null; }
  $('toastBtn').addEventListener('click', function () {
    var v = toastVeprimi;
    mbyllToast();
    if (v) v();
  });

  // ================= Ndryshimet me mundësi zhbërjeje =================
  // Çdo veprim që prek të dhënat kalon nga ndrysho(): mban mend gjendjen e mëparshme të çdo produkti
  // dhe folderi të prekur, që "Zhbëj" ta kthejë saktësisht (edhe pasi është sinkronizuar në cloud).
  function kopje(o) { return o ? JSON.parse(JSON.stringify(o)) : o; }
  function ndrysho(fn) {
    var reg = { produktet: {}, foldera: kopje(foldera) };
    var api = {
      vendos: function (k, p) {
        if (!(k in reg.produktet)) reg.produktet[k] = kopje(produktet[k] || null);
        produktet[k] = p;
        delete fshira.produktet[k];
      },
      fshij: function (k) {
        if (!produktet[k]) return;
        if (!(k in reg.produktet)) reg.produktet[k] = kopje(produktet[k]);
        delete produktet[k];
        fshira.produktet[k] = Date.now();
      }
    };
    fn(api);
    // Folderat që i preku vetë ky veprim (zhbërja prek vetëm këta, jo ato që u krijuan/renditën më pas)
    var paraIds = {}, pasIds = {};
    reg.foldera.forEach(function (f) { paraIds[f.id] = true; });
    foldera.forEach(function (f) { pasIds[f.id] = true; });
    reg.folderaTeKrijuar = foldera.filter(function (f) { return !paraIds[f.id]; }).map(function (f) { return f.id; });
    reg.folderaTeFshire = reg.foldera.map(function (f, i) { return { f: f, i: i }; }).filter(function (x) { return !pasIds[x.f.id]; });
    ruaj();
    return reg;
  }
  function zhbej(reg) {
    var tani = Date.now();
    ndrysho(function (api) {
      // 1) Produktet: secili kthehet si ishte (me kohë të re, që të fitojë edhe në cloud).
      Object.keys(reg.produktet).forEach(function (k) {
        var para = reg.produktet[k];
        if (para) { para.prekurSe = tani; api.vendos(k, para); }
        else api.fshij(k);
      });
      // 2) Folderat: vetëm ata që i preku vetë veprimi. Të fshirët ringjallen në vendin e tyre; ata që i krijoi veprimi
      //    (p.sh. importi) hiqen vetëm nëse kanë mbetur bosh. Një folder i krijuar pas veprimit (këtu ose nga një pajisje
      //    tjetër) dhe renditja e re e folderave mbeten siç janë.
      var krijuar = {};
      (reg.folderaTeKrijuar || []).forEach(function (id) { krijuar[id] = true; });
      var renditur = foldera.filter(function (f) {
        if (!krijuar[f.id] || produktetEFolderit(f.id).length) return true;
        fshira.foldera[f.id] = tani;
        return false;
      });
      (reg.folderaTeFshire || []).forEach(function (x) {
        if (renditur.some(function (f) { return f.id === x.f.id; })) return;
        var f = x.f; f.ndryshuarSe = tani; delete fshira.foldera[f.id];
        renditur.splice(Math.min(x.i, renditur.length), 0, f);
      });
      foldera = renditur;
    });
    toast('U zhbë.');
  }

  // ================= Ndihmëse për të dhënat =================
  function folderSipasId(id) { for (var i = 0; i < foldera.length; i++) if (foldera[i].id === id) return foldera[i]; return null; }
  // Ngjyra e folderit (dizajni): me radhë sipas renditjes së folderave; përdoret te anësorja, shiritat dhe tabela
  var NGJYRAT_FOLDERAVE = ['#5b86c9', '#4f9a6e', '#c08a3e', '#c46a5f', '#8a6cc0', '#b85f7c', '#6f9a45', '#b27a45'];
  function ngjyraEFolderit(id) {
    var ind = -1;
    foldera.some(function (f, k) { if (f.id === id) { ind = k; return true; } return false; });
    return ind < 0 ? '' : NGJYRAT_FOLDERAVE[ind % NGJYRAT_FOLDERAVE.length];
  }
  function folderCip(id, tekst) {
    var c = el('span', 'folder-cip', tekst === undefined ? emriFolderit(id) : tekst);
    var ng = ngjyraEFolderit(id);
    if (ng) c.style.setProperty('--f', ng);
    return c;
  }
  function emriFolderit(id) { var f = folderSipasId(id); return f ? f.emri : '(pa folder)'; }
  function teGjithaProduktet() { return Object.keys(produktet).map(function (k) { return produktet[k]; }); }
  function produktetEFolderit(id) { return teGjithaProduktet().filter(function (p) { return p.kategoriaId === id; }); }
  function eshteZero(p) { return (p.sasia | 0) <= 0; }
  // barkodi → [produkte në foldera të ndryshëm]
  function hartaEBarkodeve() {
    var h = {};
    teGjithaProduktet().forEach(function (p) { (h[p.barkodi] = h[p.barkodi] || []).push(p); });
    return h;
  }
  // Sasia e shpejtë (+/-). v240: leje si të tjerat (Cilësimet → Përdoruesit, "stokuPlusMinus"), e lejuar për krejt
  // llogaritë, vizitorin dhe llogaritë e reja; më parë e jepte pronari i grupit (kolona "+/-" te Grupi)
  function eLejuarSasiaShpejte() {
    return leja('stokuNdrysho') && leja('stokuPlusMinus');
  }
  try { localStorage.removeItem('stoku:leja:sasia-shpejte'); } catch (e) { /* ok */ } // leja e vjetër (para v240)

  // ================= Lejet e llogarisë (v230, lejet.js) =================
  // Çka mund të përdorë kjo llogari; i cakton administratori te Cilësimet → Përdoruesit. Pa dokument (llogari e re, e
  // pakontrolluar) → krejt të lejuara; administratori dhe vizitori s'kanë kufizime. Butonat me data-leja fshihen kur
  // leja mungon, pamjet që s'lejohen kalojnë te pjesa e parë e lejuar; çdo veprim kontrollohet edhe vetë (leja).
  // v231: çka s'lejohet zhduket krejt, pa asnjë mesazh: përdoruesi s'duhet ta dijë as që ekziston (pa "s'të lejohet").
  var lejetG = window.StokuLejet ? window.StokuLejet.krijoGjendjen({
    cloud: function () { var c = window.__stokuCloud; return (c && c.lejet) || null; },
    gati: function () { var c = window.__stokuCloud; return !!(c && c.authGati); },
    uid: function () { var u = perdoruesi(); return u ? u.uid : null; },
    admin: function () { return eshteAdminiIStokut(); },
    ndryshoi: function () { zbatoLejet(); __merchPara = eshteMerchandiser(); }
  }) : null;
  // Pa lejen "Stoku në kompjuter" s'lejohet asgjë këtu (faqja kalon te versioni i telefonit)
  function leja(k) {
    if (k === 'marketet') return eshteMerchandiser();
    return !lejetG || (lejetG.lejohet(k) && (k === 'pc' || lejetG.lejohet('pc')));
  }
  // v241: marketet vetëm për merchandiserët. Fiton zgjedhja e administratorit (lejet/{uid}.marketet); pa të, vlen
  // "Punoj si merchandiser" kur u hap llogaria (firebase-pc.js e ruan te 'stoku:merchandiser'). Llogaritë e vjetra s'e kanë.
  function eshteMerchandiser() {
    var u = perdoruesi();
    if (!u || !leja('afatet')) return false;
    var z = lejetG ? window.StokuLejet.zgjedhja(lejetG.lejet(), 'marketet') : null;
    if (z !== null) return z;
    try { var x = JSON.parse(localStorage.getItem('stoku:merchandiser') || 'null'); return !!(x && x.uid === u.uid && x.v === true); } catch (e) { return false; }
  }
  // "Çka ka të re": administratori i sheh edhe hyrjet për marketet (i ndez ai te Përdoruesit)
  function lejaPerTeRejat(k) { return k === 'marketet' ? leja(k) || eshteAdminiIStokut() : leja(k); }
  // Llogaria e hapur si merchandiser (ose u lexua nga Firebase pas hyrjes, ose u ndërrua llogaria): marketet dalin/zhduken
  var __merchPara = false;
  function rifreskoMerchandiserin() {
    var v = eshteMerchandiser();
    if (v === __merchPara) return;
    __merchPara = v;
    zbatoLejet();
    rifreskoTabinHarta();
  }
  window.addEventListener('stoku-merchandiser', rifreskoMerchandiserin);
  window.addEventListener('stoku-auth-ndryshoi', rifreskoMerchandiserin);
  // Leja e llogarisë pa kushtin e PC-së: për çka vlen edhe jashtë kësaj faqeje (serveri, njoftimet push)
  function lejaELlogarise(k) { return !lejetG || lejetG.lejohet(k); }
  // v231: pa "Grupi" kjo pajisje s'regjistrohet për njoftimet e grupit (as push); pa "Afatet" serveri merr listë bosh
  function zbatoLejetJashte() {
    var e = window.__stokuCloud && window.__stokuCloud.ekipa;
    if (!e || !perdoruesi()) return;
    if (e.lejoPushinEGrupit) e.lejoPushinEGrupit(lejaELlogarise('grupi')).catch(function () { /* ok */ });
    dergoAfatetPerNjoftiminDitor();
  }
  // Pjesa e një pamjeje: Afatet, Grupi ose Stoku (përmbledhja, të gjitha produktet, folderat)
  function lejaEPamjes(p) { return p === 'afatet' ? 'afatet' : p === 'ekipi' ? 'grupi' : 'stoku'; }
  function pamjaEPareELejuar() { return leja('stoku') ? 'permbledhja' : leja('afatet') ? 'afatet' : leja('grupi') ? 'ekipi' : null; }
  function zbatoLejet(paVizatim) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-leja]'), function (x) {
      x.classList.toggle('leja-ndaluar', !leja(x.getAttribute('data-leja')));
    });
    $('zgjEksport').classList.toggle('leja-ndaluar', !leja('eksportExcel') && !leja('eksportPdf'));
    if (!leja('pc')) kaloTeTelefoni();
    vizatoShkurtoret();
    if (paVizatim) return;
    if (!leja('stoku') && document.querySelector('.opsione-faqe[data-faqe="stoku"].aktiv')) zgjidhSkeden('pamja'); // Cilësimet → Stoku
    renderFletetETelefonit();
    rivizato();
    zbatoLejetJashte();
  }
  // v231: pa lejen "Stoku në kompjuter" hapet versioni i telefonit, pa mesazh. index.html e lexon të njëjtën leje nga
  // localStorage (lejet.js e ruan para se ta njoftojë faqen) dhe s'kthehet këtu. Pa localStorage (rrallë) mbetet kjo
  // faqe, por pa asnjë pjesë (leja() s'lejon asgjë pa "pc").
  function kaloTeTelefoni() {
    if (window.__stokuPaPc) return;
    var x = null;
    try { x = JSON.parse(localStorage.getItem(window.StokuLejet.KEY_LOKALE) || 'null'); } catch (e) { /* ok */ }
    if (!x || !x.lejet || x.lejet.pc !== false) return;
    window.__stokuPaPc = true;
    location.replace('./');
  }
  window.addEventListener('stoku-auth-ndryshoi', function () { if (lejetG) lejetG.rinis(); zbatoLejetJashte(); });
  window.addEventListener('stoku-cloud-gati', function () { if (lejetG) lejetG.rinis(); zbatoLejetJashte(); });

  // ================= Cloud: llogaria + sinkronizimi i drejtpërdrejtë =================
  function perdoruesi() {
    var u = (window.__stokuCloud && window.__stokuCloud.perdoruesiAktual) ? window.__stokuCloud.perdoruesiAktual() : null;
    // v232: në një skedë tjetër u hyr me llogari tjetër: të dhënat e kësaj faqeje janë të llogarisë së vjetër, prandaj
    // faqja s'e sheh veten të kyçur (s'sinkronizon asgjë) derisa porta ta rinisë
    var P = window.StokuPorta;
    if (u && P && P.teDhenatELlogarise && !P.teDhenatELlogarise(u.uid)) return null;
    return u;
  }
  function emriPerdoruesit() {
    var u = perdoruesi();
    return (u && typeof u.email === 'string') ? u.email.split('@')[0] : '';
  }
  // v248: pas rifreskimit Firebase e di hyrjen vetëm pas rreth 1 sekonde. Deri atëherë, kur kjo pajisje ishte e kyçur (hyrja e
  // fundit te porta), faqja s'del "pa llogari" (karta "Mirë se erdhe" me hyrjen, "Hyr · Vetëm në këtë kompjuter"): tregon emrin
  // dhe "Duke u lidhur…". Pas 10 s pa përgjigje (p.sh. pa internet) kthehet pamja e zakonshme.
  var HYRJA_PRITJA_MS = 10000, __hapurSe = Date.now();
  function hyrjaNePritje() {
    var cl = window.__stokuCloud;
    if ((cl && cl.authGati) || ngaVizitori() || Date.now() - __hapurSe > HYRJA_PRITJA_MS || perdoruesi()) return null;
    var P = window.StokuPorta;
    return P && P.hyrjaEFundit ? P.hyrjaEFundit() : null;
  }
  function gjendjaLokale() {
    return {
      app: 'stoku', version: 3, rendiKoha: rendiFolderaveKoha, foldera: foldera,
      produktet: teGjithaProduktet(), afatet: afatet, marketet: marketet, fshira: fshira
    };
  }

  var sink = { kohez: null, duke: false, serish: false, statusi: 'lokal', koha: 0, cUid: null, degjuesi: null, riprovo: null, remoteNePritje: null };

  // vetemRivizato: teksti rifreskohet pa e ndryshuar orën e sinkronizimit të fundit
  function vendosStatusin(s, vetemRivizato) {
    sink.statusi = s;
    if (s === 'ok' && !vetemRivizato) sink.koha = Date.now();
    var pika = $('sinkPika'), t = $('sinkTekst');
    pika.className = 'pike' + (s === 'ok' ? ' ok' : s === 'pune' ? ' pune' : s === 'gabim' ? ' gabim' : '');
    var dk = new Date(sink.koha || Date.now());
    var viz = s === 'lokal' && !perdoruesi() && ngaVizitori();
    var lidhet = s === 'lokal' && !!hyrjaNePritje();
    if (lidhet) pika.className = 'pike pune';
    var tekst = viz ? 'Provë pa llogari' : lidhet ? 'Duke u lidhur…' : {
      lokal: 'Vetëm në këtë kompjuter',
      pune: 'Duke sinkronizuar…',
      ok: 'Sinkronizuar · ' + dy(dk.getHours()) + ':' + dy(dk.getMinutes()),
      gabim: 'Pa lidhje · provohet sërish'
    }[s];
    t.textContent = tekst;
    $('sinkStatus').title = viz ? 'Prova si vizitor s\'sinkronizohet. Hyr në llogari që të dhënat të shihen edhe në telefon.' :
      s === 'lokal' ? 'Hyr në llogari që të dhënat të sinkronizohen me telefonat' : 'Kliko për të sinkronizuar tani';
    var tx = s === 'ok' ? 'Sinkronizuar në ' + dataOra(sink.koha) + '. Ndryshimet nga telefonat shfaqen këtu automatikisht.' :
      s === 'pune' ? 'Duke sinkronizuar…' : s === 'gabim' ? 'Sinkronizimi dështoi. Kontrollo internetin. Provohet sërish vetë.' : '';
    if ($('llStatusi')) $('llStatusi').textContent = tx;
    if ($('opsLlStatusi')) $('opsLlStatusi').textContent = tx;
    if ($('opsNavSub')) $('opsNavSub').textContent = tekst;
  }

  // Zbaton lokalisht një gjendje nga cloud-i, gjithmonë e bashkuar me atë që ka tani ky kompjuter
  // (pra asnjë ndryshim lokal i pasinkronizuar nuk humbet).
  // bGati (opsional): bashkimi i llogaritur tashmë nga thirrësi (që të mos llogaritet dy herë mbi krejt dyqanin)
  function zbatoNgaCloud(remote, bGati) {
    var lok = gjendjaLokale();
    var b = bGati || bashkoMeCloud(remote, lok);
    var ndryshoi = !window.StokuBashkimi.eNjejte(b, lok);
    if (ndryshoi) {
      var pm = {};
      b.produktet.forEach(function (p) { pm[celesi(p.kategoriaId, p.barkodi)] = p; });
      ruajTeFshiratNeKopje(b.foldera, pm);
      foldera = b.foldera;
      produktet = pm;
      afatet = b.afatet;
      marketet = MK.pastro(b.marketet);
      rifreskoKopjen();
    }
    if ((b.rendiKoha || 0) > rendiFolderaveKoha) rendiFolderaveKoha = b.rendiKoha;
    if (ndryshoi) { shkruajLokalisht(); rivizato(); if (PK.ok) setTimeout(pasPikave, 0); } // v250: edhe marketet nga cloud-i sipas pikave
    return b;
  }

  // ---------- v232: kopja e të fshirave nga një pajisje tjetër (si te telefoni) ----------
  // Kur sinkronizimi heq foldera ose produkte që ishin këtu, ato ruhen në këtë kompjuter (vetëm çka u hoq), që të
  // rikthehen te Cilësimet → Llogaria. Mbahen 30 ditë; me ndërrimin e llogarisë fshihen (porta.js).
  var KEY_KOPJA = 'stoku:kopja-fshirjeve:v1', KOPJA_MS = 30 * 864e5;
  function lexoKopjen() {
    var u = perdoruesi();
    if (!u) return null;
    try {
      var k = JSON.parse(localStorage.getItem(KEY_KOPJA) || 'null');
      if (!k || k.uid !== u.uid || !Array.isArray(k.foldera) || !Array.isArray(k.produktet) || Date.now() - (k.koha || 0) > KOPJA_MS) return null;
      return k;
    } catch (e) { return null; }
  }
  function ruajTeFshiratNeKopje(folderaRe, produktetRe) {
    var u = perdoruesi();
    if (!u || pajisjaEshteEPaprekur()) return;
    var idRe = {}, barkodetRe = {}, fH = {}, meProdukte = {};
    (folderaRe || []).forEach(function (f) { if (f && f.id) idRe[f.id] = true; });
    Object.keys(produktetRe || {}).forEach(function (k) { var p = produktetRe[k]; if (p) barkodetRe[p.barkodi] = true; });
    Object.keys(produktet).forEach(function (k) { var p = produktet[k]; if (p) meProdukte[p.kategoriaId] = true; });
    // Një folder i parazgjedhur bosh dhe i paprekur (pa ndryshuarSe) s'ruhet: s'ka asgjë për t'u humbur
    var folderatH = foldera.filter(function (f) { return f && f.id && !idRe[f.id] && (f.ndryshuarSe || meProdukte[f.id]); });
    folderatH.forEach(function (f) { fH[f.id] = true; });
    var produktetH = Object.keys(produktet).filter(function (k) {
      var p = produktet[k];
      return p && !(produktetRe || {})[k] && (fH[p.kategoriaId] || !barkodetRe[p.barkodi]);
    }).map(function (k) { return produktet[k]; });
    if (!folderatH.length && !produktetH.length) return;
    var k = lexoKopjen() || { uid: u.uid, foldera: [], produktet: [] };
    folderatH.forEach(function (f) { k.foldera = k.foldera.filter(function (x) { return x.id !== f.id; }).concat([f]); });
    produktetH.forEach(function (p) {
      var c = celesi(p.kategoriaId, p.barkodi);
      k.produktet = k.produktet.filter(function (x) { return celesi(x.kategoriaId, x.barkodi) !== c; }).concat([p]);
    });
    if (k.produktet.length > 20000) k.produktet = k.produktet.slice(-20000);
    k.koha = Date.now();
    try { localStorage.setItem(KEY_KOPJA, JSON.stringify(k)); } catch (e) { /* memoria plot: pa kopje */ }
  }
  function teMungueshmetNgaKopja(k) {
    var fM = k.foldera.filter(function (f) { return !folderSipasId(f.id); });
    var ka = {}; foldera.concat(fM).forEach(function (f) { ka[f.id] = true; });
    var pM = k.produktet.filter(function (p) { return ka[p.kategoriaId] && !produktet[celesi(p.kategoriaId, p.barkodi)]; });
    return { foldera: fM, produktet: pM };
  }
  function pershkrimiIKopjes(m) {
    var pjeset = [];
    if (m.foldera.length) pjeset.push(m.foldera.length === 1 ? '1 folder ("' + m.foldera[0].emri + '")' : m.foldera.length + ' foldera');
    if (m.produktet.length) pjeset.push(produkteTekst(m.produktet.length));
    return pjeset.join(' dhe ');
  }
  function vetemNje(m) { return m.foldera.length + m.produktet.length === 1; } // folja në njëjës ("u fshi", "u rikthye")
  function rifreskoKopjen() {
    var c = $('opsKopja');
    if (!c) return;
    var k = lexoKopjen(), m = k ? teMungueshmetNgaKopja(k) : null;
    c.hidden = !m || (!m.foldera.length && !m.produktet.length);
    // Krejt çka ishte në kopje është sërish këtu (p.sh. u rikthye nga një pajisje tjetër): kopja s'duhet më
    if (k && c.hidden) { try { localStorage.removeItem(KEY_KOPJA); } catch (e) { /* ok */ } }
    if (c.hidden) return;
    var nje = vetemNje(m);
    $('opsKopjaTeksti').textContent = pershkrimiIKopjes(m) + (nje ? ' u fshi' : ' u fshinë') + ' nga një pajisje tjetër. Kopja u ruajt në këtë kompjuter më ' +
      dataOra(k.koha).replace(' ', ', ora ') + '. "Rikthe" ' + (nje ? 'e' : 'i') + ' kthen në krejt pajisjet.';
  }

  // Bashkimi me cloud-in; v233: pa asnjë folder pas bashkimit kthehen 4 të parazgjedhurit (bashkimi.js, sigurojFolderat)
  function bashkoMeCloud(remote, lok) {
    var B = window.StokuBashkimi;
    return B.sigurojFolderat ? B.sigurojFolderat(B.bashko(remote, lok)) : B.bashko(remote, lok);
  }

  function duhetShkruar(b, remote) {
    if (!remote) return true;
    if (!window.StokuBashkimi.eNjejte(b, remote)) return true;
    if ((b.rendiKoha || 0) !== (Number(remote.rendiKoha) || 0)) return true;
    var rf = remote.fshira || {};
    return ['produktet', 'foldera', 'afatet'].some(function (l) {
      var r = rf[l] || {};
      return Object.keys(b.fshira[l] || {}).some(function (k) { return !(k in r); });
    });
  }

  function planifikoSinkronizimin(ms) {
    if (!perdoruesi()) return;
    clearTimeout(sink.kohez);
    sink.kohez = setTimeout(kryeSinkronizimin, ms === undefined ? 1200 : ms);
  }

  async function kryeSinkronizimin() {
    if (ngaVizitori() || !perdoruesi() || !window.__stokuCloud) { vendosStatusin('lokal'); return; }
    clearTimeout(sink.kohez); clearTimeout(sink.riprovo);
    sink.kohez = null;
    if (sink.duke) { sink.serish = true; return; }
    sink.duke = true;
    vendosStatusin('pune');
    var rez;
    try {
      rez = await window.__stokuCloud.bashkoDheRuaj(function (cloud) {
        return bashkoMeCloud(cloud, gjendjaLokale());
      });
    } catch (e) { rez = { ok: false, arsye: String((e && e.message) || e) }; } // sinkronizimi s'ngec kurrë "duke punuar"
    sink.duke = false;
    if (rez.ok) {
      window.StokuBashkimi.pastroFshirjetEVjetra(fshira);
      zbatoNgaCloud(rez.gjendja); // shkruan lokalisht (dhe rimëson) vetëm kur sjell diçka të re
      try { // shënimet e fshirjeve (të vjetrat u hoqën) dhe renditja; pjesa tjetër është shkruar tashmë
        localStorage.setItem(KEY_FSHIRE, JSON.stringify(fshira));
        localStorage.setItem(KEY_RENDI_KOHA, String(rendiFolderaveKoha || 0));
      } catch (e) { /* ok */ }
      vendosStatusin('ok');
      if (typeof ekK !== 'undefined' && ekK) ekK.publikoAfatet(MK.meEmra(afatet, marketet)); // kolegët i shohin afatet e mia (vetëm afatet), me emrin e marketit
    } else {
      vendosStatusin(perdoruesi() ? 'gabim' : 'lokal');
      if (/maximum|exceeds|too large/i.test(String(rez.arsye || ''))) {
        toast('Të dhënat e dyqanit kanë arritur kufirin e Firebase-it (1 MB) dhe s\'po ruhen në cloud. Fshi afatet/produktet e vjetra ose kontakto administratorin.', { ms: 15000 });
      }
      if (perdoruesi()) sink.riprovo = setTimeout(kryeSinkronizimin, 15000);
    }
    if (sink.serish) { sink.serish = false; planifikoSinkronizimin(300); }
    zbatoRemoteNePritje();
  }

  function pajisjaEshteEPaprekur() {
    if (Object.keys(produktet).length > 0 || rendiFolderaveKoha || afatet.length) return false;
    if (foldera.length !== FOLDERAT_PARAZGJEDHUR.length) return false;
    return FOLDERAT_PARAZGJEDHUR.every(function (d, i) { return foldera[i] && foldera[i].id === d.id && foldera[i].emri === d.emri; });
  }

  // Gjendja e fundit nga cloud-i që mbërriti ndërsa ruajtja jonë ishte në rrugë — zbatohet sapo të
  // mbarojë ajo (më parë hidhej, dhe ndryshimi i një pajisjeje tjetër s'shfaqej deri në ndryshimin e radhës).
  function zbatoRemoteNePritje() {
    var r = sink.remoteNePritje;
    if (!r || sink.duke) return;
    sink.remoteNePritje = null;
    var lok = gjendjaLokale();
    var b0 = bashkoMeCloud(r, lok);
    if (window.StokuBashkimi.eNjejte(b0, lok)) return; // kopje e vjetër
    var b = zbatoNgaCloud(r, b0);
    if (duhetShkruar(b, r) && !sink.kohez) planifikoSinkronizimin(400);
  }
  function nisDegjuesin() {
    ndalDegjuesin();
    if (!window.__stokuCloud || !window.__stokuCloud.degjo) return;
    sink.degjuesi = window.__stokuCloud.degjo(function (remote, tePaDerguara) {
      if (!remote) return;
      if (tePaDerguara || sink.duke) { sink.remoteNePritje = remote; return; } // ndryshim i yni ende pa u konfirmuar nga serveri
      sink.remoteNePritje = null;
      var b = zbatoNgaCloud(remote);
      if (sink.statusi !== 'pune') vendosStatusin('ok');
      if (duhetShkruar(b, remote) && !sink.kohez) planifikoSinkronizimin(400);
      sink.degjuesiPritja = 0; sink.degjuesiGabim = false;
    }, function () {
      vendosStatusin('gabim');
      sink.degjuesiGabim = true;
      // Dëgjuesi i Firestore-it mbaron pas një gabimi: rinis pas pak (përndryshe ndryshimet e telefonave s'vinin më)
      ndalDegjuesin();
      sink.degjuesiPritja = Math.min(5 * 60000, (sink.degjuesiPritja || 15000) * 2);
      sink.degjuesiKohez = setTimeout(function () { if (!sink.degjuesi && perdoruesi()) nisDegjuesin(); }, sink.degjuesiPritja);
    });
  }
  window.addEventListener('online', function () {
    if (!sink.degjuesi && sink.degjuesiGabim && perdoruesi()) nisDegjuesin();
  });
  function ndalDegjuesin() {
    clearTimeout(sink.degjuesiKohez);
    if (sink.degjuesi) { try { sink.degjuesi(); } catch (e) { /* ok */ } }
    sink.degjuesi = null;
    sink.remoteNePritje = null;
  }

  async function sinkronizoNeHyrje() {
    var u = perdoruesi();
    if (ngaVizitori() || !u || !window.__stokuCloud) return;
    if (sink.cUid === u.uid) return;
    sink.cUid = u.uid;
    vendosStatusin('pune');
    if (pajisjaEshteEPaprekur()) {
      var rez = await window.__stokuCloud.merr();
      var B = window.StokuBashkimi;
      if (rez.ok && rez.gjendja && B.pastroFolderat(rez.gjendja.foldera).length > 0) {
        // Kompjuter i ri: merret gjendja e cloud-it ashtu siç është (pa "ringjallur" 4 folderat e parazgjedhur).
        foldera = B.pastroFolderat(rez.gjendja.foldera);
        var pm = {};
        B.pastroProduktet(rez.gjendja.produktet).forEach(function (p) { pm[celesi(p.kategoriaId, p.barkodi)] = p; });
        produktet = pm;
        afatet = B.pastroAfatet(rez.gjendja.afatet);
        marketet = MK.pastro(rez.gjendja.marketet);
        rendiFolderaveKoha = Number(rez.gjendja.rendiKoha) || 0;
        shkruajLokalisht();
        rivizato();
      }
    }
    await kryeSinkronizimin();
    nisDegjuesin();
    nisDegjuesinEFleteve();
    nisDegjuesinESkedareve();
  }

  function kurNdryshonLlogaria() {
    var u = perdoruesi();
    if (!u) { sink.cUid = null; ndalDegjuesin(); ndalDegjuesinEFleteve(); ndalDegjuesinESkedareve(); vendosStatusin('lokal'); }
    ekNisOseNdal();
    rifreskoLlogarine();
    rivizato();
    if (u) sinkronizoNeHyrje();
  }
  // Heqjet nga rafti të bëra në orë (Galaxy Watch) zbatohen këtu si çdo heqje tjetër
  async function zbatoHeqjetNgaOra(detyro) {
    var e = window.__stokuCloud && window.__stokuCloud.ekipa;
    if (!e || !e.merrHeqjetNgaOra || !perdoruesi() || !leja('ora')) return;
    var l = await e.merrHeqjetNgaOra(detyro), kryer = [], te = [];
    l.forEach(function (h) { var a = afatSipasId(h.i); if (!a) return; kryer.push(h.i); if (a.statusi !== 'hequr') te.push(h); });
    if (te.length) {
      ndryshoAfatet(function (api) { te.forEach(function (h) { var a = api.merr(h.i); if (a) { a.statusi = 'hequr'; a.hequrSe = h.koha || Date.now(); a.hequrNga = emriPerdoruesit(); api.vendos(a); } }); });
      te.forEach(function (h) { ekNgjarjeAfati('hequr', afatSipasId(h.i)); });
      toast(te.length === 1 ? '1 produkt u shënua i hequr nga rafti (nga ora).' : te.length + ' produkte u shënuan të hequra nga rafti (nga ora).');
    }
    if (kryer.length) e.pastroHeqjetNgaOra(kryer);
  }
  function zbatoHeqjetMePritje() { setTimeout(function () { zbatoHeqjetNgaOra(true).catch(function () { /* ok */ }); }, 4000); }
  window.addEventListener('stoku-cloud-gati', zbatoHeqjetMePritje);
  window.addEventListener('stoku-auth-ndryshoi', zbatoHeqjetMePritje);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) zbatoHeqjetNgaOra(false).catch(function () { /* ok */ }); });
  window.addEventListener('stoku-cloud-gati', kurNdryshonLlogaria);
  window.addEventListener('stoku-auth-ndryshoi', kurNdryshonLlogaria);
  // v248: Firebase s'u përgjigj për 10 s (p.sh. pa internet): pamja e zakonshme pa llogari (porta e trajton hyrjen pa internet)
  setTimeout(function () { if (!perdoruesi()) { rifreskoLlogarine(); vendosStatusin(sink.statusi, true); rivizato(); } }, HYRJA_PRITJA_MS + 100);
  window.addEventListener('online', function () { if (perdoruesi()) kryeSinkronizimin(); });
  // Mbyllja e skedës/dritares me një ruajtje në pritje: dërgohet menjëherë
  function sinkronizoMenjehereNesePret() {
    if (sink.kohez && perdoruesi() && !sink.duke) { clearTimeout(sink.kohez); sink.kohez = null; kryeSinkronizimin(); }
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) sinkronizoMenjehereNesePret(); });
  window.addEventListener('pagehide', sinkronizoMenjehereNesePret);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && perdoruesi() && sink.statusi === 'gabim') kryeSinkronizimin();
  });
  $('sinkStatus').addEventListener('click', function () {
    if (perdoruesi()) kryeSinkronizimin(); else hapLlogarine();
  });

  // ================= Navigimi (me #hash, që "Mbrapa"/"Para" e shfletuesit të punojnë) =================
  var pamja = 'permbledhja';
  var tab = { kerkimi: '', filtri: 'te-gjitha', rendiK: 'koha', rendiD: -1, faqja: 0, zgjedhura: {}, fokus: -1, ankoraZgjedhjes: null, flash: null };
  (function () { var r = ops.rendi.split(':'); tab.rendiK = r[0]; tab.rendiD = parseInt(r[1], 10); })();

  function hashPer(p) { return p === 'permbledhja' ? '#/permbledhja' : p === 'te-gjitha' ? '#/te-gjitha' : p === 'afatet' ? '#/afatet' : p === 'ekipi' ? '#/ekipa' + (ekNen !== 'pulti' ? '/' + ekNen : '') : '#/f/' + encodeURIComponent(p); }
  function shkoTe(p, opsionet) {
    opsionet = opsionet || {};
    if (!leja(lejaEPamjes(p))) return; // v230
    var ePare = pamja !== p;
    if (ePare || opsionet.reset) {
      tab.kerkimi = opsionet.kerkimi || '';
      tab.filtri = opsionet.filtri || 'te-gjitha';
      tab.faqja = 0; tab.zgjedhura = {}; tab.fokus = -1; tab.ankoraZgjedhjes = null;
      if (opsionet.rendi) { tab.rendiK = opsionet.rendi[0]; tab.rendiD = opsionet.rendi[1]; }
    }
    pamja = p;
    if (location.hash !== hashPer(p)) history.pushState(null, '', hashPer(p));
    $('kerko').value = tab.kerkimi;
    rivizato();
    $('kryesore').scrollTop = 0;
  }
  // Adresa (#/...) → pamja. Një "%" i gabuar (lidhje e shkruar me dorë) s'e ndal faqen; nënfaqet e panjohura ose të
  // hequra të Grupit (stoku v183) çojnë te Pulti. E njëjta për nisjen dhe për "mbrapa/para" të shfletuesit.
  function hashIDekoduar() {
    var h = location.hash || '';
    try { return decodeURIComponent(h); } catch (e) { return h; }
  }
  function pamjaNgaHash(h) {
    var r = { pamja: 'permbledhja', ekNen: null };
    if (h === '#/te-gjitha') r.pamja = 'te-gjitha';
    else if (h === '#/afatet') r.pamja = 'afatet';
    else if (h === '#/ekipi' || h === '#/ekipa' || h.indexOf('#/ekipa/') === 0) {
      var n = h.slice(8);
      r.pamja = 'ekipi';
      r.ekNen = EK_NENET.indexOf(n) !== -1 && n !== 'stoku' ? n : 'pulti';
    } else if (h.indexOf('#/f/') === 0 && folderSipasId(h.slice(4))) r.pamja = h.slice(4);
    return r;
  }
  function lexoHash() {
    var ph = pamjaNgaHash(hashIDekoduar());
    var p = ph.pamja;
    if (ph.ekNen) ekNen = ph.ekNen;
    if (p !== pamja) { pamja = p; tab.kerkimi = ''; tab.filtri = 'te-gjitha'; tab.faqja = 0; tab.zgjedhura = {}; tab.fokus = -1; $('kerko').value = ''; }
    if (location.hash !== hashPer(pamja)) history.replaceState(null, '', hashPer(pamja)); // adresa e korrigjuar (p.sh. "#/ekipa/stoku" → "#/ekipa")
    rivizato();
  }
  window.addEventListener('popstate', lexoHash);

  function rivizato() {
    if (pamja !== 'permbledhja' && pamja !== 'te-gjitha' && pamja !== 'afatet' && pamja !== 'ekipi' && !folderSipasId(pamja)) {
      pamja = 'permbledhja';
      history.replaceState(null, '', hashPer(pamja));
    }
    // v230: pamja që s'lejohet → pjesa e parë e lejuar; asnjë e lejuar → faqja "S'ka asgjë të lejuar"
    var ePara = pamjaEPareELejuar(), paAsgje = !ePara;
    if (ePara && !leja(lejaEPamjes(pamja))) { pamja = ePara; history.replaceState(null, '', hashPer(pamja)); }
    renderAnesoren();
    renderAfatetAnesore();
    var permb = pamja === 'permbledhja', neAfate = pamja === 'afatet', neEkipi = pamja === 'ekipi';
    $('pamjaMbyllur').classList.toggle('fsheh', !paAsgje);
    $('pamjaPermbledhja').classList.toggle('fsheh', !permb || paAsgje);
    $('pamjaAfatet').classList.toggle('fsheh', !neAfate || paAsgje);
    $('pamjaEkipi').classList.toggle('fsheh', !neEkipi || paAsgje);
    $('pamjaTabela').classList.toggle('fsheh', permb || neAfate || neEkipi || paAsgje);
    if (paAsgje) { /* asgjë për të vizatuar */ } else if (permb) renderPermbledhjen(); else if (neAfate) renderAfatetPc(); else if (neEkipi) renderEkipiPc(); else renderTabelen();
    // Rezultatet rifreskohen vetëm kur fusha ka fokusin (përndryshe dritarja e rezultateve rihapej vetë pas çdo ndryshimi)
    if ($('kerkoGlobal').value.trim() && document.activeElement === $('kerkoGlobal')) renderKerkimiGlobal();
    if ((!neEkipi || paAsgje) && ekK && ekK.gj.hapur) ekK.mbyll(); // dëgjuesit e Grupit vetëm sa kohë është e hapur
    var titull = permb ? 'Përmbledhja' : neAfate ? 'Afatet' : neEkipi ? 'Grupi • ' + EK_TITUJT[ekNen] : pamja === 'te-gjitha' ? 'Të gjitha produktet' : emriFolderit(pamja);
    document.title = titull + ' • Stoku';
  }

  // ================= Shiriti anësor =================
  var zvarritjaFolderit = null;
  // v213: tri pllaka sipër (Stoku, Afatet, Grupi); poshtë tyre shfaqet vetëm menyja e pllakës së pamjes aktuale.
  // Pllaka mban mend faqen e fundit brenda saj; klikimi te pllaka aktive të kthen te faqja e saj kryesore.
  var MODULET = [['stoku', 'Stoku'], ['afatet', 'Afatet'], ['ekipi', 'Ekipi']];
  var faqjaEFunditEStokut = 'permbledhja';
  function moduliIPamjes(p) { return p === 'afatet' ? 'afatet' : p === 'ekipi' ? 'ekipi' : 'stoku'; }
  function vendosPllakat() {
    var m = moduliIPamjes(pamja);
    if (m === 'stoku') faqjaEFunditEStokut = pamja;
    MODULET.forEach(function (x) {
      var on = x[0] === m && leja(lejaEPamjes(x[0] === 'stoku' ? 'permbledhja' : x[0]));
      $('btnAkord' + x[1]).classList.toggle('aktiv', on);
      $('btnAkord' + x[1]).setAttribute('aria-selected', String(on));
      $('akord' + x[1] + 'Trupi').hidden = !on;
    });
    rifreskoPllakat();
  }
  // Numrat poshtë emrit të pllakës: produktet; të skaduarat (ose afër skadimit); kolegët online (ose ftesat)
  function rifreskoPllakat() {
    $('pllStokuNen').textContent = num(Object.keys(produktet).length);
    var afM = afatetEMarketit();
    var n = window.StokuAfatet.numero(afM), kuqe = n.skaduar + n['pa-date'], na = $('pllAfatetNen');
    na.textContent = kuqe ? num(kuqe) + ' skaduar' : n.afer ? num(n.afer) + ' afër' : num(afM.filter(function (a) { return a.statusi !== 'hequr'; }).length);
    na.className = kuqe ? 'kuqe' : n.afer ? 'verdhe' : '';
    var ne = $('pllEkipiNen'), on = $('ekNavOnline').textContent;
    ne.textContent = on || (ekK && ekK.kaLidhje() && /^pa-(grup|rregulla)$/.test(ekK.gjendjaEQasjes()) ? 'Pa grup' : '');
    ne.className = $('ekNavOnline').classList.contains('kuqe') ? 'kuqe' : '';
  }
  $('btnAkordStoku').addEventListener('click', function () {
    if (moduliIPamjes(pamja) === 'stoku') { shkoTe('permbledhja'); return; }
    var f = faqjaEFunditEStokut;
    shkoTe(f === 'permbledhja' || f === 'te-gjitha' || folderSipasId(f) ? f : 'permbledhja');
  });
  $('btnAkordAfatet').addEventListener('click', function () {
    if (pamja === 'afatet') { $('navAfatet').click(); return; }
    shkoTe('afatet');
  });
  $('btnAkordEkipi').addEventListener('click', function () {
    if (pamja === 'ekipi') { $('navEkPulti').click(); return; }
    shkoTe('ekipi');
  });

  function renderAnesoren() {
    vendosPllakat();
    $('navPermbledhja').classList.toggle('aktiv', pamja === 'permbledhja');
    $('navTeGjitha').classList.toggle('aktiv', pamja === 'te-gjitha');
    Array.prototype.forEach.call(document.querySelectorAll('[data-ek]'), function (b) { b.classList.toggle('aktiv', pamja === 'ekipi' && b.dataset.ek === ekNen); });
    $('numTeGjitha').textContent = num(Object.keys(produktet).length);
    $('numFolderat').textContent = foldera.length ? num(foldera.length) : '';
    var numrat = {};
    teGjithaProduktet().forEach(function (p) { numrat[p.kategoriaId] = (numrat[p.kategoriaId] || 0) + 1; });
    var cont = $('folderat');
    cont.textContent = '';
    if (!foldera.length) {
      var b = el('div', 'bosh-mesazh', 'S\'ka asnjë folder. Krijo një me “+”.');
      b.style.padding = '8px 10px';
      cont.appendChild(b);
    }
    foldera.forEach(function (f, i) {
      var r = el('div', 'folder-rresht' + (pamja === f.id ? ' aktiv' : ''));
      r.setAttribute('role', 'button');
      r.tabIndex = 0;
      r.draggable = leja('stokuFoldera'); // renditja e folderave
      r.dataset.id = f.id;
      r.title = f.emri + (i < 9 ? '  (Alt+' + (i + 1) + ')' : '');
      var kap = el('span', 'kap'); kap.innerHTML = IKONA.kap;
      var ikF = window.StokuAfatet.ikonaEFolderit(f);
      var ik = el('span', 'sbp-fik ngj-' + ikF.ngj); ik.innerHTML = window.StokuAfatet.svgEIkones(ikF, 14);
      var emri = el('span', 'emri', f.emri);
      var n = el('span', 'numer-cip', num(numrat[f.id] || 0));
      var me = el('button', 'me-shume'); me.type = 'button'; me.innerHTML = IKONA.me; me.title = 'Veprime'; me.setAttribute('aria-label', 'Veprime për ' + f.emri);
      r.appendChild(kap); r.appendChild(ik); r.appendChild(emri); r.appendChild(n); r.appendChild(me);
      r.addEventListener('click', function (ev) {
        if (ev.target.closest('.me-shume')) { ev.stopPropagation(); hapMenuFolderi(f, me); return; }
        shkoTe(f.id);
      });
      r.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') shkoTe(f.id); });
      r.addEventListener('contextmenu', function (ev) { ev.preventDefault(); hapMenuFolderi(f, { x: ev.clientX, y: ev.clientY }); });
      // Zvarritja: renditja e folderave, ose lëshimi i produkteve mbi folder (= zhvendosje)
      r.addEventListener('dragstart', function (ev) {
        zvarritjaFolderit = f.id;
        ev.dataTransfer.effectAllowed = 'move';
        ev.dataTransfer.setData('application/x-stoku-folder', f.id);
        setTimeout(function () { r.classList.add('po-zvarritet'); }, 0);
      });
      r.addEventListener('dragend', function () { zvarritjaFolderit = null; pastroCaqet(); r.classList.remove('po-zvarritet'); });
      r.addEventListener('dragover', function (ev) {
        var tipet = Array.prototype.slice.call(ev.dataTransfer.types || []);
        if (tipet.indexOf('application/x-stoku-produkte') !== -1) {
          if (f.id === pamja || !leja('stokuNdrysho')) return;
          ev.preventDefault(); ev.dataTransfer.dropEffect = 'move';
          pastroCaqet(); r.classList.add('aktiv');
          return;
        }
        if (!zvarritjaFolderit || zvarritjaFolderit === f.id) return;
        ev.preventDefault();
        var rr = r.getBoundingClientRect();
        pastroCaqet();
        r.classList.add(ev.clientY < rr.top + rr.height / 2 ? 'cak-lart' : 'cak-poshte');
      });
      r.addEventListener('dragleave', function () {
        r.classList.remove('cak-lart', 'cak-poshte');
        if (pamja !== f.id) r.classList.remove('aktiv');
      });
      r.addEventListener('drop', function (ev) {
        ev.preventDefault();
        var prod = ev.dataTransfer.getData('application/x-stoku-produkte');
        var lart = r.classList.contains('cak-lart');
        pastroCaqet();
        if (prod) { zhvendosProduktet(JSON.parse(prod), f); return; }
        var id = ev.dataTransfer.getData('application/x-stoku-folder');
        if (!id || id === f.id || !leja('stokuFoldera')) return;
        var levizur = folderSipasId(id);
        if (!levizur || !folderSipasId(f.id)) return; // njëri u fshi ndërkohë (p.sh. nga sinkronizimi)
        var lista = foldera.filter(function (x) { return x.id !== id; });
        var ku = lista.map(function (x) { return x.id; }).indexOf(f.id) + (lart ? 0 : 1);
        lista.splice(ku, 0, levizur);
        foldera = lista;
        rendiFolderaveKoha = Date.now();
        ruaj();
      });
      cont.appendChild(r);
    });
  }
  function pastroCaqet() {
    Array.prototype.forEach.call(document.querySelectorAll('.folder-rresht'), function (x) {
      x.classList.remove('cak-lart', 'cak-poshte');
      if (x.dataset.id !== pamja) x.classList.remove('aktiv');
    });
  }
  $('navPermbledhja').addEventListener('click', function () { shkoTe('permbledhja'); });
  $('navTeGjitha').addEventListener('click', function () { shkoTe('te-gjitha', { reset: true }); });
  // v238: prekja e logos (vetëm vetë logoja, jo hapësira anash): sinkronizim i menjëhershëm me cloud-in, kontroll për version të
  // ri dhe rifreskim i faqes (edhe në aplikacionin Android). Më së shumti ~6 s pritje, pastaj rifreskohet gjithsesi.
  var __logoRifreskim = false;
  async function rifreskoMeLogo() {
    if (__logoRifreskim) return;
    __logoRifreskim = true;
    $('logoButon').classList.add('duke-rifreskuar');
    var prit = function (ms) { return new Promise(function (z) { setTimeout(z, ms); }); };
    try { await Promise.race([kryeSinkronizimin(), prit(5000)]); } catch (e) { /* ok */ }
    try {
      var reg = navigator.serviceWorker && navigator.serviceWorker.getRegistration ? await navigator.serviceWorker.getRegistration() : null;
      if (reg && reg.update) await Promise.race([reg.update(), prit(1500)]);
    } catch (e) { /* ok */ }
    location.reload();
  }
  $('logoButon').addEventListener('click', rifreskoMeLogo);
  $('logoButon').addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); rifreskoMeLogo(); } });

  // ================= Përmbledhja =================
  function kpi(etiketa, vlera, nen, statusi, ikona, veprimi, klasa) {
    var b = el(veprimi ? 'button' : 'div', 'kpi' + (statusi ? ' status-' + statusi : '') + (klasa ? ' ' + klasa : ''));
    if (veprimi) { b.type = 'button'; b.addEventListener('click', veprimi); }
    var e = el('div', 'kpi-etik');
    if (ikona) { var i = el('span'); i.innerHTML = ikona; i.style.display = 'flex'; e.appendChild(i); }
    e.appendChild(document.createTextNode(etiketa));
    b.appendChild(e);
    b.appendChild(el('div', 'kpi-vlera', vlera));
    if (nen) b.appendChild(el('div', 'kpi-nen', nen));
    return b;
  }

  function renderPermbledhjen() {
    var te = teGjithaProduktet();
    var zero = 0, sot = 0;
    var fillimiSot = new Date(); fillimiSot.setHours(0, 0, 0, 0);
    te.forEach(function (p) {
      if (eshteZero(p)) zero++;
      if ((p.prekurSe || 0) >= fillimiSot.getTime()) sot++;
    });

    var u = perdoruesi(), hp = u ? null : hyrjaNePritje();
    $('kartaMireseardhje').classList.toggle('fsheh', !!u || !window.__stokuCloud || ngaVizitori() || !!hp);
    $('kartaVizitori').classList.toggle('fsheh', !!u || !ngaVizitori());
    $('permbNen').textContent = (u ? 'Llogaria: ' + emriPerdoruesit() + ' · ' : hp && hp.emri ? 'Llogaria: ' + hp.emri + ' · ' : '') + produkteTekst(te.length) + ' në ' + foldera.length + ' ' + (foldera.length === 1 ? 'folder' : 'foldera');

    var r = $('kpiRrjeti');
    r.textContent = '';
    // Dizajni: numri i produkteve (karta e errët, "+N sot"), sasi 0, afatet e skaduara në raft ("Sasi e ulët" u hoq në v134)
    r.appendChild(kpi('Produkte gjithsej', num(te.length), sot ? '+' + num(sot) + ' sot' : '', null, null, function () { shkoTe('te-gjitha', { reset: true }); }, 'kpi-hero'));
    r.appendChild(kpi('Sasi 0', num(zero), zero ? 'duhen porositur' : 'asnjë produkt pa stok', zero ? 'kritik' : null, null, function () { shkoTe('te-gjitha', { reset: true, filtri: 'zero' }); }));
    var nAf = window.StokuAfatet.numero(afatetEMarketit());
    var nSkad = nAf.skaduar + nAf['pa-date'];
    // v231: pa lejen "Afatet" s'del as numri i të skaduarave
    if (leja('afatet')) r.appendChild(kpi('Të skaduara në raft', num(nSkad), 'Shiko afatet →', nSkad ? 'kritik' : null, null, function () { af.filtri = 'skaduar'; shkoTe('afatet'); }, 'kpi-lidhje'));

    // Sipas folderave (renditur sipas numrit të produkteve)
    var stat = foldera.map(function (f) { return { f: f, n: 0, s: 0 }; });
    var sipasId = {};
    stat.forEach(function (x) { sipasId[x.f.id] = x; });
    te.forEach(function (p) { var x = sipasId[p.kategoriaId]; if (x) { x.n++; x.s += (p.sasia | 0); } });
    stat.sort(function (a, b) { return b.n - a.n || a.f.emri.localeCompare(b.f.emri, 'sq'); });
    var maks = stat.reduce(function (m, x) { return Math.max(m, x.n); }, 0) || 1;
    var pf = $('permbFolderat');
    pf.textContent = '';
    if (!stat.length) pf.appendChild(el('div', 'bosh-mesazh', 'S\'ka foldera ende.'));
    $('permbFolderatNr').textContent = foldera.length ? foldera.length + ' ' + (foldera.length === 1 ? 'folder' : 'foldera') : '';
    stat.forEach(function (x) {
      var b = el('button', 'shirit-rresht'); b.type = 'button';
      b.title = x.f.emri + ': ' + produkteTekst(x.n) + ', ' + num(x.s) + ' copë';
      b.appendChild(el('span', 'shirit-emri', x.f.emri));
      var pista = el('span', 'shirit-pista');
      var sh = el('span', 'shirit'); sh.style.width = (x.n / maks * 100) + '%';
      var ngj = ngjyraEFolderit(x.f.id); if (ngj) sh.style.background = ngj;
      if (!x.n) sh.style.opacity = '0';
      pista.appendChild(sh);
      b.appendChild(pista);
      b.appendChild(el('span', 'shirit-num', num(x.n)));
      b.addEventListener('click', function () { shkoTe(x.f.id); });
      pf.appendChild(b);
    });

    // Ndryshuar së fundi
    var tf = $('permbTeFundit');
    tf.textContent = '';
    var tefundit = te.filter(function (p) { return p.prekurSe; }).sort(function (a, b) { return b.prekurSe - a.prekurSe; }).slice(0, 6);
    if (!tefundit.length) tf.appendChild(el('div', 'bosh-mesazh', 'Asnjë ndryshim ende.'));
    tefundit.forEach(function (p) { tf.appendChild(rreshtIShkurter(p, kohaRelative(p.prekurSe))); });

    // Pa stok (sasi 0) — më të ndryshuarat së fundi lart
    var tu = $('permbTeUleta');
    tu.textContent = '';
    var paStok = te.filter(eshteZero).sort(function (a, b) { return ((b.prekurSe || 0) - (a.prekurSe || 0)) || krahasoEmrin(a, b); });
    $('permbPaStokNr').textContent = paStok.length ? num(paStok.length) : '';
    if (!paStok.length) tu.appendChild(el('div', 'bosh-mesazh', te.length ? 'Asnjë produkt pa stok.' : 'S\'ka produkte ende.'));
    paStok.slice(0, 6).forEach(function (p) { tu.appendChild(rreshtIShkurter(p, null)); });
  }

  function rreshtIShkurter(p, kohaTekst) {
    var b = el('button', 'ls-rresht'); b.type = 'button';
    var m = el('div', 'ls-emri');
    var e = el('div', p.emri ? null : 'emri-bosh', p.emri || 'Pa emër');
    m.appendChild(e);
    var nen = el('div', 'ls-nen', kohaTekst || emriFolderit(p.kategoriaId));
    if (kohaTekst) nen.title = dataOra(p.prekurSe);
    m.appendChild(nen);
    b.appendChild(m);
    var q = el('span', 'ls-sasia' + (kohaTekst ? '' : ' cip') + (eshteZero(p) ? ' zero' : ''), num(p.sasia));
    b.appendChild(q);
    b.title = (p.emri || 'Pa emër') + ' · ' + p.barkodi + ' · ' + emriFolderit(p.kategoriaId);
    b.addEventListener('click', function () { shfaqOseHapProduktin(celesi(p.kategoriaId, p.barkodi)); });
    return b;
  }
  $('btnShihTeFundit').addEventListener('click', function () { shkoTe('te-gjitha', { reset: true, rendi: ['koha', -1] }); });
  $('btnShihTeUleta').addEventListener('click', function () { shkoTe('te-gjitha', { reset: true, filtri: 'zero' }); });

  // ================= Tabela =================
  function krahasoEmrin(a, b) {
    if (!a.emri && !b.emri) return a.barkodi.localeCompare(b.barkodi, undefined, { numeric: true });
    if (!a.emri) return 1;
    if (!b.emri) return -1;
    return a.emri.localeCompare(b.emri, 'sq', { sensitivity: 'base' }) || a.barkodi.localeCompare(b.barkodi, undefined, { numeric: true });
  }
  function krahasuesi(k, d) {
    return function (a, b) {
      var r = 0;
      if (k === 'emri') {
        if (!a.emri !== !b.emri) return a.emri ? -1 : 1; // pa emër gjithmonë në fund
        r = krahasoEmrin(a, b) * d;
        return r;
      }
      if (k === 'sasia') r = (a.sasia - b.sasia) * d;
      else if (k === 'koha') r = ((a.prekurSe || 0) - (b.prekurSe || 0)) * d;
      else if (k === 'barkodi') r = a.barkodi.localeCompare(b.barkodi, undefined, { numeric: true }) * d;
      else if (k === 'folderi') r = emriFolderit(a.kategoriaId).localeCompare(emriFolderit(b.kategoriaId), 'sq') * d;
      return r || krahasoEmrin(a, b);
    };
  }

  function perputhetMeKerkimin(p, fjalet) {
    if (!fjalet.length) return true;
    var tekst = normalizo(p.emri) + ' ' + normalizo(p.barkodi) + ' ' + normalizo(emriFolderit(p.kategoriaId)) + ' ' + normalizo(p.furnizuesi);
    return fjalet.every(function (f) { return tekst.indexOf(f) !== -1; });
  }

  // Lista bazë e pamjes (pa filtër/kërkim), lista e filtruar dhe numrat e filtrave.
  function llogaritTabelen() {
    var baza = pamja === 'te-gjitha' ? teGjithaProduktet() : produktetEFolderit(pamja);
    var harta = hartaEBarkodeve();
    var fjalet = normalizo(tab.kerkimi).split(/\s+/).filter(Boolean);
    var meKerkim = baza.filter(function (p) { return perputhetMeKerkimin(p, fjalet); });
    var numrat = { teGjitha: 0, zero: 0, paEmer: 0, dublikate: 0 };
    numrat.teGjitha = meKerkim.length;
    meKerkim.forEach(function (p) {
      if (eshteZero(p)) numrat.zero++;
      if (!p.emri) numrat.paEmer++;
      if (harta[p.barkodi].length > 1) numrat.dublikate++;
    });
    var fil = meKerkim.filter(function (p) {
      if (tab.filtri === 'zero') return eshteZero(p);
      if (tab.filtri === 'paEmer') return !p.emri;
      if (tab.filtri === 'dublikate') return harta[p.barkodi].length > 1;
      return true;
    });
    fil.sort(krahasuesi(tab.rendiK, tab.rendiD));
    return { baza: baza, fil: fil, numrat: numrat, harta: harta };
  }

  var tabelaAktuale = { fil: [], faqe: [] };

  function renderTabelen() {
    var neFolder = pamja !== 'te-gjitha';
    var t = llogaritTabelen();
    tabelaAktuale.fil = t.fil;

    // Titulli dhe nëntitulli
    var totSasia = 0;
    t.baza.forEach(function (p) { totSasia += (p.sasia | 0); });
    $('tabTitulli').textContent = neFolder ? emriFolderit(pamja) : 'Të gjitha produktet';
    $('tabNen').textContent = produkteTekst(t.baza.length) + ' · ' + num(totSasia) + ' copë' +
      (neFolder ? '' : ' · ' + nrEmer(foldera.length, 'folder', 'foldera'));
    $('fushaBarkodit').classList.toggle('fsheh', !neFolder);
    $('btnFolderMenu').classList.toggle('fsheh', !neFolder);
    $('kerko').placeholder = neFolder ? 'Filtro këtë folder…' : 'Filtro të gjitha produktet…';
    $('tabela').classList.toggle('pa-folder', neFolder);
    Array.prototype.forEach.call(document.querySelectorAll('.k-folderi'), function (x) { x.style.display = neFolder ? 'none' : ''; });

    // Filtrat
    Array.prototype.forEach.call(document.querySelectorAll('#filtrat button'), function (b) {
      b.classList.toggle('aktiv', b.dataset.f === tab.filtri);
    });
    Array.prototype.forEach.call(document.querySelectorAll('#filtrat .n'), function (s) {
      var n = t.numrat[s.dataset.n];
      s.textContent = n ? num(n) : '';
    });

    // Renditja në tituj
    Array.prototype.forEach.call(document.querySelectorAll('.tabela th.renditshme'), function (th) {
      var aktiv = th.dataset.k === tab.rendiK;
      th.classList.toggle('renditur', aktiv);
      th.querySelector('.shigjete').textContent = aktiv ? (tab.rendiD > 0 ? '▲' : '▼') : '▲';
      th.setAttribute('aria-sort', aktiv ? (tab.rendiD > 0 ? 'ascending' : 'descending') : 'none');
    });

    // Pastro zgjedhjet që s'ekzistojnë më
    Object.keys(tab.zgjedhura).forEach(function (k) { if (!produktet[k]) delete tab.zgjedhura[k]; });

    // Faqosja
    var madh = ops.madhFaqes || 0;
    var faqet = madh ? Math.max(1, Math.ceil(t.fil.length / madh)) : 1;
    if (tab.faqja >= faqet) tab.faqja = faqet - 1;
    if (tab.faqja < 0) tab.faqja = 0;
    var fillimi = madh ? tab.faqja * madh : 0;
    var faqe = madh ? t.fil.slice(fillimi, fillimi + madh) : t.fil;
    tabelaAktuale.faqe = faqe;
    if (tab.fokus >= faqe.length) tab.fokus = faqe.length - 1;

    var trup = $('tabelaTrup');
    trup.textContent = '';
    var frag = document.createDocumentFragment();
    var shpejt = eLejuarSasiaShpejte();
    var lejaNdrysho = leja('stokuNdrysho'), lejaFshi = leja('stokuFshi');
    faqe.forEach(function (p, i) {
      var k = celesi(p.kategoriaId, p.barkodi);
      var tr = el('tr', (tab.zgjedhura[k] ? 'zgjedhur' : '') + (i === tab.fokus ? ' fokus' : '') + (tab.flash === k ? ' flash' : ''));
      tr.dataset.k = k;
      tr.dataset.i = i;
      tr.draggable = lejaNdrysho; // zvarritja mbi një folder = zhvendosje

      var td0 = el('td', 'k-zgjedh');
      var cb = el('input', 'kutize'); cb.type = 'checkbox'; cb.checked = !!tab.zgjedhura[k]; cb.setAttribute('aria-label', 'Zgjidh');
      td0.appendChild(cb);
      tr.appendChild(td0);

      var td1 = el('td', 'k-barkodi');
      td1.appendChild(el('span', 'mono', p.barkodi));
      var tjeret = t.harta[p.barkodi];
      if (tjeret.length > 1) {
        var dc = el('span', 'dublikat-cip', '×' + tjeret.length);
        dc.title = 'Gjendet në: ' + tjeret.map(function (x) { return emriFolderit(x.kategoriaId) + ' (' + x.sasia + ')'; }).join(', ');
        td1.appendChild(dc);
      }
      td1.title = p.barkodi;
      tr.appendChild(td1);

      var td2 = el('td', 'k-emri' + (p.emri ? '' : ' emri-bosh'), p.emri || '(pa emër)');
      if (p.furnizuesi) td2.appendChild(el('span', 'k-furn', p.furnizuesi)); // v212: furnizuesi (nëse është shënuar), i zbehtë
      td2.title = (p.emri || '') + (p.furnizuesi ? ' · ' + p.furnizuesi : '');
      tr.appendChild(td2);

      var td3 = el('td', 'k-folderi');
      if (neFolder) td3.style.display = 'none';
      else td3.appendChild(folderCip(p.kategoriaId));
      tr.appendChild(td3);

      var td4 = el('td', 'k-sasia');
      if (shpejt) {
        var w = el('span', 'sasia-shpejt');
        var mi = el('button', null, '−'); mi.type = 'button'; mi.dataset.v = 'minus'; mi.setAttribute('aria-label', 'Zvogëlo sasinë');
        var inp = el('input'); inp.type = 'number'; inp.value = String(p.sasia); inp.min = '0'; inp.dataset.v = 'sasia'; inp.setAttribute('aria-label', 'Sasia');
        var pl = el('button', null, '+'); pl.type = 'button'; pl.dataset.v = 'plus'; pl.setAttribute('aria-label', 'Rrit sasinë');
        w.appendChild(mi); w.appendChild(inp); w.appendChild(pl);
        td4.appendChild(w);
      } else {
        // Dizajni: sasia 0 me të kuqe ("Pa stok")
        var sq = el('span', 'sasia-qeliz' + (eshteZero(p) ? ' zero' : ''), num(p.sasia));
        if (eshteZero(p)) sq.title = 'Pa stok';
        td4.appendChild(sq);
      }
      tr.appendChild(td4);

      var td5 = el('td', 'k-koha', kohaRelative(p.prekurSe));
      td5.dataset.koha = String(p.prekurSe || 0);
      td5.title = p.prekurSe ? dataOra(p.prekurSe) : 'E panjohur (produkt i vjetër)';
      tr.appendChild(td5);

      var td6 = el('td', 'k-veprime');
      var vr = el('span', 'veprime-rreshti');
      [['ndrysho', 'Ndrysho (Enter)', ''], ['zhvendos', 'Zhvendos në folder tjetër', ''], ['fshij', 'Fshi (Delete)', ' rrezik']].filter(function (x) {
        return x[0] === 'fshij' ? lejaFshi : lejaNdrysho;
      }).forEach(function (x) {
        var b = el('button', 'btn-ikone' + x[2]); b.type = 'button'; b.dataset.v = x[0]; b.title = x[1]; b.setAttribute('aria-label', x[1]);
        b.innerHTML = IKONA[x[0]];
        vr.appendChild(b);
      });
      td6.appendChild(vr);
      tr.appendChild(td6);
      frag.appendChild(tr);
    });
    trup.appendChild(frag);
    tab.flash = null;

    // Gjendja bosh
    var bosh = $('tabelaBosh');
    var kaFiltra = !!tab.kerkimi.trim() || tab.filtri !== 'te-gjitha';
    bosh.classList.toggle('fsheh', t.fil.length > 0);
    $('tabela').classList.toggle('fsheh', t.fil.length === 0);
    if (!t.fil.length) {
      bosh.textContent = '';
      var ik = el('div'); ik.innerHTML = '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 8 12 3 3 8v8l9 5 9-5Z"></path><path d="M3 8l9 5 9-5M12 13v8"></path></svg>';
      bosh.appendChild(ik);
      if (kaFiltra) {
        bosh.appendChild(el('h3', null, 'Asnjë produkt nuk përputhet'));
        bosh.appendChild(el('div', null, 'Provo një kërkim tjetër ose hiq filtrin.'));
        var pb = el('button', 'btn dyte', 'Pastro kërkimin dhe filtrat'); pb.type = 'button'; pb.style.marginTop = '14px';
        pb.addEventListener('click', function () { tab.kerkimi = ''; $('kerko').value = ''; tab.filtri = 'te-gjitha'; renderTabelen(); });
        bosh.appendChild(pb);
      } else if (neFolder) {
        bosh.appendChild(el('h3', null, 'Ky folder është bosh'));
        bosh.appendChild(el('div', null, 'Skano me skaner USB në fushën e barkodit lart, ose kliko “Shto produkt”.'));
      } else {
        bosh.appendChild(el('h3', null, 'S\'ka produkte ende'));
        bosh.appendChild(el('div', null, perdoruesi() ? 'Produktet e skanuara në telefon shfaqen këtu automatikisht.' : 'Hyr në llogari për t\'i parë produktet nga telefoni, ose importo nga Excel.'));
      }
    }

    // Faqosja
    $('faqosja').classList.toggle('fsheh', t.fil.length === 0);
    $('faqInfo').textContent = t.fil.length ? (madh ? (fillimi + 1) + '–' + (fillimi + faqe.length) + ' nga ' + num(t.fil.length) : produkteTekst(t.fil.length)) +
      (t.fil.length !== t.baza.length ? ' (filtruar nga ' + num(t.baza.length) + ')' : '') : '';
    $('faqNr').textContent = 'Faqja ' + (tab.faqja + 1) + ' / ' + faqet;
    $('faqPara').disabled = tab.faqja <= 0;
    $('faqPas').disabled = tab.faqja >= faqet - 1;
    $('madhFaqes').value = String(madh);
    var faqosjaENevojshme = madh && faqet > 1;
    $('faqPara').classList.toggle('fsheh', !faqosjaENevojshme);
    $('faqPas').classList.toggle('fsheh', !faqosjaENevojshme);
    $('faqNr').classList.toggle('fsheh', !faqosjaENevojshme);

    rifreskoZgjedhjen();
  }

  function zgjedhuraLista() { return Object.keys(tab.zgjedhura).filter(function (k) { return produktet[k]; }); }
  function rifreskoZgjedhjen() {
    var n = zgjedhuraLista().length;
    $('shiritZgjedhjes').classList.toggle('fsheh', n === 0);
    $('zgjedhjaNumri').textContent = n === 1 ? '1 i zgjedhur' : num(n) + ' të zgjedhur';
    var kb = $('zgjidhKrejt');
    var neFil = tabelaAktuale.fil.filter(function (p) { return tab.zgjedhura[celesi(p.kategoriaId, p.barkodi)]; }).length;
    kb.checked = tabelaAktuale.fil.length > 0 && neFil === tabelaAktuale.fil.length;
    kb.indeterminate = neFil > 0 && neFil < tabelaAktuale.fil.length;
    kb.title = kb.checked ? 'Hiq zgjedhjen' : (tabelaAktuale.fil.length === 1 ? 'Zgjidh produktin e listës' : 'Zgjidh të gjitha ' + tabelaAktuale.fil.length + ' produktet e listës');
    Array.prototype.forEach.call($('tabelaTrup').children, function (tr) {
      var z = !!tab.zgjedhura[tr.dataset.k];
      tr.classList.toggle('zgjedhur', z);
      var c = tr.querySelector('.kutize'); if (c) c.checked = z;
    });
  }

  function zgjidhRreshtin(i, meShift) {
    var p = tabelaAktuale.faqe[i]; if (!p) return;
    var k = celesi(p.kategoriaId, p.barkodi);
    // Ankora mbahet si çelës produkti (jo pozicion): pas filtrimit, renditjes ose faqes tjetër pozicioni i vjetër s'vlen më
    var iAnkores = -1;
    if (meShift && tab.ankoraZgjedhjes !== null) {
      tabelaAktuale.faqe.some(function (x, j) { if (celesi(x.kategoriaId, x.barkodi) === tab.ankoraZgjedhjes) { iAnkores = j; return true; } return false; });
    }
    if (iAnkores !== -1) {
      var a = Math.min(iAnkores, i), b = Math.max(iAnkores, i);
      var vlera = !tab.zgjedhura[k];
      for (var j = a; j <= b; j++) {
        var q = tabelaAktuale.faqe[j]; if (!q) continue;
        var kk = celesi(q.kategoriaId, q.barkodi);
        if (vlera) tab.zgjedhura[kk] = true; else delete tab.zgjedhura[kk];
      }
    } else {
      if (tab.zgjedhura[k]) delete tab.zgjedhura[k]; else tab.zgjedhura[k] = true;
    }
    tab.ankoraZgjedhjes = k;
    rifreskoZgjedhjen();
  }

  function vendosFokusin(i) {
    var rr = $('tabelaTrup').children;
    if (!rr.length) return;
    i = Math.max(0, Math.min(rr.length - 1, i));
    tab.fokus = i;
    Array.prototype.forEach.call(rr, function (tr, j) { tr.classList.toggle('fokus', j === i); });
    rr[i].scrollIntoView({ block: 'nearest' });
  }

  // Ngjarjet e tabelës (një dëgjues për të gjitha rreshtat)
  $('tabelaTrup').addEventListener('click', function (ev) {
    var tr = ev.target.closest('tr'); if (!tr) return;
    var k = tr.dataset.k, i = parseInt(tr.dataset.i, 10);
    var p = produktet[k]; if (!p) return;
    // (pa preventDefault: shfletuesi do ta kthente kutizën në gjendjen e mëparshme pasi rifreskoZgjedhjen e vendos saktë)
    if (ev.target.classList.contains('kutize')) { zgjidhRreshtin(i, ev.shiftKey); return; }
    if (ev.target.closest('.k-zgjedh')) { zgjidhRreshtin(i, ev.shiftKey); return; }
    var btn = ev.target.closest('button');
    var inp = ev.target.closest('input');
    if (inp && inp.dataset.v === 'sasia') return;
    if (btn && btn.dataset.v) {
      if (btn.dataset.v === 'ndrysho') hapProduktin(k);
      else if (btn.dataset.v === 'zhvendos') hapZhvendosjen([k]);
      else if (btn.dataset.v === 'fshij') fshijProduktet([k]);
      else if (btn.dataset.v === 'minus') ndryshoSasineShpejt(k, -1);
      else if (btn.dataset.v === 'plus') ndryshoSasineShpejt(k, 1);
      return;
    }
    if (ev.ctrlKey || ev.metaKey) { zgjidhRreshtin(i, false); return; }
    if (ev.shiftKey) { zgjidhRreshtin(i, true); return; }
    tab.fokus = i;
    hapProduktin(k);
  });
  $('tabelaTrup').addEventListener('change', function (ev) {
    var inp = ev.target;
    if (inp.dataset.v !== 'sasia') return;
    var k = inp.closest('tr').dataset.k;
    var p = produktet[k]; if (!p) return;
    if (!leja('stokuNdrysho')) { inp.value = String(p.sasia); return; }
    var v = parseInt(inp.value, 10);
    if (isFinite(v) && !AF.sasiaEPranueshme(inp.value)) { toast(AF.SASIA_E_MADHE); inp.value = String(p.sasia); return; }
    if (!isFinite(v) || v < 0) { inp.value = String(p.sasia); return; }
    if (v === p.sasia) return;
    var reg = ndrysho(function (api) { api.vendos(k, Object.assign({}, p, { sasia: v, prekurSe: Date.now() })); });
    toast('Sasia u ndryshua: ' + (p.emri || p.barkodi) + ' → ' + v, { veprimi: function () { zhbej(reg); } });
  });
  $('tabelaTrup').addEventListener('keydown', function (ev) {
    if (ev.target.dataset && ev.target.dataset.v === 'sasia' && ev.key === 'Enter') { ev.preventDefault(); ev.target.blur(); }
  });
  $('tabelaTrup').addEventListener('focusin', function (ev) {
    if (ev.target.dataset && ev.target.dataset.v === 'sasia') ev.target.select();
  });
  $('tabelaTrup').addEventListener('dragstart', function (ev) {
    var tr = ev.target.closest && ev.target.closest('tr'); if (!tr) return;
    if (!leja('stokuNdrysho')) { ev.preventDefault(); return; }
    var k = tr.dataset.k;
    var keys = tab.zgjedhura[k] ? zgjedhuraLista() : [k];
    ev.dataTransfer.effectAllowed = 'move';
    ev.dataTransfer.setData('application/x-stoku-produkte', JSON.stringify(keys));
    ev.dataTransfer.setData('text/plain', keys.map(function (x) { return produktet[x] ? produktet[x].barkodi : ''; }).join('\n'));
  });

  function ndryshoSasineShpejt(k, delta) {
    var p = produktet[k]; if (!p || !leja('stokuNdrysho')) return;
    var re = Math.max(0, p.sasia + delta);
    if (re === p.sasia) return;
    ndrysho(function (api) { api.vendos(k, Object.assign({}, p, { sasia: re, prekurSe: Date.now() })); });
  }

  // Tituj: renditja
  Array.prototype.forEach.call(document.querySelectorAll('.tabela th.renditshme'), function (th) {
    th.addEventListener('click', function () {
      var k = th.dataset.k;
      if (tab.rendiK === k) tab.rendiD = -tab.rendiD;
      else { tab.rendiK = k; tab.rendiD = (k === 'koha' ? -1 : 1); }
      tab.faqja = 0; tab.fokus = -1;
      renderTabelen();
    });
  });
  $('zgjidhKrejt').addEventListener('change', function () {
    var krejt = $('zgjidhKrejt').checked;
    tabelaAktuale.fil.forEach(function (p) {
      var k = celesi(p.kategoriaId, p.barkodi);
      if (krejt) tab.zgjedhura[k] = true; else delete tab.zgjedhura[k];
    });
    rifreskoZgjedhjen();
  });
  Array.prototype.forEach.call(document.querySelectorAll('#filtrat button'), function (b) {
    b.addEventListener('click', function () { tab.filtri = b.dataset.f; tab.faqja = 0; tab.fokus = -1; renderTabelen(); });
  });
  var kerkoKohez = null;
  $('kerko').addEventListener('input', function () {
    clearTimeout(kerkoKohez);
    kerkoKohez = setTimeout(function () { tab.kerkimi = $('kerko').value; tab.faqja = 0; tab.fokus = -1; renderTabelen(); }, 90);
  });
  $('kerko').addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && $('kerko').value) { ev.stopPropagation(); $('kerko').value = ''; tab.kerkimi = ''; renderTabelen(); }
    if (ev.key === 'ArrowDown') { ev.preventDefault(); $('kerko').blur(); vendosFokusin(0); }
    if (ev.key === 'Enter') {
      // Skaneri USB e shkruan barkodin + Enter brenda 90 ms: filtri zbatohet tani, jo me listën e kërkimit të mëparshëm
      if (tab.kerkimi !== $('kerko').value) { clearTimeout(kerkoKohez); tab.kerkimi = $('kerko').value; tab.faqja = 0; tab.fokus = -1; renderTabelen(); }
      if (tabelaAktuale.fil.length === 1) { var p = tabelaAktuale.fil[0]; hapProduktin(celesi(p.kategoriaId, p.barkodi)); }
    }
  });
  $('madhFaqes').addEventListener('change', function () { ops.madhFaqes = parseInt($('madhFaqes').value, 10) || 0; ruajOps(); tab.faqja = 0; renderTabelen(); });
  $('faqPara').addEventListener('click', function () { tab.faqja--; tab.fokus = -1; renderTabelen(); $('kryesore').scrollTop = 0; });
  $('faqPas').addEventListener('click', function () { tab.faqja++; tab.fokus = -1; renderTabelen(); $('kryesore').scrollTop = 0; });
  $('zgjAnulo').addEventListener('click', function () { tab.zgjedhura = {}; rifreskoZgjedhjen(); });
  $('zgjFshij').addEventListener('click', function () { fshijProduktet(zgjedhuraLista()); });
  $('zgjZhvendos').addEventListener('click', function () { hapZhvendosjen(zgjedhuraLista()); });
  $('zgjEksport').addEventListener('click', function () { hapEksportin('excel'); });

  // ================= Kërkimi global (lart) =================
  var kgAktiv = -1, kgRezultatet = [];
  function renderKerkimiGlobal() {
    var q = leja('stoku') ? $('kerkoGlobal').value.trim() : '';
    var box = $('kerkoRezultate');
    if (!q) { box.classList.remove('hapur'); kgRezultatet = []; return; }
    var fjalet = normalizo(q).split(/\s+/).filter(Boolean);
    var qn = normalizo(q);
    var te = teGjithaProduktet().filter(function (p) { return perputhetMeKerkimin(p, fjalet); });
    function pike(p) {
      if (p.barkodi === q) return 0;
      if (normalizo(p.barkodi).indexOf(qn) === 0) return 1;
      if (normalizo(p.emri).indexOf(qn) === 0) return 2;
      return 3;
    }
    te.sort(function (a, b) { return pike(a) - pike(b) || krahasoEmrin(a, b); });
    kgRezultatet = te.slice(0, 8);
    if (kgAktiv >= kgRezultatet.length) kgAktiv = kgRezultatet.length - 1;
    box.textContent = '';
    if (!te.length) box.appendChild(el('div', 'bosh-mesazh', 'Asnjë produkt nuk u gjet në asnjë folder.'));
    kgRezultatet.forEach(function (p, i) {
      var r = el('div', 'kr-rresht' + (i === kgAktiv ? ' aktiv' : ''));
      r.setAttribute('role', 'option');
      var m = el('div', 'kr-emri');
      var e = el('div', null, p.emri || '(pa emër)');
      if (!p.emri) e.style.cssText = 'color:var(--gri);font-style:italic';
      m.appendChild(e);
      m.appendChild(el('div', 'mono gri', p.barkodi));
      r.appendChild(m);
      r.appendChild(folderCip(p.kategoriaId));
      var s = el('span', 'kr-sasia', num(p.sasia));
      if (eshteZero(p)) s.style.color = 'var(--rrezik)';
      r.appendChild(s);
      r.addEventListener('mousedown', function (ev) { ev.preventDefault(); zgjidhRezultatin(i); });
      box.appendChild(r);
    });
    if (te.length) {
      var f = el('div', 'kr-fund', te.length > kgRezultatet.length ? 'Enter: shih të gjitha ' + num(te.length) + ' rezultatet në tabelë' : 'Enter: hap në tabelë · ↑↓ për të zgjedhur');
      f.style.cursor = 'pointer';
      f.addEventListener('mousedown', function (ev) { ev.preventDefault(); hapKerkiminNeTabele(); });
      box.appendChild(f);
    }
    box.classList.add('hapur');
  }
  function zgjidhRezultatin(i) {
    var p = kgRezultatet[i]; if (!p) return;
    mbyllKerkiminGlobal(true);
    shfaqOseHapProduktin(celesi(p.kategoriaId, p.barkodi));
  }
  function hapKerkiminNeTabele() {
    var q = $('kerkoGlobal').value.trim();
    mbyllKerkiminGlobal(true);
    shkoTe('te-gjitha', { reset: true, kerkimi: q });
  }
  function mbyllKerkiminGlobal(pastro) {
    $('kerkoRezultate').classList.remove('hapur');
    kgAktiv = -1;
    if (pastro) { $('kerkoGlobal').value = ''; $('kerkoGlobal').blur(); }
  }
  $('kerkoGlobal').addEventListener('input', function () { kgAktiv = -1; renderKerkimiGlobal(); });
  $('kerkoGlobal').addEventListener('focus', function () { if ($('kerkoGlobal').value.trim()) renderKerkimiGlobal(); });
  $('kerkoGlobal').addEventListener('blur', function () { setTimeout(function () { $('kerkoRezultate').classList.remove('hapur'); }, 120); });
  $('kerkoGlobal').addEventListener('keydown', function (ev) {
    if (ev.key === 'ArrowDown') { ev.preventDefault(); kgAktiv = Math.min(kgRezultatet.length - 1, kgAktiv + 1); renderKerkimiGlobal(); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); kgAktiv = Math.max(-1, kgAktiv - 1); renderKerkimiGlobal(); }
    else if (ev.key === 'Enter') {
      ev.preventDefault();
      var q = $('kerkoGlobal').value.trim();
      if (!q) return;
      if (kgAktiv >= 0) { zgjidhRezultatin(kgAktiv); return; }
      var ekzakt = kgRezultatet.filter(function (p) { return p.barkodi === q; });
      if (ekzakt.length === 1) { zgjidhRezultatin(kgRezultatet.indexOf(ekzakt[0])); return; }
      hapKerkiminNeTabele();
    } else if (ev.key === 'Escape') { ev.stopPropagation(); mbyllKerkiminGlobal(true); }
  });

  // ================= Dialogët: hapja/mbyllja =================
  var dialogPara = null; // elementi që kishte fokusin para hapjes (kthehet pas mbylljes)
  function hapDialog(id, fokusId) {
    mbyllMenune();
    if (!document.querySelector('.mbulese.hapur')) dialogPara = document.activeElement;
    $(id).classList.add('hapur');
    if (fokusId) setTimeout(function () { var f = $(fokusId); if (f) { f.focus(); if (f.select && f.type !== 'number') f.select(); } }, 20);
  }
  function mbyllDialog(id) {
    if (id === 'dlgLexim' && !anuloLeximin.leje) { anuloLeximin(); return; }
    $(id).classList.remove('hapur');
    if (id === 'dlgLexim') mbyllFletenETelefonit(mbyllDialog.uRuajt === true);
    if (id === 'dlgKonfirmo' && konf.zgjidh) { var z = konf.zgjidh; konf.zgjidh = null; clearInterval(konf.kohez); z(false); }
    if (!document.querySelector('.mbulese.hapur') && dialogPara && dialogPara.focus && document.contains(dialogPara)) {
      try { dialogPara.focus(); } catch (e) { /* ok */ }
    }
  }
  function dialogISiperm() {
    if ($('dlgKonfirmo').classList.contains('hapur')) return $('dlgKonfirmo');
    var te = Array.prototype.slice.call(document.querySelectorAll('.mbulese.hapur'));
    var z = function (d) { return parseInt(getComputedStyle(d).zIndex, 10) || 0; };
    te.sort(function (a, b) { return z(a) - z(b); }); // me z-index të njëjtë mbetet rendi i faqes
    return te.length ? te[te.length - 1] : null;
  }
  Array.prototype.forEach.call(document.querySelectorAll('.mbulese'), function (m) {
    m.addEventListener('mousedown', function (ev) { if (ev.target === m) mbyllDialog(m.id); });
    Array.prototype.forEach.call(m.querySelectorAll('[data-mbyll]'), function (b) {
      b.addEventListener('click', function () { mbyllDialog(m.id); });
    });
  });

  // Konfirmim (Promise true/false), me vonesë opsionale në sekonda për veprimet e rrezikshme
  var konf = { zgjidh: null, kohez: null };
  function konfirmo(titulli, teksti, butoni, vonesa) {
    return new Promise(function (zgjidh) {
      $('kfTitulli').textContent = titulli;
      $('kfTekst').textContent = teksti;
      var b = $('kfPo');
      clearInterval(konf.kohez);
      if (konf.zgjidh) { var paraZ = konf.zgjidh; konf.zgjidh = null; paraZ(false); } // pyetja e mëparshme s'mbetet pa përgjigje
      konf.zgjidh = zgjidh;
      if (vonesa > 0) {
        var s = vonesa;
        b.disabled = true; b.textContent = butoni + ' (' + s + ')';
        konf.kohez = setInterval(function () {
          s--;
          if (s > 0) b.textContent = butoni + ' (' + s + ')';
          else { clearInterval(konf.kohez); b.disabled = false; b.textContent = butoni; b.focus(); }
        }, 1000);
      } else { b.disabled = false; b.textContent = butoni; }
      hapDialog('dlgKonfirmo');
      setTimeout(function () { (vonesa > 0 ? $('kfJo') : b).focus(); }, 20);
    });
  }
  $('kfPo').addEventListener('click', function () {
    if ($('kfPo').disabled) return;
    var z = konf.zgjidh; konf.zgjidh = null; clearInterval(konf.kohez);
    $('dlgKonfirmo').classList.remove('hapur');
    if (z) z(true);
  });
  $('kfJo').addEventListener('click', function () { mbyllDialog('dlgKonfirmo'); });

  // ================= Produkti: i ri / ndrysho =================
  var pr = null; // { k: çelësi ekzistues ose null, ngaBarkodi: bool }
  function mbushFolderat(select, zgjedhur) {
    select.textContent = '';
    foldera.forEach(function (f) {
      var o = el('option', null, f.emri); o.value = f.id;
      select.appendChild(o);
    });
    if (zgjedhur) select.value = zgjedhur;
  }

  // v231: pa "Ndrysho produktet" produkti s'hapet: shfaqet te folderi i vet, i filtruar me barkodin (pa mesazh)
  function shfaqOseHapProduktin(k) {
    var p = produktet[k]; if (!p) return;
    if (leja('stokuNdrysho')) { hapProduktin(k); return; }
    shkoTe(p.kategoriaId, { reset: true, kerkimi: p.barkodi });
  }
  function hapProduktin(k, ngaBarkodi) {
    var p = produktet[k]; if (!p || !leja('stokuNdrysho')) return;
    pr = { k: k, ngaBarkodi: !!ngaBarkodi };
    $('prTitulli').textContent = p.emri || 'Produkt pa emër';
    mbushFolderat($('prFolderi'), p.kategoriaId);
    $('prBarkodi').value = p.barkodi;
    $('prEmri').value = p.emri || '';
    $('prFurnizuesi').value = p.furnizuesi || ''; // v212
    mbushSugjerimetEFurnizuesve();
    $('prSasia').value = '';
    $('prSasia').placeholder = 'p.sh. 5 ose -2';
    $('prSasiaEtik').textContent = 'Shto ose zbrit sasinë (tani: ' + p.sasia + ')';
    $('prFshij').classList.remove('fsheh');
    $('prKoha').textContent = p.prekurSe ? 'Ndryshuar: ' + dataOra(p.prekurSe) : '';
    $('prGabim').textContent = '';
    rifreskoInfonEProduktit();
    hapDialog('dlgProdukt', ngaBarkodi ? 'prSasia' : 'prEmri');
  }

  function hapProduktIRi(barkodi, folderId, ngaBarkodi) {
    if (!leja('stokuShto')) return;
    if (!foldera.length) { if (leja('stokuFoldera')) { toast('Krijo fillimisht një folder.'); hapFolderIRi(); } else toast('S\'ka asnjë folder.'); return; }
    pr = { k: null, ngaBarkodi: !!ngaBarkodi };
    $('prTitulli').textContent = 'Produkt i ri';
    mbushFolderat($('prFolderi'), folderId || (folderSipasId(pamja) ? pamja : foldera[0].id));
    $('prBarkodi').value = barkodi || '';
    // Nëse i njëjti barkod ekziston në një folder tjetër me emër, emri plotësohet vetë.
    var emriNgaTjeter = barkodi ? emriNgaBarkodi(barkodi) : ''; // kujtesa, folderat e tjerë, afatet
    $('prEmri').value = emriNgaTjeter;
    // v212: furnizuesi, opsional: nga kujtesa ose afatet nëse barkodi njihet, përndryshe bosh
    $('prFurnizuesi').value = barkodi ? furnizuesiNgaBarkodi(barkodi) : '';
    mbushSugjerimetEFurnizuesve();
    $('prSasia').value = '';
    $('prSasia').placeholder = '0';
    $('prSasiaEtik').textContent = 'Sasia';
    $('prFshij').classList.add('fsheh');
    $('prKoha').textContent = '';
    $('prGabim').textContent = '';
    rifreskoInfonEProduktit();
    hapDialog('dlgProdukt', barkodi ? (emriNgaTjeter ? 'prSasia' : 'prEmri') : 'prBarkodi');
  }

  function rifreskoInfonEProduktit() {
    if (!pr) return;
    var b = $('prBarkodi').value.trim();
    var fid = $('prFolderi').value;
    var info = $('prGjetur');
    info.textContent = '';
    var tjeret = (hartaEBarkodeve()[b] || []).filter(function (x) { return celesi(x.kategoriaId, x.barkodi) !== pr.k; });
    var neKetFolder = null;
    tjeret.forEach(function (x) { if (x.kategoriaId === fid) neKetFolder = x; });
    if (tjeret.length) {
      info.appendChild(el('span', null, neKetFolder && !pr.k ? 'Ekziston tashmë në këtë folder: sasia do t\'i shtohet asaj ekzistuese. Gjendet në:' : 'Ky barkod gjendet edhe në:'));
      tjeret.forEach(function (x) {
        var c = folderCip(x.kategoriaId, emriFolderit(x.kategoriaId) + ' · ' + x.sasia);
        c.title = 'Hap produktin në këtë folder';
        c.addEventListener('click', function () { hapProduktin(celesi(x.kategoriaId, x.barkodi)); });
        info.appendChild(c);
      });
    }
    info.classList.toggle('fsheh', !tjeret.length);
    // Parapamja e sasisë
    var tekst = $('prSasia').value.trim();
    var d = /^-?\d+$/.test(tekst) ? parseInt(tekst, 10) : null;
    var pv = $('prParapamje');
    pv.textContent = '';
    if (pr.k && produktet[pr.k]) {
      var baza = produktet[pr.k].sasia;
      if (fid !== produktet[pr.k].kategoriaId && neKetFolder) baza += neKetFolder.sasia;
      var re = Math.max(0, baza + (d || 0));
      pv.appendChild(document.createTextNode('Sasia e re: '));
      pv.appendChild(el('strong', null, num(re)));
      if (fid !== produktet[pr.k].kategoriaId && neKetFolder) pv.appendChild(document.createTextNode(' (bashkuar me atë që ekziston te ' + emriFolderit(fid) + ')'));
    } else if (!pr.k && neKetFolder && d !== null) {
      pv.appendChild(document.createTextNode('Sasia e re: '));
      pv.appendChild(el('strong', null, num(Math.max(0, neKetFolder.sasia + d))));
    }
  }
  ['prBarkodi', 'prSasia'].forEach(function (id) { $(id).addEventListener('input', rifreskoInfonEProduktit); });
  $('prFolderi').addEventListener('change', rifreskoInfonEProduktit);
  $('prMinus').addEventListener('click', function () { hapSasine(-1); });
  $('prPlus').addEventListener('click', function () { hapSasine(1); });
  function hapSasine(d) {
    var v = $('prSasia').value.trim();
    var n = /^-?\d+$/.test(v) ? parseInt(v, 10) : 0;
    $('prSasia').value = String(n + d);
    $('prSasia').focus();
    rifreskoInfonEProduktit();
  }
  ['prBarkodi', 'prEmri', 'prFurnizuesi', 'prSasia'].forEach(function (id) {
    $(id).addEventListener('keydown', function (ev) {
      if (ev.key !== 'Enter') return;
      ev.preventDefault();
      if (id === 'prBarkodi') $('prEmri').focus();
      else if (id === 'prEmri') $('prFurnizuesi').focus();
      else if (id === 'prFurnizuesi') $('prSasia').focus();
      else ruajProduktin();
    });
  });
  function mbushSugjerimetEFurnizuesve() {
    var dl = $('afdFurnizuesit'); dl.textContent = '';
    furnizuesitPerSugjerim().forEach(function (f) { var o = el('option'); o.value = f; dl.appendChild(o); });
  }

  function barkodIVlefshem(b) {
    if (!b) return 'Shkruaj barkodin.';
    if (b.length > 64) return 'Barkodi është shumë i gjatë.';
    if (b.indexOf('::') !== -1 || /\s/.test(b)) return 'Barkodi s\'mund të ketë hapësira ose "::".';
    return null;
  }

  function ruajProduktin() {
    if (!pr) return;
    var b = $('prBarkodi').value.trim();
    var fid = $('prFolderi').value;
    var emri = $('prEmri').value.trim();
    var furn = $('prFurnizuesi').value.replace(/\s+/g, ' ').trim().slice(0, 80); // v212: opsional
    var tekst = $('prSasia').value.trim();
    var gab = barkodIVlefshem(b);
    if (gab) { $('prGabim').textContent = gab; $('prBarkodi').focus(); return; }
    if (!folderSipasId(fid)) { $('prGabim').textContent = 'Zgjidh folderin.'; return; }
    if (tekst && !/^-?\d+$/.test(tekst)) { $('prGabim').textContent = 'Sasia duhet të jetë numër i plotë.'; $('prSasia').focus(); return; }
    // Deri në 6 shifra (si te afatet): më shumë zakonisht është barkodi i produktit tjetër, i skanuar në fushën e sasisë
    if (tekst && !AF.sasiaEPranueshme(tekst)) { $('prGabim').textContent = AF.SASIA_E_MADHE; $('prSasia').focus(); $('prSasia').select(); return; }
    var d = tekst ? parseInt(tekst, 10) : 0;
    var kRi = celesi(fid, b);
    var tani = Date.now();
    var ishte = pr.k ? produktet[pr.k] : null;
    if (pr.k && !ishte) { mbyllDialog('dlgProdukt'); return; } // u fshi ndërkohë (p.sh. nga telefoni)
    if (!emri && !(ishte && !ishte.emri)) { $('prGabim').textContent = 'Shkruaj emrin e produktit.'; $('prEmri').focus(); return; }
    if (!ishte && !tekst) { $('prGabim').textContent = 'Shkruaj sasinë.'; $('prSasia').focus(); return; }
    var ekzistues = produktet[kRi] && kRi !== pr.k ? produktet[kRi] : null;
    // v230: produkt i ri = "Shto produkte të reja"; ndryshimi i një ekzistuesi (ose bashkimi me të) = "Ndrysho produktet"
    if (!leja(ishte || ekzistues ? 'stokuNdrysho' : 'stokuShto')) return;
    if (ishte && ekzistues && b !== ishte.barkodi) {
      $('prGabim').textContent = 'Ky barkod ekziston tashmë te "' + emriFolderit(fid) + '".'; $('prBarkodi').focus(); return;
    }
    var mesazhi;
    mesoNgaPerdoruesi(b, emri, furn);
    var reg = ndrysho(function (api) {
      if (ishte) {
        var baza = ishte.sasia + (ekzistues ? ekzistues.sasia : 0);
        // Object.assign: fushat e tjera (p.sh. furnizuesi nga importi) s'humbin kur ndryshon emri/sasia/folderi
        var ri = Object.assign({}, ekzistues || {}, ishte, { barkodi: b, emri: emri || (ekzistues ? ekzistues.emri : ''), sasia: Math.max(0, baza + d), kategoriaId: fid, prekurSe: tani });
        if (furn) ri.furnizuesi = furn; else delete ri.furnizuesi; // v212: fusha e zbrazur e heq furnizuesin
        if (kRi !== pr.k) api.fshij(pr.k);
        api.vendos(kRi, ri);
        mesazhi = ekzistues ? 'U zhvendos te "' + emriFolderit(fid) + '" dhe u bashkua (tani: ' + ri.sasia + ').' :
          kRi !== pr.k && fid !== ishte.kategoriaId ? 'U zhvendos te "' + emriFolderit(fid) + '".' : 'U ruajt: ' + (ri.emri || ri.barkodi) + ' (' + ri.sasia + ')';
      } else if (ekzistues) {
        var r2 = Object.assign({}, ekzistues, { emri: emri || ekzistues.emri, sasia: Math.max(0, ekzistues.sasia + d), prekurSe: tani });
        if (furn) r2.furnizuesi = furn;
        api.vendos(kRi, r2);
        mesazhi = 'Ekzistonte, sasia u shtua (tani: ' + r2.sasia + ').';
      } else {
        var r3 = { barkodi: b, emri: emri, sasia: Math.max(0, d), kategoriaId: fid, prekurSe: tani };
        if (furn) r3.furnizuesi = furn;
        api.vendos(kRi, r3);
        mesazhi = 'U shtua: ' + (emri || b);
      }
    });
    var ngaBarkodi = pr.ngaBarkodi;
    tab.flash = kRi;
    renderTabelenNeseDuhet();
    mbyllDialog('dlgProdukt');
    pr = null;
    toast(mesazhi, { veprimi: function () { zhbej(reg); } });
    if (ngaBarkodi && !$('fushaBarkodit').classList.contains('fsheh')) $('barkodi').focus();
  }
  function renderTabelenNeseDuhet() { if (pamja !== 'permbledhja') renderTabelen(); }
  $('prRuaj').addEventListener('click', ruajProduktin);
  $('prFshij').addEventListener('click', function () {
    if (!pr || !pr.k || !leja('stokuFshi')) return;
    var k = pr.k;
    mbyllDialog('dlgProdukt');
    pr = null;
    fshijProduktet([k]);
  });
  $('btnShto').addEventListener('click', function () { hapProduktIRi('', null, false); });

  // Fusha e barkodit (skaner USB = tastierë që shkruan barkodin + Enter)
  function duketSiDiçkaTjeter(t) {
    if (/^[0-9]{6,14}$/.test(t)) return false;
    return t.length > 30 || /^https?:\/\//i.test(t) || /\s/.test(t);
  }
  $('barkodi').addEventListener('keydown', function (ev) {
    if (ev.key !== 'Enter') return;
    ev.preventDefault();
    var b = $('barkodi').value.trim();
    $('barkodi').value = '';
    if (!b || !folderSipasId(pamja)) return;
    if (duketSiDiçkaTjeter(b)) { toast('Kjo nuk duket si barkod produkti (ngjan me kod QR ose tekst).'); return; }
    var gab = barkodIVlefshem(b);
    if (gab) { toast(gab); return; }
    var k = celesi(pamja, b);
    // v231: pa lejen përkatëse s'hapet dritarja dhe s'thuhet pse: produkti që ekziston gjendet në tabelë (filtri),
    // barkodi i ri thjesht s'është në këtë folder
    if (!leja(produktet[k] ? 'stokuNdrysho' : 'stokuShto')) {
      if (produktet[k]) { $('kerko').value = b; tab.kerkimi = b; tab.faqja = 0; tab.fokus = -1; renderTabelen(); }
      else toast('Ky barkod s\'është në këtë folder.');
      return;
    }
    if (produktet[k]) hapProduktin(k, true);
    else hapProduktIRi(b, pamja, true);
  });
  $('barkodi').addEventListener('focus', function () { $('fushaBarkodit').classList.add('theksuar'); });
  $('barkodi').addEventListener('blur', function () { $('fushaBarkodit').classList.remove('theksuar'); });

  // ================= Fshirja dhe zhvendosja =================
  async function fshijProduktet(keys) {
    keys = keys.filter(function (k) { return produktet[k]; });
    if (!keys.length || !leja('stokuFshi')) return;
    if (keys.length > 1) {
      var po = await konfirmo('Të fshihen ' + keys.length + ' produkte?', 'Do të fshihen ' + keys.length + ' produktet e zgjedhura nga të gjitha pajisjet.\n\nMund ta zhbësh menjëherë pas fshirjes.', 'Fshi');
      if (!po) return;
    }
    var emri = keys.length === 1 ? (produktet[keys[0]].emri || produktet[keys[0]].barkodi) : '';
    var reg = ndrysho(function (api) { keys.forEach(function (k) { api.fshij(k); delete tab.zgjedhura[k]; }); });
    toast(keys.length === 1 ? 'U fshi: ' + emri : 'U fshinë ' + keys.length + ' produkte.', { veprimi: function () { zhbej(reg); } });
  }

  var zhKeys = [];
  function hapZhvendosjen(keys) {
    zhKeys = keys.filter(function (k) { return produktet[k]; });
    if (!zhKeys.length || !leja('stokuNdrysho')) return;
    var burimet = {};
    zhKeys.forEach(function (k) { burimet[produktet[k].kategoriaId] = true; });
    var nj = zhKeys.length === 1 ? produktet[zhKeys[0]] : null;
    $('zhTitulli').textContent = nj ? 'Zhvendos produktin' : 'Zhvendos ' + zhKeys.length + ' produkte';
    $('zhTekst').textContent = nj ? 'Zgjidh folderin ku do të zhvendoset "' + (nj.emri || nj.barkodi) + '". Nëse aty ekziston i njëjti barkod, sasitë bashkohen.'
      : 'Zgjidh folderin. Produktet që ekzistojnë tashmë atje bashkohen (sasitë mblidhen).';
    var lista = $('zhLista');
    lista.textContent = '';
    var cakat = foldera.filter(function (f) { return !(Object.keys(burimet).length === 1 && burimet[f.id]); });
    if (!cakat.length) lista.appendChild(el('div', 'bosh-mesazh', 'Nuk ka asnjë folder tjetër ku të zhvendoset.'));
    cakat.forEach(function (f) {
      var b = el('button', 'zgjedhje'); b.type = 'button';
      var ik = el('span'); ik.innerHTML = IKONA.folder; ik.style.cssText = 'display:flex;color:var(--btn-tekst)';
      b.appendChild(ik);
      var t = el('span'); t.appendChild(el('b', null, f.emri)); t.appendChild(el('small', null, produkteTekst(produktetEFolderit(f.id).length)));
      b.appendChild(t);
      b.addEventListener('click', function () { mbyllDialog('dlgZhvendos'); zhvendosProduktet(zhKeys, f); });
      lista.appendChild(b);
    });
    hapDialog('dlgZhvendos');
    setTimeout(function () { var f = lista.querySelector('button'); if (f) f.focus(); }, 30);
  }

  function zhvendosProduktet(keys, cak) {
    keys = keys.filter(function (k) { return produktet[k] && produktet[k].kategoriaId !== cak.id; });
    if (!keys.length || !leja('stokuNdrysho')) return;
    var bashkuar = 0, tani = Date.now();
    var reg = ndrysho(function (api) {
      keys.forEach(function (k) {
        var p = produktet[k];
        var kRi = celesi(cak.id, p.barkodi);
        var ek = produktet[kRi];
        if (ek) bashkuar++;
        api.fshij(k);
        delete tab.zgjedhura[k];
        var ri = {
          barkodi: p.barkodi, emri: (ek && ek.emri) ? ek.emri : p.emri,
          sasia: (ek ? ek.sasia : 0) + p.sasia, kategoriaId: cak.id, prekurSe: tani
        };
        var furn = (ek && ek.furnizuesi) || p.furnizuesi; // v212: furnizuesi s'humbet kur zhvendoset
        if (furn) ri.furnizuesi = furn;
        api.vendos(kRi, ri);
      });
    });
    var m = (keys.length === 1 ? 'U zhvendos' : keys.length + ' produkte u zhvendosën') + ' te "' + cak.emri + '"' +
      (bashkuar ? ' (' + (bashkuar === 1 ? '1 u bashkua me një ekzistues' : bashkuar + ' u bashkuan me ekzistuesit') + ')' : '') + '.';
    toast(m, { veprimi: function () { zhbej(reg); } });
  }

  // ================= Folderat =================
  var flRiemerto = null, flPasKrijimit = null;
  var zgjedhesIkonave = window.StokuAfatet.zgjedhesIIkonave($('flIkonat'), function () { return $('flEmri').value; });
  $('flEmri').addEventListener('input', zgjedhesIkonave.sugjero);
  // pasKrijimit (opsionale): thirret me id e folderit të ri në vend që të hapet folderi (p.sh. nga importi i fletës)
  function hapFolderIRi(pasKrijimit) {
    if (!leja('stokuFoldera')) return;
    flRiemerto = null;
    flPasKrijimit = typeof pasKrijimit === 'function' ? pasKrijimit : null;
    zgjedhesIkonave.fillo(null);
    $('flTitulli').textContent = 'Folder i ri';
    $('flRuaj').textContent = 'Krijo';
    $('flEmri').value = '';
    $('flGabim').textContent = '';
    hapDialog('dlgFolder', 'flEmri');
  }
  function hapRiemertimin(f) {
    if (!leja('stokuFoldera')) return;
    flRiemerto = f.id; flPasKrijimit = null;
    $('flTitulli').textContent = 'Ndrysho folderin';
    zgjedhesIkonave.fillo(window.StokuAfatet.ikonaEFolderit(f).id);
    $('flRuaj').textContent = 'Ruaj';
    $('flEmri').value = f.emri;
    $('flGabim').textContent = '';
    hapDialog('dlgFolder', 'flEmri');
  }
  function ruajFolderin() {
    if (!leja('stokuFoldera')) { mbyllDialog('dlgFolder'); return; }
    var emri = $('flEmri').value.trim();
    if (!emri) { $('flGabim').textContent = 'Shkruaj emrin e folderit.'; return; }
    var njejte = foldera.some(function (f) { return f.id !== flRiemerto && f.emri.toLowerCase() === emri.toLowerCase(); });
    if (njejte) { $('flGabim').textContent = 'Ekziston tashmë një folder me këtë emër.'; return; }
    if (flRiemerto) {
      var f = folderSipasId(flRiemerto);
      if (f) { foldera = foldera.map(function (x) { return x.id === f.id ? { id: x.id, emri: emri, ikona: zgjedhesIkonave.vlera() || undefined, ndryshuarSe: Date.now() } : x; }); ruaj(); }
      mbyllDialog('dlgFolder');
      toast('Folderi u ndryshua.');
      return;
    }
    var id = 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    foldera.push({ id: id, emri: emri, ikona: zgjedhesIkonave.vlera() || undefined, ndryshuarSe: Date.now() });
    ruaj();
    mbyllDialog('dlgFolder');
    var cb = flPasKrijimit; flPasKrijimit = null;
    if (cb) { cb(id); return; }
    shkoTe(id);
    setTimeout(function () { $('barkodi').focus(); }, 30);
  }
  $('flRuaj').addEventListener('click', ruajFolderin);
  $('flEmri').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); ruajFolderin(); } });
  $('btnFolderIRi').addEventListener('click', function () { hapFolderIRi(); });

  async function fshijFolderin(f) {
    if (!leja('stokuFshi')) return;
    var brenda = produktetEFolderit(f.id);
    var po = await konfirmo('Të fshihet folderi "' + f.emri + '"?',
      brenda.length ? 'Do të fshihet folderi bashkë me ' + produkteTekst(brenda.length) + ' brenda tij, në të gjitha pajisjet.\n\nMund ta zhbësh menjëherë pas fshirjes.' : 'Folderi është bosh.',
      'Fshi folderin', brenda.length ? 3 : 0);
    if (!po) return;
    var reg = ndrysho(function (api) {
      brenda.forEach(function (p) { api.fshij(celesi(f.id, p.barkodi)); });
      foldera = foldera.filter(function (x) { return x.id !== f.id; });
      fshira.foldera[f.id] = Date.now();
    });
    if (pamja === f.id) shkoTe('permbledhja');
    toast('Folderi "' + f.emri + '" u fshi.', { veprimi: function () { zhbej(reg); } });
  }

  async function fshijTeGjithaNeFolder(f) {
    if (!leja('stokuFshi')) return;
    var brenda = produktetEFolderit(f.id);
    if (!brenda.length) { toast('Folderi është bosh.'); return; }
    var po = await konfirmo('Të fshihen të gjitha produktet?', (brenda.length === 1 ? 'Do të fshihet 1 produkt' : 'Do të fshihen të gjitha ' + brenda.length + ' produktet') + ' nga folderi "' + f.emri + '". Folderi mbetet.\n\nKëshillë: eksporto fillimisht në Excel nëse do një kopje.', 'Fshi të gjitha', 5);
    if (!po) return;
    var reg = ndrysho(function (api) { brenda.forEach(function (p) { api.fshij(celesi(f.id, p.barkodi)); }); });
    toast((brenda.length === 1 ? 'U fshi 1 produkt' : 'U fshinë ' + brenda.length + ' produkte') + ' nga "' + f.emri + '".', { veprimi: function () { zhbej(reg); } });
  }

  // ================= Menutë =================
  function hapMenu(elementet, poz) {
    var m = $('menu');
    m.textContent = '';
    elementet.forEach(function (x) {
      if (x === '-') { m.appendChild(el('hr')); return; }
      var b = el('button', x.rrezik ? 'rrezik' : '', x.t); b.type = 'button';
      b.addEventListener('click', function () { mbyllMenune(); x.fn(); });
      m.appendChild(b);
    });
    m.classList.add('hapur');
    var x0, y0;
    if (poz && poz.getBoundingClientRect) { var r = poz.getBoundingClientRect(); x0 = r.left; y0 = r.bottom + 4; }
    else { x0 = poz.x; y0 = poz.y; }
    var w = m.offsetWidth, h = m.offsetHeight;
    m.style.left = Math.min(x0, window.innerWidth - w - 8) + 'px';
    m.style.top = Math.min(y0, window.innerHeight - h - 8) + 'px';
    var f = m.querySelector('button'); if (f) f.focus();
  }
  function mbyllMenune() { $('menu').classList.remove('hapur'); }
  document.addEventListener('mousedown', function (ev) { if (!ev.target.closest('#menu')) mbyllMenune(); });
  $('menu').addEventListener('keydown', function (ev) {
    var bb = Array.prototype.slice.call($('menu').querySelectorAll('button'));
    var i = bb.indexOf(document.activeElement);
    if (ev.key === 'ArrowDown') { ev.preventDefault(); bb[(i + 1) % bb.length].focus(); }
    if (ev.key === 'ArrowUp') { ev.preventDefault(); bb[(i - 1 + bb.length) % bb.length].focus(); }
    if (ev.key === 'Escape') { ev.stopPropagation(); mbyllMenune(); }
  });
  function hapMenuFolderi(f, poz) {
    // v230: vetëm veprimet e lejuara (pa ndarës bosh)
    var l = [
      { t: 'Hap folderin', fn: function () { shkoTe(f.id); } },
      { t: 'Ndrysho emrin / ikonën…', leja: 'stokuFoldera', fn: function () { hapRiemertimin(f); } },
      '-',
      { t: 'Eksporto në Excel', leja: 'eksportExcel', fn: function () { eksportoDirekt('excel', produktetEFolderit(f.id), f); } },
      { t: 'Eksporto PDF (raport)', leja: 'eksportPdf', fn: function () { eksportoDirekt('pdf-lista', produktetEFolderit(f.id), f); } },
      { t: 'Eksporto PDF (etiketa)', leja: 'eksportPdf', fn: function () { eksportoDirekt('pdf-etiketa', produktetEFolderit(f.id), f); } },
      { t: 'Importo në këtë folder…', leja: 'stokuImporto', fn: function () { hapImportin(f.id); } },
      '-',
      { t: 'Fshi të gjitha produktet…', leja: 'stokuFshi', rrezik: true, fn: function () { fshijTeGjithaNeFolder(f); } },
      { t: 'Fshi folderin…', leja: 'stokuFshi', rrezik: true, fn: function () { fshijFolderin(f); } }
    ].filter(function (x) { return x === '-' || !x.leja || leja(x.leja); });
    var pa = [];
    l.forEach(function (x) { if (x !== '-' || (pa.length && pa[pa.length - 1] !== '-')) pa.push(x); });
    if (pa[pa.length - 1] === '-') pa.pop();
    hapMenu(pa, poz);
  }
  $('btnFolderMenu').addEventListener('click', function () { var f = folderSipasId(pamja); if (f) hapMenuFolderi(f, $('btnFolderMenu')); });

  // ================= Eksporti =================
  function slug(emri) {
    return String(emri).toLowerCase().replace(/ë/g, 'e').replace(/ç/g, 'c').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'stoku';
  }
  function vulaKohore(meOre) {
    var d = new Date();
    return d.getFullYear() + '-' + dy(d.getMonth() + 1) + '-' + dy(d.getDate()) + (meOre ? '_' + dy(d.getHours()) + dy(d.getMinutes()) : '');
  }
  function shkarko(bajtet, emri, mime) {
    var blob = new Blob([bajtet], { type: mime });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = emri;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 5000);
  }

  var ek = { formati: 'excel', fusha: 'pamja' };
  function opsionetEEksportit() {
    var lista = [];
    var nZ = zgjedhuraLista().length;
    if (pamja !== 'permbledhja') {
      var kaFiltra = !!tab.kerkimi.trim() || tab.filtri !== 'te-gjitha';
      var emri = pamja === 'te-gjitha' ? 'Të gjitha produktet' : 'Folderi "' + emriFolderit(pamja) + '"';
      lista.push({ v: 'pamja', t: kaFiltra ? 'Lista aktuale (me kërkimin/filtrin)' : emri, n: tabelaAktuale.fil.length,
        s: kaFiltra ? emri + ', vetëm ato që shfaqen tani' : 'Siç shfaqen në tabelë, me të njëjtën renditje' });
    }
    lista.push({ v: 'zgjedhura', t: 'Vetëm të zgjedhurat', n: nZ, s: nZ ? 'Produktet e shënuara në tabelë' : 'Zgjidh produkte në tabelë me kutizat', jo: !nZ });
    lista.push({ v: 'krejt', t: 'Krejt stoku', n: Object.keys(produktet).length, s: 'Të gjithë folderat (në Excel: një fletë për çdo folder + përmbledhje)' });
    return lista;
  }
  function hapEksportin(formati) {
    // v230: vetëm formatet e lejuara (Excel / PDF)
    var lx2 = leja('eksportExcel'), lp = leja('eksportPdf');
    if (!lx2 && !lp) { leja('eksportExcel'); return; }
    if (formati === 'excel' && !lx2) formati = 'pdf';
    if (formati === 'pdf' && !lp) formati = 'excel';
    ek.formati = formati === 'pdf' ? 'pdf-lista' : formati;
    var lista = opsionetEEksportit();
    ek.fusha = zgjedhuraLista().length ? 'zgjedhura' : (pamja !== 'permbledhja' ? 'pamja' : 'krejt');
    var c = $('ekFushat');
    c.textContent = '';
    lista.forEach(function (o) {
      var l = el('label', 'zgjedhje' + (o.jo ? ' jo-aktive' : ''));
      var r = el('input'); r.type = 'radio'; r.name = 'ekFusha'; r.value = o.v; r.checked = o.v === ek.fusha; r.disabled = !!o.jo;
      r.addEventListener('change', function () { ek.fusha = o.v; rifreskoEksportin(); });
      l.appendChild(r);
      var t = el('span');
      t.appendChild(el('b', null, o.t + ' · ' + produkteTekst(o.n)));
      t.appendChild(el('small', null, o.s));
      l.appendChild(t);
      l.dataset.v = o.v;
      c.appendChild(l);
    });
    rifreskoEksportin();
    hapDialog('dlgEksport');
    setTimeout(function () { $('ekBtn').focus(); }, 30);
  }
  function rifreskoEksportin() {
    Array.prototype.forEach.call(document.querySelectorAll('#ekFormatet .zgjedhje'), function (l) {
      var a = l.dataset.v === ek.formati;
      l.classList.toggle('aktiv', a);
      l.querySelector('input').checked = a;
    });
    Array.prototype.forEach.call(document.querySelectorAll('#ekFushat .zgjedhje'), function (l) { l.classList.toggle('aktiv', l.dataset.v === ek.fusha); });
  }
  Array.prototype.forEach.call(document.querySelectorAll('#ekFormatet .zgjedhje'), function (l) {
    l.addEventListener('click', function () { ek.formati = l.dataset.v; rifreskoEksportin(); });
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-eksport]'), function (b) {
    b.addEventListener('click', function () { hapEksportin(b.dataset.eksport); });
  });
  $('ekBtn').addEventListener('click', function () {
    var lista, folderi = null;
    if (ek.fusha === 'zgjedhura') {
      var z = tab.zgjedhura;
      lista = tabelaAktuale.fil.filter(function (p) { return z[celesi(p.kategoriaId, p.barkodi)]; });
      // të zgjedhurat që s'janë në filtrin aktual (p.sh. u zgjodhën para ndryshimit të filtrit)
      var brenda = {};
      lista.forEach(function (p) { brenda[celesi(p.kategoriaId, p.barkodi)] = true; });
      zgjedhuraLista().forEach(function (k) { if (!brenda[k]) lista.push(produktet[k]); });
    } else if (ek.fusha === 'pamja') {
      lista = tabelaAktuale.fil.slice();
      if (pamja !== 'te-gjitha') folderi = folderSipasId(pamja);
    } else {
      lista = null; // krejt stoku
    }
    mbyllDialog('dlgEksport');
    eksportoDirekt(ek.formati, lista, folderi);
  });

  // lista = null → krejt stoku; folderi = kur të gjitha janë nga një folder
  function eksportoDirekt(formati, lista, folderi) {
    if (!leja(formati === 'excel' ? 'eksportExcel' : 'eksportPdf')) return;
    if (lista && !lista.length) { toast('S\'ka produkte për eksport.'); return; }
    if (!lista && !Object.keys(produktet).length) { toast('S\'ka produkte për eksport.'); return; }
    if (lista && !folderi) {
      var ids = {};
      lista.forEach(function (p) { ids[p.kategoriaId] = true; });
      if (Object.keys(ids).length === 1) folderi = folderSipasId(Object.keys(ids)[0]);
    }
    try {
      if (formati === 'excel') eksportoExcel(lista, folderi);
      else if (formati === 'pdf-lista') eksportoPdfRaport(lista, folderi);
      else eksportoPdfEtiketa(lista, folderi);
    } catch (e) {
      console.error(e);
      toast('Eksporti dështoi. Provo përsëri.');
    }
  }

  // v212: kolona "Furnizuesi" pas sasisë, si te eksporti i afateve (bosh kur produkti s'ka furnizues të shënuar)
  var KOLONAT_FOLDERI = [
    { title: 'Barkodi', width: 20, type: 'text' }, { title: 'Emri i produktit', width: 44, type: 'text' },
    { title: 'Sasia', width: 10, type: 'number' }, { title: 'Furnizuesi', width: 22, type: 'text' }, { title: 'Ndryshuar më', width: 18, type: 'date' }
  ];
  var KOLONAT_ME_FOLDER = [
    { title: 'Barkodi', width: 20, type: 'text' }, { title: 'Emri i produktit', width: 44, type: 'text' },
    { title: 'Folderi', width: 20, type: 'text' }, { title: 'Sasia', width: 10, type: 'number' }, { title: 'Furnizuesi', width: 22, type: 'text' }, { title: 'Ndryshuar më', width: 18, type: 'date' }
  ];
  function fletaFolderi(emri, prod) {
    return { name: emri, columns: KOLONAT_FOLDERI, totalLabel: 'Gjithsej', totalColumns: [2], redZeroColumn: 2,
      rows: prod.map(function (p) { return [p.barkodi, p.emri || '', p.sasia | 0, p.furnizuesi || '', p.prekurSe || '']; }) };
  }
  function fletaMeFolder(emri, prod) {
    return { name: emri, columns: KOLONAT_ME_FOLDER, totalLabel: 'Gjithsej', totalColumns: [3], redZeroColumn: 3,
      rows: prod.map(function (p) { return [p.barkodi, p.emri || '', emriFolderit(p.kategoriaId), p.sasia | 0, p.furnizuesi || '', p.prekurSe || '']; }) };
  }

  function eksportoExcel(lista, folderi) {
    var fletet, emriSk;
    if (!lista) {
      var te = teGjithaProduktet();
      var permb = foldera.map(function (f) {
        var pp = produktetEFolderit(f.id);
        var s = 0; pp.forEach(function (p) { s += p.sasia | 0; });
        var z = pp.filter(eshteZero).length;
        return [f.emri, pp.length, s, z];
      });
      fletet = [{ name: 'Përmbledhje', columns: [
        { title: 'Folderi', width: 26 }, { title: 'Produkte', width: 12, type: 'number' },
        { title: 'Sasia totale', width: 14, type: 'number' }, { title: 'Me sasi 0', width: 12, type: 'number' }
      ], rows: permb, totalLabel: 'Gjithsej', totalColumns: [1, 2, 3] }];
      foldera.forEach(function (f) { fletet.push(fletaFolderi(f.emri, produktetEFolderit(f.id).sort(krahasoEmrin))); });
      var jashte = te.filter(function (p) { return !folderSipasId(p.kategoriaId); });
      if (jashte.length) fletet.push(fletaFolderi('Pa folder', jashte.sort(krahasoEmrin)));
      fletet.push(fletaMeFolder('Të gjitha', te.sort(krahuesiFolderEmer)));
      emriSk = 'stoku_krejt_' + vulaKohore(true) + '.xlsx';
    } else if (folderi) {
      fletet = [fletaFolderi(folderi.emri, lista)];
      emriSk = 'malli_' + slug(folderi.emri) + '_' + vulaKohore(true) + '.xlsx';
    } else {
      fletet = [fletaMeFolder('Produktet', lista)];
      emriSk = 'stoku_' + vulaKohore(true) + '.xlsx';
    }
    shkarko(window.StokuXlsx.buildWorkbook(fletet), emriSk, MIME_XLSX);
    toast('U shkarkua: ' + emriSk);
  }
  function krahuesiFolderEmer(a, b) {
    var ia = foldera.findIndex(function (f) { return f.id === a.kategoriaId; });
    var ib = foldera.findIndex(function (f) { return f.id === b.kategoriaId; });
    return (ia - ib) || krahasoEmrin(a, b);
  }

  function jsPdfGati() {
    if (!window.jspdf || !window.jspdf.jsPDF) { toast('PDF-ja s\'është gati. Kontrollo internetin dhe rifresko faqen.'); return false; }
    return true;
  }

  // PDF raport: tabelë e rregullt A4, e grupuar sipas folderave kur ka disa, me totale dhe numra faqesh.
  function eksportoPdfRaport(lista, folderi) {
    if (!jsPdfGati()) return;
    var krejt = !lista;
    var prod = krejt ? teGjithaProduktet().sort(krahuesiFolderEmer) : lista.slice();
    var grupet = [];
    if (krejt || (!folderi && pamja === 'te-gjitha' && tab.rendiK === 'folderi')) {
      var sipas = {};
      prod.forEach(function (p) { (sipas[p.kategoriaId] = sipas[p.kategoriaId] || []).push(p); });
      foldera.forEach(function (f) { if (sipas[f.id]) { grupet.push({ emri: f.emri, prod: sipas[f.id] }); delete sipas[f.id]; } });
      Object.keys(sipas).forEach(function (id) { grupet.push({ emri: '(pa folder)', prod: sipas[id] }); });
    } else {
      grupet.push({ emri: null, prod: prod });
    }
    var meFolder = !folderi && !krejt && grupet.length === 1;
    var meFurn = prod.some(function (p) { return !!p.furnizuesi; }); // v212: kolona e furnizuesit vetëm kur dikush e ka

    var doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
    var W = 210, H = 297, M = 14, y = M;
    var ngjyra = [21, 101, 192];
    var kol = meFolder
      ? (meFurn ? [{ t: 'Nr.', w: 11 }, { t: 'Barkodi', w: 34 }, { t: 'Emri i produktit', w: 63 }, { t: 'Furnizuesi', w: 30 }, { t: 'Folderi', w: 26 }, { t: 'Sasia', w: 18, d: 1 }]
        : [{ t: 'Nr.', w: 11 }, { t: 'Barkodi', w: 36 }, { t: 'Emri i produktit', w: 83 }, { t: 'Folderi', w: 32 }, { t: 'Sasia', w: 20, d: 1 }])
      : (meFurn ? [{ t: 'Nr.', w: 11 }, { t: 'Barkodi', w: 36 }, { t: 'Emri i produktit', w: 81 }, { t: 'Furnizuesi', w: 34 }, { t: 'Sasia', w: 20, d: 1 }]
        : [{ t: 'Nr.', w: 11 }, { t: 'Barkodi', w: 38 }, { t: 'Emri i produktit', w: 113 }, { t: 'Sasia', w: 20, d: 1 }]);
    var RR = 6.6;
    var titulli = krejt ? 'Raporti i stokut - krejt stoku' : folderi ? 'Raporti i stokut - ' + folderi.emri : 'Raporti i stokut';
    var totN = 0, totS = 0;
    grupet.forEach(function (g) { totN += g.prod.length; g.prod.forEach(function (p) { totS += p.sasia | 0; }); });

    function shkurto(t, gjer) {
      t = String(t || '');
      if (doc.getTextWidth(t) <= gjer) return t;
      while (t.length > 1 && doc.getTextWidth(t + '…') > gjer) t = t.slice(0, -1);
      return t + '…';
    }
    function koka() {
      doc.setFillColor(245, 247, 250); doc.rect(M, y, W - 2 * M, RR, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(90, 90, 96);
      var x = M;
      kol.forEach(function (c) {
        if (c.d) doc.text(c.t, x + c.w - 2, y + 4.4, { align: 'right' }); else doc.text(c.t, x + 2, y + 4.4);
        x += c.w;
      });
      y += RR;
    }
    function faqeERe() { doc.addPage(); y = M; koka(); }
    function siguroVend(h) { if (y + h > H - 16) faqeERe(); }

    // Koka e dokumentit
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(20, 20, 24);
    doc.text(titulli, M, y + 6);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(95, 95, 102);
    var meta = 'Krijuar: ' + dataOra(Date.now()) + '   ·   ' + produkteTekst(totN) + '   ·   ' + num(totS) + ' copë' + (emriPerdoruesit() ? '   ·   Llogaria: ' + emriPerdoruesit() : '');
    doc.text(meta, M, y + 12);
    doc.setDrawColor(ngjyra[0], ngjyra[1], ngjyra[2]); doc.setLineWidth(0.6); doc.line(M, y + 15, W - M, y + 15);
    y += 20;
    koka();

    var nr = 0;
    grupet.forEach(function (g) {
      if (g.emri) {
        siguroVend(RR * 2.2);
        var s = 0; g.prod.forEach(function (p) { s += p.sasia | 0; });
        doc.setFillColor(232, 238, 247); doc.rect(M, y, W - 2 * M, RR + 0.6, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(ngjyra[0], ngjyra[1], ngjyra[2]);
        doc.text(shkurto(g.emri, 120), M + 2, y + 4.7);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
        doc.text(produkteTekst(g.prod.length) + ' · ' + num(s) + ' copë', W - M - 2, y + 4.7, { align: 'right' });
        y += RR + 0.6;
      }
      g.prod.forEach(function (p, i) {
        siguroVend(RR);
        nr++;
        if (i % 2 === 1) { doc.setFillColor(250, 251, 253); doc.rect(M, y, W - 2 * M, RR, 'F'); }
        doc.setDrawColor(236, 238, 242); doc.setLineWidth(0.2); doc.line(M, y + RR, W - M, y + RR);
        doc.setFontSize(9); doc.setTextColor(40, 40, 46);
        var x = M;
        var vlerat = [String(nr), p.barkodi, p.emri || '(pa emër)'].concat(meFurn ? [p.furnizuesi || ''] : [], meFolder ? [emriFolderit(p.kategoriaId)] : [], [num(p.sasia)]);
        kol.forEach(function (c, ci) {
          var v = vlerat[ci];
          var eshteSasi = ci === kol.length - 1;
          doc.setFont(ci === 1 ? 'courier' : 'helvetica', eshteSasi ? 'bold' : 'normal');
          if (ci === 0) doc.setTextColor(140, 140, 146);
          else if (eshteSasi && eshteZero(p)) doc.setTextColor(179, 38, 30);
          else if (ci === 2 && !p.emri) doc.setTextColor(140, 140, 146);
          else doc.setTextColor(30, 30, 34);
          if (c.d) doc.text(v, x + c.w - 2, y + 4.4, { align: 'right' });
          else doc.text(shkurto(v, c.w - 4), x + 2, y + 4.4);
          x += c.w;
        });
        y += RR;
      });
    });
    // Totali
    siguroVend(RR + 4);
    y += 1.5;
    doc.setDrawColor(ngjyra[0], ngjyra[1], ngjyra[2]); doc.setLineWidth(0.5); doc.line(M, y, W - M, y);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(20, 20, 24);
    doc.text('Gjithsej: ' + produkteTekst(totN), M + 2, y + 5.5);
    doc.text(num(totS) + ' copë', W - M - 2, y + 5.5, { align: 'right' });

    var n = doc.getNumberOfPages();
    for (var i = 1; i <= n; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(150, 150, 156);
      doc.text('Stoku · stoku.site', M, H - 8);
      doc.text('Faqja ' + i + ' / ' + n, W - M, H - 8, { align: 'right' });
    }
    var emriSk = (krejt ? 'raport_stoku_krejt_' : 'raport_' + slug(folderi ? folderi.emri : 'produktet') + '_') + vulaKohore(true) + '.pdf';
    shkarko(doc.output('arraybuffer'), emriSk, 'application/pdf');
    toast('U shkarkua: ' + emriSk);
  }

  // PDF etiketa: njësoj si në telefon — 3×8 për faqe A4, barkod i riskenueshëm + emër + sasi.
  function formatiBarkodit(b) {
    if (/^[0-9]{13}$/.test(b)) return 'EAN13';
    if (/^[0-9]{12}$/.test(b)) return 'UPC';
    if (/^[0-9]{8}$/.test(b)) return 'EAN8';
    return 'CODE128';
  }
  function vizatoBarkodin(canvas, barkodi) {
    var f = [formatiBarkodit(barkodi)];
    if (f[0] !== 'CODE128') f.push('CODE128');
    for (var i = 0; i < f.length; i++) {
      try {
        window.JsBarcode(canvas, barkodi, { format: f[i], displayValue: true, fontSize: 16, height: 46, margin: 6, background: '#ffffff', lineColor: '#000000' });
        return true;
      } catch (e) { /* formati tjetër */ }
    }
    return false;
  }
  function eksportoPdfEtiketa(lista, folderi) {
    if (!jsPdfGati()) return;
    if (!window.JsBarcode) { toast('Biblioteka e barkodeve s\'është gati. Rifresko faqen me internet.'); return; }
    var prod = lista ? lista.slice() : teGjithaProduktet().sort(krahuesiFolderEmer);
    var doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
    var fGj = 210, fL = 297, mV = 8, kolona = 3, rreshta = 8, bosh = 3;
    var qGj = (fGj - 2 * mV - (kolona - 1) * bosh) / kolona;
    var qL = (fL - 2 * mV - (rreshta - 1) * bosh) / rreshta;
    var perFaqe = kolona * rreshta;
    var canvas = document.createElement('canvas');
    prod.forEach(function (p, idx) {
      var poz = idx % perFaqe;
      if (idx > 0 && poz === 0) doc.addPage();
      var x = mV + (poz % kolona) * (qGj + bosh);
      var y = mV + Math.floor(poz / kolona) * (qL + bosh);
      doc.setDrawColor(210); doc.setLineWidth(0.2); doc.rect(x, y, qGj, qL);
      var qx = x + qGj / 2;
      if (vizatoBarkodin(canvas, p.barkodi)) {
        var bGj = qGj - 4;
        var bL = Math.min(bGj * (canvas.height / canvas.width), qL * 0.6);
        doc.addImage(canvas.toDataURL('image/png'), 'PNG', x + 2, y + 2, bGj, bL);
        var yt = y + 2 + bL + 4;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(20, 20, 20);
        var em = p.emri || '(pa emër)';
        if (em.length > 28) em = em.slice(0, 27) + '…';
        doc.text(em, qx, yt, { align: 'center' });
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
        doc.text('Sasia: ' + p.sasia, qx, yt + 5, { align: 'center' });
      } else {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
        doc.text(p.barkodi, qx, y + qL / 2, { align: 'center' });
      }
    });
    var emriSk = 'etiketa_' + slug(folderi ? folderi.emri : (lista ? 'produktet' : 'krejt')) + '_' + vulaKohore(false) + '.pdf';
    shkarko(doc.output('arraybuffer'), emriSk, 'application/pdf');
    toast('U shkarkua: ' + emriSk + ' (' + nrEmer(prod.length, 'etiketë', 'etiketa') + ')');
  }

  // ================= Importi (Excel / CSV) =================
  var im = { fletet: [], fleta: 0, emriSkedarit: '' };

  function hapImportin(folderId) {
    if (!leja('stokuImporto')) return;
    im = { fletet: [], fleta: 0, emriSkedarit: '', folderParazgjedhur: folderId || (folderSipasId(pamja) ? pamja : null) };
    $('imHapi1').classList.remove('fsheh');
    $('imHapi2').classList.add('fsheh');
    $('imMbrapa').classList.add('fsheh');
    $('imBtn').disabled = true;
    $('imGabim1').textContent = '';
    $('imSkedari').value = '';
    hapDialog('dlgImport');
  }
  $('imZona').addEventListener('click', function () { $('imSkedari').click(); });
  $('imZona').addEventListener('dragover', function (ev) { ev.preventDefault(); $('imZona').classList.add('siper'); });
  $('imZona').addEventListener('dragleave', function () { $('imZona').classList.remove('siper'); });
  $('imZona').addEventListener('drop', function (ev) {
    ev.preventDefault(); $('imZona').classList.remove('siper');
    var f = ev.dataTransfer.files && ev.dataTransfer.files[0];
    if (f) lexoSkedarin(f);
  });
  $('imSkedari').addEventListener('change', function () { var f = $('imSkedari').files[0]; if (f) lexoSkedarin(f); });
  $('imMbrapa').addEventListener('click', function () { hapImportin(im.folderParazgjedhur); });

  function dekodoTekstin(bajtet) {
    try { return new TextDecoder('utf-8', { fatal: true }).decode(bajtet); }
    catch (e) { return new TextDecoder('windows-1252').decode(bajtet); }
  }
  function lexoCsv(tekst) {
    tekst = tekst.replace(/^﻿/, '');
    var rreshtiPare = tekst.split(/\r?\n/)[0] || '';
    var ndaresit = [';', ',', '\t'];
    var ndares = ndaresit.reduce(function (m, d) { return (rreshtiPare.split(d).length > rreshtiPare.split(m).length) ? d : m; }, ',');
    var rreshtat = [], r = [], fusha = '', thonjeza = false;
    for (var i = 0; i < tekst.length; i++) {
      var c = tekst[i];
      if (thonjeza) {
        if (c === '"') { if (tekst[i + 1] === '"') { fusha += '"'; i++; } else thonjeza = false; }
        else fusha += c;
      } else if (c === '"') thonjeza = true;
      else if (c === ndares) { r.push(fusha); fusha = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && tekst[i + 1] === '\n') i++;
        r.push(fusha); rreshtat.push(r); r = []; fusha = '';
      } else fusha += c;
    }
    if (fusha !== '' || r.length) { r.push(fusha); rreshtat.push(r); }
    return rreshtat.filter(function (x) { return x.some(function (v) { return String(v).trim() !== ''; }); });
  }

  async function lexoSkedarin(f) {
    $('imGabim1').textContent = '';
    try {
      var buf = await f.arrayBuffer();
      var bajtet = new Uint8Array(buf);
      var eshteZip = bajtet[0] === 0x50 && bajtet[1] === 0x4b;
      if (eshteZip) {
        im.fletet = (await window.StokuXlsx.read(buf)).map(function (sh) {
          return { name: sh.name, rows: sh.rows.filter(function (x) { return x.some(function (v) { return String(v).trim() !== ''; }); }) };
        });
      } else if (/\.xls$/i.test(f.name)) {
        $('imGabim1').textContent = 'Formati i vjetër .xls s\'mbështetet. Hape në Excel dhe ruaje si .xlsx ose .csv.';
        return;
      } else {
        im.fletet = [{ name: f.name, rows: lexoCsv(dekodoTekstin(bajtet)) }];
      }
    } catch (e) {
      console.error(e);
      $('imGabim1').textContent = e && e.message === 'pa-dekompresim'
        ? 'Ky shfletues s\'e lexon dot këtë .xlsx. Përdor Chrome/Edge të përditësuar, ose ruaje skedarin si .csv.'
        : 'Skedari s\'u lexua. Sigurohu që është .xlsx ose .csv.';
      return;
    }
    im.fletet = im.fletet.filter(function (s) { return s.rows.length; });
    if (!im.fletet.length) { $('imGabim1').textContent = 'Skedari është bosh.'; return; }
    im.emriSkedarit = f.name;
    // Nëse është një eksport i Stoku-t me disa fletë, zgjidhet fleta "Të gjitha" (ka kolonën Folderi).
    im.fleta = 0;
    im.fletet.forEach(function (s, i) { if (/^t[eë] gjitha/i.test(s.name)) im.fleta = i; });
    if (im.fletet[im.fleta] && /^p[eë]rmbledhje/i.test(im.fletet[im.fleta].name) && im.fletet.length > 1) im.fleta = 1;
    var sel = $('imFleta');
    sel.textContent = '';
    im.fletet.forEach(function (s, i) { var o = el('option', null, s.name + ' (' + nrEmer(s.rows.length, 'rresht', 'rreshta') + ')'); o.value = String(i); sel.appendChild(o); });
    sel.value = String(im.fleta);
    $('imFletaMbajtese').classList.toggle('fsheh', im.fletet.length < 2);
    $('imHapi1').classList.add('fsheh');
    $('imHapi2').classList.remove('fsheh');
    $('imMbrapa').classList.remove('fsheh');
    $('imSkedariInfo').textContent = 'Skedari: ' + f.name;
    pergatitHarten(true);
  }

  function hamendesoKolonen(titujt, fjalet) {
    for (var i = 0; i < titujt.length; i++) {
      var t = normalizo(titujt[i]);
      if (fjalet.some(function (f) { return t.indexOf(f) !== -1; })) return i;
    }
    return -1;
  }
  function pergatitHarten(hamendeso) {
    var sh = im.fletet[im.fleta];
    var ka = $('imKoka').value === '1';
    var nKol = sh.rows.reduce(function (m, r) { return Math.max(m, r.length); }, 0);
    var titujt = [];
    for (var i = 0; i < nKol; i++) titujt.push(ka ? String(sh.rows[0][i] === undefined ? '' : sh.rows[0][i]).trim() || ('Kolona ' + (i + 1)) : 'Kolona ' + (i + 1));
    function mbush(id, lejoBosh) {
      var s = $(id), v = s.value;
      s.textContent = '';
      if (lejoBosh) { var o0 = el('option', null, '(asnjë)'); o0.value = '-1'; s.appendChild(o0); }
      titujt.forEach(function (t, i) { var o = el('option', null, t); o.value = String(i); s.appendChild(o); });
      if (!hamendeso && v !== '') s.value = v;
    }
    mbush('imKolBarkodi', false); mbush('imKolEmri', true); mbush('imKolSasia', true); mbush('imKolFolderi', true); mbush('imKolFurnizuesi', true);
    if (hamendeso) {
      if (ka) {
        var hb = hamendesoKolonen(titujt, ['barkod', 'barcode', 'ean', 'kodi', 'code', 'sku']);
        var he = hamendesoKolonen(titujt, ['emri', 'emer', 'name', 'produkt', 'artikull', 'pershkrim', 'description']);
        var hs = hamendesoKolonen(titujt, ['sasi', 'qty', 'quantity', 'stok', 'stock', 'cope', 'sasia']);
        var hf = hamendesoKolonen(titujt, ['folder', 'kategori', 'category', 'grup']);
        // v212: furnizuesi (opsional; pa kolonë → produktet mbeten pa furnizues)
        var hfu = hamendesoKolonen(titujt, ['furniz', 'furnit', 'supplier', 'kompani', 'firma', 'distribut', 'vendor']);
        if (he === hb) he = -1;
        if (hfu === hb || hfu === he || hfu === hs || hfu === hf) hfu = -1;
        $('imKolBarkodi').value = String(hb >= 0 ? hb : 0);
        $('imKolEmri').value = String(he);
        $('imKolSasia').value = String(hs);
        $('imKolFolderi').value = String(hf);
        $('imKolFurnizuesi').value = String(hfu);
      } else {
        $('imKolBarkodi').value = '0';
        $('imKolEmri').value = nKol > 1 ? '1' : '-1';
        $('imKolSasia').value = nKol > 2 ? '2' : '-1';
        $('imKolFolderi').value = '-1';
        $('imKolFurnizuesi').value = '-1';
      }
    }
    // Caku
    var c = $('imCaku'), vc = c.value;
    c.textContent = '';
    var oF = el('option', null, 'Sipas kolonës "Folderi" (krijohen folderat që mungojnë)'); oF.value = '__kolona';
    c.appendChild(oF);
    foldera.forEach(function (f) { var o = el('option', null, 'Në folderin: ' + f.emri); o.value = f.id; c.appendChild(o); });
    var oR = el('option', null, '+ Në një folder të ri (me emrin e skedarit)'); oR.value = '__ri';
    c.appendChild(oR);
    if (hamendeso) c.value = $('imKolFolderi').value !== '-1' ? '__kolona' : (im.folderParazgjedhur || (foldera[0] ? foldera[0].id : '__ri'));
    else c.value = vc;
    rifreskoImportin();
  }
  ['imKolBarkodi', 'imKolEmri', 'imKolSasia', 'imKolFolderi', 'imKolFurnizuesi', 'imCaku', 'imMenyra'].forEach(function (id) { $(id).addEventListener('change', rifreskoImportin); });
  $('imKoka').addEventListener('change', function () { pergatitHarten(true); });
  $('imFleta').addEventListener('change', function () { im.fleta = parseInt($('imFleta').value, 10) || 0; pergatitHarten(true); });

  function vleraNeTekst(v) {
    if (typeof v === 'number') {
      if (Number.isInteger(v) && Math.abs(v) < 1e21) return v.toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 0 });
      return String(v);
    }
    return String(v === undefined || v === null ? '' : v).trim();
  }
  function vleraNeSasi(v) {
    if (typeof v === 'number') return isFinite(v) ? Math.round(v) : null;
    var t = String(v || '').trim().replace(/\s/g, '').replace(',', '.');
    if (t === '') return null;
    var n = Number(t);
    return isFinite(n) ? Math.round(n) : NaN;
  }

  // Llogarit çfarë do të ndodhë, pa ndryshuar asgjë (edhe për parapamjen edhe për vetë importin).
  function planiImportit() {
    var sh = im.fletet[im.fleta];
    var ka = $('imKoka').value === '1';
    var kb = parseInt($('imKolBarkodi').value, 10), ke = parseInt($('imKolEmri').value, 10);
    var ks = parseInt($('imKolSasia').value, 10), kf = parseInt($('imKolFolderi').value, 10);
    var kfu = parseInt($('imKolFurnizuesi').value, 10);
    var caku = $('imCaku').value, menyra = $('imMenyra').value;
    var rreshtat = ka ? sh.rows.slice(1) : sh.rows;
    var emratFolder = {};
    foldera.forEach(function (f) { emratFolder[f.emri.toLowerCase()] = f.id; });
    var plan = { rreshta: [], teRinj: 0, perditesime: 0, kaluar: 0, gabime: 0, folderaTeRinj: {} };
    var neKete = {}; // për barkodet që përsëriten brenda skedarit
    rreshtat.forEach(function (r, i) {
      var b = vleraNeTekst(r[kb]);
      var emri = ke >= 0 ? vleraNeTekst(r[ke]) : '';
      var s = ks >= 0 ? vleraNeSasi(r[ks]) : 0;
      var fEmri = kf >= 0 ? vleraNeTekst(r[kf]) : '';
      var fu = kfu >= 0 ? vleraNeTekst(r[kfu]).replace(/\s+/g, ' ').slice(0, 80) : '';
      // Rreshti "Gjithsej" (totali në fund të eksporteve të Stoku-t / Excel-it) s'është produkt.
      if (/^(gjithsej|totali?|shuma|sum)$/i.test(b) && !emri) return;
      var rr = { nr: i + 1 + (ka ? 1 : 0), b: b, emri: emri, s: s, sRaw: ks >= 0 ? r[ks] : '', fEmri: fEmri, fu: fu, gabim: '', fid: null, veprimi: '' };
      if (!b) rr.gabim = 'pa barkod';
      else if (barkodIVlefshem(b)) rr.gabim = 'barkod i pavlefshëm';
      else if (s === null && ks >= 0) s = rr.s = 0;
      if (!rr.gabim && isNaN(s)) rr.gabim = 'sasi e pavlefshme';
      if (!rr.gabim) {
        if (caku === '__kolona') {
          var emerF = fEmri || 'Importuar', lc = emerF.toLowerCase();
          // "Snacks", "SNACKS" dhe "snacks" janë një folder i ri (me shkrimin e parë), si te pamja paraprake
          if (!emratFolder[lc] && !plan.folderaTeRinj[lc]) plan.folderaTeRinj[lc] = emerF;
          rr.fid = emratFolder[lc] || ('__ri:' + plan.folderaTeRinj[lc]);
        } else if (caku === '__ri') {
          rr.fid = '__ri:' + (im.emriSkedarit.replace(/\.[^.]+$/, '') || 'Importuar');
          plan.folderaTeRinj['__ri'] = im.emriSkedarit.replace(/\.[^.]+$/, '') || 'Importuar';
        } else rr.fid = caku;
        var k = rr.fid + '::' + b;
        var ek = rr.fid.indexOf('__ri:') === 0 ? null : produktet[celesi(rr.fid, b)];
        if (neKete[k]) { rr.veprimi = 'bashkohet me rreshtin ' + neKete[k]; }
        else if (ek) {
          if (menyra === 'kalo') { rr.veprimi = 'ekziston, kalohet'; plan.kaluar++; }
          else { rr.veprimi = menyra === 'shto' ? 'ekziston: ' + ek.sasia + ' → ' + Math.max(0, ek.sasia + s) : 'ekziston: ' + ek.sasia + ' → ' + Math.max(0, s); plan.perditesime++; }
        } else { rr.veprimi = 'i ri'; plan.teRinj++; }
        if (!neKete[k]) neKete[k] = rr.nr;
      } else plan.gabime++;
      plan.rreshta.push(rr);
    });
    return plan;
  }

  function rifreskoImportin() {
    if (!im.fletet.length) return;
    $('imKolFolderi').disabled = false;
    var plan = planiImportit();
    var pp = $('imPermbledhje');
    pp.textContent = '';
    [['Të rinj', plan.teRinj], ['Përditësohen', plan.perditesime], ['Kalohen', plan.kaluar], ['Me gabim (kalohen)', plan.gabime]].forEach(function (x) {
      if (!x[1] && x[0] !== 'Të rinj') return;
      var s = el('span'); s.appendChild(document.createTextNode(x[0] + ': ')); s.appendChild(el('b', null, num(x[1]))); pp.appendChild(s);
    });
    var fr = Object.keys(plan.folderaTeRinj).map(function (k) { return plan.folderaTeRinj[k]; });
    if (fr.length) { var s2 = el('span'); s2.appendChild(document.createTextNode('Foldera të rinj: ')); s2.appendChild(el('b', null, fr.join(', '))); pp.appendChild(s2); }

    var t = el('table');
    var h = el('tr');
    ['#', 'Barkodi', 'Emri', 'Sasia', 'Furnizuesi', 'Folderi', 'Çfarë ndodh'].forEach(function (x) { h.appendChild(el('th', null, x)); });
    var thead = el('thead'); thead.appendChild(h); t.appendChild(thead);
    var tb = el('tbody');
    plan.rreshta.slice(0, 60).forEach(function (r) {
      var tr = el('tr', r.gabim ? 'gabuar' : '');
      var fEmri = r.fid ? (r.fid.indexOf('__ri:') === 0 ? r.fid.slice(5) + ' (i ri)' : emriFolderit(r.fid)) : '';
      [r.nr, r.b, r.emri, (r.s === null || isNaN(r.s)) ? vleraNeTekst(r.sRaw) : r.s, r.fu, fEmri, r.gabim || r.veprimi].forEach(function (x) { tr.appendChild(el('td', null, String(x))); });
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    var pv = $('imParapamje');
    pv.textContent = '';
    pv.appendChild(t);
    if (plan.rreshta.length > 60) pv.appendChild(el('div', 'bosh-mesazh', '… dhe ' + (plan.rreshta.length - 61 ? (plan.rreshta.length - 60) + ' rreshta të tjerë.' : '1 rresht tjetër.')));
    var nr = plan.teRinj + plan.perditesime;
    $('imBtn').disabled = nr === 0;
    $('imBtn').textContent = nr ? 'Importo ' + produkteTekst(nr) : 'Importo';
  }

  $('imBtn').addEventListener('click', function () {
    var plan = planiImportit();
    var menyra = $('imMenyra').value;
    var tani = Date.now();
    var para = {};             // produktet që ekzistonin para importit
    Object.keys(produktet).forEach(function (k) { para[k] = true; });
    var shkruar = {};          // produktet e prekura tashmë nga ky import (barkod i përsëritur në skedar → mblidhet)
    var idTeRinj = {};
    var n = 0, perKujtese = [];
    var reg = ndrysho(function (api) {
      plan.rreshta.forEach(function (r) {
        if (r.gabim) return;
        var fid = r.fid;
        if (fid.indexOf('__ri:') === 0) {
          var emerF = fid.slice(5);
          if (!idTeRinj[emerF]) {
            idTeRinj[emerF] = 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
            foldera.push({ id: idTeRinj[emerF], emri: emerF, ndryshuarSe: tani });
          }
          fid = idTeRinj[emerF];
        }
        var k = celesi(fid, r.b);
        var ek = produktet[k];
        var sasia, emri, furn;
        if (shkruar[k]) { sasia = ek.sasia + r.s; emri = ek.emri || r.emri; furn = ek.furnizuesi || r.fu; }
        else if (para[k]) {
          if (menyra === 'kalo') return;
          if (menyra === 'zevendeso') { sasia = r.s; emri = r.emri || ek.emri; furn = r.fu || ek.furnizuesi; }
          else { sasia = ek.sasia + r.s; emri = ek.emri || r.emri; furn = ek.furnizuesi || r.fu; }
        } else { sasia = r.s; emri = r.emri; furn = r.fu; }
        var ri = { barkodi: r.b, emri: emri || '', sasia: Math.max(0, sasia | 0), kategoriaId: fid, prekurSe: tani };
        if (furn) ri.furnizuesi = furn; // v212: furnizuesi (nga kolona, ose ai që kishte produkti); pa të mbetet bosh
        api.vendos(k, ri);
        if (emri || furn) perKujtese.push({ barkodi: r.b, emri: emri || '', furnizuesi: furn || '' });
        shkruar[k] = true;
        n++;
      });
    });
    try { if (KJ()) KJ().mesoShume(perKujtese, 'mbishkruaj'); } catch (e) { /* ok */ } // v209: si importet e tjera (kolegët: presin kontrollin)
    mbyllDialog('dlgImport');
    toast((n === 1 ? 'U importua 1 rresht' : 'U importuan ' + num(n) + ' rreshta') + (Object.keys(idTeRinj).length ? ' (' + (Object.keys(idTeRinj).length === 1 ? '1 folder i ri' : Object.keys(idTeRinj).length + ' foldera të rinj') + ')' : '') + '.', { veprimi: function () { zhbej(reg); }, ms: 12000 });
  });

  // ================= Importi i afateve (Excel / CSV) =================
  // Çdo fletë lexohet; një fletë me emër muaji ("Nëntor", "Nëntor2"…) e jep muajin kur data ka vetëm ditën.
  // Afatet që ekzistojnë (i njëjti barkod/emër + e njëjta datë) kalohen; rreshtat e përsëritur bashkohen.
  var ai = { fletet: [], emriSkedarit: '' };
  function hapImportinEAfateve() {
    if (!leja('afatetImporto')) return;
    ai = { fletet: [], emriSkedarit: '' };
    $('aiHapi1').classList.remove('fsheh'); $('aiHapi2').classList.add('fsheh'); $('aiMbrapa').classList.add('fsheh');
    $('aiBtn').disabled = true; $('aiBtn').textContent = 'Importo'; $('aiGabim1').textContent = ''; $('aiSkedari').value = '';
    hapDialog('dlgAfImport');
  }
  async function lexoFletetESkedarit(f) {
    var buf = await f.arrayBuffer(), bajtet = new Uint8Array(buf);
    if (bajtet[0] === 0x50 && bajtet[1] === 0x4b) {
      return (await window.StokuXlsx.read(buf)).map(function (sh) {
        return { name: sh.name, rows: sh.rows.filter(function (x) { return x.some(function (v) { return String(v).trim() !== ''; }); }) };
      }).filter(function (sh) { return sh.rows.length; });
    }
    if (/\.xls$/i.test(f.name)) throw new Error('xls');
    return [{ name: f.name.replace(/\.[^.]+$/, ''), rows: lexoCsv(dekodoTekstin(bajtet)) }].filter(function (sh) { return sh.rows.length; });
  }
  async function aiLexo(f) {
    $('aiGabim1').textContent = '';
    try { ai.fletet = await lexoFletetESkedarit(f); }
    catch (e) {
      $('aiGabim1').textContent = e && e.message === 'xls' ? 'Formati i vjetër .xls s\'mbështetet. Hape në Excel dhe ruaje si .xlsx ose .csv.'
        : e && e.message === 'pa-dekompresim' ? 'Ky shfletues s\'e lexon dot këtë .xlsx. Përdor Chrome/Edge të përditësuar, ose ruaje si .csv.'
        : 'Skedari s\'u lexua. Sigurohu që është .xlsx ose .csv.';
      return;
    }
    if (!ai.fletet.length) { $('aiGabim1').textContent = 'Skedari është bosh.'; return; }
    ai.emriSkedarit = f.name;
    var sel = $('aiFleta');
    sel.textContent = '';
    if (ai.fletet.length > 1) {
      var tot = ai.fletet.reduce(function (m, sh) { return m + sh.rows.length; }, 0);
      var oK = el('option', null, 'Të gjitha fletët (' + ai.fletet.length + ' fletë, ' + nrEmer(tot, 'rresht', 'rreshta') + ')'); oK.value = 'krejt'; sel.appendChild(oK);
    }
    ai.fletet.forEach(function (sh, i) {
      var m = AF.muajiNgaEmri(sh.name);
      var o = el('option', null, sh.name + (m ? ' → ' + AF.EMRAT_MUAJVE[m - 1] : '') + ' (' + nrEmer(sh.rows.length, 'rresht', 'rreshta') + ')'); o.value = String(i); sel.appendChild(o);
    });
    sel.value = ai.fletet.length > 1 ? 'krejt' : '0';
    $('aiFletaMbajtese').classList.toggle('fsheh', ai.fletet.length < 2);
    $('aiHapi1').classList.add('fsheh'); $('aiHapi2').classList.remove('fsheh'); $('aiMbrapa').classList.remove('fsheh');
    $('aiSkedariInfo').textContent = 'Skedari: ' + f.name;
    // Rreshti i parë ka tituj? Po, nëse s'ka asnjë datë në të
    var r0 = ai.fletet[0].rows[0] || [];
    $('aiKoka').value = r0.some(function (v) { return !!AF.dataNgaQeliza(v); }) ? '0' : '1';
    aiPergatit(true);
  }
  function aiFletet() { var v = $('aiFleta').value; return v === 'krejt' || v === '' ? ai.fletet : [ai.fletet[+v]]; }
  var AI_FUSHAT = [['barkodi', 'aiKolBarkodi'], ['emri', 'aiKolEmri'], ['data', 'aiKolData'], ['sasia', 'aiKolSasia'], ['furnizuesi', 'aiKolFurnizuesi']];
  function aiPergatit(hamendeso) {
    var sh = aiFletet()[0], ka = $('aiKoka').value === '1';
    var nKol = sh.rows.reduce(function (m, r) { return Math.max(m, r.length); }, 0);
    var titujt = [];
    for (var i = 0; i < nKol; i++) titujt.push(ka ? (AF.tekstNgaQeliza(sh.rows[0][i]) || 'Kolona ' + (i + 1)) : 'Kolona ' + (i + 1));
    var h = hamendeso ? AF.hamendesoKolonatEAfateve(sh.rows, ka) : null;
    AI_FUSHAT.forEach(function (x) {
      var s = $(x[1]), v = s.value;
      s.textContent = '';
      var o0 = el('option', null, '(asnjë)'); o0.value = '-1'; s.appendChild(o0);
      titujt.forEach(function (t, j) { var o = el('option', null, t); o.value = String(j); s.appendChild(o); });
      s.value = h ? String(h[x[0]]) : (v || '-1');
    });
    aiRifresko();
  }
  function aiPlani() {
    var kol = {};
    AI_FUSHAT.forEach(function (x) { kol[x[0]] = parseInt($(x[1]).value, 10); });
    return AF.planiImportitAfateve(aiFletet(), { meKoke: $('aiKoka').value === '1', kol: kol, ekzistuese: afatet });
  }
  function aiRifresko() {
    if (!ai.fletet.length) return;
    var plan = aiPlani();
    var pp = $('aiPermbledhje');
    pp.textContent = '';
    [['Afate të reja', plan.teRinj], ['Ekzistojnë (kalohen)', plan.ekzistojne], ['Bashkohen (i njëjti produkt dhe datë)', plan.bashkuar], ['Me gabim (kalohen)', plan.gabime]].forEach(function (x) {
      if (!x[1] && x[0] !== 'Afate të reja') return;
      var sp = el('span'); sp.appendChild(document.createTextNode(x[0] + ': ')); sp.appendChild(el('b', null, num(x[1]))); pp.appendChild(sp);
    });
    var muajt = AF.muajtELista(plan.rreshta.filter(function (r) { return r.veprimi === 'i ri'; }));
    if (muajt.length) { var sm = el('span'); sm.appendChild(document.createTextNode('Muajt: ')); sm.appendChild(el('b', null, muajt.map(function (m) { return m.emri + ' (' + m.n + ')'; }).join(', '))); pp.appendChild(sm); }
    var t = el('table'), h = el('tr');
    var meFleta = aiFletet().length > 1;
    (meFleta ? ['Fleta'] : []).concat(['#', 'Barkodi', 'Emri', 'Skadon më', 'Sasia', 'Furnizuesi', 'Çfarë ndodh']).forEach(function (x) { h.appendChild(el('th', null, x)); });
    var th = el('thead'); th.appendChild(h); t.appendChild(th);
    var tb = el('tbody');
    plan.rreshta.slice(0, 80).forEach(function (r) {
      var tr = el('tr', r.gabim ? 'gabuar' : '');
      (meFleta ? [r.fleta] : []).concat([r.nr, r.barkodi, r.emri, r.data ? AF.formato(r.data) : r.dataOrigjinale, r.sasia, r.furnizuesi, r.gabim || r.veprimi])
        .forEach(function (x) { tr.appendChild(el('td', null, String(x === undefined || x === null ? '' : x))); });
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    var pv = $('aiParapamje'); pv.textContent = ''; pv.appendChild(t);
    if (plan.rreshta.length > 80) pv.appendChild(el('div', 'bosh-mesazh', '… dhe ' + (plan.rreshta.length - 81 ? (plan.rreshta.length - 80) + ' rreshta të tjerë.' : '1 rresht tjetër.')));
    $('aiBtn').disabled = !plan.teRinj;
    $('aiBtn').textContent = plan.teRinj ? 'Importo ' + nrEmer(plan.teRinj, 'afat', 'afate') : 'Importo';
  }
  $('afBtnImport').addEventListener('click', hapImportinEAfateve);
  $('aiZona').addEventListener('click', function () { $('aiSkedari').click(); });
  $('aiZona').addEventListener('dragover', function (ev) { ev.preventDefault(); $('aiZona').classList.add('siper'); });
  $('aiZona').addEventListener('dragleave', function () { $('aiZona').classList.remove('siper'); });
  $('aiZona').addEventListener('drop', function (ev) { ev.preventDefault(); $('aiZona').classList.remove('siper'); var f = ev.dataTransfer.files && ev.dataTransfer.files[0]; if (f) aiLexo(f); });
  $('aiSkedari').addEventListener('change', function () { var f = $('aiSkedari').files[0]; if (f) aiLexo(f); });
  $('aiMbrapa').addEventListener('click', hapImportinEAfateve);
  $('aiFleta').addEventListener('change', function () { aiPergatit(true); });
  $('aiKoka').addEventListener('change', function () { aiPergatit(true); });
  AI_FUSHAT.forEach(function (x) { $(x[1]).addEventListener('change', aiRifresko); });
  $('aiBtn').addEventListener('click', function () {
    var plan = aiPlani();
    var teReja = AF.afatetNgaPlani(plan, { krijuarNga: emriPerdoruesit() });
    if (!teReja.length) return;
    var mkId = marketiPerTeReja(); // v241
    if (mkId === undefined) return;
    if (mkId) teReja.forEach(function (a) { a.m = mkId; });
    var reg = ndryshoAfatet(function (api) { teReja.forEach(function (a) { api.vendos(a); }); });
    try { if (KJ()) KJ().mesoShume(teReja, 'mbishkruaj'); } catch (e) { /* ok */ }
    mbyllDialog('dlgAfImport');
    af.muaji = ''; af.filtri = 'aktive';
    if (pamja !== 'afatet') shkoTe('afatet'); else renderAfatetPc();
    var n = AF.numero(teReja);
    toast((teReja.length === 1 ? 'U importua 1 afat' : 'U importuan ' + num(teReja.length) + ' afate') + (n.skaduar ? ' · ' + (n.skaduar === 1 ? '1 ka skaduar!' : n.skaduar + ' kanë skaduar!') : '') + (n.afer ? ' · ' + (n.afer === 1 ? '1 skadon' : n.afer + ' skadojnë') + ' brenda 30 ditëve' : '') + '.',
      { veprimi: function () { zhbejAfatet(reg); }, ms: 12000 });
  });

  // ================= Llogaria =================
  function tekstiGabimit(kodi) {
    if (kodi === 'auth/email-already-in-use') return 'Ky emër përdoruesi është zënë tashmë. Provo një tjetër.';
    if (kodi === 'auth/invalid-credential' || kodi === 'auth/wrong-password' || kodi === 'auth/user-not-found' || kodi === 'auth/invalid-email') return 'Emri i përdoruesit ose fjalëkalimi është gabim.';
    if (kodi === 'auth/weak-password') return 'Fjalëkalimi duhet të ketë të paktën 6 shkronja/numra.';
    if (kodi === 'auth/too-many-requests') return 'Shumë përpjekje. Prit pak dhe provo përsëri.';
    if (kodi === 'auth/requires-recent-login') return 'Për siguri, konfirmo fjalëkalimin aktual.';
    if (kodi === 'auth/operation-not-allowed') return 'Ndryshimi i emrit s\'lejohet nga cilësimet e Firebase (Email enumeration protection).';
    if (kodi === 'auth/network-request-failed') return 'S\'ka lidhje me internetin.';
    return 'Diçka shkoi keq. Kontrollo internetin dhe provo përsëri.';
  }
  var dukeHyre = false;
  async function hyrOseKrijo(krijo, idU, idP, idG) {
    if (ngaVizitori()) { hapHyrjenNgaProva(); return; } // prova: hyrja vetëm te porta
    if (dukeHyre) return;
    if (!window.__stokuCloud) { $(idG).textContent = 'Cloud-i s\'është gati. Kontrollo internetin dhe rifresko faqen.'; return; }
    var u = $(idU).value.trim(), p = $(idP).value;
    if (!u || !p) { $(idG).textContent = 'Plotëso emrin e përdoruesit dhe fjalëkalimin.'; return; }
    if (!/^[a-zA-Z0-9_.-]{3,}$/.test(u)) { $(idG).textContent = 'Emri i përdoruesit duhet të ketë të paktën 3 shkronja/numra (a–z, 0–9, _ . -).'; return; }
    if (p.length < 6) { $(idG).textContent = 'Fjalëkalimi duhet të ketë të paktën 6 shkronja/numra.'; return; }
    $(idG).textContent = '';
    dukeHyre = true;
    var rez = krijo ? await window.__stokuCloud.regjistrohu(u, p) : await window.__stokuCloud.hyr(u, p);
    dukeHyre = false;
    if (!rez.ok) { $(idG).textContent = tekstiGabimit(rez.kodi); return; }
    $(idP).value = '';
    mbyllDialog('dlgLlogaria');
    toast(krijo ? 'Llogaria u krijua.' : 'Hyrje e suksesshme. Po sinkronizohen të dhënat…');
    kurNdryshonLlogaria();
  }
  function hapHyrjenNgaProva() { mbyllDialog('dlgLlogaria'); if (window.StokuPorta && window.StokuPorta.hapHyrjen) window.StokuPorta.hapHyrjen(); }
  async function rinisProven() {
    var po = await konfirmo('Të fillojë prova nga e para?', 'Ndryshimet e tua në provë fshihen dhe kthehen të dhënat shembull.', 'Fillo nga e para');
    if (po && window.StokuPorta && window.StokuPorta.rinisProven) window.StokuPorta.rinisProven();
  }
  function hapLlogarine() {
    if (!perdoruesi() && ngaVizitori()) { hapHyrjenNgaProva(); return; } // vizitori: porta (hyrje ose llogari e re)
    rifreskoLlogarine();
    hapDialog('dlgLlogaria', perdoruesi() ? null : 'llUser');
  }
  function rifreskoLlogarine() {
    var u = perdoruesi();
    var emri = emriPerdoruesit();
    var hp = u ? null : hyrjaNePritje(); // v248: ende duke u lidhur me llogarinë e fundit
    rifreskoKopjen();
    $('perdoruesiCip').textContent = u ? emri : hp ? hp.emri : 'Hyr';
    var cl = window.__stokuCloud;
    var viz = !u && ngaVizitori();
    if (u) $('sbpBrandNen').textContent = emri;
    else if (hp) $('sbpBrandNen').textContent = hp.emri;
    else if (viz) $('sbpBrandNen').textContent = 'Vizitor · provë';
    else if (cl && cl.authGati) $('sbpBrandNen').textContent = 'Stoku dhe afatet';
    $('opsLlJashteTitull').textContent = viz ? 'Je si vizitor' : 'Nuk ke hyrë';
    $('opsLlJashteHint').textContent = viz ? 'Provë pa llogari: të dhëna shembull, vetëm në këtë kompjuter. Kur hyn me llogari, prova fshihet.' : 'Të dhënat ruhen vetëm në këtë kompjuter.';
    $('opsVizRinis').classList.toggle('fsheh', !viz);
    $('sbpAvatar').textContent = u ? String(emri || '?').charAt(0).toUpperCase() : hp ? String(hp.emri || '?').charAt(0).toUpperCase() : '';
    $('sbpAvatar').classList.toggle('bosh', !u && !hp);
    $('sbpDil').classList.toggle('fsheh', !u);
    $('llTitulli').textContent = u ? 'Llogaria' : 'Hyr në llogari';
    $('llJashte').classList.toggle('fsheh', !!u);
    $('llFundJashte').classList.toggle('fsheh', !!u);
    $('llBrenda').classList.toggle('fsheh', !u);
    $('llFundBrenda').classList.toggle('fsheh', !u);
    $('llHyrePer').textContent = u ? 'Ke hyrë si "' + emri + '". Çdo ndryshim këtu dhe në telefon/PDA sinkronizohet automatikisht në të dyja anët.' : '';
    $('opsLlJashte').classList.toggle('fsheh', !!u);
    $('opsLlBrenda').classList.toggle('fsheh', !u);
    $('opsLlEmri').textContent = u ? emri : '';
    var shkronja = String(emri || '?').charAt(0).toUpperCase();
    $('opsLlAv').textContent = shkronja;
    $('opsNavAv').textContent = u ? shkronja : '?';
    $('opsNavAv').classList.toggle('bosh', !u);
    $('opsNavEmri').textContent = u ? emri : viz ? 'Vizitor' : 'Pa llogari';
    var FT = window.StokuEkipa && window.StokuEkipa.Fotot;
    if (FT) {
      var kush = u ? { uid: u.uid, emri: emri } : null;
      FT.apliko($('sbpAvatar'), kush); FT.apliko($('opsLlAv'), kush); FT.apliko($('opsNavAv'), kush);
      var kaFoto = !!(u && FT.url(u.uid));
      $('opsFotoNdrysho').textContent = kaFoto ? 'Ndrysho foton' : 'Shto foto';
      $('opsFotoHiq').style.display = kaFoto ? '' : 'none';
    }
    vendosStatusin(u ? (sink.statusi === 'lokal' ? 'pune' : sink.statusi) : 'lokal', true);
  }
  $('btnLlogaria').addEventListener('click', hapLlogarine);
  // Fotoja e profilit: ruhet te Worker-i (Cloudflare), e sheh krejt grupi
  var __fotoDukeDerguar = false;
  function tekstiGabimitFotos(a) {
    return a === 'jo-foto' ? 'Ky skedar nuk është foto.' : a === 'madhesia' ? 'Fotoja është shumë e madhe.' :
      a === 'pa-hyrje' ? 'Hyr në llogari për të vendosur foto.' : a === 'mungon-kv' ? 'Fotot ende s\'janë aktivizuar në server.' :
      'Fotoja nuk u ruajt. Kontrollo internetin dhe provo sërish.';
  }
  async function veproMeFoton(veprimi, skedari) {
    var c = window.__stokuCloud, e = c && c.ekipa;
    if (!e || __fotoDukeDerguar) return;
    __fotoDukeDerguar = true;
    $('opsFotoNdrysho').disabled = $('opsFotoHiq').disabled = true;
    $('opsFotoHint').textContent = veprimi === 'hiq' ? 'Po hiqet fotoja…' : 'Po ngarkohet fotoja…';
    var r = veprimi === 'hiq' ? await e.hiqFoton() : await e.ngarkoFoton(skedari);
    __fotoDukeDerguar = false;
    $('opsFotoNdrysho').disabled = $('opsFotoHiq').disabled = false;
    $('opsFotoHint').textContent = r.ok ? 'E sheh krejt grupi.' : tekstiGabimitFotos(r.arsye);
    if (r.ok) toast(veprimi === 'hiq' ? 'Fotoja u hoq.' : 'Fotoja u ruajt. E sheh krejt grupi.');
    rifreskoLlogarine();
  }
  $('opsFotoNdrysho').addEventListener('click', function () { $('opsFotoSkedari').value = ''; $('opsFotoSkedari').click(); });
  $('opsLlAv').addEventListener('click', function () { $('opsFotoNdrysho').click(); });
  $('opsFotoSkedari').addEventListener('change', function () { var f = this.files && this.files[0]; if (f) veproMeFoton('ngarko', f); });
  $('opsFotoHiq').addEventListener('click', async function () {
    if (await konfirmo('Ta heqim foton?', 'Në vend të fotos do të dalë shkronja e emrit tënd.', 'Hiqe')) veproMeFoton('hiq');
  });
  window.addEventListener('stoku-fotot-ndryshuan', rifreskoLlogarine);
  $('llHyr').addEventListener('click', function () { hyrOseKrijo(false, 'llUser', 'llPass', 'llGabim'); });
  $('llKrijo').addEventListener('click', function () { hyrOseKrijo(true, 'llUser', 'llPass', 'llGabim'); });
  $('llPass').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') hyrOseKrijo(false, 'llUser', 'llPass', 'llGabim'); });
  $('llUser').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') $('llPass').focus(); });
  $('mHyr').addEventListener('click', function () { hyrOseKrijo(false, 'mUser', 'mPass', 'mGabim'); });
  $('mKrijo').addEventListener('click', function () { hyrOseKrijo(true, 'mUser', 'mPass', 'mGabim'); });
  $('mPass').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') hyrOseKrijo(false, 'mUser', 'mPass', 'mGabim'); });
  $('mUser').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') $('mPass').focus(); });
  $('llSinkronizo').addEventListener('click', kryeSinkronizimin);
  $('opsSinkronizo').addEventListener('click', kryeSinkronizimin);
  $('llMenaxho').addEventListener('click', function () { mbyllDialog('dlgLlogaria'); hapOpsionet('llogaria'); });
  $('opsHapHyrjen').addEventListener('click', function () { mbyllDialog('dlgOpsione'); hapLlogarine(); });
  $('opsVizRinis').addEventListener('click', rinisProven);
  $('vizHyr').addEventListener('click', hapHyrjenNgaProva);
  $('vizRinis').addEventListener('click', rinisProven);
  async function dil() {
    var po = await konfirmo('Të dilet nga llogaria?', 'Të dhënat mbeten të ruajtura në llogari (cloud). Pas daljes, Stoku kërkon përsëri emrin e përdoruesit dhe fjalëkalimin.', 'Dil');
    if (!po) return;
    for (var i = 0; i < 40 && sink.duke; i++) await new Promise(function (r) { setTimeout(r, 250); });
    try { await kryeSinkronizimin(); } catch (e) { /* ndryshimet e fundit mbeten lokalisht */ }
    // S'u ruajt në cloud (pa internet): kur hyn një llogari tjetër këtu, të dhënat lokale hiqen → paralajmëro
    if (sink.statusi === 'gabim' || sink.duke) {
      var gjithsesi = await konfirmo('Ndryshimet e fundit s\'janë ruajtur në cloud',
        'S\'ka lidhje me internetin. Nëse del tani dhe në këtë kompjuter hyn një llogari tjetër, ndryshimet e paruajtura humbin. Më mirë prit internetin. Të dilet gjithsesi?', 'Dil gjithsesi');
      if (!gjithsesi) return;
    }
    ndalDegjuesin();
    if (window.__stokuCloud && window.__stokuCloud.dil) await window.__stokuCloud.dil();
    mbyllDialog('dlgLlogaria');
    kurNdryshonLlogaria();
  }
  $('llDil').addEventListener('click', dil);
  $('opsDil').addEventListener('click', dil);
  $('sbpDil').addEventListener('click', dil); // v204: butoni i daljes te karta e llogarisë në anësore
  $('opsRikthe').addEventListener('click', async function () {
    if (!perdoruesi()) return;
    var rez = await window.__stokuCloud.merr();
    if (!rez.ok) { toast('Të dhënat e cloud-it s\'u lexuan. Kontrollo internetin dhe provo përsëri.'); return; } // s'do të thotë që cloud-i është bosh
    if (!rez.gjendja) { toast('S\'ka asnjë të dhënë në cloud për këtë llogari.'); return; }
    var n = (rez.gjendja.produktet || []).length;
    var po = await konfirmo('Të rikthehen të dhënat nga cloud?', 'Të dhënat e këtij kompjuteri (' + produkteTekst(Object.keys(produktet).length) + ') zëvendësohen me ato të cloud-it (' + produkteTekst(n) + ').', 'Rikthe');
    if (!po) return;
    var B = window.StokuBashkimi; // një rresht i dëmtuar në cloud s'e rrëzon faqen (si te telefoni)
    foldera = B.pastroFolderat(rez.gjendja.foldera);
    var pm = {};
    B.pastroProduktet(rez.gjendja.produktet).forEach(function (p) { pm[celesi(p.kategoriaId, p.barkodi)] = p; });
    produktet = pm;
    afatet = B.pastroAfatet(rez.gjendja.afatet);
    marketet = MK.pastro(rez.gjendja.marketet);
    fshira = { produktet: {}, foldera: {}, afatet: {}, marketet: {} };
    rendiFolderaveKoha = Number(rez.gjendja.rendiKoha) || 0;
    shkruajLokalisht();
    rivizato();
    toast('U rikthye nga cloud.');
  });

  // v232: rikthimi i të fshirave nga një pajisje tjetër (me kohë të re: fitojnë ndaj fshirjes edhe në cloud)
  $('opsKopjaRikthe').addEventListener('click', async function () {
    var k = lexoKopjen();
    if (!k) { rifreskoKopjen(); return; }
    var m = teMungueshmetNgaKopja(k);
    if (!m.foldera.length && !m.produktet.length) { rifreskoKopjen(); return; }
    if (!(await konfirmo('Të rikthehen të fshirat?', (vetemNje(m) ? 'Kthehet ' : 'Kthehen ') + pershkrimiIKopjes(m) + ' në krejt pajisjet e llogarisë.', 'Rikthe'))) return;
    var tani = Date.now();
    ndrysho(function (api) {
      m.foldera.forEach(function (f) { foldera.push(Object.assign({}, f, { ndryshuarSe: tani })); delete fshira.foldera[f.id]; });
      m.produktet.forEach(function (p) { api.vendos(celesi(p.kategoriaId, p.barkodi), Object.assign({}, p, { prekurSe: tani })); });
    });
    try { localStorage.removeItem(KEY_KOPJA); } catch (e) { /* ok */ }
    rifreskoKopjen();
    rivizato();
    toast((vetemNje(m) ? 'U rikthye: ' : 'U rikthyen: ') + pershkrimiIKopjes(m) + '.');
  });
  $('opsKopjaHiq').addEventListener('click', async function () {
    if (!(await konfirmo('Të hiqet kopja?', 'Të fshirat s\'mund të rikthehen më nga ky kompjuter.', 'Hiqe'))) return;
    try { localStorage.removeItem(KEY_KOPJA); } catch (e) { /* ok */ }
    rifreskoKopjen();
  });

  var riaut = null;
  async function ndryshimLlogarie(fn) {
    $('opsLlGabim').textContent = '';
    var rez = await fn();
    if (!rez.ok && rez.kodi === 'auth/requires-recent-login') {
      riaut = fn;
      $('opsRiaut').classList.remove('fsheh');
      $('opsFjalekalimiAktual').focus();
      return false;
    }
    if (!rez.ok) { $('opsLlGabim').textContent = tekstiGabimit(rez.kodi); return false; }
    return true;
  }
  $('opsNdryshoEmrin').addEventListener('click', async function () {
    var v = $('opsEmriRi').value.trim();
    if (!/^[a-zA-Z0-9_.-]{3,}$/.test(v)) { $('opsLlGabim').textContent = 'Emri duhet të ketë të paktën 3 shkronja/numra (a–z, 0–9, _ . -).'; return; }
    if (await ndryshimLlogarie(function () { return window.__stokuCloud.ndryshoEmrin(v); })) {
      $('opsEmriRi').value = ''; rifreskoLlogarine(); toast('Emri i përdoruesit u ndryshua.');
    }
  });
  $('opsNdryshoFjalekalimin').addEventListener('click', async function () {
    var v = $('opsFjalekalimiRi').value;
    if (v.length < 6) { $('opsLlGabim').textContent = 'Fjalëkalimi duhet të ketë të paktën 6 shkronja/numra.'; return; }
    if (await ndryshimLlogarie(function () { return window.__stokuCloud.ndryshoFjalekalimin(v); })) {
      $('opsFjalekalimiRi').value = ''; toast('Fjalëkalimi u ndryshua.');
    }
  });
  $('opsKonfirmoRiaut').addEventListener('click', async function () {
    if (!riaut) return;
    var a = await window.__stokuCloud.riautentifikohu($('opsFjalekalimiAktual').value);
    if (!a.ok) { $('opsLlGabim').textContent = 'Fjalëkalimi aktual s\'është i saktë.'; return; }
    var fn = riaut; riaut = null;
    $('opsFjalekalimiAktual').value = '';
    $('opsRiaut').classList.add('fsheh');
    if (await ndryshimLlogarie(fn)) { $('opsEmriRi').value = ''; $('opsFjalekalimiRi').value = ''; rifreskoLlogarine(); toast('U ndryshua.'); }
  });

  // ================= Opsionet =================
  function hapOpsionet(faqja) {
    zgjidhSkeden(faqja || 'pamja');
    rifreskoNenStokut();
    rifreskoOpsionet();
    rifreskoLlogarine();
    hapDialog('dlgOpsione');
  }
  // ---------- Furnizuesit (Cilësimet → Stoku): i sheh kushdo, emrat i ndryshon vetëm administratori ----------
  var ADMIN_I_STOKUT = 'mendurberisha';
  var furnNeEditim = null;
  function eshteAdminiIStokut() { return !!perdoruesi() && emriPerdoruesit() === ADMIN_I_STOKUT; }
  function sasiaETekst(n, nje, shume) { return num(n) + ' ' + (n === 1 ? nje : shume); }
  function nenTekstiFurnizuesit(f) {
    return [f.afate ? sasiaETekst(f.afate, 'afat', 'afate') : '', f.produkte ? sasiaETekst(f.produkte, 'produkt', 'produkte') : '',
      f.nePritje && f.nga && f.nga.length ? 'nga ' + f.nga.join(', ') : ''].filter(Boolean).join(' · ') || 'Pa produkte';
  }
  // vetemKerkimi: shkronjë e re te kërkimi; ruajtja e furnizuesve (kalim mbi krejt afatet e produktet) s'bëhet për çdo shkronjë
  function rifreskoFurnizuesit(vetemKerkimi) {
    var admin = eshteAdminiIStokut();
    if (!admin) furnNeEditim = null;
    $('opsFurnHint').textContent = admin ? 'Furnizuesit e regjistrit të Stoku-t (krejt llogaritë). Ndrysho emrin e një furnizuesi: ndryshon te krejt afatet dhe produktet. Nëse i jep emrin e një furnizuesi tjetër, të dy bashkohen në një.'
      : 'Furnizuesit e regjistrit të Stoku-t (të njëjtët për krejt llogaritë) dhe të afateve të tua. Emrat i ndryshon vetëm administratori.';
    $('opsFurnPritjeHint').textContent = admin ? 'Furnizuesit e rinj, të kolegëve dhe ata që i shton ti. Ruaje ashtu siç është ose ndrysho emrin (ndryshon te krejt produktet e tij), pastaj kalon te Furnizuesit. Fshirja e produkteve s\'e fshin furnizuesin.'
      : 'Furnizuesit e rinj. I kontrollon administratori, pastaj kalojnë te Furnizuesit.';
    // v205: edhe furnizuesit e produkteve të grupit (kujtesa); ata që dalin vetëm te produktet e reja të kolegëve presin këtu
    if (admin && !vetemKerkimi) ruajFurnizuesitEMiratuar();
    var kj = KJ(), teGjithe = AF.listaEFurnizuesve(afatet, produktet, kj ? kj.lista() : [], kj ? kj.furnizuesit() : []);
    // v212: të ruajturit nga administratori në krye, më i riu i pari
    var pritje = AF.renditSipasRuajtjes(teGjithe.filter(function (f) { return f.nePritje; }));
    var lista = AF.renditSipasRuajtjes(teGjithe.filter(function (f) { return !f.nePritje; }));
    $('opsFurnPritjeSeksion').hidden = !pritje.length;
    $('opsFurnPritjeNumri').textContent = pritje.length ? num(pritje.length) : '';
    var cp = $('opsFurnPritjeLista'); cp.textContent = '';
    pritje.forEach(function (f) { cp.appendChild(f.emri === furnNeEditim ? rreshtIEditimitTeFurnizuesit(f, teGjithe) : rreshtIFurnizuesit(f, admin)); });
    $('opsFurnNumri').textContent = lista.length ? num(lista.length) : '';
    var k = normalizo(($('opsFurnKerko').value || '').trim());
    var cont = $('opsFurnLista');
    cont.textContent = '';
    var fil = lista.filter(function (f) { return !k || normalizo(f.emri).indexOf(k) !== -1; });
    if (!fil.length) { cont.appendChild(el('div', 'ops-furn-bosh', lista.length ? 'Asnjë furnizues me këtë emër.' : 'Ende s\'ka furnizues. Shfaqen këtu kur shton afate me furnizues.')); return; }
    fil.forEach(function (f) { cont.appendChild(f.emri === furnNeEditim ? rreshtIEditimitTeFurnizuesit(f, teGjithe) : rreshtIFurnizuesit(f, admin)); });
  }
  function rreshtIFurnizuesit(f, admin) {
    var rr = el('div', 'ops-furn-rresht');
    rr.appendChild(el('span', 'ops-furn-shkronja', (f.emri.charAt(0) || '?').toUpperCase()));
    var t = el('div', 'ops-furn-tekst');
    t.appendChild(el('div', 'ops-furn-emri', f.emri));
    t.appendChild(el('div', 'ops-furn-nen', nenTekstiFurnizuesit(f)));
    rr.appendChild(t);
    if (!admin) return rr; // vetëm për t'u parë
    var b = el('button', 'btn dyte vogel', 'Ndrysho emrin'); b.type = 'button';
    b.addEventListener('click', function () {
      furnNeEditim = f.emri; rifreskoFurnizuesit();
      var inp = document.querySelector('#opsFurnPritjeLista .ops-furn-edit input, #opsFurnLista .ops-furn-edit input'); if (inp) { inp.focus(); inp.select(); }
    });
    if (!f.nePritje) { rr.appendChild(b); return rr; }
    // furnizues i ri: "Ruaj" me një klik (emri është në rregull) e kalon te Furnizuesit
    var ok = el('button', 'btn vogel', 'Ruaj'); ok.type = 'button'; ok.title = 'Emri është në rregull: kaloje te Furnizuesit';
    ok.addEventListener('click', function () {
      if (!eshteAdminiIStokut() || !KJ()) return;
      KJ().regjistroFurnizuesit([f.emri], true);
      rifreskoFurnizuesit(); toast('"' + f.emri + '" kaloi te Furnizuesit.');
    });
    var v = el('div', 'ops-furn-veprime'); v.appendChild(b); v.appendChild(ok);
    rr.appendChild(v);
    return rr;
  }
  // v207: administratori: furnizuesit ruhen më vete, që të mos fshihen kur fshihen produktet e tyre. v238: emrat pa asnjë
  // hyrje ruhen NË PRITJE (më parë si të kontrolluar: kalonin te Furnizuesit pa kontroll); të fshirët s'preken.
  function ruajFurnizuesitEMiratuar() {
    try {
      var k = KJ(); if (!k || !k.regjistroFurnizuesit || !eshteAdminiIStokut()) return;
      // v209: vetëm nga afatet/stoku i administratorit dhe produktet e kontrolluara prej tij; jo nga ato që Stoku i mësoi
      // vetë nga afatet e kolegëve (furnizuesit e tyre të rinj presin kontrollin)
      var l = AF.listaEFurnizuesve(afatet, produktet, k.lista().filter(function (x) { return x.ngaAdmini; }), []);
      if (k.regjistroFurnizuesitNePritje) k.regjistroFurnizuesitNePritje(l.map(function (f) { return f.emri; }));
      publikoFurnizuesitMeVonese();
    } catch (e) { /* ok */ }
  }
  // v211: administratori: lista e furnizuesve të ruajtur shkon te sugjerimet e krejt përdoruesve (vetëm kur ndryshon)
  var __publikoFurnKohez = null;
  function publikoFurnizuesitMeVonese() {
    clearTimeout(__publikoFurnKohez);
    __publikoFurnKohez = setTimeout(function () {
      try {
        var k = KJ();
        if (!k || !eshteAdminiIStokut() || typeof ekK === 'undefined' || !ekK || !ekK.publikoFurnizuesit) return;
        ekK.publikoFurnizuesit(k.furnizuesit().filter(function (f) { return !f.fshire && !f.nePritje; }).map(function (f) { return f.emri; }));
      } catch (e) { /* ok */ }
    }, 3000);
  }
  async function fshijFurnizuesin(f) {
    if (!eshteAdminiIStokut() || !KJ()) return;
    var po = await konfirmo('Ta fshijmë furnizuesin?', '"' + f.emri + '" hiqet nga lista e furnizuesve. Produktet e tij mbeten te Produktet, pa furnizues. Afatet e tua s\'ndryshojnë.', 'Fshije');
    if (!po) return;
    var n = KJ().fshijFurnizuesin(f.emri);
    furnNeEditim = null; rifreskoFurnizuesit();
    if (n > 0 && kujNeEditim === null) rifreskoKujtesen(); // produktet tregojnë furnizuesin
    toast('"' + f.emri + '" u fshi' + (n > 0 ? '. ' + sasiaETekst(n, 'produkt mbeti', 'produkte mbetën') + ' pa furnizues.' : '.'));
  }
  function rreshtIEditimitTeFurnizuesit(f, lista) {
    var w = el('div', 'ops-furn-rresht ops-furn-edit');
    w.appendChild(el('span', 'ops-furn-shkronja', (f.emri.charAt(0) || '?').toUpperCase()));
    var t = el('div', 'ops-furn-tekst');
    var inp = el('input', 'inp'); inp.type = 'text'; inp.value = f.emri; inp.maxLength = 80;
    inp.setAttribute('autocomplete', 'off'); inp.setAttribute('spellcheck', 'false'); inp.setAttribute('aria-label', 'Emri i ri për ' + f.emri);
    var gab = el('div', 'ops-furn-gabim');
    t.appendChild(inp); t.appendChild(el('div', 'ops-furn-nen', 'Tani: "' + f.emri + '" · ' + nenTekstiFurnizuesit(f))); t.appendChild(gab);
    w.appendChild(t);
    var fshi = el('button', 'btn tekst rrezik vogel', 'Fshije'); fshi.type = 'button'; fshi.title = 'Hiqe nga lista e furnizuesve (produktet e tij mbeten)';
    var anulo = el('button', 'btn tekst vogel', 'Anulo'); anulo.type = 'button';
    var ruajB = el('button', 'btn vogel', 'Ruaj'); ruajB.type = 'button';
    fshi.addEventListener('click', function () { fshijFurnizuesin(f); });
    anulo.addEventListener('click', function () { furnNeEditim = null; rifreskoFurnizuesit(); });
    ruajB.addEventListener('click', function () { ruajEmrinEFurnizuesit(f, lista, inp.value, gab); });
    inp.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); ruajB.click(); }
      else if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); anulo.click(); }
    });
    var v = el('div', 'ops-furn-veprime'); v.appendChild(fshi); v.appendChild(anulo); v.appendChild(ruajB);
    w.appendChild(v);
    return w;
  }
  async function ruajEmrinEFurnizuesit(f, lista, vlera, gab) {
    if (!eshteAdminiIStokut()) { furnNeEditim = null; rifreskoFurnizuesit(); return; }
    var emriRi = String(vlera || '').replace(/\s+/g, ' ').trim();
    if (!emriRi) { gab.textContent = 'Shkruaj emrin e furnizuesit.'; return; }
    if (emriRi === f.emri) { // pa ndryshim emri: furnizuesi i ri (në pritje) ruhet si i kontrolluar
      if (f.nePritje && KJ()) { KJ().regjistroFurnizuesit([f.emri], true); toast('"' + f.emri + '" kaloi te Furnizuesit.'); }
      furnNeEditim = null; rifreskoFurnizuesit(); return;
    }
    var ekz = AF.furnizuesiEkzistues(lista, emriRi, f.emri);
    if (ekz) {
      var tjetri = lista.filter(function (x) { return x.emri === ekz; })[0];
      var po = await konfirmo('Të bashkohen furnizuesit?',
        '"' + f.emri + '" (' + nenTekstiFurnizuesit(f) + ') dhe "' + ekz + '" (' + nenTekstiFurnizuesit(tjetri) + ') do të bashkohen në një furnizues: "' + emriRi + '".',
        'Bashkoji');
      if (!po) return;
    }
    var rez = AF.riemertoFurnizuesin(afatet, produktet, f.emri, emriRi);
    if (ekz && ekz !== emriRi) { // bashkimi: edhe tjetri merr saktësisht emrin e shkruar
      var rez2 = AF.riemertoFurnizuesin(rez.afatet, rez.produktet, ekz, emriRi);
      rez = { afatet: rez2.afatet, produktet: rez2.produktet, nAfate: rez.nAfate + rez2.nAfate, nProdukte: rez.nProdukte + rez2.nProdukte };
    }
    afatet = rez.afatet;
    produktet = rez.produktet;
    var nKuj = 0;
    try { if (KJ()) { nKuj = KJ().riemertoFurnizuesin(f.emri, emriRi); if (ekz && ekz !== emriRi) nKuj += KJ().riemertoFurnizuesin(ekz, emriRi); } } catch (e) { /* ok */ }
    ruaj();
    furnNeEditim = null;
    rifreskoFurnizuesit();
    if (nKuj && kujNeEditim === null) rifreskoKujtesen(); // produktet tregojnë furnizuesin: s'mbeten me emrin e vjetër
    var nP = Math.max(rez.nProdukte, nKuj), det = [rez.nAfate ? sasiaETekst(rez.nAfate, 'afat', 'afate') : '', nP ? sasiaETekst(nP, 'produkt', 'produkte') : ''].filter(Boolean).join(', ');
    toast('"' + f.emri + '" u bë "' + emriRi + '"' + (det ? ' (' + det + ')' : '') + '.');
  }
  $('opsFurnKerko').addEventListener('input', function () { furnNeEditim = null; rifreskoFurnizuesit(true); });

  // ---------- Produktet (Cilësimet → Stoku): kujtesa e produkteve në këtë pajisje (barkodi → emri, furnizuesi) ----------
  // v203: shfaqen 150 në fillim; butoni "Shfaq edhe …" në fund i shton 150 të tjera
  var kujNeEditim = null, KUJ_MAKS = 150, kujSaShfaqen = KUJ_MAKS, pritjeSaShfaqen = KUJ_MAKS;
  function rifreskoKujtesen() {
    // lista vizatohet sërish: pozicioni i scroll-it mbetet aty ku ishte
    var ku = ['opsKujLista', 'opsKujPritjeLista'].map(function (id) { return $(id); }).concat([document.querySelector('.ops-djathtas')]);
    var y = ku.map(function (e) { return e ? e.scrollTop : 0; });
    vizatoKujtesen();
    ku.forEach(function (e, i) { if (e) e.scrollTop = y[i]; });
  }
  function butoniMeShume(shfaqur, gjithsej, kurKlikohet) {
    var mbeten = gjithsej - shfaqur, n = Math.min(KUJ_MAKS, mbeten);
    var w = el('div', 'ops-furn-me-shume');
    var b = el('button', 'btn dyte vogel', 'Shfaq edhe ' + sasiaETekst(n, 'produkt', 'produkte') + (n < mbeten ? ' (mbeten ' + num(mbeten) + ')' : '')); b.type = 'button';
    b.addEventListener('click', kurKlikohet);
    w.appendChild(b);
    return w;
  }
  function vizatoKujtesen() {
    var cont = $('opsKujLista'); if (!cont) return;
    var admin = eshteAdminiIStokut();
    if (!admin) kujNeEditim = null;
    $('opsKujHint').textContent = admin ? 'Emri dhe furnizuesi që Stoku i mban mend për çdo barkod; krejt llogaritë e Stoku-t i shohin kur skanojnë. Produktet e reja (të kujtdo, edhe ato që i shton ti) dalin këtu pasi t\'i kontrollosh te Produktet e reja. Atë që e ndryshon ti s\'e ndryshon askush tjetër.'
      : 'Regjistri i Stoku-t: emri dhe furnizuesi për çdo barkod, i njëjtë për krejt llogaritë; plotësohen vetë kur skanon. Produktet e reja i kontrollon dhe i ndryshon vetëm administratori.';
    var k = KJ(), teGjitha = k ? k.lista() : [];
    // v201: produktet e shkruara nga kolegët presin te "Produktet e reja" derisa t'i kontrollojë dhe ruajë administratori
    var lista = AF.renditSipasRuajtjes(teGjitha.filter(function (x) { return !x.nePritje; })); // v212: të ruajturat e fundit në krye
    rifreskoPritjen(teGjitha.filter(function (x) { return x.nePritje; }), admin);
    rifreskoNenStokut();
    $('opsKujNumri').textContent = lista.length ? num(lista.length) : '';
    var q = normalizo(($('opsKujKerko').value || '').trim());
    var fil = q ? lista.filter(function (x) { return normalizo(x.emri + ' ' + x.barkodi + ' ' + x.furnizuesi).indexOf(q) !== -1; }) : lista;
    cont.textContent = '';
    if (!fil.length) { cont.appendChild(el('div', 'ops-furn-bosh', lista.length ? 'Asnjë produkt me këtë kërkim.' : 'Ende s\'ka produkte. Shfaqen këtu kur ruan një afat ose produkt me barkod.')); return; }
    fil.slice(0, kujSaShfaqen).forEach(function (x) {
      if (x.barkodi === kujNeEditim) { cont.appendChild(rreshtIEditimitTeKujteses(x)); return; }
      var rr = el('div', 'ops-furn-rresht');
      rr.appendChild(el('span', 'ops-furn-shkronja ops-kuj-shkronja', ((x.emri || x.barkodi).charAt(0) || '?').toUpperCase()));
      var t = el('div', 'ops-furn-tekst');
      t.appendChild(el('div', 'ops-furn-emri', x.emri || 'Pa emër'));
      t.appendChild(el('div', 'ops-furn-nen', [x.barkodi, x.furnizuesi, !x.ngaAdmini && x.nga ? 'nga ' + x.nga : ''].filter(Boolean).join(' · ')));
      rr.appendChild(t);
      cont.appendChild(rr);
      if (!admin) return; // vetëm për t'u parë
      var b = el('button', 'btn dyte vogel', 'Ndrysho'); b.type = 'button';
      b.addEventListener('click', function () {
        kujNeEditim = x.barkodi; rifreskoKujtesen();
        var inp = document.querySelector('#opsKujLista .ops-furn-edit input'); if (inp) { inp.focus(); inp.select(); }
      });
      rr.appendChild(b);
    });
    if (fil.length > kujSaShfaqen) cont.appendChild(butoniMeShume(kujSaShfaqen, fil.length, function () { kujSaShfaqen += KUJ_MAKS; rifreskoKujtesen(); }));
  }
  function rifreskoPritjen(pritje, admin) {
    $('opsKujPritjeSeksion').hidden = !pritje.length;
    $('opsKujPritjeNumri').textContent = pritje.length ? num(pritje.length) : '';
    $('opsKujPritjeHint').textContent = admin ? 'Produktet e reja, të kolegëve dhe ato që i shton ti. Kontrolloji emrat dhe ruaji: pastaj kalojnë te Produktet.'
      : 'Produktet e reja. I kontrollon administratori, pastaj kalojnë te Produktet.';
    var cont = $('opsKujPritjeLista'); cont.textContent = '';
    pritje.sort(function (a, b) { return b.koha - a.koha; }); // më të rejat lart
    pritje.slice(0, pritjeSaShfaqen).forEach(function (x) {
      if (x.barkodi === kujNeEditim) { cont.appendChild(rreshtIEditimitTeKujteses(x)); return; }
      var rr = el('div', 'ops-furn-rresht');
      rr.appendChild(el('span', 'ops-furn-shkronja', ((x.emri || x.barkodi).charAt(0) || '?').toUpperCase()));
      var t = el('div', 'ops-furn-tekst');
      t.appendChild(el('div', 'ops-furn-emri', x.emri || 'Pa emër'));
      t.appendChild(el('div', 'ops-furn-nen', [x.barkodi, x.furnizuesi, x.nga ? 'nga ' + x.nga : ''].filter(Boolean).join(' · ')));
      rr.appendChild(t);
      cont.appendChild(rr);
      if (!admin) return; // vetëm për t'u parë
      var b = el('button', 'btn dyte vogel', 'Ndrysho'); b.type = 'button';
      b.addEventListener('click', function () {
        kujNeEditim = x.barkodi; rifreskoKujtesen();
        var inp = document.querySelector('#opsKujPritjeLista .ops-furn-edit input'); if (inp) { inp.focus(); inp.select(); }
      });
      var ok = el('button', 'btn vogel', 'Ruaj'); ok.type = 'button'; ok.title = 'Emri është në rregull: kaloje te Produktet';
      ok.addEventListener('click', function () {
        if (!eshteAdminiIStokut() || !KJ()) return;
        var tani = KJ().merr(x.barkodi) || x; // gjendja e tanishme (p.sh. furnizuesi mund të jetë riemërtuar ndërkohë)
        KJ().vendos(x.barkodi, tani.emri, tani.furnizuesi);
        rifreskoKujtesen(); toast('"' + (x.emri || x.barkodi) + '" kaloi te Produktet.');
      });
      var v = el('div', 'ops-furn-veprime'); v.appendChild(b); v.appendChild(ok);
      rr.appendChild(v);
    });
    if (pritje.length > pritjeSaShfaqen) cont.appendChild(butoniMeShume(pritjeSaShfaqen, pritje.length, function () { pritjeSaShfaqen += KUJ_MAKS; rifreskoKujtesen(); }));
  }
  // Te menyja e Cilësimeve: administratori sheh sa produkte presin kontrollin
  function rifreskoNenStokut() {
    var n = 0;
    try { n = eshteAdminiIStokut() && KJ() ? KJ().numriNePritje() : 0; } catch (e) { n = 0; }
    $('opsStokuNen').textContent = n ? (n === 1 ? '1 produkt i ri për kontroll' : num(n) + ' produkte të reja për kontroll') : 'Renditja, furnizuesit, produktet';
    $('opsStokuNen').classList.toggle('ops-nen-pritje', !!n);
  }
  function rreshtIEditimitTeKujteses(x) {
    var w = el('div', 'ops-furn-rresht ops-furn-edit');
    w.appendChild(el('span', 'ops-furn-shkronja ops-kuj-shkronja', ((x.emri || x.barkodi).charAt(0) || '?').toUpperCase()));
    var t = el('div', 'ops-furn-tekst ops-kuj-fushat');
    var ie = el('input', 'inp'); ie.type = 'text'; ie.value = x.emri; ie.maxLength = 120; ie.placeholder = 'Emri i produktit';
    ie.setAttribute('autocomplete', 'off'); ie.setAttribute('aria-label', 'Emri i produktit ' + x.barkodi);
    var ifu = el('input', 'inp'); ifu.type = 'text'; ifu.value = x.furnizuesi; ifu.maxLength = 80; ifu.placeholder = 'Furnizuesi';
    ifu.setAttribute('autocomplete', 'off'); ifu.setAttribute('aria-label', 'Furnizuesi i produktit ' + x.barkodi); ifu.setAttribute('list', 'afdFurnizuesit');
    var dl = $('afdFurnizuesit'); dl.textContent = ''; furnizuesitPerSugjerim().forEach(function (f) { var o = el('option'); o.value = f; dl.appendChild(o); });
    t.appendChild(ie); t.appendChild(ifu); t.appendChild(el('div', 'ops-furn-nen', 'Barkodi: ' + x.barkodi + (x.nePritje && x.nga ? ' · e shkroi ' + x.nga : '')));
    w.appendChild(t);
    var harro = el('button', 'btn tekst rrezik vogel', 'Fshije'); harro.type = 'button'; harro.title = 'Fshije nga produktet: herën tjetër s\'plotësohet vetë';
    var anulo = el('button', 'btn tekst vogel', 'Anulo'); anulo.type = 'button';
    var ruajB = el('button', 'btn vogel', 'Ruaj'); ruajB.type = 'button';
    anulo.addEventListener('click', function () { kujNeEditim = null; rifreskoKujtesen(); });
    harro.addEventListener('click', function () { if (!eshteAdminiIStokut()) { anulo.click(); return; } if (KJ()) KJ().fshij(x.barkodi); kujNeEditim = null; rifreskoKujtesen(); toast('"' + (x.emri || x.barkodi) + '" u fshi nga produktet.'); });
    ruajB.addEventListener('click', function () {
      if (!eshteAdminiIStokut()) { anulo.click(); return; }
      if (KJ()) KJ().vendos(x.barkodi, ie.value, ifu.value);
      kujNeEditim = null; rifreskoKujtesen(); toast((x.nePritje ? 'U ruajt dhe kaloi te Produktet: ' : 'U ruajt: ') + (ie.value.trim() || x.barkodi));
    });
    [ie, ifu].forEach(function (inp) {
      inp.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') { ev.preventDefault(); ruajB.click(); }
        else if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); anulo.click(); }
      });
    });
    var v = el('div', 'ops-furn-veprime'); v.appendChild(harro); v.appendChild(anulo); v.appendChild(ruajB);
    w.appendChild(v);
    return w;
  }
  $('opsKujKerko').addEventListener('input', function () { kujNeEditim = null; kujSaShfaqen = KUJ_MAKS; rifreskoKujtesen(); });

  // Cilësimet → Stoku: e shohin të gjithë; furnizuesit dhe produktet i ndryshon vetëm administratori (v199)
  window.addEventListener('stoku-auth-ndryshoi', function () {
    if (!document.querySelector('.opsione-faqe[data-faqe="stoku"].aktiv')) return;
    furnNeEditim = null; kujNeEditim = null; rifreskoFurnizuesit(); rifreskoKujtesen();
  });
  // Furnizuesit dhe Produktet: të mbyllura kur hapet Stoku, hapen me klikim te koka e kartës (v200)
  function palosKarten(karta, hap) {
    karta.classList.toggle('mbyllur', !hap);
    var b = karta.querySelector('.ops-palos');
    b.setAttribute('aria-expanded', hap ? 'true' : 'false');
    b.setAttribute('aria-label', (hap ? 'Mbyll' : 'Hap') + ' listën e ' + b.getAttribute('data-emri'));
  }
  Array.prototype.forEach.call(document.querySelectorAll('.ops-furn-karta'), function (karta) {
    karta.querySelector('.ops-furn-krye').addEventListener('click', function () { palosKarten(karta, karta.classList.contains('mbyllur')); });
  });
  function zgjidhSkeden(f) {
    if ((f === 'perdoruesit' && !eshteAdminiIStokut()) || (f === 'stoku' && !leja('stoku')) || (f === 'harta' && !lejaHarta())) f = 'pamja';
    if (f === 'perdoruesit') { pd.uid = null; $('pdKerkoInp') && ($('pdKerkoInp').value = ''); pdShenoTeParet(); }
    if (f === 'stoku') {
      Array.prototype.forEach.call(document.querySelectorAll('.ops-furn-karta'), function (karta) { palosKarten(karta, false); });
      furnNeEditim = null; $('opsFurnKerko').value = ''; rifreskoFurnizuesit(); kujNeEditim = null; $('opsKujKerko').value = ''; kujSaShfaqen = pritjeSaShfaqen = KUJ_MAKS; rifreskoKujtesen();
    }
    Array.prototype.forEach.call(document.querySelectorAll('#opsSkeda button[data-faqe]'), function (b) { b.classList.toggle('aktiv', b.dataset.faqe === f); });
    Array.prototype.forEach.call(document.querySelectorAll('.opsione-faqe'), function (x) { x.classList.toggle('aktiv', x.dataset.faqe === f); });
    if (f === 'perdoruesit') pdVizato();
    if (f === 'harta') htHapFaqen(false);
  }
  Array.prototype.forEach.call(document.querySelectorAll('#opsSkeda button[data-faqe]'), function (b) {
    b.addEventListener('click', function () { zgjidhSkeden(b.dataset.faqe); });
  });
  function rifreskoOpsionet() {
    function seg(id, v) { Array.prototype.forEach.call(document.querySelectorAll('#' + id + ' button'), function (b) { b.classList.toggle('aktiv', b.dataset.v === v); }); }
    seg('opsTema', ops.tema); seg('opsDendesia', ops.dendesia); seg('opsMadhesia', ops.madhesia);
    $('opsRendi').value = ops.rendi;
  }
  [['opsTema', 'tema'], ['opsDendesia', 'dendesia'], ['opsMadhesia', 'madhesia']].forEach(function (x) {
    Array.prototype.forEach.call(document.querySelectorAll('#' + x[0] + ' button'), function (b) {
      b.addEventListener('click', function () { ops[x[1]] = b.dataset.v; ruajOps(); zbatoPamjen(); rifreskoOpsionet(); });
    });
  });
  $('opsRendi').addEventListener('change', function () {
    ops.rendi = $('opsRendi').value; ruajOps();
    var r = ops.rendi.split(':'); tab.rendiK = r[0]; tab.rendiD = parseInt(r[1], 10);
    rivizato();
  });
  $('btnOpsione').addEventListener('click', function () { hapOpsionet(); });
  Array.prototype.forEach.call(document.querySelectorAll('#sbpTema button'), function (b) {
    b.addEventListener('click', function () { ops.tema = b.dataset.v; ruajOps(); zbatoPamjen(); rifreskoOpsionet(); });
  });

  // ================= Cilësimet → Harta (v244, harta.js) =================
  // Pikat e marketeve mbi një hartë që tregon vetëm emrat e vendbanimeve; vetëm administratori dhe merchandiserët.
  // Administratori i sheh pikat e Stoku-t (v246: pikat/{id}), ua ndryshon emrin për krejt Stoku-n, i fshin dhe (v250) i
  // shton me dorë në hartë; merchandiseri i sheh krejt marketet e Stoku-t, pa i ndryshuar (v250).
  var SH = window.StokuHarta;
  var HT = { inst: null, dukeHapur: false, pershtatur: false, pikat: null, ngarkuarSe: 0, dukeNgarkuar: false, gabime: 0, zgjedhur: '', neEditim: '' };
  function lejaHarta() { return !!SH && (eshteAdminiIStokut() || eshteMerchandiser()); }
  function htHapur() { return $('dlgOpsione').classList.contains('hapur') && !!document.querySelector('.opsione-faqe[data-faqe="harta"].aktiv'); }
  function rifreskoTabinHarta() {
    var t = $('opsSkedaHarta'); if (!t) return;
    t.hidden = !lejaHarta();
    $('opsHartaNen').textContent = 'Marketet në hartë';
    if (t.hidden && document.querySelector('.opsione-faqe[data-faqe="harta"].aktiv')) zgjidhSkeden('pamja');
  }
  window.addEventListener('stoku-auth-ndryshoi', function () {
    if (!HT) return;
    HT.pikat = null; HT.ngarkuarSe = 0; HT.neEditim = ''; HT.zgjedhur = ''; HT.pershtatur = false;
    rifreskoTabinHarta();
  });
  function htTema() { return document.documentElement.getAttribute('data-tema') === 'dark' ? 'dark' : 'light'; }
  function htPikatEMia() {
    var u = perdoruesi();
    return marketet.map(function (m) { return Object.assign({ uid: u ? u.uid : '', perdoruesi: emriPerdoruesit(), imi: true }, m); });
  }
  // v246: administratori sheh pikat e përbashkëta të Stoku-t (pikat/{id}, në kohë reale); v247: edhe merchandiseri
  var PK = { lista: [], gati: false, ok: false, serveri: false, ndal: null, uid: null };
  function nisPikat() {
    var c = window.__stokuCloud, e = c && c.ekipa, u = perdoruesi(), duhen = !!u && (eshteAdminiIStokut() || eshteMerchandiser());
    if (PK.ndal && (!duhen || PK.uid !== u.uid)) { try { PK.ndal(); } catch (er) { /* ok */ } PK.ndal = null; PK.lista = []; PK.gati = false; PK.ok = false; }
    if (!duhen || PK.ndal || !e || !e.degjoPikat) return;
    PK.uid = u.uid;
    PK.ndal = e.degjoPikat(function (l, info) { PK.lista = MK.pastroPikat(l); PK.gati = true; PK.ok = true; PK.serveri = !!(info && info.serveri); pasPikave(); },
      function () { PK.gati = true; PK.ok = false; if (htHapur()) { htMerrPikat(); htVizato(); } });
  }
  // v250: lista e merchandiserit = marketet e Stoku-t (si te telefoni): pikat e reja shtohen, emrat dhe vendndodhjet vijnë
  // nga pikat, marketi i një pike të fshirë hiqet (kur s'ka afate). Marketet e vjetra i lidh me pikat telefoni (GPS-i).
  function pasPikave() {
    if (eshteMerchandiser() && PK.ok && !ngaVizitori()) {
      var r = MK.sinkronizoMePikat(marketet, PK.lista, afatet, PK.serveri);
      if (r.ndryshuar) {
        marketet = r.marketet;
        r.hequr.forEach(function (id) { fshira.marketet[id] = Date.now(); });
        if (marketiAktiv.id && r.hequr.indexOf(marketiAktiv.id) !== -1) marketiAktiv = MK.ruajAktivin({ id: null, menyra: 'dore', koha: Date.now(), kontrolluarSe: marketiAktiv.kontrolluarSe || 0 });
        ruaj();
      }
    }
    if (htHapur()) { htMerrPikat(); htVizato(); }
  }
  ['stoku-auth-ndryshoi', 'stoku-cloud-gati', 'stoku-merchandiser'].forEach(function (ev) { window.addEventListener(ev, function () { setTimeout(nisPikat, 0); }); });
  setTimeout(nisPikat, 0);
  async function htMerrPikat() {
    nisPikat();
    HT.gabime = 0;
    if (!eshteAdminiIStokut()) { // v250: marketet e Stoku-t (pikat) + të vetat që s'janë pika (të vjetra, pa vendndodhje)
      var kaPike = {}, u = perdoruesi();
      PK.lista.forEach(function (x) { kaPike[x.id] = true; });
      HT.pikat = htPikatESistemit().map(function (x) { return Object.assign(x, { eMia: !!u && x.krijuarNga === u.uid }); })
        .concat(htPikatEMia().filter(function (m) { return !m.p || !kaPike[m.p]; }));
      return;
    }
    HT.pikat = PK.gati ? htPikatESistemit() : null;
  }
  function htPikatESistemit() {
    return PK.lista.map(function (x) { return { id: x.id, uid: 'pika', pika: true, emri: x.emri, lat: x.lat, lng: x.lng, perdoruesi: x.krijuarNgaEmri, krijuarNga: x.krijuarNga, emriNgaAdmini: x.emriNgaAdmini }; });
  }
  async function htHapFaqen(detyro) {
    HT.neEditim = '';
    htShtoHap(false);
    htVizato();
    htHarta();
    await htMerrPikat(detyro);
    htVizato();
  }
  function htVizato() {
    if (!htHapur()) return;
    var admin = eshteAdminiIStokut();
    $('htIntro').textContent = admin
      ? 'Pikat e marketeve që i kanë ruajtur merchandiserët. Në hartë dalin vetëm emrat e qyteteve, fshatrave dhe lagjeve. Kliko një pikë ose një rresht për ta gjetur; me "Ndrysho emrin" e ndërron emrin e pikës për krejt Stoku-n.'
      : 'Marketet e Stoku-t, të njëjtat për krejt merchandiserët. Në hartë dalin vetëm emrat e qyteteve, fshatrave dhe lagjeve. Emrat i ndryshon vetëm administratori.';
    $('htShtoKuti').hidden = !admin; // v250: administratori shton market me dorë në hartë
    var c = $('htLista'); c.textContent = '';
    if (HT.inst) HT.inst.vendos(HT.pikat || []);
    if (!HT.pikat) { $('htInfo').textContent = 'Duke i marrë pikat…'; return; }
    if (HT.inst && !HT.pershtatur) { HT.pershtatur = true; HT.inst.pershtat(HT.pikat); }
    var meVend = HT.pikat.filter(SH.kaVend), paVend = HT.pikat.filter(function (p) { return !SH.kaVend(p); });
    $('htInfo').textContent = (meVend.length === 1 ? '1 pikë në hartë' : meVend.length + ' pika në hartë') +
      (paVend.length ? ' · ' + paVend.length + ' pa vendndodhje' : '') + (HT.gabime ? ' · ' + HT.gabime + ' llogari s\'u lexuan' : '') + '.';
    if (!HT.pikat.length) { c.appendChild(el('div', 'ops-furn-bosh', admin ? 'Asnjë merchandiser s\'ka ruajtur ende market.' : 'S\'ka ende asnjë market në hartë. Shtohet te telefoni, kur je brenda marketit: Cilësimet → Marketet.')); return; }
    function sipasEmrit(a, b) { return String(a.emri).localeCompare(String(b.emri), 'sq'); }
    meVend.sort(sipasEmrit).forEach(function (p) { c.appendChild(htRreshti(p)); });
    if (paVend.length) {
      c.appendChild(el('div', 'ops-furn-nen ht-pa-vend', 'Pa vendndodhje (s\'dalin në hartë)'));
      paVend.sort(sipasEmrit).forEach(function (p) { c.appendChild(htRreshti(p)); });
    }
  }
  function htRreshti(p) {
    var k = SH.celesi(p), admin = eshteAdminiIStokut();
    if (HT.neEditim === k) return htRreshtiIEditimit(p);
    var rr = el('div', 'ops-furn-rresht' + (HT.zgjedhur === k ? ' ht-zgjedhur' : ''));
    rr.setAttribute('data-k', k);
    rr.appendChild(el('span', 'ops-furn-shkronja', (String(p.emri).charAt(0) || '?').toUpperCase()));
    var t = el('div', 'ops-furn-tekst');
    t.appendChild(el('div', 'ops-furn-emri', p.emri));
    t.appendChild(el('div', 'ops-furn-nen', admin ? (p.imi ? 'Marketi yt' : (p.perdoruesi ? 'E shtoi ' + p.perdoruesi : 'Pikë e Stoku-t') + (p.emriNgaAdmini ? ' · emri nga ti' : '')) + (SH.kaVend(p) ? '' : ' · pa vendndodhje')
      : p.pika ? (p.eMia ? 'E shtove ti' : p.perdoruesi ? 'E shtoi ' + p.perdoruesi : 'Market i Stoku-t') : (SH.kaVend(p) ? 'Marketi yt' : 'Pa vendndodhje')));
    rr.appendChild(t);
    rr.addEventListener('click', function () { htZgjidh(k, true, false); });
    if (admin && p.pika) {
      var b = el('button', 'btn dyte vogel', 'Ndrysho emrin'); b.type = 'button';
      b.addEventListener('click', function (ev) { ev.stopPropagation(); htZgjidh(k, true, true); });
      rr.appendChild(b);
    }
    return rr;
  }
  function htZgjidh(k, ngaLista, edito) {
    HT.zgjedhur = k;
    if (edito) HT.neEditim = k;
    if (HT.inst) HT.inst.zgjidh(k, ngaLista);
    htVizato();
    var r = $('htLista').querySelector(edito ? '.ops-furn-edit' : '.ht-zgjedhur');
    if (r && !ngaLista) r.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    var inp = edito && r && r.querySelector('input'); if (inp) { inp.focus(); inp.select(); }
  }
  function htRreshtiIEditimit(p) {
    var w = el('div', 'ops-furn-rresht ops-furn-edit');
    w.appendChild(el('span', 'ops-furn-shkronja', (String(p.emri).charAt(0) || '?').toUpperCase()));
    var t = el('div', 'ops-furn-tekst');
    var inp = el('input', 'inp'); inp.type = 'text'; inp.value = p.emri; inp.maxLength = MK.EMRI_MAKS;
    inp.setAttribute('autocomplete', 'off'); inp.setAttribute('spellcheck', 'false'); inp.setAttribute('aria-label', 'Emri i ri për ' + p.emri);
    var gab = el('div', 'ops-furn-gabim');
    t.appendChild(inp); t.appendChild(el('div', 'ops-furn-nen', 'Tani: "' + p.emri + '"' + (p.perdoruesi ? ' · e shtoi ' + p.perdoruesi : ''))); t.appendChild(gab);
    w.appendChild(t);
    var fshi = el('button', 'btn tekst rrezik vogel', 'Fshije pikën'); fshi.type = 'button'; fshi.title = 'Hiqe nga harta (marketet e merchandiserëve mbeten)';
    fshi.addEventListener('click', async function () {
      var po = await konfirmo('Të fshihet marketi?', '"' + p.emri + '" hiqet nga harta dhe nga lista e merchandiserëve (te ata që kanë afate aty, mbetet me afatet). Afatet s\'fshihen.', 'Fshije');
      if (!po) return;
      var r = await window.__stokuCloud.ekipa.fshiPiken(p.id);
      if (!r || !r.ok) { gab.textContent = 'S\'u fshi. Kontrollo internetin dhe provo sërish.'; return; }
      HT.neEditim = ''; toast('Pika u fshi.');
    });
    var anulo = el('button', 'btn tekst vogel', 'Anulo'); anulo.type = 'button';
    var ruajB = el('button', 'btn vogel', 'Ruaj'); ruajB.type = 'button';
    anulo.addEventListener('click', function () { HT.neEditim = ''; htVizato(); });
    ruajB.addEventListener('click', async function () {
      var e = SH.emriIPastruar(inp.value);
      if (!e) { gab.textContent = 'Shkruaj emrin e pikës.'; inp.focus(); return; }
      if (e === p.emri) { HT.neEditim = ''; htVizato(); return; }
      if (MK.ekzistonEmri(PK.lista, e, p.id)) { gab.textContent = 'Në Stoku ka tashmë një market me këtë emër.'; inp.focus(); return; }
      var cl = window.__stokuCloud;
      if (!cl || !cl.ekipa || !cl.ekipa.ndryshoPiken) { gab.textContent = 'Emri s\'u ndryshua. Kontrollo internetin dhe provo sërish.'; return; }
      ruajB.disabled = anulo.disabled = true; gab.textContent = '';
      var r = await cl.ekipa.ndryshoPiken(p.id, { emri: e }, true);
      ruajB.disabled = anulo.disabled = false;
      if (!r || !r.ok) { gab.textContent = 'Emri s\'u ndryshua. Kontrollo internetin dhe provo sërish.'; return; }
      p.emri = e; HT.neEditim = '';
      htVizato(); toast('Emri u ndryshua. Merchandiserët e shohin emrin e ri.');
    });
    inp.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); ruajB.click(); }
      else if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); anulo.click(); }
    });
    var v = el('div', 'ops-furn-veprime'); v.appendChild(fshi); v.appendChild(anulo); v.appendChild(ruajB);
    w.appendChild(v);
    return w;
  }
  function htHarta() {
    var hEl = $('htHarta');
    if (HT.inst) { HT.inst.tema(htTema()); setTimeout(function () { if (HT.inst) HT.inst.madhesia(); }, 60); return; }
    if (HT.dukeHapur || !SH) return;
    HT.dukeHapur = true;
    $('htGabim').hidden = true; hEl.hidden = false;
    SH.krijo(hEl, { tema: htTema(), pikat: HT.pikat || [], kurSkaPllaka: function () { $('htGabim').hidden = false; $('htProvo').hidden = true; $('htGabimTekst').textContent = 'Pjesët e hartës s\'u morën (rrugët dhe emrat e vendeve). Kontrollo internetin; pikat dalin edhe ashtu.'; },
      kurSkaSatelit: function () { toast('Pamja satelitore s\'u hap. Kontrollo internetin dhe provo sërish.'); },
      kurKlikon: function (k) { htZgjidh(k, false, false); } }).then(function (inst) {
      HT.dukeHapur = false; HT.inst = inst;
      if (!$('htShtoForma').hidden) inst.shenjestra(true);
      if (HT.pikat) { HT.pershtatur = true; inst.vendos(HT.pikat); inst.pershtat(HT.pikat); }
    }, function (e) {
      HT.dukeHapur = false;
      hEl.hidden = true; $('htGabim').hidden = false;
      $('htGabimTekst').textContent = e && e.message === 'webgl' ? 'Ky kompjuter s\'e shfaq dot hartën (WebGL). Lista e pikave është më poshtë.'
        : 'Harta s\'u hap. Kontrollo internetin dhe provo sërish.';
      $('htProvo').hidden = !!(e && e.message === 'webgl');
    });
  }
  $('htProvo').addEventListener('click', function () { htHarta(); });
  // ---- v250: administratori shton një market me dorë në hartë: pika = qendra e hartës (nën shenjën), jo afër një tjetri ----
  function htShtoHap(v) {
    $('htShtoForma').hidden = !v; $('htShto').hidden = v;
    $('htShtoGabim').textContent = '';
    if (HT.inst) HT.inst.shenjestra(v);
    if (v) { $('htShtoEmri').value = ''; setTimeout(function () { $('htShtoEmri').focus(); }, 50); }
  }
  $('htShto').addEventListener('click', function () { htShtoHap(true); });
  $('htShtoAnulo').addEventListener('click', function () { htShtoHap(false); });
  async function htShtoRuaj() {
    var gab = $('htShtoGabim'), e = SH.emriIPastruar($('htShtoEmri').value);
    if (!eshteAdminiIStokut() || $('htShtoRuaj').disabled) return;
    if (!e) { gab.textContent = 'Shkruaj emrin e marketit.'; $('htShtoEmri').focus(); return; }
    if (!HT.inst) { gab.textContent = 'Harta s\'është hapur ende.'; return; }
    var q = HT.inst.qendra();
    if (q.zoom < 15) { gab.textContent = 'Zmadho hartën (sa të shihen rrugët) që marketi të vendoset saktë.'; return; }
    if (MK.ekzistonEmri(PK.lista, e)) { gab.textContent = 'Në Stoku ka tashmë një market me këtë emër. Shto edhe vendin, p.sh. "' + e + ' Qendër".'; return; }
    var af = MK.pikaPerMarketin(PK.lista, q);
    if (af) { gab.textContent = 'Këtu është tashmë marketi "' + af.emri + '".'; return; }
    var cl = window.__stokuCloud;
    if (!cl || !cl.ekipa || !cl.ekipa.shtoPiken) { gab.textContent = 'S\'u ruajt. Kontrollo internetin dhe provo sërish.'; return; }
    $('htShtoRuaj').disabled = true; gab.textContent = '';
    var r = await cl.ekipa.shtoPiken({ emri: e, lat: Math.round(q.lat * 1e6) / 1e6, lng: Math.round(q.lng * 1e6) / 1e6 });
    $('htShtoRuaj').disabled = false;
    if (!r || !r.ok) { gab.textContent = 'S\'u ruajt. Kontrollo internetin dhe provo sërish.'; return; }
    htShtoHap(false);
    toast('"' + e + '" u shtua në hartë. Merchandiserët e shohin menjëherë.', { ms: 4000 });
  }
  $('htShtoRuaj').addEventListener('click', htShtoRuaj);
  $('htShtoEmri').addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter') { ev.preventDefault(); htShtoRuaj(); }
    else if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); htShtoHap(false); }
  });

  // ================= Cilësimet → Përdoruesit (v230, vetëm administratori) =================
  // Llogaritë nga perdoruesit/{uid}, lejet nga lejet/{uid} (dy dëgjues, vetëm te administratori). Llogaria pa dokument
  // lejesh = "Pa u kontrolluar" (i ka krejt lejet). Çdo ndryshim ruhet menjëherë, e shënon llogarinë si të kontrolluar
  // dhe vlen menjëherë te telefoni dhe kompjuteri i asaj llogarie. Llogaritë e reja dalin edhe si njoftim.
  var pd = { llogarite: null, lejet: null, gabimLlogari: false, gabimLejet: false, ndal: [], uid: null, teReja: 0 };
  var KEY_PD_PARE = 'stoku:perdoruesit:pare'; // llogaritë e pakontrolluara që administratori i ka parë në këtë pajisje
  var pdNjoftuar = {};
  function pdNis() {
    var c = window.__stokuCloud;
    if (pd.ndal.length || !c || !c.ekipa || !c.ekipa.degjoKrejtLlogarite || !c.lejet || !eshteAdminiIStokut()) return;
    pd.ndal.push(c.ekipa.degjoKrejtLlogarite(function (l) { pd.llogarite = l; pd.gabimLlogari = false; pdNdryshoi(); },
      function () { pd.gabimLlogari = true; pdRifresko(); }));
    pd.ndal.push(c.lejet.degjoKrejt(function (m) { pd.lejet = m; pd.gabimLejet = false; pdNdryshoi(); },
      function () { pd.gabimLejet = true; pd.lejet = pd.lejet || {}; pdNdryshoi(); })); // rregullat para v230
  }
  function pdNdal() {
    pd.ndal.forEach(function (f) { try { f(); } catch (e) { /* ok */ } });
    pd = { llogarite: null, lejet: null, gabimLlogari: false, gabimLejet: false, ndal: [], uid: null, teReja: 0 };
  }
  window.addEventListener('stoku-auth-ndryshoi', function () {
    if (!eshteAdminiIStokut()) { pdNdal(); pdRifresko(); return; }
    setTimeout(function () { if (eshteAdminiIStokut()) { pdNis(); pdRifresko(); } }, 2500); // pas sinkronizimit të parë
  });
  function pdFaqjaHapur() { return $('dlgOpsione').classList.contains('hapur') && !!document.querySelector('.opsione-faqe[data-faqe="perdoruesit"].aktiv'); }
  function pdLista() {
    var L = window.StokuLejet, m = pd.lejet || {};
    return (pd.llogarite || []).filter(function (a) { return !a.admin; }).map(function (a) {
      var d = m[a.uid] || null;
      return Object.assign({}, a, { dok: d, statusi: L.statusi(d) });
    });
  }
  function pdLexoPare() { try { var x = JSON.parse(localStorage.getItem(KEY_PD_PARE) || 'null'); return Array.isArray(x) ? x : null; } catch (e) { return null; } }
  function pdRuajPare(l) { try { localStorage.setItem(KEY_PD_PARE, JSON.stringify(l.slice(-1000))); } catch (e) { /* ok */ } }
  function pdNdryshoi() {
    if (pd.llogarite && pd.lejet) {
      var rinj = pdLista().filter(function (a) { return a.statusi === 'ri'; });
      var pare = pdLexoPare();
      if (pare === null) { // hera e parë në këtë pajisje: llogaritë e vjetra (para v230, pa krijuarSe) s'njoftohen si të reja
        pare = rinj.filter(function (a) { return !a.krijuarSe; }).map(function (a) { return a.uid; });
        pdRuajPare(pare);
      }
      var teReja = rinj.filter(function (a) { return pare.indexOf(a.uid) === -1; });
      pd.teReja = teReja.length;
      var paNjoftuar = teReja.filter(function (a) { return !pdNjoftuar[a.uid]; });
      paNjoftuar.forEach(function (a) { pdNjoftuar[a.uid] = true; });
      if (paNjoftuar.length && !pdFaqjaHapur()) {
        toast((paNjoftuar.length === 1 ? 'Llogari e re: ' + paNjoftuar[0].emri + '. Kontrolloja lejet.' : paNjoftuar.length + ' llogari të reja. Kontrolloji lejet.'),
          { veprimi: function () { hapOpsionet('perdoruesit'); }, butoni: 'Shiko', ms: 9000 });
      }
      if (pdFaqjaHapur()) pdShenoTeParet();
    }
    pdRifresko();
  }
  function pdShenoTeParet() {
    if (!pd.llogarite || !pd.lejet) return;
    var pare = pdLexoPare() || [];
    pdLista().forEach(function (a) { if (a.statusi === 'ri' && pare.indexOf(a.uid) === -1) pare.push(a.uid); });
    pdRuajPare(pare);
    pd.teReja = 0;
    pdRifresko(true);
  }
  // Skeda te Cilësimet (vetëm administratori): "N pa u kontrolluar"
  function pdRifresko(paListe) {
    if (!pd || !$('opsSkedaPerdoruesit')) return;
    var admin = eshteAdminiIStokut(), gati = admin && !!pd.llogarite && !!pd.lejet;
    $('opsSkedaPerdoruesit').hidden = !admin;
    rifreskoTabinHarta();
    if (PK) nisPikat(); // v246: administratori i dëgjon pikat e Stoku-t (harta)
    var rinj = gati ? pdLista().filter(function (a) { return a.statusi === 'ri'; }).length : 0;
    var nen = $('opsPerdoruesitNen');
    nen.textContent = rinj ? (rinj === 1 ? '1 pa u kontrolluar' : rinj + ' pa u kontrolluar') : 'Lejet e llogarive';
    nen.classList.toggle('ops-nen-pritje', !!rinj);
    if (!paListe && pdFaqjaHapur()) pdVizato();
  }
  function pdVizato() {
    if (!eshteAdminiIStokut()) return;
    if (pd.uid) pdVizatoDetajet(); else pdVizatoListen();
  }
  function pdKarte(klasa) { return el('div', 'ops-karta' + (klasa ? ' ' + klasa : '')); }
  function pdInfo(tekst, kujdes) { var k = pdKarte(kujdes ? 'pd-paralajmerim' : ''); k.appendChild(el('p', 'ops-hint', tekst)); k.lastChild.style.margin = '0'; return k; }
  function pdNenTeksti(a) {
    var n = window.StokuLejet.teNdaluara(a.dok && a.dok.lejet);
    var p1 = a.statusi === 'ri' ? (a.krijuarSe ? 'Llogari e re, ' + EKL.kohaRelative(a.krijuarSe) : 'Pa u kontrolluar: krejt lejet')
      : a.statusi === 'kufizuar' ? (n === 1 ? '1 leje e ndaluar' : n + ' leje të ndaluara') : 'Krejt lejet';
    return [p1, pdMerchandiser(a) ? 'merchandiser' : '', a.kycurSe ? 'u kyç ' + EKL.kohaRelative(a.kycurSe) : ''].filter(Boolean).join(' · ');
  }
  function pdShkronja(a) { return el('span', 'pd-shkronja ' + a.statusi, (String(a.emri || '?').charAt(0) || '?').toUpperCase()); }
  function pdVizatoListen() {
    var c = $('pdPamja'); c.textContent = '';
    $('pdTitulli').textContent = 'Përdoruesit';
    $('pdPershkrimi').hidden = false;
    if (!pd.llogarite || !pd.lejet) {
      c.appendChild(pdInfo(pd.gabimLlogari ? 'Llogaritë s\'u lexuan. Kontrollo internetin dhe provo sërish.' : 'Duke i marrë llogaritë…'));
      if (!pd.ndal.length) pdNis();
      return;
    }
    if (pd.gabimLejet) c.appendChild(pdInfo('Firebase s\'i lejon ende lejet: rregullat e Firestore duhet të përditësohen (v230). Deri atëherë krejt llogaritë i kanë krejt lejet.', true));
    var lista = pdLista();
    var q = ($('pdKerkoInp') ? $('pdKerkoInp').value : '').trim().toLocaleLowerCase('sq');
    if (lista.length >= 8 || q) {
      var inp = el('input', 'inp ops-furn-kerko'); inp.type = 'search'; inp.id = 'pdKerkoInp'; inp.placeholder = 'Kërko përdoruesin'; inp.setAttribute('aria-label', 'Kërko përdoruesin');
      inp.value = q; inp.style.marginBottom = '14px';
      inp.addEventListener('input', function () { var pos = inp.selectionStart; pdVizatoListen(); var n = $('pdKerkoInp'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) { /* ok */ } } });
      c.appendChild(inp);
    }
    var fil = q ? lista.filter(function (a) { return String(a.emri).toLocaleLowerCase('sq').indexOf(q) !== -1; }) : lista;
    if (!fil.length) { c.appendChild(pdInfo(q ? 'Asnjë përdorues me këtë emër.' : 'Ende s\'ka llogari të tjera.')); return; }
    var rinj = fil.filter(function (a) { return a.statusi === 'ri'; })
      .sort(function (x, y) { return (y.krijuarSe || y.kycurSe || 0) - (x.krijuarSe || x.kycurSe || 0); });
    var tjeret = fil.filter(function (a) { return a.statusi !== 'ri'; })
      .sort(function (x, y) { return String(x.emri).localeCompare(String(y.emri), 'sq'); });
    [['Pa u kontrolluar', rinj], ['Të kontrolluar', tjeret]].forEach(function (x) {
      if (!x[1].length) return;
      var k = pdKarte();
      var kr = el('div', 'pd-krye');
      kr.appendChild(el('div', 'ops-titull', x[0]));
      var nr = el('span', 'ops-numri' + (x[0] === 'Pa u kontrolluar' ? ' ops-numri--pritje' : ''), String(x[1].length)); kr.firstChild.appendChild(nr);
      if (x[0] === 'Pa u kontrolluar' && x[1].length > 1 && !q) {
        var bk = el('button', 'btn dyte vogel pd-veprime-krye', 'Shëno krejt si të kontrolluar'); bk.type = 'button';
        bk.addEventListener('click', async function () {
          var po = await konfirmo('T\'i shënosh të kontrolluar?', x[1].length + ' llogari mbeten me krejt lejet dhe s\'dalin më te "Pa u kontrolluar". Lejet mund t\'i ndryshosh kurdo.', 'Po, shënoji');
          if (!po) return;
          bk.disabled = true;
          var r = await window.__stokuCloud.lejet.ruajShume(x[1].map(function (a) { return { uid: a.uid, lejet: window.StokuLejet.krejt(true), emri: a.emri }; }), { nga: emriPerdoruesit() });
          bk.disabled = false;
          toast(r.ok ? (r.n === 1 ? '1 llogari u shënua e kontrolluar.' : r.n + ' llogari u shënuan të kontrolluara.')
            : r.arsye === 'leje' ? 'S\'u ruajt: rregullat e Firestore duhet të përditësohen (v230).' : 'S\'u ruajtën krejt. Kontrollo internetin dhe provo sërish.');
        });
        kr.appendChild(bk);
      }
      k.appendChild(kr);
      var l = el('div', 'pd-lista');
      x[1].forEach(function (a) {
        var b = el('button', 'pd-rresht'); b.type = 'button';
        b.appendChild(pdShkronja(a));
        var t = el('div', 'pd-tekst');
        t.appendChild(el('div', 'pd-emri', a.emri));
        t.appendChild(el('div', 'pd-nen' + (a.statusi === 'ri' ? ' ri' : ''), pdNenTeksti(a)));
        b.appendChild(t);
        b.appendChild(el('span', 'pd-shigjete', '›'));
        b.setAttribute('aria-label', 'Lejet e ' + a.emri);
        b.addEventListener('click', function () { pd.uid = a.uid; pdVizato(); $('dlgOpsione').querySelector('.ops-djathtas').scrollTop = 0; });
        l.appendChild(b);
      });
      k.appendChild(l);
      c.appendChild(k);
    });
  }
  function pdRuaj(a, lejet, mesazh) {
    var c = window.__stokuCloud;
    if (!c || !c.lejet || !eshteAdminiIStokut()) return Promise.resolve({ ok: false });
    return c.lejet.ruaj(a.uid, lejet, { nga: emriPerdoruesit(), emri: a.emri }).then(function (r) {
      if (!r.ok) {
        toast(r.arsye === 'leje' ? 'S\'u ruajt: rregullat e Firestore duhet të përditësohen (v230).' : 'S\'u ruajt. Kontrollo internetin dhe provo sërish.');
        if (pdFaqjaHapur()) pdVizato(); // çelësat kthehen si janë në të vërtetë
      } else if (mesazh) toast(mesazh);
      return r;
    });
  }
  // v241: a punon si merchandiser (zgjedhja e administratorit fiton mbi atë të regjistrimit)
  function pdMerchandiser(a) {
    var z = window.StokuLejet.zgjedhja(a.dok && a.dok.lejet, 'marketet');
    return z !== null ? z : !!a.merchandiser;
  }
  // "Lejo krejt" / "Ndalo krejt" / "U kontrollua" s'e ndërrojnë "Merchandiser"
  function pdKrejt(a, vlera) {
    var L = window.StokuLejet, tani = pd.lejet && pd.lejet[a.uid];
    return L.meZgjedhjet(L.krejt(vlera), (tani && tani.lejet) || null);
  }
  function pdVizatoDetajet() {
    var c = $('pdPamja'); c.textContent = '';
    var L = window.StokuLejet;
    var a = pdLista().filter(function (x) { return x.uid === pd.uid; })[0];
    var mbrapa = el('button', 'btn tekst vogel', '← Krejt përdoruesit'); mbrapa.type = 'button'; mbrapa.id = 'pdMbrapa';
    mbrapa.addEventListener('click', function () { pd.uid = null; pdVizato(); });
    $('pdPershkrimi').hidden = true;
    if (!a) { $('pdTitulli').textContent = 'Përdoruesit'; c.appendChild(mbrapa); c.appendChild(pdInfo('Kjo llogari s\'ekziston më.')); return; }
    $('pdTitulli').textContent = a.emri;
    var lejet = (a.dok && a.dok.lejet) || null;
    var k = pdKarte();
    var kr = el('div', 'pd-krye');
    kr.appendChild(el('span', 'ops-av ops-av--madh', (String(a.emri).charAt(0) || '?').toUpperCase()));
    var ki = el('div');
    var n = L.teNdaluara(lejet);
    ki.appendChild(el('div', 'ops-titull', a.statusi === 'ri' ? 'Pa u kontrolluar: i ka krejt lejet' : a.statusi === 'kufizuar' ? (n === 1 ? '1 leje e ndaluar' : n + ' leje të ndaluara') : 'Krejt lejet'));
    if (a.statusi === 'ri') ki.firstChild.style.color = 'var(--sb-ic-portokalli)';
    var info = [a.krijuarSe ? 'U regjistrua ' + EKL.kohaRelative(a.krijuarSe) : '', a.kycurSe ? 'U kyç ' + EKL.kohaRelative(a.kycurSe) : '',
      a.grupi ? 'Në një grup' : 'Pa grup', pdMerchandiser(a) ? 'Merchandiser' : '', a.dok && a.dok.kontrolluarSe ? 'Kontrolluar ' + EKL.kohaRelative(a.dok.kontrolluarSe) + (a.dok.kontrolluarNga ? ' nga ' + a.dok.kontrolluarNga : '') : ''].filter(Boolean);
    ki.appendChild(el('p', 'pd-info-rresht', info.join(' · ') + '.'));
    kr.appendChild(ki);
    var vk = el('div', 'pd-veprime-krye');
    if (a.statusi === 'ri') {
      var bk = el('button', 'btn', 'U kontrollua'); bk.type = 'button'; bk.id = 'pdKontrollua'; bk.title = 'I mban krejt lejet dhe s\'del më te "Pa u kontrolluar"';
      bk.addEventListener('click', function () { bk.disabled = true; pdRuaj(a, pdKrejt(a, true), a.emri + ' u shënua i kontrolluar.').then(function () { bk.disabled = false; }); });
      vk.appendChild(bk);
    }
    var bl = el('button', 'btn dyte', 'Lejo krejt'); bl.type = 'button'; bl.id = 'pdLejoKrejt';
    bl.addEventListener('click', function () { pdRuaj(a, pdKrejt(a, true), a.emri + ' i ka tani krejt lejet.'); });
    var bn = el('button', 'btn tekst rrezik', 'Ndalo krejt'); bn.type = 'button'; bn.id = 'pdNdaloKrejt';
    bn.addEventListener('click', async function () {
      var po = await konfirmo('T\'i ndalohen krejt lejet?', a.emri + ' do të mund vetëm të hyjë në llogari: s\'do ta shohë as stokun, as afatet, as grupin.', 'Ndalo krejt');
      if (po) pdRuaj(a, pdKrejt(a, false), a.emri + ' s\'ka më asnjë leje.');
    });
    vk.appendChild(bl); vk.appendChild(bn);
    var baf = el('button', 'btn dyte', 'Afatet e ' + a.emri); baf.type = 'button'; baf.id = 'pdAfatetBtn'; // v241
    baf.addEventListener('click', function () { pdHapAfatet(a); });
    vk.appendChild(baf);
    kr.appendChild(vk);
    k.appendChild(kr);
    if (a.statusi === 'ri') k.appendChild(el('p', 'pd-info-rresht', 'Ndalo çka s\'duhet të përdorë (ruhet vetë), ose kliko "U kontrollua" që t\'i mbajë krejt lejet.'));
    c.appendChild(mbrapa);
    c.appendChild(k);
    var rrjeti = el('div', 'pd-lejet-rrjeti');
    L.KATALOGU.forEach(function (g) {
      var gr = el('div', 'pd-grupi');
      gr.appendChild(el('div', 'pd-titull', g.grupi));
      var kk = pdKarte();
      g.lejet.forEach(function (l) {
        var r = el('label', 'pd-leja' + (l.prindi ? ' femije' : ''));
        var id = 'pdLeja_' + l.k; r.htmlFor = id;
        var t = el('span', 'pd-leja-tekst');
        t.appendChild(el('b', null, l.emri));
        if (l.pershkrim) t.appendChild(el('span', null, l.pershkrim));
        var nd = el('span', 'lj-ndez');
        var inp = el('input'); inp.type = 'checkbox'; inp.id = id;
        // v241: "Merchandiser" (me zgjedhje): vlera e administratorit, ose ajo e zgjedhur kur u hap llogaria
        inp.checked = l.zgjedhje ? pdMerchandiser(a) : !(lejet && lejet[l.k] === false);
        if (l.prindi && !L.lejohet(lejet, l.prindi)) { inp.disabled = true; r.classList.add('joaktiv'); }
        inp.addEventListener('change', function () {
          var tani = pd.lejet && pd.lejet[a.uid];
          var l2 = L.pastro((tani && tani.lejet) || null);
          l2[l.k] = inp.checked;
          pdRuaj(a, l2);
        });
        nd.appendChild(inp); nd.appendChild(el('span', 'pist'));
        r.appendChild(t); r.appendChild(nd);
        kk.appendChild(r);
      });
      gr.appendChild(kk);
      rrjeti.appendChild(gr);
    });
    c.appendChild(rrjeti);
    var sh = el('p', 'ops-hint', 'Ndryshimet ruhen vetë dhe vlejnë menjëherë te telefoni dhe kompjuteri i ' + a.emri + '. Çka s\'i lejohet, i zhduket krejt, pa asnjë mesazh.');
    sh.style.textAlign = 'center';
    c.appendChild(sh);
  }

  // ================= Shkurtoret e tastierës =================
  var SHKURTORET = [
    ['Kërko kudo (në të gjithë folderat)', ['Ctrl', 'K'], ['/']],
    ['Filtro listën aktuale', ['Ctrl', 'F']],
    ['Fusha e barkodit (skaner USB)', ['B']],
    ['Produkt i ri', ['N']],
    ['Lëviz nëpër rreshta', ['↑'], ['↓']],
    ['Hap produktin e theksuar', ['Enter']],
    ['Zgjidh / hiq rreshtin', ['Hapësirë']],
    ['Zgjidh disa rreshta me radhë', ['Shift', 'klik']],
    ['Zgjidh të gjitha në listë', ['Ctrl', 'A']],
    ['Fshi të zgjedhurat (ose rreshtin)', ['Delete']],
    ['Zhvendos të zgjedhurat', ['M']],
    ['Eksporto në Excel', ['Ctrl', 'E']],
    ['Eksporto në PDF', ['Ctrl', 'P']],
    ['Importo', ['Ctrl', 'I']],
    ['Përmbledhja / Të gjitha produktet', ['Alt', '0'], ['Alt', 'A']],
    ['Hap folderin 1–9', ['Alt', '1…9']],
    ['Mbyll dritaren / pastro', ['Esc']],
    ['Afati i ri (te faqja e afateve)', ['N']],
    ['Kjo listë', ['?']]
  ];
  // v231: shkurtoret e veçorive që s'lejohen s'dalin fare
  function lejaNjeNga() { var k = arguments; return function () { return Array.prototype.some.call(k, function (x) { return leja(x); }); }; }
  var meListe = lejaNjeNga('stoku', 'afatet');
  var LEJA_E_SHKURTORES = {
    'Kërko kudo (në të gjithë folderat)': lejaNjeNga('stoku'), 'Filtro listën aktuale': meListe, 'Fusha e barkodit (skaner USB)': lejaNjeNga('stoku'),
    'Produkt i ri': lejaNjeNga('stokuShto'), 'Lëviz nëpër rreshta': meListe, 'Hap produktin e theksuar': lejaNjeNga('stokuNdrysho'),
    'Zgjidh / hiq rreshtin': meListe, 'Zgjidh disa rreshta me radhë': meListe, 'Zgjidh të gjitha në listë': meListe,
    'Fshi të zgjedhurat (ose rreshtin)': lejaNjeNga('stokuFshi', 'afatetFshi'), 'Zhvendos të zgjedhurat': lejaNjeNga('stokuNdrysho'),
    'Eksporto në Excel': function () { return leja('eksportExcel') && meListe(); }, 'Eksporto në PDF': function () { return leja('eksportPdf') && leja('stoku'); },
    'Importo': lejaNjeNga('stokuImporto', 'afatetImporto'), 'Përmbledhja / Të gjitha produktet': lejaNjeNga('stoku'),
    'Hap folderin 1–9': lejaNjeNga('stoku'), 'Afati i ri (te faqja e afateve)': lejaNjeNga('afatetShto')
  };
  function vizatoShkurtoret() {
    var t = $('tabShkurtoret');
    if (!SHKURTORET || !t) return; // thirrje e hershme (para se lista të jetë gati)
    t.textContent = '';
    SHKURTORET.forEach(function (s) {
      var lejohet = LEJA_E_SHKURTORES[s[0]];
      if (lejohet && !lejohet()) return;
      var tr = el('tr');
      tr.appendChild(el('td', null, s[0]));
      var td = el('td');
      s.slice(1).forEach(function (komb, i) {
        if (i) td.appendChild(document.createTextNode(' ose '));
        komb.forEach(function (k) { td.appendChild(el('span', 'tast', k)); });
      });
      tr.appendChild(td);
      t.appendChild(tr);
    });
  }
  vizatoShkurtoret();
  $('btnShkurtoret').addEventListener('click', function () { hapOpsionet('shkurtoret'); });

  function poShkruan(t) {
    return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
  }
  // Shkurtoret me një shkronjë (N, M, B, /, ?) kryhen pas 45 ms: nëse ndërkohë vjen një tastë tjetër, ishte shkronja e
  // parë e një barkodi nga skaneri USB (p.sh. "N4500123") dhe shkurtorja s'kryhet
  var kohaTastesFundit = 0, shkurtoreNePritje = null;
  document.addEventListener('keydown', function () { kohaTastesFundit = performance.now(); }, true);
  function veproPasPak(fn) {
    clearTimeout(shkurtoreNePritje);
    var nisur = performance.now();
    shkurtoreNePritje = setTimeout(function () {
      shkurtoreNePritje = null;
      if (kohaTastesFundit > nisur + 1 || dialogISiperm() || poShkruan(document.activeElement)) return;
      fn();
    }, 45);
  }
  document.addEventListener('keydown', function (ev) {
    var ctrl = ev.ctrlKey || ev.metaKey;
    var k = ev.key;
    var dlg = dialogISiperm();
    if (k === 'Escape') {
      if ($('menu').classList.contains('hapur')) { mbyllMenune(); return; }
      if (dlg) { ev.preventDefault(); mbyllDialog(dlg.id); return; }
      if ($('toast').classList.contains('hapur')) { mbyllToast(); }
      if (pamja !== 'permbledhja' && zgjedhuraLista().length) { tab.zgjedhura = {}; rifreskoZgjedhjen(); return; }
      if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
      return;
    }
    if (dlg) {
      // Ctrl+Enter ruan produktin nga çdo fushë e dialogut
      if (dlg.id === 'dlgProdukt' && ctrl && k === 'Enter') { ev.preventDefault(); ruajProduktin(); }
      return;
    }
    if (ctrl && (k === 'k' || k === 'K')) { ev.preventDefault(); if (leja('stoku')) { $('kerkoGlobal').focus(); $('kerkoGlobal').select(); } return; }
    if (ctrl && (k === 'f' || k === 'F') && pamja === 'afatet') { ev.preventDefault(); $('afKerko').focus(); $('afKerko').select(); return; }
    if (ctrl && (k === 'f' || k === 'F') && pamja === 'ekipi') { ev.preventDefault(); if (ekNen !== 'afatet') ekShkoTe('afatet'); $('ekKerko').focus(); $('ekKerko').select(); return; }
    if (ctrl && (k === 'f' || k === 'F')) {
      if (pamja === 'permbledhja') shkoTe('te-gjitha', { reset: true });
      ev.preventDefault(); $('kerko').focus(); $('kerko').select(); return;
    }
    // Eksporti/importi sipas faqes: te Afatet ato të afateve; te Grupi asgjë (Ctrl+P mbetet printimi i shfletuesit)
    if (ctrl && (k === 'e' || k === 'E' || k === 'p' || k === 'P' || k === 'i' || k === 'I')) {
      var kk2 = k.toLowerCase();
      if (pamja === 'ekipi') return;
      if (pamja === 'afatet') {
        if (kk2 === 'p') return;
        ev.preventDefault(); $(kk2 === 'e' ? 'afBtnExcel' : 'afBtnImport').click(); return;
      }
      ev.preventDefault();
      if (kk2 === 'e') hapEksportin('excel'); else if (kk2 === 'p') hapEksportin('pdf'); else hapImportin();
      return;
    }
    if (ev.altKey && !ctrl) {
      if (k === '0') { ev.preventDefault(); shkoTe('permbledhja'); return; }
      if (k === 'a' || k === 'A') { ev.preventDefault(); shkoTe('te-gjitha', { reset: true }); return; }
      var n = parseInt(k, 10);
      if (n >= 1 && n <= 9 && foldera[n - 1]) { ev.preventDefault(); shkoTe(foldera[n - 1].id); return; }
      // Në disa tastiera Alt+numër jep kod tjetër; provo me ev.code
      var m = /^Digit([1-9])$/.exec(ev.code || '');
      if (m && foldera[+m[1] - 1]) { ev.preventDefault(); shkoTe(foldera[+m[1] - 1].id); return; }
    }
    if (poShkruan(ev.target) || ctrl && k !== 'a' && k !== 'A' || ev.altKey) return;
    // Shkronjat e një barkodi të skaneri USB (vijnë shumë shpejt njëra pas tjetrës) s'janë shkurtore ("N", "M", "B"…)
    if (k.length === 1 && skanBuf.length >= 2 && performance.now() - skanKoha < 60) return;

    var neTabele = pamja !== 'permbledhja' && pamja !== 'afatet' && pamja !== 'ekipi';
    if (k === '/') { ev.preventDefault(); if (leja('stoku')) veproPasPak(function () { $('kerkoGlobal').focus(); }); return; }
    if (k === '?') { ev.preventDefault(); veproPasPak(function () { hapOpsionet('shkurtoret'); }); return; }
    if (pamja === 'ekipi') return;
    if (k === 'n' || k === 'N') { ev.preventDefault(); veproPasPak(function () { if (pamja === 'afatet') hapAfatinPc(null); else hapProduktIRi('', null, false); }); return; }
    if (!neTabele) return;
    if ((k === 'b' || k === 'B') && folderSipasId(pamja)) { ev.preventDefault(); veproPasPak(function () { $('barkodi').focus(); }); return; }
    if (ctrl && (k === 'a' || k === 'A')) {
      ev.preventDefault();
      tabelaAktuale.fil.forEach(function (p) { tab.zgjedhura[celesi(p.kategoriaId, p.barkodi)] = true; });
      rifreskoZgjedhjen(); return;
    }
    if (k === 'ArrowDown') { ev.preventDefault(); vendosFokusin(tab.fokus + 1); return; }
    if (k === 'ArrowUp') { ev.preventDefault(); vendosFokusin(tab.fokus - 1); return; }
    var pf = tabelaAktuale.faqe[tab.fokus];
    if (k === 'Enter' && pf) { ev.preventDefault(); hapProduktin(celesi(pf.kategoriaId, pf.barkodi)); return; }
    if (k === ' ' && pf) { ev.preventDefault(); zgjidhRreshtin(tab.fokus, ev.shiftKey); return; }
    if (k === 'Delete' || k === 'Backspace') {
      var z = zgjedhuraLista();
      if (z.length) { ev.preventDefault(); fshijProduktet(z); }
      else if (pf) { ev.preventDefault(); fshijProduktet([celesi(pf.kategoriaId, pf.barkodi)]); }
      return;
    }
    if (k === 'm' || k === 'M') {
      var zz = zgjedhuraLista();
      if (zz.length) { ev.preventDefault(); veproPasPak(function () { hapZhvendosjen(zz); }); }
      else if (pf) { ev.preventDefault(); veproPasPak(function () { hapZhvendosjen([celesi(pf.kategoriaId, pf.barkodi)]); }); }
    }
  });

  // Skaneri USB kur kursori s'është në asnjë fushë: skaneri "shkruan" shumë shpejt — kapet dhe dërgohet
  // te fusha e barkodit, që skanimi të mos humbasë edhe nëse përdoruesi ka klikuar diku tjetër.
  var skanBuf = '', skanKoha = 0, skanKohez = null;
  document.addEventListener('keydown', function (ev) {
    if (dialogISiperm() || poShkruan(ev.target) || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (!folderSipasId(pamja) && pamja !== 'afatet') return;
    var tani = performance.now();
    if (ev.key.length === 1 && /[0-9A-Za-z\-]/.test(ev.key)) {
      if (tani - skanKoha > 60) skanBuf = '';
      skanBuf += ev.key; skanKoha = tani;
      clearTimeout(skanKohez);
      skanKohez = setTimeout(function () { skanBuf = ''; }, 120);
    } else if (ev.key === 'Enter' && skanBuf.length >= 6 && tani - skanKoha < 80) {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      var b = skanBuf; skanBuf = '';
      if (pamja === 'afatet') { hapAfatinPc(null, b); return; }
      $('barkodi').value = b;
      $('barkodi').focus();
      $('barkodi').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    }
  }, true);


  // ================= Afatet e produkteve (datat e skadimit) =================
  var AF = window.StokuAfatet;
  var af = { filtri: 'aktive', kerkimi: '', grupo: false, muaji: '' };

  function ndryshoAfatet(fn) {
    var para = {};
    var sipas = {};
    afatet.forEach(function (a) { sipas[a.id] = a; });
    fshira.afatet = fshira.afatet || {};
    var api = {
      vendos: function (a) {
        if (!(a.id in para)) para[a.id] = sipas[a.id] ? kopje(sipas[a.id]) : null;
        a.ndryshuarSe = Date.now();
        var u = false;
        afatet = afatet.map(function (x) { if (x.id === a.id) { u = true; return a; } return x; });
        if (!u) afatet.push(a);
        sipas[a.id] = a;
        delete fshira.afatet[a.id];
      },
      fshij: function (id) {
        if (!sipas[id]) return;
        if (!(id in para)) para[id] = kopje(sipas[id]);
        afatet = afatet.filter(function (x) { return x.id !== id; });
        delete sipas[id];
        fshira.afatet[id] = Date.now();
      },
      merr: function (id) { return sipas[id] ? kopje(sipas[id]) : null; }
    };
    fn(api);
    ruaj();
    planifikoSinkronizimin(300); // afatet dërgohen në cloud menjëherë pas çdo ndryshimi
    return para;
  }
  function zhbejAfatet(para) {
    ndryshoAfatet(function (api) {
      Object.keys(para).forEach(function (id) { if (para[id]) api.vendos(para[id]); else api.fshij(id); });
    });
    toast('U zhbë.');
  }
  function afatSipasId(id) { for (var i = 0; i < afatet.length; i++) if (afatet[i].id === id) return afatet[i]; return null; }
  // ---- Kujtesa e produkteve (afatet.js, vetëm në këtë pajisje): barkodi → emri, furnizuesi ----
  function KJ() {
    var A = window.StokuAfatet, k = A && A.kujtesa ? A.kujtesa() : null;
    if (k && k.vendosAutorin) k.vendosAutorin(perdoruesi() ? emriPerdoruesit() : '', eshteAdminiIStokut()); // versioni i administratorit fiton
    return k;
  }
  function mesoNgaPerdoruesi(barkodi, emri, furnizuesi) { try { if (barkodi && KJ()) KJ().meso(barkodi, emri, furnizuesi); } catch (e) { /* ok */ } }
  // v214: furnizuesi i ri që e shkruan kushdo (edhe te një afat pa barkod) ruhet më vete dhe pret kontrollin te
  // Cilësimet → Stoku → Furnizuesit e rinj; s'zhduket kur fshihen produktet e tij. Vetëm kur ndryshon te afati: një afat i
  // vjetër s'e kthen një furnizues të fshirë.
  function regjistroFurnizuesinERi(f) {
    try { var k = KJ(); if (k && f && k.regjistroFurnizuesinERi) k.regjistroFurnizuesinERi(f); } catch (e) { /* ok */ }
  }
  // Në sfond (pa mbishkruar): nga afatet (më të rejat të parat), stoku dhe afatet e kolegëve të grupit
  var __kujtesaKohez = null;
  function planifikoMesimin() {
    clearTimeout(__kujtesaKohez);
    __kujtesaKohez = setTimeout(function () {
      try {
        var k = KJ(); if (!k) return;
        var l = afatet.slice().sort(function (a, b) { return (b.ndryshuarSe || 0) - (a.ndryshuarSe || 0); }).concat(teGjithaProduktet());
        if (typeof ekK !== 'undefined' && ekK && ekK.kaLidhje && ekK.kaLidhje() && ekK.anetaretMeAfate) {
          ekK.anetaretMeAfate().forEach(function (a) { if (!a.uneJam) l = l.concat(a.afatet || []); });
        }
        k.mesoShume(l, 'plotëso');
        ruajFurnizuesitEMiratuar();
      } catch (e) { /* ok */ }
    }, 1500);
  }
  planifikoMesimin(); // hapja: nga afatet dhe stoku që janë tashmë në pajisje
  function emriNgaBarkodi(b) {
    if (!b) return '';
    var m = KJ() && KJ().merr(b);
    if (m && m.emri) return m.emri;
    var h = hartaEBarkodeve()[b] || [];
    for (var i = 0; i < h.length; i++) if (h[i].emri) return h[i].emri;
    for (var j = 0; j < afatet.length; j++) if (afatet[j].barkodi === b && afatet[j].emri) return afatet[j].emri;
    return '';
  }
  function furnizuesiNgaBarkodi(b) {
    if (!b) return '';
    var m = KJ() && KJ().merr(b);
    if (m && m.furnizuesi) return m.furnizuesi;
    var te = afatet.filter(function (a) { return a.barkodi === b && a.furnizuesi; }).sort(function (x, y) { return (y.ndryshuarSe || 0) - (x.ndryshuarSe || 0); });
    return te.length ? te[0].furnizuesi : '';
  }
  function furnizuesit() {
    var m = {};
    afatet.forEach(function (a) { if (a.furnizuesi) m[a.furnizuesi] = true; });
    return Object.keys(m).sort(function (a, b) { return a.localeCompare(b, 'sq'); });
  }
  // v211: sugjerimet e furnizuesit për këdo: afatet e mia + furnizuesit e miratuar të grupit + lista e administratorit
  // (e lexon çdo përdorues i kyçur, edhe jashtë grupit). Shfletuesi i filtron sipas shkronjave që shtyp.
  function furnizuesitPerSugjerim() {
    var m = {};
    function shto(f) { f = String(f || '').replace(/\s+/g, ' ').trim(); var c = f.toLocaleLowerCase('sq'); if (f && !m[c]) m[c] = f; }
    afatet.forEach(function (a) { shto(a.furnizuesi); });
    try {
      var k = KJ();
      if (k) AF.listaEFurnizuesve([], produktet, k.lista(), k.furnizuesit()).forEach(function (f) { if (!f.nePritje) shto(f.emri); });
    } catch (e) { /* ok */ }
    try { var pub = JSON.parse(localStorage.getItem('stoku:furnizuesit:publike') || '[]'); if (Array.isArray(pub)) pub.forEach(shto); } catch (e) { /* ok */ }
    try { if (typeof ekK !== 'undefined' && ekK && ekK.lexoFurnizuesitPublike) ekK.lexoFurnizuesitPublike(); } catch (e) { /* ok */ }
    return Object.keys(m).map(function (c) { return m[c]; }).sort(function (a, b) { return a.localeCompare(b, 'sq'); });
  }

  function renderAfatetAnesore() {
    var n = AF.numero(afatetEMarketit());
    $('afTabKuqe').textContent = (n.skaduar + n['pa-date']) ? String(n.skaduar + n['pa-date']) : '';
    $('afTabVerdhe').textContent = n.afer ? String(n.afer) : '';
    $('afTabKuqe').title = 'Të skaduara: duhet të hiqen nga rafti';
    $('afTabVerdhe').title = 'Skadojnë brenda 30 ditëve';
    rifreskoPllakat();
    var neAfate = pamja === 'afatet';
    $('navAfatet').classList.toggle('aktiv', neAfate && af.filtri !== 'skaduar' && af.filtri !== 'afer');
    $('navAfSkaduara').classList.toggle('aktiv', neAfate && af.filtri === 'skaduar');
    $('navAfAfer').classList.toggle('aktiv', neAfate && af.filtri === 'afer');
  }


  // ================= Marketet (v241, marketet.js) =================
  // Lista = marketet e Stoku-t (v250, nga pikat; shtohen te telefoni); këtu: zgjedhja e marketit te Afatet, marketi i afatit dhe
  // filtrimi. Pa asnjë market s'shihet asgjë e re. Kompjuteri s'e përdor GPS-in: marketi zgjidhet me dorë.
  function kaMarkete() { return marketet.length > 0 && eshteMerchandiser(); }
  function idMarketitAktiv() { var id = marketiAktiv.id; return kaMarkete() && id && MK.sipasId(marketet, id) ? id : null; }
  function afatetEMarketit() { return MK.filtro(afatet, idMarketitAktiv()); }
  function emriMarketit(id) { return MK.emri(marketet, id); }
  function vizatoZgjedhjenEMarketit() {
    var ka = kaMarkete();
    $('afMarketiPcKuti').hidden = !ka;
    if (!ka) return;
    var s = $('afMarketiPc'); s.textContent = '';
    var o0 = el('option', null, 'Krejt marketet'); o0.value = ''; s.appendChild(o0);
    MK.rendit(marketet).forEach(function (m) { var o = el('option', null, m.emri); o.value = m.id; s.appendChild(o); });
    s.value = idMarketitAktiv() || '';
  }
  $('afMarketiPc').addEventListener('change', function () {
    marketiAktiv = MK.ruajAktivin({ id: $('afMarketiPc').value || null, menyra: 'dore', koha: Date.now(), kontrolluarSe: marketiAktiv.kontrolluarSe || 0 });
    rivizato();
  });
  // Afatet e reja (importi, fleta): te marketi i zgjedhur; me "Krejt marketet" pyetet (kthen undefined = mos ruaj)
  function marketiPerTeReja() {
    if (!kaMarkete()) return null;
    var id = idMarketitAktiv();
    if (id) return id;
    toast('Zgjidh marketin te Afatet (lart, te "Marketi") para se t\'i ruash këto afate.', { ms: 6000 });
    return undefined;
  }

  // v241: administratori i sheh afatet e një llogarie, sipas marketeve (vetëm lexim; dyqani lexohet nga Firebase)
  var pdAf = { uid: null, emri: '', rez: null };
  async function pdHapAfatet(a) {
    pdAf = { uid: a.uid, emri: a.emri, rez: null };
    $('pdafTitulli').textContent = 'Afatet e ' + a.emri;
    $('pdafHequrat').checked = false;
    pdafVizato();
    hapDialog('dlgPdAfatet');
    var cl = window.__stokuCloud;
    var r = cl && cl.merrDyqaninEPerdoruesit ? await cl.merrDyqaninEPerdoruesit(a.uid) : null;
    if (pdAf.uid !== a.uid) return;
    pdAf.rez = r && r.ok ? { afatet: (r.gjendja && r.gjendja.afatet) || [], marketet: (r.gjendja && r.gjendja.marketet) || [] } : { gabim: true };
    pdafVizato();
  }
  function pdafVizato() {
    var c = $('pdafLista'); c.textContent = '';
    if (!pdAf.rez) { $('pdafInfo').textContent = 'Duke i marrë afatet…'; $('pdafHequrat').parentNode.hidden = true; return; }
    if (pdAf.rez.gabim) { $('pdafInfo').textContent = 'Afatet s\'u morën. Kontrollo internetin dhe provo sërish.'; $('pdafHequrat').parentNode.hidden = true; return; }
    var teGjitha = pdAf.rez.afatet.filter(function (x) { return x && x.id; });
    var me = $('pdafHequrat').checked;
    var nH = teGjitha.filter(function (x) { return x.statusi === 'hequr'; }).length;
    var n = AF.numero(teGjitha);
    $('pdafInfo').textContent = (n.aktive === 1 ? '1 afat aktiv' : n.aktive + ' afate aktive') + (n.skaduar ? ' · ' + n.skaduar + ' të skaduara' : '') +
      (n.afer ? ' · ' + n.afer + ' afër skadimit' : '') + (pdAf.rez.marketet.length ? ' · ' + pdAf.rez.marketet.length + (pdAf.rez.marketet.length === 1 ? ' market' : ' markete') : '') + '.';
    $('pdafHequrat').parentNode.hidden = !nH;
    var lista = teGjitha.filter(function (x) { return me || x.statusi !== 'hequr'; }).sort(AF.krahaso);
    if (!lista.length) { c.appendChild(el('p', 'pd-info-rresht', 'S\'ka afate.')); return; }
    MK.grupo(lista, pdAf.rez.marketet).forEach(function (gr) {
      c.appendChild(el('div', 'pdaf-grupi', gr.emri + ' · ' + gr.afatet.length));
      var t = el('table', 'tabela'), tb = el('tbody');
      gr.afatet.forEach(function (a) {
        var st = AF.statusi(a);
        var tr = el('tr', st);
        var t0 = el('td', 'k-st'); t0.appendChild(el('span', 'af-status ' + st, ST_EMRI[st])); tr.appendChild(t0);
        var t1 = el('td', 'af-prod'); t1.appendChild(el('div', null, a.emri || '(pa emër)'));
        t1.appendChild(el('div', 'af-prod-nen', [a.furnizuesi, a.barkodi, a.krijuarNga ? 'nga ' + a.krijuarNga : ''].filter(Boolean).join(' · ')));
        tr.appendChild(t1);
        tr.appendChild(el('td', 'k-sas', typeof a.sasia === 'number' ? num(a.sasia) : '–'));
        tr.appendChild(el('td', 'k-data', a.data ? AF.formato(a.data) : '–'));
        tr.appendChild(qelizaEDiteve(a));
        tb.appendChild(tr);
      });
      t.appendChild(tb); c.appendChild(t);
    });
  }
  $('pdafHequrat').addEventListener('change', pdafVizato);

  // paMuaj: pa filtrin e muajit (për numrat e butonave të muajve); muaji: muaj tjetër nga ai i zgjedhur (eksporti)
  function filtroAfatet(paMuaj, muaji) {
    var fjalet = normalizo(af.kerkimi).split(/\s+/).filter(Boolean);
    var mu = muaji !== undefined ? muaji : (paMuaj ? '' : af.muaji);
    return afatetEMarketit().filter(function (a) {
      if (mu && AF.celesiMuajit(a) !== mu) return false;
      var st = AF.statusi(a);
      if (af.filtri === 'aktive' && st === 'hequr') return false;
      if (af.filtri === 'skaduar' && st !== 'skaduar' && st !== 'pa-date') return false;
      if (af.filtri === 'afer' && st !== 'afer') return false;
      if (af.filtri === 'ok' && st !== 'ok') return false;
      if (af.filtri === 'hequr' && st !== 'hequr') return false;
      if (fjalet.length) {
        var t = normalizo((a.emri || '') + ' ' + (a.barkodi || '') + ' ' + (a.furnizuesi || ''));
        if (!fjalet.every(function (f) { return t.indexOf(f) !== -1; })) return false;
      }
      return true;
    }).sort(AF.krahaso);
  }

  // Qeliza "Ditët e mbetura": numri i theksuar me fontin e numrave
  function qelizaEDiteve(a) {
    var d = AF.ditetEMbetura(a), td = el('td', 'k-msg k-ditet');
    if (d.para) td.appendChild(el('span', d.nr ? 'k-ditet-mbi' : null, d.para + ' '));
    if (d.nr) td.appendChild(el('b', null, d.nr));
    if (d.pas) td.appendChild(el('span', null, ' ' + d.pas));
    return td;
  }
  var ST_EMRI = { skaduar: 'Ka skaduar', 'pa-date': 'Pa datë', afer: 'Afër skadimit', ok: 'Në rregull', hequr: 'I hequr' };

  // ---------- Grupi (PC): afatet e grupit, aktiviteti, kalendari, kolegët, statistikat ----------
  // Logjika e përbashkët (Firestore, prania, kalendari, statistikat) është te ekipa.js; këtu vetëm vizatimi,
  // me pjesët e PC-së (kpi, segmente, tabela, karta, shiritat e Përmbledhjes). Vetëm afatet — jo stoku.
  var EKL = window.StokuEkipa;
  var EK_NENET = ['pulti', 'afatet', 'aktiviteti', 'kalendari', 'anetaret', 'statistika', 'stoku'];
  var EK_PAMJET = { pulti: 'ekVPulti', afatet: 'ekVAfatet', aktiviteti: 'ekVAktiviteti', kalendari: 'ekVKalendari', anetaret: 'ekVAnetaret', statistika: 'ekVStatistika', stoku: 'ekVStoku' };
  var EK_TITUJT = { pulti: 'Përmbledhja', afatet: 'Afatet e grupit', aktiviteti: 'Aktiviteti', kalendari: 'Kalendari', anetaret: 'Kolegët', statistika: 'Statistika', stoku: 'Stoku i kolegëve' };
  var ekNen = 'pulti';
  var ekV = { anetari: 'krejt', filtri: '', kerkimi: '', kal: null };
  var EK_LIMITI = 500;
  var ekDukeHapur = false;
  // Administratori e fshiu këtë llogari: hiqen krejt të dhënat lokale, fshihet llogaria e Firebase-it (emri lirohet)
  // dhe faqja rinis te hyrja me mesazh. Rregullat ia kanë mbyllur tashmë çdo qasje në cloud.
  var __llogariaUFshi = false;
  function llogariaUFshiNgaAdmini() {
    if (__llogariaUFshi) return;
    __llogariaUFshi = true;
    var c = window.__stokuCloud, ek = c && c.ekipa;
    // Së pari njoftimi ditor i kësaj llogarie hiqet nga serveri (përndryshe pajisja i merrte ende çdo ditë); ai lexon orarin
    // e ruajtur këtu, prandaj shënimet lokale fshihen pas tij ("stoku:orari:pastro" mbetet, nëse serveri s'u arrit)
    Promise.resolve(ek && ek.caktivizoPush ? ek.caktivizoPush() : null).catch(function () { /* ok */ }).then(function () {
      try { Object.keys(localStorage).filter(function (k) { return k.indexOf('stoku:') === 0 && k !== 'stoku:orari:pastro'; }).forEach(function (k) { localStorage.removeItem(k); }); } catch (e) { /* ok */ }
      try { localStorage.setItem('stoku:porta:mesazh', 'Kjo llogari u fshi nga administratori.'); } catch (e) { /* ok */ }
      return c && c.fshiVeten ? c.fshiVeten() : null;
    }).catch(function () { /* ok */ }).then(function () { location.reload(); });
  }
  var ekK = EKL ? EKL.krijoKontrollues({
    cloud: function () { return window.__stokuCloud; },
    llogariaUFshi: llogariaUFshiNgaAdmini,
    uidIm: function () { var u = perdoruesi(); return u ? u.uid : null; },
    emriIm: emriPerdoruesit,
    afatetEMia: function () { return afatet; },
    zbatoHeqjet: ekZbatoHeqjet,
    njofto: ekNjofto,
    ndryshoi: ekKurNdryshon
  }) : null;
  window.__stokuEkipaK = ekK; // për testet

  function ekShkoTe(nen) {
    if (EK_NENET.indexOf(nen) === -1) nen = 'pulti';
    ekNen = nen;
    shkoTe('ekipi');
  }
  function ekNumero(lista) {
    var n = { aktive: 0, skaduar: 0, afer: 0, ok: 0, hequr: 0 };
    lista.forEach(function (a) {
      var s = AF.statusi(a);
      if (s === 'hequr') { n.hequr++; return; }
      n.aktive++;
      if (s === 'skaduar' || s === 'pa-date') n.skaduar++; else if (s === 'afer') n.afer++; else if (s === 'ok') n.ok++;
    });
    return n;
  }
  function ekAvatar(a, meOnline) {
    var av = el('span', 'ek-avatar' + (meOnline && (a.uneJam || EKL.eshteOnline(a)) ? ' online' : ''), String(a.emri || '?').charAt(0).toUpperCase());
    return EKL.Fotot.apliko(av, { uid: a.uid, emri: a.emri });
  }
  function ekOra(ts) { var d = new Date(ts); return (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes(); }
  function ekTeGjitha(anetaret) { var l = []; anetaret.forEach(function (a) { l = l.concat(a.afatet); }); return l; }
  function ekOnline(anetaret) { return anetaret.filter(function (a) { return a.uneJam || EKL.eshteOnline(a); }).length; }

  function renderEkipiPc() {
    if (ekK) {
      ekDukeHapur = true;
      try {
        if (!ekK.gj.hapur && ekK.kaLidhje()) ekK.hap();
      } finally { ekDukeHapur = false; }
    }
    ekVizato();
  }
  function ekKurNdryshon(cfare) {
    if (cfare === 'kujtesa') { // produktet e grupit u ndryshuan (nga një koleg): vetëm lista te Cilësimet → Stoku, nëse është hapur
      if (kujNeEditim === null && $('opsKujSeksion').offsetParent) rifreskoKujtesen(); else rifreskoNenStokut();
      if (furnNeEditim === null && $('opsFurnSeksion').offsetParent) rifreskoFurnizuesit();
      return;
    }
    ekShenjat();
    if (cfare === 'dyqanet' || cfare === 'te-gjitha') planifikoMesimin(); // kujtesa nga afatet e kolegëve
    if (ekDukeHapur || pamja !== 'ekipi') return;
    if (cfare === 'njoftimet') return;
    ekVizato();
  }
  function ekShenjat() {
    // Pa grup: s'ka kolegë as afate të grupit, mbetet vetëm Përmbledhja (me "Krijo grupin tënd" dhe ftesat)
    var paGrup = !!(ekK && ekK.kaLidhje() && /^pa-(grup|rregulla)$/.test(ekK.gjendjaEQasjes()));
    ['navEkipi', 'navEkAktiviteti', 'navEkKalendari', 'navEkAnetaret', 'navEkStatistika', 'ekKerkoHeqje'].forEach(function (id) { $(id).hidden = paGrup; });
    var n = ekK ? ekK.numriNjoftimeve() : 0;
    $('ekZileNr').textContent = n ? String(n) : '';
    var kr = ekK ? ekK.numriKerkesave() : 0; // ftesat për në një grup + v242: kërkesat për grupin tim (admini i grupit)
    var nFt = ekK ? ekK.ftesatEMia().length : 0;
    $('ekAkordShenja').textContent = (n + kr) ? String(n + kr) : '';
    if (kr) $('ekNavOnline').textContent = nFt ? (nFt === 1 ? '1 ftesë' : nFt + ' ftesa') : (kr === 1 ? '1 kërkesë' : kr + ' kërkesa');
    else if (ekK && ekK.gj.anetaret.length && ekK.gjendjaEQasjes() === 'ok') {
      var a = ekK.anetaretMeAfate();
      $('ekNavOnline').textContent = ekOnline(a) + '/' + a.length;
    } else $('ekNavOnline').textContent = '';
    $('ekNavOnline').classList.toggle('kuqe', !!kr);
    rifreskoPllakat();
  }

  function ekVizato() {
    Array.prototype.forEach.call(document.querySelectorAll('#ekMenu button'), function (b) { b.classList.toggle('aktiv', b.dataset.n === ekNen); });
    $('ekSegStoku').hidden = true; // Stoku te Grupi u hoq (v183)
    if (ekNen === 'stoku') ekNen = 'pulti';
    var lidhur = !!(ekK && ekK.kaLidhje());
    var qasja = lidhur ? ekK.gjendjaEQasjes() : '';
    $('ekPaLidhje').classList.toggle('fsheh', lidhur && (qasja === 'ok' || qasja === 'pa-grup'));
    $('ekPaGrup').classList.toggle('fsheh', !(lidhur && qasja === 'pa-grup'));
    if (lidhur && qasja === 'pa-grup') ekVPaGrup();
    if (!lidhur) $('ekPaLidhjeTekst').textContent = ngaVizitori() ? 'Grupi punon me llogari: me kolegët ndani afatet dhe aktivitetin. Si vizitor provon Stoku-n dhe Afatet; hyr ose krijo llogari (poshtë majtas) që ta shohësh grupin.' :
      !window.__stokuCloud ? 'Grupi kërkon lidhje me internetin.' : 'Hyr me llogarinë tënde (poshtë majtas) që ta shohësh grupin.';
    else if (qasja === 'pa-rregulla') $('ekPaLidhjeTekst').textContent = 'Grupi s\'është gati ende: administratori duhet t\'i vendosë rregullat e reja të Firebase-it (Firestore → Rules). Stoku dhe afatet e tua punojnë si zakonisht.';
    else if (qasja !== 'ok') $('ekPaLidhjeTekst').textContent = 'Duke u lidhur me grupin…';
    $('ekMenu').classList.toggle('fsheh', !!lidhur && qasja !== 'ok');
    if (lidhur && qasja !== 'ok') lidhur = false;
    EK_NENET.forEach(function (n) { $(EK_PAMJET[n]).classList.toggle('fsheh', !lidhur || n !== ekNen); });
    document.title = 'Grupi • ' + EK_TITUJT[ekNen] + ' • Stoku';
    if (!lidhur) { $('ekNen').textContent = ''; return; }
    var anetaret = ekK.anetaretMeAfate();
    var gI = ekK.grupiInfo();
    $('ekNen').textContent = (gI && gI.emri ? gI.emri + ' · ' : '') + anetaret.length + (anetaret.length === 1 ? ' koleg' : ' kolegë') + ' · ' + ekOnline(anetaret) + ' online · vetëm afatet, secili ndryshon vetëm të vetat';
    if (ekNen === 'aktiviteti') ekVAktiviteti(anetaret);
    else if (ekNen === 'kalendari') ekVKalendari(anetaret);
    else if (ekNen === 'anetaret') ekVAnetaret(anetaret);
    else if (ekNen === 'statistika') ekVStatistika(anetaret);
    else if (ekNen === 'stoku') ekVStoku(anetaret);
    else if (ekNen === 'pulti') ekVPulti(anetaret);
    else ekVAfatet(anetaret);
  }

  // ---- Përmbledhja (faqja kryesore e Grupit, dizajni "Pulti") ----
  function ekVPulti(anetaret) {
    var te = ekTeGjitha(anetaret), n = ekNumero(te), gati = ekK.eGatshme();
    var d = new Date();
    var DITET = ['E diel', 'E hënë', 'E martë', 'E mërkurë', 'E enjte', 'E premte', 'E shtunë'];
    var MUAJT = ['janar', 'shkurt', 'mars', 'prill', 'maj', 'qershor', 'korrik', 'gusht', 'shtator', 'tetor', 'nëntor', 'dhjetor'];
    $('ekNen').textContent = DITET[d.getDay()] + ', ' + d.getDate() + ' ' + MUAJT[d.getMonth()] + ' · ' + anetaret.length + (anetaret.length === 1 ? ' koleg' : ' kolegë') + ' · ' + (gati ? nrEmer(n.aktive, 'afat', 'afate') + ' në raft' : 'duke ngarkuar…');
    function afatet(filtri) { return function () { ekV.anetari = 'krejt'; ekV.filtri = filtri; ekShkoTe('afatet'); }; }
    // Ftesa për në një grup tjetër
    var ft = ekK.ftesatEMia(), kgP = ekK.kerkesatEGrupit();
    $('ekPultKerkesat').classList.toggle('fsheh', !ft.length && !kgP.length);
    if (ft.length) {
      $('ekPultKerkTitulli').textContent = 'Ftesë: grupi "' + (ft[0].grupiEmri || '') + '"' + (ft.length > 1 ? ' (+' + (ft.length - 1) + ' të tjera)' : '');
      $('ekPultKerkEmrat').textContent = (ft[0].ngaEmri || 'Dikush') + ' të fton në këtë grup.';
      $('ekPultKerkPrano').textContent = '✓ Prano';
      $('ekPultKerkPrano').disabled = false;
      $('ekPultKerkPrano').onclick = function () { ekPranoFtesen(ft[0], $('ekPultKerkPrano')); };
      $('ekPultKerkShiko').onclick = function () { ekShkoTe('anetaret'); };
    } else if (kgP.length) { // v242: kërkesat për t'u futur në grupin tim
      $('ekPultKerkTitulli').textContent = kgP.length === 1 ? (kgP[0].emri || 'Dikush') + ' kërkon të hyjë në grup' : kgP.length + ' kërkesa për t\'u futur në grup';
      $('ekPultKerkEmrat').textContent = kgP.length === 1 ? 'Prano ose refuzo te Kolegët.' : kgP.map(function (k) { return k.emri; }).join(', ') + '.';
      $('ekPultKerkPrano').textContent = '✓ Prano';
      $('ekPultKerkPrano').disabled = false;
      $('ekPultKerkPrano').onclick = function () { ekPranoKerkesen(kgP[0], $('ekPultKerkPrano')); };
      $('ekPultKerkShiko').onclick = function () { ekShkoTe('anetaret'); };
    }
    var r = $('ekPultKpi');
    r.textContent = '';
    r.appendChild(kpi('Të skaduara', gati ? num(n.skaduar) : '…', 'duhen hequr nga rafti', n.skaduar ? 'kritik' : null, IKONA.zero, afatet('skaduar')));
    r.appendChild(kpi('Afër skadimit', gati ? num(n.afer) : '…', 'brenda 30 ditëve', n.afer ? 'paralajm' : null, IKONA.pak, afatet('afer')));
    r.appendChild(kpi('Në rregull', gati ? num(n.ok) : '…', 'krejt grupi', null, null, afatet('ok')));
    var onl = anetaret.filter(function (a) { return a.uneJam || EKL.eshteOnline(a); });
    r.appendChild(kpi('Online tani', onl.length + '/' + anetaret.length, onl.map(function (a) { return a.emri; }).join(', ') || 'askush', null, null, function () { ekShkoTe('anetaret'); }));
    // Duhet vepruar: të skaduarat + ato që skadojnë brenda 7 ditëve
    var koka = $('ekPultKoka'), trup = $('ekPultTrup'), bosh = $('ekPultBosh');
    koka.textContent = ''; trup.textContent = '';
    var tr0 = el('tr');
    [['Statusi', 'k-st'], ['Produkti · Furnizuesi', ''], ['Sasia', 'k-sas'], ['Skadon më', 'k-data'], ['Kolegu', 'k-pronari'], ['', 'k-av']].forEach(function (x) { tr0.appendChild(el('th', x[1] || null, x[0])); });
    koka.appendChild(tr0);
    var lista = te.filter(function (a) {
      var st = AF.statusi(a);
      if (st === 'skaduar') return true;
      if (st !== 'afer') return false;
      var dd = AF.ditetDeri(a.data); return dd !== null && dd <= 7;
    }).sort(AF.krahaso);
    if (!gati) { bosh.textContent = 'Duke ngarkuar afatet e grupit…'; bosh.classList.remove('fsheh'); return ekPultAnetaret(anetaret); }
    if (!lista.length) { bosh.textContent = 'Asgjë për të bërë: asnjë produkt i skaduar dhe asgjë s\'skadon këtë javë.'; bosh.classList.remove('fsheh'); }
    else bosh.classList.add('fsheh');
    var frag = document.createDocumentFragment();
    lista.slice(0, 15).forEach(function (x) { frag.appendChild(ekRreshtAfati(x, true, true)); });
    trup.appendChild(frag);
    if (lista.length > 15) { bosh.textContent = '… dhe ' + (lista.length - 16 ? (lista.length - 15) + ' të tjera' : '1 tjetër') + '. Shiko "Krejt afatet e grupit" për listën e plotë.'; bosh.classList.remove('fsheh'); }
    ekPultAnetaret(anetaret);
  }
  // Prania si ikonë: telefon/kompjuter me pikë të gjelbër kur është online; ikonë "jashtë linje" + koha kur s'është
  function ekPraniaEl(a) {
    var pr = EKL.praniaIkone(a, a.uneJam, 'pc');
    var x = el('span', 'ek-prania ' + (pr.online ? 'on' : 'off'));
    x.innerHTML = pr.html; x.title = pr.titulli; x.setAttribute('aria-label', pr.titulli);
    return x;
  }
  function ekPultAnetaret(anetaret) {
    var c = $('ekPultAnetaret');
    c.textContent = '';
    $('ekPultAnTitulli').textContent = 'Kolegët · ' + anetaret.length;
    anetaret.forEach(function (a) {
      var nn = ekNumero(a.afatet);
      var b = el('button', 'ek-pult-an'); b.type = 'button';
      b.appendChild(ekAvatar(a, true));
      var m = el('div');
      var em = el('div', 'ek-pult-an-emri', a.emri);
      m.appendChild(em);
      var nen = el('div', 'ek-pult-an-nen'); nen.appendChild(ekPraniaEl(a)); m.appendChild(nen);
      b.appendChild(m);
      b.appendChild(el('div', 'ek-pult-an-nr' + (nn.skaduar ? ' kuqe' : ''), !a.ngarkuar ? '…' : a.paTeDhena ? 'pa të dhëna' : nn.skaduar ? nn.skaduar + (nn.skaduar === 1 ? ' i skaduar' : ' të skaduara') : nn.aktive + ' në raft'));
      b.addEventListener('click', function () { ekV.anetari = a.uid; ekV.filtri = ''; ekShkoTe('afatet'); });
      c.appendChild(b);
    });
  }
  $('ekPultKrejt').addEventListener('click', function () { ekV.anetari = 'krejt'; ekV.filtri = ''; ekShkoTe('afatet'); });

  // ---- Afatet: një kartë për koleg, pastaj tabela ----
  function ekVAfatet(anetaret) {
    var krejt = { uid: 'krejt', emri: 'Krejt grupi', afatet: ekTeGjitha(anetaret), ngarkuar: ekK.eGatshme() };
    var r = $('ekAnetaret');
    r.textContent = '';
    [krejt].concat(anetaret).forEach(function (x) {
      var n = ekNumero(x.afatet);
      var k = kpi(x.emri, !x.ngarkuar ? '…' : x.paTeDhena ? '–' : num(n.aktive), x.paTeDhena ? 'pa të dhëna ende' : 'në raft', null, null, function () { ekV.anetari = x.uid; ekV.filtri = ''; ekVizato(); });
      k.classList.add('ek-anetar');
      if (ekV.anetari === x.uid) k.classList.add('zgjedhur');
      var et = k.querySelector('.kpi-etik');
      if (x.uid !== 'krejt' && (x.uneJam || EKL.eshteOnline(x))) { var pk = el('span', 'ek-online'); pk.title = 'Online tani'; et.insertBefore(pk, et.firstChild); }
      var nen = k.querySelector('.kpi-nen');
      if (!x.ngarkuar) nen.textContent = 'duke ngarkuar…';
      if (n.skaduar) { nen.appendChild(document.createTextNode(' · ')); nen.appendChild(el('span', 'ek-kuqe', n.skaduar === 1 ? '1 i skaduar' : n.skaduar + ' të skaduara')); }
      if (n.afer) nen.appendChild(document.createTextNode(' · ' + n.afer + ' afër skadimit'));
      k.title = x.uid === 'krejt' ? 'Shiko krejt grupin bashkë' : 'Shiko vetëm ' + x.emri + (x.uneJam ? '' : ' · ' + EKL.tekstiPranise(x));
      r.appendChild(k);
    });
    var zgj = ekV.anetari === 'krejt' ? krejt : anetaret.filter(function (a) { return a.uid === ekV.anetari; })[0];
    if (!zgj) { ekV.anetari = 'krejt'; zgj = krejt; }
    var n = ekNumero(zgj.afatet);
    $('ekNumRaft').textContent = num(n.aktive); $('ekNumSkaduar').textContent = num(n.skaduar); $('ekNumAfer').textContent = num(n.afer);
    $('ekNumOk').textContent = num(n.ok); $('ekNumHequr').textContent = num(n.hequr);
    Array.prototype.forEach.call(document.querySelectorAll('#ekFiltrat button'), function (b) { b.classList.toggle('aktiv', (b.dataset.f || '') === ekV.filtri); });
    ekTabelaEAfateve(zgj);
  }
  function ekFiltroAfatet(lista) {
    var k = normalizo(ekV.kerkimi.trim());
    var te = lista.filter(function (a) {
      var st = AF.statusi(a);
      if (ekV.filtri === 'hequr') { if (st !== 'hequr') return false; }
      else if (st === 'hequr') return false;
      else if (ekV.filtri === 'skaduar' && st !== 'skaduar' && st !== 'pa-date') return false;
      else if (ekV.filtri === 'afer' && st !== 'afer') return false;
      else if (ekV.filtri === 'ok' && st !== 'ok') return false;
      if (k && normalizo((a.emri || '') + ' ' + (a.barkodi || '') + ' ' + (a.furnizuesi || '') + ' ' + (a.pronariEmri || '')).indexOf(k) === -1) return false;
      return true;
    });
    if (ekV.filtri === 'hequr') te.sort(function (x, y) { return (y.hequrSe || 0) - (x.hequrSe || 0); }); else te.sort(AF.krahaso);
    return te;
  }
  function ekTabelaEAfateve(zgj) {
    var meEmer = zgj.uid === 'krejt';
    var koka = $('ekKoka'), trup = $('ekTrup');
    koka.textContent = ''; trup.textContent = '';
    var tr0 = el('tr');
    [['Statusi', 'k-st'], ['Produkti · Furnizuesi', ''], ['Sasia', 'k-sas'], ['Skadon më', 'k-data'], ['Ditët e mbetura', 'k-msg']].forEach(function (x) { tr0.appendChild(el('th', x[1] || null, x[0])); });
    if (meEmer) tr0.appendChild(el('th', 'k-pronari', 'Përdoruesi'));
    tr0.appendChild(el('th', 'k-av'));
    koka.appendChild(tr0);
    var lista = ekFiltroAfatet(zgj.afatet);
    var bosh = $('ekBosh');
    if (zgj.paTeDhena) {
      bosh.textContent = 'Afatet e ' + zgj.emri + ' shfaqen këtu sapo ta hapë Stoku-n (versionin e ri) në telefon ose kompjuter.';
      bosh.classList.remove('fsheh');
      return;
    }
    if (!lista.length) {
      bosh.textContent = ekV.kerkimi.trim() ? 'Asgjë s\'u gjet për "' + ekV.kerkimi.trim() + '".' :
        ekV.filtri === 'skaduar' ? 'Asnjë produkt i skaduar. Shumë mirë!' : ekV.filtri === 'hequr' ? 'Asnjë produkt i hequr ende.' : 'S\'ka afate.';
      bosh.classList.remove('fsheh');
      return;
    }
    bosh.classList.add('fsheh');
    var frag = document.createDocumentFragment();
    lista.slice(0, EK_LIMITI).forEach(function (x) { frag.appendChild(ekRreshtAfati(x, meEmer)); });
    trup.appendChild(frag);
    if (lista.length > EK_LIMITI) { bosh.textContent = 'Shfaqen ' + num(EK_LIMITI) + ' nga ' + num(lista.length) + '. Kërko për t\'i gjetur të tjerat.'; bosh.classList.remove('fsheh'); }
  }
  // pult: rreshti i shkurtër i Përmbledhjes (pa tekstin e veprimit dhe pa butonat e administratorit)
  function ekRreshtAfati(x, meEmer, pult) {
    var st = AF.statusi(x), n = AF.ditetDeri(x.data);
    var tr = el('tr'); tr.className = st;
    var t0 = el('td', 'k-st'); t0.appendChild(el('span', 'af-status ' + st, ST_EMRI[st])); tr.appendChild(t0);
    var t1 = el('td', 'af-prod');
    t1.appendChild(el('div', null, x.emri || '(pa emër)'));
    t1.appendChild(el('div', 'mono', [x.barkodi, x.furnizuesi].filter(Boolean).join(' · ') || '–'));
    tr.appendChild(t1);
    tr.appendChild(el('td', 'k-sas', typeof x.sasia === 'number' ? num(x.sasia) : '–'));
    var td = el('td', 'k-data', x.data ? AF.formato(x.data) : '–');
    // Te Pulti s'ka kolonë "Ditët e mbetura": ditët mbeten nën datë
    if (pult && n !== null && st !== 'hequr') td.appendChild(el('small', null, n < 0 ? 'para ' + AF.ditetParaTekst(-n) : n === 0 ? 'sot' : 'për ' + AF.ditetTekst(n)));
    tr.appendChild(td);
    if (!pult) {
      if (st === 'hequr') tr.appendChild(el('td', 'k-msg', 'U hoq' + (x.hequrNga ? ' nga ' + x.hequrNga : '') + (x.hequrSe ? ' · ' + EKL.kohaRelative(x.hequrSe) : '')));
      else if (x.nePritjeNga) tr.appendChild(el('td', 'k-msg', ekTekstiNePritje(x)));
      else tr.appendChild(qelizaEDiteve(x));
    }
    if (meEmer) tr.appendChild(el('td', 'k-pronari', x.pronariEmri || ''));
    var tv = el('td', 'k-av');
    if (st === 'skaduar' && x.nePritjeNga) { var sp = el('span', 'ek-pritje', 'Në pritje'); sp.title = ekTekstiNePritje(x); tv.appendChild(sp); }
    else if (st === 'skaduar' && ekLejohetHeqja(x)) {
      var b = el('button', 'btn af-btn kuqe', '✓ Unë e hoqa'); b.type = 'button';
      b.title = 'Shëno që e hoqe ti nga rafti' + (x.pronariUid && perdoruesi() && x.pronariUid !== perdoruesi().uid ? ' (' + (x.pronariEmri || 'kolegu') + ' njoftohet)' : '');
      b.addEventListener('click', function (ev) { ev.stopPropagation(); ekHeq(x, b); });
      tv.appendChild(b);
    }
    var uIm = perdoruesi();
    if (!pult && ekK && ekK.eshteAdmin() && x.pronariUid && uIm && x.pronariUid !== uIm.uid) {
      if (st === 'hequr') tv.appendChild(ekBtnAdmin('Ktheje', x, 'kthe'));
      else if (st !== 'skaduar') tv.appendChild(ekBtnAdmin('Hiqe', x, 'hiq'));
      tv.appendChild(ekBtnAdmin('Fshije', x, 'fshij'));
    }
    tr.appendChild(tv);
    return tr;
  }
  // Administratori: ndryshon direkt afatin e një kolegu (pronari njoftohet)
  function ekBtnAdmin(tekst, a, veprimi) {
    var b = el('button', 'btn af-btn ' + (veprimi === 'fshij' ? 'tekst rrezik' : 'dyte'), tekst); b.type = 'button';
    b.title = 'Administratori: ' + tekst.toLowerCase() + ' afatin e ' + (a.pronariEmri || 'kolegut') + ' (njoftohet)';
    b.addEventListener('click', function (ev) { ev.stopPropagation(); ekAdminAfat(a, veprimi, b); });
    return b;
  }
  async function ekAdminAfat(a, veprimi, btn) {
    var emri = a.emri || a.barkodi || 'produkti';
    var tx = { hiq: ['Të shënohet si i hequr?', 'shënohet si i hequr nga rafti', 'Po, hiqe'],
      kthe: ['Të kthehet në raft?', 'kthehet si aktiv në raft', 'Po, ktheje'], fshij: ['Të fshihet afati?', 'fshihet krejt', 'Fshije'] }[veprimi];
    var po = await konfirmo(tx[0], '"' + emri + '" (i përket: ' + (a.pronariEmri || 'kolegut') + ') ' + tx[1] + '. ' + (a.pronariEmri || 'Kolegu') + ' njoftohet.', tx[2]);
    if (!po) return;
    if (btn) btn.disabled = true;
    var r = await ekK.adminNdryshoAfatin(a, veprimi);
    if (!r.ok) { if (btn) btn.disabled = false; toast(r.arsye === 'nuk-u-gjet' ? 'Ky afat s\'ekziston më.' : 'S\'u ndryshua. Kontrollo internetin dhe provo përsëri.'); return; }
    toast('"' + emri + '" u ' + (veprimi === 'fshij' ? 'fshi' : veprimi === 'kthe' ? 'kthye në raft' : 'shënua si i hequr') + '. ' + (a.pronariEmri || 'Kolegu') + ' u njoftua.');
  }
  // Heqja e kolegut pret miratimin e pronarit (v179)
  // Rolet si ikona të vogla (prekja tregon çka janë): kurora = pronari i grupit, mburoja = administratori
  var EK_ROLET = {
    pronar: ['Admin i Grupit', '<path d="M3 7l4 4 5-6 5 6 4-4-2 11H5L3 7z"></path><path d="M5 21h14"></path>'],
    admin: ['Administrator', '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path>']
  };
  function ekIkonaRoli(roli, krijo, njofto) {
    var r = EK_ROLET[roli];
    var s = krijo('span', 'ek-roli ' + roli);
    s.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + r[1] + '</svg>';
    s.title = r[0]; s.setAttribute('role', 'img'); s.setAttribute('aria-label', r[0]);
    s.addEventListener('click', function (ev) { ev.stopPropagation(); ekTregoFlluskeRoli(s, r[0]); });
    return s;
  }
  // Flluska e vogël pranë ikonës (me shigjetë që del prej saj); mbyllet me prekje tjetër ose pas 3.5 s
  var __ekFlluska = null;
  function ekMbyllFlluske() {
    if (!__ekFlluska) return;
    (__ekFlluska.__hapura || []).forEach(function (a) { a.classList.remove('me-flluske'); });
    __ekFlluska.remove(); __ekFlluska = null;
  }
  // Flluska vendoset brenda vetë ikonës (position: absolute), që të dalë gjithmonë mbi të edhe me zmadhim / WebView.
  // Vetëm qeliza e tabelës (overflow: hidden për "…") e lë të dalë jashtë sa kohë është e hapur; kornizat e tjera
  // (.tabela-mbajtese, pjesët që rrëshqasin) mbeten kufi: lart, përndryshe poshtë, përndryshe anash ikonës.
  function ekTregoFlluskeRoli(ikona, tekst) {
    var ishte = __ekFlluska && __ekFlluska.__per === ikona;
    ekMbyllFlluske();
    if (ishte) return;
    var f = document.createElement('span');
    f.className = 'ek-flluska lart'; f.setAttribute('role', 'tooltip'); f.textContent = tekst; f.__per = ikona;
    var koka = document.querySelector('.mbulese.hapur .opsione-krye, .sbp .faqe-krye');
    var lart = koka ? koka.getBoundingClientRect().bottom : 0, poshte = window.innerHeight;
    var td = ikona.closest('td');
    f.__hapura = [];
    if (td) { td.classList.add('me-flluske'); f.__hapura.push(td); }
    for (var a = ikona.parentElement; a && a !== document.body; a = a.parentElement) {
      if (a === td) continue;
      var cs = getComputedStyle(a);
      if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
        var ra = a.getBoundingClientRect();
        lart = Math.max(lart, ra.top); poshte = Math.min(poshte, ra.bottom);
      }
    }
    // në tabelë: jo mbi kokën e saj (Kolegu, Statusi…)
    var tb = ikona.closest('tbody'), th = tb && tb.parentElement.querySelector('thead');
    if (th) lart = Math.max(lart, th.getBoundingClientRect().bottom);
    ikona.appendChild(f);
    // mos dil jashtë ekranit: zhvendose anash, shigjeta mbetet te ikona
    var r = f.getBoundingClientRect(), vw = document.documentElement.clientWidth, dx = 0;
    if (r.left < 12) dx = 12 - r.left; else if (r.right > vw - 12) dx = vw - 12 - r.right;
    f.style.setProperty('--zhvendosja', dx + 'px');
    if (f.getBoundingClientRect().top < lart + 4) {
      f.classList.remove('lart'); f.classList.add('poshte');
      if (f.getBoundingClientRect().bottom > poshte - 4) { f.classList.remove('poshte'); f.classList.add('anash'); f.style.setProperty('--zhvendosja', '0px'); }
    }
    __ekFlluska = f;
    clearTimeout(ekTregoFlluskeRoli.k);
    ekTregoFlluskeRoli.k = setTimeout(ekMbyllFlluske, 5000);
  }
  document.addEventListener('click', ekMbyllFlluske, true);
  window.addEventListener('scroll', ekMbyllFlluske, true);
  function ekTekstiNePritje(a) {
    var u = perdoruesi(), uneE = u && a.nePritjeUid === u.uid;
    return (uneE ? 'E hoqe' : 'E hoqi ' + a.nePritjeNga) + (a.nePritjeSe ? ' ' + EKL.kohaRelative(a.nePritjeSe) : '') + ', pret miratimin e ' + (a.pronariEmri || 'kolegut');
  }
  // "Unë e hoqa": i imi → si te Afatet; i kolegut → kërkesë te pronari, që hiqet vetëm kur ai e pranon
  // v230: "Unë e hoqa": i imi = "Ndrysho afatet"; i kolegut = "Hiq nga rafti produktet e kolegëve"
  function ekLejohetHeqja(a) {
    var u = perdoruesi();
    return leja(u && a.pronariUid === u.uid ? 'afatetNdrysho' : 'grupiHeq');
  }
  async function ekHeq(a, btn) {
    var u = perdoruesi();
    if (!leja(u && a.pronariUid === u.uid ? 'afatetNdrysho' : 'grupiHeq')) return;
    if (u && a.pronariUid === u.uid) { shenoHequr([a.id]); return; }
    var emri = a.emri || a.barkodi || 'produktin';
    var po = await konfirmo('E hoqe nga rafti?', '"' + emri + '" i përket ' + (a.pronariEmri || 'kolegut') + '. Atij i shkon njoftim, dhe produkti hiqet nga afatet e tij vetëm kur ai e pranon.', 'Po, e hoqa');
    if (!po) return;
    if (btn) btn.disabled = true;
    var r = await ekK.heqAfatinEKolegut(a);
    if (!r.ok) {
      if (btn) btn.disabled = false;
      toast(r.leje ? 'S\'u lejua: vetëm kolegët e pranuar të grupit mund ta bëjnë këtë.' : 'S\'u dërgua. Kontrollo internetin dhe provo përsëri.');
      return;
    }
    toast('"' + emri + '": ' + (a.pronariEmri || 'kolegut') + (r.neRadhe ? ' i shkon për miratim sapo të ketë internet.' : ' i shkoi për miratim.'));
  }
  Array.prototype.forEach.call(document.querySelectorAll('#ekFiltrat button'), function (b) {
    b.addEventListener('click', function () { ekV.filtri = b.dataset.f || ''; ekVizato(); });
  });
  $('ekKerko').addEventListener('input', function () { ekV.kerkimi = $('ekKerko').value; ekVizato(); });
  $('ekKerko').addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && $('ekKerko').value) { ev.stopPropagation(); $('ekKerko').value = ''; ekV.kerkimi = ''; ekVizato(); } });

  // ---- Aktiviteti ----
  function ekVAktiviteti(anetaret) {
    var st = EKL.statistikat(anetaret);
    var r = $('ekAktKpi');
    r.textContent = '';
    function afatet(filtri) { return function () { ekV.anetari = 'krejt'; ekV.filtri = filtri; ekShkoTe('afatet'); }; }
    r.appendChild(kpi('Skadojnë sot', num(st.sot), 'afër skadimit', st.sot ? 'paralajm' : null, IKONA.pak, afatet('afer')));
    r.appendChild(kpi('Të skaduara në raft', num(st.skaduara), 'duhen hequr nga rafti', st.skaduara ? 'kritik' : null, IKONA.zero, afatet('skaduar')));
    r.appendChild(kpi('Hequr sot', num(st.hequrSot), 'nga krejt grupi', null, null, afatet('hequr')));
    r.appendChild(kpi('Online tani', ekOnline(anetaret) + '/' + anetaret.length, 'kolegë', null, null, function () { ekShkoTe('anetaret'); }));
    var c = $('ekAktLista');
    c.textContent = '';
    if (!ekK.gj.ngjarjetGati) { c.appendChild(el('div', 'bosh-mesazh', 'Duke ngarkuar…')); return; }
    if (!ekK.gj.ngjarjet.length) { c.appendChild(el('div', 'bosh-mesazh', 'S\'ka aktivitet ende. Kur dikush heq nga rafti, ose shton afate, del këtu.')); return; }
    var uidIm = perdoruesi() ? perdoruesi().uid : null;
    var dita = '';
    var frag = document.createDocumentFragment();
    ekK.gj.ngjarjet.forEach(function (x) {
      var t = EKL.titulliDites(x.koha);
      if (t !== dita) { dita = t; frag.appendChild(el('div', 'ek-dita-krye', t)); }
      var tx = EKL.tekstiNgjarjes(x, uidIm);
      var rr = el('div', 'ek-ngjarje ' + tx.lloji);
      rr.appendChild(ekAvatar({ emri: tx.avatar || x.emri }, false));
      var b = el('div', 'ek-ngjarje-trup');
      var p = el('div');
      p.appendChild(el('b', null, tx.kush));
      p.appendChild(document.createTextNode(' ' + tx.cfare));
      b.appendChild(p);
      if (tx.detaje) b.appendChild(el('div', 'ek-ngjarje-detaje', tx.detaje));
      rr.appendChild(b);
      rr.appendChild(el('div', 'ek-koha', ekOra(x.koha)));
      frag.appendChild(rr);
    });
    c.appendChild(frag);
  }

  // ---- Kalendari ----
  function ekVKalendari(anetaret) {
    var sot = new Date();
    if (!ekV.kal) ekV.kal = { viti: sot.getFullYear(), muaji: sot.getMonth(), dita: EKL.isoDites(sot) };
    var te = ekTeGjitha(anetaret);
    var k = EKL.kalendari(te, ekV.kal.viti, ekV.kal.muaji);
    var c = $('ekKalMuaji');
    c.textContent = '';
    var krye = el('div', 'ek-kal-krye');
    var para = el('button', 'btn dyte vogel', '‹'); para.type = 'button'; para.title = 'Muaji i kaluar';
    para.addEventListener('click', function () { ekNdryshoMuajin(-1); });
    var pas = el('button', 'btn dyte vogel', '›'); pas.type = 'button'; pas.title = 'Muaji tjetër';
    pas.addEventListener('click', function () { ekNdryshoMuajin(1); });
    var soti = el('button', 'btn tekst vogel', 'Sot'); soti.type = 'button';
    soti.addEventListener('click', function () { ekV.kal = null; ekVizato(); });
    krye.appendChild(para); krye.appendChild(el('b', null, k.titulli)); krye.appendChild(soti); krye.appendChild(pas);
    c.appendChild(krye);
    var g = el('div', 'ek-kal');
    k.ditet.forEach(function (d) { g.appendChild(el('div', 'ek-kal-emer', d)); });
    k.qelizat.forEach(function (q) {
      if (!q) { g.appendChild(el('div')); return; }
      var b = el('button', 'ek-kal-dite' + (q.statusi ? ' ' + q.statusi : '') + (q.sot ? ' sot' : '') + (ekV.kal.dita === q.iso ? ' zgjedhur' : ''));
      b.type = 'button';
      var kr = el('div', 'ek-kal-nr');
      kr.appendChild(el('span', null, String(q.dita)));
      if (q.afatet.length) kr.appendChild(el('small', null, String(q.neRaft || q.afatet.length)));
      b.appendChild(kr);
      q.afatet.slice(0, 2).forEach(function (a) { b.appendChild(el('div', 'ek-kal-emri', a.emri || a.barkodi || '')); });
      if (q.afatet.length > 2) b.appendChild(el('div', 'ek-kal-emri', '+' + (q.afatet.length - 3 ? (q.afatet.length - 2) + ' të tjera' : '1 tjetër')));
      b.title = q.afatet.length ? q.afatet.map(function (a) { return (a.emri || a.barkodi) + ' · ' + (a.pronariEmri || ''); }).join('\n') : '';
      b.addEventListener('click', function () { ekV.kal.dita = q.iso; ekVizato(); });
      g.appendChild(b);
    });
    c.appendChild(g);
    var lg = el('div', 'ek-legjenda');
    [['skaduar', 'Ka skaduar'], ['afer', 'Skadon brenda 30 ditëve'], ['ok', 'Në rregull'], ['hequr', 'Të hequra']].forEach(function (x) {
      var s = el('span'); s.appendChild(el('i', x[0])); s.appendChild(document.createTextNode(x[1])); lg.appendChild(s);
    });
    c.appendChild(lg);
    // Dita e zgjedhur
    var d = $('ekKalDita');
    d.textContent = '';
    if (!ekV.kal.dita) { $('ekKalDitaTitulli').textContent = 'Zgjidh një ditë'; d.appendChild(el('div', 'bosh-mesazh', 'Kliko një ditë te kalendari për t\'i parë afatet e saj.')); return; }
    var lista = te.filter(function (a) { return a.data === ekV.kal.dita; }).sort(AF.krahaso);
    $('ekKalDitaTitulli').textContent = AF.formato(ekV.kal.dita) + ' · ' + (lista.length ? lista.length + (lista.length === 1 ? ' afat' : ' afate') : 'asnjë afat');
    if (!lista.length) { d.appendChild(el('div', 'bosh-mesazh', 'Asnjë produkt s\'skadon këtë ditë.')); return; }
    lista.forEach(function (a) {
      var st = AF.statusi(a);
      var rr = el('div', 'ek-dita-rresht ' + st);
      rr.appendChild(el('span', 'af-status ' + st, ST_EMRI[st]));
      var m = el('div', 'ek-dita-emri');
      m.appendChild(el('div', null, a.emri || a.barkodi || '(pa emër)'));
      m.appendChild(el('div', 'ek-dita-nen', [a.barkodi, a.furnizuesi, a.pronariEmri, typeof a.sasia === 'number' ? a.sasia + ' copë' : '',
        st === 'hequr' && a.hequrNga ? 'u hoq nga ' + a.hequrNga : '', a.nePritjeNga && st !== 'hequr' ? ekTekstiNePritje(a) : ''].filter(Boolean).join(' · ')));
      rr.appendChild(m);
      if (st === 'skaduar' && a.nePritjeNga) rr.appendChild(el('span', 'ek-pritje', 'Në pritje'));
      else if (st === 'skaduar') {
        var b = el('button', 'btn af-btn kuqe', '✓ Unë e hoqa'); b.type = 'button';
        b.addEventListener('click', function () { ekHeq(a, b); });
        rr.appendChild(b);
      }
      d.appendChild(rr);
    });
  }
  function ekNdryshoMuajin(dd) {
    var m = ekV.kal.muaji + dd, v = ekV.kal.viti;
    if (m < 0) { m = 11; v--; } else if (m > 11) { m = 0; v++; }
    var sot = new Date();
    ekV.kal = { viti: v, muaji: m, dita: (v === sot.getFullYear() && m === sot.getMonth()) ? EKL.isoDites(sot) : null };
    ekVizato();
  }

  // ---- Kolegët ----
  // ---- Ekipat ----
  function ekFtesaKarta(f) {
    var k = el('div', 'karta ek-pult-kerkesat');
    var tk = el('div', 'tk');
    tk.appendChild(el('b', null, 'Ftesë: grupi "' + (f.grupiEmri || '') + '"'));
    tk.appendChild(el('span', null, (f.ngaEmri || 'Dikush') + ' të fton në këtë grup' + (f.koha ? ' · ' + EKL.kohaRelative(f.koha) : '') + '.'));
    k.appendChild(tk);
    var br = el('button', 'btn tekst vogel', 'Refuzo'); br.type = 'button';
    br.addEventListener('click', async function () { br.disabled = true; var r = await ekK.refuzoFtesen(f); if (!r.ok) { br.disabled = false; toast('S\'u refuzua. Kontrollo internetin.'); } });
    var bp = el('button', 'btn vogel', '✓ Prano'); bp.type = 'button';
    bp.addEventListener('click', function () { ekPranoFtesen(f, bp); });
    k.appendChild(br); k.appendChild(bp);
    return k;
  }
  function ekVPaGrup() {
    var c = $('ekPaGrupFtesat');
    c.textContent = '';
    ekK.ftesatEMia().forEach(function (f) { c.appendChild(ekFtesaKarta(f)); });
    $('ekEmriIm').textContent = emriPerdoruesit() || '';
    // v242: kërkesat e mia + rezultatet e kërkimit
    var km = $('ekKerkesatEMia');
    km.textContent = '';
    ekK.kerkesatEMia().forEach(function (k) { km.appendChild(ekKerkesaEMiaKarta(k)); });
    ekVizatoRezultatet();
  }
  // ---- v242: hyr në një grup ekzistues (kërko me emër, dërgo kërkesë; admini i grupit e pranon) ----
  var ekKerkimi = { q: '', rez: null, gabim: '', kohez: null };
  function ekKerkesaEMiaKarta(k) {
    var kt = el('div', 'karta ek-pult-kerkesat ek-kerkesa-ime');
    var tk = el('div', 'tk');
    tk.appendChild(el('b', null, 'Kërkesë: grupi "' + (k.grupiEmri || '') + '"'));
    tk.appendChild(el('span', null, 'U dërgua' + (k.koha ? ' ' + EKL.kohaRelative(k.koha) : '') + '. Pret pranimin nga admini i grupit.'));
    kt.appendChild(tk);
    var ba = el('button', 'btn tekst vogel', 'Anulo kërkesën'); ba.type = 'button';
    ba.addEventListener('click', async function () {
      ba.disabled = true;
      var r = await ekK.anuloKerkesen(k);
      if (!r.ok) { ba.disabled = false; toast('S\'u anulua. Kontrollo internetin dhe provo përsëri.'); }
    });
    kt.appendChild(ba);
    return kt;
  }
  function ekVizatoRezultatet() {
    var rez = $('ekGrupiRezultatet');
    rez.textContent = '';
    if (ekKerkimi.q.trim().length < 2) return;
    function info(t) { var p = el('p', 'ek-grupi-hint', t); p.style.margin = '6px 2px'; rez.appendChild(p); }
    if (ekKerkimi.gabim) { info(ekKerkimi.gabim); return; }
    if (!ekKerkimi.rez) { info('Duke kërkuar…'); return; }
    if (!ekKerkimi.rez.length) { info('S\'u gjet asnjë grup me këtë emër.'); return; }
    var kerkuar = {};
    ekK.kerkesatEMia().forEach(function (k) { kerkuar[k.gid] = true; });
    ekKerkimi.rez.forEach(function (gr) {
      var kt = el('div', 'karta ek-pult-kerkesat ek-grupi-rez');
      var tk = el('div', 'tk');
      tk.appendChild(el('b', null, gr.emri));
      tk.appendChild(el('span', null, gr.pronarEmri ? 'Admini: ' + gr.pronarEmri : 'Grup'));
      kt.appendChild(tk);
      var b = el('button', 'btn vogel', kerkuar[gr.id] ? 'U dërgua' : 'Kërko të hysh'); b.type = 'button'; b.disabled = !!kerkuar[gr.id];
      b.addEventListener('click', async function () {
        b.disabled = true;
        var r = await ekK.dergoKerkesen(gr);
        if (!r.ok) {
          b.disabled = false;
          toast(r.leje ? 'Kërkesa s\'u dërgua: ky grup s\'ekziston më, ose rregullat e Firebase-it s\'janë vendosur ende.' : 'Kërkesa s\'u dërgua. Kontrollo internetin dhe provo përsëri.');
          return;
        }
        if (r.ngaFtesa) { toast('U bashkove me grupin "' + gr.emri + '" (të kishin ftuar).'); ekShkoTe('anetaret'); return; }
        if (r.rikthyer) { toast('U ktheve në grupin "' + gr.emri + '" (ishe ende anëtar).'); ekShkoTe('anetaret'); return; }
        b.textContent = 'U dërgua';
        toast('Kërkesa u dërgua. Kur ta pranojë admini i grupit, hyn vetë në grup.');
      });
      kt.appendChild(b);
      rez.appendChild(kt);
    });
  }
  $('ekGrupiKerko').addEventListener('input', function () {
    var inp = $('ekGrupiKerko');
    ekKerkimi.q = inp.value; ekKerkimi.gabim = ''; ekKerkimi.rez = null;
    clearTimeout(ekKerkimi.kohez);
    ekVizatoRezultatet();
    if (inp.value.trim().length < 2) return;
    ekKerkimi.kohez = setTimeout(async function () {
      var q = inp.value;
      var r = await ekK.kerkoGrupet(q);
      if (q !== ekKerkimi.q) return;
      ekKerkimi.rez = r.ok ? r.lista : [];
      ekKerkimi.gabim = r.ok ? '' : r.leje ? 'Kërkimi i grupeve s\'është gati ende (rregullat e Firebase-it).' : 'S\'u kërkua. Kontrollo internetin dhe provo përsëri.';
      ekVizatoRezultatet();
    }, 300);
  });
  // Admini i grupit: kërkesat për t'u futur
  function ekKerkesaEGrupitKarta(k) {
    var kt = el('div', 'karta ek-pult-kerkesat ek-kerkesa-grupi');
    var tk = el('div', 'tk');
    tk.appendChild(el('b', null, (k.emri || 'Dikush') + ' kërkon të hyjë në grup'));
    tk.appendChild(el('span', null, k.koha ? 'Kërkesa: ' + EKL.kohaRelative(k.koha) + '.' : 'Kërkesë për t\'u futur.'));
    kt.appendChild(tk);
    var br = el('button', 'btn tekst vogel', 'Refuzo'); br.type = 'button';
    var bp = el('button', 'btn vogel', '✓ Prano'); bp.type = 'button';
    br.addEventListener('click', async function () {
      bp.disabled = br.disabled = true;
      var r = await ekK.refuzoKerkesen(k);
      if (!r.ok) { bp.disabled = br.disabled = false; toast('S\'u refuzua. Kontrollo internetin dhe provo përsëri.'); }
    });
    bp.addEventListener('click', function () { ekPranoKerkesen(k, bp, br); });
    kt.appendChild(br); kt.appendChild(bp);
    return kt;
  }
  async function ekPranoKerkesen(k, bp, br) {
    if (bp) bp.disabled = true; if (br) br.disabled = true;
    var r = await ekK.pranoKerkesen(k);
    if (!r.ok) { if (bp) bp.disabled = false; if (br) br.disabled = false; toast('S\'u pranua. Kontrollo internetin dhe provo përsëri.'); return; }
    toast((k.emri || 'Kolegu') + ' u pranua. Hyn në grup sapo ta hapë Stoku-n.');
  }
  async function ekKrijoGrupin() {
    var inp = $('ekGrupiEmri'), em = inp.value.trim();
    if (em.length < 2) { toast('Shkruaj emrin e grupit (të paktën 2 shkronja).'); inp.focus(); return; }
    var b = $('ekGrupiKrijo');
    b.disabled = true;
    var r = await ekK.krijoGrupin(em);
    b.disabled = false;
    if (!r.ok) { toast(r.leje ? 'S\'u krijua: rregullat e Firebase-it për grupet s\'janë vendosur ende.' : 'S\'u krijua. Kontrollo internetin dhe provo përsëri.'); return; }
    inp.value = '';
    toast('Grupi "' + em + '" u krijua. Tash fto shokët te Kolegët.');
    ekShkoTe('anetaret');
  }
  $('ekGrupiKrijo').addEventListener('click', ekKrijoGrupin);
  $('ekGrupiEmri').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); ekKrijoGrupin(); } });
  function ekTekstiLargimit(m) {
    return m.arsye === 'trashegimtari' ? 'S\'u largove: kolegu s\'u bë dot admin. Kontrollo internetin dhe provo përsëri.'
      : m.arsye === 'pronari-i-vetem' ? 'Je admini i vetëm i grupit. Bëje dikë tjetër admin (te Kolegët) para se të largohesh.'
      : m.arsye === 'duke-ngarkuar' ? 'Prit pak, po ngarkohen kolegët e grupit…' : 'S\'mund të largohesh tani.';
  }
  async function ekPranoFtesen(f, btn) {
    if (ekK.gjendjaEQasjes() === 'ok') {
      var g = ekK.grupiInfo() || {}, m = ekK.mundTeLargohet();
      if (!m.ok) { toast(ekTekstiLargimit(m)); return; }
      var po = await konfirmo('Të kalosh te grupi "' + (f.grupiEmri || '') + '"?',
        'Largohesh nga grupi "' + (g.emri || '') + '"' + (m.iFundit ? ' (je i fundit në grup: grupi fshihet bashkë me aktivitetin)' : m.trashegimtari ? ' (admin bëhet ' + (m.trashegimtariEmri || 'kolegu') + ')' : '') + '. Stoku dhe afatet e tua s\'preken.', 'Kalo');
      if (!po) return;
    }
    if (btn) btn.disabled = true;
    var r = await ekK.pranoFtesen(f);
    if (btn) btn.disabled = false;
    if (!r.ok) { toast(r.arsye === 'pronari-i-vetem' || r.arsye === 'duke-ngarkuar' ? ekTekstiLargimit(r) : r.leje || r.arsye === 'ftesa-skadoi' ? 'Kjo ftesë s\'vlen më (u anulua ose grupi u fshi).' : 'S\'u pranua. Kontrollo internetin dhe provo përsëri.'); return; }
    toast('U bashkove me grupin "' + (f.grupiEmri || '') + '".');
    ekShkoTe('anetaret');
  }
  $('ekLargohu').addEventListener('click', async function () {
    var g = ekK.grupiInfo() || {}, m = ekK.mundTeLargohet();
    if (!m.ok) { toast(ekTekstiLargimit(m)); return; }
    var po = await konfirmo('Të largohesh nga grupi "' + (g.emri || '') + '"?',
      m.iFundit ? 'Je i fundit në grup: grupi fshihet komplet, bashkë me aktivitetin. Stoku dhe afatet e tua s\'preken.'
        : (m.trashegimtari ? 'Je admini i grupit: kur largohesh, admin bëhet ' + (m.trashegimtariEmri || 'kolegu') + '. ' : '') +
          'S\'do t\'i shohësh më kolegët dhe aktivitetin e këtij grupi. Stoku dhe afatet e tua s\'preken.', 'Largohu');
    if (!po) return;
    var r = await ekK.largohuNgaGrupi();
    if (!r.ok) { toast(r.arsye ? ekTekstiLargimit(r) : 'S\'u largove. Kontrollo internetin dhe provo përsëri.'); return; }
    toast('U largove nga grupi "' + (g.emri || '') + '".');
  });
  $('ekRiemerto').addEventListener('click', function () {
    var g = ekK.grupiInfo() || {};
    $('ekGrupiEmriRi').value = g.emri || '';
    $('ekRiemertoForma').classList.remove('fsheh'); $('ekRiemerto').classList.add('fsheh');
    $('ekGrupiEmriRi').focus();
  });
  function ekMbyllRiemertimin() { $('ekRiemertoForma').classList.add('fsheh'); $('ekRiemerto').classList.toggle('fsheh', !ekK.eshtePronar()); }
  $('ekRiemertoAnulo').addEventListener('click', ekMbyllRiemertimin);
  async function ekRuajEmrinEGrupit() {
    var em = $('ekGrupiEmriRi').value.trim();
    if (em.length < 2) { $('ekGrupiEmriRi').focus(); return; }
    var r = await ekK.riemertoGrupin(em);
    if (!r.ok) { toast('Emri s\'u ndryshua. Kontrollo internetin.'); return; }
    ekMbyllRiemertimin(); ekVizato();
  }
  $('ekRiemertoRuaj').addEventListener('click', ekRuajEmrinEGrupit);
  $('ekGrupiEmriRi').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); ekRuajEmrinEGrupit(); } else if (ev.key === 'Escape') ekMbyllRiemertimin(); });
  function tekstiGabimitTeFtesa(r) {
    return r.arsye === 'emri' ? 'Emri i përdoruesit: 3–40 shkronja/numra (a–z, 0–9, _ . -).'
      : r.arsye === 'vetja' ? 'Ky është emri yt.' : r.arsye === 'anetar' ? 'Ky përdorues është tashmë në grup.'
      : r.arsye === 'e-ftuar' ? 'Ky përdorues është ftuar tashmë.' : 'Ftesa s\'u dërgua. Kontrollo internetin dhe provo përsëri.';
  }
  async function ekFto() {
    var inp = $('ekFtoEmri'), em = inp.value.trim();
    if (!em) { inp.focus(); return; }
    $('ekFtoBtn').disabled = true;
    var r = await ekK.ftoNeGrup(em);
    $('ekFtoBtn').disabled = false;
    if (!r.ok) { toast(tekstiGabimitTeFtesa(r)); return; }
    inp.value = '';
    toast('Ftesa iu dërgua "' + em.toLowerCase() + '". E sheh te Grupi kur e hap Stoku-n.');
  }
  $('ekFtoBtn').addEventListener('click', ekFto);
  $('ekFtoEmri').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); ekFto(); } });
  var ekLlogariteKrejt = false;
  $('ekLlogariteKrejt').addEventListener('click', function () { ekLlogariteKrejt = true; ekVizato(); });

  function ekVAnetaret(anetaret) {
    var admin = ekK.eshteAdmin(), pronar = ekK.eshtePronar(), g = ekK.grupiInfo() || {};
    // Ftesat për një grup tjetër
    var fm = $('ekFtesatEMia');
    fm.textContent = '';
    ekK.ftesatEMia().forEach(function (f) { fm.appendChild(ekFtesaKarta(f)); });
    var kgm = $('ekKerkesatEGrupit'); // v242
    kgm.textContent = '';
    ekK.kerkesatEGrupit().forEach(function (k) { kgm.appendChild(ekKerkesaEGrupitKarta(k)); });
    // Karta e grupit
    $('ekGrupiTitulli').textContent = g.emri || 'Grupi';
    $('ekGrupiNen').textContent = (pronar ? 'Ti je admin i grupit' : 'Koleg i grupit') + ' · ' + anetaret.length + (anetaret.length === 1 ? ' koleg' : ' kolegë');
    if ($('ekRiemertoForma').classList.contains('fsheh')) $('ekRiemerto').classList.toggle('fsheh', !pronar);
    // Pronari: fto + ftesat në pritje
    $('ekFtoKarta').classList.toggle('fsheh', !pronar);
    var fe = pronar ? ekK.ftesatEGrupit() : [];
    $('ekTabFtesat').classList.toggle('fsheh', !fe.length);
    var tf = $('ekFtesatTrup');
    tf.textContent = '';
    fe.forEach(function (f) {
      var tr = el('tr');
      var t0 = el('div', 'ek-anetar-qeliza');
      t0.appendChild(ekAvatar({ emri: f.perdoruesi }, false));
      t0.appendChild(el('span', 'ek-anetar-emri', f.perdoruesi));
      tr.appendChild(el('td')).appendChild(t0);
      tr.appendChild(el('td', 'k-gri', 'Në pritje · ftuar nga ' + (f.ngaEmri || '') + (f.koha ? ' · ' + EKL.kohaRelative(f.koha) : '')));
      var tv = el('td', 'k-av');
      var ba = el('button', 'btn tekst vogel', 'Anulo'); ba.type = 'button';
      ba.addEventListener('click', async function () { ba.disabled = true; var x = await ekK.anuloFtesen(f); if (!x.ok) { ba.disabled = false; toast('S\'u anulua. Kontrollo internetin.'); } });
      tv.appendChild(ba); tr.appendChild(tv);
      tf.appendChild(tr);
    });
    $('ekKolVeprime').textContent = '';
    $('ekAdminPanel').classList.toggle('fsheh', !pronar);
    var t = $('ekAnetaretTrup');
    t.textContent = '';
    anetaret.forEach(function (a) {
      var n = ekNumero(a.afatet);
      var h30 = a.afatet.filter(function (x) { return AF.statusi(x) === 'hequr' && (x.hequrSe || 0) > Date.now() - 30 * 86400000; }).length;
      var tr = el('tr');
      var t0 = el('div', 'ek-anetar-qeliza');
      t0.appendChild(ekAvatar(a, true));
      t0.appendChild(el('span', 'ek-anetar-emri', a.emri));
      if (a.pronar) t0.appendChild(ekIkonaRoli('pronar', el, toast));
      if (a.admin) t0.appendChild(ekIkonaRoli('admin', el, toast));
      tr.appendChild(el('td')).appendChild(t0);
      tr.appendChild(el('td')).appendChild(ekPraniaEl(a));
      tr.appendChild(el('td', 'k-sas', !a.ngarkuar ? '…' : a.paTeDhena ? '–' : num(n.aktive)));
      tr.appendChild(el('td', 'k-sas' + (n.skaduar ? ' ek-kuqe' : ''), num(n.skaduar)));
      tr.appendChild(el('td', 'k-sas', num(n.afer)));
      tr.appendChild(el('td', 'k-sas', num(h30)));
      var tv = el('td', 'k-av');
      if (pronar && !a.uneJam) {
        var bp = el('button', 'btn tekst vogel', a.pronar ? 'Hiqe si admin' : 'Bëje admin'); bp.type = 'button';
        bp.title = a.pronar ? a.emri + ' mbetet koleg pa rol admini' : a.emri + ' mund të ftojë dhe të menaxhojë grupin';
        bp.addEventListener('click', async function (ev) {
          ev.stopPropagation();
          bp.disabled = true;
          var x = await ekK.ndryshoRolin(a, a.pronar ? 'anetar' : 'pronar');
          bp.disabled = false;
          if (!x.ok) toast(x.arsye === 'pronari-i-vetem' ? 'Grupi duhet të ketë të paktën një admin.' : 'S\'u ndryshua. Kontrollo internetin.');
        });
        tv.appendChild(bp);
        var hq = el('button', 'btn tekst rrezik vogel', 'Hiq nga grupi'); hq.type = 'button';
        hq.addEventListener('click', function (ev) { ev.stopPropagation(); ekHiqNgaEkipa(a); });
        tv.appendChild(hq);
      }
      if (admin && !a.uneJam && !a.admin) {
        var hf = el('button', 'btn tekst rrezik vogel', 'Fshi'); hf.type = 'button'; hf.title = 'Fshi llogarinë e ' + a.emri + ' komplet';
        hf.addEventListener('click', function (ev) { ev.stopPropagation(); ekFshijLlogarine(a); });
        tv.appendChild(hf);
      }
      tr.appendChild(tv);
      tr.title = 'Shiko afatet e ' + a.emri;
      tr.addEventListener('click', function () { ekV.anetari = a.uid; ekV.filtri = ''; ekShkoTe('afatet'); });
      t.appendChild(tr);
    });
    // Administratori: llogaritë jashtë grupit
    $('ekLlogaritePanel').classList.toggle('fsheh', !admin);
    if (admin) {
      var l = ekK.llogariteJashte();
      $('ekLlogariteTitulli').textContent = 'Llogaritë e tjera (vetëm administratori) · ' + l.length;
      var tl2 = $('ekLlogariteTrup');
      tl2.textContent = '';
      (ekLlogariteKrejt ? l : l.slice(0, 20)).forEach(function (a) {
        var tr = el('tr');
        var t0 = el('div', 'ek-anetar-qeliza');
        t0.appendChild(ekAvatar(a, false));
        t0.appendChild(el('span', 'ek-anetar-emri', a.emri));
        tr.appendChild(el('td')).appendChild(t0);
        var kur = a.kycurSe || a.aktivSe;
        tr.appendChild(el('td', 'k-gri', (a.grupi ? 'Në një grup tjetër' : 'Pa grup') + (kur ? ' · u kyç ' + EKL.kohaRelative(kur) : '')));
        var tv = el('td', 'k-av');
        if (pronar) {
          var bt = el('button', 'btn tekst vogel', 'Fto'); bt.type = 'button';
          bt.addEventListener('click', async function () { bt.disabled = true; var x = await ekK.ftoNeGrup(a.emri); if (!x.ok) { bt.disabled = false; toast(tekstiGabimitTeFtesa(x)); } else toast('Ftesa iu dërgua ' + a.emri + '.'); });
          tv.appendChild(bt);
        }
        if (!a.admin) {
          var bf = el('button', 'btn tekst rrezik vogel', 'Fshi'); bf.type = 'button'; bf.title = 'Fshi llogarinë e ' + a.emri + ' komplet';
          bf.addEventListener('click', function () { ekFshijLlogarine(a); });
          tv.appendChild(bf);
        }
        tr.appendChild(tv);
        tl2.appendChild(tr);
      });
      if (!l.length) { var tr0 = el('tr'); tr0.appendChild(el('td', 'k-gri', 'S\'ka llogari të tjera.')); tl2.appendChild(tr0); }
      $('ekLlogariteKrejt').classList.toggle('fsheh', ekLlogariteKrejt || l.length <= 20);
      $('ekLlogariteKrejt').textContent = 'Shfaq krejt (' + l.length + ')';
    }
  }

  // ---- Paneli i pronarit të grupit ----
  $('ekAdminDergo').addEventListener('click', async function () {
    var ta = $('ekAdminTekst'), t = ta.value.trim();
    if (!t) { ta.focus(); return; }
    this.disabled = true;
    var r = await ekK.lajmeroEkipen(t);
    this.disabled = false;
    if (!r.ok) { toast('Njoftimi s\'u dërgua. Kontrollo internetin dhe provo përsëri.'); return; }
    ta.value = '';
    toast('Njoftimi u dërgua te krejt grupi' + (r.neRadhe ? ' (sapo të ketë internet).' : '.'));
  });
  $('ekAdminPastroAkt').addEventListener('click', async function () {
    var b = this;
    var po = await konfirmo('Të fshihet krejt aktiviteti?', 'Krejt historiku i aktivitetit fshihet për krejt grupin. Afatet s\'preken.', 'Fshi krejt');
    if (!po) return;
    b.disabled = true;
    var r = await ekK.pastroAktivitetin();
    b.disabled = false;
    toast(r.ok ? (r.n === 1 ? 'U fshi 1 rresht.' : 'U fshinë ' + r.n + ' rreshta.') : 'S\'u fshi krejt. Kontrollo internetin dhe provo përsëri.');
  });

  // ---- Stoku i krejt kolegëve (vetëm administratori, vetëm lexim) ----
  var ekStoku = { uid: null, te: {}, duke: {} };
  function ekVStoku(anetaret) {
    if (!ekStoku.uid || !anetaret.some(function (a) { return a.uid === ekStoku.uid; })) ekStoku.uid = anetaret.length ? anetaret[0].uid : null;
    var r = $('ekStokAnetaret');
    r.textContent = '';
    anetaret.forEach(function (x) {
      var d = ekStoku.te[x.uid];
      var k = kpi(x.emri, d && d.ok ? num(d.produktet.length) : '…', 'produkte', null, null, function () { ekHapStokun(x.uid); });
      k.classList.add('ek-anetar');
      if (ekStoku.uid === x.uid) k.classList.add('zgjedhur');
      r.appendChild(k);
    });
    if (ekStoku.uid && !ekStoku.te[ekStoku.uid]) ekHapStokun(ekStoku.uid, true);
    ekTabelaEStokut();
  }
  function ekTabelaEStokut() {
    var d = ekStoku.te[ekStoku.uid], trup = $('ekStokTrup'), bosh = $('ekStokBosh');
    trup.textContent = '';
    bosh.classList.remove('fsheh');
    if (!d) { bosh.textContent = 'Duke ngarkuar stokun…'; return; }
    if (!d.ok) { bosh.textContent = 'S\'u lexua stoku. Kontrollo internetin (ose rregullat e Firebase-it).'; return; }
    var emriF = {}; d.foldera.forEach(function (f) { emriF[f.id] = f.emri; });
    var k = $('ekStokKerko').value.trim().toLowerCase();
    var te = d.produktet.filter(function (p) { return !k || ((p.emri || '') + ' ' + p.barkodi + ' ' + (emriF[p.kategoriaId] || '')).toLowerCase().indexOf(k) !== -1; })
      .sort(function (a, b) { return String(a.emri || '').localeCompare(String(b.emri || ''), 'sq'); });
    if (!te.length) { bosh.textContent = k ? 'Asgjë s\'u gjet për "' + k + '".' : 'Stoku është bosh.'; return; }
    bosh.classList.add('fsheh');
    var frag = document.createDocumentFragment();
    te.slice(0, EK_LIMITI).forEach(function (p) {
      var tr = el('tr');
      tr.appendChild(el('td', null, p.emri || '(pa emër)'));
      tr.appendChild(el('td', 'mono', p.barkodi));
      tr.appendChild(el('td', null, emriF[p.kategoriaId] || 'Pa folder'));
      tr.appendChild(el('td', 'k-sas' + ((p.sasia | 0) <= 0 ? ' ek-kuqe' : ''), num(p.sasia | 0)));
      frag.appendChild(tr);
    });
    trup.appendChild(frag);
    if (te.length > EK_LIMITI) { bosh.textContent = 'Shfaqen ' + num(EK_LIMITI) + ' nga ' + num(te.length) + '. Kërko për t\'i gjetur të tjerat.'; bosh.classList.remove('fsheh'); }
  }
  // Klikimi e rilexon gjithmonë (stoku i freskët); vizatimi e lexon vetëm herën e parë
  async function ekHapStokun(uid, ngaVizatimi) {
    ekStoku.uid = uid;
    if (!ngaVizatimi) ekVizato();
    if (ekStoku.duke[uid]) return;
    ekStoku.duke[uid] = true;
    var r = await ekK.merrStokun(uid);
    delete ekStoku.duke[uid];
    ekStoku.te[uid] = r.ok ? { ok: true, produktet: r.produktet, foldera: r.foldera } : { ok: false };
    if (pamja === 'ekipi' && ekNen === 'stoku') ekVizato();
  }
  $('ekStokKerko').addEventListener('input', ekTabelaEStokut);
  $('ekStokExcel').addEventListener('click', function () {
    var d = ekStoku.te[ekStoku.uid];
    var a = (ekK ? ekK.anetaretMeAfate() : []).filter(function (x) { return x.uid === ekStoku.uid; })[0];
    if (!d || !d.ok || !a) return;
    var emriSk = 'stoku_' + slug(a.emri) + '_' + vulaKohore(true) + '.xlsx';
    shkarko(window.StokuXlsx.buildWorkbook(EKL.fletetEStokut(a.emri, d.produktet, d.foldera)), emriSk, MIME_XLSX);
    toast('U shkarkua: ' + emriSk);
  });

  // ---- Pronari i grupit: heq një koleg ----
  async function ekHiqNgaEkipa(a) {
    var po = await konfirmo('Të hiqet nga grupi?', a.emri + ' s\'do ta shohë më grupin (afatet e kolegëve dhe aktivitetin) derisa ta ftosh sërish. Stoku dhe afatet e tij s\'preken.', 'Hiqe');
    if (!po) return;
    var r = await ekK.hiqNgaEkipa(a);
    if (!r.ok) { toast('S\'u hoq. Kontrollo internetin dhe provo përsëri.'); return; }
    if (ekV.anetari === a.uid) ekV.anetari = 'krejt';
    toast(a.emri + ' u hoq nga grupi.');
  }
  // Administratori: fshirja e plotë e një llogarie (stoku, afatet, profili; llogaria e hyrjes fshihet kur ai e hap Stoku-n)
  async function ekFshijLlogarine(a) {
    var po = await konfirmo('Të fshihet llogaria e ' + a.emri + '?',
      'Fshihen komplet stoku, afatet, fletët dhe profili i ' + a.emri + '. Nuk mund të hyjë më me këtë llogari (emri lirohet dhe mund të krijohet sërish si llogari e re, bosh). Kjo S\'KTHEHET MË.', 'Fshije komplet', 3);
    if (!po) return;
    var r = await ekK.fshijLlogarine(a);
    if (!r.ok) { toast(r.leje ? 'S\'u fshi: rregullat e Firebase-it s\'e lejojnë ende (duhen rregullat v116).' : 'S\'u fshi. Kontrollo internetin dhe provo përsëri.'); return; }
    if (ekV.anetari === a.uid) ekV.anetari = 'krejt';
    ekVizato();
    toast('Llogaria e ' + a.emri + ' u fshi' + (r.mbetur ? ' (disa të dhëna s\'u fshinë, provo përsëri më vonë).' : '.'));
  }

  // ---- Statistikat ----
  function ekVStatistika(anetaret) {
    var st = EKL.statistikat(anetaret);
    var r = $('ekStatKpi');
    r.textContent = '';
    function afatet(filtri) { return function () { ekV.anetari = 'krejt'; ekV.filtri = filtri; ekShkoTe('afatet'); }; }
    r.appendChild(kpi('Afate në raft', num(st.aktive), 'krejt grupi', null, null, afatet('')));
    r.appendChild(kpi('Të skaduara', num(st.skaduara), 'duhen hequr nga rafti', st.skaduara ? 'kritik' : null, IKONA.zero, afatet('skaduar')));
    r.appendChild(kpi('Skadojnë ≤ 7 ditë', num(st.javes), 'këtë javë', st.javes ? 'paralajm' : null, IKONA.pak, afatet('afer')));
    r.appendChild(kpi('Afër skadimit', num(st.afer), '≤ 30 ditë', st.afer ? 'paralajm' : null, IKONA.pak, afatet('afer')));
    r.appendChild(kpi('Hequr këtë muaj', num(st.hequrMuajit), 'nga rafti', null, null, afatet('hequr')));
    r.appendChild(kpi('Online tani', ekOnline(anetaret) + '/' + anetaret.length, 'kolegë', null, null, function () { ekShkoTe('anetaret'); }));
    function shirita(cont, koka, rreshtat, bosh, veprimi) {
      cont.textContent = '';
      if (!rreshtat.length) { cont.appendChild(el('div', 'bosh-mesazh', bosh)); return; }
      var kk = el('div', 'shirit-koka');
      koka.forEach(function (t) { kk.appendChild(el('span', null, t)); });
      cont.appendChild(kk);
      var maks = rreshtat.reduce(function (m, x) { return Math.max(m, x[1]); }, 0) || 1;
      rreshtat.forEach(function (x) {
        var b = el('button', 'shirit-rresht'); b.type = 'button';
        b.appendChild(el('span', 'shirit-emri', x[0]));
        var pista = el('span', 'shirit-pista');
        var sh = el('span', 'shirit'); sh.style.width = (x[1] / maks * 100) + '%';
        if (!x[1]) sh.style.opacity = '0';
        pista.appendChild(sh);
        b.appendChild(pista);
        b.appendChild(el('span', 'shirit-num', num(x[1])));
        b.appendChild(el('span', 'shirit-num gri' + (x[3] ? ' ek-kuqe' : ''), x[2] === '' ? '' : num(x[2])));
        if (veprimi) b.addEventListener('click', function () { veprimi(x); });
        else b.style.cursor = 'default';
        cont.appendChild(b);
      });
    }
    shirita($('ekStatAnetaret'), ['Kolegu', 'Afate në raft', 'Nr.', 'Të skaduara'],
      st.perAnetar.map(function (x) { return [x.emri, x.aktive, x.skaduara, x.skaduara > 0, x.uid]; }), 'Asnjë koleg.',
      function (x) { ekV.anetari = x[4]; ekV.filtri = ''; ekShkoTe('afatet'); });
    shirita($('ekStatFurnizuesit'), ['Furnizuesi', 'Të skaduara ose afër skadimit', 'Nr.', ''],
      st.furnizuesit.map(function (x) { return [x.emri, x.n, '']; }), 'Asnjë produkt afër skadimit me furnizues të shënuar.');
    shirita($('ekStatHeqesit'), ['Kush', 'Hoqi nga rafti (30 ditë)', 'Nr.', ''],
      st.heqesit.map(function (x) { return [x.emri, x.n, '']; }), 'Askush s\'ka hequr ende gjë nga rafti.');
  }

  // ---- Zilja ----
  async function ekHapNjoftimet() {
    if (!ekK) return;
    var l = $('ekNjLista');
    l.textContent = '';
    l.appendChild(el('div', 'bosh-mesazh', 'Duke ngarkuar…'));
    $('ekNjLejo').style.display = ('Notification' in window && Notification.permission === 'default') ? '' : 'none';
    hapDialog('dlgEkNjoftimet');
    var pa = {};
    ekK.gj.njoftimetPalexuara.forEach(function (n) { pa[n.id] = true; });
    var te = await ekK.merrNjoftimet();
    l.textContent = '';
    $('ekNjFshiKrejt').style.display = te.length ? '' : 'none';
    ekNjTeShfaqura = te.map(function (n) { return n.id; });
    var BOSH_NJ = 'S\'ka njoftime. Këtu të del kur një koleg heq nga rafti një nga produktet e tua që ka skaduar.';
    if (!te.length) l.appendChild(el('div', 'bosh-mesazh', BOSH_NJ));
    te.forEach(function (n) {
      var r = el('div', 'ek-nj' + (pa[n.id] ? ' e-re' : ''));
      var fshi = el('button', 'ek-nj-fshi', '✕'); fshi.type = 'button'; fshi.setAttribute('aria-label', 'Fshije njoftimin'); fshi.title = 'Fshije njoftimin';
      fshi.addEventListener('click', async function () {
        fshi.disabled = true;
        var res = await ekK.fshijNjoftimet([n.id]);
        if (!res || !res.ok) { fshi.disabled = false; toast('S\'u fshi. Kontrollo internetin dhe provo sërish.'); return; }
        r.remove();
        ekNjTeShfaqura = ekNjTeShfaqura.filter(function (id) { return id !== n.id; });
        if (!ekNjTeShfaqura.length) { $('ekNjFshiKrejt').style.display = 'none'; l.appendChild(el('div', 'bosh-mesazh', BOSH_NJ)); }
      });
      r.appendChild(ekAvatar({ emri: n.emri }, false));
      var b = el('div', 'ek-nj-trup', EKL.tekstiNjoftimit(n));
      b.appendChild(el('div', 'ek-nj-koha', EKL.kohaRelative(n.koha)));
      if (/^kerkese-/.test(n.lloji)) {
        var lp = EKL.listaEKerkeses(n);
        if (lp.length > 1 || (lp[0] && lp[0].data)) {
          var ul = el('ul', 'ek-nj-produktet');
          lp.forEach(function (x) { ul.appendChild(el('li', null, EKL.rreshtiIProduktit(x))); });
          b.appendChild(ul);
        }
      }
      if (n.lloji === 'kerkese-heqje') b.appendChild(ekButoniKerkeses(n));
      if (n.lloji === 'hequr' && n.afatId) b.appendChild(ekButonatEHeqjes(n, b.firstChild));
      r.appendChild(b);
      r.appendChild(fshi);
      l.appendChild(r);
    });
    ekK.shenoNjoftimetTeLexuara();
  }
  var ekNjTeShfaqura = [];
  $('ekNjFshiKrejt').addEventListener('click', async function () {
    if (!ekK || !ekNjTeShfaqura.length) return;
    var n = ekNjTeShfaqura.length;
    if (!(await konfirmo('Të fshihen krejt njoftimet?', (n === 1 ? 'Njoftimi fshihet' : 'Të ' + n + ' njoftimet fshihen') + ' vetëm për ty.', 'Fshiji'))) return;
    var res = await ekK.fshijNjoftimet(ekNjTeShfaqura.slice());
    if (!res || !res.ok) { toast('S\'u fshinë. Kontrollo internetin dhe provo sërish.'); return; }
    toast(n === 1 ? 'Njoftimi u fshi.' : 'U fshinë ' + n + ' njoftime.');
    ekHapNjoftimet();
  });
  $('ekZile').addEventListener('click', ekHapNjoftimet);
  // Heqja nga një koleg: pronari e pranon (hiqet te afatet e tij) ose e refuzon (mbetet në raft)
  function ekButonatEHeqjes(n, tekstiEl) {
    var w = el('div', 'ek-nj-veprim');
    if (n.vendim) { w.appendChild(el('span', 'ek-nj-kryer', n.vendim === 'pranuar' ? '✓ E pranove' : '✕ E refuzove')); return w; }
    if (!leja('afatetNdrysho')) return w; // v230: vendimi e ndryshon afatin tënd ("Ndrysho afatet")
    var bp = el('button', 'btn vogel', 'Prano'); bp.type = 'button';
    var br = el('button', 'btn tekst vogel', 'Refuzo'); br.type = 'button';
    async function vendos(pranoj) {
      if (!leja('afatetNdrysho')) return;
      bp.disabled = br.disabled = true;
      var res = await ekK.vendosPerHeqjen(n, pranoj);
      if (!res || !res.ok) { bp.disabled = br.disabled = false; toast('S\'u ruajt. Kontrollo internetin dhe provo sërish.'); return; }
      if (tekstiEl && tekstiEl.nodeType === 3) tekstiEl.nodeValue = EKL.tekstiNjoftimit(n);
      w.textContent = '';
      w.appendChild(el('span', 'ek-nj-kryer', pranoj ? '✓ E pranove' : '✕ E refuzove'));
      toast(pranoj ? '"' + (n.produkti || 'Produkti') + '" u hoq nga rafti. ' + (n.emri || 'Kolegu') + ' u njoftua.' : (n.emri || 'Kolegu') + ' u njoftua që produkti mbetet në raft.');
    }
    bp.addEventListener('click', function () { vendos(true); });
    br.addEventListener('click', function () { vendos(false); });
    w.appendChild(bp); w.appendChild(br);
    return w;
  }
  function ekButoniKerkeses(n) {
    var w = el('div', 'ek-nj-veprim');
    var kr = ekK.kryeresiIKerkeses(n);
    if (kr) { w.appendChild(el('span', 'ek-nj-kryer', kr.uneJam ? '✓ E hoqe nga rafti' : '✓ E hoqi ' + kr.emri)); return w; }
    var bt = el('button', 'btn dyte vogel', 'E hoqa nga rafti'); bt.type = 'button';
    if (!leja('grupiKerkesat')) return w;
    bt.addEventListener('click', async function () {
      if (!leja('grupiKerkesat')) return;
      bt.disabled = true; bt.textContent = 'Duke ruajtur…';
      var res = await ekK.kryejKerkesen(n);
      if (res && res.ok) { w.textContent = ''; w.appendChild(el('span', 'ek-nj-kryer', '✓ E hoqe nga rafti')); toast((n.emri || 'Kolegu') + ' u njoftua që e hoqe.'); }
      else { bt.disabled = false; bt.textContent = 'E hoqa nga rafti'; toast('S\'u ruajt. Kontrollo internetin dhe provo sërish.'); }
    });
    w.appendChild(bt);
    return w;
  }
  // ---- Kërko heqje nga rafti ----
  function hapKerkesen(perUid) {
    if (!ekK || !leja('grupiKerkesat')) return;
    var kol = ekK.koleget();
    var sel = $('krkPer'); sel.textContent = '';
    var o0 = document.createElement('option'); o0.value = ''; o0.textContent = 'Krejt grupi (' + kol.length + ')'; sel.appendChild(o0);
    kol.slice().sort(function (a, b) { return String(a.emri).localeCompare(String(b.emri)); }).forEach(function (a) {
      var o = document.createElement('option'); o.value = a.uid; o.textContent = a.emri; sel.appendChild(o);
    });
    sel.value = perUid || '';
    var AFk = window.StokuAfatet;
    var skaduara = (afatet || []).filter(function (a) { return a && AFk.statusi(a) === 'skaduar'; }).sort(AFk.krahaso).map(function (a) {
      return { produkti: String(a.emri || '').trim(), barkodi: String(a.barkodi || ''), data: a.data || '',
        nen: ['skadoi më ' + AFk.formato(a.data), AFk.sasiaTekst(a)].filter(Boolean).join(' · ') };
    });
    var prod = teGjithaProduktet().filter(function (p) { return p && (p.emri || p.barkodi); })
      .sort(function (a, b) { return String(a.emri || a.barkodi).localeCompare(String(b.emri || b.barkodi)); }).map(function (p) {
        var fe = emriFolderit(p.kategoriaId);
        return { produkti: String(p.emri || '').trim(), barkodi: String(p.barkodi || ''), nen: [fe, 'sasia ' + (Number(p.sasia) || 0)].filter(Boolean).join(' · ') };
      });
    krkZgjedhesi = EKL.zgjedhesIKerkeses($('krkZgjedhesi'), { skaduara: skaduara, produktet: prod }, perditesoDergo);
    $('krkShenim').value = '';
    $('krkGabim').textContent = kol.length ? '' : 'S\'ka ende kolegë në grup.';
    $('krkDergo').disabled = false; $('krkDergo').textContent = 'Dërgo';
    hapDialog('dlgKerkese');
  }
  var krkZgjedhesi = null;
  function perditesoDergo(n) { $('krkDergo').textContent = n ? 'Dërgo (' + n + ')' : 'Dërgo'; if (n) $('krkGabim').textContent = ''; }
  async function dergoKerkesen() {
    if (!leja('grupiKerkesat')) { mbyllDialog('dlgKerkese'); return; }
    var zgj = krkZgjedhesi ? krkZgjedhesi.zgjedhur() : [];
    if (!zgj.length) { $('krkGabim').textContent = 'Shëno të paktën një produkt nga lista.'; return; }
    var k = { produktet: zgj };
    var per = $('krkPer').value, perEmri = per ? $('krkPer').options[$('krkPer').selectedIndex].textContent : '';
    $('krkDergo').disabled = true; $('krkDergo').textContent = 'Duke dërguar…';
    var r = await ekK.kerkoHeqjen({ produktet: k.produktet, shenim: $('krkShenim').value, perUid: per });
    $('krkDergo').disabled = false; perditesoDergo(zgj.length);
    if (!r || !r.ok) { $('krkGabim').textContent = r && r.arsye === 'pa-kolege' ? 'S\'ka ende kolegë në grup.' : 'S\'u dërgua. Kontrollo internetin dhe provo sërish.'; return; }
    mbyllDialog('dlgKerkese');
    toast(r.neRadhe ? 'Kërkesa do të dërgohet sapo të kthehet interneti.' : 'Kërkesa u dërgua te ' + (per ? perEmri : 'krejt grupi') + '.');
  }
  $('ekKerkoHeqje').addEventListener('click', function () { hapKerkesen(); });
  $('krkDergo').addEventListener('click', dergoKerkesen);
  $('krkShenim').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); dergoKerkesen(); } });

  $('ekNjLejo').addEventListener('click', function () {
    $('ekNjLejo').style.display = 'none';
    Promise.resolve(Notification.requestPermission()).then(function (p) {
      if (p === 'granted') {
        var c = window.__stokuCloud;
        if (c && c.ekipa && c.ekipa.aktivizoPush) c.ekipa.aktivizoPush(true).catch(function () { /* ok */ });
        toast('Njoftimet u aktivizuan. Do të të dalin edhe kur Stoku është i mbyllur.');
      }
    }).catch(function () { /* ok */ });
  });
  Array.prototype.forEach.call(document.querySelectorAll('#ekMenu button'), function (b) {
    b.addEventListener('click', function () { ekShkoTe(b.dataset.n); });
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-ek]'), function (b) {
    b.addEventListener('click', function () { ekShkoTe(b.dataset.ek); });
  });

  // Pronari e pranoi heqjen e një kolegu: afati shënohet i hequr (me emrin e kolegut)
  function ekZbatoHeqjet(lista) {
    var duhen = lista.filter(function (nj) { var a = afatSipasId(nj.afatId); return a && a.statusi !== 'hequr'; });
    if (!duhen.length) return;
    ndryshoAfatet(function (api) {
      duhen.forEach(function (nj) {
        var a = api.merr(nj.afatId);
        if (a) { a.statusi = 'hequr'; a.hequrSe = nj.koha || Date.now(); a.hequrNga = nj.emri || ''; api.vendos(a); }
      });
    });
  }
  // Njoftim i sistemit kur Stoku është në sfond; kur është përpara, mjafton shenja/toast-i
  function ekNjofto(nj) {
    if (!leja('grupi')) return; // v231: pa lejen "Grupi" s'del asnjë njoftim i grupit
    if (!document.hidden) {
      if (nj.pamja === 'anetaret') toast(nj.teksti, { ms: 8000, veprimi: function () { ekShkoTe('anetaret'); }, butoni: 'Hape' });
      else if (/^Stoku · Hiqe/.test(nj.titulli)) toast(nj.teksti, { ms: 9000, veprimi: ekHapNjoftimet, butoni: 'Hape' });
      return;
    }
    if (nj.vetemNePerpara) return; // vjen si push nga Worker-i
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    var url = './pc.html#/ekipa' + (nj.pamja === 'anetaret' || nj.pamja === 'njoftimet' ? '/' + nj.pamja : '');
    var opsionet = { body: nj.teksti, tag: nj.tag, icon: './icon-192.png?v=3', badge: './logo/badge-96.png?v=1', data: { url: url } };
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(function (reg) { return reg.showNotification(nj.titulli, opsionet); })
        .catch(function () { try { new Notification(nj.titulli, opsionet); } catch (e) { /* ok */ } });
    } else { try { new Notification(nj.titulli, opsionet); } catch (e) { /* ok */ } }
  }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', function (ev) {
      if (ev.data && ev.data.lloji === 'hap-ekipa') {
        if (ev.data.pamja === 'njoftimet') { ekShkoTe('pulti'); setTimeout(ekHapNjoftimet, 50); }
        else ekShkoTe(EK_NENET.indexOf(ev.data.pamja) !== -1 ? ev.data.pamja : 'afatet');
      }
      if (ev.data && ev.data.lloji === 'hap-afatet') shkoTe('afatet');
    });
  }
  function ekNisOseNdal() {
    if (!ekK) return;
    if (perdoruesi() && !ngaVizitori()) ekK.nisGjithmone(); else ekK.ndalGjithmone();
    ekShenjat();
  }

  function renderAfatetPc() {
    vizatoZgjedhjenEMarketit();
    var n = AF.numero(afatetEMarketit());
    var fur = furnizuesit().length;
    var copeSkad = 0;
    afatetEMarketit().forEach(function (a) { var st0 = AF.statusi(a); if ((st0 === 'skaduar' || st0 === 'pa-date') && typeof a.sasia === 'number') copeSkad += a.sasia; });
    $('afNen').textContent = (n.aktive === 1 ? '1 afat aktiv' : n.aktive + ' afate aktive') + (fur ? ' · ' + fur + ' furnizues' : '') + (copeSkad ? ' · ' + num(copeSkad) + ' copë të skaduara' : '');
    var numratF = { aktive: n.aktive, skaduar: n.skaduar + n['pa-date'], afer: n.afer, ok: n.ok, hequr: n.hequr };
    Array.prototype.forEach.call(document.querySelectorAll('#afFiltrat button'), function (b) {
      b.classList.toggle('aktiv', b.dataset.f === af.filtri);
      var c = b.querySelector('.n');
      if (c) c.textContent = numratF[b.dataset.f] ? num(numratF[b.dataset.f]) : '';
    });
    $('afGrupo').checked = af.grupo;
    vizatoMuajtEAfateve();

    var lista = filtroAfatet();
    var trup = $('afTrup');
    trup.textContent = '';
    var bosh = $('afBosh');
    bosh.classList.toggle('fsheh', lista.length > 0);
    $('afTabela').classList.toggle('fsheh', !lista.length);
    if (!lista.length) {
      bosh.textContent = '';
      var ik = el('div'); ik.innerHTML = '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="17" rx="2.5"></rect><path d="M16 2v4M8 2v4M3 9.5h18"></path></svg>';
      bosh.appendChild(ik);
      if (!afatetEMarketit().length) {
        bosh.appendChild(el('h3', null, idMarketitAktiv() ? 'S\'ka ende afate te ' + emriMarketit(idMarketitAktiv()) : 'S\'ka ende asnjë afat'));
        bosh.appendChild(el('div', null, 'Ngarko foton e fletës ku punëtorët kanë shkruar afatet (ose tërhiqe foton këtu), ose shtoji me dorë.'));
      } else {
        bosh.appendChild(el('h3', null, { skaduar: 'Asnjë produkt i skaduar 👍', afer: 'Asgjë nuk skadon brenda 30 ditëve', ok: 'Asnjë', hequr: 'Asnjë produkt i hequr ende', aktive: 'Asnjë afat aktiv' }[af.filtri] || 'Asgjë s\'u gjet'));
        if (af.kerkimi) bosh.appendChild(el('div', null, 'Provo një kërkim tjetër.'));
      }
      return;
    }
    var frag = document.createDocumentFragment();
    function sipasFurnizuesit(l, nen) {
      var grupet = {};
      l.forEach(function (a) { var f = a.furnizuesi || ''; (grupet[f] = grupet[f] || []).push(a); });
      Object.keys(grupet).sort(function (a, b) { return !a ? 1 : !b ? -1 : a.localeCompare(b, 'sq'); }).forEach(function (f) {
        var g = grupet[f];
        var tr = el('tr', 'af-grup' + (nen ? ' af-grup-nen' : ''));
        var td = el('td'); td.colSpan = 6;
        var copeGr = AF.shumaCopeve(g);
        td.appendChild(document.createTextNode((f || 'Pa furnizues') + ' · ' + produkteTekst(g.length) + (copeGr ? ' · ' + num(copeGr) + ' copë' : '')));
        tr.appendChild(td);
        frag.appendChild(tr);
        g.forEach(function (a) { frag.appendChild(rreshtIAfatit(a)); });
      });
    }
    if (kaMarkete() && !idMarketitAktiv()) {
      // v248: merchandiseri te "Krejt marketet": afatet s'përzihen, secili market me afatet e veta
      MK.grupo(lista, marketet).forEach(function (gr) {
        var tr = el('tr', 'af-grup af-grup-market');
        var td = el('td'); td.colSpan = 6;
        td.innerHTML = IKONA_MARKETI;
        td.appendChild(document.createTextNode((gr.id ? gr.emri : 'Pa market') + ' · ' + produkteTekst(gr.afatet.length)));
        tr.appendChild(td);
        frag.appendChild(tr);
        if (af.grupo) sipasFurnizuesit(gr.afatet, true);
        else gr.afatet.forEach(function (a) { frag.appendChild(rreshtIAfatit(a)); });
      });
    } else if (af.grupo) {
      sipasFurnizuesit(lista, false);
    } else {
      lista.forEach(function (a) { frag.appendChild(rreshtIAfatit(a)); });
    }
    trup.appendChild(frag);
  }

  var IKONA_MARKETI = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>';
  function rreshtIAfatit(a) {
    var st = AF.statusi(a);
    var tr = el('tr', st);
    tr.dataset.id = a.id;
    var t0 = el('td', 'k-st'); t0.appendChild(el('span', 'af-status ' + st, ST_EMRI[st])); tr.appendChild(t0);
    var t1 = el('td', 'af-prod');
    var e = el('div', null, a.emri || '(pa emër)'); if (!a.emri) e.style.cssText = 'color:var(--gri);font-style:italic';
    t1.appendChild(e);
    var nenP = el('div', 'af-prod-nen');
    if (kaMarkete()) { // v248: te çdo afat shihet marketi (pika) ku ndodhet
      var mk = el('span', 'af-prod-mk'); mk.innerHTML = IKONA_MARKETI;
      mk.appendChild(document.createTextNode(a.m && MK.sipasId(marketet, a.m) ? emriMarketit(a.m) : 'Pa market'));
      nenP.appendChild(mk); nenP.appendChild(document.createTextNode(' · '));
    }
    if (a.furnizuesi) { nenP.appendChild(el('span', null, a.furnizuesi)); nenP.appendChild(document.createTextNode(' · ')); }
    nenP.appendChild(el('span', 'mono', a.barkodi || '–'));
    t1.appendChild(nenP);
    t1.title = (a.emri || '') + (a.krijuarNga ? '\nShtuar nga: ' + a.krijuarNga : '') + (a.krijuarSe ? ' · ' + dataOra(a.krijuarSe) : '');
    tr.appendChild(t1);
    tr.appendChild(el('td', 'k-sas', typeof a.sasia === 'number' ? num(a.sasia) : '–'));
    tr.appendChild(el('td', 'k-data', a.data ? AF.formato(a.data) : '–'));
    tr.appendChild(qelizaEDiteve(a));
    var tv = el('td', 'k-av');
    function b(tekst, klasa, fn, titull) {
      var x = el('button', 'btn af-btn ' + klasa, tekst); x.type = 'button'; if (titull) x.title = titull;
      x.addEventListener('click', function (ev) { ev.stopPropagation(); fn(); });
      tv.appendChild(x); tv.appendChild(document.createTextNode(' '));
    }
    // "U hoq" vlen vetëm për produktet e skaduara — ato që ende s'kanë skaduar s'hiqen nga rafti
    var lejaNdr = leja('afatetNdrysho');
    if (st === 'skaduar' && lejaNdr) b('Shëno të hequr', 'kuqe', function () { shenoHequr([a.id]); }, 'Shëno që produkti u hoq nga rafti/pozita');
    else if (st === 'hequr' && lejaNdr) b('↺ Rikthe', 'dyte', function () { riktheAktiv(a.id); });
    var ed = el('button', 'btn-ikone'); ed.type = 'button'; ed.innerHTML = lejaNdr ? IKONA.ndrysho : IKONA_SHIKO; ed.title = lejaNdr ? 'Ndrysho' : 'Shiko';
    ed.addEventListener('click', function (ev) { ev.stopPropagation(); hapAfatinPc(a.id); });
    var fs = el('button', 'btn-ikone rrezik'); fs.type = 'button'; fs.innerHTML = IKONA.fshij; fs.title = 'Fshi';
    fs.addEventListener('click', function (ev) { ev.stopPropagation(); fshijAfatet([a.id]); });
    tv.appendChild(ed); if (leja('afatetFshi')) tv.appendChild(fs);
    tr.appendChild(tv);
    tr.addEventListener('click', function () { hapAfatinPc(a.id); });
    return tr;
  }

  var IKONA_SHIKO = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
  function shenoHequr(ids) {
    if (!leja('afatetNdrysho')) return;
    var tani = Date.now();
    var reg = ndryshoAfatet(function (api) {
      ids.forEach(function (id) { var a = api.merr(id); if (a) { a.statusi = 'hequr'; a.hequrSe = tani; a.hequrNga = emriPerdoruesit(); api.vendos(a); } });
    });
    toast(ids.length === 1 ? 'U shënua si i hequr nga rafti.' : ids.length + ' produkte u shënuan si të hequra.', { veprimi: function () { zhbejAfatet(reg); } });
    ids.forEach(function (id) { ekNgjarjeAfati('hequr', afatSipasId(id)); });
  }
  // Ngjarje për aktivitetin e Grupit (kush çka hoqi/lajmëroi/ktheu)
  function ekNgjarjeAfati(lloji, a) {
    var u = perdoruesi();
    if (!u || !a || !ekK) return;
    ekK.ngjarje({ lloji: lloji, pronariUid: u.uid, pronariEmri: emriPerdoruesit(), afatId: a.id, produkti: a.emri || a.barkodi || '',
      barkodi: a.barkodi || '', data: a.data || '', sasia: typeof a.sasia === 'number' ? a.sasia : undefined });
  }
  function riktheAktiv(id) {
    if (!leja('afatetNdrysho')) return;
    var reg = ndryshoAfatet(function (api) { var a = api.merr(id); if (a) { a.statusi = 'aktiv'; a.hequrSe = 0; api.vendos(a); } });
    toast('U rikthye si aktiv.', { veprimi: function () { zhbejAfatet(reg); } });
    ekNgjarjeAfati('rikthyer', afatSipasId(id));
  }
  function fshijAfatet(ids) {
    if (!leja('afatetFshi')) return;
    var reg = ndryshoAfatet(function (api) { ids.forEach(function (id) { api.fshij(id); }); });
    toast(ids.length === 1 ? 'Afati u fshi.' : ids.length + ' afate u fshinë.', { veprimi: function () { zhbejAfatet(reg); } });
  }

  $('navAfatet').addEventListener('click', function () { af.filtri = 'aktive'; shkoTe('afatet'); });
  $('navAfSkaduara').addEventListener('click', function () { af.filtri = 'skaduar'; shkoTe('afatet'); });
  $('navAfAfer').addEventListener('click', function () { af.filtri = 'afer'; shkoTe('afatet'); });
  Array.prototype.forEach.call(document.querySelectorAll('#afFiltrat button'), function (b) {
    b.addEventListener('click', function () { af.filtri = b.dataset.f; renderAfatetPc(); });
  });
  $('afKerko').addEventListener('input', function () { af.kerkimi = $('afKerko').value; renderAfatetPc(); });
  $('afKerko').addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && $('afKerko').value) { ev.stopPropagation(); $('afKerko').value = ''; af.kerkimi = ''; renderAfatetPc(); } });
  $('afGrupo').addEventListener('change', function () { af.grupo = $('afGrupo').checked; renderAfatetPc(); });
  $('afBtnShto').addEventListener('click', function () { hapAfatinPc(null); });
  $('afBtnExcel').addEventListener('click', hapEksportinEAfateve);

  // ---------- Dialogu shto/ndrysho ----------
  var afdId = null;
  function hapAfatinPc(id, barkodi) {
    var a = id ? afatSipasId(id) : null;
    if (!a && !leja('afatetShto')) return;
    // v230: pa "Ndrysho afatet" afati hapet vetëm për t'u parë (pa "Ruaj", pa veprimet)
    var vetemLexim = !!a && !leja('afatetNdrysho');
    ['afdBarkodi', 'afdEmri', 'afdData', 'afdSasia', 'afdFurnizuesi'].forEach(function (i) { $(i).readOnly = vetemLexim; });
    $('afdRuaj').classList.toggle('fsheh', vetemLexim);
    afdId = a ? a.id : null;
    var dl = $('afdFurnizuesit'); dl.textContent = '';
    furnizuesitPerSugjerim().forEach(function (f) { var o = el('option'); o.value = f; dl.appendChild(o); });
    $('afdTitulli').textContent = a ? (a.emri || a.barkodi || 'Afati') : 'Afat i ri';
    $('afdBarkodi').value = a ? a.barkodi || '' : (barkodi || '');
    $('afdEmri').value = a ? a.emri || '' : emriNgaBarkodi(barkodi);
    $('afdData').value = a && a.data ? AF.formatoPerFushe(a.data) : '';
    $('afdFurnizuesi').value = a ? a.furnizuesi || '' : furnizuesiNgaBarkodi(barkodi);
    $('afdSasia').value = a && typeof a.sasia === 'number' ? String(a.sasia) : '';
    // v241: marketi (vetëm kur ka markete); afati i ri merr marketin e zgjedhur te Afatet
    $('afdMarketiKuti').hidden = !kaMarkete();
    if (kaMarkete()) {
      var sm = $('afdMarketi'); sm.textContent = '';
      var om = el('option', null, a ? 'Pa market' : 'Zgjidh marketin'); om.value = ''; sm.appendChild(om);
      MK.rendit(marketet).forEach(function (m) { var o = el('option', null, m.emri); o.value = m.id; sm.appendChild(o); });
      sm.value = a ? (a.m && MK.sipasId(marketet, a.m) ? a.m : '') : (idMarketitAktiv() || '');
      sm.disabled = vetemLexim;
    }
    $('afdGabim').textContent = '';
    $('afdFshij').classList.toggle('fsheh', !a);
    var info = $('afdInfo');
    var sv = $('afdStatusVeprime'); sv.textContent = '';
    if (a) {
      var st = AF.statusi(a);
      info.className = 'af-info ' + st;
      info.textContent = AF.pershkrimi(a) + (a.krijuarNga ? '\nShtuar nga: ' + a.krijuarNga + (a.krijuarSe ? ' më ' + dataOra(a.krijuarSe) : '') : '');
      if (vetemLexim) { /* pa veprime */ } else if (st !== 'hequr') {
        if (st === 'skaduar') {
          var h = el('button', 'btn dyte', '✓ U hoq nga rafti'); h.type = 'button';
          h.addEventListener('click', function () { mbyllDialog('dlgAfat'); shenoHequr([a.id]); });
          sv.appendChild(h);
        }
      } else {
        var r = el('button', 'btn dyte', '↺ Rikthe si aktiv'); r.type = 'button';
        r.addEventListener('click', function () { mbyllDialog('dlgAfat'); riktheAktiv(a.id); });
        sv.appendChild(r);
      }
    } else info.className = 'af-info fsheh';
    hapDialog('dlgAfat', a ? 'afdData' : (barkodi ? (emriNgaBarkodi(barkodi) ? 'afdData' : 'afdEmri') : 'afdBarkodi'));
  }
  $('afdBarkodi').addEventListener('change', function () {
    var b = $('afdBarkodi').value.trim();
    if (!$('afdEmri').value.trim()) $('afdEmri').value = emriNgaBarkodi(b);
    if (!$('afdFurnizuesi').value.trim()) $('afdFurnizuesi').value = furnizuesiNgaBarkodi(b);
  });
  ['afdBarkodi', 'afdEmri', 'afdData', 'afdSasia', 'afdFurnizuesi'].forEach(function (id, i, te) {
    $(id).addEventListener('keydown', function (ev) {
      if (ev.key !== 'Enter') return;
      ev.preventDefault();
      if (id === 'afdBarkodi') $('afdBarkodi').dispatchEvent(new Event('change'));
      if (i < te.length - 1) $(te[i + 1]).focus(); else ruajAfatinPc();
    });
  });
  // Sasia e shkruar si shumë ("60+30") zëvendësohet në fushë me rezultatin (90)
  function vendosRezultatinESasise(inp) {
    if (!AF.sasiaSiShume(inp.value)) return;
    inp.value = String(AF.lexoSasine(inp.value));
    inp.dispatchEvent(new Event('input'));
  }
  AF.lidhFushenEDates($('afdData'));
  $('afdSasia').addEventListener('change', function () { vendosRezultatinESasise($('afdSasia')); });
  function ruajAfatinPc() {
    if (!leja(afdId ? 'afatetNdrysho' : 'afatetShto')) return;
    var b = $('afdBarkodi').value.trim().replace(/\s+/g, '');
    var emri = $('afdEmri').value.trim();
    var data = AF.lexoDatenEFushes($('afdData').value) || '';
    var f = $('afdFurnizuesi').value.trim();
    var sasiaTx = $('afdSasia').value.trim();
    var sasia = AF.lexoSasine(sasiaTx);
    if (sasiaTx && sasia === '') { $('afdGabim').textContent = 'Sasia duhet të jetë numër i plotë (p.sh. 12).'; $('afdSasia').focus(); return; }
    if (!b && !emri) { $('afdGabim').textContent = 'Shkruaj barkodin ose emrin e produktit.'; $('afdBarkodi').focus(); return; }
    if (!data) { $('afdGabim').textContent = 'Shkruaj datën e skadimit, p.sh. 31-12-26.'; $('afdData').focus(); return; }
    var mkId = kaMarkete() ? $('afdMarketi').value : null; // v241
    if (kaMarkete() && !afdId && !mkId) { $('afdGabim').textContent = 'Zgjidh marketin ku është ky produkt.'; $('afdMarketi').focus(); return; }
    var afPara = afdId ? afatet.filter(function (a) { return a.id === afdId; })[0] : null;
    mesoNgaPerdoruesi(b, emri, f); // herën tjetër ky barkod plotëson vetë emrin dhe furnizuesin
    if (f && f !== ((afPara && afPara.furnizuesi) || '')) regjistroFurnizuesinERi(f); // v212, v214: për këdo
    var tani = Date.now();
    var reg = ndryshoAfatet(function (api) {
      var a = (afdId && api.merr(afdId)) || { id: afdId || AF.idERe(), statusi: 'aktiv', krijuarSe: tani, krijuarNga: emriPerdoruesit() };
      a.barkodi = b; a.emri = emri; a.data = data; a.sasia = sasia; a.furnizuesi = f;
      if (kaMarkete()) { if (mkId) a.m = mkId; else delete a.m; }
      api.vendos(a);
    });
    mbyllDialog('dlgAfat');
    if (!afdId && perdoruesi() && ekK) ekK.afateTeReja(1, false);
    toast(afdId ? 'Afati u ruajt.' : 'Afati u shtua.', { veprimi: function () { zhbejAfatet(reg); } });
  }
  $('afdRuaj').addEventListener('click', ruajAfatinPc);
  $('afdFshij').addEventListener('click', function () { var id = afdId; mbyllDialog('dlgAfat'); if (id) fshijAfatet([id]); });

  // ---------- Leximi i fletës nga foto ----------
  var lx = { rreshtat: [], lloji: 'afatet' }; // lloji: 'afatet' (parazgjedhur) ose 'stok' (fletë stoku nga telefoni)
  $('afBtnFoto').addEventListener('click', function () { if (!leja('afatetAI')) return; $('afFoto').value = ''; $('afFoto').click(); });
  $('afFoto').addEventListener('change', function () { var f = this.files && this.files[0]; if (f) lexoFletenPc(f); });
  // Tërhiq e lësho foton kudo te faqja e afateve
  (function () {
    var z = $('pamjaAfatet');
    z.addEventListener('dragover', function (ev) {
      if (Array.prototype.indexOf.call(ev.dataTransfer.types || [], 'Files') === -1 || !leja('afatetAI')) return;
      ev.preventDefault(); z.classList.add('siper');
    });
    z.addEventListener('dragleave', function (ev) { if (ev.target === z) z.classList.remove('siper'); });
    z.addEventListener('drop', function (ev) {
      z.classList.remove('siper');
      var f = ev.dataTransfer.files && ev.dataTransfer.files[0];
      if (!f) return;
      ev.preventDefault();
      if (!/^image\//.test(f.type)) { toast('Tërhiq një foto (JPG ose PNG) të fletës.'); return; }
      lexoFletenPc(f);
    });
  })();
  // Fotoja e fletës: rrota e mausit zmadhon aty ku është kursori, tërheqja me maus e lëviz,
  // dy klikime zmadhojnë (ose kthejnë te krejt fleta). Fotoja s'del kurrë krejt jashtë kutisë.
  var fotoPamja = (function () {
    var kuti = $('lxFotoKuti'), img = $('lxFoto');
    var s = 1, sMin = 1, x = 0, y = 0, terheqje = null;
    // ---- Lapsi i kuq ----
    // Vizatimet ruhen në koordinatat e fotos (piksela të fotos), në një SVG që merr të njëjtin
    // zhvendosje/zmadhim si fotoja — kështu çdo vijë mbetet saktë te rreshti ku u vizatua.
    // Për fletët nga telefoni ruhen përkohësisht në këtë kompjuter derisa fleta të ruhet/fshihet.
    var SVGNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('class', 'lexim-vizatime');
    kuti.insertBefore(svg, kuti.querySelector('.lexim-foto-kontrolle'));
    // Numrat e rreshtave (automatikë, nga AI) — SVG e veçantë, mbi lapsin, mbahet gjithmonë e sinkronizuar
    // me të njëjtin zmadhim/zhvendosje, por s'preket nga laps/zhbëj/fshi (s'është vizatim i përdoruesit).
    var numratSvg = document.createElementNS(SVGNS, 'svg');
    numratSvg.setAttribute('class', 'lexim-numrat');
    kuti.insertBefore(numratSvg, kuti.querySelector('.lexim-foto-kontrolle'));
    var numratRreshtat = [];
    function vizatoNumrat() {
      numratSvg.textContent = '';
      if (!img.naturalWidth) return;
      var rrezja = Math.max(16, img.naturalWidth / 55);
      numratRreshtat.forEach(function (r, i) {
        if (r.x == null || r.y == null) return;
        // Zhvendos majtas (jashtë tekstit të rreshtit), jo mbi vetë barkodin: rrezja e rrethit + hapësirë e vogël.
        var cx = r.x * img.naturalWidth - rrezja * 1.3, cy = r.y * img.naturalHeight;
        var rrethi = document.createElementNS(SVGNS, 'circle');
        rrethi.setAttribute('cx', cx); rrethi.setAttribute('cy', cy); rrethi.setAttribute('r', rrezja);
        rrethi.setAttribute('fill', '#fff'); rrethi.setAttribute('stroke', '#e53935'); rrethi.setAttribute('stroke-width', String(rrezja / 4.5));
        var teksti = document.createElementNS(SVGNS, 'text');
        teksti.setAttribute('x', cx); teksti.setAttribute('y', cy);
        teksti.setAttribute('text-anchor', 'middle'); teksti.setAttribute('dominant-baseline', 'central');
        teksti.setAttribute('fill', '#e53935'); teksti.setAttribute('font-weight', '800'); teksti.setAttribute('font-size', String(rrezja * 1.15));
        teksti.textContent = String(i + 1);
        numratSvg.appendChild(rrethi); numratSvg.appendChild(teksti);
      });
    }
    var vizatime = [], laps = false, celesiVizatimeve = null, vizaAktive = null;
    function pikaNeFoto(ev) { var p = pika(ev); return [(p[0] - x) / s, (p[1] - y) / s]; }
    function dNgaPikat(pp) {
      return pp.map(function (q, i) { return (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join('') + (pp.length === 1 ? 'l0.1 0' : '');
    }
    function vizatoTeGjitha() {
      svg.textContent = '';
      vizatime.forEach(function (v) {
        var path = document.createElementNS(SVGNS, 'path');
        path.setAttribute('d', dNgaPikat(v.p));
        path.setAttribute('fill', 'none'); path.setAttribute('stroke', '#e53935'); path.setAttribute('stroke-opacity', '0.9');
        path.setAttribute('stroke-width', String(v.w)); path.setAttribute('stroke-linecap', 'round'); path.setAttribute('stroke-linejoin', 'round');
        svg.appendChild(path);
        v.el = path;
      });
      rifreskoButonatELapsit();
    }
    function rifreskoButonatELapsit() {
      $('lxZhbejVize').disabled = !vizatime.length;
      $('lxFshiVizat').disabled = !vizatime.length;
    }
    function ruajVizatimet() {
      if (!celesiVizatimeve) return;
      try {
        if (vizatime.length) localStorage.setItem(celesiVizatimeve, JSON.stringify(vizatime.map(function (v) { return { w: v.w, p: v.p }; })));
        else localStorage.removeItem(celesiVizatimeve);
      } catch (e) { /* p.sh. hapësirë e plotë — vizatimet mbeten vetëm në këtë seancë */ }
    }
    function zhbejVizatimin() { if (vizatime.length) { vizatime.pop(); vizatoTeGjitha(); ruajVizatimet(); } }
    function vendosLapsin(po) {
      laps = po;
      $('lxLaps').classList.toggle('aktiv', po);
      kuti.classList.toggle('laps', po);
      $('lxNdihme').textContent = po
        ? '✎ Laps: vizato me maus mbi rreshtin e kontrolluar · Rrota: zmadho/zvogëlo · Për ta lëvizur foton: fik lapsin ose tërhiq me butonin e djathtë · Ctrl+Z: zhbëj'
        : 'Rrota e mausit: zmadho/zvogëlo · Tërhiq me maus: lëviz · Dy klikime: zmadho ose përshtat · ✎ Laps: shëno me të kuqe';
    }
    function zbato() {
      img.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + s + ')';
      svg.style.transform = img.style.transform;
      numratSvg.style.transform = img.style.transform;
    }
    function kufizo() {
      var w = img.naturalWidth * s, h = img.naturalHeight * s, kw = kuti.clientWidth, kh = kuti.clientHeight;
      x = w <= kw ? (kw - w) / 2 : Math.min(0, Math.max(kw - w, x));
      y = h <= kh ? (kh - h) / 2 : Math.min(0, Math.max(kh - h, y));
    }
    function pershtat() {
      if (!img.naturalWidth || !kuti.clientWidth) return;
      svg.setAttribute('width', img.naturalWidth); svg.setAttribute('height', img.naturalHeight);
      svg.setAttribute('viewBox', '0 0 ' + img.naturalWidth + ' ' + img.naturalHeight);
      numratSvg.setAttribute('width', img.naturalWidth); numratSvg.setAttribute('height', img.naturalHeight);
      numratSvg.setAttribute('viewBox', '0 0 ' + img.naturalWidth + ' ' + img.naturalHeight);
      vizatoNumrat();
      sMin = s = Math.min(kuti.clientWidth / img.naturalWidth, kuti.clientHeight / img.naturalHeight);
      kufizo(); zbato();
    }
    function zmadho(faktori, cx, cy) {
      if (!img.naturalWidth) return;
      if (cx == null) { cx = kuti.clientWidth / 2; cy = kuti.clientHeight / 2; }
      var sRe = Math.min(sMin * 12, Math.max(sMin, s * faktori));
      x = cx - (cx - x) * sRe / s;
      y = cy - (cy - y) * sRe / s;
      s = sRe;
      kufizo(); zbato();
    }
    function pika(ev) { var r = kuti.getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top]; }
    img.addEventListener('load', pershtat);
    kuti.addEventListener('wheel', function (ev) {
      if (!img.naturalWidth) return;
      ev.preventDefault();
      var dy = ev.deltaMode === 1 ? ev.deltaY * 16 : ev.deltaY;
      var p = pika(ev);
      zmadho(Math.exp(-dy * 0.0015), p[0], p[1]);
    }, { passive: false });
    kuti.addEventListener('contextmenu', function (ev) { if (laps) ev.preventDefault(); });
    kuti.addEventListener('pointerdown', function (ev) {
      if (!img.naturalWidth || ev.target.closest('button')) return;
      // Me laps: butoni i majtë vizaton; i djathti (ose i mesmi) e lëviz foton
      if (laps && ev.button === 0) {
        var q = pikaNeFoto(ev);
        vizaAktive = { w: Math.max(1, 3.5 / s), p: [q] };
        vizatime.push(vizaAktive);
        vizatoTeGjitha();
        kuti.setPointerCapture(ev.pointerId);
        vizaAktive.id = ev.pointerId;
        ev.preventDefault();
        return;
      }
      if (ev.button !== 0 && !(laps && (ev.button === 2 || ev.button === 1))) return;
      terheqje = { id: ev.pointerId, px: ev.clientX, py: ev.clientY, x: x, y: y };
      kuti.setPointerCapture(ev.pointerId);
      kuti.classList.add('terhiqet');
      ev.preventDefault();
    });
    kuti.addEventListener('pointermove', function (ev) {
      if (vizaAktive && ev.pointerId === vizaAktive.id) {
        var q = pikaNeFoto(ev), f = vizaAktive.p[vizaAktive.p.length - 1];
        if (Math.abs(q[0] - f[0]) * s + Math.abs(q[1] - f[1]) * s < 1.5) return;
        vizaAktive.p.push(q);
        vizaAktive.el.setAttribute('d', dNgaPikat(vizaAktive.p));
        return;
      }
      if (!terheqje || ev.pointerId !== terheqje.id) return;
      x = terheqje.x + ev.clientX - terheqje.px;
      y = terheqje.y + ev.clientY - terheqje.py;
      kufizo(); zbato();
    });
    function mbaroTerheqjen(ev) {
      if (vizaAktive && ev.pointerId === vizaAktive.id) { vizaAktive = null; ruajVizatimet(); rifreskoButonatELapsit(); return; }
      if (!terheqje || ev.pointerId !== terheqje.id) return;
      terheqje = null;
      kuti.classList.remove('terhiqet');
    }
    kuti.addEventListener('pointerup', mbaroTerheqjen);
    kuti.addEventListener('pointercancel', mbaroTerheqjen);
    kuti.addEventListener('dblclick', function (ev) {
      if (ev.target.closest('button') || laps) return;
      if (s > sMin * 1.05) { pershtat(); return; }
      var p = pika(ev);
      zmadho(3, p[0], p[1]);
    });
    $('lxZmadho').addEventListener('click', function () { zmadho(1.5); });
    $('lxZvogelo').addEventListener('click', function () { zmadho(1 / 1.5); });
    $('lxPershtat').addEventListener('click', pershtat);
    $('lxLaps').addEventListener('click', function () { vendosLapsin(!laps); });
    $('lxZhbejVize').addEventListener('click', zhbejVizatimin);
    $('lxFshiVizat').addEventListener('click', async function () {
      if (!vizatime.length) return;
      if (!(await konfirmo('Të fshihen krejt vizatimet?', 'Vijat e kuqe në foto hiqen.', 'Fshi'))) return;
      vizatime = []; vizatoTeGjitha(); ruajVizatimet();
    });
    document.addEventListener('keydown', function (ev) {
      if (!$('dlgLexim').classList.contains('hapur') || !(ev.ctrlKey || ev.metaKey) || ev.key.toLowerCase() !== 'z') return;
      if (ev.target && /^(INPUT|TEXTAREA)$/.test(ev.target.tagName)) return; // Ctrl+Z në fushë = zhbëj tekstin
      ev.preventDefault();
      zhbejVizatimin();
    });
    window.addEventListener('resize', function () {
      if (!$('dlgLexim').classList.contains('hapur')) return;
      if (s <= sMin * 1.001) pershtat(); else { kufizo(); zbato(); }
    });
    return {
      pastro: function () {
        img.removeAttribute('src'); img.style.transform = ''; svg.style.transform = ''; numratSvg.style.transform = ''; s = sMin = 1; x = y = 0;
        vizatime = []; vizaAktive = null; celesiVizatimeve = null; vendosLapsin(false); vizatoTeGjitha();
        numratRreshtat = []; vizatoNumrat();
      },
      // Numrat e rreshtave (rendi i tabelës), vendosur mbi foto sipas r.x/r.y (0..1) të secilit rresht.
      vendosNumrat: function (rreshtat) { numratRreshtat = rreshtat || []; vizatoNumrat(); },
      // Fletët nga telefoni: vizatimet ruhen me id-në e fletës (kthehen kur hapet sërish)
      caktoVizatimet: function (celesi) {
        celesiVizatimeve = celesi || null;
        vizatime = [];
        if (celesiVizatimeve) { try { vizatime = JSON.parse(localStorage.getItem(celesiVizatimeve) || '[]') || []; } catch (e) { vizatime = []; } }
        vizatoTeGjitha();
      },
      fshiVizatimet: function (celesi) { try { localStorage.removeItem(celesi); } catch (e) { /* ok */ } }
    };
  })();

  function statusiLeximit(tekst, gabim, spinner) {
    var s = $('lxStatusi');
    s.className = 'lexim-statusi' + (gabim ? ' gabim' : '');
    s.textContent = '';
    if (spinner) s.appendChild(el('span', 'nd-spinner'));
    s.appendChild(el('span', null, tekst));
  }
  var MESAZHET_AI = {
    'pa-konfigurim': 'Leximi automatik me AI s\'është aktivizuar ende. Shkruaji rreshtat me dorë duke parë foton (zmadhoje me rrotën e mausit).',
    'pa-hyrje': 'Për leximin me AI duhet të jesh i kyçur në llogari. Deri atëherë, shkruaji rreshtat me dorë.',
    'rrjeti': 'S\'ka lidhje me internetin. Shkruaji rreshtat me dorë ose provo përsëri.',
    'foto-shume-e-madhe': 'Fotoja është shumë e madhe. Provo përsëri.',
    'pa-celes': 'Leximi me AI s\'është konfiguruar plotësisht (mungon çelësi API në Worker). Shkruaji rreshtat me dorë.',
    'ai': 'Shërbimi i AI-së s\'u përgjigj për momentin. Provo përsëri pas pak, ose shkruaji rreshtat me dorë.',
    'origjina': 'Kjo adresë nuk lejohet nga shërbimi i leximit. Shkruaji rreshtat me dorë.'
  };

  function rreshtatNgaAI(rreshtat) {
    return (rreshtat || []).map(function (r) {
      return { barkodi: r.barkodi || '', emri: r.emri || emriNgaBarkodi(r.barkodi), data: r.data || '', dataOrigjinale: r.dataOrigjinale || '',
        sasia: r.sasia === undefined ? '' : r.sasia, furnizuesi: r.furnizuesi || furnizuesiNgaBarkodi(r.barkodi), dyshim: !!r.dyshim,
        x: typeof r.x === 'number' ? r.x : null, y: typeof r.y === 'number' ? r.y : null };
    });
  }

  // ---------- Fletët e dërguara nga telefoni ----------
  // Telefoni e fotografon dhe e lexon fletën, pastaj e dërgon këtu (Firebase: dyqane/{uid}/fletet).
  // Fleta NUK hapet vetë: del si njoftim (numri blu te "Afatet" në menunë anësore + kartë te faqja e
  // afateve), dhe përdoruesi e hap kur të ketë kohë — edhe ditë më vonë. Mbetet në pritje edhe kur
  // mbyllet me "Anulo"; fshihet vetëm pas "Ruaj" ose me butonin "Fshi".
  var fletetTel = { lista: [], degjuesi: null, hapur: null, teMbyllura: {}, njoftuar: {} };
  var IKONA_FLETA = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6M8 13h8M8 17h5"></path></svg>';
  function nisDegjuesinEFleteve() {
    ndalDegjuesinEFleteve();
    if (!window.__stokuCloud || !window.__stokuCloud.degjoFletet) return;
    var ePara = true;
    fletetTel.degjuesi = window.__stokuCloud.degjoFletet(function (lista) {
      fletetTel.lista = lista.filter(function (f) { return !fletetTel.teMbyllura[f.id]; });
      var teReja = fletetTel.lista.filter(function (f) { return !fletetTel.njoftuar[f.id]; });
      teReja.forEach(function (f) { fletetTel.njoftuar[f.id] = true; });
      if (teReja.length) {
        var n = fletetTel.lista.length;
        toast(ePara ? (n === 1 ? 'Ke 1 fletë nga telefoni që pret kontrollin.' : 'Ke ' + n + ' fleta nga telefoni që presin kontrollin.')
          : 'Mbërriti ' + (teReja[0].lloji === 'stok' ? 'një fletë stoku' : 'një fletë afatesh') + ' nga telefoni' + (teReja[0].nga ? ' (' + teReja[0].nga + ')' : '') + '.',
          { veprimi: function () { hapFletenETelefonit(teReja[0].id); }, butoni: 'Hape', ms: 12000 });
      }
      ePara = false;
      renderFletetETelefonit();
    }, function () { /* rregullat e Firebase-it s'e lejojnë ende — s'pengon asgjë tjetër */ });
  }
  function ndalDegjuesinEFleteve() {
    if (fletetTel.degjuesi) { try { fletetTel.degjuesi(); } catch (e) { /* ok */ } }
    fletetTel.degjuesi = null;
    fletetTel.lista = [];
    renderFletetETelefonit();
  }
  function renderFletetETelefonit() {
    // Fletët e stokut shkojnë te faqja e Stokut (Përmbledhja); fletët e afateve te faqja e Afateve —
    // secila lloj duket vetëm aty ku i përket, jo të dyja gjithmonë te Afatet.
    // v230: fletët e stokut = "Importo stokun", fletët e afateve = "Lexo fletën me AI"
    var stok = leja('stokuImporto') ? fletetTel.lista.filter(function (f) { return f.lloji === 'stok'; }) : [];
    var afatetLista = leja('afatetAI') ? fletetTel.lista.filter(function (f) { return f.lloji !== 'stok'; }) : [];
    $('stokTabFleta').innerHTML = stok.length ? IKONA_FLETA.replace(/22/g, '12') : '';
    if (stok.length) $('stokTabFleta').appendChild(document.createTextNode(String(stok.length)));
    $('afTabFleta').innerHTML = afatetLista.length ? IKONA_FLETA.replace(/22/g, '12') : '';
    if (afatetLista.length) $('afTabFleta').appendChild(document.createTextNode(String(afatetLista.length)));
    $('afPllFleta').innerHTML = $('afTabFleta').innerHTML; // v213: edhe te pllaka "Afatet"
    function vizato(kontejneri, lista) {
      kontejneri.textContent = '';
      lista.forEach(function (f) {
        var r = el('div', 'fleta-tel');
        var ik = el('span', 'ikona'); ik.innerHTML = IKONA_FLETA; r.appendChild(ik);
        var tx = el('div', 'teksti');
        var nr = (f.rreshtat || []).length;
        tx.appendChild(el('b', null, (f.lloji === 'stok' ? 'Fletë stoku' : 'Fletë afatesh') + ' nga telefoni: ' + (nr === 1 ? '1 rresht pret kontrollin' : nr + ' rreshta presin kontrollin')));
        tx.appendChild(el('span', null, [f.nga ? 'Dërguar nga ' + f.nga : 'Dërguar nga telefoni', f.krijuarSe ? dataOra(f.krijuarSe) : ''].filter(Boolean).join(' · ')));
        r.appendChild(tx);
        var h = el('button', 'btn', 'Hape'); h.type = 'button';
        h.addEventListener('click', function () { hapFletenETelefonit(f.id); });
        var fs = el('button', 'btn tekst', 'Fshi'); fs.type = 'button'; fs.title = 'Hiqe pa e kontrolluar';
        fs.addEventListener('click', async function () {
          var po = await konfirmo('Të fshihet fleta?', 'Rreshtat e kësaj flete nuk do të ' + (f.lloji === 'stok' ? 'shtohen te stoku' : 'shtohen te afatet') + '.', 'Fshi');
          if (po) hiqFletenETelefonit(f.id);
        });
        r.appendChild(h); r.appendChild(fs);
        kontejneri.appendChild(r);
      });
    }
    vizato($('stokFletetTel'), stok);
    vizato($('afFletetTel'), afatetLista);
  }
  function hiqFletenETelefonit(id) {
    fotoPamja.fshiVizatimet('stoku:vizatime:' + id);
    fletetTel.teMbyllura[id] = true;
    fletetTel.lista = fletetTel.lista.filter(function (f) { return f.id !== id; });
    if (window.__stokuCloud && window.__stokuCloud.fshijFleten) window.__stokuCloud.fshijFleten(id);
    renderFletetETelefonit();
  }
  function hapFletenETelefonit(id) {
    if (fletetTel.hapur || $('dlgLexim').classList.contains('hapur')) return;
    var f = null;
    fletetTel.lista.forEach(function (x) { if (x.id === id) f = x; });
    if (!f || !leja(f.lloji === 'stok' ? 'stokuImporto' : 'afatetAI')) return;
    fletetTel.hapur = f.id;
    lxSeanca++; // një lexim me AI që ende s'ka mbaruar s'e mbishkruan më këtë fletë
    var stok = f.lloji === 'stok';
    if (stok && pamja === 'afatet') shkoTe('permbledhja'); // fletë stoku: mos e lër faqen prapa te Afatet
    vendosPamjenELeximit(stok ? 'stok' : 'afatet');
    lx.rreshtat = stok ? rreshtatStokNgaAI(f.rreshtat) : rreshtatNgaAI(f.rreshtat);
    fotoPamja.pastro();
    fotoPamja.caktoVizatimet('stoku:vizatime:' + f.id);
    hapDialog('dlgLexim');
    if (typeof f.foto === 'string' && f.foto.indexOf('data:image/') === 0) $('lxFoto').src = f.foto;
    var origjina = (f.nga ? ' (' + f.nga + ')' : '') + (f.krijuarSe ? ', ' + dataOra(f.krijuarSe) : '');
    if (stok) {
      statusiLeximit('Fletë stoku nga telefoni' + origjina + ': ' + nrEmer(lx.rreshtat.length, 'rresht', 'rreshta') + '. Krahasoji me foton dhe korrigjo ku duhet.', false);
    } else {
      var nd = lx.rreshtat.filter(function (r) { return r.dyshim; }).length;
      statusiLeximit('Fletë nga telefoni' + origjina + ': ' +
        nrEmer(lx.rreshtat.length, 'rresht', 'rreshta') + '. Krahasoji me foton dhe korrigjo ku duhet' + (nd ? '. ' + (nd === 1 ? '1 është shënuar me të verdhë si i paqartë.' : nd + ' janë shënuar me të verdhë si të paqarta.') : '.'), false);
    }
    if (!lx.rreshtat.length) shtoRreshtLeximi(); else renderLeximinPc();
  }
  // Thirret kur mbyllet kontrolli i fletës: pas "Ruaj" fshihet; pas "Anulo" mbetet në pritje për më vonë
  function mbyllFletenETelefonit(uRuajt) {
    var id = fletetTel.hapur;
    if (!id) return;
    fletetTel.hapur = null;
    if (uRuajt) hiqFletenETelefonit(id);
  }

  // ---------- Skedarët e dërguar nga telefoni ose PDA-ja (v227) ----------
  // Excel dhe PDF që telefoni i dërgon këtu ("Excel dhe PDF në PC"; skedaret.js: dyqane/{uid}/skedaret) dalin si karta te
  // Përmbledhja, me "Shkarko" dhe "Fshi", dhe si njoftim kur mbërrijnë. Numri i atyre që s'janë shkarkuar ende del te
  // pllaka "Stoku". Mbahen 7 ditë: të skaduarit i fshin vetë PC-ja.
  var skedaretTel = { lista: [], degjuesi: null, njoftuar: {}, duke: {} };
  var IKONA_SKEDARI = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6M12 11v7M9 15l3 3 3-3"></path></svg>';
  function nisDegjuesinESkedareve() {
    ndalDegjuesinESkedareve();
    var c = window.__stokuCloud, sk = c && c.skedaret;
    if (!sk || !perdoruesi()) return;
    var ePara = true;
    skedaretTel.degjuesi = sk.degjo(function (lista) {
      lista = sk.pastroTeSkaduarat(lista);
      skedaretTel.lista = lista;
      var teReja = lista.filter(function (x) { return !skedaretTel.njoftuar[x.id]; });
      teReja.forEach(function (x) { skedaretTel.njoftuar[x.id] = true; });
      if (ePara) {
        var n = lista.filter(function (x) { return !x.shkarkuarSe; }).length;
        if (n) toast(n === 1 ? 'Ke 1 skedar nga telefoni për ta shkarkuar.' : 'Ke ' + n + ' skedarë nga telefoni për t\'i shkarkuar.',
          { veprimi: function () { shkoTe('permbledhja'); }, butoni: 'Shiko', ms: 9000 });
      } else if (teReja.length) {
        var x = teReja[0];
        toast('Mbërriti nga ' + (x.pajisja || 'telefoni') + ': ' + x.emri, { veprimi: function () { shkarkoSkedarinETelefonit(x.id); }, butoni: 'Shkarko', ms: 15000 });
      }
      ePara = false;
      renderSkedaretETelefonit();
    }, function () { /* rregullat e Firebase-it s'e lejojnë ende: s'pengon asgjë tjetër */ });
  }
  function ndalDegjuesinESkedareve() {
    if (skedaretTel.degjuesi) { try { skedaretTel.degjuesi(); } catch (e) { /* ok */ } }
    skedaretTel.degjuesi = null;
    skedaretTel.lista = [];
    renderSkedaretETelefonit();
  }
  function renderSkedaretETelefonit() {
    var S = window.StokuSkedaret;
    var n = skedaretTel.lista.filter(function (x) { return !x.shkarkuarSe; }).length;
    var cip = $('stokTabSkedaret');
    cip.innerHTML = n ? IKONA_SKEDARI.replace(/22/g, '12') : '';
    if (n) cip.appendChild(document.createTextNode(String(n)));
    var k = $('skedaretTel');
    k.textContent = '';
    skedaretTel.lista.forEach(function (x) {
      var r = el('div', 'fleta-tel' + (x.shkarkuarSe ? ' shkarkuar' : ''));
      var ik = el('span', 'ikona'); ik.innerHTML = IKONA_SKEDARI; r.appendChild(ik);
      var tx = el('div', 'teksti');
      var lloji = x.lloji === 'pdf' ? 'PDF' : x.lloji === 'xlsx' ? 'Excel' : 'Skedar';
      tx.appendChild(el('b', null, lloji + ' nga ' + (x.pajisja || 'telefoni') + ': ' + x.emri));
      tx.appendChild(el('span', null, [S ? S.madhesiaTekst(x.madhesia) : '', x.krijuarSe ? dataOra(x.krijuarSe) : '',
        x.shkarkuarSe ? 'U shkarkua' : 'Pa u shkarkuar ende'].filter(Boolean).join(' · ')));
      r.appendChild(tx);
      var h = el('button', 'btn', skedaretTel.duke[x.id] ? 'Duke shkarkuar…' : 'Shkarko'); h.type = 'button';
      h.disabled = !!skedaretTel.duke[x.id];
      h.addEventListener('click', function () { shkarkoSkedarinETelefonit(x.id); });
      var fs = el('button', 'btn tekst', 'Fshi'); fs.type = 'button'; fs.title = 'Hiqe nga lista';
      fs.addEventListener('click', async function () {
        var po = await konfirmo('Të fshihet skedari?', '"' + x.emri + '" hiqet nga lista. Nga telefoni mund ta dërgosh sërish.', 'Fshi');
        if (po) fshiSkedarinETelefonit(x.id);
      });
      r.appendChild(h); r.appendChild(fs);
      k.appendChild(r);
    });
  }
  function skedariITelefonit(id) {
    var f = null;
    skedaretTel.lista.forEach(function (x) { if (x.id === id) f = x; });
    return f;
  }
  async function shkarkoSkedarinETelefonit(id) {
    var x = skedariITelefonit(id), c = window.__stokuCloud, sk = c && c.skedaret;
    if (!x || !sk || skedaretTel.duke[id]) return;
    skedaretTel.duke[id] = true;
    renderSkedaretETelefonit();
    try {
      var bajtet = await sk.merr(x);
      shkarko(bajtet, x.emri, window.StokuSkedaret.mimeISkedarit(x));
      if (!x.shkarkuarSe) sk.shenoShkarkuar(x);
    } catch (e) {
      toast(e && e.message === 'jo-i-plote' ? 'Skedari s\'është i plotë. Dërgoje sërish nga telefoni.' : 'Shkarkimi dështoi. Kontrollo internetin dhe provo sërish.');
    } finally {
      delete skedaretTel.duke[id];
      renderSkedaretETelefonit();
    }
  }
  async function fshiSkedarinETelefonit(id) {
    var x = skedariITelefonit(id), c = window.__stokuCloud, sk = c && c.skedaret;
    if (!x || !sk) return;
    skedaretTel.lista = skedaretTel.lista.filter(function (y) { return y.id !== id; });
    renderSkedaretETelefonit();
    var r = await sk.fshij(x);
    if (!r.ok) toast('Fshirja dështoi. Provo sërish.');
  }

  // Çdo lexim ka numrin e vet: një lexim i anuluar që mbaron vonë s'i mbishkruan rreshtat e një leximi (ose flete) më të ri
  var lxSeanca = 0;
  async function lexoFletenPc(skedari) {
    if (!leja('afatetAI')) return;
    var seanca = ++lxSeanca;
    function iVjeteruar() { return seanca !== lxSeanca || !$('dlgLexim').classList.contains('hapur'); }
    lx.rreshtat = [];
    vendosPamjenELeximit('afatet');
    renderLeximinPc();
    fotoPamja.pastro();
    hapDialog('dlgLexim');
    statusiLeximit('Duke përgatitur foton…', false, true);
    var foto;
    try { foto = await AF.pergatitFoton(skedari); } catch (e) { if (!iVjeteruar()) statusiLeximit('Fotoja s\'u hap. Provo një foto tjetër (JPG/PNG).', true); return; }
    if (iVjeteruar()) return;
    $('lxFoto').src = foto.dataUrl;
    if (!perdoruesi()) { statusiLeximit(MESAZHET_AI['pa-hyrje'], true); shtoRreshtLeximi(); return; }
    statusiLeximit('Duke e lexuar fletën me AI… (zakonisht 5–20 sekonda)' + (foto.gjeresia ? ' · foto ' + foto.gjeresia + '×' + foto.lartesia + ' (' + (foto.gjeresia * foto.lartesia / 1e6).toFixed(1) + ' MP)' : ''), false, true);
    var tokeni = null;
    try { tokeni = window.__stokuCloud && window.__stokuCloud.token ? await window.__stokuCloud.token() : null; } catch (e) { /* ok */ }
    var rez = await AF.lexoMeAI(foto, tokeni);
    if (iVjeteruar()) return; // u anulua, ose u hap një lexim/fletë tjetër ndërkohë
    if (!rez.ok) {
      statusiLeximit(MESAZHET_AI[rez.gabim] || 'Fleta s\'u lexua (' + rez.gabim + '). Provo një foto më të qartë, ose shkruaji rreshtat me dorë.', true);
      shtoRreshtLeximi();
      return;
    }
    lx.rreshtat = rreshtatNgaAI(rez.rreshtat);
    var nd = lx.rreshtat.filter(function (r) { return r.dyshim; }).length;
    if (!lx.rreshtat.length) { statusiLeximit('Në foto s\'u gjet asnjë rresht me afat. Provo një foto më të qartë ose shkruaji me dorë.', true); shtoRreshtLeximi(); return; }
    statusiLeximit((lx.rreshtat.length === 1 ? 'U lexua 1 rresht. Krahasoje' : 'U lexuan ' + lx.rreshtat.length + ' rreshta. Krahasoji') + ' me foton dhe korrigjo ku duhet' + (nd ? '. ' + (nd === 1 ? '1 është shënuar me të verdhë si i paqartë.' : nd + ' janë shënuar me të verdhë si të paqarta.') : '.'), false);
    renderLeximinPc();
  }
  function shtoRreshtLeximi() {
    var fund = lx.rreshtat[lx.rreshtat.length - 1];
    lx.rreshtat.push({ barkodi: '', emri: '', data: '', dataOrigjinale: '', sasia: '', furnizuesi: fund ? fund.furnizuesi : '', dyshim: false, iRi: true });
    renderLeximinPc();
  }
  $('lxShto').addEventListener('click', function () {
    shtoRreshtLeximi();
    var rr = $('lxTrup').querySelectorAll('tr');
    if (rr.length) rr[rr.length - 1].querySelector('input').focus();
  });

  var LX_THEAD_AFATET = '<th style="width:34px">#</th><th style="width:140px">Barkodi</th><th>Emri i produktit</th><th style="width:150px">Data e skadimit</th><th style="width:80px">Sasia</th><th style="width:160px">Furnizuesi</th><th style="width:36px"></th>';
  var LX_THEAD_STOK = '<th style="width:34px">#</th><th style="width:150px">Barkodi</th><th>Emri i produktit</th><th style="width:90px">Sasia</th><th style="width:170px">Furnizuesi</th><th style="width:36px"></th>';
  var KEY_FOLDER_IMPORTIT_PC = 'stoku:import-stok:folderi';
  var LX_FOLDER_RI = '__ri__';
  function folderiIImportit() {
    var i = null;
    try { i = localStorage.getItem(KEY_FOLDER_IMPORTIT_PC); } catch (e) { /* ok */ }
    return (i && folderSipasId(i)) ? i : (foldera[0] ? foldera[0].id : '');
  }
  function mbushFolderatELeximit(zgjidhId) {
    var s = $('lxFolderi'); s.textContent = '';
    if (!foldera.length) { var o0 = el('option'); o0.value = ''; o0.textContent = 'Zgjidh folderin'; s.appendChild(o0); }
    foldera.forEach(function (f) { var o = el('option'); o.value = f.id; o.textContent = f.emri; s.appendChild(o); });
    var oRi = el('option'); oRi.value = LX_FOLDER_RI; oRi.textContent = '+ Folder i ri…'; if (leja('stokuFoldera')) s.appendChild(oRi); // si në telefon
    s.value = (zgjidhId && folderSipasId(zgjidhId)) ? zgjidhId : folderiIImportit();
  }
  $('lxFolderi').addEventListener('change', function () {
    var s = $('lxFolderi');
    if (s.value !== LX_FOLDER_RI) { try { localStorage.setItem(KEY_FOLDER_IMPORTIT_PC, s.value); } catch (e) { /* ok */ } return; }
    s.value = folderiIImportit(); // derisa të krijohet; me "Anulo" mbetet ky
    hapFolderIRi(function (idIRi) {
      try { localStorage.setItem(KEY_FOLDER_IMPORTIT_PC, idIRi); } catch (e) { /* ok */ }
      mbushFolderatELeximit(idIRi);
      var f = folderSipasId(idIRi);
      toast('Folderi "' + (f ? f.emri : '') + '" u krijua. Produktet do të importohen aty.');
    });
  });
  // Përgatit dialogun "Kontrollo fletën e lexuar" për njërin nga dy llojet: 'afatet' (parazgjedhur,
  // me datë) ose 'stok' (barkodi/emri/sasia/furnizuesi, plus zgjedhja e folderit).
  function vendosPamjenELeximit(lloji) {
    lx.lloji = lloji;
    var stok = lloji === 'stok';
    $('lxThead').innerHTML = stok ? LX_THEAD_STOK : LX_THEAD_AFATET;
    $('lxFolderKuti').style.display = stok ? '' : 'none';
    if (stok) mbushFolderatELeximit();
  }
  function rreshtatStokNgaAI(rreshtat) {
    return (rreshtat || []).map(function (r) {
      return { barkodi: r.barkodi || '', emri: r.emri || emriNgaBarkodi(r.barkodi), sasia: r.sasia === undefined ? '' : r.sasia, furnizuesi: r.furnizuesi || furnizuesiNgaBarkodi(r.barkodi),
        x: typeof r.x === 'number' ? r.x : null, y: typeof r.y === 'number' ? r.y : null };
    });
  }

  function renderLeximinPc() {
    var stok = lx.lloji === 'stok';
    var dl = $('afdFurnizuesit'); dl.textContent = '';
    furnizuesitPerSugjerim().forEach(function (f) { var o = el('option'); o.value = f; dl.appendChild(o); });
    var t = $('lxTrup');
    t.textContent = '';
    lx.rreshtat.forEach(function (r, i) {
      var tr = el('tr', stok ? '' : (r.data ? AF.statusi({ data: r.data }) : '') + (r.dyshim ? ' dyshim' : ''));
      tr.appendChild(el('td', null, String(i + 1)));
      function qeliza(lloji, vl, ph, vendos, klasa) {
        var td = el('td');
        var inp = el('input', 'inp' + (klasa ? ' ' + klasa : '')); inp.type = lloji; inp.value = vl || ''; inp.placeholder = ph; inp.setAttribute('aria-label', ph);
        inp.autocomplete = 'off'; inp.spellcheck = false;
        inp.addEventListener('input', function () { vendos(inp.value); });
        td.appendChild(inp);
        tr.appendChild(td);
        return { td: td, inp: inp };
      }
      var qe;
      var qb = qeliza('text', r.barkodi, 'Barkodi', function (v) { r.barkodi = v.trim(); }, 'mono');
      qb.inp.addEventListener('change', function () { if (!r.emri) { r.emri = emriNgaBarkodi(r.barkodi); qe.inp.value = r.emri; } });
      qe = qeliza('text', r.emri, 'Emri i produktit', function (v) { r.emri = v; });
      if (!stok) {
        var qd = qeliza('text', r.data ? AF.formatoPerFushe(r.data) : '', 'Data', function (v) {
          var iso = AF.lexoDatenEFushes(v) || '';
          r.data = iso; r.dyshim = false;
          tr.className = iso ? AF.statusi({ data: iso }) : '';
          sh.textContent = iso ? AF.pershkrimi({ data: iso }) : 'Shkruaj datën, p.sh. 31-12-26';
          sh.className = iso ? '' : 'paralajm';
        });
        AF.lidhFushenEDates(qd.inp);
        var sh = el('small', r.data ? '' : 'paralajm', (r.dataOrigjinale ? 'Në fletë: "' + r.dataOrigjinale + '" · ' : '') + (r.data ? AF.pershkrimi({ data: r.data }) : 'Data s\'u kuptua, zgjidhe me dorë'));
        qd.td.appendChild(sh);
      }
      // Shfaqet vetëm rezultati (fleta "60+30" → 90). Një shumë e shkruar me dorë kthehet në rezultat kur del nga fusha.
      var qs = qeliza('text', typeof r.sasia === 'number' ? String(r.sasia) : '', 'Sasia', function (v) {
        r.sasia = AF.lexoSasine(v); r.sasiaTx = v;
        shs.textContent = v && AF.lexoSasine(v) === '' ? 'Shkruaj numër, p.sh. 12' : '';
      });
      qs.inp.inputMode = 'numeric';
      qs.inp.addEventListener('change', function () { vendosRezultatinESasise(qs.inp); });
      var shs = el('small', 'paralajm');
      qs.td.appendChild(shs);
      var qf = qeliza('text', r.furnizuesi, 'Furnizuesi', function (v) { r.furnizuesi = v; });
      qf.inp.setAttribute('list', 'afdFurnizuesit');
      var tdx = el('td');
      var x = el('button', 'btn-ikone rrezik', '✕'); x.type = 'button'; x.title = 'Hiq rreshtin';
      x.addEventListener('click', function () { lx.rreshtat.splice(i, 1); renderLeximinPc(); });
      tdx.appendChild(x); tr.appendChild(tdx);
      t.appendChild(tr);
    });
    var n = lx.rreshtat.length;
    $('lxRuaj').textContent = n ? (stok ? 'Importo ' + n + (n === 1 ? ' produkt' : ' produkte') : 'Ruaj ' + n + (n === 1 ? ' afat' : ' afate')) : (stok ? 'Importo' : 'Ruaj');
    $('lxRuaj').disabled = !n;
    fotoPamja.vendosNumrat(lx.rreshtat);
  }

  async function anuloLeximin() {
    var kaTeDhena = lx.rreshtat.some(function (r) { return r.barkodi || r.emri || r.data || r.furnizuesi; });
    if (fletetTel.hapur) {
      kaTeDhena = false; // fleta nga telefoni mbetet në pritje — mund të hapet sërish më vonë
      // v210: fleta e stokut del te "Përmbledhja" (Stoku), ajo e afateve te "Afatet e produkteve"
      toast(lx.lloji === 'stok' ? 'Fleta e stokut mbeti në pritje. E gjen te "Përmbledhja".' : 'Fleta mbeti në pritje. E gjen te "Afatet e produkteve".');
    }
    if (kaTeDhena) {
      var po = await konfirmo('Të anulohet leximi?', 'Rreshtat e lexuar nuk do të ruhen.', 'Anulo leximin');
      if (!po) return;
    }
    lx.rreshtat = [];
    anuloLeximin.leje = true;
    mbyllDialog('dlgLexim');
    anuloLeximin.leje = false;
  }
  $('lxAnulo').addEventListener('click', anuloLeximin);
  $('lxMbyll').addEventListener('click', anuloLeximin);
  function mbyllLeximinPasRuajtjes() {
    lx.rreshtat = [];
    anuloLeximin.leje = true; mbyllDialog.uRuajt = true;
    mbyllDialog('dlgLexim');
    anuloLeximin.leje = false; mbyllDialog.uRuajt = false;
  }
  function ruajLeximinStok() {
    var fid = $('lxFolderi').value;
    if (!fid || !folderSipasId(fid)) { toast('Zgjidh folderin ku do të importohen produktet.'); return; }
    var teVlefshem = [], pa = 0;
    lx.rreshtat.forEach(function (r) {
      var bosh = !r.barkodi && !r.emri && !r.furnizuesi && (r.sasia === '' || r.sasia === undefined);
      if (bosh) return;
      var b = (r.barkodi || '').trim();
      if (!b || r.sasia === '' || r.sasia === undefined || (r.sasiaTx && AF.lexoSasine(r.sasiaTx) === '')) { pa++; return; }
      teVlefshem.push(r);
    });
    if (pa) {
      toast(pa === 1 ? '1 rresht s\'ka barkod ose sasi (numër i plotë). Plotësoje ose hiqe me ✕.' : pa + ' rreshta s\'kanë barkod ose sasi (numër i plotë). Plotësoji ose hiqi me ✕.', { ms: 4000 });
      return;
    }
    if (!teVlefshem.length) { mbyllLeximinPasRuajtjes(); return; }
    var tani = Date.now(), ndryshimet = {};
    var reg = ndrysho(function (api) {
      teVlefshem.forEach(function (r) {
        var b = r.barkodi.trim();
        var k = celesi(fid, b);
        var baza = ndryshimet[k] || produktet[k] || null;
        var emriRi = (baza && baza.emri) || (r.emri || '').trim();
        var furnizuesiRi = (baza && baza.furnizuesi) || (r.furnizuesi || '').trim();
        var sasiaRe = Math.max(0, (baza ? baza.sasia : 0) + r.sasia);
        var ri = { barkodi: b, emri: emriRi, sasia: sasiaRe, kategoriaId: fid, prekurSe: tani };
        if (furnizuesiRi) ri.furnizuesi = furnizuesiRi;
        ndryshimet[k] = ri;
        api.vendos(k, ri);
      });
    });
    var numri = Object.keys(ndryshimet).length;
    try { if (KJ()) KJ().mesoShume(teVlefshem.map(function (r) { return { barkodi: r.barkodi.trim(), emri: r.emri, furnizuesi: r.furnizuesi }; }), 'mbishkruaj'); } catch (e) { /* ok */ }
    mbyllLeximinPasRuajtjes();
    renderTabelenNeseDuhet();
    toast((numri === 1 ? 'U importua 1 produkt' : 'U importuan ' + numri + ' produkte') + ' në folderin "' + emriFolderit(fid) + '".' +
      (teVlefshem.length !== numri ? ' (disa rreshta u bashkuan te i njëjti barkod)' : ''), { veprimi: function () { zhbej(reg); }, ms: 9000 });
  }
  $('lxRuaj').addEventListener('click', function () {
    if (!leja(lx.lloji === 'stok' ? 'stokuImporto' : 'afatetAI')) return;
    if (lx.lloji === 'stok') { ruajLeximinStok(); return; }
    var teVlefshem = [], gabime = 0;
    lx.rreshtat.forEach(function (r) {
      if (!r.barkodi && !r.emri && !r.data) return;
      if (!AF.lexoDaten(r.data) || (!r.barkodi && !r.emri.trim()) || (r.sasiaTx && AF.lexoSasine(r.sasiaTx) === '')) { gabime++; return; }
      teVlefshem.push(r);
    });
    if (gabime) { toast(gabime + (gabime === 1 ? ' rresht s\'ka' : ' rreshta s\'kanë') + ' datë ose emër/barkod (ose sasia s\'është numër). Plotësoji ose hiqi me ✕.', { ms: 4500 }); return; }
    var mkId = marketiPerTeReja(); // v241
    if (mkId === undefined) return;
    var tani = Date.now(), perseritur = 0;
    var ekz = {};
    // E njëjta datë e të njëjtit produkt në një market tjetër s'është përsëritje
    afatet.forEach(function (a) { if (a.statusi !== 'hequr') ekz[(a.m || '') + '|' + (a.barkodi || a.emri) + '|' + a.data] = true; });
    var shtuar = [];
    var reg = ndryshoAfatet(function (api) {
      teVlefshem.forEach(function (r, i) {
        var c = (mkId || '') + '|' + (r.barkodi || r.emri.trim()) + '|' + r.data;
        if (ekz[c]) { perseritur++; return; }
        ekz[c] = true;
        var a = { id: AF.idERe(), barkodi: r.barkodi, emri: r.emri.trim(), data: r.data, sasia: r.sasia === undefined ? '' : r.sasia, furnizuesi: r.furnizuesi.trim(), statusi: 'aktiv',
          krijuarSe: tani + i, krijuarNga: emriPerdoruesit(), ngaFoto: true };
        if (mkId) a.m = mkId;
        api.vendos(a);
        shtuar.push(a);
      });
    });
    try { if (KJ()) KJ().mesoShume(shtuar, 'mbishkruaj'); } catch (e) { /* ok */ } // të kontrolluara nga përdoruesi
    if (shtuar.length && perdoruesi() && ekK) ekK.afateTeReja(shtuar.length, true);
    lx.rreshtat = [];
    anuloLeximin.leje = true; mbyllDialog.uRuajt = true;
    mbyllDialog('dlgLexim');
    anuloLeximin.leje = false; mbyllDialog.uRuajt = false;
    var nk = shtuar.filter(function (a) { return AF.statusi(a) === 'skaduar'; }).length;
    var nv = shtuar.filter(function (a) { return AF.statusi(a) === 'afer'; }).length;
    af.filtri = nk ? 'skaduar' : nv ? 'afer' : 'aktive';
    if (pamja !== 'afatet') shkoTe('afatet'); else renderAfatetPc();
    toast((shtuar.length === 1 ? 'U ruajt 1 afat' : 'U ruajtën ' + shtuar.length + ' afate') + (perseritur ? ' (' + (perseritur === 1 ? '1 ekzistonte' : perseritur + ' ekzistonin') + ' tashmë)' : '') +
      (nk ? ' · ' + (nk === 1 ? '1 ka skaduar!' : nk + ' kanë skaduar!') : '') + (nv ? ' · ' + (nv === 1 ? '1 skadon' : nv + ' skadojnë') + ' brenda 30 ditëve' : '') + '.', { veprimi: function () { zhbejAfatet(reg); }, ms: 9000 });
  });

  // ---------- Filtri sipas muajit të skadimit ----------
  function vizatoMuajtEAfateve() {
    var c = $('afMuajt');
    var muajt = AF.muajtELista(filtroAfatet(true));
    if (af.muaji && !muajt.some(function (m) { return m.celes === af.muaji; })) muajt.push({ celes: af.muaji, n: 0, emri: AF.emriMuajit(af.muaji) });
    c.classList.toggle('fsheh', muajt.length < 2 && !af.muaji);
    c.textContent = '';
    [{ celes: '', emri: 'Të gjithë muajt', n: null }].concat(muajt).forEach(function (m) {
      var b = el('button', af.muaji === m.celes ? 'aktiv' : null); b.type = 'button';
      b.setAttribute('aria-pressed', String(af.muaji === m.celes));
      b.appendChild(document.createTextNode(m.emri));
      if (m.n !== null) b.appendChild(el('span', 'n', String(m.n)));
      b.addEventListener('click', function () { af.muaji = m.celes; renderAfatetPc(); });
      c.appendChild(b);
    });
  }

  // ---------- Excel i afateve ----------
  function hapEksportinEAfateve() {
    if (!leja('eksportExcel')) return;
    if (!afatetEMarketit().length) { toast('S\'ka afate për eksport.'); return; }
    var s = $('aeMuaji');
    s.textContent = '';
    var o0 = el('option', null, 'Të gjithë muajt'); o0.value = ''; s.appendChild(o0);
    AF.muajtELista(filtroAfatet(true)).forEach(function (m) { var o = el('option', null, m.emri + ' (' + m.n + ')'); o.value = m.celes; s.appendChild(o); });
    s.value = af.muaji && Array.prototype.some.call(s.options, function (o) { return o.value === af.muaji; }) ? af.muaji : '';
    $('aeFurn').value = '';
    mbushFurnizuesitEEksportit();
    rifreskoInfonEEksportit();
    hapDialog('dlgAfEksport', 'aeMuaji');
  }
  // Furnizuesit e muajit të zgjedhur, me numrin e afateve (zgjedhja ruhet nëse ka ende afate)
  function mbushFurnizuesitEEksportit() {
    var s = $('aeFurn'), para = s.value;
    var lista = AF.furnizuesitELista(filtroAfatet(true, $('aeMuaji').value));
    s.textContent = '';
    var o0 = el('option', null, 'Të gjithë furnizuesit'); o0.value = ''; s.appendChild(o0);
    lista.forEach(function (f) { var o = el('option', null, f.emri + ' (' + f.n + ')'); o.value = f.celes; s.appendChild(o); });
    s.value = lista.some(function (f) { return f.celes === para; }) ? para : '';
    $('aeFurnRresht').hidden = lista.length < 2;
  }
  function emriIFurnizuesitTeEksporti() {
    var s = $('aeFurn'), o = s.options[s.selectedIndex];
    return s.value && o ? o.textContent.replace(/\s*\(\d+\)$/, '') : '';
  }
  function afatetPerEksport(muaji, furn) {
    return filtroAfatet(true, muaji).filter(function (a) { return !furn || AF.celesiFurnizuesit(a) === furn; });
  }
  function rifreskoInfonEEksportit() {
    var n = afatetPerEksport($('aeMuaji').value, $('aeFurn').value).length, fe = emriIFurnizuesitTeEksporti();
    var st = { aktive: 'aktive', skaduar: 'të skaduara', afer: 'afër skadimit', ok: 'në rregull', hequr: 'të hequra' }[af.filtri] || '';
    $('aeInfo').textContent = n ? 'Do të eksportohen ' + (n === 1 ? '1 afat' : n + ' afate') + (af.filtri !== 'aktive' ? ' (' + st + ')' : '') + (fe ? ' të furnizuesit ' + fe : '') + (af.kerkimi ? ', sipas kërkimit' : '') + '.' : 'S\'ka afate ' + st + ' për këtë zgjedhje.';
    $('aeBtn').disabled = !n;
  }
  $('aeMuaji').addEventListener('change', function () { mbushFurnizuesitEEksportit(); rifreskoInfonEEksportit(); });
  $('aeFurn').addEventListener('change', rifreskoInfonEEksportit);
  $('aeBtn').addEventListener('click', function () { var m = $('aeMuaji').value, f = $('aeFurn').value, fe = emriIFurnizuesitTeEksporti(); mbyllDialog('dlgAfEksport'); eksportoAfatet(m, f, fe); });

  function eksportoAfatet(muaji, furn, emriFurn) {
    if (!afatetEMarketit().length) { toast('S\'ka afate për eksport.'); return; }
    muaji = muaji || ''; furn = furn || '';
    var lista = afatetPerEksport(muaji, furn);
    if (!lista.length) { toast('S\'ka afate për këtë zgjedhje.'); return; }
    function rresht(a) {
      var n = AF.ditetDeri(a.data);
      var st = AF.statusi(a);
      return [ST_EMRI[st], a.barkodi || '', a.emri || '', typeof a.sasia === 'number' ? a.sasia : '', a.furnizuesi || '', a.data || '', st === 'hequr' || n === null ? '' : n,
        AF.pershkrimi(a), a.hequrSe || '', a.krijuarNga || ''];
    }
    var kol = [
      { title: 'Statusi', width: 15 }, { title: 'Barkodi', width: 18 }, { title: 'Emri i produktit', width: 36 },
      { title: 'Sasia (copë)', width: 12, type: 'number' }, { title: 'Furnizuesi', width: 22 }, { title: 'Skadon më', width: 13, type: 'day' }, { title: 'Ditë të mbetura', width: 14, type: 'number' },
      { title: 'Çfarë duhet bërë', width: 60 },
      { title: 'Hequr nga rafti', width: 18, type: 'date' }, { title: 'Shtuar nga', width: 14 }
    ];
    var fletet = [{ name: 'Afatet', columns: kol, rows: lista.map(rresht), totalLabel: 'Gjithsej', totalColumns: [3] }];
    var perFurnizues = afatetEMarketit().filter(function (a) { var s = AF.statusi(a); return (s === 'afer' || s === 'skaduar') && (!muaji || AF.celesiMuajit(a) === muaji) && (!furn || AF.celesiFurnizuesit(a) === furn); })
      .sort(function (a, b) { return (a.furnizuesi || '~').localeCompare(b.furnizuesi || '~', 'sq') || String(a.data).localeCompare(String(b.data)); });
    if (perFurnizues.length) {
      fletet.push({ name: 'Për furnizuesit', columns: [
        { title: 'Furnizuesi', width: 22 }, { title: 'Emri i produktit', width: 36 }, { title: 'Barkodi', width: 18 },
        { title: 'Sasia (copë)', width: 12, type: 'number' }, { title: 'Skadon më', width: 13, type: 'day' }, { title: 'Ditë të mbetura', width: 14, type: 'number' }
      ], totalLabel: 'Gjithsej', totalColumns: [3], rows: perFurnizues.map(function (a) { return [a.furnizuesi || '(pa furnizues)', a.emri || '', a.barkodi || '', typeof a.sasia === 'number' ? a.sasia : '', a.data, AF.ditetDeri(a.data)]; }) });
    }
    if (muaji) fletet[0].name = AF.emriMuajit(muaji);
    if (emriFurn) fletet[0].name = emriFurn;
    var emri = 'afatet_' + (emriFurn && slug(emriFurn) ? slug(emriFurn) + '_' : '') + (muaji ? slug(AF.emriMuajit(muaji)) + '_' : '') + vulaKohore(true) + '.xlsx';
    shkarko(window.StokuXlsx.buildWorkbook(fletet), emri, MIME_XLSX);
    toast('U shkarkua: ' + emri);
  }

  setInterval(function () { if (!document.hidden) renderAfatetAnesore(); }, 10 * 60 * 1000);

  // ================= Nisja =================
  (function () {
    var h = hashIDekoduar();
    var ph = pamjaNgaHash(h);
    pamja = ph.pamja;
    if (ph.ekNen) ekNen = ph.ekNen;
    // Njoftimi "Hiqe nga rafti" hap "#/ekipa/njoftimet": Grupi + dritarja e njoftimeve
    if (h === '#/ekipa/njoftimet') {
      var hapNj = function () { if (window.StokuPorta && window.StokuPorta.eHapur()) return false; setTimeout(ekHapNjoftimet, 300); return true; };
      if (!hapNj()) window.addEventListener('stoku-porta-hapur', hapNj, { once: true });
    }
    history.replaceState(null, '', hashPer(pamja));
  })();
  rifreskoLlogarine();
  // v230: lejet e fundit të kësaj pajisjeje vlejnë që në hapje (pastaj i konfirmon Firebase)
  if (lejetG) lejetG.rinis();
  zbatoLejet(true);
  rivizato();
  // Rifreskon kohët relative ("para 5 min") çdo minutë
  // Te tabela e produkteve rifreskohen vetëm qelizat e kohës (jo krejt 500 rreshtat); faqet e tjera rivizatohen
  setInterval(function () {
    if (document.hidden) return;
    if (pamja !== 'permbledhja' && pamja !== 'afatet' && pamja !== 'ekipi') {
      Array.prototype.forEach.call(document.querySelectorAll('#tabelaTrup td.k-koha[data-koha]'), function (td) {
        var t = kohaRelative(Number(td.dataset.koha) || 0);
        if (td.textContent !== t) td.textContent = t;
      });
      return;
    }
    if (!dialogISiperm() && !poShkruan(document.activeElement)) rivizato();
  }, 60000);
  if (window.__stokuCloud) kurNdryshonLlogaria();

  // ================= "Çka ka të re" =================
  var KEY_TE_REJAT = 'stoku:te-rejat:pare';
  function versioniIPare() { try { return Number(localStorage.getItem(KEY_TE_REJAT)) || 0; } catch (e) { return 0; } }
  function shenoTeRejatSiTePara() { try { localStorage.setItem(KEY_TE_REJAT, String(window.StokuTeRejat.versioni())); } catch (e) { /* ok */ } }
  function tregoTeRejat() {
    var TR = window.StokuTeRejat;
    if (!TR || !TR.versioni()) return false;
    if ((__pajisjeERe || ngaVizitori()) && !versioniIPare()) { shenoTeRejatSiTePara(); return false; } // vizitori i ri: pa listë përditësimesh
    var hyrjet = TR.teRejatPas(versioniIPare(), 'pc', eshteAdminiIStokut(), lejaPerTeRejat); // vetëm të rejat e kompjuterit
    if (!hyrjet.length) return false;
    if (window.StokuPorta && window.StokuPorta.eHapur()) return false;
    if (dialogISiperm()) return false;
    mbushTeRejat(hyrjet, hyrjet.length === 1 ? TR.etiketa(hyrjet[0]) : hyrjet.length + ' përditësime të reja');
    hapDialog('dlgTeRejat');
    setTimeout(function () { $('trMbyll').focus(); }, 30);
    return true;
  }
  function mbushTeRejat(hyrjet, nen) {
    var TR = window.StokuTeRejat;
    var lista = $('trLista');
    lista.textContent = '';
    hyrjet.forEach(function (h) {
      var b = el('div', 'tr-version');
      b.appendChild(el('div', 'tr-version-titulli', h.titulli));
      b.appendChild(el('div', 'tr-version-data', TR.etiketa(h)));
      var ul = el('ul');
      (h.pikat || []).forEach(function (pika) { ul.appendChild(el('li', null, pika)); });
      b.appendChild(ul);
      lista.appendChild(b);
    });
    $('trNen').textContent = nen;
    lista.scrollTop = 0;
  }
  // Nga Cilësimet → "Çka ka të re": 6 versionet e fundit të kompjuterit, kurdo
  // v237: politika e privatësisë (faqe më vete, në dritare të re)
  $('opsPrivatesia').addEventListener('click', function () { window.open('privatesia.html', '_blank', 'noopener'); });
  $('opsTeRejat').addEventListener('click', function () {
    var TR = window.StokuTeRejat;
    if (!TR || !TR.versioni()) return;
    var hyrjet = TR.teRejatPas(0, 'pc', eshteAdminiIStokut(), lejaPerTeRejat).slice(0, 6);
    if (!hyrjet.length) return;
    mbushTeRejat(hyrjet, 'Përditësimet e fundit');
    mbyllDialog('dlgOpsione'); // dritarja e të rejave del mbi faqe, jo poshtë Cilësimeve
    hapDialog('dlgTeRejat');
    setTimeout(function () { $('trMbyll').focus(); }, 30);
  });
  if (window.StokuTeRejat && window.StokuTeRejat.versioni()) $('opsVersioni').textContent = window.StokuTeRejat.emriVersionit(window.StokuTeRejat.versioni());

  // Shfaqet vetëm kur faqja shihet dhe s'ka përditësim në instalim (përndryshe rifreskimi e zhdukte menjëherë);
  // shënohet "e parë" vetëm kur mbyllet, jo kur shfaqet, që një rifreskim i papritur të mos e humbasë.
  var __teRejatShfaqur = false;
  function perditesimNeRruge(cb) {
    if (!('serviceWorker' in navigator)) { cb(false); return; }
    navigator.serviceWorker.getRegistration().then(function (r) { cb(!!(r && (r.installing || r.waiting))); }, function () { cb(false); });
  }
  function tregoTeRejatKurGati(prova) {
    prova = prova || 0;
    if (document.hidden) {
      var kurShihet = function () { if (document.hidden) return; document.removeEventListener('visibilitychange', kurShihet); setTimeout(tregoTeRejatKurGati, 1200); };
      document.addEventListener('visibilitychange', kurShihet);
      return;
    }
    perditesimNeRruge(function (po) {
      if (po && prova < 20) { setTimeout(function () { tregoTeRejatKurGati(prova + 1); }, 1500); return; } // rifreskimi vjen së shpejti
      if (tregoTeRejat()) __teRejatShfaqur = true;
    });
  }
  new MutationObserver(function () {
    if (__teRejatShfaqur && !$('dlgTeRejat').classList.contains('hapur')) { __teRejatShfaqur = false; shenoTeRejatSiTePara(); }
  }).observe($('dlgTeRejat'), { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('stoku-porta-hapur', function () { setTimeout(tregoTeRejatKurGati, 700); });
  setTimeout(function () { if (!(window.StokuPorta && window.StokuPorta.eHapur())) tregoTeRejatKurGati(); }, 2500);

  // ================= Service worker + përditësimi automatik =================
  // Sa herë hapet Stoku (dhe sa herë kthehesh në skedë), kontrollohet në sfond a ka version të ri (sw.js).
  // Nëse ka, instalohet dhe faqja rinis vetë në çastin e parë të qetë (pa dialog, pa fushë ku po shkruhet,
  // pa ruajtje në pritje) ose sapo skeda kalon në sfond. Faqja e hapur (#/...) ruhet nga vetë adresa.
  if ('serviceWorker' in navigator) {
    var __kishteKontrollues = !!navigator.serviceWorker.controller;
    var __perditesimGati = false, __perditesimKohez = null;
    var kontrolloPerditesimin = function () {
      navigator.serviceWorker.getRegistration().then(function (r) { if (r) return r.update(); }).catch(function () { /* pa internet */ });
    };
    var eshteCastIQete = function () {
      var a = document.activeElement;
      if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA') && a.value) return false;
      if (document.querySelector('.mbulese.hapur') || $('menu').classList.contains('hapur')) return false;
      if (sink.duke || sink.kohez) return false;
      return true;
    };
    var rinisKurTeJeteQete = function () {
      if (!__perditesimGati) return;
      // Në sfond: rinis menjëherë, por jo ndërsa një ruajtje në cloud është në rrugë
      if (document.hidden ? !(sink.duke || sink.kohez) : eshteCastIQete()) { location.reload(); return; }
      clearTimeout(__perditesimKohez);
      __perditesimKohez = setTimeout(rinisKurTeJeteQete, 10000);
    };
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!__kishteKontrollues) { __kishteKontrollues = true; return; } // instalimi i parë: faqja është tashmë e reja
      __perditesimGati = true;
      rinisKurTeJeteQete();
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) rinisKurTeJeteQete(); else kontrolloPerditesimin();
    });
    setInterval(function () { if (!document.hidden) kontrolloPerditesimin(); }, 30 * 60 * 1000);
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').then(function (r) { return r.update(); }).catch(function () { /* ok */ });
    });
  }

  // Për testim/diagnozë nga konsola
  window.__stokuPc = { gjendja: function () { return gjendjaLokale(); }, rivizato: rivizato };
})();
