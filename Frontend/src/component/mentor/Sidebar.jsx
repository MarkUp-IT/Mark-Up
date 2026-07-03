"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Contact,
  Users,
  ShieldCheck,
  Receipt,
  Settings,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const menuList = [
    { name: "Active Classes", url: "/mentor/active-classes", icon: LayoutDashboard },
    {
      name: "Mentoring Schedule",
      url: "/mentor/mentoring-schedule",
      icon: CalendarDays,
    },
    { name: "Certificates", url: "/mentor/certificates", icon: ShieldCheck },
    { name: "Transactions", url: "/mentor/transactions", icon: Receipt },
    { name: "Settings", url: "/mentor/settings", icon: Settings },
  ];

  const currentPath = pathname || "/mentor/active-classes";

  return (
    <div className="fixed top-0 left-0 w-[288px] h-screen bg-[#1A1128] border-r border-white/5 flex flex-col justify-between py-8 px-4 z-50 overflow-y-auto no-scrollbar">
      <div>
        {/* Brand Logo Area */}
        <div className="flex flex-col mb-10 px-4">
          <div className="flex items-center gap-2">
            <svg
              width="24"
              height="24"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="6" cy="24" r="4" fill="#FBBF24" />
              <path
                d="M10 24L16 12L20 20L28 4"
                stroke="#A855F7"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14 28L20 16L24 24L32 8"
                stroke="#3B82F6"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-80"
              />
            </svg>
            <h1 className="text-[24px] font-black text-white tracking-tight">
              MARK-UP
            </h1>
          </div>
          <span className="text-[11px] font-bold text-[#148F89] tracking-widest mt-1">
            MENTOR
          </span>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-2">
          {menuList.map((menu, index) => {
            // Fallback for preview matching
            const isPreviewActive =
              menu.name === "Mentoring Schedule" && currentPath === "/";
            const isActive = currentPath.includes(menu.url) || isPreviewActive;
            const Icon = menu.icon;

            return (
              <Link
                key={index}
                href={menu.url}
                className={`flex items-center gap-3 px-4 py-3 rounded-[8px] cursor-pointer transition-all ${
                  isActive
                    ? "bg-[#148F89] text-white shadow-sm"
                    : "text-[#9CA3AF] hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={20} />
                <span className="font-medium text-[14px]">{menu.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout Button */}
      <div className="px-4">
        <button className="w-full bg-[#E11D48] text-white font-bold py-3 rounded-[8px] hover:bg-[#BE123C] transition-colors text-[14px] shadow-sm">
          Logout
        </button>
      </div>
    </div>
  );
}
