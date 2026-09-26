/*
 * Porta e hyrjes — e përbashkët për telefonin (index.html) dhe kompjuterin (pc.html).
 *
 * Aplikacioni s'hapet pa llogari: para faqes kryesore del ekrani "Hyr / Krijo llogari".
 *  - Kur telefoni/kompjuteri e mban mend hyrjen (Firebase), ekrani zhduket vetë pas një çasti.
 *  - Pa internet: hyn vetëm nëse në këtë pajisje është hyrë më parë (të dhënat janë lokale),
 *    që dyqani të mos bllokohet kur bie interneti. Pas "Dil" kjo s'vlen më.
 *  - Të dhënat e një dyqani s'përzihen kurrë me një tjetër: nëse në këtë pajisje hyn një llogari
 *    tjetër, të dhënat lokale të llogarisë së mëparshme hiqen (ato janë në cloud-in e saj) dhe
 *    faqja rinis e pastër për llogarinë e re.
 *
 * Duhet ngarkuar si skripti i parë brenda <body>, që ekrani të dalë para se të vizatohet faqja.
 */
(function () {
  'use strict';

  var KEY_HYRJA = 'stoku:porta:hyrja';      // { uid, emri } e hyrjes së fundit (për hyrje pa internet)
  var KEY_PRONARI = 'stoku:pronari-uid';    // llogaria të cilës i përkasin të dhënat lokale
  var KEY_EMRI_FUNDIT = 'stoku:porta:emri'; // emri i fundit i shkruar (plotësohet vetë)
  var CELESAT_E_TE_DHENAVE = ['stoku:foldera:v1', 'stoku:produktet:v2', 'stoku:produktet:v1', 'stoku:fshira:v1',
    'stoku:rendi-foldera-koha', 'stoku:afatet:v1'];
  var PRITJA_MAKS_MS = 7000;

  function lexo(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function shkruaj(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* ok */ } }
  function hyrjaEFundit() { try { return JSON.parse(lexo(KEY_HYRJA) || 'null'); } catch (e) { return null; } }

  var html = document.documentElement;
  html.classList.add('porta-hapur');

  // ---------- Stili ----------
  var stili = document.createElement('style');
  stili.textContent = [
    'html.porta-hapur, html.porta-hapur body { overflow: hidden !important; }',
    '#porta { position: fixed; inset: 0; z-index: 2147483000; display: flex; align-items: center; justify-content: center;',
    '  padding: max(20px, env(safe-area-inset-top)) 16px max(20px, env(safe-area-inset-bottom));',
    '  background: #0b1220; background: radial-gradient(1200px 600px at 50% -10%, color-mix(in srgb, var(--primar, #1565C0) 55%, #0b1220) 0%, #0b1220 70%);',
    '  font-family: inherit; color: #1c1b1f; overflow-y: auto; transition: opacity .25s ease; }',
    '#porta.po-zhduket { opacity: 0; pointer-events: none; }',
    '#porta .pk { width: 100%; max-width: 400px; background: #fff; border-radius: 22px; padding: 28px 24px 22px;',
    '  box-shadow: 0 24px 60px rgba(0,0,0,.35); margin: auto; }',
    'html[data-tema="dark"] #porta .pk { background: #1f2330; color: #eceef3; }',
    '#porta .pk-logo { display: flex; align-items: center; justify-content: center; margin: -28px -24px 18px; padding: 22px 24px;',
    '  background: var(--primar, #1565C0); border-radius: 22px 22px 0 0; }',
    '#porta .pk-logo img { height: 46px; width: auto; display: block; }',
    '#porta .pk-nen { text-align: center; margin: 0 0 20px; font-size: 14px; color: #6b6f7a; line-height: 1.45; }',
    'html[data-tema="dark"] #porta .pk-nen { color: #a9aebb; }',
    '#porta .pk-tabet { display: flex; background: #eef0f4; border-radius: 12px; padding: 4px; margin-bottom: 18px; }',
    'html[data-tema="dark"] #porta .pk-tabet { background: #2a2f3d; }',
    '#porta .pk-tabet button { flex: 1; height: 38px; border: 0; border-radius: 9px; background: transparent; font: inherit;',
    '  font-size: 14.5px; font-weight: 700; color: #6b6f7a; cursor: pointer; }',
    'html[data-tema="dark"] #porta .pk-tabet button { color: #a9aebb; }',
    '#porta .pk-tabet button.aktiv { background: #fff; color: var(--primar, #1565C0); box-shadow: 0 1px 3px rgba(0,0,0,.12); }',
    'html[data-tema="dark"] #porta .pk-tabet button.aktiv { background: #3a4152; color: #fff; }',
    '#porta label { display: block; margin-bottom: 12px; }',
    '#porta label span { display: block; font-size: 13px; font-weight: 700; margin: 0 2px 6px; }',
    '#porta .pk-fusha { position: relative; }',
    '#porta input { width: 100%; box-sizing: border-box; height: 50px; padding: 0 14px; font: inherit; font-size: 16px;',
    '  border: 1.5px solid #c9ccd4; border-radius: 12px; background: #fff; color: inherit; outline: none; }',
    'html[data-tema="dark"] #porta input { background: #151924; border-color: #3a4152; }',
    '#porta input:focus { border-color: var(--primar, #1565C0); box-shadow: 0 0 0 3px color-mix(in srgb, var(--primar, #1565C0) 22%, transparent); }',
    '#porta .pk-sy { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); width: 40px; height: 40px; border: 0;',
    '  border-radius: 10px; background: transparent; color: #6b6f7a; cursor: pointer; display: flex; align-items: center; justify-content: center; }',
    '#porta .pk-sy + input, #porta input.me-sy { padding-right: 50px; }',
    '#porta .pk-gabim { min-height: 20px; margin: 2px 2px 10px; font-size: 13.5px; font-weight: 600; color: #c62828; line-height: 1.4; }',
    'html[data-tema="dark"] #porta .pk-gabim { color: #ff8a80; }',
    '#porta .pk-btn { width: 100%; height: 52px; border: 0; border-radius: 26px; background: var(--primar, #1565C0); color: #fff;',
    '  font: inherit; font-size: 16px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; }',
    '#porta .pk-btn:disabled { opacity: .7; cursor: default; }',
    '#porta .pk-shenim { margin: 16px 2px 0; font-size: 12.5px; color: #6b6f7a; line-height: 1.5; text-align: center; }',
    'html[data-tema="dark"] #porta .pk-shenim { color: #a9aebb; }',
    '#porta .pk-pritje { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 18px 0 8px; font-size: 15px; text-align: center; }',
    '#porta .pk-rrotull { width: 28px; height: 28px; border: 3px solid rgba(21,101,192,.25); border-color: color-mix(in srgb, var(--primar, #1565C0) 30%, transparent);',
    '  border-top-color: var(--primar, #1565C0); border-radius: 50%; animation: pkRrotull .8s linear infinite; }',
    '#porta .pk-btn .pk-rrotull { width: 18px; height: 18px; border-width: 2.5px; border-color: rgba(255,255,255,.35); border-top-color: #fff; }',
    '@keyframes pkRrotull { to { transform: rotate(360deg); } }',
    '.pk-fsheh { display: none !important; }'
  ].join('\n');
  document.head.appendChild(stili);

  // ---------- Pamja ----------
  var SY = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
  var SY_MBYLLUR = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-6.5 0-10-7-10-7a18.4 18.4 0 0 1 5.06-5.94M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22"></path><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"></path></svg>';
  var porta = document.createElement('div');
  porta.id = 'porta';
  porta.setAttribute('role', 'dialog');
  porta.setAttribute('aria-modal', 'true');
  porta.setAttribute('aria-label', 'Hyr në Stoku');
  porta.innerHTML =
    '<div class="pk">' +
      '<div class="pk-logo"><img src="logo.png" alt="Stoku"></div>' +
      '<p class="pk-nen" id="pkNen">Regjistrimi i mallit dhe i afateve të skadimit.</p>' +
      '<div class="pk-pritje" id="pkPritje"><div class="pk-rrotull"></div><div id="pkPritjeTekst">Duke u lidhur…</div></div>' +
      '<form id="pkForma" class="pk-fsheh" novalidate autocomplete="on">' +
        '<div class="pk-tabet" role="tablist">' +
          '<button type="button" role="tab" id="pkTabHyr" class="aktiv" aria-selected="true">Hyr</button>' +
          '<button type="button" role="tab" id="pkTabKrijo" aria-selected="false">Krijo llogari</button>' +
        '</div>' +
        '<label><span>Emri i përdoruesit</span><input id="pkEmri" name="username" type="text" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="40" enterkeyhint="next" placeholder="Emri i përdoruesit"></label>' +
        '<label><span>Fjalëkalimi</span><div class="pk-fusha"><input id="pkFjalekalimi" class="me-sy" name="password" type="password" autocomplete="current-password" maxlength="100" enterkeyhint="go" placeholder="Fjalëkalimi"><button type="button" class="pk-sy" id="pkSy" aria-label="Shfaq fjalëkalimin" title="Shfaq fjalëkalimin">' + SY + '</button></div></label>' +
        '<label id="pkPerseritLbl" class="pk-fsheh"><span>Përsërit fjalëkalimin</span><input id="pkPerserit" class="me-sy" name="password2" type="password" autocomplete="new-password" maxlength="100" enterkeyhint="go" placeholder="Shkruaje edhe një herë"></label>' +
        '<div class="pk-gabim" id="pkGabim" role="alert"></div>' +
        '<button type="submit" class="pk-btn" id="pkDergo">Hyr</button>' +
        '<p class="pk-shenim" id="pkShenim">Hyr me llogarinë e dyqanit. Të dhënat sinkronizohen vetë në telefon, PDA dhe kompjuter.</p>' +
      '</form>' +
    '</div>';
  document.body.insertBefore(porta, document.body.firstChild);

  function $(id) { return document.getElementById(id); }
  var gjendja = { modaliteti: 'hyr', dukePunuar: false, gati: false, eHapur: true, kohezuesi: null };

  function shfaqPritjen(tekst) {
    $('pkPritjeTekst').textContent = tekst;
    $('pkPritje').classList.remove('pk-fsheh');
    $('pkForma').classList.add('pk-fsheh');
  }
  function shfaqFormen(mesazh) {
    $('pkPritje').classList.add('pk-fsheh');
    $('pkForma').classList.remove('pk-fsheh');
    $('pkGabim').textContent = mesazh || '';
    if (!$('pkEmri').value) $('pkEmri').value = lexo(KEY_EMRI_FUNDIT) || '';
    setTimeout(function () { ($('pkEmri').value ? $('pkFjalekalimi') : $('pkEmri')).focus(); }, 60);
  }
  function vendosModalitetin(m) {
    gjendja.modaliteti = m;
    var krijo = m === 'krijo';
    $('pkTabHyr').classList.toggle('aktiv', !krijo); $('pkTabHyr').setAttribute('aria-selected', String(!krijo));
    $('pkTabKrijo').classList.toggle('aktiv', krijo); $('pkTabKrijo').setAttribute('aria-selected', String(krijo));
    $('pkPerseritLbl').classList.toggle('pk-fsheh', !krijo);
    $('pkFjalekalimi').setAttribute('autocomplete', krijo ? 'new-password' : 'current-password');
    $('pkDergo').textContent = krijo ? 'Krijo llogarinë' : 'Hyr';
    $('pkShenim').textContent = krijo
      ? 'Emri: të paktën 3 shkronja ose numra (a–z, 0–9, _ . -). Fjalëkalimi: të paktën 6 shenja. Mbaje mend — të duhet në çdo pajisje.'
      : 'Hyr me llogarinë e dyqanit. Të dhënat sinkronizohen vetë në telefon, PDA dhe kompjuter.';
    $('pkGabim').textContent = '';
  }
  $('pkTabHyr').addEventListener('click', function () { vendosModalitetin('hyr'); $('pkEmri').focus(); });
  $('pkTabKrijo').addEventListener('click', function () { vendosModalitetin('krijo'); $('pkEmri').focus(); });
  $('pkSy').addEventListener('click', function () {
    var shfaq = $('pkFjalekalimi').type === 'password';
    $('pkFjalekalimi').type = shfaq ? 'text' : 'password';
    $('pkPerserit').type = shfaq ? 'text' : 'password';
    this.innerHTML = shfaq ? SY_MBYLLUR : SY;
    this.setAttribute('aria-label', shfaq ? 'Fshih fjalëkalimin' : 'Shfaq fjalëkalimin');
    this.title = this.getAttribute('aria-label');
  });

  function tekstiGabimit(kodi) {
    switch (kodi) {
      case 'auth/invalid-credential': case 'auth/wrong-password': case 'auth/user-not-found': case 'auth/invalid-login-credentials':
        return 'Emri i përdoruesit ose fjalëkalimi është gabim.';
      case 'auth/email-already-in-use': return 'Ky emër përdoruesi është i zënë. Zgjidh një tjetër, ose hyr nëse është llogaria jote.';
      case 'auth/weak-password': return 'Fjalëkalimi duhet të ketë të paktën 6 shenja.';
      case 'auth/invalid-email': return 'Emri i përdoruesit ka shenja të palejuara. Përdor vetëm a–z, 0–9, _ . -';
      case 'auth/too-many-requests': return 'Shumë prova të gabuara. Prit pak minuta dhe provo përsëri.';
      case 'auth/network-request-failed': return 'S\'ka lidhje me internetin. Kontrollo internetin dhe provo përsëri.';
      case 'auth/user-disabled': return 'Kjo llogari është çaktivizuar. Kontakto administratorin.';
      case 'auth/operation-not-allowed': return 'Krijimi i llogarive s\'është i lejuar në Firebase (Authentication → Email/Password).';
      default: return 'Diçka shkoi keq. Kontrollo internetin dhe provo përsëri.';
    }
  }

  $('pkEmri').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); $('pkFjalekalimi').focus(); } });
  $('pkForma').addEventListener('submit', async function (ev) {
    ev.preventDefault();
    if (gjendja.dukePunuar) return;
    var krijo = gjendja.modaliteti === 'krijo';
    var emri = $('pkEmri').value.trim();
    var fjalekalimi = $('pkFjalekalimi').value;
    var gabim = $('pkGabim');
    if (!emri) { gabim.textContent = 'Shkruaj emrin e përdoruesit.'; $('pkEmri').focus(); return; }
    if (!/^[a-zA-Z0-9_.-]{3,40}$/.test(emri)) { gabim.textContent = 'Emri i përdoruesit: të paktën 3 shkronja ose numra (a–z, 0–9, _ . -), pa hapësira.'; $('pkEmri').focus(); return; }
    if (!fjalekalimi) { gabim.textContent = 'Shkruaj fjalëkalimin.'; $('pkFjalekalimi').focus(); return; }
    if (fjalekalimi.length < 6) { gabim.textContent = 'Fjalëkalimi duhet të ketë të paktën 6 shenja.'; $('pkFjalekalimi').focus(); return; }
    if (krijo && $('pkPerserit').value !== fjalekalimi) { gabim.textContent = 'Fjalëkalimet nuk përputhen.'; $('pkPerserit').focus(); return; }
    var cloud = window.__stokuCloud;
    if (!cloud || !cloud.hyr) { gabim.textContent = 'S\'ka lidhje me internetin. Kontrollo internetin dhe rifresko faqen.'; return; }
    gabim.textContent = '';
    gjendja.dukePunuar = true;
    var btn = $('pkDergo');
    btn.disabled = true;
    btn.innerHTML = '<span class="pk-rrotull"></span>' + (krijo ? 'Duke krijuar llogarinë…' : 'Duke hyrë…');
    var rez;
    try { rez = krijo ? await cloud.regjistrohu(emri, fjalekalimi) : await cloud.hyr(emri, fjalekalimi); }
    catch (e) { rez = { ok: false }; }
    gjendja.dukePunuar = false;
    btn.disabled = false;
    btn.textContent = krijo ? 'Krijo llogarinë' : 'Hyr';
    if (!rez || !rez.ok) {
      gabim.textContent = tekstiGabimit(rez && rez.kodi);
      $('pkFjalekalimi').select();
      return;
    }
    shkruaj(KEY_EMRI_FUNDIT, emri);
    $('pkFjalekalimi').value = ''; $('pkPerserit').value = '';
    shfaqPritjen(krijo ? 'Llogaria u krijua. Duke hapur…' : 'Duke hapur…');
    // Pjesa tjetër ndodh te "stoku-auth-ndryshoi" (Firebase e njofton hyrjen)
  });

  // Tastet (shkurtoret e faqes) s'duhet të veprojnë pas portës
  window.addEventListener('keydown', function (ev) {
    if (gjendja.eHapur && !porta.contains(ev.target)) { ev.stopImmediatePropagation(); }
  }, true);

  function mbyll() {
    if (!gjendja.eHapur) return;
    gjendja.eHapur = false;
    porta.classList.add('po-zhduket');
    html.classList.remove('porta-hapur');
    setTimeout(function () { if (!gjendja.eHapur) porta.style.display = 'none'; }, 260);
    window.dispatchEvent(new Event('stoku-porta-hapur'));
  }
  function hap(mesazh) {
    gjendja.eHapur = true;
    porta.style.display = '';
    porta.classList.remove('po-zhduket');
    html.classList.add('porta-hapur');
    vendosModalitetin('hyr');
    shfaqFormen(mesazh);
  }

  // A është hyrë? (Firebase e di vetëm pasi "authGati")
  function kontrollo(ev) {
    var cloud = window.__stokuCloud;
    if (!cloud || !cloud.authGati) return; // ende duke u lidhur
    gjendja.gati = true;
    clearTimeout(gjendja.kohezuesi);
    var u = cloud.perdoruesiAktual && cloud.perdoruesiAktual();
    if (!u) {
      shkruaj(KEY_HYRJA, null); // pas "Dil" (ose kur hyrja ka skaduar) s'lejohet hyrja pa internet
      if (!gjendja.eHapur) hap(); else if (!gjendja.dukePunuar) shfaqFormen($('pkGabim').textContent);
      return;
    }
    // Të dhënat lokale i përkasin një llogarie tjetër? Hiqen para se faqja t'i sinkronizojë në
    // llogarinë e re, dhe faqja rinis e pastër (të dhënat e llogarisë tjetër janë në cloud-in e saj).
    var pronari = lexo(KEY_PRONARI);
    if (pronari && pronari !== u.uid) {
      if (ev && ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      CELESAT_E_TE_DHENAVE.forEach(function (k) { shkruaj(k, null); });
      shkruaj(KEY_PRONARI, u.uid);
      shfaqPritjen('Duke hapur dyqanin tënd…');
      location.reload();
      return;
    }
    if (!pronari) shkruaj(KEY_PRONARI, u.uid); // hyrja e parë: të dhënat e kësaj pajisjeje i kalojnë kësaj llogarie
    var emri = String(u.email || '').replace(/@stoku-app\.local$/, '');
    shkruaj(KEY_HYRJA, JSON.stringify({ uid: u.uid, emri: emri }));
    if (emri) shkruaj(KEY_EMRI_FUNDIT, emri);
    mbyll();
  }
  window.addEventListener('stoku-cloud-gati', kontrollo);
  window.addEventListener('stoku-auth-ndryshoi', kontrollo);

  // Pritja fillestare
  var fundit = hyrjaEFundit();
  shfaqPritjen(fundit && fundit.emri ? 'Duke hyrë si ' + fundit.emri + '…' : 'Duke u lidhur…');
  // Pa internet (sipas shfletuesit) në një pajisje të kyçur më parë: s'ka pse të pritet — Firebase e ka
  // hyrjen të ruajtur lokalisht dhe do ta konfirmojë vetë; ndërkohë punohet me të dhënat lokale.
  var paInternet = typeof navigator !== 'undefined' && navigator.onLine === false;
  gjendja.kohezuesi = setTimeout(function () {
    if (gjendja.gati) return;
    // Firebase s'u përgjigj (pa internet dhe pa kopje të ruajtur të tij)
    var f = hyrjaEFundit();
    if (f && f.uid && lexo(KEY_PRONARI) === f.uid) {
      mbyll(); // kjo pajisje ka qenë e kyçur — punohet lokalisht derisa të kthehet interneti
      return;
    }
    shfaqFormen('S\'ka lidhje me internetin. Hyrja e parë në këtë pajisje kërkon internet.');
  }, paInternet && fundit && fundit.uid && lexo(KEY_PRONARI) === fundit.uid ? 400 : PRITJA_MAKS_MS);
  if (window.__stokuCloud) kontrollo();

  window.StokuPorta = { eHapur: function () { return gjendja.eHapur; } };
})();
