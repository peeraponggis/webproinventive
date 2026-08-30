/* =========================================================
   Pi Tasks — extra dictionary entries merged into I18N
   Loaded after i18n.js, before DOMContentLoaded.
   ========================================================= */
(function () {
    "use strict";
    if (!window.I18N) return;

    var extra = {
        th: {
            "tk.title": "Pi Tasks — PROINVENTIVE",
            "tk.board": "PROINVENTIVE HQ",
            "tk.back": "← กลับหน้าแรก",

            "tk.tab.all": "งานทั้งบริษัท",
            "tk.tab.mine": "งานของฉัน",
            "tk.tab.sprint": "งานที่กำลังดำเนินอยู่ ณ เวลานี้",
            "tk.tab.timeline": "ไทม์ไลน์",
            "tk.tab.dash": "สรุปงานวันนี้",

            "tk.new": "สร้างใหม่",
            "tk.add": "เพิ่มการ์ด",
            "tk.search": "ค้นหางาน",
            "tk.sort": "เรียงลำดับ A→Z",
            "tk.reset": "ล้างบอร์ด",
            "tk.live": "โหมดสาธิตสด",
            "tk.delete": "ลบการ์ด",
            "tk.empty": "ยังไม่มีงานในคอลัมน์นี้",
            "tk.untitled": "งานใหม่",
            "tk.mine": "ของฉัน",
            "tk.guest": "ผู้เยี่ยมชม",
            "tk.sprint": "สปรินต์",
            "tk.confirmReset": "ล้างการ์ดทั้งหมดออกจากบอร์ด?",

            "tk.c.todo": "รอทำ",
            "tk.c.doing": "กำลังทำ",
            "tk.c.review": "รอตรวจ",
            "tk.c.done": "เสร็จแล้ว",

            /* seed cards */
            "tk.s1": "อัปเดตศูนย์ช่วยเหลือและเอกสารสำนักงาน",
            "tk.s2": "ตรวจชิ้นงานแคมเปญ",
            "tk.s3": "เรื่องราวลูกค้า",
            "tk.s4": "ปรับชุดสีผลิตภัณฑ์ใหม่",
            "tk.s5": "ทบทวนแนวทางการตลาดและสปรินต์ล่าสุด",
            "tk.s6": "รีวิวโค้ดบริการยืนยันตัวตน",
            "tk.s7": "สั่งซื้ออุปกรณ์สำนักงานเพิ่ม",
            "tk.s8": "ตรวจนับครุภัณฑ์ไอที",
            "tk.s9": "ตอบคำถามผู้ทดสอบเบต้า",
            "tk.s10": "วางเป้าหมายสปรินต์ถัดไป",
            "tk.s11": "ซิงก์เดโมฝ่ายขาย",
            "tk.s12": "ปล่อยวิดีโอเดโม",
            "tk.s13": "วางแผนอัตรากำลัง",
            "tk.s14": "ประชุมทีมวิศวกรรม",
            "tk.s15": "เอกสารฟีเจอร์ใหม่",
            "tk.s16": "รายงานสถานะฝ่ายขายรายสัปดาห์",
            "tk.s17": "งานออกแบบแคมเปญการตลาด",
            "tk.s18": "อีเมลแจ้งฟีเจอร์ใหม่ถึงลูกค้า",
            "tk.s19": "ออนบอร์ดโปรเจกต์",
            "tk.s20": "สรุปไทม์ไลน์การเปิดตัว",
            "tk.s21": "ประชุมรวมทั้งบริษัท",
            "tk.s22": "ร่างข่าวประชาสัมพันธ์",
            "tk.s23": "รายงานผลการทำงานรายวัน",
            "tk.s24": "รายงานการเปิดตัวผลิตภัณฑ์รายสัปดาห์",
            "tk.s25": "คิกออฟโปรเจกต์",
            "tk.s26": "รายงานสถานะทีมการตลาด",
            "tk.s27": "วางแผนการเงิน",
            "tk.s28": "แก้ภาพ hero ที่แตก",

            /* live demo chatter */
            "tk.live.1": "วางเป้าหมายสปรินต์ถัดไป",
            "tk.live.2": "อันนี้ควรใส่เป้าหมายด้วย",
            "tk.live.3": "ขอรีวิวก่อนปิดงานนะ",
            "tk.live.4": "ย้ายไปรอตรวจแล้ว",
            "tk.live.5": "เพิ่มงานใหม่ให้แล้ว"
        },

        en: {
            "tk.title": "Pi Tasks — PROINVENTIVE",
            "tk.board": "PROINVENTIVE HQ",
            "tk.back": "← Back to home",

            "tk.tab.all": "Company tasks",
            "tk.tab.mine": "My tasks",
            "tk.tab.sprint": "In progress right now",
            "tk.tab.timeline": "Timeline",
            "tk.tab.dash": "Today's summary",

            "tk.new": "New",
            "tk.add": "New page",
            "tk.search": "Search tasks",
            "tk.sort": "Sort A→Z",
            "tk.reset": "Clear the board",
            "tk.live": "Live demo",
            "tk.delete": "Delete card",
            "tk.empty": "Nothing here yet",
            "tk.untitled": "New task",
            "tk.mine": "Mine",
            "tk.guest": "Guest",
            "tk.sprint": "Sprint",
            "tk.confirmReset": "Clear all cards from the board?",

            "tk.c.todo": "To-do",
            "tk.c.doing": "In progress",
            "tk.c.review": "In review",
            "tk.c.done": "Complete",

            /* seed cards */
            "tk.s1": "Update help center and office documentation",
            "tk.s2": "Review campaign assets",
            "tk.s3": "Customer stories",
            "tk.s4": "Refresh product color palette",
            "tk.s5": "Review latest marketing approach and sprints",
            "tk.s6": "Code review for authentication service updates",
            "tk.s7": "Office supplies reorder",
            "tk.s8": "IT inventory audit",
            "tk.s9": "Respond to beta test questions",
            "tk.s10": "Plan upcoming sprint goals",
            "tk.s11": "Sales demo sync",
            "tk.s12": "Launch demo video",
            "tk.s13": "Headcount planning",
            "tk.s14": "Engineering sync",
            "tk.s15": "New features documentation",
            "tk.s16": "Weekly sales status report",
            "tk.s17": "Marketing campaign designs",
            "tk.s18": "Latest features customer emails",
            "tk.s19": "Project onboarding",
            "tk.s20": "Finalize launch timeline",
            "tk.s21": "All hands alignment",
            "tk.s22": "Draft press release",
            "tk.s23": "Report daily performance summaries",
            "tk.s24": "Product launch weekly report",
            "tk.s25": "Project kickoff",
            "tk.s26": "Marketing team status report",
            "tk.s27": "Financial planning",
            "tk.s28": "Pixelation of hero image",

            /* live demo chatter */
            "tk.live.1": "Plan upcoming sprint goals",
            "tk.live.2": "This should include goals",
            "tk.live.3": "Needs a review before we close it",
            "tk.live.4": "Moved to In review",
            "tk.live.5": "Added a new task"
        }
    };

    Object.assign(window.I18N.dict.th, extra.th);
    Object.assign(window.I18N.dict.en, extra.en);
})();
