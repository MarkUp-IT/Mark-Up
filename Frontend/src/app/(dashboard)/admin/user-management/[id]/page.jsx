"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Linkedin,
  Star,
  Briefcase,
  Landmark,
  Mail,
  Phone,
} from "lucide-react";
import DashboardLayout from "@/component/admin/DashboardLayout";

// --- MOCK DATA (nanti ganti query by id: users JOIN user_profiles, dan
// kalau role=mentor tambah JOIN mentor_profiles + mentor_expertises +
// mentor_experiences + reviews) ---
const profiles = {
  "#12346": {
    role: "Mentor",
    name: "Alya Hamidah",
    email: "alya.h@markup.com",
    phone: "+62 812-3456-7890",
    avatar: "/images/pp.png",
    joinDate: "15 Feb 2026",
    status: "Aktif",
    headline: "Senior Business Consultant",
    bio: "Konsultan bisnis dengan pengalaman 6+ tahun membimbing tim juara di kompetisi BCC nasional dan internasional.",
    linkedin: "https://linkedin.com/in/alyahamidah",
    expertise: ["Business Case Competition", "Career Mentoring"],
    experience: [
      {
        title: "Senior Consultant, PT Konsultan Maju Bersama",
        period: "2022 — Sekarang",
      },
      { title: "Business Analyst, Deloitte Indonesia", period: "2019 — 2022" },
    ],
    bankName: "BCA",
    bankAccount: "1234567890",
    accountHolder: "Alya Hamidah",
    rating: 4.9,
    reviewCount: 32,
    sessionsCompleted: 48,
  },
  "#12347": {
    role: "User",
    name: "Prabroro Subriantoro",
    email: "prabroro@gmail.com",
    phone: "+62 813-1122-3344",
    avatar: "/images/pp.png",
    joinDate: "3 Mar 2026",
    status: "Aktif",
    institution: "Universitas Airlangga",
    major: "Sistem Informasi, Semester 5",
  },
};

export default function UserDetail() {
  const params = useParams();
  const profile = profiles[params?.id];

  if (!profile) {
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

  const isMentor = profile.role === "Mentor";

  return (
    <DashboardLayout title="Detail Profil">
      <Link
        href="/admin/user-management"
        className="inline-flex items-center gap-2 text-[#64748B] hover:text-[#148F89] text-[13px] font-medium transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        Kembali ke Manajemen User
      </Link>

      {/* Header profil */}
      <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 flex items-center gap-5 shadow-sm">
        <div
          style={{ width: "72px", height: "72px" }}
          className="rounded-full overflow-hidden border border-[#E2E8F0] shrink-0"
        >
          <img
            src={profile.avatar}
            alt={profile.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-bold text-[19px] text-[#0F172A]">
              {profile.name}
            </h1>
            <span
              className={`inline-flex px-2.5 py-1 text-[10px] rounded-[6px] font-bold ${isMentor ? "bg-[#CCFBF1] text-[#0F766E] border border-[#99F6E4]" : "bg-[#DBEAFE] text-[#1D4ED8] border border-[#BFDBFE]"}`}
            >
              {profile.role.toUpperCase()}
            </span>
            <span
              className={`inline-flex px-2.5 py-1 text-[10px] rounded-full font-bold ${profile.status === "Aktif" ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#FEE2E2] text-[#991B1B]"}`}
            >
              {profile.status.toUpperCase()}
            </span>
          </div>
          {isMentor && (
            <p className="text-[#64748B] text-[13.5px]">{profile.headline}</p>
          )}
          <div className="flex items-center gap-4 text-[#64748B] text-[12.5px] flex-wrap">
            <span className="flex items-center gap-1.5">
              <Mail size={13} />
              {profile.email}
            </span>
            <span className="flex items-center gap-1.5">
              <Phone size={13} />
              {profile.phone}
            </span>
            <span>Bergabung {profile.joinDate}</span>
          </div>
        </div>
      </div>

      {isMentor ? (
        <>
          {/* Stat ringkas mentor */}
          <div className="grid grid-cols-3 gap-5">
            <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 shadow-sm">
              <p className="text-[#64748B] font-bold text-[11px] tracking-wide uppercase">
                Rating
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Star size={18} className="fill-[#F59E0B] text-[#F59E0B]" />
                <span className="font-bold text-[22px] text-[#0F172A]">
                  {profile.rating}
                </span>
                <span className="text-[#94A3B8] text-[12px]">
                  ({profile.reviewCount} ulasan)
                </span>
              </div>
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 shadow-sm">
              <p className="text-[#64748B] font-bold text-[11px] tracking-wide uppercase">
                Sesi Selesai
              </p>
              <p className="font-bold text-[22px] text-[#0F172A] mt-1.5">
                {profile.sessionsCompleted}
              </p>
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 shadow-sm">
              <p className="text-[#64748B] font-bold text-[11px] tracking-wide uppercase">
                Keahlian
              </p>
              <p className="font-bold text-[22px] text-[#0F172A] mt-1.5">
                {profile.expertise.length}
              </p>
            </div>
          </div>

          {/* Bio & keahlian */}
          <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 flex flex-col gap-4 shadow-sm">
            <h2 className="text-[15px] font-semibold text-[#0F172A]">Bio</h2>
            <p className="text-[#475569] text-[13.5px] leading-relaxed">
              {profile.bio}
            </p>
            <div className="flex flex-wrap gap-2">
              {profile.expertise.map((exp) => (
                <span
                  key={exp}
                  className="px-3 py-1.5 rounded-full text-[11.5px] font-medium bg-[#148F89]/10 text-[#148F89] border border-[#148F89]/20"
                >
                  {exp}
                </span>
              ))}
            </div>
            {profile.linkedin && (
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[#148F89] text-[13px] font-medium hover:underline w-fit"
              >
                <Linkedin size={15} />
                Lihat Profil LinkedIn
              </a>
            )}
          </div>

          {/* Pengalaman */}
          <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 flex flex-col gap-4 shadow-sm">
            <h2 className="text-[15px] font-semibold text-[#0F172A] flex items-center gap-2">
              <Briefcase size={16} className="text-[#148F89]" />
              Pengalaman
            </h2>
            <div className="flex flex-col gap-3">
              {profile.experience.map((exp, idx) => (
                <div key={idx} className="flex flex-col gap-0.5">
                  <p className="text-[#1E293B] font-semibold text-[13.5px]">
                    {exp.title}
                  </p>
                  <p className="text-[#94A3B8] text-[12px]">{exp.period}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Rekening -- penting buat proses pencairan */}
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
                  {profile.bankName} — {profile.bankAccount}
                </p>
                <p className="text-[#64748B] text-[12.5px]">
                  a.n. {profile.accountHolder}
                </p>
              </div>
            </div>
            <Link
              href="/admin/payouts"
              className="text-[#148F89] font-bold text-[13px] hover:underline"
            >
              Lihat Riwayat Pencairan
            </Link>
          </div>
        </>
      ) : (
        <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 flex flex-col gap-4 shadow-sm">
          <h2 className="text-[15px] font-semibold text-[#0F172A]">
            Informasi Akademik
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider">
                Institusi
              </span>
              <span className="text-[#1E293B] font-medium text-[13.5px]">
                {profile.institution}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider">
                Jurusan & Semester
              </span>
              <span className="text-[#1E293B] font-medium text-[13.5px]">
                {profile.major}
              </span>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
