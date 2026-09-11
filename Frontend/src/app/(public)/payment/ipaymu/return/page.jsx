"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock, XCircle, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/api";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 30000;

const formatIDR = (val) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(val));

/**
 * Halaman kembalian setelah pembeli selesai (atau batal) di halaman iPaymu.
 * MURNI KOSMETIK -- yang benar-benar menentukan status lunas/tidak adalah
 * webhook iPaymu ke backend (_mark_transaction_paid), BUKAN halaman ini.
 * Di sini cuma nge-poll status buat ditampilkan; gak pernah ada panggilan
 * yang mengubah state apa pun.
 */
function IpaymuReturnInner() {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get("transaction_id");

  const [status, setStatus] = useState(null); // null = belum ketahuan
  const [amount, setAmount] = useState(null);
  const [timedOut, setTimedOut] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!transactionId) return;
    try {
      const res = await apiRequest(`/api/transactions/${transactionId}/status/`);
      setStatus(res.payment_status);
      setAmount(res.grand_total);
    } catch {
      // Diam saja -- polling berikutnya coba lagi, atau timeout ngasih tombol manual.
    }
  }, [transactionId]);

  useEffect(() => {
    if (!transactionId) return undefined;

    // Cek pertama dijalankan lewat callback setTimeout (bukan panggilan
    // langsung di body effect) -- checkStatus ujung-ujungnya manggil
    // setState, dan pola yang disarankan buat itu adalah lewat callback
    // (respons ke suatu peristiwa), bukan langsung di badan effect.
    const kickoff = setTimeout(checkStatus, 0);

    const start = Date.now();
    const interval = setInterval(() => {
      if (Date.now() - start > POLL_TIMEOUT_MS) {
        setTimedOut(true);
        clearInterval(interval);
        return;
      }
      checkStatus();
    }, POLL_INTERVAL_MS);

    return () => {
      clearTimeout(kickoff);
      clearInterval(interval);
    };
  }, [transactionId, checkStatus]);

  if (!transactionId) {
    return (
      <Wrapper>
        <StateCard
          icon={<XCircle size={28} className="text-red-400" />}
          title="Transaksi Tidak Ditemukan"
          desc="Link ini gak lengkap. Coba cek status pembayaranmu di halaman Transaksi Saya."
          cta={{ href: "/user/transactions", label: "Lihat Transaksi Saya" }}
        />
      </Wrapper>
    );
  }

  if (status === "PAID") {
    return (
      <Wrapper>
        <StateCard
          icon={<CheckCircle2 size={28} className="text-[#148F89]" />}
          title="Pembayaran Berhasil"
          desc={amount != null ? `Pembayaran ${formatIDR(amount)} sudah dikonfirmasi. Akses sudah terbuka.` : "Pembayaran sudah dikonfirmasi. Akses sudah terbuka."}
          cta={{ href: "/user/my-products", label: "Lihat Produk Saya" }}
        />
      </Wrapper>
    );
  }

  if (status === "FAILED" || status === "EXPIRED") {
    return (
      <Wrapper>
        <StateCard
          icon={<XCircle size={28} className="text-red-400" />}
          title={status === "EXPIRED" ? "Sesi Pembayaran Kedaluwarsa" : "Pembayaran Tidak Berhasil"}
          desc="Kamu bisa coba lagi kapan saja dari halaman Transaksi Saya."
          cta={{ href: "/user/transactions", label: "Lihat Transaksi Saya" }}
        />
      </Wrapper>
    );
  }

  // Masih PENDING (atau belum ketahuan) -- baik masih dalam jendela polling
  // maupun sudah timeout, tampilan intinya sama, cuma beda ada tombol cek
  // manual atau enggak.
  return (
    <Wrapper>
      <StateCard
        icon={<Clock size={28} className="text-[#F59E0B] animate-pulse" />}
        title="Menunggu Konfirmasi"
        desc="Kami masih menunggu konfirmasi dari iPaymu. Biasanya cuma beberapa detik, kadang bisa sampai beberapa menit."
        extra={
          timedOut && (
            <button
              onClick={() => { setTimedOut(false); checkStatus(); }}
              className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-[8px] border border-[#2D2342] text-[#E2E8F0] text-[13px] font-semibold hover:bg-[#2D1B4E] transition-colors"
            >
              <RefreshCw size={14} /> Cek Status Manual
            </button>
          )
        }
        cta={{ href: "/user/transactions", label: "Lihat Transaksi Saya" }}
      />
    </Wrapper>
  );
}

function Wrapper({ children }) {
  return (
    <div className="w-full min-h-screen bg-[#0F081C] font-inter text-white flex items-center justify-center px-4">
      <div className="max-w-[420px] w-full">{children}</div>
    </div>
  );
}

function StateCard({ icon, title, desc, extra, cta }) {
  return (
    <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-8 flex flex-col items-center text-center gap-3">
      <div className="w-14 h-14 rounded-full bg-[#0F081C] border border-[#2D2342] flex items-center justify-center">
        {icon}
      </div>
      <h1 className="text-white font-bold text-[17px]">{title}</h1>
      <p className="text-[#9CA3AF] text-[13px] leading-relaxed">{desc}</p>
      {extra}
      {cta && (
        <Link
          href={cta.href}
          className="w-full py-3 rounded-[8px] bg-[#148F89] text-white font-semibold text-[13px] hover:bg-[#117A75] transition-colors text-center mt-1"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}

export default function IpaymuReturnPage() {
  return (
    <Suspense fallback={<div className="w-full min-h-screen bg-[#0F081C]" />}>
      <IpaymuReturnInner />
    </Suspense>
  );
}
