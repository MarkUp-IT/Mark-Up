"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Landmark, Copy, CheckCircle2, AlertCircle, Upload, FileText, Trash2, Clock, AlertTriangle, Users, Zap } from "lucide-react";
import { apiRequest, apiRequestRaw, getAccessToken } from "@/lib/api";
import { useBankInfo } from "@/lib/bankInfo";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/formErrors";

const MAX_PROOF_SIZE = 5 * 1024 * 1024;

const formatIDR = (val) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(val));

function formatMB(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

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
  const [referralCode, setReferralCode] = useState("");
  const [invitedEmails, setInvitedEmails] = useState("");
  const { bankInfo } = useBankInfo();

  // "MANUAL" (transfer + upload bukti) atau "IPAYMU" (redirect, otomatis).
  // Pemilihnya cuma muncul kalau ipaymuEnabled -- persis pola yang sama
  // di halaman checkout produk lain.
  const [gateway, setGateway] = useState("MANUAL");
  const [ipaymuEnabled, setIpaymuEnabled] = useState(false);

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiRequest("/api/transactions/ipaymu/available/", { auth: false });
        if (!cancelled && res?.enabled) setIpaymuEnabled(true);
      } catch {
        // Diam saja -- fallback ke transfer manual.
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleCopyBank = () => {
    navigator.clipboard.writeText(bankInfo.account.replace(/\s/g, ""));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSubmit = async () => {
    if (!file || submitting) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("proof_of_payment", file);
      if (referralCode.trim()) {
        formData.append("referral_code", referralCode.trim());
      }
      if (invitedEmails.trim()) {
        formData.append("invited_emails", invitedEmails.trim());
      }
      const res = await apiRequestRaw(`/api/products/bootcamp-registrations/${registrationId}/pay/`, formData);
      const data = res.data;
      if (!res.ok) {
        const msg =
          data?.detail ||
          (res.status === 413
            ? "Ukuran berkas melebihi batas server. Mohon perkecil ukuran berkas, lalu coba kembali."
            : data === null
              ? "Terjadi kesalahan tak terduga di server. Coba lagi."
              : (res.message || "Gagal mengirim pembayaran."));
        throw new Error(msg);
      }
      toast.success("Pembayaran Terkirim", { description: "Menunggu diverifikasi admin." });
      if (data?.invite_warnings?.length > 0) {
        toast.warning("Sebagian Email Ajakan Tidak Berlaku", {
          description: data.invite_warnings.join(" "),
        });
      }
      setFile(null);
      setInvitedEmails("");
      fetchRegistration();
    } catch (err) {
      toast.error("Gagal Mengirim Pembayaran", { description: err?.message || "Coba lagi." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmIpaymu = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      // Dua langkah, sama persis alasannya kayak halaman checkout produk
      // lain: (1) bikin Transaction-nya dulu (endpoint bayar yang sama,
      // cuma payment_gateway=IPAYMU & tanpa file), (2) minta sesi bayar
      // buat Transaction itu lewat endpoint iPaymu yang generic (dipakai
      // bareng jalur checkout produk lain, gak ada logika beda di situ).
      const payRes = await apiRequest(`/api/products/bootcamp-registrations/${registrationId}/pay/`, {
        method: "POST",
        body: {
          payment_gateway: "IPAYMU",
          ...(referralCode.trim() ? { referral_code: referralCode.trim() } : {}),
          ...(invitedEmails.trim() ? { invited_emails: invitedEmails.trim() } : {}),
        },
      });

      const txnId = payRes?.registration?.payment?.transaction_id;
      if (!txnId) throw new Error("Transaksi tidak ditemukan setelah pembayaran dibuat.");

      const sessionRes = await apiRequest(`/api/transactions/${txnId}/ipaymu/create-session/`, {
        method: "POST",
      });

      window.location.href = sessionRes.redirect_url;
    } catch (err) {
      const pesan = extractErrorMessage(err, "Gagal memulai pembayaran iPaymu.");
      toast.error("Gagal Memulai Pembayaran", { description: pesan });
      setSubmitting(false);
    }
  };

  const payment = registration?.payment;
  // Diskon KODE referral dihitung server (aturan persen/nominal + batas
  // maksimum ada di sana), jadi baru kelihatan setelah pembayaran terkirim --
  // sama kayak checkout produk lain yang juga gak pratinjau diskon di browser.
  const appliedDiscount = Number(payment?.discount_amount || 0);
  // Harga TIM cuma berlaku kalau registrasi ini adalah KETUA tim -- tim wajib
  // lengkap sejak daftar (lihat halaman pendaftaran), jadi begitu peran ini
  // "leader" berarti timnya SUDAH PASTI lengkap. Dibayar SEKALI buat SELURUH
  // anggota (harga & commitment fee dikali jumlah anggota).
  const teamPriceActive = registration?.team?.role === "leader" && registration.package.group_price != null;
  const jumlahAnggotaTim = registration?.team?.target_size || 1;
  const subTotal = payment
    ? Number(payment.sub_total)
    : teamPriceActive
      ? Number(registration.package.group_price) * jumlahAnggotaTim
      : Number(registration?.package?.price || 0);
  const commitmentFeeTampil = teamPriceActive
    ? Number(registration.package.commitment_fee) * jumlahAnggotaTim
    : Number(registration?.package?.commitment_fee || 0);
  const total = registration
    ? (payment
      ? Number(payment.grand_total)
      : subTotal + commitmentFeeTampil)
    : 0;
  const showForm =
    registration
    && registration.status === "accepted"
    && !registration.payment_deadline_passed
    && (!payment || payment.status === "FAILED");

  return (
    <div className="w-full min-h-screen bg-[#0F081C] font-inter text-white">

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
                <span className="text-[#9CA3AF]">
                  {teamPriceActive ? `Harga tim (${jumlahAnggotaTim} orang)` : "Harga paket"}
                </span>
                <div className="flex items-center gap-2">
                  {teamPriceActive && (
                    <span className="text-[#6B7280] line-through text-[12px]">
                      {formatIDR(Number(registration.package.price) * jumlahAnggotaTim)}
                    </span>
                  )}
                  <span className="text-white font-medium">{formatIDR(subTotal)}</span>
                </div>
              </div>
              {teamPriceActive && (
                <div className="flex items-center gap-1.5 text-[#148F89] text-[11px]">
                  <Users size={12} /> Total buat kamu + {jumlahAnggotaTim - 1} anggota tim
                  ({registration.team.members.map((m) => m.name).join(", ")}).
                </div>
              )}
              {appliedDiscount > 0 && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#9CA3AF]">Diskon kode referral</span>
                  <span className="text-[#148F89] font-medium">-{formatIDR(appliedDiscount)}</span>
                </div>
              )}
              {!payment && registration.package.referral_invite_enabled && invitedEmails.trim() && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#9CA3AF]">
                    Estimasi diskon ajak teman (~{registration.package.referral_invite_discount_percent}%)
                  </span>
                  <span className="text-[#F59E0B] font-medium">
                    -{formatIDR(
                      (subTotal * registration.package.referral_invite_discount_percent) / 100
                    )}
                  </span>
                </div>
              )}
              {commitmentFeeTampil > 0 && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#9CA3AF]">
                    Commitment fee (refundable){teamPriceActive ? ` -- ${jumlahAnggotaTim} orang` : ""}
                  </span>
                  <span className="text-white font-medium">{formatIDR(commitmentFeeTampil)}</span>
                </div>
              )}
              <div className="flex justify-between text-[15px] border-t border-[#2D2342] pt-2 mt-1">
                <span className="font-semibold">Total Bayar</span>
                <span className="text-[#148F89] font-bold">{formatIDR(total)}</span>
              </div>
              {!payment && registration.package.referral_invite_enabled && invitedEmails.trim() && (
                <p className="text-[#6B7280] text-[11px] -mt-1">
                  Belum termasuk di Total Bayar di atas -- baru dipastikan & dipotongkan sistem
                  kalau email yang kamu tulis valid, saat bukti transfer kamu kirim.
                </p>
              )}
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
                {ipaymuEnabled && (
                  <div className="flex items-center gap-2 bg-[#170F26] border border-[#2D2342] rounded-[12px] p-1.5">
                    <button
                      onClick={() => setGateway("IPAYMU")}
                      className={`flex-1 py-2 rounded-[8px] text-[12.5px] font-semibold transition-colors ${
                        gateway === "IPAYMU" ? "bg-[#148F89] text-white" : "text-[#9CA3AF] hover:text-white"
                      }`}
                    >
                      Bayar Otomatis (iPaymu)
                    </button>
                    <button
                      onClick={() => setGateway("MANUAL")}
                      className={`flex-1 py-2 rounded-[8px] text-[12.5px] font-semibold transition-colors ${
                        gateway === "MANUAL" ? "bg-[#148F89] text-white" : "text-[#9CA3AF] hover:text-white"
                      }`}
                    >
                      Transfer Manual
                    </button>
                  </div>
                )}

                {/* Kode Referral & Ajak Teman -- berlaku buat KEDUA metode
                    bayar (sama-sama mempengaruhi Total Bayar di atas),
                    makanya ditaruh di luar cabang manual/iPaymu. */}
                <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-5 flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[#9CA3AF] text-[12px] font-semibold">Kode Referral (opsional)</label>
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      placeholder="Masukkan kode kalau punya"
                      className="w-full bg-[#0F081C] border border-[#2D2342] rounded-[8px] px-3.5 h-10 text-[13px] text-white outline-none focus:border-[#148F89] transition-colors uppercase"
                    />
                    <span className="text-[#6B7280] text-[11px]">
                      Potongan berlaku untuk harga paket saja
                      {Number(registration.package.commitment_fee) > 0 ? ", commitment fee tidak ikut didiskon." : "."}
                    </span>
                  </div>

                  {registration.package.referral_invite_enabled && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[#9CA3AF] text-[12px] font-semibold flex items-center gap-1.5">
                        <Users size={13} /> Udah Ajak Orang? (opsional)
                      </label>
                      <textarea
                        value={invitedEmails}
                        onChange={(e) => setInvitedEmails(e.target.value)}
                        placeholder="Tulis email orang yang kamu ajak, satu per baris"
                        rows={2}
                        className="w-full bg-[#0F081C] border border-[#2D2342] rounded-[8px] px-3.5 py-2.5 text-[13px] text-white outline-none focus:border-[#148F89] transition-colors resize-none"
                      />
                      <span className="text-[#6B7280] text-[11px]">
                        Cukup satu email yang sudah terdaftar di bootcamp ini dan belum diklaim
                        orang lain untuk dapat potongan {registration.package.referral_invite_discount_percent}%
                        -- gak numpuk walau kamu tulis beberapa email.
                      </span>
                      {registration.invited?.length > 0 && (
                        <span className="text-[#148F89] text-[11px]">
                          Sudah berhasil diklaim sebelumnya: {registration.invited.map((i) => i.email).join(", ")}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {gateway === "IPAYMU" ? (
                  <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-5 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Zap size={16} className="text-[#E2E8F0]" />
                      <span className="font-bold text-[14px] text-white">Bayar dengan iPaymu</span>
                    </div>
                    <p className="text-[#9CA3AF] text-[12px] leading-relaxed">
                      Kamu bakal diarahkan ke halaman iPaymu buat pilih metode (VA, QRIS, e-wallet,
                      atau kartu) dan menyelesaikan pembayaran di sana. Begitu lunas, akses langsung
                      terbuka otomatis -- gak perlu upload bukti apa pun.
                    </p>
                    <button
                      onClick={handleConfirmIpaymu}
                      disabled={submitting}
                      className="w-full py-3 rounded-[8px] bg-[#148F89] text-white font-semibold text-[14px] hover:bg-[#117A75] transition-colors disabled:opacity-50"
                    >
                      {submitting ? "Menyiapkan..." : "Lanjut ke iPaymu"}
                    </button>
                  </div>
                ) : (
                <>
                <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Landmark size={16} className="text-[#E2E8F0]" />
                    <span className="font-bold text-[14px] text-white">Transfer Bank</span>
                  </div>
                  <div className="bg-[#0F081C] border border-[#2D2342] rounded-[8px] p-4 flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[#9CA3AF] text-[11px] font-semibold">{bankInfo.name}</span>
                      <span className="text-white font-bold text-[19px] tracking-widest font-mono">{bankInfo.account}</span>
                      <span className="text-[#E2E8F0] text-[12px] mt-0.5">
                        a.n <span className="font-bold">{bankInfo.holder}</span>
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
                        onChange={(e) => {
                          const selected = e.target.files?.[0] || null;
                          if (selected && selected.size > MAX_PROOF_SIZE) {
                            toast.error("File Terlalu Besar", {
                              description: `Ukuran file (${formatMB(selected.size)}) melebihi batas maksimal ${formatMB(MAX_PROOF_SIZE)}.`,
                            });
                            e.target.value = "";
                            return;
                          }
                          setFile(selected);
                          e.target.value = "";
                        }}
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
          </>
        )}
      </div>
    </div>
  );
}
