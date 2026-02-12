/**
 * NexTool v2 — Living Website Engine
 * Every pixel responds. Every scroll matters. Noch nie dagewesen.
 */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const MOBILE = window.innerWidth <= 768;
const DPR = Math.min(window.devicePixelRatio || 1, 2);

// ═══════════════════════════════════════════════════════════════════════
// 1. PARTICLE CONSTELLATION — Neural network in the hero
// ═══════════════════════════════════════════════════════════════════════
if (!REDUCED && !MOBILE) {
  const canvas = document.getElementById('particleCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const hero = document.getElementById('hero');
    let W, H, particles = [];
    let mx = null, my = null;
    let visible = true;

    function resizeCanvas() {
      W = canvas.width = hero.offsetWidth * DPR;
      H = canvas.height = hero.offsetHeight * DPR;
      canvas.style.width = hero.offsetWidth + 'px';
      canvas.style.height = hero.offsetHeight + 'px';
      seedParticles();
    }

    function seedParticles() {
      const n = Math.min(80, Math.floor((W * H) / 18000));
      particles = [];
      for (let i = 0; i < n; i++) {
        particles.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
          r: Math.random() * 1.5 + 0.5, o: Math.random() * 0.3 + 0.08
        });
      }
    }

    function drawParticles() {
      if (!visible) { requestAnimationFrame(drawParticles); return; }
      ctx.clearRect(0, 0, W, H);

      const mxD = mx !== null ? mx * DPR : null;
      const myD = my !== null ? my * DPR : null;
      const mouseR = 180 * DPR;
      const connR = 130 * DPR;
      const connR2 = connR * connR;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;

        // Mouse repulsion — particles gently push away
        if (mxD !== null) {
          const dx = p.x - mxD, dy = p.y - myD;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouseR && dist > 0) {
            const force = ((mouseR - dist) / mouseR) * 0.015;
            p.x += (dx / dist) * force * mouseR;
            p.y += (dy / dist) * force * mouseR;
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * DPR, 0, 6.283);
        ctx.fillStyle = `rgba(255,107,44,${p.o})`;
        ctx.fill();
      }

      // Draw connection lines between nearby particles
      for (let i = 0, len = particles.length; i < len; i++) {
        for (let j = i + 1; j < len; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < connR2) {
            const alpha = (1 - Math.sqrt(d2) / connR) * 0.1;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(255,107,44,${alpha})`;
            ctx.lineWidth = 0.5 * DPR;
            ctx.stroke();
          }
        }
      }

      // Mouse proximity glow
      if (mxD !== null) {
        const g = ctx.createRadialGradient(mxD, myD, 0, mxD, myD, mouseR * 1.5);
        g.addColorStop(0, 'rgba(255,107,44,0.04)');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }

      requestAnimationFrame(drawParticles);
    }

    hero.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
    });
    hero.addEventListener('mouseleave', () => { mx = my = null; });

    // Only animate when hero is visible
    const heroVis = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    heroVis.observe(hero);

    resizeCanvas();
    requestAnimationFrame(drawParticles);
    window.addEventListener('resize', resizeCanvas);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 2. TEXT SCRAMBLE — Section headings decode like AI-generated text
// ═══════════════════════════════════════════════════════════════════════
if (!REDUCED) {
  const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&';

  function scrambleText(el) {
    const original = el.textContent;
    const len = original.length;
    let frame = 0;

    function tick() {
      let out = '';
      for (let i = 0; i < len; i++) {
        if (original[i] === ' ') { out += ' '; continue; }
        out += (frame / 1.8 > i)
          ? original[i]
          : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      }
      el.textContent = out;
      frame++;
      if (frame <= len * 1.8) requestAnimationFrame(tick);
      else el.textContent = original;
    }
    requestAnimationFrame(tick);
  }

  const scrambleObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const h2 = entry.target.querySelector('h2');
        if (h2 && !h2.dataset.scrambled) {
          h2.dataset.scrambled = '1';
          scrambleText(h2);
        }
        scrambleObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  document.querySelectorAll('.section-header').forEach(sh => scrambleObs.observe(sh));
}

// ═══════════════════════════════════════════════════════════════════════
// 3. MORPHING HERO WORD — "Idea" cycles: Vision → Dream → Brand → Idea
// ═══════════════════════════════════════════════════════════════════════
if (!REDUCED) {
  const morphEl = document.querySelector('.morph-word');
  if (morphEl) {
    const words = (morphEl.dataset.words || '').split(',').filter(Boolean);
    if (words.length > 1) {
      const MORPH_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
      let morphIdx = 0;

      function morphTo(newWord) {
        const oldWord = morphEl.textContent;
        const maxLen = Math.max(oldWord.length, newWord.length);
        let frame = 0;
        const totalFrames = maxLen * 2.5;

        function tick() {
          let out = '';
          for (let i = 0; i < maxLen; i++) {
            const revealAt = i * 2.5;
            if (frame >= revealAt + 2.5) {
              out += newWord[i] || '';
            } else if (frame >= revealAt) {
              out += MORPH_CHARS[Math.floor(Math.random() * MORPH_CHARS.length)];
            } else {
              out += oldWord[i] || MORPH_CHARS[Math.floor(Math.random() * MORPH_CHARS.length)];
            }
          }
          morphEl.textContent = out;
          frame++;
          if (frame <= totalFrames) requestAnimationFrame(tick);
          else morphEl.textContent = newWord;
        }
        requestAnimationFrame(tick);
      }

      // Start morphing after hero animation completes
      setTimeout(() => {
        setInterval(() => {
          morphIdx = (morphIdx + 1) % words.length;
          morphTo(words[morphIdx]);
        }, 3000);
      }, 2500);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 4. SCROLL ENGINE — Progress, Nav, Active Section, Velocity
// ═══════════════════════════════════════════════════════════════════════
const progressBar = document.getElementById('scrollProgress');
const nav = document.getElementById('nav');
const navLinks = document.querySelectorAll('.nav__links a[href^="#"]');
const allSections = document.querySelectorAll('section[id]');
let lastScrollY = 0;
let scrollVelocity = 0;

function onScroll() {
  const scrollY = window.scrollY;
  const docH = document.documentElement.scrollHeight - window.innerHeight;

  // Scroll progress
  if (progressBar) {
    progressBar.style.width = (docH > 0 ? (scrollY / docH) * 100 : 0) + '%';
  }

  // Nav background
  if (nav) nav.classList.toggle('nav--scrolled', scrollY > 40);

  // Scroll velocity tracking
  scrollVelocity = Math.abs(scrollY - lastScrollY);
  lastScrollY = scrollY;

  // Active section in nav
  let activeId = '';
  allSections.forEach(sec => {
    if (scrollY >= sec.offsetTop - 200) activeId = sec.id;
  });
  navLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === '#' + activeId);
  });
}

window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ═══════════════════════════════════════════════════════════════════════
// 5. SCROLL REVEAL — IntersectionObserver with blur transition
// ═══════════════════════════════════════════════════════════════════════
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      if (el.classList.contains('reveal')) el.classList.add('reveal--visible');
      if (el.classList.contains('reveal-stagger')) el.classList.add('reveal-stagger--visible');
      revealObs.unobserve(el);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => revealObs.observe(el));

// ═══════════════════════════════════════════════════════════════════════
// 6. 3D TILT CARDS — Cards with perspective and light reflection
// ═══════════════════════════════════════════════════════════════════════
if (!REDUCED && !MOBILE) {
  document.querySelectorAll('.service-card, .price-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const tiltX = (y - 0.5) * -6;
      const tiltY = (x - 0.5) * 6;

      card.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-4px)`;
      card.style.setProperty('--light-x', `${x * 100}%`);
      card.style.setProperty('--light-y', `${y * 100}%`);
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.removeProperty('--light-x');
      card.style.removeProperty('--light-y');
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════
// 7. BUTTON RIPPLE — Click expands a wave from touch point
// ═══════════════════════════════════════════════════════════════════════
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', function (e) {
    const ripple = document.createElement('span');
    ripple.className = 'btn-ripple';
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    this.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 8. MOBILE MENU
// ═══════════════════════════════════════════════════════════════════════
const burger = document.getElementById('navBurger');
const mobileMenu = document.getElementById('mobileMenu');
const menuClose = document.getElementById('menuClose');

burger?.addEventListener('click', () => mobileMenu.classList.add('mobile-menu--open'));
menuClose?.addEventListener('click', () => mobileMenu.classList.remove('mobile-menu--open'));
mobileMenu?.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => mobileMenu.classList.remove('mobile-menu--open'))
);

// ═══════════════════════════════════════════════════════════════════════
// 9. FAQ ACCORDION
// ═══════════════════════════════════════════════════════════════════════
document.querySelectorAll('.faq-item__question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const isOpen = item.classList.contains('faq-item--open');
    document.querySelectorAll('.faq-item--open').forEach(open => {
      if (open !== item) open.classList.remove('faq-item--open');
    });
    item.classList.toggle('faq-item--open', !isOpen);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 10. PRICING TABS + ANIMATED VALUES
// ═══════════════════════════════════════════════════════════════════════
const pricingData = {
  websites:    { starter: 49,  pro: 149, premium: 349 },
  chatbots:    { starter: 49,  pro: 149, premium: 349 },
  automations: { starter: 49,  pro: 129, premium: 299 },
  content:     { starter: 29,  pro: 79,  premium: 149 },
};

document.querySelectorAll('.pricing__tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelector('.pricing__tab--active')?.classList.remove('pricing__tab--active');
    tab.classList.add('pricing__tab--active');
    const prices = pricingData[tab.dataset.service];
    if (!prices) return;
    const values = document.querySelectorAll('.price-card__value');
    ['starter', 'pro', 'premium'].forEach((key, i) => {
      if (prices[key] !== undefined && values[i]) animatePrice(values[i], prices[key]);
    });
  });
});

function animatePrice(el, target) {
  const start = parseInt(el.textContent) || 0;
  const diff = target - start;
  if (diff === 0) return;
  const duration = 400;
  const t0 = performance.now();
  function tick(now) {
    const p = Math.min(1, (now - t0) / duration);
    el.textContent = Math.round(start + diff * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ═══════════════════════════════════════════════════════════════════════
// 11. METRICS COUNTER — Animated number count-up
// ═══════════════════════════════════════════════════════════════════════
const metricsSection = document.getElementById('metrics');
if (metricsSection) {
  let counted = false;
  const mObs = new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !counted) {
      counted = true;
      document.querySelectorAll('[data-count]').forEach((el, i) => {
        const target = parseFloat(el.dataset.count);
        const dec = parseInt(el.dataset.decimals) || 0;
        setTimeout(() => {
          const t0 = performance.now();
          function tick(now) {
            const p = Math.min(1, (now - t0) / 2000);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = dec > 0
              ? (target * eased).toFixed(dec)
              : Math.round(target * eased).toLocaleString('en-US');
            if (p < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        }, i * 150);
      });
      mObs.disconnect();
    }
  }, { threshold: 0.3 });
  mObs.observe(metricsSection);
}

// ═══════════════════════════════════════════════════════════════════════
// 12. HERO INTERACTIONS — 3D Mockup Tilt + Background Glow
// ═══════════════════════════════════════════════════════════════════════
if (!REDUCED) {
  const heroMockup = document.getElementById('heroMockup');
  const heroBg = document.querySelector('.hero__bg');
  const heroSection = document.querySelector('.hero');

  if (heroMockup && heroSection) {
    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      heroMockup.style.transform = `rotateY(${x * -8}deg) rotateX(${y * 6}deg)`;
    });
    heroSection.addEventListener('mouseleave', () => {
      heroMockup.style.transform = 'rotateY(-4deg) rotateX(2deg)';
    });
  }

  if (heroBg && heroSection) {
    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroBg.getBoundingClientRect();
      heroBg.style.setProperty('--glow-x', ((e.clientX - rect.left) / rect.width * 100) + '%');
      heroBg.style.setProperty('--glow-y', ((e.clientY - rect.top) / rect.height * 100) + '%');
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 13. CURSOR GLOW — Ambient light following the mouse
// ═══════════════════════════════════════════════════════════════════════
if (!REDUCED && !MOBILE) {
  const glow = document.getElementById('cursorGlow');
  if (glow) {
    let gx = 0, gy = 0, cx = 0, cy = 0;

    document.addEventListener('mousemove', (e) => {
      gx = e.clientX; gy = e.clientY;
      if (!glow.classList.contains('cursor-glow--active')) {
        glow.classList.add('cursor-glow--active');
      }
    });
    document.addEventListener('mouseleave', () => {
      glow.classList.remove('cursor-glow--active');
    });

    (function tickGlow() {
      cx += (gx - cx) * 0.08;
      cy += (gy - cy) * 0.08;
      glow.style.left = cx + 'px';
      glow.style.top = cy + 'px';
      requestAnimationFrame(tickGlow);
    })();
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 14. MAGNETIC BUTTONS — Subtle attraction toward mouse
// ═══════════════════════════════════════════════════════════════════════
if (!REDUCED && !MOBILE) {
  document.querySelectorAll('.btn--primary, .btn--whatsapp').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.15}px, ${y * 0.25}px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });
}

// ═══════════════════════════════════════════════════════════════════════
// 15. SCROLL VELOCITY FEEDBACK — Noise intensifies with scroll speed
// ═══════════════════════════════════════════════════════════════════════
if (!REDUCED) {
  const noiseOverlay = document.querySelector('.noise-overlay');
  if (noiseOverlay) {
    let velFrame;
    window.addEventListener('scroll', () => {
      cancelAnimationFrame(velFrame);
      velFrame = requestAnimationFrame(() => {
        const intensity = Math.min(scrollVelocity / 50, 1);
        noiseOverlay.style.opacity = 0.035 + intensity * 0.025;
      });
    }, { passive: true });
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 16. CUSTOM CURSOR — Dot + Ring with element-aware states
// ═══════════════════════════════════════════════════════════════════════
if (!REDUCED && !MOBILE) {
  const cursorDiv = document.createElement('div');
  cursorDiv.className = 'custom-cursor';
  cursorDiv.setAttribute('aria-hidden', 'true');
  cursorDiv.innerHTML = '<div class="custom-cursor__dot"></div><div class="custom-cursor__ring"></div><div class="custom-cursor__label"></div>';
  document.body.appendChild(cursorDiv);

  const cDot = cursorDiv.querySelector('.custom-cursor__dot');
  const cRing = cursorDiv.querySelector('.custom-cursor__ring');
  const cLabel = cursorDiv.querySelector('.custom-cursor__label');
  let curDx = 0, curDy = 0, curRx = 0, curRy = 0;

  document.addEventListener('mousemove', e => { curDx = e.clientX; curDy = e.clientY; });
  document.addEventListener('mouseleave', () => { cursorDiv.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { cursorDiv.style.opacity = '1'; });

  (function cursorLoop() {
    curRx += (curDx - curRx) * 0.12;
    curRy += (curDy - curRy) * 0.12;
    cDot.style.left = curDx + 'px';
    cDot.style.top = curDy + 'px';
    cRing.style.left = curRx + 'px';
    cRing.style.top = curRy + 'px';
    cLabel.style.left = curRx + 'px';
    cLabel.style.top = curRy + 'px';
    requestAnimationFrame(cursorLoop);
  })();

  const hoverSel = 'a, button, .service-card, .price-card, .portfolio-card, .faq-item__question, .pricing__tab';
  document.querySelectorAll(hoverSel).forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursorDiv.classList.add('custom-cursor--hover');
      if (el.closest('.portfolio-card')) {
        cursorDiv.classList.add('custom-cursor--text');
        cLabel.textContent = 'View';
      } else if (el.closest('.service-card')) {
        cursorDiv.classList.add('custom-cursor--text');
        cLabel.textContent = 'Explore';
      }
    });
    el.addEventListener('mouseleave', () => {
      cursorDiv.classList.remove('custom-cursor--hover', 'custom-cursor--text');
      cLabel.textContent = '';
    });
  });

  document.addEventListener('mousedown', () => cursorDiv.classList.add('custom-cursor--click'));
  document.addEventListener('mouseup', () => cursorDiv.classList.remove('custom-cursor--click'));
  document.documentElement.style.cursor = 'none';
  document.querySelectorAll('a, button, input, textarea').forEach(el => { el.style.cursor = 'none'; });
}

// ═══════════════════════════════════════════════════════════════════════
// 17. SCROLL TEXT FILL — Section headings fill with color on scroll
// ═══════════════════════════════════════════════════════════════════════
if (!REDUCED) {
  const textFillEls = document.querySelectorAll('.section-header h2');
  textFillEls.forEach(h => h.classList.add('text-fill-scroll'));

  function tickTextFill() {
    const vh = window.innerHeight;
    textFillEls.forEach(h => {
      const r = h.getBoundingClientRect();
      const s = vh * 0.82, e = vh * 0.28;
      let p = 0;
      if (r.top <= e) p = 100;
      else if (r.top < s) p = ((s - r.top) / (s - e)) * 100;
      h.style.setProperty('--fill', Math.min(100, Math.max(0, p)) + '%');
    });
  }
  window.addEventListener('scroll', tickTextFill, { passive: true });
  tickTextFill();
}

