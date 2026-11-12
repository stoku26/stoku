// v295: pronari: "kur e skanon të njëjtin produkt me të njëjtin barkod me dal afatet që i ke të atij produkti, e në rast se është
// afati i njëjtë kur e shton me ju shtu sasi asaj date". Telefon + PC (Android: Hyrja 57, logjika e krahasuar te vendas-fikstura).
const { chromium } = require('./pw.js');
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/audit.js', 'utf8');
const MOCK = eval('(' + src.match(/const MOCK = (\(\) => \{[\s\S]*?\n\};)/)[1].slice(0, -1) + ')');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const B = '3830000622349';
const afatetE = p => p.evaluate(b => JSON.parse(localStorage.getItem('stoku:afatet:v1') || '[]').filter(a => a.barkodi === b && a.statusi !== 'hequr').map(a => ({ data: a.data, sasia: a.sasia })).sort((x, y) => x.data < y.data ? -1 : 1), B);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
  await ctx.addInitScript(MOCK);
  await ctx.addInitScript(() => {
    if (sessionStorage.getItem('seed')) return; sessionStorage.setItem('seed', '1');
    localStorage.setItem('stoku:opsione:v1', JSON.stringify({ pda: true })); // "Shto" hap direkt formën (pa kamerë)
    localStorage.setItem('stoku:afatet:v1', JSON.stringify([
      { id: 'x1', barkodi: '3830000622349', emri: 'Ujë Radenska', data: '2027-12-31', sasia: 6, furnizuesi: 'Rugove', statusi: 'aktiv', krijuarSe: 1, ndryshuarSe: 1 },
      { id: 'x2', barkodi: '3830000622349', emri: 'Ujë Radenska', data: '2026-01-05', sasia: 2, statusi: 'aktiv', krijuarSe: 2, ndryshuarSe: 2 },
      { id: 'x3', barkodi: '3830000622349', emri: 'Ujë Radenska', data: '2027-06-30', sasia: 9, statusi: 'hequr', hequrSe: 3, ndryshuarSe: 3 },
      { id: 'x4', barkodi: '999', emri: 'Tjetër', data: '2027-12-31', sasia: 1, statusi: 'aktiv', ndryshuarSe: 1 }
    ]));
  });
  const p = await ctx.newPage(); const gab = [];
  p.on('pageerror', e => gab.push(e.message)); p.on('dialog', d => d.dismiss());
  await p.goto('http://127.0.0.1:8765/index.html'); await p.waitForTimeout(2600);
  await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => d.classList.remove('hapur')));
  await p.click('#btnAfatet'); await p.waitForTimeout(500);

  // 1) skanimi i barkodit → afatet që ka (pa të hequrin), sipas datës
  await p.click('#afShto'); await p.waitForTimeout(400);
  ok(await p.isHidden('#afatEkzistuese'), '1. pa barkod: s\'del lista');
  await p.fill('#afatBarkodi', B); await p.dispatchEvent('#afatBarkodi', 'change'); await p.waitForTimeout(150);
  const l = await p.evaluate(() => ({ dukt: !document.getElementById('afatEkzistuese').hidden, titulli: document.querySelector('.af-ekz-titulli').textContent,
    rreshtat: [...document.querySelectorAll('#afatEkzistuese .af-ekz-rresht')].map(r => r.textContent), klasat: [...document.querySelectorAll('#afatEkzistuese .af-ekz-rresht')].map(r => r.className) }));
  ok(l.dukt && l.titulli === 'Ky produkt ka 2 afate:' && l.rreshtat.length === 2 && /05\.01\.2026/.test(l.rreshtat[0]) && /2 copë/.test(l.rreshtat[0]) && /Skaduar/.test(l.rreshtat[0])
    && /31\.12\.2027/.test(l.rreshtat[1]) && /6 copë/.test(l.rreshtat[1]) && /skaduar/.test(l.klasat[0]), '1. del lista me 2 afatet aktive (i hequri jo), sipas datës', l);
  await p.screenshot({ path: __dirname + '/v295-tel.png' });
  // prekja e afatit vendos datën
  await p.click('#afatEkzistuese .af-ekz-rresht >> nth=1'); await p.waitForTimeout(150);
  const d = await p.evaluate(() => ({ data: document.getElementById('afatData').value, hint: document.getElementById('afatDataHint').textContent, fokus: document.activeElement.id }));
  ok(d.data === '31-12-27' && /Skadon/.test(d.hint) && d.fokus === 'afatSasia', '1. prekja e afatit vendos datën e tij, fokusi te sasia', d);
  // 2) e njëjta datë → copat i shtohen
  await p.fill('#afatSasia', '4'); await p.click('#afatRuaj'); await p.waitForTimeout(400);
  let a = await afatetE(p);
  const t = await p.textContent('#toast');
  ok(a.length === 2 && a[1].data === '2027-12-31' && a[1].sasia === 10 && /U shtuan 4 copë te afati i 31\.12\.2027 \(gjithsej 10 copë\)/.test(t), '2. e njëjta datë: 6 + 4 = 10, pa rresht të ri', { a, t });
  // pa sasi: s'krijohet rresht i ri
  await p.click('#afShto'); await p.waitForTimeout(300);
  await p.fill('#afatBarkodi', B); await p.dispatchEvent('#afatBarkodi', 'change'); await p.fill('#afatData', '31-12-27'); await p.click('#afatRuaj'); await p.waitForTimeout(400);
  a = await afatetE(p);
  ok(a.length === 2 && a[1].sasia === 10 && /ekziston tashmë/.test(await p.textContent('#toast')), '2. pa sasi: s\'krijohet rresht i ri, sasia mbetet', a);
  // 3) data tjetër → afat i ri
  await p.click('#afShto'); await p.waitForTimeout(300);
  await p.fill('#afatBarkodi', B); await p.dispatchEvent('#afatBarkodi', 'change'); await p.fill('#afatData', '15-03-28'); await p.fill('#afatSasia', '3'); await p.click('#afatRuaj'); await p.waitForTimeout(400);
  a = await afatetE(p);
  ok(a.length === 3 && a[2].data === '2028-03-15' && a[2].sasia === 3, '3. data tjetër: afat i ri', a);
  // 4) afati ekzistues (ndryshimi) s'e tregon listën dhe s'bashkohet
  await p.click('.af-rresht >> nth=0').catch(() => {}); await p.waitForTimeout(300);
  ok(await p.isHidden('#afatEkzistuese'), '4. te ndryshimi i një afati s\'del lista');
  await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(x => x.classList.remove('hapur')));
  ok(!gab.length, 'tel: pa gabime JS', gab);

  // 5) PC
  const pc = await ctx.newPage(); const gab2 = []; pc.on('pageerror', e => gab2.push(e.message)); pc.on('dialog', x => x.dismiss());
  await pc.setViewportSize({ width: 1440, height: 900 });
  await pc.goto('http://127.0.0.1:8765/pc.html#/afatet'); await pc.waitForTimeout(2500);
  await pc.evaluate(() => document.querySelectorAll('.mbulese.hapur, .dialog.hapur').forEach(x => x.classList.remove('hapur')));
  await pc.click('#afBtnShto'); await pc.waitForTimeout(400);
  ok(await pc.isHidden('#afdEkzistuese'), '5. PC: pa barkod s\'del lista');
  await pc.fill('#afdBarkodi', B); await pc.dispatchEvent('#afdBarkodi', 'change'); await pc.waitForTimeout(150);
  const lp = await pc.evaluate(() => [...document.querySelectorAll('#afdEkzistuese .af-ekz-rresht')].map(r => r.textContent));
  ok(lp.length === 3 && /05\.01\.2026/.test(lp[0]) && /10 copë/.test(lp[1]) && /15\.03\.2028/.test(lp[2]), '5. PC: lista me 3 afatet', lp);
  await pc.screenshot({ path: __dirname + '/v295-pc.png' });
  await pc.click('#afdEkzistuese .af-ekz-rresht >> nth=2'); await pc.waitForTimeout(150);
  ok(await pc.inputValue('#afdData') === '15-03-28', '5. PC: klikimi vendos datën');
  await pc.fill('#afdSasia', '2'); await pc.click('#afdRuaj'); await pc.waitForTimeout(400);
  a = await afatetE(pc);
  ok(a.length === 3 && a[2].sasia === 5, '5. PC: e njëjta datë: 3 + 2 = 5, pa rresht të ri', a);
  ok(!gab2.length, 'PC: pa gabime JS', gab2);
  await b.close();
  const sw = fs.readFileSync(__dirname + '/../sw.js', 'utf8');
  const nr = rx => Number((sw.match(rx) || [])[1]);
  ok(nr(/stoku-v(\d+)/) >= 295 && nr(/app-tel\.js\?v=(\d+)/) >= 295 && nr(/app-pc\.js\?v=(\d+)/) >= 295 && nr(/afatet\.js\?v=(\d+)/) >= 295, 'versionet ≥ 295');
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();
