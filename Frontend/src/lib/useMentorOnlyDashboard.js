"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiRequest, getAccessToken } from "@/lib/api";

// Mentor yang udah login cuma boleh akses halaman di dalam dashboard mentor
// sendiri (/mentor/...) -- nggak boleh buka halaman publik (produk,
// kompetisi, /mentors, dst) atau halaman auth (login/register) lagi.
// Dipasang di layout (public) & (auth), plus homepage (di luar kedua grup
// itu). Role lain (student/admin/guest) nggak kena, biar publik tetap bisa
// diakses siapa aja.
export function useMentorOnlyDashboard() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!getAccessToken()) return;
    if (pathname?.startsWith("/mentor")) return;

    let cancelled = false;

    apiRequest("/api/accounts/me/")
      .then((res) => {
        if (cancelled) return;
        if (res?.is_logged_in && res.user?.role === "MENTOR") {
          router.replace(res.user.dashboard_href || "/mentor/active-classes");
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);
}
