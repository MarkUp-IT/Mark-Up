"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, ShieldCheck, Briefcase, Settings, X } from "lucide-react";

const menuList = [
  { name: "My Products", url: "/user/my-products", icon: LayoutGrid },
  { name: "Sertifikat", url: "/user/certificates", icon: ShieldCheck },
  { name: "Transaksi", url: "/user/transactions", icon: Briefcase },
  { name: "Pengaturan Akun", url: "/user/settings", icon: Settings },
];

export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  const pathname = usePathname() || "/user/my-products";

  return (
    <div
      className={`fixed top-0 left-0 w-[288px] h-screen flex flex-col py-8 z-50 overflow-y-auto no-scrollbar transform transition-transform duration-300 ease-in-out
      ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
    >
      {/* Tombol tutup khusus mobile -- logo brand nggak di sini lagi, sekarang
          cuma tampil sekali di Navbar paling atas */}
      <div className="flex items-center justify-end px-4 lg:hidden">
        <button
          onClick={onClose}
          aria-label="Tutup menu"
          className="text-[#9CA3AF] hover:text-white transition-colors"
        >
          <X size={22} />
        </button>
      </div>

      {/* Navigation Menu -- digeser turun (mt) biar sejajar konten & nggak
          ketutupan Navbar yang ngambang di atas halaman */}
      <nav className="flex flex-col gap-2 px-6 mt-16 lg:mt-28">
        {menuList.map((menu, index) => {
          const isActive = pathname.startsWith(menu.url);
          const Icon = menu.icon;

          return (
            <Link
              key={index}
              href={menu.url}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-[10px] cursor-pointer transition-all ${
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
  );
}