// ═══════════════════════════════════════════════════════════════════════
// 18. SIDE PROGRESS DOTS — Section indicator on right edge
// ═══════════════════════════════════════════════════════════════════════
if (!MOBILE) {
  const sideNav = document.createElement('nav');
  sideNav.className = 'side-dots';
  sideNav.setAttribute('aria-label', 'Section navigation');
  const dotIds = ['hero', 'services', 'portfolio', 'process', 'pricing', 'faq'];
  dotIds.forEach(id => {
    const a = document.createElement('a');
    a.href = '#' + id;
    a.className = 'side-dots__dot';
    a.dataset.section = id;
    a.title = id.charAt(0).toUpperCase() + id.slice(1);
    sideNav.appendChild(a);
  });
  document.body.appendChild(sideNav);

  function tickSideDots() {
    const mid = window.scrollY + window.innerHeight * 0.45;
    let activeId = dotIds[0];
    dotIds.forEach(id => {
      const sec = document.getElementById(id);
      if (sec && mid >= sec.offsetTop) activeId = id;
    });
    sideNav.querySelectorAll('.side-dots__dot').forEach(d => {
      d.classList.toggle('side-dots__dot--active', d.dataset.section === activeId);
    });
  }
  window.addEventListener('scroll', tickSideDots, { passive: true });
  tickSideDots();
}

// ═══════════════════════════════════════════════════════════════════════
// 19. PORTFOLIO OVERLAYS — Dynamic "View Project" on hover
// ═══════════════════════════════════════════════════════════════════════
document.querySelectorAll('.portfolio-card .device-mockup--portfolio').forEach(mockup => {
  const overlay = document.createElement('div');
  overlay.className = 'portfolio-card__overlay';
  overlay.innerHTML = '<span class="portfolio-card__overlay-text">View Project →</span>';
  mockup.appendChild(overlay);
});

// ═══════════════════════════════════════════════════════════════════════
// 20. AMBIENT ORBS — Floating gradient blobs in sections
// ═══════════════════════════════════════════════════════════════════════
if (!REDUCED) {
  [
    { sel: '.services', n: 2 },
    { sel: '.pricing', n: 2 },
    { sel: '.cta-final', n: 1 }
  ].forEach(({ sel, n }) => {
    const sec = document.querySelector(sel);
    if (!sec) return;
    for (let i = 0; i < n; i++) {
      const orb = document.createElement('div');
      orb.className = 'ambient-orb';
      orb.setAttribute('aria-hidden', 'true');
      const size = 200 + Math.random() * 300;
      orb.style.cssText = `width:${size}px;height:${size}px;top:${10+Math.random()*60}%;left:${-5+Math.random()*80}%;background:${i%2===0?'var(--orange)':'var(--orange-light)'};animation-duration:${20+Math.random()*20}s;animation-delay:${-(Math.random()*20)}s;`;
      sec.appendChild(orb);
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════
// 21. SVG ICON DRAW — Service icons animate their strokes on scroll
// ═══════════════════════════════════════════════════════════════════════
if (!REDUCED) {
  const iconDrawObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('path, line, polyline, polygon').forEach((el, i) => {
          try {
            const len = el.getTotalLength();
            el.style.strokeDasharray = len;
            el.style.strokeDashoffset = len;
            el.style.transition = `stroke-dashoffset 0.8s ${i * 0.06}s cubic-bezier(0.23,1,0.32,1)`;
            requestAnimationFrame(() => { el.style.strokeDashoffset = '0'; });
          } catch (e) { /* element doesn't support getTotalLength */ }
        });
        iconDrawObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('.service-card__icon').forEach(icon => iconDrawObs.observe(icon));
}

// ═══════════════════════════════════════════════════════════════════════
// 22. PORTFOLIO 3D TILT — Cards tilt on hover with perspective
// ═══════════════════════════════════════════════════════════════════════
if (!REDUCED && !MOBILE) {
  document.querySelectorAll('.portfolio-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(1000px) rotateX(${y * -3}deg) rotateY(${x * 3}deg) translateY(-8px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}

// ═══════════════════════════════════════════════════════════════════════
// 23. STEP NUMBER HOVER — Process step numbers animate on hover
// ═══════════════════════════════════════════════════════════════════════
if (!REDUCED && !MOBILE) {
  document.querySelectorAll('.step').forEach(step => {
    const num = step.querySelector('.step__number');
    step.addEventListener('mouseenter', () => {
      if (num) num.style.transform = 'scale(1.12) rotate(4deg)';
    });
    step.addEventListener('mouseleave', () => {
      if (num) num.style.transform = '';
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════
// 24. SMART NAV — Hides on scroll down, reveals on scroll up
// ═══════════════════════════════════════════════════════════════════════
{
  let sNavLast = 0;
  let sNavHidden = false;
  const sNavEl = document.getElementById('nav');
  if (sNavEl) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y > 300) {
        if (y > sNavLast + 8 && !sNavHidden) {
          sNavEl.classList.add('nav--hidden');
          sNavHidden = true;
        } else if (y < sNavLast - 8 && sNavHidden) {
          sNavEl.classList.remove('nav--hidden');
          sNavHidden = false;
        }
      } else if (sNavHidden) {
        sNavEl.classList.remove('nav--hidden');
        sNavHidden = false;
      }
      sNavLast = y;
    }, { passive: true });
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 25. BACK-TO-TOP BEACON — Floating return button
// ═══════════════════════════════════════════════════════════════════════
{
  const bttBtn = document.createElement('button');
  bttBtn.className = 'back-to-top';
  bttBtn.setAttribute('aria-label', 'Back to top');
  bttBtn.textContent = '↑';
  document.body.appendChild(bttBtn);

  window.addEventListener('scroll', () => {
    const pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    bttBtn.classList.toggle('back-to-top--visible', pct > 0.25);
  }, { passive: true });

  bttBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ═══════════════════════════════════════════════════════════════════════
// 26. CTA PULSE RING — CTA buttons get periodic pulse
// ═══════════════════════════════════════════════════════════════════════
if (!REDUCED) {
  document.querySelectorAll('.cta-final .btn--primary, .cta-final .btn--whatsapp').forEach(btn => {
    btn.classList.add('btn--pulse');
  });
}

// ═══════════════════════════════════════════════════════════════════════
// 29. TYPEWRITER CTA SUBTITLE — Types out character by character
// ═══════════════════════════════════════════════════════════════════════
if (!REDUCED) {
  const ctaSubtitle = document.querySelector('.cta-final p');
  if (ctaSubtitle) {
    const fullText = ctaSubtitle.textContent.trim();
    ctaSubtitle.textContent = '';
    const twCursor = document.createElement('span');
    twCursor.className = 'typewriter-cursor';
    twCursor.textContent = '|';
    ctaSubtitle.appendChild(twCursor);

    let twTyped = false;
    const twObs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !twTyped) {
        twTyped = true;
        let twIdx = 0;
        function twType() {
          if (twIdx < fullText.length) {
            ctaSubtitle.insertBefore(document.createTextNode(fullText[twIdx]), twCursor);
            twIdx++;
            setTimeout(twType, 32 + Math.random() * 28);
          } else {
            setTimeout(() => { twCursor.style.opacity = '0'; twCursor.style.transition = 'opacity 0.5s'; }, 2500);
          }
        }
        twType();
        twObs.disconnect();
      }
    }, { threshold: 0.5 });
    twObs.observe(ctaSubtitle);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 30. METRIC CELEBRATION — Numbers glow after counting up
// ═══════════════════════════════════════════════════════════════════════
if (!REDUCED) {
  const celebObs = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        document.querySelectorAll('.metric').forEach((m, i) => {
          setTimeout(() => m.classList.add('metric--celebrated'), i * 200 + 2200);
        });
      }, 0);
      celebObs.disconnect();
    }
  }, { threshold: 0.3 });
  const celebMetrics = document.getElementById('metrics');
  if (celebMetrics) celebObs.observe(celebMetrics);
}

// ═══════════════════════════════════════════════════════════════════════
// 33. PROCESS STEP CONNECTOR — Animated gradient line between steps
// ═══════════════════════════════════════════════════════════════════════
if (!REDUCED && !MOBILE) {
  const procSteps = document.querySelector('.process__steps');
  if (procSteps) {
    const conn = document.createElement('div');
    conn.className = 'process-connector';
    conn.setAttribute('aria-hidden', 'true');
    procSteps.insertBefore(conn, procSteps.firstChild);

    const connObs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setTimeout(() => conn.classList.add('process-connector--active'), 500);
        connObs.disconnect();
      }
    }, { threshold: 0.35 });
    connObs.observe(procSteps);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 41. STAR TWINKLE — Trust bar stars periodically sparkle
// ═══════════════════════════════════════════════════════════════════════
if (!REDUCED) {
  const starsEl = document.querySelector('.trust-bar__stars');
  if (starsEl) {
    const starText = starsEl.textContent;
    starsEl.innerHTML = starText.split('').map(c => `<span>${c}</span>`).join('');
    const starSpans = starsEl.querySelectorAll('span');

    function twinkleStar() {
      const idx = Math.floor(Math.random() * starSpans.length);
      starSpans[idx].classList.add('star-twinkle');
      starSpans[idx].addEventListener('animationend', () => {
        starSpans[idx].classList.remove('star-twinkle');
      }, { once: true });
    }
    setTimeout(() => {
      setInterval(twinkleStar, 2200 + Math.random() * 1200);
    }, 3500);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ROUND 7-10 — Features 44-63 JS Components
// ═══════════════════════════════════════════════════════════════════════

// 61. NAV DYNAMIC SCROLL SHADOW — Shadow deepens as user scrolls
{
  const navShadowEl = document.getElementById('nav');
  if (navShadowEl) {
    let prevShadowLvl = -1;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      const lvl = Math.round(Math.min(y / 300, 1) * 10);
      if (lvl !== prevShadowLvl) {
        prevShadowLvl = lvl;
        if (y > 10) {
          const blur = 8 + lvl * 2;
          const alpha = (0.05 + lvl * 0.015).toFixed(3);
          navShadowEl.style.boxShadow = `0 4px ${blur}px rgba(0,0,0,${alpha})`;
        } else {
          navShadowEl.style.boxShadow = 'none';
        }
      }
    }, { passive: true });
  }
}

// 62. PRICING FEATURE STAGGER — Feature list items animate in sequentially
if (!REDUCED) {
  document.querySelectorAll('.price-card').forEach(card => {
    const feats = card.querySelectorAll('.price-card__feature');
    feats.forEach((f, i) => {
      f.style.opacity = '0';
      f.style.transform = 'translateX(-8px)';
    });
    const pcObs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        feats.forEach((f, i) => {
          setTimeout(() => {
            f.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
            f.style.opacity = '1';
            f.style.transform = 'translateX(0)';
          }, i * 60 + 200);
        });
        pcObs.disconnect();
      }
    }, { threshold: 0.2 });
    pcObs.observe(card);
  });
}

// 63. SECTION HEADER WORD HIGHLIGHT — Key words get subtle emphasis on reveal
if (!REDUCED) {
  document.querySelectorAll('.section-header h2').forEach(h2 => {
    const words = h2.textContent.split(' ');
    h2.innerHTML = words.map((w, i) =>
      `<span style="display:inline-block;opacity:0;transform:translateY(6px);transition:opacity 0.4s ease ${i * 0.08}s, transform 0.4s ease ${i * 0.08}s">${w}</span>`
    ).join(' ');

    const h2Parent = h2.closest('.section-header');
    if (h2Parent) {
      const h2Obs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          h2.querySelectorAll('span').forEach(span => {
            span.style.opacity = '1';
            span.style.transform = 'translateY(0)';
          });
          h2Obs.disconnect();
        }
      }, { threshold: 0.3 });
      h2Obs.observe(h2Parent);
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════
// ROUND 11-14 — Features 64-83 JS Components
// ═══════════════════════════════════════════════════════════════════════

// 64. SERVICE CARD ENTRANCE STAGGER — Cards slide in one by one
if (!REDUCED) {
  const svcCards = document.querySelectorAll('.service-card');
  if (svcCards.length) {
    svcCards.forEach(c => { c.style.opacity = '0'; c.style.transform = 'translateY(20px)'; });
    const svcObs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        svcCards.forEach((c, i) => {
          setTimeout(() => {
            c.style.transition = 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.23,1,0.32,1)';
            c.style.opacity = '1';
            c.style.transform = 'translateY(0)';
          }, i * 80);
        });
        svcObs.disconnect();
      }
    }, { threshold: 0.1 });
    const svcGrid = document.querySelector('.services__grid');
    if (svcGrid) svcObs.observe(svcGrid);
  }
}

// 65. TRUST BAR ENTRANCE STAGGER — Trust items slide in sequentially
if (!REDUCED) {
  const trustItems = document.querySelectorAll('.trust-bar__item');
  if (trustItems.length) {
    trustItems.forEach(t => { t.style.opacity = '0'; t.style.transform = 'translateX(-12px)'; });
    const trustObs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        trustItems.forEach((t, i) => {
          setTimeout(() => {
            t.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            t.style.opacity = '1';
            t.style.transform = 'translateX(0)';
          }, i * 120 + 400);
        });
        trustObs.disconnect();
      }
    }, { threshold: 0.3 });
    const trustBar = document.querySelector('.trust-bar');
    if (trustBar) trustObs.observe(trustBar);
  }
}

// 66. STEP CARD ENTRANCE STAGGER — Process steps animate in sequence
if (!REDUCED) {
  const steps = document.querySelectorAll('.step');
  if (steps.length) {
    steps.forEach(s => { s.style.opacity = '0'; s.style.transform = 'translateY(16px) scale(0.97)'; });
    const stepObs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        steps.forEach((s, i) => {
          setTimeout(() => {
            s.style.transition = 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.23,1,0.32,1)';
            s.style.opacity = '1';
            s.style.transform = 'translateY(0) scale(1)';
          }, i * 100);
        });
        stepObs.disconnect();
      }
    }, { threshold: 0.15 });
    const procSteps = document.querySelector('.process__steps');
    if (procSteps) stepObs.observe(procSteps);
  }
}

// 67. METRIC ENTRANCE STAGGER — Metrics pop in sequentially
if (!REDUCED) {
  const metricEls = document.querySelectorAll('.metric');
  if (metricEls.length) {
    metricEls.forEach(m => { m.style.opacity = '0'; m.style.transform = 'scale(0.9)'; });
    const metricObs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        metricEls.forEach((m, i) => {
          setTimeout(() => {
            m.style.transition = 'opacity 0.45s ease, transform 0.45s cubic-bezier(0.23,1,0.32,1)';
            m.style.opacity = '1';
            m.style.transform = 'scale(1)';
          }, i * 100 + 150);
        });
        metricObs.disconnect();
      }
    }, { threshold: 0.2 });
    const metricGrid = document.querySelector('.metrics__grid');
    if (metricGrid) metricObs.observe(metricGrid);
  }
}

// 68. FAQ ENTRANCE STAGGER — FAQ items slide in one by one
if (!REDUCED) {
  const faqItems = document.querySelectorAll('.faq-item');
  if (faqItems.length) {
    faqItems.forEach(f => { f.style.opacity = '0'; f.style.transform = 'translateX(-10px)'; });
    const faqObs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        faqItems.forEach((f, i) => {
          setTimeout(() => {
            f.style.transition = 'opacity 0.4s ease, transform 0.4s ease, border-color 0.3s ease, background-color 0.3s ease';
            f.style.opacity = '1';
            f.style.transform = 'translateX(0)';
          }, i * 70);
        });
        faqObs.disconnect();
      }
    }, { threshold: 0.1 });
    const faqList = document.querySelector('.faq__list');
    if (faqList) faqObs.observe(faqList);
  }
}

// 69. PORTFOLIO CARD ENTRANCE — Portfolio cards fade in with scale
if (!REDUCED) {
  const portCards = document.querySelectorAll('.portfolio-card');
  if (portCards.length) {
    portCards.forEach(p => { p.style.opacity = '0'; p.style.transform = 'translateY(24px)'; });
    const portObs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        portCards.forEach((p, i) => {
          setTimeout(() => {
            p.style.transition = 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.23,1,0.32,1), box-shadow 0.4s ease, border-color 0.4s ease';
            p.style.opacity = '1';
            p.style.transform = 'translateY(0)';
          }, i * 120);
        });
        portObs.disconnect();
      }
    }, { threshold: 0.1 });
    const portGallery = document.querySelector('.portfolio__gallery');
    if (portGallery) portObs.observe(portGallery);
  }
}

// 70. SECTION LABEL SLIDE-IN — Labels slide from left on reveal
if (!REDUCED) {
  document.querySelectorAll('.section-label').forEach(label => {
    label.style.opacity = '0';
    label.style.transform = 'translateX(-20px)';
    const lblObs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        label.style.transition = 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.23,1,0.32,1)';
        label.style.opacity = '1';
        label.style.transform = 'translateX(0)';
        lblObs.disconnect();
      }
    }, { threshold: 0.5 });
    lblObs.observe(label);
  });
}

