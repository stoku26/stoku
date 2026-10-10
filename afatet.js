/*
 * Afatet (datat e skadimit të produkteve) — logjika e përbashkët për telefonin (index.html) dhe kompjuterin (pc.html).
 *
 * Ngjyrat:
 *   E KUQE    = ka skaduar          → produkti duhet të hiqet nga rafti/pozita.
 *   E VERDHË  = skadon brenda 30 ditëve (1 muaj).
 *   E GJELBËR = në rregull.
 *   GRI       = i hequr nga rafti (i mbyllur, mbetet si histori).
 *
 * Afati: { id, barkodi, emri, data: 'VVVV-MM-DD', sasia (copë, ose '' nëse s'dihet), furnizuesi, statusi: 'aktiv'|'hequr',
 *          lajmeruarSe, hequrSe, krijuarSe, ndryshuarSe, krijuarNga }
 */
(function (root) {
  'use strict';

  // Adresa e Cloudflare Worker-it që e lexon foton me AI. Plotësohet pasi të krijohet Worker-i.
  // (Mund të mbishkruhet edhe për një pajisje të vetme me localStorage 'stoku:ai-url'.)
  var AI_URL = 'https://stoku-afatet.mendurb.workers.dev';

  var DITET_PARALAJMERIMI = 30;
  var DITA_MS = 86400000;

  function dy(n) { return (n < 10 ? '0' : '') + n; }
  function isoNgaData(d) { return d.getFullYear() + '-' + dy(d.getMonth() + 1) + '-' + dy(d.getDate()); }
  function sot() { return isoNgaData(new Date()); }

  function dataNgaIso(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return null;
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    return (d.getMonth() === +m[2] - 1 && d.getDate() === +m[3]) ? d : null;
  }

  // Sa ditë kanë mbetur deri në afat (0 = skadon sot, negativ = ka skaduar).
  function ditetDeri(iso, tani) {
    var d = dataNgaIso(iso);
    if (!d) return null;
    var s = tani ? new Date(tani) : new Date();
    s.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - s.getTime()) / DITA_MS);
  }

  function statusi(a, tani) {
    if (!a) return 'ok';
    if (a.statusi === 'hequr') return 'hequr';
    var n = ditetDeri(a.data, tani);
    if (n === null) return 'pa-date';
    if (n < 0) return 'skaduar';
    if (n <= DITET_PARALAJMERIMI) return 'afer';
    return 'ok';
  }

  function formato(iso) {
    var d = dataNgaIso(iso);
    return d ? dy(d.getDate()) + '.' + dy(d.getMonth() + 1) + '.' + d.getFullYear() : (iso || '');
  }

  function ditetTekst(n) { return n === 1 ? '1 ditë' : n + ' ditë'; }

  // Sasia: numër i plotë ≥ 0, ose '' kur s'është shkruar.
  // Pranon edhe shuma, siç i shkruajnë punëtorët në fletë kur u del mall tjetër: "60+30" → 90, "20 + 30 + 5" → 55.
  function lexoSasine(v) {
    if (v === null || v === undefined) return '';
    var t = String(v).trim().replace(/\s+/g, '').replace(/(cope|copë|cop|pcs|kom|x)$/i, '');
    if (!/^\d{1,6}(\+\d{1,6})*$/.test(t)) return '';
    return t.split('+').reduce(function (s, n) { return s + parseInt(n, 10); }, 0);
  }
  // Teksti i sasisë kur është shumë ("60+30"), që të krahasohet me fletën; përndryshe ''
  function sasiaSiShume(v) {
    var t = String(v === null || v === undefined ? '' : v).replace(/\s+/g, '');
    return /\+/.test(t) && lexoSasine(t) !== '' ? t : '';
  }
  function sasiaTekst(a) { return (a && a.sasia !== '' && a.sasia !== undefined && a.sasia !== null) ? a.sasia + ' copë' : ''; }
  // Shuma e copëve për një listë afatesh (vetëm ato që e kanë sasinë)
  function shumaCopeve(lista) {
    var s = 0;
    (lista || []).forEach(function (a) { if (typeof a.sasia === 'number') s += a.sasia; });
    return s;
  }

  // Teksti i veprimit të sugjeruar për menaxheren
  function pershkrimi(a, tani) {
    var st = statusi(a, tani);
    var n = ditetDeri(a.data, tani);
    if (st === 'hequr') return 'U hoq nga rafti' + (a.hequrSe ? ' më ' + formato(isoNgaData(new Date(a.hequrSe))) : '') + '.';
    if (st === 'pa-date') return 'Mungon data e skadimit. Plotësoje.';
    if (st === 'skaduar') return (n === -1 ? 'Skadoi dje' : 'Ka skaduar para ' + ditetTekst(-n)) + '. Ky produkt duhet të hiqet nga rafti/pozita.';
    if (st === 'afer') {
      var kur = n === 0 ? 'Skadon SOT' : n === 1 ? 'Skadon nesër' : 'Skadon për ' + ditetTekst(n);
      return kur + '.';
    }
    return 'Në rregull, skadon për ' + ditetTekst(n) + '.';
  }

  // Lexon data në formate të zakonshme të shkruara me dorë. Kthen 'VVVV-MM-DD' ose null.
  //   12.10.2026, 12/10/26, 12-10-2026, 2026-10-12, 12.10 (viti aktual/tjetër), 10/2026 ose 10.26 (fundi i muajit)
  var MUAJT = { jan: 1, shk: 2, feb: 2, mar: 3, pri: 4, apr: 4, maj: 5, may: 5, qer: 6, jun: 6, kor: 7, jul: 7, gus: 8, aug: 8,
    sht: 9, sep: 9, tet: 10, oct: 10, okt: 10, nen: 11, nën: 11, nov: 11, dhj: 12, dec: 12, dhe: 12 };
  function vitiPlote(v) { v = +v; return v < 100 ? 2000 + v : v; }
  function ndertoIso(v, m, d) {
    var dt = new Date(v, m - 1, d);
    if (dt.getFullYear() !== v || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
    return isoNgaData(dt);
  }
  function fundiMuajit(v, m) { return m >= 1 && m <= 12 ? isoNgaData(new Date(v, m, 0)) : null; }

  function lexoDaten(t) {
    if (t === null || t === undefined) return null;
    var s = String(t).trim().toLowerCase().replace(/\s+/g, ' ');
    if (!s) return null;
    var m;
    if ((m = /^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/.exec(s))) return ndertoIso(+m[1], +m[2], +m[3]);
    if ((m = /^(\d{1,2})[ .\/-](\d{1,2})[ .\/-](\d{2}|\d{4})$/.exec(s))) return ndertoIso(vitiPlote(m[3]), +m[2], +m[1]);
    if ((m = /^(\d{1,2})[.\/-](\d{4})$/.exec(s))) return fundiMuajit(+m[2], +m[1]);
    if ((m = /^(\d{1,2})[.\/-](\d{1,2})$/.exec(s))) {
      // "12.10" (ditë.muaj) — viti më i afërt në të ardhmen; "10/27" (muaj/vit) nëse numri i dytë > 12
      var a = +m[1], b = +m[2];
      if (b > 12) return fundiMuajit(vitiPlote(b), a);
      var tani = new Date(); var v = tani.getFullYear();
      var iso = ndertoIso(v, b, a);
      if (iso && ditetDeri(iso) < -180) iso = ndertoIso(v + 1, b, a);
      return iso;
    }
    if ((m = /^(\d{1,2})\s*([a-zëç]{3,})\.?\s*(\d{2}|\d{4})$/.exec(s)) && MUAJT[m[2].slice(0, 3)]) return ndertoIso(vitiPlote(m[3]), MUAJT[m[2].slice(0, 3)], +m[1]);
    if ((m = /^([a-zëç]{3,})\.?\s*(\d{2}|\d{4})$/.exec(s)) && MUAJT[m[1].slice(0, 3)]) return fundiMuajit(vitiPlote(m[2]), MUAJT[m[1].slice(0, 3)]);
    if ((m = /^(\d{2})(\d{2})(\d{2}|\d{4})$/.exec(s))) return ndertoIso(vitiPlote(m[3]), +m[2], +m[1]);
    return null;
  }

  // ---- Fusha e datës me numra (DD-MM-VV), pa kalendar: vizat shtohen vetë gjatë shkrimit ----
  // Viti shkruhet me 2 shifra: "011026" → "01-10-26" (= 2026); "1-10-26" ose "1.10.26" → "01-10-26".
  // Kush e shkruan me 4 shifra ("01102026") pranohet po ashtu. Vlera e brendshme mbetet 'VVVV-MM-DD'.
  function formatoDatenGjateShkrimit(raw) {
    var d = '';
    for (var i = 0; i < raw.length && d.length < 8; i++) {
      var c = raw.charAt(i);
      if (c >= '0' && c <= '9') d += c;
      else if (d.length === 1 || d.length === 3) d = d.slice(0, -1) + '0' + d.slice(-1); // "1-" → "01-"
    }
    var v = d.slice(0, 2);
    if (d.length >= 2) v += '-' + d.slice(2, 4);
    if (d.length >= 4) v += '-' + d.slice(4, 8);
    return v;
  }
  // Data për fushë: 'VVVV-MM-DD' → 'DD-MM-VV' (viti me 2 shifra; jashtë 2000–2099 me 4)
  function formatoPerFushe(iso) {
    var d = dataNgaIso(iso);
    if (!d) return '';
    var v = d.getFullYear();
    return dy(d.getDate()) + '-' + dy(d.getMonth() + 1) + '-' + (v >= 2000 && v < 2100 ? dy(v - 2000) : v);
  }
  // Vetëm data e plotë (ditë-muaj-vit) → 'VVVV-MM-DD'; gjysmë e shkruar ("12-10") → null
  function lexoDatenEFushes(v) {
    var t = String(v || '').trim();
    return /^\d{1,2}[.\/-]\d{1,2}[.\/-](\d{2}|\d{4})$/.test(t) ? lexoDaten(t) : null;
  }
  function lidhFushenEDates(inp) {
    inp.type = 'text';
    inp.inputMode = 'numeric';
    inp.autocomplete = 'off';
    inp.maxLength = 10;
    inp.placeholder = 'DD-MM-VV';
    inp.style.fontVariantNumeric = 'tabular-nums';
    // capture: formatohet para dëgjuesve të tjerë të fushës, që ata të marrin vlerën e rregulluar
    inp.addEventListener('input', function (ev) {
      if (ev.inputType && /^delete/.test(ev.inputType)) return; // fshirja lihet siç është
      if (inp.selectionStart !== null && inp.selectionStart < inp.value.length) return; // korrigjim në mes
      var v = formatoDatenGjateShkrimit(inp.value);
      if (v !== inp.value) inp.value = v;
    }, true);
  }

  function idERe() { return 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  // Renditja: të skaduarat (më të vjetrat së pari), pastaj ato afër, pastaj në rregull, në fund të hequrat.
  var RENDI_STATUSIT = { skaduar: 0, 'pa-date': 1, afer: 2, ok: 3, hequr: 4 };
  function krahaso(a, b) {
    var sa = RENDI_STATUSIT[statusi(a)], sb = RENDI_STATUSIT[statusi(b)];
    if (sa !== sb) return sa - sb;
    if (sa === 4) return (b.hequrSe || 0) - (a.hequrSe || 0);
    return String(a.data || '').localeCompare(String(b.data || '')) || String(a.emri || '').localeCompare(String(b.emri || ''), 'sq');
  }

  function numero(lista, tani) {
    var n = { skaduar: 0, afer: 0, ok: 0, hequr: 0, 'pa-date': 0, aktive: 0 };
    (lista || []).forEach(function (a) { var s = statusi(a, tani); n[s]++; if (s !== 'hequr') n.aktive++; });
    return n;
  }

  // ================= Leximi i fotos me AI =================
  function adresaAI() {
    try { var u = localStorage.getItem('stoku:ai-url'); if (u) return u; } catch (e) { /* ok */ }
    return AI_URL;
  }

  // Zvogëlon foton (max 2000 px, JPEG) që ngarkimi të jetë i shpejtë edhe me internet të dobët.
  // Fotoja dërgohet në rezolucionin më të madh të mundshëm (sa e bën kamera), pa e zvogëluar.
  // Kufijtë vijnë vetëm nga pajisja/shërbimi: kanvasi i iPhone-it (~16.7 MP) dhe madhësia që pranon AI-ja.
  var FOTO_PIKSELA_MAKS = 16777216;          // 4096×4096 — kufiri i kanvasit në Safari/iPhone
  var FOTO_ANA_MAKS = 8192;
  var FOTO_BASE64_MAKS = 14 * 1024 * 1024;   // ≈ 10 MB JPEG (Worker-i pranon deri 16 MB)
  function pergatitFoton(skedari) {
    return new Promise(function (zgjidh, refuzo) {
      var url = URL.createObjectURL(skedari);
      var img = new Image();
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight;
        var k = Math.min(1, FOTO_ANA_MAKS / Math.max(w, h), Math.sqrt(FOTO_PIKSELA_MAKS / (w * h)));
        // Cilësia e JPEG-ut: e lartë; ulet (e pastaj zvogëlohet) vetëm nëse fotoja kalon kufirin e madhësisë
        var provat = [[k, 0.95], [k, 0.9], [k, 0.85], [k * 0.85, 0.88], [k * 0.7, 0.88], [k * 0.55, 0.88]];
        function prova(i) {
          var kk = provat[i][0], cil = provat[i][1];
          var c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(w * kk)); c.height = Math.max(1, Math.round(h * kk));
          var ctx = c.getContext('2d');
          ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, c.width, c.height);
          var dataUrl = c.toDataURL('image/jpeg', cil);
          c.width = c.height = 0; // liro memorien menjëherë (telefonat/PDA me pak RAM)
          if (dataUrl.length < 100) { URL.revokeObjectURL(url); refuzo(new Error('foto-e-palexueshme')); return; }
          var base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
          if (base64.length > FOTO_BASE64_MAKS && i < provat.length - 1) { prova(i + 1); return; }
          URL.revokeObjectURL(url);
          zgjidh({ dataUrl: dataUrl, base64: base64, mime: 'image/jpeg', gjeresia: Math.round(w * kk), lartesia: Math.round(h * kk) });
        }
        try { prova(0); } catch (e) { URL.revokeObjectURL(url); refuzo(e); }
      };
      img.onerror = function () { URL.revokeObjectURL(url); refuzo(new Error('foto-e-palexueshme')); };
      img.src = url;
    });
  }

  // Foto e zvogëluar (≤ ~600 KB) që dërgohet nga telefoni në PC për kontroll — mjaft e qartë për ta
  // krahasuar me zoom, por e vogël sa të hyjë në një dokument të Firebase-it (kufiri 1 MB).
  function fotoPerDergim(dataUrl) {
    return new Promise(function (zgjidh, refuzo) {
      var img = new Image();
      img.onload = function () {
        var provat = [[2000, 0.75], [1700, 0.72], [1400, 0.7], [1100, 0.65]];
        for (var i = 0; i < provat.length; i++) {
          var k = Math.min(1, provat[i][0] / Math.max(img.naturalWidth, img.naturalHeight));
          var c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(img.naturalWidth * k)); c.height = Math.max(1, Math.round(img.naturalHeight * k));
          var g = c.getContext('2d');
          g.imageSmoothingQuality = 'high';
          g.drawImage(img, 0, 0, c.width, c.height);
          var u = c.toDataURL('image/jpeg', provat[i][1]);
          c.width = c.height = 0;
          if (u.length < 800000 || i === provat.length - 1) { zgjidh(u); return; }
        }
      };
      img.onerror = function () { refuzo(new Error('foto-e-palexueshme')); };
      img.src = dataUrl;
    });
  }

  // Kthen { ok, rreshtat: [{ barkodi, emri, data, dataOrigjinale, furnizuesi, dyshim }], gabim }
  // ekstra (opsionale): fusha shtesë të dërguara te Worker-i (p.sh. { synim: 'stok' } — përdoret nga
  // importi i stokut nga foto, jo nga Afatet). Worker-i aktual i injoron fushat e panjohura; kjo është
  // përgatitje për t'i dhënë Worker-it një udhëzim tjetër më vonë, pa e prishur thirrjen ekzistuese.
  async function lexoMeAI(foto, tokeni, ekstra) {
    var url = adresaAI();
    if (!url) return { ok: false, gabim: 'pa-konfigurim' };
    try {
      var r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': tokeni ? 'Bearer ' + tokeni : '' },
        body: JSON.stringify(Object.assign({ image: foto.base64, mime: foto.mime, sot: sot() }, ekstra || {}))
      });
      var j = null;
      try { j = await r.json(); } catch (e) { /* ok */ }
      if (!r.ok) return { ok: false, gabim: (j && j.gabim) || ('http-' + r.status) };
      var rreshtat = (j && Array.isArray(j.rreshtat) ? j.rreshtat : []).map(normalizoRreshtin).filter(function (x) {
        return x.barkodi || x.emri || x.data;
      });
      return { ok: true, rreshtat: rreshtat };
    } catch (e) {
      return { ok: false, gabim: 'rrjeti' };
    }
  }

  function pozicioniIVlefshem(v) {
    var n = Number(v);
    return isFinite(n) && v !== null && v !== '' ? Math.max(0, Math.min(1, n)) : null;
  }
  function normalizoRreshtin(rresht) {
    rresht = rresht || {};
    var b = String(rresht.barkodi || '').replace(/[\s-]/g, '');
    if (/^[0-9oO]+$/.test(b)) b = b.replace(/[oO]/g, '0'); // "O" e lexuar në vend të zeros
    var dataOrig = String(rresht.data_origjinale || rresht.dataOrigjinale || rresht.data || '').trim();
    var iso = /^\d{4}-\d{2}-\d{2}$/.test(String(rresht.data || '')) && dataNgaIso(rresht.data) ? rresht.data : lexoDaten(rresht.data || dataOrig);
    return {
      barkodi: b,
      emri: String(rresht.emri || '').trim(),
      sasia: lexoSasine(rresht.sasia),
      sasiaOrigjinale: sasiaSiShume(rresht.sasia),
      data: iso || '',
      dataOrigjinale: dataOrig,
      furnizuesi: String(rresht.furnizuesi || '').trim(),
      dyshim: !!rresht.dyshim || !iso,
      // Pozicioni i rreshtit në foto (0..1, majtas/lart→djathtas/poshtë), për të shënuar numrin e
      // rreshtit mbi foto gjatë kontrollit; null nëse Worker-i s'e ka dhënë (kopje më e vjetër).
      x: pozicioniIVlefshem(rresht.x),
      y: pozicioniIVlefshem(rresht.y)
    };
  }

  // Kolona "Ditët e mbetura": { para, nr, pas } — numri shfaqet i theksuar ("Skadoi para" 2 "ditësh", 5 "ditë", "Sot")
  function ditetEMbetura(a, tani) {
    var st = statusi(a, tani), n = ditetDeri(a && a.data, tani);
    if (st === 'hequr') return { para: 'U hoq nga rafti', nr: '', pas: '' };
    if (n === null) return { para: 'Pa datë', nr: '', pas: '' };
    if (n < -1) return { para: 'Skadoi para', nr: String(-n), pas: 'ditësh' };
    if (n === -1) return { para: 'Skadoi', nr: '', pas: 'dje' };
    if (n === 0) return { para: '', nr: 'Sot', pas: 'skadon' };
    if (n === 1) return { para: '', nr: '1', pas: 'ditë (nesër)' };
    return { para: '', nr: String(n), pas: 'ditë' };
  }

  // ---------- Muajt (filtri dhe eksporti sipas muajit të skadimit) ----------
  var EMRAT_MUAJVE = ['Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor', 'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'];
  var MUAJT_PLOTE = [['janar', 'january', 'jan'], ['shkurt', 'february', 'feb', 'shk'], ['mars', 'march', 'mar'], ['prill', 'april', 'pri', 'apr'],
    ['maj', 'may'], ['qershor', 'june', 'qer', 'jun'], ['korrik', 'july', 'kor', 'jul'], ['gusht', 'august', 'gus', 'aug'],
    ['shtator', 'september', 'sht', 'sep', 'sept'], ['tetor', 'october', 'tet', 'okt', 'oct'], ['nentor', 'november', 'nen', 'nov'], ['dhjetor', 'december', 'dhj', 'dec', 'dhe']];
  function pastroShkronjat(t) {
    return String(t || '').toLowerCase().replace(/ë/g, 'e').replace(/ç/g, 'c').replace(/[^a-z]/g, '');
  }
  // "Nëntor", "nentor2", "NENTOR 2", "Nëntor (2)", "nov" → 11. Numrat dhe shenjat harrohen. Jo-muaj → null.
  function muajiNgaEmri(t) {
    var sh = pastroShkronjat(t);
    if (sh.length < 3) return null;
    for (var i = 0; i < MUAJT_PLOTE.length; i++) {
      var l = MUAJT_PLOTE[i];
      for (var j = 0; j < l.length; j++) if (sh === l[j] || (sh.length >= 3 && l[j].length > 3 && l[j].indexOf(sh) === 0)) return i + 1;
    }
    return null;
  }
  // 'VVVV-MM' e muajit të skadimit; 'pa-date' kur s'ka datë
  function celesiMuajit(a) { var d = a && a.data; return /^\d{4}-\d{2}/.test(String(d || '')) ? String(d).slice(0, 7) : 'pa-date'; }
  function emriMuajit(celes, meVit) {
    if (celes === 'pa-date') return 'Pa datë';
    var m = /^(\d{4})-(\d{2})$/.exec(String(celes || ''));
    if (!m) return '';
    return EMRAT_MUAJVE[+m[2] - 1] + (meVit === false ? '' : ' ' + m[1]);
  }
  // Muajt që ka lista (sipas datës së skadimit), me numrin e afateve; renditur sipas kohës, "Pa datë" në fund
  function muajtELista(lista) {
    var m = {};
    (lista || []).forEach(function (a) { var k = celesiMuajit(a); m[k] = (m[k] || 0) + 1; });
    var vitet = {};
    Object.keys(m).forEach(function (k) { if (k !== 'pa-date') vitet[k.slice(0, 4)] = true; });
    var meVit = Object.keys(vitet).length > 1 || (Object.keys(vitet).length === 1 && Object.keys(vitet)[0] !== String(new Date().getFullYear()));
    return Object.keys(m).sort(function (a, b) { return a === 'pa-date' ? 1 : b === 'pa-date' ? -1 : a.localeCompare(b); })
      .map(function (k) { return { celes: k, n: m[k], emri: emriMuajit(k, meVit) }; });
  }

  // Furnizuesit që ka lista (për eksportin vetëm të një furnizuesi), me numrin e afateve; "Pa furnizues" në fund.
  // Emrat krahasohen pa dallim shkronjash të mëdha/vogla dhe hapësirash ("Meridian " = "meridian").
  var PA_FURNIZUES = '__pa__';
  function celesiFurnizuesit(a) {
    var f = String((a && a.furnizuesi) || '').trim().replace(/\s+/g, ' ').toLowerCase();
    return f || PA_FURNIZUES;
  }
  function furnizuesitELista(lista) {
    var m = {};
    (lista || []).forEach(function (a) {
      var k = celesiFurnizuesit(a);
      if (!m[k]) m[k] = { celes: k, n: 0, emri: k === PA_FURNIZUES ? 'Pa furnizues' : String(a.furnizuesi).trim().replace(/\s+/g, ' ') };
      m[k].n++;
    });
    return Object.keys(m).map(function (k) { return m[k]; }).sort(function (a, b) {
      if (a.celes === PA_FURNIZUES) return 1;
      if (b.celes === PA_FURNIZUES) return -1;
      return a.emri.localeCompare(b.emri, 'sq');
    });
  }

  // ---------- Importi i afateve nga Excel/CSV ----------
  function tekstNgaQeliza(v) {
    if (typeof v === 'number') return Number.isInteger(v) && Math.abs(v) < 1e21 ? v.toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 0 }) : String(v);
    return String(v === undefined || v === null ? '' : v).trim();
  }
  // Data nga një qelizë: numër serial i Excel-it, tekst ("12.10.2026", "12 nëntor 26"…), ose vetëm dita ("15")
  // kur fleta ka emrin e muajit ("Nëntor2" → nëntor).
  function ditaNeMuaj(dita, muaji) {
    var t = new Date(), v = t.getFullYear();
    var iso = ndertoIso(v, muaji, dita);
    if (iso && ditetDeri(iso) < -180) iso = ndertoIso(v + 1, muaji, dita);
    return iso;
  }
  function dataNgaQeliza(v, muajiFletes) {
    if (typeof v === 'number' && isFinite(v)) {
      if (v > 20000 && v < 80000) { var d = new Date(Math.round((v - 25569) * DITA_MS)); return ndertoIso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()); }
      if (v >= 1 && v <= 31 && Number.isInteger(v) && muajiFletes) return ditaNeMuaj(v, muajiFletes);
      v = String(v);
    }
    var s = String(v === undefined || v === null ? '' : v).trim();
    if (!s) return null;
    var iso = lexoDaten(s);
    if (iso) return iso;
    if (/^\d{1,2}\.?$/.test(s) && muajiFletes) return ditaNeMuaj(parseInt(s, 10), muajiFletes);
    return null;
  }
  function normTitulli(t) { return String(t || '').toLowerCase().replace(/ë/g, 'e').replace(/ç/g, 'c').replace(/[^a-z0-9]/g, ''); }
  // Gjen kolonat sipas titujve (ose sipas përmbajtjes kur s'ka tituj): { barkodi, emri, data, sasia, furnizuesi } (-1 = s'ka)
  function hamendesoKolonatEAfateve(rows, meKoke) {
    var nKol = (rows || []).reduce(function (m, r) { return Math.max(m, (r || []).length); }, 0);
    var k = { barkodi: -1, emri: -1, data: -1, sasia: -1, furnizuesi: -1 };
    var fjalet = { barkodi: ['barkod', 'barcode', 'ean', 'kodi', 'sku', 'code'], data: ['skad', 'afat', 'data', 'expir', 'exp', 'valid', 'deri', 'date'],
      sasia: ['sasi', 'cope', 'qty', 'quantity', 'pako', 'stok'], furnizuesi: ['furniz', 'supplier', 'kompani', 'firma', 'distribut', 'vendor'],
      emri: ['emri', 'emer', 'produkt', 'artikull', 'pershkrim', 'name', 'description', 'malli'] };
    if (meKoke && rows && rows[0]) {
      var titujt = rows[0].map(normTitulli);
      ['barkodi', 'data', 'sasia', 'furnizuesi', 'emri'].forEach(function (f) {
        for (var i = 0; i < titujt.length; i++) {
          if (Object.keys(k).some(function (x) { return k[x] === i; })) continue;
          if (fjalet[f].some(function (w) { return titujt[i].indexOf(w) !== -1; })) { k[f] = i; break; }
        }
      });
    }
    // Sipas përmbajtjes, për ato që mbetën pa u gjetur
    var mostra = (rows || []).slice(meKoke ? 1 : 0, (meKoke ? 1 : 0) + 30);
    function piket(fn) {
      var m = -1, iM = -1;
      for (var i = 0; i < nKol; i++) {
        if (Object.keys(k).some(function (x) { return k[x] === i; })) continue;
        var n = mostra.filter(function (r) { return r && fn(r[i]); }).length;
        if (n > m && n >= Math.max(1, mostra.length * 0.5)) { m = n; iM = i; }
      }
      return iM;
    }
    if (k.data < 0) k.data = piket(function (v) { return (typeof v === 'number' && v > 20000 && v < 80000) || (typeof v === 'string' && !!lexoDaten(v)); });
    if (k.barkodi < 0) k.barkodi = piket(function (v) { return /^\d{6,14}$/.test(tekstNgaQeliza(v)); });
    if (k.emri < 0) k.emri = piket(function (v) { return typeof v === 'string' && /[a-zA-Zëç]{3,}/.test(v); });
    if (k.sasia < 0) k.sasia = piket(function (v) { var t = tekstNgaQeliza(v); return /^\d{1,5}$/.test(t) && +t < 100000; });
    return k;
  }
  // fletet: [{ name, rows }]; opt: { meKoke, kol: {barkodi, emri, data, sasia, furnizuesi}, ekzistuese: afatet[] }
  // Kthen planin (pa ndryshuar asgjë): rreshtat me { fleta, nr, barkodi, emri, data, sasia, furnizuesi, gabim, veprimi }.
  function planiImportitAfateve(fletet, opt) {
    opt = opt || {};
    var kol0 = opt.kol || {};
    var titujt0 = opt.meKoke && fletet[0] && fletet[0].rows[0] ? fletet[0].rows[0].map(normTitulli) : null;
    var ekz = {};
    (opt.ekzistuese || []).forEach(function (a) { if (a.statusi !== 'hequr' && a.data) ekz[(a.barkodi || normTitulli(a.emri)) + '|' + a.data] = true; });
    var plan = { rreshta: [], teRinj: 0, ekzistojne: 0, gabime: 0, bashkuar: 0 };
    var neSkedar = {};
    fletet.forEach(function (sh) {
      var muaji = muajiNgaEmri(sh.name);
      // Kolonat: sipas titullit të njëjtë në çdo fletë (kur ka tituj), përndryshe i njëjti numër kolone
      var kol = {};
      Object.keys(kol0).forEach(function (f) {
        var i = kol0[f];
        if (i >= 0 && titujt0 && sh.rows[0]) {
          var t = sh.rows[0].map(normTitulli), j = t.indexOf(titujt0[i]);
          kol[f] = j >= 0 ? j : i;
        } else kol[f] = i;
      });
      var rows = opt.meKoke ? sh.rows.slice(1) : sh.rows;
      rows.forEach(function (r, i) {
        r = r || [];
        var v = function (f) { return kol[f] >= 0 ? r[kol[f]] : ''; };
        var b = tekstNgaQeliza(v('barkodi')).replace(/[\s-]/g, '');
        var emri = tekstNgaQeliza(v('emri'));
        if (!b && !emri && !tekstNgaQeliza(v('data'))) return; // rresht bosh
        if (/^(gjithsej|totali?|shuma|sum)$/i.test(b || emri)) return;
        var data = dataNgaQeliza(v('data'), muaji);
        var s = kol.sasia >= 0 ? lexoSasine(v('sasia')) : '';
        var rr = { fleta: sh.name, nr: i + 1 + (opt.meKoke ? 1 : 0), barkodi: /^\d+$/.test(b) ? b : (b ? b : ''), emri: emri, data: data || '',
          dataOrigjinale: tekstNgaQeliza(v('data')), sasia: s === null || s === undefined ? '' : s, furnizuesi: tekstNgaQeliza(v('furnizuesi')), gabim: '', veprimi: '' };
        if (!rr.barkodi && !rr.emri) rr.gabim = 'pa barkod dhe pa emër';
        else if (!data) rr.gabim = rr.dataOrigjinale ? 'data s\'u kuptua' : 'pa datë';
        if (rr.gabim) { plan.gabime++; plan.rreshta.push(rr); return; }
        var ck = (rr.barkodi || normTitulli(rr.emri)) + '|' + rr.data;
        if (ekz[ck]) { rr.veprimi = 'ekziston, kalohet'; plan.ekzistojne++; }
        else if (neSkedar[ck]) { rr.veprimi = 'bashkohet me rreshtin ' + neSkedar[ck].nr + (neSkedar[ck].fleta !== rr.fleta ? ' (' + neSkedar[ck].fleta + ')' : ''); rr.bashkoMe = neSkedar[ck]; plan.bashkuar++; }
        else { rr.veprimi = 'i ri'; plan.teRinj++; neSkedar[ck] = rr; }
        plan.rreshta.push(rr);
      });
    });
    return plan;
  }
  // Afatet që do të shtohen (rreshtat e përsëritur në skedar bashkohen: sasitë mblidhen)
  function afatetNgaPlani(plan, meta) {
    meta = meta || {};
    var tani = Date.now(), out = [];
    plan.rreshta.forEach(function (r) {
      if (r.gabim || r.veprimi !== 'i ri') return;
      var sasia = r.sasia;
      plan.rreshta.forEach(function (x) { if (x.bashkoMe === r && typeof x.sasia === 'number') sasia = (typeof sasia === 'number' ? sasia : 0) + x.sasia; });
      var a = { id: idERe(), barkodi: r.barkodi, emri: r.emri, data: r.data, sasia: sasia, furnizuesi: r.furnizuesi, statusi: 'aktiv', krijuarSe: tani, ndryshuarSe: tani, burimi: 'excel' };
      if (meta.krijuarNga) a.krijuarNga = meta.krijuarNga;
      out.push(a);
    });
    return out;
  }

  // ---------- Furnizuesit (Cilësimet → Stoku, vetëm për administratorin) ----------
  // Lista e furnizuesve me sa afate (dhe produkte) i kanë: [{ emri, afate, produkte }], renditur sipas alfabetit.
  // kujtesa (opsionale): K.lista() e grupit, që furnizuesit e kolegëve të dalin te të gjithë (v205). produkte = barkode të
  // ndryshme (stoku + kujtesa). nePritje: furnizuesi del vetëm te produktet e reja të kolegëve (pret kontrollin), nga = kush.
  function listaEFurnizuesve(afatet, produktet, kujtesa) {
    var m = {};
    function rec(emri) {
      emri = String(emri || '').trim();
      if (!emri) return null;
      return (m[emri] = m[emri] || { emri: emri, afate: 0, b: {}, vetemPritje: true, nga: {} });
    }
    (afatet || []).forEach(function (a) { var r = a && rec(a.furnizuesi); if (r) { r.afate++; r.vetemPritje = false; } });
    var p = produktet || {};
    Object.keys(p).forEach(function (k) { var r = p[k] && rec(p[k].furnizuesi); if (r) { r.b[p[k].barkodi || k] = 1; r.vetemPritje = false; } });
    (kujtesa || []).forEach(function (x) {
      var r = x && rec(x.furnizuesi); if (!r) return;
      r.b[x.barkodi] = 1;
      if (!x.nePritje) r.vetemPritje = false; else if (x.nga) r.nga[x.nga] = 1;
    });
    return Object.keys(m).map(function (k) {
      var r = m[k];
      return { emri: r.emri, afate: r.afate, produkte: Object.keys(r.b).length, nePritje: r.vetemPritje, nga: r.vetemPritje ? Object.keys(r.nga) : [] };
    }).sort(function (a, b) { return a.emri.localeCompare(b.emri, 'sq', { sensitivity: 'base' }) || a.emri.localeCompare(b.emri); });
  }
  // A ekziston tashmë një furnizues tjetër me këtë emër (pa dallim shkronjash të mëdha/vogla)? Kthen emrin e tij ose ''.
  function furnizuesiEkzistues(lista, emri, pervec) {
    var e = String(emri || '').trim().toLocaleLowerCase('sq');
    for (var i = 0; i < (lista || []).length; i++) {
      var x = lista[i].emri;
      if (x !== pervec && x.toLocaleLowerCase('sq') === e) return x;
    }
    return '';
  }
  // Ndryshon emrin e furnizuesit `vjeter` në `iRi` te krejt afatet dhe produktet (pa i prekur origjinalet).
  // Afatet marrin ndryshuarSe = tani; produktet prekurSe + 1 ms (fitojnë sinkronizimin pa u ngjitur te "Ndryshuar së fundi").
  // Kthen { afatet, produktet, nAfate, nProdukte }.
  function riemertoFurnizuesin(afatet, produktet, vjeter, iRi, tani) {
    vjeter = String(vjeter || '').trim(); iRi = String(iRi || '').trim(); tani = tani || Date.now();
    var nA = 0, nP = 0, pRe = {};
    var aRe = (afatet || []).map(function (a) {
      if (!a || String(a.furnizuesi || '').trim() !== vjeter || !vjeter || !iRi) return a;
      nA++;
      return Object.assign({}, a, { furnizuesi: iRi, ndryshuarSe: tani });
    });
    var p = produktet || {};
    Object.keys(p).forEach(function (k) {
      var x = p[k];
      if (x && vjeter && iRi && String(x.furnizuesi || '').trim() === vjeter) {
        nP++;
        pRe[k] = Object.assign({}, x, { furnizuesi: iRi, prekurSe: (typeof x.prekurSe === 'number' ? x.prekurSe : 0) + 1 });
      } else pRe[k] = x;
    });
    return { afatet: aRe, produktet: pRe, nAfate: nA, nProdukte: nP };
  }

  // ---------- Ikonat e folderave (telefon + PC) ----------
  // folder.ikona = id nga kjo listë (zgjidhet te "Folder i ri"); folderat pa ikonë e marrin sipas emrit.
  // ngj = klasa e ngjyrës te stoku-tokens.css (.ngj-*), që përshtatet vetë me temën e çelët/të errët.
  var IKONAT_FOLDERAVE = [
    { id: 'kutia', emri: 'Kuti', ngj: 'gri', d: 'M12 2.5 21 7v10l-9 4.5L3 17V7l9-4.5Z M3 7l9 4.5L21 7 M12 11.5v10 M7.5 4.8l9 4.5' },
    { id: 'shporta', emri: 'Ushqim', ngj: 'blu', d: 'M3 10h18l-1.7 8.4A2 2 0 0 1 17.3 20H6.7a2 2 0 0 1-2-1.6L3 10Z M7.5 10l3-6 M16.5 10l-3-6 M9 14v2.5 M15 14v2.5 M12 14v2.5' },
    { id: 'shishe', emri: 'Pije', ngj: 'vjollce', d: 'M10 2h4 M10.5 2v3.5L8.6 8.3A3 3 0 0 0 8 10.1V20a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-9.9a3 3 0 0 0-.6-1.8L13.5 5.5V2 M8 13.5h8' },
    { id: 'gjethe', emri: 'Fresh', ngj: 'gjelber', d: 'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z M2 21c0-3 1.9-5.4 5.1-6 2.4-.5 4.9-2 5.9-3' },
    { id: 'molla', emri: 'Fruta', ngj: 'kuqe', d: 'M12 7.5c-1-1.8-3-2.6-5-1.8-3.2 1.2-3.8 5.6-1.8 10 1.5 3.4 3.5 4.9 5 4.4.7-.3 1.1-.5 1.8-.5s1.1.2 1.8.5c1.5.5 3.5-1 5-4.4 2-4.4 1.4-8.8-1.8-10-2-.8-4 0-5 1.8Z M12 7.5c0-2 .8-3.6 2.8-4.5' },
    { id: 'qumesht', emri: 'Bulmet', ngj: 'blu', d: 'M8 2h8 M9 2v3L7 8.5V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V8.5L15 5V2 M7 8.5h10 M10 14h4' },
    { id: 'buka', emri: 'Furra', ngj: 'portokalli', d: 'M5 10.5a3.5 3.5 0 0 1 3.5-3.5h7a3.5 3.5 0 0 1 3.5 3.5 2 2 0 0 1-1.5 1.9V19a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-6.6A2 2 0 0 1 5 10.5Z M10 7v2.5 M14 7v2.5' },
    { id: 'akull', emri: 'Të ngrira', ngj: 'blu', d: 'M12 2v20 M3.3 7l17.4 10 M20.7 7 3.3 17 M9.5 3.5 12 6l2.5-2.5 M9.5 20.5 12 18l2.5 2.5' },
    { id: 'embelsira', emri: 'Ëmbëlsira', ngj: 'roze', d: 'M3 21h18 M4 21v-7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7 M4 16c2 1.4 4 1.4 6 0s4-1.4 6 0 3 1 4 0 M12 12V8 M12 5v.01' },
    { id: 'kafe', emri: 'Kafe', ngj: 'portokalli', d: 'M17 9h1a3.5 3.5 0 0 1 0 7h-1 M3 9h14v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9Z M7 2.5v3 M10.5 2.5v3 M14 2.5v3' },
    { id: 'pika', emri: 'Higjiene', ngj: 'vjollce', d: 'M12 2.7l5.7 5.7a8 8 0 1 1-11.4 0L12 2.7Z M8.5 14.5a3.5 3.5 0 0 0 3.5 3.5' },
    { id: 'shtepia', emri: 'Shtëpia', ngj: 'gjelber', d: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9.5Z M9.5 21v-6.5h5V21' },
    { id: 'kryq', emri: 'Farmaci', ngj: 'kuqe', d: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z' },
    { id: 'etiketa', emri: 'Oferta', ngj: 'roze', d: 'M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9Z M7.5 7.5h.01' },
    { id: 'yll', emri: 'Të tjera', ngj: 'portokalli', d: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z' },
    { id: 'zemra', emri: 'Të preferuara', ngj: 'kuqe', d: 'M19.5 13.6 12 21l-7.5-7.4A5 5 0 1 1 12 7a5 5 0 1 1 7.5 6.6Z' }
  ];
  var IKONAT_SIPAS_EMRIT = [
    [/ushq|market|shport/, 'shporta'], [/pije|leng|uj[eë]|birr|ver[eë]/, 'shishe'], [/fresh|perim|sallat/, 'gjethe'],
    [/frut|moll/, 'molla'], [/bulm|qum[eë]sht|djath|kos|jogurt/, 'qumesht'], [/buk|furr|pasticer/, 'buka'],
    [/ngrir|akull|frigo/, 'akull'], [/[eë]mb[eë]l|[cç]okoll|biskot|sheqer/, 'embelsira'], [/kafe|[cç]aj/, 'kafe'],
    [/higjien|pastr|detergj|sapun|kozmet/, 'pika'], [/sht[eë]pi|kuzhin/, 'shtepia'], [/farmac|sh[eë]ndet|barn/, 'kryq'],
    [/ofert|zbritj|akcion/, 'etiketa']
  ];
  function ikonaEFolderit(f) {
    var id = f && f.ikona;
    for (var i = 0; i < IKONAT_FOLDERAVE.length; i++) if (IKONAT_FOLDERAVE[i].id === id) return IKONAT_FOLDERAVE[i];
    var emri = String((f && f.emri) || '').toLowerCase();
    for (var j = 0; j < IKONAT_SIPAS_EMRIT.length; j++) if (IKONAT_SIPAS_EMRIT[j][0].test(emri)) return ikonaEFolderit({ ikona: IKONAT_SIPAS_EMRIT[j][1] });
    return IKONAT_FOLDERAVE[0];
  }
  // SVG si tekst (pa DOM), me ngjyrën e tekstit (currentColor)
  function svgEIkones(ik, masa) {
    var m = masa || 20;
    return '<svg width="' + m + '" height="' + m + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      String(ik.d).split(' M').map(function (x, i) { return '<path d="' + (i ? 'M' : '') + x + '"></path>'; }).join('') + '</svg>';
  }

  // Zgjedhësi i ikonës (dialogu "Folder i ri" / "Riemërto"): rrjetë butonash me radio. emriFn → emri i shkruar,
  // që ikona të sugjerohet vetë derisa përdoruesi të zgjedhë një me dorë.
  function zgjedhesIIkonave(cont, emriFn) {
    var zgjedhur = null, meDore = false, butonat = [];
    cont.textContent = '';
    cont.setAttribute('role', 'radiogroup');
    IKONAT_FOLDERAVE.forEach(function (ik) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'fl-ikona ngj-' + ik.ngj; b.setAttribute('role', 'radio');
      b.setAttribute('aria-label', ik.emri); b.title = ik.emri; b.innerHTML = svgEIkones(ik, 22);
      b.addEventListener('click', function () { meDore = true; vendos(ik.id); });
      butonat.push([ik.id, b]); cont.appendChild(b);
    });
    function vendos(id) {
      zgjedhur = id;
      butonat.forEach(function (x) { x[1].classList.toggle('zgjedhur', x[0] === id); x[1].setAttribute('aria-checked', x[0] === id ? 'true' : 'false'); });
    }
    function sugjero() { if (!meDore) vendos(ikonaEFolderit({ emri: emriFn ? emriFn() : '' }).id); }
    return {
      fillo: function (id) { meDore = !!id; if (id) vendos(id); else sugjero(); },
      sugjero: sugjero,
      vlera: function () { return zgjedhur; }
    };
  }

  // ---------- Kujtesa e produkteve (v196, grupi v197): barkodi → { emri, furnizuesi } ----------
  // Kopja në pajisje (localStorage) mbahet gjithmonë: plotësimi është i menjëhershëm edhe pa internet. Brenda një grupi,
  // ekipa.js e sinkronizon me grupet/{g}/kujtesa (e përbashkët për krejt grupin). Mëson kur përdoruesi ruan një afat ose
  // produkt me barkod, dhe në sfond nga afatet/stoku ekzistues dhe nga afatet e kolegëve; ndryshohet te Cilësimet → Stoku →
  // Produktet (vetëm administratori, v198). Hyrja: { e: emri, f: furnizuesi, k: koha, n: kush e shtoi, a: 1 = mësuar
  // automatikisht, m: 1 = ndryshuar me dorë, s: 1 = nga administratori, x: 1 = harruar ("Harroje") }.
  // Klasat kur dy hyrje përplasen: administratori (s) > përdoruesi / e harruar > automatike; brenda klasës fiton më e reja.
  // Hyrja e administratorit s'mbishkruhet nga të tjerët: ata e shohin kur skanojnë (mund ta ndryshojnë vetëm te afati i tyre).
  var KUJTESA_KEY = 'stoku:kujtesa:v1', KUJTESA_MAKS = 20000, KUJTESA_BARKODI = /^[^\s]{1,40}$/;
  function pastroBarkodin(b) { return String(b == null ? '' : b).replace(/\s+/g, '').slice(0, 40); }
  function pastroTekstin(t, n) { return String(t == null ? '' : t).replace(/\s+/g, ' ').trim().slice(0, n); }
  // v206: "Harroje" e administratorit (x + s) ka të njëjtën peshë si ruajtja e tij: fiton më e reja, ndryshe produkti
  // i harruar kthehej nga grupi (versioni i vjetër i administratorit mundte shënimin "i harruar")
  function klasaEHyrjes(x) { if (!x) return -1; if (x.x) return x.s ? 2 : 1; if (x.s) return 2; return x.a && !x.m ? 0 : 1; }
  // A duhet që hyrja r (p.sh. nga grupi) ta zëvendësojë hyrjen l (këtu)?
  function hyrjaFiton(r, l) {
    if (!l) return true;
    var cr = klasaEHyrjes(r), cl = klasaEHyrjes(l);
    if (cr !== cl) return cr > cl;
    return (Number(r.k) || 0) > (Number(l.k) || 0);
  }
  // Hyrje e pastër (për ruajtje dhe për t'u marrë nga grupi): vetëm fushat e njohura, me gjatësi të kufizuar
  function hyrjaEPastruar(x) {
    if (!x || typeof x !== 'object') return null;
    var k = Number(x.k) || 0;
    if (x.x) return x.s ? { x: 1, k: k, s: 1 } : { x: 1, k: k };
    var e = pastroTekstin(typeof x.e === 'string' ? x.e : '', 120), f = pastroTekstin(typeof x.f === 'string' ? x.f : '', 80);
    if (!e && !f) return null;
    var r = { e: e, f: f, k: k };
    if (x.m) r.m = 1; else if (x.a) r.a = 1;
    if (x.s) r.s = 1;
    var n = pastroTekstin(typeof x.n === 'string' ? x.n : '', 40);
    if (n) r.n = n;
    return r;
  }
  // Produkt i shkruar nga një koleg (ka autor, s'është i administratorit): pret kontrollin e administratorit (v201)
  function eshteNePritje(x) { return !!(x && !x.x && !x.s && x.n); }
  function krijoKujtesen(ruajtja) {
    var harta = null, degjuesit = [], autori = { emri: '', admin: false };
    function lexo() {
      if (harta) return harta;
      try { harta = JSON.parse((ruajtja && ruajtja.getItem(KUJTESA_KEY)) || '{}'); } catch (e) { harta = null; }
      if (!harta || typeof harta !== 'object' || Array.isArray(harta)) harta = {};
      return harta;
    }
    function shkruaj() {
      var h = lexo(), ks = Object.keys(h);
      if (ks.length > KUJTESA_MAKS) {
        ks.sort(function (a, b) { return (h[a].k || 0) - (h[b].k || 0); }).slice(0, ks.length - KUJTESA_MAKS).forEach(function (x) { delete h[x]; });
      }
      try { if (ruajtja) ruajtja.setItem(KUJTESA_KEY, JSON.stringify(h)); } catch (e) { /* memoria e shfletuesit plot: mbetet vetëm për këtë seancë */ }
    }
    // Ndryshimet e bëra këtu (jo ato që vijnë nga grupi): ekipa.js i dërgon te grupi
    function njofto(barkodet) { if (barkodet.length) degjuesit.forEach(function (fn) { try { fn(barkodet.slice()); } catch (e) { /* ok */ } }); }
    // menyra 'mbishkruaj' (ruajtje nga përdoruesi: fushat jo-bosh zëvendësojnë) | 'plotëso' (në sfond: vetëm hyrje të reja
    // ose plotësim i atyre automatike; hyrjet e përdoruesit, me dorë ose të harruara s'preken)
    function mesoNje(h, b, emri, furn, menyra, tani) {
      b = pastroBarkodin(b); emri = pastroTekstin(emri, 120); furn = pastroTekstin(furn, 80);
      if (!b || (!emri && !furn)) return false;
      var x = h[b], ri;
      if (menyra === 'plotëso') {
        if (x && klasaEHyrjes(x) !== 0) return false;
        ri = { e: (x && x.e) || emri, f: (x && x.f) || furn, k: tani || Date.now(), a: 1 };
        if (x && ri.e === x.e && ri.f === x.f) return false;
      } else {
        var vjeter = x && !x.x ? x : null;
        if (x && x.s && !autori.admin) return false; // e administratorit (edhe e harruar prej tij): të tjerët s'e mbishkruajnë
        ri = { e: emri || (vjeter && vjeter.e) || '', f: furn || (vjeter && vjeter.f) || '', k: tani || Date.now() };
        if (vjeter && vjeter.m) ri.m = 1;
        if (autori.admin) ri.s = 1;
        if (vjeter && !vjeter.a && !!vjeter.s === !!ri.s && ri.e === vjeter.e && ri.f === vjeter.f) return false;
        // Autori ruhet vetëm kur dikush e shkruan produktin për herë të parë ose e ndryshon (v201: produktet e kolegëve
        // presin kontrollin e administratorit); i njëjti emër e furnizues s'e kalon një produkt të njohur në pritje
        if (autori.emri && (autori.admin || !vjeter || ri.e !== vjeter.e || ri.f !== vjeter.f)) ri.n = autori.emri;
        else if (vjeter && vjeter.n) ri.n = vjeter.n;
      }
      h[b] = ri;
      return b;
    }
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('storage', function (ev) { if (!ev || ev.key === KUJTESA_KEY || ev.key === null) harta = null; }); // ndryshim nga një dritare tjetër
    }
    return {
      merr: function (b) {
        b = pastroBarkodin(b);
        var x = b ? lexo()[b] : null;
        return x && !x.x ? { barkodi: b, emri: x.e || '', furnizuesi: x.f || '', koha: x.k || 0, meDore: !!x.m } : null;
      },
      meso: function (b, emri, furn, menyra) { var h = lexo(), r = mesoNje(h, b, emri, furn, menyra); if (!r) return false; shkruaj(); njofto([r]); return true; },
      // lista: [{ barkodi, emri, furnizuesi }]; një shkrim i vetëm në fund
      mesoShume: function (lista, menyra) {
        var h = lexo(), ndr = [], tani = Date.now();
        (lista || []).forEach(function (x) { var r = x && mesoNje(h, x.barkodi, x.emri, x.furnizuesi, menyra, tani); if (r) ndr.push(r); });
        if (ndr.length) { shkruaj(); njofto(ndr); }
        return ndr.length;
      },
      // Ndryshim me dorë (Cilësimet → Produktet): vendos saktësisht; pa emër dhe pa furnizues = e harruar
      vendos: function (b, emri, furn) {
        b = pastroBarkodin(b); emri = pastroTekstin(emri, 120); furn = pastroTekstin(furn, 80);
        if (!b) return false;
        var h = lexo();
        var ri = !emri && !furn ? { x: 1, k: Date.now() } : { e: emri, f: furn, k: Date.now(), m: 1 };
        if (autori.admin) ri.s = 1;
        if (!ri.x && autori.emri) ri.n = autori.emri;
        h[b] = ri;
        shkruaj(); njofto([b]);
        return true;
      },
      fshij: function (b) {
        b = pastroBarkodin(b); var h = lexo();
        if (!h[b] || (h[b].x && (h[b].s || !autori.admin))) return false;
        h[b] = autori.admin ? { x: 1, k: Date.now(), s: 1 } : { x: 1, k: Date.now() };
        shkruaj(); njofto([b]); return true;
      },
      // Furnizuesi u riemërtua (Cilësimet → Furnizuesit): edhe në kujtesë
      riemertoFurnizuesin: function (vjeter, iRi) {
        vjeter = pastroTekstin(vjeter, 80); iRi = pastroTekstin(iRi, 80);
        if (!vjeter || !iRi || vjeter === iRi) return 0;
        var h = lexo(), ndr = [], v = vjeter.toLocaleLowerCase('sq'), tani = Date.now();
        Object.keys(h).forEach(function (b) {
          if (!h[b].x && h[b].f && h[b].f.toLocaleLowerCase('sq') === v) {
            h[b].f = iRi; h[b].k = tani; delete h[b].a;
            if (autori.admin && !eshteNePritje(h[b])) h[b].s = 1; // ato në pritje mbeten në pritje: emri ende s'është kontrolluar
            ndr.push(b);
          }
        });
        if (ndr.length) { shkruaj(); njofto(ndr); }
        return ndr.length;
      },
      lista: function () {
        var h = lexo();
        return Object.keys(h).filter(function (b) { return !h[b].x; }).map(function (b) { return { barkodi: b, emri: h[b].e || '', furnizuesi: h[b].f || '', koha: h[b].k || 0, meDore: !!h[b].m, ngaAdmini: !!h[b].s, nga: h[b].n || '', automatik: !!h[b].a, nePritje: eshteNePritje(h[b]) }; })
          .sort(function (a, b) { return (a.emri || a.barkodi).localeCompare(b.emri || b.barkodi, 'sq'); });
      },
      numri: function () { var h = lexo(); return Object.keys(h).filter(function (b) { return !h[b].x; }).length; },
      numriNePritje: function () { var h = lexo(); return Object.keys(h).filter(function (b) { return eshteNePritje(h[b]); }).length; },
      // Kush po shkruan (emri i llogarisë dhe a është administratori i Stoku-t): vendoset nga faqja
      vendosAutorin: function (emri, admin) { autori.emri = pastroTekstin(emri, 40); autori.admin = !!admin; },
      // ---- Sinkronizimi me grupin (ekipa.js) ----
      degjo: function (fn) { degjuesit.push(fn); return function () { degjuesit = degjuesit.filter(function (x) { return x !== fn; }); }; },
      // Hyrjet që vijnë nga grupi: zëvendësojnë këtu vetëm kur fitojnë (pa njoftuar dëgjuesit: s'kthehen te grupi)
      bashko: function (remote) {
        if (!remote || typeof remote !== 'object') return 0;
        var h = lexo(), n = 0;
        Object.keys(remote).forEach(function (b) {
          if (!KUJTESA_BARKODI.test(b)) return;
          var r = hyrjaEPastruar(remote[b]);
          if (r && hyrjaFiton(r, h[b])) { h[b] = r; n++; }
        });
        if (n) shkruaj();
        return n;
      },
      // Barkodet ku kjo pajisje ka diçka më të mirë se grupi (p.sh. hera e parë në grup, ose ndryshime pa internet)
      perDergim: function (remote) {
        var h = lexo(); remote = remote || {};
        return Object.keys(h).filter(function (b) {
          if (!KUJTESA_BARKODI.test(b)) return false;
          var r = hyrjaEPastruar(remote[b]);
          return !r || hyrjaFiton(h[b], r);
        });
      },
      // Hyrjet e plota për grupin (me krejt fushat, që bashkimi i Firebase-it të mos lërë mbetje nga hyrja e vjetër)
      hyrjePerGrup: function (barkodet) {
        var h = lexo(), o = {};
        (barkodet || []).forEach(function (b) {
          var x = h[b];
          if (!x || !KUJTESA_BARKODI.test(b)) return;
          o[b] = x.x ? { e: '', f: '', k: x.k || 0, a: 0, m: 0, s: x.s ? 1 : 0, n: '', x: 1 } : { e: x.e || '', f: x.f || '', k: x.k || 0, a: x.a ? 1 : 0, m: x.m ? 1 : 0, s: x.s ? 1 : 0, n: x.n || '', x: 0 };
        });
        return o;
      },
      pastro: function () { harta = {}; shkruaj(); },
      harro: function () { harta = null; } // lexohet sërish nga ruajtja (p.sh. pas pastrimit të të dhënave)
    };
  }
  var kujtesaEPajisjes = null;
  function kujtesa() {
    if (!kujtesaEPajisjes) {
      var ls = null;
      try { ls = typeof localStorage !== 'undefined' ? localStorage : null; } catch (e) { ls = null; }
      kujtesaEPajisjes = krijoKujtesen(ls);
    }
    return kujtesaEPajisjes;
  }

  var api = {
    get AI_URL() { return adresaAI(); },
    DITET_PARALAJMERIMI: DITET_PARALAJMERIMI,
    sot: sot, isoNgaData: isoNgaData, ditetDeri: ditetDeri, statusi: statusi, formato: formato,
    pershkrimi: pershkrimi, lexoDaten: lexoDaten, lexoDatenEFushes: lexoDatenEFushes, lidhFushenEDates: lidhFushenEDates,
    formatoDatenGjateShkrimit: formatoDatenGjateShkrimit, formatoPerFushe: formatoPerFushe, idERe: idERe, krahaso: krahaso, numero: numero,
    pergatitFoton: pergatitFoton, fotoPerDergim: fotoPerDergim, lexoMeAI: lexoMeAI,
    normalizoRreshtin: normalizoRreshtin, EMRAT_MUAJVE: EMRAT_MUAJVE, muajiNgaEmri: muajiNgaEmri, celesiMuajit: celesiMuajit, emriMuajit: emriMuajit,
    muajtELista: muajtELista, furnizuesitELista: furnizuesitELista, celesiFurnizuesit: celesiFurnizuesit, ditetEMbetura: ditetEMbetura, dataNgaQeliza: dataNgaQeliza, hamendesoKolonatEAfateve: hamendesoKolonatEAfateve,
    planiImportitAfateve: planiImportitAfateve, afatetNgaPlani: afatetNgaPlani, tekstNgaQeliza: tekstNgaQeliza, ditetTekst: ditetTekst, lexoSasine: lexoSasine, sasiaSiShume: sasiaSiShume, sasiaTekst: sasiaTekst, shumaCopeve: shumaCopeve,
    listaEFurnizuesve: listaEFurnizuesve, furnizuesiEkzistues: furnizuesiEkzistues, riemertoFurnizuesin: riemertoFurnizuesin,
    IKONAT_FOLDERAVE: IKONAT_FOLDERAVE, ikonaEFolderit: ikonaEFolderit, svgEIkones: svgEIkones, zgjedhesIIkonave: zgjedhesIIkonave,
    kujtesa: kujtesa, krijoKujtesen: krijoKujtesen, KUJTESA_KEY: KUJTESA_KEY
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.StokuAfatet = api;
})(typeof self !== 'undefined' ? self : this);
