# PROINVENTIVE Website + Pi Console — บันทึกการปรับปรุง

สร้างเมื่อ 30 ส.ค. 2569 (commit แรก) · โดย ลุงพี
เวอร์ชันปัจจุบันอยู่ใน `VERSION.json` (เลข `?v=YYYYMMDDnn` ใน HTML เป็นตัวกันแคช ไม่ใช่เวอร์ชันโปรแกรม)

## v1.0.0 — 1 พ.ย. 2569 · โดย ลุงพี
- เริ่มนับเวอร์ชัน — ฟีเจอร์ทั้งหมดก่อนหน้านี้ (เว็บ 2 ภาษา, Pi Console + Pi Brain เฟส 2, Pi Tasks, OKMD bridge) ดูใน `README.md` และ `HANDOFF.md`
- **ความปลอดภัย:** นำคีย์ OKMD (`window.OKMD_API_KEY`) ออกจาก HTML ทั้ง 5 หน้า (`index.html`, `product.html`, `demo.html`, `index2.html`, `pi_tasks/index.html`) — repo เป็น public · เชื่อม OKMD ด้วยคำสั่ง `/okmd <api_key>` ในคอนโซลแทน · คีย์เดิมยังอยู่ในประวัติ git ต้องยกเลิกที่ ai.okmd.or.th
- README / AGENTS.md / HANDOFF.md: เตือนห้ามใส่คีย์จริงใน HTML ที่ commit
