"use client";

import { TrendingUp, Download } from "lucide-react";
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
import DashboardLayout from "@/component/admin/DashboardLayout";
import StatCard from "@/component/admin/StatCard";

const PERIOD_FILTERS = [
  { key: "all", label: "Semua Waktu" },
  { key: "day", label: "Hari Ini" },
  { key: "week", label: "Minggu Ini" },
  { key: "month", label: "Bulan Ini" },
];

export default function AdminDashboard() {
  const [activePeriod, setActivePeriod] = useState("all");

  const chartData = [
    { day: "29/03", revenue: 400 },
    { day: "30/03", revenue: 300 },
    { day: "31/03", revenue: 600 },
    { day: "01/04", revenue: 500 },
    { day: "02/04", revenue: 300 },
    { day: "03/04", revenue: 500 },
  ];

  const logs = [
    {
      id: "#A001",
      username: "Nicco C. P.",
      role: "CIO",
      action: "Menambah Produk #B0001",
      entity: "Produk/Bootcamp",
      timestamp: "24 Okt 2026 · 14:22",
      status: "PUBLISHED",
    },
    {
      id: "#U011",
      username: "Faisal A.",
      role: "Associate IT",
      action: "Mengubah Produk #ME003",
      entity: "Produk/Mentoring",
      timestamp: "24 Okt 2026 · 11:05",
      status: "SCHEDULED",
    },
    {
      id: "#A101",
      username: "Muhammad A.",
      role: "Associate IT",
      action: "Menambah Lomba #W001",
      entity: "Lomba/UI-UX",
      timestamp: "23 Okt 2026 · 09:25",
      status: "PUBLISHED",
    },
    {
      id: "#R121",
      username: "Affan F. D.",
      role: "Associate IT",
      action: "Menghapus Lomba #H005",
      entity: "Lomba/Hackathon",
      timestamp: "23 Okt 2026 · 04:28",
      status: "REMOVED",
    },
  ];

  const statusMeta = {
    PUBLISHED: "bg-[#DCFCE7] text-[#166534]",
    SCHEDULED: "bg-[#DBEAFE] text-[#1D4ED8]",
    REMOVED: "bg-[#FEE2E2] text-[#991B1B]",
  };

  return (
    <DashboardLayout title="Dashboard">
      <style>{`.adm-h-42 { height: 42px; }`}</style>

      {/* Page header -- pola baku: h1 22px + subtitle 14px + aksi kanan.
          Nggak pakai flex-col/flex-row responsive lagi, cukup flex-wrap. */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bold text-[22px] text-[#0F172A]">
            Ringkasan Dashboard
          </h1>
          <p className="text-[#64748B] text-[14px] mt-1">
            Metrik performa real-time produk MARK-UP.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="adm-h-42 bg-[#F1F5F9] px-1.5 rounded-[8px] flex items-center gap-1 shrink-0">
            {PERIOD_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setActivePeriod(f.key)}
                className={`px-3.5 py-2 rounded-[6px] font-medium text-[12.5px] transition-colors whitespace-nowrap ${
                  activePeriod === f.key
                    ? "bg-white text-[#0F172A] shadow-sm"
                    : "text-[#64748B] hover:bg-white/60"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button className="adm-h-42 flex items-center gap-2 px-5 rounded-[8px] bg-[#148F89] text-white text-[13px] font-semibold hover:bg-[#117A75] transition-colors shrink-0">
            <Download size={15} />
            Ekspor PDF
          </button>
        </div>
      </div>

      {/* Grid stat + chart -- semua StatCard sama persis ukurannya (satu
          komponen), grid tetap 3 kolom (admin didesain buat desktop) */}
      <div className="grid grid-cols-3 gap-5">
        <StatCard label="Penjualan Mentoring" value="19" unit="unit" />
        <StatCard label="Penjualan Bootcamp" value="1" unit="unit" />
        <StatCard label="Penjualan Modul" value="23" unit="unit" />

        <div className="col-span-2 row-span-2 bg-white border border-[#E2E8F0] shadow-sm rounded-[12px] p-6 flex flex-col">
          <div className="flex flex-col mb-4">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-bold text-[#64748B] tracking-wide uppercase">
                Total Pendapatan
              </p>
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#148F89]/10 border border-[#148F89]/20">
                <TrendingUp className="text-[#148F89]" size={14} />
                <p className="font-bold text-[#148F89] text-[12px]">+12.5%</p>
              </div>
            </div>
            <p className="font-bold text-[28px] text-[#0F172A] mt-1">
              Rp284.912.000
            </p>
          </div>
          <div className="flex-1" style={{ minHeight: "220px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                barCategoryGap={30}
                margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94A3B8", fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: "#F8FAFC" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={
                        index === chartData.length - 1 ? "#148F89" : "#CDEEEB"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <StatCard
          label="Penjualan Hari Ini"
          value="43"
          unit="unit"
          variant="success"
        />
        <StatCard label="User Aktif" value="42.8k" unit="online" />
      </div>

      {/* Audit Trail ringkas -- pola section header baku: h2 16px + subtitle
          13px + link kanan */}
      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-[16px] font-semibold text-[#0F172A]">
              Audit Trail
            </h2>
            <p className="text-[#64748B] text-[13px] mt-0.5">
              Aktivitas administratif terbaru di seluruh platform.
            </p>
          </div>
          <a
            href="/admin/audit-trail"
            className="text-[#148F89] font-bold text-[13px] hover:underline"
          >
            Lihat Semua Log
          </a>
        </div>

        <div className="rounded-[12px] overflow-hidden border border-[#E2E8F0] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] text-left">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                    ID LOG
                  </th>
                  <th className="px-6 py-3.5 text-left font-bold text-[#64748B] tracking-wider text-[11px]">
                    ADMIN
                  </th>
                  <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                    AKSI
                  </th>
                  <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                    TARGET
                  </th>
                  <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                    WAKTU
                  </th>
                  <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                    STATUS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] bg-white">
                {logs.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#F8FAFC] transition-colors"
                  >
                    <td className="px-6 py-4 text-center text-[#64748B] font-medium">
                      {item.id}
                    </td>
                    <td className="px-6 py-4 text-left">
                      <p className="text-[#1E293B] font-semibold">
                        {item.username}
                      </p>
                      <p className="text-[#94A3B8] text-[12px] mt-0.5">
                        {item.role}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center text-[#1E293B] font-medium">
                      {item.action}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex px-3 py-1 text-[11px] rounded-[6px] font-semibold bg-[#F1F5F9] text-[#475569]">
                        {item.entity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-[#64748B] font-medium whitespace-nowrap">
                      {item.timestamp}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex px-3 py-1 text-[11px] rounded-full font-bold ${statusMeta[item.status]}`}
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
      </div>
    </DashboardLayout>
  );
}
