"use client";

import { Menu } from "lucide-react";

export default function Header({
  judulHalaman = "Dashboard",
  profileName = "Admin",
  role = "",
  avatarSrc,
  onMenuClick = () => {},
}) {
  return (
    <header
      style={{ height: "88px" }}
      className="sticky top-0 z-30 w-full bg-white border-b border-[#E2E8F0] flex items-center justify-between px-4 sm:px-8"
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Buka menu"
          className="lg:hidden text-[#64748B] hover:text-[#1E293B] transition-colors"
        >
          <Menu size={22} />
        </button>
        <p className="text-[#1E293B] font-bold text-[18px]">{judulHalaman}</p>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-[13px] font-semibold text-[#1E293B] leading-tight whitespace-nowrap">
              {profileName}
            </p>
            <p className="text-[11px] text-[#94A3B8] whitespace-nowrap">
              {role}
            </p>
          </div>
          <div
            style={{ width: "36px", height: "36px" }}
            className="rounded-full overflow-hidden border border-[#E2E8F0] shrink-0"
          >
            <img
              src={avatarSrc || "/images/default-avatar.svg"}
              alt="Avatar admin"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}