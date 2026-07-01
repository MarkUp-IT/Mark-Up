"use client";

import {
  Calendar,
  Download,
  TrendingUp,
  Bell,
  Settings,
  LayoutDashboard,
  Package,
  ListPlus,
  Trophy,
  ReceiptText,
  MessageSquare,
  History,
  Presentation,
  Users,
  FileText,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState } from "react";
import Sidebar from "@/component/admin/Sidebar";
import Header from "@/component/admin/Header";

export default function AdminDashboard() {
  const data = [
    { day: "29/03", revenue: 400 },
    { day: "30/03", revenue: 300 },
    { day: "31/03", revenue: 600 },
    { day: "01/04", revenue: 500 },
    { day: "02/04", revenue: 300 },
    { day: "03/04", revenue: 500 },
  ];

  const logs = [
    {
      log_id: "#A001",
      username: "Nicco C. P.",
      role: "CIO",
      action: "Add Product #B0001",
      target_entity: "Products/Bootcamp",
      timestamp: "Oct 24, 2026 · 14:22",
      status: "PUBLISHED",
    },
    {
      log_id: "#U011",
      username: "Faisal A.",
      role: "Associate IT",
      action: "Edit Product #ME003",
      target_entity: "Products/Mentoring",
      timestamp: "Oct 24, 2026 · 11:05",
      status: "SCHEDULED",
    },
    {
      log_id: "#A101",
      username: "Muhammad A.",
      role: "Associate IT",
      action: "Add Competition #W001",
      target_entity: "Competition/UI_UX",
      timestamp: "Oct 23, 2026 · 09:25",
      status: "PUBLISHED",
    },
    {
      log_id: "#R121",
      username: "Affan F. D.",
      role: "Associate IT",
      action: "Remove Competition #H005",
      target_entity: "Competition/Hackathon",
      timestamp: "Oct 23, 2026 · 04:28",
      status: "REMOVED",
    },
  ];

  const [isActive, setIsActive] = useState("all");

  return (
    <div className="w-full font-inter text-black bg-[#F8FAFC] min-h-screen relative flex flex-row">
      <Sidebar />

      <div className="ml-[288px] flex-1 flex flex-col">
        <Header judulHalaman="Dashboard" />

        <div className="flex-1 flex items-center py-5 flex-col gap-5 px-10 bg-white">
          {/* Title & Filters */}
          <div className="flex flex-row items-end justify-between w-[1158px] mt-2">
            <div className="flex flex-col gap-1">
              <p className="font-bold text-[25px]">Dashboard Overview</p>
              <p className="text-[#43474D] text-[15px]">
                Real-time performance metrics for MARK-UP products
              </p>
            </div>

            <div className="flex flex-row gap-4 items-center">
              <div className="h-[43.5px] bg-[#F0F4F8] px-2 rounded-[6px] flex justify-center items-center gap-1 shadow-sm shrink-0">
                {["all", "day", "week", "month"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setIsActive(tab)}
                    className={`px-4 py-1.5 rounded-[4px] font-medium text-[13px] transition-all capitalize ${
                      isActive === tab
                        ? "bg-white text-black shadow-sm"
                        : "text-[#43474D] hover:bg-[#E2E8F0]"
                    }`}
                  >
                    {tab === "all" ? "All Time" : tab}
                  </button>
                ))}
                <div className="relative flex items-center">
                  <button
                    onClick={() => setIsActive("custom")}
                    className={`px-4 py-1.5 pr-8 rounded-[4px] font-medium text-[13px] transition-all ${
                      isActive === "custom"
                        ? "bg-white text-black shadow-sm"
                        : "text-[#43474D] hover:bg-[#E2E8F0]"
                    }`}
                  >
                    Custom
                  </button>
                  <Calendar
                    className={`absolute right-3 pointer-events-none ${
                      isActive === "custom" ? "text-black" : "text-[#43474D]"
                    }`}
                    size={14}
                  />
                </div>
              </div>

              <div className="relative">
                <Download
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white pointer-events-none"
                  size={16}
                />
                <button className="bg-[#2563EB] h-[43.5px] text-[13px] text-white font-semibold pl-10 pr-6 rounded-[6.75px] hover:bg-[#2563EB]/80 transition-colors shadow-sm">
                  Export to PDF
                </button>
              </div>
            </div>
          </div>

          <div className="w-[1158px] grid grid-cols-3 gap-5 mt-4">
            <div className="bg-[#FDFFE7] h-[140px] rounded-[9px] flex flex-col justify-center px-7 shadow-sm border border-[#E2E8F0]/50">
              <p className="text-[#43474D] font-bold text-[14px] tracking-wide">
                PRIVATE MENTORING SALES
              </p>
              <div className="flex flex-row items-baseline gap-2 mt-2">
                <p className="font-bold text-[40px] text-black leading-none">
                  19
                </p>
                <span className="text-[#43474D] text-[15px] font-medium">
                  units
                </span>
              </div>
            </div>
            <div className="bg-[#E7FFFC] h-[140px] rounded-[9px] flex flex-col justify-center px-7 shadow-sm border border-[#E2E8F0]/50">
              <p className="text-[#43474D] font-bold text-[14px] tracking-wide">
                INTENSIVE BOOTCAMP SALES
              </p>
              <div className="flex flex-row items-baseline gap-2 mt-2">
                <p className="font-bold text-[40px] text-black leading-none">
                  1
                </p>
                <span className="text-[#43474D] text-[15px] font-medium">
                  units
                </span>
              </div>
            </div>
            <div className="bg-[#FFE7FD] h-[140px] rounded-[9px] flex flex-col justify-center px-7 shadow-sm border border-[#E2E8F0]/50">
              <p className="text-[#43474D] font-bold text-[14px] tracking-wide">
                E-LEARNING & MODUL SALES
              </p>
              <div className="flex flex-row items-baseline gap-2 mt-2">
                <p className="font-bold text-[40px] text-black leading-none">
                  23
                </p>
                <span className="text-[#43474D] text-[15px] font-medium">
                  units
                </span>
              </div>
            </div>
            <div className="col-span-2 row-span-2 bg-white border border-[#E2E8F0] shadow-sm rounded-[9px] p-6 flex flex-col">
              <div className="flex flex-col mb-4">
                <div className="flex flex-row w-full justify-between items-center">
                  <p className="text-[13px] font-bold text-[#64748B] tracking-wider">
                    TOTAL REVENUE
                  </p>
                  <div className="flex flex-row w-[100px] h-[30px] rounded-[13.5px] bg-[#EFF6FF] items-center justify-center gap-1 border border-[#BFDBFE]">
                    <TrendingUp className="text-[#2563EB]" size={16} />
                    <p className="font-bold text-[#2563EB] text-[13px]">
                      +12.5%
                    </p>
                  </div>
                </div>
                <p className="font-bold text-[36px] text-[#1E293B] mt-1">
                  Rp284,912.00
                </p>
              </div>
              <div className="flex-1 min-h-0 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data}
                    barCategoryGap={30}
                    margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748B", fontSize: 12, fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ fill: "#F8FAFC" }}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                      {data.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            index === data.length - 1 ? "#2563EB" : "#DBEAFE"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
              <div className="bg-[#F0FDF4] flex-1 rounded-[9px] flex flex-col justify-center px-7 shadow-sm border border-[#DCFCE7] min-h-[150px]">
                <p className="text-[#166534] font-bold text-[14px] tracking-wide">
                  TODAY SALES
                </p>
                <div className="flex flex-row items-baseline gap-2 mt-2">
                  <p className="font-bold text-[44px] text-[#15803D] leading-none">
                    43
                  </p>
                  <span className="text-[#166534] text-[15px] font-medium">
                    units
                  </span>
                </div>
              </div>
              <div className="bg-white flex-1 rounded-[9px] flex flex-col justify-center px-7 shadow-sm border border-[#E2E8F0] min-h-[150px]">
                <p className="text-[#64748B] font-bold text-[14px] tracking-wide">
                  ACTIVE USERS
                </p>
                <div className="flex flex-row items-baseline gap-2 mt-2">
                  <p className="font-bold text-[44px] text-[#1E293B] leading-none">
                    42.8k
                  </p>
                  <span className="text-[#64748B] text-[15px] font-medium">
                    online
                  </span>
                </div>
              </div>
          </div>

          {/* Audit Trail Table */}
          <div className="w-[1158px] flex flex-col mt-6">
            <div className="flex justify-between items-end mb-6">
              <div className="flex flex-col gap-1">
                <p className="text-[18px] font-semibold text-black">
                  Audit Trail
                </p>
                <p className="text-[#43474D] text-[14px]">
                  Review recent administrative activities across the platform.
                </p>
              </div>
              <button className="text-[#2563EB] font-bold text-[14.62px] cursor-pointer hover:underline">
                View All Logs
              </button>
            </div>

            <div className="rounded-[8px] overflow-hidden border border-[#E2E8F0] shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px] text-left">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <tr>
                      <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                        LOG ID
                      </th>
                      <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                        ADMIN INFO
                      </th>
                      <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                        ACTION
                      </th>
                      <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                        TARGET ENTITY
                      </th>
                      <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                        TIMESTAMP
                      </th>
                      <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                        STATUS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] bg-white">
                    {logs.map((item) => (
                      <tr
                        key={item.log_id}
                        className="hover:bg-[#F8FAFC] transition-colors"
                      >
                        <td className="px-6 py-5 text-center text-[#64748B] font-medium">
                          {item.log_id}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <p className="text-[#1E293B] font-semibold">
                            {item.username}
                          </p>
                          <p className="text-[#64748B] text-[12px] mt-0.5">
                            {item.role}
                          </p>
                        </td>
                        <td className="px-6 py-5 text-center text-[#1E293B] font-semibold">
                          {item.action}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1.5 text-[12px] rounded-[6px] font-semibold bg-[#F1F5F9] text-[#475569]">
                            {item.target_entity}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-center text-[#43474D] font-medium">
                          {item.timestamp}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span
                            className={`inline-flex items-center justify-center px-4 py-1.5 text-[12px] rounded-full font-bold ${
                              item.status === "PUBLISHED"
                                ? "bg-[#DCFCE7] text-[#166534]"
                                : item.status === "SCHEDULED"
                                  ? "bg-[#DBEAFE] text-[#1D4ED8]"
                                  : "bg-[#FEE2E2] text-[#991B1B]"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center mt-6 mb-10 gap-2 text-[#64748B] text-[14px]">
              <button className="w-8 h-8 flex items-center justify-center bg-white border border-[#2563EB] text-[#2563EB] font-bold rounded-[6px] hover:bg-[#EFF6FF] shadow-sm transition-colors">
                1
              </button>
              <button className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-[6px] font-medium transition-colors">
                2
              </button>
              <button className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-[6px] font-medium transition-colors">
                3
              </button>
              <span className="font-medium tracking-widest px-1">...</span>
              <button className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-[6px] font-medium transition-colors">
                12
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
