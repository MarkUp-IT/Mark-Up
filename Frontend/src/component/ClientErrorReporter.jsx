"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/reportClientError";

/**
 * Menangkap error browser yang TIDAK lewat error boundary React.
 *
 * error.jsx cuma menangkap kegagalan saat render. Error di penangan klik, di
 * dalam setTimeout, atau promise yang gagal tanpa catch tidak lewat sana --
 * halamannya tampak baik-baik saja tapi ada fungsi yang diam-diam mati, dan
 * tidak ada jejaknya sama sekali di sisi kami.
 *
 * Dipasang sekali di root layout. Tidak merender apa pun.
 */
export default function ClientErrorReporter() {
  useEffect(() => {
    const onError = (e) => {
      reportClientError(
        e?.error || { message: e?.message, stack: `${e?.filename}:${e?.lineno}:${e?.colno}` },
        "uncaught"
      );
    };
    const onRejection = (e) => {
      const r = e?.reason;
      reportClientError(
        r instanceof Error ? r : { message: String(r) },
        "promise"
      );
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
