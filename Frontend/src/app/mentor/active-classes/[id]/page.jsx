"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import DashboardLayout from "@/component/mentor/DashboardLayout";
import EmptyState from "@/component/mentor/EmptyState";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#148F89] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F081C]";

// --- MOCK DATA (nanti ganti dengan query bootcamp_sessions by bootcamp id) ---
// Halaman ini khusus untuk tipe Bootcamp -- Private Mentoring sengaja TIDAK
// punya halaman detail sendiri, tampil inline di /mentor/active-classes.
const bootcamps = {
  "BC-001": {
    title: "Winner Class Dan Module (Debate)",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor.",
    imageClass: "from-[#4C1D95] to-[#0D9488]",
    currentSession: 5,
    totalSessions: 8,
    sessions: [
      {
        id: 2,
        title: "Introduction to Startup Ecosystem",
        date: "Jul 6, 2026 - 10:00 AM",
        status: "completed",
      },
      {
        id: 3,
        title: "Ideation & Value Proposition",
        date: "Jul 6, 2026 - 10:00 AM",
        status: "completed",
      },
      {
        id: 4,
        title: "Market Research & Validation",
        date: "Jul 6, 2026 - 10:00 AM",
        status: "completed",
      },
      {
        id: 5,
        title: "Market Research & Validation",
        date: "Jul 6, 2026 - 10:00 AM",
        status: "active",
      },
      {
        id: 6,
        title: "Market Research & Validation",
        date: "Jul 6, 2026 - 10:00 AM",
        status: "locked",
      },
    ],
  },
  "BC-002": {
    title: "Frontend Engineering Sprint",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor.",
    imageClass: "from-[#4C1D95] to-[#0D9488]",
    currentSession: 2,
    totalSessions: 6,
    sessions: [
      {
        id: 1,
        title: "HTML & CSS Fundamentals",
        date: "Jul 2, 2026 - 08:00 AM",
        status: "completed",
      },
      {
        id: 2,
        title: "React JS Deep Dive",
        date: "Jul 9, 2026 - 08:00 AM",
        status: "active",
      },
      {
        id: 3,
        title: "Next JS Framework",
        date: "Jul 16, 2026 - 08:00 AM",
        status: "locked",
      },
    ],
  },
};

function renderSessionButton(status) {
  switch (status) {
    case "completed":
      return (
        <button
          disabled
          className="px-5 py-2 bg-[#2D2342] text-[#9CA3AF] text-[13px] font-medium rounded-[8px] cursor-not-allowed"
        >
          Completed
        </button>
      );
    case "active":
      return (
        <button
          className={`px-5 py-2 bg-[#148F89] text-white text-[13px] font-bold rounded-[8px] hover:bg-[#117A75] transition-colors shadow-sm ${focusRing}`}
        >
          Join Session
        </button>
      );
    case "locked":
      return (
        <button
          disabled
          className="px-5 py-2 bg-[#2D2342] text-[#9CA3AF] text-[13px] font-medium rounded-[8px] cursor-not-allowed"
        >
          Room Unavailable
        </button>
      );
    default:
      return null;
  }
}

export default function BootcampDetail() {
  const params = useParams();
  const bootcamp = bootcamps[params.id];

  if (!bootcamp) {
    return (
      <DashboardLayout title="Detail Bootcamp">
        <Link
          href="/mentor/active-classes"
          className="inline-flex items-center gap-2 text-[#9CA3AF] hover:text-white text-[13px] transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          Kembali ke Active Classes
        </Link>
        <EmptyState
          message={`Bootcamp dengan ID "${params.id}" tidak ditemukan.`}
          ctaLabel="Lihat Semua Kelas"
          ctaHref="/mentor/active-classes"
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Detail Bootcamp">
      <Link
        href="/mentor/active-classes"
        className="inline-flex items-center gap-2 text-[#9CA3AF] hover:text-white text-[13px] transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        Kembali ke Active Classes
      </Link>

      {/* Banner */}
      <div
        className={`rounded-[12px] overflow-hidden bg-gradient-to-br ${bootcamp.imageClass} p-6 sm:p-8 flex flex-col gap-2`}
      >
        <span className="self-start px-3 py-1 rounded-full text-[11px] font-semibold bg-white/20 text-white backdrop-blur-sm">
          Bootcamp &middot; Sesi {bootcamp.currentSession}/{bootcamp.totalSessions}
        </span>
        <h2 className="text-white font-bold text-[20px] sm:text-[24px]">
          {bootcamp.title}
        </h2>
        <p className="text-white/80 text-[13px] max-w-[600px]">
          {bootcamp.description}
        </p>
      </div>

      {/* Daftar Sesi */}
      <div className="flex flex-col gap-4">
        <h3 className="text-white font-semibold text-[15px]">Daftar Sesi</h3>
        {bootcamp.sessions.map((session) => (
          <div
            key={session.id}
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-[12px] border ${
              session.status === "active"
                ? "border-[#148F89] bg-[#148F89]/5"
                : "border-[#2D2342] bg-[#170F26]"
            }`}
          >
            <div className="flex items-center gap-6">
              <div className="w-[80px] shrink-0">
                <span className="text-[#E2E8F0] font-bold text-[14px] tracking-wide">
                  SESSION {session.id}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span
                  className={`font-bold text-[15px] ${
                    session.status === "active" ? "text-white" : "text-[#E2E8F0]"
                  }`}
                >
                  {session.title}
                </span>
                <span className="text-[#9CA3AF] text-[13px]">{session.date}</span>
              </div>
            </div>
            <div className="self-start sm:self-auto">
              {renderSessionButton(session.status)}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}