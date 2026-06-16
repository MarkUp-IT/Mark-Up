"use client";

import {
  LayoutDashboard,
  Package,
  Trophy,
  ReceiptText,
  MessageSquare,
  History,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const daftarMenu = [
    { nama: "Dashboard", url: "/admin", icon: LayoutDashboard },
    { nama: "Produk", url: "/admin/produk", icon: Package },
    { nama: "Info Lomba", url: "/admin/lomba", icon: Trophy },
    { nama: "Transaksi", url: "/admin/transaksi", icon: ReceiptText },
    { nama: "Ulasan", url: "/admin/ulasan", icon: MessageSquare },
    { nama: "Audit Trail", url: "/admin/audit", icon: History },
  ];

  const currentPath = pathname || "/admin/produk";

  return (
    <div className="fixed top-0 left-0 w-[288px] h-screen bg-[#F8FAFC] border-r border-[#E2E8F0] flex flex-col justify-between py-8 px-4 z-10">
      <div>
        <div className="flex flex-col mb-10 px-4">
          <h1 className="text-[24px] font-black text-[#1E293B] tracking-tight">
            MARK-UP
          </h1>
          <span className="text-[11px] font-bold text-[#64748B] tracking-widest mt-1">
            ADMIN
          </span>
        </div>
        <nav className="flex flex-col gap-2">
          {daftarMenu.map((menu, index) => {
            const menuAktif =
              currentPath.includes(menu.url) &&
              (menu.url !== "/admin" || currentPath === "/admin");
            const Icon = menu.icon;

            return (
              <Link
                key={index}
                href={menu.url}
                className={`flex items-center gap-3 px-4 py-3 rounded-[8px] cursor-pointer transition-all ${
                  menuAktif
                    ? "text-[#2563EB] bg-white shadow-sm"
                    : "text-[#64748B] hover:bg-white hover:shadow-sm hover:text-black"
                }`}
              >
                <Icon size={20} />
                <span className="font-medium text-[14px]">{menu.nama}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="px-4">
        <button className="w-full bg-[#E11D48] text-white font-bold py-3 rounded-[8px] hover:bg-[#BE123C] transition-colors text-[14px]">
          Keluar
        </button>
      </div>
    </div>
  );
}
