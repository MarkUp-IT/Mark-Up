export const metadata = {
  title: "Info Lomba & Kompetisi Mahasiswa Terbaru",
  description:
    "Kumpulan info lomba dan kompetisi mahasiswa terbaru yang dirangkum MarkUp (Mark-Up): "
    + "business case competition, paper competition, business plan, dan lainnya. "
    + "Lengkap dengan tanggal penting dan tautan pendaftarannya.",
  alternates: { canonical: "/competitions" },
  openGraph: {
    title: "Info Lomba & Kompetisi Mahasiswa Terbaru — MarkUp",
    description:
      "Info business case competition, paper competition, dan lomba mahasiswa lainnya.",
    url: "/competitions",
  },
};

export default function CompetitionsLayout({ children }) {
  return children;
}
