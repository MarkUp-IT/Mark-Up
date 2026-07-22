"use client";

import { useEffect, useRef } from "react";
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

// Tombol "Lanjutkan dengan Google" -- dipakai bareng di halaman login &
// register karena backend-nya satu endpoint yang sama (google-login/):
// otomatis bikin akun baru kalau emailnya belum terdaftar, atau login kalau
// sudah ada, jadi gak perlu alur terpisah buat "daftar" vs "masuk".
export default function GoogleSignInButton() {
  const router = useRouter();
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!CLIENT_ID) return;

    function handleCredentialResponse(response) {
      api
        .post(
          "/api/accounts/google-login/",
          { credential: response.credential },
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
        });
    }

    function renderButton() {
      if (!window.google?.accounts?.id || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredentialResponse,
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        width: 380,
        text: "continue_with",
      });
    }

    if (window.google?.accounts?.id) {
      renderButton();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          renderButton();
        }
      }, 200);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!CLIENT_ID) return null;

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      <div className="flex items-center gap-3 my-1">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-[12px] text-[#9CA3AF]">atau</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>
      <div ref={buttonRef} className="w-full flex justify-center" />
    </>
  );
}
