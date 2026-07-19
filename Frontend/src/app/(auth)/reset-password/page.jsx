"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, CheckCircle2, Check, X as XIcon } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";

const PASSWORD_REQUIREMENTS = [
  { label: "Minimal 8 karakter", test: (pw) => pw.length >= 8 },
  { label: "Mengandung 1 huruf kapital", test: (pw) => /[A-Z]/.test(pw) },
  { label: "Mengandung 1 simbol (!@#$%...)", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

const autofillFix = `
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0px 1000px #2B2B2B inset;
    -webkit-text-fill-color: #ffffff;
    transition: background-color 5000s ease-in-out 0s;
  }
  .auth-illustration { display: none; }
  @media (min-width: 1024px) {
    .auth-illustration { display: block; }
  }
`;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordMet = PASSWORD_REQUIREMENTS.every((r) => r.test(newPassword));
  const isValid = passwordMet && confirmPassword === newPassword;
  const showToast = (type, title, message) => {
    if (type === "error") toast.error(title, { description: message });
    else toast.success(title, { description: message });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    if (!uid || !token) {
      setFormError("Link reset password tidak valid. Minta link baru lewat halaman Lupa Password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError("Konfirmasi password baru nggak sama.");
      return;
    }

    setFormError("");
    setIsSubmitting(true);
    try {
      await api.post(
        "/api/accounts/reset-password/",
        { uid, token, new_password: newPassword },
        { auth: false },
      );
      setIsSuccess(true);
      showToast("success", "Password berhasil direset", "Silakan login dengan password barumu.");
      window.setTimeout(() => router.push("/login"), 1600);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.data?.errors?.new_password?.[0] || err.message
          : "Terjadi kesalahan. Coba lagi.";
      setFormError(message);
      showToast("error", "Gagal reset password", message);
    } finally {
      setIsSubmitting(false);
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
          {isSuccess ? (
            <>
              <div className="w-[48px] h-[48px] rounded-full bg-[#B19EEF]/10 border border-[#B19EEF]/30 flex items-center justify-center">
                <CheckCircle2 className="w-[22px] h-[22px] text-[#B19EEF]" />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="font-bold text-[#B19EEF] text-[24px] font-poppins">Password Berhasil Direset</p>
                <p className="text-[13px] text-[#9CA3AF] leading-relaxed">
                  Kamu akan diarahkan ke halaman login...
                </p>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <img src="/images/logo-markup.svg" alt="Mark-Up" className="w-[150px]" />
                <p className="font-bold text-[#B19EEF] text-[28px] font-poppins mt-2">Buat Password Baru</p>
                <p className="text-[13px] text-[#9CA3AF]">Masukkan password baru buat akunmu.</p>
              </div>

              {formError && <p className="text-red-400 text-[13px]">{formError}</p>}

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] text-[#B19EEF] font-medium">Password Baru</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-[48px] bg-[#2B2B2B] rounded-[12px] px-4 pr-12 text-[14px] text-white outline-none focus:ring-2 focus:ring-[#B19EEF]/50 transition-shadow"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B19EEF]"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                  </button>
                </div>

                {newPassword.length > 0 && (
                  <ul className="flex flex-col gap-1 mt-0.5">
                    {PASSWORD_REQUIREMENTS.map((req) => {
                      const met = req.test(newPassword);
                      return (
                        <li
                          key={req.label}
                          className={`flex items-center gap-1.5 text-[11.5px] transition-colors ${
                            met ? "text-[#148F89]" : "text-[#6B7280]"
                          }`}
                        >
                          {met ? <Check size={12} /> : <XIcon size={12} />}
                          {req.label}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] text-[#B19EEF] font-medium">Konfirmasi Password Baru</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-[48px] bg-[#2B2B2B] rounded-[12px] px-4 text-[14px] text-white outline-none focus:ring-2 focus:ring-[#B19EEF]/50 transition-shadow"
                />
                {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                  <p className="text-red-400 text-[12px]">Konfirmasi password tidak sama.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="bg-[#B19EEF] flex items-center justify-center w-full h-[48px] rounded-[12px] text-black font-bold text-[14px] disabled:bg-[#635983] disabled:cursor-not-allowed transition-colors mt-1"
              >
                {isSubmitting ? "Memproses..." : "Simpan Password Baru"}
              </button>
            </form>
          )}

          <p className="text-[13px] text-center text-[#9CA3AF]">
            Inget password kamu?{" "}
            <Link href="/login" className="text-[#08C7E1] hover:underline">
              Masuk
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="w-full min-h-screen bg-[#0F081C]" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
