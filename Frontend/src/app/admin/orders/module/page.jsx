"use client";

import { Eye, EyeOff, Pencil, ExternalLink } from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/component/admin/DashboardLayout";
import StatCard from "@/component/admin/StatCard";
import EmptyState from "@/component/admin/EmptyState";

export default function ModuleOrders() {
  // --- MOCK DATA (nanti ganti query product_modul JOIN modul_resources
  // buat hitung kelengkapan konten) ---
  const modules = [
    {
      id: "#ME003",
      title: "101 Career Mentoring",
      price: "Rp110.000",
      status: "Aktif",
      date: "22 Mei 2026, 14:54",
      sold: 12,
      isHidden: false,
    },
    {
      id: "#BO003",
      title: "Bundling PowerPack (Newbie Friendly)",
      price: "Rp110.000",
      status: "Aktif",
      date: "22 Mei 2026, 14:54",
      sold: 10,
      isHidden: false,
    },
    {
      id: "#BO001",
      title: "Essential Sprint Registration",
      price: "Rp110.000",
      status: "Nonaktif",
      date: "22 Mei 2026, 14:54",
      sold: 5,
      isHidden: true,
    },
    {
      id: "#MO001",
      title: "Full-Throttle Coaching",
      price: "Rp110.000",
      status: "Nonaktif",
      date: "22 Mei 2026, 14:54",
      sold: 8,
      isHidden: true,
    },
    {
      id: "#MO002",
      title: "Full-Throttle Coaching (Draft)",
      price: "Rp110.000",
      status: "Nonaktif",
      date: "22 Mei 2026, 14:54",
      sold: 0,
      isHidden: true,
      isNew: true,
    },
  ];

  return (
    <DashboardLayout title="Kelola Pesanan · Modul">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bold text-[22px] text-[#0F172A]">
            Manajemen Konten Modul
          </h1>
          <p className="text-[#64748B] text-[14px] mt-1">
            Kelola modul, bab, dan materi bacaan MARK-UP.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <StatCard label="Total Modul" value="151" unit="modul" />
        <StatCard label="Aktif" value="8" unit="modul" variant="success" />
        <StatCard label="Nonaktif" value="3" unit="modul" variant="warning" />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-[16px] font-semibold text-[#0F172A]">
          Daftar Modul
        </h2>

        {modules.length === 0 ? (
          <EmptyState message="Belum ada modul yang dibuat." />
        ) : (
          <div className="rounded-[12px] overflow-hidden border border-[#E2E8F0] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-6 py-3.5 text-left font-bold text-[#64748B] tracking-wider text-[11px]">
                      ID
                    </th>
                    <th className="px-6 py-3.5 text-left font-bold text-[#64748B] tracking-wider text-[11px]">
                      JUDUL MODUL
                    </th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                      HARGA
                    </th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                      STATUS
                    </th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                      TERJUAL
                    </th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                      AKSI
                    </th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                      KELOLA KONTEN
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] bg-white">
                  {modules.map((item, index) => (
                    <tr
                      key={index}
                      className="hover:bg-[#F8FAFC] transition-colors"
                    >
                      <td className="px-6 py-4 text-[#64748B] font-medium">
                        {item.id}
                      </td>
                      <td
                        className="px-6 py-4 text-[#1E293B] font-semibold"
                        style={{ maxWidth: "260px" }}
                      >
                        {item.title}
                      </td>
                      <td className="px-6 py-4 text-center text-[#475569] font-medium">
                        {item.price}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex px-3 py-1 rounded-[4px] font-bold text-[11px] ${item.status === "Aktif" ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#FEE2E2] text-[#991B1B]"}`}
                        >
                          {item.status.toUpperCase()}
                        </span>
                        <p className="text-[#94A3B8] text-[10px] mt-1 italic">
                          {item.date}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center text-[#475569] font-medium">
                        {item.sold}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-3 text-[#94A3B8]">
                          <button
                            className="hover:text-[#148F89] transition-colors"
                            title={
                              item.isHidden
                                ? "Modul disembunyikan"
                                : "Modul tampil"
                            }
                          >
                            {item.isHidden ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                          </button>
                          <button className="hover:text-[#148F89] transition-colors">
                            <Pencil size={16} />
                          </button>
                          <button className="hover:text-[#148F89] transition-colors">
                            <ExternalLink size={16} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.isNew ? (
                          <Link
                            href={`/admin/orders/module/${item.id.replace("#", "%23")}`}
                            className="inline-block px-5 py-2 rounded-[6px] font-bold text-[11px] bg-[#148F89] text-white hover:bg-[#117A75] transition-colors whitespace-nowrap"
                          >
                            UNGGAH MODUL
                          </Link>
                        ) : (
                          <Link
                            href={`/admin/orders/module/${item.id.replace("#", "%23")}`}
                            className="inline-block px-5 py-2 rounded-[6px] font-bold text-[11px] bg-[#F1F5F9] text-[#1E293B] border border-[#E2E8F0] hover:bg-[#E2E8F0] transition-colors"
                          >
                            EDIT
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
