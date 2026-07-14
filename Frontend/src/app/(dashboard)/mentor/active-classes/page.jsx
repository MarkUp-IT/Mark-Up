"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import DashboardLayout from "@/component/mentor/DashboardLayout";
import EmptyState from "@/component/mentor/EmptyState";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#148F89] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F081C]";

const FILTERS = ["Semua", "Bootcamp", "Mentoring", "Riwayat"];

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
  const [activeFilter, setActiveFilter] = useState("Semua");
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

  const isRiwayat = activeFilter === "Riwayat";
  const showBootcamp = activeFilter === "Semua" || activeFilter === "Bootcamp";
  const showMentoring =
    activeFilter === "Semua" || activeFilter === "Mentoring";

  // Aktif vs Riwayat -- SEKARANG bener-bener kepisah kayak pola "my-products"
  // di sisi user, bukan cuma digeser ke bawah + diredupin dalam list yang
  // sama kayak sebelumnya. Riwayat SENGAJA nggak nongol pas filter "Semua".
  const activeBootcamp = bootcampClasses.filter(
    (i) => i.completedSessions < i.totalSessions,
  );
  const pastBootcamp = bootcampClasses.filter(
    (i) => i.completedSessions >= i.totalSessions,
  );
  const activeMentoring = mentoringClasses.filter(
    (i) => i.completedSessions < i.totalSessions,
  );
  const pastMentoring = mentoringClasses.filter(
    (i) => i.completedSessions >= i.totalSessions,
  );

  const bootcampList = isRiwayat
    ? pastBootcamp
    : showBootcamp
      ? activeBootcamp
      : [];
  const mentoringList = isRiwayat
    ? pastMentoring
    : showMentoring
      ? activeMentoring
      : [];

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
              Hai Prabroro!
            </h1>
            <p className="text-[#9CA3AF] text-[14px] mt-1">
              Siap buat sesi mengajar berikutnya?
            </p>
          </div>

          <div className="inline-flex items-center gap-1 bg-[#170F26] border border-[#2D2342] rounded-[10px] p-1 w-fit overflow-x-auto no-scrollbar">
            {FILTERS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-5 py-2 rounded-[8px] text-[13px] font-medium whitespace-nowrap transition-colors ${focusRing} ${
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
              {activeBootcamp.length}
            </p>
            <p className="text-[#9CA3AF] text-[11px] sm:text-[12px] mt-2 text-center whitespace-nowrap">
              Bootcamp Aktif
            </p>
          </div>
          <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] px-4 sm:px-6 py-5 flex flex-col items-center justify-center min-w-[95px] sm:min-w-[120px]">
            <p className="text-[#148F89] font-bold text-[30px] sm:text-[34px] leading-none">
              {activeMentoring.length}
            </p>
            <p className="text-[#9CA3AF] text-[11px] sm:text-[12px] mt-2 text-center whitespace-nowrap">
              Mentoring Aktif
            </p>
          </div>
        </div>
      </motion.div>

      {isRiwayat && (
        <motion.p {...sectionReveal} className="text-[#6B7280] text-[13px]">
          Kelas yang udah selesai. Klik kartunya buat lihat rekaman tiap sesi.
        </motion.p>
      )}

      {/* --- INTENSIVE BOOTCAMP --- */}
      {(showBootcamp || isRiwayat) && (
        <motion.div {...sectionReveal} className="flex flex-col gap-5">
          <div
            className={`border-l-[4px] pl-3 ${isRiwayat ? "border-[#3A3545]" : "border-[#00C6D1]"}`}
          >
            <h3 className="text-[18px] font-bold text-white">
              Intensive Bootcamp
            </h3>
          </div>
          {bootcampList.length === 0 ? (
            <EmptyState
              message={
                isRiwayat
                  ? "Belum ada bootcamp yang selesai."
                  : "Belum ada kelas bootcamp yang ditugaskan ke kamu."
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {bootcampList.map((item, index) => (
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
                    isCompleted={item.completedSessions >= item.totalSessions}
                    badge={`SESSION ${Math.min(item.completedSessions + 1, item.totalSessions)}/${item.totalSessions}`}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* --- PRIVATE MENTORING (sekarang card + link ke detail, sama kayak Bootcamp) --- */}
      {(showMentoring || isRiwayat) && (
        <motion.div {...sectionReveal} className="flex flex-col gap-5">
          <div
            className={`border-l-[4px] pl-3 ${isRiwayat ? "border-[#3A3545]" : "border-[#D1D83E]"}`}
          >
            <h3 className="text-[18px] font-bold text-white">
              Private Mentoring
            </h3>
          </div>
          {mentoringList.length === 0 ? (
            <EmptyState
              message={
                isRiwayat
                  ? "Belum ada sesi mentoring yang selesai."
                  : "Belum ada jadwal mentoring privat yang masuk."
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {mentoringList.map((item, index) => (
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
                    isCompleted={item.completedSessions >= item.totalSessions}
                    badge={`SESI ${Math.min(item.completedSessions + 1, item.totalSessions)}/${item.totalSessions}`}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </DashboardLayout>
  );
}