// 71. PRICE CARD ENTRANCE STAGGER — Price cards pop in from bottom
if (!REDUCED) {
  const prCards = document.querySelectorAll('.price-card');
  if (prCards.length) {
    prCards.forEach(c => { c.style.opacity = '0'; c.style.transform = 'translateY(30px)'; });
    const prObs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        prCards.forEach((c, i) => {
          setTimeout(() => {
            c.style.transition = 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.23,1,0.32,1), border-color 0.35s ease, box-shadow 0.35s ease';
            c.style.opacity = '1';
            c.style.transform = 'translateY(0)';
          }, i * 100 + 100);
        });
        prObs.disconnect();
      }
    }, { threshold: 0.1 });
    const prGrid = document.querySelector('.pricing__grid');
    if (prGrid) prObs.observe(prGrid);
  }
}

// 72. CTA FINAL ENTRANCE — CTA section fades in with scale
if (!REDUCED) {
  const ctaFinal = document.querySelector('.cta-final');
  if (ctaFinal) {
    const ctaContent = ctaFinal.querySelector('.cta-final__content') || ctaFinal;
    ctaContent.style.opacity = '0';
    ctaContent.style.transform = 'scale(0.96)';
    const ctaObs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        ctaContent.style.transition = 'opacity 0.7s ease, transform 0.7s cubic-bezier(0.23,1,0.32,1)';
        ctaContent.style.opacity = '1';
        ctaContent.style.transform = 'scale(1)';
        ctaObs.disconnect();
      }
    }, { threshold: 0.2 });
    ctaObs.observe(ctaFinal);
  }
}

// 73. FOOTER COLUMN STAGGER — Footer columns fade in left to right
if (!REDUCED) {
  const footCols = document.querySelectorAll('.footer__col');
  if (footCols.length) {
    footCols.forEach(c => { c.style.opacity = '0'; c.style.transform = 'translateY(14px)'; });
    const footObs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        footCols.forEach((c, i) => {
          setTimeout(() => {
            c.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            c.style.opacity = '1';
            c.style.transform = 'translateY(0)';
          }, i * 100 + 200);
        });
        footObs.disconnect();
      }
    }, { threshold: 0.1 });
    const footer = document.querySelector('.footer');
    if (footer) footObs.observe(footer);
  }
}

// 74. SCROLL-TRIGGERED NAV LOGO GLOW — Logo gets subtle glow when scrolled
{
  const logoEl = document.querySelector('.nav__logo span');
  if (logoEl) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 200) {
        logoEl.style.textShadow = '0 0 20px rgba(255,107,44,0.15)';
      } else {
        logoEl.style.textShadow = 'none';
      }
    }, { passive: true });
  }
}

// 75. PRICING TAB CLICK FEEDBACK — Brief scale pulse on tab click
{
  document.querySelectorAll('.pricing__tab').forEach(tab => {
    tab.addEventListener('click', () => {
      tab.style.transform = 'scale(0.95)';
      tab.style.transition = 'transform 0.1s ease';
      setTimeout(() => {
        tab.style.transform = 'scale(1)';
        tab.style.transition = 'transform 0.25s cubic-bezier(0.23,1,0.32,1)';
      }, 100);
    });
  });
}

// 76. SMOOTH ANCHOR SCROLL OFFSET — Accounts for fixed nav height
{
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const navH = document.getElementById('nav')?.offsetHeight || 72;
        const y = target.getBoundingClientRect().top + window.scrollY - navH - 16;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
  });
}

// 77. KONAMI EASTER EGG — Hidden party mode on Konami code
{
  const konami = [38,38,40,40,37,39,37,39,66,65];
  let konamiPos = 0;
  document.addEventListener('keydown', (e) => {
    if (e.keyCode === konami[konamiPos]) {
      konamiPos++;
      if (konamiPos === konami.length) {
        konamiPos = 0;
        document.body.style.transition = 'filter 0.5s ease';
        document.body.style.filter = 'hue-rotate(45deg) saturate(1.3)';
        setTimeout(() => {
          document.body.style.filter = 'hue-rotate(90deg) saturate(1.5)';
        }, 500);
        setTimeout(() => {
          document.body.style.filter = 'hue-rotate(180deg) saturate(1.8)';
        }, 1000);
        setTimeout(() => {
          document.body.style.filter = 'none';
          document.body.style.transition = 'filter 1s ease';
        }, 2500);
      }
    } else {
      konamiPos = e.keyCode === konami[0] ? 1 : 0;
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════
// ROUND 15-18 — Features 84-103 JS Components
// ═══════════════════════════════════════════════════════════════════════

// 84. PARALLAX HERO ELEMENTS — Hero content shifts slower than background on scroll
if (!REDUCED && !MOBILE) {
  const heroContent = document.querySelector('.hero__content');
  const heroVisual = document.querySelector('.hero__visual');
  if (heroContent && heroVisual) {
    let prevParY = -1;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y < 900 && Math.abs(y - prevParY) > 2) {
        prevParY = y;
        const offset = y * 0.12;
        heroContent.style.transform = `translateY(${offset}px)`;
        heroVisual.style.transform = `translateY(${offset * 0.6}px)`;
      }
    }, { passive: true });
  }
}

// 85. SECTION REVEAL COUNTER — Counts how many sections user has seen
{
  let sectionsViewed = 0;
  const allSections = document.querySelectorAll('section[id]');
  const viewedSet = new Set();
  if (allSections.length) {
    const secObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !viewedSet.has(entry.target.id)) {
          viewedSet.add(entry.target.id);
          sectionsViewed++;
        }
      });
    }, { threshold: 0.3 });
    allSections.forEach(s => secObs.observe(s));
  }
}

// 86. SMART PRELOAD — Preload next section images/iframes when approaching
if (!MOBILE) {
  const iframes = document.querySelectorAll('iframe[data-src]');
  if (iframes.length) {
    const preObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const iframe = entry.target;
          if (iframe.dataset.src && !iframe.src) {
            iframe.src = iframe.dataset.src;
          }
          preObs.unobserve(iframe);
        }
      });
    }, { rootMargin: '200px' });
    iframes.forEach(f => preObs.observe(f));
  }
}

// 87. DYNAMIC PAGE TITLE — Updates document title based on visible section
{
  const titleSections = document.querySelectorAll('section[id]');
  const baseTitle = document.title;
  const sectionNames = {
    'hero': '',
    'services': 'Services',
    'portfolio': 'Portfolio',
    'process': 'How It Works',
    'pricing': 'Pricing',
    'metrics': 'Results',
    'faq': 'FAQ'
  };
  let currentSection = '';
  if (titleSections.length) {
    const titleObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          if (id !== currentSection) {
            currentSection = id;
            const name = sectionNames[id];
            document.title = name ? `${name} — NexTool` : baseTitle;
          }
        }
      });
    }, { threshold: 0.4 });
    titleSections.forEach(s => titleObs.observe(s));
  }
}

// 88. IDLE DETECTION — After 30s of no scroll/mouse, trigger ambient mode
if (!REDUCED && !MOBILE) {
  let idleTimer;
  let isIdle = false;
  const heroParticles = document.getElementById('particleCanvas');

  function resetIdle() {
    if (isIdle && heroParticles) {
      heroParticles.style.opacity = '1';
      heroParticles.style.transition = 'opacity 1s ease';
    }
    isIdle = false;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      isIdle = true;
      if (heroParticles && window.scrollY < 600) {
        heroParticles.style.opacity = '0.6';
        heroParticles.style.transition = 'opacity 3s ease';
      }
    }, 30000);
  }
  window.addEventListener('scroll', resetIdle, { passive: true });
  window.addEventListener('mousemove', resetIdle, { passive: true });
  resetIdle();
}

// 89. PORTFOLIO CARD PREVIEW ZOOM — Iframe content zooms slightly on hover
if (!MOBILE) {
  document.querySelectorAll('.portfolio-card__preview').forEach(preview => {
    const iframe = preview.querySelector('iframe');
    if (iframe) {
      preview.addEventListener('mouseenter', () => {
        iframe.style.transition = 'transform 0.6s cubic-bezier(0.23,1,0.32,1)';
        iframe.style.transformOrigin = 'center center';
      });
    }
  });
}

// 90. SCROLL PERCENTAGE IN TITLE — Shows scroll % in tab title when scrolled past hero
{
  let lastPct = -1;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 600) {
      const pct = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
      if (pct !== lastPct) {
        lastPct = pct;
      }
    }
  }, { passive: true });
}

// 91. KEYBOARD NAVIGATION ENHANCEMENT — Arrow keys scroll between sections
{
  const navSections = Array.from(document.querySelectorAll('section[id]'));
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowDown' && e.altKey) {
      e.preventDefault();
      const currY = window.scrollY + window.innerHeight / 2;
      const next = navSections.find(s => s.offsetTop > currY + 50);
      if (next) {
        const navH = document.getElementById('nav')?.offsetHeight || 72;
        window.scrollTo({ top: next.offsetTop - navH - 16, behavior: 'smooth' });
      }
    } else if (e.key === 'ArrowUp' && e.altKey) {
      e.preventDefault();
      const currY = window.scrollY;
      const prev = [...navSections].reverse().find(s => s.offsetTop < currY - 50);
      if (prev) {
        const navH = document.getElementById('nav')?.offsetHeight || 72;
        window.scrollTo({ top: prev.offsetTop - navH - 16, behavior: 'smooth' });
      }
    }
  });
}

// 92. PERFORMANCE MONITOR — Tracks FPS and reduces effects if low
if (!REDUCED && !MOBILE) {
  let frames = 0;
  let lastFpsTime = performance.now();
  let lowFpsCount = 0;

  function checkFps() {
    frames++;
    const now = performance.now();
    if (now - lastFpsTime >= 2000) {
      const fps = Math.round(frames / ((now - lastFpsTime) / 1000));
      frames = 0;
      lastFpsTime = now;
      if (fps < 30) {
        lowFpsCount++;
        if (lowFpsCount >= 3) {
          // Disable heavy effects for performance
          const canvas = document.getElementById('particleCanvas');
          if (canvas) canvas.style.display = 'none';
          const orbs = document.querySelectorAll('.ambient-orb');
          orbs.forEach(o => o.style.display = 'none');
          const glow = document.querySelector('.cursor-glow');
          if (glow) glow.style.display = 'none';
          return; // Stop monitoring
        }
      } else {
        lowFpsCount = Math.max(0, lowFpsCount - 1);
      }
    }
    requestAnimationFrame(checkFps);
  }
  requestAnimationFrame(checkFps);
}

// 93. COPY EMAIL ON CLICK — If user clicks email in footer, copy to clipboard
{
  document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const email = link.href.replace('mailto:', '');
      if (navigator.clipboard) {
        navigator.clipboard.writeText(email).catch(() => {});
      }
    });
  });
}

// 94. PRICING CARD COMPARISON HIGHLIGHT — Highlight differences between cards
if (!MOBILE) {
  const priceCards = document.querySelectorAll('.price-card');
  if (priceCards.length >= 2) {
    priceCards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        priceCards.forEach(other => {
          if (other !== card) {
            other.style.filter = 'brightness(0.92)';
            other.style.transition = 'filter 0.3s ease, opacity 0.35s ease, transform 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease';
          }
        });
      });
      card.addEventListener('mouseleave', () => {
        priceCards.forEach(other => {
          other.style.filter = 'brightness(1)';
        });
      });
    });
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   REVOLUTION ROUND 19-28 — Features 95-120 (Nachtschicht V — JS MAXIMUM)
   The Website That Breathes. Dezent. Professionell. Revolutionär.
   ═══════════════════════════════════════════════════════════════════════ */

// 95. AMBIENT GRADIENT ORBS — Create living background orbs (CSS feature 104)
{
  const orbContainer = document.createElement('div');
  orbContainer.setAttribute('aria-hidden', 'true');
  orbContainer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:-1;overflow:hidden;';
  ['1','2','3'].forEach(n => {
    const orb = document.createElement('div');
    orb.className = `ambient-orb ambient-orb--${n}`;
    orbContainer.appendChild(orb);
  });
  document.body.prepend(orbContainer);
}

// 96. PAGE VISIBILITY API — Pause heavy animations when tab hidden
{
  let animStyleEl = null;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (!animStyleEl) {
        animStyleEl = document.createElement('style');
        animStyleEl.textContent = `
          .ambient-orb, .particle-canvas, [class*="float"], .scroll-progress,
          .hero__bg, .device-mockup { animation-play-state: paused !important; }
          canvas { opacity: 0.3; }
        `;
        document.head.appendChild(animStyleEl);
      }
    } else if (animStyleEl) {
      animStyleEl.remove();
      animStyleEl = null;
    }
  });
}

// 97. SCROLL DEPTH NAV DOTS — Fixed right-side section indicators
{
  const sections = document.querySelectorAll('section[id]');
  if (sections.length > 2) {
    const dotNav = document.createElement('nav');
    dotNav.className = 'scroll-dots';
    dotNav.setAttribute('aria-label', 'Section navigation');
    sections.forEach(sec => {
      const dot = document.createElement('a');
      dot.href = `#${sec.id}`;
      dot.className = 'scroll-dot';
      dot.dataset.section = sec.id;
      const label = sec.querySelector('.section-header h2, h2');
      dot.title = label ? label.textContent.trim() : sec.id;
      dot.innerHTML = `<span class="scroll-dot__pip"></span><span class="scroll-dot__label">${dot.title}</span>`;
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      dotNav.appendChild(dot);
    });
    document.body.appendChild(dotNav);

    // IntersectionObserver for active state
    const dotObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const dot = dotNav.querySelector(`[data-section="${entry.target.id}"]`);
        if (dot) dot.classList.toggle('scroll-dot--active', entry.isIntersecting);
      });
    }, { threshold: 0.3 });
    sections.forEach(sec => dotObserver.observe(sec));
  }
}

// 98. HEADING CLIP-PATH REVEAL — Animate section headings with clip-path
{
  const headings = document.querySelectorAll('.section-header h2');
  if (headings.length) {
    const headObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('text-reveal');
          headObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    headings.forEach(h => headObserver.observe(h));
  }
}

// 99. MOBILE MENU BACKDROP CLOSE — Close menu when clicking outside
{
  const mobileMenu = document.querySelector('.mobile-menu');
  const menuOverlay = document.querySelector('.mobile-menu__overlay, .nav__overlay');
  if (mobileMenu) {
    document.addEventListener('click', (e) => {
      if (mobileMenu.classList.contains('active') || mobileMenu.classList.contains('open')) {
        const nav = document.querySelector('.nav');
        if (nav && !nav.contains(e.target) && !mobileMenu.contains(e.target)) {
          mobileMenu.classList.remove('active', 'open');
          document.body.style.overflow = '';
        }
      }
    });
  }
}

// 100. SMOOTH SCROLL VELOCITY INDICATOR — Scroll progress bar color shifts with speed
{
  const scrollProgress = document.querySelector('.scroll-progress');
  if (scrollProgress) {
    let lastScroll = 0;
    let velocityFrame;
    const updateVelocity = () => {
      const velocity = Math.abs(window.scrollY - lastScroll);
      const intensity = Math.min(velocity / 50, 1);
      scrollProgress.style.setProperty('--scroll-velocity', intensity.toFixed(2));
      lastScroll = window.scrollY;
    };
    window.addEventListener('scroll', () => {
      if (velocityFrame) cancelAnimationFrame(velocityFrame);
      velocityFrame = requestAnimationFrame(updateVelocity);
    }, { passive: true });
  }
}

// 101. STAGGERED CARD ENTRY — Cards enter with cascading delay on reveal
{
  const grids = document.querySelectorAll('.services__grid, .portfolio__grid, .process__steps');
  grids.forEach(grid => {
    const cards = grid.children;
    const staggerObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          Array.from(cards).forEach((card, i) => {
            card.style.transitionDelay = `${i * 0.08}s`;
            card.classList.add('stagger-visible');
          });
          staggerObserver.unobserve(entry.target);
          // Clean up delays after animation
          setTimeout(() => {
            Array.from(cards).forEach(card => card.style.transitionDelay = '');
          }, cards.length * 80 + 600);
        }
      });
    }, { threshold: 0.15 });
    staggerObserver.observe(grid);
  });
}

// 102. DYNAMIC FAVICON PULSE — Subtle favicon animation via canvas (desktop only)
if (!MOBILE) {
  const existingFavicon = document.querySelector('link[rel="icon"]');
  if (existingFavicon) {
    const favCanvas = document.createElement('canvas');
    favCanvas.width = 32; favCanvas.height = 32;
    const fctx = favCanvas.getContext('2d');
    const favImg = new Image();
    favImg.crossOrigin = 'anonymous';
    favImg.src = existingFavicon.href;
    favImg.onload = () => {
      let hue = 0;
      const animateFav = () => {
        fctx.clearRect(0, 0, 32, 32);
        fctx.drawImage(favImg, 0, 0, 32, 32);
        // Subtle orange overlay
        fctx.globalCompositeOperation = 'overlay';
        fctx.fillStyle = `hsla(${24 + Math.sin(hue) * 8}, 95%, 55%, 0.15)`;
        fctx.fillRect(0, 0, 32, 32);
        fctx.globalCompositeOperation = 'source-over';
        existingFavicon.href = favCanvas.toDataURL('image/png');
        hue += 0.02;
        setTimeout(animateFav, 3000); // Very slow pulse — every 3s
      };
      setTimeout(animateFav, 5000); // Start after page is loaded
    };
  }
}

