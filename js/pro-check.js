/**
 * NexTool Pro Check v2.0
 * Global Pro status detection — loaded on every page
 * Checks localStorage for Pro activation
 * Exposes window.NexToolPro for other scripts
 * <2KB, no dependencies
 */
(function(){
'use strict';

var KEY = 'ntool_pro';
var status = null;

try {
  var raw = localStorage.getItem(KEY);
  if (raw) {
    status = JSON.parse(raw);
  }
} catch(e) {}

var isPro = !!(status && status.status === 'active');

// Global API for other scripts
window.NexToolPro = {
  active: isPro,
  status: status,
  activate: function(source) {
    var data = {
      status: 'active',
      activated: Date.now(),
      source: source || 'manual',
      version: '2.0'
    };
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch(e) {}
    window.NexToolPro.active = true;
    window.NexToolPro.status = data;
    // Dispatch event for listening scripts
    window.dispatchEvent(new CustomEvent('nextools-pro-activated', { detail: data }));
    return true;
  },
  deactivate: function() {
    try { localStorage.removeItem(KEY); } catch(e) {}
    window.NexToolPro.active = false;
    window.NexToolPro.status = null;
  }
};

// If Pro is active, add class to body for CSS-based feature toggling
if (isPro) {
  var addProClass = function() {
    document.body.classList.add('ntool-pro-active');
  };
  if (document.body) addProClass();
  else document.addEventListener('DOMContentLoaded', addProClass);
}

})();
