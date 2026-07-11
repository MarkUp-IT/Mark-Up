"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Search, X } from "lucide-react";
import DashboardLayout from "@/component/user/DashboardLayout";
import EmptyState from "@/component/user/EmptyState";

const FILTERS = ["Semua", "Berhasil", "Menunggu", "Gagal"];

const statusMeta = {
  paid: {
    label: "Berhasil",
    bucket: "Berhasil",
    className: "bg-[#148F89]/10 text-[#148F89] border border-[#148F89]/30",
  },
  pending: {
    label: "Menunggu Pembayaran",
    bucket: "Menunggu",
    className: "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30",
  },
  failed: {
    label: "Gagal",
    bucket: "Gagal",
    className: "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30",
  },
  expired: {
    label: "Kedaluwarsa",
    bucket: "Gagal",
    className: "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30",
  },
  cancelled: {
    label: "Dibatalkan",
    bucket: "Gagal",
    className: "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30",
  },
};

const typeMeta = {
  bootcamp: { label: "Bootcamp", className: "bg-[#0A4A5C] text-[#00C6D1]" },
  mentoring: { label: "Mentoring", className: "bg-[#3A3610] text-[#D1D83E]" },
  modul: { label: "Modul", className: "bg-[#3B0E76] text-[#B19EEF]" },
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

export default function Transactions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [selectedTx, setSelectedTx] = useState(null);
  const shouldReduceMotion = useReducedMotion();

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

  // --- MOCK DATA (nanti ganti dengan query ke tabel transactions milik user login) ---
  const transactions = [
    {
      id: "TRX-20260701-001",
      productTitle: "Winner Class Dan Module (Debate)",
      productType: "bootcamp",
      createdAt: "1 Juli 2026, 14:32 WIB",
      status: "paid",
      paymentMethod: "BCA Virtual Account",
      subtotal: 250000,
      discount: 25000,
      discountCode: "MARKUP10",
      tax: 0,
      total: 225000,
      invoiceUrl: "https://example.com/invoice/TRX-20260701-001.pdf",
    },
    {
      id: "TRX-20260705-002",
      productTitle: "Masterclass Business Case Competition (BCC)",
      productType: "modul",
      createdAt: "5 Juli 2026, 09:10 WIB",
      status: "paid",
      paymentMethod: "GoPay",
      subtotal: 125000,
      discount: 80000,
      discountCode: "LAUNCH",
      tax: 0,
      total: 45000,
      invoiceUrl: "https://example.com/invoice/TRX-20260705-002.pdf",
    },
    {
      id: "TRX-20260709-003",
      productTitle: "1-on-1 Career Mentoring",
      productType: "mentoring",
      createdAt: "9 Juli 2026, 20:45 WIB",
      status: "pending",
      paymentMethod: "BCA Virtual Account",
      subtotal: 110000,
      discount: 0,
      discountCode: null,
      tax: 0,
      total: 110000,
      paymentUrl: "https://example.com/pay/TRX-20260709-003",
      expiresAt: "10 Juli 2026, 20:45 WIB",
    },
    {
      id: "TRX-20260628-004",
      productTitle: "Bundling PowerPack (Newbie Friendly)",
      productType: "mentoring",
      createdAt: "28 Juni 2026, 11:15 WIB",
      status: "expired",
      paymentMethod: "BCA Virtual Account",
      subtotal: 300000,
      discount: 0,
      discountCode: null,
      tax: 0,
      total: 300000,
    },
  ];

  const totalTransaksi = transactions.length;
  const totalBelanja = transactions
    .filter((t) => t.status === "paid")
    .reduce((sum, t) => sum + t.total, 0);
  const menungguPembayaran = transactions
    .filter((t) => t.status === "pending")
    .reduce((sum, t) => sum + t.total, 0);

  const hasAny = transactions.length > 0;

  const filtered = transactions.filter((t) => {
    const matchesFilter =
      activeFilter === "Semua" || statusMeta[t.status].bucket === activeFilter;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      t.productTitle.toLowerCase().includes(query) ||
      t.id.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  const emptyMessage = searchQuery.trim()
    ? `Transaksi dengan kata kunci "${searchQuery}" tidak ditemukan.`
    : `Belum ada transaksi dengan status "${activeFilter}".`;

  return (
    <DashboardLayout title="Transaksi">
      <motion.div {...sectionReveal} className="flex flex-col gap-1">
        <h1 className="text-[28px] sm:text-[32px] font-bold text-white leading-tight">
          Transaksi Saya
        </h1>
        <p className="text-[#9CA3AF] text-[14px] mt-1">
          Riwayat semua pembelian produk, bootcamp, dan sesi mentoring kamu di
          Mark-Up.
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        {...sectionReveal}
        className="grid grid-cols-1 sm:grid-cols-3 gap-6"
      >
        <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-6 flex flex-col justify-center">
          <p className="text-[#E2E8F0] font-medium text-[14px]">
            Total Transaksi
          </p>
          <p className="text-[#148F89] font-bold text-[34px] leading-none mt-2">
            {totalTransaksi}
          </p>
        </div>
        <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-6 flex flex-col justify-center">
          <p className="text-[#E2E8F0] font-medium text-[14px]">
            Total Belanja
          </p>
          <p className="text-[#148F89] font-bold text-[26px] sm:text-[28px] leading-none mt-2">
            {formatCurrency(totalBelanja)}
          </p>
        </div>
        <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-6 flex flex-col justify-center">
          <p className="text-[#E2E8F0] font-medium text-[14px]">
            Menunggu Pembayaran
          </p>
          <p className="text-[#F59E0B] font-bold text-[26px] sm:text-[28px] leading-none mt-2">
            {formatCurrency(menungguPembayaran)}
          </p>
        </div>
      </motion.div>

      {/* Search + Filter */}
      {hasAny && (
        <motion.div
          {...sectionReveal}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="relative w-full sm:max-w-[320px]">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
            />
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

      {/* List */}
      {!hasAny ? (
        <EmptyState
          message="Kamu belum punya transaksi. Yuk jelajahi katalog produk kami."
          ctaLabel="Jelajahi Produk"
          ctaHref="/produk"
        />
      ) : filtered.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((tx, index) => (
            <motion.button
              key={tx.id}
              {...cardReveal(index)}
              onClick={() => setSelectedTx(tx)}
              className="w-full text-left bg-[#170F26] border border-[#2D2342] rounded-[12px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#148F89]/50 transition-colors"
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${typeMeta[tx.productType].className}`}
                  >
                    {typeMeta[tx.productType].label}
                  </span>
                  <span className="text-[#9CA3AF] text-[11px]">{tx.id}</span>
                </div>
                <h4 className="font-bold text-[15px] text-white">
                  {tx.productTitle}
                </h4>
                <p className="text-[#9CA3AF] text-[12px]">{tx.createdAt}</p>
              </div>
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 sm:gap-1.5 shrink-0">
                <span
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${statusMeta[tx.status].className}`}
                >
                  {statusMeta[tx.status].label}
                </span>
                <p className="text-white font-bold text-[16px]">
                  {formatCurrency(tx.total)}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* --- MODAL DETAIL --- */}
      <AnimatePresence>
        {selectedTx && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
                <h3 className="text-white font-bold text-[17px]">
                  Detail Transaksi
                </h3>
                <button
                  onClick={() => setSelectedTx(null)}
                  aria-label="Tutup"
                  className="p-1.5 rounded-[8px] text-[#9CA3AF] hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-5">
                {/* Produk + status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1.5">
                    <span
                      className={`self-start px-2.5 py-1 rounded-md text-[10px] font-bold w-fit ${typeMeta[selectedTx.productType].className}`}
                    >
                      {typeMeta[selectedTx.productType].label}
                    </span>
                    <h4 className="font-bold text-[17px] text-white leading-snug">
                      {selectedTx.productTitle}
                    </h4>
                  </div>
                  <span
                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 ${statusMeta[selectedTx.status].className}`}
                  >
                    {statusMeta[selectedTx.status].label}
                  </span>
                </div>

                {/* Info umum */}
                <div className="flex flex-col gap-2 text-[13px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#9CA3AF]">No. Transaksi</span>
                    <span className="text-white font-medium">
                      {selectedTx.id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#9CA3AF]">Tanggal</span>
                    <span className="text-white font-medium">
                      {selectedTx.createdAt}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#9CA3AF]">Metode Pembayaran</span>
                    <span className="text-white font-medium">
                      {selectedTx.paymentMethod}
                    </span>
                  </div>
                  {selectedTx.status === "pending" && selectedTx.expiresAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#9CA3AF]">Batas Waktu Bayar</span>
                      <span className="text-[#F59E0B] font-medium">
                        {selectedTx.expiresAt}
                      </span>
                    </div>
                  )}
                </div>

                {/* Rincian Harga */}
                <div className="flex flex-col gap-2 pt-4 border-t border-[#2D2342] text-[13px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#9CA3AF]">Subtotal</span>
                    <span className="text-white">
                      {formatCurrency(selectedTx.subtotal)}
                    </span>
                  </div>
                  {selectedTx.discount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#9CA3AF]">
                        Diskon
                        {selectedTx.discountCode
                          ? ` (${selectedTx.discountCode})`
                          : ""}
                      </span>
                      <span className="text-[#148F89]">
                        -{formatCurrency(selectedTx.discount)}
                      </span>
                    </div>
                  )}
                  {selectedTx.tax > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#9CA3AF]">Pajak</span>
                      <span className="text-white">
                        {formatCurrency(selectedTx.tax)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-[#2D2342]">
                    <span className="text-white font-semibold">Total</span>
                    <span className="text-[#148F89] font-bold text-[18px]">
                      {formatCurrency(selectedTx.total)}
                    </span>
                  </div>
                </div>

                {/* Aksi sesuai status */}
                {selectedTx.status === "pending" && selectedTx.paymentUrl && (
                  <a
                    href={selectedTx.paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-center py-3 rounded-[8px] bg-[#148F89] text-white font-semibold text-[13px] hover:bg-[#117A75] transition-colors"
                  >
                    Bayar Sekarang
                  </a>
                )}
                {selectedTx.status === "paid" && selectedTx.invoiceUrl && (
                  <a
                    href={selectedTx.invoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-center py-3 rounded-[8px] border border-[#2D2342] text-[#E2E8F0] font-semibold text-[13px] hover:border-[#148F89]/50 hover:text-white transition-colors"
                  >
                    Unduh Invoice
                  </a>
                )}
                {(selectedTx.status === "failed" ||
                  selectedTx.status === "expired" ||
                  selectedTx.status === "cancelled") && (
                  <Link
                    href="/produk"
                    className="w-full text-center py-3 rounded-[8px] bg-[#148F89] text-white font-semibold text-[13px] hover:bg-[#117A75] transition-colors"
                  >
                    Beli Lagi
                  </Link>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
