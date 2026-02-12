/**
 * NexTool — Application Orchestrator
 * =====================================
 * The central nervous system of NexTool's frontend. This module:
 *
 *   1. Detects device capabilities (mobile, touch, GPU, reduced-motion)
 *   2. Registers and dynamically loads all feature modules
 *   3. Manages feature lifecycle (init → running → destroy)
 *   4. Provides a global NexTool namespace for cross-module communication
 *   5. Monitors FPS and switches to "lite mode" when performance drops
 *   6. Orchestrates the page-load sequence in priority tiers
 *
 * @module core/app
 * @version 1.0.0
 */

'use strict';

import {
  $,
  $$,
  FPSMonitor,
  prefersReducedMotion,
  isMobile as isMobileCheck,
  isTouch as isTouchCheck,
  supportsCanvas,
  supportsWebGL,
  getLocal,
  setLocal,
  debounce,
  noop,
} from './utils.js';


/* ==========================================================================
   CONSTANTS
   ========================================================================== */

/** NexTool version string. */
const VERSION = '1.0.0';

/** FPS threshold — below this for LOW_FPS_DURATION triggers lite mode. */
const LOW_FPS_THRESHOLD = 30;

/** Duration (ms) of sustained low FPS before entering lite mode. */
const LOW_FPS_DURATION = 2000;

/** Delay (ms) before loading priority-2 features (idle/timeout fallback). */
const IDLE_LOAD_DELAY = 2000;

/** localStorage key for user's lite-mode preference. */
const LITE_MODE_KEY = 'nexTool_liteMode';

/** localStorage key for storing performance profile. */
const PERF_PROFILE_KEY = 'nexTool_perfProfile';

/** Timeout for feature module loading (ms) — prevents hanging on network issues. */
const MODULE_LOAD_TIMEOUT = 10000;

/** How often we sample FPS for the low-FPS detector (ms). */
const FPS_SAMPLE_INTERVAL = 500;


/* ==========================================================================
   FEATURE REGISTRY
   ========================================================================== */

/**
 * Registry of all features that can be loaded.
 *
 * Each entry defines:
 *   - module:   relative path to the ES module (from this file's directory)
 *   - priority: 0 = critical (load immediately)
 *               1 = enhanced (load after DOMContentLoaded)
 *               2 = decorative (load on idle / after 2s)
 *   - desktop:  if true, only loads when viewport >= 1024px
 *   - mobile:   if false, does not load on touch devices
 *               if true (or omitted), loads on all devices
 *
 * Modules must export at minimum: init() and destroy().
 * They may also export: refresh(), setOptions(), getState().
 */
const featureRegistry = {
  neuralNetwork: {
    module: '../features/neural-network.js',
    priority: 1,
    desktop: true,
    mobile: false,
    description: 'Animated neural network background',
  },
  particles: {
    module: '../features/particle-system.js',
    priority: 2,
    desktop: true,
    mobile: false,
    description: 'Floating particle effects',
  },
  aurora: {
    module: '../features/aurora-bg.js',
    priority: 1,
    mobile: true,
    description: 'Aurora gradient background animation',
  },
  scrollEngine: {
    module: './scroll-engine.js',
    priority: 0,
    mobile: true,
    description: 'Scroll-triggered animations and reveals',
  },
  navigation: {
    module: './navigation.js',
    priority: 0,
    mobile: true,
    description: 'Fixed navigation with mobile menu and active tracking',
  },
  commandPalette: {
    module: '../features/command-palette.js',
    priority: 1,
    mobile: false,
    description: 'Cmd+K command palette',
  },
  liveBuildDemo: {
    module: '../features/live-build-demo.js',
    priority: 1,
    mobile: true,
    description: 'Live website-building demo animation',
  },
  pricingCalc: {
    module: '../features/pricing-calculator.js',
    priority: 0,
    mobile: true,
    description: 'Interactive pricing calculator',
  },
  metricsCounter: {
    module: '../features/metrics-counter.js',
    priority: 0,
    mobile: true,
    description: 'Animated metrics/stats counters',
  },
  stickyCta: {
    module: '../features/sticky-cta.js',
    priority: 0,
    mobile: true,
    description: 'Sticky bottom CTA bar',
  },
  tiltCards: {
    module: '../features/tilt-cards.js',
    priority: 2,
    desktop: true,
    mobile: false,
    description: '3D tilt effect on hover',
  },
  typewriter: {
    module: '../features/typewriter.js',
    priority: 0,
    mobile: true,
    description: 'Typewriter text animation',
  },
  magneticButtons: {
    module: '../features/magnetic-buttons.js',
    priority: 2,
    desktop: true,
    mobile: false,
    description: 'Buttons attracted to cursor',
  },
  smoothScroll: {
    module: '../features/smooth-scroll.js',
    priority: 0,
    mobile: true,
    description: 'Smooth anchor scrolling',
  },
  faqAccordion: {
    module: '../features/faq-accordion.js',
    priority: 0,
    mobile: true,
    description: 'FAQ accordion toggle',
  },
  toolMap: {
    module: '../features/tool-map.js',
    priority: 2,
    desktop: true,
    mobile: false,
    description: 'Interactive tool constellation map',
  },
};


