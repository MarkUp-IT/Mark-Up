"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const EVENT_SEGARKAN = "markup:segarkan-badge-sidebar";

/** Panggil dari halaman begitu sesuatu yang dihitung badge sudah "dilihat"
 * (mis. halaman Transaksi selesai dimuat) supaya angkanya langsung padam. */
export function segarkanBadgeSidebar() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT_SEGARKAN));
}

/** Jalankan `fn` tiap ada segarkanBadgeSidebar(). Balikin fungsi pelepas
 * (buat cleanup useEffect). Dipakai lonceng notifikasi juga, supaya angka di
 * lonceng ikut turun saat notifikasi ditandai dibaca dari halaman lain. */
export function dengarkanSegarkan(fn) {
  window.addEventListener(EVENT_SEGARKAN, fn);
  return () => window.removeEventListener(EVENT_SEGARKAN, fn);
}

/**
 * Angka badge sidebar dashboard (admin/mentor/pembeli).
 *
 * Sidebar ada di layout, jadi TIDAK di-mount ulang saat pindah halaman. Dulu
 * angkanya cuma diambil sekali saat pertama dibuka -- badge yang sudah
 * ditindaklanjuti tetap nyala sampai halaman di-reload. Sekarang diambil
 * ulang tiap pindah halaman & tiap ada segarkanBadgeSidebar().
 */
export function useSidebarBadges(url, pathname) {
  const [badges, setBadges] = useState({});

  useEffect(() => {
    let batal = false;
    const ambil = () =>
      api
        .get(url)
        .then((data) => {
          if (!batal && data) setBadges(data);
        })
        .catch(() => {});
    ambil();
    window.addEventListener(EVENT_SEGARKAN, ambil);
    return () => {
      batal = true;
      window.removeEventListener(EVENT_SEGARKAN, ambil);
    };
  }, [url, pathname]);

  return badges;
}
