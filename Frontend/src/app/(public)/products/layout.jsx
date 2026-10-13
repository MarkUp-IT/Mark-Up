// Halaman produk itu "use client" (butuh state filter/fetch), padahal Next.js
// cuma ngebolehin export metadata dari server component. Solusinya: layout
// tipis kayak gini yang cuma ngurusin metadata, isi halamannya tetap client.
export const metadata = {
  title: "Program & Kelas — Bootcamp, Mentoring, Modul",
  description:
    "Jelajahi semua program MarkUp (Mark-Up): bootcamp intensif, private mentoring bareng mentor "
    + "berpengalaman, dan modul e-learning. Disiapkan untuk kamu yang ingin memenangkan business case "
    + "competition, paper competition, dan lomba mahasiswa lainnya.",
  alternates: { canonical: "/products" },
  openGraph: {
    title: "Program & Kelas MarkUp — Bootcamp, Mentoring, Modul",
    description:
      "Bootcamp, private mentoring, dan modul e-learning untuk persiapan kompetisi mahasiswa.",
    url: "/products",
  },
};

export default function ProductsLayout({ children }) {
  return children;
}
