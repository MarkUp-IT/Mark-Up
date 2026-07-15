"use client";

import { TrendingUp, TrendingDown, Download } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/component/admin/DashboardLayout";
import StatCard from "@/component/admin/StatCard";
import { api, ApiError } from "@/lib/api";

const PERIOD_FILTERS = [
  { key: "all", label: "Semua Waktu" },
  { key: "day", label: "Hari Ini" },
  { key: "week", label: "Minggu Ini" },
  { key: "month", label: "Bulan Ini" },
];

const formatRupiah = (value) =>
  `Rp${Math.round(Number(value)).toLocaleString("id-ID")}`;

function TrendBadge({ trend }) {
  if (typeof trend !== "number") return null;

  const isUp = trend >= 0;
  const sign = trend > 0 ? "+" : "";

  return (
    <div
      className={
        isUp
          ? "flex items-center gap-1 px-3 py-1 rounded-full bg-[#148F89]/10 border border-[#148F89]/20"
          : "flex items-center gap-1 px-3 py-1 rounded-full bg-[#FEE2E2] border border-[#FCA5A5]"
      }
    >
      {isUp ? (
        <TrendingUp className="text-[#148F89]" size={14} />
      ) : (
        <TrendingDown className="text-[#991B1B]" size={14} />
      )}
      <p className={isUp ? "font-bold text-[12px] text-[#148F89]" : "font-bold text-[12px] text-[#991B1B]"}>
        {sign}{trend}%
      </p>
    </div>
  );
}

export default function AdminDashboard() {
  const [activePeriod, setActivePeriod] = useState("all");

  const [revenue, setRevenue] = useState(null);
  const [counts, setCounts] = useState(null);
  const [userSummary, setUserSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const fetchDashboard = useCallback(async (period) => {
    setLoading(true);
    setError(null);

    try {
      const [revenueResult, countsResult, userResult] = await Promise.allSettled([
        api.get(`/api/transactions/summary/revenue/?period=${period}`),
        api.get(`/api/transactions/summary/purchases/?period=${period}`),
        api.get("/api/accounts/summary/"),
      ]);

      if (revenueResult.status === "fulfilled") {
        setRevenue(revenueResult.value);
      } else {
        console.error("Revenue API Error:", revenueResult.reason);
        setError("Gagal memuat data pendapatan.");
      }

      if (countsResult.status === "fulfilled") {
        setCounts(countsResult.value);
      } else {
        console.error("Counts API Error:", countsResult.reason);
      }

      if (userResult.status === "fulfilled") {
        setUserSummary(userResult.value);
      } else {
        console.error("User Summary API Error:", userResult.reason);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan saat memuat data dashboard.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard(activePeriod);
  }, [activePeriod, fetchDashboard]);

  return (
    <DashboardLayout title="Dashboard">
      <style>{`.adm-h-42 { height: 42px; }`}</style>

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
                disabled={loading}
                className={`px-3.5 py-2 rounded-[6px] font-medium text-[12.5px] transition-colors whitespace-nowrap disabled:opacity-60 ${
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

      {error && (
        <div className="rounded-[8px] border border-[#FCA5A5] bg-[#FEE2E2] text-[#991B1B] text-[13px] px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        <StatCard
          label="Penjualan Mentoring"
          value={loading ? "…" : String(counts?.counts_by_type?.MENTORING ?? 0)}
          unit="unit"
        />
        <StatCard
          label="Penjualan Bootcamp"
          value={loading ? "…" : String(counts?.counts_by_type?.BOOTCAMP ?? 0)}
          unit="unit"
        />
        <StatCard
          label="Penjualan Modul"
          value={loading ? "…" : String(counts?.counts_by_type?.MODULE ?? 0)}
          unit="unit"
        />

        <div className="col-span-2 row-span-2 bg-white border border-[#E2E8F0] shadow-sm rounded-[12px] p-6 flex flex-col">
          <div className="flex flex-col mb-4">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-bold text-[#64748B] tracking-wide uppercase">
                Total Pendapatan
              </p>
              <TrendBadge trend={revenue?.trend_percentage} />
            </div>
            <p className="font-bold text-[28px] text-[#0F172A] mt-1">
              {loading ? "…" : formatRupiah(revenue?.total_revenue ?? 0)}
            </p>
          </div>
          <div className="flex-1" style={{ minHeight: "220px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={revenue?.daily_chart ?? []}
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
                  formatter={(value) => [formatRupiah(value), "Pendapatan"]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                  {(revenue?.daily_chart ?? []).map((entry, index, arr) => (
                    <Cell
                      key={index}
                      fill={index === arr.length - 1 ? "#148F89" : "#CDEEEB"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <StatCard
          label="Penjualan Hari Ini"
          value={loading ? "…" : String(counts?.today_count ?? 0)}
          unit="unit"
          variant="success"
        />
        <StatCard
          label="User Aktif"
          value={loading ? "…" : String(userSummary?.total_users ?? 0)}
          unit="online"
        />
      </div>

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