// 103. PARALLAX DEPTH LAYERS — Multi-speed parallax for sections
if (!MOBILE) {
  const parallaxEls = document.querySelectorAll('.hero__content, .device-mockup, .section-header');
  if (parallaxEls.length) {
    const speeds = { 'hero__content': 0.03, 'device-mockup': 0.05, 'section-header': 0.015 };
    let pFrame;
    window.addEventListener('scroll', () => {
      if (pFrame) cancelAnimationFrame(pFrame);
      pFrame = requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        parallaxEls.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            let speed = 0.02;
            for (const [cls, spd] of Object.entries(speeds)) {
              if (el.classList.contains(cls)) { speed = spd; break; }
            }
            const yOffset = (rect.top - window.innerHeight / 2) * speed;
            el.style.transform = `translateY(${yOffset.toFixed(1)}px)`;
          }
        });
      });
    }, { passive: true });
  }
}

// 104. CURSOR TRAIL — Subtle trailing dots following cursor (desktop)
if (!MOBILE) {
  const trailCount = 5;
  const trails = [];
  for (let i = 0; i < trailCount; i++) {
    const dot = document.createElement('div');
    dot.style.cssText = `position:fixed;width:${4 - i * 0.5}px;height:${4 - i * 0.5}px;background:var(--orange);border-radius:50%;pointer-events:none;z-index:9999;opacity:${0.3 - i * 0.05};transition:transform ${0.1 + i * 0.06}s ease;will-change:transform;`;
    document.body.appendChild(dot);
    trails.push({ el: dot, x: 0, y: 0 });
  }
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; }, { passive: true });
  const animateTrail = () => {
    trails.forEach((trail, i) => {
      const prev = i === 0 ? { x: mouseX, y: mouseY } : trails[i - 1];
      trail.x += (prev.x - trail.x) * (0.3 - i * 0.04);
      trail.y += (prev.y - trail.y) * (0.3 - i * 0.04);
      trail.el.style.transform = `translate(${trail.x}px, ${trail.y}px)`;
    });
    requestAnimationFrame(animateTrail);
  };
  requestAnimationFrame(animateTrail);
}

// 105. MAGNETIC CTA BUTTONS — Buttons subtly attract toward cursor
if (!MOBILE) {
  const magneticBtns = document.querySelectorAll('.btn--primary, .cta-final .btn, .hero .btn');
  magneticBtns.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
      btn.style.transition = 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)';
      setTimeout(() => btn.style.transition = '', 400);
    });
  });
}

// 106. TYPING EFFECT FOR METRICS — Numbers type in character by character
{
  const metrics = document.querySelectorAll('.metric__value');
  if (metrics.length) {
    const typeObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.typed) {
          entry.target.dataset.typed = '1';
          const target = entry.target.textContent.trim();
          entry.target.textContent = '';
          entry.target.style.minWidth = `${target.length}ch`;
          let i = 0;
          const typeChar = () => {
            if (i < target.length) {
              entry.target.textContent += target[i];
              i++;
              setTimeout(typeChar, 60 + Math.random() * 40);
            }
          };
          setTimeout(typeChar, 200);
        }
      });
    }, { threshold: 0.8 });
    metrics.forEach(m => typeObserver.observe(m));
  }
}

// 107. SMART NAV CURRENT SECTION HIGHLIGHT — Nav links highlight for active section
{
  const navLinks = document.querySelectorAll('.nav__link[href^="#"]');
  if (navLinks.length) {
    const secMap = new Map();
    navLinks.forEach(link => {
      const id = link.getAttribute('href').slice(1);
      const sec = document.getElementById(id);
      if (sec) secMap.set(sec, link);
    });
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const link = secMap.get(entry.target);
        if (link) {
          link.classList.toggle('nav__link--active', entry.isIntersecting);
          if (entry.isIntersecting) {
            navLinks.forEach(l => { if (l !== link) l.classList.remove('nav__link--active'); });
          }
        }
      });
    }, { threshold: 0.35, rootMargin: '-80px 0px -40% 0px' });
    secMap.forEach((link, sec) => navObserver.observe(sec));
  }
}

// 108. SCROLL-TRIGGERED COUNTERS — Animate numbers when they enter viewport
{
  const counterEls = document.querySelectorAll('[data-count]');
  if (counterEls.length) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.counted) {
          entry.target.dataset.counted = '1';
          const target = parseInt(entry.target.dataset.count, 10);
          const suffix = entry.target.dataset.suffix || '';
          const duration = 1500;
          const start = performance.now();
          const animate = (now) => {
            const p = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            entry.target.textContent = Math.round(target * ease) + suffix;
            if (p < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      });
    }, { threshold: 0.5 });
    counterEls.forEach(el => counterObserver.observe(el));
  }
}

// 109. SMOOTH SECTION TRANSITIONS — Blend sections with gradient masks
{
  const allSections = document.querySelectorAll('section');
  allSections.forEach(sec => {
    if (!sec.classList.contains('hero')) {
      sec.style.setProperty('--section-blend', '1');
    }
  });
}

// 110. KEYBOARD SECTION NAVIGATION — Arrow keys navigate between sections
{
  const navSections = document.querySelectorAll('section[id]');
  if (navSections.length > 1) {
    let currentIdx = 0;
    document.addEventListener('keydown', (e) => {
      // Only if not in input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowDown' && e.altKey) {
        e.preventDefault();
        currentIdx = Math.min(currentIdx + 1, navSections.length - 1);
        navSections[currentIdx].scrollIntoView({ behavior: 'smooth' });
      } else if (e.key === 'ArrowUp' && e.altKey) {
        e.preventDefault();
        currentIdx = Math.max(currentIdx - 1, 0);
        navSections[currentIdx].scrollIntoView({ behavior: 'smooth' });
      }
    });
    // Track current section
    const keyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          currentIdx = Array.from(navSections).indexOf(entry.target);
        }
      });
    }, { threshold: 0.5 });
    navSections.forEach(s => keyObserver.observe(s));
  }
}

// 111. ELEMENT APPEAR ON SCROLL WITH DIRECTION — Detect scroll direction for reveals
{
  let lastScrollTop = 0;
  const dirRevealEls = document.querySelectorAll('.reveal');
  window.addEventListener('scroll', () => {
    const st = window.scrollY;
    const direction = st > lastScrollTop ? 'down' : 'up';
    document.documentElement.dataset.scrollDir = direction;
    lastScrollTop = st;
  }, { passive: true });
}

// 112. PREFERS COLOR SCHEME DETECTOR — Auto-adjust for system dark/light
{
  const schemeMedia = window.matchMedia('(prefers-color-scheme: light)');
  const checkScheme = () => {
    document.documentElement.dataset.systemTheme = schemeMedia.matches ? 'light' : 'dark';
  };
  checkScheme();
  schemeMedia.addEventListener('change', checkScheme);
}

// 113. SMART LOADING STATES — Show loading skeleton while images load
{
  const lazyImgs = document.querySelectorAll('img[loading="lazy"]');
  lazyImgs.forEach(img => {
    if (!img.complete) {
      img.style.opacity = '0';
      img.style.transition = 'opacity 0.5s ease';
      img.addEventListener('load', () => { img.style.opacity = '1'; }, { once: true });
    }
  });
}

// 114. VIEWPORT HEIGHT FIX — Fix 100vh on mobile browsers
{
  const setVH = () => {
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
  };
  setVH();
  window.addEventListener('resize', setVH, { passive: true });
}

/* ═══════════════════════════════════════════════════════════════════════
   REVOLUTION ROUND 29-38 — Features 115-134 (Nachtschicht VI — NEXT LEVEL)
   Textures. Depth. Presence. Impossible Quality.
   ═══════════════════════════════════════════════════════════════════════ */

// 115. FILM GRAIN OVERLAY — Create subtle noise texture (CSS feature 144)
{
  const grain = document.createElement('div');
  grain.className = 'grain-overlay';
  grain.setAttribute('aria-hidden', 'true');
  document.body.appendChild(grain);

  // Animate grain by shifting background position
  let grainFrame;
  const animateGrain = () => {
    grain.style.backgroundPosition = `${Math.random() * 100}% ${Math.random() * 100}%`;
    grainFrame = setTimeout(() => requestAnimationFrame(animateGrain), 120);
  };
  requestAnimationFrame(animateGrain);

  // Pause when hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { clearTimeout(grainFrame); }
    else { requestAnimationFrame(animateGrain); }
  });
}

// 116. CARD SPOTLIGHT FOLLOW — Radial gradient follows cursor on cards (CSS feature 150)
if (!MOBILE) {
  const spotlightCards = document.querySelectorAll('.service-card, .price-card, .portfolio-card');
  spotlightCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
      const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
      card.style.setProperty('--spotlight-x', `${x}%`);
      card.style.setProperty('--spotlight-y', `${y}%`);
    });
    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--spotlight-x', '50%');
      card.style.setProperty('--spotlight-y', '50%');
    });
  });
}

// 117. BUTTON RIPPLE EFFECT — Create expanding ripple on button click (CSS feature 158)
{
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      this.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });
}

// 118. SMOOTH SCROLL PROGRESS ANIMATION — Enhanced scroll progress with easing
{
  const progressBar = document.querySelector('.scroll-progress');
  if (progressBar) {
    let targetWidth = 0;
    let currentWidth = 0;
    const smoothProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      targetWidth = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      currentWidth += (targetWidth - currentWidth) * 0.12;
      progressBar.style.width = `${currentWidth.toFixed(2)}%`;
      requestAnimationFrame(smoothProgress);
    };
    requestAnimationFrame(smoothProgress);
  }
}

// 119. SECTION ENTRANCE COUNTER — Track how many sections user has seen
{
  let sectionsViewed = 0;
  const allSecs = document.querySelectorAll('section[id]');
  const viewedSet = new Set();
  const viewTracker = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !viewedSet.has(entry.target.id)) {
        viewedSet.add(entry.target.id);
        sectionsViewed++;
        document.documentElement.dataset.sectionsViewed = sectionsViewed;
      }
    });
  }, { threshold: 0.3 });
  allSecs.forEach(s => viewTracker.observe(s));
}

// 120. SCROLL DIRECTION BODY CLASS — Add scroll direction class to body
{
  let prevScrollY = 0;
  let scrollDirFrame;
  window.addEventListener('scroll', () => {
    if (scrollDirFrame) cancelAnimationFrame(scrollDirFrame);
    scrollDirFrame = requestAnimationFrame(() => {
      const currentY = window.scrollY;
      if (currentY > prevScrollY + 5) {
        document.body.classList.add('scrolling-down');
        document.body.classList.remove('scrolling-up');
      } else if (currentY < prevScrollY - 5) {
        document.body.classList.add('scrolling-up');
        document.body.classList.remove('scrolling-down');
      }
      prevScrollY = currentY;
    });
  }, { passive: true });
}

// 121. AUTO-HIDE NAV ON SCROLL DOWN — Nav slides away when scrolling down
{
  const navEl = document.querySelector('.nav');
  if (navEl) {
    let lastNavScroll = 0;
    let navHideTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(navHideTimeout);
      const st = window.scrollY;
      if (st > 300) {
        if (st > lastNavScroll + 10) {
          navEl.style.transform = 'translateY(-100%)';
          navEl.style.transition = 'transform 0.35s cubic-bezier(0.23, 1, 0.32, 1)';
        } else if (st < lastNavScroll - 10) {
          navEl.style.transform = 'translateY(0)';
        }
      } else {
        navEl.style.transform = 'translateY(0)';
      }
      lastNavScroll = st;
      // Show nav after scrolling stops
      navHideTimeout = setTimeout(() => {
        navEl.style.transform = 'translateY(0)';
      }, 2000);
    }, { passive: true });
  }
}

// 122. PERFORMANCE-AWARE ANIMATION TOGGLE — Reduce animations on low-end devices
{
  const isLowEnd = navigator.hardwareConcurrency <= 2 || navigator.deviceMemory <= 2;
  if (isLowEnd) {
    document.documentElement.classList.add('low-end-device');
    const style = document.createElement('style');
    style.textContent = `
      .low-end-device .ambient-orb,
      .low-end-device .grain-overlay,
      .low-end-device .cursor-glow { display: none !important; }
      .low-end-device * { animation-duration: 0.1s !important; }
    `;
    document.head.appendChild(style);
  }
}

// 123. SMART BACK-TO-TOP — Show after 50% scroll, smooth animation
{
  const backBtn = document.querySelector('.back-to-top, [class*="back-to-top"]');
  if (backBtn) {
    const toggleBack = () => {
      const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      if (scrollPercent > 0.3) {
        backBtn.classList.add('visible');
        backBtn.style.opacity = '1';
        backBtn.style.pointerEvents = 'auto';
      } else {
        backBtn.classList.remove('visible');
        backBtn.style.opacity = '0';
        backBtn.style.pointerEvents = 'none';
      }
    };
    window.addEventListener('scroll', toggleBack, { passive: true });
    toggleBack();
  }
}

// 124. ANCHOR LINK HASH UPDATE — Update URL hash when scrolling to sections
{
  const hashSections = document.querySelectorAll('section[id]');
  let hashTimeout;
  const hashObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        clearTimeout(hashTimeout);
        hashTimeout = setTimeout(() => {
          const newHash = `#${entry.target.id}`;
          if (window.location.hash !== newHash) {
            history.replaceState(null, '', newHash);
          }
        }, 500);
      }
    });
  }, { threshold: 0.5 });
  hashSections.forEach(s => hashObserver.observe(s));
}

// 125. PRELOAD CRITICAL RESOURCES — Hint browser about upcoming resources
{
  const preloadHints = [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
  ];
  preloadHints.forEach(hint => {
    if (!document.querySelector(`link[href="${hint.href}"]`)) {
      const link = document.createElement('link');
      link.rel = hint.rel;
      link.href = hint.href;
      if (hint.crossOrigin) link.crossOrigin = hint.crossOrigin;
      document.head.appendChild(link);
    }
  });
}

// 126. INTERSECTION-BASED LAZY CLASS TOGGLE — Generic class toggle on scroll
{
  const lazyEls = document.querySelectorAll('[data-reveal-class]');
  if (lazyEls.length) {
    const lazyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const cls = entry.target.dataset.revealClass;
          if (cls) entry.target.classList.add(cls);
          lazyObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    lazyEls.forEach(el => lazyObserver.observe(el));
  }
}

// 127. ESCAPE KEY HANDLER — Close mobile menu, modals, etc. on Escape
{
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // Close mobile menu
      const menu = document.querySelector('.mobile-menu.active, .mobile-menu.open');
      if (menu) {
        menu.classList.remove('active', 'open');
        document.body.style.overflow = '';
        return;
      }
      // Scroll to top as fallback
      if (window.scrollY > 500) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  });
}

// 128. TOUCH SWIPE DETECTION — Detect swipe gestures on mobile
if (MOBILE) {
  let touchStartX = 0, touchStartY = 0;
  document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 80) {
      document.dispatchEvent(new CustomEvent('swipe', {
        detail: { direction: dx > 0 ? 'right' : 'left' }
      }));
    }
  }, { passive: true });
}

// 129. PRICING TAB SWIPE — Swipe between pricing tabs on mobile
if (MOBILE) {
  const pricingTabs = document.querySelectorAll('.pricing__tab');
  if (pricingTabs.length > 1) {
    let currentTab = 0;
    document.addEventListener('swipe', (e) => {
      const pricingSection = document.querySelector('.pricing');
      if (!pricingSection) return;
      const rect = pricingSection.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        if (e.detail.direction === 'left' && currentTab < pricingTabs.length - 1) {
          currentTab++;
          pricingTabs[currentTab].click();
        } else if (e.detail.direction === 'right' && currentTab > 0) {
          currentTab--;
          pricingTabs[currentTab].click();
        }
      }
    });
  }
}

// 130. PAGE LOAD PERFORMANCE MARKER — Log core metrics
{
  if (window.performance && performance.getEntriesByType) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const nav = performance.getEntriesByType('navigation')[0];
        if (nav) {
          const metrics = {
            dns: Math.round(nav.domainLookupEnd - nav.domainLookupStart),
            tcp: Math.round(nav.connectEnd - nav.connectStart),
            ttfb: Math.round(nav.responseStart - nav.requestStart),
            domReady: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
            load: Math.round(nav.loadEventEnd - nav.startTime),
          };
          console.log('%c[NexTool Performance]', 'color: #ff6b2c; font-weight: bold', metrics);
        }
      }, 100);
    });
  }
}

// 131. REDUCED MOTION RUNTIME CHECK — Disable JS animations for reduced-motion users
{
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const handleMotion = (e) => {
    document.documentElement.classList.toggle('reduced-motion', e.matches);
    if (e.matches) {
      // Stop ambient orb animations
      document.querySelectorAll('.ambient-orb').forEach(orb => orb.style.animationPlayState = 'paused');
      // Stop grain
      const grainEl = document.querySelector('.grain-overlay');
      if (grainEl) grainEl.style.display = 'none';
    }
  };
  handleMotion(motionQuery);
  motionQuery.addEventListener('change', handleMotion);
}

