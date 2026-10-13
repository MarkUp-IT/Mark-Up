import { API_BASE } from "@/lib/api";

/**
 * Kirim error yang terjadi di browser ke server supaya tercatat di log.
 *
 * Selama ini pesan error asli berhenti di console browser pengguna, jadi yang
 * sampai ke kami cuma screenshot layar "Halaman ini gagal ditampilkan" tanpa
 * satu pun petunjuk teknis. Dua kali kejadian, dua kali tidak bisa
 * direproduksi. Dengan ini penyebabnya langsung terbaca di log server.
 *
 * Semua kemungkinan gagal ditelan: ini dipanggil DARI halaman error, jadi
 * kalau pelaporannya sendiri melempar, pengguna akan melihat error di atas
 * error. keepalive dipakai supaya laporannya tetap terkirim walau pengguna
 * langsung menutup atau memuat ulang halaman.
 */
// Error yang asalnya dari ekstensi browser / in-app browser pengunjung, BUKAN
// dari kode kita -- dulu ikut tercatat & bikin log susah dibaca (mis.
// "Failed to connect to MetaMask", "window.webkit.messageHandlers" dari
// browser bawaan aplikasi iOS).
const BUKAN_DARI_KITA = [
  /metamask/i,
  /webkit\.messageHandlers/,
  /chrome-extension:\/\//,
  /moz-extension:\/\//,
  /safari-(web-)?extension:\/\//,
];

export function reportClientError(error, konteks = "render") {
  try {
    const teks = `${error?.message || ""}\n${error?.stack || ""}`;
    if (BUKAN_DARI_KITA.some((pola) => pola.test(teks))) return;

    const payload = JSON.stringify({
      url: typeof window !== "undefined" ? window.location.href : "",
      message: `[${konteks}] ${error?.message || String(error || "tidak diketahui")}`,
      digest: error?.digest || "",
      stack: error?.stack || "",
    });

    fetch(`${API_BASE}/api/accounts/client-error/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* jangan pernah membuat halaman error jadi lebih rusak */
  }
}
