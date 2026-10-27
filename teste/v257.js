// v257: dy markete fqinje (si Viva Fly dhe Viva Fresh 110 matanë rrugës, rreth 60 m): kur GPS-i s'i dallon (largësitë
// ndryshojnë më pak se max(10 m, 0.8 × pasaktësia)), mbetet marketi aktiv (nëse është njëri prej tyre), përndryshe pyetet
// "Ku je?" (s'zgjidhet vetë fqinji i gabuar).
//  0) njësitë e gjejMarketin;
//  1) simulimi: 4000 matje GPS me gabim (±15…±60 m) në 5 vende brenda dy marketeve: gabimet ≤ 12% (më parë deri 35%);
//  2) telefoni, merchandiseri: te Viva Fly → "Viva Fly"; në mes të rrugës (e paqartë) mbetet "Viva Fly"; te Viva Fresh 110 →
//     "Viva Fresh 110"; pa market aktiv, në mes: "Ku je?" me tekstin e ri dhe të dy marketet në krye, pastaj zgjedhja mbetet.
const { chromium } = require('./pw.js');
const fs = require('fs');
const path = require('path');
const { krijoFirestore } = require('./fs-server.js');
const MK = require('../marketet.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const BAZA = process.env.BAZA || 'http://127.0.0.1:8765';
const PUSH = 'https://stoku-push.mendurb.workers.dev';
const UA = 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
const prit = (fn, ms = 12000) => new Promise(async z => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn().catch(() => false)) return z(true); await new Promise(r => setTimeout(r, 200)); } z(false); });

// Gjeometria e fotos: Viva Fly (A) dhe Viva Fresh 110 (B) 60 m larg, B në lindje-verilindje të A-së
const A0 = { lat: 42.6600, lng: 21.1700 }, M = 111320, ML = M * Math.cos(A0.lat * Math.PI / 180);
const pika = (x, y) => ({ lat: A0.lat + y / M, lng: A0.lng + x / ML });
const D = 60, K = 76 * Math.PI / 180, BX = D * Math.sin(K), BY = D * Math.cos(K), UX = BX / D, UY = BY / D;
const VF = Object.assign({ id: 'mA', emri: 'Viva Fly' }, pika(0, 0)), V110 = Object.assign({ id: 'mB', emri: 'Viva Fresh 110' }, pika(BX, BY));
const L = [VF, V110];
const geo = (x, y, s) => { const p = pika(x, y); return { latitude: p.lat, longitude: p.lng, accuracy: s }; };

