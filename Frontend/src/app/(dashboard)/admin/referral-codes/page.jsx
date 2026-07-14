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
import { useState, useEffect } from "react";
import DashboardLayout from "@/component/admin/DashboardLayout";
import StatCard from "@/component/admin/StatCard";
import EmptyState from "@/component/admin/EmptyState";

const heightFix = `.adm-h-42 { height: 42px; } .adm-h-48 { height: 48px; }`;

// --- MOCK DATA katalog produk, dikelompokkan per kategori -- nanti ganti
// query gabungan product_bootcamp + product_mentoring + product_modul ---
const PRODUCT_CATALOG = {
  Bootcamp: [
    { id: "BC-001", title: "Winner Class Dan Module (Debate)" },
    { id: "BC-002", title: "Frontend Engineering Sprint" },
    { id: "BC-003", title: "Public Speaking Bootcamp" },
  ],
  Mentoring: [
    { id: "MT-001", title: "1-on-1 Career Mentoring" },
    { id: "MT-002", title: "Bundling PowerPack (Newbie Friendly)" },
    { id: "MT-003", title: "Interview Preparation Session" },
  ],
  Modul: [
    { id: "MD-001", title: "Masterclass Business Case Competition (BCC)" },
  ],
};

const ALL_PRODUCTS = Object.values(PRODUCT_CATALOG).flat();

function productTitleById(id) {
  return ALL_PRODUCTS.find((p) => p.id === id)?.title || id;
}

