/**
 * NexTool Neural Network Visualization
 * =====================================
 * A full-screen canvas neural network with 213 nodes representing NexTool's
 * 213 free tools. Uses Verlet integration physics, force-directed layout,
 * spatial hashing for performance, and mouse interactivity.
 *
 * Features:
 *   - Verlet integration physics engine
 *   - Spatial hash grid for O(n) neighbor lookups
 *   - Force-directed layout: repulsion, spring attraction, center gravity
 *   - Mouse attraction / right-click repulsion
 *   - Logo formation animation ("NT" letterforms)
 *   - Category clustering mode
 *   - Data-flow particles along connections
 *   - Adaptive quality: auto-reduces effects if FPS drops below 30
 *   - Responsive: adjusts node count per viewport tier
 *   - Background grid, node trails, ripple effects, hover labels
 *
 * Canvas ID: 'neural-canvas'
 *
 * Exports: init(), destroy(), formLogo(), setMode()
 */

// ---------------------------------------------------------------------------
//  CONSTANTS
// ---------------------------------------------------------------------------

const CATEGORY_COLORS = {
    text:    { r: 0,   g: 212, b: 255, hex: '#00d4ff' },  // cyan
    dev:     { r: 123, g: 97,  b: 255, hex: '#7b61ff' },  // violet
    design:  { r: 0,   g: 255, b: 136, hex: '#00ff88' },  // green
    data:    { r: 255, g: 107, b: 53,  hex: '#ff6b35' },  // orange
    media:   { r: 255, g: 71,  b: 87,  hex: '#ff4757' },  // red
    utility: { r: 136, g: 136, b: 170, hex: '#8888aa' },  // dim
};

const CATEGORIES = Object.keys(CATEGORY_COLORS);

const CATEGORY_LABELS = {
    text: 'Text Tools',
    dev: 'Developer',
    design: 'Design',
    data: 'Data',
    media: 'Media',
    utility: 'Utility',
};

// How many nodes per viewport tier
const NODE_COUNTS = { desktop: 213, tablet: 80, mobile: 40 };

// Physics tunables
const REPULSION_STRENGTH   = 800;
const REPULSION_MAX_DIST   = 120;
const SPRING_STIFFNESS     = 0.004;
const SPRING_REST_LENGTH   = 60;
const CENTER_GRAVITY       = 0.00008;
const MOUSE_ATTRACT_RADIUS = 200;
const MOUSE_ATTRACT_FORCE  = 0.06;
const MOUSE_REPULSE_FORCE  = 0.12;
const DAMPING              = 0.98;
const BOUNDARY_BOUNCE      = 0.5;

// Spatial hash cell size (must be >= REPULSION_MAX_DIST for correctness)
const CELL_SIZE = 130;

// Data-flow particle settings
const MAX_FLOW_PARTICLES  = 300;
const FLOW_PARTICLE_SPEED = 0.6;
const FLOW_PARTICLE_SIZE  = 1.8;

// Performance adaptive quality
const FPS_THRESHOLD     = 30;
const FPS_SAMPLE_FRAMES = 60;

// Logo formation
const LOGO_HOLD_MS  = 3000;
const LOGO_EASE_DUR = 1800; // ms for elastic ease

// ---------------------------------------------------------------------------
//  MODULE STATE
// ---------------------------------------------------------------------------

let canvas       = null;
let ctx          = null;
let animFrameId  = null;
let destroyed    = false;
let paused       = false;

let nodes        = [];
let connections  = [];
let flowPool     = [];
let spatialGrid  = null;

let canvasW = 0;
let canvasH = 0;
let dpr     = 1;

// Mouse state
let mouseX   = -9999;
let mouseY   = -9999;
let mouseIn  = false;
let rightDown = false;

// Mode: 'float' | 'logo' | 'cluster'
let currentMode     = 'float';
let isClusterMode   = false; // true when clusterByCategory was the trigger
let logoStartTime   = 0;
let logoHoldTimer   = null;

// Performance monitoring
let fpsHistory   = [];
let lastFrameTs  = 0;
let qualityLevel = 2; // 2=full, 1=reduced, 0=minimal
let frameCount   = 0;

// Offscreen canvas for background grid
let gridCanvas  = null;
let gridCtx     = null;
let gridDirty   = true;

// Preferred reduced motion
let prefersReducedMotion = false;

// Resize debounce
let resizeTimer = null;

// Hovered node reference
let hoveredNode = null;

// ---------------------------------------------------------------------------
//  UTILITY HELPERS
// ---------------------------------------------------------------------------

/**
 * Clamp value between min and max.
 */
function clamp(val, min, max) {
    return val < min ? min : val > max ? max : val;
}

/**
 * Linear interpolation.
 */
function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Distance squared between two points.
 */
function dist2(ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    return dx * dx + dy * dy;
}

/**
 * Distance between two points.
 */
function dist(ax, ay, bx, by) {
    return Math.sqrt(dist2(ax, ay, bx, by));
}

/**
 * Elastic ease-out for logo formation.
 * t in [0,1] -> eased value
 */
function elasticOut(t) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    const p = 0.4;
    return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
}

/**
 * Convert an rgb object {r,g,b} to an rgba string.
 */
function rgba(c, a) {
    return `rgba(${c.r},${c.g},${c.b},${a})`;
}

/**
 * Return the current desired node count based on viewport width.
 */
function getNodeCount() {
    const w = window.innerWidth;
    if (w < 600)  return NODE_COUNTS.mobile;
    if (w < 1024) return NODE_COUNTS.tablet;
    return NODE_COUNTS.desktop;
}

/**
 * Pick a random category with weighted distribution roughly matching
 * real NexTool tool category proportions.
 */
function randomCategory() {
    const weights = [0.22, 0.24, 0.12, 0.18, 0.10, 0.14];
    let r = Math.random();
    for (let i = 0; i < CATEGORIES.length; i++) {
        r -= weights[i];
        if (r <= 0) return CATEGORIES[i];
    }
    return CATEGORIES[CATEGORIES.length - 1];
}

