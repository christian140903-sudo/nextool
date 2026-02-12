/**
 * NexTool Aurora Borealis Background
 * ====================================
 * Animated aurora-style background with large color blobs that slowly morph
 * and drift using smooth sinusoidal movement. Multiple blobs overlap with
 * additive blending for rich color mixing.
 *
 * Canvas ID: 'aurora-canvas'
 *
 * Exports: init(), destroy(), setIntensity()
 */

// ---------------------------------------------------------------------------
//  CONSTANTS
// ---------------------------------------------------------------------------

// Base blob configurations (will be scaled to canvas size)
const BLOB_CONFIGS = [
    { color: { r: 0,   g: 212, b: 255 }, radiusFactor: 0.30, label: 'cyan-1'    },
    { color: { r: 123, g: 97,  b: 255 }, radiusFactor: 0.35, label: 'violet-1'  },
    { color: { r: 0,   g: 255, b: 136 }, radiusFactor: 0.28, label: 'green-1'   },
    { color: { r: 0,   g: 180, b: 255 }, radiusFactor: 0.25, label: 'cyan-2'    },
    { color: { r: 90,  g: 60,  b: 220 }, radiusFactor: 0.32, label: 'violet-2'  },
    { color: { r: 0,   g: 200, b: 100 }, radiusFactor: 0.22, label: 'green-2'   },
];

// How fast blobs move (radians per millisecond multiplied by speed factors)
const BASE_SPEED      = 0.0004;
const SPEED_VARIATION = 0.0003;

// Overall canvas alpha (subtlety control)
const CANVAS_ALPHA_MIN = 0.25;
const CANVAS_ALPHA_MAX = 0.50;

// Blob alpha range
const BLOB_ALPHA_MIN = 0.10;
const BLOB_ALPHA_MAX = 0.22;

// Target framerate (aurora doesn't need 60fps, 20 is fine)
const TARGET_INTERVAL_MS = 50; // ~20fps

// Noise grain overlay alpha
const GRAIN_ALPHA = 0.015;

// Mobile blob reduction
const MOBILE_BLOB_COUNT = 3;

// ---------------------------------------------------------------------------
//  MODULE STATE
// ---------------------------------------------------------------------------

let canvas        = null;
let ctx           = null;
let animFrameId   = null;
let destroyed     = false;
let paused        = false;

let blobs         = [];
let canvasW       = 0;
let canvasH       = 0;
let dpr           = 1;

// Global intensity multiplier (0-1)
let intensity     = 1.0;

// Frame throttle
let lastRenderTs  = 0;

// Noise/grain offscreen canvas (small tile, tiled over canvas)
let grainCanvas   = null;
let grainCtx      = null;
let grainDirty    = true;

// Reduced motion
let prefersReducedMotion = false;

// Resize debounce
let resizeTimer   = null;

// ---------------------------------------------------------------------------
//  AURORA BLOB CLASS
// ---------------------------------------------------------------------------

