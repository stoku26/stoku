// v240: "Sasia e shpejtë (+/-)" është leje te Cilësimet → Përdoruesit ("stokuPlusMinus", nën "Ndrysho produktet"), e lejuar
// për krejt llogaritë (edhe të rejat, pa dokument lejesh); kolona "+/-" te Grupi (PC) dhe "Butonat +/-" (tel) s'janë më
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
const RR = process.env.STOKU_DIR || require('path').resolve(__dirname, '..');
const L = require(RR + '/lejet.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const B = process.env.STOKU_B || 'http://127.0.0.1:8765';
const UA = 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
const prit = (fn, ms = 8000) => new Promise(async z => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return z(true); await new Promise(r => setTimeout(r, 100)); } z(false); });
const FARA = () => {
  if (localStorage.getItem('stoku:foldera:v1')) return;
  const t = Date.now();
  localStorage.setItem('stoku:foldera:v1', JSON.stringify([{ id: 'pije', emri: 'Pije' }]));
  localStorage.setItem('stoku:produktet:v2', JSON.stringify({
    'pije::3800123456789': { barkodi: '3800123456789', emri: 'Ujë Rugove 0.5L', sasia: 12, kategoriaId: 'pije', prekurSe: t },
    'pije::3800000000017': { barkodi: '3800000000017', emri: 'Lëng portokalli 1L', sasia: 4, kategoriaId: 'pije', prekurSe: t - 1 } }));
};
(async () => {
  // 0. lejet.js: leja e re, e lejuar si parazgjedhje, zinxhiri i prindërve
  ok(L.CELESAT.includes('stokuPlusMinus') && L.PRINDI.stokuPlusMinus === 'stokuNdrysho', '0. leja "stokuPlusMinus" nën "stokuNdrysho"');
  ok(L.lejohet(null, 'stokuPlusMinus') && L.lejohet({}, 'stokuPlusMinus'), '0. pa dokument / çelës që mungon: e lejuar (llogari e re, dokumente të vjetra)');
  const vjeter = L.krejt(true); delete vjeter.stokuPlusMinus;
  ok(L.lejohet(vjeter, 'stokuPlusMinus'), '0. dokument i ruajtur para v240 (pa çelësin): e lejuar');
  ok(!L.lejohet({ stokuNdrysho: false }, 'stokuPlusMinus') && !L.lejohet({ stoku: false }, 'stokuPlusMinus') && !L.lejohet({ stokuPlusMinus: false }, 'stokuPlusMinus'), '0. e ndaluar: vetë, pa "Ndrysho produktet" ose pa "Stoku" (krejt zinxhiri)');
  ok(!/\+\/-/.test(L.LEJA.stokuNdrysho.pershkrim) && /Sasia e shpejtë/.test(L.LEJA.stokuPlusMinus.emri), '0. "Ndrysho produktet" s\'i përmend më butonat +/-', L.LEJA.stokuPlusMinus);

  const b = await chromium.launch();
  // ================= 1. Grupi: pa kolonën "+/-" (PC) dhe pa "Butonat +/-" (tel) =================
  {
    const F = krijoFirestore({ rregullat: 'reja' });
    const t = Date.now();
    F.S.docs.set('perdoruesit/uA', { perdoruesi: 'mendurberisha', emri: 'mendurberisha', kycurSe: t, grupi: 'g1', grupetMigruarSe: t });
    F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: t, grupi: 'g1', grupetMigruarSe: t });
    F.S.docs.set('grupet/g1', { emri: 'Dyqani', pronarUid: 'uA', pronarEmri: 'mendurberisha', krijuarSe: t });
    F.S.docs.set('grupet/g1/anetaret/uA', { emri: 'mendurberisha', roli: 'pronar', hyriSe: t });
    F.S.docs.set('grupet/g1/anetaret/u1', { emri: 'agim', roli: 'anetar', hyriSe: t, sasiaShpejte: false });
    for (const pc of [true, false]) {
      const ctx = await b.newContext(pc ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' } : { userAgent: UA, viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
      await ctx.route(u => !u.href.startsWith(B), r => r.abort());
      await F.lidh(ctx, 'uA', 'mendurberisha@stoku-app.local', pc ? 'pc' : 'tel');
      const p = await ctx.newPage(); const gab = []; p.on('pageerror', e => gab.push(e.message));
      if (pc) {
        await p.goto(B + '/pc.html#/ekipa/anetaret'); await p.waitForTimeout(3000);
        await prit(() => p.evaluate(() => /agim/.test((document.getElementById('ekAnetaretTrup') || {}).textContent || '')));
        const d = await p.evaluate(() => ({ koka: [...document.querySelectorAll('#ekTabAnetaret thead th')].map(x => x.textContent),
          kolLeja: !!document.getElementById('ekKolLeja'), kuti: document.querySelectorAll('#ekAnetaretTrup input[type=checkbox]').length,
          agim: [...document.querySelectorAll('#ekAnetaretTrup tr')].find(x => /agim/.test(x.textContent)) ? [...[...document.querySelectorAll('#ekAnetaretTrup tr')].find(x => /agim/.test(x.textContent)).querySelectorAll('td')].length : 0,
          bej: !!document.querySelector('#ekAnetaretTrup button') && /Bëje admin/.test(document.getElementById('ekAnetaretTrup').textContent),
          plusminus: /\+\/-/.test(document.getElementById('ekTabAnetaret').textContent) }));
        ok(!d.kolLeja && !d.kuti && !d.plusminus && d.koka.length === 7 && d.agim === 7, '1. PC Grupi → Anëtarët: pa kolonën "+/-", pa kutitë (7 kolona)', d);
        ok(d.bej, '1. PC: "Bëje admin" / "Hiq nga grupi" mbeten');
        await p.screenshot({ path: __dirname + '/v240-pc-anetaret.png' });
      } else {
        await p.goto(B + '/index.html'); await p.waitForTimeout(2500);
        await p.click('#btnEkipi'); await p.waitForTimeout(1500);
        await p.evaluate(() => [...document.querySelectorAll('#dlgEkipi button, #dlgEkipi [role=tab], #dlgEkipi a')].find(x => x.textContent.trim() === 'Kolegët').click());
        await p.waitForTimeout(800);
        const tx = await p.evaluate(() => document.getElementById('dlgEkipi').innerText);
        ok(!/Butonat \+\/-/.test(tx) && /Menaxho kolegët/i.test(tx), '1. tel Grupi: pa "Butonat +/-", "Menaxho kolegët" mbetet', { butonat: /Butonat/.test(tx), menaxho: /Menaxho/i.test(tx), fund: tx.slice(-300) });
      }
      ok(!gab.length, '1. ' + (pc ? 'PC' : 'tel') + ': pa gabime JS', gab);
      await ctx.close();
    }
  }

  // ================= 2. Leja te Cilësimet → Përdoruesit, në kohë reale =================
  const F = krijoFirestore();
  const t0 = Date.now();
  F.S.docs.set('perdoruesit/uA', { perdoruesi: 'mendurberisha', kycurSe: t0 });
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: t0 - 3600e3 });
  F.S.docs.set('perdoruesit/u2', { perdoruesi: 'besa', kycurSe: t0 - 60e3, krijuarSe: t0 - 120e3 });
  // agim: i kontrolluar para v240 (dokumenti s'e ka çelësin e ri) → e lejuar; besa: llogari e re (pa dokument)
  const lejetVjeter = L.krejt(true); delete lejetVjeter.stokuPlusMinus;
  F.S.docs.set('lejet/u1', { lejet: lejetVjeter, kontrolluarSe: t0 - 864e5, kontrolluarNga: 'mendurberisha', emri: 'agim' });
  async function faqe(uid, emri, pc) {
    const ctx = await b.newContext(pc ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' } : { userAgent: UA, viewport: { width: 390, height: 844 }, serviceWorkers: 'block', hasTouch: true });
    await ctx.route(u => !u.href.startsWith(B), r => r.abort());
    await F.lidh(ctx, uid, emri + '@stoku-app.local', pc ? 'pc' : 'tel', { afatet: [] });
    await ctx.addInitScript(FARA);
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto(B + (pc ? '/pc.html#/te-gjitha' : '/index.html')); await p.waitForTimeout(2500);
    return p;
  }
  const hapPije = async p => { await p.evaluate(() => [...document.querySelectorAll('.folder-karta')].find(x => /Pije/.test(x.textContent)).click()); await p.waitForTimeout(500); };
  const nrHap = p => p.evaluate(() => document.querySelectorAll('#lista .sasia-hap').length);
  const nrPc = p => p.evaluate(() => document.querySelectorAll('.sasia-shpejt').length);

  const agim = await faqe('u1', 'agim', false);
  await hapPije(agim);
  ok(await nrHap(agim) === 2, '2. agim (tel, i kontrolluar para v240): butonat +/- te krejt produktet', await nrHap(agim));
  await agim.evaluate(() => [...document.querySelectorAll('#lista .artikull')].find(x => /Lëng/.test(x.textContent)).querySelectorAll('.sasia-hap-btn')[1].click());
  await agim.waitForTimeout(400);
  const s1 = await agim.evaluate(() => JSON.parse(localStorage.getItem('stoku:produktet:v2'))['pije::3800000000017'].sasia);
  ok(s1 === 5, '2. agim: "+" e rrit sasinë 4 → 5', s1);
  ok(await agim.evaluate(() => localStorage.getItem('stoku:leja:sasia-shpejte')) === null, '2. çelësi i vjetër "stoku:leja:sasia-shpejte" fshihet');
  const besaPc = await faqe('u2', 'besa', true);
  ok(await prit(async () => (await nrPc(besaPc)) === 2), '2. besa (PC, llogari e re pa leje të ruajtura): +/- te tabela', await nrPc(besaPc));

  // Administratori (tel): Cilësimet → Përdoruesit → agim → "Sasia e shpejtë (+/-)"
  const m = await faqe('uA', 'mendurberisha', false);
  await m.click('#btnOpsione'); await m.waitForTimeout(300);
  await m.click('#tabPerdoruesit'); await m.waitForTimeout(500);
  await m.evaluate(() => [...document.querySelectorAll('#pdLista .ops-furn-rresht')].find(x => /agim/.test(x.textContent)).click());
  await m.waitForTimeout(500);
  const rr = await m.evaluate(() => { const i = document.getElementById('pdLeja_stokuPlusMinus'); if (!i) return null; const s = i.closest('.seksion');
    return { checked: i.checked, disabled: i.disabled, emri: s.querySelector('.ops-rresht__tekst span').textContent, femije: s.classList.contains('pd-femije'),
      pasNdrysho: s.previousElementSibling && !!s.previousElementSibling.querySelector('#pdLeja_stokuNdrysho') }; });
  ok(rr && rr.checked && !rr.disabled && rr.emri === 'Sasia e shpejtë (+/-)' && rr.femije && rr.pasNdrysho, '2. admini: "Sasia e shpejtë (+/-)" te lejet e agimit, e ndezur, pas "Ndrysho produktet"', rr);
  await m.screenshot({ path: __dirname + '/v240-tel-leja.png' });
  await m.click('label[for=pdLeja_stokuPlusMinus]'); await m.waitForTimeout(500);
  const dA = F.S.docs.get('lejet/u1');
  ok(dA && dA.lejet.stokuPlusMinus === false && dA.lejet.stokuNdrysho === true, '2. lejet/u1: stokuPlusMinus = false', dA && dA.lejet);
  ok(await prit(async () => (await nrHap(agim)) === 0), '2. agim: butonat +/- zhduken në kohë reale');
  const nrProd = await agim.evaluate(() => document.querySelectorAll('#lista .artikull').length);
  ok(nrProd === 2, '2. agim: produktet mbeten në listë (vetëm pa +/-)', nrProd);
  await m.click('label[for=pdLeja_stokuPlusMinus]'); await m.waitForTimeout(500);
  ok(F.S.docs.get('lejet/u1').lejet.stokuPlusMinus === true && await prit(async () => (await nrHap(agim)) === 2), '2. leja kthehet → butonat dalin prapë');
  // Pa "Ndrysho produktet": çelësi +/- çaktivizohet (si veprimet e tjera pa pjesën) dhe butonat s'dalin
  await m.click('label[for=pdLeja_stokuNdrysho]'); await m.waitForTimeout(500);
  ok(await m.evaluate(() => { const i = document.getElementById('pdLeja_stokuPlusMinus'); return i.disabled && i.closest('.seksion').classList.contains('pd-joaktiv'); }), '2. pa "Ndrysho produktet": "+/-" çaktivizohet te admini');
  ok(await prit(async () => (await nrHap(agim)) === 0), '2. pa "Ndrysho produktet": agim pa butonat +/-');
  await m.click('label[for=pdLeja_stokuNdrysho]'); await m.waitForTimeout(500);
  // besa në PC: e ndalon admini → zhduken te tabela
  const rB = await m.evaluate(l => window.__stokuCloud.lejet.ruaj('u2', l, { nga: 'mendurberisha', emri: 'besa' }), Object.assign(L.krejt(true), { stokuPlusMinus: false }));
  ok(rB && rB.ok && F.S.docs.get('lejet/u2').lejet.stokuPlusMinus === false, '2. admini e ndalon "+/-" për besën', rB);
  ok(await prit(async () => (await nrPc(besaPc)) === 0), '2. besa (PC): pa +/- pasi e ndalon admini');
  ok(await prit(async () => (await nrHap(agim)) === 2), '2. agim: +/- prapë pasi "Ndrysho produktet" u kthye');
  for (const [p, e] of [[agim, 'agim'], [besaPc, 'besa'], [m, 'admini']]) ok(!p.__gab.length, '2. ' + e + ': pa gabime JS', p.__gab);
  await b.close();
  console.log(g ? 'GABIME: ' + g : 'Krejt në rregull');
  process.exit(g ? 1 : 0);
})();
