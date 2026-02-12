/**
 * NexTool Pricing Calculator
 * -----------------------------------------------------------------------
 * Interactive pricing cards with product tabs, animated counters,
 * comparison savings, and smooth transitions.
 *
 * @module features/pricing-calculator
 * @exports init, destroy
 */

/* ===================================================================
   PRODUCT DATA
   =================================================================== */

const PRODUCTS = {
    website: {
        name: 'AI Website',
        icon: '\u{1F310}',
        tiers: [
            {
                name: 'Starter',
                price: 49,
                period: 'one-time',
                features: [
                    '1-page website',
                    'Mobile responsive',
                    'SEO optimized',
                    'Lighthouse 100/100',
                    '1 revision',
                    'Delivered in 24h',
                ],
                cta: 'Get Started',
                checkout: 'starter-website',
            },
            {
                name: 'Professional',
                price: 149,
                period: 'one-time',
                featured: true,
                features: [
                    '5-page website',
                    'Custom design system',
                    'Contact form + analytics',
                    'Blog setup',
                    'Animation & micro-interactions',
                    '3 revisions',
                    'Delivered in 48h',
                ],
                cta: 'Most Popular',
                checkout: 'pro-website',
            },
            {
                name: 'Enterprise',
                price: 349,
                period: 'one-time',
                features: [
                    'Unlimited pages',
                    'E-commerce ready',
                    'Custom animations',
                    'CMS integration',
                    'Priority support',
                    'Unlimited revisions',
                    'Delivered in 5 days',
                ],
                cta: 'Go Enterprise',
                checkout: 'enterprise-website',
            },
        ],
        agencyPrice: 5000,
    },
    businessKit: {
        name: 'AI Business Kit',
        icon: '\u{1F4BC}',
        tiers: [
            {
                name: 'Essentials',
                price: 49,
                period: 'one-time',
                features: [
                    'Logo design (3 concepts)',
                    'Color palette',
                    'Typography guide',
                    'Business card design',
                    'Delivered in 24h',
                ],
                cta: 'Get Essentials',
                checkout: 'essentials-kit',
            },
            {
                name: 'Professional',
                price: 149,
                period: 'one-time',
                featured: true,
                features: [
                    'Everything in Essentials',
                    'Website (1-page)',
                    'Social media kit (5 platforms)',
                    'Email template',
                    'Brand guidelines PDF',
                    'Delivered in 48h',
                ],
                cta: 'Most Popular',
                checkout: 'pro-kit',
            },
            {
                name: 'Complete',
                price: 349,
                period: 'one-time',
                features: [
                    'Everything in Professional',
                    'Marketing materials',
                    'Presentation template',
                    'Invoice & letterhead',
                    'Brand strategy document',
                    'Unlimited revisions',
                ],
                cta: 'Get Complete',
                checkout: 'complete-kit',
            },
        ],
        agencyPrice: 8000,
    },
    content: {
        name: 'AI Content',
        icon: '\u{1F4DD}',
        tiers: [
            {
                name: 'Starter',
                price: 29,
                period: 'one-time',
                features: [
                    '5 blog posts (1000+ words)',
                    'SEO optimized',
                    'Ready to publish',
                    'Keywords included',
                ],
                cta: 'Get Content',
                checkout: 'starter-content',
            },
            {
                name: 'Growth',
                price: 79,
                period: 'one-time',
                featured: true,
                features: [
                    '15 blog posts',
                    'Full keyword research',
                    '30-day content calendar',
                    'Social media snippets',
                    'Internal linking plan',
                ],
                cta: 'Most Popular',
                checkout: 'growth-content',
            },
            {
                name: 'Authority',
                price: 149,
                period: 'one-time',
                features: [
                    '30+ content pieces',
                    'Multiple formats (blog, social, email)',
                    'Complete editorial calendar',
                    'Analytics setup guide',
                    'Brand voice document',
                ],
                cta: 'Build Authority',
                checkout: 'authority-content',
            },
        ],
        agencyPrice: 3000,
    },
    maas: {
        name: 'Marketing as a Service',
        icon: '\u{1F680}',
        tiers: [
            {
                name: 'Launch',
                price: 99,
                period: '/month',
                features: [
                    'Social media management',
                    '12 posts / month',
                    'Basic analytics report',
                    'Community engagement',
                ],
                cta: 'Launch Now',
                checkout: 'launch-maas',
            },
            {
                name: 'Scale',
                price: 249,
                period: '/month',
                featured: true,
                features: [
                    'Everything in Launch',
                    '30 posts / month',
                    'Content creation',
                    'SEO optimization',
                    'Email campaigns',
                    'Monthly strategy call',
                ],
                cta: 'Most Popular',
                checkout: 'scale-maas',
            },
            {
                name: 'Dominate',
                price: 499,
                period: '/month',
                features: [
                    'Everything in Scale',
                    'Unlimited content',
                    'Paid ad management',
                    'Landing pages',
                    'A/B testing',
                    'Dedicated strategist',
                ],
                cta: 'Dominate Market',
                checkout: 'dominate-maas',
            },
        ],
        agencyPrice: 5000,
    },
};

