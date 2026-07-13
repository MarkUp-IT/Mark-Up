"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, PlayCircle, Users, Clock } from "lucide-react";
import DashboardLayout from "@/component/mentor/DashboardLayout";
import EmptyState from "@/component/mentor/EmptyState";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#148F89] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F081C]";

// Disamain persis sama bootcamp_session_status & mentoring_session_status
// yang beneran ada di database -- sebelumnya file ini pakai "active"/"locked"
// yang nggak match ENUM manapun (itu konsep UI turunan, bukan status yang
// disimpan).
const statusMeta = {
  completed: {
    label: "Selesai",
    className: "bg-[#148F89]/10 text-[#148F89] border border-[#148F89]/30",
  },
  scheduled: {
    label: "Terjadwal",
    className: "bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/30",
  },
  waiting_schedule: {
    label: "Belum Dijadwalkan",
    className: "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30",
  },
};

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
        startTime: "2026-07-06T10:00:00+07:00",
        status: "completed",
        recordingUrl: "https://example.com/rekaman/bc001-sesi-2",
      },
      {
        id: 3,
        title: "Ideation & Value Proposition",
        startTime: "2026-07-06T10:00:00+07:00",
        status: "completed",
        recordingUrl: "https://example.com/rekaman/bc001-sesi-3",
      },
      {
        id: 4,
        title: "Market Research & Validation",
        startTime: "2026-07-06T10:00:00+07:00",
        status: "completed",
        recordingUrl: "https://example.com/rekaman/bc001-sesi-4",
      },
      {
        id: 5,
        title: "Customer Discovery Interview",
        startTime: "2026-07-20T10:00:00+07:00",
        status: "scheduled",
      },
      {
        id: 6,
        title: "MVP & Prototyping",
        startTime: null,
        status: "waiting_schedule",
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
        startTime: "2026-07-02T08:00:00+07:00",
        status: "completed",
        recordingUrl: "https://example.com/rekaman/bc002-sesi-1",
      },
      {
        id: 2,
        title: "React JS Deep Dive",
        startTime: "2026-07-09T08:00:00+07:00",
        status: "scheduled",
      },
      {
        id: 3,
        title: "Next JS Framework",
        startTime: null,
        status: "waiting_schedule",
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
        status: "scheduled",
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
        status: "scheduled",
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

// isMentoring dipakai buat nyesuain pesan "waiting_schedule" -- buat
// mentoring, itu artinya mentee-nya sendiri yang belum milih jadwal (mentor
// tinggal nunggu, nggak ada aksi yang bisa dilakuin). Buat bootcamp, itu
// jadwal yang emang belum di-set admin.
function renderSessionButton(status, recordingUrl, isMentoring) {
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
          Selesai
        </button>
      );
    case "scheduled":
      return (
        <button
          className={`px-5 py-2 bg-[#148F89] text-white text-[13px] font-bold rounded-[8px] hover:bg-[#117A75] transition-colors shadow-sm ${focusRing}`}
        >
          Join Session
        </button>
      );
    case "waiting_schedule":
      return (
        <p className="text-[#6B7280] text-[12px] italic max-w-[200px] sm:text-right">
          {isMentoring
            ? "Menunggu mentee pilih jadwal"
            : "Jadwal belum di-set admin"}
        </p>
      );
    default:
      return null;
  }
}

export default function ClassDetail() {
  const params = useParams();
  const item = classes[params.id];
  const shouldReduceMotion = useReducedMotion() ?? false;

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
          message={`Kelas dengan ID "${params?.id}" tidak ditemukan.`}
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
        className={`rounded-[12px] overflow-hidden bg-gradient-to-br ${item.imageClass || ""} p-6 sm:p-8 flex flex-col gap-2`}
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
                  session.status === "scheduled"
                    ? "border-[#148F89] bg-[#148F89]/5"
                    : "border-[#2D2342] bg-[#170F26]"
                }`}
              >
                <div className="flex items-center gap-6 min-w-0">
                  <div className="w-[80px] shrink-0">
                    <span className="text-[#E2E8F0] font-bold text-[14px] tracking-wide">
                      SESI {session.id}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <span
                      className={`font-bold text-[15px] truncate ${
                        session.status === "scheduled"
                          ? "text-white"
                          : "text-[#E2E8F0]"
                      }`}
                    >
                      {session.title}
                    </span>
                    {session.startTime && (
                      <span className="text-[#9CA3AF] text-[13px]">
                        {formatDateTime(session.startTime)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap ${statusMeta[session.status]?.className || ""}`}
                  >
                    {statusMeta[session.status]?.label || session.status}
                  </span>
                  {renderSessionButton(
                    session.status,
                    session.recordingUrl,
                    false,
                  )}
                </div>
              </motion.div>
            ))
          : item.sessions.map((session, index) => (
              <motion.div
                key={session.id}
                {...itemReveal(index)}
                className={`flex flex-col sm:flex-row sm:items-start justify-between gap-3 p-5 rounded-[12px] border ${
                  session.status === "scheduled"
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
                <div className="flex items-center gap-3 self-start shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap ${statusMeta[session.status]?.className || ""}`}
                  >
                    {statusMeta[session.status]?.label || session.status}
                  </span>
                  {renderSessionButton(
                    session.status,
                    session.recordingUrl,
                    true,
                  )}
                </div>
              </motion.div>
            ))}
      </div>
    </DashboardLayout>
  );
}
