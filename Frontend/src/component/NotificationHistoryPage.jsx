"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck } from "lucide-react";
import { apiRequest } from "@/lib/api";

// 200 -- sama seperti batas maksimum yang diterima backend (lihat
// get_notifications di accounts/views.py). Cukup buat "histori" yang jauh
// lebih panjang dari 30 baris di dropdown lonceng, tanpa mesti bikin
// paginasi buat kasus yang jarang sekali kejadian (akun numpuk >200
// notifikasi individual).
const HISTORY_LIMIT = 200;

function formatLengkap(iso) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  }) + " WIB";
}

function formatRelatif(iso) {
  const detik = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (detik < 60) return "Baru saja";
  if (detik < 3600) return `${Math.floor(detik / 60)} menit lalu`;
  if (detik < 86400) return `${Math.floor(detik / 3600)} jam lalu`;
  return `${Math.floor(detik / 86400)} hari lalu`;
}

const THEMES = {
  dark: {
    card: "bg-[#170F26]/60 border border-[#2D2342]",
    itemBorder: "border-[#2D2342]",
    itemHover: "hover:bg-white/5",
    title: "text-white",
    subtitle: "text-[#9CA3AF]",
    msg: "text-[#D1D5DB]",
    time: "text-[#6B7280]",
    unreadBg: "bg-[#148F89]/10",
    action: "text-[#9CA3AF] hover:text-white",
    empty: "text-[#9CA3AF]",
  },
  light: {
    card: "bg-white border border-[#E2E8F0]",
    itemBorder: "border-[#E2E8F0]",
    itemHover: "hover:bg-[#F8FAFC]",
    title: "text-[#0F172A]",
    subtitle: "text-[#64748B]",
    msg: "text-[#334155]",
    time: "text-[#94A3B8]",
    unreadBg: "bg-[#148F89]/5",
    action: "text-[#64748B] hover:text-[#0F172A]",
    empty: "text-[#94A3B8]",
  },
};

/**
 * Histori notifikasi LENGKAP -- beda dari dropdown lonceng (NotificationBell)
 * yang cuma nampilin 30 terbaru & isi pesannya dipotong (line-clamp).
 * Notifikasi yang SUDAH dibaca tetap tampil di sini (cuma dibedain gaya
 * visualnya), jadi halaman ini sekaligus jadi riwayat -- bukan cuma daftar
 * yang belum dibaca.
 *
 * Satu komponen dipakai ulang oleh ketiga role (student/mentor/admin) --
 * endpoint backend-nya sendiri sudah role-agnostic (Notification.user =
 * request.user, dapetnya notifikasi punya sendiri apa pun rolenya), beda
 * cuma di tema warna (dashboard admin terang, dua lainnya gelap).
 */
export default function NotificationHistoryPage({ theme = "dark", EmptyState }) {
  const t = THEMES[theme] || THEMES.dark;
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/api/accounts/me/notifications/?limit=${HISTORY_LIMIT}`);
      setItems(res?.notifications || []);
      setUnreadCount(res?.unread_count || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const markRead = async (id) => {
    setBusyId(id);
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, is_read: true } : x)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await apiRequest("/api/accounts/me/notifications/mark-read/", {
        method: "POST",
        body: { id },
      });
    } catch (err) {
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkAllRead = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    setItems((prev) => prev.map((x) => ({ ...x, is_read: true })));
    setUnreadCount(0);
    try {
      await apiRequest("/api/accounts/me/notifications/mark-read/", {
        method: "POST",
        body: { all: true },
      });
    } catch (err) {
      console.error(err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleRowClick = (n) => {
    if (!n.is_read) markRead(n.id);
    if (n.url) router.push(n.url);
  };

  if (loading) {
    return <div className={`rounded-[12px] p-10 text-center text-[13.5px] ${t.card} ${t.empty}`}>Memuat notifikasi...</div>;
  }

  if (items.length === 0) {
    return EmptyState ? (
      <EmptyState message="Belum ada notifikasi buat kamu sejauh ini." />
    ) : (
      <div className={`rounded-[12px] p-12 flex flex-col items-center gap-3 text-center ${t.card}`}>
        <Bell size={32} className={t.empty} />
        <p className={`text-[13.5px] max-w-[320px] ${t.empty}`}>Belum ada notifikasi buat kamu sejauh ini.</p>
      </div>
    );
  }

  return (
    <div className={`rounded-[12px] overflow-hidden ${t.card}`}>
      <div className={`flex items-center justify-between px-5 py-3.5 border-b ${t.itemBorder}`}>
        <p className={`text-[13px] ${t.subtitle}`}>
          {unreadCount > 0 ? (
            <>
              <span className={`font-bold ${t.title}`}>{unreadCount}</span> belum dibaca dari {items.length} total notifikasi
            </>
          ) : (
            `${items.length} notifikasi -- semua sudah dibaca`
          )}
        </p>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className={`flex items-center gap-1.5 text-[12px] font-semibold transition-colors disabled:opacity-50 ${t.action}`}
          >
            <CheckCheck size={14} />
            Tandai semua dibaca
          </button>
        )}
      </div>

      <div className="divide-y" style={{ borderColor: "inherit" }}>
        {items.map((n) => (
          <div
            key={n.id}
            className={`flex items-start gap-3 px-5 py-4 transition-colors ${t.itemHover} ${t.itemBorder} border-b last:border-b-0 ${
              !n.is_read ? t.unreadBg : ""
            }`}
          >
            <span
              className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.is_read ? "bg-transparent" : "bg-[#148F89]"}`}
              aria-hidden
            />
            <button
              onClick={() => handleRowClick(n)}
              className="flex-1 min-w-0 text-left flex flex-col gap-1"
            >
              <p className={`text-[13.5px] font-semibold ${t.title}`}>{n.title}</p>
              <p className={`text-[12.5px] leading-relaxed whitespace-pre-line ${t.msg}`}>{n.message}</p>
              <p className={`text-[11px] mt-0.5 ${t.time}`}>
                {formatLengkap(n.created_at)} &middot; {formatRelatif(n.created_at)}
              </p>
            </button>
            {!n.is_read && (
              <button
                onClick={() => markRead(n.id)}
                disabled={busyId === n.id}
                title="Tandai sudah dibaca"
                className={`shrink-0 mt-1 p-1.5 rounded-full transition-colors disabled:opacity-50 ${t.action}`}
              >
                <Check size={15} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
