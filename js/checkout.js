/**
 * NexTool Checkout Handler
 * Stripe Payment Links + WhatsApp Fallback
 *
 * Stripe Payment Links: Sobald in Stripe Dashboard erstellt,
 * hier die buy.stripe.com URLs eintragen.
 *
 * Bis dahin: WhatsApp Fallback → sofortige Bestellungen möglich.
 */

const STRIPE_LINKS = {
  // AI Website
  'starter-website':    '',  // $49 — buy.stripe.com/xxxx eintragen
  'pro-website':        '',  // $149
  'enterprise-website': '',  // $349

  // AI Business Kit
  'essentials-kit':     '',  // $49
  'pro-kit':            '',  // $149
  'complete-kit':       '',  // $349

  // AI Content
  'starter-content':    '',  // $29
  'growth-content':     '',  // $79
  'authority-content':  '',  // $149

  // Marketing as a Service
  'launch-maas':        '',  // $99/mo
  'scale-maas':         '',  // $249/mo
  'dominate-maas':      '',  // $499/mo
};

const PRODUCT_NAMES = {
  'starter-website':    'AI Website — Starter ($49)',
  'pro-website':        'AI Website — Professional ($149)',
  'enterprise-website': 'AI Website — Enterprise ($349)',
  'essentials-kit':     'AI Business Kit — Essentials ($49)',
  'pro-kit':            'AI Business Kit — Professional ($149)',
  'complete-kit':       'AI Business Kit — Complete ($349)',
  'starter-content':    'AI Content — Starter ($29)',
  'growth-content':     'AI Content — Growth ($79)',
  'authority-content':  'AI Content — Authority ($149)',
  'launch-maas':        'Marketing as a Service — Launch ($99/mo)',
  'scale-maas':         'Marketing as a Service — Scale ($249/mo)',
  'dominate-maas':      'Marketing as a Service — Dominate ($499/mo)',
};

const WHATSAPP_NUMBER = '436764433763';

function handleCheckout(checkout, productTab) {
  const stripeUrl = STRIPE_LINKS[checkout];

  if (stripeUrl) {
    // Stripe Payment Link vorhanden → direkt öffnen
    window.open(stripeUrl, '_blank', 'noopener');
    return;
  }

  // WhatsApp Fallback — sofortige Bestellung
  const productName = PRODUCT_NAMES[checkout] || checkout;
  const msg = encodeURIComponent(
    `Hi! I'd like to order: ${productName}\n\nCould you send me the details?`
  );
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank', 'noopener');
}

// Globalen Event-Listener für nt:checkout registrieren
document.addEventListener('DOMContentLoaded', () => {
  // Pricing Calculator Event
  document.addEventListener('nt:checkout', (e) => {
    const { checkout, product } = e.detail || {};
    if (checkout) handleCheckout(checkout, product);
  });

  // Direkte CTA-Links mit data-checkout Attribut (falls vorhanden)
  document.querySelectorAll('[data-checkout]').forEach(el => {
    if (el.tagName === 'A' || el.tagName === 'BUTTON') {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        handleCheckout(el.dataset.checkout, el.dataset.product);
      });
    }
  });
});

// Für externe Nutzung
window.NexToolCheckout = { handleCheckout, STRIPE_LINKS, PRODUCT_NAMES };
