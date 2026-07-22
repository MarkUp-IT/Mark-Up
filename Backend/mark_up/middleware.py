class SecurityHeadersMiddleware:
    """Tambahan response header yang belum dicover Django SecurityMiddleware
    bawaan (X-Content-Type-Options, X-Frame-Options, HSTS itu udah otomatis
    dari SecurityMiddleware/XFrameOptionsMiddleware). Ini API JSON, bukan
    dokumen HTML, jadi CSP/COEP sengaja nggak ditambahin di sini -- gak ada
    nilai keamanan nyata buat respons JSON/media, dan COEP malah berisiko
    ganggu loading gambar cross-origin dari frontend."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response.setdefault("X-Permitted-Cross-Domain-Policies", "none")
        response.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()")
        response.setdefault("Cross-Origin-Resource-Policy", "cross-origin")
        return response
