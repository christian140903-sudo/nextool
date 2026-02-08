/**
 * NexTool Branded Output v1.0
 * Adds subtle attribution to tool outputs (copy & download)
 * Pro users get clean output — no branding
 * Loaded via revenue.js, <3KB
 */
(function(){
'use strict';

// Pro users: completely clean output
if(window.NexToolPro&&window.NexToolPro.active)return;

// Also listen for Pro activation during session
window.addEventListener('nextools-pro-activated', function(){ window._ntBrandingOff=true; });

var ATTR_LINE = '\n// Formatted with NexTool.app \u2014 get Pro to remove';
var ATTR_CSS = '\n/* Generated at NexTool.app \u2014 get Pro to remove */';
var ATTR_TEXT = '\n\u2014 NexTool.app';
var ATTR_MD = '\n<!-- Generated with NexTool.app -->';
var FILE_PREFIX = 'nextool-';

// Detect tool type from URL
function getToolType(){
  var p = location.pathname;
  if(/json|api|yaml/.test(p))return 'json';
  if(/css|gradient|shadow|border|clip-path|animation/.test(p))return 'css';
  if(/markdown|md/.test(p))return 'markdown';
  if(/html|meta-tag|og-image/.test(p))return 'html';
  return 'text';
}

// Get attribution line based on tool type
function getAttr(){
  if(window._ntBrandingOff)return '';
  var t = getToolType();
  if(t==='json')return ATTR_LINE;
  if(t==='css')return ATTR_CSS;
  if(t==='markdown')return ATTR_MD;
  if(t==='html')return ATTR_MD;
  return ATTR_TEXT;
}

// Intercept clipboard copy on tool pages
function hookCopy(){
  if(!/\/free-tools\//.test(location.pathname))return;

  document.addEventListener('copy', function(e){
    if(window._ntBrandingOff)return;
    // Only intercept if copying from output panels (not input areas)
    var sel = window.getSelection();
    if(!sel||!sel.toString())return;
    var node = sel.anchorNode;
    // Check if selection is inside an output area or if it was triggered by a Copy button
    var inOutput = false;
    var el = node;
    while(el&&el!==document.body){
      if(el.id&&/output|result|formatted|tree|preview/i.test(el.id)){inOutput=true;break;}
      if(el.className&&typeof el.className==='string'&&/output|result|formatted|preview/i.test(el.className)){inOutput=true;break;}
      el=el.parentNode;
    }
    if(!inOutput)return;

    var text = sel.toString();
    if(text.length<10)return; // Don't brand tiny selections
    var attr = getAttr();
    if(!attr)return;
    e.preventDefault();
    e.clipboardData.setData('text/plain', text + attr);
  }, true);
}

// Hook into Copy button clicks — intercept navigator.clipboard.writeText
function hookCopyButton(){
  if(!/\/free-tools\//.test(location.pathname))return;
  if(!navigator.clipboard||!navigator.clipboard.writeText)return;

  var origWrite = navigator.clipboard.writeText.bind(navigator.clipboard);
  navigator.clipboard.writeText = function(text){
    if(window._ntBrandingOff)return origWrite(text);
    if(typeof text!=='string'||text.length<10)return origWrite(text);
    var attr = getAttr();
    return origWrite(text + attr);
  };
}

// Hook download to prefix filenames
function hookDownload(){
  if(!/\/free-tools\//.test(location.pathname))return;

  // Intercept createElement('a') downloads
  document.addEventListener('click', function(e){
    if(window._ntBrandingOff)return;
    var btn = e.target.closest('button');
    if(!btn)return;
    var text = (btn.textContent||'').toLowerCase();
    if(!/download|export|save/.test(text))return;
    // After a brief delay, check for dynamically created download links
    // and modify filename
    setTimeout(function(){
      var links = document.querySelectorAll('a[download]');
      links.forEach(function(a){
        var name = a.getAttribute('download')||'';
        if(name&&name.indexOf(FILE_PREFIX)!==0){
          a.setAttribute('download', FILE_PREFIX + name);
        }
      });
    }, 50);
  }, true);
}

// Initialize
function init(){
  hookCopy();
  hookCopyButton();
  hookDownload();
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded', init);
}else{
  init();
}
})();
