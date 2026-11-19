// v342 / Android Hyrja 101: leximi i Excel-it injoron qelizat nga kolona 200 dhe rreshtat pas 100.000 (web + Kotlin të njëjtë);
//  stoku-afatet v4 (çelësat e Google-it): teste/wp/afatet-ai-prova.mjs.
const pw = require('./pw.js');
const { chromium } = pw;
const fs = require('fs'), zlib = require('zlib');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const RR = __dirname + '/../', lx = f => fs.readFileSync(RR + f, 'utf8');
const K = 'vendas/app/src/main/java/site/stoku/vendas/';
const B = 'http://127.0.0.1:' + (process.env.PORTI || '8765');
// ZIP pa kompresim
function zip(sk) {
  const crc = b => { let c, t = []; for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } let r = 0xFFFFFFFF; for (const x of b) r = t[(r ^ x) & 0xFF] ^ (r >>> 8); return (r ^ 0xFFFFFFFF) >>> 0; };
  const pj = [], qe = []; let o = 0;
  for (const [emri, tx] of sk) {
    const e = Buffer.from(emri), d = Buffer.from(tx), c = crc(d);
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt32LE(c, 14); h.writeUInt32LE(d.length, 18); h.writeUInt32LE(d.length, 22); h.writeUInt16LE(e.length, 26);
    pj.push(h, e, d);
    const q = Buffer.alloc(46); q.writeUInt32LE(0x02014b50, 0); q.writeUInt16LE(20, 4); q.writeUInt16LE(20, 6); q.writeUInt32LE(c, 16); q.writeUInt32LE(d.length, 20); q.writeUInt32LE(d.length, 24); q.writeUInt16LE(e.length, 28); q.writeUInt32LE(o, 42);
    qe.push(q, e); o += 30 + e.length + d.length;
  }
  const qb = Buffer.concat(qe), f = Buffer.alloc(22); f.writeUInt32LE(0x06054b50, 0); f.writeUInt16LE(sk.length, 8); f.writeUInt16LE(sk.length, 10); f.writeUInt32LE(qb.length, 12); f.writeUInt32LE(o, 16);
  return Buffer.concat([...pj, qb, f]);
}
(async () => {
  const NS = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
  const x = zip([
    ['xl/workbook.xml', '<?xml version="1.0"?><workbook ' + NS + '><sheets><sheet name="F" sheetId="1" r:id="rId1"/></sheets></workbook>'],
    ['xl/_rels/workbook.xml.rels', '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>'],
    ['xl/worksheets/sheet1.xml', '<?xml version="1.0"?><worksheet ' + NS + '><sheetData>' +
      '<row r="1"><c r="A1" t="inlineStr"><is><t>Barkodi</t></is></c><c r="XFD1" t="inlineStr"><is><t>larg</t></is></c></row>' +
      '<row r="2"><c r="A2"><v>3890010001</v></c></row>' +
      '<row r="1048576"><c r="A1048576" t="inlineStr"><is><t>fundi</t></is></c></row>' +
      '</sheetData></worksheet>']
  ]);
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto(B + '/404.html');
  await p.addScriptTag({ url: B + '/xlsx.js' });
  const r = await p.evaluate(async (b64) => {
    const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    const a = performance.now(); const f = await StokuXlsx.read(u.buffer);
    return { ms: Math.round(performance.now() - a), rreshta: f[0].rows.length, kol1: f[0].rows[0].length, r2: f[0].rows[1][0] };
  }, x.toString('base64'));
  ok(r.rreshta === 2 && r.kol1 === 1 && r.r2 === 3890010001, '1. web: XFD1 dhe rreshti 1048576 injorohen, të dhënat mbeten', r);
  await b.close();
  const kt = lx('vendas/logjika/src/main/kotlin/site/stoku/logjika/Xlsx.kt'), js = lx('xlsx.js');
  ok(/KOL_MAKS = 200\b/.test(kt) && /RRESHT_MAKS = 100000\b/.test(kt) && /KOL_MAKS = 200, RRESHT_MAKS = 100000/.test(js), '2. Kotlin dhe web me të njëjtët kufij');
  const fk = JSON.parse(lx('vendas/logjika/src/test/resources/fikstura.json')).excel.leximi.find(a => a.emri === 'dore').rez[0].rows;
  ok(fk.length === 7 && fk[6].length === 200 && fk[6][199] === 199, '2. fikstura e Kotlinit: rreshti 7 deri te GR, pa GS/XFD, pa rreshtin 100001', { n: fk.length, k: fk[6].length });
  ok(/celesatGoogle\(true\)/.test(lx('worker/stoku-afatet.js')) && /versioni: 4/.test(lx('worker/stoku-afatet.js')), '3. stoku-afatet v4: çelësi i panjohur rishkarkohet');
  ok(/Hyrja\(101, "2026-11-19"/.test(lx(K + 'TeRejat.kt')) && /v: 342/.test(lx('versioni.js')) && /stoku-v342/.test(lx('sw.js')), '0. versionet 342 / Hyrja 101');
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();