/**
 * Helper: draw a rounded rectangle path (does not fill/stroke — caller does).
 */
function roundRect(context, x, y, w, h, r) {
    context.moveTo(x + r, y);
    context.lineTo(x + w - r, y);
    context.arcTo(x + w, y, x + w, y + r, r);
    context.lineTo(x + w, y + h - r);
    context.arcTo(x + w, y + h, x + w - r, y + h, r);
    context.lineTo(x + r, y + h);
    context.arcTo(x, y + h, x, y + h - r, r);
    context.lineTo(x, y + r);
    context.arcTo(x, y, x + r, y, r);
    context.closePath();
}

// ---------------------------------------------------------------------------
//  SPATIAL HASH GRID — O(n) neighbor queries instead of O(n^2)
// ---------------------------------------------------------------------------

class SpatialHash {
    constructor(cellSize, width, height) {
        this.cellSize = cellSize;
        this.cols = Math.ceil(width / cellSize) + 1;
        this.rows = Math.ceil(height / cellSize) + 1;
        this.cells = new Array(this.cols * this.rows);
        this.clear();
    }

    /**
     * Clear all cells (reuse arrays to avoid garbage).
     */
    clear() {
        for (let i = 0; i < this.cells.length; i++) {
            if (this.cells[i]) {
                this.cells[i].length = 0;
            } else {
                this.cells[i] = [];
            }
        }
    }

    /**
     * Compute the cell key for a given world position.
     */
    _key(x, y) {
        const col = clamp(Math.floor(x / this.cellSize), 0, this.cols - 1);
        const row = clamp(Math.floor(y / this.cellSize), 0, this.rows - 1);
        return row * this.cols + col;
    }

    /**
     * Insert a node into the grid.
     */
    insert(node) {
        const key = this._key(node.x, node.y);
        this.cells[key].push(node);
    }

    /**
     * Return all nodes in the same cell and the 8 surrounding cells.
     */
    queryNeighbors(x, y) {
        const col = clamp(Math.floor(x / this.cellSize), 0, this.cols - 1);
        const row = clamp(Math.floor(y / this.cellSize), 0, this.rows - 1);
        const result = [];
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const r = row + dr;
                const c = col + dc;
                if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) continue;
                const cell = this.cells[r * this.cols + c];
                for (let i = 0; i < cell.length; i++) {
                    result.push(cell[i]);
                }
            }
        }
        return result;
    }
}

// ---------------------------------------------------------------------------
//  NODE CLASS
// ---------------------------------------------------------------------------

class Node {
    /**
     * @param {number} x
     * @param {number} y
     * @param {string} category  — one of CATEGORIES
     * @param {string} label     — tool name
     * @param {number} index     — node index in array
     */
    constructor(x, y, category, label, index) {
        // Current position
        this.x = x;
        this.y = y;

        // Previous position for Verlet integration
        this.prevX = x;
        this.prevY = y;

        // Logo formation / cluster target position
        this.targetX = x;
        this.targetY = y;

        // Velocity components (computed from Verlet delta, used for trails)
        this.vx = 0;
        this.vy = 0;

        // Accumulated forces this frame
        this.fx = 0;
        this.fy = 0;

        // Appearance
        this.baseRadius = 3 + Math.random() * 4;
        this.radius = this.baseRadius;
        this.category = category;
        this.color = CATEGORY_COLORS[category];
        this.label = label;
        this.index = index;

        // Connection indices (into the connections array)
        this.connectionIndices = [];

        // Animation state
        this.alpha = 0.8;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.isHovered = false;
        this.isActive = false;

        // Ripple effect (click)
        this.rippleRadius = 0;
        this.rippleAlpha = 0;

        // Trail: recent positions for motion blur
        this.trail = [];
        this.trailMax = 6;
    }

    /**
     * Accumulate a force on this node.
     */
    addForce(fx, fy) {
        this.fx += fx;
        this.fy += fy;
    }

    /**
     * Verlet integration step.
     * dt is fixed at 1 (constant timestep normalized per frame).
     */
    integrate(dt) {
        const vx = (this.x - this.prevX) * DAMPING + this.fx * dt * dt;
        const vy = (this.y - this.prevY) * DAMPING + this.fy * dt * dt;

        this.prevX = this.x;
        this.prevY = this.y;

        this.x += vx;
        this.y += vy;

        // Store velocity for trail / speed checks
        this.vx = vx;
        this.vy = vy;

        // Reset accumulated forces
        this.fx = 0;
        this.fy = 0;
    }

    /**
     * Constrain node within canvas boundaries with bounce.
     */
    constrain(w, h) {
        const margin = this.radius + 2;

        if (this.x < margin) {
            this.x = margin;
            this.prevX = this.x + (this.x - this.prevX) * BOUNDARY_BOUNCE;
        }
        if (this.x > w - margin) {
            this.x = w - margin;
            this.prevX = this.x + (this.x - this.prevX) * BOUNDARY_BOUNCE;
        }
        if (this.y < margin) {
            this.y = margin;
            this.prevY = this.y + (this.y - this.prevY) * BOUNDARY_BOUNCE;
        }
        if (this.y > h - margin) {
            this.y = h - margin;
            this.prevY = this.y + (this.y - this.prevY) * BOUNDARY_BOUNCE;
        }
    }

