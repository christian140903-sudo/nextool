/**
 * NexTool Typewriter
 * -----------------------------------------------------------------------
 * Typewriter text effect for headlines. Types character by character with
 * variable speed, blinking cursor, cycling messages, and IntersectionObserver.
 * Supports HTML content (skips tags, types only visible text).
 *
 * Usage:
 *   <h1 data-typewriter data-texts='["You describe it.", "AI builds it.", "You own it."]' data-loop="true"></h1>
 *
 * @module features/typewriter
 * @exports init, destroy
 */

/* ===================================================================
   CONFIG
   =================================================================== */

const BASE_SPEED = 55;           // Base ms per character
const FAST_SPEED = 25;           // Speed for spaces
const SLOW_SPEED = 120;          // Speed for punctuation (.,!?)
const DELETE_SPEED = 30;         // Speed when deleting
const PAUSE_AFTER_TYPE = 2000;   // Pause after typing a full string (ms)
const PAUSE_AFTER_DELETE = 500;  // Pause after deleting before next string
const CURSOR_BLINK_CLASS = 'nt-tw__cursor';

/* ===================================================================
   STATE
   =================================================================== */

let instances = [];
let observer = null;

/* ===================================================================
   STYLES
   =================================================================== */

function injectStyles() {
    if (document.getElementById('nt-typewriter-styles')) return;
    const s = document.createElement('style');
    s.id = 'nt-typewriter-styles';
    s.textContent = `
        [data-typewriter] {
            position:relative;
            display:inline;
        }

        .nt-tw__cursor {
            display:inline-block;
            width:3px;
            height:1em;
            background:var(--nt-primary, #00d4ff);
            margin-left:2px;
            vertical-align:text-bottom;
            animation:nt-tw-blink .8s step-end infinite;
        }

        @keyframes nt-tw-blink {
            0%, 100% { opacity:1; }
            50% { opacity:0; }
        }

        @media(prefers-reduced-motion:reduce) {
            .nt-tw__cursor { animation:none; }
        }
    `;
    document.head.appendChild(s);
}

/* ===================================================================
   TYPEWRITER INSTANCE
   =================================================================== */

class TypewriterInstance {
    constructor(el) {
        this.el = el;
        this.texts = this._parseTexts();
        this.loop = el.dataset.loop === 'true';
        this.currentIndex = 0;
        this.isRunning = false;
        this.aborted = false;
        this.cursor = null;
        this.hasStarted = false;

        // Store original content as the first text if no data-texts
        if (this.texts.length === 0) {
            const original = el.innerHTML.trim();
            if (original) {
                this.texts = [original];
            } else {
                this.texts = [''];
            }
        }

        // Clear content initially
        this.el.innerHTML = '';
        this._createCursor();
    }

