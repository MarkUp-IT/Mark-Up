"use client";

import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <div className="bg-[#FFFFFF]/5 border-t border-white/10 flex flex-col font-light text-sm text-[#EDEDF3] pt-16 pb-8 mt-20">
      {/* Container Utama */}
      <div className="max-w-7xl mx-auto w-full px-6 md:px-10 flex flex-col md:flex-row justify-between gap-12 md:gap-16 mb-12">
        {/* Kolom 1: Branding & Deskripsi */}
        <div className="flex flex-col gap-5 w-full md:max-w-[320px]">
          <Image
            src="/images/logo-markup.svg"
            width={170}
            height={100}
            alt="Logo Mark Up"
            className="w-[120px] md:w-[170px] h-auto transition-all" // Logo mengecil dikit di HP
          />
          <p className="leading-relaxed text-[#EDEDF3]/80 text-justify">
            Mark-Up adalah wadah akselerasi talenta muda yang menyediakan
            layanan berkualitas untuk melahirkan inovator masa depan.
          </p>
          <div className="flex flex-row gap-3 mt-2">
            <Link
              href="https://www.linkedin.com/company/markupcom/"
              target="_blank"
            >
              <div className="group rounded-full bg-[#060010] w-8 h-8 border border-[#EDEDF3]/25 flex justify-center items-center hover:bg-white transition-colors">
                <Image
                  src="/images/linkedin.svg"
                  width={14}
                  height={14}
                  alt="Instagram"
                  className="invert group-hover:invert-0 transition-all"
                />
              </div>
            </Link>
            <Link
              href="https://www.instagram.com/markup_official/"
              target="_blank"
            >
              <div className="group rounded-full bg-[#060010] w-8 h-8 border border-[#EDEDF3]/25 flex justify-center items-center hover:bg-white transition-colors">
                <Image
                  src="/images/instagram.svg"
                  width={14}
                  height={14}
                  alt="Instagram"
                  className="invert group-hover:invert-0 transition-all"
                />
              </div>
            </Link>
          </div>
        </div>

        {/* Kolom 2: Navigasi */}
        <div className="flex flex-col gap-6">
          <p className="font-bold font-poppins tracking-widest text-white">
            NAVIGASI
          </p>
          <div className="flex flex-col gap-4 text-[#EDEDF3]/80">
            <Link href="/">
              <p className="hover:text-white hover:font-semibold transition-all">
                Beranda
              </p>
            </Link>
            <Link href="/info-lomba">
              <p className="hover:text-white hover:font-semibold transition-all">
                Info Lomba
              </p>
            </Link>
            <Link href="/produk">
              <p className="hover:text-white hover:font-semibold transition-all">
                Produk
              </p>
            </Link>
            <Link href="/mentor">
              <p className="hover:text-white hover:font-semibold transition-all">
                Mentor
              </p>
            </Link>
            {/* <Link href="/tentang-kami">
              <p className="hover:text-white hover:font-semibold transition-all">
                Tentang Kami
              </p>
            </Link> */}
          </div>
        </div>

        {/* Kolom 3: Hubungi Kami */}
        <div className="flex flex-col gap-6">
          <p className="font-bold font-poppins tracking-widest text-white">
            HUBUNGI KAMI
          </p>
          <div className="flex flex-col gap-4 text-[#EDEDF3]/80">
            <div className="flex flex-row gap-3 items-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 shrink-0 mt-0.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                />
              </svg>
              <p>markup@gmail.com</p>
            </div>
            <div className="flex flex-row gap-3 items-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 shrink-0 mt-0.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
                />
              </svg>
              <p>1234567890 (Cahya)</p>
            </div>
            <div className="flex flex-row gap-3 items-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 shrink-0 mt-0.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                />
              </svg>
              <p className="w-full md:max-w-[280px] leading-relaxed">
                Jl. Sutorejo Prima Indah Utara VII, No. 20, Kel. Dukuh Sutorejo,
                Kec. Mulyorejo, Kota Surabaya, Jawa Timur 60113
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bagian Bawah / Copyright */}
      <div className="w-full max-w-7xl mx-auto px-6 md:px-10">
        <hr className="w-full border-t border-white/10 my-6" />
        <p className="text-xs text-[#EDEDF3]/60 mb-2 md:mb-0 text-center md:text-left">
          MARK-UP © 2026
        </p>
      </div>
    </div>
  );
}
