"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Check,
  Ban,
  Headphones,
  Mail,
  GraduationCap,
  Users,
  BookOpen,
} from "lucide-react";
import Navbar from "@/component/Navbar";
import Footer from "@/component/Footer";

const ketentuanUmum = [
  "Permohonan pengembalian dana diajukan paling lambat 48 jam setelah transaksi berhasil.",
  "Dana yang disetujui untuk dikembalikan akan dipotong biaya administrasi sebesar 10% dari total pembayaran.",
  "Pengembalian dana hanya berlaku untuk kategori produk yang memenuhi syarat, lihat rincian per kategori di bawah.",
];

const kebijakanKategori = [
  {
    icon: GraduationCap,
    title: "Bootcamp",
    eligible: true,
    desc: "Dapat direfund selama program belum dimulai, atau baru berjalan maksimal 1 sesi pertemuan. Setelah sesi ke-2 dimulai, pembelian dianggap final.",
  },
  {
    icon: Users,
    title: "Private Mentoring",
    eligible: true,
    desc: "Dapat direfund maksimal 24 jam sebelum jadwal sesi yang sudah ditentukan. Pembatalan mendekati jadwal atau setelah sesi berlangsung tidak dapat direfund.",
  },
  {
    icon: BookOpen,
    title: "E-Learning & Modul",
    eligible: false,
    desc: 'Tidak dapat direfund. Modul bersifat instant delivery, begitu pembayaran berhasil, seluruh materi langsung dan sepenuhnya bisa diakses, sehingga tidak dapat "dikembalikan" seperti produk fisik.',
  },
];

const pengecualian = [
  "Program Bootcamp yang sudah berjalan lebih dari 1 sesi pertemuan.",
  "Sesi Private Mentoring yang sudah dilaksanakan atau dibatalkan kurang dari 24 jam sebelum jadwal.",
  "Paket promo, bundling, atau diskon khusus (Flash Sale) yang secara eksplisit ditandai non-refundable.",
  "Biaya transaksi dari payment gateway (iPaymu) yang sudah terlanjur timbul saat pembayaran.",
];

const prosedur = [
  {
    step: "1",
    title: "Hubungi Support",
    desc: 'Kirim email ke support@markup.id dengan subjek "Refund Request - [No. Transaksi]".',
  },
  {
    step: "2",
    title: "Lampirkan Bukti",
    desc: "Sertakan bukti pembayaran (bisa diunduh dari halaman Transaksi) dan alasan pengajuan refund secara jelas.",
  },
  {
    step: "3",
    title: "Verifikasi Internal",
    desc: "Tim kami akan meninjau status transaksi dan riwayat aktivitasmu untuk memastikan pengajuan memenuhi syarat.",
  },
];