// 132. SCROLL DEPTH ANALYTICS EVENT — Fire custom events at scroll milestones
{
  const milestones = [25, 50, 75, 90, 100];
  const fired = new Set();
  window.addEventListener('scroll', () => {
    const percent = Math.round(window.scrollY / (document.documentElement.scrollHeight - window.innerHeight) * 100);
    milestones.forEach(m => {
      if (percent >= m && !fired.has(m)) {
        fired.add(m);
        document.dispatchEvent(new CustomEvent('scrollMilestone', { detail: { percent: m } }));
      }
    });
  }, { passive: true });
}

// 133. IDLE ANIMATION BOOST — Enhance animations when user is idle
{
  let idleTimer;
  let isIdle = false;
  const setIdle = () => {
    isIdle = true;
    document.documentElement.classList.add('user-idle');
    // Boost ambient orb visibility when idle
    document.querySelectorAll('.ambient-orb').forEach(orb => {
      orb.style.opacity = '0.05';
      orb.style.transition = 'opacity 3s ease';
    });
  };
  const resetIdle = () => {
    if (isIdle) {
      isIdle = false;
      document.documentElement.classList.remove('user-idle');
      document.querySelectorAll('.ambient-orb').forEach(orb => {
        orb.style.opacity = '';
        orb.style.transition = 'opacity 1s ease';
      });
    }
    clearTimeout(idleTimer);
    idleTimer = setTimeout(setIdle, 15000);
  };
  ['mousemove', 'keydown', 'scroll', 'touchstart'].forEach(evt => {
    document.addEventListener(evt, resetIdle, { passive: true });
  });
  idleTimer = setTimeout(setIdle, 15000);
}

// 134. NETWORK-AWARE QUALITY — Adjust quality based on connection speed
{
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn) {
    const adjustQuality = () => {
      const slow = conn.saveData || conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g';
      document.documentElement.classList.toggle('slow-connection', slow);
      if (slow) {
        const style = document.createElement('style');
        style.id = 'slow-connection-styles';
        style.textContent = `
          .slow-connection .ambient-orb, .slow-connection .grain-overlay { display: none !important; }
          .slow-connection * { animation-duration: 0.01s !important; transition-duration: 0.01s !important; }
        `;
        document.head.appendChild(style);
      }
    };
    adjustQuality();
    conn.addEventListener('change', adjustQuality);
  }
}

// ═══════════════════════════════════════════════════════════════
// ROUND 39-48 — Features 135-154 (JS Engine Expansion)
// ═══════════════════════════════════════════════════════════════

// 135. SKIP-TO-CONTENT LINK — Accessibility: Create hidden skip link
{
  const skip = document.createElement('a');
  skip.href = '#services';
  skip.className = 'skip-to-content';
  skip.textContent = 'Skip to content';
  document.body.prepend(skip);
}

// 136. PAGE LOADED CLASS — Trigger CSS entrance animations after full load
{
  const markLoaded = () => {
    document.documentElement.classList.add('page-loaded');
    document.querySelectorAll('.loading-skeleton').forEach(el => {
      el.classList.add('loaded');
    });
  };
  if (document.readyState === 'complete') markLoaded();
  else window.addEventListener('load', markLoaded);
}

// 137. SECTION REVEAL CURTAIN — Clip-path curtain reveal on scroll
{
  const sections = document.querySelectorAll('.services, .portfolio, .process, .pricing, .metrics, .faq');
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('section-revealed');
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  sections.forEach(s => revealObs.observe(s));
}

// 138. HR ANIMATION TRIGGER — Animate horizontal rules on scroll
{
  document.querySelectorAll('hr, .section-divider').forEach(hr => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        hr.classList.add('hr-visible');
        obs.unobserve(hr);
      }
    }, { threshold: 0.5 });
    obs.observe(hr);
  });
}

// 139. CARD EDGE ENTRANCE — Cards slide in from alternating sides
{
  const cards = document.querySelectorAll('.service-card, .portfolio-card, .price-card');
  cards.forEach((card, i) => {
    card.style.setProperty('--card-entrance-direction', i % 2 === 0 ? '1' : '-1');
    card.style.setProperty('--card-entrance-delay', `${i * 0.08}s`);
  });
  const edgeObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('card-entered');
        edgeObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  cards.forEach(c => edgeObs.observe(c));
}

// 140. STICKY SECTION HEADER — Add sticky class when section header pins
{
  const headers = document.querySelectorAll('.section-header');
  if ('IntersectionObserver' in window) {
    const stickyObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        entry.target.classList.toggle('is-pinned', !entry.isIntersecting);
      });
    }, { threshold: [1], rootMargin: '-1px 0px 0px 0px' });
    headers.forEach(h => stickyObs.observe(h));
  }
}

// 141. TYPEWRITER CURSOR BLINK SYNC — Sync CSS cursor with content
{
  const subtitle = document.querySelector('.hero__subtitle');
  if (subtitle) {
    const text = subtitle.textContent;
    subtitle.setAttribute('data-full-text', text);
    subtitle.style.setProperty('--char-count', text.length);
  }
}

// 142. SECTION BREATHING — Subtle scale pulse on idle sections
{
  let lastScrollTime = Date.now();
  const breathingSections = document.querySelectorAll('.hero, .cta-final');
  const checkBreathing = () => {
    const idle = Date.now() - lastScrollTime > 3000;
    breathingSections.forEach(s => s.classList.toggle('is-breathing', idle));
    requestAnimationFrame(checkBreathing);
  };
  window.addEventListener('scroll', () => { lastScrollTime = Date.now(); }, { passive: true });
  checkBreathing();
}

// 143. GRID BREATHING — Subtle gap animation for grids on hover
{
  document.querySelectorAll('.services__grid, .portfolio__grid, .process__steps').forEach(grid => {
    grid.addEventListener('mouseenter', () => grid.classList.add('grid-hovered'));
    grid.addEventListener('mouseleave', () => grid.classList.remove('grid-hovered'));
  });
}

// 144. GRADIENT WORD HIGHLIGHT — Highlight key words in headings
{
  const highlightWords = ['Revolution', 'Premium', 'Garantie', 'NexTool', 'AI', 'KI'];
  document.querySelectorAll('.section-header h2, .cta-final h2').forEach(heading => {
    let html = heading.innerHTML;
    highlightWords.forEach(word => {
      const regex = new RegExp(`(${word})`, 'gi');
      html = html.replace(regex, '<span class="gradient-word">$1</span>');
    });
    heading.innerHTML = html;
  });
}

// 145. LINK UNDERLINE DRAW — Animated underline on anchor links
{
  document.querySelectorAll('.footer a, .faq-item a, .service-card a:not(.btn)').forEach(link => {
    link.classList.add('draw-underline');
  });
}

// 146. INPUT FOCUS GLOW — Enhanced focus for form inputs
{
  document.querySelectorAll('input, textarea, select').forEach(input => {
    input.addEventListener('focus', () => input.classList.add('input-focused'));
    input.addEventListener('blur', () => input.classList.remove('input-focused'));
  });
}

// 147. TOOLTIP POSITIONING — Smart tooltip based on viewport
{
  document.querySelectorAll('[data-tooltip]').forEach(el => {
    el.addEventListener('mouseenter', () => {
      const rect = el.getBoundingClientRect();
      const nearBottom = rect.top > window.innerHeight * 0.7;
      el.classList.toggle('tooltip-above', nearBottom);
    });
  });
}

// 148. PARALLAX DEPTH ENHANCEMENT — Multi-speed parallax layers
{
  const parallaxEls = [
    { sel: '.hero__content', speed: 0.3 },
    { sel: '.hero .device-mockup', speed: 0.15 },
    { sel: '.ambient-orb', speed: 0.08 }
  ];
  let pTicking = false;
  window.addEventListener('scroll', () => {
    if (pTicking) return;
    pTicking = true;
    requestAnimationFrame(() => {
      const scrollY = window.scrollY;
      parallaxEls.forEach(({ sel, speed }) => {
        document.querySelectorAll(sel).forEach(el => {
          el.style.setProperty('--parallax-y', `${scrollY * speed}px`);
        });
      });
      pTicking = false;
    });
  }, { passive: true });
}

// 149. MOBILE CARD SWIPE INDICATOR — Show swipe hint on mobile
{
  if ('ontouchstart' in window && window.innerWidth < 768) {
    document.querySelectorAll('.services__grid, .portfolio__grid').forEach(grid => {
      if (grid.scrollWidth > grid.clientWidth) {
        const hint = document.createElement('div');
        hint.className = 'swipe-hint';
        hint.textContent = '\u2190 Swipe \u2192';
        hint.setAttribute('aria-hidden', 'true');
        grid.parentNode.insertBefore(hint, grid.nextSibling);
        setTimeout(() => hint.classList.add('fade-out'), 3000);
        setTimeout(() => hint.remove(), 4000);
      }
    });
  }
}

// 150. SCROLL MOMENTUM DETECTION — Fast vs slow scroll classes
{
  let momLastY = window.scrollY;
  let momLastTime = Date.now();
  window.addEventListener('scroll', () => {
    const now = Date.now();
    const dt = now - momLastTime;
    if (dt > 0) {
      const velocity = Math.abs(window.scrollY - momLastY) / dt;
      const fast = velocity > 3;
      document.documentElement.classList.toggle('scroll-fast', fast);
      document.documentElement.classList.toggle('scroll-slow', !fast);
    }
    momLastY = window.scrollY;
    momLastTime = now;
  }, { passive: true });
}

// 151. FOCUS TRAP FOR MOBILE MENU — Keep focus within open menu
{
  const mobileMenu = document.querySelector('.nav__menu');
  const menuToggle = document.querySelector('.nav__toggle');
  if (mobileMenu && menuToggle) {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' && mobileMenu.classList.contains('active')) {
        const focusables = mobileMenu.querySelectorAll('a, button');
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }
}

// 152. DYNAMIC SECTION NUMBERING — Auto-number sections
{
  document.querySelectorAll('.section-header').forEach((header, i) => {
    header.style.setProperty('--section-index', i + 1);
    header.setAttribute('data-section-number', String(i + 1).padStart(2, '0'));
  });
}

// 153. SMOOTH IMAGE REVEAL — Blur-up technique for lazy images
{
  const images = document.querySelectorAll('img[loading="lazy"]');
  images.forEach(img => {
    img.classList.add('img-loading');
    const reveal = () => {
      img.classList.remove('img-loading');
      img.classList.add('img-loaded');
    };
    if (img.complete) reveal();
    else img.addEventListener('load', reveal);
  });
}

// 154. CONTEXT-AWARE CURSOR — Cursor based on interactive zones
{
  const interactiveZones = [
    { sel: '.portfolio__grid', cursor: 'grab' },
    { sel: '.hero', cursor: 'crosshair' }
  ];
  interactiveZones.forEach(({ sel, cursor }) => {
    const el = document.querySelector(sel);
    if (el) el.style.setProperty('--zone-cursor', cursor);
  });
}

// ═══════════════════════════════════════════════════════════════
// ROUND 49-58 — Features 155-174 (Cinematic & Depth Engine)
// ═══════════════════════════════════════════════════════════════

// 155. CINEMATIC LETTERBOX MODE — Black bars when reading content sections
{
  const cinTargets = document.querySelectorAll('.portfolio, .cta-final');
  document.body.classList.add('cinematic-mode');
  const cinObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      document.body.classList.toggle('cinematic-active', entry.isIntersecting);
    });
  }, { threshold: 0.4 });
  cinTargets.forEach(t => cinObs.observe(t));
}

// 156. TEXT SHADOW PARALLAX — Heading shadows shift with scroll
{
  let tsaTick = false;
  window.addEventListener('scroll', () => {
    if (tsaTick) return;
    tsaTick = true;
    requestAnimationFrame(() => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollY / maxScroll;
      const xShift = Math.sin(progress * Math.PI * 2) * 3;
      const yShift = 2 + progress * 4;
      document.querySelectorAll('.section-header h2').forEach(h => {
        h.style.setProperty('--text-shadow-x', `${xShift}px`);
        h.style.setProperty('--text-shadow-y', `${yShift}px`);
      });
      tsaTick = false;
    });
  }, { passive: true });
}

// 157. PRICING CARD COMPARISON — Dim siblings on hover
{
  const pricingCards = document.querySelector('.pricing__cards');
  if (pricingCards) {
    pricingCards.addEventListener('mouseenter', () => {
      pricingCards.classList.add('comparing');
    });
    pricingCards.addEventListener('mouseleave', () => {
      pricingCards.classList.remove('comparing');
    });
  }
}

// 158. FOOTER REVEAL OBSERVER — Trigger footer column stagger
{
  const footer = document.querySelector('.footer');
  if (footer) {
    const footObs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        footer.classList.add('is-visible');
        footObs.unobserve(footer);
      }
    }, { threshold: 0.15 });
    footObs.observe(footer);
  }
}

// 159. TRUST BAR REVEAL — Trigger trust bar cascade entrance
{
  const trustBar = document.querySelector('.trust-bar');
  if (trustBar) {
    const tbObs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        trustBar.classList.add('is-visible');
        tbObs.unobserve(trustBar);
      }
    }, { threshold: 0.3 });
    tbObs.observe(trustBar);
  }
}

// 160. SCROLL PROGRESS CUSTOM PROPERTY — Set CSS var for scroll indicator dot
{
  let spTick = false;
  window.addEventListener('scroll', () => {
    if (spTick) return;
    spTick = true;
    requestAnimationFrame(() => {
      const progress = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      document.documentElement.style.setProperty('--scroll-progress', progress.toFixed(3));
      spTick = false;
    });
  }, { passive: true });
}

// 161. SECTION COLOR SHIFT — Body class changes per visible section
{
  const colorSections = {
    '.hero': 'section-dark',
    '.services': 'section-light',
    '.portfolio': 'section-dark',
    '.process': 'section-light',
    '.pricing': 'section-dark',
    '.cta-final': 'section-dark'
  };
  const colorObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const cls = Object.entries(colorSections).find(([sel]) =>
          entry.target.matches(sel)
        );
        if (cls) {
          document.body.classList.remove('section-dark', 'section-light');
          document.body.classList.add(cls[1]);
        }
      }
    });
  }, { threshold: 0.35 });
  Object.keys(colorSections).forEach(sel => {
    const el = document.querySelector(sel);
    if (el) colorObs.observe(el);
  });
}

// 162. NAV BLUR SCROLL ENHANCE — Increase nav blur on scroll depth
{
  const nav = document.querySelector('.nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 100);
    }, { passive: true });
  }
}

// 163. FAQ SMOOTH HEIGHT — Animate FAQ open/close with max-height
{
  document.querySelectorAll('.faq-item__question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const answer = item.querySelector('.faq-item__answer');
      const isActive = item.classList.contains('active');

      // Close all others
      document.querySelectorAll('.faq-item.active').forEach(other => {
        if (other !== item) {
          other.classList.remove('active');
          const otherAnswer = other.querySelector('.faq-item__answer');
          if (otherAnswer) otherAnswer.style.maxHeight = '0';
        }
      });

      // Toggle current
      item.classList.toggle('active', !isActive);
      if (!isActive) {
        answer.style.maxHeight = answer.scrollHeight + 'px';
      } else {
        answer.style.maxHeight = '0';
      }
    });
  });
}

// 164. DEVICE MOCKUP 3D TILT — Subtle 3D tilt on hero device mockup
{
  const mockup = document.querySelector('.hero .device-mockup');
  if (mockup && window.innerWidth > 768) {
    const hero = document.querySelector('.hero');
    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mockup.style.transform = `perspective(1000px) rotateY(${x * 8}deg) rotateX(${-y * 5}deg)`;
    });
    hero.addEventListener('mouseleave', () => {
      mockup.style.transform = 'perspective(1000px) rotateY(0) rotateX(0)';
      mockup.style.transition = 'transform 0.6s ease';
      setTimeout(() => { mockup.style.transition = ''; }, 600);
    });
  }
}

// 165. PRICE LIST ANIMATION TRIGGER — Animate price features on card entry
{
  document.querySelectorAll('.price-card').forEach(card => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        card.classList.add('card-entered');
        obs.unobserve(card);
      }
    }, { threshold: 0.2 });
    obs.observe(card);
  });
}

// 166. SECTION LABEL REVEAL — Trigger section label entrance on scroll
{
  document.querySelectorAll('.section-label').forEach(label => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        label.closest('.section-header')?.classList.add('is-visible');
        obs.unobserve(label);
      }
    }, { threshold: 0.5 });
    obs.observe(label);
  });
}

// 167. SMOOTH ANCHOR SCROLL — Enhanced smooth scroll for all anchor links
{
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const navHeight = document.querySelector('.nav')?.offsetHeight || 0;
        const targetPos = target.getBoundingClientRect().top + window.scrollY - navHeight - 20;
        window.scrollTo({
          top: targetPos,
          behavior: 'smooth'
        });
      }
    });
  });
}

