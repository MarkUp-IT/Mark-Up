"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import GlassSurface from "./GlassSurface";

export default function Navbar() {
  const pathname = usePathname();

  const daftarMenu = [
    { nama: "Beranda", url: "/" },
    { nama: "Info lomba", url: "/info-lomba" },
    { nama: "Produk", url: "/produk" },
    { nama: "Tentang Kami", url: "/tentang-kami" },
  ];

  return (
    <div className="absolute z-50 flex w-full justify-center mt-4">
      <nav className="text-white bg-gradient-to-t from-white/35 via-white/30 to-white/25 font-jakarta backdrop-blur-sm border flex justify-between items-center border-white/30 fixed shadow-lg w-[90%] rounded-full py-3 px-8 z-50">
        <Link href="/">
          <Image
            src="/images/logo-markup.svg"
            width={170}
            height={100}
            alt="Logo Mark Up"
          />
        </Link>

        <div className="menus font-light items-center flex gap-5">
          {daftarMenu.map((menu, index) => {
            const menuAktif = pathname === menu.url;

            return (
              <Link
                key={index}
                href={menu.url}
                className={
                  menuAktif
                    ? "font-bold text-transparent bg-gradient-to-br bg-clip-text from-[#FF9FFC] to-[#a98fff]"
                    : "hover:underline underline-offset-2"
                }
              >
                {menu.nama}
              </Link>
            );
          })}
        </div>

        <Link href="/profile" className="profile flex items-center gap-2">
          <div className="profile-text flex flex-col items-end">
            <h1 className="font-semibold text-xs">Prabroro Subriantoro</h1>
            <h1 className="font-extralight text-xs">prabrorosub@gmail.com</h1>
          </div>
          <div className="profile-picture">
            <Image
              src="/images/default-profile-picture.jpg"
              width={45}
              height={45}
              alt="Profile Picture"
              className="rounded-full border-2 border-[#B19EEF]"
            />
          </div>
        </Link>
      </nav>
    </div>
  );
}
