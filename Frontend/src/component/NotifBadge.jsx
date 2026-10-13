// Buletan notifikasi kecil dipakai bareng di sidebar admin/mentor/user --
// nggak render apa-apa kalau count 0/kosong, dan nutup di "99+" biar gak
// ngerusak layout sidebar buat angka gede.
export default function NotifBadge({ count, className = "" }) {
  if (!count) return null;
  return (
    <span
      className={`min-w-[19px] h-[19px] px-1 rounded-full bg-[#EF4444] text-white text-[10px] font-bold flex items-center justify-center shrink-0 ${className}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
