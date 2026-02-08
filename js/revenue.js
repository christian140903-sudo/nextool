/**
 * NexTool Revenue Optimization Script
 * Non-intrusive conversion banners, tool recommendations, sharing
 * <10KB standalone, no dependencies
 * Include on free tool pages: <script src="/js/revenue.js" defer></script>
 */
(function(){
'use strict';
// Pro users get a clean experience — skip all upgrade UI
if(window.NexToolPro&&window.NexToolPro.active)return;
var P='ntool_rev_',D=864e5,BD=3e4,PU=3,EU='/pro.html',UU='/pro.html';
// Compact catalog: [slug,displayName,category] — category: d=dev,g=design,t=text,m=media,c=converter,u=utility
var T='qr-generator:QR Code Generator:m,password-generator:Password Generator:u,json-formatter:JSON Formatter:d,color-palette:Color Palette Generator:g,gradient-generator:CSS Gradient Generator:g,text-analyzer:Text Analyzer:t,base64:Base64 Encoder/Decoder:d,regex-tester:Regex Tester:d,markdown-preview:Markdown Preview:t,image-compressor:Image Compressor:m,unit-converter:Unit Converter:c,lorem-generator:Lorem Ipsum Generator:t,css-formatter:CSS Beautifier:d,hash-generator:Hash Generator:d,timestamp-converter:Timestamp Converter:c,diff-checker:Diff Checker:d,emoji-picker:Emoji Picker:t,meta-tag-generator:Meta Tag Generator:d,favicon-generator:Favicon Generator:m,box-shadow-generator:Box Shadow Generator:g,pomodoro-timer:Pomodoro Timer:u,markdown-table:Markdown Table Generator:t,color-converter:Color Converter:g,placeholder-image:Placeholder Image:m,svg-optimizer:SVG Optimizer:m,aspect-ratio-calculator:Aspect Ratio Calculator:g,crontab-generator:Crontab Generator:d,json-to-csv:JSON to CSV:c,html-to-markdown:HTML to Markdown:c,chmod-calculator:chmod Calculator:d,ip-info:IP Address Info:u,noise-generator:Noise Generator:u,url-encoder:URL Encoder/Decoder:d,text-diff-merger:Text Diff & Merger:t,yaml-json:YAML/JSON Converter:c,pixel-ruler:Pixel Ruler:g,color-picker:Color Picker:g,json-viewer:JSON Viewer:d,character-counter:Character Counter:t,random-generator:Random Generator:u,html-formatter:HTML Formatter:d,javascript-formatter:JavaScript Formatter:d,yaml-formatter:YAML Formatter:d,csv-formatter:CSV Formatter:c,morse-code:Morse Code Translator:c,countdown-timer:Countdown Timer:u,notepad:Online Notepad:t,keyboard-tester:Keyboard Tester:u'.split(',').map(function(s){var p=s.split(':');return{s:p[0],n:p[1],c:p[2]};});
var CL={d:'Developer',g:'Design',t:'Text & Content',m:'Media',c:'Converter',u:'Utility'};
// Blog article catalog: [slug,title,categories] — categories match tool cats (d,g,t,m,c,u,a=all)
var A='10-developer-tools-2026:10 Developer Tools You Need in 2026:d,api-testing-guide:The Complete API Testing Guide:d,api-design-best-practices:API Design Best Practices:d,git-workflow-guide:Git Workflow Guide for Teams:d,free-developer-tools-2026:Free Developer Tools in 2026:dc,developer-productivity-tools-2026:Developer Productivity Tools 2026:du,javascript-performance-optimization:JavaScript Performance Optimization:d,css-tricks-every-developer-should-know:CSS Tricks Every Developer Should Know:gd,css-animations-complete-guide:CSS Animations Complete Guide:g,css-layout-masterclass:CSS Layout Masterclass:g,responsive-design-guide-2026:Responsive Design Guide 2026:gm,ai-content-brand-voice-framework:AI Content & Brand Voice Framework:t,build-landing-page-one-hour:Build a Landing Page in One Hour:tgm,automation-saves-20-hours-week:How Automation Saves 20 Hours/Week:ua,automate-business-workflows:Automate Your Business Workflows:ua,best-ai-tools-small-business-2026:Best AI Tools for Small Business:ua,ai-solopreneur-playbook:The AI Solopreneur Playbook:ua,web-security-checklist:Web Security Checklist 2026:du,create-privacy-policy-guide:Create a Privacy Policy Guide:du,why-small-business-needs-website-2026:Why Your Business Needs a Website:a,5-costly-website-mistakes:5 Costly Website Mistakes to Avoid:a,website-templates-vs-custom-build:Templates vs Custom Build:gm'.split(',').map(function(s){var p=s.split(':');return{s:p[0],t:p[1],c:p[2]};});
function st(k,v){try{localStorage.setItem(P+k,JSON.stringify(v))}catch(e){}}
function ld(k,f){try{var v=localStorage.getItem(P+k);return v!==null?JSON.parse(v):f}catch(e){return f}}
function slug(){var m=location.pathname.match(/\/free-tools\/([^\/]+)\.html/);return m?m[1]:null}
function css(){var s=document.createElement('style');s.textContent='.nrb{position:fixed;bottom:0;left:0;right:0;z-index:9990;transform:translateY(100%);transition:transform .5s cubic-bezier(.22,1,.36,1);font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif}.nrb.v{transform:translateY(0)}.nrbi{max-width:800px;margin:0 auto;padding:16px 24px;background:#111118;border-top:1px solid rgba(99,102,241,.2);border-radius:16px 16px 0 0;display:flex;align-items:center;gap:16px;box-shadow:0 -8px 32px rgba(0,0,0,.5)}.nrb .ni{width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#6366f1,#a855f7);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}.nrb .nt{flex:1;color:#e2e8f0;font-size:14px;line-height:1.5}.nrb .nt strong{color:#fff}.nrb .nc{padding:10px 20px;background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;text-decoration:none;transition:opacity .2s}.nrb .nc:hover{opacity:.9}.nrb .nx{background:none;border:none;color:#64748b;font-size:20px;cursor:pointer;padding:4px 8px;line-height:1;transition:color .2s}.nrb .nx:hover{color:#e2e8f0}.nrp .nrbi{border-top:2px solid #6366f1;background:linear-gradient(180deg,#151520,#111118)}.nrp .nb{display:inline-block;padding:2px 8px;background:rgba(99,102,241,.2);color:#818cf8;border-radius:4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}.nrl{max-width:900px;margin:48px auto 0;padding:32px 24px;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif}.nrl h3{color:#e2e8f0;font-size:18px;font-weight:600;margin-bottom:16px}.nrlg{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}.nrl a{display:block;padding:16px;background:#111118;border:1px solid rgba(99,102,241,.1);border-radius:12px;color:#e2e8f0;text-decoration:none;font-size:14px;font-weight:500;transition:border-color .2s,transform .2s}.nrl a:hover{border-color:rgba(99,102,241,.4);transform:translateY(-2px)}.nrl a span{display:block;color:#94a3b8;font-size:12px;font-weight:400;margin-top:4px}.nrs{position:fixed;bottom:24px;right:24px;z-index:9980;width:44px;height:44px;border-radius:50%;background:#111118;border:1px solid rgba(99,102,241,.2);color:#94a3b8;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .3s;box-shadow:0 4px 16px rgba(0,0,0,.3);font-family:Inter,sans-serif}.nrs:hover{background:#6366f1;color:#fff;border-color:#6366f1;transform:scale(1.1)}.nrt{position:fixed;bottom:80px;right:24px;z-index:9981;padding:10px 18px;background:#22c55e;color:#fff;border-radius:8px;font-size:13px;font-weight:500;opacity:0;transform:translateY(8px);transition:all .3s;pointer-events:none;font-family:Inter,sans-serif}.nrt.show{opacity:1;transform:translateY(0)}';document.head.appendChild(s)}
function trackVisit(){var s=slug();if(!s)return;var v=ld('visited',[]);if(v.indexOf(s)===-1){v.push(s);st('visited',v)}st('vstart',Date.now());st('vslug',s)}
function trackTime(){var s=ld('vstart',null),g=ld('vslug',null);if(!s||!g)return;var e=Math.round((Date.now()-s)/1e3),t=ld('times',{});t[g]=(t[g]||0)+e;st('times',t)}
function vc(){return ld('visited',[]).length}
function dd(t){var d=ld('d_'+t,0);return d&&Date.now()-d<D}
function ds(t){st('d_'+t,Date.now())}
function banner(){
if(dd('banner'))return;
var pw=vc()>=PU,bt=pw?'power':'std';
if(dd(bt))return;
var b=document.createElement('div');b.className='nrb'+(pw?' nrp':'');b.id='nrb';
var h='<div class="nrbi"><div class="ni">'+(pw?'\u26A1':'\u2728')+'</div><div class="nt">';
if(pw)h+='<div class="nb">Power User</div><strong>You\'ve explored '+vc()+' tools!</strong> Go Pro \u2014 no banners, clean output, enhanced features \u2014 <strong>$29 one-time</strong>';
else h+='Love this tool? <strong>NexTool Pro</strong> \u2014 distraction-free, enhanced features \u2014 <strong>$29</strong>';
h+='</div><a href="'+EU+'" class="nc">'+(pw?'See NexTool Pro':'Get Pro \u2014 $29')+'</a><button class="nx" aria-label="Dismiss">\u00D7</button></div>';
b.innerHTML=h;document.body.appendChild(b);
requestAnimationFrame(function(){requestAnimationFrame(function(){b.classList.add('v')})});
var sb=document.getElementById('nrs');
if(sb)sb.style.bottom='90px';
b.querySelector('.nx').addEventListener('click',function(){b.classList.remove('v');ds(bt);ds('banner');if(sb)sb.style.bottom='24px';setTimeout(function(){b.remove()},500)})}
function related(){
var s=slug();if(!s)return;
var cur=null;for(var i=0;i<T.length;i++)if(T[i].s===s){cur=T[i];break}
if(!cur)return;
var sc=T.filter(function(t){return t.c===cur.c&&t.s!==s});
var ot=T.filter(function(t){return t.c!==cur.c&&t.s!==s});
function sh(a){for(var j=a.length-1;j>0;j--){var k=Math.floor(Math.random()*(j+1)),tmp=a[j];a[j]=a[k];a[k]=tmp}return a}
sh(sc);sh(ot);
var pk=sc.slice(0,3);if(pk.length<3)pk=pk.concat(ot.slice(0,3-pk.length));
if(!pk.length)return;
var sec=document.createElement('div');sec.className='nrl';
sec.innerHTML='<h3>More tools you\'ll love</h3><div class="nrlg">'+pk.map(function(t){return'<a href="/free-tools/'+t.s+'.html">'+t.n+'<span>'+(CL[t.c]||'Tool')+'</span></a>'}).join('')+'</div>';
var ft=document.querySelector('footer');
if(ft)ft.parentNode.insertBefore(sec,ft);else document.body.appendChild(sec)}
function reading(){
var s=slug();if(!s)return;
var cat=null;for(var i=0;i<T.length;i++)if(T[i].s===s){cat=T[i].c;break}
if(!cat)cat='a';
var ma=A.filter(function(a){return a.c.indexOf(cat)!==-1||a.c.indexOf('a')!==-1});
var oa=A.filter(function(a){return a.c.indexOf(cat)===-1&&a.c.indexOf('a')===-1});
function sh(arr){for(var j=arr.length-1;j>0;j--){var k=Math.floor(Math.random()*(j+1)),tmp=arr[j];arr[j]=arr[k];arr[k]=tmp}return arr}
sh(ma);sh(oa);
var pk=ma.slice(0,3);if(pk.length<2)pk=pk.concat(oa.slice(0,2-pk.length));
if(!pk.length)return;
var sec=document.createElement('div');sec.className='nrl nra';
sec.innerHTML='<h3>Related reading</h3><div class="nrlg">'+pk.map(function(a){return'<a href="/blog/'+a.s+'.html">'+a.t+'<span>Blog</span></a>'}).join('')+'</div>';
var rt=document.querySelector('.nrl:not(.nra)');
if(rt&&rt.nextSibling)rt.parentNode.insertBefore(sec,rt.nextSibling);
else{var ft=document.querySelector('footer');if(ft)ft.parentNode.insertBefore(sec,ft);else document.body.appendChild(sec)}}
function share(){
var btn=document.createElement('button');btn.className='nrs';btn.id='nrs';btn.innerHTML='\uD83D\uDD17';btn.title='Share this tool';btn.setAttribute('aria-label','Copy link to share this tool');
var toast=document.createElement('div');toast.className='nrt';toast.id='nrt';toast.textContent='Link copied!';
document.body.appendChild(btn);document.body.appendChild(toast);
btn.addEventListener('click',function(){var u=location.href;if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(u).then(tt);else{var inp=document.createElement('input');inp.value=u;document.body.appendChild(inp);inp.select();document.execCommand('copy');document.body.removeChild(inp);tt()}});
function tt(){toast.classList.add('show');setTimeout(function(){toast.classList.remove('show')},2e3)}}
function init(){
var s=slug();if(!s)return;
css();trackVisit();share();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){related();reading()});else{related();reading()}
setTimeout(banner,BD);
window.addEventListener('beforeunload',trackTime)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
/* Load pro-check first (sync), then pipeline + conversion engine + pro mode + pro features + branded output */
var pc=document.createElement('script');pc.src='/js/pro-check.js';document.head.appendChild(pc);
var pl=document.createElement('script');pl.src='/js/pipeline.js';pl.defer=true;document.head.appendChild(pl);
var ce=document.createElement('script');ce.src='/js/conversion-engine.js';ce.defer=true;document.head.appendChild(ce);
var pm=document.createElement('script');pm.src='/js/pro-mode.js';pm.defer=true;document.head.appendChild(pm);
var pf=document.createElement('script');pf.src='/js/pro-features.js';pf.defer=true;document.head.appendChild(pf);
var bo=document.createElement('script');bo.src='/js/branded-output.js';bo.defer=true;document.head.appendChild(bo);
})();
