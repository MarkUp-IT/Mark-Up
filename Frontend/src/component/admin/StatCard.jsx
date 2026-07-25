const VARIANTS = {
  default: {
    bg: "bg-white",
    border: "border-[#E2E8F0]",
    label: "text-[#64748B]",
    value: "text-[#0F172A]",
    unit: "text-[#94A3B8]",
  },
  primary: {
    bg: "bg-[#148F89]",
    border: "border-[#148F89]",
    label: "text-white/75",
    value: "text-white",
    unit: "text-white/70",
  },
  warning: {
    bg: "bg-[#FEF3C7]",
    border: "border-[#FDE68A]",
    label: "text-[#92400E]",
    value: "text-[#92400E]",
    unit: "text-[#92400E]/70",
  },
  success: {
    bg: "bg-[#F0FDF4]",
    border: "border-[#DCFCE7]",
    label: "text-[#166534]",
    value: "text-[#15803D]",
    unit: "text-[#166534]/70",
  },
};

// Dipakai di Dashboard, Produk, Transaksi, dan halaman admin lain nanti --
// satu komponen ini yang nentuin tinggi/padding/ukuran font, bukan
// masing-masing halaman nulis ulang style-nya sendiri (itu penyebab
// ukurannya kemarin nggak konsisten).
export default function StatCard({ label, value, unit, variant = "default", loading = false }) {
  const v = VARIANTS[variant] || VARIANTS.default;

  return (
    <div
      style={{ height: "128px" }}
      className={`rounded-[12px] border shadow-sm px-6 flex flex-col justify-center gap-1.5 ${v.bg} ${v.border}`}
    >
      <p className={`font-bold text-[12px] tracking-wide uppercase ${v.label}`}>
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        {loading ? (
          // Skeleton -- biar nggak sempet kebaca "0" pas data asli masih
          // di-fetch (nilai awal state array kosong = 0, padahal bukan
          // beneran kosong, cuma belum selesai dimuat).
          <div className="h-[28px] w-14 rounded-md bg-current opacity-10 animate-pulse" />
        ) : (
          <>
            <p className={`font-bold text-[28px] leading-none ${v.value}`}>{value}</p>
            {unit && (
              <span className={`text-[13px] font-medium ${v.unit}`}>{unit}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}