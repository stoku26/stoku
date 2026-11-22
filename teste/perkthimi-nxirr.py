#!/usr/bin/env python3
"""v355: nxjerr tekstet shqip të pamjes (HTML + vargjet e JS-it/Kotlin-it) që s'janë ende te perkthimi/en.json.
Përdorimi: python3 teste/perkthimi-nxirr.py [web|android|krejt] -> lista JSON në dalje."""
import re, json, sys, glob, os
RR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
ALB = re.compile(r"[ëçËÇ]|\b(dhe|për|në|nga|të|një|ka|je|ke|ose|më|s'|Shto|Ruaj|Anulo|Fshi|Hyr|Dil|Mbyll|Hap|Kërko|Po|Jo|Afatet|Malli|Grupi|Pamja|Llogaria|Ballina|Kolegët|Aktiviteti|Kalendari|Furnizuesi|Furnizuesit|Produktet|Produkti|Sasia|Barkodi|Marketet|Folderi|Folderat|Importo|Eksporto|Ndrysho|Vazhdo|Prano|Refuzo|Fto|Kthehu|Skano|Zgjidh)\b")
WEB = ['index.html', 'pc.html', 'app-tel.js', 'app-pc.js', 'ekipa.js', 'porta.js', 'afatet.js', 'njoftimet.js', 'pajisjet.js', 'eksportet.js',
       'harta.js', 'marketet.js', 'temat.js', 'lejet.js', 'skedaret.js', 'firebase-tel.js', 'firebase-pc.js', 'ruajtja.js']
def pa_komente_js(s):
    s = re.sub(r'/\*.*?\*/', '', s, flags=re.S)
    return re.sub(r'(?m)(^|[^:\\\'"])//[^\n]*', r'\1', s)
def vargjet_js(s):
    out = []
    for m in re.finditer(r"'((?:[^'\\\n]|\\.)*)'|\"((?:[^\"\\\n]|\\.)*)\"", s):
        t = m.group(1) if m.group(1) is not None else m.group(2)
        t = t.replace("\\'", "'").replace('\\"', '"').replace('\\n', '\n')
        out.append(t)
    return out
def html(s):
    s = re.sub(r'<script.*?</script>|<style.*?</style>|<!--.*?-->', '', s, flags=re.S)
    out = [re.sub(r'\s+', ' ', x).strip() for x in re.findall(r'>([^<>]+)<', s)]
    out += re.findall(r'(?:placeholder|title|aria-label|alt)="([^"]+)"', s)
    return out
def mblidh(lloji):
    d = {}
    if lloji in ('web', 'krejt'):
        for f in WEB:
            s = open(os.path.join(RR, f), encoding='utf-8').read()
            l = html(s) if f.endswith('.html') else vargjet_js(pa_komente_js(s))
            for t in l:
                # HTML brenda vargjeve të JS-it (innerHTML): vetëm tekstet dhe atributet e tij
                for u in (html('>' + t + '<') if ('<' in t and '>' in t) else [t]): d.setdefault(u, set()).add(f)
    if lloji in ('android', 'krejt'):
        for f in glob.glob(os.path.join(RR, 'vendas/app/src/main/java/site/stoku/vendas/**/*.kt'), recursive=True):
            if f.endswith('TeRejat.kt'): continue
            s = pa_komente_js(open(f, encoding='utf-8').read())
            for t0 in re.findall(r'"((?:[^"\\\n]|\\.)*)"', s):
                t0 = t0.replace('\\"', '"').replace('\\n', '\n')
                # Shabllonet e Kotlin-it ndahen në pjesët fikse (fjalori i përkthen pjesë-pjesë brenda tekstit të plotë)
                for t in re.split(r'\$\{[^}]*\}|\$[A-Za-z_][A-Za-z0-9_.]*(?:\(\))?', t0):
                    t = t.replace('\\$', '$')
                    d.setdefault(t, set()).add(os.path.basename(f))
    return {t: sorted(f) for t, f in d.items() if ALB.search(t) and len(t.strip()) > 1 and not re.match(r'^(stoku:|[a-z_]+:|#|\.|data-|https?:)', t)}
if __name__ == '__main__':
    lloji = sys.argv[1] if len(sys.argv) > 1 else 'web'
    fj = json.load(open(os.path.join(RR, 'perkthimi', 'en.json'), encoding='utf-8')).get('fjalet', {})
    d = mblidh(lloji)
    mungon = {t: f for t, f in d.items() if t not in fj and t.strip() not in fj}
    json.dump(sorted(mungon), sys.stdout, ensure_ascii=False, indent=0)
    print('\n', len(d), 'gjithsej,', len(mungon), 'pa përkthim', file=sys.stderr)
