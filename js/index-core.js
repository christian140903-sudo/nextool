    (function() {
        'use strict';

        /* ==========================================================
           GLOBALS
        ========================================================== */
        const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const WA_LINK = '#contact';
        const CONTACT_EMAIL = 'christianjunbucher@gmail.com';

        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        /* ==========================================================
           PRELOADER
        ========================================================== */
        const preloader = document.getElementById('preloader');
        const progressFill = document.getElementById('progressFill');
        const preloaderCounter = document.getElementById('preloaderCounter');
        const preloaderLetters = preloader.querySelectorAll('.preloader-text span');

        function runPreloader() {
            if (prefersReducedMotion) {
                preloader.style.display = 'none';
                initAll();
                return;
            }
            // Animate letters in with spring effect
            let delay = 200;
            preloaderLetters.forEach((span, i) => {
                setTimeout(() => {
                    span.style.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s';
                    span.style.transform = 'translateY(0)';
                    span.style.opacity = '1';
                }, delay + i * 90);
            });

            // Progress bar + counter
            let progress = 0;
            let displayProgress = 0;
            const progressInterval = setInterval(() => {
                progress += Math.random() * 12 + 4;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(progressInterval);
                }
            }, 120);

            function updateCounter() {
                displayProgress += (progress - displayProgress) * 0.15;
                const rounded = Math.round(displayProgress);
                if (preloaderCounter) preloaderCounter.textContent = rounded + '%';
                progressFill.style.width = displayProgress + '%';
                progressFill.style.transition = 'width 0.1s linear';
                if (displayProgress < 99.5) {
                    requestAnimationFrame(updateCounter);
                }
            }
            requestAnimationFrame(updateCounter);

            setTimeout(() => {
                progress = 100;
                progressFill.style.width = '100%';
                if (preloaderCounter) preloaderCounter.textContent = '100%';
                setTimeout(() => {
                    preloader.classList.add('done');
                    setTimeout(() => {
                        preloader.style.display = 'none';
                    }, 1100);
                    initAll();
                }, 400);
            }, 2000);
        }

        window.addEventListener('load', runPreloader);

        /* ==========================================================
           INIT ALL
        ========================================================== */
        function initAll() {
            initLenis();
            initCursor();
            initNav();
            initHeroCanvas();
            initHeroAnimations();
            initScrollAnimations();
            initServiceCards();
            initHorizontalScroll();
            initChat();
            initFAQ();
            initMagnetic();
            initCountUp();
            // Visual effects
            initScrollProgress();
            initWaveDividers();
            initFloatingShapes();
            initTextScramble();
            initSectionBlobs();
            initBackToTop();
            initAnimatedIcons();
            // New sections
            initMarqueeBand();
            initLiveBuild();
            initComparison();
            initAboutStory();
            initUseCases();
        }

        /* ==========================================================
           LENIS SMOOTH SCROLL
        ========================================================== */
        let lenis;
        function initLenis() {
            if (prefersReducedMotion || isMobile) return;
            lenis = new Lenis({
                duration: 1.2,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                smooth: true,
            });

            lenis.on('scroll', ScrollTrigger.update);

            gsap.ticker.add((time) => {
                lenis.raf(time * 1000);
            });
            gsap.ticker.lagSmoothing(0);
        }

        /* ==========================================================
           CUSTOM CURSOR
        ========================================================== */
        function initCursor() {
            if (isTouch || prefersReducedMotion) return;

            const dot = document.getElementById('cursorDot');
            const ring = document.getElementById('cursorRing');

            // Create trail dots
            const trailCount = 6;
            const trails = [];
            for (let i = 0; i < trailCount; i++) {
                const t = document.createElement('div');
                t.className = 'cursor-trail';
                t.style.opacity = (1 - i / trailCount) * 0.3;
                t.style.width = (4 - i * 0.4) + 'px';
                t.style.height = (4 - i * 0.4) + 'px';
                document.body.appendChild(t);
                trails.push({ el: t, x: 0, y: 0 });
            }

            let dotX = mouseX, dotY = mouseY;
            let ringX = mouseX, ringY = mouseY;

            function updateCursor() {
                dotX = mouseX;
                dotY = mouseY;
                ringX += (mouseX - ringX) * 0.15;
                ringY += (mouseY - ringY) * 0.15;

                dot.style.left = dotX + 'px';
                dot.style.top = dotY + 'px';
                ring.style.left = ringX + 'px';
                ring.style.top = ringY + 'px';

                // Trail
                let prevX = dotX, prevY = dotY;
                trails.forEach((t, i) => {
                    t.x += (prevX - t.x) * (0.3 - i * 0.03);
                    t.y += (prevY - t.y) * (0.3 - i * 0.03);
                    t.el.style.left = t.x + 'px';
                    t.el.style.top = t.y + 'px';
                    prevX = t.x;
                    prevY = t.y;
                });

                requestAnimationFrame(updateCursor);
            }
            updateCursor();

            // Hover effect on links and buttons
            const hoverTargets = document.querySelectorAll('a, button, .service-card, .pricing-card, .faq-question, input');
            hoverTargets.forEach(el => {
                el.addEventListener('mouseenter', () => ring.classList.add('hover'));
                el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
            });

            // Click effect
            document.addEventListener('mousedown', () => {
                ring.style.transform = 'translate(-50%, -50%) scale(0.8)';
            });
            document.addEventListener('mouseup', () => {
                ring.style.transform = 'translate(-50%, -50%) scale(1)';
            });
        }

        /* ==========================================================
           NAVIGATION
        ========================================================== */
        function initNav() {
            const nav = document.getElementById('mainNav');
            const hamburger = document.getElementById('navHamburger');
            const mobileMenu = document.getElementById('mobileMenu');
            const mobileLinks = mobileMenu.querySelectorAll('a');
            let lastScroll = 0;

            window.addEventListener('scroll', () => {
                const currentScroll = window.pageYOffset;
                if (currentScroll > 100) {
                    nav.classList.add('scrolled');
                    if (currentScroll > lastScroll && currentScroll > 300) {
                        nav.classList.add('hidden');
                    } else {
                        nav.classList.remove('hidden');
                    }
                } else {
                    nav.classList.remove('scrolled');
                    nav.classList.remove('hidden');
                }
                lastScroll = currentScroll;
            });

            hamburger.addEventListener('click', () => {
                const isOpen = hamburger.classList.toggle('open');
                mobileMenu.classList.toggle('open');
                hamburger.setAttribute('aria-expanded', isOpen);
                document.body.style.overflow = isOpen ? 'hidden' : '';
            });

            mobileLinks.forEach(link => {
                link.addEventListener('click', () => {
                    hamburger.classList.remove('open');
                    mobileMenu.classList.remove('open');
                    hamburger.setAttribute('aria-expanded', 'false');
                    document.body.style.overflow = '';
                });
            });

            // Smooth scroll for anchor links
            document.querySelectorAll('a[href^="#"]').forEach(a => {
                a.addEventListener('click', (e) => {
                    const target = document.querySelector(a.getAttribute('href'));
                    if (target) {
                        e.preventDefault();
                        if (lenis) {
                            lenis.scrollTo(target, { offset: -80 });
                        } else {
                            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }
                });
            });
        }

        /* ==========================================================
           CANVAS 2D PARTICLE SYSTEM — 3-Layer Parallax with Connections
        ========================================================== */
        function initHeroCanvas() {
            if (prefersReducedMotion) return;

            const PCONFIG = {
                colors: {
                    indigo: { r: 99, g: 102, b: 241 },
                    purple: { r: 168, g: 85, b: 247 },
                    pink:   { r: 236, g: 72, b: 153 },
                },
                layers: [
                    { count: 0.45, speed: 0.15, sizeMin: 0.6, sizeMax: 1.8, alpha: 0.25, depth: 0.3 },
                    { count: 0.35, speed: 0.35, sizeMin: 1.0, sizeMax: 2.8, alpha: 0.50, depth: 0.6 },
                    { count: 0.20, speed: 0.65, sizeMin: 1.8, sizeMax: 4.0, alpha: 0.85, depth: 1.0 },
                ],
                connectionRadius: 150,
                connectionAlpha: 0.15,
                mouseAttractionRadius: 200,
                mouseAttractionForce: 0.012,
                mouseScatterForce: 0.8,
                mouseScatterDecay: 0.94,
                burstCount: 30,
                burstForce: 8,
                burstLife: 80,
                totalDesktop: 220,
                totalMobile: 80,
            };

            const canvas = document.getElementById('hero-canvas');
            const ctx = canvas.getContext('2d');
            let W, H, DPR;
            let particles = [];
            let bursts = [];
            let pMouse = { x: -9999, y: -9999, px: -9999, py: -9999, active: false, vx: 0, vy: 0 };
            let totalP;
            const colorKeys = Object.keys(PCONFIG.colors);

            function pRand(a, b) { return Math.random() * (b - a) + a; }
            function pDist(x1, y1, x2, y2) { const dx = x1 - x2, dy = y1 - y2; return Math.sqrt(dx * dx + dy * dy); }
            function pLerp(a, b, t) { return a + (b - a) * t; }
            function pColor() { return PCONFIG.colors[colorKeys[Math.floor(Math.random() * colorKeys.length)]]; }

            class PParticle {
                constructor(layer) {
                    this.x = pRand(0, W); this.y = pRand(0, H);
                    this.layer = layer;
                    this.baseSpeed = PCONFIG.layers[layer].speed;
                    this.vx = pRand(-1, 1) * this.baseSpeed;
                    this.vy = pRand(-1, 1) * this.baseSpeed;
                    this.radius = pRand(PCONFIG.layers[layer].sizeMin, PCONFIG.layers[layer].sizeMax);
                    this.baseAlpha = PCONFIG.layers[layer].alpha;
                    this.alpha = this.baseAlpha;
                    this.depth = PCONFIG.layers[layer].depth;
                    this.color = pColor();
                    this.sx = 0; this.sy = 0;
                    this.pp = pRand(0, Math.PI * 2);
                    this.ps = pRand(0.005, 0.02);
                    this.pa = pRand(0.1, 0.3);
                }
                update() {
                    this.sx *= PCONFIG.mouseScatterDecay;
                    this.sy *= PCONFIG.mouseScatterDecay;
                    if (pMouse.active) {
                        const d = pDist(this.x, this.y, pMouse.x, pMouse.y);
                        if (d < PCONFIG.mouseAttractionRadius && d > 1) {
                            const f = PCONFIG.mouseAttractionForce * this.depth * (1 - d / PCONFIG.mouseAttractionRadius);
                            this.vx += (pMouse.x - this.x) / d * f;
                            this.vy += (pMouse.y - this.y) / d * f;
                        }
                    }
                    this.x += this.vx + this.sx;
                    this.y += this.vy + this.sy;
                    const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                    if (spd > this.baseSpeed * 1.5) {
                        const sc = (this.baseSpeed * 1.5) / spd;
                        this.vx = pLerp(this.vx, this.vx * sc, 0.02);
                        this.vy = pLerp(this.vy, this.vy * sc, 0.02);
                    }
                    if (this.x < -20) this.x = W + 20;
                    if (this.x > W + 20) this.x = -20;
                    if (this.y < -20) this.y = H + 20;
                    if (this.y > H + 20) this.y = -20;
                    this.pp += this.ps;
                    this.alpha = this.baseAlpha * (1 + Math.sin(this.pp) * this.pa);
                }
                draw(c) {
                    const { r, g, b } = this.color;
                    c.beginPath();
                    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                    c.fillStyle = `rgba(${r},${g},${b},${this.alpha})`;
                    c.fill();
                    if (this.layer === 2 && this.radius > 2.8) {
                        c.beginPath();
                        c.arc(this.x, this.y, this.radius * 3, 0, Math.PI * 2);
                        const gr = c.createRadialGradient(this.x, this.y, this.radius * 0.5, this.x, this.y, this.radius * 3);
                        gr.addColorStop(0, `rgba(${r},${g},${b},${this.alpha * 0.25})`);
                        gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
                        c.fillStyle = gr;
                        c.fill();
                    }
                }
            }

            class PBurst {
                constructor(x, y) {
                    this.x = x; this.y = y;
                    const a = pRand(0, Math.PI * 2);
                    const f = pRand(PCONFIG.burstForce * 0.3, PCONFIG.burstForce);
                    this.vx = Math.cos(a) * f; this.vy = Math.sin(a) * f;
                    this.radius = pRand(1, 3.5);
                    this.color = pColor();
                    this.life = PCONFIG.burstLife;
                    this.maxLife = PCONFIG.burstLife;
                    this.friction = pRand(0.955, 0.975);
                }
                update() {
                    this.vx *= this.friction; this.vy *= this.friction;
                    this.x += this.vx; this.y += this.vy;
                    this.life--;
                    return this.life > 0;
                }
                draw(c) {
                    const { r, g, b } = this.color;
                    const p = this.life / this.maxLife;
                    const al = p * p;
                    const cr = this.radius * (0.3 + 0.7 * p);
                    c.beginPath();
                    c.arc(this.x, this.y, cr, 0, Math.PI * 2);
                    c.fillStyle = `rgba(${r},${g},${b},${al * 0.9})`;
                    c.fill();
                    if (cr > 1) {
                        c.beginPath();
                        c.arc(this.x, this.y, cr * 4, 0, Math.PI * 2);
                        const gr = c.createRadialGradient(this.x, this.y, 0, this.x, this.y, cr * 4);
                        gr.addColorStop(0, `rgba(${r},${g},${b},${al * 0.35})`);
                        gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
                        c.fillStyle = gr;
                        c.fill();
                    }
                }
            }

            // Spatial grid for O(n) connection lookups
            let grid = {};
            const CELL = PCONFIG.connectionRadius;

            function buildGrid() {
                grid = {};
                for (let i = 0; i < particles.length; i++) {
                    const p = particles[i];
                    const k = Math.floor(p.x / CELL) + ',' + Math.floor(p.y / CELL);
                    if (!grid[k]) grid[k] = [];
                    grid[k].push(i);
                }
            }

            function drawConnections(c) {
                buildGrid();
                const maxD = PCONFIG.connectionRadius;
                const maxDSq = maxD * maxD;
                for (const key in grid) {
                    const [cx, cy] = key.split(',').map(Number);
                    const cell = grid[key];
                    const nb = [key, (cx+1)+','+cy, (cx-1)+','+(cy+1), cx+','+(cy+1), (cx+1)+','+(cy+1)];
                    for (let n = 0; n < nb.length; n++) {
                        const nc = grid[nb[n]];
                        if (!nc) continue;
                        const same = nb[n] === key;
                        for (let i = 0; i < cell.length; i++) {
                            const ai = cell[i], a = particles[ai];
                            for (let j = same ? i + 1 : 0; j < nc.length; j++) {
                                const bi = nc[j];
                                if (ai === bi) continue;
                                const b = particles[bi];
                                if (Math.abs(a.layer - b.layer) > 1) continue;
                                const dx = a.x - b.x, dy = a.y - b.y, dSq = dx * dx + dy * dy;
                                if (dSq < maxDSq) {
                                    const d = Math.sqrt(dSq);
                                    const al = (1 - d / maxD) * PCONFIG.connectionAlpha * Math.min(a.alpha, b.alpha) * 2;
                                    if (al < 0.005) continue;
                                    c.beginPath();
                                    c.moveTo(a.x, a.y);
                                    c.lineTo(b.x, b.y);
                                    c.strokeStyle = `rgba(${(a.color.r + b.color.r) >> 1},${(a.color.g + b.color.g) >> 1},${(a.color.b + b.color.b) >> 1},${al})`;
                                    c.lineWidth = Math.max(0.3, (1 - d / maxD) * 0.8);
                                    c.stroke();
                                }
                            }
                        }
                    }
                }
                // Mouse connections
                if (pMouse.active) {
                    const mD = PCONFIG.connectionRadius * 1.3;
                    for (let i = 0; i < particles.length; i++) {
                        const p = particles[i];
                        const d = pDist(p.x, p.y, pMouse.x, pMouse.y);
                        if (d < mD) {
                            const al = (1 - d / mD) * 0.12 * p.alpha;
                            if (al < 0.005) continue;
                            c.beginPath();
                            c.moveTo(p.x, p.y);
                            c.lineTo(pMouse.x, pMouse.y);
                            c.strokeStyle = `rgba(139,92,246,${al})`;
                            c.lineWidth = 0.5;
                            c.stroke();
                        }
                    }
                }
            }

            function scatterNearby(mx, my) {
                const rad = PCONFIG.mouseAttractionRadius * 1.5;
                for (let i = 0; i < particles.length; i++) {
                    const p = particles[i];
                    const d = pDist(p.x, p.y, mx, my);
                    if (d < rad && d > 1) {
                        const f = PCONFIG.mouseScatterForce * (1 - d / rad) * p.depth;
                        p.sx += (p.x - mx) / d * f;
                        p.sy += (p.y - my) / d * f;
                    }
                }
            }

            function createBurst(x, y) {
                for (let i = 0; i < PCONFIG.burstCount; i++) bursts.push(new PBurst(x, y));
                scatterNearby(x, y);
            }

            function createParticles() {
                particles = [];
                for (let l = 0; l < PCONFIG.layers.length; l++) {
                    const cnt = Math.floor(totalP * PCONFIG.layers[l].count);
                    for (let i = 0; i < cnt; i++) particles.push(new PParticle(l));
                }
            }

            function pResize() {
                DPR = Math.min(window.devicePixelRatio || 1, 2);
                W = window.innerWidth;
                H = window.innerHeight;
                canvas.width = W * DPR;
                canvas.height = H * DPR;
                canvas.style.width = W + 'px';
                canvas.style.height = H + 'px';
                ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
                const newT = (W < 768) ? PCONFIG.totalMobile : PCONFIG.totalDesktop;
                if (newT !== totalP) { totalP = newT; createParticles(); }
            }

            let heroVis = true;
            const heroObs = new IntersectionObserver(function(entries) {
                heroVis = entries[0].isIntersecting;
            }, { threshold: 0 });
            heroObs.observe(document.getElementById('hero'));

            function pRender() {
                requestAnimationFrame(pRender);
                if (!heroVis) return;
                ctx.clearRect(0, 0, W, H);
                for (let i = 0; i < particles.length; i++) particles[i].update();
                drawConnections(ctx);
                for (let i = 0; i < particles.length; i++) particles[i].draw(ctx);
                for (let i = bursts.length - 1; i >= 0; i--) {
                    if (!bursts[i].update()) bursts.splice(i, 1);
                    else bursts[i].draw(ctx);
                }
            }

            // Events scoped to hero
            const heroEl = document.getElementById('hero');
            heroEl.addEventListener('mousemove', function(e) {
                pMouse.px = pMouse.x; pMouse.py = pMouse.y;
                pMouse.x = e.clientX; pMouse.y = e.clientY;
                pMouse.vx = pMouse.x - pMouse.px; pMouse.vy = pMouse.y - pMouse.py;
                pMouse.active = true;
                const spd = Math.sqrt(pMouse.vx * pMouse.vx + pMouse.vy * pMouse.vy);
                if (spd > 15) scatterNearby(pMouse.x, pMouse.y);
            });
            heroEl.addEventListener('mouseleave', function() { pMouse.active = false; });
            heroEl.addEventListener('click', function(e) { createBurst(e.clientX, e.clientY); });
            heroEl.addEventListener('touchmove', function(e) {
                if (e.touches.length > 0) {
                    pMouse.x = e.touches[0].clientX; pMouse.y = e.touches[0].clientY;
                    pMouse.active = true;
                }
            }, { passive: true });
            heroEl.addEventListener('touchstart', function(e) {
                if (e.touches.length > 0) {
                    pMouse.x = e.touches[0].clientX; pMouse.y = e.touches[0].clientY;
                    pMouse.active = true;
                    createBurst(pMouse.x, pMouse.y);
                }
            }, { passive: true });
            heroEl.addEventListener('touchend', function() { pMouse.active = false; }, { passive: true });

            totalP = isMobile ? PCONFIG.totalMobile : PCONFIG.totalDesktop;
            pResize();
            createParticles();
            window.addEventListener('resize', pResize);
            pRender();
        }

        /* ==========================================================
           HERO ANIMATIONS
        ========================================================== */
        function initHeroAnimations() {
            if (prefersReducedMotion) return;

            // Split headline into characters
            ['heroLine1', 'heroLine2'].forEach(id => {
                const el = document.getElementById(id);
                const text = el.textContent;
                el.innerHTML = '';
                text.split('').forEach(char => {
                    const span = document.createElement('span');
                    span.className = 'char';
                    span.textContent = char === ' ' ? '\u00A0' : char;
                    el.appendChild(span);
                });
            });

            const tl = gsap.timeline({ delay: 2.2 });

            tl.to('#heroLine1 .char', {
                y: 0,
                opacity: 1,
                duration: 0.6,
                stagger: 0.03,
                ease: 'power3.out',
                onComplete: function() {
                    document.querySelectorAll('#heroLine1 .char').forEach(function(c) { c.classList.add('revealed'); });
                }
            })
            .to('#heroLine2 .char', {
                y: 0,
                opacity: 1,
                duration: 0.6,
                stagger: 0.03,
                ease: 'power3.out',
                onComplete: function() {
                    document.querySelectorAll('#heroLine2 .char').forEach(function(c) { c.classList.add('revealed'); });
                }
            }, '-=0.3')
            .to('#heroSub', {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power3.out',
            }, '-=0.2')
            .to('#heroButtons', {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power3.out',
            }, '-=0.4')
            .to('#scrollIndicator', {
                opacity: 0.6,
                duration: 0.8,
            }, '-=0.3');

            // Set initial states
            gsap.set('#heroSub', { y: 30, opacity: 0 });
            gsap.set('#heroButtons', { y: 20, opacity: 0 });
        }

        /* ==========================================================
           SCROLL ANIMATIONS (GSAP ScrollTrigger)
        ========================================================== */
        function initScrollAnimations() {
            if (prefersReducedMotion) return;

            gsap.registerPlugin(ScrollTrigger);

            // Gradient dividers
            document.querySelectorAll('.gradient-divider').forEach(div => {
                gsap.to(div, {
                    scaleX: 1,
                    duration: 1.2,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: div,
                        start: 'top 90%',
                        toggleActions: 'play none none none',
                    }
                });
            });

            // Split section titles into chars
            const titleIds = ['servicesTitle', 'processTitle', 'demoTitle', 'pricingTitle', 'transparencyTitle', 'faqTitle', 'finalHeading', 'liveBuildTitle', 'comparisonTitle', 'aboutTitle', 'useCasesTitle'];
            titleIds.forEach(id => {
                const el = document.getElementById(id);
                if (!el) return;
                const text = el.textContent;
                el.innerHTML = '';
                text.split('').forEach(char => {
                    const span = document.createElement('span');
                    span.className = 'char';
                    span.textContent = char === ' ' ? '\u00A0' : char;
                    el.appendChild(span);
                });

                gsap.to(el.querySelectorAll('.char'), {
                    opacity: 1,
                    y: 0,
                    duration: 0.5,
                    stagger: 0.02,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: el,
                        start: 'top 80%',
                        toggleActions: 'play none none none',
                    }
                });
                gsap.set(el.querySelectorAll('.char'), { opacity: 0, y: 20 });
            });

            // Subtitles fade up
            const subIds = ['servicesSub', 'processSub', 'demoSub', 'pricingSub', 'transparencySub', 'faqSub', 'finalSub', 'liveBuildSub', 'comparisonSub', 'aboutSub', 'useCasesSub'];
            subIds.forEach(id => {
                const el = document.getElementById(id);
                if (!el) return;
                gsap.from(el, {
                    opacity: 0,
                    y: 30,
                    duration: 0.8,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: el,
                        start: 'top 85%',
                        toggleActions: 'play none none none',
                    }
                });
            });

            // Service cards stagger in
            gsap.utils.toArray('.service-card').forEach((card, i) => {
                gsap.to(card, {
                    opacity: 1,
                    y: 0,
                    duration: 0.7,
                    delay: i * 0.1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: card,
                        start: 'top 85%',
                        toggleActions: 'play none none none',
                    }
                });
            });

            // Pricing cards stagger in
            gsap.utils.toArray('.pricing-card').forEach((card, i) => {
                gsap.to(card, {
                    opacity: 1,
                    y: 0,
                    duration: 0.7,
                    delay: i * 0.15,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: card,
                        start: 'top 85%',
                        toggleActions: 'play none none none',
                    }
                });
            });

            // Transparency cards
            gsap.utils.toArray('.transparency-card').forEach((card, i) => {
                gsap.to(card, {
                    opacity: 1,
                    y: 0,
                    duration: 0.7,
                    delay: i * 0.1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: card,
                        start: 'top 85%',
                        toggleActions: 'play none none none',
                    }
                });
            });

            // Trust points
            gsap.utils.toArray('.trust-point').forEach((pt, i) => {
                gsap.to(pt, {
                    opacity: 1,
                    y: 0,
                    duration: 0.7,
                    delay: i * 0.1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: pt,
                        start: 'top 90%',
                        toggleActions: 'play none none none',
                    }
                });
            });

            // FAQ items
            gsap.utils.toArray('.faq-item').forEach((item, i) => {
                gsap.to(item, {
                    opacity: 1,
                    y: 0,
                    duration: 0.5,
                    delay: i * 0.05,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: item,
                        start: 'top 90%',
                        toggleActions: 'play none none none',
                    }
                });
            });

            // Final CTA
            gsap.from('#finalBtn', {
                scale: 0.9,
                opacity: 0,
                duration: 0.8,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: '#final-cta',
                    start: 'top 70%',
                    toggleActions: 'play none none none',
                }
            });
        }

        /* ==========================================================
           SERVICE CARD 3D TILT + GLOW
        ========================================================== */
        function initServiceCards() {
            if (isTouch) return;

            document.querySelectorAll('.service-card').forEach(card => {
                card.addEventListener('mousemove', (e) => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    const rotateX = ((y - centerY) / centerY) * -6;
                    const rotateY = ((x - centerX) / centerX) * 6;

                    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
                    card.style.setProperty('--mouse-x', (x / rect.width * 100) + '%');
                    card.style.setProperty('--mouse-y', (y / rect.height * 100) + '%');
                    card.style.setProperty('--angle', Math.atan2(y - centerY, x - centerX) * 180 / Math.PI + 'deg');
                });

                card.addEventListener('mouseleave', () => {
                    card.style.transform = '';
                });
            });
        }

        /* ==========================================================
           HORIZONTAL SCROLL (PROCESS)
        ========================================================== */
        function initHorizontalScroll() {
            if (prefersReducedMotion) return;

            const wrapper = document.getElementById('processWrapper');
            const track = document.getElementById('processTrack');
            const steps = gsap.utils.toArray('.process-step');

            if (isMobile || window.innerWidth < 768) {
                // Vertical layout on mobile
                steps.forEach((step, i) => {
                    gsap.to(step, {
                        opacity: 1,
                        x: 0,
                        duration: 0.7,
                        delay: i * 0.1,
                        ease: 'power3.out',
                        scrollTrigger: {
                            trigger: step,
                            start: 'top 85%',
                            toggleActions: 'play none none none',
                        }
                    });
                    gsap.set(step, { opacity: 0, x: 40 });
                });
                return;
            }

            gsap.registerPlugin(ScrollTrigger);

            const totalWidth = track.scrollWidth - window.innerWidth;

            // Set steps initially hidden
            steps.forEach(step => {
                gsap.set(step, { opacity: 0, x: 80 });
            });

            const scrollTween = gsap.to(track, {
                x: -totalWidth,
                ease: 'none',
                scrollTrigger: {
                    trigger: wrapper,
                    pin: true,
                    scrub: 1,
                    start: 'top top',
                    end: () => '+=' + totalWidth * 1.5,
                    invalidateOnRefresh: true,
                }
            });

            // Animate steps as they come into view
            steps.forEach((step, i) => {
                gsap.to(step, {
                    opacity: 1,
                    x: 0,
                    duration: 0.5,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: step,
                        containerAnimation: scrollTween,
                        start: 'left 80%',
                        toggleActions: 'play none none none',
                    }
                });
            });
        }

        /* ==========================================================
           LIVE WEBSITE GENERATOR — Real-time code + preview
        ========================================================== */
        function initChat() {
            var genInput = document.getElementById('genInput');
            var genGo = document.getElementById('genGo');
            var genSplit = document.getElementById('genSplit');
            var genCode = document.getElementById('genCodeContent');
            var genPreview = document.getElementById('genPreview');
            var genResult = document.getElementById('genResult');
            var genBadge = document.getElementById('genBadge');
            var genLiveBadge = document.getElementById('genLiveBadge');
            var genSuggestions = document.getElementById('genSuggestions');
            if (!genInput || !genGo) return;

            /* Template library — real HTML/CSS for each project type */
            var templates = {
                coffee: {
                    name: 'Coffee Shop Landing Page',
                    price: '$49', delivery: '24-48h', features: 8,
                    html: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Brew & Bean Coffee</title>\n  <style>\n    * { margin: 0; padding: 0; box-sizing: border-box; }\n    body { font-family: Georgia, serif; color: #2c1810; }\n    .hero {\n      min-height: 100vh;\n      background: linear-gradient(135deg, #2c1810 0%, #4a2c2a 100%);\n      display: flex; align-items: center; justify-content: center;\n      text-align: center; color: #f5e6d3; padding: 2rem;\n    }\n    .hero h1 { font-size: 3rem; margin-bottom: 1rem; letter-spacing: 0.05em; }\n    .hero p { font-size: 1.2rem; opacity: 0.85; max-width: 500px; margin: 0 auto 2rem; }\n    .btn {\n      display: inline-block; padding: 1rem 2.5rem;\n      background: #d4a574; color: #2c1810; text-decoration: none;\n      font-weight: bold; border-radius: 4px; font-size: 1rem;\n    }\n    .menu { padding: 4rem 2rem; max-width: 800px; margin: 0 auto; }\n    .menu h2 { text-align: center; font-size: 2rem; margin-bottom: 2rem; color: #2c1810; }\n    .menu-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }\n    .menu-item {\n      padding: 1.5rem; background: #faf5f0; border-radius: 8px;\n      display: flex; justify-content: space-between; align-items: center;\n    }\n    .menu-item h3 { font-size: 1.1rem; }\n    .menu-item .price { color: #d4a574; font-weight: bold; font-size: 1.2rem; }\n    .order {\n      padding: 4rem 2rem; background: #2c1810; color: #f5e6d3; text-align: center;\n    }\n    .order h2 { font-size: 2rem; margin-bottom: 1rem; }\n    .order-form { max-width: 400px; margin: 2rem auto 0; }\n    .order-form input, .order-form select {\n      width: 100%; padding: 0.8rem; margin-bottom: 1rem;\n      border: 1px solid #4a2c2a; background: #3a2420;\n      color: #f5e6d3; border-radius: 4px; font-size: 1rem;\n    }\n    .order-form button {\n      width: 100%; padding: 1rem; background: #d4a574;\n      color: #2c1810; border: none; font-size: 1.1rem;\n      font-weight: bold; border-radius: 4px; cursor: pointer;\n    }\n    footer { padding: 2rem; text-align: center; font-size: 0.9rem; color: #8b7355; }\n  </style>\n</head>\n<body>\n  <section class="hero">\n    <div>\n      <h1>Brew & Bean</h1>\n      <p>Handcrafted coffee, artisan pastries, and a warm atmosphere in the heart of the city.</p>\n      <a href="#menu" class="btn">View Our Menu</a>\n    </div>\n  </section>\n  <section class="menu" id="menu">\n    <h2>Our Menu</h2>\n    <div class="menu-grid">\n      <div class="menu-item"><div><h3>Espresso</h3><p>Rich & bold</p></div><span class="price">$3.50</span></div>\n      <div class="menu-item"><div><h3>Cappuccino</h3><p>Creamy perfection</p></div><span class="price">$4.50</span></div>\n      <div class="menu-item"><div><h3>Latte</h3><p>Smooth & silky</p></div><span class="price">$5.00</span></div>\n      <div class="menu-item"><div><h3>Cold Brew</h3><p>12-hour steep</p></div><span class="price">$4.00</span></div>\n      <div class="menu-item"><div><h3>Croissant</h3><p>Freshly baked</p></div><span class="price">$3.00</span></div>\n      <div class="menu-item"><div><h3>Avocado Toast</h3><p>Sourdough base</p></div><span class="price">$8.50</span></div>\n    </div>\n  </section>\n  <section class="order">\n    <h2>Order Online</h2>\n    <p>Skip the line. Pick up in 15 minutes.</p>\n    <form class="order-form">\n      <input type="text" placeholder="Your Name">\n      <select><option>Espresso</option><option>Cappuccino</option><option>Latte</option><option>Cold Brew</option></select>\n      <input type="text" placeholder="Pickup Time">\n      <button type="button">Place Order</button>\n    </form>\n  </section>\n  <footer>&copy; 2026 Brew & Bean Coffee. All rights reserved.</footer>\n</body>\n</html>'
                },
                portfolio: {
                    name: 'Photography Portfolio',
                    price: '$79', delivery: '2-3 days', features: 7,
                    html: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Alex Chen Photography</title>\n  <style>\n    * { margin: 0; padding: 0; box-sizing: border-box; }\n    body { font-family: \'Helvetica Neue\', sans-serif; background: #0a0a0a; color: #fff; }\n    .hero {\n      height: 100vh; display: flex; align-items: center; justify-content: center;\n      text-align: center; position: relative; overflow: hidden;\n      background: linear-gradient(135deg, #1a1a2e, #0a0a0a);\n    }\n    .hero h1 { font-size: 4rem; font-weight: 200; letter-spacing: 0.2em; margin-bottom: 0.5rem; text-transform: uppercase; }\n    .hero p { font-size: 1rem; color: #888; letter-spacing: 0.1em; }\n    .gallery { padding: 4rem 2rem; max-width: 1200px; margin: 0 auto; }\n    .gallery h2 { text-align: center; font-size: 1rem; letter-spacing: 0.2em; text-transform: uppercase; color: #666; margin-bottom: 3rem; }\n    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }\n    .grid-item {\n      aspect-ratio: 1; background: #1a1a1a; position: relative;\n      overflow: hidden; cursor: pointer;\n    }\n    .grid-item::after {\n      content: attr(data-title); position: absolute; inset: 0;\n      background: rgba(0,0,0,0.7); display: flex; align-items: center;\n      justify-content: center; font-size: 0.9rem; letter-spacing: 0.1em;\n      opacity: 0; transition: opacity 0.4s;\n    }\n    .grid-item:hover::after { opacity: 1; }\n    .grid-item .placeholder {\n      width: 100%; height: 100%; display: flex; align-items: center;\n      justify-content: center; font-size: 2rem; color: #333;\n    }\n    .c1 { background: linear-gradient(135deg, #667eea, #764ba2); }\n    .c2 { background: linear-gradient(135deg, #f093fb, #f5576c); }\n    .c3 { background: linear-gradient(135deg, #4facfe, #00f2fe); }\n    .c4 { background: linear-gradient(135deg, #43e97b, #38f9d7); }\n    .c5 { background: linear-gradient(135deg, #fa709a, #fee140); }\n    .c6 { background: linear-gradient(135deg, #a18cd1, #fbc2eb); }\n    .contact { padding: 6rem 2rem; text-align: center; }\n    .contact h2 { font-size: 2rem; font-weight: 200; margin-bottom: 1rem; }\n    .contact p { color: #666; margin-bottom: 2rem; }\n    .contact a {\n      display: inline-block; padding: 1rem 3rem; border: 1px solid #333;\n      color: #fff; text-decoration: none; font-size: 0.85rem;\n      letter-spacing: 0.15em; text-transform: uppercase; transition: all 0.3s;\n    }\n    .contact a:hover { background: #fff; color: #0a0a0a; }\n    footer { padding: 2rem; text-align: center; color: #333; font-size: 0.8rem; }\n  </style>\n</head>\n<body>\n  <section class="hero">\n    <div><h1>Alex Chen</h1><p>Photography &bull; Storytelling &bull; Art</p></div>\n  </section>\n  <section class="gallery">\n    <h2>Selected Works</h2>\n    <div class="grid">\n      <div class="grid-item" data-title="Urban Dreams"><div class="placeholder c1">&#x1F4F7;</div></div>\n      <div class="grid-item" data-title="Golden Hour"><div class="placeholder c2">&#x1F305;</div></div>\n      <div class="grid-item" data-title="Portraits"><div class="placeholder c3">&#x1F464;</div></div>\n      <div class="grid-item" data-title="Architecture"><div class="placeholder c4">&#x1F3DB;</div></div>\n      <div class="grid-item" data-title="Nature"><div class="placeholder c5">&#x1F33F;</div></div>\n      <div class="grid-item" data-title="Abstract"><div class="placeholder c6">&#x1F3A8;</div></div>\n    </div>\n  </section>\n  <section class="contact">\n    <h2>Let\'s Create Together</h2>\n    <p>Available for commissions, events, and collaborations.</p>\n    <a href="mailto:hello@alexchen.photo">Get In Touch</a>\n  </section>\n  <footer>&copy; 2026 Alex Chen Photography</footer>\n</body>\n</html>'
                },
                saas: {
                    name: 'SaaS Pricing Page',
                    price: '$99', delivery: '2-4 days', features: 10,
                    html: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>CloudSync — Pricing</title>\n  <style>\n    * { margin: 0; padding: 0; box-sizing: border-box; }\n    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0f172a; color: #e2e8f0; }\n    .header { padding: 1.5rem 2rem; display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; }\n    .logo { font-size: 1.3rem; font-weight: 800; background: linear-gradient(135deg, #6366f1, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }\n    .hero { text-align: center; padding: 4rem 2rem 2rem; }\n    .hero h1 { font-size: 3rem; font-weight: 800; margin-bottom: 1rem; }\n    .hero h1 span { background: linear-gradient(135deg, #6366f1, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }\n    .hero p { color: #94a3b8; font-size: 1.1rem; max-width: 600px; margin: 0 auto; }\n    .toggle { display: flex; justify-content: center; gap: 1rem; margin: 3rem 0; align-items: center; }\n    .toggle span { font-size: 0.9rem; color: #64748b; }\n    .toggle .active { color: #fff; }\n    .badge { background: rgba(34,197,94,0.15); color: #22c55e; padding: 0.2rem 0.6rem; border-radius: 1rem; font-size: 0.7rem; font-weight: 600; }\n    .plans { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; max-width: 1000px; margin: 0 auto; padding: 0 2rem; }\n    .plan { background: #1e293b; border: 1px solid #334155; border-radius: 1rem; padding: 2rem; position: relative; transition: all 0.3s; }\n    .plan:hover { transform: translateY(-4px); }\n    .plan.popular { border-color: #6366f1; box-shadow: 0 0 40px rgba(99,102,241,0.15); }\n    .plan-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #6366f1, #a855f7); color: #fff; padding: 0.3rem 1rem; border-radius: 1rem; font-size: 0.75rem; font-weight: 600; }\n    .plan-name { font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem; }\n    .plan-price { font-size: 3rem; font-weight: 800; margin: 1rem 0; }\n    .plan-price span { font-size: 1rem; font-weight: 400; color: #64748b; }\n    .plan-desc { color: #94a3b8; font-size: 0.9rem; margin-bottom: 1.5rem; }\n    .plan-features { list-style: none; margin-bottom: 2rem; }\n    .plan-features li { padding: 0.5rem 0; font-size: 0.9rem; color: #cbd5e1; display: flex; align-items: center; gap: 0.5rem; }\n    .plan-features li::before { content: "\\2713"; color: #22c55e; font-weight: bold; }\n    .plan-btn { display: block; width: 100%; padding: 0.9rem; text-align: center; border-radius: 0.5rem; font-weight: 600; font-size: 0.95rem; text-decoration: none; transition: all 0.3s; cursor: pointer; border: none; }\n    .plan-btn.primary { background: linear-gradient(135deg, #6366f1, #a855f7); color: #fff; }\n    .plan-btn.secondary { background: #334155; color: #fff; }\n    .plan-btn:hover { transform: translateY(-2px); }\n    .faq { max-width: 700px; margin: 4rem auto; padding: 2rem; }\n    .faq h2 { text-align: center; margin-bottom: 2rem; }\n    .faq-item { border-bottom: 1px solid #334155; padding: 1rem 0; }\n    .faq-q { font-weight: 600; cursor: pointer; }\n    .faq-a { color: #94a3b8; font-size: 0.9rem; margin-top: 0.5rem; }\n    footer { text-align: center; padding: 3rem; color: #475569; font-size: 0.85rem; }\n  </style>\n</head>\n<body>\n  <header class="header"><div class="logo">CloudSync</div><nav style="display:flex;gap:2rem;color:#94a3b8;font-size:0.9rem"><a href="#" style="color:inherit;text-decoration:none">Product</a><a href="#" style="color:inherit;text-decoration:none">Features</a><a href="#" style="color:#fff;text-decoration:none;font-weight:600">Pricing</a></nav></header>\n  <section class="hero"><h1>Simple <span>pricing</span> for everyone</h1><p>Start free. Scale as you grow. No hidden fees, cancel anytime.</p></section>\n  <div class="toggle"><span>Monthly</span><span class="active">Annual</span> <span class="badge">Save 20%</span></div>\n  <div class="plans">\n    <div class="plan"><div class="plan-name">Starter</div><div class="plan-price">$0<span>/mo</span></div><p class="plan-desc">Perfect for trying out CloudSync</p><ul class="plan-features"><li>5 projects</li><li>1GB storage</li><li>Basic analytics</li><li>Email support</li></ul><button class="plan-btn secondary">Get Started Free</button></div>\n    <div class="plan popular"><div class="plan-badge">Most Popular</div><div class="plan-name">Pro</div><div class="plan-price">$29<span>/mo</span></div><p class="plan-desc">For growing teams and businesses</p><ul class="plan-features"><li>Unlimited projects</li><li>50GB storage</li><li>Advanced analytics</li><li>Priority support</li><li>Custom domains</li><li>API access</li></ul><button class="plan-btn primary">Start Free Trial</button></div>\n    <div class="plan"><div class="plan-name">Enterprise</div><div class="plan-price">$99<span>/mo</span></div><p class="plan-desc">For large-scale operations</p><ul class="plan-features"><li>Everything in Pro</li><li>Unlimited storage</li><li>SSO & SAML</li><li>Dedicated support</li><li>SLA guarantee</li><li>Custom integrations</li></ul><button class="plan-btn secondary">Contact Sales</button></div>\n  </div>\n  <footer>&copy; 2026 CloudSync, Inc. All rights reserved.</footer>\n</body>\n</html>'
                },
                restaurant: {
                    name: 'Restaurant Website',
                    price: '$69', delivery: '2-3 days', features: 9,
                    html: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>La Maison — Fine Dining</title>\n  <style>\n    * { margin: 0; padding: 0; box-sizing: border-box; }\n    body { font-family: \'Playfair Display\', Georgia, serif; background: #0a0a0a; color: #e8dcc8; }\n    .hero { min-height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center; background: linear-gradient(180deg, #1a1208 0%, #0a0a0a 100%); }\n    .hero h1 { font-size: 4.5rem; font-weight: 400; letter-spacing: 0.15em; margin-bottom: 0.5rem; }\n    .hero .divider { width: 60px; height: 1px; background: #c9a96e; margin: 1.5rem auto; }\n    .hero p { font-size: 1rem; color: #8b7355; letter-spacing: 0.15em; text-transform: uppercase; font-family: sans-serif; }\n    .hero .btn { display: inline-block; margin-top: 2rem; padding: 1rem 3rem; border: 1px solid #c9a96e; color: #c9a96e; text-decoration: none; font-size: 0.85rem; letter-spacing: 0.2em; text-transform: uppercase; font-family: sans-serif; transition: all 0.3s; }\n    .hero .btn:hover { background: #c9a96e; color: #0a0a0a; }\n    .section { padding: 5rem 2rem; max-width: 900px; margin: 0 auto; }\n    .section h2 { text-align: center; font-size: 2rem; font-weight: 400; margin-bottom: 0.5rem; }\n    .section .subtitle { text-align: center; color: #c9a96e; font-family: sans-serif; font-size: 0.8rem; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 3rem; }\n    .menu-section { margin-bottom: 2rem; }\n    .menu-section h3 { color: #c9a96e; font-size: 1rem; letter-spacing: 0.2em; text-transform: uppercase; font-family: sans-serif; margin-bottom: 1.5rem; text-align: center; }\n    .dish { display: flex; justify-content: space-between; padding: 1rem 0; border-bottom: 1px solid #1a1a1a; }\n    .dish-name { font-size: 1.1rem; }\n    .dish-desc { font-family: sans-serif; font-size: 0.8rem; color: #8b7355; margin-top: 0.2rem; }\n    .dish-price { color: #c9a96e; font-family: sans-serif; font-weight: 600; }\n    .reservation { background: #1a1208; padding: 4rem 2rem; text-align: center; }\n    .reservation h2 { font-size: 2rem; margin-bottom: 1rem; }\n    .res-form { max-width: 400px; margin: 2rem auto 0; }\n    .res-form input, .res-form select { width: 100%; padding: 1rem; margin-bottom: 1rem; background: #0a0a0a; border: 1px solid #2a2010; color: #e8dcc8; font-size: 1rem; font-family: sans-serif; }\n    .res-form button { width: 100%; padding: 1rem; background: #c9a96e; color: #0a0a0a; border: none; font-size: 1rem; font-weight: 600; cursor: pointer; letter-spacing: 0.1em; text-transform: uppercase; font-family: sans-serif; }\n    footer { text-align: center; padding: 3rem; color: #4a3a20; font-family: sans-serif; font-size: 0.8rem; }\n  </style>\n</head>\n<body>\n  <section class="hero"><div><h1>La Maison</h1><div class="divider"></div><p>Fine Dining Experience</p><a href="#reserve" class="btn">Reserve a Table</a></div></section>\n  <section class="section"><h2>Our Menu</h2><p class="subtitle">Seasonal selections</p>\n    <div class="menu-section"><h3>Starters</h3><div class="dish"><div><div class="dish-name">Truffle Soup</div><div class="dish-desc">Black truffle, cream, sourdough</div></div><div class="dish-price">$18</div></div><div class="dish"><div><div class="dish-name">Tuna Tartare</div><div class="dish-desc">Yellowfin, avocado, citrus</div></div><div class="dish-price">$22</div></div></div>\n    <div class="menu-section"><h3>Main Course</h3><div class="dish"><div><div class="dish-name">Wagyu Ribeye</div><div class="dish-desc">A5 grade, seasonal vegetables</div></div><div class="dish-price">$85</div></div><div class="dish"><div><div class="dish-name">Dover Sole</div><div class="dish-desc">Brown butter, capers, lemon</div></div><div class="dish-price">$62</div></div></div>\n  </section>\n  <section class="reservation" id="reserve"><h2>Reserve a Table</h2><p style="color:#8b7355;font-family:sans-serif">Experience an evening you\'ll never forget.</p><form class="res-form"><input type="text" placeholder="Full Name"><input type="date"><select><option>2 Guests</option><option>4 Guests</option><option>6 Guests</option><option>Private Dining</option></select><button type="button">Reserve Now</button></form></section>\n  <footer>&copy; 2026 La Maison. All rights reserved.</footer>\n</body>\n</html>'
                },
                chatbot: {
                    name: 'AI Chatbot Landing Page',
                    price: '$89', delivery: '2-4 days', features: 8,
                    html: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>BotGenius — AI Customer Service</title>\n  <style>\n    * { margin: 0; padding: 0; box-sizing: border-box; }\n    body { font-family: -apple-system, sans-serif; background: #0a0a1a; color: #e0e0ff; }\n    .hero { min-height: 100vh; display: flex; align-items: center; padding: 2rem; }\n    .hero-inner { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }\n    .hero h1 { font-size: 3.5rem; font-weight: 800; line-height: 1.1; margin-bottom: 1.5rem; }\n    .hero h1 span { background: linear-gradient(135deg, #00d4ff, #7b2ff7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }\n    .hero p { font-size: 1.15rem; color: #8888aa; line-height: 1.7; margin-bottom: 2rem; }\n    .hero-btns { display: flex; gap: 1rem; }\n    .btn-primary { padding: 1rem 2.5rem; background: linear-gradient(135deg, #00d4ff, #7b2ff7); color: #fff; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; }\n    .btn-secondary { padding: 1rem 2.5rem; background: transparent; border: 1px solid #333; color: #fff; border-radius: 8px; font-size: 1rem; cursor: pointer; }\n    .chat-demo { background: #12122a; border: 1px solid #222244; border-radius: 16px; padding: 1.5rem; }\n    .chat-demo-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; }\n    .chat-demo-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #00d4ff, #7b2ff7); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }\n    .chat-demo-name { font-weight: 600; }\n    .chat-demo-status { font-size: 0.75rem; color: #22c55e; }\n    .msg { padding: 0.8rem 1.2rem; border-radius: 12px; margin-bottom: 0.75rem; max-width: 85%; font-size: 0.9rem; line-height: 1.5; }\n    .msg.bot { background: #1a1a3a; border-bottom-left-radius: 2px; }\n    .msg.user { background: linear-gradient(135deg, #00d4ff20, #7b2ff720); margin-left: auto; border-bottom-right-radius: 2px; }\n    .stats { padding: 4rem 2rem; }\n    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem; max-width: 1000px; margin: 0 auto; text-align: center; }\n    .stat-num { font-size: 2.5rem; font-weight: 800; background: linear-gradient(135deg, #00d4ff, #7b2ff7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }\n    .stat-label { color: #8888aa; font-size: 0.9rem; margin-top: 0.3rem; }\n    footer { text-align: center; padding: 3rem; color: #444466; }\n  </style>\n</head>\n<body>\n  <section class="hero"><div class="hero-inner"><div><h1>Your AI Customer Service, <span>Never Sleeps</span></h1><p>Deploy an intelligent chatbot in minutes. Handles 80% of customer queries automatically. Learns and improves with every conversation.</p><div class="hero-btns"><button class="btn-primary">Start Free Trial</button><button class="btn-secondary">Watch Demo</button></div></div><div class="chat-demo"><div class="chat-demo-header"><div class="chat-demo-avatar">&#x1F916;</div><div><div class="chat-demo-name">BotGenius</div><div class="chat-demo-status">Online</div></div></div><div class="msg bot">Hi! How can I help you today?</div><div class="msg user">I need to return my order #4521</div><div class="msg bot">I found your order. It\'s eligible for return. I\'ve initiated the process — you\'ll receive a return label via email within 5 minutes. Anything else?</div><div class="msg user">That was so fast! Thanks!</div><div class="msg bot">Happy to help! Your refund will be processed within 3-5 business days. Have a great day! &#x1F60A;</div></div></div></section>\n  <section class="stats"><div class="stats-grid"><div><div class="stat-num">98%</div><div class="stat-label">Resolution Rate</div></div><div><div class="stat-num">&lt;2s</div><div class="stat-label">Response Time</div></div><div><div class="stat-num">24/7</div><div class="stat-label">Availability</div></div><div><div class="stat-num">80%</div><div class="stat-label">Cost Reduction</div></div></div></section>\n  <footer>&copy; 2026 BotGenius. AI-powered customer service.</footer>\n</body>\n</html>'
                }
            };

            /* Keyword matching */
            var keywordMap = {
                coffee: ['coffee','cafe','bakery','bean','brew','tea','pastry','espresso','latte','barista'],
                portfolio: ['portfolio','photographer','gallery','photography','artist','creative','designer','photo','showcase','freelance'],
                saas: ['saas','pricing','tier','subscription','plan','software','app','startup','platform','cloud','api'],
                restaurant: ['restaurant','food','dining','menu','reservation','chef','cuisine','bistro','bar','grill','pizza','sushi'],
                chatbot: ['chatbot','chat bot','bot','customer service','support','ai chat','virtual assistant','help desk','ticket','customer']
            };

            function matchTemplate(text) {
                var lower = text.toLowerCase();
                var best = 'coffee';
                var bestScore = 0;
                for (var key in keywordMap) {
                    var score = 0;
                    for (var i = 0; i < keywordMap[key].length; i++) {
                        if (lower.indexOf(keywordMap[key][i]) !== -1) score += 2;
                    }
                    if (score > bestScore) { bestScore = score; best = key; }
                }
                return best;
            }

            /* Syntax highlighter */
            function highlight(code) {
                return code
                    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                    .replace(/(<!--[\s\S]*?-->)/g, '<span class="syn-comment">$1</span>')
                    .replace(/(&lt;\/?)([\w-]+)/g, '$1<span class="syn-tag">$2</span>')
                    .replace(/([\w-]+)(=)/g, '<span class="syn-attr">$1</span>$2')
                    .replace(/(".*?")/g, '<span class="syn-val">$1</span>');
            }

            /* Typing animation */
            function typeCode(code, callback) {
                var i = 0;
                var chunkSize = 8;
                genCode.innerHTML = '';
                genBadge.style.display = '';
                if (genLiveBadge) genLiveBadge.style.display = 'none';

                function tick() {
                    if (i >= code.length) {
                        genCode.innerHTML = highlight(code);
                        genBadge.style.display = 'none';
                        if (genLiveBadge) genLiveBadge.style.display = '';
                        if (callback) callback();
                        return;
                    }
                    i += chunkSize + Math.floor(Math.random() * 4);
                    if (i > code.length) i = code.length;
                    genCode.innerHTML = highlight(code.slice(0, i));
                    genCode.parentElement.scrollTop = genCode.parentElement.scrollHeight;

                    /* Update preview periodically */
                    if (i % 80 < chunkSize || i >= code.length) {
                        try {
                            var partial = code.slice(0, i);
                            if (partial.indexOf('</style>') > -1) {
                                genPreview.srcdoc = partial;
                            }
                        } catch(e) {}
                    }
                    requestAnimationFrame(tick);
                }
                tick();
            }

            /* Generate! */
            function generate(prompt) {
                var key = matchTemplate(prompt);
                var tmpl = templates[key];

                genSplit.style.display = '';
                genResult.style.display = 'none';
                genSuggestions.style.display = 'none';
                genGo.disabled = true;
                genGo.querySelector('.gen-go-text').textContent = 'Building...';

                typeCode(tmpl.html, function() {
                    genPreview.srcdoc = tmpl.html;
                    genResult.style.display = '';
                    document.getElementById('genPrice').textContent = tmpl.price;
                    document.getElementById('genDelivery').textContent = tmpl.delivery;
                    document.getElementById('genFeatures').textContent = tmpl.features;
                    document.getElementById('genLines').textContent = tmpl.html.split('\n').length;
                    genGo.disabled = false;
                    genGo.querySelector('.gen-go-text').textContent = 'Generate';
                });
            }

            /* Event listeners */
            genGo.addEventListener('click', function() {
                var text = genInput.value.trim();
                if (text) generate(text);
            });
            genInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    var text = genInput.value.trim();
                    if (text) generate(text);
                }
            });

            /* Suggestion chips */
            var chips = document.querySelectorAll('.gen-chip');
            for (var c = 0; c < chips.length; c++) {
                chips[c].addEventListener('click', function() {
                    genInput.value = this.getAttribute('data-prompt');
                    generate(this.getAttribute('data-prompt'));
                });
            }
        }

        /* ==========================================================
           INTELLIGENT CHAT ENGINE (shared by demo + floating widget)
        ========================================================== */
        var ntChatIntents = {
            greeting:    { w: ['hi','hello','hey','good morning','good evening','howdy','yo','greetings','sup','what\'s up'], s: 2 },
            tools:       { w: ['tools','tool','free tools','developer tools','online tools','browser tools','utilities','what tools','which tools'], s: 3 },
            json:        { w: ['json','json formatter','json format','format json','validate json','json validator','json editor'], s: 3 },
            css:         { w: ['css','gradient','color','palette','design','border radius','box shadow','flexbox','grid','tailwind'], s: 3 },
            converter:   { w: ['convert','converter','base64','markdown','csv','yaml','xml','encode','decode','transform'], s: 3 },
            text:        { w: ['text','word count','character count','case','regex','slug','lorem ipsum','diff','analyzer'], s: 3 },
            image:       { w: ['image','compress','resize','qr','qr code','screenshot','favicon','svg','picture','photo'], s: 3 },
            pro:         { w: ['pro','premium','upgrade','paid','nexttool pro','nextool pro','enhanced','clean output','branding','subscription'], s: 3 },
            pricing:     { w: ['how much','cost','price','pricing','cheap','expensive','budget','afford','pay','money','rate','fee'], s: 2 },
            privacy:     { w: ['privacy','data','tracking','secure','safe','upload','server','collect','cookies','gdpr'], s: 2 },
            pipeline:    { w: ['pipeline','chain','connect tools','send to','workflow','multi-step','combine'], s: 3 },
            workspace:   { w: ['workspace','save','saved','clipboard','history','favorites','bookmark'], s: 3 },
            process:     { w: ['how does it work','how do you work','process','steps','what happens','how to start','get started'], s: 2 },
            quality:     { w: ['example','quality','guarantee','refund','money back','proof'], s: 2 },
            comparison:  { w: ['vs','compare','alternative','better than','different from','why nextool'], s: 2 },
            help:        { w: ['help','not sure','don\'t know','confused','recommend','suggest','what should','advice'], s: 2 },
            thanks:      { w: ['thanks','thank you','great','awesome','perfect','cool','nice','appreciate','wonderful','excellent'], s: 1 },
            contact:     { w: ['contact','email','phone','call','message','reach','talk to human','real person','speak','feedback','bug'], s: 2 },
            negative:    { w: ['no thanks','not interested','too expensive','maybe later','not now','pass','nah','nope'], s: 1 }
        };

        function ntDetectIntent(text) {
            var lower = text.toLowerCase().replace(/[^\w\s']/g, ' ');
            var scores = {};
            for (var key in ntChatIntents) {
                var cfg = ntChatIntents[key];
                var score = 0;
                for (var i = 0; i < cfg.w.length; i++) {
                    if (lower.indexOf(cfg.w[i]) !== -1) {
                        score += cfg.s * (cfg.w[i].split(' ').length);
                    }
                }
                if (score > 0) scores[key] = score;
            }
            var best = null, bestScore = 0;
            for (var k in scores) {
                if (scores[k] > bestScore) { bestScore = scores[k]; best = k; }
            }
            return best || 'general';
        }

        function ntGetResponse(intent, text) {
            var pick = function(arr) { return arr[Math.floor(Math.random() * arr.length)]; };
            var contactLink = '<a href="#contact" style="color:var(--primary-light);text-decoration:underline">contact us</a>';
            var r = { html: '', chips: [] };

            switch (intent) {
                case 'greeting':
                    r.html = pick([
                        'Hey! I can help you find the right tool. We have 235+ free browser-based tools — what are you working on?',
                        'Hi there! Looking for a specific tool? Tell me what you need — JSON formatting, image compression, CSS generation, and much more.',
                        'Hey! NexTool has 235+ free developer tools. What can I help you find?'
                    ]);
                    r.chips = ['JSON tools', 'CSS generators', 'Image tools', 'What do you offer?'];
                    break;

                case 'tools':
                    r.html = '<strong>We have 235+ free tools across 6 categories:</strong><br><br>' +
                        '&#8226; <strong>Developer</strong> — JSON formatter, regex tester, JWT decoder, cron builder<br>' +
                        '&#8226; <strong>Design</strong> — Color palette, gradient generator, box shadow, CSS grid<br>' +
                        '&#8226; <strong>Converters</strong> — Base64, Markdown to HTML, JSON to CSV, YAML<br>' +
                        '&#8226; <strong>Text</strong> — Word counter, case converter, slug generator, Lorem Ipsum<br>' +
                        '&#8226; <strong>Media</strong> — Image compressor, QR generator, favicon maker<br>' +
                        '&#8226; <strong>Utilities</strong> — Password generator, UUID, stopwatch, calculator<br><br>' +
                        'All free, no sign-up needed. <a href="/free-tools/" style="color:var(--primary-light)">Browse all tools &rarr;</a>';
                    r.chips = ['JSON Formatter', 'Color Palette', 'Image Compressor', 'Get NexTool Pro'];
                    break;

                case 'json':
                    r.html = 'We have several JSON tools:<br><br>' +
                        '&#8226; <a href="/free-tools/json-formatter.html" style="color:var(--primary-light)">JSON Formatter</a> — format, validate, minify<br>' +
                        '&#8226; <a href="/free-tools/json-to-csv.html" style="color:var(--primary-light)">JSON to CSV</a> — convert JSON arrays<br>' +
                        '&#8226; <a href="/free-tools/json-to-yaml.html" style="color:var(--primary-light)">JSON to YAML</a> — format conversion<br>' +
                        '&#8226; <a href="/free-tools/json-to-typescript.html" style="color:var(--primary-light)">JSON to TypeScript</a> — generate types<br><br>' +
                        'All process locally in your browser — your data never leaves your device.';
                    r.chips = ['Try JSON Formatter', 'Other tools', 'NexTool Pro'];
                    break;

                case 'css':
                    r.html = 'Here are our CSS & design tools:<br><br>' +
                        '&#8226; <a href="/free-tools/gradient-generator.html" style="color:var(--primary-light)">Gradient Generator</a> — visual CSS gradients<br>' +
                        '&#8226; <a href="/free-tools/color-palette.html" style="color:var(--primary-light)">Color Palette</a> — generate color schemes<br>' +
                        '&#8226; <a href="/free-tools/box-shadow-generator.html" style="color:var(--primary-light)">Box Shadow</a> — visual shadow builder<br>' +
                        '&#8226; <a href="/free-tools/flexbox-playground.html" style="color:var(--primary-light)">Flexbox Playground</a> — interactive layout<br>' +
                        '&#8226; <a href="/free-tools/css-grid-generator.html" style="color:var(--primary-light)">CSS Grid</a> — visual grid builder<br><br>' +
                        'Copy the generated CSS directly to your project.';
                    r.chips = ['Color Palette', 'Other tools', 'NexTool Pro'];
                    break;

                case 'converter':
                    r.html = 'We have lots of converters:<br><br>' +
                        '&#8226; <a href="/free-tools/base64.html" style="color:var(--primary-light)">Base64</a> — encode & decode<br>' +
                        '&#8226; <a href="/free-tools/markdown-preview.html" style="color:var(--primary-light)">Markdown Preview</a> — live preview<br>' +
                        '&#8226; <a href="/free-tools/json-to-csv.html" style="color:var(--primary-light)">JSON to CSV</a><br>' +
                        '&#8226; <a href="/free-tools/json-to-yaml.html" style="color:var(--primary-light)">JSON to YAML</a><br>' +
                        '&#8226; <a href="/free-tools/html-to-markdown.html" style="color:var(--primary-light)">HTML to Markdown</a><br><br>' +
                        'All processing happens in your browser.';
                    r.chips = ['Browse all tools', 'NexTool Pro', 'Contact us'];
                    break;

                case 'text':
                    r.html = 'Text & content tools:<br><br>' +
                        '&#8226; <a href="/free-tools/text-analyzer.html" style="color:var(--primary-light)">Text Analyzer</a> — word count, readability<br>' +
                        '&#8226; <a href="/free-tools/regex-tester.html" style="color:var(--primary-light)">Regex Tester</a> — test patterns live<br>' +
                        '&#8226; <a href="/free-tools/slug-generator.html" style="color:var(--primary-light)">Slug Generator</a> — URL-friendly slugs<br>' +
                        '&#8226; <a href="/free-tools/lorem-ipsum.html" style="color:var(--primary-light)">Lorem Ipsum</a> — placeholder text<br><br>' +
                        'All free, no sign-up required.';
                    r.chips = ['Regex Tester', 'Browse all tools', 'NexTool Pro'];
                    break;

                case 'image':
                    r.html = 'Image & media tools:<br><br>' +
                        '&#8226; <a href="/free-tools/image-compressor.html" style="color:var(--primary-light)">Image Compressor</a> — up to 90% smaller<br>' +
                        '&#8226; <a href="/free-tools/qr-generator.html" style="color:var(--primary-light)">QR Generator</a> — custom QR codes<br>' +
                        '&#8226; <a href="/free-tools/image-resizer.html" style="color:var(--primary-light)">Image Resizer</a> — batch resize<br>' +
                        '&#8226; <a href="/free-tools/favicon-generator.html" style="color:var(--primary-light)">Favicon Generator</a><br><br>' +
                        'Images are processed locally — they never leave your device.';
                    r.chips = ['Image Compressor', 'QR Generator', 'Browse all tools'];
                    break;

                case 'pro':
                    r.html = '<strong>NexTool Pro — $29 one-time:</strong><br><br>' +
                        '&#8226; Clean output without NexTool branding<br>' +
                        '&#8226; Enhanced features on all 235+ tools<br>' +
                        '&#8226; Unlimited workspace saves<br>' +
                        '&#8226; No subscription — pay once, yours forever<br>' +
                        '&#8226; 30-day money-back guarantee<br><br>' +
                        'Currently at <strong>Founding Member pricing</strong> — this price will increase later.<br><br>' +
                        '<a href="/pro.html" style="color:var(--primary-light)">Learn more about NexTool Pro &rarr;</a>';
                    r.chips = ['Get NexTool Pro', 'What\'s included?', 'Browse free tools'];
                    break;

                case 'pricing':
                    r.html = '<strong>Simple pricing:</strong><br><br>' +
                        '&#8226; <strong>Free</strong> — All 235+ tools, no sign-up, no limits<br>' +
                        '&#8226; <strong>NexTool Pro</strong> — $29 one-time. Clean output, enhanced features, unlimited workspace<br><br>' +
                        'No subscription. No hidden fees. No recurring charges. The free tools stay free forever.<br><br>' +
                        '<a href="/pro.html" style="color:var(--primary-light)">See NexTool Pro details &rarr;</a>';
                    r.chips = ['Get NexTool Pro', 'Browse free tools', 'What\'s included in Pro?'];
                    break;

                case 'privacy':
                    r.html = '<strong>Your privacy is our #1 priority:</strong><br><br>' +
                        '&#8226; All tools run 100% in your browser<br>' +
                        '&#8226; No data is ever sent to any server<br>' +
                        '&#8226; No tracking cookies, no analytics trackers<br>' +
                        '&#8226; No sign-up or account required<br>' +
                        '&#8226; Your files, text, and data never leave your device<br><br>' +
                        'We literally cannot see what you process with our tools.';
                    r.chips = ['Browse tools', 'NexTool Pro', 'Contact us'];
                    break;

                case 'pipeline':
                    r.html = '<strong>Tool Pipelines</strong> let you chain tools together:<br><br>' +
                        'For example: Format JSON → Convert to CSV → Download. Or: Generate color palette → Export as CSS variables.<br><br>' +
                        'Look for the "Send to..." button on any tool to chain it with related tools. This feature is available on most of our 235+ tools.';
                    r.chips = ['Browse tools', 'NexTool Pro', 'How it works'];
                    break;

                case 'workspace':
                    r.html = '<strong>Personal Workspace</strong> auto-saves your tool results:<br><br>' +
                        '&#8226; Free users: 10 saved items<br>' +
                        '&#8226; Pro users: unlimited saves<br><br>' +
                        'Access your workspace from any tool page via the floating button, or visit <a href="/workspace.html" style="color:var(--primary-light)">workspace.html</a> directly. All data stays in your browser.';
                    r.chips = ['Get NexTool Pro', 'Browse tools', 'Privacy info'];
                    break;

                case 'process':
                    r.html = '<strong>How NexTool works:</strong><br><br>' +
                        '<strong>1. Browse</strong> — Find the tool you need from 235+ options<br>' +
                        '<strong>2. Use</strong> — Paste your data, get instant results<br>' +
                        '<strong>3. Chain</strong> — Send output to another tool via pipelines<br>' +
                        '<strong>4. Save</strong> — Auto-save results to your workspace<br>' +
                        '<strong>5. Upgrade</strong> — Get Pro for clean output and enhanced features<br><br>' +
                        'No sign-up needed. Just open a tool and start using it.';
                    r.chips = ['Browse tools', 'NexTool Pro', 'Tool Pipelines'];
                    break;

                case 'quality':
                    r.html = 'NexTool Pro comes with a <strong>30-day money-back guarantee</strong>. If it doesn\'t meet your expectations, you get a full refund — no questions asked.<br><br>' +
                        'Try any of our 235+ free tools right now to see the quality for yourself. Pro just removes branding and adds enhanced features.';
                    r.chips = ['Browse tools', 'Get NexTool Pro', 'Contact us'];
                    break;

                case 'comparison':
                    r.html = '<strong>NexTool vs alternatives:</strong><br><br>' +
                        '&#8226; <strong>vs Other tool sites</strong>: No ads, no sign-up, 235+ tools in one place<br>' +
                        '&#8226; <strong>vs Paid SaaS</strong>: Free with $29 Pro option, no monthly fees<br>' +
                        '&#8226; <strong>vs Browser extensions</strong>: No install needed, works everywhere<br><br>' +
                        'Plus: tool pipelines for chaining, personal workspace for saving, and complete privacy — your data never leaves your browser.';
                    r.chips = ['Browse tools', 'Get NexTool Pro', 'Privacy info'];
                    break;

                case 'help':
                    r.html = 'Let me help you find the right tool:<br><br>' +
                        '&#8226; <strong>Working with JSON/data?</strong> → JSON Formatter, CSV tools<br>' +
                        '&#8226; <strong>Building a website?</strong> → CSS generators, color tools<br>' +
                        '&#8226; <strong>Need to convert something?</strong> → Base64, Markdown, YAML<br>' +
                        '&#8226; <strong>Working with images?</strong> → Compressor, QR, resizer<br>' +
                        '&#8226; <strong>Writing code?</strong> → Regex tester, diff checker, minifiers<br><br>' +
                        'Or <a href="/free-tools/" style="color:var(--primary-light)">browse all 235+ tools</a>.';
                    r.chips = ['JSON tools', 'CSS tools', 'Image tools', 'Browse all'];
                    break;

                case 'thanks':
                    r.html = pick([
                        'Anytime! Enjoy the tools. If you want clean output and extra features, check out <a href="/pro.html" style="color:var(--primary-light)">NexTool Pro</a>.',
                        'Happy to help! Feel free to ask anytime you\'re looking for a specific tool.',
                        'Glad I could help! Have fun with the tools.'
                    ]);
                    r.chips = ['Browse tools', 'I have another question'];
                    break;

                case 'contact':
                    r.html = 'You can reach us at <strong>christianjunbucher@gmail.com</strong> or use the ' + contactLink + ' form below.<br><br>' +
                        'We read every message personally and usually respond within a few hours.<br><br>' +
                        'Or just keep chatting here — I can answer most questions about our tools!';
                    r.chips = ['Browse tools', 'NexTool Pro', 'Privacy info'];
                    break;

                case 'negative':
                    r.html = pick([
                        'No worries! All 235+ tools are free — you can always come back whenever you need them.',
                        'Totally fine. The free tools are always here when you need them. Have a great day!',
                        'All good! Bookmark us for when you need a quick JSON format or image compress.'
                    ]);
                    break;

                default:
                    var lower = text.toLowerCase();
                    if (lower.length < 10) {
                        r.html = 'Tell me what you\'re looking for — a specific tool, a feature question, or anything else. I\'m here to help!';
                    } else {
                        r.html = pick([
                            'Interesting! Let me see if we have a tool for that. Can you be more specific about what you need?',
                            'I\'d love to help. Could you describe what kind of tool or functionality you\'re looking for?',
                            'We have 235+ tools — I might have exactly what you need. What\'s the main thing you\'re trying to do?'
                        ]);
                    }
                    r.chips = ['JSON tools', 'CSS generators', 'Image tools', 'Browse all tools'];
                    break;
            }
            return r;
        }

        /* ==========================================================
           FLOATING CHAT WIDGET
        ========================================================== */
        function initFloatingChat() {
            var CHAT_API = null; // Set to API URL when deployed, e.g. 'https://nextool-chat.up.railway.app'

            var fab = document.getElementById('ntFab');
            var win = document.getElementById('ntChatWin');
            var body = document.getElementById('ntChatBody');
            var input = document.getElementById('ntChatIn');
            var sendBtn = document.getElementById('ntChatSnd');
            var chipsEl = document.getElementById('ntChips');
            if (!fab || !win) return;

            var isOpen = false;
            var sessionId = null;
            var history = [];
            var sending = false;

            // Try to restore session
            try { sessionId = localStorage.getItem('nt_chat_sid'); } catch(e) {}

            function toggle() {
                isOpen = !isOpen;
                fab.classList.toggle('open', isOpen);
                fab.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
                win.classList.toggle('visible', isOpen);
                if (isOpen) {
                    if (body.children.length === 0) greet();
                    setTimeout(function() { input.focus(); }, 350);
                }
            }

            function greet() {
                addBot('Hey! I\'m the NexTool AI. Looking for a specific tool? We have 235+ free developer tools — JSON formatter, color palette, regex tester, and much more. What can I help you find?');
                showChips(['JSON tools', 'CSS generators', 'Image tools', 'What do you offer?']);
            }

            function addBot(html) {
                var d = document.createElement('div');
                d.className = 'nt-m b';
                d.innerHTML = html;
                body.appendChild(d);
                body.scrollTop = body.scrollHeight;
            }

            function addUser(text) {
                var d = document.createElement('div');
                d.className = 'nt-m u';
                d.textContent = text;
                body.appendChild(d);
                body.scrollTop = body.scrollHeight;
            }

            function showTyping() {
                var existing = body.querySelector('.nt-typing');
                if (existing) return;
                var d = document.createElement('div');
                d.className = 'nt-typing';
                d.innerHTML = '<span></span><span></span><span></span>';
                body.appendChild(d);
                body.scrollTop = body.scrollHeight;
            }

            function hideTyping() {
                var t = body.querySelector('.nt-typing');
                if (t) t.remove();
            }

            function showChips(arr) {
                chipsEl.innerHTML = '';
                if (!arr || !arr.length) return;
                arr.forEach(function(label) {
                    var btn = document.createElement('button');
                    btn.className = 'nt-chip';
                    btn.textContent = label;
                    btn.addEventListener('click', function() {
                        input.value = label;
                        handleSend();
                    });
                    chipsEl.appendChild(btn);
                });
            }

            function handleSend() {
                var text = input.value.trim();
                if (!text || sending) return;
                input.value = '';
                addUser(text);
                chipsEl.innerHTML = '';
                history.push({ role: 'user', content: text });

                if (CHAT_API) {
                    sendToAPI(text);
                } else {
                    sendOffline(text);
                }
            }

            function sendOffline(text) {
                sending = true;
                showTyping();
                var intent = ntDetectIntent(text);
                var r = ntGetResponse(intent, text);
                var delay = 600 + Math.min(r.html.length * 2, 1200) + Math.random() * 400;
                setTimeout(function() {
                    hideTyping();
                    addBot(r.html);
                    if (r.chips) showChips(r.chips);
                    history.push({ role: 'assistant', content: r.html });
                    sending = false;
                }, delay);
            }

            function sendToAPI(text) {
                sending = true;
                showTyping();
                var xhr = new XMLHttpRequest();
                xhr.open('POST', CHAT_API + '/api/chat');
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.onload = function() {
                    hideTyping();
                    sending = false;
                    if (xhr.status === 200) {
                        try {
                            var data = JSON.parse(xhr.responseText);
                            sessionId = data.sessionId;
                            try { localStorage.setItem('nt_chat_sid', sessionId); } catch(e) {}
                            addBot(data.reply.replace(/\n/g, '<br>'));
                            history.push({ role: 'assistant', content: data.reply });
                        } catch(e) {
                            addBot('Something went wrong. Try again or <a href="#contact" style="color:var(--primary-light);text-decoration:underline">contact us</a>.');
                        }
                    } else {
                        addBot('I\'m having trouble connecting. Try again in a moment or <a href="#contact" style="color:var(--primary-light);text-decoration:underline">contact us</a>.');
                    }
                };
                xhr.onerror = function() {
                    hideTyping();
                    sending = false;
                    addBot('Connection issue. Try <a href="#contact" style="color:var(--primary-light);text-decoration:underline">our contact form</a> instead — we respond fast.');
                };
                xhr.send(JSON.stringify({ message: text, sessionId: sessionId }));
            }

            fab.addEventListener('click', toggle);
            sendBtn.addEventListener('click', handleSend);
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') handleSend();
            });

            // Close on Escape
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && isOpen) toggle();
            });

            // Auto-open after 30 seconds if not interacted
            var autoTimer = setTimeout(function() {
                if (!isOpen && !body.children.length) {
                    var badge = document.createElement('span');
                    badge.className = 'nt-badge';
                    fab.appendChild(badge);
                }
            }, 30000);

            // Clear auto-timer on any interaction
            fab.addEventListener('click', function() {
                clearTimeout(autoTimer);
                var badge = fab.querySelector('.nt-badge');
                if (badge) badge.remove();
            }, { once: true });
        }

        /* ==========================================================
           FAQ ACCORDION
        ========================================================== */
        function initFAQ() {
            document.querySelectorAll('.faq-question').forEach(btn => {
                btn.addEventListener('click', () => {
                    const item = btn.parentElement;
                    const answer = item.querySelector('.faq-answer');
                    const inner = answer.querySelector('.faq-answer-inner');
                    const isOpen = item.classList.contains('open');

                    // Close all others
                    document.querySelectorAll('.faq-item.open').forEach(openItem => {
                        if (openItem !== item) {
                            openItem.classList.remove('open');
                            openItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
                            openItem.querySelector('.faq-answer').style.maxHeight = '0';
                        }
                    });

                    if (isOpen) {
                        item.classList.remove('open');
                        btn.setAttribute('aria-expanded', 'false');
                        answer.style.maxHeight = '0';
                    } else {
                        item.classList.add('open');
                        btn.setAttribute('aria-expanded', 'true');
                        answer.style.maxHeight = inner.scrollHeight + 'px';
                    }
                });
            });
        }

        /* ==========================================================
           MAGNETIC BUTTONS
        ========================================================== */
        function initMagnetic() {
            if (isTouch) return;

            document.querySelectorAll('.magnetic-btn').forEach(btn => {
                btn.addEventListener('mousemove', (e) => {
                    const rect = btn.getBoundingClientRect();
                    const x = e.clientX - rect.left - rect.width / 2;
                    const y = e.clientY - rect.top - rect.height / 2;
                    btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
                });

                btn.addEventListener('mouseleave', () => {
                    btn.style.transform = '';
                });
            });
        }

        /* ==========================================================
           COUNT UP ANIMATION
        ========================================================== */
        function initCountUp() {
            if (prefersReducedMotion) return;

            document.querySelectorAll('.count-up').forEach(el => {
                const target = parseInt(el.textContent);
                gsap.from(el, {
                    textContent: 0,
                    duration: 1.5,
                    ease: 'power2.out',
                    snap: { textContent: 1 },
                    scrollTrigger: {
                        trigger: el,
                        start: 'top 85%',
                        toggleActions: 'play none none none',
                    },
                    onUpdate: function() {
                        el.textContent = Math.round(parseFloat(el.textContent));
                    }
                });
            });
        }

    })();
