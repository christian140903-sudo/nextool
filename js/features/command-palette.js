/**
 * NexTool Command Palette
 * -----------------------------------------------------------------------
 * Cmd+K / Ctrl+K overlay inspired by VS Code, Raycast, and Linear.
 * Fuzzy search across pages, tools (228+), and actions.
 * Keyboard navigation, grouped results, recent-search memory.
 *
 * @module features/command-palette
 * @exports init, destroy, open, close, registerCommand
 */

/* ===================================================================
   DATA — commands, pages, actions
   =================================================================== */

const PAGE_COMMANDS = [
    { type: 'page', label: 'Home', url: '/', icon: '\u{1F3E0}', keywords: ['home', 'start', 'landing'] },
    { type: 'page', label: 'Pricing', url: '/pricing.html', icon: '\u{1F4B0}', keywords: ['price', 'cost', 'buy', 'plans'] },
    { type: 'page', label: 'Free Tools', url: '/free-tools/', icon: '\u{1F6E0}\uFE0F', keywords: ['tools', 'free', 'utilities'] },
    { type: 'page', label: 'Blog', url: '/blog/', icon: '\u{1F4DD}', keywords: ['blog', 'articles', 'news'] },
    { type: 'page', label: 'About', url: '/about.html', icon: '\u{1F464}', keywords: ['about', 'team', 'company'] },
    { type: 'page', label: 'Contact', url: '/contact.html', icon: '\u{1F4E7}', keywords: ['contact', 'email', 'support'] },
];

const ACTION_COMMANDS = [
    { type: 'action', label: 'Toggle Dark Mode', action: 'toggleTheme', icon: '\u{1F319}', keywords: ['theme', 'dark', 'light', 'mode'] },
    { type: 'action', label: 'Contact Us', action: 'openContact', icon: '\u{1F4E7}', keywords: ['contact', 'email', 'help', 'support'] },
    { type: 'action', label: 'Get a Quote', action: 'openQuote', icon: '\u{1F4AC}', keywords: ['quote', 'price', 'estimate'] },
    { type: 'action', label: 'Scroll to Top', action: 'scrollTop', icon: '\u2B06\uFE0F', keywords: ['top', 'scroll', 'up'] },
    { type: 'action', label: 'View Source on GitHub', action: 'openGitHub', icon: '\u{1F4BB}', keywords: ['github', 'source', 'code', 'repository'] },
];

/**
 * Representative tool entries. In production these would come from an
 * index file or the DOM.  We include a generous sample so fuzzy search
 * feels complete.
 */
