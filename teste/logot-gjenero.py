#!/usr/bin/env python3
"""Logoja e Stoku-t (v313): seti 60 "Lista e kontrollit" (nga 100 setet e Claude Design) me 25 kombinime ngjyrash.
Pronari: krejt 25 te Cilësimet → Pamja → Logoja; zgjedhja ruhet te llogaria dhe zbatohet kudo.

Këto i shkruan VETËM ky skedar (mos i ndrysho me dorë):
  - logot.js: blloku DATA midis /* LOGOT-FILLIMI */ dhe /* LOGOT-FUNDI */
  - css/stoku-logot.css: ngjyrat e logos sipas data-logo dhe data-tema
  - index.html, pc.html: logoja e kokës midis <!-- LOGO-FILLIMI --> dhe <!-- LOGO-FUNDI -->
  - logo/*.svg me ngjyrat e parazgjedhura ("60"); PNG-të pastaj: node teste/logot-png.js
  - vendas: ui/Logot.kt, drawable/ic_launcher_foreground.xml, ic_launcher_monochrome.xml, ic_njoftim.xml, values/colors.xml (ikona_sfondi)
  - ora: drawable/ic_launcher_foreground.xml, ikona_sfondi.xml, ic_stoku.xml, tile_preview.xml, logo_stoku.xml

Varësitë (një herë, jashtë repo-s):
  python3 -m venv /tmp/vl && /tmp/vl/bin/pip install fonttools uharfbuzz skia-pathops
Përdorimi (nga rrënja e repo-s):
  /tmp/vl/bin/python teste/logot-gjenero.py && node teste/logot-png.js
"""
import json, math, os, re, sys
import pathops
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.svgLib.path import parse_path

RR = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
VENDAS = os.path.join(RR, 'vendas/app/src/main')
ORA = os.path.join(RR, 'ora/app/src/main')


def nr(v):
    s = ('%.2f' % v).rstrip('0').rstrip('.')
    return '0' if s in ('', '-0') else s


# ---------- Shenja (rrjeta 64 x 64, si te Claude Design) ----------
def R(x, y, w, h, r):
    r = min(r or 0, w / 2, h / 2)
    if not r:
        return 'M%s %sh%sv%sh%sz' % (nr(x), nr(y), nr(w), nr(h), nr(-w))
    return ('M%s %sh%sa%s %s 0 0 1 %s %sv%sa%s %s 0 0 1 %s %sh%sa%s %s 0 0 1 %s %sv%sa%s %s 0 0 1 %s %sz' % (
        nr(x + r), nr(y), nr(w - 2 * r), nr(r), nr(r), nr(r), nr(r), nr(h - 2 * r), nr(r), nr(r), nr(-r), nr(r),
        nr(2 * r - w), nr(r), nr(r), nr(-r), nr(-r), nr(2 * r - h), nr(r), nr(r), nr(r), nr(-r)))


def PL(p):
    return 'M' + 'L'.join('%s %s' % (nr(a), nr(b)) for a, b in p)


# f = ngjyra kryesore, a = theksi, k = prerje (vrimë e vërtetë)
SHENJA = [
    {'d': R(12, 13, 11, 11, 3), 'f': 'a'},
    {'d': PL([[14.8, 18.5], [17, 20.8], [20.5, 16]]), 's': 'k', 'w': 2.2},
    {'d': R(28, 16.5, 24, 4, 2), 'f': 'f'},
    {'d': R(13, 28, 9, 9, 2.5), 's': 'f', 'w': 2.4},
    {'d': R(28, 30.5, 20, 4, 2), 'f': 'f', 'o': 0.8},
    {'d': R(13, 42, 9, 9, 2.5), 's': 'f', 'w': 2.4},
    {'d': R(28, 44.5, 16, 4, 2), 'f': 'f', 'o': 0.8},
]

