"use client";

import { useSyncExternalStore } from "react";
import { getAccessToken } from "@/lib/api";

// Tidak ada yang perlu di-langgan: token cuma dibaca sekali saat halaman
// dibuka. Fungsi kosong ini wajib ada karena useSyncExternalStore memintanya.
const noopSubscribe = () => () => {};

/**
 * Status login yang aman dipakai buat nge-gate halaman.
 *
 * Balikannya TIGA kemungkinan:
 *   null  -> belum ketahuan (masih di server / belum ke-hydrate)
 *   true  -> sudah login
 *   false -> belum login
 *
 * Kenapa useSyncExternalStore, bukan useState/useEffect biasa:
 * localStorage cuma ada di browser, jadi nilai di server dan di browser beda.
 * Kalau dibaca lewat useState initializer, React nahan nilai versi server
 * (false) waktu hydrate -- akibatnya user yang SUDAH login tetap kena popup
 * "harus login". Hook ini memang dirancang React buat kasus beda-nilai
 * server/klien kayak gini, tanpa hydration mismatch dan tanpa setState di
 * dalam effect.
 *
 * Yang manggil harus nunggu nilainya bukan null sebelum nampilin gerbang --
 * kalau nggak, popup bakal berkedip sekilas buat semua orang.
 */
export function useIsLoggedIn() {
  return useSyncExternalStore(
    noopSubscribe,
    () => Boolean(getAccessToken()),
    () => null,
  );
}
