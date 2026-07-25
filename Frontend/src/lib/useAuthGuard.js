"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiRequest, getAccessToken, clearTokens } from "@/lib/api";

// Cek token + role user yang lagi login, redirect kalau belum login atau
// rolenya gak sesuai dashboard yang diakses. Dipakai bareng di ketiga
// DashboardLayout (admin/mentor/user) supaya orang gak bisa langsung ketik
// URL dashboard role lain di address bar.
//
// Sekalian nge-gate mentor yang profilnya belum lengkap (field wajib belum
// semua keisi, lihat _is_mentor_profile_complete di backend) -- dipaksa ke
// /mentor/settings dulu, nggak bisa buka halaman dashboard mentor lainnya
// sampai lengkap. Ini SENGAJA di-scope ke role === "MENTOR" doang -- student
// juga punya is_profile_complete di response-nya (dipakai buat gate checkout
// di halaman terpisah, bukan lock dashboard blanket kayak mentor), jadi
// kalau nggak di-scope, student baru daftar (profil pasti belum lengkap)
// bakal ke-redirect salah ke /mentor/settings gara-gara kondisi ini match.
export function useAuthGuard(allowedRoles) {
  const router = useRouter();
  const pathname = usePathname();
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
        if (
          user.role === "MENTOR" &&
          user.is_profile_complete === false &&
          !pathname?.startsWith("/mentor/settings")
        ) {
          router.replace("/mentor/settings");
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
  }, [rolesKey, router, pathname]);

  return { profile, checked };
}
