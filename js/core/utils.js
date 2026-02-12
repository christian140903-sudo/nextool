/**
 * NexTool — Core Utilities
 * =========================
 * Shared utility functions used across all feature modules.
 * Pure functions, zero side effects, zero DOM dependencies on import.
 *
 * @module core/utils
 * @version 1.0.0
 */

'use strict';

/* ==========================================================================
   DOM HELPERS
   ========================================================================== */

/**
 * Shorthand querySelector. Returns first matching element or null.
 * @param {string} selector - CSS selector
 * @param {Element|Document} parent - Scope (defaults to document)
 * @returns {Element|null}
 */
export function $(selector, parent = document) {
  return parent.querySelector(selector);
}

/**
 * Shorthand querySelectorAll. Returns a real Array (not NodeList).
 * @param {string} selector - CSS selector
 * @param {Element|Document} parent - Scope (defaults to document)
 * @returns {Element[]}
 */
export function $$(selector, parent = document) {
  return [...parent.querySelectorAll(selector)];
}

/**
 * Create a DOM element with attributes and children in one call.
 *
 * @param {string} tag - HTML tag name
 * @param {Object} attrs - Attribute key/value pairs. 'class' and 'className'
 *   both work. 'style' can be a string or an object. 'dataset' is an object
 *   mapped to data-* attributes. Event listeners are attached via 'on*' keys.
 * @param {(string|Element)[]} children - Text strings or child elements
 * @returns {Element}
 *
 * @example
 *   createElement('button', { class: 'nt-btn', onClick: handler }, ['Click me']);
 */
export function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className' || key === 'class') {
      el.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(el.style, value);
    } else if (key === 'dataset' && typeof value === 'object') {
      for (const [dk, dv] of Object.entries(value)) {
        el.dataset[dk] = dv;
      }
    } else if (key.startsWith('on') && typeof value === 'function') {
      const event = key.slice(2).toLowerCase();
      el.addEventListener(event, value);
    } else if (value === true) {
      el.setAttribute(key, '');
    } else if (value !== false && value != null) {
      el.setAttribute(key, value);
    }
  }

  for (const child of children) {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      el.appendChild(child);
    }
  }

  return el;
}

/**
 * Set multiple CSS custom properties on an element at once.
 * @param {Element} el
 * @param {Object} vars - { '--color': '#fff', '--size': '12px' }
 */
export function setCSSVars(el, vars) {
  for (const [prop, value] of Object.entries(vars)) {
    el.style.setProperty(prop, value);
  }
}


/* ==========================================================================
   MATH
   ========================================================================== */

/**
 * Clamp a value between min and max (inclusive).
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values.
 * @param {number} start
 * @param {number} end
 * @param {number} t - Progress 0..1
 * @returns {number}
 */
export function lerp(start, end, t) {
  return start + (end - start) * t;
}

/**
 * Re-map a value from one range to another.
 * @param {number} value - Input value
 * @param {number} inMin - Input range minimum
 * @param {number} inMax - Input range maximum
 * @param {number} outMin - Output range minimum
 * @param {number} outMax - Output range maximum
 * @returns {number}
 */
export function map(value, inMin, inMax, outMin, outMax) {
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}

/**
 * Euclidean distance between two 2D points.
 */
export function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

/**
 * Random floating-point number in [min, max).
 */
export function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

/**
 * Random integer in [min, max] (inclusive on both ends).
 */
export function randomInt(min, max) {
  return Math.floor(randomRange(min, max + 1));
}

/**
 * Normalize an angle to [0, 2*PI).
 */
export function normalizeAngle(angle) {
  return ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
}

/**
 * Round a number to N decimal places.
 */
export function roundTo(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}


/* ==========================================================================
   EASING FUNCTIONS
   All take a normalised t in [0,1] and return the eased value.
   ========================================================================== */

