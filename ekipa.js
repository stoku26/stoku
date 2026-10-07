/*
 * Ekipa — pjesa e përbashkët e telefonit (index.html) dhe kompjuterit (pc.html) për tabin "Ekipa".
 *
 * Çka ka brenda:
 *  1. krijoCloud(fs, db, auth, platforma) — leximet/shkrimet në Firestore për ekipën (v164: GRUPET):
 *       grupet/{g}                     → { emri, pronarUid, pronarEmri, krijuarSe } — secili grup është një ekipë më vete;
 *                                        anëtarët e një grupi s'shohin asgjë nga grupet e tjera
 *       grupet/{g}/anetaret/{uid}      → anëtarët + prania (roli 'pronar'|'anetar', aktivSe, online, platforma, sasiaShpejte)
 *       grupet/{g}/afatet/{uid}        → përmbledhja e afateve të secilit (vetëm afatet, jo stoku) — kolegët
 *                                        lexojnë këtë, jo dyqanin e plotë (dyqane/{uid} mbetet vetëm i pronarit)
 *       grupet/{g}/feed, grupet/{g}/chat, grupet/{g}/push → aktiviteti, chat-i, pajisjet për njoftimet push
 *       ftesat/{g}_{emri}              → ftesa e pronarit të grupit për një emër përdoruesi; i ftuari e pranon (ose jo)
 *       perdoruesit/{uid}.grupi        → treguesi i grupit (qasjen e jep vetëm anëtarësia te grupet/{g}/anetaret)
 *       perdoruesit/{uid}/njoftimet    → njoftimet personale (me `grupi`: vetëm brenda të njëjtit grup)
 *     Ekipa e vjetër (ekipa_anetaret, ekipa_feed, ekipa_chat…) kalon te grupi "ekipa": administratori e krijon dhe i
 *     kopjon historikun; anëtarët e pranuar më parë hyjnë vetë.
 *     Dyqani i secilit (dyqane/{uid}) mbetet i PRONARIT: askush tjetër s'shkruan aty. Kur një koleg e heq nga
 *     rafti një afat të skaduar të dikujt tjetër, i dërgon pronarit një njoftim; aplikacioni i pronarit e zbaton
 *     vetë (vetëm nëse afati ka skaduar vërtet dhe s'është ndryshuar pas heqjes).
 *     Aktiviteti, chat-i dhe njoftimet kalojnë nga një radhë lokale (localStorage): pa internet s'humbin, dërgohen
 *     sapo të ketë lidhje — edhe nëse aplikacioni mbyllet ndërkohë.
 *     Anëtarësia: një llogari e re s'sheh askënd derisa të krijojë grupin e vet ose të pranojë një ftesë.
 *  2. Funksione të pastra (pa DOM, testohen me node): koha relative, prania, mbivendosja e heqjeve,
 *     kalendari, statistikat, teksti i aktivitetit.
 *  3. krijoKontrollues(o) — mban gjendjen e ekipës (anëtarët, afatet e secilit, aktivitetin, chat-in,
 *     njoftimet) dhe dëgjuesit; faqja (telefon/PC) vetëm e vizaton kur thirret o.ndryshoi(…).
 */