    /**
     * Update per-frame animation state: pulse, hover scale, ripple, trail.
     */
    animate(time) {
        // Pulsing radius
        const pulse = Math.sin(time * 0.002 + this.pulsePhase) * 0.15 + 1.0;
        const hoverScale = this.isHovered ? 2.0 : 1.0;
        this.radius = this.baseRadius * pulse * hoverScale;

        // Alpha oscillation
        this.alpha = this.isHovered
            ? 1.0
            : 0.6 + Math.sin(time * 0.003 + this.pulsePhase) * 0.2;

        // Ripple decay
        if (this.rippleAlpha > 0) {
            this.rippleRadius += 3;
            this.rippleAlpha *= 0.94;
            if (this.rippleAlpha < 0.01) this.rippleAlpha = 0;
        }

        // Motion trail
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > 1.5 && qualityLevel >= 2) {
            this.trail.push({ x: this.x, y: this.y, a: 0.3 });
            if (this.trail.length > this.trailMax) this.trail.shift();
        } else if (this.trail.length > 0) {
            // Fade existing trail
            for (let i = this.trail.length - 1; i >= 0; i--) {
                this.trail[i].a *= 0.85;
                if (this.trail[i].a < 0.01) {
                    this.trail.splice(i, 1);
                }
            }
        }
    }

    /**
     * Trigger a click ripple emanating from this node.
     */
    triggerRipple() {
        this.rippleRadius = this.radius;
        this.rippleAlpha = 0.6;
    }
}

// ---------------------------------------------------------------------------
//  CONNECTION CLASS
// ---------------------------------------------------------------------------

class Connection {
    /**
     * @param {number} nodeA — index into nodes array
     * @param {number} nodeB — index into nodes array
     */
    constructor(nodeA, nodeB) {
        this.a = nodeA;
        this.b = nodeB;
        this.baseAlpha = 0.08;
        this.alpha = this.baseAlpha;
        this.dashOffset = Math.random() * 100;
        this.active = false; // true when a connected node is hovered
    }
}

// ---------------------------------------------------------------------------
//  FLOW PARTICLE — data-flow dots traveling along connections
// ---------------------------------------------------------------------------

class FlowParticle {
    constructor() {
        this.alive = false;
        this.connIdx = -1;
        this.t = 0;         // progress along connection [0..1]
        this.speed = 0;
        this.direction = 1;  // +1 or -1
        this.x = 0;
        this.y = 0;
        this.alpha = 0;
        this.size = FLOW_PARTICLE_SIZE;
    }

    /**
     * Spawn on a specific connection.
     */
    spawn(connIdx) {
        this.alive = true;
        this.connIdx = connIdx;
        this.t = 0;
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.speed = (FLOW_PARTICLE_SPEED + Math.random() * 0.4) * 0.01;
        this.alpha = 0.5 + Math.random() * 0.3;
        this.size = FLOW_PARTICLE_SIZE + Math.random() * 1;
    }

    /**
     * Advance particle along its connection. Returns false if dead.
     */
    update(nodesArr, connsArr) {
        if (!this.alive) return false;

        this.t += this.speed * this.direction;
        if (this.t > 1 || this.t < 0) {
            this.alive = false;
            return false;
        }

        const conn = connsArr[this.connIdx];
        if (!conn) { this.alive = false; return false; }

        const a = nodesArr[conn.a];
        const b = nodesArr[conn.b];
        if (!a || !b) { this.alive = false; return false; }

        this.x = lerp(a.x, b.x, this.t);
        this.y = lerp(a.y, b.y, this.t);

        // Fade near endpoints for smooth appear/disappear
        const edgeFade = Math.min(this.t, 1 - this.t) * 5;
        this.alpha = clamp(edgeFade, 0, 0.7);

        return true;
    }
}

// ---------------------------------------------------------------------------
//  LOGO PATH GENERATOR — generates "NT" letter paths as point sets
// ---------------------------------------------------------------------------

/**
 * Generate target positions for nodes to form the letters "NT".
 * Returns an array of {x, y} with length === count.
 */
function generateLogoTargets(count, w, h) {
    const targets = [];
    const cx = w / 2;
    const cy = h / 2;

    // Letter dimensions (responsive to canvas size)
    const letterH = Math.min(h * 0.35, 260);
    const letterW = letterH * 0.6;
    const gap = letterW * 0.4;
    const totalW = letterW * 2 + gap;
    const startX = cx - totalW / 2;
    const startY = cy - letterH / 2;

    // Generate points along letter strokes
    const letterPoints = [];

    // --- Letter N ---
    const nLeft   = startX;
    const nRight  = startX + letterW;
    const nTop    = startY;
    const nBottom = startY + letterH;

    // N: Left vertical stroke
    const nLeftSteps = Math.ceil(count * 0.18);
    for (let i = 0; i < nLeftSteps; i++) {
        const t = i / (nLeftSteps - 1 || 1);
        letterPoints.push({ x: nLeft, y: lerp(nTop, nBottom, t) });
    }

    // N: Diagonal stroke
    const nDiagSteps = Math.ceil(count * 0.16);
    for (let i = 0; i < nDiagSteps; i++) {
        const t = i / (nDiagSteps - 1 || 1);
        letterPoints.push({ x: lerp(nLeft, nRight, t), y: lerp(nTop, nBottom, t) });
    }

    // N: Right vertical stroke
    const nRightSteps = Math.ceil(count * 0.18);
    for (let i = 0; i < nRightSteps; i++) {
        const t = i / (nRightSteps - 1 || 1);
        letterPoints.push({ x: nRight, y: lerp(nTop, nBottom, t) });
    }

    // --- Letter T ---
    const tLeft   = startX + letterW + gap;
    const tRight  = tLeft + letterW;
    const tMidX   = (tLeft + tRight) / 2;
    const tTop    = startY;
    const tBottom = startY + letterH;

    // T: Horizontal top bar
    const tBarSteps = Math.ceil(count * 0.22);
    for (let i = 0; i < tBarSteps; i++) {
        const t = i / (tBarSteps - 1 || 1);
        letterPoints.push({ x: lerp(tLeft, tRight, t), y: tTop });
    }

    // T: Vertical center stroke
    const tVertSteps = Math.ceil(count * 0.26);
    for (let i = 0; i < tVertSteps; i++) {
        const t = i / (tVertSteps - 1 || 1);
        letterPoints.push({ x: tMidX, y: lerp(tTop, tBottom, t) });
    }

    // Pad to exact count if we have fewer points than nodes
    while (letterPoints.length < count) {
        const src = letterPoints[Math.floor(Math.random() * letterPoints.length)];
        letterPoints.push({
            x: src.x + (Math.random() - 0.5) * 8,
            y: src.y + (Math.random() - 0.5) * 8
        });
    }

    // Shuffle so nodes don't all travel to adjacent targets (more visual interest)
    for (let i = letterPoints.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = letterPoints[i];
        letterPoints[i] = letterPoints[j];
        letterPoints[j] = tmp;
    }

    for (let i = 0; i < count; i++) {
        targets.push(letterPoints[i]);
    }

    return targets;
}

