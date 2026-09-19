"use client";

function formatShort(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function formatRange(item) {
  if (!item.end_date || item.end_date === item.start_date) {
    return formatShort(item.start_date);
  }
  return `${formatShort(item.start_date)} – ${formatShort(item.end_date)}`;
}

// Timeline utama (milestone besar), dipakai bareng di halaman produk & halaman
// pendaftaran bootcamp. compact=true buat versi ringkas di kartu/modal produk.
export default function BootcampTimeline({ items, compact = false }) {
  if (!items || items.length === 0) return null;

  if (compact) {
    return (
      <div className="flex flex-col gap-1.5">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 text-[12px]">
            <span className="text-gray-300">{item.title}</span>
            <span className="text-[#08C7E1] font-medium whitespace-nowrap">{formatRange(item)}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      {items.map((item, idx) => (
        <div key={item.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-[#148F89] shrink-0 mt-1" />
            {idx < items.length - 1 && <div className="w-px flex-1 bg-[#2D2342] my-1" />}
          </div>
          <div className={`flex flex-col ${idx < items.length - 1 ? "pb-5" : ""}`}>
            <span className="text-white font-semibold text-[14px]">{item.title}</span>
            <span className="text-[#148F89] text-[12px] font-medium">{formatRange(item)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
