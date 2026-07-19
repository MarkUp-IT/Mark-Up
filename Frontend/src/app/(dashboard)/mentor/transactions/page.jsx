"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Search, X } from "lucide-react";
import DashboardLayout from "@/component/mentor/DashboardLayout";
import EmptyState from "@/component/mentor/EmptyState";
import { apiRequest } from "@/lib/api";

const FILTERS = ["Semua", "Sudah Cair", "Belum Cair"];

const statusMeta = {
  paid: {
    listLabel: "Sudah Cair",
    detailLabel: "Sudah Cair",
    bucket: "Sudah Cair",
    className: "bg-[#148F89]/10 text-[#148F89] border border-[#148F89]/30",
  },
  pending: {
    listLabel: "Belum Cair",
    detailLabel: "Menunggu Jadwal Pencairan",
    bucket: "Belum Cair",
    className: "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30",
  },
};

const typeMeta = {
  bootcamp: { label: "Bootcamp", className: "bg-[#0A4A5C] text-[#00C6D1]" },
  mentoring: { label: "Private Mentoring", className: "bg-[#3A3610] text-[#D1D83E]" },
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default function MentorTransactions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const shouldReduceMotion = useReducedMotion() ?? false;

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/api/transactions/me/payouts/");
      setPayouts(res?.payouts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  useEffect(() => {
    document.body.style.overflow = selectedPayout ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [selectedPayout]);

  const sectionReveal = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: shouldReduceMotion ? 0.2 : 0.4 },
    viewport: { once: true },
  };

  const cardReveal = (index) => ({
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: shouldReduceMotion ? 0.2 : 0.4, delay: shouldReduceMotion ? 0 : index * 0.05 },
    viewport: { once: true },
  });

  const modalMotion = shouldReduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : { initial: { opacity: 0, scale: 0.96, y: 12 }, animate: { opacity: 1, scale: 1, y: 0 } };

  const totalPendapatan = payouts
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.net_amount), 0);

  const belumCair = payouts
    .filter((p) => p.status !== "paid")
    .reduce((sum, p) => sum + Number(p.net_amount), 0);

  const now = new Date();
  const pendapatanBulanIni = payouts
    .filter((p) => {
      const d = new Date(p.session_date || p.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, p) => sum + Number(p.net_amount), 0);

  const hasAny = payouts.length > 0;

  const filtered = payouts.filter((p) => {
    const matchesFilter = activeFilter === "Semua" || statusMeta[p.status]?.bucket === activeFilter;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      (p.source_title || "").toLowerCase().includes(query) ||
      p.id.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  const emptyMessage = searchQuery.trim()
    ? `Transaksi dengan kata kunci "${searchQuery}" tidak ditemukan.`
    : `Belum ada transaksi dengan status "${activeFilter}".`;

  return (
    <DashboardLayout title="Transactions">
      <motion.div {...sectionReveal} className="flex flex-col gap-1">
        <h2 className="text-[22px] sm:text-[25px] font-bold text-white">Riwayat Pendapatan</h2>
        <p className="text-[#9CA3AF] text-[13px]">
          Rincian pendapatan dari setiap sesi bootcamp dan mentoring privat yang kamu ajarkan.
        </p>
      </motion.div>

      <motion.div {...sectionReveal} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-6 flex flex-col justify-center shadow-lg">
          <p className="text-[#E2E8F0] font-medium text-[14px]">Total Pendapatan</p>
          <p className="text-[#148F89] font-bold text-[26px] sm:text-[30px] leading-none mt-2">{formatCurrency(totalPendapatan)}</p>
          <p className="text-[#9CA3AF] text-[11px] mt-1.5">Sudah cair</p>
        </div>
        <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-6 flex flex-col justify-center shadow-lg">
          <p className="text-[#E2E8F0] font-medium text-[14px]">Belum Cair</p>
          <p className="text-[#F59E0B] font-bold text-[26px] sm:text-[30px] leading-none mt-2">{formatCurrency(belumCair)}</p>
          <p className="text-[#9CA3AF] text-[11px] mt-1.5">Diproses / menunggu jadwal</p>
        </div>
        <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-6 flex flex-col justify-center shadow-lg">
          <p className="text-[#E2E8F0] font-medium text-[14px]">Pendapatan Bulan Ini</p>
          <p className="text-[#148F89] font-bold text-[26px] sm:text-[30px] leading-none mt-2">{formatCurrency(pendapatanBulanIni)}</p>
          <p className="text-[#9CA3AF] text-[11px] mt-1.5">Semua status</p>
        </div>
      </motion.div>

      {hasAny && (
        <motion.div {...sectionReveal} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-[320px]">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari sesi atau no. transaksi..."
              className="w-full bg-[#170F26] border border-[#2D2342] rounded-[8px] pl-10 pr-4 py-2.5 text-[13px] text-white placeholder:text-[#6B7280] outline-none focus:border-[#148F89]/60 transition-colors"
            />
          </div>
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
            {FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`shrink-0 px-5 py-2.5 rounded-[8px] text-[13px] font-medium transition-colors ${
                  activeFilter === filter
                    ? "bg-[#2D1B4E] text-white shadow-sm"
                    : "bg-[#170F26] text-[#9CA3AF] border border-[#2D2342] hover:text-white"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {!loading && !hasAny ? (
        <EmptyState message="Belum ada riwayat pendapatan. Transaksi akan muncul di sini setelah kamu menyelesaikan sesi mengajar." />
      ) : filtered.length === 0 && !loading ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((p, index) => (
            <motion.button
              key={p.id}
              {...cardReveal(index)}
              onClick={() => setSelectedPayout(p)}
              className="w-full text-left bg-[#170F26] border border-[#2D2342] rounded-[12px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#148F89]/50 transition-colors"
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${typeMeta[p.source_type]?.className}`}>
                    {typeMeta[p.source_type]?.label}
                  </span>
                </div>
                <h4 className="font-bold text-[15px] text-white truncate max-w-[280px] sm:max-w-[360px]">
                  {p.source_title}
                </h4>
                <p className="text-[#9CA3AF] text-[12px]">Tanggal sesi: {formatDate(p.session_date)}</p>
              </div>
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 sm:gap-1.5 shrink-0">
                <span className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${statusMeta[p.status]?.className}`}>
                  {statusMeta[p.status]?.listLabel}
                </span>
                <p className="text-white font-bold text-[16px]">{formatCurrency(p.net_amount)}</p>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {selectedPayout && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setSelectedPayout(null)}
        >
          <motion.div
            {...modalMotion}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#170F26] w-full max-w-[460px] max-h-[85vh] overflow-y-auto rounded-[16px] border border-[#2D2342] shadow-2xl"
          >
            <div className="sticky top-0 bg-[#170F26] px-6 py-5 border-b border-[#2D2342] flex items-center justify-between">
              <h3 className="text-white font-bold text-[17px]">Detail Pendapatan</h3>
              <button
                onClick={() => setSelectedPayout(null)}
                aria-label="Tutup"
                className="p-1.5 rounded-[8px] text-[#9CA3AF] hover:text-white hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className={`self-start px-2.5 py-1 rounded-md text-[10px] font-bold w-fit ${typeMeta[selectedPayout.source_type]?.className}`}>
                    {typeMeta[selectedPayout.source_type]?.label}
                  </span>
                  <h4 className="font-bold text-[17px] text-white leading-snug">{selectedPayout.source_title}</h4>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 ${statusMeta[selectedPayout.status]?.className}`}>
                  {statusMeta[selectedPayout.status]?.detailLabel}
                </span>
              </div>

              <div className="flex flex-col gap-2 text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#9CA3AF]">Tanggal Sesi</span>
                  <span className="text-white font-medium">{formatDate(selectedPayout.session_date)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t border-[#2D2342] text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#9CA3AF]">Pendapatan Kotor</span>
                  <span className="text-white">{formatCurrency(selectedPayout.gross_amount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#9CA3AF]">Potongan Platform ({selectedPayout.fee_percent}%)</span>
                  <span className="text-[#EF4444]">
                    -{formatCurrency(selectedPayout.gross_amount - selectedPayout.net_amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#2D2342]">
                  <span className="text-white font-semibold text-[14px]">Diterima (Net)</span>
                  <span className="text-[#148F89] font-bold text-[18px]">{formatCurrency(selectedPayout.net_amount)}</span>
                </div>
              </div>

              {selectedPayout.status === "paid" ? (
                <p className="text-[#9CA3AF] text-[12px] bg-[#0F081C] border border-[#2D2342] rounded-[8px] px-4 py-3">
                  Dicairkan {formatDate(selectedPayout.paid_at)} ke {selectedPayout.bank_name} •••• {String(selectedPayout.bank_account).slice(-4)}
                </p>
              ) : (
                <p className="text-[#F59E0B] text-[12px] bg-[#F59E0B]/5 border border-[#F59E0B]/20 rounded-[8px] px-4 py-3">
                  Belum dicairkan. Estimasi transfer 1-14 hari kerja setelah sesi selesai diverifikasi.
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </DashboardLayout>
  );
}
