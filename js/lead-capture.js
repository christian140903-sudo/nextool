/**
 * NexTool Lead Capture
 * Elegant email capture modal
 * Triggers after 60s OR on 2nd page visit
 * Submits to FormSubmit.co (AJAX POST)
 * No cookies, localStorage only, < 5KB
 */
(function () {
  'use strict';

  // Pro users: skip lead capture entirely
  if(window.NexToolPro&&window.NexToolPro.active)return;

  var STORAGE_PREFIX = 'ntool_lead_';
  var SHOW_DELAY = 60000; // 60 seconds
  var FORM_ENDPOINT = 'https://formsubmit.co/ajax/christianjunbucher@gmail.com';

  // ── Helpers ──
  function store(key, val) {
    try { localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val)); } catch (e) { /* */ }
  }
  function load(key, fallback) {
    try {
      var v = localStorage.getItem(STORAGE_PREFIX + key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch (e) { return fallback; }
  }

  // ── Check if should show ──
  function shouldShow() {
    // Never show again if already submitted or permanently dismissed
    if (load('submitted', false)) return false;
    if (load('dismissed', false)) return false;
    return true;
  }

  function trackPageVisit() {
    var count = load('page_visits', 0);
    count += 1;
    store('page_visits', count);
    return count;
  }

  // ── Inject styles ──
  function injectCSS() {
    var style = document.createElement('style');
    style.textContent = [
      '.ntool-lead-overlay{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.7);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .4s ease;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif}',
      '.ntool-lead-overlay.visible{opacity:1}',
      '.ntool-lead-modal{position:relative;width:90%;max-width:440px;background:#111118;border:1px solid rgba(99,102,241,.2);border-radius:20px;padding:40px 32px 32px;text-align:center;transform:translateY(20px) scale(.96);transition:transform .4s cubic-bezier(.22,1,.36,1);box-shadow:0 24px 80px rgba(0,0,0,.6),0 0 0 1px rgba(99,102,241,.1)}',
      '.ntool-lead-overlay.visible .ntool-lead-modal{transform:translateY(0) scale(1)}',
      '.ntool-lead-glow{position:absolute;top:-1px;left:50%;transform:translateX(-50%);width:200px;height:3px;background:linear-gradient(90deg,transparent,#6366f1,#a855f7,transparent);border-radius:2px}',
      '.ntool-lead-icon{width:56px;height:56px;margin:0 auto 20px;background:linear-gradient(135deg,rgba(99,102,241,.15),rgba(168,85,247,.15));border:1px solid rgba(99,102,241,.2);border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:28px}',
      '.ntool-lead-h2{color:#fff;font-size:22px;font-weight:700;margin-bottom:10px;line-height:1.3}',
      '.ntool-lead-sub{color:#94a3b8;font-size:14px;line-height:1.6;margin-bottom:24px}',
      '.ntool-lead-form{display:flex;flex-direction:column;gap:12px}',
      '.ntool-lead-input{width:100%;padding:14px 16px;background:#0a0a12;border:1px solid rgba(99,102,241,.15);border-radius:10px;color:#e2e8f0;font-size:15px;font-family:inherit;outline:none;transition:border-color .2s}',
      '.ntool-lead-input:focus{border-color:#6366f1}',
      '.ntool-lead-input::placeholder{color:#4a5568}',
      '.ntool-lead-btn{width:100%;padding:14px;background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;transition:opacity .2s,transform .1s;font-family:inherit}',
      '.ntool-lead-btn:hover{opacity:.92}',
      '.ntool-lead-btn:active{transform:scale(.98)}',
      '.ntool-lead-btn:disabled{opacity:.5;cursor:not-allowed}',
      '.ntool-lead-dismiss{display:inline-block;margin-top:16px;color:#64748b;font-size:13px;cursor:pointer;background:none;border:none;font-family:inherit;transition:color .2s}',
      '.ntool-lead-dismiss:hover{color:#94a3b8}',
      '.ntool-lead-trust{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:16px;color:#4a5568;font-size:11px}',
      '.ntool-lead-success{text-align:center;padding:20px 0}',
      '.ntool-lead-success-icon{font-size:48px;margin-bottom:12px}',
      '.ntool-lead-success h3{color:#fff;font-size:20px;margin-bottom:8px}',
      '.ntool-lead-success p{color:#94a3b8;font-size:14px}',
      '.ntool-lead-error{color:#f87171;font-size:13px;margin-top:4px;display:none}'
    ].join('\n');
    document.head.appendChild(style);
  }

  // ── Context-aware messaging ──
  function getContext() {
    var path = location.pathname;
    // Tool page categories
    if (/\/(json|api|regex|base64|hash|url-encoder|jwt|curl|docker|nginx|tsconfig|gitignore|readme|htaccess|chmod|encode-decode|http-status)/.test(path))
      return { icon: '\uD83D\uDCBB', h: 'Free Developer Toolkit', sub: '10 cheat sheets + 5 templates + 1 workflow guide. Used by 2,400+ developers.', btn: 'Get Free Toolkit', cat: 'dev' };
    if (/\/(color|gradient|box-shadow|css|border-radius|font-pair|typography|clip-path|aspect-ratio|pixel-ruler)/.test(path))
      return { icon: '\uD83C\uDFA8', h: 'Free CSS & Design Cheat Sheets', sub: 'Flexbox, Grid, animations, color systems — all in one toolkit. Plus 5 UI templates.', btn: 'Get Free Toolkit', cat: 'design' };
    if (/\/(text|markdown|lorem|word-counter|diff|emoji|slug)/.test(path))
      return { icon: '\u270D\uFE0F', h: 'Free Content Creator Toolkit', sub: 'Templates, cheat sheets, and workflow guides for faster content creation.', btn: 'Get Free Toolkit', cat: 'content' };
    if (/\/(image|qr|favicon|svg|placeholder|barcode|og-image|screenshot)/.test(path))
      return { icon: '\uD83D\uDDBC\uFE0F', h: 'Free Media & Assets Toolkit', sub: 'Image optimization guides, SVG cheat sheet, and ready-to-use templates.', btn: 'Get Free Toolkit', cat: 'media' };
    if (/\/blog\//.test(path))
      return { icon: '\uD83D\uDCDA', h: 'Get the Free Developer Toolkit', sub: 'Liked this article? Get 10 cheat sheets, 5 templates, and a workflow guide.', btn: 'Get Free Toolkit', cat: 'blog' };
    // Default
    return { icon: '\u2728', h: 'Free Developer Toolkit', sub: '10 cheat sheets, 5 templates, 1 workflow guide — instant access, no signup wall.', btn: 'Get Free Toolkit', cat: 'general' };
  }

  // ── Create modal ──
  function createModal() {
    var ctx = getContext();
    var overlay = document.createElement('div');
    overlay.className = 'ntool-lead-overlay';
    overlay.id = 'ntool-lead-overlay';

    overlay.innerHTML = [
      '<div class="ntool-lead-modal">',
      '  <div class="ntool-lead-glow"></div>',
      '  <div class="ntool-lead-icon">' + ctx.icon + '</div>',
      '  <h2 class="ntool-lead-h2">' + ctx.h + '</h2>',
      '  <p class="ntool-lead-sub">' + ctx.sub + '</p>',
      '  <form class="ntool-lead-form" id="ntool-lead-form">',
      '    <input type="email" class="ntool-lead-input" id="ntool-lead-email" placeholder="your@email.com" required autocomplete="email">',
      '    <button type="submit" class="ntool-lead-btn" id="ntool-lead-submit">' + ctx.btn + '</button>',
      '    <div class="ntool-lead-error" id="ntool-lead-error">Something went wrong. Please try again.</div>',
      '  </form>',
      '  <button class="ntool-lead-dismiss" id="ntool-lead-dismiss">No thanks, maybe later</button>',
      '  <div class="ntool-lead-trust">',
      '    <span>\uD83D\uDD12</span>',
      '    <span>No spam \u00B7 Instant access \u00B7 Unsubscribe anytime</span>',
      '  </div>',
      '</div>'
    ].join('\n');

    document.body.appendChild(overlay);

    // Animate in
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.classList.add('visible');
      });
    });

    // Close on overlay click (but not modal)
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });

    // Dismiss button
    document.getElementById('ntool-lead-dismiss').addEventListener('click', closeModal);

    // Escape key
    document.addEventListener('keydown', function handler(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handler);
      }
    });

    // Form submission
    document.getElementById('ntool-lead-form').addEventListener('submit', function (e) {
      e.preventDefault();
      submitForm();
    });
  }

  function closeModal() {
    var overlay = document.getElementById('ntool-lead-overlay');
    if (!overlay) return;
    overlay.classList.remove('visible');
    store('dismissed', true);
    setTimeout(function () { overlay.remove(); }, 400);
  }

  function submitForm() {
    var emailInput = document.getElementById('ntool-lead-email');
    var submitBtn = document.getElementById('ntool-lead-submit');
    var errorEl = document.getElementById('ntool-lead-error');
    var email = emailInput.value.trim();

    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errorEl.textContent = 'Please enter a valid email address.';
      errorEl.style.display = 'block';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Subscribing...';
    errorEl.style.display = 'none';

    // AJAX POST to FormSubmit.co
    var xhr = new XMLHttpRequest();
    xhr.open('POST', FORM_ENDPOINT, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'application/json');

    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        store('submitted', true);
        store('email', email);
        showSuccess();
      } else {
        errorEl.textContent = 'Something went wrong. Please try again.';
        errorEl.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Subscribe Free';
      }
    };

    xhr.onerror = function () {
      errorEl.textContent = 'Network error. Please check your connection.';
      errorEl.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Subscribe Free';
    };

    xhr.send(JSON.stringify({
      email: email,
      source: 'nextool-toolkit-capture',
      page: location.pathname,
      toolkit: 'requested',
      _subject: 'New Toolkit Download! - ' + email,
      _template: 'table'
    }));
  }

  function showSuccess() {
    var modal = document.querySelector('.ntool-lead-modal');
    if (!modal) return;

    modal.innerHTML = [
      '<div class="ntool-lead-glow"></div>',
      '<div class="ntool-lead-success">',
      '  <div class="ntool-lead-success-icon">\uD83C\uDF89</div>',
      '  <h3>Your toolkit is ready!</h3>',
      '  <p>16 resources — cheat sheets, templates, and a workflow guide.</p>',
      '  <a href="/toolkit.html" style="display:inline-block;margin-top:12px;padding:12px 24px;background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;border-radius:10px;font-weight:600;font-size:14px;text-decoration:none;transition:opacity .2s">Open Toolkit \u2192</a>',
      '</div>',
      '<button class="ntool-lead-dismiss" onclick="document.getElementById(\'ntool-lead-overlay\').classList.remove(\'visible\');setTimeout(function(){document.getElementById(\'ntool-lead-overlay\').remove()},400)" style="margin-top:12px">Close</button>'
    ].join('\n');
  }

  // ── Initialize ──
  function init() {
    if (!shouldShow()) return;

    injectCSS();

    var visits = trackPageVisit();

    // Trigger on 2nd page visit (immediately) or after 60 seconds on first
    if (visits >= 2) {
      // Show after a short delay for politeness (2s on 2nd+ visit)
      setTimeout(createModal, 2000);
    } else {
      setTimeout(function () {
        if (shouldShow()) createModal();
      }, SHOW_DELAY);
    }
  }

  // Run
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  /* Load conversion engine on blog pages (tool pages load via revenue.js) */
  if (/\/blog\//.test(location.pathname) && !document.querySelector('script[src*="conversion-engine"]')) {
    var ce = document.createElement('script'); ce.src = '/js/conversion-engine.js'; ce.defer = true; document.head.appendChild(ce);
  }
})();
