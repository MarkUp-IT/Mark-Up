"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  CloudUpload,
  Cloud,
  Trash2,
  Plus,
  ChevronDown,
} from "lucide-react";
import DashboardLayout from "@/component/admin/DashboardLayout";

export default function BootcampOrderDetail() {
  const params = useParams();

  // --- MOCK DATA (nanti ganti query by id: bootcamp_sessions WHERE
  // bootcamp_id = params.id, JOIN bootcamp_session_mentors) ---
  const bootcampTitle = "Bootcamp Business Plan - Batch 4";
  const sessions = [
    {
      sesi: "01",
      judul: "Fondasi Business Plan",
      mentor: "Alya Hamidah",
      date: "7 Jun 2026",
      time: "19:00 WIB",
      link: "https://zoom.us/j/987...",
      needsAction: false,
    },
    {
      sesi: "02",
      judul: "Fondasi Business Plan",
      mentor: "Adena Laksita",
      date: "14 Jun 2026",
      time: "19:00 WIB",
      link: "https://zoom.us/j/987...",
      needsAction: false,
    },
    {
      sesi: "03",
      judul: "Model Bisnis & Monetisasi",
      mentor: "",
      date: "21 Jun 2026",
      time: "15:00 WIB",
      link: "",
      needsAction: ["MENTOR", "LINK"],
    },
    {
      sesi: "04",
      judul: "Strategi Pemasaran",
      mentor: "",
      date: "28 Jun 2026",
      time: "14:00 WIB",
      link: "https://zoom.us/j/987...",
      needsAction: ["MENTOR"],
    },
    {
      sesi: "05",
      judul: "Strategi Pemasaran",
      mentor: "",
      date: "5 Jul 2026",
      time: "14:00 WIB",
      link: "",
      needsAction: ["MENTOR", "LINK"],
    },
  ];

  return (
    <DashboardLayout title="Detail Bootcamp">
      <Link
        href="/admin/orders/bootcamp"
        className="inline-flex items-center gap-2 text-[#64748B] hover:text-[#148F89] text-[13px] font-medium transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        Kembali ke Daftar Batch
      </Link>

      <div>
        <h1 className="font-bold text-[22px] text-[#0F172A]">
          {bootcampTitle}
        </h1>
        <p className="text-[#64748B] text-[14px] mt-1">
          ID Batch: #{params?.id}
        </p>
      </div>

      <div className="rounded-[12px] overflow-hidden border border-[#E2E8F0] shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] border-collapse">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <tr>
                <th
                  className="px-4 py-3.5 text-center font-bold text-[#64748B] text-[11px] tracking-wider"
                  style={{ width: "60px" }}
                >
                  SESI
                </th>
                <th className="px-4 py-3.5 text-left font-bold text-[#64748B] text-[11px] tracking-wider">
                  JUDUL SESI
                </th>
                <th
                  className="px-4 py-3.5 text-left font-bold text-[#64748B] text-[11px] tracking-wider"
                  style={{ width: "190px" }}
                >
                  MENTOR
                </th>
                <th
                  className="px-4 py-3.5 text-center font-bold text-[#64748B] text-[11px] tracking-wider"
                  style={{ width: "150px" }}
                >
                  JADWAL
                </th>
                <th
                  className="px-4 py-3.5 text-center font-bold text-[#64748B] text-[11px] tracking-wider"
                  style={{ width: "230px" }}
                >
                  LINK ZOOM
                </th>
                <th
                  className="px-4 py-3.5 text-center font-bold text-[#64748B] text-[11px] tracking-wider"
                  style={{ width: "140px" }}
                >
                  STATUS
                </th>
                <th
                  className="px-4 py-3.5 text-center font-bold text-[#64748B] text-[11px] tracking-wider"
                  style={{ width: "90px" }}
                >
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {sessions.map((item, index) => (
                <tr
                  key={index}
                  className="hover:bg-[#F8FAFC] transition-colors"
                >
                  <td className="px-4 py-4 text-center text-[#64748B] font-medium">
                    {item.sesi}
                  </td>
                  <td className="px-4 py-4 text-left text-[#1E293B] font-medium">
                    {item.judul}
                  </td>
                  <td className="px-4 py-4">
                    <div className="relative w-full">
                      <select
                        defaultValue={item.mentor || ""}
                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] pl-3 pr-8 text-[13px] font-medium text-[#475569] appearance-none outline-none focus:border-[#148F89]"
                        style={{ height: "36px" }}
                      >
                        <option value="" disabled>
                          -- Pilih Mentor --
                        </option>
                        <option value="Alya Hamidah">Alya Hamidah</option>
                        <option value="Adena Laksita">Adena Laksita</option>
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <p className="text-[#1E293B] font-bold text-[12px]">
                      {item.date}
                    </p>
                    <p className="text-[#94A3B8] text-[11px]">{item.time}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="text"
                        placeholder="Masukkan link zoom..."
                        defaultValue={item.link}
                        style={{ width: "150px", height: "36px" }}
                        className="bg-[#F8FAFC] rounded-[6px] px-3 text-[12px] outline-none border border-[#E2E8F0] text-[#334155] focus:border-[#148F89] transition-colors"
                      />
                      <button
                        style={{ width: "36px", height: "36px" }}
                        className={`rounded-[6px] flex items-center justify-center transition-colors shrink-0 ${
                          item.needsAction && item.needsAction.includes("LINK")
                            ? "bg-[#148F89] text-white hover:bg-[#117A75]"
                            : "bg-[#F1F5F9] text-[#94A3B8]"
                        }`}
                      >
                        <Send size={15} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1 items-center justify-center">
                      {item.needsAction ? (
                        item.needsAction.map((stat, i) => (
                          <span
                            key={i}
                            className="inline-flex px-3 py-1 text-[10px] rounded-full font-bold bg-[#FEE2E2] text-[#991B1B] tracking-wide whitespace-nowrap"
                          >
                            {stat === "MENTOR"
                              ? "MENTOR KOSONG"
                              : "LINK KOSONG"}
                          </span>
                        ))
                      ) : (
                        <span className="inline-flex px-3 py-1 text-[10px] rounded-full font-bold border border-[#148F89] text-[#148F89] whitespace-nowrap">
                          LENGKAP
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-3">
                      {item.needsAction ? (
                        <CloudUpload
                          size={17}
                          className="text-[#148F89] cursor-pointer"
                        />
                      ) : (
                        <Cloud
                          size={17}
                          className="text-[#94A3B8] cursor-pointer"
                        />
                      )}
                      <Trash2
                        size={17}
                        className="text-[#DC2626] cursor-pointer hover:text-[#991B1B] transition-colors"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button
        className="w-full bg-white border border-dashed border-[#CBD5E1] shadow-sm rounded-[12px] flex items-center justify-center gap-2 text-[#475569] font-bold hover:bg-[#F8FAFC] hover:border-[#148F89] transition-colors"
        style={{ height: "56px" }}
      >
        <Plus size={18} />
        Tambah Sesi Baru
      </button>

      <div className="flex justify-end">
        <button className="bg-[#148F89] text-white font-bold text-[13px] px-6 py-3 rounded-[8px] shadow-sm hover:bg-[#117A75] transition-colors">
          Simpan Perubahan
        </button>
      </div>
    </DashboardLayout>
  );
}
