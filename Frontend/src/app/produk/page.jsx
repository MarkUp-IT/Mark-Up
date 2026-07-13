"use client";

import { useState } from "react";
import Navbar from "@/component/Navbar";
import Footer from "@/component/Footer";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { SearchX, FileText, Check } from "lucide-react";

// --- HELPER ---
// Semua harga disimpan sebagai ANGKA (bukan string "Rp45.000" kayak
// sebelumnya) -- diformat & dihitung diskonnya di komponen, biar mock data
// ini match persis sama tipe kolom `price`/`original_price` (numeric) di
// database, bukan string yang udah diformat duluan.
const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const getDiscountPercent = (price, originalPrice) => {
  if (!originalPrice || originalPrice <= price) return null;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
};

// --- DATA PRODUK ---
const productData = [
  // --- MODUL ---
  // Modul isinya SATU file utama (PDF) + beberapa resource bonus terpisah
  // (masing-masing file sendiri) -- matching product_modul.file_pdf_url +
  // tabel modul_resources yang baru.
  {
    id: 1,
    title: "Masterclass Business Case Competition (BCC)",
    type: "Modul",
    desc: "Panduan komprehensif memecahkan kasus bisnis dari nol, mulai dari problem solving hingga menyusun winning pitch deck untuk kompetisi.",
    price: 45000,
    originalPrice: 125000,
    soldCount: 28,
    image: "",
    mainFile: {
      title: "E-Book Panduan Analisis Kasus (50+ Halaman)",
      fileUrl: "https://example.com/modul/bcc-ebook.pdf",
    },
    resources: [
      {
        title: "10 Winning Pitch Deck Finalis Nasional & Internasional",
        fileUrl: "https://example.com/modul/bcc-pitchdecks.zip",
      },
      {
        title: "5 Template Presentasi Kasus Editable (Canva & PPT)",
        fileUrl: "https://example.com/modul/bcc-templates.zip",
      },
      {
        title: "Video Bedah Kasus Eksklusif (45 Menit)",
        fileUrl: "https://example.com/modul/bcc-video.mp4",
      },
    ],
    chapters: [
      "Cara melakukan Root Cause Analysis (MECE, Issue Tree)",
      "Pemilihan framework yang tepat (SWOT, Porter's 5 Forces, 4P, dll)",
      "Menyusun strategi solusi dan rencana implementasi (Timeline & Budgeting)",
      "Teknik Storytelling & Visualisasi Data untuk Pitch Deck yang meyakinkan juri",
    ],
    link: "https://docs.google.com/forms/d/e/1FAIpQLSfS5xo7AMuG2dDb417P_BoSuIQq6YUURagvopwxB5CDvwVhJQ/viewform",
  },

  // --- MENTORING ---
  // sessionCount matching product_mentoring.session_count yang baru
  {
    id: 7,
    title: "101 Career Mentoring",
    type: "Mentoring",
    desc: "Untuk kamu yang ingin serius membangun karier di bidang marketing, mulai dari personal branding sampai optimasi LinkedIn & CV.",
    price: 110000,
    originalPrice: null,
    soldCount: 12,
    sessionCount: 1,
    image: "/images/101.png",
    highlights: [
      "1 sesi mentoring (60 menit) bersama mentor expert di bidang Marketing",
      "Free Template CV ATS",
      "Dapat modul eksklusif & template portofolio",
      "CV Review Gratis",
      "Akses komunitas dengan 100+ peserta aktif",
      "LinkedIn Mutual Network Access",
    ],
    link: "https://docs.google.com/forms/d/e/1FAIpQLSff6RdE3NsuXviLtgQ9KdGCTmmpsBi0fWYFpJpseA7hp1mZaw/viewform",
  },
  {
    id: 8,
    title: "Essential Sprint Registration",
    type: "Mentoring",
    desc: "Untuk tim yang sudah mendaftar lomba, butuh pendampingan strategis dalam waktu terbatas.",
    price: 150000,
    originalPrice: null,
    soldCount: 5,
    sessionCount: 2,
    image: "/images/ess.png",
    highlights: [
      "2 sesi mentoring (60 menit/sesi)",
      "Bonus 1 sesi jika tim lolos ke final",
      "Gratis tanya-tanya via WhatsApp",
      "Sesi 1: Bedah problem + analisis menggunakan framework",
      "Sesi 2: Review & penyempurnaan solusi",
    ],
    link: "https://docs.google.com/forms/d/1O7ZY9AFJqOz96w63URln-_k70OKiGgGTh8UCweNHyrY/viewform?edit_requested=true",
  },
  {
    id: 9,
    title: "Full-Throttle Coaching",
    type: "Mentoring",
    desc: "Untuk tim yang aktif mengikuti lomba, ingin memastikan solusi matang dan presentasi siap.",
    price: 195000,
    originalPrice: null,
    soldCount: 8,
    sessionCount: 3,
    image: "/images/full.png",
    highlights: [
      "3 sesi mentoring (60 menit/sesi)",
      "Bonus 1 sesi jika tim lolos ke final",
      "Gratis tanya-tanya via WhatsApp",
      "Sesi 1: Bedah problem + analisis menggunakan framework",
      "Sesi 2: Review & penyempurnaan solusi",
      "Sesi 3: Review & latihan pitching",
    ],
    link: "https://docs.google.com/forms/d/e/1FAIpQLSd4UX6iMc8rzftSFrfgZfsgN4M3-d-ZoZMF10gd_hKAOMrXnw/viewform",
  },
  {
    id: 10,
    title: "Bundling PowerPack (Newbie Friendly)",
    type: "Mentoring",
    desc: "Untuk kamu yang baru mulai ikut BCC, ingin belajar dari nol dengan guidance dan tools lengkap.",
    price: 300000,
    originalPrice: null,
    soldCount: 10,
    sessionCount: 3,
    image: "/images/bund.png",
    highlights: [
      "3 sesi mentoring (60 menit/sesi)",
      "Akses 10 deck finalis nasional & 10 framework analisis",
      "Gratis tanya-tanya via WhatsApp",
      "Sesi 1: Menentukan main problem, symptoms, root causes dari kasus",
      "Sesi 2: Pemilihan framework yang tepat sesuai jenis kasus (fit-to-case)",
      "Sesi 3: Menyusun solusi strategis & rencana implementasi yang realistis",
    ],
    link: "https://docs.google.com/forms/d/e/1FAIpQLSfXvHI6DoEGxQgz0pfoX0bnbl34ly1nvdV79v082n0w_XBY1Q/viewform",
  },
  {
    id: 11,
    title: "BPC Kickstart (Individual)",
    type: "Mentoring",
    desc: "Mentoring ini bersifat individual, cocok untuk kamu yang baru mulai dan belum punya ide lomba.",
    price: 200000,
    originalPrice: null,
    soldCount: 3,
    sessionCount: 2,
    image: "/images/kick.png",
    highlights: [
      "2 sesi mentoring (60 menit/sesi), bersifat individual (1 orang)",
      "Gratis tanya-tanya via WhatsApp",
      "Sesi 1 — Ideation & Proposal Mapping: menemukan ide solusi yang relevan dan cara menyusun proposal kompetisi",
      "Sesi 2 — Pitching & QnA Preparation: menyusun pitch deck dan melatih presentasi ide secara efektif",
    ],
    link: "https://docs.google.com/forms/d/e/1FAIpQLSdCkyZZPBl241VIexN9mM9XbUpgnQetySKPvcsA-zEknxn0HA/viewform",
  },
  {
    id: 12,
    title: "BPC Level-Up (Team Mentoring)",
    type: "Mentoring",
    desc: "Untuk tim yang sudah mendaftar lomba dan memiliki ide dasar, ingin mengasah proposal dan persiapan tampil.",
    price: 250000,
    originalPrice: null,
    soldCount: 7,
    sessionCount: 2,
    image: "/images/level.png",
    highlights: [
      "2 sesi mentoring (60 menit/sesi)",
      "Bonus 1 sesi jika tim lolos ke final",
      "Gratis tanya-tanya via WhatsApp",
      "Sesi 1: Proposal Deep Dive & Strategic Input",
      "Sesi 2: Customized Mentoring (Pitching / Proposal / QnA)",
      "Bonus (gratis, untuk tim yang lolos final): Simulasi Final Presentation & QnA Battle",
    ],
    link: "https://docs.google.com/forms/d/e/1FAIpQLSfS5xo7AMuG2dDb417P_BoSuIQq6YUURagvopwxB5CDvwVhJQ/viewform",
  },
];

