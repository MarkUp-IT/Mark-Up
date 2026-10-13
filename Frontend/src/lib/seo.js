// Sumber tunggal semua data SEO. Ditaruh di satu file biar kalau brand/kontak
// berubah, nggak perlu ngubek-ngubek metadata di belasan halaman.

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mark-up.id";

export const SITE_NAME = "MarkUp";

// Semua varian penulisan brand. Ini penting: orang nyari dengan tulisan
// berbeda-beda ("markup", "mark up", "mark-up"), dan Google memperlakukan
// ketiganya sebagai query yang beda. Ketiganya harus muncul di konten.
export const BRAND_VARIANTS = ["MarkUp", "Mark-Up", "Mark Up", "markup"];

export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/markup_official/",
  linkedin: "https://www.linkedin.com/company/markupcom/",
  whatsapp: "https://wa.me/62895414588925",
  email: "markup.ofc@gmail.com",
};

// Keyword disusun berlapis: varian brand dulu (paling realistis buat menang),
// baru kata kunci kategori & turunannya. Google modern nggak pakai meta
// keywords buat ranking, tapi field ini tetap diisi karena beberapa mesin
// pencari lain & scraper internal masih baca -- yang beneran ngefek ke ranking
// adalah keyword yang sama muncul di title, description, heading, dan isi.
export const SITE_KEYWORDS = [
  // Brand + varian penulisan
  "MarkUp", "Mark-Up", "Mark Up", "markup", "markup id", "mark-up.id",
  "MarkUp Indonesia", "Mark-Up Indonesia", "markup official", "markup ofc",
  "MarkUp bootcamp", "Mark-Up bootcamp", "markup mentoring",
  "website markup", "platform markup",

  // Kategori inti
  "bootcamp bisnis", "bootcamp mahasiswa", "bootcamp kompetisi",
  "private mentoring", "mentoring mahasiswa", "mentoring kompetisi",
  "modul e-learning", "kelas online mahasiswa", "pelatihan online mahasiswa",

  // Kompetisi (ini yang paling dicari audiensnya)
  "business case competition", "BCC", "lomba business case",
  "paper competition", "lomba paper", "lomba karya tulis ilmiah",
  "business plan competition", "lomba bisnis mahasiswa",
  "persiapan lomba mahasiswa", "tips menang lomba", "cara menang lomba",
  "latihan business case", "belajar business case",

  // Intent / manfaat
  "akselerasi talenta muda", "pengembangan diri mahasiswa",
  "sertifikat kompetisi", "portofolio mahasiswa", "mentor berpengalaman",
  "bimbingan lomba", "kelas persiapan kompetisi",
];

// --- Structured data (JSON-LD) ---
// Tujuan utamanya: ngasih tau Google bahwa "MarkUp" di sini adalah nama
// organisasi pendidikan, supaya nggak ketuker sama arti umum kata "markup"
// (HTML markup / markup harga). alternateName mendaftarkan semua varian
// penulisan ke entitas yang sama.

export const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  alternateName: BRAND_VARIANTS,
  url: SITE_URL,
  logo: `${SITE_URL}/images/logo-markup.svg`,
  image: `${SITE_URL}/images/logo-markup.svg`,
  description:
    "MarkUp (Mark-Up) adalah platform akselerasi talenta muda Indonesia yang menyediakan bootcamp, "
    + "private mentoring, dan modul e-learning untuk membantu mahasiswa memenangkan kompetisi.",
  email: SOCIAL_LINKS.email,
  address: {
    "@type": "PostalAddress",
    addressCountry: "ID",
  },
  areaServed: {
    "@type": "Country",
    name: "Indonesia",
  },
  sameAs: [
    SOCIAL_LINKS.instagram,
    SOCIAL_LINKS.linkedin,
  ],
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: SOCIAL_LINKS.email,
      availableLanguage: ["id", "en"],
    },
  ],
};

export const WEBSITE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  alternateName: BRAND_VARIANTS,
  inLanguage: "id-ID",
  publisher: { "@id": `${SITE_URL}/#organization` },
};
