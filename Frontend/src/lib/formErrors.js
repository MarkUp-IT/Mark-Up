import { ApiError } from "@/lib/api";

// Backend selalu balikin error validasi field dalam bentuk
// {"errors": {"field_name": ["pesan1", ...], ...}}. Dua helper ini dipakai
// bareng di semua form admin: satu buat pesan flat (toast), satu lagi buat
// nge-highlight field yang salah satu-satu (border merah + pesan di bawah
// field itu sendiri).

export function extractErrorMessage(err, fallback) {
  if (err instanceof ApiError) {
    if (err.data?.errors) {
      return Object.values(err.data.errors).flat().join(" ");
    }
    return err.message || fallback;
  }
  return fallback;
}

export function extractFieldErrors(err) {
  if (err instanceof ApiError && err.data?.errors) {
    const map = {};
    Object.entries(err.data.errors).forEach(([field, messages]) => {
      map[field] = Array.isArray(messages) ? messages.join(" ") : String(messages);
    });
    return map;
  }
  return {};
}

export function fieldBorderClass(fieldErrors, name) {
  return fieldErrors?.[name]
    ? "border-red-500 focus:border-red-500"
    : "border-[#E2E8F0] focus:border-[#148F89]";
}
