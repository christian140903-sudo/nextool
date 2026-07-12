/**
 * NexTool Email Capture — Popup System v2.0
 * ==========================================
 * Elegant exit-intent + timed popup for email capture.
 *
 * Triggers:
 *   - After 30 seconds on page
 *   - On exit-intent (mouse leaves viewport top)
 *
 * Behavior:
 *   - Cookie-based: Shows max 1x per 7 days
 *   - Respects existing lead-capture submissions
 *   - Skip for Pro users
 *   - Dismiss button + overlay click + Escape key
 *
 * Form Backend: Formspree.io (HTML form action)
 * Fallback:     FormSubmit.co AJAX
 *
 * < 6KB minified. Zero dependencies.
 */
(function() {
  'use strict';

  // Skip for Pro users
  if (window.NexToolPro && window.NexToolPro.active) return;

  // ── Config ──
  var FORMSPREE_ENDPOINT = 'https://formspree.io/f/xzaborjq';
  var FALLBACK_ENDPOINT = 'https://formsubmit.co/ajax/christianjunbucher@gmail.com';
  var SHOW_DELAY = 30000;       // 30 seconds
  var COOKIE_DAYS = 7;          // Show again after 7 days
  var COOKIE_NAME = 'nxt_ec_seen';
  var STORAGE_KEY = 'nxt_ec_submitted';

  // ── Cookie Helpers ──
  function setCookie(name, value, days) {
    var d = new Date();
    d.setTime(d.getTime() + (days * 86400000));
    document.cookie = name + '=' + value + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
  }

  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }

  function isSubmitted() {
    try { return localStorage.getItem(STORAGE_KEY) === 'true'; } catch(e) { return false; }
  }

  function markSubmitted() {
    try { localStorage.setItem(STORAGE_KEY, 'true'); } catch(e) { /* */ }
  }

  // ── Should we show? ──
  function shouldShow() {
    if (isSubmitted()) return false;
    if (getCookie(COOKIE_NAME)) return false;
    // Also respect the old lead-capture system
    try {
      if (localStorage.getItem('ntool_lead_submitted') === 'true') return false;
    } catch(e) { /* */ }
    return true;
  }

  function markSeen() {
    setCookie(COOKIE_NAME, '1', COOKIE_DAYS);
  }

  // ── State ──
  var popupShown = false;
  var popupElement = null;

  // ── Inject CSS ──
  function injectStyles() {
    var style = document.createElement('style');
    style.id = 'nxt-ec-styles';
    style.textContent = '\
/* Email Capture Popup */\
.nxt-ec-overlay {\
  position: fixed; inset: 0; z-index: 99998;\
  background: rgba(0,0,0,0.72);\
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);\
  display: flex; align-items: center; justify-content: center;\
  opacity: 0; visibility: hidden;\
  transition: opacity 0.4s cubic-bezier(0.4,0,0.2,1), visibility 0.4s;\
  font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;\
}\
.nxt-ec-overlay.active { opacity: 1; visibility: visible; }\
\
.nxt-ec-popup {\
  position: relative; width: 92%; max-width: 480px;\
  background: #0a0a10;\
  border: 1px solid rgba(99,91,255,0.18);\
  border-radius: 20px;\
  padding: 0; overflow: hidden;\
  transform: translateY(24px) scale(0.96);\
  transition: transform 0.5s cubic-bezier(0.22,1,0.36,1);\
  box-shadow: 0 32px 100px rgba(0,0,0,0.7), 0 0 60px rgba(99,91,255,0.06);\
}\
.nxt-ec-overlay.active .nxt-ec-popup {\
  transform: translateY(0) scale(1);\
}\
\
/* Top glow bar */\
.nxt-ec-glow {\
  height: 3px;\
  background: linear-gradient(90deg, transparent 0%, #635BFF 30%, #00D4FF 70%, transparent 100%);\
  animation: nxt-ec-shimmer 3s ease-in-out infinite;\
}\
@keyframes nxt-ec-shimmer {\
  0%, 100% { opacity: 0.6; }\
  50% { opacity: 1; }\
}\
\
.nxt-ec-body { padding: 40px 36px 32px; }\
\
/* Close button */\
.nxt-ec-close {\
  position: absolute; top: 16px; right: 16px;\
  width: 32px; height: 32px; border-radius: 50%;\
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);\
  color: rgba(255,255,255,0.4); font-size: 18px;\
  display: flex; align-items: center; justify-content: center;\
  cursor: pointer; transition: all 0.2s; line-height: 1;\
}\
.nxt-ec-close:hover {\
  background: rgba(255,255,255,0.08); color: white;\
  border-color: rgba(255,255,255,0.15);\
}\
\
/* Icon */\
.nxt-ec-icon {\
  width: 56px; height: 56px; margin: 0 auto 24px;\
  background: linear-gradient(135deg, rgba(99,91,255,0.12), rgba(0,212,255,0.08));\
  border: 1px solid rgba(99,91,255,0.15); border-radius: 16px;\
  display: flex; align-items: center; justify-content: center;\
}\
.nxt-ec-icon svg { width: 28px; height: 28px; }\
\
/* Typography */\
.nxt-ec-title {\
  font-family: "Space Grotesk", sans-serif;\
  font-size: 24px; font-weight: 700; color: #f0f0f0;\
  text-align: center; line-height: 1.3; margin-bottom: 10px;\
  letter-spacing: -0.02em;\
}\
.nxt-ec-subtitle {\
  font-size: 14.5px; color: rgba(255,255,255,0.5);\
  text-align: center; line-height: 1.65; margin-bottom: 28px;\
}\
.nxt-ec-subtitle strong { color: rgba(255,255,255,0.72); font-weight: 600; }\
\
/* Bullets */\
.nxt-ec-benefits {\
  display: flex; flex-direction: column; gap: 10px;\
  margin-bottom: 28px; padding: 0;\
}\
.nxt-ec-benefit {\
  display: flex; align-items: center; gap: 10px;\
  font-size: 13.5px; color: rgba(255,255,255,0.6);\
}\
.nxt-ec-benefit-dot {\
  width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;\
  background: #635BFF;\
}\
\
/* Form */\
.nxt-ec-form { display: flex; gap: 10px; }\
.nxt-ec-input {\
  flex: 1; padding: 14px 16px;\
  background: rgba(255,255,255,0.03);\
  border: 1px solid rgba(255,255,255,0.08);\
  border-radius: 10px; color: #e2e8f0;\
  font-size: 14.5px; font-family: inherit;\
  transition: border-color 0.25s, box-shadow 0.25s;\
}\
.nxt-ec-input:focus {\
  border-color: rgba(99,91,255,0.5);\
  box-shadow: 0 0 0 3px rgba(99,91,255,0.08);\
  outline: none;\
}\
.nxt-ec-input::placeholder { color: rgba(255,255,255,0.2); }\
\
.nxt-ec-btn {\
  padding: 14px 24px;\
  background: linear-gradient(135deg, #635BFF, #7B74FF);\
  color: white; border: none; border-radius: 10px;\
  font-size: 14.5px; font-weight: 600; cursor: pointer;\
  font-family: inherit; white-space: nowrap;\
  transition: opacity 0.2s, transform 0.15s, box-shadow 0.25s;\
}\
.nxt-ec-btn:hover {\
  opacity: 0.92;\
  box-shadow: 0 4px 20px rgba(99,91,255,0.3);\
}\
.nxt-ec-btn:active { transform: scale(0.97); }\
.nxt-ec-btn:disabled { opacity: 0.5; cursor: not-allowed; }\
\
/* Error */\
.nxt-ec-error {\
  color: #f87171; font-size: 12.5px; margin-top: 8px;\
  display: none; text-align: center;\
}\
\
/* Trust line */\
.nxt-ec-trust {\
  display: flex; align-items: center; justify-content: center; gap: 14px;\
  margin-top: 18px; font-size: 11.5px; color: rgba(255,255,255,0.22);\
}\
.nxt-ec-trust span { display: flex; align-items: center; gap: 4px; }\
\
/* Success state */\
.nxt-ec-success { text-align: center; padding: 16px 0; }\
.nxt-ec-success-check {\
  width: 56px; height: 56px; margin: 0 auto 18px;\
  background: linear-gradient(135deg, rgba(16,185,129,0.12), rgba(0,212,255,0.08));\
  border: 1px solid rgba(16,185,129,0.2); border-radius: 50%;\
  display: flex; align-items: center; justify-content: center;\
}\
.nxt-ec-success-check svg { width: 28px; height: 28px; color: #10b981; }\
.nxt-ec-success h3 {\
  font-family: "Space Grotesk", sans-serif;\
  font-size: 20px; font-weight: 700; color: #f0f0f0; margin-bottom: 8px;\
}\
.nxt-ec-success p { font-size: 14px; color: rgba(255,255,255,0.45); }\
\
/* Mobile */\
@media (max-width: 640px) {\
  .nxt-ec-popup { max-width: 95%; }\
  .nxt-ec-body { padding: 32px 24px 24px; }\
  .nxt-ec-title { font-size: 20px; }\
  .nxt-ec-form { flex-direction: column; }\
  .nxt-ec-btn { width: 100%; text-align: center; }\
  .nxt-ec-trust { flex-direction: column; gap: 6px; }\
}';
    document.head.appendChild(style);
  }

  // ── Build Popup HTML ──
  function buildPopup() {
    var overlay = document.createElement('div');
    overlay.className = 'nxt-ec-overlay';
    overlay.id = 'nxt-ec-overlay';

    overlay.innerHTML = '<div class="nxt-ec-popup">' +
      '<div class="nxt-ec-glow"></div>' +
      '<button class="nxt-ec-close" aria-label="Close" id="nxt-ec-close">&times;</button>' +
      '<div class="nxt-ec-body">' +
        '<div class="nxt-ec-icon">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="url(#ec-grad)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
            '<defs><linearGradient id="ec-grad" x1="0" y1="0" x2="24" y2="24"><stop offset="0%" stop-color="#635BFF"/><stop offset="100%" stop-color="#00D4FF"/></linearGradient></defs>' +
            '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>' +
            '<polyline points="22,6 12,13 2,6"/>' +
          '</svg>' +
        '</div>' +
        '<h2 class="nxt-ec-title">Get Weekly AI Tools & Tips</h2>' +
        '<p class="nxt-ec-subtitle">Join <strong>266+ builders</strong> getting curated AI tools, consciousness research insights, and behind-the-scenes updates every week.</p>' +
        '<div class="nxt-ec-benefits">' +
          '<div class="nxt-ec-benefit"><span class="nxt-ec-benefit-dot"></span>Curated AI tools before anyone else</div>' +
          '<div class="nxt-ec-benefit"><span class="nxt-ec-benefit-dot" style="background:#00D4FF"></span>Consciousness research & ANIMA updates</div>' +
          '<div class="nxt-ec-benefit"><span class="nxt-ec-benefit-dot" style="background:#a855f7"></span>Developer tips & automation workflows</div>' +
        '</div>' +
        '<form class="nxt-ec-form" id="nxt-ec-form">' +
          '<input type="email" class="nxt-ec-input" id="nxt-ec-email" placeholder="you@example.com" required autocomplete="email" aria-label="Email address">' +
          '<button type="submit" class="nxt-ec-btn" id="nxt-ec-submit">Subscribe</button>' +
        '</form>' +
        '<div class="nxt-ec-error" id="nxt-ec-error"></div>' +
        '<div class="nxt-ec-trust">' +
          '<span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> No spam</span>' +
          '<span>Free forever</span>' +
          '<span>Unsubscribe anytime</span>' +
        '</div>' +
      '</div>' +
    '</div>';

    document.body.appendChild(overlay);
    popupElement = overlay;
    return overlay;
  }

  // ── Show Popup ──
  function showPopup() {
    if (popupShown || !shouldShow()) return;
    popupShown = true;
    markSeen();

    injectStyles();
    var overlay = buildPopup();

    // Animate in
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        overlay.classList.add('active');
      });
    });

    // Event listeners
    document.getElementById('nxt-ec-close').addEventListener('click', closePopup);
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closePopup();
    });
    document.addEventListener('keydown', handleEscape);
    document.getElementById('nxt-ec-form').addEventListener('submit', handleSubmit);
  }

  // ── Close Popup ──
  function closePopup() {
    if (!popupElement) return;
    popupElement.classList.remove('active');
    document.removeEventListener('keydown', handleEscape);
    setTimeout(function() {
      if (popupElement && popupElement.parentNode) {
        popupElement.parentNode.removeChild(popupElement);
      }
      popupElement = null;
    }, 400);
  }

  function handleEscape(e) {
    if (e.key === 'Escape') closePopup();
  }

  // ── Submit Handler ──
  function handleSubmit(e) {
    e.preventDefault();

    var emailInput = document.getElementById('nxt-ec-email');
    var submitBtn = document.getElementById('nxt-ec-submit');
    var errorEl = document.getElementById('nxt-ec-error');
    var email = emailInput.value.trim();

    // Validate
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errorEl.textContent = 'Please enter a valid email address.';
      errorEl.style.display = 'block';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Subscribing...';
    errorEl.style.display = 'none';

    // Try Formspree first, fallback to FormSubmit
    submitToFormspree(email, function(success) {
      if (success) {
        onSubmitSuccess(email);
      } else {
        // Fallback to FormSubmit.co
        submitToFormSubmit(email, function(ok) {
          if (ok) {
            onSubmitSuccess(email);
          } else {
            errorEl.textContent = 'Something went wrong. Please try again.';
            errorEl.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Subscribe';
          }
        });
      }
    });
  }

  function submitToFormspree(email, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', FORMSPREE_ENDPOINT, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.timeout = 8000;

    xhr.onload = function() {
      callback(xhr.status >= 200 && xhr.status < 300);
    };
    xhr.onerror = function() { callback(false); };
    xhr.ontimeout = function() { callback(false); };

    xhr.send(JSON.stringify({
      email: email,
      source: 'popup',
      page: location.pathname,
      _subject: 'New Newsletter Signup (Popup) - ' + email
    }));
  }

  function submitToFormSubmit(email, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', FALLBACK_ENDPOINT, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.timeout = 8000;

    xhr.onload = function() {
      callback(xhr.status >= 200 && xhr.status < 300);
    };
    xhr.onerror = function() { callback(false); };
    xhr.ontimeout = function() { callback(false); };

    xhr.send(JSON.stringify({
      email: email,
      source: 'nextool-popup',
      page: location.pathname,
      _subject: 'New Newsletter Signup (Popup Fallback) - ' + email,
      _template: 'table'
    }));
  }

  function onSubmitSuccess(email) {
    markSubmitted();
    // Also mark in old lead-capture system so they don't see double popups
    try { localStorage.setItem('ntool_lead_submitted', 'true'); } catch(e) { /* */ }

    var body = document.querySelector('.nxt-ec-body');
    if (!body) return;

    body.innerHTML = '<div class="nxt-ec-success">' +
      '<div class="nxt-ec-success-check">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<polyline points="20 6 9 17 4 12"/>' +
        '</svg>' +
      '</div>' +
      '<h3>You\'re in!</h3>' +
      '<p>Check your inbox to confirm. Welcome to the community.</p>' +
    '</div>';

    setTimeout(closePopup, 3000);
  }

  // ── Exit Intent Detection ──
  function setupExitIntent() {
    // Only on desktop — mobile doesn't have mouse-leave
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;

    var triggered = false;
    document.addEventListener('mouseout', function(e) {
      if (triggered || popupShown) return;
      // Check if mouse actually left the viewport from the top
      if (e.clientY <= 0 && e.relatedTarget === null) {
        triggered = true;
        showPopup();
      }
    });
  }

  // ── Timed Trigger ──
  function setupTimedTrigger() {
    setTimeout(function() {
      if (!popupShown && shouldShow()) {
        showPopup();
      }
    }, SHOW_DELAY);
  }

  // ── Initialize ──
  function init() {
    if (!shouldShow()) return;
    setupExitIntent();
    setupTimedTrigger();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
