"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Check, X, Upload, ShieldCheck, Clock, FileText, AlertCircle, Lock, Info } from "lucide-react";
import Navbar from "@/component/Navbar";
import Linkify from "@/component/Linkify";
import BootcampTimeline from "@/component/BootcampTimeline";
import { apiRequest, getAccessToken, API_BASE } from "@/lib/api";
import { toast } from "sonner";

const REQUIREMENTS = [
  "Bukti upload Instastory poster",
  "Bukti follow IG MarkUp & tag 5 teman di komentar feeds oprec, serta follow LinkedIn & TikTok MarkUp",
  "Bukti upload twibbon",
  "Bukti share poster ke 3 grup WhatsApp",
  "Bukti kartu tanda pelajar/mahasiswa (student ID card)",
];

const formatIDR = (val) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(val));

function formatFullDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

const STATUS_META = {
  registered: { label: "Menunggu Ditinjau", cls: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30" },
  accepted: { label: "Diterima", cls: "bg-[#148F89]/10 text-[#148F89] border-[#148F89]/30" },
  rejected: { label: "Ditolak", cls: "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30" },
};

export default function BootcampRegisterPage() {
  const params = useParams();
  const productId = params.productId;

  const [product, setProduct] = useState(null);
  const [packages, setPackages] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myRegs, setMyRegs] = useState([]);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [productRes, pkgRes, timelineRes] = await Promise.all([
        apiRequest(`/api/products/${productId}/`, { auth: false }),
        apiRequest(`/api/products/${productId}/packages/`, { auth: false }),
        apiRequest(`/api/products/${productId}/timeline/`, { auth: false }),
      ]);
      setProduct(productRes);
      setPackages(pkgRes?.packages || []);
      setTimeline(timelineRes?.timeline || []);
      if (getAccessToken()) {
        const regRes = await apiRequest("/api/products/bootcamp-registrations/me/");
        setMyRegs((regRes?.registrations || []).filter((r) => r.bootcamp_id === productId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const registeredPackageIds = new Set(myRegs.map((r) => r.package.id));

  const handleSubmit = async () => {
    if (!selectedPackageId || !file || submitting) return;
    if (!getAccessToken()) {
      toast.error("Perlu masuk dulu", { description: "Silakan masuk ke akunmu sebelum mendaftar." });
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("package_id", selectedPackageId);
      formData.append("requirement_doc", file);
      const res = await fetch(`${API_BASE}/api/products/bootcamp-register/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = data?.detail || Object.values(data?.errors || {}).flat().join(" ") || "Gagal mendaftar.";
        throw new Error(msg);
      }
      toast.success("Pendaftaran Terkirim", { description: "Menunggu ditinjau admin." });
      setFile(null);
      setSelectedPackageId("");
      fetchAll();
    } catch (err) {
      toast.error("Gagal Mendaftar", { description: err?.message || "Coba lagi." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#0F081C] font-inter text-white">
      <Navbar variant="solid" />

      <div className="max-w-[860px] mx-auto px-4 pt-32 pb-16 flex flex-col gap-8">
        <Link href="/products" className="text-[#9CA3AF] hover:text-white text-[13px] transition-colors w-fit">
          ← Kembali ke Produk
        </Link>

        {loading ? (
          <p className="text-[#9CA3AF] text-[14px]">Memuat...</p>
        ) : !product ? (
          <p className="text-[#9CA3AF] text-[14px]">Produk tidak ditemukan.</p>
        ) : (
          <>
            {/* Hero produk: gambar, judul, deskripsi */}
            <div className="rounded-[16px] overflow-hidden border border-[#2D2342] bg-[#170F26]">
              {product.image_url && (
                <div className="w-full h-[220px] sm:h-[280px] overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-6 flex flex-col gap-2">
                <span className="self-start px-3 py-1 rounded-full text-[10px] font-bold bg-[#0A4A5C] text-[#00C6D1] tracking-wider">
                  BOOTCAMP
                </span>
                <h1 className="text-[24px] sm:text-[28px] font-bold leading-tight">{product.title}</h1>
                <p className="text-[#9CA3AF] text-[14px] leading-relaxed whitespace-pre-line">
                  <Linkify text={product.description} />
                </p>
              </div>
            </div>

            {/* Timeline utama */}
            {timeline.length > 0 && (
              <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-5">
                <h2 className="font-bold text-[15px] mb-4">Timeline Utama</h2>
                <BootcampTimeline items={timeline} />
              </div>
            )}

            {/* Status pendaftaran yang sudah ada */}
            {myRegs.length > 0 && (
              <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-5 flex flex-col gap-3">
                <h2 className="font-bold text-[15px]">Status Pendaftaranmu</h2>
                {myRegs.map((r) => {
                  const meta = STATUS_META[r.status] || STATUS_META.registered;
                  return (
                    <div key={r.id} className="flex items-center justify-between gap-3 border-b border-[#2D2342] last:border-0 pb-3 last:pb-0">
                      <div className="flex flex-col">
                        <span className="text-[14px] font-semibold">Paket {r.package.name}</span>
                        <span className="text-[#9CA3AF] text-[12px]">
                          {r.package.requires_selection ? "Jalur seleksi (Mentee)" : "Jalur langsung"}
                        </span>
                      </div>
                      <span className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${meta.cls}`}>
                        {meta.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Daftar paket + benefit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {packages.map((pkg) => {
                const alreadyReg = registeredPackageIds.has(pkg.id);
                const locked = pkg.registration_status !== "open";
                const disabled = alreadyReg || locked;
                const selected = selectedPackageId === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => setSelectedPackageId(pkg.id)}
                    className={`text-left rounded-[14px] border p-5 flex flex-col gap-3 transition-colors ${
                      disabled
                        ? "border-[#2D2342] bg-[#170F26]/50 opacity-60 cursor-not-allowed"
                        : selected
                          ? "border-[#148F89] bg-[#148F89]/10"
                          : "border-[#2D2342] bg-[#170F26] hover:border-[#148F89]/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="font-bold text-[16px]">{pkg.name}</span>
                        {pkg.requires_selection && (
                          <span className="text-[#D1D83E] text-[11px] font-semibold flex items-center gap-1 mt-0.5">
                            <ShieldCheck size={12} /> Perlu seleksi
                          </span>
                        )}
                      </div>
                      {selected && !disabled && <Check size={18} className="text-[#148F89] shrink-0" />}
                      {locked && <Lock size={16} className="text-[#6B7280] shrink-0" />}
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-[#148F89] font-bold text-[20px]">{formatIDR(pkg.price)}</span>
                      {Number(pkg.commitment_fee) > 0 && (
                        <span className="text-[#9CA3AF] text-[11px]">
                          + {formatIDR(pkg.commitment_fee)} commitment fee
                        </span>
                      )}
                    </div>
                    {Number(pkg.commitment_fee) > 0 && (
                      <span className="text-[#9CA3AF] text-[11px] -mt-2 leading-relaxed">
                        Total {formatIDR(pkg.total_price)}, termasuk commitment fee {formatIDR(pkg.commitment_fee)}
                        yang dikembalikan penuh di akhir program. Dibayar nanti, hanya jika kamu dinyatakan lolos.
                      </span>
                    )}

                    <div className="flex flex-col gap-1.5 mt-1">
                      {pkg.benefits.map((b) => (
                        <span key={b.label} className={`text-[12px] flex items-center gap-2 ${b.included ? "text-[#E2E8F0]" : "text-[#6B7280]"}`}>
                          {b.included ? <Check size={13} className="text-[#148F89] shrink-0" /> : <X size={13} className="text-[#6B7280] shrink-0" />}
                          {b.label}
                        </span>
                      ))}
                    </div>

                    {alreadyReg && (
                      <span className="text-[11px] text-[#9CA3AF] italic mt-1">Kamu sudah mendaftar paket ini.</span>
                    )}
                    {!alreadyReg && pkg.registration_status === "not_open_yet" && (
                      <span className="text-[11px] text-[#F59E0B] italic mt-1">
                        Pendaftaran dibuka mulai {formatFullDate(pkg.registration_opens_at)}.
                      </span>
                    )}
                    {!alreadyReg && pkg.registration_status === "closed" && (
                      <span className="text-[11px] text-[#EF4444] italic mt-1">Pendaftaran paket ini sudah ditutup.</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-start gap-2.5 bg-[#148F89]/10 border border-[#148F89]/30 rounded-[10px] px-4 py-3">
              <Info size={15} className="text-[#148F89] shrink-0 mt-0.5" />
              <p className="text-[#E2E8F0] text-[12.5px] leading-relaxed">
                <span className="font-semibold text-white">Pendaftaran ini gratis.</span> Kamu belum perlu bayar
                apa pun sekarang. Pembayaran (termasuk commitment fee, khusus paket Mentee) baru dilakukan
                setelah kamu dinyatakan <span className="font-semibold text-white">lolos/diterima</span> ke
                tahap berikutnya.
              </p>
            </div>

            {/* Syarat + upload */}
            <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-5 flex flex-col gap-4">
              <div>
                <h2 className="font-bold text-[15px]">Syarat Pendaftaran</h2>
                <p className="text-[#9CA3AF] text-[12px] mt-1">
                  Gabungkan semua bukti berikut menjadi <span className="text-white font-medium">satu file PDF</span>, lalu unggah di bawah.
                </p>
              </div>
              <ol className="flex flex-col gap-2">
                {REQUIREMENTS.map((r, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[13px] text-[#E2E8F0]">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-[#148F89]/15 text-[#148F89] text-[11px] font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    {r}
                  </li>
                ))}
              </ol>

              <div className="mt-1 flex flex-col gap-1.5">
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#2D2342] rounded-[10px] py-6 cursor-pointer hover:border-[#148F89]/50 transition-colors">
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  {file ? (
                    <span className="flex items-center gap-2 text-[#148F89] text-[13px] font-semibold">
                      <FileText size={16} /> {file.name}
                    </span>
                  ) : (
                    <>
                      <Upload size={22} className="text-[#148F89]" />
                      <span className="text-[13px] font-semibold">Klik untuk unggah PDF</span>
                    </>
                  )}
                </label>
                <p className="text-[#6B7280] text-[11px] text-center">
                  Format PDF, ukuran file maksimal 10MB.
                </p>
              </div>

              {!selectedPackageId && (
                <p className="flex items-center gap-2 text-[#F59E0B] text-[12px]">
                  <AlertCircle size={13} /> Pilih paket dulu di atas.
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={!selectedPackageId || !file || submitting}
                className="w-full py-3 rounded-[8px] bg-[#148F89] text-white font-semibold text-[14px] hover:bg-[#117A75] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Mengirim..." : "Kirim Pendaftaran"}
              </button>
              <p className="flex items-center gap-2 text-[#6B7280] text-[11px]">
                <Clock size={12} /> Setelah dikirim, pendaftaran akan ditinjau admin. Pembayaran dilakukan setelah kamu diterima/di-ACC.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