const TOOL_COMMANDS = [
    { type: 'tool', label: 'JSON Formatter', url: '/free-tools/json-formatter.html', icon: '\u{1F4CB}', keywords: ['json', 'format', 'beautify', 'validate'] },
    { type: 'tool', label: 'Base64 Encoder/Decoder', url: '/free-tools/base64-encoder-decoder.html', icon: '\u{1F510}', keywords: ['base64', 'encode', 'decode'] },
    { type: 'tool', label: 'URL Encoder/Decoder', url: '/free-tools/url-encoder-decoder.html', icon: '\u{1F517}', keywords: ['url', 'encode', 'decode', 'uri'] },
    { type: 'tool', label: 'Markdown Preview', url: '/free-tools/markdown-preview.html', icon: '\u{1F4C4}', keywords: ['markdown', 'preview', 'md'] },
    { type: 'tool', label: 'Color Picker', url: '/free-tools/color-picker.html', icon: '\u{1F3A8}', keywords: ['color', 'picker', 'hex', 'rgb'] },
    { type: 'tool', label: 'Regex Tester', url: '/free-tools/regex-tester.html', icon: '\u{1F50D}', keywords: ['regex', 'regular', 'expression', 'test'] },
    { type: 'tool', label: 'Lorem Ipsum Generator', url: '/free-tools/lorem-ipsum-generator.html', icon: '\u{1F4DC}', keywords: ['lorem', 'ipsum', 'placeholder', 'text'] },
    { type: 'tool', label: 'UUID Generator', url: '/free-tools/uuid-generator.html', icon: '\u{1F194}', keywords: ['uuid', 'guid', 'unique', 'id'] },
    { type: 'tool', label: 'Hash Generator', url: '/free-tools/hash-generator.html', icon: '\u{1F512}', keywords: ['hash', 'md5', 'sha', 'sha256'] },
    { type: 'tool', label: 'CSS Minifier', url: '/free-tools/css-minifier.html', icon: '\u2702\uFE0F', keywords: ['css', 'minify', 'compress'] },
    { type: 'tool', label: 'JavaScript Minifier', url: '/free-tools/javascript-minifier.html', icon: '\u2702\uFE0F', keywords: ['js', 'javascript', 'minify'] },
    { type: 'tool', label: 'HTML Minifier', url: '/free-tools/html-minifier.html', icon: '\u2702\uFE0F', keywords: ['html', 'minify'] },
    { type: 'tool', label: 'Word Counter', url: '/free-tools/word-counter.html', icon: '\u{1F522}', keywords: ['word', 'count', 'character'] },
    { type: 'tool', label: 'Image Compressor', url: '/free-tools/image-compressor.html', icon: '\u{1F5BC}\uFE0F', keywords: ['image', 'compress', 'optimize', 'jpg', 'png'] },
    { type: 'tool', label: 'QR Code Generator', url: '/free-tools/qr-code-generator.html', icon: '\u{1F4F1}', keywords: ['qr', 'code', 'generate'] },
    { type: 'tool', label: 'Password Generator', url: '/free-tools/password-generator.html', icon: '\u{1F511}', keywords: ['password', 'generate', 'secure', 'random'] },
    { type: 'tool', label: 'Diff Checker', url: '/free-tools/diff-checker.html', icon: '\u{1F504}', keywords: ['diff', 'compare', 'text'] },
    { type: 'tool', label: 'CSV to JSON', url: '/free-tools/csv-to-json.html', icon: '\u{1F4CA}', keywords: ['csv', 'json', 'convert'] },
    { type: 'tool', label: 'JSON to CSV', url: '/free-tools/json-to-csv.html', icon: '\u{1F4CA}', keywords: ['json', 'csv', 'convert'] },
    { type: 'tool', label: 'Timestamp Converter', url: '/free-tools/timestamp-converter.html', icon: '\u{1F552}', keywords: ['timestamp', 'unix', 'date', 'time'] },
    { type: 'tool', label: 'Cron Expression Parser', url: '/free-tools/cron-expression-parser.html', icon: '\u23F0', keywords: ['cron', 'schedule', 'expression'] },
    { type: 'tool', label: 'SQL Formatter', url: '/free-tools/sql-formatter.html', icon: '\u{1F5C3}\uFE0F', keywords: ['sql', 'format', 'query'] },
    { type: 'tool', label: 'JWT Decoder', url: '/free-tools/jwt-decoder.html', icon: '\u{1F513}', keywords: ['jwt', 'token', 'decode', 'json web token'] },
    { type: 'tool', label: 'Gradient Generator', url: '/free-tools/gradient-generator.html', icon: '\u{1F308}', keywords: ['gradient', 'css', 'color'] },
    { type: 'tool', label: 'Box Shadow Generator', url: '/free-tools/box-shadow-generator.html', icon: '\u{1F4A0}', keywords: ['shadow', 'box', 'css'] },
    { type: 'tool', label: 'Meta Tag Generator', url: '/free-tools/meta-tag-generator.html', icon: '\u{1F3F7}\uFE0F', keywords: ['meta', 'seo', 'tag'] },
    { type: 'tool', label: 'Favicon Generator', url: '/free-tools/favicon-generator.html', icon: '\u2B50', keywords: ['favicon', 'icon', 'generate'] },
    { type: 'tool', label: 'Text Case Converter', url: '/free-tools/text-case-converter.html', icon: '\u{1F524}', keywords: ['text', 'case', 'upper', 'lower', 'title'] },
    { type: 'tool', label: 'Slug Generator', url: '/free-tools/slug-generator.html', icon: '\u{1F517}', keywords: ['slug', 'url', 'generate'] },
    { type: 'tool', label: 'IP Lookup', url: '/free-tools/ip-lookup.html', icon: '\u{1F310}', keywords: ['ip', 'address', 'lookup', 'geo'] },
    { type: 'tool', label: 'Pomodoro Timer', url: '/free-tools/pomodoro-timer.html', icon: '\u{1F345}', keywords: ['pomodoro', 'timer', 'focus'] },
    { type: 'tool', label: 'Markdown to HTML', url: '/free-tools/markdown-to-html.html', icon: '\u{1F504}', keywords: ['markdown', 'html', 'convert'] },
    { type: 'tool', label: 'HTML to Markdown', url: '/free-tools/html-to-markdown.html', icon: '\u{1F504}', keywords: ['html', 'markdown', 'convert'] },
    { type: 'tool', label: 'Color Contrast Checker', url: '/free-tools/color-contrast-checker.html', icon: '\u2699\uFE0F', keywords: ['color', 'contrast', 'accessibility', 'wcag'] },
    { type: 'tool', label: 'SVG Optimizer', url: '/free-tools/svg-optimizer.html', icon: '\u2728', keywords: ['svg', 'optimize', 'vector'] },
    { type: 'tool', label: 'Emoji Picker', url: '/free-tools/emoji-picker.html', icon: '\u{1F60A}', keywords: ['emoji', 'pick', 'unicode'] },
    { type: 'tool', label: 'Unit Converter', url: '/free-tools/unit-converter.html', icon: '\u{1F4CF}', keywords: ['unit', 'convert', 'metric', 'imperial'] },
    { type: 'tool', label: 'Loan Calculator', url: '/free-tools/loan-calculator.html', icon: '\u{1F3E6}', keywords: ['loan', 'calculator', 'mortgage', 'interest'] },
    { type: 'tool', label: 'BMI Calculator', url: '/free-tools/bmi-calculator.html', icon: '\u2696\uFE0F', keywords: ['bmi', 'body', 'mass', 'health'] },
    { type: 'tool', label: 'Tip Calculator', url: '/free-tools/tip-calculator.html', icon: '\u{1F4B5}', keywords: ['tip', 'calculator', 'restaurant'] },
];

