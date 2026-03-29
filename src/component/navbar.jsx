"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const daftarMenu = [
    { nama: "Beranda", url: "/" },
    { nama: "Produk", url: "/produk" },
    { nama: "Info Lomba", url: "/info-lomba" },
    { nama: "Mentor", url: "/mentor" },
    { nama: "Tentang Kami", url: "/tentang-kami" },
  ];

  const GlassSurfaceDynamic = dynamic(
    () => import("@/component/GlassSurface"),
    {
      ssr: false,
    },
  );

  return (
    <div className="absolute z-[100] flex w-full justify-center mt-4">
      {/* Navbar Container Utama */}
      <nav className="text-white flex font-jakarta justify-between items-center border border-white/20 fixed bg-white/30 shadow-lg w-[95%] md:w-[90%] rounded-full z-50">
        <GlassSurfaceDynamic
          width="100%"
          height="100%"
          borderRadius={100}
          className="flex items-center fixed py-2 px-4 md:py-3 md:px-8 justify-between w-full shadow-lg"
          distortionScale={300}
        >
          {/* LOGO */}
          <Link href="/">
            <Image
              src="/images/logo-markup.svg"
              width={170}
              height={100}
              alt="Logo Mark Up"
              className="w-[120px] md:w-[170px] h-auto transition-all"
            />
          </Link>

          {/* MENU DESKTOP (Sembunyi di Mobile) */}
          <div className="hidden lg:flex menus font-light items-center gap-5">
            {daftarMenu.map((menu, index) => {
              const menuAktif = pathname === menu.url;

              return (
                <Link
                  key={index}
                  href={menu.url}
                  className={
                    menuAktif
                      ? "font-bold text-transparent bg-gradient-to-br bg-clip-text from-[#FF9FFC] to-[#a98fff]"
                      : "hover:underline underline-offset-2 transition-all"
                  }
                >
                  {menu.nama}
                </Link>
              );
            })}
          </div>

          {/* BAGIAN KANAN: AUTH & HAMBURGER */}
          <div className="flex items-center gap-3 md:gap-5">
            {/* TOMBOL MASUK & DAFTAR (Muncul di Desktop/Tablet) */}
            <div className="hidden sm:flex items-center gap-4">
              <Link
                href="/"
                className="text-sm font-medium text-gray-200 hover:text-white transition-colors"
                onClick={(e) => e.preventDefault()} // Cegah pindah halaman sementara
              >
                Masuk
              </Link>
              <Link
                href="/"
                className="text-sm font-bold bg-[#E5DFFF] text-[#530D8E] px-5 py-2.5 rounded-full hover:bg-white hover:scale-105 transition-all shadow-[0_0_15px_rgba(229,223,255,0.3)]"
                onClick={(e) => e.preventDefault()} // Cegah pindah halaman sementara
              >
                Daftar
              </Link>
            </div>

            {/* TOMBOL HAMBURGER (Cuma muncul di Mobile) */}
            <button
              className="lg:hidden text-white p-1"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? (
                // Ikon Close (X)
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
                // Ikon Hamburger (Garis 3)
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
          </div>
        </GlassSurfaceDynamic>
      </nav>

      {/* DROPDOWN MENU MOBILE */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[80px] w-[95%] md:w-[90%] bg-[#120822]/95 backdrop-blur-xl border border-white/20 rounded-[24px] p-6 flex flex-col gap-4 lg:hidden shadow-2xl z-40"
          >
            {/* Daftar Menu */}
            {daftarMenu.map((menu, index) => {
              const menuAktif = pathname === menu.url;

              return (
                <Link
                  key={index}
                  href={menu.url}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-base py-2 border-b border-white/5 ${
                    menuAktif
                      ? "font-bold text-transparent bg-gradient-to-br bg-clip-text from-[#FF9FFC] to-[#a98fff]"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  {menu.nama}
                </Link>
              );
            })}

            {/* Tombol Auth untuk Mobile (Numpuk di bawah menu) */}
            <div className="flex sm:hidden flex-col gap-3 mt-4 pt-4 border-t border-white/10">
              <Link
                href="/"
                onClick={(e) => e.preventDefault()}
                className="w-full py-2.5 text-center border border-white/20 rounded-full text-sm font-medium text-white hover:bg-white/10 transition-colors"
              >
                Masuk
              </Link>
              <Link
                href="/"
                onClick={(e) => e.preventDefault()}
                className="w-full py-2.5 text-center bg-[#E5DFFF] text-[#530D8E] rounded-full text-sm font-bold shadow-lg"
              >
                Daftar Sekarang
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
