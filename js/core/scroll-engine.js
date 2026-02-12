/**
 * NexTool — Scroll Engine
 * ========================
 * Powers ALL scroll-triggered animations, reveals, parallax, progress tracking,
 * section detection, and scroll morphing across the site.
 *
 * Everything is built on IntersectionObserver where possible (zero scroll listeners),
 * with a single rAF-throttled scroll listener only for parallax and progress bar.
 *
 * @module core/scroll-engine
 * @version 1.0.0
 */

'use strict';

import { $$, clamp, lerp, rafThrottle, prefersReducedMotion, isMobile, createElement } from './utils.js';


/* ==========================================================================
   CONSTANTS
   ========================================================================== */

/** Default IntersectionObserver threshold for reveals. */
const REVEAL_THRESHOLD = 0.15;

/** Root margin for reveal observer — triggers slightly before element is visible. */
const REVEAL_ROOT_MARGIN = '0px 0px -50px 0px';

/** Stagger delay between children (ms). */
const STAGGER_DELAY = 100;

/** Scroll distance before nav auto-hides. */
const SCROLL_HIDE_DISTANCE = 200;

/** Progress bar height in pixels. */
const PROGRESS_BAR_HEIGHT = 3;

/** Section observer threshold — fires when 30% of section is visible. */
const SECTION_THRESHOLD = 0.3;

/** CSS classes used by the scroll engine. */
const CLS = Object.freeze({
  // Reveal
  reveal:       'nt-reveal',
  revealUp:     'nt-reveal--up',
  revealDown:   'nt-reveal--down',
  revealLeft:   'nt-reveal--left',
  revealRight:  'nt-reveal--right',
  revealScale:  'nt-reveal--scale',
  revealRotate: 'nt-reveal--rotate',
  revealVisible:'nt-reveal--visible',
  stagger:      'nt-stagger',

  // Sections
  act:          'nt-act',

  // Progress bar
  progressBar:  'nt-scroll-progress',
  progressFill: 'nt-scroll-progress__fill',

  // Parallax
  parallax:     'data-parallax',
});


/* ==========================================================================
   STATE
   ========================================================================== */

/** @type {IntersectionObserver|null} */
let revealObserver = null;

/** @type {IntersectionObserver|null} */
let sectionObserver = null;

/** Current scroll progress 0..1. */
let scrollProgress = 0;

/** The section element currently in the viewport center. */
let currentSection = null;

/** The ID of the current section. */
let currentSectionId = '';

/** Previous scroll position — used for direction detection. */
let prevScrollY = 0;

/** Scroll direction: 'up' | 'down'. */
let scrollDirection = 'down';

/** All parallax elements and their speed values. */
let parallaxElements = [];

/** The progress bar DOM element. */
let progressBarEl = null;

/** The fill element inside the progress bar. */
let progressFillEl = null;

/** Whether the engine is initialised. */
let isInitialised = false;

/** Whether scroll-snap is currently active. */
let scrollSnapActive = false;

/** Reference to the bound scroll handler (for removal). */
let boundScrollHandler = null;

/** Reference to the bound resize handler (for removal). */
let boundResizeHandler = null;

/** User-provided options (merged with defaults). */
let opts = {};

/** Global event bus reference (set during init if NexTool namespace exists). */
let eventBus = null;

/** Reduced motion preference — cached once at init. */
let reducedMotion = false;

/** Whether the device is mobile — cached and updated on resize. */
let mobile = false;

/** All section elements, in DOM order. */
let allSections = [];


/* ==========================================================================
   DEFAULT OPTIONS
   ========================================================================== */