(function (root) {
  'use strict';

  var ONLINE_MS = 4 * 60 * 1000;   // pa shenjë jete më shumë se kaq → s'numërohet më "online"
  var RRAHJA_MS = 90 * 1000;       // sa shpesh aplikacioni i hapur thotë "jam këtu"
  var ADMIN_EMRI = 'mendurberisha'; // pasqyron eshteAdmin() te rregullat e Firestore-it: llogaria (email-i i hyrjes) OSE perdoruesit/{uid}.emri
  var PERMBLEDHJA_HEQUR_DITE = 40; // të hequrat e kaq ditëve të fundit hyjnë te përmbledhja (statistikat e muajit)
  var PERMBLEDHJA_MAKS = 700 * 1024; // larg kufirit 1 MB të një dokumenti
  var RADHA_MAKS = 200;
  // Njoftimet push të chat-it (worker/stoku-push.js te Cloudflare). Çelësi publik VAPID: çifti i tij privat është
  // vetëm te Worker-i (VAPID_PRIVATE). Pa Worker-in (ose pa leje për njoftime) punohet si më parë.
  var PUSH_URL = 'https://stoku-push.mendurb.workers.dev';
  var PUSH_VAPID = 'BJ_OXYJsYC00MdMvM1z5WICalHw1CVDrDqNdIxi6zXLd7xIDXlxxCvi7qT9mA-o00zT5PRWGkI50UMMImh5DNyc';
  var KEY_PUSH = 'stoku:push:pajisja';      // { uid, id, endpoint, koha } — kjo pajisje është regjistruar
  var KEY_PUSH_SERVER = 'stoku:push:server'; // koha e përgjigjes së fundit të mirë nga Worker-i
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
  // 0. Fotot e profilit: ruhen te Worker-i (Cloudflare KV), jo te Firebase. Indeksi { uid: koha } mbahet edhe
  //    te localStorage që fotot të dalin menjëherë (edhe pa internet, nga cache-i i shfletuesit).
  //    Çdo vend me avatar thërret Fotot.apliko(el, { uid, emri }): ka foto → sfond me foton, përndryshe shkronja.
  // ======================================================================================
  var KEY_FOTOT = 'stoku:fotot:indeksi', KEY_FOTOT_EMRAT = 'stoku:fotot:emrat';
  var FOTO_MASA = 256, FOTO_CILESIA = 0.82;
  var Fotot = (function () {
    function lexo(k) { try { return JSON.parse(localStorage.getItem(k) || 'null') || {}; } catch (e) { return {}; } }
    function shkruaj(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ok */ } }
    var indeksi = lexo(KEY_FOTOT), emrat = lexo(KEY_FOTOT_EMRAT);
    function celesEmri(e) { return String(e || '').trim().toLowerCase(); }
    function url(u) { return u && indeksi[u] ? PUSH_URL + '/foto/' + encodeURIComponent(u) + '?v=' + indeksi[u] : ''; }
    function uidPer(kush) {
      if (!kush) return '';
      if (typeof kush === 'string') return emrat[celesEmri(kush)] || '';
      return kush.uid || emrat[celesEmri(kush.emri)] || '';
    }
    function vendos(el) {
      var src = url(el.getAttribute('data-foto-uid') || emrat[celesEmri(el.getAttribute('data-foto-emri'))] || '');
      if (src) { el.style.backgroundImage = 'url("' + src + '")'; el.classList.add('me-foto'); }
      else if (el.classList.contains('me-foto')) { el.style.backgroundImage = ''; el.classList.remove('me-foto'); }
    }
    function apliko(el, kush) {
      if (!el) return el;
      var u = typeof kush === 'string' ? '' : (kush && kush.uid) || '';
      el.setAttribute('data-foto-uid', u);
      el.setAttribute('data-foto-emri', typeof kush === 'string' ? kush : (kush && kush.emri) || '');
      vendos(el);
      return el;
    }
    function riapliko() {
      if (typeof document === 'undefined') return;
      Array.prototype.forEach.call(document.querySelectorAll('[data-foto-emri]'), vendos);
    }
    function vendosIndeksin(ind) {
      ind = ind && typeof ind === 'object' ? ind : {};
      if (JSON.stringify(ind) === JSON.stringify(indeksi)) return;
      indeksi = ind; shkruaj(KEY_FOTOT, indeksi); riapliko();
      try { window.dispatchEvent(new Event('stoku-fotot-ndryshuan')); } catch (e) { /* node */ }
    }
    function ndryshoNjeren(u, koha) {
      var ind = Object.assign({}, indeksi);
      if (koha) ind[u] = koha; else delete ind[u];
      vendosIndeksin(ind);
    }
    function vendosEmrat(lista) {
      var ri = Object.assign({}, emrat), ndr = false;
      (lista || []).forEach(function (a) {
        if (!a || !a.uid || !a.emri) return;
        var k = celesEmri(a.emri);
        if (ri[k] !== a.uid) { ri[k] = a.uid; ndr = true; }
      });
      if (!ndr) return;
      emrat = ri; shkruaj(KEY_FOTOT_EMRAT, emrat); riapliko();
    }
    // Fotoja e zgjedhur → katror 256×256 (prerë në mes), JPEG. Kthen Blob.
    function pergatit(skedari) {
      return new Promise(function (ok, gabim) {
        if (!skedari || !/^image\//.test(skedari.type || 'image/')) { gabim(new Error('jo-foto')); return; }
        var img = new Image(), src = URL.createObjectURL(skedari);
        img.onload = function () {
          try {
            var w = img.naturalWidth, h = img.naturalHeight, m = Math.min(w, h);
            if (!m) throw new Error('jo-foto');
            var c = document.createElement('canvas'); c.width = c.height = FOTO_MASA;
            var x = c.getContext('2d');
            x.fillStyle = '#fff'; x.fillRect(0, 0, FOTO_MASA, FOTO_MASA);
            x.imageSmoothingQuality = 'high';
            x.drawImage(img, (w - m) / 2, (h - m) / 2, m, m, 0, 0, FOTO_MASA, FOTO_MASA);
            URL.revokeObjectURL(src);
            c.toBlob(function (b) { if (b) ok(b); else gabim(new Error('jo-foto')); }, 'image/jpeg', FOTO_CILESIA);
          } catch (e) { URL.revokeObjectURL(src); gabim(e); }
        };
        img.onerror = function () { URL.revokeObjectURL(src); gabim(new Error('jo-foto')); };
        img.src = src;
      });
    }
    return { apliko: apliko, riapliko: riapliko, url: url, uidPer: uidPer, kaFoto: function (kush) { return !!url(uidPer(kush)); },
      vendosIndeksin: vendosIndeksin, ndryshoNjeren: ndryshoNjeren, vendosEmrat: vendosEmrat, pergatit: pergatit };
  })();

  // ======================================================================================
  // 1. Cloud
  // ======================================================================================
  function krijoCloud(fs, db, auth, platforma) {
    function uid() { return auth.currentUser ? auth.currentUser.uid : null; }
    function emri() { return auth.currentUser ? emriNgaEmail(auth.currentUser.email) : ''; }
    function gabim(e) { return { ok: false, kodi: e && e.code, arsye: String((e && e.message) || e), leje: eshteLeje(e) }; }
    function eshteLeje(e) { return !!e && (e.code === 'permission-denied' || /permission/i.test(String(e.message || ''))); }
    function pastro(o) { var r = {}; Object.keys(o).forEach(function (k) { if (o[k] !== undefined) r[k] = o[k]; }); return r; }
    function listaNga(s) { var l = []; s.forEach(function (d) { l.push(Object.assign({}, d.data(), { id: d.id })); }); return l; }
    function idERe() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6); }

    // ---------- Grupi aktual: krejt Ekipa lexohet/shkruhet brenda grupet/{grupi} ----------
    var grupi = null;
    function vendosGrupin(g) { grupi = g || null; }
    function rrG(k) { return ['grupet', grupi, k]; }

    // ---------- Radha e dërgimit (aktiviteti, chat-i, njoftimet) ----------
    // Çdo shkrim merr një id të caktuar dhe ruhet te localStorage derisa serveri ta pranojë. Pa internet, SDK-ja e
    // mban vetë sa kohë faqja është e hapur; nëse aplikacioni mbyllet para kësaj, dërgohet në hapjen tjetër.
    // Rregullat lejojnë vetëm krijimin, prandaj një dërgim i dytë i së njëjtës id refuzohet — s'ka dyfishime.
    var neRruge = {}; // id → premtimi i dërgimit në këtë sesion
    function celesiRadhes() { return 'stoku:ekipa:radha:' + uid(); }
    function lexoRadhen() {
      try { var l = JSON.parse(localStorage.getItem(celesiRadhes()) || '[]'); return Array.isArray(l) ? l : []; } catch (e) { return []; }
    }
    function ruajRadhen(l) { try { localStorage.setItem(celesiRadhes(), JSON.stringify(l.slice(-RADHA_MAKS))); } catch (e) { /* ok */ } }
    function hiqNgaRadha(id) { if (uid()) ruajRadhen(lexoRadhen().filter(function (x) { return x.id !== id; })); }
    function dergoOp(op, ngaRadha) {
      if (neRruge[op.id]) return neRruge[op.id];
      var te = op.te;
      if (ngaRadha && op.kohaEDergimit) te = Object.assign({}, te, { koha: Date.now() }); // chat-i: kur u dërgua vërtet
      var p;
      try { p = fs.setDoc(fs.doc.apply(null, [db].concat(op.rruga, [op.id])), te); }
      catch (e) { hiqNgaRadha(op.id); return Promise.resolve(gabim(e)); } // p.sh. rrugë e pavlefshme — s'riprovohet
      p = p.then(function () {
        hiqNgaRadha(op.id);
        // kolegët e marrin njoftimin edhe me aplikacion të mbyllur
        var g0 = op.rruga[0] === 'grupet' ? op.rruga[1] : '', lloji0 = op.rruga[0] === 'grupet' ? op.rruga[2] : op.rruga[0];
        if (lloji0 === 'chat' || lloji0 === 'ekipa_chat') njoftoPushChat(op.id, g0);
        if ((lloji0 === 'feed' || lloji0 === 'ekipa_feed') && /^kerkese-/.test(op.te.lloji)) njoftoPushKerkese(op.id, g0);
        return { ok: true, id: op.id };
      }, function (e) {
        // Vetëm gabimet e përkohshme (lidhja) riprovohen; "s'lejohet" (ose ekziston tashmë nga një dërgim i
        // mëparshëm) dhe të dhënat e pavlefshme hiqen nga radha — s'kanë kuptim të riprovohen.
        if (!/unavailable|deadline|resource-exhausted|aborted|internal|unknown|cancelled/.test(String(e && e.code))) { hiqNgaRadha(op.id); return gabim(e); }
        return { ok: true, id: op.id, neRadhe: true }; // mbetet në radhë: dërgohet kur të kthehet lidhja
      }).then(function (r) { delete neRruge[op.id]; return r; });
      neRruge[op.id] = p;
      return p;
    }
    function shtoNeRadhe(rruga, te, kohaEDergimit) {
      var op = { id: idERe(), rruga: rruga, te: pastro(te), kohaEDergimit: !!kohaEDergimit };
      var l = lexoRadhen(); l.push(op); ruajRadhen(l);
      return { id: op.id, premtimi: dergoOp(op, false) };
    }
    function dergoRadhen() { if (uid()) lexoRadhen().forEach(function (op) { dergoOp(op, true); }); }
    // Pret deri në `ms` përgjigjen e serverit; pa internet kthen { ok: true, neRadhe: true } (dërgohet më vonë)
    function pritPak(dergimi, ms) {
      return Promise.race([dergimi.premtimi, new Promise(function (r) { setTimeout(function () { r({ ok: true, id: dergimi.id, neRadhe: true }); }, ms || 4000); })]);
    }
    if (typeof window !== 'undefined') window.addEventListener('online', dergoRadhen);

    // ---------- Njoftimet push (chat-i edhe kur aplikacioni është krejt i mbyllur) ----------
    function lexoLS(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
    function shkruajLS(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ok */ } }
    // Aplikacioni Android (tel/): njoftimet vijnë me Firebase Cloud Messaging, jo me Web Push
    function androidApp() { return typeof window !== 'undefined' && !!window.StokuAndroid && typeof window.StokuAndroid.tokenFcm === 'function'; }
    function pushMbeshtetet() {
      if (androidApp()) return true;
      return typeof navigator !== 'undefined' && 'serviceWorker' in navigator && typeof window !== 'undefined' &&
        'PushManager' in window && typeof Notification !== 'undefined';
    }
    // Adresa e njoftimeve të kësaj pajisjeje: { endpoint, p256dh, auth } (Web Push) ose { endpoint: 'fcm:…', fcm } (Android).
    // krijo: abonohet nëse s'ka (vetëm Web Push; në Android tokeni vjen nga aplikacioni).
    async function pajisjaPush(krijo) {
      if (androidApp()) {
        var t = '';
        try { t = String(window.StokuAndroid.tokenFcm() || ''); } catch (e) { /* ok */ }
        return t ? { endpoint: 'fcm:' + t, fcm: t } : null;
      }
      var reg = await navigator.serviceWorker.ready;
      var sub = await reg.pushManager.getSubscription();
      if (krijo && sub && sub.options && sub.options.applicationServerKey && b64uNgaBytes(sub.options.applicationServerKey) !== PUSH_VAPID) {
        try { await sub.unsubscribe(); } catch (e) { /* ok */ }
        sub = null;
      }
      if (!sub && krijo) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytesNgaB64u(PUSH_VAPID) });
      if (!sub) return null;
      var j = sub.toJSON();
      return { endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth };
    }
    function bytesNgaB64u(t) {
      t = t.replace(/-/g, '+').replace(/_/g, '/'); while (t.length % 4) t += '=';
      var b = atob(t), u = new Uint8Array(b.length);
      for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
      return u;
    }
    function b64uNgaBytes(buf) {
      var u = new Uint8Array(buf), t = '';
      for (var i = 0; i < u.length; i++) t += String.fromCharCode(u[i]);
      return btoa(t).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    function hashTekst(t) { var h = 5381; for (var i = 0; i < t.length; i++) h = ((h * 33) ^ t.charCodeAt(i)) >>> 0; return h.toString(36); }
    async function thirrPush(rruga, trup) {
      if (!auth.currentUser || typeof fetch !== 'function') return { ok: false, arsye: 'pa-hyrje' };
      var token = await auth.currentUser.getIdToken();
      var r = await fetch(PUSH_URL + rruga, { method: 'POST', headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(trup || {}) });
      var j = {}; try { j = await r.json(); } catch (e) { /* ok */ }
      if (r.ok && j.ok) shkruajLS(KEY_PUSH_SERVER, Date.now());
      return j;
    }
    // ---------- Fotot e profilit (te Worker-i) ----------
    var fototMarreSe = 0;
    async function thirrFotot(metoda, rruga, trup) {
      if (!auth.currentUser || typeof fetch !== 'function') return { ok: false, arsye: 'pa-hyrje' };
      var token = await auth.currentUser.getIdToken();
      var h = { 'Authorization': 'Bearer ' + token };
      if (trup) h['Content-Type'] = trup.type || 'image/jpeg';
      var r = await fetch(PUSH_URL + rruga, { method: metoda, headers: h, body: trup || undefined });
      var j = {}; try { j = await r.json(); } catch (e) { /* ok */ }
      if (!r.ok && !j.arsye) j.arsye = 'http-' + r.status;
      return j;
    }
    async function rifreskoFotot(detyrimisht) {
      if (!uid() || (!detyrimisht && Date.now() - fototMarreSe < 10 * 60000)) return false;
      fototMarreSe = Date.now();
      try {
        var j = await thirrFotot('GET', '/fotot');
        if (j && j.ok) { Fotot.vendosIndeksin(j.fotot); return true; }
      } catch (e) { /* pa internet / pa Worker */ }
      fototMarreSe = 0;
      return false;
    }
    async function ngarkoFoton(skedari) {
      if (!uid()) return { ok: false, arsye: 'pa-hyrje' };
      var b;
      try { b = await Fotot.pergatit(skedari); } catch (e) { return { ok: false, arsye: 'jo-foto' }; }
      try {
        var j = await thirrFotot('PUT', '/foto', b);
        if (j && j.ok) Fotot.ndryshoNjeren(uid(), j.koha);
        return j && j.ok ? { ok: true } : { ok: false, arsye: (j && j.arsye) || 'gabim' };
      } catch (e) { return { ok: false, arsye: 'rrjeti' }; }
    }
    async function hiqFoton() {
      if (!uid()) return { ok: false, arsye: 'pa-hyrje' };
      try {
        var j = await thirrFotot('DELETE', '/foto');
        if (j && j.ok) Fotot.ndryshoNjeren(uid(), 0);
        return j && j.ok ? { ok: true } : { ok: false, arsye: (j && j.arsye) || 'gabim' };
      } catch (e) { return { ok: false, arsye: 'rrjeti' }; }
    }
    function vetjaTeFotot() { if (uid()) Fotot.vendosEmrat([{ uid: uid(), emri: emri() }]); }
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('stoku-auth-ndryshoi', function () { vetjaTeFotot(); rifreskoFotot(true); });
      document.addEventListener('visibilitychange', function () { if (!document.hidden) rifreskoFotot(false); });
    }

    function njoftoPushKerkese(id, g) { thirrPush('/kerkese', g ? { id: id, grupi: g } : { id: id }).catch(function () { /* pa internet / pa Worker */ }); }
    function njoftoPushChat(id, g) { thirrPush('/chat', g ? { id: id, grupi: g } : { id: id }).catch(function () { /* pa internet / pa Worker — s'ka gjë */ }); }
    // Worker-i u përgjigj mirë së fundi (7 ditë)? Vetëm atëherë i besohet push-it dhe hiqen njoftimet lokale të chat-it.
    async function kontrolloServerin() {
      try {
        var r = await fetch(PUSH_URL, { method: 'GET' });
        var j = await r.json();
        if (r.ok && j && j.ok && j.celesat !== false) { shkruajLS(KEY_PUSH_SERVER, Date.now()); shenoCronin(j); return true; }
      } catch (e) { /* ok */ }
      return false;
    }
    function pushAktiv() {
      var p = lexoLS(KEY_PUSH), s = lexoLS(KEY_PUSH_SERVER);
      return !!(p && p.uid === uid() && grupi && p.grupi === grupi && s && (Date.now() - s) < 7 * 86400000) &&
        typeof Notification !== 'undefined' && Notification.permission === 'granted';
    }
    // Regjistron këtë pajisje për njoftime (vetëm me leje të dhënë). Shkruan te ekipa_push vetëm kur ndryshon diçka
    // ose çdo 7 ditë, që lista e Worker-it të mbetet e freskët.
    async function aktivizoPush(detyro) {
      if (!uid()) return { ok: false, arsye: 'pa-hyrje' };
      if (!pushMbeshtetet()) return { ok: false, arsye: 'pa-mbeshtetje' };
      if (Notification.permission !== 'granted') return { ok: false, arsye: 'pa-leje' };
      try {
        var j = await pajisjaPush(true);
        if (!j) return { ok: false, arsye: 'pa-token' }; // Android: tokeni ende s'ka ardhur (vjen me "stoku-android-token")
        var id = uid() + '_' + hashTekst(j.endpoint);
        var ruajtur = lexoLS(KEY_PUSH);
        // Pajisja regjistrohet te grupi (grupet/{g}/push): Worker-i ua dërgon chat-in/kërkesat vetëm anëtarëve të grupit
        if (grupi && (detyro || !ruajtur || ruajtur.id !== id || ruajtur.endpoint !== j.endpoint || ruajtur.grupi !== grupi || (Date.now() - (ruajtur.koha || 0)) > 7 * 86400000)) {
          if (ruajtur && ruajtur.id && ruajtur.uid === uid() && ruajtur.grupi && (ruajtur.id !== id || ruajtur.grupi !== grupi)) {
            try { await fs.deleteDoc(fs.doc(db, 'grupet', ruajtur.grupi, 'push', ruajtur.id)); } catch (e) { /* ok — p.sh. s'je më në atë grup */ }
          }
          await fs.setDoc(fs.doc(db, 'grupet', grupi, 'push', id), Object.assign({ uid: uid(), emri: emri(), platforma: platforma, koha: Date.now() }, j));
          shkruajLS(KEY_PUSH, { uid: uid(), id: id, endpoint: j.endpoint, grupi: grupi, koha: Date.now() });
        }
        // Orari ditor i kësaj pajisjeje ishte për një regjistrim tjetër (p.sh. çelës i ri): rinovohet me të riun
        var o = orariIm();
        if (o && o.aktiv && o.endpoint !== j.endpoint) vendosOrarin({ aktiv: true, ora: o.ora }).catch(function () { /* ok */ });
        var serveri = await kontrolloServerin();
        rinovoOrarinNesesMungon().catch(function () { /* ok */ });
        return { ok: true, serveri: serveri };
      } catch (e) { return gabim(e); }
    }
    // ---------- Njoftimi ditor për afatet (Worker-i e dërgon në orën e zgjedhur, me Cron) ----------
    var KEY_ORARI = 'stoku:orari', KEY_ORARI_AFATET = 'stoku:orari:afatet';
    function orariIm() { var o = lexoLS(KEY_ORARI); return o && o.uid === uid() ? o : null; }
    async function thirrOrarin(trup, rruga) {
      var token = await auth.currentUser.getIdToken();
      var r = await fetch(PUSH_URL + (rruga || '/orari'), { method: 'POST', headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(trup) });
      var j = {}; try { j = await r.json(); } catch (e) { /* ok */ }
      if (!r.ok && !j.arsye) j.arsye = 'http-' + r.status;
      return j;
    }
    function zonaKohore() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Belgrade'; } catch (e) { return 'Europe/Belgrade'; } }
    async function vendosOrarin(o) {
      if (!uid() || typeof fetch !== 'function') return { ok: false, arsye: 'pa-hyrje' };
      try {
        var j = pushMbeshtetet() ? await pajisjaPush(false) : null;
        if (o.aktiv && !j) {
          var a = await aktivizoPush(true);
          if (!a || !a.ok) return { ok: false, arsye: (a && a.arsye) || 'pa-push' };
          j = await pajisjaPush(false);
        }
        var ishte = orariIm();
        if (!j) { shkruajLS(KEY_ORARI, null); return { ok: !o.aktiv, arsye: 'pa-push' }; }
        var r = await thirrOrarin({ aktiv: !!o.aktiv, ora: o.ora, tz: zonaKohore(), platforma: platforma, pajisja: j });
        if (!r || !r.ok) return { ok: false, arsye: (r && r.arsye) || 'gabim' };
        shkruajLS(KEY_ORARI, o.aktiv ? { uid: uid(), aktiv: true, ora: o.ora, endpoint: j.endpoint, koha: Date.now() } : null);
        if (o.aktiv && !(ishte && ishte.aktiv)) shkruajLS(KEY_ORARI_AFATET, null); // afatet dërgohen sërish menjëherë
        return { ok: true };
      } catch (e) { return { ok: false, arsye: 'rrjeti' }; }
    }
    // Cron-i i njoftimit ditor punon (kodi i ri + Cron që ka punuar në 45 min e fundit)? Vetëm atëherë njoftimet e
    // menjëhershme për afatet lihen mënjanë; përndryshe vijnë si më parë, që përdoruesi të mos mbetet pa asnjë njoftim.
    var KEY_CRON_OK = 'stoku:orari:cron-ok';
    function shenoCronin(j) {
      var ok = !!(j && j.versioni >= 151 && j.fotot && j.cron && Math.abs(Date.now() - j.cron) < 45 * 60000);
      shkruajLS(KEY_CRON_OK, ok ? Date.now() : null);
      return ok;
    }
    function orariPunon() {
      var o = orariIm(), k = lexoLS(KEY_CRON_OK);
      return !!(o && o.aktiv && k && Date.now() - k < 36 * 3600000);
    }
    // Gjendja për Cilësimet → Njoftimet: versioni i Worker-it, Cron-i dhe rezultati i fundit për këtë pajisje
    async function statusiIOrarit() {
      var dalja = { serveri: null, im: null };
      try { var r0 = await fetch(PUSH_URL, { method: 'GET' }); dalja.serveri = await r0.json(); shenoCronin(dalja.serveri); } catch (e) { return dalja; }
      var o = orariIm();
      if (!o || !o.aktiv || !uid() || !pushMbeshtetet()) return dalja;
      try {
        var j = await pajisjaPush(false);
        if (!j) return dalja;
        dalja.im = await thirrOrarin({ statusi: true, pajisja: j });
      } catch (e) { /* ok */ }
      return dalja;
    }
    // A pranon KV-ja e serverit shkrime (limiti falas 1000 në ditë)? Thirret vetëm kur Cron-i duket i ndalur.
    async function provoKV() {
      try { var r = await fetch(PUSH_URL + '/?kv=1', { method: 'GET' }); return (await r.json()).kv || null; } catch (e) { return null; }
    }
    // Serveri e fshin orarin kur Google/Apple e refuzojnë adresën e njoftimeve (p.sh. pas riinstalimit të aplikacionit).
    // Nëse telefoni e ka ende orarin të ndezur, regjistrohet sërish vetë (maks një herë në 3 orë).
    var KEY_ORARI_KONTROLL = 'stoku:orari:kontrolli';
    async function rinovoOrarinNesesMungon(detyro, stNjohur) {
      var o = orariIm();
      if (!o || !o.aktiv || !uid()) return false;
      var k = lexoLS(KEY_ORARI_KONTROLL);
      if (!detyro && k && Date.now() - k < 3 * 3600000) return false;
      shkruajLS(KEY_ORARI_KONTROLL, Date.now());
      var st = stNjohur || await statusiIOrarit();
      if (st.im && st.im.ok && !st.im.ekziston) {
        shkruajLS(KEY_ORARI_AFATET, null); // dërgohen sërish edhe afatet
        var r = await vendosOrarin({ aktiv: true, ora: o.ora });
        return !!(r && r.ok);
      }
      return false;
    }
    // Kopja e afateve te Worker-i (vetëm kur kjo pajisje ka orar dhe kur lista ndryshon, ose një herë në ditë)
    // ngaPC: kompjuteri s'ka orar vetë, por ia dërgon serverit afatet e reja që njoftimi ditor i telefonit të jetë i saktë
    // edhe kur produktet ndryshohen vetëm në kompjuter (serveri i ruan vetëm nëse ka orar në ndonjë pajisje).
    // Pa orar në këtë pajisje dërgohet me "vetemMeOrar": serveri e ruan vetëm kur përdoruesi ka orar në ndonjë pajisje
    // ose orë të lidhur (kështu lista e orës/njoftimit ditor mbetet e saktë nga çdo pajisje).
    async function dergoAfatetPerOrarin(afatet) {
      var o = orariIm();
      if (!uid()) return { ok: false, arsye: 'pa-hyrje' };
      var vetemMeOrar = !(o && o.aktiv);
      var l = (afatet || []).filter(function (a) { return a && a.statusi !== 'hequr' && /^\d{4}-\d{2}-\d{2}$/.test(a.data || ''); })
        .map(function (a) { var x = { i: String(a.id || '').slice(0, 60), e: String(a.emri || '').slice(0, 120), b: String(a.barkodi || '').slice(0, 40), d: a.data }; if (typeof a.sasia === 'number') x.s = a.sasia; return x; });
      var h = hashTekst(JSON.stringify(l)), ruajtur = lexoLS(KEY_ORARI_AFATET);
      // Serveri tha para pak që s'ka as orar as orë: s'pyetet sërish për 10 min
      if (vetemMeOrar && ruajtur && ruajtur.uid === uid() && ruajtur.paOrar && Date.now() - ruajtur.koha < 600000) return { ok: true, paOrar: true };
      if (ruajtur && ruajtur.uid === uid() && ruajtur.h === h && Date.now() - ruajtur.koha < 86400000) return { ok: true, pandryshuar: true };
      try {
        var r = await thirrOrarin(vetemMeOrar ? { afatet: l, vetemMeOrar: true } : { afatet: l });
        if (r && r.ok && r.paOrar) shkruajLS(KEY_ORARI_AFATET, { uid: uid(), paOrar: true, koha: Date.now() });
        else if (r && r.ok) shkruajLS(KEY_ORARI_AFATET, { uid: uid(), h: h, koha: Date.now() });
        return r;
      } catch (e) { return { ok: false, arsye: 'rrjeti' }; }
    }

    // ---------- Ora (Galaxy Watch): lidhja me kod dhe heqjet e bëra nga ora ----------
    async function lidhOren(kodi) {
      if (!uid()) return { ok: false, arsye: 'pa-hyrje' };
      try {
        // rt: që ora të mund t'i dërgojë kërkesa ekipës në emrin tënd (sipas rregullave të Firestore)
        var r = await thirrOrarin({ kodi: String(kodi || '').replace(/\D/g, ''), emri: emri(), rt: auth.currentUser.refreshToken || '' }, '/ora/lidh');
        if (r && r.ok) shkruajLS(KEY_ORARI_AFATET, null); // lista e afateve i dërgohet menjëherë serverit
        return r;
      } catch (e) { return { ok: false, arsye: 'rrjeti' }; }
    }
    var heqjetOraKoha = 0;
    async function merrHeqjetNgaOra(detyro) {
      if (!uid() || (!detyro && Date.now() - heqjetOraKoha < 120000)) return [];
      heqjetOraKoha = Date.now();
      try { var r = await thirrOrarin({}, '/ora/hequrat'); return (r && r.ok && r.hequrat) || []; } catch (e) { return []; }
    }
    async function pastroHeqjetNgaOra(ids) {
      if (!uid() || !ids || !ids.length) return;
      try { await thirrOrarin({ pastro: ids }, '/ora/hequrat'); } catch (e) { /* ok */ }
    }

    // Në dalje nga llogaria: kjo pajisje s'merr më njoftimet e kësaj llogarie
    async function caktivizoPush() {
      var o = orariIm();
      if (o && o.aktiv) { try { await vendosOrarin({ aktiv: false }); } catch (e) { /* ok */ } }
      shkruajLS(KEY_ORARI, null); shkruajLS(KEY_ORARI_AFATET, null);
      await hiqPajisjenNgaGrupi();
    }
    // Kjo pajisje s'merr më chat-in/kërkesat e grupit (dalja nga llogaria ose largimi nga grupi)
    async function hiqPajisjenNgaGrupi() {
      var ruajtur = lexoLS(KEY_PUSH);
      shkruajLS(KEY_PUSH, null);
      if (ruajtur && ruajtur.id && uid() === ruajtur.uid) {
        try { await fs.deleteDoc(ruajtur.grupi ? fs.doc(db, 'grupet', ruajtur.grupi, 'push', ruajtur.id) : fs.doc(db, 'ekipa_push', ruajtur.id)); } catch (e) { /* ok */ }
      }
    }

    // ---------- Prania: "online tani" / "parë para 5 min" ----------
    var rrahjaKohez = null, praniaNisur = false;
    function rrahZemren(online) {
      if (!uid() || !grupi) return Promise.resolve(); // pa grup s'ka kush ta shohë praninë
      return fs.setDoc(fs.doc(db, 'grupet', grupi, 'anetaret', uid()), { emri: emri(), aktivSe: Date.now(), online: online !== false, platforma: platforma }, { merge: true })
        .catch(function () { /* pa internet (ose s'je më në grup) — provohet sërish */ });
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

    // ---------- Grupi: hera e parë, largimi, pastrimi ----------
    // Ekipa e vjetër (para grupeve) → grupi "ekipa": anëtari i pranuar më parë (ekipa_anetaret) hyn vetë aty.
    // Kthen grupin ('ekipa' ose '' = pa grup), 'pa-rregulla' (rregullat e grupeve s'janë vendosur) ose null (pa internet).
    var GRUPI_I_VJETER = 'ekipa';
    function anetaresiaERe(roli) { return { emri: emri(), roli: roli, hyriSe: Date.now(), aktivSe: Date.now(), online: true, platforma: platforma }; }
    function vendosTreguesin(g) { return fs.setDoc(fs.doc(db, 'perdoruesit', uid()), { grupi: g || '' }, { merge: true }); }
    async function provoGrupinEVjeter() {
      var u0 = uid();
      if (!u0) return null;
      var g = '';
      try {
        var s = await fs.getDoc(fs.doc(db, 'grupet', GRUPI_I_VJETER, 'anetaret', u0));
        if (s.exists()) g = GRUPI_I_VJETER;
      } catch (e) { return eshteLeje(e) ? 'pa-rregulla' : null; }
      if (!g) {
        var ishte = false;
        try { ishte = (await fs.getDoc(fs.doc(db, 'ekipa_anetaret', u0))).exists(); } catch (e) { /* s'ka ekipë të vjetër */ }
        if (ishte) {
          try { await fs.setDoc(fs.doc(db, 'grupet', GRUPI_I_VJETER, 'anetaret', u0), anetaresiaERe('anetar')); g = GRUPI_I_VJETER; }
          catch (e) { if (!eshteLeje(e)) return null; }
        }
      }
      try { await vendosTreguesin(g); } catch (e) { return null; }
      return g;
    }
    // Fshin krejt dokumentet e një koleksioni (rruga si listë), me grupe nga 400
    async function pastroKol(rruga) {
      var n = 0;
      for (var i = 0; i < 50; i++) {
        var s = await fs.getDocs(fs.query(fs.collection.apply(null, [db].concat(rruga)), fs.limit(400)));
        if (s.empty) break;
        var b = fs.writeBatch(db);
        s.forEach(function (d) { b.delete(fs.doc.apply(null, [db].concat(rruga, [d.id]))); n++; });
        await b.commit();
      }
      return n;
    }
    async function fshijFtesatEGrupit(g) {
      try {
        var s = await fs.getDocs(fs.query(fs.collection(db, 'ftesat'), fs.where('gid', '==', g)));
        var ids = []; s.forEach(function (d) { ids.push(d.id); });
        for (var i = 0; i < ids.length; i++) { try { await fs.deleteDoc(fs.doc(db, 'ftesat', ids[i])); } catch (e) { /* ok */ } }
      } catch (e) { /* ok */ }
    }
    // Largimi nga grupi aktual. fshiGrupin: ishte anëtari i fundit → fshihet krejt grupi me historikun.
    // paTregues: kalim te një grup tjetër (treguesin e shkruan pranimi i ftesës).
    var veprimeNeGrup = 0; // krijimi/pranimi/largimi në vazhdim: treguesin e grupit e shkruajnë ato vetë
    async function largohu(fshiGrupin, paTregues) {
      if (!uid() || !grupi) return { ok: true };
      var g = grupi;
      veprimeNeGrup++;
      try {
        await hiqPajisjenNgaGrupi();
        try { await fs.deleteDoc(fs.doc(db, 'grupet', g, 'afatet', uid())); } catch (e) { /* ok */ }
        if (fshiGrupin) {
          var kol = ['chat', 'feed', 'afatet', 'push'];
          for (var i = 0; i < kol.length; i++) { try { await pastroKol(['grupet', g, kol[i]]); } catch (e) { /* ok */ } }
          await fshijFtesatEGrupit(g);
          try { await fs.deleteDoc(fs.doc(db, 'grupet', g)); } catch (e) { /* ok */ }
        }
        await fs.deleteDoc(fs.doc(db, 'grupet', g, 'anetaret', uid()));
        // Ekipa e vjetër: pa këtë, rihyrja te "ekipa" do të lejohej pa ftesë
        if (g === GRUPI_I_VJETER) { try { await fs.deleteDoc(fs.doc(db, 'ekipa_anetaret', uid())); } catch (e) { /* ok */ } }
        if (!paTregues) await vendosTreguesin('');
        grupi = null;
        return { ok: true };
      } catch (e) { return gabim(e); } finally { veprimeNeGrup--; }
    }
    async function kopjoKoleksionin(kolVjeter, kolRi, n, rendit) {
      var q = rendit ? fs.query(fs.collection(db, kolVjeter), fs.orderBy('koha', 'desc'), fs.limit(n)) : fs.query(fs.collection(db, kolVjeter), fs.limit(n));
      var s = await fs.getDocs(q);
      var l = []; s.forEach(function (d) { l.push({ id: d.id, te: d.data() }); });
      for (var i = 0; i < l.length; i += 400) {
        var b = fs.writeBatch(db);
        l.slice(i, i + 400).forEach(function (x) { b.set(fs.doc(db, 'grupet', GRUPI_I_VJETER, kolRi, x.id), x.te); });
        await b.commit();
      }
      return l.length;
    }

    return {
      nisPranine: nisPranine,
      ndalPranine: ndalPranine,
      rifreskoFotot: rifreskoFotot, ngarkoFoton: ngarkoFoton, hiqFoton: hiqFoton,
      dergoRadhen: dergoRadhen,

      // ---------- Grupi im ----------
      vendosGrupin: vendosGrupin,
      grupiAktual: function () { return grupi; },
      GRUPI_I_VJETER: GRUPI_I_VJETER,
      // cb({ gjendja, grupi, roli, sasiaShpejte }):
      //   'anetar'      → anëtar i grupit `grupi` (roli 'pronar' | 'anetar')
      //   'pa-grup'     → s'është në asnjë grup (krijon një, ose pranon një ftesë); uHoq = grupi nga u hoq
      //   'pa-rregulla' → rregullat e grupeve të Firestore-it ende s'janë vendosur
      //   'gabim'       → p.sh. pa internet: mbetet gjendja e fundit e ditur
      degjoGrupin: function (cb) {
        if (!uid()) return function () {};
        var u0 = uid(), mbyllur = false, gNdjekur, ndalA = null, treguesi;
        function ndalAnetaresine() { if (ndalA) { try { ndalA(); } catch (e) { /* ok */ } ndalA = null; } }
        function ndiq(g) {
          if (mbyllur || g === gNdjekur) return;
          gNdjekur = g; ndalAnetaresine();
          if (!g) { cb({ gjendja: 'pa-grup' }); return; }
          ndalA = fs.onSnapshot(fs.doc(db, 'grupet', g, 'anetaret', u0), function (s) {
            if (mbyllur) return;
            if (!s.exists()) {
              if (s.metadata && s.metadata.fromCache) return; // pa internet: ende s'dihet
              // Pronari të hoqi (ose grupi u fshi): treguesi pastrohet, që Worker-i dhe admini të mos të shohin ende në grup
              if (!veprimeNeGrup && treguesi === g) vendosTreguesin('').catch(function () { /* herën tjetër */ });
              cb({ gjendja: 'pa-grup', uHoq: g });
              return;
            }
            var x = s.data() || {};
            cb({ gjendja: 'anetar', grupi: g, roli: x.roli === 'pronar' ? 'pronar' : 'anetar', sasiaShpejte: x.sasiaShpejte });
          }, function (e) { if (!mbyllur) cb({ gjendja: eshteLeje(e) ? 'pa-rregulla' : 'gabim' }); });
        }
        var ndalP = fs.onSnapshot(fs.doc(db, 'perdoruesit', u0), function (s) {
          if (mbyllur) return;
          if (!s.exists() && s.metadata && s.metadata.fromCache) return;
          var x = s.exists() ? (s.data() || {}) : {};
          treguesi = x.grupi;
          if (typeof x.grupi === 'string') { ndiq(x.grupi); return; }
          // Pa tregues ende (hera e parë me grupet): anëtari i ekipës së vjetër kalon te grupi "ekipa"
          provoGrupinEVjeter().then(function (r) {
            if (mbyllur) return;
            if (r === 'pa-rregulla') { cb({ gjendja: 'pa-rregulla' }); return; }
            if (r === null) { cb({ gjendja: 'gabim' }); return; }
            ndiq(r);
          });
        }, function () { if (!mbyllur) cb({ gjendja: 'gabim' }); });
        return function () { mbyllur = true; ndalAnetaresine(); try { ndalP(); } catch (e) { /* ok */ } };
      },
      // Të dhënat e grupit (emri, pronari), në kohë reale
      degjoGrupinDoc: function (g, cb) {
        return fs.onSnapshot(fs.doc(db, 'grupet', g), function (s) { cb(s.exists() ? Object.assign({}, s.data(), { id: g }) : null); }, function () { cb(null); });
      },
      krijoGrupin: async function (emriGrupit) {
        var em = String(emriGrupit || '').trim().replace(/\s+/g, ' ').slice(0, 60);
        if (!uid()) return { ok: false, arsye: 'pa-hyrje' };
        if (em.length < 2) return { ok: false, arsye: 'emri' };
        var g = 'g' + idERe().slice(0, 22);
        veprimeNeGrup++;
        try {
          // Grupi dhe pronari bashkë (rregullat: pronari hyn vetë vetëm në çastin e krijimit të grupit)
          var b = fs.writeBatch(db);
          b.set(fs.doc(db, 'grupet', g), { emri: em, pronarUid: uid(), pronarEmri: emri(), krijuarSe: Date.now() });
          b.set(fs.doc(db, 'grupet', g, 'anetaret', uid()), anetaresiaERe('pronar'));
          await b.commit();
          await vendosTreguesin(g);
          grupi = g;
          return { ok: true, grupi: g };
        } catch (e) { return gabim(e); } finally { veprimeNeGrup--; }
      },
      riemertoGrupin: async function (emriGrupit) {
        var em = String(emriGrupit || '').trim().replace(/\s+/g, ' ').slice(0, 60);
        if (!grupi) return { ok: false, arsye: 'pa-grup' };
        if (em.length < 2) return { ok: false, arsye: 'emri' };
        try { await fs.setDoc(fs.doc(db, 'grupet', grupi), { emri: em }, { merge: true }); return { ok: true }; } catch (e) { return gabim(e); }
      },
      // Ftesa për një emër përdoruesi (pronari). I ftuari e sheh te Ekipa dhe e pranon ose e refuzon.
      ftoNeGrup: async function (perdoruesi, emriGrupit) {
        var p = String(perdoruesi || '').trim().toLowerCase().replace(/@stoku-app\.local$/, '');
        if (!uid() || !grupi) return { ok: false, arsye: 'pa-grup' };
        if (!/^[a-z0-9_.-]{3,40}$/.test(p)) return { ok: false, arsye: 'emri' };
        if (p === emri()) return { ok: false, arsye: 'vetja' };
        try {
          await fs.setDoc(fs.doc(db, 'ftesat', grupi + '_' + p), { gid: grupi, grupiEmri: String(emriGrupit || '').slice(0, 60), perdoruesi: p, ngaUid: uid(), ngaEmri: emri(), koha: Date.now() });
          return { ok: true };
        } catch (e) { return gabim(e); }
      },
      anuloFtesen: async function (id) {
        try { await fs.deleteDoc(fs.doc(db, 'ftesat', id)); return { ok: true }; } catch (e) { return gabim(e); }
      },
      degjoFtesatEGrupit: function (cb, cbGabim) {
        if (!grupi) return function () {};
        return fs.onSnapshot(fs.query(fs.collection(db, 'ftesat'), fs.where('gid', '==', grupi)), function (s) { cb(listaNga(s)); }, function (e) { if (cbGabim) cbGabim(e); });
      },
      degjoFtesatEMia: function (cb, cbGabim) {
        if (!uid() || !emri()) return function () {};
        return fs.onSnapshot(fs.query(fs.collection(db, 'ftesat'), fs.where('perdoruesi', '==', emri())), function (s) { cb(listaNga(s)); }, function (e) { if (cbGabim) cbGabim(e); });
      },
      // Pranimi i ftesës. Së pari hyrja te grupi i ri (ftesa fshihet bashkë me të): nëse ftesa s'vlen më,
      // mbetesh ku ishe. Vetëm pastaj largohesh nga grupi i mëparshëm (fshiGrupinEVjeter: ishe i fundit aty).
      pranoFtesen: async function (f, fshiGrupinEVjeter) {
        if (!uid() || !f || !f.gid) return { ok: false };
        veprimeNeGrup++;
        try {
          var b = fs.writeBatch(db);
          b.set(fs.doc(db, 'grupet', f.gid, 'anetaret', uid()), anetaresiaERe('anetar'));
          b.delete(fs.doc(db, 'ftesat', f.id));
          try { await b.commit(); }
          catch (e) {
            if (!eshteLeje(e)) return gabim(e);
            // Ftesa u anulua ose grupi u fshi ndërkohë
            try { await fs.deleteDoc(fs.doc(db, 'ftesat', f.id)); } catch (e2) { /* ok */ }
            return { ok: false, arsye: 'ftesa-skadoi' };
          }
          if (grupi && grupi !== f.gid) await largohu(!!fshiGrupinEVjeter, true);
          await vendosTreguesin(f.gid);
          grupi = f.gid;
          shtoNeRadhe(['grupet', f.gid, 'feed'], { lloji: 'anetar-i-ri', anetariUid: uid(), anetariEmri: emri(), ftuarNga: f.ngaEmri || '', uid: uid(), emri: emri(), koha: Date.now() });
          return { ok: true, grupi: f.gid };
        } catch (e) { return gabim(e); } finally { veprimeNeGrup--; }
      },
      refuzoFtesen: async function (f) {
        try { await fs.deleteDoc(fs.doc(db, 'ftesat', f.id)); return { ok: true }; } catch (e) { return gabim(e); }
      },
      largohuNgaGrupi: function (fshiGrupin) { return largohu(!!fshiGrupin); },
      // Pronari: heq një anëtar (anëtarësia, përmbledhja e afateve dhe pajisjet e tij në grup)
      hiqNgaGrupi: async function (u) {
        if (!grupi || !u || u === uid()) return { ok: false };
        try {
          await fs.deleteDoc(fs.doc(db, 'grupet', grupi, 'anetaret', u));
          if (grupi === GRUPI_I_VJETER) { try { await fs.deleteDoc(fs.doc(db, 'ekipa_anetaret', u)); } catch (e) { /* ok */ } }
          try { await fs.deleteDoc(fs.doc(db, 'grupet', grupi, 'afatet', u)); } catch (e) { /* ok */ }
          try {
            var s = await fs.getDocs(fs.query(fs.collection(db, 'grupet', grupi, 'push'), fs.where('uid', '==', u)));
            var ids = []; s.forEach(function (d) { ids.push(d.id); });
            for (var i = 0; i < ids.length; i++) await fs.deleteDoc(fs.doc(db, 'grupet', grupi, 'push', ids[i]));
          } catch (e) { /* ok */ }
          return { ok: true };
        } catch (e) { return gabim(e); }
      },
      // Pronari: 'pronar' | 'anetar'
      ndryshoRolin: async function (u, roli) {
        if (!grupi) return { ok: false };
        try { await fs.setDoc(fs.doc(db, 'grupet', grupi, 'anetaret', u), { roli: roli === 'pronar' ? 'pronar' : 'anetar' }, { merge: true }); return { ok: true }; } catch (e) { return gabim(e); }
      },
      // Pronari: leja e butonave +/- (sasia e shpejtë) për një anëtar të grupit
      vendosLejen: async function (u, po) {
        if (!grupi) return { ok: false };
        try { await fs.setDoc(fs.doc(db, 'grupet', grupi, 'anetaret', u), { sasiaShpejte: !!po }, { merge: true }); return { ok: true }; } catch (e) { return gabim(e); }
      },

      // Anëtarët e grupit me praninë, në kohë reale
      degjoAnetaret: function (cb, cbGabim) {
        if (!grupi) return function () {};
        return fs.onSnapshot(fs.collection(db, 'grupet', grupi, 'anetaret'), function (s) {
          var lista = listaNga(s).map(function (x) {
            return { uid: x.id, emri: x.emri || x.id, aktivSe: x.aktivSe || x.hyriSe || 0, online: x.online === true, platforma: x.platforma || '',
              kycurSe: x.hyriSe || 0, roli: x.roli === 'pronar' ? 'pronar' : 'anetar', pronar: x.roli === 'pronar',
              admin: x.emri === ADMIN_EMRI, sasiaShpejte: x.sasiaShpejte === true };
          });
          Fotot.vendosEmrat(lista);
          cb(lista);
        }, function (e) { if (cbGabim) cbGabim(e); });
      },
      // A është kjo llogari administratori? (true/false; null = s'dihet, p.sh. pa internet)
      // (v140) Llogaria me emrin "mendurberisha" është administratori edhe pa fushën `emri` te Firestore — emri i llogarisë
      // vjen nga Firebase Auth dhe s'falsifikohet; rregullat e Firestore-it e njohin njësoj (request.auth.token.email).
      eshteAdmin: async function () {
        if (!uid()) return null;
        if (emri() === ADMIN_EMRI) return true;
        if (!fs.getDoc) return null;
        try { var s = await fs.getDoc(fs.doc(db, 'perdoruesit', uid())); return !!(s.exists() && s.data().emri === ADMIN_EMRI); } catch (e) { return null; }
      },
      // Administratori: krejt llogaritë (për "Llogaritë e tjera": fshirja, ftesa)
      degjoKrejtLlogarite: function (cb, cbGabim) {
        return fs.onSnapshot(fs.collection(db, 'perdoruesit'), function (s) {
          cb(listaNga(s).map(function (x) {
            return { uid: x.id, emri: x.perdoruesi || x.emri || x.id, kycurSe: x.kycurSe || 0, aktivSe: x.aktivSe || 0,
              grupi: typeof x.grupi === 'string' ? x.grupi : null, admin: x.emri === ADMIN_EMRI || x.perdoruesi === ADMIN_EMRI };
          }));
        }, function (e) { if (cbGabim) cbGabim(e); });
      },
      // Administratori: fshin llogarinë komplet. Së pari shënohet te ekipa_fshire/{uid} (rregullat ia mbyllin çdo
      // qasje menjëherë, dhe aplikacioni i tij e fshin llogarinë e Firebase-it sapo hapet), pastaj fshihen krejt të
      // dhënat: dyqani (me pjesët dhe fletët), anëtarësia në grup, afatet e grupit, njoftimet dhe profili.
      fshijLlogarine: async function (u, emriTjeter) {
        if (!uid() || !u || u === uid()) return { ok: false };
        var gU = null;
        try { var pu = await fs.getDoc(fs.doc(db, 'perdoruesit', u)); gU = pu.exists() ? pu.data().grupi : null; } catch (e) { /* ok */ }
        try { await fs.setDoc(fs.doc(db, 'ekipa_fshire', u), { emri: emriTjeter || '', fshireSe: Date.now(), fshireNga: emri() }); }
        catch (e) { return gabim(e); }
        var mbetur = 0;
        async function fshij(ref) { try { await fs.deleteDoc(ref); } catch (e) { mbetur++; } }
        async function fshijKoleksionin(rruga) {
          try {
            var s = await fs.getDocs(fs.collection.apply(null, [db].concat(rruga)));
            var l = []; s.forEach(function (d) { l.push(d.id); });
            for (var i = 0; i < l.length; i++) await fshij(fs.doc.apply(null, [db].concat(rruga, [l[i]])));
          } catch (e) { mbetur++; }
        }
        if (gU) {
          await fshij(fs.doc(db, 'grupet', gU, 'anetaret', u)); await fshij(fs.doc(db, 'grupet', gU, 'afatet', u));
          try {
            var sp = await fs.getDocs(fs.query(fs.collection(db, 'grupet', gU, 'push'), fs.where('uid', '==', u)));
            var pp = []; sp.forEach(function (d) { pp.push(d.id); });
            for (var j = 0; j < pp.length; j++) await fshij(fs.doc(db, 'grupet', gU, 'push', pp[j]));
          } catch (e) { /* ok */ }
          // Ishte pronari i vetëm: pronar bëhet anëtari më i vjetër (përndryshe askush s'mund të ftojë a të heqë)
          try {
            var mbet = listaNga(await fs.getDocs(fs.collection(db, 'grupet', gU, 'anetaret')));
            if (mbet.length && !mbet.some(function (x) { return x.roli === 'pronar'; })) {
              mbet.sort(function (x, y) { return (x.hyriSe || 0) - (y.hyriSe || 0); });
              await fs.setDoc(fs.doc(db, 'grupet', gU, 'anetaret', mbet[0].id), { roli: 'pronar' }, { merge: true });
            }
          } catch (e) { /* ok */ }
        }
        if (grupi && grupi !== gU) { try { await fs.deleteDoc(fs.doc(db, 'grupet', grupi, 'anetaret', u)); } catch (e) { /* ok */ } }
        try { await fs.deleteDoc(fs.doc(db, 'ekipa_anetaret', u)); } catch (e) { /* ok */ }
        try { await fs.deleteDoc(fs.doc(db, 'ekipa_afatet', u)); } catch (e) { /* ok */ }
        await fshijKoleksionin(['dyqane', u, 'pjeset']);
        await fshijKoleksionin(['dyqane', u, 'fletet']);
        await fshij(fs.doc(db, 'dyqane', u));
        await fshijKoleksionin(['perdoruesit', u, 'njoftimet']);
        await fshij(fs.doc(db, 'perdoruesit', u));
        return { ok: true, mbetur: mbetur };
      },
      // Kjo llogari u fshi nga administratori? cb() thirret sapo shënimi ekziston (edhe kur je duke punuar)
      degjoFshirjen: function (cb) {
        if (!uid()) return function () {};
        return fs.onSnapshot(fs.doc(db, 'ekipa_fshire', uid()), function (s) { if (s.exists()) cb(s.data() || {}); },
          function () { /* rregullat e vjetra: ekipa_fshire s'lexohet — s'ka fshirje */ });
      },
      // Administratori, një herë: ekipa e vjetër → grupi "ekipa" (anëtarët e pranuar, chat-i, aktiviteti, përmbledhjet).
      // Shënohet te perdoruesit/{admin}.grupetMigruarSe, që të mos përsëritet (p.sh. pasi të jetë larguar qëllimisht).
      migroEkipenEVjeter: async function () {
        if (!uid()) return { ok: false };
        try {
          var une = await fs.getDoc(fs.doc(db, 'perdoruesit', uid()));
          if (une.exists() && une.data().grupetMigruarSe) return { ok: true, n: 0, bere: true };
          var g = GRUPI_I_VJETER, tani = Date.now();
          var ekz = await fs.getDoc(fs.doc(db, 'grupet', g));
          if (!ekz.exists()) await fs.setDoc(fs.doc(db, 'grupet', g), { emri: 'Ekipa', pronarUid: uid(), pronarEmri: emri(), krijuarSe: tani, migruarSe: tani });
          await fs.setDoc(fs.doc(db, 'grupet', g, 'anetaret', uid()), anetaresiaERe('pronar'));
          var an = await fs.getDocs(fs.collection(db, 'ekipa_anetaret'));
          var lista = []; an.forEach(function (d) { if (d.id !== uid()) lista.push({ uid: d.id, te: d.data() || {} }); });
          for (var i = 0; i < lista.length; i += 400) {
            var b = fs.writeBatch(db);
            lista.slice(i, i + 400).forEach(function (a) { b.set(fs.doc(db, 'grupet', g, 'anetaret', a.uid), { emri: a.te.emri || a.uid, roli: 'anetar', hyriSe: a.te.pranuarSe || tani }, { merge: true }); });
            await b.commit();
          }
          var nChat = 0, nFeed = 0, nAfate = 0;
          try { nChat = await kopjoKoleksionin('ekipa_chat', 'chat', 150, true); } catch (e) { /* ok */ }
          try { nFeed = await kopjoKoleksionin('ekipa_feed', 'feed', 150, true); } catch (e) { /* ok */ }
          try { nAfate = await kopjoKoleksionin('ekipa_afatet', 'afatet', 400, false); } catch (e) { /* ok */ }
          await fs.setDoc(fs.doc(db, 'perdoruesit', uid()), { grupi: g, grupetMigruarSe: tani }, { merge: true });
          grupi = g;
          return { ok: true, n: lista.length, chat: nChat, feed: nFeed, afate: nAfate };
        } catch (e) { return gabim(e); }
      },

      // ---------- Pronari i grupit: njoftim për krejt grupin, pastrimi ----------
      // Njoftim te zilja e secilit (lista e uid-ve) + në aktivitet; kalon nga radha (s'humbet pa internet)
      lajmeroEkipen: function (tekst, listaUid) {
        tekst = String(tekst || '').trim().slice(0, 1000);
        if (!tekst || !uid() || !grupi) return Promise.resolve({ ok: false, arsye: 'bosh' });
        var koha = Date.now();
        (listaUid || []).forEach(function (u) {
          if (u === uid()) return;
          shtoNeRadhe(['perdoruesit', u, 'njoftimet'], { lloji: 'lajmerim', tekst: tekst, grupi: grupi, uid: uid(), emri: emri(), koha: koha, lexuar: false });
        });
        return pritPak(shtoNeRadhe(rrG('feed'), { lloji: 'lajmerim', tekst: tekst, uid: uid(), emri: emri(), koha: koha }));
      },
      // Kërkesë që një koleg (ose krejt grupi) ta heqë nga rafti një produkt (edhe pa afat në Stoku).
      // Ngjarja te aktiviteti + njoftim te zilja e secilit marrës; Worker-i dërgon push (/kerkese).
      kerkoHeqjen: function (k, listaUid) {
        var produktet = listaEKerkeses(k);
        if (!produktet.length || !uid() || !grupi) return Promise.resolve({ ok: false, arsye: 'bosh' });
        var produkti = produktet[0].produkti, barkodi = produktet[0].barkodi; // për kërkesat e para (pa listë)
        var shenim = String(k.shenim || '').trim().slice(0, 300), koha = Date.now();
        var ng = shtoNeRadhe(rrG('feed'), { lloji: 'kerkese-heqje', uid: uid(), emri: emri(), koha: koha, produkti: produkti,
          barkodi: barkodi, produktet: produktet, shenim: shenim, perUid: k.perUid || '', perEmri: k.perEmri || '' });
        (listaUid || []).forEach(function (u) {
          if (u === uid()) return;
          shtoNeRadhe(['perdoruesit', u, 'njoftimet'], { lloji: 'kerkese-heqje', kerkeseId: ng.id, produkti: produkti, barkodi: barkodi,
            produktet: produktet, shenim: shenim, perKrejt: !k.perUid, grupi: grupi, uid: uid(), emri: emri(), koha: koha, lexuar: false });
        });
        return pritPak(ng);
      },
      // Marrësi e shënon të kryer: njoftimi i vet (kryer), ngjarje te aktiviteti dhe njoftim te ai që e kërkoi
      kryejKerkesen: async function (nj) {
        if (!uid() || !nj || !nj.id) return { ok: false };
        var koha = Date.now();
        try { await fs.setDoc(fs.doc(db, 'perdoruesit', uid(), 'njoftimet', nj.id), { kryer: true, kryerSe: koha, lexuar: true }, { merge: true }); }
        catch (e) { if (!/unavailable|deadline/.test(String(e && e.code))) return gabim(e); }
        if (!grupi) return { ok: true };
        var te = { kerkeseId: nj.kerkeseId || '', produkti: nj.produkti || '', barkodi: nj.barkodi || '', produktet: listaEKerkeses(nj) };
        if (nj.uid && nj.uid !== uid()) shtoNeRadhe(['perdoruesit', nj.uid, 'njoftimet'], Object.assign({ lloji: 'kerkese-kryer', grupi: grupi, uid: uid(), emri: emri(), koha: koha, lexuar: false }, te));
        return pritPak(shtoNeRadhe(rrG('feed'), Object.assign({ lloji: 'kerkese-kryer', uid: uid(), emri: emri(), koha: koha,
          kerkuesUid: nj.uid || '', kerkuesEmri: nj.emri || '' }, te)));
      },
      // Pronari vendos për heqjen e një kolegu: njoftimi i vet (vendim), njoftim te kolegu dhe ngjarje te aktiviteti
      vendosPerHeqjen: async function (nj, pranoj) {
        if (!uid() || !nj || !nj.id) return { ok: false };
        var koha = Date.now(), lloji = pranoj ? 'heqje-pranuar' : 'heqje-refuzuar';
        try { await fs.setDoc(fs.doc(db, 'perdoruesit', uid(), 'njoftimet', nj.id), { vendim: pranoj ? 'pranuar' : 'refuzuar', vendosurSe: koha, lexuar: true }, { merge: true }); }
        catch (e) { if (!/unavailable|deadline/.test(String(e && e.code))) return gabim(e); }
        if (!grupi) return { ok: true };
        var te = { afatId: nj.afatId || '', produkti: nj.produkti || '', barkodi: nj.barkodi || '', data: nj.data || '' };
        if (nj.uid && nj.uid !== uid()) shtoNeRadhe(['perdoruesit', nj.uid, 'njoftimet'], Object.assign({ lloji: lloji, grupi: grupi, uid: uid(), emri: emri(), koha: koha, lexuar: false }, te));
        return pritPak(shtoNeRadhe(rrG('feed'), Object.assign({ lloji: lloji, uid: uid(), emri: emri(), koha: koha, pronariUid: uid(),
          kerkuesUid: nj.uid || '', kerkuesEmri: nj.emri || '' }, te)));
      },
      // Fshin krejt chat-in ose aktivitetin e grupit ('chat' | 'feed')
      pastroKoleksionin: async function (k) {
        if (!grupi || (k !== 'chat' && k !== 'feed')) return { ok: false, n: 0 };
        try { return { ok: true, n: await pastroKol(rrG(k)) }; } catch (e) { var g = gabim(e); g.n = 0; return g; }
      },
      // Përmbledhja e afateve të një kolegu, pasi administratori ia ndryshoi afatet
      publikoAfatetPer: async function (u, emriPronarit, afatet) {
        if (!grupi) return { ok: false };
        try { await fs.setDoc(fs.doc(db, 'grupet', grupi, 'afatet', u), { uid: u, emri: emriPronarit || '', afatet: afatet, ndryshuarSe: Date.now() }); return { ok: true }; } catch (e) { return gabim(e); }
      },

      // ---------- Përmbledhja e afateve (grupet/{g}/afatet/{uid}) ----------
      publikoAfatet: async function (afatet) {
        if (!uid()) return { ok: false, arsye: 'pa-hyrje' };
        if (!grupi) return { ok: false, arsye: 'pa-grup' };
        try {
          await fs.setDoc(fs.doc(db, 'grupet', grupi, 'afatet', uid()), { uid: uid(), emri: emri(), afatet: afatet, ndryshuarSe: Date.now() });
          return { ok: true };
        } catch (e) { return gabim(e); }
      },
      // { uid: { emri, afatet, ndryshuarSe } }, në kohë reale
      degjoAfatetEEkipes: function (cb, cbGabim) {
        if (!grupi) return function () {};
        return fs.onSnapshot(fs.collection(db, 'grupet', grupi, 'afatet'), function (s) {
          var m = {};
          s.forEach(function (d) { var x = d.data() || {}; m[d.id] = { emri: x.emri || '', afatet: Array.isArray(x.afatet) ? x.afatet : [], ndryshuarSe: x.ndryshuarSe || 0 }; });
          cb(m);
        }, function (e) { if (cbGabim) cbGabim(e); });
      },

      // ---------- Aktiviteti ----------
      shtoNgjarje: function (ng) {
        if (!uid() || !grupi) return Promise.resolve({ ok: false, arsye: 'pa-grup' });
        return pritPak(shtoNeRadhe(rrG('feed'), Object.assign({}, ng, { uid: uid(), emri: emri(), koha: Date.now() })));
      },
      degjoNgjarjet: function (cb, n, cbGabim) {
        if (!grupi) return function () {};
        var q = fs.query(fs.collection(db, 'grupet', grupi, 'feed'), fs.orderBy('koha', 'desc'), fs.limit(n || 150));
        return fs.onSnapshot(q, function (s) { cb(listaNga(s)); }, function (e) { if (cbGabim) cbGabim(e); });
      },

      // ---------- Njoftimet push ----------
      pushMbeshtetet: pushMbeshtetet,
      aktivizoPush: aktivizoPush,
      caktivizoPush: caktivizoPush,
      pushAktiv: pushAktiv,
      orariIm: orariIm, vendosOrarin: vendosOrarin, dergoAfatetPerOrarin: dergoAfatetPerOrarin, lidhOren: lidhOren, merrHeqjetNgaOra: merrHeqjetNgaOra, pastroHeqjetNgaOra: pastroHeqjetNgaOra, statusiIOrarit: statusiIOrarit, provoKV: provoKV, rinovoOrarinNesesMungon: rinovoOrarinNesesMungon, orariPunon: orariPunon, kontrolloServerin: kontrolloServerin, VERSIONI_WORKER: 160,

      // ---------- Chat ----------
      dergoMesazh: function (tekst) {
        tekst = String(tekst || '').trim().slice(0, 2000);
        if (!tekst) return Promise.resolve({ ok: false, arsye: 'bosh' });
        if (!uid()) return Promise.resolve({ ok: false, arsye: 'pa-hyrje' });
        if (!grupi) return Promise.resolve({ ok: false, arsye: 'pa-grup' });
        return pritPak(shtoNeRadhe(rrG('chat'), { uid: uid(), emri: emri(), tekst: tekst, koha: Date.now() }, true));
      },
      degjoChatin: function (cb, n, cbGabim) {
        if (!grupi) return function () {};
        var q = fs.query(fs.collection(db, 'grupet', grupi, 'chat'), fs.orderBy('koha', 'desc'), fs.limit(n || 150));
        return fs.onSnapshot(q, function (s) { cb(listaNga(s)); }, function (e) { if (cbGabim) cbGabim(e); });
      },
      fshijMesazhin: async function (id) {
        hiqNgaRadha(id); // nëse s'është dërguar ende, s'dërgohet më
        if (!grupi) return { ok: false };
        try { await fs.deleteDoc(fs.doc(db, 'grupet', grupi, 'chat', id)); return { ok: true }; } catch (e) { return gabim(e); }
      },

      // ---------- Njoftimet personale (vetëm brenda grupit: rregullat e kontrollojnë me fushën `grupi`) ----------
      dergoNjoftim: function (pronariUid, nj) {
        if (!uid()) return Promise.resolve({ ok: false, arsye: 'pa-hyrje' });
        if (!grupi) return Promise.resolve({ ok: false, arsye: 'pa-grup' });
        return pritPak(shtoNeRadhe(['perdoruesit', pronariUid, 'njoftimet'], Object.assign({}, nj, { grupi: grupi, uid: uid(), emri: emri(), koha: Date.now(), lexuar: false })));
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
  // Prania si ikonë (jo tekst): online = ikona e pajisjes (telefon/kompjuter) me pikë të gjelbër;
  // offline = ikonë "jashtë linje" + koha kur u pa. Kthen { online, html, titulli } (html vetëm me ikona + kohë).
  var IK_TEL = '<rect x="6" y="2" width="12" height="20" rx="2.5"></rect><path d="M11 18h2"></path>';
  var IK_PC = '<rect x="2" y="3" width="20" height="14" rx="2"></rect><path d="M8 21h8M12 17v4"></path>';
  var IK_OFF = '<path d="M2 2l20 20"></path><path d="M8.5 16.5a5 5 0 0 1 7 0"></path><path d="M5 12.9a10 10 0 0 1 5.2-2.8"></path><path d="M19 12.9a10 10 0 0 0-2.3-1.6"></path><path d="M2 8.8a15 15 0 0 1 4.2-2.6"></path><path d="M22 8.8a15 15 0 0 0-11.3-3.8"></path><path d="M12 20h.01"></path>';
  function svgIk(p, m) { return '<svg width="' + (m || 15) + '" height="' + (m || 15) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; }
  function praniaIkone(a, uneJam, platformaIme, tani) {
    tani = tani || Date.now();
    var online = !!uneJam || eshteOnline(a, tani);
    var pl = uneJam ? platformaIme : (a && a.platforma);
    var emriPl = pl === 'pc' ? 'në kompjuter' : pl === 'tel' ? 'në telefon' : '';
    if (online) {
      return { online: true, titulli: 'Online tani' + (emriPl ? ' ' + emriPl : ''),
        html: (pl ? svgIk(pl === 'pc' ? IK_PC : IK_TEL) : '') + '<span class="pk"></span>' };
    }
    var kur = a && a.aktivSe ? kohaRelative(a.aktivSe, tani) : '';
    return { online: false, titulli: 'Jashtë linje' + (kur ? ' · parë ' + kur : '') + (emriPl ? ' (' + emriPl + ')' : ''),
      html: svgIk(IK_OFF) + (kur ? '<span class="kur">' + String(kur).replace(/[<>&"]/g, '') + '</span>' : '') };
  }

  // Heqjet nga rafti të bëra nga kolegët (nga aktiviteti) → afati tregohet "i hequr" te të gjithë,
  // edhe para se aplikacioni i pronarit ta ketë zbatuar në dyqanin e tij.
  // Heqjet nga rafti që një koleg i bëri në afatet e dikujt tjetër (ngjarja "hequr" me pronariUid) dhe vendimi i pronarit
  // ("heqje-pranuar" / "heqje-refuzuar"). Çelësi: pronariUid|afatId → { heqja, vendimi }.
  function eshteHeqjeKolegu(ng) { return ng && ng.lloji === 'hequr' && ng.pronariUid && ng.afatId && ng.pronariUid !== ng.uid; }
  function hartaEHeqjeve(ngjarjet) {
    var m = {};
    (ngjarjet || []).forEach(function (ng) {
      if (!ng || !ng.afatId) return;
      if (eshteHeqjeKolegu(ng)) {
        var k = ng.pronariUid + '|' + ng.afatId;
        m[k] = m[k] || {};
        if (!m[k].heqja || m[k].heqja.koha < ng.koha) m[k].heqja = ng;
      } else if (ng.lloji === 'heqje-pranuar' || ng.lloji === 'heqje-refuzuar') {
        var kv = (ng.pronariUid || ng.uid) + '|' + ng.afatId;
        m[kv] = m[kv] || {};
        if (!m[kv].vendimi || m[kv].vendimi.koha < ng.koha) m[kv].vendimi = ng;
      }
    });
    return m;
  }
  // v179: heqja e kolegut s'e heq më afatin; afati shfaqet "në pritje" derisa pronari ta pranojë (atëherë vjen i hequr
  // nga vetë pronari) ose ta refuzojë.
  function mbivendosHeqjen(afat, pronariUid, harta) {
    var h = harta && harta[pronariUid + '|' + afat.id];
    var ng = h && h.heqja;
    if (!ng || afat.statusi === 'hequr' || (afat.ndryshuarSe || 0) >= ng.koha) return afat;
    if (h.vendimi && h.vendimi.koha >= ng.koha) return afat;
    return Object.assign({}, afat, { nePritjeNga: ng.emri || 'Një koleg', nePritjeUid: ng.uid, nePritjeSe: ng.koha });
  }
  // A duhet ta zbatojë pronari heqjen që i dërgoi një koleg? Vetëm për afate të skaduara vërtet, dhe jo nëse
  // pronari e ka ndryshuar afatin pas heqjes (p.sh. e ktheu si aktiv).
  function duhetZbatuarHeqja(afat, nj) {
    if (!afat || !nj || afat.statusi === 'hequr') return false;
    if (AF().statusi(afat) !== 'skaduar') return false;
    return (afat.ndryshuarSe || 0) < (nj.koha || 0);
  }

  // Përmbledhja e afateve që u shfaqet kolegëve (ekipa_afatet/{uid}): vetëm fushat që duhen, afatet në raft +
  // të hequrat e 40 ditëve të fundit, brenda një madhësie të sigurt për një dokument (së pari ato në raft).
  var FUSHAT_E_PERMBLEDHJES = ['id', 'barkodi', 'emri', 'data', 'sasia', 'furnizuesi', 'statusi', 'hequrSe', 'hequrNga', 'lajmeruarSe', 'ndryshuarSe'];
  function permbledhjaEAfateve(afatet, tani) {
    tani = tani || Date.now();
    var kufiri = tani - PERMBLEDHJA_HEQUR_DITE * 86400000;
    var lista = (afatet || []).filter(function (a) {
      return a && a.id && (a.statusi !== 'hequr' || (a.hequrSe || 0) >= kufiri);
    }).map(function (a) {
      var r = {};
      FUSHAT_E_PERMBLEDHJES.forEach(function (k) { if (a[k] !== undefined && a[k] !== null && a[k] !== '') r[k] = a[k]; });
      return r;
    });
    lista.sort(function (x, y) {
      var hx = x.statusi === 'hequr', hy = y.statusi === 'hequr';
      if (hx !== hy) return hx ? 1 : -1;
      if (hx) return (y.hequrSe || 0) - (x.hequrSe || 0) || String(x.id).localeCompare(String(y.id));
      return String(x.data || '').localeCompare(String(y.data || '')) || String(x.id).localeCompare(String(y.id));
    });
    var madhesia = 0, rez = [];
    for (var i = 0; i < lista.length; i++) {
      madhesia += JSON.stringify(lista[i]).length * 1.2 + 40; // ~bajtet në Firestore (shkronjat ë/ç = 2 bajt)
      if (madhesia > PERMBLEDHJA_MAKS) break;
      rez.push(lista[i]);
    }
    return rez;
  }
  function nenshkrimi(x) {
    var s = JSON.stringify(x), h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36) + ':' + s.length;
  }

  // Administratori ndryshon një afat të një kolegu direkt në dyqanin e tij: kthen gjendjen e re (ose null nëse s'u gjet).
  // veprimi: 'hiq' (shëno të hequr) | 'kthe' (ktheje në raft) | 'fshij'
  function ndryshoAfatinNeGjendje(gjendja, afatId, veprimi, emriAdminit, tani) {
    tani = tani || Date.now();
    var g = Object.assign({}, gjendja || {});
    var afatet = Array.isArray(g.afatet) ? g.afatet : [];
    if (!afatet.some(function (a) { return a && a.id === afatId; })) return null;
    if (veprimi === 'fshij') {
      g.afatet = afatet.filter(function (a) { return a.id !== afatId; });
      var f = Object.assign({ produktet: {}, foldera: {}, afatet: {} }, g.fshira || {});
      f.afatet = Object.assign({}, f.afatet || {});
      f.afatet[afatId] = tani;
      g.fshira = f;
    } else {
      g.afatet = afatet.map(function (a) {
        if (a.id !== afatId) return a;
        return veprimi === 'kthe'
          ? Object.assign({}, a, { statusi: 'aktiv', hequrSe: 0, hequrNga: '', ndryshuarSe: tani })
          : Object.assign({}, a, { statusi: 'hequr', hequrSe: tani, hequrNga: emriAdminit || '', ndryshuarSe: tani });
      });
    }
    return g;
  }
  var FJALA_E_VEPRIMIT = { hiq: 'e hoqi nga rafti', kthe: 'e ktheu në raft', fshij: 'e fshiu' };

  // Fletët e Excel-it për stokun e një anëtari (xlsx.js buildWorkbook)
  function fletetEStokut(emriAnetarit, produktet, foldera) {
    var emriF = {};
    (foldera || []).forEach(function (f) { emriF[f.id] = f.emri; });
    var rreshtat = (produktet || []).slice().sort(function (a, b) {
      return String(emriF[a.kategoriaId] || '').localeCompare(String(emriF[b.kategoriaId] || ''), 'sq') || String(a.emri || '').localeCompare(String(b.emri || ''), 'sq');
    }).map(function (p) { return [p.barkodi, p.emri || '', emriF[p.kategoriaId] || 'Pa folder', p.sasia | 0, p.prekurSe || '']; });
    return [{ name: String(emriAnetarit || 'Stoku').slice(0, 28), totalLabel: 'Gjithsej', totalColumns: [3], redZeroColumn: 3, rows: rreshtat, columns: [
      { title: 'Barkodi', width: 20, type: 'text' }, { title: 'Emri i produktit', width: 44, type: 'text' },
      { title: 'Folderi', width: 20, type: 'text' }, { title: 'Sasia', width: 10, type: 'number' }, { title: 'Ndryshuar më', width: 18, type: 'date' }] }];
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
          detaje: [iKujt, iKujt ? 'kërkon miratimin e pronarit' : '', dataTx ? 'skadoi më ' + dataTx : '', ng.sasia ? ng.sasia + ' copë' : ''].filter(Boolean).join(' · ') };
      case 'heqje-pranuar':
        return { lloji: 'hequr', kush: kush, cfare: (ng.uid === uidIm ? 'e pranove' : 'e pranoi') + ' heqjen nga rafti: ' + (ng.produkti || ng.barkodi || 'produkt'),
          detaje: 'e hoqi ' + (ng.kerkuesUid === uidIm ? 'ti' : (ng.kerkuesEmri || 'një koleg')) };
      case 'heqje-refuzuar':
        return { lloji: 'rikthyer', kush: kush, cfare: (ng.uid === uidIm ? 'e refuzove' : 'e refuzoi') + ' heqjen nga rafti: ' + (ng.produkti || ng.barkodi || 'produkt'),
          detaje: 'mbetet në raft · e kishte hequr ' + (ng.kerkuesUid === uidIm ? 'ti' : (ng.kerkuesEmri || 'një koleg')) };
      case 'lajmeruar':
        return { lloji: 'lajmeruar', kush: kush, cfare: (ng.uid === uidIm ? 'e lajmërove' : 'e lajmëroi') + ' furnizuesin' + (ng.furnizuesi ? ' ' + ng.furnizuesi : ''),
          detaje: ng.n ? ng.n + (ng.n === 1 ? ' produkt afër skadimit' : ' produkte afër skadimit') : '' };
      case 'afate-te-reja':
        return { lloji: 'afate-te-reja', kush: kush, cfare: (ng.uid === uidIm ? 'shtove ' : 'shtoi ') + (ng.n || 1) + ((ng.n || 1) === 1 ? ' afat të ri' : ' afate të reja'),
          detaje: ng.ngaFoto ? 'nga fleta e fotografuar' : '' };
      case 'rikthyer':
        return { lloji: 'rikthyer', kush: kush, cfare: (ng.uid === uidIm ? 'e ktheve' : 'e ktheu') + ' në raft: ' + (ng.produkti || ng.barkodi || 'produkt'), detaje: '' };
      case 'anetar-i-ri':
        // Pranimi nga administratori: ngjarja e shkruan ai, por i riu është anetari/anetariEmri
        if (ng.anetariUid && ng.anetariUid !== ng.uid) {
          var iRi = ng.anetariUid === uidIm;
          return { lloji: 'anetar-i-ri', kush: iRi ? 'Ti' : (ng.anetariEmri || 'Një koleg'), cfare: iRi ? 'u pranove në ekipë' : 'u bashkua me ekipën',
            detaje: 'pranuar nga ' + (ng.uid === uidIm ? 'ti' : (ng.emri || 'administratori')), avatar: ng.anetariEmri || '' };
        }
        return { lloji: 'anetar-i-ri', kush: kush, cfare: ng.uid === uidIm ? 'u bashkove me ekipën' : 'u bashkua me ekipën', detaje: '' };
      case 'lajmerim':
        return { lloji: 'lajmerim', kush: kush, cfare: ng.uid === uidIm ? 'njoftove krejt ekipën' : 'njoftoi krejt ekipën', detaje: ng.tekst || '' };
      case 'kerkese-heqje':
        return { lloji: 'lajmeruar', kush: kush, cfare: (ng.uid === uidIm ? 'kërkove' : 'kërkoi') + ' heqjen nga rafti: ' + produktiIKerkeses(ng),
          detaje: (ng.perUid ? 'për ' + (ng.perUid === uidIm ? 'ty' : (ng.perEmri || 'një koleg')) : 'për krejt ekipën') + (ng.shenim ? ' · ' + ng.shenim : '') };
      case 'kerkese-kryer':
        return { lloji: 'hequr', kush: kush, cfare: (ng.uid === uidIm ? 'e hoqe' : 'e hoqi') + ' nga rafti: ' + produktiIKerkeses(ng),
          detaje: 'me kërkesë të ' + (ng.kerkuesUid === uidIm ? 'teje' : (ng.kerkuesEmri || 'një kolegu')) };
      case 'admin-afat':
        return { lloji: 'admin-afat', kush: kush, cfare: (FJALA_E_VEPRIMIT[ng.veprimi] || 'ndryshoi') + ': ' + (ng.produkti || ng.barkodi || 'produkt'),
          detaje: ng.pronariUid === uidIm ? 'produkt i yti' : 'i përket: ' + (ng.pronariEmri || 'kolegut') };
      default:
        return { lloji: ng.lloji || '', kush: kush, cfare: ng.tekst || '', detaje: '' };
    }
  }

  // Produktet e një kërkese për heqje: lista `produktet` (v148), ose produkti/barkodi i vetëm (kërkesat e para)
  var KERKESA_MAKS = 30;
  function listaEKerkeses(k) {
    var l = (k && Array.isArray(k.produktet) && k.produktet.length) ? k.produktet : [{ produkti: k && k.produkti, barkodi: k && k.barkodi, data: k && k.data }];
    return l.filter(function (x) { return x && (x.produkti || x.barkodi); }).slice(0, KERKESA_MAKS).map(function (x) {
      return { produkti: String(x.produkti || '').trim().slice(0, 120), barkodi: String(x.barkodi || '').trim().slice(0, 40), data: /^\d{4}-\d{2}-\d{2}$/.test(x.data || '') ? x.data : '' };
    });
  }
  function emriIProduktit(x) { var p = x.produkti, b = x.barkodi; return p && b && p !== b ? p + ' (' + b + ')' : (p || b || 'produkt'); }
  // Një rresht për listën te njoftimet: "Kos Vita · 3900… · skadoi më 12.09.2026"
  function rreshtiIProduktit(x) {
    var A = AF();
    return [x.produkti || x.barkodi || 'produkt', x.produkti && x.barkodi ? x.barkodi : '', x.data && A ? 'skadoi më ' + A.formato(x.data) : ''].filter(Boolean).join(' · ');
  }
  function produktiIKerkeses(k) {
    var l = listaEKerkeses(k);
    if (l.length <= 1) return emriIProduktit(l[0] || {});
    var emrat = l.slice(0, 3).map(function (x) { return x.produkti || x.barkodi; });
    return l.length + ' produkte (' + emrat.join(', ') + (l.length > 3 ? ' e ' + (l.length - 3) + (l.length - 3 === 1 ? ' tjetër' : ' të tjera') : '') + ')';
  }

  // Zgjedhësi i produkteve te "Kërko heqje nga rafti" (tel + PC): dy lista (të skaduarat / krejt produktet), kërkim
  // dhe shenja (disa njëherësh). burimet: { skaduara: [{ produkti, barkodi, data, nen }], produktet: [...] }
  function zgjedhesIKerkeses(rrenja, burimet, kurNdryshon) {
    var zgjedhur = {}, rendi = [], tabi = (burimet.skaduara || []).length ? 'skaduara' : 'produktet', kerkimi = '';
    function celes(x) { return (x.barkodi || '') + '|' + (x.produkti || '') + '|' + (x.data || ''); }
    function el(tag, kl, tk) { var e = document.createElement(tag); if (kl) e.className = kl; if (tk != null) e.textContent = tk; return e; }
    rrenja.textContent = '';
    var tabet = el('div', 'krk-tabet'); tabet.setAttribute('role', 'tablist');
    var bT = {};
    [['skaduara', 'Të skaduarat'], ['produktet', 'Produktet e mia']].forEach(function (t) {
      var b = el('button', 'krk-tab'); b.type = 'button'; b.setAttribute('role', 'tab');
      b.appendChild(el('span', null, t[1])); b.appendChild(el('span', 'krk-tab__nr', String((burimet[t[0]] || []).length)));
      b.addEventListener('click', function () { tabi = t[0]; vizato(); });
      bT[t[0]] = b; tabet.appendChild(b);
    });
    var kerko = el('input', 'krk-kerko inp'); kerko.type = 'search'; kerko.placeholder = 'Kërko në listë…'; kerko.setAttribute('aria-label', 'Kërko në listë');
    kerko.autocomplete = 'off'; kerko.spellcheck = false;
    kerko.addEventListener('input', function () { kerkimi = kerko.value.trim().toLowerCase(); vizato(); });
    var lista = el('div', 'krk-lista'); lista.setAttribute('role', 'listbox'); lista.setAttribute('aria-multiselectable', 'true');
    rrenja.appendChild(tabet); rrenja.appendChild(kerko); rrenja.appendChild(lista);
    function vizato() {
      Object.keys(bT).forEach(function (k) { bT[k].classList.toggle('aktiv', k === tabi); bT[k].setAttribute('aria-selected', k === tabi ? 'true' : 'false'); });
      lista.textContent = '';
      var te = (burimet[tabi] || []).filter(function (x) {
        return !kerkimi || (String(x.produkti || '') + ' ' + String(x.barkodi || '')).toLowerCase().indexOf(kerkimi) !== -1;
      });
      if (!te.length) {
        lista.appendChild(el('div', 'krk-bosh', kerkimi ? 'Asgjë s\'përputhet me kërkimin.' : tabi === 'skaduara' ? 'S\'ke produkte të skaduara në raft.' : 'S\'ke ende produkte në Stoku.'));
        return;
      }
      te.slice(0, 300).forEach(function (x) {
        var c = celes(x), on = !!zgjedhur[c];
        var b = el('button', 'krk-rresht' + (on ? ' zgjedhur' : '')); b.type = 'button';
        b.setAttribute('role', 'option'); b.setAttribute('aria-selected', on ? 'true' : 'false');
        var sh = el('span', 'krk-shenja'); sh.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>';
        var tk = el('span', 'krk-tk');
        tk.appendChild(el('b', null, x.produkti || x.barkodi || 'produkt'));
        var nen = [x.produkti && x.barkodi ? x.barkodi : '', x.nen || ''].filter(Boolean).join(' · ');
        if (nen) tk.appendChild(el('span', null, nen));
        b.appendChild(sh); b.appendChild(tk);
        b.addEventListener('click', function () {
          if (zgjedhur[c]) { delete zgjedhur[c]; rendi = rendi.filter(function (k) { return k !== c; }); }
          else { if (rendi.length >= KERKESA_MAKS) return; zgjedhur[c] = x; rendi.push(c); }
          vizato(); if (kurNdryshon) kurNdryshon(rendi.length);
        });
        lista.appendChild(b);
      });
    }
    vizato();
    return {
      zgjedhur: function () { return rendi.map(function (k) { return { produkti: zgjedhur[k].produkti || '', barkodi: zgjedhur[k].barkodi || '', data: zgjedhur[k].data || '' }; }); },
      numri: function () { return rendi.length; }
    };
  }
  // Teksti i një njoftimi personal (zilja + njoftimi i sistemit)
  function tekstiNjoftimit(nj) {
    if (nj.lloji === 'kerkese-heqje') return (nj.emri || 'Një koleg') + (nj.perKrejt ? ' i kërkon ekipës ta heqë nga rafti: ' : ' të kërkon ta heqësh nga rafti: ') +
      produktiIKerkeses(nj) + (nj.shenim ? ' · ' + nj.shenim : '');
    if (nj.lloji === 'kerkese-kryer') return (nj.emri || 'Një koleg') + ' e hoqi nga rafti: ' + produktiIKerkeses(nj) + ' (kërkesa jote)';
    if (nj.lloji === 'hequr') {
      var A = AF();
      return (nj.emri || 'Një koleg') + ' e hoqi nga rafti: ' + (nj.produkti || nj.barkodi || 'produkt') +
        (nj.data && A ? ' (skadoi më ' + A.formato(nj.data) + ')' : '');
    }
    if (nj.lloji === 'heqje-pranuar') return (nj.emri || 'Pronari') + ' e pranoi heqjen nga rafti: ' + (nj.produkti || nj.barkodi || 'produkt');
    if (nj.lloji === 'heqje-refuzuar') return (nj.emri || 'Pronari') + ' e refuzoi heqjen nga rafti: ' + (nj.produkti || nj.barkodi || 'produkt') + ' (mbetet në raft)';
    if (nj.lloji === 'lajmerim') return (nj.emri || 'Administratori') + ': ' + (nj.tekst || '');
    if (nj.lloji === 'admin-afat') return (nj.emri || 'Administratori') + ' ' + (FJALA_E_VEPRIMIT[nj.veprimi] || 'ndryshoi') + ': ' + (nj.produkti || nj.barkodi || 'produkt');
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
  var KEY_ANETARESIA = 'stoku:ekipa:anetaresia';  // { uid, gjendja, admin } — e fundit e ditur (hapje e shpejtë / pa internet)
  var KEY_PUBLIKUAR = 'stoku:ekipa:publikuar';     // nënshkrimi i përmbledhjes së fundit të dërguar nga kjo pajisje

  function krijoKontrollues(o) {
    var gj = {
      anetaret: [], dyqanet: {}, ngarkuarSe: 0, dukeNgarkuar: false, gabimNgarkimi: '',
      ngjarjet: [], ngjarjetGati: false, chat: [], chatGati: false, chatHapur: false,
      njoftimetPalexuara: [], mesazhiFundit: null, hapur: false,
      anetaresia: null,          // 'anetar' (i një grupi) | 'pa-grup' | 'pa-rregulla' (rregullat e grupeve mungojnë) | null (s'dihet ende)
      grupi: null,               // id e grupit (grupet/{grupi})
      grupiInfo: null,           // { id, emri, pronarUid, pronarEmri }
      roli: 'anetar',            // 'pronar' (fton, heq, menaxhon) | 'anetar'
      ftesatEMia: [],            // ftesat që më kanë ardhur: [{ id, gid, grupiEmri, ngaEmri, koha }]
      ftesatEGrupit: [],         // ftesat e dërguara nga grupi im, ende pa u pranuar
      krejtLlogarite: null,      // administratori: krejt llogaritë (për "Llogaritë e tjera")
      admin: false,
      permbledhjet: null,        // { uid: { emri, afatet, ndryshuarSe } } nga grupet/{g}/afatet
      permbledhjetGabim: false   // përmbledhjet s'lexohen → lexohen dyqanet (vetëm administratori mundet)
    };
    var d = {};
    var chatNisurSe = 0, rifreskimKohez = {}, afateTeReja = { n: 0, ngaFoto: false, kohez: null };
    var publikimi = { kohez: null, nenshkrimi: null, bllokuarDeri: 0, afatet: null };
    var migrimiNeRruge = false;

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

    // ---------- Grupi (anëtarësia) ----------
    function ruajAnetaresine() {
      var u = o.uidIm();
      if (u) shkruaj(KEY_ANETARESIA, JSON.stringify({ uid: u, gjendja: gj.anetaresia, admin: gj.admin, grupi: gj.grupi, roli: gj.roli, grupiEmri: gj.grupiInfo ? gj.grupiInfo.emri : '' }));
    }
    function ngarkoAnetaresine() {
      var x = null;
      try { x = JSON.parse(lexo(KEY_ANETARESIA) || 'null'); } catch (e) { x = null; }
      var imi = !!(x && x.uid === o.uidIm());
      // Vetëm gjendjet e grupeve (ruajtja e vjetër 'jo'/'anetar' pa grup s'vlen më)
      var ok = imi && ((x.gjendja === 'anetar' && x.grupi) || x.gjendja === 'pa-grup');
      gj.anetaresia = ok ? x.gjendja : null;
      gj.admin = imi ? !!x.admin : false;
      gj.grupi = ok && x.gjendja === 'anetar' ? x.grupi : null;
      gj.roli = ok && x.roli === 'pronar' ? 'pronar' : 'anetar';
      gj.grupiInfo = gj.grupi ? { id: gj.grupi, emri: x.grupiEmri || '' } : null;
      var e = E(); if (e && e.vendosGrupin) e.vendosGrupin(gj.grupi);
    }
    // 'ok' (anëtar i një grupi) | 'pa-grup' (krijon grupin e vet ose pranon një ftesë) | 'pa-rregulla' | 'duke-kontrolluar'
    function gjendjaEQasjes() {
      if (gj.anetaresia === 'anetar' && gj.grupi) return 'ok';
      if (gj.anetaresia === 'pa-grup' || gj.anetaresia === 'pa-rregulla') return gj.anetaresia;
      return 'duke-kontrolluar';
    }
    function eshtePronar() { return gjendjaEQasjes() === 'ok' && gj.roli === 'pronar'; }
    function pastroTeDhenatEGrupit() {
      gj.anetaret = []; gj.permbledhjet = null; gj.permbledhjetGabim = false; gj.ngjarjet = []; gj.ngjarjetGati = false;
      gj.chat = []; gj.chatGati = false; gj.dyqanet = {}; gj.ngarkuarSe = 0; gj.ftesatEGrupit = []; gj.mesazhiFundit = null;
    }
    // Grupi ndryshoi (u krijua, u pranua një ftesë, u hoq, u largua): krejt dëgjuesit rinisen me rrugët e grupit të ri
    function kurNdryshonQasja() {
      var e = E();
      if (e && e.vendosGrupin) e.vendosGrupin(gjendjaEQasjes() === 'ok' ? gj.grupi : null);
      var hapur = gj.hapur, chati = gj.chatHapur;
      mbyllDegjuesitEFaqes(); mbyllChatin();
      pastroTeDhenatEGrupit();
      nisDegjuesitEGrupit();
      nisDegjuesitPersonale();
      if (gj.admin && gj.anetaresia === 'pa-grup') migroNeseDuhet();
      if (hapur) { hap(); if (chati) hapChatin(); }
      else thirr('te-gjitha');
    }
    // Grupi i ri vendoset menjëherë (pa pritur dëgjuesin e Firestore-it, që e konfirmon pak më vonë)
    function aplikoGrupin(g, roli, emriG) {
      var gjendja = g ? 'anetar' : 'pa-grup';
      var ndryshoi = g !== gj.grupi || gj.anetaresia !== gjendja;
      gj.anetaresia = gjendja; gj.grupi = g || null; gj.roli = roli === 'pronar' ? 'pronar' : 'anetar';
      gj.grupiInfo = g ? { id: g, emri: emriG || (gj.grupiInfo && gj.grupiInfo.id === g ? gj.grupiInfo.emri : '') } : null;
      ruajAnetaresine();
      if (ndryshoi) kurNdryshonQasja(); else thirr('te-gjitha');
    }
    // Leja e butonave +/- nga pronari i grupit (anëtarësia ime): vlen si leja e administratorit
    function vendosLejenLokale(po) {
      var u = o.uidIm();
      if (!u) return;
      var v = po ? u : '!' + u;
      if (lexo('stoku:leja:sasia-shpejte') === v) return;
      shkruaj('stoku:leja:sasia-shpejte', v);
      try { window.dispatchEvent(new Event('stoku-leja-ndryshoi')); } catch (e) { /* node */ }
    }
    function nisDegjuesitEGrupit() {
      var e = E();
      ndal('grupiDoc');
      if (!e || !e.degjoGrupinDoc || gjendjaEQasjes() !== 'ok') return;
      var g = gj.grupi;
      d.grupiDoc = e.degjoGrupinDoc(g, function (x) {
        if (g !== gj.grupi) return;
        gj.grupiInfo = x ? { id: g, emri: x.emri || '', pronarUid: x.pronarUid || '', pronarEmri: x.pronarEmri || '' }
          : { id: g, emri: g === 'ekipa' ? 'Ekipa' : ((gj.grupiInfo && gj.grupiInfo.emri) || '') };
        ruajAnetaresine();
        thirr('grupi');
      });
    }
    // Ftesat që më vijnë (gjithmonë, sa kohë jam i kyçur): shenja te Ekipa + njoftim një herë
    function nisFtesatEMia() {
      var e = E();
      ndal('ftesatEMia');
      gj.ftesatEMia = [];
      if (!e || !e.degjoFtesatEMia || !o.uidIm()) return;
      d.ftesatEMia = e.degjoFtesatEMia(function (lista) {
        gj.ftesatEMia = lista.filter(function (f) { return f.gid && f.gid !== gj.grupi; }).sort(function (a, b) { return (b.koha || 0) - (a.koha || 0); });
        gj.ftesatEMia.forEach(function (f) {
          if ((Date.now() - (f.koha || 0)) > 7 * 86400000 || uNjoftua('ft:' + f.id + ':' + (f.koha || 0)) || !o.njofto) return;
          o.njofto({ titulli: 'Stoku · Ftesë në ekipë', tag: 'ek-ft-' + f.id, pamja: 'anetaret',
            teksti: (f.ngaEmri || 'Dikush') + ' të fton në ekipën "' + (f.grupiEmri || 'pa emër') + '". Hape Ekipën për ta pranuar.' });
        });
        thirr('ftesat');
      }, function () { gj.ftesatEMia = []; thirr('ftesat'); });
    }
    async function kontrolloAdminin() {
      var e = E();
      if (!e || !e.eshteAdmin) return;
      var a = await e.eshteAdmin();
      if (a === null || !o.uidIm()) return; // pa internet: mbetet e fundit e ditur
      if (a !== gj.admin) { gj.admin = a; ruajAnetaresine(); thirr('te-gjitha'); }
      if (a && gj.anetaresia === 'pa-grup') migroNeseDuhet();
    }
    // Administratori, një herë: ekipa e vjetër (para grupeve) bëhet grupi "ekipa", me historikun
    async function migroNeseDuhet() {
      var e = E();
      if (migrimiNeRruge || !e || !e.migroEkipenEVjeter || !gj.admin || gj.anetaresia !== 'pa-grup') return;
      migrimiNeRruge = true;
      var r = await e.migroEkipenEVjeter();
      migrimiNeRruge = false;
      if (r && r.ok && !r.bere && e.grupiAktual && e.grupiAktual()) aplikoGrupin(e.grupiAktual(), 'pronar', 'Ekipa');
    }

    // ---------- Veprimet e grupit ----------
    async function krijoGrupin(emriG) {
      var e = E();
      if (!e || !e.krijoGrupin) return { ok: false };
      if (gjendjaEQasjes() === 'ok') return { ok: false, arsye: 'ne-grup' };
      var r = await e.krijoGrupin(emriG);
      if (r.ok) aplikoGrupin(r.grupi, 'pronar', String(emriG || '').trim().replace(/\s+/g, ' ').slice(0, 60));
      return r;
    }
    // A mund të largohet nga grupi aktual? Pronari i vetëm (me anëtarë të tjerë) duhet ta bëjë dikë tjetër pronar më parë.
    function mundTeLargohet() {
      if (gjendjaEQasjes() !== 'ok') return { ok: true, iFundit: false };
      if (!gj.anetaret.length) return { ok: false, arsye: 'duke-ngarkuar' };
      var uIm = o.uidIm();
      var tjeret = gj.anetaret.filter(function (a) { return a.uid !== uIm; });
      if (gj.roli === 'pronar' && tjeret.length && !tjeret.some(function (a) { return a.pronar; })) return { ok: false, arsye: 'pronari-i-vetem' };
      return { ok: true, iFundit: !tjeret.length };
    }
    async function pranoFtesen(f) {
      var e = E();
      if (!e || !e.pranoFtesen || !f) return { ok: false };
      var neGrup = gjendjaEQasjes() === 'ok', m = mundTeLargohet();
      if (neGrup && !m.ok) return m;
      var r = await e.pranoFtesen(f, neGrup && m.iFundit);
      if (r.ok || r.arsye === 'ftesa-skadoi') gj.ftesatEMia = gj.ftesatEMia.filter(function (x) { return x.id !== f.id; });
      if (r.ok) aplikoGrupin(f.gid, 'anetar', f.grupiEmri || '');
      else if (r.arsye === 'ftesa-skadoi') thirr('ftesat');
      return r;
    }
    async function refuzoFtesen(f) {
      var e = E();
      if (!e || !e.refuzoFtesen || !f) return { ok: false };
      var r = await e.refuzoFtesen(f);
      if (r.ok) { gj.ftesatEMia = gj.ftesatEMia.filter(function (x) { return x.id !== f.id; }); thirr('ftesat'); }
      return r;
    }
    async function largohuNgaGrupi() {
      var e = E();
      if (!e || !e.largohuNgaGrupi || gjendjaEQasjes() !== 'ok') return { ok: false };
      var m = mundTeLargohet();
      if (!m.ok) return m;
      var r = await e.largohuNgaGrupi(m.iFundit);
      if (r.ok) aplikoGrupin(null);
      return r;
    }
    // Pronari: fton një emër përdoruesi
    async function ftoNeGrup(emriP) {
      var e = E();
      if (!e || !e.ftoNeGrup || !eshtePronar()) return { ok: false, arsye: 'jo-pronar' };
      var p = String(emriP || '').trim().toLowerCase();
      if (gj.anetaret.some(function (a) { return String(a.emri || '').toLowerCase() === p; })) return { ok: false, arsye: 'anetar' };
      if (gj.ftesatEGrupit.some(function (f) { return f.perdoruesi === p; })) return { ok: false, arsye: 'e-ftuar' };
      return e.ftoNeGrup(p, gj.grupiInfo ? gj.grupiInfo.emri : '');
    }
    async function anuloFtesen(f) {
      var e = E();
      if (!e || !e.anuloFtesen || !eshtePronar() || !f) return { ok: false };
      return e.anuloFtesen(f.id);
    }
    async function ndryshoRolin(a, roli) {
      var e = E();
      if (!e || !e.ndryshoRolin || !eshtePronar() || !a) return { ok: false };
      if (roli !== 'pronar' && !gj.anetaret.some(function (x) { return x.uid !== a.uid && x.pronar; })) return { ok: false, arsye: 'pronari-i-vetem' };
      return e.ndryshoRolin(a.uid, roli);
    }
    async function riemertoGrupin(emriG) {
      var e = E();
      if (!e || !e.riemertoGrupin || !eshtePronar()) return { ok: false };
      var r = await e.riemertoGrupin(emriG);
      if (r.ok && gj.grupiInfo) { gj.grupiInfo.emri = String(emriG).trim().replace(/\s+/g, ' ').slice(0, 60); ruajAnetaresine(); thirr('grupi'); }
      return r;
    }
    // Administratori: llogaritë jashtë grupit tim (për fshirje ose ftesë)
    function llogariteJashte() {
      if (!gj.admin || !gj.krejtLlogarite) return [];
      var uIm = o.uidIm(), neGrup = {};
      gj.anetaret.forEach(function (a) { neGrup[a.uid] = true; });
      return gj.krejtLlogarite.filter(function (a) { return !neGrup[a.uid] && a.uid !== uIm; })
        .sort(function (x, y) { return (y.kycurSe || y.aktivSe || 0) - (x.kycurSe || x.aktivSe || 0); });
    }
    // Pronari: heq një anëtar nga grupi (jo veten)
    async function hiqNgaEkipa(a) {
      var e = E();
      if (!e || !e.hiqNgaGrupi || !eshtePronar() || !a || a.uid === o.uidIm()) return { ok: false };
      var r = await e.hiqNgaGrupi(a.uid);
      if (r.ok) { gj.anetaret = gj.anetaret.filter(function (x) { return x.uid !== a.uid; }); thirr('anetaret'); }
      return r;
    }
    // Administratori: fshin llogarinë komplet (jo veten, jo një administrator tjetër)
    async function fshijLlogarine(a) {
      var e = E();
      if (!e || !e.fshijLlogarine || !gj.admin || !a || a.uid === o.uidIm() || a.admin) return { ok: false };
      var r = await e.fshijLlogarine(a.uid, a.emri);
      if (r.ok) {
        gj.anetaret = gj.anetaret.filter(function (x) { return x.uid !== a.uid; });
        if (gj.krejtLlogarite) gj.krejtLlogarite = gj.krejtLlogarite.filter(function (x) { return x.uid !== a.uid; });
        delete gj.dyqanet[a.uid];
        if (gj.permbledhjet) delete gj.permbledhjet[a.uid];
        thirr('anetaret');
      }
      return r;
    }
    // Pronari: leja e butonave +/- (sasia e shpejtë) për një anëtar
    async function vendosLejen(a, po) {
      var e = E();
      if (!e || !eshtePronar() || !e.vendosLejen) return { ok: false };
      return e.vendosLejen(a.uid, po);
    }
    // Kërkesë për heqje nga rafti (çdo anëtar): te një koleg (perUid) ose te krejt ekipa
    function koleget() { var im = o.uidIm(); return anetaretEDukshem().filter(function (a) { return a.uid !== im; }); }
    async function kerkoHeqjen(k) {
      var e = E();
      if (!e || !e.kerkoHeqjen) return { ok: false };
      var lista = koleget(), per = null;
      if (k.perUid) { lista.forEach(function (a) { if (a.uid === k.perUid) per = a; }); if (!per) return { ok: false, arsye: 'anetari' }; }
      if (!lista.length) return { ok: false, arsye: 'pa-kolege' };
      return e.kerkoHeqjen({ produktet: k.produktet, shenim: k.shenim, perUid: per ? per.uid : '', perEmri: per ? per.emri : '' },
        per ? [per.uid] : lista.map(function (a) { return a.uid; }));
    }
    async function kryejKerkesen(nj) {
      var e = E();
      if (!e || !e.kryejKerkesen) return { ok: false };
      var r = await e.kryejKerkesen(nj);
      if (r && r.ok) { nj.kryer = true; gj.njoftimetPalexuara = gj.njoftimetPalexuara.filter(function (x) { return x.id !== nj.id; }); thirr('njoftimet'); }
      return r;
    }
    // Pronari i grupit: njoftim te zilja e krejt anëtarëve
    async function lajmeroEkipen(tekst) {
      var e = E();
      if (!e || !eshtePronar() || !e.lajmeroEkipen) return { ok: false };
      return e.lajmeroEkipen(tekst, anetaretEDukshem().map(function (a) { return a.uid; }));
    }
    // Pronari i grupit: 'chat' | 'feed'
    async function pastro(k) {
      var e = E();
      if (!e || !eshtePronar() || !e.pastroKoleksionin) return { ok: false };
      return e.pastroKoleksionin(k);
    }
    // Administratori: stoku i plotë i një anëtari (vetëm lexim)
    async function merrStokun(uid) {
      var c = o.cloud && o.cloud();
      if (!c || !c.merrDyqaninEPerdoruesit || !gj.admin) return { ok: false };
      if (uid === o.uidIm() && o.stokuIm) return { ok: true, produktet: o.stokuIm().produktet, foldera: o.stokuIm().foldera };
      var r = await c.merrDyqaninEPerdoruesit(uid);
      if (!r || !r.ok) return { ok: false, kodi: r && r.kodi };
      return { ok: true, produktet: (r.gjendja && r.gjendja.produktet) || [], foldera: (r.gjendja && r.gjendja.foldera) || [] };
    }
    // Administratori: heq / kthen / fshin një afat të një kolegu direkt në dyqanin e tij; pronari njoftohet
    async function adminNdryshoAfatin(afat, veprimi) {
      var c = o.cloud && o.cloud(), e = E();
      if (!c || !c.ndryshoDyqaninEPerdoruesit || !e || !gj.admin || !afat || afat.pronariUid === o.uidIm()) return { ok: false };
      var uGjet = true;
      var r = await c.ndryshoDyqaninEPerdoruesit(afat.pronariUid, function (gjendja) {
        var g = ndryshoAfatinNeGjendje(gjendja, afat.id, veprimi, o.emriIm());
        if (!g) { uGjet = false; return gjendja; }
        return g;
      });
      if (!r || !r.ok) return r || { ok: false };
      if (!uGjet) return { ok: false, arsye: 'nuk-u-gjet' };
      var p = permbledhjaEAfateve((r.gjendja && r.gjendja.afatet) || []);
      if (!gj.permbledhjet) gj.permbledhjet = {};
      gj.permbledhjet[afat.pronariUid] = { emri: afat.pronariEmri || '', afatet: p, ndryshuarSe: Date.now() };
      if (gj.dyqanet[afat.pronariUid]) gj.dyqanet[afat.pronariUid] = { afatet: (r.gjendja && r.gjendja.afatet) || [], merrurSe: Date.now() };
      thirr('dyqanet');
      if (e.publikoAfatetPer) e.publikoAfatetPer(afat.pronariUid, afat.pronariEmri || '', p);
      var te = { lloji: 'admin-afat', veprimi: veprimi, afatId: afat.id, produkti: afat.emri || afat.barkodi || '', barkodi: afat.barkodi || '', data: afat.data || '' };
      e.dergoNjoftim(afat.pronariUid, te);
      e.shtoNgjarje(Object.assign({ pronariUid: afat.pronariUid, pronariEmri: afat.pronariEmri || '' }, te));
      return { ok: true };
    }

    // ---------- Gjithmonë, sa kohë je i kyçur ----------
    function nisGjithmone() {
      var e = E();
      ndalGjithmone(true);
      if (!e || !o.uidIm()) return;
      ngarkoAnetaresine();
      e.nisPranine();
      if (e.dergoRadhen) e.dergoRadhen(); // aktiviteti/chat-i/njoftimet që mbetën pa u dërguar herën e kaluar
      if (e.degjoGrupin) {
        d.anetaresia = e.degjoGrupin(function (r) {
          if (r.gjendja === 'gabim') return; // pa internet: mbetet gjendja e fundit e ditur
          var gRi = r.gjendja === 'anetar' ? r.grupi : null;
          var roliRi = r.gjendja === 'anetar' && r.roli === 'pronar' ? 'pronar' : 'anetar';
          if (r.gjendja === 'anetar' && typeof r.sasiaShpejte === 'boolean') vendosLejenLokale(r.sasiaShpejte);
          var ndryshoiGrupi = r.gjendja !== gj.anetaresia || gRi !== gj.grupi;
          if (!ndryshoiGrupi && roliRi === gj.roli) return;
          gj.anetaresia = r.gjendja; gj.grupi = gRi; gj.roli = roliRi;
          if (ndryshoiGrupi) gj.grupiInfo = gRi ? { id: gRi, emri: '' } : null;
          ruajAnetaresine();
          if (ndryshoiGrupi) kurNdryshonQasja(); else thirr('te-gjitha');
        });
        kontrolloAdminin();
      } else gj.anetaresia = 'pa-rregulla';
      nisDegjuesitEGrupit();
      nisFtesatEMia();
      nisDegjuesitPersonale();
      // Administratori e fshiu këtë llogari → aplikacioni e mbyll dhe e fshin (o.llogariaUFshi)
      if (e.degjoFshirjen && o.llogariaUFshi) d.fshirja = e.degjoFshirjen(function (x) { ndal('fshirja'); try { o.llogariaUFshi(x); } catch (er) { /* ok */ } });
      if (gj.hapur) hap(); // Ekipa ishte e hapur kur u hyr në llogari → lidhu tani
    }
    // Njoftimet personale + mesazhi i fundit i chat-it (për shenjat), vetëm kur ke qasje në ekipë
    function nisDegjuesitPersonale() {
      var e = E();
      ndal('njoftimet'); ndal('chatFundit');
      if (!e || !o.uidIm() || gjendjaEQasjes() !== 'ok') {
        gj.njoftimetPalexuara = []; gj.mesazhiFundit = null;
        thirr('njoftimet');
        return;
      }
      d.njoftimet = e.degjoNjoftimetEPalexuara(function (lista) {
        lista.sort(function (a, b) { return (b.koha || 0) - (a.koha || 0); });
        gj.njoftimetPalexuara = lista;
        lista.forEach(function (n) {
          if (uNjoftua('nj:' + n.id)) return;
          if ((Date.now() - (n.koha || 0)) >= 2 * 86400000 || !o.njofto) return;
          // Kërkesat vijnë edhe si push nga Worker-i: kur push-i punon, njoftimi lokal do të ishte i dyfishtë (si te chat-i)
          var ngaPush = /^kerkese-/.test(n.lloji) && e.pushAktiv && e.pushAktiv();
          o.njofto({ titulli: /^kerkese-/.test(n.lloji) ? 'Stoku · Hiqe nga rafti' : 'Stoku · Ekipa', teksti: tekstiNjoftimit(n), tag: 'ek-nj-' + n.id, pamja: 'njoftimet', vetemNePerpara: ngaPush });
        });
        thirr('njoftimet');
      }, function () { /* p.sh. rregullat ende pa u vendosur — thjesht s'ka njoftime */ });
      if (e.aktivizoPush) e.aktivizoPush().then(function () { thirr('push'); }, function () { /* ok */ });
      chatNisurSe = Date.now();
      d.chatFundit = e.degjoChatin(function (lista) {
        var m = lista[0] || null;
        gj.mesazhiFundit = m;
        if (m && m.uid !== o.uidIm() && m.koha > chatNisurSe - 5000 && !uNjoftua('ch:' + m.id)) {
          var neChat = gj.chatHapur && !document.hidden;
          // Me push aktiv, njoftimin e sistemit e jep service worker-i (edhe kur aplikacioni është i mbyllur) — pa dyfishim
          if (!neChat && o.njofto && !(e.pushAktiv && e.pushAktiv())) o.njofto({ titulli: (m.emri || 'Ekipa') + ' · Chat', teksti: m.tekst, tag: 'ek-chat', pamja: 'chat' });
        }
        if (gj.chatHapur && !document.hidden) shenoChatinTeLexuar();
        thirr('chat-fundit');
      }, 1, function () { /* ok */ });
    }
    function ndalGjithmone(vetemDegjuesit) {
      ndal('njoftimet'); ndal('chatFundit'); ndal('anetaresia'); ndal('fshirja'); ndal('grupiDoc'); ndal('ftesatEMia');
      if (!vetemDegjuesit) {
        var e = E(); if (e) e.ndalPranine();
        mbyll();
        clearTimeout(publikimi.kohez);
        gj.njoftimetPalexuara = []; gj.mesazhiFundit = null; gj.dyqanet = {}; gj.ngarkuarSe = 0; gj.anetaret = [];
        gj.ngjarjet = []; gj.ngjarjetGati = false; gj.chat = []; gj.chatGati = false;
        gj.anetaresia = null; gj.admin = false; gj.permbledhjet = null; gj.permbledhjetGabim = false;
        gj.grupi = null; gj.grupiInfo = null; gj.roli = 'anetar'; gj.ftesatEMia = []; gj.ftesatEGrupit = []; gj.krejtLlogarite = null;
        if (e && e.vendosGrupin) e.vendosGrupin(null);
        publikimi = { kohez: null, nenshkrimi: null, bllokuarDeri: 0, afatet: null };
        thirr('te-gjitha');
      }
    }

    // ---------- Kur hapet tabi Ekipa ----------
    function hap() {
      var e = E();
      gj.hapur = true;
      if (!e || !o.uidIm()) { thirr('te-gjitha'); return; }
      if (gjendjaEQasjes() !== 'ok') { mbyllDegjuesitEFaqes(); thirr('te-gjitha'); return; } // pa grup / duke kontrolluar
      if (!d.anetaret) {
        d.anetaret = e.degjoAnetaret(function (lista) {
          gj.anetaret = lista;
          ngarkoMungesat();
          thirr('anetaret');
        }, function () { gj.gabimNgarkimi = 'rregullat'; thirr('anetaret'); });
      }
      if (!d.ftesatEGrupit && e.degjoFtesatEGrupit) {
        d.ftesatEGrupit = e.degjoFtesatEGrupit(function (l) {
          gj.ftesatEGrupit = l.sort(function (a, b) { return (b.koha || 0) - (a.koha || 0); });
          thirr('anetaret');
        }, function () { ndal('ftesatEGrupit'); });
      }
      if (gj.admin && !d.krejtLlogarite && e.degjoKrejtLlogarite) {
        d.krejtLlogarite = e.degjoKrejtLlogarite(function (l) { gj.krejtLlogarite = l; thirr('anetaret'); }, function () { ndal('krejtLlogarite'); });
      }
      if (!d.permbledhjet && e.degjoAfatetEEkipes && !gj.permbledhjetGabim) {
        d.permbledhjet = e.degjoAfatetEEkipes(function (m) {
          gj.permbledhjet = m;
          ngarkoMungesat();
          thirr('dyqanet');
        }, function () {
          // Rregullat e vjetra: afatet e kolegëve lexohen nga dyqanet e tyre, si më parë
          gj.permbledhjetGabim = true; gj.permbledhjet = null; ndal('permbledhjet');
          ngarkoMungesat();
          thirr('dyqanet');
        });
      }
      if (!e.degjoAfatetEEkipes) gj.permbledhjetGabim = true;
      ngarkoMungesat();
      if (!d.ngjarjet) {
        d.ngjarjet = e.degjoNgjarjet(function (lista) {
          var teRejaNgaTjeret = gj.ngjarjetGati ? lista.filter(function (ng) {
            return ng.uid !== o.uidIm() && !gj.ngjarjet.some(function (x) { return x.id === ng.id; });
          }) : [];
          gj.ngjarjet = lista;
          gj.ngjarjetGati = true;
          // Një koleg pa përmbledhje (version i vjetër) shtoi afate ose hoqi të vetat → rilexo dyqanin e tij
          teRejaNgaTjeret.forEach(function (ng) {
            if (ng.lloji === 'afate-te-reja' || ng.lloji === 'rikthyer' || (ng.lloji === 'hequr' && ng.pronariUid === ng.uid)) rifreskoDyqanin(ng.uid);
          });
          thirr('ngjarjet');
        }, 150, function () { gj.ngjarjetGati = true; thirr('ngjarjet'); });
      }
      thirr('te-gjitha');
    }
    function mbyllDegjuesitEFaqes() { ndal('anetaret'); ndal('ngjarjet'); ndal('permbledhjet'); ndal('ftesatEGrupit'); ndal('krejtLlogarite'); }
    function mbyll() {
      gj.hapur = false;
      mbyllDegjuesitEFaqes();
      mbyllChatin();
    }

    // ---------- Afatet e kolegëve ----------
    // Kryesisht nga përmbledhjet (ekipa_afatet, në kohë reale). Vetëm për kolegët pa përmbledhje ende (version i
    // vjetër i aplikacionit) ose me rregullat e vjetra, lexohet dyqani i tyre (nëse rregullat e lejojnë).
    function anetaretEDukshem() { return gjendjaEQasjes() === 'ok' ? gj.anetaret : []; }
    function kaPermbledhje(uid) { return !!(gj.permbledhjet && gj.permbledhjet[uid]); }
    async function ngarkoMungesat() {
      var c = o.cloud && o.cloud();
      if (!gj.hapur || !c || !c.merrDyqaninEPerdoruesit || gj.dukeNgarkuar) return;
      if (!gj.permbledhjetGabim && !gj.permbledhjet) return; // pritet përgjigjja e parë e përmbledhjeve
      var uidIm = o.uidIm(), tani = Date.now();
      var tjeret = anetaretEDukshem().filter(function (a) {
        if (a.uid === uidIm || kaPermbledhje(a.uid)) return false;
        var x = gj.dyqanet[a.uid];
        return !x || tani - x.merrurSe > 3 * 60 * 1000;
      });
      if (!tjeret.length) { if (!gj.ngarkuarSe && gj.anetaret.length) { gj.ngarkuarSe = tani; thirr('dyqanet'); } return; }
      gj.dukeNgarkuar = true; gj.gabimNgarkimi = '';
      thirr('dyqanet');
      var rez = await Promise.all(tjeret.map(function (a) { return c.merrDyqaninEPerdoruesit(a.uid); }));
      rez.forEach(function (r, i) {
        gj.dyqanet[tjeret[i].uid] = (r && r.ok)
          ? { afatet: (r.gjendja && r.gjendja.afatet) || [], merrurSe: Date.now() }
          : { afatet: [], merrurSe: Date.now(), gabim: true };
      });
      gj.ngarkuarSe = Date.now();
      gj.dukeNgarkuar = false;
      thirr('dyqanet');
    }
    function rifreskoDyqanin(uid) {
      if (kaPermbledhje(uid)) return; // përmbledhja vjen vetë, në kohë reale
      clearTimeout(rifreskimKohez[uid]);
      rifreskimKohez[uid] = setTimeout(async function () {
        var c = o.cloud && o.cloud();
        if (!c || !c.merrDyqaninEPerdoruesit || kaPermbledhje(uid)) return;
        var r = await c.merrDyqaninEPerdoruesit(uid);
        if (r && r.ok) { gj.dyqanet[uid] = { afatet: (r.gjendja && r.gjendja.afatet) || [], merrurSe: Date.now() }; thirr('dyqanet'); }
      }, 2500);
    }

    // Anëtarët me afatet e tyre (heqjet e kolegëve të mbivendosura); i imi nga të dhënat lokale
    function anetaretMeAfate() {
      var uidIm = o.uidIm();
      var harta = hartaEHeqjeve(gj.ngjarjet);
      var lista = anetaretEDukshem().slice();
      if (uidIm && !lista.some(function (a) { return a.uid === uidIm; })) lista.push({ uid: uidIm, emri: o.emriIm(), aktivSe: Date.now(), online: true, admin: gj.admin });
      return lista.map(function (a) {
        var une = a.uid === uidIm;
        var p = !une && gj.permbledhjet && gj.permbledhjet[a.uid];
        var dq = !une && !p && gj.dyqanet[a.uid];
        var burimi = une ? (o.afatetEMia() || []) : p ? p.afatet : (dq && !dq.gabim ? dq.afatet : []);
        return Object.assign({}, a, {
          uneJam: une,
          ngarkuar: une || !!p || !!dq,
          paTeDhena: !une && !p && !!(dq && dq.gabim), // s'ka përmbledhje dhe dyqani s'lexohet: s'e ka hapur ende versionin e ri
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

    // ---------- Përmbledhja e afateve të mia për kolegët (ekipa_afatet/{uid}) ----------
    // Faqja e thërret pas çdo sinkronizimi të suksesshëm; dërgohet vetëm kur ndryshon diçka që e shohin kolegët.
    function publikoAfatet(afatet) {
      if (!Array.isArray(afatet)) return;
      publikimi.afatet = afatet;
      clearTimeout(publikimi.kohez);
      publikimi.kohez = setTimeout(publikoTani, 1500);
    }
    async function publikoTani() {
      clearTimeout(publikimi.kohez); publikimi.kohez = null;
      var e = E();
      if (!e || !e.publikoAfatet || !o.uidIm() || !publikimi.afatet || Date.now() < publikimi.bllokuarDeri) return;
      var p = permbledhjaEAfateve(publikimi.afatet);
      var n = o.uidIm() + '|' + (o.emriIm() || '') + '|' + nenshkrimi(p);
      if (n === publikimi.nenshkrimi || n === lexo(KEY_PUBLIKUAR)) { publikimi.nenshkrimi = n; return; }
      var r = await e.publikoAfatet(p);
      if (r && r.ok) { publikimi.nenshkrimi = n; shkruaj(KEY_PUBLIKUAR, n); }
      else if (r && r.leje) publikimi.bllokuarDeri = Date.now() + 10 * 60 * 1000; // rregullat e vjetra: mos provo pas çdo ndryshimi
    }

    // ---------- Heqja nga rafti ----------
    // afat: nga anetaretMeAfate() (ka pronariUid/pronariEmri). Për të miat, faqja thërret shenoHequr e vet.
    // Njoftimi + aktiviteti hyjnë në radhë menjëherë: pa internet dërgohen sapo të ketë lidhje (r.neRadhe).
    async function heqAfatinEKolegut(afat) {
      var e = E();
      if (!e) return { ok: false, arsye: 'pa-lidhje' };
      var ng = { lloji: 'hequr', pronariUid: afat.pronariUid, pronariEmri: afat.pronariEmri || '', afatId: afat.id,
        produkti: afat.emri || afat.barkodi || '', barkodi: afat.barkodi || '', data: afat.data || '', sasia: typeof afat.sasia === 'number' ? afat.sasia : undefined };
      var pNjoftimi = e.dergoNjoftim(afat.pronariUid, { lloji: 'hequr', afatId: afat.id, produkti: ng.produkti, barkodi: ng.barkodi, data: ng.data });
      e.shtoNgjarje(ng);
      // Shfaqet menjëherë si i hequr (pa pritur dëgjuesin e aktivitetit)
      var idLokale = 'lokal-' + Date.now();
      gj.ngjarjet = [Object.assign({ id: idLokale, uid: o.uidIm(), emri: o.emriIm(), koha: Date.now() }, ng)].concat(gj.ngjarjet);
      thirr('ngjarjet');
      var r = await pNjoftimi;
      if (!r || !r.ok) {
        gj.ngjarjet = gj.ngjarjet.filter(function (x) { return x.id !== idLokale; });
        thirr('ngjarjet');
      }
      return r || { ok: false };
    }

    // Pronari pranon ose refuzon heqjen e një kolegu. Kur e pranon, faqja e heq afatin te afatet e veta (o.zbatoHeqjet).
    async function vendosPerHeqjen(nj, pranoj) {
      var e = E();
      if (!e || !nj) return { ok: false, arsye: 'pa-lidhje' };
      var r = await e.vendosPerHeqjen(nj, pranoj);
      if (!r || !r.ok) return r || { ok: false };
      if (pranoj && o.zbatoHeqjet) { try { o.zbatoHeqjet([nj]); } catch (er) { /* ok */ } }
      nj.vendim = pranoj ? 'pranuar' : 'refuzuar';
      gj.njoftimetPalexuara = gj.njoftimetPalexuara.filter(function (x) { return x.id !== nj.id; });
      gj.ngjarjet = [{ id: 'lokal-v-' + Date.now(), lloji: pranoj ? 'heqje-pranuar' : 'heqje-refuzuar', uid: o.uidIm(), emri: o.emriIm(), koha: Date.now(),
        pronariUid: o.uidIm(), afatId: nj.afatId, produkti: nj.produkti || '', kerkuesUid: nj.uid || '', kerkuesEmri: nj.emri || '' }].concat(gj.ngjarjet);
      thirr('ngjarjet'); thirr('njoftimet');
      return r;
    }

    // ---------- Aktiviteti nga faqja (heqje e vetes, lajmërim, afate të reja) ----------
    function ngjarje(ng) {
      var e = E();
      if (!e || !o.uidIm() || gjendjaEQasjes() !== 'ok') return;
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
      document.addEventListener('visibilitychange', function () { if (document.hidden) { dergoAfateTeReja(); if (publikimi.kohez) publikoTani(); } });
    }

    // ---------- Chat ----------
    function hapChatin() {
      var e = E();
      gj.chatHapur = true;
      if (!e || gjendjaEQasjes() !== 'ok') { thirr('chat'); return; }
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
      return (r && r.lista) || [];
    }
    // Kush e kreu një kërkesë për heqje: unë (njoftimi im ka kryer) ose një koleg (ngjarja "kerkese-kryer" te aktiviteti)
    function kryeresiIKerkeses(nj) {
      if (!nj) return null;
      if (nj.kryer) return { uneJam: true, emri: '' };
      var ng = nj.kerkeseId && gj.ngjarjet.filter(function (x) { return x.lloji === 'kerkese-kryer' && x.kerkeseId === nj.kerkeseId; })[0];
      return ng ? { uneJam: ng.uid === o.uidIm(), emri: ng.emri || 'Një koleg' } : null;
    }
    // Kërkesat për heqje që s'janë kryer ende mbeten "të palexuara" (shenja te zilja) derisa të shtypet "E hoqa"
    function ePritur(n) { return (n.lloji === 'kerkese-heqje' && !kryeresiIKerkeses(n)) || (n.lloji === 'hequr' && !n.vendim); }
    async function shenoNjoftimetTeLexuara() {
      var e = E();
      var ids = gj.njoftimetPalexuara.filter(function (n) { return !ePritur(n); }).map(function (n) { return n.id; });
      if (!e || !ids.length) return;
      gj.njoftimetPalexuara = gj.njoftimetPalexuara.filter(ePritur);
      thirr('njoftimet');
      await e.shenoTeLexuara(ids);
    }

    return {
      gj: gj,
      nisGjithmone: nisGjithmone, ndalGjithmone: ndalGjithmone,
      hap: hap, mbyll: mbyll, ngarkoDyqanet: ngarkoMungesat,
      anetaretMeAfate: anetaretMeAfate,
      heqAfatinEKolegut: heqAfatinEKolegut, vendosPerHeqjen: vendosPerHeqjen,
      ngjarje: ngjarje, afateTeReja: afateTeRejaU,
      publikoAfatet: publikoAfatet,
      hapChatin: hapChatin, mbyllChatin: mbyllChatin, kaChatTePalexuar: kaChatTePalexuar, shenoChatinTeLexuar: shenoChatinTeLexuar,
      dergoMesazh: dergoMesazh, fshijMesazhin: fshijMesazhin,
      merrNjoftimet: merrNjoftimet, shenoNjoftimetTeLexuara: shenoNjoftimetTeLexuara,
      numriNjoftimeve: function () { return gj.njoftimetPalexuara.filter(function (n) { return !(n.lloji === 'kerkese-heqje' && kryeresiIKerkeses(n)); }).length; },
      kaLidhje: function () { return !!E() && !!o.uidIm(); },
      // A janë marrë anëtarët dhe afatet e tyre (për "Krejt ekipa")
      eGatshme: function () { return gj.anetaret.length > 0 && (!!gj.permbledhjet || gj.ngarkuarSe > 0) && !gj.dukeNgarkuar; },
      // Grupi
      gjendjaEQasjes: gjendjaEQasjes,
      eshteAdmin: function () { return !!gj.admin; },
      eshtePronar: eshtePronar,
      grupiInfo: function () { return gjendjaEQasjes() === 'ok' ? (gj.grupiInfo || { id: gj.grupi, emri: '' }) : null; },
      ftesatEMia: function () { return gj.ftesatEMia; },
      ftesatEGrupit: function () { return gj.ftesatEGrupit; },
      // Shenja te Ekipa: ftesat e reja që më kanë ardhur
      numriKerkesave: function () { return gj.ftesatEMia.length; },
      krijoGrupin: krijoGrupin, pranoFtesen: pranoFtesen, refuzoFtesen: refuzoFtesen, largohuNgaGrupi: largohuNgaGrupi,
      mundTeLargohet: mundTeLargohet, ftoNeGrup: ftoNeGrup, anuloFtesen: anuloFtesen, ndryshoRolin: ndryshoRolin, riemertoGrupin: riemertoGrupin,
      llogariteJashte: llogariteJashte,
      hiqNgaEkipa: hiqNgaEkipa, fshijLlogarine: fshijLlogarine,
      vendosLejen: vendosLejen, lajmeroEkipen: lajmeroEkipen,
      koleget: koleget, kerkoHeqjen: kerkoHeqjen, kryejKerkesen: kryejKerkesen, kryeresiIKerkeses: kryeresiIKerkeses,
      pastroChatin: function () { return pastro('chat'); }, pastroAktivitetin: function () { return pastro('feed'); },
      merrStokun: merrStokun, adminNdryshoAfatin: adminNdryshoAfatin
    };
  }

  var api = {
    ONLINE_MS: ONLINE_MS, MUAJT: MUAJT, DITET_SHKURT: DITET_SHKURT,
    krijoCloud: krijoCloud, krijoKontrollues: krijoKontrollues,
    eshteOnline: eshteOnline, kohaRelative: kohaRelative, titulliDites: titulliDites,
    tekstiPranise: tekstiPranise, tekstiPlatformes: tekstiPlatformes, praniaIkone: praniaIkone,
    ADMIN_EMRI: ADMIN_EMRI, permbledhjaEAfateve: permbledhjaEAfateve, nenshkrimi: nenshkrimi,
    ndryshoAfatinNeGjendje: ndryshoAfatinNeGjendje, fletetEStokut: fletetEStokut,
    hartaEHeqjeve: hartaEHeqjeve, mbivendosHeqjen: mbivendosHeqjen, duhetZbatuarHeqja: duhetZbatuarHeqja,
    kalendari: kalendari, statistikat: statistikat, tekstiNgjarjes: tekstiNgjarjes, tekstiNjoftimit: tekstiNjoftimit,
    isoDites: isoDites, Fotot: Fotot, listaEKerkeses: listaEKerkeses, rreshtiIProduktit: rreshtiIProduktit, zgjedhesIKerkeses: zgjedhesIKerkeses
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.StokuEkipa = api;
})(typeof self !== 'undefined' ? self : this);
