"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/component/admin/DashboardLayout";
import StatCard from "@/component/admin/StatCard";
import EmptyState from "@/component/admin/EmptyState";
import { apiRequest } from "@/lib/api";

export default function MentoringOrders() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest("/api/products/mentoring-orders/")
      .then((res) => setPackages(res?.packages || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalPendingLinks = packages.reduce((sum, p) => sum + p.pending_links, 0);
  const totalUnscheduled = packages.reduce((sum, p) => sum + p.unscheduled_sessions, 0);

  return (
    <DashboardLayout title="Kelola Pesanan · Mentoring">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bold text-[22px] text-[#0F172A]">Manajemen Mentoring</h1>
          <p className="text-[#64748B] text-[14px] mt-1">
            Pantau progres tiap paket mentoring 1-on-1 yang dibeli user, per pembelian.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <StatCard label="Total Paket Aktif" value={packages.length} unit="paket" loading={loading} />
        <StatCard label="Sesi Belum Dijadwalkan" value={totalUnscheduled} unit="sesi" loading={loading} />
        <StatCard label="Link Belum Dibagikan" value={totalPendingLinks} unit="sesi" variant="warning" loading={loading} />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-[16px] font-semibold text-[#0F172A]">Daftar Paket</h2>

        {!loading && packages.length === 0 ? (
          <EmptyState message="Belum ada paket mentoring aktif." />
        ) : (
          <div className="flex flex-col gap-3">
            {packages.map((pkg) => (
              <div
                key={pkg.user_library_id}
                className="w-full bg-white border border-[#E2E8F0] rounded-[12px] p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-5">
                  <div style={{ width: "56px", height: "56px" }} className="bg-[#F1F5F9] rounded-[8px] shrink-0" />
                  <div className="flex flex-col gap-1">
                    <p className="font-bold text-[15px] text-[#1E293B]">
                      {pkg.product_title}
                      {pkg.total_sessions > 1 && (
                        <span className="ml-2 text-[#148F89] text-[12px] font-semibold">
                          ({pkg.completed_sessions + pkg.scheduled_sessions}/{pkg.total_sessions} sesi)
                        </span>
                      )}
                    </p>
                    <p className="text-[13px] text-[#64748B] font-medium">
                      <span className="text-[#1E293B] font-bold">{pkg.user_name}</span> · Mentor{" "}
                      <span className="text-[#1E293B] font-bold">{pkg.mentor_name || "-"}</span>
                      {pkg.unscheduled_sessions > 0 && (
                        <>
                          {" "}·{" "}
                          <span className="text-[#DC2626] font-bold">{pkg.unscheduled_sessions}</span> Belum Dijadwalkan
                        </>
                      )}
                      {pkg.pending_links > 0 && (
                        <>
                          {" "}·{" "}
                          <span className="text-[#DC2626] font-bold">{pkg.pending_links}</span> Link Tertunda
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/admin/orders/mentoring/${pkg.user_library_id}`}
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
