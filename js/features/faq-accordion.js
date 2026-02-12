/**
 * NexTool FAQ Accordion
 * -----------------------------------------------------------------------
 * Smooth FAQ accordion with animated height transitions, chevron rotation,
 * keyboard accessibility, ARIA attributes, single-open mode, and
 * optional search/filter.
 *
 * Expected HTML:
 *   <div class="nt-faq" id="faq-section">
 *     <div class="nt-faq__item" data-faq>
 *       <button class="nt-faq__question" aria-expanded="false">
 *         <span>How does NexTool work?</span>
 *         <svg class="nt-faq__chevron">...</svg>
 *       </button>
 *       <div class="nt-faq__answer" role="region">
 *         <p>You describe what you need...</p>
 *       </div>
 *     </div>
 *   </div>
 *
 * @module features/faq-accordion
 * @exports init, destroy
 */

/* ===================================================================
   CONFIG
   =================================================================== */

const TRANSITION_DURATION = 300; // ms for height transition
const SINGLE_OPEN = true;        // Only one item open at a time by default

/* ===================================================================
   STATE
   =================================================================== */

let containerEl = null;
let items = [];
let searchInput = null;
let boundHandlers = [];

/* ===================================================================
   STYLES
   =================================================================== */

function injectStyles() {
    if (document.getElementById('nt-faq-styles')) return;
    const s = document.createElement('style');
    s.id = 'nt-faq-styles';
    s.textContent = `
        .nt-faq { max-width:800px; margin:0 auto; }

        /* Search */
        .nt-faq__search {
            margin-bottom:24px;
        }
        .nt-faq__search-input {
            width:100%; padding:12px 16px; border-radius:10px;
            border:1px solid rgba(255,255,255,.1);
            background:rgba(255,255,255,.04);
            color:#fff; font-size:15px; font-family:inherit;
            outline:none; transition:border-color .2s;
        }
        .nt-faq__search-input::placeholder { color:rgba(255,255,255,.3); }
        .nt-faq__search-input:focus { border-color:var(--nt-primary, #00d4ff); }

        /* Item */
        .nt-faq__item {
            border:1px solid rgba(255,255,255,.06);
            border-radius:12px; margin-bottom:8px;
            background:rgba(255,255,255,.02);
            overflow:hidden;
            transition:border-color .2s, background .2s, opacity .3s, max-height .3s;
        }
        .nt-faq__item:hover {
            border-color:rgba(255,255,255,.1);
            background:rgba(255,255,255,.03);
        }
        .nt-faq__item--open {
            border-color:rgba(0,212,255,.15);
            background:rgba(0,212,255,.03);
        }
        .nt-faq__item--hidden {
            display:none;
        }

        /* Question button */
        .nt-faq__question {
            width:100%; display:flex; align-items:center; justify-content:space-between;
            gap:16px; padding:16px 20px; border:none; background:none;
            color:#fff; font-size:15px; font-weight:600; text-align:left;
            cursor:pointer; font-family:inherit; line-height:1.4;
            transition:color .2s;
        }
        .nt-faq__question:hover { color:var(--nt-primary, #00d4ff); }
        .nt-faq__question:focus-visible {
            outline:2px solid var(--nt-primary, #00d4ff);
            outline-offset:-2px;
            border-radius:10px;
        }

        /* Chevron */
        .nt-faq__chevron {
            width:20px; height:20px; flex-shrink:0;
            transition:transform ${TRANSITION_DURATION}ms ease;
            color:rgba(255,255,255,.4);
        }
        .nt-faq__item--open .nt-faq__chevron {
            transform:rotate(180deg);
            color:var(--nt-primary, #00d4ff);
        }

        /* Answer panel */
        .nt-faq__answer {
            overflow:hidden;
            max-height:0;
            transition:max-height ${TRANSITION_DURATION}ms ease;
        }
        .nt-faq__answer-inner {
            padding:0 20px 16px;
            color:rgba(255,255,255,.6);
            font-size:14px; line-height:1.7;
        }
        .nt-faq__answer-inner p { margin:0 0 8px; }
        .nt-faq__answer-inner p:last-child { margin-bottom:0; }
        .nt-faq__answer-inner a {
            color:var(--nt-primary, #00d4ff); text-decoration:underline;
        }

        /* No results */
        .nt-faq__empty {
            text-align:center; padding:24px; color:rgba(255,255,255,.35);
            font-size:14px;
        }
    `;
    document.head.appendChild(s);
}

