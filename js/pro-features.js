/**
 * NexTool Pro Features Teaser
 * Injects context-aware premium feature cards into tool pages
 * Shows locked Pro features to drive upgrades
 * Loaded via revenue.js, <5KB
 */
(function () {
  'use strict';

  var PRO_URL = '/pro.html';

  // Premium features per tool slug
  // Each: [featureName, featureDescription, icon]
  var FEATURES = {
    'json-formatter': [
      ['\uD83D\uDD04 JSON \u2194 YAML/CSV/XML', 'Convert JSON to YAML, CSV, or XML with one click. Export in any format.'],
      ['\uD83D\uDD0D JSON Path Query', 'Query nested JSON with JSONPath expressions. Find any value instantly.'],
      ['\uD83D\uDCCB Schema Validation', 'Validate JSON against JSON Schema drafts. Get detailed error reports.'],
      ['\uD83D\uDCC2 Multi-File Diff', 'Compare two JSON files side by side with highlighted differences.']
    ],
    'password-generator': [
      ['\uD83D\uDCE6 Batch Generate', 'Generate 10, 50, or 100 passwords at once. Export as CSV or TXT.'],
      ['\uD83D\uDCAC Passphrase Mode', 'Generate memorable passphrases using word lists (e.g., correct-horse-battery-staple).'],
      ['\u26A0\uFE0F Breach Check', 'Check if your password has appeared in known data breaches (HaveIBeenPwned API).'],
      ['\uD83D\uDD10 Password Vault', 'Save generated passwords locally with labels. AES-256 encrypted in browser.']
    ],
    'qr-generator': [
      ['\uD83C\uDFA8 Custom QR Design', 'Add your logo, custom colors, rounded corners, and gradient fills.'],
      ['\uD83D\uDCE6 Batch QR Codes', 'Generate up to 100 QR codes from a CSV. Download as ZIP.'],
      ['\uD83D\uDCC8 QR Analytics', 'Track scans with built-in UTM parameters and redirect URLs.'],
      ['\uD83D\uDCC4 Vector SVG Export', 'Export QR codes as crisp SVG files for print and large format.']
    ],
    'color-palette': [
      ['\uD83C\uDFA8 AI Palette from Text', 'Describe a mood or theme and get AI-generated color palettes.'],
      ['\u267F WCAG Contrast Check', 'Check all palette color combinations against WCAG 2.1 AA/AAA standards.'],
      ['\uD83D\uDCE4 Export to Figma/CSS', 'One-click export as Figma tokens, CSS variables, SCSS, or Tailwind config.'],
      ['\uD83D\uDD12 Palette Collections', 'Save unlimited palettes locally. Organize into collections and projects.']
    ],
    'image-compressor': [
      ['\uD83D\uDCE6 Batch Compress', 'Drag & drop up to 50 images. Compress all at once with custom quality.'],
      ['\uD83D\uDD04 WebP/AVIF Convert', 'Convert to next-gen formats. Up to 80% smaller than JPEG.'],
      ['\u2702\uFE0F Smart Resize', 'Auto-resize for social media, web, or print. Preset dimensions included.'],
      ['\uD83D\uDCCA Compression Report', 'Detailed report: size reduction, quality score, optimization tips.']
    ],
    'markdown-preview': [
      ['\uD83D\uDCE4 Export to PDF/DOCX', 'Convert Markdown to polished PDF or Word documents with custom styling.'],
      ['\uD83C\uDFA8 Custom Themes', '10+ preview themes including GitHub, Academic, Newsletter, and Minimal.'],
      ['\uD83D\uDDBC\uFE0F Mermaid & LaTeX', 'Render diagrams (Mermaid, PlantUML) and math equations (LaTeX) inline.'],
      ['\uD83D\uDCC4 Slide Deck Mode', 'Turn Markdown into a presentation with --- page breaks. Present directly.']
    ],
    'gradient-generator': [
      ['\uD83C\uDF10 Mesh Gradients', 'Create complex mesh gradients with 4+ color stops and freeform shapes.'],
      ['\uD83C\uDFAC Animated Gradients', 'Generate CSS @keyframe animations for moving, pulsing, or shifting gradients.'],
      ['\uD83D\uDCC4 SVG Export', 'Export gradients as scalable SVG files for use in any design tool.'],
      ['\uD83D\uDCDA Gradient Library', '200+ curated gradient presets. Save your own favorites.']
    ],
    'base64': [
      ['\uD83D\uDCC2 Large File Support', 'Encode/decode files up to 50MB. No server upload — all in-browser.'],
      ['\uD83D\uDCE6 Batch Encode', 'Drop multiple files. Get all Base64 strings at once.'],
      ['\uD83D\uDDBC\uFE0F Image Preview', 'Paste Base64 image strings and see live preview. Detect format automatically.'],
      ['\uD83D\uDD04 Format Converter', 'Convert between Base64, Hex, Binary, and URL-safe Base64.']
    ],
    'regex-tester': [
      ['\uD83D\uDCD6 Regex Explainer', 'AI-powered plain English explanation of any regex pattern.'],
      ['\uD83D\uDCDA Pattern Library', '100+ common regex patterns: email, URL, phone, dates, IPs, and more.'],
      ['\uD83D\uDD04 Multi-Language Export', 'Export your regex as Python, JavaScript, Go, Java, or PHP code.'],
      ['\u23F1\uFE0F Performance Test', 'Benchmark regex speed. Detect catastrophic backtracking before production.']
    ],
    'css-animation-generator': [
      ['\uD83C\uDFAC Spring Physics', 'Natural spring-based animations with damping, stiffness, and mass controls.'],
      ['\uD83D\uDCE6 Animation Presets', '50+ ready-to-use animations: bounce, shake, wobble, flip, swing, and more.'],
      ['\u23F1\uFE0F Timeline Editor', 'Multi-step animation timeline with visual keyframe editing.'],
      ['\uD83D\uDD04 GSAP/Framer Export', 'Export as GSAP timeline or Framer Motion config. Copy-paste ready.']
    ],
    'meta-tag-generator': [
      ['\uD83D\uDCF1 Live Social Preview', 'Real-time preview of how your page appears on Google, Twitter, Facebook, LinkedIn.'],
      ['\uD83E\uDD16 AI Meta Generator', 'Paste your URL — AI generates optimized title, description, and keywords.'],
      ['\uD83D\uDCCA SEO Score', 'Get an SEO score with actionable tips. Title length, keyword density, readability.'],
      ['\uD83D\uDCCB Schema.org Builder', 'Generate structured data (Article, Product, FAQ, HowTo) with visual editor.']
    ],
    'uuid-generator': [
      ['\uD83D\uDCE6 Batch Generate', 'Generate 100, 500, or 1000 UUIDs at once. Export as JSON, CSV, or TXT.'],
      ['\uD83D\uDD22 UUID v5 & v3', 'Generate deterministic UUIDs with custom namespaces (v5/SHA-1, v3/MD5).'],
      ['\u2728 ULID & NanoID', 'Generate sortable ULIDs, compact NanoIDs, or Snowflake IDs.'],
      ['\uD83D\uDD0D UUID Inspector', 'Parse any UUID: extract version, variant, timestamp (v1), and validate.']
    ],
    'hash-generator': [
      ['\uD83D\uDCC2 File Hashing', 'Drag & drop files to generate checksums. Verify file integrity instantly.'],
      ['\uD83D\uDCE6 Batch Hash', 'Hash multiple strings or files at once. Compare and verify in bulk.'],
      ['\uD83D\uDD10 HMAC Generator', 'Generate HMAC-SHA256/SHA512 with custom secret keys for API authentication.'],
      ['\u26D3\uFE0F Hash Chain', 'Generate hash chains for blockchain, timestamping, or proof-of-work demos.']
    ],
    'color-converter': [
      ['\uD83C\uDFA8 Color Harmony', 'Generate complementary, triadic, analogous, and split-complementary schemes.'],
      ['\u267F Contrast Checker', 'Check WCAG 2.1 contrast ratios. Get AA/AAA pass/fail for any color pair.'],
      ['\uD83D\uDCCB Color Variables', 'Export as CSS custom properties, SCSS, Tailwind, or design token JSON.'],
      ['\uD83D\uDD0D Color Blindness Sim', 'Preview your colors as seen by people with protanopia, deuteranopia, tritanopia.']
    ],
    'lorem-generator': [
      ['\uD83C\uDFE2 Industry Content', 'Generate realistic placeholder text for tech, legal, medical, finance, or food.'],
      ['\uD83D\uDCDD HTML Markup', 'Output with headings, lists, links, bold, and italic — ready for CMS paste.'],
      ['\uD83C\uDF10 Multi-Language', 'Generate lorem in Spanish, French, German, Japanese, or Arabic script.'],
      ['\uD83D\uDCCA Data Tables', 'Generate placeholder data tables with names, emails, dates, and numbers.']
    ],
    'text-analyzer': [
      ['\uD83E\uDD16 AI Readability Score', 'Flesch-Kincaid, Gunning Fog, Coleman-Liau — all readability metrics at once.'],
      ['\uD83D\uDCCA Keyword Density', 'SEO keyword analysis: density, prominence, n-grams, and suggestions.'],
      ['\uD83D\uDE80 Content Optimization', 'Compare your text against top-ranking content. Get improvement suggestions.'],
      ['\uD83D\uDCDD Plagiarism Hints', 'Detect unusually common phrases and suggest rewrites for originality.']
    ],
    'diff-checker': [
      ['\uD83D\uDCDD Semantic Diff', 'Understand what changed — moved, renamed, reformatted vs actual content changes.'],
      ['\uD83D\uDCC2 File Upload Diff', 'Drag & drop two files to compare. Support for .txt, .json, .md, .csv, .html.'],
      ['\uD83D\uDD04 Three-Way Merge', 'Compare three versions: base, yours, and theirs. Resolve merge conflicts visually.'],
      ['\uD83D\uDCE4 Export Patch', 'Export differences as a unified diff patch file. Apply with git apply.']
    ],
    'svg-optimizer': [
      ['\uD83D\uDCE6 Batch Optimize', 'Drop up to 20 SVGs. Optimize all at once. Download as ZIP.'],
      ['\uD83C\uDFA8 SVG to React/Vue', 'Convert SVGs to optimized React or Vue components with proper props.'],
      ['\u2702\uFE0F Path Simplifier', 'Reduce path complexity by up to 60% while maintaining visual quality.'],
      ['\uD83D\uDCC8 Size Analysis', 'Detailed breakdown: paths, groups, filters, text. Find optimization targets.']
    ],
    'box-shadow-generator': [
      ['\uD83C\uDFAD Layered Shadows', 'Stack 2-5 shadow layers for realistic depth. Neumorphism presets included.'],
      ['\uD83D\uDCDA Shadow Library', '50+ curated shadow presets: Material, iOS, macOS, Tailwind, and custom.'],
      ['\uD83C\uDFAC Animated Shadows', 'Generate CSS transitions and hover animations for shadow effects.'],
      ['\uD83D\uDCE4 Tailwind Export', 'Export as Tailwind shadow utility or custom config. Copy-paste ready.']
    ],
    'favicon-generator': [
      ['\uD83D\uDCE6 Full Icon Set', 'Generate all sizes: 16x16, 32x32, 180x180, 192x192, 512x512 + manifest.json.'],
      ['\uD83C\uDF10 SVG Favicon', 'Create adaptive SVG favicons with dark mode support and theme colors.'],
      ['\uD83C\uDFA8 Icon Editor', 'Built-in pixel editor for fine-tuning your favicon at every size.'],
      ['\uD83D\uDCCB Code Generator', 'Complete HTML link tags + webmanifest. Copy-paste into your <head>.']
    ]
  };

  function getSlug() {
    var m = location.pathname.match(/\/free-tools\/([^\/\.]+)/);
    return m ? m[1] : null;
  }

  function injectCSS() {
    var s = document.createElement('style');
    s.textContent = [
      '.ntpf{max-width:900px;margin:32px auto;padding:0 24px;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif}',
      '.ntpf-card{background:linear-gradient(135deg,rgba(99,102,241,0.06),rgba(168,85,247,0.04));border:1px solid rgba(99,102,241,0.12);border-radius:20px;padding:32px 28px;position:relative;overflow:hidden}',
      '.ntpf-card::before{content:"";position:absolute;top:0;left:50%;transform:translateX(-50%);width:160px;height:2px;background:linear-gradient(90deg,transparent,#6366f1,#a855f7,transparent);border-radius:2px}',
      '.ntpf-header{text-align:center;margin-bottom:24px}',
      '.ntpf-badge{display:inline-block;padding:4px 14px;background:rgba(99,102,241,0.15);color:#818cf8;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px}',
      '.ntpf-title{color:#fff;font-size:20px;font-weight:800;margin:0 0 6px}',
      '.ntpf-sub{color:#94a3b8;font-size:13px;margin:0}',
      '.ntpf-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px}',
      '.ntpf-feat{display:flex;align-items:flex-start;gap:12px;padding:14px 16px;background:rgba(10,10,18,0.5);border:1px solid rgba(99,102,241,0.08);border-radius:12px;position:relative}',
      '.ntpf-feat::after{content:"\uD83D\uDD12";position:absolute;top:10px;right:12px;font-size:12px;opacity:.4}',
      '.ntpf-feat-icon{font-size:20px;flex-shrink:0;margin-top:1px}',
      '.ntpf-feat-text{flex:1}',
      '.ntpf-feat-name{color:#e2e8f0;font-size:13px;font-weight:600;margin:0 0 3px}',
      '.ntpf-feat-desc{color:#64748b;font-size:12px;line-height:1.5;margin:0}',
      '.ntpf-cta{text-align:center}',
      '.ntpf-btn{display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;border-radius:10px;font-weight:700;font-size:14px;text-decoration:none;transition:opacity .2s,transform .15s}',
      '.ntpf-btn:hover{opacity:.92;transform:translateY(-1px)}',
      '.ntpf-price{color:#94a3b8;font-size:12px;margin-top:8px}',
      '.ntpf-price s{color:#64748b}',
      '@media(max-width:600px){.ntpf-grid{grid-template-columns:1fr}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function createSection(slug, features) {
    var sec = document.createElement('div');
    sec.className = 'ntpf';

    var featHTML = features.map(function (f) {
      var parts = f[0].split(' ');
      var icon = parts[0];
      var name = parts.slice(1).join(' ');
      return [
        '<div class="ntpf-feat">',
        '  <div class="ntpf-feat-icon">' + icon + '</div>',
        '  <div class="ntpf-feat-text">',
        '    <p class="ntpf-feat-name">' + name + '</p>',
        '    <p class="ntpf-feat-desc">' + f[1] + '</p>',
        '  </div>',
        '</div>'
      ].join('');
    }).join('');

    sec.innerHTML = [
      '<div class="ntpf-card">',
      '  <div class="ntpf-header">',
      '    <div class="ntpf-badge">Pro Features</div>',
      '    <h3 class="ntpf-title">Unlock More Power</h3>',
      '    <p class="ntpf-sub">Everything above stays free forever. These features are available with NexTool Pro.</p>',
      '  </div>',
      '  <div class="ntpf-grid">',
      featHTML,
      '  </div>',
      '  <div class="ntpf-cta">',
      '    <a href="' + PRO_URL + '" class="ntpf-btn">Get NexTool Pro \u2192</a>',
      '    <p class="ntpf-price"><s>$49</s> <strong>$29</strong> \u2014 Founding Member Price</p>',
      '  </div>',
      '</div>'
    ].join('\n');

    return sec;
  }

  function inject() {
    // Pro users don't see locked feature teasers
    if(window.NexToolPro&&window.NexToolPro.active)return;
    var slug = getSlug();
    if (!slug || !FEATURES[slug]) return;

    injectCSS();

    var section = createSection(slug, FEATURES[slug]);

    // Insert before the CTA section or Cross Promo section
    var ctaSection = document.querySelector('.cta-section');
    if (ctaSection) {
      ctaSection.parentNode.insertBefore(section, ctaSection);
    } else {
      var footer = document.querySelector('footer, .footer');
      if (footer) footer.parentNode.insertBefore(section, footer);
    }
  }

  // Run
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
