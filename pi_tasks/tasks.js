/* =========================================================
   Pi Tasks — Kanban board
   ---------------------------------------------------------
   Phase 1 (now): local board, persisted in localStorage.
   Phase 2 (CRM/SaaS): mirror every change to a backend without
   touching the UI:

     PiTasks.configure({
       endpoint : "https://api.yourcrm.com/tasks",
       headers  : { Authorization: "Bearer …" },
       // optional full override — receives every mutation
       transport: async (event) => { … }
     });

   Mutation event shape:
     { type: "create"|"update"|"move"|"delete"|"reset",
       card: {id,title,col,mine,sprint}, from, to, board, ts }

   Also: PiTasks.getBoard() / setBoard(b) / on("change", fn)
   ========================================================= */
(function (global) {
    "use strict";

    var STORE = "pi_tasks_board_v2";
    var LIVE_KEY = "pi_tasks_live";

    var COLUMNS = [
        { id: "todo", key: "tk.c.todo", dot: "#9b59d0", pill: "#f3edfa", bg: "#faf8fc", text: "#6f4fc0" },
        { id: "doing", key: "tk.c.doing", dot: "#e0a93b", pill: "#fdf3e3", bg: "#fdfaf5", text: "#9a6a12" },
        { id: "review", key: "tk.c.review", dot: "#2b7fd4", pill: "#e8f1fc", bg: "#f7fafd", text: "#1c5fa8" },
        { id: "done", key: "tk.c.done", dot: "#3f9b6a", pill: "#e6f4ec", bg: "#f7fbf9", text: "#2c7a54" }
    ];

    /* the board ships empty, ready for real work */
    var SEED = [];

    var config = { endpoint: null, headers: {}, transport: null };
    var listeners = {};
    var board = [];
    var view = "all";
    var query = "";
    var live = true;
    var liveTimer = null;
    var dragging = null;
    var root, boardEl, timelineEl, dashEl, collabLayer;

    /* ---------------- utils ---------------- */

    function t(key) {
        return global.I18N ? global.I18N.t(key) : key;
    }

    function uid() {
        return "c" + (board.length + 1) + "_" + Math.random().toString(36).slice(2, 8);
    }

    function title(card) {
        return card.k ? t(card.k) : card.title || "";
    }

    function fmtDate(value) {
        if (!value) return "";
        var d = new Date(value);
        if (isNaN(d)) return "";
        var lang = global.I18N && I18N.get() === "en" ? "en-GB" : "th-TH";
        try {
            return new Intl.DateTimeFormat(lang, {
                day: "numeric",
                month: "short",
                year: "numeric"
            }).format(d);
        } catch (e) {
            return d.toLocaleDateString();
        }
    }

    function fmtDateTime(value) {
        if (!value) return "";
        var d = new Date(value);
        if (isNaN(d)) return "";
        var lang = global.I18N && I18N.get() === "en" ? "en-GB" : "th-TH";
        try {
            return new Intl.DateTimeFormat(lang, {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit"
            }).format(d);
        } catch (e) {
            return d.toLocaleString();
        }
    }

    function currentUserName() {
        var u = global.PiAuth && PiAuth.getUser();
        return u ? u.name : t("tk.guest");
    }

    function emit(name, payload) {
        (listeners[name] || []).forEach(function (fn) {
            try {
                fn(payload);
            } catch (e) {
                /* a listener must never break the board */
            }
        });
    }

    /* Phase-2 hook: every mutation is offered to the configured backend. */
    function sync(type, detail) {
        var event = Object.assign(
            { type: type, board: board.slice(), ts: Date.now() },
            detail || {}
        );
        emit("change", event);

        if (typeof config.transport === "function") {
            try {
                config.transport(event);
            } catch (e) {
                emit("error", e);
            }
            return;
        }
        if (config.endpoint) {
            fetch(config.endpoint, {
                method: "POST",
                headers: Object.assign(
                    { "Content-Type": "application/json" },
                    config.headers
                ),
                body: JSON.stringify(event)
            }).catch(function (err) {
                emit("error", err);
            });
        }
    }

    /* ---------------- persistence ---------------- */

    function load() {
        try {
            var raw = localStorage.getItem(STORE);
            if (raw) {
                var parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length) {
                    parsed.forEach(function (c) {
                        if (!c.moved) c.moved = Date.now();
                    });
                    return parsed;
                }
            }
        } catch (e) {
            /* fall through to seed */
        }
        return [];
    }

    function save() {
        try {
            localStorage.setItem(STORE, JSON.stringify(board));
        } catch (e) {
            /* storage unavailable — session-only board */
        }
    }

    /* ---------------- rendering ---------------- */

    function visible(card) {
        if (view === "dash") return true;
        if (view === "mine" && (card.owner || "") !== currentUserName()) return false;
        if (view === "sprint" && card.col !== "doing") return false;
        if (query && title(card).toLowerCase().indexOf(query) === -1) return false;
        return true;
    }

    /* switch tabs programmatically (also used after creating a card the
       current filter would hide, so the new card is never invisible) */
    function activateView(next) {
        view = next;
        document.querySelectorAll(".board-tabs button").forEach(function (b) {
            b.classList.toggle("active", b.dataset.view === next);
        });
        root.setAttribute(
            "data-view",
            next === "timeline" ? "timeline" : next === "dash" ? "dash" : "board"
        );
        render();
    }

    function cardsOf(colId) {
        return board.filter(function (c) {
            return c.col === colId && visible(c);
        });
    }

    function buildCard(card) {
        var el = document.createElement("article");
        el.className = "task";
        el.dataset.id = card.id;

        var titleEl = document.createElement("div");
        titleEl.className = "t-title";
        titleEl.textContent = title(card);
        titleEl.setAttribute("contenteditable", "true");
        titleEl.setAttribute("spellcheck", "false");
        el.appendChild(titleEl);

        {
            var meta = document.createElement("div");
            meta.className = "t-meta";
            var who = document.createElement("span");
            who.className = "t-chip user";
            who.textContent =
                "👤 " + (card.owner || currentUserName()) +
                " · " + fmtDateTime(card.moved);
            meta.appendChild(who);
            if (card.mine) {
                var m = document.createElement("span");
                m.className = "t-chip mine";
                m.textContent = t("tk.mine");
                meta.appendChild(m);
            }
            if (card.sprint) {
                var s = document.createElement("span");
                s.className = "t-chip sprint";
                s.textContent = t("tk.sprint");
                meta.appendChild(s);
            }
            el.appendChild(meta);
        }

        var del = document.createElement("button");
        del.type = "button";
        del.className = "t-del";
        del.title = t("tk.delete");
        del.setAttribute("aria-label", t("tk.delete"));
        del.innerHTML =
            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
        el.appendChild(del);

        /* --- inline edit --- */
        titleEl.addEventListener("focus", function () {
            el.style.cursor = "text";
        });
        titleEl.addEventListener("blur", function () {
            el.style.cursor = "";
            var next = titleEl.textContent.trim();
            var rec = find(card.id);
            if (!rec) return;
            if (!next) {
                titleEl.textContent = title(rec);
                return;
            }
            if (next !== title(rec)) {
                delete rec.k; /* edited cards stop following the dictionary */
                rec.title = next;
                save();
                sync("update", { card: rec });
            }
        });
        titleEl.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                titleEl.blur();
            }
            if (e.key === "Escape") {
                titleEl.textContent = title(find(card.id) || card);
                titleEl.blur();
            }
        });

        del.addEventListener("click", function (e) {
            e.stopPropagation();
            remove(card.id);
        });

        el.addEventListener("pointerdown", onPointerDown);

        return el;
    }

    function render() {
        boardEl.innerHTML = "";

        COLUMNS.forEach(function (col) {
            var wrap = document.createElement("section");
            wrap.className = "column";
            wrap.dataset.col = col.id;
            wrap.style.setProperty("--col-bg", col.bg);
            wrap.style.setProperty("--col-bg-strong", col.pill);
            wrap.style.setProperty("--col-dot", col.dot);
            wrap.style.setProperty("--col-pill", col.pill);
            wrap.style.setProperty("--col-text", col.text);

            var list = cardsOf(col.id);

            var head = document.createElement("div");
            head.className = "col-head";
            head.innerHTML =
                '<span class="col-pill"><span class="dot"></span><span class="col-name"></span></span>' +
                '<span class="col-count"></span>';
            head.querySelector(".col-name").textContent = t(col.key);
            head.querySelector(".col-count").textContent = list.length;
            wrap.appendChild(head);

            var body = document.createElement("div");
            body.className = "col-body";
            if (!list.length) {
                var empty = document.createElement("div");
                empty.className = "col-empty";
                empty.textContent = t("tk.empty");
                body.appendChild(empty);
            }
            list.forEach(function (card) {
                body.appendChild(buildCard(card));
            });
            wrap.appendChild(body);

            var add = document.createElement("button");
            add.type = "button";
            add.className = "col-add";
            add.innerHTML = "<span>+</span>";
            var label = document.createElement("span");
            label.textContent = t("tk.add");
            add.appendChild(label);
            add.addEventListener("click", function () {
                create(col.id);
            });
            wrap.appendChild(add);

            boardEl.appendChild(wrap);
        });

        renderTimeline();
        renderDash();
    }

    /* ---------------- dashboard: today's summary ---------------- */

    function renderDash() {
        if (!dashEl) return;
        dashEl.innerHTML = "";

        var counts = { todo: 0, doing: 0, review: 0, done: 0 };
        var users = {};
        var today = new Date().toDateString();
        var doneToday = 0;

        board.forEach(function (c) {
            if (counts[c.col] !== undefined) counts[c.col]++;
            var name = c.owner || t("tk.guest");
            var u = (users[name] = users[name] || {
                todo: 0, doing: 0, review: 0, done: 0, doneToday: 0, last: 0
            });
            u[c.col]++;
            if (c.moved > u.last) u.last = c.moved;
            if (c.col === "done" && new Date(c.moved).toDateString() === today) {
                doneToday++;
                u.doneToday++;
            }
        });

        function section(key) {
            var h = document.createElement("h3");
            h.textContent = t(key);
            dashEl.appendChild(h);
        }

        function tile(label, value, color) {
            var d = document.createElement("div");
            d.className = "db-tile";
            if (color) d.style.borderTopColor = color;
            var n = document.createElement("span");
            n.className = "n";
            n.textContent = value;
            var l = document.createElement("span");
            l.className = "l";
            l.textContent = label;
            d.appendChild(n);
            d.appendChild(l);
            return d;
        }

        section("dash.company");
        var tiles = document.createElement("div");
        tiles.className = "db-tiles";
        tiles.appendChild(tile(t("dash.total"), board.length));
        COLUMNS.forEach(function (col) {
            tiles.appendChild(tile(t(col.key), counts[col.id], col.dot));
        });
        tiles.appendChild(tile(t("dash.doneToday"), doneToday, "#3f9b6a"));
        dashEl.appendChild(tiles);

        section("dash.byuser");
        var names = Object.keys(users);
        if (!names.length) {
            var empty = document.createElement("div");
            empty.className = "db-empty";
            empty.textContent = t("dash.empty");
            dashEl.appendChild(empty);
            return;
        }

        var table = document.createElement("div");
        table.className = "db-table";
        var head = document.createElement("div");
        head.className = "db-row head";
        [t("dash.user"), t("col.todo"), t("col.doing"), t("col.review"),
         t("col.done"), t("dash.doneToday"), t("dash.lastActive")]
            .forEach(function (txt) {
                var sp = document.createElement("span");
                sp.textContent = txt;
                head.appendChild(sp);
            });
        table.appendChild(head);

        names.sort(function (a, b) { return users[b].last - users[a].last; });
        names.forEach(function (name) {
            var u = users[name];
            var row = document.createElement("div");
            row.className = "db-row";
            ["👤 " + name, u.todo, u.doing, u.review, u.done, u.doneToday,
             fmtDateTime(u.last)].forEach(function (txt) {
                var sp = document.createElement("span");
                sp.textContent = txt;
                row.appendChild(sp);
            });
            table.appendChild(row);
        });
        dashEl.appendChild(table);
    }

    function renderTimeline() {
        timelineEl.innerHTML = "";
        var total = COLUMNS.length;

        board.filter(visible).forEach(function (card) {
            var colIdx = COLUMNS.findIndex(function (c) {
                return c.id === card.col;
            });
            var col = COLUMNS[colIdx] || COLUMNS[0];

            var row = document.createElement("div");
            row.className = "tl-row";
            row.style.setProperty("--col-dot", col.dot);

            var name = document.createElement("div");
            name.textContent = title(card);

            var track = document.createElement("div");
            track.className = "tl-track";
            var bar = document.createElement("div");
            bar.className = "tl-bar";
            bar.style.left = (colIdx / total) * 100 + "%";
            bar.style.width = ((colIdx + 1) / total) * 100 - (colIdx / total) * 100 + "%";
            var when = document.createElement("span");
            when.className = "tl-date";
            when.textContent = fmtDate(card.moved);
            bar.appendChild(when);
            track.appendChild(bar);

            row.appendChild(name);
            row.appendChild(track);
            timelineEl.appendChild(row);
        });
    }

    function bumpCount(colId) {
        var el = boardEl.querySelector('[data-col="' + colId + '"] .col-count');
        if (!el) return;
        el.classList.remove("bump");
        void el.offsetWidth;
        el.classList.add("bump");
    }

    /* ---------------- mutations ---------------- */

    function find(id) {
        return board.filter(function (c) {
            return c.id === id;
        })[0];
    }

    function create(colId, text) {
        var card = {
            id: uid(),
            title: text || t("tk.untitled"),
            col: colId,
            owner: currentUserName(),
            moved: Date.now()
        };
        board.unshift(card);
        save();

        /* never let the new card land invisibly behind a filter */
        if (query) {
            query = "";
            var qi = document.getElementById("searchInput");
            if (qi) qi.value = "";
        }
        /* timeline and dashboard can't edit a card title — jump to the board */
        if (view === "timeline" || view === "dash" || !visible(card)) {
            activateView("all");
        } else {
            render();
        }
        bumpCount(colId);
        sync("create", { card: card });

        if (!text) {
            var el = boardEl.querySelector('[data-id="' + card.id + '"] .t-title');
            if (el) {
                el.focus();
                var range = document.createRange();
                range.selectNodeContents(el);
                var sel = getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
        return card;
    }

    function move(id, toCol) {
        var card = find(id);
        if (!card || card.col === toCol) return;
        var from = card.col;
        card.col = toCol;
        card.owner = currentUserName();
        card.moved = Date.now();
        save();
        render();
        bumpCount(from);
        bumpCount(toCol);
        sync("move", { card: card, from: from, to: toCol });
    }

    function remove(id) {
        var card = find(id);
        if (!card) return;
        board = board.filter(function (c) {
            return c.id !== id;
        });
        save();
        render();
        bumpCount(card.col);
        sync("delete", { card: card });
    }

    function reset() {
        board = SEED.map(function (s, i) {
            return Object.assign({ id: "seed" + i }, s);
        });
        save();
        render();
        sync("reset", {});
    }

    /* ---------------- drag & drop (pointer based) ---------------- */

    function onPointerDown(e) {
        if (e.button !== 0) return;
        if (e.target.closest(".t-del")) return;
        if (e.target.classList.contains("t-title") && e.target.isContentEditable) {
            /* let a click land as a caret; drag only starts past the threshold */
        }

        var card = e.currentTarget;
        var rect = card.getBoundingClientRect();

        dragging = {
            id: card.dataset.id,
            source: card,
            ghost: null,
            dx: e.clientX - rect.left,
            dy: e.clientY - rect.top,
            startX: e.clientX,
            startY: e.clientY,
            started: false
        };

        document.addEventListener("pointermove", onPointerMove);
        document.addEventListener("pointerup", onPointerUp, { once: true });
    }

    function onPointerMove(e) {
        if (!dragging) return;

        if (!dragging.started) {
            var dist =
                Math.abs(e.clientX - dragging.startX) +
                Math.abs(e.clientY - dragging.startY);
            if (dist < 6) return;
            dragging.started = true;

            var ghost = dragging.source.cloneNode(true);
            ghost.classList.add("is-ghost");
            ghost.style.width = dragging.source.offsetWidth + "px";
            document.body.appendChild(ghost);
            dragging.ghost = ghost;
            dragging.source.classList.add("is-source");
            document.body.style.userSelect = "none";
        }

        dragging.ghost.style.left = e.clientX - dragging.dx + "px";
        dragging.ghost.style.top = e.clientY - dragging.dy + "px";

        var col = columnAt(e.clientX, e.clientY);
        boardEl.querySelectorAll(".column").forEach(function (c) {
            c.classList.toggle("drop-target", c === col);
        });
    }

    function onPointerUp(e) {
        document.removeEventListener("pointermove", onPointerMove);
        if (!dragging) return;

        if (dragging.started) {
            var col = columnAt(e.clientX, e.clientY);
            dragging.ghost.remove();
            dragging.source.classList.remove("is-source");
            document.body.style.userSelect = "";
            boardEl.querySelectorAll(".column").forEach(function (c) {
                c.classList.remove("drop-target");
            });
            if (col) move(dragging.id, col.dataset.col);
        }
        dragging = null;
    }

    function columnAt(x, y) {
        var hit = null;
        boardEl.querySelectorAll(".column").forEach(function (c) {
            var r = c.getBoundingClientRect();
            if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) hit = c;
        });
        return hit;
    }

    /* ---------------- live demo layer ---------------- */

    var ACTORS = [
        { emoji: "⏰", color: "#e0a93b" },
        { emoji: "✅", color: "#7b62d4" },
        { emoji: "💡", color: "#e06b6b" },
        { emoji: "👍", color: "#2b7fd4" }
    ];

    function collabPing(actor, x, y, say) {
        var el = document.createElement("div");
        el.className = "collab";
        el.style.setProperty("--c-color", actor.color);
        el.innerHTML = '<span class="badge"></span><span class="say"></span>';
        el.querySelector(".badge").textContent = actor.emoji;
        el.querySelector(".say").textContent = say || "";
        el.style.left = "0px";
        el.style.top = "0px";
        el.style.transform = "translate(" + x + "px," + y + "px)";
        collabLayer.appendChild(el);

        requestAnimationFrame(function () {
            el.classList.add("show");
            el.style.transform =
                "translate(" + (x + (Math.random() * 60 - 30)) + "px," + (y - 26) + "px)";
        });

        setTimeout(function () {
            el.classList.remove("show");
            setTimeout(function () {
                el.remove();
            }, 450);
        }, 2200);
    }

    function liveTick() {
        if (!live || dragging || document.hidden) return;

        var actor = ACTORS[Math.floor(Math.random() * ACTORS.length)];
        var cards = boardEl.querySelectorAll(".task");
        if (!cards.length) return;

        var target = cards[Math.floor(Math.random() * cards.length)];
        var r = target.getBoundingClientRect();
        var host = collabLayer.getBoundingClientRect();
        var says = ["tk.live.1", "tk.live.2", "tk.live.3", "tk.live.4", "tk.live.5"];

        collabPing(
            actor,
            r.right - host.left - 30,
            r.top - host.top + 4,
            Math.random() < 0.6 ? t(says[Math.floor(Math.random() * says.length)]) : ""
        );

        /* occasionally advance a card, the way the reference reel does */
        if (Math.random() < 0.45) {
            var id = target.dataset.id;
            var card = find(id);
            if (card) {
                var idx = COLUMNS.findIndex(function (c) {
                    return c.id === card.col;
                });
                var next = COLUMNS[(idx + 1) % COLUMNS.length];
                setTimeout(function () {
                    if (live && !dragging) move(id, next.id);
                }, 900);
            }
        }
    }

    function setLive(on) {
        live = !!on;
        try {
            localStorage.setItem(LIVE_KEY, live ? "1" : "0");
        } catch (e) {
            /* ignore */
        }
        var btn = document.getElementById("liveToggle");
        if (btn) btn.classList.toggle("on", live);
        clearInterval(liveTimer);
        if (live) liveTimer = setInterval(liveTick, 3200);
    }

    /* ---------------- wiring ---------------- */

    function init() {
        root = document.querySelector(".tasks-page");
        boardEl = document.getElementById("board");
        timelineEl = document.getElementById("timeline");
        dashEl = document.getElementById("dashboard");
        collabLayer = document.getElementById("collabLayer");

        board = load();
        render();

        /* tabs */
        document.querySelectorAll(".board-tabs button").forEach(function (btn) {
            btn.addEventListener("click", function () {
                activateView(btn.dataset.view);
            });
        });

        /* search */
        var searchBox = document.getElementById("searchBox");
        var searchInput = document.getElementById("searchInput");
        document.getElementById("searchBtn").addEventListener("click", function () {
            searchBox.classList.toggle("open");
            if (searchBox.classList.contains("open")) searchInput.focus();
            else {
                searchInput.value = "";
                query = "";
                render();
            }
        });
        searchInput.addEventListener("input", function () {
            query = searchInput.value.trim().toLowerCase();
            render();
        });

        /* sort */
        document.getElementById("sortBtn").addEventListener("click", function () {
            board.sort(function (a, b) {
                return title(a).localeCompare(title(b), global.I18N ? I18N.get() : "th");
            });
            save();
            render();
        });

        /* reset */
        document.getElementById("resetBtn").addEventListener("click", function () {
            if (confirm(t("tk.confirmReset"))) reset();
        });

        /* new */
        document.getElementById("newBtn").addEventListener("click", function () {
            create(COLUMNS[0].id);
        });

        /* live toggle */
        var stored;
        try {
            stored = localStorage.getItem(LIVE_KEY);
        } catch (e) {
            stored = null;
        }
        document.getElementById("liveToggle").addEventListener("click", function () {
            setLive(!live);
        });
        setLive(stored === "1");

        document.addEventListener("i18n:change", render);
        document.addEventListener("auth:change", render);
        document.addEventListener("visibilitychange", function () {
            if (document.hidden) clearInterval(liveTimer);
            else setLive(live);
        });
    }

    /* ---------------- public API ---------------- */

    global.PiTasks = {
        configure: function (opts) {
            Object.assign(config, opts || {});
            return this;
        },
        getBoard: function () {
            return board.slice();
        },
        setBoard: function (next) {
            if (!Array.isArray(next)) return this;
            board = next;
            save();
            render();
            return this;
        },
        columns: COLUMNS,
        create: create,
        move: move,
        remove: remove,
        reset: reset,
        setLive: setLive,
        on: function (name, fn) {
            (listeners[name] = listeners[name] || []).push(fn);
            return this;
        }
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})(window);
