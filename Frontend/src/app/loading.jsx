// Tampilan sementara selagi berkas JavaScript rute yang dituju masih diunduh.
// Sebelum ada berkas ini, perpindahan halaman nggak ngasih tanda apa pun --
// layar diam di halaman lama, lalu tiba-tiba ganti. Paling kerasa di halaman
// besar (mis. dashboard admin produk) di koneksi lambat.
//
// Server component tanpa state: nggak nambah JavaScript ke bundle sama sekali.
// Animasinya pakai `animate-pulse` bawaan Tailwind, dan Tailwind sendiri sudah
// otomatis menonaktifkannya buat user yang menyalakan "reduce motion".
export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="font-jakarta bg-[#060010] min-h-screen flex flex-col items-center justify-center gap-4 px-6"
    >
      <div className="flex items-center gap-2" aria-hidden="true">
        <span className="h-2.5 w-2.5 rounded-full bg-[#08C7E1] animate-pulse [animation-delay:0ms]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#B19EEF] animate-pulse [animation-delay:150ms]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#148F89] animate-pulse [animation-delay:300ms]" />
      </div>

      <p className="text-[#A19DAB] text-[14px]">Memuat halaman...</p>
    </div>
  );
}
