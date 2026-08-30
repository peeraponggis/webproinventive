/* =========================================================
   PROINVENTIVE — client-side auth (demo)
   ---------------------------------------------------------
   A UI demonstration only: any email ending in
   @proinventive.co.th "logs in" and unlocks the internal
   menu (Pi Tasks / CRM / BoQ / ASC / SaaS admin). There is
   no server and no password — do not treat this as security.

   API:
     PiAuth.getUser()        -> {email, name} | null
     PiAuth.login(email)     -> boolean (domain check)
     PiAuth.logout()
     PiAuth.open()           -> show the login/account modal
     document.addEventListener('auth:change', e => e.detail.user)

   Markup contract:
     - elements with class "auth-btn" become the login/account
       button (label managed here, click opens the modal)
     - elements with class "internal-only" are hidden until a
       user is logged in (CSS keys off body.pi-authed)
   ========================================================= */
(function (global) {
    "use strict";

    var KEY = "pi_user";
    var RE = /^[^\s@]+@proinventive\.co\.th$/i;

    var user = load();
    var modal = null;
    var els = {};

    function load() {
        try {
            var raw = localStorage.getItem(KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function save() {
        try {
            if (user) localStorage.setItem(KEY, JSON.stringify(user));
            else localStorage.removeItem(KEY);
        } catch (e) {
            /* storage unavailable — session-only login */
        }
    }

    function t(key) {
        return global.I18N ? global.I18N.t(key) : key;
    }

    function apply() {
        document.body.classList.toggle("pi-authed", !!user);
        document.querySelectorAll(".auth-btn").forEach(function (btn) {
            btn.textContent = user ? "👤 " + user.name : t("nav.login");
        });
        if (modal) paintModal();
    }

    function announce() {
        apply();
        document.dispatchEvent(
            new CustomEvent("auth:change", { detail: { user: user } })
        );
    }

    function login(email) {
        email = (email || "").trim().toLowerCase();
        if (!RE.test(email)) return false;
        user = { email: email, name: email.split("@")[0] };
        save();
        announce();
        return true;
    }

    function logout() {
        user = null;
        save();
        announce();
    }

    /* ---------------- modal ---------------- */

    function mountModal() {
        modal = document.createElement("div");
        modal.className = "auth-overlay";
        modal.innerHTML = [
            '<div class="auth-card" role="dialog" aria-modal="true">',
            '  <button type="button" class="auth-x" aria-label="close">',
            '    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
            "  </button>",
            '  <img class="auth-logo" alt="" src="">',
            '  <h3 class="auth-title"></h3>',
            '  <p class="auth-hint"></p>',
            '  <form class="auth-form">',
            '    <input type="email" class="auth-input" autocomplete="email" spellcheck="false">',
            '    <p class="auth-error" hidden></p>',
            '    <button type="submit" class="btn btn-primary auth-submit"></button>',
            "  </form>",
            '  <div class="auth-session" hidden>',
            '    <p class="auth-who"></p>',
            '    <button type="button" class="btn btn-secondary auth-logout"></button>',
            "  </div>",
            "</div>"
        ].join("");
        document.body.appendChild(modal);

        els = {
            card: modal.querySelector(".auth-card"),
            x: modal.querySelector(".auth-x"),
            logo: modal.querySelector(".auth-logo"),
            title: modal.querySelector(".auth-title"),
            hint: modal.querySelector(".auth-hint"),
            form: modal.querySelector(".auth-form"),
            input: modal.querySelector(".auth-input"),
            error: modal.querySelector(".auth-error"),
            submit: modal.querySelector(".auth-submit"),
            session: modal.querySelector(".auth-session"),
            who: modal.querySelector(".auth-who"),
            logoutBtn: modal.querySelector(".auth-logout")
        };

        /* resolve the coin logo relative to this script (works from /pi_tasks/) */
        var src = document.currentScript && document.currentScript.src;
        var base = src ? src.replace(/[^/]+$/, "") : "";
        els.logo.src = base + "img/pilogo.png";

        els.x.addEventListener("click", close);
        modal.addEventListener("click", function (e) {
            if (e.target === modal) close();
        });
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && modal.classList.contains("open")) close();
        });

        els.form.addEventListener("submit", function (e) {
            e.preventDefault();
            if (login(els.input.value)) {
                close();
            } else {
                els.error.hidden = false;
                els.input.focus();
            }
        });
        els.input.addEventListener("input", function () {
            els.error.hidden = true;
        });

        els.logoutBtn.addEventListener("click", function () {
            logout();
            close();
        });

        paintModal();
    }

    function paintModal() {
        els.title.textContent = t("auth.title");
        els.hint.textContent = t("auth.hint");
        els.input.placeholder = t("auth.placeholder");
        els.error.textContent = t("auth.invalid");
        els.submit.textContent = t("auth.submit");
        els.logoutBtn.textContent = t("auth.logout");

        els.form.hidden = !!user;
        els.session.hidden = !user;
        if (user) {
            els.who.textContent = t("auth.loggedin") + ": " + user.email;
        }
    }

    function open() {
        if (!modal) mountModal();
        paintModal();
        els.error.hidden = true;
        els.input.value = "";
        modal.classList.add("open");
        if (!user) setTimeout(function () { els.input.focus(); }, 120);
    }

    function close() {
        if (modal) modal.classList.remove("open");
    }

    /* ---------------- wiring ---------------- */

    function init() {
        mountModal();
        apply();

        document.querySelectorAll(".auth-btn").forEach(function (btn) {
            btn.addEventListener("click", function (e) {
                e.preventDefault();
                open();
            });
        });

        document.addEventListener("i18n:change", apply);
    }

    global.PiAuth = {
        getUser: function () {
            return user ? { email: user.email, name: user.name } : null;
        },
        login: login,
        logout: logout,
        open: open
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})(window);