// ---------------------------------------------------------------------------
//  TOOL LABEL BANK
// ---------------------------------------------------------------------------

const TOOL_LABELS = [
    'JSON Formatter', 'Base64 Encode', 'Color Picker', 'Regex Tester',
    'Hash Generator', 'UUID Generator', 'CSS Minifier', 'JS Beautifier',
    'URL Encoder', 'HTML Escape', 'Markdown Preview', 'Lorem Ipsum',
    'Image Compress', 'SVG Optimizer', 'Favicon Generator', 'QR Code',
    'YAML Validator', 'XML Formatter', 'JWT Decoder', 'Cron Parser',
    'Timestamp Convert', 'Unit Converter', 'Password Gen', 'Diff Tool',
    'SQL Formatter', 'CSV to JSON', 'Text Counter', 'Slug Generator',
    'IP Lookup', 'DNS Check', 'HTTP Headers', 'Whois Lookup',
    'PDF Merge', 'OCR Extract', 'Font Preview', 'Gradient Maker',
    'Box Shadow', 'Flex Playground', 'Grid Builder', 'Aspect Ratio',
    'Chmod Calc', 'Subnet Calc', 'Binary Convert', 'Hex to RGB',
    'HSL Picker', 'Meta Tag Gen', 'OG Preview', 'Robots.txt Gen',
    'Sitemap Gen', 'Speed Test', 'Contrast Check', 'Emoji Picker',
    'Code Screenshot', 'ASCII Art', 'Punycode', 'TOML Parser',
    'Hex Editor', 'Pixel Counter', 'Word Cloud', 'File Hasher',
    'DNS Propagation', 'SSL Checker', 'HTTP Status', 'User Agent',
];

function getLabel(index) {
    if (index < TOOL_LABELS.length) return TOOL_LABELS[index];
    return `Tool #${index + 1}`;
}

// ---------------------------------------------------------------------------
//  INITIALIZATION HELPERS
// ---------------------------------------------------------------------------

/**
 * Create all nodes scattered randomly across the canvas.
 */
function createNodes(count, w, h) {
    const arr = [];
    for (let i = 0; i < count; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const cat = randomCategory();
        const label = getLabel(i);
        arr.push(new Node(x, y, cat, label, i));
    }
    return arr;
}

/**
 * Build connections: each node connects to its 2-4 nearest neighbors.
 * Uses brute-force distance computation (runs once at init, not per frame).
 */
function buildConnections(nodesArr) {
    const conns = [];
    const connSet = new Set();

    for (let i = 0; i < nodesArr.length; i++) {
        // Compute distances to all other nodes
        const dists = [];
        for (let j = 0; j < nodesArr.length; j++) {
            if (i === j) continue;
            dists.push({
                idx: j,
                d: dist2(nodesArr[i].x, nodesArr[i].y, nodesArr[j].x, nodesArr[j].y)
            });
        }
        dists.sort((a, b) => a.d - b.d);

        // Connect to 2-4 nearest
        const connCount = 2 + Math.floor(Math.random() * 3);
        let added = 0;
        for (let k = 0; k < dists.length && added < connCount; k++) {
            const j = dists[k].idx;
            const key = i < j ? `${i}-${j}` : `${j}-${i}`;
            if (!connSet.has(key)) {
                connSet.add(key);
                const connIdx = conns.length;
                conns.push(new Connection(i, j));
                nodesArr[i].connectionIndices.push(connIdx);
                nodesArr[j].connectionIndices.push(connIdx);
            }
            added++;
        }
    }
    return conns;
}

/**
 * Initialize the flow particle pool (pre-allocated, no GC).
 */
function initFlowPool() {
    flowPool = [];
    for (let i = 0; i < MAX_FLOW_PARTICLES; i++) {
        flowPool.push(new FlowParticle());
    }
}

/**
 * Get a dead particle from the pool (returns null if all alive).
 */
function getFlowParticle() {
    for (let i = 0; i < flowPool.length; i++) {
        if (!flowPool[i].alive) return flowPool[i];
    }
    return null;
}

/**
 * Spawn new flow particles on random active connections.
 */
function spawnFlowParticles() {
    if (qualityLevel < 1) return;
    if (connections.length === 0) return;

    const spawnCount = qualityLevel >= 2 ? 2 : 1;
    for (let i = 0; i < spawnCount; i++) {
        const p = getFlowParticle();
        if (!p) break;
        const ci = Math.floor(Math.random() * connections.length);
        if (connections[ci].alpha > 0.04) {
            p.spawn(ci);
        }
    }
}

// ---------------------------------------------------------------------------
//  BACKGROUND GRID (offscreen canvas, drawn once per resize)
// ---------------------------------------------------------------------------

function createGridCanvas(w, h) {
    if (!gridCanvas) {
        gridCanvas = document.createElement('canvas');
        gridCtx = gridCanvas.getContext('2d');
    }
    gridCanvas.width = w;
    gridCanvas.height = h;

    gridCtx.clearRect(0, 0, w, h);
    gridCtx.strokeStyle = 'rgba(255,255,255,0.018)';
    gridCtx.lineWidth = 1;

    const step = 60;
    gridCtx.beginPath();
    for (let x = 0; x <= w; x += step) {
        gridCtx.moveTo(x + 0.5, 0);
        gridCtx.lineTo(x + 0.5, h);
    }
    for (let y = 0; y <= h; y += step) {
        gridCtx.moveTo(0, y + 0.5);
        gridCtx.lineTo(w, y + 0.5);
    }
    gridCtx.stroke();
    gridDirty = false;
}

