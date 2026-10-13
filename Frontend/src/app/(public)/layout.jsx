"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/component/Navbar";
import { useDashboardOnlyGuard } from "@/lib/useDashboardOnlyGuard";

/**
 * Navbar dipasang SEKALI di sini, bukan di tiap halaman.
 *
 * Sebelumnya tiap halaman publik merender <Navbar> sendiri, sehingga setiap
 * klik menu meng-unmount lalu memasangnya lagi. Navbar punya state auth dan
 * memanggil /api/accounts/me/ saat mount, jadi area profil/login berkedip dan
 * request itu terulang di setiap perpindahan halaman.
 *
 * Aman dipindah ke sini karena Navbar berposisi `fixed` (di luar alur
 * dokumen), jadi letaknya di DOM tidak mempengaruhi tata letak halaman.
 *
 * Footer sengaja TIDAK ikut dipindah: latarnya semi-transparan dan mengandalkan
 * warna latar halaman di belakangnya, sementara tiap halaman punya latar
 * sendiri. Footer juga tidak punya state, jadi dipasang ulang pun tak terlihat.
 */
export default function PublicLayout({ children }) {
  useDashboardOnlyGuard();
  const pathname = usePathname();

  // Alur pendaftaran bootcamp memakai navbar solid, sisanya kaca.
  const variant = pathname?.startsWith("/bootcamp/") ? "solid" : "glass";

  return (
    <>
      <Navbar variant={variant} />
      {children}
    </>
  );
}
