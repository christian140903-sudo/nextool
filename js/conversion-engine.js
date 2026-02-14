/**
 * NexTool Conversion Engine v1.0
 * Advanced conversion optimization for tool pages + homepage
 * - Exit-intent email capture (complements lead-capture.js)
 * - Sticky upgrade bar
 * - Social proof toasts
 * - Contextual post-action CTAs
 * < 8KB, no dependencies
 */
(function() {
'use strict';

// Pro users: skip all conversion UI
if(window.NexToolPro&&window.NexToolPro.active)return;

var P = 'ntce_';
var CITIES = ['Berlin','Munich','London','New York','San Francisco','Tokyo','Paris','Sydney','Toronto','Amsterdam','Stockholm','Dubai','Singapore','Barcelona','Vienna','Zurich','Copenhagen','Milan','Dublin','Austin','Seoul','Los Angeles','Chicago','Denver','Portland'];
var TOOL_NAMES = ['JSON Formatter','Color Palette Generator','QR Code Generator','Password Generator','Regex Tester','Image Compressor','CSS Gradient Generator','Markdown Preview','Unit Converter','Hash Generator','Base64 Encoder','Text Analyzer','Box Shadow Generator','SVG Optimizer','Diff Checker','Lorem Ipsum Generator','Crontab Generator','Favicon Generator','Aspect Ratio Calculator','Color Converter'];
var BUNDLE_URL = '/pro.html';
var CONTACT_URL = '/#contact';

function st(k,v){try{localStorage.setItem(P+k,JSON.stringify(v))}catch(e){}}
function ld(k,f){try{var v=localStorage.getItem(P+k);return v!==null?JSON.parse(v):f}catch(e){return f}}
function leadCaptured(){try{return localStorage.getItem('ntool_lead_submitted')==='true'||localStorage.getItem('ntool_lead_dismissed')==='true'}catch(e){return false}}
function isToolPage(){return /\/free-tools\/[^\/]+\.html/.test(location.pathname)}
function isHomePage(){return location.pathname==='/'||location.pathname==='/index.html'}
function rand(min,max){return Math.floor(Math.random()*(max-min+1))+min}

// ─── 1. STICKY UPGRADE BAR ───
// Shows thin persistent bar at bottom after 20s on tool pages
function stickyBar() {
  if (!isToolPage()) return;
  if (ld('bar_closed', false)) return;

  var bar = document.createElement('div');
  bar.id = 'ntce-bar';
  bar.innerHTML = '<div class="ntce-bi">' +
    '<span class="ntce-bic">\u26A1</span>' +
    '<span class="ntce-bit"><strong>NexTool Pro</strong> \u2014 No banners, enhanced features, clean output</span>' +
    '<span class="ntce-bis"><s style="color:#666">$49</s></span>' +
    '<a href="' + BUNDLE_URL + '" class="ntce-bib">$29 \u2014 Founding Member</a>' +
    '<button class="ntce-bix" aria-label="Close">\u00D7</button>' +
    '</div>';
  document.body.appendChild(bar);

  // Show after 20 seconds (after revenue.js banner at 30s would have been dismissed or shown)
  setTimeout(function() {
    // Don't show if revenue banner is visible
    var revBanner = document.getElementById('nrb');
    if (revBanner && revBanner.classList.contains('v')) {
      // Wait for revenue banner to be dismissed
      var check = setInterval(function() {
        if (!document.getElementById('nrb') || !document.getElementById('nrb').classList.contains('v')) {
          clearInterval(check);
          bar.classList.add('ntce-bs');
        }
      }, 2000);
    } else {
      bar.classList.add('ntce-bs');
    }
  }, 20000);

  bar.querySelector('.ntce-bix').addEventListener('click', function() {
    bar.classList.remove('ntce-bs');
    st('bar_closed', true);
    setTimeout(function() { bar.remove(); }, 500);
  });
}

// ─── 2. SOCIAL PROOF TOASTS ───
// Subtle toasts showing fake but plausible activity
function socialProof() {
  if (!isToolPage() && !isHomePage()) return;

  var shown = 0;
  var maxToasts = 3;

  function showToast() {
    if (shown >= maxToasts) return;
    if (document.hidden) { setTimeout(showToast, 5000); return; }
    shown++;

    var city = CITIES[rand(0, CITIES.length - 1)];
    var tool = TOOL_NAMES[rand(0, TOOL_NAMES.length - 1)];
    var mins = rand(1, 12);

    var t = document.createElement('div');
    t.className = 'ntce-sp';
    t.innerHTML = '<span class="ntce-spd"></span>' +
      '<span>Someone from <strong>' + city + '</strong> used <strong>' + tool + '</strong></span>' +
      '<span class="ntce-spt">' + mins + 'm ago</span>';
    document.body.appendChild(t);

    requestAnimationFrame(function() {
      requestAnimationFrame(function() { t.classList.add('ntce-sps'); });
    });

    setTimeout(function() {
      t.classList.remove('ntce-sps');
      setTimeout(function() { t.remove(); }, 500);
    }, 5000);

    if (shown < maxToasts) {
      setTimeout(showToast, rand(25000, 50000));
    }
  }

  // Start after 12-20 seconds
  setTimeout(showToast, rand(12000, 20000));
}

// ─── 3. EXIT INTENT EMAIL CAPTURE ───
// Only fires if lead-capture.js hasn't already captured/dismissed
function exitIntent() {
  if (leadCaptured()) return;
  if (ld('exit_fired', false)) return;

  var fired = false;

  document.addEventListener('mouseleave', function(e) {
    if (fired) return;
    if (e.clientY > 10) return; // Only top of viewport = closing tab

    // Don't fire if lead-capture modal is open
    if (document.getElementById('ntool-lead-overlay')) return;

    fired = true;
    st('exit_fired', true);
    showExitModal();
  });
}

function showExitModal() {
  var ov = document.createElement('div');
  ov.className = 'ntce-eo';
  ov.id = 'ntce-exit';
  ov.innerHTML = '<div class="ntce-em">' +
    '<div class="ntce-eg"></div>' +
    '<button class="ntce-ec" aria-label="Close">\u00D7</button>' +
    '<div class="ntce-ei">\uD83C\uDF81</div>' +
    '<h2 class="ntce-eh">Before you go...</h2>' +
    '<p class="ntce-ep">Get our <strong>free Developer Toolkit</strong> \u2014 cheat sheets for JSON, regex, git + links to all 231+ tools. One email, no spam.</p>' +
    '<form class="ntce-ef" id="ntce-ef">' +
    '<input type="email" placeholder="your@email.com" required autocomplete="email" class="ntce-ein">' +
    '<button type="submit" class="ntce-eb">Send Me the Toolkit \u2192</button>' +
    '</form>' +
    '<button class="ntce-es">No thanks, I\'ll find it myself</button>' +
    '</div>';
  document.body.appendChild(ov);

  requestAnimationFrame(function() {
    requestAnimationFrame(function() { ov.classList.add('ntce-eos'); });
  });

  function close() {
    ov.classList.remove('ntce-eos');
    setTimeout(function() { ov.remove(); }, 400);
  }

  ov.querySelector('.ntce-ec').addEventListener('click', close);
  ov.querySelector('.ntce-es').addEventListener('click', close);
  ov.addEventListener('click', function(e) { if (e.target === ov) close(); });

  document.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', handler); }
  });

  document.getElementById('ntce-ef').addEventListener('submit', function(e) {
    e.preventDefault();
    var input = this.querySelector('input');
    var btn = this.querySelector('button[type="submit"]');
    var email = input.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

    btn.disabled = true;
    btn.textContent = 'Sending...';

    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://formsubmit.co/ajax/christianjunbucher@gmail.com', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { localStorage.setItem('ntool_lead_submitted', 'true'); } catch(x) {}
        ov.querySelector('.ntce-em').innerHTML =
          '<div class="ntce-eg"></div>' +
          '<div class="ntce-ei">\uD83C\uDF89</div>' +
          '<h2 class="ntce-eh">Check your inbox!</h2>' +
          '<p class="ntce-ep">Your Developer Toolkit is on its way. Welcome to the NexTool community.</p>' +
          '<button class="ntce-es" id="ntce-done">Close</button>';
        document.getElementById('ntce-done').addEventListener('click', close);
      } else {
        btn.textContent = 'Try Again';
        btn.disabled = false;
      }
    };
    xhr.onerror = function() { btn.textContent = 'Try Again'; btn.disabled = false; };
    xhr.send(JSON.stringify({
      email: email,
      source: 'exit-intent-toolkit',
      page: location.pathname,
      _subject: 'New NexTool Lead (Exit Intent)!',
      _template: 'table'
    }));
  });
}

