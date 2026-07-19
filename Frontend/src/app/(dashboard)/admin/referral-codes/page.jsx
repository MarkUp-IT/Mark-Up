"use client";

import {
  Plus,
  X,
  ChevronDown,
  PenLine,
  Copy,
  Check,
  Search,
  Minus,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/component/admin/DashboardLayout";
import StatCard from "@/component/admin/StatCard";
import EmptyState from "@/component/admin/EmptyState";
import { apiRequest } from "@/lib/api";

const heightFix = `.adm-h-42 { height: 42px; } .adm-h-48 { height: 48px; }`;

const TYPE_LABEL = { BOOTCAMP: "Bootcamp", MENTORING: "Mentoring", MODULE: "Modul" };

function groupCatalog(products) {
  const grouped = { Bootcamp: [], Mentoring: [], Modul: [] };
  for (const p of products) {
    const label = TYPE_LABEL[p.type];
    if (label) grouped[label].push({ id: p.id, title: p.title });
  }
  return grouped;
}

function ScopeSelector({
  catalog,
  scopeMode,
  setScopeMode,
  selectedIds,
  setSelectedIds,
  search,
  setSearch,
}) {
  const toggleProduct = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const categoryState = (category) => {
    const ids = catalog[category].map((p) => p.id);
    const selectedCount = ids.filter((id) => selectedIds.includes(id)).length;
    if (selectedCount === 0) return "none";
    if (selectedCount === ids.length) return "all";
    return "partial";
  };

  const toggleCategory = (category) => {
    const ids = catalog[category].map((p) => p.id);
    const state = categoryState(category);
    if (state === "all") {
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...ids])]);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">Berlaku Untuk</p>

      <div className="adm-h-42 bg-[#F1F5F9] px-1.5 rounded-[8px] flex items-center gap-1">
        <button
          type="button"
          onClick={() => setScopeMode("all")}
          className={`flex-1 px-3 py-2 rounded-[6px] font-semibold text-[12.5px] transition-colors ${scopeMode === "all" ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B]"}`}
        >
          Semua Produk
        </button>
        <button
          type="button"
          onClick={() => setScopeMode("specific")}
          className={`flex-1 px-3 py-2 rounded-[6px] font-semibold text-[12.5px] transition-colors ${scopeMode === "specific" ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B]"}`}
        >
          Produk Tertentu
        </button>
      </div>

      {scopeMode === "all" ? (
        <p className="text-[#94A3B8] text-[11px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-3.5 py-2.5">
          Kode ini bisa dipakai buat produk APAPUN di seluruh katalog MARK-UP.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari produk..."
              className="w-full adm-h-42 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] pl-9 pr-3 text-[13px] text-[#1E293B] outline-none focus:border-[#148F89] transition-colors"
            />
          </div>

          <div
            style={{ maxHeight: "260px" }}
            className="overflow-y-auto flex flex-col gap-3 border border-[#E2E8F0] rounded-[8px] p-3 bg-[#F8FAFC]"
          >
            {Object.entries(catalog).map(([category, products]) => {
              const filtered = products.filter((p) =>
                p.title.toLowerCase().includes(search.toLowerCase()),
              );
              if (filtered.length === 0) return null;
              const state = categoryState(category);

              return (
                <div key={category} className="flex flex-col gap-1.5">
                  <button type="button" onClick={() => toggleCategory(category)} className="flex items-center gap-2 text-left">
                    <span
                      style={{ width: "17px", height: "17px" }}
                      className={`shrink-0 rounded-[4px] border flex items-center justify-center transition-colors ${
                        state === "none" ? "border-[#CBD5E1] bg-white" : "border-[#148F89] bg-[#148F89]"
                      }`}
                    >
                      {state === "all" && <Check size={12} className="text-white" />}
                      {state === "partial" && <Minus size={11} className="text-white" />}
                    </span>
                    <span className="text-[#1E293B] font-bold text-[12.5px]">{category}</span>
                  </button>

                  <div className="flex flex-col gap-1 pl-6">
                    {filtered.map((product) => {
                      const isChecked = selectedIds.includes(product.id);
                      return (
                        <label key={product.id} className="flex items-center gap-2 cursor-pointer py-0.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleProduct(product.id)}
                            className="w-[15px] h-[15px] rounded border-[#CBD5E1] text-[#148F89] focus:ring-[#148F89] cursor-pointer"
                          />
                          <span className="text-[#334155] text-[12.5px]">{product.title}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[#94A3B8] text-[11px]">
            {selectedIds.length === 0 ? "Belum ada produk dipilih." : `${selectedIds.length} produk dipilih.`}
          </p>
        </div>
      )}
    </div>
  );
}

const emptyForm = {
  code: "",
  discountType: "percentage",
  discountValue: "",
  maxDiscount: "",
  quota: "",
  scopeMode: "all",
  selectedIds: [],
  search: "",
};

export default function ReferralCodes() {
  const [codes, setCodes] = useState([]);
  const [catalog, setCatalog] = useState({ Bootcamp: [], Mentoring: [], Modul: [] });
  const [productTitleMap, setProductTitleMap] = useState({});
  const [loading, setLoading] = useState(true);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(emptyForm);

  const fetchCodes = useCallback(async () => {
    try {
      const res = await apiRequest("/api/transactions/referral-codes/");
      setCodes(res?.referral_codes || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiRequest("/api/products/?all=true", { auth: false }),
      fetchCodes(),
    ])
      .then(([productsRes]) => {
        const products = productsRes?.products || [];
        setCatalog(groupCatalog(products));
        const map = {};
        products.forEach((p) => { map[p.id] = p.title; });
        setProductTitleMap(map);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [fetchCodes]);

  useEffect(() => {
    document.body.style.overflow = isAddOpen || isEditOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isAddOpen, isEditOpen]);

  const formatIDR = (val) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  const formatDiscount = (item) =>
    item.discount_type === "percentage" ? `${item.discount_value}%` : formatIDR(item.discount_value);

  const scopeLabel = (item) => {
    if (item.applies_to_all) return "Semua Produk";
    if (item.product_ids.length === 1) return productTitleMap[item.product_ids[0]] || item.product_ids[0];
    return `${item.product_ids.length} Produk Terpilih`;
  };

  const copyCode = (item) => {
    navigator.clipboard?.writeText(item.code);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const toggleActive = async (item) => {
    try {
      await apiRequest(`/api/transactions/referral-codes/${item.id}/`, {
        method: "PATCH",
        body: { is_active: !item.is_active },
      });
      fetchCodes();
    } catch (err) {
      console.error(err);
    }
  };

  const openAdd = () => {
    setForm(emptyForm);
    setIsAddOpen(true);
  };

  const openEdit = (item) => {
    setEditingCode(item);
    setForm({
      code: item.code,
      discountType: item.discount_type,
      discountValue: String(item.discount_value),
      maxDiscount: item.max_discount ? String(item.max_discount) : "",
      quota: String(item.quota),
      scopeMode: item.applies_to_all ? "all" : "specific",
      selectedIds: item.product_ids,
      search: "",
    });
    setIsEditOpen(true);
  };

  const handleCreate = async () => {
    if (!form.code.trim() || !form.discountValue || !form.quota) return;
    setSaving(true);
    try {
      await apiRequest("/api/transactions/referral-codes/add/", {
        method: "POST",
        body: {
          code: form.code.trim().toUpperCase(),
          discount_type: form.discountType,
          discount_value: Number(form.discountValue),
          max_discount: form.maxDiscount ? Number(form.maxDiscount) : null,
          quota: Number(form.quota),
          applies_to_all: form.scopeMode === "all",
          product_ids: form.scopeMode === "all" ? [] : form.selectedIds,
        },
      });
      setIsAddOpen(false);
      fetchCodes();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingCode) return;
    setSaving(true);
    try {
      await apiRequest(`/api/transactions/referral-codes/${editingCode.id}/`, {
        method: "PATCH",
        body: {
          code: form.code.trim().toUpperCase(),
          discount_type: form.discountType,
          discount_value: Number(form.discountValue),
          max_discount: form.maxDiscount ? Number(form.maxDiscount) : null,
          quota: Number(form.quota),
          applies_to_all: form.scopeMode === "all",
          product_ids: form.scopeMode === "all" ? [] : form.selectedIds,
        },
      });
      setIsEditOpen(false);
      setEditingCode(null);
      fetchCodes();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const activeCount = codes.filter((c) => c.is_active).length;
  const totalUsed = codes.reduce((sum, c) => sum + c.used_count, 0);

  return (
    <DashboardLayout title="Kode Referral">
      <style>{heightFix}</style>

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bold text-[22px] text-[#0F172A]">Kode Referral & Voucher</h1>
          <p className="text-[#64748B] text-[14px] mt-1">Kelola kode diskon yang bisa dipakai user pas checkout.</p>
        </div>
        <button
          onClick={openAdd}
          className="adm-h-42 flex items-center gap-2 px-5 rounded-[8px] bg-[#148F89] text-white text-[13px] font-semibold hover:bg-[#117A75] transition-colors"
        >
          <Plus size={16} />
          Kode Baru
        </button>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <StatCard label="Total Kode" value={codes.length} unit="kode" />
        <StatCard label="Kode Aktif" value={activeCount} unit="kode" variant="success" />
        <StatCard label="Total Terpakai" value={totalUsed} unit="kali" variant="primary" />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-[16px] font-semibold text-[#0F172A]">Daftar Kode</h2>

        {!loading && codes.length === 0 ? (
          <EmptyState message="Belum ada kode referral yang dibuat." />
        ) : (
          <div className="rounded-[12px] overflow-hidden border border-[#E2E8F0] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-6 py-3.5 text-left font-bold text-[#64748B] tracking-wider text-[11px]">KODE</th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">DISKON</th>
                    <th className="px-6 py-3.5 text-left font-bold text-[#64748B] tracking-wider text-[11px]">BERLAKU UNTUK</th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">KUOTA</th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">STATUS</th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] bg-white">
                  {codes.map((item) => (
                    <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => copyCode(item)}
                          className="flex items-center gap-2 text-[#1E293B] font-bold font-mono hover:text-[#148F89] transition-colors"
                        >
                          {item.code}
                          {copiedId === item.id ? (
                            <Check size={13} className="text-[#148F89]" />
                          ) : (
                            <Copy size={13} className="text-[#94A3B8]" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center text-[#334155] font-semibold whitespace-nowrap">
                        {formatDiscount(item)}
                        {item.max_discount && item.discount_type === "percentage" && (
                          <p className="text-[#94A3B8] text-[10px] font-normal">maks. {formatIDR(item.max_discount)}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[#64748B]" style={{ maxWidth: "220px" }}>
                        {scopeLabel(item)}
                      </td>
                      <td className="px-6 py-4 text-center text-[#475569] font-medium whitespace-nowrap">
                        {item.used_count}/{item.quota}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleActive(item)}
                          className={`inline-flex px-3 py-1.5 text-[11px] rounded-full font-bold transition-colors whitespace-nowrap ${
                            item.is_active ? "bg-[#DCFCE7] text-[#166534] hover:bg-[#BBF7D0]" : "bg-[#FEE2E2] text-[#991B1B] hover:bg-[#FECACA]"
                          }`}
                        >
                          {item.is_active ? "AKTIF" : "NONAKTIF"}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => openEdit(item)}>
                          <PenLine size={17} className="cursor-pointer text-[#94A3B8] hover:text-[#148F89] transition-colors" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* --- DRAWER TAMBAH --- */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setIsAddOpen(false)} />
      )}
      <div
        style={{ width: "480px", maxWidth: "100%" }}
        className={`fixed top-0 right-0 h-screen bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out flex flex-col overflow-y-auto ${isAddOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="w-full shrink-0 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col justify-center px-8 py-6 gap-1">
          <div className="flex justify-between items-center">
            <p className="text-[#1E293B] text-[19px] font-bold">Kode Referral Baru</p>
            <button onClick={() => setIsAddOpen(false)} className="p-2 hover:bg-[#E2E8F0] rounded-full transition-colors">
              <X className="text-[#64748B]" size={20} />
            </button>
          </div>
          <p className="text-[#64748B] text-[13px]">Bikin kode diskon baru buat dipakai user pas checkout.</p>
        </div>

        <div className="px-8 py-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">Kode</p>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="Contoh: LAUNCH2026"
              className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B] font-mono uppercase"
            />
          </div>

          <div className="flex gap-4 w-full">
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">Tipe Diskon</p>
              <div className="relative w-full">
                <select
                  value={form.discountType}
                  onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))}
                  className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 pr-10 appearance-none outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
                >
                  <option value="percentage">Persentase (%)</option>
                  <option value="fixed">Nominal Tetap (Rp)</option>
                </select>
                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
              </div>
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">Nilai Diskon</p>
              <input
                type="number"
                value={form.discountValue}
                onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                placeholder="0"
                className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">Maks. Potongan (opsional)</p>
            <input
              type="number"
              value={form.maxDiscount}
              onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))}
              placeholder="Cuma berlaku buat tipe persentase"
              className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">Kuota Pemakaian</p>
            <input
              type="number"
              value={form.quota}
              onChange={(e) => setForm((f) => ({ ...f, quota: e.target.value }))}
              placeholder="Berapa kali kode ini boleh dipakai"
              className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
            />
          </div>

          <ScopeSelector
            catalog={catalog}
            scopeMode={form.scopeMode}
            setScopeMode={(v) => setForm((f) => ({ ...f, scopeMode: v }))}
            selectedIds={form.selectedIds}
            setSelectedIds={(updater) =>
              setForm((f) => ({ ...f, selectedIds: typeof updater === "function" ? updater(f.selectedIds) : updater }))
            }
            search={form.search}
            setSearch={(v) => setForm((f) => ({ ...f, search: v }))}
          />
        </div>

        <div className="mt-auto p-6 bg-white border-t border-[#E2E8F0] flex gap-3">
          <button
            onClick={() => setIsAddOpen(false)}
            className="flex-1 py-3 bg-white border border-[#E2E8F0] text-[#475569] font-bold rounded-[8px] hover:bg-[#F8FAFC] transition-colors"
          >
            Batalkan
          </button>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="flex-1 py-3 bg-[#148F89] text-white font-bold rounded-[8px] hover:bg-[#117A75] transition-colors disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Buat Kode"}
          </button>
        </div>
      </div>

      {/* --- DRAWER EDIT --- */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setIsEditOpen(false)} />
      )}
      <div
        style={{ width: "480px", maxWidth: "100%" }}
        className={`fixed top-0 right-0 h-screen bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out flex flex-col overflow-y-auto ${isEditOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="w-full shrink-0 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col justify-center px-8 py-6 gap-1">
          <div className="flex justify-between items-center">
            <p className="text-[#1E293B] text-[19px] font-bold">Edit Kode Referral</p>
            <button onClick={() => setIsEditOpen(false)} className="p-2 hover:bg-[#E2E8F0] rounded-full transition-colors">
              <X className="text-[#64748B]" size={20} />
            </button>
          </div>
          <p className="text-[#64748B] text-[13px]">
            {editingCode?.used_count > 0
              ? `Udah dipakai ${editingCode.used_count} kali -- perubahan cuma berlaku buat pemakaian selanjutnya.`
              : "Ubah detail kode ini."}
          </p>
        </div>

        <div className="px-8 py-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">Kode</p>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B] font-mono uppercase"
            />
          </div>

          <div className="flex gap-4 w-full">
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">Tipe Diskon</p>
              <div className="relative w-full">
                <select
                  value={form.discountType}
                  onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))}
                  className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 pr-10 appearance-none outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
                >
                  <option value="percentage">Persentase (%)</option>
                  <option value="fixed">Nominal Tetap (Rp)</option>
                </select>
                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
              </div>
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">Nilai Diskon</p>
              <input
                type="number"
                value={form.discountValue}
                onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">Maks. Potongan (opsional)</p>
            <input
              type="number"
              value={form.maxDiscount}
              onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))}
              placeholder="Cuma berlaku buat tipe persentase"
              className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">Kuota Pemakaian</p>
            <input
              type="number"
              value={form.quota}
              onChange={(e) => setForm((f) => ({ ...f, quota: e.target.value }))}
              className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
            />
            {editingCode && Number(form.quota) < editingCode.used_count && (
              <p className="text-[#DC2626] text-[11px]">
                Kuota nggak boleh kurang dari {editingCode.used_count} (jumlah yang udah kepake).
              </p>
            )}
          </div>

          <ScopeSelector
            catalog={catalog}
            scopeMode={form.scopeMode}
            setScopeMode={(v) => setForm((f) => ({ ...f, scopeMode: v }))}
            selectedIds={form.selectedIds}
            setSelectedIds={(updater) =>
              setForm((f) => ({ ...f, selectedIds: typeof updater === "function" ? updater(f.selectedIds) : updater }))
            }
            search={form.search}
            setSearch={(v) => setForm((f) => ({ ...f, search: v }))}
          />
        </div>

        <div className="mt-auto p-6 bg-white border-t border-[#E2E8F0] flex gap-3">
          <button
            onClick={() => setIsEditOpen(false)}
            className="flex-1 py-3 bg-white border border-[#E2E8F0] text-[#475569] font-bold rounded-[8px] hover:bg-[#F8FAFC] transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSaveEdit}
            disabled={saving || (editingCode && Number(form.quota) < editingCode.used_count)}
            className="flex-1 py-3 bg-[#148F89] text-white font-bold rounded-[8px] hover:bg-[#117A75] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
