#!/usr/bin/env python3
"""Ndërton beta/index.html nga index.html (faqja e telefonit), me pamjen e re (stoku-beta.css + beta.js).

Beta s'ka logjikë të vetën: merr krejt kodin e index.html, i ndërron shtigjet (skedarët e përbashkët
merren nga "../"), i shton stilin dhe skriptin e betës, dhe disa "grepa" të vegjël (StokuBeta.*) ku beta.js
e rregullon pamjen. Kështu çdo rregullim i index.html kalon edhe te beta: pas çdo ndryshimi te index.html
ekzekuto:  python3 beta/nderto.py
Nëse një pjesë e kodit që kërkohet këtu s'gjendet më, skripti ndalet me gabim (s'e prish betën në heshtje).
"""
import os
import re
import sys

KETU = os.path.dirname(os.path.abspath(__file__))
RRENJA = os.path.dirname(KETU)
VERSIONI_BETA = '1'  # rrite kur ndryshon stoku-beta.css ose beta.js (edhe te beta/sw.js)

t = open(os.path.join(RRENJA, 'index.html'), encoding='utf-8').read()


def nderro(vjeter, ri, sa=1, rx=False):
    global t
    n = len(re.findall(vjeter, t)) if rx else t.count(vjeter)
    if n != sa:
        sys.exit('nderto.py: prita %d, gjeta %d: %r' % (sa, n, vjeter[:90]))
    t = re.sub(vjeter, ri, t) if rx else t.replace(vjeter, ri)


# 1) Skedarët e përbashkët nga rrënja
nderro(r'<script src="((?:xlsx|bashkimi|ruajtja|afatet|ekipa|njoftimet|teRejat|porta)\.js\?v=\d+)"></script>',
       r'<script src="../\1"></script>', sa=8, rx=True)
nderro('<link rel="apple-touch-icon" href="apple-touch-icon.png">', '<link rel="apple-touch-icon" href="../apple-touch-icon.png">')
nderro('<link rel="icon" type="image/png" href="icon-192.png">', '<link rel="icon" type="image/png" href="../icon-192.png">')
nderro(r'<link rel="manifest" href="manifest\.webmanifest\?v=\d+">',
       '<link rel="manifest" href="manifest.webmanifest?v=' + VERSIONI_BETA + '">', rx=True)
nderro('<img id="logoSlika" src="logo.png" alt="Stoku">', '<img id="logoSlika" src="../logo.png" alt="Stoku">')
nderro("icon: './icon-192.png', badge: './icon-192.png'", "icon: '../icon-192.png', badge: '../icon-192.png'")
# Kompjuteri s'ka ende version beta: hapet pc.html i zakonshëm
nderro("location.replace('pc.html' +", "location.replace('../pc.html' +")
nderro('id="lidhjaPc" href="pc.html"', 'id="lidhjaPc" href="../pc.html"')
nderro('<meta name="apple-mobile-web-app-title" content="Stoku">', '<meta name="apple-mobile-web-app-title" content="Stoku β">')
nderro(r'<title>[^<]*</title>', '<title>Stoku Beta</title>', rx=True)

# Lidhja "Provo Beta" (te Stoku vetëm për administratorin) këtu kthen te pamja e zakonshme, për krejt
nderro('<a class="btn tekst lidhje-beta" id="lidhjaBeta" href="beta/" hidden>Provo pamjen e re (Beta) ›</a>',
       '<a class="btn tekst lidhje-beta" id="lidhjaBeta" href="../">Kthehu te pamja e zakonshme ›</a>')
nderro("    $('lidhjaBeta').hidden = !(typeof ekK !== 'undefined' && ekK && ekK.eshteAdmin());\n", '')

# Tekste të dizajnit
nderro("      kerkoGlobalLabel: 'Kërko',", "      kerkoGlobalLabel: 'Kërko produkt ose barkod',")

# 2) Stili dhe skripti i betës (beta.js para kodit të aplikacionit, që grepat ta gjejnë)
nderro('</head>', '<link rel="stylesheet" href="stoku-beta.css?v=' + VERSIONI_BETA + '">\n</head>')
nderro('<script src="../xlsx.js', '<script src="beta.js?v=' + VERSIONI_BETA + '"></script>\n<script src="../xlsx.js')

# 3) Grepat
nderro("""    k.appendChild(m); k.appendChild(d);
    // Shtypje e gjatë (~0.5 s) → nis zgjedhjen""", """    k.appendChild(m); k.appendChild(d);
    if (window.StokuBeta) window.StokuBeta.kartaAfatit(k, a, st, n);
    // Shtypje e gjatë (~0.5 s) → nis zgjedhjen""")
nderro("""      frag.appendChild(karta);
    });
    cont.appendChild(frag);
  }
""", """      frag.appendChild(karta);
    });
    cont.appendChild(frag);
    if (window.StokuBeta) window.StokuBeta.pasFolderave(cont);
  }
""")
# API vetëm për lexim (dhe hapjen e faqeve) për beta.js
nderro("""    else if (g.cilesimet) hapOpsionet();
  })();
})();
</script>""", """    else if (g.cilesimet) hapOpsionet();
  })();
  window.StokuBetaAPI = {
    produktet: function () { return Object.keys(produktet).map(function (k) { return produktet[k]; }); },
    foldera: function () { return foldera.slice(); },
    afatet: function () { return afatet.slice(); },
    perdoruesi: function () { return perdoruesiAktual(); },
    emri: function () { return emriPerdoruesitAktual(); },
    hapFolderin: hapFolderin
  };
  if (window.StokuBeta) window.StokuBeta.gati();
})();
</script>""")

nderro('<!DOCTYPE html>\n', '<!DOCTYPE html>\n<!-- SKEDAR I GJENERUAR nga beta/nderto.py (burimi: index.html). Mos e ndrysho me dorë. -->\n')
open(os.path.join(KETU, 'index.html'), 'w', encoding='utf-8').write(t)

# 4) Service worker-i i betës (scope /beta/): versionet e skedarëve të përbashkët merren nga index.html,
#    emri i cache-it ndjek edhe versionin e sw.js kryesor, që beta të përditësohet bashkë me Stoku-n.
teperbashket = re.findall(r'<script src="\.\./([a-zA-Z]+\.js\?v=\d+)"></script>', t)
cache_rrenja = re.search(r"var CACHE = '([^']+)'", open(os.path.join(RRENJA, 'sw.js'), encoding='utf-8').read()).group(1)
v_af = [x for x in teperbashket if x.startswith('afatet.js')][0]
v_nj = [x for x in teperbashket if x.startswith('njoftimet.js')][0]
sw = open(os.path.join(KETU, 'sw-shabllon.js'), encoding='utf-8').read()
sw = sw.replace('__CACHE__', 'stoku-beta-' + VERSIONI_BETA + '-' + cache_rrenja)
sw = sw.replace('__IMPORT__', "'../%s', '../%s'" % (v_af, v_nj))
sw = sw.replace('__SHELL__', ',\n'.join("  '../%s'" % x for x in teperbashket) + ',\n' +
                "  './stoku-beta.css?v=%s',\n  './beta.js?v=%s',\n  './manifest.webmanifest?v=%s'," % ((VERSIONI_BETA,) * 3))
open(os.path.join(KETU, 'sw.js'), 'w', encoding='utf-8').write(
    '// SKEDAR I GJENERUAR nga beta/nderto.py (burimi: beta/sw-shabllon.js). Mos e ndrysho me dorë.\n' + sw)
print('beta/index.html dhe beta/sw.js u ndërtuan')
