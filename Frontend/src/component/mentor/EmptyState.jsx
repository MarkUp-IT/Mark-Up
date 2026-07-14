import Link from "next/link";
import { PackageOpen } from "lucide-react";

export default function EmptyState({ message, ctaLabel, ctaHref }) {
  return (
    <div
      style={{ backgroundColor: "rgba(23, 15, 38, 0.4)" }}
      className="flex flex-col items-center justify-center gap-3 text-center py-12 px-6 border border-dashed border-[#2D2342] rounded-[12px]"
    >
      <PackageOpen size={32} className="text-[#4B3B6B]" />
      <p style={{ maxWidth: "320px" }} className="text-[#9CA3AF] text-[14px]">
        {message}
      </p>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          style={{ backgroundColor: "#148F89" }}
          className="mt-1 px-5 py-2 rounded-[8px] text-white text-[13px] font-semibold hover:bg-[#117A75] transition-colors"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
