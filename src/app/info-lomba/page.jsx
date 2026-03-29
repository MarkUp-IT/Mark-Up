"use client";

import { useState } from "react";
import Navbar from "@/component/navbar";
import Footer from "@/component/Footer";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link"; // Tambahan import Link

const lombaData = [
  {
    id: 1,
    title: "KOPMAVATION 1.0 Business Plan Competition",
    category: "Business Plan",
    organizer: "Kopma UMY",
    date: "14/06/2026",
    deadline: "31/03/2026",
    fee: "Rp20.000 - Rp25.000",
    prize: "Jutaan Rupiah",
    level: "Nasional",
    target: "Siswa SMA/SMK/MA",
    image: "/images/kopmavation-poster.jpg",
    link: "https://bit.ly/3OYVhAW", // ✅ Link pendaftaran ditambahkan
  },
  {
    id: 2,
    title: "LDBI ASFERA 2k26 (Lomba Debat Bahasa Indonesia)",
    category: "Debat",
    organizer: "As-Syifa Boarding School Wanareja",
    date: "16-17 April 2026",
    deadline: "02/04/2026",
    fee: "Rp250.000",
    prize: "Rp1.500.000 + Piala",
    level: "Nasional",
    target: "Siswa SMA/SMK/MA",
    image: "/images/asfera-debat.jpg",
    link: "https://sprl.me/RegistrasiMCCDreamcareer", // ✅ Link pendaftaran ditambahkan
  },
  {
    id: 3,
    title: "DreamCareer Mini Case Competition",
    category: "Business Case",
    organizer: "DreamCareer",
    date: "15-17 Maret 2026",
    deadline: "17/03/2026",
    fee: "Rp50.000 - Rp75.000",
    prize: "Jutaan Rupiah + Fast-track Magang",
    level: "Nasional",
    target: "Mahasiswa D3/D4/S1",
    image: "/images/dreamcareer-case.jpg",
    link: "https://asferaofficial2026.com", // ✅ Link pendaftaran ditambahkan
  },
];

const categories = [
  "Semua",
  "Business Case",
  "Business Plan",
  "Debat",
  "LKTI",
  "UI/UX",
  "Hackathon",
];

