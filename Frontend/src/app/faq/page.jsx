"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Search, ChevronDown, Headphones, Mail } from "lucide-react";
import Navbar from "@/component/Navbar";
import Footer from "@/component/Footer";

const categories = [
  "General",
  "Bootcamp",
  "Mentoring",
  "Modul",
  "Pembayaran",
  "Akun",
];

// Konten asli (bukan placeholder) -- disusun supaya nyambung sama fitur yang
// beneran ada di produk (rekaman sesi, sertifikat, halaman Settings, dst).
const faqData = {
  General: [
    {
      q: "Apa itu Mark-Up?",
      a: "Mark-Up adalah platform mentoring dan pelatihan yang membantu pelajar dan mahasiswa mempersiapkan diri menghadapi kompetisi bisnis, studi kasus, debat, dan ajang sejenis. Kami menyediakan tiga jenis layanan utama: Bootcamp intensif berkelompok, Private Mentoring 1-on-1, dan modul E-Learning yang bisa diakses mandiri kapan saja.",
    },
    {
      q: "Apakah sertifikat Mark-Up diakui secara profesional?",
      a: "Sertifikat Mark-Up diterbitkan sebagai bukti partisipasi dan penyelesaian program, ditandatangani atas nama mentor pemateri dan Mark-Up. Sertifikat ini bisa kamu cantumkan di CV, LinkedIn, atau portofolio sebagai bukti pengalaman mengikuti pelatihan intensif. Perlu dicatat, ini bukan gelar atau sertifikasi resmi dari lembaga pendidikan formal, melainkan bukti pengalaman dan kompetensi praktis.",
    },
    {
      q: "Apakah pembayaran di Mark-Up bisa dicicil?",
      a: "Saat ini seluruh pembayaran di Mark-Up dilakukan secara penuh (lunas) melalui payment gateway iPaymu. Sistem cicilan belum tersedia, tapi bisa jadi akan kami hadirkan untuk program Bootcamp bernilai besar di masa mendatang.",
    },
    {
      q: "Bisakah saya melakukan refund jika batal mengikuti kelas?",
      a: "Bisa, dengan syarat dan ketentuan yang berbeda tergantung jenis produk yang kamu beli. Kebijakan lengkapnya, termasuk berapa lama batas waktu pengajuan dan berapa potongan yang berlaku, bisa kamu baca selengkapnya di halaman Refund Policy kami.",
    },
  ],
  Bootcamp: [
    {
      q: "Apa itu program Bootcamp di Mark-Up?",
      a: "Bootcamp adalah program pelatihan intensif berbasis project nyata yang terdiri dari beberapa sesi pertemuan berurutan, dibimbing langsung oleh mentor praktisi. Cocok untuk kamu yang ingin belajar terstruktur dari dasar sampai siap tampil di kompetisi.",
    },
    {
      q: "Berapa lama durasi satu program Bootcamp?",
      a: "Durasi bervariasi tergantung paketnya, umumnya terdiri dari 4-8 sesi yang tersebar dalam beberapa minggu. Detail jumlah sesi dan jadwalnya bisa kamu lihat di halaman detail masing-masing produk sebelum membeli.",
    },
    {
      q: "Apakah saya dapat sertifikat setelah menyelesaikan Bootcamp?",
      a: "Ya. Setelah menyelesaikan seluruh sesi dalam sebuah program Bootcamp, sertifikat akan diterbitkan otomatis dan bisa kamu lihat serta unduh dari halaman Sertifikat di akunmu.",
    },
    {
      q: "Bagaimana jika saya melewatkan salah satu sesi?",
      a: "Tidak masalah -- setiap sesi Bootcamp yang sudah selesai dilaksanakan akan tersedia rekamannya, dan kamu bisa menontonnya kembali kapan saja lewat halaman Produk Saya.",
    },
  ],
  Mentoring: [
    {
      q: "Bagaimana cara memesan sesi Private Mentoring?",
      a: "Pilih paket mentoring yang sesuai kebutuhanmu di halaman Produk, lalu lakukan pembayaran. Setelah itu, jadwal sesi akan dikoordinasikan dengan mentor terkait dan muncul di halaman Produk Saya begitu terjadwal.",
    },
    {
      q: "Berapa lama durasi satu sesi mentoring?",
      a: "Umumnya 60 menit per sesi, meskipun beberapa paket bisa memiliki durasi atau jumlah sesi yang berbeda. Rincian lengkapnya selalu tercantum di halaman detail produk sebelum kamu membeli.",
    },
    {
      q: "Apakah saya bisa memilih mentor tertentu?",
      a: "Beberapa paket mentoring memungkinkanmu memilih mentor sesuai keahliannya -- kamu bisa mengenal lebih jauh profil para mentor kami di halaman Mentors.",
    },
    {
      q: "Bagaimana jika saya perlu mengubah jadwal sesi?",
      a: "Hubungi tim support kami minimal 24 jam sebelum jadwal sesi berlangsung untuk mengatur ulang jadwal. Perubahan yang diajukan terlalu mendekati waktu sesi mungkin tidak bisa selalu diakomodasi.",
    },
  ],
  Modul: [
    {
      q: "Apa itu modul E-Learning Mark-Up?",
      a: "Modul E-Learning adalah materi pembelajaran mandiri (self-paced) berisi kombinasi e-book, video pembahasan, template siap pakai, dan bank soal, yang bisa kamu pelajari sendiri sesuai waktumu tanpa jadwal sesi langsung.",
    },
    {
      q: "Berapa lama akses modul yang saya beli berlaku?",
      a: "Selamanya. Begitu pembelian berhasil, modul akan tersimpan permanen di halaman Produk Saya dan bisa kamu akses ulang kapan pun kamu butuhkan.",
    },
    {
      q: "Format apa saja yang tersedia dalam satu modul?",
      a: "Bervariasi tergantung modulnya, umumnya berupa file PDF, video pembahasan, dan template presentasi/dokumen yang bisa diedit (Canva atau PowerPoint). Rincian isi tiap modul dijelaskan lengkap di halaman produknya.",
    },
  ],
  Pembayaran: [
    {
      q: "Metode pembayaran apa saja yang didukung Mark-Up?",
      a: "Semua transaksi di Mark-Up diproses lewat payment gateway iPaymu, yang mendukung transfer bank (Virtual Account), e-wallet (GoPay, OVO, DANA, ShopeePay), QRIS, hingga kartu kredit/debit.",
    },
    {
      q: "Apakah transaksi di Mark-Up aman?",
      a: "Aman. Seluruh proses pembayaran ditangani oleh iPaymu, penyedia payment gateway berizin yang diawasi oleh Bank Indonesia. Mark-Up tidak pernah menyimpan data kartu atau rekeningmu secara langsung.",
    },
    {
      q: "Bagaimana jika pembayaran saya gagal atau belum terverifikasi?",
      a: 'Cek dulu status transaksi di halaman Transaksi -- kalau masih berstatus "Menunggu Pembayaran" padahal kamu sudah membayar, hubungi tim support kami dengan menyertakan bukti pembayaran agar bisa segera kami tindak lanjuti.',
    },
  ],
  Akun: [
    {
      q: "Bagaimana cara mendaftar akun Mark-Up?",
      a: 'Klik tombol "Daftar" di pojok kanan atas halaman, lalu isi data dirimu. Setelah akun aktif, kamu bisa langsung menjelajahi katalog produk kami.',
    },
    {
      q: "Saya lupa kata sandi, bagaimana cara mengatasinya?",
      a: 'Gunakan opsi "Lupa Kata Sandi" di halaman masuk untuk menerima tautan reset lewat email terdaftarmu. Kalau sudah masuk ke akun, kamu juga bisa mengubah kata sandi kapan saja lewat menu Pengaturan Akun.',
    },
    {
      q: "Bagaimana cara menghapus akun saya?",
      a: 'Masuk ke Pengaturan Akun, lalu buka bagian "Zona Berbahaya" di bagian paling bawah. Perlu diingat, penghapusan akun bersifat permanen dan akan menghilangkan seluruh riwayat produk, sertifikat, dan transaksimu.',
    },
  ],
};