export default function RefundPolicyPage() {
  const shouldReduceMotion = useReducedMotion();

  const sectionReveal = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: shouldReduceMotion ? 0.2 : 0.4 },
    viewport: { once: true },
  };

  const itemReveal = (index) => ({
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: {
      duration: shouldReduceMotion ? 0.2 : 0.4,
      delay: shouldReduceMotion ? 0 : index * 0.06,
    },
    viewport: { once: true },
  });

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

      <div className="main-content flex flex-col gap-16 md:gap-20 items-center mt-28 md:mt-36 mb-24 relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6">
        {/* Hero */}
        <div className="flex flex-col gap-4 md:gap-6 items-center w-full">
          <div className="bg-[#08C7E1]/10 border border-[#08C7E1]/20 px-4 md:px-5 py-1.5 rounded-full flex justify-center items-center">
            <p className="text-[#08C7E1] font-semibold tracking-wide text-[11px] md:text-[13px]">
              Kebijakan Pengembalian Dana
            </p>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-[56px] text-center text-white font-bold font-poppins leading-tight tracking-tight">
            Refund{" "}
            <span className="text-transparent bg-gradient-to-br bg-clip-text from-[#FF9FFC] to-[#a98fff]">
              Policy
            </span>
          </h1>
          <p className="w-full max-w-[650px] text-center font-light text-[#A19DAB] text-sm md:text-base leading-relaxed">
            Kami ingin transaksimu di Mark-Up terasa adil dan transparan.
            Berikut syarat, prosedur, dan batasan pengembalian dana yang berlaku
            untuk setiap produk.
          </p>
        </div>

        {/* Ketentuan Umum */}
        <motion.div
          {...sectionReveal}
          className="w-full rounded-md md:rounded-lg bg-gradient-to-br from-[#160C32] to-[#071526] border border-[#B19EEF]/20 p-6 md:p-10 flex flex-col gap-6"
        >
          <div className="flex flex-col gap-2">
            <h2 className="font-poppins font-bold text-2xl md:text-3xl">
              Ketentuan{" "}
              <span className="text-transparent bg-gradient-to-br bg-clip-text from-[#B19EEF] to-[#a98fff]">
                Umum
              </span>
            </h2>
            <p className="text-[#A19DAB] text-sm">
              Pengembalian dana hanya berlaku untuk program berbayar tertentu,
              dengan syarat dan ketentuan sebagai berikut.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {ketentuanUmum.map((text, idx) => (
              <motion.div
                key={idx}
                {...itemReveal(idx)}
                className="flex items-center gap-4 rounded-md md:rounded-lg bg-gradient-to-r from-[#3B0E76]/50 to-[#0A4A5C]/50 border border-[#B19EEF]/10 px-5 py-4"
              >
                <div className="w-6 h-6 rounded-full bg-[#08C7E1]/20 border border-[#08C7E1]/40 flex items-center justify-center shrink-0">
                  <Check size={14} className="text-[#08C7E1]" />
                </div>
                <p className="text-sm md:text-[15px] text-white">{text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Kebijakan Per Kategori */}
        <div className="w-full flex flex-col gap-6">
          <motion.div {...sectionReveal} className="flex flex-col gap-2">
            <h2 className="font-poppins font-bold text-2xl md:text-3xl">
              Kebijakan per{" "}
              <span className="text-transparent bg-gradient-to-br bg-clip-text from-[#FF9FFC] to-[#a98fff]">
                Kategori Produk
              </span>
            </h2>
            <p className="text-[#A19DAB] text-sm">
              Kelayakan refund berbeda tergantung jenis produk yang kamu beli.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
            {kebijakanKategori.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  {...itemReveal(idx)}
                  className={`rounded-md md:rounded-lg border p-6 flex flex-col gap-4 ${
                    item.eligible
                      ? "border-[#B19EEF]/20 bg-gradient-to-br from-[#3B0E76] to-[#1A0A3A]"
                      : "border-[#EF4444]/20 bg-gradient-to-br from-[#3B0E1A] to-[#1A0A0A]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-lg bg-white/10 flex items-center justify-center">
                      <Icon size={20} className="text-white" />
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-md ${
                        item.eligible
                          ? "bg-[#148F89]/15 text-[#08C7E1]"
                          : "bg-[#EF4444]/15 text-[#FF8A93]"
                      }`}
                    >
                      {item.eligible ? "Bisa Direfund" : "Tidak Bisa Direfund"}
                    </span>
                  </div>
                  <h3 className="font-poppins font-bold text-lg text-white">
                    {item.title}
                  </h3>
                  <p className="text-[#A19DAB] text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Prosedur + Estimasi/Pengecualian */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-8 lg:gap-10">
          {/* Prosedur Pengajuan */}
          <motion.div {...sectionReveal} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h2 className="font-poppins font-bold text-2xl md:text-3xl">
                Prosedur{" "}
                <span className="text-transparent bg-gradient-to-br bg-clip-text from-[#B19EEF] to-[#a98fff]">
                  Pengajuan
                </span>
              </h2>
              <p className="text-[#A19DAB] text-sm">
                Ikuti langkah-langkah berikut untuk memproses pengembalian dana.
              </p>
            </div>

            <div className="flex flex-col gap-5">
              {prosedur.map((item, idx) => (
                <motion.div
                  key={item.step}
                  {...itemReveal(idx)}
                  className="flex items-start gap-4"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4A2CA1] to-[#17A9D4] flex items-center justify-center font-bold text-sm shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-poppins font-bold text-base text-white">
                      {item.title}
                    </h3>
                    <p className="text-[#A19DAB] text-sm mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Estimasi + Pengecualian */}
          <div className="flex flex-col gap-6">
            <motion.div
              {...sectionReveal}
              className="rounded-md md:rounded-lg bg-gradient-to-br from-[#160C32] to-[#0B1B3A] border border-[#B19EEF]/20 p-6 md:p-8 flex flex-col gap-2"
            >
              <h3 className="font-poppins font-bold text-lg text-white">
                Estimasi Waktu{" "}
                <span className="text-transparent bg-gradient-to-br bg-clip-text from-[#B19EEF] to-[#a98fff]">
                  Refund
                </span>
              </h3>
              <p className="text-[#A19DAB] text-xs uppercase tracking-wide">
                Setelah permohonan disetujui, proses pengembalian dana akan
                memakan waktu:
              </p>
              <p className="font-poppins font-bold text-5xl md:text-6xl mt-2">
                1&ndash;14{" "}
                <span className="text-lg md:text-xl font-bold text-[#A19DAB] align-middle">
                  hari kerja
                </span>
              </p>
            </motion.div>

            <motion.div
              {...sectionReveal}
              className="rounded-md md:rounded-lg bg-[#2A0A0A] border border-[#EF4444]/30 p-6 md:p-8 flex flex-col gap-3"
            >
              <div className="flex items-center gap-2">
                <Ban size={18} className="text-[#FF8A93]" />
                <h3 className="font-poppins font-bold text-base text-[#FF8A93]">
                  Pengecualian (Non-Refundable)
                </h3>
              </div>
              <ul className="flex flex-col gap-2">
                {pengecualian.map((text, idx) => (
                  <li
                    key={idx}
                    className="text-[#E8B4B8] text-[13px] leading-relaxed flex gap-2"
                  >
                    <span className="shrink-0">&bull;</span>
                    {text}
                  </li>
                ))}
              </ul>
            </motion.div>
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
              Tim support kami siap membantu proses pengajuan refund-mu lewat
              WhatsApp atau email.
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
          <p className="text-[#6B6577] text-xs mt-2">
            Punya pertanyaan lain? Cek juga halaman{" "}
            <Link href="/faq" className="text-[#08C7E1] hover:underline">
              FAQ
            </Link>{" "}
            kami.
          </p>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
