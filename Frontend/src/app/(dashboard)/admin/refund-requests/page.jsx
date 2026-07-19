"use client";

import {
  Eye,
  X,
  Check,
  Ban,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import DashboardLayout from "@/component/admin/DashboardLayout";
import StatCard from "@/component/admin/StatCard";
import EmptyState from "@/component/admin/EmptyState";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";

const STATUS_META = {
  pending: {
    label: "MENUNGGU REVIEW",
    className: "bg-[#FEF3C7] text-[#92400E]",
  },
  approved: { label: "DISETUJUI", className: "bg-[#DCFCE7] text-[#166534]" },
  rejected: { label: "DITOLAK", className: "bg-[#FEE2E2] text-[#991B1B]" },
};

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
  return `${date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}, ${date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
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

export default function RefundRequests() {
  const heightFix = `.adm-h-42 { height: 42px; }`;

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deciding, setDeciding] = useState(false);

  function showToast(type, title, message) {
    if (type === "error") toast.error(title, { description: message });
    else toast.success(title, { description: message });
  }

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await api.get("/api/products/refund-requests/");
      setRequests(data?.refund_requests || []);
    } catch (err) {
      setLoadError(extractErrorMessage(err, "Gagal memuat data pengajuan refund."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    document.body.style.overflow = isModalOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isModalOpen]);

  const openDetail = (req) => {
    setSelectedRequest(req);
    setAdminNotes(req.admin_notes || "");
    setIsModalOpen(true);
  };

  async function handleDecision(decision) {
    if (!selectedRequest) return;
    setDeciding(true);
    try {
      await api.patch(`/api/products/refund-requests/${selectedRequest.id}/`, {
        decision,
        admin_notes: adminNotes,
      });
      setIsModalOpen(false);
      await fetchRequests();
      showToast(
        "success",
        decision === "approved" ? "Refund Disetujui" : "Refund Ditolak",
        decision === "approved"
          ? "Akses produk user sudah dicabut & transaksi ditandai refund."
          : "Pengajuan refund berhasil ditolak."
      );
    } catch (err) {
      showToast(
        "error",
        "Gagal Memproses Pengajuan",
        extractErrorMessage(err, "Terjadi kesalahan.")
      );
    } finally {
      setDeciding(false);
    }
  }

  const filtered = useMemo(
    () =>
      statusFilter === "Semua"
        ? requests
        : requests.filter((r) => r.status === statusFilter),
    [requests, statusFilter]
  );
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;

  return (
    <DashboardLayout title="Pengajuan Refund">
      <style>{heightFix}</style>

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bold text-[22px] text-[#0F172A]">
            Pengajuan Refund
          </h1>
          <p className="text-[#64748B] text-[14px] mt-1">
            Review dan proses permintaan refund dari user, sesuai Refund Policy
            MARK-UP.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <StatCard
          label="Menunggu Review"
          value={pendingCount}
          unit="pengajuan"
          variant="warning"
        />
        <StatCard
          label="Disetujui"
          value={approvedCount}
          unit="pengajuan"
          variant="success"
        />
        <StatCard
          label="Total Diajukan"
          value={requests.length}
          unit="pengajuan"
        />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-[16px] font-semibold text-[#0F172A]">
            Daftar Pengajuan
          </h2>
          <div className="adm-h-42 bg-[#F1F5F9] px-1.5 rounded-[8px] flex items-center gap-1">
            {[
              { key: "pending", label: "Menunggu" },
              { key: "approved", label: "Disetujui" },
              { key: "rejected", label: "Ditolak" },
              { key: "Semua", label: "Semua" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-3.5 py-2 rounded-[6px] font-medium text-[12.5px] transition-colors ${statusFilter === f.key ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B] hover:bg-white/60"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-[#64748B] text-[13px]">
            <Loader2 size={16} className="animate-spin" />
            Memuat data pengajuan refund...
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center gap-3 py-16 text-[13px]">
            <p className="text-[#991B1B]">{loadError}</p>
            <button
              onClick={fetchRequests}
              className="px-4 py-2 bg-[#F1F5F9] rounded-[8px] text-[#475569] font-medium hover:bg-[#E2E8F0] transition-colors"
            >
              Coba lagi
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState message="Nggak ada pengajuan refund di kategori ini." />
        ) : (
          <div className="rounded-[12px] overflow-hidden border border-[#E2E8F0] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-6 py-3.5 text-left font-bold text-[#64748B] tracking-wider text-[11px]">
                      USER & PRODUK
                    </th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                      DIAJUKAN
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
                      <td className="px-6 py-4">
                        <p className="text-[#1E293B] font-semibold">
                          {item.user_name}
                        </p>
                        <p className="text-[#64748B] text-[12px] mt-0.5">
                          {item.product_title || "-"}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center text-[#64748B] font-medium whitespace-nowrap">
                        {formatDateTime(item.created_at)}
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
                  Detail Pengajuan
                </p>
                <p className="text-[#64748B] text-[12px] mt-0.5">
                  {selectedRequest?.user_name}
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
                className={`w-full py-2.5 rounded-[8px] flex justify-center items-center font-bold text-[12px] tracking-wider ${STATUS_META[selectedRequest?.status]?.className || "bg-[#F1F5F9] text-[#475569]"}`}
              >
                {STATUS_META[selectedRequest?.status]?.label || selectedRequest?.status}
              </span>

              <div className="grid grid-cols-2 gap-y-4 gap-x-4 text-[13px]">
                <div className="flex flex-col gap-1">
                  <span className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider">
                    User
                  </span>
                  <span className="text-[#1E293B] font-medium">
                    {selectedRequest?.user_name}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider">
                    Diajukan
                  </span>
                  <span className="text-[#1E293B] font-medium">
                    {formatDateTime(selectedRequest?.created_at)}
                  </span>
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <span className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider">
                    Produk
                  </span>
                  <span className="text-[#1E293B] font-medium">
                    {selectedRequest?.product_title || "-"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider">
                  Alasan dari User
                </span>
                <p className="text-[#334155] text-[13px] leading-relaxed bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 py-3">
                  {selectedRequest?.reason}
                </p>
              </div>

              {selectedRequest?.status === "pending" && (
                <>
                  <p className="flex items-start gap-2 text-[#92400E] text-[11px] bg-[#FEF3C7] border border-[#FDE68A] rounded-[8px] px-3.5 py-2.5 leading-relaxed">
                    <AlertCircle size={13} className="shrink-0 mt-0.5" />
                    Menyetujui refund akan langsung mencabut akses produk user
                    dan menandai transaksi terkait sebagai REFUNDED.
                  </p>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[#334155] text-[13px] font-medium">
                      Catatan Admin (opsional)
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                      placeholder="Catatan internal soal keputusan ini..."
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 py-3 text-[13px] text-[#1E293B] placeholder:text-[#94A3B8] outline-none focus:border-[#148F89] transition-colors resize-none"
                    />
                  </div>
                </>
              )}

              {selectedRequest?.status !== "pending" && selectedRequest?.admin_notes && (
                <div className="flex flex-col gap-2">
                  <span className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider">
                    Catatan Admin
                  </span>
                  <p className="text-[#334155] text-[13px] leading-relaxed bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 py-3">
                    {selectedRequest.admin_notes}
                  </p>
                </div>
              )}
            </div>

            {selectedRequest?.status === "pending" ? (
              <div className="px-6 py-5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex gap-3">
                <button
                  disabled={deciding}
                  onClick={() => handleDecision("rejected")}
                  className="flex-1 py-2.5 bg-white border border-[#FCA5A5] text-[#DC2626] font-bold text-[13px] rounded-[8px] hover:bg-[#FEE2E2] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  <Ban size={14} />
                  Tolak
                </button>
                <button
                  disabled={deciding}
                  onClick={() => handleDecision("approved")}
                  className="flex-1 py-2.5 bg-[#148F89] text-white font-bold text-[13px] rounded-[8px] hover:bg-[#117A75] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  <Check size={14} />
                  Setujui Refund
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
