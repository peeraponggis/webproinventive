/* =========================================================
   Pi Brain — client-side EIT knowledge base for the console
   ---------------------------------------------------------
   Phase 1: clause references + curated FAQ (knowledge.json).
   Phase 2: lookup skills over digitized tables, in two tiers —
     tables-public.json  (tariffs, Ft, PEA labs, compat: public data)
     tables-private.json (วสท. tables: git-ignored, fetched only for
                          logged-in staff and only where deployed)
   — plus a memory loop: every question is logged locally, staff can
   /teach answers that take effect immediately, and /export produces
   JSON for tools/faq_extra.json so the whole team benefits.

   Everything runs in the browser: keyword + Thai trigram retrieval,
   rule-based intent parsers, no model, no server. Optional:
     PiBrain.configure({ logEndpoint }) → sendBeacon question logs.

   Copyright guard: public files carry only clause / table numbers,
   headings, government/manufacturer data and our own paraphrases.
   ========================================================= */
(function (global) {
    "use strict";

    var SRC = (document.currentScript && document.currentScript.src) || "";
    var BASE = SRC.replace(/[^/]+$/, "");
    var VQ = SRC.indexOf("?") !== -1 ? SRC.slice(SRC.indexOf("?")) : "";

    var QLOG_KEY = "pi_qlog";
    var TAUGHT_KEY = "pi_faq_local";
    var QLOG_CAP = 300;

    var TOKEN_KEY = "pi_tables_token";
    var config = {
        logEndpoint: null,
        /* internal host that serves the วสท. tables (Railway app, bearer token required) */
        privateTablesUrl: "https://web-production-359eb.up.railway.app/api/pi/tables"
    };
    var KB = null;
    var loading = null;
    var TABLES = { public: undefined, private: undefined };   /* undefined = not tried yet */

    function t(key, vars) { return global.I18N ? global.I18N.t(key, vars) : key; }
    function lang() { return global.I18N ? global.I18N.get() : "th"; }
    function user() { return global.PiAuth ? global.PiAuth.getUser() : null; }

    /* ================= knowledge base ================= */

    function index(e) {
        e._text = norm([e.title, e.kw, e.a_th, e.a_en, e.clause, e.id].filter(Boolean).join(" "));
        e._tri = trigrams(e._text);
        return e;
    }

    function load() {
        if (KB) return Promise.resolve(KB);
        if (!loading) {
            loading = fetch(BASE + "knowledge.json" + VQ)
                .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
                .then(function (data) {
                    KB = data;
                    KB.entries.forEach(index);
                    taughtList().forEach(function (f) { KB.entries.push(index(taughtToEntry(f))); });
                    return KB;
                });
        }
        return loading;
    }

    function tablesToken() { try { return localStorage.getItem(TOKEN_KEY) || ""; } catch (e) { return ""; } }

    function fetchJSON(url, opts) {
        return fetch(url, opts).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    }

    function loadTables(tier) {
        if (TABLES[tier] !== undefined) return Promise.resolve(TABLES[tier]);
        if (tier === "private" && !user()) return Promise.resolve(null);
        var local = fetchJSON(BASE + "tables-" + tier + ".json" + VQ);
        var p = local;
        if (tier === "private") {
            /* local file first (internal hosts), else the Railway endpoint with the staff token */
            p = local.then(function (d) {
                if (d) return d;
                var tok = tablesToken();
                if (!config.privateTablesUrl || !tok) return null;
                return fetchJSON(config.privateTablesUrl, { headers: { Authorization: "Bearer " + tok } });
            });
        }
        return p.then(function (d) { TABLES[tier] = d ? d.tables : null; return TABLES[tier]; });
    }

    /* /tables — show status, store or clear the staff token for the private endpoint */
    function tablesCmd(arg) {
        var a = (arg || "").trim();
        if (a === "clear") {
            try { localStorage.removeItem(TOKEN_KEY); } catch (e) { /* ignore */ }
            TABLES["private"] = undefined;
            return t("kb.tablesCleared");
        }
        if (a) {
            try { localStorage.setItem(TOKEN_KEY, a); } catch (e) { /* ignore */ }
            TABLES["private"] = undefined;
            return loadTables("private").then(function (T) {
                return T ? t("kb.tablesOk", { n: Object.keys(T).length }) : t("kb.tablesFail");
            });
        }
        return loadTables("private").then(function (T) {
            return (T ? t("kb.tablesOk", { n: Object.keys(T).length }) : t("kb.tablesNone")) +
                "\n" + t("kb.tablesHint", { url: config.privateTablesUrl || "-" });
        });
    }

    /* ================= text matching (Thai-friendly) ================= */

    function norm(s) {
        return (s || "").toLowerCase()
            .replace(/²/g, "2")
            .replace(/[็-์]/g, "")
            .replace(/[^ก-ๆa-z0-9.() ]+/g, " ")
            .replace(/\s+/g, " ").trim();
    }

    function trigrams(s) {
        var set = {}, packed = s.replace(/ /g, "");
        for (var i = 0; i <= packed.length - 3; i++) set[packed.substr(i, 3)] = 1;
        return set;
    }

    function score(qNorm, qTri, qTriCount, entry) {
        var s = 0;
        qNorm.split(" ").forEach(function (w) {
            if (w.length >= 2 && entry._text.indexOf(w) !== -1) s += w.length >= 4 ? 3 : 2;
        });
        var hit = 0;
        for (var g in qTri) if (entry._tri[g]) hit++;
        if (qTriCount > 0) s += (hit / qTriCount) * 10;
        var mm = qNorm.match(/\d+(?:\.\d+)+/);
        if (mm && entry.clause && entry.clause.indexOf(mm[0]) !== -1) s += 6;
        if (entry.type === "taught") s *= 1.4;
        else if (entry.type === "faq") s *= 1.25;
        else if (entry.type === "provision") s *= 1.15;
        return s;
    }

    /* ================= answer composition ================= */

    function cite(entry) {
        var code = entry.code && KB.codes[entry.code];
        var name = code ? code.eitCode : (entry.eitCode || entry.code || "");
        var bits = [name];
        if (entry.clause) bits.push(/^(ข้อ|ตาราง|ภาคผนวก|clause|table)/i.test(entry.clause) ? entry.clause : (t("kb.clause") + " " + entry.clause));
        if (entry.table) bits.push(entry.table);
        return bits.filter(Boolean).join(" · ");
    }

    function tail(citeStr, isPrivate, isPublicData) {
        return "\n\n📖 " + t("kb.ref") + ": " + citeStr +
            (isPrivate ? " " + t("kb.internal") : "") +
            "\n⚠️ " + t(isPublicData ? "kb.disclaimerPub" : "kb.disclaimer");
    }

    function compose(best, l) {
        var body = (l === "en" && best.a_en) ? best.a_en : (best.a_th || best.title);
        if (best.type === "provision" && best.value && body.indexOf(String(best.value)) === -1) body += " — " + best.value + " " + (best.unit || "");
        var c = cite(best);
        return body.trim() + (c ? tail(c, false) : "\n\n⚠️ " + t("kb.disclaimer"));
    }

    function composePointers(list) {
        return t("kb.pointer") + "\n" + list.map(function (e) {
            return "• " + e.title + " — " + cite(e);
        }).join("\n") + "\n\n⚠️ " + t("kb.disclaimer");
    }

    function tcite(T, id) {
        var c = T[id].cite;
        return c.doc + " · " + c.table + (c.page ? " (" + t("kb.page") + " " + c.page + ")" : "");
    }

    function num(s) { return parseFloat(String(s).replace(/,/g, "")); }
    function fmt(n) { return Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 }); }

    /* ================= intent helpers ================= */

    function grab(q, re) { var m = q.match(re); return m ? parseFloat(m[1]) : null; }
    var AMP = /(\d+(?:\.\d+)?)\s*(?:a\b|amp|แอมป|แอม)/;
    var MM2 = /(\d+(?:\.\d+)?)\s*(?:mm2|sqmm|sq\.?\s*mm|ตร\.?\s*มม|ตารางมิลลิเมตร|ตารางมม|มิล)/;
    var DEGC = /(\d+(?:\.\d+)?)\s*(?:องศา|deg|c\b)/;
    var METRE = /(\d+(?:\.\d+)?)\s*(?:m\b|เมตร|metre|meter)/;

    /* ================= lookup skills ================= */
    /* each: { id, tier, tables:[...], match(qNorm) -> params|null, run(params, T, l) -> string|null } */

    /* rule-of-thumb sizing (our own estimate, not a standard value) */
    var SIZING = { psh: 4.2, eff: 0.8, dod: 0.9, panelW: 550 };

    var SKILLS = [
        {
            id: "sizing", tier: "none", tables: [],
            match: function (q) {
                if (!/กี\s*แผง|จำนวนแผง|แผง.{0,12}กี|how many panel|panels? .{0,20}need|ขนาดระบบ|กี\s*kwp|size (?:the |a )?system/.test(q)) return null;
                var batt = null, m;
                if (/แบต|battery|bess/.test(q)) { m = q.match(/(\d+(?:\.\d+)?)\s*kwh/); if (m) batt = parseFloat(m[1]); }
                var load = null;
                m = q.match(/(?:ใช\S*|โหลด|load|use)[^\d]{0,20}(\d+(?:\.\d+)?)\s*kwh/); if (m && !batt) load = parseFloat(m[1]);
                if (!load) { m = q.match(/(\d+(?:\.\d+)?)\s*(?:หนวย|หน่วย|unit)/); if (m) load = parseFloat(m[1]) / 30; }
                if (!load && !batt) { m = q.match(/(\d+(?:\.\d+)?)\s*kwh/); if (m) load = parseFloat(m[1]); }
                var kwp = grab(q, /(\d+(?:\.\d+)?)\s*kwp/);
                var w = grab(q, /(\d+(?:\.\d+)?)\s*(?:w\b|วัตต|watt)/);
                if (!batt && !load && !kwp) return null;
                return { batt: batt, load: load, kwp: kwp, w: w };
            },
            run: function (p, T, l) {
                var w = p.w || SIZING.panelW;
                var lines = [], need = 0;
                if (!p.kwp) {
                    if (p.load) { need += p.load; lines.push(l === "en" ? "daytime/daily load " + fmt(p.load) + " kWh" : "โหลดที่ต้องจ่าย " + fmt(p.load) + " kWh/วัน"); }
                    if (p.batt) { var b = p.batt * SIZING.dod; need += b; lines.push(l === "en" ? "recharge " + p.batt + " kWh battery × " + SIZING.dod + " = " + fmt(b) + " kWh" : "ชาร์จแบต " + p.batt + " kWh × " + SIZING.dod + " = " + fmt(b) + " kWh"); }
                    p.kwp = need / (SIZING.psh * SIZING.eff);
                }
                var panels = Math.ceil(p.kwp * 1000 / w);
                var out = l === "en"
                    ? "Rough estimate (assumptions: " + SIZING.psh + " peak-sun hours/day · system efficiency " + Math.round(SIZING.eff * 100) + "% · battery usable " + Math.round(SIZING.dod * 100) + "%, one full cycle/day)" +
                      (lines.length ? "\n• energy to generate: " + fmt(need) + " kWh/day (" + lines.join(" + ") + ")" : "") +
                      "\n• array size ≈ " + fmt(p.kwp) + " kWp" +
                      "\n• " + w + " W panels ≈ " + panels + " panels" + (p.w ? "" : " (assumed " + w + " W)") +
                      "\nThe real count depends on daytime load, roof orientation/tilt and losses — design it in ASC or contact sales 080-028-2399"
                    : "ประมาณการเบื้องต้น (สมมติฐาน: แดดเฉลี่ย " + SIZING.psh + " ชม./วัน · ประสิทธิภาพระบบ " + Math.round(SIZING.eff * 100) + "% · แบตใช้งานได้ " + Math.round(SIZING.dod * 100) + "% ชาร์จเต็มวันละ 1 รอบ)" +
                      (lines.length ? "\n• พลังงานที่ต้องผลิต: " + fmt(need) + " kWh/วัน (" + lines.join(" + ") + ")" : "") +
                      "\n• ขนาดระบบที่ต้องการ ≈ " + fmt(p.kwp) + " kWp" +
                      "\n• แผง " + w + " W ≈ " + panels + " แผง" + (p.w ? "" : " (สมมติแผง " + w + " W)") +
                      "\nจำนวนจริงขึ้นกับโหลดกลางวัน ทิศ/มุมหลังคา และการสูญเสีย — ออกแบบละเอียดด้วย ASC หรือติดต่อฝ่ายขาย 080-028-2399";
                out += "\n\n📖 " + t("kb.ref") + ": " + t("kb.estimate");
                if (p.batt && p.batt >= 50 && KB) {
                    var hit = KB.entries.filter(function (e) { return e.type === "provision" && /50 kwh/.test(e._text); })[0];
                    if (hit) out += "\n" + t("kb.alsoNote") + " " + (l === "en" && hit.a_en ? hit.a_en : hit.a_th) + " (" + cite(hit) + ")";
                }
                return out + "\n⚠️ " + t("kb.disclaimer");
            }
        },
        {
            id: "egc", tier: "private", tables: ["T4-2"],
            match: function (q) {
                if (!/สายดิน|egc|earth(?:ing)? conductor|grounding conductor/.test(q)) return null;
                if (/หลักดิน|gec|electrode/.test(q)) return null;
                var a = grab(q, AMP) || (/เบรกเกอร|breaker|ocpd|ฟิวส|fuse|cb\b/.test(q) ? grab(q, /(\d+(?:\.\d+)?)/) : null);
                return a ? { a: a } : null;
            },
            run: function (p, T, l) {
                var rows = T["T4-2"].rows.map(function (r) { return { max: num(r.ocpd_max_a), mm: r.egc_copper_mm2 }; })
                    .sort(function (x, y) { return x.max - y.max; });
                var hit = rows.filter(function (r) { return r.max >= p.a; })[0];
                if (!hit) return null;
                return (l === "en"
                    ? "Overcurrent device rated up to " + hit.max + " A → copper equipment grounding conductor " + hit.mm + " mm²"
                    : "เครื่องป้องกันกระแสเกินไม่เกิน " + hit.max + " A → สายดินบริภัณฑ์ทองแดงขนาด " + hit.mm + " mm²")
                    + tail(tcite(T, "T4-2"), true);
            }
        },
        {
            id: "gec", tier: "private", tables: ["T4-1"],
            match: function (q) {
                if (!/หลักดิน|gec|electrode conductor/.test(q)) return null;
                var mm = grab(q, MM2) || grab(q, /(\d+(?:\.\d+)?)/);
                return mm ? { mm: mm } : null;
            },
            run: function (p, T, l) {
                var rows = T["T4-1"].rows.map(function (r) { return { max: num(r.phase_conductor_max_mm2), gec: r.gec_copper_mm2 }; })
                    .sort(function (x, y) { return x.max - y.max; });
                var hit = rows.filter(function (r) { return r.max >= p.mm; })[0];
                if (!hit) return null;
                var band = hit.max >= 9999 ? (l === "en" ? "over 500" : "เกิน 500") : String(hit.max);
                return (l === "en"
                    ? "Service conductor up to " + band + " mm² → copper grounding electrode conductor " + hit.gec + " mm²"
                    : "ตัวนำประธานไม่เกิน " + band + " mm² → สายต่อหลักดินทองแดงขนาด " + hit.gec + " mm²")
                    + tail(tcite(T, "T4-1"), true);
            }
        },
        {
            id: "temp", tier: "private", tables: ["T5-43", "T5-44"],
            match: function (q) {
                if (!/อุณหภูม|temperature|ambient/.test(q)) return null;
                var c = grab(q, DEGC); if (c === null) return null;
                return { c: c, ins: /xlpe|epr|90/.test(q) ? "XLPE" : "PVC", buried: /ฝังดิน|ใตดิน|ใต้ดิน|buried|underground/.test(q) };
            },
            run: function (p, T, l) {
                var id = p.buried ? "T5-44" : "T5-43";
                var want = p.ins === "XLPE" ? 90 : 70;
                var rows = T[id].rows.filter(function (r) {
                    var okIns = num(r.insulation_temp_c) === want && (p.buried || (p.ins === "XLPE" ? /XLPE/.test(r.insulation) : r.insulation === "PVC"));
                    return okIns && p.c >= num(r.ambient_min_c) && p.c <= num(r.ambient_max_c);
                });
                if (!rows.length) return null;
                var f = rows[0].factor;
                return (l === "en"
                    ? "Ambient " + p.c + " °C, " + p.ins + " insulation" + (p.buried ? " (buried)" : "") + " → correction factor " + f
                    : "อุณหภูมิแวดล้อม " + p.c + " °C ฉนวน " + p.ins + (p.buried ? " (ฝังดิน)" : "") + " → ตัวคูณปรับค่า " + f)
                    + tail(tcite(T, id), true);
            }
        },
        {
            id: "group", tier: "private", tables: ["T5-8"],
            match: function (q) {
                if (!/ทอ|ท่อ|ชองเดินสาย|raceway|conduit/.test(q) || !/ตัวคูณ|factor|ลดพิกัด|derat/.test(q)) return null;
                var n = grab(q, /(\d+)\s*(?:วงจร|circuit)/); return n ? { n: n } : null;
            },
            run: function (p, T, l) {
                var hit = T["T5-8"].rows.filter(function (r) { return p.n >= num(r.circuit_groups_min) && p.n <= num(r.circuit_groups_max); })[0];
                if (!hit) return null;
                return (l === "en" ? p.n + " circuits in one raceway → grouping factor " + hit.factor
                    : p.n + " วงจรในช่องเดินสายเดียวกัน → ตัวคูณ " + hit.factor) + tail(tcite(T, "T5-8"), true);
            }
        },
        {
            id: "vdrop", tier: "private", tables: ["APPX-THO"],
            match: function (q) {
                if (!/voltage drop|แรงดันตก|vd\b|mv\/a/.test(q)) return null;
                var mm = grab(q, MM2); if (!mm) return null;
                return {
                    mm: mm, ph: /3\s*(?:ph|เฟส|phase)|three/.test(q) ? "3ph" : "1ph",
                    ins: /xlpe/.test(q) ? "XLPE" : "PVC", cores: /multi|หลายแกน/.test(q) ? "multi" : "single",
                    L: grab(q, METRE), I: grab(q, AMP)
                };
            },
            run: function (p, T, l) {
                var rows = T["APPX-THO"].rows.filter(function (r) {
                    return num(r.csa_mm2) === p.mm && r.phases === p.ph && r.cable_type === p.ins && r.cores === p.cores;
                });
                if (!rows.length) return null;
                var pref = rows.filter(function (r) { return /G1,2,5|ทุกกลุ่ม/.test(r.arrangement); })[0] || rows[0];
                var mv = num(pref.mv_per_amp_per_metre);
                var out = (l === "en"
                    ? p.mm + " mm² " + p.ins + " " + (p.cores === "multi" ? "multicore" : "single-core") + ", " + p.ph + " (" + pref.arrangement + ") → " + mv + " mV/A/m"
                    : "สาย " + p.mm + " mm² " + p.ins + " " + (p.cores === "multi" ? "หลายแกน" : "แกนเดียว") + " " + (p.ph === "3ph" ? "3 เฟส" : "1 เฟส") + " (" + pref.arrangement + ") → " + mv + " mV/A/m");
                if (p.L && p.I) {
                    var vd = mv * p.I * p.L / 1000;
                    out += (l === "en" ? "\nAt " + p.I + " A over " + p.L + " m → ≈ " + fmt(vd) + " V drop"
                        : "\nที่กระแส " + p.I + " A ระยะ " + p.L + " m → แรงดันตก ≈ " + fmt(vd) + " V");
                }
                if (rows.length > 1) out += "\n" + (l === "en" ? "Other arrangements: " : "รูปแบบอื่น: ") +
                    rows.filter(function (r) { return r !== pref; }).map(function (r) { return r.arrangement + " " + r.mv_per_amp_per_metre; }).join(" · ");
                return out + tail(tcite(T, "APPX-THO"), true);
            }
        },
        {
            id: "ampacity", tier: "private", tables: ["AMPACITY"],
            match: function (q) {
                if (!/ampacity|ขนาดกระแส|พิกัดกระแส|ทนกระแส|กระแส.*สาย|current.*carr/.test(q)) return null;
                var mm = grab(q, MM2); if (!mm) return null;
                var g = q.match(/\bg\s*([1256])\b/);
                return { mm: mm, ins: /xlpe/.test(q) ? "XLPE" : (/pvc/.test(q) ? "PVC" : null), method: g ? "G" + g[1] : null };
            },
            run: function (p, T, l) {
                var rows = T["AMPACITY"].rows.filter(function (r) {
                    return num(r.csa_mm2) === p.mm && (!p.ins || r.insulation === p.ins) && (!p.method || r.install_method_id === p.method);
                });
                if (!rows.length) return null;
                var lines = rows.slice(0, 6).map(function (r) {
                    return "• " + r.install_method_id + " · " + r.insulation + " · " + r.cores + " → " + r.ampacity_a + " A (" + t("kb.table") + " " + r.table_id + ")";
                });
                var head = (l === "en" ? "Ampacity for " + p.mm + " mm²" : "ขนาดกระแสสาย " + p.mm + " mm²") + (p.method ? " " + p.method : "") + ":";
                return head + "\n" + lines.join("\n") + (rows.length > 6 ? "\n…" : "") + tail(tcite(T, "AMPACITY"), true);
            }
        },
        {
            id: "conduit", tier: "private", tables: ["APPX-KHO"],
            match: function (q) {
                if (!/รอยสาย|ร้อยสาย|รอยทอ|conduit|กี่เสน|กี่เส้น|ใสสายได|max.*count/.test(q)) return null;
                var size = grab(q, /(?:ทอ|ท่อ|conduit)\D{0,12}(\d+(?:\.\d+)?)\s*(?:mm\b|มม)/) || grab(q, /(\d+)\s*(?:mm\b|มม)/);
                var mm = grab(q, MM2); if (!size || !mm) return null;
                return { size: size, mm: mm, nyy: /nyy/.test(q) };
            },
            run: function (p, T, l) {
                var rows = T["APPX-KHO"].rows.filter(function (r) {
                    return num(r.trade_size_mm) === p.size && num(r.csa_mm2) === p.mm && (p.nyy ? /NYY/.test(r.cable_code) : /IEC 01/.test(r.cable_code));
                });
                if (!rows.length) return null;
                var r = rows[0];
                return (l === "en" ? r.conduit_type + " " + p.size + " mm with " + r.cable_code + " " + p.mm + " mm² → max " + r.max_count + " conductors"
                    : r.conduit_type + " ขนาด " + p.size + " mm ร้อยสาย " + r.cable_code + " " + p.mm + " mm² → ได้สูงสุด " + r.max_count + " เส้น") + tail(tcite(T, "APPX-KHO"), true);
            }
        },
        {
            id: "meter", tier: "private", tables: ["T3-5", "T3-4"],
            match: function (q) {
                if (!/มิเตอร|meter/.test(q)) return null;
                var m = q.match(/(\d+)\s*\(\s*(\d+)\s*\)/) || q.match(/(\d+)\s*\/\s*(\d+)/);
                var size = m ? m[1] + " (" + m[2] + ")" : (/\b200\b/.test(q) ? "200" : null);
                if (!size) return null;
                return { size: size, mea: /mea|กฟน|นครหลวง/.test(q) };
            },
            run: function (p, T, l) {
                var id = p.mea ? "T3-4" : "T3-5";
                var rows = T[id].rows.filter(function (r) { return r.meter_size_a === p.size; });
                if (!rows.length) return null;
                var lines = rows.map(function (r) {
                    return p.mea
                        ? "• " + r.meter_size_a + " A → " + (l === "en" ? "max OCPD " : "เบรกเกอร์สูงสุด ") + r.max_ocpd_a + " A · " + (l === "en" ? "max load " : "โหลดสูงสุด ") + r.max_load_a + " A"
                        : "• " + r.meter_size_a + " A " + r.phases + " → " + (l === "en" ? "Cu " : "สายทองแดง ") + r.min_conductor_mm2 + " mm² / Al " + r.min_conductor_al_mm2 + " mm²" +
                          (r.breaker_max_a ? " · " + (l === "en" ? "breaker ≤ " : "เบรกเกอร์ ≤ ") + r.breaker_max_a + " A" : "") +
                          (r.safety_switch_a ? " · safety switch " + r.safety_switch_a + " A" : "");
                });
                return (l === "en" ? (p.mea ? "MEA" : "PEA") + " meter " + p.size + " A:" : "มิเตอร์ " + (p.mea ? "กฟน." : "กฟภ.") + " " + p.size + " A:") + "\n" + lines.join("\n") + tail(tcite(T, id), true);
            }
        },
        {
            id: "ft", tier: "public", tables: ["FT_history"],
            match: function (q) { return /\bft\b|เอฟที/.test(q) ? {} : null; },
            run: function (p, T, l) {
                var rows = T["FT_history"].rows, r = rows[rows.length - 1];
                return (l === "en" ? "Ft " + r.period_from + " → " + r.period_to + ": " + r.ft_charged_satang_per_unit + " satang/unit charged (calculated " + r.ft_calculated_satang_per_unit + ")"
                    : "ค่า Ft งวด " + r.period_from + " ถึง " + r.period_to + ": เรียกเก็บ " + r.ft_charged_satang_per_unit + " สตางค์/หน่วย (คำนวณได้ " + r.ft_calculated_satang_per_unit + ")") + tail(tcite(T, "FT_history"), false, true);
            }
        },
        {
            id: "tou", tier: "public", tables: ["TARIFF_tou_periods", "TARIFF_tou_rates"],
            match: function (q) { return /\btou\b|\btod\b|peak|พีค|ชวงเวลา.*คาไฟ|ช่วงเวลา.*ค่าไฟ/.test(q) ? {} : null; },
            run: function (p, T, l) {
                var per = T["TARIFF_tou_periods"].rows.map(function (r) { return "• " + r.period + " " + r.time_from + "–" + r.time_to + " (" + r.days + ")"; });
                var home = T["TARIFF_tou_rates"].rows.filter(function (r) { return /^1\.2/.test(r.tariff_code); })
                    .map(function (r) { return "• " + r.tariff_code + " " + r.voltage_band + ": peak " + r.peak_baht_per_unit + " / off-peak " + r.offpeak_baht_per_unit + " " + (l === "en" ? "THB/unit" : "บาท/หน่วย"); });
                return (l === "en" ? "TOU/TOD periods:\n" : "ช่วงเวลา TOU/TOD:\n") + per.join("\n") + "\n" + (l === "en" ? "Residential TOU rates:\n" : "อัตรา TOU บ้านอยู่อาศัย:\n") + home.join("\n") + tail(tcite(T, "TARIFF_tou_rates"), false, true);
            }
        },
        {
            id: "tariff", tier: "public", tables: ["TARIFF_energy_blocks"],
            match: function (q) { return /คาไฟ|ค่าไฟ|หนวยละ|หน่วยละ|baht.*unit|electricity (?:rate|tariff|price)|tariff/.test(q) ? { units: grab(q, /(\d+)\s*(?:หนวย|หน่วย|unit|kwh)/) } : null; },
            run: function (p, T, l) {
                var rows = T["TARIFF_energy_blocks"].rows.filter(function (r) { return r.tariff_code === "1.1.1"; });
                if (p.units) {
                    var hit = rows.filter(function (r) { return p.units >= num(r.unit_from) && p.units <= num(r.unit_to); })[0];
                    if (hit) return (l === "en" ? "Residential 1.1.1 (≤150 units/month), block " + hit.unit_from + "–" + hit.unit_to + " units → " + hit.baht_per_unit + " THB/unit + service " + hit.service_charge_baht_month + " THB/month (excl. Ft & VAT)"
                        : "บ้านอยู่อาศัย 1.1.1 (≤150 หน่วย/เดือน) ช่วงหน่วยที่ " + hit.unit_from + "–" + hit.unit_to + " → " + hit.baht_per_unit + " บาท/หน่วย + ค่าบริการ " + hit.service_charge_baht_month + " บาท/เดือน (ยังไม่รวม Ft และ VAT)") + tail(tcite(T, "TARIFF_energy_blocks"), false, true);
                }
                var lines = rows.map(function (r) { return "• " + r.unit_from + "–" + (num(r.unit_to) > 9999 ? "∞" : r.unit_to) + " → " + r.baht_per_unit; });
                return (l === "en" ? "Residential tariff 1.1.1 (THB/unit, excl. Ft & VAT):\n" : "อัตราบ้านอยู่อาศัย 1.1.1 (บาท/หน่วย ยังไม่รวม Ft และ VAT):\n") + lines.join("\n") + tail(tcite(T, "TARIFF_energy_blocks"), false, true);
            }
        },
        {
            id: "compat", tier: "public", tables: ["COMPAT_matrix"],
            match: function (q) {
                if (!/compat|เขากัน|เข้ากัน|ใชดวยกัน|ใชกับ|ใช้กับ|ใชรวม|จับคู|รองรับ|ได้ไหม|ไดไหม/.test(q)) return null;
                var models = q.toUpperCase().match(/[A-Z]{2,}[A-Z0-9-]*\d[A-Z0-9-]*/g);
                return models && models.length ? { models: models } : null;
            },
            run: function (p, T, l) {
                var all = T["COMPAT_matrix"].rows;
                function txt(r) { return (r.a_model + " " + r.b_model).toUpperCase(); }
                var rows = all.filter(function (r) { return p.models.every(function (m) { return txt(r).indexOf(m) !== -1; }); });
                if (!rows.length) {
                    rows = all.filter(function (r) { return p.models.some(function (m) { return txt(r).indexOf(m) !== -1; }); }).slice(0, 8);
                    if (!rows.length) return null;
                    return (l === "en" ? "Known pairings for " + p.models.join(" / ") + ":\n" : "คู่ที่ทราบสำหรับ " + p.models.join(" / ") + ":\n") +
                        rows.map(function (r) { return "• " + r.a_brand + " " + r.a_model + " ↔ " + r.b_model + " (" + r.level + ")"; }).join("\n") + tail(tcite(T, "COMPAT_matrix"), false, true);
                }
                var r = rows[0];
                return (l === "en" ? r.a_brand + " " + r.a_model + " ↔ " + r.b_brand + " " + r.b_model + ": " + r.level + " (source: " + r.evidence_doc + ")"
                    : r.a_brand + " " + r.a_model + " ↔ " + r.b_brand + " " + r.b_model + ": " + (r.level === "certified" ? "ผู้ผลิตรับรองว่าใช้ร่วมกันได้" : r.level) + " (เอกสาร: " + r.evidence_doc + ")") + tail(tcite(T, "COMPAT_matrix"), false, true);
            }
        },
        {
            id: "labs", tier: "public", tables: ["PEA_accredited_test_labs"],
            match: function (q) { return /หนวยทดสอบ|หน่วยทดสอบ|แลบ|แล็บ|test lab|accredited|รับรอง.*ทดสอบ/.test(q) ? {} : null; },
            run: function (p, T, l) {
                var rows = T["PEA_accredited_test_labs"].rows, by = {};
                rows.forEach(function (r) { by[r.country] = (by[r.country] || 0) + 1; });
                var top = Object.keys(by).sort(function (a, b) { return by[b] - by[a]; }).slice(0, 6).map(function (c) { return c + " " + by[c]; });
                return (l === "en" ? "PEA-accredited test laboratories: " + rows.length + " (" + top.join(", ") + "). Examples: "
                    : "หน่วยทดสอบที่ กฟภ. รับรอง: " + rows.length + " แห่ง (" + top.join(", ") + ") ตัวอย่าง: ") +
                    rows.slice(0, 5).map(function (r) { return r.lab_name + " ≤" + r.max_test_rating + " " + r.rating_unit; }).join(" · ") + tail(tcite(T, "PEA_accredited_test_labs"), false, true);
            }
        }
    ];

    function runSkills(qNorm, l) {
        for (var i = 0; i < SKILLS.length; i++) {
            var sk = SKILLS[i];
            var p = sk.match(qNorm);
            if (!p) continue;
            return (sk.tier === "none" ? Promise.resolve({}) : loadTables(sk.tier)).then(function (T) {
                if (sk.tier !== "none" && (!T || !sk.tables.every(function (id) { return T[id]; }))) return { kind: "locked", skill: sk };
                var out = sk.run(p, T, l);
                return out ? { kind: "hit", text: out } : { kind: "miss" };
            });
        }
        return Promise.resolve(null);
    }

    var TABLE_NAMES = {
        "T4-2": "ตารางที่ 4-2", "T4-1": "ตารางที่ 4-1", "T5-43": "ตารางที่ 5-43", "T5-44": "ตารางที่ 5-44",
        "T5-8": "ตารางที่ 5-8", "APPX-THO": "ภาคผนวก ฐ", "AMPACITY": "ตารางขนาดกระแส 5-20/5-23/5-27/5-29",
        "APPX-KHO": "ภาคผนวก ฎ", "T3-5": "ตารางที่ 3-5", "T3-4": "ตารางที่ 3-4"
    };

    /* ================= sales intercept ================= */

    function intercept(message) {
        var q = message.toLowerCase();
        function has(words) { return words.some(function (w) { return q.indexOf(w) !== -1; }); }
        /* utility-tariff questions are data questions, not sales */
        if (has(["ค่าไฟ", "หน่วยละ", "tou", "tod", "ft", "อัตราค่าไฟ", "tariff"])) return null;
        if (has(["ราคา", "กี่บาท", "ค่าติดตั้ง", "ค่าใช้จ่าย", "งบประมาณ", "โปรโมชั่น", "ส่วนลด", "ผ่อน",
                 "price", "pricing", "cost", "quote", "quotation", "โควท"])) return t("pi.a.pricing");
        if (has(["ติดต่อ", "เดโม", "นัดหมาย", "ขาย", "demo", "contact", "sales"])) return t("pi.a.contact");
        if (has(["crm", "erp", "pi tasks", "boq"]) && q.length < 60) return t("pi.a.crm");
        return null;
    }

    /* ================= memory: question log + taught FAQ ================= */

    function readJSON(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (e) { return fallback; }
    }
    function writeJSON(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* storage blocked */ } }

    function logQuestion(q, s, answered, l) {
        var log = readJSON(QLOG_KEY, []);
        log.push({ q: q, ts: Date.now(), score: Math.round(s * 10) / 10, answered: answered, lang: l });
        if (log.length > QLOG_CAP) log = log.slice(-QLOG_CAP);
        writeJSON(QLOG_KEY, log);
        if (config.logEndpoint && navigator.sendBeacon) {
            try {
                var u = user();
                navigator.sendBeacon(config.logEndpoint, new Blob([JSON.stringify({
                    q: q, score: s, answered: answered, lang: l, ts: Date.now(), user: u ? u.email : null, page: location.pathname
                })], { type: "application/json" }));
            } catch (e) { /* fire-and-forget */ }
        }
    }

    function taughtList() { return readJSON(TAUGHT_KEY, []); }

    function taughtToEntry(f) {
        return {
            id: "LOCAL." + f.ts, type: "taught", code: f.code || null, clause: f.clause || null,
            table: null, title: f.q, kw: f.q, a_th: f.th, a_en: f.en || null
        };
    }

    function teach(arg) {
        var a = (arg || "").trim();
        if (!a || a === "list") {
            var list = taughtList();
            if (!list.length) return t("kb.teachEmpty");
            return list.map(function (f, i) {
                return (i + 1) + ". " + f.q + " → " + f.th.slice(0, 70) + (f.code ? " [" + f.code + " " + (f.clause || "") + "]" : "");
            }).join("\n");
        }
        var del = a.match(/^del\s+(\d+)$/i);
        if (del) {
            var list2 = taughtList(), i = parseInt(del[1], 10) - 1;
            if (!list2[i]) return t("pi.unknown");
            var gone = "LOCAL." + list2[i].ts;
            list2.splice(i, 1); writeJSON(TAUGHT_KEY, list2);
            if (KB) KB.entries = KB.entries.filter(function (e) { return e.id !== gone; });
            return t("kb.taughtRemoved");
        }
        var parts = a.split("|").map(function (s) { return s.trim(); });
        if (parts.length < 2 || !parts[0] || !parts[1]) return t("kb.teachUsage");
        var ref = (parts[2] || "").match(/(EIT-\d{4})\s*(.*)/i);
        var f = { ts: Date.now(), q: parts[0], th: parts[1], code: ref ? ref[1].toUpperCase() : null, clause: ref ? (ref[2].trim() || null) : null };
        var list3 = taughtList(); list3.push(f); writeJSON(TAUGHT_KEY, list3);
        if (KB) KB.entries.push(index(taughtToEntry(f)));
        return t("kb.taught");
    }

    function questions() {
        var log = readJSON(QLOG_KEY, []);
        if (!log.length) return t("kb.noQuestions");
        var groups = {};
        log.forEach(function (r) {
            var k = norm(r.q);
            var g = (groups[k] = groups[k] || { q: r.q, n: 0, weak: 0 });
            g.n++; if (!r.answered) g.weak++;
        });
        var list = Object.keys(groups).map(function (k) { return groups[k]; })
            .sort(function (a, b) { return (b.weak - a.weak) || (b.n - a.n); }).slice(0, 15);
        return t("kb.questionsHead", { total: log.length }) + "\n" + list.map(function (g) {
            return "• " + g.q + "  ×" + g.n + (g.weak ? "  ⚠️" + g.weak : "");
        }).join("\n");
    }

    function exportJSON() {
        var faq = taughtList().map(function (f) {
            return { kw: f.q, title: f.q, th: f.th, en: f.en || f.th, code: f.code, clause: f.clause };
        });
        var payload = JSON.stringify(faq, null, 1);
        try { if (navigator.clipboard) navigator.clipboard.writeText(payload).catch(function () { /* not focused */ }); } catch (e) { /* no clipboard */ }
        return t("kb.exported", { n: faq.length }) + "\n\n" + payload + "\n\n" + questions();
    }

    /* ================= console commands ================= */

    function cmd(name, arg) {
        if (!user()) return t("kb.staffOnly");
        if (name === "teach") return teach(arg);
        if (name === "questions") return questions();
        if (name === "export") return exportJSON();
        if (name === "tables") return tablesCmd(arg);
        return t("pi.unknown");
    }

    /* ================= main transport ================= */

    function answer(payload) {
        var message = payload.message || "";
        var l = payload.lang || lang();
        var routed = intercept(message);
        if (routed) return Promise.resolve(routed);

        var qNorm = norm(message);

        return load().then(function () {
            return runSkills(qNorm, l).then(function (sk) {
                if (sk && sk.kind === "hit") { logQuestion(message, 10, true, l); return sk.text; }

                var qTri = trigrams(qNorm), qTriCount = Object.keys(qTri).length;
                var ranked = KB.entries.map(function (e) { return { e: e, s: score(qNorm, qTri, qTriCount, e) }; })
                    .sort(function (a, b) { return b.s - a.s; });
                var top = ranked[0];

                if (sk && sk.kind === "locked") {
                    var names = sk.skill.tables.map(function (id) { return TABLE_NAMES[id] || id; }).join(" / ");
                    logQuestion(message, top ? top.s : 0, false, l);
                    return t(user() ? (tablesToken() ? "kb.lockedStaff" : "kb.lockedToken") : "kb.locked", { table: names }) + (top && top.s >= 3 ? "\n\n" + composePointers([top.e]) : "");
                }

                if (!top || top.s < 3) { logQuestion(message, top ? top.s : 0, false, l); return t("pi.fallback"); }
                if (top.s >= 6 && (top.e.a_th || top.e.a_en)) { logQuestion(message, top.s, true, l); return compose(top.e, l); }

                var picks = [], seen = {};
                ranked.slice(0, 8).forEach(function (r) {
                    if (picks.length >= 3 || r.s < 3) return;
                    var key = (r.e.code || "") + "|" + (r.e.clause || r.e.title);
                    if (seen[key]) return; seen[key] = 1; picks.push(r.e);
                });
                logQuestion(message, top.s, false, l);
                if (!picks.length) return t("pi.fallback");
                if (picks.length === 1 && (picks[0].a_th || picks[0].a_en)) return compose(picks[0], l);
                return composePointers(picks);
            });
        }).catch(function () { return t("pi.fallback"); });
    }

    function arm() { if (global.PiConsole) global.PiConsole.configure({ transport: answer }); }

    /* private tables become reachable after login — forget the "not loaded" state */
    document.addEventListener("auth:change", function () { TABLES["private"] = undefined; });

    global.PiBrain = {
        answer: answer, load: load, cmd: cmd, _score: score,
        configure: function (o) { Object.assign(config, o || {}); return this; },
        skills: SKILLS.map(function (s) { return s.id; })
    };

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arm); else arm();
})(window);