/* ===================================================================
   STATE
   =================================================================== */

let commands = [];
let paletteEl = null;
let inputEl = null;
let resultsEl = null;
let isOpen = false;
let selectedIndex = -1;
let flatResults = [];    // current flat list of visible results for keyboard nav
let recentSearches = [];
let boundKeydown = null;
let boundBackdropClick = null;

const RECENT_KEY = 'nt_palette_recent';
const MAX_RECENT = 5;
const MAX_PER_GROUP = 8;

/* ===================================================================
   FUZZY SEARCH
   =================================================================== */

/**
 * Simple fuzzy match.  Returns { match: true/false, score, indices }.
 * Score rewards: early match, consecutive chars, word-boundary matches.
 */
function fuzzyMatch(pattern, text) {
    const patternLower = pattern.toLowerCase();
    const textLower = text.toLowerCase();

    if (patternLower.length === 0) return { match: true, score: 0, indices: [] };
    if (patternLower.length > textLower.length) return { match: false, score: 0, indices: [] };

    // Quick substring check first
    if (textLower.includes(patternLower)) {
        const start = textLower.indexOf(patternLower);
        const indices = [];
        for (let i = start; i < start + patternLower.length; i++) indices.push(i);
        // Exact substring gets high score; earlier = higher
        const score = 1000 - start * 10 + patternLower.length * 20;
        return { match: true, score, indices };
    }

    // Character-by-character fuzzy
    let pi = 0;
    let score = 0;
    const indices = [];
    let lastMatchIndex = -2;
    let consecutiveBonus = 0;

    for (let ti = 0; ti < textLower.length && pi < patternLower.length; ti++) {
        if (textLower[ti] === patternLower[pi]) {
            indices.push(ti);

            // Consecutive bonus
            if (ti === lastMatchIndex + 1) {
                consecutiveBonus += 8;
                score += consecutiveBonus;
            } else {
                consecutiveBonus = 0;
            }

            // Word-boundary bonus (start of word)
            if (ti === 0 || textLower[ti - 1] === ' ' || textLower[ti - 1] === '-' || textLower[ti - 1] === '_') {
                score += 20;
            }

            // Early-match bonus
            score += Math.max(0, 15 - ti);

            lastMatchIndex = ti;
            pi++;
        }
    }

    if (pi !== patternLower.length) {
        return { match: false, score: 0, indices: [] };
    }

    return { match: true, score, indices };
}

