"use client";

import {
  Bell,
  Settings,
  Search,
  Calendar,
  Download,
  TrendingUp,
  LayoutDashboard,
  Package,
  Trophy,
  ReceiptText,
  MessageSquare,
  History,
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
import Link from "next/link";
import { usePathname } from "next/navigation";

const Sidebar = () => {
  const pathname = usePathname();

  const daftarMenu = [
    { nama: "Dashboard", url: "/admin", icon: LayoutDashboard },
    { nama: "Produk", url: "/admin/produk", icon: Package },
    { nama: "Info Lomba", url: "/admin/lomba", icon: Trophy },
    { nama: "Transaksi", url: "/admin/transaksi", icon: ReceiptText },
    { nama: "Ulasan", url: "/admin/ulasan", icon: MessageSquare },
    { nama: "Audit Trail", url: "/admin/audit", icon: History },
  ];

  const currentPath = pathname || "/admin";

  return (
    <div className="fixed top-0 left-0 w-[288px] h-screen bg-[#F8FAFC] border-r border-[#E2E8F0] flex flex-col justify-between py-8 px-4 z-10">
      <div>
        <div className="flex flex-col mb-10 px-4">
          <h1 className="text-[24px] font-black text-[#1E293B] tracking-tight">
            MARK-UP
          </h1>
          <span className="text-[11px] font-bold text-[#64748B] tracking-widest mt-1">
            ADMIN
          </span>
        </div>
        <nav className="flex flex-col gap-2">
          {daftarMenu.map((menu, index) => {
            const menuAktif =
              currentPath.includes(menu.url) &&
              (menu.url !== "/admin" || currentPath === "/admin");
            const Icon = menu.icon;

            return (
              <Link
                key={index}
                href={menu.url}
                className={`flex items-center gap-3 px-4 py-3 rounded-[8px] cursor-pointer transition-all ${
                  menuAktif
                    ? "text-[#2563EB] bg-white shadow-sm"
                    : "text-[#64748B] hover:bg-white hover:shadow-sm hover:text-black"
                }`}
              >
                <Icon size={20} />
                <span className="font-medium text-[14px]">{menu.nama}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="px-4">
        <button className="w-full bg-[#E11D48] text-white font-bold py-3 rounded-[8px] hover:bg-[#BE123C] transition-colors text-[14px]">
          Keluar
        </button>
      </div>
    </div>
  );
};

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
    <div className="w-full font-inter text-black bg-[#F8FAFC] min-h-screen relative flex flex-row overflow-x-hidden">
      <Sidebar />

      <div className="flex-1 flex items-center ml-[288px] py-5 flex-col gap-5 px-10 bg-white">
        {/* Top Header */}
        <div className="w-[1158px] h-[72px] bg-[#E2E8F0] flex flex-row items-center justify-center gap-15 rounded-[8px]">
          <div className="flex gap-20 items-center">
            <p className="text-black font-bold text-[20.25px]">Dashboard</p>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search analytics..."
                className="bg-white w-[511px] h-[36px] rounded-[6.75px] pl-10 border-none outline-none focus:ring-2 focus:ring-[#2563EB]/20"
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

        {/* Title & Filters */}
        <div className="flex flex-row items-center justify-between w-[1158px] mt-2">
          <div>
            <p className="font-bold text-[25px]">Dashboard Overview</p>
            <p className="text-[#43474D] text-[15px]">
              Real-time performance metrics for MARK-UP products
            </p>
          </div>
          <div className="flex flex-row gap-4">
            <div className="h-[43.5px] bg-[#F0F4F8] px-2 rounded-[6px] flex justify-center items-center gap-1 shadow-sm">
              <button
                onClick={() => setIsActive("all")}
                className={`px-4 py-1.5 rounded-[4px] font-medium text-[13px] transition-all ${isActive === "all" ? "bg-white text-black shadow-sm" : "text-[#43474D] hover:bg-[#E2E8F0]"}`}
              >
                All Time
              </button>
              <button
                onClick={() => setIsActive("day")}
                className={`px-4 py-1.5 rounded-[4px] font-medium text-[13px] transition-all ${isActive === "day" ? "bg-white text-black shadow-sm" : "text-[#43474D] hover:bg-[#E2E8F0]"}`}
              >
                Day
              </button>
              <button
                onClick={() => setIsActive("week")}
                className={`px-4 py-1.5 rounded-[4px] font-medium text-[13px] transition-all ${isActive === "week" ? "bg-white text-black shadow-sm" : "text-[#43474D] hover:bg-[#E2E8F0]"}`}
              >
                Week
              </button>
              <button
                onClick={() => setIsActive("month")}
                className={`px-4 py-1.5 rounded-[4px] font-medium text-[13px] transition-all ${isActive === "month" ? "bg-white text-black shadow-sm" : "text-[#43474D] hover:bg-[#E2E8F0]"}`}
              >
                Month
              </button>
              <div className="relative flex items-center">
                <button
                  onClick={() => setIsActive("custom")}
                  className={`px-4 py-1.5 pr-8 rounded-[4px] font-medium text-[13px] transition-all ${isActive === "custom" ? "bg-white text-black shadow-sm" : "text-[#43474D] hover:bg-[#E2E8F0]"}`}
                >
                  Custom
                </button>
                <Calendar
                  className={`absolute right-2 pointer-events-none ${isActive === "custom" ? "text-black" : "text-[#43474D]"}`}
                  size={14}
                />
              </div>
            </div>

            <div className="relative flex items-center">
              <Download
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white pointer-events-none"
                size={16}
              />
              <button className="bg-[#2563EB] h-[43.5px] text-white text-[13px] font-semibold pl-10 pr-6 rounded-[6.75px] hover:bg-[#2563EB]/80 transition-colors shadow-sm">
                Export to PDF
              </button>
            </div>
          </div>
        </div>

        {/* Sales Cards */}
        <div className="w-[1158px] flex justify-between gap-5 mt-2">
          <div className="bg-[#FDFFE7] flex-1 h-[120px] rounded-[9px] flex flex-col justify-center px-7 shadow-sm border border-[#E2E8F0]/50">
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
          <div className="bg-[#E7FFFC] flex-1 h-[120px] rounded-[9px] flex flex-col justify-center px-7 shadow-sm border border-[#E2E8F0]/50">
            <p className="text-[#43474D] font-bold text-[14px] tracking-wide">
              INTENSIVE BOOTCAMP SALES
            </p>
            <div className="flex flex-row items-baseline gap-2 mt-2">
              <p className="font-bold text-[40px] text-black leading-none">1</p>
              <span className="text-[#43474D] text-[15px] font-medium">
                units
              </span>
            </div>
          </div>
          <div className="bg-[#FFE7FD] flex-1 h-[120px] rounded-[9px] flex flex-col justify-center px-7 shadow-sm border border-[#E2E8F0]/50">
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
        </div>

        {/* Chart & Highlights */}
        <div className="w-[1158px] flex justify-between gap-5 mt-4">
          <div className="w-[760px] h-[320px] bg-white border border-[#E2E8F0] shadow-sm rounded-[9px] p-6 flex flex-col">
            <div className="flex flex-col mb-4">
              <div className="flex flex-row w-full justify-between items-center ">
                <p className="text-[13px] font-bold text-[#64748B] tracking-wider">
                  TOTAL REVENUE
                </p>
                <div className="flex flex-row w-[100px] h-[30px] rounded-[13.5px] bg-[#EFF6FF] items-center justify-center gap-1 border border-[#BFDBFE]">
                  <TrendingUp className="text-[#2563EB]" size={16} />
                  <p className="font-bold text-[#2563EB] text-[13px]">+12.5%</p>
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
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
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
                        fill={index === data.length - 1 ? "#2563EB" : "#DBEAFE"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex flex-col gap-5 flex-1">
            <div className="bg-[#F0FDF4] flex-1 rounded-[9px] flex flex-col justify-center px-7 shadow-sm border border-[#DCFCE7]">
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
            <div className="bg-white flex-1 rounded-[9px] flex flex-col justify-center px-7 shadow-sm border border-[#E2E8F0]">
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
        </div>

        {/* Audit Trail Table */}
        <div className="w-[1158px] flex flex-col mt-6">
          <div className="flex justify-between items-end">
            <div className="flex flex-col gap-1">
              <p className="text-[18px] font-semibold text-black">
                Audit Trail
              </p>
              <p className="text-[#43474D] text-[14px]">
                Review recent administrative activities across the platform.
              </p>
            </div>
            <p className="text-[#2563EB] font-bold text-[14.62px] cursor-pointer hover:underline">
              View All Logs
            </p>
          </div>

          <div className="rounded-[8px] overflow-hidden mt-6 border border-[#E2E8F0] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
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
                  {logs.map((item, index) => (
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
                        <p className="text-[#64748B] text-[11px] mt-1">
                          {item.role}
                        </p>
                      </td>
                      <td className="px-6 py-5 text-center text-[#1E293B] font-medium">
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

          <div className="flex justify-center items-center mt-6 mb-10 gap-2 text-[#64748B] text-[14px]">
            <span className="w-8 h-8 flex items-center justify-center bg-white border border-[#2563EB] text-[#2563EB] font-bold rounded-md cursor-pointer hover:bg-[#EFF6FF] shadow-sm">
              1
            </span>
            <span className="w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded-md font-medium">
              2
            </span>
            <span className="w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded-md font-medium">
              3
            </span>
            <span className="font-medium tracking-widest">...</span>
            <span className="w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded-md font-medium">
              12
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
