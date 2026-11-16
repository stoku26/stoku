#!/usr/bin/env python3
"""Logoja e Stoku-t (v314): vetëm shkronjat "stoku." (Onest 800) dhe ikona nr. 4 e pronarit:
"stoku." e bardhë me pikë të gjelbër mbi sfond të zi. Pronari: "hiqja ikonen ... bone si logo me shkronja te mdhaja",
"nr 4 osht perfekt per ikonat", "te cilesimet pamja qato logot komplet fshij" (25 kombinimet e v313 u hoqën).
Në madhësi shumë të vogla (skeda e shfletuesit, njoftimet, komplikacioni i orës) përdoret "s." që të lexohet.

Këto i shkruan VETËM ky skedar (mos i ndrysho me dorë):
  - logot.js: blloku DATA midis /* LOGOT-FILLIMI */ dhe /* LOGOT-FUNDI */
  - css/stoku-logot.css: ngjyrat dhe përmasat e logos
  - index.html, pc.html: logoja e kokës midis <!-- LOGO-FILLIMI --> dhe <!-- LOGO-FUNDI -->
  - logo/*.svg; PNG-të pastaj: node teste/logot-png.js
  - vendas: ui/Logot.kt, drawable/ic_launcher_foreground.xml, ic_launcher_monochrome.xml, ic_njoftim.xml, values/colors.xml (ikona_sfondi)
  - ora: drawable/ic_launcher_foreground.xml, ikona_sfondi.xml, ic_stoku.xml, tile_preview.xml, logo_stoku.xml

Varësitë (një herë, jashtë repo-s):
  python3 -m venv /tmp/vl && /tmp/vl/bin/pip install fonttools uharfbuzz skia-pathops
Përdorimi (nga rrënja e repo-s):
  /tmp/vl/bin/python teste/logot-gjenero.py && node teste/logot-png.js
"""
import math, os, re, sys
import pathops
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

RR = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
VENDAS = os.path.join(RR, 'vendas/app/src/main')
FONTI = os.path.join(VENDAS, 'res/font/onest.ttf')
PESHA, HAPESIRA = 800, -0.03

# Ngjyrat: ikona (sfondi, shkronjat, pika); logoja brenda faqes: shkronjat me ngjyrën e tekstit, pika e çelët / e errët
NG = {'bg': '#14161b', 'fg': '#ffffff', 'ac': '#4ade80', 'acL': '#16a34a', 'acD': '#4ade80'}
# Ikona nr. 5 (pronari: "5-shin e bon ne white mode"): e bardhë, shkronjat e zeza, pika e gjelbër
NG_C = {'bg': '#ffffff', 'fg': '#14161b', 'ac': '#16a34a'}


def nr(v):
    s = ('%.2f' % v).rstrip('0').rstrip('.')
    return '0' if s in ('', '-0') else s


def fjala(tekst, madhesia=100.0):
    blob = hb.Blob.from_file_path(FONTI)
    font = hb.Font(hb.Face(blob))
    font.set_variations({'wght': float(PESHA)})
    buf = hb.Buffer()
    buf.add_str(tekst)
    buf.guess_segment_properties()
    hb.shape(font, buf, {'kern': True, 'liga': False, 'calt': False})
    tt = instantiateVariableFont(TTFont(FONTI), {'wght': float(PESHA)})
    k = madhesia / tt['head'].unitsPerEm
    gs, order = tt.getGlyphSet(), tt.getGlyphOrder()
    glifet, x, n = [], 0.0, len(buf.glyph_infos)
    for i, (info, pos) in enumerate(zip(buf.glyph_infos, buf.glyph_positions)):
        p = pathops.Path()
        gs[order[info.codepoint]].draw(TransformPen(p.getPen(), (k, 0, 0, -k, x + pos.x_offset * k, -pos.y_offset * k)))
        glifet.append(p)
        x += pos.x_advance * k + (HAPESIRA * madhesia if i < n - 1 else 0)
    return glifet


def bashko(paths):
    z = pathops.Path()
    for p in paths:
        z = pathops.op(z, p, pathops.PathOp.UNION)
    return z


