"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, LogOut } from "lucide-react";

// Dynamically import GlassSurface component to prevent SSR desync
const GlassSurfaceDynamic = dynamic(() => import("@/component/GlassSurface"), {
  ssr: false,
});

const menuItems = [
  { name: "Beranda", url: "/" },
  { name: "Produk", url: "/produk" },
  { name: "Info Lomba", url: "/info-lomba" },
  { name: "Mentors", url: "/mentors" },
];

export default function Navbar({
  variant = "glass",
  isLoggedIn = true,
  profileName = "Prabroro Subriantoro",
  email = "prabrorosub@gmail.com",
  avatarSrc = "https://api.dicebear.com/7.x/notionists/svg?seed=Prabroro%20Subriantoro&backgroundColor=2B3034",
  dashboardHref = "/user/my-products",
  onLogout = () => {
    console.log("Logout clicked!");
  },
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  // Close profile dropdown menu when clicking outside the boundary
  useEffect(() => {
    if (!isProfileMenuOpen) return;
    const handleClickOutside = (e) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target)
      ) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileMenuOpen]);

  // ---- Reusable UI Potions Shared Across Variants ----
  const logo = (
    <Link href="/" className="relative z-20">
      <Image
        src="/images/logo-markup.svg"
        width={170}
        height={100}
        alt="Logo Mark Up"
        className="w-[120px] md:w-[160px] h-auto"
      />
    </Link>
  );

  const desktopLinks = (
    <div className="hidden lg:flex font-light items-center gap-6 relative z-20">
      {menuItems.map((menu, i) => {
        const isCurrentActive = pathname === menu.url;
        return (
          <Link
            key={i}
            href={menu.url}
            className={
              isCurrentActive
                ? "font-bold text-transparent bg-gradient-to-br bg-clip-text from-[#FF9FFC] to-[#a98fff]"
                : "text-white/80 hover:text-white transition-colors"
            }
          >
            {menu.name}
          </Link>
        );
      })}
    </div>
  );

  // Recipe "kaca" yang dipakai bareng di badan navbar, dropdown profil, dan
  // menu mobile -- biar ketiganya kerasa satu material yang sama, bukan cuma
  // mirip-mirip lewat CSS blur doang.
  const GlassLayer = ({ borderRadius }) => (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ borderRadius }}
    >
      <GlassSurfaceDynamic
        width="100%"
        height="100%"
        borderRadius={borderRadius}
        distortionScale={300}
      />
    </div>
  );

  const profileButton = (
    <div className="relative z-50" ref={profileMenuRef}>
      <button
        onClick={() => setIsProfileMenuOpen((v) => !v)}
        className="flex items-center gap-3 rounded-full pl-3 pr-1 py-1 hover:bg-white/10 transition-colors cursor-pointer"
      >
        <div className="hidden sm:flex flex-col text-right leading-tight">
          <span className="text-[13px] font-bold text-white">
            {profileName}
          </span>
          <span className="text-[11px] text-[#9CA3AF]">{email}</span>
        </div>
        <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/20 shrink-0">
          <img
            src={avatarSrc}
            alt={profileName}
            className="w-full h-full object-cover"
          />
        </div>
      </button>

      <AnimatePresence>
        {isProfileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-[120%] mt-2 w-56 rounded-[14px] border border-white/20 bg-white/10 backdrop-blur-md shadow-2xl z-[100] overflow-hidden"
          >
            <GlassLayer borderRadius={14} />
            <div className="relative z-10 p-2">
              <Link
                href={dashboardHref}
                onClick={() => setIsProfileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-[10px] text-white hover:bg-white/10 text-[14px] transition-colors"
              >
                <LayoutGrid size={17} />
                Dashboard
              </Link>
              <button
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-[10px] text-[#F87171] hover:bg-red-500/10 text-[14px] transition-colors"
              >
                <LogOut size={17} />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const authButtons = (
    <div className="hidden sm:flex items-center gap-4 relative z-20">
      <Link
        href="/login"
        className="text-sm font-medium text-gray-200 hover:text-white transition-colors"
      >
        Masuk
      </Link>
      <Link
        href="/register"
        className="text-sm font-bold bg-[#E5DFFF] text-[#530D8E] px-5 py-2.5 rounded-full hover:bg-white hover:scale-105 transition-all shadow-[0_0_15px_rgba(229,223,255,0.3)]"
      >
        Daftar
      </Link>
    </div>
  );

  const hamburger = (
    <button
      className="lg:hidden text-white p-1 relative z-20"
      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
    >
      {isMobileMenuOpen ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
      )}
    </button>
  );

  const rightSection = (
    <div className="flex items-center gap-3 md:gap-5">
      {isLoggedIn ? profileButton : authButtons}
      {hamburger}
    </div>
  );

  const mobileMenu = (
    <AnimatePresence>
      {isMobileMenuOpen && (
        <motion.div
          id="mobile-menu"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="fixed top-[80px] left-1/2 -translate-x-1/2 w-[95%] md:w-[90%] rounded-[24px] border border-white/20 bg-white/10 backdrop-blur-md shadow-2xl lg:hidden z-[90] overflow-hidden"
        >
          <GlassLayer borderRadius={24} />
          <div className="relative z-10 p-6 flex flex-col gap-4">
            {menuItems.map((menu, index) => {
              const isMenuCurrentlyActive = pathname === menu.url;
              return (
                <Link
                  key={index}
                  href={menu.url}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-base py-2 border-b border-white/5 ${
                    isMenuCurrentlyActive
                      ? "font-bold text-transparent bg-gradient-to-br bg-clip-text from-[#FF9FFC] to-[#a98fff]"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  {menu.name}
                </Link>
              );
            })}

            <div className="flex sm:hidden flex-col gap-3 mt-4 pt-4 border-t border-white/10">
              {isLoggedIn ? (
                <>
                  <Link
                    href={dashboardHref}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full py-2.5 flex items-center justify-center gap-2 border border-white/20 rounded-full text-sm font-medium text-white hover:bg-white/10 transition-colors"
                  >
                    <LayoutGrid size={16} />
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full py-2.5 flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/30 text-[#FCA5A5] rounded-full text-sm font-bold"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="w-full py-2.5 text-center border border-white/20 rounded-full text-sm font-medium text-white hover:bg-white/10 transition-colors"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/register"
                    className="w-full py-2.5 text-center bg-[#E5DFFF] text-[#530D8E] rounded-full text-sm font-bold shadow-lg"
                  >
                    Daftar Sekarang
                  </Link>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ---- VARIANT SOLID ----
  // Lebar disamakan persis dengan varian glass (w-[95%] md:w-[90%]) --
  // sebelumnya pakai w-full max-w-[1400px], rumus beda yang bikin lebarnya
  // nggak konsisten dibanding halaman marketing tergantung ukuran layar.
  if (variant === "solid") {
    return (
      <div className="fixed top-0 left-0 z-[100] w-full flex justify-center mt-4 px-4 pointer-events-none">
        <nav className="relative pointer-events-auto text-white flex font-jakarta justify-between items-center border border-white/20 bg-white/10 backdrop-blur-md shadow-lg w-[95%] md:w-[90%] rounded-full z-50">
          <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
            <GlassSurfaceDynamic
              width="100%"
              height="100%"
              borderRadius={100}
              distortionScale={300}
            />
          </div>
          <div className="relative z-10 flex items-center py-2 px-4 md:py-3 md:px-8 justify-between w-full">
            {logo}
            {desktopLinks}
            {rightSection}
          </div>
        </nav>
        {mobileMenu}
      </div>
    );
  }

  // ---- DEFAULT GLASS VARIANT ----
  return (
    <div className="fixed top-0 left-0 z-[100] flex w-full justify-center mt-4 px-4 pointer-events-none">
      <nav className="relative pointer-events-auto text-white flex font-jakarta justify-between items-center border border-white/20 bg-white/10 backdrop-blur-md shadow-lg w-[95%] md:w-[90%] rounded-full z-50">
        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
          <GlassSurfaceDynamic
            width="100%"
            height="100%"
            borderRadius={100}
            distortionScale={300}
          />
        </div>
        <div className="relative z-10 flex items-center py-2 px-4 md:py-3 md:px-8 justify-between w-full">
          {logo}
          {desktopLinks}
          {rightSection}
        </div>
      </nav>
      {mobileMenu}
    </div>
  );
}
