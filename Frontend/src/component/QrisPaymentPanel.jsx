"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { AlertCircle, CheckCircle2, Loader2, Timer } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { extractErrorMessage } from "@/lib/formErrors";

const POLL_MS = 3000;

const formatIDR = (val) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(val));

function formatCountdown(totalSeconds) {
  const s = Math.max(0, totalSeconds || 0);
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

/**
 * Panel QRIS Direct Payment -- dipakai BARENG oleh halaman checkout produk
 * & halaman bayar pendaftaran bootcamp, biar logika QR/countdown/polling-nya
 * gak ditulis dobel di dua tempat.
 *
 * `onCreateTransaction` (wajib): async function beda per halaman pemanggil
 * (checkout/[productId]/payment vs bootcamp/.../pay), tugasnya CUMA bikin
 * Transaction gateway=IPAYMU lewat endpoint checkout masing-masing dan
 * balikin transaction_id-nya. Panel ini yang nanganin SEMUA yang terjadi
 * SETELAH transaksi ada: minta QRIS (create_ipaymu_qris di backend),
 * gambar QR-nya sendiri dari qr_string (BUKAN redirect ke halaman iPaymu --
 * lihat catatan di mark_up/ipaymu.py soal kenapa), hitung mundur PERSIS
 * sesuai expires_at ASLI dari server (bukan cosmetic kayak timer manual),
 * poll status pembayaran, dan tangani hasil akhirnya (lunas/kedaluwarsa).
 *
 * `onPaid` (wajib): dipanggil begitu polling mendeteksi status PAID --
 * pemanggil yang nentuin toast/redirect/refetch-nya sendiri.
 */
export default function QrisPaymentPanel({ onCreateTransaction, onPaid, disabled }) {
  // idle -> creating -> showing -> paid | expired  (atau idle -> error)
  const [status, setStatus] = useState("idle");
  const [qrString, setQrString] = useState("");
  const [total, setTotal] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const pollRef = useRef(null);
  const tickRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  const stopTimers = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
  };

  const startPolling = (transactionId) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await apiRequest(`/api/transactions/${transactionId}/status/`);
        if (res.payment_status === "PAID") {
          stopTimers();
          setStatus("paid");
          onPaid?.();
        } else if (res.payment_status === "EXPIRED" || res.payment_status === "FAILED") {
          stopTimers();
          setStatus("expired");
        }
      } catch {
        // Diam -- satu request poll gagal jangan hentikan siklusnya,
        // biarkan interval berikutnya coba lagi.
      }
    }, POLL_MS);
  };

  const startCountdown = (expiresAtIso) => {
    const tick = () => {
      const left = Math.round((new Date(expiresAtIso).getTime() - Date.now()) / 1000);
      setSecondsLeft(Math.max(0, left));
      if (left <= 0) {
        stopTimers();
        setStatus("expired");
      }
    };
    tick();
    tickRef.current = setInterval(tick, 1000);
  };

  const handleStart = async () => {
    if (status === "creating" || disabled) return;
    setStatus("creating");
    setErrorMsg("");
    try {
      const transactionId = await onCreateTransaction();
      const qrRes = await apiRequest(`/api/transactions/${transactionId}/ipaymu/qris/`, {
        method: "POST",
      });
      setQrString(qrRes.qr_string);
      setTotal(qrRes.total);
      setStatus("showing");
      if (qrRes.expires_at) startCountdown(qrRes.expires_at);
      startPolling(transactionId);
    } catch (err) {
      setErrorMsg(extractErrorMessage(err, "Gagal memulai pembayaran QRIS."));
      setStatus("error");
    }
  };

  const handleRetry = () => {
    stopTimers();
    setStatus("idle");
    setQrString("");
    setTotal(null);
    setSecondsLeft(null);
    setErrorMsg("");
  };

  if (status === "idle" || status === "error") {
    return (
      <div className="flex flex-col gap-3">
        {errorMsg && (
          <p className="flex items-start gap-2 text-red-400 text-[11px] bg-red-500/10 border border-red-500/30 rounded-[8px] px-3 py-2.5">
            <AlertCircle size={13} className="shrink-0 mt-0.5" />
            {errorMsg}
          </p>
        )}
        <button
          onClick={handleStart}
          disabled={disabled}
          className="w-full py-3.5 rounded-[8px] font-bold text-[13px] bg-[#148F89] text-white hover:bg-[#117A75] transition-colors disabled:opacity-60"
        >
          Tampilkan Kode QRIS
        </button>
      </div>
    );
  }

  if (status === "creating") {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <Loader2 size={24} className="text-[#148F89] animate-spin" />
        <p className="text-[#9CA3AF] text-[12px]">Menyiapkan kode QRIS...</p>
      </div>
    );
  }

  if (status === "paid") {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="w-14 h-14 rounded-full bg-[#148F89]/10 border border-[#148F89]/30 flex items-center justify-center">
          <CheckCircle2 size={26} className="text-[#148F89]" />
        </div>
        <div>
          <h3 className="text-white font-bold text-[16px]">Pembayaran Berhasil</h3>
          <p className="text-[#9CA3AF] text-[12px] mt-1">Akses sudah terbuka.</p>
        </div>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <Timer size={24} className="text-red-400" />
        </div>
        <div>
          <h3 className="text-white font-bold text-[15px]">Waktu Bayar Habis</h3>
          <p className="text-[#9CA3AF] text-[12px] mt-1">
            Kode QRIS sudah kedaluwarsa. Coba lagi buat dapat kode baru.
          </p>
        </div>
        <button
          onClick={handleRetry}
          className="px-5 py-2.5 rounded-[8px] bg-[#148F89] text-white font-semibold text-[13px] hover:bg-[#117A75] transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  // status === "showing"
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white p-3 rounded-[10px]">
        <QRCodeSVG value={qrString} size={220} level="M" />
      </div>
      {total != null && <p className="text-white font-bold text-[18px]">{formatIDR(total)}</p>}
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-[8px] border text-[12px] font-medium ${
          secondsLeft != null && secondsLeft <= 60
            ? "bg-red-500/10 border-red-500/30 text-red-400"
            : "bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#FBBF24]"
        }`}
      >
        <Timer size={14} />
        Bayar sebelum{" "}
        <span className="font-mono font-bold">{formatCountdown(secondsLeft ?? 0)}</span>
      </div>
      <p className="text-[#9CA3AF] text-[11px] text-center leading-relaxed max-w-[280px]">
        Scan pakai aplikasi e-wallet atau m-banking mana pun yang support QRIS. Halaman ini
        otomatis update begitu pembayaran diterima -- gak perlu refresh.
      </p>
    </div>
  );
}
