"use client";

import { Eye, Pencil, ExternalLink, EyeOff } from "lucide-react";
import Link from "next/link";
import Sidebar from "@/component/admin/Sidebar";
import Header from "@/component/admin/Header";

export default function ModuleManagement() {
  const modules = [
    {
      id: "#ME003",
      title: "101 Career Mentoring",
      price: "Rp110.000",
      status: "ACTIVE",
      date: "22/05/2024 at 14:54",
      sold: 12,
      actionStatus: "viewed",
    },
    {
      id: "#BO003",
      title: "Bundling PowerPack (Newbie Friendly)",
      price: "Rp110.000",
      status: "ACTIVE",
      date: "22/05/2024 at 14:54",
      sold: 10,
      actionStatus: "viewed",
    },
    {
      id: "#BO001",
      title: "Essential Sprint Registration",
      price: "Rp110.000",
      status: "DEACTIVE",
      date: "22/05/2024 at 14:54",
      sold: 5,
      actionStatus: "hidden",
    },
    {
      id: "#MO001",
      title: "Full-Throttle Coaching",
      price: "Rp110.000",
      status: "DEACTIVE",
      date: "22/05/2024 at 14:54",
      sold: 8,
      actionStatus: "hidden",
    },
    {
      id: "#MO001",
      title: "Full-Throttle Coaching",
      price: "Rp110.000",
      status: "DEACTIVE",
      date: "22/05/2024 at 14:54",
      sold: 0,
      actionStatus: "hidden",
      isNew: true,
    },
  ];

  return (
    <div className="w-full font-inter text-black bg-[#F8FAFC] min-h-screen relative flex flex-row overflow-x-hidden">
      <Sidebar />
      <div className="ml-[288px]">
        <Header judulHalaman="Manajemen Konten" />
        <div className="flex-1 flex items-center py-5 flex-col gap-5 px-10 bg-white">
          {/* Title Area */}
          <div className="flex flex-col w-[1158px] mt-2 gap-1">
            <p className="font-bold text-[25px]">Manajemen Konten Modul</p>
            <p className="text-[#64748B] text-[15px]">
              Kelola modul, bab, dan materi bacaan
            </p>
          </div>

          {/* Stats Cards */}
          <div className="w-[1158px] flex justify-between gap-5 mt-2">
            <div className="bg-[#F8FAFC] flex-1 h-[140px] rounded-[9px] flex flex-col justify-center px-7 shadow-sm border border-[#E2E8F0]">
              <p className="text-[#43474D] font-bold text-[14px] tracking-wide">
                ALL
              </p>
              <div className="flex flex-row items-baseline gap-2 mt-2">
                <p className="font-bold text-[48px] text-[#0F172A] leading-none">
                  151
                </p>
                <span className="text-[#64748B] text-[16px] font-medium">
                  modul
                </span>
              </div>
            </div>
            <div className="bg-[#2563EB] flex-1 h-[140px] rounded-[9px] flex flex-col justify-center px-7 shadow-sm">
              <p className="text-white font-bold text-[14px] tracking-wide">
                ACTIVE
              </p>
              <div className="flex flex-row items-baseline gap-2 mt-2">
                <p className="font-bold text-[48px] text-white leading-none">
                  8
                </p>
                <span className="text-white text-[16px] font-medium">
                  modul
                </span>
              </div>
            </div>
            <div className="bg-[#F0564A] flex-1 h-[140px] rounded-[9px] flex flex-col justify-center px-7 shadow-sm">
              <p className="text-white font-bold text-[14px] tracking-wide">
                DEACTIVE
              </p>
              <div className="flex flex-row items-baseline gap-2 mt-2">
                <p className="font-bold text-[48px] text-white leading-none">
                  3
                </p>
                <span className="text-white text-[16px] font-medium">
                  modul
                </span>
              </div>
            </div>
          </div>

          {/* Table Area */}
          <div className="w-[1158px] rounded-[8px] overflow-hidden mt-4 border border-[#E2E8F0] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                      PRODUCT ID
                    </th>
                    <th className="px-6 py-4 text-left font-bold text-[#43474D] tracking-wider text-[12px]">
                      MODUL TITLE
                    </th>
                    <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                      PRICE
                    </th>
                    <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                      STATUS
                    </th>
                    <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                      SOLD
                    </th>
                    <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                      ACTIONS
                    </th>
                    <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                      MANAGE CONTENT
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] bg-white">
                  {modules.map((item, index) => (
                    <tr
                      key={index}
                      className="hover:bg-[#F8FAFC] transition-colors h-[80px]"
                    >
                      <td className="px-6 text-center text-[#64748B] font-medium">
                        {item.id}
                      </td>
                      <td className="px-6 text-left text-[#1E293B] font-semibold max-w-[250px]">
                        {item.title}
                      </td>
                      <td className="px-6 text-center text-[#475569] font-medium">
                        {item.price}
                      </td>
                      <td className="px-6 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <span
                            className={`px-3 py-1 rounded-[4px] font-bold text-[11px] ${
                              item.status === "ACTIVE"
                                ? "bg-[#DCFCE7] text-[#15803D]"
                                : "bg-[#FEE2E2] text-[#B91C1C]"
                            }`}
                          >
                            {item.status}
                          </span>
                          <span className="text-[#64748B] text-[10px] mt-1 italic">
                            {item.date}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 text-center text-[#475569] font-medium">
                        {item.sold}
                      </td>
                      <td className="px-6 text-center">
                        <div className="flex flex-row items-center justify-center gap-3 text-[#94A3B8]">
                          <button className="hover:text-[#2563EB] transition-colors">
                            {item.actionStatus === "viewed" ? (
                              <Eye size={16} />
                            ) : (
                              <EyeOff size={16} />
                            )}
                          </button>
                          <button className="hover:text-[#2563EB] transition-colors">
                            <Pencil size={16} />
                          </button>
                          <button className="hover:text-[#2563EB] transition-colors">
                            <ExternalLink size={16} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 text-center">
                        {item.isNew ? (
                          <button className="px-6 py-2 rounded-[6px] font-bold text-[12px] bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-colors shadow-sm">
                            UPLOAD MODUL
                          </button>
                        ) : (
                          <button className="px-6 py-2 rounded-[6px] font-bold text-[12px] bg-[#F1F5F9] text-[#1E293B] border border-[#E2E8F0] hover:bg-[#E2E8F0] transition-colors">
                            EDIT
                          </button>
                        )}
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
