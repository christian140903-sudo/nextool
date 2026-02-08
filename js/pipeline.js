/**
 * NexTool Pipeline v1.0 — Chain tools together
 * Like Unix pipes for the browser: Output A → Input B
 * No competitor has this. World's first.
 * Loaded via revenue.js, <4KB standalone
 */
(function(){
'use strict';

var PIPE_KEY='ntool_pipe',PIPE_TTL=120000;

// Tool Registry: [slug, name, inputSelector, outputSelector, category]
// null input = generator (no input); null output = analyzer (no pipeable output)
// cat: d=dev c=convert t=text u=utility
var R=[
['json-formatter','JSON Formatter','#jsonInput','.output-area','d'],
['base64','Base64 Encode/Decode','#inputArea','#outputArea','c'],
['url-encoder','URL Encoder/Decoder','#inputArea','#outputArea','c'],
['hash-generator','Hash Generator','#text-input','#hash-sha256','d'],
['json-to-csv','JSON to CSV','#inputData','#outputData','c'],
['csv-to-json','CSV to JSON','#inputData','#outputData','c'],
['yaml-json','YAML/JSON Converter','#yaml-input','#json-input','c'],
['css-formatter','CSS Formatter','#input','#output','d'],
['css-minifier','CSS Minifier','#input','#output','d'],
['sql-formatter','SQL Formatter','#sqlInput','#sqlOutput','d'],
['html-to-markdown','HTML to Markdown','#input-editor','#output-editor','c'],
['html-entity-encoder','HTML Entities','#inputArea','#outputArea','c'],
['jwt-decoder','JWT Decoder','#jwtInput',null,'d'],
['text-analyzer','Text Analyzer','#textInput',null,'t'],
['regex-tester','Regex Tester','#testArea',null,'d'],
['diff-checker','Diff Checker','#left','#diff-output','t'],
['markdown-preview','Markdown Preview','#md-input',null,'t'],
['password-generator','Password Generator',null,'.pw-text','u'],
['uuid-generator','UUID Generator',null,'#output','u'],
['lorem-generator','Lorem Ipsum Generator',null,'#output-text','t'],
['binary-converter','Binary Converter','#inputArea','#outputArea','c'],
['timestamp-converter','Timestamp Converter','#tsInput','#tsOutput','c'],
['number-base-converter','Number Base Converter','#inputArea','#outputArea','c'],
['hex-converter','Hex Converter','#inputArea','#outputArea','c'],
['text-case-converter','Text Case Converter','#inputText','#outputText','t'],
['word-counter','Word Counter','#textInput',null,'t'],
['string-utilities','String Utilities','#inputArea','#outputArea','t'],
['json-path-finder','JSON Path Finder','#jsonInput',null,'d'],
['css-unit-converter','CSS Unit Converter',null,null,'d'],
['color-converter','Color Converter',null,null,'d'],
['json-viewer','JSON Viewer','#jsonInput','#treeWrap','d'],
['html-formatter','HTML Formatter','#input','#output','d'],
['javascript-formatter','JS Formatter','#input','#output','d'],
['yaml-formatter','YAML Formatter','#input','#output','d'],
['csv-formatter','CSV Formatter','#input',null,'c'],
['morse-code','Morse Code','#inputArea','#outputArea','c'],
['character-counter','Character Counter','#textInput',null,'t'],
['notepad','Notepad','#editor',null,'t'],
['random-generator','Random Generator',null,'#numResults','u'],
];

var CAT_NAMES={d:'Developer',c:'Converter',t:'Text',u:'Utility'};

// Build lookup
var M={};R.forEach(function(t){M[t[0]]={n:t[1],i:t[2],o:t[3],c:t[4]};});

// Current tool
var slug=(location.pathname.match(/\/free-tools\/([^\/]+?)(?:\.html)?$/)||[])[1];
if(!slug)return;
var cur=M[slug]||null;

// Read output from current tool
function readOutput(){
  if(!cur||!cur.o)return'';
  var el=document.querySelector(cur.o);
  if(!el)return'';
  var t=el.tagName==='TEXTAREA'||el.tagName==='INPUT'?el.value:el.textContent;
  return(t||'').trim();
}

// Write input to current tool
function writeInput(text){
  var sels=cur&&cur.i?cur.i.split(','):[];
  sels.push('textarea:not([readonly]):not([id*=output])','input[type=text]:not([readonly])');
  for(var i=0;i<sels.length;i++){
    var el=document.querySelector(sels[i].trim());
    if(!el)continue;
    if(el.tagName==='TEXTAREA'||el.tagName==='INPUT'){
      el.value=text;
      el.dispatchEvent(new Event('input',{bubbles:true}));
      el.dispatchEvent(new Event('change',{bubbles:true}));
      el.focus();
      return true;
    }
  }
  return false;
}

// Get destination tools (those with input selectors, excluding self)
function getDests(){
  var cats={d:[],c:[],t:[],u:[]};
  R.forEach(function(t){
    if(t[0]===slug||!t[2])return;
    var c=t[4]||'u';
    if(!cats[c])cats[c]=[];
    cats[c].push({s:t[0],n:t[1]});
  });
  return cats;
}

// Send data to destination tool
function sendTo(destSlug){
  var text=readOutput();
  if(!text){showToast('No output to send');return;}
  try{
    localStorage.setItem(PIPE_KEY,JSON.stringify({
      text:text,from:slug,fn:cur?cur.n:slug,ts:Date.now()
    }));
  }catch(e){showToast('Storage full');return;}
  window.location.href='/free-tools/'+destSlug+'.html';
}

// Check for incoming pipeline data
function checkIncoming(){
  var raw;
  try{raw=localStorage.getItem(PIPE_KEY);}catch(e){return;}
  if(!raw)return;
  try{
    var d=JSON.parse(raw);
    localStorage.removeItem(PIPE_KEY);
    if(Date.now()-d.ts>PIPE_TTL)return;
    if(!cur||!cur.i)return;
    setTimeout(function(){
      if(writeInput(d.text)){
        showPipeNotif(d.fn||d.from);
      }
    },400);
  }catch(e){localStorage.removeItem(PIPE_KEY);}
}

// Inject CSS
function injectCSS(){
  var s=document.createElement('style');
  s.textContent=
  '.nt-pipe-fab{position:fixed;bottom:80px;right:24px;z-index:9978;width:44px;height:44px;'+
  'border-radius:50%;background:#111118;border:1px solid rgba(99,102,241,.2);color:#94a3b8;'+
  'font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;'+
  'transition:all .3s;box-shadow:0 4px 16px rgba(0,0,0,.3);font-family:Inter,sans-serif}'+
  '.nt-pipe-fab:hover{background:rgba(99,102,241,.15);color:#a5b4fc;border-color:rgba(99,102,241,.4);transform:scale(1.1)}'+
  '.nt-pipe-fab.active{background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;border-color:transparent}'+

  '.nt-pipe-panel{position:fixed;bottom:132px;right:24px;z-index:9979;width:280px;max-height:420px;'+
  'background:#111118;border:1px solid rgba(99,102,241,.2);border-radius:16px;'+
  'box-shadow:0 20px 60px rgba(0,0,0,.6);overflow:hidden;'+
  'transform:translateY(12px) scale(.95);opacity:0;pointer-events:none;'+
  'transition:transform .25s cubic-bezier(.22,1,.36,1),opacity .25s;font-family:Inter,-apple-system,sans-serif}'+
  '.nt-pipe-panel.open{transform:translateY(0) scale(1);opacity:1;pointer-events:auto}'+

  '.nt-pipe-head{padding:14px 16px 10px;border-bottom:1px solid rgba(99,102,241,.1)}'+
  '.nt-pipe-head h4{font-size:13px;font-weight:700;color:#e2e8f0;margin:0 0 2px;display:flex;align-items:center;gap:6px}'+
  '.nt-pipe-head p{font-size:11px;color:#64748b;margin:0}'+

  '.nt-pipe-search{width:100%;padding:8px 12px;background:#0a0a12;border:1px solid rgba(99,102,241,.1);'+
  'border-radius:8px;color:#e2e8f0;font-size:12px;font-family:inherit;outline:none;margin-top:8px;'+
  'transition:border-color .2s}'+
  '.nt-pipe-search:focus{border-color:rgba(99,102,241,.4)}'+
  '.nt-pipe-search::placeholder{color:#4a4a5a}'+

  '.nt-pipe-list{overflow-y:auto;max-height:320px;padding:6px}'+
  '.nt-pipe-cat{padding:6px 10px 4px;font-size:10px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:.5px}'+
  '.nt-pipe-item{display:flex;align-items:center;gap:8px;padding:9px 10px;border-radius:8px;cursor:pointer;'+
  'transition:background .15s;color:#cbd5e1;font-size:12.5px;font-weight:500}'+
  '.nt-pipe-item:hover{background:rgba(99,102,241,.1);color:#e2e8f0}'+
  '.nt-pipe-item .arrow{margin-left:auto;color:#4a4a5a;font-size:11px;transition:transform .15s}'+
  '.nt-pipe-item:hover .arrow{transform:translateX(3px);color:#6366f1}'+

  '.nt-pipe-empty{padding:20px 16px;text-align:center;color:#64748b;font-size:12px}'+

  '.nt-pipe-notif{position:fixed;top:80px;left:50%;transform:translateX(-50%) translateY(-20px);'+
  'background:linear-gradient(135deg,rgba(99,102,241,.15),rgba(168,85,247,.15));'+
  'border:1px solid rgba(99,102,241,.3);color:#e2e8f0;padding:12px 20px;border-radius:12px;'+
  'font-size:13px;font-weight:500;z-index:9999;opacity:0;transition:all .4s cubic-bezier(.22,1,.36,1);'+
  'pointer-events:none;backdrop-filter:blur(12px);font-family:Inter,sans-serif;'+
  'box-shadow:0 8px 32px rgba(0,0,0,.4)}'+
  '.nt-pipe-notif.show{opacity:1;transform:translateX(-50%) translateY(0)}'+
  '.nt-pipe-notif strong{color:#a5b4fc}'+

  '.nt-pipe-toast{position:fixed;bottom:140px;right:24px;z-index:9980;background:#1e1e2e;'+
  'border:1px solid rgba(239,68,68,.2);color:#fca5a5;padding:8px 14px;border-radius:8px;'+
  'font-size:12px;opacity:0;transform:translateY(8px);transition:all .3s;pointer-events:none;'+
  'font-family:Inter,sans-serif}'+
  '.nt-pipe-toast.show{opacity:1;transform:translateY(0)}'+

  '@media(max-width:640px){.nt-pipe-panel{right:12px;left:12px;width:auto;bottom:120px;max-height:60vh}'+
  '.nt-pipe-fab{bottom:70px;right:16px;width:40px;height:40px;font-size:16px}}';

  document.head.appendChild(s);
}

// Build the panel HTML
function buildPanel(){
  var cats=getDests();
  var order=['c','d','t','u'];
  var html='<div class="nt-pipe-head"><h4>\u26D3\uFE0F Send output to...</h4>'+
    '<p>Chain this tool\'s output into another</p>'+
    '<input class="nt-pipe-search" placeholder="Search tools..." type="text"></div>'+
    '<div class="nt-pipe-list">';

  var hasItems=false;
  order.forEach(function(c){
    if(!cats[c]||!cats[c].length)return;
    html+='<div class="nt-pipe-cat">'+CAT_NAMES[c]+'</div>';
    cats[c].forEach(function(t){
      hasItems=true;
      html+='<div class="nt-pipe-item" data-slug="'+t.s+'" data-name="'+t.n.toLowerCase()+'">'+
        t.n+'<span class="arrow">\u203A</span></div>';
    });
  });

  if(!hasItems)html+='<div class="nt-pipe-empty">No compatible tools found</div>';
  html+='</div>';
  return html;
}

// Create pipeline UI
function createUI(){
  // Only show on tools with output
  if(!cur||!cur.o)return;

  injectCSS();

  // Floating button
  var fab=document.createElement('button');
  fab.className='nt-pipe-fab';
  fab.innerHTML='\u26D3\uFE0F';
  fab.title='Send output to another tool (Pipeline)';
  fab.setAttribute('aria-label','Pipeline: send output to another tool');

  // Panel
  var panel=document.createElement('div');
  panel.className='nt-pipe-panel';
  panel.innerHTML=buildPanel();

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  // Toggle
  var isOpen=false;
  fab.addEventListener('click',function(e){
    e.stopPropagation();
    isOpen=!isOpen;
    panel.classList.toggle('open',isOpen);
    fab.classList.toggle('active',isOpen);
    if(isOpen){
      var txt=readOutput();
      if(!txt){
        showToast('Generate output first, then send it');
      }
      var search=panel.querySelector('.nt-pipe-search');
      if(search)setTimeout(function(){search.focus();},100);
    }
  });

  // Close on outside click
  document.addEventListener('click',function(e){
    if(isOpen&&!panel.contains(e.target)&&e.target!==fab){
      isOpen=false;
      panel.classList.remove('open');
      fab.classList.remove('active');
    }
  });

  // Search filter
  var searchInput=panel.querySelector('.nt-pipe-search');
  if(searchInput){
    searchInput.addEventListener('input',function(){
      var q=this.value.toLowerCase().trim();
      var items=panel.querySelectorAll('.nt-pipe-item');
      var cats=panel.querySelectorAll('.nt-pipe-cat');
      items.forEach(function(item){
        var name=item.getAttribute('data-name')||'';
        item.style.display=!q||name.indexOf(q)!==-1?'':'none';
      });
      // Hide empty category headers
      cats.forEach(function(cat){
        var next=cat.nextElementSibling;
        var hasVisible=false;
        while(next&&!next.classList.contains('nt-pipe-cat')){
          if(next.classList.contains('nt-pipe-item')&&next.style.display!=='none')hasVisible=true;
          next=next.nextElementSibling;
        }
        cat.style.display=hasVisible?'':'none';
      });
    });
  }

  // Destination clicks
  panel.addEventListener('click',function(e){
    var item=e.target.closest('.nt-pipe-item');
    if(!item)return;
    var destSlug=item.getAttribute('data-slug');
    if(destSlug)sendTo(destSlug);
  });

  // Adjust position if share button exists
  var shareBtn=document.getElementById('nrs');
  if(shareBtn){
    fab.style.bottom='80px';
  }
}

// Show pipeline received notification
function showPipeNotif(fromName){
  var n=document.createElement('div');
  n.className='nt-pipe-notif';
  n.innerHTML='\u26D3\uFE0F Output from <strong>'+escHTML(fromName)+'</strong> loaded';
  document.body.appendChild(n);
  requestAnimationFrame(function(){requestAnimationFrame(function(){n.classList.add('show');});});
  setTimeout(function(){n.classList.remove('show');setTimeout(function(){n.remove();},500);},4000);
}

// Show toast message
function showToast(msg){
  var existing=document.querySelector('.nt-pipe-toast');
  if(existing)existing.remove();
  var t=document.createElement('div');
  t.className='nt-pipe-toast';
  t.textContent=msg;
  document.body.appendChild(t);
  requestAnimationFrame(function(){requestAnimationFrame(function(){t.classList.add('show');});});
  setTimeout(function(){t.classList.remove('show');setTimeout(function(){t.remove();},300);},3000);
}

// Escape HTML
function escHTML(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

// Init
function init(){
  checkIncoming();
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',createUI);
  }else{
    createUI();
  }
}

init();

})();
