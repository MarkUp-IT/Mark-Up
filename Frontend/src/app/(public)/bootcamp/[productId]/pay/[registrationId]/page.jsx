"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Landmark, Copy, CheckCircle2, AlertCircle, Upload, FileText, Trash2, Clock, AlertTriangle } from "lucide-react";
import Navbar from "@/component/Navbar";
import { apiRequest, getAccessToken, API_BASE } from "@/lib/api";
import { BANK_INFO } from "@/lib/bankInfo";
import { toast } from "sonner";

const formatIDR = (val) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(val));

const PAYMENT_STATUS_META = {
  PENDING: { label: "Menunggu Verifikasi Admin", cls: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30" },
  PAID: { label: "Lunas", cls: "bg-[#148F89]/10 text-[#148F89] border-[#148F89]/30" },
  FAILED: { label: "Ditolak, Bisa Coba Lagi", cls: "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30" },
};

export default function BootcampPaymentPage() {
  const params = useParams();
  const { productId, registrationId } = params;

  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchRegistration = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/api/products/bootcamp-registrations/me/");
      const found = (res?.registrations || []).find((r) => r.id === registrationId);
      if (!found) {
        setError("Pendaftaran tidak ditemukan.");
      } else {
        setRegistration(found);
      }
    } catch (err) {
      setError(err?.message || "Gagal memuat data pendaftaran.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registrationId]);

  const handleCopyBank = () => {
    navigator.clipboard.writeText(BANK_INFO.account.replace(/\s/g, ""));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSubmit = async () => {
    if (!file || submitting) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("proof_of_payment", file);
      const res = await fetch(`${API_BASE}/api/products/bootcamp-registrations/${registrationId}/pay/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.detail || "Gagal mengirim pembayaran.");
      }
      toast.success("Pembayaran Terkirim", { description: "Menunggu diverifikasi admin." });
      setFile(null);
      fetchRegistration();
    } catch (err) {
      toast.error("Gagal Mengirim Pembayaran", { description: err?.message || "Coba lagi." });
    } finally {
      setSubmitting(false);
    }
  };

  const total = registration ? Number(registration.package.price) + Number(registration.package.commitment_fee) : 0;
  const payment = registration?.payment;
  const showForm =
    registration
    && registration.status === "accepted"
    && !registration.payment_deadline_passed
    && (!payment || payment.status === "FAILED");

  return (
    <div className="w-full min-h-screen bg-[#0F081C] font-inter text-white">
      <Navbar variant="solid" />

      <div className="max-w-[640px] mx-auto px-4 pt-32 pb-16 flex flex-col gap-6">
        <Link href={`/bootcamp/${productId}/register`} className="text-[#9CA3AF] hover:text-white text-[13px] transition-colors w-fit">
          ← Kembali ke Status Pendaftaran
        </Link>

        {loading ? (
          <p className="text-[#9CA3AF] text-[14px]">Memuat...</p>
        ) : error ? (
          <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-6 flex flex-col items-center gap-3 text-center">
            <AlertTriangle size={28} className="text-[#EF4444]" />
            <p className="text-[#E2E8F0] text-[14px]">{error}</p>
          </div>
        ) : registration.status !== "accepted" ? (
          <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-6 flex flex-col items-center gap-3 text-center">
            <AlertTriangle size={28} className="text-[#F59E0B]" />
            <p className="text-[#E2E8F0] text-[14px]">
              Pembayaran cuma bisa dilakukan setelah pendaftaran kamu dinyatakan Diterima.
            </p>
          </div>
        ) : registration.payment_deadline_passed && payment?.status !== "PAID" ? (
          <div className="bg-[#170F26] border border-[#EF4444]/30 rounded-[12px] p-6 flex flex-col items-center gap-3 text-center">
            <AlertTriangle size={28} className="text-[#EF4444]" />
            <p className="text-[#E2E8F0] text-[14px]">
              Batas waktu pembayaran untuk paket {registration.package.name} sudah lewat.
            </p>
            <p className="text-[#9CA3AF] text-[12px]">Hubungi admin kalau kamu merasa ini keliru.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <h1 className="text-[24px] font-bold leading-tight">Pembayaran Bootcamp</h1>
              <p className="text-[#9CA3AF] text-[13px]">
                Paket {registration.package.name} -- {registration.bootcamp_title}
              </p>
            </div>

            <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-5 flex flex-col gap-2">
              <div className="flex justify-between text-[13px]">
                <span className="text-[#9CA3AF]">Harga paket</span>
                <span className="text-white font-medium">{formatIDR(registration.package.price)}</span>
              </div>
              {Number(registration.package.commitment_fee) > 0 && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#9CA3AF]">Commitment fee (refundable)</span>
                  <span className="text-white font-medium">{formatIDR(registration.package.commitment_fee)}</span>
                </div>
              )}
              <div className="flex justify-between text-[15px] border-t border-[#2D2342] pt-2 mt-1">
                <span className="font-semibold">Total Bayar</span>
                <span className="text-[#148F89] font-bold">{formatIDR(total)}</span>
              </div>
            </div>

            {payment && (
              <div className={`flex items-center gap-2.5 rounded-[10px] px-4 py-3 border text-[13px] font-semibold ${PAYMENT_STATUS_META[payment.status]?.cls || ""}`}>
                <Clock size={15} className="shrink-0" />
                {PAYMENT_STATUS_META[payment.status]?.label || payment.status}
              </div>
            )}

            {payment?.status === "PAID" && (
              <div className="bg-[#170F26] border border-[#148F89]/30 rounded-[12px] p-6 flex flex-col items-center gap-2 text-center">
                <CheckCircle2 size={28} className="text-[#148F89]" />
                <p className="text-[#E2E8F0] text-[13px]">
                  Pembayaran kamu sudah dikonfirmasi. Sampai jumpa di kelas!
                </p>
              </div>
            )}

            {payment?.status === "PENDING" && (
              <p className="text-[#9CA3AF] text-[12px] text-center">
                Bukti transfer kamu sedang ditinjau admin, biasanya selesai dalam 1x24 jam.
              </p>
            )}

            {showForm && (
              <>
                <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Landmark size={16} className="text-[#E2E8F0]" />
                    <span className="font-bold text-[14px] text-white">Transfer Bank</span>
                  </div>
                  <div className="bg-[#0F081C] border border-[#2D2342] rounded-[8px] p-4 flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[#9CA3AF] text-[11px] font-semibold">{BANK_INFO.name}</span>
                      <span className="text-white font-bold text-[19px] tracking-widest font-mono">{BANK_INFO.account}</span>
                      <span className="text-[#E2E8F0] text-[12px] mt-0.5">
                        a.n <span className="font-bold">{BANK_INFO.holder}</span>
                      </span>
                    </div>
                    <button
                      onClick={handleCopyBank}
                      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-[6px] border transition-colors text-[11px] font-bold w-fit ${
                        isCopied ? "border-[#10B981] text-[#10B981] bg-[#10B981]/10" : "border-[#2D2342] text-[#9CA3AF] hover:text-white hover:bg-[#2D1B4E]"
                      }`}
                    >
                      {isCopied ? (<><CheckCircle2 size={14} /> Disalin</>) : (<><Copy size={14} /> Salin No. Rekening</>)}
                    </button>
                  </div>
                  <div className="flex items-start gap-2 bg-[#F59E0B]/10 border border-[#F59E0B]/30 p-3 rounded-[8px]">
                    <AlertCircle size={15} className="text-[#F59E0B] shrink-0 mt-0.5" />
                    <p className="text-[#FBBF24] text-[11px] leading-relaxed">
                      Transfer sesuai nominal persis: <span className="font-bold">{formatIDR(total)}</span>.
                    </p>
                  </div>
                </div>

                <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-5 flex flex-col gap-3">
                  <div>
                    <h2 className="font-bold text-[14px] text-white">Unggah Bukti Transfer</h2>
                    <p className="text-[#9CA3AF] text-[11px] mt-0.5">Format JPG, PNG, atau PDF (maks. 5MB)</p>
                  </div>
                  {file ? (
                    <div className="flex items-center justify-between gap-3 bg-[#0F081C] border border-[#148F89]/50 rounded-[8px] px-4 py-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText size={18} className="text-[#148F89] shrink-0" />
                        <span className="text-white text-[12px] font-medium truncate">{file.name}</span>
                      </div>
                      <button onClick={() => setFile(null)} className="p-1.5 text-[#9CA3AF] hover:bg-red-500/10 hover:text-red-400 rounded-full transition-colors shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2.5 border-2 border-dashed border-[#2D2342] rounded-[10px] py-8 text-[#9CA3AF] hover:border-[#148F89]/50 hover:bg-[#148F89]/5 transition-all cursor-pointer">
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        className="hidden"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                      />
                      <div className="w-9 h-9 rounded-full bg-[#1A1128] flex items-center justify-center">
                        <Upload size={16} className="text-[#148F89]" />
                      </div>
                      <span className="text-[12px] font-semibold text-[#E2E8F0]">Klik untuk memilih file</span>
                    </label>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={!file || submitting}
                    className="w-full py-3 rounded-[8px] bg-[#148F89] text-white font-semibold text-[14px] hover:bg-[#117A75] transition-colors disabled:opacity-50"
                  >
                    {submitting ? "Mengirim..." : payment?.status === "FAILED" ? "Kirim Ulang Bukti Pembayaran" : "Konfirmasi Pembayaran"}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
