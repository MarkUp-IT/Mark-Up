"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Download,
  PlayCircle,
  FileText,
  Check,
  Clock,
  Users,
  X,
  CalendarClock,
  RotateCcw,
} from "lucide-react";
import DashboardLayout from "@/component/user/DashboardLayout";
import EmptyState from "@/component/user/EmptyState";

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
    label: "Menunggu Jadwal",
    className: "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30",
  },
};

// Batas waktu boleh ajukan refund/ganti jadwal: 3 jam sebelum sesi dimulai.
// Dihitung dari waktu beneran (bukan flag hardcode), biar tombolnya otomatis
// nonaktif sendiri begitu udah lewat dari batas.
const CUTOFF_HOURS = 3;

function hoursUntil(dateTimeStr) {
  if (!dateTimeStr) return -Infinity;
  return (new Date(dateTimeStr).getTime() - Date.now()) / (1000 * 60 * 60);
}

function isActionEligible(session) {
  return (
    session.status === "scheduled" &&
    hoursUntil(session.startTime) > CUTOFF_HOURS
  );
}

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

// Dipakai buat contoh sesi yang sengaja kurang dari 3 jam lagi -- biar
// keadaan "tombol nonaktif" beneran kedemo, bukan cuma teori.
const inTwoHours = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

// --- MOCK DATA (nanti ganti dengan query by id ke product_bootcamp/product_modul/
// product_mentoring, join bootcamp_sessions/mentoring_sessions) ---
const products = {
  "BC-001": {
    type: "bootcamp",
    title: "Winner Class Dan Module (Debate)",
    description:
      "Program intensif buat kamu yang ingin menguasai teknik debat kompetitif, dari dasar motion sampai simulasi penuh melawan lawan tanding.",
    imageClass: "from-[#4C1D95] to-[#0D9488]",
    sessions: [
      {
        title: "Pengenalan Motion & Framework Debat",
        mentor: "Kak Alya Hamidah",
        date: "2 Juni 2026, 19:00 WIB",
        status: "completed",
        recordingUrl: "https://example.com/rekaman/sesi-1",
      },
      {
        title: "Case Building & Argumentasi",
        mentor: "Kak Alya Hamidah",
        date: "9 Juni 2026, 19:00 WIB",
        status: "completed",
        recordingUrl: "https://example.com/rekaman/sesi-2",
      },
      {
        title: "POI (Point of Information) dan Rebuttal",
        mentor: "Kak Adena Laksita",
        date: "16 Juni 2026, 19:00 WIB",
        status: "scheduled",
        meetingLink: "https://meet.google.com/abc-defg-hij",
      },
      {
        title: "Simulasi Debat Penuh & Evaluasi",
        mentor: "Kak Adena Laksita",
        date: null,
        status: "waiting_schedule",
      },
    ],
  },
  "BC-002": {
    type: "bootcamp",
    title: "Winner Class Dan Module (Debate)",
    description:
      "Batch lanjutan untuk pendalaman teknik debat kompetitif tingkat nasional.",
    imageClass: "from-[#4C1D95] to-[#0D9488]",
    sessions: [
      {
        title: "Pengenalan Motion & Framework Debat",
        mentor: "Kak Alya Hamidah",
        date: "5 Juli 2026, 19:00 WIB",
        status: "scheduled",
        meetingLink: "https://meet.google.com/klm-nopq-rst",
      },
      {
        title: "Case Building & Argumentasi",
        mentor: "Kak Alya Hamidah",
        date: null,
        status: "waiting_schedule",
      },
    ],
  },
  "MD-001": {
    type: "modul",
    title: "Masterclass Business Case Competition (BCC)",
    description:
      "Panduan komprehensif memecahkan kasus bisnis dari nol, mulai dari problem solving hingga menyusun winning pitch deck untuk kompetisi.",
    imageClass: "from-[#4C1D95] to-[#2563EB]",
    fileUrl: "https://example.com/modul/masterclass-bcc.pdf",
    resources: [
      "E-Book Panduan Analisis Kasus (50+ Halaman)",
      "10 Winning Pitch Deck Finalis Nasional & Internasional",
      "5 Template Presentasi Kasus Editable (Canva & PPT)",
      "Video Bedah Kasus Eksklusif (45 Menit)",
    ],
    chapters: [
      "Cara melakukan Root Cause Analysis (MECE, Issue Tree)",
      "Pemilihan framework yang tepat (SWOT, Porter's 5 Forces, 4P, dll)",
      "Menyusun strategi solusi dan rencana implementasi (Timeline & Budgeting)",
      "Teknik Storytelling & Visualisasi Data untuk Pitch Deck yang meyakinkan juri",
    ],
  },
  "MT-001": {
    type: "mentoring",
    title: "1-on-1 Career Mentoring",
    description:
      "Bimbingan personal buat matangin CV, LinkedIn, dan strategi karier bareng mentor.",
    imageClass: "from-[#4C1D95] to-[#CA8A04]",
    sessions: [
      {
        id: 1,
        mentor: "Kak Alya Hamidah",
        startTime: "2026-07-25T14:00:00+07:00",
        status: "scheduled",
        zoomLink: "https://zoom.us/j/1234567890",
      },
    ],
  },
  "MT-002": {
    type: "mentoring",
    title: "Bundling PowerPack (Newbie Friendly)",
    description:
      "Paket 3 sesi buat kamu yang baru mulai ikut BCC dari nol, lengkap sama akses deck finalis.",
    imageClass: "from-[#4C1D95] to-[#CA8A04]",
    sessions: [
      {
        id: 1,
        mentor: "Kak Adena Laksita",
        startTime: "2026-06-10T10:00:00+07:00",
        status: "completed",
        recordingUrl: "https://example.com/rekaman/mt002-sesi-1",
      },
      {
        id: 2,
        mentor: "Kak Adena Laksita",
        startTime: inTwoHours,
        status: "scheduled",
        zoomLink: "https://zoom.us/j/1112223333",
      },
      {
        id: 3,
        mentor: "Kak Adena Laksita",
        startTime: null,
        status: "waiting_schedule",
      },
    ],
  },
};

