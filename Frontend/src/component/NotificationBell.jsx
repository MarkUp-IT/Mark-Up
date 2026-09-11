"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck } from "lucide-react";
import { apiRequest } from "@/lib/api";
import GlassShine from "@/component/GlassShine";

const POLL_MS = 45000;

function formatRelatif(iso) {
  const detik = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (detik < 60) return "Baru saja";
  if (detik < 3600) return `${Math.floor(detik / 60)} menit lalu`;
  if (detik < 86400) return `${Math.floor(detik / 3600)} jam lalu`;
  return `${Math.floor(detik / 86400)} hari lalu`;
}

/**
 * Tombol lonceng notifikasi -- dipakai di Navbar (role user, tampil ke mana
 * pun selagi login) dan mentor/Header (role mentor, khusus dashboard).
 * Polling ringan tiap 45 detik buat angka badge; daftarnya sendiri baru
 * ditarik ulang begitu dropdown dibuka, biar gak nge-fetch isi lengkap
 * terus-terusan padahal jarang dibuka.
 */
export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);

  const fetchAll = useCallback(async () => {
    try {
      const res = await apiRequest("/api/accounts/me/notifications/");
      setItems(res?.notifications || []);
      setUnreadCount(res?.unread_count || 0);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, POLL_MS);
    return () => clearInterval(id);
  }, [fetchAll]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleToggle = () => {
    setOpen((v) => !v);
    if (!open) fetchAll();
  };

  const handleClickItem = async (n) => {
    setOpen(false);
    if (!n.is_read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await apiRequest("/api/accounts/me/notifications/mark-read/", {
          method: "POST",
          body: { id: n.id },
        });
      } catch (err) {
        console.error(err);
      }
    }
    if (n.url) router.push(n.url);
  };

  const handleMarkAllRead = async () => {
    if (loading || unreadCount === 0) return;
    setLoading(true);
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
      setLoading(false);
    }
  };

  return (
    // h-11 + flex items-center -- SENGAJA disamakan tingginya sama bungkus
    // tombol profil (avatar 36px + py-1 = 44px total), walau tombol lonceng
    // sendiri cuma 36px. Bungkus ini yang jadi acuan "top-[120%]" di bawah,
    // jadi dropdown-nya jatuh di jarak yang PERSIS sama dari navbar kayak
    // dropdown Dashboard/Logout, bukan lebih mepet gara-gara bungkusnya
    // lebih pendek.
    <div className="relative z-50 h-11 flex items-center" ref={wrapRef}>
      <button
        onClick={handleToggle}
        aria-label="Notifikasi"
        className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/10 transition-colors"
      >
        <Bell size={18} className="text-white" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[#EF4444] text-white text-[9px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-[120%] mt-2 w-[320px] max-w-[90vw] rounded-[14px] border border-white/20 bg-white/10 backdrop-blur-md shadow-2xl z-[100] overflow-hidden"
          >
            <GlassShine borderRadius={14} />
            <div className="relative z-10">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <p className="text-white font-bold text-[13.5px]">Notifikasi</p>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    disabled={loading}
                    className="flex items-center gap-1 text-[11px] text-[#9CA3AF] hover:text-white transition-colors disabled:opacity-50"
                  >
                    <CheckCheck size={13} />
                    Tandai semua dibaca
                  </button>
                )}
              </div>

              <div className="max-h-[360px] overflow-y-auto p-2">
                {items.length === 0 ? (
                  <p className="px-2 py-8 text-center text-[#9CA3AF] text-[12.5px]">
                    Belum ada notifikasi.
                  </p>
                ) : (
                  items.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleClickItem(n)}
                      className={`w-full text-left px-4 py-3 rounded-[10px] hover:bg-white/10 transition-colors flex gap-2.5 ${
                        n.is_read ? "opacity-60" : ""
                      }`}
                    >
                      <span
                        className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                          n.is_read ? "bg-transparent" : "bg-[#148F89]"
                        }`}
                      />
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <p className="text-white text-[12.5px] font-semibold truncate">{n.title}</p>
                        <p className="text-[#9CA3AF] text-[11.5px] leading-relaxed line-clamp-2">
                          {n.message}
                        </p>
                        <p className="text-[#6B7280] text-[10.5px] mt-0.5">
                          {formatRelatif(n.created_at)}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
