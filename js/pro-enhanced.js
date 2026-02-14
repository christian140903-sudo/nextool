/**
 * NexTool Pro Enhanced Features v1.0
 * REAL Pro features that provide genuine value:
 * 1. Tool History — save & restore last 10 inputs per tool
 * 2. Theme Switcher — Light, Dark, Sepia, High Contrast
 * 3. Focus Mode — hide everything except the tool
 * 4. Quick Export — export any output as .txt, .json, .md
 * 5. Distraction-free — no banners, no branded output
 * Loaded via revenue.js on all /free-tools/ pages
 */
(function () {
  'use strict';

  if (!/\/free-tools\//.test(location.pathname)) return;

  var isPro = window.NexToolPro && window.NexToolPro.active;
  var STORAGE_KEY = 'ntpro_';
  var MAX_HISTORY = 10;

  // ───────────────────────────────────────
  // UTILITY
  // ───────────────────────────────────────
  function slug() {
    var m = location.pathname.match(/\/free-tools\/([^\/\.]+)/);
    return m ? m[1] : null;
  }

  function store(k, v) {
    try { localStorage.setItem(STORAGE_KEY + k, JSON.stringify(v)); } catch (e) { }
  }

  function load(k, fallback) {
    try {
      var v = localStorage.getItem(STORAGE_KEY + k);
      return v !== null ? JSON.parse(v) : fallback;
    } catch (e) { return fallback; }
  }

  function qs(sel) { return document.querySelector(sel); }

  // ───────────────────────────────────────
  // INJECT CSS
  // ───────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('ntpe-styles')) return;
    var s = document.createElement('style');
    s.id = 'ntpe-styles';
    s.textContent = [
      /* Pro Toolbar */
      '.ntpe-bar{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:9990;display:flex;gap:6px;padding:6px 10px;background:rgba(17,17,24,.95);backdrop-filter:blur(20px);border:1px solid rgba(99,102,241,.15);border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,.5);font-family:Inter,-apple-system,sans-serif;transition:opacity .3s}',
      '.ntpe-btn{display:flex;align-items:center;gap:6px;padding:8px 14px;background:rgba(26,26,36,.8);border:1px solid rgba(99,102,241,.1);border-radius:10px;color:#94a3b8;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;white-space:nowrap;font-family:inherit}',
      '.ntpe-btn:hover{background:rgba(99,102,241,.12);color:#e2e8f0;border-color:rgba(99,102,241,.25)}',
      '.ntpe-btn.active{background:rgba(99,102,241,.2);color:#818cf8;border-color:rgba(99,102,241,.3)}',
      '.ntpe-btn svg{width:14px;height:14px;flex-shrink:0}',
      '.ntpe-badge{padding:2px 6px;background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;border-radius:4px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}',

      /* Pro Gate Modal */
      '.ntpe-gate{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.7);backdrop-filter:blur(4px);opacity:0;transition:opacity .3s;font-family:Inter,-apple-system,sans-serif}',
      '.ntpe-gate.show{opacity:1}',
      '.ntpe-gate-card{background:#111118;border:1px solid rgba(99,102,241,.2);border-radius:20px;padding:32px;max-width:380px;width:90%;text-align:center;transform:scale(.95);transition:transform .3s}',
      '.ntpe-gate.show .ntpe-gate-card{transform:scale(1)}',
      '.ntpe-gate-icon{font-size:40px;margin-bottom:12px}',
      '.ntpe-gate-title{color:#fff;font-size:18px;font-weight:700;margin-bottom:8px}',
      '.ntpe-gate-text{color:#94a3b8;font-size:13px;line-height:1.6;margin-bottom:20px}',
      '.ntpe-gate-btn{display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;border-radius:10px;font-weight:700;font-size:14px;text-decoration:none;transition:opacity .2s}',
      '.ntpe-gate-btn:hover{opacity:.9}',
      '.ntpe-gate-close{display:block;margin-top:12px;background:none;border:none;color:#64748b;font-size:12px;cursor:pointer;font-family:inherit}',

      /* History Panel */
      '.ntpe-history{position:fixed;top:0;right:-380px;width:360px;height:100vh;z-index:9995;background:#0a0a12;border-left:1px solid rgba(99,102,241,.15);transition:right .3s cubic-bezier(.22,1,.36,1);overflow-y:auto;font-family:Inter,-apple-system,sans-serif}',
      '.ntpe-history.open{right:0}',
      '.ntpe-history-head{padding:20px;border-bottom:1px solid rgba(99,102,241,.1);display:flex;justify-content:space-between;align-items:center}',
      '.ntpe-history-title{color:#fff;font-size:15px;font-weight:700}',
      '.ntpe-history-close{background:none;border:none;color:#64748b;font-size:20px;cursor:pointer;padding:4px}',
      '.ntpe-history-list{padding:12px}',
      '.ntpe-history-item{padding:14px;background:#111118;border:1px solid rgba(99,102,241,.08);border-radius:12px;margin-bottom:8px;cursor:pointer;transition:all .2s}',
      '.ntpe-history-item:hover{border-color:rgba(99,102,241,.25);background:rgba(99,102,241,.05)}',
      '.ntpe-history-time{font-size:11px;color:#64748b;margin-bottom:6px}',
      '.ntpe-history-preview{font-size:12px;color:#94a3b8;font-family:monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}',
      '.ntpe-history-empty{padding:40px 20px;text-align:center;color:#64748b;font-size:13px}',

      /* Theme: Light */
      'body.ntpe-light{--bg:#f8fafc;--surface:#ffffff;--surface2:#f1f5f9;--border:#e2e8f0;--text:#1e293b;--text2:#64748b;background:#f8fafc!important;color:#1e293b!important}',
      'body.ntpe-light .nav,body.ntpe-light nav{background:rgba(248,250,252,.95)!important;border-color:#e2e8f0!important}',
      'body.ntpe-light .nav-logo,body.ntpe-light .logo{-webkit-text-fill-color:#6366f1!important}',
      'body.ntpe-light .nav-links a{color:#64748b!important}',
      'body.ntpe-light .panel,body.ntpe-light .glass-card,body.ntpe-light .tool-container{background:#fff!important;border-color:#e2e8f0!important}',
      'body.ntpe-light textarea,body.ntpe-light input[type=text],body.ntpe-light input[type=number]{background:#f8fafc!important;color:#1e293b!important;border-color:#e2e8f0!important}',
      'body.ntpe-light .output-area,body.ntpe-light pre,body.ntpe-light code{background:#f1f5f9!important;color:#334155!important}',
      'body.ntpe-light .toolbar button,body.ntpe-light .toolbar select{background:#f1f5f9!important;color:#334155!important;border-color:#e2e8f0!important}',
      'body.ntpe-light .hero h1,body.ntpe-light h1,body.ntpe-light h2{color:#0f172a!important;-webkit-text-fill-color:#0f172a!important}',
      'body.ntpe-light .hero h1 span,body.ntpe-light h1 .grad{-webkit-text-fill-color:transparent!important}',
      'body.ntpe-light footer{background:#f8fafc!important;border-color:#e2e8f0!important}',
      'body.ntpe-light .panel-header{background:#f1f5f9!important;border-color:#e2e8f0!important}',

      /* Theme: Sepia */
      'body.ntpe-sepia{--bg:#faf5eb;--surface:#fff8ee;--surface2:#f5edd6;--border:#e8dcc8;--text:#3d2b1f;--text2:#7c6a56;background:#faf5eb!important;color:#3d2b1f!important}',
      'body.ntpe-sepia .nav,body.ntpe-sepia nav{background:rgba(250,245,235,.95)!important;border-color:#e8dcc8!important}',
      'body.ntpe-sepia .panel,body.ntpe-sepia .glass-card{background:#fff8ee!important;border-color:#e8dcc8!important}',
      'body.ntpe-sepia textarea,body.ntpe-sepia input{background:#faf5eb!important;color:#3d2b1f!important}',
      'body.ntpe-sepia .output-area{background:#f5edd6!important;color:#3d2b1f!important}',

      /* Theme: High Contrast */
      'body.ntpe-contrast{--bg:#000;--surface:#0a0a0a;--surface2:#1a1a1a;--border:#444;--text:#fff;--text2:#ccc;background:#000!important;color:#fff!important}',
      'body.ntpe-contrast .nav,body.ntpe-contrast nav{background:#000!important;border-color:#444!important}',
      'body.ntpe-contrast .panel,body.ntpe-contrast .glass-card{background:#0a0a0a!important;border-color:#555!important}',
      'body.ntpe-contrast textarea,body.ntpe-contrast input{background:#111!important;color:#fff!important;border-color:#555!important}',
      'body.ntpe-contrast .output-area{color:#fff!important}',

      /* Focus Mode */
      'body.ntpe-focus .nav,body.ntpe-focus nav,body.ntpe-focus .hero,body.ntpe-focus footer,body.ntpe-focus .cta-section,body.ntpe-focus .ntpf,body.ntpe-focus .ntr-section,body.ntpe-focus .ntlc-overlay{display:none!important}',
      'body.ntpe-focus .tool-container,body.ntpe-focus .tool-section{max-width:100%;padding-top:20px}',
      'body.ntpe-focus .ntpe-bar{bottom:20px}',

      /* Theme Dropdown */
      '.ntpe-theme-menu{position:absolute;bottom:48px;left:50%;transform:translateX(-50%);background:#111118;border:1px solid rgba(99,102,241,.2);border-radius:12px;padding:6px;min-width:150px;display:none;box-shadow:0 8px 32px rgba(0,0,0,.5)}',
      '.ntpe-theme-menu.show{display:block}',
      '.ntpe-theme-opt{display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;color:#94a3b8;font-size:12px;font-weight:500;cursor:pointer;transition:all .15s}',
      '.ntpe-theme-opt:hover{background:rgba(99,102,241,.1);color:#e2e8f0}',
      '.ntpe-theme-opt.active{color:#818cf8}',
      '.ntpe-theme-swatch{width:16px;height:16px;border-radius:4px;border:1px solid rgba(255,255,255,.1)}',

      /* Responsive */
      '@media(max-width:640px){.ntpe-bar{bottom:12px;left:8px;right:8px;transform:none;flex-wrap:wrap;justify-content:center}.ntpe-history{width:100%}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  // ───────────────────────────────────────
  // PRO GATE
  // ───────────────────────────────────────
  function showProGate(featureName) {
    if (qs('.ntpe-gate')) return;
    var gate = document.createElement('div');
    gate.className = 'ntpe-gate';
    gate.innerHTML =
      '<div class="ntpe-gate-card">' +
      '<div class="ntpe-gate-icon">\u2728</div>' +
      '<div class="ntpe-gate-title">' + featureName + ' is a Pro feature</div>' +
      '<div class="ntpe-gate-text">NexTool Pro unlocks tool history, themes, focus mode, and clean output across all 245+ tools. One-time $29.</div>' +
      '<a href="/pro.html" class="ntpe-gate-btn">Get NexTool Pro \u2192</a>' +
      '<button class="ntpe-gate-close">Maybe later</button>' +
      '</div>';
    document.body.appendChild(gate);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { gate.classList.add('show'); });
    });
    gate.addEventListener('click', function (e) {
      if (e.target === gate || e.target.classList.contains('ntpe-gate-close')) {
        gate.classList.remove('show');
        setTimeout(function () { gate.remove(); }, 300);
      }
    });
  }

  // ───────────────────────────────────────
  // 1. TOOL HISTORY
  // ───────────────────────────────────────
  var historyPanel = null;

  function getHistory() {
    var s = slug();
    if (!s) return [];
    return load('history_' + s, []);
  }

  function saveToHistory() {
    var s = slug();
    if (!s) return;
    // Find the main input element
    var input = qs('#jsonInput') || qs('#input') || qs('textarea') ||
      qs('input[type=text]:not(.ntpe-btn)');
    if (!input) return;
    var val = input.value || input.textContent || '';
    if (!val || val.length < 3) return;

    var history = getHistory();
    // Don't save duplicates
    if (history.length > 0 && history[0].value === val) return;

    history.unshift({
      value: val.substring(0, 2000), // Cap at 2KB
      time: Date.now(),
      preview: val.substring(0, 80).replace(/\n/g, ' ')
    });
    if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
    store('history_' + s, history);
  }

  function restoreFromHistory(entry) {
    var input = qs('#jsonInput') || qs('#input') || qs('textarea') ||
      qs('input[type=text]:not(.ntpe-btn)');
    if (!input) return;
    input.value = entry.value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    // Close panel
    if (historyPanel) historyPanel.classList.remove('open');
  }

  function toggleHistoryPanel() {
    if (!isPro) { showProGate('Tool History'); return; }
    if (!historyPanel) {
      historyPanel = document.createElement('div');
      historyPanel.className = 'ntpe-history';
      historyPanel.innerHTML =
        '<div class="ntpe-history-head">' +
        '<span class="ntpe-history-title">\uD83D\uDD53 History</span>' +
        '<button class="ntpe-history-close">\u00D7</button>' +
        '</div>' +
        '<div class="ntpe-history-list"></div>';
      document.body.appendChild(historyPanel);
      historyPanel.querySelector('.ntpe-history-close').addEventListener('click', function () {
        historyPanel.classList.remove('open');
      });
    }

    var list = historyPanel.querySelector('.ntpe-history-list');
    var history = getHistory();
    if (history.length === 0) {
      list.innerHTML = '<div class="ntpe-history-empty">No history yet.<br>Use the tool and your inputs will be saved automatically.</div>';
    } else {
      list.innerHTML = history.map(function (h, i) {
        var ago = formatTimeAgo(h.time);
        return '<div class="ntpe-history-item" data-idx="' + i + '">' +
          '<div class="ntpe-history-time">' + ago + '</div>' +
          '<div class="ntpe-history-preview">' + escapeHTML(h.preview) + '</div>' +
          '</div>';
      }).join('');
      list.querySelectorAll('.ntpe-history-item').forEach(function (item) {
        item.addEventListener('click', function () {
          var idx = parseInt(item.dataset.idx, 10);
          restoreFromHistory(history[idx]);
        });
      });
    }

    historyPanel.classList.toggle('open');
  }

  // Auto-save to history on key actions
  function hookHistorySave() {
    if (!isPro) return;
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      var text = (btn.textContent || '').toLowerCase();
      if (/format|generate|convert|validate|minify|beautify|encode|decode|calculate|compress|optimize|preview/.test(text)) {
        setTimeout(saveToHistory, 100);
      }
    });
  }

  // ───────────────────────────────────────
  // 2. THEME SWITCHER
  // ───────────────────────────────────────
  var themes = [
    { id: 'dark', name: 'Dark', color: '#111118' },
    { id: 'light', name: 'Light', color: '#f8fafc' },
    { id: 'sepia', name: 'Sepia', color: '#faf5eb' },
    { id: 'contrast', name: 'High Contrast', color: '#000000' }
  ];

  function applyTheme(id) {
    document.body.classList.remove('ntpe-light', 'ntpe-sepia', 'ntpe-contrast');
    if (id !== 'dark') document.body.classList.add('ntpe-' + id);
    store('theme', id);
  }

  function getCurrentTheme() {
    return load('theme', 'dark');
  }

  function toggleThemeMenu() {
    if (!isPro) { showProGate('Custom Themes'); return; }
    var menu = qs('.ntpe-theme-menu');
    if (menu) {
      menu.classList.toggle('show');
      return;
    }
  }

  // ───────────────────────────────────────
  // 3. FOCUS MODE
  // ───────────────────────────────────────
  var focusActive = false;

  function toggleFocusMode() {
    if (!isPro) { showProGate('Focus Mode'); return; }
    focusActive = !focusActive;
    document.body.classList.toggle('ntpe-focus', focusActive);
    var btn = qs('.ntpe-btn-focus');
    if (btn) btn.classList.toggle('active', focusActive);
  }

  // ───────────────────────────────────────
  // 4. QUICK EXPORT
  // ───────────────────────────────────────
  function quickExport() {
    if (!isPro) { showProGate('Quick Export'); return; }
    // Find output content
    var output = qs('#output') || qs('#formatted') || qs('#result') ||
      qs('.output-area') || qs('[id*=output]') || qs('[id*=result]');
    if (!output) {
      alert('No output found to export.');
      return;
    }
    var text = output.textContent || output.innerText || '';
    if (!text.trim()) {
      alert('Output is empty. Use the tool first.');
      return;
    }
    // Download as text file
    var toolName = slug() || 'output';
    var blob = new Blob([text], { type: 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = toolName + '-output.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  // ───────────────────────────────────────
  // HELPERS
  // ───────────────────────────────────────
  function formatTimeAgo(ts) {
    var diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
  }

  function escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ───────────────────────────────────────
  // BUILD TOOLBAR
  // ───────────────────────────────────────
  function buildToolbar() {
    var bar = document.createElement('div');
    bar.className = 'ntpe-bar';

    var proBadge = isPro ? '' : '<span class="ntpe-badge">Pro</span>';

    // History button
    var histBtn = document.createElement('button');
    histBtn.className = 'ntpe-btn';
    histBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> History ' + proBadge;
    histBtn.addEventListener('click', toggleHistoryPanel);
    bar.appendChild(histBtn);

    // Theme button with dropdown
    var themeWrap = document.createElement('div');
    themeWrap.style.cssText = 'position:relative';
    var themeBtn = document.createElement('button');
    themeBtn.className = 'ntpe-btn';
    themeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> Theme ' + proBadge;
    themeBtn.addEventListener('click', function () {
      if (!isPro) { showProGate('Custom Themes'); return; }
      var menu = qs('.ntpe-theme-menu');
      if (menu) menu.classList.toggle('show');
    });

    var themeMenu = document.createElement('div');
    themeMenu.className = 'ntpe-theme-menu';
    var currentTheme = getCurrentTheme();
    themeMenu.innerHTML = themes.map(function (t) {
      return '<div class="ntpe-theme-opt' + (t.id === currentTheme ? ' active' : '') + '" data-theme="' + t.id + '">' +
        '<div class="ntpe-theme-swatch" style="background:' + t.color + '"></div>' +
        t.name +
        '</div>';
    }).join('');

    themeMenu.addEventListener('click', function (e) {
      var opt = e.target.closest('.ntpe-theme-opt');
      if (!opt) return;
      applyTheme(opt.dataset.theme);
      themeMenu.querySelectorAll('.ntpe-theme-opt').forEach(function (o) { o.classList.remove('active'); });
      opt.classList.add('active');
      themeMenu.classList.remove('show');
    });

    themeWrap.appendChild(themeBtn);
    themeWrap.appendChild(themeMenu);
    bar.appendChild(themeWrap);

    // Focus Mode button
    var focusBtn = document.createElement('button');
    focusBtn.className = 'ntpe-btn ntpe-btn-focus';
    focusBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg> Focus ' + proBadge;
    focusBtn.addEventListener('click', toggleFocusMode);
    bar.appendChild(focusBtn);

    // Export button
    var exportBtn = document.createElement('button');
    exportBtn.className = 'ntpe-btn';
    exportBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export ' + proBadge;
    exportBtn.addEventListener('click', quickExport);
    bar.appendChild(exportBtn);

    document.body.appendChild(bar);

    // Close theme menu on outside click
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.ntpe-theme-menu') && !e.target.closest('.ntpe-btn')) {
        var menu = qs('.ntpe-theme-menu');
        if (menu) menu.classList.remove('show');
      }
    });
  }

  // ───────────────────────────────────────
  // KEYBOARD SHORTCUTS
  // ───────────────────────────────────────
  function initKeyboardShortcuts() {
    if (!isPro) return;
    document.addEventListener('keydown', function (e) {
      // Ctrl/Cmd + Shift + H = History
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'H') {
        e.preventDefault();
        toggleHistoryPanel();
      }
      // Ctrl/Cmd + Shift + F = Focus Mode
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        toggleFocusMode();
      }
      // Ctrl/Cmd + Shift + E = Export
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        quickExport();
      }
      // Escape = close panels
      if (e.key === 'Escape') {
        if (historyPanel && historyPanel.classList.contains('open')) {
          historyPanel.classList.remove('open');
        }
        if (focusActive) toggleFocusMode();
      }
    });
  }

  // ───────────────────────────────────────
  // INIT
  // ───────────────────────────────────────
  function init() {
    injectStyles();

    // Apply saved theme for Pro users
    if (isPro) {
      var savedTheme = getCurrentTheme();
      if (savedTheme !== 'dark') applyTheme(savedTheme);
    }

    buildToolbar();
    hookHistorySave();
    initKeyboardShortcuts();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Small delay to let pro-check.js set window.NexToolPro
    setTimeout(init, 100);
  }
})();
