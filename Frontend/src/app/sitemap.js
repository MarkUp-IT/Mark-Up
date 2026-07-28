import { SITE_URL } from "@/lib/seo";

// Sitemap statis buat semua halaman publik. Halaman detail produk sengaja
// nggak dimasukin: URL-nya pakai UUID (nggak ramah SEO) dan isinya berubah
// terus, jadi cukup diandalkan crawler nemuin lewat link dari /products.
// Halaman dashboard/checkout/quiz nggak masuk karena butuh login -- percuma
// diindeks, malah bikin Google ngeliat banyak halaman "kosong".
export default function sitemap() {
  const now = new Date();

  const routes = [
    { path: "", priority: 1.0, changeFrequency: "weekly" },
    { path: "/products", priority: 0.9, changeFrequency: "daily" },
    { path: "/mentors", priority: 0.8, changeFrequency: "weekly" },
    { path: "/competitions", priority: 0.8, changeFrequency: "daily" },
    { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.6, changeFrequency: "monthly" },
    { path: "/terms-and-conditions", priority: 0.3, changeFrequency: "yearly" },
    { path: "/refund-policy", priority: 0.3, changeFrequency: "yearly" },
  ];

  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
