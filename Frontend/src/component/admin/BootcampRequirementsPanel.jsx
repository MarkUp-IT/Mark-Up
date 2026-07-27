"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/formErrors";

export default function BootcampRequirementsPanel({ productId }) {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [newText, setNewText] = useState("");
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/api/products/${productId}/requirements/`, { auth: false });
      setRequirements(res?.requirements || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = async () => {
    if (!newText.trim() || saving) return;
    setSaving(true);
    try {
      await apiRequest(`/api/products/${productId}/requirements/add/`, {
        method: "POST", body: { text: newText.trim() },
      });
      toast.success("Syarat Ditambahkan");
      setNewText("");
      setShowAdd(false);
      fetchData();
    } catch (err) {
      toast.error("Gagal Menambahkan Syarat", { description: extractErrorMessage(err, "Terjadi kesalahan.") });
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setEditingText(item.text);
  };

  const handleSaveEdit = async (id) => {
    if (!editingText.trim()) return;
    try {
      await apiRequest(`/api/products/bootcamp-requirements/${id}/`, {
        method: "PATCH", body: { text: editingText.trim() },
      });
      setEditingId(null);
      fetchData();
    } catch (err) {
      toast.error("Gagal Menyimpan Syarat", { description: extractErrorMessage(err, "Terjadi kesalahan.") });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Hapus syarat ini?")) return;
    try {
      await apiRequest(`/api/products/bootcamp-requirements/${id}/`, { method: "DELETE" });
      toast.success("Syarat Dihapus");
      fetchData();
    } catch (err) {
      toast.error("Gagal Menghapus Syarat", { description: extractErrorMessage(err, "Terjadi kesalahan.") });
    }
  };

  if (loading) return null;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-[15px] text-[#0F172A]">Syarat Pendaftaran</h2>
        <button
          onClick={() => setShowAdd((s) => !s)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#148F89] text-white text-[12px] font-semibold hover:bg-[#117A75] transition-colors"
        >
          <Plus size={13} /> Tambah
        </button>
      </div>
      <p className="text-[#94A3B8] text-[11.5px] -mt-2">
        Muncul sebagai daftar bernomor di halaman pendaftaran publik. Peserta tetap gabungin semua buktinya jadi 1 PDF.
      </p>

      {requirements.length === 0 ? (
        <p className="text-[#94A3B8] text-[12.5px] italic">Belum ada syarat. Tambahkan minimal 1 biar peserta tau apa yang perlu disiapkan.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {requirements.map((item, idx) => (
            <div key={item.id} className="flex items-center gap-2 px-3.5 py-2.5 rounded-[8px] border border-[#E2E8F0]">
              <span className="shrink-0 w-5 h-5 rounded-full bg-[#148F89]/10 text-[#148F89] text-[10.5px] font-bold flex items-center justify-center">
                {idx + 1}
              </span>
              {editingId === item.id ? (
                <>
                  <input
                    type="text"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-2.5 h-8 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
                  />
                  <button onClick={() => handleSaveEdit(item.id)} className="p-1.5 text-[#148F89]"><Check size={14} /></button>
                  <button onClick={() => setEditingId(null)} className="p-1.5 text-[#64748B]"><X size={14} /></button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-[#1E293B] text-[13px]">{item.text}</span>
                  <button onClick={() => openEdit(item)} className="p-1.5 rounded-[6px] text-[#64748B] hover:text-[#148F89] hover:bg-[#148F89]/5 transition-colors shrink-0">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-[6px] text-[#DC2626] hover:bg-red-50 transition-colors shrink-0">
                    <Trash2 size={13} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Teks syarat, mis. Bukti follow Instagram"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
          />
          <button
            onClick={handleAdd}
            disabled={!newText.trim() || saving}
            className="px-3 h-9 rounded-[6px] bg-[#148F89] text-white text-[12.5px] font-semibold hover:bg-[#117A75] transition-colors disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      )}
    </div>
  );
}
