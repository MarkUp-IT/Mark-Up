"use client";

import {
  Plus,
  Download,
  ChevronDown,
  X,
  CloudUpload,
  PenLine,
  ExternalLink,
} from "lucide-react";
import { useState, useEffect } from "react";
import DashboardLayout from "@/component/admin/DashboardLayout";
import StatCard from "@/component/admin/StatCard";
import EmptyState from "@/component/admin/EmptyState";

const CATEGORY_FILTERS = [
  "Semua",
  "Business Case",
  "Business Plan",
  "Debat",
  "LKTI",
  "UI/UX",
  "Hackathon",
];
const STATUS_FILTERS = ["Semua", "Aktif", "Kedaluwarsa"];

export default function Competitions() {
  const heightFix = `.adm-h-42 { height: 42px; } .adm-h-48 { height: 48px; }`;

  // status "Aktif"/"Kedaluwarsa" itu turunan dari deadline vs sekarang,
  // bukan kolom tersimpan -- di sini dihitung manual buat mock data.
  const competitions = [
    {
      id: "#ME003",
      title: "KOPMAVATION 1.0 Business Plan Competition",
      organizer: "Kopma UMY",
      category: "Business Plan",
      deadline: "20 Agu 2026",
      status: "Aktif",
    },
    {
      id: "#BO001",
      title: "LDBI ASFERA 2k26 (Lomba Debat Bahasa Indonesia)",
      organizer: "As-Syifa Boarding School Wanareja",
      category: "Debat",
      deadline: "5 Jun 2026",
      status: "Kedaluwarsa",
    },
    {
      id: "#MO001",
      title: "DreamCareer Mini Case Competition",
      organizer: "DreamCareer",
      category: "Business Case",
      deadline: "15 Sep 2026",
      status: "Aktif",
    },
    {
      id: "#BO003",
      title: "DWDG BINUS X PWC X UNIQLO X MAD FOR MAKEU",
      organizer: "Binus University",
      category: "Business Case",
      deadline: "1 Sep 2026",
      status: "Aktif",
    },
  ];

  const [categoryFilter, setCategoryFilter] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState(null);

  useEffect(() => {
    document.body.style.overflow = isAddOpen || isEditOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isAddOpen, isEditOpen]);

  const filtered = competitions.filter((c) => {
    const matchCategory =
      categoryFilter === "Semua" || c.category === categoryFilter;
    const matchStatus = statusFilter === "Semua" || c.status === statusFilter;
    return matchCategory && matchStatus;
  });

  return (
    <DashboardLayout title="Info Lomba">
      <style>{heightFix}</style>

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bold text-[22px] text-[#0F172A]">Info Lomba</h1>
          <p className="text-[#64748B] text-[14px] mt-1">
            Kelola informasi lomba yang tampil di halaman publik MARK-UP.
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="adm-h-42 flex items-center gap-2 px-5 rounded-[8px] bg-[#148F89] text-white text-[13px] font-semibold hover:bg-[#117A75] transition-colors"
        >
          <Plus size={16} />
          Lomba Baru
        </button>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <StatCard label="Total Lomba" value="15" unit="lomba" />
        <StatCard label="Aktif" value="12" unit="lomba" variant="primary" />
        <StatCard label="Kedaluwarsa" value="3" unit="lomba" />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-[16px] font-semibold text-[#0F172A]">
              Daftar Lomba
            </h2>
            <p className="text-[#64748B] text-[13px] mt-0.5">
              Seluruh lomba yang pernah dipublikasikan.
            </p>
          </div>
          <button className="adm-h-42 flex items-center gap-2 px-4 bg-[#F1F5F9] text-[13px] font-medium rounded-[8px] hover:bg-[#E2E8F0] transition-colors text-[#475569]">
            <Download size={15} />
            Ekspor .CSV
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="adm-h-42 bg-[#F1F5F9] px-1.5 rounded-[8px] flex items-center gap-1 flex-wrap">
            {CATEGORY_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setCategoryFilter(f)}
                className={`px-3 py-2 rounded-[6px] font-medium text-[12.5px] transition-colors whitespace-nowrap ${categoryFilter === f ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B] hover:bg-white/60"}`}
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
                className={`px-3 py-2 rounded-[6px] font-medium text-[12.5px] transition-colors ${statusFilter === f ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B] hover:bg-white/60"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState message="Nggak ada lomba yang cocok sama filter ini." />
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
                      JUDUL LOMBA
                    </th>
                    <th className="px-6 py-3.5 text-left font-bold text-[#64748B] tracking-wider text-[11px]">
                      PENYELENGGARA
                    </th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                      KATEGORI
                    </th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                      DEADLINE
                    </th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                      STATUS
                    </th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                      AKSI
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] bg-white">
                  {filtered.map((item) => (
                    <tr
                      key={item.id}
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
                      <td className="px-6 py-4 text-[#475569] font-medium">
                        {item.organizer}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex px-3 py-1.5 text-[11px] rounded-[6px] font-semibold bg-[#F1F5F9] text-[#475569]">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-[#475569] font-medium whitespace-nowrap">
                        {item.deadline}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex px-3 py-1.5 text-[11px] rounded-full font-bold ${item.status === "Aktif" ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#FEE2E2] text-[#991B1B]"}`}
                        >
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <PenLine
                            size={17}
                            onClick={() => {
                              setSelectedCompetition(item);
                              setIsEditOpen(true);
                            }}
                            className="cursor-pointer text-[#94A3B8] hover:text-[#148F89] transition-colors"
                          />
                          <ExternalLink
                            size={17}
                            className="cursor-pointer text-[#94A3B8] hover:text-[#148F89] transition-colors"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL TAMBAH --- */}
      {isAddOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setIsAddOpen(false)}
        />
      )}
      <div
        style={{ width: "560px", maxWidth: "100%" }}
        className={`fixed top-0 right-0 h-screen bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out flex flex-col overflow-y-auto ${isAddOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="w-full shrink-0 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col justify-center px-8 py-6 gap-1">
          <div className="flex justify-between items-center">
            <p className="text-[#1E293B] text-[19px] font-bold">Lomba Baru</p>
            <button
              onClick={() => setIsAddOpen(false)}
              className="p-2 hover:bg-[#E2E8F0] rounded-full transition-colors"
            >
              <X className="text-[#64748B]" size={20} />
            </button>
          </div>
          <p className="text-[#64748B] text-[13px]">
            Isi detail buat publikasikan lomba baru.
          </p>
        </div>

        <div className="px-8 py-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Poster Lomba
            </p>
            <div
              style={{ height: "160px" }}
              className="bg-[#F8FAFC] w-full rounded-[8px] flex flex-col items-center justify-center border-2 border-dashed border-[#CBD5E1] hover:bg-[#F1F5F9] transition-all cursor-pointer"
            >
              <CloudUpload size={22} className="text-[#148F89] mb-2" />
              <p className="text-[#1E293B] font-semibold text-[14px]">
                Klik untuk unggah poster
              </p>
              <p className="text-[#94A3B8] text-[12px]">Maks. 5MB</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Judul Lomba
            </p>
            <input
              type="text"
              placeholder="Masukkan judul lomba..."
              className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Penyelenggara
            </p>
            <input
              type="text"
              placeholder="Masukkan penyelenggara..."
              className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Kategori
            </p>
            <div className="relative w-full">
              <select className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 pr-10 appearance-none outline-none focus:border-[#148F89] transition-all text-[#1E293B]">
                {CATEGORY_FILTERS.slice(1).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <ChevronDown
                size={18}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Tingkat Lomba
            </p>
            <input
              type="text"
              placeholder='"Surabaya", "Nasional", "Internasional"'
              className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
            />
          </div>

          <div className="flex gap-4 w-full">
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
                Tanggal Event
              </p>
              <input
                type="date"
                className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
              />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
                Deadline Pendaftaran
              </p>
              <input
                type="date"
                className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Target Peserta
            </p>
            <input
              type="text"
              placeholder='"Mahasiswa Aktif S1", "Siswa SMA"'
              className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
            />
          </div>

          <div className="flex gap-4 w-full">
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
                Biaya Pendaftaran (Rp)
              </p>
              <input
                type="number"
                placeholder="0"
                className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
              />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
                Biaya Maks (opsional)
              </p>
              <input
                type="number"
                placeholder="Kalau ada rentang harga"
                className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Link Pendaftaran
            </p>
            <input
              type="url"
              placeholder="https://..."
              className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
            />
          </div>
        </div>

        <div className="mt-auto p-6 bg-white border-t border-[#E2E8F0] flex gap-3">
          <button
            onClick={() => setIsAddOpen(false)}
            className="flex-1 py-3 bg-white border border-[#E2E8F0] text-[#475569] font-bold rounded-[8px] hover:bg-[#F8FAFC] transition-colors"
          >
            Batalkan
          </button>
          <button className="flex-1 py-3 bg-[#148F89] text-white font-bold rounded-[8px] hover:bg-[#117A75] transition-colors">
            Publikasikan
          </button>
        </div>
      </div>

      {/* --- MODAL EDIT --- */}
      {isEditOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setIsEditOpen(false)}
        />
      )}
      <div
        style={{ width: "560px", maxWidth: "100%" }}
        className={`fixed top-0 right-0 h-screen bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out flex flex-col overflow-y-auto ${isEditOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="w-full shrink-0 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col justify-center px-8 py-6 gap-1">
          <div className="flex justify-between items-center">
            <p className="text-[#1E293B] text-[19px] font-bold">Edit Lomba</p>
            <button
              onClick={() => setIsEditOpen(false)}
              className="p-2 hover:bg-[#E2E8F0] rounded-full transition-colors"
            >
              <X className="text-[#64748B]" size={20} />
            </button>
          </div>
          <p className="text-[#64748B] text-[13px]">
            Ubah detail {selectedCompetition?.title || "lomba terpilih"}.
          </p>
        </div>

        <div className="px-8 py-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Judul Lomba
            </p>
            <input
              type="text"
              defaultValue={selectedCompetition?.title}
              className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
            />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Penyelenggara
            </p>
            <input
              type="text"
              defaultValue={selectedCompetition?.organizer}
              className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
            />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Kategori
            </p>
            <div className="relative w-full">
              <select
                defaultValue={selectedCompetition?.category}
                className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 pr-10 appearance-none outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
              >
                {CATEGORY_FILTERS.slice(1).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <ChevronDown
                size={18}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Deadline Pendaftaran
            </p>
            <input
              type="date"
              className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
            />
          </div>
        </div>

        <div className="mt-auto p-6 bg-white border-t border-[#E2E8F0] flex gap-3">
          <button
            onClick={() => setIsEditOpen(false)}
            className="flex-1 py-3 bg-white border border-[#E2E8F0] text-[#475569] font-bold rounded-[8px] hover:bg-[#F8FAFC] transition-colors"
          >
            Batal
          </button>
          <button className="flex-1 py-3 bg-[#148F89] text-white font-bold rounded-[8px] hover:bg-[#117A75] transition-colors">
            Simpan Perubahan
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
