"use client";

import { Search, ChevronDown, PenLine, Eye, X } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/component/admin/DashboardLayout";
import StatCard from "@/component/admin/StatCard";
import EmptyState from "@/component/admin/EmptyState";

// Disamain sama users.role -- sebelumnya pakai "Student" yang nggak ada di
// ENUM manapun, harusnya "User" (role default akun baru daftar).
const ROLE_BADGE = {
  Admin: "bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]",
  Mentor: "bg-[#CCFBF1] text-[#0F766E] border-[#99F6E4]",
  User: "bg-[#DBEAFE] text-[#1D4ED8] border-[#BFDBFE]",
};

export default function UserManagement() {
  const heightFix = `.adm-h-42 { height: 42px; } .adm-h-48 { height: 48px; }`;

  const users = [
    {
      id: "#12345",
      name: "Nicco Cahya Permana",
      email: "nicco@markup.com",
      avatar: "/images/pp.png",
      role: "Admin",
      joinDate: "12 Jan 2026",
      lastLogin: "2 jam lalu",
      status: "Aktif",
    },
    {
      id: "#12346",
      name: "Alya Hamidah",
      email: "alya.h@markup.com",
      avatar: "/images/pp.png",
      role: "Mentor",
      joinDate: "15 Feb 2026",
      lastLogin: "1 hari lalu",
      status: "Aktif",
    },
    {
      id: "#12347",
      name: "Prabroro Subriantoro",
      email: "prabroro@gmail.com",
      avatar: "/images/pp.png",
      role: "User",
      joinDate: "3 Mar 2026",
      lastLogin: "5 jam lalu",
      status: "Aktif",
    },
    {
      id: "#12348",
      name: "Fathir Ramadhan",
      email: "fathir.r@gmail.com",
      avatar: "/images/pp.png",
      role: "User",
      joinDate: "10 Apr 2026",
      lastLogin: "2 minggu lalu",
      status: "Nonaktif",
    },
    {
      id: "#12349",
      name: "Adena Laksita",
      email: "adena.l@markup.com",
      avatar: "/images/pp.png",
      role: "Mentor",
      joinDate: "22 Mei 2026",
      lastLogin: "3 jam lalu",
      status: "Aktif",
    },
  ];

  const [selectAll, setSelectAll] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleFilter, setRoleFilter] = useState("Semua Role");

  useEffect(() => {
    document.body.style.overflow = isEditOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isEditOpen]);

  const filtered =
    roleFilter === "Semua Role"
      ? users
      : users.filter((u) => u.role === roleFilter);

  return (
    <DashboardLayout title="Manajemen User">
      <style>{heightFix}</style>

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bold text-[22px] text-[#0F172A]">
            Manajemen User
          </h1>
          <p className="text-[#64748B] text-[14px] mt-1">
            Kelola akses, peran, dan status seluruh pengguna platform MARK-UP.
          </p>
        </div>
        <div className="relative" style={{ width: "260px" }}>
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
            size={16}
          />
          <input
            type="text"
            placeholder="Cari nama atau email..."
            className="w-full adm-h-42 bg-white border border-[#E2E8F0] rounded-[8px] pl-10 pr-4 outline-none focus:border-[#148F89] transition-colors text-[13px] text-[#1E293B]"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <StatCard label="Total User" value="151" unit="akun" />
        <StatCard label="User Biasa" value="101" unit="akun" />
        <StatCard label="Mentor" value="30" unit="akun" variant="primary" />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 bg-white border border-[#E2E8F0] px-4 py-2.5 rounded-[8px]">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={() => setSelectAll(!selectAll)}
              className="w-4 h-4 rounded border-[#CBD5E1] text-[#148F89] focus:ring-[#148F89] cursor-pointer"
            />
            <span className="text-[13px] font-semibold text-[#475569]">
              Pilih Semua
            </span>
          </div>
          <div className="relative flex items-center">
            <span className="text-[#64748B] text-[13px] mr-2">
              Filter Role:
            </span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="adm-h-42 pl-3 pr-8 bg-white border border-[#E2E8F0] rounded-[8px] text-[13px] font-semibold text-[#1E293B] appearance-none outline-none cursor-pointer"
            >
              <option>Semua Role</option>
              <option>Admin</option>
              <option>Mentor</option>
              <option>User</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 text-[#64748B] pointer-events-none"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState message="Nggak ada user yang cocok sama filter ini." />
        ) : (
          <div className="rounded-[12px] overflow-hidden border border-[#E2E8F0] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-6 py-3.5" style={{ width: "50px" }}></th>
                    <th className="px-6 py-3.5 text-left font-bold text-[#64748B] tracking-wider text-[11px]">
                      ID USER
                    </th>
                    <th className="px-6 py-3.5 text-left font-bold text-[#64748B] tracking-wider text-[11px]">
                      PROFIL
                    </th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                      ROLE
                    </th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                      BERGABUNG
                    </th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                      STATUS
                    </th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                      AKSI
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] bg-white">
                  {filtered.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-[#F8FAFC] transition-colors"
                    >
                      <td className="px-6 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          readOnly
                          className="w-4 h-4 rounded border-[#CBD5E1] text-[#148F89] cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 text-[#64748B] font-medium">
                        {item.id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            style={{ width: "38px", height: "38px" }}
                            className="rounded-full overflow-hidden border border-[#E2E8F0] shrink-0"
                          >
                            <img
                              src={item.avatar}
                              alt={item.name}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-[#1E293B] text-[13.5px]">
                              {item.name}
                            </span>
                            <span className="text-[#94A3B8] text-[12px]">
                              {item.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex px-3 py-1 text-[11px] rounded-[6px] font-semibold border ${ROLE_BADGE[item.role]}`}
                        >
                          {item.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <p className="font-semibold text-[#1E293B] text-[12.5px]">
                          {item.joinDate}
                        </p>
                        <p className="text-[#94A3B8] text-[11px] mt-0.5">
                          Login: {item.lastLogin}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex px-3 py-1 text-[11px] rounded-full font-bold ${item.status === "Aktif" ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#FEE2E2] text-[#991B1B]"}`}
                        >
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <Link
                            href={`/admin/user-management/${item.id.replace("#", "%23")}`}
                          >
                            <Eye
                              size={17}
                              className="cursor-pointer text-[#94A3B8] hover:text-[#148F89] transition-colors"
                            />
                          </Link>
                          <PenLine
                            size={17}
                            onClick={() => {
                              setSelectedUser(item);
                              setIsEditOpen(true);
                            }}
                            className="cursor-pointer text-[#94A3B8] hover:text-[#148F89] transition-colors"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {isEditOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setIsEditOpen(false)}
        />
      )}
      <div
        style={{ width: "560px", maxWidth: "100%" }}
        className={`fixed top-0 right-0 h-screen bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out flex flex-col overflow-y-auto ${isEditOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="w-full shrink-0 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col justify-center px-8 py-6 gap-1">
          <div className="flex justify-between items-center">
            <p className="text-[#1E293B] text-[19px] font-bold">
              Ubah Role & Status
            </p>
            <button
              onClick={() => setIsEditOpen(false)}
              className="p-2 hover:bg-[#E2E8F0] rounded-full transition-colors"
            >
              <X className="text-[#64748B]" size={20} />
            </button>
          </div>
          <p className="text-[#64748B] text-[13px]">
            Atur ulang level akses dan status akun.
          </p>
        </div>

        <div className="px-8 py-6 flex flex-col gap-5">
          <div className="flex items-center gap-4 bg-[#F8FAFC] p-4 rounded-[8px] border border-[#E2E8F0]">
            <div
              style={{ width: "56px", height: "56px" }}
              className="rounded-full overflow-hidden border border-[#E2E8F0] shrink-0"
            >
              <img
                src={selectedUser?.avatar}
                alt="avatar"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[#1E293B] text-[15px]">
                {selectedUser?.name}
              </span>
              <span className="text-[#64748B] text-[13px] mb-1">
                {selectedUser?.email}
              </span>
              <span className="text-[#94A3B8] text-[12px]">
                ID: {selectedUser?.id}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Role User
            </p>
            <div className="relative w-full">
              <select
                defaultValue={selectedUser?.role || "User"}
                className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 pr-10 appearance-none outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
              >
                <option value="Admin">Admin</option>
                <option value="Mentor">Mentor</option>
                <option value="User">User</option>
              </select>
              <ChevronDown
                size={18}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none"
              />
            </div>
            <p className="text-[#94A3B8] text-[11px] leading-relaxed">
              Semua orang daftar sebagai User biasa. Naikin ke Mentor kalau udah
              lolos seleksi jadi pemateri (lengkapin profil mentor-nya
              belakangan lewat halaman Mentor).
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Status Akun
            </p>
            <div className="relative w-full">
              <select
                defaultValue={selectedUser?.status || "Aktif"}
                className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 pr-10 appearance-none outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
              >
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif (Suspend)</option>
              </select>
              <ChevronDown
                size={18}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none"
              />
            </div>
          </div>
        </div>

        <div className="mt-auto p-6 bg-white border-t border-[#E2E8F0] flex gap-3">
          <button
            onClick={() => setIsEditOpen(false)}
            className="flex-1 py-3 bg-white border border-[#E2E8F0] text-[#475569] font-bold rounded-[8px] hover:bg-[#F8FAFC] transition-colors"
          >
            Batal
          </button>
          <button className="flex-1 py-3 bg-[#148F89] text-white font-bold rounded-[8px] hover:bg-[#117A75] transition-colors">
            Simpan Perubahan
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
