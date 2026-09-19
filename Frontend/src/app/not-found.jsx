import Link from "next/link";

// Halaman 404 milik MarkUp. Sebelum ini nggak ada not-found.jsx sama sekali,
// jadi setiap link mati (atau URL salah ketik) nampilin halaman bawaan Next
// yang polos dan berbahasa Inggris -- bikin situsnya keliatan rusak, bukan
// keliatan "halamannya emang nggak ada".
//
// Sengaja SERVER component (nggak ada "use client"): isinya statis, jadi nggak
// perlu ngirim JavaScript apa pun buat nampilin ini.
export default function NotFound() {
  return (
    <main className="font-jakarta bg-[#060010] text-white min-h-screen flex flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-[#08C7E1] text-[14px] font-semibold tracking-[0.2em]">
        ERROR 404
      </p>

      <h1 className="mt-4 text-[32px] sm:text-[44px] font-bold leading-tight max-w-[620px]">
        Halaman yang kamu cari tidak ditemukan
      </h1>

      <p className="mt-4 text-[#A19DAB] text-[15px] leading-relaxed max-w-[520px]">
        Mungkin alamatnya salah ketik, atau halamannya sudah dipindahkan.
        Coba kembali ke beranda dan mulai dari sana.
      </p>

      <div className="mt-9 flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/"
          className="w-full sm:w-auto rounded-[10px] bg-[#148F89] px-7 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-[#117A75]"
        >
          Kembali ke Beranda
        </Link>
        <Link
          href="/products"
          className="w-full sm:w-auto rounded-[10px] border border-[#2D2342] px-7 py-3 text-[14px] font-semibold text-white transition-colors hover:border-[#4C1D95]"
        >
          Lihat Produk
        </Link>
      </div>

      <p className="mt-10 text-[#6B6577] text-[13px]">
        Merasa ini seharusnya ada?{" "}
        <Link href="/contact" className="text-[#B19EEF] hover:underline">
          Hubungi tim kami
        </Link>
        .
      </p>
    </main>
  );
}
