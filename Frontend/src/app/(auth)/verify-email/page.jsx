"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, MailCheck } from "lucide-react";
import { api, ApiError } from "@/lib/api";

const autofillFix = `
  .auth-illustration { display: none; }
  @media (min-width: 1024px) {
    .auth-illustration { display: block; }
  }
`;

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  const [resendEmail, setResendEmail] = useState("");
  const [resendSubmitting, setResendSubmitting] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    if (!uid || !token) {
      setStatus("error");
      setMessage("Link verifikasi tidak lengkap. Pastikan kamu klik link langsung dari email.");
      return;
    }

    api
      .post("/api/accounts/verify-email/", { uid, token }, { auth: false })
      .then((data) => {
        setStatus("success");
        setMessage(data?.detail || "Email berhasil diverifikasi.");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(
          err instanceof ApiError
            ? err.message
            : "Terjadi kesalahan. Coba lagi.",
        );
      });
  }, [uid, token]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail.trim() || resendSubmitting) return;
    setResendSubmitting(true);
    try {
      await api.post(
        "/api/accounts/resend-verification/",
        { email: resendEmail.trim() },
        { auth: false },
      );
      setResendSent(true);
    } catch {
      setResendSent(true);
    } finally {
      setResendSubmitting(false);
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

          {status === "loading" && (
            <>
              <div className="w-[48px] h-[48px] rounded-full bg-[#B19EEF]/10 border border-[#B19EEF]/30 flex items-center justify-center">
                <Loader2 className="w-[22px] h-[22px] text-[#B19EEF] animate-spin" />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="font-bold text-[#B19EEF] text-[24px] font-poppins">
                  Memverifikasi Email...
                </p>
                <p className="text-[13px] text-[#9CA3AF] leading-relaxed">
                  Tunggu sebentar ya.
                </p>
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-[48px] h-[48px] rounded-full bg-[#148F89]/10 border border-[#148F89]/30 flex items-center justify-center">
                <CheckCircle2 className="w-[22px] h-[22px] text-[#148F89]" />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="font-bold text-white text-[24px] font-poppins">
                  Email Terverifikasi
                </p>
                <p className="text-[13px] text-[#9CA3AF] leading-relaxed">{message}</p>
              </div>
              <Link
                href="/login"
                className="bg-[#B19EEF] flex items-center justify-center w-full h-[48px] rounded-[12px] text-black font-bold text-[14px] transition-colors mt-1"
              >
                Ke Halaman Login
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-[48px] h-[48px] rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <XCircle className="w-[22px] h-[22px] text-red-400" />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="font-bold text-white text-[24px] font-poppins">
                  Verifikasi Gagal
                </p>
                <p className="text-[13px] text-[#9CA3AF] leading-relaxed">{message}</p>
              </div>

              {resendSent ? (
                <p className="text-[13px] text-[#148F89] flex items-center gap-2">
                  <MailCheck size={16} />
                  Kalau email itu terdaftar dan belum diverifikasi, link baru sudah dikirim.
                </p>
              ) : (
                <form onSubmit={handleResend} className="flex flex-col gap-2.5">
                  <label className="text-[13px] text-[#B19EEF] font-medium">
                    Kirim ulang link verifikasi
                  </label>
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="Email kamu"
                    className="w-full h-[48px] bg-[#2B2B2B] rounded-[12px] px-4 text-[14px] text-white outline-none focus:ring-2 focus:ring-[#B19EEF]/50 transition-shadow"
                  />
                  <button
                    type="submit"
                    disabled={!resendEmail.trim() || resendSubmitting}
                    className="bg-[#B19EEF] flex items-center justify-center w-full h-[48px] rounded-[12px] text-black font-bold text-[14px] disabled:bg-[#635983] disabled:cursor-not-allowed transition-colors"
                  >
                    {resendSubmitting ? "Mengirim..." : "Kirim Ulang"}
                  </button>
                </form>
              )}
            </>
          )}

          <p className="text-[13px] text-center text-[#9CA3AF]">
            <Link href="/login" className="text-[#08C7E1] hover:underline">
              Kembali ke Login
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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="w-full min-h-screen bg-[#0F081C]" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
