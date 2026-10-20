const AF = require('../afatet.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const mem = {}; const ls = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); } };
const K = AF.krijoKujtesen(ls);
ok(K.merr('390') === null, 'bosh');
ok(K.meso(' 3900 001 ', 'Coca  Cola 1.25L ', 'Laberion') && K.merr('3900001').emri === 'Coca Cola 1.25L' && K.merr('3900001').furnizuesi === 'Laberion', 'mëson (barkodi pa hapësira, emri i pastruar)', K.merr('3900001'));
ok(!K.meso('3900001', 'Coca Cola 1.25L', 'Laberion'), 'e njëjta → s\'ndryshon');
ok(!K.meso('3900001', 'Tjetër', 'Tjetër', 'plotëso') && K.merr('3900001').emri === 'Coca Cola 1.25L', 'plotëso s\'mbishkruan');
ok(K.meso('3900001', 'Coca Cola 1.5L', '') && K.merr('3900001').emri === 'Coca Cola 1.5L' && K.merr('3900001').furnizuesi === 'Laberion', 'mbishkruaj: emri i ri, furnizuesi bosh s\'e fshin', K.merr('3900001'));
ok(K.meso('3900002', 'Ujë', '', 'plotëso') && K.meso('3900002', '', 'Rugove', 'plotëso') && K.merr('3900002').furnizuesi === 'Rugove', 'plotëso: shton furnizuesin që mungon');
ok(K.mesoShume([{ barkodi: 'a1', emri: 'A' }, { barkodi: 'a2', furnizuesi: 'F' }, { barkodi: '', emri: 'x' }, { barkodi: 'a3' }], 'plotëso') === 2, 'mesoShume: vetëm me barkod + emër/furnizues');
const K2 = AF.krijoKujtesen(ls); ok(K2.merr('3900001') && K2.merr('3900001').emri === 'Coca Cola 1.5L' && K2.numri() === 4, 'ruhet (lexohet nga një instancë e re)', K2.numri());
ok(K.vendos('3900001', 'Coca-Cola 1.5 L', '') && K.merr('3900001').furnizuesi === '' && K.merr('3900001').meDore, 'vendos me dorë: saktë, edhe fshin furnizuesin', K.merr('3900001'));
ok(!K.meso('3900001', '', 'X', 'plotëso') && K.merr('3900001').furnizuesi === '' && K.meso('3900001', '', 'X') && K.merr('3900001').furnizuesi === 'X' && K.merr('3900001').meDore, 'e ndryshuar me dorë: plotëso s\'e prek, ruajtja po (mbetet me dorë)');
ok(K.riemertoFurnizuesin('rugove', 'Rugova Water') === 1 && K.merr('3900002').furnizuesi === 'Rugova Water', 'riemërtimi i furnizuesit (pa dallim shkronjash)');
ok(K.vendos('a1', '', '') && K.merr('a1') === null, 'vendos bosh → hiqet');
ok(K.fshij('a2') && !K.fshij('a2') && K.merr('a2') === null, 'fshij');
ok(K.lista().map(x => x.emri).join('|') === 'Coca-Cola 1.5 L|Ujë', 'lista e renditur', K.lista().map(x => x.emri));
ok(!K.meso('a2', 'A2', 'F', 'plotëso') && K.merr('a2') === null && K.lista().every(x => x.barkodi !== 'a2'), 'e harruar: mësimi në sfond s\'e kthen, s\'del në listë');
ok(K.meso('a2', 'A2 i ri', '') && K.merr('a2').emri === 'A2 i ri', 'e harruar: ruajtja e re nga përdoruesi e kthen');
mem['stoku:kujtesa:v1'] = '[1,2]'; const K3 = AF.krijoKujtesen(ls); ok(K3.numri() === 0 && K3.meso('b', 'B'), 'ruajtje e prishur → fillon bosh');
const ls4 = { getItem: () => null, setItem: () => { throw new Error('QuotaExceeded'); } }; const K4 = AF.krijoKujtesen(ls4); ok(K4.meso('b', 'B') && K4.merr('b').emri === 'B', 'memoria plot: s\'rrëzohet, mban për seancën');
// ---- v197: sinkronizimi me grupin ----
{
  const m2 = {}; const ls2 = { getItem: k => (k in m2 ? m2[k] : null), setItem: (k, v) => { m2[k] = String(v); } };
  const G = AF.krijoKujtesen(ls2); const ndr = []; G.degjo(bs => ndr.push(...bs));
  G.mesoShume([{ barkodi: '111', emri: 'Auto 111', furnizuesi: 'F1' }, { barkodi: '222', emri: 'Auto 222' }], 'plotëso');
  G.meso('333', 'Imi 333', 'F3');
  ok(ndr.join() === '111,222,333,furnizuesi F3', 'v197 degjo: njofton ndryshimet lokale (v238: edhe furnizuesi i ri pa autor, në pritje)', ndr);
  const remote = {
    '111': { e: 'Koleg 111 (me dorë)', f: 'F1', k: 1, m: 1, a: 0, x: 0 },   // e kolegut me dorë fiton mbi automatiken time edhe pse më e vjetër
    '222': { e: 'Koleg 222 auto', f: '', k: 1, a: 1, m: 0, x: 0 },          // auto vs auto: e imja më e re mbetet
    '333': { e: 'Koleg 333', f: '', k: 1, a: 0, m: 0, x: 0 },               // e imja (ruajtje) më e re mbetet
    '444': { e: 'Vetëm te grupi', f: 'F4', k: 5, a: 0, m: 0, x: 0 },
    '555': { e: '', f: '', k: 9, x: 1 },                                    // e harruar nga një koleg
    'x y': { e: 'barkod i keq', k: 1 }, '666': 'mbeturinë', '777': { e: 'A'.repeat(500), f: 7, k: 1 }
  };
  ndr.length = 0;
  const n = G.bashko(remote);
  ok(G.merr('111').emri === 'Koleg 111 (me dorë)' && G.merr('222').emri === 'Auto 222' && G.merr('333').emri === 'Imi 333' && G.merr('444').emri === 'Vetëm te grupi', 'v197 bashko: rregulli i fituesit', [G.merr('111'), G.merr('222'), G.merr('333'), G.merr('444')]);
  ok(G.merr('x y') === null && G.merr('666') === null && G.merr('777').emri.length === 120 && G.merr('777').furnizuesi === '', 'v197 bashko: hyrjet e këqija pastrohen/injorohen', G.merr('777'));
  ok(G.merr('555') === null && !ndr.length, 'v197 bashko: e harruara vjen; s\'njofton (s\'kthehet te grupi)', ndr);
  const per = G.perDergim(remote).sort();
  ok(per.join() === '222,333,furnizuesi F3', 'v197 perDergim: vetëm ato ku pajisja ka diçka më të mirë', per);
  const h = G.hyrjePerGrup(['111', '333', '555', 'mungon']);
  ok(JSON.stringify(h['333']) === JSON.stringify({ e: 'Imi 333', f: 'F3', k: h['333'].k, a: 0, m: 0, s: 0, n: '', x: 0, r: 1 }) && h['111'].m === 1 && h['555'].x === 1 && h['555'].e === '' && !('mungon' in h), 'v197 hyrjePerGrup: krejt fushat (bashkimi i Firebase-it s\'lë mbetje)', h);
  ok(!G.meso('111', 'Auto tjetër', '', 'plotëso') && G.merr('111').emri === 'Koleg 111 (me dorë)', 'v197 plotëso s\'prek hyrjen me dorë të kolegut');
  ok(G.meso('555', 'Rikthyer', '') && G.merr('555').emri === 'Rikthyer', 'v197 ruajtja e re e kthen të harruarën');
  G.pastro(); ok(G.numri() === 0, 'v197 pastro (grup tjetër)');
}
// ---- v198: administratori (s) fiton; kolegët shtojnë produkte të reja, s'e mbishkruajnë versionin e tij ----
{
  const m3 = {}; const ls3 = { getItem: k => (k in m3 ? m3[k] : null), setItem: (k, v) => { m3[k] = String(v); } };
  const A = AF.krijoKujtesen(ls3);
  A.vendosAutorin('mendurberisha', true);
  ok(A.meso('900', 'Coca-Cola 1.25 L', 'Laberion') && A.merr('900').emri === 'Coca-Cola 1.25 L' && A.lista()[0].ngaAdmini && A.lista()[0].nga === 'mendurberisha', 'v198 ruajtja e administratorit: s + n', A.lista()[0]);
  A.vendosAutorin('besa', false);
  ok(!A.meso('900', 'coca cola', 'Tjetër') && A.merr('900').emri === 'Coca-Cola 1.25 L', 'v198 kolegia s\'e mbishkruan versionin e administratorit');
  ok(A.meso('901', 'Ujë Rugove', '') && A.lista().find(x => x.barkodi === '901').nga === 'besa' && !A.lista().find(x => x.barkodi === '901').ngaAdmini, 'v198 kolegia shton produkt të ri (me emrin e saj)');
  ok(A.meso('901', 'Ujë Rugove 0.5L', '') && A.merr('901').emri === 'Ujë Rugove 0.5L', 'v198 kolegia mund ta përmirësojë produktin e një kolegu');
  A.vendosAutorin('mendurberisha', true);
  ok(A.vendos('901', 'Ujë Rugove 0,5 L', 'Rugove') && A.lista().find(x => x.barkodi === '901').ngaAdmini, 'v198 administratori e ndryshon (bëhet i tiji)');
  const nga = { '900': { e: 'Version i kolegut', f: '', k: 9e15, a: 0, m: 1, s: 0, n: 'besa', x: 0 }, '902': { e: 'Admin nga PC', f: 'F', k: 1, a: 0, m: 1, s: 1, n: 'mendurberisha', x: 0 } };
  A.vendosAutorin('besa', false); A.meso('902', 'Emri i besës', '');
  A.bashko(nga);
  ok(A.merr('900').emri === 'Coca-Cola 1.25 L' && A.merr('902').emri === 'Admin nga PC', 'v198 bashko: e administratorit fiton në të dy drejtimet (edhe kur tjetra është më e re)', [A.merr('900'), A.merr('902')]);
  ok(A.perDergim(nga).indexOf('900') !== -1 && A.perDergim(nga).indexOf('902') === -1, 'v198 perDergim: e administratorit këtu shkon te grupi; e kolegut jo mbi të');
  A.vendosAutorin('mendurberisha', true); A.fshij('900'); A.vendosAutorin('besa', false);
  ok(!A.meso('900', 'Coca Cola e re', '') && !A.merr('900'), 'v206 pas "Harroje" të administratorit, kolegu s\'e rikthen (s\'del më)');
  ok(!A.meso('903', 'x', '', 'plotëso') || A.meso('903', 'Auto', '', 'plotëso') === false, 'v198 plotëso vazhdon për produktet e reja');
  const hh = A.hyrjePerGrup(['902']);
  ok(hh['902'].s === 1 && hh['902'].n === 'mendurberisha', 'v198 hyrjePerGrup: s + n', hh['902']);
}
// ---- v201: produktet e kolegëve presin kontrollin e administratorit ----
{
  const m4 = {}; const ls4 = { getItem: k => (k in m4 ? m4[k] : null), setItem: (k, v) => { m4[k] = String(v); } };
  const P = AF.krijoKujtesen(ls4);
  P.mesoShume([{ barkodi: '700', emri: 'Auto 700', furnizuesi: 'F' }], 'plotëso');
  ok(P.lista()[0].nePritje && P.numriNePritje() === 1, 'v238 produktet e mësuara vetë (pa autor) presin kontrollin');
  P.vendosAutorin('agim', false);
  P.meso('700', 'Auto 700', 'F');
  ok(P.lista().find(x => x.barkodi === '700').nePritje, 'v238 i njëjti emër mbi të mësuarin vetë: mbetet në pritje', P.lista().find(x => x.barkodi === '700'));
  P.meso('700', 'Auto 700 ndryshuar', '');
  ok(P.lista().find(x => x.barkodi === '700').nePritje, 'v201 emri i ndryshuar nga kolegu: në pritje');
  P.meso('701', 'Biskota', 'X');
  ok(P.lista().find(x => x.barkodi === '701').nePritje && P.numriNePritje() === 2, 'v201 produkti i ri i kolegut: në pritje');
  P.vendosAutorin('besa', false); P.meso('701', 'Biskota', 'X');
  ok(P.lista().find(x => x.barkodi === '701').nga === 'agim', 'v201 kolegia që e ruan njësoj s\'bëhet autore');
  P.vendosAutorin('mendurberisha', true);
  P.riemertoFurnizuesin('X', 'Xx');
  const b = P.lista().find(x => x.barkodi === '701');
  ok(b.nePritje && b.furnizuesi === 'Xx' && !b.ngaAdmini, 'v201 riemërtimi i furnizuesit s\'e miraton produktin në pritje', b);
  P.vendos('701', 'Biskota Plazma', 'Xx');
  ok(!P.lista().find(x => x.barkodi === '701').nePritje && P.numriNePritje() === 1, 'v201 ruajtja e administratorit e nxjerr nga pritja');
  P.meso('702', 'E administratorit', '');
  ok(P.lista().find(x => x.barkodi === '702').nePritje && P.lista().find(x => x.barkodi === '702').ngaAdmini, 'v214 produkti i ri i administratorit pret kontrollin e tij');
  P.vendos('702', 'E administratorit', '');
  ok(!P.lista().find(x => x.barkodi === '702').nePritje, 'v214 pasi e ruan (Cilësimet), s\'pret më');
  P.meso('702', 'E administratorit', '');
  ok(!P.lista().find(x => x.barkodi === '702').nePritje, 'v214 i njëjti emër s\'e kthen në pritje');
  P.fshij('700');
  ok(P.numriNePritje() === 0, 'v201 "Harroje" e heq nga pritja');
  const hp = P.hyrjePerGrup(['701']); P.vendosAutorin('agim', false);
  const Q = AF.krijoKujtesen({ getItem: () => null, setItem: () => {} });
  Q.bashko({ '800': { e: 'Nga grupi', f: '', k: 5, a: 0, m: 0, s: 0, n: 'besa', x: 0 }, '701': hp['701'] });
  ok(Q.lista().find(x => x.barkodi === '800').nePritje && !Q.lista().find(x => x.barkodi === '701').nePritje, 'v201 gjendja vjen edhe nga grupi');
}
// ---- v205: furnizuesit e grupit (kujtesa) dhe furnizuesit e rinj ----
{
  const L = AF.listaEFurnizuesve;
  const vjeter = L([{ furnizuesi: 'Laberion' }, { furnizuesi: 'Laberion' }], { 'f::9': { barkodi: '9', furnizuesi: 'Laberion' } });
  ok(vjeter.length === 1 && vjeter[0].afate === 2 && vjeter[0].produkte === 1 && vjeter[0].nePritje, 'v238 pa hyrje: furnizuesi pret kontrollin', vjeter);
  const kj = [{ barkodi: '9', furnizuesi: 'Laberion', nePritje: false }, { barkodi: '10', furnizuesi: 'Laberion', nePritje: true, nga: 'agim' },
    { barkodi: '11', furnizuesi: 'Rugove', nePritje: false }, { barkodi: '12', furnizuesi: 'Devoli', nePritje: true, nga: 'agim' }, { barkodi: '13', furnizuesi: 'Devoli', nePritje: true, nga: 'besa' }];
  const l = L([{ furnizuesi: 'Laberion' }], { 'f::9': { barkodi: '9', furnizuesi: 'Laberion' } }, kj);
  const m = {}; l.forEach(x => { m[x.emri] = x; });
  ok(m.Laberion.produkte === 2 && m.Laberion.nePritje, 'v205 produkte = barkode të ndryshme (stoku + kujtesa); v238: pa hyrje pret', m.Laberion);
  ok(m.Rugove && m.Rugove.nePritje && m.Rugove.afate === 0, 'v205 furnizuesi vetëm nga kujtesa e grupit del te lista (v238: në pritje)', m.Rugove);
  ok(m.Devoli.nePritje && m.Devoli.nga.join(',') === 'agim,besa' && m.Devoli.produkte === 2, 'v205 furnizuesi vetëm te produktet e reja: në pritje, me autorët', m.Devoli);
  const l2 = L([{ furnizuesi: 'Devoli' }], {}, kj);
  ok(l2.find(x => x.emri === 'Devoli').nePritje, 'v238 furnizuesi i afateve të mia pa hyrje: pret kontrollin');
  ok(!L([{ furnizuesi: 'Devoli' }], {}, kj, [{ emri: 'Devoli', koha: 3 }]).find(x => x.emri === 'Devoli').nePritje, 'v238 me hyrje të kontrolluar: te Furnizuesit');
}
// ---- v206: "Harroje" e administratorit sinkronizohet në krejt pajisjet dhe s'kthehet ----
{
  const mk = () => { const m = {}; return AF.krijoKujtesen({ getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); } }); };
  const PC = mk(), TEL = mk(), KOL = mk();
  PC.vendosAutorin('mendurberisha', true); TEL.vendosAutorin('mendurberisha', true); KOL.vendosAutorin('agim', false);
  // hyrja e administratorit (pak kohë më parë) është në të tri pajisjet
  const g1v = { '950': { e: 'Coca Test', f: 'Laberion', k: Date.now() - 5000, a: 0, m: 1, s: 1, n: 'mendurberisha', x: 0 } };
  PC.bashko(g1v); TEL.bashko(g1v); KOL.bashko(g1v);
  ok(PC.merr('950') && TEL.merr('950') && KOL.merr('950'), 'v206 hyrja e administratorit arrin te pajisjet');
  ok(PC.fshij('950') && !PC.merr('950'), 'v206 PC e harron');
  const g2 = PC.hyrjePerGrup(['950']);
  ok(g2['950'].x === 1 && g2['950'].s === 1, 'v206 shënimi "i harruar" i administratorit shkon te grupi me s', g2['950']);
  ok(PC.perDergim(g1v).indexOf('950') !== -1, 'v206 PC e dërgon harrimin (fiton mbi versionin e vjetër të administratorit)');
  ok(PC.bashko(g1v) === 0 && !PC.merr('950'), 'v206 versioni i vjetër nga grupi s\'e kthen te PC');
  ok(TEL.bashko(g2) === 1 && !TEL.merr('950') && KOL.bashko(g2) === 1 && !KOL.merr('950'), 'v206 telefoni dhe kolegu e marrin harrimin');
  ok(TEL.perDergim(g2).indexOf('950') === -1, 'v206 telefoni s\'e kthen versionin e vjetër te grupi');
  ok(!KOL.meso('950', 'Coca nga agim', '') && !KOL.merr('950'), 'v206 kolegu s\'e rikthen produktin e harruar');
  ok(!TEL.meso('950', 'Auto', '', 'plotëso') && !TEL.merr('950'), 'v206 mësimi në sfond s\'e rikthen');
  const g2v = JSON.parse(JSON.stringify(g2)); g2v['950'].k -= 1000; // (në test gjithçka ndodh në të njëjtin milisekond)
  ok(TEL.meso('950', 'Coca Test 2', 'Laberion') && TEL.merr('950').emri === 'Coca Test 2' && TEL.perDergim(g2v).indexOf('950') !== -1, 'v206 administratori mund ta shtojë sërish (më i ri fiton)');
}
// ---- v207: furnizuesit e ruajtur më vete: s'fshihen me produktet; fshirja e furnizuesit s'i fshin produktet ----
{
  const mk = () => { const m = {}; return AF.krijoKujtesen({ getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); } }); };
  const L = AF.listaEFurnizuesve;
  const A = mk(); A.vendosAutorin('mendurberisha', true);
  A.meso('5461585641', 'Test 330ml', 'Mafia Trade');
  ok(A.furnizuesit().length === 1 && A.furnizuesit()[0].emri === 'Mafia Trade' && !A.lista().some(x => /furnizuesi/.test(x.barkodi)) && A.numri() === 1, 'v207 furnizuesi i administratorit ruhet më vete (s\'del si produkt)', A.furnizuesit());
  A.fshij('5461585641');
  const l1 = L([], {}, A.lista(), A.furnizuesit());
  ok(l1.length === 1 && l1[0].emri === 'Mafia Trade' && l1[0].produkte === 0 && l1[0].nePritje && l1[0].nga.join() === 'mendurberisha', 'v207/v214 produkti harrohet, furnizuesi mbetet (pa produkte, pret kontrollin)', l1);
  A.meso('111', 'Prod 1', 'Albi'); A.meso('112', 'Prod 2', 'albi');
  ok(A.fshijFurnizuesin('Albi') === 2 && A.merr('111').emri === 'Prod 1' && A.merr('111').furnizuesi === '' && A.merr('112').furnizuesi === '', 'v207 fshirja e furnizuesit: produktet mbeten, pa furnizues');
  const l2 = L([{ furnizuesi: 'Albi' }, { furnizuesi: 'ALBI' }], {}, A.lista(), A.furnizuesit());
  ok(!l2.some(x => x.emri.toLowerCase() === 'albi'), 'v207 furnizuesi i fshirë s\'del më, me asnjë shkrim (edhe pse afatet e vjetra e kanë)', l2);
  const autom = L([{ furnizuesi: 'Rugove' }], {}, A.lista(), A.furnizuesit()).filter(f => !f.regjistruar).map(f => f.emri);
  ok(A.regjistroFurnizuesit(autom) === 1 && A.regjistroFurnizuesit(['Albi']) === 0, 'v207 ruajtja automatike: shton të miratuarit, s\'e kthen të fshirin', A.furnizuesit());
  const hh = A.hyrjePerGrup(['furnizuesi Rugove', 'furnizuesi Albi']);
  ok(hh['furnizuesi Rugove'].k === 1 && hh['furnizuesi Albi'].x === 1 && hh['furnizuesi Albi'].s === 1, 'v207 shkojnë te grupi; ruajtja automatike ka kohën 1 (s\'mund ta mundë një fshirje)', hh);
  // pajisja tjetër e administratorit: e merr fshirjen; ruajtja e saj automatike s'e kthen
  const B = mk(); B.vendosAutorin('mendurberisha', true);
  B.regjistroFurnizuesit(['Albi', 'Rugove']);
  B.bashko(A.hyrjePerGrup(A.furnizuesit().map(f => 'furnizuesi ' + f.emri)));
  ok(B.furnizuesit().find(f => f.emri === 'Albi').fshire && B.perDergim(A.hyrjePerGrup(['furnizuesi Albi'])).indexOf('furnizuesi Albi') === -1, 'v207 pajisja tjetër e pranon fshirjen dhe s\'e kthen');
  // riemërtimi: i vjetri fshihet, i riu ruhet; produktet riemërtohen
  A.meso('120', 'Ujë', 'Rugove');
  ok(A.riemertoFurnizuesin('Rugove', 'Rugove Sh.p.k') === 1 && A.furnizuesit().find(f => f.emri === 'Rugove').fshire && !A.furnizuesit().find(f => f.emri === 'Rugove Sh.p.k').fshire, 'v207 riemërtimi: i vjetri fshihet, i riu ruhet');
  // kolegu: furnizuesi i tij i ri ruhet më vete në pritje (v214); administratori e ruan → kalon
  const K2 = mk(); K2.vendosAutorin('agim', false);
  K2.meso('130', 'Biskota', 'Devoli');
  ok(K2.furnizuesit().length === 1 && K2.furnizuesit()[0].nePritje && K2.furnizuesit()[0].nga === 'agim' && L([], {}, K2.lista(), K2.furnizuesit())[0].nePritje, 'v214 furnizuesi i ri i kolegut ruhet më vete, në pritje', K2.furnizuesit());
  K2.fshij('130');
  ok(L([], {}, K2.lista(), K2.furnizuesit()).some(f => f.emri === 'Devoli' && f.nePritje), 'v214 produkti fshihet, furnizuesi në pritje mbetet');
  K2.bashko({ 'furnizuesi Devoli': { e: 'Devoli', f: '', k: Date.now() + 5, a: 0, m: 0, s: 1, n: '', x: 0 } });
  const l3 = L([], {}, K2.lista(), K2.furnizuesit());
  ok(!l3[0].nePritje && l3[0].regjistruar, 'v207 pasi e ruan administratori, kalon te Furnizuesit (edhe te kolegu)', l3);
  ok(K2.regjistroFurnizuesit(['X'], true) === 0, 'v207 kolegu s\'mund të ruajë furnizues');
  // ---- v214 ----
  const A3 = mk(); A3.vendosAutorin('mendurberisha', true);
  A3.bashko({ '900': { e: 'P vjetër', f: 'Furn V', k: 100, a: 0, m: 0, s: 0, n: 'agim', x: 0 } });
  ok(A3.furnizuesit().some(f => f.emri === 'Furn V' && f.nePritje && f.nga === 'agim') && A3.perDergim({}).indexOf('furnizuesi Furn V') !== -1, 'v214 të dhënat e vjetra: furnizuesi i produktit në pritje merr hyrjen e vet (shkon te grupi)', A3.furnizuesit());
  A3.bashko({ 'furnizuesi Fshire': { e: '', f: '', k: 500, a: 0, m: 0, s: 1, n: '', x: 1 }, '901': { e: 'P', f: 'Fshire', k: 400, a: 0, m: 0, s: 0, n: 'agim', x: 0 } });
  ok(!A3.furnizuesit().some(f => f.emri === 'Fshire' && !f.fshire), 'v214 s\'krijohet kur furnizuesi u fshi pas produktit');
  A3.bashko({ 'furnizuesi Fshire': { e: 'Fshire', f: '', k: 600, a: 0, m: 0, s: 0, n: 'besa', x: 0 } });
  ok(A3.furnizuesit().some(f => f.emri === 'Fshire' && f.nePritje && f.nga === 'besa'), 'v214 kolegu e shkruan sërish (më i ri): del në pritje mbi të fshirin');
  A3.bashko({ 'furnizuesi Fshire': { e: '', f: '', k: 550, a: 0, m: 0, s: 1, n: '', x: 1 } });
  ok(A3.furnizuesit().some(f => f.emri === 'Fshire' && f.nePritje), 'v214 një fshirje më e vjetër s\'e mund');
  ok(A3.regjistroFurnizuesinERi('Ri Admin') === 1 && A3.furnizuesit().some(f => f.emri === 'Ri Admin' && f.nePritje), 'v214 furnizuesi i ri i administratorit (afat pa barkod) pret kontrollin');
  ok(A3.regjistroFurnizuesinERi('ri admin') === 0, 'v214 i njëjti emër me shkrim tjetër s\'krijon dublikatë');
  ok(A3.hyrjePerGrup(['furnizuesi Ri Admin'])['furnizuesi Ri Admin'].r === 1, 'v214 "pret kontrollin" (r) shkon te grupi');
  A3.regjistroFurnizuesit(['Ri Admin'], true);
  ok(A3.furnizuesit().some(f => f.emri === 'Ri Admin' && !f.nePritje) && A3.hyrjePerGrup(['furnizuesi Ri Admin'])['furnizuesi Ri Admin'].r === 0, 'v214 "Ruaj" e kalon te të kontrolluarit');
  ok(A3.regjistroFurnizuesit(['Krejt i Ri']) === 1 && A3.furnizuesit().some(f => f.emri === 'Krejt i Ri' && !f.nePritje), 'v214 sfondi: emrat e vjetër pa hyrje ruhen si të kontrolluar');
  ok(A3.regjistroFurnizuesit(['FURN V']) === 0 && A3.furnizuesit().some(f => f.emri === 'Furn V' && f.nePritje), 'v214 sfondi s\'e kalon në të kontrolluar një në pritje (pa dallim shkronjash)');
  const B3 = mk(); B3.vendosAutorin('agim', false);
  B3.bashko({ '910': { e: 'Nga admini', f: 'X', k: 5, a: 0, m: 0, s: 1, n: 'mendurberisha', x: 0, r: 1 } });
  ok(B3.lista().find(x => x.barkodi === '910').nePritje && !B3.meso('910', 'Kolegu e ndryshon', ''), 'v214 produkti i administratorit në pritje vjen nga grupi; kolegu s\'e mbishkruan');
  // versionet e vjetra i injorojnë çelësat e furnizuesve (kanë hapësirë)
  ok(!/^[^\s]{1,40}$/.test('furnizuesi Albi'), 'v207 çelësi ka hapësirë: versionet e vjetra s\'e marrin si barkod');
}
console.log(g ? g + ' GABIME' : 'KREJT OK'); process.exit(g ? 1 : 0);
