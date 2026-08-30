/* =========================================================
   Console · Chat with Pi
   ---------------------------------------------------------
   Phase 1 (now): self-contained UI + local demo responder.
   Phase 2 (CRM/SaaS): point it at a backend without touching
   the UI, using either an endpoint or a custom transport.

     PiConsole.configure({
       endpoint: "https://api.yourcrm.com/pi/chat",
       headers : { Authorization: "Bearer …" },
       // optional full override; receives the payload below and
       // must resolve to { reply: string } or a plain string
       transport: async (payload) => ({ reply: "…" })
     });

   Payload sent to the backend:
     { message, lang, history: [{role, text, ts}], context: {…} }

   Other API:
     PiConsole.open() / close() / toggle()
     PiConsole.send(text)            programmatic user message
     PiConsole.say(text, role)       inject a message
     PiConsole.clear()
     PiConsole.setContext({ userId, accountId, … })
     PiConsole.on("message"|"open"|"close"|"error", fn)
   ========================================================= */
(function (global) {
    "use strict";

    var LOG_KEY = "pi_console_log";
    var MAX_STORED = 40;

    /* Resolve assets against this script's own URL so the console works
       from any folder depth (e.g. /pi_tasks/) without extra configuration. */
    var BASE = (function () {
        var src = document.currentScript && document.currentScript.src;
        return src ? src.replace(/[^/]+$/, "") : "";
    })();

    var config = {
        endpoint: null,
        headers: {},
        transport: null,
        logoSrc: BASE + "img/pilogo.png",
        timeout: 20000
    };

    var context = {};
    var history = [];
    var listeners = {};
    var el = {};
    var busy = false;
    var mounted = false;

    /* ---------------- helpers ---------------- */

    function t(key, vars) {
        return global.I18N ? global.I18N.t(key, vars) : key;
    }

    function lang() {
        return global.I18N ? global.I18N.get() : "th";
    }

    function emit(name, detail) {
        (listeners[name] || []).forEach(function (fn) {
            try {
                fn(detail);
            } catch (e) {
                /* a listener must never break the console */
            }
        });
    }

    function saveLog() {
        try {
            localStorage.setItem(
                LOG_KEY,
                JSON.stringify(history.slice(-MAX_STORED))
            );
        } catch (e) {
            /* storage unavailable — session-only transcript */
        }
    }

    function loadLog() {
        try {
            var raw = localStorage.getItem(LOG_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    /* ---------------- rendering ---------------- */

    function roleLabel(role) {
        if (role === "user") return t("pi.you");
        if (role === "pi") return t("pi.pi");
        return t("pi.system");
    }

    function render(entry, animate) {
        var wrap = document.createElement("div");
        wrap.className = "pi-msg";
        wrap.setAttribute("data-role", entry.role);
        if (!animate) wrap.style.animation = "none";

        var role = document.createElement("div");
        role.className = "pi-role";
        role.textContent = roleLabel(entry.role);

        var bubble = document.createElement("div");
        bubble.className = "pi-bubble";
        bubble.textContent = entry.text;

        wrap.appendChild(role);
        wrap.appendChild(bubble);
        el.log.appendChild(wrap);
        el.log.scrollTop = el.log.scrollHeight;
        return wrap;
    }

    function repaintLog() {
        el.log.innerHTML = "";
        history.forEach(function (entry) {
            render(entry, false);
        });
    }

    function push(text, role, quiet) {
        var entry = { role: role, text: text, ts: Date.now() };
        history.push(entry);
        if (history.length > MAX_STORED) history = history.slice(-MAX_STORED);
        render(entry, true);
        saveLog();
        if (!quiet) emit("message", entry);
        return entry;
    }

    function showTyping() {
        var wrap = document.createElement("div");
        wrap.className = "pi-msg pi-typing";
        wrap.setAttribute("data-role", "pi");
        wrap.innerHTML =
            '<div class="pi-role"></div><div class="pi-bubble"><i></i><i></i><i></i></div>';
        wrap.querySelector(".pi-role").textContent = t("pi.thinking");
        el.log.appendChild(wrap);
        el.log.scrollTop = el.log.scrollHeight;
        return wrap;
    }

    function setStatus(state) {
        el.dot.setAttribute("data-state", state);
        el.status.textContent =
            state === "online"
                ? t("pi.status.online")
                : state === "error"
                ? t("pi.status.error")
                : t("pi.status.local");
        el.status.setAttribute("data-state", state);
    }

    /* ---------------- commands ---------------- */

    function handleCommand(raw) {
        var parts = raw.trim().slice(1).split(/\s+/);
        var cmd = (parts.shift() || "").toLowerCase();
        var arg = parts.join(" ");

        switch (cmd) {
            case "help":
                push(t("pi.help"), "system");
                return true;

            case "clear":
                clear();
                push(t("pi.cleared"), "system");
                return true;

            case "lang":
                if (global.I18N && (arg === "th" || arg === "en")) {
                    global.I18N.set(arg);
                } else {
                    push(t("pi.unknown"), "system");
                }
                return true;

            case "crm":
                push(t("pi.crm"), "system");
                return true;

            case "status":
                push(
                    t("pi.status.msg", {
                        status: el.status.textContent,
                        endpoint: config.endpoint || t("pi.notset"),
                        lang: lang().toUpperCase()
                    }),
                    "system"
                );
                return true;

            case "connect":
                if (!arg) {
                    push(t("pi.unknown"), "system");
                    return true;
                }
                config.endpoint = arg;
                setStatus("online");
                push(t("pi.connected", { endpoint: arg }), "system");
                return true;

            default:
                push(t("pi.unknown"), "system");
                return true;
        }
    }

    /* ---------------- responders ---------------- */

    /* Demo brain — replaced the moment an endpoint or transport is set. */
    function localReply(message) {
        var q = message.toLowerCase();
        var has = function (words) {
            return words.some(function (w) {
                return q.indexOf(w) !== -1;
            });
        };

        if (has(["ราคา", "กี่บาท", "เท่าไห", "price", "pricing", "cost", "plan"]))
            return t("pi.a.pricing");
        if (has(["crm", "erp", "saas", "เชื่อมต่อ", "integrat", "api", "connect"]))
            return t("pi.a.crm");
        if (has(["ติดต่อ", "เดโม", "ขาย", "demo", "contact", "sales", "email"]))
            return t("pi.a.contact");
        if (
            has([
                "ทำอะไร",
                "ฟีเจอร์",
                "ความสามารถ",
                "คือ",
                "feature",
                "what",
                "can you",
                "do"
            ])
        )
            return t("pi.a.features");

        return t("pi.fallback");
    }

    function remoteReply(message) {
        var payload = {
            message: message,
            lang: lang(),
            history: history.slice(-12),
            context: context
        };

        if (typeof config.transport === "function") {
            return Promise.resolve(config.transport(payload)).then(function (res) {
                if (typeof res === "string") return res;
                return (res && (res.reply || res.message || res.text)) || "";
            });
        }

        var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
        var timer = ctrl
            ? setTimeout(function () {
                  ctrl.abort();
              }, config.timeout)
            : null;

        return fetch(config.endpoint, {
            method: "POST",
            headers: Object.assign(
                { "Content-Type": "application/json" },
                config.headers
            ),
            body: JSON.stringify(payload),
            signal: ctrl ? ctrl.signal : undefined
        })
            .then(function (res) {
                if (timer) clearTimeout(timer);
                if (!res.ok) throw new Error("HTTP " + res.status);
                return res.json();
            })
            .then(function (data) {
                return (data && (data.reply || data.message || data.text)) || "";
            });
    }

    function answer(message) {
        var useRemote = config.endpoint || typeof config.transport === "function";
        if (!useRemote) {
            return new Promise(function (resolve) {
                setTimeout(function () {
                    resolve(localReply(message));
                }, 420 + Math.min(message.length * 8, 500));
            });
        }
        return remoteReply(message);
    }

    /* ---------------- actions ---------------- */

    function send(text) {
        var message = (text || "").trim();
        if (!message || busy) return;

        push(message, "user");
        el.input.value = "";
        autoGrow();

        if (message.charAt(0) === "/") {
            handleCommand(message);
            return;
        }

        busy = true;
        el.send.disabled = true;
        var typing = showTyping();

        answer(message)
            .then(function (reply) {
                typing.remove();
                push(reply || t("pi.fallback"), "pi");
            })
            .catch(function (err) {
                typing.remove();
                setStatus("error");
                push(t("pi.status.error") + " — " + err.message, "system");
                emit("error", err);
            })
            .then(function () {
                busy = false;
                el.send.disabled = false;
                el.input.focus();
            });
    }

    function clear() {
        history = [];
        saveLog();
        el.log.innerHTML = "";
    }

    function open() {
        document.body.classList.add("pi-open");
        el.panel.setAttribute("aria-hidden", "false");
        el.log.scrollTop = el.log.scrollHeight;
        setTimeout(function () {
            el.input.focus();
        }, 180);
        emit("open");
    }

    function close() {
        document.body.classList.remove("pi-open");
        el.panel.setAttribute("aria-hidden", "true");
        emit("close");
    }

    function toggle() {
        if (document.body.classList.contains("pi-open")) close();
        else open();
    }

    function autoGrow() {
        el.input.style.height = "auto";
        el.input.style.height = Math.min(el.input.scrollHeight, 120) + "px";
    }

    /* ---------------- mount ---------------- */

    function mount() {
        if (mounted) return;
        mounted = true;

        var launcher = document.createElement("button");
        launcher.type = "button";
        launcher.className = "pi-launcher";
        launcher.innerHTML =
            '<img alt="" src="' +
            config.logoSrc +
            '"><span class="pi-label"></span><span class="pi-ping"></span>';

        var panel = document.createElement("section");
        panel.className = "pi-panel";
        panel.setAttribute("role", "dialog");
        panel.setAttribute("aria-hidden", "true");
        panel.innerHTML = [
            '<header class="pi-head">',
            '  <img alt="" src="' + config.logoSrc + '">',
            '  <div class="pi-titles">',
            '    <div class="pi-t"></div>',
            '    <div class="pi-s"><span class="pi-dot" data-state="local"></span><span class="pi-status"></span></div>',
            "  </div>",
            '  <button type="button" class="pi-iconbtn pi-clear">',
            '    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V5h6v2m-9 0 1 13h10l1-13" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
            "  </button>",
            '  <button type="button" class="pi-iconbtn pi-close">',
            '    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
            "  </button>",
            "</header>",
            '<div class="pi-log"></div>',
            '<div class="pi-quick"></div>',
            '<form class="pi-form">',
            '  <textarea rows="1"></textarea>',
            '  <button type="submit" class="pi-send">',
            '    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 12 20 4l-8 16-2-6-6-2Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
            "  </button>",
            "</form>",
            '<div class="pi-hint">Enter ↵ · Shift+Enter = newline · /help</div>'
        ].join("");

        document.body.appendChild(launcher);
        document.body.appendChild(panel);

        el = {
            launcher: launcher,
            label: launcher.querySelector(".pi-label"),
            panel: panel,
            title: panel.querySelector(".pi-t"),
            status: panel.querySelector(".pi-status"),
            dot: panel.querySelector(".pi-dot"),
            log: panel.querySelector(".pi-log"),
            quick: panel.querySelector(".pi-quick"),
            form: panel.querySelector(".pi-form"),
            input: panel.querySelector("textarea"),
            send: panel.querySelector(".pi-send"),
            clearBtn: panel.querySelector(".pi-clear"),
            closeBtn: panel.querySelector(".pi-close")
        };

        launcher.addEventListener("click", open);
        el.closeBtn.addEventListener("click", close);
        el.clearBtn.addEventListener("click", function () {
            clear();
            push(t("pi.cleared"), "system");
        });

        el.form.addEventListener("submit", function (e) {
            e.preventDefault();
            send(el.input.value);
        });

        el.input.addEventListener("input", autoGrow);
        el.input.addEventListener("keydown", function (e) {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(el.input.value);
            }
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && document.body.classList.contains("pi-open"))
                close();
        });

        history = loadLog();
        repaintLog();
        applyText();
        if (!history.length) push(t("pi.greeting"), "pi", true);

        document.addEventListener("i18n:change", function () {
            applyText();
            repaintLog();
        });
    }

    function applyText() {
        el.label.textContent = t("pi.pi");
        el.launcher.setAttribute("aria-label", t("pi.launch"));
        el.launcher.setAttribute("title", t("pi.launch"));
        el.title.textContent = t("pi.title");
        el.panel.setAttribute("aria-label", t("pi.title"));
        el.input.setAttribute("placeholder", t("pi.placeholder"));
        el.clearBtn.setAttribute("aria-label", t("pi.clear"));
        el.clearBtn.setAttribute("title", t("pi.clear"));
        el.closeBtn.setAttribute("aria-label", t("pi.close"));
        el.closeBtn.setAttribute("title", t("pi.close"));
        el.send.setAttribute("aria-label", t("pi.send"));

        setStatus(
            config.endpoint || config.transport ? "online" : "local"
        );

        el.quick.innerHTML = "";
        ["pi.q1", "pi.q2", "pi.q3"].forEach(function (key) {
            var b = document.createElement("button");
            b.type = "button";
            b.textContent = t(key);
            b.addEventListener("click", function () {
                send(b.textContent);
            });
            el.quick.appendChild(b);
        });
    }

    /* ---------------- public API ---------------- */

    global.PiConsole = {
        configure: function (opts) {
            Object.assign(config, opts || {});
            if (mounted) applyText();
            return this;
        },
        setContext: function (obj) {
            Object.assign(context, obj || {});
            return this;
        },
        getContext: function () {
            return Object.assign({}, context);
        },
        getHistory: function () {
            return history.slice();
        },
        send: send,
        say: function (text, role) {
            push(text, role || "pi");
        },
        clear: clear,
        open: open,
        close: close,
        toggle: toggle,
        on: function (name, fn) {
            (listeners[name] = listeners[name] || []).push(fn);
            return this;
        }
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", mount);
    } else {
        mount();
    }
})(window);
