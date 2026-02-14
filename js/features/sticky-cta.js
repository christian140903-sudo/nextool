/**
 * NexTool Sticky CTA
 * -----------------------------------------------------------------------
 * Smart sticky CTA button that appears after scrolling past the hero.
 * Changes text based on current section context. Dismissable per session.
 * Full-width bar on mobile, floating button on desktop.
 *
 * @module features/sticky-cta
 * @exports init, destroy, show, hide
 */

/* ===================================================================
   SECTION CONTEXT MAP
   Defines which CTA text shows depending on the section in view.
   Keys are either section IDs or data-section attribute values.
   =================================================================== */

const SECTION_CTA = [
    { match: ['understanding', 'how-it-works', 'process'], text: 'See How It Works \u2192', target: '#how-it-works' },
    { match: ['proof', 'tools', 'free-tools', 'tool-map'], text: 'Explore 235+ Tools \u2192', target: '/free-tools/' },
    { match: ['personalize', 'customize', 'quiz'], text: 'Find Your Perfect Plan \u2192', target: '#pricing-section' },
    { match: ['pricing', 'pricing-section', 'plans'], text: 'Start Building Today \u2192', target: '#pricing-section' },
    { match: ['deep', 'features', 'details', 'testimonials'], text: 'Get Started \u2014 $49 \u2192', target: '#pricing-section' },
    { match: ['faq', 'contact', 'footer'], text: 'Start Your Project \u2192', target: '#pricing-section' },
];

const DEFAULT_CTA_TEXT = 'Start Building \u2192';
const DISMISS_KEY = 'nt_sticky_cta_dismissed';

/* ===================================================================
   STATE
   =================================================================== */

let ctaEl = null;
let isVisible = false;
let isDismissed = false;
let scrollHandler = null;
let resizeHandler = null;
let sectionObserver = null;
let currentText = DEFAULT_CTA_TEXT;

/* ===================================================================
   STYLES
   =================================================================== */

function injectStyles() {
    if (document.getElementById('nt-sticky-cta-styles')) return;
    const s = document.createElement('style');
    s.id = 'nt-sticky-cta-styles';
    s.textContent = `
        .nt-sticky-cta {
            position:fixed; z-index:9990;
            transition:transform .4s cubic-bezier(.34,1.56,.64,1), opacity .3s ease;
        }

        /* Desktop: floating button bottom-right */
        .nt-sticky-cta--desktop {
            bottom:28px; right:28px;
            transform:translateY(80px) scale(.9);
            opacity:0; pointer-events:none;
        }
        .nt-sticky-cta--desktop.nt-sticky-cta--visible {
            transform:translateY(0) scale(1);
            opacity:1; pointer-events:auto;
        }

        .nt-sticky-cta__btn {
            display:inline-flex; align-items:center; gap:8px;
            padding:14px 28px; border-radius:14px; border:none;
            background:var(--nt-primary, #00d4ff); color:#000;
            font-size:15px; font-weight:700; cursor:pointer;
            font-family:inherit; white-space:nowrap;
            box-shadow:0 8px 30px rgba(0,212,255,.25);
            transition:transform .2s, box-shadow .2s, background .2s;
            position:relative;
        }
        .nt-sticky-cta__btn:hover {
            transform:scale(1.04);
            box-shadow:0 12px 40px rgba(0,212,255,.35);
        }
        .nt-sticky-cta__btn:active { transform:scale(.98); }

        /* Pulsing glow */
        .nt-sticky-cta--visible .nt-sticky-cta__btn::before {
            content:''; position:absolute; inset:-3px; border-radius:17px;
            background:var(--nt-primary, #00d4ff);
            opacity:0; animation:nt-cta-pulse 2s ease-in-out infinite;
            z-index:-1;
        }
        @keyframes nt-cta-pulse {
            0%,100% { opacity:0; transform:scale(1); }
            50% { opacity:.15; transform:scale(1.04); }
        }

        /* Dismiss button */
        .nt-sticky-cta__dismiss {
            position:absolute; top:-8px; right:-8px;
            width:22px; height:22px; border-radius:50%;
            background:rgba(0,0,0,.7); border:1px solid rgba(255,255,255,.2);
            color:rgba(255,255,255,.6); font-size:12px; line-height:1;
            display:flex; align-items:center; justify-content:center;
            cursor:pointer; transition:all .2s;
        }
        .nt-sticky-cta__dismiss:hover {
            background:rgba(255,0,0,.6); color:#fff;
        }

        /* Mobile: full-width bar at bottom */
        .nt-sticky-cta--mobile {
            bottom:0; left:0; right:0;
            transform:translateY(100%); opacity:0; pointer-events:none;
            padding:0;
        }
        .nt-sticky-cta--mobile.nt-sticky-cta--visible {
            transform:translateY(0); opacity:1; pointer-events:auto;
        }
        .nt-sticky-cta--mobile .nt-sticky-cta__btn {
            width:100%; border-radius:0; padding:16px 20px;
            justify-content:center; font-size:16px;
            box-shadow:0 -4px 20px rgba(0,0,0,.3);
        }
        .nt-sticky-cta--mobile .nt-sticky-cta__dismiss {
            top:auto; bottom:auto; right:12px;
            position:absolute; top:50%; transform:translateY(-50%);
            width:24px; height:24px;
        }

        /* Reduced motion */
        @media(prefers-reduced-motion:reduce) {
            .nt-sticky-cta { transition:opacity .2s ease !important; }
            .nt-sticky-cta--visible .nt-sticky-cta__btn::before { animation:none; }
        }
    `;
    document.head.appendChild(s);
}