/* ===================================================================
   ACCORDION LOGIC
   =================================================================== */

/**
 * Build ARIA attributes and ensure proper structure for each item.
 */
function prepareItem(item, index) {
    const question = item.querySelector('.nt-faq__question');
    const answer = item.querySelector('.nt-faq__answer');
    if (!question || !answer) return;

    // Generate unique IDs
    const qId = `nt-faq-q-${index}`;
    const aId = `nt-faq-a-${index}`;

    question.id = qId;
    question.setAttribute('aria-expanded', 'false');
    question.setAttribute('aria-controls', aId);

    answer.id = aId;
    answer.setAttribute('role', 'region');
    answer.setAttribute('aria-labelledby', qId);

    // Ensure answer has inner wrapper
    if (!answer.querySelector('.nt-faq__answer-inner')) {
        const inner = document.createElement('div');
        inner.className = 'nt-faq__answer-inner';
        while (answer.firstChild) inner.appendChild(answer.firstChild);
        answer.appendChild(inner);
    }

    // Ensure chevron exists
    if (!question.querySelector('.nt-faq__chevron')) {
        const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        chevron.classList.add('nt-faq__chevron');
        chevron.setAttribute('viewBox', '0 0 24 24');
        chevron.setAttribute('fill', 'none');
        chevron.setAttribute('stroke', 'currentColor');
        chevron.setAttribute('stroke-width', '2');
        chevron.setAttribute('stroke-linecap', 'round');
        chevron.setAttribute('stroke-linejoin', 'round');
        chevron.innerHTML = '<polyline points="6 9 12 15 18 9"></polyline>';
        question.appendChild(chevron);
    }

    // Ensure answer is closed initially
    answer.style.maxHeight = '0';
}

/**
 * Toggle an FAQ item open/closed.
 */
function toggleItem(item, forceOpen) {
    const question = item.querySelector('.nt-faq__question');
    const answer = item.querySelector('.nt-faq__answer');
    if (!question || !answer) return;

    const isOpen = item.classList.contains('nt-faq__item--open');
    const shouldOpen = forceOpen !== undefined ? forceOpen : !isOpen;

    if (shouldOpen && !isOpen) {
        // Close other items if single-open mode
        if (SINGLE_OPEN) {
            for (const otherItem of items) {
                if (otherItem !== item && otherItem.classList.contains('nt-faq__item--open')) {
                    closeItem(otherItem);
                }
            }
        }
        openItem(item);
    } else if (!shouldOpen && isOpen) {
        closeItem(item);
    }
}

function openItem(item) {
    const question = item.querySelector('.nt-faq__question');
    const answer = item.querySelector('.nt-faq__answer');
    const inner = answer.querySelector('.nt-faq__answer-inner');
    if (!inner) return;

    item.classList.add('nt-faq__item--open');
    question.setAttribute('aria-expanded', 'true');

    // Animate height: measure inner content, set max-height
    const targetHeight = inner.scrollHeight;
    answer.style.maxHeight = targetHeight + 'px';

    // After transition, set auto for dynamic content
    const onEnd = () => {
        answer.removeEventListener('transitionend', onEnd);
        if (item.classList.contains('nt-faq__item--open')) {
            answer.style.maxHeight = 'none';
        }
    };
    answer.addEventListener('transitionend', onEnd);
}

function closeItem(item) {
    const question = item.querySelector('.nt-faq__question');
    const answer = item.querySelector('.nt-faq__answer');
    const inner = answer.querySelector('.nt-faq__answer-inner');
    if (!inner) return;

    // Set explicit height first (from auto) so transition works
    answer.style.maxHeight = inner.scrollHeight + 'px';
    // Force reflow
    void answer.offsetHeight;
    // Then collapse
    answer.style.maxHeight = '0';

    item.classList.remove('nt-faq__item--open');
    question.setAttribute('aria-expanded', 'false');
}

