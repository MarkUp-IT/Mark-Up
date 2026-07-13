"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import DashboardLayout from "@/component/mentor/DashboardLayout";
import EmptyState from "@/component/mentor/EmptyState";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#148F89] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F081C]";

const FILTERS = ["all", "bootcamp", "mentoring"];

// Card yang dipakai bareng Bootcamp & Mentoring -- satu sumber kebenaran
// buat ukuran & style, sama persis kayak yang dipakai di my-products user.
function ClassCard({ id, title, description, imageClass, badge, isCompleted }) {
  return (
    <Link
      href={`/mentor/active-classes/${id}`}
      className={`flex flex-col h-full rounded-[12px] overflow-hidden cursor-pointer group shadow-lg transition-all border ${focusRing} ${
        isCompleted
          ? "border-[#2D2342] opacity-70 hover:opacity-100"
          : "border-[#2D2342] hover:border-[#4C1D95]"
      }`}
    >
      <div
        className={`h-[140px] shrink-0 bg-gradient-to-br ${imageClass} relative`}
      >
        <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
          <p className="text-[11px] font-bold text-white tracking-wider">
            {isCompleted ? "SELESAI" : badge}
          </p>
        </div>
      </div>
      <div className="bg-[#170F26] p-5 flex flex-col flex-1 gap-2">
        <h4 className="font-bold text-[16px] text-white leading-snug line-clamp-2 min-h-[44px] group-hover:text-[#148F89] transition-colors">
          {title}
        </h4>
        <p className="text-[#9CA3AF] text-[12px] leading-relaxed line-clamp-2">
          {description}
        </p>
      </div>
    </Link>
  );
}

