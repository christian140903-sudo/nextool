/* Soul — gemeinsames UI-Verhalten: Lesefortschritt, Scroll-Reveal,
 * Kopier-Buttons auf Code-Blöcken, aktiver Eintrag im Inhaltsverzeichnis.
 * Alles progressiv: ohne JS bleibt die Seite vollständig lesbar.
 */
(function () {
  "use strict";

  var reduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion:reduce)").matches;

  /* Lesefortschritt */
  var bar = document.getElementById("progress");
  if (bar) {
    var onScroll = function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    };
    document.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* Scroll-Reveal */
  var revs = [].slice.call(document.querySelectorAll(".rev"));
  var show = function (el) {
    el.classList.add("vis");
  };
  if (reduced || !("IntersectionObserver" in window)) {
    revs.forEach(show);
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            show(en.target);
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -5% 0px" },
    );
    revs.forEach(function (e) {
      io.observe(e);
    });
  }

  /* Kopier-Buttons: jeder .copywrap bekommt einen Button, der den Text des
   * enthaltenen Code-Blocks in die Zwischenablage legt. */
  [].slice
    .call(document.querySelectorAll(".copywrap"))
    .forEach(function (wrap) {
      var src = wrap.querySelector(".code-block, .term .body, pre");
      if (!src) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "copy";
      btn.textContent = "kopieren";
      btn.setAttribute("aria-label", "Befehl in die Zwischenablage kopieren");
      btn.addEventListener("click", function () {
        var text = (src.innerText || src.textContent || "")
          .replace(/^\s*\$\s?/gm, "")
          .trim();
        var done = function (ok) {
          btn.textContent = ok ? "kopiert" : "fehlgeschlagen";
          btn.classList.toggle("done", ok);
          setTimeout(function () {
            btn.textContent = "kopieren";
            btn.classList.remove("done");
          }, 1800);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(
            function () {
              done(true);
            },
            function () {
              done(false);
            },
          );
        } else {
          done(false);
        }
      });
      wrap.appendChild(btn);
    });

  /* Aktiver Eintrag im Inhaltsverzeichnis (docs.html) */
  var toc = document.querySelector(".toc");
  if (toc && "IntersectionObserver" in window) {
    var links = [].slice.call(toc.querySelectorAll('a[href^="#"]'));
    var byId = {};
    var targets = [];
    links.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      var t = document.getElementById(id);
      if (t) {
        byId[id] = a;
        targets.push(t);
      }
    });
    var visible = {};
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          visible[en.target.id] = en.isIntersecting;
        });
        var current = null;
        for (var i = 0; i < targets.length; i++) {
          if (visible[targets[i].id]) {
            current = targets[i].id;
            break;
          }
        }
        links.forEach(function (a) {
          a.classList.remove("active");
        });
        if (current && byId[current]) byId[current].classList.add("active");
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 },
    );
    targets.forEach(function (t) {
      spy.observe(t);
    });
  }

  /* Inhaltsverzeichnis: auf schmalen Displays eingeklappt, ab 960px offen.
   * Ohne JavaScript bleibt es offen — lesbar ist wichtiger als kompakt. */
  var tocWrap = document.querySelector(".toc-wrap");
  if (tocWrap && window.matchMedia) {
    var wide = window.matchMedia("(min-width: 960px)");
    var syncToc = function () {
      tocWrap.open = wide.matches;
    };
    syncToc();
    if (wide.addEventListener) wide.addEventListener("change", syncToc);
    else if (wide.addListener) wide.addListener(syncToc);

    // Nach einem Sprung ins Dokument schliesst sich das Verzeichnis wieder,
    // damit der Zielabschnitt nicht unterhalb einer offenen Liste liegt.
    tocWrap.addEventListener("click", function (e) {
      if (!wide.matches && e.target.closest(".toc a")) tocWrap.open = false;
    });
  }

  /* Jahreszahl im Footer */
  [].slice
    .call(document.querySelectorAll("[data-year]"))
    .forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
})();
