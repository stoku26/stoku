#!/usr/bin/env python3
"""v355: perkthimi/en.json (fjalori shqip -> anglisht, i përbashkët për web-in dhe Android-in) -> perkthimi-en.js (window.STOKU_FJALORI_EN).
Android-i e lexon vetë JSON-in nga assets (vendas/app/build.gradle.kts: assets srcDir ../../perkthimi). Mos e ndrysho perkthimi-en.js me dorë."""
import json, os
RR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
d = json.load(open(os.path.join(RR, 'perkthimi', 'en.json'), encoding='utf-8'))
d['fjalet'] = dict(sorted(d.get('fjalet', {}).items()))
json.dump(d, open(os.path.join(RR, 'perkthimi', 'en.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
with open(os.path.join(RR, 'perkthimi-en.js'), 'w', encoding='utf-8') as f:
    f.write('/* Krijuar nga teste/perkthimi-gjenero.py prej perkthimi/en.json: mos e ndrysho me dorë. */\n')
    f.write('window.STOKU_FJALORI_EN = ' + json.dumps(d, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('fjalet', len(d['fjalet']), 'modelet', len(d.get('modelet', [])))
