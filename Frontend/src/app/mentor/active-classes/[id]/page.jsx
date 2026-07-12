"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, PlayCircle, Users, Clock } from "lucide-react";
import DashboardLayout from "@/component/mentor/DashboardLayout";
import EmptyState from "@/component/mentor/EmptyState";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#148F89] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F081C]";

function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return null;
  return (
    new Date(dateTimeStr).toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    }) + " WIB"
  );
}

// --- MOCK DATA (nanti ganti dengan query by id: bootcamp_sessions untuk tipe
// bootcamp, mentoring_sessions untuk tipe mentoring) ---
const classes = {
  "BC-001": {
    type: "bootcamp",
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
        recordingUrl: "https://example.com/rekaman/bc001-sesi-2",
      },
      {
        id: 3,
        title: "Ideation & Value Proposition",
        date: "Jul 6, 2026 - 10:00 AM",
        status: "completed",
        recordingUrl: "https://example.com/rekaman/bc001-sesi-3",
      },
      {
        id: 4,
        title: "Market Research & Validation",
        date: "Jul 6, 2026 - 10:00 AM",
        status: "completed",
        recordingUrl: "https://example.com/rekaman/bc001-sesi-4",
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
    type: "bootcamp",
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
        recordingUrl: "https://example.com/rekaman/bc002-sesi-1",
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
  "MT-001": {
    type: "mentoring",
    title: "1-on-1 Career Mentoring — Sarah Jenkins",
    description: "Reviewing resume and preparing for technical interviews.",
    imageClass: "from-[#4C1D95] to-[#CA8A04]",
    menteeName: "Sarah Jenkins",
    sessions: [
      {
        id: 1,
        startTime: "2026-07-14T10:00:00+07:00",
        status: "active",
        zoomLink: "https://zoom.us/j/0987654321",
        menteeNotes: "Reviewing resume and preparing for technical interviews.",
      },
    ],
  },
  "MT-002": {
    type: "mentoring",
    title: "Winner Class Dan Module (Debate) — Affan Fathir D.",
    description:
      "Student wants to discuss advanced validation strategies and startup pitching.",
    imageClass: "from-[#4C1D95] to-[#CA8A04]",
    menteeName: "Affan Fathir D.",
    sessions: [
      {
        id: 1,
        startTime: "2026-06-20T14:00:00+07:00",
        status: "completed",
        recordingUrl: "https://example.com/rekaman/mt002-sesi-1",
      },
      {
        id: 2,
        startTime: "2026-07-12T14:00:00+07:00",
        status: "active",
        zoomLink: "https://zoom.us/j/1234567890",
        menteeNotes:
          "Student wants to discuss advanced validation strategies and startup pitching.",
      },
      {
        id: 3,
        startTime: null,
        status: "waiting_schedule",
      },
    ],
  },
};

function renderSessionButton(status, recordingUrl) {
  switch (status) {
    case "completed":
      if (recordingUrl) {
        return (
          <a
            href={recordingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-5 py-2 rounded-[8px] border border-[#2D2342] text-[#E2E8F0] text-[13px] font-semibold hover:border-[#148F89]/50 hover:text-white transition-colors"
          >
            <PlayCircle size={15} />
            Lihat Rekaman
          </a>
        );
      }
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

export default function ClassDetail() {
  const params = useParams();
  const item = classes[params.id];
  const shouldReduceMotion = useReducedMotion();

  const sectionReveal = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: shouldReduceMotion ? 0.2 : 0.4 },
    viewport: { once: true },
  };

  const itemReveal = (index) => ({
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: {
      duration: shouldReduceMotion ? 0.2 : 0.4,
      delay: shouldReduceMotion ? 0 : index * 0.05,
    },
    viewport: { once: true },
  });

  if (!item) {
    return (
      <DashboardLayout title="Detail Kelas">
        <Link
          href="/mentor/active-classes"
          className="inline-flex items-center gap-2 text-[#9CA3AF] hover:text-white text-[13px] transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          Kembali ke Active Classes
        </Link>
        <EmptyState
          message={`Kelas dengan ID "${params.id}" tidak ditemukan.`}
          ctaLabel="Lihat Semua Kelas"
          ctaHref="/mentor/active-classes"
        />
      </DashboardLayout>
    );
  }

  const isBootcamp = item.type === "bootcamp";

  return (
    <DashboardLayout
      title={isBootcamp ? "Detail Bootcamp" : "Detail Mentoring"}
    >
      <Link
        href="/mentor/active-classes"
        className="inline-flex items-center gap-2 text-[#9CA3AF] hover:text-white text-[13px] transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        Kembali ke Active Classes
      </Link>

      {/* Banner -- statis, di atas fold */}
      <div
        className={`rounded-[12px] overflow-hidden bg-gradient-to-br ${item.imageClass} p-6 sm:p-8 flex flex-col gap-2`}
      >
        <span className="self-start px-3 py-1 rounded-full text-[11px] font-semibold bg-white/20 text-white backdrop-blur-sm">
          {isBootcamp
            ? `Bootcamp · Sesi ${item.currentSession}/${item.totalSessions}`
            : `Mentoring · ${item.menteeName}`}
        </span>
        <h2 className="text-white font-bold text-[20px] sm:text-[24px]">
          {item.title}
        </h2>
        <p className="text-white/80 text-[13px] max-w-[600px]">
          {item.description}
        </p>
      </div>

      {/* Daftar Sesi */}
      <div className="flex flex-col gap-4">
        <h3 className="text-white font-semibold text-[15px]">Daftar Sesi</h3>

        {isBootcamp
          ? item.sessions.map((session, index) => (
              <motion.div
                key={session.id}
                {...itemReveal(index)}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-[12px] border ${
                  session.status === "active"
                    ? "border-[#148F89] bg-[#148F89]/5"
                    : "border-[#2D2342] bg-[#170F26]"
                }`}
              >
                <div className="flex items-center gap-6 min-w-0">
                  <div className="w-[80px] shrink-0">
                    <span className="text-[#E2E8F0] font-bold text-[14px] tracking-wide">
                      SESSION {session.id}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <span
                      className={`font-bold text-[15px] truncate ${
                        session.status === "active"
                          ? "text-white"
                          : "text-[#E2E8F0]"
                      }`}
                    >
                      {session.title}
                    </span>
                    <span className="text-[#9CA3AF] text-[13px]">
                      {session.date}
                    </span>
                  </div>
                </div>
                <div className="self-start sm:self-auto">
                  {renderSessionButton(session.status, session.recordingUrl)}
                </div>
              </motion.div>
            ))
          : item.sessions.map((session, index) => (
              <motion.div
                key={session.id}
                {...itemReveal(index)}
                className={`flex flex-col sm:flex-row sm:items-start justify-between gap-3 p-5 rounded-[12px] border ${
                  session.status === "active"
                    ? "border-[#148F89] bg-[#148F89]/5"
                    : "border-[#2D2342] bg-[#170F26]"
                }`}
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#0F081C] border border-[#2D2342] flex items-center justify-center shrink-0 text-[#9CA3AF] text-[13px] font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-[#E2E8F0] font-bold text-[15px]">
                      Sesi {index + 1}
                    </span>
                    <p className="text-[#9CA3AF] text-[12px] flex items-center gap-1.5">
                      <Users size={12} />
                      {item.menteeName}
                    </p>
                    {session.startTime && (
                      <p className="text-[#9CA3AF] text-[12px] flex items-center gap-1.5">
                        <Clock size={12} />
                        {formatDateTime(session.startTime)}
                      </p>
                    )}
                    {session.menteeNotes && (
                      <p className="text-[#9CA3AF] text-[12px] italic mt-1 max-w-[420px]">
                        &ldquo;{session.menteeNotes}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
                <div className="self-start shrink-0">
                  {renderSessionButton(session.status, session.recordingUrl)}
                </div>
              </motion.div>
            ))}
      </div>
    </DashboardLayout>
  );
}
