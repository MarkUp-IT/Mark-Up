"use client";

const formatIDR = (v) => `Rp${Math.round(Number(v) || 0).toLocaleString("id-ID")}`;

/** Info pengembalian dana untuk transaksi berstatus REFUNDED: nominal &
 * bukti transfer dari admin. Akses produknya sudah dicabut, jadi halaman
 * Transaksi satu-satunya tempat pembeli bisa melihat ini. */
export default function RefundInfoBox({ refund, className = "" }) {
  if (!refund) return null;
  return (
    <div
      className={`text-[12.5px] leading-relaxed bg-[#10B981]/10 border border-[#10B981]/30 text-[#6EE7B7] rounded-[8px] px-4 py-3 flex flex-col gap-1 ${className}`}
    >
      <p>
        Refund disetujui
        {refund.amount != null && (
          <>
            : <span className="font-bold">{formatIDR(refund.amount)}</span>
            {refund.admin_fee_percent > 0 ? ` (setelah potongan biaya admin ${refund.admin_fee_percent}%)` : ""}
          </>
        )}
        .
      </p>
      {refund.transfer_proof_url ? (
        <a
          href={refund.transfer_proof_url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline w-fit"
        >
          Lihat bukti transfer
        </a>
      ) : (
        <p className="text-[#A7F3D0]/80">Dana sedang kami proses ke rekening yang kamu cantumkan (1-14 hari kerja).</p>
      )}
    </div>
  );
}
