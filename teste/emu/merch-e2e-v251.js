// v251: çipi i marketit ("Je te / Shto marketin") te merchandiseri, me faqet e vërteta + SDK-në e vërtetë + emulatorët
// (bash teste/emu/nis.sh; serveri i testeve në 8765). Si aplikacioni Android: hyrje në një pajisje të pastër.
// A. merchandiseri i ri (web): perdoruesit/{uid}.merchandiser = true; çipi del
// B. e njëjta llogari në një pajisje të pastër (Android): çipi del dhe s'zhduket (edhe pas rifreskimit)
// C. dokumenti pa "merchandiser" (zgjedhja s'arriti te Firebase): pajisja ku u zgjodh e shkruan sërish, çipi s'zhduket;
//    pastaj edhe pajisja e pastër e njeh
// D. merchandiseri i ndezur nga administratori (lejet/{uid}.marketet): çipi + marketet e Stoku-t (pikat) pa rifreskim
const E = require('./e2e.js');
const FS_URL = E.FS_URL;
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const prit = (fn, ms = 15000) => new Promise(async z => { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (await fn()) return z(true); } catch (e) {} await new Promise(r => setTimeout(r, 300)); } z(false); });
const cipi = p => p.evaluate(() => { const c = document.querySelector('.sb-home-krye .mk-chip'); return c ? c.textContent.replace(/\s+/g, ' ').trim() : ''; });
// Ndjek çipin çdo 100 ms: a u zhduk ndonjëherë pasi doli?
const ndiq = p => p.evaluate(() => { window.__cipi = []; setInterval(() => { const c = !!document.querySelector('.sb-home-krye .mk-chip'); const l = window.__cipi; if (!l.length || l[l.length - 1] !== c) l.push(c); }, 100); });
const uZhduk = p => p.evaluate(() => { const l = window.__cipi || []; const i = l.indexOf(true); return i !== -1 && l.slice(i).indexOf(false) !== -1; });
const mbyll = p => p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => { if (!d.classList.contains('faqe-e-plote')) d.classList.remove('hapur'); }));
async function hyr(p, emri) {
  await p.goto(E.BAZA + '/index.html');
  await p.waitForSelector('#pkEmri', { state: 'visible', timeout: 20000 });
  await p.fill('#pkEmri', emri); await p.fill('#pkFjalekalimi', 'sakte123');
  await p.click('#pkDergo');
  await p.waitForTimeout(5000);
}
async function shkruaj(path, fields) {
  const mask = Object.keys(fields).map(k => 'updateMask.fieldPaths=' + k).join('&');
  const r = await fetch(FS_URL + '/' + path + '?' + mask, { method: 'PATCH', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }, body: JSON.stringify({ fields }) });
  if (!r.ok) throw new Error(path + ': ' + r.status + ' ' + await r.text());
}
(async () => {
  await E.vendosRregullat(); await E.pastro();
  const b = await E.nisChromium();
  const t = Date.now();
  await shkruaj('pikat/pA', { emri: { stringValue: 'Albi Mall' }, lat: { doubleValue: 42.6476 }, lng: { doubleValue: 21.1491 }, krijuarNga: { stringValue: 'u9' }, krijuarNgaEmri: { stringValue: 'besa' }, krijuarSe: { integerValue: String(t) }, ndryshuarSe: { integerValue: String(t) } });

  // A. Merchandiseri i ri në web
  const { p: w } = await E.faqe(b, false, 'web');
  await E.regjistrohu(w, 'drini', false, true);
  const uD = (await E.lista('perdoruesit')).find(x => x.f.perdoruesi === 'drini').id;
  ok(await prit(async () => (await E.lexo('perdoruesit/' + uD)).merchandiser === true), 'A. perdoruesit/{uid}.merchandiser = true', await E.lexo('perdoruesit/' + uD));
  await mbyll(w);
  ok(await prit(async () => /Marketi|Je te|Po sheh/.test(await cipi(w))), 'A. web: çipi i marketit', await cipi(w));

  // B. Pajisje e pastër (si aplikacioni Android)
  const { p: a } = await E.faqe(b, false, 'android');
  await a.addInitScript(() => {}); // pa të dhëna lokale
  await hyr(a, 'drini');
  await ndiq(a);
  await mbyll(a);
  ok(await prit(async () => /Marketi|Je te|Po sheh/.test(await cipi(a))), 'B. pajisja e pastër: çipi del', await cipi(a));
  await a.waitForTimeout(6000);
  ok(!(await uZhduk(a)) && !!(await cipi(a)), 'B. çipi s\'zhduket', await a.evaluate(() => window.__cipi));
  ok(await prit(async () => (await a.evaluate(() => JSON.parse(localStorage.getItem('stoku:marketet:v1') || '[]'))).some(m => m.p === 'pA')), 'B. marketet e Stoku-t (pikat) te lista');
  const k0 = await a.evaluate(() => JSON.parse(localStorage.getItem('stoku:kopja:pikat') || 'null'));
  await a.reload(); await a.waitForTimeout(1500); await ndiq(a); await a.waitForTimeout(6000);
  ok(!(await uZhduk(a)) && !!(await cipi(a)), 'B. pas rifreskimit: çipi mbetet', await a.evaluate(() => window.__cipi));
  // v252: kopja e pikave: hapja e dytë me pyetjen e ndryshimeve dhe numërimin (rregullat e vërteta i lejojnë)
  const k1 = await a.evaluate(() => JSON.parse(localStorage.getItem('stoku:kopja:pikat') || 'null'));
  ok(!!k0 && !!k1 && k1.sinkSe > k0.sinkSe && k1.plotaSe === k0.plotaSe && Object.keys(k1.docs).length === 1, 'B. v252: kopja e pikave: hapja e dytë vetëm me ndryshimet (pa lexim të plotë)', [k0 && k0.sinkSe, k1 && k1.sinkSe, k1 && k1.plotaSe === (k0 && k0.plotaSe)]);
  ok(!a.__log.some(x => /permission|PERMISSION/i.test(x)), 'B. v252: pa refuzime nga rregullat', a.__log.slice(0, 5));

  // C. Dokumenti pa "merchandiser" (zgjedhja s'arriti te Firebase)
  await shkruaj('perdoruesit/' + uD, { merchandiser: { booleanValue: false } });
  await w.reload(); await w.waitForTimeout(1200); await ndiq(w); await w.waitForTimeout(7000);
  ok(await prit(async () => (await E.lexo('perdoruesit/' + uD)).merchandiser === true), 'C. web (ku u zgjodh) e shkruan sërish "merchandiser"', await E.lexo('perdoruesit/' + uD));
  await mbyll(w);
  ok(!(await uZhduk(w)) && /Marketi|Je te|Po sheh/.test(await cipi(w)), 'C. web: çipi s\'zhduket', await w.evaluate(() => window.__cipi));
  const { p: a2 } = await E.faqe(b, false, 'android2');
  await hyr(a2, 'drini'); await mbyll(a2);
  ok(await prit(async () => /Marketi|Je te|Po sheh/.test(await cipi(a2))), 'C. edhe një pajisje e pastër e njeh si merchandiser', await cipi(a2));

  // D. Merchandiseri i ndezur nga administratori (pa "Punoj si merchandiser")
  const { p: v } = await E.faqe(b, false, 'vesa');
  await E.regjistrohu(v, 'vesa', false, false);
  const uV = (await E.lista('perdoruesit')).find(x => x.f.perdoruesi === 'vesa').id;
  await mbyll(v);
  ok(!(await cipi(v)), 'D. vesa (jo merchandiser): pa çip');
  await shkruaj('lejet/' + uV, { lejet: { mapValue: { fields: { marketet: { booleanValue: true } } } }, kontrolluarSe: { integerValue: String(Date.now()) } });
  ok(await prit(async () => /Marketi|Je te|Po sheh/.test(await cipi(v))), 'D. administratori e ndez: çipi del pa rifreskim', await cipi(v));
  ok(await prit(async () => (await v.evaluate(() => JSON.parse(localStorage.getItem('stoku:marketet:v1') || '[]'))).some(m => m.p === 'pA')), 'D. v251: edhe marketet e Stoku-t (pikat), pa rifreskim');

  for (const [n, p] of [['web', w], ['android', a], ['android2', a2], ['vesa', v]]) ok(!p.__gab.length, n + ': pa gabime JS', p.__gab);
  await b.close();
  console.log(g ? 'GABIME: ' + g : 'Krejt në rregull');
  process.exit(g ? 1 : 0);
})();
