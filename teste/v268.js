// v268: brenda folderit butoni lundrues i ndarë (ideja 5 e përdoruesit nga Claude Design): poshtë djathtas, gjysma blu "Skano me kamerë",
// gjysma e verdhë "Skanim i shpejtë", vetëm ikona; "Eksporto Excel" / "Eksporto PDF" si ikona pranë titullit (pllakat e v265/v267 u hoqën).
// Edhe: madhësitë e telefonit si në aplikacionin Android (shkronjat, butonat, fushat, shiriti poshtë, hapësirat). E çelët dhe e errët.
const { chromium } = require('./pw.js');
const { hapFaqen } = require('./kamera-e-rreme.js');
const L = require('../lejet.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const rr = (p, sel) => p.evaluate(sel => {
  const e = document.querySelector(sel); if (!e) return null;
  const r = e.getBoundingClientRect(), s = getComputedStyle(e);
  return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), r: Math.round(r.right), b: Math.round(r.bottom),
    fs: s.fontSize, fw: s.fontWeight, lh: s.lineHeight, bg: s.backgroundColor, c: s.color, d: s.display, duket: r.width > 0 && r.height > 0 };
}, sel);
const fab = p => p.evaluate(() => {
  const f = document.getElementById('skanFab'), r = f.getBoundingClientRect();
  return { duket: getComputedStyle(f).display !== 'none' && r.width > 0, dy: f.classList.contains('dy'), meFab: document.documentElement.classList.contains('me-fab'),
    x: Math.round(r.left), r: Math.round(r.right), b: Math.round(r.bottom), h: Math.round(r.height), w: Math.round(r.width),
    butonat: Array.from(f.querySelectorAll('button')).filter(x => x.offsetParent).map(x => ({ id: x.id, a: x.getAttribute('aria-label'), t: x.textContent.trim(),
      w: Math.round(x.getBoundingClientRect().width), bg: getComputedStyle(x).backgroundColor, svg: x.querySelector('svg') ? Math.round(x.querySelector('svg').getBoundingClientRect().width) : 0 })) };
});

