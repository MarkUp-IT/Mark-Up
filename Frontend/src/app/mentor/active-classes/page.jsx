"use client";

import { useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/component/mentor/DashboardLayout";
import EmptyState from "@/component/mentor/EmptyState";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#148F89] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F081C]";

const FILTERS = ["all", "bootcamp", "mentoring"];

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

export default function MentorDashboard() {
  const [activeFilter, setActiveFilter] = useState("all");

  // --- MOCK DATA (nanti ganti dengan query sesi & mentoring milik mentor yang login) ---
  const bootcampClasses = [
    {
      id: "BC-001",
      title: "Winner Class Dan Module (Debate)",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor.",
      imageClass: "from-[#4C1D95] to-[#0D9488]",
      currentSession: 5,
      totalSessions: 8,
    },
    {
      id: "BC-002",
      title: "Frontend Engineering Sprint",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor.",
      imageClass: "from-[#4C1D95] to-[#0D9488]",
      currentSession: 2,
      totalSessions: 6,
    },
  ];

  // Mentoring beda bentuk datanya (mentee, jadwal, link zoom, catatan) --
  // makanya UI-nya list inline langsung di halaman ini, BUKAN link ke halaman
  // detail terpisah kayak Bootcamp.
  const mentoringClasses = [
    {
      id: "MT-001",
      packageTitle: "Winner Class Dan Module (Debate)",
      menteeName: "Affan Fathir D.",
      date: "Jul 12, 2026",
      time: "14:00 - 15:00 WIB",
      status: "upcoming",
      zoomLink: "https://zoom.us/j/1234567890",
      notes:
        "Student wants to discuss advanced validation strategies and startup pitching.",
    },
    {
      id: "MT-002",
      packageTitle: "1-on-1 Career Mentoring",
      menteeName: "Sarah Jenkins",
      date: "Jul 14, 2026",
      time: "10:00 - 11:30 WIB",
      status: "upcoming",
      zoomLink: "https://zoom.us/j/0987654321",
      notes: "Reviewing resume and preparing for technical interviews.",
    },
  ];

  const totalNextClasses = bootcampClasses.length + mentoringClasses.length;

  const showBootcamp = activeFilter === "all" || activeFilter === "bootcamp";
  const showMentoring = activeFilter === "all" || activeFilter === "mentoring";

  return (
    <DashboardLayout title="Active Classes">
      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-6 flex items-center gap-5 shadow-lg">
          <div className="w-[60px] h-[60px] rounded-full border-[2px] border-[#148F89] flex items-center justify-center p-1 shrink-0">
            <div className="w-full h-full rounded-full bg-[#1A1128] overflow-hidden">
              <img
                src="/images/pp.png"
                alt="avatar"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="flex flex-col">
            <h2 className="text-white font-bold text-[18px]">Hi Prabroro!</h2>
            <p className="text-[#9CA3AF] text-[13px] leading-relaxed mt-1">
              Ready for your next session?
            </p>
          </div>
        </div>

        <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-6 flex flex-col justify-center shadow-lg">
          <p className="text-[#E2E8F0] font-medium text-[14px]">
            Total Next Classes
          </p>
          <p className="text-[#148F89] font-bold text-[44px] leading-none mt-2">
            {totalNextClasses}
          </p>
        </div>

        <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-6 flex flex-col justify-center shadow-lg">
          <p className="text-[#E2E8F0] font-medium text-[14px]">
            Total Completed
          </p>
          <p className="text-[#148F89] font-bold text-[44px] leading-none mt-2">
            3
          </p>
        </div>
      </div>

      {/* Title & Filters */}
      <div className="flex flex-col gap-5">
        <h2 className="text-[22px] sm:text-[25px] font-bold text-white">
          My Active Classes
        </h2>
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
          {FILTERS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`shrink-0 px-6 py-2.5 rounded-[8px] text-[13px] font-medium capitalize transition-colors ${focusRing} ${
                activeFilter === tab
                  ? "bg-[#2D1B4E] text-white shadow-sm"
                  : "bg-[#170F26] text-[#9CA3AF] border border-[#2D2342] hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* --- INTENSIVE BOOTCAMP (Link ke halaman detail) --- */}
      {showBootcamp && (
        <div className="flex flex-col gap-5">
          <div className="border-l-[4px] border-[#00C6D1] pl-3">
            <h3 className="text-[18px] font-bold text-white">
              Intensive Bootcamp
            </h3>
          </div>
          {bootcampClasses.length === 0 ? (
            <EmptyState message="Belum ada kelas bootcamp yang ditugaskan ke kamu." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {bootcampClasses.map((item) => (
                <Link
                  key={item.id}
                  href={`/mentor/active-classes/${item.id}`}
                  className={`flex flex-col rounded-[12px] overflow-hidden cursor-pointer group shadow-lg hover:shadow-[#148F89]/10 transition-all border border-[#2D2342] hover:border-[#4C1D95] ${focusRing}`}
                >
                  <div
                    className={`h-[140px] bg-gradient-to-br ${item.imageClass} relative`}
                  >
                    <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                      <p className="text-[11px] font-bold text-white tracking-wider">
                        SESSION {item.currentSession}/{item.totalSessions}
                      </p>
                    </div>
                  </div>
                  <div className="bg-[#170F26] p-5 flex flex-col flex-1">
                    <h4 className="font-bold text-[16px] text-white leading-snug group-hover:text-[#148F89] transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[#9CA3AF] text-[12px] mt-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- PRIVATE MENTORING (inline row, BUKAN Link ke halaman lain) --- */}
      {showMentoring && (
        <div className="flex flex-col gap-5">
          <div className="border-l-[4px] border-[#D1D83E] pl-3">
            <h3 className="text-[18px] font-bold text-white">
              Private Mentoring
            </h3>
          </div>
          {mentoringClasses.length === 0 ? (
            <EmptyState message="Belum ada jadwal mentoring privat yang masuk." />
          ) : (
            <div className="flex flex-col gap-4">
              {mentoringClasses.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#170F26] border border-[#2D2342] rounded-[12px] p-5"
                >
                  <div className="flex flex-col gap-1">
                    <h4 className="font-bold text-[15px] text-white">
                      {item.packageTitle}
                    </h4>
                    <p className="text-[#9CA3AF] text-[12px]">
                      Mentee: {item.menteeName}
                    </p>
                    <p className="text-[#9CA3AF] text-[12px]">
                      {item.date} &middot; {item.time}
                    </p>
                    {item.notes && (
                      <p className="text-[#9CA3AF] text-[12px] italic line-clamp-1 max-w-[420px]">
                        &ldquo;{item.notes}&rdquo;
                      </p>
                    )}
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
                        className={`px-4 py-2 rounded-[8px] bg-[#148F89] text-white text-[12px] font-semibold hover:bg-[#117A75] transition-colors whitespace-nowrap ${focusRing}`}
                      >
                        Gabung Sesi
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}