/**
 * Search across all registered commands.
 * Returns groups of scored results.
 */
function search(query) {
    if (!query.trim()) {
        // Show recent searches + top items
        return buildDefaultResults();
    }

    const scored = [];

    for (const cmd of commands) {
        // Match against label
        const labelResult = fuzzyMatch(query, cmd.label);
        let bestScore = labelResult.match ? labelResult.score : -1;
        let bestIndices = labelResult.indices;

        // Match against keywords
        if (cmd.keywords) {
            for (const kw of cmd.keywords) {
                const kwResult = fuzzyMatch(query, kw);
                if (kwResult.match && kwResult.score > bestScore) {
                    bestScore = kwResult.score;
                    // Map keyword indices back to label match for highlighting
                    bestIndices = labelResult.match ? labelResult.indices : [];
                }
            }
        }

        if (bestScore >= 0) {
            scored.push({ ...cmd, score: bestScore, matchIndices: bestIndices });
        }
    }

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Group by type
    const groups = {};
    const groupOrder = ['action', 'page', 'tool'];
    const groupLabels = { action: 'Actions', page: 'Pages', tool: 'Tools' };

    for (const item of scored) {
        if (!groups[item.type]) groups[item.type] = [];
        if (groups[item.type].length < MAX_PER_GROUP) {
            groups[item.type].push(item);
        }
    }

    return groupOrder
        .filter(type => groups[type] && groups[type].length > 0)
        .map(type => ({
            label: groupLabels[type],
            items: groups[type]
        }));
}

/**
 * Default results when query is empty: recent searches + popular items.
 */
function buildDefaultResults() {
    const groups = [];

    if (recentSearches.length > 0) {
        groups.push({
            label: 'Recent',
            items: recentSearches.map(r => ({
                ...r,
                matchIndices: [],
                score: 0
            }))
        });
    }

    groups.push({
        label: 'Pages',
        items: PAGE_COMMANDS.slice(0, 5).map(c => ({ ...c, matchIndices: [], score: 0 }))
    });

    groups.push({
        label: 'Actions',
        items: ACTION_COMMANDS.slice(0, 4).map(c => ({ ...c, matchIndices: [], score: 0 }))
    });

    return groups;
}

/* ===================================================================
   LOCAL STORAGE — recent searches
   =================================================================== */

function loadRecent() {
    try {
        const raw = localStorage.getItem(RECENT_KEY);
        if (raw) recentSearches = JSON.parse(raw).slice(0, MAX_RECENT);
    } catch (_) {
        recentSearches = [];
    }
}

function saveRecent(cmd) {
    // Remove duplicate
    recentSearches = recentSearches.filter(r => r.label !== cmd.label);
    recentSearches.unshift({ type: cmd.type, label: cmd.label, url: cmd.url, action: cmd.action, icon: cmd.icon, keywords: cmd.keywords || [] });
    recentSearches = recentSearches.slice(0, MAX_RECENT);
    try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(recentSearches));
    } catch (_) { /* quota exceeded — ignore */ }
}

/* ===================================================================
   DOM — build, render
   =================================================================== */

function createPaletteDOM() {
    if (document.getElementById('command-palette')) {
        paletteEl = document.getElementById('command-palette');
        inputEl = paletteEl.querySelector('.nt-palette__input');
        resultsEl = paletteEl.querySelector('.nt-palette__results');
        return;
    }

    paletteEl = document.createElement('div');
    paletteEl.id = 'command-palette';
    paletteEl.setAttribute('role', 'dialog');
    paletteEl.setAttribute('aria-label', 'Command Palette');
    paletteEl.setAttribute('aria-modal', 'true');
    paletteEl.style.display = 'none';

    paletteEl.innerHTML = `
        <div class="nt-palette__backdrop"></div>
        <div class="nt-palette__modal">
            <div class="nt-palette__header">
                <svg class="nt-palette__search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                    type="text"
                    class="nt-palette__input"
                    placeholder="Search pages, tools, actions..."
                    autocomplete="off"
                    spellcheck="false"
                />
                <span class="nt-palette__shortcut">ESC</span>
            </div>
            <div class="nt-palette__results" role="listbox"></div>
            <div class="nt-palette__footer">
                <span class="nt-palette__hint"><kbd>&uarr;</kbd><kbd>&darr;</kbd> navigate</span>
                <span class="nt-palette__hint"><kbd>&crarr;</kbd> select</span>
                <span class="nt-palette__hint"><kbd>esc</kbd> close</span>
            </div>
        </div>
    `;

    document.body.appendChild(paletteEl);
    inputEl = paletteEl.querySelector('.nt-palette__input');
    resultsEl = paletteEl.querySelector('.nt-palette__results');
}

