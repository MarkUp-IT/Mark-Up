"use client";

import {
  LayoutDashboard,
  Package,
  ListPlus,
  Trophy,
  ReceiptText,
  MessageSquare,
  Presentation,
  Users,
  FileText,
  History,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  // Mengambil URL path yang sedang aktif secara otomatis
  const pathname = usePathname();
  const [hoveredMenu, setHoveredMenu] = useState(null);

  const menuList = [
    { name: "Dashboard", url: "/admin", icon: LayoutDashboard },
    { name: "Product Catalog", url: "/admin/products", icon: Package },
    {
      name: "Order Management",
      url: "/admin/orders",
      icon: ListPlus,
      subItems: [
        {
          name: "Mentoring",
          url: "/admin/orders/mentoring",
          icon: Presentation,
        },
        { name: "Bootcamp", url: "/admin/orders/bootcamp", icon: Users },
        { name: "Module", url: "/admin/orders/module", icon: FileText },
      ],
    },
    { name: "Competition Info", url: "/admin/competitions", icon: Trophy },
    { name: "Transactions", url: "/admin/transactions", icon: ReceiptText },
    { name: "Feedbacks", url: "/admin/feedbacks", icon: MessageSquare },
    { name: "User Management", url: "/admin/user-management", icon: Users },
    { name: "Audit Trail", url: "/admin/audit-trail", icon: History },
  ];

  // Fallback ke "/admin" jika pathname belum tersedia
  const currentPath = pathname || "/admin";

  return (
    <div className="fixed top-0 left-0 w-[288px] h-screen bg-[#F8FAFC] border-r border-[#E2E8F0] flex flex-col z-50 justify-between py-8 px-4 z-10 overflow-y-auto no-scrollbar">
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
          {menuList.map((menu, index) => {
            // Logika untuk mengecek apakah menu ini yang sedang diakses
            const isActiveMain =
              currentPath.includes(menu.url) &&
              (menu.url !== "/admin" || currentPath === "/admin");

            const Icon = menu.icon;
            const hasSubMenu = menu.subItems && menu.subItems.length > 0;
            const isHovered = hoveredMenu === menu.name;

            // Sub-menu muncul jika main menu sedang aktif
            const showSubMenu = hasSubMenu && isActiveMain;

            return (
              <div
                key={index}
                className="flex flex-col gap-1"
                onMouseEnter={() => setHoveredMenu(menu.name)}
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
                  <span className="font-medium text-[14px]">{menu.name}</span>
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
                            {sub.name}
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
          Logout
        </button>
      </div>
    </div>
  );
}
