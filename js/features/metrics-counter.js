/**
 * NexTool Metrics Counter
 * -----------------------------------------------------------------------
 * Animated metric counters that count up when scrolled into view.
 * Reads target values from existing HTML data attributes (data-count-to,
 * data-suffix, data-prefix) — does NOT replace the DOM.
 *
 * Uses IntersectionObserver, ease-out cubic easing, stagger effect,
 * locale-aware number formatting, and decimal support.
 *
 * @module features/metrics-counter
 * @exports init, destroy, reset
 */

/* ===================================================================
   STATE
   =================================================================== */

let containerEl = null;
let observer = null;
let hasAnimated = false;
let numberEls = [];
let animationFrames = [];

/* ===================================================================
   ANIMATION
   =================================================================== */

/**
 * Ease-out cubic: decelerating to zero velocity.
 */
function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

/**
 * Format a number with locale-aware separators and optional decimals.
 */
function formatNumber(value, isDecimal) {
    if (isDecimal) {
        return value.toLocaleString('en-US', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
        });
    }
    return Math.round(value).toLocaleString('en-US');
}

/**
 * Build display string: prefix + number + suffix.
 */
function buildDisplay(prefix, formattedNumber, suffix) {
    return (prefix || '') + formattedNumber + (suffix || '');
}

/**
 * Animate all metric counters with stagger.
 */
function animateAll() {
    if (hasAnimated) return;
    hasAnimated = true;

    const duration = 2000; // ms

    numberEls.forEach((el, index) => {
        const target = parseFloat(el.dataset.countTo) || 0;
        const suffix = el.dataset.suffix || '';
        const prefix = el.dataset.prefix || '';
        const isDecimal = !Number.isInteger(target);
        const staggerDelay = index * 120; // 120ms between each

        // Fade in the parent card
        const card = el.closest('.nt-metric');
        if (card) {
            setTimeout(() => {
                card.style.transition = 'opacity .5s ease, transform .5s ease';
                card.classList.add('nt-metric--visible');
            }, staggerDelay);
        }

        // Count up number
        const startTime = performance.now() + staggerDelay;

        function tick(now) {
            const elapsed = now - startTime;
            if (elapsed < 0) {
                const frameId = requestAnimationFrame(tick);
                animationFrames.push(frameId);
                return;
            }

            const progress = Math.min(1, elapsed / duration);
            const eased = easeOutCubic(progress);
            const currentValue = target * eased;

            el.textContent = buildDisplay(prefix, formatNumber(currentValue, isDecimal), suffix);

            if (progress < 1) {
                const frameId = requestAnimationFrame(tick);
                animationFrames.push(frameId);
            }
        }

        const frameId = requestAnimationFrame(tick);
        animationFrames.push(frameId);
    });
}

/**
 * Cancel all running animation frames.
 */
function cancelAnimations() {
    for (const id of animationFrames) {
        cancelAnimationFrame(id);
    }
    animationFrames = [];
}

/* ===================================================================
   INIT / DESTROY / RESET
   =================================================================== */

/**
 * Initialize metrics counter.
 * Reads data-count-to, data-suffix, data-prefix from existing
 * .nt-metric__number elements inside the container.
 *
 * @param {string} containerId — ID of the container element.
 */
export function init(containerId = 'metrics-section') {
    containerEl = document.getElementById(containerId);
    if (!containerEl) return;

    // Discover all number elements from existing HTML
    numberEls = Array.from(containerEl.querySelectorAll('.nt-metric__number'));
    if (numberEls.length === 0) return;

    // Respect reduced motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
        hasAnimated = true;
        numberEls.forEach(el => {
            const target = parseFloat(el.dataset.countTo) || 0;
            const suffix = el.dataset.suffix || '';
            const prefix = el.dataset.prefix || '';
            const isDecimal = !Number.isInteger(target);
            el.textContent = buildDisplay(prefix, formatNumber(target, isDecimal), suffix);

            const card = el.closest('.nt-metric');
            if (card) card.classList.add('nt-metric--visible');
        });
        return;
    }

    // IntersectionObserver — animate when visible
    observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting && !hasAnimated) {
                animateAll();
            }
        }
    }, { threshold: 0.2 });

    observer.observe(containerEl);
}

export function destroy() {
    cancelAnimations();
    if (observer) { observer.disconnect(); observer = null; }

    // Reset numbers to initial "0" without destroying the DOM
    numberEls.forEach(el => {
        const target = parseFloat(el.dataset.countTo) || 0;
        const isDecimal = !Number.isInteger(target);
        el.textContent = isDecimal ? '0.0' : '0';
    });

    containerEl = null;
    hasAnimated = false;
    numberEls = [];
}

/**
 * Reset counters to zero and re-trigger animation on next viewport entry.
 */
export function reset() {
    cancelAnimations();
    hasAnimated = false;

    if (!containerEl) return;

    // Reset numbers to initial state
    numberEls.forEach(el => {
        const target = parseFloat(el.dataset.countTo) || 0;
        const isDecimal = !Number.isInteger(target);
        el.textContent = isDecimal ? '0.0' : '0';

        const card = el.closest('.nt-metric');
        if (card) {
            card.classList.remove('nt-metric--visible');
            card.style.transition = 'none';
        }
    });

    // Re-attach observer
    if (observer) observer.disconnect();
    observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting && !hasAnimated) {
                animateAll();
            }
        }
    }, { threshold: 0.2 });
    observer.observe(containerEl);
}
