/**
 * NexTool Live Build Demo
 * -----------------------------------------------------------------------
 * Simulated live demo showing NexTool "building" a website in real-time.
 * Split view: terminal (left) + preview (right).
 * Auto-plays on scroll via IntersectionObserver. Three demo templates.
 *
 * @module features/live-build-demo
 * @exports init, destroy, play, pause, reset
 */

/* ===================================================================
   DEMO TEMPLATES
   =================================================================== */

const TEMPLATES = {
    restaurant: {
        name: 'La Cucina Restaurant',
        command: 'nextool create restaurant-website --style modern --features "menu,reservations,gallery"',
        steps: [
            {
                output: [
                    { text: '\u{1F50D} Analyzing requirements...', color: 'cyan', delay: 600 },
                    { text: '   Industry: Restaurant & Dining', color: 'dim', delay: 300 },
                    { text: '   Style: Modern, warm palette', color: 'dim', delay: 300 },
                    { text: '   Features: Menu, Reservations, Gallery', color: 'dim', delay: 300 },
                ],
                preview: 'skeleton',
                previewLabel: 'Generating layout...',
            },
            {
                output: [
                    { text: '\u{1F4D0} Generating layout...', color: 'cyan', delay: 400 },
                    { text: '', type: 'progress', duration: 1800, label: 'Layout' },
                    { text: '   \u2713 Navigation with logo', color: 'green', delay: 200 },
                    { text: '   \u2713 Hero section with CTA', color: 'green', delay: 200 },
                    { text: '   \u2713 Menu grid (3 categories)', color: 'green', delay: 200 },
                    { text: '   \u2713 Reservation form', color: 'green', delay: 200 },
                    { text: '   \u2713 Gallery masonry', color: 'green', delay: 200 },
                    { text: '   \u2713 Footer with map', color: 'green', delay: 200 },
                ],
                preview: 'layout',
                previewLabel: 'Layout complete',
            },
            {
                output: [
                    { text: '\u{1F3A8} Applying brand colors...', color: 'cyan', delay: 400 },
                    { text: '   Primary: #D4A574 (Warm Gold)', color: 'dim', delay: 300 },
                    { text: '   Secondary: #2C1810 (Rich Brown)', color: 'dim', delay: 300 },
                    { text: '   Accent: #E8D5B7 (Cream)', color: 'dim', delay: 300 },
                    { text: '   \u2713 Color system applied', color: 'green', delay: 400 },
                ],
                preview: 'colors',
                previewLabel: 'Colors applied',
            },
            {
                output: [
                    { text: '\u{1F4DD} Writing content with AI...', color: 'cyan', delay: 400 },
                    { text: '', type: 'progress', duration: 1400, label: 'Content' },
                    { text: '   \u2713 Headlines & descriptions', color: 'green', delay: 200 },
                    { text: '   \u2713 Menu items with prices', color: 'green', delay: 200 },
                    { text: '   \u2713 About section story', color: 'green', delay: 200 },
                ],
                preview: 'content',
                previewLabel: 'Content written',
            },
            {
                output: [
                    { text: '\u{1F4F1} Optimizing for mobile...', color: 'cyan', delay: 400 },
                    { text: '   \u2713 Responsive breakpoints (4)', color: 'green', delay: 300 },
                    { text: '   \u2713 Touch-friendly navigation', color: 'green', delay: 300 },
                    { text: '   \u2713 Image lazy loading', color: 'green', delay: 300 },
                ],
                preview: 'mobile',
                previewLabel: 'Mobile optimized',
            },
            {
                output: [
                    { text: '\u26A1 Running Lighthouse audit...', color: 'cyan', delay: 400 },
                    { text: '', type: 'progress', duration: 1200, label: 'Audit' },
                    { text: '   Performance:  100 / 100 \u2713', color: 'green', delay: 300 },
                    { text: '   Accessibility: 100 / 100 \u2713', color: 'green', delay: 300 },
                    { text: '   Best Practices: 100 / 100 \u2713', color: 'green', delay: 300 },
                    { text: '   SEO:           100 / 100 \u2713', color: 'green', delay: 300 },
                ],
                preview: 'lighthouse',
                previewLabel: 'Perfect scores',
            },
            {
                output: [
                    { text: '', color: 'white', delay: 100 },
                    { text: '\u2705 Website ready! Preview \u2192', color: 'brightgreen', delay: 0 },
                ],
                preview: 'complete',
                previewLabel: 'Ready to launch!',
            },
        ],
        previewColors: { primary: '#D4A574', secondary: '#2C1810', accent: '#E8D5B7', bg: '#FFF8F0' },
    },

    freelancer: {
        name: 'Alex Portfolio',
        command: 'nextool create portfolio-site --style minimal --features "projects,blog,contact"',
        steps: [
            {
                output: [
                    { text: '\u{1F50D} Analyzing requirements...', color: 'cyan', delay: 600 },
                    { text: '   Industry: Freelancer Portfolio', color: 'dim', delay: 300 },
                    { text: '   Style: Minimal, monochrome', color: 'dim', delay: 300 },
                ],
                preview: 'skeleton',
                previewLabel: 'Analyzing...',
            },
            {
                output: [
                    { text: '\u{1F4D0} Generating layout...', color: 'cyan', delay: 400 },
                    { text: '', type: 'progress', duration: 1600, label: 'Layout' },
                    { text: '   \u2713 Sticky header', color: 'green', delay: 200 },
                    { text: '   \u2713 Hero with tagline', color: 'green', delay: 200 },
                    { text: '   \u2713 Project showcase grid', color: 'green', delay: 200 },
                    { text: '   \u2713 Skills section', color: 'green', delay: 200 },
                    { text: '   \u2713 Contact CTA', color: 'green', delay: 200 },
                ],
                preview: 'layout',
                previewLabel: 'Layout built',
            },
            {
                output: [
                    { text: '\u{1F3A8} Applying brand colors...', color: 'cyan', delay: 400 },
                    { text: '   Primary: #6C63FF (Electric Purple)', color: 'dim', delay: 300 },
                    { text: '   Background: #0D0D0D (Near Black)', color: 'dim', delay: 300 },
                    { text: '   Text: #F0F0F0 (Off White)', color: 'dim', delay: 300 },
                    { text: '   \u2713 Dark theme applied', color: 'green', delay: 400 },
                ],
                preview: 'colors',
                previewLabel: 'Styled',
            },
            {
                output: [
                    { text: '\u{1F4DD} Writing content with AI...', color: 'cyan', delay: 400 },
                    { text: '', type: 'progress', duration: 1200, label: 'Content' },
                    { text: '   \u2713 Bio & introduction', color: 'green', delay: 200 },
                    { text: '   \u2713 Project case studies', color: 'green', delay: 200 },
                ],
                preview: 'content',
                previewLabel: 'Content ready',
            },
            {
                output: [
                    { text: '\u{1F4F1} Optimizing for mobile...', color: 'cyan', delay: 400 },
                    { text: '   \u2713 Responsive grid', color: 'green', delay: 300 },
                    { text: '   \u2713 Mobile navigation', color: 'green', delay: 300 },
                ],
                preview: 'mobile',
                previewLabel: 'Mobile ready',
            },
            {
                output: [
                    { text: '\u26A1 Running Lighthouse audit...', color: 'cyan', delay: 400 },
                    { text: '', type: 'progress', duration: 1000, label: 'Audit' },
                    { text: '   Score: 100/100/100/100 \u2713', color: 'green', delay: 400 },
                ],
                preview: 'lighthouse',
                previewLabel: 'All 100s',
            },
            {
                output: [
                    { text: '\u2705 Portfolio ready! Preview \u2192', color: 'brightgreen', delay: 0 },
                ],
                preview: 'complete',
                previewLabel: 'Launch ready!',
            },
        ],
        previewColors: { primary: '#6C63FF', secondary: '#0D0D0D', accent: '#A29BFE', bg: '#0D0D0D' },
    },

    startup: {
        name: 'FlowAI Landing Page',
        command: 'nextool create saas-landing --style bold --features "pricing,features,testimonials,cta"',
        steps: [
            {
                output: [
                    { text: '\u{1F50D} Analyzing requirements...', color: 'cyan', delay: 600 },
                    { text: '   Industry: SaaS Startup', color: 'dim', delay: 300 },
                    { text: '   Style: Bold, gradient-heavy', color: 'dim', delay: 300 },
                ],
                preview: 'skeleton',
                previewLabel: 'Scanning...',
            },
            {
                output: [
                    { text: '\u{1F4D0} Generating layout...', color: 'cyan', delay: 400 },
                    { text: '', type: 'progress', duration: 1800, label: 'Layout' },
                    { text: '   \u2713 Sticky nav + CTA button', color: 'green', delay: 200 },
                    { text: '   \u2713 Hero with animated bg', color: 'green', delay: 200 },
                    { text: '   \u2713 Features grid (6 cards)', color: 'green', delay: 200 },
                    { text: '   \u2713 Social proof section', color: 'green', delay: 200 },
                    { text: '   \u2713 Pricing table (3 tiers)', color: 'green', delay: 200 },
                    { text: '   \u2713 FAQ accordion', color: 'green', delay: 200 },
                    { text: '   \u2713 Final CTA banner', color: 'green', delay: 200 },
                ],
                preview: 'layout',
                previewLabel: 'Structure built',
            },
            {
                output: [
                    { text: '\u{1F3A8} Applying brand colors...', color: 'cyan', delay: 400 },
                    { text: '   Primary: #00D4FF (Electric Cyan)', color: 'dim', delay: 300 },
                    { text: '   Gradient: #7B61FF \u2192 #00D4FF', color: 'dim', delay: 300 },
                    { text: '   Background: #0A0A1A (Deep Space)', color: 'dim', delay: 300 },
                    { text: '   \u2713 Gradient system applied', color: 'green', delay: 400 },
                ],
                preview: 'colors',
                previewLabel: 'Branded',
            },
            {
                output: [
                    { text: '\u{1F4DD} Writing content with AI...', color: 'cyan', delay: 400 },
                    { text: '', type: 'progress', duration: 1400, label: 'Content' },
                    { text: '   \u2713 Headline & sub-headline', color: 'green', delay: 200 },
                    { text: '   \u2713 Feature descriptions', color: 'green', delay: 200 },
                    { text: '   \u2713 Testimonials (3)', color: 'green', delay: 200 },
                    { text: '   \u2713 FAQ content (6 items)', color: 'green', delay: 200 },
                ],
                preview: 'content',
                previewLabel: 'Copy done',
            },
            {
                output: [
                    { text: '\u{1F4F1} Optimizing for mobile...', color: 'cyan', delay: 400 },
                    { text: '   \u2713 Responsive at 5 breakpoints', color: 'green', delay: 300 },
                    { text: '   \u2713 Mobile-first CSS', color: 'green', delay: 300 },
                ],
                preview: 'mobile',
                previewLabel: 'Mobile-first',
            },
            {
                output: [
                    { text: '\u26A1 Running Lighthouse audit...', color: 'cyan', delay: 400 },
                    { text: '', type: 'progress', duration: 1200, label: 'Audit' },
                    { text: '   Performance:  100 / 100 \u2713', color: 'green', delay: 300 },
                    { text: '   Accessibility: 100 / 100 \u2713', color: 'green', delay: 300 },
                    { text: '   Best Practices: 100 / 100 \u2713', color: 'green', delay: 300 },
                    { text: '   SEO:           100 / 100 \u2713', color: 'green', delay: 300 },
                ],
                preview: 'lighthouse',
                previewLabel: 'Perfect 100s',
            },
            {
                output: [
                    { text: '\u2705 Landing page ready! Preview \u2192', color: 'brightgreen', delay: 0 },
                ],
                preview: 'complete',
                previewLabel: 'Ship it!',
            },
        ],
        previewColors: { primary: '#00D4FF', secondary: '#0A0A1A', accent: '#7B61FF', bg: '#0A0A1A' },
    },
};

