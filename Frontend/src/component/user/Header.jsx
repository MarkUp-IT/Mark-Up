"use client";

import { Menu, Bell } from "lucide-react";

export default function Header({
  title,
  onMenuClick = () => {},
  // TODO: ganti dengan data user dari session/auth context, bukan hardcode
  profileName = "Irvan",
  email = "irvanbet@gmail.com",
}) {
  return (
    <div className="sticky top-0 z-30 w-full h-[72px] bg-[#1A1128] border-b border-white/5 flex flex-row items-center justify-between px-4 sm:px-6 lg:px-10 shadow-sm">
      {/* Judul halaman + hamburger (mobile) menggantikan nav marketing */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          aria-label="Buka menu"
          className="lg:hidden text-[#9CA3AF] hover:text-white transition-colors"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-white font-bold text-[16px] sm:text-[18px]">
          {title}
        </h1>
      </div>

      {/* User Profile */}
      <div className="flex flex-row gap-3 sm:gap-4 items-center">
        <button
          aria-label="Notifikasi"
          className="text-[#9CA3AF] hover:text-white transition-colors"
        >
          <Bell size={20} />
        </button>

        <div className="hidden sm:flex flex-col text-right">
          <p className="font-semibold text-white text-[13px]">{profileName}</p>
          <p className="text-[11px] text-[#9CA3AF]">{email}</p>
        </div>

        {/* Avatar with Gradient Border */}
        <div className="rounded-full bg-gradient-to-tr from-[#06B6D4] to-[#3B82F6] p-[2px] shadow-sm flex items-center justify-center">
          <div className="bg-[#1A1128] w-[32px] h-[32px] rounded-full overflow-hidden">
            <img
              src="/images/pp.png"
              alt={profileName}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