/* ===================================================================
   STATE
   =================================================================== */

let containerEl = null;
let activeProduct = 'website';
let observer = null;
let hasAnimated = false;

/* ===================================================================
   STYLES
   =================================================================== */

function injectStyles() {
    if (document.getElementById('nt-pricing-styles')) return;
    const s = document.createElement('style');
    s.id = 'nt-pricing-styles';
    s.textContent = `
        .nt-pricing { max-width:1100px; margin:0 auto; }

        /* Tabs */
        .nt-pricing__tabs {
            display:flex; gap:4px; justify-content:center; margin-bottom:40px;
            background:rgba(255,255,255,.04); border-radius:12px; padding:4px;
            max-width:600px; margin-left:auto; margin-right:auto;
        }
        .nt-pricing__tab {
            flex:1; padding:10px 16px; border-radius:10px; border:none;
            background:transparent; color:rgba(255,255,255,.5); font-size:14px;
            font-weight:600; cursor:pointer; transition:all .25s;
            font-family:inherit; text-align:center;
        }
        .nt-pricing__tab:hover { color:rgba(255,255,255,.8); }
        .nt-pricing__tab--active {
            background:var(--nt-primary, #00d4ff); color:#000;
        }
        .nt-pricing__tab-icon { margin-right:6px; }

        /* Cards grid */
        .nt-pricing__cards {
            display:grid; grid-template-columns:repeat(3, 1fr); gap:20px;
            opacity:0; transform:translateY(20px);
            transition:opacity .5s ease, transform .5s ease;
        }
        .nt-pricing__cards--visible { opacity:1; transform:translateY(0); }
        @media(max-width:768px) { .nt-pricing__cards { grid-template-columns:1fr; max-width:400px; margin:0 auto; } }

        /* Single card */
        .nt-pricing__card {
            background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.08);
            border-radius:16px; padding:28px 24px; position:relative;
            transition:transform .3s ease, box-shadow .3s ease, border-color .3s ease;
            display:flex; flex-direction:column;
        }
        .nt-pricing__card:hover {
            transform:translateY(-4px);
            box-shadow:0 12px 40px rgba(0,0,0,.3);
            border-color:rgba(255,255,255,.15);
        }
        .nt-pricing__card--featured {
            border-color:var(--nt-primary, #00d4ff);
            background:linear-gradient(135deg, rgba(0,212,255,.06), rgba(123,97,255,.04));
            box-shadow:0 0 30px rgba(0,212,255,.08);
        }

        .nt-pricing__badge {
            position:absolute; top:-12px; left:50%; transform:translateX(-50%);
            background:var(--nt-primary, #00d4ff); color:#000; font-size:11px;
            font-weight:700; padding:4px 14px; border-radius:20px;
            text-transform:uppercase; letter-spacing:.05em;
        }

        .nt-pricing__tier-name {
            font-size:16px; font-weight:600; color:rgba(255,255,255,.7);
            margin-bottom:8px;
        }

        .nt-pricing__price {
            display:flex; align-items:baseline; gap:4px; margin-bottom:4px;
        }
        .nt-pricing__price-currency { font-size:20px; color:rgba(255,255,255,.5); font-weight:600; }
        .nt-pricing__price-amount {
            font-size:48px; font-weight:800; color:#fff;
            line-height:1; font-variant-numeric:tabular-nums;
        }
        .nt-pricing__price-period { font-size:14px; color:rgba(255,255,255,.35); }

        .nt-pricing__features {
            list-style:none; padding:0; margin:20px 0; flex:1;
        }
        .nt-pricing__features li {
            font-size:14px; color:rgba(255,255,255,.65); padding:6px 0;
            display:flex; align-items:center; gap:8px;
        }
        .nt-pricing__features li::before {
            content:'\u2713'; color:var(--nt-primary, #00d4ff); font-weight:700;
            font-size:14px; flex-shrink:0;
        }

        .nt-pricing__cta {
            display:block; width:100%; padding:12px 20px; border-radius:10px;
            border:none; font-size:15px; font-weight:700; cursor:pointer;
            transition:all .25s; font-family:inherit; text-align:center;
            text-decoration:none;
        }
        .nt-pricing__cta--default {
            background:rgba(255,255,255,.06); color:#fff;
            border:1px solid rgba(255,255,255,.12);
        }
        .nt-pricing__cta--default:hover { background:rgba(255,255,255,.12); }
        .nt-pricing__cta--featured {
            background:var(--nt-primary, #00d4ff); color:#000;
        }
        .nt-pricing__cta--featured:hover { filter:brightness(1.1); transform:scale(1.02); }

        /* Savings bar */
        .nt-pricing__savings {
            text-align:center; margin-top:32px; padding:20px;
            background:rgba(0,212,255,.04); border:1px solid rgba(0,212,255,.1);
            border-radius:12px;
        }
        .nt-pricing__savings-label {
            font-size:13px; color:rgba(255,255,255,.5); margin-bottom:4px;
        }
        .nt-pricing__savings-amount {
            font-size:28px; font-weight:800; color:var(--nt-primary, #00d4ff);
        }
        .nt-pricing__savings-detail { font-size:13px; color:rgba(255,255,255,.4); margin-top:4px; }

        /* Guarantee */
        .nt-pricing__guarantee {
            text-align:center; margin-top:20px; font-size:13px;
            color:rgba(255,255,255,.4);
        }
        .nt-pricing__guarantee-icon { font-size:18px; vertical-align:middle; margin-right:4px; }
    `;
    document.head.appendChild(s);
}

