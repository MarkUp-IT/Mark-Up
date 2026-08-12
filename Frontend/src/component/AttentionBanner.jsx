"use client";

import { AlertTriangle } from "lucide-react";

/**
 * Spanduk "ini penyebab angka merah di menu".
 *
 * Masalah yang diselesaikan: badge angka di sidebar cuma memberi tahu bahwa
 * ADA yang perlu diurus, tanpa memberi tahu APA. Di halaman Pengaturan Akun
 * misalnya, angka "1" muncul tanpa petunjuk kolom mana yang kosong.
 *
 * Spanduk ini menyebutkan penyebabnya satu per satu, dan tiap butir bisa
 * diklik untuk melompat ke elemen yang bersangkutan. Kaitannya ke badge
 * dinyatakan lewat kalimat, bukan cuma lewat warna -- warna saja tidak cukup
 * untuk menjelaskan sebab-akibat.
 *
 * `tema`: "gelap" untuk dashboard student/mentor (latar #0F081C),
 *         "terang" untuk panel admin (latar putih).
 */
export default function AttentionBanner({
  judul,
  butir = [],
  tema = "gelap",
  keterangan,
}) {
  if (!butir.length) return null;

  const gelap = tema === "gelap";
  const kelasKotak = gelap
    ? "bg-[#F59E0B]/10 border-[#F59E0B]/35"
    : "bg-[#FEF3C7] border-[#FCD34D]";
  const kelasJudul = gelap ? "text-[#FBBF24]" : "text-[#92400E]";
  const kelasTeks = gelap ? "text-[#FCD9A0]" : "text-[#92400E]";
  const kelasPil = gelap
    ? "bg-[#F59E0B]/15 text-[#FBBF24] hover:bg-[#F59E0B]/25 border-[#F59E0B]/30"
    : "bg-white text-[#92400E] hover:bg-[#FFFBEB] border-[#FCD34D]";

  const lompatKe = (anchor) => {
    if (!anchor) return;
    const el = document.getElementById(anchor);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    // Fokuskan kolom isian supaya kursor langsung siap mengetik.
    const isian = el.querySelector("input, select, textarea");
    if (isian) setTimeout(() => isian.focus({ preventScroll: true }), 350);
  };

  return (
    <div className={`flex items-start gap-3 px-4 py-3.5 rounded-[10px] border ${kelasKotak}`}>
      <AlertTriangle size={17} className={`${kelasJudul} shrink-0 mt-0.5`} />
      <div className="flex flex-col gap-2 min-w-0">
        <p className={`text-[13.5px] font-semibold ${kelasJudul}`}>{judul}</p>
        {keterangan && <p className={`text-[12.5px] ${kelasTeks}`}>{keterangan}</p>}
        <div className="flex flex-wrap gap-1.5">
          {butir.map((b) => (
            <button
              key={b.key}
              type="button"
              onClick={() => lompatKe(b.anchor)}
              className={`px-2.5 py-1 rounded-full border text-[11.5px] font-medium transition-colors ${kelasPil} ${
                b.anchor ? "cursor-pointer" : "cursor-default"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