export const ease = {
  /** No easing — constant speed. */
  linear: (t) => t,

  /** Accelerating from zero velocity. */
  easeInQuad: (t) => t * t,

  /** Decelerating to zero velocity. */
  easeOutQuad: (t) => t * (2 - t),

  /** Acceleration until halfway, then deceleration. */
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  /** Cubic ease-in. */
  easeInCubic: (t) => t * t * t,

  /** Cubic ease-out. */
  easeOutCubic: (t) => {
    const t1 = t - 1;
    return t1 * t1 * t1 + 1;
  },

  /** Cubic ease-in-out. */
  easeInOutCubic: (t) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  /** Elastic ease-out — slight overshoot + spring back. */
  easeOutElastic: (t) => {
    if (t === 0 || t === 1) return t;
    const p = 0.3;
    const s = p / 4;
    return Math.pow(2, -10 * t) * Math.sin(((t - s) * (2 * Math.PI)) / p) + 1;
  },

  /** Bounce ease-out — mimics a ball bouncing to rest. */
  easeOutBounce: (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) { const t2 = t - 1.5 / d1; return n1 * t2 * t2 + 0.75; }
    if (t < 2.5 / d1) { const t2 = t - 2.25 / d1; return n1 * t2 * t2 + 0.9375; }
    const t2 = t - 2.625 / d1;
    return n1 * t2 * t2 + 0.984375;
  },

  /** Ease-out with slight overshoot (back). */
  easeOutBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    const t1 = t - 1;
    return 1 + c3 * t1 * t1 * t1 + c1 * t1 * t1;
  },

  /** Ease-in with slight pull-back. */
  easeInBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },

  /**
   * Spring physics easing — tension controls stiffness.
   * @param {number} t - 0..1
   * @param {number} tension - 0..1, higher = tighter spring (default 0.5)
   * @returns {number}
   */
  spring: (t, tension = 0.5) => {
    const freq = 4.5 + tension * 6;
    const decay = 6 + tension * 8;
    return 1 - Math.exp(-decay * t) * Math.cos(freq * Math.PI * t);
  },
};


/* ==========================================================================
   ANIMATION
   ========================================================================== */

/**
 * General-purpose value animator using requestAnimationFrame.
 *
 * @param {Object} opts
 * @param {number} opts.from - Start value
 * @param {number} opts.to - End value
 * @param {number} opts.duration - Milliseconds
 * @param {Function} [opts.easing=ease.easeOutCubic] - Easing function
 * @param {Function} opts.onUpdate - Called each frame with (currentValue, progress)
 * @param {Function} [opts.onComplete] - Called when animation finishes
 * @returns {{ cancel: Function }} - Call cancel() to abort
 */
export function animate({ from, to, duration, easing = ease.easeOutCubic, onUpdate, onComplete }) {
  let rafId;
  let startTime = null;
  let cancelled = false;

  function frame(timestamp) {
    if (cancelled) return;

    if (startTime === null) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const rawProgress = clamp(elapsed / duration, 0, 1);
    const easedProgress = easing(rawProgress);
    const currentValue = lerp(from, to, easedProgress);

    onUpdate(currentValue, rawProgress);

    if (rawProgress < 1) {
      rafId = requestAnimationFrame(frame);
    } else {
      if (onComplete) onComplete();
    }
  }

  rafId = requestAnimationFrame(frame);

  return {
    cancel() {
      cancelled = true;
      cancelAnimationFrame(rafId);
    },
  };
}

/**
 * Animate a numeric value inside a DOM element (count-up / count-down).
 *
 * @param {Element} element - Target element whose textContent will be updated
 * @param {number} target - Target number
 * @param {Object} [options]
 * @param {number} [options.from=0] - Starting number
 * @param {number} [options.duration=2000] - Duration in ms
 * @param {Function} [options.easing] - Easing function
 * @param {string} [options.prefix=''] - Prefix string (e.g. '$')
 * @param {string} [options.suffix=''] - Suffix string (e.g. '%')
 * @param {number} [options.decimals=0] - Decimal places
 * @param {string} [options.locale='en-US'] - Number formatting locale
 * @param {Function} [options.formatter] - Custom formatter(value)->string
 * @returns {{ cancel: Function }}
 */