/* ==========================================================================
   DEVICE DETECTION
   ========================================================================== */

/**
 * Detect device capabilities once at startup.
 * Values are cached and exposed on the global NexTool namespace.
 *
 * @returns {Object} device - Immutable device capability object
 */
function detectDevice() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const device = {
    /** Viewport narrower than 768px. */
    isMobile: width < 768,

    /** Viewport between 768px and 1024px. */
    isTablet: width >= 768 && width < 1024,

    /** Viewport 1024px or wider. */
    isDesktop: width >= 1024,

    /** Touch input available. */
    isTouch: isTouchCheck(),

    /** User prefers reduced motion. */
    prefersReducedMotion: prefersReducedMotion(),

    /** Device has a fine pointer (mouse). */
    hasMouse: window.matchMedia('(hover: hover)').matches,

    /** Device pixel ratio, capped at 2 to avoid over-rendering. */
    pixelRatio: Math.min(window.devicePixelRatio || 1, 2),

    /** CSS backdrop-filter support. */
    supportsBackdropFilter: (() => {
      try {
        return CSS.supports('backdrop-filter', 'blur(10px)');
      } catch {
        return false;
      }
    })(),

    /** Canvas 2D available. */
    supportsCanvas: supportsCanvas(),

    /** WebGL available. */
    supportsWebGL: supportsWebGL(),

    /** Viewport width at detection time. */
    viewportWidth: width,

    /** Viewport height at detection time. */
    viewportHeight: height,

    /** Estimated connection quality: 'fast', 'medium', 'slow'. */
    connectionQuality: (() => {
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (!conn) return 'fast';
      if (conn.saveData) return 'slow';
      const ect = conn.effectiveType;
      if (ect === '4g') return 'fast';
      if (ect === '3g') return 'medium';
      return 'slow';
    })(),

    /** Number of logical CPU cores (capped at 8). */
    hardwareConcurrency: Math.min(navigator.hardwareConcurrency || 4, 8),
  };

  return Object.freeze(device);
}


/* ==========================================================================
   STATE
   ========================================================================== */

/** Device capabilities (set once during init). */
let device = null;

/** Global event bus — an EventTarget shared across all modules. */
const events = new EventTarget();

/** Map of loaded feature instances: featureName → { module, state, instance }. */
const loadedFeatures = new Map();

/** FPS monitor instance. */
const fpsMonitor = new FPSMonitor(60);

/** Whether lite mode is currently active. */
let liteModeActive = false;

/** Whether the app has been initialised. */
let isInitialised = false;

/** ID of the FPS monitoring animation frame. */
let fpsRafId = null;

/** Timestamp when low FPS was first detected (for duration tracking). */
let lowFpsStart = 0;

/** List of cleanup functions to call on destroy. */
const cleanupFns = [];

