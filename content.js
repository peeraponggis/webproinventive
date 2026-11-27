/* =========================================================
   PROINVENTIVE — apply content.json (edited in Admin CMS) to the page
   Markup:
     data-cms="pages.index.hero.title"          -> textContent
     data-cms-tpl="📞 {}"                        -> wrap the value
     data-cms-attr="href:path, poster:path"     -> attributes (tel:/mailto: prefix kept)
     data-cms-show="footer.products#ft-ai.visible" -> false hides the element
   Path segments: "key", "0" (array index), "key#id" (array item with that id).
   Values {th,en} follow the current language. ?nocms skips everything.
   ========================================================= */
(function (global) {
    "use strict";

    var data = null;

    function resolve(path) {
        var cur = data;
        var parts = path.split(".");
        for (var i = 0; i < parts.length && cur != null; i++) {
            var seg = parts[i];
            var hash = seg.indexOf("#");
            if (hash >= 0) {
                var key = seg.slice(0, hash);
                var id = seg.slice(hash + 1);
                var arr = key ? cur[key] : cur;
                cur = Array.isArray(arr)
                    ? arr.filter(function (x) { return x && x.id === id; })[0]
                    : undefined;
            } else {
                cur = cur[seg];
            }
        }
        return cur;
    }

    function text(path) {
        var v = resolve(path);
        if (v == null) return null;
        if (typeof v === "object") {
            var lang = global.I18N ? global.I18N.get() : "th";
            v = v[lang] != null ? v[lang] : v.th;
        }
        return v == null ? null : String(v);
    }

    function warn(path) {
        if (global.console) console.warn("[content.js] ไม่พบใน content.json:", path);
    }

    function setAttr(el, name, val) {
        var old = el.getAttribute(name) || "";
        if (name === "href" && /^tel:/.test(old)) val = "tel:" + val.replace(/[^\d+]/g, "");
        else if (name === "href" && /^mailto:/.test(old)) val = "mailto:" + val;
        if (old === val) return;
        el.setAttribute(name, val);
        if (el.tagName === "SOURCE" && name === "src" && el.parentNode && el.parentNode.load) {
            el.parentNode.load();
        }
    }

    function apply(root) {
        if (!data) return;
        root = root || document;

        root.querySelectorAll("[data-cms]").forEach(function (el) {
            var path = el.getAttribute("data-cms");
            var v = text(path);
            if (v == null) return warn(path);
            var tpl = el.getAttribute("data-cms-tpl");
            el.textContent = tpl ? tpl.replace("{}", v) : v;
        });

        root.querySelectorAll("[data-cms-attr]").forEach(function (el) {
            el.getAttribute("data-cms-attr").split(",").forEach(function (pair) {
                var i = pair.indexOf(":");
                if (i < 0) return;
                var name = pair.slice(0, i).trim();
                var path = pair.slice(i + 1).trim();
                var v = text(path);
                if (v == null || v === "") return warn(path);
                setAttr(el, name, v);
            });
        });

        root.querySelectorAll("[data-cms-show]").forEach(function (el) {
            var v = resolve(el.getAttribute("data-cms-show"));
            if (v === false) el.style.display = "none";
            else if (el.style.display === "none") el.style.display = "";
        });
    }

    if (/[?&]nocms\b/.test(location.search)) return;

    var src = document.currentScript && document.currentScript.src;
    var base = src ? src.replace(/[^/]+$/, "") : "";

    fetch(base + "content.json?t=" + Date.now())
        .then(function (r) {
            if (!r.ok) throw new Error("HTTP " + r.status);
            return r.json();
        })
        .then(function (d) {
            data = d;
            if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", function () { apply(); });
            } else {
                apply();
            }
        })
        .catch(function (e) {
            if (global.console) console.warn("[content.js] โหลด content.json ไม่ได้ — ใช้ข้อความในหน้าเดิม:", e.message);
        });

    document.addEventListener("i18n:change", function () { apply(); });

    global.PiContent = { apply: apply, get: function () { return data; } };
})(window);