function injectStyles() {
    if (document.getElementById('nt-palette-styles')) return;
    const style = document.createElement('style');
    style.id = 'nt-palette-styles';
    style.textContent = `
        #command-palette { position:fixed; inset:0; z-index:99999; display:none; }
        #command-palette.nt-palette--open { display:flex; align-items:flex-start; justify-content:center; padding-top:min(20vh, 160px); }

        .nt-palette__backdrop {
            position:absolute; inset:0;
            background:rgba(0,0,0,0.55); backdrop-filter:blur(6px);
            opacity:0; transition:opacity .2s ease;
        }
        #command-palette.nt-palette--open .nt-palette__backdrop { opacity:1; }

        .nt-palette__modal {
            position:relative; width:100%; max-width:640px;
            background:var(--nt-bg-card, #1a1a2e); border:1px solid rgba(255,255,255,.1);
            border-radius:16px; overflow:hidden;
            box-shadow:0 25px 60px rgba(0,0,0,.5);
            transform:scale(.96) translateY(-10px); opacity:0;
            transition:transform .25s cubic-bezier(.34,1.56,.64,1), opacity .2s ease;
        }
        #command-palette.nt-palette--open .nt-palette__modal { transform:scale(1) translateY(0); opacity:1; }

        .nt-palette__header {
            display:flex; align-items:center; gap:10px;
            padding:14px 18px; border-bottom:1px solid rgba(255,255,255,.07);
        }
        .nt-palette__search-icon { color:rgba(255,255,255,.4); flex-shrink:0; }

        .nt-palette__input {
            flex:1; background:none; border:none; outline:none;
            font-size:16px; color:#fff; font-family:inherit;
        }
        .nt-palette__input::placeholder { color:rgba(255,255,255,.35); }

        .nt-palette__shortcut {
            font-size:11px; padding:3px 8px; border-radius:6px;
            background:rgba(255,255,255,.08); color:rgba(255,255,255,.4);
            font-family:var(--nt-font-mono, monospace);
        }

        .nt-palette__results {
            max-height:380px; overflow-y:auto; padding:8px 0;
            scrollbar-width:thin; scrollbar-color:rgba(255,255,255,.1) transparent;
        }

        .nt-palette__group-label {
            font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.08em;
            color:rgba(255,255,255,.35); padding:8px 18px 4px;
        }

        .nt-palette__result {
            display:flex; align-items:center; gap:12px;
            padding:10px 18px; cursor:pointer; transition:background .12s;
        }
        .nt-palette__result:hover,
        .nt-palette__result.nt-palette__result--selected {
            background:rgba(255,255,255,.06);
        }

        .nt-palette__result-icon { font-size:18px; width:28px; text-align:center; flex-shrink:0; }
        .nt-palette__result-label { flex:1; font-size:14px; color:rgba(255,255,255,.88); }
        .nt-palette__result-label mark { background:none; color:var(--nt-primary, #00d4ff); font-weight:600; }
        .nt-palette__result-type {
            font-size:11px; color:rgba(255,255,255,.3);
            text-transform:uppercase; letter-spacing:.05em;
        }

        .nt-palette__empty {
            text-align:center; padding:32px 18px; color:rgba(255,255,255,.35);
            font-size:14px;
        }
        .nt-palette__empty-icon { font-size:32px; margin-bottom:8px; display:block; }

        .nt-palette__footer {
            display:flex; gap:16px; padding:10px 18px;
            border-top:1px solid rgba(255,255,255,.07);
        }
        .nt-palette__hint { font-size:11px; color:rgba(255,255,255,.3); }
        .nt-palette__hint kbd {
            display:inline-block; padding:1px 5px; border-radius:4px;
            background:rgba(255,255,255,.08); font-family:inherit; font-size:10px;
            margin:0 2px;
        }

        @media (max-width:700px) {
            #command-palette.nt-palette--open { padding-top:10px; align-items:flex-start; }
            .nt-palette__modal { max-width:calc(100% - 20px); border-radius:12px; }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Render search results into the results container.
 */
function renderResults(groups) {
    flatResults = [];
    selectedIndex = -1;

    if (!groups || groups.length === 0) {
        resultsEl.innerHTML = `
            <div class="nt-palette__empty">
                <span class="nt-palette__empty-icon">\u{1F50D}</span>
                No results found. Try a different search.
            </div>`;
        return;
    }

    let html = '';

    for (const group of groups) {
        html += `<div class="nt-palette__group">`;
        html += `<div class="nt-palette__group-label">${escapeHtml(group.label)}</div>`;

        for (const item of group.items) {
            const idx = flatResults.length;
            flatResults.push(item);

            const labelHtml = highlightMatches(item.label, item.matchIndices || []);
            html += `
                <div class="nt-palette__result" data-index="${idx}" role="option" aria-selected="false">
                    <span class="nt-palette__result-icon">${item.icon || ''}</span>
                    <span class="nt-palette__result-label">${labelHtml}</span>
                    <span class="nt-palette__result-type">${escapeHtml(item.type)}</span>
                </div>`;
        }

        html += `</div>`;
    }

    resultsEl.innerHTML = html;

    // Bind click handlers
    resultsEl.querySelectorAll('.nt-palette__result').forEach(el => {
        el.addEventListener('click', () => {
            const i = parseInt(el.dataset.index, 10);
            if (flatResults[i]) executeResult(flatResults[i]);
        });
    });
}

/**
 * Highlight matched character indices with <mark>.
 */
function highlightMatches(text, indices) {
    if (!indices || indices.length === 0) return escapeHtml(text);

    const set = new Set(indices);
    let html = '';
    let inMark = false;

    for (let i = 0; i < text.length; i++) {
        const ch = escapeHtml(text[i]);
        if (set.has(i)) {
            if (!inMark) { html += '<mark>'; inMark = true; }
            html += ch;
        } else {
            if (inMark) { html += '</mark>'; inMark = false; }
            html += ch;
        }
    }
    if (inMark) html += '</mark>';

    return html;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/* ===================================================================
   KEYBOARD NAVIGATION
   =================================================================== */

function updateSelection(newIndex) {
    if (flatResults.length === 0) return;

    // Clamp
    if (newIndex < 0) newIndex = flatResults.length - 1;
    if (newIndex >= flatResults.length) newIndex = 0;

    // Deselect old
    const oldEl = resultsEl.querySelector('.nt-palette__result--selected');
    if (oldEl) {
        oldEl.classList.remove('nt-palette__result--selected');
        oldEl.setAttribute('aria-selected', 'false');
    }

    selectedIndex = newIndex;

    const el = resultsEl.querySelector(`[data-index="${selectedIndex}"]`);
    if (el) {
        el.classList.add('nt-palette__result--selected');
        el.setAttribute('aria-selected', 'true');
        el.scrollIntoView({ block: 'nearest' });
    }
}

/* ===================================================================
   ACTION EXECUTION
   =================================================================== */

function executeResult(item) {
    saveRecent(item);
    close();

    if (item.type === 'action') {
        executeAction(item.action);
    } else if (item.url) {
        window.location.href = item.url;
    }
}

function executeAction(actionName) {
    switch (actionName) {
        case 'toggleTheme': {
            document.documentElement.classList.toggle('nt-light-theme');
            const isLight = document.documentElement.classList.contains('nt-light-theme');
            try { localStorage.setItem('nt_theme', isLight ? 'light' : 'dark'); } catch (_) {}
            break;
        }
        case 'openContact': {
            const contactSection = document.getElementById('contact') || document.querySelector('[data-section="contact"]');
            if (contactSection) {
                contactSection.scrollIntoView({ behavior: 'smooth' });
            } else {
                window.location.href = '/contact.html';
            }
            break;
        }
        case 'openQuote': {
            const pricingSection = document.getElementById('pricing-section') || document.getElementById('pricing');
            if (pricingSection) {
                pricingSection.scrollIntoView({ behavior: 'smooth' });
            } else {
                window.location.href = '/pricing.html';
            }
            break;
        }
        case 'scrollTop':
            window.scrollTo({ top: 0, behavior: 'smooth' });
            break;
        case 'openGitHub':
            window.open('https://github.com/nextool', '_blank');
            break;
        default:
            console.warn('[CommandPalette] Unknown action:', actionName);
    }
}

/* ===================================================================
   OPEN / CLOSE
   =================================================================== */

export function open() {
    if (isOpen) return;
    isOpen = true;

    createPaletteDOM();
    paletteEl.style.display = '';
    // Force reflow before adding class for animation
    void paletteEl.offsetHeight;
    paletteEl.classList.add('nt-palette--open');
    document.body.style.overflow = 'hidden';

    inputEl.value = '';
    renderResults(search(''));
    inputEl.focus();
}

export function close() {
    if (!isOpen) return;
    isOpen = false;

    paletteEl.classList.remove('nt-palette--open');
    document.body.style.overflow = '';

    // Wait for transition then hide
    setTimeout(() => {
        if (!isOpen && paletteEl) paletteEl.style.display = 'none';
    }, 280);
}

/* ===================================================================
   REGISTER CUSTOM COMMANDS
   =================================================================== */

/**
 * Add a command to the registry at runtime.
 * @param {Object} command — { type, label, url?, action?, icon?, keywords? }
 */
export function registerCommand(command) {
    if (!command || !command.label) return;
    commands.push(command);
}

/* ===================================================================
   INIT / DESTROY
   =================================================================== */

export function init() {
    // Load recent searches from localStorage
    loadRecent();

    // Build command registry
    commands = [...PAGE_COMMANDS, ...ACTION_COMMANDS, ...TOOL_COMMANDS];

    // Inject styles
    injectStyles();

    // Create DOM
    createPaletteDOM();

    // Input handler
    inputEl.addEventListener('input', () => {
        const query = inputEl.value.trim();
        const groups = search(query);
        renderResults(groups);
    });

    // Global keyboard shortcut
    boundKeydown = function onKeydown(e) {
        // Cmd+K / Ctrl+K to open
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            if (isOpen) {
                close();
            } else {
                open();
            }
            return;
        }

        if (!isOpen) return;

        switch (e.key) {
            case 'Escape':
                e.preventDefault();
                close();
                break;
            case 'ArrowDown':
                e.preventDefault();
                updateSelection(selectedIndex + 1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                updateSelection(selectedIndex - 1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && flatResults[selectedIndex]) {
                    executeResult(flatResults[selectedIndex]);
                }
                break;
            case 'Tab':
                // Tab also cycles (like VS Code)
                e.preventDefault();
                if (e.shiftKey) {
                    updateSelection(selectedIndex - 1);
                } else {
                    updateSelection(selectedIndex + 1);
                }
                break;
        }
    };
    document.addEventListener('keydown', boundKeydown);

    // Backdrop click to close
    boundBackdropClick = function onBackdropClick(e) {
        if (e.target.classList.contains('nt-palette__backdrop')) {
            close();
        }
    };
    paletteEl.addEventListener('click', boundBackdropClick);
}

export function destroy() {
    if (boundKeydown) {
        document.removeEventListener('keydown', boundKeydown);
        boundKeydown = null;
    }
    if (paletteEl && boundBackdropClick) {
        paletteEl.removeEventListener('click', boundBackdropClick);
        boundBackdropClick = null;
    }
    if (paletteEl && paletteEl.parentNode) {
        paletteEl.parentNode.removeChild(paletteEl);
        paletteEl = null;
    }
    const styleEl = document.getElementById('nt-palette-styles');
    if (styleEl) styleEl.remove();

    inputEl = null;
    resultsEl = null;
    isOpen = false;
    selectedIndex = -1;
    flatResults = [];
    commands = [];
}
