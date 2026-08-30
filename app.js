/* =========================================================
   PROINVENTIVE — page interactions
   ========================================================= */
(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", init);

    function init() {
        stickyHeader();
        mobileMenu();
        rotator();
        marquees();
        reveal();
    }

    /* ---------- Sticky header border ---------- */
    function stickyHeader() {
        var header = document.getElementById("site-header");
        if (!header) return;
        function onScroll() {
            header.classList.toggle("is-scrolled", window.scrollY > 8);
        }
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
    }

    /* ---------- Mobile menu ---------- */
    function mobileMenu() {
        var toggle = document.getElementById("navToggle");
        var menu = document.getElementById("mobileMenu");
        if (!toggle || !menu) return;

        toggle.addEventListener("click", function () {
            var open = menu.classList.toggle("open");
            toggle.setAttribute("aria-expanded", String(open));
            document.body.style.overflow = open ? "hidden" : "";
        });

        menu.addEventListener("click", function (e) {
            if (e.target.closest("a")) {
                menu.classList.remove("open");
                toggle.setAttribute("aria-expanded", "false");
                document.body.style.overflow = "";
            }
        });
    }

    /* ---------- Hero rotating word ---------- */
    function rotator() {
        var rot = document.getElementById("rotator");
        var word = document.getElementById("rotWord");
        if (!rot || !word) return;

        var dot = rot.querySelector(".dot");
        var palette = [
            { bg: "#ffddb8", dot: "#e07b39" },
            { bg: "#cfe3f7", dot: "#2b7fd4" },
            { bg: "#cfe9d8", dot: "#3f9b6a" },
            { bg: "#e2dcf5", dot: "#7b62d4" }
        ];
        var keys = ["rot.1", "rot.2", "rot.3", "rot.4"];
        var i = 0;

        function text(idx) {
            return window.I18N ? window.I18N.t(keys[idx]) : word.textContent;
        }

        function measure(str) {
            var probe = document.createElement("span");
            probe.textContent = str;
            probe.style.cssText =
                "position:absolute;visibility:hidden;white-space:nowrap;font:" +
                getComputedStyle(word).font;
            document.body.appendChild(probe);
            var w = probe.getBoundingClientRect().width;
            probe.remove();
            return w;
        }

        function lockWidth(str) {
            var style = getComputedStyle(rot);
            var extra =
                parseFloat(style.paddingLeft) +
                parseFloat(style.paddingRight) +
                dot.getBoundingClientRect().width +
                (parseFloat(style.gap) || 0);
            rot.style.width = measure(str) + extra + 2 + "px";
        }

        function paint(idx, animate) {
            word.textContent = text(idx);
            rot.style.background = palette[idx].bg;
            dot.style.background = palette[idx].dot;
            lockWidth(word.textContent);
            if (animate) {
                word.classList.remove("out");
                word.classList.add("in");
            }
        }

        paint(0, false);

        window.addEventListener("resize", function () {
            lockWidth(word.textContent);
        });

        document.addEventListener("i18n:change", function () {
            paint(i, false);
        });

        setInterval(function () {
            word.classList.remove("in");
            word.classList.add("out");
            setTimeout(function () {
                i = (i + 1) % keys.length;
                paint(i, true);
            }, 280);
        }, 2600);
    }

    /* ---------- Seamless marquees ---------- */
    function marquees() {
        ["logoTrack", "statTrack"].forEach(function (id) {
            var track = document.getElementById(id);
            if (!track || track.dataset.doubled) return;
            track.innerHTML += track.innerHTML;
            track.dataset.doubled = "1";
        });
    }

    /* ---------- Reveal on scroll ---------- */
    function reveal() {
        var items = document.querySelectorAll(".reveal");
        if (!items.length) return;

        if (!("IntersectionObserver" in window)) {
            items.forEach(function (el) {
                el.classList.add("visible");
            });
            return;
        }

        var io = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("visible");
                        io.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12 }
        );

        items.forEach(function (el, idx) {
            el.style.transitionDelay = (idx % 3) * 80 + "ms";
            io.observe(el);
        });
    }
})();
