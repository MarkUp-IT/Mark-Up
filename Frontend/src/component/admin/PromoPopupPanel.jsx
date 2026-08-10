"use client";

import { useState, useEffect, useCallback } from "react";
import { Megaphone, Check, X } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
import FieldLabel from "./FieldLabel";
import { extractErrorMessage } from "@/lib/formErrors";

// ISO (UTC) -> "YYYY-MM-DDTHH:mm" WIB buat input datetime-local.
function toWIBLocalInputValue(dateStr) {
  if (!dateStr) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date(dateStr));
  const get = (t) => parts.find((p) => p.type === t)?.value;
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

const TYPE_LABEL = { BOOTCAMP: "Bootcamp", MENTORING: "Mentoring", MODULE: "Modul" };

/**
 * Atur popup promo yang muncul di homepage: produk mana, jendela tanggalnya,
 * dan teks tombolnya. Sebelumnya popup nebak sendiri (ambil bootcamp aktif
 * pertama), jadi ganti kampanye berarti ganti kode.
 */
export default function PromoPopupPanel() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    product_id: "", is_active: false, starts_at: "", ends_at: "",
    headline: "", cta_label: "Daftar Sekarang",
  });
  const [isLiveNow, setIsLiveNow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [setting, prodRes] = await Promise.all([
        apiRequest("/api/products/promo-popup/admin/"),
        apiRequest("/api/products/?all=true", { auth: false }),
      ]);
      const list = Array.isArray(prodRes) ? prodRes : prodRes?.products || prodRes?.results || [];
      setProducts(list.filter((p) => p.is_active));
      if (setting) {
        setForm({
          product_id: setting.product_id || "",
          is_active: Boolean(setting.is_active),
          starts_at: toWIBLocalInputValue(setting.starts_at),
          ends_at: toWIBLocalInputValue(setting.ends_at),
          headline: setting.headline || "",
          cta_label: setting.cta_label || "Daftar Sekarang",
        });
        setIsLiveNow(Boolean(setting.is_live_now));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await apiRequest("/api/products/promo-popup/admin/", {
        method: "PATCH",
        body: {
          product_id: form.product_id || null,
          is_active: form.is_active,
          starts_at: form.starts_at || null,
          ends_at: form.ends_at || null,
          headline: form.headline.trim(),
          cta_label: form.cta_label.trim(),
        },
      });
      setIsLiveNow(Boolean(res?.is_live_now));
      toast.success("Setelan Popup Disimpan", {
        description: res?.is_live_now
          ? "Popup sedang tayang di homepage."
          : "Popup belum tayang (cek saklar aktif & rentang tanggalnya).",
      });
    } catch (err) {
      toast.error("Gagal Menyimpan", { description: extractErrorMessage(err, "Terjadi kesalahan.") });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Megaphone size={15} className="text-[#148F89]" />
          <h2 className="font-bold text-[15px] text-[#0F172A]">Popup Promo Homepage</h2>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold ${
            isLiveNow ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#F1F5F9] text-[#475569]"
          }`}
        >
          {isLiveNow ? "SEDANG TAYANG" : "TIDAK TAYANG"}
        </span>
      </div>

      <p className="text-[#94A3B8] text-[11.5px] -mt-1">
        Popup yang muncul sekali pas pengunjung pertama buka homepage. Tombolnya langsung
        ngarah ke halaman pendaftaran (bootcamp) atau checkout (produk lain).
      </p>

      <label className="flex items-center gap-2 px-3 h-9 rounded-[6px] bg-[#F8FAFC] border border-[#E2E8F0] cursor-pointer w-fit">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
          className="accent-[#148F89]"
        />
        <span className="text-[12.5px] text-[#1E293B] font-medium">Aktifkan popup</span>
      </label>

      <div className="flex flex-col gap-1">
        <FieldLabel>Produk yang Dipromosikan</FieldLabel>
        <select
          value={form.product_id}
          onChange={(e) => setForm((f) => ({ ...f, product_id: e.target.value }))}
          className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
        >
          <option value="">-- Belum dipilih --</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              [{TYPE_LABEL[p.type] || p.type}] {p.title}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 flex flex-col gap-1">
          <FieldLabel>Mulai Tayang</FieldLabel>
          <input
            type="datetime-local"
            value={form.starts_at}
            onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
            style={{ colorScheme: "light" }}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
          />
          <span className="text-[#94A3B8] text-[10.5px]">Kosong = langsung tayang.</span>
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <FieldLabel>Selesai Tayang</FieldLabel>
          <input
            type="datetime-local"
            value={form.ends_at}
            onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
            style={{ colorScheme: "light" }}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
          />
          <span className="text-[#94A3B8] text-[10.5px]">Kosongkan apabila ingin tayang sampai dinonaktifkan secara manual.</span>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-[2] flex flex-col gap-1">
          <FieldLabel>Judul di Popup (opsional)</FieldLabel>
          <input
            type="text"
            placeholder="Kosong = pakai judul produknya"
            value={form.headline}
            onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
          />
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <FieldLabel>Teks Tombol</FieldLabel>
          <input
            type="text"
            value={form.cta_label}
            onChange={(e) => setForm((f) => ({ ...f, cta_label: e.target.value }))}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
          />
        </div>
      </div>

      <div className="flex gap-2 mt-1">
        <button
          onClick={fetchData}
          className="flex-1 h-9 rounded-[6px] border border-[#E2E8F0] text-[#64748B] text-[12px] font-semibold hover:bg-[#F8FAFC] transition-colors"
        >
          <X size={13} className="inline mr-1" /> Batalkan Perubahan
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
  );
}
