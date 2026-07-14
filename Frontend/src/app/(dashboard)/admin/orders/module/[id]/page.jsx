"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CloudUpload,
  Plus,
  Trash2,
  GripVertical,
  FileText,
} from "lucide-react";
import DashboardLayout from "@/component/admin/DashboardLayout";

export default function ModuleContentEditor() {
  const params = useParams();

  // --- MOCK DATA (nanti ganti query product_modul by id JOIN modul_resources
  // ORDER BY sort_order). "Cakupan Materi" belum punya tabel sendiri di
  // skema -- sementara disimpen sebagai list teks biasa, kalau butuh urutan/
  // struktur lebih rapi ke depannya sebaiknya dibikinin tabel modul_chapters
  // sendiri kayak modul_resources. ---
  const [moduleTitle] = useState("Masterclass Business Case Competition (BCC)");
  const [mainFileUrl, setMainFileUrl] = useState("masterclass-bcc-final.pdf");

  const [resources, setResources] = useState([
    {
      id: "r1",
      title: "E-Book Panduan Analisis Kasus (50+ Halaman)",
      fileName: "ebook-panduan.pdf",
    },
    {
      id: "r2",
      title: "10 Winning Pitch Deck Finalis Nasional & Internasional",
      fileName: "pitch-decks.zip",
    },
    {
      id: "r3",
      title: "5 Template Presentasi Kasus Editable (Canva & PPT)",
      fileName: "templates.zip",
    },
  ]);

  const [chapters, setChapters] = useState([
    "Cara melakukan Root Cause Analysis (MECE, Issue Tree)",
    "Pemilihan framework yang tepat (SWOT, Porter's 5 Forces, 4P, dll)",
    "Menyusun strategi solusi dan rencana implementasi (Timeline & Budgeting)",
  ]);

  const addResource = () => {
    setResources((prev) => [
      ...prev,
      { id: `r${Date.now()}`, title: "", fileName: "" },
    ]);
  };

  const updateResourceTitle = (id, title) => {
    setResources((prev) =>
      prev.map((r) => (r.id === id ? { ...r, title } : r)),
    );
  };

  const removeResource = (id) => {
    setResources((prev) => prev.filter((r) => r.id !== id));
  };

  const addChapter = () => {
    setChapters((prev) => [...prev, ""]);
  };

  const updateChapter = (index, value) => {
    setChapters((prev) => prev.map((c, i) => (i === index ? value : c)));
  };

  const removeChapter = (index) => {
    setChapters((prev) => prev.filter((_, i) => i !== index));
  };

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
        <h1 className="font-bold text-[22px] text-[#0F172A]">{moduleTitle}</h1>
        <p className="text-[#64748B] text-[14px] mt-1">
          ID Produk: #{params?.id}
        </p>
      </div>

      {/* File PDF utama */}
      <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 flex flex-col gap-4 shadow-sm">
        <h2 className="text-[15px] font-semibold text-[#0F172A]">
          Materi Utama (PDF)
        </h2>
        {mainFileUrl ? (
          <div className="flex items-center justify-between gap-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 py-3">
            <div className="flex items-center gap-3">
              <FileText size={18} className="text-[#148F89] shrink-0" />
              <span className="text-[#1E293B] font-medium text-[13.5px]">
                {mainFileUrl}
              </span>
            </div>
            <button
              onClick={() => setMainFileUrl("")}
              className="text-[#DC2626] text-[12.5px] font-semibold hover:underline"
            >
              Ganti File
            </button>
          </div>
        ) : (
          <div
            style={{ height: "140px" }}
            className="bg-[#F8FAFC] w-full rounded-[8px] flex flex-col items-center justify-center border-2 border-dashed border-[#CBD5E1] hover:bg-[#F1F5F9] transition-all cursor-pointer"
          >
            <CloudUpload size={22} className="text-[#148F89] mb-2" />
            <p className="text-[#1E293B] font-semibold text-[14px]">
              Klik untuk unggah PDF materi utama
            </p>
            <p className="text-[#94A3B8] text-[12px]">Maks. 20MB</p>
          </div>
        )}
      </div>

      {/* Bonus resources */}
      <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 flex flex-col gap-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-[#0F172A]">
              Bonus di Dalamnya
            </h2>
            <p className="text-[#64748B] text-[12.5px] mt-0.5">
              Muncul sebagai daftar bonus di halaman detail user.
            </p>
          </div>
          <button
            onClick={addResource}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] bg-[#F1F5F9] text-[#334155] text-[12.5px] font-semibold hover:bg-[#E2E8F0] transition-colors"
          >
            <Plus size={14} />
            Tambah Bonus
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {resources.length === 0 ? (
            <p className="text-[#94A3B8] text-[13px] italic py-3">
              Belum ada bonus resource.
            </p>
          ) : (
            resources.map((res) => (
              <div
                key={res.id}
                className="flex items-center gap-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-3 py-2.5"
              >
                <GripVertical
                  size={16}
                  className="text-[#CBD5E1] shrink-0 cursor-grab"
                />
                <input
                  type="text"
                  value={res.title}
                  onChange={(e) => updateResourceTitle(res.id, e.target.value)}
                  placeholder="Judul bonus (contoh: E-Book Panduan Analisis Kasus)"
                  className="flex-1 bg-transparent text-[13px] text-[#1E293B] outline-none placeholder:text-[#94A3B8]"
                />
                <button className="text-[#148F89] text-[11.5px] font-semibold hover:underline shrink-0 whitespace-nowrap">
                  {res.fileName ? "Ganti File" : "Unggah File"}
                </button>
                <button
                  onClick={() => removeResource(res.id)}
                  className="text-[#DC2626] hover:text-[#991B1B] transition-colors shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Cakupan materi */}
      <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 flex flex-col gap-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-[#0F172A]">
              Cakupan Materi
            </h2>
            <p className="text-[#64748B] text-[12.5px] mt-0.5">
              Daftar poin materi yang muncul di halaman detail user.
            </p>
          </div>
          <button
            onClick={addChapter}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] bg-[#F1F5F9] text-[#334155] text-[12.5px] font-semibold hover:bg-[#E2E8F0] transition-colors"
          >
            <Plus size={14} />
            Tambah Poin
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {chapters.length === 0 ? (
            <p className="text-[#94A3B8] text-[13px] italic py-3">
              Belum ada poin materi.
            </p>
          ) : (
            chapters.map((chapter, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-3 py-2.5"
              >
                <span
                  style={{ width: "24px", height: "24px" }}
                  className="rounded-full bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] text-[11px] font-semibold shrink-0"
                >
                  {index + 1}
                </span>
                <input
                  type="text"
                  value={chapter}
                  onChange={(e) => updateChapter(index, e.target.value)}
                  placeholder="Poin materi..."
                  className="flex-1 bg-transparent text-[13px] text-[#1E293B] outline-none placeholder:text-[#94A3B8]"
                />
                <button
                  onClick={() => removeChapter(index)}
                  className="text-[#DC2626] hover:text-[#991B1B] transition-colors shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button className="bg-[#148F89] text-white font-bold text-[13px] px-6 py-3 rounded-[8px] shadow-sm hover:bg-[#117A75] transition-colors">
          Simpan Perubahan
        </button>
      </div>
    </DashboardLayout>
  );
}
