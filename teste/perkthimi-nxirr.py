#!/usr/bin/env python3
"""v355: nxjerr tekstet shqip të pamjes (HTML + vargjet e JS-it/Kotlin-it) që s'janë ende te perkthimi/en.json.
Përdorimi: python3 teste/perkthimi-nxirr.py [web|android|krejt] -> lista JSON në dalje."""
import re, json, sys, glob, os
RR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
# v355 (pronari: "kshyr kunke harru fjale ose fjali pa i perkthy", p.sh. "Krejt"): çdo varg me të paktën 2 shkronja numërohet;
# ai që s'është tekst i pamjes (CSS, kod, emra teknikë, të dhëna shembull) shtohet te "injoro" i perkthimi/en.json.
ALB = re.compile(r"[A-Za-zËÇëç]{2}")
# Jo tekst: klasat e CSS-it, shtigjet, çelësat
JO = re.compile(r"^\s*([a-z][a-z0-9]*(-{1,2}[a-z0-9]+)+(\s+[a-z][a-z0-9-]*)*|/[\w/.-]*|[a-z]+[A-Z]\w*|[a-z0-9_]*_[a-z0-9_]*)\s*$")
WEB = ['index.html', 'pc.html', 'app-tel.js', 'app-pc.js', 'ekipa.js', 'porta.js', 'afatet.js', 'njoftimet.js', 'pajisjet.js', 'eksportet.js',
       'harta.js', 'marketet.js', 'temat.js', 'lejet.js', 'skedaret.js', 'firebase-tel.js', 'firebase-pc.js', 'ruajtja.js',
       # v355: njoftimet push që vijnë nga serveri (Android-i i përkthen me fjalorin kur gjuha është anglisht)
       'worker/stoku-push.js']
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
        # main + versionet github/play (jo testet)
        # 27.11.2026: edhe ora (ora/app/src/{main,github,play})
        for f in [x for d in ('main', 'github', 'play') for x in glob.glob(os.path.join(RR, 'vendas/app/src', d, 'java/site/stoku/vendas/**/*.kt'), recursive=True)
                  + glob.glob(os.path.join(RR, 'ora/app/src', d, 'java/site/stoku/ora/**/*.kt'), recursive=True)]:
            s = pa_komente_js(open(f, encoding='utf-8').read())
            # "Çfarë ka të re" (Android): 10 hyrjet e fundit duhet të kenë anglisht (në anglisht shfaqen vetëm hyrjet e përkthyera)
            if f.endswith('TeRejat.kt'):
                h = [m.start() for m in re.finditer(r'Hyrja\(\d+,', s)]
                s = s[h[0]:h[10]] if len(h) > 10 else ''
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