(async () => {
  // ================= 0. Njësitë =================
  const at = (x, y, s) => Object.assign(pika(x, y), { sakt: s });
  ok(MK.PAQARTESIA_MIN_M === 10 && MK.PAQARTESIA_K === 0.8, '0. pragu: max(10 m, 0.8 × pasaktësia)');
  ok((MK.gjejMarketin(L, at(0, 0, 10), null) || {}).marketi === VF, '0. te Viva Fly (±10 m): Viva Fly');
  ok((MK.gjejMarketin(L, at(BX, BY, 10), null) || {}).marketi === V110, '0. te Viva Fresh 110 (±10 m): Viva Fresh 110');
  const mes = MK.gjejMarketin(L, at(BX / 2, BY / 2, 25), null);
  ok(mes && mes.paqarte && mes.kandidatet.length === 2, '0. në mes të rrugës (±25 m), pa market aktiv: e paqartë, të dy kandidatë', mes && mes.kandidatet.map(x => x.marketi.emri));
  ok((MK.gjejMarketin(L, at(BX / 2, BY / 2, 25), 'mA') || {}).marketi === VF && (MK.gjejMarketin(L, at(BX / 2, BY / 2, 25), 'mB') || {}).marketi === V110, '0. në mes, me market aktiv: mbetet aktivi');
  ok((MK.gjejMarketin(L, at(15 * UX, 15 * UY, 8), 'mB') || {}).marketi === VF, '0. GPS i mirë (±8 m) brenda Viva Fly: Viva Fly edhe kur aktivi ishte fqinji');
  ok(MK.gjejMarketin(L, at(-150 * UX, -150 * UY, 20), null) === null && MK.gjejMarketin(L, at(0, 0, 200), null) === null, '0. 150 m larg ose GPS shumë i përafërt: asnjë');
  ok(MK.gjej(L, at(BX / 2, BY / 2, 25)) !== null, '0. gjej() (pa fqinjët) mbetet si më parë');

  // ================= 1. Simulimi =================
  let farë = 12345; const rast = () => { farë = (farë * 1103515245 + 12345) % 2147483648; return farë / 2147483648; };
  const gauss = () => { let u = 0, v = 0; while (u === 0) u = rast(); while (v === 0) v = rast(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const vende = [['Viva Fly, te pika', 0, 0, 'mA'], ['Viva Fly, 15 m drejt rrugës', 15 * UX, 15 * UY, 'mA'], ['Viva Fly, 35 m anash', 35 * UY, -35 * UX, 'mA'],
    ['Viva Fresh 110, te pika', BX, BY, 'mB'], ['Viva Fresh 110, 10 m drejt rrugës', BX - 10 * UX, BY - 10 * UY, 'mB']];
  const N = 4000;
  let maksRi = 0, maksVjeter = 0, maksMeAktiv = 0, minMeAktiv = 100;
  vende.forEach(([emri, x, y, pritet]) => {
    const rr = [15, 25, 40, 60].map(s => {
      const sig = s / 1.515; let gabV = 0, gabR = 0, pyet = 0, okA = 0, gabA = 0;
      for (let i = 0; i < N; i++) {
        const p = at(x + gauss() * sig, y + gauss() * sig, s);
        const v = MK.gjej(L, p); if (v && v.marketi.id !== pritet) gabV++;
        const r = MK.gjejMarketin(L, p, null); if (r && r.paqarte) pyet++; else if (r && r.marketi.id !== pritet) gabR++;
        const ra = MK.gjejMarketin(L, p, pritet); if (ra && !ra.paqarte) { if (ra.marketi.id === pritet) okA++; else gabA++; }
      }
      const pc = v => Math.round(v * 100 / N);
      maksRi = Math.max(maksRi, pc(gabR)); maksVjeter = Math.max(maksVjeter, pc(gabV)); maksMeAktiv = Math.max(maksMeAktiv, pc(gabA)); minMeAktiv = Math.min(minMeAktiv, pc(okA));
      return `±${s}: gabim ${pc(gabV)}% → ${pc(gabR)}% (pyet ${pc(pyet)}%), me aktiv ${pc(okA)}% saktë`;
    });
    console.log('      ' + emri + ': ' + rr.join(' | '));
  });
  ok(maksVjeter >= 30, '1. më parë (vetëm më i afërti): deri ' + maksVjeter + '% zgjedhje të gabuara', maksVjeter);
  ok(maksRi <= 12, '1. tash: zgjedhjet e gabuara më së shumti ' + maksRi + '% (në vend të kësaj pyet "Ku je?")', maksRi);
  ok(maksMeAktiv <= 12 && minMeAktiv >= 85, '1. kur je tashmë te marketi i duhur: mbetet aty ≥ ' + minMeAktiv + '%, kërcen te fqinji ≤ ' + maksMeAktiv + '%', { minMeAktiv, maksMeAktiv });

  // ================= 2. Telefoni =================
  const t = Date.now();
  const F = krijoFirestore();
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'drini', kycurSe: t, merchandiser: true });
  F.S.docs.set('pikat/pA', { emri: 'Viva Fly', lat: VF.lat, lng: VF.lng, krijuarNga: 'u1', krijuarNgaEmri: 'drini', krijuarSe: t, ndryshuarSe: t });
  F.S.docs.set('pikat/pB', { emri: 'Viva Fresh 110', lat: V110.lat, lng: V110.lng, krijuarNga: 'u1', krijuarNgaEmri: 'drini', krijuarSe: t, ndryshuarSe: t });
  const MK1 = [{ id: 'mA', emri: 'Viva Fly', lat: VF.lat, lng: VF.lng, p: 'pA', ndryshuarSe: t - 9000 }, { id: 'mB', emri: 'Viva Fresh 110', lat: V110.lat, lng: V110.lng, p: 'pB', ndryshuarSe: t - 9000 }];
  const b = await chromium.launch();
  const ctx = await b.newContext({ userAgent: UA, viewport: { width: 390, height: 844 }, serviceWorkers: 'block', hasTouch: true, permissions: ['geolocation'], geolocation: geo(0, 0, 10) });
  await ctx.route(u => !u.href.startsWith(BAZA), r => {
    if (r.request().url().startsWith(PUSH)) return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: '{"ok":true}' });
    return r.abort();
  });
  await F.lidh(ctx, 'u1', 'drini@stoku-app.local', 'tel', { afatet: [] });
  await ctx.addInitScript(m => { if (!localStorage.getItem('stoku:marketet:v1')) localStorage.setItem('stoku:marketet:v1', JSON.stringify(m)); }, MK1);
  const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
  await p.goto(BAZA + '/index.html'); await p.waitForTimeout(2500);
  const cipi = () => p.evaluate(() => document.getElementById('afMarketiEmri').textContent);
  const kuJe = () => p.evaluate(() => document.getElementById('dlgMarketi').classList.contains('hapur'));
  async function rikthe(x, y, s) {
    await ctx.setGeolocation(geo(x, y, s));
    await p.evaluate(() => { const a = JSON.parse(localStorage.getItem('stoku:marketi:aktiv') || '{}'); a.kontrolluarSe = 0; localStorage.setItem('stoku:marketi:aktiv', JSON.stringify(a)); document.dispatchEvent(new Event('visibilitychange')); });
    await p.waitForTimeout(1500);
  }
  ok(await prit(async () => (await cipi()) === 'Viva Fly'), '2. brenda Viva Fly (±10 m): "Je te: Viva Fly"', await cipi());
  await rikthe(BX / 2, BY / 2, 25);
  ok((await cipi()) === 'Viva Fly' && !(await kuJe()), '2. në mes të rrugës (±25 m): mbetet "Viva Fly" (s\'kërcen te fqinji)', await cipi());
  await rikthe(BX, BY, 10);
  ok(await prit(async () => (await cipi()) === 'Viva Fresh 110'), '2. brenda Viva Fresh 110 (±10 m): "Je te: Viva Fresh 110"', await cipi());
  // pa market aktiv (p.sh. sapo erdhi), në mes: pyet
  await p.evaluate(() => { localStorage.setItem('stoku:marketi:aktiv', JSON.stringify({ id: null, menyra: 'gps', koha: 0, kontrolluarSe: 0 })); localStorage.removeItem('stoku:marketet:kuje'); });
  await rikthe(BX / 2, BY / 2, 25);
  ok(await prit(async () => await kuJe()), '2. pa market aktiv, në mes (±25 m): del "Ku je?"');
  ok(/Je afër disa marketeve dhe GPS-i s'i dallon dot/.test(await p.textContent('#mkdNen')), '2. teksti: "Je afër disa marketeve dhe GPS-i s\'i dallon dot"', await p.textContent('#mkdNen'));
  const lista = await p.evaluate(() => [...document.querySelectorAll('#mkdLista button')].map(x => x.textContent));
  ok(/Viva Fly|Viva Fresh 110/.test(lista[0] || '') && /Viva Fly|Viva Fresh 110/.test(lista[1] || ''), '2. të dy marketet në krye të listës', lista.slice(0, 3));
  ok((await cipi()) === 'Krejt marketet', '2. s\'zgjidhet vetë asnjë', await cipi());
  await p.evaluate(() => [...document.querySelectorAll('#mkdLista button')].find(x => /Viva Fly/.test(x.textContent)).click()); await p.waitForTimeout(300);
  ok((await cipi()) === 'Viva Fly', '2. zgjedh "Viva Fly"', await cipi());
  await rikthe(BX / 2 + 5 * UX, BY / 2 + 5 * UY, 30);
  ok((await cipi()) === 'Viva Fly' && !(await kuJe()), '2. zgjedhja mbetet edhe kur GPS-i lëviz pak drejt fqinjit', await cipi());
  ok(!p.__gab.length, '2. pa gabime JS', p.__gab);
  await b.close();
  console.log(g ? '\n✖ ' + g + ' GABIME' : '\n✔ Krejt në rregull');
  process.exit(g ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
