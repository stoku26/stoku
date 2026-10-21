// v202: telefoni, Cilësimet → Stoku: Furnizuesit / Produktet e reja / Produktet si nënfaqe; "mbrapa" i Android-it
const { chromium } = require('./pw.js');
const src=require('fs').readFileSync(__dirname+'/audit.js','utf8');
const MOCK=eval('('+src.match(/const MOCK = (\(\) => \{[\s\S]*?\n\};)/)[1].slice(0,-1)+')');
let g=0;const ok=(c,m,x)=>{if(!c)g++;console.log((c?'OK    ':'GABIM ')+m+(x!==undefined?'  → '+JSON.stringify(x):''));};
const t=Date.now();
const KUJ={'furnizuesi Laberion':{e:'Laberion',f:'',k:1,s:1},'furnizuesi Rugove':{e:'Rugove',f:'',k:1,s:1},'5550005':{e:'Biskota plazma',f:'Devolli',k:t-1000,n:'agim'},'3900001':{e:'Coca-Cola 1.25 L',f:'Laberion',k:t-9000,m:1,s:1,n:'mendurberisha'},'777':{e:'Ujë Rugove 0.5L',f:'Rugove',k:t-8000,a:1}};
(async()=>{const b=await chromium.launch();const err=[];
 for(const tema of ['light','dark']){
 const ctx=await b.newContext({userAgent:'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36',viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block',colorScheme:tema});
 await ctx.route(u=>!u.href.startsWith('http://127.0.0.1'),r=>r.abort());
 await ctx.addInitScript(MOCK);
 await ctx.addInitScript(([KUJ])=>{const c=window.__stokuCloud;c.perdoruesiAktual=()=>({uid:'u1',email:'mendurberisha@stoku-app.local'});
  if(sessionStorage.getItem('s'))return;sessionStorage.setItem('s','1');localStorage.setItem('stoku:porta:hyrja',JSON.stringify({uid:'u1',emri:'mendurberisha'}));localStorage.setItem('stoku:kujtesa:v1',JSON.stringify(KUJ));localStorage.setItem('stoku:kujtesa:kontrolli-v238','1');},[KUJ]); // v238: '777' i mësuar vetë para v238 (pa migrim)
 const p=await ctx.newPage();p.on('pageerror',e=>err.push(e.message));
 await p.goto('http://127.0.0.1:8765/');await p.waitForTimeout(1500);
 const T=`[${tema}]`;
 await p.click('#btnOpsione');await p.waitForTimeout(300);await p.click('#tabLista');await p.waitForTimeout(300);
 ok((await p.textContent('#stPritjeStatus'))==='1 pret kontrollin' && /2 produkte/.test(await p.textContent('#stProduktetStatus')),T+' rreshtat: 1 pret kontrollin, 2 produkte',[await p.textContent('#stPritjeStatus'),await p.textContent('#stProduktetStatus')]);
 await p.screenshot({path:`${__dirname}/nenfaqe-${tema}-stoku.png`});
 // "mbrapa" i Android-it: Produktet → Stoku → menyja → mbyllur
 await p.click('#stProduktet');await p.waitForTimeout(300);
 ok((await p.textContent('#opsioneTitulli'))==='Produktet' && await p.isVisible('#kujtesaLista'),T+' Produktet hapen');
 await p.screenshot({path:`${__dirname}/nenfaqe-${tema}-produktet.png`});
 await p.goBack();await p.waitForTimeout(300);
 ok((await p.textContent('#opsioneTitulli'))==='Stoku' && await p.isVisible('#stProduktet'),T+' "mbrapa" kthehet te Stoku');
 await p.goBack();await p.waitForTimeout(300);
 ok(await p.isVisible('#kategoriMenu') && await p.isVisible('#dlgOpsione'),T+' "mbrapa" sërish: menyja e Cilësimeve');
 await p.goBack();await p.waitForTimeout(300);
 ok(!(await p.evaluate(()=>document.getElementById('dlgOpsione').classList.contains('hapur'))),T+' "mbrapa" sërish: Cilësimet mbyllen');
 // Produktet e reja: administratori e ndryshon dhe e ruan; rreshti zhduket
 await p.click('#btnOpsione');await p.waitForTimeout(300);await p.click('#tabLista');await p.waitForTimeout(200);await p.click('#stPritje');await p.waitForTimeout(300);
 ok((await p.textContent('#opsioneTitulli'))==='Produktet e reja' && /Biskota plazma/.test(await p.textContent('#kujPritjeLista')),T+' Produktet e reja hapen');
 await p.screenshot({path:`${__dirname}/nenfaqe-${tema}-pritje.png`});
 await p.click('#kujPritjeLista .ops-furn-rresht:has-text("Biskota plazma")');await p.waitForTimeout(200);
 await p.locator('#kujPritjeLista .ops-furn-edit input').nth(0).fill('Biskota Plazma 300g');
 await p.click('#kujPritjeLista .ops-furn-edit button:has-text("Ruaj")');await p.waitForTimeout(300);
 ok(/Asnjë produkt i ri/.test(await p.textContent('#kujPritjeLista')),T+' pas ruajtjes: s\'mbetet asgjë në pritje');
 await p.click('#opsPrapa');await p.waitForTimeout(200);
 ok(!(await p.isVisible('#stPritje')) && /3 produkte/.test(await p.textContent('#stProduktetStatus')),T+' te Stoku: rreshti "Produktet e reja" fshihet, Produktet 3',await p.textContent('#stProduktetStatus'));
 await p.click('#opsPrapa');await p.waitForTimeout(200);
 ok(!/për kontroll/.test(await p.textContent('#tabListaStatus')),T+' menyja s\'thotë më "për kontroll"');
 await ctx.close();}
 ok(!err.length,'pa gabime në faqe',err);
 console.log('gabime',g);await b.close();process.exit(g?1:0);})();
