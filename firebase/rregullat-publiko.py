# Rregullat e Firestore-it → Firebase (pronari 28.11.2026: "Qysh me mujt edhe firebase me lidh?"). GitHub Actions hyn te Google pa
# çelës (Workload Identity, service account stoku-play me rolin "Firebase Rules Admin") dhe përdor API-në Firebase Rules.
# Përdorimi: python3 firebase/rregullat-publiko.py RREGULLAT_FILE krahaso|publiko   (TOKENI në mjedis: GOOGLE_TOKEN)
#  - krahaso: lexon rregullat live dhe tregon dallimet (s'ndryshon asgjë)
#  - publiko: vetëm kur dallojnë: krijon ruleset-in e ri, e lëshon te cloud.firestore, pastaj kontrollon që live = skedari
import difflib, json, os, sys, urllib.request
P = 'projects/stoku-appi'
API = 'https://firebaserules.googleapis.com/v1/'
TOK = os.environ['GOOGLE_TOKEN']
def thirr(metoda, rruga, trupi=None):
    k = urllib.request.Request(API + rruga, method=metoda, data=None if trupi is None else json.dumps(trupi).encode(),
                               headers={'Authorization': 'Bearer ' + TOK, 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(k) as r: return json.load(r)
    except urllib.error.HTTPError as e:
        print('::error::Firebase Rules %s %s → %s %s' % (metoda, rruga, e.code, e.read().decode()[:500])); sys.exit(1)
def live():
    rel = thirr('GET', P + '/releases/cloud.firestore')
    rs = thirr('GET', rel['rulesetName'])
    f = [x for x in rs['source']['files']]
    return rel, rs['name'], (f[0]['content'] if f else '')
skedari, menyra = sys.argv[1], sys.argv[2]
ri = open(skedari, encoding='utf-8').read()
rel, emri, vjeter = live()
print('Live: %s (%s), %d shkronja; repo: %d shkronja' % (emri, rel.get('updateTime', ''), len(vjeter), len(ri)))
if vjeter.strip() == ri.strip():
    print('Rregullat live = repo (s\'ka çka të publikohet).'); sys.exit(0)
d = list(difflib.unified_diff(vjeter.splitlines(), ri.splitlines(), 'live', 'repo', lineterm='', n=1))
print('Dallimet (%d rreshta):' % len(d)); print('\n'.join(d[:400]))
if menyra != 'publiko':
    print('::warning::Rregullat live dallojnë nga repo (vetëm krahasim, s\'u publikua asgjë).'); sys.exit(0)
rs = thirr('POST', P + '/rulesets', {'source': {'files': [{'name': 'firestore.rules', 'content': ri}]}})
thirr('PATCH', P + '/releases/cloud.firestore', {'release': {'name': P + '/releases/cloud.firestore', 'rulesetName': rs['name']}})
_, emri2, pas = live()
if pas.strip() != ri.strip(): print('::error::Pas publikimit rregullat live s\'janë si repo'); sys.exit(1)
print('U publikua: %s (live = repo).' % emri2)