class AuroraBlob {
    /**
     * @param {object}  config — { color: {r,g,b}, radiusFactor: number }
     * @param {number}  canvasWidth
     * @param {number}  canvasHeight
     */
    constructor(config, canvasWidth, canvasHeight) {
        this.color = config.color;
        this.label = config.label || 'blob';

        // Position: start scattered across the canvas
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;

        // Radius scales with canvas diagonal
        const diag = Math.sqrt(canvasWidth * canvasWidth + canvasHeight * canvasHeight);
        this.radius = diag * config.radiusFactor;

        // Phase offsets for smooth sinusoidal movement (different per blob)
        this.phaseX  = Math.random() * Math.PI * 2;
        this.phaseY  = Math.random() * Math.PI * 2;
        this.phaseR  = Math.random() * Math.PI * 2; // radius wobble
        this.phaseA  = Math.random() * Math.PI * 2; // alpha wobble

        // Speed factors (each blob moves at slightly different rates)
        this.speedX  = BASE_SPEED + Math.random() * SPEED_VARIATION;
        this.speedY  = BASE_SPEED + Math.random() * SPEED_VARIATION;
        this.speedR  = BASE_SPEED * 0.5 + Math.random() * SPEED_VARIATION * 0.3;
        this.speedA  = BASE_SPEED * 0.7 + Math.random() * SPEED_VARIATION * 0.4;

        // Movement amplitude (how far the blob drifts from center)
        this.amplitudeX = canvasWidth * 0.3 + Math.random() * canvasWidth * 0.2;
        this.amplitudeY = canvasHeight * 0.25 + Math.random() * canvasHeight * 0.2;

        // Radius wobble amplitude (subtle breathing)
        this.radiusAmplitude = this.radius * 0.15;

        // Alpha
        this.baseAlpha = BLOB_ALPHA_MIN + Math.random() * (BLOB_ALPHA_MAX - BLOB_ALPHA_MIN);
        this.alpha     = this.baseAlpha;
        this.alphaAmplitude = 0.05;

        // Center point (the equilibrium position the blob oscillates around)
        this.centerX = canvasWidth * (0.2 + Math.random() * 0.6);
        this.centerY = canvasHeight * (0.2 + Math.random() * 0.6);

        // Second harmonic phases for more organic movement
        this.phase2X = Math.random() * Math.PI * 2;
        this.phase2Y = Math.random() * Math.PI * 2;
        this.speed2X = this.speedX * 1.7;
        this.speed2Y = this.speedY * 2.3;
        this.amplitude2X = this.amplitudeX * 0.3;
        this.amplitude2Y = this.amplitudeY * 0.25;
    }

    /**
     * Update position and appearance based on time.
     * Uses multiple sine waves for Perlin-noise-like smooth random movement.
     *
     * @param {number} time — elapsed time in ms
     */
    update(time) {
        // Primary sine wave
        const sx1 = Math.sin(time * this.speedX + this.phaseX);
        const sy1 = Math.sin(time * this.speedY + this.phaseY);

        // Secondary harmonic (smaller, faster oscillation layered on top)
        const sx2 = Math.sin(time * this.speed2X + this.phase2X);
        const sy2 = Math.sin(time * this.speed2Y + this.phase2Y);

        // Third harmonic (even smaller, for organic feel)
        const sx3 = Math.sin(time * this.speedX * 3.1 + this.phaseX * 1.7) * 0.15;
        const sy3 = Math.sin(time * this.speedY * 2.7 + this.phaseY * 2.1) * 0.12;

        // Composite position
        this.x = this.centerX
            + this.amplitudeX * sx1
            + this.amplitude2X * sx2
            + this.amplitudeX * sx3;

        this.y = this.centerY
            + this.amplitudeY * sy1
            + this.amplitude2Y * sy2
            + this.amplitudeY * sy3;

        // Radius breathing
        const rWobble = Math.sin(time * this.speedR + this.phaseR);
        this.currentRadius = this.radius + this.radiusAmplitude * rWobble;

        // Alpha breathing
        const aWobble = Math.sin(time * this.speedA + this.phaseA);
        this.alpha = (this.baseAlpha + this.alphaAmplitude * aWobble) * intensity;
    }

    /**
     * Resize blob dimensions when canvas changes size.
     */
    resize(canvasWidth, canvasHeight) {
        const diag = Math.sqrt(canvasWidth * canvasWidth + canvasHeight * canvasHeight);
        const factor = this.radius > 0
            ? diag / Math.sqrt(
                (this.centerX * 2) * (this.centerX * 2) +
                (this.centerY * 2) * (this.centerY * 2)
              ) || 1
            : 1;

        // Recalculate based on new canvas size using the original radius factor
        this.amplitudeX = canvasWidth * 0.3 + Math.random() * canvasWidth * 0.2;
        this.amplitudeY = canvasHeight * 0.25 + Math.random() * canvasHeight * 0.2;
        this.amplitude2X = this.amplitudeX * 0.3;
        this.amplitude2Y = this.amplitudeY * 0.25;
        this.centerX = canvasWidth * (0.2 + Math.random() * 0.6);
        this.centerY = canvasHeight * (0.2 + Math.random() * 0.6);

        // Recalculate radius from diagonal
        // Keep the ratio consistent
        const origRatio = this.radius / (diag || 1);
        this.radius = diag * clamp(origRatio, 0.15, 0.40);
        this.radiusAmplitude = this.radius * 0.15;
        this.currentRadius = this.radius;
    }
}

