"use client";

import { useState, useEffect } from "react";
import Navbar from "@/component/Navbar";
import Footer from "@/component/Footer";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { SearchX, FileText, Check, LogIn } from "lucide-react";
import { api, ApiError, getAccessToken } from "@/lib/api";
import { useRouter } from "next/navigation";

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




const tabs = [ { label: "Semua", value: "Semua" },
  { label: "Mentoring", value: "MENTORING" },
  { label: "Bootcamp", value: "BOOTCAMP" },
  { label: "Modul", value: "MODULE" },];

const sections = [
  { title: "Private Mentoring", type: "MENTORING", lineStyle: "bg-[#D1D83E]" },
  { title: "Intensive Bootcamp", type: "BOOTCAMP", lineStyle: "bg-[#00C6D1]" },
  { title: "E-Learning & Modul", type: "MODULE", lineStyle: "bg-[#B19EEF]" },
];

// Token card konten, disamakan persis dengan Homepage & Info Lomba: radius
// kecil (6->8px), hover cuma ganti warna border, tanpa transform apapun.
const CARD_BASE =
  "rounded-md md:rounded-lg border border-[#B19EEF]/20 shadow-[0_0_30px_rgba(177,158,239,0.1)] hover:border-[#B19EEF]/50 transition-colors duration-300";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B19EEF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#060010]";

function mapApiProduct(item) {
const price = item.new_price !== null ? Number(item.new_price) : 0;
const originalPrice =
  item.original_price !== null ? Number(item.original_price) : 0;

return {
  id: item.id,
  title: item.title,
  type: item.type, 
  desc: item.description || "",
  fullDesc: item.explanation || item.description || "",
  price,
  originalPrice,
  soldCount: item.sold_count || 0,
  image: item.image_url || "",
  link: item.registration_link || "#",

  sessionCount: item.session_count || null,
  durationMinutes: item.duration_minutes || null,
  highlights: item.highlights || [],

  filePdfUrl: item.file_pdf_url || null,
  stock: item.stock ?? null,
};
}

export default function ProdukPage() {
  const [activeTab, setActiveTab] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const shouldReduceMotion = useReducedMotion();

  const [productData, setProductData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const router = useRouter();
  const handleBuyClick = (productId) => {
    const token = getAccessToken();
    if (!token) {
      setShowLoginModal(true);
      return;
    }
    router.push(`/checkout/${productId}`);
  };
  

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const json = await api.get("/api/products/?all=true", { auth: false });
        const mapped = (json.products || []).map(mapApiProduct);
        setProductData(mapped);
        setError(null);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Gagal memuat data produk. Silakan coba lagi.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

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
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-5 py-2 rounded-full text-xs md:text-sm font-semibold transition-colors duration-300 ${focusRing} ${
                activeTab === tab.value
                  ? "bg-[#530D8E] text-white"
                  : "bg-[#1A1625] border border-white/5 text-[#A19DAB] hover:bg-[#2A2438] hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* LOADING & ERROR STATES */}
        {loading && (
          <p className="text-[#A19DAB] text-sm mb-6">Memuat produk...</p>
        )}
        {error && (
          <p className="text-red-400 text-sm mb-6">{error}</p>
        )}

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

                  {/* --- MODUL: satu file PDF --- */}
                  {selectedProduct.type === "MODULE" && selectedProduct.filePdfUrl && (
                    <>
                      <p className="text-white font-semibold text-xs uppercase tracking-wide mb-2">
                        File Materi
                      </p>
                      <p className="flex items-center gap-2 text-gray-300 text-sm mb-5">
                        <FileText
                          size={16}
                          className="text-[#B19EEF] shrink-0"
                        />
                        File PDF Modul
                      </p>
                    </>
                  )}

                  {/* --- MENTORING: highlight per poin, jumlah sesi kelihatan
                      jelas di judul section --- */}
                  {selectedProduct.type === "MENTORING" && selectedProduct.highlights?.length > 0 && (
                    <>
                      <p className="text-white font-semibold text-xs uppercase tracking-wide mb-2">
                        {selectedProduct.sessionCount}x Sesi Mentoring — Yang Kamu Dapatkan
                      </p>
                      <ul className="flex flex-col gap-2">
                        {selectedProduct.highlights.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-gray-300">
                            <Check size={14} className="text-[#D1D83E] shrink-0 mt-0.5" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>

                <button
                  onClick={() => handleBuyClick(selectedProduct.id)}
                  className={`w-full bg-[#E5DFFF] hover:bg-white text-[#530D8E] font-bold py-3 rounded-full transition-colors mt-auto text-center shrink-0 ${focusRing}`}
                >
                  Beli Sekarang
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* MODAL: WAJIB LOGIN */}
      <AnimatePresence>
        {showLoginModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowLoginModal(false)}
          >
            <motion.div
              initial={
                shouldReduceMotion ? { opacity: 0 } : { scale: 0.95, y: 20 }
              }
              animate={
                shouldReduceMotion ? { opacity: 1 } : { scale: 1, y: 0 }
              }
              exit={
                shouldReduceMotion ? { opacity: 0 } : { scale: 0.95, y: 20 }
              }
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1A1625] w-full max-w-[400px] rounded-md md:rounded-lg border border-white/10 overflow-hidden shadow-2xl relative p-6 md:p-8 flex flex-col items-center text-center gap-4"
            >
              <button
                onClick={() => setShowLoginModal(false)}
                aria-label="Tutup"
                className={`absolute top-4 right-4 z-20 w-8 h-8 bg-black/50 hover:bg-black rounded-full flex items-center justify-center text-white transition-colors ${focusRing}`}
              >
                ✕
              </button>

              <div className="w-14 h-14 rounded-full bg-[#530D8E]/20 border border-[#530D8E]/40 flex items-center justify-center">
                <LogIn size={26} className="text-[#B19EEF]" />
              </div>

              <div>
                <h3 className="font-poppins font-bold text-lg text-white mb-1.5">
                  Masuk Dulu, Yuk
                </h3>
                <p className="text-[#A19DAB] text-sm leading-relaxed">
                  Kamu perlu login terlebih dahulu untuk melanjutkan pembelian
                  produk ini.
                </p>
              </div>

              <div className="flex flex-col gap-2.5 w-full mt-2">
                <Link
                  href="/login"
                  className={`w-full bg-[#E5DFFF] hover:bg-white text-[#530D8E] font-bold py-3 rounded-full transition-colors text-center ${focusRing}`}
                >
                  Login Sekarang
                </Link>
                <button
                  onClick={() => setShowLoginModal(false)}
                  className={`w-full text-[#A19DAB] hover:text-white text-sm font-medium py-2 transition-colors ${focusRing}`}
                >
                  Nanti Saja
                </button>
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

  if (data.type === "BOOTCAMP") {
    tagStyle = "bg-[#0A4A5C] text-[#00C6D1]";
    priceColor = "text-[#00C6D1]";
  } else if (data.type === "MODULE") {
    tagStyle = "bg-[#3B0E76] text-[#B19EEF]";
    priceColor = "text-[#B19EEF]";
  } else if (data.type === "MENTORING") {
    tagStyle = "bg-[#3A3610] text-[#D1D83E]";
    priceColor = "text-[#D1D83E]";
  }

  const discountPercent = getDiscountPercent(data.price, data.originalPrice);

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

        {data.type === "MENTORING" && data.sessionCount && (
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
