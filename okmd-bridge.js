/* =========================================================
   OKMD AI Bridge — vanilla JS adapter for the OKMD AI API
   ---------------------------------------------------------
   Calls the OKMD AI REST + SSE endpoints directly (no React):
     Auth host : https://ai-api.okmd.or.th/api/v1/auth
     API base  : https://ai-api.okmd.or.th/api/v1/chats
     Auth      : POST /guest          (X-API-Key → guest_access_token)
     Starters  : GET  /conversation-starters
     Chat      : POST /message         (returns chat_message_id)
     Stream    : GET  /stream/{id}     (text/event-stream SSE)
     Feedback  : POST /chat-sessions/chat-messages/{id}/feedback

   Two usage modes:

   1) Standalone — use the promise-based API directly:
         OkmdBridge.init("YOUR_API_KEY");
         const { text, citations } = await OkmdBridge.chat("ถามอะไรก็ได้");

   2) PiConsole transport — wire OKMD into the existing console:
         // Inside pi-console.js, add a "case 'okmd':" to handleCommand
         // that calls OkmdBridge.handleCommand(arg)
         //
         // Or call manually:
         OkmdBridge.attachToPiConsole();

   Commands (via /okmd in PiConsole):
     /okmd <api_key>   — initialise + switch to OKMD AI mode
     /okmd status      — show current OKMD connection state
     /okmd off         — switch back to the local demo brain

   Persistence (survives browser/VS Code restarts):
     - API key, guest token, chat session  → localStorage["okmd_state"]
     - Q&A cache (max 100)                 → localStorage["okmd_cache"]
   ========================================================= */
