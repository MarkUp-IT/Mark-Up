"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

function kunciDismiss(dismissKey) {
  return `markup:dismissed-banner:${dismissKey}`;
}

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
 *
 * `dismissKey`: kalau diisi, muncul tombol X buat nutup spanduk ini secara
 * permanen (disimpan di localStorage per browser). Dismiss-nya diingat per
 * KUMPULAN butir yang lagi tampil -- kalau nanti ada butir baru/beda (mis.
 * transaksi ditolak yang lain), spanduknya muncul lagi, karena itu masalah
 * baru yang belum pernah "ditutup".
 */
export default function AttentionBanner({
  judul,
  butir = [],
  tema = "gelap",
  keterangan,
  dismissKey,
}) {
  const [tandaDitutup, setTandaDitutup] = useState(null);

  const tandaSekarang = butir.map((b) => b.key).sort().join("|");

  useEffect(() => {
    if (!dismissKey) return;
    // setTimeout(..., 0) -- baca localStorage di luar body efek langsung,
    // biar gak kena warning "setState sinkron di dalam efek". Nggak masalah
    // ketunda sepersekian detik: banner sengaja tampil dulu sampai status
    // dismiss-nya kebaca, baru hilang kalau ternyata sudah pernah ditutup.
    const id = setTimeout(() => {
      try {
        setTandaDitutup(localStorage.getItem(kunciDismiss(dismissKey)));
      } catch {
        setTandaDitutup(undefined);
      }
    }, 0);
    return () => clearTimeout(id);
  }, [dismissKey]);

  if (!butir.length) return null;
  if (dismissKey && tandaDitutup === tandaSekarang) return null;

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

  const tutup = () => {
    if (!dismissKey) return;
    try {
      localStorage.setItem(kunciDismiss(dismissKey), tandaSekarang);
    } catch {
      // localStorage gak tersedia (mode privat, dll) -- gak fatal, cuma
      // berarti spanduknya bakal muncul lagi pas reload berikutnya.
    }
    setTandaDitutup(tandaSekarang);
  };

  return (
    <div className={`flex items-start gap-3 px-4 py-3.5 rounded-[10px] border ${kelasKotak}`}>
      <AlertTriangle size={17} className={`${kelasJudul} shrink-0 mt-0.5`} />
      <div className="flex flex-col gap-2 min-w-0 flex-1">
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
      {dismissKey && (
        <button
          type="button"
          onClick={tutup}
          aria-label="Tutup"
          className={`shrink-0 p-1 rounded-[6px] transition-colors ${
            gelap ? "text-[#FCD9A0]/70 hover:text-[#FCD9A0] hover:bg-white/10" : "text-[#92400E]/60 hover:text-[#92400E] hover:bg-black/5"
          }`}
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
