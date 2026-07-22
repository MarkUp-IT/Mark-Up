"use client";

import { useRef, useState } from "react";
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
  const [scriptReady, setScriptReady] = useState(false);

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

  // Dipanggil begitu <Script> beneran selesai load (bukan nebak/polling) --
  // di titik ini window.google.accounts.id dijamin udah ada.
  function handleScriptLoad() {
    setScriptReady(true);
    if (!buttonRef.current) return;
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

  if (!CLIENT_ID) return null;

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
        onError={() => toast.error("Gagal memuat Google Sign-In", {
          description: "Cek koneksi internet kamu, atau muat ulang halaman.",
        })}
      />
      <div className="flex items-center gap-3 my-1">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-[12px] text-[#9CA3AF]">atau</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>
      {/* Div ini sengaja gak pernah dikasih children dari React -- begitu
          Google SDK render tombolnya ke sini, ia manipulasi DOM-nya langsung
          (nyisipin iframe dkk) di luar sepengetahuan React. Kalau React
          ikut nge-render/ngubah isi div yang sama (misal lewat state kayak
          `scriptReady`), React bisa nyoba hapus node yang udah keburu
          diganti Google, bikin crash "removeChild ... not a child of this
          node". Makanya indikator loading-nya taruh di div terpisah. */}
      <div ref={buttonRef} className="w-full flex justify-center min-h-[44px]" />
      {!scriptReady && (
        <p className="text-[12px] text-[#9CA3AF] text-center -mt-1">
          Memuat opsi Google...
        </p>
      )}
    </>
  );
}
