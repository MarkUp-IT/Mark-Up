import Link from "next/link";
import { PackageOpen } from "lucide-react";

export default function EmptyState({ message, ctaLabel, ctaHref }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 text-center py-12 px-6 border border-dashed border-[#2D2342] rounded-[12px] bg-[#170F26]/40">
      <PackageOpen size={32} className="text-[#4B3B6B]" />
      <p className="text-[#9CA3AF] text-[14px] max-w-[320px]">{message}</p>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="mt-1 px-5 py-2 rounded-[8px] bg-[#148F89] text-white text-[13px] font-semibold hover:bg-[#117A75] transition-colors"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
