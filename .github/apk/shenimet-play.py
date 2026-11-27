# Shënimet e versionit për Google Play ("What's new", pronari 27.11.2026: "release notes me i shkru sakt se ... nuk pat kurgjo").
# Përdorimi: python3 .github/apk/shenimet-play.py tel|ora DOSJA
#  - tel: hyrjet e fundit te vendas/.../TeRejat.kt, të përkthyera me perkthimi/en.json (gjuha bazë e Play-it: en-US)
#  - ora: ora/play-te-rejat.txt (anglisht; paragrafi i parë = versioni i fundit)
# Shkruan DOSJA/whatsnew-en-US (Play pranon deri 500 shkronja për gjuhë). Pa tekst → s'shkruan gjë (Play mban të vjetrin).
import json, pathlib, re, sys

MAKS = 500
lloji, dosja = sys.argv[1], pathlib.Path(sys.argv[2])
dosja.mkdir(parents=True, exist_ok=True)

def shkurto(rreshtat):
    t = ''
    for r in rreshtat:
        tjeter = (t + '\n' + r) if t else r
        if len(tjeter) > MAKS: break
        t = tjeter
    return t

if lloji == 'tel':
    s = pathlib.Path('vendas/app/src/main/java/site/stoku/vendas/TeRejat.kt').read_text(encoding='utf-8')
    fj = json.loads(pathlib.Path('perkthimi/en.json').read_text(encoding='utf-8')).get('fjalet', {})
    STR = r'"((?:[^"\\]|\\.)*)"'
    un = lambda x: x.replace('\\"', '"').replace('\\\\', '\\').replace('\\$', '$')
    en = lambda x: fj.get(x.strip(), x)
    rreshtat = []
    for i, m in enumerate(re.finditer(r'Hyrja\((\d+),\s*' + STR + r',\s*' + STR + r',\s*listOf\((.*?)\)\)', s, re.S)):
        if i >= 3: break
        bl = [en(un(m.group(3)))] + ['• ' + en(un(x)) for x in re.findall(STR, m.group(4))]
        if i > 0: bl = [''] + bl
        rreshtat += bl
    t = shkurto(rreshtat).strip()
else:
    p = pathlib.Path('ora/play-te-rejat.txt')
    t = p.read_text(encoding='utf-8').strip().split('\n\n')[0].strip() if p.exists() else ''
    t = shkurto(t.split('\n')).strip()

if t:
    (dosja / 'whatsnew-en-US').write_text(t + '\n', encoding='utf-8')
    print('whatsnew-en-US (%d shkronja):\n%s' % (len(t), t))
else:
    print('Pa shënime për Play')
