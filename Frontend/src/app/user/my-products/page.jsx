"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  FileText,
  MoreVertical,
  X,
  Check,
  Star,
  AlertCircle,
  CalendarClock,
  RotateCcw,
} from "lucide-react";
import DashboardLayout from "@/component/user/DashboardLayout";
import EmptyState from "@/component/user/EmptyState";

const MENTOR_AVAILABILITY = {
  "budi-santoso": [
    { id: "AV1", date: "Senin, 21 Juli 2026", time: "14:00 WIB" },
    { id: "AV2", date: "Rabu, 23 Juli 2026", time: "16:00 WIB" },
    { id: "AV3", date: "Jumat, 25 Juli 2026", time: "10:00 WIB" },
  ],
  "adena-laksita": [
    { id: "AV4", date: "Selasa, 22 Juli 2026", time: "13:00 WIB" },
  ],
};

const FILTERS = ["Semua", "Bootcamp", "Mentoring", "Modul", "Riwayat"];
const CUTOFF_HOURS = 3;

function hoursUntil(dateTimeStr) {
  if (!dateTimeStr) return -Infinity;
  return (new Date(dateTimeStr).getTime() - Date.now()) / (1000 * 60 * 60);
}

const inTwoHours = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return "";
  return (
    new Date(dateTimeStr).toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    }) + " WIB"
  );
}

