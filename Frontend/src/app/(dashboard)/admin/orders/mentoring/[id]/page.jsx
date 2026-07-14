"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Users } from "lucide-react";
import DashboardLayout from "@/component/admin/DashboardLayout";

const STATUS_META = {
  completed: { label: "SELESAI", className: "bg-[#DCFCE7] text-[#166534]" },
  scheduled: { label: "TERJADWAL", className: "bg-[#DBEAFE] text-[#1D4ED8]" },
  waiting_schedule: {
    label: "BELUM DIJADWALKAN",
    className: "bg-[#FEF3C7] text-[#92400E]",
  },
};

// --- MOCK DATA (nanti ganti query: mentoring_sessions WHERE transaction_id
// = params.id, JOIN mentor_availabilities buat startTime, ORDER BY
// session_number) ---
const packageDetails = {
  "TRX-MT-002": {
    userName: "Affan Fathir D.",
    userEmail: "affan.fathir@gmail.com",
    productTitle: "Bundling PowerPack (Newbie Friendly)",
    mentorName: "Adena Laksita",
    sessions: [
      {
        number: 1,
        status: "completed",
        date: "10 Jun 2026",
        time: "10:00 WIB",
        link: "https://zoom.us/j/1112223333",
      },
      {
        number: 2,
        status: "scheduled",
        date: "18 Jul 2026",
        time: "16:00 WIB",
        link: "",
      },
      {
        number: 3,
        status: "waiting_schedule",
        date: null,
        time: null,
        link: "",
      },
    ],
  },
};

export default function MentoringOrderDetail() {
  const params = useParams();
  const pkg = packageDetails[params?.id];

  if (!pkg) {
    return (
      <DashboardLayout title="Detail Mentoring">
        <Link
          href="/admin/orders/mentoring"
          className="inline-flex items-center gap-2 text-[#64748B] hover:text-[#148F89] text-[13px] font-medium transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          Kembali ke Daftar Paket
        </Link>
        <p className="text-[#64748B] text-[14px]">
          Paket dengan ID &ldquo;{params?.id}&rdquo; nggak ditemukan.
        </p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Detail Mentoring">
      <Link
        href="/admin/orders/mentoring"
        className="inline-flex items-center gap-2 text-[#64748B] hover:text-[#148F89] text-[13px] font-medium transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        Kembali ke Daftar Paket
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bold text-[22px] text-[#0F172A]">
            {pkg.productTitle}
          </h1>
          <p className="text-[#64748B] text-[14px] mt-1">
            ID Transaksi: {params?.id}
          </p>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-[12px] px-5 py-4 flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider">
              User
            </span>
            <span className="text-[#1E293B] font-semibold text-[13px]">
              {pkg.userName}
            </span>
            <span className="text-[#94A3B8] text-[11px]">{pkg.userEmail}</span>
          </div>
          <div className="w-px self-stretch bg-[#E2E8F0]" />
          <div className="flex flex-col">
            <span className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider">
              Mentor
            </span>
            <span className="text-[#1E293B] font-semibold text-[13px] flex items-center gap-1.5">
              <Users size={13} className="text-[#148F89]" />
              {pkg.mentorName}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-[16px] font-semibold text-[#0F172A]">
          Daftar Sesi
        </h2>

        <div className="flex flex-col gap-3">
          {pkg.sessions.map((session) => (
            <div
              key={session.number}
              className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 flex items-center justify-between gap-4 flex-wrap shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div
                  style={{ width: "40px", height: "40px" }}
                  className="rounded-full bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center shrink-0 text-[#64748B] font-bold text-[14px]"
                >
                  {session.number}
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-[14px] text-[#1E293B]">
                    Sesi {session.number}
                  </span>
                  {session.date ? (
                    <span className="text-[#64748B] text-[13px]">
                      {session.date}, {session.time}
                    </span>
                  ) : (
                    <span className="text-[#94A3B8] text-[13px] italic">
                      Menunggu user pilih jadwal
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span
                  className={`inline-flex px-3 py-1.5 text-[10px] rounded-full font-bold whitespace-nowrap ${STATUS_META[session.status].className}`}
                >
                  {STATUS_META[session.status].label}
                </span>

                {session.status === "scheduled" && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Masukkan link zoom..."
                      defaultValue={session.link}
                      style={{ width: "200px", height: "38px" }}
                      className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-3 text-[12px] text-[#334155] outline-none focus:border-[#148F89] transition-colors"
                    />
                    <button
                      style={{ width: "38px", height: "38px" }}
                      className="rounded-[8px] flex items-center justify-center bg-[#148F89] text-white hover:bg-[#117A75] transition-colors shrink-0"
                    >
                      <Send size={15} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
