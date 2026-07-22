"use client";

import { useState, useEffect } from "react";
import Navbar from "@/component/Navbar";
import Footer from "@/component/Footer";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { SearchX, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";


const categories = [
  "Semua",
  "Business Case",
  "Business Plan",
  "Debat",
  "LKTI",
  "UI/UX",
  "Hackathon",
];

// Token card konten, disamakan persis dengan yang dipakai di Homepage:
// radius kecil (6->8px), hover cuma ganti warna border, tanpa transform apapun.
const CARD_BASE =
  "rounded-md md:rounded-lg border border-[#B19EEF]/20 shadow-[0_0_30px_rgba(177,158,239,0.1)] hover:border-[#B19EEF]/50 transition-colors duration-300";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B19EEF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#060010]";

export default function InfoLombaPage() {
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLomba, setSelectedLomba] = useState(null);
  const [lombaData, setLombaData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const shouldReduceMotion = useReducedMotion();

  // Filter Logic
  const filteredLomba = lombaData.filter((lomba) => {
    const matchCategory =
      activeCategory === "Semua" || lomba.category === activeCategory;
    const matchSearch = lomba.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Animasi entrance card & modal dimatikan (cuma fade, tanpa scale) kalau
  // user set reduced-motion di OS-nya.
  const cardMotion = shouldReduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2 },
      }
    : {
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9 },
        transition: { duration: 0.3 },
      };

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
  
  useEffect(() => {
    async function fetchCompetitions() {
      try {
        setLoading(true);
        const json = await api.get("/api/programs/?all=true", {
          auth: false,
        });
        const mapped = (json.competitions || []).map(mapApiCompetition);
        setLombaData(mapped);
        setError(null);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Gagal memuat data lomba. Silakan coba lagi.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchCompetitions();
  }, []);

  return (
    <div className="w-full font-jakarta text-white bg-[#060010] min-h-screen relative flex flex-col">
      {/* Background Glow -- overflow-hidden di-scope ke wrapper kecil ini
          doang (bukan di root). Naruh overflow-x-hidden di root itu jebakan
          CSS: overflow-x selain "visible" bikin overflow-y otomatis "auto",
          yang diam-diam ngerubah div ini jadi scroll container sendiri, dan
          bisa ganggu scroll/sticky behavior halaman. */}
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
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${focusRing} ${
                activeCategory === cat
                  ? "bg-[#530D8E] text-white"
                  : "bg-[#1A1625] text-[#A19DAB] hover:bg-[#2A2438] hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* COUNTER + GRID LOMBA */}
        {loading ? (
          <div className="w-full max-w-[1050px] flex flex-col items-center justify-center gap-3 text-center py-16">
            <Loader2 className="animate-spin text-[#A19DAB]" size={28} />
            <p className="text-[#A19DAB] text-sm">Memuat data lomba...</p>
          </div>
        ) : error ? (
          <div className="w-full max-w-[1050px] flex flex-col items-center justify-center gap-3 text-center py-16 px-6 border border-dashed border-[#3A3545] rounded-md md:rounded-lg bg-[#1A1625]/40">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        ) : filteredLomba.length === 0 ? (
          <div className="w-full max-w-[1050px] flex flex-col items-center justify-center gap-3 text-center py-16 px-6 border border-dashed border-[#3A3545] rounded-md md:rounded-lg bg-[#1A1625]/40">
            <SearchX size={32} className="text-[#A19DAB]" />
            <p className="text-[#A19DAB] text-sm max-w-[320px]">
              {searchQuery
                ? `Lomba dengan kata kunci "${searchQuery}" tidak ditemukan.`
                : `Belum ada lomba untuk kategori "${activeCategory}".`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-[1050px]">
            <AnimatePresence>
              {filteredLomba.map((lomba) => (
                <motion.div
                  key={lomba.id}
                  layout
                  {...cardMotion}
                  onClick={() => setSelectedLomba(lomba)}
                  className={`bg-[#100A19] overflow-hidden cursor-pointer flex flex-col group ${CARD_BASE}`}
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
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#4A2CA1] to-[#17A9D4]"></div>
                    )}
                  </div>

                  {/* Info Content */}
                  <div className="p-6 flex flex-col gap-3">
                    <h3 className="font-poppins font-bold text-xl text-white line-clamp-2 min-h-[56px]">
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
                          {formatRupiah(lomba.fee)}
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
        )}
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
              {...modalMotion}
              onClick={(e) => e.stopPropagation()} // Mencegah modal ketutup pas isi modal diklik
              className="bg-[#1A1625] w-full max-w-[800px] rounded-md md:rounded-lg border border-white/10 overflow-hidden flex flex-col md:flex-row shadow-2xl relative"
            >
              {/* Tombol Close */}
              <button
                onClick={() => setSelectedLomba(null)}
                aria-label="Tutup"
                className={`absolute top-4 right-4 z-10 w-8 h-8 bg-black/50 hover:bg-black rounded-full flex items-center justify-center text-white transition-colors ${focusRing}`}
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
                    value={formatRupiah(selectedLomba.fee)}
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

                <Link
                  href={selectedLomba.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full bg-[#E5DFFF] hover:bg-white text-[#530D8E] font-bold py-3 rounded-full transition-colors mt-auto text-center ${focusRing}`}
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

function mapApiCompetition(item) {
  return {
    id: item.id,
    title: item.title,
    category: item.category?.name ?? item.category ?? "Lainnya",
    organizer: item.organizer ?? "-",

    date: formatDate(item.event_date),
    deadline: formatDate(item.deadline),

    fee: item.registration_fee,
    prize: formatRupiah(item.prizepool),

    level: item.level ?? "-",
    target: item.target_participant ?? "-",

    image: item.image_url,
    link: item.registration_link,
  };
}

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d)) return "-";
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatRupiah(value) {
  if (value === null || value === undefined) return "-";
  const num = Number(value);
  if (isNaN(num)) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);
}

// --- KOMPONEN BANTUAN UNTUK BOX INFO DI MODAL ---
function InfoBox({ title, value, icon }) {
  return (
    <div className="bg-[#2A2438]/50 border border-white/5 rounded-lg p-3 flex flex-col gap-1">
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