const allFaqs = Object.entries(faqData).flatMap(([category, items]) =>
  items.map((item) => ({ ...item, category })),
);

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState("General");
  const [openIndex, setOpenIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const shouldReduceMotion = useReducedMotion();

  const selectCategory = (cat) => {
    setActiveCategory(cat);
    setSearchQuery("");
    setOpenIndex(0);
  };

  const query = searchQuery.trim().toLowerCase();
  const searchResults = query
    ? allFaqs.filter(
        (item) =>
          item.q.toLowerCase().includes(query) ||
          item.a.toLowerCase().includes(query),
      )
    : null;

  const displayedFaqs = searchResults ?? faqData[activeCategory];

  const sectionReveal = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: shouldReduceMotion ? 0.2 : 0.4 },
    viewport: { once: true },
  };

  return (
    <div className="w-full min-h-screen bg-[#0F081C] font-inter text-white relative overflow-x-hidden">
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[150vw] md:w-[120vw] h-[300px] md:h-[400px] rounded-b-[100%] pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(177, 158, 239, 0.15) 0%, transparent 60%)",
          filter: "blur(40px)",
        }}
      />

      <Navbar />

      <div className="main-content flex flex-col gap-12 md:gap-16 items-center mt-28 md:mt-36 mb-24 relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6">
        {/* Hero */}
        <div className="flex flex-col gap-4 md:gap-6 items-center w-full">
          <div className="bg-[#08C7E1]/10 border border-[#08C7E1]/20 px-4 md:px-5 py-1.5 rounded-full flex justify-center items-center">
            <p className="text-[#08C7E1] font-semibold tracking-wide text-[11px] md:text-[13px]">
              Pertanyaan yang Sering Diajukan
            </p>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-[56px] text-center text-white font-bold font-poppins leading-tight tracking-tight">
            Frequently Asked{" "}
            <span className="text-transparent bg-gradient-to-br bg-clip-text from-[#FF9FFC] to-[#a98fff]">
              Questions
            </span>
          </h1>

          <div className="relative w-full max-w-[600px] mt-2">
            <Search
              size={18}
              className="absolute left-5 top-1/2 -translate-y-1/2 text-[#A19DAB]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Temukan jawaban instan untuk setiap pertanyaanmu seputar layanan kami."
              className="w-full bg-[#1A1625] border border-[#3A3545] rounded-full py-3 pl-12 pr-6 text-sm text-white placeholder-[#A19DAB] outline-none focus:border-[#08C7E1]/50 transition-colors"
            />
          </div>
        </div>

        {/* Kategori + Accordion */}
        <div className="w-full flex flex-col md:flex-row gap-8 md:gap-10">
          {/* Sidebar kategori -- disembunyikan efeknya (tapi tetap kelihatan)
              pas lagi search, karena hasil search nge-gabung semua kategori */}
          <div className="w-full md:w-[200px] shrink-0 flex md:flex-col gap-2 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => selectCategory(cat)}
                className={`shrink-0 text-left px-4 py-3 rounded-md md:rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                  activeCategory === cat && !searchResults
                    ? "bg-[#B19EEF]/15 text-[#B19EEF]"
                    : "text-[#A19DAB] hover:text-white hover:bg-white/5"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Daftar pertanyaan */}
          <div className="flex-1 flex flex-col gap-4">
            {searchResults && (
              <p className="text-[#A19DAB] text-sm mb-1">
                {searchResults.length} hasil untuk &ldquo;{searchQuery}&rdquo;
              </p>
            )}

            {displayedFaqs.length === 0 ? (
              <div className="border border-dashed border-[#3A3545] rounded-md md:rounded-lg py-12 px-6 text-center">
                <p className="text-[#A19DAB] text-sm">
                  Belum ada jawaban yang cocok. Coba kata kunci lain, atau
                  hubungi tim support kami langsung.
                </p>
              </div>
            ) : (
              displayedFaqs.map((item, idx) => {
                const isOpen = searchResults ? true : openIndex === idx;
                return (
                  <motion.div
                    key={`${item.q}-${idx}`}
                    {...sectionReveal}
                    className="rounded-md md:rounded-lg border border-[#B19EEF]/20 bg-gradient-to-br from-[#160C32] to-[#0F0A1F] overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        !searchResults && setOpenIndex(isOpen ? -1 : idx)
                      }
                      className="w-full flex items-center justify-between gap-4 px-5 md:px-7 py-4 md:py-5 text-left"
                    >
                      <div className="flex flex-col gap-1">
                        {searchResults && (
                          <span className="text-[#08C7E1] text-[11px] font-semibold uppercase tracking-wide">
                            {item.category}
                          </span>
                        )}
                        <span className="font-poppins font-bold text-[15px] md:text-[17px] text-white">
                          {item.q}
                        </span>
                      </div>
                      {!searchResults && (
                        <ChevronDown
                          size={20}
                          className={`shrink-0 text-[#A19DAB] transition-transform ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{
                            duration: shouldReduceMotion ? 0 : 0.25,
                          }}
                          className="overflow-hidden"
                        >
                          <p className="px-5 md:px-7 pb-5 md:pb-6 text-[#A19DAB] text-sm leading-relaxed">
                            {item.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* CTA Bantuan */}
        <motion.div
          {...sectionReveal}
          className="w-full rounded-md md:rounded-lg bg-gradient-to-br from-[#160C32] to-[#071526] border border-[#B19EEF]/20 py-14 px-6 flex flex-col items-center text-center gap-4"
        >
          <div className="w-14 h-14 rounded-full bg-[#B19EEF]/10 border border-[#B19EEF]/20 flex items-center justify-center">
            <Headphones size={24} className="text-[#B19EEF]" />
          </div>
          <div>
            <h2 className="font-poppins font-bold text-2xl text-white">
              Masih butuh bantuan?
            </h2>
            <p className="text-[#A19DAB] text-sm mt-2 max-w-[420px]">
              Tim support kami siap membantu kamu melalui WhatsApp atau email.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#E5DFFF] hover:bg-white text-[#530D8E] font-bold text-sm py-3 px-6 rounded-full transition-colors"
            >
              <Headphones size={16} />
              Hubungi Support
            </a>
            <a
              href="mailto:support@markup.id"
              className="flex items-center gap-2 border border-white/20 text-white font-bold text-sm py-3 px-6 rounded-full hover:bg-white/10 transition-colors"
            >
              <Mail size={16} />
              Kirim Email
            </a>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
