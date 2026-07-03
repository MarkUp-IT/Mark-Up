"use client";

import React from "react";
import { Bell, Settings } from "lucide-react";

export default function Header({
  pageTitle = "Dashboard",
  profileName = "Prabroro Subriantoro",
  email = "prabrorosub@gmail.com",
}) {
  return (
    <div className="sticky top-0 z-40 w-full h-[72px] bg-[#1A1128] border-b border-white/5 flex flex-row items-center justify-between px-8 shadow-sm">
      
      {/* Page Title */}
      <div className="flex items-center">
        <p className="text-white font-bold text-[20.25px]">{pageTitle}</p>
      </div>

      <div className="flex items-center gap-8">
        {/* Action Icons */}
        <div className="flex flex-row gap-4 items-center">
          <Bell
            size={20}
            className="text-[#9CA3AF] cursor-pointer hover:text-white transition-colors"
          />
          <Settings
            size={20}
            className="text-[#9CA3AF] cursor-pointer hover:text-white transition-colors"
          />
        </div>

        {/* User Profile */}
        <div className="flex flex-row gap-4 items-center border-l border-[#2D2342] pl-8">
          <div className="flex flex-col text-right">
            <p className="font-semibold text-white text-[14.62px]">{profileName}</p>
            <p className="text-[12.37px] text-[#9CA3AF]">{email}</p>
          </div>
          
          {/* Avatar with Gradient Border */}
          <div className="rounded-[13.5px] bg-gradient-to-tr from-[#06B6D4] to-[#3B82F6] p-[2px] shadow-sm flex items-center justify-center">
            <div className="bg-[#1A1128] w-[36px] h-[36px] rounded-[11.5px] overflow-hidden">
              <img
                src="https://i.pravatar.cc/150?img=11"
                alt="avatar"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}