# 25 kombinimet: id, emri, ikona (bg, fg, ac), logoja e çelët (br, acL), logoja e errët (dk, acD)
VARIANTET = [
    ('60', 'Gjelbër', '#2e7d4f', '#ffffff', '#d9f99d', '#2e7d4f', '#65a30d', '#86efac', '#d9f99d'),
    ('60-1', 'Blu', '#1f5fc4', '#ffffff', '#f5b942', '#1f5fc4', '#e0a020', '#7aaaf2', '#f5b942'),
    ('60-2', 'Kobalt', '#1e3a8a', '#ffffff', '#38bdf8', '#1e3a8a', '#0284c7', '#93c5fd', '#38bdf8'),
    ('60-3', 'Qielli', '#0369a1', '#ffffff', '#fcd34d', '#0369a1', '#d97706', '#7dd3fc', '#fcd34d'),
    ('60-4', 'Natë', '#0f172a', '#67d0f8', '#fbbf24', '#0f172a', '#0284c7', '#67d0f8', '#fbbf24'),
    ('60-5', 'Blu e thellë + limon', '#172554', '#ffffff', '#a3e635', '#172554', '#65a30d', '#93c5fd', '#a3e635'),
    ('60-6', 'Gurkali', '#0f766e', '#ffffff', '#fbbf24', '#0f766e', '#d97706', '#5eead4', '#fbbf24'),
    ('60-7', 'Pyll natë', '#0b3d2e', '#e7f6ee', '#4ade80', '#0b3d2e', '#16a34a', '#86efac', '#4ade80'),
    ('60-8', 'Ulliri', '#3f6212', '#ecfccb', '#facc15', '#3f6212', '#a16207', '#bef264', '#facc15'),
    ('60-9', 'Mente', '#d1fae5', '#065f46', '#10b981', '#065f46', '#059669', '#6ee7b7', '#34d399'),
    ('60-10', 'Indigo', '#4f46e5', '#ffffff', '#f9a8d4', '#4f46e5', '#db2777', '#a5b4fc', '#f9a8d4'),
    ('60-11', 'Vjollcë', '#6d28d9', '#ffffff', '#fbbf24', '#6d28d9', '#d97706', '#c4b5fd', '#fbbf24'),
    ('60-12', 'Vjollcë + mente', '#4c1d95', '#ffffff', '#6ee7b7', '#4c1d95', '#059669', '#c4b5fd', '#6ee7b7'),
    ('60-13', 'Rozë', '#be185d', '#ffffff', '#fde68a', '#be185d', '#d97706', '#f9a8d4', '#fde68a'),
    ('60-14', 'E kuqe', '#c23a33', '#ffffff', '#fde68a', '#c23a33', '#ca8a04', '#fca5a5', '#fde68a'),
    ('60-15', 'Portokalli', '#ea580c', '#ffffff', '#fde68a', '#ea580c', '#ca8a04', '#fdba74', '#fde68a'),
    ('60-16', 'Bakër', '#9a3412', '#ffedd5', '#fbbf24', '#9a3412', '#d97706', '#fdba74', '#fbbf24'),
    ('60-17', 'Qelibar', '#f5b942', '#14161b', '#1f5fc4', '#b7791f', '#1f5fc4', '#f5b942', '#7aaaf2'),
    ('60-18', 'Grafit', '#14161b', '#ffffff', '#f5b942', '#14161b', '#d99a1e', '#ffffff', '#f5b942'),
    ('60-19', 'Grafit + portokalli', '#1c1917', '#fafaf9', '#fb923c', '#1c1917', '#ea580c', '#ffffff', '#fb923c'),
    ('60-20', 'E zezë', '#000000', '#f5f5f7', '#22c55e', '#000000', '#16a34a', '#ffffff', '#22c55e'),
    ('60-21', 'Shkëmb', '#334155', '#f1f5f9', '#f59e0b', '#334155', '#d97706', '#e2e8f0', '#f59e0b'),
    ('60-22', 'E bardhë', '#ffffff', '#14161b', '#1f5fc4', '#14161b', '#1f5fc4', '#ffffff', '#7aaaf2'),
    ('60-23', 'E bardhë + jeshile', '#ffffff', '#1f2937', '#22c55e', '#1f2937', '#16a34a', '#ffffff', '#4ade80'),
    ('60-24', 'Krem', '#f6f1e7', '#3b2f22', '#c2410c', '#3b2f22', '#c2410c', '#f6f1e7', '#fb923c'),
]
FUSHAT = ('id', 'emri', 'bg', 'fg', 'ac', 'br', 'acL', 'dk', 'acD')
V = [dict(zip(FUSHAT, x)) for x in VARIANTET]
PARAZGJEDHJA = V[0]

