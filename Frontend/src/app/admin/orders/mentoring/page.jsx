"use client";

import { Bell, Settings, Search, ChevronDown, Send } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import Sidebar from "@/component/admin/Sidebar";
import Header from "@/component/admin/Header";

export default function Mentoring() {
  const sessions = [
    {
      id_order: "#BO001",
      nama_user: "Diganti Nama User",
      nama_mentor: "Mentor Terpintar",
      date: "24 Oct 2023",
      time: "15:00 - 16:00 WIB",
      link_zoom: "",
      status: "Pending",
    },
    {
      id_order: "#ME003",
      nama_user: "#187231000",
      nama_mentor: "Mentor Terbaik",
      date: "24 Oct 2023",
      time: "14:00 - 15:00 WIB",
      link_zoom: "zoom.us/j/827361928",
      status: "Distributed",
    },
    {
      id_order: "#MO001",
      nama_user: "#132181169",
      nama_mentor: "Mentor Hebat",
      date: "25 Oct 2026",
      time: "14:00 - 15:00 WIB",
      link_zoom: "zoom.us/j/827361928",
      status: "Distributed",
    },
    {
      id_order: "#BO003",
      nama_user: "#102181769",
      nama_mentor: "Mentornya Mentor",
      date: "25 Oct 2026",
      time: "14:00 - 15:00 WIB",
      link_zoom: "zoom.us/j/827361928",
      status: "Distributed",
    },
  ];

  const [sessionStatus, setSessionStatus] = useState("All");

  return (
    <div className="w-full font-inter text-black bg-[#F8FAFC] min-h-screen relative flex flex-row overflow-x-hidden">
      <Sidebar />
      <div className="ml-[288px]">
        <Header judulHalaman="Order Management > Mentoring" />
        <div className="flex-1 flex items-center py-5 flex-col gap-5 px-10 bg-white">
          {/* Header */}

          {/* Title Area */}
          <div className="flex flex-col w-[1158px] mt-2 gap-1">
            <p className="font-bold text-[25px]">Mentoring</p>
            <p className="text-[#64748B] text-[15px]">
              Sistem pemantauan distribusi link Zoom dan status pemenuhan sesi
              mentoring 1-on-1
            </p>
          </div>

          {/* Stats Cards */}
          <div className="w-[1158px] flex justify-between gap-5 mt-2">
            <div className="bg-[#F8FAFC] flex-1 h-[140px] rounded-[9px] flex flex-col justify-center px-7 shadow-sm border border-[#E2E8F0]">
              <p className="text-[#43474D] font-bold text-[14px] tracking-wide">
                TOTAL SESSIONS
              </p>
              <div className="flex flex-row items-baseline gap-2 mt-2">
                <p className="font-bold text-[48px] text-[#0F172A] leading-none">
                  15
                </p>
                <span className="text-[#64748B] text-[16px] font-medium">
                  sessions
                </span>
              </div>
            </div>
            <div className="bg-[#F8FAFC] flex-1 h-[140px] rounded-[9px] flex flex-col justify-center px-7 shadow-sm border border-[#E2E8F0]">
              <p className="text-[#43474D] font-bold text-[14px] tracking-wide">
                DISTRIBUTED LINKS
              </p>
              <div className="flex flex-row items-baseline gap-2 mt-2">
                <p className="font-bold text-[48px] text-[#0F172A] leading-none">
                  90%
                </p>
                <span className="text-[#64748B] text-[16px] font-medium">
                  sessions
                </span>
              </div>
            </div>
            <div className="bg-[#F0564A] flex-1 h-[140px] rounded-[9px] flex flex-col justify-center px-7 shadow-sm">
              <p className="text-white font-bold text-[14px] tracking-wide">
                PENDING LINKS
              </p>
              <div className="flex flex-row items-baseline gap-2 mt-2">
                <p className="font-bold text-[48px] text-white leading-none">
                  3
                </p>
                <span className="text-white text-[16px] font-medium">
                  sessions
                </span>
              </div>
            </div>
          </div>

          {/* Filters & Action */}
          <div className="w-[1158px] flex justify-between items-end mt-4">
            <div className="bg-[#F8FAFC] p-4 rounded-[8px] flex flex-row gap-6 border border-[#E2E8F0] shadow-sm">
              {/* Filter by Date */}
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-bold text-[#64748B]">
                  FILTER BY DATE
                </p>
                <input
                  type="date"
                  className="h-[36px] px-3 border border-[#CBD5E1] rounded-[6px] text-[13px] text-[#475569] outline-none focus:border-[#2563EB]"
                />
              </div>

              {/* Mentor / Speaker */}
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-bold text-[#64748B]">
                  MENTOR / SPEAKER
                </p>
                <div className="relative">
                  <select className="h-[36px] w-[180px] px-3 pr-8 border border-[#CBD5E1] rounded-[6px] text-[13px] text-[#475569] appearance-none outline-none focus:border-[#2563EB]">
                    <option>All Mentor</option>
                    <option>Mentor Terpintar</option>
                    <option>Mentor Terbaik</option>
                    <option>Mentor Hebat</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none"
                  />
                </div>
              </div>

              {/* Session Status */}
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-bold text-[#64748B]">
                  SESSION STATUS
                </p>
                <div className="flex bg-white border border-[#CBD5E1] rounded-[6px] p-1 h-[36px]">
                  <button
                    onClick={() => setSessionStatus("All")}
                    className={`px-4 text-[12px] font-medium rounded-[4px] transition-colors ${
                      sessionStatus === "All"
                        ? "bg-[#2563EB] text-white"
                        : "text-[#64748B] hover:bg-[#F1F5F9]"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSessionStatus("Distributed")}
                    className={`px-4 text-[12px] font-medium rounded-[4px] transition-colors ${
                      sessionStatus === "Distributed"
                        ? "bg-[#2563EB] text-white"
                        : "text-[#64748B] hover:bg-[#F1F5F9]"
                    }`}
                  >
                    Distributed
                  </button>
                  <button
                    onClick={() => setSessionStatus("Pending")}
                    className={`px-4 text-[12px] font-medium rounded-[4px] transition-colors ${
                      sessionStatus === "Pending"
                        ? "bg-[#2563EB] text-white"
                        : "text-[#64748B] hover:bg-[#F1F5F9]"
                    }`}
                  >
                    Pending
                  </button>
                </div>
              </div>
            </div>

            <Link
              href="#"
              className="text-[#2563EB] font-bold text-[14.62px] cursor-pointer hover:underline mb-2"
            >
              View All Mentoring
            </Link>
          </div>

          {/* Table Area */}
          <div className="w-[1158px] rounded-[8px] overflow-hidden mt-4 border border-[#E2E8F0] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                      ID ORDER
                    </th>
                    <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                      NAMA USER
                    </th>
                    <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                      NAMA MENTOR
                    </th>
                    <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                      JADWAL SESI
                    </th>
                    <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                      LINK ZOOM
                    </th>
                    <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                      ACTION
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] bg-white">
                  {sessions.map((item, index) => (
                    <tr
                      key={index}
                      className="hover:bg-[#F8FAFC] transition-colors h-[80px]"
                    >
                      <td className="px-6 text-center text-[#64748B] font-medium">
                        {item.id_order}
                      </td>
                      <td className="px-6 text-center text-[#1E293B] font-semibold">
                        {item.nama_user}
                      </td>
                      <td className="px-6 text-center text-[#475569] font-medium">
                        {item.nama_mentor}
                      </td>
                      <td className="px-6 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <p className="text-[#1E293B] font-bold text-[13px]">
                            {item.date}
                          </p>
                          <p className="text-[#64748B] text-[11px]">
                            {item.time}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 text-center">
                        <div className="flex flex-row items-center justify-center gap-2">
                          <input
                            type="text"
                            placeholder="Masukan link zoom..."
                            defaultValue={item.link_zoom}
                            readOnly={item.status === "Distributed"}
                            className={`w-[180px] h-[36px] rounded-[6px] px-3 text-[12px] outline-none border border-[#E2E8F0] ${
                              item.status === "Distributed"
                                ? "bg-[#F1F5F9] text-[#64748B]"
                                : "bg-white text-[#1E293B] focus:border-[#2563EB]"
                            }`}
                          />
                          <button
                            className={`w-[36px] h-[36px] rounded-[6px] flex items-center justify-center transition-colors ${
                              item.status === "Pending"
                                ? "bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                                : "bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed"
                            }`}
                          >
                            <Send
                              size={16}
                              className={
                                item.status === "Pending" ? "" : "opacity-50"
                              }
                            />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 text-center">
                        <button
                          className={`px-6 py-2 rounded-[20px] font-bold text-[12px] transition-colors ${
                            item.status === "Distributed"
                              ? "bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-sm"
                              : "bg-[#F1F5F9] text-[#1E293B] hover:bg-[#E2E8F0]"
                          }`}
                        >
                          JOIN ZOOM
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center mt-6 mb-10 gap-2 text-[#64748B] text-[14px]">
            <span className="w-8 h-8 flex items-center justify-center bg-white border border-[#2563EB] text-[#2563EB] font-bold rounded-[6px] cursor-pointer hover:bg-[#EFF6FF] shadow-sm">
              1
            </span>
            <span className="w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded-[6px] font-medium">
              2
            </span>
            <span className="w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded-[6px] font-medium">
              3
            </span>
            <span className="font-medium tracking-widest">...</span>
            <span className="w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded-[6px] font-medium">
              12
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
