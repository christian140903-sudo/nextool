/**
 * NexTool Tilt Cards
 * -----------------------------------------------------------------------
 * 3D tilt effect on cards when hovering, inspired by Apple product cards.
 * Smooth perspective transform with a radial glow that follows the cursor.
 * Disabled on mobile/touch and when reduced motion is preferred.
 *
 * @module features/tilt-cards
 * @exports init, destroy
 */

/* ===================================================================
   CONFIG
   =================================================================== */

const MAX_TILT = 15;           // Maximum tilt in degrees per axis
const GLOW_OPACITY = 0.12;    // Glow overlay opacity
const TRANSITION_MS = 400;     // Return-to-flat transition duration
const PERSPECTIVE = 1000;      // Perspective depth in px

/* ===================================================================
   STATE
   =================================================================== */

let cards = [];
let cardHandlers = new Map();  // WeakMap alternative: card -> { move, enter, leave }
let isInitialized = false;

/* ===================================================================
   STYLES
   =================================================================== */

function injectStyles() {
    if (document.getElementById('nt-tilt-styles')) return;
    const s = document.createElement('style');
    s.id = 'nt-tilt-styles';
    s.textContent = `
        .nt-card--interactive {
            transform-style:preserve-3d;
            will-change:transform;
            transition:transform ${TRANSITION_MS}ms cubic-bezier(.03,.98,.52,.99);
        }

        .nt-tilt__glow {
            position:absolute; inset:0;
            border-radius:inherit;
            pointer-events:none;
            opacity:0;
            transition:opacity .3s ease;
            z-index:1;
            background:radial-gradient(
                circle at var(--glow-x, 50%) var(--glow-y, 50%),
                rgba(255,255,255,${GLOW_OPACITY}),
                transparent 60%
            );
        }

        .nt-card--interactive:hover .nt-tilt__glow {
            opacity:1;
        }

        /* Ensure cards have relative positioning for the glow overlay */
        .nt-card--interactive {
            position:relative;
            overflow:hidden;
        }
    `;
    document.head.appendChild(s);
}

/* ===================================================================
   TILT LOGIC
   =================================================================== */

/**
 * Calculate tilt values from mouse position relative to card.
 */
function calculateTilt(e, card) {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Tilt angles: negative X because moving down should tilt "away"
    const rotateX = ((y - centerY) / centerY) * -MAX_TILT;
    const rotateY = ((x - centerX) / centerX) * MAX_TILT;

    // Glow position as percentages
    const glowX = (x / rect.width) * 100;
    const glowY = (y / rect.height) * 100;

    return { rotateX, rotateY, glowX, glowY };
}

/**
 * Apply tilt transform to a card using requestAnimationFrame.
 */
function applyTilt(card, rotateX, rotateY, glowX, glowY) {
    card.style.transform = `perspective(${PERSPECTIVE}px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
    card.style.setProperty('--glow-x', `${glowX.toFixed(1)}%`);
    card.style.setProperty('--glow-y', `${glowY.toFixed(1)}%`);
}

/**
 * Reset card to flat position with smooth transition.
 */
function resetTilt(card) {
    card.style.transition = `transform ${TRANSITION_MS}ms cubic-bezier(.03,.98,.52,.99)`;
    card.style.transform = `perspective(${PERSPECTIVE}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
}

/* ===================================================================
   GLOW OVERLAY
   =================================================================== */

/**
 * Ensure the glow overlay element exists inside the card.
 */
function ensureGlowOverlay(card) {
    if (card.querySelector('.nt-tilt__glow')) return;
    const glow = document.createElement('div');
    glow.className = 'nt-tilt__glow';
    card.appendChild(glow);
}

/* ===================================================================
   EVENT BINDING
   =================================================================== */

function bindCard(card) {
    if (cardHandlers.has(card)) return; // Already bound

    ensureGlowOverlay(card);

    let rafId = null;

    function onMouseMove(e) {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
            const { rotateX, rotateY, glowX, glowY } = calculateTilt(e, card);
            applyTilt(card, rotateX, rotateY, glowX, glowY);
            rafId = null;
        });
    }

    function onMouseEnter() {
        // Remove transition during active tilt for immediate response
        card.style.transition = 'none';
    }

    function onMouseLeave() {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        resetTilt(card);
    }

    card.addEventListener('mousemove', onMouseMove);
    card.addEventListener('mouseenter', onMouseEnter);
    card.addEventListener('mouseleave', onMouseLeave);

    cardHandlers.set(card, { move: onMouseMove, enter: onMouseEnter, leave: onMouseLeave, rafId: null });
}

function unbindCard(card) {
    const handlers = cardHandlers.get(card);
    if (!handlers) return;

    card.removeEventListener('mousemove', handlers.move);
    card.removeEventListener('mouseenter', handlers.enter);
    card.removeEventListener('mouseleave', handlers.leave);

    // Clean up glow overlay
    const glow = card.querySelector('.nt-tilt__glow');
    if (glow) glow.remove();

    // Reset transform
    card.style.transform = '';
    card.style.transition = '';
    card.style.removeProperty('--glow-x');
    card.style.removeProperty('--glow-y');

    cardHandlers.delete(card);
}

/* ===================================================================
   INIT / DESTROY
   =================================================================== */

/**
 * Initialize tilt effect on all matching cards.
 * @param {string} selector — CSS selector for tiltable cards.
 */
export function init(selector = '.nt-card--interactive') {
    // Bail on touch devices (no hover)
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch) return;

    // Bail if user prefers reduced motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    injectStyles();

    cards = Array.from(document.querySelectorAll(selector));
    for (const card of cards) {
        bindCard(card);
    }

    isInitialized = true;
}

export function destroy() {
    for (const card of cards) {
        unbindCard(card);
    }
    cards = [];
    cardHandlers = new Map();
    isInitialized = false;

    const styleEl = document.getElementById('nt-tilt-styles');
    if (styleEl) styleEl.remove();
}