// ---------------------------------------------------------------------------
//  UTILITY
// ---------------------------------------------------------------------------

function clamp(val, min, max) {
    return val < min ? min : val > max ? max : val;
}

// ---------------------------------------------------------------------------
//  GRAIN / NOISE OVERLAY
// ---------------------------------------------------------------------------

/**
 * Create a small noise tile (64x64) that gets tiled over the canvas
 * for a subtle film-grain texture.
 */
function createGrainTile() {
    const size = 64;
    if (!grainCanvas) {
        grainCanvas = document.createElement('canvas');
        grainCtx = grainCanvas.getContext('2d');
    }
    grainCanvas.width = size;
    grainCanvas.height = size;

    const imageData = grainCtx.createImageData(size, size);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const val = Math.random() * 255;
        data[i]     = val;     // R
        data[i + 1] = val;     // G
        data[i + 2] = val;     // B
        data[i + 3] = GRAIN_ALPHA * 255; // A
    }

    grainCtx.putImageData(imageData, 0, 0);
    grainDirty = false;
}

/**
 * Draw the grain overlay by tiling the small noise canvas.
 */
function drawGrain() {
    if (!grainCanvas || grainDirty) {
        createGrainTile();
    }

    // Create a pattern from the grain tile
    const pattern = ctx.createPattern(grainCanvas, 'repeat');
    if (!pattern) return;

    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.restore();
}

// ---------------------------------------------------------------------------
//  RENDERING
// ---------------------------------------------------------------------------

/**
 * Draw a single aurora blob as a large radial gradient circle
 * with additive blending.
 */
function drawBlob(blob) {
    if (blob.alpha < 0.005) return;

    const x = blob.x;
    const y = blob.y;
    const r = blob.currentRadius;

    // Radial gradient: colored center fading to transparent
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    const c = blob.color;
    grad.addColorStop(0, `rgba(${c.r}, ${c.g}, ${c.b}, ${blob.alpha})`);
    grad.addColorStop(0.3, `rgba(${c.r}, ${c.g}, ${c.b}, ${blob.alpha * 0.6})`);
    grad.addColorStop(0.6, `rgba(${c.r}, ${c.g}, ${c.b}, ${blob.alpha * 0.2})`);
    grad.addColorStop(1, `rgba(${c.r}, ${c.g}, ${c.b}, 0)`);

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
}

/**
 * Main render function. Draws all blobs with additive blending.
 */
function render(time) {
    // Clear to fully transparent
    ctx.clearRect(0, 0, canvasW, canvasH);

    // Set additive blending for beautiful color overlap
    ctx.globalCompositeOperation = 'lighter';

    // Update and draw each blob
    for (let i = 0; i < blobs.length; i++) {
        blobs[i].update(time);
        drawBlob(blobs[i]);
    }

    // Reset composite operation before grain overlay
    ctx.globalCompositeOperation = 'source-over';

    // Grain overlay (very subtle)
    if (intensity > 0.3) {
        drawGrain();
    }
}

// ---------------------------------------------------------------------------
//  ANIMATION LOOP (throttled to ~20fps)
// ---------------------------------------------------------------------------

