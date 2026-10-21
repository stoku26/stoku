// v232: kopja e të fshirave nga një pajisje tjetër. Dy telefona (A, B) dhe një kompjuter (K) në të njëjtën llogari:
// B fshin një folder me produkt → A dhe K e ruajnë kopjen (Cilësimet → Llogaria → "Të fshira nga një pajisje tjetër"),
// "Rikthe" e kthen në krejt pajisjet (edhe në cloud), "Hiq kopjen" e heq. Folderi i parazgjedhur bosh s'ruhet.
const { chromium } = require('./pw.js');
const fs = require('fs');
const { krijoFirestore } = require('./fs-server.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const B = 'http://127.0.0.1:8765';
const NM = __dirname + '/npm/node_modules';
const CDN = { 'jspdf.umd.min.js': NM + '/jspdf/dist/jspdf.umd.min.js', 'JsBarcode.all.min.js': NM + '/jsbarcode/dist/JsBarcode.all.min.js' };
const UA = 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
const UA_PC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const prit = (fn, ms = 9000) => new Promise(async z => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn().catch(() => false)) return z(true); await new Promise(r => setTimeout(r, 150)); } z(false); });
(async () => {
  const F = krijoFirestore();
  const t0 = Date.now();
  F.S.docs.set('perdoruesit/u5', { perdoruesi: 'pda34', kycurSe: t0, krijuarSe: t0 });
  const b = await chromium.launch();
  const gab = [];
  async function pajisje(emri, pc, seed) {
    const ctx = await b.newContext({ userAgent: pc ? UA_PC : UA, viewport: pc ? { width: 1440, height: 900 } : { width: 390, height: 844 }, serviceWorkers: 'block', hasTouch: !pc });
    await ctx.route(u => !u.href.startsWith(B), r => {
      const e = Object.keys(CDN).find(k => r.request().url().endsWith(k));
      if (e) return r.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(CDN[e]) });
      return r.abort();
    });
    await F.lidh(ctx, 'u5', 'pda34@stoku-app.local', pc ? 'pc' : 'tel', { afatet: [] });
    if (seed) await ctx.addInitScript(seed);
    const p = await ctx.newPage();
    p.on('pageerror', e => gab.push(emri + ': ' + e.message));
    await p.goto(B + (pc ? '/pc.html' : '/index.html')); await p.waitForTimeout(3500);
    return p;
  }
  const lokale = p => p.evaluate(() => ({
    f: JSON.parse(localStorage.getItem('stoku:foldera:v1') || '[]').map(f => f.emri),
    p: Object.values(JSON.parse(localStorage.getItem('stoku:produktet:v2') || '{}')).map(x => x.emri).sort(),
    k: JSON.parse(localStorage.getItem('stoku:kopja-fshirjeve:v1') || 'null')
  }));
  const cloud = () => {
    const d = F.S.docs.get('dyqane/u5') || {};
    const p = [...F.S.docs.entries()].filter(([k]) => k.startsWith('dyqane/u5/pjeset/')).flatMap(([, v]) => v.produktet || []).concat(d.produktet || []);
    return { f: (d.foldera || []).map(f => f.emri), p: p.map(x => x.emri).sort(), fshira: d.fshira || {} };
  };
  const kaFolder = (p, emri) => lokale(p).then(l => l.f.includes(emri));

  // A: telefoni me të dhënat (Testi me Qumësht, Pije me Ujë)
  const A = await pajisje('A', false, () => {
    if (localStorage.getItem('stoku:foldera:v1')) return;
    const t = Date.now() - 60000;
    localStorage.setItem('stoku:foldera:v1', JSON.stringify([{ id: 'ushqimore', emri: 'Ushqimore' }, { id: 'pije', emri: 'Pije' },
      { id: 'higjiene', emri: 'Higjiene' }, { id: 'fresh', emri: 'Fresh' }, { id: 'fT', emri: 'Testi', ndryshuarSe: t }]));
    localStorage.setItem('stoku:produktet:v2', JSON.stringify({
      'fT::111': { barkodi: '111', emri: 'Qumësht', sasia: 3, kategoriaId: 'fT', prekurSe: t },
      'pije::222': { barkodi: '222', emri: 'Ujë', sasia: 7, kategoriaId: 'pije', prekurSe: t }
    }));
  });
  ok(await prit(async () => cloud().f.includes('Testi') && cloud().p.length === 2), '0. A: të dhënat në cloud', cloud());
  const Bp = await pajisje('B', false);
  const K = await pajisje('K', true);
  ok(await prit(() => kaFolder(Bp, 'Testi')) && await prit(() => kaFolder(K, 'Testi')), '0. B dhe K i kanë "Testi"', [await lokale(Bp), await lokale(K)].map(l => l.f));

  // 1. B fshin "Testi" (me produktin brenda)
  await Bp.evaluate(() => { const k = [...document.querySelectorAll('.folder-karta')].find(x => /Testi/.test(x.textContent)); k.querySelector('.folder-fshij').click(); });
  await Bp.waitForTimeout(300); await Bp.click('#konfPo');
  ok(await prit(async () => !cloud().f.includes('Testi')), '1. B: "Testi" u fshi edhe në cloud', cloud().f);
  ok(await prit(async () => !(await kaFolder(A, 'Testi'))) && await prit(async () => !(await kaFolder(K, 'Testi'))), '1. "Testi" iku edhe nga A dhe K');
  const kA = (await lokale(A)).k, kB = (await lokale(Bp)).k, kK = (await lokale(K)).k;
  ok(kA && kA.uid === 'u5' && kA.foldera.map(f => f.emri).join() === 'Testi' && kA.produktet.map(p => p.emri).join() === 'Qumësht', '1. A: kopja ka "Testi" dhe "Qumësht"', kA);
  ok(kK && kK.foldera.map(f => f.emri).join() === 'Testi' && kK.produktet.map(p => p.emri).join() === 'Qumësht', '1. K (kompjuteri): kopja ka "Testi" dhe "Qumësht"', kK);
  ok(!kB, '1. B (që e fshiu vetë) s\'ka kopje', kB);
  // Cilësimet → Llogaria te A
  await A.click('#btnOpsione'); await A.waitForTimeout(300); await A.click('#tabLlogaria'); await A.waitForTimeout(400);
  const sA = await A.evaluate(() => ({ dukshem: !document.getElementById('llKopjaSeksion').hidden && document.getElementById('llKopjaSeksion').offsetParent !== null, t: document.getElementById('llKopjaTeksti').textContent }));
  ok(sA.dukshem && /^1 folder \("Testi"\) dhe 1 produkt u fshinë nga një pajisje tjetër\. Kopja u ruajt në këtë telefon më \d\d\.\d\d\.\d{4}, ora \d\d:\d\d\. "Rikthe" i kthen në krejt pajisjet\.$/.test(sA.t), '1. A: "Të fshira nga një pajisje tjetër" me tekstin e saktë', sA);
  await A.screenshot({ path: __dirname + '/v232-kopja-tel.png' });
  await Bp.click('#btnOpsione'); await Bp.waitForTimeout(300); await Bp.click('#tabLlogaria'); await Bp.waitForTimeout(400);
  ok(await Bp.evaluate(() => document.getElementById('llKopjaSeksion').hidden), '1. B: pa kartën e kopjes');
  await K.click('#btnOpsione'); await K.waitForTimeout(300); await K.click('#opsSkeda button[data-faqe="llogaria"]'); await K.waitForTimeout(400);
  const sK = await K.evaluate(() => ({ dukshem: !document.getElementById('opsKopja').hidden && document.getElementById('opsKopja').offsetParent !== null, t: document.getElementById('opsKopjaTeksti').textContent }));
  ok(sK.dukshem && /^1 folder \("Testi"\) dhe 1 produkt u fshinë nga një pajisje tjetër\. Kopja u ruajt në këtë kompjuter më \d\d\.\d\d\.\d{4}, ora \d\d:\d\d\. "Rikthe" i kthen në krejt pajisjet\.$/.test(sK.t), '1. K: karta e kopjes me tekstin e saktë', sK);
  await K.screenshot({ path: __dirname + '/v232-kopja-pc.png' });

  // 2. A: "Rikthe" → "Testi" me "Qumësht" kthehen kudo
  await A.click('#llKopjaRikthe'); await A.waitForTimeout(300);
  const kt = await A.evaluate(() => document.getElementById('konfTekst') ? document.getElementById('konfTekst').textContent : [...document.querySelectorAll('#dlgKonfirmo *')].map(x => x.textContent).join('|'));
  ok(/Kthehen 1 folder \("Testi"\) dhe 1 produkt në krejt pajisjet e llogarisë\./.test(kt), '2. A: pyetja para rikthimit', kt);
  await A.click('#konfPo');
  ok(await prit(async () => cloud().f.includes('Testi') && cloud().p.includes('Qumësht')), '2. cloud: "Testi" dhe "Qumësht" u kthyen', cloud());
  ok(await prit(() => kaFolder(Bp, 'Testi')) && await prit(() => kaFolder(K, 'Testi')), '2. B dhe K: "Testi" u kthye');
  ok(await prit(async () => (await lokale(Bp)).p.includes('Qumësht') && (await lokale(K)).p.includes('Qumësht')), '2. B dhe K: "Qumësht" u kthye');
  ok(await A.evaluate(() => document.getElementById('llKopjaSeksion').hidden) && !(await lokale(A)).k, '2. A: karta dhe kopja u hoqën');
  ok(await prit(() => K.evaluate(() => document.getElementById('opsKopja').hidden)), '2. K: karta iku (s\'mungon më asgjë)');
  const tst = await A.evaluate(() => document.getElementById('toast').textContent);
  ok(/U rikthyen: 1 folder \("Testi"\) dhe 1 produkt\./.test(tst), '2. A: njoftimi "U rikthyen"', tst);
  await A.waitForTimeout(3000);
  ok(cloud().f.includes('Testi') && (await kaFolder(Bp, 'Testi')), '2. pas disa sekondash "Testi" mbetet (B s\'e fshin sërish)', cloud().f);

  // 3. B fshin "Pije" (me "Ujë") dhe "Higjiene" (folder i parazgjedhur bosh, i paprekur): K → "Rikthe" nga kompjuteri
  for (const emri of ['Pije', 'Higjiene']) {
    await Bp.click('#btnOpsione').catch(() => {}); await Bp.waitForTimeout(200);
    await Bp.evaluate(() => { const o = document.getElementById('dlgOpsione'); if (o && o.classList.contains('hapur')) document.getElementById('btnOpsione').click(); });
    await Bp.evaluate(e => { const k = [...document.querySelectorAll('.folder-karta')].find(x => x.textContent.includes(e)); k.querySelector('.folder-fshij').click(); }, emri);
    await Bp.waitForTimeout(300); await Bp.click('#konfPo'); await Bp.waitForTimeout(400);
  }
  ok(await prit(async () => !cloud().f.includes('Pije') && !cloud().f.includes('Higjiene')), '3. B: "Pije" dhe "Higjiene" u fshinë', cloud().f);
  ok(await prit(async () => !(await kaFolder(K, 'Pije')) && !(await kaFolder(K, 'Higjiene'))), '3. K: të dy ikën');
  const kK3 = (await lokale(K)).k;
  ok(kK3 && kK3.foldera.map(f => f.emri).includes('Pije') && !kK3.foldera.map(f => f.emri).includes('Higjiene') && kK3.produktet.map(p => p.emri).includes('Ujë'), '3. K: kopja ka "Pije" me "Ujë", jo "Higjiene" (bosh, i paprekur)', kK3 && { f: kK3.foldera.map(f => f.emri), p: kK3.produktet.map(p => p.emri) });
  const t3 = await K.evaluate(() => document.getElementById('opsKopjaTeksti').textContent);
  ok(/^1 folder \("Pije"\) dhe 1 produkt u fshinë/.test(t3), '3. K: karta tregon vetëm "Pije" (jo "Testi", që është sërish këtu)', t3);
  await K.click('#opsKopjaRikthe'); await K.waitForTimeout(300);
  ok(/Kthehen 1 folder \("Pije"\) dhe 1 produkt në krejt pajisjet e llogarisë\./.test(await K.textContent('#kfTekst')), '3. K: pyetja para rikthimit', await K.textContent('#kfTekst'));
  await K.click('#kfPo');
  ok(await prit(async () => cloud().f.includes('Pije') && cloud().p.includes('Ujë')), '3. cloud: "Pije" me "Ujë" u kthye nga kompjuteri', cloud());
  ok(!cloud().f.includes('Higjiene'), '3. "Higjiene" mbetet e fshirë', cloud().f);
  ok(await prit(() => kaFolder(A, 'Pije')) && await prit(() => kaFolder(Bp, 'Pije')), '3. A dhe B: "Pije" u kthye');
  ok(await K.evaluate(() => document.getElementById('opsKopja').hidden) && !(await lokale(K)).k, '3. K: karta dhe kopja u hoqën');
  ok(/U rikthyen: 1 folder \("Pije"\) dhe 1 produkt\./.test(await K.textContent('#toastTekst')), '3. K: njoftimi "U rikthyen"', await K.textContent('#toast'));

  // 4. "Hiq kopjen" (telefoni): B fshin "Fresh" pasi A e ka prekur (riemërtim → ndryshuarSe)
  await A.evaluate(() => { const o = document.getElementById('dlgOpsione'); if (o && o.classList.contains('hapur')) document.getElementById('btnOpsione').click(); });
  F.S.docs.set('dyqane/u5', Object.assign({}, F.S.docs.get('dyqane/u5'), { foldera: F.S.docs.get('dyqane/u5').foldera.map(f => f.id === 'fresh' ? Object.assign({}, f, { emri: 'Fresh 2', ndryshuarSe: Date.now() }) : f) }));
  for (const p of [A, Bp, K]) await p.evaluate(() => window.__fs('resync')).catch(() => {});
  ok(await prit(() => kaFolder(A, 'Fresh 2')) && await prit(() => kaFolder(Bp, 'Fresh 2')), '4. "Fresh 2" (i riemërtuar) te A dhe B');
  await Bp.evaluate(() => { const o = document.getElementById('dlgOpsione'); if (o && o.classList.contains('hapur')) document.getElementById('btnOpsione').click(); });
  await Bp.evaluate(() => { const k = [...document.querySelectorAll('.folder-karta')].find(x => x.textContent.includes('Fresh 2')); k.querySelector('.folder-fshij').click(); });
  await Bp.waitForTimeout(300); await Bp.click('#konfPo');
  ok(await prit(async () => !(await kaFolder(A, 'Fresh 2'))), '4. A: "Fresh 2" iku');
  await A.click('#btnOpsione'); await A.waitForTimeout(300); await A.click('#tabLlogaria'); await A.waitForTimeout(400);
  const t4 = await A.textContent('#llKopjaTeksti');
  ok(!(await A.evaluate(() => document.getElementById('llKopjaSeksion').hidden)) && /^1 folder \("Fresh 2"\) u fshi nga një pajisje tjetër\..*"Rikthe" e kthen në krejt pajisjet\.$/.test(t4), '4. A: karta në njëjës ("u fshi", "e kthen")', t4);
  await A.click('#llKopjaHiq'); await A.waitForTimeout(300); await A.click('#konfPo'); await A.waitForTimeout(300);
  ok(await A.evaluate(() => document.getElementById('llKopjaSeksion').hidden) && !(await lokale(A)).k, '4. A: "Hiq kopjen" e heq kartën dhe kopjen');
  ok(!cloud().f.includes('Fresh 2'), '4. "Fresh 2" mbetet i fshirë (Hiq s\'kthen asgjë)', cloud().f);

  // 5. Ndërrimi i llogarisë e fshin kopjen (bashkë me të dhënat e tjera)
  const K5 = (await lokale(K)).k;
  ok(K5 && K5.foldera.some(f => f.emri === 'Fresh 2'), '5. K: ka kopje para ndërrimit', K5 && K5.foldera.map(f => f.emri));
  F.S.docs.set('perdoruesit/u9', { perdoruesi: 'tjetri', kycurSe: Date.now() });
  F.faqet.set(K, { uid: 'u9', email: 'tjetri@stoku-app.local' });
  await K.evaluate(() => window.__fsNdrroLlogarine('u9', 'tjetri@stoku-app.local'));
  await K.waitForTimeout(4500);
  ok(!(await lokale(K)).k, '5. K: pas ndërrimit të llogarisë s\'ka më kopje', (await lokale(K)).k);

  ok(!gab.length, 'pa gabime JavaScript', gab);
  await b.close();
  console.log(g ? '✘ ' + g + ' gabime' : '✔ Krejt në rregull');
  process.exit(g ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
