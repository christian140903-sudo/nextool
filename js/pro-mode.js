/**
 * NexTool Pro Mode v1.0
 * Soft paywall & usage tracking for free tools
 * - Tracks daily uses per tool + total uses
 * - Gentle upgrade prompt after 5 uses/tool/day
 * - Stronger prompt after 15 total uses
 * - Non-blocking: tools always work, just shows prompts
 * <4KB, no dependencies, loaded via revenue.js
 */
(function(){
'use strict';

var P = 'ntpm_';
var PRO_URL = '/pro.html';
var DAY_MS = 864e5;
var GENTLE_THRESHOLD = 5;  // per tool per day
var STRONG_THRESHOLD = 15; // total across all tools

function st(k,v){try{localStorage.setItem(P+k,JSON.stringify(v))}catch(e){}}
function ld(k,f){try{var v=localStorage.getItem(P+k);return v!==null?JSON.parse(v):f}catch(e){return f}}
function slug(){var m=location.pathname.match(/\/free-tools\/([^\/]+)\.html/);return m?m[1]:null}
function today(){return new Date().toISOString().slice(0,10)}

// Track a tool use
function trackUse() {
  var s = slug();
  if (!s) return;
  var d = today();
  var daily = ld('daily', {});
  var key = d + '_' + s;
  daily[key] = (daily[key] || 0) + 1;

  // Clean old entries (keep only today + yesterday)
  var yesterday = new Date(Date.now() - DAY_MS).toISOString().slice(0,10);
  var clean = {};
  for (var k in daily) {
    if (k.indexOf(d) === 0 || k.indexOf(yesterday) === 0) {
      clean[k] = daily[k];
    }
  }
  st('daily', clean);

  // Total uses
  var total = ld('total', 0) + 1;
  st('total', total);

  return { toolUses: clean[key], totalUses: total };
}

// Check if should show prompt
function shouldShowGentle(toolUses) {
  return toolUses >= GENTLE_THRESHOLD && !ld('gentle_dismissed_' + today(), false);
}

function shouldShowStrong(totalUses) {
  return totalUses >= STRONG_THRESHOLD && !ld('strong_dismissed', false);
}

// Gentle upgrade prompt (top bar, dismissable)
function showGentlePrompt() {
  if (document.getElementById('ntpm-gentle')) return;

  var bar = document.createElement('div');
  bar.id = 'ntpm-gentle';
  bar.innerHTML =
    '<div class="ntpm-gi">' +
    '<span class="ntpm-ic">\u2728</span>' +
    '<span class="ntpm-gt">Enjoying this tool? <strong>NexTool Pro</strong> gives you website templates, automation workflows &amp; 100+ AI prompts &mdash; <strong>$29 one-time</strong></span>' +
    '<a href="' + PRO_URL + '" class="ntpm-gb">Learn More</a>' +
    '<button class="ntpm-gx" aria-label="Dismiss">\u00D7</button>' +
    '</div>';
  document.body.appendChild(bar);

  requestAnimationFrame(function() {
    requestAnimationFrame(function() { bar.classList.add('ntpm-gs'); });
  });

  bar.querySelector('.ntpm-gx').addEventListener('click', function() {
    bar.classList.remove('ntpm-gs');
    st('gentle_dismissed_' + today(), true);
    setTimeout(function() { bar.remove(); }, 500);
  });
}

// Stronger upgrade prompt (modal-like slide-in)
function showStrongPrompt() {
  if (document.getElementById('ntpm-strong')) return;

  var total = ld('total', 0);
  var card = document.createElement('div');
  card.id = 'ntpm-strong';
  card.innerHTML =
    '<div class="ntpm-si">' +
    '<button class="ntpm-sx" aria-label="Close">\u00D7</button>' +
    '<div class="ntpm-sic">\uD83D\uDE80</div>' +
    '<div class="ntpm-st">You\'ve used NexTool <strong>' + total + ' times</strong></div>' +
    '<div class="ntpm-sd">You clearly love our tools. NexTool Pro unlocks templates, workflows &amp; prompts to 10x your productivity.</div>' +
    '<div class="ntpm-sp"><s style="color:#666">$62</s> <strong style="color:#fff;font-size:24px">$29</strong> <span style="color:#22c55e;font-size:13px">save 53%</span></div>' +
    '<a href="' + PRO_URL + '" class="ntpm-sb">See What\'s Included \u2192</a>' +
    '<button class="ntpm-sn">Maybe later</button>' +
    '</div>';
  document.body.appendChild(card);

  requestAnimationFrame(function() {
    requestAnimationFrame(function() { card.classList.add('ntpm-ss'); });
  });

  function dismiss() {
    card.classList.remove('ntpm-ss');
    st('strong_dismissed', true);
    setTimeout(function() { card.remove(); }, 500);
  }

  card.querySelector('.ntpm-sx').addEventListener('click', dismiss);
  card.querySelector('.ntpm-sn').addEventListener('click', dismiss);
}

// Inject styles
function injectCSS() {
  if (document.getElementById('ntpm-styles')) return;
  var s = document.createElement('style');
  s.id = 'ntpm-styles';
  s.textContent = [
    /* Gentle top bar */
    '#ntpm-gentle{position:fixed;top:-60px;left:0;right:0;z-index:9992;transition:top .5s cubic-bezier(.22,1,.36,1);font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif}',
    '#ntpm-gentle.ntpm-gs{top:0}',
    '.ntpm-gi{padding:10px 20px;background:linear-gradient(135deg,#0c0c1a,#111120);border-bottom:1px solid rgba(99,102,241,.15);display:flex;align-items:center;gap:10px;justify-content:center;flex-wrap:wrap}',
    '.ntpm-ic{font-size:16px}',
    '.ntpm-gt{color:#a0a0b8;font-size:13px}',
    '.ntpm-gt strong{color:#e0e0f0}',
    '.ntpm-gb{padding:6px 14px;background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;text-decoration:none;white-space:nowrap;transition:opacity .2s}',
    '.ntpm-gb:hover{opacity:.9}',
    '.ntpm-gx{background:none;border:none;color:#555;font-size:18px;cursor:pointer;padding:2px 6px;line-height:1;transition:color .2s}',
    '.ntpm-gx:hover{color:#fff}',

    /* Strong slide-in card */
    '#ntpm-strong{position:fixed;bottom:24px;right:-380px;z-index:9993;transition:right .5s cubic-bezier(.22,1,.36,1);font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif}',
    '#ntpm-strong.ntpm-ss{right:24px}',
    '.ntpm-si{width:320px;padding:24px;background:#111118;border:1px solid rgba(99,102,241,.2);border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.6);position:relative}',
    '.ntpm-sx{position:absolute;top:10px;right:12px;background:none;border:none;color:#555;font-size:18px;cursor:pointer;line-height:1;transition:color .2s}',
    '.ntpm-sx:hover{color:#fff}',
    '.ntpm-sic{font-size:32px;margin-bottom:10px}',
    '.ntpm-st{color:#e0e0f0;font-size:15px;font-weight:600;margin-bottom:6px}',
    '.ntpm-sd{color:#8888a0;font-size:13px;line-height:1.5;margin-bottom:14px}',
    '.ntpm-sp{margin-bottom:14px}',
    '.ntpm-sb{display:block;width:100%;padding:12px;background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;text-decoration:none;text-align:center;transition:opacity .2s}',
    '.ntpm-sb:hover{opacity:.9}',
    '.ntpm-sn{display:block;width:100%;margin-top:8px;background:none;border:none;color:#555;font-size:12px;cursor:pointer;font-family:inherit;transition:color .2s}',
    '.ntpm-sn:hover{color:#999}',

    /* Responsive */
    '@media(max-width:640px){',
    '#ntpm-strong.ntpm-ss{right:12px;left:12px}',
    '.ntpm-si{width:auto}',
    '.ntpm-gi{padding:8px 12px;gap:6px}',
    '.ntpm-gt{font-size:11px}',
    '}'
  ].join('\n');
  document.head.appendChild(s);
}

// Listen for action buttons
function init() {
  var s = slug();
  if (!s) return;

  injectCSS();

  // Track uses on key action button clicks
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('button');
    if (!btn) return;
    var text = (btn.textContent || '').toLowerCase();
    if (/copy|download|generate|convert|format|minify|encode|decode|calculate|compress|optimize|validate|beautify|preview|export/.test(text)) {
      var result = trackUse();
      if (!result) return;

      // Check gentle threshold
      if (shouldShowGentle(result.toolUses)) {
        setTimeout(function() { showGentlePrompt(); }, 1500);
      }

      // Check strong threshold
      if (shouldShowStrong(result.totalUses)) {
        setTimeout(function() { showStrongPrompt(); }, 3000);
      }
    }
  });

  // Also track copy events
  document.addEventListener('copy', function() {
    var result = trackUse();
    if (!result) return;
    if (shouldShowStrong(result.totalUses)) {
      setTimeout(function() { showStrongPrompt(); }, 3000);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
})();