/* ===================================================================
   STATE
   =================================================================== */

let terminalEl = null;
let previewEl = null;
let wrapperEl = null;
let controlsEl = null;
let observer = null;
let isPlaying = false;
let isPaused = false;
let currentTemplate = 'restaurant';
let abortController = null;
let hasPlayedOnce = false;
let terminalLines = [];

/* ===================================================================
   STYLES
   =================================================================== */

function injectStyles() {
    if (document.getElementById('nt-live-demo-styles')) return;
    const s = document.createElement('style');
    s.id = 'nt-live-demo-styles';
    s.textContent = `
        .nt-live-demo {
            display:grid; grid-template-columns:1fr 1fr; gap:0;
            border-radius:16px; overflow:hidden;
            border:1px solid rgba(255,255,255,.08);
            background:#0a0a1a; max-width:1100px; margin:0 auto;
            box-shadow:0 20px 60px rgba(0,0,0,.4);
        }
        @media(max-width:768px) { .nt-live-demo { grid-template-columns:1fr; } }

        /* Terminal */
        #build-terminal {
            background:#0d1117; padding:0; font-family:'SF Mono','Fira Code',monospace;
            font-size:13px; line-height:1.7; overflow:hidden; min-height:380px;
            display:flex; flex-direction:column;
        }
        .nt-term__titlebar {
            display:flex; align-items:center; gap:6px; padding:10px 14px;
            background:#161b22; border-bottom:1px solid rgba(255,255,255,.06);
        }
        .nt-term__dot { width:10px; height:10px; border-radius:50%; }
        .nt-term__dot--red { background:#ff5f56; }
        .nt-term__dot--yellow { background:#ffbd2e; }
        .nt-term__dot--green { background:#27c93f; }
        .nt-term__title {
            flex:1; text-align:center; font-size:11px;
            color:rgba(255,255,255,.3); font-family:inherit;
        }
        .nt-term__body { padding:12px 14px; overflow-y:auto; flex:1; }
        .nt-term__line { white-space:pre-wrap; word-break:break-all; }
        .nt-term__line--prompt { color:#27c93f; }
        .nt-term__line--command { color:#e6edf3; }
        .nt-term__line--cyan { color:#79c0ff; }
        .nt-term__line--dim { color:#8b949e; }
        .nt-term__line--green { color:#27c93f; }
        .nt-term__line--brightgreen { color:#3fb950; font-weight:700; }
        .nt-term__cursor {
            display:inline-block; width:8px; height:16px;
            background:#27c93f; animation:nt-blink 1s step-end infinite;
            vertical-align:text-bottom; margin-left:2px;
        }
        @keyframes nt-blink { 50% { opacity:0; } }

        .nt-term__progress { height:16px; display:flex; align-items:center; gap:8px; margin:4px 0; }
        .nt-term__progress-bar {
            flex:1; height:6px; background:rgba(255,255,255,.08); border-radius:3px; overflow:hidden;
        }
        .nt-term__progress-fill {
            height:100%; width:0%; background:linear-gradient(90deg,#00d4ff,#7b61ff);
            border-radius:3px; transition:width .1s linear;
        }
        .nt-term__progress-pct { font-size:11px; color:#8b949e; min-width:32px; text-align:right; }

        /* Preview */
        #build-preview {
            background:#f8f8f8; position:relative; overflow:hidden; min-height:380px;
            display:flex; align-items:center; justify-content:center;
        }
        .nt-preview__stage { width:100%; height:100%; position:relative; }
        .nt-preview__label {
            position:absolute; bottom:12px; left:50%; transform:translateX(-50%);
            font-size:11px; padding:4px 12px; border-radius:20px;
            background:rgba(0,0,0,.7); color:#fff; white-space:nowrap; z-index:5;
        }

        /* Preview states */
        .nt-preview__blank { background:#f0f0f0; width:100%; height:100%; }
        .nt-preview__skeleton { padding:20px; }
        .nt-preview__skel-bar {
            height:12px; border-radius:6px; background:#e0e0e0; margin:8px 0;
            animation:nt-skel-pulse 1.5s ease-in-out infinite;
        }
        .nt-preview__skel-bar--short { width:60%; }
        .nt-preview__skel-bar--medium { width:80%; }
        .nt-preview__skel-bar--long { width:100%; }
        .nt-preview__skel-block {
            height:60px; border-radius:8px; background:#e0e0e0; margin:12px 0;
            animation:nt-skel-pulse 1.5s ease-in-out infinite;
        }
        @keyframes nt-skel-pulse { 0%,100%{opacity:.6} 50%{opacity:1} }

        .nt-preview__site { padding:0; width:100%; height:100%; display:flex; flex-direction:column; }
        .nt-preview__nav {
            display:flex; align-items:center; justify-content:space-between;
            padding:8px 16px; transition:background .5s;
        }
        .nt-preview__nav-logo { font-weight:700; font-size:14px; }
        .nt-preview__nav-links { display:flex; gap:12px; font-size:11px; }
        .nt-preview__hero {
            flex:1; display:flex; flex-direction:column;
            align-items:center; justify-content:center; text-align:center;
            padding:20px; transition:all .5s;
        }
        .nt-preview__hero h2 { font-size:20px; margin:0 0 8px; opacity:0; transition:opacity .5s; }
        .nt-preview__hero p { font-size:12px; margin:0 0 12px; opacity:0; transition:opacity .5s .1s; }
        .nt-preview__hero-btn {
            display:inline-block; padding:6px 18px; border-radius:20px; font-size:11px;
            font-weight:600; opacity:0; transition:opacity .5s .2s; border:none; cursor:pointer;
        }
        .nt-preview__grid {
            display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px;
            padding:12px 16px; opacity:0; transition:opacity .5s;
        }
        .nt-preview__card {
            border-radius:8px; padding:10px; font-size:10px; text-align:center;
            transition:all .5s;
        }
        .nt-preview__footer {
            padding:8px 16px; text-align:center; font-size:10px;
            transition:all .5s; border-top:1px solid rgba(0,0,0,.06);
        }

        /* Lighthouse ring */
        .nt-preview__lighthouse {
            display:flex; gap:12px; align-items:center; justify-content:center;
            padding:20px; flex-wrap:wrap;
        }
        .nt-preview__lh-ring {
            width:64px; height:64px; position:relative;
        }
        .nt-preview__lh-ring svg { width:100%; height:100%; transform:rotate(-90deg); }
        .nt-preview__lh-ring circle {
            fill:none; stroke-width:4; stroke-linecap:round;
        }
        .nt-preview__lh-ring .nt-lh-bg { stroke:rgba(0,0,0,.1); }
        .nt-preview__lh-ring .nt-lh-fg {
            stroke:#27c93f; stroke-dasharray:176; stroke-dashoffset:176;
            transition:stroke-dashoffset 1.5s ease-out;
        }
        .nt-preview__lh-score {
            position:absolute; inset:0; display:flex; align-items:center;
            justify-content:center; font-size:16px; font-weight:700; color:#27c93f;
        }
        .nt-preview__lh-label { font-size:9px; text-align:center; color:#666; margin-top:4px; }

        /* Controls */
        .nt-live-demo__controls {
            display:flex; gap:8px; justify-content:center; margin-top:16px;
            flex-wrap:wrap; align-items:center;
        }
        .nt-live-demo__btn {
            padding:8px 18px; border-radius:8px; font-size:13px; font-weight:600;
            cursor:pointer; border:1px solid rgba(255,255,255,.12);
            background:rgba(255,255,255,.05); color:#fff; transition:all .2s;
        }
        .nt-live-demo__btn:hover { background:rgba(255,255,255,.1); }
        .nt-live-demo__btn--active {
            background:var(--nt-primary, #00d4ff); color:#000; border-color:transparent;
        }
    `;
    document.head.appendChild(s);
}

