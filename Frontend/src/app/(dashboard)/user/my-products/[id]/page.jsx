"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
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
  AlertCircle,
  MoreVertical,
} from "lucide-react";
import DashboardLayout from "@/component/user/DashboardLayout";
import EmptyState from "@/component/user/EmptyState";
import { apiRequest } from "@/lib/api";

const statusMeta = {
  completed: {
    label: "Selesai",
    className: "bg-[#148F89]/10 text-[#148F89] border border-[#148F89]/30",
  },
  scheduled: {
    label: "Terjadwal",
    className: "bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/30",
  },
  // Sengaja BUKAN "Menunggu Jadwal" -- itu kesannya pasif kayak nunggu orang
  // lain. Padahal user sendiri yang harus milih jadwalnya (lihat tombol
  // "Pilih Jadwal" di action area), jadi labelnya dibikin netral aja.
  waiting_schedule: {
    label: "Belum Dijadwalkan",
    className: "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30",
  },
};

const CUTOFF_HOURS = 3;

function hoursUntil(dateTimeStr) {
  if (!dateTimeStr) return -Infinity;
  return (new Date(dateTimeStr).getTime() - Date.now()) / (1000 * 60 * 60);
}

function isRescheduleEligible(session) {
  return (
    session?.status === "scheduled" &&
    hoursUntil(session?.startTime) > CUTOFF_HOURS
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

function mapSession(raw) {
  return {
    id: raw.id,
    order: raw.order,
    title: raw.title,
    mentor: raw.mentor,
    mentorId: raw.mentor_id,
    startTime: raw.start_time,
    status: raw.status,
    meetingLink: raw.meeting_link,
    zoomLink: raw.zoom_link,
    recordingUrl: raw.recording_url,
  };
}

function mapProductDetail(raw) {
  return {
    type: raw.type,
    title: raw.title,
    description: raw.description,
    imageClass: "from-[#4A2CA1] to-[#17A9D4]",
    sessions: raw.sessions?.map(mapSession),
    fileUrl: raw.file_url,
    resources: raw.resources,
    chapters: raw.chapters,
  };
}

export default function ProductDetail() {


  const params = useParams();
  const [product, setProduct] = useState(null);


  useEffect(() => {
      fetchDetail();
  }, []);

  async function fetchDetail() {
    setLoading(true);

    try {
        const res = await apiRequest(
            `/api/products/my-products/${params.id}/`
        );

        setProduct(mapProductDetail(res));
    } finally {
        setLoading(false);
    }
}

  const shouldReduceMotion = useReducedMotion() ?? false;

  // --- Refund (satu-satunya, level produk, bukan per-sesi) ---
  const [refundMenuOpen, setRefundMenuOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [refundSuccess, setRefundSuccess] = useState(false);

  // --- Pilih Jadwal / Ganti Jadwal (per-sesi) ---
  const [scheduleModal, setScheduleModal] = useState(null); // { session, sessionKey, isInitial }
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [openSessionMenuKey, setOpenSessionMenuKey] = useState(null);
  const [loading, setLoading] = useState(true);

  

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

  // Nggak pakai <AnimatePresence>/prop `exit` -- itu yang kemarin bikin
  // crash "reading 'type' of null". Modal muncul/hilang langsung.
  const modalMotion = shouldReduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : {
        initial: { opacity: 0, scale: 0.96, y: 12 },
        animate: { opacity: 1, scale: 1, y: 0 },
      };

  

  if (loading) {
    return (
      <DashboardLayout title="Detail Produk">
        <Link
          href="/user/my-products"
          className="inline-flex items-center gap-2 text-[#9CA3AF] hover:text-white text-[13px] transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          Kembali ke Produk Saya
        </Link>
        <div className="text-center py-12">
          <p className="text-[#9CA3AF] text-[13px]">Memuat data produk...</p>
        </div>
      </DashboardLayout>
    );
  }

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
          message={`Produk dengan ID "${params?.id}" tidak ditemukan.`}
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

  // Eligibility refund LEVEL PRODUK: dihitung dari sesi terjadwal PALING
  // DEKAT. Kalau belum ada sesi yang dijadwalin sama sekali, refund selalu
  // boleh (belum ada yang "mepet waktu"). Modul nggak pernah nampilin ini
  // sama sekali (instant delivery, nggak bisa di-refund per kebijakan).
  const nextScheduled = hasSessions
    ? product.sessions
        .filter((s) => s.status === "scheduled" && s.startTime)
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))[0]
    : null;
  const refundEligible =
    !nextScheduled || hoursUntil(nextScheduled.startTime) > CUTOFF_HOURS;

  const openScheduleModal = (session, sessionKey, isInitial) => {
    setOpenSessionMenuKey(null);
    setScheduleModal({ session, sessionKey, isInitial });
    setSelectedSlotId("");
    setScheduleSuccess(false);
    setAvailableSlots([]);
    setSlotsError("");

    if (session.mentorId) {
      setSlotsLoading(true);
      apiRequest(`/api/mentors/${session.mentorId}/availability/`, { auth: false })
        .then((res) => setAvailableSlots(res?.availability || []))
        .catch((err) => setSlotsError(err?.message || "Gagal memuat jadwal mentor."))
        .finally(() => setSlotsLoading(false));
    }
  };
  const closeScheduleModal = () => setScheduleModal(null);

  const handleSubmitSchedule = async (e) => {
    e.preventDefault();

    setScheduleSubmitting(true);

    try {
      await apiRequest(
        `/api/products/my-products/sessions/${scheduleModal.session.id}/schedule/`,
        {
          method: "POST",
          body: {
            session_type: "mentoring",
            availability_slot_id: selectedSlotId,
          },
        }
      );

      await fetchDetail();

      setScheduleSuccess(true);
    } finally {
      setScheduleSubmitting(false);
    }
  };

  const openRefundModal = () => {
    setRefundMenuOpen(false);
    setRefundModalOpen(true);
    setRefundReason("");
    setRefundSuccess(false);
  };
  const closeRefundModal = () => setRefundModalOpen(false);

  const handleSubmitRefund = async (e) => {
    e.preventDefault();

    setRefundSubmitting(true);

    try {
      await apiRequest(
        `/api/products/my-products/${params.id}/refund/`,
        {
          method: "POST",
          body: {
            reason: refundReason,
          },
        }
      );

      setRefundSuccess(true);
    } finally {
      setRefundSubmitting(false);
    }
  };

  // Area aksi per-sesi -- BEDA PERLAKUAN antara bootcamp & mentoring:
  //
  // Bootcamp: jadwalnya diatur ADMIN, user cuma bisa Daftar (implisit,
  // udah beli) -> Join Sesi -> atau Ajukan Refund (level produk). User
  // SAMA SEKALI nggak bisa pilih/ganti jadwal sendiri di sini.
  //
  // Mentoring: 1-on-1, user emang yang milih jadwalnya sendiri dari slot
  // yang dibuka mentor -- jadi "Pilih Jadwal"/"Ganti Jadwal" cuma muncul
  // di sini.
  const renderSessionAction = (session, sessionKey, productType) => {
    if (session.status === "waiting_schedule") {
      if (productType === "bootcamp") {
        // Bukan tombol -- ini bukan aksi yang bisa user lakuin, cuma info.
        return (
          <span className="text-[#6B7280] text-[11px] italic whitespace-nowrap">
            Menunggu jadwal dari admin
          </span>
        );
      }
      return (
        <button
          onClick={() => openScheduleModal(session, sessionKey, true)}
          className="px-4 py-2 rounded-[8px] bg-[#148F89] text-white text-[12px] font-semibold hover:bg-[#117A75] transition-colors whitespace-nowrap"
        >
          Pilih Jadwal
        </button>
      );
    }

    if (session.status === "completed") {
      return session.recordingUrl ? (
        <a
          href={session.recordingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] border border-[#2D2342] text-[#E2E8F0] text-[12px] font-semibold hover:border-[#148F89]/50 hover:text-white transition-colors whitespace-nowrap"
        >
          <PlayCircle size={14} />
          Rekaman
        </a>
      ) : null;
    }

    // status === "scheduled"
    const joinLink = session.meetingLink || session.zoomLink;
    const eligible =
      productType === "mentoring" && isRescheduleEligible(session);
    const isMenuOpen = openSessionMenuKey === sessionKey;

    return (
      <div className="flex items-center gap-2">
        {joinLink && (
          <a
            href={joinLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-[8px] bg-[#148F89] text-white text-[12px] font-semibold hover:bg-[#117A75] transition-colors whitespace-nowrap"
          >
            Gabung Sesi
          </a>
        )}
        {eligible && (
          <div className="relative">
            <button
              onClick={() =>
                setOpenSessionMenuKey(isMenuOpen ? null : sessionKey)
              }
              className="w-8 h-8 rounded-[8px] border border-[#2D2342] flex items-center justify-center hover:border-[#148F89]/50 transition-colors"
              aria-label="Opsi sesi"
            >
              <MoreVertical size={14} className="text-[#9CA3AF]" />
            </button>
            {isMenuOpen && (
              <div
                className="fixed inset-0 z-10"
                onClick={() => setOpenSessionMenuKey(null)}
              />
            )}
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                style={{ width: "160px" }}
                className="absolute top-9 right-0 bg-[#170F26] border border-[#2D2342] rounded-[8px] shadow-xl overflow-hidden z-20"
              >
                <button
                  onClick={() => openScheduleModal(session, sessionKey, false)}
                  className="w-full flex items-center gap-2 text-left px-3.5 py-2.5 text-[12px] text-white hover:bg-white/5 transition-colors"
                >
                  <CalendarClock size={13} />
                  Ganti Jadwal
                </button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout title="Detail Produk">
      <Link
        href="/user/my-products"
        className="inline-flex items-center gap-2 text-[#9CA3AF] hover:text-white text-[13px] transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        Kembali ke Produk Saya
      </Link>

      {/* Banner -- titik-tiga refund (LEVEL PRODUK, cuma 1) di pojok kanan atas */}
      <div
        className={`relative rounded-[12px] overflow-hidden bg-gradient-to-br ${product.imageClass || ""} p-6 sm:p-8 flex flex-col gap-2`}
      >
        <div className="flex items-start justify-between gap-3">
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/20 text-white backdrop-blur-sm w-fit">
            {typeLabel}
          </span>

          {hasSessions && (
            <div className="relative shrink-0">
              <button
                onClick={() => setRefundMenuOpen((v) => !v)}
                className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/50 transition-colors"
                aria-label="Opsi produk"
              >
                <MoreVertical size={16} className="text-white" />
              </button>
              {refundMenuOpen && (
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setRefundMenuOpen(false)}
                />
              )}
              {refundMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  style={{ width: "170px" }}
                  className="absolute top-10 right-0 bg-[#170F26] border border-[#2D2342] rounded-[8px] shadow-xl overflow-hidden z-20"
                >
                  <button
                    onClick={openRefundModal}
                    className="w-full flex items-center gap-2 text-left px-3.5 py-2.5 text-[12px] text-red-400 hover:bg-white/5 transition-colors"
                  >
                    <RotateCcw size={13} />
                    Ajukan Refund
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </div>

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
              product.sessions.map((session, idx) => {
                const sessionKey = `bc-${idx}`;
                return (
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
                        {session.startTime && (
                          <p className="text-[#9CA3AF] text-[12px] flex items-center gap-1.5">
                            <Clock size={12} />
                            {formatDateTime(session.startTime)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${statusMeta[session.status]?.className || ""}`}
                      >
                        {statusMeta[session.status]?.label || session.status}
                      </span>
                      {renderSessionAction(session, sessionKey, "bootcamp")}
                    </div>
                  </motion.div>
                );
              })}

            {product.type === "mentoring" &&
              product.sessions.map((session, idx) => {
                const sessionKey = `mt-${idx}`;
                return (
                  <motion.div
                    key={session.id ?? idx}
                    {...itemReveal(idx)}
                    className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
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
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${statusMeta[session.status]?.className || ""}`}
                      >
                        {statusMeta[session.status]?.label || session.status}
                      </span>
                      {renderSessionAction(session, sessionKey, "mentoring")}
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </>
      ) : (
        <>
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

      {/* --- MODAL: Pilih Jadwal / Ganti Jadwal (per-sesi) --- */}
      {!!scheduleModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={closeScheduleModal}
        >
          <motion.div
            {...modalMotion}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#170F26] w-full max-w-[420px] max-h-[85vh] overflow-y-auto rounded-[16px] border border-[#2D2342] shadow-2xl"
          >
            {scheduleSuccess ? (
              <div className="p-8 flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#148F89]/10 border border-[#148F89]/30 flex items-center justify-center">
                  <Check size={26} className="text-[#148F89]" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-[17px]">
                    Jadwal Berhasil{" "}
                    {scheduleModal.isInitial ? "Dipilih" : "Diubah"}
                  </h3>
                  <p className="text-[#9CA3AF] text-[13px] mt-2 leading-relaxed">
                    Jadwal langsung aktif — mentor emang udah bersedia di slot
                    yang kamu pilih. Link sesinya bisa langsung kamu pakai pas
                    waktunya tiba.
                  </p>
                </div>
                <button
                  onClick={closeScheduleModal}
                  className="w-full py-3 rounded-[8px] bg-[#148F89] text-white font-semibold text-[13px] hover:bg-[#117A75] transition-colors mt-2"
                >
                  Tutup
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitSchedule}>
                <div className="sticky top-0 bg-[#170F26] px-6 py-5 border-b border-[#2D2342] flex items-center justify-between">
                  <h3 className="text-white font-bold text-[16px]">
                    {scheduleModal.isInitial ? "Pilih Jadwal" : "Ganti Jadwal"}
                  </h3>
                  <button
                    type="button"
                    onClick={closeScheduleModal}
                    aria-label="Tutup"
                    className="p-1.5 rounded-[8px] text-[#9CA3AF] hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-6 flex flex-col gap-3">
                  <label className="text-[#E2E8F0] text-[13px] font-medium">
                    Slot tersedia — {scheduleModal.session?.mentor}
                  </label>
                  {slotsLoading ? (
                    <p className="text-[#9CA3AF] text-[12px] bg-[#0F081C] border border-[#2D2342] rounded-[8px] px-4 py-3">
                      Memuat jadwal mentor...
                    </p>
                  ) : slotsError ? (
                    <p className="text-[#F87171] text-[12px] bg-[#0F081C] border border-[#2D2342] rounded-[8px] px-4 py-3">
                      {slotsError}
                    </p>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-[#9CA3AF] text-[12px] bg-[#0F081C] border border-[#2D2342] rounded-[8px] px-4 py-3">
                      Belum ada jadwal kosong dari mentor ini saat ini. Coba
                      lagi nanti atau hubungi tim kami.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setSelectedSlotId(slot.id)}
                          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-[8px] border text-left transition-colors ${
                            selectedSlotId === slot.id
                              ? "border-[#148F89] bg-[#148F89]/10"
                              : "border-[#2D2342] hover:border-[#148F89]/50"
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="text-white text-[13px] font-semibold">
                              {slot.date}
                            </span>
                            <span className="text-[#9CA3AF] text-[12px]">
                              {slot.time}
                            </span>
                          </div>
                          {selectedSlotId === slot.id && (
                            <Check
                              size={16}
                              className="text-[#148F89] shrink-0"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!selectedSlotId || scheduleSubmitting}
                    className="w-full py-3 rounded-[8px] bg-[#148F89] text-white font-semibold text-[13px] hover:bg-[#117A75] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                  >
                    {scheduleSubmitting ? "Menyimpan..." : "Konfirmasi Jadwal"}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* --- MODAL: Ajukan Refund (level produk, cuma 1) --- */}
      {refundModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={closeRefundModal}
        >
          <motion.div
            {...modalMotion}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#170F26] w-full max-w-[420px] rounded-[16px] border border-[#2D2342] shadow-2xl"
          >
            {refundSuccess ? (
              <div className="p-8 flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#148F89]/10 border border-[#148F89]/30 flex items-center justify-center">
                  <Check size={26} className="text-[#148F89]" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-[17px]">
                    Pengajuan Refund Terkirim
                  </h3>
                  <p className="text-[#9CA3AF] text-[13px] mt-2 leading-relaxed">
                    Tim kami akan memproses dalam 1-14 hari kerja sesuai Refund
                    Policy, dengan potongan biaya administrasi 10%.
                  </p>
                </div>
                <button
                  onClick={closeRefundModal}
                  className="w-full py-3 rounded-[8px] bg-[#148F89] text-white font-semibold text-[13px] hover:bg-[#117A75] transition-colors mt-2"
                >
                  Tutup
                </button>
              </div>
            ) : (
              <>
                <div className="px-6 py-5 border-b border-[#2D2342] flex items-center justify-between">
                  <h3 className="text-white font-bold text-[16px]">
                    Ajukan Refund
                  </h3>
                  <button
                    onClick={closeRefundModal}
                    aria-label="Tutup"
                    className="p-1.5 rounded-[8px] text-[#9CA3AF] hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {!refundEligible ? (
                  <div className="p-6 flex flex-col gap-4">
                    <p className="flex items-start gap-2 text-[#F59E0B] text-[12px] bg-[#F59E0B]/5 border border-[#F59E0B]/20 rounded-[8px] px-4 py-3 leading-relaxed">
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      Refund ditutup — sesi berikutnya kurang dari 3 jam lagi.
                      Coba ajukan lagi setelah sesi itu lewat.
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSubmitRefund}
                    className="p-6 flex flex-col gap-4"
                  >
                    <p className="text-[#9CA3AF] text-[12px] bg-[#F59E0B]/5 border border-[#F59E0B]/20 rounded-[8px] px-4 py-3 leading-relaxed">
                      Ini bakal ngajuin refund buat SELURUH produk ini, dana
                      yang disetujui dipotong biaya administrasi 10% sesuai{" "}
                      <Link
                        href="/refund-policy"
                        className="text-[#08C7E1] hover:underline"
                      >
                        Refund Policy
                      </Link>{" "}
                      kami.
                    </p>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[#E2E8F0] text-[13px] font-medium">
                        Alasan Pengajuan
                      </label>
                      <textarea
                        value={refundReason}
                        onChange={(e) => setRefundReason(e.target.value)}
                        required
                        rows={4}
                        placeholder="Ceritakan alasanmu mengajukan refund..."
                        className="w-full bg-[#0F081C] border border-[#2D2342] rounded-[8px] px-4 py-3 text-[13px] text-white placeholder:text-[#6B7280] outline-none focus:border-[#148F89]/60 transition-colors resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={refundSubmitting}
                      className="w-full py-3 rounded-[8px] bg-[#148F89] text-white font-semibold text-[13px] hover:bg-[#117A75] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {refundSubmitting
                        ? "Mengirim..."
                        : "Kirim Pengajuan Refund"}
                    </button>
                  </form>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </DashboardLayout>
  );
}
