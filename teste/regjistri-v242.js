// v242: regjistri i përbashkët i Stoku-t: krejt llogaritë (edhe pa grup) i shohin produktet dhe furnizuesit e kontrolluar
// nga administratori (kujtesa/*), emri del kur skanojnë; çdo produkt i ri i kujtdo shkon te pritja (kujtesa_pritje/{uid}) dhe
// del për kontroll te administratori; vetëm çka ruan ai kalon te regjistri. Siguria: askush tjetër s'shkruan te regjistri,
// një "s" i falsifikuar te pritja s'e kalon kontrollin.
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const BAZA = process.env.STOKU_B || 'http://127.0.0.1:8765';
const prit = (fn, ms = 10000) => new Promise(async z => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return z(true); await new Promise(r => setTimeout(r, 150)); } z(false); });
(async () => {
  const F = krijoFirestore({ rregullat: 'reja' });
  const t = Date.now();
  F.S.docs.set('perdoruesit/uA', { perdoruesi: 'mendurberisha', emri: 'mendurberisha', kycurSe: t, grupi: '' });
  F.S.docs.set('perdoruesit/u2', { perdoruesi: 'testmorina', kycurSe: t, grupi: '' });
  F.S.docs.set('perdoruesit/u3', { perdoruesi: 'agim', kycurSe: t, grupi: '' });
  // Kujtesa e administratorit (e kontrolluar më parë, p.sh. te grupi i tij)
  const KUJ_ADMIN = {
    '3800001': { e: 'Kos Vita 1kg', f: 'Vita', k: t - 5000, m: 1, s: 1, n: 'mendurberisha' },
    'furnizuesi Vita': { e: 'Vita', f: '', k: t - 5000, s: 1 },
    'furnizuesi Rugove': { e: 'Rugove', f: '', k: t - 5000, s: 1 }
  };
  const b = await chromium.launch();
  async function faqe(uid, emri, pc, kuj) {
    const ctx = await b.newContext(pc ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' }
      : { userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith(BAZA), r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: '{"ok":true}' }));
    await F.lidh(ctx, uid, emri + '@stoku-app.local', pc ? 'pc' : 'tel');
    await ctx.addInitScript(k => {
      try { localStorage.setItem('stoku:njoftimet:pyetur', '1'); } catch (e) {}
      if (k && !sessionStorage.getItem('__kuj')) { sessionStorage.setItem('__kuj', '1'); localStorage.setItem('stoku:kujtesa:v1', JSON.stringify(k)); localStorage.setItem('stoku:kujtesa:kontrolli-v238', '1'); }
    }, kuj || null);
    const p = await ctx.newPage(); p.__gab = [];
    p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto(BAZA + '/' + (pc ? 'pc.html#/afatet' : 'index.html'));
    await p.waitForTimeout(2500);
    await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => { if (!d.classList.contains('faqe-e-plote')) d.classList.remove('hapur'); }));
    return p;
  }
  const doc = k => F.S.docs.get(k);
  const regjistri = () => { const h = {}; [...F.S.docs.keys()].filter(k => /^kujtesa\/p[0-9x]$/.test(k)).forEach(k => Object.assign(h, (doc(k) || {}).p || {})); return h; };
  const kuj = p => p.evaluate(() => JSON.parse(localStorage.getItem('stoku:kujtesa:v1') || '{}'));

  // 1. Administratori (PC): të kontrolluarat e tij shkojnë te regjistri
  const adm = await faqe('uA', 'mendurberisha', true, KUJ_ADMIN);
  ok(await prit(() => { const R = regjistri(); return R['3800001'] && R['furnizuesi Vita']; }), '1. regjistri: produktet dhe furnizuesit e administratorit', Object.keys(regjistri()));
  const R1 = regjistri();
  ok(R1['3800001'].e === 'Kos Vita 1kg' && R1['3800001'].f === 'Vita' && R1['3800001'].s === 1 && doc('kujtesa/p1'), '1. me krejt fushat, i ndarë sipas shifrës së fundit (p1)', R1['3800001']);
  ok(!doc('kujtesa_pritje/uA'), '1. administratori s\'ka pritje');

  // 2. testmorina (PC, llogari e re, pa grup): i sheh produktet dhe furnizuesit; emri del kur skanon
  const tm = await faqe('u2', 'testmorina', true);
  ok(await prit(async () => (await kuj(tm))['3800001']), '2. testmorina e merr regjistrin (pa grup)');
  await tm.click('#btnOpsione'); await tm.waitForTimeout(400); await tm.click('#dlgOpsione [data-faqe="stoku"]'); await tm.waitForTimeout(400);
  await tm.click('#opsFurnSeksion .ops-palos'); await tm.click('#opsKujSeksion .ops-palos'); await tm.waitForTimeout(300);
  ok(/Kos Vita 1kg/.test(await tm.textContent('#opsKujLista')), '2. Cilësimet → Stoku → Produktet: "Kos Vita 1kg"', (await tm.textContent('#opsKujLista')).slice(0, 120));
  ok(/Vita/.test(await tm.textContent('#opsFurnLista')) && /Rugove/.test(await tm.textContent('#opsFurnLista')), '2. Furnizuesit: Vita, Rugove', (await tm.textContent('#opsFurnLista')).slice(0, 120));
  ok(/Regjistri i Stoku-t/.test(await tm.textContent('#opsKujHint')), '2. teksti: "Regjistri i Stoku-t…"');
  await tm.screenshot({ path: __dirname + '/v242-regjistri-pc.png' });
  await tm.keyboard.press('Escape'); await tm.waitForTimeout(300);
  await tm.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => d.classList.remove('hapur')));
  const v2 = await tm.evaluate(() => { const b = document.getElementById('afdBarkodi'); b.value = '3800001'; document.getElementById('afdEmri').value = ''; document.getElementById('afdFurnizuesi').value = ''; b.dispatchEvent(new Event('change')); return [document.getElementById('afdEmri').value, document.getElementById('afdFurnizuesi').value]; });
  ok(v2[0] === 'Kos Vita 1kg' && v2[1] === 'Vita', '2. skanimi: emri dhe furnizuesi plotësohen nga regjistri', v2);

  // 3. testmorina shton një produkt të ri → pritja e saj → administratori e sheh "nga testmorina" te Produktet e reja
  await tm.click('#afBtnShto'); await tm.waitForTimeout(300);
  await tm.fill('#afdBarkodi', '3800099'); await tm.fill('#afdEmri', 'Ujë Rugove 0.5L'); await tm.fill('#afdFurnizuesi', 'Rugove'); await tm.fill('#afdData', '30-12-27');
  await tm.click('#afdRuaj'); await tm.waitForTimeout(300);
  ok(await prit(() => { const d = doc('kujtesa_pritje/u2'); return d && d.p && d.p['3800099']; }), '3. pritja e testmorinës: 3800099', doc('kujtesa_pritje/u2') && Object.keys(doc('kujtesa_pritje/u2').p));
  const pr = doc('kujtesa_pritje/u2');
  ok(pr.emri === 'testmorina' && pr.p['3800099'].e === 'Ujë Rugove 0.5L' && !pr.p['3800001'], '3. vetëm çka s\'është te regjistri (jo Kos Vita)', Object.keys(pr.p));
  ok(!regjistri()['3800099'], '3. s\'kalon te regjistri pa kontroll');
  ok(await prit(async () => { const k = (await kuj(adm))['3800099']; return k && k.n === 'testmorina' && !k.s; }), '3. administratori e merr si "në pritje" nga testmorina', (await kuj(adm))['3800099']);
  await adm.click('#btnOpsione'); await adm.waitForTimeout(400); await adm.click('#dlgOpsione [data-faqe="stoku"]'); await adm.waitForTimeout(400);
  await adm.click('#opsFurnSeksion .ops-palos'); await adm.click('#opsKujSeksion .ops-palos'); await adm.waitForTimeout(300);
  const lb = (await adm.textContent('#opsKujPritjeLista')).replace(/\s+/g, ' ');
  ok(await adm.isVisible('#opsKujPritjeSeksion') && /Ujë Rugove 0.5L.*nga testmorina/.test(lb), '3. admini: te "Produktet e reja", nga testmorina', lb.slice(0, 160));
  await adm.screenshot({ path: __dirname + '/v242-regjistri-admin.png' });
  // 4. Administratori e ruan → regjistri → krejt llogaritë
  await adm.click('#opsKujPritjeSeksion .ops-palos').catch(() => {}); await adm.waitForTimeout(150);
  await adm.click('#opsKujPritjeLista .ops-furn-rresht:has-text("Ujë Rugove") button:has-text("Ndrysho")'); await adm.waitForTimeout(200);
  await adm.locator('#opsKujPritjeLista .ops-furn-edit input').nth(0).fill('Ujë Rugove 0.5 L');
  await adm.click('#opsKujPritjeLista .ops-furn-edit button:has-text("Ruaj")');
  ok(await prit(() => { const R = regjistri(); return R['3800099'] && R['3800099'].s === 1; }), '4. pas kontrollit: te regjistri', regjistri()['3800099']);
  ok(regjistri()['3800099'].e === 'Ujë Rugove 0.5 L', '4. me emrin e korrigjuar');
  ok(await prit(async () => { const k = (await kuj(tm))['3800099']; return k && k.e === 'Ujë Rugove 0.5 L' && k.s === 1; }), '4. testmorina e merr versionin e administratorit');
  ok(await prit(() => { const d = doc('kujtesa_pritje/u2'); return d && d.p && !d.p['3800099']; }), '4. del vetë nga pritja e testmorinës', doc('kujtesa_pritje/u2') && Object.keys(doc('kujtesa_pritje/u2').p));

  // 5. agim (tel, i ri) e merr direkt
  const ag = await faqe('u3', 'agim', false);
  ok(await prit(async () => { const k = await kuj(ag); return k['3800099'] && k['3800099'].e === 'Ujë Rugove 0.5 L' && k['3800001']; }), '5. agim (telefon, pa grup): krejt regjistri');

  // 6. Siguria
  const nRef = F.S.refuzime.length;
  const rS = await tm.evaluate(() => window.__stokuCloud.ekipa.ruajRegjistrin({ '3800001': { e: 'Vandal', f: '', k: Date.now() + 9e9, a: 0, m: 1, s: 1, n: 'x', x: 0, r: 0 } }));
  ok(!rS.ok && regjistri()['3800001'].e === 'Kos Vita 1kg' && F.S.refuzime.length > nRef, '6. testmorina s\'shkruan te regjistri', rS);
  const rP = await tm.evaluate(() => window.__stokuCloud.ekipa.ruajPritjen({ '4000004': { e: 'Produkt i falsifikuar', f: '', k: Date.now(), a: 0, m: 1, s: 1, n: '', x: 0, r: 0 } }));
  ok(rP.ok, '6. pritja e vet lejohet');
  ok(await prit(async () => { const k = (await kuj(adm))['4000004']; return k && !k.s && k.n === 'testmorina'; }), '6. "s" i falsifikuar te pritja: te administratori pret kontrollin', (await kuj(adm))['4000004']);
  ok(!regjistri()['4000004'], '6. s\'kalon te regjistri');
  const rL = await tm.evaluate(async () => { try { const s = await window.__stokuCloud.ekipa.degjoPritjet; return typeof s; } catch (e) { return 'gabim'; } });
  const lexon = await tm.evaluate(() => new Promise(z => { const nd = window.__stokuCloud.ekipa.degjoPritjet(l => { z('lexoi ' + l.length); }, () => z('s\'lejohet')); setTimeout(() => z('pa përgjigje'), 3000); }));
  ok(/s'lejohet/.test(lexon), '6. testmorina s\'i lexon pritjet e të tjerëve', [rL, lexon]);

  ok(![adm, tm, ag].some(p => p.__gab.length), '7. pa gabime JS', [adm, tm, ag].map(p => p.__gab));
  await b.close();
  console.log(g ? 'GABIME: ' + g : 'Krejt në rregull');
  process.exit(g ? 1 : 0);
})();
