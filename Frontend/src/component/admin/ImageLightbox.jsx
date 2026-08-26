"use client";

import { useEffect, useState } from "react";
import { X, ZoomIn } from "lucide-react";

/**
 * Thumbnail gambar yang bisa diklik untuk dilihat penuh dalam popup.
 *
 * Sebelumnya bukti transfer cuma ditampilkan sebagai <img> kecil, dipotong
 * (object-cover) dan dibatasi tinggi 240px -- admin tidak pernah benar-benar
 * bisa melihat gambarnya utuh, apalagi kalau buktinya berupa screenshot
 * panjang atau nominal transfernya kecil di sudut gambar.
 *
 * Dipakai sebagai pengganti langsung <img>: kirim props yang sama
 * (src, alt, className untuk thumbnail-nya), popup-nya sudah termasuk.
 */
export default function ImageLightbox({ src, alt = "Gambar", className = "", style }) {
  const [terbuka, setTerbuka] = useState(false);

  useEffect(() => {
    if (!terbuka) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setTerbuka(false);
    };
    window.addEventListener("keydown", onKey);
    // Kunci scroll body selama popup terbuka -- tanpa ini, scroll di
    // belakang popup ikut jalan dan terasa aneh di halaman panjang.
    const overflowSebelumnya = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflowSebelumnya;
    };
  }, [terbuka]);

  if (!src) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setTerbuka(true)}
        className="relative group w-full cursor-zoom-in"
        aria-label={`Lihat ${alt} secara penuh`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className={className} style={style} />
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors rounded-[8px]">
          <ZoomIn
            size={22}
            className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow"
          />
        </span>
      </button>

      {terbuka && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 sm:p-8"
          onClick={() => setTerbuka(false)}
        >
          <button
            type="button"
            onClick={() => setTerbuka(false)}
            aria-label="Tutup"
            className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-full object-contain rounded-[4px] shadow-2xl cursor-default"
          />
        </div>
      )}
    </>
  );
}