(async () => {
  for (const tema of ['light', 'dark']) {
    const { b, p } = await hapFaqen(chromium);
    await p.evaluate(t => localStorage.setItem('stoku:tema', t), tema);
    await p.reload(); await p.waitForTimeout(2000);
    await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => { if (!d.classList.contains('faqe-e-plote')) d.classList.remove('hapur'); }));

    // Jashtë folderit s'ka buton lundrues
    let f = await fab(p);
    ok(!f.duket && !f.meFab, tema + ' 1. faqja Stoku: pa butonin lundrues', f);

    await p.click('.folder-karta >> text=Pije'); await p.waitForTimeout(600);
    f = await fab(p);
    const theksi = await p.evaluate(() => { const d = document.createElement('div'); d.style.color = getComputedStyle(document.documentElement).getPropertyValue('--sb-accent'); document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; });
    ok(f.duket && f.dy && f.meFab && f.butonat.length === 2, tema + ' 2. folderi: butoni lundrues me dy gjysma', f);
    ok(f.r === 370 && f.b === 844 - 72 && f.h === 68 && f.butonat.every(x => x.w === 76) && f.w >= 152 && f.w <= 154, tema + ' 2. poshtë djathtas (20 nga ana, 72 nga fundi), 68 i lartë, gjysmat 76', f);
    ok(f.butonat[0].id === 'btnKamera' && f.butonat[0].a === 'Skano me kamerë' && f.butonat[1].id === 'btnSkanimShpejt' && f.butonat[1].a === 'Skanim i shpejtë' &&
      f.butonat.every(x => x.t === '' && x.svg === 30), tema + ' 2. vetëm ikona (30 px), emrat te aria-label', f.butonat);
    ok(f.butonat[0].bg === theksi && f.butonat[1].bg === 'rgb(232, 169, 46)', tema + ' 2. majtas blu (theksi), djathtas e verdhë (#E8A92E si te Android-i)', [f.butonat[0].bg, theksi, f.butonat[1].bg]);
    const lista = await p.evaluate(() => getComputedStyle(document.getElementById('lista')).paddingBottom);
    ok(lista === '100px', tema + ' 2. lista lë vend poshtë që butoni të mos mbulojë produktin e fundit', lista);
    ok(!(await p.$('#folderPllakat')) && !(await p.$('.sb-pllaka')), tema + ' 2. pllakat e v265/v267 s\'janë më');

    // Excel / PDF lart djathtas
    const ex = await rr(p, '#btnEksport'), pdf = await rr(p, '#btnEksportPdf'), tit = await rr(p, '#titulli'), mb = await rr(p, '#btnMbrapa');
    const ngj = tema === 'dark' ? ['rgb(76, 199, 131)', 'rgb(255, 122, 122)'] : ['rgb(30, 127, 69)', 'rgb(194, 48, 48)'];
    ok(ex.duket && pdf.duket && ex.w === 42 && ex.h === 42 && pdf.w === 42 && mb.w === 42 && pdf.r === 370 && pdf.x - ex.r === 8 && tit.r <= ex.x,
      tema + ' 3. "Eksporto Excel" dhe "Eksporto PDF" si ikona 42 pranë titullit (si te Android-i)', { ex, pdf, tit, mb });
    ok(ex.c === ngj[0] && pdf.c === ngj[1], tema + ' 3. Excel i gjelbër, PDF i kuq', [ex.c, pdf.c]);
    ok(await p.evaluate(() => document.getElementById('btnEksport').getAttribute('aria-label') === 'Eksporto Excel' && document.getElementById('btnEksportPdf').getAttribute('aria-label') === 'Eksporto PDF'),
      tema + ' 3. emrat te aria-label');

    // Klikimet
    await p.click('#btnKamera'); await p.waitForTimeout(500);
    ok(await p.evaluate(() => document.getElementById('kamera').classList.contains('hapur') && !document.getElementById('kamera').classList.contains('shpejt')), tema + ' 4. gjysma blu hap kamerën');
    await p.click('#mbyllKamere'); await p.waitForTimeout(400);
    await p.click('#btnSkanimShpejt'); await p.waitForTimeout(500);
    ok(await p.evaluate(() => document.getElementById('kamera').classList.contains('shpejt')), tema + ' 4. gjysma e verdhë hap Skanimin e shpejtë');
    await p.click('#ssMbaro'); await p.waitForTimeout(400);
    await p.click('#btnEksport'); await p.waitForTimeout(400);
    const toast = await p.evaluate(() => (document.getElementById('toast') || {}).textContent || '');
    ok(/Nuk ka produkte/.test(toast), tema + ' 4. Excel thërret eksportin (folder bosh: njoftimi)', toast);

    if (tema === 'light') {
      // PDA: pa butonin lundrues; "Fshih tastierën" del poshtë barkodit, e gjerë
      await p.evaluate(() => { const c = document.getElementById('opsPda'); c.checked = true; c.dispatchEvent(new Event('change')); });
      await p.waitForTimeout(300);
      f = await fab(p);
      const tas = await rr(p, '#btnTastiera');
      ok(!f.duket && !f.meFab && tas.duket && tas.w === 350, '5. PDA: pa butonin lundrues, "Fshih tastierën" në krejt gjerësinë', { f, tas });
      await p.evaluate(() => { const c = document.getElementById('opsPda'); c.checked = false; c.dispatchEvent(new Event('change')); });
      await p.waitForTimeout(300);
      f = await fab(p);
      ok(f.duket && f.dy, '5. pa PDA: butoni lundrues kthehet', f);
    }

    // Jashtë folderit (Afatet): butoni zhduket
    await p.click('#btnMbrapa'); await p.waitForTimeout(400);
    f = await fab(p);
    ok(!f.duket && !f.meFab, tema + ' 6. mbrapa te Stoku: butoni zhduket', f);
    await b.close();
  }

  // Lejet: pa "Skanim i shpejtë" vetëm rrethi blu; pa "Skano me kamerë" asnjë buton lundrues
  for (const [lejet, pritet, m] of [[{ skanimShpejt: false }, 'blu', 'pa "Skanim i shpejtë"'], [{ kamera: false }, 'asnje', 'pa "Skano me kamerë"'], [{}, 'dy', 'krejt të lejuara']]) {
    const x = await hapFaqen(chromium, { uid: 'uB', emri: 'besa', lejet: Object.assign(L.krejt(true), lejet) });
    await x.p.click('.folder-karta >> text=Pije'); await x.p.waitForTimeout(600);
    const f = await fab(x.p);
    const sa = !f.duket ? 'asnje' : f.dy ? 'dy' : 'blu';
    ok(sa === pritet && (pritet !== 'blu' || (f.w === 68 && f.h === 68 && f.butonat.length === 1 && f.butonat[0].id === 'btnKamera')), '7. llogaria ' + m + ': ' + pritet, f);
    await x.b.close();
  }

  // Madhësitë si te Android-i (vendas): ekrani 390 px, 2 pika për px
  const { b, p } = await hapFaqen(chromium, { dpr: 2 });
  const lh = await p.evaluate(() => { const d = document.createElement('div'); d.style.fontSize = '12px'; d.textContent = 'Ag'; document.body.appendChild(d); const v = getComputedStyle(d).lineHeight; d.remove(); return v; });
  ok(lh === '15.3px', '8. rreshti i tekstit sa shkronja (1.275 si te Android-i, jo i rrumbullakuar lart)', lh);
  const tab = await rr(p, '#tabet'), tsvg = await rr(p, '#tabStoku svg'), tt = await rr(p, '#tabStoku .tab-tekst');
  ok(tab.h === 65 && tsvg.w === 26 && tt.fs === '11px' && tt.y - tsvg.b === 4, '8. shiriti poshtë: 64 + vija, ikona 26, teksti 11 (4 nën ikonë)', { tab, tsvg, tt });
  const imp = await rr(p, '#btnImportGaleria'), kk = await rr(p, '#kerkoGlobal');
  const kuti = await p.evaluate(() => { const k = document.getElementById('kerkoGlobal').closest('.kerko-kuti').getBoundingClientRect(); const s = document.querySelector('.sb-summary').getBoundingClientRect(); return { h: Math.round(k.height), top: Math.round(k.top), poshte: Math.round(k.bottom), kartela: Math.round(s.top) }; });
  ok(imp.w === 46 && kuti.h === 50 && kuti.top >= 94 && kuti.top <= 95 && kuti.kartela - kuti.poshte === 18, '8. Stoku: butonat lart 46, kërkimi 50 (12 + logoja + 14 nga lart), 18 deri te kartela', { imp, kuti });
  await p.click('.folder-karta >> text=Pije'); await p.waitForTimeout(600);
  const fush = await p.evaluate(() => Array.from(document.querySelectorAll('#siperFolderi .kerko-kuti')).map(e => { const r = e.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.height)]; }));
  const ft = await rr(p, '#btnFshiTeGjitha'), foot = await rr(p, '#footerFolderi');
  ok(fush.length === 2 && fush[0][0] === 68 && fush[0][1] === 50 && fush[1][0] === 128 && fush[1][1] === 50, '9. folderi: barkodi dhe kërko 50, 10 ndërmjet (si te Android-i)', fush);
  ok(ft.fs === '15px' && ft.fw === '600' && ft.h === 52 && foot.h === 53, '9. "Fshi të gjitha produktet" 15 px, rreshti poshtë vija + 52', { ft, foot });
  await p.evaluate(() => {
    const t = Date.now();
    const pm = JSON.parse(localStorage.getItem('stoku:produktet:v2') || '{}');
    pm['pije::3890000000001'] = { kategoriaId: 'pije', barkodi: '3890000000001', emri: 'Ujë', sasia: 3, prekurSe: t };
    localStorage.setItem('stoku:produktet:v2', JSON.stringify(pm));
  });
  await p.reload(); await p.waitForTimeout(2000);
  await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => { if (!d.classList.contains('faqe-e-plote')) d.classList.remove('hapur'); }));
  await p.click('.folder-karta >> text=Pije'); await p.waitForTimeout(600);
  const art = await rr(p, '#lista .artikull'), hap = await rr(p, '#lista .sasia-hap-btn'), sas = await rr(p, '#lista .sasia-input');
  ok(art && art.h === 75 && hap.w === 30 && sas.w === 68 && sas.h === 50, '9. rreshti i produktit 12 + 50 + 12 + vija, − / + 30, sasia 68 × 50', { art, hap, sas });
  await p.click('#lista .artikull'); await p.waitForTimeout(600);
  const mn = await rr(p, '#dlgSasiaMinus'), sf = await rr(p, '#dlgSasia');
  ok(mn.w === 44 && mn.h === 50 && sf.fs === '18px', '10. produkti: − / + 44 × 50, sasia 18 px', { mn, sf });
  await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => d.classList.remove('hapur')));
  await p.click('#btnMbrapa'); await p.waitForTimeout(400);
  await p.click('#btnAfatet'); await p.waitForTimeout(800);
  const at = await rr(p, '#afTitulli'), fo = await rr(p, '#afFotografo'), sh = await rr(p, '#afShto'), sy = await rr(p, '#afSinkStatus');
  ok(at.fs === '26px' && sy.w === 44 && fo.y === 72 && sh.h === 65 && sh.fs === '16px', '11. Afatet: titulli 26, cloud 44, kartat 72 nga lart, "Shto" 65 i lartë me 16 px', { at, fo, sh, sy });
  await p.click('#afShto'); await p.waitForTimeout(700);
  const aT = await rr(p, '#afatTitulli'), st = await rr(p, '#dlgAfat .sb-stepper'), da = await rr(p, '#afatData'), dl = await rr(p, '#dlgAfat .dialog'), ru = await rr(p, '#afatRuaj');
  ok(aT.fs === '26px' && st.h === 70 && da.h === 50 && ru.h === 56, '12. Afat i ri: titulli 26, sasia 70, data 50, "Ruaj afatin" 56', { aT, st, da, ru });
  ok(ru.y - dl.y >= 458 && ru.y - dl.y <= 462, '12. hapësirat si Flete te Android-i (14 ndërmjet çdo pjese)', ru.y - dl.y);
  await p.evaluate(() => document.querySelectorAll('#dlgAfat.hapur').forEach(d => d.classList.remove('hapur')));
  await p.click('#btnOpsione'); await p.waitForTimeout(800);
  const ct = await rr(p, '#opsioneTitulli');
  ok(ct.fs === '26px', '13. Cilësimet: titulli 26 px', ct);

  const sw = await p.evaluate(() => fetch('sw.js').then(x => x.text()));
  const nr = rx => Number((sw.match(rx) || [])[1]);
  ok(nr(/stoku-v(\d+)/) >= 268 && nr(/app-tel\.js\?v=(\d+)/) >= 268 && nr(/teRejat\.js\?v=(\d+)/) >= 268 && nr(/stoku\.css\?v=(\d+)/) >= 54, '14. CACHE, app-tel.js, teRejat.js ≥ 268, stoku.css ≥ 54');
  const tr = await p.evaluate(() => fetch('teRejat.js?v=' + Date.now()).then(x => x.text()));
  ok(/\{ v: 268,[^\n]*platforma: 'tel'/.test(tr), '14. teRejat v268 (telefon)');
  ok(!p.__gab.length, '15. pa gabime JS', p.__gab);
  await b.close();
  console.log(g ? 'GABIME: ' + g : 'Krejt në rregull');
  process.exit(g ? 1 : 0);
})();
