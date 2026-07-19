"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import DashboardLayout from "@/component/admin/DashboardLayout";
import { apiRequest } from "@/lib/api";

export default function ModuleContentEditor() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [filePdfUrl, setFilePdfUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    apiRequest(`/api/products/${params.id}/`)
      .then((res) => {
        setTitle(res.title || "");
        setDescription(res.description || "");
        setOriginalPrice(res.original_price || "");
        setFilePdfUrl(res.file_pdf_url || "");
        setIsActive(res.is_active);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await apiRequest(`/api/products/${params.id}/`, {
        method: "PATCH",
        body: {
          title,
          description,
          original_price: originalPrice,
          file_pdf_url: filePdfUrl,
          is_active: isActive,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Kelola Konten Modul">
        <p className="text-[#64748B] text-[14px]">Memuat...</p>
      </DashboardLayout>
    );
  }

  if (notFound) {
    return (
      <DashboardLayout title="Kelola Konten Modul">
        <Link
          href="/admin/orders/module"
          className="inline-flex items-center gap-2 text-[#64748B] hover:text-[#148F89] text-[13px] font-medium transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          Kembali ke Daftar Modul
        </Link>
        <p className="text-[#64748B] text-[14px]">Modul tidak ditemukan.</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Kelola Konten Modul">
      <Link
        href="/admin/orders/module"
        className="inline-flex items-center gap-2 text-[#64748B] hover:text-[#148F89] text-[13px] font-medium transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        Kembali ke Daftar Modul
      </Link>

      <div>
        <h1 className="font-bold text-[22px] text-[#0F172A]">{title}</h1>
        <p className="text-[#64748B] text-[14px] mt-1">ID Produk: {params?.id}</p>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 flex flex-col gap-4 shadow-sm">
        <h2 className="text-[15px] font-semibold text-[#0F172A]">Informasi Produk</h2>

        <div className="flex flex-col gap-1.5">
          <label className="text-[#334155] text-[13px] font-medium">Judul</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ height: "42px" }}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 text-[13.5px] text-[#1E293B] outline-none focus:border-[#148F89] transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[#334155] text-[13px] font-medium">Deskripsi</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 py-3 text-[13.5px] text-[#1E293B] outline-none focus:border-[#148F89] transition-colors resize-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[#334155] text-[13px] font-medium">Harga</label>
          <input
            type="number"
            value={originalPrice}
            onChange={(e) => setOriginalPrice(e.target.value)}
            style={{ height: "42px" }}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 text-[13.5px] text-[#1E293B] outline-none focus:border-[#148F89] transition-colors"
          />
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded accent-[#148F89]"
          />
          <span className="text-[#334155] text-[13px]">Modul aktif & tampil ke publik</span>
        </label>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 flex flex-col gap-4 shadow-sm">
        <h2 className="text-[15px] font-semibold text-[#0F172A]">Materi Utama (PDF)</h2>
        <div className="flex flex-col gap-1.5">
          <label className="text-[#334155] text-[13px] font-medium">Link file PDF</label>
          <div className="flex items-center gap-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4">
            <FileText size={18} className="text-[#148F89] shrink-0" />
            <input
              type="text"
              value={filePdfUrl}
              onChange={(e) => setFilePdfUrl(e.target.value)}
              placeholder="https://..."
              style={{ height: "42px" }}
              className="flex-1 bg-transparent text-[13.5px] text-[#1E293B] outline-none"
            />
          </div>
        </div>
      </div>

      <p className="text-[#94A3B8] text-[12px] italic">
        Fitur bonus resource dan cakupan materi per-bab belum tersedia -- backend
        belum menyediakan tabel untuk itu.
      </p>

      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-[#148F89] text-[13px] font-medium">Perubahan tersimpan.</span>}
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#148F89] text-white font-bold text-[13px] px-6 py-3 rounded-[8px] shadow-sm hover:bg-[#117A75] transition-colors disabled:opacity-50"
        >
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>
    </DashboardLayout>
  );
}
