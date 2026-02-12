/**
 * NexTool Tool Map
 * -----------------------------------------------------------------------
 * Interactive force-directed graph visualization of all 213 NexTool tools
 * organized by category. Canvas-based with zoom, pan, hover tooltips,
 * click navigation, and search/filter.
 *
 * @module features/tool-map
 * @exports init, destroy, filter, zoomTo
 */

/* ===================================================================
   CATEGORY DEFINITIONS
   =================================================================== */

const CATEGORIES = [
    { name: 'Text & Content', color: '#00d4ff', count: 45, tools: [
        'JSON Formatter','Markdown Preview','Lorem Ipsum Generator','Word Counter','Text Case Converter',
        'Slug Generator','Markdown to HTML','HTML to Markdown','Text Diff','String Encoder',
        'Lorem Picsum','Placeholder Text','Rich Text Editor','Text Repeater','Text Sorter',
        'Remove Duplicates','Line Counter','Character Counter','Text Reverser','Palindrome Checker',
        'ROT13 Encoder','Pig Latin Converter','Title Case Tool','Sentence Counter','Reading Time Calculator',
        'Whitespace Remover','Text Wrap','Find and Replace','HTML Entity Encoder','HTML Entity Decoder',
        'XML Formatter','YAML Formatter','TOML Formatter','INI Formatter','Braille Translator',
        'Morse Code Translator','NATO Phonetic','Number to Words','Words to Number','Text Statistics',
        'Random Quote Generator','Haiku Generator','Random Name Generator','Fake Data Generator','Lipsum Paragraphs',
    ]},
    { name: 'Developer', color: '#7b61ff', count: 40, tools: [
        'Regex Tester','UUID Generator','Hash Generator','CSS Minifier','JavaScript Minifier',
        'HTML Minifier','Diff Checker','Cron Expression Parser','SQL Formatter','JWT Decoder',
        'URL Encoder/Decoder','Base64 Encoder/Decoder','CSS Beautifier','JavaScript Beautifier',
        'HTML Beautifier','JSON Validator','XML Validator','YAML to JSON','JSON to YAML',
        'JSON Path Evaluator','HTTP Status Codes','User Agent Parser','JavaScript Obfuscator',
        'CSS Grid Generator','Flexbox Generator','HTML Table Generator','Chmod Calculator',
        'Git Command Helper','API Tester','GraphQL Playground','WebSocket Tester',
        'HTTP Header Analyzer','SSL Certificate Checker','DNS Lookup','WHOIS Lookup',
        'Port Scanner','Robots.txt Generator','Htaccess Generator','Sitemap Generator','Schema Markup Generator',
    ]},
    { name: 'Design & Color', color: '#00ff88', count: 35, tools: [
        'Color Picker','Gradient Generator','Box Shadow Generator','Color Contrast Checker',
        'SVG Optimizer','Favicon Generator','Color Palette Generator','Hex to RGB','RGB to Hex',
        'HSL Converter','CMYK Converter','Color Blindness Simulator','CSS Filter Generator',
        'Border Radius Generator','Glassmorphism Generator','Neumorphism Generator',
        'Text Shadow Generator','Clip Path Generator','CSS Animation Generator','Blob Generator',
        'Wave Generator','Mesh Gradient Generator','Pattern Generator','Noise Generator',
        'Icon Finder','Font Pairing Tool','Typography Scale','Aspect Ratio Calculator',
        'Image Placeholder','Open Graph Image Generator','Screenshot Mockup','Device Mockup',
        'Wireframe Generator','Color Name Finder','Tailwind Color Finder',
    ]},
    { name: 'Data & Convert', color: '#ff6b35', count: 30, tools: [
        'CSV to JSON','JSON to CSV','Base64 to Image','Image to Base64','Timestamp Converter',
        'Unit Converter','Number Base Converter','Binary Converter','Hex Converter','Octal Converter',
        'ASCII Table','Unicode Lookup','HTML Color Codes','Temperature Converter','Weight Converter',
        'Length Converter','Area Converter','Volume Converter','Speed Converter','Data Size Converter',
        'Angle Converter','Pressure Converter','Energy Converter','Power Converter','Time Converter',
        'Currency Converter','Roman Numeral Converter','Fraction Calculator','Percentage Calculator','Date Calculator',
    ]},
    { name: 'Math & Finance', color: '#ff4757', count: 25, tools: [
        'Loan Calculator','BMI Calculator','Tip Calculator','Age Calculator','GPA Calculator',
        'Mortgage Calculator','Compound Interest Calculator','Tax Calculator','Discount Calculator',
        'Profit Margin Calculator','ROI Calculator','Break Even Calculator','Invoice Generator',
        'Receipt Generator','Scientific Calculator','Matrix Calculator','Statistics Calculator',
        'Probability Calculator','Prime Number Checker','Factorial Calculator','Fibonacci Generator',
        'Standard Deviation Calculator','Quadratic Solver','Pythagorean Theorem','Permutation Calculator',
    ]},
    { name: 'Media & Files', color: '#ffd700', count: 20, tools: [
        'Image Compressor','QR Code Generator','Barcode Generator','PDF Merger','PDF Splitter',
        'PDF to Text','Image Resizer','Image Cropper','Image Format Converter','Video Thumbnail',
        'Audio Visualizer','MP3 Cutter','GIF Maker','Sprite Sheet Generator','EXIF Viewer',
        'Image Metadata Remover','Watermark Generator','Collage Maker','Meme Generator','ASCII Art Generator',
    ]},
    { name: 'Security & Privacy', color: '#e84393', count: 18, tools: [
        'Password Generator','Password Strength Checker','Encryption Tool','Decryption Tool',
        'IP Lookup','Email Validator','Phone Number Formatter','Privacy Policy Generator',
        'Terms of Service Generator','GDPR Compliance Checker','Cookie Policy Generator',
        'CSP Header Generator','CORS Header Helper','API Key Generator','Random Token Generator',
        'Secure Link Generator','Hash Comparator','PGP Key Generator',
    ]},
];