// ---------------------------------------------------------------------------
//  PHYSICS
// ---------------------------------------------------------------------------

/**
 * Apply all forces to nodes for one physics step.
 */
function applyForces(time) {
    const w = canvasW;
    const h = canvasH;

    // Rebuild spatial grid
    spatialGrid.clear();
    for (let i = 0; i < nodes.length; i++) {
        spatialGrid.insert(nodes[i]);
    }

    // --- Node-to-node repulsion (via spatial hash) ---
    for (let i = 0; i < nodes.length; i++) {
        const ni = nodes[i];
        const neighbors = spatialGrid.queryNeighbors(ni.x, ni.y);

        for (let k = 0; k < neighbors.length; k++) {
            const nj = neighbors[k];
            if (nj.index <= ni.index) continue; // avoid double-processing

            const dx = ni.x - nj.x;
            const dy = ni.y - nj.y;
            let d2val = dx * dx + dy * dy;
            if (d2val > REPULSION_MAX_DIST * REPULSION_MAX_DIST) continue;
            if (d2val < 1) d2val = 1; // prevent division by zero

            const d = Math.sqrt(d2val);
            const force = Math.min(REPULSION_STRENGTH / d2val, 2.0);
            const fx = (dx / d) * force;
            const fy = (dy / d) * force;

            ni.addForce(fx, fy);
            nj.addForce(-fx, -fy);
        }
    }

    // --- Connection spring forces (Hooke's law) ---
    for (let i = 0; i < connections.length; i++) {
        const conn = connections[i];
        const a = nodes[conn.a];
        const b = nodes[conn.b];

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const displacement = d - SPRING_REST_LENGTH;
        const force = displacement * SPRING_STIFFNESS;
        const fx = (dx / d) * force;
        const fy = (dy / d) * force;

        a.addForce(fx, fy);
        b.addForce(-fx, -fy);
    }

    // --- Center gravity (gentle pull toward canvas center) ---
    const cx = w / 2;
    const cy = h / 2;
    for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.addForce((cx - n.x) * CENTER_GRAVITY, (cy - n.y) * CENTER_GRAVITY);
    }

    // --- Mouse interaction ---
    if (mouseIn) {
        const attractRadius2 = MOUSE_ATTRACT_RADIUS * MOUSE_ATTRACT_RADIUS;
        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            const dx = mouseX - n.x;
            const dy = mouseY - n.y;
            const d2val = dx * dx + dy * dy;
            if (d2val > attractRadius2 || d2val < 1) continue;

            const d = Math.sqrt(d2val);
            const falloff = 1 - (d / MOUSE_ATTRACT_RADIUS);

            if (rightDown) {
                const force = MOUSE_REPULSE_FORCE * falloff;
                n.addForce(-(dx / d) * force, -(dy / d) * force);
            } else {
                const force = MOUSE_ATTRACT_FORCE * falloff;
                n.addForce((dx / d) * force, (dy / d) * force);
            }
        }
    }

    // --- Logo / cluster formation: pull nodes toward targets ---
    if (currentMode === 'logo') {
        const elapsed = time - logoStartTime;
        const progress = clamp(elapsed / LOGO_EASE_DUR, 0, 1);
        const eased = elasticOut(progress);

        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            const pullStrength = 0.05 * eased;
            n.addForce(
                (n.targetX - n.x) * pullStrength,
                (n.targetY - n.y) * pullStrength
            );
        }
    }

    // --- Integrate all nodes ---
    for (let i = 0; i < nodes.length; i++) {
        nodes[i].integrate(1);
        nodes[i].constrain(w, h);
    }
}

// ---------------------------------------------------------------------------
//  HOVER / HIT DETECTION
// ---------------------------------------------------------------------------

function updateHover() {
    if (!mouseIn) {
        if (hoveredNode) {
            hoveredNode.isHovered = false;
            hoveredNode = null;
        }
        return;
    }

    let closest = null;
    let closestDist = 30 * 30; // 30px hit radius

    for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const d = dist2(mouseX, mouseY, n.x, n.y);
        if (d < closestDist) {
            closestDist = d;
            closest = n;
        }
    }

    if (hoveredNode && hoveredNode !== closest) {
        hoveredNode.isHovered = false;
    }
    if (closest) {
        closest.isHovered = true;
    }
    hoveredNode = closest;
}

// ---------------------------------------------------------------------------
//  RENDERING
// ---------------------------------------------------------------------------

/**
 * Draw the background grid from the offscreen canvas.
 */
function drawGrid() {
    if (!gridCanvas || gridDirty) {
        createGridCanvas(canvasW, canvasH);
    }
    ctx.drawImage(gridCanvas, 0, 0);
}

/**
 * Draw a subtle glow ring around the cursor to show interaction range.
 */
