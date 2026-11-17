/*
 * Eksportet e afateve (v301): "Eksporto si foto" (JPG për furnizuesin) dhe "Eksporto PDF" (A4 për printim), të përbashkëta për
 * telefonin (app-tel.js) dhe kompjuterin (app-pc.js). Pronari (foto e PC-së): "Butoni excel qe osht ne pc bone identik edhe emertoje
 * eksporto sikur ne web app tel qe osht me qato opsione". Këtu vetëm vizatimi (canvas, jsPDF); dritaret dhe zgjedhjet janë te
 * secila faqe. Android: EksportiFoto.kt dhe EksportiPdf.kt me të njëjtat masa: ndryshoji bashkë.
 * Kodi u zhvendos pa ndryshime nga app-tel.js (v274 foto, v275/v299/v300 PDF).
 */
(function (root) {
  'use strict';
  var AF = root.StokuAfatet;

  var AEF_MAKS = 100; // mbi kaq afate fotoja ndahet në pjesë (kujtesa e telefonit)
  var AEF_NGJ = {
    dark: { bg: '#0f1115', surface: '#171a20', line: '#2a2e36', line2: '#22262d', ink: '#eceef2', ink2: '#c9ccd3', muted: '#8f949e', faint: '#6f747e',
      exp: '#f07a6f', near: '#f0b95a', ok: '#5cc98b', pillBg: '#2a2414', pillTx: '#f5b942', logo: '#ffffff', erret: true },
    light: { bg: '#f6f5f2', surface: '#ffffff', line: '#e6e4df', line2: '#e6e4df', ink: '#14161b', ink2: '#3a3d44', muted: '#7a7d85', faint: '#8a8d94',
      exp: '#c23a33', near: '#a45f10', ok: '#2e7d4f', pillBg: '#fcefd9', pillTx: '#a45f10', logo: '#14161b', erret: false }
  };
  var AEF_W = 540, AEF_P = 20, AEF_S = 2;

  function aefKendi(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function aefFont(c, px, pesha, mono, hapesira) {
    c.font = pesha + ' ' + px + 'px ' + (mono ? "'JetBrains Mono', monospace" : 'Onest, sans-serif');
    if ('letterSpacing' in c) c.letterSpacing = (hapesira || 0) + 'px';
  }
  // Teksti në rreshta (deri në maks); i fundit me "…" kur s'nxë
  function aefRreshtat(c, t, gjeresia, maks) {
    var fjalet = String(t).replace(/\s+/g, ' ').trim().split(' '), rr = [], r = '';
    fjalet.forEach(function (f) {
      var p = r ? r + ' ' + f : f;
      if (c.measureText(p).width <= gjeresia || !r) r = p; else { rr.push(r); r = f; }
    });
    if (r) rr.push(r);
    if (rr.length > maks) { rr = rr.slice(0, maks); rr[maks - 1] += '…'; }
    return rr.map(function (x, i) {
      if (c.measureText(x).width <= gjeresia) return x;
      var y = x.replace(/…$/, '');
      while (y.length > 1 && c.measureText(y + '…').width > gjeresia) y = y.slice(0, -1);
      return y.replace(/\s+$/, '') + '…';
    });
  }
  function aefTekst(c, t, x, qendra, ngjyra, drejtimi) {
    c.fillStyle = ngjyra; c.textAlign = drejtimi || 'left'; c.textBaseline = 'middle'; c.fillText(t, x, qendra);
  }
  // v313: logoja 60 me ngjyrat që ka zgjedhur përdoruesi (Cilësimet → Pamja → Logoja, logot.js); C.logo = ngjyra e shkronjave.
  // Kthen gjerësinë e vizatuar (lartësia h, raporti StokuLogot.logoW : logoH).
  function aefLogo(c, x, y, h, C) {
    var L = root.StokuLogot;
    return L ? L.vizatoLogon(c, x, y, h, { erret: !!C.erret, tekst: C.logo }) : 0;
  }
  function aefShenja(c, x, y, s) {
    if (root.StokuLogot) root.StokuLogot.vizatoIkonen(c, x, y, s);
  }
  // Ditët djathtas te çdo rresht: "−2 / ditë më parë", "Sot / skadon", "12 / ditë", "2 / muaj"
  function aefDitet(a) {
    var n = AF.ditetDeri(a.data);
    if (n === null) return { m: '–', v: 'pa datë', k: 'exp' };
    if (n < 0) return { m: '−' + (-n), v: 'ditë më parë', k: 'exp' };
    if (n === 0) return { m: 'Sot', v: 'skadon', k: 'exp' };
    if (n >= 60) return { m: String(Math.round(n / 30)), v: 'muaj', k: 'ok' };
    return { m: String(n), v: 'ditë', k: n <= 30 ? 'near' : 'ok' };
  }
  // o: { titulli, meta, afatet (të renditura), tema: 'dark'|'light', data, ora, pjesa }. Kthen canvas-in (1080 px e gjerë).
  function aefVizato(o) {
    var C = AEF_NGJ[o.tema === 'dark' ? 'dark' : 'light'], W = AEF_W, P = AEF_P, S = AEF_S;
    var cv = document.createElement('canvas'), c = cv.getContext('2d');
    var gjEmrit = W - 2 * P - 18 - 14 - 74 - 14;
    aefFont(c, 34, 700, false, -1); var tit = aefRreshtat(c, o.titulli, W - 2 * P, 2);
    aefFont(c, 14, 400); var meta = o.meta ? aefRreshtat(c, o.meta, W - 2 * P, 1)[0] : '';
    var rr = o.afatet.map(function (a) {
      aefFont(c, 15.5, 600);
      var em = aefRreshtat(c, a.emri || a.barkodi || 'Pa emër', gjEmrit, 2), b = String(a.barkodi || '');
      aefFont(c, 13, 500); var info = aefRreshtat(c, [AF.sasiaTekst(a), a.data ? AF.formato(a.data) : 'Pa datë'].filter(Boolean).join(' · '), gjEmrit, 1)[0];
      return { em: em, b: b, info: info, d: aefDitet(a), h: 13 + 20 * em.length + 3 + 17 + (b ? 19 : 0) + 13 };
    });
    var nr = AF.numero(o.afatet);
    var H = 28 + 30 + 26 + 14 + 8 + 36 * tit.length + (meta ? 24 : 0) + 22 + 82 + 14;
    rr.forEach(function (r) { H += 8 + r.h; });
    H += 24 + 1 + 16 + 18 + 24;
    cv.width = W * S; cv.height = Math.ceil(H * S);
    c.scale(S, S);
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    var y = 28;
    aefLogo(c, P, y, 30, C);
    aefFont(c, 12, 600); var dw = c.measureText(o.data).width + 22;
    c.fillStyle = C.pillBg; aefKendi(c, W - P - dw, y + 2, dw, 26, 13); c.fill();
    aefTekst(c, o.data, W - P - 11, y + 15, C.pillTx, 'right');
    y += 30 + 26;
    aefFont(c, 11, 700, false, 1.32); aefTekst(c, 'AFATET E PRODUKTEVE', P, y + 7, C.muted);
    y += 14 + 8;
    aefFont(c, 34, 700, false, -1); tit.forEach(function (t) { aefTekst(c, t, P, y + 18, C.ink); y += 36; });
    if (meta) { y += 6; aefFont(c, 14, 400); aefTekst(c, meta, P, y + 9, C.muted); y += 18; }
    y += 22;
    c.fillStyle = C.surface; aefKendi(c, P + 0.5, y + 0.5, W - 2 * P - 1, 81, 20); c.fill();
    c.strokeStyle = C.line; c.lineWidth = 1; c.stroke();
    var kw = (W - 2 * P) / 3;
    [[nr.skaduar + nr['pa-date'], 'Të skaduara', C.exp], [nr.afer, 'Afër skadimit', C.near], [nr.ok, 'Në rregull', C.ok]].forEach(function (k, i) {
      var x = P + kw * i;
      if (i) { c.fillStyle = C.line; c.fillRect(x, y + 1, 1, 80); }
      aefFont(c, 30, 700, false, -0.9); aefTekst(c, String(k[0]), x + 16, y + 16 + 15, k[2]);
      aefFont(c, 12.5, 500); aefTekst(c, k[1], x + 16, y + 16 + 30 + 6 + 8, C.muted);
    });
    y += 82 + 14;
    rr.forEach(function (r) {
      y += 8;
      var x = P, w = W - 2 * P;
      c.save(); aefKendi(c, x, y, w, r.h, 16); c.fillStyle = C.surface; c.fill(); c.clip();
      c.fillStyle = C[r.d.k]; aefKendi(c, x - 4, y, 8, r.h, 4); c.fill();
      c.restore();
      c.strokeStyle = C.line2; c.lineWidth = 1; aefKendi(c, x + 0.5, y + 0.5, w - 1, r.h - 1, 15.5); c.stroke();
      var ty = y + 13;
      aefFont(c, 15.5, 600); r.em.forEach(function (t) { aefTekst(c, t, x + 18, ty + 10, C.ink); ty += 20; });
      ty += 3; aefFont(c, 13, 500); aefTekst(c, r.info, x + 18, ty + 8.5, C.ink2); ty += 17;
      if (r.b) { ty += 3; aefFont(c, 12.5, 500); aefTekst(c, r.b, x + 18, ty + 8, C.faint); } // v275: Onest (zeroja pa pikë, s'ngjan me 8)
      var q = y + r.h / 2;
      aefFont(c, 18, 700, false, -0.36); aefTekst(c, r.d.m, x + w - 14, q - 9, C[r.d.k], 'right');
      aefFont(c, 11.5, 500); aefTekst(c, r.d.v, x + w - 14, q + 11, C.muted, 'right');
      y += r.h;
    });
    y += 24;
    c.fillStyle = C.line; c.fillRect(P, y, W - 2 * P, 1);
    y += 1 + 16;
    aefShenja(c, P, y, 18);
    aefFont(c, 12, 500); aefTekst(c, 'stoku.site', P + 26, y + 9, C.faint); // v313: pa "Krijuar me Stoku" (pronari)
    aefTekst(c, (o.pjesa ? o.pjesa + ' · ' : '') + 'ora ' + o.ora, W - P, y + 9, C.faint, 'right');
    return cv;
  }
  function aefSkedari(cv, emri) {
    var u = cv.toDataURL('image/jpeg', 0.9), b = atob(u.slice(u.indexOf(',') + 1)), v = new Uint8Array(b.length);
    for (var i = 0; i < b.length; i++) v[i] = b.charCodeAt(i);
    return { skedari: new File([v], emri, { type: 'image/jpeg' }), emri: emri };
  }
  function aefFontet() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all(['400 14px Onest', '500 13px Onest', '600 15px Onest', '700 34px Onest', "400 12px 'JetBrains Mono'"].map(function (f) {
      return document.fonts.load(f).catch(function () {});
    }));
  }
  var AP = { W: 210, H: 297, MX: 12.7, KOKA1: 37.2, KOKA: 15.3, RR: 7.4, FUND: 290, FUND2: 290, SASIA_P: 6, MESI: 18.5 };
  var AP_NGJ = { ink: [20, 22, 27], ink2: [58, 61, 68], muted: [107, 110, 118], faint: [138, 141, 148], line2: [232, 230, 225], zebra: [250, 249, 247] };
  // Sa rreshta në secilën faqe
  function apPlani(n) {
    var faqet = [], y0 = AP.KOKA1;
    do { var nxe = Math.floor(((faqet.length ? AP.FUND2 : AP.FUND) - y0) / AP.RR); faqet.push(Math.min(nxe, n)); n -= nxe; y0 = AP.KOKA; } while (n > 0);
    return faqet;
  }
  // v313: raporti i logos (gjerësia / lartësia), për PDF-në
  function apRaporti() { return root.StokuLogot ? root.StokuLogot.logoW / root.StokuLogot.logoH : 158.53 / 43.2; }
  function apLogo() {
    var cv = document.createElement('canvas'); cv.width = Math.round(208 * apRaporti()); cv.height = 208;
    aefLogo(cv.getContext('2d'), 0, 0, 208, AEF_NGJ.light);
    return cv.toDataURL('image/png');
  }
  // l: afatet e renditura; o: { info: [[teksti, i trashë]…] (periudha, zgjedhjet, sa produkte e copë), data, ora }. Kthen bajtet e PDF-së.
  function apPdf(l, o, pa) { // pa: pa kolonën e furnizuesit (merchandiseri)
    var d = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4', compress: true }), C = AP_NGJ, X = AP.MX, WI = AP.W - 2 * AP.MX;
    var kol = [{ k: 'nr', t: '#', w: 8 }, { k: 'emri', t: 'PRODUKTI', w: pa ? 104 : 70 }, { k: 'b', t: 'BARKODI', w: 34 }]
      .concat(pa ? [] : [{ k: 'f', t: 'FURNIZUESI', w: 34 }])
      .concat([{ k: 's', t: 'COPË', w: 18, al: 'right' }, { k: 'd', t: 'SKADON', w: 20.6 }]);
    function ng(c, lloji) { d['set' + (lloji || 'Text') + 'Color'](c[0], c[1], c[2]); }
    function font(pt, trashe) { d.setFont('helvetica', trashe ? 'bold' : 'normal'); d.setFontSize(pt); }
    function nxe(t, w) {
      t = String(t || '');
      if (d.getTextWidth(t) <= w) return t;
      while (t.length > 1 && d.getTextWidth(t + '…') > w) t = t.slice(0, -1);
      return t.replace(/\s+$/, '') + '…';
    }
    function kokaETabeles(yb) {
      var x = X;
      font(7, true); ng(C.muted);
      kol.forEach(function (c) { d.text(c.t, c.al === 'right' ? x + c.w - AP.SASIA_P : x + 1.6, yb, { align: c.al || 'left', charSpace: 0.2 }); x += c.w; });
      ng(C.ink, 'Draw'); d.setLineWidth(0.26); d.line(X, yb + 2, X + WI, yb + 2);
    }
    function rreshti(a, i, y) {
      if (i % 2 === 1) { ng(C.zebra, 'Fill'); d.rect(X, y + 0.15, WI, AP.RR - 0.15, 'F'); } // pa e mbuluar vijën e rreshtit sipër
      var yb = y + 4.85, x = X;
      kol.forEach(function (c) {
        var px = x + 1.6, w = c.w - 3.2;
        if (c.k === 'nr') { font(8.2, false); ng(C.faint); d.text(String(i + 1), px, yb); }
        else if (c.k === 'emri') { font(8.6, true); ng(C.ink); d.text(nxe(a.emri || a.barkodi || 'Pa emër', w), px, yb); }
        else if (c.k === 'b') { font(8.6, false); ng(C.ink2); d.text(nxe(a.barkodi, w), px, yb); }
        else if (c.k === 'f') { font(8.6, false); ng(C.ink); d.text(nxe(a.furnizuesi, w), px, yb); }
        else if (c.k === 's') { font(8.6, true); ng(C.ink); d.text(a.sasia === '' || a.sasia === null || a.sasia === undefined ? '' : String(a.sasia), x + c.w - AP.SASIA_P, yb, { align: 'right' }); }
        else { font(8.6, true); ng(C.ink); d.text(a.data ? AF.formato(a.data) : '–', px, yb); }
        x += c.w;
      });
      ng(C.line2, 'Draw'); d.setLineWidth(0.2); d.line(X, y + AP.RR, X + WI, y + AP.RR);
    }
    var plani = apPlani(l.length), idx = 0, logo = apLogo();
    plani.forEach(function (k, p) {
      if (p) d.addPage();
      var y;
      if (p === 0) {
        // v309: titulli dhe rreshti poshtë tij si një bllok, në mes të faqes majtas-djathtas; logoja dhe data në të njëjtën vijë mesi (AP.MESI)
        d.addImage(logo, 'PNG', X, AP.MESI - 2.1, 4.2 * apRaporti(), 4.2);
        font(8.6, false); ng(C.muted); d.text(o.data, X + WI, AP.MESI + 1.09, { align: 'right' });
        font(18, true); ng(C.ink); d.text('Lista e afateve', AP.W / 2, AP.MESI - 1.56, { align: 'center' });
        // "Periudha: Të gjitha · 11 produkte · 80 copë" në mes, vlerat të trasha
        var gj = 0;
        o.info.forEach(function (x) { font(9, x[1]); gj += d.getTextWidth(x[0]); });
        var xi = AP.W / 2 - gj / 2;
        o.info.forEach(function (x) { font(9, x[1]); ng(x[1] ? C.ink : C.muted); d.text(x[0], xi, AP.MESI + 5.72); xi += d.getTextWidth(x[0]); });
        kokaETabeles(34.6); y = AP.KOKA1;
      } else {
        kokaETabeles(12.7); y = AP.KOKA; // v299: logoja, titulli dhe të dhënat vetëm te faqja 1
      }
      for (var j = 0; j < k; j++, idx++) { rreshti(l[idx], idx, y); y += AP.RR; }
    });
    // v317 (pronari, foto: "hiqja krejt qeto mos le kurgjo ne fund te fletave"): asnjë tekst poshtë në asnjë faqe; edhe faqja 1
    // e çon tabelën deri te FUND 290 (34 rreshta). compress: true (pronari: "pse pdf e web appit ka ma shum kb"): pa të, jsPDF i
    // shkruante vizatimet e faqeve pa i ngjeshur, ndërsa PdfDocument i Android-it i ngjesh gjithmonë.
    return d.output('arraybuffer');
  }

  // v319 (pronari: "Shtuar ndrroja emrin se pa kuptim e qet ni kalendar mi selektu nto ditet ka njo ka njo se cilat dita ke skanu
  // me i zgjedh vet ti, me mujt ne kalendar me prek mi zgjedh"): rreshti "Ditët e skanimit" hap një kalendar; preken ditët (një nga
  // një, sa të duash) kur janë shtuar afatet (krijuarSe, ora e Kosovës). Asnjë ditë e zgjedhur = të gjitha. Android: EksportiPdf
  // (ditaEShtimit / filtro / tekstiDiteve) + KalendariIDiteve te EksportetUI.kt.
  var AP_MUAJT = ['Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor', 'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'];
  var AP_JAVA = ['H', 'M', 'M', 'E', 'P', 'S', 'D'];
  // Dita kur u shtua afati ('YYYY-MM-DD', ora e Kosovës); '' kur s'dihet (afatet shumë të vjetra pa krijuarSe)
  function apDitaEShtimit(a) {
    var AF = root.StokuAfatet, k = +(a && a.krijuarSe) || 0;
    return k > 0 && AF ? AF.isoNgaData(AF.dataKs(k)) : '';
  }
  // ditet: listë 'YYYY-MM-DD' (bosh = pa kufizim)
  function apDitaOk(a, ditet) {
    if (!ditet || !ditet.length) return true;
    var d = apDitaEShtimit(a);
    return !!d && ditet.indexOf(d) >= 0;
  }
  // { 'YYYY-MM-DD': sa afate u shtuan atë ditë }
  function apNumratEDiteve(l) {
    var m = {};
    (l || []).forEach(function (a) { var d = apDitaEShtimit(a); if (d) m[d] = (m[d] || 0) + 1; });
    return m;
  }
  // Vlera e rreshtit: "Të gjitha", "16.11.2026", "12.11, 14.11, 16.11" ose "5 ditë"
  function apTekstiDiteve(ditet) {
    var l = (ditet || []).slice().sort();
    if (!l.length) return 'Të gjitha';
    var f = function (x) { var p = x.split('-'); return p[2] + '.' + p[1]; };
    if (l.length === 1) { var p = l[0].split('-'); return p[2] + '.' + p[1] + '.' + p[0]; }
    return l.length <= 3 ? l.map(f).join(', ') : l.length + ' ditë';
  }
  // Kalendari (web telefon + PC): o = { viti, muaji (0-11), numrat, zgjedhur: [iso], sot: iso, ndrysho(zgjedhur), muaj(viti, muaji) }
  function apKalendari(el, o) {
    el.textContent = '';
    var mk = function (tag, kl, tx) { var x = document.createElement(tag); if (kl) x.className = kl; if (tx !== undefined) x.textContent = tx; return x; };
    var krye = mk('div', 'ap-kal-krye');
    var para = mk('button', 'ap-kal-nav', '‹'); para.type = 'button'; para.setAttribute('aria-label', 'Muaji i kaluar');
    var pas = mk('button', 'ap-kal-nav', '›'); pas.type = 'button'; pas.setAttribute('aria-label', 'Muaji tjetër');
    para.addEventListener('click', function () { var m = o.muaji - 1, v = o.viti; if (m < 0) { m = 11; v--; } o.muaj(v, m); });
    pas.addEventListener('click', function () { var m = o.muaji + 1, v = o.viti; if (m > 11) { m = 0; v++; } o.muaj(v, m); });
    krye.appendChild(para); krye.appendChild(mk('b', null, AP_MUAJT[o.muaji] + ' ' + o.viti)); krye.appendChild(pas);
    el.appendChild(krye);
    var g = mk('div', 'ap-kal-rrjeta');
    AP_JAVA.forEach(function (d) { g.appendChild(mk('span', 'ap-kal-emer', d)); });
    var e1 = new Date(Date.UTC(o.viti, o.muaji, 1)).getUTCDay(), bosh = (e1 + 6) % 7, nd = new Date(Date.UTC(o.viti, o.muaji + 1, 0)).getUTCDate();
    for (var i = 0; i < bosh; i++) g.appendChild(mk('span'));
    for (var d = 1; d <= nd; d++) {
      var iso = o.viti + '-' + ('0' + (o.muaji + 1)).slice(-2) + '-' + ('0' + d).slice(-2), n = o.numrat[iso] || 0, on = o.zgjedhur.indexOf(iso) >= 0;
      var b = mk('button', 'ap-kal-dite' + (n ? ' ka' : '') + (on ? ' on' : '') + (iso === o.sot ? ' sot' : '')); b.type = 'button';
      b.setAttribute('data-iso', iso); b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.setAttribute('aria-label', d + ' ' + AP_MUAJT[o.muaji] + (n ? ': ' + n + (n === 1 ? ' afat' : ' afate') : ''));
      b.appendChild(mk('span', null, String(d)));
      if (n) b.appendChild(mk('small', null, String(n)));
      b.disabled = !n && !on;
      (function (iso, on) {
        b.addEventListener('click', function () {
          var z = o.zgjedhur.filter(function (x) { return x !== iso; });
          if (!on) z.push(iso);
          o.ndrysho(z.sort());
        });
      })(iso, on);
      g.appendChild(b);
    }
    el.appendChild(g);
    var fund = mk('div', 'ap-kal-fund');
    fund.appendChild(mk('span', null, o.zgjedhur.length ? (o.zgjedhur.length === 1 ? '1 ditë e zgjedhur' : o.zgjedhur.length + ' ditë të zgjedhura') : 'Prek ditët që do t\'i nxjerrësh'));
    if (o.zgjedhur.length) {
      var pz = mk('button', 'ap-kal-pastro', 'Pastro'); pz.type = 'button';
      pz.addEventListener('click', function () { o.ndrysho([]); });
      fund.appendChild(pz);
    }
    el.appendChild(fund);
  }

  // v321: sa furnizues (të ndryshëm, me emër) ka lista, për kokën e PDF-së në vend të "Periudha" (= EksportiPdf.nrFurnizuesve)
  function apNrFurnizuesve(l) {
    var u = {}, n = 0;
    (l || []).forEach(function (a) { var f = String((a && a.furnizuesi) || '').trim().replace(/\s+/g, ' ').toLowerCase(); if (f && !u[f]) { u[f] = 1; n++; } });
    return n;
  }

  root.StokuEksportet = {
    FOTO_MAKS: AEF_MAKS, NGJ: AEF_NGJ,
    vizatoFoton: aefVizato, skedariFotos: aefSkedari, fontet: aefFontet, logo: aefLogo,
    planiPdf: apPlani, pdf: apPdf,
    ditaEShtimit: apDitaEShtimit, ditaOk: apDitaOk, numratEDiteve: apNumratEDiteve, tekstiDiteve: apTekstiDiteve, kalendari: apKalendari,
    nrFurnizuesve: apNrFurnizuesve
  };
})(typeof window !== 'undefined' ? window : this);
