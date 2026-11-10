// v285: shpejtësia me shumë të dhëna. (1) afatet.js: data e sotme (ora e Kosovës, Intl) llogaritet një herë në sekondë / minutë, jo
// për çdo afat (v282 e bëri listën e Afateve me mijëra afate disa sekonda); rezultatet mbeten të njëjta. (2) Telefoni: lista e
// Afateve vizatohet pjesë-pjesë (120 + grupe prej 200); "Të gjitha" i zgjedh të gjitha afatet e listës, edhe ato që s'janë vizatuar
// ende. (3) PC: tabela e Afateve pjesë-pjesë (300 + 400). (4) versionet.
const { chromium } = require('./pw.js');
const A = require('../afatet.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
(async () => {
  // 1) logjika: e njëjta përgjigje me dhe pa kujtesë, edhe rreth mesnatës, edhe pas ndërrimit të zonës
  const m = A.msNgaKs(2026, 11, 10, 23, 59);
  ok(A.ditetDeri('2026-11-11', m + 30000) === 1 && A.ditetDeri('2026-11-11', m + 90000) === 0 && A.ditetDeri('2026-11-11', m + 30000) === 1, '1. mesnata në Kosovë: 23:59 → nesër, 00:00 → sot (edhe mbrapsht)');
  ok(A.statusi({ data: '2026-11-09' }, m) === 'skaduar' && A.statusi({ data: '2026-12-09' }, m) === 'afer' && A.statusi({ data: '2026-12-11' }, m) === 'ok', '1. statusi me kufirin 30 ditë');
  ok(A.ditetDeri('2026-02-31') === null && A.ditetDeri('__proto__') === null && A.ditetDeri('constructor') === null && A.ditetDeri(20261110) === null && A.ditetDeri('') === null && A.statusi({ data: 'x' }) === 'pa-date', '1. datat e pavlefshme mbeten "pa datë"');
  A.vendosZonen('Pacific/Kiritimati'); const k1 = A.sot(m); A.vendosZonen('Pacific/Pago_Pago'); const k2 = A.sot(m); A.vendosZonen();
  ok(k1 === '2026-11-11' && k2 === '2026-11-10' && A.sot(m) === '2026-11-10' && A.oraKs(m) === '23:59', '1. ndërrimi i zonës e zbraz kujtesën', [k1, k2, A.sot(m), A.oraKs(m)]);
  const t = Date.now(), d = n => new Date(t + n * 864e5).toISOString().slice(0, 10);
  const AF = []; for (let i = 0; i < 3000; i++) AF.push({ id: 'a' + i, emri: 'Afat ' + i, data: d((i % 200) - 20), statusi: i % 15 === 0 ? 'hequr' : 'aktiv', hequrSe: t - i * 1000 });
  const t0 = Date.now(); AF.slice().sort(A.krahaso); A.numero(AF); const ms = Date.now() - t0;
  ok(ms < 400, '1. renditja + numërimi i 3000 afateve nën 400 ms (ishte mbi 1 s)', ms);

  const b = await chromium.launch();
  const N = 700;
  const lista = []; for (let i = 0; i < N; i++) lista.push({ id: 'a' + i, emri: 'Afat ' + i, barkodi: String(3890000000000 + i), data: d((i % 90) + 1), sasia: 1, furnizuesi: 'F' + (i % 5), statusi: 'aktiv', krijuarSe: t, ndryshuarSe: t });
  async function faqe(pc) {
    const ctx = await b.newContext({ userAgent: pc ? undefined : 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: pc ? { width: 1366, height: 800 } : { width: 390, height: 800 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    await ctx.addInitScript(af => {
      if (location.protocol !== 'http:') return;
      window.__stokuCloud = { authGati: true, perdoruesiAktual: () => ({ uid: 'u1', email: 'agim@stoku-app.local' }), token: async () => 't',
        merr: async () => ({ ok: true, gjendja: null }), bashkoDheRuaj: async fn => ({ ok: true, gjendja: fn(null) }), ruaj: async () => ({ ok: true }), degjo: () => () => {}, degjoFletet: () => () => {}, dil: async () => {} };
      localStorage.setItem('stoku:pronari-uid', 'u1'); localStorage.setItem('stoku:porta:hyrja', JSON.stringify({ uid: 'u1', emri: 'agim' }));
      localStorage.setItem('stoku:te-rejat:pare', '999'); localStorage.setItem('stoku:njoftimet:jo-tani', String(Date.now()));
      if (!localStorage.getItem('__nisur')) { localStorage.setItem('stoku:afatet:v1', JSON.stringify(af)); localStorage.setItem('__nisur', '1'); }
    }, lista);
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto('http://127.0.0.1:8765/' + (pc ? 'pc.html#/afatet' : 'index.html')); await p.waitForTimeout(2500);
    return p;
  }
  // 2) telefoni
  const tel = await faqe(false);
  const menjehere = await tel.evaluate(() => { document.getElementById('btnAfatet').click(); return document.querySelectorAll('#afLista .af-karta').length; });
  ok(menjehere === 120, '2. tel: menjëherë pas hapjes janë 120 kartat e para', menjehere);
  await tel.waitForFunction(n => document.querySelectorAll('#afLista .af-karta').length === n, N, { timeout: 8000 }).catch(() => {});
  const fund = await tel.evaluate(() => { const k = [...document.querySelectorAll('#afLista .af-karta')].map(x => x.getAttribute('data-id')); return { n: k.length, unike: new Set(k).size, pare: k[0], fundit: k[k.length - 1] }; });
  ok(fund.n === N && fund.unike === N, '2. tel: pak më vonë janë të gjitha ' + N + ' kartat, pa përsëritje', fund);
  // kërkimi gjatë vizatimit: vizatimi i vjetër ndalet, s'përzihen kartat
  await tel.evaluate(() => { const f = document.getElementById('afKerko'); f.value = ''; f.dispatchEvent(new Event('input', { bubbles: true })); f.value = 'Afat 69'; f.dispatchEvent(new Event('input', { bubbles: true })); });
  await tel.waitForTimeout(900);
  const pasK = await tel.evaluate(() => [...document.querySelectorAll('#afLista .af-karta .af-emri')].map(x => x.textContent));
  ok(pasK.length === 11 && pasK.every(x => /^Afat 69/.test(x)), '2. tel: kërkimi gjatë vizatimit tregon vetëm rezultatet e veta (Afat 69, 690–699)', pasK.length);
  await tel.evaluate(() => { const f = document.getElementById('afKerko'); f.value = ''; f.dispatchEvent(new Event('input', { bubbles: true })); });
  // zgjedhja: shtypje e gjatë te karta e parë, pastaj "Të gjitha" MENJËHERË (para se të vizatohen të gjitha)
  const zgj = await tel.evaluate(async () => {
    const k = document.querySelector('#afLista .af-karta');
    k.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 50, clientY: 300, pointerType: 'touch' }));
    await new Promise(r => setTimeout(r, 650));
    k.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    const nje = document.getElementById('afZgjNumri').textContent;
    // rivizato listën dhe shtyp "Të gjitha" pa pritur
    const f = document.getElementById('afKerko'); f.value = 'Afat'; f.dispatchEvent(new Event('input', { bubbles: true }));
    const vizatuar = document.querySelectorAll('#afLista .af-karta').length;
    document.getElementById('afZgjTeGjitha').click();
    return { nje, vizatuar, pas: document.getElementById('afZgjNumri').textContent };
  });
  ok(zgj.nje === '1 e zgjedhur' && zgj.vizatuar === 120 && zgj.pas === N + ' të zgjedhura', '2. tel: "Të gjitha" i zgjedh të ' + N + ' afatet, edhe kur janë vizatuar vetëm 120', zgj);
  await tel.waitForFunction(n => document.querySelectorAll('#afLista .af-karta.zgjedhur').length === n, N, { timeout: 8000 }).catch(() => {});
  ok(await tel.evaluate(() => document.querySelectorAll('#afLista .af-karta.zgjedhur').length) === N, '2. tel: kartat e vizatuara më vonë dalin të zgjedhura');
  ok(!tel.__gab.length, '2. tel pa gabime JS', tel.__gab);
  // 3) PC
  const pc = await faqe(true);
  const pcM = await pc.evaluate(() => { const f = document.getElementById('afKerko'); f.value = 'Afat'; f.dispatchEvent(new Event('input', { bubbles: true })); return document.querySelectorAll('#afTrup tr').length; });
  ok(pcM >= 300 && pcM < N, '3. PC: menjëherë pas vizatimit janë rreth 300 rreshtat e parë', pcM);
  await pc.waitForFunction(n => document.querySelectorAll('#afTrup tr:not(.af-grup)').length === n, N, { timeout: 8000 }).catch(() => {});
  const pcF = await pc.evaluate(() => document.querySelectorAll('#afTrup tr:not(.af-grup)').length);
  ok(pcF === N, '3. PC: pak më vonë janë të gjithë ' + N + ' rreshtat', pcF);
  await pc.evaluate(() => { const f = document.getElementById('afKerko'); f.value = 'Afat 69'; f.dispatchEvent(new Event('input', { bubbles: true })); });
  await pc.waitForTimeout(900);
  // (kërkimi i PC-së gjen edhe sipas barkodit: "69" brenda barkodit) → krahasohet me numrin e saktë të afateve që përputhen
  const pcK = await pc.evaluate(() => { const r = [...document.querySelectorAll('#afTrup tr:not(.af-grup)')].map(x => x.textContent); return { n: r.length, unike: new Set(r).size, me69: r.filter(x => /69/.test(x)).length }; });
  ok(pcK.n >= 11 && pcK.n < 60 && pcK.unike === pcK.n && pcK.me69 === pcK.n, '3. PC: kërkimi gjatë vizatimit tregon vetëm rezultatet e veta, pa përsëritje', pcK);
  ok(!pc.__gab.length, '3. PC pa gabime JS', pc.__gab);
  // 4) versionet
  const fs = require('fs'), sw = fs.readFileSync(__dirname + '/../sw.js', 'utf8');
  const nr = rx => Number((sw.match(rx) || [])[1]);
  ok(nr(/stoku-v(\d+)/) >= 285 && nr(/afatet\.js\?v=(\d+)/) >= 285 && nr(/app-tel\.js\?v=(\d+)/) >= 285 && nr(/app-pc\.js\?v=(\d+)/) >= 285, '4. versionet ≥ 285');
  const tr = fs.readFileSync(__dirname + '/../teRejat.js', 'utf8');
  ok(/\{ v: 285,[^\n]*platforma: 'tel'/.test(tr) && /\{ v: 285,[^\n]*platforma: 'pc'/.test(tr), '4. teRejat v285 (tel + pc)');
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();
