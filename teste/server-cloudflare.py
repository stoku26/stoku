# Server statik si GitHub Pages + Cloudflare: i shton çdo përgjigjeje header-at e Transform Rule-it "siguria".
# CSP-ja merret nga rreshti CSP_CLOUDFLARE te SHENIME.md (i njëjti që e ka Cloudflare). Përdorimi: python3 server-cloudflare.py PORTI DOSJA
import http.server, sys, os, re, functools
port, d = int(sys.argv[1]), sys.argv[2]
POL = re.search(r'CSP_CLOUDFLARE: `([^`]+)`', open(os.path.join(d, 'SHENIME.md'), encoding='utf-8').read()).group(1)
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Content-Security-Policy', POL)
        self.send_header('X-Frame-Options', 'SAMEORIGIN')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'same-origin')
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Resource-Policy', 'same-origin')
        self.send_header('Permissions-Policy', 'camera=(self), geolocation=(), microphone=(), payment=(), usb=()')
        super().end_headers()
    def send_error(self, code, message=None, explain=None):
        f404 = os.path.join(self.directory, '404.html')
        if code == 404 and os.path.exists(f404):
            b = open(f404, 'rb').read()
            self.send_response(404); self.send_header('Content-Type', 'text/html; charset=utf-8'); self.send_header('Content-Length', str(len(b)))
            self.end_headers(); self.wfile.write(b); return
        super().send_error(code, message, explain)
    def log_message(self, *a): pass
H.extensions_map['.wasm'] = 'application/wasm'
H.extensions_map['.webmanifest'] = 'application/manifest+json'
http.server.ThreadingHTTPServer(('127.0.0.1', port), functools.partial(H, directory=d)).serve_forever()
