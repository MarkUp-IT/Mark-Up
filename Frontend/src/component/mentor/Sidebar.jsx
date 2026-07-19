"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { api, clearTokens } from "@/lib/api";
import {
  GraduationCap,
  CalendarDays,
  ShieldCheck,
  Star,
  Receipt,
  Settings,
  LogOut,
  X,
} from "lucide-react";

const menuList = [
  {
    name: "Active Classes",
    url: "/mentor/active-classes",
    icon: GraduationCap,
  },
  {
    name: "Mentoring Schedule",
    url: "/mentor/mentoring-schedule",
    icon: CalendarDays,
  },
  { name: "Certificates", url: "/mentor/certificates", icon: ShieldCheck },
  { name: "Reviews", url: "/mentor/reviews", icon: Star },
  { name: "Transactions", url: "/mentor/transactions", icon: Receipt },
  { name: "Settings", url: "/mentor/settings", icon: Settings },
];

export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  const pathname = usePathname() || "/mentor/active-classes";
  const router = useRouter();

  async function handleLogout() {
    try {
      await api.post("/api/accounts/logout/", {}, { auth: true });
    } catch (err) {
      console.error(err);
    } finally {
      clearTokens();
      router.push("/login");
    }
  }

  return (
    <div
      className={`fixed top-0 left-0 w-[288px] h-screen bg-[#1A1128] border-r border-white/5 flex flex-col justify-between py-8 z-50 overflow-y-auto no-scrollbar transform transition-transform duration-300 ease-in-out
      ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
    >
      <div>
        {/* Brand Logo Area -- sama persis kayak Sidebar user (Image logo-single.svg),
            cuma ditambah label peran "MENTOR" di bawahnya */}
        <div className="flex items-center justify-between mb-2 px-8">
          <div className="flex items-center gap-3">
            <Image
              src="/images/logo-single.svg"
              alt="Mark-Up"
              width={40}
              height={40}
            />
            <h1 className="text-[24px] font-black text-white tracking-tight">
              MARK-UP
            </h1>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup menu"
            className="lg:hidden text-[#9CA3AF] hover:text-white transition-colors"
          >
            <X size={22} />
          </button>
        </div>
        <div className="px-8 mb-8">
          <span className="text-[11px] font-bold text-[#148F89] tracking-widest">
            MENTOR
          </span>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-2 px-4">
          {menuList.map((menu, index) => {
            const isActive = pathname.startsWith(menu.url);
            const Icon = menu.icon;

            return (
              <Link
                key={index}
                href={menu.url}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-[8px] cursor-pointer transition-all ${
                  isActive
                    ? "bg-[#148F89] text-white shadow-md"
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

      {/* Logout -- pakai treatment tombol yang sama kayak "Bantuan" di Sidebar
          user (border + tint bg + teks warna), cuma pakai merah karena ini aksi
          yang beda sifatnya */}
      <div className="px-6 pb-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 border border-[#E11D48]/50 bg-[#E11D48]/10 text-[#E11D48] font-bold py-3 rounded-[8px] hover:bg-[#E11D48] hover:text-white transition-colors text-[14px] cursor-pointer"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );
}
