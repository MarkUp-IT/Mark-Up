"use client";

import {
  Bell,
  Settings,
  Search,
  ChevronDown,
  Send,
  CloudUpload,
  Cloud,
  Trash2,
  Plus,
} from "lucide-react";
import Sidebar from "@/component/admin/Sidebar";

export default function BootcampDetail() {
  const sessions = [
    {
      sesi: "01",
      judul: "Fondasi Business Plan",
      mentor: "Mulyy",
      date: "07 June 2026",
      time: "19:00 WIB",
      link: "https://zoom.us/j/987...",
      status: ["NOT ACTIONS REQUIRED"],
    },
    {
      sesi: "02",
      judul: "Fondasi Business Plan",
      mentor: "Prabyy",
      date: "14 June 2026",
      time: "19:00 WIB",
      link: "https://zoom.us/j/987...",
      status: ["NOT ACTIONS REQUIRED"],
    },
    {
      sesi: "03",
      judul: "Model Bisnis & Monetisasi",
      mentor: "",
      date: "21 June 2026",
      time: "15:00 WIB",
      link: "",
      status: ["MENTOR", "LINK"],
    },
    {
      sesi: "04",
      judul: "Strategi Pemasaran",
      mentor: "",
      date: "28 June 2026",
      time: "14:00 WIB",
      link: "https://zoom.us/j/987...",
      status: ["MENTOR"],
    },
    {
      sesi: "05",
      judul: "Strategi Pemasaran",
      mentor: "",
      date: "05 July 2026",
      time: "14:00 WIB",
      link: "",
      status: ["MENTOR", "LINK"],
    },
  ];

  return (
    <div className="w-full font-inter text-black bg-[#F8FAFC] min-h-screen relative flex flex-row overflow-x-hidden">
      <Sidebar />
      <div className="flex-1 flex items-center ml-[288px] py-5 flex-col gap-5 px-10 bg-white min-h-screen pb-24">
        {/* Header */}
        <div className="w-[1158px] h-[72px] bg-[#E2E8F0] flex flex-row items-center justify-center gap-15 rounded-[8px]">
          <div className="flex gap-20 items-center">
            <p className="text-black font-bold text-[20.25px]">
              Manajemen Konten
            </p>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search bootcamp tittle..."
                className="bg-white w-[511px] h-[36px] rounded-[6.75px] pl-10 border-none outline-none focus:ring-2 focus:ring-[#4C1D95]/20"
              />
            </div>
          </div>

          <div className="flex flex-row gap-4 items-center">
            <Bell
              color="#64748B"
              className="cursor-pointer hover:text-black transition-colors"
            />
            <Settings
              color="#64748B"
              className="cursor-pointer hover:text-black transition-colors"
            />
          </div>

          <div className="flex flex-row gap-4 items-center">
            <div className="flex flex-col text-right">
              <p className="font-semibold text-[14.62px]">Affan Fathir D.</p>
              <p className="text-[12.37px] text-[#64748B]">Associate IT</p>
            </div>
            <div className="bg-[#2B3034] w-[36px] h-[36px] rounded-[13.5px] flex items-center justify-center overflow-hidden">
              <img
                src="https://api.dicebear.com/7.x/notionists/svg?seed=Affan&backgroundColor=2B3034"
                alt="avatar"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Title Area */}
        <div className="flex flex-col w-[1158px] mt-2 gap-1">
          <p className="font-bold text-[25px]">
            Bootcamp Business Plan - Batch 4
          </p>
        </div>

        {/* Detailed Table */}
        <div className="w-[1158px] flex flex-col gap-4 mt-2">
          <table className="w-full text-[13px] border-collapse">
            <thead className="bg-[#F8FAFC]">
              <tr>
                <th className="py-4 text-center font-bold text-[#1E293B] text-[12px] w-[60px]">
                  SESI
                </th>
                <th className="py-4 text-left font-bold text-[#1E293B] text-[12px] w-[220px]">
                  JUDUL SESI
                </th>
                <th className="py-4 text-left font-bold text-[#1E293B] text-[12px] w-[200px]">
                  NAMA MENTOR
                </th>
                <th className="py-4 text-center font-bold text-[#1E293B] text-[12px] w-[180px]">
                  JADWAL SESI
                </th>
                <th className="py-4 text-center font-bold text-[#1E293B] text-[12px] w-[250px]">
                  LINK ZOOM
                </th>
                <th className="py-4 text-center font-bold text-[#1E293B] text-[12px] w-[150px]">
                  STATUS
                </th>
                <th className="py-4 text-center font-bold text-[#1E293B] text-[12px] w-[100px]">
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {sessions.map((item, index) => (
                <tr key={index} className="h-[70px]">
                  <td className="text-center text-[#64748B] font-medium">
                    {item.sesi}
                  </td>
                  <td className="text-left text-[#1E293B] font-medium pr-4">
                    {item.judul}
                  </td>

                  {/* Mentor Selection */}
                  <td className="text-left pr-4">
                    <div className="relative w-full">
                      <select
                        defaultValue={item.mentor || ""}
                        className="w-full h-[36px] bg-[#F1F5F9] border-none rounded-[6px] px-3 text-[13px] font-medium text-[#475569] appearance-none outline-none focus:ring-1 focus:ring-[#4C1D95]"
                      >
                        <option value="" disabled>
                          -- Pilih Nama Mentor --
                        </option>
                        <option value="Mulyy">Mulyy</option>
                        <option value="Prabyy">Prabyy</option>
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none"
                      />
                    </div>
                  </td>

                  {/* Date & Time */}
                  <td className="text-center">
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-[#1E293B] font-bold text-[12px]">
                        {item.date}
                      </p>
                      <p className="text-[#64748B] text-[11px]">{item.time}</p>
                    </div>
                  </td>

                  {/* Zoom Link Input */}
                  <td className="text-center">
                    <div className="flex flex-row items-center justify-center gap-2">
                      <input
                        type="text"
                        placeholder="Masukan link zoom..."
                        defaultValue={item.link}
                        className="w-[160px] h-[36px] bg-[#F1F5F9] rounded-[6px] px-3 text-[12px] outline-none border-none text-[#64748B] focus:bg-white focus:border focus:border-[#4C1D95] transition-all"
                      />
                      <button
                        className={`w-[36px] h-[36px] rounded-[6px] flex items-center justify-center transition-colors ${
                          item.status.includes("NOT ACTIONS REQUIRED")
                            ? "bg-[#F1F5F9] text-[#94A3B8]"
                            : "bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                        }`}
                      >
                        <Send
                          size={16}
                          className={
                            item.status.includes("NOT ACTIONS REQUIRED")
                              ? "opacity-50"
                              : ""
                          }
                        />
                      </button>
                    </div>
                  </td>

                  {/* Status Badges */}
                  <td className="text-center">
                    <div className="flex flex-col gap-1 items-center justify-center">
                      {item.status.map((stat, i) => {
                        if (stat === "NOT ACTIONS REQUIRED") {
                          return (
                            <span
                              key={i}
                              className="inline-flex items-center justify-center px-3 py-1 text-[10px] rounded-[20px] font-bold border border-[#4C1D95] text-[#4C1D95]"
                            >
                              {stat}
                            </span>
                          );
                        } else {
                          return (
                            <span
                              key={i}
                              className="inline-flex items-center justify-center px-4 py-1 text-[10px] rounded-[20px] font-bold bg-[#F0564A] text-white tracking-widest"
                            >
                              {stat}
                            </span>
                          );
                        }
                      })}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="text-center">
                    <div className="flex flex-row items-center justify-center gap-3">
                      {item.status.includes("NOT ACTIONS REQUIRED") ? (
                        <Cloud
                          size={18}
                          className="text-[#3B82F6] cursor-pointer"
                        />
                      ) : (
                        <CloudUpload
                          size={18}
                          className="text-[#3B82F6] cursor-pointer"
                        />
                      )}
                      <Trash2
                        size={18}
                        className="text-[#E11D48] cursor-pointer hover:text-[#9F1239]"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Tambah Sesi Full Width Button */}
          <button className="w-full mt-2 h-[50px] bg-white border border-[#E2E8F0] shadow-sm rounded-[8px] flex items-center justify-center gap-2 text-[#1E293B] font-bold hover:bg-[#F8FAFC] transition-colors">
            <Plus size={20} />
            Tambah Sesi
          </button>
        </div>
      </div>

      {/* Floating Action Button "Send Changes" */}
      <div className="fixed bottom-8 left-[310px] z-20">
        <button className="bg-[#2563EB] text-white font-bold text-[12px] px-6 py-2.5 rounded-[20px] shadow-lg hover:bg-[#1D4ED8] transition-colors tracking-wide">
          SEND CHANGES
        </button>
      </div>
    </div>
  );
}
