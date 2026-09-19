import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";

// Rekening tujuan transfer sekarang diatur admin lewat Pengaturan > Rekening
// Pembayaran, bukan lagi hardcode di file ini (dulu ganti rekening = ganti
// kode + deploy ulang). Nilai awalnya di-seed dari nilai lama lewat migrasi,
// jadi gak ada yang berubah dari sisi user sampai admin ngedit sendiri.
export const BANK_INFO_FALLBACK = {
  name: "",
  account: "",
  holder: "",
};

/**
 * Ambil rekening tujuan transfer dari server.
 * Endpoint-nya publik karena halaman bayar harus bisa nampilin ini apa adanya.
 */
export function useBankInfo() {
  const [bankInfo, setBankInfo] = useState(BANK_INFO_FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiRequest("/api/transactions/bank-account/", { auth: false });
        if (cancelled || !res) return;
        setBankInfo({
          name: res.bank_name || "",
          account: res.account_number || "",
          holder: res.account_holder || "",
        });
      } catch {
        // Sengaja dibiarin kosong kalau gagal -- lebih aman nampilin field
        // kosong daripada rekening basi yang bikin user salah transfer.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { bankInfo, loading };
}