const DEFAULTS = {
  /** CSS selector for reveal elements. */
  revealSelector: `.${CLS.reveal}`,

  /** CSS selector for stagger parents. */
  staggerSelector: `.${CLS.stagger}`,

  /** CSS selector for section (act) elements. */
  sectionSelector: `.${CLS.act}`,

  /** Reveal threshold (0..1). */
  revealThreshold: REVEAL_THRESHOLD,

  /** Root margin for reveal observer. */
  revealRootMargin: REVEAL_ROOT_MARGIN,

  /** Stagger delay between children (ms). */
  staggerDelay: STAGGER_DELAY,

  /** Show scroll progress bar at top of page. */
  showProgressBar: true,

  /** Enable parallax effects (auto-disabled on mobile). */
  enableParallax: true,

  /** Enable section detection. */
  enableSectionDetection: true,

  /** Enable auto-hide nav on scroll down. */
  enableAutoHideNav: true,

  /** Scroll distance (px) before nav hides. */
  autoHideDistance: SCROLL_HIDE_DISTANCE,

  /** Selector for the nav element to auto-hide. */
  navSelector: '#main-nav',

  /** Nav hidden class. */
  navHiddenClass: 'nt-nav--hidden',

  /** Nav scrolled class (background appears). */
  navScrolledClass: 'nt-nav--scrolled',

  /** Scroll offset (px) before nav gets scrolled class. */
  navScrolledOffset: 50,

  /** Enable scroll snap on sections. */
  enableScrollSnap: false,

  /** Scroll snap container selector. */
  scrollSnapContainer: 'main',
};


/* ==========================================================================
   REVEAL SYSTEM (IntersectionObserver)
   ========================================================================== */

/**
 * Create the IntersectionObserver that triggers reveal animations.
 * Each element with .nt-reveal gets .nt-reveal--visible when it enters
 * the viewport. For .nt-stagger parents, children are staggered.
 */
function createRevealObserver() {
  revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;

        const el = entry.target;

        // If reduced motion, reveal instantly without animation
        if (reducedMotion) {
          el.style.transition = 'none';
          el.classList.add(CLS.revealVisible);
          revealObserver.unobserve(el);
          continue;
        }

        // Standard reveal
        el.classList.add(CLS.revealVisible);

        // If this is a stagger parent, animate children sequentially
        if (el.classList.contains(CLS.stagger)) {
          const children = Array.from(el.children);
          children.forEach((child, i) => {
            child.style.transitionDelay = `${i * opts.staggerDelay}ms`;
            child.classList.add(CLS.revealVisible);
          });
        }

        // Only animate once — stop observing
        revealObserver.unobserve(el);
      }
    },
    {
      threshold: opts.revealThreshold,
      rootMargin: opts.revealRootMargin,
    }
  );
}

/**
 * Scan the DOM for all reveal elements and observe them.
 * Also handles stagger parents — their children get prepared for animation.
 */
function observeRevealElements() {
  if (!revealObserver) return;

  // Reveal elements
  const revealEls = $$(opts.revealSelector);
  for (const el of revealEls) {
    revealObserver.observe(el);
  }

  // Stagger parents (they too may be reveals)
  const staggerEls = $$(opts.staggerSelector);
  for (const el of staggerEls) {
    // Prepare children: they start hidden (the CSS does this via the parent)
    // but we observe the parent itself
    if (!el.classList.contains(CLS.reveal)) {
      // If the stagger parent is not a reveal itself, still observe it
      revealObserver.observe(el);
    }
  }
}


/* ==========================================================================
   PARALLAX SYSTEM (scroll listener, rAF throttled)
   ========================================================================== */

/**
 * Scan for elements with [data-parallax] and cache their speed values.
 * Disabled on mobile for performance.
 */
function collectParallaxElements() {
  if (mobile || reducedMotion || !opts.enableParallax) {
    parallaxElements = [];
    return;
  }

  const els = $$('[data-parallax]');
  parallaxElements = els.map((el) => {
    const speed = parseFloat(el.dataset.parallax) || 0;
    return { el, speed };
  });
}

/**
 * Update parallax positions based on current scroll offset.
 * Uses transform: translateY for GPU acceleration.
 */
function updateParallax() {
  if (parallaxElements.length === 0) return;

  const scrollY = window.scrollY;

  for (const { el, speed } of parallaxElements) {
    // Calculate offset relative to element's position
    const rect = el.getBoundingClientRect();
    const elCenter = rect.top + rect.height / 2;
    const viewCenter = window.innerHeight / 2;
    const offset = (elCenter - viewCenter) * speed;

    el.style.transform = `translate3d(0, ${offset}px, 0)`;
  }
}


/* ==========================================================================
   SCROLL PROGRESS BAR
   ========================================================================== */

