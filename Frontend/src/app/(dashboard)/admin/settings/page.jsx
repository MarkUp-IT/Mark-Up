"use client";

import { useState, useEffect } from "react";
import { Camera, Lock } from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/component/admin/DashboardLayout";
import { apiRequest, getAccessToken, API_BASE } from "@/lib/api";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/formErrors";

export default function AdminSettings() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest("/api/accounts/me/profile/")
      .then((res) => {
        setFullName(res?.user?.fullname || "");
        setEmail(res?.user?.email || "");
        setProfileImage(res?.user?.profile_image || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSaved(false);
    try {
      await apiRequest("/api/accounts/me/profile/", {
        method: "PATCH",
        body: { fullname: fullName },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast.success("Profil Diperbarui");
    } catch (err) {
      toast.error("Gagal Memperbarui Profil", {
        description: extractErrorMessage(err, "Terjadi kesalahan."),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadPhoto = async (file) => {
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const token = getAccessToken();
      const res = await fetch(`${API_BASE}/api/accounts/me/profile/photo/`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setProfileImage(data.profile_image);
        toast.success("Foto Profil Diperbarui");
      } else {
        toast.error("Gagal Mengunggah Foto", { description: data?.detail || "Terjadi kesalahan." });
      }
    } catch (err) {
      toast.error("Gagal Mengunggah Foto", { description: err?.message || "Terjadi kesalahan." });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  return (
    <DashboardLayout title="Pengaturan">
      <div>
        <h1 className="font-bold text-[22px] text-[#0F172A]">Pengaturan Akun</h1>
        <p className="text-[#64748B] text-[14px] mt-1">
          Kelola informasi profil dan keamanan akun admin kamu.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ maxWidth: "640px", marginLeft: "auto", marginRight: "auto" }}
        className="flex flex-col gap-6 w-full"
      >
        <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 flex items-center gap-5 shadow-sm">
          <div
            style={{ width: "72px", height: "72px" }}
            className="rounded-full overflow-hidden border border-[#E2E8F0] relative shrink-0 bg-[#F1F5F9]"
          >
            <img
              src={profileImage || "/images/default-avatar.svg"}
              alt="Foto profil"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-[#1E293B] font-semibold text-[14px]">Foto Profil</p>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] border border-[#E2E8F0] text-[#475569] text-[12.5px] font-semibold hover:bg-[#F8FAFC] transition-colors w-fit cursor-pointer">
              <input
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={(e) => handleUploadPhoto(e.target.files?.[0])}
              />
              <Camera size={14} />
              {isUploadingPhoto ? "Mengunggah..." : "Ganti Foto"}
            </label>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 flex flex-col gap-5 shadow-sm">
          <h2 className="text-[15px] font-semibold text-[#0F172A]">Informasi Pribadi</h2>

          <div className="flex flex-col gap-1.5">
            <label className="text-[#334155] text-[13px] font-medium">Nama Lengkap</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{ height: "44px" }}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 text-[13.5px] text-[#1E293B] outline-none focus:border-[#148F89] transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[#334155] text-[13px] font-medium">Email</label>
            <div
              style={{ height: "44px" }}
              className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-[8px] px-4 flex items-center text-[13.5px] text-[#64748B]"
            >
              {email}
            </div>
            <p className="text-[#94A3B8] text-[11px]">Hubungi support untuk mengubah email.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[#334155] text-[13px] font-medium">Role</label>
            <div
              style={{ height: "44px" }}
              className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-[8px] px-4 flex items-center text-[13.5px] text-[#64748B]"
            >
              Admin
            </div>
            <p className="text-[#94A3B8] text-[11px]">
              Role admin diatur lewat Manajemen User oleh Super Admin, nggak bisa diubah sendiri di sini.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="self-start px-6 py-2.5 rounded-[8px] bg-[#148F89] text-white font-semibold text-[13px] hover:bg-[#117A75] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
            {saved && <span className="text-[#148F89] text-[12px] font-medium">Perubahan tersimpan.</span>}
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div
              style={{ width: "40px", height: "40px" }}
              className="rounded-full bg-[#148F89]/10 flex items-center justify-center shrink-0"
            >
              <Lock size={16} className="text-[#148F89]" />
            </div>
            <div>
              <p className="text-[#1E293B] font-semibold text-[14px]">Password</p>
              <p className="text-[#64748B] text-[12.5px]">Ganti password akun secara berkala buat keamanan.</p>
            </div>
          </div>
          <Link
            href="/admin/settings/change-password"
            className="px-4 py-2 rounded-[8px] border border-[#E2E8F0] text-[#475569] text-[12.5px] font-semibold hover:bg-[#F8FAFC] transition-colors whitespace-nowrap"
          >
            Ganti Password
          </Link>
        </div>
      </form>
    </DashboardLayout>
  );
}