function tick(time) {
    if (destroyed || paused) return;
    animFrameId = requestAnimationFrame(tick);

    // Throttle rendering
    const elapsed = time - lastRenderTs;
    if (elapsed < TARGET_INTERVAL_MS) return;
    lastRenderTs = time - (elapsed % TARGET_INTERVAL_MS);

    render(time);
}

// ---------------------------------------------------------------------------
//  EVENT HANDLERS
// ---------------------------------------------------------------------------

function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (!canvas) return;
        setupCanvasSize();

        // Resize blobs
        for (let i = 0; i < blobs.length; i++) {
            blobs[i].resize(canvasW, canvasH);
        }

        grainDirty = true;
    }, 200);
}

/**
 * Size the canvas to fill its parent container.
 */
function setupCanvasSize() {
    const parent = canvas.parentElement || document.body;
    const rect = parent.getBoundingClientRect();

    // For aurora we use 1x DPR to save performance (blobs are large and blurry anyway)
    dpr = 1;

    canvasW = rect.width * dpr;
    canvasH = rect.height * dpr;

    canvas.width = canvasW;
    canvas.height = canvasH;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
}

// ---------------------------------------------------------------------------
//  BLOB CREATION
// ---------------------------------------------------------------------------

/**
 * Create blobs based on viewport. Fewer on mobile.
 */
function createBlobs() {
    const isMobile = window.innerWidth < 768;
    const count = isMobile ? MOBILE_BLOB_COUNT : BLOB_CONFIGS.length;

    blobs = [];
    for (let i = 0; i < count; i++) {
        const config = BLOB_CONFIGS[i % BLOB_CONFIGS.length];
        blobs.push(new AuroraBlob(config, canvasW, canvasH));
    }
}

// ---------------------------------------------------------------------------
//  PUBLIC API
// ---------------------------------------------------------------------------

/**
 * Initialize the aurora background.
 *
 * @param {string} canvasId — id of the <canvas> element (default: 'aurora-canvas')
 * @param {object} options  — optional config
 * @param {number} options.intensity — initial intensity 0-1 (default: 1)
 * @param {boolean} options.grain    — enable grain overlay (default: true)
 */
export function init(canvasId = 'aurora-canvas', options = {}) {
    prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Still render aurora with reduced motion, just make it static
    // (it's decorative background, barely moves)

    canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.warn(`[aurora-bg] Canvas #${canvasId} not found.`);
        return;
    }

    ctx = canvas.getContext('2d', { alpha: true });
    destroyed = false;
    paused = false;
    lastRenderTs = 0;

    // Set intensity
    intensity = typeof options.intensity === 'number'
        ? clamp(options.intensity, 0, 1)
        : 1.0;

    // Set canvas overall alpha via CSS
    const alphaVal = CANVAS_ALPHA_MIN + (CANVAS_ALPHA_MAX - CANVAS_ALPHA_MIN) * intensity;
    canvas.style.opacity = String(alphaVal);

    setupCanvasSize();
    createBlobs();

    // Grain
    grainDirty = true;

    // Events
    window.addEventListener('resize', onResize);

    // If reduced motion, render one static frame and stop
    if (prefersReducedMotion) {
        render(0);
        return;
    }

    // Start loop
    animFrameId = requestAnimationFrame(tick);
}

/**
 * Tear down and release resources.
 */
export function destroy() {
    destroyed = true;
    paused = true;

    if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
    }

    window.removeEventListener('resize', onResize);

    blobs = [];
    grainCanvas = null;
    grainCtx = null;
    canvas = null;
    ctx = null;
}

/**
 * Adjust the aurora intensity at runtime.
 *
 * @param {number} value — 0 (invisible) to 1 (full intensity)
 */
export function setIntensity(value) {
    intensity = clamp(value, 0, 1);
    if (canvas) {
        const alphaVal = CANVAS_ALPHA_MIN + (CANVAS_ALPHA_MAX - CANVAS_ALPHA_MIN) * intensity;
        canvas.style.opacity = String(alphaVal);
    }
}