// Dipakai bareng di drawer Tambah & Edit -- satu sumber kebenaran buat UI
// pemilihan produk, biar dua form itu nggak punya 2 versi logic yang beda.
function ScopeSelector({
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
    const ids = PRODUCT_CATALOG[category].map((p) => p.id);
    const selectedCount = ids.filter((id) => selectedIds.includes(id)).length;
    if (selectedCount === 0) return "none";
    if (selectedCount === ids.length) return "all";
    return "partial";
  };

  const toggleCategory = (category) => {
    const ids = PRODUCT_CATALOG[category].map((p) => p.id);
    const state = categoryState(category);
    if (state === "all") {
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...ids])]);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
        Berlaku Untuk
      </p>

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
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
            />
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
            {Object.entries(PRODUCT_CATALOG).map(([category, products]) => {
              const filtered = products.filter((p) =>
                p.title.toLowerCase().includes(search.toLowerCase()),
              );
              if (filtered.length === 0) return null;
              const state = categoryState(category);

              return (
                <div key={category} className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className="flex items-center gap-2 text-left"
                  >
                    <span
                      style={{ width: "17px", height: "17px" }}
                      className={`shrink-0 rounded-[4px] border flex items-center justify-center transition-colors ${
                        state === "none"
                          ? "border-[#CBD5E1] bg-white"
                          : "border-[#148F89] bg-[#148F89]"
                      }`}
                    >
                      {state === "all" && (
                        <Check size={12} className="text-white" />
                      )}
                      {state === "partial" && (
                        <Minus size={11} className="text-white" />
                      )}
                    </span>
                    <span className="text-[#1E293B] font-bold text-[12.5px]">
                      {category}
                    </span>
                  </button>

                  <div className="flex flex-col gap-1 pl-6">
                    {filtered.map((product) => {
                      const isChecked = selectedIds.includes(product.id);
                      return (
                        <label
                          key={product.id}
                          className="flex items-center gap-2 cursor-pointer py-0.5"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleProduct(product.id)}
                            className="w-[15px] h-[15px] rounded border-[#CBD5E1] text-[#148F89] focus:ring-[#148F89] cursor-pointer"
                          />
                          <span className="text-[#334155] text-[12.5px]">
                            {product.title}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[#94A3B8] text-[11px]">
            {selectedIds.length === 0
              ? "Belum ada produk dipilih."
              : `${selectedIds.length} produk dipilih.`}
          </p>
        </div>
      )}
    </div>
  );
}

export default function ReferralCodes() {
  const [codes, setCodes] = useState([
    {
      id: "1",
      code: "LAUNCH2026",
      discountType: "percentage",
      discountValue: 20,
      maxDiscount: 50000,
      quota: 100,
      used: 34,
      isActive: true,
      scopeMode: "all",
      productIds: [],
    },
    {
      id: "2",
      code: "MENTORING10",
      discountType: "fixed",
      discountValue: 10000,
      maxDiscount: null,
      quota: 50,
      used: 50,
      isActive: true,
      scopeMode: "specific",
      productIds: ["MT-001", "MT-002", "MT-003"],
    },
    {
      id: "3",
      code: "COMEBACKBC001",
      discountType: "percentage",
      discountValue: 15,
      maxDiscount: 30000,
      quota: 20,
      used: 12,
      isActive: false,
      scopeMode: "specific",
      productIds: ["BC-001"],
    },
  ]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const [formCode, setFormCode] = useState("");
  const [formDiscountType, setFormDiscountType] = useState("percentage");
  const [formDiscountValue, setFormDiscountValue] = useState("");
  const [formMaxDiscount, setFormMaxDiscount] = useState("");
  const [formQuota, setFormQuota] = useState("");
  const [formScopeMode, setFormScopeMode] = useState("all");
  const [formSelectedIds, setFormSelectedIds] = useState([]);
  const [formSearch, setFormSearch] = useState("");

  useEffect(() => {
    document.body.style.overflow = isAddOpen || isEditOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isAddOpen, isEditOpen]);

  const formatIDR = (val) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);

  const formatDiscount = (item) =>
    item.discountType === "percentage"
      ? `${item.discountValue}%`
      : formatIDR(item.discountValue);

  const scopeLabel = (item) => {
    if (item.scopeMode === "all") return "Semua Produk";
    if (item.productIds.length === 1)
      return productTitleById(item.productIds[0]);
    return `${item.productIds.length} Produk Terpilih`;
  };

  const copyCode = (item) => {
    navigator.clipboard?.writeText(item.code);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const toggleActive = (id) => {
    setCodes((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c)),
    );
  };

  const resetForm = () => {
    setFormCode("");
    setFormDiscountType("percentage");
    setFormDiscountValue("");
    setFormMaxDiscount("");
    setFormQuota("");
    setFormScopeMode("all");
    setFormSelectedIds([]);
    setFormSearch("");
  };

  const openAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const openEdit = (item) => {
    setEditingCode(item);
    setFormCode(item.code);
    setFormDiscountType(item.discountType);
    setFormDiscountValue(String(item.discountValue));
    setFormMaxDiscount(item.maxDiscount ? String(item.maxDiscount) : "");
    setFormQuota(String(item.quota));
    setFormScopeMode(item.scopeMode);
    setFormSelectedIds(item.productIds);
    setFormSearch("");
    setIsEditOpen(true);
  };

  const handleCreate = () => {
    if (!formCode.trim() || !formDiscountValue || !formQuota) return;
    setCodes((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        code: formCode.trim().toUpperCase(),
        discountType: formDiscountType,
        discountValue: Number(formDiscountValue),
        maxDiscount: formMaxDiscount ? Number(formMaxDiscount) : null,
        quota: Number(formQuota),
        used: 0,
        isActive: true,
        scopeMode: formScopeMode,
        productIds: formScopeMode === "all" ? [] : formSelectedIds,
      },
    ]);
    setIsAddOpen(false);
  };

  const handleSaveEdit = () => {
    if (!editingCode) return;
    setCodes((prev) =>
      prev.map((c) =>
        c.id === editingCode.id
          ? {
              ...c,
              code: formCode.trim().toUpperCase(),
              discountType: formDiscountType,
              discountValue: Number(formDiscountValue),
              maxDiscount: formMaxDiscount ? Number(formMaxDiscount) : null,
              quota: Number(formQuota),
              scopeMode: formScopeMode,
              productIds: formScopeMode === "all" ? [] : formSelectedIds,
            }
          : c,
      ),
    );
    setIsEditOpen(false);
    setEditingCode(null);
  };

  const activeCount = codes.filter((c) => c.isActive).length;
  const totalUsed = codes.reduce((sum, c) => sum + c.used, 0);

  return (
    <DashboardLayout title="Kode Referral">
      <style>{heightFix}</style>

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bold text-[22px] text-[#0F172A]">
            Kode Referral & Voucher
          </h1>
          <p className="text-[#64748B] text-[14px] mt-1">
            Kelola kode diskon yang bisa dipakai user pas checkout.
          </p>
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
        <StatCard
          label="Kode Aktif"
          value={activeCount}
          unit="kode"
          variant="success"
        />
        <StatCard
          label="Total Terpakai"
          value={totalUsed}
          unit="kali"
          variant="primary"
        />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-[16px] font-semibold text-[#0F172A]">
          Daftar Kode
        </h2>

        {codes.length === 0 ? (
          <EmptyState message="Belum ada kode referral yang dibuat." />
        ) : (
          <div className="rounded-[12px] overflow-hidden border border-[#E2E8F0] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-6 py-3.5 text-left font-bold text-[#64748B] tracking-wider text-[11px]">
                      KODE
                    </th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                      DISKON
                    </th>
                    <th className="px-6 py-3.5 text-left font-bold text-[#64748B] tracking-wider text-[11px]">
                      BERLAKU UNTUK
                    </th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                      KUOTA
                    </th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                      STATUS
                    </th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                      AKSI
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] bg-white">
                  {codes.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-[#F8FAFC] transition-colors"
                    >
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
                        {item.maxDiscount &&
                          item.discountType === "percentage" && (
                            <p className="text-[#94A3B8] text-[10px] font-normal">
                              maks. {formatIDR(item.maxDiscount)}
                            </p>
                          )}
                      </td>
                      <td
                        className="px-6 py-4 text-[#64748B]"
                        style={{ maxWidth: "220px" }}
                      >
                        {scopeLabel(item)}
                      </td>
                      <td className="px-6 py-4 text-center text-[#475569] font-medium whitespace-nowrap">
                        {item.used}/{item.quota}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleActive(item.id)}
                          className={`inline-flex px-3 py-1.5 text-[11px] rounded-full font-bold transition-colors whitespace-nowrap ${
                            item.isActive
                              ? "bg-[#DCFCE7] text-[#166534] hover:bg-[#BBF7D0]"
                              : "bg-[#FEE2E2] text-[#991B1B] hover:bg-[#FECACA]"
                          }`}
                        >
                          {item.isActive ? "AKTIF" : "NONAKTIF"}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => openEdit(item)}>
                          <PenLine
                            size={17}
                            className="cursor-pointer text-[#94A3B8] hover:text-[#148F89] transition-colors"
                          />
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
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setIsAddOpen(false)}
        />
      )}
      <div
        style={{ width: "480px", maxWidth: "100%" }}
        className={`fixed top-0 right-0 h-screen bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out flex flex-col overflow-y-auto ${isAddOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="w-full shrink-0 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col justify-center px-8 py-6 gap-1">
          <div className="flex justify-between items-center">
            <p className="text-[#1E293B] text-[19px] font-bold">
              Kode Referral Baru
            </p>
            <button
              onClick={() => setIsAddOpen(false)}
              className="p-2 hover:bg-[#E2E8F0] rounded-full transition-colors"
            >
              <X className="text-[#64748B]" size={20} />
            </button>
          </div>
          <p className="text-[#64748B] text-[13px]">
            Bikin kode diskon baru buat dipakai user pas checkout.
          </p>
        </div>

        <div className="px-8 py-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Kode
            </p>
            <input
              type="text"
              value={formCode}
              onChange={(e) => setFormCode(e.target.value)}
              placeholder="Contoh: LAUNCH2026"
              className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B] font-mono uppercase"
            />
          </div>

          <div className="flex gap-4 w-full">
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
                Tipe Diskon
              </p>
              <div className="relative w-full">
                <select
                  value={formDiscountType}
                  onChange={(e) => setFormDiscountType(e.target.value)}
                  className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 pr-10 appearance-none outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
                >
                  <option value="percentage">Persentase (%)</option>
                  <option value="fixed">Nominal Tetap (Rp)</option>
                </select>
                <ChevronDown
                  size={18}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
                Nilai Diskon
              </p>
              <input
                type="number"
                value={formDiscountValue}
                onChange={(e) => setFormDiscountValue(e.target.value)}
                placeholder="0"
                className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Maks. Potongan (opsional)
            </p>
            <input
              type="number"
              value={formMaxDiscount}
              onChange={(e) => setFormMaxDiscount(e.target.value)}
              placeholder="Cuma berlaku buat tipe persentase"
              className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Kuota Pemakaian
            </p>
            <input
              type="number"
              value={formQuota}
              onChange={(e) => setFormQuota(e.target.value)}
              placeholder="Berapa kali kode ini boleh dipakai"
              className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
            />
          </div>

          <ScopeSelector
            scopeMode={formScopeMode}
            setScopeMode={setFormScopeMode}
            selectedIds={formSelectedIds}
            setSelectedIds={setFormSelectedIds}
            search={formSearch}
            setSearch={setFormSearch}
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
            className="flex-1 py-3 bg-[#148F89] text-white font-bold rounded-[8px] hover:bg-[#117A75] transition-colors"
          >
            Buat Kode
          </button>
        </div>
      </div>

      {/* --- DRAWER EDIT --- */}
      {isEditOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setIsEditOpen(false)}
        />
      )}
      <div
        style={{ width: "480px", maxWidth: "100%" }}
        className={`fixed top-0 right-0 h-screen bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out flex flex-col overflow-y-auto ${isEditOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="w-full shrink-0 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col justify-center px-8 py-6 gap-1">
          <div className="flex justify-between items-center">
            <p className="text-[#1E293B] text-[19px] font-bold">
              Edit Kode Referral
            </p>
            <button
              onClick={() => setIsEditOpen(false)}
              className="p-2 hover:bg-[#E2E8F0] rounded-full transition-colors"
            >
              <X className="text-[#64748B]" size={20} />
            </button>
          </div>
          <p className="text-[#64748B] text-[13px]">
            {editingCode?.used > 0
              ? `Udah dipakai ${editingCode.used} kali -- perubahan cuma berlaku buat pemakaian selanjutnya.`
              : "Ubah detail kode ini."}
          </p>
        </div>

        <div className="px-8 py-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Kode
            </p>
            <input
              type="text"
              value={formCode}
              onChange={(e) => setFormCode(e.target.value)}
              className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B] font-mono uppercase"
            />
          </div>

          <div className="flex gap-4 w-full">
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
                Tipe Diskon
              </p>
              <div className="relative w-full">
                <select
                  value={formDiscountType}
                  onChange={(e) => setFormDiscountType(e.target.value)}
                  className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 pr-10 appearance-none outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
                >
                  <option value="percentage">Persentase (%)</option>
                  <option value="fixed">Nominal Tetap (Rp)</option>
                </select>
                <ChevronDown
                  size={18}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
                Nilai Diskon
              </p>
              <input
                type="number"
                value={formDiscountValue}
                onChange={(e) => setFormDiscountValue(e.target.value)}
                className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Maks. Potongan (opsional)
            </p>
            <input
              type="number"
              value={formMaxDiscount}
              onChange={(e) => setFormMaxDiscount(e.target.value)}
              placeholder="Cuma berlaku buat tipe persentase"
              className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Kuota Pemakaian
            </p>
            <input
              type="number"
              value={formQuota}
              onChange={(e) => setFormQuota(e.target.value)}
              className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
            />
            {editingCode && Number(formQuota) < editingCode.used && (
              <p className="text-[#DC2626] text-[11px]">
                Kuota nggak boleh kurang dari {editingCode.used} (jumlah yang
                udah kepake).
              </p>
            )}
          </div>

          <ScopeSelector
            scopeMode={formScopeMode}
            setScopeMode={setFormScopeMode}
            selectedIds={formSelectedIds}
            setSelectedIds={setFormSelectedIds}
            search={formSearch}
            setSearch={setFormSearch}
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
            disabled={editingCode && Number(formQuota) < editingCode.used}
            className="flex-1 py-3 bg-[#148F89] text-white font-bold rounded-[8px] hover:bg-[#117A75] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Simpan Perubahan
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
