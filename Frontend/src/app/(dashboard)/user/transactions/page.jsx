"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Search, X } from "lucide-react";
import DashboardLayout from "@/component/user/DashboardLayout";
import EmptyState from "@/component/user/EmptyState";
import { apiRequest } from "@/lib/api";

const FILTERS = ["Semua", "Lunas", "Diproses", "Ditolak"];

const statusMeta = {
  PAID: {
    label: "Lunas",
    bucket: "Lunas",
    className: "bg-[#148F89]/10 text-[#148F89] border border-[#148F89]/30",
  },
  PENDING: {
    label: "Menunggu Verifikasi",
    bucket: "Diproses",
    className: "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30",
  },
  FAILED: {
    label: "Ditolak",
    bucket: "Ditolak",
    className: "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30",
  },
  EXPIRED: {
    label: "Kedaluwarsa",
    bucket: "Ditolak",
    className: "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30",
  },
  REFUNDED: {
    label: "Direfund",
    bucket: "Diproses",
    className: "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30",
  },
};

const typeMeta = {
  BOOTCAMP: { label: "Bootcamp", className: "bg-[#0A4A5C] text-[#00C6D1]" },
  MENTORING: { label: "Mentoring", className: "bg-[#3A3610] text-[#D1D83E]" },
  MODULE: { label: "Modul", className: "bg-[#3B0E76] text-[#B19EEF]" },
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  }) + " WIB";
}

