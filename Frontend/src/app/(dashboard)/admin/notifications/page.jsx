"use client";

import NotificationHistoryPage from "@/component/NotificationHistoryPage";
import EmptyState from "@/component/admin/EmptyState";

export default function AdminNotificationsPage() {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-[#64748B] text-[13.5px]">
        Semua notifikasi buat akun admin ini -- transaksi/pendaftaran/pembayaran baru yang butuh
        ditinjau, plus yang sudah dibaca tetap tersimpan di sini sebagai riwayat.
      </p>
      <NotificationHistoryPage theme="light" EmptyState={EmptyState} />
    </div>
  );
}
