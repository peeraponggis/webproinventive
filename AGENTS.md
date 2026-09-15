# AGENTS.md — OKMD AI Integration

## Overview

ProInventive web ได้รับการบูรณาการกับ OKMD AI API (https://ai.okmd.or.th) แล้ว
โดยใช้ `okmd-bridge.js` เป็น vanilla JS adapter (ไม่ใช่ React widget)

## Files Changed (commit a162948)

| File | Change |
|---|---|
| `package.json` | New — npm config with `@edvisory/okmd-ai-widget@1.0.22` |
| `okmd-bridge.js` | New — API bridge (guest token, SSE, cache, Thai instruction) |
| `config/okmd-config.js` | New — auto-init from localStorage/key, auto-attach to PiConsole |
| `pi-console.js` | Modified — `/okmd` command in handleCommand switch |
| `i18n.js` | Modified — `/okmd` in help text (TH+EN) |
| `index.html`, `demo.html`, `product.html`, `index2.html`, `pi_tasks/index.html` | Modified — added okmd-bridge.js + config scripts, API key, version bump |
| `README.md` | Modified — added OKMD AI Integration section |
| `.gitignore` | Modified — added node_modules/, package-lock.json, okmd-api-key.json |

## OKMD API Endpoints

```
AUTH:  POST https://ai-api.okmd.or.th/api/v1/auth/guest     (X-API-Key → guest_access_token)
CHAT:  GET  /v1/chats/conversation-starters                   (Authorization + X-API-Key)
       POST /v1/chats/message                                 (payload: message + [ตอบภาษาไทย])
       GET  /v1/chats/stream/{chatMessageId}?is_regenerate=false  (SSE streaming)
       POST /v1/chats/chat-sessions/chat-messages/{id}/feedback   (is_like/is_dislike)
```

## Usage

### คำสั่นใน Pi Console (แนะนำ)
```
/okmd <api_key>    เชื่อมต่อ (บันทึกใน localStorage)
/okmd status        ดูสถานะ
/okmd off           ปิด
```

### Auto-init (ตั้งไว้ใน HTML แล้ว)
```html
<script>window.OKMD_API_KEY = "sk-xxx";</script>
<script src="okmd-bridge.js" defer></script>
<script src="config/okmd-config.js" defer></script>
```

### Programmatic
```js
await OkmdBridge.init("sk-xxx");
const { text, citations } = await OkmdBridge.chat("question");
```

## Persistence (localStorage)

| สิ่งที่บันทึก | Key |
|---|---|
| API key + guest token + session | `okmd_state` |
| Q&A cache (max 100) | `okmd_cache` |
| API key (สำรอง) | `okmd_api_key` |

## Thai Language
- `okmd-bridge.js:46` — `LANG_INSTRUCTION = "[\u0e02\u0e2d\u0e1a\u0e16\u0e32\u0e07\u0e44\u0e17\u0e22]"`
- ใส่ prefix `[ตอบภาษาไทย]` กับทุกข้อความก่อนส่งให้ OKMD AI

## Local Testing

```bash
# From web/ directory
python -m http.server 8123
# Open http://localhost:8123
```

## Live Site
- https://peeraponggis.github.io/webproinventive/
- GitHub repo: peeraponggis/webproinventive (main branch)

## Cache Busting
- Version: `?v=20260915013` (latest)
- เปลี่ยนเลขเมื่อแก้ไขไฟล์ JS/CSS เพื่อให้ GitHub Pages และเบราว์เซอร์โหลดเวอร์ชันใหม่

## Next Steps (TODO)
- [ ] เพิ่ม markdown rendering ใน PiConsole สำหรับ citations จาก OKMD
- [ ] เพิ่ม UI ปุ่ม like/dislike ให้แสดงใน PiConsole
- [ ] เชื่อมต่อ conversation starters เป็นปุ่มเลือกได้ใน console UI
