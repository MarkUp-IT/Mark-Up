"use client";

import { useState, useEffect, useCallback } from "react";
import { Eye, EyeOff, Pencil, ExternalLink } from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/component/admin/DashboardLayout";
import StatCard from "@/component/admin/StatCard";
import EmptyState from "@/component/admin/EmptyState";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/formErrors";

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

const formatIDR = (val) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val || 0);

export default function ModuleOrders() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchModules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/api/products/?all=true", { auth: false });
      const all = res?.products || [];
      setModules(all.filter((p) => p.type === "MODULE"));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const toggleVisibility = async (item) => {
    try {
      await apiRequest(`/api/products/${item.id}/`, {
        method: "PATCH",
        body: {
          title: item.title,
          description: item.description,
          original_price: item.original_price,
          file_pdf_url: item.file_pdf_url,
          is_active: !item.is_active,
        },
      });
      fetchModules();
      toast.success(item.is_active ? "Modul Disembunyikan" : "Modul Ditampilkan");
    } catch (err) {
      toast.error("Gagal Mengubah Status Modul", {
        description: extractErrorMessage(err, "Terjadi kesalahan."),
      });
    }
  };

  const activeCount = modules.filter((m) => m.is_active).length;
  const inactiveCount = modules.filter((m) => !m.is_active).length;

  return (
    <DashboardLayout title="Kelola Pesanan · Modul">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bold text-[22px] text-[#0F172A]">Manajemen Konten Modul</h1>
          <p className="text-[#64748B] text-[14px] mt-1">Kelola modul, bab, dan materi bacaan MARK-UP.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <StatCard label="Total Modul" value={modules.length} unit="modul" />
        <StatCard label="Aktif" value={activeCount} unit="modul" variant="success" />
        <StatCard label="Nonaktif" value={inactiveCount} unit="modul" variant="warning" />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-[16px] font-semibold text-[#0F172A]">Daftar Modul</h2>

        {!loading && modules.length === 0 ? (
          <EmptyState message="Belum ada modul yang dibuat." />
        ) : (
          <div className="rounded-[12px] overflow-hidden border border-[#E2E8F0] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-6 py-3.5 text-left font-bold text-[#64748B] tracking-wider text-[11px]">JUDUL MODUL</th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">HARGA</th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">STATUS</th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">TERJUAL</th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">AKSI</th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">KELOLA KONTEN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] bg-white">
                  {modules.map((item) => (
                    <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-6 py-4 text-[#1E293B] font-semibold" style={{ maxWidth: "260px" }}>
                        {item.title}
                      </td>
                      <td className="px-6 py-4 text-center text-[#475569] font-medium">
                        {formatIDR(item.new_price ?? item.original_price)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex px-3 py-1 rounded-[4px] font-bold text-[11px] ${item.is_active ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#FEE2E2] text-[#991B1B]"}`}
                        >
                          {item.is_active ? "AKTIF" : "NONAKTIF"}
                        </span>
                        <p className="text-[#94A3B8] text-[10px] mt-1 italic">{formatDate(item.created_at)}</p>
                      </td>
                      <td className="px-6 py-4 text-center text-[#475569] font-medium">{item.sold_count ?? 0}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-3 text-[#94A3B8]">
                          <button
                            onClick={() => toggleVisibility(item)}
                            className="hover:text-[#148F89] transition-colors"
                            title={item.is_active ? "Modul tampil" : "Modul disembunyikan"}
                          >
                            {item.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>
                          <Link href={`/admin/orders/module/${item.id}`} className="hover:text-[#148F89] transition-colors">
                            <Pencil size={16} />
                          </Link>
                          {item.file_pdf_url && (
                            <a href={item.file_pdf_url} target="_blank" rel="noopener noreferrer" className="hover:text-[#148F89] transition-colors">
                              <ExternalLink size={16} />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link
                          href={`/admin/orders/module/${item.id}`}
                          className="inline-block px-5 py-2 rounded-[6px] font-bold text-[11px] bg-[#F1F5F9] text-[#1E293B] border border-[#E2E8F0] hover:bg-[#E2E8F0] transition-colors"
                        >
                          EDIT
                        </Link>
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
