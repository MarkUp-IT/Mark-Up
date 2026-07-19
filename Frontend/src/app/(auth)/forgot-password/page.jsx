"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";

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

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = email.trim() !== "";

  const showToast = (type, title, message) => {
    if (type === "error") toast.error(title, { description: message });
    else toast.success(title, { description: message });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setFormError("");
    setIsSubmitting(true);

    try {
      await api.post(
        "/api/accounts/forgot-password/",
        { email },
        { auth: false },
      );

      setIsSubmitted(true);
      showToast(
        "success",
        "Link terkirim",
        "Cek email kamu untuk link reset password.",
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
        showToast("error", "Gagal mengirim link", err.message);
      } else {
        setFormError("Terjadi kesalahan. Coba lagi.");
        showToast(
          "error",
          "Gagal mengirim link",
          "Terjadi kesalahan. Coba lagi.",
        );
      }
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
            background:
              "radial-gradient(ellipse at top, rgba(177, 158, 239, 0.15) 0%, transparent 60%)",
            filter: "blur(40px)",
          }}
        />
      </div>

      <div
        className="relative z-10 w-full min-h-screen flex items-center justify-center px-6 py-16"
        style={{ gap: "60px", flexWrap: "wrap" }}
      >
        <div
          style={{ width: "100%", maxWidth: "380px", flexShrink: 0 }}
          className="flex flex-col gap-4"
        >
          {isSubmitted ? (
            <>
              <div className="w-[48px] h-[48px] rounded-full bg-[#B19EEF]/10 border border-[#B19EEF]/30 flex items-center justify-center">
                <CheckCircle2 className="w-[22px] h-[22px] text-[#B19EEF]" />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="font-bold text-[#B19EEF] text-[24px] font-poppins">
                  Cek Email Kamu
                </p>
                <p className="text-[13px] text-[#9CA3AF] leading-relaxed">
                  Kami udah kirim link reset password ke{" "}
                  <span className="text-white font-medium">{email}</span>. Link
                  ini berlaku selama 30 menit.
                </p>
              </div>
              <button
                onClick={() => setIsSubmitted(false)}
                className="text-[#08C7E1] text-[13px] hover:underline w-fit"
              >
                Salah email? Kirim ulang
              </button>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <img
                  src="/images/logo-markup.svg"
                  alt="Mark-Up"
                  className="w-[150px]"
                />
                <p className="font-bold text-[#B19EEF] text-[28px] font-poppins mt-2">
                  Lupa Password
                </p>
                <p className="text-[13px] text-[#9CA3AF]">
                  Masukkan email akunmu, kami kirim link buat bikin password
                  baru.
                </p>
              </div>

              {formError && (
                <p className="text-red-400 text-[13px]">{formError}</p>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] text-[#B19EEF] font-medium">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-[#9CA3AF]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-[48px] bg-[#2B2B2B] rounded-[12px] pl-11 pr-4 text-[14px] text-white outline-none focus:ring-2 focus:ring-[#B19EEF]/50 transition-shadow"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="bg-[#B19EEF] flex items-center justify-center w-full h-[48px] rounded-[12px] text-black font-bold text-[14px] disabled:bg-[#635983] disabled:cursor-not-allowed transition-colors mt-1"
              >
                {isSubmitting ? "Mengirim..." : "Kirim Link Reset"}
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

        <div
          className="auth-illustration"
          style={{ width: "380px", height: "460px", flexShrink: 0 }}
        >
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
