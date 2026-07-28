"use client";

import { useState, useEffect, useCallback } from "react";
import { Landmark, Pencil, Check, X } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/formErrors";

/**
 * Rekening tujuan transfer yang tampil di halaman pembayaran peserta.
 * Dulu hardcode di kode frontend -- ganti rekening berarti ganti kode &
 * deploy ulang. Sekarang admin bisa ubah sendiri dari sini.
 */
export default function BankAccountPanel() {
  const [data, setData] = useState({ bank_name: "", account_number: "", account_holder: "" });
  const [form, setForm] = useState({ bank_name: "", account_number: "", account_holder: "" });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/api/transactions/bank-account/", { auth: false });
      if (res) setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openEdit = () => {
    setForm({ ...data });
    setEditing(true);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await apiRequest("/api/transactions/bank-account/update/", {
        method: "PATCH",
        body: {
          bank_name: form.bank_name.trim(),
          account_number: form.account_number.trim(),
          account_holder: form.account_holder.trim(),
        },
      });
      setData({
        bank_name: res.bank_name,
        account_number: res.account_number,
        account_holder: res.account_holder,
      });
      setEditing(false);
      toast.success("Rekening Diperbarui", {
        description: "Halaman pembayaran peserta langsung ikut berubah.",
      });
    } catch (err) {
      toast.error("Gagal Menyimpan", { description: extractErrorMessage(err, "Terjadi kesalahan.") });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  const incomplete = !data.bank_name || !data.account_number || !data.account_holder;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Landmark size={15} className="text-[#148F89]" />
          <h2 className="font-bold text-[15px] text-[#0F172A]">Rekening Pembayaran</h2>
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
        Rekening ini yang muncul di halaman pembayaran peserta (bootcamp & produk lain).
      </p>

      {incomplete && !editing && (
        <p className="text-[#B45309] text-[12px] bg-[#FEF3C7] border border-[#FDE68A] rounded-[6px] px-3 py-2">
          Data rekening belum lengkap -- peserta bakal lihat kolom kosong pas mau transfer.
        </p>
      )}

      {!editing ? (
        <div className="flex flex-col gap-1 text-[13px]">
          <div className="flex justify-between">
            <span className="text-[#64748B]">Bank</span>
            <span className="text-[#1E293B] font-medium">{data.bank_name || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#64748B]">Nomor Rekening</span>
            <span className="text-[#1E293B] font-medium font-mono">{data.account_number || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#64748B]">Atas Nama</span>
            <span className="text-[#1E293B] font-medium">{data.account_holder || "-"}</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[#64748B] text-[10.5px] font-semibold uppercase">Bank</label>
            <input
              type="text"
              value={form.bank_name}
              onChange={(e) => setForm((f) => ({ ...f, bank_name: e.target.value }))}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[#64748B] text-[10.5px] font-semibold uppercase">Nomor Rekening</label>
            <input
              type="text"
              value={form.account_number}
              onChange={(e) => setForm((f) => ({ ...f, account_number: e.target.value }))}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89] font-mono"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[#64748B] text-[10.5px] font-semibold uppercase">Atas Nama</label>
            <input
              type="text"
              value={form.account_holder}
              onChange={(e) => setForm((f) => ({ ...f, account_holder: e.target.value }))}
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
              disabled={saving || !form.bank_name.trim() || !form.account_number.trim() || !form.account_holder.trim()}
              className="flex-1 h-9 rounded-[6px] bg-[#148F89] text-white text-[12px] font-semibold hover:bg-[#117A75] transition-colors disabled:opacity-50"
            >
              <Check size={13} className="inline mr-1" /> {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