export default function ProductDetail() {
  const params = useParams();
  const product = products[params.id];
  const shouldReduceMotion = useReducedMotion();

  const [actionModal, setActionModal] = useState(null); // { type: "refund"|"reschedule", sessionIndex }
  const [reason, setReason] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false);

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

  const modalMotion = shouldReduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, scale: 0.96, y: 12 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.96, y: 12 },
      };

  const openActionModal = (type, sessionIndex) => {
    setActionModal({ type, sessionIndex });
    setReason("");
    setPreferredDate("");
    setPreferredTime("");
    setActionSuccess(false);
  };

  const closeActionModal = () => setActionModal(null);

  const handleSubmitAction = (e) => {
    e.preventDefault();
    setIsSubmittingAction(true);
    // TODO: panggil API pengajuan refund/reschedule beneran (buat notifikasi
    // ke admin/mentor buat ditindaklanjuti)
    setTimeout(() => {
      setIsSubmittingAction(false);
      setActionSuccess(true);
    }, 900);
  };

  if (!product) {
    return (
      <DashboardLayout title="Detail Produk">
        <Link
          href="/user/my-products"
          className="inline-flex items-center gap-2 text-[#9CA3AF] hover:text-white text-[13px] transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          Kembali ke Produk Saya
        </Link>
        <EmptyState
          message={`Produk dengan ID "${params.id}" tidak ditemukan.`}
          ctaLabel="Lihat Semua Produk"
          ctaHref="/user/my-products"
        />
      </DashboardLayout>
    );
  }

  const hasSessions =
    product.type === "bootcamp" || product.type === "mentoring";
  const completedCount = hasSessions
    ? product.sessions.filter((s) => s.status === "completed").length
    : 0;
  const totalSessions = hasSessions ? product.sessions.length : 0;
  const progressPercent =
    totalSessions > 0 ? Math.round((completedCount / totalSessions) * 100) : 0;

  const typeLabel =
    product.type === "bootcamp"
      ? "Bootcamp"
      : product.type === "mentoring"
        ? "Mentoring"
        : "Modul";

  return (
    <DashboardLayout title="Detail Produk">
      <Link
        href="/user/my-products"
        className="inline-flex items-center gap-2 text-[#9CA3AF] hover:text-white text-[13px] transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        Kembali ke Produk Saya
      </Link>

      {/* Banner -- statis, di atas fold */}
      <div
        className={`rounded-[12px] overflow-hidden bg-gradient-to-br ${product.imageClass} p-6 sm:p-8 flex flex-col gap-2`}
      >
        <span className="self-start px-3 py-1 rounded-full text-[11px] font-semibold bg-white/20 text-white backdrop-blur-sm">
          {typeLabel}
        </span>
        <h2 className="text-white font-bold text-[20px] sm:text-[24px]">
          {product.title}
        </h2>
        <p className="text-white/80 text-[13px] max-w-[600px]">
          {product.description}
        </p>
      </div>

      {hasSessions ? (
        <>
          {/* Progress */}
          <motion.div
            {...sectionReveal}
            className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-6 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold text-[15px]">
                Progres Belajar
              </h3>
              <span className="text-[#148F89] font-bold text-[14px]">
                {completedCount}/{totalSessions} sesi
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#0F081C] overflow-hidden">
              <div
                className="h-full bg-[#148F89] rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </motion.div>

          {/* Daftar Sesi */}
          <div className="flex flex-col gap-4">
            <h3 className="text-white font-semibold text-[15px]">
              Daftar Sesi
            </h3>

            {product.type === "bootcamp" &&
              product.sessions.map((session, idx) => (
                <motion.div
                  key={idx}
                  {...itemReveal(idx)}
                  className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#0F081C] border border-[#2D2342] flex items-center justify-center shrink-0 text-[#9CA3AF] text-[13px] font-semibold">
                      {idx + 1}
                    </div>
                    <div className="flex flex-col gap-1 min-w-0">
                      <h4 className="text-white font-semibold text-[14px] truncate">
                        {session.title}
                      </h4>
                      <p className="text-[#9CA3AF] text-[12px] flex items-center gap-1.5">
                        <Users size={12} />
                        {session.mentor}
                      </p>
                      {session.date && (
                        <p className="text-[#9CA3AF] text-[12px] flex items-center gap-1.5">
                          <Clock size={12} />
                          {session.date}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${statusMeta[session.status].className}`}
                    >
                      {statusMeta[session.status].label}
                    </span>
                    {session.status === "scheduled" && session.meetingLink && (
                      <a
                        href={session.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-[8px] bg-[#148F89] text-white text-[12px] font-semibold hover:bg-[#117A75] transition-colors whitespace-nowrap"
                      >
                        Gabung Sesi
                      </a>
                    )}
                    {session.status === "completed" && session.recordingUrl && (
                      <a
                        href={session.recordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] border border-[#2D2342] text-[#E2E8F0] text-[12px] font-semibold hover:border-[#148F89]/50 hover:text-white transition-colors whitespace-nowrap"
                      >
                        <PlayCircle size={14} />
                        Rekaman
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}

            {product.type === "mentoring" &&
              product.sessions.map((session, idx) => {
                const eligible = isActionEligible(session);
                return (
                  <motion.div
                    key={session.id}
                    {...itemReveal(idx)}
                    className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#0F081C] border border-[#2D2342] flex items-center justify-center shrink-0 text-[#9CA3AF] text-[13px] font-semibold">
                        {idx + 1}
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <h4 className="text-white font-semibold text-[14px]">
                          Sesi {idx + 1}
                        </h4>
                        <p className="text-[#9CA3AF] text-[12px] flex items-center gap-1.5">
                          <Users size={12} />
                          {session.mentor}
                        </p>
                        {session.startTime && (
                          <p className="text-[#9CA3AF] text-[12px] flex items-center gap-1.5">
                            <Clock size={12} />
                            {formatDateTime(session.startTime)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                      <span
                        className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${statusMeta[session.status].className}`}
                      >
                        {statusMeta[session.status].label}
                      </span>

                      {session.status === "scheduled" && session.zoomLink && (
                        <a
                          href={session.zoomLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-[8px] bg-[#148F89] text-white text-[12px] font-semibold hover:bg-[#117A75] transition-colors whitespace-nowrap"
                        >
                          Gabung Sesi
                        </a>
                      )}
                      {session.status === "completed" &&
                        session.recordingUrl && (
                          <a
                            href={session.recordingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] border border-[#2D2342] text-[#E2E8F0] text-[12px] font-semibold hover:border-[#148F89]/50 hover:text-white transition-colors whitespace-nowrap"
                          >
                            <PlayCircle size={14} />
                            Rekaman
                          </a>
                        )}

                      {session.status === "scheduled" &&
                        (eligible ? (
                          <div className="flex items-center gap-2.5 text-[11px]">
                            <button
                              onClick={() => openActionModal("reschedule", idx)}
                              className="flex items-center gap-1 text-[#9CA3AF] hover:text-white underline underline-offset-2 transition-colors"
                            >
                              <CalendarClock size={12} />
                              Ganti Jadwal
                            </button>
                            <span className="text-[#3A3545]">&middot;</span>
                            <button
                              onClick={() => openActionModal("refund", idx)}
                              className="flex items-center gap-1 text-[#9CA3AF] hover:text-[#F87171] underline underline-offset-2 transition-colors"
                            >
                              <RotateCcw size={12} />
                              Ajukan Refund
                            </button>
                          </div>
                        ) : (
                          <p className="text-[#6B7280] text-[11px] italic max-w-[200px] text-right">
                            Refund/ganti jadwal ditutup, kurang dari 3 jam
                            sebelum sesi
                          </p>
                        ))}
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </>
      ) : (
        <>
          {/* Akses File Modul */}
          <motion.div
            {...sectionReveal}
            className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <FileText size={24} className="text-[#148F89] shrink-0" />
              <div>
                <h3 className="text-white font-semibold text-[15px]">
                  Materi Modul
                </h3>
                <p className="text-[#9CA3AF] text-[12px]">
                  Format PDF, akses selamanya
                </p>
              </div>
            </div>
            <a
              href={product.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-[8px] bg-[#148F89] text-white text-[13px] font-semibold hover:bg-[#117A75] transition-colors whitespace-nowrap"
            >
              <Download size={15} />
              Buka / Unduh
            </a>
          </motion.div>

          {product.resources && (
            <motion.div
              {...sectionReveal}
              className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-6 flex flex-col gap-3"
            >
              <h3 className="text-white font-semibold text-[15px]">
                Bonus di Dalamnya
              </h3>
              <ul className="flex flex-col gap-2">
                {product.resources.map((res, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-[#9CA3AF] text-[13px]"
                  >
                    <Check
                      size={15}
                      className="text-[#148F89] shrink-0 mt-0.5"
                    />
                    {res}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {product.chapters && (
            <motion.div
              {...sectionReveal}
              className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-6 flex flex-col gap-3"
            >
              <h3 className="text-white font-semibold text-[15px]">
                Cakupan Materi
              </h3>
              <ol className="flex flex-col gap-3">
                {product.chapters.map((chapter, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-[13px]">
                    <span className="w-6 h-6 rounded-full bg-[#0F081C] border border-[#2D2342] flex items-center justify-center shrink-0 text-[#9CA3AF] text-[11px] font-semibold">
                      {idx + 1}
                    </span>
                    <span className="text-[#E2E8F0] pt-0.5">{chapter}</span>
                  </li>
                ))}
              </ol>
            </motion.div>
          )}
        </>
      )}

      {/* --- MODAL: Ajukan Refund / Ganti Jadwal --- */}
      <AnimatePresence>
        {actionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={closeActionModal}
          >
            <motion.div
              {...modalMotion}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#170F26] w-full max-w-[440px] max-h-[85vh] overflow-y-auto rounded-[16px] border border-[#2D2342] shadow-2xl"
            >
              {actionSuccess ? (
                <div className="p-8 flex flex-col items-center text-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#148F89]/10 border border-[#148F89]/30 flex items-center justify-center">
                    <Check size={26} className="text-[#148F89]" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-[17px]">
                      {actionModal.type === "refund"
                        ? "Pengajuan Refund Terkirim"
                        : "Permintaan Ganti Jadwal Terkirim"}
                    </h3>
                    <p className="text-[#9CA3AF] text-[13px] mt-2 leading-relaxed">
                      {actionModal.type === "refund"
                        ? "Tim kami akan memproses dalam 1-14 hari kerja sesuai Refund Policy, dengan potongan biaya administrasi 10%."
                        : "Mentor akan mengonfirmasi jadwal barumu maksimal 1x24 jam lewat email/WhatsApp."}
                    </p>
                  </div>
                  <button
                    onClick={closeActionModal}
                    className="w-full py-3 rounded-[8px] bg-[#148F89] text-white font-semibold text-[13px] hover:bg-[#117A75] transition-colors mt-2"
                  >
                    Tutup
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitAction}>
                  <div className="sticky top-0 bg-[#170F26] px-6 py-5 border-b border-[#2D2342] flex items-center justify-between">
                    <h3 className="text-white font-bold text-[17px]">
                      {actionModal.type === "refund"
                        ? "Ajukan Refund"
                        : "Ganti Jadwal Sesi"}
                    </h3>
                    <button
                      type="button"
                      onClick={closeActionModal}
                      aria-label="Tutup"
                      className="p-1.5 rounded-[8px] text-[#9CA3AF] hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="p-6 flex flex-col gap-4">
                    {actionModal.type === "refund" ? (
                      <p className="text-[#9CA3AF] text-[12px] bg-[#F59E0B]/5 border border-[#F59E0B]/20 rounded-[8px] px-4 py-3 leading-relaxed">
                        Dana yang disetujui akan dipotong biaya administrasi 10%
                        sesuai{" "}
                        <Link
                          href="/refund-policy"
                          className="text-[#08C7E1] hover:underline"
                        >
                          Refund Policy
                        </Link>{" "}
                        kami.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[#E2E8F0] text-[13px] font-medium">
                            Tanggal Baru
                          </label>
                          <input
                            type="date"
                            value={preferredDate}
                            onChange={(e) => setPreferredDate(e.target.value)}
                            required
                            className="w-full bg-[#0F081C] border border-[#2D2342] rounded-[8px] px-3 py-2.5 text-[13px] text-white outline-none focus:border-[#148F89]/60 transition-colors"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[#E2E8F0] text-[13px] font-medium">
                            Jam
                          </label>
                          <input
                            type="time"
                            value={preferredTime}
                            onChange={(e) => setPreferredTime(e.target.value)}
                            required
                            className="w-full bg-[#0F081C] border border-[#2D2342] rounded-[8px] px-3 py-2.5 text-[13px] text-white outline-none focus:border-[#148F89]/60 transition-colors"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[#E2E8F0] text-[13px] font-medium">
                        {actionModal.type === "refund"
                          ? "Alasan Pengajuan"
                          : "Alasan (opsional)"}
                      </label>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        required={actionModal.type === "refund"}
                        rows={4}
                        placeholder={
                          actionModal.type === "refund"
                            ? "Ceritakan alasanmu mengajukan refund..."
                            : "Kasih tau alasan pindah jadwal (opsional)..."
                        }
                        className="w-full bg-[#0F081C] border border-[#2D2342] rounded-[8px] px-4 py-3 text-[13px] text-white placeholder:text-[#6B7280] outline-none focus:border-[#148F89]/60 transition-colors resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingAction}
                      className="w-full py-3 rounded-[8px] bg-[#148F89] text-white font-semibold text-[13px] hover:bg-[#117A75] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmittingAction
                        ? "Mengirim..."
                        : actionModal.type === "refund"
                          ? "Kirim Pengajuan Refund"
                          : "Kirim Permintaan"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