/* ===================================================================
   DOM CREATION
   =================================================================== */

function ensureDOM() {
    wrapperEl = document.querySelector('.nt-live-demo');
    if (!wrapperEl) return false;

    terminalEl = wrapperEl.querySelector('#build-terminal');
    previewEl = wrapperEl.querySelector('#build-preview');

    if (!terminalEl || !previewEl) return false;

    // Build terminal chrome if not present
    if (!terminalEl.querySelector('.nt-term__titlebar')) {
        terminalEl.innerHTML = `
            <div class="nt-term__titlebar">
                <span class="nt-term__dot nt-term__dot--red"></span>
                <span class="nt-term__dot nt-term__dot--yellow"></span>
                <span class="nt-term__dot nt-term__dot--green"></span>
                <span class="nt-term__title">nextool -- bash</span>
            </div>
            <div class="nt-term__body"></div>
        `;
    }

    // Build controls if not present
    controlsEl = wrapperEl.parentElement.querySelector('.nt-live-demo__controls');
    if (!controlsEl) {
        controlsEl = document.createElement('div');
        controlsEl.className = 'nt-live-demo__controls';
        controlsEl.innerHTML = `
            <button class="nt-live-demo__btn nt-live-demo__btn--active" data-template="restaurant">Restaurant</button>
            <button class="nt-live-demo__btn" data-template="freelancer">Portfolio</button>
            <button class="nt-live-demo__btn" data-template="startup">SaaS</button>
            <button class="nt-live-demo__btn" data-template="replay">\u{1F504} Replay</button>
        `;
        wrapperEl.parentElement.appendChild(controlsEl);
    }

    // Control button handlers
    controlsEl.querySelectorAll('[data-template]').forEach(btn => {
        btn.addEventListener('click', () => {
            const tpl = btn.dataset.template;
            if (tpl === 'replay') {
                play(currentTemplate);
            } else {
                // Update active button
                controlsEl.querySelectorAll('.nt-live-demo__btn').forEach(b => b.classList.remove('nt-live-demo__btn--active'));
                btn.classList.add('nt-live-demo__btn--active');
                play(tpl);
            }
        });
    });

    return true;
}

