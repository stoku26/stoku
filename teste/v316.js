// v316 / Android Hyrja 78 / ora (pronari): "kur osht i lidht me oren ... me te tregu me qfar ore osht e lidh e detaje tjera e jo me ta
// qit apet me u lidh me tjeter, edhe me mujt me shkput prej appit tel", "8 deri 30 dit bone te minimizume", "kur dikush po e ndrrojke
// username ... me ta qit userin e ri", "per tu hequr heke komplet ... met gjelbert bone me shkru". Worker 173 (te wp/ora-oret-prova.mjs).
const pw = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
const fs = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const R = __dirname + '/../', lx = f => fs.readFileSync(R + f, 'utf8');
const B = 'http://127.0.0.1:8765', PUSH = 'https://stoku-push.mendurb.workers.dev';
(async () => {
  // 0) statike: ora, Android, Worker
  const ma = lx('ora/app/src/main/java/site/stoku/ora/MainActivity.kt'), api = lx('ora/app/src/main/java/site/stoku/ora/Api.kt');
  ok(!/"PËR T'U HEQUR · /.test(ma) && /Asgjë për t'u hequr/.test(ma) && /ChipGrupi\("8 deri 30 ditë/.test(ma) && !/8 DERI 30 DITË · \$\{muaji\.size\}/.test(ma), '0. ora: pa "PËR T\'U HEQUR", rreshti i gjelbër, "8 deri 30 ditë" i mbyllur');
  ok(/put\("model", modeli\(ctx\)\)/.test(api) && /&v=\$\{versioni\(ctx\)\}&m=/.test(api) && /remove\("lista"\)\.remove\("krejt"\)/.test(api), '0. ora: modeli + versioni te serveri; 401 fshin edhe listën e plotë');
  ok(/fun OraELidhurKarta/.test(lx('vendas/app/src/main/java/site/stoku/vendas/ui/NjoftimetUI.kt')) && /suspend fun oretELidhura/.test(lx('vendas/app/src/main/java/site/stoku/vendas/Push.kt')) &&
    /Push\.oretELidhura\(\)/.test(lx('vendas/app/src/main/java/site/stoku/vendas/Llogaria.kt')), '0. Android: karta e orës, shkëputja, emri i ri pas ndryshimit');
  ok(/VERSIONI_WORKER = 173/.test(lx('worker/stoku-push.js')) && /'\/ora\/oret'/.test(lx('worker/stoku-push.js')) && /VERSIONI_WORKER: 173/.test(lx('ekipa.js')), '0. Worker 173 + ekipa.js');

  const F = krijoFirestore({ rregullat: 'reja' });
  F.S.docs.set('perdoruesit/uA', { perdoruesi: 'duli96', kycurSe: Date.now() });
  const b = await pw.chromium.launch();
  async function faqe(oret) {
    const thirrjet = [];
    const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith(B) && !u.href.startsWith(PUSH), r => r.abort());
    await ctx.route(u => u.href.startsWith(PUSH), r => {
      const u = new URL(r.request().url()); let t = {}; try { t = JSON.parse(r.request().postData() || '{}'); } catch (e) {}
      thirrjet.push(u.pathname + ' ' + JSON.stringify(t));
      const h = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
      if (u.pathname === '/ora/oret') return oret ? r.fulfill({ status: 200, headers: h, body: JSON.stringify({ ok: true, oret: oret() }) }) : r.fulfill({ status: 404, headers: h, body: '{"ok":false}' });
      if (u.pathname === '/ora/shkeput-tel') return r.fulfill({ status: 200, headers: h, body: '{"ok":true}' });
      return r.fulfill({ status: 200, headers: h, body: '{"ok":true}' });
    });
    await ctx.addInitScript(() => { try { Object.defineProperty(Notification, 'permission', { get: () => 'granted' }); localStorage.setItem('stoku:orari', JSON.stringify({ uid: 'uA', aktiv: true, ora: '08:00', koha: Date.now() })); } catch (e) {} });
    await F.lidh(ctx, 'uA', 'duli96@stoku-app.local', 'tel');
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto(B + '/index.html'); await p.waitForTimeout(3500);
    await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => { if (!d.classList.contains('faqe-e-plote')) d.classList.remove('hapur'); }));
    await p.click('#btnOpsione'); await p.waitForTimeout(300); await p.click('#tabOra'); await p.waitForTimeout(1200);
    return { p, ctx, thirrjet };
  }
  const gj = p => p.evaluate(() => ({ karta: !document.getElementById('oraLidhur').hidden, kodi: !document.getElementById('oraLidhKuti').hidden, tx: document.getElementById('oraLidhur').textContent }));
  // 1) ora e lidhur: karta me detajet, pa kutinë e kodit; emri i vjetër dërgohet te ora
  let lista = [{ id: 'abcdef0123456789', model: 'Galaxy Watch6 Classic', koha: Date.now() - 3 * 864e5, aktiv: Date.now() - 2 * 60000, v: 77, emri: 'mendurberisha' }];
  const a = await faqe(() => lista);
  let s = await gj(a.p);
  ok(s.karta && !s.kodi && /Ora është e lidhur/.test(s.tx) && /Galaxy Watch6 Classic/.test(s.tx) && /duli96/.test(s.tx) && /para 2 minutash/.test(s.tx) && /1\.0\.77/.test(s.tx) && /U lidh/.test(s.tx), '1. karta: modeli, llogaria, u lidh, aktive, versioni; pa kutinë e kodit', s.tx);
  ok(a.thirrjet.some(x => x.startsWith('/ora/emri') && /duli96/.test(x)), '1. emri i ri i dërgohet orës (ora kishte emrin e vjetër)', a.thirrjet);
  // 2) shkëputja: prek dy herë
  await a.p.click('.ora-lidhur__shkeput'); await a.p.waitForTimeout(200);
  ok(/Prek sërish/.test(await a.p.textContent('.ora-lidhur__shkeput')) && !a.thirrjet.some(x => x.startsWith('/ora/shkeput-tel')), '2. prekja e parë pyet');
  await a.p.click('.ora-lidhur__shkeput'); await a.p.waitForTimeout(800);
  s = await gj(a.p);
  ok(a.thirrjet.some(x => x === '/ora/shkeput-tel {"id":"abcdef0123456789"}') && !s.karta && s.kodi, '2. u shkëput: del prapë kutia e kodit', a.thirrjet.filter(x => /shkeput/.test(x)));
  // 3) serveri i vjetër (404): si më parë, me kutinë e kodit
  const c = await faqe(null);
  s = await gj(c.p);
  ok(!s.karta && s.kodi, '3. serveri i vjetër: kutia e kodit si më parë');
  ok(!a.p.__gab.length && !c.p.__gab.length, '4. pa gabime JS', [a.p.__gab, c.p.__gab]);
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();
