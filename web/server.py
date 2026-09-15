# Servidor estático con Cache-Control: no-store (los módulos ES nunca se cachean)
import http.server, socketserver, os

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

os.chdir(os.path.dirname(os.path.abspath(__file__)))
with socketserver.TCPServer(('0.0.0.0', 8000), Handler) as httpd:
    print('HARMFUL en http://<ip-del-pc>:8000 (no-store, LAN)')
    httpd.serve_forever()
