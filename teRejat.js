/*
 * "Çka ka të re" — lista e ndryshimeve që u tregohet përdoruesve në hyrje (telefon dhe PC).
 *
 * SI PUNON: sa herë del një version i ri, shto NJË HYRJE NË KRYE të listës, me:
 *   v      = numri i versionit — I NJËJTI me numrin te sw.js (var CACHE = 'stoku-vNN') dhe te "teRejat.js?v=NN"
 *            në index.html, pc.html dhe sw.js (SHELL);
 *   data   = data e publikimit (VVVV-MM-DD);
 *   titulli = një rresht i shkurtër;
 *   pikat  = çka u shtua ose u përmirësua, me fjalë të thjeshta për punëtorët dhe menaxheren (jo teknike).
 *   platforma (opsionale) = 'tel' (vetëm telefoni) ose 'pc' (vetëm kompjuteri); pa të = të dyja.
 *            Telefoni s'i tregon hyrjet 'pc', kompjuteri s'i tregon hyrjet 'tel'.
 * Aplikacioni e mban mend versionin e fundit që përdoruesi e ka parë; në hyrje i tregon vetëm hyrjet më të reja.
 */
(function (root) {
  'use strict';

  var LISTA = [
    { v: 119, data: '2026-09-30', titulli: '"Çka ka të re" s\'humbet më', pikat: [
      'Kjo dritare s\'zhduket më kur aplikacioni rifreskohet vetë për përditësim: del pasi të përfundojë përditësimi.',
      'Shënohet si e lexuar vetëm kur e mbyll ti. Nëse e humb, del sërish herën tjetër.'
    ] },
    { v: 118, data: '2026-09-30', titulli: 'Kompjuter me ekran më të vogël', pikat: [
      'Në laptopë dhe ekrane më të vogla (1024 deri 1366), emri i produktit s\'zhduket më nga tabelat e stokut, afateve dhe ekipës.',
      'Te Ekipa, butonat e administratorit dhe emrat e anëtarëve s\'dalin më jashtë tabelës.',
      'Përmbledhja s\'del më jashtë ekranit kur një folder ka emër të gjatë.'
    ], platforma: 'pc' },
    { v: 117, data: '2026-09-30', titulli: 'Anësore më e qartë në kompjuter', pikat: [
      'Kategoritë Stoku, Afatet dhe Ekipa kanë secila ikonën dhe ngjyrën e vet, me një vijë ndarëse, që dallohet menjëherë ku fillon secila.',
      'Shigjeta në të djathtë të secilës kategori tani është buton më vete: e hap ose e mbyll kategorinë pa të çuar te ajo.',
      'Tekstet në aplikacion u pastruan: pa viza të gjata, me shenja më të thjeshta.'
    ], platforma: 'pc' },
    { v: 116, data: '2026-09-30', titulli: 'Administratori: heqja dhe fshirja e anëtarëve', pikat: [
      'Te Ekipa → Anëtarët administratori mund ta heqë kujtdo nga ekipa, ose ta fshijë llogarinë komplet (stoku, afatet dhe profili).',
      'Llogaria e fshirë del vetë nga Stoku dhe s\'mund të hyjë më; emri lirohet për një llogari të re.',
      'Edhe kërkesat për t\'u bashkuar kanë butonin "Fshij", për llogaritë e panjohura.'
    ] },
    { v: 115, data: '2026-09-30', titulli: 'Hyrja më e qëndrueshme', pikat: [
      'Me internet të dobët, "Hyr" pret derisa të lidhet me serverin, në vend që të thotë menjëherë "s\'ka internet".',
      'Në telefona ose PDA me shfletues shumë të vjetër, ekrani i hyrjes tregon saktë se duhet përditësuar Chrome / Android System WebView.',
      'Administratori sheh në krye të Ekipës kush pret miratimin dhe i pranon me një prekje.'
    ] },
    { v: 114, data: '2026-09-30', titulli: 'Ekipa me pamje të re', pikat: [
      'Ekipa hapet me një përmbledhje: sa produkte kanë skaduar, sa janë afër skadimit dhe sa janë në rregull te krejt ekipa.',
      'Poshtë saj: kush është online tani, çka duhet hequr nga rafti (me "Unë e hoqa" aty për aty) dhe çka skadon këtë javë.',
      'Aktiviteti, Kalendari, Anëtarët dhe Statistika hapen nga butonat me ikona; "mbrapa" të kthen te përmbledhja.'
    ] },
    { v: 113, data: '2026-09-30', titulli: 'Rregullime gabimesh', pikat: [
      'Një e dhënë e dëmtuar (p.sh. një folder ose afat pa emër/id) s\'e bllokon më aplikacionin: hiqet ose rregullohet vetë.',
      'Kur del nga llogaria pa internet, aplikacioni të paralajmëron që ndryshimet e fundit s\'janë ruajtur ende në cloud.',
      'Importi i Excel-it (kompjuter) s\'ngrin më me skedarë që kanë shumë rreshta bosh në fund.'
    ] },
    { v: 112, data: '2026-09-30', titulli: 'Administratori: opsione të reja', pikat: [
      'Administratori sheh te Ekipa → "Stoku" stokun e plotë të secilit anëtar dhe e shkarkon në Excel.',
      'Administratori mund ta heqë nga rafti, ta kthejë ose ta fshijë afatin e kujtdo, dhe pronari njoftohet.',
      'Administratori ua jep ose ua heq lejen e butonave +/- kujtdo (te Anëtarët), dhe dërgon një njoftim që i del krejt ekipës te zilja.',
      'Administratori mund ta pastrojë krejt chat-in ose aktivitetin.'
    ] },
    { v: 111, data: '2026-09-30', titulli: 'Ekipa: chat-i lart djathtas', pikat: [
      'Chat-i i ekipës tani hapet nga ikona lart djathtas, pranë njoftimeve. Pika e kuqe tregon mesazh të ri. Prekja sërish të kthen aty ku ishe.'
    ] },
    { v: 110, data: '2026-09-29', titulli: 'Ekipa më e sigurt, sinkronizim më i shpejtë', pikat: [
      'Një llogari e re e sheh Ekipën vetëm pasi ta pranojë administratori (te Ekipa → Anëtarët). Anëtarët e sotëm mbeten në ekipë.',
      'Kolegët shohin vetëm afatet e tua, ndërsa stoku yt mbetet vetëm i yti.',
      'Mesazhet e chat-it dhe "Unë e hoqa" s\'humbin pa internet: dërgohen vetë sapo të kthehet interneti, edhe nëse e mbyll aplikacionin.',
      'Ndryshimet nga pajisjet e tjera s\'humbin më kur mbërrijnë gjatë një ruajtjeje, dhe ruajtja në cloud dërgon vetëm pjesët që ndryshuan (më shpejt, më pak internet).'
    ] },
    { v: 109, data: '2026-09-29', titulli: 'Ekipa: afatet, aktiviteti, chat-i dhe më shumë', pikat: [
      '"Ekipi" tani quhet "Ekipa" dhe tregon vetëm afatet e kolegëve (jo stokun).',
      'Kur një produkt i një kolegu ka skaduar, mund ta heqësh ti nga rafti me "Unë e hoqa", dhe kolegu njoftohet me emrin tënd.',
      'Zilja lart djathtas: njoftimet, p.sh. kur dikush e heq nga rafti një produkt tëndin.',
      'Aktiviteti (kush çka hoqi, shtoi ose lajmëroi), chat-i i ekipës, kalendari me ngjyra për çdo ditë, anëtarët (kush është online tani) dhe statistika.'
    ] },
    { v: 105, data: '2026-09-29', titulli: 'Ekipi: stoku i përbashkët i krejt llogarive', pikat: [
      'U shtua "Ekipi": te telefoni si tab i tretë (mas Stoku dhe Afatet), te kompjuteri si seksion i tretë në anësore.',
      'Aty shihen stoku dhe afatet e KREJT llogarive, të shënuara me emrin e secilit përdorues.',
      'Secili sheh gjithçka, por fshin/ndryshon vetëm produktet dhe afatet e veta. Të tjerëve u shikohen, s\'u ndryshohen.'
    ] },
    { v: 103, platforma: 'pc', data: '2026-09-29', titulli: 'Kompjuteri: përmirësime te anësorja', pikat: [
      '"Stoku" dhe "Afatet" tani mund të jenë të dyja të hapura njëkohësisht, dhe hapja/mbyllja rrëshqet butë.',
      'Nën "Afatet" u shtuan "Të skaduara" dhe "Afër skadimit" si shkurtore të drejtpërdrejta.',
      'Fletët e dërguara nga telefoni tani shfaqen te faqja e duhur: fletët e stokut te "Stoku", fletët e afateve te "Afatet" (jo më të dyja te Afatet).'
    ] },
    { v: 101, platforma: 'pc', data: '2026-09-29', titulli: 'Kompjuteri: "Stoku"/"Afatet" si akordion në anësore', pikat: [
      '"Stoku" dhe "Afatet" tani janë ngjitur njëri pas tjetrit lart në anësore. Kliko njërin dhe hapet vetëm ai, me opsionet e tij poshtë emrit.'
    ] },
    { v: 99, platforma: 'pc', data: '2026-09-29', titulli: 'Kompjuteri: "Stoku" dhe "Afatet" të ndarë në anësore', pikat: [
      'Anësorja majtas tani i ka të dyja të qarta: "Stoku" lart (Përmbledhja, Të gjitha produktet, folderat) dhe "Afatet" poshtë (Afatet e produkteve).'
    ] },
    { v: 94, platforma: 'tel', data: '2026-09-29', titulli: 'Importi i stokut: furnizuesi + dërgo në kompjuter', pikat: [
      'Te importi i stokut nga foto, tani lexohet edhe furnizuesi për çdo produkt (jo vetëm barkodi/emri/sasia).',
      'Pas fotos, mund të zgjedhësh: vazhdo këtu në telefon, ose dërgoje në kompjuter për ta kontrolluar atje, njësoj si te Afatet.'
    ] },
    { v: 93, platforma: 'tel', data: '2026-09-29', titulli: 'Importi i stokut: krijo folder të ri aty për aty', pikat: [
      'Te importi i stokut nga foto, në zgjedhjen e folderit tani ka edhe "+ Folder i ri…", që e krijon dhe e zgjedh menjëherë, pa dalë nga kontrolli i listës.'
    ] },
    { v: 92, platforma: 'tel', data: '2026-09-29', titulli: 'Importo stokun nga një fletë e fotografuar', pikat: [
      'Në faqen kryesore, lart djathtas: fotografo (ose zgjidh nga galeria) një fletë ku janë shkruar produktet (barkodi, emri, sasia) dhe AI-ja i lexon rreshtat.',
      'I kontrollon dhe i korrigjon njësoj si te Afatet, zgjedh folderin ku shkojnë, dhe i ruan; nëse barkodi ekziston tashmë atje, sasia i shtohet.'
    ] },
    { v: 91, data: '2026-09-27', titulli: 'Përditësim automatik dhe kjo dritare', pikat: [
      'Aplikacioni e kontrollon vetë në sfond a ka version të ri sa herë hapet, dhe kalon te versioni i ri pa u dashur të mbyllet e të rihapet.',
      'Sa herë shtohet diçka e re ose përmirësohet, të tregohet këtu në hyrje.'
    ] },
    { v: 90, platforma: 'tel', data: '2026-09-27', titulli: 'Tabet poshtë ekranit (telefon)', pikat: [
      'Shirit i ri poshtë ekranit me tri tabe: Stoku, Afatet dhe Cilësimet, që arrihen me gishtin e madh, pa e lëvizur dorën.',
      'Te tabi Afatet shihet gjithmonë numri i produkteve të skaduara ose afër skadimit.',
      '"Opsionet" tani quhen "Cilësimet".'
    ] },
    { v: 89, platforma: 'tel', data: '2026-09-27', titulli: 'Afatet: më lehtë për t\'u shkruar', pikat: [
      'Data e skadimit shkruhet me vit 2-shifror: 011226 bëhet 01-12-26.',
      'Fusha e sasisë tregon "Copë" si tekst ndihmës.',
      'Ekrani nuk zmadhohet më me dy gishta.',
      'Mesazhi i afateve: "lajmëro furnizuesin sa më parë".'
    ] },
    { v: 86, platforma: 'tel', data: '2026-09-26', titulli: 'Njoftime, Excel dhe rregullime', pikat: [
      'Njoftime në telefon kur një produkti i kanë mbetur 30 ditë deri në skadim, dhe kur skadon.',
      'Te Afatet: zgjidh produkte dhe eksportoji në Excel, me kolonat që i zgjedh vetë.',
      'Ikona e cloud-it në krye të faqes së afateve tregon a janë ruajtur në cloud.',
      '"U hoq nga rafti" del vetëm për produktet e skaduara.',
      'Emri i aplikacionit tani është vetëm "Stoku".',
      'U rregulluan disa gabime të sinkronizimit mes telefonit dhe kompjuterit.'
    ] }
  ];

  function versioni() { return LISTA.length ? LISTA[0].v : 0; }
  // Hyrjet më të reja se versioni i fundit që përdoruesi e ka parë (nga më e reja te më e vjetra), vetëm për
  // këtë platformë ('tel' | 'pc'): hyrjet pa `platforma` vlejnë për të dyja.
  function teRejatPas(vPare, platforma) {
    return LISTA.filter(function (h) {
      return h.v > (Number(vPare) || 0) && (!h.platforma || !platforma || h.platforma === platforma);
    });
  }
  function formatoDaten(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return m ? m[3] + '.' + m[2] + '.' + m[1] : (iso || '');
  }

  var api = { LISTA: LISTA, versioni: versioni, teRejatPas: teRejatPas, formatoDaten: formatoDaten };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.StokuTeRejat = api;
})(typeof self !== 'undefined' ? self : this);
