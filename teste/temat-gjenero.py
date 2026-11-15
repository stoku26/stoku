# v310: 20 temat e ngjyrave (10 të errëta, 10 të çelëta) nga NJË burim i vetëm.
# Shkruan: css/stoku-temat.css (web tel + PC), listën DATA brenda temat.js (midis TEMAT-FILLIMI dhe TEMAT-FUNDI),
# vendas/app/src/main/java/site/stoku/vendas/ui/Temat.kt (Android).
# Tema 1 e secilës (Mesnata, Letër) = ngjyrat e deritanishme (css/stoku-tokens.css, Tema.kt): s'ka bllok, s'ndryshon asgjë.
# Kur ndryshon një ngjyrë: ndrysho këtu, `python3 teste/temat-gjenero.py`, rrit ?v= të skedarëve (index.html, pc.html, sw.js).
import os

R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')

# n, emri, bg, surface, surface2, line, ink, ink2, muted, accent, accentText, accentTint
ERRETA = [
    (1, 'Mesnata', '#0f1115', '#171a20', '#1f232a', '#2a2e36', '#eceef2', '#c9ccd3', '#9ca1aa', '#2f6fd8', '#7aaaf2', '#16223a'),
    (2, 'Grafit', '#111112', '#1c1c1e', '#26262a', '#323236', '#f2f2f4', '#cfcfd4', '#a0a0a8', '#0a6cdc', '#64aaff', '#142338'),
    (3, 'Oqeani', '#0a1220', '#101b2e', '#16233a', '#22324d', '#e9f1fb', '#c3d2e6', '#92a5bf', '#0e7490', '#5fd4f5', '#0f2a36'),
    (4, 'Smeraldi', '#0b1513', '#11201c', '#172a25', '#22392f', '#eaf5f0', '#c4dbd1', '#8fb0a4', '#0b7a66', '#4fd8b8', '#10302a'),
    (5, 'Ametisti', '#120f1a', '#1b1727', '#241f33', '#322b45', '#f1eef8', '#d3cce4', '#a49cba', '#7c4ddb', '#b9a1ff', '#271d42'),
    (6, 'Mokë', '#14110e', '#1e1915', '#28221c', '#362e26', '#f4efe9', '#d9cfc4', '#ab9f92', '#2b6cb0', '#8cc0f5', '#18243a'),
    (7, 'Indigo', '#0e0f1c', '#161830', '#1e2140', '#2b2f55', '#eef0fb', '#cdd1ef', '#9ea3c9', '#5850ec', '#a5a1ff', '#221f4a'),
    (8, 'E zezë (OLED)', '#000000', '#0f0f11', '#18181b', '#26262b', '#f5f5f7', '#d4d4d8', '#a1a1aa', '#2563eb', '#6ea0ff', '#0f1b33'),
    (9, 'Akull', '#0f172a', '#1e293b', '#273449', '#334155', '#f1f5f9', '#cbd5e1', '#94a3b8', '#0369a1', '#67d0f8', '#123047'),
    (10, 'Trëndafili', '#150f14', '#20161e', '#2a1e28', '#3a2a37', '#f8eef4', '#e2cdd9', '#b49cab', '#be185d', '#f58ec0', '#3a1428'),
]
CELETA = [
    (1, 'Letër', '#f6f5f2', '#ffffff', '#f1efeb', '#e6e4df', '#14161b', '#3a3d44', '#6b6e76', '#1f5fc4', '#1f5fc4', '#eef3fc'),
    (2, 'Borë', '#f4f6f9', '#ffffff', '#eef1f5', '#e1e6ed', '#0f172a', '#334155', '#64748b', '#2563eb', '#1d4ed8', '#eaf1fe'),
    (3, 'Qielli', '#eef6fc', '#ffffff', '#e3f0fa', '#d3e5f3', '#0b2239', '#2d4a66', '#5a7590', '#0369a1', '#0369a1', '#e2f2fc'),
    (4, 'Mente', '#f0f7f3', '#ffffff', '#e4f1ea', '#d4e7dc', '#0f241b', '#2f4a3d', '#5c7568', '#0b7a66', '#0b6b5a', '#e1f3ee'),
    (5, 'Livando', '#f6f3fc', '#ffffff', '#eee8fa', '#e2d9f3', '#1b1430', '#3f3560', '#6b6189', '#6d28d9', '#6d28d9', '#f0e9fd'),
    (6, 'Rërë', '#f7f2ea', '#fffdf9', '#f0e8dc', '#e5dacb', '#231c14', '#4a3f33', '#75685a', '#0f766e', '#0f766e', '#e3f2ef'),
    (7, 'Indigo', '#f3f4fb', '#ffffff', '#e9ebf8', '#dcdff2', '#141631', '#383c66', '#62668f', '#4f46e5', '#4338ca', '#ecebfd'),
    (8, 'Kontrast i lartë', '#ffffff', '#ffffff', '#f2f2f4', '#c9cdd3', '#000000', '#1f2329', '#4b5058', '#0047ab', '#0047ab', '#e6eef9'),
    (9, 'Shkëmb', '#f1f5f9', '#ffffff', '#e8edf3', '#dbe2ea', '#0f172a', '#334155', '#64748b', '#1e293b', '#0f172a', '#e8edf3'),
    (10, 'Trëndafili', '#fbf3f6', '#ffffff', '#f6e7ed', '#eed6e0', '#2a1320', '#553345', '#7e5d6e', '#be185d', '#a3154f', '#fce8f1'),
]


def rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def hx(c):
    return '#%02x%02x%02x' % tuple(max(0, min(255, round(v))) for v in c)


def mix(a, b, t):  # t = sa nga b
    a, b = rgb(a), rgb(b)
    return hx(tuple(a[i] + (b[i] - a[i]) * t for i in range(3)))


def tokenat(t, erret):
    n, emri, bg, sf, sf2, ln, ink, ink2, mu, ac, act, acti = t
    d = {'bg': bg, 'surface': sf, 'surface-2': sf2, 'line': ln, 'ink': ink, 'ink-2': ink2, 'ink-4': mu,
         'accent': ac, 'accent-text': act, 'accent-tint': acti, 'inv-bg': ink, 'rem-tint': sf2, 'card-rem-line': ln}
    if erret:
        d.update({
            'sunken': mix(sf, bg, .4), 'head': mix(sf, sf2, .5), 'sidebar': mix(bg, '#000000', .25), 'line-2': mix(ln, sf, .5),
            'ink-nav': mix(ink2, mu, .4), 'ink-3': mix(ink2, mu, .6), 'muted': mix(mu, bg, .08), 'faint': mix(mu, bg, .14),
            'faint-2': mix(mu, bg, .32), 'disabled': mix(mu, bg, .6), 'control': mix(ln, ink, .15), 'track': mix(ln, ink, .07),
            'accent-press': mix(ac, '#000000', .18), 'accent-line': mix(ac, sf, .55), 'inv-fg': bg,
            'hero': mix(sf, ln, .35), 'hero-2': mix(sf2, ln, .6), 'seg-on': mix(sf2, ln, .85), 'rem': mu, 'card-rem': sf})
        d['sidebar-line'] = d['line-2']
    else:
        d.update({
            'sunken': mix(sf2, ln, .5), 'head': mix(sf, bg, .5), 'sidebar': mix(bg, ln, .35), 'sidebar-line': ln,
            'line-2': mix(ln, sf2, .75), 'ink-nav': mix(ink2, mu, .3), 'ink-3': mix(ink2, mu, .6), 'muted': mix(mu, bg, .12),
            'faint': mix(mu, bg, .25), 'faint-2': mix(mu, bg, .38), 'disabled': mix(mu, bg, .6), 'control': mix(ln, ink, .12),
            'track': mix(ln, ink, .05), 'accent-press': mix(ac, '#000000', .22), 'accent-line': mix(ac, sf, .82), 'inv-fg': sf,
            'hero': ink, 'hero-2': mix(ink, sf, .06), 'seg-on': sf, 'rem': mu, 'card-rem': mix(bg, sf, .5)})
    r, g, b = rgb(sf)
    d['tabbar'] = 'rgba(%d,%d,%d,.92)' % (r, g, b)
    r, g, b = rgb(ac)
    d['shadow-accent'] = '0 14px 30px -12px rgba(%d,%d,%d,.8)' % (r, g, b) if not erret else '0 14px 30px -12px rgba(0,0,0,.7)'
    return d


