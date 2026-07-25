"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Linkedin,
  Star,
  Briefcase,
  Landmark,
  Mail,
  Phone,
  Percent,
} from "lucide-react";
import DashboardLayout from "@/component/admin/DashboardLayout";
import { apiRequest } from "@/lib/api";
import { extractErrorMessage } from "@/lib/formErrors";

const ROLE_LABEL = { ADMIN: "Admin", MENTOR: "Mentor", STUDENT: "User" };

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function formatMonthYear(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

export default function UserDetail() {
  const params = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [feeOverride, setFeeOverride] = useState("");
  const [savingFee, setSavingFee] = useState(false);

  useEffect(() => {
    apiRequest(`/api/accounts/users/${params.id}/`)
      .then((res) => {
        const user = res?.user || null;
        setProfile(user);
        const override = user?.mentor_profile?.mentoring_fee_percent_override;
        setFeeOverride(override === null || override === undefined ? "" : String(override));
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleSaveFeeOverride = async () => {
    setSavingFee(true);
    try {
      const value = feeOverride === "" ? null : Number(feeOverride);
      await apiRequest(`/api/accounts/users/${params.id}/update/`, {
        method: "PATCH",
        body: { mentoring_fee_percent_override: value },
      });
      toast.success("Komisi Disimpan", {
        description:
          value === null
            ? "Mentor ini balik pakai persentase komisi global."
            : `Komisi mentoring mentor ini di-set jadi ${value}% buat mentor.`,
      });
    } catch (err) {
      toast.error("Gagal Menyimpan Komisi", {
        description: extractErrorMessage(err, "Terjadi kesalahan."),
      });
    } finally {
      setSavingFee(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Detail Profil">
        <p className="text-[#64748B] text-[14px]">Memuat profil...</p>
      </DashboardLayout>
    );
  }

  if (notFound || !profile) {
    return (
      <DashboardLayout title="Detail Profil">
        <Link
          href="/admin/user-management"
          className="inline-flex items-center gap-2 text-[#64748B] hover:text-[#148F89] text-[13px] font-medium transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          Kembali ke Manajemen User
        </Link>
        <p className="text-[#64748B] text-[14px]">
          Profil dengan ID &ldquo;{params?.id}&rdquo; nggak ditemukan.
        </p>
      </DashboardLayout>
    );
  }

  const isMentor = profile.role === "MENTOR";
  const mentorProfile = profile.mentor_profile;

  return (
    <DashboardLayout title="Detail Profil">
      <Link
        href="/admin/user-management"
        className="inline-flex items-center gap-2 text-[#64748B] hover:text-[#148F89] text-[13px] font-medium transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        Kembali ke Manajemen User
      </Link>

      <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 flex items-center gap-5 shadow-sm">
        <div
          style={{ width: "72px", height: "72px" }}
          className="rounded-full overflow-hidden border border-[#E2E8F0] shrink-0 bg-[#F1F5F9]"
        >
          <img
            src={profile.profile_image || "/images/default-avatar.svg"}
            alt={profile.fullname}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-bold text-[19px] text-[#0F172A]">{profile.fullname}</h1>
            <span
              className={`inline-flex px-2.5 py-1 text-[10px] rounded-[6px] font-bold ${isMentor ? "bg-[#CCFBF1] text-[#0F766E] border border-[#99F6E4]" : "bg-[#DBEAFE] text-[#1D4ED8] border border-[#BFDBFE]"}`}
            >
              {ROLE_LABEL[profile.role]?.toUpperCase()}
            </span>
            <span
              className={`inline-flex px-2.5 py-1 text-[10px] rounded-full font-bold ${profile.status === "ACTIVE" ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#FEE2E2] text-[#991B1B]"}`}
            >
              {profile.status === "ACTIVE" ? "AKTIF" : "NONAKTIF"}
            </span>
          </div>
          {isMentor && mentorProfile?.headline && (
            <p className="text-[#64748B] text-[13.5px]">{mentorProfile.headline}</p>
          )}
          <div className="flex items-center gap-4 text-[#64748B] text-[12.5px] flex-wrap">
            <span className="flex items-center gap-1.5">
              <Mail size={13} />
              {profile.email}
            </span>
            {profile.phone && (
              <span className="flex items-center gap-1.5">
                <Phone size={13} />
                {profile.phone}
              </span>
            )}
            <span>Bergabung {formatDate(profile.created_at)}</span>
          </div>
        </div>
      </div>

      {isMentor ? (
        <>
          <div className="grid grid-cols-3 gap-5">
            <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 shadow-sm">
              <p className="text-[#64748B] font-bold text-[11px] tracking-wide uppercase">Rating</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Star size={18} className="fill-[#F59E0B] text-[#F59E0B]" />
                <span className="font-bold text-[22px] text-[#0F172A]">{mentorProfile?.rating ?? 0}</span>
                <span className="text-[#94A3B8] text-[12px]">({mentorProfile?.review_count ?? 0} ulasan)</span>
              </div>
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 shadow-sm">
              <p className="text-[#64748B] font-bold text-[11px] tracking-wide uppercase">Keahlian</p>
              <p className="font-bold text-[22px] text-[#0F172A] mt-1.5">{mentorProfile?.expertise?.length ?? 0}</p>
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 shadow-sm">
              <p className="text-[#64748B] font-bold text-[11px] tracking-wide uppercase">Pengalaman</p>
              <p className="font-bold text-[22px] text-[#0F172A] mt-1.5">{mentorProfile?.experience?.length ?? 0}</p>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 flex flex-col gap-4 shadow-sm">
            <h2 className="text-[15px] font-semibold text-[#0F172A]">Bio</h2>
            <p className="text-[#475569] text-[13.5px] leading-relaxed">
              {mentorProfile?.bio || "Belum ada bio."}
            </p>
            <div className="flex flex-wrap gap-2">
              {(mentorProfile?.expertise || []).map((exp) => (
                <span
                  key={exp}
                  className="px-3 py-1.5 rounded-full text-[11.5px] font-medium bg-[#148F89]/10 text-[#148F89] border border-[#148F89]/20"
                >
                  {exp}
                </span>
              ))}
            </div>
            {mentorProfile?.linkedin_url && (
              <a
                href={mentorProfile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[#148F89] text-[13px] font-medium hover:underline w-fit"
              >
                <Linkedin size={15} />
                Lihat Profil LinkedIn
              </a>
            )}
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 flex flex-col gap-4 shadow-sm">
            <h2 className="text-[15px] font-semibold text-[#0F172A] flex items-center gap-2">
              <Briefcase size={16} className="text-[#148F89]" />
              Pengalaman
            </h2>
            <div className="flex flex-col gap-3">
              {(mentorProfile?.experience || []).length === 0 ? (
                <p className="text-[#94A3B8] text-[13px] italic">Belum ada pengalaman.</p>
              ) : (
                mentorProfile.experience.map((exp, idx) => (
                  <div key={idx} className="flex flex-col gap-0.5">
                    <p className="text-[#1E293B] font-semibold text-[13.5px]">{exp.title}</p>
                    <p className="text-[#94A3B8] text-[12px]">
                      {formatMonthYear(exp.start_date)} – {exp.end_date ? formatMonthYear(exp.end_date) : "Sekarang"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 flex items-center justify-between shadow-sm flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div
                style={{ width: "40px", height: "40px" }}
                className="rounded-full bg-[#148F89]/10 flex items-center justify-center shrink-0"
              >
                <Landmark size={16} className="text-[#148F89]" />
              </div>
              <div>
                <p className="text-[#1E293B] font-semibold text-[14px]">
                  {mentorProfile?.bank_name || "-"} — {mentorProfile?.bank_account || "-"}
                </p>
                <p className="text-[#64748B] text-[12.5px]">a.n. {mentorProfile?.bank_account_holder || "-"}</p>
              </div>
            </div>
            <Link href="/admin/payouts" className="text-[#148F89] font-bold text-[13px] hover:underline">
              Lihat Riwayat Pencairan
            </Link>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div
                style={{ width: "40px", height: "40px" }}
                className="rounded-full bg-[#148F89]/10 flex items-center justify-center shrink-0"
              >
                <Percent size={16} className="text-[#148F89]" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-[#0F172A]">
                  Komisi Mentoring Khusus
                </h2>
                <p className="text-[#94A3B8] text-[12.5px]">
                  Kosongkan buat pakai persentase global (lihat halaman Pencairan).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Default"
                  value={feeOverride}
                  onChange={(e) => setFeeOverride(e.target.value)}
                  style={{ width: "100px", height: "40px" }}
                  className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-3 text-[13px] text-[#1E293B] outline-none focus:border-[#148F89] transition-colors"
                />
                <span className="text-[#64748B] text-[13px] font-medium">% buat mentor ini</span>
              </div>
              <button
                type="button"
                onClick={handleSaveFeeOverride}
                disabled={savingFee}
                className="px-4 h-10 rounded-[8px] bg-[#148F89] text-white text-[12.5px] font-semibold hover:bg-[#117A75] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {savingFee ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 flex flex-col gap-4 shadow-sm">
          <h2 className="text-[15px] font-semibold text-[#0F172A]">Informasi Akademik</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider">Institusi</span>
              <span className="text-[#1E293B] font-medium text-[13.5px]">{profile.institution || "-"}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider">Status Saat Ini</span>
              <span className="text-[#1E293B] font-medium text-[13.5px]">{profile.current_status || "-"}</span>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
