/**
 * NexTool Inline Newsletter Widget v1.0
 * ======================================
 * Drop-in newsletter signup bar for blog posts and tool pages.
 *
 * Usage:
 *   <div class="nxt-newsletter-widget"></div>
 *   Or: <div class="nxt-newsletter-widget" data-variant="compact"></div>
 *   Or: <div class="nxt-newsletter-widget" data-variant="card"></div>
 *
 * Variants:
 *   - default:  Full horizontal bar with text + email + button
 *   - compact:  Smaller version for sidebars
 *   - card:     Vertical card layout for end-of-article placement
 *
 * Form Backend: Formspree.io, fallback FormSubmit.co
 * < 5KB. Zero dependencies.
 */
(function() {
  'use strict';

  var FORMSPREE_ENDPOINT = 'https://formspree.io/f/xzaborjq';
  var FALLBACK_ENDPOINT = 'https://formsubmit.co/ajax/christianjunbucher@gmail.com';
  var STORAGE_KEY = 'nxt_nw_submitted';
  var stylesInjected = false;

  function isSubmitted() {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true' ||
             localStorage.getItem('nxt_ec_submitted') === 'true' ||
             localStorage.getItem('ntool_lead_submitted') === 'true';
    } catch(e) { return false; }
  }

  function markSubmitted() {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
      localStorage.setItem('nxt_ec_submitted', 'true');
      localStorage.setItem('ntool_lead_submitted', 'true');
    } catch(e) { /* */ }
  }

  // ── Inject styles once ──
  function injectStyles() {
    if (stylesInjected) return;
    stylesInjected = true;

    var style = document.createElement('style');
    style.id = 'nxt-nw-styles';
    style.textContent = '\
/* ═══════════════════════════════════════════════\
   Newsletter Widget — Inline Variants\
   ═══════════════════════════════════════════════ */\
\
/* Base */\
.nxt-nw {\
  font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;\
  -webkit-font-smoothing: antialiased;\
}\
\
/* ── DEFAULT: Horizontal Bar ── */\
.nxt-nw--bar {\
  display: flex; align-items: center; gap: 24px;\
  padding: 24px 28px;\
  background: rgba(255,255,255,0.02);\
  border: 1px solid rgba(99,91,255,0.12);\
  border-radius: 14px;\
  margin: 40px 0;\
  position: relative; overflow: hidden;\
}\
.nxt-nw--bar::before {\
  content: ""; position: absolute; top: 0; left: 0; right: 0;\
  height: 2px;\
  background: linear-gradient(90deg, transparent, #635BFF 40%, #00D4FF 60%, transparent);\
  opacity: 0.5;\
}\
.nxt-nw__icon {\
  width: 44px; height: 44px; flex-shrink: 0;\
  background: linear-gradient(135deg, rgba(99,91,255,0.1), rgba(0,212,255,0.06));\
  border: 1px solid rgba(99,91,255,0.12); border-radius: 12px;\
  display: flex; align-items: center; justify-content: center;\
}\
.nxt-nw__icon svg { width: 22px; height: 22px; }\
.nxt-nw__text { flex: 1; min-width: 0; }\
.nxt-nw__title {\
  font-family: "Space Grotesk", sans-serif;\
  font-size: 15px; font-weight: 600; color: #f0f0f0;\
  margin-bottom: 3px; letter-spacing: -0.01em;\
}\
.nxt-nw__desc {\
  font-size: 13px; color: rgba(255,255,255,0.4); line-height: 1.5;\
}\
.nxt-nw__form {\
  display: flex; gap: 8px; flex-shrink: 0;\
}\
.nxt-nw__input {\
  width: 220px; padding: 11px 14px;\
  background: rgba(255,255,255,0.03);\
  border: 1px solid rgba(255,255,255,0.08);\
  border-radius: 8px; color: #e2e8f0;\
  font-size: 13.5px; font-family: inherit;\
  transition: border-color 0.25s, box-shadow 0.25s;\
}\
.nxt-nw__input:focus {\
  border-color: rgba(99,91,255,0.5);\
  box-shadow: 0 0 0 3px rgba(99,91,255,0.06);\
  outline: none;\
}\
.nxt-nw__input::placeholder { color: rgba(255,255,255,0.18); }\
.nxt-nw__btn {\
  padding: 11px 20px;\
  background: linear-gradient(135deg, #635BFF, #7B74FF);\
  color: white; border: none; border-radius: 8px;\
  font-size: 13.5px; font-weight: 600; cursor: pointer;\
  font-family: inherit; white-space: nowrap;\
  transition: opacity 0.2s, transform 0.15s;\
}\
.nxt-nw__btn:hover { opacity: 0.9; }\
.nxt-nw__btn:active { transform: scale(0.97); }\
.nxt-nw__btn:disabled { opacity: 0.5; cursor: not-allowed; }\
.nxt-nw__error {\
  color: #f87171; font-size: 12px; margin-top: 6px;\
  display: none; grid-column: 1 / -1;\
}\
.nxt-nw__trust {\
  font-size: 11px; color: rgba(255,255,255,0.18); margin-top: 4px;\
}\
\
/* Success state */\
.nxt-nw__success {\
  display: flex; align-items: center; gap: 12px;\
  color: #10b981; font-size: 14px; font-weight: 500;\
}\
.nxt-nw__success svg { width: 20px; height: 20px; flex-shrink: 0; }\
\
/* ── COMPACT variant ── */\
.nxt-nw--compact {\
  padding: 20px;\
  background: rgba(255,255,255,0.02);\
  border: 1px solid rgba(255,255,255,0.06);\
  border-radius: 12px;\
  margin: 32px 0;\
}\
.nxt-nw--compact .nxt-nw__title {\
  font-size: 14px; margin-bottom: 12px;\
}\
.nxt-nw--compact .nxt-nw__form {\
  flex-direction: column; gap: 8px;\
}\
.nxt-nw--compact .nxt-nw__input {\
  width: 100%;\
}\
.nxt-nw--compact .nxt-nw__trust {\
  text-align: center; margin-top: 8px;\
}\
\
/* ── CARD variant (end-of-article) ── */\
.nxt-nw--card {\
  padding: 36px 32px;\
  background: linear-gradient(135deg, rgba(99,91,255,0.04), rgba(0,212,255,0.02));\
  border: 1px solid rgba(99,91,255,0.12);\
  border-radius: 16px;\
  text-align: center;\
  margin: 48px 0;\
  position: relative; overflow: hidden;\
}\
.nxt-nw--card::before {\
  content: ""; position: absolute; inset: -1px;\
  border-radius: 16px;\
  padding: 1px;\
  background: linear-gradient(135deg, rgba(99,91,255,0.15), transparent 50%, rgba(0,212,255,0.1));\
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);\
  -webkit-mask-composite: xor; mask-composite: exclude;\
  pointer-events: none;\
}\
.nxt-nw--card .nxt-nw__icon {\
  margin: 0 auto 20px;\
  width: 52px; height: 52px;\
}\
.nxt-nw--card .nxt-nw__title {\
  font-size: 18px; margin-bottom: 8px;\
}\
.nxt-nw--card .nxt-nw__desc {\
  font-size: 14px; margin-bottom: 24px; max-width: 380px;\
  margin-left: auto; margin-right: auto;\
}\
.nxt-nw--card .nxt-nw__form {\
  justify-content: center; max-width: 400px;\
  margin: 0 auto;\
}\
.nxt-nw--card .nxt-nw__input { flex: 1; }\
.nxt-nw--card .nxt-nw__trust {\
  text-align: center; margin-top: 12px;\
}\
.nxt-nw--card .nxt-nw__success {\
  justify-content: center;\
}\
\
/* ── Responsive ── */\
@media (max-width: 768px) {\
  .nxt-nw--bar {\
    flex-direction: column; align-items: stretch;\
    gap: 16px; padding: 22px 20px;\
  }\
  .nxt-nw--bar .nxt-nw__icon { display: none; }\
  .nxt-nw--bar .nxt-nw__form { flex-direction: column; }\
  .nxt-nw--bar .nxt-nw__input { width: 100%; }\
  .nxt-nw--card .nxt-nw__form { flex-direction: column; }\
  .nxt-nw--card { padding: 28px 22px; }\
}';
    document.head.appendChild(style);
  }

  // ── SVG icons ──
  var emailSVG = '<svg viewBox="0 0 24 24" fill="none" stroke="url(#nw-g)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
    '<defs><linearGradient id="nw-g" x1="0" y1="0" x2="24" y2="24"><stop offset="0%" stop-color="#635BFF"/><stop offset="100%" stop-color="#00D4FF"/></linearGradient></defs>' +
    '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>' +
    '<polyline points="22,6 12,13 2,6"/></svg>';

  var checkSVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<polyline points="20 6 9 17 4 12"/></svg>';

  // ── Render Widget ──
  function renderWidget(container) {
    var variant = container.getAttribute('data-variant') || 'bar';
    var cssClass = 'nxt-nw nxt-nw--' + variant;
    var uid = 'nxt-nw-' + Math.random().toString(36).substr(2, 6);

    // If already submitted, show success
    if (isSubmitted()) {
      container.className = cssClass;
      container.innerHTML = '<div class="nxt-nw__success">' + checkSVG +
        '<span>You\'re subscribed! Check your inbox.</span></div>';
      return;
    }

    container.className = cssClass;

    if (variant === 'compact') {
      container.innerHTML =
        '<div class="nxt-nw__title">Get AI tools & tips weekly</div>' +
        '<form class="nxt-nw__form" id="' + uid + '-form">' +
          '<input type="email" class="nxt-nw__input" placeholder="you@example.com" required autocomplete="email" aria-label="Email">' +
          '<button type="submit" class="nxt-nw__btn">Subscribe</button>' +
        '</form>' +
        '<div class="nxt-nw__error" id="' + uid + '-error"></div>' +
        '<div class="nxt-nw__trust">No spam. Unsubscribe anytime.</div>';
    } else if (variant === 'card') {
      container.innerHTML =
        '<div class="nxt-nw__icon">' + emailSVG + '</div>' +
        '<div class="nxt-nw__title">Enjoyed this? Get more every week.</div>' +
        '<div class="nxt-nw__desc">Join 266+ builders getting curated AI tools, consciousness research, and developer tips. Free, forever.</div>' +
        '<form class="nxt-nw__form" id="' + uid + '-form">' +
          '<input type="email" class="nxt-nw__input" placeholder="you@example.com" required autocomplete="email" aria-label="Email">' +
          '<button type="submit" class="nxt-nw__btn">Subscribe Free</button>' +
        '</form>' +
        '<div class="nxt-nw__error" id="' + uid + '-error"></div>' +
        '<div class="nxt-nw__trust">No spam. Unsubscribe anytime.</div>';
    } else {
      // Default: bar
      container.innerHTML =
        '<div class="nxt-nw__icon">' + emailSVG + '</div>' +
        '<div class="nxt-nw__text">' +
          '<div class="nxt-nw__title">Get Weekly AI Tools & Tips</div>' +
          '<div class="nxt-nw__desc">Join 266+ builders. Curated tools, research, and dev tips every week.</div>' +
        '</div>' +
        '<form class="nxt-nw__form" id="' + uid + '-form">' +
          '<input type="email" class="nxt-nw__input" placeholder="you@example.com" required autocomplete="email" aria-label="Email">' +
          '<button type="submit" class="nxt-nw__btn">Subscribe</button>' +
        '</form>' +
        '<div class="nxt-nw__error" id="' + uid + '-error"></div>';
    }

    // Bind form submit
    var form = document.getElementById(uid + '-form');
    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        handleWidgetSubmit(container, uid, variant);
      });
    }
  }

  function handleWidgetSubmit(container, uid, variant) {
    var form = document.getElementById(uid + '-form');
    var errorEl = document.getElementById(uid + '-error');
    var input = form.querySelector('.nxt-nw__input');
    var btn = form.querySelector('.nxt-nw__btn');
    var email = input.value.trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errorEl.textContent = 'Please enter a valid email.';
      errorEl.style.display = 'block';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Subscribing...';
    errorEl.style.display = 'none';

    submitEmail(email, 'widget-' + variant, function(success) {
      if (success) {
        markSubmitted();
        container.innerHTML = '<div class="nxt-nw__success">' + checkSVG +
          '<span>You\'re in! Check your inbox to confirm.</span></div>';
      } else {
        errorEl.textContent = 'Something went wrong. Try again.';
        errorEl.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Subscribe';
      }
    });
  }

  function submitEmail(email, source, callback) {
    // Try Formspree first
    var xhr = new XMLHttpRequest();
    xhr.open('POST', FORMSPREE_ENDPOINT, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.timeout = 8000;

    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        callback(true);
      } else {
        // Fallback
        submitFallback(email, source, callback);
      }
    };
    xhr.onerror = function() { submitFallback(email, source, callback); };
    xhr.ontimeout = function() { submitFallback(email, source, callback); };

    xhr.send(JSON.stringify({
      email: email,
      source: source,
      page: location.pathname,
      _subject: 'New Newsletter Signup (' + source + ') - ' + email
    }));
  }

  function submitFallback(email, source, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', FALLBACK_ENDPOINT, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.timeout = 8000;

    xhr.onload = function() { callback(xhr.status >= 200 && xhr.status < 300); };
    xhr.onerror = function() { callback(false); };
    xhr.ontimeout = function() { callback(false); };

    xhr.send(JSON.stringify({
      email: email,
      source: 'nextool-' + source,
      page: location.pathname,
      _subject: 'Newsletter Signup (' + source + ' fallback) - ' + email,
      _template: 'table'
    }));
  }

  // ── Initialize ──
  function init() {
    var widgets = document.querySelectorAll('.nxt-newsletter-widget');
    if (!widgets.length) return;

    injectStyles();
    for (var i = 0; i < widgets.length; i++) {
      renderWidget(widgets[i]);
    }
  }

  // ── Public API for dynamic insertion ──
  window.NxtNewsletter = {
    render: function(selector) {
      injectStyles();
      var el = typeof selector === 'string' ? document.querySelector(selector) : selector;
      if (el) renderWidget(el);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
