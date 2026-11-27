/* =========================================================
   PROINVENTIVE — visitor counter (Abacus, no key)
   Counts one visit per browser per day (Asia/Bangkok) on every page
   that loads this script; shows totals in any .visit-counter element.
   Service unreachable -> the counter stays hidden.
   ========================================================= */
(function (global) {
    "use strict";

    var API = "https://abacus.jasoncameron.dev";
    var NS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? "pi-aisolar-dev-local" : "pi-aisolar-dev";
    var FLAG = "pi_visit_day";

    var today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
    var keys = { total: "visits-total", today: "visits-" + today };
    var counts = null;

    function seen() {
        try { return localStorage.getItem(FLAG) === today; } catch (e) { return true; }
    }
    function markSeen() {
        try { localStorage.setItem(FLAG, today); } catch (e) { /* private mode */ }
    }

    function call(action, key) {
        return fetch(API + "/" + action + "/" + NS + "/" + key).then(function (r) {
            if (r.status === 404) return { value: 0 };
            if (!r.ok) throw new Error("HTTP " + r.status);
            return r.json();
        }).then(function (d) { return d.value || 0; });
    }

    function t(key, fallback) {
        var s = global.I18N ? global.I18N.t(key) : key;
        return s === key ? fallback : s;
    }

    function fmt(n) {
        return Number(n).toLocaleString("en-US");
    }

    function paint() {
        if (!counts) return;
        document.querySelectorAll(".visit-counter").forEach(function (el) {
            el.innerHTML = "";
            var a = document.createElement("span");
            a.textContent = "👁️ " + t("vc.total", "ผู้เข้าชมทั้งหมด") + " ";
            var b = document.createElement("strong");
            b.textContent = fmt(counts.total);
            var c = document.createElement("span");
            c.textContent = " · " + t("vc.today", "วันนี้") + " ";
            var d = document.createElement("strong");
            d.textContent = fmt(counts.today);
            el.append(a, b, c, d);
            el.hidden = false;
        });
    }

    var action = seen() ? "get" : "hit";
    Promise.all([call(action, keys.total), call(action, keys.today)])
        .then(function (v) {
            if (action === "hit") markSeen();
            counts = { total: v[0], today: v[1] };
            if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", paint);
            else paint();
        })
        .catch(function (e) {
            if (global.console) console.warn("[counter.js] นับผู้เข้าชมไม่ได้:", e.message);
        });

    document.addEventListener("i18n:change", paint);
})(window);
