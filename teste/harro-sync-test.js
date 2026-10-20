// v206: "Harroje" dhe riemërtimi i furnizuesit: administratori në PC + telefon (e njëjta llogari) + një koleg
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
(async () => {
  const F = krijoFirestore({ rregullat: 'reja' });
  const t = Date.now();
  const hyrje = (e, f) => ({ e, f, k: t - 60000, a: 0, m: 1, s: 1, n: 'mendurberisha', x: 0 });
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: t, grupi: 'g1' });
  F.S.docs.set('perdoruesit/u2', { perdoruesi: 'mendurberisha', kycurSe: t, grupi: 'g1' });
  F.S.docs.set('grupet/g1', { emri: 'Market', pronarUid: 'u1', pronarEmri: 'agim' });
  F.S.docs.set('grupet/g1/anetaret/u1', { emri: 'agim', roli: 'pronar', hyriSe: t });
  F.S.docs.set('grupet/g1/anetaret/u2', { emri: 'mendurberisha', roli: 'anetar', hyriSe: t });
  F.S.docs.set('grupet/g1/kujtesa/p0', { p: { '9000': hyrje('Coca Test', 'Laberion'), '9100': hyrje('Fanta Test', 'Laberion'), '9200': hyrje('Sprite Test', 'Laberion') }, ndryshuarSe: t - 60000 });
  // v238: furnizuesi i kontrolluar nga administratori (pa hyrjen e vet do të priste kontrollin)
  F.S.docs.set('grupet/g1/kujtesa/px', { p: { 'furnizuesi Laberion': { e: 'Laberion', f: '', k: t - 60000, a: 0, m: 0, s: 1, n: '', x: 0, r: 0 } }, ndryshuarSe: t - 60000 });
  const afA = [['k1', 'Coca Test', '9000'], ['k2', 'Fanta Test', '9100'], ['k3', 'Sprite Test', '9200']].map(([id, emri, barkodi]) => ({ id, emri, barkodi, furnizuesi: 'Laberion', data: '2027-03-01', statusi: 'aktiv', ndryshuarSe: t - 6e5 }));
  const afK = [{ id: 'g1', emri: 'Coca e agimit', barkodi: '9000', furnizuesi: 'Laberion', data: '2027-03-02', statusi: 'aktiv', ndryshuarSe: t - 6e5 }];
  F.S.docs.set('dyqane/u1', { app: 'stoku', version: 3, foldera: [], produktet: [], afatet: afK, fshira: {} });
  F.S.docs.set('grupet/g1/afatet/u1', { uid: 'u1', emri: 'agim', afatet: afK, ndryshuarSe: t - 6e5 });
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
  const kuj = p => p.evaluate(() => JSON.parse(localStorage.getItem('stoku:kujtesa:v1') || '{}'));
  async function pcProduktet(p) {
    await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => d.classList.remove('hapur')));
    await p.click('#btnOpsione'); await p.waitForTimeout(300); await p.click('#opsSkeda [data-faqe="stoku"]'); await p.waitForTimeout(300);
    await p.click('#opsKujSeksion .ops-palos'); await p.click('#opsFurnSeksion .ops-palos'); await p.waitForTimeout(200);
  }
  async function telFaqe(p, nen) {
    await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => d.classList.remove('hapur')));
    await p.click('#btnOpsione'); await p.waitForTimeout(300); await p.click('#tabLista'); await p.waitForTimeout(200); await p.click('#' + nen); await p.waitForTimeout(300);
  }
  const pc = await faqe('u2', 'mendurberisha', true);
  const tel = await faqe('u2', 'mendurberisha', false);
  const agim = await faqe('u1', 'agim', false);
  await pc.waitForTimeout(3000);
  ok((await kuj(tel))['9000'] && (await kuj(pc))['9000'] && (await kuj(agim))['9000'], '0. produktet e administratorit janë në të tri pajisjet');

  // 1. PC: "Harroje" Coca Test → telefoni e heq menjëherë
  await pcProduktet(pc);
  await pc.click('#opsKujLista .ops-furn-rresht:has-text("Coca Test") button:has-text("Ndrysho")'); await pc.waitForTimeout(200);
  await pc.click('#opsKujLista .ops-furn-edit button:has-text("Fshije")'); await pc.waitForTimeout(3500);
  let G = grupi();
  ok(G['9000'] && G['9000'].x === 1 && G['9000'].s === 1, '1. harrimi nga PC arrin te grupi', G['9000']);
  ok((await kuj(tel))['9000'].x === 1 && (await kuj(agim))['9000'].x === 1, '1. telefoni i administratorit dhe kolegu e marrin menjëherë');
  await telFaqe(tel, 'stProduktet');
  ok(!/Coca Test/.test(await tel.textContent('#kujtesaLista')) && /Fanta Test/.test(await tel.textContent('#kujtesaLista')), '1. te telefoni s\'del më te Produktet');
  // 2. PC rihapet: s'kthehet (edhe pse afatet e administratorit dhe të kolegut e kanë barkodin 9000)
  await pc.reload(); await pc.waitForTimeout(5000);
  ok((await kuj(pc))['9000'].x === 1 && grupi()['9000'].x === 1, '2. pas rihapjes së PC-së: mbetet i harruar (edhe te grupi)', (await kuj(pc))['9000']);
  await pcProduktet(pc);
  ok(!/Coca Test/.test(await pc.textContent('#opsKujLista')), '2. PC: s\'del te Produktet');
  // 3. Telefoni: "Harroje" Fanta Test → PC e heq
  await telFaqe(tel, 'stProduktet');
  await tel.click('#kujtesaLista .ops-furn-rresht:has-text("Fanta Test")'); await tel.waitForTimeout(200);
  await tel.click('#kujtesaLista .ops-furn-edit button:has-text("Fshije")'); await tel.waitForTimeout(3500);
  ok(grupi()['9100'].x === 1 && (await kuj(pc))['9100'].x === 1, '3. harrimi nga telefoni arrin te grupi dhe te PC', grupi()['9100']);
  await pcProduktet(pc);
  ok(!/Fanta Test/.test(await pc.textContent('#opsKujLista')) && /Sprite Test/.test(await pc.textContent('#opsKujLista')), '3. PC: Fanta s\'del më');
  await tel.reload(); await tel.waitForTimeout(5000);
  ok((await kuj(tel))['9100'].x === 1 && (await kuj(tel))['9000'].x === 1, '3. pas rihapjes së telefonit: të dy mbeten të harruar');
  // 4. Kolegu ruan sërish një afat me 9000: produkti s'kthehet te kujtesa
  await agim.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => d.classList.remove('hapur')));
  await agim.click('#btnAfatet'); await agim.waitForTimeout(400); await agim.click('#afShto'); await agim.waitForTimeout(300);
  await agim.fill('#afatBarkodi', '9000'); await agim.dispatchEvent('#afatBarkodi', 'change'); await agim.fill('#afatEmri', 'Coca prapë'); await agim.fill('#afatData', '31-12-27');
  await agim.click('#afatRuaj'); await agim.waitForTimeout(3500);
  ok(grupi()['9000'].x === 1 && (await kuj(agim))['9000'].x === 1, '4. kolegu s\'e rikthen produktin e harruar', grupi()['9000']);
  const afAg = await agim.evaluate(() => JSON.parse(localStorage.getItem('stoku:afatet:v1') || '[]').filter(a => a.barkodi === '9000').map(a => a.emri));
  ok(afAg.includes('Coca prapë'), '4. afati i kolegut ruhet normalisht me emrin e tij', afAg);
  // 5. Furnizuesit: PC e riemërton Laberion → telefoni sheh vetëm emrin e ri, edhe pas rihapjes
  await pcProduktet(pc);
  await pc.click('#opsFurnLista .ops-furn-rresht:has-text("Laberion") button'); await pc.waitForTimeout(200);
  await pc.fill('#opsFurnLista .ops-furn-edit input', 'Laberion Sh.p.k'); await pc.keyboard.press('Enter'); await pc.waitForTimeout(4000);
  ok(grupi()['9200'].f === 'Laberion Sh.p.k', '5. riemërtimi arrin te grupi', grupi()['9200']);
  const emratPC = await pc.$$eval('#opsFurnLista .ops-furn-emri', x => x.map(e => e.textContent));
  await telFaqe(tel, 'stFurnizuesit');
  let emratTel = await tel.$$eval('#furnLista .ops-furn-emri', x => x.map(e => e.textContent));
  ok(emratPC.includes('Laberion Sh.p.k') && !emratPC.includes('Laberion') && emratTel.includes('Laberion Sh.p.k') && !emratTel.includes('Laberion'), '5. PC dhe telefoni: vetëm "Laberion Sh.p.k"', { emratPC, emratTel });
  await pc.reload(); await pc.waitForTimeout(5000); await tel.reload(); await tel.waitForTimeout(5000);
  await pcProduktet(pc); await telFaqe(tel, 'stFurnizuesit');
  const pas = [await pc.$$eval('#opsFurnLista .ops-furn-emri', x => x.map(e => e.textContent)), await tel.$$eval('#furnLista .ops-furn-emri', x => x.map(e => e.textContent))];
  ok(!pas[0].includes('Laberion') && !pas[1].includes('Laberion'), '5. pas rihapjes: emri i vjetër s\'kthehet as në PC as në telefon', pas);
  console.log('gabime', g); await b.close(); process.exit(g ? 1 : 0);
})();