def kufijte(paths):
    x0 = y0 = 1e9
    x1 = y1 = -1e9
    for p in paths:
        a, b, c, d = p.bounds
        x0, y0, x1, y1 = min(x0, a), min(y0, b), max(x1, c), max(y1, d)
    return x0, y0, x1, y1


def ne_d(p, tr=None):
    pen = SVGPathPen(None, ntos=nr)
    if tr:
        p = p.transform(*tr)
    p.draw(pen)
    return pen.getCommands()


def vendos(pjeset, R, cx, cy):
    """Shkallëzon shkronjat që kutia e tyre të hyjë në rrethin me rreze R, në mes (cx, cy). Kthen {t, p}."""
    x0, y0, x1, y1 = kufijte(pjeset)
    w, h = x1 - x0, y1 - y0
    s = R / math.hypot(w / 2, h / 2)
    tr = (s, 0, 0, s, cx - (x0 + w / 2) * s, cy - (y0 + h / 2) * s)
    return {'t': ne_d(pjeset[0], tr), 'p': ne_d(pjeset[1], tr)}


# ---------- Llogaritja ----------
G = fjala('stoku.', 37.3)
SHKRONJAT, PIKA = bashko(G[:5]), G[5]
FJ_X0, FJ_Y0, FJ_X1, FJ_Y1 = kufijte([SHKRONJAT, PIKA])
FJ_W, FJ_H = FJ_X1 - FJ_X0, FJ_Y1 - FJ_Y0
TR_FJ = (1, 0, 0, 1, -FJ_X0, -FJ_Y0)
GS = fjala('s.', 100)
# Ikona përshtatëse 108 (zona e dukshme 72 në mes, zona e sigurt rreth me rreze 33): fjala brenda rrethit 30.5
IKONA = vendos([SHKRONJAT, PIKA], 30.5, 54, 54)
IKONA_S = vendos([GS[0], GS[1]], 22.5, 54, 54)

DATA = {
    'fjala': {'w': round(FJ_W, 2), 'h': round(FJ_H, 2), 't': ne_d(SHKRONJAT, TR_FJ), 'p': ne_d(PIKA, TR_FJ)},
    'ikona': IKONA, 'ikonaS': IKONA_S,
}


def svg_ikona(e_vogel=False, katror=False, madhesia=512, ng=None):
    """Ikona në rrjetën 108 e prerë te zona e dukshme 18..90: katror (maskable/apple) ose katror i rrumbullakosur"""
    I = IKONA_S if e_vogel else IKONA
    NG_ = ng or NG
    sfondi = ('<rect x="18" y="18" width="72" height="72" fill="%s"/>' % NG['bg'] if katror
              else '<rect x="18" y="18" width="72" height="72" rx="17" fill="%s"%s/>' % (NG_['bg'], ' stroke="#d9d7d2" stroke-width="0.6"' if NG_ is NG_C else ''))
    if katror:
        sfondi = '<rect x="18" y="18" width="72" height="72" fill="%s"/>' % NG_['bg']
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="18 18 72 72">%s<path fill="%s" d="%s"/><path fill="%s" d="%s"/></svg>' % (
        madhesia, madhesia, sfondi, NG_['fg'], I['t'], NG_['ac'], I['p']))


def svg_logo(tekst, pika):
    F = DATA['fjala']
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="%s" height="%s" viewBox="0 0 %s %s"><path fill="%s" d="%s"/><path fill="%s" d="%s"/></svg>' % (
        nr(F['w'] * 4), nr(F['h'] * 4), nr(F['w']), nr(F['h']), tekst, F['t'], pika, F['p']))


