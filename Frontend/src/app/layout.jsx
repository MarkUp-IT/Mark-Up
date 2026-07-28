import { Poppins, Plus_Jakarta_Sans, Geist, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import SmoothScrollProvider from "@/component/SmoothScroll";
import { Toaster } from "@/components/ui/sonner";
import { SITE_URL, SITE_KEYWORDS, ORGANIZATION_JSON_LD, WEBSITE_JSON_LD } from "@/lib/seo";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    // %s = judul per halaman. Brand-nya sengaja diulang di belakang tiap judul
    // biar semua varian penulisan ("MarkUp", "Mark-Up", "Mark Up") kebaca
    // Google di tiap halaman, bukan cuma di homepage.
    default: "MarkUp — Wadah Akselerasi Talenta Muda Pencetak Para Juara",
    template: "%s | MarkUp (Mark-Up) Indonesia",
  },
  description:
    "MarkUp (Mark-Up) adalah platform akselerasi talenta muda Indonesia: bootcamp, private mentoring, "
    + "dan modul e-learning untuk membantu mahasiswa menang business case competition, paper competition, "
    + "dan lomba lainnya. Dibimbing mentor berpengalaman, bersertifikat.",
  applicationName: "MarkUp",
  keywords: SITE_KEYWORDS,
  authors: [{ name: "MarkUp", url: SITE_URL }],
  creator: "MarkUp",
  publisher: "MarkUp",
  category: "education",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: SITE_URL,
    siteName: "MarkUp",
    title: "MarkUp — Wadah Akselerasi Talenta Muda Pencetak Para Juara",
    description:
      "Bootcamp, private mentoring, dan modul e-learning buat kamu yang mau menang kompetisi. "
      + "Belajar langsung dari mentor berpengalaman di MarkUp (Mark-Up) Indonesia.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MarkUp — Wadah Akselerasi Talenta Muda Pencetak Para Juara",
    description:
      "Bootcamp, private mentoring, dan modul e-learning buat kamu yang mau menang kompetisi. "
      + "Belajar langsung dari mentor berpengalaman di MarkUp (Mark-Up) Indonesia.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // Isi kodenya setelah daftarin domain di Google Search Console
  // (Setelan > Verifikasi kepemilikan > tag HTML). Tanpa ini tetap keindeks,
  // cuma nggak bisa lihat data pencarian & submit sitemap manual.
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={cn("font-sans", geist.variable)}>
      <body className={`${poppins.variable} ${jakarta.variable} ${inter.variable} antialiased`}>
        {/* JSON-LD: ini yang bikin Google ngerti "MarkUp" itu nama organisasi,
            bukan istilah umum (HTML markup / markup harga). alternateName
            nyantumin semua varian penulisan biar ketiganya nyambung ke entitas
            yang sama. Ditaruh di body sesuai konvensi Next.js App Router --
            crawler baca JSON-LD di mana pun posisinya dalam dokumen. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSON_LD) }}
        />
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
