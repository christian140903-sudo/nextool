/* ==========================================================================
   NexTool Revolution — Main Application JavaScript

   Phase 1: Vanilla JS, zero dependencies.
   Phase 2: GSAP, Lenis, Three.js layered on top.

   Principle: Progressive enhancement. Page works without JS.
   JS makes it ALIVE.
   ========================================================================== */

(function() {
  'use strict';

  /* --------------------------------------------------------------------------
     SCROLL REVEAL — Intersection Observer for [data-reveal] elements
     -------------------------------------------------------------------------- */

  function initScrollReveal() {
    const elements = document.querySelectorAll('[data-reveal]');
    if (!elements.length) return;

    // Respect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elements.forEach(el => el.classList.add('revealed'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -60px 0px'
    });

    elements.forEach(el => observer.observe(el));
  }


  /* --------------------------------------------------------------------------
     FADE-IN GROUPS — Sequential reveal for grouped elements
     -------------------------------------------------------------------------- */

  function initFadeInGroups() {
    const groups = document.querySelectorAll('.fade-in-group');
    if (!groups.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      groups.forEach(g => g.classList.add('active'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px'
    });

    groups.forEach(g => observer.observe(g));
  }


  /* --------------------------------------------------------------------------
     NAVIGATION — Scroll state + mobile toggle
     -------------------------------------------------------------------------- */

  function initNavigation() {
    const nav = document.querySelector('.nav');
    if (!nav) return;

    // Scroll state: transparent → glass
    let lastScroll = 0;
    let ticking = false;

    function updateNavState() {
      const scrollY = window.scrollY;

      if (scrollY > 50) {
        nav.classList.add('nav--scrolled');
      } else {
        nav.classList.remove('nav--scrolled');
      }

      // Optional: hide on scroll down, show on scroll up (disabled for now)
      // if (scrollY > lastScroll && scrollY > 200) {
      //   nav.style.transform = 'translateY(-100%)';
      // } else {
      //   nav.style.transform = 'translateY(0)';
      // }

      lastScroll = scrollY;
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateNavState);
        ticking = true;
      }
    }, { passive: true });

    // Initial state check
    updateNavState();

    // Mobile toggle
    const toggle = document.querySelector('.nav__toggle');
    const mobileMenu = document.querySelector('.nav__mobile');

    if (toggle && mobileMenu) {
      toggle.addEventListener('click', () => {
        const isOpen = toggle.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        document.body.style.overflow = isOpen ? 'hidden' : '';
        toggle.setAttribute('aria-expanded', isOpen);
      });

      // Close mobile menu on link click
      mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          toggle.classList.remove('active');
          mobileMenu.classList.remove('active');
          document.body.style.overflow = '';
          toggle.setAttribute('aria-expanded', 'false');
        });
      });

      // Close on escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
          toggle.classList.remove('active');
          mobileMenu.classList.remove('active');
          document.body.style.overflow = '';
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }


  /* --------------------------------------------------------------------------
     SMOOTH SCROLL — For anchor links (until Lenis in Phase 2)
     -------------------------------------------------------------------------- */

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (targetId === '#') return;

        const target = document.querySelector(targetId);
        if (!target) return;

        e.preventDefault();

        const navHeight = document.querySelector('.nav')?.offsetHeight || 0;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      });
    });
  }


  /* --------------------------------------------------------------------------
     FAQ ACCORDION — Toggle questions open/closed
     -------------------------------------------------------------------------- */

  function initFaqAccordion() {
    const questions = document.querySelectorAll('.faq-item__question');
    if (!questions.length) return;

    questions.forEach(question => {
      question.addEventListener('click', () => {
        const item = question.closest('.faq-item');
        const isOpen = item.classList.contains('faq-item--open');

        // Close all others (single-open mode)
        document.querySelectorAll('.faq-item--open').forEach(openItem => {
          if (openItem !== item) {
            openItem.classList.remove('faq-item--open');
            openItem.querySelector('.faq-item__question')?.setAttribute('aria-expanded', 'false');
          }
        });

        // Toggle current
        item.classList.toggle('faq-item--open', !isOpen);
        question.setAttribute('aria-expanded', !isOpen);
      });
    });
  }


  /* --------------------------------------------------------------------------
     PRICING TOGGLE — Monthly/Annual billing switch
     -------------------------------------------------------------------------- */

  function initPricingToggle() {
    const toggle = document.querySelector('.pricing-toggle__switch');
    if (!toggle) return;

    const monthlyLabel = document.querySelector('.pricing-toggle__option:first-child');
    const annualLabel = document.querySelector('.pricing-toggle__option:last-child');
    const prices = document.querySelectorAll('[data-monthly]');
    // Only target paid cards' period labels (skip Free's "forever")
    const periods = document.querySelectorAll('[data-monthly] ~ .pricing-card__period');

    let isAnnual = false;

    toggle.addEventListener('click', () => {
      isAnnual = !isAnnual;
      toggle.classList.toggle('active', isAnnual);

      // Update labels
      if (monthlyLabel) monthlyLabel.classList.toggle('active', !isAnnual);
      if (annualLabel) annualLabel.classList.toggle('active', isAnnual);

      // Update prices with smooth transition
      prices.forEach(el => {
        const monthly = el.getAttribute('data-monthly');
        const annual = el.getAttribute('data-annual');

        el.style.opacity = '0';
        el.style.transform = 'translateY(-4px)';

        setTimeout(() => {
          el.textContent = '$' + (isAnnual ? annual : monthly);
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }, 150);
      });

      // Update period labels — always /mo, add "billed annually" note
      periods.forEach(el => {
        el.style.opacity = '0';
        setTimeout(() => {
          el.textContent = '/mo';
          el.style.opacity = '1';
        }, 150);
      });

      // Toggle "billed annually" note
      const billingNote = document.querySelector('.pricing-billing-note');
      if (billingNote) {
        billingNote.textContent = isAnnual ? 'billed annually' : '';
      }

      // Update PayPal buy button links
      const buyButtons = document.querySelectorAll('[data-monthly][data-annual].btn');
      buyButtons.forEach(btn => {
        const monthly = btn.getAttribute('data-monthly');
        const annual = btn.getAttribute('data-annual');
        const amount = isAnnual ? annual : monthly;
        btn.href = 'https://paypal.me/chbu1403/' + amount;
      });
    });
  }


  /* --------------------------------------------------------------------------
     HERO INPUT — Capture intent and redirect to wizard
     -------------------------------------------------------------------------- */

  function initHeroInput() {
    const form = document.querySelector('.hero__input-container');
    const input = document.querySelector('.hero__input');
    const button = document.querySelector('.hero__input-btn');

    if (!input || !button) return;

    function handleSubmit() {
      const value = input.value.trim();
      if (!value) {
        // Shake animation for empty input
        input.style.animation = 'none';
        input.offsetHeight; // Trigger reflow
        input.style.animation = 'shake 0.4s ease';
        input.focus();
        return;
      }

      // Redirect to wizard with intent
      const encoded = encodeURIComponent(value);
      window.location.href = `create/?q=${encoded}`;
    }

    button.addEventListener('click', handleSubmit);

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    });

    // Auto-rotate placeholder suggestions
    const placeholders = [
      'I need a landing page for my SaaS startup...',
      'Write a business plan for a coffee shop...',
      'Help me automate my email marketing...',
      'Create a social media content strategy...',
      'Build a customer onboarding workflow...',
      'Design a mobile app for fitness tracking...',
      'Write a legal terms of service template...',
      'Research competitor analysis for my market...'
    ];

    let placeholderIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let isPaused = false;

    function typewriterEffect() {
      if (document.activeElement === input || input.value) return;

      const current = placeholders[placeholderIndex];

      if (!isDeleting && !isPaused) {
        charIndex++;
        input.setAttribute('placeholder', current.substring(0, charIndex));

        if (charIndex === current.length) {
          isPaused = true;
          setTimeout(() => {
            isPaused = false;
            isDeleting = true;
            typewriterEffect();
          }, 2000);
          return;
        }
      } else if (isDeleting) {
        charIndex--;
        input.setAttribute('placeholder', current.substring(0, charIndex));

        if (charIndex === 0) {
          isDeleting = false;
          placeholderIndex = (placeholderIndex + 1) % placeholders.length;
        }
      }

      const speed = isDeleting ? 30 : 60;
      setTimeout(typewriterEffect, speed);
    }

    // Start typewriter after hero animation completes
    setTimeout(typewriterEffect, 1500);
  }


  /* --------------------------------------------------------------------------
     COUNTER ANIMATION — Animate stats when visible
     -------------------------------------------------------------------------- */

  function initCounterAnimation() {
    const counters = document.querySelectorAll('.stat__number');
    if (!counters.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
  }

  function animateCounter(el) {
    const text = el.textContent;
    const match = text.match(/^(\d+)(\+?)(x?)(.*)$/);
    if (!match) return;

    const target = parseInt(match[1], 10);
    const plus = match[2];
    const x = match[3];
    const suffix = match[4];
    const duration = 1200;
    const start = performance.now();

    function easeOutExpo(t) {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);
      const current = Math.round(eased * target);

      el.textContent = current + plus + x + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    el.classList.add('counter-animate');
    requestAnimationFrame(update);
  }


  /* --------------------------------------------------------------------------
     SCROLL INDICATOR — Hide after first scroll
     -------------------------------------------------------------------------- */

  function initScrollIndicator() {
    const indicator = document.querySelector('.scroll-indicator');
    if (!indicator) return;

    let hidden = false;

    window.addEventListener('scroll', () => {
      if (!hidden && window.scrollY > 100) {
        indicator.style.opacity = '0';
        indicator.style.pointerEvents = 'none';
        hidden = true;
      }
    }, { passive: true });
  }


  /* --------------------------------------------------------------------------
     CATEGORY CARDS — Hover effects + navigation
     -------------------------------------------------------------------------- */

  function initCategoryCards() {
    const cards = document.querySelectorAll('.category-card');
    if (!cards.length) return;

    cards.forEach(card => {
      card.addEventListener('click', () => {
        const link = card.querySelector('a');
        if (link) {
          window.location.href = link.href;
        }
      });
    });
  }


  /* --------------------------------------------------------------------------
     KEYBOARD SHORTCUT — Cmd/Ctrl + K to focus search
     -------------------------------------------------------------------------- */

  function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.querySelector('.hero__input');
        if (input) {
          input.focus();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    });
  }


  /* --------------------------------------------------------------------------
     SHAKE ANIMATION — For invalid input
     -------------------------------------------------------------------------- */

  // Inject shake keyframe (small, no external dependency)
  const shakeStyle = document.createElement('style');
  shakeStyle.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-6px); }
      40% { transform: translateX(6px); }
      60% { transform: translateX(-4px); }
      80% { transform: translateX(4px); }
    }
  `;
  document.head.appendChild(shakeStyle);


  /* --------------------------------------------------------------------------
     ACTIVE NAV LINK — Highlight based on scroll position
     -------------------------------------------------------------------------- */

  function initActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav__link');
    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${id}`) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        }
      });
    }, {
      threshold: 0,
      rootMargin: '-30% 0px -70% 0px'
    });

    sections.forEach(section => observer.observe(section));
  }


  /* --------------------------------------------------------------------------
     PERFORMANCE — Lazy load below-fold images
     -------------------------------------------------------------------------- */

  function initLazyLoad() {
    if ('loading' in HTMLImageElement.prototype) return; // Native support

    const images = document.querySelectorAll('img[loading="lazy"]');
    if (!images.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
          }
          observer.unobserve(img);
        }
      });
    }, { rootMargin: '200px' });

    images.forEach(img => observer.observe(img));
  }


  /* --------------------------------------------------------------------------
     INIT — Boot everything on DOMContentLoaded
     -------------------------------------------------------------------------- */

  function init() {
    initScrollReveal();
    initFadeInGroups();
    initNavigation();
    initSmoothScroll();
    initFaqAccordion();
    initPricingToggle();
    initHeroInput();
    initCounterAnimation();
    initScrollIndicator();
    initCategoryCards();
    initKeyboardShortcuts();
    initActiveNavLink();
    initLazyLoad();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