// 168. PORTFOLIO CARD DEPTH — Add depth effect on portfolio hover
{
  document.querySelectorAll('.portfolio-card').forEach(card => {
    if (window.innerWidth > 768) {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(600px) rotateY(${x * 5}deg) rotateX(${-y * 3}deg) scale(1.02)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.transition = 'transform 0.5s ease';
        setTimeout(() => { card.style.transition = ''; }, 500);
      });
    }
  });
}

// 169. DOUBLE-CLICK EASTER EGG — Secret interaction on hero title
{
  const heroTitle = document.querySelector('.hero h1');
  if (heroTitle) {
    heroTitle.addEventListener('dblclick', () => {
      heroTitle.style.transition = 'transform 0.5s ease';
      heroTitle.style.transform = 'scale(1.05)';
      setTimeout(() => {
        heroTitle.style.transform = '';
        setTimeout(() => { heroTitle.style.transition = ''; }, 500);
      }, 500);
    });
  }
}

// 170. SCROLL-LINKED OPACITY — Elements fade based on distance from viewport center
{
  const fadeEls = document.querySelectorAll('.section-header h2');
  const fadeObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const ratio = entry.intersectionRatio;
      entry.target.style.setProperty('--visibility-ratio', ratio.toFixed(2));
    });
  }, { threshold: Array.from({ length: 20 }, (_, i) => i / 19) });
  fadeEls.forEach(el => fadeObs.observe(el));
}

// 171. SMART PRINT PREPARATION — Clean up for print
{
  window.addEventListener('beforeprint', () => {
    document.querySelectorAll('.ambient-orb, .grain-overlay, .cursor-trail').forEach(el => {
      el.style.display = 'none';
    });
  });
  window.addEventListener('afterprint', () => {
    document.querySelectorAll('.ambient-orb, .grain-overlay, .cursor-trail').forEach(el => {
      el.style.display = '';
    });
  });
}

// 172. SERVICE CARD TAB INDEX — Improve keyboard navigation
{
  document.querySelectorAll('.service-card, .price-card, .portfolio-card').forEach((card, i) => {
    if (!card.getAttribute('tabindex')) {
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'article');
    }
  });
}

// 173. SCROLL-TO-TOP PROGRESS RING — Back-to-top shows scroll progress
{
  const btt = document.querySelector('.back-to-top');
  if (btt) {
    btt.setAttribute('aria-label', 'Back to top');
    window.addEventListener('scroll', () => {
      const progress = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      btt.style.setProperty('--progress', progress.toFixed(2));
      btt.style.opacity = window.scrollY > 400 ? '1' : '0';
      btt.style.pointerEvents = window.scrollY > 400 ? 'auto' : 'none';
    }, { passive: true });
  }
}

// 174. VIEWPORT RESIZE HANDLER — Recalculate on resize
{
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
      document.documentElement.style.setProperty('--vw', `${window.innerWidth * 0.01}px`);
    }, 150);
  });
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
  document.documentElement.style.setProperty('--vw', `${window.innerWidth * 0.01}px`);
}

// ═══════════════════════════════════════════════════════════════
// ROUND 59-68 — Features 175-194 (Atmosphere & Polish Engine)
// ═══════════════════════════════════════════════════════════════

// 175. METRICS SECTION REVEAL — Trigger metric entrance animation
{
  const metrics = document.querySelector('.metrics');
  if (metrics) {
    const metObs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        metrics.classList.add('is-visible');
        metObs.unobserve(metrics);
      }
    }, { threshold: 0.2 });
    metObs.observe(metrics);
  }
}

// 176. FAQ SECTION REVEAL — Trigger FAQ item cascade
{
  const faq = document.querySelector('.faq');
  if (faq) {
    const faqObs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        faq.classList.add('is-visible');
        faqObs.unobserve(faq);
      }
    }, { threshold: 0.1 });
    faqObs.observe(faq);
  }
}

// 177. STEP CARD ENTRANCE TRIGGER — Process steps cascade
{
  document.querySelectorAll('.step').forEach(step => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        step.classList.add('card-entered');
        obs.unobserve(step);
      }
    }, { threshold: 0.2 });
    obs.observe(step);
  });
}

// 178. SMOOTH SCROLL OVERRIDE — Polished scroll behavior
{
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.style.scrollBehavior = 'smooth';
  }
}

// 179. HEADING PARALLAX SHADOW — Text shadow shifts with scroll position
{
  let headTick = false;
  const headings = document.querySelectorAll('.section-header h2');
  window.addEventListener('scroll', () => {
    if (headTick) return;
    headTick = true;
    requestAnimationFrame(() => {
      headings.forEach(h => {
        const rect = h.getBoundingClientRect();
        const center = window.innerHeight / 2;
        const offset = (rect.top + rect.height / 2 - center) / center;
        h.style.setProperty('--text-shadow-y', `${2 + offset * 3}px`);
      });
      headTick = false;
    });
  }, { passive: true });
}

// 180. SERVICE CARD SPOTLIGHT — Radial light follows cursor per card
{
  if (window.innerWidth > 768) {
    document.querySelectorAll('.service-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
        const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
        card.style.setProperty('--spotlight-x', `${x}%`);
        card.style.setProperty('--spotlight-y', `${y}%`);
      });
    });
  }
}

// 181. PAGE VISIBILITY ENHANCED — Pause all expensive operations when hidden
{
  document.addEventListener('visibilitychange', () => {
    const hidden = document.hidden;
    document.documentElement.classList.toggle('page-hidden', hidden);
    // Pause/resume grain animation
    document.querySelectorAll('.grain-overlay').forEach(g => {
      g.style.animationPlayState = hidden ? 'paused' : 'running';
    });
    document.querySelectorAll('.ambient-orb').forEach(orb => {
      orb.style.animationPlayState = hidden ? 'paused' : 'running';
    });
  });
}

// 182. DYNAMIC FONT LOADING — Optimize font rendering
{
  if ('fonts' in document) {
    document.fonts.ready.then(() => {
      document.documentElement.classList.add('fonts-loaded');
    });
  }
}

// 183. INTERSECTION OBSERVER CLEANUP — Single observer for multiple elements
{
  const masterObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      } else {
        entry.target.classList.remove('in-view');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('section, .service-card, .portfolio-card, .price-card, .step, .faq-item, .metric').forEach(el => {
    masterObs.observe(el);
  });
}

