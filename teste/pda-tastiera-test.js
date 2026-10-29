// v224: PDA → "Fshih tastierën" (butoni te folderi + çelësi te Cilësimet → Skanimi), vetëm kur është ndezur PDA
const { chromium } = require('./pw.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const MOCK = () => {
  window.__stokuCloud = { authGati: true, perdoruesiAktual: () => null, token: async () => 't',
    merr: async () => ({ ok: true, gjendja: null }), bashkoDheRuaj: async fn => ({ ok: true, gjendja: fn(null) }),
    degjo: () => () => {}, degjoFletet: () => () => {}, dil: async () => {},
    hyr: async () => ({ ok: false }), regjistrohu: async () => ({ ok: false }) };
};
const dukshem = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); if (!e) return false; const st = getComputedStyle(e);
  return st.display !== 'none' && !e.hidden && e.offsetParent !== null; }, sel);
const attr = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); return e ? { im: e.getAttribute('inputmode'), vk: e.getAttribute('virtualkeyboardpolicy'), orig: e.getAttribute('data-im-orig'), ro: e.readOnly } : null; }, sel);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 11; TC26) Chrome/140 Mobile', viewport: { width: 360, height: 640 }, serviceWorkers: 'block', hasTouch: true });
  await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
  await ctx.addInitScript(MOCK);
  const p = await ctx.newPage();
  const gab = []; p.on('pageerror', e => gab.push(e.message));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.waitForTimeout(1200);
  await p.click('#pkVizitor'); await p.waitForTimeout(2000);
  await p.click('.folder-karta >> nth=0'); await p.waitForTimeout(600);

  // 1. Pa PDA: s'ka buton, fushat si më parë
  ok(!(await dukshem(p, '#btnTastiera')), '1. pa PDA: butoni "Fshih tastierën" s\'del');
  ok((await attr(p, '#barkodi')).im === 'text', '1. pa PDA: barkodi me inputmode "text"', await attr(p, '#barkodi'));

  // 2. Ndizet PDA (Cilësimet → Skanimi): butoni del, çelësi del te Cilësimet
  await p.evaluate(() => { const c = document.getElementById('opsPda'); c.checked = true; c.dispatchEvent(new Event('change')); });
  await p.waitForTimeout(300);
  ok(await dukshem(p, '#btnTastiera') && (await p.textContent('#btnTastieraT')) === 'Fshih tastierën', '2. PDA: butoni "Fshih tastierën" te folderi', await p.textContent('#btnTastieraT'));
  ok(!(await dukshem(p, '#btnKamera')), '2. PDA: kamera fshihet si më parë');
  ok(await p.evaluate(() => document.getElementById('seksionTastiera').style.display !== 'none'), '2. PDA: çelësi te Cilësimet → Skanimi');
  ok((await attr(p, '#barkodi')).im === 'text', '2. PDA pa e shtypur butonin: tastiera ende normale');

  // 3. "Fshih tastierën": krejt fushat pa tastierë në ekran, shkrimi me tastierë fizike punon
  await p.tap('#btnTastiera'); await p.waitForTimeout(400);
  ok((await p.textContent('#btnTastieraT')) === 'Shfaq tastierën' && (await p.getAttribute('#btnTastiera', 'aria-pressed')) === 'true', '3. butoni bëhet "Shfaq tastierën"');
  ok((await p.textContent('#toast')) === "Tastiera në ekran s'del më. Shkruaj me tastierën e PDA-së.", '3. njoftimi "Tastiera në ekran s\'del më"', await p.textContent('#toast'));
  const bk = await attr(p, '#barkodi');
  ok(bk.im === 'none' && bk.vk === 'manual' && bk.orig === 'text', '3. barkodi: inputmode none + virtualkeyboardpolicy manual (origjinali ruhet)', bk);
  ok(await p.evaluate(() => document.activeElement && document.activeElement.id === 'barkodi'), '3. kursori mbetet te barkodi');
  const krejt = await p.evaluate(() => [...document.querySelectorAll('input, textarea')].filter(e => /^(text|search|tel|number|email|url|password)$/.test(e.type || 'text') || e.tagName === 'TEXTAREA').every(e => e.getAttribute('inputmode') === 'none'));
  ok(krejt, '3. krejt fushat e shkrimit në faqe kanë inputmode none');
  ok((await attr(p, '#afatData')).im === 'none' && (await attr(p, '#afatData')).orig === 'numeric', '3. data e afatit (numeric) ruhet për rikthim', await attr(p, '#afatData'));
  await p.focus('#barkodi'); await p.keyboard.type('3800123456789');
  ok((await p.inputValue('#barkodi')) === '3800123456789' || await p.evaluate(() => document.querySelector('.mbulese.hapur') !== null), '3. tastiera fizike / skaneri shkruan në barkod', await p.inputValue('#barkodi'));
  await p.waitForTimeout(900);
  // Dritarja e produktit (fusha të krijuara/rishfaqura): fokusi s'e hap tastierën
  const dlg = await p.evaluate(() => { const d = document.querySelector('.mbulese.hapur'); if (!d) return null; const a = document.activeElement; return { dritarja: d.id, fokusi: a && a.id, im: a && a.getAttribute('inputmode') }; });
  ok(dlg && dlg.im === 'none', '3. dritarja e produktit: fusha me fokus pa tastierë në ekran', dlg);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  await p.evaluate(() => { document.querySelectorAll('.mbulese.hapur').forEach(d => d.classList.remove('hapur')); });

  // 4. Prekja e fushës: readonly për një çast, pastaj sërish e shkrueshme
  await p.tap('#btnKerko').catch(() => {}); // v269: fusha "Kërko" hapet me 🔍
  await p.evaluate(() => document.activeElement && document.activeElement.blur());
  await p.tap('#kerko').catch(() => {});
  const ro1 = await p.evaluate(() => document.getElementById('kerko').readOnly);
  await p.waitForTimeout(300);
  const ro2 = await p.evaluate(() => document.getElementById('kerko').readOnly);
  ok(ro2 === false, '4. pas prekjes fusha mbetet e shkrueshme (readonly vetëm për një çast)', { menjehere: ro1, pas300ms: ro2 });
  await p.keyboard.type('Kos');
  ok((await p.inputValue('#kerko')) === 'Kos', '4. shkrimi me tastierë fizike te kërkimi punon', await p.inputValue('#kerko'));

  // 5. Mbetet pas rifreskimit; çelësi te Cilësimet është i ndezur
  await p.reload(); await p.waitForTimeout(1500);
  if (await dukshem(p, '#pkVizitor')) { await p.click('#pkVizitor'); await p.waitForTimeout(1500); }
  await p.click('.folder-karta >> nth=0').catch(() => {}); await p.waitForTimeout(500);
  ok((await p.textContent('#btnTastieraT')) === 'Shfaq tastierën' && (await attr(p, '#barkodi')).im === 'none', '5. pas rifreskimit: ende e fshehur', await attr(p, '#barkodi'));
  ok(await p.evaluate(() => document.getElementById('opsTastiera').checked), '5. çelësi te Cilësimet i ndezur');

  // 6. Fiket PDA: tastiera rikthehet krejt, butoni dhe çelësi zhduken (zgjedhja ruhet për herën tjetër)
  await p.evaluate(() => { const c = document.getElementById('opsPda'); c.checked = false; c.dispatchEvent(new Event('change')); });
  await p.waitForTimeout(300);
  const pas = await attr(p, '#barkodi');
  ok(pas.im === 'text' && pas.vk === null && pas.orig === null, '6. pa PDA: barkodi rikthehet te inputmode "text"', pas);
  ok((await attr(p, '#afatData')).im === 'numeric', '6. data e afatit rikthehet te "numeric"', await attr(p, '#afatData'));
  ok(!(await dukshem(p, '#btnTastiera')) && await p.evaluate(() => document.getElementById('seksionTastiera').style.display === 'none'), '6. pa PDA: butoni dhe çelësi s\'dalin');

  // 7. Sërish PDA: zgjedhja e ruajtur vlen; "Shfaq tastierën" e rikthen
  await p.evaluate(() => { const c = document.getElementById('opsPda'); c.checked = true; c.dispatchEvent(new Event('change')); });
  await p.waitForTimeout(300);
  ok((await attr(p, '#barkodi')).im === 'none', '7. PDA sërish: tastiera e fshehur (zgjedhja u ruajt)');
  await p.evaluate(() => { const c = document.getElementById('opsTastiera'); c.checked = false; c.dispatchEvent(new Event('change')); });
  await p.waitForTimeout(300);
  ok((await attr(p, '#barkodi')).im === 'text' && (await p.textContent('#btnTastieraT')) === 'Fshih tastierën', '7. çelësi te Cilësimet e rikthen tastierën', await attr(p, '#barkodi'));
  await p.screenshot({ path: __dirname + '/pda-tastiera.png' });

  ok(!gab.length, 'pa gabime në faqe', gab);
  await b.close();
  console.log(g ? '✖ ' + g + ' GABIME' : '✔ Krejt në rregull');
})();
