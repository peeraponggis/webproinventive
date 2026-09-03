# webproinventive

เว็บไซต์ PROINVENTIVE — โครงหน้าและภาษาการออกแบบอ้างอิงจาก notion.com
รองรับ 2 ภาษา (ไทย / อังกฤษ), มี **Console · Chat with Pi** และบอร์ดงาน **Pi Tasks**

---

## โครงสร้างไฟล์

```
.
├── index.html            หน้าแรก (hero, features, use cases, testimonials, CTA, footer)
├── product.html          หน้าผลิตภัณฑ์
├── demo.html             หน้ารวมคลิปเดโมทุกระบบ
├── style.css             design system ทั้งเว็บ (tokens, nav, ปุ่ม, การ์ด, footer)
├── app.js                sticky header, เมนูมือถือ, คำหมุนใน hero, marquee, reveal-on-scroll
├── i18n.js               ระบบ 2 ภาษา + พจนานุกรม TH/EN ของทั้งเว็บ
├── pi-console.js         Console · Chat with Pi (logic + adapter สำหรับ CRM/SaaS)
├── pi-console.css        สไตล์ของคอนโซล
├── img/                  โลโก้ (pilogo.png), favicon, ไอคอน
└── pi_tasks/             บอร์ดงานแบบ Kanban
    ├── index.html
    ├── tasks.js          board logic, drag & drop, โหมดสาธิตสด, adapter
    ├── tasks-i18n.js     คำแปลเฉพาะหน้า Pi Tasks (merge เข้า I18N)
    └── tasks.css
```

## รันบนเครื่อง

เป็นเว็บ static ล้วน ไม่ต้อง build:

```bash
python -m http.server 8123
```

แล้วเปิด <http://localhost:8123>

> ต้องเปิดผ่าน HTTP server ไม่ใช่ `file://` เพราะไฟล์ JS/CSS ถูกโหลดแบบ relative path

---

## ระบบ 2 ภาษา (i18n)

ทุกข้อความในหน้าเว็บผูกกับ key ในพจนานุกรมของ [`i18n.js`](i18n.js)

```html
<span data-i18n="nav.pricing">ราคา</span>
<p    data-i18n-html="some.key">รองรับแท็ก HTML</p>
<input data-i18n-attr="placeholder:tk.search, aria-label:tk.search">
<body data-i18n-title="meta.title" data-i18n-desc="meta.desc">
```

- ปุ่มสลับภาษาคือ element ที่มี `data-lang="th"` / `data-lang="en"` (มีทั้งใน navbar, เมนูมือถือ และ footer)
- **ผู้เข้าชมครั้งแรกได้ภาษาไทยเสมอ** ไม่ว่าเบราว์เซอร์ตั้งภาษาอะไร (เปลี่ยนค่าเริ่มต้นได้ที่ `DEFAULT_LANG` ใน `i18n.js`)
- ภาษาที่ผู้ใช้กดเลือกเองถูกจำไว้ใน `localStorage` (key `pi_lang`) และมีผลเหนือค่าเริ่มต้น
- เปลี่ยนภาษาแล้วจะ update `<html lang>`, `<title>` และ meta description ให้อัตโนมัติ

API:

```js
I18N.get();          // 'th' | 'en'
I18N.set('en');      // สลับภาษา + จำค่า + re-render
I18N.t('nav.free');  // แปลข้อความ
document.addEventListener('i18n:change', e => console.log(e.detail.lang));
```

**เพิ่มข้อความใหม่:** เติม key ทั้งใน `DICT.th` และ `DICT.en` ของ `i18n.js`
สำหรับหน้าใหม่ในโฟลเดอร์ย่อย ใช้วิธีเดียวกับ `pi_tasks/tasks-i18n.js` คือ merge เข้า `I18N.dict`

---

## Console · Chat with Pi

ปุ่มลอยมุมขวาล่างของทุกหน้า เปิดคอนโซลคุยกับ Pi
**เฟสนี้ทำงานในโหมดสาธิต** (ตอบจากชุดคำตอบในเครื่อง) และเตรียม adapter ไว้ให้ต่อ CRM/SaaS ในเฟสถัดไปโดยไม่ต้องแก้ UI

