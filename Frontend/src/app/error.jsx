"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { reportClientError } from "@/lib/reportClientError";

// Error boundary tingkat rute. Tanpa berkas ini, satu error render di komponen
// mana pun bikin Next nampilin layar bawaan -- di produksi bunyinya cuma
// "Application error: a client-side exception has occurred", tanpa merek dan
// tanpa jalan buat pulih selain reload manual.
//
// Wajib client component: error boundary di React cuma bisa jalan di klien.
export default function Error({ error, reset }) {
  const [detailTampil, setDetailTampil] = useState(false);

  useEffect(() => {
    console.error("Render error:", error);
    // Dikirim ke server juga. Tanpa ini, pesan aslinya berhenti di console
    // browser pengguna dan yang sampai ke kami cuma screenshot layar ini --
    // sudah dua kali kejadian dan dua kali tidak bisa direproduksi.
    reportClientError(error, "render");
  }, [error]);

  // Pesan mentah tidak ditampilkan langsung karena isinya teknis dan tidak
  // berguna buat kebanyakan orang. Tapi disembunyikan di balik satu klik,
  // supaya kalau kami minta, satu screenshot saja sudah cukup menjelaskan.
  const detail = [
    error?.message && `Pesan: ${error.message}`,
    error?.digest && `Kode: ${error.digest}`,
    typeof window !== "undefined" && `Halaman: ${window.location.href}`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <main className="font-jakarta bg-[#060010] text-white min-h-screen flex flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-[#F87171] text-[14px] font-semibold tracking-[0.2em]">
        ADA YANG BERMASALAH
      </p>

      <h1 className="mt-4 text-[28px] sm:text-[38px] font-bold leading-tight max-w-[620px]">
        Halaman ini gagal ditampilkan
      </h1>

      <p className="mt-4 text-[#A19DAB] text-[15px] leading-relaxed max-w-[520px]">
        Kesalahan ini dari sisi kami, bukan dari yang kamu lakukan. Coba muat
        ulang halamannya &mdash; kalau masih berulang, kabari tim kami.
      </p>

      {/* digest = ID error yang dibikin Next di produksi. Ini satu-satunya
          detail teknis yang aman ditunjukin, dan justru berguna: user bisa
          nyebutin kodenya waktu lapor, tim tinggal cari di log. */}
      {error?.digest && (
        <p className="mt-5 rounded-[8px] border border-[#2D2342] bg-[#170F26] px-4 py-2 font-mono text-[12px] text-[#6B6577]">
          Kode error: {error.digest}
        </p>
      )}

      <div className="mt-9 flex flex-col sm:flex-row items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="w-full sm:w-auto rounded-[10px] bg-[#148F89] px-7 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-[#117A75]"
        >
          Coba Lagi
        </button>
        <Link
          href="/"
          className="w-full sm:w-auto rounded-[10px] border border-[#2D2342] px-7 py-3 text-[14px] font-semibold text-white transition-colors hover:border-[#4C1D95]"
        >
          Kembali ke Beranda
        </Link>
      </div>

      {detail && (
        <div className="mt-8 w-full max-w-[560px]">
          <button
            type="button"
            onClick={() => setDetailTampil((v) => !v)}
            className="text-[#6B6577] text-[12.5px] underline hover:text-[#A19DAB] transition-colors"
          >
            {detailTampil ? "Sembunyikan detail teknis" : "Lihat detail teknis"}
          </button>
          {detailTampil && (
            <pre className="mt-3 whitespace-pre-wrap break-words rounded-[8px] border border-[#2D2342] bg-[#170F26] px-4 py-3 text-left font-mono text-[11.5px] leading-relaxed text-[#A19DAB]">
              {detail}
            </pre>
          )}
        </div>
      )}

      <p className="mt-10 text-[#6B6577] text-[13px]">
        Masih bermasalah?{" "}
        <Link href="/contact" className="text-[#B19EEF] hover:underline">
          Hubungi tim kami
        </Link>
        .
      </p>
    </main>
  );
}
