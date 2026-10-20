// v214: (1) furnizuesi i ri (i kolegut ose i administratorit) s'fshihet kur fshihen produktet e tij, as te të dhënat e vjetra;
// (2) edhe produktet dhe furnizuesit e rinj të administratorit presin kontrollin te Cilësimet → Stoku derisa t'i ruajë;
// (3) lista publike s'i përfshin ata në pritje; (4) i fshiri s'kthehet nga sfondi, por kthehet në pritje kur dikush e shkruan sërish.
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
const PORTI = process.env.PORTI || '8765';
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
(async () => {
  const F = krijoFirestore({ rregullat: 'reja' });
  const t = Date.now();
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: t, grupi: 'g1' });
  F.S.docs.set('perdoruesit/u2', { perdoruesi: 'mendurberisha', kycurSe: t, grupi: 'g1' });
  F.S.docs.set('grupet/g1', { emri: 'Market', pronarUid: 'u2', pronarEmri: 'mendurberisha' });
  F.S.docs.set('grupet/g1/anetaret/u1', { emri: 'agim', roli: 'anetar', hyriSe: t });
  F.S.docs.set('grupet/g1/anetaret/u2', { emri: 'mendurberisha', roli: 'pronar', hyriSe: t });
  // Të dhëna të vjetra: produkt i kolegut në pritje, furnizuesi i tij pa hyrje më vete
  F.S.docs.set('grupet/g1/kujtesa/p1', { p: {
    '8009': { e: 'Produkt i vjetër', f: 'Furn Vjetër', k: t - 60000, a: 0, m: 0, s: 0, n: 'agim', x: 0 },
    '7001': { e: 'Ujë', f: 'Rugove', k: t - 9e6, a: 0, m: 1, s: 1, n: 'mendurberisha', x: 0 },
    'furnizuesi Rugove': { e: 'Rugove', f: '', k: t - 9e6, a: 0, m: 0, s: 1, n: '', x: 0 }
  }, ndryshuarSe: t - 60000 });
  const foldera = [{ id: 'f1', emri: 'Ushqimore', ndryshuarSe: t - 9e6 }];
  F.S.docs.set('dyqane/u1', { app: 'stoku', version: 3, foldera, produktet: [], afatet: [], fshira: {} });
  F.S.docs.set('dyqane/u2', { app: 'stoku', version: 3, foldera, produktet: [], afatet: [], fshira: {} });
  const b = await chromium.launch();
  async function faqe(uid, emri, pc) {
    const ctx = await b.newContext(pc ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' }
      : { userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    await F.lidh(ctx, uid, emri + '@stoku-app.local', pc ? 'pc' : 'tel');
    await ctx.addInitScript(() => { try { localStorage.setItem('stoku:njoftimet:pyetur', '1'); } catch (e) {} });
    const p = await ctx.newPage();
    p.on('pageerror', e => { g++; console.log('[' + emri + '] pageerror:', e.message); });
    await p.goto('http://127.0.0.1:' + PORTI + '/' + (pc ? 'pc.html' : 'index.html'));
    await p.waitForTimeout(3000);
    await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => d.classList.remove('hapur')));
    return p;
  }
  const grupi = () => { const h = {}; [...F.S.docs.keys()].filter(k => k.startsWith('grupet/g1/kujtesa/')).forEach(k => Object.assign(h, (F.S.docs.get(k) || {}).p || {})); return h; };
  const mbyll = p => p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => d.classList.remove('hapur')));
  async function pcStoku(p) {
    await mbyll(p);
    await p.click('#btnOpsione'); await p.waitForTimeout(300); await p.click('#opsSkeda [data-faqe="stoku"]'); await p.waitForTimeout(300);
    for (const s of ['#opsKujSeksion', '#opsFurnSeksion']) await p.click(s + ' .ops-palos');
    for (const s of ['#opsKujPritjeSeksion', '#opsFurnPritjeSeksion']) if (await p.isVisible(s + ' .ops-palos')) await p.click(s + ' .ops-palos');
    await p.waitForTimeout(200);
  }
  const emrat = (p, sel) => p.$$eval(sel + ' .ops-furn-rresht .ops-furn-emri', x => x.map(e => e.textContent.trim()));
  const lista = async p => ({ fp: await emrat(p, '#opsFurnPritjeLista'), f: await emrat(p, '#opsFurnLista'), kp: await emrat(p, '#opsKujPritjeLista'), k: await emrat(p, '#opsKujLista') });
  async function fshijProduktinNePritje(p, emri) {
    await p.click('#opsKujPritjeLista .ops-furn-rresht:has-text("' + emri + '") button:has-text("Ndrysho")'); await p.waitForTimeout(200);
    await p.click('#opsKujPritjeLista .ops-furn-edit button:has-text("Fshije")'); await p.waitForTimeout(300);
  }

  const pc = await faqe('u2', 'mendurberisha', true);
  const agim = await faqe('u1', 'agim', false);
  await pc.waitForTimeout(3500);

  // 1. Të dhënat e vjetra: furnizuesi i produktit në pritje merr hyrjen e vet; s'fshihet kur fshihet produkti
  let G = grupi();
  ok(G['furnizuesi Furn Vjetër'] && !G['furnizuesi Furn Vjetër'].x && G['furnizuesi Furn Vjetër'].n === 'agim' && !G['furnizuesi Furn Vjetër'].s,
    '1. furnizuesi i vjetër në pritje ruhet më vete (në pritje, nga agim)', G['furnizuesi Furn Vjetër']);
  await pcStoku(pc);
  let L = await lista(pc);
  ok(L.fp.includes('Furn Vjetër') && L.kp.includes('Produkt i vjetër'), '1. PC: produkti dhe furnizuesi presin kontrollin', L);
  await fshijProduktinNePritje(pc, 'Produkt i vjetër');
  await pc.waitForTimeout(3000);
  L = await lista(pc);
  ok(!L.kp.includes('Produkt i vjetër') && L.fp.includes('Furn Vjetër'), '1. PC: pas fshirjes së produktit, furnizuesi mbetet te "Furnizuesit e rinj"', L);

  // 2. Kolegu shton produkt me furnizues të ri; administratori e fshin produktin; furnizuesi mbetet (PC, kolegu)
  await agim.click('#folderaLista >> text=Ushqimore'); await agim.waitForTimeout(500);
  await agim.fill('#barkodi', '8001'); await agim.press('#barkodi', 'Enter'); await agim.waitForTimeout(400);
  await agim.fill('#dlgEmri', 'Lëng i ri'); await agim.fill('#dlgFurnizuesi', 'Furnizues i Ri'); await agim.fill('#dlgSasia', '3');
  await agim.click('#dlgRuaj'); await agim.waitForTimeout(3500);
  G = grupi();
  ok(G['8001'] && G['8001'].n === 'agim' && G['furnizuesi Furnizues i Ri'] && G['furnizuesi Furnizues i Ri'].n === 'agim' && !G['furnizuesi Furnizues i Ri'].s,
    '2. kolegu: produkti dhe furnizuesi i ri në grup, në pritje', [G['8001'], G['furnizuesi Furnizues i Ri']]);
  await pcStoku(pc);
  L = await lista(pc);
  ok(L.fp.includes('Furnizues i Ri') && L.kp.includes('Lëng i ri'), '2. PC: dalin te "të rejat"', L);
  await fshijProduktinNePritje(pc, 'Lëng i ri');
  await pc.waitForTimeout(3500);
  L = await lista(pc);
  ok(!L.kp.includes('Lëng i ri') && L.fp.includes('Furnizues i Ri'), '2. PC: produkti u fshi, furnizuesi mbetet', L);
  await pc.reload(); await pc.waitForTimeout(5000); await pcStoku(pc);
  L = await lista(pc);
  ok(L.fp.includes('Furnizues i Ri') && L.fp.includes('Furn Vjetër'), '2. PC pas rihapjes: mbeten', L.fp);
  await mbyll(agim); await agim.click('#btnMbrapa'); await agim.waitForTimeout(300);
  await agim.click('#btnOpsione'); await agim.waitForTimeout(300); await agim.click('#tabLista'); await agim.waitForTimeout(200); await agim.click('#stFurnPritje'); await agim.waitForTimeout(400);
  const fa = await agim.$$eval('#furnPritjeLista .ops-furn-rresht .ops-furn-emri', x => x.map(e => e.textContent.trim()));
  ok(fa.includes('Furnizues i Ri'), '2. kolegu (telefon): e sheh ende te "Furnizuesit e rinj"', fa);

  // 3. Administratori: produkti dhe furnizuesi i ri presin kontrollin (edhe afati pa barkod)
  await mbyll(pc);
  await pc.evaluate(() => { location.hash = '#/f/f1'; }); await pc.waitForTimeout(500);
  await pc.click('#btnShto'); await pc.waitForTimeout(300);
  await pc.fill('#prBarkodi', '8101'); await pc.fill('#prEmri', 'Produkt i adminit'); await pc.fill('#prFurnizuesi', 'Admini Ri'); await pc.fill('#prSasia', '4');
  await pc.click('#prRuaj'); await pc.waitForTimeout(600);
  await pc.evaluate(() => { location.hash = '#/afatet'; }); await pc.waitForTimeout(500);
  await pc.keyboard.press('n'); await pc.waitForTimeout(300);
  await pc.fill('#afdEmri', 'Afat pa barkod'); await pc.fill('#afdData', '31-12-27'); await pc.fill('#afdFurnizuesi', 'Afat Ri');
  await pc.click('#afdRuaj'); await pc.waitForTimeout(600);
  await pcStoku(pc);
  L = await lista(pc);
  ok(L.kp[0] === 'Produkt i adminit' && !L.k.includes('Produkt i adminit'), '3. PC: produkti i ri i administratorit pret kontrollin (në krye)', L.kp);
  ok(L.fp.includes('Admini Ri') && L.fp.includes('Afat Ri') && !L.f.includes('Admini Ri') && !L.f.includes('Afat Ri'), '3. PC: furnizuesit e rinj të administratorit presin kontrollin', L);

  // 4. Ruaj → kalojnë në krye të listave kryesore
  await pc.click('#opsFurnPritjeLista .ops-furn-rresht:has-text("Admini Ri") button:has-text("Ruaj")'); await pc.waitForTimeout(400);
  await pc.click('#opsKujPritjeLista .ops-furn-rresht:has-text("Produkt i adminit") button:has-text("Ruaj")'); await pc.waitForTimeout(400);
  L = await lista(pc);
  ok(L.f[0] === 'Admini Ri' && !L.fp.includes('Admini Ri'), '4. PC: "Ruaj" e kalon furnizuesin në krye të Furnizuesve', L.f.slice(0, 3));
  ok(L.k[0] === 'Produkt i adminit' && !L.kp.includes('Produkt i adminit'), '4. PC: "Ruaj" e kalon produktin në krye të Produkteve', L.k.slice(0, 3));

  // 5. Lista publike: vetëm të kontrolluarit (publikohet 3 s pas rifreskimit të fundit; sinkronizimi e rifreskon edhe një herë)
  await pc.waitForTimeout(8000);
  const pub = (F.S.docs.get('publike/furnizuesit') || {}).lista || [];
  ok(pub.includes('Admini Ri') && pub.includes('Rugove') && !pub.includes('Afat Ri') && !pub.includes('Furnizues i Ri') && !pub.includes('Furn Vjetër'), '5. lista publike: pa ata në pritje', pub);

  // 6. Fshije furnizuesin në pritje "Afat Ri": s'kthehet nga sfondi (edhe pse afati e ka), por kthehet në pritje kur kolegu e shkruan sërish
  await pc.click('#opsFurnPritjeLista .ops-furn-rresht:has-text("Afat Ri") button:has-text("Ndrysho")'); await pc.waitForTimeout(200);
  await pc.click('#opsFurnPritjeLista .ops-furn-edit button:has-text("Fshije")'); await pc.waitForTimeout(300);
  if (await pc.isVisible('#kfPo')) await pc.click('#kfPo');
  await pc.waitForTimeout(3500);
  await pc.reload(); await pc.waitForTimeout(5000); await pcStoku(pc);
  L = await lista(pc);
  ok(!L.fp.includes('Afat Ri') && !L.f.includes('Afat Ri') && grupi()['furnizuesi Afat Ri'].x === 1, '6. "Afat Ri" i fshirë s\'kthehet pas rihapjes', grupi()['furnizuesi Afat Ri']);
  await mbyll(agim); await agim.click('#btnMbrapa').catch(() => {}); await agim.waitForTimeout(200);
  await agim.click('#folderaLista >> text=Ushqimore'); await agim.waitForTimeout(500);
  await agim.fill('#barkodi', '8002'); await agim.press('#barkodi', 'Enter'); await agim.waitForTimeout(400);
  await agim.fill('#dlgEmri', 'Tjetër'); await agim.fill('#dlgFurnizuesi', 'Afat Ri'); await agim.fill('#dlgSasia', '1');
  await agim.click('#dlgRuaj'); await agim.waitForTimeout(4000);
  await pcStoku(pc);
  L = await lista(pc);
  ok(L.fp.includes('Afat Ri') && grupi()['furnizuesi Afat Ri'].n === 'agim' && !grupi()['furnizuesi Afat Ri'].x, '6. kur kolegu e shkruan sërish, del sërish në pritje', grupi()['furnizuesi Afat Ri']);

  // 7. Fshirja e furnizuesit s'i fshin produktet (v207)
  await pc.click('#opsFurnLista .ops-furn-rresht:has-text("Admini Ri") button:has-text("Ndrysho emrin")'); await pc.waitForTimeout(200);
  await pc.click('#opsFurnLista .ops-furn-edit button:has-text("Fshije")'); await pc.waitForTimeout(300);
  if (await pc.isVisible('#kfPo')) await pc.click('#kfPo');
  await pc.waitForTimeout(800);
  L = await lista(pc);
  ok(!L.f.includes('Admini Ri') && L.k.includes('Produkt i adminit'), '7. fshirja e furnizuesit s\'e fshin produktin', L.k.slice(0, 3));
  console.log('gabime', g); await b.close(); process.exit(g ? 1 : 0);
})();
