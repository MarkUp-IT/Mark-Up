"use client";

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

// --- MOCK DATA (nanti ganti dengan query by id ke product_bootcamp/product_modul,
// join bootcamp_sessions + bootcamp_session_mentors untuk tipe bootcamp) ---
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
};

export default function ProductDetail() {
  const params = useParams();
  const product = products[params.id];
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

  const isBootcamp = product.type === "bootcamp";
  const completedCount = isBootcamp
    ? product.sessions.filter((s) => s.status === "completed").length
    : 0;
  const totalSessions = isBootcamp ? product.sessions.length : 0;
  const progressPercent =
    totalSessions > 0 ? Math.round((completedCount / totalSessions) * 100) : 0;

  return (
    <DashboardLayout title="Detail Produk">
      <Link
        href="/user/my-products"
        className="inline-flex items-center gap-2 text-[#9CA3AF] hover:text-white text-[13px] transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        Kembali ke Produk Saya
      </Link>

      {/* Banner -- statis, langsung kelihatan (di atas fold), nggak perlu
          nunggu di-scroll kayak konten di bawahnya */}
      <div
        className={`rounded-[12px] overflow-hidden bg-gradient-to-br ${product.imageClass} p-6 sm:p-8 flex flex-col gap-2`}
      >
        <span className="self-start px-3 py-1 rounded-full text-[11px] font-semibold bg-white/20 text-white backdrop-blur-sm">
          {isBootcamp ? "Bootcamp" : "Modul"}
        </span>
        <h2 className="text-white font-bold text-[20px] sm:text-[24px]">
          {product.title}
        </h2>
        <p className="text-white/80 text-[13px] max-w-[600px]">
          {product.description}
        </p>
      </div>

      {isBootcamp ? (
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
            {product.sessions.map((session, idx) => (
              <motion.div
                key={idx}
                {...itemReveal(idx)}
                className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#0F081C] border border-[#2D2342] flex items-center justify-center shrink-0 text-[#9CA3AF] text-[13px] font-semibold">
                    {idx + 1}
                  </div>
                  <div className="flex flex-col gap-1">
                    <h4 className="text-white font-semibold text-[14px]">
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

          {/* Bonus resource */}
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

          {/* Cakupan materi */}
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
    </DashboardLayout>
  );
}
