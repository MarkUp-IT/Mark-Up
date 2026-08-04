"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { getAccessToken } from "@/lib/api";

/**
 * Wajib login buat buka halaman ini.
 *
 * Dipakai di halaman transaksi (checkout & pembayaran). Sebelumnya halaman
 * checkout kebuka bebas buat siapa pun -- orang dari popup promo bisa langsung
 * nyampe form pembayaran tanpa punya akun, baru mentok pas nekan tombol kirim.
 * Bikin bingung, dan datanya yang sudah diisi kebuang.
 *
 * Alamat halaman sekarang diselipin ke ?next= supaya habis login user balik ke
 * sini, bukan dilempar ke dashboard dan harus nyari ulang produknya.
 *
 * @returns {boolean} true kalau token ada (boleh nampilin isi halaman).
 */
export function useRequireLogin() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Dihitung saat render (bukan setState di dalam effect, yang memicu render
  // berantai). Di server localStorage gak ada -> false dulu, lalu benar begitu
  // ke-hydrate di browser.
  const [allowed] = useState(
    () => typeof window !== "undefined" && Boolean(getAccessToken()),
  );

  useEffect(() => {
    if (allowed) return;
    const qs = searchParams?.toString();
    const target = qs ? `${pathname}?${qs}` : pathname;
    // replace() bukan push() -- biar tombol "back" gak muter balik ke halaman
    // yang barusan nolak dia.
    router.replace(`/login?next=${encodeURIComponent(target)}`);
  }, [allowed, router, pathname, searchParams]);

  return allowed;
}