/**
 * Create the thin progress bar element at the top of the page.
 * Cyan gradient, fixed position, 3px tall.
 */
function createProgressBar() {
  if (!opts.showProgressBar) return;

  // Don't create duplicates
  if (progressBarEl) return;

  progressBarEl = createElement('div', {
    class: CLS.progressBar,
    'aria-hidden': 'true',
    style: {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: `${PROGRESS_BAR_HEIGHT}px`,
      zIndex: '10000',
      pointerEvents: 'none',
      background: 'transparent',
      overflow: 'hidden',
    },
  });

  progressFillEl = createElement('div', {
    class: CLS.progressFill,
    style: {
      width: '0%',
      height: '100%',
      background: 'linear-gradient(90deg, #00E5FF, #00B8D4, #00E5FF)',
      borderRadius: '0 2px 2px 0',
      transition: 'width 0.05s linear',
      willChange: 'width',
    },
  });

  progressBarEl.appendChild(progressFillEl);
  document.body.appendChild(progressBarEl);
}

/**
 * Update the progress bar width based on current scroll position.
 */
function updateProgressBar() {
  if (!progressFillEl) return;

  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  if (docHeight <= 0) {
    scrollProgress = 1;
  } else {
    scrollProgress = clamp(window.scrollY / docHeight, 0, 1);
  }

  progressFillEl.style.width = `${scrollProgress * 100}%`;
}


/* ==========================================================================
   SECTION DETECTION (IntersectionObserver)
   ========================================================================== */

/**
 * Create an IntersectionObserver that tracks which .nt-act section
 * is currently in the viewport center. Dispatches 'section-change'
 * events on the global event bus.
 */
function createSectionObserver() {
  if (!opts.enableSectionDetection) return;

  allSections = $$(opts.sectionSelector);
  if (allSections.length === 0) return;

  sectionObserver = new IntersectionObserver(
    (entries) => {
      // Find the entry with the largest intersection ratio
      let bestEntry = null;
      let bestRatio = 0;

      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
          bestRatio = entry.intersectionRatio;
          bestEntry = entry;
        }
      }

      if (bestEntry) {
        const section = bestEntry.target;
        const sectionId = section.id || '';

        if (sectionId !== currentSectionId) {
          currentSection = section;
          currentSectionId = sectionId;

          // Dispatch event on global bus
          dispatchSectionChange(sectionId, section);
        }
      }
    },
    {
      // Use multiple thresholds for better accuracy
      threshold: [0, 0.1, 0.2, 0.3, 0.5, 0.7, 1.0],
      rootMargin: '-20% 0px -20% 0px',
    }
  );

  for (const section of allSections) {
    sectionObserver.observe(section);
  }
}

/**
 * Dispatch a section-change event.
 * @param {string} sectionId
 * @param {Element} section
 */
function dispatchSectionChange(sectionId, section) {
  const index = allSections.indexOf(section);

  // Dispatch on NexTool event bus if available
  if (eventBus) {
    eventBus.dispatchEvent(
      new CustomEvent('section-change', {
        detail: {
          section: sectionId,
          element: section,
          index,
          total: allSections.length,
        },
      })
    );
  }

  // Also dispatch on the section itself for local listeners
  section.dispatchEvent(
    new CustomEvent('nt-enter', {
      detail: { index },
      bubbles: true,
    })
  );
}


/* ==========================================================================
   NAV AUTO-HIDE
   ========================================================================== */

/**
 * Update navigation state based on scroll position and direction.
 * - After navScrolledOffset: add scrolled class (background)
 * - On scroll down past autoHideDistance: hide nav
 * - On scroll up: show nav
 */
function updateNav() {
  if (!opts.enableAutoHideNav) return;

  const nav = document.querySelector(opts.navSelector);
  if (!nav) return;

  const scrollY = window.scrollY;

  // Scrolled state — background appears
  if (scrollY > opts.navScrolledOffset) {
    nav.classList.add(opts.navScrolledClass);
  } else {
    nav.classList.remove(opts.navScrolledClass);
  }

  // Auto-hide on scroll down
  if (scrollDirection === 'down' && scrollY > opts.autoHideDistance) {
    nav.classList.add(opts.navHiddenClass);
  } else if (scrollDirection === 'up') {
    nav.classList.remove(opts.navHiddenClass);
  }
}


