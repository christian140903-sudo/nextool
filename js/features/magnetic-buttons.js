/**
 * NexTool Magnetic Buttons
 * -----------------------------------------------------------------------
 * Buttons that subtly pull toward the cursor when hovering nearby.
 * Inner text/icon has a stronger displacement for parallax.
 * Spring animation back to center on leave. Disabled on touch/reduced-motion.
 *
 * @module features/magnetic-buttons
 * @exports init, destroy
 */

/* ===================================================================
   CONFIG
   =================================================================== */

const MAGNETIC_RANGE = 100;       // px — activation range from button center
const MAX_DISPLACEMENT = 10;      // px — maximum button translation
const INNER_MULTIPLIER = 1.6;     // Inner content moves further (parallax)
const SPRING_DURATION = 500;      // ms — spring animation back to center
const SPRING_TENSION = 0.3;       // Spring tension factor

/* ===================================================================
   STATE
   =================================================================== */

let buttons = [];
let buttonData = new Map();  // button -> { moveHandler, leaveHandler, rafId }
let documentMoveHandler = null;
let isInitialized = false;

/* ===================================================================
   STYLES
   =================================================================== */

function injectStyles() {
    if (document.getElementById('nt-magnetic-styles')) return;
    const s = document.createElement('style');
    s.id = 'nt-magnetic-styles';
    s.textContent = `
        .nt-btn--magnetic {
            position:relative;
            transition:transform ${SPRING_DURATION}ms cubic-bezier(.25,.46,.45,.94);
            will-change:transform;
        }

        .nt-btn--magnetic .nt-btn__inner {
            display:inline-flex;
            align-items:center;
            gap:8px;
            transition:transform ${SPRING_DURATION}ms cubic-bezier(.25,.46,.45,.94);
            will-change:transform;
        }

        /* When actively being attracted, remove transition for immediate response */
        .nt-btn--magnetic.nt-magnetic--active {
            transition:none;
        }
        .nt-btn--magnetic.nt-magnetic--active .nt-btn__inner {
            transition:none;
        }
    `;
    document.head.appendChild(s);
}

/* ===================================================================
   MAGNETIC LOGIC
   =================================================================== */

/**
 * Get the center coordinates of an element.
 */
function getCenter(el) {
    const rect = el.getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
    };
}

/**
 * Calculate distance between two points.
 */
function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Ensure the button has an inner wrapper for parallax.
 */
function ensureInnerWrapper(btn) {
    if (btn.querySelector('.nt-btn__inner')) return;

    // Wrap existing contents
    const inner = document.createElement('span');
    inner.className = 'nt-btn__inner';

    while (btn.firstChild) {
        inner.appendChild(btn.firstChild);
    }
    btn.appendChild(inner);
}

/**
 * Apply magnetic displacement to a button and its inner content.
 */
function applyMagnetic(btn, mouseX, mouseY) {
    const center = getCenter(btn);
    const dist = distance(mouseX, mouseY, center.x, center.y);

    if (dist > MAGNETIC_RANGE) {
        // Outside range — release
        releaseMagnetic(btn);
        return;
    }

    // Strength: 1 at center, 0 at edge of range
    const strength = 1 - (dist / MAGNETIC_RANGE);

    // Direction from button center to mouse
    const dx = mouseX - center.x;
    const dy = mouseY - center.y;

    // Normalized displacement
    const moveX = dx * strength * (MAX_DISPLACEMENT / MAGNETIC_RANGE * 2);
    const moveY = dy * strength * (MAX_DISPLACEMENT / MAGNETIC_RANGE * 2);

    // Clamp
    const clampedX = Math.max(-MAX_DISPLACEMENT, Math.min(MAX_DISPLACEMENT, moveX));
    const clampedY = Math.max(-MAX_DISPLACEMENT, Math.min(MAX_DISPLACEMENT, moveY));

    btn.classList.add('nt-magnetic--active');
    btn.style.transform = `translate(${clampedX.toFixed(2)}px, ${clampedY.toFixed(2)}px)`;

    // Inner content moves further (parallax)
    const inner = btn.querySelector('.nt-btn__inner');
    if (inner) {
        const innerX = clampedX * INNER_MULTIPLIER;
        const innerY = clampedY * INNER_MULTIPLIER;
        inner.style.transform = `translate(${innerX.toFixed(2)}px, ${innerY.toFixed(2)}px)`;
    }
}

/**
 * Release magnetic effect — spring back to center.
 */
function releaseMagnetic(btn) {
    if (!btn.classList.contains('nt-magnetic--active')) return;

    btn.classList.remove('nt-magnetic--active');
    btn.style.transform = 'translate(0, 0)';

    const inner = btn.querySelector('.nt-btn__inner');
    if (inner) {
        inner.style.transform = 'translate(0, 0)';
    }
}

/* ===================================================================
   EVENT HANDLING
   =================================================================== */

function setupDocumentListener() {
    if (documentMoveHandler) return;

    let rafId = null;

    documentMoveHandler = function onDocumentMouseMove(e) {
        if (rafId) return; // Throttle to rAF

        rafId = requestAnimationFrame(() => {
            const mouseX = e.clientX;
            const mouseY = e.clientY;

            for (const btn of buttons) {
                applyMagnetic(btn, mouseX, mouseY);
            }

            rafId = null;
        });
    };

    document.addEventListener('mousemove', documentMoveHandler, { passive: true });
}

function setupButtonLeaveHandlers() {
    for (const btn of buttons) {
        const handler = () => releaseMagnetic(btn);
        btn.addEventListener('mouseleave', handler);
        buttonData.set(btn, { leaveHandler: handler });
    }
}

/* ===================================================================
   INIT / DESTROY
   =================================================================== */

/**
 * Initialize magnetic effect on matching buttons.
 * @param {string} selector — CSS selector for magnetic buttons.
 */
export function init(selector = '.nt-btn--magnetic') {
    // Bail on touch
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch) return;

    // Bail on reduced motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    injectStyles();

    buttons = Array.from(document.querySelectorAll(selector));
    if (buttons.length === 0) return;

    // Ensure each button has inner wrapper
    for (const btn of buttons) {
        ensureInnerWrapper(btn);
    }

    setupDocumentListener();
    setupButtonLeaveHandlers();

    isInitialized = true;
}

export function destroy() {
    // Remove document listener
    if (documentMoveHandler) {
        document.removeEventListener('mousemove', documentMoveHandler);
        documentMoveHandler = null;
    }

    // Remove per-button handlers and clean up
    for (const btn of buttons) {
        const data = buttonData.get(btn);
        if (data && data.leaveHandler) {
            btn.removeEventListener('mouseleave', data.leaveHandler);
        }
        releaseMagnetic(btn);
        btn.classList.remove('nt-magnetic--active');
        btn.style.transform = '';

        const inner = btn.querySelector('.nt-btn__inner');
        if (inner) inner.style.transform = '';
    }

    buttons = [];
    buttonData = new Map();
    isInitialized = false;

    const styleEl = document.getElementById('nt-magnetic-styles');
    if (styleEl) styleEl.remove();
}
