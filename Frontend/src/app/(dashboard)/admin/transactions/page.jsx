"use client";

import {
  Search,
  Calendar,
  ChevronDown,
  ListFilter,
  Eye,
  X,
  Landmark,
  Check,
  Ban,
} from "lucide-react";
import { useState, useEffect } from "react";
import DashboardLayout from "@/component/admin/DashboardLayout";
import StatCard from "@/component/admin/StatCard";
import EmptyState from "@/component/admin/EmptyState";

const STATUS_META = {
  paid: { label: "LUNAS", className: "bg-[#DCFCE7] text-[#166534]" },
  waiting_verification: {
    label: "MENUNGGU VERIFIKASI",
    className: "bg-[#FEF3C7] text-[#92400E]",
  },
  pending: { label: "BELUM BAYAR", className: "bg-[#F1F5F9] text-[#475569]" },
  rejected: { label: "DITOLAK", className: "bg-[#FEE2E2] text-[#991B1B]" },
};

export default function Transactions() {
  const heightFix = `.adm-h-38 { height: 38px; } .adm-w-38 { width: 38px; }`;

  const transactions = [
    {
      id: "TRX-20260701-001",
      userName: "Prabroro Subriantoro",
      productTitle: "Bundling PowerPack (Newbie Friendly)",
      date: "1 Jul 2026 · 14:22",
      amount: "Rp300.000",
      status: "waiting_verification",
      proofUrl: "/images/pp.png",
    },
    {
      id: "TRX-20260630-002",
      userName: "Affan Fathir D.",
      productTitle: "Winner Class Dan Module (Debate)",
      date: "30 Jun 2026 · 14:14",
      amount: "Rp299.000",
      status: "paid",
      proofUrl: "/images/pp.png",
    },
    {
      id: "TRX-20260630-003",
      userName: "Fathir Ramadhan",
      productTitle: "101 Career Mentoring",
      date: "30 Jun 2026 · 14:02",
      amount: "Rp110.000",
      status: "pending",
      proofUrl: null,
    },
  ];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [statusFilter, setStatusFilter] = useState("Semua");

  useEffect(() => {
    document.body.style.overflow = isModalOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isModalOpen]);

  const openDetail = (tx) => {
    setSelectedTx(tx);
    setIsModalOpen(true);
  };

  const filtered =
    statusFilter === "Semua"
      ? transactions
      : transactions.filter((t) => t.status === statusFilter);
  const waitingCount = transactions.filter(
    (t) => t.status === "waiting_verification",
  ).length;

  return (
    <DashboardLayout title="Transaksi">
      <style>{heightFix}</style>

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bold text-[22px] text-[#0F172A]">
            Log Transaksi & Pembayaran
          </h1>
          <p className="text-[#64748B] text-[14px] mt-1">
            Verifikasi bukti transfer dan pantau seluruh transaksi keuangan
            sistem.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <StatCard label="Total Transaksi" value="248" unit="transaksi" />
        <StatCard
          label="Menunggu Verifikasi"
          value={waitingCount}
          unit="transaksi"
          variant="warning"
        />
        <StatCard label="Pendapatan Bulan Ini" value="Rp42,1jt" />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-[16px] font-semibold text-[#0F172A]">
              Daftar Transaksi
            </h2>
            <p className="text-[#64748B] text-[13px] mt-0.5">
              Seluruh transaksi keuangan sepanjang waktu.
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-[12px] flex flex-wrap gap-4 border border-[#E2E8F0] shadow-sm">
          <div className="flex-1 relative" style={{ minWidth: "220px" }}>
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
            />
            <input
              type="text"
              placeholder="Cari ID, nama, atau produk..."
              className="w-full adm-h-38 pl-9 pr-3 border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#334155] outline-none focus:border-[#148F89] transition-colors"
            />
          </div>
          <div className="relative" style={{ width: "220px" }}>
            <Calendar
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]"
            />
            <select className="w-full adm-h-38 pl-9 pr-8 border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#334155] appearance-none outline-none focus:border-[#148F89] bg-white cursor-pointer">
              <option>7 Hari Terakhir</option>
              <option>30 Hari Terakhir</option>
              <option>Bulan Ini</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none"
            />
          </div>
          <div className="relative" style={{ width: "200px" }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full adm-h-38 pl-3 pr-8 border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#334155] appearance-none outline-none focus:border-[#148F89] bg-white cursor-pointer"
            >
              <option value="Semua">Status: Semua</option>
              <option value="waiting_verification">Menunggu Verifikasi</option>
              <option value="paid">Lunas</option>
              <option value="pending">Belum Bayar</option>
              <option value="rejected">Ditolak</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none"
            />
          </div>
          <button className="adm-w-38 adm-h-38 flex items-center justify-center border border-[#E2E8F0] rounded-[8px] bg-white text-[#64748B] hover:bg-[#F1F5F9] transition-colors">
            <ListFilter size={16} />
          </button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState message="Nggak ada transaksi yang cocok sama filter ini." />
        ) : (
          <div className="rounded-[12px] overflow-hidden border border-[#E2E8F0] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-6 py-3.5 text-left font-bold text-[#64748B] tracking-wider text-[11px]">
                      ID TRANSAKSI
                    </th>
                    <th className="px-6 py-3.5 text-left font-bold text-[#64748B] tracking-wider text-[11px]">
                      USER & PRODUK
                    </th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                      WAKTU
                    </th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                      NOMINAL
                    </th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                      STATUS
                    </th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                      AKSI
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] bg-white">
                  {filtered.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-[#F8FAFC] transition-colors"
                    >
                      <td className="px-6 py-4 text-[#64748B] font-medium">
                        {item.id}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[#1E293B] font-semibold">
                          {item.userName}
                        </p>
                        <p className="text-[#64748B] text-[12px] mt-0.5">
                          {item.productTitle}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center text-[#64748B] font-medium whitespace-nowrap">
                        {item.date}
                      </td>
                      <td className="px-6 py-4 text-center text-[#1E293B] font-bold">
                        {item.amount}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex px-3 py-1.5 text-[10px] rounded-full font-bold whitespace-nowrap ${STATUS_META[item.status].className}`}
                        >
                          {STATUS_META[item.status].label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => openDetail(item)}
                          className="text-[#94A3B8] hover:text-[#148F89] transition-colors p-2 rounded-full hover:bg-[#148F89]/10"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div
            style={{ width: "480px", maxWidth: "100%", maxHeight: "85vh" }}
            className="relative bg-white overflow-y-auto rounded-[12px] shadow-2xl z-10"
          >
            <div className="sticky top-0 bg-white px-6 py-5 border-b border-[#E2E8F0] flex justify-between items-center">
              <div>
                <p className="text-[#1E293B] font-bold text-[17px]">
                  Detail Transaksi
                </p>
                <p className="text-[#64748B] text-[12px] mt-0.5">
                  {selectedTx?.id}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-6 flex flex-col gap-5">
              <span
                className={`w-full py-2.5 rounded-[8px] flex justify-center items-center font-bold text-[12px] tracking-wider ${STATUS_META[selectedTx?.status]?.className}`}
              >
                {STATUS_META[selectedTx?.status]?.label}
              </span>

              <div className="grid grid-cols-2 gap-y-4 gap-x-4 text-[13px]">
                <div className="flex flex-col gap-1">
                  <span className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider">
                    User
                  </span>
                  <span className="text-[#1E293B] font-medium">
                    {selectedTx?.userName}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider">
                    Waktu
                  </span>
                  <span className="text-[#1E293B] font-medium">
                    {selectedTx?.date}
                  </span>
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <span className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider">
                    Produk
                  </span>
                  <span className="text-[#1E293B] font-medium">
                    {selectedTx?.productTitle}
                  </span>
                </div>
              </div>

              <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-[8px] flex justify-between items-center">
                <span className="text-[#475569] font-bold text-[13px]">
                  Total Dibayar
                </span>
                <span className="text-[#0F172A] font-bold text-[19px]">
                  {selectedTx?.amount}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Landmark size={15} className="text-[#148F89]" />
                  <span className="text-[#1E293B] font-bold text-[13px]">
                    Bukti Transfer
                  </span>
                </div>
                {selectedTx?.proofUrl ? (
                  <img
                    src={selectedTx.proofUrl}
                    alt="Bukti transfer"
                    style={{ maxHeight: "240px" }}
                    className="w-full rounded-[8px] border border-[#E2E8F0] object-cover"
                  />
                ) : (
                  <p className="text-[#94A3B8] text-[12px] bg-[#F8FAFC] border border-dashed border-[#E2E8F0] rounded-[8px] px-4 py-6 text-center">
                    User belum mengunggah bukti transfer.
                  </p>
                )}
              </div>
            </div>

            {selectedTx?.status === "waiting_verification" ? (
              <div className="px-6 py-5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-white border border-[#FCA5A5] text-[#DC2626] font-bold text-[13px] rounded-[8px] hover:bg-[#FEE2E2] transition-colors flex items-center justify-center gap-1.5"
                >
                  <Ban size={14} />
                  Tolak
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-[#148F89] text-white font-bold text-[13px] rounded-[8px] hover:bg-[#117A75] transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check size={14} />
                  Konfirmasi Lunas
                </button>
              </div>
            ) : (
              <div className="px-6 py-5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 bg-white border border-[#E2E8F0] text-[#475569] font-bold text-[13px] rounded-[8px] hover:bg-[#F1F5F9] transition-colors"
                >
                  Tutup
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
