"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import DashboardLayout from "@/component/user/DashboardLayout";
import EmptyState from "@/component/user/EmptyState";

const FILTERS = ["Semua", "Bootcamp", "Mentoring", "Modul"];

const mentoringStatusBadge = {
  upcoming: {
    label: "Terjadwal",
    className: "bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/30",
  },
  completed: {
    label: "Selesai",
    className: "bg-[#148F89]/10 text-[#148F89] border border-[#148F89]/30",
  },
};

export default function MyProducts() {
  const [activeFilter, setActiveFilter] = useState("Semua");
  const shouldReduceMotion = useReducedMotion();

  // Reveal per-section (header, tiap grup produk), sama pattern kayak yang
  // dipakai di halaman Mentor.
  const sectionReveal = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: shouldReduceMotion ? 0.2 : 0.4 },
    viewport: { once: true },
  };

  // Stagger per-card di dalam grid, delay bertahap kayak grid mentor
  const cardReveal = (index) => ({
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: {
      duration: shouldReduceMotion ? 0.2 : 0.4,
      delay: shouldReduceMotion ? 0 : index * 0.05,
    },
    viewport: { once: true },
  });

  // --- MOCK DATA (nanti ganti dengan query user_libraries milik user login) ---
  const bootcampClasses = [
    {
      id: "BC-001",
      title: "Winner Class Dan Module (Debate)",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor",
      imageClass: "from-[#4C1D95] to-[#0D9488]",
    },
    {
      id: "BC-002",
      title: "Winner Class Dan Module (Debate)",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor",
      imageClass: "from-[#4C1D95] to-[#0D9488]",
    },
  ];

  // Mentoring beda bentuk (ada jadwal + link sesi) -> tampil inline, BUKAN link
  // ke halaman detail terpisah. Cuma Bootcamp & Modul yang punya halaman [id].
  const mentoringClasses = [
    {
      id: "MT-001",
      packageTitle: "1-on-1 Career Mentoring",
      mentorName: "Kak Alya Hamidah",
      date: "12 Jul 2026",
      time: "14:00 WIB",
      status: "upcoming",
      zoomLink: "https://zoom.us/j/1234567890",
    },
  ];

  const moduleClasses = [
    {
      id: "MD-001",
      title: "Winner Class Dan Module (Debate)",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor",
      imageClass: "from-[#4C1D95] to-[#2563EB]",
    },
    {
      id: "MD-002",
      title: "Winner Class Dan Module (Debate)",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor",
      imageClass: "from-[#4C1D95] to-[#2563EB]",
    },
    {
      id: "MD-003",
      title: "Winner Class Dan Module (Debate)",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor",
      imageClass: "from-[#4C1D95] to-[#2563EB]",
    },
  ];

  const stats = [
    { label: "Mentoring Aktif", value: mentoringClasses.length },
    { label: "Bootcamp Aktif", value: bootcampClasses.length },
    { label: "Modul Aktif", value: moduleClasses.length },
  ];

  const showBootcamp = activeFilter === "Semua" || activeFilter === "Bootcamp";
  const showMentoring =
    activeFilter === "Semua" || activeFilter === "Mentoring";
  const showModul = activeFilter === "Semua" || activeFilter === "Modul";

  return (
    <DashboardLayout title="My Products">
      {/* Header: welcome + tabs (kiri), stat cards (kanan) */}
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

          {/* Filter Tabs */}
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

        {/* Stat Cards */}
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

      {/* --- INTENSIVE BOOTCAMP --- */}
      {showBootcamp && (
        <motion.div {...sectionReveal} className="flex flex-col gap-5">
          <div className="border-l-[4px] border-[#00C6D1] pl-3">
            <h3 className="text-[18px] font-bold text-white">
              Intensive Bootcamp
            </h3>
          </div>
          {bootcampClasses.length === 0 ? (
            <EmptyState
              message="Kamu belum punya produk bootcamp."
              ctaLabel="Jelajahi Produk"
              ctaHref="/produk"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {bootcampClasses.map((item, index) => (
                <motion.div key={item.id} {...cardReveal(index)}>
                  <Link
                    href={`/user/my-products/${item.id}`}
                    className="flex flex-col rounded-[12px] overflow-hidden group border border-[#2D2342] hover:border-[#4C1D95] transition-colors"
                  >
                    <div
                      className={`h-[180px] bg-gradient-to-br ${item.imageClass}`}
                    />
                    <div className="bg-[#170F26] p-5 flex flex-col gap-2">
                      <h4 className="font-bold text-[17px] text-white leading-snug group-hover:text-[#148F89] transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[#9CA3AF] text-[13px] leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* --- PRIVATE MENTORING (inline) --- */}
      {showMentoring && (
        <motion.div {...sectionReveal} className="flex flex-col gap-5">
          <div className="border-l-[4px] border-[#D1D83E] pl-3">
            <h3 className="text-[18px] font-bold text-white">
              On-Demand Mentoring
            </h3>
          </div>
          {mentoringClasses.length === 0 ? (
            <EmptyState
              message="Kamu belum punya sesi mentoring."
              ctaLabel="Jelajahi Produk"
              ctaHref="/produk"
            />
          ) : (
            <div className="flex flex-col gap-4">
              {mentoringClasses.map((item, index) => (
                <motion.div
                  key={item.id}
                  {...cardReveal(index)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#170F26] border border-[#2D2342] rounded-[12px] p-5"
                >
                  <div className="flex flex-col gap-1">
                    <h4 className="font-bold text-[15px] text-white">
                      {item.packageTitle}
                    </h4>
                    <p className="text-[#9CA3AF] text-[12px]">
                      Mentor: {item.mentorName}
                    </p>
                    <p className="text-[#9CA3AF] text-[12px]">
                      {item.date} &middot; {item.time}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${
                        mentoringStatusBadge[item.status].className
                      }`}
                    >
                      {mentoringStatusBadge[item.status].label}
                    </span>
                    {item.zoomLink && (
                      <a
                        href={item.zoomLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-[8px] bg-[#148F89] text-white text-[12px] font-semibold hover:bg-[#117A75] transition-colors whitespace-nowrap"
                      >
                        Gabung Sesi
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* --- E-LEARNING & MODUL --- */}
      {showModul && (
        <motion.div {...sectionReveal} className="flex flex-col gap-5">
          <div className="border-l-[4px] border-[#B19EEF] pl-3">
            <h3 className="text-[18px] font-bold text-white">
              E-Learning & Modul
            </h3>
          </div>
          {moduleClasses.length === 0 ? (
            <EmptyState
              message="Kamu belum punya modul."
              ctaLabel="Jelajahi Produk"
              ctaHref="/produk"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {moduleClasses.map((item, index) => (
                <motion.div key={item.id} {...cardReveal(index)}>
                  <Link
                    href={`/user/my-products/${item.id}`}
                    className="flex flex-col rounded-[12px] overflow-hidden group border border-[#2D2342] hover:border-[#4C1D95] transition-colors"
                  >
                    <div
                      className={`h-[180px] bg-gradient-to-br ${item.imageClass}`}
                    />
                    <div className="bg-[#170F26] p-5 flex flex-col gap-2">
                      <h4 className="font-bold text-[17px] text-white leading-snug group-hover:text-[#148F89] transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[#9CA3AF] text-[13px] leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </DashboardLayout>
  );
}