def css():
    out = ['/* v310: 20 temat e ngjyrave (Cilësimet → Pamja). E GJENERUAR nga teste/temat-gjenero.py: mos e ndrysho me dorë.',
           '   <html data-tema="dark|light" data-ngj-e="2..10" data-ngj-c="2..10">; tema 1 = ngjyrat e stoku-tokens.css. */']
    for lista, erret, k in ((ERRETA, True, 'e'), (CELETA, False, 'c')):
        for t in lista[1:]:
            d = tokenat(t, erret)
            out.append(':root[data-tema="%s"][data-ngj-%s="%d"] { /* %s */' % ('dark' if erret else 'light', k, t[0], t[1]))
            out.append('  ' + ' '.join('--sb-%s: %s;' % (a, d[a]) for a in sorted(d)))
            out.append('}')
    return '\n'.join(out) + '\n'


def js(vjeter):
    def l(lista):
        return ',\n'.join("      { n: %d, emri: '%s', bg: '%s', surface: '%s', line: '%s', ink: '%s', accent: '%s' }" % (t[0], t[1], t[2], t[3], t[5], t[6], t[9]) for t in lista)
    data = '  var DATA = {\n    erreta: [\n' + l(ERRETA) + '\n    ],\n    celeta: [\n' + l(CELETA) + '\n    ]\n  };\n'
    a, b = '/* TEMAT-FILLIMI */\n', '  /* TEMAT-FUNDI */'
    i, j = vjeter.index(a) + len(a), vjeter.index(b)
    return vjeter[:i] + data + vjeter[j:]


KT = {'bg': 'bg', 'surface': 'surface', 'surface-2': 'surface2', 'sunken': 'sunken', 'head': 'head', 'line': 'line', 'line-2': 'line2',
      'ink': 'ink', 'ink-2': 'ink2', 'ink-3': 'ink3', 'ink-4': 'ink4', 'muted': 'muted', 'faint': 'faint', 'faint-2': 'faint2',
      'disabled': 'disabled', 'control': 'control', 'track': 'track', 'accent': 'accent', 'accent-press': 'accentPress',
      'accent-text': 'accentText', 'accent-tint': 'accentTint', 'accent-line': 'accentLine', 'inv-bg': 'invBg', 'inv-fg': 'invFg',
      'hero': 'hero', 'hero-2': 'hero2', 'rem': 'rem', 'rem-tint': 'remTint', 'card-rem': 'cardRem', 'card-rem-line': 'cardRemLine'}


def kt():
    def k(h):
        return 'c(0x%s)' % h.lstrip('#')
    rr = ['package site.stoku.vendas.ui', '', 'import androidx.compose.ui.graphics.Color', '',
          '/*', ' * Hyrja 72 (web v310): 20 temat e ngjyrave te Cilësimet → Pamja. E GJENERUAR nga teste/temat-gjenero.py',
          ' * (njësoj si css/stoku-temat.css): mos e ndrysho me dorë. Tema 1 e secilës = NgjyratEErreta / NgjyratECelet.', ' */',
          'object Temat {', '    class Tema(val n: Int, val emri: String, val ngjyrat: Ngjyrat)', '',
          '    private fun c(h: Long) = Color(h or 0xFF000000)', '']
    for lista, erret, emri, baza in ((ERRETA, True, 'erreta', 'NgjyratEErreta'), (CELETA, False, 'celeta', 'NgjyratECelet')):
        rr.append('    val %s: List<Tema> = listOf(' % emri)
        rr.append('        Tema(1, "%s", %s),' % (lista[0][1], baza))
        for i, t in enumerate(lista[1:]):
            d = tokenat(t, erret)
            r, g, b = rgb(t[3])
            fusha = ', '.join('%s = %s' % (KT[a], k(d[a])) for a in KT)
            rr.append('        Tema(%d, "%s", %s.copy(%s, tabbar = Color(0xEB%02X%02X%02X)))%s' % (t[0], t[1], baza, fusha, r, g, b, ',' if i < len(lista) - 2 else ''))
        rr.append('    )')
        rr.append('')
    rr.append('    fun eErret(n: Int): Ngjyrat = (erreta.getOrNull(n - 1) ?: erreta[0]).ngjyrat')
    rr.append('    fun eCelet(n: Int): Ngjyrat = (celeta.getOrNull(n - 1) ?: celeta[0]).ngjyrat')
    rr.append('}')
    return '\n'.join(rr) + '\n'


if __name__ == '__main__':
    with open(os.path.join(R, 'temat.js'), encoding='utf-8') as fh:
        tj = fh.read()
    for f, s in (('css/stoku-temat.css', css()), ('temat.js', js(tj)), ('vendas/app/src/main/java/site/stoku/vendas/ui/Temat.kt', kt())):
        with open(os.path.join(R, f), 'w', encoding='utf-8') as fh:
            fh.write(s)
        print('u shkrua', f)