# Fjala: "stoku" + pika me ngjyrën e theksit (Onest 800, hapësira -0.03em), si te seti 60 i Claude Design
FONTI = os.path.join(VENDAS, 'res/font/onest.ttf')
PESHA, HAPESIRA = 800, -0.03


# ---------- Rrafshimi: vijat bëhen forma, prerjet bëhen vrima të vërteta ----------
def nga_d(d):
    p = pathops.Path()
    parse_path(d, p.getPen())
    return p


def zona(e):
    baza = nga_d(e['d'])
    pjeset = []
    if e.get('f'):
        f = pathops.Path(baza)
        f.fillType = pathops.FillType.WINDING
        pjeset.append(pathops.simplify(f))
    if e.get('s') and float(e.get('w') or 0) > 0:
        s = pathops.Path(baza)
        s.stroke(float(e['w']), pathops.LineCap.ROUND_CAP, pathops.LineJoin.ROUND_JOIN, 4)
        s.convertConicsToQuads()
        pjeset.append(pathops.simplify(s))
    z = pjeset[0]
    for q in pjeset[1:]:
        z = pathops.op(z, q, pathops.PathOp.UNION)
    return z


def bosh(p):
    try:
        return abs(p.area) < 1e-3
    except Exception:
        return True


def ne_d(p, tr=None):
    pen = SVGPathPen(None, ntos=nr)
    if tr:
        p = p.transform(*tr)
    p.draw(pen)
    return pen.getCommands()


def rrafsho(el):
    shtresat = []
    for e in el:
        rol = e.get('f') or e.get('s')
        o = float(e.get('o', 1))
        z = zona(e)
        if rol == 'k':
            te_reja = []
            for (p, r, op) in shtresat:
                jashte = pathops.op(p, z, pathops.PathOp.DIFFERENCE)
                if not bosh(jashte):
                    te_reja.append([jashte, r, op])
                if o < 0.999:
                    brenda = pathops.op(p, z, pathops.PathOp.INTERSECTION)
                    if not bosh(brenda):
                        te_reja.append([brenda, r, op * (1 - o)])
            shtresat = te_reja
        else:
            shtresat.append([z, rol, o])
    mono = pathops.Path()
    for (p, r, op) in shtresat:
        if op >= 0.5:
            mono = pathops.op(mono, p, pathops.PathOp.UNION)
    return shtresat, mono


def kufijte(paths):
    x0 = y0 = 1e9
    x1 = y1 = -1e9
    for p in paths:
        a, b, c, d = p.bounds
        x0, y0, x1, y1 = min(x0, a), min(y0, b), max(x1, c), max(y1, d)
    return x0, y0, x1, y1


# ---------- Fjala "stoku." si vija ----------
def fjala(tekst, madhesia):
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


# ---------- Llogaritja ----------
SHTRESAT, MONO = rrafsho(SHENJA)
BX0, BY0, BX1, BY1 = kufijte([s[0] for s in SHTRESAT])
MH, MW = BY1 - BY0, BX1 - BX0
PAD = 2.0
LH = MH + 2 * PAD
GAP = 0.355 * MH
# madhësia e shkronjave: lartësia e "stoku" (t, k) = 0.68 e lartësisë së shenjës (si te kartat e Claude Design)
prove = bashko(fjala('stoku', 100)[:5])
_, py0, _, py1 = prove.bounds
MADHESIA = 0.68 * MH / ((py1 - py0) / 100.0)
GL = fjala('stoku.', MADHESIA)
SHKRONJAT, PIKA = bashko(GL[:5]), GL[5]
sx0, sy0, sx1, sy1 = SHKRONJAT.bounds
FX = PAD + MW + GAP - sx0                      # zhvendosja e fjalës në x
FY = LH / 2 - (sy0 + sy1) / 2                  # vija bazë: shkronjat në mes të shenjës
LW = FX + max(sx1, PIKA.bounds[2]) + PAD
TR_SHENJA_LOGO = (1, 0, 0, 1, PAD - BX0, PAD - BY0)
TR_FJALA = (1, 0, 0, 1, FX, FY)


def shtresat_d(tr=None):
    return [{'d': ne_d(p, tr), 'r': r, 'o': round(o, 3)} for (p, r, o) in SHTRESAT]


