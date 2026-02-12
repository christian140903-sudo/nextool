/**
 * NexTool — Navigation Component
 * ================================
 * Fixed navigation with scroll effects, mobile menu, active section tracking,
 * keyboard accessibility, and ARIA attributes.
 *
 * Expected HTML structure:
 *
 *   <nav id="main-nav" class="nt-nav">
 *     <div class="nt-nav__inner nt-container">
 *       <a href="/" class="nt-nav__logo">
 *         <span class="nt-nav__logo-text">Nex<span class="nt-text-cyan">Tool</span></span>
 *       </a>
 *       <div class="nt-nav__links">
 *         <a href="#act-2" class="nt-nav__link" data-section="act-2">How It Works</a>
 *         ...
 *         <a href="#act-5" class="nt-nav__cta nt-btn nt-btn--primary nt-btn--sm">Get Started</a>
 *       </div>
 *       <button class="nt-nav__mobile-toggle" aria-label="Menu" aria-expanded="false">
 *         <span></span><span></span><span></span>
 *       </button>
 *     </div>
 *     <div class="nt-nav__mobile-menu" aria-hidden="true">
 *       <!-- Same links, vertical layout -->
 *     </div>
 *   </nav>
 *
 * @module core/navigation
 * @version 1.0.0
 */

'use strict';

import { $, $$, rafThrottle, prefersReducedMotion, createElement } from './utils.js';


/* ==========================================================================
   CONSTANTS
   ========================================================================== */

/** CSS classes used by the navigation. */
const CLS = Object.freeze({
  nav:            'nt-nav',
  navScrolled:    'nt-nav--scrolled',
  navHidden:      'nt-nav--hidden',
  navOpen:        'nt-nav--open',
  inner:          'nt-nav__inner',
  logo:           'nt-nav__logo',
  links:          'nt-nav__links',
  link:           'nt-nav__link',
  linkActive:     'nt-nav__link--active',
  cta:            'nt-nav__cta',
  mobileToggle:   'nt-nav__mobile-toggle',
  mobileToggleOpen: 'nt-nav__mobile-toggle--open',
  mobileMenu:     'nt-nav__mobile-menu',
  mobileMenuOpen: 'nt-nav__mobile-menu--open',
  backdrop:       'nt-nav__backdrop',
  bodyLocked:     'nt-body--nav-open',
});

/** Scroll offset (px) before nav gets background. */
const SCROLL_OFFSET = 50;

/** Scroll distance (px) before auto-hide kicks in. */
const AUTO_HIDE_DISTANCE = 200;

/** Transition duration for mobile menu (ms). */
const MENU_TRANSITION_MS = 350;

/** Nav height for scroll offset calculations. */
const NAV_HEIGHT_ESTIMATE = 72;


/* ==========================================================================
   STATE
   ========================================================================== */

/** @type {HTMLElement|null} */
let navEl = null;

/** @type {HTMLElement|null} */
let mobileToggleEl = null;

/** @type {HTMLElement|null} */
let mobileMenuEl = null;

/** @type {HTMLElement|null} */
let backdropEl = null;

/** @type {HTMLAnchorElement[]} */
let navLinks = [];

/** Whether the mobile menu is currently open. */
let isMenuOpen = false;

/** Previous scroll position for direction detection. */
let prevScrollY = 0;

/** Whether auto-hide is enabled. */
let autoHideEnabled = true;

/** Whether the nav is currently hidden. */
let isNavHidden = false;

/** Whether the nav has the scrolled (opaque) state. */
let isNavScrolled = false;

/** The current active section ID. */
let activeSectionId = '';

/** Whether the component is initialised. */
let isInitialised = false;

/** Bound event handlers (stored for cleanup). */
const handlers = {
  scroll: null,
  resize: null,
  keydown: null,
  sectionChange: null,
};

/** Whether user prefers reduced motion. */
let reducedMotion = false;

/** Global event bus reference. */
let eventBus = null;


/* ==========================================================================
   INJECT NAV CSS
   ========================================================================== */

/**
 * Inject the CSS for navigation component.
 * Self-contained — no external stylesheet required.
 */
