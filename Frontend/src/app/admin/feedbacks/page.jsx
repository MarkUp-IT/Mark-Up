"use client";

import { Eye, ChevronDown } from "lucide-react";
import Sidebar from "@/component/admin/Sidebar";
import Header from "@/component/admin/Header";
import { useState } from "react";

export default function Feedbacks() {
  const [selectAll, setSelectAll] = useState(false);

  const feedbacks = [
    {
      id: 1,
      name: "Anisa Rahmawati",
      email: "anisa.rahma@axiom.pro",
      avatar: "https://i.pravatar.cc/150?img=5",
      ulasan:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
      date: "12 Jan 2024",
    },
    {
      id: 2,
      name: "Anisa Rahmawati",
      email: "anisa.rahma@axiom.pro",
      avatar: "https://i.pravatar.cc/150?img=5",
      ulasan:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
      date: "12 Jan 2024",
    },
    {
      id: 3,
      name: "Anisa Rahmawati",
      email: "anisa.rahma@axiom.pro",
      avatar: "https://i.pravatar.cc/150?img=5",
      ulasan:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
      date: "12 Jan 2024",
    },
  ];

  return (
    <div className="w-full font-inter text-black bg-[#F8FAFC] min-h-screen relative flex flex-row overflow-x-hidden">
      <Sidebar />
      <div className="ml-[288px] flex-1">
        <Header judulHalaman="Feedbacks" />
        <div className="flex-1 flex items-center py-5 flex-col gap-5 px-10 bg-white min-h-screen">
          {/* Title Area */}
          <div className="flex flex-row items-center justify-between w-[1158px] mt-2">
            <div>
              <p className="font-bold text-[25px]">Feedbacks</p>
              <p className="text-[#43474D] text-[15px] mt-1">
                Kelola ulasan yang tampil pada platform MARK-UP.
              </p>
            </div>
          </div>

          {/* Stats Cards Section */}
          <div className="w-[1158px] flex justify-between gap-5 mt-2">
            <div className="bg-[#F8FAFC] flex-1 h-[140px] rounded-[9px] flex flex-col justify-center px-7 shadow-sm border border-[#E2E8F0]">
              <p className="text-[#43474D] font-bold text-[14px] tracking-wide uppercase">
                TOTAL ULASAN
              </p>
              <div className="flex flex-row items-baseline gap-2 mt-2">
                <p className="font-bold text-[44px] text-[#0F172A] leading-none">
                  151
                </p>
                <span className="text-[#64748B] text-[15px] font-medium lowercase">
                  ulasan
                </span>
              </div>
            </div>

            <div className="bg-[#2E1065] flex-1 h-[140px] rounded-[9px] flex flex-col justify-center px-7 shadow-sm">
              <p className="text-white/80 font-bold text-[14px] tracking-wide uppercase">
                ULASAN TERLIHAT
              </p>
              <div className="flex flex-row items-baseline gap-2 mt-2">
                <p className="font-bold text-[44px] text-white leading-none">
                  101
                </p>
                <span className="text-white/90 text-[15px] font-medium lowercase">
                  ulasan
                </span>
              </div>
            </div>

            <div className="bg-[#8B5CF6] flex-1 h-[140px] rounded-[9px] flex flex-col justify-center px-7 shadow-sm">
              <p className="text-white/90 font-bold text-[14px] tracking-wide uppercase">
                ULASAN DISEMBUNYIKAN
              </p>
              <div className="flex flex-row items-baseline gap-2 mt-2">
                <p className="font-bold text-[44px] text-white leading-none">
                  50
                </p>
                <span className="text-white/90 text-[15px] font-medium lowercase">
                  ulasan
                </span>
              </div>
            </div>
          </div>

          {/* Table Area */}
          <div className="w-[1158px] rounded-[8px] overflow-hidden mt-4 border border-[#E2E8F0] shadow-sm bg-white">
            {/* Table Toolbar */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={() => setSelectAll(!selectAll)}
                  className="w-4 h-4 rounded border-[#CBD5E1] text-[#2E1065] focus:ring-[#2E1065] cursor-pointer"
                />
                <span className="text-[13px] font-semibold text-[#43474D]">
                  Pilih Semua
                </span>
              </div>
              <div className="flex items-center gap-2 text-[13px]">
                <span className="text-[#64748B]">Filter by Role:</span>
                <div className="flex items-center gap-1 font-semibold text-[#1E293B] cursor-pointer hover:bg-[#F8FAFC] px-2 py-1 rounded-[4px] transition-colors">
                  All Roles
                  <ChevronDown size={14} className="text-[#64748B]" />
                </div>
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] text-left">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-6 py-4 w-[50px]"></th>
                    <th className="px-6 py-4 font-bold text-[#43474D] text-[12px] tracking-wider uppercase w-[250px]">
                      USER PROFILE
                    </th>
                    <th className="px-6 py-4 font-bold text-[#43474D] text-[12px] tracking-wider uppercase">
                      ULASAN
                    </th>
                    <th className="px-6 py-4 font-bold text-[#43474D] text-[12px] tracking-wider uppercase w-[120px] text-center">
                      DATE
                    </th>
                    <th className="px-6 py-4 font-bold text-[#43474D] text-[12px] tracking-wider uppercase w-[100px] text-center">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {feedbacks.map((item, index) => (
                    <tr
                      key={index}
                      className="hover:bg-[#F8FAFC] transition-colors"
                    >
                      <td className="px-6 py-5 align-top">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          readOnly
                          className="w-4 h-4 rounded border-[#CBD5E1] text-[#2E1065] focus:ring-[#2E1065] cursor-pointer mt-1"
                        />
                      </td>
                      <td className="px-6 py-5 align-top">
                        <div className="flex items-start gap-3">
                          <img
                            src={item.avatar}
                            alt={item.name}
                            className="w-10 h-10 rounded-full object-cover border border-[#E2E8F0]"
                          />
                          <div className="flex flex-col">
                            <span className="font-bold text-[#1E293B] text-[14px]">
                              {item.name}
                            </span>
                            <span className="text-[#64748B] text-[12px]">
                              {item.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top text-[#475569] text-[13px] leading-relaxed pr-10">
                        {item.ulasan}
                      </td>
                      <td className="px-6 py-5 align-top text-center text-[#1E293B] font-semibold text-[13px] whitespace-nowrap">
                        {item.date}
                      </td>
                      <td className="px-6 py-5 align-top text-center">
                        <button className="text-[#94A3B8] hover:text-[#2E1065] transition-colors p-2 rounded-full hover:bg-[#F3E8FF] mt-[-4px]">
                          <Eye size={18} />
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
            <span className="w-8 h-8 flex items-center justify-center bg-white border border-[#2E1065] text-[#2E1065] font-bold rounded-[6px] cursor-pointer hover:bg-[#F3E8FF] shadow-sm">
              1
            </span>
            <span className="w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded-[6px] font-medium">
              2
            </span>
            <span className="w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded-[6px] font-medium">
              3
            </span>
            <span className="font-medium tracking-widest px-1">...</span>
            <span className="w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded-[6px] font-medium">
              12
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