const tabs = ["Semua", "Mentoring", "Bootcamp", "Modul"];

const sections = [
  { title: "Private Mentoring", type: "Mentoring", lineStyle: "bg-[#D1D83E]" },
  { title: "Intensive Bootcamp", type: "Bootcamp", lineStyle: "bg-[#00C6D1]" },
  { title: "E-Learning & Modul", type: "Modul", lineStyle: "bg-[#B19EEF]" },
];

// Token card konten, disamakan persis dengan Homepage & Info Lomba: radius
// kecil (6->8px), hover cuma ganti warna border, tanpa transform apapun.
const CARD_BASE =
  "rounded-md md:rounded-lg border border-[#B19EEF]/20 shadow-[0_0_30px_rgba(177,158,239,0.1)] hover:border-[#B19EEF]/50 transition-colors duration-300";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B19EEF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#060010]";

export default function ProdukPage() {
  const [activeTab, setActiveTab] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const shouldReduceMotion = useReducedMotion();

  // Filter Data
  const filteredProducts = productData.filter((p) => {
    const matchTab = activeTab === "Semua" || p.type === activeTab;
    const matchSearch = p.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchTab && matchSearch;
  });

  // Animasi modal dimatikan (fade doang, tanpa scale/geser) kalau user set
  // reduced-motion di OS-nya.
  const modalMotion = shouldReduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { scale: 0.95, y: 20 },
        animate: { scale: 1, y: 0 },
        exit: { scale: 0.95, y: 20 },
      };

  return (
    <div className="w-full font-jakarta text-white bg-[#060010] min-h-screen relative flex flex-col">
      {/* Background Glow -- overflow-hidden di-scope ke wrapper kecil ini
          doang (bukan di root), biar nggak ganggu scroll/sticky halaman. */}
      <div className="absolute inset-x-0 top-0 h-[400px] overflow-hidden pointer-events-none z-0">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[150vw] md:w-[120vw] h-[300px] md:h-[400px] rounded-b-[100%]"
          style={{
            background:
              "radial-gradient(ellipse at top, rgba(177, 158, 239, 0.15) 0%, transparent 60%)",
            filter: "blur(40px)",
          }}
        />
      </div>

      <Navbar />

      <div className="main-content flex flex-col items-center mt-28 md:mt-36 mb-24 relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6">
        {/* HERO SECTION */}
        <div className="hero-section flex flex-col gap-4 md:gap-6 items-center w-full mb-10">
          <div className="bg-[#08C7E1]/10 border border-[#08C7E1]/20 px-4 md:px-5 py-1.5 rounded-full flex justify-center items-center">
            <p className="text-[#08C7E1] font-semibold tracking-wide text-[11px] md:text-[13px]">
              Katalog Produk
            </p>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-[56px] text-center text-white font-bold font-poppins leading-tight tracking-tight">
            Produk{" "}
            <span className="text-transparent bg-gradient-to-br bg-clip-text from-[#FF9FFC] to-[#a98fff]">
              MARK-UP
            </span>
          </h1>
          <p className="w-full max-w-[650px] text-center font-light text-[#A19DAB] text-sm md:text-base leading-relaxed px-2">
            Pilih program bimbingan intensif dan materi eksklusif yang paling
            sesuai dengan kebutuhan persiapan kompetisimu.
          </p>
        </div>

        {/* SEARCH BAR */}
        <div className="w-full max-w-[600px] relative mb-8">
          <svg
            className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-[#A19DAB]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            placeholder="Cari nama bootcamp, modul atau mentoring"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1A1625]/80 border border-[#3A3545] rounded-full py-3 md:py-4 pl-12 pr-6 text-sm text-white placeholder-[#A19DAB] outline-none focus:border-[#B19EEF]/50 transition-colors"
          />
        </div>

        {/* CATEGORY FILTERS */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-10 w-full max-w-[800px]">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-xs md:text-sm font-semibold transition-colors duration-300 ${focusRing} ${
                activeTab === tab
                  ? "bg-[#530D8E] text-white"
                  : "bg-[#1A1625] border border-white/5 text-[#A19DAB] hover:bg-[#2A2438] hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* COUNTER */}
        <div className="w-full max-w-[1050px] flex justify-start mb-6">
          <p className="text-[#A19DAB] text-[11px] md:text-sm">
            Menampilkan{" "}
            <span className="text-[#00C6D1] font-bold text-sm md:text-base">
              {filteredProducts.length}
            </span>{" "}
            produk
          </p>
        </div>

        {/* RENDER GROUP SECTIONS -- atau empty state kalau search sama sekali nggak match apapun */}
        {searchQuery !== "" && filteredProducts.length === 0 ? (
          <div className="w-full max-w-[1050px] flex flex-col items-center justify-center gap-3 text-center py-16 px-6 border border-dashed border-[#3A3545] rounded-md md:rounded-lg bg-[#1A1625]/40">
            <SearchX size={32} className="text-[#A19DAB]" />
            <p className="text-[#A19DAB] text-sm max-w-[320px]">
              Produk dengan kata kunci &quot;{searchQuery}&quot; tidak
              ditemukan.
            </p>
          </div>
        ) : (
          <div className="w-full max-w-[1050px] flex flex-col gap-14">
            {sections.map((section) => {
              const sectionProducts = filteredProducts.filter(
                (p) => p.type === section.type,
              );

              // Sembunyikan section kalau lagi filter tab ke kategori lain
              if (activeTab !== "Semua" && activeTab !== section.type)
                return null;

              return (
                <div key={section.type} className="flex flex-col w-full">
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className={`w-[3px] md:w-1 h-5 md:h-6 rounded-full ${section.lineStyle}`}
                    ></div>
                    <h2 className="font-poppins font-bold text-xl md:text-2xl text-white tracking-wide">
                      {section.title}
                    </h2>
                  </div>

                  <div className="w-full">
                    <AnimatePresence>
                      {sectionProducts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 w-full">
                          {sectionProducts.map((product) => (
                            <ProductCard
                              key={product.id}
                              data={product}
                              onClick={() => setSelectedProduct(product)}
                              reduceMotion={shouldReduceMotion}
                            />
                          ))}
                        </div>
                      ) : (
                        // Kategori ini belum ada produknya sama sekali (bukan hasil search)
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="w-full text-left py-2"
                        >
                          <p className="text-[#A19DAB] text-sm md:text-base italic">
                            Layanan {section.title} sedang disiapkan oleh tim
                            expert kami. Segera hadir!
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />

      {/* MODAL POPUP PRODUK */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div
              {...modalMotion}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1A1625] w-full max-w-[850px] max-h-[90vh] rounded-md md:rounded-lg border border-white/10 overflow-hidden flex flex-col md:flex-row shadow-2xl relative"
            >
              {/* Tombol Close */}
              <button
                onClick={() => setSelectedProduct(null)}
                aria-label="Tutup"
                className={`absolute top-4 right-4 z-20 w-8 h-8 bg-black/50 hover:bg-black rounded-full flex items-center justify-center text-white transition-colors ${focusRing}`}
              >
                ✕
              </button>

              {/* Kiri: Gambar Modal */}
              <div className="w-full md:w-[45%] h-[200px] md:h-auto relative shrink-0">
                {selectedProduct.image ? (
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#4A2CA1] to-[#17A9D4] flex items-center justify-center p-6 text-center">
                    <h2 className="font-poppins font-bold text-2xl md:text-3xl text-white drop-shadow-md">
                      {selectedProduct.title}
                    </h2>
                  </div>
                )}
              </div>

              {/* Kanan: Detail Info */}
              <div className="w-full md:w-[55%] p-6 md:p-8 flex flex-col max-h-[60vh] md:max-h-[90vh]">
                <div className="bg-[#530D8E] px-3 py-1 rounded-md self-start mb-3">
                  <p className="text-[10px] font-bold text-white tracking-wider">
                    {selectedProduct.type}
                  </p>
                </div>

                <h2 className="font-poppins font-bold text-2xl text-white leading-tight mb-2">
                  {selectedProduct.title}
                </h2>

                <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                  <p className="font-poppins font-bold text-3xl text-[#08C7E1]">
                    {formatRupiah(selectedProduct.price)}
                  </p>
                  {selectedProduct.originalPrice > selectedProduct.price && (
                    <>
                      <p className="text-gray-500 text-sm line-through decoration-gray-500">
                        {formatRupiah(selectedProduct.originalPrice)}
                      </p>
                      <p className="text-[#FF8A93] text-xs font-bold">
                        -
                        {getDiscountPercent(
                          selectedProduct.price,
                          selectedProduct.originalPrice,
                        )}
                        %
                      </p>
                    </>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar text-sm text-gray-300 leading-relaxed mb-6">
                  <p className="mb-4">{selectedProduct.desc}</p>

                  {/* --- MODUL: file utama + bundle resource, masing-masing
                      punya link download sendiri (bukan 1 blok teks) --- */}
                  {selectedProduct.type === "Modul" && (
                    <>
                      <p className="text-white font-semibold text-xs uppercase tracking-wide mb-2">
                        Isi Bundle (
                        {1 + (selectedProduct.resources?.length || 0)} File)
                      </p>
                      <ul className="flex flex-col gap-2 mb-5">
                        <li className="flex items-center gap-2 text-gray-300">
                          <FileText
                            size={14}
                            className="text-[#08C7E1] shrink-0"
                          />
                          {selectedProduct.mainFile.title}
                          <span className="text-[10px] text-[#08C7E1] font-semibold ml-auto shrink-0">
                            Materi Utama
                          </span>
                        </li>
                        {selectedProduct.resources.map((res, idx) => (
                          <li
                            key={idx}
                            className="flex items-center gap-2 text-gray-300"
                          >
                            <FileText
                              size={14}
                              className="text-[#B19EEF] shrink-0"
                            />
                            {res.title}
                          </li>
                        ))}
                      </ul>

                      {selectedProduct.chapters && (
                        <>
                          <p className="text-white font-semibold text-xs uppercase tracking-wide mb-2">
                            Cakupan Materi
                          </p>
                          <ol className="flex flex-col gap-2">
                            {selectedProduct.chapters.map((chapter, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2 text-gray-300"
                              >
                                <span className="text-[#B19EEF] font-bold shrink-0">
                                  {idx + 1}.
                                </span>
                                {chapter}
                              </li>
                            ))}
                          </ol>
                        </>
                      )}
                    </>
                  )}

                  {/* --- MENTORING: highlight per poin, jumlah sesi kelihatan
                      jelas di judul section --- */}
                  {selectedProduct.type === "Mentoring" &&
                    selectedProduct.highlights && (
                      <>
                        <p className="text-white font-semibold text-xs uppercase tracking-wide mb-2">
                          {selectedProduct.sessionCount}x Sesi Mentoring &mdash;
                          Yang Kamu Dapatkan
                        </p>
                        <ul className="flex flex-col gap-2">
                          {selectedProduct.highlights.map((point, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-gray-300"
                            >
                              <Check
                                size={14}
                                className="text-[#D1D83E] shrink-0 mt-0.5"
                              />
                              {point}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                </div>

                <Link
                  href={`/checkout/${selectedProduct.id}`}
                  className={`w-full bg-[#E5DFFF] hover:bg-white text-[#530D8E] font-bold py-3 rounded-full transition-colors mt-auto text-center shrink-0 ${focusRing}`}
                >
                  Beli Sekarang
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(177, 158, 239, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(177, 158, 239, 0.8);
        }
      `,
        }}
      />
    </div>
  );
}

// --- KOMPONEN PRODUCT CARD ---
function ProductCard({ data, onClick, reduceMotion }) {
  let tagStyle = "";
  let priceColor = "";

  if (data.type === "Bootcamp") {
    tagStyle = "bg-[#0A4A5C] text-[#00C6D1]";
    priceColor = "text-[#00C6D1]";
  } else if (data.type === "Modul") {
    tagStyle = "bg-[#3B0E76] text-[#B19EEF]";
    priceColor = "text-[#B19EEF]";
  } else if (data.type === "Mentoring") {
    tagStyle = "bg-[#3A3610] text-[#D1D83E]";
    priceColor = "text-[#D1D83E]";
  }

  const discountPercent = getDiscountPercent(data.price, data.originalPrice);
  const fileCount =
    data.type === "Modul" ? 1 + (data.resources?.length || 0) : null;

  const entranceMotion = reduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2 },
      }
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, scale: 0.9 },
        transition: { duration: 0.3 },
      };

  return (
    <motion.div
      layout
      {...entranceMotion}
      onClick={onClick}
      className={`bg-[#120822] overflow-hidden cursor-pointer flex flex-col group ${CARD_BASE}`}
    >
      <div className="relative h-[140px] md:h-[160px] bg-gray-900 overflow-hidden shrink-0">
        {data.image ? (
          <img
            src={data.image}
            alt={data.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#4A2CA1] to-[#17A9D4] flex items-center justify-center p-4">
            <h2 className="text-white font-poppins font-bold text-center text-lg drop-shadow-md">
              {data.title}
            </h2>
          </div>
        )}

        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
          <div className={`${tagStyle} px-3 py-1 rounded-md shadow-lg`}>
            <p className="text-[9px] md:text-[10px] font-bold tracking-wider">
              {data.type}
            </p>
          </div>
          {discountPercent && (
            <div className="bg-[#FF6B6B]/20 px-3 py-1 rounded-md border border-[#FF6B6B]/30 shadow-lg">
              <p className="text-[9px] md:text-[10px] font-bold text-[#FF8A93] tracking-wider">
                -{discountPercent}%
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="p-5 md:p-6 flex flex-col flex-1 bg-[#120822] relative z-10">
        <h3 className="font-poppins font-bold text-lg md:text-xl text-white mb-2 leading-tight line-clamp-2 min-h-[28px] md:min-h-[32px]">
          {data.title}
        </h3>

        <p className="text-gray-400 text-xs leading-relaxed line-clamp-3 mb-3">
          {data.desc}
        </p>

        {/* Indikator jumlah file (Modul) atau jumlah sesi (Mentoring) --
            biar jelas dari katalog doang, sebelum buka modal */}
        {fileCount && (
          <p className="flex items-center gap-1.5 text-[#B19EEF] text-[10px] font-semibold mb-4">
            <FileText size={12} />
            {fileCount} File dalam Bundle
          </p>
        )}
        {data.type === "Mentoring" && data.sessionCount && (
          <p className="text-[#D1D83E] text-[10px] font-semibold mb-4">
            {data.sessionCount}x Sesi Mentoring
          </p>
        )}

        <div className="mt-auto flex flex-col items-end">
          {data.originalPrice > data.price && (
            <p className="text-gray-500 text-[10px] md:text-xs line-through decoration-gray-500 mb-0.5">
              {formatRupiah(data.originalPrice)}
            </p>
          )}
          <p
            className={`font-poppins font-bold text-2xl md:text-3xl ${priceColor} mb-1`}
          >
            {formatRupiah(data.price)}
          </p>
          {data.soldCount > 0 && (
            <p className="text-gray-500 text-[9px] md:text-[10px]">
              {data.soldCount} Terjual
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
