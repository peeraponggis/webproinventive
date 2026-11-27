## 1.4.1 — 2026-11-27 โดย ลุงพี
- เปลี่ยนหน้า packages.html: ASC Architect → ASC Studio พร้อมโลโก้ใหม่
- คำอธิบายใหม่: "เลือกแพ็คเกจที่เหมาะกับการใช้งานของคุณ — ทดลองฟรี, Starter, Pro"

## 1.4.0 — 2026-11-27 โดย ลุงพี
- เปลี่ยนชื่อ "Console · Chat with Pi" เป็น "Console · Chat with Ai-Pi" ทุกจุด
- เพิ่มคลังความรู้ ASC Studio (376 chunks, 57 หัวข้อ) เข้าระบบ Ai-Pi
- เพิ่มข้อมูลหน้าเว็บทุกหน้าย่อยลงคลังความรู้ (10 entries)
- ป้ายที่มาคำตอบ: 📖 มาตรฐาน วสท. · 📚 ASC Studio · 🗂️ ข้อมูลหน้าเว็บ

## 1.3.2 — 2026-11-27 โดย ลุงพี
- เพิ่มข้อความ "(ตั้งแต่ กุมภาพันธ์ 2568)" ในป้ายกำลังติดตั้งรวม ทั้งภาษาไทยและอังกฤษ

## 1.3.1 — 2026-11-27 โดย ลุงพี
- เข้าสู่ระบบด้วยอีเมล @proinventive.co.th แล้วเปิดหน้า Admin CMS อัตโนมัติ

## 1.3.0 — 2026-11-27 โดย ลุงพี
- แก้หน้า Demo: "ASC ระบบออกแบบ PVs" → "ASC Studio ระบบออกแบบโซลาร์เซลล์ครบวงจรในที่เดียว"
- ลบคลิปเดิม เพิ่ม 4 คลิปใหม่: ตัวอย่างงานบ้าน, ตัวอย่างงานพาณิชย์, การขนานแรงต่ำ, การขนานแรงสูง
- แก้คำย่อ "โซล่าร์" เป็น "โซลาร์เซลล์" ทุกจุดในหน้า Demo

## 1.2.0 — 2026-11-27 โดย ลุงพี
- แก้ไขและเผยแพร่เนื้อหาออนไลน์ได้จากเว็บจริง (pi.aisolar.dev) ผ่าน GitHub API
- เพิ่ม UI ตั้งค่า GitHub Token (เก็บใน localStorage ไม่อยู่ในโค้ด)
- บันทึกออนไลน์ = commit content.json ขึ้น GitHub โดยตรง ไม่ต้องเปิด CMS Server
- localhost ยังใช้ CMS Server ได้เหมือนเดิม

## 1.1.11 — 2026-11-27 โดย ลุงพี
- แก้ dropdown ประเภทโครงการ: เปลี่ยนแล้ว editor ไม่ปิด badge อัปเดตทันที (ไม่ render หน้าใหม่)
- แก้ปุ่มเพิ่มโครงการ: เลื่อนไปรายการใหม่ + เปิด editor อัตโนมัติ

## 1.1.10 — 2026-11-27 โดย ลุงพี
- เพิ่ม favicon (โลโก้ PROINVENTIVE) ในหน้า Admin CMS

## 1.1.9 — 2026-11-27 โดย ลุงพี
- Preview bar บันทึกแล้วไม่หาย — แสดงข้อความ "บันทึกแล้ว กดเผยแพร่" พร้อมปุ่มเผยแพร่
- เผยแพร่สำเร็จแสดง dialog ผลลัพธ์ + path ของ content.json + ลิงก์เปิดเว็บจริง
- สร้าง CMS-Server.bat + Desktop shortcut สำหรับเปิด CMS Server ดับเบิลคลิก

## 1.1.8 — 2026-11-27 โดย ลุงพี
- เพิ่มปุ่ม "เผยแพร่ขึ้นเว็บ" ใน Admin CMS — กดแล้ว commit + push ขึ้นเว็บจริงในคลิกเดียว
- สร้าง cms-server.py รองรับ API save/publish สำหรับ Admin CMS
- ปุ่มบันทึกเปลี่ยนจากดาวน์โหลดเป็นเซฟลง repo โดยตรง (localhost)
- รวมช่อง lat/lng เป็นช่องเดียว "พิกัด (Google Maps)" วางค่าได้เลย

## 1.1.7 — 2026-11-27 โดย ลุงพี
- ปรับปรุง Admin CMS ใหม่ทั้งหมด: เพิ่มการจัดการเนื้อหาทุกหน้าย่อย (index, product, demo, ascs, platform, pi_tasks)
- Sidebar แบ่ง 2 กลุ่ม: หน้าเว็บ 7 หน้า + ตั้งค่าทั่วไป 6 หมวด
- หน้าภาพรวมแสดงการ์ดทุกหน้าให้คลิกเข้าแก้ได้เลย
- ขยาย content.json รองรับ pages (hero, cards, videos, about, cta ทุกหน้า)

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
