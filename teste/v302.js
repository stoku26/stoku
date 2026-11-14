// v302 (pronari): "qdo perdorues mu identifiku permes uid". Administratori njihet nga uid-ja (s'ndryshon kurrë), jo nga emri
// i përdoruesit; ftesat në grup i lidhen uid-së së personit (emrat/{emri} → uid), që një llogari tjetër me të njëjtin emër
// (pas ndryshimit të emrit) s'e merr dot ftesën. Firestore i rremë me adminVetemUid (si rregullat e reja, pa "admin prove").
const { chromium } = require('./pw.js');
const { krijoFirestore, ADMIN_UID } = require('./fs-server.js');
const fsN = require('fs');
const R = __dirname + '/../';
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const PUSH = 'https://stoku-push.mendurb.workers.dev';
const BAZA = process.env.STOKU_B || 'http://127.0.0.1:8765';
const prit = (fn, ms = 8000) => new Promise(async z => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return z(true); await new Promise(r => setTimeout(r, 100)); } z(false); });
(async () => {
  // 0. Kodi: asnjë kontroll administratori sipas emrit
  const lexo = f => fsN.readFileSync(R + f, 'utf8');
  const ek = lexo('ekipa.js'), tel = lexo('app-tel.js'), pc = lexo('app-pc.js');
  ok(ek.includes("var ADMIN_UID = '" + ADMIN_UID + "'") && !/ADMIN_EMRI/.test(ek) && !/'mendurberisha'/.test(ek), '0. ekipa.js: ADMIN_UID, pa emrin');
  ok(!/'mendurberisha'/.test(tel) && !/'mendurberisha'/.test(pc) && /eshteUidAdmin\(u\.uid\)/.test(tel) && /eshteUidAdmin\(u\.uid\)/.test(pc), '0. app-tel/app-pc: administratori sipas uid-së');
  const wp = lexo('worker/stoku-push.js'), wa = lexo('worker/stoku-afatet.js');
  ok(wp.includes("const ADMIN_UID = '" + ADMIN_UID + "'") && !/llogariaSipasEmrit\(at, ADMINI\)/.test(wp) && /VERSIONI_WORKER = (17[0-9])/.test(wp), '0. stoku-push ≥ 170: administratori sipas uid-së');
  ok(wa.includes("const ADMIN_UID = '" + ADMIN_UID + "'") && /perdoruesi\.uid === ADMIN_UID/.test(wa) && !/ADMINI_EMAIL/.test(wa), '0. stoku-afatet v3: administratori sipas uid-së');
  const kt = lexo('vendas/logjika/src/main/kotlin/site/stoku/logjika/Lejet.kt');
  ok(kt.includes('const val ADMIN_UID = "' + ADMIN_UID + '"') && !/"mendurberisha"/.test(kt), '0. Android (Lejet.kt): ADMIN_UID');
  const sh = lexo('SHENIME.md'), rr = sh.slice(sh.indexOf("rules_version = '2';", sh.indexOf('function eshteAdmin() {') - 400));
  ok(/request\.auth\.uid == 'USfaW6Lbm3dbxEF95aKMKadIaok1'/.test(rr) && !/token\.email == 'mendurberisha/.test(rr.slice(0, 3000)) && /match \/emrat\/\{em\}/.test(rr), '0. rregullat (SHENIME): eshteAdmin sipas uid-së + emrat');

  const F = krijoFirestore({ rregullat: 'reja', adminVetemUid: true });
  const t = Date.now();
  F.S.docs.set('perdoruesit/' + ADMIN_UID, { perdoruesi: 'shefi', kycurSe: t });
  F.S.docs.set('perdoruesit/uM', { perdoruesi: 'mendurberisha', kycurSe: t });
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: t, grupi: 'g1' });
  F.S.docs.set('perdoruesit/u2', { perdoruesi: 'besa', kycurSe: t, grupi: '' });
  F.S.docs.set('grupet/g1', { emri: 'Market Agimi', pronarUid: 'u1', pronarEmri: 'agim', krijuarSe: t - 864e5 });
  F.S.docs.set('grupet/g1/anetaret/u1', { emri: 'agim', roli: 'pronar', hyriSe: t - 864e5 });
  const doc = k => F.S.docs.get(k);
  const b = await chromium.launch();
  async function faqe(uid, emri, pc) {
    const ctx = await b.newContext(pc ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' }
      : { userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith(BAZA), r => r.abort());
    await F.lidh(ctx, uid, emri + '@stoku-app.local', pc ? 'pc' : 'tel');
    await ctx.route(u => u.href.startsWith(PUSH), r => r.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, fotot: {} }) }));
    const p = await ctx.newPage(); p.__gab = [];
    p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto(BAZA + '/' + (pc ? 'pc.html' : 'index.html'));
    await p.waitForTimeout(2500);
    return p;
  }
  const listo = p => p.evaluate(async () => { try { const s = await window.__fsTest.getDocs(window.__fsTest.collection(null, 'perdoruesit')); return 'lejohet:' + s.size; } catch (e) { return e.code || e.message; } });

  // 1. Administratori me emër tjetër ("shefi") por me uid-në e administratorit: njihet si administrator (PC + tel)
  const shefi = await faqe(ADMIN_UID, 'shefi', true);
  ok(await prit(() => shefi.evaluate(() => !document.getElementById('opsSkedaPerdoruesit').hidden)), '1. PC: "shefi" (uid-ja e administratorit) e sheh "Përdoruesit"');
  ok(/^lejohet/.test(await listo(shefi)), '1. rregullat: lista e llogarive lejohet', await listo(shefi));
  const shefiT = await faqe(ADMIN_UID, 'shefi', false);
  ok(await prit(() => shefiT.evaluate(() => !document.getElementById('tabPerdoruesit').hidden)), '1. tel: "Përdoruesit" te Cilësimet');

  // 2. Llogaria me emrin "mendurberisha" por me uid tjetër: s'është administrator
  const mend = await faqe('uM', 'mendurberisha', true);
  await mend.waitForTimeout(1500);
  ok(await mend.evaluate(() => document.getElementById('opsSkedaPerdoruesit').hidden), '2. PC: emri "mendurberisha" me uid tjetër: pa "Përdoruesit"');
  ok(await listo(mend) === 'permission-denied', '2. rregullat: lista e llogarive s\'lejohet', await listo(mend));
  ok(await mend.evaluate(() => window.StokuEkipa.eshteUidAdmin('uM') === false && window.StokuEkipa.eshteUidAdmin(window.StokuEkipa.ADMIN_UID) === true), '2. eshteUidAdmin');

  // 3. emrat/{emri} → uid: secili regjistrohet kur hyn; s'mund ta zërë emrin e tjetrit
  ok(await prit(() => doc('emrat/shefi') && doc('emrat/shefi').uid === ADMIN_UID && doc('emrat/mendurberisha') && doc('emrat/mendurberisha').uid === 'uM'), '3. emrat: shefi + mendurberisha', [doc('emrat/shefi'), doc('emrat/mendurberisha')]);
  const zene = await mend.evaluate(async () => { try { await window.__fsTest.setDoc(window.__fsTest.doc(null, 'emrat', 'agim'), { uid: 'uM', ndryshuarSe: 1 }); return 'lejohet'; } catch (e) { return e.code; } });
  ok(zene === 'permission-denied', '3. s\'e regjistron emrin e tjetrit', zene);
  const lista = await mend.evaluate(async () => { try { await window.__fsTest.getDocs(window.__fsTest.collection(null, 'emrat')); return 'lejohet'; } catch (e) { return e.code; } });
  ok(lista === 'permission-denied', '3. emrat s\'listohen (vetëm sipas emrit)', lista);

  // 4. Agimi (pronar) e fton "besa" pasi besa e hap Stoku-n → ftesa sipas uid-së
  const agim = await faqe('u1', 'agim', true);
  await agim.waitForTimeout(800);
  ok(doc('emrat/agim') && doc('emrat/agim').uid === 'u1', '4. agimi te emrat');
  // besa hap Stoku-n → emrat/besa; ftesa e re (pas saj) sipas uid-së
  const besa = await faqe('u2', 'besa', true);
  ok(await prit(() => doc('emrat/besa') && doc('emrat/besa').uid === 'u2'), '4. besa te emrat');
  const r4 = await agim.evaluate(() => window.__stokuEkipaK.ftoNeGrup('Besa'));
  await agim.waitForTimeout(800);
  ok(r4.ok && doc('ftesat/g1_u2') && doc('ftesat/g1_u2').uid === 'u2' && doc('ftesat/g1_u2').perdoruesi === 'besa' && !doc('ftesat/g1_besa'), '4. ftesa sipas uid-së: ftesat/g1_u2', [r4, doc('ftesat/g1_u2')]);
  ok(await prit(async () => (await besa.evaluate(() => window.__stokuEkipaK.ftesatEMia().map(f => f.id))).join() === 'g1_u2'), '4. besa e sheh ftesën');

  // 5. Besa ndryshon emrin në "besa2"; një llogari e re merr emrin "besa": s'e sheh/pranon ftesën e besës
  await besa.evaluate(() => window.__fsNdrroLlogarine('u2', 'besa2@stoku-app.local'));
  F.faqet.set(besa, { uid: 'u2', email: 'besa2@stoku-app.local' }); // tokeni i ri (Firebase) mban emrin e ri
  await besa.evaluate(() => window.__stokuEkipaK.pasNdryshimitTeEmrit());
  ok(await prit(() => doc('emrat/besa2') && doc('emrat/besa2').uid === 'u2' && !doc('emrat/besa')), '5. emri i ri: emrat/besa2, emrat/besa u fshi', [doc('emrat/besa2'), doc('emrat/besa')]);
  ok(await prit(async () => (await besa.evaluate(() => window.__stokuEkipaK.ftesatEMia().map(f => f.id))).join() === 'g1_u2'), '5. besa (tash besa2) e sheh ende ftesën');
  F.S.docs.set('perdoruesit/u9', { perdoruesi: 'besa', kycurSe: t });
  const tjetra = await faqe('u9', 'besa', true);
  await tjetra.waitForTimeout(1000);
  ok(doc('emrat/besa') && doc('emrat/besa').uid === 'u9', '5. llogaria e re "besa" e merr emrin e lirë');
  ok((await tjetra.evaluate(() => window.__stokuEkipaK.ftesatEMia().length)) === 0, '5. llogaria e re "besa" s\'e sheh ftesën e besës');
  const vjedhja = await tjetra.evaluate(async () => {
    const fs = window.__fsTest, b = fs.writeBatch(null);
    b.set(fs.doc(null, 'grupet', 'g1', 'anetaret', 'u9'), { emri: 'besa', roli: 'anetar', hyriSe: Date.now() });
    b.delete(fs.doc(null, 'ftesat', 'g1_u2'));
    try { await b.commit(); return 'lejohet'; } catch (e) { return e.code; }
  });
  ok(vjedhja === 'permission-denied' && !doc('grupet/g1/anetaret/u9'), '5. s\'mund të hyjë me ftesën e besës', vjedhja);
  const r5 = await besa.evaluate(() => { const f = window.__stokuEkipaK.ftesatEMia()[0]; return window.__stokuEkipaK.pranoFtesen(f); });
  await besa.waitForTimeout(1000);
  ok(r5 && r5.ok && doc('grupet/g1/anetaret/u2') && !doc('ftesat/g1_u2'), '5. besa2 (uid u2) e pranon ftesën', r5);

  // 6. Kërkesa (kerkesat_grupi) → pranimi krijon ftesë sipas uid-së
  F.S.docs.set('perdoruesit/u5', { perdoruesi: 'zana', kycurSe: t, grupi: '' });
  F.S.docs.set('kerkesat_grupi/g1_u5', { gid: 'g1', grupiEmri: 'Market Agimi', uid: 'u5', emri: 'zana', koha: Date.now() });
  const r6 = await agim.evaluate(() => window.__stokuCloud.ekipa.pranoKerkesen({ id: 'g1_u5', gid: 'g1', uid: 'u5', emri: 'zana' }, 'Market Agimi'));
  ok(r6.ok && doc('ftesat/g1_u5') && doc('ftesat/g1_u5').uid === 'u5' && !doc('kerkesat_grupi/g1_u5'), '6. pranimi i kërkesës: ftesat/g1_u5 (uid)', r6);

  // 7. Rregullat para v302 (pa emrat): v303 s'dërgon më ftesë sipas emrit; pranimi i kërkesës punon (ka uid-në)
  const F2 = krijoFirestore({ rregullat: 'reja', adminVetemUid: true });
  F2.S.paEmrat = true;
  F2.S.docs.set('grupet/g1', { emri: 'Market Agimi', pronarUid: 'u1', pronarEmri: 'agim', krijuarSe: t });
  F2.S.docs.set('grupet/g1/anetaret/u1', { emri: 'agim', roli: 'pronar', hyriSe: t });
  F2.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: t, grupi: 'g1' });
  const ctx2 = await b.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  await ctx2.route(u => !u.href.startsWith(BAZA), r => r.abort());
  await F2.lidh(ctx2, 'u1', 'agim@stoku-app.local', 'pc');
  const agim2 = await ctx2.newPage(); await agim2.goto(BAZA + '/pc.html'); await agim2.waitForTimeout(2500);
  const r7 = await agim2.evaluate(() => window.__stokuEkipaK.ftoNeGrup('drini'));
  ok(!r7.ok && !F2.S.docs.get('ftesat/g1_drini'), '7. v303: pa emrat s\'ka më ftesë sipas emrit', r7);
  F2.S.docs.set('kerkesat_grupi/g1_u5', { gid: 'g1', grupiEmri: 'Market Agimi', uid: 'u5', emri: 'zana', koha: Date.now() });
  const r7b = await agim2.evaluate(() => window.__stokuCloud.ekipa.pranoKerkesen({ id: 'g1_u5', gid: 'g1', uid: 'u5', emri: 'zana' }, 'Market Agimi'));
  ok(r7b.ok && F2.S.docs.get('ftesat/g1_u5') && F2.S.docs.get('ftesat/g1_u5').uid === 'u5', '7. pranimi i kërkesës: sipas uid-së (rregullat e reja të ftesave)', r7b);

  const gab = [shefi, shefiT, mend, agim, besa, tjetra, agim2].flatMap(p => p.__gab || []);
  ok(!gab.length, '8. pa gabime JS', gab);
  await b.close();
  console.log(g ? g + ' GABIME' : 'KREJT OK');
  process.exit(g ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