(function (global) {
    "use strict";

    var STORAGE_KEY = "okmd_state";
    var CACHE_KEY = "okmd_cache";
    var AUTH_BASE = "https://ai-api.okmd.or.th/api/v1/auth";
    var CHATS_BASE = "https://ai-api.okmd.or.th/api/v1/chats";

    var state = {
        apiKey: null,
        guestToken: null,
        chatSessionId: null,
        initialized: false
    };

    var cache = {};

    /* ---------- state persistence ---------- */

    function loadState() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (raw) Object.assign(state, JSON.parse(raw));
        } catch (e) { /* ignore */ }
    }

    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                apiKey: state.apiKey,
                guestToken: state.guestToken,
                chatSessionId: state.chatSessionId,
                initialized: state.initialized
            }));
        } catch (e) { /* ignore */ }
    }

    loadState();

    /* ---------- cache persistence ---------- */

    function loadCache() {
        try {
            var raw = localStorage.getItem(CACHE_KEY);
            if (raw) cache = JSON.parse(raw);
        } catch (e) { /* ignore */ }
    }

    function saveCache() {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        } catch (e) { /* ignore */ }
    }

    function cacheGet(question) {
        return cache[question] || null;
    }

    function cacheSet(question, answer) {
        cache[question] = answer;
        var keys = Object.keys(cache);
        if (keys.length > 100) {
            delete cache[keys[0]];
        }
        saveCache();
    }

    function cacheSize() {
        return Object.keys(cache).length;
    }

    loadCache();

    /* ---------- internal: OKMD API headers ---------- */

    function authHeaders() {
        var headers = { "X-API-Key": state.apiKey };
        if (state.guestToken) {
            headers["Authorization"] = "Bearer " + state.guestToken;
        }
        return headers;
    }

    /* ---------- public: init / lifecycle ---------- */

    /* ให้ OKMD AI ตอบเสมอในภาษาไทย (ส่งเป็น prefix ในข้อความ) */
    var LANG_INSTRUCTION = "[\u0e02\u0e2d\u0e1a\u0e16\u0e32\u0e07\u0e44\u0e17\u0e22]";

    function init(apiKey, opts) {
        opts = opts || {};
        state.apiKey = apiKey;
        state.initialized = true;
        saveState();
        return getGuestToken(true).then(function () {
            if (opts.onReady) opts.onReady();
            return true;
        });
    }

    function isInitialized() {
        return state.initialized && !!state.apiKey;
    }

    function getApiKey() {
        return state.apiKey;
    }

    function reset() {
        state = {
            apiKey: null,
            guestToken: null,
            chatSessionId: null,
            initialized: false
        };
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    }

    /* ---------- auth: guest token ---------- */

    function getGuestToken(force) {
        if (!force && state.guestToken) {
            return Promise.resolve(state.guestToken);
        }
        if (!state.apiKey) {
            return Promise.reject(new Error("OKMD_API_KEY_NOT_SET"));
        }

        return fetch(AUTH_BASE + "/guest", {
            method: "POST",
            headers: { "X-API-Key": state.apiKey }
        })
            .then(function (res) {
                if (!res.ok) throw new Error("OKMD_GUEST_HTTP_" + res.status);
                return res.json();
            })
            .then(function (data) {
                if (data.status !== "Success") {
                    throw new Error("OKMD_GUEST_FAIL: " + (data.error && data.error.message));
                }
                state.guestToken = data.results.guest_access_token;
                saveState();
                return state.guestToken;
            });
    }

    /* ---------- conversation starters ---------- */

    function getConversationStarters() {
        return fetch(CHATS_BASE + "/conversation-starters", {
            headers: authHeaders()
        })
            .then(function (res) {
                if (!res.ok) throw new Error("HTTP_" + res.status);
                return res.json();
            })
            .then(function (data) {
                if (data.status !== "Success") return [];
                return data.results.conversation_starters || [];
            });
    }

    /* ---------- chat: post message ---------- */

    function postMessage(message, opts) {
        opts = opts || {};
        var payload = { message: LANG_INSTRUCTION + " " + message };
        if (state.chatSessionId) {
            payload.chat_session_id = state.chatSessionId;
        }
        if (opts.conversationStarterId) {
            payload.conversation_starter_id = opts.conversationStarterId;
        }
        if (opts.files) {
            payload.files = opts.files;
        }

        return fetch(CHATS_BASE + "/message", {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(payload)
        })
            .then(function (res) {
                if (!res.ok) throw new Error("HTTP_" + res.status);
                return res.json();
            })
            .then(function (data) {
                if (data.status !== "Success") {
                    throw new Error("OKMD_POST_FAIL: " + (data.error && data.error.message));
                }
                var results = data.results || {};
                if (results.chat_session_id) {
                    state.chatSessionId = results.chat_session_id;
                    saveState();
                }
                return results.chat_message_id;
            });
    }

    /* ---------- chat: SSE stream (fetch-based, supports custom headers) ---------- */

    function streamChatMessage(chatMessageId, onChunk, onCitations, onComplete, onError) {
        var url = CHATS_BASE + "/stream/" + chatMessageId + "?is_regenerate=false";
        var reader = null;
        var controller = null;

        function parseSSELine(line) {
            if (line.indexOf("data: ") === 0) {
                var jsonStr = line.slice(6);
                try {
                    var data = JSON.parse(jsonStr);
                    if (data.citations !== undefined) {
                        if (onChunk && data.answer !== undefined) onChunk(data.answer);
                        if (onCitations && data.citations && data.citations.length) onCitations(data.citations);
                        if (data.is_final && onComplete) onComplete();
                    } else if (data.error) {
                        if (onError) onError(new Error(data.message || "OKMD stream error"));
                    }
                } catch (e) { /* ignore malformed SSE line */ }
            } else if (line.indexOf("id: ") === 0) {
                if (onComplete) onComplete();
            }
        }

        var headers = authHeaders();
        headers["Accept"] = "text/event-stream";

        controller = new AbortController();

        return fetch(url, {
            method: "GET",
            headers: headers,
            signal: controller.signal
        })
            .then(function (res) {
                if (!res.ok) throw new Error("SSE_HTTP_" + res.status);
                reader = res.body.getReader();
                var decoder = new TextDecoder("utf-8");
                var buffer = "";

                function pump() {
                    return reader.read().then(function (result) {
                        if (result.done) {
                            if (buffer && buffer.trim()) parseSSELine(buffer);
                            if (onComplete) onComplete();
                            return;
                        }
                        buffer += decoder.decode(result.value, { stream: true });
                        var lines = buffer.split("\n");
                        buffer = lines.pop() || "";
                        lines.forEach(parseSSELine);
                        return pump();
                    });
                }

                return pump();
            })
            .catch(function (err) {
                if (err.name === "AbortError") return;
                if (onError) onError(err);
            });
    }

    /* ---------- public: chat (accumulates SSE to a Promise) ---------- */

    function chat(message, opts) {
        opts = opts || {};

        /* 1. ตรวจสอบแคชโลคัลก่อน — หากมีคำถามนี้แล้วให้ตอบจากแคช (ไม่เสีย API) */
        var cached = cacheGet(message);
        if (cached) {
            return Promise.resolve({ text: cached, citations: [] });
        }

        return getGuestToken()
            .then(function () {
                return postMessage(message, opts);
            })
            .then(function (chatMessageId) {
                var accumulated = "";
                var citations = [];

                return new Promise(function (resolve, reject) {
                    streamChatMessage(
                        chatMessageId,
                        function (chunk) { accumulated += chunk; },
                        function (cits) { citations = cits; },
                        function () {
                            /* 2. บันทึกลงแคชเมื่อได้คำตอบครบถ้วน */
                            cacheSet(message, accumulated);
                            resolve({ text: accumulated, citations: citations });
                        },
                        reject
                    );
                });
            });
    }

    /* ---------- feedback (like / dislike) ---------- */

    function sendFeedback(chatMessageId, isLike) {
        var payload = isLike ? { is_like: true } : { is_dislike: true };
        return fetch(CHATS_BASE + "/chat-sessions/chat-messages/" + chatMessageId + "/feedback", {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(payload)
        })
            .then(function (res) { return res.json(); })
            .catch(function () { return null; });
    }

    /* ---------- PiConsole integration ---------- */

    function createPiConsoleTransport() {
        return function (payload) {
            if (!isInitialized()) {
                return Promise.resolve("กรุณาตั้งค่า API key ก่อน: /okmd <api_key>");
            }

            return chat(payload.message)
                .then(function (result) {
                    var reply = result.text || "";
                    if (result.citations && result.citations.length) {
                        var refs = result.citations.map(function (c, i) {
                            return "[" + (i + 1) + "] " + (c.title || c.source || "");
                        }).join("\n");
                        reply += "\n\nแหล่งอ้างอิง:\n" + refs;
                    }
                    return reply;
                })
                .catch(function (err) {
                    return "เกิดข้อผิดพลาดกับ OKMD: " + err.message;
                });
        };
    }

    function attachToPiConsole() {
        if (!global.PiConsole) return false;

        var transport = createPiConsoleTransport();

        global.PiConsole.configure({
            transport: transport,
            endpoint: null
        });

        global.PiConsole.say(
            "เชื่อมต่อกับ OKMD AI แล้ว\nถามเรื่องอะไรก็ได้ — ตอบพร้อมแหล่งอ้างอิง",
            "system"
        );

        if (isInitialized()) {
            getConversationStarters().then(function (starters) {
                var quick = global.document.querySelector(".pi-quick");
                if (quick && starters.length) {
                    quick.innerHTML = "";
                    starters.forEach(function (s) {
                        var b = document.createElement("button");
                        b.type = "button";
                        b.textContent = s.title || s.prompt;
                        b.addEventListener("click", function () {
                            global.PiConsole.send(s.prompt || b.textContent);
                        });
                        quick.appendChild(b);
                    });
                }
            }).catch(function () { /* conversation starters optional */ });
        }

        return true;
    }

    /* ---------- command handler (called from pi-console.js /okmd) ---------- */

    function handleCommand(arg) {
        if (!global.PiConsole) return;

        if (!arg || arg === "off") {
            if (!arg) {
                global.PiConsole.say(status(), "system");
            } else {
                reset();
                global.PiConsole.configure({ transport: null, endpoint: null });
                global.PiConsole.say("ปิดโหมด OKMD AI แล้ว — กลับเข้าสู่โหมดสาธิต", "system");
            }
            return;
        }

        if (arg === "status") {
            global.PiConsole.say(status(), "system");
            return;
        }

        /* arg is an API key */
        global.PiConsole.say("กำลังเชื่อมต่อกับ OKMD AI…", "system");
        init(arg).then(function () {
            attachToPiConsole();
        }).catch(function (err) {
            global.PiConsole.say("เชื่อมต่อ OKMD ล้มเหลว: " + err.message, "system");
        });
    }

    /* ---------- status string ---------- */

    function status() {
        var lines = [
            "OKMD AI Bridge — สถานะ:",
            "  API key: " + (state.apiKey ? "ตั้งค่าแล้ว" : "ยังไม่มี"),
            "  Guest token: " + (state.guestToken ? "ได้รับแล้ว" : "ไม่ได้รับ"),
            "  Chat session: " + (state.chatSessionId || "(ใหม่)"),
            "  Cache Q&A: " + cacheSize() + " รายการ",
            "  Endpoint: " + CHATS_BASE,
            "  Widget: @edvisory/okmd-ai-widget@1.0.22 (npm)"
        ];
        return lines.join("\n");
    }

    /* ---------- public API ---------- */

    global.OkmdBridge = {
        init: init,
        reset: reset,
        isInitialized: isInitialized,
        getApiKey: getApiKey,
        getGuestToken: getGuestToken,
        getConversationStarters: getConversationStarters,
        postMessage: postMessage,
        streamChatMessage: streamChatMessage,
        chat: chat,
        sendFeedback: sendFeedback,
        createPiConsoleTransport: createPiConsoleTransport,
        attachToPiConsole: attachToPiConsole,
        handleCommand: handleCommand,
        status: status
    };

})(window);
