"use client";

// Input angka yang nampilin pemisah ribuan (titik, format id-ID) selagi
// diketik, tapi value yang dikirim ke onChange tetap angka murni (atau ""
// kalau kosong) -- jadi pemakaiannya di form state nggak perlu berubah sama
// sekali, cuma tampilannya yang diformat.

function formatThousands(digits) {
  if (!digits) return "";
  return new Intl.NumberFormat("id-ID").format(Number(digits));
}

export default function CurrencyInput({
  name,
  value,
  onChange,
  placeholder,
  className,
  style,
  prefix = "Rp",
  disabled,
}) {
  // Ambil bagian INTEGER dulu (sebelum titik/koma desimal) baru buang
  // non-digit. Backend kirim harga sebagai Decimal string "100000.00" --
  // kalau langsung .replace(/\D/g,"") titik desimalnya kebuang & digit
  // desimalnya nempel jadi "10000000" (100rb keliatan jadi 10jt pas edit).
  const displayValue = formatThousands(
    String(value ?? "").split(/[.,]/)[0].replace(/\D/g, ""),
  );

  function handleChange(e) {
    const raw = e.target.value.replace(/\D/g, "");
    onChange({ target: { name, value: raw } });
  }

  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] text-[13px] pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        type="text"
        inputMode="numeric"
        name={name}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        style={style}
        className={`${className} ${prefix ? "pl-10" : ""}`}
      />
    </div>
  );
}
