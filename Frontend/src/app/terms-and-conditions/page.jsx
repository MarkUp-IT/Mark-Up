"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Headphones, Mail } from "lucide-react";
import Navbar from "@/component/navbar";
import Footer from "@/component/Footer";

const sections = [
  {
    title: "Definisi",
    paragraphs: [
      'Mark-Up ("kami", "Perusahaan") adalah platform mentoring dan pelatihan daring yang membantu pelajar dan mahasiswa mempersiapkan diri menghadapi kompetisi bisnis, studi kasus, dan ajang sejenis, melalui layanan Bootcamp, Private Mentoring, dan modul E-Learning.',
      '"Pengguna" adalah setiap pihak yang mengakses atau menggunakan layanan Mark-Up, baik sebagai peserta ("User") maupun pemateri ("Mentor").',
    ],
  },
  {
    title: "Persetujuan Penggunaan",
    intro: "Dengan menggunakan website ini, Anda menyatakan bahwa:",
    bullets: [
      "Berusia minimal 17 tahun, atau telah mendapat persetujuan orang tua/wali jika berusia di bawah itu.",
      "Memberikan informasi yang benar dan akurat saat mendaftar.",
      "Bersedia mematuhi seluruh kebijakan yang berlaku di Mark-Up.",
    ],
  },
  {
    title: "Akun Pengguna",
    intro:
      "Apabila layanan memerlukan akun, maka pengguna bertanggung jawab untuk:",
    bullets: [
      "Menjaga kerahasiaan kata sandi akunnya.",
      "Tidak membagikan akses akun kepada pihak lain.",
      "Bertanggung jawab atas seluruh aktivitas yang terjadi pada akun tersebut.",
    ],
    closing:
      "Mark-Up berhak menonaktifkan akun yang terbukti melanggar ketentuan ini.",
  },
  {
    title: "Penggunaan Layanan",
    intro: "Pengguna setuju untuk tidak:",
    bullets: [
      "Menggunakan layanan untuk kegiatan yang melanggar hukum.",
      "Mengunggah konten yang mengandung unsur SARA, pornografi, kekerasan, atau malware.",
      "Melakukan tindakan yang mengganggu sistem atau keamanan website.",
      "Menyalahgunakan fitur yang tersedia di luar tujuan penggunaannya.",
    ],
  },
  {
    title: "Produk dan Layanan",
    paragraphs: [
      "Kami berupaya memberikan informasi produk dan layanan secara akurat. Namun, kami tidak menjamin bahwa seluruh informasi selalu bebas dari kesalahan penulisan, perubahan harga, atau perubahan spesifikasi. Mark-Up berhak memperbarui, menambah, maupun menghentikan layanan sewaktu-waktu tanpa pemberitahuan sebelumnya.",
    ],
  },
  {
    title: "Harga dan Pembayaran",
    bullets: [
      "Seluruh harga ditampilkan dalam Rupiah (IDR), kecuali dinyatakan lain.",
      "Pembayaran diproses melalui payment gateway resmi iPaymu.",
      "Pesanan dianggap selesai setelah pembayaran berhasil diverifikasi.",
      "Mark-Up berhak membatalkan transaksi apabila ditemukan indikasi penipuan atau pelanggaran hukum.",
    ],
  },
  {
    title: "Pembatalan dan Refund",
    custom: "refund",
  },
  {
    title: "Hak Kekayaan Intelektual",
    intro:
      "Seluruh konten pada website ini, termasuk namun tidak terbatas pada:",
    bullets: [
      "Logo dan nama merek",
      "Desain dan teks",
      "Gambar dan video",
      "Source code",
      "Dokumentasi materi pembelajaran",
    ],
    closing:
      "merupakan milik Mark-Up atau pihak yang memberikan lisensi kepada kami. Pengguna dilarang menyalin, mendistribusikan, atau menggunakan konten tersebut tanpa izin tertulis.",
  },
  {
    title: "Batasan Tanggung Jawab",
    intro: "Mark-Up tidak bertanggung jawab atas:",
    bullets: [
      "Gangguan layanan akibat force majeure.",
      "Kesalahan yang disebabkan oleh kelalaian pengguna.",
      "Kerugian tidak langsung yang timbul akibat penggunaan layanan.",
      "Gangguan dari pihak ketiga di luar kendali Mark-Up.",
    ],
  },
  {
    title: "Tautan ke Website Lain",
    paragraphs: [
      "Website kami dapat memuat tautan menuju website pihak ketiga. Kami tidak bertanggung jawab atas isi maupun kebijakan privasi dari website tersebut.",
    ],
  },
  {
    title: "Privasi",
    custom: "privacy",
  },
  {
    title: "Perubahan Syarat dan Ketentuan",
    paragraphs: [
      "Mark-Up dapat mengubah Syarat dan Ketentuan ini sewaktu-waktu. Perubahan akan mulai berlaku sejak dipublikasikan pada halaman ini. Pengguna disarankan memeriksa halaman ini secara berkala.",
    ],
  },
  {
    title: "Hukum yang Berlaku",
    paragraphs: [
      "Syarat dan Ketentuan ini diatur dan ditafsirkan berdasarkan hukum yang berlaku di Republik Indonesia.",
      "Segala perselisihan akan diselesaikan terlebih dahulu melalui musyawarah. Apabila tidak tercapai kesepakatan, penyelesaian dilakukan sesuai ketentuan hukum Republik Indonesia yang berlaku.",
    ],
  },
];

