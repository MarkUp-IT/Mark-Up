"use client";

import DashboardLayout from "@/component/admin/DashboardLayout";
import StatCard from "@/component/admin/StatCard";
import EmptyState from "@/component/admin/EmptyState";
import Link from "next/link";

export default function BootcampOrders() {
  // --- MOCK DATA (nanti ganti query product_bootcamp JOIN bootcamp_sessions,
  // hitung unassigned/pending per batch) ---
  const bootcamps = [
    {
      id: "1",
      title: "Bootcamp Business Plan - Batch 4",
      peserta: 120,
      sesi: 5,
      unassigned: 5,
      pending: 5,
    },
    {
      id: "2",
      title: "Bootcamp Business Plan - Batch 3",
      peserta: 120,
      sesi: 5,
      unassigned: 5,
      pending: 5,
    },
    {
      id: "3",
      title: "Bootcamp Business Plan - Batch 2",
      peserta: 120,
      sesi: 5,
      unassigned: 0,
      pending: 0,
    },
    {
      id: "4",
      title: "Bootcamp Business Plan - Batch 1",
      peserta: 120,
      sesi: 5,
      unassigned: 0,
      pending: 0,
    },
  ];

  const totalActionRequired = bootcamps.reduce(
    (sum, b) => sum + b.unassigned + b.pending,
    0,
  );
  const totalUnassigned = bootcamps.reduce((sum, b) => sum + b.unassigned, 0);
  const totalPending = bootcamps.reduce((sum, b) => sum + b.pending, 0);

  return (
    <DashboardLayout title="Kelola Pesanan · Bootcamp">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bold text-[22px] text-[#0F172A]">
            Manajemen Konten Bootcamp
          </h1>
          <p className="text-[#64748B] text-[14px] mt-1">
            Kelola sesi sinkronus, bagikan link Zoom, dan pantau progres tiap
            batch aktif.
          </p>
        </div>
        <p className="text-[#94A3B8] text-[12px] max-w-[260px] text-right">
          Mau bikin batch baru? Buat produk Bootcamp baru dulu di halaman
          Produk.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <StatCard
          label="Total Butuh Tindakan"
          value={totalActionRequired}
          unit="sesi"
          variant="warning"
        />
        <StatCard
          label="Mentor Belum Ditentukan"
          value={totalUnassigned}
          unit="sesi"
        />
        <StatCard
          label="Link Belum Dibagikan"
          value={totalPending}
          unit="sesi"
        />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-[16px] font-semibold text-[#0F172A]">
          Daftar Batch
        </h2>

        {bootcamps.length === 0 ? (
          <EmptyState message="Belum ada batch bootcamp aktif." />
        ) : (
          <div className="flex flex-col gap-3">
            {bootcamps.map((bootcamp) => (
              <div
                key={bootcamp.id}
                className="w-full bg-white border border-[#E2E8F0] rounded-[12px] p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-5">
                  <div
                    style={{ width: "56px", height: "56px" }}
                    className="bg-[#F1F5F9] rounded-[8px] shrink-0"
                  />
                  <div className="flex flex-col gap-1">
                    <p className="font-bold text-[15px] text-[#1E293B]">
                      {bootcamp.title}
                    </p>
                    <p className="text-[13px] text-[#64748B] font-medium">
                      <span className="text-[#1E293B] font-bold">
                        {bootcamp.peserta}
                      </span>{" "}
                      Peserta ·{" "}
                      <span className="text-[#1E293B] font-bold">
                        {bootcamp.sesi}
                      </span>{" "}
                      Sesi
                      {bootcamp.unassigned > 0 && (
                        <>
                          {" "}
                          ·{" "}
                          <span className="text-[#DC2626] font-bold">
                            {bootcamp.unassigned}
                          </span>{" "}
                          Mentor Kosong
                        </>
                      )}
                      {bootcamp.pending > 0 && (
                        <>
                          {" "}
                          ·{" "}
                          <span className="text-[#DC2626] font-bold">
                            {bootcamp.pending}
                          </span>{" "}
                          Link Tertunda
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/admin/orders/bootcamp/${bootcamp.id}`}
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