/** Performance metrics collected during load. */
const perfMetrics = {
  initStart: 0,
  initEnd: 0,
  domReady: 0,
  featuresLoaded: {},
};


/* ==========================================================================
   FEATURE LOADING
   ========================================================================== */

/**
 * Determine if a feature should load given the current device state.
 *
 * @param {Object} featureDef - Feature definition from the registry
 * @returns {boolean}
 */
function shouldLoadFeature(featureDef) {
  // If desktop-only and we are not on desktop, skip
  if (featureDef.desktop === true && !device.isDesktop) {
    return false;
  }

  // If mobile is explicitly false and device is touch, skip
  if (featureDef.mobile === false && device.isTouch) {
    return false;
  }

  // If reduced motion and this is a decorative feature, skip
  if (device.prefersReducedMotion && featureDef.priority === 2) {
    return false;
  }

  // If lite mode is active, skip priority-2 features
  if (liteModeActive && featureDef.priority === 2) {
    return false;
  }

  // If slow connection, skip priority-2 features
  if (device.connectionQuality === 'slow' && featureDef.priority >= 2) {
    return false;
  }

  return true;
}

/**
 * Dynamically import a feature module and initialise it.
 *
 * @param {string} name - Feature name (key in featureRegistry)
 * @param {Object} def - Feature definition object
 * @returns {Promise<boolean>} - true if loaded and initialised successfully
 */
