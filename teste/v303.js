// v303 (pronari): "krejt njoftimet mu kon push" + ftesat vetëm sipas uid-së. Web: ftesa në grup dhe kërkesa për t'u futur
// thërrasin Worker-in (/grupi) për push; ftesa pa emrat/{emri} s'dërgohet më sipas emrit ("pa-llogari"). Kodi: Android dërgon
// push për çdo njoftim të zilës (njoftimMePush, /kerkese, /grupi), Worker 171 (/grupi, "admin-i-ri"), rregullat pa ftesa sipas emrit.
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
const fsN = require('fs');
const R = __dirname + '/../';
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const PUSH = 'https://stoku-push.mendurb.workers.dev';
const BAZA = process.env.STOKU_B || 'http://127.0.0.1:8765';
const prit = (fn, ms = 8000) => new Promise(async z => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return z(true); await new Promise(r => setTimeout(r, 100)); } z(false); });
(async () => {
  // 0. Kodi
  const lexo = f => fsN.readFileSync(R + f, 'utf8');
  const wp = lexo('worker/stoku-push.js'), kt = lexo('vendas/app/src/main/java/site/stoku/vendas/Grupi.kt'), push = lexo('vendas/app/src/main/java/site/stoku/vendas/Push.kt');
  ok(/VERSIONI_WORKER = 171/.test(wp) && /rruga === '\/grupi'/.test(wp) && /lloji === 'admin-i-ri'/.test(wp), '0. Worker 171: /grupi + teksti "admin-i-ri"');
  ok(/fun njoftoKerkese/.test(push) && /fun njoftoGrupin/.test(push), '0. Android Push: /kerkese + /grupi');
  const nMePush = (kt.match(/njoftimMePush\(/g) || []).length;
  ok(nMePush >= 6 && /Push\.njoftoKerkese\(id, g\)/.test(kt) && (kt.match(/Push\.njoftoGrupin\(/g) || []).length === 3, '0. Android Grupi: push për çdo njoftim (hequr, admin-afat, heqje, admin-i-ri, lajmerim), kërkesat, ftesat', nMePush);
  ok(!/whereEqualTo\("perdoruesi"/.test(kt.replace(/fshijTeGjitha[^\n]*/g, '')) && /"pa-llogari"/.test(kt), '0. Android: ftesat vetëm sipas uid-së');
  const sh = lexo('SHENIME.md'), rr = sh.slice(sh.indexOf('match /ftesat/{id}'), sh.indexOf('match /emrat/{em}'));
  ok(rr && !/perdoruesi == emriIm\(\)/.test(rr) && /request\.resource\.data\.uid is string/.test(rr), '0. rregullat: ftesat pa emrin');
  const rregullat = sh.slice(sh.indexOf("rules_version = '2';", sh.indexOf('function eshteAdmin() {') - 400));
  ok(!/ftesat\/\$\(g \+ '_' \+ emriIm\(\)\)/.test(rregullat.slice(0, rregullat.indexOf('```'))), '0. rregullat: hyrja në grup pa ftesën sipas emrit');
  const cl = lexo('CLAUDE.md');
  ok(/duli96/.test(cl) && /USfaW6Lbm3dbxEF95aKMKadIaok1/.test(cl), '0. CLAUDE.md: administratori duli96 (uid)');

  const F = krijoFirestore({ rregullat: 'reja' });
  const t = Date.now();
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: t, grupi: 'g1' });
  F.S.docs.set('perdoruesit/u2', { perdoruesi: 'besa', kycurSe: t, grupi: '' });
  F.S.docs.set('perdoruesit/u5', { perdoruesi: 'zana', kycurSe: t, grupi: '' });
  F.S.docs.set('grupet/g1', { emri: 'Market Agimi', pronarUid: 'u1', pronarEmri: 'agim', krijuarSe: t - 864e5 });
  F.S.docs.set('grupet/g1/anetaret/u1', { emri: 'agim', roli: 'pronar', hyriSe: t - 864e5 });
  F.S.docs.set('grupet_publike/g1', { emri: 'Market Agimi', pronarEmri: 'agim', ndryshuarSe: t });
  const doc = k => F.S.docs.get(k);
  const thirrjet = [];
  const b = await chromium.launch();
  async function faqe(uid, emri) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith(BAZA), r => r.abort());
    await F.lidh(ctx, uid, emri + '@stoku-app.local', 'pc');
    await ctx.route(u => u.href.startsWith(PUSH), r => {
      const u = new URL(r.request().url());
      if (r.request().method() === 'POST' && u.pathname !== '/foto') { try { thirrjet.push({ nga: uid, rruga: u.pathname, trup: JSON.parse(r.request().postData() || '{}') }); } catch (e) { /* ok */ } }
      r.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, fotot: {} }) });
    });
    const p = await ctx.newPage(); p.__gab = [];
    p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto(BAZA + '/pc.html#/ekipa/anetaret');
    await p.waitForTimeout(2500);
    return p;
  }
  const grupi = () => thirrjet.filter(x => x.rruga === '/grupi').map(x => x.nga + ':' + x.trup.lloji + ':' + x.trup.id);

  // 1. Agimi fton "askush" (s'ka llogari / s'e ka hapur Stoku-n): s'ka ftesë sipas emrit, mesazhi i qartë
  const agim = await faqe('u1', 'agim');
  await agim.fill('#ekFtoEmri', 'askush'); await agim.click('#ekFtoBtn'); await agim.waitForTimeout(1200);
  ok(!Object.keys(Object.fromEntries(F.S.docs)).some(k => k.startsWith('ftesat/')) && /S'u gjet asnjë llogari/.test(await agim.textContent('#toast')), '1. pa llogari: pa ftesë, mesazhi "S\'u gjet asnjë llogari"', await agim.textContent('#toast'));
  ok(!grupi().length, '1. pa push');

  // 2. Besa e hap Stoku-n (emrat/besa); agimi e fton → ftesat/g1_u2 + push /grupi ftese
  const besa = await faqe('u2', 'besa');
  ok(await prit(() => doc('emrat/besa') && doc('emrat/besa').uid === 'u2'), '2. besa te emrat');
  await agim.fill('#ekFtoEmri', 'besa'); await agim.click('#ekFtoBtn');
  ok(await prit(() => grupi().includes('u1:ftese:g1_u2')), '2. ftesa → push te besa (/grupi ftese g1_u2)', grupi());
  ok(doc('ftesat/g1_u2') && doc('ftesat/g1_u2').uid === 'u2', '2. ftesat/g1_u2 (uid)');

  // 3. Zana kërkon të hyjë te "Market Agimi" → push te pronari; agimi e pranon → push te zana (ftesa)
  const zana = await faqe('u5', 'zana');
  const rK = await zana.evaluate(() => window.__stokuCloud.ekipa.dergoKerkesen({ id: 'g1', emri: 'Market Agimi' }));
  ok(rK.ok && doc('kerkesat_grupi/g1_u5') && await prit(() => grupi().includes('u5:kerkese:g1_u5')), '3. kërkesa → push te pronari (/grupi kerkese g1_u5)', [rK, grupi()]);
  const rP = await agim.evaluate(() => window.__stokuCloud.ekipa.pranoKerkesen({ id: 'g1_u5', gid: 'g1', uid: 'u5', emri: 'zana' }, 'Market Agimi'));
  const pushP = await prit(() => grupi().includes('u1:ftese:g1_u5'));
  ok(rP.ok && pushP, '3. pranimi → push te zana (/grupi ftese g1_u5)', [rP, grupi(), thirrjet.filter(x => x.nga === 'u1').map(x => x.rruga)]);

  // 4. Ftesa sipas emrit (e vjetër, pa uid) s'shfaqet më te besa dhe s'e fut dot në grup
  F.S.docs.set('ftesat/g1_besa', { gid: 'g1', grupiEmri: 'Market Agimi', perdoruesi: 'besa', ngaUid: 'u1', ngaEmri: 'agim', koha: Date.now() });
  await besa.waitForTimeout(800);
  const ftB = await besa.evaluate(() => window.__stokuEkipaK.ftesatEMia().map(f => f.id));
  ok(ftB.join() === 'g1_u2', '4. besa sheh vetëm ftesën sipas uid-së', ftB);

  // 5. Njoftimet e zilës (p.sh. "Njoftim për grupin") thërrasin /njoftim (push) si më parë
  const rB = await besa.evaluate(() => { const f = window.__stokuEkipaK.ftesatEMia()[0]; return window.__stokuEkipaK.pranoFtesen(f); });
  ok(rB && rB.ok && doc('grupet/g1/anetaret/u2'), '5. besa e pranon ftesën', rB);
  await agim.waitForTimeout(1000);
  thirrjet.length = 0;
  await agim.evaluate(() => window.__stokuEkipaK.lajmeroEkipen && window.__stokuEkipaK.lajmeroEkipen('Nesër inventar'));
  ok(await prit(() => thirrjet.some(x => x.rruga === '/njoftim' && x.trup.per === 'u2')), '5. "Njoftim për grupin" → push (/njoftim) te besa', thirrjet.filter(x => x.rruga === '/njoftim').map(x => x.nga + '>' + JSON.stringify(x.trup)));

  const gab = [agim, besa, zana].flatMap(p => p.__gab || []);
  ok(!gab.length, '6. pa gabime JS', gab);
  await b.close();
  console.log(g ? g + ' GABIME' : 'KREJT OK');
  process.exit(g ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
