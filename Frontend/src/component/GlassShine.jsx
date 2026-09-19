"use client";

// Lapisan hiasan "kaca" -- CSS gradient statis doang, gantinya GlassSurface
// (reactbits) yang generate ulang SVG displacement map tiap kali ukuran
// elemen berubah lewat ResizeObserver. Itu yang bikin dropdown navbar di
// mobile patah-patah pas animasi buka. Versi ini murni CSS, jadi nggak ada
// komputasi ulang sama sekali -- browser tinggal render sekali, gratis.
export default function GlassShine({ borderRadius = 20, className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{
        borderRadius,
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.03) 30%, rgba(255,255,255,0) 55%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
      }}
    />
  );
}