    _parseTexts() {
        const raw = this.el.dataset.texts;
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
        } catch (_) {}
        return [];
    }

    _createCursor() {
        this.cursor = document.createElement('span');
        this.cursor.className = CURSOR_BLINK_CLASS;
        this.cursor.setAttribute('aria-hidden', 'true');
        this.el.appendChild(this.cursor);
    }

    /**
     * Extract visible text from an HTML string, preserving the mapping
     * between visible character index and full HTML structure.
     */
    _getVisibleChars(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        const text = div.textContent || div.innerText || '';
        return text;
    }

    /**
     * Build HTML incrementally: type up to `count` visible characters.
     * HTML tags are included/excluded atomically (not character-by-character).
     */
    _buildPartialHTML(html, visibleCount) {
        let visible = 0;
        let result = '';
        let inTag = false;

        for (let i = 0; i < html.length; i++) {
            const ch = html[i];

            if (ch === '<') {
                inTag = true;
                // Find the entire tag and include it
                const tagEnd = html.indexOf('>', i);
                if (tagEnd !== -1) {
                    result += html.substring(i, tagEnd + 1);
                    i = tagEnd;
                    inTag = false;
                    continue;
                }
            }

            if (!inTag) {
                if (visible < visibleCount) {
                    result += ch;
                    visible++;
                } else {
                    break;
                }
            }
        }

        return result;
    }

    /**
     * Get typing speed for a character.
     */
    _speedForChar(ch) {
        if (ch === ' ' || ch === '\n') return FAST_SPEED;
        if ('.!?,;:'.includes(ch)) return SLOW_SPEED;
        return BASE_SPEED + Math.random() * 30;
    }

    /**
     * Wait utility with abort support.
     */
    _wait(ms) {
        return new Promise((resolve) => {
            if (this.aborted) { resolve(); return; }
            const id = setTimeout(resolve, ms);
            this._currentTimeout = id;
        });
    }

    /**
     * Type out a string character by character.
     */
    async _typeText(html) {
        const visibleText = this._getVisibleChars(html);
        const totalVisible = visibleText.length;

        for (let i = 1; i <= totalVisible; i++) {
            if (this.aborted) return;

            const partial = this._buildPartialHTML(html, i);
            this._setContent(partial);

            const ch = visibleText[i - 1];
            await this._wait(this._speedForChar(ch));
        }
    }

    /**
     * Delete the current text character by character.
     */
    async _deleteText(html) {
        const visibleText = this._getVisibleChars(html);
        const totalVisible = visibleText.length;

        for (let i = totalVisible - 1; i >= 0; i--) {
            if (this.aborted) return;

            const partial = this._buildPartialHTML(html, i);
            this._setContent(partial);

            await this._wait(DELETE_SPEED);
        }
    }

    /**
     * Set element content while preserving the cursor.
     */
    _setContent(html) {
        // Remove cursor temporarily
        if (this.cursor && this.cursor.parentNode) {
            this.cursor.parentNode.removeChild(this.cursor);
        }
        this.el.innerHTML = html;
        // Re-append cursor
        if (this.cursor) {
            this.el.appendChild(this.cursor);
        }
    }

    /**
     * Start the typewriter animation.
     */
    async start() {
        if (this.isRunning || this.hasStarted) return;
        this.isRunning = true;
        this.hasStarted = true;

        if (this.texts.length === 1 && !this.loop) {
            // Single text: just type it once
            await this._typeText(this.texts[0]);
            this.isRunning = false;
            return;
        }

        // Multiple texts: type, pause, delete, next
        while (!this.aborted) {
            const text = this.texts[this.currentIndex];

            await this._typeText(text);
            if (this.aborted) break;

            await this._wait(PAUSE_AFTER_TYPE);
            if (this.aborted) break;

            await this._deleteText(text);
            if (this.aborted) break;

            await this._wait(PAUSE_AFTER_DELETE);
            if (this.aborted) break;

            this.currentIndex = (this.currentIndex + 1) % this.texts.length;

            // If not looping and we've gone through all texts, stop
            if (!this.loop && this.currentIndex === 0) {
                // Type the first one last time and stop
                await this._typeText(this.texts[0]);
                break;
            }
        }

        this.isRunning = false;
    }

    /**
     * Stop and clean up.
     */
    stop() {
        this.aborted = true;
        if (this._currentTimeout) {
            clearTimeout(this._currentTimeout);
            this._currentTimeout = null;
        }
        this.isRunning = false;
    }

    /**
     * Full cleanup: remove cursor, restore original content.
     */
    destroy() {
        this.stop();
        if (this.cursor && this.cursor.parentNode) {
            this.cursor.parentNode.removeChild(this.cursor);
        }
        // Restore last full text or first text
        if (this.texts.length > 0) {
            this.el.innerHTML = this.texts[this.currentIndex] || this.texts[0];
        }
    }
}

/* ===================================================================
   INIT / DESTROY
   =================================================================== */

/**
 * Initialize typewriter on all matching elements.
 * @param {string} selector — CSS selector for elements.
 */
export function init(selector = '[data-typewriter]') {
    injectStyles();

    const elements = document.querySelectorAll(selector);
    if (elements.length === 0) return;

    // Respect reduced motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
        // Show final text immediately
        elements.forEach(el => {
            const raw = el.dataset.texts;
            if (raw) {
                try {
                    const texts = JSON.parse(raw);
                    if (Array.isArray(texts) && texts.length > 0) {
                        el.innerHTML = texts[0];
                    }
                } catch (_) {}
            }
        });
        return;
    }

    // Create instances
    for (const el of elements) {
        const instance = new TypewriterInstance(el);
        instances.push(instance);
    }

    // Use IntersectionObserver to start typing when visible
    observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                const instance = instances.find(inst => inst.el === entry.target);
                if (instance && !instance.hasStarted) {
                    instance.start();
                }
            }
        }
    }, { threshold: 0.3 });

    for (const instance of instances) {
        observer.observe(instance.el);
    }
}

export function destroy() {
    if (observer) {
        observer.disconnect();
        observer = null;
    }

    for (const instance of instances) {
        instance.destroy();
    }
    instances = [];

    const styleEl = document.getElementById('nt-typewriter-styles');
    if (styleEl) styleEl.remove();
}
