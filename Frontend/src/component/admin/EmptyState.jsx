import Link from "next/link";
import { PackageOpen } from "lucide-react";

export default function EmptyState({ message, ctaLabel, ctaHref }) {
  return (
    <div className="w-full flex flex-col items-center justify-center gap-3 text-center py-16 px-6 border border-dashed border-[#E2E8F0] rounded-[12px] bg-[#F8FAFC]">
      <PackageOpen size={32} className="text-[#94A3B8]" />
      <p style={{ maxWidth: "360px" }} className="text-[#64748B] text-[14px]">
        {message}
      </p>
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
