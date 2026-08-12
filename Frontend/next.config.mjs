const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const s3PublicUrl = process.env.NEXT_PUBLIC_S3_PUBLIC_URL || "";
const isDev = process.env.NODE_ENV !== "production";

// CSP disusun berdasarkan yang beneran dipakai app ini (dicek langsung ke
// source, bukan nebak): gambar upload user (foto profil/CV) disimpan di S3
// storage (domain terpisah dari apiBase), jadi domain itu perlu diizinin di
// img-src -- kalau nggak, browser diem-diem nge-block <img> ke sana lewat
// CSP (gak keliatan errornya kecuali buka console). Gak ada script/style/
// iframe eksternal lain selain Google Identity Services (dipakai buat tombol
// "Lanjutkan dengan Google" -- scriptnya dari accounts.google.com dan
// tombolnya sendiri di-render lewat iframe dari domain yang sama, jadi butuh
// diizinin di script-src & frame-src). Link ke wa.me/instagram/dst semuanya
// cuma <a href> (navigasi keluar, gak kena CSP).
// 'unsafe-inline' buat script & style tetap dibutuhin karena app ini banyak
// pakai inline style={{}} JSX dan Next.js sendiri nyisipin inline script
// buat hydration data. 'unsafe-eval' cuma diizinin pas dev (dibutuhin HMR).
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/client${isDev ? " 'unsafe-eval'" : ""}`,
  `style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style`,
  `img-src 'self' data: blob: ${apiBase}${s3PublicUrl ? ` ${s3PublicUrl}` : ""}`,
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
        // HTML halaman WAJIB divalidasi ulang tiap kunjungan.
        //
        // Bawaannya Next.js mengirim "s-maxage=..." tanpa max-age. s-maxage
        // cuma dipatuhi cache perantara; browser mengabaikannya dan -- karena
        // tidak ada larangan apa pun -- boleh memakai ulang HTML lama sesuka
        // hati. HTML lama menunjuk ke nama berkas JS lama, yang di-cache
        // "immutable" selama setahun. Hasilnya pengguna bisa terus menjalankan
        // kode versi lama tanpa sekali pun menghubungi server, jadi perbaikan
        // yang sudah live tidak pernah sampai ke mereka. Ini benar-benar
        // terjadi: satu pengguna tetap melihat layar error berjam-jam setelah
        // bug-nya diperbaiki, dan log server bersih karena browsernya memang
        // tidak meminta apa-apa.
        //
        // "no-cache" BUKAN berarti tidak disimpan -- browser tetap menyimpan,
        // hanya wajib bertanya dulu. Kalau tidak ada perubahan, jawabannya 304
        // tanpa isi, jadi nyaris tanpa biaya.
        //
        // Sec-Fetch-Dest: document dipakai supaya aturan ini HANYA kena ke
        // navigasi halaman. Berkas di /_next/static/ punya nama ber-hash dan
        // tetap "immutable" -- itu memang aman disimpan lama.
        source: "/:path*",
        has: [{ type: "header", key: "Sec-Fetch-Dest", value: "document" }],
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
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
