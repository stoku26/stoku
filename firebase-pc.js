// v238: u nxor nga pc.html (CSP pa 'unsafe-inline': faqet s'kanë më skripta të brendshme). Kur ndryshon, rrite ?v= te pc.html dhe sw.js.
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
  import {
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged,
    updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential, deleteUser
  } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
  import { initializeFirestore, doc, getDoc, getDocs, setDoc, runTransaction, onSnapshot, collection, deleteDoc, addDoc, query, where, orderBy, limit, writeBatch, Bytes } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

  var firebaseConfig = {
    apiKey: "AIzaSyCttsCATjbQQ8LaspIb1BnFrsnzusKy6IY",
    authDomain: "stoku-appi.firebaseapp.com",
    projectId: "stoku-appi",
    storageBucket: "stoku-appi.firebasestorage.app",
    messagingSenderId: "107114545225",
    appId: "1:107114545225:web:f3944cd32f4e772577bf98"
  };
  function emailIBrendshem(u) { return u.trim().toLowerCase() + '@stoku-app.local'; }
  function gabim(e) { return { ok: false, kodi: e && e.code, arsye: String((e && e.message) || e) }; }

  try {
    var app = initializeApp(firebaseConfig);
    var auth = getAuth(app);
    // ignoreUndefinedProperties: një fushë e zbrazët (undefined) s'e prish më krejt sinkronizimin
    var db = initializeFirestore(app, { ignoreUndefinedProperties: true });
    // Dyqani ruhet i ndarë në disa dokumente (ruajtja.js) — pa kufirin 1 MB të një dokumenti
    var ruajtja = window.StokuRuajtja.krijo({ doc: doc, getDoc: getDoc, setDoc: setDoc, runTransaction: runTransaction, onSnapshot: onSnapshot, collection: collection },
      db, function () { return auth.currentUser ? auth.currentUser.uid : null; });
    // Grupi (ekipa.js): prania, aktiviteti, njoftimet personale
    var ekipa = window.StokuEkipa ? window.StokuEkipa.krijoCloud({ doc: doc, getDoc: getDoc, getDocs: getDocs, setDoc: setDoc, addDoc: addDoc, deleteDoc: deleteDoc,
      collection: collection, onSnapshot: onSnapshot, query: query, where: where, orderBy: orderBy, limit: limit, writeBatch: writeBatch }, db, auth, 'pc') : null;
    // v227: skedarët (Excel, PDF) nga telefoni/PDA-ja te PC-ja e së njëjtës llogari (skedaret.js)
    var skedaret = window.StokuSkedaret ? window.StokuSkedaret.krijo({ doc: doc, collection: collection, setDoc: setDoc, getDocs: getDocs, deleteDoc: deleteDoc,
      onSnapshot: onSnapshot, query: query, orderBy: orderBy, limit: limit, writeBatch: writeBatch, Bytes: Bytes }, db, function () { return auth.currentUser ? auth.currentUser.uid : null; }) : null;
    // v230: lejet e llogarive (lejet.js): çka mund të përdorë secila llogari; i ndryshon vetëm administratori
    var lejet = window.StokuLejet ? window.StokuLejet.krijo({ doc: doc, collection: collection, setDoc: setDoc, onSnapshot: onSnapshot },
      db, function () { return auth.currentUser ? auth.currentUser.uid : null; }) : null;
    // Regjistrohet vetja te perdoruesit/{uid} — përdoret nga pamja e "Ekipit" për të gjetur llogaritë
    // "X u bashkua me grupin" s'shkruhet më këtu: e shkruan administratori kur e pranon llogarinë në grup.
    var regjistrimet = {}; // uid → { emri, p }: hyr()/regjistrohu() dhe onAuthStateChanged e thërrasin njëkohësisht
    function regjistroPerdoruesin(emriPerdoruesit, uid) {
      var emri = String(emriPerdoruesit).trim().toLowerCase();
      var ne = regjistrimet[uid];
      if (ne && ne.emri === emri) return ne.p;
      var p = (ne ? ne.p : Promise.resolve()).then(function () { return regjistroTani(emri, uid); });
      regjistrimet[uid] = { emri: emri, p: p };
      p.then(function () { if (regjistrimet[uid] && regjistrimet[uid].p === p) delete regjistrimet[uid]; });
      return p;
    }
    async function regjistroTani(emri, uid) {
      try {
        var ref = doc(db, 'perdoruesit', uid);
        // v240: pa sasiaShpejte (leja +/- është te lejet/{uid}, "stokuPlusMinus")
        await setDoc(ref, { perdoruesi: emri, kycurSe: Date.now() }, { merge: true });
      } catch (e) { /* ok */ }
      lexoMerchandiserin(uid);
    }
    // v241: "Punoj si merchandiser" (zgjedhur kur u hap llogaria) → localStorage, që aplikacioni ta dijë edhe pa internet.
    // Administratori e ndryshon te lejet/{uid} ("marketet"), që fiton mbi këtë.
    var KEY_MERCH = 'stoku:merchandiser';
    function ruajMerchandiserin(uid, v) {
      var para = null;
      try { para = JSON.parse(localStorage.getItem(KEY_MERCH) || 'null'); } catch (e) { /* ok */ }
      if (para && para.uid === uid && para.v === v) return;
      try { localStorage.setItem(KEY_MERCH, JSON.stringify({ uid: uid, v: v })); } catch (e) { /* ok */ }
      if (!!(para && para.uid === uid && para.v === true) !== v) window.dispatchEvent(new Event('stoku-merchandiser')); // vetëm kur ndryshon
    }
    // v251: vlera dëgjohet nga serveri (jo një lexim i vetëm): leximi nga memoria e pajisjes (internet i dobët, sapo u hap
    // aplikacioni) s'e ka ende "merchandiser" dhe e fshihte çipin e marketit (aplikacioni Android, pajisje e re). Vetëm
    // dokumenti nga serveri vendos; "po" e kësaj pajisjeje s'kthehet kurrë në "jo" (administratori e fik te lejet/{uid}).
    var __merch = { uid: null, ndal: null };
    function lexoMerchandiserin(uid) {
      if (__merch.uid === uid && __merch.ndal) return;
      if (__merch.ndal) { try { __merch.ndal(); } catch (e) { /* ok */ } __merch.ndal = null; }
      __merch.uid = uid || null;
      if (!uid) return;
      __merch.ndal = onSnapshot(doc(db, 'perdoruesit', uid), { includeMetadataChanges: true }, function (d) {
        if (d.metadata.fromCache || !auth.currentUser || auth.currentUser.uid !== uid) return;
        var neDok = !!(d.exists() && d.data().merchandiser === true), lok = null;
        try { lok = JSON.parse(localStorage.getItem(KEY_MERCH) || 'null'); } catch (e) { /* ok */ }
        if (!neDok && lok && lok.uid === uid && lok.v === true) {
          // "Punoj si merchandiser" u zgjodh këtu kur u hap llogaria, por s'arriti te Firebase: shkruhet tani, që ta dinë
          // edhe pajisjet e tjera (aplikacioni Android, kompjuteri)
          if (d.exists()) setDoc(doc(db, 'perdoruesit', uid), { merchandiser: true }, { merge: true }).catch(function () { /* ok */ });
          return;
        }
        ruajMerchandiserin(uid, neDok);
      }, function () { /* pa leje a pa internet: mbetet vlera e ruajtur */ });
    }

    window.__stokuCloud = {
      async regjistrohu(u, p, opsionet) {
        try {
          var k = await createUserWithEmailAndPassword(auth, emailIBrendshem(u), p);
          var merch = !!(opsionet && opsionet.merchandiser);
          ruajMerchandiserin(k.user.uid, merch);
          // v230: kur u krijua llogaria (administratori e sheh si "llogari e re" te Cilësimet → Përdoruesit); v241: + merchandiser
          var fillimi = { krijuarSe: Date.now() };
          if (merch) fillimi.merchandiser = true;
          setDoc(doc(db, 'perdoruesit', k.user.uid), fillimi, { merge: true }).catch(function () { /* ok */ });
          regjistroPerdoruesin(u, k.user.uid);
          return { ok: true, uid: k.user.uid };
        } catch (e) { return gabim(e); }
      },
      async hyr(u, p) { try { var k = await signInWithEmailAndPassword(auth, emailIBrendshem(u), p); regjistroPerdoruesin(u, k.user.uid); return { ok: true, uid: k.user.uid }; } catch (e) { return gabim(e); } },
      async dil() {
        if (ekipa) ekipa.ndalPranine();
        if (ekipa && ekipa.caktivizoPush) { try { await ekipa.caktivizoPush(); } catch (e) { /* ok */ } } // kjo pajisje s'merr më njoftimet e kësaj llogarie
        if (window.StokuPorta && window.StokuPorta.dilMeDore) window.StokuPorta.dilMeDore(); // mos hyr vetë me fjalëkalimin e ruajtur
        try { await signOut(auth); } catch (e) { /* ok */ }
      },
      // Llogaria u fshi nga administratori: fshihet edhe llogaria e Firebase-it (emri lirohet). Nëse Firebase kërkon
      // hyrje të freskët, vetëm dilet — herën tjetër që hyn, fshirja provohet sërish.
      async fshiVeten() {
        if (!auth.currentUser) return;
        if (window.StokuPorta && window.StokuPorta.dilMeDore) window.StokuPorta.dilMeDore();
        try { await deleteUser(auth.currentUser); } catch (e) { try { await signOut(auth); } catch (e2) { /* ok */ } }
      },
      async ndryshoEmrin(u) { if (!auth.currentUser) return { ok: false }; try { await updateEmail(auth.currentUser, emailIBrendshem(u)); regjistroPerdoruesin(u, auth.currentUser.uid); return { ok: true }; } catch (e) { return gabim(e); } },
      async ndryshoFjalekalimin(p) {
        if (!auth.currentUser) return { ok: false };
        try {
          await updatePassword(auth.currentUser, p);
          // Fjalëkalimi i ri edhe te menaxheri i fjalëkalimeve (që hyrja vetë të mos dështojë me të vjetrin)
          if (window.StokuPorta && window.StokuPorta.ruajKredencialet) window.StokuPorta.ruajKredencialet(String(auth.currentUser.email || '').replace(/@stoku-app\.local$/, ''), p);
          return { ok: true };
        } catch (e) { return gabim(e); }
      },
      async riautentifikohu(p) {
        if (!auth.currentUser || !auth.currentUser.email) return { ok: false };
        try { await reauthenticateWithCredential(auth.currentUser, EmailAuthProvider.credential(auth.currentUser.email, p)); return { ok: true }; } catch (e) { return gabim(e); }
      },
      perdoruesiAktual() { return auth.currentUser; },
      async token() { return auth.currentUser ? await auth.currentUser.getIdToken() : null; },
      merr() { return ruajtja.merr(); },
      ruaj(g) { return ruajtja.ruaj(g); },
      bashkoDheRuaj(fn) { return ruajtja.bashkoDheRuaj(fn); },
      // Dëgjim i drejtpërdrejtë: sa herë që telefoni/PDA ruan diçka, kompjuteri e merr brenda sekondës.
      degjo(cb, cbGabim) { return ruajtja.degjo(cb, cbGabim); },
      modaPjeseve() { return ruajtja.modaPjeseve(); },
      // Fletët e fotografuara në telefon dhe të dërguara këtu për kontroll (më e vjetra e para)
      degjoFletet(cb, cbGabim) {
        if (!auth.currentUser) return function () {};
        return onSnapshot(collection(db, 'dyqane', auth.currentUser.uid, 'fletet'), function (s) {
          var l = [];
          s.forEach(function (d) { l.push(Object.assign({}, d.data(), { id: d.id })); });
          l.sort(function (a, b) { return (a.krijuarSe || 0) - (b.krijuarSe || 0); });
          cb(l);
        }, function (e) { if (cbGabim) cbGabim(e); });
      },
      async fshijFleten(id) {
        if (!auth.currentUser) return { ok: false };
        try { await deleteDoc(doc(db, 'dyqane', auth.currentUser.uid, 'fletet', id)); return { ok: true }; } catch (e) { return gabim(e); }
      },
      // Ekipi: krejt llogaritë e regjistruara (emri i dukshëm + uid), për pamjen e përbashkët
      async krejtPerdoruesit() {
        try {
          var pikteka = await getDocs(collection(db, 'perdoruesit'));
          var lista = [];
          pikteka.forEach(function (d) { var x = d.data() || {}; lista.push({ uid: d.id, emri: x.perdoruesi || x.emri || d.id }); });
          return { ok: true, lista: lista };
        } catch (e) { var g = gabim(e); g.lista = []; return g; }
      },
      // Lexim (vetëm-lexim) i dyqanit të një llogarie tjetër — për të bashkuar stokun/afatet e ekipit
      async merrDyqaninEPerdoruesit(uid) {
        try {
          var rTjeter = window.StokuRuajtja.krijo({ doc: doc, getDoc: getDoc, setDoc: setDoc, runTransaction: runTransaction, onSnapshot: onSnapshot, collection: collection },
            db, function () { return uid; });
          return await rTjeter.merr();
        } catch (e) { return gabim(e); }
      },
      // Administratori: ndryshim (lexim + bashkim + shkrim atomik) në dyqanin e një llogarie tjetër
      async ndryshoDyqaninEPerdoruesit(uid, fn) {
        try {
          var rTjeter = window.StokuRuajtja.krijo({ doc: doc, getDoc: getDoc, setDoc: setDoc, runTransaction: runTransaction, onSnapshot: onSnapshot, collection: collection },
            db, function () { return uid; });
          return await rTjeter.bashkoDheRuaj(fn);
        } catch (e) {
          return { ok: false, kodi: e && e.code, arsye: String((e && e.message) || e) };
        }
      },
      skedaret: skedaret,
      lejet: lejet,
      ekipa: ekipa
    };
    onAuthStateChanged(auth, function (perdoruesi) {
      window.__stokuCloud.authGati = true; // porta e hyrjes pret këtë: tani dihet a është hyrë
      if (perdoruesi && perdoruesi.email) regjistroPerdoruesin(perdoruesi.email.replace(/@stoku-app\.local$/, ''), perdoruesi.uid);
      lexoMerchandiserin(perdoruesi ? perdoruesi.uid : null); // v251: menjëherë, pa pritur shkrimin e perdoruesit/{uid}
      window.dispatchEvent(new Event('stoku-auth-ndryshoi'));
    });
  } catch (e) {
    window.__stokuCloud = null;
  }
  window.dispatchEvent(new Event('stoku-cloud-gati'));
