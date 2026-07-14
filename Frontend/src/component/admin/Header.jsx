"use client";

import { Bell } from "lucide-react";

export default function Header({ judulHalaman = "Dashboard" }) {
  return (
    <header
      style={{ height: "88px" }}
      className="sticky top-0 z-30 w-full bg-white border-b border-[#E2E8F0] flex items-center justify-between px-8"
    >
      <div>
        <p className="text-[#1E293B] font-bold text-[18px]">{judulHalaman}</p>
      </div>

      <div className="flex items-center gap-5">
        <button
          aria-label="Notifikasi"
          style={{ width: "36px", height: "36px" }}
          className="relative rounded-full flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
        >
          <Bell size={18} />
          <span
            style={{ width: "6px", height: "6px" }}
            className="absolute top-1.5 right-2 rounded-full bg-[#DC2626]"
          />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-[#E2E8F0]">
          {/* Sebelumnya "hidden sm:block" -- itu prefix responsive Tailwind
              yang KETERBUKTI nggak ke-compile di project ini (kasus sama
              persis yang bikin gambar halaman login ilang total kemarin).
              Sekarang ditampilin terus, nggak digantung ke breakpoint. */}
          <div className="text-right">
            {/* TODO: ganti dengan data admin dari session/auth context */}
            <p className="text-[13px] font-semibold text-[#1E293B] leading-tight whitespace-nowrap">
              Affan Fathir D.
            </p>
            <p className="text-[11px] text-[#94A3B8] whitespace-nowrap">
              Associate IT
            </p>
          </div>
          <div
            style={{ width: "36px", height: "36px" }}
            className="rounded-full overflow-hidden border border-[#E2E8F0] shrink-0"
          >
            <img
              src="/images/pp.png"
              alt="Avatar admin"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}