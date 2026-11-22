#!/usr/bin/env python3
"""v355: nxjerr tekstet shqip të pamjes (HTML + vargjet e JS-it/Kotlin-it) që s'janë ende te perkthimi/en.json.
Përdorimi: python3 teste/perkthimi-nxirr.py [web|android|krejt] -> lista JSON në dalje."""
import re, json, sys, glob, os
RR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
# Teksti shqip: ë/ç ose fjalë shqipe të zakonshme (pa dallim shkronjash të mëdha/vogla)
ALB = re.compile(r"(?i)[ëç]|\b(dhe|për|në|nga|të|një|ka|je|ke|ose|më|s'|te|e|i|si|jo|po|ku|sa|mund|duhet|ende|edhe|kjo|ky|tani|pas|para|deri|apo|nuk|sot|dje|nesër|afat\w*|mall\w*|grup\w*|folder\w*|produkt\w*|vizitor\w*|koleg\w*|market\w*|furnizues\w*|sasi\w*|barkod\w*|llogari\w*|fjalëkalim\w*|cilësim\w*|njoftim\w*|skad\w*|hiq\w*|fshi\w*|shto\w*|ruaj\w*|zgjidh\w*|kliko|prek|hap\w*|mbyll\w*|ditë\w*|muaj\w*|javë|ora|orën|copë|fletë\w*|kamer\w*|lej\w*|pajisje\w*|telefon\w*|kompjuter\w*|emr\w*|emri|përdorues\w*|kursor\w*|fush\w*|shembull\w*|prov\w*|hyr\w*|dil\w*|dalje|gabim\w*|kontroll\w*|provo|internet\w*|rifresko|sinkron\w*|zbrit|rrit|bashk\w*|kthe\w*|import\w*|eksport\w*|ndrysho\w*|pamj\w*|tem\w*|ngjyr\w*|shkronj\w*|madh\w*|vogël|normale|automatike|errët|çelët|letër|udhëzim\w*|Anulo|Kërko|Vazhdo|Prano|Refuzo|Fto|Skano|Kthehu|Ballina|Kolegët|Aktiviteti|Kalendari)\b")
# Jo tekst: klasat e CSS-it, shtigjet, çelësat
JO = re.compile(r"^\s*([a-z][a-z0-9]*(-{1,2}[a-z0-9]+)+(\s+[a-z][a-z0-9-]*)*|/[\w/.-]*|[a-z]+[A-Z]\w*|[a-z0-9_]+)\s*$")
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
    return {t: sorted(f) for t, f in d.items() if ALB.search(t) and not JO.match(t) and len(t.strip()) > 1 and not re.match(r'^(stoku:|[a-z_]+:|#|\.|data-|https?:)', t)}
if __name__ == '__main__':
    lloji = sys.argv[1] if len(sys.argv) > 1 else 'web'
    en = json.load(open(os.path.join(RR, 'perkthimi', 'en.json'), encoding='utf-8'))
    fj = dict(en.get('fjalet', {}))
    # "injoro": vargje që s'janë tekst i pamjes (CSS, JSON, emra teknikë): s'përkthehen
    for t in en.get('injoro', []): fj[t] = t
    d = mblidh(lloji)
    mungon = {t: f for t, f in d.items() if t not in fj and t.strip() not in fj}
    json.dump(sorted(mungon), sys.stdout, ensure_ascii=False, indent=0)
    print('\n', len(d), 'gjithsej,', len(mungon), 'pa përkthim', file=sys.stderr)
