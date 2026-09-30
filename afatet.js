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

  // Mesazhi për furnizuesin (për WhatsApp/Viber/email)
  function mesazhiFurnizuesit(furnizuesi, lista) {
    var rr = lista.slice().sort(function (a, b) { return String(a.data).localeCompare(String(b.data)); }).map(function (a, i) {
      var n = ditetDeri(a.data);
      return (i + 1) + '. ' + (a.emri || 'Produkt') + (a.barkodi ? ' (' + a.barkodi + ')' : '') + (sasiaTekst(a) ? ', ' + sasiaTekst(a) : '') + ', skadon ' + formato(a.data) +
        (n === null ? '' : n < 0 ? ' (KA SKADUAR)' : n === 0 ? ' (sot)' : ' (për ' + ditetTekst(n) + ')');
    });
    return 'Përshëndetje' + (furnizuesi ? ' ' + furnizuesi : '') + ',\n\n' +
      'Këto produkte në dyqanin tonë ' + (lista.length === 1 ? 'i afrohet' : 'u afrohen') + ' afatit të skadimit:\n\n' +
      rr.join('\n') + '\n\nJu lutem na kontaktoni për kthim ose zëvendësim sa më parë. Faleminderit!';
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

  var api = {
    get AI_URL() { return adresaAI(); },
    DITET_PARALAJMERIMI: DITET_PARALAJMERIMI,
    sot: sot, isoNgaData: isoNgaData, ditetDeri: ditetDeri, statusi: statusi, formato: formato,
    pershkrimi: pershkrimi, lexoDaten: lexoDaten, lexoDatenEFushes: lexoDatenEFushes, lidhFushenEDates: lidhFushenEDates,
    formatoDatenGjateShkrimit: formatoDatenGjateShkrimit, formatoPerFushe: formatoPerFushe, idERe: idERe, krahaso: krahaso, numero: numero,
    mesazhiFurnizuesit: mesazhiFurnizuesit, pergatitFoton: pergatitFoton, fotoPerDergim: fotoPerDergim, lexoMeAI: lexoMeAI,
    normalizoRreshtin: normalizoRreshtin, EMRAT_MUAJVE: EMRAT_MUAJVE, muajiNgaEmri: muajiNgaEmri, celesiMuajit: celesiMuajit, emriMuajit: emriMuajit,
    muajtELista: muajtELista, dataNgaQeliza: dataNgaQeliza, hamendesoKolonatEAfateve: hamendesoKolonatEAfateve,
    planiImportitAfateve: planiImportitAfateve, afatetNgaPlani: afatetNgaPlani, tekstNgaQeliza: tekstNgaQeliza, ditetTekst: ditetTekst, lexoSasine: lexoSasine, sasiaSiShume: sasiaSiShume, sasiaTekst: sasiaTekst, shumaCopeve: shumaCopeve
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.StokuAfatet = api;
})(typeof self !== 'undefined' ? self : this);
