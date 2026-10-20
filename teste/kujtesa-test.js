// v196: kujtesa e produkteve (barkodi → emri, furnizuesi), vetëm në pajisje — tel + PC
const { chromium } = require('./pw.js');
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/audit.js', 'utf8');
const MOCK = eval('(' + src.match(/const MOCK = (\(\) => \{[\s\S]*?\n\};)/)[1].slice(0, -1) + ')');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const kuj = p => p.evaluate(() => JSON.parse(localStorage.getItem('stoku:kujtesa:v1') || '{}'));
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
  await ctx.addInitScript(MOCK);
  await ctx.addInitScript(() => { const c = window.__stokuCloud; c.perdoruesiAktual = () => ({ uid: 'u1', email: 'mendurberisha@stoku-app.local' }); }); // v198: Cilësimet → Stoku vetëm për administratorin
  await ctx.addInitScript(() => {
    if (sessionStorage.getItem('seed')) return; sessionStorage.setItem('seed', '1');
    localStorage.setItem('stoku:foldera:v1', JSON.stringify([{ id: 'f1', emri: 'Pije' }]));
    localStorage.setItem('stoku:afatet:v1', JSON.stringify([{ id: 'x1', barkodi: '777', emri: 'Ujë Rugove 0.5L', data: '2027-01-01', furnizuesi: 'Rugove', statusi: 'aktiv', ndryshuarSe: 1 }]));
    localStorage.setItem('stoku:produktet:v2', JSON.stringify({ 'f1::888': { barkodi: '888', emri: 'Lëng Pjeshke', sasia: 3, kategoriaId: 'f1', furnizuesi: 'Frutex', prekurSe: 1 } }));
  });
  const p = await ctx.newPage(); const gab = [];
  p.on('pageerror', e => gab.push(e.message)); p.on('dialog', d => d.dismiss());
  await p.goto('http://127.0.0.1:8765/index.html'); await p.waitForTimeout(2600);
  await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => d.classList.remove('hapur')));
  let k = await kuj(p);
  ok(k['777'] && k['777'].e === 'Ujë Rugove 0.5L' && k['777'].f === 'Rugove' && k['888'] && k['888'].e === 'Lëng Pjeshke' && k['888'].f === 'Frutex', '1. në hapje mëson nga afatet dhe stoku ekzistues', k);

  // 2. afat i ri me barkod → mësohet; herën tjetër plotësohet vetë
  await p.click('#btnAfatet'); await p.waitForTimeout(500);
  await p.click('#afShto'); await p.waitForTimeout(300);
  await p.fill('#afatBarkodi', '3900001'); await p.fill('#afatEmri', 'Coca Cola 1.25L'); await p.fill('#afatData', '31-12-27'); await p.fill('#afatFurnizuesi', 'Laberion');
  await p.click('#afatRuaj'); await p.waitForTimeout(400);
  k = await kuj(p);
  ok(k['3900001'] && k['3900001'].e === 'Coca Cola 1.25L' && k['3900001'].f === 'Laberion', '2. ruajtja e afatit e mëson produktin', k['3900001']);
  await p.click('#afShto'); await p.waitForTimeout(300);
  await p.fill('#afatBarkodi', '3900001'); await p.dispatchEvent('#afatBarkodi', 'change'); await p.waitForTimeout(100);
  const v2 = await p.evaluate(() => [document.getElementById('afatEmri').value, document.getElementById('afatFurnizuesi').value]);
  ok(v2[0] === 'Coca Cola 1.25L' && v2[1] === 'Laberion', '2. skanimi i sërishëm plotëson emrin dhe furnitorin', v2);
  await p.fill('#afatBarkodi', '777'); await p.fill('#afatEmri', ''); await p.fill('#afatFurnizuesi', ''); await p.dispatchEvent('#afatBarkodi', 'change');
  const v3 = await p.evaluate(() => [document.getElementById('afatEmri').value, document.getElementById('afatFurnizuesi').value]);
  ok(v3[0] === 'Ujë Rugove 0.5L' && v3[1] === 'Rugove', '2. edhe produkti i mësuar nga afatet e vjetra', v3);
  await p.click('#afatAnulo');

  // 3. Cilësimet → Stoku: afati i ri i administratorit pret te "Produktet e reja" (v214); ndryshimi + Ruaj e kalon te Produktet
  await p.click('#btnOpsione'); await p.waitForTimeout(400); await p.click('#tabLista'); await p.waitForTimeout(400); await p.click('#stPritje'); await p.waitForTimeout(300);
  const pritja = await p.textContent('#kujPritjeLista');
  ok(/Coca Cola 1\.25L/.test(pritja), '3. v214: produkti i ri i administratorit pret te "Produktet e reja"', pritja.replace(/\s+/g, ' ').slice(0, 160));
  await p.click('#kujPritjeLista .ops-furn-rresht:has-text("Coca Cola")'); await p.waitForTimeout(200);
  const inps = p.locator('#kujPritjeLista .ops-furn-edit input');
  ok(await inps.count() === 2, '3. hapet ndryshimi (emri + furnitori)');
  await p.screenshot({ path: __dirname + '/kuj-tel-edit.png' });
  await inps.nth(0).fill('Coca-Cola 1.25 L'); await inps.nth(1).fill('Laberion Sh.p.k.');
  await p.click('#kujPritjeLista .ops-furn-edit button:has-text("Ruaj")'); await p.waitForTimeout(200);
  k = await kuj(p);
  ok(k['3900001'].e === 'Coca-Cola 1.25 L' && k['3900001'].f === 'Laberion Sh.p.k.' && k['3900001'].m === 1 && !k['3900001'].r, '3. ndryshimi ruhet (me dorë) dhe del nga pritja', k['3900001']);
  // v238: produktet që Stoku i mësoi vetë nga afatet presin edhe ato kontrollin; administratori i ruan ("Ruaj")
  const pritja2 = await p.textContent('#kujPritjeLista');
  ok(/Ujë Rugove/.test(pritja2) && /Lëng Pjeshke/.test(pritja2), '3. v238: të mësuarat vetë nga afatet presin te "Produktet e reja"', pritja2.replace(/\s+/g, ' ').slice(0, 160));
  await p.evaluate(() => { const K = window.StokuAfatet.kujtesa(); K.lista().filter(x => x.nePritje).forEach(x => K.vendos(x.barkodi, x.emri, x.furnizuesi)); });
  await p.click('#opsPrapa'); await p.waitForTimeout(300); await p.click('#stProduktet'); await p.waitForTimeout(300);
  const lista = await p.textContent('#kujtesaLista');
  ok(/Coca-Cola 1\.25 L/.test(lista) && /Ujë Rugove/.test(lista) && /Lëng Pjeshke/.test(lista) && await p.isVisible('#kujtesaSeksion'), '3. Produktet: lista', lista.replace(/\s+/g, ' ').slice(0, 160));
  await p.screenshot({ path: __dirname + '/kuj-tel-lista.png', fullPage: false });
  await p.fill('#kujtesaKerko', 'rugove').catch(() => {}); await p.waitForTimeout(150);
  await p.click('#kujtesaLista .ops-furn-rresht:has-text("Ujë Rugove")'); await p.waitForTimeout(150);
  await p.click('#kujtesaLista .ops-furn-edit button:has-text("Fshije")'); await p.waitForTimeout(200);
  k = await kuj(p);
  ok(k['777'] && k['777'].x === 1 && !k['777'].e, '3. "Harroje" e heq nga kujtesa (mbetet si e harruar)', k['777']);
  await p.click('#opsPrapa').catch(() => {}); await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => d.classList.remove('hapur')));

  // 4. pas ndryshimit me dorë, afati i ri merr emrin e ri
  await p.click('#btnAfatet'); await p.waitForTimeout(300); await p.click('#afShto'); await p.waitForTimeout(200);
  await p.fill('#afatBarkodi', '3900001'); await p.dispatchEvent('#afatBarkodi', 'change');
  const v4 = await p.evaluate(() => [document.getElementById('afatEmri').value, document.getElementById('afatFurnizuesi').value]);
  ok(v4[0] === 'Coca-Cola 1.25 L' && v4[1] === 'Laberion Sh.p.k.', '4. skanimi merr emrin e ndryshuar', v4);
  await p.click('#afatAnulo');

  // 5. Stoku: produkt i ri me barkod të njohur → emri plotësohet; ndryshimi i sasisë s'e humb furnitorin
  await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => d.classList.remove('hapur')));
  await p.click('#tabStoku').catch(() => {}); await p.waitForTimeout(300);
  await p.click('.folder-karta >> nth=0'); await p.waitForTimeout(400);
  await p.fill('#barkodi', '3900001'); await p.press('#barkodi', 'Enter'); await p.waitForTimeout(400);
  const dlg = await p.evaluate(() => ({ hapur: document.getElementById('dlgProdukt').classList.contains('hapur'), emri: document.getElementById('dlgEmri').value, fokus: document.activeElement && document.activeElement.id }));
  ok(dlg.hapur && dlg.emri === 'Coca-Cola 1.25 L' && dlg.fokus === 'dlgSasia', '5. stoku: produkti i ri merr emrin, fokusi te sasia', dlg);
  await p.evaluate(() => document.getElementById('dlgProdukt').classList.remove('hapur'));
  await p.fill('#barkodi', '888'); await p.press('#barkodi', 'Enter'); await p.waitForTimeout(400);
  await p.fill('#dlgSasia', '2'); await p.click('#dlgRuaj'); await p.waitForTimeout(300);
  const pr = await p.evaluate(() => JSON.parse(localStorage.getItem('stoku:produktet:v2'))['f1::888']);
  ok(pr && pr.sasia === 5 && pr.furnizuesi === 'Frutex', '5. ndryshimi i sasisë s\'e humb furnitorin (bug i vjetër)', pr);
  ok(!gab.length, 'tel: pa gabime', gab);

  // 6. PC (i njëjti shfletues → e njëjta kujtesë)
  const pc = await ctx.newPage(); const gab2 = []; pc.on('pageerror', e => gab2.push(e.message)); pc.on('dialog', d => d.dismiss());
  await pc.setViewportSize({ width: 1440, height: 900 });
  await pc.goto('http://127.0.0.1:8765/pc.html#/afatet'); await pc.waitForTimeout(2500);
  await pc.evaluate(() => document.querySelectorAll('.mbulese.hapur, .dialog.hapur').forEach(d => d.classList.remove('hapur')));
  await pc.evaluate(() => hapAfatinPc === undefined).catch(() => {});
  const v6 = await pc.evaluate(() => { const b = document.getElementById('afdBarkodi'); b.value = '3900001'; b.dispatchEvent(new Event('change')); return [document.getElementById('afdEmri').value, document.getElementById('afdFurnizuesi').value]; });
  ok(v6[0] === 'Coca-Cola 1.25 L' && v6[1] === 'Laberion Sh.p.k.', '6. PC: barkodi plotëson emrin dhe furnitorin', v6);
  await pc.click('#btnOpsione'); await pc.waitForTimeout(400); await pc.click('#dlgOpsione [data-faqe="stoku"]').catch(e => console.log('s\'u hap stoku', e.message)); await pc.waitForTimeout(400); await pc.click('#opsFurnSeksion .ops-palos');await pc.click('#opsKujSeksion .ops-palos');
  const lpc = await pc.textContent('#opsKujLista');
  ok(/Coca-Cola 1\.25 L/.test(lpc) && /Lëng Pjeshke/.test(lpc) && await pc.isVisible('#opsKujSeksion'), '6. PC: Cilësimet → Stoku → Produktet', lpc.replace(/\s+/g, ' ').slice(0, 160));
  ok(!/Ujë Rugove/.test(lpc), '6. produkti i harruar s\'kthehet nga afatet ekzistuese');
  await pc.click('#opsKujLista .ops-furn-rresht:has-text("Lëng Pjeshke") button:has-text("Ndrysho")'); await pc.waitForTimeout(200);
  await pc.screenshot({ path: __dirname + '/kuj-pc-edit.png' });
  const pin = pc.locator('#opsKujLista .ops-furn-edit input');
  await pin.nth(0).fill('Lëng Pjeshke 1L'); await pc.press('#opsKujLista .ops-furn-edit input >> nth=0', 'Enter'); await pc.waitForTimeout(200);
  k = await kuj(pc);
  ok(k['888'] && k['888'].e === 'Lëng Pjeshke 1L' && k['888'].f === 'Frutex', '6. PC: ndryshimi ruhet', k['888']);
  ok(!gab2.length, 'PC: pa gabime', gab2);
  console.log(g ? g + ' GABIME' : 'KREJT OK'); await b.close(); process.exit(g ? 1 : 0);
})();
