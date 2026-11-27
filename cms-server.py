"""CMS Server สำหรับ Admin CMS ของ PROINVENTIVE
เสิร์ฟ static files + API บันทึก/เผยแพร่ content.json
"""
import http.server
import json
import os
import subprocess
import sys

PORT = 8131
REPO = os.path.dirname(os.path.abspath(__file__))
CONTENT_FILE = os.path.join(REPO, "content.json")


class CMSHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=REPO, **kw)

    def do_POST(self):
        if self.path == "/api/save":
            self._handle_save()
        elif self.path == "/api/publish":
            self._handle_publish()
        else:
            self.send_error(404)

    def _handle_save(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)
        try:
            data = json.loads(body)
            with open(CONTENT_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                f.write("\n")
            self._json_response({"ok": True, "message": "บันทึก content.json แล้ว"})
        except Exception as e:
            self._json_response({"ok": False, "message": str(e)}, 500)

    def _handle_publish(self):
        try:
            git = lambda *args: subprocess.run(
                ["git"] + list(args),
                cwd=REPO, capture_output=True, text=True, timeout=30
            )
            status = git("status", "--porcelain", "content.json")
            if not status.stdout.strip():
                self._json_response({"ok": True, "message": "ไม่มีการเปลี่ยนแปลง content.json — ไม่ต้อง push", "path": CONTENT_FILE})
                return
            git("add", "content.json")
            result = git("commit", "-m", "อัปเดตเนื้อหา content.json โดย ลุงพี")
            if result.returncode != 0:
                self._json_response({"ok": False, "message": "commit ไม่สำเร็จ: " + result.stderr}, 500)
                return
            push = git("push")
            if push.returncode != 0:
                self._json_response({"ok": False, "message": "push ไม่สำเร็จ: " + push.stderr}, 500)
                return
            self._json_response({"ok": True, "message": "เผยแพร่แล้ว! commit + push สำเร็จ รอ GitHub Pages deploy ~30 วินาที", "path": CONTENT_FILE})
        except Exception as e:
            self._json_response({"ok": False, "message": str(e)}, 500)

    def _json_response(self, data, code=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        sys.stderr.write(f"[CMS] {fmt % args}\n")


if __name__ == "__main__":
    with http.server.HTTPServer(("127.0.0.1", PORT), CMSHandler) as s:
        print(f"CMS Server running at http://127.0.0.1:{PORT}/admin.html")
        s.serve_forever()
