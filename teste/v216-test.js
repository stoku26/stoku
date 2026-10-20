// v216: rregullimet e faqeve (telefoni + kompjuteri) nga rishikimi i plotë
const { chromium } = require('./pw.js');
const PORTI = process.env.PORTI || '8765';
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const t = Date.now();
async function faqe(b, pc, opt) {
  opt = opt || {};
  const ctx = await b.newContext(pc ? { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140', viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' }
    : { userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
  await ctx.addInitScript(([t, produkte]) => {
    window.__nrSink = 0;
    window.__stokuCloud = { authGati: true, perdoruesiAktual: () => ({ uid: 'u1', email: 'agim@stoku-app.local' }), token: async () => 't',
      merr: async () => ({ ok: true, gjendja: null }),
      bashkoDheRuaj: async fn => { window.__nrSink++; return { ok: true, gjendja: fn(null) }; },
      degjo: () => () => {}, degjoFletet: () => () => {}, dil: async () => {} };
    localStorage.setItem('stoku:pronari-uid', 'u1'); localStorage.setItem('stoku:porta:hyrja', JSON.stringify({ uid: 'u1', emri: 'agim' }));
    localStorage.setItem('stoku:te-rejat:pare', '999'); localStorage.setItem('stoku:njoftimet:jo-tani', String(Date.now()));
    localStorage.setItem('stoku:foldera:v1', JSON.stringify([{ id: 'f1', emri: 'Ushqimore' }, { id: 'f2', emri: 'Pije' }]));
    localStorage.setItem('stoku:produktet:v2', JSON.stringify(produkte || {
      'f1::111': { barkodi: '111', emri: 'Bukë', sasia: 4, kategoriaId: 'f1', prekurSe: t },
      'f1::222': { barkodi: '222', emri: '', sasia: 1, kategoriaId: 'f1', prekurSe: t - 10 },
      'f1::333': { barkodi: '333', emri: 'Gama', sasia: 2, kategoriaId: 'f1', prekurSe: t - 20 },
      'f1::444': { barkodi: '444', emri: 'Alfa', sasia: 2, kategoriaId: 'f1', prekurSe: t - 30 }
    }));
  }, [t, opt.produkte || null]);
  const p = await ctx.newPage();
  p.on('pageerror', e => { g++; console.log('pageerror', e.message); });
  await p.goto('http://127.0.0.1:' + PORTI + '/' + (pc ? 'pc.html' : 'index.html') + (opt.hash || ''));
  await p.waitForTimeout(2200);
  return { p, ctx };
}
const prod = (p, k) => p.evaluate(k => JSON.parse(localStorage.getItem('stoku:produktet:v2'))[k] || null, k);

(async () => {
  const b = await chromium.launch();
  // ================= TELEFONI =================
  {
    const { p, ctx } = await faqe(b, false);
    await p.click('.folder-karta[data-id="f1"]'); await p.waitForTimeout(300);
    // 1. Barkodi i skanuar në fushën e sasisë s'ruhet si sasi
    await p.fill('#barkodi', '111'); await p.press('#barkodi', 'Enter'); await p.waitForTimeout(300);
    ok(await p.isVisible('#dlgProdukt'), 'T1: dialogu i produktit u hap');
    await p.fill('#dlgSasia', '5901234123457'); await p.click('#dlgRuaj'); await p.waitForTimeout(300);
    ok(await p.isVisible('#dlgProdukt') && (await prod(p, 'f1::111')).sasia === 4, 'T1: sasia 13 shifra refuzohet, dialogu mbetet', (await prod(p, 'f1::111')).sasia);
    ok(/barkod/.test(await p.textContent('#toast')), 'T1: mesazhi "Sasia duket si barkod"', await p.textContent('#toast'));
    await p.fill('#dlgSasia', '6'); await p.click('#dlgRuaj'); await p.waitForTimeout(300);
    ok((await prod(p, 'f1::111')).sasia === 10, 'T1: sasia normale ruhet (4+6)', (await prod(p, 'f1::111')).sasia);
    // 2. "Mbrapa" mbyll dialogun e sipërm (Zhvendos), jo produktin poshtë tij
    await p.fill('#barkodi', '111'); await p.press('#barkodi', 'Enter'); await p.waitForTimeout(300);
    await p.click('#dlgZhvendosBtn'); await p.waitForTimeout(300);
    ok(await p.isVisible('#dlgZhvendos') && await p.isVisible('#dlgProdukt'), 'T2: Zhvendos mbi produktin');
    await p.goBack(); await p.waitForTimeout(400);
    ok(!(await p.isVisible('#dlgZhvendos')) && await p.isVisible('#dlgProdukt'), 'T2: mbrapa → mbyllet Zhvendos, produkti mbetet', [await p.isVisible('#dlgZhvendos'), await p.isVisible('#dlgProdukt')]);
    await p.goBack(); await p.waitForTimeout(400);
    ok(!(await p.isVisible('#dlgProdukt')), 'T2: mbrapa sërish → mbyllet edhe produkti');
    // 3. Folderi u fshi nga një pajisje tjetër ndërsa dialogu ishte i hapur: s'ruhet "null::…"
    await p.fill('#barkodi', '999'); await p.press('#barkodi', 'Enter'); await p.waitForTimeout(300);
    await p.fill('#dlgEmri', 'Produkt i ri'); await p.fill('#dlgSasia', '3');
    await p.evaluate(() => { var f = JSON.parse(localStorage.getItem('stoku:foldera:v1')); window.__testFshiFolderin && window.__testFshiFolderin(); });
    await p.evaluate(() => window.__stokuTest && window.__stokuTest.fshiFolderin && window.__stokuTest.fshiFolderin('f1'));
    // pa API testimi: zbatohet një gjendje nga "cloud-i" pa folderin f1 përmes ngjarjes storage
    await p.evaluate(() => {
      localStorage.setItem('stoku:foldera:v1', JSON.stringify([{ id: 'f2', emri: 'Pije' }]));
    });
    // Z-A: pa emër gjithmonë në fund (kontrollohet te faqja tjetër, këtu vetëm ruajtja)
    await p.click('#dlgRuaj'); await p.waitForTimeout(300);
    const ls = await p.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('stoku:produktet:v2'))));
    ok(!ls.some(k => /^null::/.test(k)), 'T3: asnjë produkt "null::…"', ls);
    // 4. Skanimi kur një dritare është e hapur: fusha e barkodit zbrazet (skanimi tjetër s'i ngjitet)
    const { p: p2, ctx: c2 } = await faqe(b, false);
    await p2.click('.folder-karta[data-id="f1"]'); await p2.waitForTimeout(300);
    await p2.evaluate(() => document.getElementById('dlgTeRejat').classList.add('hapur'));
    await p2.fill('#barkodi', '5901234123457'); await p2.press('#barkodi', 'Enter'); await p2.waitForTimeout(300);
    ok((await p2.inputValue('#barkodi')) === '', 'T4: fusha e barkodit zbrazet edhe kur një dritare është e hapur', await p2.inputValue('#barkodi'));
    await p2.evaluate(() => document.getElementById('dlgTeRejat').classList.remove('hapur'));
    // 5. Renditja Z-A: produkti pa emër në fund
    await p2.evaluate(() => { var o = JSON.parse(localStorage.getItem('stoku:opsione:v1') || '{}'); });
    const rend = await p2.evaluate(() => {
      var sel = document.getElementById('opsRendi') || document.querySelector('[data-rendi]');
      return null;
    });
    await c2.close();
    await ctx.close();
  }
  // Z-A me opsionin e ruajtur
  {
    const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    await ctx.addInitScript(t => {
      window.__stokuCloud = { authGati: true, perdoruesiAktual: () => ({ uid: 'u1', email: 'agim@stoku-app.local' }), token: async () => 't', merr: async () => ({ ok: true, gjendja: null }),
        bashkoDheRuaj: async fn => ({ ok: true, gjendja: fn(null) }), degjo: () => () => {}, degjoFletet: () => () => {}, dil: async () => {} };
      localStorage.setItem('stoku:pronari-uid', 'u1'); localStorage.setItem('stoku:porta:hyrja', JSON.stringify({ uid: 'u1', emri: 'agim' }));
      localStorage.setItem('stoku:te-rejat:pare', '999'); localStorage.setItem('stoku:njoftimet:jo-tani', String(Date.now()));
      localStorage.setItem('stoku:foldera:v1', JSON.stringify([{ id: 'f1', emri: 'Ushqimore' }]));
      localStorage.setItem('stoku:produktet:v2', JSON.stringify({ 'f1::1': { barkodi: '1', emri: '', sasia: 1, kategoriaId: 'f1', prekurSe: t }, 'f1::2': { barkodi: '2', emri: 'Alfa', sasia: 1, kategoriaId: 'f1', prekurSe: t }, 'f1::3': { barkodi: '3', emri: 'Zeta', sasia: 1, kategoriaId: 'f1', prekurSe: t } }));
      localStorage.setItem('stoku:opsione:v1', JSON.stringify({ rendi: 'emriZA' })); localStorage.setItem('stoku:rendi-migruar-v1', '1');
    }, t);
    const p = await ctx.newPage(); p.on('pageerror', e => { g++; console.log('pageerror', e.message); });
    await p.goto('http://127.0.0.1:' + PORTI + '/index.html'); await p.waitForTimeout(2000);
    await p.click('.folder-karta[data-id="f1"]'); await p.waitForTimeout(300);
    const kodet = await p.$$eval('#lista .artikull .kodi', l => l.map(x => x.textContent.split(' ')[0]));
    ok(kodet.join() === '3,2,1', 'T5: Z-A: Zeta, Alfa, pastaj pa emër', kodet);
    await ctx.close();
  }
  // ================= KOMPJUTERI =================
  {
    // 6. Adresa me "%" të gabuar s'e ndal faqen; "#/ekipa/chat" (i hequr) → Pulti
    const { p, ctx } = await faqe(b, true, { hash: '#/f/100%' });
    ok(await p.evaluate(() => !!window.__stokuPc), 'P6: "#/f/100%" s\'e ndal nisjen e faqes');
    await p.evaluate(() => { location.hash = '#/ekipa/chat'; }); await p.waitForTimeout(400);
    ok(/#\/ekipa$/.test(await p.evaluate(() => location.hash)) || (await p.evaluate(() => location.hash)) === '#/ekipa', 'P6: "#/ekipa/chat" → Grupi (Pulti)', await p.evaluate(() => location.hash));
    // 7. Tabela: kutiza e rreshtit mbetet e shënuar pas klikimit
    await p.evaluate(() => { location.hash = '#/f/f1'; }); await p.waitForTimeout(500);
    const kut = await p.$('#tabelaTrup tr .kutize');
    await kut.click(); await p.waitForTimeout(200);
    ok(await kut.isChecked() && /1 i zgjedhur/.test(await p.textContent('#zgjedhjaNumri')), 'P7: kutiza e shënuar = rreshti i zgjedhur', [await kut.isChecked(), await p.textContent('#zgjedhjaNumri')]);
    await kut.click(); await p.waitForTimeout(200);
    ok(!(await kut.isChecked()), 'P7: klikimi i dytë e heq');
    // 8. Filtri + Enter i shpejtë (skaneri USB): hapet produkti i saktë
    await p.click('#kerko'); await p.fill('#kerko', 'Alfa'); await p.waitForTimeout(200); // filtri i mëparshëm: vetëm Alfa
    await p.evaluate(() => { var k = document.getElementById('kerko'); k.value = '333'; k.dispatchEvent(new Event('input')); k.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); });
    await p.waitForTimeout(300);
    ok(await p.isVisible('#dlgProdukt') && (await p.inputValue('#prBarkodi')) === '333', 'P8: Enter menjëherë pas skanimit hap 333, jo Alfa', await p.inputValue('#prBarkodi'));
    // 9. Sasia me shumë shifra refuzohet
    await p.fill('#prSasia', '5901234123457'); await p.keyboard.press('Control+Enter'); await p.waitForTimeout(300);
    ok(await p.isVisible('#dlgProdukt') && /barkod/.test(await p.textContent('#prGabim')) && (await prod(p, 'f1::333')).sasia === 2, 'P9: sasia 13 shifra s\'ruhet', await p.textContent('#prGabim'));
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    // 10. Skaneri: "N4500123" (fillon me N) s'hap "Produkt i ri"
    await p.fill('#kerko', ''); await p.evaluate(() => document.activeElement.blur()); await p.waitForTimeout(150);
    for (const c of 'N4500123') await p.keyboard.press(c, { delay: 0 });
    await p.keyboard.press('Enter'); await p.waitForTimeout(500);
    const hapur = await p.isVisible('#dlgProdukt'), bark = hapur ? await p.inputValue('#prBarkodi') : '';
    ok(!hapur || bark === 'N4500123', 'P10: shkronja e parë e skanimit s\'bëhet shkurtore (barkodi i plotë ose asgjë)', [hapur, bark]);
    if (hapur) { await p.keyboard.press('Escape'); await p.waitForTimeout(200); }
    // 11. Zhbëj: s'e fshin një folder të krijuar pas veprimit
    await p.evaluate(() => { location.hash = '#/f/f1'; }); await p.waitForTimeout(300);
    const pc = await p.evaluate(() => window.__stokuPc && Object.keys(window.__stokuPc));
    await ctx.close();
  }
  // ---- Importi: emrat e folderave që ndryshojnë vetëm me shkronja të mëdha → një folder
  {
    const { p, ctx } = await faqe(b, true);
    const csv = 'Barkodi;Emri;Sasia;Folderi\n5001;A;1;Snacks\n5002;B;2;SNACKS\n5003;C;3;snacks\n';
    await p.evaluate(() => document.querySelector('[data-hap="import"], #btnImport') && 0);
    const fajlli = { name: 'malli.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) };
    const inp = await p.$('#imSkedari, input[type=file][accept*="csv"]');
    if (inp) {
      await p.keyboard.press('Control+i'); await p.waitForTimeout(300);
      await inp.setInputFiles(fajlli); await p.waitForTimeout(600);
      const opsionet = await p.$$eval('#imCaku option', l => l.map(o => o.value)).catch(() => []);
      if (opsionet.indexOf('__kolona') !== -1) await p.selectOption('#imCaku', '__kolona');
      await p.waitForTimeout(300);
      await p.click('#imBtn'); await p.waitForTimeout(500);
      const fl = await p.evaluate(() => JSON.parse(localStorage.getItem('stoku:foldera:v1')).map(f => f.emri));
      ok(fl.filter(e => e.toLowerCase() === 'snacks').length === 1, 'P12: "Snacks/SNACKS/snacks" → një folder', fl);
    } else ok(false, 'P12: s\'u gjet fusha e importit');
    await ctx.close();
  }
  // ---- Zhbëj pas fshirjes së produktit: folderi i krijuar më pas mbetet
  {
    const { p, ctx } = await faqe(b, true);
    await p.evaluate(() => { location.hash = '#/f/f1'; }); await p.waitForTimeout(400);
    await p.click('#tabelaTrup tr .kutize'); await p.waitForTimeout(150);
    await p.click('#zgjFshij'); await p.waitForTimeout(400);
    if (await p.isVisible('#konfPo')) { await p.click('#konfPo'); await p.waitForTimeout(300); }
    const pasFshirjes = await p.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('stoku:produktet:v2'))).length);
    // folder i ri (si nga një pajisje tjetër): shtohet në listë
    await p.evaluate(() => { var f = JSON.parse(localStorage.getItem('stoku:foldera:v1')); f.push({ id: 'fRi', emri: 'Snacks', ndryshuarSe: Date.now() }); localStorage.setItem('stoku:foldera:v1', JSON.stringify(f)); window.dispatchEvent(new StorageEvent('storage', { key: 'stoku:foldera:v1' })); });
    await p.waitForTimeout(300);
    await p.click('#toastBtn'); await p.waitForTimeout(400);
    const fl = await p.evaluate(() => JSON.parse(localStorage.getItem('stoku:foldera:v1')).map(f => f.id));
    const n = await p.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('stoku:produktet:v2'))).length);
    ok(n === pasFshirjes + 1 && fl.indexOf('fRi') !== -1, 'P13: "Zhbëj" e kthen produktin dhe s\'e fshin folderin e ri (bosh)', [n, fl]);
    await ctx.close();
  }
  await b.close();
  console.log(g ? '\n✖ ' + g + ' GABIME' : '\n✔ Krejt në rregull');
  process.exit(g ? 1 : 0);
})();