/* ===================================================================
   DOM
   =================================================================== */

function createCTA() {
    if (ctaEl) return;

    ctaEl = document.createElement('div');
    ctaEl.className = 'nt-sticky-cta';
    ctaEl.innerHTML = `
        <button class="nt-sticky-cta__btn" aria-label="Call to action">
            <span class="nt-sticky-cta__text">${currentText}</span>
        </button>
        <button class="nt-sticky-cta__dismiss" aria-label="Dismiss" title="Dismiss">&times;</button>
    `;

    document.body.appendChild(ctaEl);
    updateLayout();

    // Click handler — navigate to target
    ctaEl.querySelector('.nt-sticky-cta__btn').addEventListener('click', () => {
        // Find current section's target
        const sectionTarget = getCurrentTarget();
        if (sectionTarget.startsWith('#')) {
            const el = document.querySelector(sectionTarget);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }
        }
        window.location.href = sectionTarget;
    });

    // Dismiss handler
    ctaEl.querySelector('.nt-sticky-cta__dismiss').addEventListener('click', (e) => {
        e.stopPropagation();
        dismiss();
    });
}

function updateLayout() {
    if (!ctaEl) return;
    const isMobile = window.innerWidth < 768;
    ctaEl.classList.remove('nt-sticky-cta--desktop', 'nt-sticky-cta--mobile');
    ctaEl.classList.add(isMobile ? 'nt-sticky-cta--mobile' : 'nt-sticky-cta--desktop');
}

function updateText(text) {
    if (!ctaEl || text === currentText) return;
    currentText = text;
    const textEl = ctaEl.querySelector('.nt-sticky-cta__text');
    if (textEl) textEl.textContent = text;
}

function getCurrentTarget() {
    for (const section of SECTION_CTA) {
        if (section.text === currentText && section.target) {
            return section.target;
        }
    }
    return '#pricing-section';
}

/* ===================================================================
   SHOW / HIDE / DISMISS
   =================================================================== */

export function show() {
    if (!ctaEl || isDismissed) return;
    if (isVisible) return;
    isVisible = true;
    ctaEl.classList.add('nt-sticky-cta--visible');
}

export function hide() {
    if (!ctaEl) return;
    if (!isVisible) return;
    isVisible = false;
    ctaEl.classList.remove('nt-sticky-cta--visible');
}

function dismiss() {
    isDismissed = true;
    hide();
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch (_) {}
}

/* ===================================================================
   SCROLL / SECTION DETECTION
   =================================================================== */

function setupScrollDetection() {
    const heroThreshold = window.innerHeight * 0.8;

    scrollHandler = function onScroll() {
        if (isDismissed) return;

        const scrollY = window.scrollY || window.pageYOffset;

        if (scrollY > heroThreshold) {
            show();
        } else {
            hide();
        }
    };

    window.addEventListener('scroll', scrollHandler, { passive: true });
    // Initial check
    scrollHandler();
}

function setupSectionObserver() {
    // Find all sections on the page
    const sections = document.querySelectorAll('section[id], [data-section]');
    if (sections.length === 0) return;

    sectionObserver = new IntersectionObserver((entries) => {
        // Find the most visible section
        let bestEntry = null;
        let bestRatio = 0;

        for (const entry of entries) {
            if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
                bestRatio = entry.intersectionRatio;
                bestEntry = entry;
            }
        }

        if (bestEntry) {
            const sectionId = bestEntry.target.id || bestEntry.target.dataset.section || '';
            const match = findSectionCTA(sectionId);
            if (match) {
                updateText(match);
            }
        }
    }, {
        threshold: [0, 0.25, 0.5, 0.75],
        rootMargin: '-10% 0px -10% 0px',
    });

    sections.forEach(section => sectionObserver.observe(section));
}

/**
 * Find matching CTA text for a section.
 */
function findSectionCTA(sectionId) {
    const lower = sectionId.toLowerCase();
    for (const entry of SECTION_CTA) {
        for (const matchStr of entry.match) {
            if (lower.includes(matchStr)) {
                return entry.text;
            }
        }
    }
    return null;
}

/* ===================================================================
   INIT / DESTROY
   =================================================================== */

export function init() {
    // Check if dismissed this session
    try {
        if (sessionStorage.getItem(DISMISS_KEY) === '1') {
            isDismissed = true;
            return;
        }
    } catch (_) {}

    injectStyles();
    createCTA();
    setupScrollDetection();
    setupSectionObserver();

    // Resize handler for mobile/desktop switch
    resizeHandler = function onResize() {
        updateLayout();
    };
    window.addEventListener('resize', resizeHandler, { passive: true });
}

export function destroy() {
    if (scrollHandler) {
        window.removeEventListener('scroll', scrollHandler);
        scrollHandler = null;
    }
    if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
        resizeHandler = null;
    }
    if (sectionObserver) {
        sectionObserver.disconnect();
        sectionObserver = null;
    }
    if (ctaEl && ctaEl.parentNode) {
        ctaEl.parentNode.removeChild(ctaEl);
        ctaEl = null;
    }

    isVisible = false;
    isDismissed = false;
    currentText = DEFAULT_CTA_TEXT;

    const styleEl = document.getElementById('nt-sticky-cta-styles');
    if (styleEl) styleEl.remove();
}
