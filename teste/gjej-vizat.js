// Gjen "—" brenda stringjeve JS dhe tekstit HTML (jo komenteve). Tokenizues i thjeshtë.
const fs = require('fs');
const out = [];
function skanoJs(src, file, offsetLine) {
  let i = 0, line = offsetLine;
  const n = src.length;
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '\n') { line++; i++; continue; }
    if (c === '/' && d === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { i += 2; while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') line++; i++; } i += 2; continue; }
    if (c === '"' || c === "'" || c === '`') {
      const q = c; let j = i + 1, s = ''; const l0 = line;
      while (j < n && src[j] !== q) { if (src[j] === '\\') { s += src[j] + src[j + 1]; j += 2; continue; } if (src[j] === '\n') line++; s += src[j]; j++; }
      if (s.includes('—')) out.push({ file, line: l0, s });
      i = j + 1; continue;
    }
    // regex literal: skip naive — rare with em dash
    i++;
  }
}
for (const f of process.argv.slice(2)) {
  const src = fs.readFileSync(f, 'utf8');
  if (f.endsWith('.js')) { skanoJs(src, f, 1); continue; }
  // HTML: script blocks as JS, style skipped, rest text (outside comments)
  const re = /<script\b[^>]*>([\s\S]*?)<\/script>|<style\b[^>]*>[\s\S]*?<\/style>|<!--[\s\S]*?-->/g;
  let last = 0, m;
  const lineAt = idx => src.slice(0, idx).split('\n').length;
  function tekst(a, b) {
    const t = src.slice(a, b); let off = a;
    t.split('\n').forEach((l, k) => { if (l.includes('—')) out.push({ file: f, line: lineAt(a) + k, s: l.trim(), html: true }); });
  }
  while ((m = re.exec(src))) {
    tekst(last, m.index);
    if (m[1] !== undefined) skanoJs(m[1], f, lineAt(m.index + m[0].indexOf(m[1])));
    last = re.lastIndex;
  }
  tekst(last, src.length);
}
out.forEach(o => console.log(o.file + ':' + o.line + (o.html ? ' [html] ' : ' ') + o.s.slice(0, 220)));
console.error('gjithsej', out.length);
