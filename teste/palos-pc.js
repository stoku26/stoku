// v200: Cilësimet → Stoku (PC): Furnizuesit/Produktet të mbyllura + X jashtë dritares që s'lëviz me scroll
const { chromium } = require('./pw.js');
const src=require('fs').readFileSync(__dirname+'/audit.js','utf8');
const MOCK=eval('('+src.match(/const MOCK = (\(\) => \{[\s\S]*?\n\};)/)[1].slice(0,-1)+')');
let g=0;const ok=(c,m,x)=>{if(!c)g++;console.log((c?'OK    ':'GABIM ')+m+(x!==undefined?'  → '+JSON.stringify(x):''));};
const d=n=>{const x=new Date();x.setDate(x.getDate()+n);return x.toISOString().slice(0,10)};
const FURN=['Albi','Albulena Impex','Argo Group','Devolli','Elkos','Extra Fruit','Laberion','Rugove','Meridian','Frutomania','Bavaria','Coca Cola HBC'];
const AF=[];for(let i=0;i<40;i++)AF.push({id:'a'+i,emri:'Produkt '+i,barkodi:'3900'+String(i).padStart(3,'0'),data:d(5+i),sasia:1,furnizuesi:FURN[i%FURN.length],statusi:'aktiv',krijuarSe:1,ndryshuarSe:1});
(async()=>{const b=await chromium.launch();const err=[];
 const raste=[['1366x768','light',''],['1280x800','dark',''],['1024x768','light',''],['1024x650','dark',''],['1366x768','light','e_madhe']];
 for(const [vp,tema,madh] of raste){
  const [w,h]=vp.split('x').map(Number);
  const ctx=await b.newContext({viewport:{width:w,height:h},serviceWorkers:'block'});
  await ctx.route(u=>!u.href.startsWith('http://127.0.0.1'),r=>r.abort());
  await ctx.addInitScript(MOCK);
  await ctx.addInitScript(([AF,tema,madh])=>{const c=window.__stokuCloud;c.perdoruesiAktual=()=>({uid:'u1',email:'mendurberisha@stoku-app.local'});
   if(sessionStorage.getItem('s'))return;sessionStorage.setItem('s','1');localStorage.setItem('stoku:afatet:v1',JSON.stringify(AF));
   // v238: furnizuesit pa hyrje presin kontrollin; këtu janë kontrolluar më parë (koha 1)
   const kj={};['Albi','Albulena Impex','Argo Group','Devolli','Elkos','Extra Fruit','Laberion','Rugove','Meridian','Frutomania','Bavaria','Coca Cola HBC'].forEach(e=>{kj['furnizuesi '+e]={e,f:'',k:1,s:1};});localStorage.setItem('stoku:kujtesa:v1',JSON.stringify(kj));localStorage.setItem('stoku:kujtesa:kontrolli-v238','1');
   try{const o=JSON.parse(localStorage.getItem('stoku:pc:opsione')||'{}');}catch(e){}},[AF,tema,madh]);
  const p=await ctx.newPage();p.on('pageerror',e=>err.push(e.message));p.on('dialog',x=>x.accept());
  await p.goto('http://127.0.0.1:8765/pc.html');await p.waitForTimeout(2200);
  await p.click('#btnOpsione');await p.waitForTimeout(400);
  if(tema==='dark'){await p.click('#opsTema [data-v="dark"]');await p.waitForTimeout(300);}
  if(madh){const m=await p.$('[data-v="e_madhe"]');if(m){await m.click();await p.waitForTimeout(400);}}
  const t=`[${vp} ${tema}${madh?' '+madh:''}]`;
  await p.click('#opsSkeda [data-faqe="stoku"]');await p.waitForTimeout(400);
  ok(await p.isVisible('#opsFurnSeksion') && !(await p.isVisible('#opsFurnLista')) && !(await p.isVisible('#opsKujLista')) && !(await p.isVisible('#opsFurnKerko')),t+' të mbyllura kur hapet Stoku');
  ok((await p.textContent('#opsFurnNumri'))==='12',t+' numri i furnizuesve në kokë',await p.textContent('#opsFurnNumri'));
  await p.screenshot({path:`${__dirname}/palos-${vp}-${tema}${madh}-1.png`});
  // hap Furnizuesit me klikim te koka
  await p.click('#opsFurnSeksion .ops-titull');await p.waitForTimeout(250);
  ok(await p.isVisible('#opsFurnLista') && await p.isVisible('#opsFurnKerko') && (await p.getAttribute('#opsFurnSeksion .ops-palos','aria-expanded'))==='true',t+' Furnizuesit hapen');
  ok(!(await p.isVisible('#opsKujLista')),t+' Produktet mbeten të mbyllura');
  // hap Produktet me shigjetën
  await p.click('#opsKujSeksion .ops-palos');await p.waitForTimeout(250);
  ok(await p.isVisible('#opsKujLista'),t+' Produktet hapen me shigjetën');
  // kërkimi s'e mbyll kartën
  await p.click('#opsFurnKerko');await p.fill('#opsFurnKerko','al');await p.waitForTimeout(200);
  ok(await p.isVisible('#opsFurnLista') && (await p.$$('#opsFurnLista .ops-furn-rresht')).length===2,t+' kërkimi punon brenda kartës');
  // scroll poshtë: X mbetet në të njëjtin vend, jashtë dritares
  const x0=await p.locator('.ops-mbyll').boundingBox();
  await p.evaluate(()=>{const s=document.querySelector('.ops-djathtas');s.scrollTop=s.scrollHeight;});await p.waitForTimeout(200);
  const x1=await p.locator('.ops-mbyll').boundingBox();const dl=await p.locator('.ops-dlg').boundingBox();
  const jashte=x1.x>=dl.x+dl.width-1 || x1.y+x1.height<=dl.y+1;
  ok(x0.y===x1.y && x0.x===x1.x && x1.y>=0 && x1.x+x1.width<=w,t+' X s\'lëviz me scroll dhe është brenda ekranit',{x:Math.round(x1.x),y:Math.round(x1.y)});
  console.log('      X '+(jashte?'jashtë dritares':'brenda, në cep')+' (dritarja x '+Math.round(dl.x)+'..'+Math.round(dl.x+dl.width)+', y '+Math.round(dl.y)+')');
  await p.screenshot({path:`${__dirname}/palos-${vp}-${tema}${madh}-2.png`});
  // mbyll me klikim te koka sërish
  await p.evaluate(()=>{document.querySelector('.ops-djathtas').scrollTop=0;});
  await p.click('#opsFurnSeksion .ops-titull');await p.waitForTimeout(200);
  ok(!(await p.isVisible('#opsFurnLista')),t+' Furnizuesit mbyllen sërish');
  // kalo te Pamja e prapa: të dyja mbyllen
  await p.click('#opsSkeda [data-faqe="pamja"]');await p.click('#opsSkeda [data-faqe="stoku"]');await p.waitForTimeout(200);
  ok(!(await p.isVisible('#opsKujLista')),t+' kur rikthehesh te Stoku, janë sërish të mbyllura');
  await p.click('.ops-mbyll');await p.waitForTimeout(300);
  ok(!(await p.isVisible('#dlgOpsione .ops-dlg')),t+' X i mbyll Cilësimet');
  await ctx.close();}
 ok(!err.length,'pa gabime në faqe',err);
 console.log('gabime',g);await b.close();process.exit(g?1:0);})();
