// v294: pronari: "Heke komplet zerin e skanimit kthe qysh u kon". 10 zërat e v292 u hoqën (web + Android); bip-i si para v292
// (1800 Hz, valë katrore, 0.15 s; Android ToneGenerator TONE_PROP_BEEP 150 ms). Butonat e kamerës poshtë (v292) mbeten.
const { chromium } = require('./pw.js');
const { hapFaqen, skano, mbyll } = require('./kamera-e-rreme.js');
const fs = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const RR = __dirname + '/../';
const lexo = f => fs.readFileSync(RR + f, 'utf8');
(async () => {
  const js = lexo('app-tel.js'), ix = lexo('index.html'), css = lexo('css/stoku.css');
  const A = 'vendas/app/src/main/java/site/stoku/vendas/';
  ok(!/ZERAT|luajZerin|listaZerave|seksionZeri|opsione\.zeri/.test(js + ix) && !/ops-zerat|zeri-nr/.test(css), '1. web: pa zgjedhjen e zërit');
  ok(/o\.type = 'square';\s*o\.frequency\.value = 1800;\s*g\.gain\.value = 0\.2;/.test(js) && /o\.stop\(audioCtx\.currentTime \+ 0\.15\)/.test(js), '1. web: bip-i i vjetër');
  ok(/Një bip i shkurtër sa herë lexohet një barkod\./.test(ix), '1. web: teksti i vjetër te "Tingulli"');
  ok(!fs.existsSync(RR + A + 'ui/Zerat.kt'), '2. Android: Zerat.kt u fshi');
  const sk = lexo(A + 'ui/Skaneri.kt'), ce = lexo(A + 'ui/CilesimetEkrani.kt'), op = lexo(A + 'Opsionet.kt');
  ok(/ToneGenerator\.TONE_PROP_BEEP, 150/.test(sk) && !/Zerat/.test(sk + ce + op) && !/"zeri"/.test(op), '2. Android: bip-i i vjetër, pa zgjedhjen e zërit');
  ok(/androidx\.lifecycle\.compose\.LocalLifecycleOwner/.test(sk), '2. Android: ndreqja e v293 te Skaneri mbetet');

  const { b, p } = await hapFaqen(chromium);
  await p.evaluate(() => {
    window.__osc = [];
    const AC = window.AudioContext || window.webkitAudioContext;
    const vj = AC.prototype.createOscillator;
    AC.prototype.createOscillator = function () { const o = vj.call(this); const st = o.start.bind(o); o.start = function (t) { window.__osc.push(o.type + ':' + o.frequency.value); return st(t); }; return o; };
  });
  await p.click('#btnOpsione'); await p.waitForTimeout(500);
  await p.click('#tabSkenimi'); await p.waitForTimeout(500);
  ok(!(await p.$('#listaZerave')) && !(await p.$('#titZeri')) && (await p.isVisible('#rreshtTingull')), '3. Cilësimet → Skanimi: s\'ka "Zëri i skanimit", ndezësi "Tingulli" mbetet');
  await p.evaluate(() => document.getElementById('dlgOpsione').classList.remove('hapur'));
  await p.click('.folder-karta >> text=Pije'); await p.waitForTimeout(600);
  const s = await skano(p, Array(7).fill(['3830000622349', 'ean_13', 'brenda']), 400);
  const osc = await p.evaluate(() => window.__osc);
  ok(s.dialogu && osc.length === 1 && osc[0] === 'square:1800', '3. skanimi: një bip 1800 Hz si para v292', { dialogu: s.dialogu, osc });
  await mbyll(p);
  ok(!p.__gab.length, 'pa gabime JS', p.__gab);
  await b.close();
  const sw = lexo('sw.js');
  const nr = (t, rx) => Number((t.match(rx) || [])[1]);
  ok(nr(sw, /stoku-v(\d+)/) >= 294 && nr(sw, /app-tel\.js\?v=(\d+)/) >= 294 && nr(ix, /app-tel\.js\?v=(\d+)/) >= 294 && nr(sw, /stoku\.css\?v=(\d+)/) >= 67 && nr(ix, /stoku\.css\?v=(\d+)/) >= 67, 'versionet ≥ 294');
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();
