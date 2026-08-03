"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, ArrowRight, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/api";

// Ditandai per-bootcamp, bukan satu flag global: kalau nanti ada batch baru,
// orang yang sudah nutup popup batch lama tetap kebagian lihat yang baru.
const SEEN_KEY_PREFIX = "markup_promo_seen:";

export default function BootcampPromoPopup() {
  const [bootcamp, setBootcamp] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiRequest("/api/products/", { auth: false });
        const list = Array.isArray(res) ? res : res?.products || res?.results || [];
        // Ambil bootcamp aktif yang masih ada stoknya -- gak ada gunanya
        // ngiklanin batch yang udah penuh atau dinonaktifkan admin.
        const target = list.find(
          (p) => p.type === "BOOTCAMP" && p.is_active && (p.stock ?? 0) > 0,
        );
        if (cancelled || !target) return;

        if (sessionStorageSafeGet(SEEN_KEY_PREFIX + target.id)) return;

        setBootcamp(target);
        // Dikasih jeda sedikit biar gak nabrak animasi hero pas halaman kebuka.
        const t = setTimeout(() => setOpen(true), 1200);
        return () => clearTimeout(t);
      } catch {
        // Popup itu pemanis, bukan fitur inti -- kalau gagal ambil data ya
        // diam saja, jangan sampai ganggu halaman utama.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const close = () => {
    setOpen(false);
    if (bootcamp) sessionStorageSafeSet(SEEN_KEY_PREFIX + bootcamp.id, "1");
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, bootcamp]);

  if (!open || !bootcamp) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-[fadeIn_180ms_ease-out]"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label={`Promo ${bootcamp.title}`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[380px] bg-[#170F26] border border-[#2D2342] rounded-[16px] overflow-hidden shadow-2xl"
      >
        <button
          onClick={close}
          aria-label="Tutup"
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/50 text-white/80 hover:text-white hover:bg-black/70 transition-colors"
        >
          <X size={16} />
        </button>

        {bootcamp.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bootcamp.image_url}
            alt={bootcamp.title}
            className="w-full h-[190px] object-cover"
          />
        )}

        <div className="p-5 flex flex-col gap-3">
          <span className="self-start flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#148F89]/15 text-[#148F89] text-[10.5px] font-bold uppercase tracking-wide">
            <Sparkles size={11} /> Pendaftaran Dibuka
          </span>

          <h2 className="text-white font-bold text-[18px] leading-snug">{bootcamp.title}</h2>

          <p className="text-[#9CA3AF] text-[12.5px] leading-relaxed line-clamp-3">
            {bootcamp.description}
          </p>

          <Link
            href={`/bootcamp/${bootcamp.id}/register`}
            onClick={close}
            className="mt-1 flex items-center justify-center gap-2 w-full py-3 rounded-[10px] bg-[#148F89] text-white font-semibold text-[14px] hover:bg-[#117A75] transition-colors"
          >
            Daftar Sekarang <ArrowRight size={16} />
          </Link>

          <button
            onClick={close}
            className="text-[#6B7280] text-[12px] hover:text-[#9CA3AF] transition-colors"
          >
            Nanti saja
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// localStorage bisa nge-throw di mode privat / storage penuh -- dibungkus biar
// popup gagal-aman, bukan nge-crash halaman utama.
function sessionStorageSafeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function sessionStorageSafeSet(key, val) {
  try {
    localStorage.setItem(key, val);
  } catch {
    /* diabaikan */
  }
}
