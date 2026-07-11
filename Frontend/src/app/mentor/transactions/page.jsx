"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import DashboardLayout from "@/component/mentor/DashboardLayout";
import EmptyState from "@/component/mentor/EmptyState";

const FILTERS = ["Semua", "Sudah Cair", "Diproses", "Menunggu"];

const statusMeta = {
  paid: {
    label: "Sudah Cair",
    bucket: "Sudah Cair",
    className: "bg-[#148F89]/10 text-[#148F89] border border-[#148F89]/30",
  },
  processing: {
    label: "Diproses",
    bucket: "Diproses",
    className: "bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/30",
  },
  pending: {
    label: "Menunggu",
    bucket: "Menunggu",
    className: "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30",
  },
};

const typeMeta = {
  bootcamp: {
    label: "Bootcamp",
    className: "bg-[#0A4A5C] text-[#00C6D1]",
  },
  mentoring: {
    label: "Private Mentoring",
    className: "bg-[#3A3610] text-[#D1D83E]",
  },
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

export default function MentorTransactions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Semua");

  // --- MOCK DATA ---
  // Catatan skema: kolom users/transactions yang dikirim sebelumnya nggak
  // punya tabel payout/earnings mentor secara eksplisit -- cuma
  // mentor_profiles.bank_name/bank_account yang mengisyaratkan ada mekanisme
  // transfer. Kalau mau di-backend-in beneran, kemungkinan perlu tabel baru
  // semacam mentor_payouts (session_id, gross_amount, platform_fee, net_amount,
  // status, paid_at).
  const payouts = [
    {
      id: "PAY-20260606-001",
      type: "bootcamp",
      title: "Winner Class Dan Module (Debate) — Sesi 3",
      sessionDate: "6 Juni 2026",
      grossAmount: 250000,
      platformFeePercent: 20,
      status: "paid",
      paidAt: "10 Juni 2026",
      bankInfo: "BCA •••• 4521",
    },
    {
      id: "PAY-20260703-002",
      type: "mentoring",
      title: "1-on-1 Career Mentoring — Sarah Jenkins",
      sessionDate: "3 Juli 2026",
      grossAmount: 150000,
      platformFeePercent: 20,
      status: "paid",
      paidAt: "8 Juli 2026",
      bankInfo: "BCA •••• 4521",
    },
    {
      id: "PAY-20260709-003",
      type: "bootcamp",
      title: "Frontend Engineering Sprint — Sesi 2",
      sessionDate: "9 Juli 2026",
      grossAmount: 250000,
      platformFeePercent: 20,
      status: "processing",
      paidAt: null,
      bankInfo: null,
    },
    {
      id: "PAY-20260712-004",
      type: "mentoring",
      title: "Winner Class Dan Module (Debate) — Affan Fathir D.",
      sessionDate: "12 Juli 2026",
      grossAmount: 150000,
      platformFeePercent: 20,
      status: "pending",
      paidAt: null,
      bankInfo: null,
    },
  ];

  const withNet = payouts.map((p) => {
    const platformFeeAmount = Math.round(
      (p.grossAmount * p.platformFeePercent) / 100,
    );
    return {
      ...p,
      platformFeeAmount,
      netAmount: p.grossAmount - platformFeeAmount,
    };
  });

  const totalPendapatan = withNet
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.netAmount, 0);

  const menungguPencairan = withNet
    .filter((p) => p.status === "processing" || p.status === "pending")
    .reduce((sum, p) => sum + p.netAmount, 0);

  const pendapatanBulanIni = withNet
    .filter((p) => p.sessionDate.includes("Juli 2026"))
    .reduce((sum, p) => sum + p.netAmount, 0);

  const hasAny = payouts.length > 0;

  const filtered = withNet.filter((p) => {
    const matchesFilter =
      activeFilter === "Semua" || statusMeta[p.status].bucket === activeFilter;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      p.title.toLowerCase().includes(query) ||
      p.id.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  const emptyMessage = searchQuery.trim()
    ? `Transaksi dengan kata kunci "${searchQuery}" tidak ditemukan.`
    : `Belum ada transaksi dengan status "${activeFilter}".`;

  return (
    <DashboardLayout title="Transactions">
      {/* Intro */}
      <div className="flex flex-col gap-1">
        <h2 className="text-[22px] sm:text-[25px] font-bold text-white">
          Riwayat Pendapatan
        </h2>
        <p className="text-[#9CA3AF] text-[13px]">
          Rincian pendapatan dari setiap sesi bootcamp dan mentoring privat yang
          kamu ajarkan, termasuk potongan platform dan status pencairan.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-6 flex flex-col justify-center shadow-lg">
          <p className="text-[#E2E8F0] font-medium text-[14px]">
            Total Pendapatan
          </p>
          <p className="text-[#148F89] font-bold text-[26px] sm:text-[30px] leading-none mt-2">
            {formatCurrency(totalPendapatan)}
          </p>
          <p className="text-[#9CA3AF] text-[11px] mt-1.5">
            Sudah cair, bersih setelah potongan platform
          </p>
        </div>
        <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-6 flex flex-col justify-center shadow-lg">
          <p className="text-[#E2E8F0] font-medium text-[14px]">
            Menunggu Pencairan
          </p>
          <p className="text-[#F59E0B] font-bold text-[26px] sm:text-[30px] leading-none mt-2">
            {formatCurrency(menungguPencairan)}
          </p>
          <p className="text-[#9CA3AF] text-[11px] mt-1.5">
            Sedang diproses / menunggu jadwal transfer
          </p>
        </div>
        <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-6 flex flex-col justify-center shadow-lg">
          <p className="text-[#E2E8F0] font-medium text-[14px]">
            Pendapatan Bulan Ini
          </p>
          <p className="text-[#148F89] font-bold text-[26px] sm:text-[30px] leading-none mt-2">
            {formatCurrency(pendapatanBulanIni)}
          </p>
          <p className="text-[#9CA3AF] text-[11px] mt-1.5">
            Juli 2026, semua status
          </p>
        </div>
      </div>

      {/* Search + Filter */}
      {hasAny && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-[320px]">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
            />
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
        </div>
      )}

      {/* List */}
      {!hasAny ? (
        <EmptyState message="Belum ada riwayat pendapatan. Transaksi akan muncul di sini setelah kamu menyelesaikan sesi mengajar." />
      ) : filtered.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-5 flex flex-col gap-4"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${typeMeta[p.type].className}`}
                    >
                      {typeMeta[p.type].label}
                    </span>
                    <span className="text-[#9CA3AF] text-[11px]">{p.id}</span>
                  </div>
                  <h4 className="font-bold text-[15px] text-white">
                    {p.title}
                  </h4>
                  <p className="text-[#9CA3AF] text-[12px]">
                    Tanggal sesi: {p.sessionDate}
                  </p>
                </div>
                <span
                  className={`self-start px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${statusMeta[p.status].className}`}
                >
                  {statusMeta[p.status].label}
                </span>
              </div>

              {/* Rincian keuangan */}
              <div className="flex flex-col gap-2 pt-3 border-t border-[#2D2342]">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#9CA3AF]">Pendapatan Kotor</span>
                  <span className="text-white">
                    {formatCurrency(p.grossAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#9CA3AF]">
                    Potongan Platform ({p.platformFeePercent}%)
                  </span>
                  <span className="text-[#EF4444]">
                    -{formatCurrency(p.platformFeeAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#2D2342]">
                  <span className="text-white font-semibold text-[14px]">
                    Diterima (Net)
                  </span>
                  <span className="text-[#148F89] font-bold text-[18px]">
                    {formatCurrency(p.netAmount)}
                  </span>
                </div>
              </div>

              {/* Info pencairan */}
              {p.status === "paid" && (
                <p className="text-[#9CA3AF] text-[12px]">
                  Dicairkan {p.paidAt} ke {p.bankInfo}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
