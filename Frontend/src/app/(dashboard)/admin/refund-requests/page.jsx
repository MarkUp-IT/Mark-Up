"use client";

import {
  Search,
  ChevronDown,
  Eye,
  X,
  Check,
  Ban,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import DashboardLayout from "@/component/admin/DashboardLayout";
import StatCard from "@/component/admin/StatCard";
import EmptyState from "@/component/admin/EmptyState";

const STATUS_META = {
  pending: {
    label: "MENUNGGU REVIEW",
    className: "bg-[#FEF3C7] text-[#92400E]",
  },
  approved: { label: "DISETUJUI", className: "bg-[#DCFCE7] text-[#166534]" },
  rejected: { label: "DITOLAK", className: "bg-[#FEE2E2] text-[#991B1B]" },
};

export default function RefundRequests() {
  const heightFix = `.adm-h-42 { height: 42px; }`;

  // --- MOCK DATA (nanti ganti query refund_requests JOIN transactions +
  // users + products) ---
  const [requests, setRequests] = useState([
    {
      id: "RF-0012",
      userName: "Fathir Ramadhan",
      productTitle: "1-on-1 Career Mentoring",
      transactionId: "TRX-20260628-004",
      amount: 110000,
      reason:
        "Jadwal yang tersedia dari mentor nggak ada yang cocok sama waktu luang saya, jadi mending di-refund aja dulu.",
      status: "pending",
      createdAt: "5 Jul 2026, 09:12",
    },
    {
      id: "RF-0011",
      userName: "Sarah Jenkins",
      productTitle: "Winner Class Dan Module (Debate)",
      transactionId: "TRX-20260625-002",
      amount: 299000,
      reason:
        "Ternyata jadwal lombanya keburu, udah nggak butuh materinya lagi.",
      status: "approved",
      createdAt: "1 Jul 2026, 14:40",
    },
    {
      id: "RF-0010",
      userName: "Affan Fathir D.",
      productTitle: "Bundling PowerPack (Newbie Friendly)",
      transactionId: "TRX-MT-002",
      amount: 300000,
      reason: "Coba-coba ajuin doang, ternyata masih mau lanjut ikutnya.",
      status: "rejected",
      createdAt: "28 Jun 2026, 11:05",
    },
  ]);

  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isModalOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isModalOpen]);

  const formatIDR = (val) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);

  const openDetail = (req) => {
    setSelectedRequest(req);
    setAdminNotes(req.adminNotes || "");
    setIsModalOpen(true);
  };

  const handleDecision = (decision) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === selectedRequest.id
          ? { ...r, status: decision, adminNotes }
          : r,
      ),
    );
    setIsModalOpen(false);
  };

  const filtered =
    statusFilter === "Semua"
      ? requests
      : requests.filter((r) => r.status === statusFilter);
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedThisMonth = requests.filter(
    (r) => r.status === "approved",
  ).length;

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
          label="Disetujui Bulan Ini"
          value={approvedThisMonth}
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

        {filtered.length === 0 ? (
          <EmptyState message="Nggak ada pengajuan refund di kategori ini." />
        ) : (
          <div className="rounded-[12px] overflow-hidden border border-[#E2E8F0] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-6 py-3.5 text-left font-bold text-[#64748B] tracking-wider text-[11px]">
                      ID
                    </th>
                    <th className="px-6 py-3.5 text-left font-bold text-[#64748B] tracking-wider text-[11px]">
                      USER & PRODUK
                    </th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                      NOMINAL
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
                      <td className="px-6 py-4 text-center text-[#1E293B] font-bold">
                        {formatIDR(item.amount)}
                      </td>
                      <td className="px-6 py-4 text-center text-[#64748B] font-medium whitespace-nowrap">
                        {item.createdAt}
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
                  Detail Pengajuan
                </p>
                <p className="text-[#64748B] text-[12px] mt-0.5">
                  {selectedRequest?.id}
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
                className={`w-full py-2.5 rounded-[8px] flex justify-center items-center font-bold text-[12px] tracking-wider ${STATUS_META[selectedRequest?.status]?.className}`}
              >
                {STATUS_META[selectedRequest?.status]?.label}
              </span>

              <div className="grid grid-cols-2 gap-y-4 gap-x-4 text-[13px]">
                <div className="flex flex-col gap-1">
                  <span className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider">
                    User
                  </span>
                  <span className="text-[#1E293B] font-medium">
                    {selectedRequest?.userName}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider">
                    ID Transaksi
                  </span>
                  <span className="text-[#1E293B] font-medium">
                    {selectedRequest?.transactionId}
                  </span>
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <span className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider">
                    Produk
                  </span>
                  <span className="text-[#1E293B] font-medium">
                    {selectedRequest?.productTitle}
                  </span>
                </div>
              </div>

              <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-[8px] flex justify-between items-center">
                <span className="text-[#475569] font-bold text-[13px]">
                  Nominal Diajukan
                </span>
                <span className="text-[#0F172A] font-bold text-[19px]">
                  {selectedRequest && formatIDR(selectedRequest.amount)}
                </span>
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
                    Dana yang disetujui otomatis dipotong biaya administrasi 10%
                    sesuai Refund Policy.
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
            </div>

            {selectedRequest?.status === "pending" ? (
              <div className="px-6 py-5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex gap-3">
                <button
                  onClick={() => handleDecision("rejected")}
                  className="flex-1 py-2.5 bg-white border border-[#FCA5A5] text-[#DC2626] font-bold text-[13px] rounded-[8px] hover:bg-[#FEE2E2] transition-colors flex items-center justify-center gap-1.5"
                >
                  <Ban size={14} />
                  Tolak
                </button>
                <button
                  onClick={() => handleDecision("approved")}
                  className="flex-1 py-2.5 bg-[#148F89] text-white font-bold text-[13px] rounded-[8px] hover:bg-[#117A75] transition-colors flex items-center justify-center gap-1.5"
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
