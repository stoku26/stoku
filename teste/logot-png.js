// v314: PNG-të e logos dhe ikonës nga SVG-të që shkruan teste/logot-gjenero.py (pas tij): node teste/logot-png.js
const fs = require('fs');
const path = require('path');
const { chromium } = require('./pw.js');
const RR = path.join(__dirname, '..');
const lx = f => fs.readFileSync(path.join(RR, f), 'utf8');
const PUNET = [
  // [burimi, dalja, gjerësia, lartësia]
  ['logo/favicon.svg', 'logo/favicon-32.png', 32, 32],
  ['logo/stoku-icon.svg', 'icon-192.png', 192, 192],
  ['logo/stoku-icon.svg', 'icon-512.png', 512, 512],
  ['logo/stoku-icon-square.svg', 'apple-touch-icon.png', 180, 180],
  ['logo/stoku-icon-square.svg', 'logo/icon-maskable-512.png', 512, 512],
  ['logo/stoku-mono.svg', 'logo/badge-96.png', 96, 96]
];
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ deviceScaleFactor: 1 });
  async function bej(svg, dalja, w, h) {
    await p.setViewportSize({ width: w, height: h });
    const s = svg.replace(/<svg ([^>]*?)width="[^"]*" height="[^"]*"/, '<svg $1width="' + w + '" height="' + h + '"');
    await p.setContent('<!doctype html><html><head><style>html,body{margin:0;background:transparent}svg{display:block}</style></head><body>' + s + '</body></html>');
    await p.screenshot({ path: path.join(RR, dalja), omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
    console.log('  shkrova', dalja, w + 'x' + h);
  }
  for (const [burimi, dalja, w, h] of PUNET) await bej(lx(burimi), dalja, w, h);
  // logot e plota (4x)
  for (const f of ['stoku-logo', 'stoku-logo-dark']) {
    const svg = lx('logo/' + f + '.svg');
    const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
    await bej(svg, 'logo/' + f + '.png', Math.round(+vb[1] * 4), Math.round(+vb[2] * 4));
  }
  await b.close();
})();
