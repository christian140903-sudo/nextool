/**
 * NexTool Smooth Scroll
 * -----------------------------------------------------------------------
 * Enhanced smooth scrolling for anchor links with custom easing,
 * fixed-nav offset, URL hash update, scroll progress indicator,
 * and keyboard section navigation.
 *
 * @module features/smooth-scroll
 * @exports init, destroy, scrollTo
 */

/* ===================================================================
   CONFIG DEFAULTS
   =================================================================== */

const DEFAULTS = {
    offset: 80,               // px offset for fixed navigation
    duration: 800,             // ms scroll duration
    easing: 'cubic-bezier',   // easing type
    showProgress: true,        // show progress bar at top
    keyboardNav: true,         // Page Up/Down scroll to sections
    updateHash: true,          // update URL hash on scroll
    sectionSelector: 'section[id], [data-section]',
};

/* ===================================================================
   STATE
   =================================================================== */

let config = { ...DEFAULTS };
let progressBar = null;
let clickHandler = null;
let scrollHandler = null;
let keydownHandler = null;
let isScrolling = false;

/* ===================================================================
   STYLES
   =================================================================== */

function injectStyles() {
    if (document.getElementById('nt-smooth-scroll-styles')) return;
    const s = document.createElement('style');
    s.id = 'nt-smooth-scroll-styles';
    s.textContent = `
        .nt-scroll-progress {
            position:fixed; top:0; left:0; z-index:99998;
            width:0%; height:3px;
            background:linear-gradient(90deg, var(--nt-primary, #00d4ff), var(--nt-accent, #7b61ff));
            transition:width .1s linear;
            pointer-events:none;
            border-radius:0 2px 2px 0;
        }
    `;
    document.head.appendChild(s);
}

/* ===================================================================
   EASING FUNCTIONS
   =================================================================== */

/**
 * Cubic bezier approximation for smooth scroll.
 * Parameters approximate a pleasant ease-in-out curve.
 */
function easeCubicBezier(t) {
    // Approximation of cubic-bezier(0.25, 0.1, 0.25, 1)
    // Using ease-in-out cubic as a reliable fallback
    if (t < 0.5) {
        return 4 * t * t * t;
    } else {
        return 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
}

/* ===================================================================
   SCROLL PROGRESS BAR
   =================================================================== */

function createProgressBar() {
    if (progressBar) return;
    progressBar = document.createElement('div');
    progressBar.className = 'nt-scroll-progress';
    progressBar.setAttribute('role', 'progressbar');
    progressBar.setAttribute('aria-label', 'Page scroll progress');
    document.body.appendChild(progressBar);
}

function updateProgressBar() {
    if (!progressBar) return;

    const scrollTop = window.scrollY || window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;

    if (docHeight <= 0) {
        progressBar.style.width = '0%';
        return;
    }

    const progress = Math.min(100, (scrollTop / docHeight) * 100);
    progressBar.style.width = progress.toFixed(1) + '%';
}

/* ===================================================================
   SMOOTH SCROLL IMPLEMENTATION
   =================================================================== */

/**
 * Smooth scroll to a target element or position.
 * @param {string|HTMLElement|number} target — CSS selector, element, or Y position.
 * @param {Object} [options] — Override offset, duration.
 * @returns {Promise} Resolves when scroll completes.
 */
export function scrollTo(target, options = {}) {
    return new Promise((resolve) => {
        const offset = options.offset !== undefined ? options.offset : config.offset;
        const duration = options.duration !== undefined ? options.duration : config.duration;

        let targetY;

        if (typeof target === 'number') {
            targetY = target;
        } else {
            const el = typeof target === 'string' ? document.querySelector(target) : target;
            if (!el) { resolve(); return; }
            const rect = el.getBoundingClientRect();
            targetY = rect.top + window.scrollY - offset;
        }

        // Clamp to document bounds
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        targetY = Math.max(0, Math.min(targetY, maxScroll));

        const startY = window.scrollY;
        const diff = targetY - startY;

        if (Math.abs(diff) < 2) { resolve(); return; }

        isScrolling = true;
        const startTime = performance.now();

        function tick(now) {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / duration);
            const eased = easeCubicBezier(progress);

            window.scrollTo(0, startY + diff * eased);

            if (progress < 1) {
                requestAnimationFrame(tick);
            } else {
                isScrolling = false;
                resolve();
            }
        }

        requestAnimationFrame(tick);
    });
}

