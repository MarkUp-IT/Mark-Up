"use client";

import { useState, useEffect, useCallback } from "react";
import { X, FileText, ShieldCheck } from "lucide-react";
import DashboardLayout from "@/component/admin/DashboardLayout";
import EmptyState from "@/component/admin/EmptyState";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/formErrors";

const STATUS_FILTERS = ["Semua", "registered", "accepted", "rejected"];
const STATUS_LABEL = {
  registered: "Menunggu Ditinjau",
  accepted: "Diterima",
  rejected: "Ditolak",
};
const STATUS_BADGE = {
  registered: "bg-[#FEF3C7] text-[#92400E]",
  accepted: "bg-[#DCFCE7] text-[#166534]",
  rejected: "bg-[#FEE2E2] text-[#991B1B]",
};

const QUIZ_STATUS_LABEL = {
  not_started: "Belum Dimulai",
  in_progress: "Sedang Dikerjakan",
  submitted: "Selesai Dikumpulkan",
  expired: "Waktu Habis (Auto-submit)",
};

function formatDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminBootcampRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [selected, setSelected] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/api/products/bootcamp-registrations/");
      setRegistrations(res?.registrations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openDetail = (reg) => {
    setSelected(reg);
    setAdminNotes(reg.admin_notes || "");
  };

  const handleDecision = async (decision) => {
    if (!selected || saving) return;
    setSaving(true);
    try {
      await apiRequest(`/api/products/bootcamp-registrations/${selected.id}/review/`, {
        method: "PATCH",
        body: { decision, admin_notes: adminNotes },
      });
      toast.success(decision === "accepted" ? "Pendaftaran Diterima" : "Pendaftaran Ditolak");
      setSelected(null);
      fetchData();
    } catch (err) {
      toast.error("Gagal Memproses", { description: extractErrorMessage(err, "Terjadi kesalahan.") });
    } finally {
      setSaving(false);
    }
  };

  const filtered = registrations.filter(
    (r) => statusFilter === "Semua" || r.status === statusFilter,
  );

  const pendingCount = registrations.filter((r) => r.status === "registered").length;

  return (
    <DashboardLayout title="Pendaftaran Bootcamp">
      <div className="flex flex-col gap-1">
        <h1 className="font-bold text-[22px] text-[#0F172A]">Pendaftaran Bootcamp</h1>
        <p className="text-[#64748B] text-[14px]">
          Tinjau pendaftar bootcamp. Paket Mentee lewat seleksi; paket lain cukup di-ACC. Pembayaran dilakukan setelah diterima.
        </p>
      </div>

      <div className="max-w-full overflow-x-auto no-scrollbar">
        <div className="inline-flex items-center gap-1 bg-white border border-[#E2E8F0] rounded-[10px] p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-4 py-2 rounded-[8px] text-[13px] font-medium whitespace-nowrap transition-colors ${
                statusFilter === f ? "bg-[#148F89] text-white shadow-sm" : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              {f === "Semua" ? `Semua${pendingCount ? ` · ${pendingCount} baru` : ""}` : STATUS_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      {!loading && filtered.length === 0 ? (
        <EmptyState message="Belum ada pendaftaran pada filter ini." />
      ) : (
        <div className="rounded-[12px] overflow-hidden border border-[#E2E8F0] shadow-sm bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] border-collapse" style={{ minWidth: "720px" }}>
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-4 py-3.5 text-left font-bold text-[#64748B] text-[11px] tracking-wider">PENDAFTAR</th>
                  <th className="px-4 py-3.5 text-left font-bold text-[#64748B] text-[11px] tracking-wider">BOOTCAMP</th>
                  <th className="px-4 py-3.5 text-left font-bold text-[#64748B] text-[11px] tracking-wider">PAKET</th>
                  <th className="px-4 py-3.5 text-center font-bold text-[#64748B] text-[11px] tracking-wider">TANGGAL</th>
                  <th className="px-4 py-3.5 text-center font-bold text-[#64748B] text-[11px] tracking-wider">STATUS</th>
                  <th className="px-4 py-3.5 text-center font-bold text-[#64748B] text-[11px] tracking-wider">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#1E293B]">{r.user_name}</span>
                        <span className="text-[#94A3B8] text-[12px]">{r.user_email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[#475569]">{r.bootcamp_title}</td>
                    <td className="px-4 py-4">
                      <span className="text-[#1E293B] font-medium">{r.package.name}</span>
                      {r.package.requires_selection && (
                        <span className="ml-1.5 inline-flex items-center gap-0.5 text-[#B45309] text-[10px] font-semibold">
                          <ShieldCheck size={11} /> seleksi
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center text-[#64748B]">{formatDate(r.created_at)}</td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex px-3 py-1.5 text-[11px] rounded-full font-bold ${STATUS_BADGE[r.status]}`}>
                        {STATUS_LABEL[r.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => openDetail(r)}
                        className="px-3 py-1.5 rounded-[6px] border border-[#E2E8F0] text-[#148F89] text-[12px] font-semibold hover:bg-[#148F89]/5 transition-colors"
                      >
                        Tinjau
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-[460px] rounded-[16px] shadow-2xl flex flex-col">
            <div className="px-6 py-5 border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="text-[#0F172A] font-bold text-[17px]">Tinjau Pendaftaran</h3>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-[8px] text-[#64748B] hover:bg-[#F1F5F9] transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1 text-[13px]">
                <div className="flex justify-between"><span className="text-[#64748B]">Pendaftar</span><span className="text-[#1E293B] font-medium">{selected.user_name}</span></div>
                <div className="flex justify-between"><span className="text-[#64748B]">Email</span><span className="text-[#1E293B] font-medium">{selected.user_email}</span></div>
                <div className="flex justify-between"><span className="text-[#64748B]">Bootcamp</span><span className="text-[#1E293B] font-medium">{selected.bootcamp_title}</span></div>
                <div className="flex justify-between"><span className="text-[#64748B]">Paket</span><span className="text-[#1E293B] font-medium">{selected.package.name}</span></div>
                <div className="flex justify-between"><span className="text-[#64748B]">Jalur</span><span className="text-[#1E293B] font-medium">{selected.package.requires_selection ? "Seleksi (Mentee)" : "Langsung (ACC)"}</span></div>
              </div>

              {selected.package.requires_selection && selected.quiz && (
                <div className="flex flex-col gap-1 text-[13px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-3.5 py-3">
                  <div className="flex items-center gap-1.5 text-[#0F172A] font-semibold text-[12.5px] mb-1">
                    <ShieldCheck size={13} className="text-[#148F89]" /> Tes BCC
                  </div>
                  <div className="flex justify-between"><span className="text-[#64748B]">Status</span><span className="text-[#1E293B] font-medium">{QUIZ_STATUS_LABEL[selected.quiz.status] || selected.quiz.status}</span></div>
                  {selected.quiz.score_percent != null && (
                    <>
                      <div className="flex justify-between"><span className="text-[#64748B]">Skor</span><span className="text-[#1E293B] font-medium">{selected.quiz.score_percent}%</span></div>
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Hasil</span>
                        <span className={`font-semibold ${selected.quiz.passed ? "text-[#166534]" : "text-[#991B1B]"}`}>
                          {selected.quiz.passed ? "Lulus Ambang Skor" : "Belum Capai Ambang Skor"}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {selected.requirement_doc ? (
                <a href={selected.requirement_doc} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-2.5 rounded-[8px] border border-[#E2E8F0] text-[#148F89] text-[13px] font-semibold hover:bg-[#148F89]/5 transition-colors">
                  <FileText size={15} /> Lihat Dokumen Syarat (PDF)
                </a>
              ) : (
                <p className="text-[#94A3B8] text-[12px] italic text-center">Dokumen tidak tersedia.</p>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[#64748B] text-[12px] font-semibold">Catatan (opsional)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  placeholder="Catatan internal atau alasan keputusan..."
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-3.5 py-2.5 text-[13px] text-[#1E293B] outline-none focus:border-[#148F89] transition-colors resize-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDecision("rejected")}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-[8px] border border-red-300 text-red-600 text-[13px] font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  Tolak
                </button>
                <button
                  onClick={() => handleDecision("accepted")}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-[8px] bg-[#148F89] text-white text-[13px] font-semibold hover:bg-[#117A75] transition-colors disabled:opacity-50"
                >
                  {saving ? "Memproses..." : "Terima"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
