"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import Navbar from "@/component/navbar";

export default function DashboardLayout({ title, children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // TODO: ganti dengan data user dari session/auth context, bukan hardcode
  const profile = {
    profileName: "Prabroro Subriantoro",
    email: "prabrorosub@gmail.com",
    avatarSrc: "/images/pp.png",
  };

  return (
    <div className="w-full min-h-screen bg-[#0F081C] font-inter text-white relative">
      {/* Glow ambient. PENTING: overflow-hidden di-scope ke wrapper kecil ini
          doang (bukan di root halaman). Naruh overflow-x-hidden di root itu
          jebakan CSS -- begitu overflow-x di-set ke selain "visible", browser
          otomatis bikin overflow-y jadi "auto" walau nggak ditulis, yang diam-
          diam ngerubah div itu jadi scroll container sendiri. Efeknya:
          position:sticky (trigger mobile di bawah) jadi salah acuan, dan ada
          dua "tempat scroll" yang bikin browser bingung (kerasa nge-stuck pas
          awal scroll). */}
      <div className="fixed inset-x-0 top-0 h-[400px] overflow-hidden pointer-events-none z-0">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[150vw] md:w-[120vw] h-[300px] md:h-[400px] rounded-b-[100%]"
          style={{
            background:
              "radial-gradient(ellipse at top, rgba(177, 158, 239, 0.15) 0%, transparent 60%)",
            filter: "blur(40px)",
          }}
        />
      </div>

      {/* Navbar solid gelap sesuai mockup, login-aware */}
      <Navbar
        variant="solid"
        isLoggedIn
        profileName={profile.profileName}
        email={profile.email}
        avatarSrc={profile.avatarSrc}
        dashboardHref="/user/my-products"
      />

      <Sidebar isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
        />
      )}

      <div className="flex flex-col min-h-screen lg:ml-[288px] relative z-10">
        {/* Trigger buka Sidebar khusus mobile -- hamburger di Navbar tugasnya
            beda (buka menu situs). mt biar nggak ketiban Navbar yang ngambang. */}
        <div className="lg:hidden sticky top-0 z-20 bg-[#0F081C]/90 backdrop-blur-sm px-4 py-4 mt-28 flex items-center gap-3 border-b border-white/5">
          <button
            onClick={() => setMobileNavOpen(true)}
            aria-label="Buka menu"
            className="text-white"
          >
            <Menu size={22} />
          </button>
          <span className="text-white font-semibold text-[15px]">{title}</span>
        </div>

        <main className="flex-1 flex flex-col px-4 sm:px-6 lg:px-10 py-6 lg:pt-36 lg:pb-10">
          <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