export default function MentorDashboard() {
  const [activeFilter, setActiveFilter] = useState("all");
  const shouldReduceMotion = useReducedMotion() ?? false;

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

  // --- MOCK DATA (nanti ganti dengan query sesi & mentoring milik mentor yang login) ---
  const bootcampClasses = [
    {
      id: "BC-001",
      title: "Winner Class Dan Module (Debate)",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor.",
      imageClass: "from-[#4C1D95] to-[#0D9488]",
      completedSessions: 5,
      totalSessions: 8,
    },
    {
      id: "BC-002",
      title: "Frontend Engineering Sprint",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor.",
      imageClass: "from-[#4C1D95] to-[#0D9488]",
      completedSessions: 6,
      totalSessions: 6,
    },
  ];

  // Mentoring sekarang jadi card + link ke halaman detail, sama kayak
  // Bootcamp -- soalnya satu paket mentee bisa punya lebih dari 1 sesi
  // (2x, 3x), jadi nggak pas lagi ditampilin sebagai 1 baris inline doang.
  const mentoringClasses = [
    {
      id: "MT-001",
      title: "1-on-1 Career Mentoring — Sarah Jenkins",
      description: "Reviewing resume and preparing for technical interviews.",
      imageClass: "from-[#4C1D95] to-[#CA8A04]",
      completedSessions: 0,
      totalSessions: 1,
    },
    {
      id: "MT-002",
      title: "Winner Class Dan Module (Debate) — Affan Fathir D.",
      description:
        "Student wants to discuss advanced validation strategies and startup pitching.",
      imageClass: "from-[#4C1D95] to-[#CA8A04]",
      completedSessions: 2,
      totalSessions: 3,
    },
  ];

  const showBootcamp = activeFilter === "all" || activeFilter === "bootcamp";
  const showMentoring = activeFilter === "all" || activeFilter === "mentoring";

  const activeBootcampCount = bootcampClasses.filter(
    (i) => i.completedSessions < i.totalSessions,
  ).length;
  const activeMentoringCount = mentoringClasses.filter(
    (i) => i.completedSessions < i.totalSessions,
  ).length;

  // Aktif duluan, yang udah Selesai digeser ke bawah -- tetap satu list yang
  // sama, biar gampang ditemuin lagi kalau mentor mau cek riwayat/rekaman.
  const sortByActiveFirst = (a, b) => {
    const aDone = a.completedSessions >= a.totalSessions;
    const bDone = b.completedSessions >= b.totalSessions;
    return aDone === bDone ? 0 : aDone ? 1 : -1;
  };
  const sortedBootcamp = [...bootcampClasses].sort(sortByActiveFirst);
  const sortedMentoring = [...mentoringClasses].sort(sortByActiveFirst);

  return (
    <DashboardLayout title="Active Classes">
      {/* Header: welcome + filter (kiri), stat card (kanan) */}
      <motion.div
        {...sectionReveal}
        className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6"
      >
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="text-[28px] sm:text-[32px] font-bold text-white leading-tight">
              Hi Prabroro!
            </h1>
            <p className="text-[#9CA3AF] text-[14px] mt-1">
              Ready for your next teaching session?
            </p>
          </div>

          <div className="inline-flex items-center gap-1 bg-[#170F26] border border-[#2D2342] rounded-[10px] p-1 w-fit overflow-x-auto no-scrollbar">
            {FILTERS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-5 py-2 rounded-[8px] text-[13px] font-medium capitalize whitespace-nowrap transition-colors ${focusRing} ${
                  activeFilter === tab
                    ? "bg-[#2D1B4E] text-white shadow-sm"
                    : "text-[#9CA3AF] hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 shrink-0">
          <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] px-4 sm:px-6 py-5 flex flex-col items-center justify-center min-w-[95px] sm:min-w-[120px]">
            <p className="text-[#148F89] font-bold text-[30px] sm:text-[34px] leading-none">
              {activeBootcampCount}
            </p>
            <p className="text-[#9CA3AF] text-[11px] sm:text-[12px] mt-2 text-center whitespace-nowrap">
              Bootcamp Aktif
            </p>
          </div>
          <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] px-4 sm:px-6 py-5 flex flex-col items-center justify-center min-w-[95px] sm:min-w-[120px]">
            <p className="text-[#148F89] font-bold text-[30px] sm:text-[34px] leading-none">
              {activeMentoringCount}
            </p>
            <p className="text-[#9CA3AF] text-[11px] sm:text-[12px] mt-2 text-center whitespace-nowrap">
              Mentoring Aktif
            </p>
          </div>
        </div>
      </motion.div>

      {/* --- INTENSIVE BOOTCAMP --- */}
      {showBootcamp && (
        <motion.div {...sectionReveal} className="flex flex-col gap-5">
          <div className="border-l-[4px] border-[#00C6D1] pl-3">
            <h3 className="text-[18px] font-bold text-white">
              Intensive Bootcamp
            </h3>
          </div>
          {bootcampClasses.length === 0 ? (
            <EmptyState message="Belum ada kelas bootcamp yang ditugaskan ke kamu." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedBootcamp.map((item, index) => {
                const isCompleted =
                  item.completedSessions >= item.totalSessions;
                return (
                  <motion.div
                    key={item.id}
                    {...cardReveal(index)}
                    className="h-full"
                  >
                    <ClassCard
                      id={item.id}
                      title={item.title}
                      description={item.description}
                      imageClass={item.imageClass}
                      isCompleted={isCompleted}
                      badge={`SESSION ${Math.min(item.completedSessions + 1, item.totalSessions)}/${item.totalSessions}`}
                    />
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* --- PRIVATE MENTORING (sekarang card + link ke detail, sama kayak Bootcamp) --- */}
      {showMentoring && (
        <motion.div {...sectionReveal} className="flex flex-col gap-5">
          <div className="border-l-[4px] border-[#D1D83E] pl-3">
            <h3 className="text-[18px] font-bold text-white">
              Private Mentoring
            </h3>
          </div>
          {mentoringClasses.length === 0 ? (
            <EmptyState message="Belum ada jadwal mentoring privat yang masuk." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedMentoring.map((item, index) => {
                const isCompleted =
                  item.completedSessions >= item.totalSessions;
                return (
                  <motion.div
                    key={item.id}
                    {...cardReveal(index)}
                    className="h-full"
                  >
                    <ClassCard
                      id={item.id}
                      title={item.title}
                      description={item.description}
                      imageClass={item.imageClass}
                      isCompleted={isCompleted}
                      badge={`SESI ${Math.min(item.completedSessions + 1, item.totalSessions)}/${item.totalSessions}`}
                    />
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </DashboardLayout>
  );
}