/* ===================================================================
   TERMINAL RENDERING
   =================================================================== */

function getTerminalBody() {
    return terminalEl.querySelector('.nt-term__body');
}

function clearTerminal() {
    const body = getTerminalBody();
    if (body) body.innerHTML = '';
    terminalLines = [];
}

function appendTerminalLine(text, colorClass) {
    const body = getTerminalBody();
    if (!body) return;

    const line = document.createElement('div');
    line.className = `nt-term__line nt-term__line--${colorClass}`;
    line.textContent = text;
    body.appendChild(line);
    terminalLines.push(line);
    body.scrollTop = body.scrollHeight;
    return line;
}

/**
 * Type out a command character by character.
 */
function typeCommand(text, signal) {
    return new Promise((resolve, reject) => {
        const body = getTerminalBody();
        if (!body) { resolve(); return; }

        const promptSpan = document.createElement('span');
        promptSpan.className = 'nt-term__line nt-term__line--prompt';
        promptSpan.textContent = '$ ';
        body.appendChild(promptSpan);

        const cmdSpan = document.createElement('span');
        cmdSpan.className = 'nt-term__line nt-term__line--command';
        body.appendChild(cmdSpan);

        const cursor = document.createElement('span');
        cursor.className = 'nt-term__cursor';
        body.appendChild(cursor);

        let i = 0;
        const speed = () => 30 + Math.random() * 40;

        function typeNext() {
            if (signal && signal.aborted) { reject(new DOMException('Aborted', 'AbortError')); return; }
            if (i >= text.length) {
                cursor.remove();
                body.appendChild(document.createElement('br'));
                body.scrollTop = body.scrollHeight;
                resolve();
                return;
            }
            cmdSpan.textContent += text[i];
            i++;
            body.scrollTop = body.scrollHeight;
            setTimeout(typeNext, speed());
        }
        typeNext();
    });
}