function ProductCard({
  id,
  title,
  description,
  imageClass,
  badge,
  isCompleted,
  actionsEligible,
  onReschedule,
  onRefund,
  hasRating,
  onRate,
  isMenuOpen,
  onToggleMenu,
}) {
  return (
    <div
      className={`relative h-full flex flex-col rounded-[12px] overflow-hidden border transition-colors ${
        isCompleted
          ? "border-[#2D2342] opacity-80 hover:opacity-100"
          : "border-[#2D2342] hover:border-[#4C1D95]"
      }`}
    >
      <Link
        href={`/user/my-products/${id || ""}`}
        className="flex flex-col flex-1 group"
      >
        <div
          className={`h-[140px] shrink-0 relative ${
            isCompleted
              ? "bg-gradient-to-br from-[#2D2342] to-[#1A1128]"
              : `bg-gradient-to-br ${imageClass || ""}`
          }`}
        >
          <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
            {isCompleted ? (
              <>
                <Check size={11} className="text-[#9CA3AF]" />
                <p className="text-[11px] font-bold text-[#9CA3AF] tracking-wider">
                  SELESAI
                </p>
              </>
            ) : (
              badge
            )}
          </div>
        </div>
        <div className="bg-[#170F26] p-5 flex flex-col flex-1 gap-2">
          <h4
            className={`font-bold text-[16px] leading-snug line-clamp-2 min-h-[44px] transition-colors ${
              isCompleted
                ? "text-[#E2E8F0]"
                : "text-white group-hover:text-[#148F89]"
            }`}
          >
            {title}
          </h4>
          <p className="text-[#9CA3AF] text-[12px] leading-relaxed line-clamp-2">
            {description}
          </p>
        </div>
      </Link>

      {!!isCompleted && (
        <div className="bg-[#170F26] px-5 pb-5 -mt-1">
          {hasRating ? (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] bg-black/20 border border-white/10 text-[#9CA3AF] text-[11px] font-medium w-fit">
              <Star size={12} className="fill-[#F59E0B] text-[#F59E0B]" />
              Sudah dinilai
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                onRate?.();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] bg-[#148F89] text-white text-[11px] font-semibold hover:bg-[#117A75] transition-colors w-fit"
            >
              <Star size={12} />
              Beri Rating
            </button>
          )}
        </div>
      )}

      {!!actionsEligible && (
        <div className="absolute top-3 left-3 z-10">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleMenu?.();
            }}
            className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/60 transition-colors"
            aria-label="Opsi lainnya"
          >
            <MoreVertical size={14} className="text-white" />
          </button>

          {!!isMenuOpen && (
            <div
              className="fixed inset-0 z-10"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleMenu?.();
              }}
            />
          )}
          {!!isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              style={{ width: "170px" }}
              className="absolute top-9 left-0 bg-[#170F26] border border-[#2D2342] rounded-[8px] shadow-xl overflow-hidden z-20"
            >
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onReschedule?.();
                }}
                className="w-full flex items-center gap-2 text-left px-3.5 py-2.5 text-[12px] text-white hover:bg-white/5 transition-colors"
              >
                <CalendarClock size={13} />
                Ganti Jadwal
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRefund?.();
                }}
                className="w-full flex items-center gap-2 text-left px-3.5 py-2.5 text-[12px] text-red-400 hover:bg-white/5 transition-colors border-t border-[#2D2342]"
              >
                <RotateCcw size={13} />
                Ajukan Refund
              </button>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MyProducts() {
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [openMenuId, setOpenMenuId] = useState(null);

  // Amankan penggunaan useReducedMotion agar tidak mengembalikan undefined saat SSR
  const shouldReduceMotion = useReducedMotion() ?? false;

  const [actionModal, setActionModal] = useState(null);
  const [reason, setReason] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false);

  const [ratingProduct, setRatingProduct] = useState(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingText, setRatingText] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratedIds, setRatedIds] = useState([]);

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

  // Hapus properti `exit` jika tidak dibungkus dengan <AnimatePresence>
  // karena ini salah satu pemicu null context error di Framer Motion terbaru
  const modalMotion = shouldReduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : {
        initial: { opacity: 0, scale: 0.96, y: 12 },
        animate: { opacity: 1, scale: 1, y: 0 },
      };

  const bootcampClasses = [
    {
      id: "BC-001",
      title: "Winner Class Dan Module (Debate)",
      description: "Lorem ipsum dolor sit amet, consectetur adipisicing elit",
      imageClass: "from-[#4C1D95] to-[#0D9488]",
      currentSession: 3,
      totalSessions: 4,
      status: "active",
      nextSessionTime: "2026-07-20T19:00:00+07:00",
      mentorId: "budi-santoso",
      mentorName: "Kak Budi Santoso",
      hasRating: false,
    },
    {
      id: "BC-002",
      title: "Frontend Engineering Sprint",
      description: "Lorem ipsum dolor sit amet, consectetur adipisicing elit",
      imageClass: "from-[#4C1D95] to-[#0D9488]",
      currentSession: 1,
      totalSessions: 2,
      status: "active",
      nextSessionTime: inTwoHours,
      mentorId: "budi-santoso",
      mentorName: "Kak Budi Santoso",
      hasRating: false,
    },
    {
      id: "BC-003",
      title: "Public Speaking Bootcamp",
      description: "Program 3 sesi buat ningkatin kemampuan presentasi",
      imageClass: "from-[#4C1D95] to-[#0D9488]",
      status: "completed",
      hasRating: false,
    },
  ];

  const mentoringPackages = [
    {
      id: "MT-001",
      title: "1-on-1 Career Mentoring",
      description: "Bimbingan personal buat matangin CV dan strategi karier.",
      imageClass: "from-[#4C1D95] to-[#CA8A04]",
      currentSession: 1,
      totalSessions: 1,
      status: "active",
      nextSessionTime: "2026-07-25T14:00:00+07:00",
      mentorId: "adena-laksita",
      mentorName: "Kak Adena Laksita",
      hasRating: false,
    },
    {
      id: "MT-002",
      title: "Bundling PowerPack (Newbie Friendly)",
      description: "Paket 3 sesi buat kamu yang baru mulai ikut BCC dari nol.",
      imageClass: "from-[#4C1D95] to-[#CA8A04]",
      currentSession: 2,
      totalSessions: 3,
      status: "active",
      nextSessionTime: "2026-07-18T16:00:00+07:00",
      mentorId: "budi-santoso",
      mentorName: "Kak Budi Santoso",
      hasRating: false,
    },
    {
      id: "MT-003",
      title: "Interview Preparation Session",
      description: "Sesi persiapan interview kerja, dari CV review.",
      imageClass: "from-[#4C1D95] to-[#CA8A04]",
      status: "completed",
      hasRating: true,
    },
  ];

  const moduleClasses = [
    {
      id: "MD-001",
      title: "Winner Class Dan Module (Debate)",
      description: "Lorem ipsum dolor sit amet, consectetur adipisicing elit",
      imageClass: "from-[#4C1D95] to-[#2563EB]",
    },
    {
      id: "MD-002",
      title: "Winner Class Dan Module (Debate)",
      description: "Lorem ipsum dolor sit amet, consectetur adipisicing elit",
      imageClass: "from-[#4C1D95] to-[#2563EB]",
    },
    {
      id: "MD-003",
      title: "Winner Class Dan Module (Debate)",
      description: "Lorem ipsum dolor sit amet, consectetur adipisicing elit",
      imageClass: "from-[#4C1D95] to-[#2563EB]",
    },
  ];

  const activeBootcamps = bootcampClasses.filter(
    (p) => p.status !== "completed",
  );
  const pastBootcamps = bootcampClasses.filter((p) => p.status === "completed");
  const activeMentoring = mentoringPackages.filter(
    (p) => p.status !== "completed",
  );
  const pastMentoring = mentoringPackages.filter(
    (p) => p.status === "completed",
  );

  const stats = [
    { label: "Mentoring Aktif", value: activeMentoring.length },
    { label: "Bootcamp Aktif", value: activeBootcamps.length },
    { label: "Modul Aktif", value: moduleClasses.length },
  ];

  const isRiwayat = activeFilter === "Riwayat";
  const showBootcamp = activeFilter === "Semua" || activeFilter === "Bootcamp";
  const showMentoring =
    activeFilter === "Semua" || activeFilter === "Mentoring";
  const showModul = activeFilter === "Semua" || activeFilter === "Modul";

  const bootcampList = isRiwayat
    ? pastBootcamps
    : showBootcamp
      ? activeBootcamps
      : [];
  const mentoringList = isRiwayat
    ? pastMentoring
    : showMentoring
      ? activeMentoring
      : [];
  const modulList = isRiwayat ? [] : showModul ? moduleClasses : [];

  const openActionModal = (type, product) => {
    setOpenMenuId(null);
    setActionModal({ type, product });
    setReason("");
    setSelectedSlotId("");
    setActionSuccess(false);
  };
  const closeActionModal = () => setActionModal(null);

  const handleSubmitAction = (e) => {
    e.preventDefault();
    if (actionModal?.type === "reschedule" && !selectedSlotId) return;
    setIsSubmittingAction(true);
    setTimeout(() => {
      setIsSubmittingAction(false);
      setActionSuccess(true);
    }, 900);
  };

  const openRatingModal = (product) => {
    setRatingProduct(product);
    setRatingValue(0);
    setRatingText("");
  };
  const closeRatingModal = () => setRatingProduct(null);

  return (
    <DashboardLayout title="My Products">
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

      {!!isRiwayat && (
        <motion.p {...sectionReveal} className="text-[#6B7280] text-[13px]">
          Produk yang udah selesai. Klik kartunya buat lihat rekaman tiap sesi.
        </motion.p>
      )}

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
            isRiwayat ? (
              <EmptyState message="Belum ada bootcamp yang selesai." />
            ) : (
              <EmptyState
                message="Kamu belum punya produk bootcamp."
                ctaLabel="Jelajahi Produk"
                ctaHref="/produk"
              />
            )
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {bootcampList.map((item, index) => {
                const eligible =
                  item.status !== "completed" &&
                  hoursUntil(item.nextSessionTime) > CUTOFF_HOURS;
                return (
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
                      isCompleted={item.status === "completed"}
                      hasRating={!!item.hasRating || ratedIds.includes(item.id)}
                      onRate={() => openRatingModal(item)}
                      actionsEligible={eligible}
                      isMenuOpen={openMenuId === item.id}
                      onToggleMenu={() =>
                        setOpenMenuId(openMenuId === item.id ? null : item.id)
                      }
                      onReschedule={() => openActionModal("reschedule", item)}
                      onRefund={() => openActionModal("refund", item)}
                      badge={
                        item.status !== "completed" ? (
                          <p className="text-[11px] font-bold text-white tracking-wider">
                            SESSION {item.currentSession}/{item.totalSessions}
                          </p>
                        ) : null
                      }
                    />
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {(showMentoring || isRiwayat) && (
        <motion.div {...sectionReveal} className="flex flex-col gap-5">
          <div
            className={`border-l-[4px] pl-3 ${isRiwayat ? "border-[#3A3545]" : "border-[#D1D83E]"}`}
          >
            <h3 className="text-[18px] font-bold text-white">
              On-Demand Mentoring
            </h3>
          </div>
          {mentoringList.length === 0 ? (
            isRiwayat ? (
              <EmptyState message="Belum ada sesi mentoring yang selesai." />
            ) : (
              <EmptyState
                message="Kamu belum punya sesi mentoring."
                ctaLabel="Jelajahi Produk"
                ctaHref="/produk"
              />
            )
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {mentoringList.map((item, index) => {
                const eligible =
                  item.status !== "completed" &&
                  hoursUntil(item.nextSessionTime) > CUTOFF_HOURS;
                return (
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
                      isCompleted={item.status === "completed"}
                      hasRating={!!item.hasRating || ratedIds.includes(item.id)}
                      onRate={() => openRatingModal(item)}
                      actionsEligible={eligible}
                      isMenuOpen={openMenuId === item.id}
                      onToggleMenu={() =>
                        setOpenMenuId(openMenuId === item.id ? null : item.id)
                      }
                      onReschedule={() => openActionModal("reschedule", item)}
                      onRefund={() => openActionModal("refund", item)}
                      badge={
                        item.status !== "completed" ? (
                          <p className="text-[11px] font-bold text-white tracking-wider">
                            SESI {item.currentSession}/{item.totalSessions}
                          </p>
                        ) : null
                      }
                    />
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {showModul && !isRiwayat && (
        <motion.div {...sectionReveal} className="flex flex-col gap-5">
          <div className="border-l-[4px] border-[#B19EEF] pl-3">
            <h3 className="text-[18px] font-bold text-white">
              E-Learning & Modul
            </h3>
          </div>
          {modulList.length === 0 ? (
            <EmptyState
              message="Kamu belum punya modul."
              ctaLabel="Jelajahi Produk"
              ctaHref="/produk"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {modulList.map((item, index) => (
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

      {/* --- MODAL: Refund / Ganti Jadwal --- */}
      {!!actionModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
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
                      : "Permintaan jadwal barumu udah dikirim ke mentor. Begitu dikonfirmasi, jadwal lama otomatis dibatalkan dan slot baru jadi aktif."}
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
                  <div>
                    <h3 className="text-white font-bold text-[16px]">
                      {actionModal.type === "refund"
                        ? "Ajukan Refund"
                        : "Ganti Jadwal"}
                    </h3>
                    <p className="text-[#9CA3AF] text-[12px] mt-0.5">
                      {actionModal.product?.title}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeActionModal}
                    aria-label="Tutup"
                    className="p-1.5 rounded-[8px] text-[#9CA3AF] hover:text-white hover:bg-white/5 transition-colors shrink-0"
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
                    <div className="flex flex-col gap-2">
                      <label className="text-[#E2E8F0] text-[13px] font-medium">
                        Pilih Jadwal Baru — {actionModal.product?.mentorName}
                      </label>

                      {/* Pastikan mentorId valid saat di-map dengan optional chaining */}
                      {(
                        MENTOR_AVAILABILITY[actionModal.product?.mentorId] || []
                      ).length === 0 ? (
                        <p className="text-[#9CA3AF] text-[12px] bg-[#0F081C] border border-[#2D2342] rounded-[8px] px-4 py-3">
                          Belum ada jadwal kosong dari mentor ini saat ini. Coba
                          lagi nanti atau hubungi tim kami.
                        </p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {MENTOR_AVAILABILITY[
                            actionModal.product.mentorId
                          ].map((slot) => (
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
                    disabled={
                      isSubmittingAction ||
                      (actionModal.type === "reschedule" && !selectedSlotId)
                    }
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

      {/* --- MODAL: Beri Rating --- */}
      {!!ratingProduct && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={closeRatingModal}
        >
          <motion.form
            {...modalMotion}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmitRating}
            className="bg-[#170F26] w-full max-w-[420px] rounded-[16px] border border-[#2D2342] shadow-2xl"
          >
            <div className="px-6 py-5 border-b border-[#2D2342] flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-[16px]">
                  Beri Rating
                </h3>
                <p className="text-[#9CA3AF] text-[12px] mt-0.5">
                  {ratingProduct.title}
                </p>
              </div>
              <button
                type="button"
                onClick={closeRatingModal}
                aria-label="Tutup"
                className="p-1.5 rounded-[8px] text-[#9CA3AF] hover:text-white hover:bg-white/5 transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingValue(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      size={32}
                      className={
                        star <= ratingValue
                          ? "fill-[#F59E0B] text-[#F59E0B]"
                          : "text-[#2D2342]"
                      }
                    />
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[#E2E8F0] text-[13px] font-medium">
                  Ulasan (opsional)
                </label>
                <textarea
                  value={ratingText}
                  onChange={(e) => setRatingText(e.target.value)}
                  rows={4}
                  placeholder="Ceritakan pengalamanmu ikut produk ini..."
                  className="w-full bg-[#0F081C] border border-[#2D2342] rounded-[8px] px-4 py-3 text-[13px] text-white placeholder:text-[#6B7280] outline-none focus:border-[#148F89]/60 transition-colors resize-none"
                />
              </div>

              {ratingValue === 0 && (
                <p className="flex items-start gap-2 text-[#F59E0B] text-[11px]">
                  <AlertCircle size={13} className="shrink-0 mt-0.5" />
                  Pilih bintang dulu sebelum kirim ulasan.
                </p>
              )}

              <button
                type="submit"
                disabled={ratingValue === 0 || isSubmittingRating}
                className="w-full py-3 rounded-[8px] bg-[#148F89] text-white font-semibold text-[13px] hover:bg-[#117A75] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingRating ? "Mengirim..." : "Kirim Ulasan"}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </DashboardLayout>
  );
}