export default function Transactions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [selectedTx, setSelectedTx] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const shouldReduceMotion = useReducedMotion() ?? false;

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/api/transactions/me/transactions/");
      setTransactions(res?.transactions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    document.body.style.overflow = selectedTx ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [selectedTx]);

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

  const totalTransaksi = transactions.length;
  const totalBelanja = transactions
    .filter((t) => t.status === "PAID")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const menungguVerifikasi = transactions
    .filter((t) => t.status === "PENDING")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const hasAny = transactions.length > 0;

  const filtered = transactions.filter((t) => {
    const matchesFilter = activeFilter === "Semua" || statusMeta[t.status]?.bucket === activeFilter;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      (t.product_title || "").toLowerCase().includes(query) ||
      t.transaction_id.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  const emptyMessage = searchQuery.trim()
    ? `Transaksi dengan kata kunci "${searchQuery}" tidak ditemukan.`
    : `Belum ada transaksi dengan status "${activeFilter}".`;

  return (
    <DashboardLayout title="Transaksi">
      <motion.div {...sectionReveal} className="flex flex-col gap-1">
        <h1 className="text-[28px] sm:text-[32px] font-bold text-white leading-tight">Transaksi Saya</h1>
        <p className="text-[#9CA3AF] text-[14px] mt-1">
          Riwayat semua pembelian produk, bootcamp, dan sesi mentoring kamu di Mark-Up.
        </p>
      </motion.div>

      <motion.div {...sectionReveal} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-6 flex flex-col justify-center">
          <p className="text-[#E2E8F0] font-medium text-[14px]">Total Transaksi</p>
          <p className="text-[#148F89] font-bold text-[34px] leading-none mt-2">{totalTransaksi}</p>
        </div>
        <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-6 flex flex-col justify-center">
          <p className="text-[#E2E8F0] font-medium text-[14px]">Total Belanja</p>
          <p className="text-[#148F89] font-bold text-[26px] sm:text-[28px] leading-none mt-2">{formatCurrency(totalBelanja)}</p>
        </div>
        <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-6 flex flex-col justify-center">
          <p className="text-[#E2E8F0] font-medium text-[14px]">Menunggu Verifikasi</p>
          <p className="text-[#F59E0B] font-bold text-[26px] sm:text-[28px] leading-none mt-2">{formatCurrency(menungguVerifikasi)}</p>
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
              placeholder="Cari produk atau no. transaksi..."
              className="w-full bg-[#170F26] border border-[#2D2342] rounded-[8px] pl-10 pr-4 py-2.5 text-[13px] text-white placeholder:text-[#6B7280] outline-none focus:border-[#148F89]/60 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
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
        <EmptyState
          message="Kamu belum punya transaksi. Yuk jelajahi katalog produk kami."
          ctaLabel="Jelajahi Produk"
          ctaHref="/products"
        />
      ) : filtered.length === 0 && !loading ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((tx, index) => (
            <motion.button
              key={tx.transaction_id}
              {...cardReveal(index)}
              onClick={() => setSelectedTx(tx)}
              className="w-full text-left bg-[#170F26] border border-[#2D2342] rounded-[12px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#148F89]/50 transition-colors"
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${typeMeta[tx.product_type]?.className}`}>
                    {typeMeta[tx.product_type]?.label}
                  </span>
                  <span className="text-[#9CA3AF] text-[11px]">{tx.transaction_id}</span>
                </div>
                <h4 className="font-bold text-[15px] text-white truncate max-w-[280px] sm:max-w-[360px]">
                  {tx.product_title}
                </h4>
                <p className="text-[#9CA3AF] text-[12px]">{formatDate(tx.created_at)}</p>
              </div>
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 sm:gap-1.5 shrink-0">
                <span className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${statusMeta[tx.status]?.className}`}>
                  {statusMeta[tx.status]?.label}
                </span>
                <p className="text-white font-bold text-[16px]">{formatCurrency(tx.amount)}</p>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {selectedTx && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setSelectedTx(null)}
        >
          <motion.div
            {...modalMotion}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#170F26] w-full max-w-[460px] max-h-[85vh] overflow-y-auto rounded-[16px] border border-[#2D2342] shadow-2xl"
          >
            <div className="sticky top-0 bg-[#170F26] px-6 py-5 border-b border-[#2D2342] flex items-center justify-between">
              <h3 className="text-white font-bold text-[17px]">Detail Transaksi</h3>
              <button
                onClick={() => setSelectedTx(null)}
                aria-label="Tutup"
                className="p-1.5 rounded-[8px] text-[#9CA3AF] hover:text-white hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className={`self-start px-2.5 py-1 rounded-md text-[10px] font-bold w-fit ${typeMeta[selectedTx.product_type]?.className}`}>
                    {typeMeta[selectedTx.product_type]?.label}
                  </span>
                  <h4 className="font-bold text-[17px] text-white leading-snug">{selectedTx.product_title}</h4>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 ${statusMeta[selectedTx.status]?.className}`}>
                  {statusMeta[selectedTx.status]?.label}
                </span>
              </div>

              <div className="flex flex-col gap-2 text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#9CA3AF]">No. Transaksi</span>
                  <span className="text-white font-medium">{selectedTx.transaction_id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#9CA3AF]">Tanggal</span>
                  <span className="text-white font-medium">{formatDate(selectedTx.created_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#9CA3AF]">Metode Pembayaran</span>
                  <span className="text-white font-medium">{selectedTx.method}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t border-[#2D2342] text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold">Total</span>
                  <span className="text-[#148F89] font-bold text-[18px]">{formatCurrency(selectedTx.amount)}</span>
                </div>
              </div>

              {selectedTx.status === "PENDING" && (
                <p className="text-center text-[#F59E0B] text-[12px] bg-[#F59E0B]/5 border border-[#F59E0B]/20 rounded-[8px] px-4 py-3">
                  Bukti transfer udah kami terima, sedang diverifikasi tim kami (maksimal 1x24 jam).
                </p>
              )}
              {selectedTx.proof_of_payment && (
                <a
                  href={selectedTx.proof_of_payment}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-center py-3 rounded-[8px] border border-[#2D2342] text-[#E2E8F0] font-semibold text-[13px] hover:border-[#148F89]/50 hover:text-white transition-colors block"
                >
                  Lihat Bukti Pembayaran
                </a>
              )}
              {(selectedTx.status === "FAILED" || selectedTx.status === "EXPIRED") && (
                <Link
                  href="/products"
                  className="w-full text-center py-3 rounded-[8px] bg-[#148F89] text-white font-semibold text-[13px] hover:bg-[#117A75] transition-colors block"
                >
                  Beli Lagi
                </Link>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </DashboardLayout>
  );
}
