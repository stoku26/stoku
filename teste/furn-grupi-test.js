// v205: furnizuesit e grupit (nga kujtesa) për këdo; "Furnizuesit e rinj" (vetëm te produktet e reja të kolegëve)
const { chromium } = require('./pw.js');
const src=require('fs').readFileSync(__dirname+'/audit.js','utf8');
const MOCK=eval('('+src.match(/const MOCK = (\(\) => \{[\s\S]*?\n\};)/)[1].slice(0,-1)+')');
let g=0;const ok=(c,m,x)=>{if(!c)g++;console.log((c?'OK    ':'GABIM ')+m+(x!==undefined?'  → '+JSON.stringify(x):''));};
const t=Date.now();
const KUJ={'furnizuesi Laberion':{e:'Laberion',f:'',k:1,s:1},'furnizuesi Rugove':{e:'Rugove',f:'',k:1,s:1},'3900001':{e:'Coca-Cola 1.25 L',f:'Laberion',k:t-9000,m:1,s:1,n:'mendurberisha'},'777':{e:'Ujë Rugove 0.5L',f:'Rugove',k:t-8000,a:1},
 '5550005':{e:'Biskota plazma',f:'Devoli',k:t-1000,n:'agim'},'5550006':{e:'Çokollatë',f:'Laberion',k:t-900,n:'agim'}};
