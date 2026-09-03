/* =========================================================
   PROINVENTIVE — i18n (TH / EN)
   Usage in markup:
     <span data-i18n="key">ข้อความไทย</span>
     <p data-i18n-html="key">อนุญาตแท็ก HTML</p>
     <input data-i18n-attr="placeholder:key, aria-label:key2">
   API:
     I18N.get()            -> 'th' | 'en'
     I18N.set('en')        -> switch + persist + re-render
     I18N.t('key')         -> translated string
     document.addEventListener('i18n:change', e => e.detail.lang)
   ========================================================= */
(function (global) {
    "use strict";

    var STORAGE_KEY = "pi_lang";
    var DEFAULT_LANG = "th";   /* ภาษาเริ่มต้นของผู้เข้าชมครั้งแรก */

    var DICT = {
        th: {
            /* ---- meta ---- */
            "meta.title": "PROINVENTIVE — พื้นที่ทำงาน AI ที่ทำงานแทนคุณ",
            "meta.desc": "PROINVENTIVE คือพื้นที่ทำงานเดียวที่รวมเอกสาร โปรเจกต์ ฐานความรู้ และ AI เอเจนต์ไว้ด้วยกัน",
            "meta.title.product": "ผลิตภัณฑ์ — PROINVENTIVE",
            "meta.title.pricing": "ราคา — PROINVENTIVE",

            /* ---- nav ---- */
            "nav.aria": "เมนูหลัก",
            "nav.product": "ผลิตภัณฑ์",
            "nav.resources": "แหล่งข้อมูล",
            "nav.pricing": "ราคา",
            "nav.demo": "Demo",
            "nav.login": "เข้าสู่ระบบ",
            "nav.free": "เริ่มใช้ฟรี",
            "nav.toggle": "เปิดเมนู",
            "nav.lang": "เลือกภาษา",

            "dd.docs.t": "เอกสารและวิกิ",
            "dd.docs.d": "รวมความรู้ทั้งองค์กรไว้ที่เดียว",
            "dd.ai.t": "PROINVENTIVE AI",
            "dd.ai.d": "ค้นหาคำตอบพร้อมแหล่งอ้างอิง",
            "dd.agent.t": "เอเจนต์อัตโนมัติ",
            "dd.agent.d": "ให้งานเดินต่อได้ตลอด 24/7",
            "dd.project.t": "โปรเจกต์และงาน",
            "dd.project.d": "ติดตามงานทุกชิ้นในมุมมองเดียว",
            "dd.tasks.t": "Pi Tasks",
            "dd.tasks.d": "บอร์ด Kanban สำหรับทีม เปิดใช้ได้ทันที",
            "dd.stories.t": "ผลงานของเรา",
            "dd.stories.d": "โครงการติดตั้งจริงทั่วประเทศ",
            "dd.connect.t": "การเชื่อมต่อ (ปรับปรุง)",
            "dd.connect.d": "ต่อกับเครื่องมือที่ทีมใช้อยู่",
            "dd.help.t": "ศูนย์ช่วยเหลือ (ปรับปรุง)",
            "dd.help.d": "คู่มือ บทเรียน และคำถามที่พบบ่อย",

            /* ---- hero ---- */
            "hero.l1": "เราจะ",
            "hero.l2": "ไปด้วยกัน",
            "hero.sub": "รวบรวมบริบท ค้นหาคำตอบ และให้งานซ้ำ ๆ ทำงานเองอัตโนมัติ — แพลตฟอร์มดิจิทัลโดย PROINVENTIVE ผู้ให้บริการโซลูชันพลังงานสะอาดครบวงจร",
            "hero.cta1": "เริ่มใช้ PROINVENTIVE ฟรี",
            "hero.cta2": "Demo",
            "rot.1": "สร้าง",
            "rot.2": "ส่งมอบ",
            "rot.3": "เติบโต",
            "rot.4": "คิดค้น",

            /* ---- mockup ---- */
            "mk.ws": "PROINVENTIVE HQ",
            "mk.search": "ค้นหา",
            "mk.home": "🏠 หน้าแรก",
            "mk.inbox": "📥 กล่องข้อความ",
            "mk.askai": "✨ ถาม Pi",
            "mk.workspace": "พื้นที่ทำงาน PI",
            "mk.p1": "📇 Pi Tasks",
            "mk.p2": "🧾 CRM",
            "mk.p3": "⚡ BoQ",
            "mk.p4": "🛠️ ASC",
            "mk.p5": "🔒 SaaS หลังบ้านแอดมิน",
            "mk.public": "พื้นที่สาธารณะ",
            "mk.pub1": "📄 เอกสารและวิกิ",
            "mk.pub2": "✨ PROINVENTIVE AI",
            "mk.pub3": "🗂️ โปรเจกต์และงาน (กำลังพัฒนา)",
            "mk.pub4": "☀️ SaaS",
            "mk.mates": "พื้นที่เพื่อนร่วมงาน",
            "mk.mate1": "🧰 SaaS ช่างติดตั้ง",
            "mk.mate2": "🛠️ ASC",
            "mk.title": "สรุปงานวันนี้",
            "mk.owner": "ผู้ดูแล",
            "mk.ownerv": "ฝ่ายผลิตภัณฑ์",
            "mk.status": "สถานะ",
            "mk.statusv": "กำลังดำเนินการ",
            "mk.updated": "อัปเดตล่าสุด",
            "mk.updatedv": "เมื่อ 2 ชั่วโมงที่แล้ว",
            "mk.th1": "งาน",
            "mk.th2": "สถานะ",
            "mk.th3": "ผู้รับผิดชอบ",
            "mk.r1": "ออกแบบหน้าแรกใหม่",
            "mk.r2": "ระบบค้นหาด้วย AI",
            "mk.r3": "เชื่อมต่อ API ลูกค้า",
            "mk.r4": "รายงานสรุปอัตโนมัติ",
            "mk.t1": "รีวิว",
            "mk.t2": "เสร็จแล้ว",
            "mk.t3": "กำลังทำ",
            "mk.t4": "รอคิว",
            "mk.a1": "ณัฐ",
            "mk.a2": "พิม",
            "mk.a3": "ต้น",
            "mk.a4": "เอเจนต์",
            "mk.ai.name": "PROINVENTIVE AI",
            "mk.ai.msg": "สรุปความคืบหน้าสัปดาห์นี้: ปิดงานไปแล้ว 12 รายการ เหลือ 3 รายการที่ติดบล็อก",
            "mk.ai.input": "ถามอะไรก็ได้…",

            /* ---- trust ---- */
            "trust.caption": "ได้รับความไว้วางใจจากองค์กรชั้นนำทั่วประเทศ",

            /* ---- features ---- */
            "feat.head": "AI ที่อยู่ตรงที่ทีมคุณทำงาน",
            "feat.link": "ดูความสามารถทั้งหมด →",
            "feat.more": "เรียนรู้เพิ่มเติม",
            "f1.t": "รวบรวมความรู้",
            "f1.d": "นำเอกสาร ข้อมูล และบทสนทนาทั้งหมดมาไว้ในระบบเดียวที่ค้นหาได้จริง",
            "f1.c1": "📄 บันทึกการประชุม",
            "f1.c2": "🧭 คู่มือทีม",
            "f1.c3": "💡 คลังไอเดีย",
            "f2.t": "ค้นหาคำตอบ",
            "f2.d": "ถามด้วยภาษาธรรมดา แล้วได้คำตอบทันทีพร้อมแหล่งอ้างอิงที่ตรวจสอบย้อนกลับได้",
            "f2.c1": "นโยบายลาพักร้อนเป็นอย่างไร?",
            "f2.c2": "🔗 อ้างอิง: คู่มือพนักงาน",
            "f2.c3": "🔗 อ้างอิง: นโยบาย HR",
            "f3.t": "ทำงานซ้ำ ๆ อัตโนมัติ",
            "f3.d": "ให้เอเจนต์รับงานประจำไปทำต่อ ทีมจะได้โฟกัสกับงานที่สร้างผลกระทบจริง",
            "f3.c1": "⚡ ทริกเกอร์: มีทิกเก็ตใหม่",
            "f3.c2": "🤖 เอเจนต์: จัดหมวดหมู่",
            "f3.c3": "✅ ส่งต่อทีมที่เกี่ยวข้อง",

            /* ---- use cases ---- */
            "use.head": "ดูสิ่งที่ PROINVENTIVE ทำได้",
            "u1.t": "คัดกรองฟีดแบ็กผลิตภัณฑ์",
            "u1.b1": "ช่วยจัดกลุ่มฟีดแบ็กสัปดาห์นี้",
            "u1.b2": "พบ 3 ธีมหลัก: ความเร็ว การนำเข้าข้อมูล และการแจ้งเตือน",
            "u1.b3": "สร้างทิกเก็ตให้แล้ว 8 รายการ",
            "u2.t": "ปิดทิกเก็ตซัพพอร์ตในแชต",
            "u2.b1": "🎫 ทิกเก็ต #2841 — ล็อกอินไม่ได้",
            "u2.b2": "ร่างคำตอบให้หน่อย",
            "u2.b3": "ร่างเสร็จแล้ว พร้อมลิงก์คู่มือรีเซ็ตรหัสผ่าน",
            "u3.t": "ตอบสนองการแจ้งเตือนได้เร็วขึ้น",
            "u3.b1": "🔔 แจ้งเตือน: สิทธิ์เข้าถึงผิดปกติ",
            "u3.b2": "เทียบกับ Playbook แล้ว — ระดับความรุนแรง: กลาง",
            "u3.b3": "แจ้งทีมความปลอดภัย",
            "u4.t": "สรุปรายงานอัตโนมัติ",
            "u4.b1": "📊 รายงานประจำสัปดาห์ — อัตโนมัติ",
            "u4.b2": "ปิดงาน 24 · ค้าง 5 · เสี่ยงล่าช้า 2",
            "u4.b3": "ส่งเข้าช่องทีมทุกวันศุกร์ 17:00",
            "u5.t": "สร้างเครื่องมือของทีมเอง",
            "u5.b1": "สร้างเอเจนต์ตรวจรีวิวโค้ด",
            "u5.b2": "กำหนดกติกาและสิทธิ์เข้าถึงแล้ว",
            "u5.b3": "พร้อมใช้งานกับทั้งทีม",

            /* ---- testimonials ---- */
            "stories.head": "ผลงานติดตั้งและออกแบบระบบ",
            "stories.link": "ดูผลงานทั้งหมด →",
            "q1.text": "“การใช้เครื่องมือที่มี AI อยู่ในเนื้องานตั้งแต่ต้น ทำให้ทีมเล็ก ๆ ของเราส่งงานได้เท่าทีมที่ใหญ่กว่าหลายเท่า”",
            "q1.name": "ธนกฤต ศรีวิไล",
            "q1.role": "ผู้ร่วมก่อตั้งและซีอีโอ",
            "q2.text": "“ดีไซน์ที่คิดมาอย่างดีช่วยให้การทำงานร่วมกันและการตัดสินใจเร็วขึ้นมาก เราส่งมอบคุณค่าให้ลูกค้าได้ไวขึ้น”",
            "q2.name": "รวิสรา จันทโรจน์",
            "q2.role": "ผู้อำนวยการอาวุโสฝ่ายออกแบบ",
            "q3.text": "“เอเจนต์แบบกำหนดเองทำให้ทีมเราไม่ได้แค่ทำงานกับ AI แต่สร้างเครื่องมือที่ทำงานแทนพวกเขาได้เลย”",
            "q3.name": "กันตพงศ์ อารีวงศ์",
            "q3.role": "หัวหน้าฝ่ายปฏิบัติการ",

            /* ---- stats ---- */
            "st.1": "ผลงานติดตั้งรวมกว่า 3.39 MWp",
            "st.2": "งานออกแบบระบบรวมกว่า 5.35 MWp",
            "st.3": "มากกว่า 20 โครงการทั่วประเทศ",
            "st.4": "เชี่ยวชาญ C&I · ESS · Peak Shaving",
            "st.5": "ดำเนินธุรกิจตามหลัก ESG",

            /* ---- cta ---- */
            "cta.head": "เริ่มต้นวันนี้เลย",

            /* ---- footer ---- */
            "f.product": "ผลิตภัณฑ์",
            "f.features": "ฟีเจอร์",
            "f.whatsnew": "มีอะไรใหม่",
            "f.ai": "PROINVENTIVE AI",
            "f.download": "ดาวน์โหลด",
            "f.resources": "แหล่งข้อมูล",
            "f.stories": "ผลงานของเรา",
            "f.connect": "การเชื่อมต่อ",
            "f.market": "มาร์เก็ตเพลส",
            "f.help": "ศูนย์ช่วยเหลือ",
            "f.academy": "Academy",
            "f.community": "คอมมูนิตี้",
            "f.company": "บริษัท",
            "f.about": "เกี่ยวกับเรา",
            "f.careers": "ร่วมงานกับเรา",
            "f.security": "ความปลอดภัย",
            "f.status": "สถานะระบบ",
            "f.terms": "ข้อกำหนดและความเป็นส่วนตัว",
            "f.for": "PROINVENTIVE สำหรับ",
            "f.enterprise": "องค์กรขนาดใหญ่",
            "f.smb": "ธุรกิจขนาดเล็ก",
            "f.startup": "สตาร์ทอัพ",
            "f.dev": "นักพัฒนา",
            "f.more": "ดูเพิ่มเติม →",
            "f.copyright": "© 2026 บริษัท โปรอินเวนทีฟ จำกัด (PROINVENTIVE CO., LTD.)",
            "f.cookie": "ตั้งค่าคุกกี้",
            "f.privacy": "สิทธิความเป็นส่วนตัวของคุณ",

            /* ---- product page ---- */
            "pp.head": "ทุกสิ่งที่คุณต้องการเพื่อทำงานให้สำเร็จ..อยู่ที่นี่",
            "pp.sub": "เครื่องมือที่ยืดหยุ่น ปรับแต่งได้ตามใจคุณ",
            "pp.c1.t": "การออกแบบติดตั้งระบบโซล่าร์เซลล์",
            "pp.c1.d": "ออกแบบระบบ เลือกโซลูชั่น นำเสนอระบบ จบด้วยราคาที่ยุติธรรม รับประกันระบบอย่างมืออาชีพ",
            "pp.c2.t": "U-Projects",
            "pp.c2.d": "CRM/BOQ/Project Management/i-Tasks ครบทุกกระบวนงานในองค์กรของคุณ",
            "pp.c3.t": "Wikis",
            "pp.c3.d": "รวบรวมองค์ความรู้ของบริษัทไว้ในที่เดียว ค้นหาง่าย และอัปเดตได้ตลอดเวลา",

            /* ---- pricing page ---- */
            "pr.head": "แผนการใช้งานที่เหมาะกับคุณ",
            "pr.sub": "เริ่มต้นฟรี และอัปเกรดเมื่อทีมของคุณเติบโต",
            "pr.per": "/ ผู้ใช้ / เดือน",
            "pr.free.t": "Free",
            "pr.free.d": "เหมาะสำหรับบุคคลทั่วไปที่ต้องการจัดการชีวิตประจำวัน",
            "pr.free.b": "เริ่มต้นใช้งาน",
            "pr.plus.t": "Plus",
            "pr.plus.d": "สำหรับกลุ่มคนทำงานขนาดเล็กที่ต้องการเครื่องมือร่วมกัน",
            "pr.plus.b": "อัปเกรด",
            "pr.biz.t": "Business",
            "pr.biz.d": "สำหรับบริษัทที่ต้องการเชื่อมต่อการทำงานทั้งองค์กร",
            "pr.biz.b": "ติดต่อฝ่ายขาย",

            /* ---- auth + internal menu ---- */
            "nav.internal": "ระบบภายใน",
            "auth.title": "เข้าสู่ระบบ",
            "auth.hint": "ใช้อีเมลบริษัท @proinventive.co.th เพื่อเข้าถึงระบบภายใน (โหมดสาธิต)",
            "auth.placeholder": "you@proinventive.co.th",
            "auth.submit": "เข้าสู่ระบบ",
            "auth.invalid": "อีเมลไม่ถูกต้อง หรือไม่ใช่โดเมน @proinventive.co.th",
            "auth.logout": "ออกจากระบบ",
            "auth.loggedin": "เข้าสู่ระบบแล้ว",
            "in.crm.d": "ระบบบริหารลูกค้าสัมพันธ์",
            "in.boq.d": "ระบบถอดแบบประมาณราคา",
            "in.asc.d": "ระบบออกแบบ PVs",
            "in.admin.t": "SaaS หลังบ้านแอดมิน",
            "in.admin.d": "ตรวจ lead / ตรวจสลิป",
            "in.demo.d": "ชมคลิปการทำงานของทุกระบบ",
            "saas.installer.t": "SaaS ช่างติดตั้ง",
            "saas.installer.d": "พื้นที่ทำงานสำหรับทีมติดตั้งหน้างาน",
            "saas.main.d": "แพลตฟอร์ม SaaS สำหรับลูกค้า",

            /* ---- about (company profile) ---- */
            "about.head": "เกี่ยวกับเรา",
            "about.tag": "Innovative Clean Energy Solution Provider",
            "about.lead": "เราสร้างอนาคตพลังงานสะอาด ด้วยเทคโนโลยีล้ำหน้าและความยั่งยืนที่จับต้องได้ — โซลูชันครบวงจรตั้งแต่การออกแบบ ติดตั้ง ตรวจสอบระบบ ไปจนถึงการบำรุงรักษาเชิงป้องกัน",
            "a1.t": "Smart Energy Management",
            "a1.d": "ผสานเทคโนโลยี IoT, AI และ Big Data เข้ากับระบบพลังงาน เพื่อการบริหารจัดการที่ฉลาดขึ้น และวิเคราะห์ประสิทธิภาพแบบเรียลไทม์",
            "a2.t": "C&I · ESS · Peak Shaving",
            "a2.d": "เชี่ยวชาญการออกแบบระบบเชิงพาณิชย์และอุตสาหกรรม ระบบจัดเก็บพลังงาน และการลดค่าความต้องการไฟฟ้าสูงสุด เพื่อพลังงานที่ต่อเนื่องและมีเสถียรภาพ",
            "a3.t": "ESG และการพัฒนาบุคลากร",
            "a3.d": "ดำเนินธุรกิจตามหลัก ESG อย่างรอบด้าน พร้อมฝึกอบรมและพัฒนาศักยภาพบุคลากรทุกระดับ สู่ยุคพลังงานสะอาดที่เปลี่ยนแปลงอย่างรวดเร็ว",

            /* ---- real projects ---- */
            "proj.install": "ติดตั้งแล้ว",
            "proj.design": "งานออกแบบ",
            "pj1.t": "Big C กำแพงเพชร",
            "pj1.d": "Solar Rooftop AC System กำลังการติดตั้งสูงสุดในพอร์ตของเรา",
            "pj2.t": "Big C Market สีคิ้ว",
            "pj2.d": "Solar Rooftop On-grid จังหวัดนครราชสีมา",
            "pj3.t": "โรงเรียนอนุบาลบ้านหนือ อุบลราชธานี",
            "pj3.d": "Solar Rooftop AC System พร้อมระบบกักเก็บพลังงาน BESS",
            "pl.head": "ผลงานออกแบบและติดตั้ง",
            "pl.sub": "โครงการจริงของเรา — ติดตั้งแล้ว 8 โครงการ และงานออกแบบระบบอีก 12 โครงการทั่วประเทศ",

            /* ---- project dashboard ---- */
            "pd.eyebrow": "Project Dashboard",
            "pd.map.t": "แผนที่โครงการทั่วประเทศ",
            "pd.live.t": "กำลังผลิตโดยประมาณ ขณะนี้",
            "pd.live.d": "โมเดลจำลองจากกำลังติดตั้งรวมทุกโครงการ",
            "pd.t1": "กำลังติดตั้งรวม",
            "pd.t2": "งานออกแบบระบบรวม",
            "pd.t3": "ผลงานทั้งหมด",
            "pd.t4": "พื้นที่ให้บริการ",
            "pd.unit.proj": "โครงการ",
            "pd.unit.prov": "จังหวัด",
            "pd.g1": "โครงการติดตั้งแล้ว",
            "pd.g2": "โครงการออกแบบระบบ",
            "pd.curve.t": "โปรไฟล์การผลิตรายวัน (จำลอง)",
            "pd.top.t": "โครงการกำลังการผลิตสูงสุด (kWp)",

            /* ---- footer contact ---- */
            "f.contact": "ติดต่อเรา",
            "f.addr": "59/6 หมู่ 7 ต.ไทรน้อย อ.ไทรน้อย จ.นนทบุรี 11150",

            /* ---- dashboard ---- */
            "col.todo": "รอทำ",
            "col.doing": "กำลังทำ",
            "col.review": "รอตรวจ",
            "col.done": "เสร็จแล้ว",
            "dash.company": "ภาพรวมบริษัท",
            "dash.byuser": "สรุปราย user",
            "dash.total": "งานทั้งหมด",
            "dash.doneToday": "เสร็จวันนี้",
            "dash.lastActive": "กิจกรรมล่าสุด",
            "dash.user": "ผู้ใช้",
            "dash.empty": "ยังไม่มีงานในบอร์ด — เริ่มสร้างการ์ดแรกได้เลย",

            /* ---- demo page ---- */
            "demo.title": "Demo — PROINVENTIVE",
            "demo.desc": "ชมการทำงานจริงของระบบ PROINVENTIVE — U-Projects (Pi Tasks / BoQ / CRM), ASC และ SaaS",
            "demo.saas.t": "☀️ SaaS — ประเมินระบบโซล่าร์ด้วยตัวเอง",
            "demo.head": "ชมการทำงานจริงของระบบ",
            "demo.sub": "คลิปสั้น ๆ จากหน้าจอจริงของแต่ละระบบ — กดเล่นได้เลย",
            "demo.up.head": "ครบทุกกระบวนงานในองค์กรของคุณ",
            "demo.up.sub": "CRM / BOQ / Project Management / i-Tasks — ชุดเครื่องมือภายในที่ทีม PROINVENTIVE ใช้ทำงานจริงทุกวัน",
            "demo.pt.d": "บอร์ด Kanban ของทีม — ลากการ์ดข้ามสถานะ ติดตามเจ้าของงานพร้อม timestamp และดูสรุปงานวันนี้เป็น dashboard",
            "demo.boq.d": "ออกใบเสนอราคาและ BOQ — กำหนดงวดชำระเงิน เงื่อนไขเอกสาร แล้วพิมพ์เป็น PDF ได้ในไม่กี่คลิก",
            "demo.crm.d": "ระบบบริหารลูกค้าสัมพันธ์เชื่อมกับฐานข้อมูลวัสดุกว่า 500 รายการ — จาก Lead ถึงใบเสนอราคาในระบบเดียว พร้อม Pipeline และ Siteflow",
            "demo.asc.head": "ระบบออกแบบ PVs",
            "demo.asc.d": "ครบ 6 ขั้นตอนออกแบบระบบโซล่าร์: วิเคราะห์ค่าไฟ Load Profiling → System Design → โมเดล 3 มิติ → ตำแหน่งอุปกรณ์ → ข้อเสนอและรายงาน → สรุประบบ",
            "demo.saas.head": "แพลตฟอร์มสำหรับลูกค้า",
            "demo.saas.try": "ลองใช้งานจริง →",
            "demo.saas.d": "ลูกค้ากรอกข้อมูลการใช้ไฟ แล้วได้ผลวิเคราะห์ทันที — กำลังผลิตรายชั่วโมง การทำงานของแบตเตอรี่ ผลผลิตรายเดือน Cash Flow, NPV, LCOE พร้อมรายงานฉบับเต็มพิมพ์เป็น PDF ได้",

            /* ---- start menu ---- */
            "start.docs.t": "เอกสารรวมความรู้องค์กร",
            "start.wip": "(กำลังพัฒนา)",

            /* ---- knowledge base ---- */
            "kb.page": "หน้า",
            "kb.table": "ตาราง",
            "kb.internal": "(ข้อมูลภายใน)",
            "kb.locked": "ค่าตัวเลขเรื่องนี้อยู่ใน {table} ของมาตรฐาน วสท. ซึ่งเป็นข้อมูลลิขสิทธิ์ — ดูจากเล่มมาตรฐาน หรือเข้าสู่ระบบด้วยบัญชี @proinventive.co.th บนระบบภายในเพื่อให้ Pi ค้นค่าให้",
            "kb.staffOnly": "คำสั่งนี้สำหรับพนักงาน — เข้าสู่ระบบด้วยบัญชี @proinventive.co.th ก่อน",
            "kb.teachUsage": "รูปแบบ: /teach คำถาม | คำตอบ | EIT-2568 4.3.5 (อ้างอิงใส่หรือไม่ก็ได้) · /teach list · /teach del N",
            "kb.teachEmpty": "ยังไม่มีคำตอบที่สอนไว้ในเบราว์เซอร์นี้",
            "kb.taught": "จำไว้แล้ว ✓ ใช้ได้ทันทีในเบราว์เซอร์นี้ — ใช้ /export เพื่อส่งให้ทีมนำเข้า knowledge.json",
            "kb.taughtRemoved": "ลบแล้ว",
            "kb.noQuestions": "ยังไม่มีคำถามถูกบันทึกในเบราว์เซอร์นี้",
            "kb.questionsHead": "คำถามที่บันทึกไว้ {total} ครั้ง — เรียงตามที่ตอบไม่ได้/ถามบ่อย (⚠️ = จำนวนครั้งที่ตอบไม่ได้):",
            "kb.exported": "ส่งออก {n} รายการ (คัดลอกลงคลิปบอร์ดแล้ว) — วางเป็น tools/faq_extra.json แล้วรัน build_knowledge.py",
            "kb.disclaimerPub": "ข้อมูลอ้างอิงเบื้องต้น โปรดตรวจสอบกับประกาศ/เอกสารฉบับล่าสุดของหน่วยงานหรือผู้ผลิต",
            "kb.lockedStaff": "ค่าตัวเลขเรื่องนี้อยู่ใน {table} ของมาตรฐาน วสท. — โฮสต์นี้ไม่ได้ติดตั้งไฟล์ตารางภายใน (tables-private.json) จึงค้นค่าให้ไม่ได้ กรุณาใช้ระบบภายในที่ติดตั้งไฟล์นี้ หรือเปิดจากเล่มมาตรฐาน",
            "kb.lockedToken": "ค่าตัวเลขเรื่องนี้อยู่ใน {table} ของมาตรฐาน วสท. — ให้ Pi ค้นค่าได้โดยใส่รหัสตารางภายในครั้งเดียว: /tables <รหัส> (ขอรหัสจากผู้ดูแลระบบ)",
            "kb.tablesOk": "เชื่อมตารางภายในแล้ว ✓ ({n} ตาราง) — ถามค่าจากตาราง วสท. ได้เลย",
            "kb.tablesFail": "รหัสไม่ถูกต้อง หรือเซิร์ฟเวอร์ตารางภายในไม่ตอบ — ตรวจรหัสแล้วลอง /tables <รหัส> อีกครั้ง",
            "kb.tablesNone": "ยังไม่ได้เชื่อมตารางภายใน — ใส่รหัสด้วย /tables <รหัส> (/tables clear เพื่อลบ)",
            "kb.tablesCleared": "ลบรหัสตารางภายในออกจากเบราว์เซอร์นี้แล้ว",
            "kb.tablesHint": "ปลายทาง: {url}",
            "kb.ref": "อ้างอิง",
            "kb.clause": "ข้อ",
            "kb.disclaimer": "สรุปย่อเพื่ออ้างอิงเบื้องต้น โปรดตรวจสอบกับเล่มมาตรฐานฉบับจริงของ วสท.",
            "kb.pointer": "เรื่องนี้อยู่ในหัวข้อต่อไปนี้ของมาตรฐาน:",

            /* ---- Pi console ---- */
            "pi.launch": "เปิดคอนโซลคุยกับ Pi",
            "pi.title": "Console · Chat with Pi",
            "pi.subtitle": "ผู้ช่วยพื้นที่ทำงาน",
            "pi.status.local": "โหมดสาธิต (ยังไม่เชื่อมต่อ)",
            "pi.status.online": "พร้อมตอบ — ฐานความรู้มาตรฐาน EIT (client-side)",
            "pi.status.error": "เชื่อมต่อไม่สำเร็จ",
            "pi.min": "ย่อหน้าต่าง",
            "pi.close": "ปิด",
            "pi.clear": "ล้างบทสนทนา",
            "pi.placeholder": "พิมพ์ข้อความ หรือ /help เพื่อดูคำสั่ง…",
            "pi.send": "ส่ง",
            "pi.you": "คุณ",
            "pi.pi": "Pi",
            "pi.system": "ระบบ",
            "pi.thinking": "Pi กำลังพิมพ์…",
            "pi.greeting": "สวัสดีครับ ผมคือ Pi ผู้ช่วยของ PROINVENTIVE — ถามเรื่องมาตรฐานการติดตั้งไฟฟ้า/โซล่าร์/BESS ได้เลย ผมตอบพร้อมอ้างอิงเลขข้อของ วสท. (เรื่องราคาผมจะส่งต่อฝ่ายขาย) พิมพ์ /help เพื่อดูคำสั่ง",
            "pi.q1": "แรงดันสตริงสูงสุดกำหนดที่ข้อไหน?",
            "pi.q2": "ขนาดสายดินบริภัณฑ์ดูตารางไหน?",
            "pi.q3": "ราคาติดตั้งเท่าไหร่?",
            "pi.help": "ถามเรื่องมาตรฐาน วสท. ได้เลย เช่น สายดิน SPD rapid shutdown BESS\n\nคำสั่งที่ใช้ได้:\n/help — แสดงคำสั่งทั้งหมด\n/status — ดูสถานะการเชื่อมต่อ\n/connect <endpoint> — ตั้งค่าปลายทาง API (เฟสถัดไป)\n/crm — ดูแผนการเชื่อมต่อ CRM/SaaS\n/lang th|en — สลับภาษา\n/clear — ล้างบทสนทนา\n\nสำหรับพนักงาน (เข้าสู่ระบบ):\n/questions — คำถามที่ถูกถามบ่อย/ตอบไม่ได้\n/teach คำถาม | คำตอบ | EIT-2568 4.3.5 — สอนคำตอบ (/teach list, /teach del N)\n/export — ส่งออก FAQ ที่สอนเป็น JSON\n/tables <รหัส> — เชื่อมตาราง วสท. จากเซิร์ฟเวอร์ภายใน (/tables ดูสถานะ, /tables clear)",
            "pi.crm": "แผนการเชื่อมต่อ CRM/SaaS (เฟสถัดไป):\n1) Auth — ผูกบัญชีผู้ใช้ผ่าน OAuth/API key\n2) Data — ซิงก์ลูกค้า ดีล และทิกเก็ตแบบสองทาง\n3) Actions — ให้ Pi สร้าง/อัปเดตเรกคอร์ดได้จากบทสนทนา\n4) Automation — ทริกเกอร์เวิร์กโฟลว์ตามเหตุการณ์\nโค้ดฝั่งหน้าเว็บเตรียม adapter ไว้แล้วที่ PiConsole.configure()",
            "pi.status.msg": "สถานะปัจจุบัน: {status}\nปลายทาง: {endpoint}\nภาษา: {lang}",
            "pi.notset": "ยังไม่ได้ตั้งค่า",
            "pi.connected": "ตั้งค่าปลายทางเป็น {endpoint} แล้ว — จะเริ่มใช้งานจริงเมื่อ backend พร้อม",
            "pi.cleared": "ล้างบทสนทนาแล้ว",
            "pi.unknown": "ยังไม่รู้จักคำสั่งนี้ ลองพิมพ์ /help ดูครับ",
            "pi.fallback": "ผมตอบได้เรื่องมาตรฐานการติดตั้งไฟฟ้า/โซล่าร์/BESS ของ วสท. และข้อมูลบริษัทครับ ลองถามเช่น สายดิน, SPD, rapid shutdown, แรงดันสตริง หรือพิมพ์ /help",
            "pi.a.features": "PROINVENTIVE รวมเอกสาร วิกิ โปรเจกต์ และเอเจนต์ AI ไว้ในที่เดียว จุดเด่นคือค้นหาคำตอบพร้อมแหล่งอ้างอิง และให้เอเจนต์ทำงานซ้ำ ๆ แทนทีมได้ตลอด 24/7",
            "pi.a.pricing": "เรื่องราคาขึ้นกับขนาดระบบและขอบเขตงานครับ ฝากอีเมลไว้ในแชตนี้ หรือติดต่อ 080-028-2399 / info@proinventive.co.th เพื่อรับใบเสนอราคาได้เลย",
            "pi.a.crm": "การเชื่อมต่อ CRM/SaaS จะทำในเฟสถัดไป โดยใช้ adapter ที่เตรียมไว้แล้ว พิมพ์ /crm เพื่อดูแผนการเชื่อมต่อแบบละเอียด",
            "pi.a.contact": "ทีมขายติดต่อได้ผ่านปุ่ม “ขอชมเดโม” ด้านบน หรือฝากอีเมลไว้ในแชตนี้ก็ได้ครับ"
        },

        en: {
            /* ---- meta ---- */
            "meta.title": "PROINVENTIVE — The AI workspace that works for you",
            "meta.desc": "PROINVENTIVE is the single workspace that brings docs, projects, knowledge and AI agents together.",
            "meta.title.product": "Product — PROINVENTIVE",
            "meta.title.pricing": "Pricing — PROINVENTIVE",

            /* ---- nav ---- */
            "nav.aria": "Main menu",
            "nav.product": "Product",
            "nav.resources": "Resources",
            "nav.pricing": "Pricing",
            "nav.demo": "Demo",
            "nav.login": "Log in",
            "nav.free": "Get started free",
            "nav.toggle": "Open menu",
            "nav.lang": "Select language",

            "dd.docs.t": "Docs & wikis",
            "dd.docs.d": "One home for everything your team knows",
            "dd.ai.t": "PROINVENTIVE AI",
            "dd.ai.d": "Answers with citations, instantly",
            "dd.agent.t": "Automation agents",
            "dd.agent.d": "Keep work moving 24/7",
            "dd.project.t": "Projects & tasks",
            "dd.project.d": "Track every piece of work in one view",
            "dd.tasks.t": "Pi Tasks",
            "dd.tasks.d": "A team Kanban board, ready to use",
            "dd.stories.t": "Our projects",
            "dd.stories.d": "Real installations nationwide",
            "dd.connect.t": "Connections (under improvement)",
            "dd.connect.d": "Plug into the tools you already use",
            "dd.help.t": "Help center (under improvement)",
            "dd.help.d": "Guides, tutorials and FAQs",

            /* ---- hero ---- */
            "hero.l1": "We will",
            "hero.l2": "together.",
            "hero.sub": "Capture context, find answers, and automate busywork — the digital platform by PROINVENTIVE, your end-to-end clean energy solution provider.",
            "hero.cta1": "Get PROINVENTIVE free",
            "hero.cta2": "Demo",
            "rot.1": "create",
            "rot.2": "ship",
            "rot.3": "grow",
            "rot.4": "invent",

            /* ---- mockup ---- */
            "mk.ws": "PROINVENTIVE HQ",
            "mk.search": "Search",
            "mk.home": "🏠 Home",
            "mk.inbox": "📥 Inbox",
            "mk.askai": "✨ Ask Pi",
            "mk.workspace": "PI workspace",
            "mk.p1": "📇 Pi Tasks",
            "mk.p2": "🧾 CRM",
            "mk.p3": "⚡ BoQ",
            "mk.p4": "🛠️ ASC",
            "mk.p5": "🔒 SaaS admin console",
            "mk.public": "Public space",
            "mk.pub1": "📄 Docs & wikis",
            "mk.pub2": "✨ PROINVENTIVE AI",
            "mk.pub3": "🗂️ Projects & tasks (in development)",
            "mk.pub4": "☀️ SaaS",
            "mk.mates": "Colleague space",
            "mk.mate1": "🧰 SaaS for installers",
            "mk.mate2": "🛠️ ASC",
            "mk.title": "Today's summary",
            "mk.owner": "Owner",
            "mk.ownerv": "Product team",
            "mk.status": "Status",
            "mk.statusv": "In progress",
            "mk.updated": "Last updated",
            "mk.updatedv": "2 hours ago",
            "mk.th1": "Task",
            "mk.th2": "Status",
            "mk.th3": "Assignee",
            "mk.r1": "Redesign the homepage",
            "mk.r2": "AI-powered search",
            "mk.r3": "Customer API integration",
            "mk.r4": "Automated weekly report",
            "mk.t1": "In review",
            "mk.t2": "Done",
            "mk.t3": "In progress",
            "mk.t4": "Queued",
            "mk.a1": "Nat",
            "mk.a2": "Pim",
            "mk.a3": "Ton",
            "mk.a4": "Agent",
            "mk.ai.name": "PROINVENTIVE AI",
            "mk.ai.msg": "This week: 12 tasks closed, 3 still blocked.",
            "mk.ai.input": "Ask anything…",

            /* ---- trust ---- */
            "trust.caption": "Trusted by leading organizations nationwide",

            /* ---- features ---- */
            "feat.head": "AI where your team works.",
            "feat.link": "See all capabilities →",
            "feat.more": "Learn more",
            "f1.t": "Capture knowledge",
            "f1.d": "Bring every doc, record and conversation into one system you can actually search.",
            "f1.c1": "📄 Meeting notes",
            "f1.c2": "🧭 Team handbook",
            "f1.c3": "💡 Idea vault",
            "f2.t": "Find answers",
            "f2.d": "Ask in plain language and get an instant answer with sources you can verify.",
            "f2.c1": "What's our PTO policy?",
            "f2.c2": "🔗 Source: Employee handbook",
            "f2.c3": "🔗 Source: HR policy",
            "f3.t": "Automate busywork",
            "f3.d": "Hand routine work to agents so your team can focus on what actually moves the needle.",
            "f3.c1": "⚡ Trigger: new ticket",
            "f3.c2": "🤖 Agent: categorize",
            "f3.c3": "✅ Route to the right team",

            /* ---- use cases ---- */
            "use.head": "See what PROINVENTIVE can do",
            "u1.t": "Triage product feedback",
            "u1.b1": "Group this week's feedback for me",
            "u1.b2": "Found 3 themes: speed, data import, notifications",
            "u1.b3": "Created 8 tickets",
            "u2.t": "Resolve support tickets in chat",
            "u2.b1": "🎫 Ticket #2841 — can't log in",
            "u2.b2": "Draft a reply",
            "u2.b3": "Draft ready, with a password-reset guide link",
            "u3.t": "Respond to alerts faster",
            "u3.b1": "🔔 Alert: unusual access permission",
            "u3.b2": "Checked against the playbook — severity: medium",
            "u3.b3": "Notify the security team",
            "u4.t": "Automate weekly reporting",
            "u4.b1": "📊 Weekly report — automated",
            "u4.b2": "24 closed · 5 open · 2 at risk",
            "u4.b3": "Posted to the team channel every Friday 5pm",
            "u5.t": "Build your own team tools",
            "u5.b1": "Create a code-review agent",
            "u5.b2": "Rules and access scopes configured",
            "u5.b3": "Ready for the whole team",

            /* ---- testimonials ---- */
            "stories.head": "Installations & system design",
            "stories.link": "See all projects →",
            "q1.text": "“Working with AI-native tools from day one lets our small team ship like a company many times our size.”",
            "q1.name": "Thanakrit Sriwilai",
            "q1.role": "Co-founder & CEO",
            "q2.text": "“Thoughtful design speeds up collaboration and decisions, so we deliver value to customers faster.”",
            "q2.name": "Rawisara Chantaroj",
            "q2.role": "Sr. Director of Product Design",
            "q3.text": "“Custom agents let our team go beyond working with AI to building tools that do the work for them.”",
            "q3.name": "Kantapong Areewong",
            "q3.role": "Head of Operations",

            /* ---- stats ---- */
            "st.1": "Over 3.39 MWp installed",
            "st.2": "Over 5.35 MWp of system design work",
            "st.3": "20+ projects nationwide",
            "st.4": "C&I · ESS · Peak Shaving expertise",
            "st.5": "Committed to ESG principles",

            /* ---- cta ---- */
            "cta.head": "Get started today.",

            /* ---- footer ---- */
            "f.product": "Product",
            "f.features": "Features",
            "f.whatsnew": "What's new",
            "f.ai": "PROINVENTIVE AI",
            "f.download": "Download",
            "f.resources": "Resources",
            "f.stories": "Our projects",
            "f.connect": "Connections",
            "f.market": "Marketplace",
            "f.help": "Help center",
            "f.academy": "Academy",
            "f.community": "Community",
            "f.company": "Company",
            "f.about": "About us",
            "f.careers": "Careers",
            "f.security": "Security",
            "f.status": "Status",
            "f.terms": "Terms & privacy",
            "f.for": "PROINVENTIVE for",
            "f.enterprise": "Enterprise",
            "f.smb": "Small businesses",
            "f.startup": "Startups",
            "f.dev": "Developers",
            "f.more": "Explore more →",
            "f.copyright": "© 2026 PROINVENTIVE CO., LTD.",
            "f.cookie": "Cookie settings",
            "f.privacy": "Your privacy rights",

            /* ---- product page ---- */
            "pp.head": "Everything you need to get work done… right here",
            "pp.sub": "A flexible toolkit you can shape around your team",
            "pp.c1.t": "Solar system design & installation",
            "pp.c1.d": "System design, solution selection and professional proposals — finished with fair pricing and a professional system warranty.",
            "pp.c2.t": "U-Projects",
            "pp.c2.d": "CRM / BOQ / Project Management / i-Tasks — every workflow in your organization.",
            "pp.c3.t": "Wikis",
            "pp.c3.d": "Keep company knowledge in one searchable, always-current place.",

            /* ---- pricing page ---- */
            "pr.head": "A plan that fits your team",
            "pr.sub": "Start free and upgrade as your team grows",
            "pr.per": "/ user / month",
            "pr.free.t": "Free",
            "pr.free.d": "For individuals organizing everyday work and life.",
            "pr.free.b": "Get started",
            "pr.plus.t": "Plus",
            "pr.plus.d": "For small teams that need a shared workspace.",
            "pr.plus.b": "Upgrade",
            "pr.biz.t": "Business",
            "pr.biz.d": "For companies connecting work across the org.",
            "pr.biz.b": "Contact sales",

            /* ---- auth + internal menu ---- */
            "nav.internal": "Internal systems",
            "auth.title": "Log in",
            "auth.hint": "Use your @proinventive.co.th company email to access internal systems (demo mode)",
            "auth.placeholder": "you@proinventive.co.th",
            "auth.submit": "Log in",
            "auth.invalid": "Invalid email, or not a @proinventive.co.th address",
            "auth.logout": "Log out",
            "auth.loggedin": "Signed in",
            "in.crm.d": "Customer relationship management",
            "in.boq.d": "Bill of quantities & estimating",
            "in.asc.d": "PV design system",
            "in.admin.t": "SaaS admin console",
            "in.admin.d": "Review leads & payment slips",
            "in.demo.d": "Watch every system in action",
            "saas.installer.t": "SaaS for installers",
            "saas.installer.d": "Workspace for on-site installation teams",
            "saas.main.d": "The customer-facing SaaS platform",

            /* ---- about (company profile) ---- */
            "about.head": "About us",
            "about.tag": "Innovative Clean Energy Solution Provider",
            "about.lead": "We build the future of clean energy with cutting-edge technology and tangible sustainability — end-to-end solutions from design and installation to inspection and preventive maintenance.",
            "a1.t": "Smart Energy Management",
            "a1.d": "IoT, AI and Big Data woven into the energy system for smarter management and real-time performance analysis.",
            "a2.t": "C&I · ESS · Peak Shaving",
            "a2.d": "Specialists in Commercial & Industrial system design, Energy Storage Systems, and peak shaving to reduce demand charges — for stable, continuous power.",
            "a3.t": "ESG & people development",
            "a3.d": "We operate on ESG principles and invest in training and capacity building at every level, preparing people for a fast-moving clean energy era.",

            /* ---- real projects ---- */
            "proj.install": "Installed",
            "proj.design": "Design",
            "pj1.t": "Big C Kamphaeng Phet",
            "pj1.d": "Solar Rooftop AC System — the largest installation in our portfolio",
            "pj2.t": "Big C Market Sikhio",
            "pj2.d": "Solar Rooftop On-grid, Nakhon Ratchasima",
            "pj3.t": "Ban Nuea Kindergarten, Ubon Ratchathani",
            "pj3.d": "Solar Rooftop AC System with BESS energy storage",
            "pl.head": "Design & installation portfolio",
            "pl.sub": "Our real track record — 8 completed installations and 12 system design projects nationwide.",

            /* ---- project dashboard ---- */
            "pd.eyebrow": "Project Dashboard",
            "pd.map.t": "Projects across Thailand",
            "pd.live.t": "Estimated output right now",
            "pd.live.d": "Simulated from the combined installed capacity",
            "pd.t1": "Total installed",
            "pd.t2": "Total system design",
            "pd.t3": "All projects",
            "pd.t4": "Service area",
            "pd.unit.proj": "projects",
            "pd.unit.prov": "provinces",
            "pd.g1": "Installed projects",
            "pd.g2": "System design projects",
            "pd.curve.t": "Daily production profile (simulated)",
            "pd.top.t": "Largest projects (kWp)",

            /* ---- footer contact ---- */
            "f.contact": "Contact",
            "f.addr": "59/6 Moo 7, Sai Noi, Nonthaburi 11150, Thailand",

            /* ---- dashboard ---- */
            "col.todo": "To-do",
            "col.doing": "In progress",
            "col.review": "In review",
            "col.done": "Done",
            "dash.company": "Company overview",
            "dash.byuser": "By user",
            "dash.total": "Total tasks",
            "dash.doneToday": "Done today",
            "dash.lastActive": "Last activity",
            "dash.user": "User",
            "dash.empty": "No tasks yet — create your first card",

            /* ---- demo page ---- */
            "demo.title": "Demo — PROINVENTIVE",
            "demo.desc": "See the PROINVENTIVE systems in action — U-Projects (Pi Tasks / BoQ / CRM), ASC and SaaS",
            "demo.saas.t": "☀️ SaaS — size your own solar system",
            "demo.head": "See the systems in action",
            "demo.sub": "Short clips captured from the real screens — press play",
            "demo.up.head": "Every workflow in your organization",
            "demo.up.sub": "CRM / BOQ / Project Management / i-Tasks — the internal toolkit the PROINVENTIVE team runs on every day",
            "demo.pt.d": "The team Kanban board — drag cards between statuses, track owners with timestamps, and read the day's summary as a dashboard",
            "demo.boq.d": "Quotations and BOQ — set payment terms and document options, then print a PDF in a few clicks",
            "demo.crm.d": "CRM wired to a 500+ item materials database — from lead to quotation in one system, with Pipeline and Siteflow",
            "demo.asc.head": "PV design system",
            "demo.asc.d": "All six steps of solar design: load profiling → system design → 3D model → device location → proposal & report → system summary",
            "demo.saas.head": "The customer-facing platform",
            "demo.saas.try": "Try it live →",
            "demo.saas.d": "Customers enter their electricity usage and get instant analysis — hourly output, battery behaviour, monthly yields, cash flow, NPV and LCOE, with a full printable PDF report",

            /* ---- start menu ---- */
            "start.docs.t": "Company knowledge docs",
            "start.wip": "(in development)",

            /* ---- knowledge base ---- */
            "kb.page": "p.",
            "kb.table": "table",
            "kb.internal": "(internal data)",
            "kb.locked": "The numeric values for this live in {table} of the EIT standard, which is copyrighted — check the printed volume, or sign in with a @proinventive.co.th account on the internal system and Pi will look it up",
            "kb.staffOnly": "Staff command — sign in with a @proinventive.co.th account first",
            "kb.teachUsage": "Usage: /teach question | answer | EIT-2568 4.3.5 (reference optional) · /teach list · /teach del N",
            "kb.teachEmpty": "No taught answers in this browser yet",
            "kb.taught": "Remembered ✓ — active in this browser now; use /export to hand it to the team for knowledge.json",
            "kb.taughtRemoved": "Removed",
            "kb.noQuestions": "No questions logged in this browser yet",
            "kb.questionsHead": "{total} questions logged — sorted by unanswered / most asked (⚠️ = times unanswered):",
            "kb.exported": "Exported {n} entries (copied to clipboard) — save as tools/faq_extra.json and run build_knowledge.py",
            "kb.disclaimerPub": "For initial reference only — verify against the latest official notice or manufacturer document",
            "kb.lockedStaff": "The values for this live in {table} of the EIT standard — this host does not carry the internal table file (tables-private.json), so Pi cannot look them up here. Use the internal system that has it, or the printed volume",
            "kb.lockedToken": "The values for this live in {table} of the EIT standard — let Pi look them up by entering the internal-tables key once: /tables <key> (ask your admin)",
            "kb.tablesOk": "Internal tables connected ✓ ({n} tables) — ask for EIT table values away",
            "kb.tablesFail": "Wrong key, or the internal tables server did not answer — check the key and run /tables <key> again",
            "kb.tablesNone": "Internal tables not connected — enter the key with /tables <key> (/tables clear removes it)",
            "kb.tablesCleared": "Internal-tables key removed from this browser",
            "kb.tablesHint": "Endpoint: {url}",
            "kb.ref": "Reference",
            "kb.clause": "clause",
            "kb.disclaimer": "Summarised for quick reference — verify against the printed EIT standard.",
            "kb.pointer": "This topic lives in these clauses of the standard:",

            /* ---- Pi console ---- */
            "pi.launch": "Open the Pi console",
            "pi.title": "Console · Chat with Pi",
            "pi.subtitle": "Workspace assistant",
            "pi.status.local": "Demo mode (not connected)",
            "pi.status.online": "Ready — EIT standards knowledge base (client-side)",
            "pi.status.error": "Connection failed",
            "pi.min": "Minimize",
            "pi.close": "Close",
            "pi.clear": "Clear conversation",
            "pi.placeholder": "Type a message, or /help for commands…",
            "pi.send": "Send",
            "pi.you": "You",
            "pi.pi": "Pi",
            "pi.system": "System",
            "pi.thinking": "Pi is typing…",
            "pi.greeting": "Hi, I'm Pi. Ask me about the Thai electrical / solar / BESS installation standards — I answer with EIT clause references (pricing goes to our sales team). Type /help for commands.",
            "pi.q1": "Where is max string voltage defined?",
            "pi.q2": "Which table sizes the EGC?",
            "pi.q3": "How much does installation cost?",
            "pi.help": "Ask about the EIT standards — earthing, SPD, rapid shutdown, BESS…\n\nAvailable commands:\n/help — show all commands\n/status — connection status\n/connect <endpoint> — set the API endpoint (next phase)\n/crm — CRM/SaaS integration plan\n/lang th|en — switch language\n/clear — clear the conversation\n\nStaff (signed in):\n/questions — frequent / unanswered questions\n/teach question | answer | EIT-2568 4.3.5 — teach an answer (/teach list, /teach del N)\n/export — export taught FAQ as JSON\n/tables <key> — connect EIT tables from the internal server (/tables = status, /tables clear)",
            "pi.crm": "CRM/SaaS integration plan (next phase):\n1) Auth — link accounts via OAuth / API key\n2) Data — two-way sync of customers, deals and tickets\n3) Actions — let Pi create and update records from chat\n4) Automation — trigger workflows on events\nThe front-end adapter is already wired up at PiConsole.configure().",
            "pi.status.msg": "Current status: {status}\nEndpoint: {endpoint}\nLanguage: {lang}",
            "pi.notset": "not configured",
            "pi.connected": "Endpoint set to {endpoint} — it goes live once the backend is ready.",
            "pi.cleared": "Conversation cleared.",
            "pi.unknown": "I don't know that command yet. Try /help.",
            "pi.fallback": "I can answer questions about the EIT electrical / solar / BESS installation standards and about the company. Try earthing, SPD, rapid shutdown, string voltage — or type /help.",
            "pi.a.features": "PROINVENTIVE brings docs, wikis, projects and AI agents together. The highlights: answers with citations, and agents that handle routine work 24/7.",
            "pi.a.pricing": "Pricing depends on system size and scope. Leave your email here in the chat, or reach us at 080-028-2399 / info@proinventive.co.th for a quotation.",
            "pi.a.crm": "CRM/SaaS integration lands in the next phase through the adapter that's already in place. Type /crm for the detailed plan.",
            "pi.a.contact": "You can reach sales through the “Request a demo” button above, or just leave your email here in the chat."
        }
    };

    var lang = detect();

    function detect() {
        var saved;
        try {
            saved = localStorage.getItem(STORAGE_KEY);
        } catch (e) {
            saved = null;
        }
        if (saved === "th" || saved === "en") return saved;
        /* Thai is the default for every first-time visitor, regardless of
           browser locale. Only an explicit choice (stored above) overrides it. */
        return DEFAULT_LANG;
    }

    function t(key, vars) {
        var table = DICT[lang] || DICT.th;
        var str = table[key];
        if (str === undefined) str = DICT.th[key];
        if (str === undefined) return key;
        if (vars) {
            Object.keys(vars).forEach(function (k) {
                str = str.split("{" + k + "}").join(vars[k]);
            });
        }
        return str;
    }

    function apply(root) {
        root = root || document;

        root.querySelectorAll("[data-i18n]").forEach(function (el) {
            el.textContent = t(el.getAttribute("data-i18n"));
        });

        root.querySelectorAll("[data-i18n-html]").forEach(function (el) {
            el.innerHTML = t(el.getAttribute("data-i18n-html"));
        });

        root.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
            el.getAttribute("data-i18n-attr")
                .split(",")
                .forEach(function (pair) {
                    var bits = pair.split(":");
                    if (bits.length < 2) return;
                    el.setAttribute(bits[0].trim(), t(bits[1].trim()));
                });
        });

        document.documentElement.lang = lang;

        var titleKey = document.body && document.body.getAttribute("data-i18n-title");
        if (titleKey) document.title = t(titleKey);

        var descKey = document.body && document.body.getAttribute("data-i18n-desc");
        var descEl = document.querySelector('meta[name="description"]');
        if (descKey && descEl) descEl.setAttribute("content", t(descKey));

        document.querySelectorAll("[data-lang]").forEach(function (btn) {
            var on = btn.getAttribute("data-lang") === lang;
            btn.classList.toggle("active", on);
            btn.setAttribute("aria-pressed", String(on));
        });
    }

    function set(next) {
        if (next !== "th" && next !== "en") return;
        if (next === lang) return;
        lang = next;
        try {
            localStorage.setItem(STORAGE_KEY, lang);
        } catch (e) {
            /* storage unavailable — keep in memory only */
        }
        apply();
        document.dispatchEvent(
            new CustomEvent("i18n:change", { detail: { lang: lang } })
        );
    }

    function bind(root) {
        (root || document).querySelectorAll("[data-lang]").forEach(function (btn) {
            btn.addEventListener("click", function () {
                set(btn.getAttribute("data-lang"));
            });
        });
    }

    global.I18N = {
        t: t,
        get: function () {
            return lang;
        },
        set: set,
        apply: apply,
        bind: bind,
        dict: DICT
    };

    document.addEventListener("DOMContentLoaded", function () {
        apply();
        bind();
    });
})(window);