function drawMouseGlow() {
    if (!mouseIn || qualityLevel < 1) return;

    const grad = ctx.createRadialGradient(
        mouseX, mouseY, 0,
        mouseX, mouseY, MOUSE_ATTRACT_RADIUS
    );

    if (rightDown) {
        grad.addColorStop(0, 'rgba(255, 71, 87, 0.03)');
        grad.addColorStop(0.5, 'rgba(255, 71, 87, 0.015)');
        grad.addColorStop(1, 'rgba(255, 71, 87, 0)');
    } else {
        grad.addColorStop(0, 'rgba(0, 212, 255, 0.025)');
        grad.addColorStop(0.5, 'rgba(0, 212, 255, 0.012)');
        grad.addColorStop(1, 'rgba(0, 212, 255, 0)');
    }

    ctx.beginPath();
    ctx.arc(mouseX, mouseY, MOUSE_ATTRACT_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Thin ring at the edge
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, MOUSE_ATTRACT_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = rightDown
        ? 'rgba(255, 71, 87, 0.06)'
        : 'rgba(0, 212, 255, 0.04)';
    ctx.lineWidth = 1;
    ctx.stroke();
}

/**
 * Draw all connections between nodes.
 */
function drawConnections(time) {
    for (let i = 0; i < connections.length; i++) {
        const conn = connections[i];
        const a = nodes[conn.a];
        const b = nodes[conn.b];

        // Compute mouse proximity for glow effect
        let glowBoost = 0;
        if (mouseIn) {
            const midX = (a.x + b.x) / 2;
            const midY = (a.y + b.y) / 2;
            const md = dist(mouseX, mouseY, midX, midY);
            if (md < MOUSE_ATTRACT_RADIUS) {
                glowBoost = (1 - md / MOUSE_ATTRACT_RADIUS) * 0.35;
            }
        }

        // Boost if either connected node is hovered
        if (a.isHovered || b.isHovered) {
            glowBoost = 0.6;
            conn.active = true;
        } else {
            conn.active = false;
        }

        conn.alpha = conn.baseAlpha + glowBoost;
        if (conn.alpha < 0.01) continue;

        // Draw line
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);

        // Gradient between the two node colors
        if (qualityLevel >= 2 && conn.alpha > 0.1) {
            const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
            grad.addColorStop(0, rgba(a.color, conn.alpha));
            grad.addColorStop(1, rgba(b.color, conn.alpha));
            ctx.strokeStyle = grad;
        } else {
            ctx.strokeStyle = rgba(a.color, conn.alpha);
        }

        // Animated dash pattern on active (hovered) connections
        if (conn.active && qualityLevel >= 1) {
            ctx.setLineDash([4, 6]);
            conn.dashOffset += 0.5;
            ctx.lineDashOffset = -conn.dashOffset;
            ctx.lineWidth = 1.5;
        } else {
            ctx.setLineDash([]);
            ctx.lineWidth = 0.8;
        }

        ctx.stroke();
    }

    // Reset dash state
    ctx.setLineDash([]);
}

/**
 * Draw all data-flow particles.
 */
function drawFlowParticles() {
    if (qualityLevel < 1) return;

    for (let i = 0; i < flowPool.length; i++) {
        const p = flowPool[i];
        if (!p.alive) continue;

        p.update(nodes, connections);
        if (!p.alive) continue;

        const conn = connections[p.connIdx];
        if (!conn) continue;

        const color = nodes[conn.a].color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = rgba(color, p.alpha * 0.8);
        ctx.fill();
    }
}

/**
 * Draw node motion trails (behind everything else for subtle effect).
 */
function drawTrails() {
    if (qualityLevel < 2) return;

    for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.trail.length < 2) continue;

        ctx.beginPath();
        ctx.moveTo(n.trail[0].x, n.trail[0].y);
        for (let j = 1; j < n.trail.length; j++) {
            ctx.lineTo(n.trail[j].x, n.trail[j].y);
        }
        ctx.strokeStyle = rgba(n.color, 0.08);
        ctx.lineWidth = n.baseRadius * 0.8;
        ctx.lineCap = 'round';
        ctx.stroke();
    }
}

/**
 * Draw a single node with glow, gradient body, ripple, and hover label.
 */
