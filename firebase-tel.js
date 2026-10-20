// v238: u nxor nga index.html (CSP pa 'unsafe-inline': faqet s'kanë më skripta të brendshme). Kur ndryshon, rrite ?v= te index.html dhe sw.js.
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
  import {
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged,
    updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential, deleteUser
  } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
  import { initializeFirestore, doc, getDoc, getDocs, setDoc, runTransaction, collection, addDoc, onSnapshot, deleteDoc, query, where, orderBy, limit, writeBatch, Bytes } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

  var firebaseConfig = {
    apiKey: "AIzaSyCttsCATjbQQ8LaspIb1BnFrsnzusKy6IY",
    authDomain: "stoku-appi.firebaseapp.com",
    projectId: "stoku-appi",
    storageBucket: "stoku-appi.firebasestorage.app",
    messagingSenderId: "107114545225",
    appId: "1:107114545225:web:f3944cd32f4e772577bf98"
  };

  function emailIBrendshem(emriPerdoruesit) {
    return emriPerdoruesit.trim().toLowerCase() + '@stoku-app.local';
  }

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
      collection: collection, onSnapshot: onSnapshot, query: query, where: where, orderBy: orderBy, limit: limit, writeBatch: writeBatch }, db, auth, 'tel') : null;
    // v229: skedarët (Excel, PDF) nga telefoni/PDA-ja te PC-ja e së njëjtës llogari (skedaret.js)
    var skedaret = window.StokuSkedaret ? window.StokuSkedaret.krijo({ doc: doc, collection: collection, setDoc: setDoc, getDocs: getDocs, deleteDoc: deleteDoc,
      onSnapshot: onSnapshot, query: query, orderBy: orderBy, limit: limit, writeBatch: writeBatch, Bytes: Bytes }, db, function () { return auth.currentUser ? auth.currentUser.uid : null; }) : null;
    // v230: lejet e llogarive (lejet.js): çka mund të përdorë secila llogari; i ndryshon vetëm administratori
    var lejet = window.StokuLejet ? window.StokuLejet.krijo({ doc: doc, collection: collection, setDoc: setDoc, onSnapshot: onSnapshot },
      db, function () { return auth.currentUser ? auth.currentUser.uid : null; }) : null;

    // Regjistrohet vetja te perdoruesit/{uid} (emri i dukshëm + kur u kyç së fundi) — përdoret nga
    // pamja e "Ekipit" për të gjetur krejt llogaritë ekzistuese dhe emrat e tyre.
    // Fusha `emri` NUK preket: rregullat e Firestore e përdorin për admin-in. Hyrja s'e pret kurrë këtë shkrim.
    // "X u bashkua me grupin" s'shkruhet më këtu: e shkruan administratori kur e pranon llogarinë në grup.
    var __regjistrimet = {}; // uid → { emri, p }: hyr()/regjistrohu() dhe onAuthStateChanged e thërrasin njëkohësisht
    function regjistroPerdoruesin(emriPerdoruesit, uid) {
      var emri = String(emriPerdoruesit).trim().toLowerCase();
      var ne = __regjistrimet[uid];
      if (ne && ne.emri === emri) return ne.p;
      var p = (ne ? ne.p : Promise.resolve()).then(function () { return regjistroTani(emri, uid); });
      __regjistrimet[uid] = { emri: emri, p: p };
      p.then(function () { if (__regjistrimet[uid] && __regjistrimet[uid].p === p) delete __regjistrimet[uid]; });
      return p;
    }
    async function regjistroTani(emri, uid) {
      try {
        var ref = doc(db, 'perdoruesit', uid);
        // v240: pa sasiaShpejte (leja +/- është te lejet/{uid}, "stokuPlusMinus")
        await setDoc(ref, { perdoruesi: emri, kycurSe: Date.now() }, { merge: true });
      } catch (e) { /* p.sh. pa internet — provohet sërish herën tjetër që hyn */ }
    }

    window.__stokuCloud = {
      async regjistrohu(emriPerdoruesit, fjalekalimi) {
        try {
          var kred = await createUserWithEmailAndPassword(auth, emailIBrendshem(emriPerdoruesit), fjalekalimi);
          regjistroPerdoruesin(emriPerdoruesit, kred.user.uid);
          // v230: kur u krijua llogaria (administratori e sheh si "llogari e re" te Cilësimet → Përdoruesit)
          setDoc(doc(db, 'perdoruesit', kred.user.uid), { krijuarSe: Date.now() }, { merge: true }).catch(function () { /* ok */ });
          return { ok: true, uid: kred.user.uid };
        } catch (e) {
          return { ok: false, kodi: e && e.code, arsye: String((e && e.message) || e) };
        }
      },
      async hyr(emriPerdoruesit, fjalekalimi) {
        try {
          var kred = await signInWithEmailAndPassword(auth, emailIBrendshem(emriPerdoruesit), fjalekalimi);
          regjistroPerdoruesin(emriPerdoruesit, kred.user.uid);
          return { ok: true, uid: kred.user.uid };
        } catch (e) {
          return { ok: false, kodi: e && e.code, arsye: String((e && e.message) || e) };
        }
      },
      async dil() {
        if (ekipa) ekipa.ndalPranine(); // "offline" para daljes, sa ende lejohet shkrimi
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
      async ndryshoEmrin(emriRiPerdoruesit) {
        if (!auth.currentUser) return { ok: false, arsye: 'pa-hyrje' };
        try {
          await updateEmail(auth.currentUser, emailIBrendshem(emriRiPerdoruesit));
          regjistroPerdoruesin(emriRiPerdoruesit, auth.currentUser.uid); // lista e Ekipit e merr emrin e ri menjëherë
          return { ok: true };
        } catch (e) {
          return { ok: false, kodi: e && e.code, arsye: String((e && e.message) || e) };
        }
      },
      async ndryshoFjalekalimin(fjalekalimiRi) {
        if (!auth.currentUser) return { ok: false, arsye: 'pa-hyrje' };
        try {
          await updatePassword(auth.currentUser, fjalekalimiRi);
          // Fjalëkalimi i ri edhe te menaxheri i fjalëkalimeve (që hyrja vetë të mos dështojë me të vjetrin)
          if (window.StokuPorta && window.StokuPorta.ruajKredencialet) window.StokuPorta.ruajKredencialet(String(auth.currentUser.email || '').replace(/@stoku-app\.local$/, ''), fjalekalimiRi);
          return { ok: true };
        } catch (e) {
          return { ok: false, kodi: e && e.code, arsye: String((e && e.message) || e) };
        }
      },
      // Firebase e refuzon ndryshimin e emrit/fjalëkalimit nëse sesioni s'është "i fresk" —
      // kërkohet ri-vërtetim me fjalëkalimin AKTUAL para se të lejohet ndryshimi.
      async riautentifikohu(fjalekalimiAktual) {
        if (!auth.currentUser || !auth.currentUser.email) return { ok: false, arsye: 'pa-hyrje' };
        try {
          var kred = EmailAuthProvider.credential(auth.currentUser.email, fjalekalimiAktual);
          await reauthenticateWithCredential(auth.currentUser, kred);
          return { ok: true };
        } catch (e) {
          return { ok: false, kodi: e && e.code, arsye: String((e && e.message) || e) };
        }
      },
      perdoruesiAktual() {
        return auth.currentUser;
      },
      async token() {
        return auth.currentUser ? await auth.currentUser.getIdToken() : null;
      },
      ruaj(gjendja) { return ruajtja.ruaj(gjendja); },
      // Lexon gjendjen e cloud-it, e bashkon me funksionin e dhënë dhe e shkruan — gjithçka atomikisht.
      bashkoDheRuaj(fnBashko) { return ruajtja.bashkoDheRuaj(fnBashko); },
      // Fleta e fotografuar (rreshtat e lexuar + foto e vogël) dërgohet në PC për kontroll
      async dergoFleten(fleta) {
        if (!auth.currentUser) return { ok: false, arsye: 'pa-hyrje' };
        try {
          await addDoc(collection(db, 'dyqane', auth.currentUser.uid, 'fletet'), fleta);
          return { ok: true };
        } catch (e) {
          return { ok: false, kodi: e && e.code, arsye: String((e && e.message) || e) };
        }
      },
      // Dëgjim i drejtpërdrejtë i dyqanit: çdo ndryshim nga një pajisje tjetër vjen brenda sekondës
      degjo(cb, cbGabim) { return ruajtja.degjo(cb, cbGabim); },
      merr() { return ruajtja.merr(); },
      modaPjeseve() { return ruajtja.modaPjeseve(); },
      // Ekipi: krejt llogaritë e regjistruara (emri i dukshëm + uid), për pamjen e përbashkët
      async krejtPerdoruesit() {
        try {
          var pikteka = await getDocs(collection(db, 'perdoruesit'));
          var lista = [];
          pikteka.forEach(function (d) { var x = d.data() || {}; lista.push({ uid: d.id, emri: x.perdoruesi || x.emri || d.id }); });
          return { ok: true, lista: lista };
        } catch (e) {
          return { ok: false, kodi: e && e.code, arsye: String((e && e.message) || e), lista: [] };
        }
      },
      // Lexim (vetëm-lexim) i dyqanit të një llogarie tjetër — për të bashkuar stokun/afatet e ekipit
      async merrDyqaninEPerdoruesit(uid) {
        try {
          var rTjeter = window.StokuRuajtja.krijo({ doc: doc, getDoc: getDoc, setDoc: setDoc, runTransaction: runTransaction, onSnapshot: onSnapshot, collection: collection },
            db, function () { return uid; });
          return await rTjeter.merr();
        } catch (e) {
          return { ok: false, kodi: e && e.code, arsye: String((e && e.message) || e) };
        }
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
      // Regjistrimi te perdoruesit/{uid} për llogaritë ekzistuese (të kyçura para këtij ndryshimi,
      // pa kaluar nga regjistrohu()/hyr() që sapo u shtuan) — bëhet një herë, në heshtje, kur ka sesion.
      if (perdoruesi && perdoruesi.email) {
        var emriNgaEmail = perdoruesi.email.replace(/@stoku-app\.local$/, '');
        regjistroPerdoruesin(emriNgaEmail, perdoruesi.uid);
      }
      window.dispatchEvent(new Event('stoku-auth-ndryshoi'));
    });
  } catch (e) {
    window.__stokuCloud = null; // p.sh. pa internet — app-i vazhdon të punojë vetëm lokalisht
  }

  window.dispatchEvent(new Event('stoku-cloud-gati'));
