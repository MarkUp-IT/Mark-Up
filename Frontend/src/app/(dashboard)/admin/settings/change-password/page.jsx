"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Check, X as XIcon } from "lucide-react";
import DashboardLayout from "@/component/admin/DashboardLayout";
import { apiRequest } from "@/lib/api";

const PASSWORD_REQUIREMENTS = [
  { label: "Minimal 8 karakter", test: (pw) => pw.length >= 8 },
  { label: "Mengandung 1 huruf kapital", test: (pw) => /[A-Z]/.test(pw) },
  { label: "Mengandung 1 simbol (!@#$%...)", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

export default function AdminChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState("");

  const passwordMet = PASSWORD_REQUIREMENTS.every((r) => r.test(newPassword));

  const isValid =
    currentPassword.trim() !== "" &&
    passwordMet &&
    confirmPassword === newPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setFormError("");
    setIsSubmitting(true);
    try {
      await apiRequest("/api/accounts/me/change-password/", {
        method: "POST",
        body: { current_password: currentPassword, new_password: newPassword },
      });
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const errors = err?.data?.errors;
      const message =
        errors?.current_password?.[0] || errors?.new_password?.[0] || err?.message || "Gagal mengubah password.";
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Pengaturan">
      <Link
        href="/admin/settings"
        className="inline-flex items-center gap-2 text-[#64748B] hover:text-[#148F89] text-[13px] font-medium transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        Kembali ke Pengaturan
      </Link>

      <div>
        <h1 className="font-bold text-[22px] text-[#0F172A]">Ganti Password</h1>
        <p className="text-[#64748B] text-[14px] mt-1">
          Pastikan pakai password yang kuat dan belum pernah dipakai sebelumnya.
        </p>
      </div>

      <div
        style={{ maxWidth: "480px", marginLeft: "auto", marginRight: "auto" }}
        className="w-full"
      >
        {success ? (
          <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-8 flex flex-col items-center text-center gap-4 shadow-sm">
            <div
              style={{ width: "56px", height: "56px" }}
              className="rounded-full bg-[#148F89]/10 border border-[#148F89]/30 flex items-center justify-center"
            >
              <Check size={26} className="text-[#148F89]" />
            </div>
            <div>
              <h3 className="text-[#0F172A] font-bold text-[17px]">
                Password Berhasil Diubah
              </h3>
              <p className="text-[#64748B] text-[13px] mt-2 leading-relaxed">
                Kamu bisa langsung pakai password baru buat login berikutnya.
              </p>
            </div>
            <Link
              href="/admin/settings"
              className="w-full py-3 rounded-[8px] bg-[#148F89] text-white font-semibold text-[13px] hover:bg-[#117A75] transition-colors mt-2"
            >
              Kembali ke Pengaturan
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 flex flex-col gap-5 shadow-sm"
          >
            {formError && (
              <p className="text-[#DC2626] text-[13px] bg-[#FEE2E2] border border-[#FCA5A5] rounded-[8px] px-3.5 py-2.5">
                {formError}
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[#334155] text-[13px] font-medium">
                Password Saat Ini
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{ height: "44px" }}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 pr-11 text-[13.5px] text-[#1E293B] outline-none focus:border-[#148F89] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] transition-colors"
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[#334155] text-[13px] font-medium">
                Password Baru
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ height: "44px" }}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 pr-11 text-[13.5px] text-[#1E293B] outline-none focus:border-[#148F89] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] transition-colors"
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {newPassword.length > 0 ? (
                <ul className="flex flex-col gap-1 mt-0.5">
                  {PASSWORD_REQUIREMENTS.map((req) => {
                    const met = req.test(newPassword);
                    return (
                      <li
                        key={req.label}
                        className={`flex items-center gap-1.5 text-[11px] transition-colors ${
                          met ? "text-[#148F89]" : "text-[#94A3B8]"
                        }`}
                      >
                        {met ? <Check size={12} /> : <XIcon size={12} />}
                        {req.label}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-[#94A3B8] text-[11px]">
                  Minimal 8 karakter, mengandung 1 huruf kapital, dan 1 simbol.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[#334155] text-[13px] font-medium">
                Konfirmasi Password Baru
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ height: "44px" }}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 pr-11 text-[13.5px] text-[#1E293B] outline-none focus:border-[#148F89] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                <p className="text-[#DC2626] text-[11px]">Konfirmasi password tidak sama.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="w-full py-3 rounded-[8px] bg-[#148F89] text-white font-semibold text-[13px] hover:bg-[#117A75] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Password Baru"}
            </button>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
