"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import DashboardLayout from "@/component/user/DashboardLayout";
import EmptyState from "@/component/user/EmptyState";
import { apiRequest } from "@/lib/api";

const statusMeta = {
  PAID: {
    label: "Lunas",
    className: "bg-[#148F89]/10 text-[#148F89] border border-[#148F89]/30",
  },
  PENDING: {
    label: "Menunggu Verifikasi",
    className: "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30",
  },
  FAILED: {
    label: "Ditolak",
    className: "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30",
  },
  EXPIRED: {
    label: "Kedaluwarsa",
    className: "bg-[#6B7280]/10 text-[#9CA3AF] border border-[#6B7280]/30",
  },
  REFUNDED: {
    label: "Direfund",
    className: "bg-[#6B7280]/10 text-[#9CA3AF] border border-[#6B7280]/30",
  },
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  }) + " WIB";
}

export default function TransactionDetail() {
  const params = useParams();
  const [tx, setTx] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest("/api/transactions/me/transactions/")
      .then((res) => {
        const found = (res?.transactions || []).find((t) => t.transaction_id === params.id);
        setTx(found || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <DashboardLayout title="Detail Transaksi">
        <p className="text-[#9CA3AF] text-[13px]">Memuat transaksi...</p>
      </DashboardLayout>
    );
  }

  if (!tx) {
    return (
      <DashboardLayout title="Detail Transaksi">
        <Link
          href="/user/transactions"
          className="inline-flex items-center gap-2 text-[#9CA3AF] hover:text-white text-[13px] transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          Kembali ke Transaksi
        </Link>
        <EmptyState
          message={`Transaksi dengan nomor "${params.id}" tidak ditemukan.`}
          ctaLabel="Lihat Semua Transaksi"
          ctaHref="/user/transactions"
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Detail Transaksi">
      <Link
        href="/user/transactions"
        className="inline-flex items-center gap-2 text-[#9CA3AF] hover:text-white text-[13px] transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        Kembali ke Transaksi
      </Link>

      <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-6 sm:p-8 flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[#2D2342]">
          <div className="flex flex-col gap-1">
            <p className="text-[#9CA3AF] text-[12px]">No. Transaksi</p>
            <h2 className="text-white font-bold text-[18px]">{tx.transaction_id}</h2>
          </div>
          <span className={`self-start px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap ${statusMeta[tx.status]?.className}`}>
            {statusMeta[tx.status]?.label}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-[#9CA3AF] text-[12px]">Produk</p>
          <h3 className="text-white font-semibold text-[16px]">{tx.product_title}</h3>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-[#9CA3AF] text-[12px]">Rincian Pembayaran</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between pt-3 border-t border-[#2D2342]">
              <span className="text-white font-semibold text-[14px]">Total</span>
              <span className="text-[#148F89] font-bold text-[20px]">{formatCurrency(tx.amount)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
          <div className="flex flex-col gap-1">
            <span className="text-[#9CA3AF]">Metode Pembayaran</span>
            <span className="text-white">{tx.method}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#9CA3AF]">Dibuat Pada</span>
            <span className="text-white">{formatDate(tx.created_at)}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {tx.status === "PENDING" && (
            <p className="text-[#F59E0B] text-[13px] bg-[#F59E0B]/5 border border-[#F59E0B]/20 rounded-[8px] px-4 py-3">
              Bukti transfer udah kami terima, sedang diverifikasi tim kami (maksimal 1x24 jam).
            </p>
          )}
          {tx.proof_of_payment && (
            <a
              href={tx.proof_of_payment}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-[8px] border border-[#2D2342] text-[#E2E8F0] text-[13px] font-semibold hover:border-[#148F89]/50 hover:text-white transition-colors"
            >
              <Download size={16} />
              Lihat Bukti Pembayaran
            </a>
          )}
          {(tx.status === "FAILED" || tx.status === "EXPIRED") && (
            <Link
              href="/products"
              className="text-center px-5 py-3 rounded-[8px] border border-[#2D2342] text-[#E2E8F0] text-[13px] font-semibold hover:border-[#148F89]/50 hover:text-white transition-colors"
            >
              Beli Lagi
            </Link>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