# ---------- Shkrimi i skedarëve ----------
def shkruaj(rel, tekst):
    p = os.path.join(RR, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(tekst)
    print('  shkrova', rel)


def zevendeso_bllokun(rel, fillimi, fundi, tekst):
    p = os.path.join(RR, rel)
    with open(p, encoding='utf-8') as f:
        s = f.read()
    i, j = s.find(fillimi), s.find(fundi)
    if i < 0 or j < 0:
        sys.exit('mungojnë shenjat %s / %s te %s' % (fillimi, fundi, rel))
    s = s[:i + len(fillimi)] + tekst + s[j:]
    with open(p, 'w', encoding='utf-8') as f:
        f.write(s)
    print('  përditësova', rel)


def js_data():
    F, I, S = DATA['fjala'], DATA['ikona'], DATA['ikonaS']
    rr = ['  var DATA = {',
          '    // Logoja: shkronjat "stoku." (t) dhe pika (p), %s x %s' % (nr(F['w']), nr(F['h'])),
          "    fjala: { w: %s, h: %s, t: '%s', p: '%s' }," % (nr(F['w']), nr(F['h']), F['t'], F['p']),
          '    // Ikona (rrjeta 108, zona e dukshme 18..90): fjala e plotë dhe "s." për madhësitë e vogla',
          "    ikona: { t: '%s', p: '%s' }," % (I['t'], I['p']),
          "    ikonaS: { t: '%s', p: '%s' }," % (S['t'], S['p']),
          "    ngjyrat: { bg: '%s', fg: '%s', ac: '%s', acL: '%s', acD: '%s' }," % (NG['bg'], NG['fg'], NG['ac'], NG['acL'], NG['acD']),
          "    // Ikona e çelët (nr. 5) për temën e çelët",
          "    celet: { bg: '%s', fg: '%s', ac: '%s' }" % (NG_C['bg'], NG_C['fg'], NG_C['ac']),
          '  };']
    return '\n' + '\n'.join(rr) + '\n  '


def css():
    F = DATA['fjala']
    rr = ['/* E GJENERUAR nga teste/logot-gjenero.py (v314): mos e ndrysho me dorë.',
          '   Logoja vetëm me shkronja "stoku.": shkronjat me ngjyrën e tekstit, pika e gjelbër. */',
          ':root { --lg-a: %s; }' % NG['acL'],
          ':root[data-tema="dark"] { --lg-a: %s; }' % NG['acD'],
          '.stk-logo { display: block; flex: none; overflow: visible; }',
          '.stk-logo .lg-a { fill: var(--lg-a); }',
          '.stk-logo .lg-t { fill: currentColor; }',
          '/* përmasat sipas gjerësisë (raporti %s : %s) */' % (nr(F['w']), nr(F['h']))]
    for emri, w in (('etiketa', 152), ('pc', 236), ('porta', 172), ('bosh', 210)):
        rr.append('.stk-logo--%s { width: %spx; height: %spx; }' % (emri, w, nr(w * F['h'] / F['w'])))
    return '\n'.join(rr) + '\n'


def html_logo(klasa):
    F = DATA['fjala']
    return ('<svg class="stk-logo %s" viewBox="0 0 %s %s" aria-hidden="true" focusable="false"><path class="lg-t" d="%s"/><path class="lg-a" d="%s"/></svg>' % (
        klasa, nr(F['w']), nr(F['h']), F['t'], F['p']))


def kt_long(h):
    return '0xFF' + h.lstrip('#').upper()


def kotlin():
    F = DATA['fjala']
    rr = ['// E GJENERUAR nga teste/logot-gjenero.py (v314): mos e ndrysho me dorë.',
          '// Logoja vetëm me shkronja "stoku." dhe ngjyrat e ikonës (nr. 4 e pronarit), si logot.js te web-i.',
          'package site.stoku.vendas.ui', '',
          'object Logot {',
          '    /** Logoja: shkronjat (FJ_T) dhe pika (FJ_P), %s x %s */' % (nr(F['w']), nr(F['h'])),
          '    const val FJ_W = %sf' % nr(F['w']),
          '    const val FJ_H = %sf' % nr(F['h']),
          '    const val FJ_T = "%s"' % F['t'],
          '    const val FJ_P = "%s"' % F['p'],
          '    /** Ikona "s." (rrjeta 108, zona e dukshme 18..90), për fundin e fotos */',
          '    const val IK_S_T = "%s"' % IKONA_S['t'],
          '    const val IK_S_P = "%s"' % IKONA_S['p'],
          '    /** Pika: e çelët / e errët; ikona: sfondi, shkronjat, pika */',
          '    const val PIKA_CELET = %sL' % kt_long(NG['acL']),
          '    const val PIKA_ERRET = %sL' % kt_long(NG['acD']),
          '    const val IKONA_BG = %sL' % kt_long(NG['bg']),
          '    const val IKONA_FG = %sL' % kt_long(NG['fg']),
          '    const val IKONA_AC = %sL' % kt_long(NG['ac']),
          '    const val IKONA_C_BG = %sL' % kt_long(NG_C['bg']),
          '    const val IKONA_C_FG = %sL' % kt_long(NG_C['fg']),
          '    const val IKONA_C_AC = %sL' % kt_long(NG_C['ac']),
          '}']
    return '\n'.join(rr) + '\n'


def xp(ngj, d, ind='    '):
    return '%s<path android:fillColor="%s" android:pathData="%s" />' % (ind, ngj, d)


def vektor(koment, w, h, vw, vh, trupi):
    return ('<?xml version="1.0" encoding="utf-8"?>\n<!-- %s (e gjeneruar nga teste/logot-gjenero.py, mos e ndrysho me dorë) -->\n'
            '<vector xmlns:android="http://schemas.android.com/apk/res/android"\n    android:width="%sdp" android:height="%sdp"\n'
            '    android:viewportWidth="%s" android:viewportHeight="%s">\n%s\n</vector>\n' % (koment, w, h, vw, vh, trupi))


def kryesore():
    F = DATA['fjala']
    print('Logoja: fjala %s x %s' % (nr(F['w']), nr(F['h'])))
    # web
    zevendeso_bllokun('logot.js', '/* LOGOT-FILLIMI */', '/* LOGOT-FUNDI */', js_data())
    shkruaj('css/stoku-logot.css', css())
    zevendeso_bllokun('index.html', '<!-- LOGO-FILLIMI -->', '<!-- LOGO-FUNDI -->', html_logo('stk-logo--etiketa stk-etiketa__logo'))
    zevendeso_bllokun('pc.html', '<!-- LOGO-FILLIMI -->', '<!-- LOGO-FUNDI -->', html_logo('stk-logo--pc stk-etiketa__logo'))
    shkruaj('logo/favicon.svg', svg_ikona(e_vogel=True, madhesia=64))
    shkruaj('logo/stoku-icon.svg', svg_ikona(madhesia=512))
    shkruaj('logo/stoku-icon-square.svg', svg_ikona(katror=True, madhesia=512))
    shkruaj('logo/favicon-celet.svg', svg_ikona(e_vogel=True, madhesia=64, ng=NG_C))
    shkruaj('logo/stoku-icon-celet.svg', svg_ikona(madhesia=512, ng=NG_C))
    shkruaj('logo/stoku-mono.svg', '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="18 18 72 72"><path fill="#ffffff" d="%s"/><path fill="#ffffff" d="%s"/></svg>' % (
        IKONA_S['t'], IKONA_S['p']))
    shkruaj('logo/stoku-logo.svg', svg_logo('#14161b', NG['acL']))
    shkruaj('logo/stoku-logo-dark.svg', svg_logo('#f5f5f7', NG['acD']))
    # Android: ikona e nisjes (rrjeta 108 = ikona përshtatëse), njëngjyrëshja, njoftimi ("s.")
    fg = vektor('Ikona e nisjes: "stoku." e bardhë me pikë të gjelbër (sfondi ikona_sfondi i zi)', 108, 108, 108, 108,
                xp(NG['fg'].upper(), IKONA['t']) + '\n' + xp(NG['ac'].upper(), IKONA['p']))
    mono = vektor('Ikona njëngjyrëshe (Android 13+ "Ikona me temë")', 108, 108, 108, 108,
                  xp('#FFFFFFFF', IKONA['t']) + '\n' + xp('#FFFFFFFF', IKONA['p']))
    grupi = ('    <group android:translateX="-18" android:translateY="-18">\n' + xp('#FFFFFFFF', IKONA_S['t'], '        ') + '\n' +
             xp('#FFFFFFFF', IKONA_S['p'], '        ') + '\n    </group>')
    njoftimi = vektor('Ikona e vogël e njoftimit: "s."', 24, 24, 72, 72, grupi)
    shkruaj('vendas/app/src/main/res/drawable/ic_launcher_foreground.xml', fg)
    shkruaj('vendas/app/src/main/res/drawable/ic_launcher_monochrome.xml', mono)
    # ikona e çelët (nr. 5): aktivizohet nga aplikacioni kur tema është e çelët (IkonaJashtme.kt, activity-alias)
    shkruaj('vendas/app/src/main/res/drawable/ic_launcher_foreground_celet.xml',
            vektor('Ikona e nisjes e çelët: "stoku." e zezë me pikë të gjelbër (sfondi i bardhë)', 108, 108, 108, 108,
                   xp(NG_C['fg'].upper(), IKONA['t']) + '\n' + xp(NG_C['ac'].upper(), IKONA['p'])))
    shkruaj('vendas/app/src/main/res/mipmap-anydpi-v26/ic_launcher_celet.xml',
            '<?xml version="1.0" encoding="utf-8"?>\n<!-- Ikona e çelët (e gjeneruar nga teste/logot-gjenero.py) -->\n'
            '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
            '    <background android:drawable="@color/ikona_sfondi_celet" />\n'
            '    <foreground android:drawable="@drawable/ic_launcher_foreground_celet" />\n'
            '    <monochrome android:drawable="@drawable/ic_launcher_monochrome" />\n</adaptive-icon>\n')
    shkruaj('vendas/app/src/main/res/drawable/ic_njoftim.xml', njoftimi)
    ngj = os.path.join(VENDAS, 'res/values/colors.xml')
    with open(ngj, encoding='utf-8') as f:
        s = f.read()
    s2 = re.sub(r'(<color name="ikona_sfondi">)#[0-9A-Fa-f]{6}(</color>)', r'\g<1>%s\g<2>' % NG['bg'].upper(), s)
    if 'ikona_sfondi_celet' not in s2:
        s2 = s2.replace('</resources>', '    <color name="ikona_sfondi_celet">#FFFFFF</color>\n</resources>')
    if s2 == s and NG['bg'].upper() not in s:
        sys.exit('s\'u gjet ikona_sfondi te colors.xml')
    with open(ngj, 'w', encoding='utf-8') as f:
        f.write(s2)
    print('  përditësova vendas/app/src/main/res/values/colors.xml')
    shkruaj('vendas/app/src/main/java/site/stoku/vendas/ui/Logot.kt', kotlin())
    # Ora: e njëjta ikonë mbi sfond të zi, komplikacioni "s.", logoja brenda aplikacionit dhe pamja e Tile-it
    shkruaj('ora/app/src/main/res/drawable/ic_launcher_foreground.xml', fg)
    shkruaj('ora/app/src/main/res/drawable/ikona_sfondi.xml',
            '<?xml version="1.0" encoding="utf-8"?>\n<!-- Sfondi i ikonës (e gjeneruar nga teste/logot-gjenero.py) -->\n'
            '<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">\n'
            '    <solid android:color="%s" />\n</shape>\n' % NG['bg'].upper())
    shkruaj('ora/app/src/main/res/drawable/ic_stoku.xml', vektor('Ikona e komplikacionit: "s."', 24, 24, 72, 72, grupi))
    shkruaj('ora/app/src/main/res/drawable/logo_stoku.xml',
            vektor('Logoja me shkronja për ekranin e orës', nr(F['w'] / 2), nr(F['h'] / 2), nr(F['w']), nr(F['h']),
                   xp('#FFFFFFFF', F['t']) + '\n' + xp(NG['acD'].upper(), F['p'])))
    rreth = '    <path android:fillColor="%s" android:pathData="M54,0a54,54 0,1 1,0 108a54,54 0,1 1,0 -108z" />' % NG['bg'].upper()
    shkruaj('ora/app/src/main/res/drawable/tile_preview.xml',
            vektor('Pamja e Tile-it', 108, 108, 108, 108, rreth + '\n' + xp(NG['fg'].upper(), IKONA['t']) + '\n' + xp(NG['ac'].upper(), IKONA['p'])))


if __name__ == '__main__':
    kryesore()