// ─── 4. CONTEXTUAL POST-ACTION CTA ───
// Fires after user has actively used the tool (copy, download, generate)
function contextCTA() {
  if (!isToolPage()) return;
  if (ld('ctx_fired', false)) return;

  var actionCount = 0;
  var threshold = 3;

  function maybeShow() {
    actionCount++;
    if (actionCount >= threshold && !ld('ctx_fired', false)) {
      st('ctx_fired', true);
      showContextBanner();
    }
  }

  // Listen for clicks on action buttons (Copy, Download, Generate, Convert, Format, etc.)
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('button, .toolbar button');
    if (!btn) return;
    var text = (btn.textContent || '').toLowerCase();
    if (/copy|download|generate|convert|format|minify|encode|decode|calculate|compress|optimize/.test(text)) {
      maybeShow();
    }
  });

  // Listen for clipboard copy events
  document.addEventListener('copy', function() { maybeShow(); });
}

function showContextBanner() {
  var c = document.createElement('div');
  c.className = 'ntce-cb';
  c.innerHTML = '<div class="ntce-cbi">' +
    '<span class="ntce-cbic">\uD83D\uDCA1</span>' +
    '<div class="ntce-cbt">' +
    '<strong>Love this tool?</strong> Get clean output and enhanced features with NexTool Pro.' +
    '</div>' +
    '<a href="/pro.html" class="ntce-cbb">NexTool Pro \u2014 $29</a>' +
    '<button class="ntce-cbx" aria-label="Close">\u00D7</button>' +
    '</div>';
  document.body.appendChild(c);

  requestAnimationFrame(function() {
    requestAnimationFrame(function() { c.classList.add('ntce-cbs'); });
  });

  // Auto-dismiss after 10s
  var timer = setTimeout(function() { dismiss(); }, 10000);

  function dismiss() {
    clearTimeout(timer);
    c.classList.remove('ntce-cbs');
    setTimeout(function() { c.remove(); }, 500);
  }

  c.querySelector('.ntce-cbx').addEventListener('click', dismiss);
}

