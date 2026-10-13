"use client";

import DashboardLayout from "@/component/admin/DashboardLayout";
import { PenyediaJudulDashboard, useJudulDashboard } from "@/lib/dashboardChrome";

/**
 * Kerangka dashboard admin dipasang SEKALI di sini.
 *
 * Sebelumnya tiap halaman merender <DashboardLayout> sendiri, sehingga sidebar
 * dan header ikut di-unmount lalu dibuat ulang setiap kali menu diklik. Karena
 * useAuthGuard di dalamnya sempat merender layar putih kosong sambil memuat
 * profil, tiap perpindahan menu terlihat seperti halaman di-refresh.
 *
 * Next.js mempertahankan layout.jsx saat berpindah antar rute bersaudara, jadi
 * dengan dipindah ke sini sidebar tidak pernah mati-hidup lagi.
 */
export default function AdminDashboardLayout({ children }) {
  return (
    <PenyediaJudulDashboard>
      <Kerangka>{children}</Kerangka>
    </PenyediaJudulDashboard>
  );
}

/* Dipisah karena useJudulDashboard harus dibaca DI DALAM penyedianya. */
function Kerangka({ children }) {
  return <DashboardLayout title={useJudulDashboard()}>{children}</DashboardLayout>;
}
