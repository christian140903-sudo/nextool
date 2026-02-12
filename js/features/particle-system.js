/**
 * NexTool Cursor Particle Trail System
 * ======================================
 * Emits glowing particles from the cursor position on mouse movement.
 * Particles drift, fade, and shrink over their lifespan. Includes
 * burst mode on click and optional inter-particle connections.
 *
 * Canvas ID: 'particle-canvas'
 * The canvas is fixed-position, full-viewport, pointer-events: none, z-index 600.
 *
 * Exports: init(), destroy(), burst(), setEnabled()
 */

// ---------------------------------------------------------------------------
//  CONSTANTS
// ---------------------------------------------------------------------------

// Pool settings
const MAX_PARTICLES    = 200;
const EMIT_PER_MOVE    = 3;   // particles per mouse-move event
const BURST_COUNT      = 20;  // particles on click
const HOLD_EMIT_RATE   = 4;   // particles per frame while mouse is held

// Particle physics
const GRAVITY          = 0.012;   // gentle downward pull
const FRICTION         = 0.98;
const BASE_LIFE        = 1.0;     // starting life
const LIFE_DECAY_MIN   = 0.008;
const LIFE_DECAY_MAX   = 0.018;
const MIN_SIZE         = 3;
const MAX_SIZE         = 6;
const VELOCITY_SPREAD  = 2.5;     // initial random velocity range
const BURST_VELOCITY   = 5;       // burst particles move faster

// Visuals
const BASE_HUE         = 187;     // cyan hue (degrees)
const HUE_VARIATION    = 20;      // +/- degrees
const CONNECT_DIST     = 80;      // max distance for inter-particle lines
const CONNECT_ALPHA    = 0.06;    // base alpha for connection lines

// Performance
const SKIP_MOBILE      = true;    // disable on touch-only devices

// ---------------------------------------------------------------------------
//  MODULE STATE
// ---------------------------------------------------------------------------

let canvas        = null;
let ctx           = null;
let animFrameId   = null;
let destroyed     = false;
let enabled       = true;
let paused        = false;

// Particle pool (pre-allocated, never GC'd)
let pool          = [];
let aliveCount    = 0;

// Mouse state
let mouseX        = -9999;
let mouseY        = -9999;
let prevMouseX    = -9999;
let prevMouseY    = -9999;
let mouseInWindow = false;
let mouseDown     = false;

// Canvas dimensions
let canvasW       = 0;
let canvasH       = 0;
let dpr           = 1;

// Reduced motion
let prefersReducedMotion = false;

// Is touch-only device
let isTouchOnly   = false;

// Resize debounce
let resizeTimer   = null;

// Option: draw connections between nearby particles
let drawConnections = true;

// ---------------------------------------------------------------------------
//  PARTICLE CLASS
// ---------------------------------------------------------------------------

class Particle {
    constructor() {
        this.alive = false;

        // Position
        this.x = 0;
        this.y = 0;

        // Velocity
        this.vx = 0;
        this.vy = 0;

        // Acceleration (gravity applied each frame)
        this.ax = 0;
        this.ay = 0;

        // Lifespan: 1.0 -> 0.0
        this.life = 0;
        this.lifeDecay = 0;

        // Appearance
        this.size = 0;
        this.baseSize = 0;
        this.hue = BASE_HUE;
        this.saturation = 100;
        this.lightness = 65;
        this.alpha = 1;
    }

    /**
     * Spawn this particle at the given position with given velocity.
     */
    spawn(x, y, vx, vy) {
        this.alive = true;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.ax = 0;
        this.ay = GRAVITY;

        this.life = BASE_LIFE;
        this.lifeDecay = LIFE_DECAY_MIN + Math.random() * (LIFE_DECAY_MAX - LIFE_DECAY_MIN);

        this.baseSize = MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE);
        this.size = this.baseSize;

