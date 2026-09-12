"use client";

/**
 * Judul kolom isian di panel admin.
 *
 * Dibuat karena banyak form sebelumnya hanya mengandalkan `placeholder`.
 * Masalahnya, placeholder HILANG begitu kolom terisi -- termasuk saat terisi
 * nilai bawaan. Akibatnya admin melihat angka telanjang seperti "30" dan "70"
 * tanpa keterangan apa pun. Judul yang selalu tampil menghilangkan tebak-tebakan.
 *
 * `hint` untuk keterangan tambahan singkat yang tampil di samping judul,
 * misalnya "(opsional)" atau satuan.
 */
export default function FieldLabel({ children, hint, required = false }) {
  return (
    <label className="text-[#334155] text-[13px] font-medium flex items-baseline gap-1.5">
      <span>
        {children}
        {required && <span className="text-[#DC2626]"> *</span>}
      </span>
      {hint && <span className="text-[#94A3B8] text-[11px] font-normal">{hint}</span>}
    </label>
  );
}
