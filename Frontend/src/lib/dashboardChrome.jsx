"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Judul halaman dashboard, dipetakan dari rutenya.
 *
 * Sebelumnya tiap halaman merender <DashboardLayout title="..."> sendiri.
 * Akibatnya sidebar & header ikut mati-hidup tiap pindah menu -- termasuk
 * useAuthGuard di dalamnya, yang sempat merender layar putih kosong sebelum
 * profil selesai dimuat. Itulah kedipan yang terlihat seperti "refresh".
 *
 * Sekarang layout-nya dipasang sekali di layout.jsx dan judulnya diturunkan
 * dari path, sehingga sidebar & header tidak pernah di-unmount saat navigasi.
 */
const JUDUL = {
  "/mentor/settings/change-password": "Ubah Kata Sandi",
  "/admin/settings/change-password": "Pengaturan",
  "/user/settings/change-password": "Ubah Kata Sandi",
  "/admin/bootcamp-registrations": "Pendaftaran Bootcamp",
  "/admin/orders/mentoring/[id]": "Detail Mentoring",
  "/admin/orders/bootcamp/[id]": "Detail Bootcamp",
  "/admin/user-management/[id]": "Detail Profil",
  "/mentor/active-classes/[id]": "Detail Kelas",
  "/mentor/mentoring-schedule": "Jadwal Mentoring",
  "/admin/orders/module/[id]": "Kelola Konten Modul",
  "/admin/bootcamp-refunds": "Pengembalian Commitment Fee",
  "/admin/orders/mentoring": "Kelola Pesanan · Mentoring",
  "/user/transactions/[id]": "Detail Transaksi",
  "/admin/orders/bootcamp": "Kelola Pesanan · Bootcamp",
  "/admin/refund-requests": "Pengajuan Refund",
  "/admin/user-management": "Manajemen User",
  "/mentor/active-classes": "Active Classes",
  "/user/my-products/[id]": "Detail Produk",
  "/admin/referral-codes": "Kode Referral",
  "/admin/orders/module": "Kelola Pesanan · Modul",
  "/mentor/certificates": "Certificates",
  "/mentor/transactions": "Transactions",
  "/admin/certificates": "Sertifikat",
  "/admin/competitions": "Info Lomba",
  "/admin/products/all": "Semua Produk",
  "/admin/transactions": "Transaksi",
  "/admin/audit-trail": "Audit Trail",
  "/user/certificates": "Sertifikat",
  "/user/transactions": "Transaksi",
  "/user/my-products": "My Products",
  "/admin/feedbacks": "Ulasan",
  "/mentor/settings": "Settings",
  "/admin/messages": "Pesan Masuk",
  "/admin/products": "Produk",
  "/admin/settings": "Pengaturan",
  "/mentor/reviews": "Reviews",
  "/admin/payouts": "Pencairan Mentor",
  "/user/settings": "Pengaturan Akun",
  "/admin": "Dashboard",
};

/** Rute dinamis dicocokkan sebagai awalan, mis. /admin/orders/bootcamp/<id>. */
export function judulDariPath(pathname) {
  if (!pathname) return "";
  const bersih = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (JUDUL[bersih]) return JUDUL[bersih];

  // Cocokkan pola bersegmen dinamis: /admin/orders/bootcamp/abc -> /admin/orders/bootcamp/[id]
  const bagian = bersih.split("/");
  for (let i = bagian.length - 1; i > 1; i--) {
    const pola = [...bagian.slice(0, i), "[id]"].join("/");
    if (JUDUL[pola]) return JUDUL[pola];
  }
  return "";
}

/* -------------------------------------------------------------------------
 * Penimpa judul
 *
 * Hampir semua halaman judulnya tetap dan cukup diambil dari path. Tapi ada
 * yang judulnya bergantung isi data -- /mentor/active-classes/[id] menampilkan
 * "Detail Bootcamp" atau "Detail Mentoring" tergantung jenis kelasnya, padahal
 * rutenya sama persis. Path saja tidak bisa membedakan keduanya, jadi halaman
 * seperti itu boleh menimpa judulnya sendiri.
 * ---------------------------------------------------------------------- */

const KonteksJudul = createContext(null);

export function PenyediaJudulDashboard({ children }) {
  const [timpa, setTimpa] = useState(null);
  const nilai = useMemo(() => ({ timpa, setTimpa }), [timpa]);
  return <KonteksJudul.Provider value={nilai}>{children}</KonteksJudul.Provider>;
}

/** Dipakai layout: judul dari path, kecuali ada halaman yang menimpanya. */
export function useJudulDashboard() {
  const pathname = usePathname();
  const ctx = useContext(KonteksJudul);
  return ctx?.timpa || judulDariPath(pathname);
}

/** Dipakai halaman yang judulnya bergantung data. Aman dipanggil dengan null. */
export function useTimpaJudulDashboard(judul) {
  const ctx = useContext(KonteksJudul);
  const setTimpa = ctx?.setTimpa;
  useEffect(() => {
    if (!setTimpa) return undefined;
    setTimpa(judul || null);
    // Dibersihkan saat halaman ditinggalkan supaya judulnya tidak ikut terbawa
    // ke halaman berikutnya -- layout-nya kini bertahan, jadi state ini juga.
    return () => setTimpa(null);
  }, [judul, setTimpa]);
}