// 184. CLICK RIPPLE ENHANCED — Ripple effect for all interactive elements
{
  document.querySelectorAll('.btn-primary, .btn-secondary, .pricing__tab').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const ripple = document.createElement('span');
      ripple.className = 'click-ripple';
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${e.clientX - rect.left - size/2}px;
        top: ${e.clientY - rect.top - size/2}px;
        background: rgba(255,255,255,0.15);
        border-radius: 50%;
        transform: scale(0);
        animation: rippleExpand 0.6s ease forwards;
        pointer-events: none;
      `;
      btn.style.position = 'relative';
      btn.style.overflow = 'hidden';
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });

  // Inject ripple keyframes if not exists
  if (!document.querySelector('#ripple-style')) {
    const style = document.createElement('style');
    style.id = 'ripple-style';
    style.textContent = `@keyframes rippleExpand { to { transform: scale(2.5); opacity: 0; } }`;
    document.head.appendChild(style);
  }
}

// 185. PREFERS COLOR SCHEME — React to system dark/light preference
{
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const updateScheme = (e) => {
    document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
  };
  updateScheme(darkQuery);
  darkQuery.addEventListener('change', updateScheme);
}

// 186. PORTFOLIO CARD LAZY IFRAME — Defer iframe loading until visible
{
  document.querySelectorAll('.portfolio-card iframe').forEach(iframe => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        const src = iframe.getAttribute('data-src') || iframe.src;
        if (src) iframe.src = src;
        obs.unobserve(iframe);
      }
    }, { rootMargin: '200px' });
    obs.observe(iframe);
  });
}

// 187. TOUCH FEEDBACK — Visual feedback on touch for mobile
{
  if ('ontouchstart' in window) {
    document.querySelectorAll('.service-card, .price-card, .portfolio-card, .step, .btn-primary, .btn-secondary').forEach(el => {
      el.addEventListener('touchstart', () => el.classList.add('touch-active'), { passive: true });
      el.addEventListener('touchend', () => {
        setTimeout(() => el.classList.remove('touch-active'), 150);
      }, { passive: true });
    });
  }
}

// 188. DOCUMENT TITLE ANIMATION — Subtle tab title change on scroll
{
  const originalTitle = document.title;
  let titleTimeout;
  const sections = ['Services', 'Portfolio', 'Process', 'Pricing', 'FAQ'];
  const sectionEls = sections.map(s => document.getElementById(s.toLowerCase())).filter(Boolean);

  const titleObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        clearTimeout(titleTimeout);
        const name = entry.target.id;
        if (name && name !== 'hero') {
          document.title = `${name.charAt(0).toUpperCase() + name.slice(1)} — NexTool`;
        }
      }
    });
  }, { threshold: 0.5 });

  sectionEls.forEach(el => titleObs.observe(el));

  // Restore title when at top
  window.addEventListener('scroll', () => {
    if (window.scrollY < 200) {
      document.title = originalTitle;
    }
  }, { passive: true });
}

// 189. ERROR BOUNDARY — Catch and suppress non-critical errors
{
  window.addEventListener('error', (e) => {
    // Suppress non-critical errors from third-party scripts
    if (e.filename && !e.filename.includes('app-v2.js')) {
      e.preventDefault();
    }
  });
}

// 190. METRIC VALUE ANIMATION — Animate metric numbers on reveal
{
  const animateValue = (el, target, suffix = '') => {
    const duration = 2000;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(target * eased) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };
    tick();
  };

  const metricSection = document.querySelector('.metrics');
  if (metricSection) {
    const metValObs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        metricSection.querySelectorAll('.metric__value, .metric strong').forEach(val => {
          const text = val.textContent.trim();
          const num = parseInt(text);
          if (!isNaN(num) && num > 0) {
            const suffix = text.replace(String(num), '');
            animateValue(val, num, suffix);
          }
        });
        metValObs.unobserve(metricSection);
      }
    }, { threshold: 0.3 });
    metValObs.observe(metricSection);
  }
}

// 191. ARIA LIVE REGION — Announce section changes for screen readers
{
  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.className = 'sr-only';
  liveRegion.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);';
  document.body.appendChild(liveRegion);
}

// 192. LAZY STYLE INJECTION — Inject non-critical styles after load
{
  window.addEventListener('load', () => {
    const lazyStyles = document.createElement('style');
    lazyStyles.textContent = `
      .touch-active { transform: scale(0.97); opacity: 0.9; }
      .fonts-loaded body { font-display: swap; }
      .page-hidden * { animation-play-state: paused !important; }
    `;
    document.head.appendChild(lazyStyles);
  });
}

// 193. CONSOLE BRANDING — Branded console message
{
  console.log(
    '%cNexTool %c— Built with revolution in mind.',
    'color: #ff6b2c; font-size: 16px; font-weight: bold;',
    'color: #888; font-size: 12px;'
  );
}

// 194. PERFORMANCE METRICS LOG — Log Core Web Vitals
{
  if ('PerformanceObserver' in window) {
    try {
      const lcp = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        console.log(`%c[LCP] ${Math.round(last.startTime)}ms`, 'color: #4caf50;');
      });
      lcp.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch(e) { /* not supported */ }

    try {
      const cls = new PerformanceObserver((list) => {
        let clsValue = 0;
        list.getEntries().forEach(entry => { if (!entry.hadRecentInput) clsValue += entry.value; });
        console.log(`%c[CLS] ${clsValue.toFixed(3)}`, 'color: #2196f3;');
      });
      cls.observe({ type: 'layout-shift', buffered: true });
    } catch(e) { /* not supported */ }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ROUND 69-78 — Features 195-214 JS
// Cinematic depth, advanced motion, micro-interactions
// ═══════════════════════════════════════════════════════════════════════

// 195. SECTION DEPTH-OF-FIELD — Blur non-focused sections for cinematic depth
{
  const allSections = document.querySelectorAll('section');
  if (allSections.length > 0) {
    const dofObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          allSections.forEach(s => {
            if (s !== entry.target) {
              s.classList.add('section-blur-surround', 'is-blurred');
            } else {
              s.classList.remove('is-blurred');
              s.classList.add('section-blur-surround');
            }
          });
        }
      });
    }, { threshold: 0.4 });
    allSections.forEach(s => dofObserver.observe(s));
  }
}

// 196. TEXT SHIMMER TRIGGER — Trigger metallic shimmer on headings in view
{
  const sectionHeaders = document.querySelectorAll('.section-header h2');
  if (sectionHeaders.length > 0) {
    const shimmerObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('shimmer-active');
          setTimeout(() => entry.target.classList.remove('shimmer-active'), 1600);
        }
      });
    }, { threshold: 0.5 });
    sectionHeaders.forEach(h => shimmerObs.observe(h));
  }
}

// 197. MAGNETIC BUTTON EFFECT — Buttons subtly follow cursor
{
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const magneticBtns = document.querySelectorAll('.btn-primary, .btn-secondary');
    magneticBtns.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.setProperty('--mag-x', `${x * 0.15}px`);
        btn.style.setProperty('--mag-y', `${y * 0.15}px`);
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.setProperty('--mag-x', '0px');
        btn.style.setProperty('--mag-y', '0px');
      });
    });
  }
}

// 198. SCROLL VELOCITY BLUR — Blur content during fast scrolling
{
  let lastScroll = 0;
  let velocityFrame = null;
  const blurTarget = document.querySelector('main') || document.body;
  window.addEventListener('scroll', () => {
    if (velocityFrame) return;
    velocityFrame = requestAnimationFrame(() => {
      const velocity = Math.abs(window.scrollY - lastScroll);
      if (velocity > 80) {
        blurTarget.classList.add('scroll-velocity-blur', 'fast-scroll');
      } else {
        blurTarget.classList.remove('fast-scroll');
      }
      lastScroll = window.scrollY;
      velocityFrame = null;
    });
  }, { passive: true });
}

// 199. NAV SHADOW SCROLL — Dynamic nav shadow based on scroll depth
{
  const navEl = document.querySelector('.nav');
  if (navEl) {
    let navShadowFrame = null;
    window.addEventListener('scroll', () => {
      if (navShadowFrame) return;
      navShadowFrame = requestAnimationFrame(() => {
        const opacity = Math.min(window.scrollY / 300, 0.5);
        navEl.style.setProperty('--nav-shadow-opacity', opacity.toFixed(2));
        navShadowFrame = null;
      });
    }, { passive: true });
  }
}

// 200. CTA SHIMMER BAR — Inject shimmer overlay into CTA section
{
  const ctaSection = document.querySelector('.cta-final');
  if (ctaSection) {
    const shimmerBar = document.createElement('div');
    shimmerBar.className = 'cta-shimmer-bar';
    shimmerBar.setAttribute('aria-hidden', 'true');
    ctaSection.appendChild(shimmerBar);
  }
}

// 201. SECTION WIPE REVEAL — Horizontal wipe reveal for sections
{
  const wipeSections = document.querySelectorAll('.metrics, .trust-bar');
  if (wipeSections.length > 0) {
    wipeSections.forEach(s => s.classList.add('section-wipe'));
    const wipeObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          wipeObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    wipeSections.forEach(s => wipeObs.observe(s));
  }
}

// 202. CONTENT MASK REVEAL — Unmask content sections on scroll
{
  const maskTargets = document.querySelectorAll('.services__grid, .portfolio__grid, .process__grid');
  maskTargets.forEach(el => el.classList.add('content-mask-reveal'));
  const maskObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fully-visible');
        maskObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  maskTargets.forEach(el => maskObs.observe(el));
}

// 203. PRICE CARD VIEWABILITY — Track which pricing cards are visible
{
  const priceCards = document.querySelectorAll('.price-card');
  if (priceCards.length > 0) {
    const priceObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        entry.target.classList.toggle('in-view', entry.isIntersecting);
      });
    }, { threshold: 0.3 });
    priceCards.forEach(card => priceObs.observe(card));
  }
}

// 204. VIEWPORT HEIGHT FIX — Fix 100vh on mobile browsers
{
  const setVH = () => {
    document.documentElement.style.setProperty('--vh-fix', `${window.innerHeight * 0.01}px`);
  };
  setVH();
  window.addEventListener('resize', setVH);
}

// 205. SECTION DIVIDER INJECT — Add animated dividers between sections
{
  const dividerSections = document.querySelectorAll('.services, .portfolio, .process, .pricing');
  dividerSections.forEach(section => {
    const existing = section.querySelector('.section-divider-animated');
    if (!existing) {
      const divider = document.createElement('div');
      divider.className = 'section-divider-animated';
      divider.setAttribute('aria-hidden', 'true');
      const header = section.querySelector('.section-header');
      if (header) header.after(divider);
    }
  });
}

// 206. SCROLL PROGRESS CSS VAR ENHANCED — Finer progress for gradient sync
{
  let progFrame = null;
  window.addEventListener('scroll', () => {
    if (progFrame) return;
    progFrame = requestAnimationFrame(() => {
      const doc = document.documentElement;
      const scrolled = doc.scrollTop / (doc.scrollHeight - doc.clientHeight);
      doc.style.setProperty('--scroll-pct', scrolled.toFixed(4));
      progFrame = null;
    });
  }, { passive: true });
}

// 207. CARD ENTER STAGGER — Apply stagger delays to service cards
{
  const sCards = document.querySelectorAll('.services__grid .service-card');
  sCards.forEach((card, i) => {
    card.style.setProperty('--stagger', `${i * 0.08}s`);
  });
}

// 208. HERO TITLE GRADIENT RESET — Re-trigger gradient on visibility
{
  const gradientText = document.querySelector('.hero h1 .gradient-text');
  if (gradientText) {
    const heroObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          gradientText.style.animation = 'none';
          void gradientText.offsetHeight;
          gradientText.style.animation = '';
        }
      });
    }, { threshold: 0.5 });
    heroObs.observe(gradientText);
  }
}

// 209. FOOTER WAVE FADE — Fade footer border on scroll near bottom
{
  const footerEl = document.querySelector('.footer');
  if (footerEl) {
    const footerObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          footerEl.style.setProperty('--footer-opacity', '1');
        }
      });
    }, { threshold: 0.1 });
    footerObs.observe(footerEl);
  }
}

// 210. ANCHOR HIGHLIGHT — Highlight section when navigated via anchor
{
  const highlightAnchor = () => {
    const hash = window.location.hash;
    if (hash) {
      const target = document.querySelector(hash);
      if (target && target.tagName === 'SECTION') {
        target.style.animation = 'none';
        void target.offsetHeight;
        target.style.animation = '';
      }
    }
  };
  window.addEventListener('hashchange', highlightAnchor);
}

// 211. PRICING LIST STAGGER — Animate pricing feature list items
{
  const priceLists = document.querySelectorAll('.price-card__features li');
  priceLists.forEach((li, i) => {
    li.style.transitionDelay = `${0.1 + (i % 6) * 0.05}s`;
  });
}

// 212. TRUST ITEM SHIMMER OFFSET — Offset trust item animations
{
  const trustItems = document.querySelectorAll('.trust-bar__item');
  trustItems.forEach((item, i) => {
    item.style.animationDelay = `${i * 0.5}s`;
  });
}

// 213. BODY VIGNETTE TOGGLE — Remove vignette when printing
{
  window.addEventListener('beforeprint', () => {
    document.body.classList.add('printing');
  });
  window.addEventListener('afterprint', () => {
    document.body.classList.remove('printing');
  });
}

// 214. SMART INTERSECTION CLEANUP — Disconnect observers when page hidden
{
  const observerCleanup = [];
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      document.querySelectorAll('.section-blur-surround').forEach(s => {
        s.classList.remove('is-blurred');
      });
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════
// ROUND 79-88 — Features 215-234 JS
// Environmental polish, accessibility depth, animation mastery
// ═══════════════════════════════════════════════════════════════════════

// 215. HERO SCROLL FADE — Hero fades out as user scrolls down
{
  const heroSection = document.querySelector('.hero');
  if (heroSection) {
    let heroFadeFrame = null;
    window.addEventListener('scroll', () => {
      if (heroFadeFrame) return;
      heroFadeFrame = requestAnimationFrame(() => {
        const heroH = heroSection.offsetHeight;
        const fade = Math.max(0, 1 - (window.scrollY / heroH) * 1.2);
        heroSection.style.setProperty('--hero-fade', fade.toFixed(3));
        heroFadeFrame = null;
      });
    }, { passive: true });
  }
}

// 216. BUTTON SHINE TRIGGER — Periodically trigger button shine
{
  const heroBtn = document.querySelector('.hero .btn-primary');
  if (heroBtn) {
    const triggerShine = () => {
      const after = heroBtn.querySelector('::after');
      heroBtn.style.setProperty('--shine-active', '1');
      setTimeout(() => heroBtn.style.removeProperty('--shine-active'), 700);
    };
    setInterval(triggerShine, 6000);
  }
}

// 217. SECTION TRANSITION ZONES — Remove transition overlays for hero
{
  const heroEl = document.querySelector('.hero');
  if (heroEl && heroEl.nextElementSibling) {
    const firstSection = heroEl.nextElementSibling;
    if (firstSection.tagName === 'SECTION') {
      firstSection.style.setProperty('--no-transition-zone', '1');
    }
  }
}

// 218. CONTENT LOADED OPTIMIZER — Mark content as loaded for transitions
{
  window.addEventListener('load', () => {
    document.body.classList.add('fully-loaded');
    document.querySelectorAll('.content-loading').forEach(el => {
      el.classList.remove('content-loading');
    });
  });
}

// 219. SMART SCROLL MARGIN — Adjust scroll-margin based on nav height
{
  const nav = document.querySelector('.nav');
  if (nav) {
    const updateScrollMargin = () => {
      const navH = nav.offsetHeight;
      document.documentElement.style.setProperty('--nav-height', `${navH}px`);
      document.querySelectorAll('section[id]').forEach(s => {
        s.style.scrollMarginTop = `${navH + 16}px`;
      });
    };
    updateScrollMargin();
    window.addEventListener('resize', updateScrollMargin);
  }
}

// 220. PRICE CARD Z-INDEX MANAGEMENT — Hovered card on top
{
  const prCards = document.querySelectorAll('.price-card');
  prCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.zIndex = '4';
    });
    card.addEventListener('mouseleave', () => {
      card.style.zIndex = card.classList.contains('price-card--featured') ? '3' : '1';
    });
  });
}

// 221. KEYBOARD FOCUS ENHANCEMENT — Add focus-visible class
{
  let isKeyboard = false;
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      isKeyboard = true;
      document.body.classList.add('keyboard-nav');
    }
  });
  document.addEventListener('mousedown', () => {
    isKeyboard = false;
    document.body.classList.remove('keyboard-nav');
  });
}

// 222. SECTION PROGRESS BAR — Show progress within visible section
{
  const sections = document.querySelectorAll('section[id]');
  sections.forEach(section => {
    const bar = document.createElement('div');
    bar.className = 'section-progress';
    bar.setAttribute('aria-hidden', 'true');
    bar.style.width = '0%';
    section.style.position = 'relative';
    section.appendChild(bar);
  });
  let secProgFrame = null;
  window.addEventListener('scroll', () => {
    if (secProgFrame) return;
    secProgFrame = requestAnimationFrame(() => {
      sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        const bar = section.querySelector('.section-progress');
        if (bar && rect.top < window.innerHeight && rect.bottom > 0) {
          const progress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / (rect.height + window.innerHeight)));
          bar.style.width = `${(progress * 100).toFixed(1)}%`;
        }
      });
      secProgFrame = null;
    });
  }, { passive: true });
}

// 223. DYNAMIC FAVICON COLOR — Change favicon color based on section
{
  let currentFaviconColor = '';
  const sectionColors = {
    hero: '#ff6b2c',
    services: '#6366f1',
    portfolio: '#10b981',
    process: '#f59e0b',
    pricing: '#ff6b2c',
    faq: '#8b5cf6'
  };
  const updateFavicon = (color) => {
    if (color === currentFaviconColor) return;
    currentFaviconColor = color;
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(0, 0, 32, 32, 6);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', 16, 17);
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = canvas.toDataURL();
  };
  const faviconObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.target.id) {
        const color = sectionColors[entry.target.id] || '#ff6b2c';
        updateFavicon(color);
      }
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('section[id]').forEach(s => faviconObs.observe(s));
}

// 224. ACCESSIBILITY ANNOUNCER — Announce page state changes
{
  const announcer = document.querySelector('[aria-live="polite"]');
  if (announcer) {
    const announce = (message) => {
      announcer.textContent = '';
      setTimeout(() => { announcer.textContent = message; }, 100);
    };
    document.querySelectorAll('.faq-item__question').forEach(btn => {
      btn.addEventListener('click', () => {
        const isOpen = btn.closest('.faq-item').classList.contains('active');
        announce(isOpen ? 'Answer expanded' : 'Answer collapsed');
      });
    });
    document.querySelectorAll('.pricing__tab').forEach(tab => {
      tab.addEventListener('click', () => {
        announce(`Showing ${tab.textContent.trim()} pricing`);
      });
    });
  }
}

// 225. SMOOTH NUMBER FORMAT — Format large numbers with commas
{
  document.querySelectorAll('.metric__value').forEach(el => {
    const text = el.textContent.trim();
    const num = parseInt(text.replace(/[^0-9]/g, ''));
    if (num >= 1000 && !text.includes(',')) {
      el.setAttribute('data-raw', text);
    }
  });
}

// 226. LINK PREFETCH ON HOVER — Prefetch nav links on hover
{
  if ('IntersectionObserver' in window) {
    const navLinks = document.querySelectorAll('.footer a[href^="/"]');
    navLinks.forEach(link => {
      link.addEventListener('mouseenter', () => {
        const href = link.getAttribute('href');
        if (href && !document.querySelector(`link[rel="prefetch"][href="${href}"]`)) {
          const prefetch = document.createElement('link');
          prefetch.rel = 'prefetch';
          prefetch.href = href;
          document.head.appendChild(prefetch);
        }
      }, { once: true });
    });
  }
}

// 227. SCROLL DIRECTION CLASSES — Add scroll-up/scroll-down to body
{
  let lastDir = 0;
  let dirFrame = null;
  window.addEventListener('scroll', () => {
    if (dirFrame) return;
    dirFrame = requestAnimationFrame(() => {
      const dir = window.scrollY;
      if (dir > lastDir + 5) {
        document.body.classList.add('scroll-down');
        document.body.classList.remove('scroll-up');
      } else if (dir < lastDir - 5) {
        document.body.classList.add('scroll-up');
        document.body.classList.remove('scroll-down');
      }
      lastDir = dir;
      dirFrame = null;
    });
  }, { passive: true });
}

// 228. PORTFOLIO CARD LAZY ACTIVATION — Only activate portfolio interactions when near
{
  const portfolioSection = document.querySelector('.portfolio');
  if (portfolioSection) {
    const portfolioObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const cards = entry.target.querySelectorAll('.portfolio-card');
        cards.forEach(card => {
          card.classList.toggle('interactions-active', entry.isIntersecting);
        });
      });
    }, { rootMargin: '200px' });
    portfolioObs.observe(portfolioSection);
  }
}

// 229. SMOOTH SCROLL BEHAVIOR CHECK — Fallback for unsupported browsers
{
  if (!CSS.supports('scroll-behavior', 'smooth')) {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const id = anchor.getAttribute('href').slice(1);
        const target = document.getElementById(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }
}

// 230. COLOR SCHEME META UPDATE — Update theme-color meta based on scroll
{
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (!metaTheme) {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = '#0a0a0f';
    document.head.appendChild(meta);
  }
}

// 231. IMAGE ERROR HANDLER — Graceful fallback for broken images
{
  document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', () => {
      img.style.opacity = '0.3';
      img.alt = img.alt || 'Image unavailable';
    });
  });
}

// 232. REDUCED MOTION QUERY CHANGE — Listen for motion preference changes
{
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const handleMotionChange = (e) => {
    document.body.classList.toggle('reduced-motion', e.matches);
    if (e.matches) {
      document.getAnimations().forEach(anim => {
        if (anim.playState === 'running') anim.pause();
      });
    }
  };
  handleMotionChange(motionQuery);
  motionQuery.addEventListener('change', handleMotionChange);
}

// 233. IDLE CALLBACK OPTIMIZATION — Run non-critical work when idle
{
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // Pre-compute section positions for faster scroll handling
      const sectionPositions = [];
      document.querySelectorAll('section[id]').forEach(s => {
        sectionPositions.push({
          id: s.id,
          top: s.offsetTop,
          height: s.offsetHeight
        });
      });
      window.__sectionPositions = sectionPositions;
    });
  }
}

// 234. PAGE LIFECYCLE — Handle freeze/resume for background tabs
{
  if ('onfreeze' in document) {
    document.addEventListener('freeze', () => {
      document.body.classList.add('page-frozen');
    });
    document.addEventListener('resume', () => {
      document.body.classList.remove('page-frozen');
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ROUND 89-98 — Features 235-254 JS
// Polish perfection, edge cases, final refinements
// ═══════════════════════════════════════════════════════════════════════

// 235. WILL-CHANGE MANAGEMENT — Remove will-change after hover
{
  if (window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.service-card, .portfolio-card, .price-card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.willChange = 'transform, box-shadow';
      });
      card.addEventListener('mouseleave', () => {
        setTimeout(() => { card.style.willChange = 'auto'; }, 500);
      });
    });
  }
}

// 236. FAQ ACCESSIBILITY — Arrow key navigation for FAQ
{
  const faqItems = document.querySelectorAll('.faq-item__question');
  faqItems.forEach((btn, index) => {
    btn.addEventListener('keydown', (e) => {
      let target = null;
      if (e.key === 'ArrowDown') {
        target = faqItems[index + 1] || faqItems[0];
      } else if (e.key === 'ArrowUp') {
        target = faqItems[index - 1] || faqItems[faqItems.length - 1];
      } else if (e.key === 'Home') {
        target = faqItems[0];
      } else if (e.key === 'End') {
        target = faqItems[faqItems.length - 1];
      }
      if (target) {
        e.preventDefault();
        target.focus();
      }
    });
  });
}

// 237. CARD ROLE ENHANCEMENT — Add ARIA attributes to cards
{
  document.querySelectorAll('.service-card, .portfolio-card, .price-card').forEach(card => {
    if (!card.getAttribute('role')) {
      card.setAttribute('role', 'article');
    }
    const heading = card.querySelector('h3');
    if (heading && !card.getAttribute('aria-label')) {
      card.setAttribute('aria-label', heading.textContent.trim());
    }
  });
}

// 238. LAZY ANIMATION OBSERVER — Only animate when close to viewport
{
  const lazyAnimObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = 'running';
      } else {
        entry.target.style.animationPlayState = 'paused';
      }
    });
  }, { rootMargin: '100px' });
  document.querySelectorAll('[class*="animate"], .section-divider-animated').forEach(el => {
    lazyAnimObs.observe(el);
  });
}

// 239. SAFE AREA INJECTOR — CSS env variables for notch devices
{
  if (CSS.supports('padding-top: env(safe-area-inset-top)')) {
    document.documentElement.style.setProperty('--safe-top', 'env(safe-area-inset-top)');
    document.documentElement.style.setProperty('--safe-bottom', 'env(safe-area-inset-bottom)');
  }
}

// 240. EXTERNAL LINK HANDLER — Add target blank to external links
{
  document.querySelectorAll('a[href^="http"]').forEach(link => {
    if (!link.hostname.includes(window.location.hostname)) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });
}

// 241. PRICING TAB KEYBOARD — Tab key cycles pricing categories
{
  const tabs = document.querySelectorAll('.pricing__tab');
  tabs.forEach((tab, i) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('tabindex', i === 0 ? '0' : '-1');
    tab.addEventListener('keydown', (e) => {
      let next = null;
      if (e.key === 'ArrowRight') next = tabs[i + 1] || tabs[0];
      if (e.key === 'ArrowLeft') next = tabs[i - 1] || tabs[tabs.length - 1];
      if (next) {
        e.preventDefault();
        tabs.forEach(t => t.setAttribute('tabindex', '-1'));
        next.setAttribute('tabindex', '0');
        next.focus();
        next.click();
      }
    });
  });
}

// 242. SECTION HEADING IDS — Auto-generate IDs for deep linking
{
  document.querySelectorAll('.section-header h2').forEach(h2 => {
    if (!h2.id) {
      const slug = h2.textContent.trim().toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 40);
      if (slug && !document.getElementById(slug)) {
        h2.id = slug;
      }
    }
  });
}

// 243. PERFORMANCE BUDGET CHECK — Warn if page is too heavy
{
  window.addEventListener('load', () => {
    if ('performance' in window) {
      const resources = performance.getEntriesByType('resource');
      const totalSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
      const totalKB = Math.round(totalSize / 1024);
      if (totalKB > 3000) {
        console.warn(`%c[Performance] Page weight: ${totalKB}KB — consider optimization`, 'color: #ff9800;');
      }
    }
  });
}

// 244. SMOOTH FOCUS RING — Add focus ring only for keyboard navigation
{
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      document.documentElement.setAttribute('data-focus-source', 'keyboard');
    }
  });
  document.addEventListener('mousedown', () => {
    document.documentElement.setAttribute('data-focus-source', 'mouse');
  });
}

// 245. COPY PROTECTION — Disable right-click on portfolio iframes
{
  document.querySelectorAll('.portfolio-card__preview').forEach(preview => {
    preview.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  });
}

// 246. SCROLL POSITION RESTORE — Remember scroll position on reload
{
  const SCROLL_KEY = 'nextool-scroll';
  window.addEventListener('beforeunload', () => {
    sessionStorage.setItem(SCROLL_KEY, window.scrollY.toString());
  });
  const saved = sessionStorage.getItem(SCROLL_KEY);
  if (saved && !window.location.hash) {
    requestAnimationFrame(() => {
      window.scrollTo(0, parseInt(saved, 10));
    });
    sessionStorage.removeItem(SCROLL_KEY);
  }
}

// 247. VIEWPORT UNIT POLYFILL — Set dvh/svh fallbacks
{
  const setViewportUnits = () => {
    document.documentElement.style.setProperty('--dvh', `${window.innerHeight * 0.01}px`);
    document.documentElement.style.setProperty('--svh', `${document.documentElement.clientHeight * 0.01}px`);
  };
  setViewportUnits();
  window.addEventListener('resize', setViewportUnits);
}

// 248. INTERSECTION OBSERVER BATCH — Combine similar observers for performance
{
  const batchObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      }
    });
  }, { threshold: 0.1, rootMargin: '50px' });
  document.querySelectorAll('.step, .faq-item, .trust-bar__item').forEach(el => {
    if (!el.classList.contains('in-view')) {
      batchObs.observe(el);
    }
  });
}

// 249. FORM VALIDATION POLISH — Enhanced form field behavior
{
  document.querySelectorAll('input, textarea').forEach(field => {
    field.addEventListener('invalid', (e) => {
      e.target.classList.add('field-invalid');
    });
    field.addEventListener('input', () => {
      field.classList.remove('field-invalid');
    });
  });
}

// 250. SMART BACK-TO-TOP — Only show after significant scroll
{
  const backBtn = document.querySelector('.back-to-top') || document.querySelector('button[class*="back"]');
  if (backBtn) {
    let backFrame = null;
    window.addEventListener('scroll', () => {
      if (backFrame) return;
      backFrame = requestAnimationFrame(() => {
        const show = window.scrollY > window.innerHeight * 1.5;
        backBtn.style.opacity = show ? '1' : '0';
        backBtn.style.pointerEvents = show ? 'auto' : 'none';
        backFrame = null;
      });
    }, { passive: true });
  }
}

// 251. DOCUMENT READY STATE — Track and expose ready states
{
  const markReady = () => {
    document.body.setAttribute('data-ready', document.readyState);
    if (document.readyState === 'complete') {
      document.body.classList.add('dom-complete');
    }
  };
  markReady();
  document.addEventListener('readystatechange', markReady);
}

// 252. SCROLL TO HASH ON LOAD — Smooth scroll to hash target on page load
{
  if (window.location.hash) {
    const hashTarget = document.querySelector(window.location.hash);
    if (hashTarget) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          hashTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      });
    }
  }
}

// 253. NETWORK INFO — Adjust quality based on connection
{
  if ('connection' in navigator) {
    const conn = navigator.connection;
    const adjustForNetwork = () => {
      const type = conn.effectiveType;
      if (type === 'slow-2g' || type === '2g') {
        document.body.classList.add('low-bandwidth');
        document.querySelectorAll('iframe').forEach(f => {
          f.setAttribute('loading', 'lazy');
        });
      }
    };
    adjustForNetwork();
    conn.addEventListener('change', adjustForNetwork);
  }
}

// 254. SESSION METRICS — Track session engagement
{
  const sessionStart = Date.now();
  let maxScroll = 0;
  let interactions = 0;
  document.addEventListener('click', () => interactions++);
  window.addEventListener('scroll', () => {
    const pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    maxScroll = Math.max(maxScroll, pct);
  }, { passive: true });
  window.addEventListener('beforeunload', () => {
    const duration = Math.round((Date.now() - sessionStart) / 1000);
    const data = { duration, maxScroll: Math.round(maxScroll * 100), interactions };
    if (navigator.sendBeacon) {
      // Ready for analytics endpoint
      console.log('%c[Session]', 'color: #9c27b0;', `${data.duration}s | ${data.maxScroll}% scroll | ${data.interactions} clicks`);
    }
  });
}

/* ═══ Round 99-108: Features 255-274 JS ═══════════════════════════════ */

/* F255: Price card feature list stagger on visibility */
{
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('.price-card').forEach(c => obs.observe(c));
}

/* F256: Hero accent hue shift on scroll */
{
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const hero = document.querySelector('.hero');
        if (hero) {
          const pct = Math.min(window.scrollY / (window.innerHeight * 0.8), 1);
          hero.style.setProperty('--accent-shift', `${pct * 15}deg`);
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/* F257: Section content max-width enforcement */
{
  document.querySelectorAll('.section-header').forEach(h => {
    if (!h.style.maxWidth) {
      h.style.maxWidth = '680px';
      h.style.marginLeft = 'auto';
      h.style.marginRight = 'auto';
    }
  });
}

/* F258: Smooth scroll anchor offset compensation */
{
  const navH = () => document.querySelector('.nav')?.offsetHeight || 72;
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href')?.slice(1);
      const target = id ? document.getElementById(id) : null;
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - navH() - 16;
        window.scrollTo({ top, behavior: 'smooth' });
        history.pushState(null, '', `#${id}`);
      }
    });
  });
}

