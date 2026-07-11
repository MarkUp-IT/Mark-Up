"use client";

import { useState } from "react";
import Navbar from "@/component/Navbar";
import Footer from "@/component/Footer";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { SearchX } from "lucide-react";

// --- DATA PRODUK ---
const productData = [
  // --- MODUL (DATA DUMMY BARU) ---
  {
    id: 1,
    title: "Masterclass Business Case Competition (BCC)",
    type: "Modul",
    desc: "Panduan komprehensif memecahkan kasus bisnis dari nol, mulai dari problem solving hingga menyusun winning pitch deck untuk kompetisi.",
    oldPrice: "Rp125.000",
    newPrice: "Rp45.000",
    sold: 28,
    discount: "64%",
    image: "", // Biarkan kosong agar pakai background gradient fallback
    fullDesc:
      "📚 E-Book Panduan Analisis Kasus (50+ Halaman)\n🎯 10 Winning Pitch Deck Finalis Nasional & Internasional\n📊 5 Template Presentasi Kasus Editable (Canva & PPT)\n📹 Video Bedah Kasus Eksklusif (45 Menit)\n\n📌 Modul ini dirancang khusus untuk pemula maupun peserta lomba Business Case yang ingin memahami kerangka berpikir sistematis (structured thinking) untuk memecahkan masalah bisnis dengan cepat dan tepat sasaran.\n\nCakupan Materi:\n1. Cara melakukan Root Cause Analysis (MECE, Issue Tree)\n2. Pemilihan framework yang tepat (SWOT, Porter's 5 Forces, 4P, dll)\n3. Menyusun strategi solusi dan rencana implementasi (Timeline & Budgeting)\n4. Teknik Storytelling & Visualisasi Data untuk Pitch Deck yang meyakinkan juri",
    link: "https://docs.google.com/forms/d/e/1FAIpQLSfS5xo7AMuG2dDb417P_BoSuIQq6YUURagvopwxB5CDvwVhJQ/viewform",
  },

  // --- MENTORING (DATA ASLI) ---
  {
    id: 7,
    title: "101 Career Mentoring",
    type: "Mentoring",
    desc: "Untuk kamu yang ingin serius membangun karier di bidang marketing, mulai dari personal branding sampai optimasi LinkedIn & CV.",
    oldPrice: "",
    newPrice: "Rp110.000",
    sold: 12,
    discount: "",
    image: "/images/101.png",
    fullDesc:
      "⏱️ 1 sesi mentoring (60 menit) bersama mentor expert di bidang Marketing\n📄 Free Template CV ATS\n📚 Dapat modul eksklusif & template portofolio\n💬 CV Review Gratis\n👥 Akses komunitas dengan 100+ peserta aktif\n🌐 LinkedIn Mutual Network Access\n\n📌 Untuk kamu yang ingin serius membangun karier di bidang marketing, mulai dari personal branding sampai optimasi LinkedIn & CV — lengkap dengan bimbingan mentor dan tools praktis.",
    link: "https://docs.google.com/forms/d/e/1FAIpQLSff6RdE3NsuXviLtgQ9KdGCTmmpsBi0fWYFpJpseA7hp1mZaw/viewform",
  },
  {
    id: 8,
    title: "Essential Sprint Registration",
    type: "Mentoring",
    desc: "Untuk tim yang sudah mendaftar lomba, butuh pendampingan strategis dalam waktu terbatas.",
    oldPrice: "",
    newPrice: "Rp150.000",
    sold: 5,
    discount: "",
    image: "/images/ess.png",
    fullDesc:
      "💼 2 sesi mentoring (60 menit/sesi)\n🎁 Bonus 1 sesi jika tim lolos ke final\n💬 Gratis tanya-tanya via WhatsApp\n\n📌 Untuk tim yang sudah mendaftar lomba, butuh pendampingan strategis dalam waktu terbatas.\n\nCakupan:\n1. Bedah problem + analisis menggunakan framework\n2. Review & penyempurnaan solusi",
    link: "https://docs.google.com/forms/d/1O7ZY9AFJqOz96w63URln-_k70OKiGgGTh8UCweNHyrY/viewform?edit_requested=true",
  },
  {
    id: 9,
    title: "Full-Throttle Coaching",
    type: "Mentoring",
    desc: "Untuk tim yang aktif mengikuti lomba, ingin memastikan solusi matang dan presentasi siap.",
    oldPrice: "",
    newPrice: "Rp195.000",
    sold: 8,
    discount: "",
    image: "/images/full.png",
    fullDesc:
      "💼 3 sesi mentoring (60 menit/sesi)\n🎁 Bonus 1 sesi jika tim lolos ke final\n💬 Gratis tanya-tanya via WhatsApp\n\n📌 Untuk tim yang aktif mengikuti lomba, ingin memastikan solusi matang dan presentasi siap.\n\nCakupan:\n1. Bedah problem + analisis menggunakan framework\n2. Review & penyempurnaan solusi\n3. Review & latihan pitching",
    link: "https://docs.google.com/forms/d/e/1FAIpQLSd4UX6iMc8rzftSFrfgZfsgN4M3-d-ZoZMF10gd_hKAOMrXnw/viewform",
  },
  {
    id: 10,
    title: "Bundling PowerPack (Newbie Friendly)",
    type: "Mentoring",
    desc: "Untuk kamu yang baru mulai ikut BCC, ingin belajar dari nol dengan guidance dan tools lengkap.",
    oldPrice: "",
    newPrice: "Rp300.000",
    sold: 10,
    discount: "",
    image: "/images/bund.png",
    fullDesc:
      "💼 3 sesi mentoring (60 menit/sesi)\n📚 + Akses 10 deck finalis nasional & 10 framework analisis\n💬 Gratis tanya-tanya via WhatsApp\n\n📌 Untuk kamu yang baru mulai ikut BCC, ingin belajar dari nol dengan guidance dan tools lengkap.\n\nCakupan:\n1. Cara menentukan main problem, symtomps, root causes dari kasus yang diberikan\n2. Pemilihan framework yang tepat sesuai jenis kasus (fit-to-case)\n3. Menyusun solusi yang strategis dan realistis\n4. Rencana implementasi strategi yang realistis\n\nBonus Resource:\n1. 10 deck finalis nasional\n2. 10 framework analisis business case competition",
    link: "https://docs.google.com/forms/d/e/1FAIpQLSfXvHI6DoEGxQgz0pfoX0bnbl34ly1nvdV79v082n0w_XBY1Q/viewform",
  },
  {
    id: 11,
    title: "BPC Kickstart (Individual)",
    type: "Mentoring",
    desc: "Mentoring ini bersifat individual, cocok untuk kamu yang baru mulai dan belum punya ide lomba.",
    oldPrice: "",
    newPrice: "Rp200.000",
    sold: 3,
    discount: "",
    image: "/images/kick.png",
    fullDesc:
      "📚 2 sesi mentoring (60 menit/sesi)\n💬 Gratis tanya-tanya via WhatsApp\n\n📌 Mentoring ini bersifat individual (1 orang), cocok untuk kamu yang baru mulai dan belum punya ide lomba.\n\nCakupan:\n\n1. Ideation & Proposal Mapping\n🔍 Tujuan: Membantu mentee menemukan ide solusi yang relevan dan memahami cara menyusun proposal kompetisi.\n\n2. Pitching & QnA Preparation\n🎤 Tujuan: Membimbing mentee menyusun pitch deck dan melatih presentasi ide secara efektif.",
    link: "https://docs.google.com/forms/d/e/1FAIpQLSdCkyZZPBl241VIexN9mM9XbUpgnQetySKPvcsA-zEknxn0HA/viewform",
  },
  {
    id: 12,
    title: "BPC Level-Up (Team Mentoring)",
    type: "Mentoring",
    desc: "Untuk tim yang sudah mendaftar lomba dan memiliki ide dasar, ingin mengasah proposal dan persiapan tampil.",
    oldPrice: "",
    newPrice: "Rp250.000",
    sold: 7,
    discount: "",
    image: "/images/level.png",
    fullDesc:
      "📚 2 sesi mentoring (60 menit/sesi)\n🎁 Bonus 1 sesi jika tim lolos ke final\n💬 Gratis tanya-tanya via WhatsApp\n\n📌 Untuk tim yang sudah mendaftar lomba dan memiliki ide dasar, ingin mengasah proposal dan persiapan tampil di panggung pitching.\n\nCakupan:\n1. Sesi 1: Proposal Deep Dive & Strategic Input\n2. Sesi 2: Customized Mentoring (Pitching / Proposal / QnA)\n\n🎁 Bonus Mentoring (Free, untuk tim yang lolos ke final):\n🔥 Simulasi Final Presentation & QnA Battle",
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
    <div className="w-full min-h-screen bg-[#0F081C] font-inter text-white relative overflow-x-hidden">
      {/* Background Glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[150vw] md:w-[120vw] h-[300px] md:h-[400px] rounded-b-[100%] pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(177, 158, 239, 0.15) 0%, transparent 60%)",
          filter: "blur(40px)",
        }}
      />

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
                    {selectedProduct.newPrice}
                  </p>
                  {selectedProduct.oldPrice && (
                    <p className="text-gray-500 text-sm line-through decoration-gray-500">
                      {selectedProduct.oldPrice}
                    </p>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar text-sm text-gray-300 leading-relaxed whitespace-pre-wrap mb-6">
                  {selectedProduct.fullDesc || selectedProduct.desc}
                </div>

                <Link
                  href={selectedProduct.link || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
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
          {data.discount && (
            <div className="bg-[#FF6B6B]/20 px-3 py-1 rounded-md border border-[#FF6B6B]/30 shadow-lg">
              <p className="text-[9px] md:text-[10px] font-bold text-[#FF8A93] tracking-wider">
                {data.discount}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="p-5 md:p-6 flex flex-col flex-1 bg-[#120822] relative z-10">
        <h3 className="font-poppins font-bold text-lg md:text-xl text-white mb-2 leading-tight">
          {data.title}
        </h3>

        <p className="text-gray-400 text-xs leading-relaxed line-clamp-3 mb-6">
          {data.desc}
        </p>

        <div className="mt-auto flex flex-col items-end">
          {data.oldPrice && (
            <p className="text-gray-500 text-[10px] md:text-xs line-through decoration-gray-500 mb-0.5">
              {data.oldPrice}
            </p>
          )}
          <p
            className={`font-poppins font-bold text-2xl md:text-3xl ${priceColor} mb-1`}
          >
            {data.newPrice}
          </p>
          {data.sold > 0 && (
            <p className="text-gray-500 text-[9px] md:text-[10px]">
              {data.sold} Terjual
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
