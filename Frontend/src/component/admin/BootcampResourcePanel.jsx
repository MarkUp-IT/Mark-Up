"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, FileText, Lock } from "lucide-react";
import { apiRequest, getAccessToken, API_BASE } from "@/lib/api";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/formErrors";

const RESOURCE_TYPES = [
  { value: "record_incubation", label: "Record Incubation" },
  { value: "framework_template", label: "Framework Template" },
  { value: "winning_deck", label: "Winning Deck" },
];

export default function BootcampResourcePanel({ productId }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [resourceType, setResourceType] = useState(RESOURCE_TYPES[0].value);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/api/products/${productId}/resources/`);
      setResources(res?.resources || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setTitle("");
    setResourceType(RESOURCE_TYPES[0].value);
    setFile(null);
    setShowAdd(false);
  };

  const handleSave = async () => {
    if (!title.trim() || !file || saving) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("resource_type", resourceType);
      formData.append("file", file);
      const res = await fetch(`${API_BASE}/api/products/${productId}/resources/add/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.detail || Object.values(data?.errors || {}).flat().join(" ") || "Gagal menambahkan resource.");
      }
      toast.success("Resource Tersimpan");
      resetForm();
      fetchData();
    } catch (err) {
      toast.error("Gagal Menyimpan Resource", { description: err?.message || "Terjadi kesalahan." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Hapus resource ini? Peserta yang paketnya berhak gak akan bisa unduh lagi.")) return;
    try {
      await apiRequest(`/api/products/bootcamp-resources/${id}/`, { method: "DELETE" });
      toast.success("Resource Dihapus");
      fetchData();
    } catch (err) {
      toast.error("Gagal Menghapus Resource", { description: extractErrorMessage(err, "Terjadi kesalahan.") });
    }
  };

  if (loading) return null;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-[15px] text-[#0F172A]">Resource Eksklusif Paket</h2>
        <button
          onClick={() => setShowAdd((s) => !s)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#148F89] text-white text-[12px] font-semibold hover:bg-[#117A75] transition-colors"
        >
          <Plus size={13} /> Tambah Resource
        </button>
      </div>
      <p className="text-[#94A3B8] text-[11.5px] -mt-2">
        File cuma bisa diunduh peserta yang paketnya punya benefit terkait (dicek dari centang benefit di kartu paket).
      </p>

      {resources.length === 0 ? (
        <p className="text-[#94A3B8] text-[12.5px] italic">Belum ada resource.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {resources.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-[8px] border border-[#E2E8F0]">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText size={16} className="text-[#148F89] shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[#1E293B] font-medium text-[13px] truncate">{r.title}</span>
                  <span className="text-[#64748B] text-[11px] flex items-center gap-1">
                    <Lock size={10} /> {r.resource_type_label}
                  </span>
                </div>
              </div>
              <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-[6px] text-[#DC2626] hover:bg-red-50 transition-colors shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="flex flex-col gap-2.5 p-3.5 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0]">
          <input
            type="text"
            placeholder="Judul resource"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-white border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
          />
          <select
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value)}
            className="w-full bg-white border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
          >
            {RESOURCE_TYPES.map((rt) => (
              <option key={rt.value} value={rt.value}>{rt.label}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 border border-dashed border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#64748B] hover:border-[#148F89]/50 cursor-pointer transition-colors">
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            {file ? file.name : "Pilih file (maks. 20MB)"}
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
              disabled={!title.trim() || !file || saving}
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
