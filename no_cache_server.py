import http.server
import socketserver
import sys

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8099
directory = sys.argv[2] if len(sys.argv) > 2 else "."


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=directory, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


with socketserver.TCPServer(("", port), NoCacheHandler) as httpd:
    print(f"serving {directory} on port {port} with caching disabled")
    httpd.serve_forever()
