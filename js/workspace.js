/**
 * NexTool Personal Workspace v1.0
 * Auto-saves tool results on copy → creates switching costs
 * Floating panel + badge on all tool pages
 * Free: 10 items | Pro: unlimited
 * Loaded via revenue.js, <6KB standalone
 */
(function(){
'use strict';
var K='ntool_ws',MF=10,MP=500;
function isPro(){return window.NexToolPro&&window.NexToolPro.active}
function gs(){try{return JSON.parse(localStorage.getItem(K))||[]}catch(e){return[]}}
function ss(d){try{localStorage.setItem(K,JSON.stringify(d))}catch(e){}}
function toolName(){var t=document.title||'';return t.replace(/\s*[-—|].*/,'').trim()||'Tool'}
function slug(){var m=location.pathname.match(/\/free-tools\/([^\/]+)\.html/);return m?m[1]:null}
function fmtTime(ts){var d=new Date(ts),n=Date.now()-ts;if(n<6e4)return'Just now';if(n<36e5)return Math.floor(n/6e4)+'m ago';if(n<864e5)return Math.floor(n/36e5)+'h ago';return d.toLocaleDateString('en-US',{month:'short',day:'numeric'})}
function esc(s){var d=document.createElement('div');d.textContent=s;return d.innerHTML}

// Save a result to workspace
function save(content,label){
if(!content||content.trim().length<3)return;
content=content.trim();
var ws=gs(),max=isPro()?MP:MF;
var item={id:Date.now().toString(36)+Math.random().toString(36).substr(2,4),tool:toolName(),slug:slug(),label:label||'Copied result',content:content.substring(0,8000),preview:content.substring(0,120).replace(/\n/g,' '),ts:Date.now(),pin:false};
// Dedupe: skip if same content from same tool within 3 seconds
if(ws.length&&ws[0].slug===item.slug&&ws[0].content===item.content&&Date.now()-ws[0].ts<3000)return;
ws.unshift(item);
// Enforce limit: keep pinned, trim unpinned
var pinned=ws.filter(function(i){return i.pin});
var unpinned=ws.filter(function(i){return!i.pin});
if(unpinned.length>max-pinned.length)unpinned=unpinned.slice(0,max-pinned.length);
ws=pinned.concat(unpinned);
ws.sort(function(a,b){return b.ts-a.ts});
ss(ws);
updateBadge();
toast('\u2705 Saved to Workspace');
}

// Intercept clipboard operations
function hookClipboard(){
// 1. Monkey-patch navigator.clipboard.writeText
if(navigator.clipboard&&navigator.clipboard.writeText){
var orig=navigator.clipboard.writeText.bind(navigator.clipboard);
navigator.clipboard.writeText=function(text){
save(text);
return orig(text);
};
}
// 2. Watch for execCommand('copy') via selection
var origExec=document.execCommand.bind(document);
document.execCommand=function(cmd){
if(cmd==='copy'){
var sel=window.getSelection();
if(sel&&sel.toString().length>2)save(sel.toString(),'Selected text');
// Also check focused textarea/input
var el=document.activeElement;
if(el&&(el.tagName==='TEXTAREA'||el.tagName==='INPUT')){
var val=el.value;
if(el.selectionStart!==el.selectionEnd)val=val.substring(el.selectionStart,el.selectionEnd);
if(val&&val.length>2)save(val);
}
}
return origExec.apply(document,arguments);
};
}

// Delete an item
function del(id){var ws=gs().filter(function(i){return i.id!==id});ss(ws);updateBadge();renderPanel()}

// Toggle pin
function pin(id){var ws=gs();for(var i=0;i<ws.length;i++){if(ws[i].id===id){ws[i].pin=!ws[i].pin;break}}ss(ws);renderPanel()}

// Copy item content back to clipboard
function copyItem(id){var ws=gs();for(var i=0;i<ws.length;i++){if(ws[i].id===id){
if(navigator.clipboard&&navigator.clipboard.writeText){
// Use original to avoid re-saving
var ta=document.createElement('textarea');ta.value=ws[i].content;ta.style.cssText='position:fixed;left:-9999px';document.body.appendChild(ta);ta.select();
var origExec2=Document.prototype.execCommand;origExec2.call(document,'copy');document.body.removeChild(ta);
}
toast('\u{1F4CB} Copied!');break}}}

// Toast notification
function toast(msg){
var t=document.getElementById('ws-toast');
if(!t){t=document.createElement('div');t.id='ws-toast';document.body.appendChild(t)}
t.textContent=msg;t.className='ws-toast show';
setTimeout(function(){t.className='ws-toast'},2000);
}

// Update badge count
function updateBadge(){
var b=document.getElementById('ws-badge');
var c=gs().length;
if(b){b.textContent=c;b.style.display=c?'':'none'}
}

// Render the slide-out panel
function renderPanel(){
var p=document.getElementById('ws-panel');if(!p)return;
var ws=gs(),max=isPro()?MP:MF;
var pinned=ws.filter(function(i){return i.pin});
var unpinned=ws.filter(function(i){return!i.pin});
var h='<div class="ws-head"><h3>\u{1F4BE} My Workspace</h3><span class="ws-count">'+ws.length+'/'+(isPro()?'\u221E':max)+'</span><button class="ws-close" onclick="document.getElementById(\'ws-panel\').classList.remove(\'open\')">\u00D7</button></div>';
if(!ws.length){
h+='<div class="ws-empty"><p>\u{1F4AD} No saved results yet</p><p class="ws-hint">Copy any tool output and it appears here automatically.</p></div>';
}else{
if(pinned.length){h+='<div class="ws-section">Pinned</div>';h+=pinned.map(itemHTML).join('')}
if(unpinned.length){if(pinned.length)h+='<div class="ws-section">Recent</div>';h+=unpinned.map(itemHTML).join('')}
}
if(!isPro()&&ws.length>=MF-2){
h+='<div class="ws-pro"><a href="/pro.html">\u26A1 NexTool Pro</a> \u2014 Unlimited workspace, export & more</div>';
}
h+='<div class="ws-foot"><a href="/workspace.html">Open Full Workspace \u2192</a></div>';
p.innerHTML=h;
// Bind events
p.querySelectorAll('[data-del]').forEach(function(b){b.addEventListener('click',function(e){e.stopPropagation();del(b.getAttribute('data-del'))})});
p.querySelectorAll('[data-pin]').forEach(function(b){b.addEventListener('click',function(e){e.stopPropagation();pin(b.getAttribute('data-pin'))})});
p.querySelectorAll('[data-copy]').forEach(function(b){b.addEventListener('click',function(){copyItem(b.getAttribute('data-copy'))})});
}

function itemHTML(item){
return'<div class="ws-item'+(item.pin?' pinned':'')+'" data-copy="'+item.id+'"><div class="ws-item-head"><span class="ws-tool">'+(item.slug?'\u{1F527} ':'')+esc(item.tool)+'</span><span class="ws-time">'+fmtTime(item.ts)+'</span></div><div class="ws-preview">'+esc(item.preview)+(item.content.length>120?'\u2026':'')+'</div><div class="ws-actions"><button data-pin="'+item.id+'" title="'+(item.pin?'Unpin':'Pin')+'">'+(item.pin?'\u{1F4CC}':'\u{1F4CD}')+'</button><button data-del="'+item.id+'" title="Delete">\u{1F5D1}</button></div></div>';
}

// Inject CSS
function css(){
var s=document.createElement('style');
s.textContent=
'.ws-fab{position:fixed;bottom:80px;right:24px;z-index:9970;width:48px;height:48px;border-radius:14px;background:#111118;border:1px solid rgba(99,102,241,.25);color:#a5b4fc;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .3s;box-shadow:0 4px 20px rgba(0,0,0,.4);font-family:Inter,sans-serif}'+
'.ws-fab:hover{background:rgba(99,102,241,.15);border-color:rgba(99,102,241,.5);transform:scale(1.08)}'+
'.ws-badge{position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;border-radius:9px;background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 4px;font-family:Inter,sans-serif}'+
'#ws-panel{position:fixed;top:0;right:-380px;width:360px;height:100vh;z-index:9995;background:#0a0a10;border-left:1px solid rgba(99,102,241,.15);transition:right .35s cubic-bezier(.22,1,.36,1);overflow-y:auto;font-family:Inter,-apple-system,sans-serif;box-shadow:-8px 0 40px rgba(0,0,0,.5)}'+
'#ws-panel.open{right:0}'+
'.ws-head{display:flex;align-items:center;padding:20px;border-bottom:1px solid rgba(99,102,241,.1);position:sticky;top:0;background:#0a0a10;z-index:1}'+
'.ws-head h3{margin:0;font-size:16px;color:#e2e8f0;flex:1}'+
'.ws-count{color:#94a3b8;font-size:12px;margin-right:12px}'+
'.ws-close{background:none;border:none;color:#64748b;font-size:24px;cursor:pointer;padding:0 4px;transition:color .2s}.ws-close:hover{color:#e2e8f0}'+
'.ws-section{padding:8px 20px 4px;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px}'+
'.ws-item{padding:14px 20px;border-bottom:1px solid rgba(255,255,255,.04);cursor:pointer;transition:background .2s}.ws-item:hover{background:rgba(99,102,241,.06)}'+
'.ws-item.pinned{border-left:2px solid #6366f1}'+
'.ws-item-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}'+
'.ws-tool{color:#a5b4fc;font-size:12px;font-weight:500}'+
'.ws-time{color:#475569;font-size:11px}'+
'.ws-preview{color:#94a3b8;font-size:13px;line-height:1.5;word-break:break-all;max-height:60px;overflow:hidden}'+
'.ws-actions{display:flex;gap:4px;margin-top:8px;opacity:0;transition:opacity .2s}.ws-item:hover .ws-actions{opacity:1}'+
'.ws-actions button{background:none;border:none;color:#64748b;font-size:14px;cursor:pointer;padding:2px 6px;border-radius:4px;transition:all .2s}'+
'.ws-actions button:hover{background:rgba(99,102,241,.15);color:#a5b4fc}'+
'.ws-empty{padding:40px 20px;text-align:center;color:#64748b}.ws-empty p{margin:8px 0}.ws-hint{font-size:13px;color:#475569}'+
'.ws-pro{padding:14px 20px;background:rgba(99,102,241,.06);border-top:1px solid rgba(99,102,241,.1);font-size:13px;color:#94a3b8}'+
'.ws-pro a{color:#a5b4fc;text-decoration:none;font-weight:600}'+
'.ws-foot{padding:16px 20px;border-top:1px solid rgba(99,102,241,.1);text-align:center}'+
'.ws-foot a{color:#6366f1;text-decoration:none;font-size:13px;font-weight:500;transition:color .2s}.ws-foot a:hover{color:#a855f7}'+
'.ws-toast{position:fixed;bottom:140px;right:24px;z-index:9996;padding:10px 18px;background:#111118;border:1px solid rgba(99,102,241,.2);color:#e2e8f0;border-radius:10px;font-size:13px;font-family:Inter,sans-serif;opacity:0;transform:translateY(8px);transition:all .3s;pointer-events:none;box-shadow:0 4px 20px rgba(0,0,0,.4)}'+
'.ws-toast.show{opacity:1;transform:translateY(0)}'+
'@media(max-width:480px){#ws-panel{width:100%;right:-100%}.ws-fab{bottom:70px;right:16px;width:42px;height:42px}}';
document.head.appendChild(s);
}

// Build FAB + Panel
function buildUI(){
// FAB button
var fab=document.createElement('button');
fab.className='ws-fab';fab.id='ws-fab';
fab.innerHTML='\u{1F4BE}<span class="ws-badge" id="ws-badge">0</span>';
fab.title='My Workspace';
fab.setAttribute('aria-label','Open workspace panel');
fab.addEventListener('click',function(){
var p=document.getElementById('ws-panel');
if(p.classList.contains('open')){p.classList.remove('open')}
else{renderPanel();p.classList.add('open')}
});
document.body.appendChild(fab);

// Panel
var panel=document.createElement('div');
panel.id='ws-panel';
document.body.appendChild(panel);

updateBadge();
}

// Expose for workspace.html full page
window.NexToolWorkspace={
getAll:gs,
save:save,
del:del,
pin:pin,
clear:function(){ss([]);updateBadge()},
count:function(){return gs().length}
};

function init(){
if(!slug())return; // Only on tool pages
css();
buildUI();
hookClipboard();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
