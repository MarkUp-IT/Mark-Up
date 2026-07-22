const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const isDev = process.env.NODE_ENV !== "production";

// CSP disusun berdasarkan yang beneran dipakai app ini (dicek langsung ke
// source, bukan nebak): semua gambar/font self-hosted (next/font), gak ada
// script/style/iframe eksternal selain Google Identity Services (dipakai
// buat tombol "Lanjutkan dengan Google" -- scriptnya dari accounts.google.com
// dan tombolnya sendiri di-render lewat iframe dari domain yang sama, jadi
// butuh diizinin di script-src & frame-src). Link ke wa.me/instagram/dst
// semuanya cuma <a href> (navigasi keluar, gak kena CSP).
// 'unsafe-inline' buat script & style tetap dibutuhin karena app ini banyak
// pakai inline style={{}} JSX dan Next.js sendiri nyisipin inline script
// buat hydration data. 'unsafe-eval' cuma diizinin pas dev (dibutuhin HMR).
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/client${isDev ? " 'unsafe-eval'" : ""}`,
  `style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style`,
  `img-src 'self' data: blob: ${apiBase}`,
  `font-src 'self' data:`,
  `connect-src 'self' ${apiBase} https://accounts.google.com`,
  `frame-src https://accounts.google.com`,
  `frame-ancestors 'self'`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