function injectStyles() {
  const id = 'nt-navigation-styles';
  if (document.getElementById(id)) return;

  const css = `
    /* ─── NexTool Navigation ─── */

    .${CLS.nav} {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9000;
      padding: 0 24px;
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
                  background-color 0.35s ease,
                  box-shadow 0.35s ease,
                  backdrop-filter 0.35s ease;
      background: transparent;
    }

    .${CLS.navScrolled} {
      background: rgba(10, 10, 10, 0.85);
      backdrop-filter: blur(16px) saturate(180%);
      -webkit-backdrop-filter: blur(16px) saturate(180%);
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.04),
                  0 4px 24px rgba(0, 0, 0, 0.4);
    }

    .${CLS.navHidden} {
      transform: translateY(-100%);
    }

    .${CLS.inner} {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 1200px;
      margin: 0 auto;
      height: ${NAV_HEIGHT_ESTIMATE}px;
    }

    /* ─── Logo ─── */
    .${CLS.logo} {
      text-decoration: none;
      font-family: var(--mono, 'JetBrains Mono', monospace);
      font-size: 1.25rem;
      font-weight: 800;
      color: #E5E5E5;
      letter-spacing: -0.02em;
      transition: opacity 0.2s;
      flex-shrink: 0;
    }
    .${CLS.logo}:hover {
      opacity: 0.8;
    }
    .nt-text-cyan {
      color: #00E5FF;
    }

    /* ─── Desktop Links ─── */
    .${CLS.links} {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .${CLS.link} {
      color: #9CA3AF;
      text-decoration: none;
      font-family: var(--sans, 'Inter', sans-serif);
      font-size: 0.875rem;
      font-weight: 500;
      padding: 8px 14px;
      border-radius: 8px;
      transition: color 0.2s, background 0.2s;
      position: relative;
      white-space: nowrap;
    }
    .${CLS.link}:hover {
      color: #E5E5E5;
      background: rgba(255, 255, 255, 0.05);
    }
    .${CLS.link}:focus-visible {
      outline: 2px solid #00E5FF;
      outline-offset: 2px;
    }

    .${CLS.linkActive} {
      color: #00E5FF;
    }
    .${CLS.linkActive}::after {
      content: '';
      position: absolute;
      bottom: 2px;
      left: 50%;
      transform: translateX(-50%);
      width: 18px;
      height: 2px;
      background: #00E5FF;
      border-radius: 1px;
    }

    /* ─── CTA Button in nav ─── */
    .${CLS.cta} {
      margin-left: 8px;
    }

    /* ─── Mobile Toggle (Hamburger) ─── */
    .${CLS.mobileToggle} {
      display: none;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: 44px;
      height: 44px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      gap: 5px;
      -webkit-tap-highlight-color: transparent;
      position: relative;
      z-index: 9002;
    }
    .${CLS.mobileToggle} span {
      display: block;
      width: 22px;
      height: 2px;
      background: #E5E5E5;
      border-radius: 1px;
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
                  opacity 0.2s ease,
                  width 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      transform-origin: center;
    }
    .${CLS.mobileToggle}:focus-visible {
      outline: 2px solid #00E5FF;
      outline-offset: 2px;
      border-radius: 8px;
    }

    /* Hamburger → X transform */
    .${CLS.mobileToggleOpen} span:nth-child(1) {
      transform: translateY(7px) rotate(45deg);
    }
    .${CLS.mobileToggleOpen} span:nth-child(2) {
      opacity: 0;
      transform: scaleX(0);
    }
    .${CLS.mobileToggleOpen} span:nth-child(3) {
      transform: translateY(-7px) rotate(-45deg);
    }

    /* ─── Mobile Menu ─── */
    .${CLS.mobileMenu} {
      display: none;
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: min(320px, 85vw);
      background: rgba(10, 10, 10, 0.97);
      backdrop-filter: blur(24px) saturate(180%);
      -webkit-backdrop-filter: blur(24px) saturate(180%);
      padding: ${NAV_HEIGHT_ESTIMATE + 24}px 24px 32px;
      z-index: 9001;
      transform: translateX(100%);
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      border-left: 1px solid rgba(255, 255, 255, 0.06);
      flex-direction: column;
      gap: 4px;
    }
    .${CLS.mobileMenuOpen} {
      display: flex;
      transform: translateX(0);
    }

    .${CLS.mobileMenu} .${CLS.link} {
      display: block;
      font-size: 1rem;
      padding: 14px 16px;
      border-radius: 10px;
      color: #9CA3AF;
    }
    .${CLS.mobileMenu} .${CLS.link}:hover,
    .${CLS.mobileMenu} .${CLS.link}:active {
      color: #E5E5E5;
      background: rgba(255, 255, 255, 0.05);
    }
    .${CLS.mobileMenu} .${CLS.linkActive} {
      color: #00E5FF;
      background: rgba(0, 229, 255, 0.05);
    }

    .${CLS.mobileMenu} .${CLS.cta} {
      margin: 16px 0 0;
      display: block;
      text-align: center;
      width: 100%;
    }

    /* ─── Backdrop ─── */
    .${CLS.backdrop} {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 8999;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.35s ease;
    }
    .${CLS.backdrop}--visible {
      opacity: 1;
      pointer-events: auto;
    }

    /* ─── Body lock (prevent scroll when menu open) ─── */
    .${CLS.bodyLocked} {
      overflow: hidden;
      position: fixed;
      width: 100%;
    }

    /* ─── Responsive ─── */
    @media (max-width: 1023px) {
      .${CLS.links} {
        display: none;
      }
      .${CLS.mobileToggle} {
        display: flex;
      }
    }
    @media (min-width: 1024px) {
      .${CLS.mobileMenu} {
        display: none !important;
      }
      .${CLS.backdrop} {
        display: none !important;
      }
    }

    /* ─── Reduced motion ─── */
    @media (prefers-reduced-motion: reduce) {
      .${CLS.nav},
      .${CLS.mobileMenu},
      .${CLS.mobileToggle} span,
      .${CLS.backdrop} {
        transition: none !important;
      }
    }
  `;

  const style = createElement('style', { id, type: 'text/css' }, [css]);
  document.head.appendChild(style);
}


