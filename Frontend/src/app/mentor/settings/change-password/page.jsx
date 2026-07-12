"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Check,
  X as XIcon,
  ShieldCheck,
} from "lucide-react";
import DashboardLayout from "@/component/mentor/DashboardLayout";

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggleShow,
  autoComplete,
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[#E2E8F0] text-[13px] font-medium">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="w-full bg-[#0F081C] border border-[#2D2342] rounded-[8px] px-4 py-3 pr-11 text-[14px] text-white outline-none focus:border-[#148F89]/60 transition-colors"
        />
        <button
          type="button"
          onClick={onToggleShow}
          aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-white transition-colors"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

export default function MentorChangePassword() {
  const shouldReduceMotion = useReducedMotion();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const sectionReveal = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: shouldReduceMotion ? 0.2 : 0.4 },
    viewport: { once: true },
  };

  const requirements = [
    { label: "Minimal 8 karakter", test: (pw) => pw.length >= 8 },
    { label: "Mengandung huruf besar", test: (pw) => /[A-Z]/.test(pw) },
    { label: "Mengandung angka", test: (pw) => /[0-9]/.test(pw) },
    {
      label: "Berbeda dari kata sandi saat ini",
      test: (pw) => pw.length > 0 && pw !== currentPassword,
    },
  ];

  const metCount = requirements.filter((r) => r.test(newPassword)).length;
  const strengthMeta =
    metCount <= 1
      ? { label: "Lemah", color: "#EF4444" }
      : metCount <= 3
        ? { label: "Sedang", color: "#F59E0B" }
        : { label: "Kuat", color: "#148F89" };

  const allRequirementsMet = requirements.every((r) => r.test(newPassword));
  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit =
    currentPassword.length > 0 &&
    allRequirementsMet &&
    passwordsMatch &&
    !isSubmitting;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setIsSubmitting(true);
    // TODO: panggil API ganti password beneran -- verifikasi currentPassword
    // di backend, jangan cuma di client kayak sekarang
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 900);
  };

  if (isSuccess) {
    return (
      <DashboardLayout title="Ubah Kata Sandi">
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.2 : 0.4 }}
          className="max-w-[480px] mx-auto w-full bg-[#170F26] border border-[#2D2342] rounded-[12px] p-8 flex flex-col items-center text-center gap-4"
        >
          <div className="w-16 h-16 rounded-full bg-[#148F89]/10 border border-[#148F89]/30 flex items-center justify-center">
            <ShieldCheck size={32} className="text-[#148F89]" />
          </div>
          <div>
            <h2 className="text-white font-bold text-[20px]">
              Kata Sandi Berhasil Diubah
            </h2>
            <p className="text-[#9CA3AF] text-[13px] mt-1">
              Gunakan kata sandi barumu untuk masuk ke Mark-Up mulai sekarang.
            </p>
          </div>
          <Link
            href="/mentor/settings"
            className="w-full py-3 rounded-[8px] bg-[#148F89] text-white font-semibold text-[13px] hover:bg-[#117A75] transition-colors text-center mt-2"
          >
            Kembali ke Pengaturan
          </Link>
        </motion.div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Ubah Kata Sandi">
      <Link
        href="/mentor/settings"
        className="inline-flex items-center gap-2 text-[#9CA3AF] hover:text-white text-[13px] transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        Kembali ke Pengaturan
      </Link>

      <motion.div {...sectionReveal} className="flex flex-col gap-1">
        <h1 className="text-[24px] sm:text-[28px] font-bold text-white leading-tight">
          Ubah Kata Sandi
        </h1>
        <p className="text-[#9CA3AF] text-[14px]">
          Pastikan kata sandi barumu kuat dan belum pernah dipakai di akun lain.
        </p>
      </motion.div>

      <motion.form
        {...sectionReveal}
        onSubmit={handleSubmit}
        className="max-w-[520px] w-full bg-[#170F26] border border-[#2D2342] rounded-[12px] p-6 sm:p-8 flex flex-col gap-6"
      >
        <PasswordField
          label="Kata Sandi Saat Ini"
          value={currentPassword}
          onChange={setCurrentPassword}
          show={showCurrent}
          onToggleShow={() => setShowCurrent((v) => !v)}
          autoComplete="current-password"
        />

        <div className="flex flex-col gap-2">
          <PasswordField
            label="Kata Sandi Baru"
            value={newPassword}
            onChange={setNewPassword}
            show={showNew}
            onToggleShow={() => setShowNew((v) => !v)}
            autoComplete="new-password"
          />

          {newPassword.length > 0 && (
            <div className="flex flex-col gap-2 mt-1">
              {/* Strength meter */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-[#0F081C] overflow-hidden flex gap-0.5">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-full transition-colors"
                      style={{
                        backgroundColor:
                          i < metCount ? strengthMeta.color : "#2D2342",
                      }}
                    />
                  ))}
                </div>
                <span
                  className="text-[11px] font-semibold shrink-0"
                  style={{ color: strengthMeta.color }}
                >
                  {strengthMeta.label}
                </span>
              </div>

              {/* Requirement checklist */}
              <ul className="flex flex-col gap-1.5 mt-1">
                {requirements.map((req) => {
                  const met = req.test(newPassword);
                  return (
                    <li
                      key={req.label}
                      className={`flex items-center gap-2 text-[12px] transition-colors ${
                        met ? "text-[#148F89]" : "text-[#6B7280]"
                      }`}
                    >
                      {met ? <Check size={13} /> : <XIcon size={13} />}
                      {req.label}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <PasswordField
            label="Konfirmasi Kata Sandi Baru"
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={showConfirm}
            onToggleShow={() => setShowConfirm((v) => !v)}
            autoComplete="new-password"
          />
          {confirmPassword.length > 0 && !passwordsMatch && (
            <p className="text-[#EF4444] text-[12px]">
              Kata sandi tidak cocok.
            </p>
          )}
        </div>

        {error && <p className="text-[#EF4444] text-[13px]">{error}</p>}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full py-3 rounded-[8px] bg-[#148F89] text-white font-semibold text-[13px] hover:bg-[#117A75] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#148F89]"
        >
          {isSubmitting ? "Menyimpan..." : "Simpan Kata Sandi Baru"}
        </button>
      </motion.form>
    </DashboardLayout>
  );
}
