"use client";

import {
  Bell,
  Settings,
  Search,
  X,
  ChevronDown,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/component/admin/Sidebar";
import Header from "@/component/admin/Header";

export default function BootcampPage() {
  const bootcamps = [
    {
      id: "1",
      title: "Bootcamp Business Plan - Batch 4",
      peserta: 120,
      sesi: 5,
      unassigned: 5,
      pending: 5,
    },
    {
      id: "2",
      title: "Bootcamp Business Plan - Batch 3",
      peserta: 120,
      sesi: 5,
      unassigned: 5,
      pending: 5,
    },
    {
      id: "3",
      title: "Bootcamp Business Plan - Batch 2",
      peserta: 120,
      sesi: 5,
      unassigned: 0,
      pending: 0,
    },
    {
      id: "4",
      title: "Bootcamp Business Plan - Batch 1",
      peserta: 120,
      sesi: 5,
      unassigned: 0,
      pending: 0,
    },
  ];

  const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);

  useEffect(() => {
    if (isAddSessionOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isAddSessionOpen]);

  return (
    <div className="w-full font-inter text-black bg-[#F8FAFC] min-h-screen relative flex flex-row overflow-x-hidden">
      <Sidebar />
      <div className="ml-[288px]">
        <Header judulHalaman="Bootcamp Management" />
        <div className="flex-1 flex items-center py-5 flex-col gap-5 px-10 bg-white min-h-screen">
          {/* Title Area */}
          <div className="flex flex-row items-center justify-between w-[1158px] mt-2">
            <div className="flex flex-col gap-1">
              <p className="font-bold text-[25px]">Manajemen Konten Bootcamp</p>
              <p className="text-[#64748B] text-[15px]">
                Kelola sesi sinkronus, bagikan link Zoom, dan pantau progres
                peserta untuk setiap batch aktif.
              </p>
            </div>
            <button
              onClick={() => setIsAddSessionOpen(true)}
              className="bg-[#4C1D95] h-[43.5px] px-6 text-white font-semibold rounded-[6.75px] hover:bg-[#3B0764] transition-colors shadow-sm"
            >
              Tambah Sesi
            </button>
          </div>

          {/* Stats Cards */}
          <div className="w-[1158px] flex justify-between gap-5 mt-2">
            <div className="bg-[#F8FAFC] flex-1 h-[140px] rounded-[9px] flex flex-col justify-center px-7 shadow-sm border border-[#E2E8F0]">
              <p className="text-[#43474D] font-bold text-[14px] tracking-wide">
                TOTAL ACTION REQUIRED
              </p>
              <div className="flex flex-row items-baseline gap-2 mt-2">
                <p className="font-bold text-[48px] text-[#0F172A] leading-none">
                  151
                </p>
                <span className="text-[#64748B] text-[16px] font-medium">
                  sessions
                </span>
              </div>
            </div>
            <div className="bg-[#F0564A] flex-1 h-[140px] rounded-[9px] flex flex-col justify-center px-7 shadow-sm">
              <p className="text-white font-bold text-[14px] tracking-wide">
                UNASSIGNED MENTOR
              </p>
              <div className="flex flex-row items-baseline gap-2 mt-2">
                <p className="font-bold text-[48px] text-white leading-none">
                  8
                </p>
                <span className="text-white text-[16px] font-medium">
                  sessions
                </span>
              </div>
            </div>
            <div className="bg-[#F0564A] flex-1 h-[140px] rounded-[9px] flex flex-col justify-center px-7 shadow-sm">
              <p className="text-white font-bold text-[14px] tracking-wide">
                PENDING LINKS
              </p>
              <div className="flex flex-row items-baseline gap-2 mt-2">
                <p className="font-bold text-[48px] text-white leading-none">
                  3
                </p>
                <span className="text-white text-[16px] font-medium">
                  sessions
                </span>
              </div>
            </div>
          </div>

          {/* List of Bootcamps */}
          <div className="w-[1158px] flex flex-col gap-4 mt-4">
            {bootcamps.map((bootcamp, index) => (
              <div
                key={index}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-5 flex flex-row items-center justify-between shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-row items-center gap-5">
                  <div className="w-[60px] h-[60px] bg-[#E2E8F0] rounded-[6px]"></div>
                  <div className="flex flex-col gap-1">
                    <p className="font-bold text-[16px] text-[#1E293B]">
                      {bootcamp.title}
                    </p>
                    <p className="text-[13px] text-[#64748B] font-medium">
                      <span className="text-[#1E293B] font-bold">
                        {bootcamp.peserta}
                      </span>{" "}
                      Peserta •{" "}
                      <span className="text-[#1E293B] font-bold">
                        {bootcamp.sesi}
                      </span>{" "}
                      Sesi •{" "}
                      <span className="text-[#1E293B] font-bold">
                        {bootcamp.unassigned}
                      </span>{" "}
                      Unassigned Mentor •{" "}
                      <span className="text-[#1E293B] font-bold">
                        {bootcamp.pending}
                      </span>{" "}
                      Pending Links
                    </p>
                  </div>
                </div>
                <Link
                  href={`/admin/produk/bootcamp/${bootcamp.id}`}
                  className="font-bold text-[#4C1D95] text-[14px] hover:underline"
                >
                  Lihat Detail
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Session Slide-out Sidebar */}
      {isAddSessionOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsAddSessionOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 right-0 h-screen w-[500px] bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out flex flex-col overflow-y-auto ${
          isAddSessionOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="w-full p-8 border-b border-[#E2E8F0] flex flex-row justify-between items-start bg-[#F8FAFC]">
          <div className="flex flex-col">
            <p className="text-[#1E293B] text-[18px] font-bold">TAMBAH SESI</p>
            <p className="text-[#64748B] text-[14px]">
              Atur jadwal, tambah, kurangi sesi bootcamp
            </p>
          </div>
          <button
            onClick={() => setIsAddSessionOpen(false)}
            className="p-1 hover:bg-[#E2E8F0] rounded-full transition-colors"
          >
            <X className="cursor-pointer text-[#64748B]" size={20} />
          </button>
        </div>

        <div className="p-8 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              JUDUL SESI
            </p>
            <input
              type="text"
              placeholder="Masukan nama sesi..."
              className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 outline-none focus:border-[#4C1D95] transition-all text-[#1E293B]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              NAMA MENTOR
            </p>
            <div className="relative w-full">
              <select className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 pr-10 appearance-none outline-none focus:border-[#4C1D95] transition-all text-[#475569]">
                <option>-- Pilih Nama Mentor --</option>
                <option>Mulyy</option>
                <option>Prabyy</option>
              </select>
              <ChevronDown
                size={18}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              LINK ZOOM
            </p>
            <input
              type="url"
              placeholder="Enter product transaction link..."
              className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 outline-none focus:border-[#4C1D95] transition-all text-[#1E293B]"
            />
          </div>

          <div className="flex gap-4 w-full">
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
                JADWAL SESI
              </p>
              <div className="relative">
                <input
                  type="text"
                  placeholder="DD/MM/YYYY"
                  className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 outline-none focus:border-[#4C1D95] transition-all text-[#1E293B]"
                />
                <CalendarIcon
                  size={16}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
                TIME
              </p>
              <div className="relative">
                <input
                  type="text"
                  placeholder="09.00"
                  className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 outline-none focus:border-[#4C1D95] transition-all text-[#1E293B]"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] text-[13px] font-medium pointer-events-none">
                  WIB
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto p-6 bg-white border-t border-[#E2E8F0] flex gap-4">
          <button
            onClick={() => setIsAddSessionOpen(false)}
            className="flex-1 py-3 bg-white border border-[#CBD5E1] text-[#475569] font-bold rounded-[8px] hover:bg-[#F8FAFC] transition-colors"
          >
            Discard Draft
          </button>
          <button className="flex-1 py-3 bg-[#4C1D95] text-white font-bold rounded-[8px] hover:bg-[#3B0764] transition-colors shadow-sm">
            Confirm Draft
          </button>
        </div>
      </div>
    </div>
  );
}