/* ==========================================================================
   SCROLL HANDLING
   ========================================================================== */

/**
 * Handle scroll: apply scrolled class and auto-hide logic.
 */
function onScroll() {
  if (!navEl) return;

  const scrollY = window.scrollY;
  const scrollingDown = scrollY > prevScrollY;

  // Scrolled state — opaque background
  const shouldBeScrolled = scrollY > SCROLL_OFFSET;
  if (shouldBeScrolled !== isNavScrolled) {
    isNavScrolled = shouldBeScrolled;
    navEl.classList.toggle(CLS.navScrolled, shouldBeScrolled);
  }

  // Auto-hide on scroll down (only if enabled and menu closed)
  if (autoHideEnabled && !isMenuOpen) {
    if (scrollingDown && scrollY > AUTO_HIDE_DISTANCE) {
      if (!isNavHidden) {
        isNavHidden = true;
        navEl.classList.add(CLS.navHidden);
      }
    } else if (!scrollingDown) {
      if (isNavHidden) {
        isNavHidden = false;
        navEl.classList.remove(CLS.navHidden);
      }
    }
  }

  prevScrollY = scrollY;
}


/* ==========================================================================
   MOBILE MENU
   ========================================================================== */

/**
 * Create the backdrop element for the mobile menu.
 */
function createBackdrop() {
  if (backdropEl) return;

  backdropEl = createElement('div', {
    class: CLS.backdrop,
    'aria-hidden': 'true',
  });

  backdropEl.addEventListener('click', closeMenu);
  document.body.appendChild(backdropEl);
}

/**
 * Lock body scrolling (when mobile menu is open).
 * Preserves the current scroll position.
 */
let savedScrollY = 0;

function lockBody() {
  savedScrollY = window.scrollY;
  document.body.classList.add(CLS.bodyLocked);
  document.body.style.top = `-${savedScrollY}px`;
}

/**
 * Unlock body scrolling and restore position.
 */
function unlockBody() {
  document.body.classList.remove(CLS.bodyLocked);
  document.body.style.top = '';
  window.scrollTo(0, savedScrollY);
}

/**
 * Open the mobile menu.
 */
