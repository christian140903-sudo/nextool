    (function() {
        'use strict';

        var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        var isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        var WA_BASE = 'mailto:christianjunbucher@gmail.com?subject=NexTool%20Project&body=';

        /* === FEATURE 1: INTERACTIVE PRICING CALCULATOR === */

        function initPricingCalculator() {
            var serviceToggles = document.querySelectorAll('#calcServiceToggles .calc-toggle');
            var complexitySlider = document.getElementById('calcComplexity');
            var rushCheckbox = document.getElementById('calcRush');
            var placeholder = document.getElementById('calcPlaceholder');
            var resultContainer = document.getElementById('calcResult');
            var priceDisplay = document.getElementById('calcPriceDisplay');
            var rushBadge = document.getElementById('calcRushBadge');
            var includesEl = document.getElementById('calcIncludes');
            var deliveryEl = document.getElementById('calcDelivery');
            var ctaBtn = document.getElementById('calcCTA');
            var sliderLabels = document.querySelectorAll('.calc-slider-labels span');
            var rushLabels = document.querySelectorAll('.rush-labels span');

            if (!complexitySlider || !resultContainer) return;

            var pricing = {
                website:    { prices: [29, 99, 199],  delivery: ['Same-day', '24-48 hours', '3-5 days'] },
                chatbot:    { prices: [29, 99, 149],  delivery: ['Same-day', '24-48 hours', '3-5 days'] },
                automation: { prices: [5, 49, 99],    delivery: ['Same-day', '24 hours', '48-72 hours'] },
                content:    { prices: [5, 29, 49],    delivery: ['Same-day', 'Same-day', '24-48 hours'] },
                video:      { prices: [49, 99, 199],  delivery: ['24-48 hours', '48-72 hours', '5-7 days'] },
                data:       { prices: [5, 29, 49],    delivery: ['Same-day', 'Same-day', '24-48 hours'] }
            };

            var includes = {
                website: {
                    0: ['Single page', 'Mobile responsive', 'SEO basics', 'Free hosting'],
                    1: ['Multi-page site', 'Custom design', 'Animations', 'Analytics', 'Free hosting'],
                    2: ['Full web app', 'Complex interactions', 'CMS/backend', 'API integrations', 'Performance optimized']
                },
                chatbot: {
                    0: ['Single-platform bot', 'FAQ responses', 'Basic flow', 'Source code'],
                    1: ['Multi-platform', 'AI-powered responses', 'Custom workflows', 'Analytics dashboard'],
                    2: ['Advanced AI', 'CRM integration', 'Multi-language', 'Custom training', 'Priority support']
                },
                automation: {
                    0: ['Single workflow', 'App connection', 'Documentation', 'Free tier compatible'],
                    1: ['Multi-step workflow', 'Data transforms', 'Error handling', 'Exportable blueprint'],
                    2: ['Complex system', 'Multiple workflows', 'API integrations', 'Monitoring setup', 'Full documentation']
                },
                content: {
                    0: ['5 blog posts OR 30-day calendar', 'SEO optimized', 'Ready to publish'],
                    1: ['Full content strategy', 'Keyword research', '10+ pieces', 'Brand voice matching'],
                    2: ['Complete content system', '25+ pieces', 'Multiple formats', 'Editorial calendar', 'Analytics setup']
                },
                video: {
                    0: ['30-sec promo reel', 'Platform optimized', 'Thumbnail', 'One revision'],
                    1: ['60-sec professional video', 'Motion graphics', 'Sound design', 'Multiple formats'],
                    2: ['Full video package', 'Custom animations', 'Script writing', 'Multiple deliverables', 'Raw files included']
                },
                data: {
                    0: ['500 records scraped', 'Clean spreadsheet', 'Reusable script', 'Documentation'],
                    1: ['5,000+ records', 'Data cleaning', 'Dashboard', 'Automated updates'],
                    2: ['Enterprise scraping', 'Real-time pipeline', 'API endpoint', 'Monitoring', 'Full documentation']
                }
            };

            var complexityNames = ['Simple', 'Medium', 'Complex'];
            var selectedService = null;

            function updateCalc() {
                if (!selectedService) {
                    placeholder.style.display = '';
                    resultContainer.classList.remove('visible');
                    return;
                }

                placeholder.style.display = 'none';
                resultContainer.classList.add('visible');

                var complexity = parseInt(complexitySlider.value);
                var isRush = rushCheckbox.checked;
                var basePrice = pricing[selectedService].prices[complexity];
                var finalPrice = isRush ? Math.round(basePrice * 1.5) : basePrice;
                var deliveryTime = pricing[selectedService].delivery[complexity];
                var rushDelivery = isRush ? 'Rush: ~50% faster' : deliveryTime;

                /* Animate price counter */
                var currentText = priceDisplay.textContent.replace('$', '').replace(/,/g, '');
                var currentVal = parseInt(currentText) || 0;

                priceDisplay.classList.add('bounce');
                setTimeout(function() { priceDisplay.classList.remove('bounce'); }, 400);

                if (!prefersReducedMotion) {
                    var startTime = performance.now();
                    var duration = 400;
                    function animatePrice(now) {
                        var elapsed = now - startTime;
                        var progress = Math.min(elapsed / duration, 1);
                        var eased = 1 - Math.pow(1 - progress, 3);
                        var val = Math.round(currentVal + (finalPrice - currentVal) * eased);
                        priceDisplay.textContent = '$' + val;
                        if (progress < 1) requestAnimationFrame(animatePrice);
                        else priceDisplay.textContent = '$' + finalPrice;
                    }
                    requestAnimationFrame(animatePrice);
                } else {
                    priceDisplay.textContent = '$' + finalPrice;
                }

                /* Rush badge */
                if (isRush) { rushBadge.classList.add('visible'); }
                else { rushBadge.classList.remove('visible'); }

                /* Includes list */
                var items = includes[selectedService][complexity];
                var checkSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
                includesEl.innerHTML = items.map(function(item) { return '<li>' + checkSvg + item + '</li>'; }).join('');

                /* Delivery */
                deliveryEl.innerHTML = 'Estimated delivery: <strong>' + rushDelivery + '</strong>';

                /* CTA opens checkout modal */
                var complexityLabel = complexityNames[complexity];
                var rushLabel = isRush ? ' (Rush)' : '';
                ctaBtn.href = '#checkout';
                ctaBtn.onclick = function(e) {
                    e.preventDefault();
                    if (window.NTCheckout) window.NTCheckout.open(complexityLabel + ' ' + selectedService + rushLabel, '$' + finalPrice, selectedService);
                };
            }

            serviceToggles.forEach(function(btn) {
                btn.addEventListener('click', function() {
                    serviceToggles.forEach(function(b) { b.classList.remove('active'); });
                    btn.classList.add('active');
                    selectedService = btn.dataset.service;
                    updateCalc();
                });
            });

            complexitySlider.addEventListener('input', function() {
                var val = parseInt(complexitySlider.value);
                sliderLabels.forEach(function(lbl) {
                    lbl.classList.toggle('active-label', parseInt(lbl.dataset.level) === val);
                });
                updateCalc();
            });

            rushCheckbox.addEventListener('change', function() {
                rushLabels.forEach(function(lbl) {
                    if (lbl.dataset.rush === 'rush') {
                        lbl.classList.toggle('active-label', rushCheckbox.checked);
                    } else {
                        lbl.classList.toggle('active-label', !rushCheckbox.checked);
                    }
                });
                updateCalc();
            });
        }


        /* === FEATURE 2: TESTIMONIAL CAROUSEL === */

        function initTestimonialCarousel() {
            var track = document.getElementById('testimonialTrack');
            var container = document.getElementById('testimonialContainer');
            var dotsContainer = document.getElementById('testimonialDots');
            var prevBtn = document.getElementById('testimonialPrev');
            var nextBtn = document.getElementById('testimonialNext');
            var viewSourceBtn = document.getElementById('testimonialViewSource');

            if (!track || !container) return;

            var cards = track.querySelectorAll('.testimonial-card');
            var total = cards.length;
            var currentIndex = 0;
            var autoplayTimer = null;
            var isDragging = false;
            var startX = 0;
            var currentTranslate = 0;

            /* Build dots */
            for (var i = 0; i < total; i++) {
                var dot = document.createElement('button');
                dot.className = 'testimonial-dot' + (i === 0 ? ' active' : '');
                dot.setAttribute('role', 'tab');
                dot.setAttribute('aria-label', 'Slide ' + (i + 1));
                dot.type = 'button';
                (function(idx) {
                    dot.addEventListener('click', function() { goTo(idx); });
                })(i);
                dotsContainer.appendChild(dot);
            }

            function getCardWidth() {
                return cards[0].offsetWidth + 24; /* 1.5rem gap */
            }

            function goTo(index) {
                if (index < 0) index = total - 1;
                if (index >= total) index = 0;
                currentIndex = index;

                var cardWidth = getCardWidth();
                var containerWidth = container.offsetWidth;
                var maxTranslate = track.scrollWidth - containerWidth;
                var translateX = cardWidth * currentIndex;
                translateX = Math.min(translateX, Math.max(0, maxTranslate));

                track.style.transform = 'translateX(-' + translateX + 'px)';

                var dots = dotsContainer.querySelectorAll('.testimonial-dot');
                dots.forEach(function(d, di) {
                    d.classList.toggle('active', di === currentIndex);
                });

                resetAutoplay();
            }

            function next() { goTo(currentIndex + 1); }
            function prev() { goTo(currentIndex - 1); }

            prevBtn.addEventListener('click', prev);
            nextBtn.addEventListener('click', next);

            function startAutoplay() {
                if (prefersReducedMotion) return;
                autoplayTimer = setInterval(next, 5000);
            }

            function resetAutoplay() {
                clearInterval(autoplayTimer);
                startAutoplay();
            }

            container.addEventListener('mouseenter', function() { clearInterval(autoplayTimer); });
            container.addEventListener('mouseleave', startAutoplay);

            /* Touch/mouse drag */
            function onDragStart(e) {
                isDragging = true;
                startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
                track.style.transition = 'none';
            }

            function onDragMove(e) {
                if (!isDragging) return;
                var x = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
                currentTranslate = x - startX;
            }

            function onDragEnd() {
                if (!isDragging) return;
                isDragging = false;
                track.style.transition = '';
                if (Math.abs(currentTranslate) > 60) {
                    if (currentTranslate < 0) next();
                    else prev();
                }
                currentTranslate = 0;
            }

            container.addEventListener('mousedown', onDragStart);
            container.addEventListener('mousemove', onDragMove);
            container.addEventListener('mouseup', onDragEnd);
            container.addEventListener('mouseleave', onDragEnd);
            container.addEventListener('touchstart', onDragStart, { passive: true });
            container.addEventListener('touchmove', onDragMove, { passive: true });
            container.addEventListener('touchend', onDragEnd);

            /* GSAP scroll animations for cards */
            if (typeof gsap !== 'undefined' && !prefersReducedMotion) {
                cards.forEach(function(card, ci) {
                    gsap.to(card, {
                        opacity: 1, y: 0, duration: 0.7, delay: ci * 0.1, ease: 'power3.out',
                        scrollTrigger: {
                            trigger: card, start: 'top 90%', toggleActions: 'play none none reverse'
                        }
                    });
                });

                /* Title char split animation */
                var titleEl = document.getElementById('testimonialsTitle');
                if (titleEl) {
                    var text = titleEl.textContent;
                    titleEl.innerHTML = '';
                    text.split('').forEach(function(ch) {
                        var span = document.createElement('span');
                        span.className = 'char';
                        span.textContent = ch === ' ' ? '\u00A0' : ch;
                        titleEl.appendChild(span);
                    });
                    gsap.set(titleEl.querySelectorAll('.char'), { opacity: 0, y: 20 });
                    gsap.to(titleEl.querySelectorAll('.char'), {
                        opacity: 1, y: 0, duration: 0.5, stagger: 0.02, ease: 'power3.out',
                        scrollTrigger: { trigger: titleEl, start: 'top 80%', toggleActions: 'play none none reverse' }
                    });
                }

                var subEl = document.getElementById('testimonialsSub');
                if (subEl) {
                    gsap.from(subEl, {
                        opacity: 0, y: 30, duration: 0.8, ease: 'power3.out',
                        scrollTrigger: { trigger: subEl, start: 'top 85%', toggleActions: 'play none none reverse' }
                    });
                }

                var newDivider = document.getElementById('dividerTestimonials');
                if (newDivider) {
                    gsap.to(newDivider, {
                        scaleX: 1, duration: 1.2, ease: 'power3.out',
                        scrollTrigger: { trigger: newDivider, start: 'top 90%', toggleActions: 'play none none reverse' }
                    });
                }
            } else {
                cards.forEach(function(card) {
                    card.style.opacity = '1';
                    card.style.transform = 'none';
                });
            }

            startAutoplay();

            if (viewSourceBtn) {
                viewSourceBtn.addEventListener('click', function() {
                    window.open('view-source:' + window.location.href, '_blank');
                });
            }

            /* Keyboard navigation */
            document.addEventListener('keydown', function(e) {
                var rect = container.getBoundingClientRect();
                if (rect.top >= window.innerHeight || rect.bottom <= 0) return;
                if (e.key === 'ArrowLeft') prev();
                if (e.key === 'ArrowRight') next();
            });
        }


        /* === FEATURE 3: SOUND SYSTEM === */

        function initSoundSystem() {
            var toggle = document.getElementById('soundToggle');
            var iconOn = document.getElementById('soundIconOn');
            var iconOff = document.getElementById('soundIconOff');

            if (!toggle) return;

            var audioCtx = null;
            var soundEnabled = localStorage.getItem('nextool-sound') === 'on';
            var scrollMilestones = { 25: false, 50: false, 75: false, 100: false };
            var sectionMilestones = {};

            function updateToggleUI() {
                if (soundEnabled) {
                    toggle.classList.add('active');
                    toggle.setAttribute('aria-pressed', 'true');
                    iconOn.style.display = '';
                    iconOff.style.display = 'none';
                } else {
                    toggle.classList.remove('active');
                    toggle.setAttribute('aria-pressed', 'false');
                    iconOn.style.display = 'none';
                    iconOff.style.display = '';
                }
            }

            function getAudioCtx() {
                if (!audioCtx) {
                    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                }
                if (audioCtx.state === 'suspended') audioCtx.resume();
                return audioCtx;
            }

            function playHoverTick() {
                if (!soundEnabled || prefersReducedMotion) return;
                var ctx = getAudioCtx();
                var osc = ctx.createOscillator();
                var gain = ctx.createGain();
                osc.connect(gain); gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.value = 800;
                gain.gain.setValueAtTime(0.03, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.03);
            }

            function playClickPop() {
                if (!soundEnabled || prefersReducedMotion) return;
                var ctx = getAudioCtx();
                var osc = ctx.createOscillator();
                var gain = ctx.createGain();
                osc.connect(gain); gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);
                gain.gain.setValueAtTime(0.04, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.06);
            }

            function playSectionChime() {
                if (!soundEnabled || prefersReducedMotion) return;
                var ctx = getAudioCtx();
                [600, 800, 1000].forEach(function(freq, i) {
                    var osc = ctx.createOscillator();
                    var gain = ctx.createGain();
                    osc.connect(gain); gain.connect(ctx.destination);
                    osc.type = 'sine';
                    osc.frequency.value = freq;
                    var startT = ctx.currentTime + i * 0.07;
                    gain.gain.setValueAtTime(0, startT);
                    gain.gain.linearRampToValueAtTime(0.03, startT + 0.01);
                    gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.15);
                    osc.start(startT);
                    osc.stop(startT + 0.15);
                });
            }

            function playAchievementPing() {
                if (!soundEnabled || prefersReducedMotion) return;
                var ctx = getAudioCtx();
                [800, 1200].forEach(function(freq, i) {
                    var osc = ctx.createOscillator();
                    var gain = ctx.createGain();
                    osc.connect(gain); gain.connect(ctx.destination);
                    osc.type = 'sine';
                    osc.frequency.value = freq;
                    var startT = ctx.currentTime + i * 0.1;
                    gain.gain.setValueAtTime(0, startT);
                    gain.gain.linearRampToValueAtTime(0.04, startT + 0.01);
                    gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.2);
                    osc.start(startT);
                    osc.stop(startT + 0.2);
                });
            }

            toggle.addEventListener('click', function() {
                soundEnabled = !soundEnabled;
                localStorage.setItem('nextool-sound', soundEnabled ? 'on' : 'off');
                updateToggleUI();
                if (soundEnabled) playClickPop();
            });

            updateToggleUI();

            /* Hover sounds */
            var hoverThrottle = false;
            document.addEventListener('mouseover', function(e) {
                if (!soundEnabled || hoverThrottle) return;
                var el = e.target.closest('a, button, .service-card, .pricing-card, .faq-question, .calc-toggle, .testimonial-card');
                if (el) {
                    hoverThrottle = true;
                    playHoverTick();
                    setTimeout(function() { hoverThrottle = false; }, 80);
                }
            });

            /* Click sounds */
            document.addEventListener('click', function(e) {
                if (!soundEnabled) return;
                var el = e.target.closest('a, button');
                if (el && el !== toggle) playClickPop();
            });

            /* Scroll milestone sounds */
            var scrollThrottle = false;
            window.addEventListener('scroll', function() {
                if (!soundEnabled || scrollThrottle) return;
                scrollThrottle = true;
                setTimeout(function() { scrollThrottle = false; }, 200);

                var scrollPercent = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
                [25, 50, 75, 100].forEach(function(milestone) {
                    if (scrollPercent >= milestone && !scrollMilestones[milestone]) {
                        scrollMilestones[milestone] = true;
                        playAchievementPing();
                    }
                    if (scrollPercent < milestone - 5) {
                        scrollMilestones[milestone] = false;
                    }
                });
            });

            /* Section scroll chimes */
            if (typeof IntersectionObserver !== 'undefined') {
                var sections = document.querySelectorAll('section[id]');
                var sectionObserver = new IntersectionObserver(function(entries) {
                    entries.forEach(function(entry) {
                        if (entry.isIntersecting && !sectionMilestones[entry.target.id]) {
                            sectionMilestones[entry.target.id] = true;
                            playSectionChime();
                        }
                    });
                }, { threshold: 0.3 });

                sections.forEach(function(section) { sectionObserver.observe(section); });
            }
        }


        /* === FEATURE 4: KONAMI CODE EASTER EGG === */

        function initKonamiCode() {
            var sequence = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
            var index = 0;
            var overlay = document.getElementById('konamiOverlay');
            var closeBtn = document.getElementById('konamiClose');
            var badge = document.getElementById('konamiBadge');
            var konamiCanvas = document.getElementById('konamiCanvas');

            if (!overlay) return;

            if (localStorage.getItem('nextool-konami') === 'found') {
                badge.classList.add('visible');
            }

            document.addEventListener('keydown', function(e) {
                var key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
                if (key === sequence[index]) {
                    index++;
                    if (index === sequence.length) {
                        index = 0;
                        activateEasterEgg();
                    }
                } else {
                    index = 0;
                    if (key === sequence[0]) index = 1;
                }
            });

            function activateEasterEgg() {
                if (prefersReducedMotion) {
                    showOverlay();
                    return;
                }
                document.body.classList.add('konami-glitch');
                setTimeout(function() {
                    document.body.classList.remove('konami-glitch');
                    showOverlay();
                }, 500);
            }

            function showOverlay() {
                overlay.classList.add('visible');
                document.body.style.overflow = 'hidden';
                localStorage.setItem('nextool-konami', 'found');

                /* Count stats */
                var htmlLength = document.documentElement.outerHTML.length;
                var estimatedLines = Math.round(htmlLength / 50);
                var konamiLinesEl = document.getElementById('konamiLines');
                if (konamiLinesEl) konamiLinesEl.textContent = estimatedLines.toLocaleString() + '+';

                var animCount = 0;
                try {
                    var sheets = document.styleSheets;
                    for (var s = 0; s < sheets.length; s++) {
                        try {
                            var rules = sheets[s].cssRules;
                            for (var r = 0; r < rules.length; r++) {
                                if (rules[r] instanceof CSSKeyframesRule) animCount++;
                                if (rules[r].style && (rules[r].style.animation || rules[r].style.transition)) animCount++;
                            }
                        } catch(ex) {}
                    }
                } catch(ex) {}
                var konamiAnimEl = document.getElementById('konamiAnimations');
                if (konamiAnimEl) konamiAnimEl.textContent = Math.max(animCount, 40) + '+';

                /* Three.js confetti */
                if (!prefersReducedMotion) launchConfetti();
            }

            function closeOverlay() {
                overlay.classList.remove('visible');
                document.body.style.overflow = '';
                badge.classList.add('visible');
            }

            closeBtn.addEventListener('click', closeOverlay);
            overlay.addEventListener('click', function(e) {
                if (e.target === overlay) closeOverlay();
            });
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && overlay.classList.contains('visible')) closeOverlay();
            });
            badge.addEventListener('click', function() { activateEasterEgg(); });

            function launchConfetti() {
                var canvas = konamiCanvas;
                var c = canvas.getContext('2d');
                canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
                canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
                c.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
                var W = canvas.offsetWidth, H = canvas.offsetHeight;
                var colorPalette = ['#6366f1','#a855f7','#ec4899','#22c55e','#fbbf24','#ffffff'];
                var confetti = [];
                for (var i = 0; i < 150; i++) {
                    confetti.push({
                        x: W / 2 + (Math.random() - 0.5) * 40,
                        y: H / 2,
                        vx: (Math.random() - 0.5) * 12,
                        vy: -Math.random() * 10 - 3,
                        r: 2 + Math.random() * 4,
                        color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
                        gravity: 0.12 + Math.random() * 0.06,
                        friction: 0.98,
                        life: 120 + Math.random() * 60
                    });
                }
                var frame = 0;
                function animateConfetti() {
                    if (frame > 180) return;
                    requestAnimationFrame(animateConfetti);
                    frame++;
                    c.clearRect(0, 0, W, H);
                    var alpha = Math.max(0, 1 - frame / 180);
                    for (var j = 0; j < confetti.length; j++) {
                        var p = confetti[j];
                        p.vy += p.gravity;
                        p.vx *= p.friction;
                        p.x += p.vx;
                        p.y += p.vy;
                        c.globalAlpha = alpha * Math.max(0, 1 - frame / p.life);
                        c.fillStyle = p.color;
                        c.beginPath();
                        c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                        c.fill();
                    }
                    c.globalAlpha = 1;
                }
                animateConfetti();
            }
        }


        /* Enhanced hero replaced by Canvas 2D particle system — see initHeroCanvas() */


        /* === BLOCK 1: SCROLL PROGRESS BAR === */
        function initScrollProgress() {
            const fill = document.getElementById('scrollProgressFill');
            if (!fill) return;

            let currentWidth = 0;
            let targetWidth = 0;
            let rafId = null;

            function getScrollPercent() {
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                if (docHeight <= 0) return 0;
                return Math.min((scrollTop / docHeight) * 100, 100);
            }

            function updateBar() {
                targetWidth = getScrollPercent();
                const diff = targetWidth - currentWidth;
                if (Math.abs(diff) > 0.05) {
                    currentWidth += diff * 0.12;
                    fill.style.width = currentWidth + '%';
                    rafId = requestAnimationFrame(updateBar);
                } else {
                    currentWidth = targetWidth;
                    fill.style.width = currentWidth + '%';
                    rafId = null;
                }
            }

            function onScroll() {
                if (!rafId) {
                    rafId = requestAnimationFrame(updateBar);
                }
            }

            if (typeof lenis !== 'undefined' && lenis && lenis.on) {
                lenis.on('scroll', onScroll);
            }
            window.addEventListener('scroll', onScroll, { passive: true });

            currentWidth = getScrollPercent();
            fill.style.width = currentWidth + '%';
        }

        /* === BLOCK 2: MORPHING SVG WAVE DIVIDERS === */
        function initWaveDividers() {
            if (prefersReducedMotion) return;

            const wavePaths = document.querySelectorAll('[data-wave]');
            if (!wavePaths.length) return;

            const waveConfigs = {
                '1': { baseY: 40, amplitude: 12, speed: 0.8, phaseOffset: 0 },
                '2': { baseY: 45, amplitude: 8,  speed: 1.1, phaseOffset: 2.0 },
                '3': { baseY: 50, amplitude: 6,  speed: 0.6, phaseOffset: 4.0 }
            };

            let time = 0;
            let rafId = null;

            function generateWavePath(config, t) {
                const { baseY, amplitude, speed, phaseOffset } = config;
                const points = [];
                const segments = 8;

                for (let i = 0; i <= segments; i++) {
                    const x = (i / segments) * 1440;
                    const phase = phaseOffset + (i / segments) * Math.PI * 2;
                    const y = baseY
                        + Math.sin(t * speed + phase) * amplitude
                        + Math.sin(t * speed * 0.7 + phase * 1.3) * (amplitude * 0.4)
                        + Math.cos(t * speed * 0.3 + phase * 0.5) * (amplitude * 0.2);
                    points.push({ x, y });
                }

                let d = 'M' + points[0].x + ',' + points[0].y;
                for (let i = 0; i < points.length - 1; i++) {
                    const curr = points[i];
                    const next = points[i + 1];
                    const cpx1 = curr.x + (next.x - curr.x) / 3;
                    const cpy1 = curr.y;
                    const cpx2 = next.x - (next.x - curr.x) / 3;
                    const cpy2 = next.y;
                    d += ' C' + cpx1 + ',' + cpy1 + ' ' + cpx2 + ',' + cpy2 + ' ' + next.x + ',' + next.y;
                }
                return d;
            }

            function animate() {
                time += 0.008;
                wavePaths.forEach(function(path) {
                    var waveId = path.getAttribute('data-wave');
                    var config = waveConfigs[waveId];
                    if (!config) return;
                    path.setAttribute('d', generateWavePath(config, time));
                });
                rafId = requestAnimationFrame(animate);
            }

            var dividers = document.querySelectorAll('.wave-divider');
            var visibleCount = 0;

            var observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        visibleCount++;
                        if (visibleCount === 1 && !rafId) {
                            animate();
                        }
                    } else {
                        visibleCount = Math.max(0, visibleCount - 1);
                        if (visibleCount === 0 && rafId) {
                            cancelAnimationFrame(rafId);
                            rafId = null;
                        }
                    }
                });
            }, { threshold: 0 });

            dividers.forEach(function(div) { observer.observe(div); });

            if (!('IntersectionObserver' in window)) {
                animate();
            }
        }

        /* === BLOCK 3: FLOATING GEOMETRIC SHAPES === */
        function initFloatingShapes() {
            if (prefersReducedMotion) return;

            var container = document.getElementById('floatingShapes');
            if (!container) return;

            var shapeDefinitions = [
                { type: 'circle',  count: 3 },
                { type: 'ring',    count: 2 },
                { type: 'triangle', count: 2 },
                { type: 'hexagon', count: 2 },
                { type: 'diamond', count: 2 },
                { type: 'cross',   count: 1 }
            ];

            var shapes = [];
            var sizeRange = isMobile ? [6, 20] : [8, 40];
            var opacityRange = [0.03, 0.1];

            shapeDefinitions.forEach(function(def) {
                for (var i = 0; i < def.count; i++) {
                    var el = document.createElement('div');
                    var size = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);
                    var opacity = opacityRange[0] + Math.random() * (opacityRange[1] - opacityRange[0]);
                    var x = Math.random() * 100;
                    var y = Math.random() * 100;
                    var parallaxFactor = 0.02 + Math.random() * 0.08;
                    var driftSpeedX = (Math.random() - 0.5) * 0.15;
                    var driftSpeedY = (Math.random() - 0.5) * 0.1;
                    var rotationSpeed = (Math.random() - 0.5) * 0.3;
                    var mouseRepelStrength = 15 + Math.random() * 35;

                    el.className = 'floating-shape floating-shape--' + def.type;

                    if (def.type === 'triangle') {
                        el.style.setProperty('--tri-size', (size * 0.5) + 'px');
                    } else {
                        el.style.width = size + 'px';
                        el.style.height = size + 'px';
                    }

                    el.style.opacity = opacity;
                    el.style.left = x + '%';
                    el.style.top = y + '%';
                    el.style.mixBlendMode = 'screen';

                    container.appendChild(el);

                    shapes.push({
                        el: el,
                        baseX: x,
                        baseY: y,
                        currentX: 0,
                        currentY: 0,
                        targetX: 0,
                        targetY: 0,
                        parallaxFactor: parallaxFactor,
                        driftSpeedX: driftSpeedX,
                        driftSpeedY: driftSpeedY,
                        rotationSpeed: rotationSpeed,
                        rotation: Math.random() * 360,
                        mouseRepelStrength: mouseRepelStrength,
                        driftPhaseX: Math.random() * Math.PI * 2,
                        driftPhaseY: Math.random() * Math.PI * 2,
                        size: size
                    });
                }
            });

            var scrollY = window.pageYOffset || 0;
            var localMouseX = window.innerWidth / 2;
            var localMouseY = window.innerHeight / 2;
            var time = 0;

            if (!isTouch) {
                document.addEventListener('mousemove', function(e) {
                    localMouseX = e.clientX;
                    localMouseY = e.clientY;
                }, { passive: true });
            }

            window.addEventListener('scroll', function() {
                scrollY = window.pageYOffset || 0;
            }, { passive: true });

            function animate() {
                time += 0.005;

                shapes.forEach(function(shape) {
                    var scrollOffset = scrollY * shape.parallaxFactor;
                    var driftX = Math.sin(time + shape.driftPhaseX) * 20 * Math.abs(shape.driftSpeedX);
                    var driftY = Math.cos(time * 0.8 + shape.driftPhaseY) * 15 * Math.abs(shape.driftSpeedY);

                    var mouseOffsetX = 0;
                    var mouseOffsetY = 0;

                    if (!isTouch) {
                        var rect = shape.el.getBoundingClientRect();
                        var shapeCenterX = rect.left + rect.width / 2;
                        var shapeCenterY = rect.top + rect.height / 2;
                        var dx = shapeCenterX - localMouseX;
                        var dy = shapeCenterY - localMouseY;
                        var dist = Math.sqrt(dx * dx + dy * dy);
                        var maxDist = 250;

                        if (dist < maxDist && dist > 0) {
                            var force = ((maxDist - dist) / maxDist) * shape.mouseRepelStrength;
                            mouseOffsetX = (dx / dist) * force;
                            mouseOffsetY = (dy / dist) * force;
                        }
                    }

                    shape.targetX = driftX + mouseOffsetX;
                    shape.targetY = -scrollOffset + driftY + mouseOffsetY;

                    shape.currentX += (shape.targetX - shape.currentX) * 0.03;
                    shape.currentY += (shape.targetY - shape.currentY) * 0.03;

                    shape.rotation += shape.rotationSpeed * 0.2;

                    shape.el.style.transform = 'translate(' + shape.currentX + 'px, ' + shape.currentY + 'px) rotate(' + shape.rotation + 'deg)';
                });

                requestAnimationFrame(animate);
            }

            animate();
        }

        /* === BLOCK 4: TEXT SCRAMBLE / DECODE EFFECT === */
        var TextScramble = (function() {
            function TextScramble(el, options) {
                options = options || {};
                this.el = el;
                this.originalText = el.textContent;
                this.duration = options.duration || 1500;
                this.chars = '!<>-_\\/[]{}—=+*^?#________ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                this.frameInterval = 30;
                this.isRunning = false;
                this.hasRun = false;
            }

            TextScramble.prototype.scramble = function() {
                if (this.isRunning || this.hasRun) return;
                if (prefersReducedMotion) {
                    this.el.textContent = this.originalText;
                    this.el.classList.add('resolved');
                    this.hasRun = true;
                    return;
                }

                this.isRunning = true;
                this.el.classList.add('scrambling');
                this.el.classList.remove('resolved');

                var text = this.originalText;
                var length = text.length;
                var resolveOrder = [];
                var self = this;

                for (var i = 0; i < length; i++) {
                    var baseTime = (i / length) * this.duration * 0.85;
                    var jitter = (Math.random() - 0.3) * (this.duration * 0.15);
                    resolveOrder.push({
                        index: i,
                        resolveAt: Math.max(100, baseTime + jitter),
                        char: text[i],
                        resolved: text[i] === ' '
                    });
                }

                var startTime = performance.now();
                var lastFrame = 0;

                function animate(now) {
                    var elapsed = now - startTime;

                    if (elapsed - lastFrame < self.frameInterval) {
                        if (elapsed < self.duration) {
                            requestAnimationFrame(animate);
                        }
                        return;
                    }
                    lastFrame = elapsed;

                    var output = '';
                    var allResolved = true;

                    for (var i = 0; i < resolveOrder.length; i++) {
                        var item = resolveOrder[i];
                        if (item.resolved) {
                            output += item.char;
                        } else if (elapsed >= item.resolveAt) {
                            item.resolved = true;
                            output += item.char;
                        } else {
                            allResolved = false;
                            output += self.chars[Math.floor(Math.random() * self.chars.length)];
                        }
                    }

                    self.el.textContent = output;

                    if (allResolved || elapsed >= self.duration) {
                        self.el.textContent = self.originalText;
                        self.el.classList.remove('scrambling');
                        self.el.classList.add('resolved');
                        self.isRunning = false;
                        self.hasRun = true;
                        return;
                    }

                    requestAnimationFrame(animate);
                }

                var initial = '';
                for (var i = 0; i < length; i++) {
                    initial += text[i] === ' ' ? ' ' : this.chars[Math.floor(Math.random() * this.chars.length)];
                }
                this.el.textContent = initial;

                requestAnimationFrame(animate);
            };

            TextScramble.prototype.reset = function() {
                this.hasRun = false;
                this.isRunning = false;
                this.el.textContent = this.originalText;
                this.el.classList.remove('scrambling', 'resolved');
            };

            return TextScramble;
        })();

        function initTextScramble() {
            var elements = document.querySelectorAll('.scramble-text');
            if (!elements.length) return;

            var scramblers = [];

            elements.forEach(function(el) {
                var scrambler = new TextScramble(el, { duration: 1500 });
                scramblers.push(scrambler);

                if (prefersReducedMotion) {
                    scrambler.scramble();
                    return;
                }

                var observer = new IntersectionObserver(function(entries) {
                    entries.forEach(function(entry) {
                        if (entry.isIntersecting && !scrambler.hasRun) {
                            setTimeout(function() { scrambler.scramble(); }, 150);
                            observer.unobserve(el);
                        }
                    });
                }, {
                    threshold: 0.3,
                    rootMargin: '0px 0px -50px 0px'
                });

                observer.observe(el);
            });

            window._textScramblers = scramblers;
        }

        /* === BLOCK 5: MOUSE-REACTIVE GRADIENT BLOBS === */
        function initSectionBlobs() {
            if (prefersReducedMotion) return;

            var sections = document.querySelectorAll('section');
            if (!sections.length) return;

            var blobVariants = [
                { className: 'section-blob--1', offsetX: -15, offsetY: -10 },
                { className: 'section-blob--2', offsetX: 60,  offsetY: 20 },
                { className: 'section-blob--3', offsetX: 30,  offsetY: 70 },
                { className: 'section-blob--4', offsetX: -20, offsetY: 50 },
                { className: 'section-blob--5', offsetX: 70,  offsetY: -5 }
            ];

            var allBlobs = [];
            var variantIndex = 0;

            sections.forEach(function(section) {
                var computed = getComputedStyle(section);
                if (computed.position === 'static') {
                    section.style.position = 'relative';
                }
                if (computed.overflow !== 'hidden') {
                    section.style.overflow = 'hidden';
                }

                var blobCount = Math.random() > 0.4 ? 2 : 1;

                for (var i = 0; i < blobCount; i++) {
                    var variant = blobVariants[variantIndex % blobVariants.length];
                    variantIndex++;

                    var blob = document.createElement('div');
                    blob.className = 'section-blob ' + variant.className;
                    blob.style.left = variant.offsetX + '%';
                    blob.style.top = variant.offsetY + '%';
                    blob.style.transform = 'translate(0px, 0px)';

                    section.appendChild(blob);

                    allBlobs.push({
                        el: blob,
                        section: section,
                        currentX: 0,
                        currentY: 0,
                        targetX: 0,
                        targetY: 0,
                        driftPhaseX: Math.random() * Math.PI * 2,
                        driftPhaseY: Math.random() * Math.PI * 2,
                        driftSpeed: 0.3 + Math.random() * 0.4,
                        mouseInfluence: 0.02 + Math.random() * 0.03,
                        visible: false
                    });
                }
            });

            var observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    var sectionBlobs = allBlobs.filter(function(b) { return b.section === entry.target; });
                    sectionBlobs.forEach(function(b) {
                        b.visible = entry.isIntersecting;
                    });
                });
            }, { threshold: 0.1 });

            sections.forEach(function(section) { observer.observe(section); });

            var localMouseX = window.innerWidth / 2;
            var localMouseY = window.innerHeight / 2;
            var time = 0;

            if (!isTouch) {
                document.addEventListener('mousemove', function(e) {
                    localMouseX = e.clientX;
                    localMouseY = e.clientY;
                }, { passive: true });
            }

            function animate() {
                time += 0.005;

                allBlobs.forEach(function(blob) {
                    if (!blob.visible) return;

                    var driftX = Math.sin(time * blob.driftSpeed + blob.driftPhaseX) * 30;
                    var driftY = Math.cos(time * blob.driftSpeed * 0.7 + blob.driftPhaseY) * 20;

                    var mouseOffsetX = 0;
                    var mouseOffsetY = 0;

                    if (!isTouch) {
                        var sectionRect = blob.section.getBoundingClientRect();
                        var relMouseX = (localMouseX - sectionRect.left) / sectionRect.width;
                        var relMouseY = (localMouseY - sectionRect.top) / sectionRect.height;

                        if (relMouseX >= -0.2 && relMouseX <= 1.2 && relMouseY >= -0.2 && relMouseY <= 1.2) {
                            mouseOffsetX = (relMouseX - 0.5) * sectionRect.width * blob.mouseInfluence;
                            mouseOffsetY = (relMouseY - 0.5) * sectionRect.height * blob.mouseInfluence;
                        }
                    }

                    blob.targetX = driftX + mouseOffsetX;
                    blob.targetY = driftY + mouseOffsetY;

                    blob.currentX += (blob.targetX - blob.currentX) * 0.015;
                    blob.currentY += (blob.targetY - blob.currentY) * 0.015;

                    blob.el.style.transform = 'translate(' + blob.currentX + 'px, ' + blob.currentY + 'px)';
                });

                requestAnimationFrame(animate);
            }

            animate();
        }

        /* === BLOCK 6: BACK TO TOP BUTTON === */
        function initBackToTop() {
            var btn = document.getElementById('backToTop');
            if (!btn) return;

            var progressCircle = btn.querySelector('.progress-ring circle');
            var circumference = 157;
            var showThreshold = 500;

            function updateButton() {
                var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                var docHeight = document.documentElement.scrollHeight - window.innerHeight;

                if (scrollTop > showThreshold) {
                    btn.classList.add('visible');
                } else {
                    btn.classList.remove('visible');
                }

                if (progressCircle && docHeight > 0) {
                    var progress = Math.min(scrollTop / docHeight, 1);
                    var offset = circumference - (progress * circumference);
                    progressCircle.style.strokeDashoffset = offset;
                }
            }

            window.addEventListener('scroll', updateButton, { passive: true });

            btn.addEventListener('click', function() {
                if (typeof lenis !== 'undefined' && lenis && lenis.scrollTo) {
                    lenis.scrollTo(0, {
                        duration: 1.5,
                        easing: function(t) { return 1 - Math.pow(1 - t, 4); }
                    });
                } else {
                    window.scrollTo({
                        top: 0,
                        behavior: prefersReducedMotion ? 'auto' : 'smooth'
                    });
                }
            });

            updateButton();
        }

        /* === BLOCK 7: ANIMATED SVG SERVICE ICONS === */
        function initAnimatedIcons() {
            if (prefersReducedMotion) return;

            var cards = document.querySelectorAll('.service-card');
            if (!cards.length) return;

            cards.forEach(function(card) {
                var svg = card.querySelector('.service-icon svg');
                if (!svg) return;

                var elements = svg.querySelectorAll('path, rect, circle, polyline, line, polygon, ellipse');

                elements.forEach(function(el) {
                    var length;
                    try {
                        length = el.getTotalLength();
                    } catch (e) {
                        var bbox = el.getBBox();
                        length = (bbox.width + bbox.height) * 2;
                    }

                    el.style.strokeDasharray = length;
                    el.style.strokeDashoffset = length;
                });

                svg.classList.add('icon-animate-ready');

                card._svg = svg;
                card._svgElements = elements;
            });

            var observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (!entry.isIntersecting) return;

                    var card = entry.target;
                    var svg = card._svg;
                    var elements = card._svgElements;
                    if (!svg || !elements) return;

                    var allCards = Array.from(cards);
                    var cardIndex = allCards.indexOf(card);
                    var staggerDelay = cardIndex * 150;

                    setTimeout(function() {
                        elements.forEach(function(el, elIndex) {
                            var elDelay = elIndex * 80;
                            setTimeout(function() {
                                el.style.transition = 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
                                el.style.strokeDashoffset = '0';
                            }, elDelay);
                        });

                        var totalTime = elements.length * 80 + 800;
                        setTimeout(function() {
                            svg.classList.add('icon-drawn');
                            svg.classList.remove('icon-animate-ready');
                        }, totalTime);
                    }, staggerDelay);

                    observer.unobserve(card);
                });
            }, {
                threshold: 0.3,
                rootMargin: '0px 0px -30px 0px'
            });

            cards.forEach(function(card) { observer.observe(card); });
        }

        /* === SECTION: MARQUEE BAND === */
        function initMarqueeBand() {
            if (typeof prefersReducedMotion !== 'undefined' && prefersReducedMotion) return;
        }

        /* === SECTION: LIVE BUILD DEMO === */
        function initLiveBuild() {
            var section = document.getElementById('live-build');
            if (!section) return;

            var codeContent = document.getElementById('lbCodeContent');
            var lineNumbers = document.getElementById('lbLineNumbers');
            var cursor = document.getElementById('lbCursor');
            var progressFill = document.getElementById('lbProgressFill');
            var progressLabel = document.getElementById('lbProgressLabel');
            var result = document.getElementById('lbResult');

            var hasPlayed = false;
            var isPlaying = false;

            var steps = [
                { code: '<span class="syn-comment">&lt;!-- Navigation --&gt;</span>', showPreview: null, progress: 5 },
                { code: '<span class="syn-punct">&lt;</span><span class="syn-tag">nav</span> <span class="syn-attr">class</span><span class="syn-punct">=</span><span class="syn-str">"navbar"</span><span class="syn-punct">&gt;</span>', showPreview: null, progress: 10 },
                { code: '  <span class="syn-punct">&lt;</span><span class="syn-tag">span</span> <span class="syn-attr">class</span><span class="syn-punct">=</span><span class="syn-str">"brand"</span><span class="syn-punct">&gt;</span><span class="syn-text">La Cucina</span><span class="syn-punct">&lt;/</span><span class="syn-tag">span</span><span class="syn-punct">&gt;</span>', showPreview: null, progress: 15 },
                { code: '  <span class="syn-punct">&lt;</span><span class="syn-tag">div</span> <span class="syn-attr">class</span><span class="syn-punct">=</span><span class="syn-str">"nav-links"</span><span class="syn-punct">&gt;</span>Menu | About | Reserve<span class="syn-punct">&lt;/</span><span class="syn-tag">div</span><span class="syn-punct">&gt;</span>', showPreview: null, progress: 18 },
                { code: '<span class="syn-punct">&lt;/</span><span class="syn-tag">nav</span><span class="syn-punct">&gt;</span>', showPreview: 'pvNav', progress: 22 },
                { code: '', showPreview: null, progress: 23 },
                { code: '<span class="syn-comment">&lt;!-- Hero Section --&gt;</span>', showPreview: null, progress: 25 },
                { code: '<span class="syn-punct">&lt;</span><span class="syn-tag">section</span> <span class="syn-attr">class</span><span class="syn-punct">=</span><span class="syn-str">"hero"</span><span class="syn-punct">&gt;</span>', showPreview: null, progress: 28 },
                { code: '  <span class="syn-punct">&lt;</span><span class="syn-tag">h1</span><span class="syn-punct">&gt;</span><span class="syn-text">Authentic Italian Dining</span><span class="syn-punct">&lt;/</span><span class="syn-tag">h1</span><span class="syn-punct">&gt;</span>', showPreview: null, progress: 35 },
                { code: '  <span class="syn-punct">&lt;</span><span class="syn-tag">p</span><span class="syn-punct">&gt;</span><span class="syn-text">Fresh ingredients. Family recipes.</span><span class="syn-punct">&lt;/</span><span class="syn-tag">p</span><span class="syn-punct">&gt;</span>', showPreview: null, progress: 40 },
                { code: '  <span class="syn-punct">&lt;</span><span class="syn-tag">a</span> <span class="syn-attr">class</span><span class="syn-punct">=</span><span class="syn-str">"btn"</span><span class="syn-punct">&gt;</span><span class="syn-text">Reserve a Table</span><span class="syn-punct">&lt;/</span><span class="syn-tag">a</span><span class="syn-punct">&gt;</span>', showPreview: null, progress: 45 },
                { code: '<span class="syn-punct">&lt;/</span><span class="syn-tag">section</span><span class="syn-punct">&gt;</span>', showPreview: 'pvHero', progress: 50 },
                { code: '', showPreview: null, progress: 51 },
                { code: '<span class="syn-comment">&lt;!-- Menu Grid --&gt;</span>', showPreview: null, progress: 55 },
                { code: '<span class="syn-punct">&lt;</span><span class="syn-tag">section</span> <span class="syn-attr">class</span><span class="syn-punct">=</span><span class="syn-str">"menu"</span><span class="syn-punct">&gt;</span>', showPreview: null, progress: 58 },
                { code: '  <span class="syn-punct">&lt;</span><span class="syn-tag">h2</span><span class="syn-punct">&gt;</span><span class="syn-text">Our Signature Dishes</span><span class="syn-punct">&lt;/</span><span class="syn-tag">h2</span><span class="syn-punct">&gt;</span>', showPreview: null, progress: 62 },
                { code: '  <span class="syn-punct">&lt;</span><span class="syn-tag">div</span> <span class="syn-attr">class</span><span class="syn-punct">=</span><span class="syn-str">"grid"</span><span class="syn-punct">&gt;</span>', showPreview: null, progress: 65 },
                { code: '    <span class="syn-punct">&lt;</span><span class="syn-tag">div</span> <span class="syn-attr">class</span><span class="syn-punct">=</span><span class="syn-str">"card"</span><span class="syn-punct">&gt;</span>Truffle Risotto — $28<span class="syn-punct">&lt;/</span><span class="syn-tag">div</span><span class="syn-punct">&gt;</span>', showPreview: null, progress: 70 },
                { code: '    <span class="syn-punct">&lt;</span><span class="syn-tag">div</span> <span class="syn-attr">class</span><span class="syn-punct">=</span><span class="syn-str">"card"</span><span class="syn-punct">&gt;</span>Margherita Pizza — $18<span class="syn-punct">&lt;/</span><span class="syn-tag">div</span><span class="syn-punct">&gt;</span>', showPreview: null, progress: 75 },
                { code: '    <span class="syn-punct">&lt;</span><span class="syn-tag">div</span> <span class="syn-attr">class</span><span class="syn-punct">=</span><span class="syn-str">"card"</span><span class="syn-punct">&gt;</span>Pappardelle Ragu — $24<span class="syn-punct">&lt;/</span><span class="syn-tag">div</span><span class="syn-punct">&gt;</span>', showPreview: null, progress: 78 },
                { code: '    <span class="syn-punct">&lt;</span><span class="syn-tag">div</span> <span class="syn-attr">class</span><span class="syn-punct">=</span><span class="syn-str">"card"</span><span class="syn-punct">&gt;</span>Burrata Salad — $16<span class="syn-punct">&lt;/</span><span class="syn-tag">div</span><span class="syn-punct">&gt;</span>', showPreview: null, progress: 82 },
                { code: '  <span class="syn-punct">&lt;/</span><span class="syn-tag">div</span><span class="syn-punct">&gt;</span>', showPreview: null, progress: 85 },
                { code: '<span class="syn-punct">&lt;/</span><span class="syn-tag">section</span><span class="syn-punct">&gt;</span>', showPreview: 'pvMenu', progress: 88 },
                { code: '', showPreview: null, progress: 89 },
                { code: '<span class="syn-comment">&lt;!-- Footer --&gt;</span>', showPreview: null, progress: 92 },
                { code: '<span class="syn-punct">&lt;</span><span class="syn-tag">footer</span><span class="syn-punct">&gt;</span><span class="syn-text">&copy; 2026 La Cucina</span><span class="syn-punct">&lt;/</span><span class="syn-tag">footer</span><span class="syn-punct">&gt;</span>', showPreview: 'pvFooter', progress: 98 },
            ];

            var currentLine = 1;

            function addCodeLine(htmlString) {
                if (cursor && cursor.parentNode === codeContent) {
                    codeContent.removeChild(cursor);
                }

                if (htmlString !== '') {
                    var lineDiv = document.createElement('div');
                    lineDiv.innerHTML = htmlString;
                    lineDiv.style.opacity = '0';
                    lineDiv.style.transform = 'translateX(-6px)';
                    codeContent.appendChild(lineDiv);

                    requestAnimationFrame(function() {
                        lineDiv.style.transition = 'opacity 0.3s, transform 0.3s';
                        lineDiv.style.opacity = '1';
                        lineDiv.style.transform = 'translateX(0)';
                    });
                } else {
                    var br = document.createElement('div');
                    br.innerHTML = '&nbsp;';
                    codeContent.appendChild(br);
                }

                codeContent.appendChild(cursor);

                currentLine++;
                lineNumbers.innerHTML = '';
                for (var i = 1; i <= currentLine; i++) {
                    lineNumbers.innerHTML += i + '<br>';
                }

                codeContent.scrollTop = codeContent.scrollHeight;
            }

            function showPreviewElement(id) {
                if (!id) return;
                var el = document.getElementById(id);
                if (el) {
                    el.classList.add('visible');
                }
            }

            function updateProgress(pct) {
                if (progressFill) progressFill.style.width = pct + '%';
                if (progressLabel) progressLabel.textContent = pct + '% complete';
            }

            function runDemo() {
                if (isPlaying) return;
                isPlaying = true;

                var totalDuration = 15000;
                var stepDelay = totalDuration / steps.length;

                steps.forEach(function(step, i) {
                    setTimeout(function() {
                        addCodeLine(step.code);
                        showPreviewElement(step.showPreview);
                        updateProgress(step.progress);

                        if (i === steps.length - 1) {
                            setTimeout(function() {
                                updateProgress(100);
                                if (progressLabel) progressLabel.textContent = 'Deployed!';
                                if (result) result.classList.add('visible');
                                isPlaying = false;
                            }, 600);
                        }
                    }, i * stepDelay);
                });
            }

            if (prefersReducedMotion) {
                steps.forEach(function(step) {
                    addCodeLine(step.code);
                    showPreviewElement(step.showPreview);
                });
                updateProgress(100);
                if (progressLabel) progressLabel.textContent = 'Deployed!';
                if (result) result.classList.add('visible');
                return;
            }

            var observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting && !hasPlayed) {
                        hasPlayed = true;
                        setTimeout(runDemo, 400);
                        observer.disconnect();
                    }
                });
            }, { threshold: 0.3 });

            observer.observe(section);
        }

        /* === SECTION: COMPARISON TABLE === */
        function initComparison() {
            if (prefersReducedMotion) return;

            if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

            var rows = document.querySelectorAll('#comparisonBody tr');
            rows.forEach(function(row, i) {
                gsap.to(row, {
                    opacity: 1,
                    y: 0,
                    duration: 0.5,
                    delay: i * 0.07,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: row,
                        start: 'top 90%',
                        toggleActions: 'play none none reverse',
                    }
                });
            });

            var divider = document.getElementById('dividerComparison');
            if (divider) {
                gsap.to(divider, {
                    scaleX: 1,
                    duration: 1.2,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: divider,
                        start: 'top 90%',
                        toggleActions: 'play none none reverse',
                    }
                });
            }
        }

        /* === SECTION: ABOUT / OUR STORY === */
        function initAboutStory() {
            if (prefersReducedMotion) return;

            if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

            var stats = document.querySelectorAll('.about-stat');
            stats.forEach(function(stat, i) {
                gsap.to(stat, {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    delay: i * 0.1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: stat,
                        start: 'top 90%',
                        toggleActions: 'play none none reverse',
                    }
                });
            });

            var paragraphs = document.querySelectorAll('.about-text p');
            paragraphs.forEach(function(p, i) {
                gsap.from(p, {
                    opacity: 0,
                    y: 25,
                    duration: 0.7,
                    delay: i * 0.12,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: p,
                        start: 'top 88%',
                        toggleActions: 'play none none reverse',
                    }
                });
            });

            var divider = document.getElementById('dividerAbout');
            if (divider) {
                gsap.to(divider, {
                    scaleX: 1,
                    duration: 1.2,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: divider,
                        start: 'top 90%',
                        toggleActions: 'play none none reverse',
                    }
                });
            }

            var blocks = document.querySelectorAll('.about-floating-block');
            blocks.forEach(function(block, i) {
                gsap.from(block, {
                    opacity: 0,
                    scale: 0.8,
                    y: 40,
                    duration: 0.8,
                    delay: 0.2 + i * 0.15,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: '.about-visual',
                        start: 'top 80%',
                        toggleActions: 'play none none reverse',
                    }
                });
            });
        }


        /* === USE CASES GALLERY === */
        function initUseCases() {
            if (prefersReducedMotion) return;
            if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

            var cards = document.querySelectorAll('.use-case-card');
            cards.forEach(function(card, i) {
                gsap.from(card, {
                    opacity: 0,
                    y: 40,
                    scale: 0.95,
                    duration: 0.6,
                    delay: i * 0.08,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: card,
                        start: 'top 88%',
                        toggleActions: 'play none none reverse'
                    }
                });
            });
        }

        /* === STATS BAND COUNTER === */
        function initStatsBand() {
            var stats = document.querySelectorAll('.stat-number');
            if (!stats.length) return;

            var observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        animateStatNumber(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });

            stats.forEach(function(stat) {
                observer.observe(stat);
            });

            function animateStatNumber(el) {
                var target = parseInt(el.getAttribute('data-target'), 10);
                var prefix = el.getAttribute('data-prefix') || '';
                var suffix = el.getAttribute('data-suffix') || '';
                var duration = 1500;
                var start = performance.now();

                function update(now) {
                    var elapsed = now - start;
                    var progress = Math.min(elapsed / duration, 1);
                    // Ease out cubic
                    var eased = 1 - Math.pow(1 - progress, 3);
                    var current = Math.round(eased * target);
                    el.textContent = prefix + current + suffix;
                    if (progress < 1) {
                        requestAnimationFrame(update);
                    } else {
                        el.classList.add('counted');
                    }
                }
                requestAnimationFrame(update);
            }
        }

        /* === PAGE VISIBILITY API (Performance) === */
        function initPageVisibility() {
            var animationFrameIds = [];
            var wasHidden = false;

            document.addEventListener('visibilitychange', function() {
                if (document.hidden) {
                    wasHidden = true;
                    // Pause Lenis smooth scroll
                    if (window.lenisInstance) {
                        window.lenisInstance.stop();
                    }
                } else if (wasHidden) {
                    wasHidden = false;
                    // Resume Lenis
                    if (window.lenisInstance) {
                        window.lenisInstance.start();
                    }
                }
            });
        }

        /* === KEYBOARD NAVIGATION ENHANCEMENT === */
        function initKeyboardNav() {
            // Show focus styles only for keyboard navigation
            document.body.classList.add('using-mouse');

            document.addEventListener('keydown', function(e) {
                if (e.key === 'Tab') {
                    document.body.classList.remove('using-mouse');
                }
            });

            document.addEventListener('mousedown', function() {
                document.body.classList.add('using-mouse');
            });

            // Escape key closes any open overlays
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    var mobileMenu = document.getElementById('mobileMenu');
                    if (mobileMenu && mobileMenu.classList.contains('active')) {
                        mobileMenu.classList.remove('active');
                        var hamburger = document.getElementById('navHamburger');
                        if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
                    }
                    var konamiOverlay = document.getElementById('konamiOverlay');
                    if (konamiOverlay && konamiOverlay.classList.contains('active')) {
                        konamiOverlay.classList.remove('active');
                    }
                }
            });
        }

        /* === SCROLLSPY — ACTIVE NAV HIGHLIGHTING === */
        function initScrollspy() {
            var navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
            if (!navLinks.length || !('IntersectionObserver' in window)) return;

            var sectionMap = {};
            navLinks.forEach(function(link) {
                var id = link.getAttribute('href').substring(1);
                var section = document.getElementById(id);
                if (section) sectionMap[id] = { link: link, section: section };
            });

            var currentActive = null;

            var spyObserver = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        var id = entry.target.id;
                        if (sectionMap[id]) {
                            if (currentActive) currentActive.classList.remove('nav-active');
                            sectionMap[id].link.classList.add('nav-active');
                            currentActive = sectionMap[id].link;
                        }
                    }
                });
            }, { threshold: 0.15, rootMargin: '-80px 0px -50% 0px' });

            Object.keys(sectionMap).forEach(function(id) {
                spyObserver.observe(sectionMap[id].section);
            });
        }

        /* === TEXT SCRAMBLE EFFECT FOR SECTION TITLES === */
        function initTextScramble() {
            if (prefersReducedMotion) return;
            var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&';
            var titles = document.querySelectorAll('.section-title[id]');

            if (!('IntersectionObserver' in window) || !titles.length) return;

            titles.forEach(function(title) {
                title.setAttribute('data-original', title.textContent);
            });

            var scrambleObserver = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (!entry.isIntersecting) return;
                    var el = entry.target;
                    if (el.getAttribute('data-scrambled')) return;
                    el.setAttribute('data-scrambled', '1');
                    scrambleObserver.unobserve(el);

                    var original = el.getAttribute('data-original');
                    var length = original.length;
                    var duration = 600;
                    var startTime = performance.now();

                    function step(now) {
                        var elapsed = now - startTime;
                        var progress = Math.min(elapsed / duration, 1);
                        var revealed = Math.floor(progress * length);
                        var result = '';
                        for (var i = 0; i < length; i++) {
                            if (i < revealed) {
                                result += original[i];
                            } else if (original[i] === ' ') {
                                result += ' ';
                            } else {
                                result += chars[Math.floor(Math.random() * chars.length)];
                            }
                        }
                        el.textContent = result;
                        if (progress < 1) {
                            requestAnimationFrame(step);
                        } else {
                            el.textContent = original;
                        }
                    }
                    requestAnimationFrame(step);
                });
            }, { threshold: 0.5 });

            titles.forEach(function(title) { scrambleObserver.observe(title); });
        }

        /* === SCROLL REVEAL SYSTEM === */
        function initScrollReveal() {
            if (prefersReducedMotion) return;
            if (!('IntersectionObserver' in window)) {
                document.querySelectorAll('[data-reveal]').forEach(function(el) {
                    el.classList.add('revealed');
                });
                return;
            }

            var revealObserver = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        var delay = parseInt(entry.target.getAttribute('data-reveal-delay') || '0', 10);
                        if (delay > 0) {
                            setTimeout(function() { entry.target.classList.add('revealed'); }, delay);
                        } else {
                            entry.target.classList.add('revealed');
                        }
                        revealObserver.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

            document.querySelectorAll('[data-reveal]').forEach(function(el) {
                revealObserver.observe(el);
            });
        }

        /* === INITIALIZE ALL NEW FEATURES === */

        function initNewFeatures() {
            initScrollReveal();
            initScrollspy();
            initTextScramble();
            initPricingCalculator();
            initTestimonialCarousel();
            initSoundSystem();
            initKonamiCode();
            initStatsBand();
            initPageVisibility();
            initKeyboardNav();
            initFloatingChat();
            /* Particle system replaces enhanced hero — no Three.js needed */
            initClickRipples();
            initSectionColorJourney();
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() { setTimeout(initNewFeatures, 100); });
        } else {
            setTimeout(initNewFeatures, 100);
        }


        /* === COMMAND PALETTE === */
        (function initCommandPalette() {
            var overlay = document.getElementById('cmdPalette');
            var input = document.getElementById('cmdInput');
            var results = document.getElementById('cmdResults');
            if (!overlay || !input || !results) return;

            var items = [
                { title: 'Services', desc: 'View all 6 AI services', icon: '\u2699\uFE0F', target: '#services', type: 'section' },
                { title: 'Automations', desc: 'Explore 53+ automation templates', icon: '\u26A1', target: '#automation-explorer', type: 'section' },
                { title: 'Live Build Demo', desc: 'Watch AI build a project live', icon: '\uD83C\uDFAC', target: '#live-build', type: 'section' },
                { title: 'Website Generator', desc: 'Interactive live code preview', icon: '\uD83D\uDCBB', target: '#demo', type: 'section' },
                { title: 'AI Systems', desc: 'Revenue, Intelligence, Memory, Workflow', icon: '\uD83E\uDDE0', target: '#ai-systems', type: 'section' },
                { title: 'AI Playground', desc: 'Interactive demos and knowledge graph', icon: '\uD83C\uDFAE', target: '/ai-playground.html', type: 'page' },
                { title: 'Pricing', desc: 'Plans starting at $5', icon: '\uD83D\uDCB0', target: '#pricing', type: 'section' },
                { title: 'How It Works', desc: '4-step process from idea to delivery', icon: '\uD83D\uDCA1', target: '#process', type: 'section' },
                { title: 'Project Configurator', desc: 'Build your custom project', icon: '\uD83D\uDD27', target: '#configurator', type: 'section' },
                { title: 'About NexTool', desc: 'Our story and mission', icon: '\uD83D\uDCD6', target: '#about-story', type: 'section' },
                { title: 'FAQ', desc: 'Frequently asked questions', icon: '\u2753', target: '#faq', type: 'section' },
                { title: 'Contact', desc: 'Send us a project brief', icon: '\uD83D\uDCE9', target: '#contact', type: 'section' },
                { title: 'Start a Project', desc: 'Open checkout modal', icon: '\uD83D\uDE80', target: 'checkout', type: 'action' },
                { title: 'Custom Website', desc: 'AI-powered responsive sites', icon: '\uD83C\uDF10', target: '/services/websites.html', type: 'page' },
                { title: 'AI Chatbot', desc: 'Intelligent customer bots', icon: '\uD83E\uDD16', target: '/services/chatbots.html', type: 'page' },
                { title: 'Automation Workflow', desc: 'n8n, Make.com alternatives', icon: '\u2699\uFE0F', target: '/services/automations.html', type: 'page' },
                { title: 'Content Creation', desc: 'AI-powered blog, social, copy', icon: '\u270D\uFE0F', target: '/services/content.html', type: 'page' },
                { title: 'Video Production', desc: 'AI video editing & production', icon: '\uD83C\uDFA5', target: '/services/video.html', type: 'page' },
                { title: 'Data Solutions', desc: 'Dashboards, analytics, scraping', icon: '\uD83D\uDCCA', target: '/services/data.html', type: 'page' },
                { title: 'Blog', desc: 'AI automation insights & tutorials', icon: '\uD83D\uDCDD', target: '/blog/', type: 'page' },
                { title: 'Free Tools', desc: '36 free developer & design tools', icon: '\uD83D\uDEE0\uFE0F', target: '/free-tools/', type: 'page' },
                { title: 'Products', desc: 'Digital products, templates & toolkits', icon: '\uD83D\uDCE6', target: '/products/', type: 'page' },
                { title: 'QR Generator', desc: 'Create QR codes instantly', icon: '\uD83D\uDCF1', target: '/free-tools/qr-generator.html', type: 'page' },
                { title: 'JSON Formatter', desc: 'Format, validate, minify JSON', icon: '\uD83D\uDCCB', target: '/free-tools/json-formatter.html', type: 'page' },
                { title: 'Color Palette', desc: 'Generate beautiful color schemes', icon: '\uD83C\uDFA8', target: '/free-tools/color-palette.html', type: 'page' },
                { title: 'Password Generator', desc: 'Secure passwords instantly', icon: '\uD83D\uDD12', target: '/free-tools/password-generator.html', type: 'page' },
                { title: 'CSS Gradient', desc: 'Visual gradient builder', icon: '\uD83C\uDF08', target: '/free-tools/gradient-generator.html', type: 'page' },
                { title: 'Text Analyzer', desc: 'Word count, readability, SEO', icon: '\uD83D\uDCCA', target: '/free-tools/text-analyzer.html', type: 'page' },
                { title: 'Regex Tester', desc: 'Test regular expressions', icon: '\uD83D\uDD0D', target: '/free-tools/regex-tester.html', type: 'page' },
                { title: 'Base64 Encoder', desc: 'Encode & decode Base64', icon: '\uD83D\uDD04', target: '/free-tools/base64.html', type: 'page' },
                { title: 'Testimonials', desc: 'What people are saying', icon: '\u2B50', target: '#testimonials', type: 'section' },
                { title: 'Use Cases', desc: 'Real-world examples', icon: '\uD83D\uDCCB', target: '#use-cases', type: 'section' },
                { title: 'Showcase', desc: 'Portfolio of built projects', icon: '\uD83C\uDFC6', target: '/showcase.html', type: 'page' },
                { title: 'System Status', desc: 'Live AI system monitoring', icon: '\uD83D\uDFE2', target: '/status.html', type: 'page' },
            ];

            var activeIdx = 0;
            var filtered = items;

            function renderResults(list) {
                if (list.length === 0) {
                    results.innerHTML = '<div class="cmd-empty">No results found</div>';
                    return;
                }
                results.innerHTML = '';
                list.forEach(function(item, i) {
                    var div = document.createElement('div');
                    div.className = 'cmd-item' + (i === activeIdx ? ' active' : '');
                    div.setAttribute('role', 'option');
                    div.innerHTML = '<div class="cmd-item-icon">' + item.icon + '</div>' +
                        '<div class="cmd-item-text"><div class="cmd-item-title">' + item.title + '</div>' +
                        '<div class="cmd-item-desc">' + item.desc + '</div></div>' +
                        '<span class="cmd-item-badge">' + item.type + '</span>';
                    div.addEventListener('click', function() { selectItem(item); });
                    div.addEventListener('mouseenter', function() {
                        activeIdx = i;
                        updateActive();
                    });
                    results.appendChild(div);
                });
            }

            function updateActive() {
                var items = results.querySelectorAll('.cmd-item');
                items.forEach(function(el, i) {
                    el.classList.toggle('active', i === activeIdx);
                    if (i === activeIdx) el.scrollIntoView({ block: 'nearest' });
                });
            }

            function selectItem(item) {
                closePalette();
                if (item.type === 'action') {
                    if (item.target === 'checkout' && window.NTCheckout) {
                        window.NTCheckout.open('Custom Project', 'from $5', 'automation');
                    }
                } else if (item.type === 'page') {
                    window.location.href = item.target;
                } else {
                    var el = document.querySelector(item.target);
                    if (el) {
                        if (typeof lenis !== 'undefined' && lenis) {
                            lenis.scrollTo(el, { offset: -80 });
                        } else {
                            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }
                }
            }

            function openPalette() {
                overlay.classList.add('open');
                input.value = '';
                activeIdx = 0;
                filtered = items;
                renderResults(filtered);
                setTimeout(function() { input.focus(); }, 50);
                document.body.style.overflow = 'hidden';
            }

            function closePalette() {
                overlay.classList.remove('open');
                input.value = '';
                document.body.style.overflow = '';
            }

            function fuzzyMatch(query, text) {
                var q = query.toLowerCase();
                var t = text.toLowerCase();
                return t.indexOf(q) !== -1;
            }

            input.addEventListener('input', function() {
                var q = input.value.trim();
                if (!q) { filtered = items; } else {
                    filtered = items.filter(function(item) {
                        return fuzzyMatch(q, item.title) || fuzzyMatch(q, item.desc) || fuzzyMatch(q, item.type);
                    });
                }
                activeIdx = 0;
                renderResults(filtered);
            });

            input.addEventListener('keydown', function(e) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    activeIdx = Math.min(activeIdx + 1, filtered.length - 1);
                    updateActive();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    activeIdx = Math.max(activeIdx - 1, 0);
                    updateActive();
                } else if (e.key === 'Enter' && filtered[activeIdx]) {
                    e.preventDefault();
                    selectItem(filtered[activeIdx]);
                }
            });

            document.addEventListener('keydown', function(e) {
                if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                    e.preventDefault();
                    if (overlay.classList.contains('open')) closePalette();
                    else openPalette();
                }
                if (e.key === 'Escape' && overlay.classList.contains('open')) {
                    closePalette();
                }
            });

            overlay.addEventListener('click', function(e) {
                if (e.target === overlay) closePalette();
            });
        })();


        /* === CLICK RIPPLE EFFECT === */
        function initClickRipples() {
            if (isTouch || prefersReducedMotion) return;

            document.addEventListener('click', function(e) {
                var ripple = document.createElement('div');
                ripple.className = 'click-ripple';
                ripple.style.left = e.clientX + 'px';
                ripple.style.top = e.clientY + 'px';
                document.body.appendChild(ripple);
                setTimeout(function() { ripple.remove(); }, 600);
            });
        }


        /* === SECTION COLOR JOURNEY === */
        function initSectionColorJourney() {
            if (prefersReducedMotion) return;

            var sectionColors = {
                'hero':         { primary: '99,102,241', accent: '168,85,247' },
                'services':     { primary: '99,102,241', accent: '168,85,247' },
                'live-build':   { primary: '59,130,246', accent: '99,102,241' },
                'process':      { primary: '79,70,229',  accent: '139,92,246' },
                'demo':         { primary: '168,85,247', accent: '236,72,153' },
                'comparison':   { primary: '99,102,241', accent: '59,130,246' },
                'use-cases':    { primary: '139,92,246', accent: '168,85,247' },
                'ai-systems':   { primary: '34,197,94',  accent: '59,130,246' },
                'configurator': { primary: '236,72,153', accent: '168,85,247' },
                'pricing':      { primary: '168,85,247', accent: '236,72,153' },
                'contact':      { primary: '59,130,246', accent: '99,102,241' },
                'transparency': { primary: '34,197,94',  accent: '59,130,246' },
                'about-story':  { primary: '99,102,241', accent: '168,85,247' },
                'testimonials': { primary: '236,72,153', accent: '168,85,247' },
                'faq':          { primary: '99,102,241', accent: '139,92,246' },
                'final-cta':    { primary: '168,85,247', accent: '236,72,153' }
            };

            var sections = [];
            for (var id in sectionColors) {
                var el = document.getElementById(id);
                if (el) {
                    sections.push({ el: el, colors: sectionColors[id] });
                }
            }

            if (!sections.length) return;

            var currentPrimary = { r: 99, g: 102, b: 241 };
            var targetPrimary = { r: 99, g: 102, b: 241 };
            var currentAccent = { r: 168, g: 85, b: 247 };
            var targetAccent = { r: 168, g: 85, b: 247 };

            var observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
                        var id = entry.target.id;
                        if (sectionColors[id]) {
                            var p = sectionColors[id].primary.split(',');
                            targetPrimary = { r: parseInt(p[0]), g: parseInt(p[1]), b: parseInt(p[2]) };
                            var a = sectionColors[id].accent.split(',');
                            targetAccent = { r: parseInt(a[0]), g: parseInt(a[1]), b: parseInt(a[2]) };
                        }
                    }
                });
            }, { threshold: [0.3, 0.5] });

            sections.forEach(function(s) { observer.observe(s.el); });

            var scrollProgress = document.getElementById('scrollProgressFill');
            var gradientDividers = document.querySelectorAll('.gradient-divider');

            function animate() {
                requestAnimationFrame(animate);

                currentPrimary.r += (targetPrimary.r - currentPrimary.r) * 0.03;
                currentPrimary.g += (targetPrimary.g - currentPrimary.g) * 0.03;
                currentPrimary.b += (targetPrimary.b - currentPrimary.b) * 0.03;
                currentAccent.r += (targetAccent.r - currentAccent.r) * 0.03;
                currentAccent.g += (targetAccent.g - currentAccent.g) * 0.03;
                currentAccent.b += (targetAccent.b - currentAccent.b) * 0.03;

                var pr = Math.round(currentPrimary.r);
                var pg = Math.round(currentPrimary.g);
                var pb = Math.round(currentPrimary.b);
                var ar = Math.round(currentAccent.r);
                var ag = Math.round(currentAccent.g);
                var ab = Math.round(currentAccent.b);

                var primaryRgb = 'rgb(' + pr + ',' + pg + ',' + pb + ')';
                var accentRgb = 'rgb(' + ar + ',' + ag + ',' + ab + ')';
                var gradient = 'linear-gradient(90deg, ' + primaryRgb + ', ' + accentRgb + ')';

                if (scrollProgress) {
                    scrollProgress.style.background = gradient;
                }

                gradientDividers.forEach(function(d) {
                    d.style.background = gradient;
                });
            }
            animate();
        }

        /* === HERO TYPING EFFECT === */
        function initHeroTyping() {
            var el = document.getElementById('heroTyping');
            if (!el) return;

            var phrases = [
                'stunning websites.',
                'intelligent chatbots.',
                'automated workflows.',
                'SEO-optimized content.',
                'promotional videos.',
                'data scraping pipelines.',
                'anything you can imagine.'
            ];

            var phraseIdx = 0;
            var charIdx = 0;
            var isDeleting = false;
            var typeSpeed = 60;
            var deleteSpeed = 35;
            var pauseAfterType = 2200;
            var pauseAfterDelete = 400;

            function tick() {
                var current = phrases[phraseIdx];

                if (!isDeleting) {
                    charIdx++;
                    el.textContent = current.slice(0, charIdx);

                    if (charIdx === current.length) {
                        isDeleting = true;
                        setTimeout(tick, pauseAfterType);
                        return;
                    }
                    setTimeout(tick, typeSpeed + Math.random() * 40);
                } else {
                    charIdx--;
                    el.textContent = current.slice(0, charIdx);

                    if (charIdx === 0) {
                        isDeleting = false;
                        phraseIdx = (phraseIdx + 1) % phrases.length;
                        setTimeout(tick, pauseAfterDelete);
                        return;
                    }
                    setTimeout(tick, deleteSpeed);
                }
            }

            // Start after hero animation completes (~2.5s)
            setTimeout(tick, 2800);
        }
        initHeroTyping();

        // === AUTOMATION EXPLORER ===
        (function() {
            var cats = {all:'All',business:'Business Ops',marketing:'Marketing',ecommerce:'E-Commerce',data:'Data & Analytics',communication:'Communication',content:'Content',integration:'Integration',ai:'AI Intelligence'};
            var catLabels = {business:'Business',marketing:'Marketing',ecommerce:'E-Commerce',data:'Data',communication:'Comms',content:'Content',integration:'Integration',ai:'AI'};
            var items = [
                {n:'Auto-Invoicing System',c:'business',d:'Auto-generate and send invoices when sales happen. No manual entry.',p:'$29'},
                {n:'Smart Appointment Scheduling',c:'business',d:'Bookings, confirmations, reminders, and follow-ups — fully automated.',p:'$29'},
                {n:'CRM Auto-Population & Lead Scoring',c:'business',d:'New leads auto-enriched, scored by AI, and routed to your sales team.',p:'$49'},
                {n:'Employee Onboarding Automation',c:'business',d:'New hire? Auto-send welcome emails, create accounts, assign tasks.',p:'$199'},
                {n:'Expense Tracking & Reporting',c:'business',d:'Snap receipts, AI categorizes them, monthly reports delivered.',p:'$39'},
                {n:'Contract & Proposal Generator',c:'business',d:'Client details in, branded PDF proposals out — with e-signatures.',p:'$39'},
                {n:'Project Status Reporting',c:'business',d:'Auto-compile project updates from your tools and deliver to stakeholders.',p:'$29'},
                {n:'Multi-Platform Social Scheduler',c:'marketing',d:'One content calendar posts to Instagram, X, LinkedIn, TikTok, Facebook.',p:'$39'},
                {n:'AI Lead Magnet Funnel',c:'marketing',d:'Landing page + free resource + 5-email nurture sequence. Converts visitors.',p:'$49'},
                {n:'Review & Reputation Monitor',c:'marketing',d:'Instant alerts for new reviews. Sentiment analysis. Weekly reports.',p:'$39'},
                {n:'Email Marketing Automation',c:'marketing',d:'Welcome, cart recovery, re-engagement, post-purchase — all automated.',p:'$29'},
                {n:'Social Proof Collector',c:'marketing',d:'Auto-request testimonials after delivery. Publish to your website.',p:'$19'},
                {n:'Competitor Price Tracker',c:'marketing',d:'Track competitor prices, social activity, and content. AI analysis.',p:'$39'},
                {n:'Newsletter Auto-Generator',c:'marketing',d:'AI writes your newsletter from curated sources. Branded, scheduled.',p:'$29'},
                {n:'Order Fulfillment Pipeline',c:'ecommerce',d:'New order triggers inventory update, fulfillment, tracking, notification.',p:'$49'},
                {n:'Abandoned Cart Recovery',c:'ecommerce',d:'Multi-channel reminders with dynamic discount codes recover lost sales.',p:'$39'},
                {n:'Dynamic Pricing Engine',c:'ecommerce',d:'AI adjusts prices based on demand, competition, and margin targets.',p:'$249'},
                {n:'Product Review Management',c:'ecommerce',d:'Auto-request reviews, aggregate across platforms, alert on negatives.',p:'$29'},
                {n:'Inventory Alert & Reorder',c:'ecommerce',d:'Low stock alerts with auto-generated purchase orders to suppliers.',p:'$29'},
                {n:'Customer Loyalty & Rewards',c:'ecommerce',d:'Points system, tier emails, automatic discounts, referral tracking.',p:'$199'},
                {n:'Web Scraping Pipeline',c:'data',d:'Extract data from any website. Cleaned, structured, delivered on schedule.',p:'$5'},
                {n:'Business KPI Dashboard',c:'data',d:'Revenue, traffic, leads, social — all metrics in one auto-updating view.',p:'$49'},
                {n:'Sentiment Analysis Monitor',c:'data',d:'Track brand sentiment across platforms. Trend analysis and alerts.',p:'$39'},
                {n:'Automated Financial Reporting',c:'data',d:'P&L, cash flow, forecasting — AI-generated narrative reports.',p:'$49'},
                {n:'SEO Rank Tracker',c:'data',d:'Track keyword rankings daily. Competitor comparison. AI recommendations.',p:'$39'},
                {n:'Survey & Feedback Analysis',c:'data',d:'Collect responses, extract themes with AI, generate executive summaries.',p:'$29'},
                {n:'AI Customer Support Chatbot',c:'communication',d:'Handles 80% of questions. Escalates complex issues to humans.',p:'$49'},
                {n:'WhatsApp Business Auto-Responder',c:'communication',d:'Smart auto-replies, order lookups, appointment scheduling via WhatsApp.',p:'$29'},
                {n:'Help Desk Ticketing',c:'communication',d:'Emails become tickets. AI categorizes, assigns, tracks SLA compliance.',p:'$39'},
                {n:'Multi-Channel Notification Hub',c:'communication',d:'One event triggers the right notification on the right channel.',p:'$29'},
                {n:'AI Meeting Summarizer',c:'communication',d:'Auto-capture meetings, generate summaries, create action items.',p:'$39'},
                {n:'FAQ Knowledge Base Builder',c:'communication',d:'AI builds and maintains your knowledge base from support conversations.',p:'$199'},
                {n:'Blog Content Pipeline',c:'content',d:'Keyword research + AI-written posts + SEO optimization + auto-publish.',p:'$5'},
                {n:'Social Media Content Generator',c:'content',d:'30-day content calendar with AI-generated posts for every platform.',p:'$5'},
                {n:'Product Description Generator',c:'content',d:'Bulk-generate SEO-optimized descriptions. A/B variants. Multi-language.',p:'$5'},
                {n:'AI Image Generation Pipeline',c:'content',d:'Brand-consistent images from text prompts. Style guide enforcement.',p:'$19'},
                {n:'Video Script & Storyboard',c:'content',d:'Full scripts with shot lists, B-roll suggestions, and talent direction.',p:'$29'},
                {n:'AI Voiceover & Audio',c:'content',d:'Professional voiceovers with background music. Podcast-ready audio.',p:'$29'},
                {n:'Email Copywriting System',c:'content',d:'AI writes entire email sequences. Welcome, sales, launch, re-engagement.',p:'$5'},
                {n:'CRM-to-Everything Sync',c:'integration',d:'Keep your CRM, email, and tools in perfect sync. Conflict resolution.',p:'$39'},
                {n:'Legacy System Migration',c:'integration',d:'Move data between systems safely. Transformation, validation, dedup.',p:'$29'},
                {n:'Webhook Relay & Event Router',c:'integration',d:'Route events between services with conditional logic and retry.',p:'$29'},
                {n:'Google Workspace Automation',c:'integration',d:'Email, Docs, Drive, Calendar, Sheets — all working together.',p:'$19'},
                {n:'Payment Gateway Integration',c:'integration',d:'Stripe/PayPal checkout + subscriptions + webhooks + invoicing.',p:'$49'},
                {n:'Slack/Discord Operations Bot',c:'integration',d:'Custom commands, lookups, workflow triggers, daily summaries.',p:'$39'},
                {n:'AI Document Processor',c:'ai',d:'Extract data from invoices, contracts, forms. AI reads what humans can\'t.',p:'$49'},
                {n:'AI Sales Email Personalizer',c:'ai',d:'Deep research per lead. Hyper-personalized outreach at scale.',p:'$39'},
                {n:'Churn Prediction & Prevention',c:'ai',d:'AI identifies at-risk customers. Auto-trigger retention campaigns.',p:'$249'},
                {n:'AI Content Moderator',c:'ai',d:'Real-time moderation of user content. Custom policies. Appeals workflow.',p:'$49'},
                {n:'Intelligent Report Generator',c:'ai',d:'AI writes narrative reports from your data. Trend analysis included.',p:'$39'},
                {n:'Product Recommendation Engine',c:'ai',d:'ML-powered "you might also like" with real-time personalization.',p:'$249'},
                {n:'AI Hiring Assistant',c:'ai',d:'Resume scoring, candidate ranking, interview question generation.',p:'$49'},
                {n:'Predictive Inventory Forecaster',c:'ai',d:'AI predicts demand. Seasonal adjustments. Never overstock or stockout.',p:'$249'}
            ];
            var filtersEl = document.getElementById('aeFilters');
            var gridEl = document.getElementById('aeGrid');
            if (!filtersEl || !gridEl) return;
            Object.keys(cats).forEach(function(key) {
                var pill = document.createElement('button');
                pill.className = 'ae-pill' + (key === 'all' ? ' active' : '');
                pill.setAttribute('data-cat', key);
                pill.textContent = cats[key];
                pill.addEventListener('click', function() {
                    document.querySelectorAll('.ae-pill').forEach(function(p) { p.classList.remove('active'); });
                    pill.classList.add('active');
                    filterCards(key);
                });
                filtersEl.appendChild(pill);
            });
            items.forEach(function(item) {
                var card = document.createElement('div');
                card.className = 'ae-card';
                card.setAttribute('data-cat', item.c);
                card.innerHTML = '<span class="ae-card-cat">' + catLabels[item.c] + '</span><div class="ae-card-name">' + item.n + '</div><div class="ae-card-desc">' + item.d + '</div><div class="ae-card-footer"><span class="ae-card-price">from ' + item.p + '</span><span class="ae-card-cta">Get it →</span></div>';
                card.addEventListener('click', function() {
                    window.NTCheckout.open(item.n, item.p, 'automation');
                });
                card.style.cursor = 'pointer';
                gridEl.appendChild(card);
            });
            function filterCards(cat) {
                var cards = document.querySelectorAll('.ae-card');
                var count = 0;
                cards.forEach(function(card) {
                    if (cat === 'all' || card.getAttribute('data-cat') === cat) {
                        card.classList.remove('hidden');
                        card.style.animation = 'none';
                        card.offsetHeight;
                        card.style.animation = 'aeCardIn 0.4s ' + (count * 30) + 'ms both';
                        count++;
                    } else {
                        card.classList.add('hidden');
                    }
                });
                document.getElementById('aeCount').textContent = count;
            }
        })();

        // === CHECKOUT SYSTEM ===
        (function() {
            var PAYPAL_USERNAME = 'chbu1403';
            var WA_NUM = '436764433763';
            var overlay = document.getElementById('checkoutOverlay');
            var closeBtn = document.getElementById('checkoutClose');
            var form = document.getElementById('checkoutForm');
            var success = document.getElementById('checkoutSuccess');
            var payBtn = document.getElementById('checkoutPayBtn');
            var waAlt = document.getElementById('checkoutWaAlt');
            var nameEl = document.getElementById('checkoutName');
            var priceEl = document.getElementById('checkoutPrice');
            var iconEl = document.getElementById('checkoutIcon');
            if (!overlay) return;

            var currentItem = { name: '', price: '', type: '' };
            var icons = {
                website: '&#x1F310;', chatbot: '&#x1F916;', automation: '&#x26A1;',
                content: '&#x270D;', video: '&#x1F3AC;', data: '&#x1F4CA;',
                starter: '&#x1F680;', professional: '&#x2B50;', enterprise: '&#x1F3C6;'
            };

            function parsePrice(priceStr) {
                var m = priceStr.match(/\d+/);
                return m ? parseInt(m[0]) : 0;
            }

            function openCheckout(name, price, type) {
                currentItem = { name: name, price: price, type: type };
                nameEl.textContent = name;
                priceEl.textContent = price;
                iconEl.innerHTML = icons[type] || '&#x26A1;';
                form.classList.remove('hidden');
                success.classList.remove('show');
                waAlt.href = 'mailto:christianjunbucher@gmail.com?subject=' + encodeURIComponent('NexTool Project: ' + name) + '&body=' + encodeURIComponent('Hi NexTool! I\'m interested in: ' + name + ' (' + price + ')');
                overlay.classList.add('open');
                document.body.style.overflow = 'hidden';
                setTimeout(function() { document.getElementById('coName').focus(); }, 400);
            }

            function closeCheckout() {
                overlay.classList.remove('open');
                document.body.style.overflow = '';
            }

            closeBtn.addEventListener('click', closeCheckout);
            overlay.addEventListener('click', function(e) {
                if (e.target === overlay) closeCheckout();
            });
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && overlay.classList.contains('open')) closeCheckout();
            });

            payBtn.addEventListener('click', function() {
                var name = document.getElementById('coName').value.trim();
                var email = document.getElementById('coEmail').value.trim();
                var brief = document.getElementById('coBrief').value.trim();
                if (!name || !email) {
                    document.getElementById(name ? 'coEmail' : 'coName').focus();
                    return;
                }
                var amount = parsePrice(currentItem.price);
                var paypalUrl = 'https://paypal.me/' + PAYPAL_USERNAME + (amount > 0 ? '/' + amount + 'USD' : '');
                // Store order data in localStorage for reference
                var order = {
                    id: 'NT-' + Date.now().toString(36).toUpperCase(),
                    name: name, email: email, brief: brief,
                    item: currentItem.name, price: currentItem.price,
                    type: currentItem.type, timestamp: new Date().toISOString()
                };
                var orders = JSON.parse(localStorage.getItem('nt_orders') || '[]');
                orders.push(order);
                localStorage.setItem('nt_orders', JSON.stringify(orders));
                // Open PayPal
                window.open(paypalUrl, '_blank');
                // Update success email link with order details
                var successWa = document.getElementById('checkoutSuccessWa');
                if (successWa) {
                    var emailBody = 'Hi NexTool! I just paid for: ' + currentItem.name + ' (' + currentItem.price + ')\nOrder ID: ' + order.id + '\nName: ' + name + '\nEmail: ' + email + '\nBrief: ' + brief;
                    successWa.href = 'mailto:christianjunbucher@gmail.com?subject=' + encodeURIComponent('NexTool Payment: ' + order.id) + '&body=' + encodeURIComponent(emailBody);
                }
                // Show success state
                form.classList.add('hidden');
                success.classList.add('show');
            });

            // Expose globally
            window.NTCheckout = { open: openCheckout, close: closeCheckout };

            // Hook up pricing card buttons
            document.querySelectorAll('.pricing-btn').forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    var card = btn.closest('.pricing-card');
                    if (!card) return;
                    var tier = card.querySelector('.pricing-tier').textContent;
                    var price = card.querySelector('.pricing-price').textContent.trim();
                    openCheckout(tier + ' Plan', price, tier.toLowerCase());
                });
            });

            // Hook up calculator CTA
            var calcCTA = document.getElementById('calcCTA');
            if (calcCTA) {
                calcCTA.addEventListener('click', function(e) {
                    e.preventDefault();
                    var priceText = document.getElementById('calcPriceDisplay').textContent || '$0';
                    openCheckout('Custom Project', priceText, 'automation');
                });
            }
        })();

        // === PROJECT CONFIGURATOR WIZARD ===
        (function() {
            var cfgState = { step: 0, category: '', features: [], complexity: 0, rush: false };
            var categories = [
                { id: 'website', icon: '&#x1F310;', name: 'Website', from: 'from $29', base: [29, 99, 249] },
                { id: 'chatbot', icon: '&#x1F916;', name: 'Chatbot', from: 'from $29', base: [29, 99, 249] },
                { id: 'automation', icon: '&#x26A1;', name: 'Automation', from: 'from $5', base: [5, 39, 149] },
                { id: 'content', icon: '&#x270D;&#xFE0F;', name: 'Content', from: 'from $5', base: [5, 29, 99] },
                { id: 'video', icon: '&#x1F3AC;', name: 'Video', from: 'from $49', base: [49, 149, 349] },
                { id: 'data', icon: '&#x1F4CA;', name: 'Data', from: 'from $5', base: [5, 39, 149] }
            ];
            var featureMap = {
                website: ['Landing Page','Multi-page Site','E-commerce','Blog / CMS','Contact Forms','SEO Optimization','Custom Animations','Admin Dashboard'],
                chatbot: ['FAQ Bot','Customer Support','Sales Bot','Telegram Integration','Discord Bot','Lead Qualification','Multi-language','Analytics Dashboard'],
                automation: ['Email Automation','CRM Integration','Social Media','E-commerce Flows','Notifications','Data Sync','Scheduling','Custom Webhooks'],
                content: ['Blog Posts','Social Content','Email Copy','Product Descriptions','SEO Content','Ad Copy','Newsletter','Brand Guidelines'],
                video: ['Explainer Video','Social Media Clips','Presentation','Tutorial','Ad / Promo','Voiceover','Subtitles','Thumbnail Design'],
                data: ['Web Scraping','Dashboard','Reports','Data Analysis','Monitoring','API Integration','Visualization','Automated Alerts']
            };
            var complexities = [
                { label: 'Simple', desc: 'Straightforward, quick turnaround' },
                { label: 'Medium', desc: 'Multiple features, some customization' },
                { label: 'Complex', desc: 'Fully custom, advanced logic' }
            ];
            var catsEl = document.getElementById('cfgCats');
            if (!catsEl) return;
            categories.forEach(function(cat) {
                var card = document.createElement('div');
                card.className = 'cfg-cat';
                card.innerHTML = '<div class="cfg-cat-icon">' + cat.icon + '</div><div class="cfg-cat-name">' + cat.name + '</div><div class="cfg-cat-from">' + cat.from + '</div>';
                card.addEventListener('click', function() {
                    cfgState.category = cat.id;
                    catsEl.querySelectorAll('.cfg-cat').forEach(function(c) { c.classList.remove('selected'); });
                    card.classList.add('selected');
                    renderFeatures(cat.id);
                    setTimeout(function() { cfgGo(1); }, 300);
                });
                catsEl.appendChild(card);
            });
            function renderFeatures(catId) {
                var el = document.getElementById('cfgFeatures');
                el.innerHTML = '';
                cfgState.features = [];
                var checkSvg = '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>';
                (featureMap[catId] || []).forEach(function(feat) {
                    var item = document.createElement('div');
                    item.className = 'cfg-feat';
                    item.innerHTML = '<div class="cfg-feat-check">' + checkSvg + '</div><span class="cfg-feat-label">' + feat + '</span>';
                    item.addEventListener('click', function() {
                        item.classList.toggle('selected');
                        if (item.classList.contains('selected')) { cfgState.features.push(feat); }
                        else { cfgState.features = cfgState.features.filter(function(f) { return f !== feat; }); }
                    });
                    el.appendChild(item);
                });
                var contDiv = document.createElement('div');
                contDiv.style.cssText = 'grid-column:1/-1;text-align:center;margin-top:1rem;';
                contDiv.innerHTML = '<button class="cfg-cta" style="font-size:.95rem;padding:.75rem 2rem;" onclick="window.cfgGo(1)">Continue &rarr;</button>';
                el.appendChild(contDiv);
            }
            var cxEl = document.getElementById('cfgComplexity');
            complexities.forEach(function(cx, i) {
                var card = document.createElement('div');
                card.className = 'cfg-cx' + (i === 0 ? ' selected' : '');
                card.innerHTML = '<div class="cfg-cx-label">' + cx.label + '</div><div class="cfg-cx-desc">' + cx.desc + '</div>';
                card.addEventListener('click', function() {
                    cfgState.complexity = i;
                    cxEl.querySelectorAll('.cfg-cx').forEach(function(c) { c.classList.remove('selected'); });
                    card.classList.add('selected');
                });
                cxEl.appendChild(card);
            });
            var rushEl = document.getElementById('cfgRush');
            [{label:'Normal',desc:'Standard delivery',rush:false},{label:'Rush +50%',desc:'Priority delivery',rush:true}].forEach(function(opt) {
                var card = document.createElement('div');
                card.className = 'cfg-rush-opt' + (!opt.rush ? ' selected' : '');
                card.innerHTML = '<div class="cfg-rush-label">' + opt.label + '</div><div class="cfg-rush-desc">' + opt.desc + '</div>';
                card.addEventListener('click', function() {
                    cfgState.rush = opt.rush;
                    rushEl.querySelectorAll('.cfg-rush-opt').forEach(function(c) { c.classList.remove('selected'); });
                    card.classList.add('selected');
                });
                rushEl.appendChild(card);
            });
            window.cfgGo = function(dir) {
                var newStep = cfgState.step + dir;
                if (newStep < 0 || newStep > 3) return;
                document.getElementById('cfgPanel' + cfgState.step).classList.remove('active');
                cfgState.step = newStep;
                void document.getElementById('cfgPanel' + newStep).offsetWidth;
                document.getElementById('cfgPanel' + newStep).classList.add('active');
                document.querySelectorAll('.cfg-step-dot').forEach(function(dot, i) {
                    dot.classList.remove('active', 'done');
                    if (i < newStep) dot.classList.add('done');
                    if (i === newStep) dot.classList.add('active');
                });
                var sec = document.getElementById('configurator');
                if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
            };
            window.cfgCalcAndShow = function() {
                var cat = categories.find(function(c) { return c.id === cfgState.category; });
                if (!cat) return;
                var basePrice = cat.base[cfgState.complexity] || cat.base[0];
                var featureBonus = cfgState.features.length * (cfgState.complexity === 0 ? 5 : cfgState.complexity === 1 ? 15 : 30);
                var total = basePrice + featureBonus;
                if (cfgState.rush) total = Math.round(total * 1.5);
                var priceEl = document.getElementById('cfgPrice');
                var startTime = performance.now();
                (function animatePrice(now) {
                    var progress = Math.min((now - startTime) / 800, 1);
                    var eased = 1 - Math.pow(1 - progress, 3);
                    priceEl.textContent = '$' + Math.round(eased * total);
                    if (progress < 1) requestAnimationFrame(animatePrice);
                })(performance.now());
                var days = cfgState.complexity === 0 ? '1-2' : cfgState.complexity === 1 ? '2-4' : '5-7';
                if (cfgState.rush) days = cfgState.complexity === 0 ? 'Same day' : cfgState.complexity === 1 ? '1-2' : '2-3';
                document.getElementById('cfgDelivery').textContent = 'Estimated delivery: ' + days + (days === 'Same day' ? '' : ' days') + (cfgState.rush ? ' (Rush)' : '');
                var incEl = document.getElementById('cfgIncludes');
                incEl.innerHTML = '';
                var chk = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
                var includes = [cat.name + ' \u2014 ' + complexities[cfgState.complexity].label];
                cfgState.features.forEach(function(f) { includes.push(f); });
                includes.push('Source code + full ownership');
                includes.push('Money-back guarantee');
                if (cfgState.complexity > 0) includes.push('Unlimited revisions');
                includes.forEach(function(inc) {
                    var li = document.createElement('li');
                    li.innerHTML = chk + inc;
                    incEl.appendChild(li);
                });
                document.getElementById('cfgCTA').onclick = function() {
                    var name = cat.name + ' \u2014 ' + complexities[cfgState.complexity].label;
                    if (cfgState.features.length) name += ' (' + cfgState.features.slice(0, 3).join(', ') + (cfgState.features.length > 3 ? ' +' + (cfgState.features.length - 3) + ' more' : '') + ')';
                    if (window.NTCheckout) window.NTCheckout.open(name, '$' + total, cat.id);
                };
                cfgGo(1);
            };
        })();

        // === CONTACT FORM (FormSubmit.co AJAX) ===
        (function() {
            var form = document.getElementById('contactFormWrap');
            var sent = document.getElementById('contactSent');
            if (!form || form.tagName !== 'FORM') return;
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                var name = document.getElementById('ctName').value.trim();
                var email = document.getElementById('ctEmail').value.trim();
                var brief = document.getElementById('ctBrief').value.trim();
                if (!name || !email) {
                    document.getElementById(name ? 'ctEmail' : 'ctName').focus();
                    return;
                }
                var btn = document.getElementById('ctSubmit');
                btn.textContent = 'Sending...';
                btn.disabled = true;
                var leads = JSON.parse(localStorage.getItem('nt_leads') || '[]');
                leads.push({ name: name, email: email, brief: brief, timestamp: new Date().toISOString() });
                localStorage.setItem('nt_leads', JSON.stringify(leads));
                var data = new FormData(form);
                fetch(form.action, { method: 'POST', body: data, headers: { 'Accept': 'application/json' } })
                .then(function(res) {
                    form.style.display = 'none';
                    sent.classList.add('show');
                })
                .catch(function() {
                    window.location.href = 'mailto:christianjunbucher@gmail.com?subject=' +
                        encodeURIComponent('NexTool Project Brief from ' + name) +
                        '&body=' + encodeURIComponent('Name: ' + name + '\nEmail: ' + email + '\n\nProject:\n' + (brief || 'No details'));
                    form.style.display = 'none';
                    sent.classList.add('show');
                });
            });
        })();

    })();