คำสั่งในคอนโซล: `/help` `/status` `/connect <endpoint>` `/crm` `/lang th|en` `/clear`

### ต่อกับ backend (เฟสถัดไป)

```js
PiConsole.configure({
  endpoint: "https://api.yourcrm.com/pi/chat",
  headers : { Authorization: "Bearer …" },

  // หรือ override ทั้งก้อน — รับ payload ด้านล่าง คืน { reply } หรือ string
  transport: async (payload) => ({ reply: "…" })
});

PiConsole.setContext({ userId, accountId, dealId });   // แนบ context ไปกับทุกคำถาม
```

payload ที่ส่งไป backend:

```json
{
  "message": "ราคาเท่าไหร่",
  "lang": "th",
  "history": [{ "role": "user", "text": "…", "ts": 1756500000000 }],
  "context": { "userId": "…" }
}
```

API อื่น: `PiConsole.open() / close() / toggle() / send(text) / say(text, role) / clear()`
และ `PiConsole.on('message'|'open'|'close'|'error', fn)`

---

## Pi Tasks — บอร์ดงาน Kanban

อยู่ที่ [`pi_tasks/index.html`](pi_tasks/index.html) เข้าได้จากเมนู **ผลิตภัณฑ์ → Pi Tasks**

- 4 คอลัมน์: รอทำ / กำลังทำ / รอตรวจ / เสร็จแล้ว พร้อมตัวนับที่อัปเดตสด
- ลากการ์ดข้ามคอลัมน์ได้ (pointer-based รองรับทั้งเมาส์และทัช) การ์ดที่ลากจะเอียงตามเงา
- คลิกที่ชื่อการ์ดเพื่อแก้ไขในที่ · ปุ่ม ✕ เพื่อลบ · `+ เพิ่มการ์ด` ท้ายคอลัมน์
- แท็บ: งานทั้งบริษัท / งานของฉัน / สปรินต์ปัจจุบัน / ไทม์ไลน์
- เครื่องมือ: ค้นหา, เรียง A→Z, รีเซ็ตบอร์ด, ปุ่ม "สร้างใหม่"
- **โหมดสาธิตสด** — จำลองเพื่อนร่วมทีมเข้ามาคอมเมนต์และย้ายการ์ด (ปิดได้ที่ปุ่ม Live demo)
- บอร์ดถูกเก็บใน `localStorage` (key `pi_tasks_board_v1`)

### ต่อกับ CRM/SaaS (เฟสถัดไป)

ทุกการเปลี่ยนแปลงบนบอร์ดถูกส่งออกเป็น event เดียวกันหมด:

```js
PiTasks.configure({
  endpoint : "https://api.yourcrm.com/tasks",
  headers  : { Authorization: "Bearer …" },
  transport: async (event) => { /* จัดการเอง */ }
});

PiTasks.on('change', e => console.log(e.type, e.card));
```

รูปแบบ event:

```json
{
  "type": "create | update | move | delete | reset",
  "card": { "id": "…", "title": "…", "col": "review", "mine": true, "sprint": false },
  "from": "doing",
  "to": "review",
  "board": [ "…สถานะบอร์ดทั้งหมด…" ],
  "ts": 1756500000000
}
```

API อื่น: `PiTasks.getBoard() / setBoard(arr) / create(col) / move(id, col) / remove(id) / reset() / setLive(bool)`

---

## Deploy (GitHub Pages)

push ขึ้น `main` แล้ว GitHub Pages จะ publish ให้เอง → <https://peeraponggis.github.io/webproinventive/>

> **ทุกครั้งที่แก้ไฟล์ `.css` / `.js` ให้เปลี่ยนเลข `?v=` ใน `<link>` และ `<script>` ของไฟล์ HTML ทั้ง 4 หน้า**
> (ใช้รูปแบบ `?v=YYYYMMDDnn`) — GitHub Pages ตั้ง `Cache-Control: max-age=600` ถ้าไม่เปลี่ยนเลขนี้
> เบราว์เซอร์ของผู้ใช้เดิมอาจโหลด HTML ใหม่คู่กับ JS เก่าค้างไว้ได้

