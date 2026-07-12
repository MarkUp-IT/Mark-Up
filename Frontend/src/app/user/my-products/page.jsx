"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { FileText } from "lucide-react";
import DashboardLayout from "@/component/user/DashboardLayout";
import EmptyState from "@/component/user/EmptyState";

const FILTERS = ["Semua", "Bootcamp", "Mentoring", "Modul"];

// Card produk yang dipakai bareng buat Bootcamp/Mentoring/Modul -- satu
// sumber kebenaran buat ukuran & style, biar nggak ada lagi yang beda-beda
// tinggi/font antar kategori (atau antar halaman user vs mentor).
function ProductCard({ id, title, description, imageClass, badge }) {
  return (
    <Link
      href={`/user/my-products/${id}`}
      className="flex flex-col h-full rounded-[12px] overflow-hidden group border border-[#2D2342] hover:border-[#4C1D95] transition-colors"
    >
      <div
        className={`h-[140px] shrink-0 bg-gradient-to-br ${imageClass} relative`}
      >
        {badge && (
          <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
            {badge}
          </div>
        )}
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

export default function MyProducts() {
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

  // --- MOCK DATA (nanti ganti dengan query user_libraries milik user login) ---
  const bootcampClasses = [
    {
      id: "BC-001",
      title: "Winner Class Dan Module (Debate)",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor",
      imageClass: "from-[#4C1D95] to-[#0D9488]",
      currentSession: 3,
      totalSessions: 4,
    },
    {
      id: "BC-002",
      title: "Winner Class Dan Module (Debate)",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor",
      imageClass: "from-[#4C1D95] to-[#0D9488]",
      currentSession: 1,
      totalSessions: 2,
    },
  ];

  // Mentoring sekarang jadi card + halaman detail, sama kayak Bootcamp --
  // soalnya satu paket bisa berisi lebih dari 1 sesi (2x, 3x), jadi nggak
  // pas lagi ditampilin sebagai 1 baris inline doang.
  const mentoringPackages = [
    {
      id: "MT-001",
      title: "1-on-1 Career Mentoring",
      description:
        "Bimbingan personal buat matangin CV, LinkedIn, dan strategi karier bareng mentor.",
      imageClass: "from-[#4C1D95] to-[#CA8A04]",
      currentSession: 1,
      totalSessions: 1,
    },
    {
      id: "MT-002",
      title: "Bundling PowerPack (Newbie Friendly)",
      description:
        "Paket 3 sesi buat kamu yang baru mulai ikut BCC dari nol, lengkap sama akses deck finalis.",
      imageClass: "from-[#4C1D95] to-[#CA8A04]",
      currentSession: 2,
      totalSessions: 3,
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
    { label: "Mentoring Aktif", value: mentoringPackages.length },
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {bootcampClasses.map((item, index) => (
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
                      <p className="text-[11px] font-bold text-white tracking-wider">
                        SESSION {item.currentSession}/{item.totalSessions}
                      </p>
                    }
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* --- PRIVATE MENTORING (sekarang card + link ke detail, sama kayak Bootcamp) --- */}
      {showMentoring && (
        <motion.div {...sectionReveal} className="flex flex-col gap-5">
          <div className="border-l-[4px] border-[#D1D83E] pl-3">
            <h3 className="text-[18px] font-bold text-white">
              On-Demand Mentoring
            </h3>
          </div>
          {mentoringPackages.length === 0 ? (
            <EmptyState
              message="Kamu belum punya sesi mentoring."
              ctaLabel="Jelajahi Produk"
              ctaHref="/produk"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {mentoringPackages.map((item, index) => (
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
                      <p className="text-[11px] font-bold text-white tracking-wider">
                        SESI {item.currentSession}/{item.totalSessions}
                      </p>
                    }
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* --- E-LEARNING & MODUL (isinya file PDF, dikasih badge biar jelas) --- */}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {moduleClasses.map((item, index) => (
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
    </DashboardLayout>
  );
}
