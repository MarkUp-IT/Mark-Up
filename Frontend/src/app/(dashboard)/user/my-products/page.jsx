"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { FileText, Star, AlertCircle } from "lucide-react";
import DashboardLayout from "@/component/user/DashboardLayout";
import EmptyState from "@/component/user/EmptyState";
import { apiRequest } from "@/lib/api";

const FILTERS = ["Semua", "Bootcamp", "Mentoring", "Modul", "Riwayat"];

// Card produk yang dipakai bareng buat Bootcamp/Mentoring/Modul. Titik-tiga
// refund/ganti-jadwal SENGAJA nggak ada lagi di sini -- itu aksi yang lebih
// pas dilakuin di halaman detail masing-masing produk (di situ user bisa
// liat konteks lengkap tiap sesi), bukan di card ringkas kayak gini.
function ProductCard({
  id,
  title,
  description,
  imageClass,
  badge,
  isCompleted,
  hasRating,
  onRate,
}) {
  return (
    <div
      className={`relative h-full flex flex-col rounded-[12px] overflow-hidden border transition-colors ${
        isCompleted
          ? "border-[#2D2342] opacity-80 hover:opacity-100"
          : "border-[#2D2342] hover:border-[#4C1D95]"
      }`}
    >
      <Link
        href={`/user/my-products/${id || ""}`}
        className="flex flex-col flex-1 group"
      >
        <div
          className={`h-[140px] shrink-0 relative ${
            isCompleted
              ? "bg-gradient-to-br from-[#2D2342] to-[#1A1128]"
              : `bg-gradient-to-br ${imageClass || ""}`
          }`}
        >
          <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
            {isCompleted ? (
              <>
                <Star size={11} className="text-[#9CA3AF]" />
                <p className="text-[11px] font-bold text-[#9CA3AF] tracking-wider">
                  SELESAI
                </p>
              </>
            ) : (
              badge
            )}
          </div>
        </div>
        <div className="bg-[#170F26] p-5 flex flex-col flex-1 gap-2">
          <h4
            className={`font-bold text-[16px] leading-snug line-clamp-2 min-h-[44px] transition-colors ${
              isCompleted
                ? "text-[#E2E8F0]"
                : "text-white group-hover:text-[#148F89]"
            }`}
          >
            {title}
          </h4>
          <p className="text-[#9CA3AF] text-[12px] leading-relaxed line-clamp-2">
            {description}
          </p>
        </div>
      </Link>

      {!!isCompleted && (
        <div className="bg-[#170F26] px-5 pb-5 -mt-1">
          {hasRating ? (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] bg-black/20 border border-white/10 text-[#9CA3AF] text-[11px] font-medium w-fit">
              <Star size={12} className="fill-[#F59E0B] text-[#F59E0B]" />
              Sudah dinilai
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                onRate?.();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] bg-[#148F89] text-white text-[11px] font-semibold hover:bg-[#117A75] transition-colors w-fit"
            >
              <Star size={12} />
              Beri Rating
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function MyProducts() {
  const [activeFilter, setActiveFilter] = useState("Semua");
  const shouldReduceMotion = useReducedMotion() ?? false;

  const [ratingProduct, setRatingProduct] = useState(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingText, setRatingText] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratedIds, setRatedIds] = useState([]);

  const sectionReveal = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: shouldReduceMotion ? 0.2 : 0.4 },
    viewport: { once: true },
  };

  const cardReveal = (index) => ({
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: {
      duration: shouldReduceMotion ? 0.2 : 0.4,
      delay: shouldReduceMotion ? 0 : index * 0.05,
    },
    viewport: { once: true },
  });

  const modalMotion = shouldReduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : {
        initial: { opacity: 0, scale: 0.96, y: 12 },
        animate: { opacity: 1, scale: 1, y: 0 },
      };

  const [data, setData] = useState({
    stats: {
      mentoring_active: 0,
      bootcamp_active: 0,
      modul_active: 0,
    },
    bootcamp: [],
    mentoring: [],
    modul: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
      fetchProducts();
  }, [activeFilter]);

 

  

  const isRiwayat = activeFilter === "Riwayat";
  const showBootcamp = activeFilter === "Semua" || activeFilter === "Bootcamp";
  const showMentoring =
    activeFilter === "Semua" || activeFilter === "Mentoring";
  const showModul = activeFilter === "Semua" || activeFilter === "Modul";


  const openRatingModal = (product) => {
    setRatingProduct(product);
    setRatingValue(0);
    setRatingText("");
  };
  const closeRatingModal = () => setRatingProduct(null);

  const handleSubmitRating = async (e) => {
      e.preventDefault();

      if (ratingValue === 0) return;

      setIsSubmittingRating(true);

      await apiRequest(
          `/api/products/my-products/${ratingProduct.id}/rate/`,
          {
              method: "POST",
              body: JSON.stringify({
                  rating: ratingValue,
                  review_text: ratingText,
              }),
          }
      );

      setRatedIds((prev) => [...prev, ratingProduct.id]);

      setRatingProduct(null);

      setIsSubmittingRating(false);
  };

  async function fetchProducts() {
      setLoading(true);

      const res = await apiRequest(
          `/api/products/my-products/?filter=${activeFilter.toLowerCase()}`
      );

      setData(res);

      setLoading(false);
  }

  const stats = [
    {
      label: "Mentoring Aktif",
      value: data.stats.mentoring_active,
    },
    {
      label: "Bootcamp Aktif",
      value: data.stats.bootcamp_active,
    },
    {
      label: "Modul Aktif",
      value: data.stats.modul_active,
    },
  ];

  return (
    <DashboardLayout title="My Products">
      <motion.div
        {...sectionReveal}
        className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6"
      >
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="text-[28px] sm:text-[32px] font-bold text-white leading-tight">
              Hai Prabroro!
            </h1>
            <p className="text-[#9CA3AF] text-[14px] mt-1">
              Selamat datang di MarkUp Learning Platform
            </p>
          </div>

          <div className="inline-flex items-center gap-1 bg-[#170F26] border border-[#2D2342] rounded-[10px] p-1 w-fit overflow-x-auto no-scrollbar">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-5 py-2 rounded-[8px] text-[13px] font-medium whitespace-nowrap transition-colors ${
                  activeFilter === f
                    ? "bg-[#2D1B4E] text-white shadow-sm"
                    : "text-[#9CA3AF] hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 shrink-0">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-[#170F26] border border-[#2D2342] rounded-[12px] px-4 sm:px-6 py-5 flex flex-col items-center justify-center min-w-[95px] sm:min-w-[120px]"
            >
              <p className="text-[#148F89] font-bold text-[30px] sm:text-[34px] leading-none">
                {s.value}
              </p>
              <p className="text-[#9CA3AF] text-[11px] sm:text-[12px] mt-2 text-center whitespace-nowrap">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {!!isRiwayat && (
        <motion.p {...sectionReveal} className="text-[#6B7280] text-[13px]">
          Produk yang udah selesai. Klik kartunya buat lihat rekaman tiap sesi.
        </motion.p>
      )}

      {(showBootcamp || isRiwayat) && (
        <motion.div {...sectionReveal} className="flex flex-col gap-5">
          <div
            className={`border-l-[4px] pl-3 ${isRiwayat ? "border-[#3A3545]" : "border-[#00C6D1]"}`}
          >
            <h3 className="text-[18px] font-bold text-white">
              Intensive Bootcamp
            </h3>
          </div>
          {data.bootcamp.length === 0 ? (
            isRiwayat ? (
              <EmptyState message="Belum ada bootcamp yang selesai." />
            ) : (
              <EmptyState
                message="Kamu belum punya produk bootcamp."
                ctaLabel="Jelajahi Produk"
                ctaHref="/produk"
              />
            )
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data.bootcamp.map((item, index) => (
                <motion.div
                  key={item.id}
                  {...cardReveal(index)}
                  className="h-full"
                >
                  <ProductCard
                    id={item.id}
                    title={item.title}
                    description={item.description}
                    imageClass={item.imageClass}
                    isCompleted={item.status === "completed"}
                    hasRating={!!item.hasRating || ratedIds.includes(item.id)}
                    onRate={() => openRatingModal(item)}
                    badge={
                      item.status !== "completed" ? (
                        <p className="text-[11px] font-bold text-white tracking-wider">
                          SESSION {item.currentSession}/{item.totalSessions}
                        </p>
                      ) : null
                    }
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {(showMentoring || isRiwayat) && (
        <motion.div {...sectionReveal} className="flex flex-col gap-5">
          <div
            className={`border-l-[4px] pl-3 ${isRiwayat ? "border-[#3A3545]" : "border-[#D1D83E]"}`}
          >
            <h3 className="text-[18px] font-bold text-white">
              On-Demand Mentoring
            </h3>
          </div>
          {data.mentoring.length === 0 ? (
            isRiwayat ? (
              <EmptyState message="Belum ada sesi mentoring yang selesai." />
            ) : (
              <EmptyState
                message="Kamu belum punya sesi mentoring."
                ctaLabel="Jelajahi Produk"
                ctaHref="/produk"
              />
            )
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data.mentoring.map((item, index) => (
                <motion.div
                  key={item.id}
                  {...cardReveal(index)}
                  className="h-full"
                >
                  <ProductCard
                    id={item.id}
                    title={item.title}
                    description={item.description}
                    imageClass={item.imageClass}
                    isCompleted={item.status === "completed"}
                    hasRating={!!item.hasRating || ratedIds.includes(item.id)}
                    onRate={() => openRatingModal(item)}
                    badge={
                      item.status !== "completed" ? (
                        <p className="text-[11px] font-bold text-white tracking-wider">
                          SESI {item.currentSession}/{item.totalSessions}
                        </p>
                      ) : null
                    }
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {showModul && !isRiwayat && (
        <motion.div {...sectionReveal} className="flex flex-col gap-5">
          <div className="border-l-[4px] border-[#B19EEF] pl-3">
            <h3 className="text-[18px] font-bold text-white">
              E-Learning & Modul
            </h3>
          </div>
          {data.modul.length === 0 ? (
            <EmptyState
              message="Kamu belum punya modul."
              ctaLabel="Jelajahi Produk"
              ctaHref="/produk"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data.modul.map((item, index) => (
                <motion.div
                  key={item.id}
                  {...cardReveal(index)}
                  className="h-full"
                >
                  <ProductCard
                    id={item.id}
                    title={item.title}
                    description={item.description}
                    imageClass={item.imageClass}
                    badge={
                      <>
                        <FileText size={11} className="text-white" />
                        <p className="text-[11px] font-bold text-white tracking-wider">
                          PDF
                        </p>
                      </>
                    }
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* --- MODAL: Beri Rating --- */}
      {!!ratingProduct && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={closeRatingModal}
        >
          <motion.form
            {...modalMotion}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmitRating}
            className="bg-[#170F26] w-full max-w-[420px] rounded-[16px] border border-[#2D2342] shadow-2xl"
          >
            <div className="px-6 py-5 border-b border-[#2D2342] flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-[16px]">
                  Beri Rating
                </h3>
                <p className="text-[#9CA3AF] text-[12px] mt-0.5">
                  {ratingProduct?.title}
                </p>
              </div>
              <button
                type="button"
                onClick={closeRatingModal}
                aria-label="Tutup"
                className="p-1.5 rounded-[8px] text-[#9CA3AF] hover:text-white hover:bg-white/5 transition-colors shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingValue(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      size={32}
                      className={
                        star <= ratingValue
                          ? "fill-[#F59E0B] text-[#F59E0B]"
                          : "text-[#2D2342]"
                      }
                    />
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[#E2E8F0] text-[13px] font-medium">
                  Ulasan (opsional)
                </label>
                <textarea
                  value={ratingText}
                  onChange={(e) => setRatingText(e.target.value)}
                  rows={4}
                  placeholder="Ceritakan pengalamanmu ikut produk ini..."
                  className="w-full bg-[#0F081C] border border-[#2D2342] rounded-[8px] px-4 py-3 text-[13px] text-white placeholder:text-[#6B7280] outline-none focus:border-[#148F89]/60 transition-colors resize-none"
                />
              </div>

              {ratingValue === 0 && (
                <p className="flex items-start gap-2 text-[#F59E0B] text-[11px]">
                  <AlertCircle size={13} className="shrink-0 mt-0.5" />
                  Pilih bintang dulu sebelum kirim ulasan.
                </p>
              )}

              <button
                type="submit"
                disabled={ratingValue === 0 || isSubmittingRating}
                className="w-full py-3 rounded-[8px] bg-[#148F89] text-white font-semibold text-[13px] hover:bg-[#117A75] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingRating ? "Mengirim..." : "Kirim Ulasan"}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </DashboardLayout>
  );
}
