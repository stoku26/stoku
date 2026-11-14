// v304 (pronari): "Detyroj njoftimet mi aktivizu ne android app edhe web app tel. Ndersa ne pc jo. Vetem pasi dikush kyqet
// ne llogari, nese osht si vizitor mos e detyro" + "njoftimin ... brenda 30 diteve hiqe krejt, leje veq ato ditor per ato
// produkte qka kan skadu ... edhe ato qka skadojn sot". Web tel: dritarja e njoftimeve s'mbyllet (pa "Jo tani", pa "mbrapa")
// derisa njoftimet të lejohen; njoftimet e afateve vetëm sot + të skaduarat. Kodi: Android (Hyrja 66), Worker 172.
const pw = require('./pw.js');
pw.meNjoftime = true; // ky test e provon vetë dritaren e njoftimeve (pa shenjën e testeve)
const { chromium } = pw;
const { krijoFirestore } = require('./fs-server.js');
const fsN = require('fs');
const R = __dirname + '/../';
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const BAZA = process.env.STOKU_B || 'http://127.0.0.1:8765';
const PUSH = 'https://stoku-push.mendurb.workers.dev';
(async () => {
  // 0. Kodi
  const lexo = f => fsN.readFileSync(R + f, 'utf8');
  const html = lexo('index.html'), tel = lexo('app-tel.js'), kt = lexo('vendas/app/src/main/java/site/stoku/vendas/ui/NjoftimetUI.kt'), wp = lexo('worker/stoku-push.js');
  ok(!/id="njJoTani"/.test(html) && !/30 ditë<\/b> deri në skadim/.test(html) && /skadojnë sot/.test(html), '0. index.html: pa "Jo tani", pa "30 ditë"');
  ok(/dlgNjoftimet'\) return; \/\/ v304/.test(tel) && !/eshteInstaluar/.test(tel), '0. app-tel: "mbrapa" s\'e mbyll; s\'kërkon më aplikacionin të instaluar');
  ok(!/dlgNjoftimet/.test(lexo('pc.html')) && !/pyetPerNjoftimet/.test(lexo('app-pc.js')), '0. PC: pa dritaren e detyrueshme');
  ok(/dismissOnBackPress = false, dismissOnClickOutside = false/.test(kt) && !/Buton\("Jo tani"/.test(kt) && !/30 ditë/.test(kt), '0. Android: dritarja s\'mbyllet, pa "Jo tani", pa "30 ditë"');
  ok(/VERSIONI_WORKER = 17[2-9]/.test(wp) && /skL = te\.filter\(a => a\.d < sot\)/.test(wp), '0. Worker 172: njoftimi ditor edhe me të skaduarat');

  const b = await chromium.launch();
  // 1. Njoftimet e afateve (njoftimet.js): vetëm sot + të skaduarat, pa 30 ditët
  {
    const ctx = await b.newContext({ serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith(BAZA), r => r.abort());
    const p = await ctx.newPage(); await p.goto(BAZA + '/privatesia.html');
    await p.addScriptTag({ url: BAZA + '/afatet.js' }); await p.addScriptTag({ url: BAZA + '/njoftimet.js' });
    const r = await p.evaluate(() => {
      const AF = window.StokuAfatet, d = n => { const x = new Date(); x.setDate(x.getDate() + n); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
      const l = [{ id: 'a', emri: 'Sot', data: d(0) }, { id: 'b', emri: 'Pas 5', data: d(5) }, { id: 'c', emri: 'Pas 30', data: d(30) }, { id: 'd', emri: 'Dje', data: d(-1) }, { id: 'e', emri: 'Hequr', data: d(-2), statusi: 'hequr' }];
      return window.StokuNjoftimet.teReja(l, {}, Date.now()).map(x => x.emri + ':' + x.lloji + ':' + x.teksti);
    });
    ok(r.length === 2 && r[0].startsWith('Dje:skaduar:Ka skaduar') && r[1].startsWith('Sot:afer:Skadon sot'), '1. vetëm "Dje" (e skaduar) dhe "Sot"; pa "Pas 5"/"Pas 30"/të hequrat', r);
    await ctx.close();
  }

  const F = krijoFirestore({ rregullat: 'reja' });
  const t = Date.now();
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: t });
  async function faqe(uid, emri, pc, leje) {
    const ctx = await b.newContext(pc ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' }
      : { userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    // headless s'i jep lejet e njoftimeve ("denied"): leja simulohet
    if (leje) await ctx.addInitScript(() => { try { Object.defineProperty(Notification, 'permission', { get: () => 'granted' }); } catch (e) { /* ok */ } });
    await ctx.route(u => !u.href.startsWith(BAZA), r => r.abort());
    await ctx.route(u => u.href.startsWith(PUSH), r => r.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, fotot: {} }) }));
    await F.lidh(ctx, uid, emri + '@stoku-app.local', pc ? 'pc' : 'tel');
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto(BAZA + '/' + (pc ? 'pc.html' : 'index.html')); await p.waitForTimeout(4500);
    return p;
  }
  const hapur = p => p.evaluate(() => !!document.getElementById('dlgNjoftimet') && document.getElementById('dlgNjoftimet').classList.contains('hapur'));

  // 2. Telefoni, me llogari, pa leje (headless: "denied" = të bllokuara): dritarja hapet, me udhëzimet, s'mbyllet
  const p = await faqe('u1', 'agim', false, false);
  ok(await hapur(p), '2. me llogari: dritarja e njoftimeve hapet vetë');
  ok(!(await p.$('#njJoTani')) && !(await p.isHidden('#njBllokuar')) && /kontrollo sërish/.test(await p.textContent('#njAktivizo')), '2. pa "Jo tani"; e bllokuar: udhëzimet + "I lejova, kontrollo sërish"', await p.textContent('#njAktivizo'));
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  await p.evaluate(() => history.back()); await p.waitForTimeout(500);
  await p.mouse.click(5, 5); await p.waitForTimeout(300);
  ok(await hapur(p), '2. Escape / "mbrapa" / prekja jashtë s\'e mbyllin');
  const z = await p.evaluate(() => getComputedStyle(document.getElementById('dlgNjoftimet')).zIndex);
  const zToast = await p.evaluate(() => getComputedStyle(document.getElementById('toast')).zIndex);
  ok(Number(z) > 30 && Number(z) < Number(zToast), '2. mbi çdo dritare (më e larta 30), nën toast-in (z-index ' + z + ' < ' + zToast + ')');
  await p.click('#njAktivizo'); await p.waitForTimeout(400);
  ok(await hapur(p) && /ende të bllokuara/.test(await p.textContent('#toast')), '2. e bllokuar: butoni e tregon mesazhin, dritarja mbetet', await p.textContent('#toast'));

  // 3. Me leje të dhënë: s'del (dhe shtypja e butonit pas lejes e mbyll)
  const p3 = await faqe('u1', 'agim', false, true);
  ok(!(await hapur(p3)), '3. njoftimet të lejuara: s\'ka dritare');

  // 4. Vizitori (pa llogari) dhe PC-ja: pa dritare
  {
    const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith(BAZA), r => r.abort());
    await ctx.addInitScript(() => {
      window.__stokuCloud = { authGati: true, perdoruesiAktual: () => null, token: async () => 't', merr: async () => ({ ok: true, gjendja: null }),
        bashkoDheRuaj: async fn => ({ ok: true, gjendja: fn(null) }), degjo: () => () => {}, degjoFletet: () => () => {}, dil: async () => {} };
    });
    const pv = await ctx.newPage(); await pv.goto(BAZA + '/index.html'); await pv.waitForTimeout(1500);
    await pv.click('#pkVizitor'); await pv.waitForTimeout(4000);
    ok(!(await hapur(pv)), '4. vizitori: pa dritaren e njoftimeve');
    await ctx.close();
  }
  const pp = await faqe('u1', 'agim', true, false);
  ok(!(await pp.$('#dlgNjoftimet')) || !(await hapur(pp)), '4. PC: pa dritaren e njoftimeve');

  const gab = [p, p3, pp].flatMap(x => x.__gab || []);
  ok(!gab.length, '5. pa gabime JS', gab);
  await b.close();
  console.log(g ? g + ' GABIME' : 'KREJT OK');
  process.exit(g ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
