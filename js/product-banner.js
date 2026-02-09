/**
 * NexTool Product Banner — Traffic Pipeline
 * Contextual product recommendations on free tool + blog pages
 * Connects 151 tools + 35 blogs → products.html
 * <5KB standalone, no dependencies
 * Loaded by revenue.js on all tool pages
 */
(function(){
'use strict';
if(window.NexToolPro&&window.NexToolPro.active)return;

var P='ntpb_',D=6048e5; // 7 day dismiss
var PP='/products.html';

// Product catalog
var PRODUCTS=[
  {id:'kit',name:'MCP Starter Kit',price:19,desc:'Build your own MCP servers with production templates.',anchor:'',icon:'\u{1F4E6}',tags:'d'},
  {id:'memory',name:'Smart Memory Pro',price:29,desc:'Persistent AI memory. Your agent remembers everything.',anchor:'',icon:'\u{1F9E0}',tags:'dtu'},
  {id:'nexbot',name:'NexBot Chat Widget',price:39,desc:'AI chat on any site. One script tag, zero API costs.',anchor:'',icon:'\u{1F4AC}',tags:'gmtu'},
  {id:'nexus',name:'NEXUS Developer Suite',price:49,desc:'28 MCP tools. Memory, codegen, agents, monitoring.',anchor:'',icon:'\u26A1',tags:'d'},
  {id:'bundle',name:'Complete AI Dev Bundle',price:99,desc:'All 4 products. Save $37. Lifetime updates.',anchor:'#bundle',icon:'\u{1F680}',tags:'dgmtcu'}
];

// Category to product relevance
function getRelevant(cat){
  var scored=PRODUCTS.map(function(p){
    var s=0;
    if(p.tags.indexOf(cat)!==-1)s+=2;
    if(p.id==='bundle')s+=1;
    return{p:p,s:s};
  });
  scored.sort(function(a,b){return b.s-a.s});
  return scored.slice(0,2).map(function(x){return x.p});
}

function st(k,v){try{localStorage.setItem(P+k,JSON.stringify(v))}catch(e){}}
function ld(k,f){try{var v=localStorage.getItem(P+k);return v!==null?JSON.parse(v):f}catch(e){return f}}
function dd(t){var d=ld('d_'+t,0);return d&&Date.now()-d<D}
function ds(t){st('d_'+t,Date.now())}

// Detect page type and category
function detectPage(){
  var path=location.pathname;
  // Free tool pages
  var tm=path.match(/\/free-tools\/([^\/]+)\.html/);
  if(tm){
    var slug=tm[1];
    // Get category from revenue.js catalog if available
    var cat='d'; // default developer
    if(window._ntCat)cat=window._ntCat;
    else{
      // Infer from common patterns
      if(/color|palette|gradient|shadow|border|flex|grid|css|font|typo|glass|neum|clip|filter|transform|responsive|svg|whiteboard|pixel/i.test(slug))cat='g';
      else if(/text|word|character|lorem|markdown|slug|notepad|emoji|morse/i.test(slug))cat='t';
      else if(/image|qr|barcode|favicon|screenshot|og-image|placeholder|compressor|resizer|base64/i.test(slug))cat='m';
      else if(/convert|csv|json-to|xml-to|yaml|binary|unit-|css-unit|encode|html-to|markdown-to/i.test(slug))cat='c';
      else if(/calc|timer|stopwatch|pomodoro|countdown|age-|bmi|loan|percentage|screen-|keyboard|typing|noise|random|ip-|dns|invoice|date-|ical|vcard|email-sig|privacy|tos|uuid/i.test(slug))cat='u';
    }
    return{type:'tool',slug:slug,cat:cat};
  }
  // Blog pages
  var bm=path.match(/\/blog\/([^\/]+)\.html/);
  if(bm)return{type:'blog',slug:bm[1],cat:'d'};
  return null;
}

function injectCSS(){
  var s=document.createElement('style');
  s.textContent=[
    // Inline product section
    '.npb-section{max-width:900px;margin:48px auto 0;padding:32px 24px;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif}',
    '.npb-section h3{color:#e2e8f0;font-size:17px;font-weight:700;margin-bottom:6px}',
    '.npb-section .npb-sub{font-size:13px;color:#64748b;margin-bottom:16px}',
    '.npb-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}',
    '.npb-card{padding:20px;background:#111118;border:1px solid rgba(99,102,241,.1);border-radius:14px;transition:border-color .3s,transform .3s;text-decoration:none;color:inherit;display:block}',
    '.npb-card:hover{border-color:rgba(99,102,241,.35);transform:translateY(-3px)}',
    '.npb-card-top{display:flex;align-items:center;gap:12px;margin-bottom:10px}',
    '.npb-card-icon{width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#6366f1,#a855f7);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}',
    '.npb-card-name{font-size:15px;font-weight:700;color:#f1f5f9}',
    '.npb-card-price{font-size:13px;color:#6366f1;font-weight:600}',
    '.npb-card-desc{font-size:13px;color:#94a3b8;line-height:1.6;margin-bottom:12px}',
    '.npb-card-cta{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:#818cf8;transition:color .2s}',
    '.npb-card:hover .npb-card-cta{color:#a5b4fc}',
    // Enhanced banner (replaces revenue.js banner when needed)
    '.npb-bar{position:fixed;bottom:0;left:0;right:0;z-index:9992;transform:translateY(100%);transition:transform .5s cubic-bezier(.22,1,.36,1);font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif}',
    '.npb-bar.v{transform:translateY(0)}',
    '.npb-bar-inner{max-width:860px;margin:0 auto;padding:14px 20px;background:linear-gradient(180deg,#151520,#111118);border-top:2px solid rgba(99,102,241,.3);border-radius:14px 14px 0 0;display:flex;align-items:center;gap:14px;box-shadow:0 -8px 40px rgba(0,0,0,.5)}',
    '.npb-bar-icon{width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,#6366f1,#a855f7);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}',
    '.npb-bar-text{flex:1;color:#e2e8f0;font-size:13px;line-height:1.5}',
    '.npb-bar-text strong{color:#fff}',
    '.npb-bar-text .npb-subtle{color:#64748b;font-size:11px;display:block;margin-top:2px}',
    '.npb-bar-btn{padding:10px 20px;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;text-decoration:none;transition:all .2s;font-family:inherit}',
    '.npb-bar-btn:hover{filter:brightness(1.15);transform:translateY(-1px)}',
    '.npb-bar-x{background:none;border:none;color:#475569;font-size:18px;cursor:pointer;padding:4px 8px;line-height:1;transition:color .2s}',
    '.npb-bar-x:hover{color:#e2e8f0}',
    '@media(max-width:600px){.npb-cards{grid-template-columns:1fr}.npb-bar-inner{flex-wrap:wrap;gap:10px;padding:12px 16px}.npb-bar-text{min-width:100%}.npb-bar-btn{flex:1}}'
  ].join('');
  document.head.appendChild(s);
}

// Inline product cards section
function injectProductSection(page){
  if(dd('section'))return;
  var products=getRelevant(page.cat);
  if(!products.length)return;

  var sec=document.createElement('div');
  sec.className='npb-section';
  var heading=page.type==='tool'?'Level up your workflow':'Recommended tools';
  sec.innerHTML='<h3>'+heading+'</h3>'+
    '<div class="npb-sub">AI-powered developer tools. One-time payments from $19.</div>'+
    '<div class="npb-cards">'+products.map(function(p){
      var url=PP+(p.anchor||'');
      return '<a href="'+url+'" class="npb-card">'+
        '<div class="npb-card-top">'+
          '<div class="npb-card-icon">'+p.icon+'</div>'+
          '<div><div class="npb-card-name">'+p.name+'</div>'+
          '<div class="npb-card-price">$'+p.price+' one-time</div></div>'+
        '</div>'+
        '<div class="npb-card-desc">'+p.desc+'</div>'+
        '<span class="npb-card-cta">View details \u2192</span>'+
      '</a>';
    }).join('')+'</div>';

  // Insert before footer or after related reading
  var reading=document.querySelector('.nrl.nra');
  var related=document.querySelector('.nrl:not(.nra)');
  var footer=document.querySelector('footer');
  if(reading&&reading.nextSibling)reading.parentNode.insertBefore(sec,reading.nextSibling);
  else if(related&&related.nextSibling)related.parentNode.insertBefore(sec,related.nextSibling);
  else if(footer)footer.parentNode.insertBefore(sec,footer);
  else document.body.appendChild(sec);
}

// Smart product banner
function showBanner(page){
  if(dd('bar'))return;
  // Don't show if revenue.js banner is already visible
  if(document.getElementById('nrb'))return;

  var product=getRelevant(page.cat)[0];
  if(!product)product=PRODUCTS[4]; // bundle fallback

  var bar=document.createElement('div');
  bar.className='npb-bar';
  bar.id='npb-bar';
  var url=PP+(product.anchor||'');

  bar.innerHTML='<div class="npb-bar-inner">'+
    '<div class="npb-bar-icon">'+product.icon+'</div>'+
    '<div class="npb-bar-text">'+
      '<strong>'+product.name+'</strong> \u2014 '+product.desc+
      '<span class="npb-subtle">$'+product.price+' one-time \u00B7 30-day money-back guarantee</span>'+
    '</div>'+
    '<a href="'+url+'" class="npb-bar-btn">Learn More</a>'+
    '<button class="npb-bar-x" aria-label="Dismiss">\u00D7</button>'+
  '</div>';

  document.body.appendChild(bar);
  requestAnimationFrame(function(){requestAnimationFrame(function(){bar.classList.add('v')})});

  // Adjust share button position
  var sb=document.getElementById('nrs');
  if(sb)sb.style.bottom='80px';

  bar.querySelector('.npb-bar-x').addEventListener('click',function(){
    bar.classList.remove('v');
    ds('bar');
    if(sb)sb.style.bottom='24px';
    setTimeout(function(){bar.remove()},500);
  });
}

function init(){
  var page=detectPage();
  if(!page)return;

  injectCSS();

  // Inline product section — show immediately when DOM ready
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){
      setTimeout(function(){injectProductSection(page)},500);
    });
  }else{
    setTimeout(function(){injectProductSection(page)},500);
  }

  // Banner — show after 45 seconds for engaged users
  setTimeout(function(){showBanner(page)},45e3);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();
