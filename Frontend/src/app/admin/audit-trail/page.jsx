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
import { useState, useEffect } from "react";
import DashboardLayout from "@/component/admin/DashboardLayout";
import StatCard from "@/component/admin/StatCard";
import EmptyState from "@/component/admin/EmptyState";

export default function AuditTrail() {
  const heightFix = `.adm-h-36 { height: 36px; } .adm-w-36 { width: 36px; }`;

  const auditLogs = [
    {
      id: "LOG-0924",
      adminName: "Nicco Cahya Permana",
      adminEmail: "nicco@markup.com",
      action: "UPDATE",
      table: "users",
      date: "1 Jul 2026 · 10:30",
      ip: "192.168.1.45",
      oldData: '{\n  "role": "user",\n  "status": "active"\n}',
      newData: '{\n  "role": "mentor",\n  "status": "active"\n}',
    },
    {
      id: "LOG-0923",
      adminName: "Sistem Otomatis",
      adminEmail: "system@markup.com",
      action: "CREATE",
      table: "transactions",
      date: "1 Jul 2026 · 09:15",
      ip: "127.0.0.1",
      oldData: "null",
      newData:
        '{\n  "id": "TRX-8821",\n  "status": "pending",\n  "amount": 299000\n}',
    },
    {
      id: "LOG-0922",
      adminName: "Affan Fathir D.",
      adminEmail: "affan@markup.com",
      action: "DELETE",
      table: "products",
      date: "30 Jun 2026 · 15:45",
      ip: "10.0.0.8",
      oldData:
        '{\n  "id": "#BO009",\n  "title": "Bootcamp Lama",\n  "is_active": false\n}',
      newData: "null",
    },
    {
      id: "LOG-0921",
      adminName: "Nicco Cahya Permana",
      adminEmail: "nicco@markup.com",
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
  const [actionFilter, setActionFilter] = useState("Semua");

  useEffect(() => {
    document.body.style.overflow = isDetailOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isDetailOpen]);

  const openDetail = (log) => {
    setSelectedLog(log);
    setIsDetailOpen(true);
  };

  const getActionBadgeStyle = (action) => {
    switch (action) {
      case "CREATE":
        return "bg-[#DCFCE7] text-[#166534]";
      case "UPDATE":
        return "bg-[#DBEAFE] text-[#1D4ED8]";
      case "DELETE":
        return "bg-[#FEE2E2] text-[#991B1B]";
      default:
        return "bg-[#F1F5F9] text-[#475569]";
    }
  };

  const filtered =
    actionFilter === "Semua"
      ? auditLogs
      : auditLogs.filter((l) => l.action === actionFilter);

  return (
    <DashboardLayout title="Audit Trail">
      <style>{heightFix}</style>

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bold text-[22px] text-[#0F172A]">Audit Trail</h1>
          <p className="text-[#64748B] text-[14px] mt-1">
            Pemantauan riwayat aktivitas admin dan perubahan data sistem.
          </p>
        </div>
        <button className="text-[#148F89] font-bold text-[13px] hover:underline">
          Ekspor Log (.CSV)
        </button>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <StatCard label="Total Log" value="8.4k" unit="catatan" />
        <StatCard
          label="Aktivitas (24 Jam)"
          value="142"
          unit="aksi"
          variant="primary"
        />
        <StatCard
          label="Penghapusan (7 Hari)"
          value="12"
          unit="peringatan"
          variant="warning"
        />
      </div>

      <div className="flex flex-col gap-4">
        <div className="bg-white p-4 rounded-[12px] flex flex-wrap gap-4 border border-[#E2E8F0] shadow-sm">
          <div className="flex-1 relative" style={{ minWidth: "220px" }}>
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
            />
            <input
              type="text"
              placeholder="Cari admin, email, atau tabel..."
              className="w-full adm-h-36 pl-9 pr-3 border border-[#E2E8F0] rounded-[6px] text-[13px] text-[#475569] outline-none focus:border-[#148F89]"
            />
          </div>
          <div className="relative" style={{ width: "200px" }}>
            <Calendar
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]"
            />
            <select className="w-full adm-h-36 pl-9 pr-8 border border-[#E2E8F0] rounded-[6px] text-[13px] text-[#475569] appearance-none outline-none focus:border-[#148F89] bg-white cursor-pointer">
              <option>7 Hari Terakhir</option>
              <option>30 Hari Terakhir</option>
              <option>Bulan Ini</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none"
            />
          </div>
          <div className="relative" style={{ width: "150px" }}>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full adm-h-36 pl-3 pr-8 border border-[#E2E8F0] rounded-[6px] text-[13px] text-[#475569] appearance-none outline-none focus:border-[#148F89] bg-white cursor-pointer"
            >
              <option value="Semua">Aksi: Semua</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none"
            />
          </div>
          <button className="adm-w-36 adm-h-36 flex items-center justify-center border border-[#E2E8F0] rounded-[6px] bg-white text-[#64748B] hover:bg-[#F1F5F9] transition-colors">
            <ListFilter size={16} />
          </button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState message="Nggak ada log yang cocok sama filter ini." />
        ) : (
          <div className="rounded-[12px] overflow-hidden border border-[#E2E8F0] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-6 py-3.5 text-left font-bold text-[#64748B] tracking-wider text-[11px]">
                      ID LOG
                    </th>
                    <th className="px-6 py-3.5 text-left font-bold text-[#64748B] tracking-wider text-[11px]">
                      PROFIL ADMIN
                    </th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                      AKSI
                    </th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                      TABEL
                    </th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                      WAKTU
                    </th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                      IP
                    </th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                      DETAIL
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
                      <td className="px-6 py-4">
                        <p className="font-bold text-[#1E293B]">
                          {item.adminName}
                        </p>
                        <p className="text-[#94A3B8] text-[12px]">
                          {item.adminEmail}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex px-3 py-1.5 text-[11px] rounded-full font-bold ${getActionBadgeStyle(item.action)}`}
                        >
                          {item.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-[#1E293B] font-semibold">
                        {item.table}
                      </td>
                      <td className="px-6 py-4 text-center text-[#64748B] font-medium whitespace-nowrap">
                        {item.date}
                      </td>
                      <td className="px-6 py-4 text-center text-[#64748B] font-medium">
                        {item.ip}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => openDetail(item)}
                          className="text-[#94A3B8] hover:text-[#148F89] transition-colors p-2 rounded-full hover:bg-[#148F89]/10"
                        >
                          <Eye size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {isDetailOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setIsDetailOpen(false)}
        />
      )}
      <div
        style={{ width: "560px", maxWidth: "100%" }}
        className={`fixed top-0 right-0 h-screen bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out flex flex-col overflow-y-auto ${isDetailOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="w-full shrink-0 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col justify-center px-8 py-6 gap-1">
          <div className="flex justify-between items-center">
            <p className="text-[#1E293B] text-[19px] font-bold">Detail Log</p>
            <button
              onClick={() => setIsDetailOpen(false)}
              className="p-2 hover:bg-[#E2E8F0] rounded-full transition-colors"
            >
              <X className="text-[#64748B]" size={20} />
            </button>
          </div>
          <p className="text-[#64748B] text-[13px]">
            {selectedLog?.id} · Dicatat pada {selectedLog?.date}
          </p>
        </div>

        <div className="px-8 py-6 flex flex-col gap-5">
          <div className="bg-[#F8FAFC] p-4 rounded-[8px] border border-[#E2E8F0] grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider">
                Admin
              </span>
              <span className="text-[#1E293B] font-semibold text-[13px]">
                {selectedLog?.adminName}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider">
                Alamat IP
              </span>
              <span className="text-[#1E293B] font-semibold text-[13px]">
                {selectedLog?.ip}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider">
                Aksi
              </span>
              <span
                className={`font-bold text-[13px] ${selectedLog?.action === "CREATE" ? "text-[#166534]" : selectedLog?.action === "DELETE" ? "text-[#991B1B]" : "text-[#1D4ED8]"}`}
              >
                {selectedLog?.action}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider">
                Tabel
              </span>
              <span className="text-[#1E293B] font-semibold text-[13px]">
                {selectedLog?.table}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider flex items-center gap-2">
              <span
                style={{ width: "8px", height: "8px" }}
                className="rounded-full bg-[#DC2626]"
              />
              Data Lama
            </p>
            <div className="w-full bg-[#F8FAFC] rounded-[6px] border border-[#E2E8F0] p-4 overflow-x-auto">
              <pre className="text-[12px] text-[#475569] font-mono leading-relaxed">
                {selectedLog?.oldData}
              </pre>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider flex items-center gap-2">
              <span
                style={{ width: "8px", height: "8px" }}
                className="rounded-full bg-[#148F89]"
              />
              Data Baru
            </p>
            <div className="w-full bg-[#F8FAFC] rounded-[6px] border border-[#E2E8F0] p-4 overflow-x-auto">
              <pre className="text-[12px] text-[#475569] font-mono leading-relaxed">
                {selectedLog?.newData}
              </pre>
            </div>
          </div>
        </div>

        <div className="mt-auto p-6 bg-white border-t border-[#E2E8F0] flex justify-end">
          <button
            onClick={() => setIsDetailOpen(false)}
            className="px-6 py-2.5 bg-white border border-[#E2E8F0] text-[#475569] font-bold rounded-[8px] hover:bg-[#F8FAFC] transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
