"use client";

import { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { LogIn, ArrowLeft, Lock } from "lucide-react";

/**
 * Popup "harus login dulu" yang ngunci halaman.
 *
 * Sengaja TIDAK bisa ditutup (gak ada tombol X, klik latar & tombol Escape
 * gak ngefek): ini gerbang, bukan pemberitahuan. Kalau bisa ditutup, orang
 * balik lagi ke halaman yang seharusnya terkunci.
 *
 * Isi halaman di belakangnya tetap kelihatan samar sebagai konteks (biar user
 * ngerti dia lagi mau masuk ke apa), tapi gak bisa disentuh sama sekali karena
 * ketutup lapisan ini.
 */
export default function LoginRequiredDialog({
  title = "Masuk Dulu, Yuk",
  message = "Kamu perlu masuk ke akunmu sebelum melanjutkan.",
  backHref = "/products",
  backLabel = "Kembali ke Produk",
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const qs = searchParams?.toString();
  const target = qs ? `${pathname}?${qs}` : pathname;
  const loginHref = `/login?next=${encodeURIComponent(target)}`;

  // Kunci scroll halaman di belakang selama popup kebuka.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-required-title"
    >
      <div className="w-full max-w-[380px] bg-[#170F26] border border-[#2D2342] rounded-[16px] p-6 flex flex-col items-center gap-3 text-center shadow-2xl">
        <div className="w-12 h-12 rounded-full bg-[#148F89]/15 flex items-center justify-center">
          <Lock size={22} className="text-[#148F89]" />
        </div>

        <h2 id="login-required-title" className="text-white font-bold text-[18px]">
          {title}
        </h2>
        <p className="text-[#9CA3AF] text-[13px] leading-relaxed">{message}</p>

        <button
          onClick={() => router.push(loginHref)}
          className="mt-2 flex items-center justify-center gap-2 w-full py-3 rounded-[10px] bg-[#148F89] text-white font-semibold text-[14px] hover:bg-[#117A75] transition-colors"
        >
          <LogIn size={16} /> Masuk ke Akun
        </button>

        <p className="text-[#6B7280] text-[12px]">
          Belum punya akun?{" "}
          <button
            onClick={() => router.push(`/register?next=${encodeURIComponent(target)}`)}
            className="text-[#08C7E1] hover:underline font-semibold"
          >
            Daftar dulu
          </button>
        </p>

        <button
          onClick={() => router.push(backHref)}
          className="flex items-center justify-center gap-1.5 text-[#9CA3AF] text-[12.5px] hover:text-white transition-colors mt-1"
        >
          <ArrowLeft size={14} /> {backLabel}
        </button>
      </div>
    </div>
  );
}
