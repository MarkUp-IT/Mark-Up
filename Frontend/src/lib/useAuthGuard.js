"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, getAccessToken, clearTokens } from "@/lib/api";

// Cek token + role user yang lagi login, redirect kalau belum login atau
// rolenya gak sesuai dashboard yang diakses. Dipakai bareng di ketiga
// DashboardLayout (admin/mentor/user) supaya orang gak bisa langsung ketik
// URL dashboard role lain di address bar.
export function useAuthGuard(allowedRoles) {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [checked, setChecked] = useState(false);
  const rolesKey = allowedRoles.join(",");

  useEffect(() => {
    let isMounted = true;

    if (!getAccessToken()) {
      router.replace("/login");
      return;
    }

    apiRequest("/api/accounts/me/")
      .then((res) => {
        if (!isMounted) return;
        const user = res?.user;
        if (!user) {
          router.replace("/login");
          return;
        }
        if (!rolesKey.split(",").includes(user.role)) {
          router.replace(user.dashboard_href || "/login");
          return;
        }
        setProfile(user);
        setChecked(true);
      })
      .catch(() => {
        if (!isMounted) return;
        clearTokens();
        router.replace("/login");
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolesKey, router]);

  return { profile, checked };
}
