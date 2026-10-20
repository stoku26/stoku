// v203: "Shfaq edhe …" te Cilësimet → Stoku → Produktet (tel + PC)
const { chromium } = require('./pw.js');
const src=require('fs').readFileSync(__dirname+'/audit.js','utf8');
const MOCK=eval('('+src.match(/const MOCK = (\(\) => \{[\s\S]*?\n\};)/)[1].slice(0,-1)+')');
let g=0;const ok=(c,m,x)=>{if(!c)g++;console.log((c?'OK    ':'GABIM ')+m+(x!==undefined?'  → '+JSON.stringify(x):''));};
const KUJ={};for(let i=0;i<250;i++)KUJ['60'+String(i).padStart(4,'0')]={e:'Produkt '+String(i).padStart(3,'0'),f:'F'+(i%7),k:1000+i,m:1,s:1,n:'mendurberisha'};
(async()=>{const b=await chromium.launch();const err=[];
 for(const pc of [false,true]){
  const ctx=await b.newContext(pc?{viewport:{width:1366,height:768},serviceWorkers:'block'}:{userAgent:'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36',viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await ctx.route(u=>!u.href.startsWith('http://127.0.0.1'),r=>r.abort());
  await ctx.addInitScript(MOCK);
  await ctx.addInitScript(([KUJ])=>{const c=window.__stokuCloud;c.perdoruesiAktual=()=>({uid:'u1',email:'mendurberisha@stoku-app.local'});
   if(sessionStorage.getItem('s'))return;sessionStorage.setItem('s','1');localStorage.setItem('stoku:porta:hyrja',JSON.stringify({uid:'u1',emri:'mendurberisha'}));localStorage.setItem('stoku:kujtesa:v1',JSON.stringify(KUJ));},[KUJ]);
  const p=await ctx.newPage();p.on('pageerror',e=>err.push(e.message));
  await p.goto('http://127.0.0.1:8765/'+(pc?'pc.html':''));await p.waitForTimeout(1500);
  const T=pc?'[pc]':'[tel]', L=pc?'#opsKujLista':'#kujtesaLista', BTN=pc?'#opsKujLista .ops-furn-me-shume button':'#kujtesaLista .ops-me-shume', KER=pc?'#opsKujKerko':'#kujtesaKerko', SCR=pc?'#opsKujLista':'.opsione-trup';
  await p.click('#btnOpsione');await p.waitForTimeout(300);
  if(pc){await p.click('#opsSkeda [data-faqe="stoku"]');await p.waitForTimeout(200);await p.click('#opsKujSeksion .ops-palos');}
  else{await p.click('#tabLista');await p.waitForTimeout(200);await p.click('#stProduktet');}
  await p.waitForTimeout(300);
  const N=pc?150:100;
  const rr=()=>p.$$eval(L+' .ops-furn-rresht',x=>x.length);
  ok(await rr()===N && /Shfaq edhe/.test(await p.textContent(BTN)),T+` në fillim ${N} + butoni`,await p.textContent(BTN));
  await p.locator(BTN).scrollIntoViewIfNeeded();await p.waitForTimeout(150);
  if(!pc) await p.screenshot({path:__dirname+'/meshume-tel.png'});
  const y0=await p.evaluate(s=>document.querySelector(s).scrollTop,SCR);
  await p.click(BTN);await p.waitForTimeout(250);
  const y1=await p.evaluate(s=>document.querySelector(s).scrollTop,SCR);
  ok(await rr()===Math.min(250,2*N) && Math.abs(y1-y0)<2,T+' pas klikimit: më shumë rreshta, scroll-i mbetet aty',{rreshta:await rr(),y0,y1});
  if(pc) await p.screenshot({path:__dirname+'/meshume-pc.png'});
  if(await p.$(BTN)){await p.click(BTN);await p.waitForTimeout(250);}
  ok(await rr()===250 && !(await p.$(BTN)),T+' krejt 250, pa buton në fund');
  // ndryshimi i një produkti afër fundit s'e kthen listën në 100
  const rreshti=p.locator(L+' .ops-furn-rresht:has-text("Produkt 240")');
  if(pc) await rreshti.locator('button:has-text("Ndrysho")').click(); else await rreshti.click();
  await p.waitForTimeout(200);
  await p.locator(L+' .ops-furn-edit input').nth(0).fill('Produkt 240 i ndryshuar');
  await p.locator(L+' .ops-furn-edit button:has-text("Ruaj")').click();await p.waitForTimeout(250);
  ok(await rr()===250 && /Produkt 240 i ndryshuar/.test(await p.textContent(L)),T+' pas ruajtjes mbeten të shfaqura të 250');
  // kërkimi e kthen në fillim
  await p.fill(KER,'produkt');await p.waitForTimeout(250);
  ok(await rr()===N && await p.$(BTN),T+' kërkimi i ri fillon prej '+N);
  await ctx.close();}
 ok(!err.length,'pa gabime në faqe',err);
 console.log('gabime',g);await b.close();process.exit(g?1:0);})();
