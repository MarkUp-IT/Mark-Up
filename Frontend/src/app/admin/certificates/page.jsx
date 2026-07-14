"use client";

import {
  Plus,
  X,
  ChevronDown,
  ExternalLink,
  CloudUpload,
  Search,
} from "lucide-react";
import { useState, useEffect } from "react";
import DashboardLayout from "@/component/admin/DashboardLayout";
import StatCard from "@/component/admin/StatCard";
import EmptyState from "@/component/admin/EmptyState";

const TYPE_BADGE = {
  participant: "bg-[#DBEAFE] text-[#1D4ED8] border border-[#BFDBFE]",
  instructor: "bg-[#CCFBF1] text-[#0F766E] border border-[#99F6E4]",
};

export default function Certificates() {
  const heightFix = `.adm-h-42 { height: 42px; } .adm-h-48 { height: 48px; }`;

  // --- MOCK DATA (nanti ganti query certificates JOIN users + products) ---
  const certificates = [
    {
      id: "1",
      number: "MKUP/BC001/2026/0042",
      recipientName: "Sarah Jenkins",
      productTitle: "Winner Class Dan Module (Debate)",
      type: "participant",
      issuedAt: "20 Jun 2026",
    },
    {
      id: "2",
      number: "MKUP/MT002/2026/0018",
      recipientName: "Alya Hamidah",
      productTitle: "1-on-1 Career Mentoring (sebagai pemateri)",
      type: "instructor",
      issuedAt: "15 Jun 2026",
    },
    {
      id: "3",
      number: "MKUP/BC001/2026/0043",
      recipientName: "Affan Fathir D.",
      productTitle: "Winner Class Dan Module (Debate)",
      type: "participant",
      issuedAt: "20 Jun 2026",
    },
  ];

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [certType, setCertType] = useState("participant");

  useEffect(() => {
    document.body.style.overflow = isAddOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isAddOpen]);

  const participantCount = certificates.filter(
    (c) => c.type === "participant",
  ).length;
  const instructorCount = certificates.filter(
    (c) => c.type === "instructor",
  ).length;

  return (
    <DashboardLayout title="Sertifikat">
      <style>{heightFix}</style>

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bold text-[22px] text-[#0F172A]">
            Manajemen Sertifikat
          </h1>
          <p className="text-[#64748B] text-[14px] mt-1">
            Terbitkan sertifikat peserta bootcamp/mentoring atau sertifikat
            pemateri buat mentor.
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="adm-h-42 flex items-center gap-2 px-5 rounded-[8px] bg-[#148F89] text-white text-[13px] font-semibold hover:bg-[#117A75] transition-colors"
        >
          <Plus size={16} />
          Terbitkan Sertifikat
        </button>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <StatCard
          label="Total Diterbitkan"
          value={certificates.length}
          unit="sertifikat"
        />
        <StatCard
          label="Sertifikat Peserta"
          value={participantCount}
          unit="sertifikat"
        />
        <StatCard
          label="Sertifikat Pemateri"
          value={instructorCount}
          unit="sertifikat"
          variant="primary"
        />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-[16px] font-semibold text-[#0F172A]">
          Riwayat Penerbitan
        </h2>

        {certificates.length === 0 ? (
          <EmptyState message="Belum ada sertifikat yang diterbitkan." />
        ) : (
          <div className="rounded-[12px] overflow-hidden border border-[#E2E8F0] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-6 py-3.5 text-left font-bold text-[#64748B] tracking-wider text-[11px]">
                      NO. SERTIFIKAT
                    </th>
                    <th className="px-6 py-3.5 text-left font-bold text-[#64748B] tracking-wider text-[11px]">
                      PENERIMA & PRODUK
                    </th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                      TIPE
                    </th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                      TANGGAL TERBIT
                    </th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                      FILE
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] bg-white">
                  {certificates.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-[#F8FAFC] transition-colors"
                    >
                      <td className="px-6 py-4 text-[#64748B] font-mono font-medium">
                        {item.number}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[#1E293B] font-semibold">
                          {item.recipientName}
                        </p>
                        <p className="text-[#64748B] text-[12px] mt-0.5">
                          {item.productTitle}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex px-3 py-1.5 text-[11px] rounded-[6px] font-semibold ${TYPE_BADGE[item.type]}`}
                        >
                          {item.type === "participant" ? "PESERTA" : "PEMATERI"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-[#64748B] font-medium whitespace-nowrap">
                        {item.issuedAt}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <ExternalLink
                          size={17}
                          className="cursor-pointer text-[#94A3B8] hover:text-[#148F89] transition-colors inline-block"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {isAddOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setIsAddOpen(false)}
        />
      )}
      <div
        style={{ width: "480px", maxWidth: "100%" }}
        className={`fixed top-0 right-0 h-screen bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out flex flex-col overflow-y-auto ${isAddOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="w-full shrink-0 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col justify-center px-8 py-6 gap-1">
          <div className="flex justify-between items-center">
            <p className="text-[#1E293B] text-[19px] font-bold">
              Terbitkan Sertifikat
            </p>
            <button
              onClick={() => setIsAddOpen(false)}
              className="p-2 hover:bg-[#E2E8F0] rounded-full transition-colors"
            >
              <X className="text-[#64748B]" size={20} />
            </button>
          </div>
          <p className="text-[#64748B] text-[13px]">
            Terbitkan sertifikat baru buat user atau mentor.
          </p>
        </div>

        <div className="px-8 py-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Tipe Sertifikat
            </p>
            <div className="adm-h-42 bg-[#F1F5F9] px-1.5 rounded-[8px] flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCertType("participant")}
                className={`flex-1 px-3 py-2 rounded-[6px] font-semibold text-[12.5px] transition-colors ${certType === "participant" ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B]"}`}
              >
                Peserta
              </button>
              <button
                type="button"
                onClick={() => setCertType("instructor")}
                className={`flex-1 px-3 py-2 rounded-[6px] font-semibold text-[12.5px] transition-colors ${certType === "instructor" ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B]"}`}
              >
                Pemateri (Mentor)
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              {certType === "participant" ? "Cari User" : "Cari Mentor"}
            </p>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
              />
              <input
                type="text"
                placeholder="Ketik nama atau email..."
                className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] pl-10 pr-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Produk Terkait
            </p>
            <div className="relative w-full">
              <select className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 pr-10 appearance-none outline-none focus:border-[#148F89] transition-all text-[#1E293B]">
                <option>-- Pilih Produk --</option>
                <option>Winner Class Dan Module (Debate)</option>
                <option>1-on-1 Career Mentoring</option>
                <option>Bundling PowerPack (Newbie Friendly)</option>
              </select>
              <ChevronDown
                size={18}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Nomor Sertifikat
            </p>
            <input
              type="text"
              placeholder="Contoh: MKUP/BC001/2026/0044"
              className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B] font-mono"
            />
            <p className="text-[#94A3B8] text-[11px]">
              Harus unik, nggak boleh sama kayak sertifikat lain.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              File Sertifikat (PDF)
            </p>
            <div
              style={{ height: "140px" }}
              className="bg-[#F8FAFC] w-full rounded-[8px] flex flex-col items-center justify-center border-2 border-dashed border-[#CBD5E1] hover:bg-[#F1F5F9] transition-all cursor-pointer"
            >
              <CloudUpload size={22} className="text-[#148F89] mb-2" />
              <p className="text-[#1E293B] font-semibold text-[14px]">
                Klik untuk unggah PDF
              </p>
              <p className="text-[#94A3B8] text-[12px]">Maks. 5MB</p>
            </div>
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
            Terbitkan
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
