// v238: u nxor nga index.html (CSP pa 'unsafe-inline': faqet s'kanë më skripta të brendshme). Kur ndryshon, rrite ?v= te index.html dhe sw.js.
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  // ================= Fjalori (tekstet, vetëm shqip) =================
  var FJALORI = {
      opsionet: 'Cilësimet',
      mbyll: 'Mbyll',
      anulo: 'Anulo',
      ruaj: 'Ruaj',
      fshij: 'Fshi',
      krijo: 'Krijo',
      vazhdo: 'Vazhdo',
      aktivizo: 'Aktivizo',
      rikthe: 'Rikthe',
      foldera: 'Foldera',

      krijoFolder: '+ Krijo folder',
      folderIRi: 'Folder i ri',
      emriIFolderit: 'Emri',
      shkruajEmrinFolderit: 'Shkruaj emrin e folderit.',
      teFshihetFolderi: 'Të fshihet folderi?',
      folderiBoshTekst: function (a) { return 'Do të fshihet folderi "' + a.emri + '". Është bosh.'; },
      folderiMePrTekst: function (a) {
        var njesi = a.n === 1 ? 'produktin' : 'produktet';
        return 'Do të fshihet folderi "' + a.emri + '" bashkë me ' + a.n + ' ' + njesi + ' brenda tij.\n\nKy veprim NUK mund të kthehet.';
      },
      njesiaProdukteve: function (a) { return a.n + ' ' + (a.n === 1 ? 'produkt' : 'produkte'); },
      zvogeloSasine: 'Zvogëlo sasinë',
      rritSasine: 'Rrit sasinë',

      barkodiNormal: 'Barkodi',
      barkodiPda: 'Barkodi',
      skanoKamer: 'Skano me kamerë',
      eksportoExcel: 'Eksporto në Excel',
      eksportoPdf: 'Eksporto në PDF',
      kerkoLabel: 'Kërko',
      kerkoGlobalLabel: 'Kërko produkt ose barkod',
      kerkoGlobalNukUGjet: 'Nuk u gjet asnjë produkt në asnjë folder.',
      fshijTeGjitha: 'Fshi të gjitha produktet',
      nukUGjetAsnjeProdukt: 'Nuk u gjet asnjë produkt.',
      shfaqenNga: function (a) {
        return 'Shfaqen ' + a.limit + ' nga ' + a.gjithsej + ' produkte. Përdor kërkimin për të gjetur të tjerët.';
      },
      paEmerListe: '(pa emër)',

      produktIRi: 'Produkt i ri',
      produktIRiPaEmer: 'Produkt i ri (pa emër)',
      produktiEkziston: function (a) { return 'Produkti ekziston (tani: ' + a.sasia + ')'; },
      barkodiEtiketa: function (a) { return 'Barkodi: ' + a.barkodi; },
      emriEtiketa: function (a) { return 'Emri: ' + a.emri; },
      emriIProduktit: 'Emri',
      furnizuesiOpsional: 'Furnizuesi (opsional)',
      sasia: 'Sasia',
      sasiaPerTuShtuar: 'Sasia',
      zhvendosNeFolder: 'Zhvendos në folder tjetër ›',
      zhvendosTitulli: 'Zhvendos produktin',
      zhvendosHint: function (a) { return 'Zgjidh folderin ku do të zhvendoset "' + a.emri + '".'; },
      zhvendosAsnjeFolder: 'Nuk ka asnjë folder tjetër ku ta zhvendosësh.',
      zhvendosUKry: function (a) { return 'U zhvendos te "' + a.folder + '".'; },
      zhvendosUBashkua: function (a) {
        return 'U zhvendos te "' + a.folder + '". Aty ekzistonte tashmë, ndaj sasitë u bashkuan (tani: ' + a.sasia + ').';
      },
      shkruajEmrin: 'Shkruaj emrin e produktit.',
      shkruajSasine: 'Shkruaj sasinë (numër i plotë).',

      teFshihenTeGjitha: 'Të fshihen të gjitha?',
      fshirjaTekst: function (a) {
        if (a.n === 1) {
          return 'Do të fshihet 1 produkt nga folderi "' + a.folder + '". Ky veprim NUK mund të kthehet.\n\n' +
            'Nëse do një kopje, shtyp Anulo dhe eksporto fillimisht në Excel.';
        }
        return 'Do të fshihen të gjitha ' + a.n + ' produktet nga folderi "' + a.folder + '". Ky veprim NUK mund të kthehet.\n\n' +
          'Nëse do një kopje, shtyp Anulo dhe eksporto fillimisht në Excel.';
      },
      fshiKrejt: 'Fshi të gjitha',
      uFshinePrejFolderit: 'U fshinë të gjitha produktet nga folderi.',

      opsioneTitulli: 'Cilësimet',
      tabPamja: 'Pamja',
      tabSkenimi: 'Skenimi',
      tabLista: 'Stoku',
      tabLlogaria: 'Llogaria',

      cloudHint: 'Lista ruhet në internet dhe sinkronizohet vetë në krejt pajisjet e llogarisë (telefon, PDA, kompjuter), ' +
        'që të mos humbet nëse fshihet aplikacioni ose ndërrohet telefoni.',
      lblCloudUsername: 'Përdoruesi',
      lblCloudFjalekalimi: 'Fjalëkalimi',
      cloudKrijoLlogariBtn: 'Krijo llogari',
      cloudHyrBtn: 'Hyr',
      cloudDilBtn: 'Dil nga llogaria',
      cloudSinkronizoTaniBtn: 'Sinkronizo tani',
      cloudRiktheTaniBtn: 'Rikthe nga cloud',
      cloudHyrePerTeksti: function (a) { return a.emri; },
      cloudStatusiAsgje: 'Ende s\'është sinkronizuar.',
      cloudStatusiDukeSink: 'Duke sinkronizuar…',
      cloudStatusiUSink: function (a) { return 'U sinkronizua ' + a.kur + '.'; },
      cloudStatusiDeshtoi: 'Sinkronizimi dështoi. Kontrollo internetin.',
      cloudStatusiDukeRikthyer: 'Duke rikthyer nga cloud…',
      cloudTeRiktheteCloud: 'Të rikthehen të dhënat nga cloud?',
      cloudRiktheTekst: function (a) {
        return (a.aktual === 1 ? 'Do të zëvendësohet produkti aktual' : 'Do të zëvendësohen të gjitha ' + a.aktual + ' produktet aktuale') + ' me ato të ruajtura në cloud ' +
          'për këtë llogari.\n\nKy veprim nuk kthehet.';
      },
      cloudNukKaAsgje: 'S\'ka asnjë të dhënë të ruajtur në cloud për këtë llogari.',
      cloudURikthye: 'U rikthye nga cloud.',
      cloudURikthyeAutomatikisht: 'U rikthyen të dhënat e ruajtura më parë në cloud.',
      cloudPlotesoFushat: 'Plotëso emrin e përdoruesit dhe fjalëkalimin.',
      cloudEmriIShkurter: 'Emri i përdoruesit duhet të ketë të paktën 3 shkronja/numra (a–z, 0–9, _ . -).',
      cloudFjalekalimiIShkurter: 'Fjalëkalimi duhet të ketë të paktën 6 shkronja/numra.',
      cloudLlogariaEkziston: 'Ky emër përdoruesi është zënë tashmë. Provo një tjetër.',
      cloudHyrjeGabim: 'Emri i përdoruesit ose fjalëkalimi është gabim.',
      cloudGabimPergjithshem: 'Diçka shkoi keq. Kontrollo internetin dhe provo përsëri.',
      cloudLlogariaUKrijua: 'Llogaria u krijua dhe u sinkronizua.',
      cloudHyrjaUKry: 'Hyrje e suksesshme.',
      cloudTeDilet: 'Të dilet nga llogaria?',
      cloudDilTekst: 'Të dhënat mbeten të ruajtura në llogari (cloud). Pas daljes, aplikacioni kërkon përsëri ' +
        'emrin e përdoruesit dhe fjalëkalimin.',
      lblCloudEmriRi: 'Emri i ri',
      lblCloudFjalekalimiRi: 'Fjalëkalimi i ri',
      cloudNdryshoEmrinBtn: 'Ndrysho',
      cloudNdryshoFjalekaliminBtn: 'Ndrysho',
      cloudPlotesoEmrinRi: 'Shkruaj emrin e ri të përdoruesit.',
      cloudPlotesoFjalekalimin: 'Shkruaj fjalëkalimin e ri.',
      cloudEmriURiNdryshuar: 'Emri i përdoruesit u ndryshua.',
      cloudFjalekalimiURiNdryshuar: 'Fjalëkalimi u ndryshua.',
      cloudDuhetRihyrje: 'Për siguri, duhet të dalësh dhe të hysh përsëri para se ta ndryshosh këtë.',
      riautHintTeksti: 'Për siguri, konfirmo fjalëkalimin aktual për ta vazhduar ndryshimin.',
      lblCloudFjalekalimiAktual: 'Fjalëkalimi aktual',
      btnRiautentifikoBtn: 'Konfirmo dhe vazhdo',
      riautGabim: 'Fjalëkalimi aktual s\'është i saktë.',
      cloudDuhetKonfigurim: 'Ndryshimi i emrit s\'lejohet nga cilësimet e Firebase-it (Email enumeration protection). ' +
        'Fike atë opsion te Firebase console → Authentication → Settings → User actions, dhe provo prapë.',

      automatike: 'Automatike',
      eCelet: 'E çelët',
      eErret: 'E errët',
      titTemaTeksti: 'Tema',
      tabNjoftimet: 'Njoftimet',
      tabOra: 'Ora e dorës',
      tabPerdoruesit: 'Përdoruesit',
      automatikeHint: '"Automatike" ndjek cilësimin e telefonit.',
      titMadhesiaTeksti: 'Madhësia e shkronjave',
      madhesiaNormaleBtn: 'Normale',
      madhesiaEMadheBtn: 'E madhe',
      madhesiaHintTeksti: 'Rrit pak madhësinë e gjithë tekstit dhe butonave, për lexueshmëri më të lehtë.',

      pdaLabel: 'Ky është PDA (skaner i brendshëm)',
      fshihTastieren: 'Fshih tastierën',
      shfaqTastieren: 'Shfaq tastierën',
      tastieraLabel: 'Fshih tastierën në ekran',
      tastieraHint: 'Tastiera e Android-it s\'del më te Stoku: shkruan me tastierën e PDA-së dhe me skanerin. Vlen vetëm kur është ndezur PDA.',
      tastieraUFsheh: 'Tastiera në ekran s\'del më. Shkruaj me tastierën e PDA-së.',
      tastieraDelPerseri: 'Tastiera në ekran del përsëri.',
      pdaStatusNdezur: 'PDA i ndezur',
      pdaStatusFikur: 'PDA i fikur',
      cloudStatusJoKycur: 'Jo i kyçur',
      pdaHint: 'Kur është ndezur: ekrani kyçet në portret (pa u rrotulluar anash ose përmbys), fshihet butoni i kamerës dhe kursori qëndron te fusha e barkodit.',
      paEmerLabel: 'Skano vetëm barkodin dhe sasinë (pa emër)',
      paEmerHint: 'Nuk rekomandohet. Produktet e reja regjistrohen pa emër dhe fusha e emrit fshihet.',
      paEmerKonfTitulli: 'Të regjistrohen produktet pa emër?',
      paEmerKonfTekst: 'Nuk rekomandohet të regjistrohen produktet pa emër. Në listë dhe në Excel do të shihet vetëm ' +
        'barkodi, kështu që është më e vështirë të gjesh, të kontrollosh ose të njohësh një produkt më vonë, sidomos ' +
        'nëse ndonjë barkod është skenuar gabim.\n\nProdukteve që kanë tashmë emër nuk u fshihet emri.\n\n' +
        'Nëse je i sigurt, prit 5 sekonda dhe shtyp "Aktivizo".',
      tingullLabel: 'Tingulli kur skanon me kamerë',
      scannerLabel: 'Kursori te fusha e barkodit',
      qrRefuzuar: 'Ke skenuar një kod QR. Skano barkodin e produktit.',
      qrDyshim: 'Kjo nuk duket si barkod produkti (ngjan me kod QR ose tekst). Provo përsëri.',

      kameraNukUHap: 'Kamera nuk u hap.',
      kameraNukUHapLeje: 'Kamera nuk u hap. Lejo kamerën për Stoku-n te Cilësimet e telefonit.',
      kameraNukEshteGati: 'Kamera nuk është gati. Lidhu me internet dhe hape prapë aplikacionin.',
      kameraDrejtoje: 'Drejtoje kamerën te barkodi',
      kameraHint: 'Vendos vetëm një barkod brenda kutisë',

      renditSipas: 'Rendit sipas',
      emriAZ: 'Emri (A–Z)',
      emriZAOpt: 'Emri (Z–A)',
      sasiaUletOpt: 'Sasia: nga më e vogla',
      sasiaLartOpt: 'Sasia: nga më e madhja',
      iRiOpt: 'Më të rejat së pari',

      ruajtjaDeshtoi: 'Ruajtja dështoi: memoria e shfletuesit është plot.',
      nukKaProdukteEksport: 'Nuk ka produkte për eksport në këtë folder.',

      pdfDukeKrijuar: 'Duke krijuar…',
      pdfNukGati: 'PDF-ja nuk është gati. Lidhu me internet dhe hape prapë aplikacionin.',
      pdfDeshtoi: 'PDF-ja nuk u krijua. Provo përsëri.'
  };

  // v215: numri me emrin në njëjës ose shumës ("1 afat", "3 afate")
  function nrEmer(n, nje, shume) { return n + ' ' + (n === 1 ? nje : shume); }

  function T(kyc, args) {
    var v = (kyc in FJALORI) ? FJALORI[kyc] : kyc;
    return (typeof v === 'function') ? v(args || {}) : v;
  }

  // Elementet me tekst statik: { id, prop: 'text' | 'placeholder' | 'title' | 'titleAria', kyc }
  var STATIKE = [
    { id: 'btnKrijoFolder', prop: 'text', kyc: 'krijoFolder' },
    { id: 'btnKamera', prop: 'text', kyc: 'skanoKamer' },
    { id: 'btnEksport', prop: 'text', kyc: 'eksportoExcel' },
    { id: 'btnEksportPdf', prop: 'text', kyc: 'eksportoPdf' },
    { id: 'kerko', prop: 'placeholder', kyc: 'kerkoLabel' },
    { id: 'kerkoGlobal', prop: 'placeholder', kyc: 'kerkoGlobalLabel' },
    { id: 'btnFshiTeGjitha', prop: 'text', kyc: 'fshijTeGjitha' },

    { id: 'dlgEmri', prop: 'placeholder', kyc: 'emriIProduktit' },
    { id: 'dlgFurnizuesi', prop: 'placeholder', kyc: 'furnizuesiOpsional' },
    { id: 'dlgFshij', prop: 'text', kyc: 'fshij' },
    { id: 'dlgAnulo', prop: 'text', kyc: 'anulo' },
    { id: 'dlgRuaj', prop: 'text', kyc: 'ruaj' },
    { id: 'dlgZhvendosBtn', prop: 'text', kyc: 'zhvendosNeFolder' },
    { id: 'zhvendosTitulli', prop: 'text', kyc: 'zhvendosTitulli' },
    { id: 'zhvendosAnulo', prop: 'text', kyc: 'anulo' },

    { id: 'fshiAnulo', prop: 'text', kyc: 'anulo' },
    { id: 'folderIRiTitulli', prop: 'text', kyc: 'folderIRi' },
    { id: 'dlgFolderEmri', prop: 'placeholder', kyc: 'emriIFolderit' },
    { id: 'dlgFolderAnulo', prop: 'text', kyc: 'anulo' },
    { id: 'dlgFolderRuaj', prop: 'text', kyc: 'krijo' },

    { id: 'opsioneTitulli', prop: 'text', kyc: 'opsioneTitulli' },
    { id: 'tabCilesimetTxt', prop: 'text', kyc: 'opsionet' },
    { id: 'btnOpsione', prop: 'title', kyc: 'opsionet' },
    { id: 'tabPamjaTxt', prop: 'text', kyc: 'tabPamja' },
    { id: 'tabSkenimiTxt', prop: 'text', kyc: 'tabSkenimi' },
    { id: 'tabListaTxt', prop: 'text', kyc: 'tabLista' },
    { id: 'tabLlogariaTxt', prop: 'text', kyc: 'tabLlogaria' },
    { id: 'titPamja', prop: 'text', kyc: 'titTemaTeksti' },
    { id: 'temaAuto', prop: 'text', kyc: 'automatike' },
    { id: 'temaLight', prop: 'text', kyc: 'eCelet' },
    { id: 'temaDark', prop: 'text', kyc: 'eErret' },
    { id: 'temaHint', prop: 'text', kyc: 'automatikeHint' },
    { id: 'titMadhesia', prop: 'text', kyc: 'titMadhesiaTeksti' },
    { id: 'madhesiaNormale', prop: 'text', kyc: 'madhesiaNormaleBtn' },
    { id: 'madhesiaEMadhe', prop: 'text', kyc: 'madhesiaEMadheBtn' },
    { id: 'madhesiaHint', prop: 'text', kyc: 'madhesiaHintTeksti' },

    { id: 'lblOpsPda', prop: 'text', kyc: 'pdaLabel' },
    { id: 'pdaHint', prop: 'text', kyc: 'pdaHint' },
    { id: 'lblOpsTastiera', prop: 'text', kyc: 'tastieraLabel' },
    { id: 'tastieraHint', prop: 'text', kyc: 'tastieraHint' },
    { id: 'lblOpsPaEmer', prop: 'text', kyc: 'paEmerLabel' },
    { id: 'paEmerHint', prop: 'text', kyc: 'paEmerHint' },
    { id: 'lblOpsTingull', prop: 'text', kyc: 'tingullLabel' },
    { id: 'lblOpsScanner', prop: 'text', kyc: 'scannerLabel' },

    { id: 'lblOpsRendi', prop: 'text', kyc: 'renditSipas' },
    { id: 'optIRi', prop: 'text', kyc: 'iRiOpt' },
    { id: 'optEmriAZ', prop: 'text', kyc: 'emriAZ' },
    { id: 'optEmriZA', prop: 'text', kyc: 'emriZAOpt' },
    { id: 'optSasiaUlet', prop: 'text', kyc: 'sasiaUletOpt' },
    { id: 'optSasiaLart', prop: 'text', kyc: 'sasiaLartOpt' },

    { id: 'cloudHint', prop: 'text', kyc: 'cloudHint' },
    { id: 'cloudUsername', prop: 'placeholder', kyc: 'lblCloudUsername' },
    { id: 'cloudFjalekalimi', prop: 'placeholder', kyc: 'lblCloudFjalekalimi' },
    { id: 'cloudKrijoLlogari', prop: 'text', kyc: 'cloudKrijoLlogariBtn' },
    { id: 'cloudHyrBtn', prop: 'text', kyc: 'cloudHyrBtn' },
    { id: 'cloudDilBtn', prop: 'text', kyc: 'cloudDilBtn' },
    { id: 'cloudEmriRi', prop: 'placeholder', kyc: 'lblCloudEmriRi' },
    { id: 'cloudFjalekalimiRi', prop: 'placeholder', kyc: 'lblCloudFjalekalimiRi' },
    { id: 'riautHint', prop: 'text', kyc: 'riautHintTeksti' },
    { id: 'cloudFjalekalimiAktual', prop: 'placeholder', kyc: 'lblCloudFjalekalimiAktual' },
    { id: 'btnRiautentifiko', prop: 'text', kyc: 'btnRiautentifikoBtn' },
    { id: 'cloudNdryshoEmrin', prop: 'text', kyc: 'cloudNdryshoEmrinBtn' },
    { id: 'cloudNdryshoFjalekalimin', prop: 'text', kyc: 'cloudNdryshoFjalekaliminBtn' },
    { id: 'cloudSinkronizoTani', prop: 'text', kyc: 'cloudSinkronizoTaniBtn' },
    { id: 'cloudRiktheTani', prop: 'text', kyc: 'cloudRiktheTaniBtn' },

    { id: 'konfJo', prop: 'text', kyc: 'anulo' },

    { id: 'kameraDrejtoje', prop: 'text', kyc: 'kameraDrejtoje' },
    { id: 'skanHint', prop: 'text', kyc: 'kameraHint' },
    { id: 'mbyllKamere', prop: 'text', kyc: 'mbyll' }
  ];

  function perkthoStatiket() {
    STATIKE.forEach(function (s) {
      var el = $(s.id);
      if (!el) return;
      if (s.prop === 'placeholder') el.placeholder = T(s.kyc);
      else if (s.prop === 'title') { el.title = T(s.kyc); el.setAttribute('aria-label', T(s.kyc)); }
      else el.textContent = T(s.kyc);
    });
  }

  // ================= Baza (localStorage): foldera + produkte =================
  var KEY_FOLDERA = 'stoku:foldera:v1';
  var KEY_PRODUKTET = 'stoku:produktet:v2';
  var KEY_PRODUKTET_VJETER = 'stoku:produktet:v1'; // pa foldera, versioni i vjetër
  // Instalim i ri (asnjë e dhënë ende): "Çka ka të re" s'ka kuptim — shënohet si e parë pa u treguar
  var __pajisjeERe = false;
  try { __pajisjeERe = !localStorage.getItem(KEY_FOLDERA); } catch (e) { /* ok */ } // folderat shkruhen që në hapjen e parë të çdo versioni
  // Prova si vizitor (porta.js, v217): të dhënat e kësaj faqeje janë shembull, të asnjë llogarie: s'sinkronizohen kurrë,
  // s'shkojnë te Grupi dhe s'japin njoftime. Hyrja me llogari bëhet te porta (ajo i fshin dhe e rinis faqen).
  function ngaVizitori() { return !!(window.StokuPorta && window.StokuPorta.ngaVizitori && window.StokuPorta.ngaVizitori()); }
  var LIMIT_RENDER = 300;
  var MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  // Ikona e cloud-it në krye të faqes së afateve (ruajtur / duke u ruajtur / s'u ruajt) — para nisjes, se përdoret që në ngarkim
  var IKONAT_SINK = {
    ok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m16.5 14.5-4.8 4.8-2.2-2.2"></path><path d="M5 17.74A7 7 0 1 1 15.71 10h1.79a4.5 4.5 0 0 1 1.5 8.74"></path></svg>',
    pune: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 13v8"></path><path d="M4 14.9A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.24"></path><path d="m8 17 4-4 4 4"></path></svg>',
    gabim: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m2 2 20 20"></path><path d="M5.78 5.78A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.31-.19"></path><path d="M21.53 16.5A4.5 4.5 0 0 0 17.5 10h-1.79A7 7 0 0 0 10 5.07"></path></svg>'
  };

  var FOLDERAT_PARAZGJEDHUR = [
    { id: 'ushqimore', emri: 'Ushqimore' },
    { id: 'pije', emri: 'Pije' },
    { id: 'higjiene', emri: 'Higjiene' },
    { id: 'fresh', emri: 'Fresh' }
  ];

  var foldera = [];          // [{ id, emri }, ...]
  var produktet = {};        // çelësi: kategoriaId + '::' + barkodi
  var folderiAktual = null;  // id i folderit të hapur, ose null = lista e folderave
  // Koha e ndryshimit të fundit të renditjes së folderave — gjatë sinkronizimit fiton renditja më e re
  // (qoftë kjo e telefonit apo e cloud-it), që renditja e vendosur me dorë të mos humbasë.
  var KEY_RENDI_KOHA = 'stoku:rendi-foldera-koha';
  var rendiFolderaveKoha = 0;
  try { rendiFolderaveKoha = parseInt(localStorage.getItem(KEY_RENDI_KOHA) || '0', 10) || 0; } catch (e) { /* ok */ }
  function ruajRendinKoha(k) {
    rendiFolderaveKoha = k || 0;
    try { localStorage.setItem(KEY_RENDI_KOHA, String(rendiFolderaveKoha)); } catch (e) { /* ok */ }
  }

  function celesiProduktit(kategoriaId, barkodi) { return kategoriaId + '::' + barkodi; }

  function emriFolderit(id) {
    var f = foldera.filter(function (x) { return x.id === id; })[0];
    return f ? f.emri : '';
  }

  function produktetENjeFolderi(kategoriaId) {
    return Object.keys(produktet)
      .map(function (k) { return produktet[k]; })
      .filter(function (p) { return p.kategoriaId === kategoriaId; });
  }

  function ngarkoBazen() {
    var f = null, p = null;
    try { f = JSON.parse(localStorage.getItem(KEY_FOLDERA) || 'null'); } catch (e) { /* ok */ }
    try { p = JSON.parse(localStorage.getItem(KEY_PRODUKTET) || 'null'); } catch (e) { /* ok */ }

    if (Array.isArray(f) && p && typeof p === 'object') {
      // Një rresht i dëmtuar (null, pa id…) hiqet, që të mos e rrëzojë krejt faqen
      foldera = window.StokuBashkimi.pastroFolderat(f);
      produktet = {};
      window.StokuBashkimi.pastroProduktet(Object.keys(p).map(function (k) { return p[k]; })).forEach(function (x) {
        produktet[celesiProduktit(x.kategoriaId, x.barkodi)] = x;
      });
      return;
    }

    // S'ka të dhëna me foldera ende: fillo me folderat e parazgjedhur
    foldera = FOLDERAT_PARAZGJEDHUR.map(function (fo) { return { id: fo.id, emri: fo.emri }; });
    produktet = {};

    // Migro të dhëna të vjetra (para se aplikacioni të kishte foldera), nëse ka
    var vjeter = null;
    try { vjeter = JSON.parse(localStorage.getItem(KEY_PRODUKTET_VJETER) || 'null'); } catch (e) { /* ok */ }
    if (vjeter && typeof vjeter === 'object' && Object.keys(vjeter).length > 0) {
      var kidVjeter = 'pa-kategori';
      foldera.push({ id: kidVjeter, emri: 'Pa kategori' });
      Object.keys(vjeter).forEach(function (b) {
        var pr = vjeter[b];
        if (!pr || typeof pr.barkodi !== 'string') return;
        produktet[celesiProduktit(kidVjeter, pr.barkodi)] = {
          barkodi: pr.barkodi, emri: pr.emri || '', sasia: pr.sasia | 0, kategoriaId: kidVjeter
        };
      });
    }

    ruajBaze();
  }

  // Rritet me çdo ndryshim të bërë këtu (jo nga sinkronizimi) — që një rezultat sinkronizimi që mbërrin
  // pasi përdoruesi ka ndryshuar diçka ndërkohë të mos e mbulojë atë ndryshim.
  var __versioniLokal = 0;

  function ruajBaze() {
    var ok = true;
    try {
      localStorage.setItem(KEY_FOLDERA, JSON.stringify(foldera));
      localStorage.setItem(KEY_PRODUKTET, JSON.stringify(produktet));
    } catch (e) {
      toast(T('ruajtjaDeshtoi')); // vetëm ruajtja lokale raportohet si "memoria plot" — jo gabime të tjera
      ok = false;
    }
    // Edhe kur memoria e telefonit është plot, ndryshimi shkon në cloud (përndryshe humbte krejt, dhe një sinkronizim
    // që ishte në rrugë e mbulonte me gjendjen e vjetër)
    __versioniLokal++;
    planifikoSinkronizimin();
    if (typeof planifikoMesimin === 'function') planifikoMesimin();
    return ok;
  }

  ngarkoBazen();

  try {
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
  } catch (e) { /* nuk ka problem */ }

  // ---------- Toast ----------
  var toastKohe = null;
  function toast(mesazh, ms) {
    var t = $('toast');
    t.textContent = mesazh;
    t.classList.add('hapur');
    clearTimeout(toastKohe);
    toastKohe = setTimeout(function () { t.classList.remove('hapur'); }, ms || 2600);
  }

  // ================= Opsionet =================
  var KEY_OPSIONE = 'stoku:opsione:v1';
  var KEY_TEMA = 'stoku:tema';

  var opsione = {
    tingull: true, rendi: 'i_ri', scanner: true, pda: false,
    paEmer: false, madhesia: 'normale', tastieraFshehur: false
  };
  try {
    var opsioneRuajtura = JSON.parse(localStorage.getItem(KEY_OPSIONE) || 'null');
    if (opsioneRuajtura && typeof opsioneRuajtura === 'object') {
      if (typeof opsioneRuajtura.tingull === 'boolean') opsione.tingull = opsioneRuajtura.tingull;
      if (typeof opsioneRuajtura.scanner === 'boolean') opsione.scanner = opsioneRuajtura.scanner;
      if (typeof opsioneRuajtura.pda === 'boolean') opsione.pda = opsioneRuajtura.pda;
      if (typeof opsioneRuajtura.tastieraFshehur === 'boolean') opsione.tastieraFshehur = opsioneRuajtura.tastieraFshehur;
      if (typeof opsioneRuajtura.paEmer === 'boolean') opsione.paEmer = opsioneRuajtura.paEmer;
      if (['i_ri', 'emri', 'emriZA', 'sasiaUlet', 'sasiaLart'].indexOf(opsioneRuajtura.rendi) !== -1) opsione.rendi = opsioneRuajtura.rendi;
      if (opsioneRuajtura.madhesia === 'e_madhe' || opsioneRuajtura.madhesia === 'normale') opsione.madhesia = opsioneRuajtura.madhesia;
    }
  } catch (e) { /* përdor vlerat fillestare */ }

  function ruajOpsionet() {
    try { localStorage.setItem(KEY_OPSIONE, JSON.stringify(opsione)); } catch (e) { /* ok */ }
  }

  // Migrim një herë: telefonat që ende ishin te rendi i vjetër i parazgjedhur ('emri') kalojnë
  // te "më të rejat së pari", siç kërkohet tani si sjellje e parazgjedhur.
  try {
    if (!localStorage.getItem('stoku:rendi-migruar-v1')) {
      if (!opsioneRuajtura || opsioneRuajtura.rendi === 'emri' || !opsioneRuajtura.rendi) opsione.rendi = 'i_ri';
      localStorage.setItem('stoku:rendi-migruar-v1', '1');
      ruajOpsionet();
    }
  } catch (e) { /* ok */ }

  document.documentElement.lang = 'sq';

  // ---------- Foldera ----------
  // ---------- Renditja e folderave me zvarritje (mbaje gishtin ~0.4s, pastaj lëvize) ----------
  var SHTYPJA_E_GJATE_MS = 400;
  var __zvarritja = null;          // gjendja e zvarritjes aktuale (null = s'po zvarritet)
  var __shtypjaKohez = null;
  var __zvarritjaSapoMbaroi = false;

  function nisShtypjenEGjate(ev, karta) {
    if (ev.button !== undefined && ev.button !== 0) return;
    if (!leja('stokuFoldera')) return; // renditja e folderave = "Krijo dhe ndrysho folderat"
    if (document.body.style.transform) return; // PDA e kundër-rrotulluar: koordinatat s'përputhen, mos lejo zvarritje
    anuloShtypjenEGjate();
    var x0 = ev.clientX, y0 = ev.clientY, pid = ev.pointerId;
    function leviz(e) {
      if (e.pointerId !== pid) return;
      if (Math.abs(e.clientX - x0) > 8 || Math.abs(e.clientY - y0) > 8) anuloShtypjenEGjate(); // po lëviz/skrollon
    }
    function lesho(e) { if (e.pointerId === pid) anuloShtypjenEGjate(); }
    document.addEventListener('pointermove', leviz, true);
    document.addEventListener('pointerup', lesho, true);
    document.addEventListener('pointercancel', lesho, true);
    __shtypjaKohez = {
      id: setTimeout(function () { anuloShtypjenEGjate(); nisZvarritjen(karta, x0, y0, pid); }, SHTYPJA_E_GJATE_MS),
      pastro: function () {
        document.removeEventListener('pointermove', leviz, true);
        document.removeEventListener('pointerup', lesho, true);
        document.removeEventListener('pointercancel', lesho, true);
      }
    };
  }
  function anuloShtypjenEGjate() {
    if (!__shtypjaKohez) return;
    clearTimeout(__shtypjaKohez.id);
    __shtypjaKohez.pastro();
    __shtypjaKohez = null;
  }

  function vendiPaTransform(karta) {
    var t = karta.style.transform;
    karta.style.transform = 'none';
    var r = karta.getBoundingClientRect();
    karta.style.transform = t;
    return r;
  }

  function nisZvarritjen(karta, x, y, pid) {
    var r = karta.getBoundingClientRect();
    __zvarritja = { karta: karta, pid: pid, offX: x - r.left, offY: y - r.top, x: x, y: y };
    karta.classList.add('po-zvarritet');
    $('folderaLista').classList.add('ne-renditje');
    try { if (navigator.vibrate) navigator.vibrate(30); } catch (e) { /* ok */ }
    document.addEventListener('pointermove', leviziZvarritjen, true);
    document.addEventListener('pointerup', perfundoZvarritjen, true);
    document.addEventListener('pointercancel', perfundoZvarritjen, true);
    vendosPozicioninEZvarritjes();
  }

  function vendosPozicioninEZvarritjes() {
    var z = __zvarritja; if (!z) return;
    var vendi = vendiPaTransform(z.karta);
    z.karta.style.transform = 'translate(' + (z.x - z.offX - vendi.left) + 'px,' + (z.y - z.offY - vendi.top) + 'px) scale(1.04)';
  }

  function leviziZvarritjen(e) {
    var z = __zvarritja;
    if (!z || e.pointerId !== z.pid) return;
    e.preventDefault();
    z.x = e.clientX; z.y = e.clientY;
    // Folderi mbi të cilin ndodhet gishti: vendi i ri
    var nenGisht = document.elementFromPoint(z.x, z.y);
    var objektivi = nenGisht && nenGisht.closest ? nenGisht.closest('.folder-karta') : null;
    if (objektivi && objektivi !== z.karta && objektivi.parentNode === z.karta.parentNode) {
      var te = Array.prototype.slice.call(z.karta.parentNode.children);
      if (te.indexOf(objektivi) > te.indexOf(z.karta)) objektivi.after(z.karta); else objektivi.before(z.karta);
    }
    // Skrollim automatik kur gishti afrohet te skajet e listës
    var rrjeti = $('folderaLista'), rr = rrjeti.getBoundingClientRect();
    if (z.y < rr.top + 40) rrjeti.scrollTop -= 12;
    else if (z.y > rr.bottom - 40) rrjeti.scrollTop += 12;
    vendosPozicioninEZvarritjes();
  }

  function perfundoZvarritjen(e) {
    var z = __zvarritja;
    if (!z || (e && e.pointerId !== z.pid)) return;
    document.removeEventListener('pointermove', leviziZvarritjen, true);
    document.removeEventListener('pointerup', perfundoZvarritjen, true);
    document.removeEventListener('pointercancel', perfundoZvarritjen, true);
    __zvarritja = null;
    $('folderaLista').classList.remove('ne-renditje');
    // Renditja e re = renditja e kartave në ekran
    var rendiRi = Array.prototype.map.call($('folderaLista').querySelectorAll('.folder-karta'), function (k) { return k.getAttribute('data-id'); });
    var sipasId = {};
    foldera.forEach(function (f) { sipasId[f.id] = f; });
    var eReja = rendiRi.map(function (id) { return sipasId[id]; }).filter(Boolean);
    var ndryshoi = eReja.length === foldera.length && eReja.some(function (f, i) { return f !== foldera[i]; });
    if (ndryshoi) {
      foldera = eReja;
      ruajRendinKoha(Date.now());
      ruajBaze();
    }
    __zvarritjaSapoMbaroi = true;
    setTimeout(function () { __zvarritjaSapoMbaroi = false; }, 350);
    renderFolderat();
  }

  // Gjatë zvarritjes, gishti s'duhet të skrollojë faqen/listën.
  $('folderaLista').addEventListener('touchmove', function (ev) {
    if (__zvarritja) ev.preventDefault();
  }, { passive: false });

  function renderFolderat() {
    if (__zvarritja) return; // mos e rindërto listën nën gishtin e përdoruesit; bëhet në fund të zvarritjes
    // Brenda një folderi kryefaqja s'shihet: vizatohet kur kthehesh (rifreskoPamjen). Përndryshe numërimi me +/- (çdo 1.5 s)
    // e çdo skanim e rindërtonin kot krejt kryefaqen mbi mijëra produkte.
    if (folderiAktual !== null) return;
    var cont = $('folderaLista');
    cont.textContent = '';
    if (!leja('stoku')) { $('kerkoGlobal').value = ''; emriNeKrye(); return; } // v231: kryefaqja është faqja bazë
    var lejaFshi = leja('stokuFshi'), lejaFoldera = leja('stokuFoldera');
    var frag = document.createDocumentFragment();
    foldera.forEach(function (f) {
      var n = produktetENjeFolderi(f.id).length;

      var karta = document.createElement('div');
      karta.className = 'folder-karta';
      karta.setAttribute('data-id', f.id);
      if (lejaFoldera) karta.addEventListener('pointerdown', function (ev) { nisShtypjenEGjate(ev, karta); });
      karta.addEventListener('contextmenu', function (ev) { ev.preventDefault(); });

      var emri = document.createElement('div');
      emri.className = 'emri';
      emri.textContent = f.emri;

      var numri = document.createElement('div');
      numri.className = 'numri';
      numri.textContent = T('njesiaProdukteve', { n: n });

      karta.appendChild(emri);
      karta.appendChild(numri);
      karta.addEventListener('click', function () {
        if (__zvarritjaSapoMbaroi) return; // klikimi që vjen menjëherë pas lëshimit të zvarritjes
        hapFolderin(f.id);
      });

      var fshij = document.createElement('button');
      fshij.type = 'button';
      fshij.className = 'folder-fshij';
      fshij.setAttribute('aria-label', T('fshij') + ' ' + f.emri);
      fshij.title = T('fshij');
      fshij.textContent = '✕';
      fshij.addEventListener('pointerdown', function (ev) { ev.stopPropagation(); });
      fshij.addEventListener('click', function (ev) {
        ev.stopPropagation();
        if (__zvarritjaSapoMbaroi) return;
        fshijFolderin(f);
      });
      if (lejaFshi) karta.appendChild(fshij);

      frag.appendChild(karta);
    });
    cont.appendChild(frag);
    vizatoKryefaqen(cont);
  }
  // Kryefaqja (dizajni i ri): karta e errët me numrat, titulli "Folderat", katrori me ngjyrë te çdo folder
  // dhe "Ndryshuar së fundi". Brenda #folderaLista (rrjeta), që zvarritja e folderave të punojë si më parë.
  function numerMeHapesire(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function vizatoKryefaqen(cont) {
    var te = Object.keys(produktet).map(function (k) { return produktet[k]; });
    var sot = new Date(); sot.setHours(0, 0, 0, 0);
    var zero = 0, sotN = 0;
    te.forEach(function (p) {
      var sas = Number(p.sasia) || 0;
      if (sas <= 0) zero++;
      if ((p.prekurSe || 0) >= sot.getTime()) sotN++;
    });
    function el(tag, cls, tekst) { var e = document.createElement(tag); if (cls) e.className = cls; if (tekst !== undefined) e.textContent = tekst; return e; }

    var krye = el('div', 'sb-home-krye');
    // v241: "Je te: …" (vetëm kur ka markete)
    if (kaMarkete() || merchPaMarkete()) { // v242: edhe "Shto marketin ku punon" kur s'ka asnjë
      var mc = $('afMarketi').cloneNode(true); mc.removeAttribute('id'); mc.hidden = false;
      var mcE = mc.querySelector('.mk-chip__emri'); if (mcE) mcE.removeAttribute('id');
      mc.addEventListener('click', prekCipin);
      krye.appendChild(mc);
    }
    var karta = el('div', 'sb-summary');
    var lart = el('div', 'sb-summary__top');
    var ma = el('div');
    ma.appendChild(el('div', 'sb-summary__label', 'Produkte gjithsej'));
    ma.appendChild(el('div', 'sb-summary__value', numerMeHapesire(te.length)));
    lart.appendChild(ma);
    if (sotN) lart.appendChild(el('span', 'sb-pill', sotN + ' ndryshuar sot'));
    karta.appendChild(lart);
    var st = el('div', 'sb-stats');
    // "Sasi e ulët" u hoq (v134); në vend të saj: afatet e skaduara që janë ende në raft (si te kompjuteri)
    var nAf = (window.StokuAfatet && typeof afatet !== 'undefined' && afatet) ? window.StokuAfatet.numero(afatetEMarketit()) : null;
    var skaduara = nAf ? (nAf.skaduar || 0) + (nAf['pa-date'] || 0) : 0;
    var numrat = [[foldera.length, 'Folderat', ''], [zero, 'Sasi 0', zero ? ' sb-stat__value--exp' : '']];
    // v231: pa lejen "Afatet" s'del as numri i të skaduarave
    if (leja('afatet')) numrat.push([skaduara, 'Të skaduara', skaduara ? ' sb-stat__value--exp' : '']);
    else st.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
    numrat.forEach(function (x) {
      var q = el('div', 'sb-stat');
      q.appendChild(el('span', 'sb-stat__value' + x[2], numerMeHapesire(x[0])));
      q.appendChild(el('span', 'sb-stat__label', x[1]));
      st.appendChild(q);
    });
    karta.appendChild(st);
    krye.appendChild(karta);
    var koka = el('div', 'sb-section__head');
    koka.appendChild(el('h2', 'sb-section__title', 'Folderat'));
    var ri = el('button', 'sb-link', '+ Folder i ri'); ri.type = 'button';
    ri.addEventListener('click', hapDialoguFolder);
    if (leja('stokuFoldera')) koka.appendChild(ri);
    krye.appendChild(koka);
    if (!foldera.length) krye.appendChild(el('div', 'sb-empty', leja('stokuFoldera') ? 'S\'ka ende foldera. Krijo të parin me "+ Folder i ri".' : 'S\'ka ende foldera.'));
    cont.insertBefore(krye, cont.firstChild);

    Array.prototype.forEach.call(cont.querySelectorAll('.folder-karta'), function (k) {
      var fo = null, id = k.getAttribute('data-id');
      foldera.forEach(function (x) { if (x.id === id) fo = x; });
      var ik = window.StokuAfatet.ikonaEFolderit(fo);
      var q = el('span', 'sb-folder__swatch folder-ikona ngj-' + ik.ngj);
      q.innerHTML = window.StokuAfatet.svgEIkones(ik, 21);
      k.insertBefore(q, k.firstChild);
    });

    var tefundit = te.filter(function (p) { return p.prekurSe; })
      .sort(function (a, b) { return (b.prekurSe || 0) - (a.prekurSe || 0); }).slice(0, 5);
    if (tefundit.length) {
      var seks = el('div', 'sb-home-fund');
      var kk = el('div', 'sb-section__head');
      kk.appendChild(el('h2', 'sb-section__title', 'Ndryshuar së fundi'));
      seks.appendChild(kk);
      var lista = el('div', 'sb-list');
      tefundit.forEach(function (p) {
        var r = el('button', 'sb-row'); r.type = 'button';
        var m = el('span', 'sb-row__main');
        var em = el('span', 'sb-row__name', p.emri || 'Pa emër');
        if (!p.emri) em.classList.add('sb-row__name--bosh');
        m.appendChild(em);
        var fe = emriFolderit(p.kategoriaId);
        m.appendChild(el('span', 'sb-row__code', p.barkodi + (fe ? '  ·  ' + fe : '')));
        r.appendChild(m);
        var sas = Number(p.sasia) || 0;
        r.appendChild(el('span', 'sb-row__qty' + (sas <= 0 ? ' sb-row__qty--exp' : ''), numerMeHapesire(sas)));
        r.addEventListener('click', function () { hapFolderin(p.kategoriaId); });
        lista.appendChild(r);
      });
      seks.appendChild(lista);
      cont.appendChild(seks);
    }
    emriNeKrye();
  }
  // Emri poshtë logos. Para se Firebase të dijë a je hyrë, mbetet emri i hyrjes së fundit (që logoja të mos dridhet në hapje)
  function emriNeKrye() {
    var u = perdoruesiAktual(), cl = window.__stokuCloud;
    if (u) $('sbDyqani').textContent = emriPerdoruesitAktual() || 'Llogaria ime';
    else if (ngaVizitori()) $('sbDyqani').textContent = 'Vizitor · provë';
    else if (cl && cl.authGati) $('sbDyqani').textContent = 'Vetëm në këtë telefon';
  }

  // Kërkimi global: kërkon në krejt produktet e krejt folderave njëkohësisht (jo vetëm brenda
  // një folderi). Kur ka tekst kërkimi, zëvendëson grafin e folderave me listën e rezultateve.
  function renderKerkimiGlobal() {
    var k = leja('stoku') ? $('kerkoGlobal').value.trim().toLowerCase() : '';
    var kaKerkim = !!k;
    $('folderaLista').style.display = kaKerkim ? 'none' : '';
    $('kerkoGlobalLista').style.display = kaKerkim ? '' : 'none';
    if (!kaKerkim) return;

    var te = Object.keys(produktet).map(function (celesi) { return produktet[celesi]; });
    var fil = te.filter(function (p) {
      return (p.emri && p.emri.toLowerCase().indexOf(k) !== -1) || (p.barkodi && p.barkodi.toLowerCase().indexOf(k) !== -1) ||
        (p.furnizuesi && String(p.furnizuesi).toLowerCase().indexOf(k) !== -1);
    });
    fil.sort(krahaso);

    var kont = $('kerkoGlobalLista');
    kont.textContent = '';
    var frag = document.createDocumentFragment();

    if (fil.length === 0) {
      var i0 = document.createElement('div');
      i0.className = 'info';
      i0.textContent = T('kerkoGlobalNukUGjet');
      frag.appendChild(i0);
    }

    fil.slice(0, LIMIT_RENDER).forEach(function (p) {
      var rreshti = document.createElement('div');
      rreshti.className = 'artikull';
      var majtas = document.createElement('div');
      majtas.className = 'majtas';
      var emri = document.createElement('div');
      emri.className = 'emri';
      emri.textContent = p.emri || T('paEmerListe');
      if (!p.emri) emri.className = 'emri bosh';
      var kodi = document.createElement('div');
      kodi.className = 'kodi';
      kodi.textContent = p.barkodi + (p.furnizuesi ? ' · ' + p.furnizuesi : ''); // v212: furnizuesi (nëse është shënuar)
      majtas.appendChild(emri);
      majtas.appendChild(kodi);
      // Djathtas: etiketa e folderit ku ndodhet produkti + sasia
      var djathtas = document.createElement('div');
      djathtas.className = 'kerko-djathtas';
      var etiketa = document.createElement('span');
      etiketa.className = 'folder-etikete';
      etiketa.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"></path></svg>';
      var etiketaTeksti = document.createElement('span');
      etiketaTeksti.className = 'folder-etikete-tekst';
      etiketaTeksti.textContent = emriFolderit(p.kategoriaId);
      etiketa.appendChild(etiketaTeksti);
      etiketa.title = emriFolderit(p.kategoriaId);
      var sasia = document.createElement('div');
      sasia.className = 'sasia';
      sasia.textContent = String(p.sasia);
      djathtas.appendChild(etiketa);
      djathtas.appendChild(sasia);
      rreshti.appendChild(majtas);
      rreshti.appendChild(djathtas);
      rreshti.addEventListener('click', function () {
        burimiIFundit = 'lista';
        hapFolderin(p.kategoriaId);
        hapDialogun(p.barkodi);
      });
      frag.appendChild(rreshti);
    });

    if (fil.length > LIMIT_RENDER) {
      var i1 = document.createElement('div');
      i1.className = 'info';
      i1.textContent = T('shfaqenNga', { limit: LIMIT_RENDER, gjithsej: fil.length });
      frag.appendChild(i1);
    }
    kont.appendChild(frag);
  }
  $('kerkoGlobal').addEventListener('input', renderKerkimiGlobal);

  function rifreskoPamjen() {
    if (folderiAktual !== null && !foldera.some(function (f) { return f.id === folderiAktual; })) {
      folderiAktual = null; // folderi u fshi ndërkohë (p.sh. nga sinkronizimi) — kthehu te lista
      if (typeof sinkronizoHistorineEDritareve === 'function') sinkronizoHistorineEDritareve();
    }
    var brenda = folderiAktual !== null;
    $('siperFolderat').style.display = brenda ? 'none' : '';
    $('kryeButonatImport').style.display = brenda ? 'none' : '';
    $('folderaLista').style.display = brenda ? 'none' : '';
    $('kerkoGlobalLista').style.display = 'none';
    $('siperFolderi').style.display = brenda ? '' : 'none';
    $('lista').style.display = brenda ? '' : 'none';
    $('footerFolderi').style.display = brenda ? '' : 'none';
    $('btnMbrapa').style.display = brenda ? '' : 'none';
    if (brenda) {
      $('titulli').style.display = '';
      $('logoSlika').style.display = 'none';
      $('titulli').classList.remove('logo');
      $('btnMbrapa').setAttribute('aria-label', T('foldera'));
      $('btnMbrapa').title = T('foldera');
      renderLista();
      fokusoBarkodin();
    } else {
      $('titulli').style.display = 'none';
      $('logoSlika').style.display = '';
      renderFolderat();
      renderKerkimiGlobal();
    }
    rifreskoTabet();
  }

  function hapFolderin(id) {
    if (!leja('stoku')) return;
    folderiAktual = id;
    $('kerko').value = '';
    rifreskoPamjen();
    sinkronizoHistorineEDritareve();
  }

  function mbrapaNeFoldera() {
    folderiAktual = null;
    rifreskoPamjen();
    sinkronizoHistorineEDritareve();
  }

  $('btnMbrapa').addEventListener('click', mbrapaNeFoldera);

  // Folder i ri
  // pasKrijimitTeFolderit/pasAnulimitTeFolderit: thirren opsionalisht nga vende të tjera (p.sh. "+ Folder
  // i ri" te importi i stokut) që duan të dinë rezultatin pa e ndërlikuar hapjen e zakonshme të dialogut.
  var pasKrijimitTeFolderit = null;
  var pasAnulimitTeFolderit = null;
  var zgjedhesIkonave = window.StokuAfatet.zgjedhesIIkonave($('dlgFolderIkonat'), function () { return $('dlgFolderEmri').value; });
  $('dlgFolderEmri').addEventListener('input', zgjedhesIkonave.sugjero);
  function hapDialoguFolder() {
    if (!leja('stokuFoldera')) { if (pasAnulimitTeFolderit) anuloDialoguFolder(); return; }
    $('dlgFolderEmri').value = '';
    zgjedhesIkonave.fillo(null);
    $('dlgFolder').classList.add('hapur');
    $('dlgFolderEmri').focus();
  }
  function mbyllDialoguFolder() { $('dlgFolder').classList.remove('hapur'); }
  function anuloDialoguFolder() {
    mbyllDialoguFolder();
    pasKrijimitTeFolderit = null;
    if (pasAnulimitTeFolderit) { var cb = pasAnulimitTeFolderit; pasAnulimitTeFolderit = null; cb(); }
  }

  function krijoFolderin() {
    if (!leja('stokuFoldera')) { anuloDialoguFolder(); return; }
    var emri = $('dlgFolderEmri').value.trim();
    if (!emri) { toast(T('shkruajEmrinFolderit')); $('dlgFolderEmri').focus(); return; }
    var id = 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    foldera.push({ id: id, emri: emri, ikona: zgjedhesIkonave.vlera() || undefined, ndryshuarSe: Date.now() });
    ruajBaze();
    mbyllDialoguFolder();
    renderFolderat();
    pasAnulimitTeFolderit = null;
    if (pasKrijimitTeFolderit) { var cb = pasKrijimitTeFolderit; pasKrijimitTeFolderit = null; cb(id); }
  }

  $('btnKrijoFolder').addEventListener('click', hapDialoguFolder);
  $('dlgFolderRuaj').addEventListener('click', krijoFolderin);
  $('dlgFolderAnulo').addEventListener('click', anuloDialoguFolder);
  $('dlgFolderEmri').addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter') { ev.preventDefault(); krijoFolderin(); }
  });
  $('dlgFolder').addEventListener('click', function (ev) {
    if (ev.target === $('dlgFolder')) anuloDialoguFolder();
  });

  // Fshirja e një folderi (bashkë me produktet brenda tij)
  async function fshijFolderin(f) {
    if (!leja('stokuFshi')) return;
    var brenda = produktetENjeFolderi(f.id);
    var mesazhi = brenda.length > 0
      ? T('folderiMePrTekst', { emri: f.emri, n: brenda.length })
      : T('folderiBoshTekst', { emri: f.emri });
    var po = await konfirmo(T('teFshihetFolderi'), mesazhi, T('fshij'));
    if (!po || !leja('stokuFshi')) return;
    foldera = foldera.filter(function (x) { return x.id !== f.id; });
    brenda.forEach(function (p) { delete produktet[celesiProduktit(f.id, p.barkodi)]; });
    shenoFolderinEFshire(f.id);
    brenda.forEach(function (p) { shenoProduktinEFshire(celesiProduktit(f.id, p.barkodi), true); });
    ruajFshiraet();
    ruajBaze();
    renderFolderat();
  }

  // Tema: 'auto' (ndjek telefonin), 'light' ose 'dark'
  // Shiriti i shfletuesit/telefonit merr ngjyrën e sfondit (header-i është i çelët/i errët, jo me ngjyrë)
  function rifreskoMetaTemen() {
    $('metaTema').setAttribute('content', temaEfektive() === 'dark' ? '#0f1115' : '#f6f5f2');
  }
  function zgjedhjaETemes() {
    var t = null;
    try { t = localStorage.getItem(KEY_TEMA); } catch (e) { /* ok */ }
    return (t === 'dark' || t === 'light') ? t : 'auto';
  }
  function temaEfektive() {
    var z = zgjedhjaETemes();
    if (z !== 'auto') return z;
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }
  function zbatoTemen() {
    var t = temaEfektive();
    document.documentElement.setAttribute('data-tema', t);
    rifreskoMetaTemen();
    var z = zgjedhjaETemes();
    Array.prototype.forEach.call(document.querySelectorAll('#segTema button'), function (b) {
      b.classList.toggle('aktiv', b.getAttribute('data-v') === z);
    });
  }
  function vendosTemen(v) {
    try {
      if (v === 'auto') localStorage.removeItem(KEY_TEMA); else localStorage.setItem(KEY_TEMA, v);
    } catch (e) { /* ok */ }
    zbatoTemen();
    rifreskoStatusetOpsioneve();
  }
  if (window.matchMedia) {
    var mqErret = window.matchMedia('(prefers-color-scheme: dark)');
    var kurNdryshonTelefoni = function () { if (zgjedhjaETemes() === 'auto') zbatoTemen(); };
    if (mqErret.addEventListener) mqErret.addEventListener('change', kurNdryshonTelefoni);
    else if (mqErret.addListener) mqErret.addListener(kurNdryshonTelefoni);
  }
  zbatoTemen();

  // ---------- Madhësia e shkronjave ----------
  // ("Ngjyra kryesore" dhe "Motivi i sfondit" u hoqën në v128: Stoku ka vetëm ngjyrat e dizajnit)
  function zbatoMadhesine() {
    document.body.setAttribute('data-madhesi', opsione.madhesia === 'e_madhe' ? 'e_madhe' : '');
    Array.prototype.forEach.call(document.querySelectorAll('#segMadhesia button'), function (b) {
      b.classList.toggle('aktiv', b.getAttribute('data-v') === opsione.madhesia);
    });
  }
  function vendosMadhesine(v) {
    opsione.madhesia = v;
    ruajOpsionet();
    zbatoMadhesine();
  }
  Array.prototype.forEach.call(document.querySelectorAll('#segMadhesia button'), function (b) {
    b.addEventListener('click', function () { vendosMadhesine(b.getAttribute('data-v')); });
  });
  zbatoMadhesine();

  // (gjuha u hoq — aplikacioni tani është vetëm shqip)

  // Rendi i listës
  function emriKrahaso(a, b) {
    if (!a.emri && !b.emri) return a.barkodi.localeCompare(b.barkodi);
    if (!a.emri) return 1;
    if (!b.emri) return -1;
    return a.emri.localeCompare(b.emri, 'sq', { sensitivity: 'base' }) || a.barkodi.localeCompare(b.barkodi);
  }
  function krahaso(a, b) {
    if (opsione.rendi === 'sasiaUlet') return (a.sasia - b.sasia) || emriKrahaso(a, b);
    if (opsione.rendi === 'sasiaLart') return (b.sasia - a.sasia) || emriKrahaso(a, b);
    if (opsione.rendi === 'emriZA') return (!a.emri !== !b.emri) ? (a.emri ? -1 : 1) : -emriKrahaso(a, b); // pa emër gjithmonë në fund
    if (opsione.rendi === 'i_ri') return ((b.prekurSe || 0) - (a.prekurSe || 0)) || emriKrahaso(a, b);
    return emriKrahaso(a, b);
  }

  // Modaliteti PDA: fsheh kamerën dhe e mban kursorin te fusha e barkodit
  // Vija ndarëse hiqet nga seksioni i fundit I DUKSHËM i çdo faqeje (jo thjesht i fundit në kod) —
  // përndryshe, kur disa seksione fshihen (PDA, Llogaria pa hyrje), mbetet një vijë bosh në fund.
  function rregulloVijatNdarese() {
    Array.prototype.forEach.call(document.querySelectorAll('.opsione-faqe, .opsione-faqe .ops-grupi'), function (faqe) {
      var seksionet = faqe.querySelectorAll(':scope > .seksion');
      var iFundit = null;
      Array.prototype.forEach.call(seksionet, function (sk) {
        sk.classList.remove('seksion-fundit');
        if (sk.style.display !== 'none') iFundit = sk;
      });
      if (iFundit) iFundit.classList.add('seksion-fundit');
    });
  }

  function zbatoPda() {
    var pda = opsione.pda;
    $('btnKamera').style.display = pda ? 'none' : '';
    $('btnEksportPdf').style.display = ''; // PDF mbetet e dukshme edhe në PDA
    $('seksionTingull').style.display = pda ? 'none' : '';
    $('seksionScanner').style.display = pda ? 'none' : '';
    $('seksionTastiera').style.display = pda ? '' : 'none';
    rregulloVijatNdarese();
    $('barkodi').placeholder = pda ? T('barkodiPda') : T('barkodiNormal');
    zbatoRrotullimin();
    zbatoTastieren();
  }

  // ================= Tastiera në ekran (vetëm PDA) =================
  // "Fshih tastierën" (butoni te folderi ose Cilësimet → Skanimi, vetëm kur është ndezur PDA): asnjë fushë e Stoku-t s'e hap
  // tastierën e Android-it; shkruhet me tastierën fizike të PDA-së dhe me skanerin. Tri shtresa, sepse disa Zebra e
  // injorojnë njërën: inputmode="none", virtualkeyboardpolicy="manual" (+ navigator.virtualKeyboard.hide()) dhe "readonly"
  // për një çast kur preket fusha (tastiera s'hapet për një fushë që s'shkruhet në çastin kur merr fokusin).
  function tastieraEFshehur() { return !!(opsione.pda && opsione.tastieraFshehur); }
  function eFusheShkrimi(el) {
    if (!el || !el.tagName) return false;
    if (el.tagName === 'TEXTAREA') return true;
    return el.tagName === 'INPUT' && /^(text|search|tel|number|email|url|password)$/.test(el.type || 'text');
  }
  function fshihTastierenTe(el) {
    if (!el.hasAttribute('data-im-orig')) el.setAttribute('data-im-orig', el.getAttribute('inputmode') || '');
    if (el.getAttribute('inputmode') !== 'none') el.setAttribute('inputmode', 'none');
    if (el.getAttribute('virtualkeyboardpolicy') !== 'manual') el.setAttribute('virtualkeyboardpolicy', 'manual');
  }
  function riktheTastierenTe(el) {
    if (!el.hasAttribute('data-im-orig')) return;
    var o = el.getAttribute('data-im-orig');
    if (o) el.setAttribute('inputmode', o); else el.removeAttribute('inputmode');
    el.removeAttribute('data-im-orig');
    el.removeAttribute('virtualkeyboardpolicy');
  }
  function mbyllTastierenEEkranit() {
    try { if (navigator.virtualKeyboard && navigator.virtualKeyboard.hide) navigator.virtualKeyboard.hide(); } catch (e) { /* ok */ }
    // v238: aplikacioni Android (APK e re): e mbyll vetë Android-i (InputMethodManager + WindowInsets), edhe kur WebView-i
    // e injoron inputmode="none"
    try { if (window.StokuAndroid && window.StokuAndroid.fshihTastieren) window.StokuAndroid.fshihTastieren(); } catch (e) { /* ok */ }
  }
  // v238: tastiera e Android-it shpesh hapet pak pas fokusit/prekjes: mbyllet edhe disa herë menjëherë pas tyre
  function mbyllTastierenMeVonese() {
    mbyllTastierenEEkranit();
    setTimeout(mbyllTastierenEEkranit, 60);
    setTimeout(mbyllTastierenEEkranit, 250);
  }
  function zbatoTastieren() {
    var fsheh = tastieraEFshehur(), b = $('btnTastiera');
    b.style.display = opsione.pda ? '' : 'none';
    b.textContent = T(fsheh ? 'shfaqTastieren' : 'fshihTastieren');
    b.setAttribute('aria-pressed', fsheh ? 'true' : 'false');
    $('opsTastiera').checked = !!opsione.tastieraFshehur;
    Array.prototype.forEach.call(document.querySelectorAll('input, textarea'), function (el) {
      if (eFusheShkrimi(el)) { if (fsheh) fshihTastierenTe(el); else riktheTastierenTe(el); }
    });
    if (fsheh) mbyllTastierenEEkranit();
    try { if (window.StokuAndroid && window.StokuAndroid.tastieraFshehur) window.StokuAndroid.tastieraFshehur(fsheh); } catch (e) { /* ok */ }
    vezhgoFushatERe(fsheh);
  }
  // v238: fushat e reja (dritaret, listat, porta, kërkimi) e marrin inputmode="none" sapo shtohen, para fokusit: kodi që
  // i fokuson menjëherë (p.sh. dritarja e re) s'arrin ta hapë tastierën para se ta kapë focusin
  var __vezhguesiFushave; // pa vlerë fillestare: zbatoTastieren mund ta thërrasë para këtij rreshti
  function vezhgoFushatERe(po) {
    if (!po) { if (__vezhguesiFushave) { __vezhguesiFushave.disconnect(); __vezhguesiFushave = null; } return; }
    if (__vezhguesiFushave || typeof MutationObserver === 'undefined') return;
    __vezhguesiFushave = new MutationObserver(function (ndr) {
      if (!tastieraEFshehur()) return;
      ndr.forEach(function (m) {
        Array.prototype.forEach.call(m.addedNodes || [], function (n) {
          if (n.nodeType !== 1) return;
          if (eFusheShkrimi(n)) fshihTastierenTe(n);
          if (n.querySelectorAll) Array.prototype.forEach.call(n.querySelectorAll('input, textarea'), function (el) { if (eFusheShkrimi(el)) fshihTastierenTe(el); });
        });
      });
    });
    __vezhguesiFushave.observe(document.documentElement, { childList: true, subtree: true });
  }
  // Fushat që krijohen më vonë (dritaret, listat, porta): kur preken ose marrin fokus
  document.addEventListener('pointerdown', function (ev) {
    var el = ev.target;
    if (!tastieraEFshehur() || !eFusheShkrimi(el)) return;
    fshihTastierenTe(el);
    // v238: edhe kur fusha është tashmë e fokusuar (prekja e dytë e hapte tastierën në disa Zebra)
    if (!el.readOnly && !el.hasAttribute('data-ro-tastiera')) {
      el.readOnly = true; el.setAttribute('data-ro-tastiera', '1');
      setTimeout(function () { el.readOnly = false; el.removeAttribute('data-ro-tastiera'); }, 120);
    }
    mbyllTastierenMeVonese();
  }, true);
  document.addEventListener('focusin', function (ev) {
    if (!tastieraEFshehur() || !eFusheShkrimi(ev.target)) return;
    fshihTastierenTe(ev.target);
    mbyllTastierenMeVonese();
  }, true);
  // v238: prekja/klikimi dhe çdo shkrim (p.sh. skaneri) mbyllin sërish tastierën nëse u hap prapë
  document.addEventListener('click', function (ev) {
    if (tastieraEFshehur() && eFusheShkrimi(ev.target)) mbyllTastierenMeVonese();
  }, true);
  function ndryshoTastieren(fsheh) {
    opsione.tastieraFshehur = !!fsheh;
    ruajOpsionet();
    zbatoTastieren();
  }

  // ================= Kyçja e ekranit në portret (PDA) =================
  // PSE S'KISHTE PUNUAR MË PARË: Chrome në Android e lejon screen.orientation.lock() VETËM kur faqja
  // është në fullscreen (Fullscreen API) ose kur është e instaluar si app. Kodi i vjetër e thërriste
  // pa asnjërën — pra refuzohej GJITHMONË, në heshtje. Për më tepër, fullscreen-i mund të kërkohet
  // vetëm gjatë një veprimi të përdoruesit (prekje/tast), jo automatikisht.
  //
  // Tani, kur PDA është ndezur, përdoren tri shtresa:
  //  1) Kyçje e drejtpërdrejtë (punon kur app-i është i instaluar).
  //  2) Nëse refuzohet: fullscreen + kyçje, në veprimin e parë të përdoruesit (ndezja e PDA-së,
  //     prekja e parë, ose shtypja e parë e skanerit pas hapjes së app-it).
  //  3) Kundër-rrotullim: nëse sistemi prapë e rrotullon ekranin, i gjithë app-i rrotullohet vetë
  //     në drejtimin e kundërt, që të mbetet drejt ndaj pajisjes dhe puna të vazhdojë pa ndërprerje.
  var __kycjaEKonfirmuar = false;
  var __hymeNeFullscreenPerKycje = false;

  function kycjaDirekte() {
    if (!screen.orientation || !screen.orientation.lock) return Promise.reject(new Error('pa-api'));
    return screen.orientation.lock('portrait-primary');
  }

  async function kycMeFullscreen() {
    var el = document.documentElement;
    var kerko = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!kerko) throw new Error('pa-fullscreen');
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      await kerko.call(el, { navigationUI: 'hide' });
      __hymeNeFullscreenPerKycje = true;
    }
    await kycjaDirekte();
  }

  // Thirret nga një veprim i përdoruesit (click/keydown) — vetëm aty lejohet fullscreen-i.
  async function provoKycjenPda() {
    if (!opsione.pda) return;
    try {
      await kycjaDirekte();
      __kycjaEKonfirmuar = true;
    } catch (e) {
      try { await kycMeFullscreen(); __kycjaEKonfirmuar = true; } catch (e2) { __kycjaEKonfirmuar = false; }
    }
    zbatoKunderRrotullimin();
  }

  function liroKycjen() {
    __kycjaEKonfirmuar = false;
    try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) { /* ok */ }
    if (__hymeNeFullscreenPerKycje && (document.fullscreenElement || document.webkitFullscreenElement)) {
      var dil = document.exitFullscreen || document.webkitExitFullscreen;
      try { if (dil) dil.call(document); } catch (e) { /* ok */ }
    }
    __hymeNeFullscreenPerKycje = false;
  }

  // Këndi aktual i ekranit ndaj pozicionit normal: 0, 90, 180, 270 (-90 → 270).
  function kendiIEkranit() {
    var k = 0;
    try {
      if (screen.orientation && typeof screen.orientation.angle === 'number') k = screen.orientation.angle;
      else if (typeof window.orientation === 'number') k = window.orientation;
    } catch (e) { /* ok */ }
    k = ((k % 360) + 360) % 360;
    return (k === 90 || k === 180 || k === 270) ? k : 0;
  }

  // Shtresa 3: nëse ekrani u rrotullua sido që të jetë, e kthejmë përmbajtjen mbrapa me CSS që të
  // mbetet drejt ndaj pajisjes (si të mos ishte rrotulluar fare). Dialogët/kamera, që janë "fixed",
  // rrotullohen bashkë me të, sepse transform-i i body-t i përfshin.
  function zbatoKunderRrotullimin() {
    var b = document.body;
    var k = opsione.pda ? kendiIEkranit() : 0;
    b.classList.toggle('pda-rrotullim', !!opsione.pda);
    if (!k) {
      b.style.transform = ''; b.style.width = ''; b.style.height = '';
      b.style.left = ''; b.style.top = ''; b.style.right = ''; b.style.bottom = '';
      return;
    }
    var w = window.innerWidth, h = window.innerHeight;
    var anash = (k === 90 || k === 270);
    var gjeresia = anash ? h : w, lartesia = anash ? w : h;
    b.style.right = 'auto'; b.style.bottom = 'auto';
    b.style.width = gjeresia + 'px';
    b.style.height = lartesia + 'px';
    b.style.left = ((w - gjeresia) / 2) + 'px';
    b.style.top = ((h - lartesia) / 2) + 'px';
    b.style.transform = 'rotate(' + (-k) + 'deg)';
  }

  // Kontrolli "përmbys" jashtë PDA-së (CSS s'e dallon portretin përmbys nga ai normal).
  function kontrolloNesePermbys() {
    document.body.setAttribute('data-permbys', kendiIEkranit() === 180 ? '1' : '0');
  }

  // Thirret nga zbatoPda() dhe pas çdo ndryshimi orientimi.
  function zbatoRrotullimin() {
    if (opsione.pda) {
      kycjaDirekte().then(function () { __kycjaEKonfirmuar = true; }, function () { /* pret veprimin e përdoruesit */ });
    } else {
      liroKycjen();
    }
    kontrolloNesePermbys();
    zbatoKunderRrotullimin();
  }

  // Veprimi i parë i përdoruesit (prekje ose tast/skaner) pas hapjes ose rikthimit në app: aty
  // lejohet fullscreen-i, ndaj e provojmë kyçjen e plotë nëse s'është konfirmuar ende.
  function neVeprimTePerdoruesit() {
    if (opsione.pda && !__kycjaEKonfirmuar) provoKycjenPda();
  }
  document.addEventListener('pointerdown', neVeprimTePerdoruesit, true);
  document.addEventListener('keydown', neVeprimTePerdoruesit, true);

  function pasNdryshimitTeOrientimit() {
    kontrolloNesePermbys();
    zbatoKunderRrotullimin();
    if (opsione.pda) kycjaDirekte().then(function () { __kycjaEKonfirmuar = true; }, function () { __kycjaEKonfirmuar = false; });
    if ($('dlgAfatLexim').classList.contains('hapur')) vizatoNumratMbiFoton($('lxFoto'), $('lxNumrat'), lx.rreshtat);
    if ($('dlgImportStok').classList.contains('hapur')) vizatoNumratMbiFoton($('impFoto'), $('impNumrat'), imp.rreshtat);
  }
  window.addEventListener('orientationchange', function () { setTimeout(pasNdryshimitTeOrientimit, 60); });
  window.addEventListener('resize', pasNdryshimitTeOrientimit);
  if (screen.orientation && screen.orientation.addEventListener) {
    screen.orientation.addEventListener('change', pasNdryshimitTeOrientimit);
  }
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) { __kycjaEKonfirmuar = false; zbatoRrotullimin(); }
  });
  document.addEventListener('fullscreenchange', function () {
    // Nëse përdoruesi del nga fullscreen-i (gjest "mbrapa"), kyçja humbet — provohet sërish në veprimin tjetër.
    if (!document.fullscreenElement) { __hymeNeFullscreenPerKycje = false; __kycjaEKonfirmuar = false; }
  });
  kontrolloNesePermbys();

  // Kthen kursorin te fusha e barkodit (vetëm në modalitetin PDA, dhe vetëm nëse nuk ka dritare të hapur)
  function fokusoBarkodin() {
    if (!opsione.pda) return;
    if (window.StokuPorta && window.StokuPorta.eHapur()) return; // ekrani i hyrjes është sipër
    if (folderiAktual === null) return;
    if (document.querySelector('.mbulese.hapur')) return;
    $('barkodi').focus();
  }

  zbatoPda();
  perkthoStatiket();

  // ---------- Tabet e Opsioneve ----------
  // Cilësimet → Stoku: e shohin të gjithë; furnizuesit dhe produktet i ndryshon vetëm administratori (v199).
  // v202: Furnizuesit, Produktet e reja dhe Produktet janë nënfaqe të Stoku-t (hapen me prekje, "←" kthehet te Stoku)
  var faqjaEOpsioneve = null;
  var PRINDI_I_FAQES = { furnPritje: 'lista', furnizuesit: 'lista', pritje: 'lista', produktet: 'lista', perdoruesi: 'perdoruesit', perdoruesiAfatet: 'perdoruesi' };
  var TITULLI_I_NENFAQES = { furnPritje: 'Furnizuesit e rinj', furnizuesit: 'Furnizuesit', pritje: 'Produktet e reja', produktet: 'Produktet', perdoruesi: 'Përdoruesi',
    marketet: 'Marketet', perdoruesiAfatet: 'Afatet', harta: 'Harta' };
  function neFaqenEStokut() { return !!faqjaEOpsioneve && (faqjaEOpsioneve === 'lista' || PRINDI_I_FAQES[faqjaEOpsioneve] === 'lista'); }
  // Ndryshoi diçka (llogaria, kujtesa nga grupi): rifresko vetëm atë që shihet tani te Cilësimet → Stoku
  function rifreskoStokunNeCilesime() {
    rifreskoStatusinEStokut();
    if (!neFaqenEStokut() || !$('dlgOpsione').classList.contains('hapur')) return;
    if (faqjaEOpsioneve === 'lista') rifreskoHyrjetEStokut();
    else if (faqjaEOpsioneve === 'furnizuesit' || faqjaEOpsioneve === 'furnPritje') { if (furnNeEditim === null) rifreskoFurnizuesit(); }
    else if (kujNeEditim === null) rifreskoKujtesen();
  }
  window.addEventListener('stoku-auth-ndryshoi', function () {
    if (!neFaqenEStokut()) return;
    furnNeEditim = null; kujNeEditim = null; rifreskoStokunNeCilesime();
  });
  function aktivizoTabin(emriFaqes) {
    if (emriFaqes === 'ora' && !leja('ora')) return;
    if ((emriFaqes === 'lista' || PRINDI_I_FAQES[emriFaqes] === 'lista') && !leja('stoku')) return; // Cilësimet → Stoku
    if ((emriFaqes === 'perdoruesit' || emriFaqes === 'perdoruesi' || emriFaqes === 'perdoruesiAfatet') && !eshteAdminiIStokut()) emriFaqes = null;
    if (emriFaqes === 'marketet' && !leja('afatet')) emriFaqes = null;
    if (emriFaqes === 'harta' && !lejaHarta()) emriFaqes = null;
    if (emriFaqes === 'marketet') { mkNeEditim = null; $('mkEmriRi').value = ''; vizatoMarketetNeCilesime(); }
    if (emriFaqes === 'perdoruesiAfatet') pdVizatoAfatet();
    var neMenu = !emriFaqes;
    faqjaEOpsioneve = emriFaqes || null;
    if (emriFaqes === 'lista') rifreskoHyrjetEStokut();
    if (emriFaqes === 'furnizuesit' || emriFaqes === 'furnPritje') { furnNeEditim = null; $('furnKerko').value = ''; rifreskoFurnizuesit(); }
    if (emriFaqes === 'pritje' || emriFaqes === 'produktet') { kujNeEditim = null; $('kujtesaKerko').value = ''; kujSaShfaqen = pritjeSaShfaqen = KUJ_MAKS; rifreskoKujtesen(); }
    if (emriFaqes === 'perdoruesit') { if (!pd.uid) $('pdKerko').value = ''; pd.uid = null; pdShenoTeParet(); pdVizatoListen(); }
    if (emriFaqes === 'perdoruesi') pdVizatoDetajet();
    if (emriFaqes === 'harta') htHapFaqen(false);
    $('kategoriMenu').style.display = neMenu ? '' : 'none';
    Array.prototype.forEach.call(document.querySelectorAll('.opsione-faqe'), function (f) {
      f.classList.toggle('aktiv', f.getAttribute('data-faqe') === emriFaqes);
    });
    $('opsioneTitulli').textContent = neMenu ? T('opsioneTitulli') : (TITULLI_I_NENFAQES[emriFaqes] || T(TAB_TITULL_KYC[emriFaqes] || 'opsioneTitulli'));
    $('opsPrapa').style.display = neMenu ? 'none' : '';
    var trupi = document.querySelector('.opsione-trup');
    if (trupi) trupi.scrollTop = 0;
    if (typeof sinkronizoHistorineEDritareve === 'function') sinkronizoHistorineEDritareve();
  }
  var TAB_TITULL_KYC = {
    pamja: 'tabPamja', skenimi: 'tabSkenimi', njoftimet: 'tabNjoftimet', ora: 'tabOra',
    lista: 'tabLista', llogaria: 'tabLlogaria', perdoruesit: 'tabPerdoruesit'
  };
  Array.prototype.forEach.call(document.querySelectorAll('#kategoriMenu [data-faqe]'), function (b) {
    b.addEventListener('click', function () { aktivizoTabin(b.getAttribute('data-faqe')); });
  });
  Array.prototype.forEach.call(document.querySelectorAll('#stokuHyrjet [data-nenfaqe]'), function (b) {
    b.addEventListener('click', function () { aktivizoTabin(b.getAttribute('data-nenfaqe')); });
  });
  // Rreshtat te Cilësimet → Stoku: sa furnizues, sa produkte presin kontrollin, sa produkte
  function rifreskoHyrjetEStokut() {
    var k = KJ(), l = k ? k.lista() : [];
    var nP = l.filter(function (x) { return x.nePritje; }).length, nK = l.length - nP;
    var lf = window.StokuAfatet.listaEFurnizuesve(afatet, produktet, l, k ? k.furnizuesit() : []);
    var nFP = lf.filter(function (f) { return f.nePritje; }).length, nF = lf.length - nFP;
    $('stFurnizuesitStatus').textContent = nF ? sasiaETekst(nF, 'furnizues', 'furnizues') : 'Ende s\'ka';
    $('stFurnPritje').style.display = nFP ? '' : 'none';
    $('stFurnPritjeStatus').textContent = nFP === 1 ? '1 pret kontrollin' : nFP + ' presin kontrollin';
    $('stPritje').style.display = nP ? '' : 'none';
    $('stPritjeStatus').textContent = nP === 1 ? '1 pret kontrollin' : nP + ' presin kontrollin';
    $('stPritjeStatus').classList.add('kat-status--pritje');
    $('stProduktetStatus').textContent = nK ? sasiaETekst(nK, 'produkt', 'produkte') : 'Ende s\'ka';
  }
  // Renditja: rreshtat me rreth (radio) e ndryshojnë select-in e fshehur #opsRendi (që ruan logjikën e vjetër)
  function rifreskoRenditjen() {
    Array.prototype.forEach.call(document.querySelectorAll('#rendiLista button'), function (b) {
      var po = b.getAttribute('data-v') === opsione.rendi;
      b.classList.toggle('aktiv', po);
      b.setAttribute('aria-pressed', po ? 'true' : 'false');
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll('#rendiLista button'), function (b) {
    b.addEventListener('click', function () {
      $('opsRendi').value = b.getAttribute('data-v');
      $('opsRendi').dispatchEvent(new Event('change'));
      rifreskoRenditjen();
    });
  });
  // ---------- Furnizuesit (Cilësimet → Stoku): i sheh kushdo, emrat i ndryshon vetëm administratori ----------
  // Lista e krejt furnizuesve të afateve/produkteve, me ndryshim emri (edhe bashkim i dy furnizuesve në një).
  // v205: edhe furnizuesit e produkteve të grupit (kujtesa); ata që dalin vetëm te produktet e reja të kolegëve
  // presin te "Furnizuesit e rinj" derisa administratori t'i kontrollojë produktet e tyre.
  var ADMIN_I_STOKUT = 'mendurberisha';
  var furnNeEditim = null; // emri i furnizuesit që po ndryshohet tani
  function eshteAdminiIStokut() { return !!perdoruesiAktual() && emriPerdoruesitAktual() === ADMIN_I_STOKUT; }
  function sasiaETekst(n, nje, shume) { return n + ' ' + (n === 1 ? nje : shume); }
  function rifreskoFurnizuesit() {
    var sek = $('furnSeksion');
    if (!sek) return;
    var admin = eshteAdminiIStokut();
    if (!admin) furnNeEditim = null;
    $('furnIntro').textContent = admin ? 'Furnizuesit e regjistrit të Stoku-t (krejt llogaritë). Ndrysho emrin e një furnizuesi: ndryshon te krejt afatet dhe produktet. Nëse i jep emrin e një furnizuesi tjetër, të dy bashkohen në një.'
      : 'Furnizuesit e regjistrit të Stoku-t (të njëjtët për krejt llogaritë) dhe të afateve të tua. Emrat i ndryshon vetëm administratori.';
    $('furnPritjeIntro').textContent = admin ? 'Furnizuesit e rinj, të kolegëve dhe ata që i shton ti. Prek njërin: ruaje ashtu siç është ose ndrysho emrin (ndryshon te krejt produktet e tij), pastaj kalon te Furnizuesit. Fshirja e produkteve s\'e fshin furnizuesin.'
      : 'Furnizuesit e rinj. I kontrollon administratori, pastaj kalojnë te Furnizuesit.';
    if (admin) ruajFurnizuesitEMiratuar();
    var AFL = window.StokuAfatet, kj = KJ();
    var teGjithe = AFL.listaEFurnizuesve(afatet, produktet, kj ? kj.lista() : [], kj ? kj.furnizuesit() : []);
    // v212: të ruajturit nga administratori në krye, më i riu i pari
    var pritje = AFL.renditSipasRuajtjes(teGjithe.filter(function (f) { return f.nePritje; }));
    var lista = AFL.renditSipasRuajtjes(teGjithe.filter(function (f) { return !f.nePritje; }));
    var cp = $('furnPritjeLista'); cp.textContent = '';
    if (!pritje.length) { var bp = document.createElement('div'); bp.className = 'ops-furn-bosh'; bp.textContent = 'Asnjë furnizues i ri për kontroll.'; cp.appendChild(bp); }
    pritje.forEach(function (f) { cp.appendChild(f.emri === furnNeEditim ? rreshtIEditimitTeFurnizuesit(f, teGjithe) : rreshtIFurnizuesit(f, admin)); });
    var k = ($('furnKerko').value || '').trim().toLocaleLowerCase('sq');
    $('furnKerkoKuti').hidden = lista.length < 8 && !k;
    var cont = $('furnLista');
    cont.textContent = '';
    var fil = lista.filter(function (f) { return !k || f.emri.toLocaleLowerCase('sq').indexOf(k) !== -1; });
    if (!fil.length) {
      var bosh = document.createElement('div'); bosh.className = 'ops-furn-bosh';
      bosh.textContent = lista.length ? 'Asnjë furnizues me këtë emër.' : 'Ende s\'ka furnizues. Shfaqen këtu kur shton afate me furnizues.';
      cont.appendChild(bosh);
      return;
    }
    fil.forEach(function (f) { cont.appendChild(f.emri === furnNeEditim ? rreshtIEditimitTeFurnizuesit(f, teGjithe) : rreshtIFurnizuesit(f, admin)); });
  }
  function nenTekstiFurnizuesit(f) {
    return [f.afate ? sasiaETekst(f.afate, 'afat', 'afate') : '', f.produkte ? sasiaETekst(f.produkte, 'produkt', 'produkte') : '',
      f.nePritje && f.nga && f.nga.length ? 'nga ' + f.nga.join(', ') : ''].filter(Boolean).join(' · ') || 'Pa produkte';
  }
  // v207: administratori: furnizuesit ruhen më vete, që të mos fshihen kur fshihen produktet e tyre. v238: emrat pa asnjë
  // hyrje ruhen NË PRITJE (më parë si të kontrolluar: kalonin te Furnizuesit pa kontroll); të fshirët s'preken.
  function ruajFurnizuesitEMiratuar() {
    try {
      var k = KJ(); if (!k || !k.regjistroFurnizuesit || !eshteAdminiIStokut()) return;
      // v209: vetëm nga afatet/stoku i administratorit dhe produktet e kontrolluara prej tij; jo nga ato që Stoku i mësoi
      // vetë nga afatet e kolegëve (furnizuesit e tyre të rinj presin kontrollin)
      var l = window.StokuAfatet.listaEFurnizuesve(afatet, produktet, k.lista().filter(function (x) { return x.ngaAdmini; }), []);
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
    toast('"' + f.emri + '" u fshi' + (n > 0 ? '. ' + sasiaETekst(n, 'produkt mbeti', 'produkte mbetën') + ' pa furnizues.' : '.'));
  }
  function rreshtIFurnizuesit(f, admin) {
    var b = document.createElement(admin ? 'button' : 'div'); b.className = 'ops-furn-rresht';
    var ik = document.createElement('span'); ik.className = 'kat-ikona-badge ' + (f.nePritje ? 'ngj-vjollce' : 'ngj-portokalli') + ' ops-furn-ik'; ik.textContent = (f.emri.charAt(0) || '?').toUpperCase();
    var t = document.createElement('span'); t.className = 'ops-rresht__tekst';
    var e = document.createElement('span'); e.className = 'ops-furn-emri'; e.textContent = f.emri;
    var n = document.createElement('span'); n.className = 'hint'; n.textContent = nenTekstiFurnizuesit(f);
    t.appendChild(e); t.appendChild(n);
    b.appendChild(ik); b.appendChild(t);
    if (!admin) return b; // vetëm për t'u parë
    b.type = 'button';
    b.appendChild(lapsi());
    b.setAttribute('aria-label', 'Ndrysho emrin e furnizuesit ' + f.emri);
    b.addEventListener('click', function () {
      furnNeEditim = f.emri;
      rifreskoFurnizuesit();
      var inp = document.querySelector('#furnPritjeLista .ops-furn-edit input, #furnLista .ops-furn-edit input');
      if (inp) { inp.focus(); inp.select(); }
    });
    return b;
  }
  function rreshtIEditimitTeFurnizuesit(f, lista) {
    var w = document.createElement('div'); w.className = 'ops-furn-edit';
    var lbl = document.createElement('div'); lbl.className = 'hint'; lbl.textContent = 'Emri i ri për "' + f.emri + '" (' + nenTekstiFurnizuesit(f) + ')';
    var inp = document.createElement('input'); inp.type = 'text'; inp.value = f.emri; inp.maxLength = 80;
    inp.setAttribute('autocomplete', 'off'); inp.setAttribute('spellcheck', 'false'); inp.setAttribute('aria-label', 'Emri i ri i furnizuesit');
    var gab = document.createElement('div'); gab.className = 'hint ops-furn-gabim';
    var rr = document.createElement('div'); rr.className = 'ops-furn-veprime';
    var fshi = document.createElement('button'); fshi.type = 'button'; fshi.className = 'btn ops-btn-dyte ops-kuj-harro'; fshi.textContent = 'Fshije';
    var anulo = document.createElement('button'); anulo.type = 'button'; anulo.className = 'btn ops-btn-dyte'; anulo.textContent = 'Anulo';
    var ruaj = document.createElement('button'); ruaj.type = 'button'; ruaj.className = 'btn'; ruaj.textContent = 'Ruaj';
    fshi.addEventListener('click', function () { fshijFurnizuesin(f); });
    anulo.addEventListener('click', function () { furnNeEditim = null; rifreskoFurnizuesit(); });
    ruaj.addEventListener('click', function () { ruajEmrinEFurnizuesit(f, lista, inp.value, gab); });
    inp.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); ruaj.click(); }
      else if (ev.key === 'Escape') { ev.preventDefault(); anulo.click(); }
    });
    rr.appendChild(fshi); rr.appendChild(anulo); rr.appendChild(ruaj);
    w.appendChild(lbl); w.appendChild(inp); w.appendChild(gab); w.appendChild(rr);
    return w;
  }
  function lapsi() {
    var laps = document.createElement('span'); laps.className = 'ops-furn-laps';
    laps.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>';
    return laps;
  }
  async function ruajEmrinEFurnizuesit(f, lista, vlera, gab) {
    if (!eshteAdminiIStokut()) { furnNeEditim = null; rifreskoFurnizuesit(); return; }
    var AFL = window.StokuAfatet;
    var emriRi = String(vlera || '').replace(/\s+/g, ' ').trim();
    if (!emriRi) { gab.textContent = 'Shkruaj emrin e furnizuesit.'; return; }
    if (emriRi === f.emri) { // pa ndryshim emri: furnizuesi i ri (në pritje) ruhet si i kontrolluar
      if (f.nePritje && KJ()) { KJ().regjistroFurnizuesit([f.emri], true); toast('"' + f.emri + '" kaloi te Furnizuesit.'); }
      furnNeEditim = null; rifreskoFurnizuesit(); return;
    }
    var ekz = AFL.furnizuesiEkzistues(lista, emriRi, f.emri);
    if (ekz) {
      var tjetri = lista.filter(function (x) { return x.emri === ekz; })[0];
      var po = await konfirmo('Të bashkohen furnizuesit?',
        '"' + f.emri + '" (' + nenTekstiFurnizuesit(f) + ') dhe "' + ekz + '" (' + nenTekstiFurnizuesit(tjetri) + ') do të bashkohen në një furnizues: "' + emriRi + '".',
        'Bashkoji');
      if (!po) return;
    }
    var rez = AFL.riemertoFurnizuesin(afatet, produktet, f.emri, emriRi);
    if (ekz && ekz !== emriRi) { // bashkimi: edhe tjetri merr saktësisht emrin e shkruar
      var rez2 = AFL.riemertoFurnizuesin(rez.afatet, rez.produktet, ekz, emriRi);
      rez = { afatet: rez2.afatet, produktet: rez2.produktet, nAfate: rez.nAfate + rez2.nAfate, nProdukte: rez.nProdukte + rez2.nProdukte };
    }
    afatet = rez.afatet;
    var nKuj = 0;
    try { if (KJ()) { nKuj = KJ().riemertoFurnizuesin(f.emri, emriRi); if (ekz && ekz !== emriRi) nKuj += KJ().riemertoFurnizuesin(ekz, emriRi); } } catch (e) { /* ok */ }
    if (rez.nProdukte) { produktet = rez.produktet; ruajBaze(); }
    ruajAfatet();
    furnNeEditim = null;
    rifreskoFurnizuesit();
    var nP = Math.max(rez.nProdukte, nKuj), det = [rez.nAfate ? sasiaETekst(rez.nAfate, 'afat', 'afate') : '', nP ? sasiaETekst(nP, 'produkt', 'produkte') : ''].filter(Boolean).join(', ');
    toast('"' + f.emri + '" u bë "' + emriRi + '"' + (det ? ' (' + det + ')' : '') + '.');
  }
  $('furnKerko').addEventListener('input', function () { furnNeEditim = null; rifreskoFurnizuesit(); });

  // ---------- Produktet (Cilësimet → Stoku): kujtesa e produkteve në këtë pajisje (barkodi → emri, furnizuesi) ----------
  // v203: shfaqen 100 në fillim; butoni "Shfaq edhe …" në fund i shton 100 të tjera
  var kujNeEditim = null, KUJ_MAKS = 100, kujSaShfaqen = KUJ_MAKS, pritjeSaShfaqen = KUJ_MAKS;
  function rifreskoKujtesen() {
    var tr = document.querySelector('.opsione-trup'), y = tr ? tr.scrollTop : 0;
    vizatoKujtesen();
    if (tr) tr.scrollTop = y; // lista vizatohet sërish: pozicioni mbetet aty ku ishte
  }
  function butoniMeShume(shfaqur, gjithsej, kurKlikohet) {
    var mbeten = gjithsej - shfaqur, n = Math.min(KUJ_MAKS, mbeten);
    var b = document.createElement('button'); b.type = 'button'; b.className = 'ops-me-shume';
    b.textContent = 'Shfaq edhe ' + sasiaETekst(n, 'produkt', 'produkte') + (n < mbeten ? ' (mbeten ' + mbeten + ')' : '');
    b.addEventListener('click', kurKlikohet);
    return b;
  }
  function vizatoKujtesen() {
    var cont = $('kujtesaLista'); if (!cont) return;
    var admin = eshteAdminiIStokut();
    if (!admin) kujNeEditim = null;
    $('kujtesaIntro').textContent = admin ? 'Emri dhe furnizuesi që Stoku i mban mend për çdo barkod; krejt llogaritë e Stoku-t i shohin kur skanojnë. Produktet e reja (të kujtdo, edhe ato që i shton ti) dalin këtu pasi t\'i kontrollosh te Produktet e reja. Atë që e ndryshon ti s\'e ndryshon askush tjetër. Prek një produkt për ta ndryshuar.'
      : 'Regjistri i Stoku-t: emri dhe furnizuesi për çdo barkod, i njëjtë për krejt llogaritë; plotësohen vetë kur skanon. Produktet e reja i kontrollon dhe i ndryshon vetëm administratori.';
    var k = KJ(), teGjitha = k ? k.lista() : [];
    // v201: produktet e shkruara nga kolegët presin te "Produktet e reja" derisa t'i kontrollojë dhe ruajë administratori
    var lista = window.StokuAfatet.renditSipasRuajtjes(teGjitha.filter(function (x) { return !x.nePritje; })); // v212: të ruajturat e fundit në krye
    rifreskoPritjen(teGjitha.filter(function (x) { return x.nePritje; }), admin);
    rifreskoStatusinEStokut();
    var q = ($('kujtesaKerko').value || '').trim().toLocaleLowerCase('sq');
    $('kujtesaKerkoKuti').hidden = lista.length < 8 && !q;
    var fil = q ? lista.filter(function (x) { return (x.emri + ' ' + x.barkodi + ' ' + x.furnizuesi).toLocaleLowerCase('sq').indexOf(q) !== -1; }) : lista;
    cont.textContent = '';
    if (!fil.length) {
      var bosh = document.createElement('div'); bosh.className = 'ops-furn-bosh';
      bosh.textContent = lista.length ? 'Asnjë produkt me këtë kërkim.' : 'Ende s\'ka produkte. Shfaqen këtu kur ruan një afat ose produkt me barkod.';
      cont.appendChild(bosh);
      return;
    }
    fil.slice(0, kujSaShfaqen).forEach(function (x) { cont.appendChild(x.barkodi === kujNeEditim ? rreshtIEditimitTeKujteses(x) : rreshtIKujteses(x, admin)); });
    if (fil.length > kujSaShfaqen) cont.appendChild(butoniMeShume(kujSaShfaqen, fil.length, function () { kujSaShfaqen += KUJ_MAKS; rifreskoKujtesen(); }));
  }
  function rifreskoPritjen(pritje, admin) {
    $('kujPritjeIntro').textContent = admin ? 'Produktet e reja, të kolegëve dhe ato që i shton ti. Kontrolloji emrat dhe ruaji: pastaj kalojnë te Produktet.'
      : 'Produktet e reja. I kontrollon administratori, pastaj kalojnë te Produktet.';
    var cont = $('kujPritjeLista'); cont.textContent = '';
    if (!pritje.length) { var bosh = document.createElement('div'); bosh.className = 'ops-furn-bosh'; bosh.textContent = 'Asnjë produkt i ri për kontroll.'; cont.appendChild(bosh); return; }
    pritje.sort(function (a, b) { return b.koha - a.koha; }); // më të rejat lart
    pritje.slice(0, pritjeSaShfaqen).forEach(function (x) { cont.appendChild(x.barkodi === kujNeEditim ? rreshtIEditimitTeKujteses(x) : rreshtIKujteses(x, admin)); });
    if (pritje.length > pritjeSaShfaqen) cont.appendChild(butoniMeShume(pritjeSaShfaqen, pritje.length, function () { pritjeSaShfaqen += KUJ_MAKS; rifreskoKujtesen(); }));
  }
  // Te menyja e Cilësimeve: administratori sheh sa produkte presin kontrollin, të tjerët renditjen
  function rifreskoStatusinEStokut() {
    var el = $('tabListaStatus'); if (!el) return;
    var n = 0;
    try { n = eshteAdminiIStokut() && KJ() ? KJ().numriNePritje() : 0; } catch (e) { n = 0; }
    var rendiKyc = { i_ri: 'iRiOpt', emri: 'emriAZ', emriZA: 'emriZAOpt', sasiaUlet: 'sasiaUletOpt', sasiaLart: 'sasiaLartOpt' }[opsione.rendi];
    el.textContent = n ? (n === 1 ? '1 produkt i ri për kontroll' : n + ' produkte të reja për kontroll') : (rendiKyc ? T(rendiKyc) : '');
    el.classList.toggle('kat-status--pritje', !!n);
  }
  function rreshtIKujteses(x, admin) {
    var b = document.createElement(admin ? 'button' : 'div'); b.className = 'ops-furn-rresht';
    var ik = document.createElement('span'); ik.className = 'kat-ikona-badge ' + (x.nePritje ? 'ngj-portokalli' : 'ngj-blu') + ' ops-furn-ik'; ik.textContent = ((x.emri || x.barkodi).charAt(0) || '?').toUpperCase();
    var t = document.createElement('span'); t.className = 'ops-rresht__tekst';
    var e = document.createElement('span'); e.className = 'ops-furn-emri'; e.textContent = x.emri || 'Pa emër';
    var n = document.createElement('span'); n.className = 'hint'; n.textContent = [x.barkodi, x.furnizuesi, !x.ngaAdmini && x.nga ? 'nga ' + x.nga : ''].filter(Boolean).join(' · ');
    t.appendChild(e); t.appendChild(n);
    b.appendChild(ik); b.appendChild(t);
    if (!admin) return b; // vetëm për t'u parë
    b.type = 'button';
    b.appendChild(lapsi());
    b.setAttribute('aria-label', 'Ndrysho produktin ' + (x.emri || x.barkodi));
    b.addEventListener('click', function () {
      kujNeEditim = x.barkodi;
      rifreskoKujtesen();
      var inp = document.querySelector('#kujPritjeLista .ops-furn-edit input, #kujtesaLista .ops-furn-edit input'); if (inp) inp.focus();
    });
    return b;
  }
  function rreshtIEditimitTeKujteses(x) {
    var w = document.createElement('div'); w.className = 'ops-furn-edit';
    var lbl = document.createElement('div'); lbl.className = 'hint'; lbl.textContent = 'Barkodi ' + x.barkodi + (x.nePritje && x.nga ? ' · e shkroi ' + x.nga : '');
    var ie = document.createElement('input'); ie.type = 'text'; ie.value = x.emri; ie.maxLength = 120; ie.placeholder = 'Emri i produktit';
    ie.setAttribute('autocomplete', 'off'); ie.setAttribute('aria-label', 'Emri i produktit');
    mbushFurnizuesit();
    var ifu = document.createElement('input'); ifu.type = 'text'; ifu.value = x.furnizuesi; ifu.maxLength = 80; ifu.placeholder = 'Furnizuesi';
    ifu.setAttribute('autocomplete', 'off'); ifu.setAttribute('aria-label', 'Furnizuesi'); ifu.setAttribute('list', 'afFurnizuesit');
    var rr = document.createElement('div'); rr.className = 'ops-furn-veprime';
    var harro = document.createElement('button'); harro.type = 'button'; harro.className = 'btn ops-btn-dyte ops-kuj-harro'; harro.textContent = 'Fshije';
    var anulo = document.createElement('button'); anulo.type = 'button'; anulo.className = 'btn ops-btn-dyte'; anulo.textContent = 'Anulo';
    var ruaj = document.createElement('button'); ruaj.type = 'button'; ruaj.className = 'btn'; ruaj.textContent = 'Ruaj';
    anulo.addEventListener('click', function () { kujNeEditim = null; rifreskoKujtesen(); });
    harro.addEventListener('click', function () { if (!eshteAdminiIStokut()) { anulo.click(); return; } if (KJ()) KJ().fshij(x.barkodi); kujNeEditim = null; rifreskoKujtesen(); toast('"' + (x.emri || x.barkodi) + '" u fshi nga produktet.'); });
    ruaj.addEventListener('click', function () {
      if (!eshteAdminiIStokut()) { anulo.click(); return; }
      if (KJ()) KJ().vendos(x.barkodi, ie.value, ifu.value);
      kujNeEditim = null; rifreskoKujtesen(); toast((x.nePritje ? 'U ruajt dhe kaloi te Produktet: ' : 'U ruajt: ') + (ie.value.trim() || x.barkodi));
    });
    [ie, ifu].forEach(function (inp) {
      inp.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') { ev.preventDefault(); if (inp === ie) ifu.focus(); else ruaj.click(); }
        else if (ev.key === 'Escape') { ev.preventDefault(); anulo.click(); }
      });
    });
    rr.appendChild(harro); rr.appendChild(anulo); rr.appendChild(ruaj);
    w.appendChild(lbl); w.appendChild(ie); w.appendChild(ifu); w.appendChild(rr);
    return w;
  }
  $('kujtesaKerko').addEventListener('input', function () { kujNeEditim = null; kujSaShfaqen = KUJ_MAKS; rifreskoKujtesen(); });

  // Karta e profilit në krye të Cilësimeve + avatari te Llogaria
  function shkronjaEPare(emri) { return (String(emri || '').trim().charAt(0) || '?').toUpperCase(); }
  function rifreskoProfilin() {
    var u = perdoruesiAktual();
    var emri = u ? emriPerdoruesitAktual() : '';
    $('opsProfilAv').textContent = u ? shkronjaEPare(emri) : '?';
    $('opsProfilAv').classList.toggle('bosh', !u);
    $('opsLlAv').textContent = shkronjaEPare(emri);
    var FT = window.StokuEkipa && window.StokuEkipa.Fotot;
    if (FT) {
      var kush = u ? { uid: u.uid, emri: emri } : null;
      FT.apliko($('opsProfilAv'), kush); FT.apliko($('opsLlAv'), kush);
      var kaFoto = !!(u && FT.url(u.uid));
      $('opsFotoNdrysho').textContent = kaFoto ? 'Ndrysho foton' : 'Shto foto';
      $('opsFotoHiq').style.display = kaFoto ? '' : 'none';
    }
    $('opsProfilEmri').textContent = u ? emri : ngaVizitori() ? 'Vizitor' : 'Pa llogari';
    $('opsProfilSub').textContent = u ? (statusiCloudFundit || T('cloudStatusiAsgje')) : ngaVizitori() ? 'Provë pa llogari, vetëm në këtë telefon' : 'Hyr që lista të ruhet edhe në internet';
    var TR = window.StokuTeRejat;
    var v = TR && TR.versioni ? TR.versioni() : 0;
    $('opsVersioni').textContent = v ? ' ' + TR.emriVersionit(v) : '';
    $('opsTeRejatStatus').textContent = v ? 'Ndryshimet e fundit në Stoku' : '';
  }
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
    $('opsFotoHint').textContent = r.ok ? '' : tekstiGabimitFotos(r.arsye);
    if (r.ok) toast(veprimi === 'hiq' ? 'Fotoja u hoq.' : 'Fotoja u ruajt. E sheh krejt grupi.');
    rifreskoProfilin();
  }
  $('opsFotoNdrysho').addEventListener('click', function () { $('opsFotoSkedari').value = ''; $('opsFotoSkedari').click(); });
  $('opsLlAv').addEventListener('click', function () { $('opsFotoNdrysho').click(); });
  $('opsFotoSkedari').addEventListener('change', function () { var f = this.files && this.files[0]; if (f) veproMeFoton('ngarko', f); });
  $('opsFotoHiq').addEventListener('click', async function () {
    if (await konfirmo('Ta heqim foton?', 'Në vend të fotos do të dalë shkronja e emrit tënd.', 'Hiqe')) veproMeFoton('hiq');
  });
  window.addEventListener('stoku-fotot-ndryshuan', rifreskoProfilin);

  // Në menunë kryesore të Opsioneve, "←" i mbyll Opsionet krejtësisht (kthehu te faqja kryesore);
  // brenda një kategorie, i njëjti buton kthehet vetëm te menuja e Opsioneve.
  $('opsPrapa').addEventListener('click', function () {
    if (PRINDI_I_FAQES[faqjaEOpsioneve]) aktivizoTabin(PRINDI_I_FAQES[faqjaEOpsioneve]);
    else if ($('kategoriMenu').style.display === 'none') aktivizoTabin(null);
    else mbyllOpsionet();
  });

  // Dialogu i opsioneve
  function rifreskoStatusetOpsioneve() {
    $('tabPamjaStatus').textContent = T(zgjedhjaETemes() === 'dark' ? 'eErret' : (zgjedhjaETemes() === 'light' ? 'eCelet' : 'automatike'));
    $('tabSkenimiStatus').textContent = T(opsione.pda ? 'pdaStatusNdezur' : 'pdaStatusFikur');
    rifreskoStatusinEStokut();
    var u = perdoruesiAktual();
    var emriStatus = u ? emriPerdoruesitAktual() : T('cloudStatusJoKycur');
    $('tabLlogariaStatus').textContent = emriStatus;
    rifreskoProfilin();
    rifreskoNjoftimet();
    pdRifresko();
  }

  // ---------- Cilësimet → Përdoruesit (v230, vetëm administratori): krejt llogaritë dhe lejet e secilës ----------
  // Llogaritë vijnë nga perdoruesit/{uid}, lejet nga lejet/{uid} (dy dëgjues, vetëm te administratori). Llogaria pa
  // dokument lejesh = "Pa u kontrolluar" (i ka krejt lejet). Çdo ndryshim ruhet menjëherë, e shënon llogarinë si të
  // kontrolluar dhe përdoruesi e sheh në kohë reale. Llogaritë e reja (pas v230) dalin edhe si njoftim dhe si shenjë.
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
  // Krejt llogaritë përveç administratorit, me lejet dhe statusin ('ri' | 'krejt' | 'kufizuar')
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
      if (paNjoftuar.length && faqjaEOpsioneve !== 'perdoruesit') {
        toast((paNjoftuar.length === 1 ? 'Llogari e re: ' + paNjoftuar[0].emri + '. Kontrolloja lejet'
          : paNjoftuar.length + ' llogari të reja. Kontrolloji lejet') + ' te Cilësimet → Përdoruesit.', 5000);
      }
      if (faqjaEOpsioneve === 'perdoruesit' && $('dlgOpsione').classList.contains('hapur')) pdShenoTeParet();
    }
    pdRifresko();
  }
  // Administratori e hapi listën: llogaritë e pakontrolluara s'janë më "të reja" (mbeten te "Pa u kontrolluar")
  function pdShenoTeParet() {
    if (!pd.llogarite || !pd.lejet) return;
    var pare = pdLexoPare() || [];
    pdLista().forEach(function (a) { if (a.statusi === 'ri' && pare.indexOf(a.uid) === -1) pare.push(a.uid); });
    pdRuajPare(pare);
    pd.teReja = 0;
    pdRifresko(true);
  }
  function pdRifresko(paListe) {
    if (!pd || !$('tabPerdoruesit')) return;
    var admin = eshteAdminiIStokut(), gati = admin && !!pd.llogarite && !!pd.lejet;
    $('tabPerdoruesit').hidden = !admin;
    rifreskoTabinHarta();
    if (PK) nisPikat(); // v246: administratori i dëgjon pikat e Stoku-t (harta)
    var rinj = gati ? pdLista().filter(function (a) { return a.statusi === 'ri'; }).length : 0;
    var st = $('tabPerdoruesitStatus');
    st.textContent = !gati ? 'Lejet e secilës llogari' : rinj ? (rinj === 1 ? '1 pa u kontrolluar' : rinj + ' pa u kontrolluar') : sasiaETekst(pdLista().length, 'llogari', 'llogari');
    st.classList.toggle('kat-status--pritje', !!rinj);
    var sh = $('opsShenja'), n = admin ? pd.teReja : 0;
    sh.style.display = n ? '' : 'none';
    sh.textContent = n > 99 ? '99+' : String(n);
    if (paListe || !$('dlgOpsione').classList.contains('hapur')) return;
    if (faqjaEOpsioneve === 'perdoruesit') pdVizatoListen();
    else if (faqjaEOpsioneve === 'perdoruesi') pdVizatoDetajet();
  }
  function pdEl(tag, klasa, tekst) { var e = document.createElement(tag); if (klasa) e.className = klasa; if (tekst !== undefined) e.textContent = tekst; return e; }
  function pdInfo(tekst, paralajmerim) {
    var k = pdEl('div', 'ops-karta pd-info' + (paralajmerim ? ' pd-info--kujdes' : ''));
    k.appendChild(pdEl('div', 'hint', tekst));
    return k;
  }
  function pdNenTeksti(a) {
    var K = window.StokuEkipa, n = window.StokuLejet.teNdaluara(a.dok && a.dok.lejet);
    var p1 = a.statusi === 'ri' ? (a.krijuarSe ? 'Llogari e re, ' + K.kohaRelative(a.krijuarSe) : 'Pa u kontrolluar: krejt lejet')
      : a.statusi === 'kufizuar' ? (n === 1 ? '1 leje e ndaluar' : n + ' leje të ndaluara') : 'Krejt lejet';
    return [p1, pdMerchandiser(a) ? 'merchandiser' : '', a.kycurSe ? 'u kyç ' + K.kohaRelative(a.kycurSe) : ''].filter(Boolean).join(' · ');
  }
  function pdRreshti(a) {
    var b = pdEl('button', 'ops-furn-rresht'); b.type = 'button';
    var ik = pdEl('span', 'kat-ikona-badge ops-furn-ik ' + (a.statusi === 'ri' ? 'ngj-portokalli' : a.statusi === 'kufizuar' ? 'ngj-kuqe' : 'ngj-gjelber'), shkronjaEPare(a.emri));
    var t = pdEl('span', 'ops-rresht__tekst');
    t.appendChild(pdEl('span', 'ops-furn-emri', a.emri));
    t.appendChild(pdEl('span', 'hint' + (a.statusi === 'ri' ? ' kat-status--pritje' : ''), pdNenTeksti(a)));
    b.appendChild(ik); b.appendChild(t); b.appendChild(pdEl('span', 'shigjeta', '›'));
    b.setAttribute('aria-label', 'Lejet e ' + a.emri);
    b.addEventListener('click', function () { pdHap(a.uid); });
    return b;
  }
  function pdVizatoListen() {
    var c = $('pdLista'); if (!c) return;
    c.textContent = '';
    if (!eshteAdminiIStokut()) return;
    if (!pd.llogarite || !pd.lejet) {
      $('pdKerkoKuti').hidden = true;
      c.appendChild(pdInfo(pd.gabimLlogari ? 'Llogaritë s\'u lexuan. Kontrollo internetin dhe provo sërish.' : 'Duke i marrë llogaritë…'));
      if (!pd.ndal.length) pdNis();
      return;
    }
    if (pd.gabimLejet) c.appendChild(pdInfo('Firebase s\'i lejon ende lejet: rregullat e Firestore duhet të përditësohen (v230). Deri atëherë krejt llogaritë i kanë krejt lejet.', true));
    var q = ($('pdKerko').value || '').trim().toLocaleLowerCase('sq');
    var lista = pdLista();
    $('pdKerkoKuti').hidden = lista.length < 8 && !q;
    var fil = q ? lista.filter(function (a) { return String(a.emri).toLocaleLowerCase('sq').indexOf(q) !== -1; }) : lista;
    if (!fil.length) { c.appendChild(pdInfo(q ? 'Asnjë përdorues me këtë emër.' : 'Ende s\'ka llogari të tjera.')); return; }
    var rinj = fil.filter(function (a) { return a.statusi === 'ri'; })
      .sort(function (x, y) { return (y.krijuarSe || y.kycurSe || 0) - (x.krijuarSe || x.kycurSe || 0); });
    var tjeret = fil.filter(function (a) { return a.statusi !== 'ri'; })
      .sort(function (x, y) { return String(x.emri).localeCompare(String(y.emri), 'sq'); });
    [['Pa u kontrolluar', rinj], ['Të kontrolluar', tjeret]].forEach(function (x, i) {
      if (!x[1].length) return;
      c.appendChild(pdEl('div', 'ops-grupi-titull' + (i === 0 || !rinj.length ? ' ops-grupi-titull--pare' : ''), x[0] + ' · ' + x[1].length));
      var g = pdEl('div', 'ops-grupi ops-furn');
      x[1].forEach(function (a) { g.appendChild(pdRreshti(a)); });
      c.appendChild(g);
    });
    if (rinj.length > 1 && !q) {
      var b = pdEl('button', 'btn ops-btn-dyte pd-krejt', 'Shëno krejt "Pa u kontrolluar" si të kontrolluar'); b.type = 'button';
      b.addEventListener('click', async function () {
        var po = await konfirmo('T\'i shënosh të kontrolluar?', rinj.length + ' llogari mbeten me krejt lejet dhe s\'dalin më te "Pa u kontrolluar". Lejet mund t\'i ndryshosh kurdo.', 'Po, shënoji');
        if (!po) return;
        b.disabled = true;
        var r = await window.__stokuCloud.lejet.ruajShume(rinj.map(function (a) { return { uid: a.uid, lejet: window.StokuLejet.krejt(true), emri: a.emri }; }), { nga: emriPerdoruesitAktual() });
        b.disabled = false;
        toast(r.ok ? (r.n === 1 ? '1 llogari u shënua e kontrolluar.' : r.n + ' llogari u shënuan të kontrolluara.')
          : r.arsye === 'leje' ? 'S\'u ruajt: rregullat e Firestore duhet të përditësohen (v230).' : 'S\'u ruajtën krejt. Kontrollo internetin dhe provo sërish.', 4500);
      });
      c.appendChild(b);
    }
  }
  $('pdKerko').addEventListener('input', pdVizatoListen);
  function pdHap(uid) {
    var a = pdLista().filter(function (x) { return x.uid === uid; })[0];
    if (!a) return;
    pd.uid = uid;
    TITULLI_I_NENFAQES.perdoruesi = a.emri;
    aktivizoTabin('perdoruesi');
  }
  // Ruan lejet e një llogarie (e shënon edhe si të kontrolluar)
  function pdRuaj(a, lejet, mesazh) {
    var c = window.__stokuCloud;
    if (!c || !c.lejet || !eshteAdminiIStokut()) return Promise.resolve({ ok: false });
    return c.lejet.ruaj(a.uid, lejet, { nga: emriPerdoruesitAktual(), emri: a.emri }).then(function (r) {
      if (!r.ok) {
        toast(r.arsye === 'leje' ? 'S\'u ruajt: rregullat e Firestore duhet të përditësohen (v230).' : 'S\'u ruajt. Kontrollo internetin dhe provo sërish.', 4500);
        pdRifresko(); // çelësat kthehen si janë në të vërtetë
      } else if (mesazh) toast(mesazh);
      return r;
    });
  }
  // v241: administratori i sheh afatet e një llogarie (p.sh. merchandiser), të grupuara sipas marketeve. Vetëm lexim:
  // dyqani i llogarisë lexohet nga Firebase (rregullat e lejojnë për administratorin), asgjë s'shkruhet.
  var pdAf = { uid: null, rez: null, dukeNgarkuar: false, teHequrat: false };
  function kartaELexuar(a) {
    var st = AF.statusi(a);
    var k = document.createElement('div'); k.className = 'af-karta ' + st; k.style.cursor = 'default';
    k.appendChild(kutiaEDiteve(st, AF.ditetDeri(a.data)));
    var m = document.createElement('div'); m.className = 'af-majtas';
    var e = document.createElement('div'); e.className = 'af-emri'; e.textContent = a.emri || a.barkodi || '(pa emër)'; m.appendChild(e);
    var nen = [a.furnizuesi, AF.sasiaTekst(a), a.data ? AF.formato(a.data) : '', a.krijuarNga ? 'nga ' + a.krijuarNga : ''].filter(Boolean).join(' · ');
    if (nen) { var ne = document.createElement('div'); ne.className = 'af-nen'; ne.textContent = nen; m.appendChild(ne); }
    if (a.emri && a.barkodi) { var kd = document.createElement('div'); kd.className = 'af-kodi'; kd.textContent = a.barkodi; m.appendChild(kd); }
    var ms = document.createElement('div'); ms.className = 'af-mesazh'; ms.textContent = AF.pershkrimi(a); m.appendChild(ms);
    k.appendChild(m);
    return k;
  }
  async function pdVizatoAfatet() {
    var c = $('pdAfatet'); if (!c) return;
    var a = pdLista().filter(function (x) { return x.uid === pd.uid; })[0];
    c.textContent = '';
    if (!eshteAdminiIStokut() || !a) return;
    $('opsioneTitulli').textContent = 'Afatet e ' + a.emri;
    var cl = window.__stokuCloud;
    if (pdAf.uid !== a.uid || !pdAf.rez) {
      c.appendChild(pdInfo('Duke i marrë afatet e ' + a.emri + '…'));
      if (pdAf.dukeNgarkuar || !cl || !cl.merrDyqaninEPerdoruesit) return;
      pdAf.dukeNgarkuar = true; pdAf.uid = a.uid; pdAf.rez = null; pdAf.teHequrat = false;
      var r = await cl.merrDyqaninEPerdoruesit(a.uid);
      pdAf.dukeNgarkuar = false;
      if (pd.uid !== a.uid) return;
      pdAf.rez = r && r.ok ? { afatet: (r.gjendja && r.gjendja.afatet) || [], marketet: (r.gjendja && r.gjendja.marketet) || [] } : { gabim: true };
      if (faqjaEOpsioneve === 'perdoruesiAfatet') pdVizatoAfatet();
      return;
    }
    if (pdAf.rez.gabim) { c.appendChild(pdInfo('Afatet s\'u morën. Kontrollo internetin dhe provo sërish.')); pdAf.rez = null; return; }
    var teGjitha = pdAf.rez.afatet.filter(function (x) { return x && x.id; });
    var lista = teGjitha.filter(function (x) { return pdAf.teHequrat || x.statusi !== 'hequr'; }).sort(AF.krahaso);
    var nH = teGjitha.length - teGjitha.filter(function (x) { return x.statusi !== 'hequr'; }).length;
    var n = AF.numero(teGjitha);
    c.appendChild(pdInfo((n.aktive === 1 ? '1 afat aktiv' : n.aktive + ' afate aktive') + (n.skaduar ? ' · ' + n.skaduar + ' të skaduara' : '') + (n.afer ? ' · ' + n.afer + ' afër skadimit' : '') +
      (pdAf.rez.marketet.length ? ' · ' + sasiaETekst(pdAf.rez.marketet.length, 'market', 'markete') : '') + '.'));
    if (nH) {
      var bh = pdEl('button', 'btn ops-btn-dyte mk-pd-btn', pdAf.teHequrat ? 'Fshih të hequrat' : 'Shfaq edhe të hequrat (' + nH + ')'); bh.type = 'button';
      bh.addEventListener('click', function () { pdAf.teHequrat = !pdAf.teHequrat; pdVizatoAfatet(); });
      c.appendChild(bh);
    }
    if (!lista.length) { c.appendChild(pdInfo('S\'ka afate.')); return; }
    window.StokuMarketet.grupo(lista, pdAf.rez.marketet).forEach(function (gr) {
      var h = pdEl('div', 'af-grup-krye'); h.appendChild(pdEl('span', null, gr.emri + ' · ' + gr.afatet.length)); c.appendChild(h);
      gr.afatet.forEach(function (x) { c.appendChild(kartaELexuar(x)); });
    });
  }
  window.addEventListener('stoku-auth-ndryshoi', function () { pdAf.uid = null; pdAf.rez = null; });

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
    var c = $('pdDetaje'); if (!c) return;
    var L = window.StokuLejet, K = window.StokuEkipa;
    var a = pdLista().filter(function (x) { return x.uid === pd.uid; })[0];
    c.textContent = '';
    if (!eshteAdminiIStokut()) return;
    if (!a) { c.appendChild(pdInfo(pd.llogarite ? 'Kjo llogari s\'ekziston më.' : 'Duke e marrë llogarinë…')); return; }
    var lejet = (a.dok && a.dok.lejet) || null;
    // Koka: emri, statusi, kur u regjistrua / u kyç
    var k = pdEl('div', 'ops-karta');
    var kr = pdEl('div', 'ops-ll-krye');
    kr.appendChild(pdEl('span', 'ops-av ops-av--madh', shkronjaEPare(a.emri)));
    var ki = pdEl('div', 'kat-info');
    ki.appendChild(pdEl('div', 'ops-ll-titull', a.emri));
    var n = L.teNdaluara(lejet);
    ki.appendChild(pdEl('div', 'kat-status' + (a.statusi === 'ri' ? ' kat-status--pritje' : ''), a.statusi === 'ri' ? 'Pa u kontrolluar: i ka krejt lejet'
      : a.statusi === 'kufizuar' ? (n === 1 ? '1 leje e ndaluar' : n + ' leje të ndaluara') : 'Krejt lejet'));
    kr.appendChild(ki);
    k.appendChild(kr);
    var info = [a.krijuarSe ? 'U regjistrua ' + K.kohaRelative(a.krijuarSe) : '', a.kycurSe ? 'U kyç ' + K.kohaRelative(a.kycurSe) : '',
      a.grupi ? 'Në një grup' : 'Pa grup', pdMerchandiser(a) ? 'Merchandiser' : '', a.dok && a.dok.kontrolluarSe ? 'Kontrolluar ' + K.kohaRelative(a.dok.kontrolluarSe) + (a.dok.kontrolluarNga ? ' nga ' + a.dok.kontrolluarNga : '') : ''].filter(Boolean);
    k.appendChild(pdEl('div', 'hint', info.join(' · ') + '.'));
    if (a.statusi === 'ri') {
      k.appendChild(pdEl('div', 'hint', 'Ndalo çka s\'duhet të përdorë (ruhet vetë), ose shtyp "U kontrollua" që t\'i mbajë krejt lejet.'));
      var bk = pdEl('button', 'btn pd-kontrollua', 'U kontrollua'); bk.type = 'button';
      bk.addEventListener('click', function () { bk.disabled = true; pdRuaj(a, pdKrejt(a, true), a.emri + ' u shënua i kontrolluar.').then(function () { bk.disabled = false; }); });
      k.appendChild(bk);
    }
    c.appendChild(k);
    // v241: afatet e kësaj llogarie (vetëm për t'u parë), sipas marketeve
    var ba = pdEl('button', 'btn ops-btn-dyte mk-pd-btn', 'Afatet e ' + a.emri); ba.type = 'button';
    ba.addEventListener('click', function () { aktivizoTabin('perdoruesiAfatet'); });
    c.appendChild(ba);
    // Lejet sipas grupeve; veprimet e një pjese s'vlejnë kur pjesa është e ndaluar
    L.KATALOGU.forEach(function (g) {
      c.appendChild(pdEl('div', 'ops-grupi-titull', g.grupi));
      var gr = pdEl('div', 'ops-grupi pd-lejet');
      g.lejet.forEach(function (l) {
        var sek = pdEl('div', 'seksion' + (l.prindi ? ' pd-femije' : ''));
        var lab = pdEl('label', 'opsion-rresht');
        var id = 'pdLeja_' + l.k;
        lab.htmlFor = id;
        var t = pdEl('span', 'ops-rresht__tekst');
        t.appendChild(pdEl('span', null, l.emri));
        if (l.pershkrim) t.appendChild(pdEl('span', 'hint', l.pershkrim));
        var nd = pdEl('span', 'ndez');
        var inp = document.createElement('input'); inp.type = 'checkbox'; inp.id = id;
        // v241: "Merchandiser" (me zgjedhje): vlera e administratorit, ose ajo e zgjedhur kur u hap llogaria
        inp.checked = l.zgjedhje ? pdMerchandiser(a) : !(lejet && lejet[l.k] === false);
        if (l.prindi && !L.lejohet(lejet, l.prindi)) { inp.disabled = true; sek.classList.add('pd-joaktiv'); }
        inp.addEventListener('change', function () {
          // Gjendja më e fundit (jo ajo e vizatimit): dy prekje të shpejta s'e fshijnë njëra-tjetrën
          var tani = pd.lejet && pd.lejet[a.uid];
          var l2 = L.pastro((tani && tani.lejet) || null);
          l2[l.k] = inp.checked;
          pdRuaj(a, l2);
        });
        nd.appendChild(inp); nd.appendChild(pdEl('span', 'pist'));
        lab.appendChild(t); lab.appendChild(nd);
        sek.appendChild(lab);
        gr.appendChild(sek);
      });
      c.appendChild(gr);
    });
    var r = pdEl('div', 'rreshti pd-veprime');
    var bl = pdEl('button', 'btn ops-btn-dyte', 'Lejo krejt'); bl.type = 'button';
    bl.addEventListener('click', function () { pdRuaj(a, pdKrejt(a, true), a.emri + ' i ka tani krejt lejet.'); });
    var bn = pdEl('button', 'btn ops-btn-dyte pd-rrezik', 'Ndalo krejt'); bn.type = 'button';
    bn.addEventListener('click', async function () {
      var po = await konfirmo('T\'i ndalohen krejt lejet?', a.emri + ' do të mund vetëm të hyjë në llogari: s\'do ta shohë as stokun, as afatet, as grupin.', 'Ndalo krejt');
      if (po) pdRuaj(a, pdKrejt(a, false), a.emri + ' s\'ka më asnjë leje.');
    });
    r.appendChild(bl); r.appendChild(bn);
    c.appendChild(r);
    c.appendChild(pdEl('div', 'ops-intro pd-shenim', 'Ndryshimet ruhen vetë dhe vlejnë menjëherë te telefoni dhe kompjuteri i ' + a.emri + '. Çka s\'i lejohet, i zhduket krejt, pa asnjë mesazh.'));
  }

  // ---------- Njoftimet (Cilësimet → Njoftimet): leja, push-i i Grupit, prova, ora ----------
  function ekipaCloud() { var c = window.__stokuCloud; return (c && c.ekipa) || null; }
  function aktivizoPushin(detyro) {
    var e = ekipaCloud();
    if (!e || !e.aktivizoPush) return Promise.resolve(null);
    return e.aktivizoPush(detyro !== false).then(function (r) { rifreskoNjoftimet(); return r; }, function () { return null; });
  }
  function gjendjaENjoftimeve() {
    if (!('Notification' in window)) return 'pa';
    if (Notification.permission === 'denied') return 'bllokuar';
    if (Notification.permission !== 'granted') return 'fikur';
    if (!leja('grupi')) return 'aktive'; // v231: pa Grup, njoftimet janë vetëm ato të afateve
    var e = ekipaCloud();
    return (e && e.pushAktiv && e.pushAktiv()) ? 'push' : 'lokale';
  }
  var NJ_GJENDJET = {
    push: ['ngj-gjelber', 'Aktive', 'Vijnë edhe kur Stoku është i mbyllur, edhe në orë.', 'Aktive'],
    aktive: ['ngj-gjelber', 'Aktive', 'Njoftimet për afatet vijnë në këtë telefon. Që të vijnë edhe kur Stoku është i mbyllur, ndiz më poshtë "Njoftimi ditor".', 'Aktive'],
    lokale: ['ngj-portokalli', 'Aktive kur Stoku është hapur', 'Njoftimet e Grupit vijnë kur Stoku është i hapur ose në sfond. Që të vijnë edhe kur mbyllet, duhet hyrë në llogari dhe shërbimi i njoftimeve duhet të jetë gati.', 'Kur Stoku është hapur'],
    fikur: ['ngj-gri', 'Të fikura', 'Shtyp "Aktivizo njoftimet" dhe lejoji kur të pyet telefoni.', 'Të fikura'],
    bllokuar: ['ngj-kuqe', 'Të bllokuara', 'I ke refuzuar njoftimet. Lejoji te: Cilësimet e telefonit → Aplikacionet → Stoku (ose Chrome) → Njoftimet → Lejo.', 'Të bllokuara'],
    pa: ['ngj-gri', 'S\'mbështeten këtu', 'Ky shfletues s\'i jep njoftimet. Në iPhone: hap stoku.site me Safari → Shpërndaj → Shto në ekranin bazë, pastaj hape Stoku nga ikona (iOS 16.4 ose më i ri).', 'S\'mbështeten']
  };
  function rifreskoNjoftimet() {
    if (!$('njGjendjaTitulli') || !NJ_GJENDJET) return; // (thirret edhe gjatë nisjes, para se lista të përcaktohet)
    var g = gjendjaENjoftimeve(), x = NJ_GJENDJET[g];
    $('njGjendjaIk').className = 'kat-ikona-badge ops-ik-madh ' + x[0];
    $('njGjendjaTitulli').textContent = x[1];
    $('njGjendjaTeksti').textContent = x[2];
    $('tabNjoftimetStatus').textContent = x[3];
    $('njBtnAktivizo').style.display = (g === 'fikur' || g === 'lokale') ? '' : 'none';
    $('njBtnAktivizo').textContent = g === 'lokale' ? 'Provo sërish lidhjen' : 'Aktivizo njoftimet';
    rifreskoOrarin();
  }
  // ---- Njoftimi ditor për afatet: ora që zgjedh secili përdorues (Worker-i e dërgon me Cron) ----
  var KEY_NJ_ORA = 'stoku:orari:ora-zgjedhur';
  var __orariDukePunuar = false;
  function oraEZgjedhur() {
    var e = ekipaCloud(), o = e && e.orariIm ? e.orariIm() : null, v = o && o.ora;
    if (!v) { try { v = localStorage.getItem(KEY_NJ_ORA); } catch (x) { v = null; } } // ruajtja e bllokuar s'e ndal nisjen e faqes
    return /^\d\d:\d\d$/.test(v || '') ? v : '08:00';
  }
  function rifreskoOrarin() {
    if (!$('njDitor') || __orariDukePunuar) return;
    var e = ekipaCloud(), o = e && e.orariIm ? e.orariIm() : null, g = gjendjaENjoftimeve();
    var aktiv = !!(o && o.aktiv);
    $('njDitor').checked = aktiv;
    $('njOra').value = oraEZgjedhur();
    $('njOraHint').textContent = !perdoruesiAktual() ? 'Hyr në llogari që ta përdorësh.' :
      (g === 'pa' ? 'Ky shfletues s\'i mbështet njoftimet.' : g === 'bllokuar' ? 'Njoftimet janë të bllokuara te cilësimet e telefonit.' :
        g === 'fikur' ? 'Shtyp më lart "Aktivizo njoftimet".' : aktiv ? 'Çdo ditë në ' + o.ora + '.' : 'Zgjidh orën dhe ndiz "Njoftimi ditor".');
    $('tabNjoftimetStatus').textContent = aktiv && g !== 'fikur' && g !== 'bllokuar' ? NJ_GJENDJET[g][3] + ' · ditore ' + o.ora : NJ_GJENDJET[g][3];
  }
  function tekstiGabimitOrarit(a) {
    return a === 'mungon-kv' || a === 'http-404' ? 'Shërbimi i njoftimit ditor s\'është gati ende në server.' :
      a === 'pa-leje' || a === 'pa-push' || a === 'pa-mbeshtetje' ? 'Lejo njoftimet më lart, pastaj provo sërish.' :
      a === 'pa-hyrje' ? 'Hyr në llogari që ta përdorësh.' :
      a === 'ora' ? 'Serveri ka kodin e vjetër dhe pranon vetëm :00, :15, :30, :45. Ngjite kodin e ri te Cloudflare.' : 'S\'u ruajt. Kontrollo internetin dhe provo sërish.';
  }
  async function ruajOrarin(aktiv) {
    var e = ekipaCloud(), ora = String($('njOra').value || '').slice(0, 5);
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(ora)) { toast('Shkruaj orën si 17:05.'); rifreskoOrarin(); return; }
    try { localStorage.setItem(KEY_NJ_ORA, ora); } catch (x) { /* ok */ }
    if (!e || !e.vendosOrarin || !perdoruesiAktual()) { toast('Hyr në llogari që ta përdorësh.'); rifreskoOrarin(); return; }
    if (aktiv && gjendjaENjoftimeve() === 'pa') { toast('Ky shfletues s\'i mbështet njoftimet.'); rifreskoOrarin(); return; }
    if (aktiv && Notification.permission !== 'granted') { toast('Lejo njoftimet më lart, pastaj provo sërish.'); rifreskoOrarin(); return; }
    __orariDukePunuar = true;
    $('njDitor').disabled = $('njOra').disabled = true;
    $('njOraHint').textContent = 'Duke ruajtur…';
    var r = await e.vendosOrarin({ aktiv: aktiv, ora: ora });
    __orariDukePunuar = false;
    $('njDitor').disabled = $('njOra').disabled = false;
    if (r && r.ok) {
      window.StokuNjoftimet.vendosOrarin(aktiv && e.orariPunon());
      if (aktiv) { e.dergoAfatetPerOrarin(afatetPerServerin()); toast('Njoftimi ditor: çdo ditë në ' + ora + '.'); }
      else toast('Njoftimi ditor u fik.');
    } else toast(tekstiGabimitOrarit(r && r.arsye), 4500);
    rifreskoOrarin();
    kontrolloServerinEOrarit();
  }
  // Kontrolli i serverit (Cloudflare): kodi i ri, Cron-i dhe çka ndodhi sot me njoftimin e kësaj pajisjeje
  function oraNga(ts) { var d = new Date(ts); return (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes(); }
  function sotIso() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  // A e kap Cron-i minutën e zgjedhur? "* * * * *" po; "0,15,30,45 * * * *" / "*/15 * * * *" vetëm ato minuta
  function cronKapMinuten(shprehja, ora) {
    if (!shprehja) return true; // s'dihet (kod i vjetër): s'paralajmërohet
    var m = Number(String(ora).slice(3, 5)), f = String(shprehja).trim().split(/\s+/)[0];
    if (f === '*' || f === '*/1') return true;
    var hap = /^\*\/(\d+)$/.exec(f);
    if (hap) return m % Number(hap[1]) === 0;
    return f.split(',').some(function (x) { return Number(x) === m; });
  }
  // Shprehja e Cron-it me fjalë (yjet "* * * * *" s'lexohen mirë): "çdo minutë", "çdo 15 minuta", "në minutat 5, 35"
  function cronMeFjale(shprehja) {
    var f = String(shprehja || '').trim().split(/\s+/)[0], hap = /^\*\/(\d+)$/.exec(f);
    if (f === '*' || f === '*/1') return 'çdo minutë';
    if (hap) return 'çdo ' + hap[1] + ' minuta';
    var l = f.split(',').map(Number);
    if (l.length > 1 && l.every(function (x) { return !isNaN(x); })) {
      var d = l[1] - l[0];
      if (l[0] < d && d > 0 && 60 % d === 0 && l.length === 60 / d && l.every(function (x, i) { return x === l[0] + i * d; })) return 'çdo ' + d + ' minuta';
      return 'në minutat ' + l.join(', ') + ' të çdo ore';
    }
    return /^\d+$/.test(f) ? 'një herë në orë' : 'jo çdo minutë';
  }
  // Sa minuta pa shenjë të re nga Cron-i janë normale: serveri e rishkruan shenjën më së shpeshti çdo 10 min
  function cronVonesaMaks(shprehja) {
    if (!shprehja) return 45;
    var f = String(shprehja).trim().split(/\s+/)[0], hap = /^\*\/(\d+)$/.exec(f), l = f.split(',').map(Number), p = 60;
    if (f === '*') p = 1; else if (hap) p = Number(hap[1]); else if (l.length > 1 && l.every(function (x) { return !isNaN(x); })) p = Math.max.apply(null, l.map(function (x, i) { return (l[(i + 1) % l.length] - x + 60) % 60 || 60; }));
    return Math.max(p, 10) + 7;
  }
  function gabimiICronit(g) {
    var m = String(g.mesazh || '').replace(/^shenja:\s*/, '');
    if (/limit exceeded|429/i.test(m)) {
      var d = new Date(), mes = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
      return 'Cloudflare ka arritur limitin falas të shkrimeve të KV-së (1000 në ditë), prandaj serveri s\'po e ruan dot se kujt ia dërgoi njoftimin. Rifillon vetë në ' + oraNga(mes) + '.';
    }
    return 'Serveri pati gabim në ' + oraNga(g.koha) + ': ' + m.split('\n')[0].slice(0, 160) + '. Dërgoja këtë tekst atij që e mirëmban Stoku-n.';
  }
  async function kontrolloServerinEOrarit() {
    var e = ekipaCloud(), o = e && e.orariIm ? e.orariIm() : null, el = $('njOraServer');
    if (!e || !e.statusiIOrarit || !o || !o.aktiv) { el.hidden = true; return; }
    el.hidden = false; el.className = 'nj-serveri'; el.textContent = 'Duke kontrolluar serverin…';
    var st = await e.statusiIOrarit(), sv = st.serveri, im = st.im, tani = Date.now();
    // Serveri s'e ka më orarin (p.sh. pas riinstalimit): regjistrohet vetë dhe kontrollohet sërish
    if (im && im.ok && !im.ekziston && e.rinovoOrarinNesesMungon && await e.rinovoOrarinNesesMungon(true, st)) {
      await e.dergoAfatetPerOrarin(afatetPerServerin());
      st = await e.statusiIOrarit(); sv = st.serveri; im = st.im;
    }
    var keq = true, t, kvProva = null;
    // Cron-i duket i ndalur: provohet a pranon KV-ja shkrime (kur limiti ditor mbaron, shenja s'ruhet dot)
    if (sv && sv.versioni >= 154 && sv.fotot && sv.cron && tani - sv.cron > cronVonesaMaks(sv.cronShprehja) * 60000 && e.provoKV) kvProva = await e.provoKV();
    if (!sv) t = 'S\'u lidh me serverin për ta kontrolluar. Kontrollo internetin.';
    else if (!sv.versioni || sv.versioni < e.VERSIONI_WORKER) t = 'Serveri (Cloudflare) ka kodin e vjetër: ngjite kodin e ri te stoku-push' + (sv.versioni >= 161 ? '.' : sv.versioni >= 160 ? ', që të vijnë edhe njoftimet e Grupit me Stoku të mbyllur.' : ', përndryshe njoftimi ditor s\'vjen.');
    else if (!sv.fotot) t = 'Serverit i mungon KV-ja "FOTO" (Cloudflare → stoku-push → Bindings).';
    else if (!sv.cron) t = 'Ora automatike (Cron) s\'është vendosur te Cloudflare: stoku-push → Settings → Trigger Events → Cron Triggers → "Every minute" (çdo minutë). Pa të njoftimi ditor s\'vjen.';
    else if (sv.cronGabim && sv.cronGabim.koha && tani - sv.cronGabim.koha < 60 * 60000 && sv.cronGabim.koha >= sv.cron - 60000) t = gabimiICronit(sv.cronGabim);
    else if (kvProva && kvProva.ok === false) t = gabimiICronit(kvProva);
    else if (tani - sv.cron > cronVonesaMaks(sv.cronShprehja) * 60000) t = 'Ora automatike (Cron) s\'ka punuar që nga ' + oraNga(sv.cron) + (sv.cronShprehja ? ' (atëherë ishte ' + cronMeFjale(sv.cronShprehja) + ')' : '') + '. Te Cloudflare → stoku-push → Settings → Trigger Events duhet të jetë vetëm "Every minute". Pastaj te stoku-push → Logs shih a del "stoku-push cron".';
    else if (!im || !im.ok) t = 'Serveri s\'u përgjigj për këtë pajisje. Provo ta fikësh dhe ta ndezësh njoftimin ditor.';
    else if (!cronKapMinuten(sv.cronShprehja, o.ora)) t = 'Cron-i te Cloudflare punon ' + cronMeFjale(sv.cronShprehja) + ', jo çdo minutë, prandaj njoftimi për ' + o.ora + ' vjen me vonesë. Te stoku-push → Settings → Trigger Events fshije Cron-in e vjetër dhe zgjidh "Every minute" (çdo minutë).';
    else if (!im.ekziston) t = 'Serveri s\'e ka orarin e kësaj pajisjeje. Fike dhe ndize sërish "Njoftimi ditor".';
    else if (im.ora && im.ora !== o.ora) t = 'Serveri ka ende orën ' + im.ora + ' (jo ' + o.ora + '). Shkruaje orën sërish dhe shtyp Enter.';
    else {
      keq = false;
      var sot = im.dita === sotIso();
      if (sot && im.rez === 'derguar') t = '✓ Sot njoftimi u dërgua në ' + oraNga(im.kohaRez) + '.';
      else if (sot && im.rez === 'asgje') t = '✓ Serveri punon. Sot s\'skadon asnjë produkt, prandaj s\'erdhi njoftim.';
      else if (sot && im.rez) { keq = true; t = 'Sot njoftimi s\'u dorëzua në telefon (' + im.rez + '). Fike dhe ndize sërish "Njoftimi ditor".'; }
      else t = '✓ Serveri punon. Njoftimi i radhës: ' + (sot ? 'nesër' : 'sot ose nesër') + ' në ' + o.ora + '.';
      if (im.afatet === 0) t += ' (Serveri s\'ka ende listën e afateve: hape Stoku-n një herë.)';
    }
    el.classList.toggle('keq', keq);
    el.textContent = t;
  }
  $('tabNjoftimet').addEventListener('click', function () { setTimeout(kontrolloServerinEOrarit, 50); });
  // ---------- Ora: lidhja me kod ----------
  async function lidhOrenMeKod() {
    var e = ekipaCloud(), kodi = $('oraKodi').value.replace(/\D/g, ''), h = $('oraLidhHint');
    if (!perdoruesiAktual() || !e || !e.lidhOren) { h.textContent = 'Hyr në llogari që ta lidhësh orën.'; return; }
    if (kodi.length !== 6) { h.textContent = 'Kodi ka 6 shifra: shkruaje ashtu si del në orë.'; $('oraKodi').focus(); return; }
    $('oraLidh').disabled = true; h.textContent = 'Duke lidhur…';
    var r = await e.lidhOren(kodi);
    $('oraLidh').disabled = false;
    if (r && r.ok) {
      $('oraKodi').value = '';
      h.textContent = '✓ Ora u lidh. Pas pak sekondash në orë del lista e produkteve që skadojnë sot.';
      e.dergoAfatetPerOrarin(afatetPerServerin()).catch(function () { /* ok */ });
    } else h.textContent = r && r.arsye === 'rruga' ? 'Serveri (Cloudflare) ka kodin e vjetër: ngjite kodin e ri te stoku-push (versioni 157 ose më i ri) dhe provo prapë.'
      : r && r.arsye === 'kodi' ? 'Ky kod s\'u gjet ose ka skaduar. Shiko kodin e ri në orë.'
      : r && r.arsye === 'rrjeti' ? 'S\'ka internet. Provo prapë.' : 'S\'u lidh (' + ((r && r.arsye) || 'gabim') + '). Provo prapë.';
  }
  $('oraLidh').addEventListener('click', lidhOrenMeKod);
  $('oraKodi').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); lidhOrenMeKod(); } });
  // Heqjet nga rafti të bëra në orë zbatohen këtu (dhe dërgohen te cloud-i si çdo heqje tjetër)
  async function zbatoHeqjetNgaOra(detyro) {
    var e = ekipaCloud();
    if (!e || !e.merrHeqjetNgaOra || !perdoruesiAktual() || !leja('ora')) return;
    var l = await e.merrHeqjetNgaOra(detyro), kryer = [], n = 0;
    l.forEach(function (h) {
      var a = afatet.filter(function (x) { return x.id === h.i; })[0];
      if (!a) return; // ende pa u sinkronizuar këtu: mbetet për herën tjetër
      kryer.push(h.i);
      if (a.statusi === 'hequr') return;
      perditesoAfatin(a.id, { statusi: 'hequr', hequrSe: h.koha || Date.now(), hequrNga: emriPerdoruesitAktual() });
      ekNgjarjeAfati('hequr', a); n++;
    });
    if (n) toast(n === 1 ? '1 produkt u shënua i hequr nga rafti (nga ora).' : n + ' produkte u shënuan të hequra nga rafti (nga ora).');
    if (kryer.length) e.pastroHeqjetNgaOra(kryer);
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) zbatoHeqjetNgaOra(false).catch(function () { /* ok */ }); });
  window.addEventListener('stoku-cloud-gati', function () { setTimeout(function () { zbatoHeqjetNgaOra(true).catch(function () { /* ok */ }); }, 4000); });
  window.addEventListener('stoku-auth-ndryshoi', function () { setTimeout(function () { zbatoHeqjetNgaOra(true).catch(function () { /* ok */ }); }, 4000); });
  $('njDitor').addEventListener('change', function () { ruajOrarin(this.checked); });
  // Ora 24-orëshe e shkruar me dorë: vetëm shifra, ":" vendoset vetë pas orës ("1705" → "17:05")
  function oraNgaTeksti(t) {
    var d = String(t || '').replace(/\D/g, '');
    if (d.length === 3) d = '0' + d;            // "905" → 09:05
    if (d.length === 1 || d.length === 2) d = ('0' + d).slice(-2) + '00'; // "9" / "17" → 09:00 / 17:00
    if (d.length !== 4) return null;
    var h = Number(d.slice(0, 2)), m = Number(d.slice(2));
    return h < 24 && m < 60 ? d.slice(0, 2) + ':' + d.slice(2) : null;
  }
  $('njOra').addEventListener('input', function () {
    var d = this.value.replace(/\D/g, '').slice(0, 4);
    this.value = d.length > 2 ? d.slice(0, 2) + ':' + d.slice(2) : d;
  });
  $('njOra').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); this.blur(); } });
  $('njOra').addEventListener('change', function () {
    var v = oraNgaTeksti(this.value);
    if (!v) { toast('Shkruaj orën si 17:05 (00:00 deri 23:59).'); this.value = oraEZgjedhur(); return; }
    this.value = v;
    try { localStorage.setItem(KEY_NJ_ORA, v); } catch (x) { /* ok */ }
    if ($('njDitor').checked) ruajOrarin(true); else rifreskoOrarin();
  });
  // Udhëzimi për orën: Galaxy Watch (Android) ose Apple Watch (iPhone) — hapet vetë sipas telefonit
  function zgjidhOren(v) {
    Array.prototype.forEach.call(document.querySelectorAll('#segOra button'), function (b) {
      var po = b.getAttribute('data-v') === v;
      b.classList.toggle('aktiv', po); b.setAttribute('aria-selected', po ? 'true' : 'false');
    });
    Array.prototype.forEach.call(document.querySelectorAll('.ops-ora-faqe'), function (f) { f.hidden = f.getAttribute('data-ora') !== v; });
  }
  Array.prototype.forEach.call(document.querySelectorAll('#segOra button'), function (b) {
    b.addEventListener('click', function () { zgjidhOren(b.getAttribute('data-v')); });
  });
  zgjidhOren(/iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1) ? 'apple' : 'galaxy');

  $('njBtnAktivizo').addEventListener('click', function () {
    if (!('Notification' in window)) return;
    Promise.resolve(Notification.permission === 'granted' ? 'granted' : Notification.requestPermission()).then(function (p) {
      if (p === 'granted') {
        regjistroKontrollinPeriodik();
        kontrolloNjoftimet();
        $('njProveHint').textContent = 'Duke u lidhur…';
        aktivizoPushin(true).then(function (r) {
          $('njProveHint').textContent = gjendjaENjoftimeve() === 'push' ? 'Gati. Njoftimet vijnë edhe kur Stoku është i mbyllur.' :
            (!perdoruesiAktual() ? 'Hyr në llogari që të vijnë njoftimet e Grupit edhe kur Stoku është i mbyllur.' :
              'Shërbimi i njoftimeve s\'u gjet ende. Njoftimet vijnë kur Stoku është hapur.');
        });
      }
      rifreskoNjoftimet();
    }).catch(function () { /* ok */ });
  });
  // ---- Aplikacioni Android: butoni i hollë poshtë "Çka ka të re" (brenda aplikacionit: kontrolli i versionit; Chrome Android: shkarkimi) ----
  // (një herë, jo sa herë hapen Cilësimet: përndryshe butoni merr disa klikime)
  (function () {
    var A = window.StokuAndroid, android = /Android/i.test(navigator.userAgent || '');
    if (!A && !android) return;
    var b = $('njAndroidBtn');
    b.hidden = false;
    if (A) {
      $('njAndroidTekst').textContent = 'Kontrollo për përditësim';
      b.title = 'Aplikacioni Stoku për Android: kontrollo a ka version të ri';
      b.addEventListener('click', function () { try { A.kontrolloPerditesimin(); } catch (e) { /* ok */ } });
    } else {
      $('njAndroidTekst').textContent = 'Shkarko aplikacionin Android';
      b.title = 'Stoku si aplikacion: s\'del nga llogaria kur i fshin të dhënat e Chrome-it dhe njoftimet vijnë menjëherë';
      b.addEventListener('click', function () { window.open('android.html', '_blank', 'noopener'); });
    }
  })();
  function hapOpsionet() {
    $('opsTingull').checked = opsione.tingull;
    $('opsScanner').checked = opsione.scanner;
    $('opsPda').checked = opsione.pda;
    $('opsPaEmer').checked = opsione.paEmer;
    zbatoPda();
    $('opsRendi').value = opsione.rendi;
    rifreskoRenditjen();
    zbatoTemen();
    zbatoMadhesine();
    rifreskoDukjenECloud();
    rifreskoStatusetOpsioneve();
    aktivizoTabin(null);
    $('dlgOpsione').classList.add('hapur');
  }
  function mbyllOpsionet() {
    $('dlgOpsione').classList.remove('hapur');
    rifreskoPamjen(); // garanton që shfaqet saktë ekrani nga erdhe (folder ose faqja kryesore), sido që të jetë
    fokusoBarkodin();
    pasMbylljesSeTabit();
  }

  $('dlgOpsione').addEventListener('click', function (ev) {
    if (ev.target === $('dlgOpsione')) mbyllOpsionet();
  });
  Array.prototype.forEach.call(document.querySelectorAll('#segTema button'), function (b) {
    b.addEventListener('click', function () { vendosTemen(b.getAttribute('data-v')); });
  });
  $('opsTingull').addEventListener('change', function () {
    opsione.tingull = $('opsTingull').checked;
    ruajOpsionet();
    if (opsione.tingull) { pergatitAudion(); bip(); } // një provë e shkurtër
  });
  $('opsScanner').addEventListener('change', function () {
    opsione.scanner = $('opsScanner').checked;
    ruajOpsionet();
  });
  $('opsTastiera').addEventListener('change', function () { ndryshoTastieren($('opsTastiera').checked); });
  $('btnTastiera').addEventListener('click', function () {
    ndryshoTastieren(!opsione.tastieraFshehur);
    toast(T(opsione.tastieraFshehur ? 'tastieraUFsheh' : 'tastieraDelPerseri'));
    fokusoBarkodin(); // skanimi vazhdon: kursori mbetet te barkodi
  });
  $('opsPda').addEventListener('change', function () {
    opsione.pda = $('opsPda').checked;
    ruajOpsionet();
    zbatoPda();
    rifreskoStatusetOpsioneve();
    // Ky është veprim i përdoruesit — i vetmi çast kur Chrome lejon fullscreen + kyçjen e plotë.
    if (opsione.pda) provoKycjenPda();
  });
  $('opsPaEmer').addEventListener('change', async function () {
    if (!$('opsPaEmer').checked) {          // fikja nuk kërkon paralajmërim
      opsione.paEmer = false;
      ruajOpsionet();
      return;
    }
    $('opsPaEmer').checked = false;          // ndizet vetëm pasi ta pranosh paralajmërimin
    var po = await konfirmo(T('paEmerKonfTitulli'), T('paEmerKonfTekst'), T('aktivizo'), 5);
    if (po) {
      opsione.paEmer = true;
      $('opsPaEmer').checked = true;
      ruajOpsionet();
    }
  });
  $('opsRendi').addEventListener('change', function () {
    opsione.rendi = $('opsRendi').value;
    ruajOpsionet();
    renderLista();
    rifreskoStatusetOpsioneve();
  });

  // Konfirmim i përgjithshëm (kthen Promise me true/false)
  var konfRez = null;
  var konfKohez = null;
  // vonesa (opsionale) = sekonda para se butoni i pranimit aktivizohet
  function konfirmo(titulli, teksti, butoni, vonesa) {
    return new Promise(function (zgjidh) {
      $('konfTitulli').textContent = titulli;
      $('konfTekst').textContent = teksti;
      var btn = $('konfPo');
      clearInterval(konfKohez);
      if (vonesa > 0) {
        var s = vonesa;
        btn.disabled = true;
        btn.textContent = butoni + ' (' + s + ')';
        konfKohez = setInterval(function () {
          s--;
          if (s > 0) {
            btn.textContent = butoni + ' (' + s + ')';
          } else {
            clearInterval(konfKohez);
            btn.disabled = false;
            btn.textContent = butoni;
          }
        }, 1000);
      } else {
        btn.disabled = false;
        btn.textContent = butoni;
      }
      if (konfRez) { var paraR = konfRez; konfRez = null; paraR(false); } // pyetja e mëparshme s'mbetet pa përgjigje
      konfRez = zgjidh;
      $('dlgKonfirmo').classList.add('hapur');
    });
  }
  function mbyllKonfirmo(vlera) {
    clearInterval(konfKohez);
    $('dlgKonfirmo').classList.remove('hapur');
    fokusoBarkodin();
    if (konfRez) { var r = konfRez; konfRez = null; r(vlera); }
  }
  $('konfPo').addEventListener('click', function () { mbyllKonfirmo(true); });
  $('konfJo').addEventListener('click', function () { mbyllKonfirmo(false); });
  $('dlgKonfirmo').addEventListener('click', function (ev) {
    if (ev.target === $('dlgKonfirmo')) mbyllKonfirmo(false);
  });

  // ================= Cloud (Firebase) — kopje automatike online =================
  var SINKRONIZIM_VONESA_MS = 1500; // pak kohë pas ndryshimit, që skanimet e shpejta rresht të bashkohen në një kërkesë
  var sinkronizoKohezi = null;
  var dukeSinkronizuar = false;
  var dukeRikthyerNgaCloud = false;
  var dukeRregjistruarApoHyrje = false;

  function emriEshteVlefshem(v) { return typeof v === 'string' && /^[a-zA-Z0-9_.-]{3,}$/.test(v.trim()); }
  function fjalekalimiEshteVlefshem(v) { return typeof v === 'string' && v.length >= 6; }

  // Regjistri i fshirjeve (lokal): mban mend cilat produkte/foldera janë fshi QËLLIMISHT këtu
  // (fshirje e vetme, fshirje krejt, fshirje folderi, ose zhvendosje — çelësi i vjetër fshihet), që
  // sinkronizimi t'i heqë ato nga cloud-i, por asnjëherë të mos heqë diçka që thjesht "mungon"
  // lokalisht pa qenë fshi qëllimisht (p.sh. të dhëna lokale të pjesshme a të humbura pa dashje).
  var KEY_FSHIRE = 'stoku:fshira:v1';
  var fshira = { produktet: {}, foldera: {}, afatet: {}, marketet: {} };
  function ngarkoFshiraet() {
    try {
      var t = JSON.parse(localStorage.getItem(KEY_FSHIRE) || 'null');
      if (t && typeof t === 'object') {
        fshira.produktet = (t.produktet && typeof t.produktet === 'object') ? t.produktet : {};
        fshira.foldera = (t.foldera && typeof t.foldera === 'object') ? t.foldera : {};
        fshira.afatet = (t.afatet && typeof t.afatet === 'object') ? t.afatet : {};
        fshira.marketet = (t.marketet && typeof t.marketet === 'object') ? t.marketet : {};
      }
    } catch (e) { /* ok */ }
  }
  function ruajFshiraet() {
    try { localStorage.setItem(KEY_FSHIRE, JSON.stringify(fshira)); } catch (e) { /* ok */ }
  }
  // paRuajtje: fshirje me shumicë (folder, "Fshi të gjitha"): shënimet ruhen një herë në fund, jo për çdo produkt
  function shenoProduktinEFshire(celesi, paRuajtje) { fshira.produktet[celesi] = Date.now(); if (!paRuajtje) ruajFshiraet(); }
  function shenoFolderinEFshire(id) { fshira.foldera[id] = Date.now(); ruajFshiraet(); }
  ngarkoFshiraet();

  // Afatet (datat e skadimit) — ruhen lokalisht dhe sinkronizohen bashkë me produktet
  var KEY_AFATET = 'stoku:afatet:v1';
  var afatet = [];
  try { var afRuajtura = JSON.parse(localStorage.getItem(KEY_AFATET) || '[]'); if (Array.isArray(afRuajtura)) afatet = window.StokuBashkimi.pastroAfatet(afRuajtura); } catch (e) { /* ok */ }
  // v241: marketet (marketet.js). Lista sinkronizohet si folderat; marketi aktiv ("Je te: …") është i kësaj pajisjeje.
  var MK = window.StokuMarketet;
  var marketet = [];
  try { marketet = MK.pastro(JSON.parse(localStorage.getItem(MK.KEY_LISTA) || '[]')); } catch (e) { /* ok */ }
  var marketiAktiv = MK.lexoAktivin();
  function ruajMarketetLokalisht() { try { localStorage.setItem(MK.KEY_LISTA, JSON.stringify(marketet)); } catch (e) { /* ok */ } }

  function gjendjaPerCloud() {
    return {
      app: 'stoku', version: 3, koha: new Date().toISOString(),
      rendiKoha: rendiFolderaveKoha,
      foldera: foldera,
      produktet: Object.keys(produktet).map(function (k) { return produktet[k]; }),
      afatet: afatet,
      marketet: marketet,
      fshira: fshira
    };
  }

  // Bashkimi mes cloud-it dhe kësaj pajisjeje — logjika e përbashkët me versionin për kompjuter
  // (bashkimi.js): fiton ndryshimi më i ri, dhe fshirjet ruhen edhe në cloud që një pajisje tjetër
  // me kopje të vjetër të mos i ringjallë produktet e fshira.
  function bashkoPaFshirje(gjendjaCloud, gjendjaLokale) {
    var B = window.StokuBashkimi;
    // v233: pa asnjë folder pas bashkimit kthehen 4 të parazgjedhurit (bashkimi.js, sigurojFolderat)
    return B.sigurojFolderat ? B.sigurojFolderat(B.bashko(gjendjaCloud, gjendjaLokale)) : B.bashko(gjendjaCloud, gjendjaLokale);
  }

  // Zbaton lokalisht rezultatin e sinkronizimit (produktet e shtuara/ndryshuara/fshira nga pajisjet
  // e tjera), pa nisur sinkronizim të ri dhe pa e nxjerrë përdoruesin nga ekrani ku është.
  // Kur përdoruesi po shkruan te një fushë e listës (sasia e shpejtë), rivizatimi shtyhet derisa të dalë prej saj
  var __rivizatoKurTeLirohet = false;
  function poShkruanNeListe() {
    var a = document.activeElement;
    return !!(a && a.tagName === 'INPUT' && a.closest && a.closest('#lista'));
  }
  document.addEventListener('focusout', function () {
    if (!__rivizatoKurTeLirohet) return;
    setTimeout(function () { if (__rivizatoKurTeLirohet && !poShkruanNeListe()) { __rivizatoKurTeLirohet = false; if (folderiAktual !== null) renderLista(); } }, 0);
  });
  function zbatoBashkimin(g) {
    if (!g || window.StokuBashkimi.eNjejte(g, gjendjaPerCloud())) return;
    var pm = {};
    (Array.isArray(g.produktet) ? g.produktet : []).forEach(function (p) {
      if (p && typeof p.barkodi === 'string' && typeof p.kategoriaId === 'string') pm[celesiProduktit(p.kategoriaId, p.barkodi)] = p;
    });
    ruajTeFshiratNeKopje(Array.isArray(g.foldera) ? g.foldera : foldera, pm);
    foldera = Array.isArray(g.foldera) ? g.foldera : foldera;
    produktet = pm;
    rifreskoKopjen();
    if (Array.isArray(g.marketet)) { marketet = MK.pastro(g.marketet); ruajMarketetLokalisht(); }
    if (Array.isArray(g.afatet)) {
      afatet = g.afatet;
      try { localStorage.setItem(KEY_AFATET, JSON.stringify(afatet)); } catch (e) { /* ok */ }
      if (typeof rifreskoAfatet === 'function') rifreskoAfatet();
    }
    if (Array.isArray(g.marketet)) rifreskoMarketet();
    if (typeof g.rendiKoha === 'number' && g.rendiKoha > rendiFolderaveKoha) ruajRendinKoha(g.rendiKoha);
    try {
      localStorage.setItem(KEY_FOLDERA, JSON.stringify(foldera));
      localStorage.setItem(KEY_PRODUKTET, JSON.stringify(produktet));
    } catch (e) { /* ok */ }
    if (folderiAktual !== null && !foldera.some(function (f) { return f.id === folderiAktual; })) { rifreskoPamjen(); return; }
    if (folderiAktual !== null) { if (poShkruanNeListe()) __rivizatoKurTeLirohet = true; else renderLista(); }
    else { renderFolderat(); renderKerkimiGlobal(); }
  }

  // Ikona e cloud-it te "Afatet e produkteve": a janë ruajtur afatet në cloud
  function vendosStatusinEAfateve(g) {
    var e = $('afSinkStatus');
    if (!e) return;
    if (!perdoruesiAktual()) { e.hidden = true; return; }
    var teksti = g === 'ok' ? 'Ruajtur në cloud · ' + oraTani() : g === 'gabim' ? 'S\'u ruajt në cloud (pa internet?) · riprovohet vetë' : 'Duke u ruajtur në cloud…';
    e.hidden = false;
    e.className = 'af-sink ' + g;
    e.innerHTML = IKONAT_SINK[g] || IKONAT_SINK.pune;
    e.title = teksti;
    e.setAttribute('aria-label', teksti);
  }
  $('afSinkStatus').addEventListener('click', function () { toast($('afSinkStatus').title); });

  var statusiCloudFundit = ''; // teksti i fundit i statusit (mbetet edhe kur rihapen Opsionet)
  function vendosStatusinCloud(teksti) {
    statusiCloudFundit = teksti;
    var el = $('cloudStatusi');
    if (el) el.textContent = teksti;
    if (perdoruesiAktual() && $('opsProfilSub')) $('opsProfilSub').textContent = teksti;
  }

  function oraTani() {
    var d = new Date();
    return dyShifra(d.getHours()) + ':' + dyShifra(d.getMinutes());
  }

  function perdoruesiAktual() {
    var u = (window.__stokuCloud && window.__stokuCloud.perdoruesiAktual) ? window.__stokuCloud.perdoruesiAktual() : null;
    // v232: në një skedë tjetër (ose te aplikacioni i instaluar) u hyr me llogari tjetër: të dhënat e kësaj faqeje janë të
    // llogarisë së vjetër, prandaj faqja s'e sheh veten të kyçur (s'sinkronizon asgjë) derisa porta ta rinisë
    var P = window.StokuPorta;
    if (u && P && P.teDhenatELlogarise && !P.teDhenatELlogarise(u.uid)) return null;
    return u;
  }

  function emriPerdoruesitAktual() {
    var u = perdoruesiAktual();
    if (!u || typeof u.email !== 'string') return '';
    return u.email.split('@')[0];
  }

  // Sinkronizon menjëherë pas çdo shtimi/ndryshimi/fshirjeje të një produkti (me vonesë të vogël,
  // që disa skanime rresht të mos dërgojnë çdo herë një kërkesë të veçantë).
  function planifikoSinkronizimin(ms) {
    if (!perdoruesiAktual()) return;
    clearTimeout(sinkronizoKohezi);
    sinkronizoKohezi = setTimeout(kryeSinkronizimin, ms === undefined ? SINKRONIZIM_VONESA_MS : ms);
    vendosStatusinEAfateve('pune');
  }
  // Kur app-i mbyllet/kalon në sfond me një ruajtje në pritje: dërgohet menjëherë (përndryshe
  // telefoni e "ngrin" kohëmatësin dhe ndryshimi i fundit s'arrin në cloud deri në hapjen tjetër).
  function sinkronizoMenjehereNesePret() {
    if (sinkronizoKohezi && perdoruesiAktual()) { clearTimeout(sinkronizoKohezi); sinkronizoKohezi = null; kryeSinkronizimin(); }
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) sinkronizoMenjehereNesePret(); });
  window.addEventListener('pagehide', sinkronizoMenjehereNesePret);

  var __sinkSerish = false;
  var __sinkDeshtoi = false; // sinkronizimi i fundit dështoi (pa internet) — riprovohet sapo të ketë lidhje
  window.addEventListener('online', function () { if (perdoruesiAktual()) kryeSinkronizimin(); });
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && __sinkDeshtoi && perdoruesiAktual()) kryeSinkronizimin();
  });
  async function kryeSinkronizimin() {
    if (ngaVizitori() || !perdoruesiAktual() || !window.__stokuCloud) return;
    clearTimeout(sinkronizoKohezi);
    sinkronizoKohezi = null;
    if (dukeSinkronizuar) { __sinkSerish = true; return; }
    dukeSinkronizuar = true;
    vendosStatusinCloud(T('cloudStatusiDukeSink'));
    var versioniPara = __versioniLokal;
    var rez;
    try {
      if (window.__stokuCloud.bashkoDheRuaj) {
        // Lexim + bashkim + shkrim në një transaksion: dy pajisje që sinkronizojnë njëkohësisht s'ia fshijnë ndryshimet njëra-tjetrës.
        rez = await window.__stokuCloud.bashkoDheRuaj(function (cloud) { return bashkoPaFshirje(cloud, gjendjaPerCloud()); });
      } else {
        var meparshme = await window.__stokuCloud.merr();
        var perDergim = bashkoPaFshirje(meparshme.ok ? meparshme.gjendja : null, gjendjaPerCloud());
        rez = await window.__stokuCloud.ruaj(perDergim);
        if (rez.ok) rez.gjendja = perDergim;
      }
    } catch (e) { rez = { ok: false, arsye: String((e && e.message) || e) }; } // sinkronizimi s'ngec kurrë "duke punuar"
    dukeSinkronizuar = false;
    if (rez.ok) {
      window.StokuBashkimi.pastroFshirjetEVjetra(fshira);
      ruajFshiraet();
      if (versioniPara === __versioniLokal) zbatoBashkimin(rez.gjendja);
      else planifikoSinkronizimin();
      if (typeof ekK !== 'undefined' && ekK) ekK.publikoAfatet(MK.meEmra(afatet, marketet)); // kolegët i shohin afatet e mia (vetëm afatet), me emrin e marketit
    }
    vendosStatusinCloud(rez.ok ? T('cloudStatusiUSink', { kur: oraTani() }) : T('cloudStatusiDeshtoi'));
    if (!rez.ok && /maximum|exceeds|too large/i.test(String(rez.arsye || ''))) {
      toast('Të dhënat e dyqanit kanë arritur kufirin e Firebase-it (1 MB) dhe s\'po ruhen në cloud. Fshi afatet/produktet e vjetra ose kontakto administratorin.');
    }
    vendosStatusinEAfateve(rez.ok ? 'ok' : 'gabim');
    __sinkDeshtoi = !rez.ok;
    if (!rez.ok) { clearTimeout(sinkronizoKohezi); sinkronizoKohezi = setTimeout(kryeSinkronizimin, 15000); } // riprovo vetë
    if (__sinkSerish) { __sinkSerish = false; planifikoSinkronizimin(); }
    zbatoRemoteNePritje();
  }

  function zbatoGjendjenNgaCloud(te, paKopje) {
    var B = window.StokuBashkimi;
    te = Object.assign({}, te, { foldera: B.pastroFolderat(te.foldera), produktet: B.pastroProduktet(te.produktet), afatet: B.pastroAfatet(te.afatet) });
    var arrF = te.foldera.length > 0
      ? te.foldera
      : FOLDERAT_PARAZGJEDHUR.map(function (fo) { return { id: fo.id, emri: fo.emri }; });
    var produktetENoja = {};
    (Array.isArray(te.produktet) ? te.produktet : []).forEach(function (p) {
      if (p && typeof p.barkodi === 'string' && typeof p.kategoriaId === 'string') {
        produktetENoja[celesiProduktit(p.kategoriaId, p.barkodi)] = p;
      }
    });
    if (!paKopje) ruajTeFshiratNeKopje(arrF, produktetENoja); // "Rikthe nga cloud" (zgjedhje e përdoruesit): pa kopje
    foldera = arrF;
    produktet = produktetENoja;
    rifreskoKopjen();
    if (Array.isArray(te.marketet)) { marketet = MK.pastro(te.marketet); ruajMarketetLokalisht(); }
    if (Array.isArray(te.afatet)) {
      afatet = te.afatet;
      try { localStorage.setItem(KEY_AFATET, JSON.stringify(afatet)); } catch (e) { /* ok */ }
      if (typeof rifreskoAfatet === 'function') rifreskoAfatet();
    }
    if (Array.isArray(te.marketet)) rifreskoMarketet();
    if (typeof te.rendiKoha === 'number' && te.rendiKoha > rendiFolderaveKoha) ruajRendinKoha(te.rendiKoha);
    // Mos e nxirr përdoruesin nga folderi ku është; rifreskoPamjen() e kthen te lista vetëm nëse
    // ky folder s'ekziston më.
    ruajBaze();
    rifreskoPamjen();
  }

  // ---------- v232: kopja e të fshirave nga një pajisje tjetër ----------
  // Kur sinkronizimi heq foldera ose produkte që ishin këtu (i fshiu një pajisje tjetër, ose një gabim), ato ruhen në këtë
  // pajisje (vetëm çka u hoq, jo krejt dyqani), që të rikthehen te Cilësimet → Llogaria. Mbahen 30 ditë; me ndërrimin e
  // llogarisë fshihen bashkë me të dhënat e tjera (porta.js).
  var KEY_KOPJA = 'stoku:kopja-fshirjeve:v1', KOPJA_MS = 30 * 864e5;
  function lexoKopjen() {
    var u = perdoruesiAktual();
    if (!u) return null;
    try {
      var k = JSON.parse(localStorage.getItem(KEY_KOPJA) || 'null');
      if (!k || k.uid !== u.uid || !Array.isArray(k.foldera) || !Array.isArray(k.produktet) || Date.now() - (k.koha || 0) > KOPJA_MS) return null;
      return k;
    } catch (e) { return null; }
  }
  // Para se të zbatohet gjendja e re: ruhet çka do të hiqej. Produkti i zhvendosur (i njëjti barkod në një folder tjetër)
  // s'është i fshirë, përveç kur i hoqi bashkë folderi i vet.
  function ruajTeFshiratNeKopje(folderaRe, produktetRe) {
    var u = perdoruesiAktual();
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
      var c = celesiProduktit(p.kategoriaId, p.barkodi);
      k.produktet = k.produktet.filter(function (x) { return celesiProduktit(x.kategoriaId, x.barkodi) !== c; }).concat([p]);
    });
    if (k.produktet.length > 20000) k.produktet = k.produktet.slice(-20000);
    k.koha = Date.now();
    try { localStorage.setItem(KEY_KOPJA, JSON.stringify(k)); } catch (e) { /* memoria plot: pa kopje */ }
  }
  // Çka nga kopja mungon tani (folderat dhe produktet që do të riktheheshin)
  function teMungueshmetNgaKopja(k) {
    var fM = k.foldera.filter(function (f) { return !foldera.some(function (x) { return x.id === f.id; }); });
    var ka = {}; foldera.concat(fM).forEach(function (f) { ka[f.id] = true; });
    var pM = k.produktet.filter(function (p) { return ka[p.kategoriaId] && !produktet[celesiProduktit(p.kategoriaId, p.barkodi)]; });
    return { foldera: fM, produktet: pM };
  }
  // "3 foldera dhe 45 produkte" / "1 folder ("Pije")"
  function pershkrimiIKopjes(m) {
    var pjeset = [];
    if (m.foldera.length) pjeset.push(m.foldera.length === 1 ? '1 folder ("' + m.foldera[0].emri + '")' : m.foldera.length + ' foldera');
    if (m.produktet.length) pjeset.push(T('njesiaProdukteve', { n: m.produktet.length }));
    return pjeset.join(' dhe ');
  }
  function vetemNje(m) { return m.foldera.length + m.produktet.length === 1; } // folja në njëjës ("u fshi", "u rikthye")
  function rifreskoKopjen() {
    var s = $('llKopjaSeksion');
    if (!s) return;
    var k = lexoKopjen(), m = k ? teMungueshmetNgaKopja(k) : null;
    s.hidden = !m || (!m.foldera.length && !m.produktet.length);
    // Krejt çka ishte në kopje është sërish këtu (p.sh. u rikthye nga një pajisje tjetër): kopja s'duhet më
    if (k && s.hidden) { try { localStorage.removeItem(KEY_KOPJA); } catch (e) { /* ok */ } }
    if (s.hidden) return;
    var d = new Date(k.koha), dy = function (n) { return (n < 10 ? '0' : '') + n; };
    var nje = vetemNje(m);
    $('llKopjaTeksti').textContent = pershkrimiIKopjes(m) + (nje ? ' u fshi' : ' u fshinë') + ' nga një pajisje tjetër. Kopja u ruajt në këtë telefon më ' +
      dy(d.getDate()) + '.' + dy(d.getMonth() + 1) + '.' + d.getFullYear() + ', ora ' + dy(d.getHours()) + ':' + dy(d.getMinutes()) +
      '. "Rikthe" ' + (nje ? 'e' : 'i') + ' kthen në krejt pajisjet.';
  }
  $('llKopjaRikthe').addEventListener('click', async function () {
    var k = lexoKopjen();
    if (!k) { rifreskoKopjen(); return; }
    var m = teMungueshmetNgaKopja(k), tani = Date.now();
    if (!m.foldera.length && !m.produktet.length) { rifreskoKopjen(); return; }
    var po = await konfirmo('Të rikthehen të fshirat?', (vetemNje(m) ? 'Kthehet ' : 'Kthehen ') + pershkrimiIKopjes(m) + ' në krejt pajisjet e llogarisë.', 'Rikthe');
    if (!po) return;
    // Me kohë të re: fitojnë ndaj fshirjes edhe në cloud (bashkimi.js)
    m.foldera.forEach(function (f) { foldera.push(Object.assign({}, f, { ndryshuarSe: tani })); delete fshira.foldera[f.id]; });
    m.produktet.forEach(function (p) {
      var c = celesiProduktit(p.kategoriaId, p.barkodi);
      produktet[c] = Object.assign({}, p, { prekurSe: tani });
      delete fshira.produktet[c];
    });
    ruajFshiraet();
    ruajBaze();
    try { localStorage.removeItem(KEY_KOPJA); } catch (e) { /* ok */ }
    rifreskoPamjen();
    rifreskoKopjen();
    toast((vetemNje(m) ? 'U rikthye: ' : 'U rikthyen: ') + pershkrimiIKopjes(m) + '.', 4000);
  });
  $('llKopjaHiq').addEventListener('click', async function () {
    if (!(await konfirmo('Të hiqet kopja?', 'Të fshirat s\'mund të rikthehen më nga ky telefon.', 'Hiqe'))) return;
    try { localStorage.removeItem(KEY_KOPJA); } catch (e) { /* ok */ }
    rifreskoKopjen();
  });

  // Ekzekutohet një herë për çdo hyrje/sesion: bashkon të dhënat e cloud-it me ato lokale (pa fshi
  // asgjë lokalisht — shih bashkoPaFshirje), pastaj sinkronizon prapë për të pajtuar krejt anët.
  var __uidISinkronizuarDarePasHyrjes = null;
  async function sinkronizoNeHyrje() {
    var u = perdoruesiAktual();
    if (ngaVizitori() || !u || !window.__stokuCloud) return;
    if (__uidISinkronizuarDarePasHyrjes === u.uid) return; // e ba tashmë për këtë hyrje
    __uidISinkronizuarDarePasHyrjes = u.uid;
    vendosStatusinCloud(T('cloudStatusiDukeSink'));
    var rez = await window.__stokuCloud.merr();
    if (rez.ok && rez.gjendja) {
      if (pajisjaEshteEPaprekur() && Array.isArray(rez.gjendja.foldera) && rez.gjendja.foldera.length > 0) {
        // Pajisje e re / adresë e re (p.sh. kalimi te stoku.site): këtu s'ka asgjë të përdoruesit, vetëm
        // 4 folderat e parazgjedhur bosh. Merret gjendja e cloud-it ashtu siç është — përndryshe folderat
        // e parazgjedhur që përdoruesi i ka fshirë më parë do të "ringjalleshin" në çdo pajisje.
        zbatoGjendjenNgaCloud(rez.gjendja);
      } else {
        var bashkuar = bashkoPaFshirje(rez.gjendja, gjendjaPerCloud());
        zbatoGjendjenNgaCloud(bashkuar);
      }
    }
    await kryeSinkronizimin();
    nisDegjuesinCloud();
  }

  var degjuesiCloud = null;
  // Gjendja e fundit nga cloud-i që mbërriti ndërsa një ruajtja jonë ishte në rrugë. S'hidhet më: zbatohet
  // sapo mbaron ruajtja (përndryshe ndryshimi i një pajisjeje tjetër, i ruajtur menjëherë pas nesh, s'shfaqej
  // këtu deri në ndryshimin e radhës).
  var __remoteNePritje = null;
  function zbatoNgaCloudBashkuar(remote) {
    var b = bashkoPaFshirje(remote, gjendjaPerCloud());
    zbatoBashkimin(b);
    // Kjo pajisje ka diçka më të re → dërgohet (pa e shtyrë një ruajtje që pret tashmë)
    if (!window.StokuBashkimi.eNjejte(b, remote) && !sinkronizoKohezi) planifikoSinkronizimin();
  }
  function zbatoRemoteNePritje() {
    var r = __remoteNePritje;
    if (!r || dukeSinkronizuar) return;
    __remoteNePritje = null;
    var lok = gjendjaPerCloud();
    if (window.StokuBashkimi.eNjejte(bashkoPaFshirje(r, lok), lok)) return; // kopje e vjetër: s'sjell asgjë të re
    zbatoNgaCloudBashkuar(r);
  }
  function nisDegjuesinCloud() {
    ndalDegjuesinCloud();
    if (!window.__stokuCloud || !window.__stokuCloud.degjo || !perdoruesiAktual()) return;
    degjuesiCloud = window.__stokuCloud.degjo(function (remote, tePaDerguara) {
      if (!remote) return;
      if (tePaDerguara || dukeSinkronizuar) { __remoteNePritje = remote; return; } // ndryshim i yni ende në rrugë
      __remoteNePritje = null;
      // Edhe kur një ruajtje lokale pret (kohëmatësi): bashkimi s'humb asgjë lokale, kështu që zbatohet menjëherë
      __degjuesiPritja = 0;
      zbatoNgaCloudBashkuar(remote);
    }, function () {
      // Dëgjuesi i Firestore-it mbaron pas një gabimi (p.sh. kuota ditore, rregulla të reja): rinis pas pak,
      // përndryshe ndryshimet nga pajisjet e tjera s'vinin më deri në rihapjen e aplikacionit
      ndalDegjuesinCloud();
      __degjuesiPritja = Math.min(5 * 60000, (__degjuesiPritja || 15000) * 2);
      clearTimeout(__degjuesiKohez);
      __degjuesiKohez = setTimeout(function () { if (!degjuesiCloud && perdoruesiAktual()) nisDegjuesinCloud(); }, __degjuesiPritja);
    });
  }
  var __degjuesiPritja = 0, __degjuesiKohez = null;
  window.addEventListener('online', function () {
    if (!degjuesiCloud && __uidISinkronizuarDarePasHyrjes && perdoruesiAktual()) { clearTimeout(__degjuesiKohez); nisDegjuesinCloud(); }
  });
  function ndalDegjuesinCloud() {
    clearTimeout(__degjuesiKohez);
    if (degjuesiCloud) { try { degjuesiCloud(); } catch (e) { /* ok */ } }
    degjuesiCloud = null;
    __remoteNePritje = null;
  }

  // E vërtetë vetëm kur kjo pajisje s'ka asnjë të dhënë të përdoruesit: asnjë produkt, folderat janë
  // pikërisht 4 të parazgjedhurit (të paprekur, pa emra të ndryshuar) dhe renditja s'është ndryshuar kurrë.
  function pajisjaEshteEPaprekur() {
    if (Object.keys(produktet).length > 0) return false;
    if (afatet.length > 0) return false; // afatet lokale (p.sh. të pa-sinkronizuara) s'duhet të humbin kurrë
    if (rendiFolderaveKoha) return false;
    if (foldera.length !== FOLDERAT_PARAZGJEDHUR.length) return false;
    return FOLDERAT_PARAZGJEDHUR.every(function (d, i) {
      return foldera[i] && foldera[i].id === d.id && foldera[i].emri === d.emri;
    });
  }

  // ---------- Lejet e llogarisë (v230, lejet.js): çka mund të përdorë kjo llogari; i cakton administratori ----------
  // Pa dokument (llogari e re, e pakontrolluar) → krejt të lejuara. Administratori dhe vizitori s'kanë kufizime.
  // Butonat me data-leja="çelësi" fshihen kur leja mungon; çdo veprim kontrollohet edhe vetë (leja).
  // v231: çka s'lejohet zhduket krejt, pa asnjë mesazh: përdoruesi s'duhet ta dijë as që ekziston (pa "s'të lejohet").
  var lejetG = window.StokuLejet ? window.StokuLejet.krijoGjendjen({
    cloud: function () { var c = window.__stokuCloud; return (c && c.lejet) || null; },
    gati: function () { var c = window.__stokuCloud; return !!(c && c.authGati); },
    uid: function () { var u = perdoruesiAktual(); return u ? u.uid : null; },
    admin: eshteAdminiIStokut,
    ndryshoi: function () {
      zbatoLejet();
      rifreskoMarketet(); // v241: administratori e ndezi/fiku "Merchandiser"
      __merchPara = eshteMerchandiser();
      // Pa PC (index.html mbeti në kompjuter vetëm për shkak të lejes): leja u kthye → versioni për kompjuter
      if (window.__stokuPaPc && leja('pc')) { window.__stokuPaPc = false; location.replace('pc.html'); }
    }
  }) : null;
  function leja(k) { return k === 'marketet' ? eshteMerchandiser() : !lejetG || lejetG.lejohet(k); }
  // v241: marketet vetëm për merchandiserët. Fiton zgjedhja e administratorit (lejet/{uid}.marketet); pa të, vlen
  // "Punoj si merchandiser" kur u hap llogaria (firebase-tel.js e ruan te 'stoku:merchandiser'). Llogaritë e vjetra s'e kanë.
  function eshteMerchandiser() {
    var u = perdoruesiAktual();
    if (!u || !(!lejetG || lejetG.lejohet('afatet'))) return false;
    var z = lejetG ? window.StokuLejet.zgjedhja(lejetG.lejet(), 'marketet') : null;
    if (z !== null) return z;
    try { var x = JSON.parse(localStorage.getItem('stoku:merchandiser') || 'null'); return !!(x && x.uid === u.uid && x.v === true); } catch (e) { return false; }
  }
  // "Çka ka të re" (teRejat.js): pa shënimet për pjesët që s'lejohen ("Dërgo në PC" kërkon edhe "pc")
  function lejaPerTeRejat(k) { return k === 'dergoNePc' ? lejaDergoNePc() : k === 'marketet' ? leja(k) || eshteAdminiIStokut() : leja(k); }
  function zbatoLejet(paVizatim) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-leja]'), function (el) {
      el.classList.toggle('leja-ndaluar', !leja(el.getAttribute('data-leja')));
    });
    // Menuja "Excel" e afateve s'ka kuptim pa importin dhe pa eksportin
    var xl = $('afExcel') && $('afExcel').parentNode;
    if (xl) xl.classList.toggle('leja-ndaluar', !leja('afatetImporto') && !leja('eksportExcel'));
    document.body.classList.toggle('leja-pa-stok', !leja('stoku'));
    // v231: Cilësimet pa pjesët që s'kanë kuptim: skanimi pa Stok dhe pa Afate, njoftimet pa Afate dhe pa Grup
    var meStok = leja('stoku'), meAfate = leja('afatet'), meGrup = leja('grupi');
    $('tabSkenimi').classList.toggle('leja-ndaluar', !meStok && !meAfate);
    $('opsPaEmer').closest('.seksion').classList.toggle('leja-ndaluar', !meStok);
    $('tabNjoftimet').classList.toggle('leja-ndaluar', !meAfate && !meGrup);
    $('njIntro').textContent = (meAfate && meGrup ? 'Njoftimet e Grupit dhe të afateve.' : meGrup ? 'Njoftimet e Grupit.' : 'Njoftimet e afateve.') +
      ' Vijnë edhe kur Stoku është i mbyllur.';
    if (paVizatim) return;
    // Pjesët që s'lejohen më mbyllen; listat rivizatohen pa butonat e ndaluar
    if (!leja('afatet') && $('dlgAfatet').classList.contains('hapur')) mbyllAfatetFaqe();
    if (!leja('grupi') && $('dlgEkipi').classList.contains('hapur')) mbyllEkipiFaqe();
    // Faqja e hapur e Cilësimeve (ose prindi i saj) s'lejohet më → menuja
    var rrFaqes = faqjaEOpsioneve && document.querySelector('#kategoriMenu [data-faqe="' + (PRINDI_I_FAQES[faqjaEOpsioneve] || faqjaEOpsioneve) + '"]');
    if ((rrFaqes && rrFaqes.classList.contains('leja-ndaluar')) || (!leja('stoku') && neFaqenEStokut())) aktivizoTabin(null);
    if (!leja('stoku') && folderiAktual !== null) mbrapaNeFoldera();
    else if (folderiAktual !== null) renderLista();
    else { renderFolderat(); renderKerkimiGlobal(); }
    if ($('dlgAfatet').classList.contains('hapur')) renderAfatet();
    if ($('dlgEkipi').classList.contains('hapur')) vizatoEkipen(true);
    rifreskoTabet();
    kontrolloNjoftimet(); // pa afatet: pa njoftime për skadimin (dhe serveri pa listë); me to: rikthehen
    zbatoLejetJashte();
    rifreskoNjoftimet();
    hapFaqenBaze();
  }
  // v231: lejet vlejnë edhe jashtë faqes. Pa "Grupi" kjo pajisje s'regjistrohet për njoftimet e grupit (as push, as
  // aplikacioni Android); pa "Afatet" serveri merr listë bosh afatesh (s'vjen njoftimi ditor, ora s'tregon produkte).
  function afatetPerServerin() { return leja('afatet') ? MK.meEmra(afatet, marketet) : []; } // v241: me emrin e marketit (njoftimi sipas marketeve)
  function zbatoLejetJashte() {
    var e = ekipaCloud();
    if (!e || !perdoruesiAktual()) return;
    if (e.lejoPushinEGrupit) e.lejoPushinEGrupit(leja('grupi')).then(rifreskoNjoftimet, function () { /* ok */ });
    if (!leja('afatet') && e.dergoAfatetPerOrarin) e.dergoAfatetPerOrarin([]).catch(function () { /* ok */ });
  }
  // v231: pa lejen "Stoku" s'ka kryefaqe me foldera (as tab "Stoku"): faqja bazë bëhet pjesa e parë e lejuar
  // (Afatet, Grupi, ose Cilësimet kur s'ka asnjërën), e hapur gjithmonë si kryefaqja. S'numërohet si nivel i historisë:
  // "mbrapa" s'e mbyll (si kryefaqja), ndërsa kur mbyllet një tab tjetër, rihapet ajo.
  function faqjaBaze() {
    if (leja('stoku')) return null;
    return leja('afatet') ? 'dlgAfatet' : leja('grupi') ? 'dlgEkipi' : 'dlgOpsione';
  }
  function hapFaqenBaze() {
    var b = faqjaBaze();
    if (!b) return;
    if ($('dlgAfatet').classList.contains('hapur') || $('dlgEkipi').classList.contains('hapur') || $('dlgOpsione').classList.contains('hapur')) return;
    kaloTab(function () { if (b === 'dlgAfatet') hapAfatetFaqe(); else if (b === 'dlgEkipi') hapEkipiFaqe(); else hapOpsionet(); });
  }
  // Pas mbylljes së një tabi: nëse s'u hap tjetër në vend të tij (p.sh. "mbrapa"), kthehet faqja bazë
  function pasMbylljesSeTabit() {
    if (!faqjaBaze()) return;
    Promise.resolve().then(hapFaqenBaze);
  }
  window.addEventListener('stoku-auth-ndryshoi', function () { if (lejetG) lejetG.rinis(); zbatoLejetJashte(); });
  window.addEventListener('stoku-cloud-gati', function () { if (lejetG) lejetG.rinis(); zbatoLejetJashte(); });

  // Sasia e shpejtë (butonat +/- te lista, numërimi me kamerë). v240: leje si të tjerat (Cilësimet → Përdoruesit,
  // "stokuPlusMinus"), e lejuar për krejt llogaritë, vizitorin dhe llogaritë e reja; më parë e jepte pronari i grupit.
  // Sasia: deri në 6 shifra (afatet.js); më e gjatë zakonisht është një barkod i skanuar në fushën e sasisë
  var SASIA_E_MADHE = window.StokuAfatet.SASIA_E_MADHE;
  function sasiaEPranueshme(t) { return window.StokuAfatet.sasiaEPranueshme(t); }
  function eLejuarSasiaShpejte() { return leja('stokuNdrysho') && leja('stokuPlusMinus'); }
  try { localStorage.removeItem('stoku:leja:sasia-shpejte'); } catch (e) { /* ok */ } // leja e vjetër (para v240)

  function rifreskoDukjenECloud() {
    var u = perdoruesiAktual(), viz = !u && ngaVizitori();
    $('cloudHyrjeSeksion').style.display = u ? 'none' : '';
    $('cloudHyrjeSeksion').classList.toggle('si-vizitor', viz);
    $('vizShirit').hidden = !viz;
    $('cloudHyrjeTitull').textContent = viz ? 'Je si vizitor' : 'Hyr në llogari';
    $('cloudHyrjeNen').textContent = viz ? 'Këto janë të dhëna shembull dhe ruhen vetëm në këtë telefon: provo lirisht. Me llogari ruhen në cloud, i sheh në çdo pajisje dhe punon me Grupin. Kur hyn, prova fshihet.'
      : 'Që lista të mos humbet dhe të shihet në çdo pajisje.';
    $('cloudBrendaSeksion').style.display = u ? '' : 'none';
    $('llogariaBrendaSeksion').style.display = u ? '' : 'none';
    rifreskoKopjen();
    rregulloVijatNdarese();
    if (u) {
      $('cloudHyrePerTeksti').textContent = T('cloudHyrePerTeksti', { emri: emriPerdoruesitAktual() });
      if (!statusiCloudFundit) vendosStatusinCloud(T('cloudStatusiAsgje'));
    } else {
      $('cloudGabimHint').textContent = '';
      $('cloudNdryshoGabimHint').textContent = '';
    }
    rifreskoStatusetOpsioneve();
  }
  rifreskoDukjenECloud();

  window.addEventListener('stoku-cloud-gati', function () {
    rifreskoDukjenECloud();
    sinkronizoNeHyrje();
  });
  window.addEventListener('stoku-auth-ndryshoi', function () {
    if (!perdoruesiAktual()) { __uidISinkronizuarDarePasHyrjes = null; ndalDegjuesinCloud(); vendosStatusinEAfateve(''); statusiCloudFundit = ''; }
    rifreskoDukjenECloud();
    sinkronizoNeHyrje();
    emriNeKrye();
  });
  if (window.__stokuCloud) { rifreskoDukjenECloud(); sinkronizoNeHyrje(); }

  function tekstiGabimitCloud(kodi) {
    if (kodi === 'auth/email-already-in-use') return T('cloudLlogariaEkziston');
    if (kodi === 'auth/invalid-credential' || kodi === 'auth/wrong-password' || kodi === 'auth/user-not-found') return T('cloudHyrjeGabim');
    if (kodi === 'auth/weak-password') return T('cloudFjalekalimiIShkurter');
    if (kodi === 'auth/requires-recent-login') return T('cloudDuhetRihyrje');
    if (kodi === 'auth/operation-not-allowed') return T('cloudDuhetKonfigurim');
    return T('cloudGabimPergjithshem') + (kodi ? ' (' + kodi + ')' : '');
  }

  async function kryeRregjistrimHyrje(regjistrim, idUsername, idFjalekalimi, idGabim) {
    if (ngaVizitori()) { window.StokuPorta.hapHyrjen(); return; } // prova: hyrja vetëm te porta
    if (dukeRregjistruarApoHyrje || !window.__stokuCloud) return;
    idUsername = idUsername || 'cloudUsername';
    idFjalekalimi = idFjalekalimi || 'cloudFjalekalimi';
    idGabim = idGabim || 'cloudGabimHint';
    var emri = $(idUsername).value.trim();
    var fjalekalimi = $(idFjalekalimi).value;
    if (!emri || !fjalekalimi) { $(idGabim).textContent = T('cloudPlotesoFushat'); return; }
    if (!emriEshteVlefshem(emri)) { $(idGabim).textContent = T('cloudEmriIShkurter'); return; }
    if (!fjalekalimiEshteVlefshem(fjalekalimi)) { $(idGabim).textContent = T('cloudFjalekalimiIShkurter'); return; }
    $(idGabim).textContent = '';
    dukeRregjistruarApoHyrje = true;
    var rez = regjistrim
      ? await window.__stokuCloud.regjistrohu(emri, fjalekalimi)
      : await window.__stokuCloud.hyr(emri, fjalekalimi);
    dukeRregjistruarApoHyrje = false;
    if (!rez.ok) {
      $(idGabim).textContent = tekstiGabimitCloud(rez.kodi);
      return;
    }
    $(idFjalekalimi).value = '';
    rifreskoDukjenECloud();
    toast(T(regjistrim ? 'cloudLlogariaUKrijua' : 'cloudHyrjaUKry'));
    sinkronizoNeHyrje();
  }

  $('cloudKrijoLlogari').addEventListener('click', function () { kryeRregjistrimHyrje(true, 'cloudUsername', 'cloudFjalekalimi', 'cloudGabimHint'); });
  // Vizitori: hyrja ose llogaria e re bëhen te porta; "Fillo nga e para" i kthen të dhënat shembull
  function hapHyrjenNgaProva() { if (window.StokuPorta && window.StokuPorta.hapHyrjen) window.StokuPorta.hapHyrjen(); }
  $('cloudVizHyr').addEventListener('click', hapHyrjenNgaProva);
  $('vizShiritHyr').addEventListener('click', hapHyrjenNgaProva);
  $('cloudVizRinis').addEventListener('click', async function () {
    var po = await konfirmo('Të fillojë prova nga e para?', 'Ndryshimet e tua në provë fshihen dhe kthehen të dhënat shembull.', 'Fillo nga e para');
    if (po && window.StokuPorta && window.StokuPorta.rinisProven) window.StokuPorta.rinisProven();
  });
  $('cloudHyrBtn').addEventListener('click', function () { kryeRregjistrimHyrje(false, 'cloudUsername', 'cloudFjalekalimi', 'cloudGabimHint'); });

  $('cloudSinkronizoTani').addEventListener('click', function () { kryeSinkronizimin(); });
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

  $('cloudRiktheTani').addEventListener('click', async function () {
    if (!perdoruesiAktual() || !window.__stokuCloud || dukeRikthyerNgaCloud) return; // jo dy rikthime njëkohësisht
    dukeRikthyerNgaCloud = true;
    var statusiPara = statusiCloudFundit;
    vendosStatusinCloud(T('cloudStatusiDukeRikthyer'));
    var rez = await window.__stokuCloud.merr();
    dukeRikthyerNgaCloud = false;
    if (!rez.ok) { // gabim leximi (p.sh. pa internet): s'do të thotë që cloud-i është bosh
      vendosStatusinCloud(statusiPara || T('cloudStatusiAsgje'));
      toast('Të dhënat e cloud-it s\'u lexuan. Kontrollo internetin dhe provo përsëri.', 4500);
      return;
    }
    if (!rez.gjendja) {
      vendosStatusinCloud(T('cloudStatusiAsgje'));
      toast(T('cloudNukKaAsgje'));
      return;
    }
    var aktual = Object.keys(produktet).length;
    var po = await konfirmo(T('cloudTeRiktheteCloud'), T('cloudRiktheTekst', { aktual: aktual }), T('rikthe'));
    if (!po) { if (statusiPara) vendosStatusinCloud(statusiPara); else rifreskoDukjenECloud(); return; }
    fshira = { produktet: {}, foldera: {}, afatet: {} };
    ruajFshiraet();
    if (!Array.isArray(rez.gjendja.afatet)) rez.gjendja.afatet = [];
    zbatoGjendjenNgaCloud(rez.gjendja, true);
    toast(T('cloudURikthye'));
    vendosStatusinCloud(T('cloudStatusiUSink', { kur: oraTani() }));
  });

  var veprimiNePritje = null; // funksioni që duhet riprovuar pas ri-identifikimit të suksesshëm

  function fshehRiautentifikimin() {
    veprimiNePritje = null;
    $('cloudRiautSeksion').style.display = 'none';
    $('cloudFjalekalimiAktual').value = '';
  }

  $('cloudNdryshoEmrin').addEventListener('click', async function () {
    if (!window.__stokuCloud || !window.__stokuCloud.ndryshoEmrin) return;
    var emriRi = $('cloudEmriRi').value.trim();
    if (!emriRi) { $('cloudNdryshoGabimHint').textContent = T('cloudPlotesoEmrinRi'); return; }
    if (!emriEshteVlefshem(emriRi)) { $('cloudNdryshoGabimHint').textContent = T('cloudEmriIShkurter'); return; }
    $('cloudNdryshoGabimHint').textContent = '';
    var rez = await window.__stokuCloud.ndryshoEmrin(emriRi);
    if (!rez.ok) {
      if (rez.kodi === 'auth/requires-recent-login') {
        veprimiNePritje = function () { return window.__stokuCloud.ndryshoEmrin(emriRi); };
        veprimiNePritje.mesazhi = 'cloudEmriURiNdryshuar';
        $('cloudRiautSeksion').style.display = '';
        $('cloudFjalekalimiAktual').focus();
        return;
      }
      $('cloudNdryshoGabimHint').textContent = tekstiGabimitCloud(rez.kodi);
      return;
    }
    $('cloudEmriRi').value = '';
    fshehRiautentifikimin();
    rifreskoDukjenECloud();
    toast(T('cloudEmriURiNdryshuar'));
  });

  $('cloudNdryshoFjalekalimin').addEventListener('click', async function () {
    if (!window.__stokuCloud || !window.__stokuCloud.ndryshoFjalekalimin) return;
    var fjalekalimiRi = $('cloudFjalekalimiRi').value;
    if (!fjalekalimiRi) { $('cloudNdryshoGabimHint').textContent = T('cloudPlotesoFjalekalimin'); return; }
    if (!fjalekalimiEshteVlefshem(fjalekalimiRi)) { $('cloudNdryshoGabimHint').textContent = T('cloudFjalekalimiIShkurter'); return; }
    $('cloudNdryshoGabimHint').textContent = '';
    var rez = await window.__stokuCloud.ndryshoFjalekalimin(fjalekalimiRi);
    if (!rez.ok) {
      if (rez.kodi === 'auth/requires-recent-login') {
        veprimiNePritje = function () { return window.__stokuCloud.ndryshoFjalekalimin(fjalekalimiRi); };
        veprimiNePritje.mesazhi = 'cloudFjalekalimiURiNdryshuar';
        $('cloudRiautSeksion').style.display = '';
        $('cloudFjalekalimiAktual').focus();
        return;
      }
      $('cloudNdryshoGabimHint').textContent = tekstiGabimitCloud(rez.kodi);
      return;
    }
    $('cloudFjalekalimiRi').value = '';
    fshehRiautentifikimin();
    toast(T('cloudFjalekalimiURiNdryshuar'));
  });

  $('btnRiautentifiko').addEventListener('click', async function () {
    if (!window.__stokuCloud || !window.__stokuCloud.riautentifikohu || !veprimiNePritje) return;
    var fjalekalimiAktual = $('cloudFjalekalimiAktual').value;
    if (!fjalekalimiAktual) return;
    var rezAut = await window.__stokuCloud.riautentifikohu(fjalekalimiAktual);
    if (!rezAut.ok) { $('cloudNdryshoGabimHint').textContent = T('riautGabim'); return; }
    var veprimi = veprimiNePritje;
    var rez = await veprimi();
    if (!rez.ok) { $('cloudNdryshoGabimHint').textContent = tekstiGabimitCloud(rez.kodi); return; }
    fshehRiautentifikimin();
    $('cloudEmriRi').value = '';
    $('cloudFjalekalimiRi').value = '';
    rifreskoDukjenECloud();
    toast(T(veprimi.mesazhi || 'cloudFjalekalimiURiNdryshuar')); // "Emri … u ndryshua" ose "Fjalëkalimi u ndryshua", sipas veprimit
  });

  $('cloudDilBtn').addEventListener('click', async function () {
    var po = await konfirmo(T('cloudTeDilet'), T('cloudDilTekst'), T('cloudDilBtn'));
    if (!po) return;
    // Ruajtja e fundit para daljes; nëse s'arrin në cloud (pa internet), paralajmëro: kur në këtë pajisje hyn
    // një llogari tjetër, të dhënat lokale hiqen — ndryshimet e paruajtura do të humbnin.
    for (var i = 0; i < 40 && dukeSinkronizuar; i++) await new Promise(function (r) { setTimeout(r, 250); });
    try { await kryeSinkronizimin(); } catch (e) { /* ndryshimet e fundit mbeten lokalisht */ }
    if (__sinkDeshtoi || dukeSinkronizuar) {
      var gjithsesi = await konfirmo('Ndryshimet e fundit s\'janë ruajtur në cloud',
        'S\'ka lidhje me internetin. Nëse del tani dhe në këtë telefon hyn një llogari tjetër, ndryshimet e paruajtura humbin. Më mirë prit internetin. Të dilet gjithsesi?', 'Dil gjithsesi');
      if (!gjithsesi) return;
    }
    if (window.__stokuCloud && window.__stokuCloud.dil) await window.__stokuCloud.dil();
    rifreskoDukjenECloud();
    if ($('dlgOpsione').classList.contains('hapur')) mbyllOpsionet();
  });

  // ---------- Lista + kërkimi ----------
  function renderLista() {
    if (folderiAktual === null) return;
    var k = $('kerko').value.trim().toLowerCase();
    var te = produktetENjeFolderi(folderiAktual);
    te.sort(krahaso);

    $('titulli').textContent = emriFolderit(folderiAktual) + ' (' + T('njesiaProdukteve', { n: te.length }) + ')';
    $('btnFshiTeGjitha').disabled = te.length === 0;

    var fil = te;
    if (k) {
      fil = te.filter(function (p) {
        return String(p.emri || '').toLowerCase().indexOf(k) !== -1 || String(p.barkodi || '').toLowerCase().indexOf(k) !== -1 ||
          String(p.furnizuesi || '').toLowerCase().indexOf(k) !== -1;
      });
    }

    var lista = $('lista');
    lista.textContent = '';
    var frag = document.createDocumentFragment();

    if (fil.length === 0 && k) {
      var i0 = document.createElement('div');
      i0.className = 'info';
      i0.textContent = T('nukUGjetAsnjeProdukt');
      frag.appendChild(i0);
    }

    var lejaShpejt = eLejuarSasiaShpejte(); // një herë, jo për çdo rresht
    var lejaNdrysho = leja('stokuNdrysho'); // v231: pa të, rreshti s'hapet (vetëm shihet)
    fil.slice(0, LIMIT_RENDER).forEach(function (p) {
      var rreshti = document.createElement('div');
      rreshti.className = 'artikull';
      var majtas = document.createElement('div');
      majtas.className = 'majtas';
      var emri = document.createElement('div');
      emri.className = 'emri';
      emri.textContent = p.emri || T('paEmerListe');
      if (!p.emri) emri.className = 'emri bosh';
      var kodi = document.createElement('div');
      kodi.className = 'kodi';
      kodi.textContent = p.barkodi + (p.furnizuesi ? ' · ' + p.furnizuesi : ''); // v212: furnizuesi (nëse është shënuar)
      majtas.appendChild(emri);
      majtas.appendChild(kodi);
      rreshti.appendChild(majtas);

      if (lejaShpejt) {
        var celesiRreshti = celesiProduktit(folderiAktual, p.barkodi);
        var mbeshtjellesi = document.createElement('div');
        mbeshtjellesi.className = 'sasia-hap';
        var btnMinus = document.createElement('button');
        btnMinus.type = 'button';
        btnMinus.className = 'sasia-hap-btn';
        btnMinus.textContent = '−';
        btnMinus.setAttribute('aria-label', T('zvogeloSasine'));
        var sasiaNumri = document.createElement('input');
        sasiaNumri.type = 'number';
        sasiaNumri.inputMode = 'numeric';
        sasiaNumri.className = 'sasia sasia-input' + (p.sasia <= 0 ? ' sasia--zero' : '');
        sasiaNumri.value = String(p.sasia);
        sasiaNumri.min = '0';
        var btnPlus = document.createElement('button');
        btnPlus.type = 'button';
        btnPlus.className = 'sasia-hap-btn';
        btnPlus.textContent = '+';
        btnPlus.setAttribute('aria-label', T('rritSasine'));
        var ndryshoSasineShpejt = function (delta) {
          if (!eLejuarSasiaShpejte()) { renderLista(); return; } // leja u hoq ndërkohë
          var prod = produktet[celesiRreshti];
          if (!prod) return;
          var re = Math.max(0, prod.sasia + delta);
          if (re === prod.sasia) return;
          prod.sasia = re;
          prod.prekurSe = Date.now();
          ruajBaze();
          renderLista();
          renderFolderat();
        };
        var vendosSasineDrejtperdrejt = function () {
          if (!eLejuarSasiaShpejte()) { renderLista(); return; }
          var prod = produktet[celesiRreshti];
          if (!prod) return;
          var v = parseInt(sasiaNumri.value, 10);
          if (Number.isFinite(v) && !sasiaEPranueshme(sasiaNumri.value)) { toast(SASIA_E_MADHE, 4500); v = prod.sasia; }
          if (!Number.isFinite(v) || v < 0) v = prod.sasia;
          if (v === prod.sasia) { sasiaNumri.value = String(prod.sasia); return; }
          prod.sasia = v;
          prod.prekurSe = Date.now();
          ruajBaze();
          renderLista();
          renderFolderat();
        };
        btnMinus.addEventListener('click', function (ev) { ev.stopPropagation(); ndryshoSasineShpejt(-1); });
        btnPlus.addEventListener('click', function (ev) { ev.stopPropagation(); ndryshoSasineShpejt(1); });
        sasiaNumri.addEventListener('click', function (ev) { ev.stopPropagation(); });
        sasiaNumri.addEventListener('focus', function () { sasiaNumri.select(); });
        sasiaNumri.addEventListener('change', vendosSasineDrejtperdrejt);
        sasiaNumri.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter') { ev.preventDefault(); sasiaNumri.blur(); }
        });
        mbeshtjellesi.appendChild(btnMinus);
        mbeshtjellesi.appendChild(sasiaNumri);
        mbeshtjellesi.appendChild(btnPlus);
        rreshti.appendChild(mbeshtjellesi);
      } else {
        var sasia = document.createElement('div');
        // 0 = e kuqe ("Sasi 0" te kryefaqja)
        sasia.className = 'sasia' + (p.sasia <= 0 ? ' sasia--zero' : '');
        sasia.textContent = String(p.sasia);
        rreshti.appendChild(sasia);
      }

      if (lejaNdrysho) rreshti.addEventListener('click', function () {
        burimiIFundit = 'lista';
        hapDialogun(p.barkodi);
      });
      frag.appendChild(rreshti);
    });

    if (fil.length > LIMIT_RENDER) {
      var i1 = document.createElement('div');
      i1.className = 'info';
      i1.textContent = T('shfaqenNga', { limit: LIMIT_RENDER, gjithsej: fil.length });
      frag.appendChild(i1);
    }
    lista.appendChild(frag);
  }

  // ---------- Dialogu i produktit ----------
  var burimiIFundit = 'fushe'; // 'fushe' (scanner/tastierë), 'kamera' ose 'lista'
  var dialogu = null;          // { barkodi, ekzistues }

  function hapDialogun(barkodi) {
    if (folderiAktual === null) return;
    var e = produktet[celesiProduktit(folderiAktual, barkodi)] || null;
    // v230: produkt i ri = "Shto produkte të reja"; produkt që ekziston = "Ndrysho produktet".
    // v231: pa lejen s'hapet dritarja dhe s'thuhet pse: produkti që ekziston gjendet në listë (kërkimi),
    // barkodi i ri thjesht s'është në këtë folder.
    if (!leja(e ? 'stokuNdrysho' : 'stokuShto')) {
      if (e) { $('kerko').value = barkodi; renderLista(); }
      else toast('Ky barkod s\'është në këtë folder.', 3000);
      fokusoBarkodin();
      return;
    }
    dialogu = { barkodi: barkodi, ekzistues: e };
    var paEmer = opsione.paEmer;
    $('dlgTitulli').textContent = e ? T('produktiEkziston', { sasia: e.sasia }) : (paEmer ? T('produktIRiPaEmer') : T('produktIRi'));
    $('dlgKodi').textContent = T('barkodiEtiketa', { barkodi: barkodi }) + ((paEmer && e && e.emri) ? '\n' + T('emriEtiketa', { emri: e.emri }) : '');
    $('fushaEmri').style.display = paEmer ? 'none' : '';
    $('dlgEmri').value = e ? e.emri : emriNgaProduktet(barkodi); // produkt i ri: emri nga kujtesa (nëse njihet)
    // v212: furnizuesi, opsional; produkt i ri: nga kujtesa ose afatet (nëse njihet), përndryshe bosh
    $('fushaFurnizuesi').style.display = paEmer ? 'none' : '';
    $('dlgFurnizuesi').value = e ? (e.furnizuesi || '') : furnizuesiNgaAfatet(barkodi);
    if (!paEmer) mbushFurnizuesit();
    $('dlgSasia').value = '';
    $('dlgSasia').placeholder = e ? T('sasiaPerTuShtuar') : T('sasia');
    $('dlgFshij').style.display = e ? '' : 'none';
    $('dlgZhvendosBtn').style.display = e ? 'block' : 'none';
    $('dlgProdukt').classList.add('hapur');
    ((e || paEmer || $('dlgEmri').value) ? $('dlgSasia') : $('dlgEmri')).focus();
  }

  function mbyllDialogun() {
    $('dlgProdukt').classList.remove('hapur');
    dialogu = null;
    if (opsione.pda || (burimiIFundit === 'fushe' && opsione.scanner)) {
      // kthe fokusin te fusha e barkodit (për skanerin e jashtëm)
      $('barkodi').focus();
    } else {
      document.activeElement && document.activeElement.blur && document.activeElement.blur();
    }
  }

  function ruajProduktin() {
    if (!dialogu) return;
    // Folderi u fshi ndërkohë nga një pajisje tjetër: produkti s'ka ku të ruhet (përndryshe humbte pa asnjë fjalë)
    if (folderiAktual === null || !foldera.some(function (f) { return f.id === folderiAktual; })) {
      mbyllDialogun(); rifreskoPamjen();
      toast('Folderi u fshi nga një pajisje tjetër. Produkti s\'u ruajt.', 4500);
      return;
    }
    // Leja mund të jetë hequr ndërsa dialogu ishte i hapur
    if (!leja(produktet[celesiProduktit(folderiAktual, dialogu.barkodi)] ? 'stokuNdrysho' : 'stokuShto')) { mbyllDialogun(); return; }
    var emri = opsione.paEmer ? (dialogu.ekzistues ? dialogu.ekzistues.emri : '') : $('dlgEmri').value.trim();
    var tekstSasia = $('dlgSasia').value.trim();
    if (!opsione.paEmer && !emri) { toast(T('shkruajEmrin')); $('dlgEmri').focus(); return; }
    if (!/^-?\d+$/.test(tekstSasia)) { toast(T('shkruajSasine')); $('dlgSasia').focus(); return; }
    // Një barkod i skanuar në fushën e sasisë (skaneri PDA) s'ruhet si sasi
    if (!sasiaEPranueshme(tekstSasia)) { toast(SASIA_E_MADHE, 4500); $('dlgSasia').focus(); $('dlgSasia').select(); return; }
    var sasia = parseInt(tekstSasia, 10);
    // Gjendja AKTUALE e produktit (jo ajo e çastit kur u hap dialogu): nëse ndërkohë një pajisje
    // tjetër e ndryshoi sasinë, shtesa i mbivendoset asaj, jo vlerës së vjetër.
    var e = produktet[celesiProduktit(folderiAktual, dialogu.barkodi)] || null;
    if (opsione.paEmer && !emri && e) emri = e.emri || '';
    var total = Math.max(0, (e ? e.sasia : 0) + sasia); // stoku s'mund të jetë negativ
    // Object.assign: fushat e tjera të produktit (p.sh. furnizuesi nga importi) s'humbin kur ndryshon sasia
    var ri = Object.assign({}, e || {}, { barkodi: dialogu.barkodi, emri: emri, sasia: total, kategoriaId: folderiAktual, prekurSe: Date.now() });
    // v212: furnizuesi (opsional): i shkruar → ruhet; fusha e zbrazur te një produkt ekzistues → hiqet
    var furn = opsione.paEmer ? null : $('dlgFurnizuesi').value.replace(/\s+/g, ' ').trim().slice(0, 80);
    if (furn) ri.furnizuesi = furn; else if (furn === '') delete ri.furnizuesi;
    produktet[celesiProduktit(folderiAktual, dialogu.barkodi)] = ri;
    if (!opsione.paEmer) mesoNgaPerdoruesi(dialogu.barkodi, emri, furn || '');
    ruajBaze();
    mbyllDialogun();
    renderLista();
    renderFolderat();
  }

  function fshijProduktin() {
    if (!dialogu || !dialogu.ekzistues || !leja('stokuFshi')) return;
    if (!produktet[celesiProduktit(folderiAktual, dialogu.barkodi)]) { mbyllDialogun(); renderLista(); return; } // u fshi ndërkohë nga një pajisje tjetër
    delete produktet[celesiProduktit(folderiAktual, dialogu.barkodi)];
    shenoProduktinEFshire(celesiProduktit(folderiAktual, dialogu.barkodi));
    ruajBaze();
    mbyllDialogun();
    renderLista();
    renderFolderat();
  }

  // ---------- Zhvendos produktin në folder tjetër ----------
  function hapZhvendosin() {
    if (!dialogu || !dialogu.ekzistues || !leja('stokuNdrysho')) return;
    var teTjerat = foldera.filter(function (f) { return f.id !== folderiAktual; });
    $('zhvendosHint').textContent = T('zhvendosHint', { emri: dialogu.ekzistues.emri || dialogu.barkodi });

    var cont = $('zhvendosLista');
    cont.textContent = '';
    if (teTjerat.length === 0) {
      var i0 = document.createElement('div');
      i0.className = 'info';
      i0.textContent = T('zhvendosAsnjeFolder');
      cont.appendChild(i0);
    } else {
      teTjerat.forEach(function (f) {
        var rr = document.createElement('button');
        rr.type = 'button';
        rr.className = 'kategori-rresht';
        var emri = document.createElement('span');
        emri.textContent = f.emri;
        var shigjeta = document.createElement('span');
        shigjeta.className = 'shigjeta';
        shigjeta.textContent = '›';
        rr.appendChild(emri);
        rr.appendChild(shigjeta);
        rr.addEventListener('click', function () { zhvendosProduktinNeFolderin(f); });
        cont.appendChild(rr);
      });
    }
    $('dlgZhvendos').classList.add('hapur');
  }

  function mbyllZhvendosin() { $('dlgZhvendos').classList.remove('hapur'); }

  function zhvendosProduktinNeFolderin(destinacioni) {
    if (!dialogu || !dialogu.ekzistues || !leja('stokuNdrysho')) return;
    var barkodi = dialogu.barkodi;
    var celesiVjeter = celesiProduktit(folderiAktual, barkodi);
    var celesiRi = celesiProduktit(destinacioni.id, barkodi);
    // Gjendja AKTUALE e produktit, jo kopja e marrë kur u hap dritarja: një pajisje tjetër mund ta ketë
    // ndryshuar sasinë (ose fshirë produktin) ndërkohë.
    var produkti = produktet[celesiVjeter];
    if (!produkti) { mbyllZhvendosin(); mbyllDialogun(); renderLista(); renderFolderat(); return; } // u fshi ndërkohë
    if (!foldera.some(function (f) { return f.id === destinacioni.id; })) { mbyllZhvendosin(); renderFolderat(); return; } // folderi u fshi ndërkohë
    var ekzistuesNeDestinacion = produktet[celesiRi] || null;

    delete produktet[celesiVjeter];
    shenoProduktinEFshire(celesiVjeter);
    var total = (ekzistuesNeDestinacion ? ekzistuesNeDestinacion.sasia : 0) + produkti.sasia;
    var emriPerRuajtje = (ekzistuesNeDestinacion && ekzistuesNeDestinacion.emri) ? ekzistuesNeDestinacion.emri : produkti.emri;
    produktet[celesiRi] = {
      barkodi: barkodi, emri: emriPerRuajtje, sasia: total,
      kategoriaId: destinacioni.id, prekurSe: Date.now()
    };
    var furnPerRuajtje = (ekzistuesNeDestinacion && ekzistuesNeDestinacion.furnizuesi) || produkti.furnizuesi; // v212
    if (furnPerRuajtje) produktet[celesiRi].furnizuesi = furnPerRuajtje;
    ruajBaze();

    mbyllZhvendosin();
    mbyllDialogun();
    renderLista();
    renderFolderat();
    toast(ekzistuesNeDestinacion
      ? T('zhvendosUBashkua', { folder: destinacioni.emri, sasia: total })
      : T('zhvendosUKry', { folder: destinacioni.emri }), 4000);
  }

  $('dlgZhvendosBtn').addEventListener('click', hapZhvendosin);
  $('zhvendosAnulo').addEventListener('click', mbyllZhvendosin);
  $('dlgZhvendos').addEventListener('click', function (ev) {
    if (ev.target === $('dlgZhvendos')) mbyllZhvendosin();
  });

  $('dlgRuaj').addEventListener('click', ruajProduktin);
  $('dlgAnulo').addEventListener('click', mbyllDialogun);
  $('dlgFshij').addEventListener('click', fshijProduktin);
  $('dlgEmri').addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter') { ev.preventDefault(); $('dlgFurnizuesi').focus(); }
  });
  $('dlgFurnizuesi').addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter') { ev.preventDefault(); $('dlgSasia').focus(); }
  });
  $('dlgSasia').addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter') { ev.preventDefault(); ruajProduktin(); }
  });
  function koregjoSasine(delta) {
    var v = $('dlgSasia').value.trim();
    var n = /^-?\d+$/.test(v) ? parseInt(v, 10) : 0;
    $('dlgSasia').value = String(n + delta);
    $('dlgSasia').focus();
  }
  $('dlgSasiaMinus').addEventListener('click', function () { koregjoSasine(-1); });
  $('dlgSasiaPlus').addEventListener('click', function () { koregjoSasine(1); });
  $('dlgProdukt').addEventListener('click', function (ev) {
    if (ev.target === $('dlgProdukt')) mbyllDialogun();
  });

  // ---------- Fusha e barkodit (skaner i jashtëm / tastierë / PDA) ----------
  var pdaKohez = null;

  // Heuristikë: a duket kjo si diçka tjetër përveç barkodit të një produkti (p.sh. kod QR ose tekst i gjatë)?
  // Barkodet e produkteve janë pothuajse gjithmonë vetëm numra (6-14 shifra).
  function duketSiDiçkaTjeterVeçBarkod(tekst) {
    if (/^[0-9]{6,14}$/.test(tekst)) return false;
    if (tekst.length > 30 || tekst.indexOf('::') !== -1) return true;
    if (/^https?:\/\//i.test(tekst)) return true;
    if (/\s/.test(tekst)) return true;
    return false;
  }

  function skanoBarkodin() {
    clearTimeout(pdaKohez);
    // Nëse ndërkohë është hapur një dritare tjetër (Opsionet, Eksporti, Fshirja), mos hap dialogun e produktit mbi të.
    // Fusha zbrazet gjithsesi: përndryshe skanimi tjetër i shtohej këtij (një "barkod" me 26 shifra)
    if (document.querySelector('.mbulese.hapur')) { $('barkodi').value = ''; return; }
    var b = $('barkodi').value.trim();
    $('barkodi').value = '';
    if (!b) return;
    if (duketSiDiçkaTjeterVeçBarkod(b)) {
      toast(T('qrDyshim'));
      return;
    }
    burimiIFundit = 'fushe';
    hapDialogun(b);
  }

  $('barkodi').addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      skanoBarkodin();
    }
  });

  // Modaliteti PDA: skaneri i brendshëm shpesh nuk dërgon Enter.
  // Pasi pushon së shkruari (pak nga skaneri), hapet vetë dritarja e produktit.
  $('barkodi').addEventListener('input', function () {
    clearTimeout(pdaKohez);
    if (!opsione.pda) return;
    if ($('barkodi').value.trim() === '') return;
    pdaKohez = setTimeout(skanoBarkodin, 200);
  });

  $('kerko').addEventListener('input', renderLista);

  // ---------- Tingulli (vetëm kur skanon me kamerë) ----------
  var audioCtx = null;
  function pergatitAudion() {
    try {
      // iPhone: pa këtë, çelësi anësor "Silent" e hesht krejt tingullin e faqes. Me "playback" bip-i
      // dëgjohet edhe kur telefoni është në silent/vibrim (si te videot).
      if (navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback';
    } catch (e) { /* shfletues pa Audio Session API */ }
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!audioCtx) audioCtx = new AC();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (e) { /* pa tingull */ }
  }
  function bip() {
    // Dridhja vjen gjithmonë (Android), që skanimi të ndihet edhe kur telefoni s'ka zë fare
    try { if (navigator.vibrate) navigator.vibrate(70); } catch (e) { /* ok */ }
    if (!opsione.tingull) return;
    try {
      pergatitAudion();
      if (!audioCtx) return;
      var luaj = function () {
        var o = audioCtx.createOscillator();
        var g = audioCtx.createGain();
        o.type = 'square';
        o.frequency.value = 1800;
        g.gain.value = 0.2;
        o.connect(g);
        g.connect(audioCtx.destination);
        o.start();
        o.stop(audioCtx.currentTime + 0.15);
      };
      // Pas fikjes së ekranit/kalimit në app tjetër, zëri "fle": zgjohet dhe pastaj bie bip-i (jo i humbur)
      if (audioCtx.state !== 'running') audioCtx.resume().then(luaj, function () { /* pa tingull */ });
      else luaj();
    } catch (e) { /* pa tingull */ }
  }

  // ---------- Kamera ----------
  // Përdoret gjithmonë kamera kryesore e pasme (jo përzgjedhje manuale), me rezolucion sa më të lartë
  // (deri në UHD/4K nëse telefoni e mbështet) dhe autofokus të vazhdueshëm — kjo e bën kapjen e
  // barkodit shumë më të qartë se rezolucioni i parazgjedhur i shfletuesit, sidomos në Safari/iPhone.
  var skaneri = null;
  var perpunuar = false;

  // API-ja native e shfletuesit (BarcodeDetector) — shumë më e shpejtë dhe më e saktë se motori i
  // vjetër i bazuar në JS të pastër (ZXing), sepse përdor vetë sistemin/harduerin e telefonit për
  // ta njohur barkodin. Provohet gjithmonë e para; nëse shfletuesi s'e mbështet (kryesisht Safari
  // në iPhone), kalohet automatikisht te motori rezervë (html5-qrcode), pa e ndjerë fare përdoruesi.
  var FORMATET_E_BARKODIT = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'code_93', 'itf', 'codabar', 'qr_code'];
  var detektoriNativ = null;
  try {
    if ('BarcodeDetector' in window) detektoriNativ = new BarcodeDetector({ formats: FORMATET_E_BARKODIT });
  } catch (e) { detektoriNativ = null; }
  var mbeshtetNativisht = !!detektoriNativ;
  var nativRrjedha = null;
  var nativDukeSkanuar = false;
  var detektoriAktiv = null; // detektoriNativ (Android/Chrome) ose detektoriWasm (iPhone/Safari)

  // ---------- iPhone / iPad (Safari): ZXing-C++ me WebAssembly ----------
  // Safari s'e ka BarcodeDetector-in e sistemit, prandaj më parë punonte vetëm motori rezervë
  // (html5-qrcode). Ai e zvogëlon figurën e kamerës në madhësinë e kutisë në ekran (~320×90 px!)
  // para se ta lexojë — edhe kur kamera jep 4K — kështu barkodi duhej afruar 2–3 cm që të kishte
  // mjaft piksela, e aty kamera e iPhone-it s'fokuson dot (sidomos modelet Pro). Tani në iPhone
  // lexohet me ZXing-C++ (paketa "barcode-detector", e njëjta API si në Android) mbi pjesën e
  // figurës nën kutinë, me REZOLUCION TË PLOTË — barkodi kapet edhe nga 20–40 cm.
  var WASM_ZXING = 'https://cdn.jsdelivr.net/npm/zxing-wasm@3.1.6/dist/reader/zxing_reader.wasm';
  var detektoriWasm = null;
  var detektoriWasmGati = null; // Promise<detektor|null>
  function pergatitDetektorinWasm() {
    if (detektoriNativ) return Promise.resolve(null);
    if (detektoriWasmGati) return detektoriWasmGati;
    var api = window.BarcodeDetectionAPI;
    if (!api || !api.BarcodeDetector || !api.prepareZXingModule) return Promise.resolve(null); // s'u ngarkua (pa internet herën e parë)
    detektoriWasmGati = Promise.resolve().then(function () {
      return api.prepareZXingModule({
        overrides: { locateFile: function (skedari, prefiksi) { return /\.wasm$/.test(skedari) ? WASM_ZXING : prefiksi + skedari; } },
        fireImmediately: true
      });
    }).then(function () {
      detektoriWasm = new api.BarcodeDetector({ formats: FORMATET_E_BARKODIT });
      return detektoriWasm;
    }).catch(function () {
      detektoriWasmGati = null; // provo sërish herën tjetër (p.sh. kur të ketë internet)
      return null;
    });
    return detektoriWasmGati;
  }
  // Ngarkohet paraprakisht (pak sekonda pas hapjes), që kamera të jetë gati menjëherë
  window.addEventListener('load', function () { setTimeout(pergatitDetektorinWasm, 1500); });

  // Pjesa e figurës së kamerës që shihet nën kutinë e skanimit (me pak hapësirë rreth saj), në
  // pikselat e vërtetë të kamerës. Video shfaqet me object-fit: cover, prandaj llogaritet shkalla.
  var kanavacaESkanimit = null;
  function figuraNenKuti(v) {
    var vw = v.videoWidth, vh = v.videoHeight;
    var rv = v.getBoundingClientRect();
    var k = document.querySelector('.skan-korniza');
    var rk = k ? k.getBoundingClientRect() : null;
    var x = 0, y = 0, w = vw, h = vh;
    if (rk && rv.width && rv.height && rk.width) {
      var s = Math.max(rv.width / vw, rv.height / vh);
      var ox = (rv.width - vw * s) / 2, oy = (rv.height - vh * s) / 2;
      var mx = rk.width * 0.1, my = rk.height * 0.35;
      x = Math.max(0, (rk.left - rv.left - ox - mx) / s);
      y = Math.max(0, (rk.top - rv.top - oy - my) / s);
      w = Math.min(vw - x, (rk.width + 2 * mx) / s);
      h = Math.min(vh - y, (rk.height + 2 * my) / s);
    }
    var shk = Math.min(1, 2400 / w); // mjaftueshëm për barkod të largët, pa e rënduar telefonin
    var c = kanavacaESkanimit || (kanavacaESkanimit = document.createElement('canvas'));
    c.width = Math.round(w * shk); c.height = Math.round(h * shk);
    var g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(v, x, y, w, h, 0, 0, c.width, c.height);
    return c;
  }

  // Shifra e kontrollit të EAN-13 / EAN-8 / UPC-A: nëse përputhet, leximi është i sigurt që në kuadrin e parë
  function shifraKontrollitOk(kodi) {
    if (!/^(\d{8}|\d{12}|\d{13})$/.test(kodi)) return false;
    var s = 0;
    for (var i = kodi.length - 2, peshe = 3; i >= 0; i--, peshe = 4 - peshe) s += (+kodi.charAt(i)) * peshe;
    return (10 - s % 10) % 10 === +kodi.charAt(kodi.length - 1);
  }
  // Kodet pa shifër kontrolli (Code 39, Codabar, ITF…) pranohen vetëm kur lexohen njësoj 2 herë
  // rresht brenda 0.8 s — kështu një lexim i gabuar nga një kuadër i turbullt s'kalon kurrë.
  var leximiParaprak = { v: '', t: 0 };
  function leximiIKonfirmuar(v, formati) {
    if (/^(EAN_13|EAN_8|UPC_A|QR_CODE)$/.test(formati) && (formati === 'QR_CODE' || shifraKontrollitOk(v))) return true;
    var tash = Date.now();
    var ok = leximiParaprak.v === v && tash - leximiParaprak.t < 800;
    leximiParaprak = { v: v, t: tash };
    return ok;
  }
  // Kur në kuti ka disa barkode, merret ai më afër qendrës
  function meIAferQendres(rezultatet, w, h) {
    var mi = rezultatet[0], dMin = Infinity;
    rezultatet.forEach(function (r) {
      var b = r.boundingBox;
      if (!b) return;
      var d = Math.pow(b.x + b.width / 2 - w / 2, 2) + Math.pow(b.y + b.height / 2 - h / 2, 2);
      if (d < dMin) { dMin = d; mi = r; }
    });
    return mi;
  }

  async function ciklikuIDetektimitNativ() {
    if (!nativDukeSkanuar) return;
    var v = $('kameraVideo');
    if (v && v.readyState >= 2 && v.videoWidth) {
      try {
        // Lexohet vetëm pjesa nën kuti, me rezolucion të plotë: më shpejt (më shumë prova në sekondë)
        // dhe pa kapur barkodin e produktit ngjitur jashtë kutisë.
        var figura = figuraNenKuti(v);
        var rezultatet = await detektoriAktiv.detect(figura);
        if (nativDukeSkanuar && rezultatet && rezultatet.length > 0) {
          var r = meIAferQendres(rezultatet, figura.width, figura.height);
          var formati = String(r.format || '').toUpperCase();
          if (leximiIKonfirmuar(r.rawValue, formati)) kuSuksesiSkanimi(r.rawValue, { format: formati });
        }
      } catch (e) { /* frame i dështuar, provo tjetrin */ }
    }
    if (!nativDukeSkanuar) return;
    // Një provë për çdo kuadër të ri të kamerës (jo dy herë i njëjti kuadër)
    if (v && v.requestVideoFrameCallback) v.requestVideoFrameCallback(function () { ciklikuIDetektimitNativ(); });
    else requestAnimationFrame(ciklikuIDetektimitNativ);
  }

  // Seanca e kamerës: rritet në çdo hapje dhe mbyllje. Nisja (leja, ngarkimi i detektorit në iPhone, ndërrimi i kamerës)
  // zgjat; nëse kamera mbyllet ndërkohë, rrjedha që vjen më vonë ndalet menjëherë (përndryshe kamera mbetej e ndezur
  // e padukshme dhe skanonte vetë: tinguj, dritare produkti, +1 te sasia).
  var seancaKamere = 0;
  function ndalRrjedhen(r) { try { r.getTracks().forEach(function (t) { t.stop(); }); } catch (e) { /* ok */ } }
  async function nisKamerenNativisht(kufizimet, detektori, seanca) {
    detektoriAktiv = detektori;
    var rrjedha = await navigator.mediaDevices.getUserMedia({ video: kufizimet });
    if (seanca !== seancaKamere) { ndalRrjedhen(rrjedha); throw new Error('kamera-u-mbyll'); }
    nativRrjedha = rrjedha;
    var v = $('kameraVideo');
    v.srcObject = rrjedha;
    await v.play();
    if (seanca !== seancaKamere) {
      if (nativRrjedha === rrjedha) await ndalSkanerinNativ(); else ndalRrjedhen(rrjedha);
      throw new Error('kamera-u-mbyll');
    }
    $('kameraVideo').style.display = '';
    $('reader').style.display = 'none';
    nativDukeSkanuar = true;
    ciklikuIDetektimitNativ();
  }

  async function ndalSkanerinNativ() {
    nativDukeSkanuar = false;
    if (nativRrjedha) {
      try { nativRrjedha.getTracks().forEach(function (t) { t.stop(); }); } catch (e) { /* ok */ }
      nativRrjedha = null;
    }
    var v = $('kameraVideo');
    if (v) v.srcObject = null;
  }

  function trackuIKameres() {
    var v = nativDukeSkanuar ? $('kameraVideo') : document.querySelector('#reader video');
    var rrjedha = v && v.srcObject;
    return (rrjedha && rrjedha.getVideoTracks && rrjedha.getVideoTracks()[0]) || null;
  }

  // Autofokus i vazhdueshëm (nëse kamera e mbështet); thirret pas nisjes si masë shtesë sigurie,
  // meqë disa shfletues (sidomos Android Chrome) e injorojnë focusMode kur jepet vetëm te getUserMedia.
  async function aplikoAutofokusin() {
    try {
      var t = trackuIKameres();
      if (!t || !t.getCapabilities) return;
      var cap = t.getCapabilities();
      if (cap && cap.focusMode && cap.focusMode.indexOf('continuous') !== -1) {
        await t.applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
      }
    } catch (e) { /* mbetet fokusi i parazgjedhur i telefonit */ }
  }

  async function pasNisjes() {
    try { await aplikoAutofokusin(); } catch (e) { /* nuk e pengon skenimin */ }
    try { pergatitKontrolletEKameres(); } catch (e) { /* butonat mbeten të fshehur */ }
  }

  // Zmadhimi (1× / 2× / 3×), drita dhe fokusi me prekje — vetëm kur telefoni i mbështet (kryesisht Android).
  var kontrolletKam = { nivelet: [1], zoomI: 0, drita: false };
  function pergatitKontrolletEKameres() {
    var t = nativDukeSkanuar ? trackuIKameres() : null;
    var cap = (t && t.getCapabilities) ? t.getCapabilities() : {};
    kontrolletKam = { nivelet: [1], zoomI: 0, drita: false };
    var z = cap.zoom;
    if (z && z.max >= 1.5) {
      var min = z.min || 1;
      kontrolletKam.nivelet = [min].concat([2, 3].filter(function (n) { return n > min && n <= z.max; }));
      if (kontrolletKam.nivelet.length === 1) kontrolletKam.nivelet.push(z.max);
    }
    $('kameraZoom').textContent = '1×';
    $('kameraZoom').classList.remove('aktiv');
    $('kameraZoom').style.display = kontrolletKam.nivelet.length > 1 ? '' : 'none';
    $('kameraDrita').classList.remove('aktiv');
    $('kameraDrita').style.display = cap.torch ? '' : 'none';
  }
  function fshihKontrolletEKameres() {
    $('kameraZoom').style.display = 'none';
    $('kameraDrita').style.display = 'none';
  }
  $('kameraZoom').addEventListener('click', async function () {
    var t = trackuIKameres();
    if (!t) return;
    var i = (kontrolletKam.zoomI + 1) % kontrolletKam.nivelet.length;
    var niv = kontrolletKam.nivelet[i];
    try {
      await t.applyConstraints({ advanced: [{ zoom: niv }] });
      kontrolletKam.zoomI = i;
      this.textContent = (Math.round(niv * 10) / 10) + '×';
      this.classList.toggle('aktiv', i > 0);
    } catch (e) { /* ky telefon s'e lejon */ }
  });
  $('kameraDrita').addEventListener('click', async function () {
    var t = trackuIKameres();
    if (!t) return;
    try {
      await t.applyConstraints({ advanced: [{ torch: !kontrolletKam.drita }] });
      kontrolletKam.drita = !kontrolletKam.drita;
      this.classList.toggle('aktiv', kontrolletKam.drita);
    } catch (e) { /* ky telefon s'e lejon */ }
  });
  // Prek figurën → fokusohet aty (pastaj kthehet te autofokusi i vazhdueshëm)
  $('kameraVideo').addEventListener('click', async function (ev) {
    var t = trackuIKameres();
    if (!t || !t.getCapabilities) return;
    var cap = t.getCapabilities();
    if (!cap.focusMode || cap.focusMode.indexOf('single-shot') === -1) return;
    var r = this.getBoundingClientRect();
    var pika = { x: Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (ev.clientY - r.top) / r.height)) };
    try {
      await t.applyConstraints({ advanced: [{ pointsOfInterest: [pika], focusMode: 'single-shot' }] });
    } catch (e) {
      try { await t.applyConstraints({ advanced: [{ focusMode: 'single-shot' }] }); } catch (e2) { return; }
    }
    setTimeout(aplikoAutofokusin, 1500);
  });

  function krijoSkanerin() {
    var F = Html5QrcodeSupportedFormats;
    return new Html5Qrcode('reader', {
      formatsToSupport: [F.EAN_13, F.EAN_8, F.UPC_A, F.UPC_E, F.CODE_128, F.CODE_39, F.CODE_93, F.ITF, F.CODABAR, F.QR_CODE],
      experimentalFeatures: { useBarCodeDetectorIfSupported: true }, // API-ja native e shfletuesit kur ekziston — më e shpejtë dhe më e saktë
      verbose: false
    });
  }

  // Nxjerr emrin e formatit të lexuar (p.sh. 'QR_CODE', 'EAN_13'), nëse librari e jep
  function formatiIRezultatit(decodedResult) {
    try {
      if (!decodedResult) return '';
      var f = decodedResult.result && decodedResult.result.format;
      if (f && f.formatName) return f.formatName;
      if (decodedResult.format && decodedResult.format.formatName) return decodedResult.format.formatName;
      if (typeof decodedResult.format === 'string') return decodedResult.format;
    } catch (e) { /* ok */ }
    return '';
  }

  // Kutia e skenimit është ngushtë (formë "shirit"), e menduar posaçërisht për të kapur VETËM NJË
  // barkod të vetëm, edhe kur ka shumë barkode të printuara afër njëra-tjetrës (p.sh. në një fletë A4).
  var QRBOX_FN = function (w, h) {
    return {
      // html5-qrcode s'pranon më pak se 50 px (p.sh. video horizontale në ekran të ngushtë) → skanimi ndalej fare
      width: Math.max(50, Math.floor(Math.min(w * 0.82, 320))),
      height: Math.max(50, Math.floor(Math.min(h * 0.22, 90)))
    };
  };

  // ---------- Numërim i vazhdueshëm (vetëm për një përdorues specifik) ----------
  // Kur mbahet kamera e drejtuar te i njëjti barkod (që tashmë ekziston si produkt), sasia rritet
  // vetë me +1 çdo 1.5 sekonda, pa u dashur me e ndalë kamerën apo me hapë dialogun çdo herë.
  // Çdo +1 vjen vetëm kur barkodi SHIHET (jo nga një kohëmatës i verbër), dhe asnjëherë më shpesh se
  // 1 herë në 1.5 s — edhe kur kamera e humb barkodin për një çast (dridhje, fokus, iPhone) dhe e
  // gjen sërish. Mbyllet kur barkodi s'shihet 3 s ose kur skanohet një barkod tjetër.
  var NUMRIM_INTERVALI_MS = 1500;
  var NUMRIM_PUSHIMI_MS = 3000;
  var numrimIVazhdueshemBarkodi = null;
  var numrimIVazhdueshemTimer = null;  // mbyll numërimin pasi barkodi s'shihet më
  var numrimIVazhdueshemFundit = 0;    // koha e +1 të fundit
  var numrimIVazhdueshemSasi = 0; // sa copë janë shtuar në këtë sesion (që nga çasti i parë)

  function ndaloNumrimVazhdues() {
    if (numrimIVazhdueshemTimer) { clearTimeout(numrimIVazhdueshemTimer); numrimIVazhdueshemTimer = null; }
    numrimIVazhdueshemBarkodi = null;
    numrimIVazhdueshemFundit = 0;
    numrimIVazhdueshemSasi = 0;
    var e = $('skanNumrimi');
    if (e) e.style.display = 'none';
  }

  function shtoNjeCopeNumrimVazhdues(barkodi) {
    var celesi = celesiProduktit(folderiAktual, barkodi);
    var prod = produktet[celesi];
    if (!prod) { ndaloNumrimVazhdues(); return; }
    prod.sasia += 1;
    prod.prekurSe = Date.now();
    ruajBaze();
    renderLista();
    renderFolderat();
    bip();
    numrimIVazhdueshemSasi += 1;
    var e = $('skanNumrimi');
    if (e) {
      e.textContent = '+' + numrimIVazhdueshemSasi;
      e.style.display = '';
    }
  }

  // Thirret sa herë që kamera e sheh barkodin (shumë herë në sekondë)
  function fillojOseVazhdoNumrimin(barkodi) {
    var tash = Date.now();
    if (numrimIVazhdueshemBarkodi !== barkodi) { ndaloNumrimVazhdues(); numrimIVazhdueshemBarkodi = barkodi; }
    if (tash - numrimIVazhdueshemFundit >= NUMRIM_INTERVALI_MS) {
      numrimIVazhdueshemFundit = tash;
      shtoNjeCopeNumrimVazhdues(barkodi);
      if (numrimIVazhdueshemBarkodi !== barkodi) return; // produkti s'u gjet → numërimi u ndal
    }
    if (numrimIVazhdueshemTimer) clearTimeout(numrimIVazhdueshemTimer);
    numrimIVazhdueshemTimer = setTimeout(ndaloNumrimVazhdues, NUMRIM_PUSHIMI_MS);
  }

  var qrToastFundit = 0;
  function kuSuksesiSkanimi(tekstiILexuar, decodedResult) {
    var barkodi = String(tekstiILexuar).trim();
    var formati = formatiIRezultatit(decodedResult);
    if (formati === 'QR_CODE') {
      // Nuk e trajtojmë si barkod produkti: njoftojmë (jo më shpesh se çdo 2s, sepse motori nativ
      // e njeh të njëjtin kod shumë herë në sekondë sa kohë mbahet në kamerë) dhe vazhdojmë skenimin
      // pa e ndalur kamerën.
      var tash = Date.now();
      if (tash - qrToastFundit > 2000) {
        qrToastFundit = tash;
        toast(T('qrRefuzuar'));
      }
      return;
    }

    // Numërimi i vazhdueshëm (+1) vetëm kur skanohet për stokun; kamera e hapur nga "Afat i ri" e dërgon barkodin te afati
    if (!kameraPerAfat && eLejuarSasiaShpejte()) {
      var ekzistuesi = produktet[celesiProduktit(folderiAktual, barkodi)];
      if (ekzistuesi) {
        fillojOseVazhdoNumrimin(barkodi);
        return; // s'e ndalim kamerën, s'hapim dialog — vazhdon numërimi vetë
      }
      ndaloNumrimVazhdues(); // barkod tjetër/i ri: ndal çdo numërim të mëparshëm, vazhdo normalisht
    }

    if (perpunuar) return;
    perpunuar = true;
    bip();
    var perAfat = kameraPerAfat;
    kameraPerAfat = null;
    ndalKamere().then(function () {
      if (perAfat) { perAfat(barkodi); return; } // skanuar nga "Afat i ri" → barkodi shkon atje
      burimiIFundit = 'kamera';
      hapDialogun(barkodi);
    });
  }
  function kuGabimiSkanimi() { /* gabimet e vazhdueshme të leximit shpërfillen */ }

  // Kamera kryesore e pasme, me rezolucion sa më afër UHD (3840×2160). "ideal" (jo "exact") që
  // shfletuesi të mos dështojë nëse kamera s'e mbështet saktë atë rezolucion — thjesht i afrohet.
  function kufizimetVideoUHD() {
    return {
      facingMode: { ideal: 'environment' },
      width: { ideal: 3840 },
      height: { ideal: 2160 },
      frameRate: { ideal: 30 },
      advanced: [{ focusMode: 'continuous' }]
    };
  }
  function kufizimetMePajisje(baza, deviceId) {
    return { width: baza.width, height: baza.height, frameRate: baza.frameRate, advanced: baza.advanced, deviceId: { exact: deviceId } };
  }

  // Disa telefona (sidomos ca modele Samsung) e zgjedhin vetë kamerën ULTRA-WIDE si "kamerën e
  // pasme" kur kërkohet thjesht facingMode:environment — për skanim barkodesh na duhet gjithmonë
  // kamera KRYESORE (wide, jo ultra-wide/makro/telefoto). Meqë s'ka asnjë kufizim standard që e
  // dallon këtë mes shfletuesve, e njohim nga etiketa (iPhone: "Back Camera" vs "Back Ultra Wide
  // Camera") ose, kur s'ka etiketë të qartë (shpesh në Android), marrim kamerën e parë të pasme të
  // kthyer nga sistemi — që zakonisht korrespondon me sensorin kryesor (ID 0) edhe në Android.
  var ULTRAWIDE_RX = /ultra.?wide|macro|tele(foto|photo)|0[.,]5\s*x/i;
  var FRONT_RX = /front|user|selfie|përpara|frontal/i;
  var KEY_KAMERA_KRYESORE = 'stoku:kamera-kryesore-id';

  function idIRuajturIKameres() {
    try { return localStorage.getItem(KEY_KAMERA_KRYESORE) || null; } catch (e) { return null; }
  }
  function ruajIdINeKameres(id) {
    try { if (id) localStorage.setItem(KEY_KAMERA_KRYESORE, id); } catch (e) { /* ok */ }
  }

  async function kamerateEPasme() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return [];
    try {
      var pajisjet = await navigator.mediaDevices.enumerateDevices();
      return pajisjet.filter(function (d) { return d.kind === 'videoinput' && !FRONT_RX.test(d.label || ''); });
    } catch (e) { return []; }
  }
  function idIKameresKryesore(kamerat) {
    var meEtiketa = kamerat.filter(function (k) { return !!k.label; });
    if (meEtiketa.length === 0) return null; // s'ka ende leje/etiketa, s'dallohet dot asgjë
    var joUltraWide = meEtiketa.filter(function (k) { return !ULTRAWIDE_RX.test(k.label); });
    var lista = joUltraWide.length > 0 ? joUltraWide : meEtiketa;
    return lista[0].deviceId || null;
  }

  async function provoNisjenSkanerit(kufizimet) {
    var seanca = seancaKamere;
    var detektori = detektoriNativ || await pergatitDetektorinWasm();
    if (seanca !== seancaKamere) return false; // kamera u mbyll ndërkohë
    if (detektori) {
      try {
        await nisKamerenNativisht(kufizimet, detektori, seanca);
        return true;
      } catch (e) {
        if (seanca !== seancaKamere) return false; // (s'preket rrjedha e një hapjeje më të re)
        await ndalSkanerinNativ(); // s'punoi nativisht (p.sh. leje/pajisje), provo motorin rezervë
      }
    }
    if (typeof Html5Qrcode === 'undefined') return false;
    $('kameraVideo').style.display = 'none';
    $('reader').style.display = '';
    var i = krijoSkanerin();
    try {
      await i.start(kufizimet, { fps: 10, qrbox: QRBOX_FN, videoConstraints: kufizimet }, kuSuksesiSkanimi, kuGabimiSkanimi);
      if (seanca !== seancaKamere) {
        try { await i.stop(); } catch (e3) { /* ok */ }
        try { i.clear(); } catch (e3) { /* ok */ }
        return false;
      }
      skaneri = i;
      return true;
    } catch (e) {
      try { i.clear(); } catch (e2) { /* ok */ }
      return false;
    }
  }

  // Pas nisjes fillestare (kur ende s'e dinim kamerën kryesore): rikontrollo etiketat, tani që kemi
  // leje, dhe nëse ekziston një kamerë jo-ultra-wide e ndryshme nga ajo aktuale, kalo tek ajo.
  async function kaloTekKameraKryesoreNese() {
    var seanca = seancaKamere;
    var kamerat = await kamerateEPasme();
    if (seanca !== seancaKamere) return;
    var idIri = idIKameresKryesore(kamerat);
    if (!idIri) return;
    var t = trackuIKameres();
    var aktualId = (t && t.getSettings) ? t.getSettings().deviceId : '';
    if (idIri === aktualId) { ruajIdINeKameres(idIri); return; }
    await ndalSkanerin();
    var uHap = await provoNisjenSkanerit(kufizimetMePajisje(kufizimetVideoUHD(), idIri));
    if (uHap) ruajIdINeKameres(idIri);
    else await provoNisjenSkanerit(kufizimetVideoUHD()); // s'punoi, kthehu te ajo që punonte
  }

  async function nisKamere() {
    var seanca = seancaKamere;
    var kufizimetAutomatike = kufizimetVideoUHD();
    var idRuajtur = idIRuajturIKameres();
    var uHap = false;

    if (idRuajtur) {
      uHap = await provoNisjenSkanerit(kufizimetMePajisje(kufizimetAutomatike, idRuajtur));
    }
    if (seanca !== seancaKamere) return;
    if (!uHap) {
      var idGjetur = idIKameresKryesore(await kamerateEPasme());
      if (seanca !== seancaKamere) return;
      if (idGjetur) {
        uHap = await provoNisjenSkanerit(kufizimetMePajisje(kufizimetAutomatike, idGjetur));
        if (uHap) ruajIdINeKameres(idGjetur);
      }
    }
    if (!uHap && seanca === seancaKamere) uHap = await provoNisjenSkanerit(kufizimetAutomatike);
    if (!uHap && seanca === seancaKamere) uHap = await provoNisjenSkanerit({ facingMode: { ideal: 'environment' } });
    if (seanca !== seancaKamere) return;
    if (!uHap) throw new Error('kamera-nuk-u-hap');

    if (!idRuajtur) {
      try { await kaloTekKameraKryesoreNese(); } catch (e) { /* mbetet te ajo çka tashmë punon */ }
    }
    if (seanca !== seancaKamere) return;
    await pasNisjes();
  }

  async function hapKamere() {
    if (!leja('kamera')) return;
    pergatitAudion(); // duhet thirrur nga prekja e përdoruesit që tingulli të lejohet në iPhone
    if (!mbeshtetNativisht && typeof Html5Qrcode === 'undefined' && !window.BarcodeDetectionAPI) {
      toast(T('kameraNukEshteGati'));
      return;
    }
    perpunuar = false;
    ndaloNumrimVazhdues();
    var seanca = ++seancaKamere;
    $('kamera').classList.add('hapur');
    try {
      await nisKamere();
    } catch (err) {
      if (seanca !== seancaKamere) return; // u mbyll ose u rihap ndërkohë: s'është gabim
      await ndalKamere();
      toast(T('kameraNukUHapLeje'));
    }
  }

  // Ndalon vetëm skanerin (dritarja e kamerës mbetet e hapur)
  async function ndalSkanerin() {
    await ndalSkanerinNativ();
    var s = skaneri;
    skaneri = null;
    if (s) {
      try { await s.stop(); } catch (e) { /* ok */ }
      try { s.clear(); } catch (e) { /* ok */ }
    }
  }

  var kameraPerAfat = null; // kur kamera hapet nga dialogu "Afat i ri": ku dërgohet barkodi i skanuar
  async function ndalKamere() {
    seancaKamere++; // nisja që ende s'ka mbaruar e ndal vetë rrjedhën kur të vijë
    kameraPerAfat = null;
    fshihKontrolletEKameres();
    ndaloNumrimVazhdues();
    await ndalSkanerin();
    $('kamera').classList.remove('hapur');
  }

  $('btnKamera').addEventListener('click', hapKamere);
  $('mbyllKamere').addEventListener('click', ndalKamere);

  // ---------- Shiriti me tabe poshtë: Stoku · Afatet · Cilësimet ----------
  // Afatet dhe Cilësimet mbeten "dritare" të plota (dlgAfatet, dlgOpsione) — kështu butoni "mbrapa" i Android-it
  // dhe historia punojnë si më parë — por hapen/mbyllen nga tabet, pa rrëshqitje, dhe shiriti tregon ku je.
  var tastieraHapur = false, __tastieraKohez = null;
  function rifreskoTabet() {
    var afatetHapur = $('dlgAfatet').classList.contains('hapur');
    var cilesimetHapur = $('dlgOpsione').classList.contains('hapur');
    var ekipiHapur = $('dlgEkipi').classList.contains('hapur');
    var dukshem = (folderiAktual === null || afatetHapur || cilesimetHapur || ekipiHapur) &&
      !$('kamera').classList.contains('hapur') && !$('dlgAfatLexim').classList.contains('hapur') &&
      !$('dlgImportStok').classList.contains('hapur') && !tastieraHapur;
    document.body.classList.toggle('me-tabe', dukshem);
    var aktiv = cilesimetHapur ? 'btnOpsione' : ekipiHapur ? 'btnEkipi' : afatetHapur ? 'btnAfatet' : 'tabStoku';
    ['tabStoku', 'btnAfatet', 'btnEkipi', 'btnOpsione'].forEach(function (id) {
      var po = id === aktiv;
      $(id).classList.toggle('aktiv', po);
      if (po) $(id).setAttribute('aria-current', 'page'); else $(id).removeAttribute('aria-current');
    });
  }
  function kaloTab(fn) {
    document.body.classList.add('pa-animim');
    fn();
    rifreskoTabet();
    setTimeout(function () { document.body.classList.remove('pa-animim'); }, 80);
  }
  $('tabStoku').addEventListener('click', function () {
    kaloTab(function () {
      if ($('dlgOpsione').classList.contains('hapur')) mbyllOpsionet();
      if ($('dlgAfatet').classList.contains('hapur')) mbyllAfatetFaqe();
      if ($('dlgEkipi').classList.contains('hapur')) mbyllEkipiFaqe();
      if (folderiAktual === null) { $('folderaLista').scrollTop = 0; $('kerkoGlobalLista').scrollTop = 0; }
    });
  });
  $('btnAfatet').addEventListener('click', function () {
    kaloTab(function () {
      if ($('dlgOpsione').classList.contains('hapur')) mbyllOpsionet();
      if ($('dlgEkipi').classList.contains('hapur')) mbyllEkipiFaqe();
      if ($('dlgAfatet').classList.contains('hapur')) { $('afTrup').scrollTop = 0; return; }
      hapAfatetFaqe();
    });
  });
  $('btnEkipi').addEventListener('click', function () {
    kaloTab(function () {
      if ($('dlgOpsione').classList.contains('hapur')) mbyllOpsionet();
      if ($('dlgAfatet').classList.contains('hapur')) mbyllAfatetFaqe();
      if ($('dlgEkipi').classList.contains('hapur')) { ekipiKthehuTeKartat(); $('ekipiTrup').scrollTop = 0; return; }
      hapEkipiFaqe();
    });
  });
  $('btnOpsione').addEventListener('click', function () {
    kaloTab(function () {
      if ($('dlgAfatet').classList.contains('hapur')) mbyllAfatetFaqe();
      if ($('dlgEkipi').classList.contains('hapur')) mbyllEkipiFaqe();
      if ($('dlgOpsione').classList.contains('hapur')) { aktivizoTabin(null); return; }
      hapOpsionet();
    });
  });
  $('ekipiPrapa').addEventListener('click', function () { if (!ekEshteShtepi()) ekipiKthehuTeKartat(); else mbyllEkipiFaqe(); });
  // Tastiera e hapur (një fushë ka fokusin): shiriti fshihet, që të mos ngjitet mbi tastierë dhe të mos mbulojë fushat
  function eshteFushe(el) { return !!(el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')); }
  document.addEventListener('focusin', function (ev) {
    if (!eshteFushe(ev.target)) return;
    clearTimeout(__tastieraKohez);
    if (!tastieraHapur) { tastieraHapur = true; rifreskoTabet(); }
  });
  document.addEventListener('focusout', function () {
    clearTimeout(__tastieraKohez);
    __tastieraKohez = setTimeout(function () {
      if (eshteFushe(document.activeElement)) return; // kaloi te një fushë tjetër
      if (tastieraHapur) { tastieraHapur = false; rifreskoTabet(); }
    }, 120);
  });

  // ---------- Butoni "Mbrapa" i Android-it (histori shfletuesi) ----------
  // Pa këtë, shtypja e butonit fizik/gjestit "mbrapa" të Android-it, kur je diku (brenda një
  // folderi, te Opsionet, te kamera, te çdo dialog), do të mbyllte KREJT faqen web (do të dilte nga
  // app-i), sepse s'ka "faqe" tjetër historie ku me u kthy. Këtu, sapo hapet çfarëdo "shtrese" (folder,
  // dialog, kamerë), i shtojmë historisë së shfletuesit një shënues të padukshëm; nëse shtypet
  // "mbrapa" ndërkohë, e kapim vetë ngjarjen (popstate) dhe mbyllim vetëm shtresën e fundit —
  // pa e prekur asnjëherë faqen kryesore. Numërohet edhe thellësia (p.sh. brenda një folderi + një
  // dialog i hapur = 2 nivele), që "mbrapa" t'i mbyllë njërin pas tjetrit, në rendin e saktë.
  var __historiaThellesia = 0;

  function niveletEHapura() {
    var n = 0;
    if (folderiAktual !== null) n++;
    if ($('kamera').classList.contains('hapur')) n++;
    if ($('dlgAfatet').classList.contains('hapur')) n++;
    if ($('dlgAfatet').classList.contains('zgjedhje')) n++; // "mbrapa" së pari e mbyll zgjedhjen
    if ($('dlgEkipi').classList.contains('hapur')) n++;
    if ($('dlgEkipi').classList.contains('ne-anetar')) n++; // "mbrapa" së pari kthehet te kartat e ekipit
    var opsioneHapur = $('dlgOpsione').classList.contains('hapur');
    if (opsioneHapur) {
      n++;
      if ($('kategoriMenu').style.display === 'none') n++; // brenda një kategorie = 1 nivel shtesë mbi vetë Opsionet
      if (PRINDI_I_FAQES[faqjaEOpsioneve]) n++; // nënfaqe (p.sh. Stoku → Produktet) = edhe 1 nivel
    }
    // Çdo dialog i hapur (p.sh. "Zhvendos" mbi produktin) është një nivel: "mbrapa" i mbyll një nga një
    n += document.querySelectorAll('.mbulese.hapur:not(#dlgOpsione):not(#dlgAfatet):not(#dlgEkipi)').length;
    // v231: faqja bazë (pa lejen "Stoku") është kryefaqja, jo nivel
    var baza = faqjaBaze();
    if (baza && $(baza).classList.contains('hapur')) n--;
    return n;
  }
  // Radha e hapjes së dialogëve (i fundit = ai sipër). Me renditjen e faqes, "mbrapa" mbyllte dialogun poshtë
  // (p.sh. produktin nën "Zhvendos") dhe linte sipër një dialog që s'punonte më.
  var __rendiDialogeve = [];
  function rifreskoRendinEDialogeve() {
    Array.prototype.forEach.call(document.querySelectorAll('.mbulese'), function (el) {
      if (!el.id) return;
      var i = __rendiDialogeve.indexOf(el.id), hapur = el.classList.contains('hapur');
      if (hapur && i === -1) __rendiDialogeve.push(el.id);
      else if (!hapur && i !== -1) __rendiDialogeve.splice(i, 1);
    });
  }
  function dialogiISiperm() {
    rifreskoRendinEDialogeve();
    for (var i = __rendiDialogeve.length - 1; i >= 0; i--) {
      var id = __rendiDialogeve[i];
      if (id !== 'dlgOpsione' && id !== 'dlgAfatet' && id !== 'dlgEkipi' && $(id) && $(id).classList.contains('hapur')) return $(id);
    }
    return document.querySelector('.mbulese.hapur:not(#dlgOpsione):not(#dlgAfatet):not(#dlgEkipi)');
  }

  // Mbyll vetëm shtresën e sipërme. Dialogët mbyllen përmes butonit të tyre "Anulo" (jo duke hequr
  // thjesht klasën), që logjika e tyre (p.sh. konfirmo() që pret përgjigje) të përfundojë saktë.
  var ANULO_SIPAS_DIALOGUT = {
    dlgProdukt: 'dlgAnulo', dlgZhvendos: 'zhvendosAnulo', dlgFshirje: 'fshiAnulo',
    dlgFolder: 'dlgFolderAnulo', dlgKonfirmo: 'konfJo', dlgMarketi: 'mkdAnulo', dlgMarketiRi: 'mkrAnulo', dlgAfat: 'afatAnulo', dlgAfatLexim: 'leximAnulo', dlgKuFleta: 'kfhAnulo', dlgKuSkedari: 'ksAnulo', dlgNjoftimet: 'njJoTani', dlgAfExcel: 'axAnulo', dlgTeRejat: 'trMbyll', dlgImportStok: 'impAnulo', dlgEkNjoftimet: 'ekNjMbyll', dlgAfImport: 'aiAnulo', dlgKerkese: 'krkAnulo'
  };
  function mbyllShtresenMeTeFundit() {
    // Kamera del mbi çdo dialog (p.sh. skanimi te "Afat i ri"), prandaj mbyllet e para
    if ($('kamera').classList.contains('hapur')) { ndalKamere(); return; }
    var dlgTjeter = dialogiISiperm();
    if (dlgTjeter) {
      var idAnulo = ANULO_SIPAS_DIALOGUT[dlgTjeter.id];
      if (idAnulo && $(idAnulo)) $(idAnulo).click(); else dlgTjeter.classList.remove('hapur');
      return;
    }
    if ($('dlgAfatet').classList.contains('zgjedhje')) { dilNgaZgjedhja(); return; }
    if ($('dlgAfatet').classList.contains('hapur')) { mbyllAfatetFaqe(); return; }
    if ($('dlgEkipi').classList.contains('ne-anetar')) { ekipiKthehuTeKartat(); return; }
    if ($('dlgEkipi').classList.contains('hapur')) { mbyllEkipiFaqe(); return; }
    if ($('dlgOpsione').classList.contains('hapur')) {
      if (PRINDI_I_FAQES[faqjaEOpsioneve]) { aktivizoTabin(PRINDI_I_FAQES[faqjaEOpsioneve]); return; }
      if ($('kategoriMenu').style.display === 'none') { aktivizoTabin(null); return; }
      mbyllOpsionet();
      return;
    }
    if (folderiAktual !== null) { mbrapaNeFoldera(); return; }
  }

  // Historia sinkronizohet me vonesë të shkurtër, që kalimet e shpejta (p.sh. kamera mbyllet dhe
  // menjëherë hapet dialogu i produktit) të mos krijojnë hyrje të tepërta apo të humbura.
  var __injoroPopstate = 0; // sa "mbrapa" i ka shkaktuar vetë kodi (jo përdoruesi) — këto injorohen
  var __sinkKohez = null;
  function sinkronizoHistorineEDritareve() {
    clearTimeout(__sinkKohez);
    __sinkKohez = setTimeout(sinkronizoTani, 30);
  }
  function sinkronizoTani() {
    var thellesiaTani = niveletEHapura();
    if (thellesiaTani > __historiaThellesia) {
      while (__historiaThellesia < thellesiaTani) {
        __historiaThellesia++;
        try { history.pushState({ stokuNiveli: __historiaThellesia }, ''); } catch (e) { /* ok */ }
      }
    } else if (thellesiaTani < __historiaThellesia) {
      // U mbyll diçka nga UI (butoni "←", "Anulo", etj.) — hiqi hyrjet e historisë që s'duhen më,
      // por shëno që ky "mbrapa" vjen nga kodi, që të mos mbyllë edhe një shtresë tjetër.
      var diferenca = __historiaThellesia - thellesiaTani;
      __historiaThellesia = thellesiaTani;
      __injoroPopstate++;
      try { history.go(-diferenca); } catch (e) { __injoroPopstate--; }
    }
  }

  window.addEventListener('popstate', function () {
    if (__injoroPopstate > 0) { __injoroPopstate--; return; }
    // Përdoruesi shtypi "mbrapa": një hyrje historie tashmë u hoq — mbyll saktësisht një shtresë.
    __historiaThellesia = Math.max(0, __historiaThellesia - 1);
    if (niveletEHapura() > 0) mbyllShtresenMeTeFundit();
  });

  if (window.MutationObserver) {
    var __vezhguesiIDritareve = new MutationObserver(function () { rifreskoRendinEDialogeve(); rifreskoTabet(); sinkronizoHistorineEDritareve(); });
    Array.prototype.forEach.call(document.querySelectorAll('.mbulese, #kamera'), function (el) {
      __vezhguesiIDritareve.observe(el, { attributes: true, attributeFilter: ['class'] });
    });
  }

  // ---------- Eksporti në Excel (.xlsx) ----------
  function dyShifra(n) { return (n < 10 ? '0' : '') + n; }

  function kaShare(skedari) {
    return !!(navigator.canShare && navigator.share && navigator.canShare({ files: [skedari] }));
  }

  function sluguFolderit(emri) {
    var s = String(emri).toLowerCase()
      .replace(/ë/g, 'e').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return s || 'folder';
  }

  // Ndërton skedarin .xlsx vetëm me produktet e folderit aktual
  function krijoSkedarin() {
    if (folderiAktual === null) return null;
    var te = produktetENjeFolderi(folderiAktual);
    if (te.length === 0) { toast(T('nukKaProdukteEksport')); return null; }
    te.sort(emriKrahaso);

    var d = new Date();
    var emri = 'malli_' + sluguFolderit(emriFolderit(folderiAktual)) + '_' +
      d.getFullYear() + '-' + dyShifra(d.getMonth() + 1) + '-' + dyShifra(d.getDate()) +
      '_' + dyShifra(d.getHours()) + dyShifra(d.getMinutes()) + '.xlsx';

    var bajtet = StokuXlsx.build(te);
    return {
      skedari: new File([bajtet], emri, { type: MIME_XLSX }),
      emri: emri,
      n: te.length
    };
  }

  // Shkarkim i zakonshëm (Android, kompjuter)
  function shkarkoDirekt(f) {
    var url = URL.createObjectURL(f.skedari);
    var a = document.createElement('a');
    a.href = url;
    a.download = f.emri;
    a.style.display = 'none'; // vetëm për shkarkim: s'duhet të shihet as të fokusohet
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 4000);
  }

  // ---------- Excel/PDF: "Dërgo në PC" ose "Shkarko këtu" (v229) ----------
  // Çdo eksport (Excel i folderit, PDF me etiketa, Excel i afateve, Excel i stokut të kolegut) pyet ku shkon skedari:
  // "Dërgo në PC" e dërgon te PC-ja e së njëjtës llogari (skedaret.js: dyqane/{uid}/skedaret), ku del te Përmbledhja me
  // "Shkarko"; "Shkarko këtu" e ndan ose e shkarkon këtu si më parë. Premtimi mbaron kur mbyllet dritarja.
  var ks = { f: null, titulli: '', zgjidh: null, kohez: null };
  // v231: pa lejen "Stoku në kompjuter" s'ka as "Dërgo në PC" (s'do të kishte ku t'i shkarkojë)
  function lejaDergoNePc() { return leja('dergoNePc') && leja('pc'); }
  function ndajOseShkarko(f, titulliShpernd) {
    if (!lejaDergoNePc()) return ndajOseShkarkoKetu(f, titulliShpernd);
    return new Promise(function (zgjidh) {
      mbaroKs();
      ks = { f: f, titulli: titulliShpernd || '', zgjidh: zgjidh, kohez: null };
      gjendjaKs('zgjedhje');
      $('dlgKuSkedari').classList.add('hapur');
    });
  }
  function kaLlogariPerPc() {
    var c = window.__stokuCloud;
    return !ngaVizitori() && !!(c && c.skedaret && c.perdoruesiAktual && c.perdoruesiAktual());
  }
  function gjendjaKs(g, tekst) {
    var f = ks.f || {}, S = window.StokuSkedaret;
    var lloji = S ? S.llojiISkedarit(f.emri) : '';
    var emriLlojit = lloji === 'pdf' ? 'PDF-ja' : lloji === 'xlsx' ? 'Excel-i' : 'Skedari';
    $('ksTitulli').textContent = g === 'gati' ? 'U dërgua në PC' : g === 'pune' ? 'Duke e dërguar në PC…' : emriLlojit + ' është gati';
    var s = $('ksStatusi');
    s.className = 'kfh-statusi' + (g === 'gati' || g === 'gabim' ? ' ' + g : '');
    s.textContent = '';
    if (g === 'pune') s.appendChild(Object.assign(document.createElement('span'), { className: 'lx-spinner' }));
    var madh = f.skedari && S ? ' (' + S.madhesiaTekst(f.skedari.size) + ')' : '';
    s.appendChild(document.createTextNode(tekst || (f.emri || '') + madh));
    var pc = kaLlogariPerPc();
    $('ksPc').style.display = g === 'zgjedhje' || g === 'gabim' ? '' : 'none';
    $('ksPc').disabled = !pc;
    $('ksPc').lastChild.textContent = g === 'gabim' ? 'Provo sërish në PC' : 'Dërgo në PC';
    $('ksKetu').style.display = g === 'zgjedhje' || g === 'gabim' ? '' : 'none';
    $('ksHint').textContent = g !== 'zgjedhje' ? '' : pc ? 'Në PC del te Përmbledhja, me butonin "Shkarko". Duhet e njëjta llogari në kompjuter.'
      : 'Për ta dërguar në PC duhet llogari (e njëjta edhe në kompjuter).';
    $('ksHint').hidden = !$('ksHint').textContent;
    $('ksAnulo').textContent = g === 'gati' || g === 'pune' ? 'Mbyll' : 'Anulo';
  }
  function mbaroKs() {
    clearTimeout(ks.kohez);
    $('dlgKuSkedari').classList.remove('hapur');
    var z = ks.zgjidh;
    ks = { f: null, titulli: '', zgjidh: null, kohez: null };
    if (z) z();
  }
  $('ksAnulo').addEventListener('click', function () { mbaroKs(); fokusoBarkodin(); });
  $('ksKetu').addEventListener('click', async function () {
    var f = ks.f, t = ks.titulli, z = ks.zgjidh;
    ks.zgjidh = null; // premtimi mbaron pasi të ndahet/shkarkohet këtu
    mbaroKs();
    if (f) await ndajOseShkarkoKetu(f, t);
    if (z) z();
  });
  $('ksPc').addEventListener('click', async function () {
    var ky = ks, c = window.__stokuCloud;
    if (!ky.f || !kaLlogariPerPc() || !lejaDergoNePc()) return;
    gjendjaKs('pune');
    var r = navigator.onLine === false ? { ok: false, arsye: 'rrjeti' }
      : await c.skedaret.dergo(ky.f.skedari, { emri: ky.f.emri, titulli: ky.titulli, pajisja: opsione.pda ? 'PDA' : 'Telefoni' });
    if (ks !== ky) { // dritarja u mbyll ndërkohë: rezultati del si njoftim
      toast(r.ok ? 'U dërgua në PC. E gjen te Stoku në kompjuter, te Përmbledhja.' : 'S\'u dërgua në PC. Provo sërish.', 4500);
      return;
    }
    if (r.ok) {
      gjendjaKs('gati', 'E gjen te Stoku në kompjuter, te Përmbledhja, me butonin "Shkarko".');
      ky.kohez = setTimeout(function () { if (ks === ky) { mbaroKs(); fokusoBarkodin(); } }, 2500);
      return;
    }
    gjendjaKs('gabim', r.arsye === 'i-madh' ? 'Skedari është mbi 15 MB, shumë i madh për PC-në. Mund ta shkarkosh këtu.'
      : r.arsye === 'leje' ? 'Firebase s\'e lejon ende: rregullat duhet të përditësohen. Mund ta shkarkosh këtu.'
      : 'S\'u dërgua. Kontrollo internetin dhe provo sërish, ose shkarkoje këtu.');
  });

  // Ndan (ose shkarkon) këtu një skedar tashmë të gatshëm { skedari, emri }
  async function ndajOseShkarkoKetu(f, titulliShpernd) {
    if (kaShare(f.skedari)) {
      try {
        await navigator.share({ files: [f.skedari], title: titulliShpernd || f.emri });
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return; // përdoruesi e mbylli menunë
      }
    }
    shkarkoDirekt(f);
  }

  // Butoni "Eksporto në Excel": një prekje, pa dritare zgjedhjeje
  async function eksporto() {
    if (!leja('eksportExcel')) return;
    var f = krijoSkedarin();
    if (!f) return;
    await ndajOseShkarko(f, 'Malli');
  }

  $('btnEksport').addEventListener('click', eksporto);

  // ---------- Eksporti në PDF (etiketa me barkod, për printim dhe riskenim) ----------
  function formatiBarkodit(b) {
    if (/^[0-9]{13}$/.test(b)) return 'EAN13';
    if (/^[0-9]{12}$/.test(b)) return 'UPC';
    if (/^[0-9]{8}$/.test(b)) return 'EAN8';
    return 'CODE128';
  }

  // Vizaton barkodin (grafik + numri poshtë tij) mbi një <canvas>; provon disa formate nëse i pari dështon
  function vizatoBarkodin(canvas, barkodi) {
    var formatet = [formatiBarkodit(barkodi)];
    if (formatet[0] !== 'CODE128') formatet.push('CODE128');
    for (var i = 0; i < formatet.length; i++) {
      try {
        window.JsBarcode(canvas, barkodi, {
          format: formatet[i], displayValue: true, fontSize: 16,
          height: 46, margin: 6, background: '#ffffff', lineColor: '#000000'
        });
        return true;
      } catch (e) { /* provo formatin tjetër */ }
    }
    return false;
  }

  function shkurtoTekstin(tekst, maks) {
    if (!tekst) return '';
    return tekst.length > maks ? tekst.slice(0, maks - 1) + '…' : tekst;
  }

  // Krijon një PDF me etiketa (barkod + numër + emër + sasi) të gjitha produktet e folderit,
  // të rregulluara në rrjetë mbi fletë A4, gati për printim dhe riskenim më vonë.
  async function eksportoPdf() {
    if (folderiAktual === null || !leja('eksportPdf')) return;
    if (typeof window.jspdf === 'undefined' || typeof window.JsBarcode === 'undefined') {
      toast(T('pdfNukGati'));
      return;
    }
    var te = produktetENjeFolderi(folderiAktual);
    if (te.length === 0) { toast(T('nukKaProdukteEksport')); return; }
    te.sort(emriKrahaso);

    var btn = $('btnEksportPdf');
    var tekstiVjeter = btn.textContent;
    btn.disabled = true;
    btn.textContent = T('pdfDukeKrijuar');

    try {
      var JsPdfKlasa = window.jspdf.jsPDF;
      var dok = new JsPdfKlasa({ unit: 'mm', format: 'a4' });

      var faqjaGj = 210, faqjaLart = 297;
      var mV = 8;
      var kolona = 3, rreshta = 8;
      var boshllek = 3;
      var qelizaGj = (faqjaGj - 2 * mV - (kolona - 1) * boshllek) / kolona;
      var qelizaLart = (faqjaLart - 2 * mV - (rreshta - 1) * boshllek) / rreshta;
      var perFaqe = kolona * rreshta;

      var canvas = document.createElement('canvas');

      te.forEach(function (p, idx) {
        var poz = idx % perFaqe;
        if (idx > 0 && poz === 0) dok.addPage();
        var kol = poz % kolona;
        var rr = Math.floor(poz / kolona);
        var x = mV + kol * (qelizaGj + boshllek);
        var y = mV + rr * (qelizaLart + boshllek);

        dok.setDrawColor(210);
        dok.rect(x, y, qelizaGj, qelizaLart);

        var uKrijua = vizatoBarkodin(canvas, p.barkodi);
        var qendraX = x + qelizaGj / 2;

        if (uKrijua) {
          var barkodiGj = qelizaGj - 4;
          var barkodiLart = barkodiGj * (canvas.height / canvas.width);
          var maksLart = qelizaLart * 0.6;
          if (barkodiLart > maksLart) barkodiLart = maksLart;
          var imgX = x + (qelizaGj - barkodiGj) / 2;
          dok.addImage(canvas.toDataURL('image/png'), 'PNG', imgX, y + 2, barkodiGj, barkodiLart);

          var yTeksti = y + 2 + barkodiLart + 4;
          dok.setFont('helvetica', 'normal');
          dok.setFontSize(8);
          dok.setTextColor(20, 20, 20);
          dok.text(shkurtoTekstin(p.emri || T('paEmerListe'), 28), qendraX, yTeksti, { align: 'center' });
          dok.setFont('helvetica', 'bold');
          dok.setFontSize(9);
          dok.text(T('sasia') + ': ' + p.sasia, qendraX, yTeksti + 5, { align: 'center' });
        } else {
          dok.setFont('helvetica', 'normal');
          dok.setFontSize(9);
          dok.text(p.barkodi, qendraX, y + qelizaLart / 2, { align: 'center' });
        }
      });

      var d = new Date();
      var emriSkedarit = 'etiketa_' + sluguFolderit(emriFolderit(folderiAktual)) + '_' +
        d.getFullYear() + '-' + dyShifra(d.getMonth() + 1) + '-' + dyShifra(d.getDate()) + '.pdf';
      var bajtet = dok.output('arraybuffer');
      var skedari = new File([bajtet], emriSkedarit, { type: 'application/pdf' });
      await ndajOseShkarko({ skedari: skedari, emri: emriSkedarit }, 'Etiketa');
    } catch (err) {
      toast(T('pdfDeshtoi'));
    } finally {
      btn.disabled = false;
      btn.textContent = tekstiVjeter;
    }
  }

  $('btnEksportPdf').addEventListener('click', eksportoPdf);

  // ---------- Fshirja e të gjithave (me pritje 10 sekonda) ----------
  var kohezues = null;

  function hapFshirjen() {
    if (folderiAktual === null || !leja('stokuFshi')) return;
    var n = produktetENjeFolderi(folderiAktual).length;
    if (!n) return;
    $('fshiTitulli').textContent = T('teFshihenTeGjitha');
    $('fshiTekst').textContent = T('fshirjaTekst', { n: n, folder: emriFolderit(folderiAktual) });
    var s = 10;
    var btn = $('fshiKonfirmo');
    btn.disabled = true;
    btn.textContent = T('fshiKrejt') + ' (' + s + ')';
    $('dlgFshirje').classList.add('hapur');
    clearInterval(kohezues);
    kohezues = setInterval(function () {
      s--;
      if (s > 0) {
        btn.textContent = T('fshiKrejt') + ' (' + s + ')';
      } else {
        clearInterval(kohezues);
        btn.disabled = false;
        btn.textContent = T('fshiKrejt');
      }
    }, 1000);
  }

  function mbyllFshirjen() {
    clearInterval(kohezues);
    $('dlgFshirje').classList.remove('hapur');
    fokusoBarkodin();
  }

  $('btnFshiTeGjitha').addEventListener('click', hapFshirjen);
  $('fshiAnulo').addEventListener('click', mbyllFshirjen);
  $('dlgFshirje').addEventListener('click', function (ev) {
    if (ev.target === $('dlgFshirje')) mbyllFshirjen(); // prekja jashtë = anulim
  });
  $('fshiKonfirmo').addEventListener('click', function () {
    if ($('fshiKonfirmo').disabled) return;
    if (folderiAktual === null) return;
    if (!leja('stokuFshi')) { mbyllFshirjen(); return; }
    produktetENjeFolderi(folderiAktual).forEach(function (p) {
      delete produktet[celesiProduktit(folderiAktual, p.barkodi)];
      shenoProduktinEFshire(celesiProduktit(folderiAktual, p.barkodi), true);
    });
    ruajFshiraet();
    ruajBaze();
    mbyllFshirjen();
    renderLista();
    renderFolderat();
    toast(T('uFshinePrejFolderit'));
  });


  // ================= Afatet (datat e skadimit) =================
  // Punëtorët i fotografojnë fletët ku kanë shkruar afatet → AI i lexon → punëtori i kontrollon → ruhen.
  // Menaxherja i sheh me ngjyra: e kuqe = ka skaduar (hiqe nga rafti), e verdhë = skadon brenda 1 muaji
  // (afër skadimit), e gjelbër = në rregull. Sinkronizohen me cloud-in bashkë me produktet.
  var AF = window.StokuAfatet;
  var afFiltri = 'aktive';
  var afMuaji = ''; // '' = krejt muajt, 'VVVV-MM' ose 'pa-date' (sipas datës së skadimit)

  function ruajAfatet() {
    try { localStorage.setItem(KEY_AFATET, JSON.stringify(afatet)); } catch (e) { toast(T('ruajtjaDeshtoi')); } // (vazhdon: cloud-i + pamja)
    __versioniLokal++;
    planifikoSinkronizimin(300); // afatet dërgohen në cloud menjëherë pas çdo ndryshimi
    rifreskoAfatet();
    planifikoMesimin();
  }
  function shenoAfatinEFshire(id, paRuajtje) { fshira.afatet = fshira.afatet || {}; fshira.afatet[id] = Date.now(); if (!paRuajtje) ruajFshiraet(); }

  // ---- Kujtesa e produkteve (afatet.js, vetëm në këtë pajisje): barkodi → emri, furnizuesi ----
  function KJ() {
    var A = window.StokuAfatet, k = A && A.kujtesa ? A.kujtesa() : null;
    if (k && k.vendosAutorin) k.vendosAutorin(perdoruesiAktual() ? emriPerdoruesitAktual() : '', eshteAdminiIStokut()); // versioni i administratorit fiton
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
        var l = afatet.slice().sort(function (a, b) { return (b.ndryshuarSe || 0) - (a.ndryshuarSe || 0); });
        Object.keys(produktet).forEach(function (x) { l.push(produktet[x]); });
        if (typeof ekK !== 'undefined' && ekK && ekK.kaLidhje && ekK.kaLidhje() && ekK.anetaretMeAfate) {
          ekK.anetaretMeAfate().forEach(function (a) { if (!a.uneJam) l = l.concat(a.afatet || []); });
        }
        k.mesoShume(l, 'plotëso');
        ruajFurnizuesitEMiratuar();
      } catch (e) { /* ok */ }
    }, 1500);
  }
  planifikoMesimin(); // hapja: nga afatet dhe stoku që janë tashmë në pajisje
  function emriNgaProduktet(barkodi) {
    if (!barkodi) return '';
    var m = KJ() && KJ().merr(barkodi);
    if (m && m.emri) return m.emri;
    var gjetur = '';
    Object.keys(produktet).some(function (k) {
      var p = produktet[k];
      if (p.barkodi === barkodi && p.emri) { gjetur = p.emri; return true; }
      return false;
    });
    if (!gjetur) afatet.some(function (a) { if (a.barkodi === barkodi && a.emri) { gjetur = a.emri; return true; } return false; });
    return gjetur;
  }
  function furnizuesiNgaAfatet(barkodi) {
    var m = barkodi && KJ() && KJ().merr(barkodi);
    if (m && m.furnizuesi) return m.furnizuesi;
    var f = '';
    afatet.slice().sort(function (a, b) { return (b.ndryshuarSe || 0) - (a.ndryshuarSe || 0); })
      .some(function (a) { if (a.barkodi === barkodi && a.furnizuesi) { f = a.furnizuesi; return true; } return false; });
    return f;
  }

  // Shenja në butonin e kokës: numri i të skaduarave + atyre afër skadimit
  function rifreskoShenjen() {
    var n = AF.numero(afatetEMarketit());
    var sh = $('afShenja');
    var tot = n.skaduar + n.afer + n['pa-date'];
    sh.style.display = tot ? '' : 'none';
    sh.textContent = tot > 99 ? '99+' : String(tot);
    sh.classList.toggle('verdhe', n.skaduar + n['pa-date'] === 0);
    $('btnAfatet').title = n.skaduar ? (n.skaduar === 1 ? '1 produkt ka skaduar' : n.skaduar + ' produkte kanë skaduar') : (n.afer ? (n.afer === 1 ? '1 produkt skadon së shpejti' : n.afer + ' produkte skadojnë së shpejti') : 'Afatet e produkteve');
  }


  // ================= Marketet (v241, marketet.js) =================
  // Pa asnjë market s'shihet asgjë e re. Me markete: "Je te: X" (GPS ose me dorë) dhe afatet e atij marketi.
  function kaMarkete() { return marketet.length > 0 && eshteMerchandiser(); }
  function idMarketitAktiv() { var id = marketiAktiv.id; return kaMarkete() && id && MK.sipasId(marketet, id) ? id : null; }
  function afatetEMarketit() { return MK.filtro(afatet, idMarketitAktiv()); }
  function emriMarketit(id) { return MK.emri(marketet, id); }
  function afatetAktiveTeMarketi(id) { return afatet.filter(function (a) { return a.m === id && a.statusi !== 'hequr'; }).length; }
  function vendosMarketinAktiv(id, menyra) {
    marketiAktiv = MK.ruajAktivin({ id: id || null, menyra: menyra || 'dore', koha: Date.now(), kontrolluarSe: marketiAktiv.kontrolluarSe || 0 });
    rifreskoMarketet();
  }
  // v242: merchandiseri pa asnjë market: çipi "Shto marketin" (pa të s'kishte nga ta dinte se ku shtohen)
  function merchPaMarkete() { return !marketet.length && eshteMerchandiser(); }
  function vizatoCipin() {
    var ka = kaMarkete(), id = idMarketitAktiv(), pa = merchPaMarkete();
    $('afMarketi').hidden = !ka && !pa;
    $('afMarketiEmri').textContent = pa ? 'Shto marketin ku punon' : id ? emriMarketit(id) : 'Krejt marketet';
    $('afMarketi').querySelector('.mk-chip__lbl').textContent = pa ? 'Marketi' : id ? 'Je te' : 'Po sheh';
    $('tabMarketetStatus').textContent = !marketet.length ? 'Për disa markete' : (id ? 'Je te: ' + emriMarketit(id) : sasiaETekst(marketet.length, 'market', 'markete'));
  }
  function rifreskoMarketet() {
    vizatoCipin();
    if ($('dlgAfatet').classList.contains('hapur')) renderAfatet();
    rifreskoShenjen();
    if (folderiAktual === null && !$('dlgAfatet').classList.contains('hapur')) renderFolderat();
    if (faqjaEOpsioneve === 'marketet') vizatoMarketetNeCilesime();
    if (HT && faqjaEOpsioneve === 'harta' && !eshteAdminiIStokut()) { htMerrPikat(); htVizato(); }
  }
  // ---- v246: pikat e përbashkëta (pikat/{id}) dhe vendndodhja kur hapet aplikacioni ----
  // Merchandiseri: sa hapet Stoku (jo më shpesh se 2 min) kërkohet vendndodhja (këtu del leja e telefonit herën e parë).
  // Je te një market yt → "Je te: X". Je te një pikë që e ka shtuar dikush tjetër → shtohet te marketet e tua dhe "Je te: X".
  // S'je te asnjë → "Ku je?" me pikat afër dhe "+ Market i ri" (jo më shpesh se një herë në 3 orë, pa e kërkuar vetë).
  var PK = { lista: [], gati: false, ndal: null, uid: null, lidhjeNeRruge: {}, poz: null };
  // v247: vendndodhja e fundit (VETËM në memorie, s'ruhet askund): "Ku je?" nga çipi (Stoku, Afatet) i tregon pikat afër
  // edhe kur GPS-i e ka gjetur marketin, që merchandiseri ta ndërrojë me dorë kur GPS-i s'e ka kapur mirë
  var POZ_MS = 15 * 60 * 1000;
  function pozEFundit() { return PK.poz && Date.now() - PK.poz.koha < POZ_MS ? PK.poz : null; }
  var KEY_KUJE = 'stoku:marketet:kuje'; // { uid, koha }: kur u pyet vetë herën e fundit "Ku je?"
  function pikaEMarketit(m) { return (m && m.p && PK.lista.filter(function (q) { return q.id === m.p; })[0]) || null; }
  function tekstiPikesSeHuaj(px) {
    return px.emriNgaAdmini ? 'Emrin e këtij marketi e ka caktuar administratori i Stoku-t.'
      : 'Këtë market e shtoi ' + (px.krijuarNgaEmri || 'dikush tjetër') + ' në Stoku: emrin e ndryshon ai ose administratori.';
  }
  function nisPikat() {
    var c = window.__stokuCloud, e = c && c.ekipa, u = perdoruesiAktual();
    var duhen = !!u && (eshteMerchandiser() || eshteAdminiIStokut());
    if (PK.ndal && (!duhen || PK.uid !== u.uid)) { try { PK.ndal(); } catch (er) { /* ok */ } PK.ndal = null; PK.lista = []; PK.gati = false; }
    if (!duhen || PK.ndal || !e || !e.degjoPikat) return;
    PK.uid = u.uid;
    PK.ndal = e.degjoPikat(function (l) { PK.lista = MK.pastroPikat(l); PK.gati = true; pasPikave(); },
      function () { PK.gati = true; }); // rregullat para v246: pa pika të përbashkëta, marketet punojnë si më parë
  }
  ['stoku-auth-ndryshoi', 'stoku-merchandiser', 'stoku-cloud-gati'].forEach(function (ev) { window.addEventListener(ev, function () { setTimeout(nisPikat, 0); }); });
  setTimeout(nisPikat, 0);
  function uidIm() { var u = perdoruesiAktual(); return u ? u.uid : ''; }
  // Pikat erdhën/ndryshuan: emrat e marketeve të lidhura (p.sh. i ndryshoi administratori), marketet e vjetra bëhen pika
  function pasPikave() {
    if (eshteMerchandiser()) {
      var r = MK.emratNgaPikat(marketet, PK.lista);
      if (r.n) { marketet = r.marketet; ruajMarketet(false); }
      marketet.forEach(function (m) { if (MK.kaVend(m) && !m.p) lidhMePike(m.id); });
    }
    if (typeof HT !== 'undefined' && HT && faqjaEOpsioneve === 'harta') { htMerrPikat(); htVizato(); }
  }
  // Marketi im me vendndodhje → pika e përbashkët (ekzistuese me të njëjtin emër afër, ose e re); pika ime ndjek vendndodhjen
  async function lidhMePike(id) {
    var c = window.__stokuCloud, e = c && c.ekipa, m = MK.sipasId(marketet, id);
    if (!m || !MK.kaVend(m) || !PK.gati || !e || !e.shtoPiken || PK.lidhjeNeRruge[id]) return;
    if (m.p) {
      var x = PK.lista.filter(function (q) { return q.id === m.p; })[0];
      if (x && MK.mundTaRiemertoje(x, uidIm()) && MK.largesia(x, m) > 5) e.ndryshoPiken(m.p, { lat: m.lat, lng: m.lng });
      return;
    }
    PK.lidhjeNeRruge[id] = true;
    var ekz = MK.pikaPerMarketin(PK.lista, m), pid = ekz && ekz.id;
    if (!pid) { var r = await e.shtoPiken(m); pid = r && r.ok ? r.id : null; }
    PK.lidhjeNeRruge[id] = false;
    if (!pid) return;
    marketet = marketet.map(function (x) { return x.id === id ? Object.assign({}, x, { p: pid, ndryshuarSe: Date.now() }) : x; });
    ruajMarketet(false);
  }
  // Market i ri (te lista ime) nga një pikë e përbashkët; marketi i parë merr edhe afatet pa market
  function shtoNgaPika(pika) {
    var m = MK.sipasPikes(marketet, pika.id);
    if (m) return m;
    var tani = Date.now(), iPari = !marketet.length, nZh = 0;
    m = MK.ngaPika(pika, tani);
    marketet = marketet.concat([m]);
    if (iPari) { var r = MK.vendosPaMarket(afatet, marketet, m.id, tani); afatet = r.afatet; nZh = r.n; }
    ruajMarketet(nZh > 0);
    return m;
  }
  function pritPikat(cb) {
    var t0 = Date.now();
    (function prit() { if (PK.gati || !PK.ndal || Date.now() - t0 > 4000) cb(); else setTimeout(prit, 150); })();
  }
  var __gpsDukePunuar = false, __gabimiGpsTreguar = false;
  function kontrolloGps(meDore) {
    if (!eshteMerchandiser() || __gpsDukePunuar) return;
    if (!meDore && document.hidden) return;
    marketiAktiv = MK.lexoAktivin(); // një skedë tjetër (ose aplikacioni) mund ta ketë ndërruar ndërkohë
    if (!meDore && Date.now() - (marketiAktiv.kontrolluarSe || 0) < MK.KONTROLLI_MS) return;
    __gpsDukePunuar = true;
    if (meDore) toast('Duke e gjetur vendndodhjen…', 15000);
    MK.pozita(function (e, poz) {
      if (e) {
        __gpsDukePunuar = false;
        marketiAktiv = MK.ruajAktivin(Object.assign({}, marketiAktiv, { kontrolluarSe: Date.now() }));
        if (meDore || !__gabimiGpsTreguar) { __gabimiGpsTreguar = true; toast(MK.tekstiGabimit(e), 7000); }
        return;
      }
      PK.poz = { lat: poz.lat, lng: poz.lng, sakt: poz.sakt, koha: Date.now() };
      pritPikat(function () {
        __gpsDukePunuar = false;
        var para = idMarketitAktiv();
        var gj = MK.gjej(marketet, poz), uShtua = false;
        if (!gj) {
          var gp = MK.gjej(PK.lista, poz); // një pikë e njohur e Stoku-t (e shtuar nga dikush tjetër)
          if (gp) { var n0 = marketet.length; var m = shtoNgaPika(gp.marketi); uShtua = marketet.length > n0; gj = { marketi: m, largesia: gp.largesia }; }
        }
        var baza = meDore ? Object.assign({}, marketiAktiv, { menyra: 'gps', koha: 0 }) : marketiAktiv; // "Gjej me GPS" fiton ndaj zgjedhjes me dorë
        marketiAktiv = MK.ruajAktivin(MK.pasGps(baza, gj));
        var pas = idMarketitAktiv();
        rifreskoMarketet();
        if (pas) {
          if (pas !== para || meDore || uShtua) toast('Je te: ' + emriMarketit(pas) + (uShtua ? ' (u shtua te marketet e tua)' : ''), 4000);
          return;
        }
        // S'je te asnjë market i njohur
        if (!meDore) {
          if (marketiAktiv.menyra === 'dore' && Date.now() - marketiAktiv.koha < MK.DORE_MS) return; // e zgjodhi vetë së fundi
          var kuje = null;
          try { kuje = JSON.parse(localStorage.getItem(KEY_KUJE) || 'null'); } catch (er) { kuje = null; }
          if (kuje && kuje.uid === uidIm() && Date.now() - (Number(kuje.koha) || 0) < MK.DORE_MS) return;
          if (document.querySelector('.mbulese.hapur:not(.faqe-e-plote)')) return; // s'e ndërpret një dritare tjetër
        }
        try { localStorage.setItem(KEY_KUJE, JSON.stringify({ uid: uidIm(), koha: Date.now() })); } catch (er) { /* ok */ }
        if (!marketet.length && !MK.pikatAfer(PK.lista, poz, 2000, 1).length) { hapMarketinERi(); return; }
        hapZgjedhjenEMarketit(poz, true);
      });
    });
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) kontrolloGps(false); });
  setTimeout(function () { kontrolloGps(false); }, 1200);

  // Dritarja "Ku je?": qellimi 'zgjidh' (çipi) ose 'te-reja' (importi pa market aktiv) → Promise(id | null | undefined = anulo)
  var __mkPritja = null;
  // poz (v246): vendndodhja e tanishme → edhe pikat e Stoku-t afër (deri 2 km), që s'janë ende te marketet e tua ("p:" + id)
  // panjohur (v247): GPS-i s'e gjeti asnjë market (pyetja vetë); përndryshe çipi, me pikat afër nga vendndodhja e fundit
  function zgjidhMarketin(qellimi, poz, panjohur) {
    if (__mkPritja) __mkPritja(undefined);
    var perTeReja = qellimi === 'te-reja';
    var afer = !perTeReja && poz ? MK.pikatAfer(PK.lista, poz, 2000, 6).filter(function (x) { return !MK.sipasPikes(marketet, x.pika.id); }) : [];
    $('mkdTitulli').textContent = perTeReja ? 'Në cilin market?' : 'Ku je?';
    $('mkdNen').textContent = perTeReja ? 'Zgjidh marketin ku i ke këto afate.'
      : poz && panjohur ? 'S\'je te asnjë market i njohur. Zgjidh ku je, ose shto këtë vend si market të ri.'
      : 'Afatet dhe numrat tregohen për marketin që zgjedh. Nëse GPS-i s\'e ka gjetur mirë, zgjidhe vetë.';
    $('mkdGps').hidden = perTeReja || (!MK.kaPika(marketet) && !PK.lista.length);
    $('mkdMenaxho').hidden = perTeReja;
    var c = $('mkdLista'); c.textContent = '';
    var aktiv = idMarketitAktiv();
    var opsionet = MK.rendit(marketet).map(function (m) { return { id: m.id, emri: m.emri, n: afatetAktiveTeMarketi(m.id) }; });
    if (!perTeReja) opsionet.push({ id: null, emri: 'Krejt marketet', n: afatet.filter(function (a) { return a.statusi !== 'hequr'; }).length });
    return new Promise(function (zgjidh) {
      __mkPritja = function (v) { __mkPritja = null; $('dlgMarketi').classList.remove('hapur'); zgjidh(v); };
      opsionet.forEach(function (o) {
        var b = document.createElement('button'); b.type = 'button';
        if (!perTeReja && o.id === aktiv) b.className = 'aktiv';
        var t = document.createElement('span'); t.textContent = o.emri; b.appendChild(t);
        var n = document.createElement('small'); n.textContent = o.n === 1 ? '1 afat' : o.n + ' afate'; b.appendChild(n);
        b.addEventListener('click', function () { if (__mkPritja) __mkPritja(o.id); });
        c.appendChild(b);
      });
      if (afer.length) {
        var h = document.createElement('div'); h.className = 'mk-dlg-titull'; h.textContent = 'Afër teje';
        c.insertBefore(h, c.firstChild);
        afer.slice().reverse().forEach(function (x) {
          var b = document.createElement('button'); b.type = 'button'; b.className = 'mk-afer';
          var t = document.createElement('span'); t.textContent = x.pika.emri; b.appendChild(t);
          var n = document.createElement('small'); n.textContent = x.largesia < 1000 ? x.largesia + ' m' : (x.largesia / 1000).toFixed(1).replace('.', ',') + ' km'; b.appendChild(n);
          b.addEventListener('click', function () { if (__mkPritja) __mkPritja('p:' + x.pika.id); });
          c.insertBefore(b, h.nextSibling);
        });
        if (opsionet.length) { var h2 = document.createElement('div'); h2.className = 'mk-dlg-titull'; h2.textContent = 'Marketet e mia'; c.insertBefore(h2, c.querySelector('button:not(.mk-afer)')); }
      }
      $('dlgMarketi').classList.add('hapur');
    });
  }
  $('mkdAnulo').addEventListener('click', function () { if (__mkPritja) __mkPritja(undefined); });
  $('dlgMarketi').addEventListener('click', function (ev) { if (ev.target === $('dlgMarketi') && __mkPritja) __mkPritja(undefined); });
  $('mkdGps').addEventListener('click', function () { if (__mkPritja) __mkPritja(undefined); kontrolloGps(true); });
  $('mkdMenaxho').addEventListener('click', function () {
    if (__mkPritja) __mkPritja(undefined);
    if ($('dlgAfatet').classList.contains('hapur')) mbyllAfatetFaqe();
    hapOpsionet(); aktivizoTabin('marketet');
  });
  async function hapZgjedhjenEMarketit(poz, panjohur) {
    var id = await zgjidhMarketin('zgjidh', poz, panjohur);
    if (id === undefined) return;
    if (typeof id === 'string' && id.indexOf('p:') === 0) {
      var pika = PK.lista.filter(function (x) { return x.id === id.slice(2); })[0];
      if (!pika) return;
      var m = shtoNgaPika(pika);
      vendosMarketinAktiv(m.id, 'dore');
      toast('Je te: ' + m.emri + ' (u shtua te marketet e tua)', 4000);
      return;
    }
    vendosMarketinAktiv(id, 'dore');
  }
  function prekCipin() { if (merchPaMarkete()) hapMarketinERi(); else hapZgjedhjenEMarketit(pozEFundit()); }
  $('afMarketi').addEventListener('click', prekCipin);
  vizatoCipin(); // gjendja e çipit dhe e rreshtit te Cilësimet që në hapje

  // ---- v242: marketi i ri (emri + vendndodhja), nga çipi, "Ku je?" → "+ Market i ri", ose vetë herën e parë ----
  // Kthen { marketi, n (afatet e vendosura te ky market) } ose tekstin e gabimit
  function shtoMarketERi(emri) {
    var e = String(emri || '').trim().replace(/\s+/g, ' ');
    if (!e) return 'Shkruaj emrin e marketit.';
    if (MK.ekzistonEmri(marketet, e)) return 'Ke tashmë një market me këtë emër.';
    var tani = Date.now(), iPari = !marketet.length;
    var m = { id: MK.idERe(), emri: e.slice(0, MK.EMRI_MAKS), ndryshuarSe: tani };
    marketet = marketet.concat([m]);
    var nZhvendosur = 0;
    // Marketi i parë: afatet e deritashme (pa market) shkojnë te ai, që asgjë të mos mbetet jashtë
    if (iPari) { var r = MK.vendosPaMarket(afatet, marketet, m.id, tani); afatet = r.afatet; nZhvendosur = r.n; }
    marketiAktiv = MK.ruajAktivin({ id: m.id, menyra: 'dore', koha: tani, kontrolluarSe: marketiAktiv.kontrolluarSe || 0 });
    ruajMarketet(nZhvendosur > 0);
    return { marketi: m, n: nZhvendosur };
  }
  // Vendndodhja e tanishme → pika e marketit (id); cb(gabimi | null, saktësia)
  function ruajVendinEMarketit(id, cb) {
    MK.pozita(function (e, poz) {
      if (e) { cb(e); return; }
      var tani = Date.now();
      marketet = marketet.map(function (x) { return x.id === id ? Object.assign({}, x, { lat: Math.round(poz.lat * 1e6) / 1e6, lng: Math.round(poz.lng * 1e6) / 1e6, ndryshuarSe: tani }) : x; });
      marketiAktiv = MK.ruajAktivin({ id: id, menyra: 'gps', koha: tani, kontrolluarSe: tani });
      ruajMarketet(false);
      lidhMePike(id); // v246: bëhet pikë e Stoku-t (ose lidhet me atë që ekziston aty)
      cb(null, Math.round(poz.sakt || 0));
    });
  }
  function hapMarketinERi() {
    if (!eshteMerchandiser()) return;
    $('mkrTitulli').textContent = marketet.length ? 'Market i ri' : 'Në cilin market je?';
    $('mkrEmri').value = ''; $('mkrGabim').textContent = ''; $('mkrVendi').checked = true;
    $('mkrRuaj').disabled = false; $('mkrRuaj').textContent = 'Ruaj marketin';
    $('dlgMarketiRi').classList.add('hapur');
    setTimeout(function () { $('mkrEmri').focus(); }, 80);
    try { localStorage.setItem('stoku:marketet:pyetur', (perdoruesiAktual() || {}).uid || '1'); } catch (e) { /* ok */ }
  }
  function mbyllMarketinERi() { $('dlgMarketiRi').classList.remove('hapur'); }
  function ruajMarketinERi() {
    var r = shtoMarketERi($('mkrEmri').value);
    if (typeof r === 'string') { $('mkrGabim').textContent = r; $('mkrEmri').focus(); return; }
    var m = r.marketi, tekstiAfateve = r.n ? ' Afatet e deritashme (' + r.n + ') u vendosën te ky market.' : '';
    if (!$('mkrVendi').checked) {
      mbyllMarketinERi();
      toast('"' + m.emri + '" u shtua.' + tekstiAfateve + ' Kur je brenda tij, ruaje vendndodhjen te Cilësimet → Marketet.', 6000);
      return;
    }
    $('mkrRuaj').disabled = true; $('mkrRuaj').textContent = 'Duke e gjetur vendndodhjen…';
    ruajVendinEMarketit(m.id, function (e, sakt) {
      mbyllMarketinERi();
      if (e) { toast('"' + m.emri + '" u shtua, por pa vendndodhje. ' + MK.tekstiGabimit(e), 8000); return; }
      toast('"' + m.emri + '" u shtua me vendndodhjen.' + tekstiAfateve + (sakt > 100 ? ' GPS-i ishte i dobët (rreth ' + sakt + ' m): provoje sërish te Cilësimet → Marketet.' : ' Herët e tjera Stoku e njeh vetë kur je këtu.'), 7000);
    });
  }
  $('mkrRuaj').addEventListener('click', ruajMarketinERi);
  $('mkrEmri').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); ruajMarketinERi(); } });
  $('mkrAnulo').addEventListener('click', mbyllMarketinERi);
  $('dlgMarketiRi').addEventListener('click', function (ev) { if (ev.target === $('dlgMarketiRi')) mbyllMarketinERi(); });
  $('mkdIRi').addEventListener('click', function () { if (__mkPritja) __mkPritja(undefined); hapMarketinERi(); });
  // Herën e parë që merchandiseri (pa asnjë market) hap Afatet: pyetet vetë një herë
  function pyetMarketinEPare() {
    if (!merchPaMarkete()) return;
    var u = (perdoruesiAktual() || {}).uid || '1', pyetur = null;
    try { pyetur = localStorage.getItem('stoku:marketet:pyetur'); } catch (e) { /* ok */ }
    if (pyetur === u) return;
    setTimeout(function () { if (merchPaMarkete() && $('dlgAfatet').classList.contains('hapur') && !document.querySelector('.mbulese.hapur:not(.faqe-e-plote)')) hapMarketinERi(); }, 600);
  }
  // Llogaria e hapur si merchandiser (ose u lexua nga Firebase pas hyrjes, ose u ndërrua llogaria): marketet dalin/zhduken
  var __merchPara = eshteMerchandiser();
  function rifreskoMerchandiserin() {
    var v = eshteMerchandiser();
    if (v === __merchPara) return;
    __merchPara = v;
    zbatoLejet(); rifreskoMarketet(); rifreskoTabinHarta();
    if (v) setTimeout(function () { kontrolloGps(false); }, 300);
  }
  window.addEventListener('stoku-merchandiser', rifreskoMerchandiserin);
  window.addEventListener('stoku-auth-ndryshoi', rifreskoMerchandiserin);

  // ---- v244: Cilësimet → Harta (harta.js): pikat e marketeve mbi një hartë që tregon vetëm emrat e vendbanimeve.
  // Vetëm administratori dhe merchandiserët. Administratori i sheh pikat e Stoku-t (v246: pikat/{id}), ua ndryshon emrin
  // për krejt Stoku-n dhe i fshin; merchandiseri (v247) i sheh krejt marketet e Stoku-t dhe riemërton vetëm të vetat.
  var SH = window.StokuHarta;
  var HT = { inst: null, dukeHapur: false, pershtatur: false, pikat: null, ngarkuarSe: 0, dukeNgarkuar: false, gabime: 0, zgjedhur: '', neEditim: '' };
  function lejaHarta() { return !!SH && (eshteAdminiIStokut() || eshteMerchandiser()); }
  function rifreskoTabinHarta() {
    var t = $('tabHarta'); if (!t) return;
    t.hidden = !lejaHarta();
    $('tabHartaStatus').textContent = 'Marketet në hartë';
    if (t.hidden && faqjaEOpsioneve === 'harta') aktivizoTabin(null);
  }
  window.addEventListener('stoku-auth-ndryshoi', function () {
    HT.pikat = null; HT.ngarkuarSe = 0; HT.neEditim = ''; HT.zgjedhur = ''; HT.pershtatur = false;
    rifreskoTabinHarta();
  });
  function htTema() { return document.documentElement.getAttribute('data-tema') === 'dark' ? 'dark' : 'light'; }
  function htPikatEMia() {
    var u = perdoruesiAktual();
    return marketet.map(function (m) { return Object.assign({ uid: u ? u.uid : '', perdoruesi: emriPerdoruesitAktual(), imi: true }, m); });
  }
  // v246: administratori sheh pikat e përbashkëta të Stoku-t (pikat/{id})
  function htPikatESistemit() {
    return PK.lista.map(function (x) { return { id: x.id, uid: 'pika', pika: true, emri: x.emri, lat: x.lat, lng: x.lng, perdoruesi: x.krijuarNgaEmri, emriNgaAdmini: x.emriNgaAdmini }; });
  }
  // v247: merchandiseri i sheh krejt marketet e Stoku-t: të vetat (i riemërton si më parë) dhe pikat e të tjerëve
  // (`tjeter`: më të zbehta, vetëm për t'i parë)
  function htPikatEMerchandiserit() {
    var mia = htPikatEMia(), teMia = {};
    mia.forEach(function (m) { if (m.p) teMia[m.p] = true; });
    return mia.concat(PK.lista.filter(function (x) { return !teMia[x.id]; }).map(function (x) {
      return { id: x.id, uid: 'pika', pika: true, tjeter: true, emri: x.emri, lat: x.lat, lng: x.lng, perdoruesi: x.krijuarNgaEmri, eMia: x.krijuarNga === uidIm() };
    }));
  }
  async function htMerrPikat() {
    HT.gabime = 0;
    nisPikat();
    if (!eshteAdminiIStokut()) { HT.pikat = htPikatEMerchandiserit(); return; }
    HT.pikat = PK.gati ? htPikatESistemit() : null;
  }
  async function htHapFaqen(detyro) {
    HT.neEditim = '';
    htVizato();
    htHarta();
    await htMerrPikat(detyro);
    htVizato();
  }
  function htVizato() {
    if (faqjaEOpsioneve !== 'harta') return;
    var admin = eshteAdminiIStokut();
    $('htIntro').textContent = admin
      ? 'Pikat e marketeve që i kanë ruajtur merchandiserët. Në hartë dalin vetëm emrat e qyteteve, fshatrave dhe lagjeve. Prek një pikë ose një emër te lista për ta ndryshuar emrin e pikës për krejt Stoku-n.'
      : 'Marketet e Stoku-t: të tuat me blu, të tjerat me gri. Në hartë dalin vetëm emrat e qyteteve, fshatrave dhe lagjeve. Prek marketin tënd për ta ndryshuar emrin.';
    var c = $('htLista'); c.textContent = '';
    if (HT.inst) HT.inst.vendos(HT.pikat || []);
    if (!HT.pikat) { $('htInfo').textContent = 'Duke i marrë pikat…'; return; }
    if (HT.inst && !HT.pershtatur) { HT.pershtatur = true; HT.inst.pershtat(HT.pikat); }
    var meVend = HT.pikat.filter(SH.kaVend), paVend = HT.pikat.filter(function (p) { return !SH.kaVend(p); });
    $('htInfo').textContent = (meVend.length === 1 ? '1 pikë në hartë' : meVend.length + ' pika në hartë') +
      (paVend.length ? ' · ' + paVend.length + ' pa vendndodhje' : '') + (HT.gabime ? ' · ' + sasiaETekst(HT.gabime, 'llogari', 'llogari') + ' s\'u lexuan' : '') + '.';
    if (!HT.pikat.length) {
      var bo = document.createElement('div'); bo.className = 'ops-furn-bosh';
      bo.textContent = admin ? 'Asnjë merchandiser s\'ka ruajtur ende market.' : 'S\'ka ende asnjë market në hartë. Shtoji te Cilësimet → Marketet.';
      c.appendChild(bo); return;
    }
    function sipasEmrit(a, b) { return String(a.emri).localeCompare(String(b.emri), 'sq'); }
    function titull(tx) { var t = document.createElement('div'); t.className = 'ops-grupi-titull'; t.textContent = tx; c.appendChild(t); }
    var tjera = meVend.filter(function (p) { return p.tjeter; });
    if (tjera.length) { // merchandiseri: të vetat së pari, pastaj marketet e të tjerëve
      meVend = meVend.filter(function (p) { return !p.tjeter; });
      if (meVend.length) titull('Marketet e mia');
    }
    meVend.sort(sipasEmrit).forEach(function (p) { c.appendChild(htRreshti(p)); });
    if (tjera.length) {
      titull('Marketet e tjera të Stoku-t');
      tjera.sort(sipasEmrit).forEach(function (p) { c.appendChild(htRreshti(p)); });
    }
    if (paVend.length) {
      var t = document.createElement('div'); t.className = 'ops-grupi-titull'; t.textContent = 'Pa vendndodhje (s\'dalin në hartë)';
      c.appendChild(t);
      paVend.sort(sipasEmrit).forEach(function (p) { c.appendChild(htRreshti(p)); });
    }
  }
  function htRreshti(p) {
    var k = SH.celesi(p);
    if (HT.neEditim === k) return htRreshtiIEditimit(p);
    var b = document.createElement('button'); b.type = 'button'; b.className = 'ops-furn-rresht' + (HT.zgjedhur === k ? ' ht-zgjedhur' : '');
    b.setAttribute('data-k', k);
    var ik = document.createElement('span'); ik.className = 'kat-ikona-badge ' + (SH.kaVend(p) ? 'ngj-blu' : 'ngj-gri') + ' ops-furn-ik';
    ik.textContent = (String(p.emri).charAt(0) || '?').toUpperCase();
    var t = document.createElement('span'); t.className = 'ops-rresht__tekst';
    var e = document.createElement('span'); e.className = 'ops-furn-emri'; e.textContent = p.emri;
    var n = document.createElement('span'); n.className = 'hint';
    n.textContent = eshteAdminiIStokut() ? (p.imi ? 'Marketi yt' : (p.perdoruesi ? 'E shtoi ' + p.perdoruesi : 'Pikë e Stoku-t') + (p.emriNgaAdmini ? ' · emri nga ti' : ''))
      : p.tjeter ? (p.eMia ? 'E shtove ti' : p.perdoruesi ? 'E shtoi ' + p.perdoruesi : 'Market i Stoku-t') : (SH.kaVend(p) ? 'Marketi yt' : 'Pa vendndodhje');
    t.appendChild(e); t.appendChild(n);
    b.appendChild(ik); b.appendChild(t);
    if (p.tjeter) { ik.className = 'kat-ikona-badge ngj-gri ops-furn-ik'; b.setAttribute('aria-label', 'Shfaqe në hartë ' + p.emri); }
    else { b.appendChild(lapsi()); b.setAttribute('aria-label', 'Ndrysho emrin e pikës ' + p.emri); }
    b.addEventListener('click', function () { htZgjidh(k, true); });
    return b;
  }
  // Pika e zgjedhur (nga harta ose lista): theksohet, harta shkon te ajo dhe hapet ndryshimi i emrit
  function htZgjidh(k, ngaLista) {
    var p = (HT.pikat || []).filter(function (x) { return SH.celesi(x) === k; })[0];
    HT.zgjedhur = k; HT.neEditim = p && p.tjeter ? '' : k; // marketin e dikujt tjetër merchandiseri vetëm e sheh
    if (HT.inst) HT.inst.zgjidh(k, ngaLista);
    htVizato();
    var r = $('htLista').querySelector('.ops-furn-edit');
    if (r && !ngaLista) r.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function htRreshtiIEditimit(p) {
    var w = document.createElement('div'); w.className = 'ops-furn-edit';
    var lbl = document.createElement('div'); lbl.className = 'hint';
    lbl.textContent = 'Emri i pikës' + (eshteAdminiIStokut() && !p.imi && p.perdoruesi ? ' (e shtoi ' + p.perdoruesi + ')' : '');
    var inp = document.createElement('input'); inp.type = 'text'; inp.value = p.emri; inp.maxLength = MK.EMRI_MAKS;
    inp.setAttribute('autocomplete', 'off'); inp.setAttribute('spellcheck', 'false'); inp.setAttribute('aria-label', 'Emri i pikës');
    var gab = document.createElement('div'); gab.className = 'hint ops-furn-gabim';
    var rr = document.createElement('div'); rr.className = 'ops-furn-veprime';
    var anulo = document.createElement('button'); anulo.type = 'button'; anulo.className = 'btn ops-btn-dyte'; anulo.textContent = 'Anulo';
    var ruaj = document.createElement('button'); ruaj.type = 'button'; ruaj.className = 'btn'; ruaj.textContent = 'Ruaj';
    if (p.pika) { // administratori: pika e dyfishtë ose e gabuar fshihet (marketet e merchandiserëve mbeten)
      var fshi = document.createElement('button'); fshi.type = 'button'; fshi.className = 'btn ops-btn-dyte ops-kuj-harro'; fshi.textContent = 'Fshije pikën';
      fshi.addEventListener('click', async function () {
        var po = await konfirmo('Të fshihet pika?', '"' + p.emri + '" hiqet nga harta e Stoku-t. Marketet e merchandiserëve dhe afatet e tyre s\'preken.', 'Fshije');
        if (!po) return;
        var r = await window.__stokuCloud.ekipa.fshiPiken(p.id);
        if (!r || !r.ok) { gab.textContent = 'S\'u fshi. Kontrollo internetin dhe provo sërish.'; return; }
        HT.neEditim = ''; toast('Pika u fshi.');
      });
      rr.appendChild(fshi);
    }
    rr.appendChild(anulo); rr.appendChild(ruaj);
    w.appendChild(lbl); w.appendChild(inp); w.appendChild(gab); w.appendChild(rr);
    anulo.addEventListener('click', function () { HT.neEditim = ''; htVizato(); });
    async function ruajEmrin() {
      var e = SH.emriIPastruar(inp.value);
      if (!e) { gab.textContent = 'Shkruaj emrin e pikës.'; inp.focus(); return; }
      if (e === p.emri) { HT.neEditim = ''; htVizato(); return; }
      if (p.imi) {
        if (MK.ekzistonEmri(marketet, e, p.id)) { gab.textContent = 'Ke tashmë një market me këtë emër.'; inp.focus(); return; }
        var mi = MK.sipasId(marketet, p.id), px = pikaEMarketit(mi);
        if (px && !MK.mundTaRiemertoje(px, uidIm())) { gab.textContent = tekstiPikesSeHuaj(px); return; }
        marketet = marketet.map(function (x) { return x.id === p.id ? Object.assign({}, x, { emri: e, ndryshuarSe: Date.now() }) : x; });
        p.emri = e; HT.neEditim = '';
        ruajMarketet(false);
        if (px) window.__stokuCloud.ekipa.ndryshoPiken(px.id, { emri: e });
        htVizato(); toast('Emri u ndryshua.');
        return;
      }
      var cl = window.__stokuCloud;
      if (!cl || !cl.ekipa || !cl.ekipa.ndryshoPiken) { gab.textContent = 'Emri s\'u ndryshua. Kontrollo internetin dhe provo sërish.'; return; }
      ruaj.disabled = anulo.disabled = true; gab.textContent = '';
      var r = await cl.ekipa.ndryshoPiken(p.id, { emri: e }, true);
      ruaj.disabled = anulo.disabled = false;
      if (!r || !r.ok) { gab.textContent = 'Emri s\'u ndryshua. Kontrollo internetin dhe provo sërish.'; return; }
      p.emri = e; HT.neEditim = '';
      htVizato(); toast('Emri u ndryshua. Merchandiserët e shohin emrin e ri.', 3500);
    }
    ruaj.addEventListener('click', ruajEmrin);
    inp.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); ruajEmrin(); } });
    return w;
  }
  function htHarta() {
    var el = $('htHarta');
    if (HT.inst) { HT.inst.tema(htTema()); setTimeout(function () { if (HT.inst) HT.inst.madhesia(); }, 60); return; }
    if (HT.dukeHapur || !SH) return;
    HT.dukeHapur = true;
    $('htGabim').hidden = true; el.hidden = false;
    SH.krijo(el, { tema: htTema(), pikat: HT.pikat || [], kurSkaPllaka: function () { $('htGabim').hidden = false; $('htProvo').hidden = true; $('htGabimTekst').textContent = 'Pjesët e hartës s\'u morën (rrugët dhe emrat e vendeve). Kontrollo internetin; pikat dalin edhe ashtu.'; },
      kurSkaSatelit: function () { toast('Pamja satelitore s\'u hap. Kontrollo internetin dhe provo sërish.', 5000); },
      kurKlikon: function (k) { htZgjidh(k, false); } }).then(function (inst) {
      HT.dukeHapur = false; HT.inst = inst;
      if (HT.pikat) { HT.pershtatur = true; inst.vendos(HT.pikat); inst.pershtat(HT.pikat); }
    }, function (e) {
      HT.dukeHapur = false;
      el.hidden = true; $('htGabim').hidden = false;
      $('htGabimTekst').textContent = e && e.message === 'webgl' ? 'Ky telefon s\'e shfaq dot hartën. Lista e pikave është më poshtë.'
        : 'Harta s\'u hap. Kontrollo internetin dhe provo sërish.';
      $('htProvo').hidden = !!(e && e.message === 'webgl');
    });
  }
  $('htProvo').addEventListener('click', function () { htHarta(); });
  // Marketi për afatet e reja (importi, fotografimi i fletës): aktivi, ose pyetet kur shihen krejt marketet
  async function marketiPerTeReja() {
    if (!kaMarkete()) return null;
    var id = idMarketitAktiv();
    if (id) return id;
    return zgjidhMarketin('te-reja');
  }
  function meMarket(lista, id) { return id ? lista.map(function (a) { return Object.assign({}, a, { m: id }); }) : lista; }

  // ---- Cilësimet → Marketet ----
  var mkNeEditim = null;
  function ruajMarketet(afatetNdryshuan) {
    ruajMarketetLokalisht();
    if (afatetNdryshuan) ruajAfatet(); else { __versioniLokal++; planifikoSinkronizimin(); }
    rifreskoMarketet();
  }
  function vizatoMarketetNeCilesime() {
    var c = $('mkLista'); c.textContent = '';
    $('mkGabim').textContent = '';
    var id = idMarketitAktiv();
    $('mkAktivKarta').hidden = !marketet.length;
    $('mkAktivTitull').textContent = id ? 'Je te: ' + emriMarketit(id) : 'Krejt marketet';
    $('mkAktivNen').textContent = !MK.kaPika(marketet) ? 'Asnjë market s\'ka ende vendndodhje: ruaje kur je brenda marketit.'
      : marketiAktiv.menyra === 'dore' && id ? 'E zgjodhe me dorë. GPS-i e ndërron vetë pas disa orësh.' : 'Me GPS, sa herë hap Stoku-n.';
    $('mkGjejGps').hidden = !MK.kaPika(marketet);
    $('mkListaTitull').hidden = !marketet.length;
    MK.rendit(marketet).forEach(function (m) {
      if (mkNeEditim === m.id) { c.appendChild(rreshtIEditimitTeMarketit(m)); return; }
      var b = document.createElement('button'); b.type = 'button'; b.className = 'ops-furn-rresht';
      var ik = document.createElement('span'); ik.className = 'kat-ikona-badge ' + (MK.kaVend(m) ? 'ngj-gjelber' : 'ngj-gri') + ' ops-furn-ik'; ik.textContent = (m.emri.charAt(0) || '?').toUpperCase();
      var t = document.createElement('span'); t.className = 'ops-rresht__tekst';
      var e = document.createElement('span'); e.className = 'ops-furn-emri'; e.textContent = m.emri + (m.id === id ? ' · je këtu' : '');
      var n = document.createElement('span'); n.className = 'hint';
      var nA = afatetAktiveTeMarketi(m.id);
      n.textContent = (MK.kaVend(m) ? 'Vendndodhja e ruajtur' : 'Pa vendndodhje') + ' · ' + (nA === 1 ? '1 afat' : nA + ' afate');
      t.appendChild(e); t.appendChild(n);
      b.appendChild(ik); b.appendChild(t); b.appendChild(lapsi());
      b.setAttribute('aria-label', 'Ndrysho marketin ' + m.emri);
      b.addEventListener('click', function () { mkNeEditim = m.id; vizatoMarketetNeCilesime(); });
      c.appendChild(b);
    });
    if (!marketet.length) { var bo = document.createElement('div'); bo.className = 'ops-furn-bosh'; bo.textContent = 'S\'ke ende asnjë market. Shto të parin më poshtë.'; c.appendChild(bo); }
  }
  function rreshtIEditimitTeMarketit(m) {
    var w = document.createElement('div'); w.className = 'ops-furn-edit';
    var lbl = document.createElement('div'); lbl.className = 'hint'; lbl.textContent = 'Emri i marketit';
    var inp = document.createElement('input'); inp.type = 'text'; inp.value = m.emri; inp.maxLength = MK.EMRI_MAKS;
    inp.setAttribute('autocomplete', 'off'); inp.setAttribute('spellcheck', 'false'); inp.setAttribute('aria-label', 'Emri i marketit');
    var gab = document.createElement('div'); gab.className = 'hint ops-furn-gabim';
    var vend = document.createElement('button'); vend.type = 'button'; vend.className = 'btn ops-btn-dyte';
    vend.textContent = MK.kaVend(m) ? 'Ruaj sërish vendndodhjen këtu' : 'Ruaj vendndodhjen këtu';
    var rr = document.createElement('div'); rr.className = 'ops-furn-veprime';
    var fshi = document.createElement('button'); fshi.type = 'button'; fshi.className = 'btn ops-btn-dyte ops-kuj-harro'; fshi.textContent = 'Fshije';
    var anulo = document.createElement('button'); anulo.type = 'button'; anulo.className = 'btn ops-btn-dyte'; anulo.textContent = 'Anulo';
    var ruaj = document.createElement('button'); ruaj.type = 'button'; ruaj.className = 'btn'; ruaj.textContent = 'Ruaj';
    rr.appendChild(fshi); rr.appendChild(anulo); rr.appendChild(ruaj);
    w.appendChild(lbl); w.appendChild(inp); w.appendChild(gab); w.appendChild(vend); w.appendChild(rr);
    anulo.addEventListener('click', function () { mkNeEditim = null; vizatoMarketetNeCilesime(); });
    function ruajEmrin() {
      var e = inp.value.trim().replace(/\s+/g, ' ');
      if (!e) { gab.textContent = 'Shkruaj emrin e marketit.'; inp.focus(); return; }
      if (MK.ekzistonEmri(marketet, e, m.id)) { gab.textContent = 'Ke tashmë një market me këtë emër.'; inp.focus(); return; }
      if (e !== m.emri) {
        var px = pikaEMarketit(m);
        if (px && !MK.mundTaRiemertoje(px, uidIm())) { gab.textContent = tekstiPikesSeHuaj(px); return; }
        marketet = marketet.map(function (x) { return x.id === m.id ? Object.assign({}, x, { emri: e.slice(0, MK.EMRI_MAKS), ndryshuarSe: Date.now() }) : x; });
        ruajMarketet(false);
        if (px) window.__stokuCloud.ekipa.ndryshoPiken(px.id, { emri: e });
      }
      mkNeEditim = null; vizatoMarketetNeCilesime();
    }
    ruaj.addEventListener('click', ruajEmrin);
    inp.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); ruajEmrin(); } });
    vend.addEventListener('click', function () {
      vend.disabled = true; vend.textContent = 'Duke e gjetur vendndodhjen…';
      mkNeEditim = m.id;
      ruajVendinEMarketit(m.id, function (e, s) {
        vend.disabled = false;
        if (e) { vend.textContent = 'Ruaj vendndodhjen këtu'; gab.textContent = MK.tekstiGabimit(e); return; }
        mkNeEditim = null;
        vizatoMarketetNeCilesime();
        toast('U ruajt vendndodhja e ' + m.emri + (s > 100 ? '. GPS-i ishte i dobët (rreth ' + s + ' m): provoje sërish pranë hyrjes, për më saktësi.' : '.'), s > 100 ? 6000 : 3000);
      });
    });
    fshi.addEventListener('click', async function () {
      var nA = afatet.filter(function (a) { return a.m === m.id; }).length;
      var po = await konfirmo('Të fshihet marketi?', '"' + m.emri + '" hiqet nga marketet e tua.' + (nA ? ' Afatet e tij (' + nA + ') s\'fshihen: mbeten te "Krejt marketet", pa market.' : ''), 'Fshije');
      if (!po) return;
      marketet = marketet.filter(function (x) { return x.id !== m.id; });
      fshira.marketet = fshira.marketet || {}; fshira.marketet[m.id] = Date.now(); ruajFshiraet();
      if (marketiAktiv.id === m.id) marketiAktiv = MK.ruajAktivin({ id: null, menyra: 'gps', koha: Date.now(), kontrolluarSe: 0 });
      mkNeEditim = null;
      ruajMarketet(false);
      toast('"' + m.emri + '" u fshi.');
    });
    setTimeout(function () { inp.focus(); }, 0);
    return w;
  }
  function shtoMarketin() {
    var r = shtoMarketERi($('mkEmriRi').value);
    if (typeof r === 'string') { $('mkGabim').textContent = r; $('mkEmriRi').focus(); return; }
    $('mkEmriRi').value = '';
    var m = r.marketi, nZhvendosur = r.n;
    toast('"' + m.emri + '" u shtua' + (nZhvendosur ? '. Afatet e deritashme (' + nZhvendosur + ') u vendosën te ky market.' : '. Kur je brenda tij, prek atë dhe "Ruaj vendndodhjen këtu".'), 5000);
  }
  $('mkShto').addEventListener('click', shtoMarketin);
  $('mkEmriRi').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); shtoMarketin(); } });
  $('mkZgjidh').addEventListener('click', hapZgjedhjenEMarketit);
  $('mkGjejGps').addEventListener('click', function () { kontrolloGps(true); });

  function rifreskoAfatet() {
    kontrolloNjoftimet();
    rifreskoShenjen();
    if ($('dlgAfatet').classList.contains('hapur')) renderAfatet();
    if ($('dlgEkipi').classList.contains('hapur') && typeof kurNdryshonEkipa === 'function') kurNdryshonEkipa('dyqanet');
  }

  // Afatet sipas filtrit të statusit, kërkimit dhe muajit (muaji: undefined = ai i zgjedhur, '' = krejt)
  function afatetEFiltruara(muaji) {
    var k = $('afKerko').value.trim().toLowerCase();
    var mu = muaji === undefined ? afMuaji : muaji;
    return afatetEMarketit().filter(function (a) {
      if (mu && AF.celesiMuajit(a) !== mu) return false;
      var st = AF.statusi(a);
      if (afFiltri === 'aktive' && st === 'hequr') return false;
      if (afFiltri === 'skaduar' && st !== 'skaduar' && st !== 'pa-date') return false;
      if (afFiltri === 'afer' && st !== 'afer') return false;
      if (afFiltri === 'ok' && st !== 'ok') return false;
      if (afFiltri === 'hequr' && st !== 'hequr') return false;
      if (k) {
        var t = ((a.emri || '') + ' ' + (a.barkodi || '') + ' ' + (a.furnizuesi || '')).toLowerCase();
        if (t.indexOf(k) === -1) return false;
      }
      return true;
    }).sort(AF.krahaso);
  }
  function vizatoMuajtEAfateve() {
    var c = $('afMuajt');
    var muajt = AF.muajtELista(afatetEFiltruara(''));
    if (afMuaji && !muajt.some(function (m) { return m.celes === afMuaji; })) muajt.push({ celes: afMuaji, n: 0, emri: AF.emriMuajit(afMuaji) });
    c.hidden = muajt.length < 2 && !afMuaji;
    c.textContent = '';
    [{ celes: '', emri: 'Të gjithë muajt', n: null }].concat(muajt).forEach(function (m) {
      var b = document.createElement('button'); b.type = 'button';
      if (afMuaji === m.celes) b.className = 'aktiv';
      b.setAttribute('aria-pressed', String(afMuaji === m.celes));
      b.textContent = m.emri;
      if (m.n !== null) { var n = document.createElement('span'); n.className = 'n'; n.textContent = String(m.n); b.appendChild(n); }
      b.addEventListener('click', function () { afMuaji = m.celes; renderAfatet(); });
      c.appendChild(b);
    });
  }

  var MUAJT_PLOTE = ['Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor', 'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'];
  function renderAfatet() {
    var n = AF.numero(afatetEMarketit());
    var numrat = { aktive: n.aktive, skaduar: n.skaduar + n['pa-date'], afer: n.afer, ok: n.ok, hequr: n.hequr };
    Array.prototype.forEach.call(document.querySelectorAll('#afFiltrat button'), function (b) {
      var f = b.getAttribute('data-f');
      b.classList.toggle('aktiv', f === afFiltri);
      var c = b.querySelector('.sb-chip__count');
      if (c) c.textContent = numrat[f] ? String(numrat[f]) : '';
    });
    var dSot = new Date();
    $('afMuaji').textContent = MUAJT_PLOTE[dSot.getMonth()] + ' ' + dSot.getFullYear();

    var k = $('afKerko').value.trim().toLowerCase();
    vizatoMuajtEAfateve();
    var lista = afatetEFiltruara();

    var cont = $('afLista');
    cont.textContent = '';
    if (!lista.length) {
      var b0 = document.createElement('div');
      b0.className = 'af-bosh';
      if (!afatetEMarketit().length) {
        if (idMarketitAktiv()) { b0.innerHTML = '<b>S\'ka ende afate te ky market</b>'; b0.appendChild(document.createTextNode('Fotografo fletën ose shtoji me "+ Shto": ruhen te ' + emriMarketit(idMarketitAktiv()) + '.')); }
        else b0.innerHTML = '<b>S\'ka ende asnjë afat</b>Fotografo fletën ku janë shkruar afatet, ose shtoji me "+ Shto".';
      }
      else if (k) b0.innerHTML = '<b>Asgjë s\'u gjet</b>Provo një kërkim tjetër.';
      else b0.innerHTML = { skaduar: '<b>Asnjë produkt i skaduar</b>Shumë mirë!', afer: '<b>Asnjë produkt afër skadimit</b>Asgjë nuk skadon brenda 30 ditëve.',
        ok: '<b>Asnjë</b>', hequr: '<b>Asnjë produkt i hequr ende</b>', aktive: '<b>Asnjë afat aktiv</b>' }[afFiltri] || '';
      cont.appendChild(b0);
      dilNgaZgjedhja();
      return;
    }
    var frag = document.createDocumentFragment();
    // Te "Afër skadimit": grupim sipas furnizuesit
    function sipasFurnizuesit(l, nen) {
      var grupet = {};
      l.forEach(function (a) { var f = a.furnizuesi || ''; (grupet[f] = grupet[f] || []).push(a); });
      Object.keys(grupet).sort(function (a, b) { return !a ? 1 : !b ? -1 : a.localeCompare(b, 'sq'); }).forEach(function (f) {
        var h = document.createElement('div');
        h.className = 'af-grup-krye' + (nen ? ' af-grup-krye--nen' : '');
        var s = document.createElement('span');
        s.textContent = (f || 'Pa furnizues') + ' · ' + grupet[f].length;
        h.appendChild(s);
        frag.appendChild(h);
        grupet[f].forEach(function (a) { frag.appendChild(kartaEAfatit(a)); });
      });
    }
    if (kaMarkete() && !idMarketitAktiv()) {
      // v248: merchandiseri te "Krejt marketet": afatet s'përzihen, secili market me afatet e veta
      MK.grupo(lista, marketet).forEach(function (gr) {
        var h = document.createElement('div');
        h.className = 'af-grup-krye af-grup-market';
        h.innerHTML = IKONA_MARKETI;
        var s = document.createElement('span');
        s.textContent = (gr.id ? gr.emri : 'Pa market') + ' · ' + gr.afatet.length;
        h.appendChild(s);
        frag.appendChild(h);
        if (afFiltri === 'afer') sipasFurnizuesit(gr.afatet, true);
        else gr.afatet.forEach(function (a) { frag.appendChild(kartaEAfatit(a)); });
      });
    } else if (afFiltri === 'afer') {
      sipasFurnizuesit(lista, false);
    } else {
      lista.forEach(function (a) { frag.appendChild(kartaEAfatit(a)); });
    }
    cont.appendChild(frag);
    if (afZgjedhja) {
      var shihen = {};
      lista.forEach(function (a) { shihen[a.id] = true; });
      Object.keys(afZgjedhja).forEach(function (id) { if (!shihen[id]) delete afZgjedhja[id]; });
    }
    rifreskoZgjedhjen();
  }

  var IKONA_MARKETI = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>';
  var IKONAT_AF = (function () {
    function s(d, w) { return '<svg width="' + (w || 15) + '" height="' + (w || 15) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; }
    return {
      kontroll: s('<path d="M20 6 9 17l-5-5"></path>'),
      rikthe: s('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path>'),
      x: s('<path d="M18 6 6 18M6 6l12 12"></path>'),
      zgjedhur: s('<path d="M20 6 9 17l-5-5"></path>', 14)
    };
  })();

  // ---------- Zgjedhja e shumëfishtë (mbaj gishtin → zgjidh; pastaj prek të tjerat) ----------
  var afZgjedhja = null;       // null = jashtë zgjedhjes; përndryshe { id: true }
  var afKlikuInjoro = false;   // pas shtypjes së gjatë, "click"-u i po asaj prekjeje shpërfillet
  document.addEventListener('pointerdown', function () { afKlikuInjoro = false; }, true); // prekje e re → vlen
  function zgjidhAfatin(id) {
    if (!afZgjedhja) afZgjedhja = {};
    if (afZgjedhja[id]) delete afZgjedhja[id]; else afZgjedhja[id] = true;
    rifreskoZgjedhjen();
  }
  function rifreskoZgjedhjen() {
    var n = afZgjedhja ? Object.keys(afZgjedhja).length : 0;
    if (afZgjedhja && !n) afZgjedhja = null; // u hoq edhe e fundit → del nga zgjedhja
    $('dlgAfatet').classList.toggle('zgjedhje', !!afZgjedhja);
    $('afZgjNumri').textContent = n === 1 ? '1 e zgjedhur' : n + ' të zgjedhura';
    Array.prototype.forEach.call(document.querySelectorAll('#afLista .af-karta'), function (k) {
      var po = !!(afZgjedhja && afZgjedhja[k.getAttribute('data-id')]);
      k.classList.toggle('zgjedhur', po);
      k.setAttribute('aria-selected', po ? 'true' : 'false');
    });
  }
  function dilNgaZgjedhja() { afZgjedhja = null; rifreskoZgjedhjen(); }
  async function fshijTeZgjedhurat() {
    var ids = Object.keys(afZgjedhja || {});
    if (!ids.length || !leja('afatetFshi')) return;
    var po = await konfirmo(ids.length === 1 ? 'Të fshihet 1 afat?' : 'Të fshihen ' + ids.length + ' afate?',
      'Fshihen nga të gjitha pajisjet. Nëse produktet thjesht u hoqën nga rafti, përdor "U hoq nga rafti" (mbeten si histori).', T('fshij'));
    if (!po) return;
    var hiq = {};
    ids.forEach(function (id) { hiq[id] = true; shenoAfatinEFshire(id, true); });
    ruajFshiraet();
    afatet = afatet.filter(function (x) { return !hiq[x.id]; });
    afZgjedhja = null;
    ruajAfatet();
    rifreskoZgjedhjen();
    toast(ids.length === 1 ? 'U fshi 1 afat.' : 'U fshinë ' + ids.length + ' afate.');
  }
  $('afZgjAnulo').addEventListener('click', dilNgaZgjedhja);
  $('afZgjFshij').addEventListener('click', fshijTeZgjedhurat);

  // Excel vetëm me afatet e zgjedhura: së pari pyetet përdoruesi cilat kolona t'i përfshijë
  // (zgjedhja mbahet mend për herën tjetër). Në telefon hapet menuja "Shpërndaj", përndryshe shkarkohet.
  var AF_ST_EMRI = { skaduar: 'Ka skaduar', 'pa-date': 'Pa datë', afer: 'Afër skadimit', ok: 'Në rregull', hequr: 'I hequr' };
  var AX_KOLONAT = [
    { k: 'barkodi', emri: 'Barkodi', col: { title: 'Barkodi', width: 18 }, v: function (a) { return a.barkodi || ''; } },
    { k: 'emri', emri: 'Emri i produktit', col: { title: 'Emri i produktit', width: 36 }, v: function (a) { return a.emri || ''; } },
    { k: 'sasia', emri: 'Sasia (copë)', col: { title: 'Sasia (copë)', width: 12, type: 'number' }, v: function (a) { return typeof a.sasia === 'number' ? a.sasia : ''; } },
    { k: 'data', emri: 'Data e skadimit', col: { title: 'Skadon më', width: 13, type: 'day' }, v: function (a) { return a.data || ''; } },
    { k: 'ditet', emri: 'Ditë të mbetura', col: { title: 'Ditë të mbetura', width: 14, type: 'number' }, v: function (a) { var n = AF.ditetDeri(a.data); return AF.statusi(a) === 'hequr' || n === null ? '' : n; } },
    { k: 'furnizuesi', emri: 'Furnizuesi', col: { title: 'Furnizuesi', width: 22 }, v: function (a) { return a.furnizuesi || ''; } },
    { k: 'statusi', emri: 'Statusi', col: { title: 'Statusi', width: 15 }, v: function (a) { return AF_ST_EMRI[AF.statusi(a)] || ''; } },
    { k: 'pershkrimi', emri: 'Çfarë duhet bërë', col: { title: 'Çfarë duhet bërë', width: 60 }, v: function (a) { return AF.pershkrimi(a); } },
    { k: 'krijuarNga', emri: 'Shtuar nga', col: { title: 'Shtuar nga', width: 14 }, v: function (a) { return a.krijuarNga || ''; } }
  ];
  var KEY_AX_KOLONAT = 'stoku:afatet:excel-kolonat';
  function axKolonatERuajtura() {
    try {
      var r = JSON.parse(localStorage.getItem(KEY_AX_KOLONAT) || 'null');
      if (Array.isArray(r) && r.length) return r;
    } catch (e) { /* ok */ }
    return AX_KOLONAT.map(function (c) { return c.k; });
  }
  function axVendos(kyçet) {
    Array.prototype.forEach.call(document.querySelectorAll('#axLista input'), function (i) { i.checked = kyçet.indexOf(i.value) >= 0; });
    axRifresko();
  }
  function axTeZgjedhurat() {
    return Array.prototype.filter.call(document.querySelectorAll('#axLista input'), function (i) { return i.checked; })
      .map(function (i) { return i.value; });
  }
  function axRifresko() {
    var n = axTeZgjedhurat().length;
    $('axEksporto').disabled = !n || (typeof axKrejt !== 'undefined' && axKrejt && !axAfatetEKrejt().length);
    $('axGabim').textContent = n ? '' : 'Zgjidh të paktën një kolonë.';
  }
  (function ndertoListenAx() {
    var lista = $('axLista');
    AX_KOLONAT.forEach(function (c) {
      var l = document.createElement('label'); l.className = 'ax-rresht';
      var i = document.createElement('input'); i.type = 'checkbox'; i.value = c.k;
      i.addEventListener('change', axRifresko);
      var t = document.createElement('span'); t.textContent = c.emri;
      l.appendChild(i); l.appendChild(t); lista.appendChild(l);
    });
  })();
  var axKrejt = false; // true = eksport i krejt listës (me zgjedhjen e muajit), false = vetëm të zgjedhurat
  function hapExcelinEAfateve() {
    var n = Object.keys(afZgjedhja || {}).length;
    if (!n || !leja('eksportExcel')) return;
    axKrejt = false;
    $('axMuajiRresht').hidden = true;
    $('axFurnRresht').hidden = true;
    $('axNen').textContent = n === 1 ? '1 afat i zgjedhur' : n + ' afate të zgjedhura';
    axVendos(axKolonatERuajtura());
    $('dlgAfExcel').classList.add('hapur');
  }
  function hapEksportinEAfateve() {
    if (!leja('eksportExcel')) return;
    if (!afatetEMarketit().length) { toast('S\'ka afate për eksport.'); return; }
    axKrejt = true;
    var s = $('axMuaji');
    s.textContent = '';
    var o0 = document.createElement('option'); o0.value = ''; o0.textContent = 'Të gjithë muajt'; s.appendChild(o0);
    AF.muajtELista(afatetEFiltruara('')).forEach(function (m) { var o = document.createElement('option'); o.value = m.celes; o.textContent = m.emri + ' (' + m.n + ')'; s.appendChild(o); });
    s.value = afMuaji && Array.prototype.some.call(s.options, function (o) { return o.value === afMuaji; }) ? afMuaji : '';
    $('axMuajiRresht').hidden = false;
    $('axFurn').value = '';
    axMbushFurnizuesit();
    axInfoKrejt();
    axVendos(axKolonatERuajtura());
    $('dlgAfExcel').classList.add('hapur');
  }
  // Furnizuesit e muajit të zgjedhur (zgjedhja ruhet nëse furnizuesi ka ende afate atë muaj)
  function axMbushFurnizuesit() {
    var s = $('axFurn'), para = s.value;
    var lista = AF.furnizuesitELista(afatetEFiltruara($('axMuaji').value));
    s.textContent = '';
    var o0 = document.createElement('option'); o0.value = ''; o0.textContent = 'Të gjithë furnizuesit'; s.appendChild(o0);
    lista.forEach(function (f) { var o = document.createElement('option'); o.value = f.celes; o.textContent = f.emri + ' (' + f.n + ')'; s.appendChild(o); });
    s.value = lista.some(function (f) { return f.celes === para; }) ? para : '';
    // Me vetëm një furnizues (ose asnjë) zgjedhja s'ka kuptim
    $('axFurnRresht').hidden = lista.length < 2;
  }
  function axAfatetEKrejt() {
    var f = $('axFurn').value;
    return afatetEFiltruara($('axMuaji').value).filter(function (a) { return !f || AF.celesiFurnizuesit(a) === f; });
  }
  function axEmriFurnizuesit() {
    var s = $('axFurn'), o = s.options[s.selectedIndex];
    return s.value && o ? o.textContent.replace(/\s*\(\d+\)$/, '') : '';
  }
  function axInfoKrejt() {
    var n = axAfatetEKrejt().length;
    var st = { aktive: 'aktive', skaduar: 'të skaduara', afer: 'afër skadimit', ok: 'në rregull', hequr: 'të hequra' }[afFiltri] || '';
    var fe = axEmriFurnizuesit();
    $('axNen').textContent = n ? 'Do të eksportohen ' + (n === 1 ? '1 afat' : n + ' afate') + (afFiltri !== 'aktive' ? ' (' + st + ')' : '') + (fe ? ' të furnizuesit ' + fe : '') : 'S\'ka afate ' + st + ' për këtë zgjedhje';
    $('axEksporto').disabled = !n || !axTeZgjedhurat().length;
  }
  $('axMuaji').addEventListener('change', function () { axMbushFurnizuesit(); axInfoKrejt(); });
  $('axFurn').addEventListener('change', axInfoKrejt);
  $('afEksporto').addEventListener('click', hapEksportinEAfateve);
  // Butoni "Excel" te Afatet: menu me Importo / Eksporto
  (function () {
    var b = $('afExcel'), menu = $('afExcelMenu');
    function mbyll() { menu.hidden = true; b.setAttribute('aria-expanded', 'false'); }
    b.addEventListener('click', function (ev) {
      ev.stopPropagation();
      menu.hidden = !menu.hidden;
      b.setAttribute('aria-expanded', menu.hidden ? 'false' : 'true');
    });
    $('afImporto').addEventListener('click', mbyll);
    $('afEksporto').addEventListener('click', mbyll);
    document.addEventListener('click', function (ev) { if (!menu.hidden && !menu.parentNode.contains(ev.target)) mbyll(); });
  })();
  function mbyllExcelinEAfateve() { $('dlgAfExcel').classList.remove('hapur'); }
  async function eksportoTeZgjedhurat() {
    var kyçet = axTeZgjedhurat();
    if (!kyçet.length) { axRifresko(); return; }
    try { localStorage.setItem(KEY_AX_KOLONAT, JSON.stringify(kyçet)); } catch (e) { /* ok */ }
    var kolonat = AX_KOLONAT.filter(function (c) { return kyçet.indexOf(c.k) >= 0; });
    var zgj = afZgjedhja || {};
    var muajiEks = axKrejt ? $('axMuaji').value : '';
    var furnEks = axKrejt ? axEmriFurnizuesit() : '';
    var lista = axKrejt ? axAfatetEKrejt() : afatet.filter(function (a) { return zgj[a.id]; }).sort(AF.krahaso);
    mbyllExcelinEAfateve();
    if (!lista.length) return;
    var rreshtat = lista.map(function (a) { return kolonat.map(function (c) { return c.v(a); }); });
    var fleta = { name: furnEks || (muajiEks ? AF.emriMuajit(muajiEks) : 'Afatet'), columns: kolonat.map(function (c) { return c.col; }), rows: rreshtat };
    var iSasise = kyçet.indexOf('sasia') >= 0 ? kolonat.findIndex(function (c) { return c.k === 'sasia'; }) : -1;
    if (iSasise >= 0) {
      fleta.totalColumns = [iSasise];
      if (iSasise > 0) fleta.totalLabel = 'Gjithsej';
    }
    var d = new Date();
    var pjeseEmri = function (t) { return t.toLowerCase().replace(/ë/g, 'e').replace(/ç/g, 'c').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40); };
    var emri = 'afatet_' + (furnEks && pjeseEmri(furnEks) ? pjeseEmri(furnEks) + '_' : '') + (muajiEks ? pjeseEmri(AF.emriMuajit(muajiEks)) + '_' : '') + d.getFullYear() + '-' + dyShifra(d.getMonth() + 1) + '-' + dyShifra(d.getDate()) +
      '_' + dyShifra(d.getHours()) + dyShifra(d.getMinutes()) + '.xlsx';
    var bajtet = StokuXlsx.buildWorkbook([fleta]);
    await ndajOseShkarko({ skedari: new File([bajtet], emri, { type: MIME_XLSX }), emri: emri }, 'Afatet');
  }
  $('afZgjExcel').addEventListener('click', hapExcelinEAfateve);

  // ---------- Importi i afateve nga Excel/CSV ----------
  // Çdo fletë lexohet; fleta me emër muaji ("Nëntor", "Nëntor2"…) e jep muajin kur data ka vetëm ditën.
  // Afatet që ekzistojnë (i njëjti barkod/emër + data) kalohen; rreshtat e përsëritur bashkohen (sasitë mblidhen).
  var ai = { fletet: [] };
  function lexoCsvTel(tekst) {
    tekst = tekst.replace(/^\uFEFF/, '');
    var r0 = tekst.split(/\r?\n/)[0] || '';
    var nd = [';', ',', '\t'].reduce(function (m, d) { return r0.split(d).length > r0.split(m).length ? d : m; }, ',');
    var rr = [], r = [], f = '', q = false;
    for (var i = 0; i < tekst.length; i++) {
      var c = tekst[i];
      if (q) { if (c === '"') { if (tekst[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
      else if (c === '"') q = true;
      else if (c === nd) { r.push(f); f = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && tekst[i + 1] === '\n') i++; r.push(f); rr.push(r); r = []; f = ''; }
      else f += c;
    }
    if (f !== '' || r.length) { r.push(f); rr.push(r); }
    return rr.filter(function (x) { return x.some(function (v) { return String(v).trim() !== ''; }); });
  }
  function aiHap() {
    if (!leja('afatetImporto')) return;
    ai = { fletet: [] };
    $('aiHapi1').hidden = false; $('aiHapi2').hidden = true; $('aiMbrapa').hidden = true;
    $('aiBtn').disabled = true; $('aiBtn').textContent = 'Importo'; $('aiGabim1').textContent = ''; $('aiSkedari').value = '';
    $('dlgAfImport').classList.add('hapur');
  }
  function aiMbyll() { $('dlgAfImport').classList.remove('hapur'); }
  async function aiLexo(f) {
    $('aiGabim1').textContent = '';
    try {
      var buf = await f.arrayBuffer(), b = new Uint8Array(buf);
      if (b[0] === 0x50 && b[1] === 0x4b) ai.fletet = (await StokuXlsx.read(buf)).map(function (sh) { return { name: sh.name, rows: sh.rows.filter(function (x) { return x.some(function (v) { return String(v).trim() !== ''; }); }) }; });
      else if (/\.xls$/i.test(f.name)) { $('aiGabim1').textContent = 'Formati i vjetër .xls s\'mbështetet. Ruaje si .xlsx ose .csv.'; return; }
      else {
        var tekst; try { tekst = new TextDecoder('utf-8', { fatal: true }).decode(b); } catch (e) { tekst = new TextDecoder('windows-1252').decode(b); }
        ai.fletet = [{ name: f.name.replace(/\.[^.]+$/, ''), rows: lexoCsvTel(tekst) }];
      }
    } catch (e) { $('aiGabim1').textContent = 'Skedari s\'u lexua. Sigurohu që është .xlsx ose .csv.'; return; }
    ai.fletet = ai.fletet.filter(function (sh) { return sh.rows.length; });
    if (!ai.fletet.length) { $('aiGabim1').textContent = 'Skedari është bosh.'; return; }
    var sel = $('aiFleta');
    sel.textContent = '';
    if (ai.fletet.length > 1) { var oK = document.createElement('option'); oK.value = 'krejt'; oK.textContent = 'Të gjitha fletët (' + ai.fletet.length + ')'; sel.appendChild(oK); }
    ai.fletet.forEach(function (sh, i) {
      var m = AF.muajiNgaEmri(sh.name);
      var o = document.createElement('option'); o.value = String(i); o.textContent = sh.name + (m ? ' → ' + AF.EMRAT_MUAJVE[m - 1] : '') + ' (' + sh.rows.length + ')'; sel.appendChild(o);
    });
    sel.value = ai.fletet.length > 1 ? 'krejt' : '0';
    $('aiFletaMbajtese').hidden = ai.fletet.length < 2;
    $('aiSkedariInfo').textContent = f.name;
    var r0 = ai.fletet[0].rows[0] || [];
    $('aiKoka').value = r0.some(function (v) { return !!AF.dataNgaQeliza(v); }) ? '0' : '1';
    $('aiHapi1').hidden = true; $('aiHapi2').hidden = false; $('aiMbrapa').hidden = false;
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
      var o0 = document.createElement('option'); o0.value = '-1'; o0.textContent = '(asnjë)'; s.appendChild(o0);
      titujt.forEach(function (t, j) { var o = document.createElement('option'); o.value = String(j); o.textContent = t; s.appendChild(o); });
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
    [['Të reja', plan.teRinj], ['Ekzistojnë', plan.ekzistojne], ['Bashkohen', plan.bashkuar], ['Me gabim', plan.gabime]].forEach(function (x) {
      if (!x[1] && x[0] !== 'Të reja') return;
      var sp = document.createElement('span'); sp.textContent = x[0] + ': '; var bb = document.createElement('b'); bb.textContent = String(x[1]); sp.appendChild(bb); pp.appendChild(sp);
    });
    var muajt = AF.muajtELista(plan.rreshta.filter(function (r) { return r.veprimi === 'i ri'; }));
    if (muajt.length) { var sm = document.createElement('span'); sm.textContent = muajt.map(function (m) { return m.emri + ' (' + m.n + ')'; }).join(', '); pp.appendChild(sm); }
    var l = $('aiParapamje');
    l.textContent = '';
    plan.rreshta.slice(0, 80).forEach(function (r) {
      var d = document.createElement('div'); d.className = 'ai-rr' + (r.gabim ? ' gabuar' : '');
      var m = document.createElement('div'); m.className = 'm';
      var e = document.createElement('b'); e.textContent = r.emri || r.barkodi || '(pa emër)';
      var nn = document.createElement('span'); nn.textContent = [r.data ? AF.formato(r.data) : r.dataOrigjinale, r.sasia !== '' ? r.sasia + ' copë' : '', r.furnizuesi].filter(Boolean).join(' · ');
      m.appendChild(e); m.appendChild(nn);
      var v = document.createElement('div'); v.className = 'v'; v.textContent = r.gabim || r.veprimi;
      d.appendChild(m); d.appendChild(v); l.appendChild(d);
    });
    $('aiBtn').disabled = !plan.teRinj;
    $('aiBtn').textContent = plan.teRinj ? 'Importo ' + plan.teRinj : 'Importo';
  }
  $('afImporto').addEventListener('click', aiHap);
  $('aiZgjidh').addEventListener('click', function () { $('aiSkedari').click(); });
  $('aiSkedari').addEventListener('change', function () { var f = $('aiSkedari').files[0]; if (f) aiLexo(f); });
  $('aiMbrapa').addEventListener('click', aiHap);
  $('aiAnulo').addEventListener('click', aiMbyll);
  $('dlgAfImport').addEventListener('click', function (ev) { if (ev.target === $('dlgAfImport')) aiMbyll(); });
  $('aiFleta').addEventListener('change', function () { aiPergatit(true); });
  $('aiKoka').addEventListener('change', function () { aiPergatit(true); });
  AI_FUSHAT.forEach(function (x) { $(x[1]).addEventListener('change', aiRifresko); });
  $('aiBtn').addEventListener('click', async function () {
    var teReja = AF.afatetNgaPlani(aiPlani(), { krijuarNga: emriPerdoruesitAktual() });
    if (!teReja.length) return;
    var mkId = await marketiPerTeReja(); // v241
    if (mkId === undefined) return;
    teReja = meMarket(teReja, mkId);
    afatet = afatet.concat(teReja);
    try { if (KJ()) KJ().mesoShume(teReja, 'mbishkruaj'); } catch (e) { /* ok */ } // v209: si importet e tjera (kolegët: presin kontrollin)
    aiMbyll();
    afMuaji = ''; afFiltri = 'aktive';
    ruajAfatet();
    var n = AF.numero(teReja);
    toast((teReja.length === 1 ? 'U importua 1 afat' : 'U importuan ' + teReja.length + ' afate') + (n.skaduar ? ' · ' + (n.skaduar === 1 ? '1 ka skaduar!' : n.skaduar + ' kanë skaduar!') : '') + (n.afer ? ' · ' + (n.afer === 1 ? '1 skadon' : n.afer + ' skadojnë') + ' brenda 30 ditëve' : '') + '.', 4500);
  });
  $('axKrejt').addEventListener('click', function () { axVendos(AX_KOLONAT.map(function (c) { return c.k; })); });
  $('axBaze').addEventListener('click', function () { axVendos(['barkodi', 'emri', 'sasia']); });
  $('axAnulo').addEventListener('click', mbyllExcelinEAfateve);
  $('axEksporto').addEventListener('click', eksportoTeZgjedhurat);
  $('dlgAfExcel').addEventListener('click', function (ev) { if (ev.target === $('dlgAfExcel')) mbyllExcelinEAfateve(); });
  $('afZgjTeGjitha').addEventListener('click', function () {
    var kartat = document.querySelectorAll('#afLista .af-karta');
    var teGjitha = Array.prototype.every.call(kartat, function (k) { return afZgjedhja && afZgjedhja[k.getAttribute('data-id')]; });
    afZgjedhja = {};
    if (!teGjitha) Array.prototype.forEach.call(kartat, function (k) { afZgjedhja[k.getAttribute('data-id')] = true; });
    rifreskoZgjedhjen();
  });

  // Kutia e ditëve majtas te karta e afatit (dizajni): "3 ditë më parë", "Sot skadon", "12 ditë", "4 muaj", "✓ hequr"
  function kutiaEDiteve(st, n) {
    var k = document.createElement('div');
    var madh, vogel, lloji;
    if (st === 'hequr') { madh = '✓'; vogel = 'hequr'; lloji = 'rem'; }
    else if (n === null || n === undefined) { madh = '–'; vogel = 'pa datë'; lloji = 'exp'; }
    else if (n < 0) { madh = String(-n); vogel = 'ditë më parë'; lloji = 'exp'; }
    else if (n === 0) { madh = 'Sot'; vogel = 'skadon'; lloji = 'exp'; }
    else if (n >= 60) { madh = String(Math.round(n / 30)); vogel = 'muaj'; lloji = 'ok'; }
    else { madh = String(n); vogel = 'ditë'; lloji = st === 'afer' ? 'near' : 'ok'; }
    k.className = 'sb-days sb-days--' + lloji;
    var b = document.createElement('span'); b.className = 'sb-days__big'; b.textContent = madh;
    var v = document.createElement('span'); v.className = 'sb-days__small'; v.textContent = vogel;
    k.appendChild(b); k.appendChild(v);
    return k;
  }
  // "Furnizuesi · 12 copë · 04.10.2026" (+ emri i kolegut te Grupi)
  function rreshtiIAfatit(a, kolegu) {
    return [a.mk || '', a.furnizuesi, AF.sasiaTekst(a), a.data ? AF.formato(a.data) : '', kolegu || ''].filter(Boolean).join(' · ');
  }
  function kartaEAfatit(a) {
    var st = AF.statusi(a);
    var n = AF.ditetDeri(a.data);
    var k = document.createElement('div');
    k.className = 'af-karta ' + st;
    k.setAttribute('data-id', a.id);
    var zg = document.createElement('span'); zg.className = 'af-zgjedh'; zg.innerHTML = IKONAT_AF.zgjedhur;
    k.appendChild(zg);
    k.appendChild(kutiaEDiteve(st, n));
    var m = document.createElement('div'); m.className = 'af-majtas';
    var e = document.createElement('div'); e.className = 'af-emri'; e.textContent = a.emri || a.barkodi || '(pa emër)';
    m.appendChild(e);
    // v248: merchandiseri: te çdo afat shihet marketi (pika) ku ndodhet
    if (kaMarkete()) {
      var mk = document.createElement('div'); mk.className = 'af-market'; mk.innerHTML = IKONA_MARKETI;
      var mkE = document.createElement('span'); mkE.textContent = a.m && MK.sipasId(marketet, a.m) ? emriMarketit(a.m) : 'Pa market';
      mk.appendChild(mkE); m.appendChild(mk);
    }
    var nen = rreshtiIAfatit(a);
    if (nen) { var ne = document.createElement('div'); ne.className = 'af-nen'; ne.textContent = nen; m.appendChild(ne); }
    if (a.emri && a.barkodi) { var kd = document.createElement('div'); kd.className = 'af-kodi'; kd.textContent = a.barkodi; m.appendChild(kd); }
    var ms = document.createElement('div'); ms.className = 'af-mesazh'; ms.textContent = AF.pershkrimi(a);
    m.appendChild(ms);
    // Veprimi i shpejtë sipas ngjyrës
    var pill = null;
    if (st === 'skaduar') pill = ['U hoq nga rafti', function () { shenoHequr(a); }, 'kontroll'];
    else if (st === 'hequr') pill = ['Rikthe si aktiv', function () { riktheAktiv(a); }, 'rikthe'];
    if (pill && leja('afatetNdrysho')) {
      var pb = document.createElement('button'); pb.type = 'button'; pb.className = 'af-pill';
      pb.innerHTML = IKONAT_AF[pill[2]]; pb.appendChild(document.createTextNode(pill[0]));
      pb.addEventListener('click', function (ev) { ev.stopPropagation(); pill[1](); });
      m.appendChild(pb);
    }
    k.appendChild(m);
    // Shtypje e gjatë (~0.5 s) → nis zgjedhjen; lëvizja e gishtit (scroll) e anulon
    var shtypja = null;
    function anuloShtypjen() { if (shtypja) { clearTimeout(shtypja.t); shtypja = null; } }
    k.addEventListener('pointerdown', function (ev) {
      if (ev.pointerType === 'mouse' && ev.button !== 0) return;
      anuloShtypjen();
      shtypja = { x: ev.clientX, y: ev.clientY, t: setTimeout(function () {
        shtypja = null;
        afKlikuInjoro = true;
        try { if (navigator.vibrate) navigator.vibrate(15); } catch (e) { /* ok */ }
        zgjidhAfatin(a.id);
      }, 480) };
    });
    k.addEventListener('pointermove', function (ev) {
      if (shtypja && (Math.abs(ev.clientX - shtypja.x) > 10 || Math.abs(ev.clientY - shtypja.y) > 10)) anuloShtypjen();
    });
    k.addEventListener('pointerup', anuloShtypjen);
    k.addEventListener('pointercancel', anuloShtypjen);
    k.addEventListener('pointerleave', anuloShtypjen);
    k.addEventListener('contextmenu', function (ev) { ev.preventDefault(); });
    k.addEventListener('click', function () {
      if (afKlikuInjoro) { afKlikuInjoro = false; return; }
      if (afZgjedhja) { zgjidhAfatin(a.id); return; }
      hapAfatin(a.id);
    });
    return k;
  }

  function perditesoAfatin(id, ndryshimet) {
    afatet = afatet.map(function (x) { return x.id === id ? Object.assign({}, x, ndryshimet, { ndryshuarSe: Date.now() }) : x; });
    ruajAfatet();
  }
  // Ngjarje për aktivitetin e Grupit (kush çka hoqi/lajmëroi/ktheu)
  function ekNgjarjeAfati(lloji, a, shtese) {
    var u = perdoruesiAktual();
    if (!u || typeof ekK === 'undefined' || !ekK) return;
    ekK.ngjarje(Object.assign({ lloji: lloji, pronariUid: u.uid, pronariEmri: emriPerdoruesitAktual(), afatId: a.id,
      produkti: a.emri || a.barkodi || '', barkodi: a.barkodi || '', data: a.data || '', sasia: typeof a.sasia === 'number' ? a.sasia : undefined }, shtese || {}));
  }
  function shenoHequr(a) {
    if (!leja('afatetNdrysho')) return;
    perditesoAfatin(a.id, { statusi: 'hequr', hequrSe: Date.now(), hequrNga: emriPerdoruesitAktual() });
    toast('"' + (a.emri || a.barkodi) + '" u shënua si i hequr nga rafti.');
    ekNgjarjeAfati('hequr', a);
  }
  function riktheAktiv(a) {
    if (!leja('afatetNdrysho')) return;
    perditesoAfatin(a.id, { statusi: 'aktiv', hequrSe: 0 }); ekNgjarjeAfati('rikthyer', a);
  }

  function hapAfatetFaqe() {
    if (!leja('afatet')) return;
    afFiltri = 'aktive';
    $('afKerko').value = '';
    renderAfatet();
    $('afTrup').scrollTop = 0;
    $('dlgAfatet').classList.add('hapur');
    pyetMarketinEPare(); // v242
  }
  function mbyllAfatetFaqe() {
    afZgjedhja = null;
    $('dlgAfatet').classList.remove('zgjedhje');
    $('dlgAfatet').classList.remove('hapur');
    rifreskoPamjen();
    fokusoBarkodin();
    pasMbylljesSeTabit();
  }
  // ---------- Grupi (telefon): afatet e grupit, aktiviteti, kalendari, kolegët, statistikat ----------
  // Logjika e përbashkët (Firestore, prania, kalendari, statistikat) është te ekipa.js; këtu vetëm vizatimi,
  // me pjesët e Stokut/Afateve (folder-karta, af-numer, af-karta, artikull). Vetëm afatet — jo stoku.
  // Secili ndryshon vetëm të vetat; "Unë e hoqa" te një afat i skaduar i kolegut i dërgon pronarit njoftim me
  // emrin tënd, dhe aplikacioni i tij e shënon vetë si të hequr (zbatoHeqjetEKolegeve).
  var EKL = window.StokuEkipa;
  var ekPamja = 'permbledhja';     // permbledhja | afatet | aktiviteti | kalendari | anetaret
  var __ekipiAnetari = null;       // te "afatet": null = kartat e grupit; 'krejt' ose uid = lista e atij
  var ekFiltri = null;             // null (në raft) | skaduar | afer | ok | hequr
  var ekKal = null;                // { viti, muaji, dita } — kalendari
  var EKIPI_LIMITI = 300;
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
    uidIm: function () { var u = perdoruesiAktual(); return u ? u.uid : null; },
    emriIm: emriPerdoruesitAktual,
    afatetEMia: function () { return afatet; },
    zbatoHeqjet: zbatoHeqjetEKolegeve,
    njofto: njoftoNgaEkipa,
    ndryshoi: kurNdryshonEkipa
  }) : null;

  function ekEl(tag, klasa, tekst) {
    var e = document.createElement(tag);
    if (klasa) e.className = klasa;
    if (tekst != null) e.textContent = tekst;
    return e;
  }
  function ekInfo(tekst) { return ekEl('div', 'info', tekst); }
  function ekBosh(titulli, teksti) {
    var b = ekEl('div', 'af-bosh');
    b.appendChild(ekEl('b', null, titulli));
    if (teksti) b.appendChild(document.createTextNode(teksti));
    return b;
  }
  function ekAvatar(a, meOnline) {
    var el = ekEl('span', 'ek-avatar' + (meOnline && (a.uneJam || EKL.eshteOnline(a)) ? ' online' : ''), String(a.emri || '?').charAt(0).toUpperCase());
    return EKL.Fotot.apliko(el, { uid: a.uid, emri: a.emri });
  }
  function ekOra(ts) { var d = new Date(ts); return dyShifra(d.getHours()) + ':' + dyShifra(d.getMinutes()); }
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
  function ekAnetaret() { return ekK ? ekK.anetaretMeAfate() : []; }
  function ekTeGjithaAfatet(anetaret) { var l = []; anetaret.forEach(function (a) { l = l.concat(a.afatet); }); return l; }

  function hapEkipiFaqe(pamja) {
    if (!leja('grupi')) return;
    if (pamja === 'statistika') pamja = 'permbledhja';
    if (pamja) {
      __ekipiAnetari = null; ekFiltri = null;
      ekPamja = pamja;
      ekVendosNivelin();
    }
    $('dlgEkipi').classList.add('hapur');
    $('ekipiTrup').scrollTop = 0;
    if (ekK) ekK.hap();
    vizatoEkipen();
  }
  function mbyllEkipiFaqe() {
    ekipiKthehuTeKartat(true);
    $('dlgEkipi').classList.remove('hapur');
    if (ekK) ekK.mbyll();
    rifreskoPamjen();
    fokusoBarkodin();
    pasMbylljesSeTabit();
  }
  // Faqja kryesore e Grupit ("Pulti") = pamja 'afatet' pa koleg të zgjedhur. Çdo pamje tjetër (lista e një
  // kolegu, aktiviteti, kalendari…) është një nivel më thellë: "mbrapa" kthehet te Pulti (vëzhguesi i historisë
  // e sheh klasën 'ne-anetar').
  function ekEshteShtepi() { return ekPamja === 'permbledhja'; }
  function ekVendosNivelin() { $('dlgEkipi').classList.toggle('ne-anetar', !ekEshteShtepi()); }
  function ekipiKthehuTeKartat(paVizatim) {
    if (ekEshteShtepi()) return;
    __ekipiAnetari = null; ekFiltri = null; ekPamja = 'permbledhja';
    ekVendosNivelin();
    if (!paVizatim) { $('ekipiTrup').scrollTop = 0; vizatoEkipen(); }
  }
  function ekHapAnetarin(uid, filtri) {
    ekPamja = 'afatet';
    __ekipiAnetari = uid; ekFiltri = filtri || null;
    ekVendosNivelin();
    $('ekipiTrup').scrollTop = 0;
    vizatoEkipen();
  }
  // Pllaka "Afatet": nga Pulti hap listën e krejt grupit; nga një pamje tjetër kthehet te Pulti
  function ekPllaka(p) {
    if (p === 'permbledhja') { ekipiKthehuTeKartat(); return; }
    ekZgjidhPamjen(p);
  }
  function ekZgjidhPamjen(p) {
    __ekipiAnetari = null; ekFiltri = null;
    ekPamja = p;
    ekVendosNivelin();
    $('ekipiTrup').scrollTop = 0;
    vizatoEkipen();
  }
  Array.prototype.forEach.call(document.querySelectorAll('#ekMenu button'), function (b) {
    b.addEventListener('click', function () { ekPllaka(b.getAttribute('data-n')); });
  });

  // Rivizatim kur ndryshon diçka (kolegët, aktiviteti, afatet e mia…)
  function kurNdryshonEkipa(cfare) {
    if (cfare === 'kujtesa') { // produktet e grupit u ndryshuan (nga një koleg): vetëm lista te Cilësimet → Stoku, nëse është hapur
      rifreskoStokunNeCilesime();
      return;
    }
    rifreskoShenjatEEkipes();
    if (cfare === 'dyqanet' || cfare === 'te-gjitha') planifikoMesimin(); // kujtesa nga afatet e kolegëve
    if (!$('dlgEkipi').classList.contains('hapur')) return;
    if (cfare === 'njoftimet') return;
    // Dikush po shkruan te një fushë e pamjes (fto, njoftimi për grupin, emri i grupit): rindërtimi pritet derisa ta lëshojë
    // fushën, përndryshe teksti fshihej dhe tastiera mbyllej (prania e kolegëve e ndez këtë çdo ≤ 90 s)
    if (ekFushaAktive() && document.activeElement.id !== 'ekKerko') { ekRivizatoNePritje = true; return; }
    vizatoEkipen(true);
  }
  var ekRivizatoNePritje = false;
  function ekFushaAktive() {
    var a = document.activeElement, c = $('ekipiLista');
    return !!(a && c && c.contains(a) && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && /^(text|search|number|email|tel)?$/.test(a.type || ''))));
  }
  // Tekstet e shkruara me dorë (fushat me id) rikthehen pas rindërtimit
  function ekTeShkruarat() {
    var r = {};
    Array.prototype.forEach.call($('ekipiLista').querySelectorAll('input[data-prekur][id], textarea[data-prekur][id]'), function (x) { r[x.id] = x.value; });
    return r;
  }
  function ekRiktheTeShkruarat(r) {
    Object.keys(r).forEach(function (id) { var x = $(id); if (x && x.value !== r[id]) { x.value = r[id]; x.setAttribute('data-prekur', '1'); } });
  }
  // Pas dërgimit: fusha zbrazet (edhe nëse pamja u rindërtua ndërkohë dhe fusha është tashmë një element i ri)
  function ekZbrazFushen(el) {
    [el, el && el.id ? $(el.id) : null].forEach(function (x) { if (x) { x.value = ''; x.removeAttribute('data-prekur'); } });
  }
  document.addEventListener('input', function (ev) {
    var t = ev.target, c = $('ekipiLista');
    if (t && t.id && c && c.contains(t) && t.setAttribute) t.setAttribute('data-prekur', '1');
  }, true);
  $('ekipiLista').addEventListener('focusout', function () {
    if (!ekRivizatoNePritje) return;
    setTimeout(function () { // pak më vonë: prekja e butonit "Dërgo"/"Fto" duhet të kryhet para rindërtimit
      if (!ekRivizatoNePritje || ekFushaAktive() || !$('dlgEkipi').classList.contains('hapur')) return;
      vizatoEkipen(true);
    }, 400);
  });
  function rifreskoShenjatEEkipes() {
    var n = ekK ? ekK.numriNjoftimeve() : 0;
    var kr = ekK ? ekK.numriKerkesave() : 0;
    var z = $('ekZileNr'); z.textContent = n ? String(n) : ''; z.style.display = n ? '' : 'none';
    var t = $('ekTabShenja'); t.textContent = (n + kr) ? String(n + kr) : ''; t.style.display = (n || kr) ? '' : 'none';
    $('ekKerkesaPike').style.display = kr ? '' : 'none';
  }

  function vizatoEkipen(rifreskim) {
    ekRivizatoNePritje = false;
    var teShkruara = ekTeShkruarat();
    vizatoEkipenBrenda(rifreskim);
    ekRiktheTeShkruarat(teShkruara);
  }
  function vizatoEkipenBrenda(rifreskim) {
    Array.prototype.forEach.call(document.querySelectorAll('#ekMenu button'), function (b) {
      var po = b.getAttribute('data-n') === ekPamja;
      b.classList.toggle('aktiv', po);
    });
    $('ekChipStoku').hidden = true; // Stoku te Grupi u hoq (v183)
    if (ekPamja === 'stoku') ekPamja = 'permbledhja';
    var shtepi = ekEshteShtepi();
    $('dlgEkipi').classList.toggle('ek-shtepi', shtepi);
    $('ekipiPrapa').style.display = 'none'; // v191: pa buton mbrapa te Grupi (kategoritë sipër; mbrapa i telefonit kthen te Përmbledhja)
    $('ekipiData').textContent = ekDataSot();
    $('ekipiTitulli').textContent = { afatet: 'Afatet', aktiviteti: 'Aktiviteti', kalendari: 'Kalendari', anetaret: 'Kolegët', stoku: 'Stoku' }[ekPamja] || 'Grupi';
    var c = $('ekipiLista');
    if (!ekK || !ekK.kaLidhje()) {
      c.textContent = '';
      if (ngaVizitori()) { // prova si vizitor: Grupi kërkon llogari
        var bv = ekBosh('Grupi punon me llogari', 'Me llogari punon bashkë me kolegët: afatet e përbashkëta dhe aktiviteti. Si vizitor provon Stoku-n dhe Afatet.');
        var hv = ekEl('button', 'btn ek-viz-hyr', 'Hyr ose krijo llogari');
        hv.type = 'button';
        hv.addEventListener('click', hapHyrjenNgaProva);
        bv.appendChild(hv);
        c.appendChild(bv);
        return;
      }
      c.appendChild(ekBosh('Grupi s\'është i lidhur', !window.__stokuCloud ? 'Grupi kërkon lidhje me internetin.' : 'Hyr me llogarinë tënde që ta shohësh grupin.'));
      return;
    }
    var qasja = ekK.gjendjaEQasjes();
    $('ekMenu').hidden = qasja !== 'ok';
    if (qasja !== 'ok') {
      $('ekipiTitulli').textContent = 'Grupi';
      if (qasja === 'pa-grup') { vizatoPaGrup(c); return; }
      c.textContent = '';
      c.appendChild(qasja === 'pa-rregulla'
        ? ekBosh('Grupi s\'është gati ende', 'Administratori duhet t\'i vendosë rregullat e reja të Firebase-it (Firestore → Rules) për grupet. Stoku dhe afatet e tua punojnë si zakonisht.')
        : ekInfo('Duke u lidhur me grupin…'));
      return;
    }
    var gInfo = ekK.grupiInfo();
    if (ekPamja === 'permbledhja' && gInfo && gInfo.emri) $('ekipiTitulli').textContent = gInfo.emri;
    if (ekPamja === 'aktiviteti') vizatoAktivitetin(c);
    else if (ekPamja === 'kalendari') vizatoKalendarin(c);
    else if (ekPamja === 'anetaret') vizatoAnetaret(c);
    else if (ekPamja === 'permbledhja') vizatoPermbledhjen(c);
    else if (ekPamja === 'stoku') vizatoStokunAdmin(c, rifreskim);
    else vizatoAfatetEEkipes(c, rifreskim);
  }

  // ---- Afatet: kartat e kolegëve (si folderat) → lista e njërit ----
  function vizatoAfatetEEkipes(c, rifreskim) {
    var anetaret = ekAnetaret();
    var krejt = { uid: 'krejt', emri: 'Krejt grupi', afatet: ekTeGjithaAfatet(anetaret), ngarkuar: ekK.eGatshme() };
    if (__ekipiAnetari === null) __ekipiAnetari = 'krejt';
    var zgj = __ekipiAnetari === 'krejt' ? krejt : anetaret.filter(function (a) { return a.uid === __ekipiAnetari; })[0];
    if (!zgj) { __ekipiAnetari = 'krejt'; zgj = krejt; } // kolegu u largua: krejt grupi
    $('ekipiTitulli').textContent = zgj.uid === 'krejt' ? 'Afatet' : zgj.emri;
    var permb, inp, lista;
    if (rifreskim && $('ekipiRreshtat') && $('ekKerko') && $('ekPermb')) {
      permb = $('ekPermb'); inp = $('ekKerko'); lista = $('ekipiRreshtat');
    } else {
      c.textContent = '';
      permb = ekEl('div', 'af-permb ek-permb'); permb.id = 'ekPermb';
      c.appendChild(permb);
      var kk = ekEl('div', 'kerko-kuti');
      kk.innerHTML = '<svg class="kerko-ikona" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m21 21-4.35-4.35"></path></svg>';
      inp = ekEl('input'); inp.type = 'search'; inp.id = 'ekKerko'; inp.autocomplete = 'off'; inp.spellcheck = false;
      inp.placeholder = 'Kërko emër, barkod ose furnizues'; inp.setAttribute('aria-label', 'Kërko afatet');
      inp.addEventListener('input', function () { vizatoEkipen(true); });
      kk.appendChild(inp);
      c.appendChild(kk);
      lista = ekEl('div'); lista.id = 'ekipiRreshtat';
      c.appendChild(lista);
      if ((ekK.eshtePronar() || ekK.eshteAdmin()) && !zgj.uneJam && zgj.uid !== 'krejt') {
        if (ekK.eshtePronar()) {
          var hq = ekEl('button', 'btn tekst rrezik', 'Hiq ' + zgj.emri + ' nga grupi');
          hq.type = 'button'; hq.style.cssText = 'width:100%;margin-top:14px';
          hq.addEventListener('click', function () { ekHiqNgaEkipa(zgj); });
          c.appendChild(hq);
        }
        if (!zgj.admin && ekK.eshteAdmin()) {
          var hf = ekEl('button', 'btn tekst rrezik', 'Fshi llogarinë e ' + zgj.emri + ' komplet');
          hf.type = 'button'; hf.style.cssText = 'width:100%;margin-top:4px';
          hf.addEventListener('click', function () { ekFshijLlogarine(zgj); });
          c.appendChild(hf);
        }
      }
    }
    var n = ekNumero(zgj.afatet);
    permb.textContent = '';
    [['skaduar', n.skaduar, 'Të skaduara'], ['afer', n.afer, 'Afër skadimit'], ['ok', n.ok, 'Në rregull'], ['hequr', n.hequr, 'Të hequra']].forEach(function (x) {
      var b = ekEl('button', 'af-numer ' + x[0] + (ekFiltri === x[0] ? ' aktiv' : ''));
      b.type = 'button';
      b.appendChild(ekEl('b', null, String(x[1])));
      b.appendChild(ekEl('span', null, x[2]));
      b.addEventListener('click', function () { ekFiltri = ekFiltri === x[0] ? null : x[0]; vizatoEkipen(true); });
      permb.appendChild(b);
    });
    var k = inp.value.trim().toLowerCase();
    var te = zgj.afatet.filter(function (a) {
      var st = AF.statusi(a);
      if (ekFiltri === 'hequr') { if (st !== 'hequr') return false; }
      else if (st === 'hequr') return false;
      else if (ekFiltri === 'skaduar' && st !== 'skaduar' && st !== 'pa-date') return false;
      else if (ekFiltri === 'afer' && st !== 'afer') return false;
      else if (ekFiltri === 'ok' && st !== 'ok') return false;
      if (k && ((a.emri || '') + ' ' + (a.barkodi || '') + ' ' + (a.furnizuesi || '') + ' ' + (a.pronariEmri || '')).toLowerCase().indexOf(k) === -1) return false;
      return true;
    });
    if (ekFiltri === 'hequr') te.sort(function (x, y) { return (y.hequrSe || 0) - (x.hequrSe || 0); }); else te.sort(AF.krahaso);
    lista.textContent = '';
    if (!zgj.ngarkuar) { lista.appendChild(ekInfo('Duke ngarkuar afatet…')); return; }
    if (zgj.paTeDhena) { lista.appendChild(ekBosh('Pa të dhëna ende', 'Afatet e ' + zgj.emri + ' shfaqen këtu sapo ta hapë Stoku-n (versionin e ri) në telefon ose kompjuter.')); return; }
    if (!te.length) {
      lista.appendChild(k ? ekBosh('Asgjë s\'u gjet', 'Provo një kërkim tjetër.') :
        ekFiltri === 'skaduar' ? ekBosh('Asnjë produkt i skaduar', 'Shumë mirë!') :
        ekFiltri === 'hequr' ? ekBosh('Asnjë produkt i hequr ende') :
        ekBosh('Asnjë afat', zgj.uneJam ? 'Shtoji te tabi "Afatet".' : ''));
      return;
    }
    var frag = document.createDocumentFragment();
    te.slice(0, EKIPI_LIMITI).forEach(function (a) { frag.appendChild(ekKartaAfati(a, __ekipiAnetari === 'krejt')); });
    if (te.length > EKIPI_LIMITI) frag.appendChild(ekInfo('Shfaqen ' + EKIPI_LIMITI + ' nga ' + te.length + '. Kërko për t\'i gjetur të tjerat.'));
    lista.appendChild(frag);
  }
  // ---- Pulti (faqja kryesore e Grupit) ----
  var EK_MUAJT = ['JAN', 'SHK', 'MAR', 'PRI', 'MAJ', 'QER', 'KOR', 'GUS', 'SHT', 'TET', 'NËN', 'DHJ'];
  var EK_DITET = ['E diel', 'E hënë', 'E martë', 'E mërkurë', 'E enjte', 'E premte', 'E shtunë'];
  var EK_MUAJT_PLOTE = ['janar', 'shkurt', 'mars', 'prill', 'maj', 'qershor', 'korrik', 'gusht', 'shtator', 'tetor', 'nëntor', 'dhjetor'];
  function ekDataSot() { var d = new Date(); return EK_DITET[d.getDay()] + ', ' + d.getDate() + ' ' + EK_MUAJT_PLOTE[d.getMonth()]; }
  var EK_NGJYRAT = ['#1459B8', '#8E3FB0', '#0F7C7C', '#B5542C', '#5D6B2E', '#AD1457', '#37474F', '#6D4C41'];
  function ekNgjyra(emri) { var h = 0; String(emri || '').split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) | 0; }); return EK_NGJYRAT[Math.abs(h) % EK_NGJYRAT.length]; }
  function ekAv(emri, m, online) {
    var a = ekEl('span', 'ek-av' + (online ? ' online' : ''), String(emri || '?').charAt(0).toUpperCase());
    a.style.cssText = 'width:' + m + 'px;height:' + m + 'px;font-size:' + Math.round(m * 0.4) + 'px;background:' + ekNgjyra(emri);
    return EKL.Fotot.apliko(a, String(emri || ''));
  }
  function ekKurTekst(n) { return n === null ? '' : n < -1 ? 'para ' + AF.ditetParaTekst(-n) : n === -1 ? 'dje' : n === 0 ? 'sot' : n === 1 ? 'nesër' : 'për ' + AF.ditetTekst(n); }
  function ekKartaPultit(a) {
    var st = AF.statusi(a), n = AF.ditetDeri(a.data);
    var k = ekEl('div', 'ek-kart');
    var d = ekEl('div', 'ek-kart-data ' + (st === 'skaduar' || st === 'pa-date' ? 'skaduar' : 'afer'));
    var dt = a.data ? a.data.split('-') : null;
    d.appendChild(ekEl('b', null, dt ? String(parseInt(dt[2], 10)) : '?'));
    d.appendChild(ekEl('small', null, dt ? EK_MUAJT[parseInt(dt[1], 10) - 1] : ''));
    k.appendChild(d);
    var t = ekEl('div', 'ek-kart-trup');
    t.appendChild(ekEl('div', 'em', a.emri || a.barkodi || '(pa emër)'));
    var nen = ekEl('div', 'nen');
    nen.appendChild(ekAv(a.pronariEmri, 18, false));
    nen.appendChild(ekEl('span', null, (a.pronariEmri || '') + (a.data ? ' · ' + ekKurTekst(n) : '') + (AF.sasiaTekst(a) ? ' · ' + AF.sasiaTekst(a) : '')));
    t.appendChild(nen);
    k.appendChild(t);
    if (st === 'skaduar' && a.nePritjeNga) {
      var pr = ekEl('span', 'ek-kart-hiq ek-kart-pritje', 'Në pritje'); pr.title = ekTekstiNePritje(a);
      k.appendChild(pr);
    } else if (st === 'skaduar' && ekLejohetHeqja(a)) {
      var b = ekEl('button', 'ek-kart-hiq'); b.type = 'button';
      b.innerHTML = IKONAT_AF.kontroll;
      b.appendChild(document.createTextNode('Unë e hoqa'));
      b.addEventListener('click', function () { ekHeqNgaRafti(a, b); });
      k.appendChild(b);
    }
    return k;
  }
  // ---- Përmbledhja (faqja e parë e Grupit): numrat, kërkesa, kolegët, çka duhet hequr, statistikat ----
  function vizatoPermbledhjen(c) {
    var anetaret = ekAnetaret();
    var krejt = { uid: 'krejt', emri: 'Krejt grupi', afatet: ekTeGjithaAfatet(anetaret), ngarkuar: ekK.eGatshme() };
    c.textContent = '';
    var te = krejt.afatet;
    var st = EKL.statistikat(anetaret);
    var nOn = anetaret.filter(function (a) { return a.uneJam || EKL.eshteOnline(a); }).length;
    // Numrat kryesorë (prekja hap listën përkatëse)
    var p = ekEl('div', 'af-permb ek-permb-nr');
    [['', st.aktive, 'Në raft', function () { ekHapAnetarin('krejt'); }],
     ['skaduar', st.skaduara, 'Të skaduara', function () { ekHapAnetarin('krejt', 'skaduar'); }],
     ['afer', st.javes, 'Skadojnë ≤ 7 ditë', function () { ekHapAnetarin('krejt', 'afer'); }],
     ['afer', st.afer, 'Afër skadimit', function () { ekHapAnetarin('krejt', 'afer'); }],
     ['ok', st.hequrMuajit, 'Hequr këtë muaj', function () { ekHapAnetarin('krejt', 'hequr'); }],
     ['', nOn + '/' + anetaret.length, 'Online tani', function () { ekZgjidhPamjen('anetaret'); }]].forEach(function (x) {
      var b = ekEl('button', 'af-numer ' + (x[0] || 'asnje')); b.type = 'button';
      b.appendChild(ekEl('b', null, krejt.ngarkuar ? String(x[1]) : '–'));
      b.appendChild(ekEl('span', null, x[2]));
      b.addEventListener('click', x[3]);
      p.appendChild(b);
    });
    c.appendChild(p);
    // Ftesat për një grup tjetër (shfaqen edhe te Kolegët); v242: kërkesat për t'u futur në grupin tim (admini i grupit)
    ekK.ftesatEMia().forEach(function (f) { c.appendChild(ekFtesaEl(f)); });
    ekK.kerkesatEGrupit().forEach(function (k) { c.appendChild(ekKerkesaEGrupitEl(k)); });
    var bKrk = ekEl('button', 'ek-kerko-heqje'); bKrk.type = 'button'; bKrk.id = 'ekKerkoHeqje';
    bKrk.innerHTML = '<span class="ek-kerko-heqje__ik"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7h18"></path><path d="M5 7v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7"></path><path d="M9 7V4h6v3"></path><path d="m10 12 4 4M14 12l-4 4"></path></svg></span><span class="ek-kerko-heqje__tk"><b>Kërko heqje nga rafti</b><span>Dërgoji një kolegu një produkt për ta hequr</span></span><span class="shigjeta">›</span>';
    bKrk.addEventListener('click', function () { hapKerkesen(); });
    if (leja('grupiKerkesat')) c.appendChild(bKrk);
    // Kolegët (online së pari)
    var nOnline = anetaret.filter(function (a) { return a.uneJam || EKL.eshteOnline(a); }).length;
    var s1 = ekEl('div', 'ek-seksion'); s1.appendChild(ekEl('b', null, 'Online tani')); s1.appendChild(ekEl('span', null, nOnline + ' nga ' + anetaret.length)); c.appendChild(s1);
    var rr = ekEl('div', 'ek-online-rrip');
    anetaret.forEach(function (a) {
      var b = ekEl('button'); b.type = 'button';
      b.title = a.emri + ' · ' + (a.uneJam ? 'Online tani' : EKL.tekstiPranise(a));
      b.appendChild(ekAv(a.emri, 46, a.uneJam || EKL.eshteOnline(a)));
      b.appendChild(ekEl('span', null, a.emri));
      b.addEventListener('click', function () { ekHapAnetarin(a.uid); });
      rr.appendChild(b);
    });
    c.appendChild(rr);
    // Duhet hequr nga rafti
    var skaduara = te.filter(function (a) { return AF.statusi(a) === 'skaduar'; }).sort(AF.krahaso);
    var s2 = ekEl('div', 'ek-seksion'); s2.appendChild(ekEl('b', null, 'Duhet hequr nga rafti'));
    if (skaduara.length > 5) { var b2 = ekEl('button', null, 'Shiko krejt (' + skaduara.length + ')'); b2.type = 'button'; b2.addEventListener('click', function () { ekHapAnetarin('krejt', 'skaduar'); }); s2.appendChild(b2); }
    c.appendChild(s2);
    var l2 = ekEl('div', 'ek-kartat');
    if (!krejt.ngarkuar) l2.appendChild(ekInfo('Duke ngarkuar…'));
    else if (!skaduara.length) l2.appendChild(ekEl('div', 'ek-kart mire', 'Asnjë produkt i skaduar në raft. Shumë mirë!'));
    skaduara.slice(0, 5).forEach(function (a) { l2.appendChild(ekKartaPultit(a)); });
    c.appendChild(l2);
    // Skadojnë këtë javë
    var javes = te.filter(function (a) { var st = AF.statusi(a); if (st !== 'afer') return false; var d = AF.ditetDeri(a.data); return d !== null && d <= 7; }).sort(AF.krahaso);
    if (krejt.ngarkuar && javes.length) {
      var s3 = ekEl('div', 'ek-seksion'); s3.appendChild(ekEl('b', null, 'Skadojnë këtë javë'));
      var b3 = ekEl('button', null, 'Shiko krejt'); b3.type = 'button'; b3.addEventListener('click', function () { ekHapAnetarin('krejt', 'afer'); }); s3.appendChild(b3);
      c.appendChild(s3);
      var l3 = ekEl('div', 'ek-kartat');
      javes.slice(0, 5).forEach(function (a) { l3.appendChild(ekKartaPultit(a)); });
      c.appendChild(l3);
    }
    // Aktiviteti i fundit (3)
    var ngj = ekK.gj.ngjarjetGati ? ekK.gj.ngjarjet.slice(0, 3) : [];
    if (ngj.length) {
      var s4 = ekEl('div', 'ek-seksion'); s4.appendChild(ekEl('b', null, 'Aktiviteti i fundit'));
      var b4 = ekEl('button', null, 'Shiko krejt'); b4.type = 'button'; b4.addEventListener('click', function () { ekZgjidhPamjen('aktiviteti'); }); s4.appendChild(b4);
      c.appendChild(s4);
      var uidIm = perdoruesiAktual() ? perdoruesiAktual().uid : null;
      ngj.forEach(function (x) {
        var tx = EKL.tekstiNgjarjes(x, uidIm);
        var r = ekEl('div', 'ek-ngjarje ' + tx.lloji);
        r.appendChild(ekAvatar({ emri: tx.avatar || x.emri }, false));
        var bt = ekEl('div', 'ek-ngjarje-trup'), rr2 = ekEl('div');
        rr2.appendChild(ekEl('b', null, tx.kush)); rr2.appendChild(document.createTextNode(' ' + tx.cfare));
        bt.appendChild(rr2);
        if (tx.detaje) bt.appendChild(ekEl('div', 'ek-ngjarje-detaje', tx.detaje));
        r.appendChild(bt);
        r.appendChild(ekEl('div', 'ek-koha', EKL.kohaRelative(x.koha)));
        c.appendChild(r);
      });
    }
    // Statistikat
    ekSeksionetEStatistikave(c, st);
    if (ekK.gj.gabimNgarkimi) c.appendChild(ekInfo('S\'u lidh me grupin. Kontrollo internetin, ose rregullat e Firebase-it s\'janë vendosur ende.'));
  }

  function ekKartaAfati(a, meEmer) {
    var st = AF.statusi(a);
    var n = AF.ditetDeri(a.data);
    var k = ekEl('div', 'af-karta ' + st);
    k.appendChild(kutiaEDiteve(st, n));
    var m = ekEl('div', 'af-majtas');
    m.appendChild(ekEl('div', 'af-emri', a.emri || a.barkodi || '(pa emër)'));
    var nen = rreshtiIAfatit(a, meEmer ? a.pronariEmri : '');
    if (nen) m.appendChild(ekEl('div', 'af-nen', nen));
    if (a.emri && a.barkodi) m.appendChild(ekEl('div', 'af-kodi', a.barkodi));
    m.appendChild(ekEl('div', 'af-mesazh', st === 'hequr'
      ? 'U hoq nga rafti' + (a.hequrNga ? ' nga ' + a.hequrNga : '') + (a.hequrSe ? ' · ' + EKL.kohaRelative(a.hequrSe) : '') + '.'
      : a.nePritjeNga ? ekTekstiNePritje(a) : AF.pershkrimi(a)));
    if (st === 'skaduar' && a.nePritjeNga) m.appendChild(ekEl('span', 'af-pill ek-pill-pritje', 'Në pritje të miratimit'));
    else if (st === 'skaduar' && ekLejohetHeqja(a)) {
      var pb = ekEl('button', 'af-pill'); pb.type = 'button';
      pb.innerHTML = IKONAT_AF.kontroll;
      pb.appendChild(document.createTextNode('Unë e hoqa'));
      pb.addEventListener('click', function (ev) { ev.stopPropagation(); ekHeqNgaRafti(a, pb); });
      m.appendChild(pb);
    }
    var uIm = perdoruesiAktual();
    if (ekK && ekK.eshteAdmin() && a.pronariUid && uIm && a.pronariUid !== uIm.uid) {
      var rr = ekEl('div', 'ek-admin-veprime');
      if (st === 'hequr') rr.appendChild(ekPillAdmin('Ktheje në raft', a, 'kthe'));
      else if (st !== 'skaduar') rr.appendChild(ekPillAdmin('Shëno të hequr', a, 'hiq'));
      rr.appendChild(ekPillAdmin('Fshije', a, 'fshij'));
      m.appendChild(rr);
    }
    k.appendChild(m);
    k.style.cursor = 'default';
    return k;
  }
  // Administratori: ndryshon direkt afatin e një kolegu (pronari njoftohet)
  function ekPillAdmin(tekst, a, veprimi) {
    var b = ekEl('button', 'af-pill', tekst); b.type = 'button';
    if (veprimi === 'fshij') b.style.cssText = 'border-color:var(--rrezik);color:var(--rrezik)';
    b.style.marginRight = '6px';
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
    if (!r.ok) { if (btn) btn.disabled = false; toast(r.arsye === 'nuk-u-gjet' ? 'Ky afat s\'ekziston më.' : 'S\'u ndryshua. Kontrollo internetin dhe provo përsëri.', 4000); return; }
    toast('"' + emri + '" u ' + (veprimi === 'fshij' ? 'fshi' : veprimi === 'kthe' ? 'kthye në raft' : 'shënua si i hequr') + '. ' + (a.pronariEmri || 'Kolegu') + ' u njoftua.', 3500);
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
  function ekMbyllFlluske() { if (__ekFlluska) { __ekFlluska.remove(); __ekFlluska = null; } }
  // Flluska vendoset brenda vetë ikonës (position: absolute), që të dalë gjithmonë mbi të edhe me zmadhim / WebView
  function ekTregoFlluskeRoli(ikona, tekst) {
    var ishte = __ekFlluska && __ekFlluska.__per === ikona;
    ekMbyllFlluske();
    if (ishte) return;
    var f = document.createElement('span');
    f.className = 'ek-flluska lart'; f.setAttribute('role', 'tooltip'); f.textContent = tekst; f.__per = ikona;
    ikona.appendChild(f);
    // mos dil jashtë ekranit: zhvendose anash, shigjeta mbetet te ikona
    var r = f.getBoundingClientRect(), vw = document.documentElement.clientWidth, dx = 0;
    if (r.left < 12) dx = 12 - r.left; else if (r.right > vw - 12) dx = vw - 12 - r.right;
    f.style.setProperty('--zhvendosja', dx + 'px');
    // pa vend lart (afër kokës): poshtë ikonës
    var koka = document.querySelector('.mbulese.hapur .opsione-krye, .sbp .faqe-krye');
    var kufiri = koka ? koka.getBoundingClientRect().bottom : 0;
    if (f.getBoundingClientRect().top < kufiri + 6) { f.classList.remove('lart'); f.classList.add('poshte'); }
    __ekFlluska = f;
    clearTimeout(ekTregoFlluskeRoli.k);
    ekTregoFlluskeRoli.k = setTimeout(ekMbyllFlluske, 5000);
  }
  // Prekja e vetë ikonës s'e mbyll këtu: e mbyll ekTregoFlluskeRoli (prekja e dytë e fsheh flluskën, s'e rihap)
  document.addEventListener('click', function (ev) {
    if (__ekFlluska && __ekFlluska.__per && __ekFlluska.__per.contains(ev.target)) return;
    ekMbyllFlluske();
  }, true);
  window.addEventListener('scroll', ekMbyllFlluske, true);
  function ekTekstiNePritje(a) {
    var u = perdoruesiAktual(), uneE = u && a.nePritjeUid === u.uid;
    return (uneE ? 'E hoqe nga rafti' : 'E hoqi ' + a.nePritjeNga) + (a.nePritjeSe ? ' ' + EKL.kohaRelative(a.nePritjeSe) : '') +
      '. Pret miratimin e ' + (a.pronariEmri || 'kolegut') + '.';
  }
  // "Unë e hoqa": i imi → si te Afatet; i kolegut → kërkesë te pronari, që hiqet vetëm kur ai e pranon
  function ekLejohetHeqja(a) {
    var u = perdoruesiAktual();
    return leja(u && a.pronariUid === u.uid ? 'afatetNdrysho' : 'grupiHeq');
  }
  async function ekHeqNgaRafti(a, btn) {
    var u = perdoruesiAktual();
    if (!ekLejohetHeqja(a)) return;
    if (u && a.pronariUid === u.uid) {
      var imi = afatet.filter(function (x) { return x.id === a.id; })[0];
      if (imi) shenoHequr(imi);
      return;
    }
    var emri = a.emri || a.barkodi || 'produktin';
    var po = await konfirmo('E hoqe nga rafti?', '"' + emri + '" i përket ' + (a.pronariEmri || 'kolegut') + '. Atij i shkon njoftim, dhe produkti hiqet nga afatet e tij vetëm kur ai e pranon.', 'Po, e hoqa');
    if (!po) return;
    if (btn) btn.disabled = true;
    var r = await ekK.heqAfatinEKolegut(a);
    if (!r.ok) {
      if (btn) btn.disabled = false;
      toast(r.leje ? 'S\'u lejua: vetëm kolegët e pranuar të grupit mund ta bëjnë këtë.' : 'S\'u dërgua. Kontrollo internetin dhe provo përsëri.', 4000);
      return;
    }
    toast('"' + emri + '": ' + (a.pronariEmri || 'kolegut') + (r.neRadhe ? ' i shkon për miratim sapo të ketë internet.' : ' i shkoi për miratim.'), 3500);
  }

  // ---- Aktiviteti ----
  function vizatoAktivitetin(c) {
    c.textContent = '';
    var anetaret = ekAnetaret();
    var st = EKL.statistikat(anetaret);
    var p = ekEl('div', 'af-permb');
    [['afer', st.sot, 'Skadojnë sot', 'afer'], ['skaduar', st.skaduara, 'Të skaduara në raft', 'skaduar'], ['ok', st.hequrSot, 'Hequr sot', 'hequr']].forEach(function (x) {
      var b = ekEl('button', 'af-numer ' + x[0]); b.type = 'button';
      b.appendChild(ekEl('b', null, String(x[1])));
      b.appendChild(ekEl('span', null, x[2]));
      b.addEventListener('click', function () { ekHapAnetarin('krejt', x[3]); });
      p.appendChild(b);
    });
    c.appendChild(p);
    var ng = ekK.gj.ngjarjet;
    if (!ekK.gj.ngjarjetGati) { c.appendChild(ekInfo('Duke ngarkuar…')); return; }
    if (!ng.length) { c.appendChild(ekBosh('S\'ka aktivitet ende', 'Kur dikush heq nga rafti, ose shton afate, del këtu.')); return; }
    var uidIm = perdoruesiAktual() ? perdoruesiAktual().uid : null;
    var dita = '';
    var frag = document.createDocumentFragment();
    ng.forEach(function (x) {
      var t = EKL.titulliDites(x.koha);
      if (t !== dita) { dita = t; var h = ekEl('div', 'af-grup-krye'); h.appendChild(ekEl('span', null, t)); frag.appendChild(h); }
      var tx = EKL.tekstiNgjarjes(x, uidIm);
      var r = ekEl('div', 'ek-ngjarje ' + tx.lloji);
      r.appendChild(ekAvatar({ emri: tx.avatar || x.emri }, false));
      var b = ekEl('div', 'ek-ngjarje-trup');
      var rr = ekEl('div');
      rr.appendChild(ekEl('b', null, tx.kush));
      rr.appendChild(document.createTextNode(' ' + tx.cfare));
      b.appendChild(rr);
      if (tx.detaje) b.appendChild(ekEl('div', 'ek-ngjarje-detaje', tx.detaje));
      r.appendChild(b);
      r.appendChild(ekEl('div', 'ek-koha', ekOra(x.koha)));
      frag.appendChild(r);
    });
    c.appendChild(frag);
  }

  // ---- Kalendari ----
  function vizatoKalendarin(c) {
    var sot = new Date();
    if (!ekKal) ekKal = { viti: sot.getFullYear(), muaji: sot.getMonth(), dita: EKL.isoDites(sot) };
    var te = ekTeGjithaAfatet(ekAnetaret());
    var k = EKL.kalendari(te, ekKal.viti, ekKal.muaji);
    c.textContent = '';
    var krye = ekEl('div', 'ek-kal-krye');
    var para = ekEl('button', null, '‹'); para.type = 'button'; para.setAttribute('aria-label', 'Muaji i kaluar');
    para.addEventListener('click', function () { ekNdryshoMuajin(-1); });
    var pas = ekEl('button', null, '›'); pas.type = 'button'; pas.setAttribute('aria-label', 'Muaji tjetër');
    pas.addEventListener('click', function () { ekNdryshoMuajin(1); });
    krye.appendChild(para); krye.appendChild(ekEl('b', null, k.titulli)); krye.appendChild(pas);
    c.appendChild(krye);
    var g = ekEl('div', 'ek-kal');
    k.ditet.forEach(function (d) { g.appendChild(ekEl('div', 'ek-kal-emer', d)); });
    k.qelizat.forEach(function (q) {
      if (!q) { g.appendChild(ekEl('div')); return; }
      var b = ekEl('button', 'ek-kal-dite' + (q.statusi ? ' ' + q.statusi : '') + (q.sot ? ' sot' : '') + (ekKal.dita === q.iso ? ' zgjedhur' : ''));
      b.type = 'button';
      b.appendChild(ekEl('span', null, String(q.dita)));
      if (q.afatet.length) b.appendChild(ekEl('small', null, String(q.neRaft || q.afatet.length)));
      b.setAttribute('aria-label', q.dita + ' ' + k.titulli + (q.afatet.length ? ': ' + nrEmer(q.afatet.length, 'afat', 'afate') : ''));
      b.addEventListener('click', function () { ekKal.dita = q.iso; vizatoEkipen(); });
      g.appendChild(b);
    });
    c.appendChild(g);
    var lg = ekEl('div', 'ek-legjenda');
    [['skaduar', 'Ka skaduar'], ['afer', 'Skadon brenda 30 ditëve'], ['ok', 'Në rregull'], ['hequr', 'Të hequra']].forEach(function (x) {
      var s = ekEl('span'); s.appendChild(ekEl('i', x[0])); s.appendChild(document.createTextNode(x[1])); lg.appendChild(s);
    });
    c.appendChild(lg);
    var h = ekEl('div', 'af-grup-krye');
    if (!ekKal.dita) { h.appendChild(ekEl('span', null, 'Prek një ditë për t\'i parë afatet e saj')); c.appendChild(h); return; }
    var lista = te.filter(function (a) { return a.data === ekKal.dita; }).sort(AF.krahaso);
    h.appendChild(ekEl('span', null, AF.formato(ekKal.dita) + ' · ' + (lista.length ? lista.length + (lista.length === 1 ? ' afat' : ' afate') : 'asnjë afat')));
    c.appendChild(h);
    lista.forEach(function (a) { c.appendChild(ekKartaAfati(a, true)); });
  }
  function ekNdryshoMuajin(d) {
    var m = ekKal.muaji + d, v = ekKal.viti;
    if (m < 0) { m = 11; v--; } else if (m > 11) { m = 0; v++; }
    ekKal = { viti: v, muaji: m, dita: null };
    var sot = new Date();
    if (v === sot.getFullYear() && m === sot.getMonth()) ekKal.dita = EKL.isoDites(sot);
    vizatoEkipen();
  }

  // ---- Kolegët ----
  // ---- v242: hyr në një grup ekzistues (kërko me emër, dërgo kërkesë; admini i grupit e pranon) ----
  var ekKerkimi = { q: '', rez: null, duke: false, gabim: '', kohez: null };
  function ekKerkesaEMiaEl(k) {
    var bk = ekEl('div', 'ek-pult-kerkesat ek-ftesa ek-kerkesa-ime');
    var tk = ekEl('div', 'tk');
    tk.appendChild(ekEl('b', null, k.grupiEmri || 'Grup'));
    tk.appendChild(document.createTextNode('Kërkesa u dërgua' + (k.koha ? ' ' + EKL.kohaRelative(k.koha) : '') + '. Pret pranimin nga admini i grupit.'));
    bk.appendChild(tk);
    var ba = ekEl('button', 'btn tekst', 'Anulo'); ba.type = 'button';
    ba.addEventListener('click', async function () {
      ba.disabled = true;
      var r = await ekK.anuloKerkesen(k);
      if (!r.ok) { ba.disabled = false; toast('S\'u anulua. Kontrollo internetin dhe provo përsëri.', 4000); }
    });
    bk.appendChild(ba);
    return bk;
  }
  function ekKerkimiIGrupitEl() {
    var w = ekEl('div', 'ek-kerko-grupin');
    var f = ekEl('div', 'ek-rresht-forma');
    var inp = ekEl('input'); inp.type = 'search'; inp.id = 'ekGrupiKerko'; inp.maxLength = 60; inp.autocomplete = 'off'; inp.value = ekKerkimi.q;
    inp.placeholder = 'Shkruaj emrin e grupit'; inp.setAttribute('aria-label', 'Kërko grupin me emër'); inp.setAttribute('enterkeyhint', 'search');
    f.appendChild(inp); w.appendChild(f);
    var rez = ekEl('div', 'ek-kerko-rez'); rez.id = 'ekGrupiRezultatet'; w.appendChild(rez);
    function vizatoRez() {
      rez.textContent = '';
      if (ekKerkimi.q.trim().length < 2) return;
      if (ekKerkimi.gabim) { rez.appendChild(ekInfo(ekKerkimi.gabim)); return; }
      if (!ekKerkimi.rez) { rez.appendChild(ekInfo('Duke kërkuar…')); return; }
      if (!ekKerkimi.rez.length) { rez.appendChild(ekInfo('S\'u gjet asnjë grup me këtë emër.')); return; }
      var kerkuar = {};
      ekK.kerkesatEMia().forEach(function (k) { kerkuar[k.gid] = true; });
      ekKerkimi.rez.forEach(function (gr) {
        var bk = ekEl('div', 'ek-pult-kerkesat ek-ftesa');
        var tk = ekEl('div', 'tk');
        tk.appendChild(ekEl('b', null, gr.emri));
        tk.appendChild(document.createTextNode(gr.pronarEmri ? 'Admini: ' + gr.pronarEmri : 'Grup'));
        bk.appendChild(tk);
        var b = ekEl('button', 'btn', kerkuar[gr.id] ? 'U dërgua' : 'Kërko të hysh'); b.type = 'button'; b.disabled = !!kerkuar[gr.id];
        b.addEventListener('click', async function () {
          b.disabled = true;
          inp.blur(); // tastiera mbyllet; pamja rifreskohet (kërkesa ime del lart)
          var r = await ekK.dergoKerkesen(gr);
          if (!r.ok) {
            b.disabled = false;
            toast(r.leje ? 'Kërkesa s\'u dërgua: ky grup s\'ekziston më, ose rregullat e Firebase-it s\'janë vendosur ende.' : 'Kërkesa s\'u dërgua. Kontrollo internetin dhe provo përsëri.', 5000);
            return;
          }
          if (r.ngaFtesa) { toast('U bashkove me grupin "' + gr.emri + '" (të kishin ftuar).'); __ekipiAnetari = null; ekZgjidhPamjen('anetaret'); return; }
          if (r.rikthyer) { toast('U ktheve në grupin "' + gr.emri + '" (ishe ende anëtar).'); __ekipiAnetari = null; ekZgjidhPamjen('anetaret'); return; }
          b.textContent = 'U dërgua';
          toast('Kërkesa u dërgua. Kur ta pranojë admini i grupit, hyn vetë në grup.', 5000);
        });
        bk.appendChild(b);
        rez.appendChild(bk);
      });
    }
    inp.addEventListener('input', function () {
      ekKerkimi.q = inp.value; ekKerkimi.gabim = ''; ekKerkimi.rez = null;
      clearTimeout(ekKerkimi.kohez);
      vizatoRez();
      if (inp.value.trim().length < 2) return;
      ekKerkimi.kohez = setTimeout(async function () {
        var q = inp.value;
        var r = await ekK.kerkoGrupet(q);
        if (q !== ekKerkimi.q) return;
        ekKerkimi.rez = r.ok ? r.lista : [];
        ekKerkimi.gabim = r.ok ? '' : r.leje ? 'Kërkimi i grupeve s\'është gati ende (rregullat e Firebase-it).' : 'S\'u kërkua. Kontrollo internetin dhe provo përsëri.';
        vizatoRez();
      }, 300);
    });
    vizatoRez();
    return w;
  }
  // ---- Ekipat: pa grup (krijo grupin ose prano një ftesë) ----
  function vizatoPaGrup(c) {
    c.textContent = '';
    var ft = ekK.ftesatEMia();
    if (ft.length) {
      var hf = ekEl('div', 'af-grup-krye'); hf.appendChild(ekEl('span', null, ft.length === 1 ? 'Ke një ftesë' : 'Ke ' + ft.length + ' ftesa')); c.appendChild(hf);
      ft.forEach(function (f) { c.appendChild(ekFtesaEl(f)); });
    }
    // v242: hyr në një grup ekzistues
    c.appendChild(ekBosh('Hyr në një grup', 'Kërko grupin me emrin e tij dhe dërgo kërkesë. Kur ta pranojë admini i grupit, hyn vetë.'));
    ekK.kerkesatEMia().forEach(function (k) { c.appendChild(ekKerkesaEMiaEl(k)); });
    c.appendChild(ekKerkimiIGrupitEl());
    c.appendChild(ekBosh('Ose krijo grupin tënd',
      'Secili grup sheh vetëm kolegët e vet (afatet dhe aktivitetin). Krijo grupin e dyqanit tënd dhe fto shokët, ose prano një ftesë.'));
    var f = ekEl('div', 'ek-rresht-forma');
    var inp = ekEl('input'); inp.type = 'text'; inp.id = 'ekGrupiEmri'; inp.maxLength = 60; inp.autocomplete = 'off';
    inp.placeholder = 'Emri i grupit, p.sh. Market Agimi'; inp.setAttribute('aria-label', 'Emri i grupit të ri'); inp.setAttribute('enterkeyhint', 'done');
    var b = ekEl('button', 'btn', 'Krijo'); b.type = 'button'; b.id = 'ekGrupiKrijo';
    async function krijo() {
      var em = inp.value.trim();
      if (em.length < 2) { toast('Shkruaj emrin e grupit (të paktën 2 shkronja).'); inp.focus(); return; }
      b.disabled = true;
      var r = await ekK.krijoGrupin(em);
      b.disabled = false;
      if (!r.ok) { toast(r.leje ? 'S\'u krijua: rregullat e Firebase-it për grupet s\'janë vendosur ende.' : 'S\'u krijua. Kontrollo internetin dhe provo përsëri.', 5000); return; }
      toast('Grupi "' + em + '" u krijua. Tash fto shokët te Kolegët.', 4500);
      __ekipiAnetari = null;
      ekZgjidhPamjen('anetaret');
    }
    b.addEventListener('click', krijo);
    inp.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); krijo(); } });
    f.appendChild(inp); f.appendChild(b);
    c.appendChild(f);
    var h = ekEl('div', 'ek-grupi-hint');
    h.appendChild(document.createTextNode('Për t\'u futur në grupin e dikujt tjetër, jepja adminit të grupit emrin tënd të përdoruesit: '));
    h.appendChild(ekEl('b', null, emriPerdoruesitAktual() || ''));
    h.appendChild(document.createTextNode('. Ftesa del këtu.'));
    c.appendChild(h);
  }
  function ekFtesaEl(f) {
    var bk = ekEl('div', 'ek-pult-kerkesat ek-ftesa');
    var tk = ekEl('div', 'tk');
    tk.appendChild(ekEl('b', null, f.grupiEmri || 'Grup'));
    tk.appendChild(document.createTextNode((f.ngaEmri || 'Dikush') + ' të fton në këtë grup' + (f.koha ? ' · ' + EKL.kohaRelative(f.koha) : '') + '.'));
    bk.appendChild(tk);
    var bp = ekEl('button', 'btn', 'Prano'); bp.type = 'button';
    bp.addEventListener('click', function () { ekPranoFtesen(f, bp); });
    var br = ekEl('button', 'btn tekst', 'Refuzo'); br.type = 'button';
    br.addEventListener('click', async function () {
      br.disabled = true;
      var r = await ekK.refuzoFtesen(f);
      if (!r.ok) { br.disabled = false; toast('S\'u refuzua. Kontrollo internetin.', 4000); }
    });
    bk.appendChild(bp); bk.appendChild(br);
    return bk;
  }
  function ekKerkesaEGrupitEl(k) {
    var bk = ekEl('div', 'ek-pult-kerkesat ek-ftesa ek-kerkesa-grupi');
    var tk = ekEl('div', 'tk');
    tk.appendChild(ekEl('b', null, k.emri || 'Dikush'));
    tk.appendChild(document.createTextNode('kërkon të hyjë në grup' + (k.koha ? ' · ' + EKL.kohaRelative(k.koha) : '') + '.'));
    bk.appendChild(tk);
    var bp = ekEl('button', 'btn', 'Prano'); bp.type = 'button';
    var br = ekEl('button', 'btn tekst', 'Refuzo'); br.type = 'button';
    bp.addEventListener('click', async function () {
      bp.disabled = br.disabled = true;
      var r = await ekK.pranoKerkesen(k);
      if (!r.ok) { bp.disabled = br.disabled = false; toast('S\'u pranua. Kontrollo internetin dhe provo përsëri.', 4000); return; }
      toast((k.emri || 'Kolegu') + ' u pranua. Hyn në grup sapo ta hapë Stoku-n.', 5000);
    });
    br.addEventListener('click', async function () {
      bp.disabled = br.disabled = true;
      var r = await ekK.refuzoKerkesen(k);
      if (!r.ok) { bp.disabled = br.disabled = false; toast('S\'u refuzua. Kontrollo internetin dhe provo përsëri.', 4000); }
    });
    bk.appendChild(bp); bk.appendChild(br);
    return bk;
  }
  function ekTekstiLargimit(m) {
    return m.arsye === 'trashegimtari' ? 'S\'u largove: kolegu s\'u bë dot admin. Kontrollo internetin dhe provo përsëri.'
      : m.arsye === 'pronari-i-vetem' ? 'Je admini i vetëm i grupit. Bëje dikë tjetër admin (te Kolegët) para se të largohesh.'
      : m.arsye === 'duke-ngarkuar' ? 'Prit pak, po ngarkohen kolegët e grupit…' : 'S\'mund të largohesh tani.';
  }
  async function ekPranoFtesen(f, btn) {
    if (ekK.gjendjaEQasjes() === 'ok') {
      var g = ekK.grupiInfo() || {}, m = ekK.mundTeLargohet();
      if (!m.ok) { toast(ekTekstiLargimit(m), 5000); return; }
      var po = await konfirmo('Të kalosh te grupi "' + (f.grupiEmri || '') + '"?',
        'Largohesh nga grupi "' + (g.emri || '') + '"' + (m.iFundit ? ' (je i fundit në grup: grupi fshihet bashkë me aktivitetin)' : m.trashegimtari ? ' (admin bëhet ' + (m.trashegimtariEmri || 'kolegu') + ')' : '') + '. Stoku dhe afatet e tua s\'preken.', 'Kalo');
      if (!po) return;
    }
    if (btn) btn.disabled = true;
    var r = await ekK.pranoFtesen(f);
    if (!r.ok) {
      if (btn) btn.disabled = false;
      toast(r.arsye === 'pronari-i-vetem' || r.arsye === 'duke-ngarkuar' ? ekTekstiLargimit(r) : r.leje || r.arsye === 'ftesa-skadoi' ? 'Kjo ftesë s\'vlen më (u anulua ose grupi u fshi).' : 'S\'u pranua. Kontrollo internetin dhe provo përsëri.', 5000);
      return;
    }
    toast('U bashkove me grupin "' + (f.grupiEmri || '') + '".');
    __ekipiAnetari = null;
    ekZgjidhPamjen('anetaret');
  }
  async function ekLargohu() {
    var g = ekK.grupiInfo() || {}, m = ekK.mundTeLargohet();
    if (!m.ok) { toast(ekTekstiLargimit(m), 5000); return; }
    var po = await konfirmo('Të largohesh nga grupi "' + (g.emri || '') + '"?',
      m.iFundit ? 'Je i fundit në grup: grupi fshihet komplet, bashkë me aktivitetin. Stoku dhe afatet e tua s\'preken.'
        : (m.trashegimtari ? 'Je admini i grupit: kur largohesh, admin bëhet ' + (m.trashegimtariEmri || 'kolegu') + '. ' : '') +
          'S\'do t\'i shohësh më kolegët dhe aktivitetin e këtij grupi. Stoku dhe afatet e tua s\'preken.', 'Largohu');
    if (!po) return;
    var r = await ekK.largohuNgaGrupi();
    if (!r.ok) { toast(r.arsye ? ekTekstiLargimit(r) : 'S\'u largove. Kontrollo internetin dhe provo përsëri.', 5000); return; }
    toast('U largove nga grupi "' + (g.emri || '') + '".');
  }
  var ekRiemertim = false;
  function tekstiGabimitTeFtesa(r) {
    return r.arsye === 'emri' ? 'Emri i përdoruesit: 3–40 shkronja/numra (a–z, 0–9, _ . -).'
      : r.arsye === 'vetja' ? 'Ky është emri yt.' : r.arsye === 'anetar' ? 'Ky përdorues është tashmë në grup.'
      : r.arsye === 'e-ftuar' ? 'Ky përdorues është ftuar tashmë.' : 'Ftesa s\'u dërgua. Kontrollo internetin dhe provo përsëri.';
  }

  function vizatoAnetaret(c) {
    c.textContent = '';
    var anetaret = ekAnetaret();
    var g = ekK.grupiInfo() || {};
    var pronar = ekK.eshtePronar();
    var ft = ekK.ftesatEMia();
    if (ft.length) {
      var hf = ekEl('div', 'af-grup-krye'); hf.appendChild(ekEl('span', null, 'Ftesë për një grup tjetër')); c.appendChild(hf);
      ft.forEach(function (f) { c.appendChild(ekFtesaEl(f)); });
    }
    // v242: kërkesat për t'u futur në grupin tim (vetëm admini i grupit)
    var kg = ekK.kerkesatEGrupit();
    if (kg.length) {
      var hkr = ekEl('div', 'af-grup-krye'); hkr.appendChild(ekEl('span', null, kg.length === 1 ? 'Një kërkesë për t\'u futur' : kg.length + ' kërkesa për t\'u futur')); c.appendChild(hkr);
      kg.forEach(function (k) { c.appendChild(ekKerkesaEGrupitEl(k)); });
    }
    // Karta e grupit (pronari e riemërton)
    var hk = ekEl('div', 'af-grup-krye'); hk.appendChild(ekEl('span', null, 'Grupi yt')); c.appendChild(hk);
    var kg = ekEl('div', 'ek-grupi-karta');
    if (pronar && ekRiemertim) {
      var fr = ekEl('div', 'ek-rresht-forma'); fr.style.cssText = 'flex:1;margin:0';
      var ir = ekEl('input'); ir.type = 'text'; ir.id = 'ekGrupiEmriRi'; ir.maxLength = 60; ir.value = g.emri || ''; ir.setAttribute('aria-label', 'Emri i ri i grupit');
      var bs = ekEl('button', 'btn', 'Ruaj'); bs.type = 'button';
      var ruaj = async function () {
        var em = ir.value.trim();
        if (em.length < 2) { ir.focus(); return; }
        bs.disabled = true;
        var r = await ekK.riemertoGrupin(em);
        bs.disabled = false;
        if (!r.ok) { toast('Emri s\'u ndryshua. Kontrollo internetin.', 4000); return; }
        ekRiemertim = false; vizatoEkipen();
      };
      bs.addEventListener('click', ruaj);
      ir.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); ruaj(); } else if (ev.key === 'Escape') { ekRiemertim = false; vizatoEkipen(); } });
      fr.appendChild(ir); fr.appendChild(bs); kg.appendChild(fr);
      setTimeout(function () { ir.focus(); }, 30);
    } else {
      var tg = ekEl('div', 'tk');
      tg.appendChild(ekEl('b', null, g.emri || 'Grupi'));
      tg.appendChild(ekEl('span', null, (pronar ? 'Ti je admin i grupit' : 'Koleg i grupit') + ' · ' + anetaret.length + (anetaret.length === 1 ? ' koleg' : ' kolegë')));
      kg.appendChild(tg);
      if (pronar) {
        var br = ekEl('button', 'af-pill', 'Ndrysho emrin'); br.type = 'button';
        br.addEventListener('click', function () { ekRiemertim = true; vizatoEkipen(); });
        kg.appendChild(br);
      }
    }
    c.appendChild(kg);
    // Pronari: fto shokët
    if (pronar) {
      var hi = ekEl('div', 'af-grup-krye'); hi.appendChild(ekEl('span', null, 'Fto një shok në grup')); c.appendChild(hi);
      var ff = ekEl('div', 'ek-rresht-forma');
      var ie = ekEl('input'); ie.type = 'text'; ie.id = 'ekFtoEmri'; ie.maxLength = 40; ie.autocomplete = 'off';
      ie.setAttribute('autocapitalize', 'none'); ie.setAttribute('autocorrect', 'off'); ie.spellcheck = false; ie.setAttribute('enterkeyhint', 'send');
      ie.placeholder = 'Emri i përdoruesit të tij'; ie.setAttribute('aria-label', 'Emri i përdoruesit që fton');
      var bf = ekEl('button', 'btn', 'Fto'); bf.type = 'button'; bf.id = 'ekFtoBtn';
      var fto = async function () {
        var em = ie.value.trim();
        if (!em) { ie.focus(); return; }
        bf.disabled = true;
        var r = await ekK.ftoNeGrup(em);
        bf.disabled = false;
        if (!r.ok) { toast(tekstiGabimitTeFtesa(r), 4500); return; }
        ekZbrazFushen(ie);
        toast('Ftesa iu dërgua "' + em.toLowerCase() + '". E sheh te Grupi kur e hap Stoku-n.', 4500);
      };
      bf.addEventListener('click', fto);
      ie.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); fto(); } });
      ff.appendChild(ie); ff.appendChild(bf); c.appendChild(ff);
      c.appendChild(ekEl('div', 'ek-grupi-hint', 'Shkruaj emrin e përdoruesit me të cilin shoku hyn në Stoku. Ai e sheh ftesën te Grupi dhe e pranon. Pa ftesë askush s\'e sheh grupin.'));
      var fe = ekK.ftesatEGrupit();
      if (fe.length) {
        var hp = ekEl('div', 'af-grup-krye'); hp.appendChild(ekEl('span', null, 'Ftesa në pritje (' + fe.length + ')')); c.appendChild(hp);
        fe.forEach(function (f) {
          var r = ekEl('div', 'artikull ek-menaxho'); r.style.cursor = 'default';
          r.appendChild(ekAvatar({ emri: f.perdoruesi }, false));
          var m = ekEl('div', 'majtas');
          m.appendChild(ekEl('div', 'emri', f.perdoruesi));
          m.appendChild(ekEl('div', 'kodi ek-stat-nen', 'Ftuar nga ' + (f.ngaEmri || '') + (f.koha ? ' · ' + EKL.kohaRelative(f.koha) : '')));
          r.appendChild(m);
          var ba = ekEl('button', 'af-pill', 'Anulo'); ba.type = 'button';
          ba.addEventListener('click', async function () { ba.disabled = true; var x = await ekK.anuloFtesen(f); if (!x.ok) { ba.disabled = false; toast('S\'u anulua. Kontrollo internetin.', 4000); } });
          r.appendChild(ba);
          c.appendChild(r);
        });
      }
    }
    var ha = ekEl('div', 'af-grup-krye'); ha.appendChild(ekEl('span', null, 'Kolegët')); c.appendChild(ha);
    var nOnline = anetaret.filter(function (a) { return a.uneJam || EKL.eshteOnline(a); }).length;
    c.appendChild(ekEl('div', 'ek-info-rresht', nOnline + ' online nga ' + anetaret.length + (anetaret.length === 1 ? ' koleg' : ' kolegë')));
    anetaret.forEach(function (a) {
      var r = ekEl('button', 'artikull'); r.type = 'button';
      r.appendChild(ekAvatar(a, true));
      var m = ekEl('div', 'majtas');
      var e = ekEl('div', 'emri', a.emri);
      if (a.pronar) e.appendChild(ekIkonaRoli('pronar', ekEl, function (t) { toast(t, 3500); }));
      if (a.admin) e.appendChild(ekIkonaRoli('admin', ekEl, function (t) { toast(t, 3500); }));
      m.appendChild(e);
      var pr = EKL.praniaIkone(a, a.uneJam, 'tel');
      var prEl = ekEl('span', 'ek-prania ' + (pr.online ? 'on' : 'off')); prEl.innerHTML = pr.html; prEl.title = pr.titulli; prEl.setAttribute('aria-label', pr.titulli);
      var prR = ekEl('div', 'kodi ek-stat-nen'); prR.style.marginTop = '3px'; prR.appendChild(prEl); m.appendChild(prR);
      r.appendChild(m);
      var n = ekNumero(a.afatet);
      var d = ekEl('div', 'ek-anetar-nr');
      d.appendChild(ekEl('b', null, !a.ngarkuar ? '…' : a.paTeDhena ? '–' : String(n.aktive)));
      d.appendChild(ekEl('span', null, 'në raft'));
      if (n.skaduar) d.appendChild(ekEl('span', 'ek-kuqe', n.skaduar === 1 ? '1 i skaduar' : n.skaduar + ' të skaduara'));
      r.appendChild(d);
      r.addEventListener('click', function () { ekHapAnetarin(a.uid); });
      c.appendChild(r);
    });
    if (pronar) vizatoPanelinEPronarit(c, anetaret);
    if (ekK.eshteAdmin()) vizatoLlogariteETjera(c);
    var bl = ekEl('button', 'btn tekst rrezik', 'Largohu nga grupi'); bl.type = 'button'; bl.id = 'ekLargohu'; bl.style.cssText = 'width:100%;margin-top:18px';
    bl.addEventListener('click', ekLargohu);
    c.appendChild(bl);
  }

  // ---- Paneli i pronarit të grupit (te Kolegët) ----
  function vizatoPanelinEPronarit(c, anetaret) {
    var h = ekEl('div', 'af-grup-krye'); h.appendChild(ekEl('span', null, 'Njoftim për krejt grupin')); c.appendChild(h);
    var nj = ekEl('div', 'ek-admin-njoftim');
    var ta = ekEl('textarea'); ta.id = 'ekAdminTekst'; ta.maxLength = 1000; ta.placeholder = 'Shkruaj njoftimin (i del secilit te zilja)';
    var bd = ekEl('button', 'btn', 'Dërgo te krejt grupi'); bd.type = 'button';
    bd.addEventListener('click', async function () {
      var t = ta.value.trim();
      if (!t) { ta.focus(); return; }
      bd.disabled = true;
      var r = await ekK.lajmeroEkipen(t);
      bd.disabled = false;
      if (!r.ok) { toast('Njoftimi s\'u dërgua. Kontrollo internetin dhe provo përsëri.', 4000); return; }
      ekZbrazFushen(ta);
      toast('Njoftimi u dërgua te krejt grupi' + (r.neRadhe ? ' (sapo të ketë internet).' : '.'));
    });
    nj.appendChild(ta); nj.appendChild(bd);
    c.appendChild(nj);
    var tjeret = anetaret.filter(function (a) { return !a.uneJam; });
    // v240: "Butonat +/-" s'janë më këtu: leje te Cilësimet → Përdoruesit (stokuPlusMinus)
    var hm = ekEl('div', 'af-grup-krye'); hm.appendChild(ekEl('span', null, 'Menaxho kolegët')); c.appendChild(hm);
    if (!tjeret.length) c.appendChild(ekInfo('S\'ka kolegë të tjerë ende. Fto shokët më lart.'));
    tjeret.forEach(function (a) {
      var r = ekEl('div', 'artikull ek-menaxho'); r.style.cursor = 'default';
      r.appendChild(ekAvatar(a, false));
      var m = ekEl('div', 'majtas');
      m.appendChild(ekEl('div', 'emri', a.emri));
      m.appendChild(ekEl('div', 'kodi ek-stat-nen', a.pronar ? 'Admin i grupit' : EKL.tekstiPranise(a)));
      r.appendChild(m);
      var bp = ekEl('button', 'af-pill', a.pronar ? 'Hiqe si admin' : 'Bëje admin'); bp.type = 'button';
      bp.title = a.pronar ? a.emri + ' mbetet koleg pa rol admini' : a.emri + ' mund të ftojë dhe të menaxhojë grupin';
      bp.addEventListener('click', async function () {
        bp.disabled = true;
        var x = await ekK.ndryshoRolin(a, a.pronar ? 'anetar' : 'pronar');
        bp.disabled = false;
        if (!x.ok) toast(x.arsye === 'pronari-i-vetem' ? 'Grupi duhet të ketë të paktën një admin.' : 'S\'u ndryshua. Kontrollo internetin.', 4000);
      });
      r.appendChild(bp);
      var bh = ekEl('button', 'af-pill', 'Hiq'); bh.type = 'button'; bh.title = 'Hiq ' + a.emri + ' nga grupi';
      bh.addEventListener('click', function () { ekHiqNgaEkipa(a, true); });
      r.appendChild(bh);
      if (ekK.eshteAdmin() && !a.admin) {
        var bf = ekEl('button', 'af-pill ek-pill-rrezik', 'Fshi'); bf.type = 'button'; bf.title = 'Fshi llogarinë e ' + a.emri + ' komplet';
        bf.addEventListener('click', function () { ekFshijLlogarine(a); });
        r.appendChild(bf);
      }
      c.appendChild(r);
    });
    var hp = ekEl('div', 'af-grup-krye'); hp.appendChild(ekEl('span', null, 'Pastrimi')); c.appendChild(hp);
    [['Pastro krejt aktivitetin', 'Të fshihet krejt aktiviteti?', 'Krejt historiku i aktivitetit fshihet për krejt grupin. Afatet s\'preken.', function () { return ekK.pastroAktivitetin(); }]].forEach(function (x) {
      var b = ekEl('button', 'btn tekst rrezik', x[0]); b.type = 'button'; b.style.cssText = 'width:100%';
      b.addEventListener('click', async function () {
        var po = await konfirmo(x[1], x[2], 'Fshi krejt');
        if (!po) return;
        b.disabled = true;
        var r = await x[3]();
        b.disabled = false;
        toast(r.ok ? (r.n === 1 ? 'U fshi 1 rresht.' : 'U fshinë ' + r.n + ' rreshta.') : 'S\'u fshi krejt. Kontrollo internetin dhe provo përsëri.', 4000);
      });
      c.appendChild(b);
    });
  }

  // ---- Administratori: llogaritë jashtë grupit tim (fshirja; ftesa nëse je pronar) ----
  var ekLlogariteKrejt = false;
  function vizatoLlogariteETjera(c) {
    var l = ekK.llogariteJashte();
    var h = ekEl('div', 'af-grup-krye'); h.appendChild(ekEl('span', null, 'Llogaritë e tjera (vetëm administratori) · ' + l.length)); c.appendChild(h);
    if (!l.length) { c.appendChild(ekInfo('S\'ka llogari të tjera.')); return; }
    (ekLlogariteKrejt ? l : l.slice(0, 15)).forEach(function (a) {
      var r = ekEl('div', 'artikull ek-menaxho'); r.style.cursor = 'default';
      r.appendChild(ekAvatar(a, false));
      var m = ekEl('div', 'majtas');
      m.appendChild(ekEl('div', 'emri', a.emri));
      var kur = a.kycurSe || a.aktivSe;
      m.appendChild(ekEl('div', 'kodi ek-stat-nen', (a.grupi ? 'Në një grup tjetër' : 'Pa grup') + (kur ? ' · u kyç ' + EKL.kohaRelative(kur) : '')));
      r.appendChild(m);
      if (ekK.eshtePronar()) {
        var bt = ekEl('button', 'af-pill', 'Fto'); bt.type = 'button';
        bt.addEventListener('click', async function () { bt.disabled = true; var x = await ekK.ftoNeGrup(a.emri); if (!x.ok) { bt.disabled = false; toast(tekstiGabimitTeFtesa(x), 4000); } else toast('Ftesa iu dërgua ' + a.emri + '.'); });
        r.appendChild(bt);
      }
      if (!a.admin) {
        var bf = ekEl('button', 'af-pill ek-pill-rrezik', 'Fshi'); bf.type = 'button'; bf.title = 'Fshi llogarinë e ' + a.emri + ' komplet';
        bf.addEventListener('click', function () { ekFshijLlogarine(a); });
        r.appendChild(bf);
      }
      c.appendChild(r);
    });
    if (!ekLlogariteKrejt && l.length > 15) {
      var bk = ekEl('button', 'btn tekst', 'Shfaq krejt (' + l.length + ')'); bk.type = 'button'; bk.style.cssText = 'width:100%';
      bk.addEventListener('click', function () { ekLlogariteKrejt = true; vizatoEkipen(); });
      c.appendChild(bk);
    }
  }

  // ---- Stoku i krejt kolegëve (vetëm administratori, vetëm lexim) ----
  var ekStoku = { uid: null, te: {} };
  function vizatoStokunAdmin(c, rifreskim) {
    var anetaret = ekAnetaret();
    var zgj = ekStoku.uid && anetaret.filter(function (a) { return a.uid === ekStoku.uid; })[0];
    if (!zgj) {
      ekStoku.uid = null;
      c.textContent = '';
      c.appendChild(ekEl('div', 'ek-info-rresht', 'Stoku i plotë i secilit (vetëm për administratorin). Zgjidh një koleg.'));
      var rr = ekEl('div', 'ekipi-rrjeti');
      anetaret.forEach(function (x) {
        var k = ekEl('button', 'folder-karta ekipi-karta'); k.type = 'button';
        var e = ekEl('div', 'emri', x.emri);
        k.appendChild(e);
        var d = ekStoku.te[x.uid];
        k.appendChild(ekEl('div', 'numri', d && d.ok ? d.produktet.length + (d.produktet.length === 1 ? ' produkt' : ' produkte') : 'Prek për ta parë'));
        k.addEventListener('click', function () { ekHapStokun(x.uid); });
        rr.appendChild(k);
      });
      c.appendChild(rr);
      return;
    }
    var d = ekStoku.te[zgj.uid];
    if (!rifreskim || !$('ekStokLista')) {
      c.textContent = '';
      var pr = ekEl('button', 'btn tekst', '← Krejt kolegët'); pr.type = 'button'; pr.style.cssText = 'padding-left:0;margin-bottom:6px';
      pr.addEventListener('click', function () { ekStoku.uid = null; vizatoEkipen(); });
      c.appendChild(pr);
      var pm = ekEl('div', 'ek-stok-permb'); pm.id = 'ekStokPermb'; c.appendChild(pm);
      var kk = ekEl('div', 'kerko-kuti');
      kk.innerHTML = '<svg class="kerko-ikona" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m21 21-4.35-4.35"></path></svg>';
      var inp = ekEl('input'); inp.type = 'search'; inp.id = 'ekStokKerko'; inp.autocomplete = 'off'; inp.spellcheck = false;
      inp.placeholder = 'Kërko emër ose barkod'; inp.setAttribute('aria-label', 'Kërko në stok');
      inp.addEventListener('input', function () { vizatoEkipen(true); });
      kk.appendChild(inp); c.appendChild(kk);
      var l0 = ekEl('div'); l0.id = 'ekStokLista'; c.appendChild(l0);
    }
    $('ekipiTitulli').textContent = zgj.emri + ' · stoku';
    var pmb = $('ekStokPermb'), lista = $('ekStokLista');
    pmb.textContent = ''; lista.textContent = '';
    if (!d) { lista.appendChild(ekInfo('Duke ngarkuar stokun…')); return; }
    if (!d.ok) { lista.appendChild(ekBosh('S\'u lexua stoku', 'Kontrollo internetin (ose rregullat e Firebase-it).')); return; }
    var copa = 0; d.produktet.forEach(function (p) { copa += p.sasia | 0; });
    pmb.appendChild(ekEl('span', null, d.produktet.length + (d.produktet.length === 1 ? ' produkt' : ' produkte') + ' · ' + copa + ' copë gjithsej'));
    var bx = ekEl('button', 'btn dyte', 'Excel'); bx.type = 'button';
    bx.addEventListener('click', function () {
      var d2 = new Date();
      var emri = 'stoku_' + sluguFolderit(zgj.emri) + '_' + d2.getFullYear() + '-' + dyShifra(d2.getMonth() + 1) + '-' + dyShifra(d2.getDate()) + '.xlsx';
      var bajtet = StokuXlsx.buildWorkbook(EKL.fletetEStokut(zgj.emri, d.produktet, d.foldera));
      ndajOseShkarko({ skedari: new File([bajtet], emri, { type: MIME_XLSX }), emri: emri }, 'Stoku i ' + zgj.emri);
    });
    pmb.appendChild(bx);
    var emriF = {}; d.foldera.forEach(function (f) { emriF[f.id] = f.emri; });
    var k = $('ekStokKerko').value.trim().toLowerCase();
    var te = d.produktet.filter(function (p) { return !k || ((p.emri || '') + ' ' + p.barkodi + ' ' + (emriF[p.kategoriaId] || '')).toLowerCase().indexOf(k) !== -1; })
      .sort(function (a, b) { return String(a.emri || '').localeCompare(String(b.emri || ''), 'sq'); });
    if (!te.length) { lista.appendChild(ekBosh(k ? 'Asgjë s\'u gjet' : 'Stoku është bosh')); return; }
    var frag = document.createDocumentFragment();
    te.slice(0, EKIPI_LIMITI).forEach(function (p) {
      var r = ekEl('div', 'artikull'); r.style.cursor = 'default';
      var m = ekEl('div', 'majtas');
      m.appendChild(ekEl('div', 'emri', p.emri || '(pa emër)'));
      m.appendChild(ekEl('div', 'kodi', p.barkodi + (emriF[p.kategoriaId] ? ' · ' + emriF[p.kategoriaId] : '')));
      r.appendChild(m);
      r.appendChild(ekEl('div', 'sasia', String(p.sasia | 0)));
      frag.appendChild(r);
    });
    if (te.length > EKIPI_LIMITI) frag.appendChild(ekInfo('Shfaqen ' + EKIPI_LIMITI + ' nga ' + te.length + '. Kërko për t\'i gjetur të tjerat.'));
    lista.appendChild(frag);
  }
  async function ekHapStokun(uid) {
    ekStoku.uid = uid;
    $('ekipiTrup').scrollTop = 0;
    vizatoEkipen();
    var r = await ekK.merrStokun(uid);
    ekStoku.te[uid] = r.ok ? { ok: true, produktet: r.produktet, foldera: r.foldera } : { ok: false };
    if (ekPamja === 'stoku' && ekStoku.uid === uid) vizatoEkipen(true);
  }

  // ---- Pronari i grupit: heq një koleg ----
  async function ekHiqNgaEkipa(a, qendro) {
    var po = await konfirmo('Të hiqet nga grupi?', a.emri + ' s\'do ta shohë më grupin (afatet e kolegëve dhe aktivitetin) derisa ta ftosh sërish. Stoku dhe afatet e tij s\'preken.', 'Hiqe');
    if (!po) return;
    var r = await ekK.hiqNgaEkipa(a);
    if (!r.ok) { toast('S\'u hoq. Kontrollo internetin dhe provo përsëri.', 4000); return; }
    if (!qendro) ekipiKthehuTeKartat();
    toast(a.emri + ' u hoq nga grupi.');
  }
  // Administratori: fshirja e plotë e një llogarie (stoku, afatet, profili; llogaria e hyrjes fshihet kur ai e hap Stoku-n)
  async function ekFshijLlogarine(a) {
    var po = await konfirmo('Të fshihet llogaria e ' + a.emri + '?',
      'Fshihen komplet stoku, afatet, fletët dhe profili i ' + a.emri + '. Nuk mund të hyjë më me këtë llogari (emri lirohet dhe mund të krijohet sërish si llogari e re, bosh). Kjo S\'KTHEHET MË.', 'Fshije komplet', 3);
    if (!po) return;
    var r = await ekK.fshijLlogarine(a);
    if (!r.ok) { toast(r.leje ? 'S\'u fshi: rregullat e Firebase-it s\'e lejojnë ende (duhen rregullat v116).' : 'S\'u fshi. Kontrollo internetin dhe provo përsëri.', 5000); return; }
    if (__ekipiAnetari === a.uid) ekipiKthehuTeKartat(); else vizatoEkipen();
    toast('Llogaria e ' + a.emri + ' u fshi' + (r.mbetur ? ' (disa të dhëna s\'u fshinë, provo përsëri më vonë).' : '.'), 4000);
  }

  // ---- Statistikat ----
  function ekSeksionetEStatistikave(c, st) {
    function seksion(titulli, rreshtat, bosh) {
      var h = ekEl('div', 'af-grup-krye'); h.appendChild(ekEl('span', null, titulli)); c.appendChild(h);
      if (!rreshtat.length) { c.appendChild(ekInfo(bosh)); return; }
      rreshtat.forEach(function (x) {
        var r = ekEl('div', 'artikull'); r.style.cursor = 'default';
        var m = ekEl('div', 'majtas');
        m.appendChild(ekEl('div', 'emri', x[0]));
        if (x[1]) m.appendChild(ekEl('div', 'kodi ek-stat-nen', x[1]));
        r.appendChild(m);
        r.appendChild(ekEl('div', 'ek-nr', String(x[2])));
        c.appendChild(r);
      });
    }
    seksion('Sipas kolegëve', st.perAnetar.map(function (x) {
      return [x.emri, (x.skaduara === 1 ? '1 i skaduar' : x.skaduara + ' të skaduara') + ' · ' + x.afer + ' afër skadimit · ' + x.hequr30 + ' hequr (30 ditë)', x.aktive];
    }), 'Asnjë koleg.');
    seksion('Furnizuesit me më shumë produkte që skadojnë', st.furnizuesit.map(function (x) {
      return [x.emri, 'të skaduara ose afër skadimit', x.n];
    }), 'Asnjë produkt afër skadimit me furnizues të shënuar.');
    seksion('Kush hoqi më shumë nga rafti (30 ditët e fundit)', st.heqesit.map(function (x) {
      return [x.emri, '', x.n];
    }), 'Askush s\'ka hequr ende gjë nga rafti.');
  }

  // ---- Zilja: njoftimet personale ----
  async function ekHapNjoftimet() {
    if (!ekK) return;
    var lista = $('ekNjLista');
    lista.textContent = '';
    lista.appendChild(ekInfo('Duke ngarkuar…'));
    $('ekNjLejo').hidden = !(njoftimetMbeshteten() && Notification.permission === 'default');
    $('dlgEkNjoftimet').classList.add('hapur');
    var palexuara = {};
    ekK.gj.njoftimetPalexuara.forEach(function (n) { palexuara[n.id] = true; });
    var te = await ekK.merrNjoftimet();
    lista.textContent = '';
    $('ekNjFshiKrejt').hidden = !te.length;
    ekNjTeShfaqura = te.map(function (n) { return n.id; });
    if (!te.length) lista.appendChild(ekBosh('S\'ka njoftime', 'Këtu të del kur një koleg heq nga rafti një nga produktet e tua që ka skaduar.'));
    te.forEach(function (n) {
      var r = ekEl('div', 'ek-nj' + (palexuara[n.id] ? ' e-re' : ''));
      var fshi = ekEl('button', 'ek-nj-fshi', '✕'); fshi.type = 'button'; fshi.setAttribute('aria-label', 'Fshije njoftimin'); fshi.title = 'Fshije njoftimin';
      fshi.addEventListener('click', async function () {
        fshi.disabled = true;
        var res = await ekK.fshijNjoftimet([n.id]);
        if (!res || !res.ok) { fshi.disabled = false; toast('S\'u fshi. Kontrollo internetin dhe provo sërish.'); return; }
        r.remove();
        ekNjTeShfaqura = ekNjTeShfaqura.filter(function (id) { return id !== n.id; });
        if (!ekNjTeShfaqura.length) { $('ekNjFshiKrejt').hidden = true; lista.appendChild(ekBosh('S\'ka njoftime', 'Këtu të del kur një koleg heq nga rafti një nga produktet e tua që ka skaduar.')); }
      });
      r.appendChild(ekAvatar({ emri: n.emri }, false));
      var b = ekEl('div', 'ek-nj-trup', EKL.tekstiNjoftimit(n));
      b.appendChild(ekEl('div', 'ek-nj-koha', EKL.kohaRelative(n.koha)));
      if (/^kerkese-/.test(n.lloji)) {
        var lp = EKL.listaEKerkeses(n);
        if (lp.length > 1 || (lp[0] && lp[0].data)) {
          var ul = ekEl('ul', 'ek-nj-produktet');
          lp.forEach(function (x) { ul.appendChild(ekEl('li', null, EKL.rreshtiIProduktit(x))); });
          b.appendChild(ul);
        }
      }
      if (n.lloji === 'kerkese-heqje') b.appendChild(ekButoniKerkeses(n));
      if (n.lloji === 'hequr' && n.afatId) b.appendChild(ekButonatEHeqjes(n, b.firstChild));
      r.appendChild(b);
      r.appendChild(fshi);
      lista.appendChild(r);
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
    ekHapNjoftimet(); // mbushet sërish (nëse kishte më shumë se sa u shfaqën)
  });
  // Heqja nga një koleg: pronari e pranon (hiqet te afatet e tij) ose e refuzon (mbetet në raft)
  function ekButonatEHeqjes(n, tekstiEl) {
    var w = ekEl('div', 'ek-nj-veprim');
    if (n.vendim) { w.appendChild(ekEl('span', 'ek-nj-kryer', n.vendim === 'pranuar' ? '✓ E pranove' : '✕ E refuzove')); return w; }
    if (!leja('afatetNdrysho')) return w; // v230: vendimi e ndryshon afatin tënd ("Ndrysho afatet")
    var bp = ekEl('button', 'btn ek-nj-btn', 'Prano'); bp.type = 'button';
    var br = ekEl('button', 'btn tekst ek-nj-btn', 'Refuzo'); br.type = 'button';
    async function vendos(pranoj) {
      if (!leja('afatetNdrysho')) return;
      bp.disabled = br.disabled = true;
      var res = await ekK.vendosPerHeqjen(n, pranoj);
      if (!res || !res.ok) { bp.disabled = br.disabled = false; toast('S\'u ruajt. Kontrollo internetin dhe provo sërish.'); return; }
      if (tekstiEl && tekstiEl.nodeType === 3) tekstiEl.nodeValue = EKL.tekstiNjoftimit(n);
      w.textContent = '';
      w.appendChild(ekEl('span', 'ek-nj-kryer', pranoj ? '✓ E pranove' : '✕ E refuzove'));
      toast(pranoj ? '"' + (n.produkti || 'Produkti') + '" u hoq nga rafti. ' + (n.emri || 'Kolegu') + ' u njoftua.' : (n.emri || 'Kolegu') + ' u njoftua që produkti mbetet në raft.');
    }
    bp.addEventListener('click', function () { vendos(true); });
    br.addEventListener('click', function () { vendos(false); });
    w.appendChild(bp); w.appendChild(br);
    return w;
  }
  function ekButoniKerkeses(n) {
    var w = ekEl('div', 'ek-nj-veprim');
    var kr = ekK.kryeresiIKerkeses(n);
    if (kr) { w.appendChild(ekEl('span', 'ek-nj-kryer', kr.uneJam ? '✓ E hoqe nga rafti' : '✓ E hoqi ' + kr.emri)); return w; }
    var bt = ekEl('button', 'btn ek-nj-btn', 'E hoqa nga rafti'); bt.type = 'button';
    if (!leja('grupiKerkesat')) return w;
    bt.addEventListener('click', async function () {
      if (!leja('grupiKerkesat')) return;
      bt.disabled = true; bt.textContent = 'Duke ruajtur…';
      var res = await ekK.kryejKerkesen(n);
      if (res && res.ok) { w.textContent = ''; w.appendChild(ekEl('span', 'ek-nj-kryer', '✓ E hoqe nga rafti')); toast((n.emri || 'Kolegu') + ' u njoftua që e hoqe.'); }
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
    var prod = Object.keys(produktet).map(function (k) { return produktet[k]; }).filter(function (p) { return p && (p.emri || p.barkodi); })
      .sort(function (a, b) { return String(a.emri || a.barkodi).localeCompare(String(b.emri || b.barkodi)); }).map(function (p) {
        var fe = emriFolderit(p.kategoriaId);
        return { produkti: String(p.emri || '').trim(), barkodi: String(p.barkodi || ''), nen: [fe, 'sasia ' + (Number(p.sasia) || 0)].filter(Boolean).join(' · ') };
      });
    krkZgjedhesi = EKL.zgjedhesIKerkeses($('krkZgjedhesi'), { skaduara: skaduara, produktet: prod }, perditesoDergo);
    $('krkShenim').value = ''; $('krkGabim').textContent = '';
    $('krkDergo').disabled = false; $('krkDergo').textContent = 'Dërgo';
    $('dlgKerkese').classList.add('hapur');
    if (!kol.length) $('krkGabim').textContent = 'S\'ka ende kolegë në grup.';
  }
  function mbyllKerkesen() { $('dlgKerkese').classList.remove('hapur'); }
  var krkZgjedhesi = null;
  function perditesoDergo(n) { $('krkDergo').textContent = n ? 'Dërgo (' + n + ')' : 'Dërgo'; if (n) $('krkGabim').textContent = ''; }
  async function dergoKerkesen() {
    if (!leja('grupiKerkesat')) { mbyllKerkesen(); return; }
    var zgj = krkZgjedhesi ? krkZgjedhesi.zgjedhur() : [];
    if (!zgj.length) { $('krkGabim').textContent = 'Shëno të paktën një produkt nga lista.'; return; }
    var k = { produktet: zgj };
    var per = $('krkPer').value, perEmri = per ? $('krkPer').options[$('krkPer').selectedIndex].textContent : '';
    $('krkDergo').disabled = true; $('krkDergo').textContent = 'Duke dërguar…';
    var r = await ekK.kerkoHeqjen({ produktet: k.produktet, shenim: $('krkShenim').value, perUid: per });
    $('krkDergo').disabled = false; perditesoDergo(zgj.length);
    if (!r || !r.ok) { $('krkGabim').textContent = r && r.arsye === 'pa-kolege' ? 'S\'ka ende kolegë në grup.' : 'S\'u dërgua. Kontrollo internetin dhe provo sërish.'; return; }
    mbyllKerkesen();
    toast(r.neRadhe ? 'Kërkesa do të dërgohet sapo të kthehet interneti.' : 'Kërkesa u dërgua te ' + (per ? perEmri : 'krejt grupi') + '.');
  }
  $('krkAnulo').addEventListener('click', mbyllKerkesen);
  $('krkDergo').addEventListener('click', dergoKerkesen);
  $('krkShenim').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); dergoKerkesen(); } });

  $('dlgKerkese').addEventListener('click', function (ev) { if (ev.target === $('dlgKerkese')) mbyllKerkesen(); });
  $('ekZile').addEventListener('click', ekHapNjoftimet);
  $('ekNjMbyll').addEventListener('click', function () { $('dlgEkNjoftimet').classList.remove('hapur'); });
  $('dlgEkNjoftimet').addEventListener('click', function (ev) { if (ev.target === $('dlgEkNjoftimet')) $('ekNjMbyll').click(); });
  $('ekNjLejo').addEventListener('click', function () {
    $('dlgEkNjoftimet').classList.remove('hapur');
    Promise.resolve(Notification.requestPermission()).then(function (p) {
      if (p === 'granted') { regjistroKontrollinPeriodik(); aktivizoPushin(); toast('Njoftimet u aktivizuan.'); }
      else if (p === 'denied') toast('Njoftimet u refuzuan. Mund t\'i lejosh te cilësimet e telefonit → Aplikacionet → Stoku → Njoftimet.', 5000);
    }).catch(function () { /* ok */ });
  });

  // Pronari e pranoi heqjen e një kolegu: afati shënohet i hequr (me emrin e kolegut)
  function zbatoHeqjetEKolegeve(lista) {
    var zbatuar = [];
    lista.forEach(function (nj) {
      for (var i = 0; i < afatet.length; i++) {
        if (afatet[i].id !== nj.afatId) continue;
        if (afatet[i].statusi !== 'hequr') {
          afatet[i] = Object.assign({}, afatet[i], { statusi: 'hequr', hequrSe: nj.koha || Date.now(), hequrNga: nj.emri || '', ndryshuarSe: Date.now() });
          zbatuar.push(nj);
        }
        break;
      }
    });
    if (!zbatuar.length) return;
    afatet = afatet.slice();
    ruajAfatet();
    // (toast-in e jep butoni "Prano")
  }
  // Njoftim i sistemit kur aplikacioni është në sfond; kur është përpara, mjafton shenja/toast-i
  function njoftoNgaEkipa(nj) {
    if (!leja('grupi')) return; // v231: pa lejen "Grupi" s'del asnjë njoftim i grupit
    if (!document.hidden) {
      if (nj.pamja === 'anetaret') toast(nj.teksti, 5000);
      else if (/^Stoku · Hiqe/.test(nj.titulli)) toast(nj.teksti, 6000);
      return;
    }
    if (nj.vetemNePerpara) return; // vjen si push nga Worker-i
    if (!njoftimetMbeshteten() || Notification.permission !== 'granted') return;
    navigator.serviceWorker.ready.then(function (reg) {
      return reg.showNotification(nj.titulli, { body: nj.teksti, tag: nj.tag, icon: './icon-192.png?v=3', badge: './logo/badge-96.png?v=1', vibrate: [180, 80, 180],
        data: { url: './index.html#ekipa-' + (nj.pamja === 'anetaret' || nj.pamja === 'njoftimet' ? nj.pamja : 'afatet') } });
    }).catch(function () { /* ok */ });
  }
  function hapEkipenNgaNjoftimi(pamja) {
    if (window.StokuPorta && window.StokuPorta.eHapur()) return false;
    if (!$('dlgEkipi').classList.contains('hapur')) $('btnEkipi').click();
    if (['aktiviteti', 'kalendari', 'anetaret', 'afatet'].indexOf(pamja) !== -1) ekZgjidhPamjen(pamja);
    if (pamja === 'njoftimet') setTimeout(ekHapNjoftimet, 50);
    return true;
  }

  // Dëgjuesit e përhershëm (njoftimet, mesazhi i fundit, prania) nisin/ndalen me hyrjen
  function ekNisOseNdal() {
    if (!ekK) return;
    if (perdoruesiAktual() && !ngaVizitori()) ekK.nisGjithmone(); else ekK.ndalGjithmone();
    if ($('dlgEkipi').classList.contains('hapur')) { if (perdoruesiAktual()) ekK.hap(); vizatoEkipen(); }
    rifreskoShenjatEEkipes();
  }
  window.addEventListener('stoku-auth-ndryshoi', ekNisOseNdal);
  window.addEventListener('stoku-cloud-gati', ekNisOseNdal);
  if (window.__stokuCloud && window.__stokuCloud.authGati) ekNisOseNdal();
  $('afPrapa').addEventListener('click', function () { if (afZgjedhja) dilNgaZgjedhja(); else mbyllAfatetFaqe(); });
  $('afKerko').addEventListener('input', renderAfatet);
  Array.prototype.forEach.call(document.querySelectorAll('#afFiltrat button'), function (b) {
    b.addEventListener('click', function () { afFiltri = b.getAttribute('data-f'); renderAfatet(); });
  });

  // Sasia e shkruar si shumë ("60+30") zëvendësohet në fushë me rezultatin (90)
  function vendosRezultatinESasise(inp) {
    if (!AF.sasiaSiShume(inp.value)) return;
    inp.value = String(AF.lexoSasine(inp.value));
    inp.dispatchEvent(new Event('input'));
  }

  // ---------- Dialogu: shto / ndrysho një afat ----------
  var afatNeDialog = null;
  function mbushFurnizuesit() {
    var dl = $('afFurnizuesit');
    dl.textContent = '';
    furnizuesitPerSugjerim().forEach(function (f) { var o = document.createElement('option'); o.value = f; dl.appendChild(o); });
    try { if (typeof ekK !== 'undefined' && ekK && ekK.lexoFurnizuesitPublike) ekK.lexoFurnizuesitPublike(); } catch (e) { /* ok */ }
  }
  // v211: sugjerimet e furnizuesit për këdo: afatet e mia + furnizuesit e miratuar të grupit + lista e administratorit
  // (e lexon çdo përdorues i kyçur, edhe jashtë grupit). Shfletuesi i filtron sipas shkronjave që shtyp.
  function furnizuesitPerSugjerim() {
    var m = {};
    function shto(f) { f = String(f || '').replace(/\s+/g, ' ').trim(); var c = f.toLocaleLowerCase('sq'); if (f && !m[c]) m[c] = f; }
    afatet.forEach(function (a) { shto(a.furnizuesi); });
    try {
      var k = KJ();
      if (k) window.StokuAfatet.listaEFurnizuesve([], produktet, k.lista(), k.furnizuesit()).forEach(function (f) { if (!f.nePritje) shto(f.emri); });
    } catch (e) { /* ok */ }
    try { var pub = JSON.parse(localStorage.getItem('stoku:furnizuesit:publike') || '[]'); if (Array.isArray(pub)) pub.forEach(shto); } catch (e) { /* ok */ }
    return Object.keys(m).map(function (c) { return m[c]; }).sort(function (a, b) { return a.localeCompare(b, 'sq'); });
  }
  function hapAfatin(id) {
    var a = null;
    afatet.some(function (x) { if (x.id === id) { a = x; return true; } return false; });
    if (!a && !leja('afatetShto')) return;
    // v230: pa "Ndrysho afatet" afati hapet vetëm për t'u parë (pa Ruaj, pa datat e shpejta, pa veprimet; v231: pa shënim)
    var vetemLexim = !!a && !leja('afatetNdrysho');
    $('dlgAfat').classList.toggle('vetem-lexim', vetemLexim);
    ['afatBarkodi', 'afatEmri', 'afatData', 'afatSasia', 'afatFurnizuesi'].forEach(function (i) { $(i).readOnly = vetemLexim; });
    $('afatAnulo').textContent = vetemLexim ? 'Mbyll' : 'Anulo';
    afatNeDialog = a ? a.id : null;
    mbushFurnizuesit();
    $('afatTitulli').textContent = a ? (a.emri || a.barkodi || 'Afati') : 'Afat i ri';
    $('afatBarkodi').value = a ? (a.barkodi || '') : '';
    $('afatEmri').value = a ? (a.emri || '') : '';
    $('afatData').value = a && a.data ? AF.formatoPerFushe(a.data) : '';
    $('afatFurnizuesi').value = a ? (a.furnizuesi || '') : '';
    $('afatSasia').value = a && a.sasia !== '' && a.sasia !== undefined ? String(a.sasia) : '';
    // v241: marketi (vetëm kur ka markete); afati i ri merr marketin ku je
    $('afatMarketiRresht').hidden = !kaMarkete();
    if (kaMarkete()) {
      var sm = $('afatMarketi'); sm.textContent = '';
      var o0 = document.createElement('option'); o0.value = ''; o0.textContent = a ? 'Pa market' : 'Zgjidh marketin'; sm.appendChild(o0);
      MK.rendit(marketet).forEach(function (m) { var o = document.createElement('option'); o.value = m.id; o.textContent = m.emri; sm.appendChild(o); });
      sm.value = a ? (a.m && MK.sipasId(marketet, a.m) ? a.m : '') : (idMarketitAktiv() || '');
      sm.disabled = vetemLexim;
    }
    $('afatFshij').style.display = a ? '' : 'none';
    // Barkodi: me kamerë (butoni) ose, në modalitetin PDA, me skanerin e PDA-së direkt në fushë
    $('afatSkano').style.display = opsione.pda ? 'none' : '';
    $('afatPdaHint').style.display = opsione.pda && !a ? '' : 'none';
    var info = $('afatInfo');
    var sv = $('afatStatusVeprime');
    sv.textContent = '';
    if (a) {
      var st = AF.statusi(a);
      info.className = 'af-info-dlg ' + st;
      info.textContent = AF.pershkrimi(a) + (a.krijuarNga ? '\nShtuar nga: ' + a.krijuarNga : '');
      info.style.whiteSpace = 'pre-line';
      info.style.display = '';
      var veprime = [];
      if (st === 'skaduar') veprime.push(['U hoq nga rafti', function () { shenoHequr(a); }, 'kontroll']);
      else if (st === 'hequr') veprime.push(['Rikthe si aktiv', function () { riktheAktiv(a); }, 'rikthe']);
      veprime.forEach(function (v) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'btn dyte me-ikone';
        b.innerHTML = IKONAT_AF[v[2]]; b.appendChild(document.createTextNode(v[0]));
        b.addEventListener('click', function () { mbyllAfatin(); v[1](); });
        sv.appendChild(b);
      });
    } else {
      info.style.display = 'none';
    }
    vizatoDatatEShpejta();
    $('dlgAfat').classList.add('hapur');
    if (!a) $('afatBarkodi').focus();
  }
  function mbyllAfatin() { $('dlgAfat').classList.remove('hapur'); afatNeDialog = null; }
  function ruajAfatin() {
    if ($('dlgAfat').classList.contains('vetem-lexim')) { mbyllAfatin(); return; }
    if (!leja(afatNeDialog ? 'afatetNdrysho' : 'afatetShto')) return;
    var b = $('afatBarkodi').value.trim().replace(/\s+/g, '');
    var emri = $('afatEmri').value.trim();
    var data = AF.lexoDatenEFushes($('afatData').value) || '';
    var f = $('afatFurnizuesi').value.trim();
    var sasiaTx = $('afatSasia').value.trim();
    var sasia = AF.lexoSasine(sasiaTx);
    if (sasiaTx && sasia === '') { toast('Sasia duhet të jetë numër i plotë (p.sh. 12).'); $('afatSasia').focus(); return; }
    if (!b && !emri) { toast('Shkruaj barkodin ose emrin e produktit.'); $('afatBarkodi').focus(); return; }
    if (!data) { toast('Shkruaj datën e skadimit, p.sh. 31-12-26.'); $('afatData').focus(); return; }
    var mkId = kaMarkete() ? $('afatMarketi').value : null; // v241
    if (kaMarkete() && !afatNeDialog && !mkId) { toast('Zgjidh marketin ku është ky produkt.'); $('afatMarketi').focus(); return; }
    // afatNeDialog është id-ja; furnizuesi i mëparshëm merret nga vetë afati (përndryshe çdo ruajtje e një afati të vjetër
    // e kthente si "të ri" një furnizues të fshirë)
    var afPara = afatNeDialog ? afatet.filter(function (x) { return x.id === afatNeDialog; })[0] : null;
    var furnPara = (afPara && afPara.furnizuesi) || '';
    mesoNgaPerdoruesi(b, emri, f); // herën tjetër ky barkod plotëson vetë emrin dhe furnizuesin
    if (f && f !== furnPara) regjistroFurnizuesinERi(f); // v212, v214: për këdo
    var tani = Date.now();
    // Afati që po ndryshohej u fshi ndërkohë nga një pajisje tjetër: ruhet si afat i ri (ndryshimi s'humbet pa fjalë)
    var uFshiNderkohe = !!afatNeDialog && !afPara;
    if (afatNeDialog && afPara) {
      var ndr = { barkodi: b, emri: emri, data: data, sasia: sasia, furnizuesi: f };
      if (kaMarkete()) ndr.m = mkId || '';
      perditesoAfatin(afatNeDialog, ndr);
    } else {
      var iRi = { id: AF.idERe(), barkodi: b, emri: emri, data: data, sasia: sasia, furnizuesi: f, statusi: 'aktiv',
        krijuarSe: tani, ndryshuarSe: tani, krijuarNga: emriPerdoruesitAktual() };
      if (mkId) iRi.m = mkId;
      afatet = afatet.concat([iRi]);
      ruajAfatet();
      if (perdoruesiAktual() && ekK) ekK.afateTeReja(1, false);
    }
    mbyllAfatin();
    toast(uFshiNderkohe ? 'Ky afat u fshi nga një pajisje tjetër ndërkohë. U ruajt si afat i ri.' : 'Afati u ruajt.', uFshiNderkohe ? 4500 : undefined);
  }
  async function fshijAfatin() {
    if (!afatNeDialog || !leja('afatetFshi')) return;
    var id = afatNeDialog;
    var po = await konfirmo('Të fshihet afati?', 'Afati fshihet nga të gjitha pajisjet. Nëse produkti thjesht u hoq nga rafti, përdor "U hoq nga rafti" (mbetet si histori).', T('fshij'));
    if (!po) return;
    afatet = afatet.filter(function (x) { return x.id !== id; });
    shenoAfatinEFshire(id);
    mbyllAfatin();
    ruajAfatet();
  }
  $('afShto').addEventListener('click', function () { hapAfatin(null); });
  $('afatSkano').addEventListener('click', function () {
    var perAfat = function (barkodi) {
      $('afatBarkodi').value = barkodi;
      $('afatBarkodi').dispatchEvent(new Event('change')); // plotëson emrin/furnizuesin nëse njihen
      ($('afatEmri').value.trim() ? $('afatData') : $('afatEmri')).focus();
    };
    kameraPerAfat = perAfat; // vendoset para hapjes, që edhe skanimi më i shpejtë të shkojë te afati
    hapKamere().then(function () {
      if (!$('kamera').classList.contains('hapur') && kameraPerAfat === perAfat) kameraPerAfat = null; // s'u hap
    });
  });
  $('afatRuaj').addEventListener('click', ruajAfatin);
  $('afatAnulo').addEventListener('click', mbyllAfatin);
  $('afatFshij').addEventListener('click', fshijAfatin);
  $('dlgAfat').addEventListener('click', function (ev) { if (ev.target === $('dlgAfat')) mbyllAfatin(); });
  $('afatBarkodi').addEventListener('change', function () {
    var b = $('afatBarkodi').value.trim();
    if (!$('afatEmri').value.trim()) $('afatEmri').value = emriNgaProduktet(b);
    if (!$('afatFurnizuesi').value.trim()) $('afatFurnizuesi').value = furnizuesiNgaAfatet(b);
  });
  $('afatBarkodi').addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter') { ev.preventDefault(); $('afatBarkodi').dispatchEvent(new Event('change')); $('afatEmri').focus(); }
  });
  $('afatEmri').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); $('afatData').focus(); } });
  AF.lidhFushenEDates($('afatData'));
  $('afatSasia').addEventListener('change', function () { vendosRezultatinESasise($('afatSasia')); });
  // Datat e shpejta (1 javë, 2 javë, 1 muaj, 3 muaj): vetëm e plotësojnë fushën e datës
  var AF_DATAT_SHPEJTA = [['1 javë', 7, 0], ['2 javë', 14, 0], ['1 muaj', 0, 1], ['3 muaj', 0, 3]];
  var AF_MUAJT_SHKURT = ['Jan', 'Shk', 'Mar', 'Pri', 'Maj', 'Qer', 'Kor', 'Gus', 'Sht', 'Tet', 'Nën', 'Dhj'];
  function dataEShpejte(z) {
    var d = new Date(); d.setHours(12, 0, 0, 0);
    if (z[1]) d.setDate(d.getDate() + z[1]);
    if (z[2]) { // "1 muaj" nga 31 janari = 28/29 shkurt (jo 3 mars)
      var dita = d.getDate();
      d.setDate(1); d.setMonth(d.getMonth() + z[2]);
      d.setDate(Math.min(dita, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
    }
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function vizatoDatatEShpejta() {
    var c = $('afatDatat');
    c.textContent = '';
    AF_DATAT_SHPEJTA.forEach(function (z) {
      var iso = dataEShpejte(z);
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'sb-date'; b.setAttribute('data-iso', iso);
      var p = iso.split('-');
      b.innerHTML = '<span class="sb-date__day"></span><span class="sb-date__mon"></span><span class="sb-date__sa"></span>';
      b.children[0].textContent = p[2];
      b.children[1].textContent = AF_MUAJT_SHKURT[parseInt(p[1], 10) - 1];
      b.children[2].textContent = z[0];
      b.addEventListener('click', function () {
        $('afatData').value = AF.formatoPerFushe(iso);
        rifreskoDatenEAfatit();
      });
      c.appendChild(b);
    });
    rifreskoDatenEAfatit();
  }
  function rifreskoDatenEAfatit() {
    var iso = AF.lexoDatenEFushes($('afatData').value);
    Array.prototype.forEach.call(document.querySelectorAll('#afatDatat .sb-date'), function (b) {
      b.setAttribute('aria-pressed', iso && b.getAttribute('data-iso') === iso ? 'true' : 'false');
    });
    var n = iso ? AF.ditetDeri(iso) : null;
    $('afatDataHint').textContent = n === null ? '' : n < -1 ? 'Ka skaduar para ' + AF.ditetParaTekst(-n) + '.' :
      n === -1 ? 'Skadoi dje.' : n === 0 ? 'Skadon sot.' : n === 1 ? 'Skadon nesër.' : 'Skadon për ' + AF.ditetTekst(n) + '.';
  }
  $('afatData').addEventListener('input', rifreskoDatenEAfatit);
  function ndryshoSasineEAfatit(hapi) {
    var inp = $('afatSasia');
    vendosRezultatinESasise(inp);
    var v = parseInt(inp.value, 10);
    inp.value = String(Math.max(0, (isNaN(v) ? 0 : v) + hapi));
  }
  $('afatSasiaMinus').addEventListener('click', function () { ndryshoSasineEAfatit(-1); });
  $('afatSasiaPlus').addEventListener('click', function () { ndryshoSasineEAfatit(1); });
  $('afatSasia').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); $('afatFurnizuesi').focus(); } });
  $('afatFurnizuesi').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); ruajAfatin(); } });

  // ---------- Fotografimi i fletës → leximi me AI → kontrolli ----------
  var lx = { rreshtat: [] };
  $('afFotografo').addEventListener('click', function () { if (!leja('afatetAI')) return; $('afFotoKamera').value = ''; $('afFotoKamera').click(); });
  $('afGaleria').addEventListener('click', function () { if (!leja('afatetAI')) return; $('afFotoGaleria').value = ''; $('afFotoGaleria').click(); });
  $('afFotoKamera').addEventListener('change', function () { var f = this.files && this.files[0]; if (f) zgjidhKuFleta(f); });
  $('afFotoGaleria').addEventListener('change', function () { var f = this.files && this.files[0]; if (f) zgjidhKuFleta(f); });

  // ---------- Pas fotos: vazhdo këtu apo dërgo në PC ----------
  // "Dërgo në PC": fleta lexohet me AI këtu (me foton në cilësi të plotë), pastaj rreshtat + një foto
  // më e vogël dërgohen në Firebase; PC-ja që ka hapur Stoku-n me të njëjtën llogari e hap vetë
  // kontrollin e fletës (edhe nëse hapet më vonë).
  var kfh = { skedari: null, anuluar: false, lloji: 'afatet' };
  // lloji: 'afatet' (parazgjedhur) ose 'stok' (importi i stokut) — përcakton çfarë lexohet këtu në
  // telefon ("Vazhdo këtu") dhe çfarë i thuhet Worker-it të AI-së kur dërgohet në PC.
  function zgjidhKuFleta(skedari, lloji) {
    var l = lloji || 'afatet';
    if (!leja(l === 'stok' ? 'stokuImporto' : 'afatetAI')) return;
    // Pa lejen "Stoku në kompjuter" fleta vazhdon direkt këtu, pa zgjedhjen "Dërgo në PC"
    if (!perdoruesiAktual() || !leja('pc') || !window.__stokuCloud || !window.__stokuCloud.dergoFleten) {
      if (l === 'stok') lexoFletenStok(skedari); else lexoFleten(skedari);
      return;
    }
    kfh = { skedari: skedari, anuluar: false, lloji: l };
    gjendjaKfh('zgjedhje');
    $('dlgKuFleta').classList.add('hapur');
  }
  function gjendjaKfh(g, tekst) {
    var s = $('kfhStatusi');
    s.className = 'kfh-statusi' + (g === 'gati' || g === 'gabim' ? ' ' + g : '');
    s.textContent = '';
    if (g === 'pune') s.appendChild(Object.assign(document.createElement('span'), { className: 'lx-spinner' }));
    s.appendChild(document.createTextNode(tekst || 'Në kompjuter ekrani është më i madh: rreshtat kontrollohen dhe korrigjohen më lehtë.'));
    $('kfhTitulli').textContent = g === 'gati' ? 'U dërgua në PC' : g === 'pune' ? 'Duke e dërguar në PC…' : 'Ku do ta kontrollosh fletën?';
    $('kfhPc').style.display = g === 'zgjedhje' ? '' : 'none';
    $('kfhKetu').style.display = g === 'zgjedhje' || g === 'gabim' ? '' : 'none';
    $('kfhAnulo').textContent = g === 'gati' ? 'Mbyll' : 'Anulo';
  }
  function mbyllKfh() { kfh.anuluar = true; $('dlgKuFleta').classList.remove('hapur'); }
  $('kfhAnulo').addEventListener('click', mbyllKfh);
  $('kfhKetu').addEventListener('click', function () {
    var f = kfh.skedari, l = kfh.lloji; mbyllKfh();
    if (f) { if (l === 'stok') lexoFletenStok(f); else lexoFleten(f); }
  });
  $('kfhPc').addEventListener('click', async function () {
    var ky = kfh;
    try {
      gjendjaKfh('pune', 'Duke përgatitur foton…');
      var foto = await AF.pergatitFoton(ky.skedari);
      if (ky.anuluar) return;
      gjendjaKfh('pune', 'Duke e lexuar fletën me AI… (zakonisht 5–20 sekonda)');
      var tokeni = null;
      try { tokeni = await window.__stokuCloud.token(); } catch (e) { /* ok */ }
      var rez = await AF.lexoMeAI(foto, tokeni, ky.lloji === 'stok' ? { synim: 'stok' } : undefined);
      if (ky.anuluar) return;
      if (!rez.ok) { gjendjaKfh('gabim', (MESAZHET_AI[rez.gabim] || 'Fleta s\'u lexua.') + ' Mund ta vazhdosh këtu në telefon.'); return; }
      gjendjaKfh('pune', 'Duke e dërguar në PC…');
      var fotoPc = await AF.fotoPerDergim(foto.dataUrl);
      var fleta = { krijuarSe: Date.now(), nga: emriPerdoruesitAktual(), foto: fotoPc, rreshtat: rez.rreshtat };
      if (ky.lloji === 'stok') fleta.lloji = 'stok';
      var r = await window.__stokuCloud.dergoFleten(fleta);
      if (ky.anuluar) return;
      if (!r.ok) {
        gjendjaKfh('gabim', r.kodi === 'permission-denied'
          ? 'Dërgimi në PC s\'lejohet ende nga rregullat e Firebase-it (duhen përditësuar një herë). Vazhdoje këtu në telefon.'
          : 'Fleta s\'u dërgua. Kontrollo internetin dhe provo sërish, ose vazhdoje këtu në telefon.');
        return;
      }
      var n = rez.rreshtat.length;
      gjendjaKfh('gati', 'U lexuan ' + n + (n === 1 ? ' rresht' : ' rreshta') + '. Në kompjuter (me të njëjtën llogari) do të dalë njoftimi për fletën. Mund ta kontrollosh kur të kesh kohë.');
    } catch (e) {
      if (!ky.anuluar) gjendjaKfh('gabim', 'Diçka s\'shkoi mirë. Vazhdoje këtu në telefon.');
    }
  });
  $('lxFoto').addEventListener('click', function () { $('lxFoto').classList.toggle('e-madhe'); vizatoNumratMbiFoton($('lxFoto'), $('lxNumrat'), lx.rreshtat); });
  $('lxFoto').addEventListener('load', function () { vizatoNumratMbiFoton($('lxFoto'), $('lxNumrat'), lx.rreshtat); });

  function statusiLeximit(html, gabim, meSpinner) {
    var s = $('lxStatusi');
    s.className = 'lx-statusi' + (gabim ? ' gabim' : '');
    s.innerHTML = (meSpinner ? '<span class="lx-spinner"></span>' : '') + '<span></span>';
    s.lastChild.textContent = html;
  }

  var MESAZHET_AI = {
    'pa-konfigurim': 'Leximi automatik me AI s\'është aktivizuar ende. Shkruaji rreshtat me dorë duke parë foton (prek foton për ta zmadhuar).',
    'pa-hyrje': 'Për leximin me AI duhet të jesh i kyçur në llogari (Cilësimet → Llogaria). Deri atëherë, shkruaji rreshtat me dorë.',
    'rrjeti': 'S\'ka lidhje me internetin. Shkruaji rreshtat me dorë ose provo përsëri më vonë.',
    'foto-shume-e-madhe': 'Fotoja është shumë e madhe. Provo përsëri.',
    'pa-celes': 'Leximi me AI s\'është konfiguruar plotësisht (mungon çelësi API në Worker). Shkruaji rreshtat me dorë.',
    'ai': 'Shërbimi i AI-së s\'u përgjigj për momentin. Provo përsëri pas pak, ose shkruaji rreshtat me dorë.',
    'origjina': 'Kjo adresë nuk lejohet nga shërbimi i leximit. Shkruaji rreshtat me dorë.'
  };

  // Çdo lexim ka numrin e vet: një lexim i anuluar që mbaron vonë s'i mbishkruan rreshtat e një leximi më të ri
  var lxSeanca = 0, impSeanca = 0;
  async function lexoFleten(skedari) {
    var seanca = ++lxSeanca;
    function iVjeteruar() { return seanca !== lxSeanca || !$('dlgAfatLexim').classList.contains('hapur'); }
    lx.rreshtat = [];
    renderLeximin();
    $('lxFoto').classList.remove('e-madhe');
    $('dlgAfatLexim').classList.add('hapur');
    statusiLeximit('Duke përgatitur foton…', false, true);
    var foto;
    try { foto = await AF.pergatitFoton(skedari); }
    catch (e) { if (!iVjeteruar()) statusiLeximit('Fotoja s\'u hap. Provo një foto tjetër.', true); return; }
    if (iVjeteruar()) return;
    $('lxFoto').src = foto.dataUrl;
    if (!perdoruesiAktual()) { statusiLeximit(MESAZHET_AI['pa-hyrje'], true); shtoRreshtLeximi(); return; }
    statusiLeximit('Duke e lexuar fletën me AI… (zakonisht 5–20 sekonda)' + (foto.gjeresia ? ' · foto ' + foto.gjeresia + '×' + foto.lartesia + ' (' + (foto.gjeresia * foto.lartesia / 1e6).toFixed(1) + ' MP)' : ''), false, true);
    var tokeni = null;
    try { tokeni = window.__stokuCloud && window.__stokuCloud.token ? await window.__stokuCloud.token() : null; } catch (e) { /* ok */ }
    var rez = await AF.lexoMeAI(foto, tokeni);
    if (iVjeteruar()) return; // u anulua (ose filloi një lexim tjetër) ndërkohë
    if (!rez.ok) {
      statusiLeximit(MESAZHET_AI[rez.gabim] || 'Fleta s\'u lexua (' + rez.gabim + '). Provo një foto më të qartë, ose shkruaji rreshtat me dorë.', true);
      shtoRreshtLeximi();
      return;
    }
    lx.rreshtat = rez.rreshtat.map(function (r) {
      return { barkodi: r.barkodi, emri: r.emri || emriNgaProduktet(r.barkodi), data: r.data, dataOrigjinale: r.dataOrigjinale,
        sasia: r.sasia, furnizuesi: r.furnizuesi || furnizuesiNgaAfatet(r.barkodi), dyshim: r.dyshim, x: r.x, y: r.y };
    });
    var nDyshim = lx.rreshtat.filter(function (r) { return r.dyshim; }).length;
    statusiLeximit(lx.rreshtat.length
      ? (lx.rreshtat.length === 1 ? 'U lexua 1 rresht. Krahasoje' : 'U lexuan ' + lx.rreshtat.length + ' rreshta. Krahasoji') + ' me foton dhe korrigjo ku duhet' + (nDyshim ? '. ' + (nDyshim === 1 ? '1 është shënuar me të verdhë si i paqartë.' : nDyshim + ' janë shënuar me të verdhë si të paqarta.') : '.')
      : 'Në foto s\'u gjet asnjë rresht me afat. Provo një foto më të qartë ose shkruaji me dorë.', !lx.rreshtat.length);
    if (!lx.rreshtat.length) shtoRreshtLeximi(); else renderLeximin();
  }

  function shtoRreshtLeximi() {
    lx.rreshtat.push({ barkodi: '', emri: '', data: '', dataOrigjinale: '', sasia: '', furnizuesi: lx.rreshtat.length ? lx.rreshtat[lx.rreshtat.length - 1].furnizuesi : '', dyshim: false, iRi: true });
    renderLeximin();
  }
  $('lxShtoRresht').addEventListener('click', function () {
    shtoRreshtLeximi();
    var te = document.querySelectorAll('#lxRreshtat .lx-rresht');
    if (te.length) { te[te.length - 1].scrollIntoView({ block: 'center' }); te[te.length - 1].querySelector('input').focus(); }
  });

  // Numrat e rreshtave mbi foto (nga r.x/r.y, 0..1, dhënë nga AI) — për "impFoto"/"lxFoto" njësoj.
  function vizatoNumratMbiFoton(imgEl, kutiaEl, rreshtat) {
    kutiaEl.textContent = '';
    // Në pamjen e vogël (para se të zmadhohet) rreshtat janë shumë afër njëri-tjetrit — numrat mbivendosen
    // dhe duken si njolla. I shfaqim vetëm pasi fotoja të zmadhohet (klikohet).
    if (!imgEl.classList.contains('e-madhe')) return;
    if (!imgEl.naturalWidth || !imgEl.clientWidth) return;
    var kw = imgEl.clientWidth, kh = imgEl.clientHeight;
    var shk = Math.min(kw / imgEl.naturalWidth, kh / imgEl.naturalHeight);
    var rw = imgEl.naturalWidth * shk, rh = imgEl.naturalHeight * shk;
    var ox = (kw - rw) / 2, oy = (kh - rh) / 2;
    rreshtat.forEach(function (r, i) {
      if (r.x == null || r.y == null) return;
      var d = document.createElement('div');
      d.className = 'foto-numri';
      // Zhvendos majtas (jashtë tekstit të rreshtit), jo mbi vetë barkodin: rrezja e rrethit + hapësirë e vogël.
      d.style.left = (ox + r.x * rw - 13) + 'px';
      d.style.top = (oy + r.y * rh) + 'px';
      d.textContent = String(i + 1);
      kutiaEl.appendChild(d);
    });
  }

  function renderLeximin() {
    mbushFurnizuesit();
    var c = $('lxRreshtat');
    c.textContent = '';
    lx.rreshtat.forEach(function (r, i) {
      var d = document.createElement('div');
      d.className = 'lx-rresht ' + (r.data ? AF.statusi({ data: r.data }) : '') + (r.dyshim ? ' dyshim' : '');
      var nr = document.createElement('div'); nr.className = 'lx-numri';
      nr.textContent = 'Rreshti ' + (i + 1) + (r.dyshim ? ' · ⚠ kontrolloje' : '');
      d.appendChild(nr);
      var hiq = document.createElement('button'); hiq.type = 'button'; hiq.className = 'lx-hiq'; hiq.textContent = '✕'; hiq.setAttribute('aria-label', 'Hiq rreshtin');
      hiq.addEventListener('click', function () { lx.rreshtat.splice(i, 1); renderLeximin(); });
      d.appendChild(hiq);
      function fushe(ph, vl, lloji, vendos, klasa) {
        var w = document.createElement('div'); w.className = 'fushe' + (klasa ? ' ' + klasa : '');
        var inp = document.createElement('input'); inp.type = lloji; inp.value = vl || ''; inp.placeholder = ph; inp.setAttribute('aria-label', ph);
        inp.autocomplete = 'off';
        if (lloji === 'text') { inp.setAttribute('autocorrect', 'off'); inp.spellcheck = false; }
        inp.addEventListener('input', function () { vendos(inp.value); });
        w.appendChild(inp);
        return { w: w, inp: inp };
      }
      var fb = fushe('Barkodi', r.barkodi, 'text', function (v) { r.barkodi = v.trim(); });
      fb.inp.addEventListener('change', function () {
        if (!r.emri) { r.emri = emriNgaProduktet(r.barkodi); fe.inp.value = r.emri; }
      });
      var fe = fushe('Emri i produktit', r.emri, 'text', function (v) { r.emri = v; });
      var dy = document.createElement('div'); dy.className = 'lx-dy';
      var fd = fushe('Data (DD-MM-VV)', r.data ? AF.formatoPerFushe(r.data) : '', 'text', function (v) {
        var iso = AF.lexoDatenEFushes(v) || '';
        r.data = iso; r.dyshim = false;
        d.className = 'lx-rresht ' + (iso ? AF.statusi({ data: iso }) : '');
        nr.textContent = 'Rreshti ' + (i + 1);
      });
      AF.lidhFushenEDates(fd.inp);
      // Shfaqet vetëm rezultati (fleta "60+30" → 90). Tastiera me "+" lejon edhe shuma me dorë,
      // që kthehen menjëherë në rezultat kur del nga fusha.
      var fs = fushe('Sasia', r.sasia === '' || r.sasia === undefined ? '' : String(r.sasia), 'text', function (v) {
        r.sasia = AF.lexoSasine(v); r.sasiaTx = v;
      }, 'lx-sasia');
      fs.inp.inputMode = 'tel';
      fs.inp.addEventListener('change', function () { vendosRezultatinESasise(fs.inp); });
      var ff = fushe('Furnizuesi', r.furnizuesi, 'text', function (v) { r.furnizuesi = v; });
      ff.inp.setAttribute('list', 'afFurnizuesit');
      dy.appendChild(fd.w); dy.appendChild(fs.w);
      d.appendChild(fb.w); d.appendChild(fe.w); d.appendChild(dy); d.appendChild(ff.w);
      if (r.dataOrigjinale || (r.data && !r.iRi)) {
        var sh = document.createElement('div');
        sh.className = 'lx-shenim' + (!r.data ? ' paralajm' : '');
        sh.textContent = (r.dataOrigjinale ? 'Në fletë: "' + r.dataOrigjinale + '"' : '') +
          (r.data ? ' → ' + AF.pershkrimi({ data: r.data }) : '. Data s\'u kuptua, zgjidhe me dorë.');
        d.appendChild(sh);
      }
      c.appendChild(d);
    });
    var n = lx.rreshtat.length;
    $('lxRuaj').textContent = n ? 'Ruaj ' + n + (n === 1 ? ' afat' : ' afate') : 'Ruaj';
    $('lxRuaj').disabled = !n;
    vizatoNumratMbiFoton($('lxFoto'), $('lxNumrat'), lx.rreshtat);
  }

  function mbyllLeximin() { $('dlgAfatLexim').classList.remove('hapur'); }
  $('lxPrapa').addEventListener('click', function () { $('leximAnulo').click(); });
  $('leximAnulo').addEventListener('click', async function () {
    var kaTeDhena = lx.rreshtat.some(function (r) { return r.barkodi || r.emri || r.data; });
    if (kaTeDhena) {
      var po = await konfirmo('Të anulohet?', 'Rreshtat e lexuar nuk do të ruhen.', 'Anulo leximin');
      if (!po) return;
    }
    lx.rreshtat = [];
    mbyllLeximin();
  });
  $('lxRuaj').addEventListener('click', async function () {
    var teVlefshem = [], pa = 0;
    lx.rreshtat.forEach(function (r, i) {
      var bosh = !r.barkodi && !r.emri && !r.data;
      if (bosh) return;
      if (!AF.lexoDaten(r.data) || (!r.barkodi && !r.emri) || (r.sasiaTx && AF.lexoSasine(r.sasiaTx) === '')) { pa++; return; }
      teVlefshem.push(r);
    });
    if (pa) { toast(pa === 1 ? '1 rresht s\'ka datë ose emër/barkod (ose sasia s\'është numër). Plotësoje ose hiqe me ✕.' : pa + ' rreshta s\'kanë datë ose emër/barkod (ose sasia s\'është numër). Plotësoji ose hiqi me ✕.', 4000); return; }
    if (!teVlefshem.length) { mbyllLeximin(); return; }
    var mkId = await marketiPerTeReja(); // v241: marketi ku ruhen
    if (mkId === undefined) return;
    var tani = Date.now(), perseritur = 0;
    var ekzistuese = {};
    // E njëjta datë e të njëjtit produkt në një market tjetër s'është përsëritje
    afatet.forEach(function (a) { if (a.statusi !== 'hequr') ekzistuese[(a.m || '') + '|' + (a.barkodi || a.emri) + '|' + a.data] = true; });
    var te_reja = [];
    teVlefshem.forEach(function (r, i) {
      var celes = (mkId || '') + '|' + (r.barkodi || r.emri.trim()) + '|' + r.data;
      if (ekzistuese[celes]) { perseritur++; return; }
      ekzistuese[celes] = true;
      te_reja.push({ id: AF.idERe(), barkodi: r.barkodi, emri: r.emri.trim(), data: r.data, sasia: r.sasia === undefined ? '' : r.sasia, furnizuesi: r.furnizuesi.trim(), statusi: 'aktiv',
        krijuarSe: tani + i, ndryshuarSe: tani, krijuarNga: emriPerdoruesitAktual(), ngaFoto: true });
    });
    te_reja = meMarket(te_reja, mkId);
    afatet = afatet.concat(te_reja);
    try { if (KJ()) KJ().mesoShume(te_reja, 'mbishkruaj'); } catch (e) { /* ok */ } // të kontrolluara nga përdoruesi
    ruajAfatet();
    if (te_reja.length && perdoruesiAktual() && ekK) ekK.afateTeReja(te_reja.length, true);
    lx.rreshtat = [];
    mbyllLeximin();
    var nk = te_reja.filter(function (a) { return AF.statusi(a) === 'skaduar'; }).length;
    var nv = te_reja.filter(function (a) { return AF.statusi(a) === 'afer'; }).length;
    toast((te_reja.length === 1 ? 'U ruajt 1 afat' : 'U ruajtën ' + te_reja.length + ' afate') + (perseritur ? ' (' + (perseritur === 1 ? '1 ekzistonte' : perseritur + ' ekzistonin') + ' tashmë)' : '') +
      (nk ? ' · ' + (nk === 1 ? '1 ka skaduar!' : nk + ' kanë skaduar!') : '') + (nv ? ' · ' + (nv === 1 ? '1 skadon' : nv + ' skadojnë') + ' brenda 30 ditëve' : '') + '.', 5000);
    afFiltri = nk ? 'skaduar' : (nv ? 'afer' : 'aktive');
    renderAfatet();
  });

  // ---------- Importo stokun nga një fletë (foto) → lexim me AI → kontroll → ruaj në një folder ----------
  // E njëjta rrugë si te Afatet (foto → AI → kontroll → ruaj), por lexohen vetëm barkodi + emri + sasia
  // (jo data/furnizuesi, që s'kanë kuptim për stokun). Rreshtat shkojnë në folderin e zgjedhur: nëse
  // barkodi ekziston aty, sasia i shtohet atij ekzistues (si te skanimi i zakonshëm); emri ekzistues mbetet.
  var imp = { rreshtat: [] };
  function importiHapurNukKaFolder() {
    if (foldera.length) return false;
    if (!leja('stokuFoldera')) { toast('S\'ka asnjë folder ku të importohet.', 4000); return true; }
    toast('Krijo fillimisht një folder.');
    hapDialoguFolder();
    return true;
  }
  $('btnImportStok').addEventListener('click', function () {
    if (!leja('stokuImporto') || importiHapurNukKaFolder()) return;
    $('impFotoKamera').value = ''; $('impFotoKamera').click();
  });
  $('btnImportGaleria').addEventListener('click', function () {
    if (!leja('stokuImporto') || importiHapurNukKaFolder()) return;
    $('impFotoGaleria').value = ''; $('impFotoGaleria').click();
  });
  $('impFotoKamera').addEventListener('change', function () { var f = this.files && this.files[0]; if (f) zgjidhKuFleta(f, 'stok'); });
  $('impFotoGaleria').addEventListener('change', function () { var f = this.files && this.files[0]; if (f) zgjidhKuFleta(f, 'stok'); });

  var KEY_FOLDER_IMPORTIT = 'stoku:import-stok:folderi';
  var IMP_FOLDER_RI = '__ri__';
  function mbushFolderatImportit(zgjidhId) {
    var s = $('impFolderi');
    s.textContent = '';
    foldera.forEach(function (f) {
      var o = document.createElement('option'); o.value = f.id; o.textContent = f.emri;
      s.appendChild(o);
    });
    var oRi = document.createElement('option'); oRi.value = IMP_FOLDER_RI; oRi.textContent = '+ Folder i ri…';
    if (leja('stokuFoldera')) s.appendChild(oRi);
    var i = zgjidhId || null;
    if (!i) { try { i = localStorage.getItem(KEY_FOLDER_IMPORTIT); } catch (e) { /* ok */ } }
    s.value = (i && foldera.some(function (f) { return f.id === i; })) ? i : foldera[0].id;
  }
  $('impFolderi').addEventListener('change', function () {
    var s = $('impFolderi');
    if (s.value !== IMP_FOLDER_RI) { try { localStorage.setItem(KEY_FOLDER_IMPORTIT, s.value); } catch (e) { /* ok */ } return; }
    var iParaprak = null;
    try { iParaprak = localStorage.getItem(KEY_FOLDER_IMPORTIT); } catch (e) { /* ok */ }
    if (!iParaprak || !foldera.some(function (f) { return f.id === iParaprak; })) iParaprak = foldera[0].id;
    pasAnulimitTeFolderit = function () { s.value = iParaprak; };
    pasKrijimitTeFolderit = function (idIRi) {
      mbushFolderatImportit(idIRi);
      try { localStorage.setItem(KEY_FOLDER_IMPORTIT, idIRi); } catch (e) { /* ok */ }
    };
    hapDialoguFolder();
  });

  function statusiImportit(tekst, gabim, meSpinner) {
    var s = $('impStatusi');
    s.className = 'lx-statusi' + (gabim ? ' gabim' : '');
    s.innerHTML = (meSpinner ? '<span class="lx-spinner"></span>' : '') + '<span></span>';
    s.lastChild.textContent = tekst;
  }

  async function lexoFletenStok(skedari) {
    var seanca = ++impSeanca;
    function iVjeteruar() { return seanca !== impSeanca || !$('dlgImportStok').classList.contains('hapur'); }
    imp.rreshtat = [];
    renderImportin();
    mbushFolderatImportit();
    $('impFoto').classList.remove('e-madhe');
    $('dlgImportStok').classList.add('hapur');
    statusiImportit('Duke përgatitur foton…', false, true);
    var foto;
    try { foto = await AF.pergatitFoton(skedari); }
    catch (e) { if (!iVjeteruar()) statusiImportit('Fotoja s\'u hap. Provo një foto tjetër.', true); return; }
    if (iVjeteruar()) return;
    $('impFoto').src = foto.dataUrl;
    if (!perdoruesiAktual()) { statusiImportit(MESAZHET_AI['pa-hyrje'], true); shtoRreshtImportit(); return; }
    statusiImportit('Duke e lexuar fletën me AI… (zakonisht 5–20 sekonda)', false, true);
    var tokeni = null;
    try { tokeni = window.__stokuCloud && window.__stokuCloud.token ? await window.__stokuCloud.token() : null; } catch (e) { /* ok */ }
    // "synim: 'stok'" i jepet Worker-it si shenjë shtesë (për t'u përdorur më vonë, nëse i duhet një
    // prompt tjetër); tani për tani Worker-i i injoron fushat e panjohura dhe përgjigjet njësoj.
    var rez = await AF.lexoMeAI(foto, tokeni, { synim: 'stok' });
    if (iVjeteruar()) return; // u anulua (ose filloi një lexim tjetër) ndërkohë
    if (!rez.ok) {
      statusiImportit(MESAZHET_AI[rez.gabim] || 'Fleta s\'u lexua (' + rez.gabim + '). Provo një foto më të qartë, ose shkruaji rreshtat me dorë.', true);
      shtoRreshtImportit();
      return;
    }
    imp.rreshtat = rez.rreshtat.map(function (r) {
      return { barkodi: r.barkodi || '', emri: r.emri || emriNgaProduktet(r.barkodi), sasia: r.sasia, furnizuesi: r.furnizuesi || furnizuesiNgaAfatet(r.barkodi), x: r.x, y: r.y };
    });
    statusiImportit(imp.rreshtat.length
      ? (imp.rreshtat.length === 1 ? 'U lexua 1 rresht. Krahasoje' : 'U lexuan ' + imp.rreshtat.length + ' rreshta. Krahasoji') + ' me foton dhe korrigjo ku duhet.'
      : 'Në foto s\'u gjet asnjë rresht. Provo një foto më të qartë ose shkruaji me dorë.', !imp.rreshtat.length);
    if (!imp.rreshtat.length) shtoRreshtImportit(); else renderImportin();
  }

  function shtoRreshtImportit() {
    var fund = imp.rreshtat[imp.rreshtat.length - 1];
    imp.rreshtat.push({ barkodi: '', emri: '', sasia: '', furnizuesi: fund ? fund.furnizuesi : '', iRi: true });
    renderImportin();
  }
  $('impShtoRresht').addEventListener('click', function () {
    shtoRreshtImportit();
    var te = document.querySelectorAll('#impRreshtat .lx-rresht');
    if (te.length) { te[te.length - 1].scrollIntoView({ block: 'center' }); te[te.length - 1].querySelector('input').focus(); }
  });

  function renderImportin() {
    mbushFurnizuesit();
    var c = $('impRreshtat');
    c.textContent = '';
    imp.rreshtat.forEach(function (r, i) {
      var d = document.createElement('div');
      d.className = 'lx-rresht';
      var nr = document.createElement('div'); nr.className = 'lx-numri'; nr.textContent = 'Rreshti ' + (i + 1);
      d.appendChild(nr);
      var hiq = document.createElement('button'); hiq.type = 'button'; hiq.className = 'lx-hiq'; hiq.textContent = '✕'; hiq.setAttribute('aria-label', 'Hiq rreshtin');
      hiq.addEventListener('click', function () { imp.rreshtat.splice(i, 1); renderImportin(); });
      d.appendChild(hiq);
      function fushe(ph, vl, vendos, klasa) {
        var w = document.createElement('div'); w.className = 'fushe' + (klasa ? ' ' + klasa : '');
        var inp = document.createElement('input'); inp.type = 'text'; inp.value = vl || ''; inp.placeholder = ph; inp.setAttribute('aria-label', ph);
        inp.autocomplete = 'off'; inp.setAttribute('autocorrect', 'off'); inp.spellcheck = false;
        inp.addEventListener('input', function () { vendos(inp.value); });
        w.appendChild(inp);
        return { w: w, inp: inp };
      }
      var fb = fushe('Barkodi', r.barkodi, function (v) { r.barkodi = v.trim(); });
      fb.inp.addEventListener('change', function () {
        if (!r.emri) { r.emri = emriNgaProduktet(r.barkodi); fe.inp.value = r.emri; }
      });
      var fe = fushe('Emri i produktit', r.emri, function (v) { r.emri = v; });
      var fsas = fushe('Sasia', r.sasia === '' || r.sasia === undefined ? '' : String(r.sasia), function (v) {
        r.sasia = AF.lexoSasine(v); r.sasiaTx = v;
      }, 'lx-sasia');
      fsas.inp.inputMode = 'tel';
      // Shfaqet vetëm rezultati (fleta "60+30" → 90), si te Afatet.
      fsas.inp.addEventListener('change', function () {
        if (!AF.sasiaSiShume(fsas.inp.value)) return;
        fsas.inp.value = String(AF.lexoSasine(fsas.inp.value));
        fsas.inp.dispatchEvent(new Event('input'));
      });
      var ffur = fushe('Furnizuesi', r.furnizuesi, function (v) { r.furnizuesi = v; });
      ffur.inp.setAttribute('list', 'afFurnizuesit');
      d.appendChild(fb.w); d.appendChild(fe.w); d.appendChild(fsas.w); d.appendChild(ffur.w);
      c.appendChild(d);
    });
    var n = imp.rreshtat.length;
    $('impRuaj').textContent = n ? 'Importo ' + n + (n === 1 ? ' produkt' : ' produkte') : 'Importo';
    $('impRuaj').disabled = !n;
    vizatoNumratMbiFoton($('impFoto'), $('impNumrat'), imp.rreshtat);
  }

  function mbyllImportin() { $('dlgImportStok').classList.remove('hapur'); }
  $('impFoto').addEventListener('click', function () { $('impFoto').classList.toggle('e-madhe'); vizatoNumratMbiFoton($('impFoto'), $('impNumrat'), imp.rreshtat); });
  $('impFoto').addEventListener('load', function () { vizatoNumratMbiFoton($('impFoto'), $('impNumrat'), imp.rreshtat); });
  $('impPrapa').addEventListener('click', function () { $('impAnulo').click(); });
  $('impAnulo').addEventListener('click', async function () {
    var kaTeDhena = imp.rreshtat.some(function (r) { return r.barkodi || r.emri || r.furnizuesi; });
    if (kaTeDhena) {
      var po = await konfirmo('Të anulohet?', 'Rreshtat e lexuar nuk do të importohen.', 'Anulo importin');
      if (!po) return;
    }
    imp.rreshtat = [];
    mbyllImportin();
  });
  $('impRuaj').addEventListener('click', function () {
    var fid = $('impFolderi').value;
    if (!fid || !foldera.some(function (f) { return f.id === fid; })) { toast('Zgjidh folderin ku do të importohen produktet.'); return; }
    var teVlefshem = [], pa = 0;
    imp.rreshtat.forEach(function (r) {
      var bosh = !r.barkodi && !r.emri && !r.furnizuesi && (r.sasia === '' || r.sasia === undefined);
      if (bosh) return;
      var b = (r.barkodi || '').trim();
      if (!b || r.sasia === '' || r.sasia === undefined || (r.sasiaTx && AF.lexoSasine(r.sasiaTx) === '')) { pa++; return; }
      teVlefshem.push(r);
    });
    if (pa) {
      toast(pa === 1 ? '1 rresht s\'ka barkod ose sasi (numër i plotë). Plotësoje ose hiqe me ✕.' : pa + ' rreshta s\'kanë barkod ose sasi (numër i plotë). Plotësoji ose hiqi me ✕.', 4000);
      return;
    }
    if (!teVlefshem.length) { mbyllImportin(); return; }
    var tani = Date.now(), ndryshimet = {};
    teVlefshem.forEach(function (r) {
      var b = r.barkodi.trim();
      var k = celesiProduktit(fid, b);
      var baza = ndryshimet[k] || produktet[k] || null;
      var emriRi = (baza && baza.emri) || (r.emri || '').trim();
      var furnizuesiRi = (baza && baza.furnizuesi) || (r.furnizuesi || '').trim();
      var sasiaRe = Math.max(0, (baza ? baza.sasia : 0) + r.sasia);
      var ri = { barkodi: b, emri: emriRi, sasia: sasiaRe, kategoriaId: fid, prekurSe: tani };
      if (furnizuesiRi) ri.furnizuesi = furnizuesiRi;
      ndryshimet[k] = ri;
    });
    var numri = Object.keys(ndryshimet).length;
    Object.keys(ndryshimet).forEach(function (k) { produktet[k] = ndryshimet[k]; });
    try { if (KJ()) KJ().mesoShume(teVlefshem.map(function (r) { return { barkodi: r.barkodi.trim(), emri: r.emri, furnizuesi: r.furnizuesi }; }), 'mbishkruaj'); } catch (e) { /* ok */ }
    ruajBaze();
    imp.rreshtat = [];
    mbyllImportin();
    renderFolderat();
    renderKerkimiGlobal();
    toast((numri === 1 ? 'U importua 1 produkt' : 'U importuan ' + numri + ' produkte') + ' në folderin "' + emriFolderit(fid) + '".' +
      (teVlefshem.length !== numri ? ' (disa rreshta u bashkuan te i njëjti barkod)' : ''), 4000);
  });


  // Rifreskim i ngjyrave kur ndërrohet dita (aplikacioni mbetet hapur pas mesnatës, ose rikthehesh në të të nesërmen):
  // jo vetëm shenja, por edhe lista e afateve, statistikat e kryefaqes dhe Grupi
  var __ditaEShfaqur = AF.sot();
  function rifreskoNeseNderroiDita() {
    rifreskoShenjen();
    var sot = AF.sot();
    if (sot === __ditaEShfaqur) return;
    __ditaEShfaqur = sot;
    if ($('dlgAfatet').classList.contains('hapur')) renderAfatet();
    if (folderiAktual === null) renderFolderat();
    if ($('dlgEkipi').classList.contains('hapur') && typeof kurNdryshonEkipa === 'function') kurNdryshonEkipa('te-gjitha');
  }
  setInterval(rifreskoNeseNderroiDita, 10 * 60 * 1000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) rifreskoNeseNderroiDita(); });
  rifreskoShenjen();

  // ---------- Njoftimet për afatet (30 ditë para skadimit, dhe kur skadon) ----------
  // Lista e afateve kopjohet në IndexedDB që service worker-i ta kontrollojë edhe kur aplikacioni është mbyllur;
  // kur aplikacioni është hapur, kontrolli bëhet këtu pas çdo ndryshimi dhe kur rikthehesh në aplikacion.
  var KEY_NJ_JO_TANI = 'stoku:njoftimet:jo-tani';
  var njKohezi = null, njZinxhiri = Promise.resolve();
  function njoftimetMbeshteten() { return 'Notification' in window && 'serviceWorker' in navigator && !!window.StokuNjoftimet; }
  function paLlogari() { var cl = window.__stokuCloud; return !!(cl && cl.authGati && !perdoruesiAktual()); }
  function kontrolloNjoftimet() {
    if (!njoftimetMbeshteten()) return;
    clearTimeout(njKohezi);
    if (paLlogari()) return; // pas "Dil": s'njoftohet më për afatet e llogarisë që doli
    if (!leja('afatet')) { // v230: pa lejen e afateve, as njoftime për skadimin (kopja e service worker-it hiqet)
      if (window.StokuNjoftimet.pastro) njZinxhiri = njZinxhiri.then(function () { return window.StokuNjoftimet.pastro(); }).catch(function () { /* ok */ });
      zbatoLejetJashte(); // v231: edhe serveri merr listë bosh (pa njoftim ditor, ora pa produkte)
      return;
    }

    njKohezi = setTimeout(function () {
      var kopje = MK.meEmra(afatet, marketet); // v241: me emrin e marketit (njoftimi sipas marketeve)
      var e = ekipaCloud(), o = e && e.orariIm ? e.orariIm() : null;
      if (e && e.dergoAfatetPerOrarin) e.dergoAfatetPerOrarin(kopje).catch(function () { /* ok */ }); // kopja për njoftimin ditor dhe orën
      // Njoftimet e menjëhershme ndalen vetëm kur serveri i njoftimit ditor është konfirmuar që punon. Me orar të
      // ndezur, serveri kontrollohet PARA se të vendoset (përndryshe në hapje dilnin "34 produkte skadojnë…").
      var pyetServerin = (o && o.aktiv && e.kontrolloServerin && !(e.orariPunon && e.orariPunon()))
        ? Promise.race([e.kontrolloServerin(), new Promise(function (r) { setTimeout(r, 6000); })]) : Promise.resolve();
      njZinxhiri = njZinxhiri.then(function () { return pyetServerin; })
        .then(function () { return window.StokuNjoftimet.vendosOrarin(!!(e && e.orariPunon && e.orariPunon())); })
        .then(function () { return window.StokuNjoftimet.ruajAfatet(kopje); }).then(function () {
        if (Notification.permission !== 'granted') return;
        return navigator.serviceWorker.ready.then(function (reg) { return window.StokuNjoftimet.kontrollo(reg); });
      }).catch(function () { /* ok */ });
    }, 1500);
  }
  // Pas daljes nga llogaria, kopja e afateve për service worker-in hiqet (përndryshe njoftimet vazhdonin edhe në sfond)
  window.addEventListener('stoku-auth-ndryshoi', function () {
    if (!paLlogari() || !njoftimetMbeshteten() || !window.StokuNjoftimet.pastro) return;
    clearTimeout(njKohezi);
    njZinxhiri = njZinxhiri.then(function () { return window.StokuNjoftimet.pastro(); }).catch(function () { /* ok */ });
  });
  function regjistroKontrollinPeriodik() {
    if (!njoftimetMbeshteten()) return;
    navigator.serviceWorker.ready.then(function (reg) {
      if (!reg.periodicSync || !navigator.permissions) return;
      return navigator.permissions.query({ name: 'periodic-background-sync' }).then(function (leja) {
        if (leja.state === 'granted') return reg.periodicSync.register('stoku-afatet', { minInterval: 12 * 3600 * 1000 });
      });
    }).catch(function () { /* s'mbështetet — kontrolli bëhet kur hapet aplikacioni */ });
  }
  function eshteInstaluar() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  }
  function pyetPerNjoftimet() {
    if (!njoftimetMbeshteten() || Notification.permission !== 'default' || !eshteInstaluar() || ngaVizitori()) return; // prova: pa njoftime
    if (window.StokuPorta && window.StokuPorta.eHapur()) return;
    var jo = 0;
    try { jo = Number(localStorage.getItem(KEY_NJ_JO_TANI)) || 0; } catch (e) { /* ok */ }
    if (Date.now() - jo < 3 * 86400000) return; // "Jo tani" → pyet sërish pas 3 ditësh
    if (document.querySelector('.mbulese.hapur')) return; // mos e ndërprit punën — pyetet herën tjetër
    $('dlgNjoftimet').classList.add('hapur');
  }
  $('njJoTani').addEventListener('click', function () {
    try { localStorage.setItem(KEY_NJ_JO_TANI, String(Date.now())); } catch (e) { /* ok */ }
    $('dlgNjoftimet').classList.remove('hapur');
  });
  $('njAktivizo').addEventListener('click', function () {
    $('dlgNjoftimet').classList.remove('hapur');
    Promise.resolve(Notification.requestPermission()).then(function (p) {
      if (p === 'granted') {
        regjistroKontrollinPeriodik();
        aktivizoPushin();
        kontrolloNjoftimet();
        toast('Njoftimet u aktivizuan.');
      } else if (p === 'denied') {
        toast('Njoftimet u refuzuan. Mund t\'i lejosh te cilësimet e telefonit → Aplikacionet → Stoku → Njoftimet.');
      }
    }).catch(function () { /* ok */ });
  });
  function hapAfatetNgaNjoftimi() {
    if (window.StokuPorta && window.StokuPorta.eHapur()) return false;
    if (!$('dlgAfatet').classList.contains('hapur')) hapAfatetFaqe();
    return true;
  }
  if (location.hash === '#afatet') {
    try { history.replaceState(history.state, '', location.pathname + location.search); } catch (e) { /* ok */ }
    if (!hapAfatetNgaNjoftimi()) window.addEventListener('stoku-porta-hapur', hapAfatetNgaNjoftimi, { once: true });
  }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', function (ev) {
      if (ev.data && ev.data.lloji === 'hap-afatet') hapAfatetNgaNjoftimi();
      if (ev.data && ev.data.lloji === 'hap-ekipa') hapEkipenNgaNjoftimi(ev.data.pamja);
    });
  }
  // Aplikacioni Android: njoftimi i prekur kur Stoku është tashmë i hapur (pa e ringarkuar faqen)
  window.__stokuHapNgaNjoftimi = function (hash) {
    hash = String(hash || '');
    if (hash === '#afatet') return hapAfatetNgaNjoftimi();
    if (/^#ekipa/.test(hash)) return hapEkipenNgaNjoftimi(hash.split('#ekipa-')[1] || '');
    return true;
  };
  // Njoftimet e Grupit hapin "./index.html#ekipa-<pamja>"
  if (/^#ekipa/.test(location.hash)) {
    var __pamjaEkipesNgaAdresa = location.hash.split('#ekipa-')[1] || '';
    try { history.replaceState(history.state, '', location.pathname + location.search); } catch (e) { /* ok */ }
    var __hapEkipenNgaAdresa = function () { return hapEkipenNgaNjoftimi(__pamjaEkipesNgaAdresa); };
    if (!__hapEkipenNgaAdresa()) window.addEventListener('stoku-porta-hapur', __hapEkipenNgaAdresa, { once: true });
  }
  window.addEventListener('stoku-porta-hapur', function () { setTimeout(pyetPerNjoftimet, 1500); });
  window.addEventListener('stoku-porta-hapur', fokusoBarkodin); // PDA: kursori te barkodi sapo hapet dyqani (edhe pas rinisjes për përditësim)
  setTimeout(pyetPerNjoftimet, 2000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) kontrolloNjoftimet(); });
  setInterval(function () { if (!document.hidden) kontrolloNjoftimet(); }, 30 * 60 * 1000);
  if (njoftimetMbeshteten() && Notification.permission === 'granted') regjistroKontrollinPeriodik();
  kontrolloNjoftimet();

  // ---------- "Çka ka të re" ----------
  // Në hyrje, pas ekranit të hyrjes: tregohen hyrjet e teRejat.js më të reja se versioni i fundit që u pa.
  var KEY_TE_REJAT = 'stoku:te-rejat:pare';
  function versioniIPare() { try { return Number(localStorage.getItem(KEY_TE_REJAT)) || 0; } catch (e) { return 0; } }
  function shenoTeRejatSiTePara() { try { localStorage.setItem(KEY_TE_REJAT, String(window.StokuTeRejat.versioni())); } catch (e) { /* ok */ } }
  function tregoTeRejat() {
    var TR = window.StokuTeRejat;
    if (!TR || !TR.versioni()) return false;
    if ((__pajisjeERe || ngaVizitori()) && !versioniIPare()) { shenoTeRejatSiTePara(); return false; } // vizitori i ri: pa listë përditësimesh
    var hyrjet = TR.teRejatPas(versioniIPare(), 'tel', eshteAdminiIStokut(), lejaPerTeRejat); // vetëm të rejat e telefonit
    if (!hyrjet.length) return false;
    if (window.StokuPorta && window.StokuPorta.eHapur()) return false;
    if (document.querySelector('.mbulese.hapur') || $('kamera').classList.contains('hapur')) return false;
    mbushTeRejat(hyrjet, hyrjet.length === 1 ? TR.etiketa(hyrjet[0]) : hyrjet.length + ' përditësime të reja');
    __teRejatNgaCilesimet = false;
    $('dlgTeRejat').classList.add('hapur');
    return true;
  }
  var __teRejatNgaCilesimet = false;
  function mbushTeRejat(hyrjet, nen) {
    var TR = window.StokuTeRejat;
    var lista = $('trLista');
    lista.textContent = '';
    hyrjet.forEach(function (h) {
      var b = document.createElement('div'); b.className = 'tr-version';
      var t = document.createElement('div'); t.className = 'tr-version-titulli'; t.textContent = h.titulli;
      var d = document.createElement('div'); d.className = 'tr-version-data'; d.textContent = TR.etiketa(h);
      var ul = document.createElement('ul');
      (h.pikat || []).forEach(function (pika) { var li = document.createElement('li'); li.textContent = pika; ul.appendChild(li); });
      b.appendChild(t); b.appendChild(d); b.appendChild(ul);
      lista.appendChild(b);
    });
    $('trNen').textContent = nen;
    lista.scrollTop = 0;
  }
  // Nga Cilësimet → "Çka ka të re": 6 versionet e fundit të telefonit, kurdo
  // v237: politika e privatësisë (faqe më vete, në dritare të re)
  $('opsPrivatesia').addEventListener('click', function () { window.open('privatesia.html', '_blank', 'noopener'); });
  $('opsTeRejat').addEventListener('click', function () {
    var TR = window.StokuTeRejat;
    if (!TR || !TR.versioni()) return;
    var hyrjet = TR.teRejatPas(0, 'tel', eshteAdminiIStokut(), lejaPerTeRejat).slice(0, 6);
    if (!hyrjet.length) return;
    mbushTeRejat(hyrjet, 'Përditësimet e fundit');
    __teRejatNgaCilesimet = true;
    $('dlgTeRejat').classList.add('hapur');
  });
  $('trMbyll').addEventListener('click', function () {
    $('dlgTeRejat').classList.remove('hapur');
    if (__teRejatNgaCilesimet) { __teRejatNgaCilesimet = false; return; }
    setTimeout(pyetPerNjoftimet, 400); // leja për njoftimet, nëse s'është pyetur ende
  });
  $('dlgTeRejat').addEventListener('click', function (ev) { if (ev.target === $('dlgTeRejat')) $('trMbyll').click(); });

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

  // ---------- Rreshtat e filtrave: skajet zbehen (fade) kur ka edhe butona anash ----------
  (function () {
    function perditeso(el) {
      var maks = el.scrollWidth - el.clientWidth;
      el.classList.toggle('fade-majtas', el.scrollLeft > 2);
      el.classList.toggle('fade-djathtas', maks - el.scrollLeft > 2);
    }
    Array.prototype.forEach.call(document.querySelectorAll('.af-filtrat'), function (el) {
      var p = function () { perditeso(el); };
      el.addEventListener('scroll', p, { passive: true });
      if (window.ResizeObserver) new ResizeObserver(p).observe(el);
      if (window.MutationObserver) new MutationObserver(function () { requestAnimationFrame(p); }).observe(el, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'class'] });
      p();
    });
  })();

  // ---------- Service worker + përditësimi automatik ----------
  // Sa herë hapet aplikacioni (dhe sa herë rikthehesh në të), kontrollohet në sfond a ka version të ri (sw.js).
  // Nëse ka, instalohet dhe aplikacioni rinis vetë në çastin e parë të qetë — pa dritare të hapur, pa fushë ku
  // po shkruhet, pa ruajtje në cloud në pritje — ose sapo kalon në sfond. Gjendja (folderi, tabi) rikthehet.
  var KEY_RINISJE = 'stoku:rinisje';
  if ('serviceWorker' in navigator) {
    var __kishteKontrollues = !!navigator.serviceWorker.controller;
    var __perditesimGati = false, __perditesimKohez = null;
    var kontrolloPerditesimin = function () {
      navigator.serviceWorker.getRegistration().then(function (r) { if (r) return r.update(); }).catch(function () { /* pa internet */ });
    };
    var eshteCastIQete = function () {
      var a = document.activeElement;
      if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA') && a.value) return false;  // po shkruan diçka
      if (document.querySelector('.mbulese.hapur:not(#dlgAfatet):not(#dlgOpsione):not(#dlgEkipi)')) return false; // dialog i hapur
      if ($('kamera').classList.contains('hapur')) return false;
      if (dukeSinkronizuar || sinkronizoKohezi) return false;                                // ruajtje në cloud në pritje
      return true;
    };
    var rinis = function () {
      try {
        sessionStorage.setItem(KEY_RINISJE, JSON.stringify({
          folderi: folderiAktual, afatet: $('dlgAfatet').classList.contains('hapur'), cilesimet: $('dlgOpsione').classList.contains('hapur'),
          ekipi: $('dlgEkipi').classList.contains('hapur')
        }));
      } catch (e) { /* ok */ }
      location.reload();
    };
    var rinisKurTeJeteQete = function () {
      if (!__perditesimGati) return;
      // Në sfond: rinis menjëherë, por jo ndërsa një ruajtje në cloud është në rrugë (do të priste sinkronizimin tjetër)
      if (document.hidden ? !(dukeSinkronizuar || sinkronizoKohezi) : eshteCastIQete()) { rinis(); return; }
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

  // v230: lejet e fundit të kësaj pajisjeje vlejnë që në hapje (pastaj i konfirmon Firebase)
  if (lejetG) lejetG.rinis();
  zbatoLejet(true);
  rifreskoPamjen();

  // Pas rinisjes për përditësim: kthehu aty ku ishe (folderi i hapur, tabi Afatet ose Cilësimet)
  (function () {
    var g = null;
    try { g = JSON.parse(sessionStorage.getItem(KEY_RINISJE) || 'null'); sessionStorage.removeItem(KEY_RINISJE); } catch (e) { /* ok */ }
    if (!g) return;
    if (g.folderi && foldera.some(function (f) { return f.id === g.folderi; })) hapFolderin(g.folderi);
    else if (g.afatet) hapAfatetFaqe();
    else if (g.ekipi) hapEkipiFaqe();
    else if (g.cilesimet) hapOpsionet();
  })();
  hapFaqenBaze(); // v231: pa lejen "Stoku", kryefaqja është pjesa e parë e lejuar
})();