function drawNode(n) {
    const x = n.x;
    const y = n.y;
    const r = n.radius;

    // --- Glow halo ---
    if (qualityLevel >= 1) {
        const glowR = r * (n.isHovered ? 5 : 3);
        const glowAlpha = n.isHovered ? 0.25 : 0.08;
        const glow = ctx.createRadialGradient(x, y, r * 0.5, x, y, glowR);
        glow.addColorStop(0, rgba(n.color, glowAlpha));
        glow.addColorStop(1, rgba(n.color, 0));
        ctx.beginPath();
        ctx.arc(x, y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
    }

    // --- Node body (radial gradient with specular highlight) ---
    const nodeGrad = ctx.createRadialGradient(
        x - r * 0.3, y - r * 0.3, r * 0.1,
        x, y, r
    );
    nodeGrad.addColorStop(0, rgba({ r: 255, g: 255, b: 255 }, n.alpha * 0.6));
    nodeGrad.addColorStop(0.4, rgba(n.color, n.alpha));
    nodeGrad.addColorStop(1, rgba(n.color, n.alpha * 0.4));

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = nodeGrad;
    ctx.fill();

    // --- Ripple effect ---
    if (n.rippleAlpha > 0.01) {
        ctx.beginPath();
        ctx.arc(x, y, n.rippleRadius, 0, Math.PI * 2);
        ctx.strokeStyle = rgba(n.color, n.rippleAlpha);
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // --- Label on hover ---
    if (n.isHovered) {
        ctx.font = '11px "Inter", -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        const text = n.label;
        const metrics = ctx.measureText(text);
        const tw = metrics.width + 12;
        const th = 20;
        const tx = x - tw / 2;
        const ty = y - r - 10 - th;

        // Background pill
        ctx.fillStyle = 'rgba(10, 10, 20, 0.85)';
        ctx.beginPath();
        roundRect(ctx, tx, ty, tw, th, 4);
        ctx.fill();

        // Border
        ctx.strokeStyle = rgba(n.color, 0.5);
        ctx.lineWidth = 1;
        ctx.beginPath();
        roundRect(ctx, tx, ty, tw, th, 4);
        ctx.stroke();

        // Text
        ctx.fillStyle = n.color.hex;
        ctx.fillText(text, x, y - r - 12);
    }
}

/**
 * Draw all nodes.
 */
function drawNodes() {
    for (let i = 0; i < nodes.length; i++) {
        drawNode(nodes[i]);
    }
}

/**
 * Draw category legend overlay (only in cluster mode).
 */
function drawCategoryLegend() {
    if (!isClusterMode) return;

    const padding = 16;
    const lineHeight = 22;
    const dotRadius = 5;
    const boxW = 160;
    const boxH = CATEGORIES.length * lineHeight + padding * 2;
    const startX = canvasW - boxW - padding;
    const startY = 30;

    // Semi-transparent background
    ctx.fillStyle = 'rgba(10, 10, 25, 0.7)';
    ctx.beginPath();
    roundRect(ctx, startX, startY, boxW, boxH, 8);
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    roundRect(ctx, startX, startY, boxW, boxH, 8);
    ctx.stroke();

    // Entries
    ctx.font = '11px "Inter", -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < CATEGORIES.length; i++) {
        const cat = CATEGORIES[i];
        const color = CATEGORY_COLORS[cat];
        const y = startY + padding + i * lineHeight;

        // Color dot
        ctx.beginPath();
        ctx.arc(startX + padding + dotRadius, y + lineHeight / 2 - 4, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = rgba(color, 0.9);
        ctx.fill();

        // Label text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText(
            CATEGORY_LABELS[cat] || cat,
            startX + padding + dotRadius * 2 + 10,
            y + lineHeight / 2 - 4
        );
    }
}

// ---------------------------------------------------------------------------
//  FPS MONITORING & ADAPTIVE QUALITY
// ---------------------------------------------------------------------------

function monitorFPS(time) {
    if (lastFrameTs > 0) {
        const delta = time - lastFrameTs;
        const fps = delta > 0 ? 1000 / delta : 60;
        fpsHistory.push(fps);
        if (fpsHistory.length > FPS_SAMPLE_FRAMES) {
            fpsHistory.shift();
        }

        // Evaluate every FPS_SAMPLE_FRAMES frames
        if (fpsHistory.length === FPS_SAMPLE_FRAMES && frameCount % FPS_SAMPLE_FRAMES === 0) {
            const avgFPS = fpsHistory.reduce((s, v) => s + v, 0) / fpsHistory.length;

            if (avgFPS < FPS_THRESHOLD && qualityLevel > 0) {
                qualityLevel--;
                // If at minimum quality and still slow, reduce node count
                if (qualityLevel === 0 && nodes.length > NODE_COUNTS.mobile) {
                    reduceNodes(NODE_COUNTS.mobile);
                }
            } else if (avgFPS > 50 && qualityLevel < 2) {
                // Recover quality if FPS is good
                qualityLevel++;
            }
        }
    }
    lastFrameTs = time;
    frameCount++;
}

/**
 * Reduce node count by trimming excess nodes and rebuilding connections.
 */
function reduceNodes(targetCount) {
    if (nodes.length <= targetCount) return;
    nodes.length = targetCount;
    connections = buildConnections(nodes);
    initFlowPool();
}

// ---------------------------------------------------------------------------
//  MAIN ANIMATION LOOP
// ---------------------------------------------------------------------------

function tick(time) {
    if (destroyed || paused) return;
    animFrameId = requestAnimationFrame(tick);

    // FPS monitoring and adaptive quality
    monitorFPS(time);

    // Physics step
    applyForces(time);

    // Animate visual state of all nodes
    for (let i = 0; i < nodes.length; i++) {
        nodes[i].animate(time);
    }

    // Hover detection
    updateHover();

    // Spawn data-flow particles periodically
    if (frameCount % 3 === 0) {
        spawnFlowParticles();
    }

    // =========================
    //  RENDER
    // =========================

    ctx.clearRect(0, 0, canvasW, canvasH);

    // Layer 0: Background grid
    if (qualityLevel >= 2) {
        drawGrid();
    }

    // Layer 1: Mouse proximity glow
    drawMouseGlow();

    // Layer 2: Node motion trails
    drawTrails();

    // Layer 3: Connections
    drawConnections(time);

    // Layer 4: Data-flow particles
    drawFlowParticles();

    // Layer 5: Nodes (topmost)
    drawNodes();

    // Layer 6: Overlays (legend in cluster mode)
    drawCategoryLegend();
}

// ---------------------------------------------------------------------------
//  EVENT HANDLERS
// ---------------------------------------------------------------------------

function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) * dpr;
    mouseY = (e.clientY - rect.top) * dpr;
    mouseIn = true;
}

function onMouseLeave() {
    mouseIn = false;
    if (hoveredNode) {
        hoveredNode.isHovered = false;
        hoveredNode = null;
    }
}

function onMouseDown(e) {
    if (e.button === 2) {
        rightDown = true;
        e.preventDefault();
    }
}

function onMouseUp(e) {
    if (e.button === 2) {
        rightDown = false;
    }
    // Left click: trigger ripple on hovered node
    if (e.button === 0 && hoveredNode) {
        hoveredNode.triggerRipple();
    }
}

function onContextMenu(e) {
    // Prevent context menu so right-click repulsion works
    e.preventDefault();
}

function onTouchMove(e) {
    if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        mouseX = (e.touches[0].clientX - rect.left) * dpr;
        mouseY = (e.touches[0].clientY - rect.top) * dpr;
        mouseIn = true;
    }
}

function onTouchEnd() {
    mouseIn = false;
    if (hoveredNode) {
        hoveredNode.isHovered = false;
        hoveredNode = null;
    }
}

function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (!canvas) return;
        setupCanvasSize();
        spatialGrid = new SpatialHash(CELL_SIZE, canvasW, canvasH);
        gridDirty = true;

        // Adjust node count if viewport tier changed
        const desiredCount = getNodeCount();
        if (nodes.length > desiredCount) {
            reduceNodes(desiredCount);
        }
    }, 200);
}

/**
 * Size the canvas to fill its parent container.
 */
