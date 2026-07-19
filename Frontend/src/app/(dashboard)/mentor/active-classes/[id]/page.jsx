"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, PlayCircle, Users, Clock } from "lucide-react";
import DashboardLayout from "@/component/mentor/DashboardLayout";
import EmptyState from "@/component/mentor/EmptyState";
import { apiRequest } from "@/lib/api";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#148F89] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F081C]";

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

function renderSessionButton(status, recordingUrl, meetingLink, isMentoring) {
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
      return meetingLink ? (
        <a
          href={meetingLink}
          target="_blank"
          rel="noopener noreferrer"
          className={`px-5 py-2 bg-[#148F89] text-white text-[13px] font-bold rounded-[8px] hover:bg-[#117A75] transition-colors shadow-sm ${focusRing}`}
        >
          Join Session
        </a>
      ) : (
        <p className="text-[#6B7280] text-[12px] italic">Link belum tersedia</p>
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
  const shouldReduceMotion = useReducedMotion() ?? false;
  const [raw, setRaw] = useState({ mentoring: [], bootcamp: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest("/api/mentors/me/sessions/")
      .then((res) => setRaw(res || { mentoring: [], bootcamp: [] }))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const rawId = params?.id || "";
  const isBootcamp = rawId.startsWith("bootcamp-");
  const userLibraryId = rawId.replace(/^(bootcamp|mentoring)-/, "");

  const sessions = useMemo(() => {
    const list = isBootcamp ? raw.bootcamp : raw.mentoring;
    return list
      .filter((s) => s.user_library_id === userLibraryId)
      .sort((a, b) => a.order - b.order);
  }, [raw, isBootcamp, userLibraryId]);

  const itemReveal = (index) => ({
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: {
      duration: shouldReduceMotion ? 0.2 : 0.4,
      delay: shouldReduceMotion ? 0 : index * 0.05,
    },
    viewport: { once: true },
  });

  if (loading) {
    return (
      <DashboardLayout title="Detail Kelas">
        <p className="text-[#6B7280] text-[13px]">Memuat detail kelas...</p>
      </DashboardLayout>
    );
  }

  if (sessions.length === 0) {
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
          message="Kelas ini tidak ditemukan."
          ctaLabel="Lihat Semua Kelas"
          ctaHref="/mentor/active-classes"
        />
      </DashboardLayout>
    );
  }

  const first = sessions[0];
  const menteeName = first.mentee_name;
  const title = isBootcamp ? first.bootcamp_title : first.title;
  const completedSessions = sessions.filter((s) => s.status === "completed").length;

  return (
    <DashboardLayout title={isBootcamp ? "Detail Bootcamp" : "Detail Mentoring"}>
      <Link
        href="/mentor/active-classes"
        className="inline-flex items-center gap-2 text-[#9CA3AF] hover:text-white text-[13px] transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        Kembali ke Active Classes
      </Link>

      <div
        className={`rounded-[12px] overflow-hidden bg-gradient-to-br ${
          isBootcamp ? "from-[#4C1D95] to-[#0D9488]" : "from-[#4C1D95] to-[#CA8A04]"
        } p-6 sm:p-8 flex flex-col gap-2`}
      >
        <span className="self-start px-3 py-1 rounded-full text-[11px] font-semibold bg-white/20 text-white backdrop-blur-sm">
          {isBootcamp
            ? `Bootcamp · Sesi ${completedSessions}/${sessions.length}`
            : `Mentoring · ${menteeName}`}
        </span>
        <h2 className="text-white font-bold text-[20px] sm:text-[24px]">{title}</h2>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-white font-semibold text-[15px]">Daftar Sesi</h3>

        {isBootcamp
          ? sessions.map((session, index) => (
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
                      SESI {session.order}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="font-bold text-[15px] truncate text-white">
                      {session.title}
                    </span>
                    <p className="text-[#9CA3AF] text-[12px] flex items-center gap-1.5">
                      <Users size={12} />
                      {session.mentee_name}
                    </p>
                    {session.start_time && (
                      <span className="text-[#9CA3AF] text-[13px]">
                        {formatDateTime(session.start_time)}
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
                    session.recording_url,
                    session.meeting_link,
                    false,
                  )}
                </div>
              </motion.div>
            ))
          : sessions.map((session, index) => (
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
                    {session.order}
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-[#E2E8F0] font-bold text-[15px]">
                      Sesi {session.order}
                    </span>
                    <p className="text-[#9CA3AF] text-[12px] flex items-center gap-1.5">
                      <Users size={12} />
                      {session.mentee_name}
                    </p>
                    {session.start_time && (
                      <p className="text-[#9CA3AF] text-[12px] flex items-center gap-1.5">
                        <Clock size={12} />
                        {formatDateTime(session.start_time)}
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
                    session.recording_url,
                    session.zoom_link,
                    true,
                  )}
                </div>
              </motion.div>
            ))}
      </div>
    </DashboardLayout>
  );
}
