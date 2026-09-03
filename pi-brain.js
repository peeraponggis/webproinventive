/* =========================================================
   Pi Brain — client-side EIT knowledge base for the console
   ---------------------------------------------------------
   Answers technical questions from knowledge.json (built by
   tools/build_knowledge.py from the audited clause map and
   provisions). Everything runs in the browser: keyword +
   Thai character-trigram retrieval, no model, no server.

   Copyright guard: the knowledge base carries only clause /
   table numbers, headings and our own short paraphrases —
   answers always cite the EIT volume and remind the reader
   to verify against the printed standard.

   Pricing / sales questions never reach the knowledge base;
   they are intercepted first and routed to the sales channel.
   ========================================================= */
(function (global) {
    "use strict";

    /* resolve knowledge.json next to this script (works from /pi_tasks/) */
    var SRC = (document.currentScript && document.currentScript.src) || "";
    var BASE = SRC.replace(/[^/]+$/, "");
    var VQ = SRC.indexOf("?") !== -1 ? SRC.slice(SRC.indexOf("?")) : "";

    var KB = null;        /* loaded knowledge */
    var loading = null;   /* fetch promise */

    function t(key, vars) {
        return global.I18N ? global.I18N.t(key, vars) : key;
    }

    function load() {
        if (KB) return Promise.resolve(KB);
        if (!loading) {
            loading = fetch(BASE + "knowledge.json" + VQ)
                .then(function (r) {
                    if (!r.ok) throw new Error("HTTP " + r.status);
                    return r.json();
                })
                .then(function (data) {
                    KB = data;
                    KB.entries.forEach(function (e) {
                        e._text = norm(
                            [e.title, e.kw, e.a_th, e.a_en, e.clause, e.id]
                                .filter(Boolean).join(" ")
                        );
                        e._tri = trigrams(e._text);
                    });
                    return KB;
                });
        }
        return loading;
    }

    /* ---------------- text matching (Thai-friendly) ---------------- */

    function norm(s) {
        return (s || "")
            .toLowerCase()
            .replace(/[็-์]/g, "")      /* strip Thai tone marks */
            .replace(/[^ก-ๆa-z0-9. ]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function trigrams(s) {
        var set = {};
        var packed = s.replace(/ /g, "");
        for (var i = 0; i <= packed.length - 3; i++) {
            set[packed.substr(i, 3)] = 1;
        }
        return set;
    }

    function score(qNorm, qTri, qTriCount, entry) {
        var s = 0;

        /* keyword hits: every query word of length >=2 found in entry text */
        qNorm.split(" ").forEach(function (w) {
            if (w.length >= 2 && entry._text.indexOf(w) !== -1) {
                s += w.length >= 4 ? 3 : 2;
            }
        });

        /* trigram overlap (helps Thai, which has no spaces) */
        var hit = 0;
        for (var g in qTri) {
            if (entry._tri[g]) hit++;
        }
        if (qTriCount > 0) s += (hit / qTriCount) * 10;

        /* explicit clause number in the question ("4.3.5") */
        var mm = qNorm.match(/\d+(?:\.\d+)+/);
        if (mm && entry.clause && entry.clause.indexOf(mm[0]) !== -1) s += 6;

        /* curated answers outrank bare clause pointers at equal relevance */
        if (entry.type === "faq") s *= 1.25;
        if (entry.type === "provision") s *= 1.15;
        return s;
    }

    /* ---------------- answer composition ---------------- */

    function cite(entry) {
        var code = entry.code && KB.codes[entry.code];
        var name = code ? code.eitCode : (entry.eitCode || "");
        var bits = [name];
        if (entry.clause) {
            bits.push(/ตาราง|ภาคผนวก/.test(entry.clause)
                ? entry.clause
                : (t("kb.clause") + " " + entry.clause));
        }
        if (entry.table) bits.push(entry.table);
        return bits.filter(Boolean).join(" · ");
    }

    function answerText(entry, lang) {
        if (lang === "en" && entry.a_en) return entry.a_en;
        return entry.a_th || entry.title;
    }

    function compose(best, lang) {
        var body = answerText(best, lang);
        if (best.type === "provision" && best.value) {
            body += " — " + best.value + " " + (best.unit || "");
        }
        return body.trim() +
            "\n\n📖 " + t("kb.ref") + ": " + cite(best) +
            "\n⚠️ " + t("kb.disclaimer");
    }

    function composePointers(list, lang) {
        var lines = list.map(function (e) {
            return "• " + e.title + " — " + cite(e);
        });
        return t("kb.pointer") + "\n" + lines.join("\n") +
            "\n\n⚠️ " + t("kb.disclaimer");
    }

    /* ---------------- sales / legacy intercepts ---------------- */

    function intercept(message) {
        var q = message.toLowerCase();
        function has(words) {
            return words.some(function (w) { return q.indexOf(w) !== -1; });
        }
        if (has(["ราคา", "กี่บาท", "บาท", "ค่าติดตั้ง", "ค่าใช้จ่าย", "งบประมาณ",
                 "โปรโมชั่น", "ส่วนลด", "ผ่อน",
                 "price", "pricing", "cost", "quote", "quotation", "โควท"]))
            return t("pi.a.pricing");
        if (has(["ติดต่อ", "เดโม", "นัดหมาย", "ขาย", "demo", "contact", "sales"]))
            return t("pi.a.contact");
        if (has(["crm", "erp", "saas", "pi tasks", "boq"]) && q.length < 60)
            return t("pi.a.crm");
        return null;
    }

    /* ---------------- transport for the Pi console ---------------- */

    function answer(payload) {
        var message = payload.message || "";
        var lang = payload.lang || "th";

        var routed = intercept(message);
        if (routed) return Promise.resolve(routed);

        return load().then(function () {
            var qNorm = norm(message);
            var qTri = trigrams(qNorm);
            var qTriCount = Object.keys(qTri).length;

            var ranked = KB.entries
                .map(function (e) {
                    return { e: e, s: score(qNorm, qTri, qTriCount, e) };
                })
                .sort(function (a, b) { return b.s - a.s; });

            var top = ranked[0];
            if (!top || top.s < 3) {
                return t("pi.fallback");
            }

            /* strong match with a written answer → full reply */
            if (top.s >= 6 && (top.e.a_th || top.e.a_en)) {
                return compose(top.e, lang);
            }

            /* otherwise point at the clauses that look relevant */
            var picks = [];
            var seen = {};
            ranked.slice(0, 8).forEach(function (r) {
                if (picks.length >= 3 || r.s < 3) return;
                var key = (r.e.code || "") + "|" + (r.e.clause || r.e.title);
                if (seen[key]) return;
                seen[key] = 1;
                picks.push(r.e);
            });
            if (!picks.length) return t("pi.fallback");
            if (picks.length === 1 && (picks[0].a_th || picks[0].a_en)) {
                return compose(picks[0], lang);
            }
            return composePointers(picks, lang);
        }).catch(function () {
            return t("pi.fallback");
        });
    }

    /* plug into the console through the adapter designed for phase 2 */
    function arm() {
        if (global.PiConsole) {
            global.PiConsole.configure({ transport: answer });
        }
    }

    global.PiBrain = { answer: answer, load: load, _score: score };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", arm);
    } else {
        arm();
    }
})(window);