        this.hue = BASE_HUE + (Math.random() - 0.5) * 2 * HUE_VARIATION;
        this.saturation = 90 + Math.random() * 10;
        this.lightness = 55 + Math.random() * 20;
        this.alpha = 0.8 + Math.random() * 0.2;
    }

    /**
     * Update physics and lifespan.
     * Returns false if the particle has died.
     */
    update() {
        if (!this.alive) return false;

        // Apply acceleration
        this.vx += this.ax;
        this.vy += this.ay;

        // Apply friction
        this.vx *= FRICTION;
        this.vy *= FRICTION;

        // Move
        this.x += this.vx;
        this.y += this.vy;

        // Age
        this.life -= this.lifeDecay;
        if (this.life <= 0) {
            this.alive = false;
            return false;
        }

        // Shrink and fade with life
        this.size = this.baseSize * this.life;
        this.alpha = this.life * 0.9;

        return true;
    }
}

// ---------------------------------------------------------------------------
//  POOL MANAGEMENT
// ---------------------------------------------------------------------------

/**
 * Initialize the particle pool (pre-allocate all objects).
 */
function initPool() {
    pool = [];
    for (let i = 0; i < MAX_PARTICLES; i++) {
        pool.push(new Particle());
    }
    aliveCount = 0;
}

/**
 * Get a dead particle from the pool. Returns null if pool is exhausted.
 */
function acquireParticle() {
    for (let i = 0; i < pool.length; i++) {
        if (!pool[i].alive) {
            return pool[i];
        }
    }
    return null;
}

/**
 * Emit particles at a given position with random spread.
 *
 * @param {number} x
 * @param {number} y
 * @param {number} count     — how many particles to emit
 * @param {number} velScale  — velocity multiplier (higher = faster spread)
 * @param {number} dirX      — optional directional bias X
 * @param {number} dirY      — optional directional bias Y
 */
function emitParticles(x, y, count, velScale, dirX, dirY) {
    velScale = velScale || VELOCITY_SPREAD;
    dirX = dirX || 0;
    dirY = dirY || 0;

    for (let i = 0; i < count; i++) {
        const p = acquireParticle();
        if (!p) break;

        // Random angle for spread
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * velScale;
        const vx = Math.cos(angle) * speed + dirX * 0.3;
        const vy = Math.sin(angle) * speed + dirY * 0.3;

        p.spawn(x, y, vx, vy);
    }
}

// ---------------------------------------------------------------------------
//  RENDERING
// ---------------------------------------------------------------------------

/**
 * Draw a single particle as a radial gradient circle.
 */
function drawParticle(p) {
    if (!p.alive || p.alpha < 0.01 || p.size < 0.3) return;

    const x = p.x;
    const y = p.y;
    const r = p.size;

    // Radial gradient: bright center -> transparent edge
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    const color = `hsla(${p.hue}, ${p.saturation}%, ${p.lightness}%, `;
    grad.addColorStop(0, color + (p.alpha * 0.95) + ')');
    grad.addColorStop(0.4, color + (p.alpha * 0.5) + ')');
    grad.addColorStop(1, color + '0)');

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
}

/**
 * Draw faint connections between nearby alive particles.
 */
function drawParticleConnections() {
    if (!drawConnections) return;

    // Collect alive particles first for efficiency
    const alive = [];
    for (let i = 0; i < pool.length; i++) {
        if (pool[i].alive) alive.push(pool[i]);
    }
    if (alive.length < 2) return;

    const maxDist2 = CONNECT_DIST * CONNECT_DIST;

    ctx.lineWidth = 0.8;

    for (let i = 0; i < alive.length; i++) {
        for (let j = i + 1; j < alive.length; j++) {
            const a = alive[i];
            const b = alive[j];

            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const d2 = dx * dx + dy * dy;
            if (d2 > maxDist2) continue;

            const dist = Math.sqrt(d2);
            const alpha = (1 - dist / CONNECT_DIST) * CONNECT_ALPHA * Math.min(a.alpha, b.alpha);
            if (alpha < 0.003) continue;

            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `hsla(${(a.hue + b.hue) / 2}, 90%, 65%, ${alpha})`;
            ctx.stroke();
        }
    }
}

// ---------------------------------------------------------------------------
//  ANIMATION LOOP
// ---------------------------------------------------------------------------

