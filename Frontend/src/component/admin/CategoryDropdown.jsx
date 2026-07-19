"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Pencil, Plus, Check, X as XIcon } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { toast } from "sonner";

// Dropdown kategori kustom (bukan <select> native) -- selain milih kategori,
// admin juga bisa nambah kategori baru atau edit nama kategori yang udah ada
// langsung dari sini, tanpa perlu halaman terpisah.
export default function CategoryDropdown({
  categories,
  value,
  onChange,
  onCategoriesChanged,
  hasError,
  disabled,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const containerRef = useRef(null);

  const selected = categories.find((c) => String(c.id) === String(value));

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setEditingId(null);
        setIsAddingNew(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  function startEdit(cat) {
    setEditingId(cat.id);
    setEditingName(cat.name);
    setIsAddingNew(false);
  }

  async function saveEdit(cat) {
    const name = editingName.trim();
    if (!name || saving) return;
    setSaving(true);
    try {
      await api.patch(`/api/programs/categories/${cat.id}/`, { name });
      setEditingId(null);
      await onCategoriesChanged();
      toast.success("Kategori Diperbarui", { description: `"${cat.name}" diubah jadi "${name}".` });
    } catch (err) {
      toast.error("Gagal Mengubah Kategori", {
        description: err instanceof ApiError ? err.message : "Terjadi kesalahan.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function saveNewCategory() {
    const name = newName.trim();
    if (!name || saving) return;
    setSaving(true);
    try {
      const res = await api.post("/api/programs/categories/add/", { name });
      setNewName("");
      setIsAddingNew(false);
      await onCategoriesChanged();
      if (res?.category?.id) {
        onChange({ target: { name: "category", value: String(res.category.id) } });
      }
      toast.success("Kategori Ditambahkan", { description: `"${name}" siap dipakai.` });
    } catch (err) {
      toast.error("Gagal Menambah Kategori", {
        description: err instanceof ApiError ? err.message : "Terjadi kesalahan.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((v) => !v)}
        className={`w-full adm-h-48 bg-[#F8FAFC] border rounded-[8px] px-4 pr-10 outline-none transition-all text-left text-[13px] disabled:opacity-60 ${
          hasError ? "border-red-500" : "border-[#E2E8F0] focus:border-[#148F89]"
        } ${selected ? "text-[#1E293B]" : "text-[#94A3B8]"}`}
      >
        {selected ? selected.name : disabled ? "Memuat kategori..." : "Pilih kategori"}
      </button>
      <ChevronDown
        size={18}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none"
      />

      {isOpen && (
        <div className="absolute z-30 top-[calc(100%+4px)] left-0 w-full bg-white border border-[#E2E8F0] rounded-[8px] shadow-lg overflow-hidden">
          <div className="max-h-[220px] overflow-y-auto py-1">
            {categories.length === 0 && (
              <p className="px-4 py-3 text-[#94A3B8] text-[12.5px]">
                Belum ada kategori. Tambah dulu di bawah.
              </p>
            )}
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-2 px-3 py-2 hover:bg-[#F8FAFC] group"
              >
                {editingId === cat.id ? (
                  <>
                    <input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          saveEdit(cat);
                        }
                      }}
                      className="flex-1 h-8 px-2 border border-[#148F89] rounded-[6px] text-[13px] outline-none text-[#1E293B]"
                    />
                    <button
                      type="button"
                      onClick={() => saveEdit(cat)}
                      disabled={saving}
                      className="p-1 text-[#148F89] hover:bg-[#148F89]/10 rounded-[6px] disabled:opacity-50"
                    >
                      <Check size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="p-1 text-[#94A3B8] hover:bg-[#F1F5F9] rounded-[6px]"
                    >
                      <XIcon size={15} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        onChange({ target: { name: "category", value: String(cat.id) } });
                        setIsOpen(false);
                      }}
                      className={`flex-1 text-left text-[13px] py-1 ${
                        String(cat.id) === String(value) ? "text-[#148F89] font-semibold" : "text-[#1E293B]"
                      }`}
                    >
                      {cat.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(cat)}
                      aria-label={`Edit kategori ${cat.name}`}
                      className="p-1 text-[#94A3B8] opacity-0 group-hover:opacity-100 hover:text-[#148F89] transition-opacity"
                    >
                      <Pencil size={14} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-[#E2E8F0] p-2">
            {isAddingNew ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      saveNewCategory();
                    }
                  }}
                  placeholder="Nama kategori baru..."
                  className="flex-1 h-8 px-2 border border-[#148F89] rounded-[6px] text-[13px] outline-none text-[#1E293B]"
                />
                <button
                  type="button"
                  onClick={saveNewCategory}
                  disabled={saving}
                  className="p-1 text-[#148F89] hover:bg-[#148F89]/10 rounded-[6px] disabled:opacity-50"
                >
                  <Check size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setNewName("");
                  }}
                  className="p-1 text-[#94A3B8] hover:bg-[#F1F5F9] rounded-[6px]"
                >
                  <XIcon size={15} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-[#148F89] text-[13px] font-semibold hover:bg-[#148F89]/10 rounded-[6px] transition-colors"
              >
                <Plus size={15} />
                Tambah Kategori Baru
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
