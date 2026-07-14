"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Star } from "lucide-react";
import DashboardLayout from "@/component/mentor/DashboardLayout";
import EmptyState from "@/component/mentor/EmptyState";

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={
            i <= rating ? "fill-[#F59E0B] text-[#F59E0B]" : "text-[#2D2342]"
          }
        />
      ))}
    </div>
  );
}

const RATING_FILTERS = ["Semua", "5", "4", "3", "2", "1"];

export default function MentorReviews() {
  const [activeFilter, setActiveFilter] = useState("Semua");
  const shouldReduceMotion = useReducedMotion();

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

  // --- MOCK DATA (nanti ganti dengan query ke tabel reviews where
  // mentor_profile_id = mentor yang login, join product buat judulnya) ---
  const reviews = [
    {
      id: "REV-001",
      reviewerName: "Affan Fathir D.",
      productTitle: "Winner Class Dan Module (Debate)",
      rating: 5,
      reviewText:
        "Mentornya sangat membantu, penjelasannya detail dan mudah dipahami! Bikin makin percaya diri buat kompetisi.",
      date: "15 Juni 2026",
    },
    {
      id: "REV-002",
      reviewerName: "Sarah Jenkins",
      productTitle: "1-on-1 Career Mentoring",
      rating: 4,
      reviewText: "Sesi yang berguna, cuma waktunya kerasa kurang panjang.",
      date: "20 Juni 2026",
    },
    {
      id: "REV-003",
      reviewerName: "Budi Santoso",
      productTitle: "Frontend Engineering Sprint",
      rating: 5,
      reviewText: "Materinya applicable banget, langsung kepake buat project.",
      date: "2 Juli 2026",
    },
  ];

  const hasAny = reviews.length > 0;
  const averageRating = hasAny
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(
        1,
      )
    : "0.0";

  const filtered = reviews.filter(
    (r) => activeFilter === "Semua" || String(r.rating) === activeFilter,
  );

  return (
    <DashboardLayout title="Reviews">
      <motion.div {...sectionReveal} className="flex flex-col gap-1">
        <h1 className="text-[28px] sm:text-[32px] font-bold text-white leading-tight">
          Ulasan Mentee
        </h1>
        <p className="text-[#9CA3AF] text-[14px] mt-1">
          Masukan dari mentee yang sudah mengikuti sesi bootcamp atau
          mentoringmu.
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        {...sectionReveal}
        className="grid grid-cols-1 sm:grid-cols-2 gap-6"
      >
        <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-6 flex flex-col justify-center shadow-lg">
          <p className="text-[#E2E8F0] font-medium text-[14px]">
            Rating Rata-Rata
          </p>
          <div className="flex items-baseline gap-3 mt-2">
            <p className="text-[#148F89] font-bold text-[34px] leading-none">
              {averageRating}
            </p>
            <StarRating rating={Math.round(Number(averageRating))} />
          </div>
        </div>
        <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-6 flex flex-col justify-center shadow-lg">
          <p className="text-[#E2E8F0] font-medium text-[14px]">Total Ulasan</p>
          <p className="text-[#148F89] font-bold text-[34px] leading-none mt-2">
            {reviews.length}
          </p>
        </div>
      </motion.div>

      {/* Filter Rating */}
      {hasAny && (
        <motion.div
          {...sectionReveal}
          className="inline-flex items-center gap-1 bg-[#170F26] border border-[#2D2342] rounded-[10px] p-1 w-fit overflow-x-auto no-scrollbar"
        >
          {RATING_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-[8px] text-[13px] font-medium whitespace-nowrap transition-colors ${
                activeFilter === f
                  ? "bg-[#2D1B4E] text-white shadow-sm"
                  : "text-[#9CA3AF] hover:text-white"
              }`}
            >
              {f === "Semua" ? f : `${f} \u2605`}
            </button>
          ))}
        </motion.div>
      )}

      {/* List */}
      {!hasAny ? (
        <EmptyState message="Belum ada ulasan masuk. Ulasan akan muncul di sini setelah mentee memberi penilaian." />
      ) : filtered.length === 0 ? (
        <EmptyState
          message={`Belum ada ulasan dengan rating ${activeFilter} bintang.`}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((r, index) => (
            <motion.div
              key={r.id}
              {...cardReveal(index)}
              className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-5 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="text-white font-semibold text-[14px] truncate">
                    {r.reviewerName}
                  </h4>
                  <p className="text-[#9CA3AF] text-[12px] truncate">
                    {r.productTitle}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <StarRating rating={r.rating} />
                  <span className="text-[#6B7280] text-[11px]">{r.date}</span>
                </div>
              </div>
              <p className="text-[#E2E8F0] text-[13px] leading-relaxed">
                {r.reviewText}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
