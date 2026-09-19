import { faqData } from "@/lib/faqData";

export const metadata = {
  title: "FAQ — Pertanyaan yang Sering Ditanyakan",
  description:
    "Jawaban lengkap seputar MarkUp (Mark-Up): apa itu bootcamp, cara pesan private mentoring, "
    + "masa berlaku modul e-learning, sertifikat, pembayaran, dan kebijakan refund.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "FAQ MarkUp — Pertanyaan yang Sering Ditanyakan",
    description: "Jawaban seputar bootcamp, mentoring, modul, sertifikat, pembayaran, dan refund.",
    url: "/faq",
  },
};

// Dibangun langsung dari data FAQ yang sama dengan yang tampil di halaman,
// jadi nggak mungkin beda isi. Format FAQPage bikin Google berpeluang
// nampilin pertanyaan-jawaban ini sebagai rich result di hasil pencarian.
const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: Object.values(faqData).flat().map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export default function FaqLayout({ children }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
      {children}
    </>
  );
}
