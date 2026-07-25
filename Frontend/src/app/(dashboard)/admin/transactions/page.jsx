"use client";

import {
  Search,
  ChevronDown,
  Eye,
  X,
  Landmark,
  Check,
  Ban,
  Loader2,
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import DashboardLayout from "@/component/admin/DashboardLayout";
import StatCard from "@/component/admin/StatCard";
import EmptyState from "@/component/admin/EmptyState";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";

const STATUS_META = {
  PENDING: {
    label: "MENUNGGU VERIFIKASI",
    className: "bg-[#FEF3C7] text-[#92400E]",
  },
  PAID: { label: "LUNAS", className: "bg-[#DCFCE7] text-[#166534]" },
  FAILED: { label: "DITOLAK", className: "bg-[#FEE2E2] text-[#991B1B]" },
  EXPIRED: { label: "KEDALUWARSA", className: "bg-[#F1F5F9] text-[#475569]" },
  REFUNDED: { label: "REFUND", className: "bg-[#E0E7FF] text-[#3730A3]" },
};

const STATUS_FILTERS = ["Semua", "PENDING", "PAID", "FAILED", "EXPIRED", "REFUNDED"];

function formatIDR(val) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(val) || 0);
}

function formatDateTime(iso) {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} · ${date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
}

function extractErrorMessage(err, fallback) {
  if (err instanceof ApiError) {
    if (err.data?.errors) {
      return Object.values(err.data.errors).flat().join(" ");
    }
    return err.message || fallback;
  }
  return fallback;
}

