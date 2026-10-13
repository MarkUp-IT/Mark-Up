import { SITE_URL } from "@/lib/seo";

// Halaman di balik login sengaja di-disallow: isinya cuma kerangka kosong
// buat crawler (datanya baru diambil setelah user login), jadi kalau diindeks
// malah nurunin kualitas rata-rata halaman di mata Google.
export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/user",
          "/mentor",
          "/checkout",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/verify-email",
          "/delete-account",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