function setupCanvasSize() {
    const parent = canvas.parentElement || document.body;
    const rect = parent.getBoundingClientRect();

    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvasW = rect.width * dpr;
    canvasH = rect.height * dpr;

    canvas.width = canvasW;
    canvas.height = canvasH;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// ---------------------------------------------------------------------------
//  CLUSTER BY CATEGORY
// ---------------------------------------------------------------------------

/**
 * Arrange nodes into clusters grouped by category.
 * Each category gets a region of the canvas. Nodes within each category
 * are arranged in a loose spiral for aesthetic spacing.
 */
function clusterByCategory() {
    if (!nodes.length) return;

    const cols = 3;
    const rows = Math.ceil(CATEGORIES.length / cols);
    const cellW = canvasW / cols;
    const cellH = canvasH / rows;

    // Group nodes by category
    const groups = {};
    CATEGORIES.forEach(c => { groups[c] = []; });
    nodes.forEach(n => {
        if (groups[n.category]) {
            groups[n.category].push(n);
        }
    });

    let ci = 0;
    for (const cat of CATEGORIES) {
        const col = ci % cols;
        const row = Math.floor(ci / cols);
        const cx = cellW * col + cellW / 2;
        const cy = cellH * row + cellH / 2;

        const group = groups[cat];
        const count = group.length;

        // Arrange in a loose spiral
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const radius = Math.min(cellW, cellH) * 0.3 * Math.sqrt((i + 1) / count);
            group[i].targetX = cx + Math.cos(angle + i * 0.3) * radius;
            group[i].targetY = cy + Math.sin(angle + i * 0.3) * radius;
        }
        ci++;
    }

    currentMode = 'logo'; // reuse the target-pull physics
    isClusterMode = true;
    logoStartTime = performance.now();

    if (logoHoldTimer) clearTimeout(logoHoldTimer);
    // Cluster mode persists until manually changed
}

// ---------------------------------------------------------------------------
//  PUBLIC API
// ---------------------------------------------------------------------------

/**
 * Initialize the neural network visualization.
 *
 * @param {string} canvasId  — id of the <canvas> element (default: 'neural-canvas')
 * @param {object} options   — optional overrides
 * @param {number} options.nodeCount — override node count
 * @param {boolean} options.autoLogo — form logo on init (default: true)
 * @param {boolean} options.grid     — show background grid (default: true)
 */
export function init(canvasId = 'neural-canvas', options = {}) {
    prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.warn(`[neural-network] Canvas #${canvasId} not found.`);
        return;
    }

    ctx = canvas.getContext('2d', { alpha: true });
    destroyed = false;
    paused = false;
    frameCount = 0;
    fpsHistory = [];
    lastFrameTs = 0;
    qualityLevel = prefersReducedMotion ? 0 : 2;
    isClusterMode = false;

    // Size the canvas
    setupCanvasSize();

    // Create spatial grid
    spatialGrid = new SpatialHash(CELL_SIZE, canvasW, canvasH);

    // Create nodes
    const count = options.nodeCount || getNodeCount();
    nodes = createNodes(count, canvasW, canvasH);

    // Build connections
    connections = buildConnections(nodes);

    // Init flow particles
    initFlowPool();

    // Grid
    gridDirty = true;

    // Event listeners
    canvas.addEventListener('mousemove', onMouseMove, { passive: true });
    canvas.addEventListener('mouseleave', onMouseLeave);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('contextmenu', onContextMenu);
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });
    canvas.addEventListener('touchend', onTouchEnd);
    window.addEventListener('resize', onResize);

    // Start animation loop
    animFrameId = requestAnimationFrame(tick);

    // Auto logo formation on load
    if (options.autoLogo !== false && !prefersReducedMotion) {
        formLogo();
    }
}

/**
 * Tear down the visualization and free all resources.
 */
export function destroy() {
    destroyed = true;
    paused = true;

    if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
    }

    if (canvas) {
        canvas.removeEventListener('mousemove', onMouseMove);
        canvas.removeEventListener('mouseleave', onMouseLeave);
        canvas.removeEventListener('mousedown', onMouseDown);
        canvas.removeEventListener('mouseup', onMouseUp);
        canvas.removeEventListener('contextmenu', onContextMenu);
        canvas.removeEventListener('touchmove', onTouchMove);
        canvas.removeEventListener('touchend', onTouchEnd);
    }

    window.removeEventListener('resize', onResize);

    if (logoHoldTimer) {
        clearTimeout(logoHoldTimer);
        logoHoldTimer = null;
    }

    nodes = [];
    connections = [];
    flowPool = [];
    spatialGrid = null;
    gridCanvas = null;
    gridCtx = null;
    canvas = null;
    ctx = null;
    hoveredNode = null;
}

/**
 * Trigger the logo formation animation.
 * Nodes animate from their current positions to form the "NT" letters,
 * hold for LOGO_HOLD_MS, then release back into free-float mode.
 */
export function formLogo() {
    if (!nodes.length || destroyed) return;

    isClusterMode = false;

    // Generate letter targets
    const targets = generateLogoTargets(nodes.length, canvasW, canvasH);
    for (let i = 0; i < nodes.length; i++) {
        nodes[i].targetX = targets[i].x;
        nodes[i].targetY = targets[i].y;
    }

    currentMode = 'logo';
    logoStartTime = performance.now();

    // After hold duration, release to float
    if (logoHoldTimer) clearTimeout(logoHoldTimer);
    logoHoldTimer = setTimeout(() => {
        currentMode = 'float';
        logoHoldTimer = null;
    }, LOGO_EASE_DUR + LOGO_HOLD_MS);
}

/**
 * Switch the visualization mode.
 *
 * @param {'float'|'logo'|'cluster'} mode
 *   - 'float':   free-floating physics (default)
 *   - 'logo':    form the NexTool "NT" logo
 *   - 'cluster': group nodes by category
 */
export function setMode(mode) {
    if (destroyed) return;

    switch (mode) {
        case 'logo':
            formLogo();
            break;

        case 'cluster':
            clusterByCategory();
            break;

        case 'float':
        default:
            currentMode = 'float';
            isClusterMode = false;
            break;
    }
}
