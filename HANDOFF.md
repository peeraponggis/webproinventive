# HANDOFF — ย้ายงานไปทำต่อที่เครื่องอื่น (เช่น Home Server)

อัปเดตล่าสุด: 1 พ.ย. 2569 · เขียนจากเซสชัน Claude Code บนเครื่อง Lenovo (Windows)

## 1. ภาพรวมโปรเจกต์

เว็บบริษัท PROINVENTIVE (static site บน GitHub Pages) + Pi Console (แชตช่วยตอบมาตรฐาน วสท. ฝั่ง client)

| ส่วน | ที่อยู่ | หมายเหตุ |
|---|---|---|
| เว็บ (repo นี้) | https://github.com/peeraponggis/webproinventive · live: https://peeraponggis.github.io/webproinventive/ | public |
| ข้อมูลมาตรฐาน (clause-map, digitize-kit CSV) | https://github.com/proinventive/solar-project-complete | private — generator ของ Pi อ่านจาก checkout นี้ |
| Backend Railway (Solar SaaS, Next.js) | https://github.com/enterprice0945/enterprice0945-Solar-SaaS | private — มี `/api/pi/tables` ส่งตาราง วสท. ให้ Pi |
| Railway | workspace aiSolar0945 · project `proinventive-solar` · service `web` (web-production-359eb.up.railway.app) | deploy ด้วย `railway up --service web` จาก checkout ของ Solar-SaaS |

รายละเอียดสถาปัตยกรรม Pi Brain, คำสั่งคอนโซล, ตาราง 2 ชั้น, FAQ ที่สอน และเรื่องแคช อยู่ใน `README.md` · OKMD AI bridge อยู่ใน `AGENTS.md`

## 2. สถานะงาน ณ วันที่ส่งมอบ

เสร็จและ deploy แล้วทั้งหมด (ไม่มีงานค้างในเซสชันเดิม):
- Pi Brain เฟส 2: ตาราง 2 ชั้น (สาธารณะใน repo / วสท. ผ่าน Railway + token), lookup skills 13 ตัว + skill ประมาณขนาดระบบ (`SIZING`), FAQ ที่สอน 6 รายการใน `tools/faq_extra.json`
- คำสั่งคอนโซล `/status` `/questions` `/teach` `/export` `/tables` ทดสอบผ่านคอนโซลจริงบนเว็บแล้วทุกตัว
- OKMD AI bridge (`okmd-bridge.js`, `/okmd`) — ดู `AGENTS.md`

งานที่ยังไม่ได้ทำ (จาก `AGENTS.md`): markdown rendering สำหรับ citations ของ OKMD · ปุ่ม like/dislike · conversation starters เป็นปุ่มใน console

ข้อควรระวังที่พบ: `index.html` ฯลฯ ฝัง `window.OKMD_API_KEY` ไว้ใน repo สาธารณะ — ถ้าคีย์นั้นไม่ใช่คีย์สำหรับ guest/public ควรย้ายออก

## 3. ตั้งค่าเครื่องใหม่ (Windows หรือ Linux)

ต้องมี: git, Python 3.12+, Node 20+, Railway CLI (`npm i -g @railway/cli`), Claude Code

```bash
# โฟลเดอร์ใดก็ได้ — ตัวอย่างใช้ ~/work
git clone https://github.com/peeraponggis/webproinventive.git
git clone https://github.com/proinventive/solar-project-complete.git        # private: login GitHub ครั้งแรก
git clone https://github.com/enterprice0945/enterprice0945-Solar-SaaS.git   # private
```

```bash
# สร้าง knowledge.json / tables-public.json / tables-private.json (ไฟล์หลังถูก .gitignore)
cd webproinventive
python tools/build_knowledge.py --ent ../solar-project-complete --private-out ../enterprice0945-Solar-SaaS/apps/web/private-data
```
(ไม่ใส่ `--ent` ก็ได้ถ้า checkout อยู่ที่ `F:/enterprise/solar-project-complete`, `C:/enterprise/...` หรือ `~/enterprise/...`; หรือตั้ง env `EIT_ENT`)

```bash
# Railway (ครั้งเดียว)
railway login
cd enterprice0945-Solar-SaaS && railway link    # เลือก proinventive-solar / production / web
```

พรีวิวเว็บ: `.claude/launch.json` ไม่อยู่ใน git (โฟลเดอร์ `.claude/` ถูก ignore) — สร้างใหม่:
```json
{ "version": "0.0.1", "configurations": [ { "name": "web", "runtimeExecutable": "python", "runtimeArgs": ["-m", "http.server", "8123"], "port": 8123 } ] }
```

Secrets ที่ไม่อยู่ในไฟล์ใด: `PI_TABLES_TOKEN` (ตั้งอยู่ใน Railway service `web` — อ่านได้ด้วย `railway variables --service web`), รหัสผ่าน GitHub/Railway

## 4. เอาความจำของ Claude ไปด้วย

Claude Code เก็บ memory ต่อโปรเจกต์ที่ `~/.claude/projects/<ชื่อโฟลเดอร์โปรเจกต์แบบ encode>/memory/` บนเครื่องเดิมคือ
`C:\Users\Lenovo\.claude\projects\F--Data-data-data-data-data-data-00------NEW-Project-01-ProInventive-00-Pro-Pi-Ai-14-Pi-web\memory\`
(ไฟล์: `MEMORY.md`, `railway-pi-tables-endpoint.md`) — คัดลอกไปวางในโฟลเดอร์ memory ของโปรเจกต์บนเครื่องใหม่ (ชื่อโฟลเดอร์ encode จาก path ใหม่; เปิด Claude Code ในโฟลเดอร์ repo หนึ่งครั้งจะเห็นชื่อโฟลเดอร์ที่ถูกสร้าง)

## 5. กฎที่ต้องจำเมื่อแก้โค้ด

- แก้ไฟล์ `.js`/`.css` เมื่อไหร่ ต้อง bump `?v=YYYYMMDDnn` ในทุกหน้า HTML (`index.html`, `product.html`, `demo.html`, `index2.html`, `pi_tasks/index.html`) ไม่งั้น GitHub Pages/เบราว์เซอร์ใช้ไฟล์เก่า
- `tables-private.json` ห้ามขึ้น repo เว็บ (ลิขสิทธิ์ วสท.) — อยู่ได้แค่ใน Solar-SaaS (private) และเครื่อง local
- endpoint `/api/pi/tables` และ `fetch` ฝั่งเว็บต้องเป็น `no-store` เสมอ (ดูเหตุผลใน README)
- i18n: ทุกคีย์ต้องมีทั้ง TH และ EN; ข้อความหลายบรรทัดใน `i18n.js` ใช้ `\n` แบบ escape ไม่ใช่ขึ้นบรรทัดจริง
- commit ลงท้ายด้วย `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`