/* ===================================================================
   ANCHOR LINK INTERCEPTION
   =================================================================== */

function setupAnchorInterception() {
    clickHandler = function onClick(e) {
        // Find the closest anchor
        const anchor = e.target.closest('a[href^="#"]');
        if (!anchor) return;

        const href = anchor.getAttribute('href');
        if (!href || href === '#' || href === '#!') return;

        const targetEl = document.querySelector(href);
        if (!targetEl) return;

        e.preventDefault();

        scrollTo(targetEl).then(() => {
            // Update URL hash without jumping
            if (config.updateHash) {
                history.pushState(null, '', href);
            }
        });
    };

    document.addEventListener('click', clickHandler);
}

/* ===================================================================
   KEYBOARD SECTION NAVIGATION
   =================================================================== */

function setupKeyboardNav() {
    if (!config.keyboardNav) return;

    const getSections = () => Array.from(document.querySelectorAll(config.sectionSelector));

    keydownHandler = function onKeydown(e) {
        // Only handle when not in an input/textarea
        if (e.target.matches('input, textarea, select, [contenteditable]')) return;

        let direction = 0;

        if (e.key === 'PageDown') {
            direction = 1;
        } else if (e.key === 'PageUp') {
            direction = -1;
        } else {
            return;
        }

        e.preventDefault();

        const sections = getSections();
        if (sections.length === 0) return;

        const scrollY = window.scrollY + config.offset + 10;

        // Find current section index
        let currentIdx = -1;
        for (let i = sections.length - 1; i >= 0; i--) {
            if (sections[i].offsetTop <= scrollY) {
                currentIdx = i;
                break;
            }
        }

        let nextIdx = currentIdx + direction;
        nextIdx = Math.max(0, Math.min(nextIdx, sections.length - 1));

        if (nextIdx !== currentIdx) {
            scrollTo(sections[nextIdx]);
            // Update hash
            const id = sections[nextIdx].id || sections[nextIdx].dataset.section;
            if (id && config.updateHash) {
                history.pushState(null, '', '#' + id);
            }
        }
    };

    document.addEventListener('keydown', keydownHandler);
}

/* ===================================================================
   INIT / DESTROY
   =================================================================== */

/**
 * Initialize smooth scroll.
 * @param {Object} [options] — Configuration overrides.
 */
export function init(options = {}) {
    config = { ...DEFAULTS, ...options };

    injectStyles();

    // Progress bar
    if (config.showProgress) {
        createProgressBar();
        scrollHandler = function onScroll() {
            updateProgressBar();
        };
        window.addEventListener('scroll', scrollHandler, { passive: true });
        updateProgressBar(); // Initial
    }

    // Anchor interception
    setupAnchorInterception();

    // Keyboard nav
    setupKeyboardNav();
}

export function destroy() {
    if (clickHandler) {
        document.removeEventListener('click', clickHandler);
        clickHandler = null;
    }
    if (scrollHandler) {
        window.removeEventListener('scroll', scrollHandler);
        scrollHandler = null;
    }
    if (keydownHandler) {
        document.removeEventListener('keydown', keydownHandler);
        keydownHandler = null;
    }
    if (progressBar && progressBar.parentNode) {
        progressBar.parentNode.removeChild(progressBar);
        progressBar = null;
    }

    isScrolling = false;
    config = { ...DEFAULTS };

    const styleEl = document.getElementById('nt-smooth-scroll-styles');
    if (styleEl) styleEl.remove();
}
