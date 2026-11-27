## 1.1.6 — 2026-11-27 โดย ลุงพี
- ตัด internal-only SaaS หลังบ้านแอดมิน ออกจาก pi_tasks/index.html

## 1.1.5 — 2026-11-27 โดย ลุงพี
- ตัด internal-only SaaS หลังบ้านแอดมิน ออกจาก demo.html และ product.html

## 1.1.4 — 2026-11-27 โดย ลุงพี
- ตัด internal-only SaaS หลังบ้านแอดมิน ออกจาก navbar index.html

## 1.1.3 — 2026-11-27 โดย ลุงพี
- ตัด SaaS ออกจาก navbar ของ pi_tasks/index.html

## 1.1.2 — 2026-11-27 โดย ลุงพี
- ตัด SaaS ออกจาก navbar ของ demo.html และ product.html

## 1.1.1 — 2026-11-27 โดย ลุงพี
- ตัด SaaS ออกจาก navbar ของ ascs.html และ platform.html

## 1.1.0 — 2026-11-27 โดย ลุงพี
- หุ่นยนต์หยุดเต้น เปลี่ยนเป็นตากระพริบ ฟ้า→เหลือง→แดง
- ตัด "เริ่มต้นวันนี้เลย" / "เริ่มใช้ PROINVENTIVE ฟรี" ทุกหน้า → "พร้อมให้บริการ"
- ลบ ผลิตภัณฑ์ / Demo / เริ่มใช้ฟรี จาก navbar ทุกหน้า
- เพิ่มปุ่ม "เข้าสู่ระบบ" หลัง TH/EN ทุกหน้า
- สร้างหน้า ascs.html (Solar PV Design — 3 การ์ด: Demo, Package, ASC Studio)
- สร้างหน้า platform.html (Energy Platform — 3 การ์ด: PVCAL, Site Survey, SolarMatch)
- แก้ลิงก์ donut legend ไปหน้าย่อยใหม่
- ตัดการ์ด SolarMatch จากส่วนซอฟต์แวร์ครบวงจร ขยับ Demo ขึ้นมา

## 1.0.1 — 2026-11-27 โดย ลุงพี
- เปลี่ยนลิงก์จาก peeraponggis.github.io เป็นโดเมนใหม่ aisolar.dev / pi.aisolar.dev

# PROINVENTIVE Website + Pi Console — บันทึกการปรับปรุง

สร้างเมื่อ 30 ส.ค. 2569 (commit แรก) · โดย ลุงพี
เวอร์ชันปัจจุบันอยู่ใน `VERSION.json` (เลข `?v=YYYYMMDDnn` ใน HTML เป็นตัวกันแคช ไม่ใช่เวอร์ชันโปรแกรม)

## v1.0.0 — 1 พ.ย. 2569 · โดย ลุงพี
- เริ่มนับเวอร์ชัน — ฟีเจอร์ทั้งหมดก่อนหน้านี้ (เว็บ 2 ภาษา, Pi Console + Pi Brain เฟส 2, Pi Tasks, OKMD bridge) ดูใน `README.md` และ `HANDOFF.md`
- **ความปลอดภัย:** นำคีย์ OKMD (`window.OKMD_API_KEY`) ออกจาก HTML ทั้ง 5 หน้า (`index.html`, `product.html`, `demo.html`, `index2.html`, `pi_tasks/index.html`) — repo เป็น public · เชื่อม OKMD ด้วยคำสั่ง `/okmd <api_key>` ในคอนโซลแทน · คีย์เดิมยังอยู่ในประวัติ git ต้องยกเลิกที่ ai.okmd.or.th
- README / AGENTS.md / HANDOFF.md: เตือนห้ามใส่คีย์จริงใน HTML ที่ commit