function openMenu() {
  if (isMenuOpen || !mobileMenuEl || !mobileToggleEl) return;

  isMenuOpen = true;

  // Show the menu panel (display flex first so transition can happen)
  mobileMenuEl.style.display = 'flex';

  // Force reflow before adding the open class so the transition runs
  void mobileMenuEl.offsetHeight;

  mobileMenuEl.classList.add(CLS.mobileMenuOpen);
  mobileMenuEl.setAttribute('aria-hidden', 'false');

  // Toggle button state
  mobileToggleEl.classList.add(CLS.mobileToggleOpen);
  mobileToggleEl.setAttribute('aria-expanded', 'true');

  // Nav open class
  navEl.classList.add(CLS.navOpen);

  // Show backdrop
  if (backdropEl) {
    backdropEl.classList.add(`${CLS.backdrop}--visible`);
  }

  // Lock body scroll
  lockBody();

  // Un-hide nav if it was auto-hidden
  if (isNavHidden) {
    isNavHidden = false;
    navEl.classList.remove(CLS.navHidden);
  }

  // Focus first link for accessibility
  const firstLink = $(`.${CLS.link}`, mobileMenuEl);
  if (firstLink) {
    setTimeout(() => firstLink.focus(), MENU_TRANSITION_MS);
  }
}

/**
 * Close the mobile menu.
 */
function closeMenu() {
  if (!isMenuOpen || !mobileMenuEl || !mobileToggleEl) return;

  isMenuOpen = false;

  // Animate out
  mobileMenuEl.classList.remove(CLS.mobileMenuOpen);
  mobileMenuEl.setAttribute('aria-hidden', 'true');

  // Toggle button state
  mobileToggleEl.classList.remove(CLS.mobileToggleOpen);
  mobileToggleEl.setAttribute('aria-expanded', 'false');

  // Nav open class
  navEl.classList.remove(CLS.navOpen);

  // Hide backdrop
  if (backdropEl) {
    backdropEl.classList.remove(`${CLS.backdrop}--visible`);
  }

  // Unlock body
  unlockBody();

  // After transition, set display none (saves rendering cost)
  setTimeout(() => {
    if (!isMenuOpen && mobileMenuEl) {
      mobileMenuEl.style.display = '';
    }
  }, MENU_TRANSITION_MS);

  // Return focus to toggle
  mobileToggleEl.focus();
}

/**
 * Toggle menu open/closed.
 */
function toggleMenu() {
  if (isMenuOpen) {
    closeMenu();
  } else {
    openMenu();
  }
}


/* ==========================================================================
   LINK HANDLING
   ========================================================================== */

/**
 * Handle click on a nav link — smooth scroll to the target section.
 * @param {MouseEvent} e
 */
function onLinkClick(e) {
  const link = e.currentTarget;
  const href = link.getAttribute('href');

  // Only handle anchor links (starting with #)
  if (!href || !href.startsWith('#')) return;

  e.preventDefault();

  const target = document.querySelector(href);
  if (!target) return;

  // Close mobile menu if open
  if (isMenuOpen) {
    closeMenu();
  }

  // Smooth scroll to target with offset for nav height
  const top = target.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT_ESTIMATE;

  window.scrollTo({
    top: Math.max(0, top),
    behavior: reducedMotion ? 'auto' : 'smooth',
  });

  // Dispatch navigation event
  if (eventBus) {
    eventBus.dispatchEvent(
      new CustomEvent('nav-click', {
        detail: { href, target },
      })
    );
  }
}

/**
 * Handle logo click — scroll to top.
 * @param {MouseEvent} e
 */