/**
 * Animate a progress bar in the terminal.
 */
function animateProgress(duration, label, signal) {
    return new Promise((resolve, reject) => {
        const body = getTerminalBody();
        if (!body) { resolve(); return; }

        const wrapper = document.createElement('div');
        wrapper.className = 'nt-term__progress';
        wrapper.innerHTML = `
            <span style="color:#8b949e;font-size:11px;">${label || ''}</span>
            <div class="nt-term__progress-bar"><div class="nt-term__progress-fill"></div></div>
            <span class="nt-term__progress-pct">0%</span>
        `;
        body.appendChild(wrapper);

        const fill = wrapper.querySelector('.nt-term__progress-fill');
        const pctEl = wrapper.querySelector('.nt-term__progress-pct');
        const startTime = performance.now();

        function tick(now) {
            if (signal && signal.aborted) { reject(new DOMException('Aborted', 'AbortError')); return; }
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / duration);
            const pct = Math.round(progress * 100);
            fill.style.width = pct + '%';
            pctEl.textContent = pct + '%';

            if (progress < 1) {
                requestAnimationFrame(tick);
            } else {
                body.scrollTop = body.scrollHeight;
                resolve();
            }
        }
        requestAnimationFrame(tick);
    });
}

function wait(ms, signal) {
    return new Promise((resolve, reject) => {
        if (signal && signal.aborted) { reject(new DOMException('Aborted', 'AbortError')); return; }
        const id = setTimeout(resolve, ms);
        if (signal) {
            signal.addEventListener('abort', () => { clearTimeout(id); reject(new DOMException('Aborted', 'AbortError')); }, { once: true });
        }
    });
}