export default function TermsAndConditionsPage() {
  const shouldReduceMotion = useReducedMotion();

  const sectionReveal = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: shouldReduceMotion ? 0.2 : 0.4 },
    viewport: { once: true, margin: "-80px" },
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

      <div className="main-content flex flex-col gap-12 items-center mt-28 md:mt-36 mb-24 relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6">
        {/* Hero */}
        <div className="flex flex-col gap-4 md:gap-6 items-center w-full">
          <div className="bg-[#08C7E1]/10 border border-[#08C7E1]/20 px-4 md:px-5 py-1.5 rounded-full flex justify-center items-center">
            <p className="text-[#08C7E1] font-semibold tracking-wide text-[11px] md:text-[13px]">
              Terms & Conditions
            </p>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-[56px] text-center text-white font-bold font-poppins leading-tight tracking-tight">
            Terms &{" "}
            <span className="text-transparent bg-gradient-to-br bg-clip-text from-[#FF9FFC] to-[#a98fff]">
              Conditions
            </span>
          </h1>
          <p className="text-[#A19DAB] text-sm">
            Terakhir diperbarui: Januari 2026
          </p>
        </div>

        <div className="w-full flex flex-col md:flex-row gap-8 md:gap-10">
          {/* Sidebar navigasi cepat */}
          <div className="w-full md:w-[220px] shrink-0">
            <div className="md:sticky md:top-28 flex md:flex-col gap-1 overflow-x-auto no-scrollbar">
              {sections.map((s, idx) => (
                <a
                  key={s.title}
                  href={`#section-${idx + 1}`}
                  className="shrink-0 px-4 py-2.5 rounded-md md:rounded-lg text-[13px] text-[#A19DAB] hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap"
                >
                  {idx + 1}. {s.title}
                </a>
              ))}
            </div>
          </div>

          {/* Isi Section */}
          <div className="flex-1 flex flex-col gap-10">
            {sections.map((s, idx) => (
              <motion.div
                key={s.title}
                id={`section-${idx + 1}`}
                {...sectionReveal}
                className="scroll-mt-28 flex flex-col gap-3 pb-8 border-b border-white/5 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4A2CA1] to-[#17A9D4] flex items-center justify-center font-bold text-sm shrink-0">
                    {idx + 1}
                  </div>
                  <h2 className="font-poppins font-bold text-xl md:text-2xl text-white">
                    {s.title}
                  </h2>
                </div>

                <div className="pl-11 flex flex-col gap-3 text-[#A19DAB] text-sm md:text-[15px] leading-relaxed">
                  {s.paragraphs?.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                  {s.intro && <p>{s.intro}</p>}
                  {s.bullets && (
                    <ul className="flex flex-col gap-2 pl-1">
                      {s.bullets.map((b, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-[#B19EEF] shrink-0">
                            &bull;
                          </span>
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                  {s.closing && <p>{s.closing}</p>}

                  {s.custom === "refund" && (
                    <p>
                      Kebijakan pembatalan dan pengembalian dana mengacu pada
                      halaman{" "}
                      <Link
                        href="/refund-policy"
                        className="text-[#08C7E1] hover:underline font-medium"
                      >
                        Refund Policy
                      </Link>{" "}
                      kami, termasuk syarat kelayakan tiap kategori produk dan
                      potongan biaya administrasi yang berlaku.
                    </p>
                  )}

                  {s.custom === "privacy" && (
                    <p>
                      Penggunaan dan perlindungan data pribadi pengguna akan
                      diatur lebih lanjut dalam halaman Privacy Policy kami,
                      yang sedang kami siapkan dan akan segera tersedia. Sampai
                      saat itu, kami hanya menggunakan data yang kamu berikan
                      (nama, email, nomor WhatsApp) untuk keperluan operasional
                      layanan Mark-Up.
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
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
              Tim support kami siap membantu kamu lewat WhatsApp atau email.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
            <a
              href="https://wa.me/62895414588925"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#E5DFFF] hover:bg-white text-[#530D8E] font-bold text-sm py-3 px-6 rounded-full transition-colors"
            >
              <Headphones size={16} />
              Hubungi Support
            </a>
            <a
              href="mailto:markup.ofc@gmail.com"
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
