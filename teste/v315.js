// v315 / Android Hyrja 77 (pronari): (1) "ja qova e heki prej rafti erdh njoftimi po produkti hala osht si ne raft nfaqe te afatet":
// kërkesa e kryer nga kolegu e shënon afatin tim të hequr (prova e plotë te kerkese-test.js; këtu funksioni i pastër + lidhjet);
// (2) Ngjyrat: "heke trendafil shtoja njo tportokallt ... mokë ndrroje me cyan", ikonat e temave me idenë "B" ("stoku." + butoni).
const pw = require('./pw.js');
const fs = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const R = __dirname + '/../', lx = f => fs.readFileSync(R + f, 'utf8'), K = 'vendas/app/src/main/java/site/stoku/vendas/';
const EK = require('../ekipa.js');
(async () => {
  // 1) funksioni i pastër
  const k = { produktet: [{ produkti: 'Djathë', barkodi: '444', data: '2026-11-10' }, { produkti: 'Bukë', barkodi: '' }], koha: 1000 };
  const af = [{ id: 'a', barkodi: '444', data: '2026-11-10', statusi: 'aktiv', ndryshuarSe: 10 }, { id: 'b', barkodi: '444', data: '2026-12-01', statusi: 'aktiv' },
    { id: 'c', barkodi: '444', data: '2026-11-10', statusi: 'hequr' }, { id: 'd', barkodi: '', emri: 'bukë ', statusi: 'aktiv' }, { id: 'e', barkodi: '444', data: '2026-11-10', statusi: 'aktiv', ndryshuarSe: 2000 }];
  ok(JSON.stringify(EK.afatetEKerkesesKryer(af, k)) === '["a","d"]', '1. afatet e kërkesës: barkodi + data, emri kur s\'ka barkod; pa të hequrat dhe të ndryshuarat më vonë', EK.afatetEKerkesesKryer(af, k));
  ok(/zbatoKerkesenEKryer/.test(lx('app-tel.js')) && /zbatoKerkesenEKryer/.test(lx('app-pc.js')) && /function zbatoKerkesatEKryera/.test(lx('ekipa.js')) &&
    /private fun zbatoKerkesatEKryera/.test(lx(K + 'Grupi.kt')), '1. lidhjet: web tel, PC dhe Android');
  // 2) ngjyrat
  const tj = lx('temat.js');
  ok(!/Trëndafili|Mokë/.test(tj + lx(K + 'ui/Temat.kt')) && /emri: 'Cyan'/.test(tj) && (tj.match(/emri: 'Portokalli'/g) || []).length === 2, '2. pa Trëndafilin e Mokën; Cyan + Portokalli (e errët dhe e çelët)');
  ok(/'tm-w'/.test(tj) && /buildAnnotatedString \{ append\("stoku"\)/.test(lx(K + 'ui/CilesimetEkrani.kt')), '2. ikonat e temave: "stoku." + butoni (web + Android)');
  const b = await pw.chromium.launch();
  for (const tema of ['dark', 'light']) {
    const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1:8765'), r => r.abort());
    await ctx.addInitScript(t => { try { localStorage.setItem('stoku:tema', t); } catch (e) {} }, tema);
    const p = await ctx.newPage(); const gab = []; p.on('pageerror', e => gab.push(e.message));
    await p.goto('http://127.0.0.1:8765/index.html'); await p.waitForTimeout(2500);
    const r = await p.evaluate(t => {
      const v = document.createElement('div'); document.body.appendChild(v); window.StokuTemat.vizato(v, t);
      return [...v.querySelectorAll('.tm-karta')].map(k => ({ e: k.querySelector('.tm-emri').textContent, w: (k.querySelector('.tm-w') || {}).textContent, c: !!k.querySelector('.tm-c') }));
    }, tema);
    const emrat = r.map(x => x.e).join('|');
    ok(r.length === 10 && r.every(x => x.w === 'stoku.' && x.c) && /Portokalli/.test(emrat) && (tema === 'light' || /Cyan/.test(emrat)) && !/Trëndafili|Mokë/.test(emrat), '3. ' + tema + ': 10 ngjyra me "stoku." + butonin', emrat);
    ok(!gab.length, '3. ' + tema + ': pa gabime JS', gab);
    await ctx.close();
  }
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();
