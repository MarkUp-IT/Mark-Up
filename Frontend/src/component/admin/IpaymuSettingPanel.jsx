"use client";

import { useState, useEffect, useCallback } from "react";
import { KeyRound, Pencil, Check, X, ShieldAlert, Zap } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
import FieldLabel from "./FieldLabel";
import { extractErrorMessage } from "@/lib/formErrors";

const EMPTY = {
  va_number: "", api_key_hint: "", is_sandbox: true, is_enabled: false,
  default_expired_hours: 2, key_ready: false,
  last_check_at: null, last_check_ok: null, last_check_note: "", last_check_url: "",
};

/**
 * Kredensial & saklar iPaymu -- pola sama seperti BankAccountPanel (edit
 * inline), tapi api_key-nya sensitif jadi WRITE-ONLY: kolom input SELALU
 * kosong pas dibuka, cuma placeholder yang nunjukin hint 4 digit terakhir.
 * Dua saklar (Sandbox/Production & Aktif/Nonaktif) sengaja dipisah dari
 * mode edit field lain -- keduanya berefek langsung begitu diklik, gak
 * perlu tombol Simpan terpisah, karena ini kontrol operasional yang admin
 * mau lihat efeknya seketika.
 */
export default function IpaymuSettingPanel() {
  const [data, setData] = useState(EMPTY);
  const [form, setForm] = useState({ va_number: "", api_key: "", default_expired_hours: 2 });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [testing, setTesting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/api/transactions/ipaymu/setting/");
      if (res) setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openEdit = () => {
    setForm({ va_number: data.va_number, api_key: "", default_expired_hours: data.default_expired_hours });
    setEditing(true);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const body = {
        va_number: form.va_number.trim(),
        default_expired_hours: Number(form.default_expired_hours) || 2,
      };
      // api_key WRITE-ONLY -- cuma dikirim kalau admin beneran ngetik yang
      // baru, biar gak sengaja "menghapus" API Key yang sudah tersimpan
      // dengan submit field kosong.
      if (form.api_key.trim()) body.api_key = form.api_key.trim();

      await apiRequest("/api/transactions/ipaymu/setting/update/", { method: "PATCH", body });
      await fetchData();
      setEditing(false);
      toast.success("Pengaturan iPaymu Disimpan");
    } catch (err) {
      toast.error("Gagal Menyimpan", { description: extractErrorMessage(err, "Terjadi kesalahan.") });
    } finally {
      setSaving(false);
    }
  };

  const toggleField = async (field, nextValue, confirmMessage) => {
    if (toggling) return;
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    setToggling(true);
    try {
      await apiRequest("/api/transactions/ipaymu/setting/update/", {
        method: "PATCH", body: { [field]: nextValue },
      });
      await fetchData();
      toast.success("Pengaturan iPaymu Diperbarui");
    } catch (err) {
      toast.error("Gagal Mengubah", { description: extractErrorMessage(err, "Terjadi kesalahan.") });
    } finally {
      setToggling(false);
    }
  };

  const handleTest = async () => {
    if (testing) return;
    setTesting(true);
    try {
      const res = await apiRequest("/api/transactions/ipaymu/setting/test/", { method: "POST" });
      await fetchData();
      if (res.ok) {
        toast.success("Koneksi Berhasil", { description: res.pesan });
      } else {
        toast.error("Koneksi Gagal", { description: res.pesan });
      }
    } catch (err) {
      toast.error("Gagal Menguji Koneksi", { description: extractErrorMessage(err, "Terjadi kesalahan.") });
    } finally {
      setTesting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <KeyRound size={15} className="text-[#148F89]" />
          <h2 className="font-bold text-[15px] text-[#0F172A]">Payment Gateway iPaymu</h2>
        </div>
        {!editing && (
          <button
            onClick={openEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-[#E2E8F0] text-[#64748B] text-[12px] font-semibold hover:text-[#148F89] hover:border-[#148F89] transition-colors"
          >
            <Pencil size={12} /> Ubah
          </button>
        )}
      </div>

      <p className="text-[#94A3B8] text-[11.5px] -mt-1">
        Kalau aktif, pembeli bisa pilih bayar otomatis via iPaymu di samping transfer manual.
      </p>

      {!data.key_ready && (
        <p className="text-[#991B1B] text-[12px] bg-[#FEE2E2] border border-[#FECACA] rounded-[6px] px-3 py-2 flex items-start gap-1.5">
          <ShieldAlert size={14} className="shrink-0 mt-0.5" />
          IPAYMU_CRED_KEY belum diisi di server -- API Key gak bisa disimpan dengan aman sampai ini diatur developer.
        </p>
      )}

      {/* --- Saklar Sandbox/Production & Aktif/Nonaktif -- efek langsung --- */}
      <div className="flex flex-col gap-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[12.5px] font-semibold text-[#1E293B]">Mode</span>
            <span className="text-[#94A3B8] text-[11px]">
              {data.is_sandbox ? "Sandbox -- uji coba, uang tidak sungguhan" : "PRODUCTION -- uang sungguhan"}
            </span>
          </div>
          <button
            disabled={toggling}
            onClick={() =>
              toggleField(
                "is_sandbox",
                !data.is_sandbox,
                data.is_sandbox
                  ? "Yakin pindah ke PRODUCTION? Transaksi lewat iPaymu setelah ini memakai UANG SUNGGUHAN."
                  : "Yakin balik ke Sandbox? Transaksi lewat iPaymu setelah ini jadi uji coba, bukan uang sungguhan."
              )
            }
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors disabled:opacity-50 ${
              data.is_sandbox
                ? "bg-[#F59E0B]/15 text-[#B45309] hover:bg-[#F59E0B]/25"
                : "bg-red-500/15 text-red-700 hover:bg-red-500/25"
            }`}
          >
            {data.is_sandbox ? "SANDBOX" : "PRODUCTION"}
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#E2E8F0] pt-2">
          <div className="flex flex-col">
            <span className="text-[12.5px] font-semibold text-[#1E293B]">Status</span>
            <span className="text-[#94A3B8] text-[11px]">
              {data.is_enabled ? "Pembeli sudah bisa lihat & pakai opsi iPaymu" : "Pembeli cuma lihat transfer manual"}
            </span>
          </div>
          <button
            disabled={toggling || (!data.is_enabled && !data.key_ready)}
            onClick={() => toggleField("is_enabled", !data.is_enabled, null)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors disabled:opacity-50 ${
              data.is_enabled
                ? "bg-[#148F89]/15 text-[#117A75] hover:bg-[#148F89]/25"
                : "bg-[#64748B]/15 text-[#475569] hover:bg-[#64748B]/25"
            }`}
          >
            {data.is_enabled ? "AKTIF" : "NONAKTIF"}
          </button>
        </div>
      </div>

      {!editing ? (
        <div className="flex flex-col gap-1 text-[13px]">
          <div className="flex justify-between">
            <span className="text-[#64748B]">VA Number</span>
            <span className="text-[#1E293B] font-medium font-mono">{data.va_number || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#64748B]">API Key</span>
            <span className="text-[#1E293B] font-medium font-mono">{data.api_key_hint || "belum diisi"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#64748B]">Umur Sesi Bayar</span>
            <span className="text-[#1E293B] font-medium">{data.default_expired_hours} jam</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <FieldLabel>VA Number</FieldLabel>
            <input
              type="text"
              value={form.va_number}
              onChange={(e) => setForm((f) => ({ ...f, va_number: e.target.value }))}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89] font-mono"
            />
          </div>
          <div className="flex flex-col gap-1">
            <FieldLabel>API Key {data.api_key_hint ? `(sekarang: ${data.api_key_hint})` : ""}</FieldLabel>
            <input
              type="password"
              value={form.api_key}
              onChange={(e) => setForm((f) => ({ ...f, api_key: e.target.value }))}
              placeholder="Kosongkan kalau tidak diubah"
              autoComplete="new-password"
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89] font-mono"
            />
          </div>
          <div className="flex flex-col gap-1">
            <FieldLabel>Umur Sesi Bayar (jam)</FieldLabel>
            <input
              type="number"
              min={1}
              value={form.default_expired_hours}
              onChange={(e) => setForm((f) => ({ ...f, default_expired_hours: e.target.value }))}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
            />
          </div>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => setEditing(false)}
              className="flex-1 h-9 rounded-[6px] border border-[#E2E8F0] text-[#64748B] text-[12px] font-semibold hover:bg-[#F8FAFC] transition-colors"
            >
              <X size={13} className="inline mr-1" /> Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 h-9 rounded-[6px] bg-[#148F89] text-white text-[12px] font-semibold hover:bg-[#117A75] transition-colors disabled:opacity-50"
            >
              <Check size={13} className="inline mr-1" /> {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5 border-t border-[#E2E8F0] pt-3">
        <button
          onClick={handleTest}
          disabled={testing || !data.va_number || !data.api_key_hint}
          className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-[#148F89]/40 text-[#117A75] text-[12px] font-semibold hover:bg-[#148F89]/10 transition-colors disabled:opacity-50"
        >
          <Zap size={12} /> {testing ? "Menguji..." : "Uji Koneksi"}
        </button>
        {data.last_check_at && (
          <p className={`text-[11px] ${data.last_check_ok ? "text-[#117A75]" : "text-red-600"}`}>
            {data.last_check_ok ? "✓" : "✗"} {data.last_check_note}
            {data.last_check_url && (
              <>
                {" -- "}
                <a href={data.last_check_url} target="_blank" rel="noopener noreferrer" className="underline">
                  lihat sesi uji
                </a>
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
