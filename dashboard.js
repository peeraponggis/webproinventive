/* =========================================================
   Project Dashboard — ผลงานติดตั้งและออกแบบระบบ
   ---------------------------------------------------------
   Renders the homepage project dashboard: a stylized Thailand
   map with project markers, count-up stat tiles, radial
   gauges, a simulated daily production curve and a top-project
   bar chart. Figures come from the company profile; the live
   output number and the daily curve are clearly-labelled
   simulations derived from total installed capacity.
   ========================================================= */
(function () {
    "use strict";

    /* ---- data (company profile) — kWp, type: i=installed, d=design ---- */
    var PROJECTS = [
        { n: "Big C กำแพงเพชร", kw: 2343.6, t: "i", p: "กำแพงเพชร", x: 160, y: 210 },
        { n: "Big C Market สีคิ้ว", kw: 390.6, t: "i", p: "นครราชสีมา", x: 262, y: 228 },
        { n: "Big C Market คู้บอน", kw: 195.3, t: "i", p: "นนทบุรี", x: 190, y: 296 },
        { n: "Big C Food Service สนามบินน้ำ", kw: 195.3, t: "i", p: "นนทบุรี", x: 190, y: 296 },
        { n: "โรงเรียนวิจิตราพิทยา", kw: 123, t: "i", p: "อุบลราชธานี", x: 345, y: 213 },
        { n: "โรงเรียนอนุบาลบ้านหนือ (BESS)", kw: 123, t: "i", p: "อุบลราชธานี", x: 345, y: 213 },
        { n: "ร้านอะไหล่ PK เสลภูมิ (Hybrid)", kw: 10.44, t: "i", p: "ร้อยเอ็ด", x: 302, y: 162 },
        { n: "Level9 Co., Ltd.", kw: 5.67, t: "i", p: "กรุงเทพมหานคร", x: 200, y: 312 },
        { n: "บมจ. นิตโต เดนโกะ (ประเทศไทย)", kw: 999.57, t: "d", p: null },
        { n: "โรงเรียนอนุบาลอุบลราชธานี", kw: 999.18, t: "d", p: "อุบลราชธานี", x: 345, y: 213 },
        { n: "ร.ร.จุฬาภรณราชวิทยาลัย เพชรบุรี", kw: 700.47, t: "d", p: "เพชรบุรี", x: 170, y: 352 },
        { n: "โรงพยาบาลชะอำ", kw: 451.5, t: "d", p: "เพชรบุรี", x: 170, y: 352 },
        { n: "โรงพยาบาลราชเวช เชียงใหม่", kw: 451.5, t: "d", p: "เชียงใหม่", x: 126, y: 92 },
        { n: "โรงแรมโซ โซฟิเทล หัวหิน", kw: 450, t: "d", p: "ประจวบคีรีขันธ์", x: 168, y: 392 },
        { n: "บจก. เจริญมงคล ฟู้ดส์ฯ", kw: 393.45, t: "d", p: null },
        { n: "บจก. ยูพีพี อัลทิเมท แพคกิ้ง", kw: 321.21, t: "d", p: null },
        { n: "โรงเรียนศรีเมืองวิทยาคาร", kw: 198.9, t: "d", p: "อุบลราชธานี", x: 345, y: 213 },
        { n: "มหาวิทยาลัยนอร์ท-เชียงใหม่", kw: 190.92, t: "d", p: "เชียงใหม่", x: 126, y: 92 },
        { n: "โรงเรียนโพธิ์ไทรพิทยาคาร", kw: 127.8, t: "d", p: "อุบลราชธานี", x: 345, y: 213 },
        { n: "เอกรัฐวิศวกรรม ฉะเชิงเทรา", kw: 67.2, t: "d", p: "ฉะเชิงเทรา", x: 240, y: 308 }
    ];

    /* stylized Thailand outline (not to scale) */
    var TH_PATH =
        "M150 18 L170 28 L185 20 L200 35 L196 55 L215 60 L225 50 L240 62 L238 84 " +
        "L258 92 L300 84 L318 100 L352 108 L368 130 L362 158 L372 188 L352 214 " +
        "L356 238 L330 252 L300 244 L280 258 L256 250 L252 270 L270 292 L300 300 " +
        "L322 318 L310 338 L282 330 L256 344 L230 332 L218 318 L208 332 L214 360 " +
        "L200 380 L206 410 L188 432 L196 462 L180 490 L186 520 L172 548 L178 578 " +
        "L162 606 L168 636 L152 664 L140 692 L128 668 L134 640 L122 610 L130 580 " +
        "L120 548 L128 516 L118 486 L128 458 L118 428 L130 400 L124 372 L138 348 " +
        "L130 320 L142 300 L136 272 L120 262 L108 238 L118 214 L104 196 L116 172 " +
        "L102 150 L112 124 L100 100 L114 76 L108 52 L126 40 Z";

    var GOLD = "#e3b93f";
    var BLUE = "#7fb6ff";

    function t(key) {
        return window.I18N ? window.I18N.t(key) : key;
    }

    function fmt(n, dec) {
        return n.toLocaleString(undefined, {
            minimumFractionDigits: dec || 0,
            maximumFractionDigits: dec || 0
        });
    }

    var root = document.getElementById("projDash");
    if (!root) return;

    var installed = PROJECTS.filter(function (p) { return p.t === "i"; });
    var designed = PROJECTS.filter(function (p) { return p.t === "d"; });
    var kwInstalled = installed.reduce(function (a, p) { return a + p.kw; }, 0);
    var kwDesigned = designed.reduce(function (a, p) { return a + p.kw; }, 0);
    var provinces = {};
    PROJECTS.forEach(function (p) { if (p.p) provinces[p.p] = 1; });

    /* ---------------- map ---------------- */

    function buildMap() {
        var host = document.getElementById("pdMap");
        var tip = document.getElementById("pdTip");
        if (!host) return;

        var NS = "http://www.w3.org/2000/svg";
        var svg = document.createElementNS(NS, "svg");
        svg.setAttribute("viewBox", "70 0 320 720");

        var land = document.createElementNS(NS, "path");
        land.setAttribute("d", TH_PATH);
        land.setAttribute("class", "pd-land");
        svg.appendChild(land);

        /* group projects sharing a pin */
        var spots = {};
        PROJECTS.forEach(function (p) {
            if (p.x === undefined) return;
            var key = p.x + "," + p.y;
            (spots[key] = spots[key] || { x: p.x, y: p.y, items: [] }).items.push(p);
        });

        Object.keys(spots).forEach(function (key) {
            var s = spots[key];
            var hasInstall = s.items.some(function (p) { return p.t === "i"; });
            var color = hasInstall ? GOLD : BLUE;

            var g = document.createElementNS(NS, "g");
            g.setAttribute("class", "pd-dot");

            var halo = document.createElementNS(NS, "circle");
            halo.setAttribute("cx", s.x); halo.setAttribute("cy", s.y);
            halo.setAttribute("r", 7); halo.setAttribute("fill", color);
            halo.setAttribute("class", "pd-halo");

            var dot = document.createElementNS(NS, "circle");
            dot.setAttribute("cx", s.x); dot.setAttribute("cy", s.y);
            dot.setAttribute("r", 5.5); dot.setAttribute("fill", color);
            dot.setAttribute("class", "pd-core");

            g.appendChild(halo);
            g.appendChild(dot);
            svg.appendChild(g);

            g.addEventListener("mouseenter", function () {
                if (!tip) return;
                var kw = s.items.reduce(function (a, p) { return a + p.kw; }, 0);
                var html = "<strong>" + s.items[0].p + " · " + fmt(kw, 2) + " kWp</strong>";
                s.items.forEach(function (p) {
                    var typ = p.t === "i" ? t("proj.install") : t("proj.design");
                    html += "<span><i style=\"background:" +
                        (p.t === "i" ? GOLD : BLUE) + "\"></i>" + p.n +
                        " — " + fmt(p.kw, 2) + " kWp (" + typ + ")</span>";
                });
                tip.innerHTML = html;
                tip.classList.add("show");
                var r = host.getBoundingClientRect();
                var box = g.getBoundingClientRect();
                var left = box.left - r.left + 16;
                if (left > r.width - 240) left = r.width - 240;
                tip.style.left = Math.max(6, left) + "px";
                tip.style.top = (box.top - r.top - 10) + "px";
            });
            g.addEventListener("mouseleave", function () {
                if (tip) tip.classList.remove("show");
            });
        });

        host.appendChild(svg);
    }

    /* ---------------- count-up helpers ---------------- */

    function countUp(el, target, dec, ms) {
        var start = null;
        function step(ts) {
            if (!start) start = ts;
            var k = Math.min(1, (ts - start) / (ms || 1400));
            var eased = 1 - Math.pow(1 - k, 3);
            el.textContent = fmt(target * eased, dec);
            if (k < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    function animateTiles() {
        root.querySelectorAll("[data-count]").forEach(function (el) {
            countUp(el, parseFloat(el.getAttribute("data-count")),
                parseInt(el.getAttribute("data-dec") || "0", 10));
        });
        root.querySelectorAll(".pd-gauge").forEach(function (g) {
            var pct = parseFloat(g.getAttribute("data-pct"));
            var ring = g.querySelector(".pd-ring");
            var c = 2 * Math.PI * 42;
            ring.style.strokeDasharray = c;
            ring.style.strokeDashoffset = c;
            requestAnimationFrame(function () {
                ring.style.transition = "stroke-dashoffset 1.6s cubic-bezier(0.2,0.8,0.2,1)";
                ring.style.strokeDashoffset = c * (1 - pct / 100);
            });
            countUp(g.querySelector(".pd-gauge-num"), pct, 0, 1600);
        });
        animateBars();
        drawCurve(true);
    }

    /* ---------------- top-project bars ---------------- */

    function animateBars() {
        var host = document.getElementById("pdBars");
        if (!host) return;
        host.innerHTML = "";
        var top = PROJECTS.slice().sort(function (a, b) { return b.kw - a.kw; }).slice(0, 7);
        var max = top[0].kw;
        top.forEach(function (p, i) {
            var row = document.createElement("div");
            row.className = "pd-bar-row";
            var name = document.createElement("span");
            name.className = "pd-bar-name";
            name.textContent = p.n;
            var track = document.createElement("div");
            track.className = "pd-bar-track";
            var bar = document.createElement("i");
            bar.style.background = p.t === "i" ? GOLD : BLUE;
            bar.style.transitionDelay = i * 90 + "ms";
            track.appendChild(bar);
            var val = document.createElement("span");
            val.className = "pd-bar-val";
            val.textContent = fmt(p.kw, p.kw < 100 ? 2 : 0);
            row.appendChild(name);
            row.appendChild(track);
            row.appendChild(val);
            host.appendChild(row);
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    bar.style.width = (p.kw / max) * 100 + "%";
                });
            });
        });
    }

    /* ---------------- simulated daily curve ---------------- */

    function dayFactor(h) {
        if (h < 6 || h > 18.5) return 0;
        var k = Math.sin(((h - 6) / 12.5) * Math.PI);
        return Math.max(0, Math.pow(k, 1.4));
    }

    function drawCurve(animate) {
        var svg = document.getElementById("pdCurve");
        if (!svg) return;
        svg.innerHTML = "";
        var NS = "http://www.w3.org/2000/svg";
        var W = 600, H = 170, PAD = 8;

        var pts = [];
        for (var h = 0; h <= 24; h += 0.25) {
            var x = (h / 24) * (W - PAD * 2) + PAD;
            var y = H - PAD - dayFactor(h) * (H - PAD * 2 - 14);
            pts.push([x, y]);
        }
        var line = pts.map(function (p, i) {
            return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1);
        }).join(" ");

        var area = document.createElementNS(NS, "path");
        area.setAttribute("d", line + " L" + (W - PAD) + " " + (H - PAD) + " L" + PAD + " " + (H - PAD) + " Z");
        area.setAttribute("class", "pd-area");
        svg.appendChild(area);

        var path = document.createElementNS(NS, "path");
        path.setAttribute("d", line);
        path.setAttribute("class", "pd-line");
        svg.appendChild(path);

        /* marker at the current time */
        var now = new Date();
        var hNow = now.getHours() + now.getMinutes() / 60;
        var cx = (hNow / 24) * (W - PAD * 2) + PAD;
        var cy = H - PAD - dayFactor(hNow) * (H - PAD * 2 - 14);
        var nowLine = document.createElementNS(NS, "line");
        nowLine.setAttribute("x1", cx); nowLine.setAttribute("x2", cx);
        nowLine.setAttribute("y1", PAD); nowLine.setAttribute("y2", H - PAD);
        nowLine.setAttribute("class", "pd-nowline");
        svg.appendChild(nowLine);
        var dot = document.createElementNS(NS, "circle");
        dot.setAttribute("cx", cx); dot.setAttribute("cy", cy);
        dot.setAttribute("r", 5);
        dot.setAttribute("class", "pd-nowdot");
        svg.appendChild(dot);

        if (animate) {
            var len = path.getTotalLength();
            path.style.strokeDasharray = len;
            path.style.strokeDashoffset = len;
            area.style.opacity = 0;
            requestAnimationFrame(function () {
                path.style.transition = "stroke-dashoffset 2s ease";
                path.style.strokeDashoffset = 0;
                area.style.transition = "opacity 1.2s ease 0.8s";
                area.style.opacity = 1;
            });
        }
    }

    /* ---------------- live simulated output ---------------- */

    function liveTick() {
        var numEl = document.getElementById("pdLiveNum");
        var barEl = document.getElementById("pdLiveBar");
        var clockEl = document.getElementById("pdClock");
        if (!numEl) return;

        var now = new Date();
        var h = now.getHours() + now.getMinutes() / 60;
        var f = dayFactor(h);
        var noise = 0.93 + Math.random() * 0.1;
        var kw = kwInstalled * 0.82 * f * noise; /* PR ~0.82 */
        numEl.textContent = fmt(kw, 0);
        if (barEl) barEl.style.width = Math.min(100, f * noise * 100) + "%";
        if (clockEl) {
            clockEl.textContent = now.toLocaleTimeString(
                window.I18N && I18N.get() === "en" ? "en-GB" : "th-TH",
                { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        }
    }

    /* ---------------- boot ---------------- */

    buildMap();
    liveTick();
    setInterval(liveTick, 2000);
    setInterval(function () { drawCurve(false); }, 60000);

    var fired = false;
    function fire() {
        if (fired) return;
        fired = true;
        animateTiles();
        window.removeEventListener("scroll", maybeFire);
    }
    function maybeFire() {
        var r = root.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.85 && r.bottom > 0) fire();
    }
    /* IntersectionObserver when available, plus a plain scroll fallback
       (some prerendering/hidden contexts never deliver IO callbacks) */
    if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) {
                    fire();
                    io.disconnect();
                }
            });
        }, { threshold: 0.2 });
        io.observe(root);
    }
    window.addEventListener("scroll", maybeFire, { passive: true });
    maybeFire();

    document.addEventListener("i18n:change", function () {
        /* bar labels and tooltips read the dictionary lazily; redraw bars */
        if (fired) animateBars();
    });
})();
