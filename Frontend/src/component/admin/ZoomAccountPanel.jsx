"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Pencil, Video, CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/formErrors";
import FieldLabel from "./FieldLabel";

const FORM_KOSONG = {
  label: "",
  account_id: "",
  client_id: "",
  client_secret: "",
  auto_record: true,
  is_active: true,
};

export default function ZoomAccountPanel() {
  const [accounts, setAccounts] = useState([]);
  const [keyReady, setKeyReady] = useState(true);
  const [leadHours, setLeadHours] = useState(24);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(FORM_KOSONG);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/api/products/zoom-accounts/");
      setAccounts(res?.accounts || []);
      setKeyReady(res?.key_ready !== false);
      setLeadHours(res?.lead_hours ?? 24);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setForm(FORM_KOSONG);
    setEditingId(null);
    setShowForm(false);
  };

  const openEdit = (acc) => {
    setEditingId(acc.id);
    // Secret sengaja dikosongkan: backend tidak pernah mengirimkannya balik.
    // Dibiarkan kosong berarti "jangan ubah".
    setForm({
      label: acc.label,
      account_id: acc.account_id,
      client_id: acc.client_id,
      client_secret: "",
      auto_record: acc.auto_record,
      is_active: acc.is_active,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const body = { ...form };
      if (editingId && !body.client_secret) delete body.client_secret;
      if (editingId) {
        await apiRequest(`/api/products/zoom-accounts/${editingId}/`, { method: "PATCH", body });
      } else {
        await apiRequest("/api/products/zoom-accounts/add/", { method: "POST", body });
      }
      toast.success(editingId ? "Akun Zoom Diperbarui" : "Akun Zoom Ditambahkan");
      resetForm();
      fetchData();
    } catch (err) {
      toast.error("Gagal Menyimpan Akun Zoom", {
        description: extractErrorMessage(err, "Terjadi kesalahan."),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (acc) => {
    setTestingId(acc.id);
    try {
      const res = await apiRequest(`/api/products/zoom-accounts/${acc.id}/test/`, { method: "POST" });
      const r = res?.result || {};
      if (r.ok) {
        toast.success("Kredensial Valid", {
          description: `${r.email || "-"} · ${r.tipe_akun || "-"}${r.sedang_live ? " · sedang ada meeting berlangsung" : ""}`,
        });
      } else {
        toast.error("Kredensial Bermasalah", { description: r.pesan || "Tidak diketahui." });
      }
      fetchData();
    } catch (err) {
      toast.error("Gagal Menguji Koneksi", {
        description: extractErrorMessage(err, "Terjadi kesalahan."),
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (acc) => {
    if (!confirm(`Hapus akun Zoom "${acc.label}"?`)) return;
    try {
      await apiRequest(`/api/products/zoom-accounts/${acc.id}/`, { method: "DELETE" });
      toast.success("Akun Zoom Dihapus");
      fetchData();
    } catch (err) {
      toast.error("Gagal Menghapus Akun Zoom", {
        description: extractErrorMessage(err, "Terjadi kesalahan."),
      });
    }
  };

  const toggleActive = async (acc) => {
    try {
      await apiRequest(`/api/products/zoom-accounts/${acc.id}/`, {
        method: "PATCH",
        body: { is_active: !acc.is_active },
      });
      fetchData();
    } catch (err) {
      toast.error("Gagal Mengubah Status Akun", {
        description: extractErrorMessage(err, "Terjadi kesalahan."),
      });
    }
  };

  if (loading) return null;

  const adaAktif = accounts.some((a) => a.is_active);

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-[15px] text-[#0F172A]">Akun Zoom</h2>
        <button
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#148F89] text-white text-[12px] font-semibold hover:bg-[#117A75] transition-colors"
        >
          <Plus size={13} /> Tambah Akun
        </button>
      </div>
      <p className="text-[#94A3B8] text-[11.5px] -mt-2">
        Link Zoom sesi mentoring dibuat otomatis {leadHours} jam sebelum sesi dimulai, memakai akun
        yang aktif saat itu. Satu akun Zoom hanya dapat meng-host satu meeting pada waktu yang sama,
        sehingga sesi dengan jam beririsan memerlukan akun tambahan.
      </p>

      {!keyReady && (
        <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-[8px] bg-[#FEF3C7] border border-[#FCD34D]">
          <AlertTriangle size={15} className="text-[#B45309] shrink-0 mt-0.5" />
          <p className="text-[#92400E] text-[11.5px]">
            <b>ZOOM_CRED_KEY belum diisi di server.</b> Kredensial tidak dapat disimpan sampai kunci
            enkripsi tersedia. Hubungi pengelola server untuk mengisinya di berkas <code>.env</code>.
          </p>
        </div>
      )}

      {keyReady && !adaAktif && accounts.length > 0 && (
        <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-[8px] bg-[#FEF3C7] border border-[#FCD34D]">
          <AlertTriangle size={15} className="text-[#B45309] shrink-0 mt-0.5" />
          <p className="text-[#92400E] text-[11.5px]">
            Tidak ada akun yang aktif. Link Zoom tidak akan dibuat otomatis dan harus ditempel
            manual di halaman pesanan mentoring.
          </p>
        </div>
      )}

      {accounts.length === 0 ? (
        <p className="text-[#94A3B8] text-[12.5px] italic">
          Belum ada akun Zoom. Tambahkan minimal satu agar link dapat dibuat otomatis.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-[8px] border ${
                acc.is_active ? "border-[#E2E8F0]" : "border-[#E2E8F0] bg-[#F8FAFC] opacity-70"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Video size={16} className="text-[#148F89] shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[#1E293B] font-semibold text-[13px] truncate">
                    {acc.label}
                    {!acc.is_active && <span className="text-[#94A3B8] font-normal"> (nonaktif)</span>}
                  </span>
                  <span className="text-[#64748B] text-[11px]">
                    Secret {acc.client_secret_hint} &middot; {acc.upcoming_sessions} sesi mendatang
                    {acc.auto_record ? " · rekam otomatis" : ""}
                  </span>
                  {acc.last_check_at && (
                    <span
                      className={`text-[10.5px] flex items-center gap-1 ${
                        acc.last_check_ok ? "text-[#166534]" : "text-[#B91C1C]"
                      }`}
                    >
                      {acc.last_check_ok ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                      {acc.last_check_note}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleTest(acc)}
                  disabled={testingId === acc.id}
                  className="px-2 py-1 rounded-[6px] text-[#64748B] text-[11px] font-semibold hover:text-[#148F89] hover:bg-[#148F89]/5 transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {testingId === acc.id && <Loader2 size={11} className="animate-spin" />}
                  Uji Koneksi
                </button>
                <button
                  onClick={() => toggleActive(acc)}
                  className="px-2 py-1 rounded-[6px] text-[#64748B] text-[11px] font-semibold hover:text-[#148F89] hover:bg-[#148F89]/5 transition-colors"
                >
                  {acc.is_active ? "Nonaktifkan" : "Aktifkan"}
                </button>
                <button
                  onClick={() => openEdit(acc)}
                  className="p-1.5 rounded-[6px] text-[#64748B] hover:text-[#148F89] hover:bg-[#148F89]/5 transition-colors"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => handleDelete(acc)}
                  className="p-1.5 rounded-[6px] text-[#DC2626] hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="flex flex-col gap-2.5 p-3.5 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0]">
          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Label Akun</FieldLabel>
            <input
              type="text"
              placeholder="Contoh: Akun Utama Agustus"
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              className="w-full bg-white border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel hint="dari Zoom Marketplace" required>Account ID</FieldLabel>
            <input
              type="text"
              value={form.account_id}
              onChange={(e) => setForm((f) => ({ ...f, account_id: e.target.value }))}
              className="w-full bg-white border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89] font-mono"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Client ID</FieldLabel>
            <input
              type="text"
              value={form.client_id}
              onChange={(e) => setForm((f) => ({ ...f, client_id: e.target.value }))}
              className="w-full bg-white border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89] font-mono"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel
              hint={editingId ? "kosongkan jika tidak diubah" : undefined}
              required={!editingId}
            >
              Client Secret
            </FieldLabel>
            <input
              type="password"
              autoComplete="new-password"
              placeholder={editingId ? "Tidak ditampilkan demi keamanan" : ""}
              value={form.client_secret}
              onChange={(e) => setForm((f) => ({ ...f, client_secret: e.target.value }))}
              className="w-full bg-white border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89] font-mono"
            />
          </div>
          <label className="flex items-center gap-2 text-[12.5px] text-[#1E293B] cursor-pointer">
            <input
              type="checkbox"
              checked={form.auto_record}
              onChange={(e) => setForm((f) => ({ ...f, auto_record: e.target.checked }))}
              className="accent-[#148F89]"
            />
            Rekam otomatis ke cloud (butuh akun Zoom berbayar)
          </label>
          <label className="flex items-center gap-2 text-[12.5px] text-[#1E293B] cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="accent-[#148F89]"
            />
            Aktif (dipakai untuk membuat meeting baru)
          </label>
          <div className="flex gap-2">
            <button
              onClick={resetForm}
              className="flex-1 h-9 rounded-[6px] border border-[#E2E8F0] text-[#64748B] text-[12.5px] font-semibold hover:bg-white transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.label.trim() || !form.account_id.trim() || !form.client_id.trim() || (!editingId && !form.client_secret.trim())}
              className="flex-1 h-9 rounded-[6px] bg-[#148F89] text-white text-[12.5px] font-semibold hover:bg-[#117A75] transition-colors disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
