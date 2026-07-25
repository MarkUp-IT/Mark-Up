"use client";

import { Eye, X, Landmark, Check, Search } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/component/admin/DashboardLayout";
import StatCard from "@/component/admin/StatCard";
import EmptyState from "@/component/admin/EmptyState";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/formErrors";

const STATUS_META = {
  pending: { label: "BELUM CAIR", className: "bg-[#FEF3C7] text-[#92400E]" },
  paid: { label: "SUDAH CAIR", className: "bg-[#DCFCE7] text-[#166534]" },
};

const TYPE_LABEL = { bootcamp: "Bootcamp", mentoring: "Mentoring" };

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export default function MentorPayouts() {
  const heightFix = `.adm-h-42 { height: 42px; }`;

  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [marking, setMarking] = useState(false);

  // Komisi mentoring global (default 25% ke MarkUp, mentor 75%).
  const [mentoringFee, setMentoringFee] = useState("");
  const [savingFee, setSavingFee] = useState(false);
  // Edit fee per-payout (khusus bootcamp -- diisi manual).
  const [editFee, setEditFee] = useState("");
  const [savingPayoutFee, setSavingPayoutFee] = useState(false);

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/api/transactions/payouts/");
      setPayouts(res?.payouts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayouts();
    apiRequest("/api/transactions/payouts/commission-setting/")
      .then((res) => setMentoringFee(String(res?.mentoring_fee_percent ?? 25)))
      .catch(() => {});
  }, [fetchPayouts]);

  const saveMentoringFee = async () => {
    setSavingFee(true);
    try {
      await apiRequest("/api/transactions/payouts/commission-setting/", {
        method: "PATCH",
        body: { mentoring_fee_percent: Number(mentoringFee) },
      });
      toast.success("Komisi mentoring disimpan", {
        description: `MarkUp ${mentoringFee}%, mentor ${100 - Number(mentoringFee)}%. Berlaku untuk payout mentoring baru.`,
      });
    } catch (err) {
      toast.error("Gagal menyimpan komisi", {
        description: extractErrorMessage(err, "Terjadi kesalahan."),
      });
    } finally {
      setSavingFee(false);
    }
  };

  const savePayoutFee = async () => {
    setSavingPayoutFee(true);
    try {
      const res = await apiRequest(`/api/transactions/payouts/${selectedPayout.id}/fee/`, {
        method: "PATCH",
        body: { fee_percent: Number(editFee) },
      });
      setSelectedPayout(res.payout);
      fetchPayouts();
      toast.success("Komisi diperbarui");
    } catch (err) {
      toast.error("Gagal memperbarui komisi", {
        description: extractErrorMessage(err, "Terjadi kesalahan."),
      });
    } finally {
      setSavingPayoutFee(false);
    }
  };

  useEffect(() => {
    document.body.style.overflow = isModalOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isModalOpen]);

  const formatIDR = (val) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  const openDetail = (p) => {
    setSelectedPayout(p);
    setEditFee(String(p.fee_percent ?? 0));
    setIsModalOpen(true);
  };

  const markAsPaid = async () => {
    setMarking(true);
    try {
      await apiRequest(`/api/transactions/payouts/${selectedPayout.id}/mark-paid/`, {
        method: "PATCH",
      });
      setIsModalOpen(false);
      fetchPayouts();
      toast.success("Pencairan Ditandai Lunas");
    } catch (err) {
      toast.error("Gagal Menandai Lunas", {
        description: extractErrorMessage(err, "Terjadi kesalahan."),
      });
    } finally {
      setMarking(false);
    }
  };

  const filtered =
    statusFilter === "Semua" ? payouts : payouts.filter((p) => p.status === statusFilter);
  const pendingTotal = payouts
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + Number(p.net_amount), 0);
  const pendingCount = payouts.filter((p) => p.status === "pending").length;

  return (
    <DashboardLayout title="Pencairan Mentor">
      <style>{heightFix}</style>

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bold text-[22px] text-[#0F172A]">Pencairan Dana Mentor</h1>
          <p className="text-[#64748B] text-[14px] mt-1">
            Kelola antrian honor mentor per sesi yang udah selesai diajarkan.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard label="Menunggu Dicairkan" value={pendingCount} unit="sesi" variant="warning" />
        <StatCard label="Total Perlu Dicairkan" value={formatIDR(pendingTotal)} />
        <StatCard label="Komisi Mentoring" value={mentoringFee ? `${mentoringFee}%` : "-"} unit="ke MarkUp" />
      </div>

      {/* Setelan komisi mentoring global -- bootcamp diatur manual per payout
          di modal detail. */}
      <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm">
        <div className="flex-1">
          <p className="font-bold text-[14px] text-[#0F172A]">Komisi Mentoring (Global)</p>
          <p className="text-[#64748B] text-[12px] mt-0.5">
            Persen yang masuk kas MarkUp dari tiap payout mentoring. Sisanya buat mentor
            {mentoringFee ? ` (mentor dapat ${100 - Number(mentoringFee)}%)` : ""}. Cuma berlaku ke payout mentoring baru.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              value={mentoringFee}
              onChange={(e) => setMentoringFee(e.target.value)}
              className="w-24 adm-h-42 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] pl-3 pr-7 outline-none focus:border-[#148F89] text-[#1E293B]"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] text-[13px]">%</span>
          </div>
          <button
            onClick={saveMentoringFee}
            disabled={savingFee || mentoringFee === ""}
            className="adm-h-42 px-4 rounded-[8px] bg-[#148F89] text-white text-[13px] font-semibold hover:bg-[#117A75] transition-colors disabled:opacity-50"
          >
            {savingFee ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-[16px] font-semibold text-[#0F172A]">Antrian Pencairan</h2>
          <div className="adm-h-42 bg-[#F1F5F9] px-1.5 rounded-[8px] flex items-center gap-1">
            {[
              { key: "pending", label: "Belum Cair" },
              { key: "paid", label: "Sudah Cair" },
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

        {!loading && filtered.length === 0 ? (
          <EmptyState message="Nggak ada antrian pencairan di kategori ini." />
        ) : (
          <div className="rounded-[12px] overflow-hidden border border-[#E2E8F0] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-6 py-3.5 text-left font-bold text-[#64748B] tracking-wider text-[11px]">MENTOR</th>
                    <th className="px-6 py-3.5 text-left font-bold text-[#64748B] tracking-wider text-[11px]">SUMBER</th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">GROSS</th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">NET (setelah fee)</th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">STATUS</th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] bg-white">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-6 py-4 text-[#1E293B] font-semibold">{item.mentor_name}</td>
                      <td className="px-6 py-4 text-[#64748B]">
                        {TYPE_LABEL[item.source_type]} · {item.source_title || "-"}
                      </td>
                      <td className="px-6 py-4 text-center text-[#64748B] font-medium">
                        {formatIDR(item.gross_amount)}
                      </td>
                      <td className="px-6 py-4 text-center text-[#1E293B] font-bold">
                        {formatIDR(item.net_amount)}
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
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div style={{ width: "440px", maxWidth: "100%" }} className="relative bg-white rounded-[12px] shadow-2xl z-10">
            <div className="px-6 py-5 border-b border-[#E2E8F0] flex justify-between items-center">
              <div>
                <p className="text-[#1E293B] font-bold text-[17px]">Detail Pencairan</p>
                <p className="text-[#64748B] text-[12px] mt-0.5">{formatDate(selectedPayout?.session_date)}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-6 flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <span className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider">Mentor</span>
                <span className="text-[#1E293B] font-semibold text-[15px]">{selectedPayout?.mentor_name}</span>
                <span className="text-[#64748B] text-[13px]">{selectedPayout?.source_title}</span>
              </div>

              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-4 flex flex-col gap-2 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Gross</span>
                  <span className="text-[#1E293B] font-medium">
                    {selectedPayout && formatIDR(selectedPayout.gross_amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Fee Platform ({selectedPayout?.fee_percent}%)</span>
                  <span className="text-[#DC2626] font-medium">
                    -{selectedPayout && formatIDR(selectedPayout.gross_amount - selectedPayout.net_amount)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-[#E2E8F0] pt-2 mt-1">
                  <span className="text-[#1E293B] font-bold">Net Diterima Mentor</span>
                  <span className="text-[#148F89] font-bold text-[16px]">
                    {selectedPayout && formatIDR(selectedPayout.net_amount)}
                  </span>
                </div>
              </div>

              {/* Bootcamp: komisi diisi manual admin (mentoring ngikut setelan
                  global, gak bisa diedit per payout). Cuma selama PENDING. */}
              {selectedPayout?.source_type === "bootcamp" && selectedPayout?.status === "pending" && (
                <div className="flex flex-col gap-2 bg-[#FEF9C3]/40 border border-[#FDE68A] rounded-[8px] p-4">
                  <span className="text-[#854D0E] font-bold text-[12px]">Atur Komisi Bootcamp</span>
                  <p className="text-[#92400E] text-[11px]">
                    Isi persen yang masuk kas MarkUp buat payout ini. Sisanya buat mentor.
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editFee}
                        onChange={(e) => setEditFee(e.target.value)}
                        className="w-24 h-[38px] bg-white border border-[#E2E8F0] rounded-[8px] pl-3 pr-7 outline-none focus:border-[#148F89] text-[#1E293B]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] text-[13px]">%</span>
                    </div>
                    <button
                      onClick={savePayoutFee}
                      disabled={savingPayoutFee || editFee === ""}
                      className="h-[38px] px-4 rounded-[8px] bg-[#148F89] text-white text-[12px] font-semibold hover:bg-[#117A75] transition-colors disabled:opacity-50"
                    >
                      {savingPayoutFee ? "..." : "Terapkan"}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Landmark size={15} className="text-[#148F89]" />
                  <span className="text-[#1E293B] font-bold text-[13px]">Rekening Tujuan</span>
                </div>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 py-3 flex flex-col gap-0.5">
                  <span className="text-[#1E293B] font-semibold text-[13px]">
                    {selectedPayout?.bank_name || "-"} — {selectedPayout?.bank_account || "-"}
                  </span>
                  <span className="text-[#64748B] text-[12px]">a.n. {selectedPayout?.bank_account_holder || "-"}</span>
                </div>
              </div>
            </div>

            {selectedPayout?.status === "pending" ? (
              <div className="px-6 py-5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-white border border-[#E2E8F0] text-[#475569] font-bold text-[13px] rounded-[8px] hover:bg-[#F1F5F9] transition-colors"
                >
                  Tutup
                </button>
                <button
                  onClick={markAsPaid}
                  disabled={marking}
                  className="px-5 py-2.5 bg-[#148F89] text-white font-bold text-[13px] rounded-[8px] hover:bg-[#117A75] transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check size={14} />
                  {marking ? "Memproses..." : "Tandai Sudah Cair"}
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
