"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { api, clearTokens, getRefreshToken } from "@/lib/api";
import NotifBadge from "@/component/NotifBadge";
import {
  LayoutDashboard,
  Package,
  Trophy,
  Ticket,
  Presentation,
  GraduationCap,
  FileText,
  ReceiptText,
  RotateCcw,
  Landmark,
  UserCog,
  MessageSquare,
  Inbox,
  Award,
  History,
  Settings,
  LogOut,
  X,
} from "lucide-react";

const menuList = [
  { name: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { name: "Produk", url: "/admin/products", icon: Package },
  { name: "Info Lomba", url: "/admin/competitions", icon: Trophy },
  { name: "Kode Referral", url: "/admin/referral-codes", icon: Ticket },
];

// badgeKey nyambung ke response /api/accounts/admin/sidebar-badges/ -- item
// tanpa badgeKey (Modul, Manajemen User, dst) memang gak punya konsep
// "butuh tindakan" yang jelas, jadi gak dikasih buletan notifikasi.
const orderMenuList = [
  { name: "Bootcamp", url: "/admin/orders/bootcamp", icon: Presentation, badgeKey: "bootcamp" },
  { name: "Mentoring", url: "/admin/orders/mentoring", icon: GraduationCap, badgeKey: "mentoring" },
  { name: "Modul", url: "/admin/orders/module", icon: FileText },
];

const financeMenuList = [
  { name: "Transaksi", url: "/admin/transactions", icon: ReceiptText, badgeKey: "transactions" },
  { name: "Pengajuan Refund", url: "/admin/refund-requests", icon: RotateCcw, badgeKey: "refund_requests" },
  { name: "Pencairan Mentor", url: "/admin/payouts", icon: Landmark, badgeKey: "payouts" },
];

const otherMenuList = [
  { name: "Manajemen User", url: "/admin/user-management", icon: UserCog },
  { name: "Sertifikat", url: "/admin/certificates", icon: Award },
  { name: "Ulasan", url: "/admin/feedbacks", icon: MessageSquare, badgeKey: "reviews" },
  { name: "Pesan Masuk", url: "/admin/messages", icon: Inbox, badgeKey: "messages" },
  { name: "Audit Trail", url: "/admin/audit-trail", icon: History },
];

function NavItem({ item, isActive, badge }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.url}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-[8px] text-[13px] font-medium transition-colors ${
        isActive
          ? "bg-[#148F89]/10 text-[#148F89]"
          : "text-[#475569] hover:bg-[#F1F5F9] hover:text-[#1E293B]"
      }`}
    >
      <Icon
        size={17}
        className={isActive ? "text-[#148F89]" : "text-[#94A3B8]"}
      />
      <span className="flex-1">{item.name}</span>
      <NotifBadge count={badge} />
    </Link>
  );
}

function SectionLabel({ children, badge }) {
  return (
    <div className="px-4 mb-1 flex items-center gap-2">
      <p className="text-[11px] font-bold text-[#94A3B8] tracking-wider uppercase">
        {children}
      </p>
      <NotifBadge count={badge} />
    </div>
  );
}

export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  const pathname = usePathname();
  const router = useRouter();
  const [badges, setBadges] = useState({});

  useEffect(() => {
    api
      .get("/api/accounts/admin/sidebar-badges/")
      .then((data) => data && setBadges(data))
      .catch(() => {});
  }, []);

  const isActivePath = (url) =>
    url === "/admin" ? pathname === "/admin" : pathname?.startsWith(url);

  async function handleLogout() {
    try {
      await api.post("/api/accounts/logout/", { refresh: getRefreshToken() }, { auth: true });
    } catch (err) {
      console.error(err);
    } finally {
      clearTokens();
      router.push("/login");
    }
  }

  const orderSectionBadge = (badges.bootcamp || 0) + (badges.mentoring || 0);
  const financeSectionBadge =
    (badges.transactions || 0) + (badges.refund_requests || 0) + (badges.payouts || 0);

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        />
      )}
      <aside
        style={{ width: "288px", height: "100vh" }}
        className={`fixed top-0 left-0 bg-white border-r border-[#E2E8F0] flex flex-col z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
      <div
        style={{ height: "88px" }}
        className="shrink-0 flex items-center px-6 border-b border-[#E2E8F0] gap-2"
      >
        <Image
          src="/images/logo-single.svg"
          alt=""
          width={32}
          height={32}
          style={{ width: "32px", height: "32px" }}
        />
        <span className="text-black font-bold text-[17px] tracking-tight">
          MARK-UP
        </span>
        <span className="px-2 py-0.5 rounded-full bg-[#148F89]/10 text-[#148F89] text-[10px] font-bold tracking-wide">
          ADMIN
        </span>
        <button
          onClick={onClose}
          aria-label="Tutup menu"
          className="lg:hidden ml-auto text-[#94A3B8] hover:text-[#1E293B] transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-6" onClick={onClose}>
        <div className="flex flex-col gap-1">
          {menuList.map((item) => (
            <NavItem
              key={item.url}
              item={item}
              isActive={isActivePath(item.url)}
            />
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <SectionLabel badge={orderSectionBadge}>Kelola Pesanan</SectionLabel>
          {orderMenuList.map((item) => (
            <NavItem
              key={item.url}
              item={item}
              isActive={isActivePath(item.url)}
              badge={badges[item.badgeKey]}
            />
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <SectionLabel badge={financeSectionBadge}>Keuangan</SectionLabel>
          {financeMenuList.map((item) => (
            <NavItem
              key={item.url}
              item={item}
              isActive={isActivePath(item.url)}
              badge={badges[item.badgeKey]}
            />
          ))}
        </div>

        <div className="flex flex-col gap-1">
          {otherMenuList.map((item) => (
            <NavItem
              key={item.url}
              item={item}
              isActive={isActivePath(item.url)}
              badge={badges[item.badgeKey]}
            />
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-[#E2E8F0] flex flex-col gap-1">
        <NavItem
          item={{ name: "Pengaturan", url: "/admin/settings", icon: Settings }}
          isActive={isActivePath("/admin/settings")}
        />
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-[8px] text-[13px] font-medium text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
        >
          <LogOut size={17} />
          Keluar
        </button>
      </div>
      </aside>
    </>
  );
}