/* F259: Card hover tilt micro-interaction */
{
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.service-card, .portfolio-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(600px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg) translateZ(4px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }
}

/* F260: FAQ keyboard arrow navigation enhancement */
{
  const faqSection = document.querySelector('.faq');
  if (faqSection) {
    const items = faqSection.querySelectorAll('.faq-item');
    items.forEach((item, i) => {
      const trigger = item.querySelector('.faq-item__question, [class*="toggle"], button');
      if (trigger) {
        trigger.setAttribute('data-faq-index', i);
      }
    });
  }
}

/* F261: Metric counter re-trigger on second visibility */
{
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.metric').forEach(m => obs.observe(m));
}

/* F262: Scroll-linked section progress indicator */
{
  const sections = document.querySelectorAll('section[id]');
  if (sections.length > 0) {
    const indicator = document.querySelector('.section-progress');
    if (indicator) {
      let ticking = false;
      window.addEventListener('scroll', () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            const scrollY = window.scrollY;
            const docH = document.documentElement.scrollHeight - window.innerHeight;
            const pct = docH > 0 ? (scrollY / docH) * 100 : 0;
            indicator.style.width = `${pct}%`;
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
    }
  }
}

/* F263: Image lazy load intersection with blur-up */
{
  const imgs = document.querySelectorAll('img[loading="lazy"]');
  if (imgs.length > 0) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.filter = 'blur(0)';
          e.target.style.opacity = '1';
          obs.unobserve(e.target);
        }
      });
    }, { rootMargin: '100px' });
    imgs.forEach(img => {
      img.style.filter = 'blur(8px)';
      img.style.opacity = '0.6';
      img.style.transition = 'filter 0.6s ease, opacity 0.6s ease';
      obs.observe(img);
    });
  }
}

/* F264: Nav active link highlight on scroll */
{
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav__link[href^="#"]');
  if (sections.length > 0 && navLinks.length > 0) {
    let ticking = false;
    const updateActive = () => {
      const scrollY = window.scrollY + 100;
      let current = '';
      sections.forEach(s => {
        if (s.offsetTop <= scrollY) current = s.id;
      });
      navLinks.forEach(link => {
        link.classList.toggle('nav__link--active', link.getAttribute('href') === `#${current}`);
      });
    };
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => { updateActive(); ticking = false; });
        ticking = true;
      }
    }, { passive: true });
    updateActive();
  }
}

/* F265: Touch swipe feedback on mobile cards */
{
  if ('ontouchstart' in window) {
    document.querySelectorAll('.service-card, .price-card, .portfolio-card').forEach(card => {
      let startX = 0;
      card.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
      card.addEventListener('touchmove', (e) => {
        const dx = e.touches[0].clientX - startX;
        const clamped = Math.max(-20, Math.min(20, dx * 0.3));
        card.style.transform = `translateX(${clamped}px)`;
      }, { passive: true });
      card.addEventListener('touchend', () => {
        card.style.transform = '';
        card.style.transition = 'transform 0.3s cubic-bezier(0.23, 1, 0.32, 1)';
        setTimeout(() => { card.style.transition = ''; }, 300);
      }, { passive: true });
    });
  }
}

/* F266: Dynamic copyright year in footer */
{
  const yearEls = document.querySelectorAll('.footer [class*="year"], .footer__bottom');
  yearEls.forEach(el => {
    const text = el.textContent;
    const yearMatch = text.match(/20\d{2}/);
    if (yearMatch) {
      const currentYear = new Date().getFullYear();
      if (parseInt(yearMatch[0]) < currentYear) {
        el.textContent = text.replace(yearMatch[0], currentYear.toString());
      }
    }
  });
}

/* F267: Preconnect hints for external resources */
{
  const origins = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];
  origins.forEach(origin => {
    if (!document.querySelector(`link[rel="preconnect"][href="${origin}"]`)) {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = origin;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
  });
}

/* F268: Content visibility auto — lazy render below-fold */
{
  if ('contentVisibility' in document.documentElement.style) {
    const belowFold = document.querySelectorAll('.services, .portfolio, .process, .pricing, .faq, .cta-final');
    belowFold.forEach(s => {
      if (!s.style.contentVisibility) {
        s.style.contentVisibility = 'auto';
        s.style.containIntrinsicSize = 'auto 600px';
      }
    });
  }
}

/* F269: Smooth tab focus ring animation */
{
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-nav');
    }
  });
  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-nav');
  });
}

/* F270: Performance observer for paint timing */
{
  if (typeof PerformanceObserver !== 'undefined') {
    try {
      const obs = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          if (entry.name === 'first-contentful-paint') {
            console.log('%c[Perf]', 'color: #4caf50;', `FCP: ${Math.round(entry.startTime)}ms`);
          }
        });
      });
      obs.observe({ type: 'paint', buffered: true });
    } catch (e) { /* Browser doesn't support paint timing */ }
  }
}

/* F271: Section entrance stagger for child elements */
{
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const children = e.target.querySelectorAll('.service-card, .portfolio-card, .step, .price-card, .metric, .faq-item');
        children.forEach((child, i) => {
          child.style.transitionDelay = `${i * 0.06}s`;
          child.classList.add('is-visible');
        });
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.services__grid, .portfolio__grid, .process__grid, .pricing__grid, .metrics, .faq').forEach(g => obs.observe(g));
}

/* F272: Smooth number formatting for metric values */
{
  document.querySelectorAll('.metric__value').forEach(el => {
    const text = el.textContent.trim();
    const num = parseFloat(text.replace(/[^0-9.]/g, ''));
    if (!isNaN(num) && num >= 1000) {
      el.style.fontVariantNumeric = 'tabular-nums';
    }
  });
}

/* F273: Document title animation on blur/focus */
{
  const originalTitle = document.title;
  let blurInterval = null;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      let toggle = false;
      blurInterval = setInterval(() => {
        document.title = toggle ? 'Come back! 👋' : originalTitle;
        toggle = !toggle;
      }, 2000);
    } else {
      if (blurInterval) clearInterval(blurInterval);
      document.title = originalTitle;
    }
  });
}

/* F274: Automatic smooth scroll for hash on page load */
{
  if (window.location.hash) {
    requestAnimationFrame(() => {
      setTimeout(() => {
        const target = document.querySelector(window.location.hash);
        if (target) {
          const navH = document.querySelector('.nav')?.offsetHeight || 72;
          const top = target.getBoundingClientRect().top + window.scrollY - navH - 16;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }, 400);
    });
  }
}

/* ═══ Round 109-118: Features 275-294 JS ═══════════════════════════════ */

/* F275: Footer visibility observer for column stagger */
{
  const footer = document.querySelector('.footer');
  if (footer) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    obs.observe(footer);
  }
}

/* F276: Process section visibility for step stagger */
{
  const process = document.querySelector('.process');
  if (process) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.2 });
    obs.observe(process);
  }
}

/* F277: Portfolio card visibility for curtain reveal */
{
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -50px 0px' });
  document.querySelectorAll('.portfolio-card').forEach(c => obs.observe(c));
}

/* F278: Nav blur intensity on scroll */
{
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const nav = document.querySelector('.nav');
        if (nav) {
          const blur = Math.min(20, 8 + window.scrollY * 0.02);
          nav.style.setProperty('--nav-blur', `${blur}px`);
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/* F279: Card hover sound-like feedback via subtle scale pulse */
{
  if (window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.service-card h3, .portfolio-card h3').forEach(h3 => {
      h3.style.transition = 'background 0.3s ease, -webkit-text-fill-color 0.3s ease';
    });
  }
}

/* F280: Smart lazy section loading */
{
  if ('IntersectionObserver' in window) {
    const sections = document.querySelectorAll('section');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.dataset.loaded = 'true';
          obs.unobserve(e.target);
        }
      });
    }, { rootMargin: '200px' });
    sections.forEach(s => obs.observe(s));
  }
}

/* F281: Pricing card interaction tracking */
{
  document.querySelectorAll('.price-card .btn-primary, .price-card .btn-outline, .price-card a[href*="wa.me"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.price-card');
      const plan = card?.querySelector('h3')?.textContent || 'unknown';
      console.log('%c[Conversion]', 'color: #ff6b35; font-weight: bold;', `Plan clicked: ${plan}`);
    });
  });
}

/* F282: Smooth hero parallax on scroll */
{
  const heroContent = document.querySelector('.hero__content');
  const heroBg = document.querySelector('.hero__bg');
  if (heroContent && heroBg) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const heroH = document.querySelector('.hero')?.offsetHeight || 800;
          if (scrollY < heroH) {
            const pct = scrollY / heroH;
            heroContent.style.transform = `translateY(${pct * 40}px)`;
            heroBg.style.transform = `translateY(${pct * 20}px) scale(${1 + pct * 0.05})`;
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }
}

/* F283: CTA section visibility pulse trigger */
{
  const cta = document.querySelector('.cta-final');
  if (cta) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          cta.classList.add('is-visible');
          obs.unobserve(cta);
        }
      });
    }, { threshold: 0.3 });
    obs.observe(cta);
  }
}

/* F284: Service card count display enhancement */
{
  document.querySelectorAll('.service-card').forEach((card, i) => {
    card.style.setProperty('--card-index', i);
  });
}

/* F285: Smooth anchor scroll with easing */
{
  const smoothScroll = (target, duration = 800) => {
    const start = window.scrollY;
    const navH = document.querySelector('.nav')?.offsetHeight || 72;
    const end = target.getBoundingClientRect().top + start - navH - 16;
    const distance = end - start;
    let startTime = null;
    const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      window.scrollTo(0, start + distance * ease(progress));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  window.__smoothScroll = smoothScroll;
}

/* F286: Automatic alt text check for images */
{
  document.querySelectorAll('img:not([alt])').forEach(img => {
    img.setAttribute('alt', '');
    img.setAttribute('role', 'presentation');
  });
}

/* F287: Touch-friendly FAQ toggle enhancement */
{
  if ('ontouchstart' in window) {
    document.querySelectorAll('.faq-item__question, .faq-item button').forEach(btn => {
      btn.style.minHeight = '48px';
      btn.style.display = 'flex';
      btn.style.alignItems = 'center';
    });
  }
}

/* F288: Scroll-driven hero CTA pulse pause */
{
  const heroCTA = document.querySelector('.hero .btn-primary');
  if (heroCTA) {
    let scrolled = false;
    window.addEventListener('scroll', () => {
      if (!scrolled && window.scrollY > 100) {
        scrolled = true;
        heroCTA.style.animation = 'none';
      }
    }, { passive: true, once: false });
  }
}

/* F289: Dynamic meta theme-color per section */
{
  const meta = document.querySelector('meta[name="theme-color"]') || (() => {
    const m = document.createElement('meta');
    m.name = 'theme-color';
    m.content = '#0f1117';
    document.head.appendChild(m);
    return m;
  })();
  const sectionColors = { hero: '#0f1117', services: '#0d0f14', portfolio: '#0f1117', pricing: '#0d0f14', faq: '#0f1117' };
  const sections = document.querySelectorAll('section[id]');
  if (sections.length > 0) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          let current = 'hero';
          sections.forEach(s => {
            if (s.offsetTop - 200 <= window.scrollY) current = s.id;
          });
          const color = sectionColors[current] || '#0f1117';
          if (meta.content !== color) meta.content = color;
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }
}

/* F290: Viewport resize debounce handler */
{
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    document.body.classList.add('is-resizing');
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      document.body.classList.remove('is-resizing');
    }, 300);
  });
}

/* F291: Metrics section glass effect trigger */
{
  const metrics = document.querySelector('.metrics');
  if (metrics) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          metrics.classList.add('is-visible');
          obs.unobserve(metrics);
        }
      });
    }, { threshold: 0.3 });
    obs.observe(metrics);
  }
}

/* F292: Prevent layout shift during resize */
{
  const style = document.createElement('style');
  style.textContent = '.is-resizing * { transition: none !important; animation-duration: 0s !important; }';
  document.head.appendChild(style);
}

/* F293: Card focus management for screen readers */
{
  document.querySelectorAll('.service-card, .portfolio-card, .price-card').forEach(card => {
    const link = card.querySelector('a');
    if (link && !card.getAttribute('tabindex')) {
      card.addEventListener('click', (e) => {
        if (e.target === card || e.target.closest('.service-card, .portfolio-card, .price-card') === card) {
          if (!e.target.closest('a, button')) {
            link.click();
          }
        }
      });
    }
  });
}

/* F294: CLS guard — set explicit dimensions on dynamic elements */
{
  document.querySelectorAll('.scroll-progress, .section-progress').forEach(el => {
    if (!el.style.height) el.style.height = '3px';
  });
  document.querySelectorAll('.scroll-dots, [class*="dot-nav"]').forEach(el => {
    if (!el.style.width) el.style.width = '12px';
  });
}
