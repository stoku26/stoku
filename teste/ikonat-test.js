const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
(async () => {
  const F = krijoFirestore({ rregullat: 'reja' });
  F.S.docs.set('perdoruesit/uA', { perdoruesi: 'mendurberisha', emri: 'mendurberisha', kycurSe: Date.now() });
  const b = await chromium.launch();
  for (const pc of [false, true]) for (const tema of ['light', 'dark']) {
    const c = await b.newContext({ viewport: pc ? { width: 1400, height: 850 } : { width: 390, height: 844 }, userAgent: pc ? undefined : 'Mozilla/5.0 (Linux; Android 13) Chrome/140 Mobile', serviceWorkers: 'block', colorScheme: tema });
    await c.route(x => !x.href.startsWith('http://127.0.0.1'), r => r.abort());
    await F.lidh(c, 'uA', 'mendurberisha@stoku-app.local', pc ? 'pc' : 'tel');
    await c.addInitScript(() => { try { localStorage.setItem('stoku:porta:hyrja', JSON.stringify({ uid: 'uA', emri: 'mendurberisha' })); localStorage.setItem('stoku:pronari-uid', 'uA'); } catch (e) {} });
    const p = await c.newPage(); const em = pc ? 'PC' : 'TEL'; const T = em + ' ' + tema + ': ';
    p.on('pageerror', e => { g++; console.log(T, 'pageerror', e.message); });
    p.on('console', m => { if (m.type() === 'error' && !/Failed to load|net::ERR/.test(m.text())) { g++; console.log(T, m.text()); } });
    // mostrat e logos gjatë hapjes
    await c.addInitScript((sel) => { window.__mostra = []; const t0 = performance.now(); const f = () => { const e = document.querySelector('.stk-etiketa'); if (e && e.offsetParent) { const r = e.getBoundingClientRect(); window.__mostra.push([Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height), e.querySelector('.stk-etiketa__nen').textContent]); } if (performance.now() - t0 < 3000) requestAnimationFrame(f); }; requestAnimationFrame(f); });
    await p.goto('http://127.0.0.1:8765/' + (pc ? 'pc.html' : 'index.html')); await p.waitForTimeout(3300);
    const m = await p.evaluate(() => window.__mostra);
    const unike = [...new Set(m.map(x => x.join('|')))];
    ok(unike.length === 1, T + 'logoja e qëndrueshme gjatë hapjes', unike);
    if (!pc) {
      const ik = await p.$$eval('.folder-karta .folder-ikona', l => l.map(e => e.className.split(' ').find(c => c.startsWith('ngj-')) + ':' + !!e.querySelector('svg')));
      ok(ik.length >= 4 && ik.every(x => x.endsWith(':true')), T + 'ikona te folderat', ik);
      await p.screenshot({ path: 'ik-tel-' + tema + '.png' });
      await p.click('text=+ Folder i ri'); await p.waitForTimeout(300);
      await p.fill('#dlgFolderEmri', 'Pije freskuese');
      ok(await p.$eval('#dlgFolderIkonat .zgjedhur', e => e.title) === 'Pije', T + 'sugjerimi sipas emrit');
      await p.click('#dlgFolderIkonat [title="Kafe"]');
      await p.fill('#dlgFolderEmri', 'Pije të nxehta');
      ok(await p.$eval('#dlgFolderIkonat .zgjedhur', e => e.title) === 'Kafe', T + 'zgjedhja me dorë s\'ndryshon kur shkruan');
      await p.screenshot({ path: 'ik-tel-dlg-' + tema + '.png' });
      await p.click('#dlgFolderRuaj'); await p.waitForTimeout(400);
      const f = await p.evaluate(() => JSON.parse(localStorage.getItem('stoku:foldera:v1')).find(x => x.emri === 'Pije të nxehta'));
      ok(f && f.ikona === 'kafe', T + 'folderi i ri ruan ikonën', f);
    } else {
      const ik = await p.$$eval('.sbp-fik', l => l.length);
      ok(ik >= 4, T + 'ikona te anësorja', ik);
      await p.click('#btnFolderIRi'); await p.waitForTimeout(300);
      await p.fill('#flEmri', 'Bulmeti ' + tema); 
      ok(await p.$eval('#flIkonat .zgjedhur', e => e.title) === 'Bulmet', T + 'sugjerimi sipas emrit');
      await p.screenshot({ path: 'ik-pc-dlg-' + tema + '.png' });
      await p.click('#flIkonat [title="Të ngrira"]'); await p.click('#flRuaj'); await p.waitForTimeout(500);
      const fs = await p.evaluate(() => JSON.parse(localStorage.getItem('stoku:foldera:v1')));
      const f = fs.find(x => x.emri === 'Bulmeti ' + tema);
      ok(f && f.ikona === 'akull', T + 'folderi i ri ruan ikonën', f);
      // ndrysho ikonën
      await p.hover('.sbp-folder[data-id="' + f.id + '"], [data-id="' + f.id + '"]'); 
      await p.click('[data-id="' + f.id + '"] .me-shume'); await p.waitForTimeout(200);
      await p.click('text=Ndrysho emrin / ikonën…'); await p.waitForTimeout(300);
      ok(await p.$eval('#flIkonat .zgjedhur', e => e.title) === 'Të ngrira', T + 'dialogu i ndryshimit tregon ikonën aktuale');
      await p.click('#flIkonat [title="Yll"], #flIkonat [title="Të tjera"]'); await p.click('#flRuaj'); await p.waitForTimeout(400);
      const f2 = (await p.evaluate(() => JSON.parse(localStorage.getItem('stoku:foldera:v1')))).find(x => x.id === f.id);
      ok(f2.ikona === 'yll' && f2.emri === 'Bulmeti ' + tema, T + 'ikona u ndryshua', f2);
      await p.keyboard.press('Escape');
      await p.screenshot({ path: 'ik-pc-' + tema + '.png' });
    }
    await c.close();
  }
  console.log(g ? g + ' GABIME' : 'KREJT OK'); await b.close();
})();
