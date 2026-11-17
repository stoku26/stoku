// v318 (pronari: "A mujna me fshi 100% cfare ka te re se so ka vyn kurgjo?"): "Çfarë ka të re" u fshi krejt, në web (telefon + PC),
// Android (TeRejat.kt, dritarja pas përditësimit, rreshti te Cilësimet, lista te faqja e përditësimit) dhe te Release-t e GitHub-it.
// Mbetet vetëm numri i versionit te Cilësimet (versioni.js).
const { chromium } = require('./pw.js');
const fs = require('fs');
const PORTI = process.env.PORTI || '8765';
const RR = __dirname + '/../';
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const lx = f => fs.readFileSync(RR + f, 'utf8');
const K = 'vendas/app/src/main/java/site/stoku/vendas/';

(async () => {
  // 0. Kodi
  ok(!fs.existsSync(RR + 'teRejat.js') && !fs.existsSync(RR + K + 'TeRejat.kt'), '0. teRejat.js dhe TeRejat.kt s\'ekzistojnë më');
  const web = ['index.html', 'pc.html', 'app-tel.js', 'app-pc.js', 'sw.js'].map(lx).join('\n');
  ok(!/teRejat|TeRejat|dlgTeRejat|opsTeRejat|Çfarë ka të re|Çka ka të re/.test(web.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, '')), '0. web: asnjë gjurmë (pa komentet)');
  const kt = ['ui/CilesimetEkrani.kt', 'MainActivity.kt', 'Perditesimi.kt', 'ui/PerditesimiUI.kt', 'ui/Ikonat.kt'].map(f => lx(K + f)).join('\n');
  ok(!/TeRejat|ÇKA KA TË RE|"Çfarë ka të re"/.test(kt.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, '')), '0. Android: asnjë gjurmë (pa komentet)');
  const wf = lx('.github/workflows/vendas-apk.yml');
  ok(!/TeRejat\.kt|Çka ka të re:/.test(wf) && /shenimet\.md/.test(wf), '0. Release-t: pa "Çka ka të re"');
  const V = require(RR + 'versioni.js');
  ok(V.v === 318 && /^\d+\.\d+\.\d+$/.test(V.emri), '0. versioni.js', V);
  ok(/stoku-v318/.test(lx('sw.js')) && /'\.\/versioni\.js\?v=318'/.test(lx('sw.js')) && !/teRejat/.test(lx('sw.js').split('var SHELL')[1] || ''), '0. sw.js: CACHE v318, versioni.js në SHELL');

  const b = await chromium.launch();
  // 1. Telefoni: përdorues me versionin e vjetër të parë (para v318) s'e sheh më dritaren; Cilësimet pa rreshtin
  {
    const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.addInitScript(() => {
      window.__stokuCloud = { authGati: true, perdoruesiAktual: () => ({ uid: 'u1', email: 'agim@stoku-app.local' }), token: async () => 't',
        merr: async () => ({ ok: true, gjendja: null }), bashkoDheRuaj: async fn => ({ ok: true, gjendja: fn(null) }), degjo: () => () => {}, degjoFletet: () => () => {}, dil: async () => {} };
      localStorage.setItem('stoku:pronari-uid', 'u1'); localStorage.setItem('stoku:porta:hyrja', JSON.stringify({ uid: 'u1', emri: 'agim' }));
      if (!sessionStorage.getItem('v318')) { localStorage.setItem('stoku:te-rejat:pare', '200'); sessionStorage.setItem('v318', '1'); }
      localStorage.setItem('stoku:njoftimet:jo-tani', String(Date.now()));
    });
    const p = await ctx.newPage(); const gab = []; p.on('pageerror', e => gab.push(e.message));
    await p.goto('http://127.0.0.1:' + PORTI + '/index.html'); await p.waitForTimeout(5000);
    const r = await p.evaluate(() => ({ dlg: !!document.getElementById('dlgTeRejat'), ops: !!document.getElementById('opsTeRejat'),
      hapur: [...document.querySelectorAll('.mbulese.hapur')].map(x => x.id), ls: localStorage.getItem('stoku:te-rejat:pare'),
      tekst: document.body.textContent.includes('Çfarë ka të re'), versioni: document.getElementById('opsVersioni').textContent }));
    ok(!r.dlg && !r.ops && !r.tekst, '1. telefoni: pa dritare, pa rresht te Cilësimet, asnjë tekst "Çfarë ka të re"', r);
    ok(!r.hapur.length && r.ls === null, '1. asgjë s\'hapet vetë; shënimi i vjetër fshihet nga pajisja', r);
    ok(r.versioni.trim() === '1.64.0', '1. Cilësimet: "Stoku 1.64.0"', r.versioni);
    ok(!gab.length, '1. pa gabime JS', gab);
    await ctx.close();
  }
  // 2. PC
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 860 }, serviceWorkers: 'block' });
    await ctx.addInitScript(() => localStorage.setItem('stoku:te-rejat:pare', '200'));
    const p = await ctx.newPage(); const gab = []; p.on('pageerror', e => gab.push(e.message));
    await p.goto('http://127.0.0.1:' + PORTI + '/pc.html'); await p.waitForTimeout(4000);
    const r = await p.evaluate(() => ({ dlg: !!document.getElementById('dlgTeRejat'), ops: !!document.getElementById('opsTeRejat'),
      hapur: [...document.querySelectorAll('.mbulese.hapur')].map(x => x.id), tekst: document.body.textContent.includes('Çfarë ka të re'),
      versioni: document.getElementById('opsVersioni').textContent }));
    ok(!r.dlg && !r.ops && !r.tekst && !r.hapur.includes('dlgTeRejat') && r.versioni === '1.64.0', '2. PC: pa dritare, pa butonin, versioni 1.64.0', r);
    ok(!gab.length, '2. pa gabime JS', gab);
    await ctx.close();
  }
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();