---

## ระบบ login (โหมดสาธิต) — `auth.js`

- ปุ่ม "เข้าสู่ระบบ" เปิด modal กรอกอีเมล — ถ้าลงท้าย `@proinventive.co.th` ถือว่าเข้าสู่ระบบสำเร็จ
  (เก็บใน `localStorage` key `pi_user`) และเมนู **ระบบภายใน** จะปรากฏ: Pi Tasks · CRM · BoQ · ASC · SaaS หลังบ้านแอดมิน
- ลิงก์ที่เห็นเสมอไม่ต้อง login: **SaaS** (เว็บลูกค้า) และ **SaaS ช่างติดตั้ง**
- element ที่มีคลาส `internal-only` ถูกซ่อนจนกว่าจะ login (CSS: `body.pi-authed`)
- ⚠️ **เป็นการสาธิต UI เท่านั้น ไม่ใช่ความปลอดภัยจริง** — เว็บเป็น static ไม่มี backend ตรวจรหัสผ่าน
  ใครดูโค้ดก็ข้ามได้ ระบบจริงต้องทำ auth ฝั่ง server ในเฟสถัดไป
- API: `PiAuth.getUser() / login(email) / logout() / open()` + event `auth:change`

## ฐานความรู้มาตรฐาน EIT (Pi Brain) — `pi-brain.js` + `knowledge.json`

Pi console ตอบคำถามเทคนิคเรื่องมาตรฐานไฟฟ้า/โซล่าร์/BESS ได้เอง **client-side ทั้งหมด**
(retrieval แบบ keyword + trigram ภาษาไทย — ไม่มีโมเดล ไม่มี server):

- `knowledge.json` สร้างโดย `python tools/build_knowledge.py` จากข้อมูลที่ audit ไว้ใน
  `C:/enterprise/solar-project-complete` (clause-map.ts + PROVISIONS.csv) + FAQ ที่เรียบเรียงเอง
- **กติกาลิขสิทธิ์**: ไฟล์สาธารณะเก็บเฉพาะ เลขข้อ/เลขตาราง/ชื่อหัวข้อ (ข้อมูลบรรณานุกรม)
  และคำสรุปสั้นที่เรียบเรียงเอง — **ห้าม** ฝังตาราง lookup ของ วสท. (AMPACITY, T4-x, T5-x)
  หรือข้อความจากเล่มเกิน ~40 คำ (generator มี validate บังคับ) ทุกคำตอบอ้างอิงเล่ม+เลขข้อ
  และเตือนให้ตรวจกับฉบับจริง
- คำถามราคา/ขาย ถูก intercept ก่อนเสมอ → ส่งต่อฝ่ายขาย ไม่เข้าฐานความรู้
- เสียบผ่าน `PiConsole.configure({ transport })` — ถอดออกเมื่อมี backend จริงได้ทันที
- regenerate: แก้ FAQ ใน `tools/build_knowledge.py` → รันสคริปต์ → bump `?v=` → commit

### เฟส 2 — ตอบค่าจากตาราง + ระบบจำคำถามบ่อย

**ตาราง 2 ชั้น** (สร้างโดย `tools/build_knowledge.py` จาก `digitize-kit/*.csv`)

| ไฟล์ | เนื้อหา | อยู่ใน repo? |
|---|---|---|
| `tables-public.json` | ค่าไฟ กฟภ. / Ft / TOU, หน่วยทดสอบที่ กฟภ. รับรอง, ตารางความเข้ากันได้อินเวอร์เตอร์–แบตเตอรี่ (ข้อมูลราชการ/ผู้ผลิต) | ✅ |
| `tables-private.json` | ตาราง วสท. (4-1, 4-2, 3-4, 3-5, 5-3, 5-8, 5-40/41/43/44/47/48, ขนาดกระแส, ภาคผนวก ฎ/ฐ, BCC) | ❌ อยู่ใน `.gitignore` — วางบนโฮสต์ภายในเท่านั้น |