/* ==========================================================================
   SCROLL SNAP
   ========================================================================== */

/**
 * Enable CSS scroll-snap on the snap container.
 * Each .nt-act section gets scroll-snap-align: start.
 */
function enableScrollSnap() {
  if (scrollSnapActive) return;

  const container = document.querySelector(opts.scrollSnapContainer);
  if (!container) return;

  container.style.scrollSnapType = 'y mandatory';
  container.style.overflowY = 'auto';
  container.style.height = '100vh';

  for (const section of allSections) {
    section.style.scrollSnapAlign = 'start';
    section.style.minHeight = '100vh';
  }

  scrollSnapActive = true;
}

/**
 * Disable CSS scroll-snap.
 */
function disableScrollSnap() {
  if (!scrollSnapActive) return;

  const container = document.querySelector(opts.scrollSnapContainer);
  if (!container) return;

  container.style.scrollSnapType = '';
  container.style.overflowY = '';
  container.style.height = '';

  for (const section of allSections) {
    section.style.scrollSnapAlign = '';
    section.style.minHeight = '';
  }

  scrollSnapActive = false;
}


/* ==========================================================================
   SCROLL MORPHING
   ========================================================================== */

/**
 * Handle background color and property transitions between sections.
 * Reads data-morph-bg and data-morph-* attributes from sections.
 *
 * Example:
 *   <section class="nt-act" data-morph-bg="#0A0A0A" data-morph-text-color="#E5E5E5">
 *
 * As the user scrolls between sections, these values are interpolated.
 */
function updateMorphing() {
  if (allSections.length < 2) return;
  if (reducedMotion) return;

  const scrollY = window.scrollY;
  const vh = window.innerHeight;

  // Find which two sections we are between
  for (let i = 0; i < allSections.length - 1; i++) {
    const sectionA = allSections[i];
    const sectionB = allSections[i + 1];

    const rectA = sectionA.getBoundingClientRect();
    const rectB = sectionB.getBoundingClientRect();

    // Check if we are in the transition zone between A and B
    const transitionStart = sectionA.offsetTop + sectionA.offsetHeight - vh;
    const transitionEnd = sectionB.offsetTop;

    if (scrollY >= transitionStart && scrollY <= transitionEnd) {
      const progress = clamp(
        (scrollY - transitionStart) / (transitionEnd - transitionStart),
        0,
        1
      );

      // Apply morphing to body or a morph target
      const bgA = sectionA.dataset.morphBg;
      const bgB = sectionB.dataset.morphBg;

      if (bgA && bgB) {
        // Simple crossfade via opacity (avoids expensive colour parsing)
        document.body.style.backgroundColor = progress < 0.5 ? bgA : bgB;
      }
      break;
    }
  }
}


/* ==========================================================================
   MAIN SCROLL HANDLER (single rAF-throttled listener)
   ========================================================================== */

/**
 * The one scroll handler that drives all scroll-based updates.
 * Throttled to requestAnimationFrame for 60fps performance.
 */
function onScroll() {
  const scrollY = window.scrollY;

  // Detect scroll direction
  scrollDirection = scrollY > prevScrollY ? 'down' : 'up';
  prevScrollY = scrollY;

  // Update sub-systems
  updateProgressBar();
  updateParallax();
  updateNav();
  updateMorphing();
}


/* ==========================================================================
   RESIZE HANDLER
   ========================================================================== */

/**
 * Handle window resize — recalculate mobile state, re-collect parallax, etc.
 */
function onResize() {
  const wasMobile = mobile;
  mobile = isMobile();

  // If mobile state changed, recollect parallax
  if (wasMobile !== mobile) {
    collectParallaxElements();

    // Clear parallax transforms if we switched to mobile
    if (mobile) {
      for (const { el } of parallaxElements) {
        el.style.transform = '';
      }
      parallaxElements = [];
    }
  }
}


/* ==========================================================================
   INJECT REVEAL CSS
   ========================================================================== */

/**
 * Inject the CSS needed for scroll reveal animations.
 * This is done from JS so the scroll engine is self-contained
 * and doesn't require external CSS to function.
 */