export default function Transactions() {
  const heightFix = `.adm-h-38 { height: 38px; } .adm-w-38 { width: 38px; }`;

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [deciding, setDeciding] = useState(false);

  function showToast(type, title, message) {
    if (type === "error") toast.error(title, { description: message });
    else toast.success(title, { description: message });
  }

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await api.get("/api/transactions/");
      setTransactions(data?.transactions || []);
    } catch (err) {
      setLoadError(extractErrorMessage(err, "Gagal memuat data transaksi."));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMonthlyRevenue = useCallback(async () => {
    try {
      const data = await api.get("/api/transactions/summary/revenue/?period=month");
      setMonthlyRevenue(data?.total_revenue ?? 0);
    } catch {
      setMonthlyRevenue(null);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
    fetchMonthlyRevenue();
  }, [fetchTransactions, fetchMonthlyRevenue]);

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((t) => {
      const matchStatus = statusFilter === "Semua" || t.status === statusFilter;
      const matchSearch =
        !q ||
        String(t.transaction_id).toLowerCase().includes(q) ||
        (t.user_name || "").toLowerCase().includes(q) ||
        (t.product_title || "").toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [transactions, search, statusFilter]);

  const waitingCount = transactions.filter((t) => t.status === "PENDING").length;

  async function handleDecision(decision) {
    if (!selectedTx) return;
    setDeciding(true);
    try {
      await api.patch(`/api/transactions/${selectedTx.transaction_id}/verify/`, {
        decision,
      });
      setIsModalOpen(false);
      await fetchTransactions();
      showToast(
        "success",
        decision === "paid" ? "Transaksi Dikonfirmasi" : "Transaksi Ditolak",
        decision === "paid"
          ? "Transaksi berhasil ditandai lunas."
          : "Transaksi berhasil ditandai gagal."
      );
    } catch (err) {
      showToast(
        "error",
        "Gagal Memproses Transaksi",
        extractErrorMessage(err, "Terjadi kesalahan.")
      );
    } finally {
      setDeciding(false);
    }
  }

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
        <StatCard
          label="Total Transaksi"
          value={transactions.length}
          unit="transaksi"
          loading={loading}
        />
        <StatCard
          label="Menunggu Verifikasi"
          value={waitingCount}
          unit="transaksi"
          variant="warning"
          loading={loading}
        />
        <StatCard
          label="Pendapatan Bulan Ini"
          value={monthlyRevenue == null ? "-" : formatIDR(monthlyRevenue)}
        />
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari ID, nama, atau produk..."
              className="w-full adm-h-38 pl-9 pr-3 border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#334155] outline-none focus:border-[#148F89] transition-colors"
            />
          </div>
          <div className="relative" style={{ width: "220px" }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full adm-h-38 pl-3 pr-8 border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#334155] appearance-none outline-none focus:border-[#148F89] bg-white cursor-pointer"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s} value={s}>
                  {s === "Semua" ? "Status: Semua" : STATUS_META[s]?.label || s}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-[#64748B] text-[13px]">
            <Loader2 size={16} className="animate-spin" />
            Memuat data transaksi...
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center gap-3 py-16 text-[13px]">
            <p className="text-[#991B1B]">{loadError}</p>
            <button
              onClick={fetchTransactions}
              className="px-4 py-2 bg-[#F1F5F9] rounded-[8px] text-[#475569] font-medium hover:bg-[#E2E8F0] transition-colors"
            >
              Coba lagi
            </button>
          </div>
        ) : filtered.length === 0 ? (
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
                      key={item.transaction_id}
                      className="hover:bg-[#F8FAFC] transition-colors"
                    >
                      <td className="px-6 py-4 text-[#64748B] font-medium">
                        {item.transaction_id}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[#1E293B] font-semibold">
                          {item.user_name}
                        </p>
                        <p className="text-[#64748B] text-[12px] mt-0.5">
                          {item.product_title || "-"}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center text-[#64748B] font-medium whitespace-nowrap">
                        {formatDateTime(item.date_time)}
                      </td>
                      <td className="px-6 py-4 text-center text-[#1E293B] font-bold">
                        {formatIDR(item.amount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex px-3 py-1.5 text-[10px] rounded-full font-bold whitespace-nowrap ${STATUS_META[item.status]?.className || "bg-[#F1F5F9] text-[#475569]"}`}
                        >
                          {STATUS_META[item.status]?.label || item.status}
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
                  {selectedTx?.transaction_id}
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
                className={`w-full py-2.5 rounded-[8px] flex justify-center items-center font-bold text-[12px] tracking-wider ${STATUS_META[selectedTx?.status]?.className || "bg-[#F1F5F9] text-[#475569]"}`}
              >
                {STATUS_META[selectedTx?.status]?.label || selectedTx?.status}
              </span>

              <div className="grid grid-cols-2 gap-y-4 gap-x-4 text-[13px]">
                <div className="flex flex-col gap-1">
                  <span className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider">
                    User
                  </span>
                  <span className="text-[#1E293B] font-medium">
                    {selectedTx?.user_name}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider">
                    Waktu
                  </span>
                  <span className="text-[#1E293B] font-medium">
                    {formatDateTime(selectedTx?.date_time)}
                  </span>
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <span className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider">
                    Produk
                  </span>
                  <span className="text-[#1E293B] font-medium">
                    {selectedTx?.product_title || "-"}
                  </span>
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <span className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider">
                    Metode Pembayaran
                  </span>
                  <span className="text-[#1E293B] font-medium">
                    {selectedTx?.method || "-"}
                  </span>
                </div>
              </div>

              <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-[8px] flex justify-between items-center">
                <span className="text-[#475569] font-bold text-[13px]">
                  Total Dibayar
                </span>
                <span className="text-[#0F172A] font-bold text-[19px]">
                  {formatIDR(selectedTx?.amount)}
                </span>
              </div>

              {selectedTx?.notes ? (
                <div className="flex flex-col gap-1">
                  <span className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider">
                    Catatan dari Pembeli
                  </span>
                  <p className="text-[#1E293B] text-[13px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 py-3 whitespace-pre-wrap">
                    {selectedTx.notes}
                  </p>
                </div>
              ) : null}

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Landmark size={15} className="text-[#148F89]" />
                  <span className="text-[#1E293B] font-bold text-[13px]">
                    Bukti Transfer
                  </span>
                </div>
                {selectedTx?.proof_of_payment ? (
                  <img
                    src={selectedTx.proof_of_payment}
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

              {selectedTx?.product_type === "BOOTCAMP" && (
                <div className="flex flex-col gap-2">
                  <span className="text-[#1E293B] font-bold text-[13px]">
                    Syarat Pendaftaran Bootcamp
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      ["Bukti Follow", selectedTx.follow_proof],
                      ["Bukti Share WhatsApp", selectedTx.wa_share_proof],
                      ["Commitment Letter", selectedTx.commitment_letter],
                    ].map(([label, url]) => (
                      <div key={label} className="flex items-center justify-between gap-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 py-2.5">
                        <span className="text-[#475569] text-[12px] font-medium">{label}</span>
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#148F89] text-[12px] font-semibold hover:underline shrink-0"
                          >
                            Lihat
                          </a>
                        ) : (
                          <span className="text-[#94A3B8] text-[11px]">Belum ada</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {selectedTx?.status === "PENDING" ? (
              <div className="px-6 py-5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex gap-3">
                <button
                  disabled={deciding}
                  onClick={() => handleDecision("failed")}
                  className="flex-1 py-2.5 bg-white border border-[#FCA5A5] text-[#DC2626] font-bold text-[13px] rounded-[8px] hover:bg-[#FEE2E2] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  <Ban size={14} />
                  Tolak
                </button>
                <button
                  disabled={deciding}
                  onClick={() => handleDecision("paid")}
                  className="flex-1 py-2.5 bg-[#148F89] text-white font-bold text-[13px] rounded-[8px] hover:bg-[#117A75] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
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
