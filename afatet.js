/*
 * Afatet (datat e skadimit të produkteve) — logjika e përbashkët për telefonin (index.html) dhe kompjuterin (pc.html).
 *
 * Ngjyrat:
 *   E KUQE    = ka skaduar          → produkti duhet të hiqet nga rafti/pozita.
 *   E VERDHË  = skadon brenda 30 ditëve (1 muaj) → lajmëro furnizuesin/komercialistin sa më parë.
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
    if (st === 'pa-date') return 'Mungon data e skadimit — plotësoje.';
    if (st === 'skaduar') return (n === -1 ? 'Skadoi dje' : 'Ka skaduar para ' + ditetTekst(-n)) + ' — ky produkt duhet të hiqet nga rafti/pozita.';
    if (st === 'afer') {
      var kur = n === 0 ? 'Skadon SOT' : n === 1 ? 'Skadon nesër' : 'Skadon për ' + ditetTekst(n);
      return kur + (a.lajmeruarSe ? ' — furnizuesi u lajmërua më ' + formato(isoNgaData(new Date(a.lajmeruarSe))) + '.' :
        ' — lajmëro furnizuesin ose komercialistin sa më parë.');
    }
    return 'Në rregull — skadon për ' + ditetTekst(n) + '.';
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

  // ---- Fusha e datës me numra (DD-MM-VVVV), pa kalendar: vizat shtohen vetë gjatë shkrimit ----
  // "01102026" → "01-10-2026"; "1-10-26" ose "1.10.26" → "01-10-26". Vlera e brendshme mbetet 'VVVV-MM-DD'.
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
  // Data për fushë: 'VVVV-MM-DD' → 'DD-MM-VVVV'
  function formatoPerFushe(iso) {
    var d = dataNgaIso(iso);
    return d ? dy(d.getDate()) + '-' + dy(d.getMonth() + 1) + '-' + d.getFullYear() : '';
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
    inp.placeholder = 'DD-MM-VVVV';
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

  // Mesazhi për furnizuesin/komercialistin (për WhatsApp/Viber/email)
  function mesazhiFurnizuesit(furnizuesi, lista) {
    var rr = lista.slice().sort(function (a, b) { return String(a.data).localeCompare(String(b.data)); }).map(function (a, i) {
      var n = ditetDeri(a.data);
      return (i + 1) + '. ' + (a.emri || 'Produkt') + (a.barkodi ? ' (' + a.barkodi + ')' : '') + (sasiaTekst(a) ? ' — ' + sasiaTekst(a) : '') + ' — skadon ' + formato(a.data) +
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
  async function lexoMeAI(foto, tokeni) {
    var url = adresaAI();
    if (!url) return { ok: false, gabim: 'pa-konfigurim' };
    try {
      var r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': tokeni ? 'Bearer ' + tokeni : '' },
        body: JSON.stringify({ image: foto.base64, mime: foto.mime, sot: sot() })
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

  function normalizoRreshtin(x) {
    x = x || {};
    var b = String(x.barkodi || '').replace(/[\s-]/g, '');
    if (/^[0-9oO]+$/.test(b)) b = b.replace(/[oO]/g, '0'); // "O" e lexuar në vend të zeros
    var dataOrig = String(x.data_origjinale || x.dataOrigjinale || x.data || '').trim();
    var iso = /^\d{4}-\d{2}-\d{2}$/.test(String(x.data || '')) && dataNgaIso(x.data) ? x.data : lexoDaten(x.data || dataOrig);
    return {
      barkodi: b,
      emri: String(x.emri || '').trim(),
      sasia: lexoSasine(x.sasia),
      sasiaOrigjinale: sasiaSiShume(x.sasia),
      data: iso || '',
      dataOrigjinale: dataOrig,
      furnizuesi: String(x.furnizuesi || '').trim(),
      dyshim: !!x.dyshim || !iso
    };
  }

  var api = {
    get AI_URL() { return adresaAI(); },
    DITET_PARALAJMERIMI: DITET_PARALAJMERIMI,
    sot: sot, isoNgaData: isoNgaData, ditetDeri: ditetDeri, statusi: statusi, formato: formato,
    pershkrimi: pershkrimi, lexoDaten: lexoDaten, lexoDatenEFushes: lexoDatenEFushes, lidhFushenEDates: lidhFushenEDates,
    formatoDatenGjateShkrimit: formatoDatenGjateShkrimit, formatoPerFushe: formatoPerFushe, idERe: idERe, krahaso: krahaso, numero: numero,
    mesazhiFurnizuesit: mesazhiFurnizuesit, pergatitFoton: pergatitFoton, fotoPerDergim: fotoPerDergim, lexoMeAI: lexoMeAI,
    normalizoRreshtin: normalizoRreshtin, ditetTekst: ditetTekst, lexoSasine: lexoSasine, sasiaSiShume: sasiaSiShume, sasiaTekst: sasiaTekst, shumaCopeve: shumaCopeve
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.StokuAfatet = api;
})(typeof self !== 'undefined' ? self : this);
