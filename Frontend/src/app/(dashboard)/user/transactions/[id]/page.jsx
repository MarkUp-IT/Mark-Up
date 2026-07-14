"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, Check } from "lucide-react";
import DashboardLayout from "@/component/user/DashboardLayout";
import EmptyState from "@/component/user/EmptyState";

const statusMeta = {
  paid: {
    label: "Lunas",
    className: "bg-[#148F89]/10 text-[#148F89] border border-[#148F89]/30",
  },
  pending: {
    label: "Belum Bayar",
    className: "bg-[#6B7280]/10 text-[#9CA3AF] border border-[#6B7280]/30",
  },
  waiting_verification: {
    label: "Menunggu Verifikasi",
    className: "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30",
  },
  rejected: {
    label: "Ditolak",
    className: "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30",
  },
  expired: {
    label: "Kedaluwarsa",
    className: "bg-[#6B7280]/10 text-[#9CA3AF] border border-[#6B7280]/30",
  },
  cancelled: {
    label: "Dibatalkan",
    className: "bg-[#6B7280]/10 text-[#9CA3AF] border border-[#6B7280]/30",
  },
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

// --- MOCK DATA (nanti ganti dengan query 1 baris ke tabel transactions by id, join products) ---
// key-nya harus sama persis dengan id yang dipakai di halaman /user/transactions
const transactions = {
  "TRX-20260706-0091": {
    id: "TRX-20260706-0091",
    productTitle: "On-Demand Mentoring: Business Case Competition",
    createdAt: "6 Juli 2026, 18:42 WIB",
    paidAt: "6 Juli 2026, 18:45 WIB",
    paymentMethod: "Transfer Bank Manual",
    priceAtCheckout: 150000,
    discountAmount: 0,
    tax: 0,
    grandTotal: 150000,
    referralCode: null,
    status: "paid",
  },
  "TRX-20260702-0084": {
    id: "TRX-20260702-0084",
    productTitle: "Annual Competition Bootcamp Batch 1",
    createdAt: "2 Juli 2026, 09:10 WIB",
    paidAt: null,
    paymentMethod: "Transfer Bank Manual",
    priceAtCheckout: 169000,
    discountAmount: 0,
    tax: 0,
    grandTotal: 169000,
    referralCode: null,
    status: "pending",
  },
  "TRX-20260628-0077": {
    id: "TRX-20260628-0077",
    productTitle: "Masterclass Business Case Competition (BCC)",
    createdAt: "28 Juni 2026, 20:05 WIB",
    paidAt: null,
    paymentMethod: "Transfer Bank Manual",
    priceAtCheckout: 50000,
    discountAmount: 5000,
    tax: 0,
    grandTotal: 45000,
    referralCode: "MARKUP10",
    status: "rejected",
  },
  "TRX-20260615-0061": {
    id: "TRX-20260615-0061",
    productTitle: "Quarter Competition Bootcamp: HSBC Business Case",
    createdAt: "15 Juni 2026, 14:22 WIB",
    paidAt: null,
    paymentMethod: "Transfer Bank Manual",
    priceAtCheckout: 49000,
    discountAmount: 0,
    tax: 0,
    grandTotal: 49000,
    referralCode: null,
    status: "expired",
  },
};

export default function TransactionDetail() {
  const params = useParams();
  const tx = transactions[params.id];

  // ID tidak ditemukan -> jangan biarkan halaman kosong tanpa penjelasan
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

  const priceRows = [
    { label: "Subtotal", value: tx.priceAtCheckout },
    ...(tx.discountAmount > 0
      ? [
          {
            label: tx.referralCode ? `Diskon (${tx.referralCode})` : "Diskon",
            value: -tx.discountAmount,
          },
        ]
      : []),
    ...(tx.tax > 0 ? [{ label: "Pajak", value: tx.tax }] : []),
  ];

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
        {/* Header invoice */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[#2D2342]">
          <div className="flex flex-col gap-1">
            <p className="text-[#9CA3AF] text-[12px]">No. Transaksi</p>
            <h2 className="text-white font-bold text-[18px]">{tx.id}</h2>
          </div>
          <span
            className={`self-start px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap ${statusMeta[tx.status].className}`}
          >
            {statusMeta[tx.status].label}
          </span>
        </div>

        {/* Produk */}
        <div className="flex flex-col gap-1">
          <p className="text-[#9CA3AF] text-[12px]">Produk</p>
          <h3 className="text-white font-semibold text-[16px]">
            {tx.productTitle}
          </h3>
        </div>

        {/* Rincian harga */}
        <div className="flex flex-col gap-3">
          <p className="text-[#9CA3AF] text-[12px]">Rincian Pembayaran</p>
          <div className="flex flex-col gap-2">
            {priceRows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between text-[13px]"
              >
                <span className="text-[#9CA3AF]">{row.label}</span>
                <span
                  className={row.value < 0 ? "text-[#EF4444]" : "text-white"}
                >
                  {row.value < 0 ? "-" : ""}
                  {formatCurrency(Math.abs(row.value))}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-3 border-t border-[#2D2342]">
              <span className="text-white font-semibold text-[14px]">
                Total
              </span>
              <span className="text-[#148F89] font-bold text-[20px]">
                {formatCurrency(tx.grandTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Info pembayaran */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
          <div className="flex flex-col gap-1">
            <span className="text-[#9CA3AF]">Metode Pembayaran</span>
            <span className="text-white">{tx.paymentMethod}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#9CA3AF]">Dibuat Pada</span>
            <span className="text-white">{tx.createdAt}</span>
          </div>
          {tx.paidAt && (
            <div className="flex flex-col gap-1">
              <span className="text-[#9CA3AF]">Dibayar Pada</span>
              <span className="text-white flex items-center gap-1.5">
                <Check size={14} className="text-[#148F89]" />
                {tx.paidAt}
              </span>
            </div>
          )}
        </div>

        {/* Aksi, tergantung status */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {tx.status === "pending" && (
            <Link
              href={`/checkout/${tx.id}`}
              className="text-center px-5 py-3 rounded-[8px] bg-[#148F89] text-white text-[13px] font-semibold hover:bg-[#117A75] transition-colors"
            >
              Bayar Sekarang
            </Link>
          )}
          {tx.status === "paid" && (
            // window.print() dulu sebagai cara paling cepat "unduh PDF" tanpa backend generator invoice.
            // Bisa diganti generate PDF asli kalau nanti udah ada endpoint-nya.
            <button
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-[8px] border border-[#2D2342] text-[#E2E8F0] text-[13px] font-semibold hover:border-[#148F89]/50 hover:text-white transition-colors"
            >
              <Download size={16} />
              Cetak / Unduh Invoice
            </button>
          )}
          {(tx.status === "rejected" || tx.status === "expired") && (
            <Link
              href="/produk"
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
