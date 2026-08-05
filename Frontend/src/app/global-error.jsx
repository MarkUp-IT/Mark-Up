"use client";

import { useEffect } from "react";

// Jaring terakhir: error yang kejadian di root layout itu sendiri nggak bisa
// ditangkep error.jsx (error.jsx dirender DI DALAM layout yang lagi rusak).
// global-error.jsx nggantiin seluruh dokumen, makanya wajib nulis <html> dan
// <body> sendiri.
//
// Styling-nya sengaja inline, bukan kelas Tailwind: kalau yang gagal ternyata
// pemuatan CSS-nya, kelas Tailwind nggak bakal ngefek dan user cuma lihat teks
// polos di atas latar putih. Inline style tetap jalan apa pun keadaannya.
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          padding: "24px",
          textAlign: "center",
          backgroundColor: "#060010",
          color: "#FFFFFF",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <h1 style={{ fontSize: "26px", fontWeight: 700, margin: 0 }}>
          MarkUp sedang bermasalah
        </h1>

        <p
          style={{
            margin: 0,
            maxWidth: "460px",
            fontSize: "15px",
            lineHeight: 1.6,
            color: "#A19DAB",
          }}
        >
          Terjadi kesalahan yang membuat halaman tidak bisa dimuat sama sekali.
          Coba muat ulang sebentar lagi.
        </p>

        {error?.digest && (
          <p
            style={{
              margin: 0,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: "12px",
              color: "#6B6577",
            }}
          >
            Kode error: {error.digest}
          </p>
        )}

        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: "8px",
            cursor: "pointer",
            borderRadius: "10px",
            border: "none",
            backgroundColor: "#148F89",
            color: "#FFFFFF",
            padding: "12px 28px",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          Muat Ulang
        </button>
      </body>
    </html>
  );
}