/* ===================================================================
   PHYSICS ENGINE — Simple force-directed layout
   =================================================================== */

class Node {
    constructor(id, label, categoryIndex, url) {
        this.id = id;
        this.label = label;
        this.categoryIndex = categoryIndex;
        this.url = url;
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.radius = 4;
        this.highlighted = false;
        this.filtered = true; // visible by default
    }
}

class ForceGraph {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.nodes = [];
        this.categoryNodes = []; // virtual center nodes
        this.settled = false;
        this.iteration = 0;
        this.maxIterations = options.maxIterations || 150;

        // View transform (zoom/pan)
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;

        // Interaction
        this.hoveredNode = null;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.lastMouse = { x: 0, y: 0 };

        // Animation
        this.animFrameId = null;

        // Physics constants
        this.repulsion = 200;
        this.attraction = 0.008;
        this.damping = 0.85;
        this.centerGravity = 0.0003;
    }

    /**
     * Initialize all nodes from category data.
     */
    buildNodes() {
        const cx = this.width / 2;
        const cy = this.height / 2;
        const categoryRadius = Math.min(cx, cy) * 0.55;

        // Place category centers in a circle
        CATEGORIES.forEach((cat, ci) => {
            const angle = (ci / CATEGORIES.length) * Math.PI * 2 - Math.PI / 2;
            const catX = cx + Math.cos(angle) * categoryRadius;
            const catY = cy + Math.sin(angle) * categoryRadius;

            this.categoryNodes.push({ x: catX, y: catY, name: cat.name, color: cat.color });

            // Create tool nodes around category center
            cat.tools.forEach((toolName, ti) => {
                const node = new Node(
                    `${ci}-${ti}`,
                    toolName,
                    ci,
                    `/free-tools/${toolName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.html`
                );

                // Initial position: scatter around category center
                const spreadAngle = (ti / cat.tools.length) * Math.PI * 2 + Math.random() * 0.5;
                const spreadRadius = 30 + Math.random() * 60;
                node.x = catX + Math.cos(spreadAngle) * spreadRadius;
                node.y = catY + Math.sin(spreadAngle) * spreadRadius;

                // Vary radius slightly by position in list
                node.radius = 3 + Math.random() * 2;

                this.nodes.push(node);
            });
        });
    }

    /**
     * Run physics simulation.
     */
    simulate() {
        if (this.settled) return;

        for (const node of this.nodes) {
            // Attraction toward own category center
            const catCenter = this.categoryNodes[node.categoryIndex];
            if (catCenter) {
                const dx = catCenter.x - node.x;
                const dy = catCenter.y - node.y;
                node.vx += dx * this.attraction;
                node.vy += dy * this.attraction;
            }

            // Weak center gravity
            const gcx = this.width / 2 - node.x;
            const gcy = this.height / 2 - node.y;
            node.vx += gcx * this.centerGravity;
            node.vy += gcy * this.centerGravity;
        }

        // Node-node repulsion (O(n^2) but acceptable for ~213 nodes)
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const a = this.nodes[i];
                const b = this.nodes[j];
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const minDist = a.radius + b.radius + 6;

                if (dist < minDist * 3) {
                    const force = this.repulsion / (dist * dist);
                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;
                    a.vx -= fx;
                    a.vy -= fy;
                    b.vx += fx;
                    b.vy += fy;
                }
            }
        }

        // Apply velocity with damping
        let totalVelocity = 0;
        for (const node of this.nodes) {
            node.vx *= this.damping;
            node.vy *= this.damping;
            node.x += node.vx;
            node.y += node.vy;
            totalVelocity += Math.abs(node.vx) + Math.abs(node.vy);
        }

        this.iteration++;

        // Settle when velocity is very low or max iterations reached
        if (totalVelocity < 0.5 || this.iteration >= this.maxIterations) {
            this.settled = true;
        }
    }

    /**
     * Convert screen coordinates to world coordinates.
     */
    screenToWorld(sx, sy) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = (sx - rect.left) * (this.canvas.width / rect.width);
        const canvasY = (sy - rect.top) * (this.canvas.height / rect.height);
        return {
            x: (canvasX - this.offsetX) / this.scale,
            y: (canvasY - this.offsetY) / this.scale,
        };
    }

    /**
     * Find the node under given world coordinates.
     */
    findNodeAt(wx, wy) {
        // Search in reverse (top-drawn last = on top)
        for (let i = this.nodes.length - 1; i >= 0; i--) {
            const node = this.nodes[i];
            if (!node.filtered) continue;
            const dx = node.x - wx;
            const dy = node.y - wy;
            const hitRadius = (node.radius + 4) / this.scale;
            if (dx * dx + dy * dy <= hitRadius * hitRadius) {
                return node;
            }
        }
        return null;
    }

    /**
     * Render the graph.
     */
    draw() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.clearRect(0, 0, w, h);
        ctx.save();
        ctx.translate(this.offsetX, this.offsetY);
        ctx.scale(this.scale, this.scale);

        // Draw category labels
        for (let i = 0; i < this.categoryNodes.length; i++) {
            const cat = this.categoryNodes[i];
            ctx.save();
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = cat.color;
            ctx.font = 'bold 14px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(cat.name, cat.x, cat.y - 70);
            ctx.restore();
        }

        // Draw nodes
        for (const node of this.nodes) {
            if (!node.filtered) continue;

            const cat = CATEGORIES[node.categoryIndex];
            const color = cat ? cat.color : '#888';

            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);

            if (node.highlighted) {
                // Highlighted: bright color, glow
                ctx.fillStyle = color;
                ctx.shadowColor = color;
                ctx.shadowBlur = 12;
                ctx.fill();
                ctx.shadowBlur = 0;

                // Outer ring
                ctx.strokeStyle = color;
                ctx.lineWidth = 1.5;
                ctx.stroke();
            } else {
                // Normal: semi-transparent
                ctx.fillStyle = color;
                ctx.globalAlpha = node === this.hoveredNode ? 1 : 0.6;
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        }

        // Draw hovered node tooltip
        if (this.hoveredNode && this.hoveredNode.filtered) {
            const node = this.hoveredNode;
            const cat = CATEGORIES[node.categoryIndex];

            // Tooltip background
            ctx.save();
            const label = node.label;
            ctx.font = '12px system-ui, sans-serif';
            const metrics = ctx.measureText(label);
            const padding = 6;
            const boxW = metrics.width + padding * 2;
            const boxH = 22;
            const boxX = node.x - boxW / 2;
            const boxY = node.y - node.radius - boxH - 6;

            ctx.fillStyle = 'rgba(0,0,0,0.85)';
            ctx.beginPath();
            roundRect(ctx, boxX, boxY, boxW, boxH, 5);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, node.x, boxY + boxH / 2);
            ctx.restore();
        }

        ctx.restore();
    }

    /**
     * Main animation loop.
     */
    tick() {
        if (!this.settled) {
            this.simulate();
        }
        this.draw();
        this.animFrameId = requestAnimationFrame(() => this.tick());
    }

    start() {
        this.buildNodes();
        this.tick();
    }

    stop() {
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
    }
}

