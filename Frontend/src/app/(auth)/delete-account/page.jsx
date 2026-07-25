"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, ShieldAlert } from "lucide-react";
import { api, ApiError, clearTokens } from "@/lib/api";

const autofillFix = `
  .auth-illustration { display: none; }
  @media (min-width: 1024px) {
    .auth-illustration { display: block; }
  }
`;

function DeleteAccountContent() {
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  // "confirm" = nunggu user klik tombol (sengaja gak auto-hapus pas load, biar
  // prefetch link di email gak ngehapus akun tanpa sadar). "loading" pas proses,
  // lalu "success"/"error".
  const linkValid = Boolean(uid && token);
  const [status, setStatus] = useState(linkValid ? "confirm" : "invalid");
  const [message, setMessage] = useState("");

  const handleConfirm = async () => {
    setStatus("loading");
    try {
      const data = await api.post(
        "/api/accounts/delete-account/confirm/",
        { uid, token },
        { auth: false },
      );
      // Kalau kebetulan lagi login di device ini, buang tokennya juga.
      clearTokens();
      setStatus("success");
      setMessage(data?.detail || "Akun berhasil dihapus.");
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof ApiError ? err.message : "Terjadi kesalahan. Coba lagi.",
      );
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#0F081C] font-inter text-white relative">
      <style>{autofillFix}</style>

      <div className="absolute inset-x-0 top-0 h-[400px] overflow-hidden pointer-events-none z-0">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[150vw] md:w-[120vw] h-[300px] md:h-[400px] rounded-b-[100%]"
          style={{
            background: "radial-gradient(ellipse at top, rgba(177, 158, 239, 0.15) 0%, transparent 60%)",
            filter: "blur(40px)",
          }}
        />
      </div>

      <div
        className="relative z-10 w-full min-h-screen flex items-center justify-center px-6 py-16"
        style={{ gap: "60px", flexWrap: "wrap" }}
      >
        <div style={{ width: "100%", maxWidth: "380px", flexShrink: 0 }} className="flex flex-col gap-4">
          <img src="/images/logo-markup.svg" alt="Mark-Up" className="w-[150px]" />

          {status === "invalid" && (
            <>
              <div className="w-[48px] h-[48px] rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <XCircle className="w-[22px] h-[22px] text-red-400" />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="font-bold text-white text-[24px] font-poppins">Link Tidak Lengkap</p>
                <p className="text-[13px] text-[#9CA3AF] leading-relaxed">
                  Link konfirmasi tidak lengkap. Pastikan kamu klik link langsung dari email.
                </p>
              </div>
            </>
          )}

          {status === "confirm" && (
            <>
              <div className="w-[48px] h-[48px] rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <ShieldAlert className="w-[22px] h-[22px] text-red-400" />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="font-bold text-white text-[24px] font-poppins">Konfirmasi Hapus Akun</p>
                <p className="text-[13px] text-[#9CA3AF] leading-relaxed">
                  Dengan mengklik tombol di bawah, akunmu langsung dinonaktifkan
                  dan gak bisa dipakai login lagi. Riwayat transaksi &amp;
                  sertifikat tetap tersimpan. Tindakan ini gak bisa dibatalkan
                  sendiri &mdash; hubungi support kalau berubah pikiran.
                </p>
              </div>
              <button
                onClick={handleConfirm}
                className="bg-red-500 flex items-center justify-center w-full h-[48px] rounded-[12px] text-white font-bold text-[14px] hover:bg-red-600 transition-colors mt-1"
              >
                Ya, Hapus Akun Saya
              </button>
              <Link
                href="/"
                className="flex items-center justify-center w-full h-[48px] rounded-[12px] border border-[#2D2342] text-[#9CA3AF] font-semibold text-[14px] hover:text-white transition-colors"
              >
                Batal
              </Link>
            </>
          )}

          {status === "loading" && (
            <>
              <div className="w-[48px] h-[48px] rounded-full bg-[#B19EEF]/10 border border-[#B19EEF]/30 flex items-center justify-center">
                <Loader2 className="w-[22px] h-[22px] text-[#B19EEF] animate-spin" />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="font-bold text-[#B19EEF] text-[24px] font-poppins">Menghapus Akun...</p>
                <p className="text-[13px] text-[#9CA3AF] leading-relaxed">Tunggu sebentar ya.</p>
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-[48px] h-[48px] rounded-full bg-[#148F89]/10 border border-[#148F89]/30 flex items-center justify-center">
                <CheckCircle2 className="w-[22px] h-[22px] text-[#148F89]" />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="font-bold text-white text-[24px] font-poppins">Akun Dihapus</p>
                <p className="text-[13px] text-[#9CA3AF] leading-relaxed">{message}</p>
              </div>
              <Link
                href="/"
                className="bg-[#B19EEF] flex items-center justify-center w-full h-[48px] rounded-[12px] text-black font-bold text-[14px] transition-colors mt-1"
              >
                Ke Beranda
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-[48px] h-[48px] rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <XCircle className="w-[22px] h-[22px] text-red-400" />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="font-bold text-white text-[24px] font-poppins">Gagal Menghapus</p>
                <p className="text-[13px] text-[#9CA3AF] leading-relaxed">{message}</p>
              </div>
              <p className="text-[12px] text-[#6B7280] leading-relaxed">
                Kalau linknya sudah kedaluwarsa (berlaku 30 menit), minta ulang
                dari halaman Pengaturan akunmu.
              </p>
            </>
          )}

          <p className="text-[13px] text-center text-[#9CA3AF]">
            <Link href="/" className="text-[#08C7E1] hover:underline">
              Kembali ke Beranda
            </Link>
          </p>
        </div>

        <div className="auth-illustration" style={{ width: "380px", height: "460px", flexShrink: 0 }}>
          <img
            src="/images/placeholder_auth.png"
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>
      </div>
    </div>
  );
}

export default function DeleteAccountPage() {
  return (
    <Suspense fallback={<div className="w-full min-h-screen bg-[#0F081C]" />}>
      <DeleteAccountContent />
    </Suspense>
  );
}