DATA = {
    'shenja': shtresat_d(),                        # rrjeta 64 (ikona: translate(6.4 6.4) scale(.8))
    'mono': ne_d(MONO),
    'kutia': [round(BX0, 2), round(BY0, 2), round(BX1, 2), round(BY1, 2)],
    'logo': {'w': round(LW, 2), 'h': round(LH, 2), 'shenja': shtresat_d(TR_SHENJA_LOGO),
             'fjala': ne_d(SHKRONJAT, TR_FJALA), 'pika': ne_d(PIKA, TR_FJALA)},
    'variantet': V,
}


def ngjyra(rol, kont):
    return kont['a'] if rol == 'a' else kont['f']


def svg_paths(shtresat, kont, klasa=False):
    out = []
    for s in shtresat:
        op = '' if s['o'] >= 0.999 else ' opacity="%s"' % nr(s['o'])
        if klasa:
            out.append('<path class="lg-%s" d="%s"%s/>' % ('a' if s['r'] == 'a' else 'f', s['d'], op))
        else:
            out.append('<path fill="%s" d="%s"%s/>' % (ngjyra(s['r'], kont), s['d'], op))
    return ''.join(out)


def svg_logo(v, erret, tekst):
    kont = {'f': v['dk'] if erret else v['br'], 'a': v['acD'] if erret else v['acL']}
    L = DATA['logo']
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="%s" height="%s" viewBox="0 0 %s %s">%s<path fill="%s" d="%s"/><path fill="%s" d="%s"/></svg>' % (
        nr(L['w'] * 4), nr(L['h'] * 4), nr(L['w']), nr(L['h']), svg_paths(L['shenja'], kont), tekst, L['fjala'], kont['a'], L['pika']))


SQUIRCLE = 'M15 0h34a15 15 0 0 1 15 15v34a15 15 0 0 1-15 15H15A15 15 0 0 1 0 49V15A15 15 0 0 1 15 0z'


def svg_ikona(v, katror=False, madhesia=64):
    kont = {'f': v['fg'], 'a': v['ac']}
    sfondi = '<rect width="64" height="64" fill="%s"/>' % v['bg'] if katror else '<path fill="%s" d="%s"/>' % (v['bg'], SQUIRCLE)
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 64 64">%s<g transform="translate(6.4 6.4) scale(0.8)">%s</g></svg>' % (
        madhesia, madhesia, sfondi, svg_paths(DATA['shenja'], kont)))


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
    L = DATA['logo']
    rr = ['  var DATA = {']
    rr.append('    // Shenja në rrjetën 64 (ikona: translate(6.4 6.4) scale(.8)); r: "f" ngjyra kryesore, "a" theksi; prerjet janë vrima të vërteta')
    rr.append('    shenja: [\n' + ',\n'.join("      { d: '%s', r: '%s', o: %s }" % (s['d'], s['r'], nr(s['o'])) for s in DATA['shenja']) + '\n    ],')
    rr.append("    mono: '%s'," % DATA['mono'])
    rr.append('    kutia: [%s],' % ', '.join(nr(x) for x in DATA['kutia']))
    rr.append('    // Logoja e plotë (shenja + "stoku" + pika), %s x %s' % (nr(L['w']), nr(L['h'])))
    rr.append('    logo: {\n      w: %s, h: %s,\n      shenja: [\n%s\n      ],\n      fjala: \'%s\',\n      pika: \'%s\'\n    },' % (
        nr(L['w']), nr(L['h']), ',\n'.join("        { d: '%s', r: '%s', o: %s }" % (s['d'], s['r'], nr(s['o'])) for s in L['shenja']), L['fjala'], L['pika']))
    rr.append('    variantet: [\n' + ',\n'.join(
        "      { id: '%s', emri: '%s', bg: '%s', fg: '%s', ac: '%s', br: '%s', acL: '%s', dk: '%s', acD: '%s' }" % tuple(v[k] for k in FUSHAT)
        for v in V) + '\n    ]')
    rr.append('  };')
    return '\n' + '\n'.join(rr) + '\n  '