/**
 * Draw a rounded rectangle path.
 */
function roundRect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

/* ===================================================================
   STATE
   =================================================================== */

let canvas = null;
let graph = null;
let containerEl = null;
let resizeObserver = null;
let boundMouseMove = null;
let boundMouseDown = null;
let boundMouseUp = null;
let boundWheel = null;
let boundClick = null;

/* ===================================================================
   STYLES
   =================================================================== */

function injectStyles() {
    if (document.getElementById('nt-toolmap-styles')) return;
    const s = document.createElement('style');
    s.id = 'nt-toolmap-styles';
    s.textContent = `
        .nt-tool-map-wrapper {
            position:relative; border-radius:16px; overflow:hidden;
            border:1px solid rgba(255,255,255,.06);
            background:rgba(0,0,0,.3);
        }
        .nt-tool-map-wrapper canvas {
            display:block; width:100%; height:100%; cursor:grab;
        }
        .nt-tool-map-wrapper canvas.nt-grabbing { cursor:grabbing; }

        .nt-tool-map__controls {
            position:absolute; bottom:12px; right:12px;
            display:flex; gap:4px;
        }
        .nt-tool-map__btn {
            width:32px; height:32px; border-radius:8px; border:none;
            background:rgba(0,0,0,.6); color:#fff; font-size:18px;
            cursor:pointer; display:flex; align-items:center; justify-content:center;
            transition:background .2s;
        }
        .nt-tool-map__btn:hover { background:rgba(0,0,0,.8); }

        .nt-tool-map__search {
            position:absolute; top:12px; left:12px; right:12px; max-width:300px;
        }
        .nt-tool-map__search input {
            width:100%; padding:8px 12px; border-radius:8px;
            border:1px solid rgba(255,255,255,.1);
            background:rgba(0,0,0,.6); color:#fff; font-size:13px;
            font-family:inherit; outline:none;
            backdrop-filter:blur(8px);
        }
        .nt-tool-map__search input::placeholder { color:rgba(255,255,255,.35); }
        .nt-tool-map__search input:focus { border-color:var(--nt-primary, #00d4ff); }

        .nt-tool-map__legend {
            position:absolute; bottom:12px; left:12px;
            display:flex; flex-wrap:wrap; gap:8px;
        }
        .nt-tool-map__legend-item {
            display:flex; align-items:center; gap:4px;
            font-size:10px; color:rgba(255,255,255,.5);
            cursor:pointer; transition:color .2s;
        }
        .nt-tool-map__legend-item:hover { color:rgba(255,255,255,.8); }
        .nt-tool-map__legend-dot {
            width:8px; height:8px; border-radius:50%;
        }
    `;
    document.head.appendChild(s);
}

