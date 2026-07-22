"use client";

import { Search, ChevronDown, PenLine, Eye, X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import DashboardLayout from "@/component/admin/DashboardLayout";
import StatCard from "@/component/admin/StatCard";
import EmptyState from "@/component/admin/EmptyState";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/formErrors";

const ROLE_BADGE = {
  ADMIN: "bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]",
  MENTOR: "bg-[#CCFBF1] text-[#0F766E] border-[#99F6E4]",
  STUDENT: "bg-[#DBEAFE] text-[#1D4ED8] border-[#BFDBFE]",
};
const ROLE_LABEL = { ADMIN: "Admin", MENTOR: "Mentor", STUDENT: "User" };

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function UserManagement() {
  const heightFix = `.adm-h-42 { height: 42px; } .adm-h-48 { height: 48px; }`;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("Semua Role");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formRole, setFormRole] = useState("STUDENT");
  const [formStatus, setFormStatus] = useState("ACTIVE");
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter !== "Semua Role") params.set("role", roleFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      const res = await apiRequest(`/api/accounts/users/?${params.toString()}`);
      setUsers(res?.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  useEffect(() => {
    document.body.style.overflow = isEditOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isEditOpen]);

  const openEdit = (item) => {
    setSelectedUser(item);
    setFormRole(item.role);
    setFormStatus(item.status);
    setIsEditOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiRequest(`/api/accounts/users/${selectedUser.id}/update/`, {
        method: "PATCH",
        body: { role: formRole, status: formStatus },
      });
      setIsEditOpen(false);
      fetchUsers();
      toast.success("Perubahan Disimpan", { description: `Data ${selectedUser.fullname} berhasil diperbarui.` });
    } catch (err) {
      toast.error("Gagal Menyimpan Perubahan", {
        description: extractErrorMessage(err, "Terjadi kesalahan."),
      });
    } finally {
      setSaving(false);
    }
  };

  const totalUsers = users.length;
  const totalStudents = users.filter((u) => u.role === "STUDENT").length;
  const totalMentors = users.filter((u) => u.role === "MENTOR").length;

  return (
    <DashboardLayout title="Manajemen User">
      <style>{heightFix}</style>

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bold text-[22px] text-[#0F172A]">Manajemen User</h1>
          <p className="text-[#64748B] text-[14px] mt-1">
            Kelola akses, peran, dan status seluruh pengguna platform MARK-UP.
          </p>
        </div>
        <div className="relative" style={{ width: "260px" }}>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau email..."
            className="w-full adm-h-42 bg-white border border-[#E2E8F0] rounded-[8px] pl-10 pr-4 outline-none focus:border-[#148F89] transition-colors text-[13px] text-[#1E293B]"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <StatCard label="Total User" value={totalUsers} unit="akun" />
        <StatCard label="User Biasa" value={totalStudents} unit="akun" />
        <StatCard label="Mentor" value={totalMentors} unit="akun" variant="primary" />
      </div>

      <div className="flex flex-col gap-4">
        <div className="bg-white p-4 rounded-[12px] flex items-center gap-4 flex-wrap border border-[#E2E8F0] shadow-sm">
          <div className="relative flex items-center">
            <span className="text-[#64748B] text-[13px] mr-2">Filter Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="adm-h-42 pl-3 pr-8 bg-white border border-[#E2E8F0] rounded-[8px] text-[13px] font-semibold text-[#1E293B] appearance-none outline-none cursor-pointer"
            >
              <option value="Semua Role">Semua Role</option>
              <option value="ADMIN">Admin</option>
              <option value="MENTOR">Mentor</option>
              <option value="STUDENT">User</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 text-[#64748B] pointer-events-none" />
          </div>
        </div>

        {!loading && users.length === 0 ? (
          <EmptyState message="Nggak ada user yang cocok sama filter ini." />
        ) : (
          <div className="rounded-[12px] overflow-hidden border border-[#E2E8F0] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-6 py-3.5 text-left font-bold text-[#64748B] tracking-wider text-[11px]">PROFIL</th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">ROLE</th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">BERGABUNG</th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">STATUS</th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] bg-white">
                  {users.map((item) => (
                    <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            style={{ width: "38px", height: "38px" }}
                            className="rounded-full overflow-hidden border border-[#E2E8F0] shrink-0 bg-[#F1F5F9]"
                          >
                            <img
                              src={item.profile_image || "/images/default-avatar.svg"}
                              alt={item.fullname}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-[#1E293B] text-[13.5px]">{item.fullname}</span>
                            <span className="text-[#94A3B8] text-[12px]">{item.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-3 py-1 text-[11px] rounded-[6px] font-semibold border ${ROLE_BADGE[item.role]}`}>
                          {ROLE_LABEL[item.role]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <p className="font-semibold text-[#1E293B] text-[12.5px]">{formatDate(item.created_at)}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex px-3 py-1 text-[11px] rounded-full font-bold ${item.status === "ACTIVE" ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#FEE2E2] text-[#991B1B]"}`}
                        >
                          {item.status === "ACTIVE" ? "AKTIF" : "NONAKTIF"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <Link href={`/admin/user-management/${item.id}`}>
                            <Eye size={17} className="cursor-pointer text-[#94A3B8] hover:text-[#148F89] transition-colors" />
                          </Link>
                          <PenLine
                            size={17}
                            onClick={() => openEdit(item)}
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
        <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setIsEditOpen(false)} />
      )}
      <div
        style={{ width: "560px", maxWidth: "100%" }}
        className={`fixed top-0 right-0 h-screen bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out flex flex-col overflow-y-auto ${isEditOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="w-full shrink-0 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col justify-center px-8 py-6 gap-1">
          <div className="flex justify-between items-center">
            <p className="text-[#1E293B] text-[19px] font-bold">Ubah Role & Status</p>
            <button onClick={() => setIsEditOpen(false)} className="p-2 hover:bg-[#E2E8F0] rounded-full transition-colors">
              <X className="text-[#64748B]" size={20} />
            </button>
          </div>
          <p className="text-[#64748B] text-[13px]">Atur ulang level akses dan status akun.</p>
        </div>

        <div className="px-8 py-6 flex flex-col gap-5">
          <div className="flex items-center gap-4 bg-[#F8FAFC] p-4 rounded-[8px] border border-[#E2E8F0]">
            <div
              style={{ width: "56px", height: "56px" }}
              className="rounded-full overflow-hidden border border-[#E2E8F0] shrink-0 bg-white"
            >
              <img
                src={selectedUser?.profile_image || "/images/default-avatar.svg"}
                alt="avatar"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[#1E293B] text-[15px]">{selectedUser?.fullname}</span>
              <span className="text-[#64748B] text-[13px]">{selectedUser?.email}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">Role User</p>
            <div className="relative w-full">
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value)}
                className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 pr-10 appearance-none outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
              >
                <option value="ADMIN">Admin</option>
                <option value="MENTOR">Mentor</option>
                <option value="STUDENT">User</option>
              </select>
              <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
            </div>
            <p className="text-[#94A3B8] text-[11px] leading-relaxed">
              Semua orang daftar sebagai User biasa. Naikin ke Mentor kalau udah
              lolos seleksi jadi pemateri (lengkapin profil mentor-nya
              belakangan lewat halaman Mentor).
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">Status Akun</p>
            <div className="relative w-full">
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 pr-10 appearance-none outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
              >
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Nonaktif (Suspend)</option>
              </select>
              <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
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
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-[#148F89] text-white font-bold rounded-[8px] hover:bg-[#117A75] transition-colors disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
