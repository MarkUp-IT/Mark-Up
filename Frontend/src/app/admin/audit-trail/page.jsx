"use client";

import {
  Search,
  Calendar,
  ChevronDown,
  ListFilter,
  Eye,
  X,
  Database,
  Activity,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import Sidebar from "@/component/admin/Sidebar";
import Header from "@/component/admin/Header";

export default function AuditTrail() {
  // Mock Data Audit Trail
  const auditLogs = [
    {
      id: "LOG-0924",
      adminName: "Affan Fathir D.",
      adminEmail: "affan@markup.com",
      action: "UPDATE",
      table: "users",
      date: "01 Jul 2026 · 10:30",
      ip: "192.168.1.45",
      oldData: '{\n  "role": "student",\n  "status": "active"\n}',
      newData: '{\n  "role": "mentor",\n  "status": "active"\n}',
    },
    {
      id: "LOG-0923",
      adminName: "System Auto",
      adminEmail: "system@markup.com",
      action: "CREATE",
      table: "transactions",
      date: "01 Jul 2026 · 09:15",
      ip: "127.0.0.1",
      oldData: "null",
      newData:
        '{\n  "id": "TRX-8821",\n  "status": "pending",\n  "amount": 299000\n}',
    },
    {
      id: "LOG-0922",
      adminName: "Super Admin",
      adminEmail: "admin@markup.com",
      action: "DELETE",
      table: "products",
      date: "30 Jun 2026 · 15:45",
      ip: "10.0.0.8",
      oldData:
        '{\n  "id": "#BO009",\n  "title": "Old Bootcamp",\n  "is_active": false\n}',
      newData: "null",
    },
    {
      id: "LOG-0921",
      adminName: "Affan Fathir D.",
      adminEmail: "affan@markup.com",
      action: "UPDATE",
      table: "referral_codes",
      date: "30 Jun 2026 · 14:20",
      ip: "192.168.1.45",
      oldData: '{\n  "code": "PROMO20",\n  "quota": 50\n}',
      newData: '{\n  "code": "PROMO20",\n  "quota": 100\n}',
    },
  ];

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  // Lock scroll saat drawer terbuka
  useEffect(() => {
    if (isDetailOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isDetailOpen]);

  const openDetail = (log) => {
    setSelectedLog(log);
    setIsDetailOpen(true);
  };

  // Helper Badge Style
  const getActionBadgeStyle = (action) => {
    switch (action) {
      case "CREATE":
        return "bg-[#DCFCE7] text-[#166534]";
      case "UPDATE":
        return "bg-[#EFF6FF] text-[#2563EB]";
      case "DELETE":
        return "bg-[#FEE2E2] text-[#991B1B]";
      default:
        return "bg-[#F1F5F9] text-[#475569]";
    }
  };

  return (
    <div className="w-full font-inter text-black bg-[#F8FAFC] min-h-screen relative flex flex-row overflow-x-hidden">
      <Sidebar />
      <div className="ml-[288px] flex-1">
        <Header judulHalaman="Audit Trail" />
        <div className="flex-1 flex items-center py-5 flex-col gap-5 px-10 bg-white min-h-screen">
          {/* Title Area */}
          <div className="flex flex-row items-center justify-between w-[1158px] mt-2">
            <div>
              <p className="font-bold text-[25px]">Audit Trail</p>
              <p className="text-[#43474D] text-[15px] mt-1">
                Sistem pemantauan riwayat aktivitas admin dan perubahan data.
              </p>
            </div>
            <Link
              href="#"
              className="text-[#2563EB] font-bold text-[14.62px] cursor-pointer hover:underline mb-2"
            >
              Export Logs (.CSV)
            </Link>
          </div>

          {/* Stats Cards Section */}
          <div className="w-[1158px] flex justify-between gap-5 mt-2">
            {/* Total Logs */}
            <div className="bg-[#F8FAFC] flex-1 h-[140px] rounded-[9px] flex flex-col justify-center px-7 shadow-sm border border-[#E2E8F0]">
              <div className="flex justify-between items-center w-full">
                <p className="text-[#43474D] font-bold text-[14px] tracking-wide uppercase">
                  TOTAL LOGS
                </p>
                <Database size={20} className="text-[#94A3B8]" />
              </div>
              <div className="flex flex-row items-baseline gap-2 mt-2">
                <p className="font-bold text-[44px] text-[#0F172A] leading-none">
                  8.4k
                </p>
                <span className="text-[#64748B] text-[15px] font-medium lowercase">
                  records
                </span>
              </div>
            </div>

            {/* Activities 24h */}
            <div className="bg-[#2E1065] flex-1 h-[140px] rounded-[9px] flex flex-col justify-center px-7 shadow-sm">
              <div className="flex justify-between items-center w-full">
                <p className="text-white/80 font-bold text-[14px] tracking-wide uppercase">
                  ACTIVITIES (24H)
                </p>
                <Activity size={20} className="text-white/60" />
              </div>
              <div className="flex flex-row items-baseline gap-2 mt-2">
                <p className="font-bold text-[44px] text-white leading-none">
                  142
                </p>
                <span className="text-white/90 text-[15px] font-medium lowercase">
                  actions
                </span>
              </div>
            </div>

            {/* Critical Actions */}
            <div className="bg-[#F0564A] flex-1 h-[140px] rounded-[9px] flex flex-col justify-center px-7 shadow-sm">
              <div className="flex justify-between items-center w-full">
                <p className="text-white/90 font-bold text-[14px] tracking-wide uppercase">
                  DELETIONS (7D)
                </p>
                <ShieldAlert size={20} className="text-white/60" />
              </div>
              <div className="flex flex-row items-baseline gap-2 mt-2">
                <p className="font-bold text-[44px] text-white leading-none">
                  12
                </p>
                <span className="text-white/90 text-[15px] font-medium lowercase">
                  warnings
                </span>
              </div>
            </div>
          </div>

          {/* Filters Area */}
          <div className="w-[1158px] flex justify-between items-end mt-4">
            <div className="bg-[#F8FAFC] p-4 rounded-[8px] flex flex-row gap-4 border border-[#E2E8F0] shadow-sm w-full">
              {/* Search */}
              <div className="flex-1 relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                />
                <input
                  type="text"
                  placeholder="Search admin, email, or table..."
                  className="w-full h-[36px] pl-9 pr-3 border border-[#CBD5E1] rounded-[6px] text-[13px] text-[#475569] outline-none focus:border-[#2563EB]"
                />
              </div>

              {/* Date Range */}
              <div className="relative w-[220px]">
                <Calendar
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]"
                />
                <select className="w-full h-[36px] pl-9 pr-8 border border-[#CBD5E1] rounded-[6px] text-[13px] text-[#475569] appearance-none outline-none focus:border-[#2563EB] bg-white cursor-pointer">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                  <option>This Month</option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none"
                />
              </div>

              {/* Action Filter */}
              <div className="relative w-[160px]">
                <select className="w-full h-[36px] pl-3 pr-8 border border-[#CBD5E1] rounded-[6px] text-[13px] text-[#475569] appearance-none outline-none focus:border-[#2563EB] bg-white cursor-pointer">
                  <option>Action: All</option>
                  <option>CREATE</option>
                  <option>UPDATE</option>
                  <option>DELETE</option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none"
                />
              </div>

              {/* Table Filter */}
              <div className="relative w-[160px]">
                <select className="w-full h-[36px] pl-3 pr-8 border border-[#CBD5E1] rounded-[6px] text-[13px] text-[#475569] appearance-none outline-none focus:border-[#2563EB] bg-white cursor-pointer">
                  <option>Table: All</option>
                  <option>users</option>
                  <option>products</option>
                  <option>transactions</option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none"
                />
              </div>

              {/* Filter Button */}
              <button className="w-[36px] h-[36px] flex items-center justify-center border border-[#CBD5E1] rounded-[6px] bg-white text-[#64748B] hover:bg-[#F1F5F9] transition-colors shadow-sm">
                <ListFilter size={16} />
              </button>
            </div>
          </div>

          {/* Table Area */}
          <div className="w-[1158px] rounded-[8px] overflow-hidden mt-4 border border-[#E2E8F0] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                      LOG ID
                    </th>
                    <th className="px-6 py-4 text-left font-bold text-[#43474D] tracking-wider text-[12px]">
                      ADMIN PROFILE
                    </th>
                    <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                      ACTION
                    </th>
                    <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                      TABLE NAME
                    </th>
                    <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                      DATE / TIME
                    </th>
                    <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                      IP ADDRESS
                    </th>
                    <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                      DETAILS
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] bg-white">
                  {auditLogs.map((item, index) => (
                    <tr
                      key={index}
                      className="hover:bg-[#F8FAFC] transition-colors h-[80px]"
                    >
                      <td className="px-6 text-center text-[#64748B] font-medium">
                        {item.id}
                      </td>
                      <td className="px-6 text-left">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#1E293B] text-[13px]">
                            {item.adminName}
                          </span>
                          <span className="text-[#64748B] text-[12px]">
                            {item.adminEmail}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 text-center">
                        <span
                          className={`inline-flex items-center justify-center px-4 py-1.5 text-[11px] rounded-full font-bold uppercase ${getActionBadgeStyle(item.action)}`}
                        >
                          {item.action}
                        </span>
                      </td>
                      <td className="px-6 text-center text-[#1E293B] font-semibold">
                        {item.table}
                      </td>
                      <td className="px-6 text-center text-[#64748B] font-medium">
                        {item.date}
                      </td>
                      <td className="px-6 text-center text-[#64748B] font-medium">
                        {item.ip}
                      </td>
                      <td className="px-6 text-center">
                        <button
                          onClick={() => openDetail(item)}
                          className="text-[#94A3B8] hover:text-[#2563EB] transition-colors p-2 rounded-full hover:bg-[#EFF6FF]"
                        >
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
            <span className="w-8 h-8 flex items-center justify-center bg-white border border-[#2563EB] text-[#2563EB] font-bold rounded-[6px] cursor-pointer hover:bg-[#EFF6FF] shadow-sm">
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
              24
            </span>
          </div>
        </div>
      </div>

      {/* --- BACKGROUND OVERLAY --- */}
      {isDetailOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsDetailOpen(false)}
        />
      )}

      {/* --- SLIDE-OVER DRAWER MENU --- */}
      <div
        className={`
          fixed top-0 right-0 h-screen w-[600px]
          bg-white shadow-2xl z-50
          transition-transform duration-300 ease-in-out
          flex flex-col
          overflow-y-auto
          ${isDetailOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="w-full h-[120px] shrink-0 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col justify-center px-10 gap-1">
          <div className="flex flex-row w-full justify-between items-center">
            <p className="text-[#1E293B] text-[20px] font-bold">Log Details</p>
            <button
              onClick={() => setIsDetailOpen(false)}
              className="p-2 hover:bg-[#E2E8F0] rounded-full transition-colors"
            >
              <X className="cursor-pointer text-[#64748B]" size={20} />
            </button>
          </div>
          <p className="text-[#64748B] text-[14px]">
            {selectedLog?.id} • Recorded on {selectedLog?.date}
          </p>
        </div>

        <div className="px-10 py-8 flex flex-col gap-6 flex-1">
          {/* Summary Info */}
          <div className="bg-[#F8FAFC] p-4 rounded-[8px] border border-[#E2E8F0] grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[#64748B] text-[11px] font-bold uppercase tracking-wider">
                Admin
              </span>
              <span className="text-[#1E293B] font-semibold text-[13px]">
                {selectedLog?.adminName}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[#64748B] text-[11px] font-bold uppercase tracking-wider">
                IP Address
              </span>
              <span className="text-[#1E293B] font-semibold text-[13px]">
                {selectedLog?.ip}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[#64748B] text-[11px] font-bold uppercase tracking-wider">
                Action
              </span>
              <span
                className={`font-bold text-[13px] ${
                  selectedLog?.action === "CREATE"
                    ? "text-[#166534]"
                    : selectedLog?.action === "DELETE"
                      ? "text-[#991B1B]"
                      : "text-[#2563EB]"
                }`}
              >
                {selectedLog?.action}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[#64748B] text-[11px] font-bold uppercase tracking-wider">
                Table
              </span>
              <span className="text-[#1E293B] font-semibold text-[13px]">
                {selectedLog?.table}
              </span>
            </div>
          </div>

          {/* Old Data JSON */}
          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#F0564A]"></span> Old
              Data
            </p>
            <div className="w-full bg-[#F1F5F9] rounded-[6px] border border-[#E2E8F0] p-4 overflow-x-auto">
              <pre className="text-[12px] text-[#475569] font-mono leading-relaxed">
                {selectedLog?.oldData}
              </pre>
            </div>
          </div>

          {/* New Data JSON */}
          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10B981]"></span> New
              Data
            </p>
            <div className="w-full bg-[#F1F5F9] rounded-[6px] border border-[#E2E8F0] p-4 overflow-x-auto">
              <pre className="text-[12px] text-[#475569] font-mono leading-relaxed">
                {selectedLog?.newData}
              </pre>
            </div>
          </div>
        </div>

        <div className="mt-auto p-6 bg-white border-t border-[#E2E8F0] flex justify-end">
          <button
            onClick={() => setIsDetailOpen(false)}
            className="px-8 py-3 bg-white border border-[#CBD5E1] text-[#475569] font-bold rounded-[8px] hover:bg-[#F8FAFC] transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
