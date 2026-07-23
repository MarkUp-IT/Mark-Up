"use client";

import {
  Plus,
  X,
  ChevronDown,
  ExternalLink,
  CloudUpload,
  Search,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/component/admin/DashboardLayout";
import StatCard from "@/component/admin/StatCard";
import EmptyState from "@/component/admin/EmptyState";
import { apiRequest, getAccessToken, API_BASE } from "@/lib/api";
import { toast } from "sonner";
import { fieldBorderClass as fieldBorder } from "@/lib/formErrors";

const TYPE_BADGE = {
  participant: "bg-[#DBEAFE] text-[#1D4ED8] border border-[#BFDBFE]",
  instructor: "bg-[#CCFBF1] text-[#0F766E] border border-[#99F6E4]",
};

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function Certificates() {
  const heightFix = `.adm-h-42 { height: 42px; } .adm-h-48 { height: 48px; }`;

  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [certType, setCertType] = useState("participant");
  const [number, setNumber] = useState("");
  const [productId, setProductId] = useState("");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState(null);

  const fetchCertificates = useCallback(async () => {
    try {
      const res = await apiRequest("/api/products/certificates/");
      setCertificates(res?.certificates || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchCertificates(),
      apiRequest("/api/products/?all=true", { auth: false }),
    ])
      .then(([, productsRes]) => setProducts(productsRes?.products || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [fetchCertificates]);

  useEffect(() => {
    document.body.style.overflow = isAddOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isAddOpen]);

  useEffect(() => {
    if (!userSearch.trim()) {
      setUserResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const role = certType === "instructor" ? "MENTOR" : "STUDENT";
        const res = await apiRequest(`/api/accounts/users/?role=${role}&search=${encodeURIComponent(userSearch)}`);
        setUserResults(res?.users || []);
      } catch (err) {
        console.error(err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearch, certType]);

  const resetForm = () => {
    setCertType("participant");
    setNumber("");
    setProductId("");
    setFile(null);
    setUserSearch("");
    setUserResults([]);
    setSelectedRecipient(null);
    setErrors({});
  };

  const openAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleSubmit = async () => {
    setErrors({});
    if (!selectedRecipient || !number.trim() || !file) {
      setErrors({ detail: "Penerima, nomor sertifikat, dan file wajib diisi." });
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("number", number.trim());
      formData.append("type", certType);
      formData.append("recipient_id", selectedRecipient.id);
      if (productId) formData.append("product_id", productId);
      formData.append("file", file);

      const token = getAccessToken();
      const res = await fetch(`${API_BASE}/api/products/certificates/add/`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const nextErrors = data?.errors || { detail: data?.detail || "Gagal menerbitkan sertifikat." };
        setErrors(nextErrors);
        toast.error("Gagal Menerbitkan Sertifikat", {
          description: Object.values(nextErrors).flat().join(" "),
        });
        return;
      }

      setIsAddOpen(false);
      fetchCertificates();
      toast.success("Sertifikat Diterbitkan", { description: `Nomor ${number.trim()} berhasil diterbitkan.` });
    } catch (err) {
      const message = err?.message || "Gagal menerbitkan sertifikat.";
      setErrors({ detail: message });
      toast.error("Gagal Menerbitkan Sertifikat", { description: message });
    } finally {
      setSaving(false);
    }
  };

  const participantCount = certificates.filter((c) => c.type === "participant").length;
  const instructorCount = certificates.filter((c) => c.type === "instructor").length;

  return (
    <DashboardLayout title="Sertifikat">
      <style>{heightFix}</style>

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bold text-[22px] text-[#0F172A]">Manajemen Sertifikat</h1>
          <p className="text-[#64748B] text-[14px] mt-1">
            Terbitkan sertifikat peserta bootcamp/mentoring atau sertifikat pemateri buat mentor.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="adm-h-42 flex items-center gap-2 px-5 rounded-[8px] bg-[#148F89] text-white text-[13px] font-semibold hover:bg-[#117A75] transition-colors"
        >
          <Plus size={16} />
          Terbitkan Sertifikat
        </button>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <StatCard label="Total Diterbitkan" value={certificates.length} unit="sertifikat" loading={loading} />
        <StatCard label="Sertifikat Peserta" value={participantCount} unit="sertifikat" loading={loading} />
        <StatCard label="Sertifikat Pemateri" value={instructorCount} unit="sertifikat" variant="primary" loading={loading} />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-[16px] font-semibold text-[#0F172A]">Riwayat Penerbitan</h2>

        {!loading && certificates.length === 0 ? (
          <EmptyState message="Belum ada sertifikat yang diterbitkan." />
        ) : (
          <div className="rounded-[12px] overflow-hidden border border-[#E2E8F0] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-6 py-3.5 text-left font-bold text-[#64748B] tracking-wider text-[11px]">NO. SERTIFIKAT</th>
                    <th className="px-6 py-3.5 text-left font-bold text-[#64748B] tracking-wider text-[11px]">PENERIMA & PRODUK</th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">TIPE</th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">TANGGAL TERBIT</th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">FILE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] bg-white">
                  {certificates.map((item) => (
                    <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-6 py-4 text-[#64748B] font-mono font-medium">{item.number}</td>
                      <td className="px-6 py-4">
                        <p className="text-[#1E293B] font-semibold">{item.recipient_name}</p>
                        <p className="text-[#64748B] text-[12px] mt-0.5">{item.product_title || "-"}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-3 py-1.5 text-[11px] rounded-[6px] font-semibold ${TYPE_BADGE[item.type]}`}>
                          {item.type === "participant" ? "PESERTA" : "PEMATERI"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-[#64748B] font-medium whitespace-nowrap">
                        {formatDate(item.issued_at)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <a href={item.file_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink size={17} className="cursor-pointer text-[#94A3B8] hover:text-[#148F89] transition-colors inline-block" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setIsAddOpen(false)} />
      )}
      <div
        style={{ width: "480px", maxWidth: "100%" }}
        className={`fixed top-0 right-0 h-screen bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out flex flex-col overflow-y-auto ${isAddOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="w-full shrink-0 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col justify-center px-8 py-6 gap-1">
          <div className="flex justify-between items-center">
            <p className="text-[#1E293B] text-[19px] font-bold">Terbitkan Sertifikat</p>
            <button onClick={() => setIsAddOpen(false)} className="p-2 hover:bg-[#E2E8F0] rounded-full transition-colors">
              <X className="text-[#64748B]" size={20} />
            </button>
          </div>
          <p className="text-[#64748B] text-[13px]">Terbitkan sertifikat baru buat user atau mentor.</p>
        </div>

        <div className="px-8 py-6 flex flex-col gap-5">
          {errors.detail && (
            <p className="text-[#DC2626] text-[12px] bg-[#FEE2E2] border border-[#FCA5A5] rounded-[8px] px-3.5 py-2.5">
              {errors.detail}
            </p>
          )}

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">Tipe Sertifikat</p>
            <div className="adm-h-42 bg-[#F1F5F9] px-1.5 rounded-[8px] flex items-center gap-1">
              <button
                type="button"
                onClick={() => { setCertType("participant"); setSelectedRecipient(null); setUserSearch(""); }}
                className={`flex-1 px-3 py-2 rounded-[6px] font-semibold text-[12.5px] transition-colors ${certType === "participant" ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B]"}`}
              >
                Peserta
              </button>
              <button
                type="button"
                onClick={() => { setCertType("instructor"); setSelectedRecipient(null); setUserSearch(""); }}
                className={`flex-1 px-3 py-2 rounded-[6px] font-semibold text-[12.5px] transition-colors ${certType === "instructor" ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B]"}`}
              >
                Pemateri (Mentor)
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              {certType === "participant" ? "Cari User" : "Cari Mentor"}
            </p>
            {selectedRecipient ? (
              <div className="flex items-center justify-between bg-[#148F89]/10 border border-[#148F89]/30 rounded-[8px] px-4 py-3">
                <div>
                  <p className="text-[#1E293B] font-semibold text-[13px]">{selectedRecipient.fullname}</p>
                  <p className="text-[#64748B] text-[11px]">{selectedRecipient.email}</p>
                </div>
                <button onClick={() => setSelectedRecipient(null)} className="text-[#94A3B8] hover:text-[#DC2626]">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Ketik nama atau email..."
                  className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] pl-10 pr-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
                />
                {userResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-[#E2E8F0] rounded-[8px] shadow-lg max-h-[200px] overflow-y-auto">
                    {userResults.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => { setSelectedRecipient(u); setUserResults([]); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-[#F8FAFC] transition-colors"
                      >
                        <p className="text-[#1E293B] text-[13px] font-medium">{u.fullname}</p>
                        <p className="text-[#94A3B8] text-[11px]">{u.email}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">Produk Terkait (opsional)</p>
            <div className="relative w-full">
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 pr-10 appearance-none outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
              >
                <option value="">-- Pilih Produk --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
              <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">Nomor Sertifikat</p>
            <input
              type="text"
              value={number}
              onChange={(e) => {
                setNumber(e.target.value);
                setErrors((prev) => (prev.number ? { ...prev, number: undefined } : prev));
              }}
              placeholder="Contoh: MKUP/BC001/2026/0044"
              className={`w-full adm-h-48 bg-[#F8FAFC] border rounded-[8px] px-4 outline-none transition-all text-[#1E293B] font-mono ${fieldBorder(errors, "number")}`}
            />
            {errors.number && <p className="text-[#DC2626] text-[11px]">{errors.number[0]}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">File Sertifikat (PDF)</p>
            <label
              style={{ height: "140px" }}
              className="bg-[#F8FAFC] w-full rounded-[8px] flex flex-col items-center justify-center border-2 border-dashed border-[#CBD5E1] hover:bg-[#F1F5F9] transition-all cursor-pointer"
            >
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <CloudUpload size={22} className="text-[#148F89] mb-2" />
              <p className="text-[#1E293B] font-semibold text-[14px]">
                {file ? file.name : "Klik untuk unggah PDF"}
              </p>
              <p className="text-[#94A3B8] text-[12px]">Maks. 5MB</p>
            </label>
          </div>
        </div>

        <div className="mt-auto p-6 bg-white border-t border-[#E2E8F0] flex gap-3">
          <button
            onClick={() => setIsAddOpen(false)}
            className="flex-1 py-3 bg-white border border-[#E2E8F0] text-[#475569] font-bold rounded-[8px] hover:bg-[#F8FAFC] transition-colors"
          >
            Batalkan
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-3 bg-[#148F89] text-white font-bold rounded-[8px] hover:bg-[#117A75] transition-colors disabled:opacity-50"
          >
            {saving ? "Menerbitkan..." : "Terbitkan"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
