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
        startMenu();
        piOpeners();
        homeDash();
    }

    function t(key) {
        return window.I18N ? window.I18N.t(key) : key;
    }

    /* ---------- "เริ่มใช้ฟรี" start menu ---------- */
    function startMenu() {
        var buttons = document.querySelectorAll(".btn-start");
        if (!buttons.length) return;

        var overlay = null;

        function item(icon, titleKey, descKey, href, extraCls, wip) {
            var titleTxt = t(titleKey) + (wip ? " " + t("start.wip") : "");
            return (
                '<a class="dd-item ' + (extraCls || "") + '" href="' + href + '"' +
                (href.indexOf("http") === 0 ? ' target="_blank" rel="noopener"' : "") + ">" +
                '<span class="dd-ico">' + icon + "</span><span>" +
                '<span class="dd-title">' + titleTxt + "</span>" +
                '<span class="dd-desc">' + t(descKey) + "</span>" +
                "</span></a>"
            );
        }

        function open() {
            close();
            overlay = document.createElement("div");
            overlay.className = "auth-overlay start-overlay open";
            overlay.innerHTML =
                '<div class="auth-card start-card" role="dialog" aria-modal="true">' +
                '<button type="button" class="auth-x" aria-label="close">' +
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
                "</button>" +
                '<h3 class="auth-title">' + t("hero.cta1") + "</h3>" +
                '<div class="start-items">' +
                item("📄", "start.docs.t", "dd.docs.d", "#") +
                item("✨", "dd.ai.t", "dd.ai.d", "#", "js-open-pi") +
                item("🗂️", "dd.project.t", "dd.project.d", "#", "", true) +
                item("☀️", "SaaS", "saas.main.d", "https://web-production-359eb.up.railway.app") +
                "</div></div>";
            document.body.appendChild(overlay);

            overlay.addEventListener("click", function (e) {
                if (e.target === overlay || e.target.closest(".auth-x")) close();
                if (e.target.closest(".dd-item")) close();
            });
        }

        function close() {
            if (overlay) {
                overlay.remove();
                overlay = null;
            }
        }

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") close();
        });

        buttons.forEach(function (btn) {
            btn.addEventListener("click", function (e) {
                e.preventDefault();
                open();
            });
        });
    }

    /* ---------- anything with .js-open-pi opens the Pi console ---------- */
    function piOpeners() {
        document.addEventListener("click", function (e) {
            var el = e.target.closest(".js-open-pi");
            if (!el) return;
            e.preventDefault();
            if (window.PiConsole) window.PiConsole.open();
        });
    }

    /* ---------- live "today's summary" inside the hero mockup ---------- */
    function homeDash() {
        var box = document.getElementById("homeDash");
        if (!box) return;
        var usersEl = document.getElementById("homeDashUsers");

        function fill() {
            var board = [];
            try {
                board = JSON.parse(localStorage.getItem("pi_tasks_board_v2") || "[]");
            } catch (e) {
                board = [];
            }
            if (!Array.isArray(board)) board = [];

            var counts = { todo: 0, doing: 0, review: 0, done: 0 };
            var users = {};
            var today = new Date().toDateString();

            board.forEach(function (c) {
                if (counts[c.col] !== undefined) counts[c.col]++;
                var name = c.owner || "—";
                var u = (users[name] = users[name] || { doneToday: 0, last: 0 });
                if (c.moved > u.last) u.last = c.moved;
                if (c.col === "done" && new Date(c.moved).toDateString() === today)
                    u.doneToday++;
            });

            Object.keys(counts).forEach(function (k) {
                var el = box.querySelector('[data-dash="' + k + '"]');
                if (el) el.textContent = counts[k];
            });

            if (!usersEl) return;
            usersEl.innerHTML = "";
            var names = Object.keys(users).sort(function (a, b) {
                return users[b].last - users[a].last;
            });
            if (!names.length) {
                var empty = document.createElement("div");
                empty.className = "mkd-empty";
                empty.textContent = t("dash.empty");
                usersEl.appendChild(empty);
                return;
            }
            var lang = window.I18N && I18N.get() === "en" ? "en-GB" : "th-TH";
            names.slice(0, 4).forEach(function (name) {
                var row = document.createElement("div");
                row.className = "mk-row";
                var when = "";
                try {
                    when = new Intl.DateTimeFormat(lang, {
                        day: "numeric", month: "short",
                        hour: "2-digit", minute: "2-digit"
                    }).format(new Date(users[name].last));
                } catch (e) { /* keep empty */ }
                ["👤 " + name, String(users[name].doneToday), when].forEach(function (txt) {
                    var sp = document.createElement("span");
                    sp.textContent = txt;
                    row.appendChild(sp);
                });
                usersEl.appendChild(row);
            });
        }

        fill();
        document.addEventListener("i18n:change", fill);
        window.addEventListener("storage", fill);
        window.addEventListener("pageshow", fill);
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