/* ===================================================================
   CANVAS SIZING
   =================================================================== */

function resizeCanvas() {
    if (!canvas || !containerEl) return;
    const rect = containerEl.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width;
    const h = Math.max(400, Math.min(600, w * 0.6));

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (graph) {
        graph.width = w;
        graph.height = h;
    }
}

/* ===================================================================
   INTERACTION — zoom, pan, hover, click
   =================================================================== */

function setupInteraction() {
    if (!canvas || !graph) return;

    // Mouse move — hover detection + pan
    boundMouseMove = function onMouseMove(e) {
        const world = graph.screenToWorld(e.clientX, e.clientY);
        graph.lastMouse = { x: e.clientX, y: e.clientY };

        if (graph.isDragging) {
            const dx = e.clientX - graph.dragStart.x;
            const dy = e.clientY - graph.dragStart.y;
            graph.offsetX += dx;
            graph.offsetY += dy;
            graph.dragStart = { x: e.clientX, y: e.clientY };
            canvas.classList.add('nt-grabbing');
            return;
        }

        // Hover detection
        const node = graph.findNodeAt(world.x, world.y);
        if (node !== graph.hoveredNode) {
            graph.hoveredNode = node;
            canvas.style.cursor = node ? 'pointer' : 'grab';
        }
    };
    canvas.addEventListener('mousemove', boundMouseMove);

    // Mouse down — start pan
    boundMouseDown = function onMouseDown(e) {
        if (e.button !== 0) return; // left click only
        graph.isDragging = true;
        graph.dragStart = { x: e.clientX, y: e.clientY };
    };
    canvas.addEventListener('mousedown', boundMouseDown);

    // Mouse up — end pan
    boundMouseUp = function onMouseUp() {
        if (graph.isDragging) {
            graph.isDragging = false;
            canvas.classList.remove('nt-grabbing');
        }
    };
    document.addEventListener('mouseup', boundMouseUp);

    // Wheel — zoom
    boundWheel = function onWheel(e) {
        e.preventDefault();
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
        const newScale = Math.max(0.3, Math.min(4, graph.scale * zoomFactor));

        // Zoom toward mouse position
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (canvas.width / rect.width / (window.devicePixelRatio || 1));
        const my = (e.clientY - rect.top) * (canvas.height / rect.height / (window.devicePixelRatio || 1));

        // Adjust offset so zoom centers on cursor
        graph.offsetX = mx - (mx - graph.offsetX) * (newScale / graph.scale);
        graph.offsetY = my - (my - graph.offsetY) * (newScale / graph.scale);
        graph.scale = newScale;
    };
    canvas.addEventListener('wheel', boundWheel, { passive: false });

    // Click — navigate to tool
    boundClick = function onClick(e) {
        // Ignore if we just finished dragging
        if (graph.isDragging) return;

        const world = graph.screenToWorld(e.clientX, e.clientY);
        const node = graph.findNodeAt(world.x, world.y);
        if (node && node.url) {
            window.location.href = node.url;
        }
    };
    canvas.addEventListener('click', boundClick);
}