function injectStyles() {
  const id = 'nt-scroll-engine-styles';
  if (document.getElementById(id)) return;

  const css = `
    /* ─── NexTool Scroll Engine — Reveal Animations ─── */

    /* Base: hidden state */
    .${CLS.reveal} {
      opacity: 0;
      transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1),
                  transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
      will-change: opacity, transform;
    }

    /* Direction variants — starting transforms */
    .${CLS.reveal},
    .${CLS.revealUp} {
      transform: translateY(40px);
    }
    .${CLS.revealDown} {
      transform: translateY(-40px);
    }
    .${CLS.revealLeft} {
      transform: translateX(-60px);
    }
    .${CLS.revealRight} {
      transform: translateX(60px);
    }
    .${CLS.revealScale} {
      transform: scale(0.85);
    }
    .${CLS.revealRotate} {
      transform: rotate(-6deg) scale(0.9);
    }

    /* Visible state — all variants reset to identity */
    .${CLS.revealVisible} {
      opacity: 1 !important;
      transform: translateY(0) translateX(0) scale(1) rotate(0deg) !important;
    }

    /* Stagger parent — children start hidden */
    .${CLS.stagger} > * {
      opacity: 0;
      transform: translateY(30px);
      transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
                  transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .${CLS.stagger} > *.${CLS.revealVisible} {
      opacity: 1;
      transform: translateY(0);
    }

    /* Reduced motion — instant reveal, no transforms */
    @media (prefers-reduced-motion: reduce) {
      .${CLS.reveal},
      .${CLS.stagger} > * {
        transition: none !important;
        transform: none !important;
        opacity: 1 !important;
      }
    }

    /* Parallax elements get GPU layer */
    [data-parallax] {
      will-change: transform;
    }
  `;

  const style = createElement('style', { id, type: 'text/css' }, [css]);
  document.head.appendChild(style);
}


/* ==========================================================================
   PUBLIC API
   ========================================================================== */

/**
 * Initialise the scroll engine. Call once after DOMContentLoaded.
 *
 * @param {Object} [options] - Override defaults (see DEFAULTS object)
 * @returns {void}
 */
export function init(options = {}) {
  if (isInitialised) {
    // If already initialised, do a refresh instead
    refresh();
    return;
  }

  // Merge options with defaults
  opts = { ...DEFAULTS, ...options };

  // Cache device state
  reducedMotion = prefersReducedMotion();
  mobile = isMobile();

  // Grab event bus from NexTool namespace if available
  if (typeof window !== 'undefined' && window.NexTool && window.NexTool.events) {
    eventBus = window.NexTool.events;
  }

  // Inject reveal CSS
  injectStyles();

  // 1. Set up reveal observer
  createRevealObserver();
  observeRevealElements();

  // 2. Set up section observer
  createSectionObserver();

  // 3. Set up progress bar
  createProgressBar();

  // 4. Collect parallax elements
  collectParallaxElements();

  // 5. Bind scroll handler (rAF throttled)
  boundScrollHandler = rafThrottle(onScroll);
  window.addEventListener('scroll', boundScrollHandler, { passive: true });

  // 6. Bind resize handler (debounced via rAF)
  boundResizeHandler = rafThrottle(onResize);
  window.addEventListener('resize', boundResizeHandler, { passive: true });

  // 7. Enable scroll snap if configured
  if (opts.enableScrollSnap) {
    enableScrollSnap();
  }

  // 8. Run initial calculations
  prevScrollY = window.scrollY;
  onScroll();

  isInitialised = true;
}

/**
 * Tear down the scroll engine — remove all observers, listeners, and injected DOM.
 */
