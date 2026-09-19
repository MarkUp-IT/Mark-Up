"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import EmptyState from "@/component/admin/EmptyState";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/formErrors";

const STATUS_FILTERS = ["Semua", "Belum Dikembalikan", "Sudah Dikembalikan"];

function formatDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

const formatIDR = (val) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(val));

export default function AdminBootcampRefunds() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [togglingId, setTogglingId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/api/transactions/commitment-fee-refunds/");
      setRefunds(res?.refunds || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggle = async (transactionId) => {
    setTogglingId(transactionId);
    try {
      await apiRequest(`/api/transactions/${transactionId}/commitment-fee-refund/`, { method: "PATCH" });
      toast.success("Status Pengembalian Diperbarui");
      fetchData();
    } catch (err) {
      toast.error("Gagal Memperbarui", { description: extractErrorMessage(err, "Terjadi kesalahan.") });
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = refunds.filter((r) => {
    if (statusFilter === "Belum Dikembalikan") return !r.refunded_at;
    if (statusFilter === "Sudah Dikembalikan") return !!r.refunded_at;
    return true;
  });

  const pendingCount = refunds.filter((r) => !r.refunded_at).length;

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="font-bold text-[22px] text-[#0F172A]">Pengembalian Commitment Fee</h1>
        <p className="text-[#64748B] text-[14px]">
          Daftar peserta Mentee yang sudah lunas commitment fee. Tandai manual setelah transfer pengembalian
          dilakukan di luar sistem. Status &ldquo;Berhak&rdquo; cuma indikator otomatis dari syarat kehadiran
          yang diatur di paket -- keputusan kembalikan tetap di tanganmu.
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
              {f === "Semua" ? `Semua${pendingCount ? ` · ${pendingCount} belum` : ""}` : f}
            </button>
          ))}
        </div>
      </div>

      {!loading && filtered.length === 0 ? (
        <EmptyState message="Belum ada peserta dengan commitment fee lunas pada filter ini." />
      ) : (
        <div className="rounded-[12px] overflow-hidden border border-[#E2E8F0] shadow-sm bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] border-collapse" style={{ minWidth: "820px" }}>
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-4 py-3.5 text-left font-bold text-[#64748B] text-[11px] tracking-wider">PESERTA</th>
                  <th className="px-4 py-3.5 text-left font-bold text-[#64748B] text-[11px] tracking-wider">BOOTCAMP / PAKET</th>
                  <th className="px-4 py-3.5 text-center font-bold text-[#64748B] text-[11px] tracking-wider">KEHADIRAN</th>
                  <th className="px-4 py-3.5 text-center font-bold text-[#64748B] text-[11px] tracking-wider">BERHAK</th>
                  <th className="px-4 py-3.5 text-right font-bold text-[#64748B] text-[11px] tracking-wider">COMMITMENT FEE</th>
                  <th className="px-4 py-3.5 text-center font-bold text-[#64748B] text-[11px] tracking-wider">STATUS</th>
                  <th className="px-4 py-3.5 text-center font-bold text-[#64748B] text-[11px] tracking-wider">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filtered.map((r) => (
                  <tr key={r.transaction_id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#1E293B]">{r.user_name}</span>
                        <span className="text-[#94A3B8] text-[12px]">{r.user_email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="text-[#1E293B]">{r.bootcamp_title || "-"}</span>
                        <span className="text-[#94A3B8] text-[12px]">{r.package_name || "-"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center text-[#475569]">
                      {r.sessions_completed} / {r.sessions_total}
                      {r.min_attendance_sessions > 0 && (
                        <div className="text-[#94A3B8] text-[11px]">min. {r.min_attendance_sessions}</div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold ${
                        r.eligible ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#FEF3C7] text-[#92400E]"
                      }`}>
                        {r.eligible ? "Berhak" : "Belum"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right text-[#1E293B] font-medium">{formatIDR(r.commitment_fee_amount)}</td>
                    <td className="px-4 py-4 text-center">
                      {r.refunded_at ? (
                        <div className="flex flex-col items-center">
                          <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-[#DCFCE7] text-[#166534]">
                            Sudah Dikembalikan
                          </span>
                          <span className="text-[#94A3B8] text-[11px] mt-0.5">{formatDate(r.refunded_at)}</span>
                        </div>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-[#FEE2E2] text-[#991B1B]">
                          Belum Dikembalikan
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => handleToggle(r.transaction_id)}
                        disabled={togglingId === r.transaction_id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[12px] font-semibold transition-colors disabled:opacity-50 ${
                          r.refunded_at
                            ? "border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]"
                            : "bg-[#148F89] text-white hover:bg-[#117A75]"
                        }`}
                      >
                        {r.refunded_at ? <Circle size={13} /> : <CheckCircle2 size={13} />}
                        {togglingId === r.transaction_id
                          ? "Memproses..."
                          : r.refunded_at ? "Batal Tandai" : "Tandai Dikembalikan"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