/* ===================================================================
   CONTROLS — zoom buttons, search, legend
   =================================================================== */

function createControls() {
    if (!containerEl) return;

    // Zoom buttons
    const controls = document.createElement('div');
    controls.className = 'nt-tool-map__controls';
    controls.innerHTML = `
        <button class="nt-tool-map__btn" data-action="zoom-in" aria-label="Zoom in">+</button>
        <button class="nt-tool-map__btn" data-action="zoom-out" aria-label="Zoom out">&minus;</button>
        <button class="nt-tool-map__btn" data-action="reset" aria-label="Reset view">\u{1F3AF}</button>
    `;
    containerEl.appendChild(controls);

    controls.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        switch (btn.dataset.action) {
            case 'zoom-in':
                if (graph) graph.scale = Math.min(4, graph.scale * 1.3);
                break;
            case 'zoom-out':
                if (graph) graph.scale = Math.max(0.3, graph.scale * 0.7);
                break;
            case 'reset':
                if (graph) { graph.scale = 1; graph.offsetX = 0; graph.offsetY = 0; }
                break;
        }
    });

    // Search
    const searchWrapper = document.createElement('div');
    searchWrapper.className = 'nt-tool-map__search';
    searchWrapper.innerHTML = `<input type="text" placeholder="Search tools..." aria-label="Search tools on map" />`;
    containerEl.appendChild(searchWrapper);

    const searchInput = searchWrapper.querySelector('input');
    searchInput.addEventListener('input', () => {
        filter(searchInput.value.trim());
    });

    // Legend
    const legend = document.createElement('div');
    legend.className = 'nt-tool-map__legend';
    for (const cat of CATEGORIES) {
        const item = document.createElement('div');
        item.className = 'nt-tool-map__legend-item';
        item.dataset.category = cat.name;
        item.innerHTML = `<span class="nt-tool-map__legend-dot" style="background:${cat.color}"></span>${cat.name}`;
        item.addEventListener('click', () => zoomTo(cat.name));
        legend.appendChild(item);
    }
    containerEl.appendChild(legend);
}

/* ===================================================================
   PUBLIC API — filter, zoomTo
   =================================================================== */

