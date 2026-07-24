"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/component/admin/DashboardLayout";
import StatCard from "@/component/admin/StatCard";
import EmptyState from "@/component/admin/EmptyState";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

const STATUS_FILTERS = ["Semua", "Aktif", "Nonaktif"];

export default function BootcampOrders() {
  const [bootcamps, setBootcamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("Semua");

  useEffect(() => {
    apiRequest("/api/programs/bootcamp-batches/")
      .then((res) => setBootcamps(res?.batches || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredBootcamps = bootcamps.filter((b) => {
    if (statusFilter === "Aktif") return b.is_active;
    if (statusFilter === "Nonaktif") return !b.is_active;
    return true;
  });

  const totalActionRequired = bootcamps.reduce((sum, b) => sum + b.unassigned + b.pending, 0);
  const totalUnassigned = bootcamps.reduce((sum, b) => sum + b.unassigned, 0);
  const totalPending = bootcamps.reduce((sum, b) => sum + b.pending, 0);

  return (
    <DashboardLayout title="Kelola Pesanan · Bootcamp">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bold text-[22px] text-[#0F172A]">Manajemen Konten Bootcamp</h1>
          <p className="text-[#64748B] text-[14px] mt-1">
            Kelola sesi sinkronus, bagikan link Zoom, dan pantau progres tiap batch aktif.
          </p>
        </div>
        <p className="text-[#94A3B8] text-[12px] max-w-[260px] text-right">
          Mau bikin batch baru? Buat produk Bootcamp baru dulu di halaman Produk.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <StatCard label="Total Butuh Tindakan" value={totalActionRequired} unit="sesi" variant="warning" />
        <StatCard label="Mentor Belum Ditentukan" value={totalUnassigned} unit="sesi" />
        <StatCard label="Link Belum Dibagikan" value={totalPending} unit="sesi" />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-[16px] font-semibold text-[#0F172A]">Daftar Batch</h2>
          <div className="flex items-center gap-1 bg-[#F1F5F9] rounded-[8px] p-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3.5 py-1.5 rounded-[6px] text-[12.5px] font-medium transition-colors ${
                  statusFilter === f ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {!loading && filteredBootcamps.length === 0 ? (
          <EmptyState message={statusFilter === "Semua" ? "Belum ada batch bootcamp." : `Tidak ada batch ${statusFilter.toLowerCase()}.`} />
        ) : (
          <div className="flex flex-col gap-3">
            {filteredBootcamps.map((bootcamp) => (
              <div
                key={bootcamp.id}
                className="w-full bg-white border border-[#E2E8F0] rounded-[12px] p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-5">
                  <div style={{ width: "56px", height: "56px" }} className="bg-[#F1F5F9] rounded-[8px] shrink-0" />
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-[15px] text-[#1E293B]">{bootcamp.title}</p>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          bootcamp.is_active
                            ? "bg-[#DCFCE7] text-[#166534]"
                            : "bg-[#F1F5F9] text-[#64748B]"
                        }`}
                      >
                        {bootcamp.is_active ? "AKTIF" : "NONAKTIF"}
                      </span>
                    </div>
                    <p className="text-[13px] text-[#64748B] font-medium">
                      <span className="text-[#1E293B] font-bold">{bootcamp.peserta}</span> Peserta ·{" "}
                      <span className="text-[#1E293B] font-bold">{bootcamp.sesi}</span> Sesi
                      {bootcamp.unassigned > 0 && (
                        <>
                          {" "}·{" "}
                          <span className="text-[#DC2626] font-bold">{bootcamp.unassigned}</span> Mentor Kosong
                        </>
                      )}
                      {bootcamp.pending > 0 && (
                        <>
                          {" "}·{" "}
                          <span className="text-[#DC2626] font-bold">{bootcamp.pending}</span> Link Tertunda
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
