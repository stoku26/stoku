// v207: furnizuesit e ruajtur më vete: s'fshihen me produktet; "Fshije" furnizuesin s'i fshin produktet; vlen në PC + telefon
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
(async () => {
  const F = krijoFirestore({ rregullat: 'reja' });
  const t = Date.now();
  const hy = (e, f) => ({ e, f, k: t - 60000, a: 0, m: 1, s: 1, n: 'mendurberisha', x: 0 });
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: t, grupi: 'g1' });
  F.S.docs.set('perdoruesit/u2', { perdoruesi: 'mendurberisha', kycurSe: t, grupi: 'g1' });
  F.S.docs.set('grupet/g1', { emri: 'Market', pronarUid: 'u1', pronarEmri: 'agim' });
  F.S.docs.set('grupet/g1/anetaret/u1', { emri: 'agim', roli: 'pronar', hyriSe: t });
  F.S.docs.set('grupet/g1/anetaret/u2', { emri: 'mendurberisha', roli: 'anetar', hyriSe: t });
  F.S.docs.set('grupet/g1/kujtesa/p1', { p: { '5461585641': hy('Test 330ml', 'Mafia Trade'), '7001': hy('Ujë Albi', 'Albi'), '7011': hy('Lëng Albi', 'Albi'), '9001': { e: 'Biskota', f: 'Devoli', k: t - 1000, a: 0, m: 0, s: 0, n: 'agim', x: 0 }, '9301': { e: 'Mësuar nga kolegu', f: 'Frutex X', k: t - 2000, a: 1, m: 0, s: 0, n: '', x: 0 } }, ndryshuarSe: t - 60000 });
  // v238: furnizuesit e kontrolluar nga administratori kanë hyrjen e vet (pa të do të prisnin kontrollin)
  const hf = e => ({ e, f: '', k: t - 60000, a: 0, m: 0, s: 1, n: '', x: 0, r: 0 });
  F.S.docs.set('grupet/g1/kujtesa/px', { p: { 'furnizuesi Mafia Trade': hf('Mafia Trade'), 'furnizuesi Albi': hf('Albi') }, ndryshuarSe: t - 60000 });
  const afA = [{ id: 'k1', emri: 'Ujë Albi', barkodi: '7001', furnizuesi: 'Albi', data: '2027-03-01', statusi: 'aktiv', ndryshuarSe: t - 6e5 }];
  F.S.docs.set('dyqane/u1', { app: 'stoku', version: 3, foldera: [], produktet: [], afatet: [], fshira: {} });
  F.S.docs.set('dyqane/u2', { app: 'stoku', version: 3, foldera: [], produktet: [], afatet: afA, fshira: {} });
  const b = await chromium.launch();
  async function faqe(uid, emri, pc) {
    const ctx = await b.newContext(pc ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' }
      : { userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    await F.lidh(ctx, uid, emri + '@stoku-app.local', pc ? 'pc' : 'tel');
    await ctx.addInitScript(() => { try { localStorage.setItem('stoku:njoftimet:pyetur', '1'); } catch (e) {} });
    const p = await ctx.newPage();
    p.on('pageerror', e => { g++; console.log('[' + emri + (pc ? ' pc' : ' tel') + '] pageerror:', e.message); });
    await p.goto('http://127.0.0.1:8765/' + (pc ? 'pc.html' : 'index.html'));
    await p.waitForTimeout(2500);
    await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => d.classList.remove('hapur')));
    return p;
  }
  const grupi = () => { const h = {}; [...F.S.docs.keys()].filter(k => k.startsWith('grupet/g1/kujtesa/')).forEach(k => Object.assign(h, (F.S.docs.get(k) || {}).p || {})); return h; };
  async function pcStoku(p) {
    await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => d.classList.remove('hapur')));
    await p.click('#btnOpsione'); await p.waitForTimeout(300); await p.click('#opsSkeda [data-faqe="stoku"]'); await p.waitForTimeout(300);
    await p.click('#opsKujSeksion .ops-palos'); await p.click('#opsFurnSeksion .ops-palos'); await p.waitForTimeout(200);
  }
  async function telFaqe(p, nen) {
    await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => d.classList.remove('hapur')));
    await p.click('#btnOpsione'); await p.waitForTimeout(300); await p.click('#tabLista'); await p.waitForTimeout(200); await p.click('#' + nen); await p.waitForTimeout(300);
  }
  const furnPC = p => p.$$eval('#opsFurnLista .ops-furn-rresht', x => x.map(e => e.innerText.replace(/\s+/g, ' ').trim()));
  const furnTel = p => p.$$eval('#furnLista .ops-furn-rresht', x => x.map(e => e.innerText.replace(/\s+/g, ' ').trim()));
  const pc = await faqe('u2', 'mendurberisha', true);
  const tel = await faqe('u2', 'mendurberisha', false);
  const agim = await faqe('u1', 'agim', false);
  await pc.waitForTimeout(3500);
  let G = grupi();
  ok(G['furnizuesi Mafia Trade'] && G['furnizuesi Albi'] && !G['furnizuesi Mafia Trade'].r && G['furnizuesi Devoli'] && !G['furnizuesi Devoli'].s && G['furnizuesi Devoli'].n === 'agim' && !G['furnizuesi Frutex X'],
    '0. administratori i ruan të miratuarit te grupi; i riu i kolegut ruhet më vete në pritje (v214); jo ai që Stoku e mësoi vetë', Object.keys(G).filter(k => /furnizuesi/.test(k)).map(k => k + ':' + JSON.stringify(G[k])));
  // 1. PC harron "Test 330ml": Mafia Trade mbetet (pa produkte), edhe te telefoni, edhe pas rihapjes
  await pcStoku(pc);
  await pc.click('#opsKujLista .ops-furn-rresht:has-text("Test 330ml") button:has-text("Ndrysho")'); await pc.waitForTimeout(200);
  await pc.click('#opsKujLista .ops-furn-edit button:has-text("Fshije")'); await pc.waitForTimeout(3500);
  let fp = await furnPC(pc);
  ok(fp.some(x => /Mafia Trade/.test(x) && /Pa produkte/.test(x)), '1. PC: produkti u harrua, "Mafia Trade" mbetet (Pa produkte)', fp);
  await telFaqe(tel, 'stFurnizuesit');
  let ft = await furnTel(tel);
  ok(ft.some(x => /Mafia Trade/.test(x) && /Pa produkte/.test(x)), '1. telefoni: "Mafia Trade" mbetet', ft);
  await pc.reload(); await pc.waitForTimeout(5000); await pcStoku(pc);
  ok((await furnPC(pc)).some(x => /Mafia Trade/.test(x)), '1. pas rihapjes së PC-së: mbetet');
  // 2. PC fshin furnizuesin "Albi": produktet e tij mbeten (pa furnizues); s'kthehet as nga afatet e PC-së
  await pc.click('#opsFurnLista .ops-furn-rresht:has-text("Albi") button'); await pc.waitForTimeout(200);
  await pc.click('#opsFurnLista .ops-furn-edit button:has-text("Fshije")'); await pc.waitForTimeout(300);
  ok(await pc.evaluate(() => document.getElementById('dlgKonfirmo').classList.contains('hapur')), '2. pyet para fshirjes');
  await pc.click('#kfPo'); await pc.waitForTimeout(3500);
  G = grupi();
  ok(G['furnizuesi Albi'].x === 1 && G['7001'].e === 'Ujë Albi' && G['7001'].f === '' && G['7011'].e === 'Lëng Albi' && G['7011'].f === '', '2. grupi: furnizuesi i fshirë, produktet mbeten pa furnizues', [G['furnizuesi Albi'], G['7001'], G['7011']]);
  fp = await furnPC(pc);
  ok(!fp.some(x => /^A Albi/.test(x) || / Albi /.test(' ' + x + ' ')) && /Ujë Albi/.test(await pc.textContent('#opsKujLista')), '2. PC: Albi s\'del te Furnizuesit; produktet janë ende te Produktet', fp);
  await telFaqe(tel, 'stFurnizuesit'); ft = await furnTel(tel);
  ok(!ft.some(x => /Albi/.test(x)), '2. telefoni: Albi s\'del më', ft);
  await pc.reload(); await pc.waitForTimeout(5000); await tel.reload(); await tel.waitForTimeout(5000);
  await pcStoku(pc); await telFaqe(tel, 'stFurnizuesit');
  ok(!(await furnPC(pc)).some(x => /Albi/.test(x)) && !(await furnTel(tel)).some(x => /Albi/.test(x)) && grupi()['furnizuesi Albi'].x === 1, '2. pas rihapjes (edhe pse afatet e PC-së kanë Albi): s\'kthehet', grupi()['furnizuesi Albi']);
  // 3. Furnizuesi i ri i kolegut (Devoli): "Ruaj" në PC → kalon te Furnizuesit, edhe te kolegu
  await pc.click('#opsFurnPritjeSeksion .ops-palos'); await pc.waitForTimeout(150);
  await pc.click('#opsFurnPritjeLista .ops-furn-rresht:has-text("Devoli") button:has-text("Ruaj")'); await pc.waitForTimeout(3500);
  ok(grupi()['furnizuesi Devoli'] && !grupi()['furnizuesi Devoli'].x && (await furnPC(pc)).some(x => /Devoli/.test(x)) && !/Devoli/.test(await pc.textContent('#opsFurnPritjeLista')), '3. PC: "Ruaj" e kalon Devolin te Furnizuesit (v238: Frutex X i mësuar vetë mbetet në pritje)');
  await telFaqe(agim, 'stFurnizuesit');
  const fa = await furnTel(agim);
  ok(fa.some(x => /Devoli/.test(x)) && fa.some(x => /Mafia Trade/.test(x)) && !(await agim.isVisible('#stFurnPritje')), '3. kolegu: Devoli te Furnizuesit, pa "Furnizuesit e rinj"', fa);
  console.log('gabime', g); await b.close(); process.exit(g ? 1 : 0);
})();