/**
 * Filter/highlight nodes matching a query.
 * @param {string} query — Search string.
 */
export function filter(query) {
    if (!graph) return;

    const q = (query || '').toLowerCase().trim();

    for (const node of graph.nodes) {
        if (!q) {
            node.filtered = true;
            node.highlighted = false;
        } else {
            const matches = node.label.toLowerCase().includes(q);
            node.filtered = true; // Always show, but dim non-matches
            node.highlighted = matches;
        }
    }
}

/**
 * Zoom/pan to center a specific category.
 * @param {string} categoryName — Name of the category.
 */
export function zoomTo(categoryName) {
    if (!graph) return;

    const catIndex = CATEGORIES.findIndex(c => c.name === categoryName);
    if (catIndex < 0) return;

    const catCenter = graph.categoryNodes[catIndex];
    if (!catCenter) return;

    // Animate zoom to category
    const targetScale = 1.8;
    const targetOffsetX = graph.width / 2 - catCenter.x * targetScale;
    const targetOffsetY = graph.height / 2 - catCenter.y * targetScale;

    // Simple animation
    const startScale = graph.scale;
    const startOffsetX = graph.offsetX;
    const startOffsetY = graph.offsetY;
    const duration = 600;
    const startTime = performance.now();

    function animate(now) {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);

        graph.scale = startScale + (targetScale - startScale) * eased;
        graph.offsetX = startOffsetX + (targetOffsetX - startOffsetX) * eased;
        graph.offsetY = startOffsetY + (targetOffsetY - startOffsetY) * eased;

        if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);

    // Highlight nodes in this category
    for (const node of graph.nodes) {
        node.highlighted = node.categoryIndex === catIndex;
    }
}

/* ===================================================================
   INIT / DESTROY
   =================================================================== */

/**
 * Initialize the tool map.
 * @param {string} canvasId — ID of the canvas element.
 * @param {Object} [options] — Additional options.
 */
export function init(canvasId = 'tool-map-canvas', options = {}) {
    injectStyles();

    canvas = document.getElementById(canvasId);
    if (!canvas) return;

    containerEl = canvas.parentElement;
    if (containerEl) containerEl.classList.add('nt-tool-map-wrapper');

    // Size the canvas
    resizeCanvas();

    // Create force graph
    graph = new ForceGraph(canvas, {
        maxIterations: options.maxIterations || 150,
    });
    graph.width = canvas.width / (window.devicePixelRatio || 1);
    graph.height = canvas.height / (window.devicePixelRatio || 1);
    graph.start();

    // Interaction
    setupInteraction();

    // Controls
    createControls();

    // Resize handling
    resizeObserver = new ResizeObserver(() => {
        resizeCanvas();
        if (graph) {
            graph.width = canvas.width / (window.devicePixelRatio || 1);
            graph.height = canvas.height / (window.devicePixelRatio || 1);
        }
    });
    resizeObserver.observe(containerEl);
}

export function destroy() {
    if (graph) { graph.stop(); graph = null; }
    if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null; }

    if (canvas && boundMouseMove) canvas.removeEventListener('mousemove', boundMouseMove);
    if (canvas && boundMouseDown) canvas.removeEventListener('mousedown', boundMouseDown);
    if (boundMouseUp) document.removeEventListener('mouseup', boundMouseUp);
    if (canvas && boundWheel) canvas.removeEventListener('wheel', boundWheel);
    if (canvas && boundClick) canvas.removeEventListener('click', boundClick);

    boundMouseMove = null;
    boundMouseDown = null;
    boundMouseUp = null;
    boundWheel = null;
    boundClick = null;

    // Remove controls
    if (containerEl) {
        const controls = containerEl.querySelector('.nt-tool-map__controls');
        if (controls) controls.remove();
        const search = containerEl.querySelector('.nt-tool-map__search');
        if (search) search.remove();
        const legend = containerEl.querySelector('.nt-tool-map__legend');
        if (legend) legend.remove();
        containerEl.classList.remove('nt-tool-map-wrapper');
    }

    canvas = null;
    containerEl = null;

    const styleEl = document.getElementById('nt-toolmap-styles');
    if (styleEl) styleEl.remove();
}
