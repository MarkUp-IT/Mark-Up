"use client";

import NotificationHistoryPage from "@/component/NotificationHistoryPage";
import EmptyState from "@/component/user/EmptyState";

export default function UserNotificationsPage() {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-[#9CA3AF] text-[13.5px]">
        Semua notifikasi buat akunmu -- yang sudah dibaca tetap tersimpan di sini sebagai riwayat.
      </p>
      <NotificationHistoryPage theme="dark" EmptyState={EmptyState} />
    </div>
  );
}
