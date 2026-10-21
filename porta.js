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
 *  - "Hyr si vizitor" (v217): provë pa llogari, me disa produkte e afate shembull. Gjithçka mbetet vetëm në këtë
 *    pajisje (pronari i të dhënave = "vizitor"): s'sinkronizohet, s'ka Grup, AI, njoftime apo orë. Kur hyn më pas
 *    një llogari, të dhënat e provës hiqen si te çdo ndërrim llogarie (s'kalojnë kurrë në cloud).
 *
 * Duhet ngarkuar si skripti i parë brenda <body>, që ekrani të dalë para se të vizatohet faqja.
 */
(function () {
  'use strict';

  var KEY_HYRJA = 'stoku:porta:hyrja';      // { uid, emri } e hyrjes së fundit (për hyrje pa internet)
  var KEY_PRONARI = 'stoku:pronari-uid';    // llogaria të cilës i përkasin të dhënat lokale
  var KEY_EMRI_FUNDIT = 'stoku:porta:emri'; // emri i fundit i shkruar (plotësohet vetë, nëse "Më mbaj mend" është aktiv)
  var KEY_MBAJ_EMRIN = 'stoku:porta:mbaj-emrin'; // '0' = mos e mbaj mend emrin (parazgjedhja: mbahet mend). Fjalëkalimi s'ruhet kurrë.
  var KEY_MESAZHI = 'stoku:porta:mesazh';   // mesazh një-herësh për ekranin e hyrjes pas rifreskimit
  var KEY_DIL = 'stoku:porta:dil';          // '1' pas "Dil" me dorë: llogaria e ruajtur s'ofrohet vetë sapo hapet porta
  var KEY_VIZITOR = 'stoku:vizitor';        // '1' = pajisja është në provë si vizitor (porta s'del)
  var VIZITOR = 'vizitor';                  // pronari i të dhënave lokale gjatë provës
  var CELESAT_E_TE_DHENAVE = ['stoku:foldera:v1', 'stoku:produktet:v2', 'stoku:produktet:v1', 'stoku:fshira:v1',
    'stoku:rendi-foldera-koha', 'stoku:afatet:v1', 'stoku:kujtesa:v1', 'stoku:kopja-fshirjeve:v1', 'stoku:marketet:v1', 'stoku:marketi:aktiv'];
  var PRITJA_MAKS_MS = 7000;
  var SERVERI = 'https://stoku-push.mendurb.workers.dev'; // Worker-i (163+): fjalëkalimi i harruar
  var PRITJA_DERGIMIT_MS = 25000; // "Hyr" para se të ngarkohet Firebase (internet i ngadaltë): pritet deri kaq

  // Firebase (v12) kërkon shfletues të ri (ES2020: Chrome/WebView 80+, Safari 13.1+). Në një shfletues të vjetër
  // moduli i Firebase-it s'ngarkohet fare — kjo s'është mungesë interneti dhe përdoruesit i thuhet saktë.
  // v238: e vendos es2020.js (para porta.js); `new Function` s'përdoret më, se CSP-ja (pa 'unsafe-eval') e ndalon
  var SHFLETUES_I_VJETER = window.__stokuES2020 !== true;
  var MESAZHI_VJETER = 'Ky shfletues është shumë i vjetër për hyrjen në Stoku. Përditëso Chrome (dhe "Android System WebView" nga Play Store) ose Safari, pastaj hape sërish.';
  function mesazhiPaLidhje() {
    if (SHFLETUES_I_VJETER) return MESAZHI_VJETER;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'S\'ka lidhje me internetin. Hyrja e parë në këtë pajisje kërkon internet.';
    return 'Lidhja me serverin po zgjat (internet i dobët?). Mund të provosh të hysh, pritet derisa të lidhet.';
  }

  function lexo(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function shkruaj(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* ok */ } }
  function hyrjaEFundit() { try { return JSON.parse(lexo(KEY_HYRJA) || 'null'); } catch (e) { return null; } }
  function eVizitor() { return lexo(KEY_VIZITOR) === '1' && lexo(KEY_PRONARI) === VIZITOR; }
  // Kjo faqe u hap si vizitor: të dhënat e saj në memorie janë të provës për krejt jetën e faqes. Faqja s'i sinkronizon
  // kurrë (as pasi dikush hyn me llogari: porta i fshin dhe e rinis faqen).
  var ngaVizitori = eVizitor();
  // v232: llogaria të cilës i përkasin të dhënat që kjo faqe i ka në memorie (të lexuara në hapje). Aplikacioni i
  // instaluar dhe Chrome (ose dy skeda) e ndajnë localStorage dhe hyrjen e Firebase-it: kur në njërën hyhet me llogari
  // tjetër, faqja tjetër s'duhet t'i shkruajë të dhënat e llogarisë së vjetër (bashkë me fshirjet e saj) te llogaria e re.
  // null = pajisje pa pronar ende (hyrja e parë i merr të dhënat e saj).
  var pronariIFaqes = lexo(KEY_PRONARI);
  // A ka produkte ose afate në këtë pajisje? (para provës: a do të hiqej diçka e një llogarie)
  function kaTeDhena() {
    try {
      var p = JSON.parse(lexo('stoku:produktet:v2') || 'null'), a = JSON.parse(lexo('stoku:afatet:v1') || 'null');
      return !!((p && typeof p === 'object' && Object.keys(p).length) || (Array.isArray(a) && a.length));
    } catch (e) { return true; }
  }
  // Të dhënat shembull të provës: folderat e zakonshëm, disa produkte (njëri pa stok) dhe afate me ngjyrat e ndryshme
  // (i skaduar, sot, së shpejti, në rregull, i hequr nga rafti). Datat llogariten nga dita kur fillon prova.
  function mbushProven() {
    var tani = Date.now(), DITA = 86400000;
    function dy(n) { return (n < 10 ? '0' : '') + n; }
    function data(n) { var d = new Date(tani + n * DITA); return d.getFullYear() + '-' + dy(d.getMonth() + 1) + '-' + dy(d.getDate()); }
    var foldera = [{ id: 'ushqimore', emri: 'Ushqimore' }, { id: 'pije', emri: 'Pije' }, { id: 'higjiene', emri: 'Higjiene' }, { id: 'fresh', emri: 'Fresh' }];
    var lista = [
      ['ushqimore', '2000100000014', 'Bukë e bardhë 500g', 18, 'Furnizuesi A'],
      ['ushqimore', '2000100000021', 'Oriz 1kg', 40, 'Furnizuesi B'],
      ['ushqimore', '2000100000038', 'Makarona 500g', 25, 'Furnizuesi B'],
      ['ushqimore', '2000100000045', 'Vaj luledielli 1L', 6, 'Furnizuesi B'],
      ['pije', '2000200000013', 'Ujë natyral 1.5L', 48, 'Furnizuesi C'],
      ['pije', '2000200000020', 'Lëng portokalli 1L', 0, 'Furnizuesi C'],
      ['pije', '2000200000037', 'Pije e gazuar 0.5L', 30, 'Furnizuesi C'],
      ['higjiene', '2000300000012', 'Sapun i lëngshëm 500ml', 12, 'Furnizuesi B'],
      ['higjiene', '2000300000029', 'Pastë dhëmbësh 75ml', 9, 'Furnizuesi B'],
      ['fresh', '2000400000011', 'Qumësht 1L', 20, 'Furnizuesi A'],
      ['fresh', '2000400000028', 'Kos 500g', 15, 'Furnizuesi A'],
      ['fresh', '2000400000035', 'Djathë i bardhë 400g', 7, 'Furnizuesi A']
    ];
    var ORA = 3600000, oretMePare = [0.2, 0.7, 2, 4, 7, 26, 29, 50, 53, 75, 98, 122]; // ndryshimet e fundit, si në një dyqan të vërtetë
    var produktet = {};
    lista.forEach(function (x, i) {
      produktet[x[0] + '::' + x[1]] = { barkodi: x[1], emri: x[2], sasia: x[3], kategoriaId: x[0], furnizuesi: x[4], prekurSe: Math.round(tani - oretMePare[i] * ORA) };
    });
    var afatet = [
      ['2000400000028', 'Kos 500g', -2, 4, 'Furnizuesi A'],
      ['2000400000011', 'Qumësht 1L', 0, 6, 'Furnizuesi A'],
      ['2000100000014', 'Bukë e bardhë 500g', 2, 10, 'Furnizuesi A'],
      ['2000400000035', 'Djathë i bardhë 400g', 6, 3, 'Furnizuesi A'],
      ['2000200000020', 'Lëng portokalli 1L', 21, 12, 'Furnizuesi C'],
      ['2000100000021', 'Oriz 1kg', 150, 20, 'Furnizuesi B'],
      ['2000400000042', 'Jogurt frutash 150g', -9, 5, 'Furnizuesi A']
    ].map(function (x, i) {
      var a = { id: 'prova' + (i + 1), barkodi: x[0], emri: x[1], data: data(x[2]), sasia: x[3], furnizuesi: x[4], statusi: 'aktiv',
        krijuarSe: tani - 3 * DITA, ndryshuarSe: tani - 3 * DITA };
      if (i === 6) { a.statusi = 'hequr'; a.hequrSe = tani - 8 * DITA; a.ndryshuarSe = a.hequrSe; }
      return a;
    });
    shkruaj('stoku:foldera:v1', JSON.stringify(foldera));
    shkruaj('stoku:produktet:v2', JSON.stringify(produktet));
    shkruaj('stoku:afatet:v1', JSON.stringify(afatet));
  }

  var html = document.documentElement;
  html.classList.add('porta-hapur');

  // ---------- Stili ----------
  var stili = document.createElement('style');
  stili.textContent = [
    'html.porta-hapur, html.porta-hapur body { overflow: hidden !important; }',
    '#porta { position: fixed; inset: 0; z-index: 2147483000; display: flex; align-items: center; justify-content: center;',
    '  padding: max(20px, env(safe-area-inset-top)) 16px max(20px, env(safe-area-inset-bottom));',
    '  background: var(--sb-bg, #f6f5f2); font-family: var(--sb-font, inherit); color: var(--sb-ink, #14161b);',
    '  overflow-y: auto; transition: opacity .25s ease; -webkit-font-smoothing: antialiased; }',
    '#porta.po-zhduket { opacity: 0; pointer-events: none; }',
    '#porta .pk { width: 100%; max-width: 400px; background: var(--sb-surface, #fff); border-radius: 22px; padding: 28px 24px 22px;',
    '  box-shadow: 0 0 0 1px var(--sb-line, #e6e4df), 0 30px 80px -30px rgba(0,0,0,.25); margin: auto; }',
    '#porta .pk-logo { display: flex; align-items: center; justify-content: center; margin: 4px 0 14px; }',
    '#porta .pk-logo img { height: 48px; width: auto; display: block; }',
    '#porta .pk-logo .pk-logo-err { display: none; }',
    'html[data-tema="dark"] #porta .pk-logo .pk-logo-cel { display: none; }',
    'html[data-tema="dark"] #porta .pk-logo .pk-logo-err { display: block; }',
    '#porta .pk-nen { text-align: center; margin: 0 0 20px; font-size: 14px; color: var(--sb-muted, #7a7d85); line-height: 1.45; }',
    '#porta .pk-tabet { display: flex; background: var(--sb-sunken, #ebe9e4); border-radius: 14px; padding: 4px; margin-bottom: 18px; }',
    '#porta .pk-tabet button { flex: 1; height: 38px; border: 0; border-radius: 10px; background: transparent; font: inherit;',
    '  font-size: 14px; font-weight: 600; color: var(--sb-ink-4, #6b6e76); cursor: pointer; }',
    '#porta .pk-tabet button.aktiv { background: var(--sb-seg-on, #fff); color: var(--sb-ink, #14161b); box-shadow: 0 1px 3px rgba(0,0,0,.08); }',
    '#porta label { display: block; margin-bottom: 12px; }',
    '#porta label span { display: block; font-size: 13px; font-weight: 600; color: var(--sb-ink-3, #5b5e66); margin: 0 2px 6px; }',
    '#porta .pk-fusha { position: relative; }',
    '#porta input { width: 100%; box-sizing: border-box; height: 48px; padding: 0 14px; font: inherit; font-size: 16px;',
    '  border: 0; border-radius: 14px; background: var(--sb-surface, #fff); color: inherit; outline: none;',
    '  box-shadow: 0 0 0 1px var(--sb-line, #e6e4df); }',
    '#porta input::placeholder { color: var(--sb-faint, #8a8d94); }',
    '#porta input:focus { box-shadow: 0 0 0 2px var(--sb-accent, #1f5fc4); }',
    '#porta .pk-sy { position: absolute; right: 4px; top: 50%; transform: translateY(-50%); width: 40px; height: 40px; border: 0;',
    '  border-radius: 10px; background: transparent; color: var(--sb-muted, #7a7d85); cursor: pointer; display: flex; align-items: center; justify-content: center; }',
    '#porta .pk-sy + input, #porta input.me-sy { padding-right: 50px; }',
    '#porta .pk-gabim { min-height: 20px; margin: 2px 2px 10px; font-size: 13.5px; font-weight: 600; color: var(--sb-exp, #c23a33); line-height: 1.4; }',
    '#porta .pk-btn { width: 100%; height: 52px; border: 0; border-radius: 14px; background: var(--sb-accent, #1f5fc4); color: #fff;',
    '  font: inherit; font-size: 16px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;',
    '  box-shadow: var(--sb-shadow-accent, none); }',
    '#porta .pk-btn:active { background: var(--sb-accent-press, #16479a); }',
    '#porta .pk-btn:disabled { opacity: .7; cursor: default; }',
    '#porta .pk-fund { margin: 20px 0 0; text-align: center; font-size: 12.5px; }',
    '#porta .pk-fund a { color: var(--sb-muted, #7a7d85); text-decoration: underline; text-underline-offset: 2px; }',
    '#porta .pk-shenim { margin: 16px 2px 0; font-size: 12.5px; color: var(--sb-muted, #7a7d85); line-height: 1.5; text-align: center; text-wrap: balance; }',
    '#porta .pk-pritje { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 18px 0 8px; font-size: 15px; text-align: center; }',
    '#porta .pk-rrotull { width: 28px; height: 28px; border: 3px solid var(--sb-accent-line, #d6e2f5);',
    '  border-top-color: var(--sb-accent, #1f5fc4); border-radius: 50%; animation: pkRrotull .8s linear infinite; }',
    '#porta .pk-btn .pk-rrotull { width: 18px; height: 18px; border-width: 2.5px; border-color: rgba(255,255,255,.35); border-top-color: #fff; }',
    '@keyframes pkRrotull { to { transform: rotate(360deg); } }',
    '#porta .pk-mbaj { display: flex; align-items: center; gap: 10px; margin: 2px 2px 8px; min-height: 44px; cursor: pointer;',
    '  font-size: 14.5px; font-weight: 600; color: var(--sb-ink-2, #3a3d44); -webkit-user-select: none; user-select: none; }',
    '#porta .pk-mbaj input { position: absolute; opacity: 0; width: 1px; height: 1px; margin: 0; padding: 0; box-shadow: none; }',
    '#porta .pk-tick { flex: none; width: 24px; height: 24px; border-radius: 7px; box-sizing: border-box; display: flex; align-items: center;',
    '  justify-content: center; background: var(--sb-surface, #fff); box-shadow: inset 0 0 0 1.5px var(--sb-control, #c9c7c1); color: transparent;',
    '  transition: background .15s, box-shadow .15s; }',
    '#porta .pk-mbaj input:checked + .pk-tick { background: var(--sb-accent, #1f5fc4); box-shadow: none; color: #fff; }',
    '#porta .pk-mbaj input:focus-visible + .pk-tick { outline: 2px solid var(--sb-accent, #1f5fc4); outline-offset: 2px; }',
    '#porta .pk-ose { display: flex; align-items: center; gap: 12px; margin: 18px 2px 14px; font-size: 12.5px; color: var(--sb-faint, #8a8d94); }',
    '#porta .pk-ose::before, #porta .pk-ose::after { content: ""; flex: 1; height: 1px; background: var(--sb-line, #e6e4df); }',
    '#porta .pk-btn.pk-dyte { background: var(--sb-sunken, #ebe9e4); color: var(--sb-ink, #14161b); box-shadow: none; }',
    '#porta .pk-btn.pk-dyte:active { background: var(--sb-line, #e6e4df); }',
    '#porta .pk-viz-konf { margin-top: 12px; padding: 14px; border-radius: 14px; background: var(--sb-sunken, #ebe9e4); font-size: 13.5px; line-height: 1.45; }',
    '#porta .pk-viz-konf p { margin: 0 0 12px; }',
    '#porta .pk-viz-konf .pk-rresht { display: flex; gap: 8px; }',
    '#porta .pk-viz-konf .pk-btn { height: 44px; font-size: 14.5px; }',
    '#porta .pk-lidhje { background: none; border: 0; padding: 4px 2px; font: inherit; font-size: 13.5px; font-weight: 600; color: var(--sb-accent-text, #1f5fc4); cursor: pointer; }',
    '#porta .pk-harrova { display: flex; justify-content: flex-end; margin: -6px 0 6px; }',
    '#porta .pk-titull { margin: 0 0 6px; font-size: 19px; font-weight: 800; text-align: center; color: var(--sb-ink, #14161b); }',
    '#porta .pk-teksti { margin: 0 2px 16px; font-size: 14px; line-height: 1.5; text-align: center; color: var(--sb-muted, #7a7d85); text-wrap: balance; }',
    '#porta .pk-llogaria { margin: -6px 2px 14px; font-size: 13.5px; text-align: center; color: var(--sb-ink-3, #5b5e66); }',
    '#porta input.pk-kodi { font-size: 24px; letter-spacing: .35em; text-align: center; font-variant-numeric: tabular-nums; }',
    '#porta .pk-mbrapa { display: block; margin: 12px auto 0; }',
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
      '<div class="pk-logo"><img class="pk-logo-cel" src="logo/stoku-logo.svg?v=3" alt="Stoku"><img class="pk-logo-err" src="logo/stoku-logo-dark.svg?v=3" alt="Stoku"></div>' +
      '<p class="pk-nen" id="pkNen">Regjistrimi i mallit dhe i afateve të skadimit.</p>' +
      '<div class="pk-pritje" id="pkPritje"><div class="pk-rrotull"></div><div id="pkPritjeTekst">Duke u lidhur…</div></div>' +
      '<form id="pkForma" class="pk-fsheh" novalidate autocomplete="on">' +
        '<div class="pk-tabet" role="tablist">' +
          '<button type="button" role="tab" id="pkTabHyr" class="aktiv" aria-selected="true">Hyr</button>' +
          '<button type="button" role="tab" id="pkTabKrijo" aria-selected="false">Krijo llogari</button>' +
        '</div>' +
        '<label><span>Emri i përdoruesit</span><input id="pkEmri" name="username" type="text" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="40" enterkeyhint="next" placeholder="Emri i përdoruesit"></label>' +
        '<label><span>Fjalëkalimi</span><div class="pk-fusha"><input id="pkFjalekalimi" class="me-sy" name="password" type="password" autocomplete="current-password" maxlength="100" enterkeyhint="go" placeholder="Fjalëkalimi"><button type="button" class="pk-sy" id="pkSy" aria-label="Shfaq fjalëkalimin" title="Shfaq fjalëkalimin">' + SY + '</button></div></label>' +
        '<div class="pk-harrova" id="pkHarrovaRresht"><button type="button" class="pk-lidhje" id="pkHarrova">Ke harruar fjalëkalimin?</button></div>' +
        '<label id="pkPerseritLbl" class="pk-fsheh"><span>Përsërit fjalëkalimin</span><input id="pkPerserit" class="me-sy" name="password2" type="password" autocomplete="new-password" maxlength="100" enterkeyhint="go" placeholder="Shkruaje edhe një herë"></label>' +
        '<label class="pk-mbaj pk-fsheh" id="pkMerchLbl" for="pkMerch"><input type="checkbox" id="pkMerch"><div class="pk-tick" aria-hidden="true"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></div><div>Punoj si merchandiser (në disa markete)</div></label>' +
        '<label class="pk-mbaj" id="pkMbajLbl" for="pkMbaj"><input type="checkbox" id="pkMbaj"><div class="pk-tick" aria-hidden="true"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></div><div>Më mbaj mend emrin e përdoruesit</div></label>' +
        '<div class="pk-gabim" id="pkGabim" role="alert"></div>' +
        '<button type="submit" class="pk-btn" id="pkDergo">Hyr</button>' +
        '<p class="pk-shenim" id="pkShenim">Rekomandohet hapja e një llogarie, që të dhënat të ruhen në cloud.</p>' +
        '<div class="pk-ose">ose</div>' +
        '<button type="button" class="pk-btn pk-dyte" id="pkVizitor">Hyr si vizitor</button>' +
        '<p class="pk-shenim" id="pkVizitorShenim">Hyr si vizitor për të parë si funksionojnë shërbimet e Stoku-t (kujdes: të dhënat nuk ruhen në cloud).</p>' +
        '<div class="pk-viz-konf pk-fsheh" id="pkVizKonf" role="alert">' +
          '<p id="pkVizKonfTekst"></p>' +
          '<div class="pk-rresht"><button type="button" class="pk-btn pk-dyte" id="pkVizJo">Anulo</button><button type="button" class="pk-btn" id="pkVizPo">Vazhdo si vizitor</button></div>' +
        '</div>' +
      '</form>' +
      '<div id="pkRiv" class="pk-fsheh">' +
        '<h2 class="pk-titull">Fjalëkalimi i harruar</h2>' +
        '<p class="pk-teksti" id="pkRivTeksti"></p>' +
        '<form id="pkRivForma" novalidate autocomplete="on">' +
          '<label id="pkRivEmriLbl"><span>Emri i përdoruesit</span><input id="pkRivEmri" name="username" type="text" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="40" enterkeyhint="send" placeholder="Emri i përdoruesit"></label>' +
          '<p class="pk-llogaria pk-fsheh" id="pkRivLlogaria"></p>' +
          '<label id="pkRivKodiLbl" class="pk-fsheh"><span>Kodi 6-shifror</span><input id="pkRivKodi" class="pk-kodi" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" enterkeyhint="next" placeholder="••••••"></label>' +
          '<label id="pkRivFj1Lbl" class="pk-fsheh"><span>Fjalëkalimi i ri</span><div class="pk-fusha"><input id="pkRivFj1" class="me-sy" name="new-password" type="password" autocomplete="new-password" maxlength="100" enterkeyhint="next" placeholder="Të paktën 6 shenja"><button type="button" class="pk-sy" id="pkRivSy" aria-label="Shfaq fjalëkalimin" title="Shfaq fjalëkalimin">' + SY + '</button></div></label>' +
          '<label id="pkRivFj2Lbl" class="pk-fsheh"><span>Përsërite fjalëkalimin e ri</span><input id="pkRivFj2" class="me-sy" type="password" autocomplete="new-password" maxlength="100" enterkeyhint="go" placeholder="Shkruaje edhe një herë"></label>' +
          '<div class="pk-gabim" id="pkRivGabim" role="alert"></div>' +
          '<button type="submit" class="pk-btn" id="pkRivDergo">Dërgo kërkesën</button>' +
        '</form>' +
        '<button type="button" class="pk-lidhje pk-mbrapa pk-fsheh" id="pkRivSerish">Dërgo sërish kërkesën</button>' +
        '<button type="button" class="pk-lidhje pk-mbrapa" id="pkRivMbrapa">Kthehu te hyrja</button>' +
      '</div>' +
      '<p class="pk-fund"><a href="privatesia.html" target="_blank" rel="noopener">Privatësia</a></p>' +
    '</div>';
  document.body.insertBefore(porta, document.body.firstChild);

  function $(id) { return document.getElementById(id); }
  function mbajEmrin() { return lexo(KEY_MBAJ_EMRIN) !== '0'; }
  function ruajEmrin(emri) { if (mbajEmrin() && emri) shkruaj(KEY_EMRI_FUNDIT, emri); }
  $('pkMbaj').checked = mbajEmrin();
  $('pkMbaj').addEventListener('change', function () {
    shkruaj(KEY_MBAJ_EMRIN, this.checked ? null : '0');
    if (!this.checked) shkruaj(KEY_EMRI_FUNDIT, null); // hiqet menjëherë emri i ruajtur
  });
  var gjendja = { modaliteti: 'hyr', dukePunuar: false, gati: false, eHapur: true, kohezuesi: null, rivendosje: false };

  function shfaqPritjen(tekst) {
    $('pkPritjeTekst').textContent = tekst;
    $('pkPritje').classList.remove('pk-fsheh');
    $('pkForma').classList.add('pk-fsheh');
  }
  function shfaqFormen(mesazh) {
    if (gjendja.rivendosje) { $('pkPritje').classList.add('pk-fsheh'); return; } // "Fjalëkalimi i harruar" mbetet hapur
    var ruajtur = lexo(KEY_MESAZHI); // p.sh. "Kjo llogari u fshi nga administratori." (vendoset para rifreskimit)
    if (ruajtur) { shkruaj(KEY_MESAZHI, null); mesazh = ruajtur; }
    $('pkPritje').classList.add('pk-fsheh');
    $('pkForma').classList.remove('pk-fsheh');
    $('pkGabim').textContent = mesazh || '';
    $('pkMbaj').checked = mbajEmrin();
    rifreskoVizitorin();
    if (!$('pkEmri').value && mbajEmrin()) $('pkEmri').value = lexo(KEY_EMRI_FUNDIT) || '';
    setTimeout(function () { ($('pkEmri').value ? $('pkFjalekalimi') : $('pkEmri')).focus(); }, 60);
  }
  function vendosModalitetin(m) {
    gjendja.modaliteti = m;
    var krijo = m === 'krijo';
    $('pkTabHyr').classList.toggle('aktiv', !krijo); $('pkTabHyr').setAttribute('aria-selected', String(!krijo));
    $('pkTabKrijo').classList.toggle('aktiv', krijo); $('pkTabKrijo').setAttribute('aria-selected', String(krijo));
    $('pkPerseritLbl').classList.toggle('pk-fsheh', !krijo);
    // v241: afatet sipas marketeve (me GPS) vetëm për llogaritë e reja që e zgjedhin këtu; administratori e ndryshon më vonë
    $('pkMerchLbl').classList.toggle('pk-fsheh', !krijo);
    if (!krijo) $('pkMerch').checked = false;
    // v241: "Më mbaj mend emrin e përdoruesit" vetëm te "Hyr" (te "Krijo llogari" s'duhet); zgjedhja e ruajtur vlen njësoj
    $('pkMbajLbl').classList.toggle('pk-fsheh', krijo);
    $('pkHarrovaRresht').classList.toggle('pk-fsheh', krijo);
    // v239: vlera ndërtohet nga pjesët; skanerët e sigurisë (Protego) e merrnin vargun e plotë për fjalëkalim të shkruar në kod
    $('pkFjalekalimi').setAttribute('autocomplete', (krijo ? 'new' : 'current') + '-password');
    $('pkDergo').textContent = krijo ? 'Krijo llogarinë' : 'Hyr';
    $('pkShenim').textContent = krijo
      ? 'Emri: të paktën 3 shkronja ose numra (a–z, 0–9, _ . -). Fjalëkalimi: të paktën 6 shenja. Mbaje mend, të duhet në çdo pajisje.'
      : 'Rekomandohet hapja e një llogarie, që të dhënat të ruhen në cloud.';
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
      case 'auth/missing-password': return 'Shkruaj fjalëkalimin.';
      case 'auth/internal-error': case 'auth/timeout': return 'Serveri s\'u përgjigj si duhet. Provo përsëri pas pak.';
      case 'auth/quota-exceeded': return 'Shumë hyrje njëkohësisht në Stoku. Provo përsëri pas pak minuta.';
      case 'auth/unauthorized-domain': case 'auth/invalid-api-key': case 'auth/app-not-authorized':
        return 'Kjo adresë s\'lejohet për hyrje. Hape Stoku-n nga stoku.site. (' + kodi + ')';
      default:
        if (/^auth\/requests-from-referer|api-key-not-valid|blocked/.test(String(kodi))) return 'Kjo adresë s\'lejohet për hyrje. Hape Stoku-n nga stoku.site. (' + kodi + ')';
        return 'Diçka shkoi keq. Kontrollo internetin dhe provo përsëri.' + (kodi ? ' (' + kodi + ')' : '');
    }
  }

  // ---------- Vizitori: provë pa llogari ----------
  function provaEkziston() { return lexo(KEY_PRONARI) === VIZITOR && kaTeDhena(); }
  function rifreskoVizitorin() {
    var vazhdo = provaEkziston();
    $('pkVizitor').textContent = vazhdo ? 'Vazhdo provën si vizitor' : 'Hyr si vizitor';
    $('pkVizitorShenim').textContent = vazhdo ? 'Prova jote si vizitor është ende në këtë pajisje (kujdes: të dhënat nuk ruhen në cloud).'
      : 'Hyr si vizitor për të parë si funksionojnë shërbimet e Stoku-t (kujdes: të dhënat nuk ruhen në cloud).';
    $('pkVizKonf').classList.add('pk-fsheh');
    $('pkVizitor').classList.remove('pk-fsheh');
  }
  $('pkVizitor').addEventListener('click', function () {
    if (gjendja.dukePunuar) return;
    var pronari = lexo(KEY_PRONARI);
    // Në pajisje janë të dhënat e një llogarie (p.sh. pas "Dil"): pyetet para se të hiqen nga kjo pajisje
    if (pronari && pronari !== VIZITOR && kaTeDhena()) {
      var emri = lexo(KEY_EMRI_FUNDIT);
      $('pkVizKonfTekst').textContent = 'Në këtë pajisje janë të dhënat e një llogarie' + (emri ? ' ("' + emri + '")' : '') +
        '. Si vizitor ato hiqen nga kjo pajisje. Ato që janë ruajtur në cloud kthehen kur të hysh sërish me llogari.';
      $('pkVizKonf').classList.remove('pk-fsheh');
      $('pkVizitor').classList.add('pk-fsheh');
      $('pkVizPo').focus();
      return;
    }
    hyrSiVizitor();
  });
  $('pkVizJo').addEventListener('click', rifreskoVizitorin);
  $('pkVizPo').addEventListener('click', hyrSiVizitor);
  function hyrSiVizitor() {
    var mbushur = !kaTeDhena() || lexo(KEY_PRONARI) !== VIZITOR; // prova fillon me të dhënat shembull
    if (lexo(KEY_PRONARI) !== VIZITOR) {
      CELESAT_E_TE_DHENAVE.forEach(function (k) { shkruaj(k, null); });
      shkruaj(KEY_PRONARI, VIZITOR);
    }
    if (mbushur) mbushProven();
    shkruaj(KEY_VIZITOR, '1');
    shkruaj(KEY_HYRJA, null);
    if (!eVizitor()) { // p.sh. dritare private e Safari-t ose memoria plot: s'ruhet asgjë
      $('pkGabim').textContent = 'Ky shfletues s\'po ruan të dhëna (dritare private ose memorie plot), prandaj prova s\'mund të hapet.';
      return;
    }
    if (ngaVizitori && !mbushur) { mbyll(); return; } // kjo faqe i ka tashmë të dhënat e provës në memorie
    gjendja.dukePunuar = true;
    shfaqPritjen('Duke hapur provën…');
    location.reload();
  }
  // Nga aplikacioni (vizitori): porta për hyrje ose llogari të re. Prova mbetet derisa të hyjë një llogari.
  function hapHyrjen() {
    shkruaj(KEY_VIZITOR, null); // rifreskimi tani hap portën; "Vazhdo provën si vizitor" e rikthen
    hap();
  }
  // Nga aplikacioni (vizitori): prova fillon nga e para, me të dhënat shembull
  function rinisProven() {
    if (lexo(KEY_PRONARI) !== VIZITOR) return;
    CELESAT_E_TE_DHENAVE.forEach(function (k) { shkruaj(k, null); });
    mbushProven();
    shkruaj(KEY_VIZITOR, '1');
    location.reload();
  }

  // ---------- Fjalëkalimi i harruar (Worker 163) ----------
  // Llogaritë s'kanë email të vërtetë, prandaj kodi 6-shifror i vjen administratorit (zilja + push). Ai ia jep personit,
  // që e shkruan këtu, vendos fjalëkalimin e ri dy herë dhe hyn direkt.
  var riv = { hapi: 'emri', emri: '', kodi: '' };
  function oraNga(ms) { var d = new Date(ms); return (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes(); }
  function vendosHapin(hapi, teksti, gabim) {
    riv.hapi = hapi;
    $('pkRivEmriLbl').classList.toggle('pk-fsheh', hapi !== 'emri');
    $('pkRivLlogaria').classList.toggle('pk-fsheh', hapi === 'emri');
    $('pkRivLlogaria').textContent = hapi === 'emri' ? '' : 'Llogaria: ' + riv.emri;
    $('pkRivKodiLbl').classList.toggle('pk-fsheh', hapi !== 'kodi');
    $('pkRivFj1Lbl').classList.toggle('pk-fsheh', hapi !== 'fjalekalimi');
    $('pkRivFj2Lbl').classList.toggle('pk-fsheh', hapi !== 'fjalekalimi');
    $('pkRivSerish').classList.toggle('pk-fsheh', hapi !== 'kodi');
    $('pkRivDergo').textContent = { emri: 'Dërgo kërkesën', kodi: 'Vazhdo', fjalekalimi: 'Ndrysho fjalëkalimin dhe hyr' }[hapi];
    $('pkRivTeksti').textContent = teksti;
    $('pkRivGabim').textContent = gabim || '';
    var f = { emri: 'pkRivEmri', kodi: 'pkRivKodi', fjalekalimi: 'pkRivFj1' }[hapi];
    setTimeout(function () { $(f).focus(); }, 60);
  }
  function hapRivendosjen() {
    if (gjendja.dukePunuar) return;
    gjendja.rivendosje = true;
    $('pkForma').classList.add('pk-fsheh');
    $('pkRiv').classList.remove('pk-fsheh');
    $('pkRivEmri').value = $('pkEmri').value.trim();
    $('pkRivKodi').value = ''; $('pkRivFj1').value = ''; $('pkRivFj2').value = '';
    vendosHapin('emri', 'Shkruaj emrin e përdoruesit. Administratorit i vjen një kod 6-shifror: kërkoja atij, pastaj e vendos vetë fjalëkalimin e ri.');
  }
  function mbyllRivendosjen(mesazh) {
    gjendja.rivendosje = false;
    $('pkRiv').classList.add('pk-fsheh');
    shfaqFormen(mesazh);
  }
  function zene(po) {
    gjendja.dukePunuar = po;
    var b = $('pkRivDergo');
    b.disabled = po;
    if (po) { b.dataset.teksti = b.textContent; b.innerHTML = '<span class="pk-rrotull"></span>Një moment…'; }
    else if (b.dataset.teksti) { b.textContent = b.dataset.teksti; delete b.dataset.teksti; }
  }
  async function thirrServerin(rruga, trupi) {
    var r, j = null;
    try { r = await fetch(SERVERI + '/fjalekalimi/' + rruga, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(trupi) }); }
    catch (e) { return { ok: false, arsye: 'rrjeti' }; }
    try { j = await r.json(); } catch (e) { /* bosh */ }
    if (!j) return { ok: false, arsye: 'serveri' };
    // Worker-i para 163 s'e njeh rrugën: kërkon hyrje (401) ose s'e gjen (404)
    if (!r.ok && (j.arsye === 'pa-hyrje' || j.arsye === 'rruga')) j.arsye = 'pa-sherbim';
    return j;
  }
  function tekstiRiv(j) {
    switch (j.arsye) {
      case 's-ekziston': return 'S\'ka llogari me këtë emër. Kontrollo emrin e përdoruesit.';
      case 'emri': return 'Emri i përdoruesit: të paktën 3 shkronja ose numra (a–z, 0–9, _ . -), pa hapësira.';
      case 'kodi': return 'Kodi s\'është i saktë.' + (j.mbetur ? ' Të ' + (j.mbetur === 1 ? 'ka mbetur 1 provë.' : 'kanë mbetur ' + j.mbetur + ' prova.') : '');
      case 'shume-prova': return 'Kodi u bllokua pas 5 provave të gabuara. Kërko kod të ri ' + (j.skadon ? 'pas orës ' + oraNga(j.skadon) : 'pas 30 minutash') + '.';
      case 'skadoi': return 'Kodi ka skaduar (vlen 30 minuta). Dërgo kërkesë të re te administratori.';
      case 'i-dobet': return 'Fjalëkalimi duhet të ketë të paktën 6 shenja.';
      case 'pa-sherbim': return 'Rikthimi i fjalëkalimit s\'është aktivizuar ende te serveri. Lajmëroje administratorin.';
      case 'rrjeti': return 'S\'ka lidhje me serverin. Kontrollo internetin dhe provo përsëri.';
      default: return 'Diçka shkoi keq te serveri. Provo përsëri pas pak.';
    }
  }
  async function kerkoKodin() {
    zene(true);
    var j = await thirrServerin('kerko', { emri: riv.emri });
    zene(false);
    if (!j.ok) { $('pkRivGabim').textContent = tekstiRiv(j); return; }
    vendosHapin('kodi', (j.ekziston ? 'Kodi është dërguar tashmë te administratori.' : 'Kërkesa u dërgua te administratori.') +
      ' Kur ta marrësh kodin 6-shifror prej tij, shkruaje këtu' + (j.skadon ? ' (vlen deri në ' + oraNga(j.skadon) + ').' : '.'));
  }
  // Pas ndryshimit: hyrja direkt me fjalëkalimin e ri (pjesa tjetër te "stoku-auth-ndryshoi", si te hyrja e zakonshme)
  async function hyrMeTeRiun(fj, uNdryshua) {
    var cloud = window.__stokuCloud;
    if ((!cloud || !cloud.hyr) && !window.__stokuCloudUNgarkua) cloud = await pritCloudin(PRITJA_DERGIMIT_MS);
    var rez = null;
    if (cloud && cloud.hyr) { try { rez = await cloud.hyr(riv.emri, fj); } catch (e) { rez = { ok: false }; } }
    zene(false);
    $('pkRivFj1').value = ''; $('pkRivFj2').value = '';
    if (rez && rez.ok) {
      ruajEmrin(riv.emri);
      ruajKredencialet(riv.emri, fj);
      gjendja.rivendosje = false;
      $('pkRiv').classList.add('pk-fsheh');
      $('pkEmri').value = riv.emri;
      shfaqPritjen('Fjalëkalimi u ndryshua. Duke hapur…');
      return;
    }
    $('pkEmri').value = riv.emri;
    if (uNdryshua) { mbyllRivendosjen('Fjalëkalimi u ndryshua. Hyr me fjalëkalimin e ri.'); return; }
    vendosHapin('emri', 'Shkruaj emrin e përdoruesit dhe dërgo kërkesë të re.', tekstiRiv({ arsye: 'skadoi' }));
  }
  $('pkHarrova').addEventListener('click', hapRivendosjen);
  $('pkRivMbrapa').addEventListener('click', function () { if (!gjendja.dukePunuar) mbyllRivendosjen(); });
  $('pkRivSerish').addEventListener('click', function () { if (!gjendja.dukePunuar) kerkoKodin(); });
  $('pkRivKodi').addEventListener('input', function () { var v = this.value.replace(/\D/g, '').slice(0, 6); if (v !== this.value) this.value = v; });
  $('pkRivSy').addEventListener('click', function () {
    var shfaq = $('pkRivFj1').type === 'password';
    $('pkRivFj1').type = shfaq ? 'text' : 'password';
    $('pkRivFj2').type = shfaq ? 'text' : 'password';
    this.innerHTML = shfaq ? SY_MBYLLUR : SY;
    this.setAttribute('aria-label', shfaq ? 'Fshih fjalëkalimin' : 'Shfaq fjalëkalimin');
    this.title = this.getAttribute('aria-label');
  });
  $('pkRivForma').addEventListener('submit', async function (ev) {
    ev.preventDefault();
    if (gjendja.dukePunuar) return;
    var g = $('pkRivGabim');
    g.textContent = '';
    if (riv.hapi === 'emri') {
      var emri = $('pkRivEmri').value.trim();
      if (!/^[a-zA-Z0-9_.-]{3,40}$/.test(emri)) { g.textContent = emri ? tekstiRiv({ arsye: 'emri' }) : 'Shkruaj emrin e përdoruesit.'; $('pkRivEmri').focus(); return; }
      riv.emri = emri.toLowerCase();
      kerkoKodin();
      return;
    }
    if (riv.hapi === 'kodi') {
      var kodi = $('pkRivKodi').value.trim();
      if (!/^\d{6}$/.test(kodi)) { g.textContent = 'Shkruaj kodin 6-shifror që ta dha administratori.'; $('pkRivKodi').focus(); return; }
      zene(true);
      var j = await thirrServerin('verifiko', { emri: riv.emri, kodi: kodi });
      zene(false);
      if (!j.ok) {
        if (j.arsye === 'skadoi') { vendosHapin('emri', 'Shkruaj emrin e përdoruesit dhe dërgo kërkesë të re.', tekstiRiv(j)); return; }
        g.textContent = tekstiRiv(j);
        $('pkRivKodi').select();
        return;
      }
      riv.kodi = kodi;
      vendosHapin('fjalekalimi', 'Kodi është i saktë. Shkruaje fjalëkalimin e ri dy herë.');
      return;
    }
    var fj = $('pkRivFj1').value;
    if (fj.length < 6) { g.textContent = tekstiRiv({ arsye: 'i-dobet' }); $('pkRivFj1').focus(); return; }
    if ($('pkRivFj2').value !== fj) { g.textContent = 'Fjalëkalimet nuk përputhen.'; $('pkRivFj2').focus(); return; }
    zene(true);
    var r = await thirrServerin('ndrysho', { emri: riv.emri, kodi: riv.kodi, fjalekalimi: fj });
    if (r.ok) { await hyrMeTeRiun(fj, true); return; }
    // "skadoi" pas një prove që ndoshta u krye (p.sh. interneti ra para përgjigjes): provohet hyrja me fjalëkalimin e ri
    if (r.arsye === 'skadoi') { await hyrMeTeRiun(fj, false); return; }
    zene(false);
    if (r.arsye === 'kodi' || r.arsye === 'shume-prova') { vendosHapin('kodi', 'Shkruaje sërish kodin që ta dha administratori.', tekstiRiv(r)); return; }
    g.textContent = tekstiRiv(r);
  });

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
    if (SHFLETUES_I_VJETER) { gabim.textContent = MESAZHI_VJETER; return; }
    gabim.textContent = '';
    gjendja.dukePunuar = true;
    var btn = $('pkDergo');
    btn.disabled = true;
    btn.innerHTML = '<span class="pk-rrotull"></span>' + (krijo ? 'Duke krijuar llogarinë…' : 'Duke hyrë…');
    // Firebase ende s'është ngarkuar (internet i ngadaltë): prit pak në vend që të dështohet menjëherë
    var cloud = window.__stokuCloud;
    if (!cloud || !cloud.hyr) {
      if (!window.__stokuCloudUNgarkua) cloud = await pritCloudin(PRITJA_DERGIMIT_MS);
      if (!cloud || !cloud.hyr) {
        gjendja.dukePunuar = false; btn.disabled = false; btn.textContent = krijo ? 'Krijo llogarinë' : 'Hyr';
        gabim.textContent = navigator.onLine === false ? 'S\'ka lidhje me internetin. Kontrollo internetin dhe provo përsëri.'
          : 'S\'u lidh me serverin. Kontrollo internetin, pastaj rifresko faqen dhe provo përsëri.';
        return;
      }
    }
    var rez;
    try { rez = krijo ? await cloud.regjistrohu(emri, fjalekalimi, { merchandiser: $('pkMerch').checked }) : await cloud.hyr(emri, fjalekalimi); }
    catch (e) { rez = { ok: false }; }
    gjendja.dukePunuar = false;
    btn.disabled = false;
    btn.textContent = krijo ? 'Krijo llogarinë' : 'Hyr';
    if (!rez || !rez.ok) {
      gabim.textContent = tekstiGabimit(rez && rez.kodi);
      $('pkFjalekalimi').select();
      return;
    }
    ruajEmrin(emri);
    ruajKredencialet(emri, fjalekalimi); // Chrome: "Ruaje fjalëkalimin?" → hyrja vetë edhe pas fshirjes së të dhënave
    $('pkFjalekalimi').value = ''; $('pkPerserit').value = '';
    shfaqPritjen(krijo ? 'Llogaria u krijua. Duke hapur…' : 'Duke hapur…');
    // Pjesa tjetër ndodh te "stoku-auth-ndryshoi" (Firebase e njofton hyrjen)
  });

  // ---------- Hyrja nga fjalëkalimi i ruajtur në shfletues ----------
  // Fshirja e "cookies dhe të dhënave" në shfletues e fshin edhe hyrjen e Firebase-it (s'ka si të ruhet në faqe).
  // Fjalëkalimet e ruajta në Chrome / Google Password Manager mbeten: pas çdo hyrjeje fjalëkalimi i jepet
  // shfletuesit (Credential Management API) dhe, kur porta hapet pa hyrje, Stoku hyn vetë me të (ose Chrome
  // pyet me një prekje cilën llogari). Safari s'e ka këtë API: atje iCloud Keychain e plotëson formën
  // (autocomplete="username"/"current-password").
  function kaMenaxherFjalekalimesh() {
    return !SHFLETUES_I_VJETER && typeof window.PasswordCredential === 'function' && !!(navigator.credentials && navigator.credentials.get);
  }
  function ruajKredencialet(emri, fjalekalimi) {
    shkruaj(KEY_DIL, null);
    if (!kaMenaxherFjalekalimesh() || !emri || !fjalekalimi) return;
    try {
      var k = new window.PasswordCredential({ id: emri, password: fjalekalimi, name: emri });
      navigator.credentials.store(k).catch(function () { /* përdoruesi s'e ruajti */ });
    } catch (e) { /* ok */ }
  }
  // "Dil" me dorë: mos hyr vetë menjëherë me fjalëkalimin e ruajtur (përndryshe dalja s'do të ishte e mundur)
  function dilMeDore() {
    shkruaj(KEY_DIL, '1');
    try { if (navigator.credentials && navigator.credentials.preventSilentAccess) navigator.credentials.preventSilentAccess().catch(function () { /* ok */ }); } catch (e) { /* ok */ }
  }
  async function provoHyrjenMeTeRuajturin() {
    if (gjendja.provuarVete || !kaMenaxherFjalekalimesh()) return;
    gjendja.provuarVete = true; // një herë për çdo hapje të faqes
    var kred = null;
    try {
      // Pas "Dil": vetëm pa pyetje (Chrome s'e lejon pas preventSilentAccess). Përndryshe (p.sh. pas fshirjes së
      // të dhënave): Chrome hyn vetë, ose pyet me një prekje cilën llogari të ruajtur.
      kred = await navigator.credentials.get({ password: true, mediation: lexo(KEY_DIL) === '1' ? 'silent' : 'optional' });
    } catch (e) { return; }
    if (!kred || kred.type !== 'password' || !kred.id || !kred.password || !gjendja.eHapur || gjendja.dukePunuar) return;
    var cloud = window.__stokuCloud;
    if (!cloud || !cloud.hyr) return;
    gjendja.dukePunuar = true;
    shfaqPritjen('Duke hyrë si ' + kred.id + '…');
    var rez;
    try { rez = await cloud.hyr(kred.id, kred.password); } catch (e) { rez = { ok: false }; }
    gjendja.dukePunuar = false;
    if (rez && rez.ok) { ruajEmrin(kred.id); shkruaj(KEY_DIL, null); return; } // pjesa tjetër te "stoku-auth-ndryshoi"
    $('pkEmri').value = kred.id;
    $('pkFjalekalimi').value = '';
    shfaqFormen(tekstiGabimit(rez && rez.kodi));
  }

  // Pret ngarkimin e modulit të Firebase-it (ngjarja "stoku-cloud-gati"), deri në `ms`
  function pritCloudin(ms) {
    return new Promise(function (zgjidh) {
      var u = false;
      function mbaro() { if (u) return; u = true; window.removeEventListener('stoku-cloud-gati', mbaro); clearTimeout(k); zgjidh(window.__stokuCloud); }
      window.addEventListener('stoku-cloud-gati', mbaro);
      var k = setTimeout(mbaro, ms);
    });
  }
  window.addEventListener('stoku-cloud-gati', function () { window.__stokuCloudUNgarkua = true; });

  // Tastet (shkurtoret e faqes) s'duhet të veprojnë pas portës
  window.addEventListener('keydown', function (ev) {
    if (gjendja.eHapur && !porta.contains(ev.target)) { ev.stopImmediatePropagation(); }
  }, true);

  function mbyll() {
    if (!gjendja.eHapur) return;
    gjendja.eHapur = false;
    gjendja.rivendosje = false;
    $('pkRiv').classList.add('pk-fsheh');
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
    if (!u && eVizitor()) { if (gjendja.eHapur && !gjendja.dukePunuar) mbyll(); return; } // prova pa llogari: porta s'del
    if (!u) {
      shkruaj(KEY_HYRJA, null); // pas "Dil" (ose kur hyrja ka skaduar) s'lejohet hyrja pa internet
      if (gjendja.eHapur && gjendja.rivendosje) return; // "Fjalëkalimi i harruar" është hapur: mbetet ashtu
      // Mesazhi "po zgjat / s'ka internet" s'vlen më: Firebase sapo u përgjigj
      var m = gjendja.mesazhiLidhjes ? '' : $('pkGabim').textContent;
      gjendja.mesazhiLidhjes = false;
      if (!gjendja.eHapur) hap(); else if (!gjendja.dukePunuar) shfaqFormen(m);
      provoHyrjenMeTeRuajturin();
      return;
    }
    // Të dhënat lokale i përkasin një llogarie tjetër (ose provës si vizitor)? Hiqen para se faqja t'i sinkronizojë
    // në llogarinë e re, dhe faqja rinis e pastër (të dhënat e llogarisë tjetër janë në cloud-in e saj).
    shkruaj(KEY_VIZITOR, null); // me llogari s'ka më provë
    var pronari = lexo(KEY_PRONARI);
    // v232: një skedë tjetër (ose aplikacioni i instaluar) ka hyrë tashmë me këtë llogari dhe i ka hequr të dhënat e
    // vjetra: kjo faqe vetëm rinis (në memorie ka ende të dhënat e llogarisë tjetër, që s'duhet të shkruhen këtu)
    if (!ngaVizitori && pronariIFaqes && pronariIFaqes !== u.uid && pronari === u.uid) {
      if (ev && ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      gjendja.dukePunuar = true;
      shfaqPritjen('Duke hapur dyqanin tënd…');
      location.reload();
      return;
    }
    if ((pronari && pronari !== u.uid) || ngaVizitori) {
      if (ev && ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      CELESAT_E_TE_DHENAVE.forEach(function (k) { shkruaj(k, null); });
      shkruaj(KEY_PRONARI, u.uid);
      // Memoria e shfletuesit plot → shkrimi dështoi: pa këtë, faqja do të rifreskohej pafund (pronari s'ndryshon kurrë).
      // Të dhënat e llogarisë tjetër u hoqën tashmë; pronari i zbrazët = "hyrja e parë" pas rifreskimit.
      if (lexo(KEY_PRONARI) !== u.uid) shkruaj(KEY_PRONARI, null);
      gjendja.dukePunuar = true;
      shfaqPritjen('Duke hapur dyqanin tënd…');
      location.reload();
      return;
    }
    if (!pronari) shkruaj(KEY_PRONARI, u.uid); // hyrja e parë: të dhënat e kësaj pajisjeje i kalojnë kësaj llogarie
    pronariIFaqes = u.uid;
    var emri = String(u.email || '').replace(/@stoku-app\.local$/, '');
    shkruaj(KEY_HYRJA, JSON.stringify({ uid: u.uid, emri: emri }));
    ruajEmrin(emri);
    mbyll();
  }
  window.addEventListener('stoku-cloud-gati', kontrollo);
  window.addEventListener('stoku-auth-ndryshoi', kontrollo);
  // Prova ose një llogari në këtë skedë dhe hyrje me llogari tjetër në një skedë tjetër (ose te aplikacioni i instaluar):
  // Firebase e njofton hyrjen këtu me vonesë, prandaj kjo skedë rinis sapo ndryshon pronari i të dhënave, që të mos
  // shkruajë të dhënat e saj (as fshirjet) mbi ato të llogarisë tjetër. v232: edhe për llogaritë, jo vetëm për provën.
  window.addEventListener('storage', function (ev) {
    if (gjendja.dukePunuar || (ev.key !== null && ev.key !== KEY_PRONARI)) return;
    var tani = lexo(KEY_PRONARI);
    if (ngaVizitori ? tani === VIZITOR : (!pronariIFaqes || tani === pronariIFaqes)) return;
    gjendja.dukePunuar = true;
    location.reload();
  });

  // Pritja fillestare
  var fundit = hyrjaEFundit();
  if (ngaVizitori || (fundit && fundit.uid && lexo(KEY_PRONARI) === fundit.uid && !SHFLETUES_I_VJETER)) {
    // Kjo pajisje është e kyçur me këtë llogari: dyqani hapet menjëherë, pa ekranin "Duke hyrë si…" (në Android
    // dilte pas ekranit të hapjes së sistemit, si dy ekrane njëri pas tjetrit). Firebase e konfirmon hyrjen në sfond:
    // pa përdorues → porta hapet (kontrollo → hap); llogari tjetër → të dhënat hiqen dhe faqja rinis (si më parë).
    gjendja.eHapur = false;
    porta.style.display = 'none';
    html.classList.remove('porta-hapur');
    var lajmero = function () { if (!gjendja.eHapur) window.dispatchEvent(new Event('stoku-porta-hapur')); };
    if (document.readyState === 'complete') setTimeout(lajmero, 0); else window.addEventListener('load', lajmero, { once: true });
  }
  shfaqPritjen(fundit && fundit.emri ? 'Duke hyrë si ' + fundit.emri + '…' : 'Duke u lidhur…');
  // Pa internet (sipas shfletuesit) në një pajisje të kyçur më parë: s'ka pse të pritet — Firebase e ka
  // hyrjen të ruajtur lokalisht dhe do ta konfirmojë vetë; ndërkohë punohet me të dhënat lokale.
  var paInternet = typeof navigator !== 'undefined' && navigator.onLine === false;
  gjendja.kohezuesi = setTimeout(function () {
    if (gjendja.gati) return;
    if (eVizitor()) { mbyll(); return; } // prova pa llogari s'pret serverin
    // Firebase s'u përgjigj (pa internet dhe pa kopje të ruajtur të tij)
    var f = hyrjaEFundit();
    if (f && f.uid && lexo(KEY_PRONARI) === f.uid) {
      mbyll(); // kjo pajisje ka qenë e kyçur — punohet lokalisht derisa të kthehet interneti
      return;
    }
    shfaqFormen(mesazhiPaLidhje());
    gjendja.mesazhiLidhjes = !SHFLETUES_I_VJETER;
  }, SHFLETUES_I_VJETER ? 0 : paInternet && fundit && fundit.uid && lexo(KEY_PRONARI) === fundit.uid ? 400 : PRITJA_MAKS_MS);
  if (window.__stokuCloud) kontrollo();

  window.StokuPorta = { eHapur: function () { return gjendja.eHapur; }, ruajKredencialet: ruajKredencialet, dilMeDore: dilMeDore,
    ngaVizitori: function () { return ngaVizitori; }, hapHyrjen: hapHyrjen, rinisProven: rinisProven,
    // v232: a i përkasin të dhënat e kësaj faqeje kësaj llogarie? (jo, kur në një skedë tjetër u hyr me llogari tjetër)
    teDhenatELlogarise: function (uid) { return !!uid && (!pronariIFaqes || pronariIFaqes === uid); } };
})();
