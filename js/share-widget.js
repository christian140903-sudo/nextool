/**
 * NexTool Share Widget — Viral Sharing Mechanism
 * Inserts a "Share this tool" bar + "Made with NexTool" badge
 * Self-initializing, zero-config. Just include the script.
 */
(function() {
  'use strict';

  // ── CSS ──────────────────────────────────────────────────────────
  const css = `
/* ── Share Widget ─────────────────────────────────────────────── */
.ntool-share-widget {
  max-width: 1100px;
  margin: 2.5rem auto 1.5rem;
  padding: 0 1.5rem;
}
.ntool-share-inner {
  background: rgba(17, 17, 24, 0.8);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.ntool-share-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: #94a3b8;
  white-space: nowrap;
}
.ntool-share-label svg {
  width: 18px;
  height: 18px;
  opacity: 0.7;
}
.ntool-share-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.ntool-share-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.9rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: #e2e8f0;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  line-height: 1;
}
.ntool-share-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.08);
}
.ntool-share-btn svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
/* X / Twitter */
.ntool-share-btn--x:hover {
  border-color: rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.1);
}
/* LinkedIn */
.ntool-share-btn--linkedin:hover {
  border-color: #0a66c2;
  background: rgba(10, 102, 194, 0.15);
  color: #5b9bd5;
}
/* WhatsApp */
.ntool-share-btn--whatsapp:hover {
  border-color: #25d366;
  background: rgba(37, 211, 102, 0.12);
  color: #25d366;
}
/* Copy Link */
.ntool-share-btn--copy:hover {
  border-color: #a855f7;
  background: rgba(168, 85, 247, 0.12);
  color: #c084fc;
}
.ntool-share-btn--copy.copied {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

/* ── Made with NexTool Badge ──────────────────────────────────── */
.ntool-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.85rem;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.08), rgba(168, 85, 247, 0.08));
  border: 1px solid rgba(0, 212, 255, 0.15);
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 0.72rem;
  font-weight: 600;
  color: #94a3b8;
  text-decoration: none;
  transition: all 0.2s ease;
  letter-spacing: 0.02em;
}
.ntool-badge:hover {
  border-color: rgba(0, 212, 255, 0.35);
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.14), rgba(168, 85, 247, 0.14));
  color: #e2e8f0;
  transform: translateY(-1px);
}
.ntool-badge svg {
  width: 14px;
  height: 14px;
}
.ntool-badge-text {
  background: linear-gradient(135deg, #00d4ff, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 700;
}

/* ── Responsive ───────────────────────────────────────────────── */
@media (max-width: 640px) {
  .ntool-share-inner {
    flex-direction: column;
    align-items: flex-start;
    padding: 1rem;
  }
  .ntool-share-buttons {
    width: 100%;
  }
  .ntool-share-btn {
    flex: 1;
    justify-content: center;
    min-width: 0;
    padding: 0.55rem 0.6rem;
    font-size: 0.75rem;
  }
  .ntool-share-btn span.ntool-share-btn-label {
    display: none;
  }
}
`;

  // ── SVG Icons ──────────────────────────────────────────────────
  const icons = {
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>'
  };

  // ── Helpers ────────────────────────────────────────────────────
  function getToolName() {
    // Extract from <title> tag, clean up
    const title = document.title || '';
    // Split on " | " or " — " or " – " (with spaces to avoid splitting hyphens in names)
    let name = title.split(/\s[|—–]\s/)[0].trim();
    // Remove "Free " prefix
    name = name.replace(/^Free\s+/i, '');
    // Clean trailing noise
    name = name.replace(/\s*[-—–]\s.*$/, '');
    return name || 'this tool';
  }

  function getPageUrl() {
    return window.location.href.split('#')[0].split('?')[0];
  }

  // ── Inject CSS ─────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('ntool-share-styles')) return;
    const style = document.createElement('style');
    style.id = 'ntool-share-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ── Build Share Widget ─────────────────────────────────────────
  function createShareWidget() {
    const toolName = getToolName();
    const pageUrl = getPageUrl();
    const tweetText = encodeURIComponent(`Just found this free ${toolName} on @nextool_app — works great, no signup needed`);
    const linkedinUrl = encodeURIComponent(pageUrl);
    const waText = encodeURIComponent(`Check out this free ${toolName}: ${pageUrl}`);

    const widget = document.createElement('div');
    widget.className = 'ntool-share-widget';
    widget.innerHTML = `
      <div class="ntool-share-inner">
        <div class="ntool-share-label">
          ${icons.share}
          Share this tool
        </div>
        <div class="ntool-share-buttons">
          <a class="ntool-share-btn ntool-share-btn--x"
             href="https://x.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(pageUrl)}"
             target="_blank" rel="noopener noreferrer"
             title="Share on X">
            ${icons.x}
            <span class="ntool-share-btn-label">Post</span>
          </a>
          <a class="ntool-share-btn ntool-share-btn--linkedin"
             href="https://www.linkedin.com/sharing/share-offsite/?url=${linkedinUrl}"
             target="_blank" rel="noopener noreferrer"
             title="Share on LinkedIn">
            ${icons.linkedin}
            <span class="ntool-share-btn-label">LinkedIn</span>
          </a>
          <a class="ntool-share-btn ntool-share-btn--whatsapp"
             href="https://wa.me/?text=${waText}"
             target="_blank" rel="noopener noreferrer"
             title="Share on WhatsApp">
            ${icons.whatsapp}
            <span class="ntool-share-btn-label">WhatsApp</span>
          </a>
          <button class="ntool-share-btn ntool-share-btn--copy"
                  onclick="window.__ntoolCopyLink(this)"
                  title="Copy link to clipboard">
            ${icons.copy}
            <span class="ntool-share-btn-label">Copy Link</span>
          </button>
        </div>
      </div>
    `;
    return widget;
  }

  // ── Build Badge ────────────────────────────────────────────────
  function createBadge() {
    const badge = document.createElement('div');
    badge.style.cssText = 'text-align:center;margin:1rem auto 0;';
    badge.innerHTML = `
      <a href="https://nextool.app/free-tools/" class="ntool-badge" title="Explore 269 free tools on NexTool">
        ${icons.bolt}
        Made with <span class="ntool-badge-text">ANIMA</span> &mdash; 269 Free Tools
      </a>
    `;
    return badge;
  }

  // ── Copy Link Handler ──────────────────────────────────────────
  window.__ntoolCopyLink = function(btn) {
    const url = getPageUrl();
    navigator.clipboard.writeText(url).then(function() {
      btn.classList.add('copied');
      const label = btn.querySelector('.ntool-share-btn-label');
      const originalLabel = label ? label.textContent : '';
      if (label) label.textContent = 'Copied!';
      btn.querySelector('svg').outerHTML = icons.check;
      setTimeout(function() {
        btn.classList.remove('copied');
        if (label) label.textContent = originalLabel;
        btn.querySelector('svg').outerHTML = icons.copy;
      }, 2000);
    }).catch(function() {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      btn.classList.add('copied');
      setTimeout(function() { btn.classList.remove('copied'); }, 2000);
    });
  };

  // ── Insert Widget into Page ────────────────────────────────────
  function init() {
    // Don't run on index/listing pages
    if (window.location.pathname.endsWith('/') || window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('pro-upgrade.html')) {
      return;
    }

    injectStyles();

    // Find the best insertion point (before footer, after main content)
    const footer = document.querySelector('footer, .footer');
    const ctaSection = document.querySelector('.cta-section, .cta-bottom');

    // Find "Related Tools" sections (AUTO-LINKED by ANIMA Engine)
    let firstAutoLinked = null;
    const allPs = document.querySelectorAll('p');
    for (let i = 0; i < allPs.length; i++) {
      if (allPs[i].textContent.trim() === 'Related Tools' && allPs[i].parentElement && allPs[i].parentElement.tagName === 'DIV') {
        firstAutoLinked = allPs[i].parentElement;
        break;
      }
    }

    // Insert share widget BEFORE the CTA section, or before auto-linked, or before footer
    const shareWidget = createShareWidget();
    const badge = createBadge();

    if (ctaSection) {
      ctaSection.parentNode.insertBefore(shareWidget, ctaSection);
    } else if (firstAutoLinked) {
      firstAutoLinked.parentNode.insertBefore(shareWidget, firstAutoLinked);
    } else if (footer) {
      footer.parentNode.insertBefore(shareWidget, footer);
    } else {
      // Last resort: append before </body>
      document.body.appendChild(shareWidget);
    }

    // Insert badge inside footer if exists, otherwise after share widget
    if (footer) {
      const footerBottom = footer.querySelector('.footer-bottom') || footer.querySelector('p');
      if (footerBottom) {
        footerBottom.parentNode.insertBefore(badge, footerBottom);
      } else {
        footer.insertBefore(badge, footer.firstChild);
      }
    } else {
      shareWidget.parentNode.insertBefore(badge, shareWidget.nextSibling);
    }
  }

  // ── Run ────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
