"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { toast } from "sonner";
import { api, ApiError, setTokens } from "@/lib/api";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

function redirectByRole(router, role) {
  window.setTimeout(() => {
    switch (role) {
      case "ADMIN":
        router.push("/admin");
        break;
      case "MENTOR":
        router.push("/mentor/active-classes");
        break;
      case "STUDENT":
      default:
        router.push("/user/my-products");
        break;
    }
  }, 1200);
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.617z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" />
    </svg>
  );
}

// Tombol custom (bukan tombol bawaan Google) -- disamain persis sama tombol
// "Masuk"/"Daftar" (ukuran, radius, bobot font), cuma beda warna. Dipakai
// bareng di halaman login & register karena backend-nya satu endpoint yang
// sama (google-login/): otomatis bikin akun baru kalau emailnya belum
// terdaftar, atau login kalau sudah ada.
export default function GoogleSignInButton() {
  const router = useRouter();
  const [scriptReady, setScriptReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  function handleTokenResponse(tokenResponse) {
    if (!tokenResponse?.access_token) {
      setIsLoading(false);
      return;
    }

    api
      .post(
        "/api/accounts/google-login/",
        { access_token: tokenResponse.access_token },
        { auth: false },
      )
      .then((data) => {
        setTokens({ access: data.access, refresh: data.refresh });
        toast.success("Berhasil masuk", {
          description: "Kamu akan diarahkan ke dashboard.",
        });
        redirectByRole(router, data.user?.role);
      })
      .catch((err) => {
        const message =
          err instanceof ApiError ? err.message : "Terjadi kesalahan. Coba lagi.";
        toast.error("Login Google gagal", { description: message });
      })
      .finally(() => setIsLoading(false));
  }

  function handleClick() {
    if (!scriptReady || isLoading) return;
    setIsLoading(true);

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: "openid email profile",
      callback: handleTokenResponse,
      error_callback: () => setIsLoading(false),
    });
    client.requestAccessToken();
  }

  if (!CLIENT_ID) return null;

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onError={() => toast.error("Gagal memuat Google Sign-In", {
          description: "Cek koneksi internet kamu, atau muat ulang halaman.",
        })}
      />
      <div className="flex items-center gap-3 my-1">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-[12px] text-[#9CA3AF]">atau</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>
      <button
        type="button"
        onClick={handleClick}
        disabled={!scriptReady || isLoading}
        className="bg-white flex items-center justify-center gap-2.5 w-full h-[48px] rounded-[12px] text-[#1F1F1F] font-bold text-[14px] disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
      >
        <GoogleLogo />
        {isLoading ? "Memproses..." : "Continue with Google"}
      </button>
    </>
  );
}