export function destroy() {
  if (!isInitialised) return;

  // Disconnect observers
  if (revealObserver) {
    revealObserver.disconnect();
    revealObserver = null;
  }
  if (sectionObserver) {
    sectionObserver.disconnect();
    sectionObserver = null;
  }

  // Remove scroll + resize listeners
  if (boundScrollHandler) {
    window.removeEventListener('scroll', boundScrollHandler);
    boundScrollHandler = null;
  }
  if (boundResizeHandler) {
    window.removeEventListener('resize', boundResizeHandler);
    boundResizeHandler = null;
  }

  // Remove progress bar from DOM
  if (progressBarEl && progressBarEl.parentNode) {
    progressBarEl.parentNode.removeChild(progressBarEl);
    progressBarEl = null;
    progressFillEl = null;
  }

  // Remove injected styles
  const style = document.getElementById('nt-scroll-engine-styles');
  if (style) style.parentNode.removeChild(style);

  // Disable scroll snap
  disableScrollSnap();

  // Clear parallax transforms
  for (const { el } of parallaxElements) {
    el.style.transform = '';
  }
  parallaxElements = [];

  // Reset state
  currentSection = null;
  currentSectionId = '';
  scrollProgress = 0;
  allSections = [];
  isInitialised = false;
}

/**
 * Re-scan the DOM for new reveal/parallax/section elements.
 * Call this after dynamically adding content.
 */
export function refresh() {
  if (!isInitialised) return;

  // Re-observe reveals
  observeRevealElements();

  // Re-collect parallax
  collectParallaxElements();

  // Re-collect sections
  if (sectionObserver) {
    sectionObserver.disconnect();
  }
  createSectionObserver();
}

/**
 * Get the current scroll progress as a value between 0 and 1.
 * @returns {number}
 */
export function getScrollProgress() {
  return scrollProgress;
}

/**
 * Get the current section element (the one most visible in viewport).
 * @returns {Element|null}
 */
export function getCurrentSection() {
  return currentSection;
}

/**
 * Get the current section's ID.
 * @returns {string}
 */
export function getCurrentSectionId() {
  return currentSectionId;
}

/**
 * Get the current scroll direction.
 * @returns {'up'|'down'}
 */
export function getScrollDirection() {
  return scrollDirection;
}

/**
 * Smoothly scroll to a section by its index (0-based).
 *
 * @param {number} index - Section index
 * @param {Object} [options]
 * @param {string} [options.behavior='smooth'] - 'smooth' or 'auto'
 * @param {string} [options.block='start'] - 'start', 'center', 'end'
 */
export function scrollToSection(index, options = {}) {
  const { behavior = 'smooth', block = 'start' } = options;

  if (!allSections[index]) return;

  allSections[index].scrollIntoView({
    behavior: reducedMotion ? 'auto' : behavior,
    block,
  });
}

/**
 * Smoothly scroll to a specific element.
 *
 * @param {Element|string} target - Element or CSS selector
 * @param {Object} [options]
 * @param {number} [options.offset=0] - Pixel offset from top
 * @param {string} [options.behavior='smooth'] - 'smooth' or 'auto'
 */
export function scrollToElement(target, options = {}) {
  const { offset = 0, behavior = 'smooth' } = options;

  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;

  const top = el.getBoundingClientRect().top + window.scrollY - offset;

  window.scrollTo({
    top,
    behavior: reducedMotion ? 'auto' : behavior,
  });
}

/**
 * Toggle scroll snap on/off.
 * @param {boolean} [enable] - If omitted, toggles current state
 */
export function toggleScrollSnap(enable) {
  const shouldEnable = enable !== undefined ? enable : !scrollSnapActive;
  if (shouldEnable) {
    enableScrollSnap();
  } else {
    disableScrollSnap();
  }
}

/**
 * Programmatically reveal an element (bypass scroll triggering).
 * Useful for elements that need to be revealed on user interaction.
 * @param {Element} el
 */
export function revealElement(el) {
  if (!el) return;

  el.classList.add(CLS.revealVisible);

  if (el.classList.contains(CLS.stagger)) {
    Array.from(el.children).forEach((child, i) => {
      child.style.transitionDelay = `${i * opts.staggerDelay}ms`;
      child.classList.add(CLS.revealVisible);
    });
  }

  // Stop observing it
  if (revealObserver) {
    revealObserver.unobserve(el);
  }
}

/**
 * Get all section elements tracked by the engine.
 * @returns {Element[]}
 */
export function getAllSections() {
  return [...allSections];
}

/**
 * Check if the scroll engine is currently initialised.
 * @returns {boolean}
 */
export function isActive() {
  return isInitialised;
}
