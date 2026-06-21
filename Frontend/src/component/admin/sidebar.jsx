"use client";

import {
  LayoutDashboard,
  Package,
  Trophy,
  ReceiptText,
  MessageSquare,
  Presentation,
  Users,
  FileText,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  // Mengambil URL path yang sedang aktif secara otomatis
  const pathname = usePathname();
  const [hoveredMenu, setHoveredMenu] = useState(null);

  const daftarMenu = [
    { nama: "Dashboard", url: "/admin", icon: LayoutDashboard },
    {
      nama: "Produk",
      url: "/admin/produk",
      icon: Package,
      subItems: [
        {
          nama: "Mentoring",
          url: "/admin/produk/mentoring",
          icon: Presentation,
        },
        { nama: "Bootcamp", url: "/admin/produk/bootcamp", icon: Users },
        { nama: "Modul", url: "/admin/produk/modul", icon: FileText },
      ],
    },
    { nama: "Info Lomba", url: "/admin/lomba", icon: Trophy },
    { nama: "Transaksi", url: "/admin/transaksi", icon: ReceiptText },
    { nama: "Ulasan", url: "/admin/ulasan", icon: MessageSquare },
  ];

  // Fallback ke "/admin" jika pathname belum tersedia
  const currentPath = pathname || "/admin";

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
            // Logika untuk mengecek apakah menu ini yang sedang diakses
            const isActiveMain =
              currentPath.includes(menu.url) &&
              (menu.url !== "/admin" || currentPath === "/admin");

            const Icon = menu.icon;
            const hasSubMenu = menu.subItems && menu.subItems.length > 0;
            const isHovered = hoveredMenu === menu.nama;

            // Sub-menu muncul jika main menu sedang aktif ATAU sedang di-hover
            const showSubMenu = hasSubMenu && (isActiveMain);

            return (
              <div
                key={index}
                className="flex flex-col gap-1"
                onMouseEnter={() => setHoveredMenu(menu.nama)}
                onMouseLeave={() => setHoveredMenu(null)}
              >
                {/* Main Menu Item */}
                <Link
                  href={menu.url}
                  className={`flex items-center gap-3 px-4 py-3 rounded-[8px] cursor-pointer transition-all ${
                    isActiveMain
                      ? "text-[#2563EB] bg-white shadow-sm"
                      : "text-[#64748B] hover:bg-white hover:shadow-sm hover:text-[#1E293B]"
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium text-[14px]">{menu.nama}</span>
                </Link>

                {/* Sub Menu Items */}
                {showSubMenu && (
                  <div className="flex flex-col gap-1 mt-1 transition-all duration-300">
                    {menu.subItems.map((sub, subIndex) => {
                      const isSubActive = currentPath === sub.url;
                      const SubIcon = sub.icon;

                      return (
                        <Link
                          key={subIndex}
                          href={sub.url}
                          // pl-[48px] digunakan agar posisi icon sejajar persis dengan teks menu utama
                          className={`flex items-center gap-3 pl-[48px] pr-4 py-3 rounded-[8px] cursor-pointer transition-all ${
                            isSubActive
                              ? "bg-[#E2E8FF] text-[#1E293B]"
                              : "text-[#64748B] hover:bg-white hover:shadow-sm hover:text-[#1E293B]"
                          }`}
                        >
                          <SubIcon size={20} />
                          <span className="font-medium text-[14px]">
                            {sub.nama}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
      <div className="px-4">
        <button className="w-full bg-[#E11D48] text-white font-bold py-3 rounded-[8px] hover:bg-[#BE123C] transition-colors text-[14px] shadow-sm">
          Keluar
        </button>
      </div>
    </div>
  );
}
