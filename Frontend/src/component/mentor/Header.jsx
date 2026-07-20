"use client";

import { Menu } from "lucide-react";

export default function Header({
  title,
  onMenuClick = () => {},
  profileName = "Mentor",
  email = "",
  avatarSrc = "/images/pp.png",
}) {
  return (
    <div className="sticky top-0 z-30 w-full h-[72px] bg-[#1A1128] border-b border-white/5 flex flex-row items-center justify-between px-4 sm:px-6 lg:px-10 shadow-sm">
      {/* Judul halaman + hamburger (mobile) */}
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

      {/* User Profile -- struktur & ukuran sama persis kayak Header user */}
      <div className="flex flex-row gap-3 sm:gap-4 items-center">
        <div className="hidden sm:flex flex-col text-right">
          <p className="font-semibold text-white text-[13px]">{profileName}</p>
          <p className="text-[11px] text-[#9CA3AF]">{email}</p>
        </div>

        {/* Avatar with Gradient Border -- bulat sempurna, sama kayak user */}
        <div className="rounded-full bg-gradient-to-tr from-[#06B6D4] to-[#3B82F6] p-[2px] shadow-sm flex items-center justify-center">
          <div className="bg-[#1A1128] w-[32px] h-[32px] rounded-full overflow-hidden">
            <img
              src={avatarSrc}
              alt={profileName}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