export default function InfoLombaPage() {
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLomba, setSelectedLomba] = useState(null);

  // Filter Logic
  const filteredLomba = lombaData.filter((lomba) => {
    const matchCategory =
      activeCategory === "Semua" || lomba.category === activeCategory;
    const matchSearch = lomba.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="w-full font-jakarta text-white bg-[#060010] min-h-screen relative flex flex-col overflow-x-hidden">
      {/* Background Glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[150vw] md:w-[120vw] h-[300px] md:h-[400px] rounded-b-[100%]"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(177, 158, 239, 0.15) 0%, transparent 60%)",
          filter: "blur(40px)",
          zIndex: 0,
        }}
      />

      <Navbar />

      <div className="main-content flex flex-col items-center mt-28 md:mt-36 mb-24 relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6">
        {/* HERO SECTION */}
        <div className="hero-section flex flex-col gap-4 md:gap-6 items-center w-full mb-12">
          <div className="bg-[#08C7E1]/10 border border-[#08C7E1]/20 px-4 py-1.5 rounded-full flex justify-center items-center">
            <p className="text-[#08C7E1] font-semibold tracking-wide text-[11px] md:text-[13px]">
              Eksplorasi Kompetisi
            </p>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-[56px] text-center text-white font-bold font-poppins leading-tight tracking-tight">
            Temukan{" "}
            <span className="text-transparent bg-gradient-to-br bg-clip-text from-[#FF9FFC] to-[#a98fff]">
              Ajang Impian
            </span>
          </h1>
          <p className="w-full max-w-[600px] text-center font-light text-[#A19DAB] text-sm md:text-base leading-relaxed">
            Daftar kompetisi dan ajang bergengsi pilihan yang membantumu
            melangkah ke level prestasi berikutnya.
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
            placeholder="Cari peluang kemenanganmu di sini"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1A1625] border border-[#3A3545] rounded-full py-3 pl-12 pr-6 text-white placeholder-[#A19DAB] outline-none focus:border-[#08C7E1]/50 transition-colors"
          />
        </div>

        {/* CATEGORY FILTERS */}
        <div className="flex flex-wrap justify-center gap-3 mb-10 w-full max-w-[800px]">
          {categories.map((cat, index) => (
            <button
              key={index}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                activeCategory === cat
                  ? "bg-[#530D8E] text-white"
                  : "bg-[#1A1625] text-[#A19DAB] hover:bg-[#2A2438] hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* COUNTER */}
        <div className="w-full max-w-[1050px] flex justify-start mb-6">
          <p className="text-[#A19DAB] text-sm">
            Menampilkan{" "}
            <span className="text-[#08C7E1] font-bold">
              {filteredLomba.length}
            </span>{" "}
            lomba
          </p>
        </div>

        {/* GRID LOMBA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-[1050px]">
          <AnimatePresence>
            {filteredLomba.map((lomba) => (
              <motion.div
                key={lomba.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                onClick={() => setSelectedLomba(lomba)}
                className="bg-[#100A19] rounded-[24px] border border-white/10 overflow-hidden cursor-pointer hover:border-[#B19EEF]/50 hover:-translate-y-1 transition-all duration-300 flex flex-col group"
              >
                {/* Gambar Thumbnail */}
                <div className="relative w-full h-[220px] bg-gray-800 overflow-hidden">
                  <div className="absolute top-4 left-4 bg-[#530D8E] px-3 py-1 rounded-md z-10 shadow-lg">
                    <p className="text-[10px] font-bold text-white tracking-wider">
                      {lomba.category}
                    </p>
                  </div>
                  {lomba.image ? (
                    <img
                      src={lomba.image}
                      alt={`Poster ${lomba.title}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#4A2CA1] to-[#17A9D4] group-hover:scale-105 transition-transform duration-500"></div>
                  )}
                </div>

                {/* Info Content */}
                <div className="p-6 flex flex-col gap-3">
                  <h3 className="font-poppins font-bold text-xl text-white">
                    {lomba.title}
                  </h3>

                  <div className="flex flex-col gap-2 mt-1">
                    <div className="flex items-center gap-2 text-[#A19DAB] text-xs">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <rect
                          x="3"
                          y="4"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                        ></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      {lomba.date}
                    </div>
                    <div className="flex items-center gap-2 text-[#A19DAB] text-xs">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      {lomba.target}
                    </div>
                  </div>

                  <div className="w-full h-[1px] bg-white/10 my-2"></div>

                  <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                      <p className="text-[10px] text-[#A19DAB] mb-1">
                        Biaya Pendaftaran
                      </p>
                      <p className="text-white font-bold text-sm">
                        {lomba.fee}
                      </p>
                    </div>
                    <div className="flex flex-col text-right">
                      <p className="text-[10px] text-[#A19DAB] mb-1">
                        Total Hadiah
                      </p>
                      <p className="text-[#08C7E1] font-bold text-sm">
                        {lomba.prize}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <Footer />

      {/* MODAL POPUP */}
      <AnimatePresence>
        {selectedLomba && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedLomba(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()} // Mencegah modal ketutup pas isi modal diklik
              className="bg-[#1A1625] w-full max-w-[800px] rounded-[24px] border border-white/10 overflow-hidden flex flex-col md:flex-row shadow-2xl relative"
            >
              {/* Tombol Close */}
              <button
                onClick={() => setSelectedLomba(null)}
                className="absolute top-4 right-4 z-10 w-8 h-8 bg-black/50 hover:bg-black rounded-full flex items-center justify-center text-white transition-colors"
              >
                ✕
              </button>

              {/* Kiri: Gambar Modal */}
              <div className="w-full md:w-[45%] h-[200px] md:h-auto bg-gray-900 relative">
                {selectedLomba.image ? (
                  <img
                    src={selectedLomba.image}
                    alt={`Poster ${selectedLomba.title}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#4A2CA1] to-[#17A9D4]"></div>
                )}
              </div>

              {/* Kanan: Detail Info */}
              <div className="w-full md:w-[55%] p-6 md:p-8 flex flex-col">
                <div className="bg-[#530D8E] px-3 py-1 rounded-md self-start mb-4">
                  <p className="text-[10px] font-bold text-white tracking-wider">
                    {selectedLomba.category}
                  </p>
                </div>

                <h2 className="font-poppins font-bold text-2xl text-white leading-tight mb-2">
                  {selectedLomba.title}
                </h2>
                <p className="text-[#A19DAB] text-xs mb-6">
                  Penyelenggara: {selectedLomba.organizer}
                </p>

                {/* Grid 6 Box Info */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                  <InfoBox
                    title="Pelaksanaan"
                    value={selectedLomba.date}
                    icon={<CalendarIcon />}
                  />
                  <InfoBox
                    title="Tenggat Pendaftaran"
                    value={selectedLomba.deadline}
                    icon={<CalendarIcon />}
                  />
                  <InfoBox
                    title="Biaya"
                    value={selectedLomba.fee}
                    icon={<WalletIcon />}
                  />
                  <InfoBox
                    title="Hadiah"
                    value={selectedLomba.prize}
                    icon={<TrophyIcon />}
                  />
                  <InfoBox
                    title="Tingkat"
                    value={selectedLomba.level}
                    icon={<GlobeIcon />}
                  />
                  <InfoBox
                    title="Peserta"
                    value={selectedLomba.target}
                    icon={<UserIcon />}
                  />
                </div>

                {/* ✅ TOMBOL DAFTAR SEKARANG BERFUNGSI SEBAGAI LINK */}
                <Link
                  href={selectedLomba.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#E5DFFF] hover:bg-white text-[#530D8E] font-bold py-3 rounded-xl transition-colors mt-auto text-center"
                >
                  Daftar Sekarang
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- KOMPONEN BANTUAN UNTUK BOX INFO DI MODAL ---
function InfoBox({ title, value, icon }) {
  return (
    <div className="bg-[#2A2438]/50 border border-white/5 rounded-xl p-3 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-[#A19DAB] text-[10px]">
        {icon}
        {title}
      </div>
      <p className="text-white font-semibold text-xs truncate" title={value}>
        {value}
      </p>
    </div>
  );
}

// --- ICON SVG ---
function CalendarIcon() {
  return (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  );
}
function WalletIcon() {
  return (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <rect x="2" y="5" width="20" height="14" rx="2"></rect>
      <line x1="2" y1="10" x2="22" y2="10"></line>
    </svg>
  );
}
function TrophyIcon() {
  return (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M5 3v4M19 3v4M5 11h14M12 11v8m-7 0h14"
      />
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
  );
}
function UserIcon() {
  return (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  );
}
