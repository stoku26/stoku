// v288: pronari (foto e Aktivitetit: tri heqje me të njëjtën orë 13:22): "kur diçka u hoq prej raftit pse nuk e qet në sa ora u hoq
// po orë tjetër". Heqjet e bëra në orën e dorës i merr telefoni/PC më vonë (GET /ora/hequrat) dhe aktiviteti shkruhej me orën e
// marrjes. Tani ngjarja mban orën e vërtetë të heqjes (h.koha).
//  1) kohaENgjarjes: kohë e kaluar deri 30 ditë mbahet; e ardhshme / shumë e vjetër / e pavlefshme → tani;
//  2) telefoni: heqja nga ora (2 orë më parë) del te aktiviteti me atë orë; 3) PC njësoj; 4) heqja e zakonshme mban orën e tanishme; 5) versionet.
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
const EK = require('../ekipa.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
(async () => {
  const T = Date.now();
  ok(EK.kohaENgjarjes(T - 7200e3, T) === T - 7200e3 && EK.kohaENgjarjes(T + 5000, T) === T && EK.kohaENgjarjes(T - 31 * 864e5, T) === T && EK.kohaENgjarjes(undefined, T) === T &&
    EK.kohaENgjarjes('x', T) === T && EK.kohaENgjarjes(0, T) === T && EK.kohaENgjarjes(NaN, T) === T, '1. ora e ngjarjes: e kaluara (deri 30 ditë) mbahet, të tjerat → tani');
  const dita = n => new Date(T + n * 864e5).toISOString().slice(0, 10);
  for (const pc of [false, true]) {
    const em = pc ? 'PC' : 'tel';
    const F = krijoFirestore({ rregullat: 'reja' });
    F.S.docs.set('perdoruesit/uA', { perdoruesi: 'mendurberisha', emri: 'mendurberisha', kycurSe: T, ekipaMigruarSe: T });
    F.S.docs.set('grupet/ekipa', { emri: 'Ekipa', pronarUid: 'uA', pronarEmri: 'mendurberisha', krijuarSe: T });
    ['uA:mendurberisha:pronar', 'u1:agim:anetar'].forEach(x => { const [u, e, r] = x.split(':'); F.S.docs.set('grupet/ekipa/anetaret/' + u, { emri: e, roli: r, hyriSe: T });
      F.S.docs.set('perdoruesit/' + u, Object.assign({ perdoruesi: e, kycurSe: T }, F.S.docs.get('perdoruesit/' + u) || {}, { grupi: 'ekipa' })); });
    F.S.docs.set('dyqane/u1', { app: 'stoku', version: 3, foldera: [{ id: 'f1', emri: 'Pije' }], produktet: [],
      afatet: [{ id: 'a1', barkodi: '111', emri: 'EKS Dardhe 1L', data: dita(-1), sasia: 8, statusi: 'aktiv', ndryshuarSe: T - 864e5 }, { id: 'a2', barkodi: '222', emri: 'Fructal Molle', data: dita(-1), sasia: 7, statusi: 'aktiv', ndryshuarSe: T - 864e5 }], fshira: {} });
    const b = await chromium.launch();
    const ctx = await b.newContext(pc ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' } : { userAgent: 'Mozilla/5.0 (Linux; Android 13) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    // Worker-i i rremë: një heqje nga ora 2 orë më parë (a1)
    const kurOra = T - 7200e3; let pastruar = [];
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), async r => {
      const u = r.request().url();
      if (/\/ora\/hequrat/.test(u)) {
        let t = {}; try { t = JSON.parse(r.request().postData() || '{}'); } catch (e) {}
        if (Array.isArray(t.pastro)) { pastruar = pastruar.concat(t.pastro); return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ok: true, hequrat: [] }) }); }
        return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ok: true, hequrat: pastruar.includes('a1') ? [] : [{ i: 'a1', koha: kurOra }] }) });
      }
      if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
      return r.abort();
    });
    await F.lidh(ctx, 'u1', 'agim@stoku-app.local', pc ? 'pc' : 'tel');
    const p = await ctx.newPage(); const gab = []; p.on('pageerror', e => gab.push(e.message));
    await p.goto('http://127.0.0.1:8765/' + (pc ? 'pc.html#/afatet' : 'index.html'));
    await p.waitForTimeout(7500); // "stoku-cloud-gati" + 4 s → heqjet nga ora
    const feed = () => [...F.S.docs.entries()].filter(([k]) => k.startsWith('grupet/ekipa/feed/')).map(x => x[1]);
    const hq = feed().filter(x => x.lloji === 'hequr' && x.afatId === 'a1');
    const dq = F.S.docs.get('dyqane/u1') || {};
    ok(hq.length === 1 && hq[0].koha === kurOra, (pc ? '3. ' : '2. ') + em + ': heqja nga ora del te aktiviteti me orën kur u hoq (2 orë më parë), jo me orën e marrjes', hq.map(x => ({ koha: x.koha, para: Math.round((Date.now() - x.koha) / 60000) + ' min' })));
    ok(pastruar.includes('a1'), (pc ? '3. ' : '2. ') + em + ': heqja pastrohet te serveri pasi zbatohet', pastruar);
    // 4) heqja e zakonshme (këtu, tani) mban orën e tanishme
    const para = Date.now();
    if (!pc) {
      await p.click('#btnAfatet'); await p.waitForTimeout(700);
      await p.click('#afLista .af-karta:has-text("Fructal") .af-pill'); await p.waitForTimeout(900);
    } else {
      await p.evaluate(() => { location.hash = '#/afatet'; }); await p.waitForTimeout(800);
      const btn = await p.$('#afTrup tr:has-text("Fructal") button.af-btn, #afTrup tr:has-text("Fructal") button');
      if (btn) await btn.click(); await p.waitForTimeout(900);
    }
    const h2 = feed().filter(x => x.lloji === 'hequr' && x.afatId === 'a2');
    ok(h2.length === 1 && h2[0].koha >= para - 2000 && h2[0].koha <= Date.now() + 2000, '4. ' + em + ': heqja e zakonshme mban orën e tanishme', h2.map(x => x.koha - para));
    ok(!gab.length, em + ' pa gabime JS', gab);
    await b.close();
  }
  const fs = require('fs'), sw = fs.readFileSync(__dirname + '/../sw.js', 'utf8');
  const nr = rx => Number((sw.match(rx) || [])[1]);
  ok(nr(/stoku-v(\d+)/) >= 288 && nr(/ekipa\.js\?v=(\d+)/) >= 288 && nr(/app-tel\.js\?v=(\d+)/) >= 288 && nr(/app-pc\.js\?v=(\d+)/) >= 288, '5. versionet ≥ 288');
  const tr = fs.readFileSync(__dirname + '/../teRejat.js', 'utf8');
  ok(/\{ v: 288,[^\n]*platforma: 'tel'/.test(tr) && /\{ v: 288,[^\n]*platforma: 'pc'/.test(tr), '5. teRejat v288 (tel + pc)');
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();
