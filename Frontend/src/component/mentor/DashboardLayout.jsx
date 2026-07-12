"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function DashboardLayout({ title, children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="w-full min-h-screen bg-[#0F081C] font-inter text-white relative">
      {/* Glow ambient, pattern sama kayak dashboard user. Sidebar mentor
          SENGAJA dipertahankan sebagai panel sendiri (bg-[#1A1128] + identitas
          "MENTOR"), jadi glow ini cuma kelihatan di area konten kanan, bukan
          nembus ke belakang Sidebar -- itu pilihan disengaja, bukan bug.

          PENTING: overflow-hidden di-scope ke WRAPPER kecil ini doang (bukan
          di root halaman kayak sebelumnya). Naruh overflow-x-hidden di root
          itu jebakan CSS -- begitu overflow-x di-set ke selain "visible",
          browser otomatis bikin overflow-y jadi "auto" walau nggak ditulis,
          yang diam-diam ngerubah div itu jadi scroll container sendiri.
          Efeknya: position:sticky di Header jadi salah acuan (makanya nggak
          nempel), dan ada dua "tempat scroll" yang bikin browser bingung
          (kerasa kayak nge-stuck pas awal scroll). */}
      <div className="absolute inset-x-0 top-0 h-[400px] overflow-hidden pointer-events-none z-0">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[150vw] md:w-[120vw] h-[300px] md:h-[400px] rounded-b-[100%]"
          style={{
            background:
              "radial-gradient(ellipse at top, rgba(177, 158, 239, 0.15) 0%, transparent 60%)",
            filter: "blur(40px)",
          }}
        />
      </div>

      <Sidebar isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
        />
      )}

      <div className="flex flex-col min-h-screen lg:ml-[288px] relative z-10">
        <Header title={title} onMenuClick={() => setMobileNavOpen(true)} />

        <main className="flex-1 flex flex-col py-8 px-4 sm:px-6 lg:px-10">
          <div className="w-full max-w-[1158px] mx-auto flex flex-col gap-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