async function loadFeature(name, def) {
  // Don't load twice
  if (loadedFeatures.has(name)) return true;

  // Check device eligibility
  if (!shouldLoadFeature(def)) {
    return false;
  }

  const startTime = performance.now();

  try {
    // Dynamic import with timeout
    const modulePromise = import(def.module);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout loading ${name}`)), MODULE_LOAD_TIMEOUT)
    );

    const mod = await Promise.race([modulePromise, timeoutPromise]);

    // Validate module exports
    if (typeof mod.init !== 'function') {
      console.warn(`[NexTool] Feature "${name}" has no init() export — skipping.`);
      return false;
    }

    // Initialise the module
    await mod.init();

    // Store reference
    loadedFeatures.set(name, {
      module: mod,
      state: 'running',
      loadTime: performance.now() - startTime,
    });

    // Record metric
    perfMetrics.featuresLoaded[name] = {
      time: performance.now() - startTime,
      priority: def.priority,
    };

    // Dispatch event
    events.dispatchEvent(
      new CustomEvent('feature-loaded', {
        detail: { name, time: performance.now() - startTime },
      })
    );

    return true;
  } catch (err) {
    // Feature failed to load — not critical, log and continue
    console.warn(`[NexTool] Failed to load feature "${name}":`, err.message || err);
    return false;
  }
}

/**
 * Destroy a loaded feature and remove it from the loaded map.
 *
 * @param {string} name - Feature name
 */
function unloadFeature(name) {
  const entry = loadedFeatures.get(name);
  if (!entry) return;

  try {
    if (typeof entry.module.destroy === 'function') {
      entry.module.destroy();
    }
  } catch (err) {
    console.warn(`[NexTool] Error destroying feature "${name}":`, err.message || err);
  }

  loadedFeatures.delete(name);
}

/**
 * Load all features in a given priority tier.
 *
 * @param {number} priority - 0, 1, or 2
 * @returns {Promise<void>}
 */
async function loadFeaturesByPriority(priority) {
  const toLoad = [];

  for (const [name, def] of Object.entries(featureRegistry)) {
    if (def.priority === priority && !loadedFeatures.has(name)) {
      toLoad.push(loadFeature(name, def));
    }
  }

  // Load in parallel within the same priority tier
  await Promise.allSettled(toLoad);
}


/* ==========================================================================
   FPS MONITORING + LITE MODE
   ========================================================================== */

/**
 * Start the FPS monitoring loop.
 * Runs every frame, but only checks for low-FPS every FPS_SAMPLE_INTERVAL.
 */
function startFPSMonitoring() {
  // Don't monitor if reduced motion (no animations to measure)
  if (device.prefersReducedMotion) return;

  let lastCheck = 0;

  function fpsLoop(now) {
    fpsMonitor.tick(now);

    // Check for sustained low FPS every FPS_SAMPLE_INTERVAL
    if (now - lastCheck > FPS_SAMPLE_INTERVAL) {
      lastCheck = now;

      if (fpsMonitor.isLow(LOW_FPS_THRESHOLD)) {
        if (lowFpsStart === 0) {
          lowFpsStart = now;
        } else if (now - lowFpsStart > LOW_FPS_DURATION) {
          // Sustained low FPS — enter lite mode
          if (!liteModeActive) {
            enableLiteMode('auto');
          }
        }
      } else {
        // FPS recovered — reset timer
        lowFpsStart = 0;
      }
    }

    fpsRafId = requestAnimationFrame(fpsLoop);
  }

  fpsRafId = requestAnimationFrame(fpsLoop);
}

/**
 * Stop the FPS monitoring loop.
 */
function stopFPSMonitoring() {
  if (fpsRafId !== null) {
    cancelAnimationFrame(fpsRafId);
    fpsRafId = null;
  }
}

/**
 * Enter lite mode — disable heavy visual features to improve performance.
 *
 * @param {'auto'|'manual'} reason - Why lite mode was activated
 */
function enableLiteMode(reason = 'manual') {
  if (liteModeActive) return;

  liteModeActive = true;
  setLocal(LITE_MODE_KEY, true);

  // Disable heavy features
  const heavyFeatures = ['particles', 'neuralNetwork', 'tiltCards', 'magneticButtons', 'toolMap'];

  for (const name of heavyFeatures) {
    unloadFeature(name);
  }

  // Add CSS class for any CSS-side optimizations
  document.documentElement.classList.add('nt-lite-mode');

  // Dispatch event
  events.dispatchEvent(
    new CustomEvent('lite-mode-change', {
      detail: { active: true, reason },
    })
  );

  console.info(`[NexTool] Lite mode enabled (${reason}).`);
}

/**
 * Exit lite mode — re-enable decorative features.
 */
function disableLiteMode() {
  if (!liteModeActive) return;

  liteModeActive = false;
  setLocal(LITE_MODE_KEY, false);

  // Remove CSS class
  document.documentElement.classList.remove('nt-lite-mode');

  // Re-load eligible decorative features
  for (const [name, def] of Object.entries(featureRegistry)) {
    if (def.priority === 2 && !loadedFeatures.has(name) && shouldLoadFeature(def)) {
      loadFeature(name, def);
    }
  }

  // Dispatch event
  events.dispatchEvent(
    new CustomEvent('lite-mode-change', {
      detail: { active: false, reason: 'manual' },
    })
  );

  console.info('[NexTool] Lite mode disabled.');
}

/**
 * Toggle lite mode.
 *
 * @param {boolean} [force] - If provided, sets lite mode to this value
 * @returns {boolean} - New lite mode state
 */
function toggleLiteMode(force) {
  const shouldEnable = force !== undefined ? force : !liteModeActive;

  if (shouldEnable) {
    enableLiteMode('manual');
  } else {
    disableLiteMode();
  }

  return liteModeActive;
}


/* ==========================================================================
   GLOBAL NAMESPACE
   ========================================================================== */

/**
 * Build and expose the window.NexTool global namespace.
 * This is the public API that all modules and external scripts can use.
 */
function exposeNamespace() {
  window.NexTool = Object.freeze({
    /** Version string. */
    version: VERSION,

    /** Device capabilities (immutable). */
    device,

    /** Global event bus (EventTarget). */
    events,

    /** Map of loaded feature instances (read-only snapshot). */
    get features() {
      const snapshot = {};
      for (const [name, entry] of loadedFeatures) {
        snapshot[name] = {
          state: entry.state,
          loadTime: entry.loadTime,
        };
      }
      return snapshot;
    },

    /**
     * Smooth-scroll to a target element or selector.
     * @param {string|Element} target - CSS selector or DOM element
     * @param {Object} [options]
     * @param {number} [options.offset=80] - Pixel offset from top
     */
    scrollTo(target, options = {}) {
      const { offset = 80 } = options;
      const el = typeof target === 'string' ? document.querySelector(target) : target;
      if (!el) return;

      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({
        top: Math.max(0, top),
        behavior: device.prefersReducedMotion ? 'auto' : 'smooth',
      });
    },

    /**
     * Open the command palette (Cmd+K).
     */
    openCommandPalette() {
      const cp = loadedFeatures.get('commandPalette');
      if (cp && typeof cp.module.open === 'function') {
        cp.module.open();
      } else {
        console.warn('[NexTool] Command palette not loaded.');
      }
    },

    /**
     * Get performance metrics from the load sequence.
     * @returns {Object}
     */
    getMetrics() {
      return {
        ...perfMetrics,
        fps: fpsMonitor.getFPS(),
        liteMode: liteModeActive,
        loadedFeatures: loadedFeatures.size,
        totalFeatures: Object.keys(featureRegistry).length,
      };
    },

    /**
     * Toggle lite mode on/off.
     * @param {boolean} [force] - Force a specific state
     * @returns {boolean} New lite mode state
     */
    toggleLiteMode,

    /**
     * Is lite mode currently active?
     */
    get isLiteMode() {
      return liteModeActive;
    },
  });
}


/* ==========================================================================
   RESIZE HANDLER
   ========================================================================== */

/**
 * Handle viewport resize — update device state and reload/unload features
 * that depend on breakpoints.
 */
const onResize = debounce(() => {
  const oldDevice = device;
  device = detectDevice();

  // If we crossed the desktop/mobile boundary, adjust features
  const crossedDesktop =
    (oldDevice.isDesktop && !device.isDesktop) || (!oldDevice.isDesktop && device.isDesktop);

  if (crossedDesktop) {
    // Unload desktop-only features if we left desktop
    if (!device.isDesktop) {
      for (const [name, def] of Object.entries(featureRegistry)) {
        if (def.desktop === true && loadedFeatures.has(name)) {
          unloadFeature(name);
        }
      }
    }
    // Load desktop-only features if we entered desktop
    if (device.isDesktop) {
      for (const [name, def] of Object.entries(featureRegistry)) {
        if (def.desktop === true && !loadedFeatures.has(name) && shouldLoadFeature(def)) {
          loadFeature(name, def);
        }
      }
    }

    // Re-expose namespace with updated device
    exposeNamespace();
  }

  // Dispatch resize event on the bus
  events.dispatchEvent(
    new CustomEvent('resize', {
      detail: {
        width: window.innerWidth,
        height: window.innerHeight,
        device,
      },
    })
  );
}, 150);


/* ==========================================================================
   VISIBILITY HANDLER
   ========================================================================== */

/**
 * When the page becomes hidden (tab switch), pause FPS monitoring.
 * When visible again, resume.
 */
function onVisibilityChange() {
  if (document.hidden) {
    stopFPSMonitoring();
    events.dispatchEvent(new CustomEvent('page-hidden'));
  } else {
    startFPSMonitoring();
    events.dispatchEvent(new CustomEvent('page-visible'));
  }
}


/* ==========================================================================
   PAGE LOAD SEQUENCE
   ========================================================================== */

/**
 * The main initialisation function. Orchestrates the full load sequence:
 *
 *   Phase 1: Critical features (priority 0) — immediately
 *   Phase 2: Enhanced features (priority 1) — after DOM ready
 *   Phase 3: Decorative features (priority 2) — on idle or after 2s
 *
 * Also sets up FPS monitoring, global events, and the NexTool namespace.
 */
export async function init() {
  if (isInitialised) return;

  perfMetrics.initStart = performance.now();

  // ── Step 1: Detect device ──
  device = detectDevice();

  // Check if user previously opted into lite mode
  const savedLiteMode = getLocal(LITE_MODE_KEY, false);
  if (savedLiteMode) {
    liteModeActive = true;
    document.documentElement.classList.add('nt-lite-mode');
  }

  // ── Step 2: Expose global namespace (before features load, so they can use it) ──
  exposeNamespace();

  // ── Step 3: Load critical features (priority 0) ──
  // These are needed for core UX: scroll reveals, pricing, metrics, typewriter,
  // FAQ, smooth scroll, sticky CTA.
  await loadFeaturesByPriority(0);

  perfMetrics.domReady = performance.now();

  // ── Step 4: Load enhanced features (priority 1) ──
  // These add significant value: aurora bg, neural network, live demo, command palette.
  // Load them after critical features are up and running.
  await loadFeaturesByPriority(1);

  // ── Step 5: Load decorative features (priority 2) on idle ──
  // These are polish: particles, tilt cards, magnetic buttons, tool map.
  // Use requestIdleCallback if available, otherwise setTimeout.
  if (!liteModeActive) {
    const loadDecorative = () => loadFeaturesByPriority(2);

    if ('requestIdleCallback' in window) {
      const idleId = requestIdleCallback(loadDecorative, { timeout: IDLE_LOAD_DELAY });
      cleanupFns.push(() => cancelIdleCallback(idleId));
    } else {
      const timerId = setTimeout(loadDecorative, IDLE_LOAD_DELAY);
      cleanupFns.push(() => clearTimeout(timerId));
    }
  }

  // ── Step 6: Start FPS monitoring ──
  startFPSMonitoring();

  // ── Step 7: Global event listeners ──
  window.addEventListener('resize', onResize, { passive: true });
  cleanupFns.push(() => window.removeEventListener('resize', onResize));

  document.addEventListener('visibilitychange', onVisibilityChange);
  cleanupFns.push(() => document.removeEventListener('visibilitychange', onVisibilityChange));

  // Keyboard shortcut: Cmd+K / Ctrl+K for command palette
  const onKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      window.NexTool.openCommandPalette();
    }
  };
  document.addEventListener('keydown', onKeyDown);
  cleanupFns.push(() => document.removeEventListener('keydown', onKeyDown));

  // ── Step 8: Record metrics ──
  perfMetrics.initEnd = performance.now();

  const totalTime = Math.round(perfMetrics.initEnd - perfMetrics.initStart);
  console.info(
    `[NexTool] Initialised in ${totalTime}ms — ${loadedFeatures.size}/${Object.keys(featureRegistry).length} features loaded.`
  );

  // Dispatch ready event
  events.dispatchEvent(
    new CustomEvent('ready', {
      detail: {
        time: totalTime,
        features: loadedFeatures.size,
        device: device,
        liteMode: liteModeActive,
      },
    })
  );

  isInitialised = true;
}


/* ==========================================================================
   DESTROY (full teardown)
   ========================================================================== */

/**
 * Tear down the entire application — destroy all features, remove listeners,
 * clean up the global namespace. Useful for SPA transitions or testing.
 */
export function destroy() {
  if (!isInitialised) return;

  // Stop FPS monitoring
  stopFPSMonitoring();

  // Destroy all loaded features
  for (const [name] of loadedFeatures) {
    unloadFeature(name);
  }

  // Run all cleanup functions (event listeners, timeouts, etc.)
  for (const fn of cleanupFns) {
    try {
      fn();
    } catch {
      // Ignore cleanup errors
    }
  }
  cleanupFns.length = 0;

  // Remove lite-mode class
  document.documentElement.classList.remove('nt-lite-mode');

  // Remove global namespace
  if (window.NexTool) {
    delete window.NexTool;
  }

  isInitialised = false;

  console.info('[NexTool] Destroyed.');
}


/* ==========================================================================
   AUTO-INIT
   ========================================================================== */

/**
 * Self-executing initialiser.
 * Waits for DOMContentLoaded if the document is still loading,
 * otherwise initialises immediately.
 */
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
