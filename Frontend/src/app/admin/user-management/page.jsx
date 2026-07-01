"use client";

import { Search, ChevronDown, PenLine, X } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/component/admin/Sidebar";
import Header from "@/component/admin/Header";

export default function UserManagement() {
  const [selectAll, setSelectAll] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Mock Data User
  const users = [
    {
      id_user: "#12345",
      name: "Anisa Rahmawati",
      email: "anisa.rahma@axiom.pro",
      avatar: "https://i.pravatar.cc/150?img=5",
      role: "Admin",
      joinDate: "12 Jan 2024",
      lastLogin: "2h ago",
      status: "Active",
    },
    {
      id_user: "#12346",
      name: "Anisa Rahmawati",
      email: "anisa.rahma@axiom.pro",
      avatar: "https://i.pravatar.cc/150?img=5",
      role: "Mentor",
      joinDate: "12 Jan 2024",
      lastLogin: "2h ago",
      status: "Active",
    },
    {
      id_user: "#12347",
      name: "Anisa Rahmawati",
      email: "anisa.rahma@axiom.pro",
      avatar: "https://i.pravatar.cc/150?img=5",
      role: "Student",
      joinDate: "12 Jan 2024",
      lastLogin: "2h ago",
      status: "Active",
    },
    {
      id_user: "#12348",
      name: "Anisa Rahmawati",
      email: "anisa.rahma@axiom.pro",
      avatar: "https://i.pravatar.cc/150?img=5",
      role: "Student",
      joinDate: "12 Jan 2024",
      lastLogin: "2h ago",
      status: "Deactive",
    },
    {
      id_user: "#12349",
      name: "Anisa Rahmawati",
      email: "anisa.rahma@axiom.pro",
      avatar: "https://i.pravatar.cc/150?img=5",
      role: "Student",
      joinDate: "12 Jan 2024",
      lastLogin: "2h ago",
      status: "Active",
    },
  ];

  // Efek untuk mengunci scroll saat drawer terbuka
  useEffect(() => {
    if (isEditOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isEditOpen]);

  // Helper Badge
  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case "Admin":
        return "bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]";
      case "Mentor":
        return "bg-[#F3E8FF] text-[#7E22CE] border-[#D8B4FE]";
      case "Student":
        return "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]";
      default:
        return "bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]";
    }
  };

  return (
    <div className="w-full font-inter text-black bg-[#F8FAFC] min-h-screen relative flex flex-row overflow-x-hidden">
      <Sidebar />
      <div className="ml-[288px]">
        <Header judulHalaman="User Management" />
        <div className="flex-1 flex items-center py-5 flex-col gap-5 px-10 bg-white min-h-screen">
          {/* Header Section */}
          <div className="flex flex-row items-center justify-between w-[1158px] mt-2">
            <div>
              <p className="font-bold text-[25px]">User Management</p>
              <p className="text-[#43474D] text-[15px]">
                Kelola akses, peran, dan status pengguna platform MARK-UP.
              </p>
            </div>
            {/* Search Bar / Filter Opsional (sesuai gambar) */}
            <div className="flex flex-row gap-4">
              <div className="relative w-[300px]">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search user name or email..."
                  className="w-full h-[43.5px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6.75px] pl-10 pr-4 outline-none focus:border-[#2563EB] transition-colors text-[13px] text-[#1E293B]"
                />
              </div>
            </div>
          </div>

          {/* Cards Section */}
          <div className="w-[1158px] flex justify-between gap-5 mt-4">
            <div className="bg-[#F8FAFC] flex-1 h-[140px] rounded-[9px] flex flex-col justify-center px-7 shadow-sm border border-[#E2E8F0]/50">
              <p className="text-[#43474D] font-bold text-[14px] tracking-wide uppercase">
                TOTAL USER
              </p>
              <div className="flex flex-row items-baseline gap-2 mt-2">
                <p className="font-bold text-[44px] text-black leading-none">
                  151
                </p>
                <span className="text-[#43474D] text-[15px] font-medium lowercase">
                  akun
                </span>
              </div>
            </div>

            <div className="bg-[#2563EB] flex-1 h-[140px] rounded-[9px] flex flex-col justify-center px-7 shadow-sm">
              <p className="text-white/80 font-bold text-[14px] tracking-wide uppercase">
                STUDENT
              </p>
              <div className="flex flex-row items-baseline gap-2 mt-2">
                <p className="font-bold text-[44px] text-white leading-none">
                  101
                </p>
                <span className="text-white/90 text-[15px] font-medium lowercase">
                  akun
                </span>
              </div>
            </div>

            <div className="bg-[#8B5CF6] flex-1 h-[140px] rounded-[9px] flex flex-col justify-center px-7 shadow-sm">
              <p className="text-white/90 font-bold text-[14px] tracking-wide uppercase">
                MENTOR
              </p>
              <div className="flex flex-row items-baseline gap-2 mt-2">
                <p className="font-bold text-[44px] text-white leading-none">
                  30
                </p>
                <span className="text-white/90 text-[15px] font-medium lowercase">
                  akun
                </span>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="w-[1158px] flex flex-col mt-6">
            <div className="flex flex-row justify-between items-center mb-4">
              <div className="flex items-center gap-3 bg-[#F8FAFC] border border-[#E2E8F0] px-4 py-2 rounded-[6px]">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={() => setSelectAll(!selectAll)}
                  className="w-4 h-4 rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB] cursor-pointer"
                />
                <span className="text-[13px] font-semibold text-[#43474D]">
                  Pilih Semua
                </span>
              </div>
              <div className="relative flex items-center">
                <span className="text-[#64748B] text-[13px] mr-2">
                  Filter by Role:
                </span>
                <select className="h-[36px] px-3 pr-8 bg-transparent text-[13px] font-bold text-[#1E293B] appearance-none outline-none cursor-pointer">
                  <option>All Roles</option>
                  <option>Admin</option>
                  <option>Mentor</option>
                  <option>Student</option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-1 text-[#64748B] pointer-events-none"
                />
              </div>
            </div>

            <div className="rounded-[8px] overflow-hidden border border-[#E2E8F0] shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <tr>
                      <th className="px-6 py-4 w-[50px]"></th>
                      <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                        ID USER
                      </th>
                      <th className="px-6 py-4 text-left font-bold text-[#43474D] tracking-wider text-[12px]">
                        USER PROFILE
                      </th>
                      <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                        ROLE
                      </th>
                      <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                        JOIN DATE
                      </th>
                      <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                        ACTIONS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] bg-white">
                    {users.map((item, index) => (
                      <tr
                        key={index}
                        className="hover:bg-[#F8FAFC] transition-colors"
                      >
                        <td className="px-6 py-5 text-center">
                          <input
                            type="checkbox"
                            checked={selectAll}
                            readOnly
                            className="w-4 h-4 rounded border-[#CBD5E1] text-[#2563EB] cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-5 text-center text-[#64748B] font-medium">
                          {item.id_user}
                        </td>
                        <td className="px-6 py-5 text-left">
                          <div className="flex items-center gap-3">
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
                        <td className="px-6 py-5 text-center">
                          <span
                            className={`inline-flex items-center justify-center px-3 py-1 text-[11px] rounded-[6px] font-semibold border ${getRoleBadgeStyle(item.role)}`}
                          >
                            {item.role}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <span className="font-semibold text-[#1E293B] text-[13px]">
                              {item.joinDate}
                            </span>
                            <span className="text-[#94A3B8] text-[11px] mt-0.5">
                              Last login: {item.lastLogin}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className="flex flex-row items-center justify-center gap-4">
                            <PenLine
                              size={18}
                              onClick={() => {
                                setSelectedUser(item);
                                setIsEditOpen(true);
                              }}
                              className="cursor-pointer text-[#64748B] hover:text-[#2563EB] transition-colors"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
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

      {/* --- BACKGROUND OVERLAY --- */}
      {isEditOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsEditOpen(false)}
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
          ${isEditOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="w-full h-[120px] shrink-0 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col justify-center px-10 gap-1">
          <div className="flex flex-row w-full justify-between items-center">
            <p className="text-[#1E293B] text-[20px] font-bold">
              Edit User Role & Status
            </p>
            <button
              onClick={() => setIsEditOpen(false)}
              className="p-2 hover:bg-[#E2E8F0] rounded-full transition-colors"
            >
              <X className="cursor-pointer text-[#64748B]" size={20} />
            </button>
          </div>
          <p className="text-[#64748B] text-[14px]">
            Modify user access levels and account status.
          </p>
        </div>

        <div
          key={selectedUser?.id_user}
          className="px-10 py-8 flex flex-col gap-6"
        >
          {/* User Profile Info Display */}
          <div className="flex items-center gap-4 bg-[#F8FAFC] p-4 rounded-[8px] border border-[#E2E8F0]">
            <img
              src={selectedUser?.avatar}
              alt="avatar"
              className="w-14 h-14 rounded-full object-cover border border-[#CBD5E1]"
            />
            <div className="flex flex-col">
              <span className="font-bold text-[#1E293B] text-[16px]">
                {selectedUser?.name}
              </span>
              <span className="text-[#64748B] text-[13px] mb-1">
                {selectedUser?.email}
              </span>
              <span className="text-[#94A3B8] text-[12px]">
                ID: {selectedUser?.id_user}
              </span>
            </div>
          </div>

          {/* Form Role */}
          <div className="flex flex-col gap-2 mt-2">
            <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
              USER ROLE
            </p>
            <div className="relative w-full">
              <select
                defaultValue={selectedUser?.role || "Student"}
                className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 pr-10 appearance-none outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B]"
              >
                <option value="Admin">Admin</option>
                <option value="Mentor">Mentor</option>
                <option value="Student">Student</option>
              </select>
              <ChevronDown
                size={18}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none"
              />
            </div>
          </div>

          {/* Form Status */}
          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
              ACCOUNT STATUS
            </p>
            <div className="relative w-full">
              <select
                defaultValue={selectedUser?.status || "Active"}
                className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 pr-10 appearance-none outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B]"
              >
                <option value="Active">Active</option>
                <option value="Deactive">Deactive (Suspend)</option>
              </select>
              <ChevronDown
                size={18}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none"
              />
            </div>
          </div>
        </div>

        <div className="mt-auto p-6 bg-white border-t border-[#E2E8F0] flex gap-4">
          <button
            onClick={() => setIsEditOpen(false)}
            className="flex-1 py-3 bg-white border border-[#CBD5E1] text-[#475569] font-bold rounded-[8px] hover:bg-[#F8FAFC] transition-colors"
          >
            Discard Changes
          </button>
          <button className="flex-1 py-3 bg-[#2563EB] text-white font-bold rounded-[8px] hover:bg-[#1D4ED8] transition-colors shadow-sm">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
