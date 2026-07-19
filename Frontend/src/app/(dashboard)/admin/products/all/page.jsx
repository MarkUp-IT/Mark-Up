"use client";

import { ArrowLeft, Search, ChevronDown, Download, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import DashboardLayout from "@/component/admin/DashboardLayout";
import EmptyState from "@/component/admin/EmptyState";
import { toast } from "sonner";
import { api } from "@/lib/api";

const CATEGORY_FILTERS = ["Semua", "Mentoring", "Bootcamp", "Modul"];
const STATUS_FILTERS = ["Semua", "Aktif", "Nonaktif"];

const CATEGORY_BADGE = {
  Mentoring: "bg-[#FEF9C3] text-[#854D0E] border border-[#FEF08A]",
  Bootcamp: "bg-[#CCFBF1] text-[#0F766E] border border-[#99F6E4]",
  Modul: "bg-[#FCE7F3] text-[#9D174D] border border-[#FBCFE8]",
};

function typeLabel(t) {
  return t === "MENTORING" ? "Mentoring" : t === "BOOTCAMP" ? "Bootcamp" : "Modul";
}

function formatIDR(val) {
  return val == null
    ? "-"
    : new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(val);
}

export default function AllProducts() {
  const heightFix = `.adm-h-42 { height: 42px; } .adm-w-220 { width: 220px; }`;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [exporting, setExporting] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("Semua");

  const fetchAllProducts = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await api.get("/api/products/?all=true&include_inactive=true");
      setProducts(data.products ?? []);
    } catch (err) {
      setLoadError("Gagal memuat data produk.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((item) => {
      const matchSearch = !q || (item.title || "").toLowerCase().includes(q);
      const matchCategory =
        categoryFilter === "Semua" || typeLabel(item.type) === categoryFilter;
      const matchStatus =
        statusFilter === "Semua" ||
        (statusFilter === "Aktif" ? item.is_active : !item.is_active);
      return matchSearch && matchCategory && matchStatus;
    });
  }, [products, search, categoryFilter, statusFilter]);

  async function handleExportCsv() {
    setExporting(true);
    try {
      const header = [
        "ID", "Judul", "Kategori", "Harga Asli", "Harga Setelah Diskon",
        "Diskon (%)", "Status", "Terjual",
      ];
      const rows = filtered.map((item) => [
        `${item.type.slice(0, 2)}${String(item.id).slice(-4)}`,
        item.title,
        typeLabel(item.type),
        item.original_price ?? "",
        item.new_price ?? "",
        item.discount_percent ?? 0,
        item.is_active ? "Aktif" : "Nonaktif",
        item.sold_count ?? 0,
      ]);
      const csv = [header, ...rows]
        .map((row) =>
          row.map((field) => `"${String(field ?? "").replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "semua-produk.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Gagal Ekspor", { description: "Terjadi kesalahan saat mengekspor data produk." });
    } finally {
      setExporting(false);
    }
  }

  return (
    <DashboardLayout title="Semua Produk">
      <style>{heightFix}</style>

      <Link
        href="/admin/products"
        className="inline-flex items-center gap-2 text-[#64748B] hover:text-[#148F89] text-[13px] font-medium transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        Kembali ke Kelola Produk
      </Link>

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bold text-[22px] text-[#0F172A]">Semua Produk</h1>
          <p className="text-[#64748B] text-[14px] mt-1">
            Daftar lengkap seluruh produk MARK-UP, termasuk yang nonaktif -- tanpa batas halaman.
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          disabled={exporting}
          className="adm-h-42 flex items-center gap-2 px-4 bg-[#F1F5F9] text-[13px] font-medium rounded-[8px] hover:bg-[#E2E8F0] transition-colors text-[#475569] disabled:opacity-60"
        >
          <Download size={15} />
          {exporting ? "Mengekspor..." : "Ekspor .CSV"}
        </button>
      </div>

      <div className="bg-white p-4 rounded-[12px] flex items-center justify-between gap-4 flex-wrap border border-[#E2E8F0] shadow-sm">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
              size={15}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul produk..."
              className="bg-white adm-w-220 adm-h-42 rounded-[8px] pl-9 pr-3 border border-[#E2E8F0] outline-none focus:border-[#148F89] text-[13px]"
            />
          </div>
          <div className="adm-h-42 bg-[#F1F5F9] px-1.5 rounded-[8px] flex items-center gap-1">
            {CATEGORY_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setCategoryFilter(f)}
                className={`px-3.5 py-2 rounded-[6px] font-medium text-[12.5px] transition-colors ${categoryFilter === f ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B] hover:bg-white/60"}`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="adm-h-42 bg-[#F1F5F9] px-1.5 rounded-[8px] flex items-center gap-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3.5 py-2 rounded-[6px] font-medium text-[12.5px] transition-colors ${statusFilter === f ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B] hover:bg-white/60"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <span className="text-[#64748B] text-[13px] font-medium">
          {filtered.length} produk
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-[#64748B] text-[13px]">
          <Loader2 size={16} className="animate-spin" />
          Memuat data produk...
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center gap-3 py-16 text-[13px]">
          <p className="text-[#991B1B]">{loadError}</p>
          <button
            onClick={fetchAllProducts}
            className="px-4 py-2 bg-[#F1F5F9] rounded-[8px] text-[#475569] font-medium hover:bg-[#E2E8F0] transition-colors"
          >
            Coba lagi
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState message="Nggak ada produk yang cocok sama filter ini." />
      ) : (
        <div className="rounded-[12px] overflow-hidden border border-[#E2E8F0] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-6 py-3.5 text-left font-bold text-[#64748B] tracking-wider text-[11px]">ID</th>
                  <th className="px-6 py-3.5 text-left font-bold text-[#64748B] tracking-wider text-[11px]">JUDUL</th>
                  <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">HARGA</th>
                  <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">KATEGORI</th>
                  <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">STATUS</th>
                  <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">TERJUAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] bg-white">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-6 py-4 text-[#64748B] font-medium">
                      {item.type.slice(0, 2)}{String(item.id).slice(-4)}
                    </td>
                    <td className="px-6 py-4 text-[#1E293B] font-semibold">
                      {item.title}
                      {item.session_count > 1 && (
                        <span className="ml-2 text-[#148F89] text-[11px] font-semibold">
                          ({item.session_count}x sesi)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-[#334155] font-medium">
                      {item.discount_percent > 0 && (
                        <span className="line-through text-[#94A3B8] mr-1.5">
                          {formatIDR(item.original_price)}
                        </span>
                      )}
                      {formatIDR(item.new_price)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex px-3 py-1.5 text-[11px] rounded-[6px] font-semibold ${CATEGORY_BADGE[typeLabel(item.type)]}`}
                      >
                        {typeLabel(item.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex px-3 py-1.5 text-[11px] rounded-full font-bold ${item.is_active ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#FEE2E2] text-[#991B1B]"}`}
                      >
                        {item.is_active ? "AKTIF" : "NONAKTIF"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-[#475569] font-medium">
                      {item.sold_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