// ─── INJECT CSS ───
function injectCSS() {
  var s = document.createElement('style');
  s.id = 'ntce-styles';
  s.textContent = [
    /* Sticky Upgrade Bar */
    '#ntce-bar{position:fixed;bottom:-56px;left:0;right:0;z-index:9985;transition:bottom .5s cubic-bezier(.22,1,.36,1);font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif}',
    '#ntce-bar.ntce-bs{bottom:0}',
    '.ntce-bi{margin:0;padding:10px 20px;background:linear-gradient(135deg,#0c0c18,#12121f);border-top:1px solid rgba(99,102,241,.2);display:flex;align-items:center;gap:12px;justify-content:center;flex-wrap:wrap}',
    '.ntce-bic{font-size:16px}',
    '.ntce-bit{color:#b0b0c0;font-size:13px}',
    '.ntce-bit strong{color:#e0e0f0}',
    '.ntce-bis{color:#888;font-size:13px}',
    '.ntce-bib{padding:7px 18px;background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;text-decoration:none;white-space:nowrap;transition:opacity .2s}',
    '.ntce-bib:hover{opacity:.9}',
    '.ntce-bix{background:none;border:none;color:#555;font-size:18px;cursor:pointer;padding:2px 6px;transition:color .2s;line-height:1}',
    '.ntce-bix:hover{color:#fff}',

    /* Social Proof Toasts */
    '.ntce-sp{position:fixed;bottom:80px;left:20px;z-index:9960;background:#111118;border:1px solid rgba(99,102,241,.12);border-radius:10px;padding:10px 16px;display:flex;align-items:center;gap:8px;font-size:12px;color:#909098;opacity:0;transform:translateX(-20px);transition:all .4s ease;font-family:Inter,-apple-system,sans-serif;max-width:380px;box-shadow:0 8px 24px rgba(0,0,0,.5)}',
    '.ntce-sp.ntce-sps{opacity:1;transform:translateX(0)}',
    '.ntce-spd{width:6px;height:6px;border-radius:50%;background:#22c55e;flex-shrink:0;animation:ntce-p 2s infinite}',
    '.ntce-sp strong{color:#d0d0e0}',
    '.ntce-spt{color:#555;font-size:11px;margin-left:auto;white-space:nowrap}',
    '@keyframes ntce-p{0%,100%{opacity:1}50%{opacity:.3}}',

    /* Exit Intent Overlay */
    '.ntce-eo{position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,.75);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .4s;font-family:Inter,-apple-system,sans-serif}',
    '.ntce-eo.ntce-eos{opacity:1}',
    '.ntce-em{position:relative;width:90%;max-width:420px;background:#111118;border:1px solid rgba(99,102,241,.2);border-radius:20px;padding:36px 28px 28px;text-align:center;transform:translateY(20px) scale(.95);transition:transform .4s cubic-bezier(.22,1,.36,1);box-shadow:0 24px 80px rgba(0,0,0,.6)}',
    '.ntce-eo.ntce-eos .ntce-em{transform:translateY(0) scale(1)}',
    '.ntce-eg{position:absolute;top:-1px;left:50%;transform:translateX(-50%);width:180px;height:3px;background:linear-gradient(90deg,transparent,#6366f1,#a855f7,transparent);border-radius:2px}',
    '.ntce-ec{position:absolute;top:12px;right:14px;background:none;border:none;color:#555;font-size:22px;cursor:pointer;transition:color .2s;line-height:1}',
    '.ntce-ec:hover{color:#fff}',
    '.ntce-ei{font-size:40px;margin-bottom:16px}',
    '.ntce-eh{color:#fff;font-size:22px;font-weight:700;margin:0 0 10px}',
    '.ntce-ep{color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 20px}',
    '.ntce-ep strong{color:#c8c8e0}',
    '.ntce-ef{display:flex;flex-direction:column;gap:10px}',
    '.ntce-ein{width:100%;padding:13px 16px;background:#0a0a12;border:1px solid rgba(99,102,241,.15);border-radius:10px;color:#e2e8f0;font-size:15px;font-family:inherit;outline:none;transition:border-color .2s;box-sizing:border-box}',
    '.ntce-ein:focus{border-color:#6366f1}',
    '.ntce-ein::placeholder{color:#4a5568}',
    '.ntce-eb{width:100%;padding:13px;background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;transition:opacity .2s;font-family:inherit}',
    '.ntce-eb:hover{opacity:.92}',
    '.ntce-eb:disabled{opacity:.5;cursor:not-allowed}',
    '.ntce-es{display:inline-block;margin-top:14px;color:#64748b;font-size:13px;cursor:pointer;background:none;border:none;font-family:inherit;transition:color .2s}',
    '.ntce-es:hover{color:#94a3b8}',

    /* Contextual CTA Banner */
    '.ntce-cb{position:fixed;top:80px;right:-420px;z-index:9975;transition:right .5s cubic-bezier(.22,1,.36,1);font-family:Inter,-apple-system,sans-serif}',
    '.ntce-cb.ntce-cbs{right:20px}',
    '.ntce-cbi{position:relative;max-width:340px;padding:18px 20px;background:#111118;border:1px solid rgba(99,102,241,.2);border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,.5);display:flex;flex-direction:column;gap:10px}',
    '.ntce-cbic{font-size:24px}',
    '.ntce-cbt{color:#a0a0b8;font-size:13px;line-height:1.5}',
    '.ntce-cbt strong{color:#e0e0f0}',
    '.ntce-cbb{display:inline-block;padding:10px 18px;background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;text-decoration:none;text-align:center;transition:opacity .2s}',
    '.ntce-cbb:hover{opacity:.9}',
    '.ntce-cbx{position:absolute;top:8px;right:10px;background:none;border:none;color:#555;font-size:16px;cursor:pointer;line-height:1;transition:color .2s}',
    '.ntce-cbx:hover{color:#fff}',

    /* Responsive */
    '@media(max-width:640px){',
    '.ntce-sp{left:10px;right:10px;bottom:70px;max-width:none}',
    '.ntce-bi{padding:8px 12px;gap:6px;font-size:11px}',
    '.ntce-bit{font-size:11px}',
    '.ntce-bis{display:none}',
    '.ntce-cb.ntce-cbs{right:10px;left:10px}',
    '.ntce-cbi{max-width:none}',
    '}'
  ].join('\n');
  document.head.appendChild(s);
}

// ─── INIT ───
function init() {
  injectCSS();
  stickyBar();
  socialProof();
  exitIntent();
  if (isToolPage()) contextCTA();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
})();
