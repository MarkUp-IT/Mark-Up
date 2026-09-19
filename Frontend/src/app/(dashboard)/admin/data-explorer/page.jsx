"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Download, ChevronDown, Search, Table2, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import EmptyState from "@/component/admin/EmptyState";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";

// --- Label & pola warna dipakai ulang persis dari halaman admin yang sudah
// ada (bootcamp-registrations, transactions, user-management) -- biar
// konsisten, bukan istilah baru yang bikin bingung. ---
const REG_STATUS_LABEL = { registered: "Menunggu Ditinjau", accepted: "Diterima", rejected: "Ditolak" };
const REG_STATUS_BADGE = {
  registered: "bg-[#FEF3C7] text-[#92400E]",
  accepted: "bg-[#DCFCE7] text-[#166534]",
  rejected: "bg-[#FEE2E2] text-[#991B1B]",
};
const PAY_STATUS_LABEL = {
  BELUM_ADA: "Belum Ada Transaksi", PENDING: "Menunggu Verifikasi",
  PAID: "Lunas", FAILED: "Ditolak", EXPIRED: "Kedaluwarsa", REFUNDED: "Refund",
  // Anggota tim gak pernah bayar sendiri (ketua yang bayar buat semua) --
  // status ini dipakai KHUSUS anggota, gantiin PAID/BELUM_ADA yang
  // menyesatkan (baik yang sudah diprovisi maupun yang masih nunggu ketua
  // bayar, dua-duanya "ditanggung ketua", bedanya cuma sudah aktif atau
  // belum -- itu tercermin di kolom Status Pendaftaran, bukan di sini).
  DITANGGUNG_KETUA: "Ditanggung Ketua Tim",
};
const PAY_STATUS_BADGE = {
  BELUM_ADA: "bg-[#F1F5F9] text-[#475569]", PENDING: "bg-[#FEF3C7] text-[#92400E]",
  PAID: "bg-[#DCFCE7] text-[#166534]", FAILED: "bg-[#FEE2E2] text-[#991B1B]",
  EXPIRED: "bg-[#F1F5F9] text-[#475569]", REFUNDED: "bg-[#E0E7FF] text-[#3730A3]",
  DITANGGUNG_KETUA: "bg-[#E0E7FF] text-[#3730A3]",
};
// Status pendaftaran KHUSUS anggota tim yang belum diprovisi (belum punya
// BootcampRegistration sendiri -- baru dibuatkan begitu ketua bayar &
// di-ACC, lihat _provision_team_members di backend). Dipetakan dari status
// KETUA-nya: kalau ketua belum ditinjau/ditolak, anggota ikut status itu;
// kalau ketua sudah diterima tapi belum bayar, anggota nunggu ketua bayar.
const MEMBER_STATUS_LABEL = {
  registered: "Menunggu Ditinjau (Ketua)",
  rejected: "Ditolak (Ketua)",
  waiting_payment: "Menunggu Ketua Bayar",
};
const MEMBER_STATUS_BADGE = {
  registered: "bg-[#FEF3C7] text-[#92400E]",
  rejected: "bg-[#FEE2E2] text-[#991B1B]",
  waiting_payment: "bg-[#FEF3C7] text-[#92400E]",
};
const PRODUCT_TYPE_LABEL = { BOOTCAMP: "Bootcamp", MENTORING: "Mentoring", MODULE: "Modul" };
const ROLE_LABEL = { ADMIN: "Admin", MENTOR: "Mentor", STUDENT: "Mentee" };

const formatIDR = (val) =>
  val == null ? "-" : new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(val));

function formatDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}
function formatDateTime(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Generate & download CSV di browser -- gak butuh endpoint backend sama
// sekali, karena datanya sudah ada di tangan (hasil filter yang lagi
// ditampilin). BOM UTF-8 di depan biar Excel baca huruf ber-diakritik
// Indonesia dengan benar, bukan jadi karakter aneh.
function downloadCSV(rows, columns, filenamePrefix) {
  const escape = (val) => {
    const s = String(val ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map((c) => escape(c.label)).join(",");
  const lines = rows.map((row) => columns.map((c) => escape(c.get(row))).join(","));
  const csv = [header, ...lines].join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const inputCls =
  "w-full h-[42px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B] text-[13.5px]";

function SelectField({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1.5 min-w-[160px]">
      <p className="text-[#64748B] text-[11px] uppercase font-bold tracking-wider">{label}</p>
      <div className="relative w-full">
        <select value={value} onChange={(e) => onChange(e.target.value)} className={`${inputCls} appearance-none pr-9`}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
      </div>
    </div>
  );
}

const DATA_TYPES = [
  { value: "BOOTCAMP", label: "Pendaftaran Bootcamp" },
  { value: "TRANSAKSI", label: "Transaksi" },
  { value: "PENGGUNA", label: "Pengguna" },
];

const EMPTY_FILTERS = { status: "Semua", secondary: "Semua", dateFrom: "", dateTo: "", search: "" };

// Anggota tim yang diundang BELUM PUNYA BootcampRegistration sendiri
// sampai ketuanya bayar & di-ACC admin (lihat _provision_team_members di
// backend) -- jadi mereka gak pernah muncul sebagai baris sendiri di
// endpoint bootcamp-registrations, cuma "nebeng" di `team.members` milik
// ketuanya. Fungsi ini nge-"mekarin" jadi baris tersendiri (relasinya ke
// ketua tetap kelihatan lewat kolom Ketua Tim) supaya mereka gak hilang
// dari daftar -- ini persis gap yang bikin bug "peserta gak nemu opsi
// bayar" beberapa waktu lalu, jangan sampai kejadian lagi versi "gak
// kelihatan di data admin".
function expandBootcampTeamMembers(registrations) {
  const expanded = [...registrations];
  for (const reg of registrations) {
    if (reg.team?.role !== "leader") continue;
    for (const member of reg.team.members || []) {
      // Jangan digandakan kalau anggota ini SUDAH punya BootcampRegistration
      // sendiri di BOOTCAMP YANG SAMA -- entah karena sudah diprovisi lewat
      // tim ini, ATAU (kasus yang sama persis dijaga backend di
      // _provision_team_members, Backend/transactions/views.py sekitar
      // baris 189: `BootcampRegistration.objects.filter(user=anggota,
      // package__bootcamp=bootcamp).exists()`) karena dia sempat daftar
      // sendiri (paket lain) di bootcamp itu sebelum ketuanya dibayar-ACC.
      // Provisioning-nya di-skip backend buat kasus itu, jadi dia TETAP
      // gak akan pernah punya baris role:"member" -- cek relasi tim aja
      // gak cukup, harus dicek ke SEMUA baris bootcamp yang sama.
      const sudahAda = registrations.some(
        (r) => r.bootcamp_id === reg.bootcamp_id && r.user_email === member.email
      );
      if (sudahAda) continue;

      const waitingPayment = reg.status === "accepted" && (!reg.payment || reg.payment.status !== "PAID");
      const memberStatusKey = reg.status === "accepted" ? (waitingPayment ? "waiting_payment" : null) : reg.status;

      expanded.push({
        id: `virtual-member-${reg.id}-${member.email}`,
        user_name: member.name,
        user_email: member.email,
        status: reg.status,
        created_at: reg.created_at,
        reviewed_at: reg.reviewed_at,
        package: reg.package,
        payment: null,
        team: { role: "member", leader_name: reg.user_name, leader_email: reg.user_email, target_size: reg.package.group_size },
        _memberStatusOverride: memberStatusKey,
        _isVirtualMember: true,
      });
    }
  }
  return expanded;
}

export default function DataExplorerPage() {
  const [dataType, setDataType] = useState("BOOTCAMP");
  const [cache, setCache] = useState({ BOOTCAMP: null, TRANSAKSI: null, PENGGUNA: null });
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState({ key: null, direction: "asc" });

  const toggleSort = (key) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: null, direction: "asc" }; // klik ke-3 -> balik ke urutan asli
    });
  };

  const setFilter = (key) => (value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const fetchData = useCallback(async (type) => {
    setLoading(true);
    setLoadError("");
    try {
      let rows = [];
      if (type === "BOOTCAMP") {
        const res = await apiRequest("/api/products/bootcamp-registrations/");
        rows = expandBootcampTeamMembers(res?.registrations || []);
      } else if (type === "TRANSAKSI") {
        const res = await apiRequest("/api/transactions/");
        rows = res?.transactions || [];
      } else if (type === "PENGGUNA") {
        const res = await apiRequest("/api/accounts/users/");
        rows = res?.users || [];
      }
      setCache((prev) => ({ ...prev, [type]: rows }));
    } catch (err) {
      setLoadError(err?.message || "Gagal memuat data.");
      toast.error("Gagal memuat data", { description: err?.message || "Coba lagi." });
    } finally {
      setLoading(false);
    }
  }, []);

  // Pindah jenis data: reset filter (filter lama gak relevan lagi buat jenis
  // data yang baru), dan fetch cuma kalau belum pernah di-fetch sebelumnya.
  useEffect(() => {
    setFilters(EMPTY_FILTERS);
    setSort({ key: null, direction: "asc" });
    if (cache[dataType] === null) fetchData(dataType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataType]);

  const rawRows = useMemo(() => cache[dataType] || [], [cache, dataType]);

  const paketOptions = useMemo(() => {
    if (dataType !== "BOOTCAMP") return [];
    return [...new Set(rawRows.map((r) => r.package?.name).filter(Boolean))];
  }, [dataType, rawRows]);

  // Anggota tim gak pernah bayar sendiri -- badge pembayarannya selalu
  // "Ditanggung Ketua Tim", apa pun isi `r.payment` mentahnya (baris yang
  // sudah diprovisi punya transaksi Rp0 PAID, baris virtual belum punya
  // apa-apa -- dua-duanya sama aja dari sudut "siapa yang bayar").
  const payStatusOf = (r) => {
    if (r.team?.role === "member") return "DITANGGUNG_KETUA";
    return r.payment ? r.payment.status : "BELUM_ADA";
  };
  // Status pendaftaran yang ditampilkan -- anggota tim (baik virtual
  // maupun yang sudah diprovisi) ikut status ketua kalau ketua belum
  // diterima, atau "Menunggu Ketua Bayar" kalau ketua sudah diterima tapi
  // belum lunas. Anggota yang SUDAH diprovisi (status accepted asli di
  // DB) ditampilkan apa adanya.
  const regStatusLabelOf = (r) => {
    if (r._memberStatusOverride) return MEMBER_STATUS_LABEL[r._memberStatusOverride] || r._memberStatusOverride;
    return REG_STATUS_LABEL[r.status] || r.status;
  };
  const regStatusBadgeOf = (r) => {
    if (r._memberStatusOverride) return MEMBER_STATUS_BADGE[r._memberStatusOverride] || "";
    return REG_STATUS_BADGE[r.status] || "";
  };

  const filteredRows = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    const inDateRange = (isoStr) => {
      if (!isoStr) return !filters.dateFrom && !filters.dateTo;
      const d = isoStr.slice(0, 10);
      if (filters.dateFrom && d < filters.dateFrom) return false;
      if (filters.dateTo && d > filters.dateTo) return false;
      return true;
    };

    if (dataType === "BOOTCAMP") {
      return rawRows.filter((r) => {
        if (filters.status !== "Semua" && r.status !== filters.status) return false;
        if (filters.secondary !== "Semua" && r.package?.name !== filters.secondary) return false;
        if (filters.search) {
          const hay = `${r.user_name} ${r.user_email}`.toLowerCase();
          if (!hay.includes(search)) return false;
        }
        if (!inDateRange(r.created_at)) return false;
        return true;
      });
    }
    if (dataType === "TRANSAKSI") {
      return rawRows.filter((r) => {
        if (filters.status !== "Semua" && r.status !== filters.status) return false;
        if (filters.secondary !== "Semua" && r.product_type !== filters.secondary) return false;
        if (filters.search) {
          const hay = `${r.user_name} ${r.product_title}`.toLowerCase();
          if (!hay.includes(search)) return false;
        }
        if (!inDateRange(r.date_time)) return false;
        return true;
      });
    }
    // PENGGUNA
    return rawRows.filter((r) => {
      if (filters.status !== "Semua" && r.status !== filters.status) return false;
      if (filters.secondary !== "Semua" && r.role !== filters.secondary) return false;
      if (filters.search) {
        const hay = `${r.fullname} ${r.email}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      if (!inDateRange(r.created_at)) return false;
      return true;
    });
  }, [dataType, rawRows, filters]);

  // --- Definisi kolom (dipakai buat tabel & CSV) per jenis data ---
  const columns = useMemo(() => {
    if (dataType === "BOOTCAMP") {
      return [
        { key: "user_name", label: "Nama", get: (r) => r.user_name },
        { key: "user_email", label: "Email", get: (r) => r.user_email },
        { key: "package", label: "Paket", get: (r) => r.package?.name || "-" },
        { key: "status", label: "Status Pendaftaran", get: (r) => regStatusLabelOf(r) },
        { key: "pay_status", label: "Status Pembayaran", get: (r) => PAY_STATUS_LABEL[payStatusOf(r)] || payStatusOf(r) },
        { key: "total", label: "Total Bayar", get: (r) => (r.payment ? formatIDR(r.payment.grand_total) : "-"), sortValue: (r) => (r.payment ? Number(r.payment.grand_total) : -1) },
        { key: "team", label: "Peran Tim", get: (r) => (r.team?.role === "leader" ? "Ketua" : r.team?.role === "member" ? "Anggota" : "-") },
        { key: "leader", label: "Ketua Tim", get: (r) => (r.team?.role === "member" ? `${r.team.leader_name} (${r.team.leader_email})` : "-") },
        { key: "created_at", label: "Tanggal Daftar", get: (r) => formatDate(r.created_at), sortValue: (r) => r.created_at || "" },
        { key: "reviewed_at", label: "Tanggal Ditinjau", get: (r) => formatDate(r.reviewed_at), sortValue: (r) => r.reviewed_at || "" },
      ];
    }
    if (dataType === "TRANSAKSI") {
      return [
        { key: "user_name", label: "Nama Pembeli", get: (r) => r.user_name },
        { key: "product_title", label: "Produk", get: (r) => r.product_title || "-" },
        { key: "product_type", label: "Tipe Produk", get: (r) => PRODUCT_TYPE_LABEL[r.product_type] || r.product_type },
        { key: "date_time", label: "Tanggal", get: (r) => formatDateTime(r.date_time), sortValue: (r) => r.date_time || "" },
        { key: "amount", label: "Jumlah", get: (r) => formatIDR(r.amount), sortValue: (r) => Number(r.amount) || 0 },
        { key: "method", label: "Metode", get: (r) => r.method || "-" },
        { key: "gateway", label: "Gateway", get: (r) => r.gateway || "-" },
        { key: "status", label: "Status", get: (r) => PAY_STATUS_LABEL[r.status] || r.status },
      ];
    }
    return [
      { key: "fullname", label: "Nama", get: (r) => r.fullname },
      { key: "email", label: "Email", get: (r) => r.email },
      { key: "phone", label: "No. HP", get: (r) => r.phone || "-" },
      { key: "role", label: "Role", get: (r) => ROLE_LABEL[r.role] || r.role },
      { key: "status", label: "Status Akun", get: (r) => (r.status === "ACTIVE" ? "Aktif" : "Nonaktif") },
      { key: "created_at", label: "Tanggal Daftar", get: (r) => formatDate(r.created_at), sortValue: (r) => r.created_at || "" },
      { key: "last_login", label: "Login Terakhir", get: (r) => formatDate(r.last_login), sortValue: (r) => r.last_login || "" },
    ];
  }, [dataType]);

  // Diurutkan SETELAH difilter -- klik header kolom buat urut ascending,
  // klik lagi buat descending, klik ke-3 balik ke urutan asli (created_at
  // terbaru duluan, dari respons API). Pakai sortValue (angka/tanggal
  // mentah) kalau kolomnya nyediain -- perbandingan string hasil format
  // ("Rp1.000.000" dst) bakal salah urut buat angka/tanggal.
  const sortedRows = useMemo(() => {
    if (!sort.key) return filteredRows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return filteredRows;
    const valueOf = col.sortValue || col.get;
    const dir = sort.direction === "asc" ? 1 : -1;
    return [...filteredRows].sort((a, b) => {
      const va = valueOf(a);
      const vb = valueOf(b);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb), "id-ID") * dir;
    });
  }, [filteredRows, sort, columns]);

  const statusOptions = useMemo(() => {
    if (dataType === "BOOTCAMP") {
      return [{ value: "Semua", label: "Semua" }, ...Object.entries(REG_STATUS_LABEL).map(([value, label]) => ({ value, label }))];
    }
    if (dataType === "TRANSAKSI") {
      return [{ value: "Semua", label: "Semua" }, ...["PENDING", "PAID", "FAILED", "EXPIRED", "REFUNDED"].map((v) => ({ value: v, label: PAY_STATUS_LABEL[v] }))];
    }
    return [{ value: "Semua", label: "Semua" }, { value: "ACTIVE", label: "Aktif" }, { value: "INACTIVE", label: "Nonaktif" }];
  }, [dataType]);

  const secondaryOptions = useMemo(() => {
    if (dataType === "BOOTCAMP") return [{ value: "Semua", label: "Semua Paket" }, ...paketOptions.map((p) => ({ value: p, label: p }))];
    if (dataType === "TRANSAKSI") return [{ value: "Semua", label: "Semua Tipe Produk" }, ...Object.entries(PRODUCT_TYPE_LABEL).map(([value, label]) => ({ value, label }))];
    return [{ value: "Semua", label: "Semua Role" }, ...Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label }))];
  }, [dataType, paketOptions]);

  const secondaryLabel = dataType === "BOOTCAMP" ? "Paket" : dataType === "TRANSAKSI" ? "Tipe Produk" : "Role";
  const statusLabel = dataType === "PENGGUNA" ? "Status Akun" : "Status";

  const handleDownload = () => {
    if (filteredRows.length === 0) {
      toast.error("Gak ada data buat di-download", { description: "Sesuaikan dulu filternya." });
      return;
    }
    const prefix = dataType === "BOOTCAMP" ? "pendaftaran-bootcamp" : dataType === "TRANSAKSI" ? "transaksi" : "pengguna";
    downloadCSV(sortedRows, columns, prefix);
    toast.success("CSV berhasil dibuat", { description: `${filteredRows.length} baris terunduh.` });
  };

  return (
    <>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bold text-[22px] text-[#0F172A] flex items-center gap-2">
            <Table2 size={22} /> Eksplorasi Data
          </h1>
          <p className="text-[#64748B] text-[14px] mt-1">
            Lihat & saring data lintas jenis, lalu unduh sesuai filter yang dipakai.
          </p>
        </div>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 flex flex-col gap-5">
        <div className="flex flex-wrap items-end gap-4">
          <SelectField label="Jenis Data" value={dataType} onChange={setDataType} options={DATA_TYPES} />
          <SelectField label={statusLabel} value={filters.status} onChange={setFilter("status")} options={statusOptions} />
          <SelectField label={secondaryLabel} value={filters.secondary} onChange={setFilter("secondary")} options={secondaryOptions} />

          <div className="flex flex-col gap-1.5">
            <p className="text-[#64748B] text-[11px] uppercase font-bold tracking-wider">Dari Tanggal</p>
            <input type="date" value={filters.dateFrom} onChange={(e) => setFilter("dateFrom")(e.target.value)} className={inputCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-[#64748B] text-[11px] uppercase font-bold tracking-wider">Sampai Tanggal</p>
            <input type="date" value={filters.dateTo} onChange={(e) => setFilter("dateTo")(e.target.value)} className={inputCls} />
          </div>

          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
            <p className="text-[#64748B] text-[11px] uppercase font-bold tracking-wider">Cari</p>
            <div className="relative w-full">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Nama, email, atau produk..."
                value={filters.search}
                onChange={(e) => setFilter("search")(e.target.value)}
                className={`${inputCls} pl-9`}
              />
            </div>
          </div>

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 h-[42px] px-5 rounded-[8px] bg-[#148F89] text-white font-bold text-[13px] hover:bg-[#117A75] transition-colors"
          >
            <Download size={15} /> Download CSV
          </button>
        </div>

        <p className="text-[#64748B] text-[12.5px]">
          Menampilkan <span className="font-bold text-[#1E293B]">{filteredRows.length}</span> dari{" "}
          <span className="font-bold text-[#1E293B]">{rawRows.length}</span> total baris.
        </p>
      </div>

      {loadError && !loading && (
        <div className="bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] rounded-[8px] p-4 text-[13px]">{loadError}</div>
      )}

      {!loading && !loadError && filteredRows.length === 0 ? (
        <EmptyState message="Gak ada data yang cocok dengan filter ini." />
      ) : (
        <div className="rounded-[12px] overflow-hidden border border-[#E2E8F0] shadow-sm bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] text-left">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <tr>
                  {columns.map((c) => {
                    const isSorted = sort.key === c.key;
                    const SortIcon = isSorted ? (sort.direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
                    return (
                      <th
                        key={c.key}
                        onClick={() => toggleSort(c.key)}
                        className={`px-5 py-3.5 font-bold text-[11px] tracking-wider uppercase whitespace-nowrap cursor-pointer select-none transition-colors ${
                          isSorted ? "text-[#148F89]" : "text-[#64748B] hover:text-[#1E293B]"
                        }`}
                      >
                        <span className="inline-flex items-center gap-1">
                          {c.label}
                          <SortIcon size={12} className={isSorted ? "text-[#148F89]" : "text-[#CBD5E1]"} />
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {loading ? (
                  <tr>
                    <td colSpan={columns.length} className="px-5 py-8 text-center text-[#94A3B8]">Memuat data...</td>
                  </tr>
                ) : (
                  sortedRows.map((r, idx) => (
                    <tr key={r.id || r.transaction_id || idx} className="hover:bg-[#F8FAFC] transition-colors">
                      {columns.map((c) => (
                        <td key={c.key} className="px-5 py-3.5 text-[#334155] whitespace-nowrap">
                          {dataType === "BOOTCAMP" && c.key === "status" ? (
                            <span className={`inline-flex px-2.5 py-1 text-[10.5px] rounded-full font-bold ${regStatusBadgeOf(r)}`}>
                              {c.get(r)}
                            </span>
                          ) : dataType === "BOOTCAMP" && c.key === "pay_status" ? (
                            <span className={`inline-flex px-2.5 py-1 text-[10.5px] rounded-full font-bold ${PAY_STATUS_BADGE[payStatusOf(r)] || ""}`}>
                              {c.get(r)}
                            </span>
                          ) : dataType === "TRANSAKSI" && c.key === "status" ? (
                            <span className={`inline-flex px-2.5 py-1 text-[10.5px] rounded-full font-bold ${PAY_STATUS_BADGE[r.status] || ""}`}>
                              {c.get(r)}
                            </span>
                          ) : (
                            c.get(r)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