Pi โหลดตาราง วสท. เฉพาะเมื่อผู้ใช้เข้าสู่ระบบ (`PiAuth`) ตามลำดับนี้:
1. `tables-private.json` ข้างไฟล์เว็บ (โฮสต์ภายใน) — ถ้ามี
2. endpoint บน Railway `https://web-production-359eb.up.railway.app/api/pi/tables` (route อยู่ใน repo ส่วนตัว Solar-SaaS — https://github.com/enterprice0945/enterprice0945-Solar-SaaS — ที่ `apps/web/app/api/pi/tables/route.ts`, ไฟล์ตารางที่ `apps/web/private-data/`) — ต้องส่ง `Authorization: Bearer <PI_TABLES_TOKEN>` และเปิด CORS เฉพาะ `peeraponggis.github.io` กับ localhost
   พนักงานใส่รหัสครั้งเดียวในคอนโซล: `/tables <รหัส>` (เก็บใน `localStorage.pi_tables_token`; `/tables` ดูสถานะ, `/tables clear` ลบ) — รหัสตั้งเป็นตัวแปร `PI_TABLES_TOKEN` ของ service `web` บน Railway
3. ถ้าไม่มีทั้งสองอย่าง Pi จะชี้เลขตารางและบอกวิธีเชื่อมแทน

อัปเดตตารางบน Railway: `python tools/build_knowledge.py --private-out "C:/enterprise/Solar SaaS/proinventive-solar/apps/web/private-data"` แล้ว `railway up --service web` จากโฟลเดอร์ `C:/enterprise/Solar SaaS/proinventive-solar` (repo `enterprice0945/enterprice0945-Solar-SaaS`)

**Lookup skills** (ใน `pi-brain.js`, รันก่อน retrieval): สายดินบริภัณฑ์ (ตาราง 4-2) · สายต่อหลักดิน (4-1) · ตัวคูณอุณหภูมิ (5-43/5-44) · ตัวคูณจำนวนวงจรในท่อ (5-8) · แรงดันตก mV/A/m + คำนวณ (ภาคผนวก ฐ) · ขนาดกระแส (5-20…) · จำนวนสายในท่อ (ภาคผนวก ฎ) · มิเตอร์ กฟภ./กฟน. (3-5/3-4) · ค่าไฟ/Ft/TOU · COMPAT · หน่วยทดสอบ PEA

ตัวอย่าง: `เบรกเกอร์ 100A สายดินกี่ mm²` · `สาย 16 mm² 3 เฟส แรงดันตก 30 m 40 A` · `PVC อุณหภูมิ 45 องศา ตัวคูณ` · `มิเตอร์ 15(45) PEA` · `ค่าไฟหน่วยละเท่าไหร่ 120 หน่วย` · `LUNA2000-14-S1 ใช้กับ SUN2000-12K-MB0 ได้ไหม`

**Skill "sizing" — ประมาณขนาดระบบ** (ไม่ใช้ตาราง ใช้ได้ทุกคน รันก่อน skill อื่นทั้งหมด)
- จับคำถามแนว *กี่แผง / จำนวนแผง / ขนาดระบบ / กี่ kWp* แล้วอ่านค่า: แบต `X kWh`, โหลด `X kWh/วัน` หรือ `X หน่วย/เดือน`, เป้าหมาย `X kWp`, แผง `X W` (ไม่ระบุ → สมมติ 550 W และบอกไว้)
- สูตร: kWp = พลังงานที่ต้องผลิต/วัน ÷ ชั่วโมงแดด 4.2 ÷ ประสิทธิภาพ 0.8 (แบตคิด kWh × 0.9) → แผง = ⌈kWp × 1000 ÷ W⌉ — สมมติฐานทั้งหมดอยู่ที่ตัวแปร `SIZING` ใน `pi-brain.js` แก้จุดเดียว
- คำตอบระบุสมมติฐานทุกครั้ง อ้างอิงเป็น "สูตรประมาณการของ PROINVENTIVE (ไม่ใช่ค่าจากมาตรฐาน)" ชี้ไป ASC/ฝ่ายขาย และถ้าแบต ≥ 50 kWh จะแนบข้อกำหนดการแบ่งส่วนแบตเตอรี่ (วสท. 022013-25 ข้อ 5.3.2 (3)) เป็น "ข้อควรรู้"
- ตัวอย่าง: `แบต 50 kWh ใช้แผง 650 วัตต์กี่แผง` → 45 kWh/วัน ≈ 13.4 kWp ≈ 21 แผง · `ใช้ไฟเดือนละ 900 หน่วย ต้องใช้กี่แผง` → 30 kWh/วัน ≈ 8.9 kWp ≈ 17 แผง (550 W) · `ระบบ 10 kWp แผง 600W กี่แผง` → 17 แผง

**ระบบจำคำถามบ่อย**
- ทุกคำถามถูกบันทึกใน `localStorage.pi_qlog` ของเบราว์เซอร์นั้น (สูงสุด 300 รายการ)
- คำสั่งสำหรับพนักงาน (ต้องเข้าสู่ระบบ): `/questions` สรุปคำถามที่ตอบไม่ได้/ถามบ่อย · `/teach คำถาม | คำตอบ | EIT-2568 4.3.5` สอนคำตอบ ใช้ได้ทันที (`/teach list`, `/teach del N`) · `/export` ส่งออก JSON (คัดลอกลงคลิปบอร์ด)
- นำ JSON จาก `/export` วางเป็น `tools/faq_extra.json` → รัน `python tools/build_knowledge.py` → push → ทุกคนได้ใช้
- **FAQ ที่สอนไว้แล้วใน `tools/faq_extra.json` (6 รายการ, 3 ก.ย. 2569)** — คำถาม sizing แบบไม่มีตัวเลข ซึ่ง skill คำนวณจับไม่ได้: วิธีคำนวณจำนวนแผง/ขนาดระบบ · ขนาดแบตเตอรี่ควรเป็นเท่าไหร่ (อ้าง วสท. 022013-25 ข้อ 5.3.2 (3)) · 1 kWp ผลิตได้เท่าไหร่ในไทย · เลือกขนาดอินเวอร์เตอร์ (DC/AC ratio) · ต้องใช้พื้นที่หลังคาเท่าไหร่ · **ขายไฟคืนการไฟฟ้าได้ไหม** (โซลาร์ภาคประชาชน ≤10 kWp, 2.20 บาท/หน่วย, โควต้าจำกัด — ตัวเลขตามประกาศ กกพ. ควรทบทวนเมื่อมีประกาศใหม่) — ทุกรายการมี TH/EN และเป็นสูตร/ค่าประมาณของเราเอง ไม่ใช่เนื้อหาลิขสิทธิ์
  รายการใหม่ใส่ฟิลด์ `kw` ให้ครอบคลุมคำที่คนถามจริง (เช่น "หลังคากว้างแค่ไหน" นอกจาก "พื้นที่หลังคา") เพราะการค้นหาใช้คีย์เวิร์ด + trigram
- ส่งบันทึกคำถามเข้า backend (Railway) ได้ด้วย `PiBrain.configure({ logEndpoint: "https://…/api/pi/log" })` — ส่งแบบ `navigator.sendBeacon` เป็น JSON:
  `{ "q": "...", "score": 4.2, "answered": false, "lang": "th", "ts": 1756600000000, "user": "a@proinventive.co.th" | null, "page": "/index.html" }`

## หมายเหตุ

- ข้อมูลบริษัท ผลงานโครงการ สถิติ MWp และช่องทางติดต่อ นำมาจาก **Company Profile จริง** ของ
  บริษัท โปรอินเวนทีฟ จำกัด (แก้ได้ที่ `#logoTrack`, `#statTrack`, `#stories`, `#about` ใน `index.html`
  และ `#portfolio` ใน `product.html`)
- ฟอนต์โหลดจาก Google Fonts (Inter + Noto Sans Thai) จึงต้องมีอินเทอร์เน็ตตอนเปิดหน้าเว็บ