/* ===================================================================
   SEARCH / FILTER
   =================================================================== */

function createSearchInput() {
    const searchWrapper = document.createElement('div');
    searchWrapper.className = 'nt-faq__search';
    searchWrapper.innerHTML = `
        <input type="text" class="nt-faq__search-input"
               placeholder="Search FAQ..." aria-label="Search frequently asked questions" />
    `;

    containerEl.insertBefore(searchWrapper, containerEl.firstChild);
    searchInput = searchWrapper.querySelector('.nt-faq__search-input');

    const handler = () => {
        filterItems(searchInput.value.trim().toLowerCase());
    };
    searchInput.addEventListener('input', handler);
    boundHandlers.push({ el: searchInput, event: 'input', fn: handler });
}

function filterItems(query) {
    let visibleCount = 0;

    for (const item of items) {
        const questionText = (item.querySelector('.nt-faq__question span') || item.querySelector('.nt-faq__question')).textContent.toLowerCase();
        const answerInner = item.querySelector('.nt-faq__answer-inner');
        const answerText = answerInner ? answerInner.textContent.toLowerCase() : '';

        const matches = !query || questionText.includes(query) || answerText.includes(query);

        if (matches) {
            item.classList.remove('nt-faq__item--hidden');
            visibleCount++;
        } else {
            item.classList.add('nt-faq__item--hidden');
            // Close hidden items
            if (item.classList.contains('nt-faq__item--open')) {
                closeItem(item);
            }
        }
    }

    // Show/hide empty state
    let emptyEl = containerEl.querySelector('.nt-faq__empty');
    if (visibleCount === 0 && query) {
        if (!emptyEl) {
            emptyEl = document.createElement('div');
            emptyEl.className = 'nt-faq__empty';
            emptyEl.textContent = 'No matching questions found.';
            containerEl.appendChild(emptyEl);
        }
        emptyEl.style.display = '';
    } else if (emptyEl) {
        emptyEl.style.display = 'none';
    }
}

/* ===================================================================
   INIT / DESTROY
   =================================================================== */

/**
 * Initialize FAQ accordion.
 * @param {string} containerId — ID of the FAQ container.
 */
export function init(containerId = 'faq-section') {
    injectStyles();

    containerEl = document.getElementById(containerId);
    if (!containerEl) return;

    containerEl.classList.add('nt-faq');
    items = Array.from(containerEl.querySelectorAll('[data-faq], .nt-faq__item'));
    if (items.length === 0) return;

    // Prepare each item
    items.forEach((item, i) => prepareItem(item, i));

    // Bind click and keyboard handlers
    for (const item of items) {
        const question = item.querySelector('.nt-faq__question');
        if (!question) continue;

        const clickHandler = (e) => {
            e.preventDefault();
            toggleItem(item);
        };

        const keyHandler = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleItem(item);
            }
        };

        question.addEventListener('click', clickHandler);
        question.addEventListener('keydown', keyHandler);

        boundHandlers.push({ el: question, event: 'click', fn: clickHandler });
        boundHandlers.push({ el: question, event: 'keydown', fn: keyHandler });
    }

    // Create search input
    createSearchInput();
}

export function destroy() {
    // Unbind all handlers
    for (const { el, event, fn } of boundHandlers) {
        el.removeEventListener(event, fn);
    }
    boundHandlers = [];

    // Remove search input
    const searchWrapper = containerEl ? containerEl.querySelector('.nt-faq__search') : null;
    if (searchWrapper) searchWrapper.remove();

    // Remove empty state
    const emptyEl = containerEl ? containerEl.querySelector('.nt-faq__empty') : null;
    if (emptyEl) emptyEl.remove();

    // Reset items
    for (const item of items) {
        item.classList.remove('nt-faq__item--open', 'nt-faq__item--hidden');
        const answer = item.querySelector('.nt-faq__answer');
        if (answer) answer.style.maxHeight = '';
    }

    items = [];
    containerEl = null;
    searchInput = null;

    const styleEl = document.getElementById('nt-faq-styles');
    if (styleEl) styleEl.remove();
}
