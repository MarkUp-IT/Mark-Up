"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { apiRequest, getAccessToken } from "@/lib/api";
import { extractErrorMessage } from "@/lib/formErrors";

const rupiah = (v) => `Rp ${Math.round(Number(v) || 0).toLocaleString("id-ID")}`;

const tanggal = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "-";

const METODE = {
  BANK_TRANSFER: "Transfer Bank",
  QRIS: "QRIS",
  E_WALLET: "E-Wallet",
  CREDIT_CARD: "Kartu Kredit",
  MANUAL: "Transfer Manual",
};
const JENIS = { MENTORING: "Mentoring", MODULE: "Modul", BOOTCAMP: "Bootcamp" };

/**
 * Invoice satu transaksi -- dibuka pembeli (transaksinya sendiri) atau admin.
 * Sengaja di luar kerangka dashboard: halaman ini didesain untuk dicetak /
 * disimpan sebagai PDF lewat fitur cetak browser (lihat aturan @media print).
 */
export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const [inv, setInv] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace(`/login?next=/invoice/${params.id}`);
      return;
    }
    apiRequest(`/api/transactions/${params.id}/invoice/`)
      .then(setInv)
      .catch((err) => setError(extractErrorMessage(err, "Invoice tidak bisa dimuat.")));
  }, [params.id, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-[#334155] text-[15px]">{error}</p>
        <button onClick={() => router.back()} className="text-[#148F89] font-semibold text-[14px] hover:underline">
          Kembali
        </button>
      </div>
    );
  }
  if (!inv) {
    return <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center text-[#64748B]">Memuat invoice...</div>;
  }

  const refund = inv.status === "REFUNDED";
  const diskon = Number(inv.discount_amount) || 0;
  const diskonTim = Number(inv.team_discount_amount) || 0;
  const commitment = Number(inv.commitment_fee_amount) || 0;
  const pajak = Number(inv.tax) || 0;

  return (
    <div className="min-h-screen bg-[#F1F5F9] py-6 sm:py-10 px-3 sm:px-4 print:bg-white print:p-0">
      <style>{`
        @page { size: A4; margin: 14mm; }
        @media print {
          html, body { background: #fff !important; }
          .invoice-sheet { box-shadow: none !important; border: none !important; max-width: none !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="max-w-[820px] mx-auto mb-4 flex items-center justify-between gap-3 print:hidden">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#64748B] hover:text-[#148F89] text-[13px] font-medium transition-colors"
        >
          <ArrowLeft size={16} />
          Kembali
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#148F89] text-white text-[13px] font-semibold hover:bg-[#117A75] transition-colors"
        >
          <Printer size={15} />
          Unduh PDF / Cetak
        </button>
      </div>

      <div className="invoice-sheet max-w-[820px] mx-auto bg-white rounded-[12px] border border-[#E2E8F0] shadow-sm overflow-hidden text-[#0F172A]">
        <div className="bg-[#140B22] px-6 sm:px-10 py-6 flex items-center justify-between gap-4 flex-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-markup.svg" alt="MARK-UP" style={{ height: "40px", width: "auto" }} />
          <div className="text-right">
            <p className="text-white font-bold text-[22px] tracking-wide">INVOICE</p>
            <p className="text-white/70 text-[12.5px] font-mono">{inv.invoice_number}</p>
          </div>
        </div>

        <div className="px-6 sm:px-10 py-8 flex flex-col gap-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1 text-[13px]">
              <p className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider">Ditagihkan kepada</p>
              <p className="font-semibold text-[15px]">{inv.buyer.name}</p>
              <p className="text-[#475569]">{inv.buyer.email}</p>
              {inv.buyer.phone && <p className="text-[#475569]">{inv.buyer.phone}</p>}
            </div>
            <div className="flex flex-col gap-1.5 text-[13px] sm:items-end">
              <span
                className={`inline-flex w-fit px-3 py-1 rounded-full text-[11px] font-bold tracking-wider border ${
                  refund
                    ? "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]"
                    : "bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]"
                }`}
              >
                {refund ? "DIREFUND" : "LUNAS"}
              </span>
              <p className="text-[#475569]">
                Tanggal lunas: <span className="text-[#0F172A] font-medium">{tanggal(inv.paid_at)}</span>
              </p>
              <p className="text-[#475569]">
                Metode: <span className="text-[#0F172A] font-medium">{METODE[inv.method] || inv.method}</span>
                {inv.gateway === "IPAYMU" ? " (iPaymu)" : ""}
              </p>
              <p className="text-[#475569]">
                No. transaksi: <span className="text-[#0F172A] font-mono text-[12px]">{inv.transaction_id}</span>
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b-2 border-[#0F172A] text-left text-[11px] uppercase tracking-wider text-[#64748B]">
                  <th className="py-2.5 pr-3 font-bold">Produk</th>
                  <th className="py-2.5 px-3 font-bold text-center">Jumlah</th>
                  <th className="py-2.5 px-3 font-bold text-right">Harga</th>
                  <th className="py-2.5 pl-3 font-bold text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {inv.items.map((it, i) => (
                  <tr key={i} className="border-b border-[#E2E8F0]">
                    <td className="py-3 pr-3">
                      <p className="font-semibold">{it.title}</p>
                      <p className="text-[#94A3B8] text-[11.5px]">{JENIS[it.type] || it.type}</p>
                    </td>
                    <td className="py-3 px-3 text-center">{it.quantity}</td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">{rupiah(it.price)}</td>
                    <td className="py-3 pl-3 text-right whitespace-nowrap">{rupiah(it.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-full sm:w-[320px] flex flex-col gap-2 text-[13px]">
              <Baris label="Subtotal" nilai={rupiah(inv.sub_total)} />
              {diskonTim > 0 && <Baris label="Diskon tim" nilai={`- ${rupiah(diskonTim)}`} />}
              {diskon > 0 && (
                <Baris label={`Diskon${inv.promo_code ? ` (${inv.promo_code})` : ""}`} nilai={`- ${rupiah(diskon)}`} />
              )}
              {commitment > 0 && <Baris label="Commitment fee (dikembalikan di akhir program)" nilai={rupiah(commitment)} />}
              {pajak > 0 && <Baris label="Pajak" nilai={rupiah(pajak)} />}
              <div className="flex items-center justify-between pt-3 mt-1 border-t-2 border-[#0F172A]">
                <span className="font-bold text-[14px]">Total dibayar</span>
                <span className="font-bold text-[18px] text-[#148F89]">{rupiah(inv.grand_total)}</span>
              </div>
            </div>
          </div>

          {refund && (
            <p className="text-[12.5px] text-[#92400E] bg-[#FFFBEB] border border-[#FDE68A] rounded-[8px] px-4 py-3">
              Transaksi ini sudah direfund. Rincian pengembalian dana bisa dilihat di halaman Transaksi.
            </p>
          )}

          <div className="pt-6 border-t border-[#E2E8F0] text-[11.5px] text-[#64748B] leading-relaxed">
            <p className="font-semibold text-[#334155]">MARK-UP</p>
            <p>markup.ofc@gmail.com &middot; mark-up.id</p>
            <p className="mt-2 text-[#94A3B8]">
              Invoice ini dibuat otomatis oleh sistem dan sah tanpa tanda tangan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Baris({ label, nilai }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[#64748B]">{label}</span>
      <span className="font-medium whitespace-nowrap">{nilai}</span>
    </div>
  );
}
