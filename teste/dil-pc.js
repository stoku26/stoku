// v204: PC, butoni i daljes te karta e llogarisë (ikonë + tekst kur mausi qëndron mbi të)
const { chromium } = require('./pw.js');
const src=require('fs').readFileSync(__dirname+'/audit.js','utf8');
const MOCK=eval('('+src.match(/const MOCK = (\(\) => \{[\s\S]*?\n\};)/)[1].slice(0,-1)+')');
let g=0;const ok=(c,m,x)=>{if(!c)g++;console.log((c?'OK    ':'GABIM ')+m+(x!==undefined?'  → '+JSON.stringify(x):''));};
(async()=>{const b=await chromium.launch();const err=[];
 for(const tema of ['dark','light']){
  const ctx=await b.newContext({viewport:{width:1366,height:768},serviceWorkers:'block',colorScheme:tema});
  await ctx.route(u=>!u.href.startsWith('http://127.0.0.1'),r=>r.abort());
  await ctx.addInitScript(MOCK);
  await ctx.addInitScript(()=>{const c=window.__stokuCloud;c.perdoruesiAktual=()=>({uid:'u1',email:'mendurberisha@stoku-app.local'});});
  const p=await ctx.newPage();p.on('pageerror',e=>err.push(e.message));
  await p.goto('http://127.0.0.1:8765/pc.html');await p.waitForTimeout(1500);
  const T=`[${tema}]`;
  ok(await p.isVisible('#sbpDil') && (await p.textContent('#sbpDil')).trim()==='',T+' butoni duket, pa tekst');
  const bx=await p.locator('#sbpDil').boundingBox(), ac=await p.locator('.sbp-account').boundingBox();
  ok(bx.x+bx.width<=ac.x+ac.width && bx.x>ac.x+ac.width/2,T+' në anën e djathtë të kartës',{bx,ac});
  const op0=await p.evaluate(()=>getComputedStyle(document.getElementById('sbpDil'),'::after').opacity);
  await p.hover('#sbpDil');await p.waitForTimeout(500);
  const op1=await p.evaluate(()=>getComputedStyle(document.getElementById('sbpDil'),'::after').opacity);
  const tx=await p.evaluate(()=>getComputedStyle(document.getElementById('sbpDil'),'::after').content);
  ok(op0==='0' && op1==='1' && /Dil nga llogaria/.test(tx),T+' teksti del vetëm kur mausi qëndron mbi të',{op0,op1,tx});
  await p.screenshot({path:`${__dirname}/dil-pc-${tema}.png`,clip:{x:0,y:520,width:260,height:248}});
  await p.click('#sbpDil');await p.waitForTimeout(300);
  ok(await p.evaluate(()=>document.getElementById('dlgKonfirmo').classList.contains('hapur')) && /dilet/.test(await p.textContent('#kfTitulli')),T+' klikimi pyet "Të dilet nga llogaria?"');
  await p.click('#kfJo');await p.waitForTimeout(200);ok(!(await p.evaluate(()=>document.getElementById('dlgKonfirmo').classList.contains('hapur'))) && await p.isVisible('#sbpDil'),T+' "Jo": mbetet i kyçur');await p.waitForTimeout(200);
  await ctx.close();}
 // pa llogari: s'duket
 const ctx=await b.newContext({viewport:{width:1366,height:768},serviceWorkers:'block'});
 await ctx.route(u=>!u.href.startsWith('http://127.0.0.1'),r=>r.abort());
 await ctx.addInitScript(MOCK);await ctx.addInitScript(()=>{const c=window.__stokuCloud;c.perdoruesiAktual=()=>null;});
 const p=await ctx.newPage();await p.goto('http://127.0.0.1:8765/pc.html');await p.waitForTimeout(1500);
 ok(!(await p.isVisible('#sbpDil')),'pa llogari: butoni s\'duket');
 ok(!err.length,'pa gabime në faqe',err);
 console.log('gabime',g);await b.close();process.exit(g?1:0);})();