/* ===================================================================
   RENDER
   =================================================================== */

function render() {
    if (!containerEl) return;

    const product = PRODUCTS[activeProduct];
    if (!product) return;

    // Build tabs
    let tabsHtml = '<div class="nt-pricing__tabs">';
    for (const [key, prod] of Object.entries(PRODUCTS)) {
        const active = key === activeProduct ? ' nt-pricing__tab--active' : '';
        tabsHtml += `<button class="nt-pricing__tab${active}" data-product="${key}">
            <span class="nt-pricing__tab-icon">${prod.icon}</span>${prod.name}
        </button>`;
    }
    tabsHtml += '</div>';

    // Build cards
    let cardsHtml = '<div class="nt-pricing__cards">';
    for (const tier of product.tiers) {
        const featuredClass = tier.featured ? ' nt-pricing__card--featured' : '';
        const badge = tier.featured ? '<div class="nt-pricing__badge">Most Popular</div>' : '';
        const ctaClass = tier.featured ? 'nt-pricing__cta--featured' : 'nt-pricing__cta--default';

        let featuresLi = '';
        for (const feat of tier.features) {
            featuresLi += `<li>${escapeHtml(feat)}</li>`;
        }

        cardsHtml += `
            <div class="nt-pricing__card${featuredClass}">
                ${badge}
                <div class="nt-pricing__tier-name">${escapeHtml(tier.name)}</div>
                <div class="nt-pricing__price">
                    <span class="nt-pricing__price-currency">$</span>
                    <span class="nt-pricing__price-amount" data-target="${tier.price}">0</span>
                    <span class="nt-pricing__price-period">${escapeHtml(tier.period)}</span>
                </div>
                <ul class="nt-pricing__features">${featuresLi}</ul>
                <a href="#" class="nt-pricing__cta ${ctaClass}" data-checkout="${tier.checkout}">
                    ${escapeHtml(tier.cta)}
                </a>
            </div>`;
    }
    cardsHtml += '</div>';

    // Savings comparison
    const midPrice = product.tiers[1] ? product.tiers[1].price : product.tiers[0].price;
    const savings = product.agencyPrice - midPrice;
    const savingsHtml = `
        <div class="nt-pricing__savings">
            <div class="nt-pricing__savings-label">Compare: Traditional Agency vs NexTool</div>
            <div class="nt-pricing__savings-amount">Save $${savings.toLocaleString()}</div>
            <div class="nt-pricing__savings-detail">
                Agency: $${product.agencyPrice.toLocaleString()} &bull;
                NexTool: $${midPrice} &bull;
                You save ${Math.round((savings / product.agencyPrice) * 100)}%
            </div>
        </div>`;

    // Guarantee
    const guaranteeHtml = `
        <div class="nt-pricing__guarantee">
            <span class="nt-pricing__guarantee-icon">\u{1F6E1}\uFE0F</span>
            100% Money-Back Guarantee &mdash; Not happy? Full refund within 14 days.
        </div>`;

    containerEl.innerHTML = tabsHtml + cardsHtml + savingsHtml + guaranteeHtml;

    // Bind tab clicks
    containerEl.querySelectorAll('.nt-pricing__tab').forEach(tab => {
        tab.addEventListener('click', () => {
            activeProduct = tab.dataset.product;
            render();
            // Re-trigger card animation
            requestAnimationFrame(() => {
                const cards = containerEl.querySelector('.nt-pricing__cards');
                if (cards) cards.classList.add('nt-pricing__cards--visible');
                animatePrices();
            });
        });
    });

    // Bind CTA clicks
    containerEl.querySelectorAll('.nt-pricing__cta').forEach(cta => {
        cta.addEventListener('click', (e) => {
            e.preventDefault();
            const checkout = cta.dataset.checkout;
            // Dispatch custom event for external handlers
            containerEl.dispatchEvent(new CustomEvent('nt:checkout', { detail: { checkout, product: activeProduct } }));
            // Fallback: scroll to contact
            const contact = document.getElementById('contact') || document.querySelector('[data-section="contact"]');
            if (contact) contact.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Animate cards in
    requestAnimationFrame(() => {
        const cards = containerEl.querySelector('.nt-pricing__cards');
        if (cards) {
            requestAnimationFrame(() => {
                cards.classList.add('nt-pricing__cards--visible');
                animatePrices();
            });
        }
    });
}

/**
 * Animate price numbers counting up.
 */
function animatePrices() {
    const priceEls = containerEl.querySelectorAll('.nt-pricing__price-amount');
    priceEls.forEach((el, i) => {
        const target = parseInt(el.dataset.target, 10);
        if (isNaN(target)) return;

        // Stagger each card
        setTimeout(() => {
            countUp(el, 0, target, 800);
        }, i * 120);
    });
}

/**
 * Count-up animation with ease-out.
 */
function countUp(el, start, end, duration) {
    const startTime = performance.now();

    function tick(now) {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (end - start) * eased);
        el.textContent = current;
        if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/* ===================================================================
   INIT / DESTROY
   =================================================================== */

export function init(containerId = 'pricing-section') {
    injectStyles();

    containerEl = document.getElementById(containerId);
    if (!containerEl) return;

    // Add class for styling hooks
    containerEl.classList.add('nt-pricing');

    // IntersectionObserver for entry animation
    observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting && !hasAnimated) {
                hasAnimated = true;
                render();
            }
        }
    }, { threshold: 0.15 });

    observer.observe(containerEl);

    // Initial render (also triggers if already in view)
    render();
}

export function destroy() {
    if (observer) { observer.disconnect(); observer = null; }
    if (containerEl) {
        containerEl.innerHTML = '';
        containerEl.classList.remove('nt-pricing');
    }
    containerEl = null;
    hasAnimated = false;

    const styleEl = document.getElementById('nt-pricing-styles');
    if (styleEl) styleEl.remove();
}
