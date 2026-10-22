// v246: dalja nga grupi. Admini i vetëm (me kolegë) largohet: admin bëhet kolegu që ka hyrë më herët në grup (me njoftim);
// pas rifreskimit s'kthehet në grup; anëtari i zakonshëm largohet (grupi mbetet); i fundit largohet: grupi fshihet krejt
// (edhe nga lista publike); tel + PC
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const PUSH = 'https://stoku-push.mendurb.workers.dev';
const BAZA = process.env.STOKU_B || 'http://127.0.0.1:8765';
const prit = (fn, ms = 8000) => new Promise(async z => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return z(true); await new Promise(r => setTimeout(r, 100)); } z(false); });
(async () => {
  const F = krijoFirestore({ rregullat: 'reja' });
  const t = Date.now(), D = 864e5;
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: t, grupi: 'g1' });
  F.S.docs.set('perdoruesit/u2', { perdoruesi: 'besa', kycurSe: t, grupi: 'g1' });
  F.S.docs.set('perdoruesit/u4', { perdoruesi: 'vjosa', kycurSe: t, grupi: 'g1' });
  F.S.docs.set('grupet/g1', { emri: 'Market Agimi', pronarUid: 'u1', pronarEmri: 'agim', krijuarSe: t - 5 * D });
  F.S.docs.set('grupet/g1/anetaret/u1', { emri: 'agim', roli: 'pronar', hyriSe: t - 5 * D });
  F.S.docs.set('grupet/g1/anetaret/u2', { emri: 'besa', roli: 'anetar', hyriSe: t - 2 * D });
  F.S.docs.set('grupet/g1/anetaret/u4', { emri: 'vjosa', roli: 'anetar', hyriSe: t - 4 * D }); // ka hyrë para besës
  F.S.docs.set('grupet_publike/g1', { emri: 'Market Agimi', pronarEmri: 'agim', ndryshuarSe: t });
  F.S.docs.set('grupet/g1/feed/f1', { lloji: 'afate-te-reja', n: 2, uid: 'u2', emri: 'besa', koha: t - 1000 });
  const doc = k => F.S.docs.get(k);
  const keys = pre => [...F.S.docs.keys()].filter(k => k.startsWith(pre));
  const b = await chromium.launch();
  async function faqe(uid, emri, pc) {
    const ctx = await b.newContext(pc ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' }
      : { userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith(BAZA), r => r.abort());
    await F.lidh(ctx, uid, emri + '@stoku-app.local', pc ? 'pc' : 'tel');
    await ctx.route(u => u.href.startsWith(PUSH), r => r.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, fotot: {} }) }));
    const p = await ctx.newPage(); p.__gab = [];
    p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto(BAZA + '/' + (pc ? 'pc.html#/ekipa/anetaret' : 'index.html'));
    await p.waitForTimeout(2500);
    return p;
  }
  const toast = p => p.evaluate(() => document.getElementById('toast').textContent);
  const kolegetTel = async p => { await p.click('#btnEkipi'); await p.waitForTimeout(800); await p.click('#ekMenu [data-n="anetaret"]').catch(() => {}); await p.waitForTimeout(1200); };

  // 1. agim (tel): admini i vetëm, me dy kolegë → largohet, admin bëhet vjosa
  const vjosa = await faqe('u4', 'vjosa', true);
  ok(await prit(async () => { const x = await vjosa.textContent('#ekTabAnetaret'); return /agim/.test(x) && /besa/.test(x); }), '1. vjosa (PC) i sheh kolegët', await vjosa.textContent('#ekTabAnetaret'));
  ok(await vjosa.evaluate(() => document.getElementById('ekFtoKarta').classList.contains('fsheh')), '1. vjosa ende jo admine: pa "Fto një shok"');
  const agim = await faqe('u1', 'agim', false);
  await kolegetTel(agim);
  ok(await agim.isVisible('#ekLargohu'), '1. agim: "Largohu nga grupi"');
  await agim.click('#ekLargohu'); await agim.waitForTimeout(400);
  const pyetja = (await agim.textContent('#dlgKonfirmo')).replace(/\s+/g, ' ');
  ok(/admin bëhet vjosa/.test(pyetja) && !/admini i vetëm/.test(pyetja), '1. pyetja: "admin bëhet vjosa" (ka hyrë më herët se besa)', pyetja.slice(0, 200));
  await agim.click('#konfPo');
  ok(await prit(() => !doc('grupet/g1/anetaret/u1')), '1. agim u largua nga grupi');
  ok(doc('grupet/g1/anetaret/u4') && doc('grupet/g1/anetaret/u4').roli === 'pronar' && doc('grupet/g1/anetaret/u2').roli === 'anetar', '1. vjosa u bë admine, besa mbetet anëtare', [doc('grupet/g1/anetaret/u4'), doc('grupet/g1/anetaret/u2')]);
  ok(await prit(() => doc('perdoruesit/u1').grupi === '') && !!doc('grupet/g1') && keys('grupet/g1/feed/').length === 1, '1. treguesi i agimit u pastrua; grupi dhe aktiviteti mbeten', doc('perdoruesit/u1'));
  const nj = keys('perdoruesit/u4/njoftimet/').map(doc);
  ok(nj.some(x => x.lloji === 'admin-i-ri' && x.grupi === 'g1' && x.emri === 'agim' && x.uid === 'u1'), '1. vjosa mori njoftimin "admin-i-ri"', nj);
  ok(await vjosa.evaluate(() => window.StokuEkipa.tekstiNjoftimit({ lloji: 'admin-i-ri', emri: 'agim' })) === 'agim u largua nga grupi dhe tash ti je admini i grupit.', '1. teksti i njoftimit');
  ok(await prit(async () => /U largove nga grupi "Market Agimi"/.test(await toast(agim))), '1. agim: "U largove nga grupi…"', await toast(agim));
  // vjosa e sheh veten admine (pa rifreskim): "Fto një shok" del
  ok(await prit(() => vjosa.evaluate(() => !document.getElementById('ekFtoKarta').classList.contains('fsheh'))), '1. vjosa (PC): tash admine, "Fto një shok në grup"');
  ok(await prit(() => !!doc('grupet_publike/g1') && doc('grupet_publike/g1').pronarEmri === 'vjosa', 10000), '1. lista publike: admini tash vjosa', doc('grupet_publike/g1'));

  // 2. agim rifreskon faqen: s'kthehet në grup
  await agim.reload(); await agim.waitForTimeout(2500);
  await agim.click('#btnEkipi'); await agim.waitForTimeout(1500);
  ok(await agim.isVisible('#ekGrupiKerko') && /Hyr në një grup/.test(await agim.textContent('#ekipiLista')), '2. pas rifreskimit: agim te "Hyr në një grup"');
  await agim.waitForTimeout(1500);
  ok(!doc('grupet/g1/anetaret/u1') && doc('perdoruesit/u1').grupi === '', '2. agim s\'u rikthye në grup', doc('perdoruesit/u1'));

  // 3. besa (tel, anëtare e zakonshme) largohet: grupi mbetet me vjosën
  const besa = await faqe('u2', 'besa', false);
  await kolegetTel(besa);
  await besa.click('#ekLargohu'); await besa.waitForTimeout(400);
  const pyetjaB = (await besa.textContent('#dlgKonfirmo')).replace(/\s+/g, ' ');
  ok(!/admin bëhet/.test(pyetjaB) && !/fshihet/.test(pyetjaB), '3. besa: pyetja e zakonshme (pa admin të ri, pa fshirje)', pyetjaB.slice(0, 200));
  await besa.click('#konfPo');
  ok(await prit(() => !doc('grupet/g1/anetaret/u2')) && !!doc('grupet/g1') && doc('grupet/g1/anetaret/u4').roli === 'pronar', '3. besa u largua, grupi mbetet');

  // 4. vjosa (PC), e fundit në grup: largohet → grupi fshihet krejt
  ok(await prit(async () => !/besa/.test(await vjosa.textContent('#ekTabAnetaret'))), '4. vjosa: besa s\'është më te kolegët');
  await vjosa.click('#ekLargohu'); await vjosa.waitForTimeout(400);
  const pyetjaV = await vjosa.textContent('#kfTekst');
  ok(/Je i fundit në grup: grupi fshihet komplet/.test(pyetjaV), '4. pyetja: "Je i fundit në grup: grupi fshihet komplet"', pyetjaV);
  await vjosa.click('#kfPo');
  ok(await prit(() => !doc('grupet/g1')), '4. grupi u fshi');
  ok(!keys('grupet/g1/').filter(k => !/\/kujtesa\//.test(k)).length && !doc('grupet_publike/g1') && doc('perdoruesit/u4').grupi === '', '4. pa anëtarë, aktivitet, listë publike; treguesi i vjosës bosh', keys('grupet/g1'));
  await vjosa.reload(); await vjosa.waitForTimeout(3000);
  ok(!doc('grupet/g1') && !keys('grupet/g1/anetaret/').length && doc('perdoruesit/u4').grupi === '', '4. pas rifreskimit grupi s\'rikrijohet');

  ok(!agim.__gab.length && !besa.__gab.length && !vjosa.__gab.length, '5. pa gabime JS', [agim.__gab, besa.__gab, vjosa.__gab]);
  await b.close();
  console.log(g ? 'GABIME: ' + g : 'Krejt në rregull');
  process.exit(g ? 1 : 0);
})();