async function faqe(b,emri,pc){
 const ctx=await b.newContext(pc?{viewport:{width:1366,height:768},serviceWorkers:'block'}:{userAgent:'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36',viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 await ctx.route(u=>!u.href.startsWith('http://127.0.0.1'),r=>r.abort());
 await ctx.addInitScript(MOCK);
 await ctx.addInitScript(([emri,KUJ])=>{const c=window.__stokuCloud;c.perdoruesiAktual=()=>({uid:'u1',email:emri+'@stoku-app.local'});
  if(sessionStorage.getItem('s'))return;sessionStorage.setItem('s','1');localStorage.setItem('stoku:porta:hyrja',JSON.stringify({uid:'u1',emri}));localStorage.setItem('stoku:kujtesa:v1',JSON.stringify(KUJ));localStorage.setItem('stoku:kujtesa:kontrolli-v238','1');},[emri,KUJ]); // v238: Laberion/Rugove të kontrolluar më parë
 const p=await ctx.newPage();p.on('pageerror',e=>err.push(e.message));p.on('dialog',d=>d.accept());
 await p.goto('http://127.0.0.1:8765/'+(pc?'pc.html':''));await p.waitForTimeout(1500);return {p,ctx};}
const err=[];
(async()=>{const b=await chromium.launch();
 // 1. PC, koleg pa afate (si pda34): i sheh furnizuesit e grupit, vetëm për t'u parë
 let {p,ctx}=await faqe(b,'pda34',true);
 await p.click('#btnOpsione');await p.waitForTimeout(300);await p.click('#opsSkeda [data-faqe="stoku"]');await p.waitForTimeout(300);
 await p.click('#opsFurnSeksion .ops-palos');await p.waitForTimeout(150);
 let tx=await p.textContent('#opsFurnLista');
 ok(/Laberion/.test(tx)&&/Rugove/.test(tx)&&(await p.textContent('#opsFurnNumri'))==='2'&&!(await p.$('#opsFurnLista button')),'1. PC koleg pa afate: i sheh furnizuesit e grupit (2), pa butona',tx.replace(/\s+/g,' '));
 ok(await p.isVisible('#opsFurnPritjeSeksion')&&/Devoli/.test(await p.textContent('#opsFurnPritjeLista'))&&!(await p.$('#opsFurnPritjeLista button')),'1. PC koleg: "Furnizuesit e rinj" vetëm për t\'u parë');
 ok(/regjistrit të Stoku-t/.test(await p.textContent('#opsFurnHint')),'1. PC koleg: teksti flet për furnizuesit e regjistrit (v242: krejt llogaritë)');
 await p.screenshot({path:__dirname+'/furn-grupi-pc-koleg.png'});
 await ctx.close();
 // 2. PC, administratori: Devoli te "Furnizuesit e rinj" (nga agim); riemërtimi në Devolli e kalon te Furnizuesit? jo: mbetet derisa të ruhet produkti
 ({p,ctx}=await faqe(b,'mendurberisha',true));
 await p.click('#btnOpsione');await p.waitForTimeout(300);await p.click('#opsSkeda [data-faqe="stoku"]');await p.waitForTimeout(300);
 ok(await p.isVisible('#opsFurnPritjeSeksion')&&(await p.textContent('#opsFurnPritjeNumri'))==='1','2. PC admin: karta "Furnizuesit e rinj" me 1');
 await p.click('#opsFurnPritjeSeksion .ops-palos');await p.waitForTimeout(150);
 tx=await p.textContent('#opsFurnPritjeLista');
 ok(/Devoli/.test(tx)&&/nga agim/.test(tx)&&!/Laberion/.test(tx),'2. Devoli (vetëm te produkti i ri i agimit) pret; Laberion jo (e ka edhe produkt të kontrolluar)',tx.replace(/\s+/g,' '));
 await p.screenshot({path:__dirname+'/furn-grupi-pc-admin.png'});
 await p.click('#opsFurnPritjeLista .ops-furn-rresht:has-text("Devoli") button');await p.waitForTimeout(150);
 await p.fill('#opsFurnPritjeLista .ops-furn-edit input','Devolli');await p.keyboard.press('Enter');await p.waitForTimeout(300);
 let k=await p.evaluate(()=>JSON.parse(localStorage.getItem('stoku:kujtesa:v1')));
 ok(k['5550005'].f==='Devolli'&&!k['5550005'].s&&/Devolli/.test(await p.textContent('#opsFurnLista'))&&!(await p.isVisible('#opsFurnPritjeSeksion')),'2. v207 riemërtimi: furnizuesi "Devolli" ruhet si i kontrolluar (kalon te Furnizuesit); produkti mbetet në pritje',k['5550005']);
 // ruaje produktin te Produktet e reja → furnizuesi kalon te Furnizuesit
 await p.click('#opsKujPritjeSeksion .ops-palos');await p.waitForTimeout(150);
 await p.click('#opsKujPritjeLista .ops-furn-rresht:has-text("Biskota") button:has-text("Ruaj")');await p.waitForTimeout(300);
 await p.click('#opsSkeda [data-faqe="pamja"]');await p.click('#opsSkeda [data-faqe="stoku"]');await p.waitForTimeout(300);
 await p.click('#opsFurnSeksion .ops-palos');await p.waitForTimeout(150);
 ok(!(await p.isVisible('#opsFurnPritjeSeksion'))&&/Devolli/.test(await p.textContent('#opsFurnLista')),'2. pasi ruhet produkti: Devolli kalon te Furnizuesit, karta e të rinjve fshihet');
 await ctx.close();
 // 3. Telefoni, administratori: rreshti "Furnizuesit e rinj" + faqja; riemërtim në furnizues ekzistues = bashkim
 ({p,ctx}=await faqe(b,'mendurberisha',false));
 await p.click('#btnOpsione');await p.waitForTimeout(300);await p.click('#tabLista');await p.waitForTimeout(300);
 ok(await p.isVisible('#stFurnPritje')&&/1 pret kontrollin/.test(await p.textContent('#stFurnPritjeStatus'))&&/2 furnizues/.test(await p.textContent('#stFurnizuesitStatus')),'3. tel admin: rreshtat "Furnizuesit e rinj" (1) dhe Furnizuesit (2)',[await p.textContent('#stFurnPritjeStatus'),await p.textContent('#stFurnizuesitStatus')]);
 await p.screenshot({path:__dirname+'/furn-grupi-tel-stoku.png'});
 await p.click('#stFurnPritje');await p.waitForTimeout(300);
 ok((await p.textContent('#opsioneTitulli'))==='Furnizuesit e rinj'&&/Devoli.*nga agim/.test((await p.textContent('#furnPritjeLista')).replace(/\s+/g,' ')),'3. tel: faqja Furnizuesit e rinj');
 await p.screenshot({path:__dirname+'/furn-grupi-tel-rinj.png'});
 await p.click('#furnPritjeLista .ops-furn-rresht:has-text("Devoli")');await p.waitForTimeout(150);
 await p.fill('#furnPritjeLista .ops-furn-edit input','laberion');await p.click('#furnPritjeLista .ops-furn-edit .btn:not(.ops-btn-dyte)');await p.waitForTimeout(300);
 ok(await p.evaluate(()=>document.getElementById('dlgKonfirmo').classList.contains('hapur')),'3. tel: pyet "Të bashkohen furnizuesit?"');
 await p.click('#konfPo');await p.waitForTimeout(400);
 k=await p.evaluate(()=>JSON.parse(localStorage.getItem('stoku:kujtesa:v1')));
 ok(k['5550005'].f==='laberion' && k['3900001'].f==='laberion' && /Asnjë furnizues i ri/.test(await p.textContent('#furnPritjeLista')),'3. tel: bashkimi me një furnizues ekzistues e nxjerr nga të rinjtë',k['5550005']);
 await p.click('#opsPrapa');await p.waitForTimeout(200);
 ok(!(await p.isVisible('#stFurnPritje')),'3. tel: rreshti i të rinjve fshihet');
 await ctx.close();
 // 4. Telefoni, koleg pa afate: i sheh furnizuesit e grupit
 ({p,ctx}=await faqe(b,'pda34',false));
 await p.click('#btnOpsione');await p.waitForTimeout(300);await p.click('#tabLista');await p.waitForTimeout(300);await p.click('#stFurnizuesit');await p.waitForTimeout(300);
 tx=await p.textContent('#furnLista');
 ok(/Laberion/.test(tx)&&/Rugove/.test(tx)&&!(await p.$('#furnLista .ops-furn-laps')),'4. tel koleg: i sheh furnizuesit e grupit, pa laps',tx.replace(/\s+/g,' '));
 await ctx.close();
 ok(!err.length,'pa gabime në faqe',err);
 console.log('gabime',g);await b.close();process.exit(g?1:0);})();
