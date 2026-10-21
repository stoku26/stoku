const { chromium } = require('./pw.js');
const fs=require('fs');
const src=fs.readFileSync(__dirname+'/audit.js','utf8');
const MOCK=eval('('+src.match(/const MOCK = (\(\) => \{[\s\S]*?\n\};)/)[1].slice(0,-1)+')');
const d=n=>{const x=new Date();x.setDate(x.getDate()+n);return x.toISOString().slice(0,10)};
const SEED={fold:[{id:'f1',emri:'Ushqimore'},{id:'f2',emri:'Pije'}],prod:{},af:[]};
['3900000000011:Qumësht 1L:12','3900000000028:Kos Vita:0','3900000000035:Bukë:3','3900000000042:Djathë i bardhë me emër shumë të gjatë që s\'mbaron kurrë:150'].forEach((x,i)=>{const[b,e,s]=x.split(':');SEED.prod['f1::'+b]={barkodi:b,emri:e,sasia:+s,kategoriaId:'f1',prekurSe:Date.now()-i*1000}});
SEED.prod['f2::3900000000059']={barkodi:'3900000000059',emri:'Ujë',sasia:40,kategoriaId:'f2',prekurSe:Date.now()};
[['EKO Dardhe 2L',-2],['Jaffa',0],['Qumësht 1L',3],['Kos',9],['Ruko',45],['Ujë',120]].forEach(([e,n],i)=>SEED.af.push({id:'a'+i,emri:e,barkodi:'39031077305'+i,data:d(n),sasia:'2',furnizuesi:'Laberion',krijuar:Date.now(),ndryshuar:Date.now()}));
var PROBLEME=new Set();var shto=m=>PROBLEME.add(m);
const KONTROLLO=()=>{const r=[];const W=innerWidth;
  const tw=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
  while((n=tw.nextNode())){const t=n.nodeValue;if(!t.trim())continue;const el=n.parentElement;if(!el||!el.offsetParent&&getComputedStyle(el).position!=='fixed')continue;if(getComputedStyle(el).visibility==='hidden')continue;
    if(el.closest('script,style,noscript'))continue;
    if(/\bundefined\b|\bNaN\b|\[object|\bnull\b|—/.test(t))r.push('tekst i dyshimtë: "'+t.trim().slice(0,60)+'" te '+(el.id||el.className||el.tagName));}
  if(document.documentElement.scrollWidth>W+1)r.push('scroll horizontal i faqes: '+document.documentElement.scrollWidth+'>'+W);
  if(document.documentElement.scrollHeight>innerHeight+1)r.push('faqja më e lartë se ekrani: '+document.documentElement.scrollHeight+'>'+innerHeight);
  if(scrollY>0)r.push('faqja e zhvendosur poshtë: scrollY='+Math.round(scrollY));
  document.querySelectorAll('img').forEach(i=>{if(i.offsetParent&&getComputedStyle(i).visibility!=='hidden'&&i.complete&&!i.naturalWidth)r.push('foto e prishur: '+i.src)});
  document.querySelectorAll('button,a[href],input:not([type=hidden]),select,textarea').forEach(b=>{if(!b.offsetParent||getComputedStyle(b).visibility==='hidden')return;const rc=b.getBoundingClientRect();if(rc.width<2)return;
    const nm=(b.getAttribute('aria-label')||b.title||b.textContent||b.placeholder||(b.labels&&b.labels[0]&&b.labels[0].textContent)||b.value||'').trim();
    if(!nm)r.push('pa emër: <'+b.tagName.toLowerCase()+(b.id?'#'+b.id:'')+(b.className&&typeof b.className==='string'?'.'+b.className.split(' ')[0]:'')+'>');
    if(rc.right>W+1&&!b.closest('[style*="overflow"],.sb-chips,.af-muajt,#afFiltrat,.chip-rresht'))r.push('del jashtë ekranit: '+(b.id||b.textContent.trim().slice(0,20)));});
  return r;};
async function faqe(b,opt,url,tema){const ctx=await b.newContext({...opt,serviceWorkers:'block',acceptDownloads:true});
  await ctx.route(u=>!u.href.startsWith('http://127.0.0.1'),r=>r.abort());await ctx.addInitScript(MOCK);
  await ctx.addInitScript(([S,t,M])=>{if(sessionStorage.getItem('seed'))return;sessionStorage.setItem('seed','1');localStorage.setItem('stoku:foldera:v1',JSON.stringify(S.fold));localStorage.setItem('stoku:produktet:v2',JSON.stringify(S.prod));localStorage.setItem('stoku:afatet:v1',JSON.stringify(S.af));localStorage.setItem('stoku:tema',t);localStorage.setItem('stoku:pc:opsione:v1',JSON.stringify({tema:t,madhesia:M||'normale'}));localStorage.setItem('stoku:opsione:v1',JSON.stringify({madhesia:M||'normale'}));},[SEED,tema,process.env.MADH||'']);
  const p=await ctx.newPage();p.on('pageerror',e=>shto('['+url+' '+tema+'] pageerror: '+e.message));
  p.on('console',m=>{if(m.type()==='error'&&!/net::|Failed to load|ERR_/.test(m.text()))shto('['+url+' '+tema+'] console: '+m.text().slice(0,160))});
  p.on('dialog',d=>d.dismiss());p.on('filechooser',()=>{});
  await p.goto('http://127.0.0.1:8765'+url);await p.waitForTimeout(1200);return {p,ctx};}

module.exports={MOCK,SEED,KONTROLLO,faqe,PROBLEME,shto};
