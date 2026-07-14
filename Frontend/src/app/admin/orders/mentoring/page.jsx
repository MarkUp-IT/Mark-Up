"use client";

import Link from "next/link";
import DashboardLayout from "@/component/admin/DashboardLayout";
import StatCard from "@/component/admin/StatCard";
import EmptyState from "@/component/admin/EmptyState";

// --- MOCK DATA (nanti ganti query: group mentoring_sessions by
// transaction_id, JOIN transactions+users+product_mentoring buat dapetin
// progress per paket) ---
const packages = [
  {
    id: "TRX-MT-001",
    userName: "Sarah Jenkins",
    productTitle: "1-on-1 Career Mentoring",
    mentorName: "Adena Laksita",
    totalSessions: 1,
    completedSessions: 0,
    scheduledSessions: 1,
    unscheduledSessions: 0,
    pendingLinks: 0,
  },
  {
    id: "TRX-MT-002",
    userName: "Affan Fathir D.",
    productTitle: "Bundling PowerPack (Newbie Friendly)",
    mentorName: "Adena Laksita",
    totalSessions: 3,
    completedSessions: 1,
    scheduledSessions: 1,
    unscheduledSessions: 1,
    pendingLinks: 1,
  },
  {
    id: "TRX-MT-003",
    userName: "Prabroro Subriantoro",
    productTitle: "Interview Preparation Session",
    mentorName: "Alya Hamidah",
    totalSessions: 1,
    completedSessions: 1,
    scheduledSessions: 0,
    unscheduledSessions: 0,
    pendingLinks: 0,
  },
];

export default function MentoringOrders() {
  const totalPendingLinks = packages.reduce(
    (sum, p) => sum + p.pendingLinks,
    0,
  );
  const totalUnscheduled = packages.reduce(
    (sum, p) => sum + p.unscheduledSessions,
    0,
  );

  return (
    <DashboardLayout title="Kelola Pesanan · Mentoring">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bold text-[22px] text-[#0F172A]">
            Manajemen Mentoring
          </h1>
          <p className="text-[#64748B] text-[14px] mt-1">
            Pantau progres tiap paket mentoring 1-on-1 yang dibeli user, per
            pembelian.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <StatCard
          label="Total Paket Aktif"
          value={packages.length}
          unit="paket"
        />
        <StatCard
          label="Sesi Belum Dijadwalkan"
          value={totalUnscheduled}
          unit="sesi"
        />
        <StatCard
          label="Link Belum Dibagikan"
          value={totalPendingLinks}
          unit="sesi"
          variant="warning"
        />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-[16px] font-semibold text-[#0F172A]">
          Daftar Paket
        </h2>

        {packages.length === 0 ? (
          <EmptyState message="Belum ada paket mentoring aktif." />
        ) : (
          <div className="flex flex-col gap-3">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="w-full bg-white border border-[#E2E8F0] rounded-[12px] p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-5">
                  <div
                    style={{ width: "56px", height: "56px" }}
                    className="bg-[#F1F5F9] rounded-[8px] shrink-0"
                  />
                  <div className="flex flex-col gap-1">
                    <p className="font-bold text-[15px] text-[#1E293B]">
                      {pkg.productTitle}
                      {pkg.totalSessions > 1 && (
                        <span className="ml-2 text-[#148F89] text-[12px] font-semibold">
                          ({pkg.completedSessions + pkg.scheduledSessions}/
                          {pkg.totalSessions} sesi)
                        </span>
                      )}
                    </p>
                    <p className="text-[13px] text-[#64748B] font-medium">
                      <span className="text-[#1E293B] font-bold">
                        {pkg.userName}
                      </span>{" "}
                      · Mentor{" "}
                      <span className="text-[#1E293B] font-bold">
                        {pkg.mentorName}
                      </span>
                      {pkg.unscheduledSessions > 0 && (
                        <>
                          {" "}
                          ·{" "}
                          <span className="text-[#DC2626] font-bold">
                            {pkg.unscheduledSessions}
                          </span>{" "}
                          Belum Dijadwalkan
                        </>
                      )}
                      {pkg.pendingLinks > 0 && (
                        <>
                          {" "}
                          ·{" "}
                          <span className="text-[#DC2626] font-bold">
                            {pkg.pendingLinks}
                          </span>{" "}
                          Link Tertunda
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/admin/orders/mentoring/${pkg.id}`}
                  className="font-bold text-[#148F89] text-[13px] hover:underline shrink-0"
                >
                  Lihat Detail
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
