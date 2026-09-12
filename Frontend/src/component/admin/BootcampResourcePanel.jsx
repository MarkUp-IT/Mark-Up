"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, FileText, Lock } from "lucide-react";
import { apiRequest, getAccessToken, API_BASE } from "@/lib/api";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/formErrors";
import FieldLabel from "./FieldLabel";

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
  // Siapa yang boleh mengunduh. Default "semua peserta bootcamp ini" -- tetap
  // harus sudah bayar, bukan publik.
  const [forAll, setForAll] = useState(true);
  const [pickedPackages, setPickedPackages] = useState([]);
  const [packages, setPackages] = useState([]);
  const [saving, setSaving] = useState(false);

  // Daftar resource DAN daftar paket diambil bersamaan. Paketnya wajib ada
  // sejak awal: tanpa itu pilihan "Paket tertentu saja" tampil kosong walau
  // bootcamp-nya sebenarnya punya paket.
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resRes, pkgRes] = await Promise.all([
        apiRequest(`/api/products/${productId}/resources/`),
        apiRequest(`/api/products/${productId}/packages/`, { auth: false }),
      ]);
      setResources(resRes?.resources || []);
      setPackages(pkgRes?.packages || []);
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
    setForAll(true);
    setPickedPackages([]);
  };

  const handleSave = async () => {
    if (!title.trim() || !file || saving) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("resource_type", resourceType);
      formData.append("file", file);
      formData.append("for_all_packages", forAll ? "true" : "false");
      if (!forAll) pickedPackages.forEach((id) => formData.append("package_ids", id));
      const res = await fetch(`${API_BASE}/api/products/${productId}/resources/add/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.detail || Object.values(data?.errors || {}).flat().join(" ") || "Gagal menambahkan berkas.");
      }
      toast.success("Berkas Tersimpan");
      resetForm();
      fetchData();
    } catch (err) {
      toast.error("Gagal Menyimpan Berkas", { description: err?.message || "Terjadi kesalahan." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Hapus berkas ini? Peserta yang sebelumnya berhak tidak akan dapat mengunduhnya lagi.")) return;
    try {
      await apiRequest(`/api/products/bootcamp-resources/${id}/`, { method: "DELETE" });
      toast.success("Berkas Dihapus");
      fetchData();
    } catch (err) {
      toast.error("Gagal Menghapus Berkas", { description: extractErrorMessage(err, "Terjadi kesalahan.") });
    }
  };

  // Ringkasan hak akses untuk ditampilkan di daftar. Sengaja eksplisit supaya
  // admin bisa langsung melihat berkas mana yang terbatas tanpa membuka form.
  const describeAccess = (r) => {
    if (r.for_all_packages) return "Semua peserta";
    const ids = r.package_ids || [];
    if (ids.length === 0) return "Belum ada paket dipilih";
    // `packages` hanya berisi paket AKTIF. Kalau id-nya tidak ketemu, paketnya
    // sudah dinonaktifkan -- itu beda arti dengan "belum dipilih", jadi jangan
    // disamakan supaya admin tidak salah menyimpulkan.
    const nama = ids.map((id) => packages.find((pk) => pk.id === id)?.name).filter(Boolean);
    if (nama.length === 0) return `Khusus ${ids.length} paket nonaktif`;
    const sisa = ids.length - nama.length;
    return `Khusus ${nama.join(", ")}${sisa > 0 ? ` (+${sisa} paket nonaktif)` : ""}`;
  };

  if (loading) return null;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-[15px] text-[#0F172A]">Berkas Materi Bootcamp</h2>
        <button
          onClick={() => setShowAdd((s) => !s)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#148F89] text-white text-[12px] font-semibold hover:bg-[#117A75] transition-colors"
        >
          <Plus size={13} /> Tambah Berkas
        </button>
      </div>
      <p className="text-[#94A3B8] text-[11.5px] -mt-2">
        Berkas dapat dibagikan ke seluruh peserta bootcamp ini atau dibatasi hanya untuk paket tertentu.
        Berkas hanya dapat diunduh oleh peserta yang pembayarannya sudah diverifikasi, tidak pernah terbuka untuk publik.
      </p>

      {resources.length === 0 ? (
        <p className="text-[#94A3B8] text-[12.5px] italic">Belum ada berkas materi.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {resources.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-[8px] border border-[#E2E8F0]">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText size={16} className="text-[#148F89] shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[#1E293B] font-medium text-[13px] truncate">{r.title}</span>
                  <span className="text-[#64748B] text-[11px] flex items-center gap-1">
                    <Lock size={10} /> {r.resource_type_label} &middot; {describeAccess(r)}
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
          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Judul File</FieldLabel>
            <input
              type="text"
              placeholder="Contoh: Modul Business Case Fundamental"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel hint="hanya label pengelompokan">Kategori</FieldLabel>
            <select
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
              className="w-full bg-white border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
            >
              {RESOURCE_TYPES.map((rt) => (
                <option key={rt.value} value={rt.value}>{rt.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Berkas</FieldLabel>
            <label className="flex items-center gap-2 border border-dashed border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#64748B] hover:border-[#148F89]/50 cursor-pointer transition-colors">
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              {file ? file.name : "Pilih berkas (maksimal 20 MB)"}
            </label>
          </div>
          {/* Siapa yang boleh mengunduh. "Semua peserta" tetap berarti sudah
              bayar bootcamp ini -- tidak ada file yang terbuka ke publik. */}
          <div className="flex flex-col gap-2">
            <FieldLabel>Bisa Diakses Oleh</FieldLabel>
            <label className="flex items-center gap-2 text-[12.5px] text-[#1E293B] cursor-pointer">
              <input type="radio" checked={forAll} onChange={() => setForAll(true)} className="accent-[#148F89]" />
              Semua peserta bootcamp ini
            </label>
            <label className="flex items-center gap-2 text-[12.5px] text-[#1E293B] cursor-pointer">
              <input type="radio" checked={!forAll} onChange={() => setForAll(false)} className="accent-[#148F89]" />
              Paket tertentu saja
            </label>
            {!forAll && (
              <div className="flex flex-col gap-1 pl-6">
                {packages.length === 0 && (
                  <span className="text-[#94A3B8] text-[11.5px] italic">Belum ada paket aktif di bootcamp ini.</span>
                )}
                {packages.map((pk) => (
                  <label key={pk.id} className="flex items-center gap-2 text-[12px] text-[#334155] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pickedPackages.includes(pk.id)}
                      onChange={(e) => setPickedPackages((cur) => (e.target.checked ? [...cur, pk.id] : cur.filter((x) => x !== pk.id)))}
                      className="accent-[#148F89]"
                    />
                    {pk.name}
                  </label>
                ))}
                {pickedPackages.length === 0 && (
                  <span className="text-[#B45309] text-[11px]">Belum ada paket yang dipilih. Berkas ini tidak akan dapat diakses oleh siapa pun.</span>
                )}
              </div>
            )}
          </div>

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