def css():
    p = PARAZGJEDHJA
    rr = ['/* E GJENERUAR nga teste/logot-gjenero.py (v313): mos e ndrysho me dorë.',
          '   Logoja (seti 60) me ngjyrat e zgjedhura te Cilësimet → Pamja → Logoja (data-logo te <html>; pa atribut = "60"). */',
          ':root { --lg-f: %s; --lg-a: %s; --lg-bg: %s; --lg-fg: %s; --lg-ac: %s; }' % (p['br'], p['acL'], p['bg'], p['fg'], p['ac']),
          ':root[data-tema="dark"] { --lg-f: %s; --lg-a: %s; }' % (p['dk'], p['acD'])]
    for v in V[1:]:
        rr.append(':root[data-logo="%s"] { --lg-f: %s; --lg-a: %s; --lg-bg: %s; --lg-fg: %s; --lg-ac: %s; }' % (v['id'], v['br'], v['acL'], v['bg'], v['fg'], v['ac']))
        rr.append(':root[data-tema="dark"][data-logo="%s"] { --lg-f: %s; --lg-a: %s; }' % (v['id'], v['dk'], v['acD']))
    L = DATA['logo']
    rr += ['.stk-logo { display: block; flex: none; overflow: visible; }',
           '.stk-logo .lg-f { fill: var(--lg-f); }',
           '.stk-logo .lg-a { fill: var(--lg-a); }',
           '.stk-logo .lg-t { fill: currentColor; }',
           '/* përmasat sipas lartësisë (raporti %s : %s) */' % (nr(L['w']), nr(L['h'])),
           '.stk-logo--22 { height: 22px; width: %spx; }' % nr(22 * L['w'] / L['h']),
           '.stk-logo--40 { height: 40px; width: %spx; }' % nr(40 * L['w'] / L['h']),
           '.stk-logo--44 { height: 44px; width: %spx; }' % nr(44 * L['w'] / L['h'])]
    return '\n'.join(rr) + '\n'


def html_logo(klasa):
    L = DATA['logo']
    return ('<svg class="stk-logo %s" viewBox="0 0 %s %s" aria-hidden="true" focusable="false">%s<path class="lg-t" d="%s"/><path class="lg-a" d="%s"/></svg>' % (
        klasa, nr(L['w']), nr(L['h']), svg_paths(L['shenja'], None, klasa=True), L['fjala'], L['pika']))


def kt_long(h):
    return '0xFF' + h.lstrip('#').upper()


def kotlin():
    L = DATA['logo']
    rr = ['// E GJENERUAR nga teste/logot-gjenero.py (v313): mos e ndrysho me dorë.',
          '// Logoja (seti 60 "Lista e kontrollit") dhe 25 kombinimet e ngjyrave (Cilësimet → Pamja → Logoja), si logot.js te web-i.',
          'package site.stoku.vendas.ui', '',
          'object Logot {',
          '    class Varianti(val id: String, val emri: String, val bg: Long, val fg: Long, val ac: Long, val br: Long, val acL: Long, val dk: Long, val acD: Long)',
          '    /** rol: \'f\' ngjyra kryesore, \'a\' theksi; o: tejdukshmëria */',
          '    class Shtresa(val d: String, val rol: Char, val o: Float)', '',
          '    val variantet: List<Varianti> = listOf(']
    rr.append(',\n'.join('        Varianti("%s", "%s", %s, %s, %s, %s, %s, %s, %s)' % (
        v['id'], v['emri'], kt_long(v['bg']), kt_long(v['fg']), kt_long(v['ac']), kt_long(v['br']), kt_long(v['acL']), kt_long(v['dk']), kt_long(v['acD'])) for v in V))
    rr.append('    )')
    rr.append('    /** Shenja në rrjetën 64 (ikona: zhvendosje 6.4, shkallë 0.8) */')
    rr.append('    val shenja: List<Shtresa> = listOf(\n' + ',\n'.join('        Shtresa("%s", \'%s\', %sf)' % (s['d'], s['r'], nr(s['o'])) for s in DATA['shenja']) + '\n    )')
    rr.append('    const val MONO = "%s"' % DATA['mono'])
    rr.append('    /** Logoja e plotë (shenja + "stoku" + pika): %s x %s */' % (nr(L['w']), nr(L['h'])))
    rr.append('    const val LOGO_W = %sf' % nr(L['w']))
    rr.append('    const val LOGO_H = %sf' % nr(L['h']))
    rr.append('    val logoShenja: List<Shtresa> = listOf(\n' + ',\n'.join('        Shtresa("%s", \'%s\', %sf)' % (s['d'], s['r'], nr(s['o'])) for s in L['shenja']) + '\n    )')
    rr.append('    const val FJALA = "%s"' % L['fjala'])
    rr.append('    const val PIKA = "%s"' % L['pika'])
    rr.append('    const val PARAZGJEDHJA = "%s"' % PARAZGJEDHJA['id'])
    rr.append('    fun varianti(id: String?): Varianti = variantet.firstOrNull { it.id == id } ?: variantet[0]')
    rr.append('}')
    return '\n'.join(rr) + '\n'