function tick() {
    if (destroyed || paused) return;
    animFrameId = requestAnimationFrame(tick);

    // Clear
    ctx.clearRect(0, 0, canvasW, canvasH);

    if (!enabled) return;

    // Emit while mouse is held down
    if (mouseDown && mouseInWindow) {
        emitParticles(mouseX, mouseY, HOLD_EMIT_RATE, VELOCITY_SPREAD * 0.8, 0, 0);
    }

    // Update all particles
    aliveCount = 0;
    for (let i = 0; i < pool.length; i++) {
        if (pool[i].alive) {
            pool[i].update();
            if (pool[i].alive) aliveCount++;
        }
    }

    // Draw connections first (behind particles)
    if (aliveCount > 1 && aliveCount < 100) {
        drawParticleConnections();
    }

    // Draw particles
    for (let i = 0; i < pool.length; i++) {
        if (pool[i].alive) {
            drawParticle(pool[i]);
        }
    }
}

// ---------------------------------------------------------------------------
//  EVENT HANDLERS
// ---------------------------------------------------------------------------

function onMouseMove(e) {
    prevMouseX = mouseX;
    prevMouseY = mouseY;
    mouseX = e.clientX * dpr;
    mouseY = e.clientY * dpr;
    mouseInWindow = true;

    if (!enabled) return;

    // Direction of movement (for biased emission)
    const dx = mouseX - prevMouseX;
    const dy = mouseY - prevMouseY;

    emitParticles(mouseX, mouseY, EMIT_PER_MOVE, VELOCITY_SPREAD, dx, dy);
}

function onMouseDown(e) {
    mouseDown = true;
    // Burst on click
    if (enabled && e.button === 0) {
        const px = e.clientX * dpr;
        const py = e.clientY * dpr;
        emitParticles(px, py, BURST_COUNT, BURST_VELOCITY, 0, 0);
    }
}

function onMouseUp() {
    mouseDown = false;
}

function onMouseLeave() {
    mouseInWindow = false;
    mouseDown = false;
}

function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (!canvas) return;
        setupCanvasSize();
    }, 150);
}

/**
 * Size the canvas to fill the viewport.
 */
function setupCanvasSize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvasW = window.innerWidth * dpr;
    canvasH = window.innerHeight * dpr;

    canvas.width = canvasW;
    canvas.height = canvasH;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
}

// ---------------------------------------------------------------------------
//  PUBLIC API
// ---------------------------------------------------------------------------

/**
 * Initialize the cursor particle system.
 *
 * @param {string}  canvasId  — id of the <canvas> element (default: 'particle-canvas')
 * @param {object}  options   — optional config
 * @param {boolean} options.connections — draw inter-particle lines (default: true)
 */
export function init(canvasId = 'particle-canvas', options = {}) {
    // Detect touch-only device
    isTouchOnly = !window.matchMedia('(hover: hover)').matches;
    prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Skip on mobile/touch-only or reduced-motion
    if ((SKIP_MOBILE && isTouchOnly) || prefersReducedMotion) {
        return;
    }

    canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.warn(`[particle-system] Canvas #${canvasId} not found.`);
        return;
    }

    ctx = canvas.getContext('2d', { alpha: true });
    destroyed = false;
    paused = false;
    enabled = true;

    drawConnections = options.connections !== false;

    // Ensure correct CSS
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '600';

    setupCanvasSize();
    initPool();

    // Events — listen on window so we capture movement everywhere
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('resize', onResize);

    // Start loop
    animFrameId = requestAnimationFrame(tick);
}

/**
 * Tear down and release resources.
 */
export function destroy() {
    destroyed = true;
    paused = true;
    enabled = false;

    if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
    }

    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mouseup', onMouseUp);
    document.removeEventListener('mouseleave', onMouseLeave);
    window.removeEventListener('resize', onResize);

    pool = [];
    canvas = null;
    ctx = null;
}

/**
 * Trigger a particle burst at the given position.
 *
 * @param {number} x      — x coordinate (CSS pixels, not canvas pixels)
 * @param {number} y      — y coordinate (CSS pixels)
 * @param {number} count  — number of particles (default: 20)
 */
export function burst(x, y, count = 20) {
    if (!enabled || destroyed) return;
    emitParticles(x * dpr, y * dpr, count, BURST_VELOCITY, 0, 0);
}

/**
 * Enable or disable the particle system at runtime.
 *
 * @param {boolean} value
 */
export function setEnabled(value) {
    enabled = !!value;
    if (!enabled && ctx) {
        ctx.clearRect(0, 0, canvasW, canvasH);
    }
}
