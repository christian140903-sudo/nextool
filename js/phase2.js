/* ==========================================================================
   NexTool Revolution — Phase 2: Premium Animations

   GSAP ScrollTrigger + Lenis Smooth Scroll
   Progressive enhancement: If libs fail to load, Phase 1 CSS still works.
   ========================================================================== */

(function() {
  'use strict';

  // Guard: Only run if GSAP and Lenis are available
  if (typeof gsap === 'undefined' || typeof Lenis === 'undefined') {
    console.warn('[Phase 2] GSAP or Lenis not loaded. Falling back to Phase 1 CSS animations.');
    return;
  }

  // Respect reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  // Register GSAP plugins
  gsap.registerPlugin(ScrollTrigger);


  /* --------------------------------------------------------------------------
     LENIS SMOOTH SCROLL — Buttery 60fps scrolling
     -------------------------------------------------------------------------- */

  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
    touchMultiplier: 1.5,
  });

  // Connect Lenis to GSAP's ticker for perfect sync
  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  // Make Lenis available for anchor scrolling
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -80, duration: 1.4 });
    });
  });


  /* --------------------------------------------------------------------------
     DISABLE PHASE 1 CSS REVEALS — GSAP takes over
     -------------------------------------------------------------------------- */

  // Remove CSS transitions on [data-reveal] so GSAP controls them
  document.querySelectorAll('[data-reveal]').forEach(el => {
    el.style.transition = 'none';
  });

  // Also disable fade-in-group CSS transitions
  const fadeGroupStyle = document.createElement('style');
  fadeGroupStyle.textContent = `
    .fade-in-group > * { transition: none !important; }
  `;
  document.head.appendChild(fadeGroupStyle);


  /* --------------------------------------------------------------------------
     HERO — Parallax depth effect
     -------------------------------------------------------------------------- */

  const heroBg = document.querySelector('.hero__bg');
  if (heroBg) {
    gsap.to(heroBg, {
      yPercent: 30,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      }
    });
  }

  // Hero content fades out on scroll
  const heroContent = document.querySelector('.hero__content');
  if (heroContent) {
    gsap.to(heroContent, {
      opacity: 0,
      y: -60,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: '60% top',
        end: 'bottom top',
        scrub: true,
      }
    });
  }


  /* --------------------------------------------------------------------------
     SECTION REVEALS — GSAP-powered scroll reveals
     -------------------------------------------------------------------------- */

  // Section headers: overline + headline + description
  document.querySelectorAll('.demo-section__header, .how-section__header, .categories-section__header, .proof-section__header, .pricing-section__header, .faq-section__header').forEach(header => {
    const children = header.children;

    gsap.fromTo(children, {
      opacity: 0,
      y: 40,
      filter: 'blur(4px)',
    }, {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: header,
        start: 'top 85%',
        toggleActions: 'play none none none',
      }
    });
  });

  // Final CTA section
  const finalCtaContent = document.querySelector('.final-cta__content');
  if (finalCtaContent) {
    gsap.fromTo(finalCtaContent.children, {
      opacity: 0,
      y: 50,
      filter: 'blur(6px)',
    }, {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      duration: 0.9,
      stagger: 0.12,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: finalCtaContent,
        start: 'top 80%',
        toggleActions: 'play none none none',
      }
    });
  }


  /* --------------------------------------------------------------------------
     COMPARISON SECTION — Panels slide in from sides
     -------------------------------------------------------------------------- */

  const beforePanel = document.querySelector('.demo-transform__before');
  const afterPanel = document.querySelector('.demo-transform__after');
  const demoArrow = document.querySelector('.demo-transform__arrow');

  if (beforePanel && afterPanel) {
    gsap.fromTo(beforePanel, {
      opacity: 0,
      x: -60,
    }, {
      opacity: 1,
      x: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.demo-transform',
        start: 'top 75%',
        toggleActions: 'play none none none',
      }
    });

    gsap.fromTo(afterPanel, {
      opacity: 0,
      x: 60,
    }, {
      opacity: 1,
      x: 0,
      duration: 0.8,
      ease: 'power3.out',
      delay: 0.2,
      scrollTrigger: {
        trigger: '.demo-transform',
        start: 'top 75%',
        toggleActions: 'play none none none',
      }
    });

    if (demoArrow) {
      gsap.fromTo(demoArrow, {
        opacity: 0,
        scale: 0.5,
      }, {
        opacity: 1,
        scale: 1,
        duration: 0.5,
        ease: 'back.out(2)',
        delay: 0.4,
        scrollTrigger: {
          trigger: '.demo-transform',
          start: 'top 75%',
          toggleActions: 'play none none none',
        }
      });
    }
  }


  /* --------------------------------------------------------------------------
     HOW IT WORKS — Steps stagger in with connectors
     -------------------------------------------------------------------------- */

  const howSteps = document.querySelectorAll('.how-step');
  if (howSteps.length) {
    gsap.fromTo(howSteps, {
      opacity: 0,
      y: 50,
      scale: 0.9,
    }, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.7,
      stagger: 0.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.how-steps',
        start: 'top 80%',
        toggleActions: 'play none none none',
      }
    });
  }


  /* --------------------------------------------------------------------------
     CATEGORY CARDS — Staggered grid reveal
     -------------------------------------------------------------------------- */

  const categoryCards = document.querySelectorAll('.category-card');
  if (categoryCards.length) {
    gsap.fromTo(categoryCards, {
      opacity: 0,
      y: 30,
      scale: 0.95,
    }, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.5,
      stagger: {
        amount: 0.8,
        grid: 'auto',
        from: 'start',
      },
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.categories-grid',
        start: 'top 80%',
        toggleActions: 'play none none none',
      }
    });
  }


  /* --------------------------------------------------------------------------
     STATS — Numbers scale up with spring
     -------------------------------------------------------------------------- */

  const statItems = document.querySelectorAll('.stat');
  if (statItems.length) {
    gsap.fromTo(statItems, {
      opacity: 0,
      scale: 0.7,
      y: 20,
    }, {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.12,
      ease: 'back.out(1.7)',
      scrollTrigger: {
        trigger: '.proof-stats',
        start: 'top 80%',
        toggleActions: 'play none none none',
      }
    });
  }

  // Model badges
  const modelBadges = document.querySelectorAll('.proof-model');
  if (modelBadges.length) {
    gsap.fromTo(modelBadges, {
      opacity: 0,
      y: 20,
    }, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      stagger: 0.1,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.proof-models',
        start: 'top 85%',
        toggleActions: 'play none none none',
      }
    });
  }


  /* --------------------------------------------------------------------------
     PRICING CARDS — Scale in with popular card emphasized
     -------------------------------------------------------------------------- */

  const pricingCards = document.querySelectorAll('.pricing-card');
  if (pricingCards.length) {
    gsap.fromTo(pricingCards, {
      opacity: 0,
      y: 40,
      scale: 0.92,
    }, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.7,
      stagger: 0.15,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.pricing-grid',
        start: 'top 80%',
        toggleActions: 'play none none none',
      }
    });
  }


  /* --------------------------------------------------------------------------
     FAQ ITEMS — Cascade reveal
     -------------------------------------------------------------------------- */

  const faqItems = document.querySelectorAll('.faq-item');
  if (faqItems.length) {
    gsap.fromTo(faqItems, {
      opacity: 0,
      x: -20,
    }, {
      opacity: 1,
      x: 0,
      duration: 0.5,
      stagger: 0.1,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.faq-list',
        start: 'top 80%',
        toggleActions: 'play none none none',
      }
    });
  }


  /* --------------------------------------------------------------------------
     SECTION SEPARATORS — Fade in
     -------------------------------------------------------------------------- */

  document.querySelectorAll('.section-separator').forEach(sep => {
    gsap.fromTo(sep, {
      scaleX: 0,
    }, {
      scaleX: 1,
      duration: 1.2,
      ease: 'power2.inOut',
      scrollTrigger: {
        trigger: sep,
        start: 'top 90%',
        toggleActions: 'play none none none',
      }
    });
  });


  /* --------------------------------------------------------------------------
     FINAL CTA — Glow pulse on scroll proximity
     -------------------------------------------------------------------------- */

  const finalCtaBg = document.querySelector('.final-cta__bg');
  if (finalCtaBg) {
    gsap.fromTo(finalCtaBg, {
      opacity: 0,
      scale: 0.8,
    }, {
      opacity: 1,
      scale: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: '.final-cta',
        start: 'top 80%',
        end: 'center center',
        scrub: true,
      }
    });
  }


  /* --------------------------------------------------------------------------
     PARALLAX SUBTLE — Slight depth on section backgrounds
     -------------------------------------------------------------------------- */

  // Comparison section subtle parallax
  const demoSection = document.querySelector('.demo-section');
  if (demoSection) {
    gsap.to('.demo-transform', {
      y: -20,
      ease: 'none',
      scrollTrigger: {
        trigger: demoSection,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      }
    });
  }


  /* --------------------------------------------------------------------------
     MAGNETIC BUTTONS — Subtle follow cursor effect on CTAs
     -------------------------------------------------------------------------- */

  document.querySelectorAll('.btn--primary').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      gsap.to(btn, {
        x: x * 0.15,
        y: y * 0.15,
        duration: 0.3,
        ease: 'power2.out',
      });
    });

    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.3)',
      });
    });
  });


  /* --------------------------------------------------------------------------
     CATEGORY CARD HOVER — Enhanced with GSAP
     -------------------------------------------------------------------------- */

  document.querySelectorAll('.category-card').forEach(card => {
    const icon = card.querySelector('.category-card__icon');
    const arrow = card.querySelector('.category-card__arrow');

    card.addEventListener('mouseenter', () => {
      if (icon) {
        gsap.to(icon, { scale: 1.1, duration: 0.3, ease: 'power2.out' });
      }
      if (arrow) {
        gsap.to(arrow, { x: 6, duration: 0.3, ease: 'power2.out' });
      }
    });

    card.addEventListener('mouseleave', () => {
      if (icon) {
        gsap.to(icon, { scale: 1, duration: 0.3, ease: 'power2.out' });
      }
      if (arrow) {
        gsap.to(arrow, { x: 0, duration: 0.3, ease: 'power2.out' });
      }
    });
  });


  /* --------------------------------------------------------------------------
     NAV — Smooth scroll-triggered state
     -------------------------------------------------------------------------- */

  const nav = document.querySelector('.nav');
  if (nav) {
    ScrollTrigger.create({
      start: 'top -50',
      onUpdate: (self) => {
        if (self.direction === 1 && self.scroll() > 300) {
          gsap.to(nav, { y: -100, duration: 0.3, ease: 'power2.in' });
        } else {
          gsap.to(nav, { y: 0, duration: 0.4, ease: 'power2.out' });
        }
      }
    });
  }


  console.log('[Phase 2] GSAP ScrollTrigger + Lenis initialized');

})();
