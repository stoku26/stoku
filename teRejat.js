/*
 * "Çka ka të re" — lista e ndryshimeve që u tregohet përdoruesve në hyrje (telefon dhe PC).
 *
 * SI PUNON: sa herë del një version i ri, shto NJË HYRJE NË KRYE të listës, me:
 *   v      = numri i versionit — I NJËJTI me numrin te sw.js (var CACHE = 'stoku-vNN') dhe te "teRejat.js?v=NN"
 *            në index.html, pc.html dhe sw.js (SHELL);
 *   data   = data e publikimit (VVVV-MM-DD);
 *   titulli = një rresht i shkurtër;
 *   pikat  = çka u shtua ose u përmirësua, me fjalë të thjeshta për punëtorët dhe menaxheren (jo teknike).
 * Aplikacioni e mban mend versionin e fundit që përdoruesi e ka parë; në hyrje i tregon vetëm hyrjet më të reja.
 */
(function (root) {
  'use strict';

  var LISTA = [
    { v: 103, data: '2026-09-29', titulli: 'Kompjuteri: përmirësime te anësorja', pikat: [
      '"Stoku" dhe "Afatet" tani mund të jenë të dyja të hapura njëkohësisht, dhe hapja/mbyllja rrëshqet butë.',
      'Nën "Afatet" u shtuan "Të skaduara" dhe "Afër skadimit" si shkurtore të drejtpërdrejta.',
      'Fletët e dërguara nga telefoni tani shfaqen te faqja e duhur: fletët e stokut te "Stoku", fletët e afateve te "Afatet" (jo më të dyja te Afatet).'
    ] },
    { v: 101, data: '2026-09-29', titulli: 'Kompjuteri: "Stoku"/"Afatet" si akordion në anësore', pikat: [
      '"Stoku" dhe "Afatet" tani janë ngjitur njëri pas tjetrit lart në anësore — kliko njërin dhe hapet vetëm ai, me opsionet e tij poshtë emrit.'
    ] },
    { v: 99, data: '2026-09-29', titulli: 'Kompjuteri: "Stoku" dhe "Afatet" të ndarë në anësore', pikat: [
      'Anësorja majtas tani i ka të dyja të qarta: "Stoku" lart (Përmbledhja, Të gjitha produktet, folderat) dhe "Afatet" poshtë (Afatet e produkteve).'
    ] },
    { v: 94, data: '2026-09-29', titulli: 'Importi i stokut: furnizuesi + dërgo në kompjuter', pikat: [
      'Te importi i stokut nga foto, tani lexohet edhe furnizuesi për çdo produkt (jo vetëm barkodi/emri/sasia).',
      'Pas fotos, mund të zgjedhësh: vazhdo këtu në telefon, ose dërgoje në kompjuter për ta kontrolluar atje — njësoj si te Afatet.'
    ] },
    { v: 93, data: '2026-09-29', titulli: 'Importi i stokut: krijo folder të ri aty për aty', pikat: [
      'Te importi i stokut nga foto, në zgjedhjen e folderit tani ka edhe "+ Folder i ri…" — e krijon dhe e zgjedh menjëherë, pa dalë nga kontrolli i listës.'
    ] },
    { v: 92, data: '2026-09-29', titulli: 'Importo stokun nga një fletë e fotografuar', pikat: [
      'Në faqen kryesore, lart djathtas: fotografo (ose zgjidh nga galeria) një fletë ku janë shkruar produktet — barkodi, emri, sasia — dhe AI-ja i lexon rreshtat.',
      'I kontrollon dhe i korrigjon njësoj si te Afatet, zgjedh folderin ku shkojnë, dhe i ruan; nëse barkodi ekziston tashmë atje, sasia i shtohet.'
    ] },
    { v: 91, data: '2026-09-27', titulli: 'Përditësim automatik dhe kjo dritare', pikat: [
      'Aplikacioni e kontrollon vetë në sfond a ka version të ri sa herë hapet, dhe kalon te versioni i ri pa u dashur të mbyllet e të rihapet.',
      'Sa herë shtohet diçka e re ose përmirësohet, të tregohet këtu në hyrje.'
    ] },
    { v: 90, data: '2026-09-27', titulli: 'Tabet poshtë ekranit (telefon)', pikat: [
      'Shirit i ri poshtë ekranit me tri tabe: Stoku, Afatet dhe Cilësimet — arrihen me gishtin e madh, pa e lëvizur dorën.',
      'Te tabi Afatet shihet gjithmonë numri i produkteve të skaduara ose afër skadimit.',
      '"Opsionet" tani quhen "Cilësimet".'
    ] },
    { v: 89, data: '2026-09-27', titulli: 'Afatet: më lehtë për t\'u shkruar', pikat: [
      'Data e skadimit shkruhet me vit 2-shifror: 011226 bëhet 01-12-26.',
      'Fusha e sasisë tregon "Copë" si tekst ndihmës.',
      'Ekrani nuk zmadhohet më me dy gishta.',
      'Mesazhi i afateve: "lajmëro furnizuesin sa më parë".'
    ] },
    { v: 86, data: '2026-09-26', titulli: 'Njoftime, Excel dhe rregullime', pikat: [
      'Njoftime në telefon kur një produkti i kanë mbetur 30 ditë deri në skadim, dhe kur skadon.',
      'Te Afatet: zgjidh produkte dhe eksportoji në Excel, me kolonat që i zgjedh vetë.',
      'Ikona e cloud-it në krye të faqes së afateve tregon a janë ruajtur në cloud.',
      '"U hoq nga rafti" del vetëm për produktet e skaduara.',
      'Emri i aplikacionit tani është vetëm "Stoku".',
      'U rregulluan disa gabime të sinkronizimit mes telefonit dhe kompjuterit.'
    ] }
  ];

  function versioni() { return LISTA.length ? LISTA[0].v : 0; }
  // Hyrjet më të reja se versioni i fundit që përdoruesi e ka parë (nga më e reja te më e vjetra)
  function teRejatPas(vPare) { return LISTA.filter(function (h) { return h.v > (Number(vPare) || 0); }); }
  function formatoDaten(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return m ? m[3] + '.' + m[2] + '.' + m[1] : (iso || '');
  }

  var api = { LISTA: LISTA, versioni: versioni, teRejatPas: teRejatPas, formatoDaten: formatoDaten };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.StokuTeRejat = api;
})(typeof self !== 'undefined' ? self : this);
