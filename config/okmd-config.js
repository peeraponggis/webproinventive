/* =========================================================
   OKMD AI — Configuration
   ---------------------------------------------------------
   วิธีได้รับ API key:
     1. เข้า https://ai.okmd.or.th/
     2. สมัคร/เข้าสู่ระบบ (TK Park Member)
     3. ไปที่หน้า API Keys → สร้างคีย์
     4. คัดลอกคีย์ไปใส่ที่ OKMD_API_KEY ด้านล่วงหน้า หรือตั้งใน localStorage

   วิธีใช้:
     - คำสั่งใน Pi Console:
         /okmd <api_key>   เชื่อมต่อ OKMD AI (บันทึกอัตโนมัติใน localStorage)
         /okmd status      ดูสถานะ
         /okmd off         ปิดและกลับสู่โหมดสาธิต

     - Auto-init (ถ้ามีคีย์อยู่แล้วใน localStorage):
         Bridge จะอ่าน okmd_api_key จาก localStorage และเชื่อมต่ออัตโนมัติ
         ทุกครั้งที่หน้าเว็บโหลด (ไม่หายเมื่อรีสตาร์ทหน้าหรือปิดโปรแกรม)

   Persistence:
     - API key + guest token + chat session → localStorage["okmd_state"]
     - แคช Q&A (สูงสุด 100 รายการ) → localStorage["okmd_cache"]
     - ไฟล์นี้ไม่มีคีย์ — คีย์อ่านจาก localStorage หรือ window.OKMD_API_KEY

   ⚠️ อย่า commit คีย์จริง — ใช้ .gitignore ป้องกันไฟล์คีย์
   ============================================================== */
(function (global) {
    "use strict";

    function resolveApiKey() {
        if (global.OKMD_API_KEY) return global.OKMD_API_KEY;
        try {
            return localStorage.getItem("okmd_api_key") ||
                   (global.OkmdBridge && global.OkmdBridge.getApiKey && global.OkmdBridge.getApiKey()) ||
                   null;
        } catch (e) { return null; }
    }

    var apiKey = resolveApiKey();
    if (!apiKey) return;

    /* Ensure key is in localStorage for okmd-bridge.js to pick up */
    try { localStorage.setItem("okmd_api_key", apiKey); } catch (e) {}

    /* Auto-initialize after PiConsole + bridge are loaded (defer scripts) */
    function tryAutoInit() {
        if (!global.OkmdBridge) return false;
        if (global.OkmdBridge.isInitialized()) return true;

        global.OkmdBridge.init(apiKey).then(function () {
            /* Auto-attach transport to PiConsole when it's ready */
            if (global.PiConsole) {
                global.OkmdBridge.attachToPiConsole();
            }
        }).catch(function (err) {
            console.warn("[okmd-config] init failed:", err.message);
        });
        return true;
    }

    /* Poll up to 5 seconds for OkmdBridge to appear (defer scripts) */
    var tries = 0;
    var interval = setInterval(function () {
        tries++;
        if (tryAutoInit() || tries >= 50) {
            clearInterval(interval);
        }
    }, 100);

})(window);
