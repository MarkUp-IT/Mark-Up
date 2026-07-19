"use client";

export default function Header({
  judulHalaman = "Dashboard",
  profileName = "Admin",
  role = "",
  avatarSrc = "/images/pp.png",
}) {
  return (
    <header
      style={{ height: "88px" }}
      className="sticky top-0 z-30 w-full bg-white border-b border-[#E2E8F0] flex items-center justify-between px-8"
    >
      <div>
        <p className="text-[#1E293B] font-bold text-[18px]">{judulHalaman}</p>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-3">
          {/* Sebelumnya "hidden sm:block" -- itu prefix responsive Tailwind
              yang KETERBUKTI nggak ke-compile di project ini (kasus sama
              persis yang bikin gambar halaman login ilang total kemarin).
              Sekarang ditampilin terus, nggak digantung ke breakpoint. */}
          <div className="text-right">
            <p className="text-[13px] font-semibold text-[#1E293B] leading-tight whitespace-nowrap">
              {profileName}
            </p>
            <p className="text-[11px] text-[#94A3B8] whitespace-nowrap">
              {role}
            </p>
          </div>
          <div
            style={{ width: "36px", height: "36px" }}
            className="rounded-full overflow-hidden border border-[#E2E8F0] shrink-0"
          >
            <img
              src={avatarSrc}
              alt="Avatar admin"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}