def xml_shtresat(shtresat, kont, ind='        '):
    out = []
    for s in shtresat:
        alfa = '' if s['o'] >= 0.999 else ' android:fillAlpha="%s"' % nr(s['o'])
        out.append('%s<path android:fillColor="%s" android:pathData="%s"%s />' % (ind, ngjyra(s['r'], kont).upper(), s['d'], alfa))
    return '\n'.join(out)


def xml_vektor(koment, w, vp, trupi, dp=None):
    dp = dp or w
    return ('<?xml version="1.0" encoding="utf-8"?>\n<!-- %s (e gjeneruar nga teste/logot-gjenero.py, mos e ndrysho me dorë) -->\n'
            '<vector xmlns:android="http://schemas.android.com/apk/res/android"\n    android:width="%sdp" android:height="%sdp"\n'
            '    android:viewportWidth="%s" android:viewportHeight="%s">\n%s\n</vector>\n' % (koment, dp, dp, vp, vp, trupi))


def grupi(sh, tx, ty, trupi):
    return '    <group android:scaleX="%s" android:scaleY="%s" android:translateX="%s" android:translateY="%s">\n%s\n    </group>' % (nr(sh), nr(sh), nr(tx), nr(ty), trupi)


def kryesore():
    p = PARAZGJEDHJA
    print('Logoja 60: shenja %s x %s, logoja %s x %s, shkronjat %spx' % (nr(MW), nr(MH), nr(LW), nr(LH), nr(MADHESIA)))
    # web
    zevendeso_bllokun('logot.js', '/* LOGOT-FILLIMI */', '/* LOGOT-FUNDI */', js_data())
    shkruaj('css/stoku-logot.css', css())
    for f in ('index.html', 'pc.html'):
        zevendeso_bllokun(f, '<!-- LOGO-FILLIMI -->', '<!-- LOGO-FUNDI -->', html_logo('stk-logo--22 stk-etiketa__logo'))
    shkruaj('logo/favicon.svg', svg_ikona(p))
    shkruaj('logo/stoku-icon-square.svg', svg_ikona(p, katror=True, madhesia=512))
    kont = {'f': p['br'], 'a': p['acL']}
    shkruaj('logo/stoku-mark.svg', '<svg xmlns="http://www.w3.org/2000/svg" width="%s" height="%s" viewBox="%s %s %s %s">%s</svg>' % (
        nr(MW), nr(MH), nr(BX0), nr(BY0), nr(MW), nr(MH), svg_paths(DATA['shenja'], kont)))
    shkruaj('logo/stoku-mono.svg', '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="%s %s %s %s"><path fill="#ffffff" d="%s"/></svg>' % (
        nr((BX0 + BX1) / 2 - 26), nr((BY0 + BY1) / 2 - 26), 52, 52, DATA['mono']))
    shkruaj('logo/stoku-logo.svg', svg_logo(p, False, '#14161b'))
    shkruaj('logo/stoku-logo-dark.svg', svg_logo(p, True, '#f5f5f7'))
    # Android: ikona e nisjes (sipër sfondit me ngjyrë), njëngjyrëshja, njoftimi
    kont_ik = {'f': p['fg'], 'a': p['ac']}
    # ikona 64 (shenja 0.8) → zona e dukshme 72dp e ikonës përshtatëse 108dp: shkalla 0.9, zhvendosja 25.2
    fg = xml_vektor('Logoja 60 (seti 60, "Lista e kontrollit"): ikona e nisjes', 108, 108, grupi(0.9, 25.2, 25.2, xml_shtresat(DATA['shenja'], kont_ik)))
    mono = xml_vektor('Logoja 60: ikona njëngjyrëshe (Android 13+ "Ikona me temë")', 108, 108,
                      grupi(0.9, 25.2, 25.2, '        <path android:fillColor="#FFFFFFFF" android:pathData="%s" />' % DATA['mono']))
    k24 = 20.0 / max(MW, MH)
    njoftimi = xml_vektor('Logoja 60: ikona e vogël e njoftimit (njëngjyrëshe)', 24, 24,
                          grupi(k24, 12 - (BX0 + BX1) / 2 * k24, 12 - (BY0 + BY1) / 2 * k24,
                                '        <path android:fillColor="#FFFFFFFF" android:pathData="%s" />' % DATA['mono']))
    shkruaj('vendas/app/src/main/res/drawable/ic_launcher_foreground.xml', fg)
    shkruaj('vendas/app/src/main/res/drawable/ic_launcher_monochrome.xml', mono)
    shkruaj('vendas/app/src/main/res/drawable/ic_njoftim.xml', njoftimi)
    ngj = os.path.join(VENDAS, 'res/values/colors.xml')
    with open(ngj, encoding='utf-8') as f:
        s = f.read()
    s2 = re.sub(r'(<color name="ikona_sfondi">)#[0-9A-Fa-f]{6}(</color>)', r'\g<1>%s\g<2>' % p['bg'].upper(), s)
    if s2 == s and p['bg'].upper() not in s:
        sys.exit('s\'u gjet ikona_sfondi te colors.xml')
    with open(ngj, 'w', encoding='utf-8') as f:
        f.write(s2)
    print('  përditësova vendas/app/src/main/res/values/colors.xml')
    shkruaj('vendas/app/src/main/java/site/stoku/vendas/ui/Logot.kt', kotlin())
    # Ora: e njëjta ikonë mbi sfond të gjelbër, ikona e komplikacionit dhe pamja e Tile-it
    shkruaj('ora/app/src/main/res/drawable/ic_launcher_foreground.xml', fg)
    shkruaj('ora/app/src/main/res/drawable/ikona_sfondi.xml',
            '<?xml version="1.0" encoding="utf-8"?>\n<!-- Logoja 60: sfondi i ikonës (e gjeneruar nga teste/logot-gjenero.py) -->\n'
            '<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">\n'
            '    <solid android:color="%s" />\n</shape>\n' % p['bg'].upper())
    shkruaj('ora/app/src/main/res/drawable/ic_stoku.xml', njoftimi.replace('ikona e vogël e njoftimit', 'ikona e komplikacionit'))
    # logoja e plotë brenda aplikacionit të orës (sfond i zi): ngjyrat e errëta, shkronjat të bardha
    L = DATA['logo']
    kont_e = {'f': p['dk'], 'a': p['acD']}
    shkruaj('ora/app/src/main/res/drawable/logo_stoku.xml',
            '<?xml version="1.0" encoding="utf-8"?>\n<!-- Logoja 60 e plotë për ekranin e orës (e gjeneruar nga teste/logot-gjenero.py, mos e ndrysho me dorë) -->\n'
            '<vector xmlns:android="http://schemas.android.com/apk/res/android"\n    android:width="%sdp" android:height="%sdp"\n'
            '    android:viewportWidth="%s" android:viewportHeight="%s">\n%s\n'
            '    <path android:fillColor="#FFFFFFFF" android:pathData="%s" />\n    <path android:fillColor="%s" android:pathData="%s" />\n</vector>\n' % (
                nr(L['w'] / 2), nr(L['h'] / 2), nr(L['w']), nr(L['h']), xml_shtresat(L['shenja'], kont_e, '    '), L['fjala'], kont_e['a'].upper(), L['pika']))
    rreth = '    <path android:fillColor="%s" android:pathData="M54,0a54,54 0,1 1,0 108a54,54 0,1 1,0 -108z" />' % p['bg'].upper()
    shkruaj('ora/app/src/main/res/drawable/tile_preview.xml',
            xml_vektor('Logoja 60: pamja e Tile-it', 108, 108, rreth + '\n' + grupi(1.2, 54 - 32 * 1.2, 54 - 32 * 1.2, xml_shtresat(DATA['shenja'], kont_ik))))


if __name__ == '__main__':
    kryesore()