/* ===================================================================
   PREVIEW RENDERING
   =================================================================== */

function clearPreview() {
    if (!previewEl) return;
    previewEl.innerHTML = '<div class="nt-preview__stage"><div class="nt-preview__blank"></div></div>';
}

function setPreviewState(state, template) {
    if (!previewEl) return;
    const tpl = TEMPLATES[template] || TEMPLATES.restaurant;
    const { primary, secondary, accent, bg } = tpl.previewColors;
    const stage = previewEl.querySelector('.nt-preview__stage') || previewEl;

    switch (state) {
        case 'skeleton':
            stage.innerHTML = `
                <div class="nt-preview__skeleton">
                    <div class="nt-preview__skel-bar nt-preview__skel-bar--medium"></div>
                    <div class="nt-preview__skel-block"></div>
                    <div class="nt-preview__skel-bar nt-preview__skel-bar--long"></div>
                    <div class="nt-preview__skel-bar nt-preview__skel-bar--short"></div>
                    <div class="nt-preview__skel-block"></div>
                    <div class="nt-preview__skel-bar nt-preview__skel-bar--medium"></div>
                    <div class="nt-preview__skel-bar nt-preview__skel-bar--long"></div>
                    <div class="nt-preview__skel-block"></div>
                </div>
                <div class="nt-preview__label">Generating structure...</div>
            `;
            break;

        case 'layout':
            stage.innerHTML = `
                <div class="nt-preview__site" style="background:#fff;">
                    <div class="nt-preview__nav" style="background:#f5f5f5;">
                        <div class="nt-preview__nav-logo" style="color:#333;">${tpl.name.split(' ')[0]}</div>
                        <div class="nt-preview__nav-links" style="color:#999;">
                            <span>Menu</span><span>About</span><span>Contact</span>
                        </div>
                    </div>
                    <div class="nt-preview__hero" style="background:#fafafa;">
                        <h2 style="color:#333;">Headline Here</h2>
                        <p style="color:#999;">Subheadline text goes here</p>
                        <button class="nt-preview__hero-btn" style="background:#ddd;color:#666;">CTA</button>
                    </div>
                    <div class="nt-preview__grid">
                        <div class="nt-preview__card" style="background:#f0f0f0;">Card 1</div>
                        <div class="nt-preview__card" style="background:#f0f0f0;">Card 2</div>
                        <div class="nt-preview__card" style="background:#f0f0f0;">Card 3</div>
                    </div>
                    <div class="nt-preview__footer" style="color:#999;">Footer</div>
                </div>
                <div class="nt-preview__label">Structure built</div>
            `;
            // Animate elements in
            setTimeout(() => {
                const h2 = stage.querySelector('h2'); if (h2) h2.style.opacity = '1';
                const p = stage.querySelector('p'); if (p) p.style.opacity = '1';
                const btn = stage.querySelector('.nt-preview__hero-btn'); if (btn) btn.style.opacity = '1';
                const grid = stage.querySelector('.nt-preview__grid'); if (grid) grid.style.opacity = '1';
            }, 100);
            break;

        case 'colors':
            stage.innerHTML = `
                <div class="nt-preview__site" style="background:${bg};">
                    <div class="nt-preview__nav" style="background:${secondary};">
                        <div class="nt-preview__nav-logo" style="color:${primary};">${tpl.name.split(' ')[0]}</div>
                        <div class="nt-preview__nav-links" style="color:rgba(255,255,255,.6);">
                            <span>Menu</span><span>About</span><span>Contact</span>
                        </div>
                    </div>
                    <div class="nt-preview__hero" style="background:${secondary};">
                        <h2 style="color:#fff;opacity:1;">${tpl.name}</h2>
                        <p style="color:rgba(255,255,255,.7);opacity:1;">Experience the difference</p>
                        <button class="nt-preview__hero-btn" style="background:${primary};color:${secondary};opacity:1;">Get Started</button>
                    </div>
                    <div class="nt-preview__grid" style="opacity:1;">
                        <div class="nt-preview__card" style="background:${accent}20;border:1px solid ${accent}40;">Feature 1</div>
                        <div class="nt-preview__card" style="background:${accent}20;border:1px solid ${accent}40;">Feature 2</div>
                        <div class="nt-preview__card" style="background:${accent}20;border:1px solid ${accent}40;">Feature 3</div>
                    </div>
                    <div class="nt-preview__footer" style="background:${secondary};color:rgba(255,255,255,.4);">&copy; ${tpl.name}</div>
                </div>
                <div class="nt-preview__label">Colors applied</div>
            `;
            break;

        case 'content':
            stage.innerHTML = `
                <div class="nt-preview__site" style="background:${bg};">
                    <div class="nt-preview__nav" style="background:${secondary};">
                        <div class="nt-preview__nav-logo" style="color:${primary};">${tpl.name.split(' ')[0]}</div>
                        <div class="nt-preview__nav-links" style="color:rgba(255,255,255,.6);">
                            <span>Menu</span><span>About</span><span>Contact</span>
                        </div>
                    </div>
                    <div class="nt-preview__hero" style="background:linear-gradient(135deg,${secondary},${accent}30);">
                        <h2 style="color:#fff;opacity:1;font-size:18px;">${tpl.name}</h2>
                        <p style="color:rgba(255,255,255,.7);opacity:1;font-size:11px;max-width:280px;">
                            Crafted with passion and powered by AI. Your perfect digital experience awaits.
                        </p>
                        <button class="nt-preview__hero-btn" style="background:${primary};color:${secondary};opacity:1;">Explore Now</button>
                    </div>
                    <div class="nt-preview__grid" style="opacity:1;">
                        <div class="nt-preview__card" style="background:${accent}15;border:1px solid ${accent}30;padding:12px;">
                            <strong style="font-size:11px;color:${primary};">Premium</strong>
                            <div style="font-size:9px;color:#888;margin-top:4px;">Top quality service</div>
                        </div>
                        <div class="nt-preview__card" style="background:${accent}15;border:1px solid ${accent}30;padding:12px;">
                            <strong style="font-size:11px;color:${primary};">Fast</strong>
                            <div style="font-size:9px;color:#888;margin-top:4px;">Lightning delivery</div>
                        </div>
                        <div class="nt-preview__card" style="background:${accent}15;border:1px solid ${accent}30;padding:12px;">
                            <strong style="font-size:11px;color:${primary};">Reliable</strong>
                            <div style="font-size:9px;color:#888;margin-top:4px;">Always available</div>
                        </div>
                    </div>
                    <div class="nt-preview__footer" style="background:${secondary};color:rgba(255,255,255,.4);">&copy; ${tpl.name} &bull; All rights reserved</div>
                </div>
                <div class="nt-preview__label">Content written</div>
            `;
            break;

        case 'mobile':
            // Show the same site but in a phone-shaped frame
            stage.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:20px;">
                    <div style="width:180px;height:320px;border:3px solid #333;border-radius:24px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,.2);position:relative;">
                        <div style="background:${secondary};padding:4px 8px;display:flex;justify-content:space-between;align-items:center;">
                            <span style="color:${primary};font-size:9px;font-weight:700;">${tpl.name.split(' ')[0]}</span>
                            <span style="color:rgba(255,255,255,.5);font-size:12px;">\u2630</span>
                        </div>
                        <div style="background:linear-gradient(135deg,${secondary},${accent}40);padding:20px 10px;text-align:center;">
                            <div style="color:#fff;font-size:11px;font-weight:700;">${tpl.name}</div>
                            <div style="color:rgba(255,255,255,.6);font-size:8px;margin:6px 0;">AI-powered excellence</div>
                            <div style="background:${primary};color:${secondary};font-size:8px;padding:4px 12px;border-radius:12px;display:inline-block;font-weight:600;">Get Started</div>
                        </div>
                        <div style="padding:8px;display:flex;flex-direction:column;gap:4px;background:${bg};">
                            <div style="background:${accent}20;border-radius:6px;padding:6px;font-size:8px;text-align:center;color:${primary};">Feature 1</div>
                            <div style="background:${accent}20;border-radius:6px;padding:6px;font-size:8px;text-align:center;color:${primary};">Feature 2</div>
                            <div style="background:${accent}20;border-radius:6px;padding:6px;font-size:8px;text-align:center;color:${primary};">Feature 3</div>
                        </div>
                    </div>
                </div>
                <div class="nt-preview__label">Fully responsive</div>
            `;
            break;

        case 'lighthouse': {
            const ringHtml = (label) => `
                <div style="text-align:center;">
                    <div class="nt-preview__lh-ring">
                        <svg viewBox="0 0 60 60"><circle class="nt-lh-bg" cx="30" cy="30" r="28"/><circle class="nt-lh-fg" cx="30" cy="30" r="28"/></svg>
                        <div class="nt-preview__lh-score">0</div>
                    </div>
                    <div class="nt-preview__lh-label">${label}</div>
                </div>`;

            stage.innerHTML = `
                <div class="nt-preview__lighthouse">
                    ${ringHtml('Performance')}
                    ${ringHtml('Accessibility')}
                    ${ringHtml('Best Practices')}
                    ${ringHtml('SEO')}
                </div>
                <div class="nt-preview__label">Lighthouse Audit</div>
            `;

            // Animate rings
            setTimeout(() => {
                stage.querySelectorAll('.nt-lh-fg').forEach(circle => {
                    circle.style.strokeDashoffset = '0';
                });
                stage.querySelectorAll('.nt-preview__lh-score').forEach(el => {
                    animateNumber(el, 0, 100, 1500);
                });
            }, 200);
            break;
        }

        case 'complete':
            // Show the final website with a success glow
            stage.innerHTML = `
                <div class="nt-preview__site" style="background:${bg};position:relative;">
                    <div style="position:absolute;inset:0;background:radial-gradient(circle at center,${primary}15,transparent 70%);pointer-events:none;"></div>
                    <div class="nt-preview__nav" style="background:${secondary};">
                        <div class="nt-preview__nav-logo" style="color:${primary};">${tpl.name.split(' ')[0]}</div>
                        <div class="nt-preview__nav-links" style="color:rgba(255,255,255,.6);">
                            <span>Menu</span><span>About</span><span>Contact</span>
                        </div>
                    </div>
                    <div class="nt-preview__hero" style="background:linear-gradient(135deg,${secondary},${accent}30);">
                        <h2 style="color:#fff;opacity:1;font-size:18px;">${tpl.name}</h2>
                        <p style="color:rgba(255,255,255,.7);opacity:1;font-size:11px;">Your website is ready to launch</p>
                        <button class="nt-preview__hero-btn" style="background:${primary};color:${secondary};opacity:1;">Visit Site \u2192</button>
                    </div>
                    <div class="nt-preview__grid" style="opacity:1;">
                        <div class="nt-preview__card" style="background:${accent}15;border:1px solid ${accent}30;padding:12px;">
                            <strong style="font-size:11px;color:${primary};">Premium</strong>
                        </div>
                        <div class="nt-preview__card" style="background:${accent}15;border:1px solid ${accent}30;padding:12px;">
                            <strong style="font-size:11px;color:${primary};">Fast</strong>
                        </div>
                        <div class="nt-preview__card" style="background:${accent}15;border:1px solid ${accent}30;padding:12px;">
                            <strong style="font-size:11px;color:${primary};">Reliable</strong>
                        </div>
                    </div>
                    <div class="nt-preview__footer" style="background:${secondary};color:rgba(255,255,255,.4);">&copy; ${tpl.name}</div>
                </div>
                <div class="nt-preview__label" style="background:rgba(39,201,63,.9);">Ready to launch!</div>
            `;
            break;

        default:
            clearPreview();
    }
}

/**
 * Animate a number from start to end in an element.
 */
function animateNumber(el, start, end, duration) {
    const startTime = performance.now();
    function tick(now) {
        const progress = Math.min(1, (now - startTime) / duration);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        const val = Math.round(start + (end - start) * eased);
        el.textContent = val;
        if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

/* ===================================================================
   PLAY / PAUSE / RESET
   =================================================================== */

export async function play(template = 'restaurant') {
    // Abort any existing playback
    if (abortController) abortController.abort();
    abortController = new AbortController();
    const signal = abortController.signal;

    currentTemplate = template;
    isPlaying = true;
    isPaused = false;
    hasPlayedOnce = true;

    const tpl = TEMPLATES[template];
    if (!tpl) {
        console.warn('[LiveBuildDemo] Unknown template:', template);
        return;
    }

    clearTerminal();
    clearPreview();

    try {
        // Type the main command
        await wait(400, signal);
        await typeCommand(tpl.command, signal);
        await wait(600, signal);

        // Process each step
        for (const step of tpl.steps) {
            if (signal.aborted) return;

            for (const line of step.output) {
                if (signal.aborted) return;

                if (line.type === 'progress') {
                    await animateProgress(line.duration, line.label, signal);
                } else {
                    if (line.delay > 0) await wait(line.delay, signal);
                    appendTerminalLine(line.text, line.color);
                }
            }

            // Update preview
            setPreviewState(step.preview, template);

            // Pause between steps
            await wait(500, signal);
        }

    } catch (err) {
        if (err.name === 'AbortError') return; // Normal abort, not an error
        console.error('[LiveBuildDemo]', err);
    }

    isPlaying = false;
}

export function pause() {
    if (abortController) abortController.abort();
    isPaused = true;
    isPlaying = false;
}

export function reset() {
    if (abortController) abortController.abort();
    isPlaying = false;
    isPaused = false;
    clearTerminal();
    clearPreview();
}

/* ===================================================================
   INIT / DESTROY
   =================================================================== */

export function init(options = {}) {
    injectStyles();
    if (!ensureDOM()) {
        // DOM not ready yet — nothing to do
        return;
    }

    // IntersectionObserver: auto-play when scrolled into view
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting && !isPlaying && !hasPlayedOnce && !prefersReduced) {
                play(currentTemplate);
            }
        }
    }, { threshold: 0.3 });

    observer.observe(wrapperEl);
}

export function destroy() {
    if (observer) { observer.disconnect(); observer = null; }
    if (abortController) { abortController.abort(); abortController = null; }
    isPlaying = false;
    isPaused = false;
    hasPlayedOnce = false;

    const styleEl = document.getElementById('nt-live-demo-styles');
    if (styleEl) styleEl.remove();
}