function onLogoClick(e) {
  // Only handle if it's a same-page link
  const logo = e.currentTarget;
  const href = logo.getAttribute('href');

  if (href === '/' || href === '#' || href === '#top') {
    e.preventDefault();

    if (isMenuOpen) closeMenu();

    window.scrollTo({
      top: 0,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  }
}


/* ==========================================================================
   SECTION TRACKING
   ========================================================================== */

/**
 * Update which nav link is marked as active based on the current section.
 * Called when the scroll engine dispatches a 'section-change' event.
 *
 * @param {string} sectionId - ID of the section currently in view
 */
export function setActiveSection(sectionId) {
  if (sectionId === activeSectionId) return;
  activeSectionId = sectionId;

  // Update desktop links
  for (const link of navLinks) {
    const linkSection = link.dataset.section || '';
    const isActive = linkSection === sectionId;
    link.classList.toggle(CLS.linkActive, isActive);

    if (isActive) {
      link.setAttribute('aria-current', 'true');
    } else {
      link.removeAttribute('aria-current');
    }
  }

  // Update mobile menu links too
  if (mobileMenuEl) {
    const mobileLinks = $$(`.${CLS.link}`, mobileMenuEl);
    for (const link of mobileLinks) {
      const linkSection = link.dataset.section || '';
      link.classList.toggle(CLS.linkActive, linkSection === sectionId);
    }
  }
}

/**
 * Listen for section-change events from the scroll engine.
 * @param {CustomEvent} e
 */
function onSectionChange(e) {
  if (e.detail && e.detail.section) {
    setActiveSection(e.detail.section);
  }
}


/* ==========================================================================
   KEYBOARD HANDLING
   ========================================================================== */

/**
 * Handle keyboard events for accessibility.
 * - Escape: close mobile menu
 * - Tab: trap focus within mobile menu when open
 * @param {KeyboardEvent} e
 */
function onKeydown(e) {
  // Escape closes menu
  if (e.key === 'Escape' && isMenuOpen) {
    e.preventDefault();
    closeMenu();
    return;
  }

  // Focus trap within mobile menu
  if (e.key === 'Tab' && isMenuOpen && mobileMenuEl) {
    const focusableEls = $$(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      mobileMenuEl
    );

    // Also include the toggle button
    const allFocusable = [mobileToggleEl, ...focusableEls].filter(Boolean);
    if (allFocusable.length === 0) return;

    const first = allFocusable[0];
    const last = allFocusable[allFocusable.length - 1];

    if (e.shiftKey) {
      // Shift+Tab: if on first focusable, wrap to last
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      // Tab: if on last focusable, wrap to first
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
}


/* ==========================================================================
   RESIZE HANDLING
   ========================================================================== */

/**
 * On resize, close mobile menu if viewport crosses the desktop breakpoint.
 */
function onResize() {
  if (window.innerWidth >= 1024 && isMenuOpen) {
    closeMenu();
  }
}


/* ==========================================================================
   PUBLIC API
   ========================================================================== */

/**
 * Initialise the navigation component. Call once after DOMContentLoaded.
 *
 * @param {Object} [options]
 * @param {boolean} [options.autoHide=true] - Enable nav auto-hide on scroll down
 * @param {string} [options.navSelector='#main-nav'] - Nav element selector
 */
export function init(options = {}) {
  if (isInitialised) return;

  const { autoHide = true, navSelector = '#main-nav' } = options;
  autoHideEnabled = autoHide;
  reducedMotion = prefersReducedMotion();

  // Find nav element
  navEl = $(navSelector);
  if (!navEl) {
    // Nav not found — nothing to do
    return;
  }

  // Inject CSS
  injectStyles();

  // Find child elements
  mobileToggleEl = $(`.${CLS.mobileToggle}`, navEl);
  mobileMenuEl = $(`.${CLS.mobileMenu}`, navEl);

  // Collect all nav links (desktop)
  navLinks = $$(`.${CLS.link}`, $(`.${CLS.links}`, navEl) || navEl);

  // Create backdrop for mobile menu
  createBackdrop();

  // Grab global event bus
  if (typeof window !== 'undefined' && window.NexTool && window.NexTool.events) {
    eventBus = window.NexTool.events;
  }

  // ── Bind events ──

  // Mobile toggle
  if (mobileToggleEl) {
    mobileToggleEl.addEventListener('click', toggleMenu);
  }

  // Desktop nav links — smooth scroll
  for (const link of navLinks) {
    link.addEventListener('click', onLinkClick);
  }

  // Mobile menu links — smooth scroll
  if (mobileMenuEl) {
    const mobileLinks = $$(`.${CLS.link}`, mobileMenuEl);
    for (const link of mobileLinks) {
      link.addEventListener('click', onLinkClick);
    }
    // CTA in mobile menu
    const mobileCta = $(`.${CLS.cta}`, mobileMenuEl);
    if (mobileCta) {
      mobileCta.addEventListener('click', onLinkClick);
    }
  }

  // Logo — scroll to top
  const logo = $(`.${CLS.logo}`, navEl);
  if (logo) {
    logo.addEventListener('click', onLogoClick);
  }

  // Scroll handler (rAF throttled)
  handlers.scroll = rafThrottle(onScroll);
  window.addEventListener('scroll', handlers.scroll, { passive: true });

  // Resize handler (rAF throttled)
  handlers.resize = rafThrottle(onResize);
  window.addEventListener('resize', handlers.resize, { passive: true });

  // Keyboard handler
  handlers.keydown = onKeydown;
  document.addEventListener('keydown', handlers.keydown);

  // Section-change listener (from scroll engine)
  handlers.sectionChange = onSectionChange;
  if (eventBus) {
    eventBus.addEventListener('section-change', handlers.sectionChange);
  }

  // Run initial scroll state
  prevScrollY = window.scrollY;
  onScroll();

  isInitialised = true;
}

/**
 * Tear down the navigation component — remove all listeners and injected DOM.
 */
export function destroy() {
  if (!isInitialised) return;

  // Close menu if open
  if (isMenuOpen) {
    closeMenu();
  }

  // Remove scroll listener
  if (handlers.scroll) {
    window.removeEventListener('scroll', handlers.scroll);
  }

  // Remove resize listener
  if (handlers.resize) {
    window.removeEventListener('resize', handlers.resize);
  }

  // Remove keyboard listener
  if (handlers.keydown) {
    document.removeEventListener('keydown', handlers.keydown);
  }

  // Remove section-change listener
  if (handlers.sectionChange && eventBus) {
    eventBus.removeEventListener('section-change', handlers.sectionChange);
  }

  // Remove link click handlers
  for (const link of navLinks) {
    link.removeEventListener('click', onLinkClick);
  }

  // Remove mobile toggle handler
  if (mobileToggleEl) {
    mobileToggleEl.removeEventListener('click', toggleMenu);
  }

  // Remove logo handler
  const logo = navEl ? $(`.${CLS.logo}`, navEl) : null;
  if (logo) {
    logo.removeEventListener('click', onLogoClick);
  }

  // Remove backdrop
  if (backdropEl && backdropEl.parentNode) {
    backdropEl.removeEventListener('click', closeMenu);
    backdropEl.parentNode.removeChild(backdropEl);
    backdropEl = null;
  }

  // Remove injected styles
  const style = document.getElementById('nt-navigation-styles');
  if (style && style.parentNode) {
    style.parentNode.removeChild(style);
  }

  // Clean up classes on nav
  if (navEl) {
    navEl.classList.remove(CLS.navScrolled, CLS.navHidden, CLS.navOpen);
  }

  // Reset state
  navEl = null;
  mobileToggleEl = null;
  mobileMenuEl = null;
  navLinks = [];
  isMenuOpen = false;
  isNavHidden = false;
  isNavScrolled = false;
  activeSectionId = '';
  handlers.scroll = null;
  handlers.resize = null;
  handlers.keydown = null;
  handlers.sectionChange = null;
  eventBus = null;
  isInitialised = false;
}

/**
 * Programmatically show the nav (undo auto-hide).
 */
export function show() {
  if (!navEl) return;
  isNavHidden = false;
  navEl.classList.remove(CLS.navHidden);
}

/**
 * Programmatically hide the nav.
 */
export function hide() {
  if (!navEl) return;
  isNavHidden = true;
  navEl.classList.add(CLS.navHidden);
}

/**
 * Enable or disable auto-hide behaviour.
 * @param {boolean} enabled
 */
export function setAutoHide(enabled) {
  autoHideEnabled = enabled;
  if (!enabled && isNavHidden) {
    show();
  }
}

/**
 * Check if the mobile menu is currently open.
 * @returns {boolean}
 */
export function isOpen() {
  return isMenuOpen;
}

/**
 * Check if the component is initialised.
 * @returns {boolean}
 */
export function isActive() {
  return isInitialised;
}