export function animateValue(element, target, options = {}) {
  const {
    from = 0,
    duration = 2000,
    easing: easingFn = ease.easeOutCubic,
    prefix = '',
    suffix = '',
    decimals = 0,
    locale = 'en-US',
    formatter,
  } = options;

  return animate({
    from,
    to: target,
    duration,
    easing: easingFn,
    onUpdate(value) {
      if (formatter) {
        element.textContent = formatter(value);
      } else {
        const rounded = decimals > 0 ? value.toFixed(decimals) : Math.round(value);
        const formatted = Number(rounded).toLocaleString(locale);
        element.textContent = `${prefix}${formatted}${suffix}`;
      }
    },
  });
}


/* ==========================================================================
   TIMING
   ========================================================================== */

/**
 * Debounce — delays execution until `delay` ms after last call.
 * @param {Function} fn
 * @param {number} delay - Milliseconds
 * @returns {Function}
 */
export function debounce(fn, delay) {
  let timer;
  return function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Throttle — calls fn at most once every `limit` ms.
 * @param {Function} fn
 * @param {number} limit - Milliseconds
 * @returns {Function}
 */
export function throttle(fn, limit) {
  let waiting = false;
  let lastArgs = null;
  return function throttled(...args) {
    if (waiting) {
      lastArgs = args;
      return;
    }
    fn.apply(this, args);
    waiting = true;
    setTimeout(() => {
      waiting = false;
      if (lastArgs) {
        fn.apply(this, lastArgs);
        lastArgs = null;
      }
    }, limit);
  };
}

/**
 * Throttle to one call per animation frame.
 * Ideal for scroll/resize/mousemove handlers.
 * @param {Function} fn
 * @returns {Function}
 */
export function rafThrottle(fn) {
  let rafId = null;
  return function rafThrottled(...args) {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(() => {
      fn.apply(this, args);
      rafId = null;
    });
  };
}


/* ==========================================================================
   COLOR
   ========================================================================== */

/**
 * Convert hex color to { r, g, b } (0-255).
 * Supports 3-char and 6-char hex, with or without #.
 * @param {string} hex
 * @returns {{ r: number, g: number, b: number }|null}
 */
export function hexToRgb(hex) {
  let h = hex.replace(/^#/, '');
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  if (h.length !== 6) return null;
  const num = parseInt(h, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Convert r, g, b (0-255) to hex string with leading #.
 */
export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((c) => clamp(Math.round(c), 0, 255).toString(16).padStart(2, '0')).join('');
}

/**
 * Return an rgba() string from a hex color and alpha value.
 * @param {string} hex - e.g. '#00E5FF'
 * @param {number} alpha - 0..1
 * @returns {string} e.g. 'rgba(0, 229, 255, 0.5)'
 */
export function adjustAlpha(hex, alpha) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamp(alpha, 0, 1)})`;
}

/**
 * Linearly interpolate between two hex colors.
 * @param {string} color1 - Hex start
 * @param {string} color2 - Hex end
 * @param {number} t - 0..1
 * @returns {string} Hex result
 */
export function lerpColor(color1, color2, t) {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  if (!c1 || !c2) return color1;
  return rgbToHex(
    lerp(c1.r, c2.r, t),
    lerp(c1.g, c2.g, t),
    lerp(c1.b, c2.b, t)
  );
}


/* ==========================================================================
   STRING
   ========================================================================== */

/**
 * Format a number with locale-aware separators.
 * @param {number} num
 * @param {string} locale
 * @returns {string}
 */
export function formatNumber(num, locale = 'en-US') {
  return num.toLocaleString(locale);
}

/**
 * Fuzzy match: does `query` subsequence-match against `text`?
 * Returns { matched: boolean, score: number, indices: number[] }.
 *
 * - Consecutive character matches score higher.
 * - Case-insensitive.
 * - Score is normalised 0..1.
 *
 * @param {string} query
 * @param {string} text
 * @returns {{ matched: boolean, score: number, indices: number[] }}
 */
export function fuzzyMatch(query, text) {
  if (!query) return { matched: true, score: 1, indices: [] };

  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  const indices = [];
  let score = 0;
  let consecutiveBonus = 0;
  let qi = 0;

  for (let ti = 0; ti < textLower.length && qi < queryLower.length; ti++) {
    if (textLower[ti] === queryLower[qi]) {
      indices.push(ti);
      // Bonus for consecutive matches
      score += 1 + consecutiveBonus;
      consecutiveBonus += 0.5;
      // Bonus for matching at word boundaries
      if (ti === 0 || text[ti - 1] === ' ' || text[ti - 1] === '-' || text[ti - 1] === '_') {
        score += 2;
      }
      // Bonus for exact case match
      if (text[ti] === query[qi]) {
        score += 0.5;
      }
      qi++;
    } else {
      consecutiveBonus = 0;
    }
  }

  const matched = qi === queryLower.length;
  // Normalise: max possible score per char ~4.0, divide by query length
  const maxPossiblePerChar = 4;
  const normalised = matched ? clamp(score / (queryLower.length * maxPossiblePerChar), 0, 1) : 0;

  return { matched, score: normalised, indices };
}

/**
 * Truncate a string to maxLen, adding ellipsis if needed.
 */
export function truncate(str, maxLen = 100) {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '\u2026';
}


/* ==========================================================================
   DEVICE DETECTION
   ========================================================================== */

/**
 * Is the viewport narrower than 768px?
 */
export function isMobile() {
  return window.innerWidth < 768;
}

/**
 * Is this a touch-capable device?
 */
export function isTouch() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Does the user prefer reduced motion?
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Can we use a <canvas> 2D context?
 */
export function supportsCanvas() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext && c.getContext('2d'));
  } catch {
    return false;
  }
}

/**
 * Can we get a WebGL context? (needed for GPU-heavy features)
 */
export function supportsWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}


/* ==========================================================================
   PERFORMANCE
   ========================================================================== */

/**
 * FPS monitor — call tick() once per rAF frame, then read getFPS().
 *
 * @example
 *   const fps = new FPSMonitor(60);
 *   function loop() {
 *     fps.tick();
 *     console.log(fps.getFPS());
 *     requestAnimationFrame(loop);
 *   }
 */
export class FPSMonitor {
  /**
   * @param {number} sampleSize - Number of frames to average over
   */
  constructor(sampleSize = 60) {
    this._sampleSize = sampleSize;
    this._frameTimes = [];
    this._lastTime = 0;
    this._fps = 60;
  }

  /**
   * Call once per animation frame.
   * @param {number} [now] - Current timestamp from rAF callback (optional)
   */
  tick(now) {
    if (now === undefined) now = performance.now();

    if (this._lastTime > 0) {
      const delta = now - this._lastTime;
      this._frameTimes.push(delta);

      // Keep only the most recent samples
      if (this._frameTimes.length > this._sampleSize) {
        this._frameTimes.shift();
      }

      // Compute average FPS from frame times
      if (this._frameTimes.length >= 5) {
        const avgDelta = this._frameTimes.reduce((a, b) => a + b, 0) / this._frameTimes.length;
        this._fps = avgDelta > 0 ? 1000 / avgDelta : 60;
      }
    }

    this._lastTime = now;
  }

  /**
   * Current smoothed FPS.
   * @returns {number}
   */
  getFPS() {
    return Math.round(this._fps);
  }

  /**
   * Is FPS below the given threshold?
   * @param {number} threshold
   * @returns {boolean}
   */
  isLow(threshold = 30) {
    return this._fps < threshold;
  }

  /**
   * Reset all collected samples.
   */
  reset() {
    this._frameTimes = [];
    this._lastTime = 0;
    this._fps = 60;
  }
}


/**
 * Generic object pool — avoids GC pressure for frequently created/destroyed objects.
 *
 * @example
 *   const pool = new ObjectPool(
 *     () => ({ x: 0, y: 0, vx: 0, vy: 0 }),   // factory
 *     (obj) => { obj.x = 0; obj.y = 0; obj.vx = 0; obj.vy = 0; }, // reset
 *     200  // initial size
 *   );
 *   const particle = pool.get();
 *   // ... use particle ...
 *   pool.release(particle);
 */
export class ObjectPool {
  /**
   * @param {Function} factory - Creates a new object
   * @param {Function} reset - Resets an object to initial state
   * @param {number} initialSize - Pre-allocate this many objects
   */
  constructor(factory, reset, initialSize = 100) {
    this._factory = factory;
    this._reset = reset;
    this._pool = [];
    this._activeCount = 0;

    // Pre-allocate
    for (let i = 0; i < initialSize; i++) {
      this._pool.push(factory());
    }
  }

  /**
   * Get an object from the pool (or create one if empty).
   * @returns {*}
   */
  get() {
    this._activeCount++;
    if (this._pool.length > 0) {
      return this._pool.pop();
    }
    return this._factory();
  }

  /**
   * Return an object to the pool after resetting it.
   * @param {*} obj
   */
  release(obj) {
    this._activeCount = Math.max(0, this._activeCount - 1);
    this._reset(obj);
    this._pool.push(obj);
  }

  /**
   * How many objects are currently checked out?
   */
  get activeCount() {
    return this._activeCount;
  }

  /**
   * How many objects are available in the pool?
   */
  get availableCount() {
    return this._pool.length;
  }
}


/* ==========================================================================
   STORAGE
   ========================================================================== */

/**
 * Safely read from localStorage (returns fallback on error or missing key).
 * @param {string} key
 * @param {*} fallback
 * @returns {*}
 */
export function getLocal(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * Safely write to localStorage (JSON-serialises value).
 * @param {string} key
 * @param {*} value
 */
export function setLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked — silently fail
  }
}

/**
 * Remove a key from localStorage.
 */
export function removeLocal(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Silently fail
  }
}


/* ==========================================================================
   EVENTS
   ========================================================================== */

/**
 * Add a one-time event listener.
 * @param {EventTarget} element
 * @param {string} event
 * @param {Function} handler
 */
export function once(element, event, handler) {
  element.addEventListener(event, handler, { once: true });
}

/**
 * Fire a callback when an element becomes visible in the viewport.
 * Uses IntersectionObserver — much cheaper than scroll listeners.
 *
 * @param {Element} element - Element to observe
 * @param {Function} callback - Called with (element, entry) when visible
 * @param {Object} [options]
 * @param {number} [options.threshold=0.1] - Visibility threshold 0..1
 * @param {string} [options.rootMargin='0px'] - Observer root margin
 * @param {boolean} [options.once=true] - Unobserve after first trigger
 * @returns {{ disconnect: Function }} - Call disconnect() to stop observing
 */
export function onVisible(element, callback, options = {}) {
  const {
    threshold = 0.1,
    rootMargin = '0px',
    once: onceOnly = true,
  } = options;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          callback(element, entry);
          if (onceOnly) {
            observer.unobserve(element);
          }
        }
      }
    },
    { threshold, rootMargin }
  );

  observer.observe(element);

  return {
    disconnect() {
      observer.disconnect();
    },
  };
}

/**
 * Await a specified number of milliseconds (promise-based delay).
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Await the next animation frame.
 * @returns {Promise<number>} Resolves with the rAF timestamp
 */
export function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}


/* ==========================================================================
   MISC
   ========================================================================== */

/**
 * Generate a short unique ID (not cryptographically secure, but fine for DOM).
 * @param {string} prefix
 * @returns {string}
 */
export function uid(prefix = 'nt') {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Deep-freeze an object (makes it truly immutable).
 * @param {Object} obj
 * @returns {Object}
 */
export function deepFreeze(obj) {
  Object.freeze(obj);
  for (const value of Object.values(obj)) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  }
  return obj;
}

/**
 * No-op function — useful as a default callback.
 */
export function noop() {}
