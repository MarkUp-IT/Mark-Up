"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiRequest, getAccessToken } from "@/lib/api";

const DASHBOARD_ONLY_ROLES = ["MENTOR", "ADMIN"];

// Mentor & admin yang udah login cuma boleh akses dashboard mereka
// masing-masing (/mentor/... atau /admin/...) -- nggak boleh buka halaman
// publik (produk, kompetisi, /mentors, checkout, dst) atau halaman auth
// (login/register) lagi. Dipasang di layout (public) & (auth), plus
// homepage (di luar kedua grup itu). Student & guest nggak kena, biar
// publik tetap bisa diakses siapa aja.
export function useDashboardOnlyGuard() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!getAccessToken()) return;
    if (pathname?.startsWith("/mentor") || pathname?.startsWith("/admin")) return;

    let cancelled = false;

    apiRequest("/api/accounts/me/")
      .then((res) => {
        if (cancelled) return;
        if (res?.is_logged_in && DASHBOARD_ONLY_ROLES.includes(res.user?.role)) {
          router.replace(res.user.dashboard_href || "/login");
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);
}
