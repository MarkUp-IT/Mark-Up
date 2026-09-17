"use client";

import { Send, Users, ChevronDown, AlertTriangle, X, History } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import EmptyState from "@/component/admin/EmptyState";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";

const FILTER_LABELS = {
  ALL: "Semua User",
  ROLE: "Per Role",
  BOUGHT_PRODUCT: "Sudah Beli Produk Ini",
  BOOTCAMP_REGISTERED: "Sudah Daftar Bootcamp Ini",
  MANUAL: "Daftar Email Manual",
};

const ROLE_OPTIONS = [
  { value: "STUDENT", label: "Mentee" },
  { value: "MENTOR", label: "Mentor" },
  { value: "ADMIN", label: "Admin" },
];

const BOOTCAMP_STATUS_OPTIONS = [
  { value: "", label: "Semua Status" },
  { value: "registered", label: "Menunggu Ditinjau" },
  { value: "accepted", label: "Diterima" },
  { value: "rejected", label: "Ditolak" },
];

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

const inputCls =
  "w-full h-[42px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B] text-[13.5px]";

export default function BroadcastEmailPage() {
  const [filterType, setFilterType] = useState("ALL");
  const [role, setRole] = useState("STUDENT");
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState("");
  const [bootcampId, setBootcampId] = useState("");
  const [bootcampStatus, setBootcampStatus] = useState("");
  const [manualEmails, setManualEmails] = useState("");

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [preview, setPreview] = useState(null); // {count, sample_emails}
  const [checking, setChecking] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const bootcampProducts = products.filter((p) => p.type === "BOOTCAMP");

  useEffect(() => {
    apiRequest("/api/products/?all=true", { auth: false })
      .then((res) => setProducts(res?.products || []))
      .catch(console.error);
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await apiRequest("/api/accounts/broadcast-email/history/");
      setHistory(res?.broadcasts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Ganti filter -> preview lama gak relevan lagi, jangan sampai admin
  // ngirim berdasarkan angka dari filter SEBELUMNYA yang keliatan masih nempel.
  useEffect(() => {
    setPreview(null);
  }, [filterType, role, productId, bootcampId, bootcampStatus, manualEmails]);

  const buildFilterParams = () => {
    if (filterType === "ROLE") return { role };
    if (filterType === "BOUGHT_PRODUCT") return { product_id: productId };
    if (filterType === "BOOTCAMP_REGISTERED") return { bootcamp_id: bootcampId, status: bootcampStatus || undefined };
    if (filterType === "MANUAL") {
      return { emails: manualEmails.split(/[\n,]/).map((e) => e.trim()).filter(Boolean) };
    }
    return {};
  };

  const buildFilterSummary = () => {
    if (filterType === "ROLE") return `Role: ${ROLE_OPTIONS.find((r) => r.value === role)?.label || role}`;
    if (filterType === "BOUGHT_PRODUCT") {
      const p = products.find((x) => x.id === productId);
      return `Sudah beli: ${p?.title || "(produk tidak ditemukan)"}`;
    }
    if (filterType === "BOOTCAMP_REGISTERED") {
      const p = products.find((x) => x.id === bootcampId);
      const statusLabel = BOOTCAMP_STATUS_OPTIONS.find((s) => s.value === bootcampStatus)?.label || "Semua Status";
      return `Daftar bootcamp: ${p?.title || "(bootcamp tidak ditemukan)"} -- ${statusLabel}`;
    }
    if (filterType === "MANUAL") return "Daftar email manual";
    return "Semua User";
  };

  const isFilterReady = () => {
    if (filterType === "BOUGHT_PRODUCT") return Boolean(productId);
    if (filterType === "BOOTCAMP_REGISTERED") return Boolean(bootcampId);
    if (filterType === "MANUAL") return manualEmails.trim().length > 0;
    return true;
  };

  const handleCheckRecipients = async () => {
    if (!isFilterReady()) {
      toast.error("Lengkapi filter dulu", { description: "Pilih produk/bootcamp/email sebelum cek jumlah penerima." });
      return;
    }
    setChecking(true);
    try {
      const res = await apiRequest("/api/accounts/broadcast-email/preview/", {
        method: "POST",
        body: { filter_type: filterType, filter_params: buildFilterParams() },
      });
      setPreview(res);
    } catch (err) {
      toast.error("Gagal cek penerima", { description: err?.message || "Coba lagi." });
    } finally {
      setChecking(false);
    }
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await apiRequest("/api/accounts/broadcast-email/send/", {
        method: "POST",
        body: {
          filter_type: filterType,
          filter_params: buildFilterParams(),
          filter_summary: buildFilterSummary(),
          subject: subject.trim(),
          message: message.trim(),
        },
      });
      toast.success("Email Terkirim", { description: res?.detail || "Berhasil dikirim." });
      setConfirmOpen(false);
      setSubject("");
      setMessage("");
      setPreview(null);
      fetchHistory();
    } catch (err) {
      toast.error("Gagal Mengirim", { description: err?.message || "Coba lagi." });
    } finally {
      setSending(false);
    }
  };

  const canOpenConfirm = subject.trim() && message.trim() && preview && preview.count > 0;

  return (
    <>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bold text-[22px] text-[#0F172A]">Kirim Email</h1>
          <p className="text-[#64748B] text-[14px] mt-1">
            Kirim email ke banyak (atau satu) user sekaligus, disaring pakai filter di bawah.
          </p>
        </div>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 flex flex-col gap-5">
        <h2 className="text-[16px] font-semibold text-[#0F172A]">1. Pilih Penerima</h2>

        <div className="flex flex-col gap-2">
          <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">Filter</p>
          <div className="relative w-full max-w-md">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`${inputCls} appearance-none pr-10`}
            >
              {Object.entries(FILTER_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
          </div>
        </div>

        {filterType === "ROLE" && (
          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">Role</p>
            <div className="relative w-full max-w-md">
              <select value={role} onChange={(e) => setRole(e.target.value)} className={`${inputCls} appearance-none pr-10`}>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
            </div>
          </div>
        )}

        {filterType === "BOUGHT_PRODUCT" && (
          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">Produk</p>
            <div className="relative w-full max-w-md">
              <select value={productId} onChange={(e) => setProductId(e.target.value)} className={`${inputCls} appearance-none pr-10`}>
                <option value="">-- Pilih Produk --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
            </div>
          </div>
        )}

        {filterType === "BOOTCAMP_REGISTERED" && (
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">Bootcamp</p>
              <div className="relative w-full">
                <select value={bootcampId} onChange={(e) => setBootcampId(e.target.value)} className={`${inputCls} appearance-none pr-10`}>
                  <option value="">-- Pilih Bootcamp --</option>
                  {bootcampProducts.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
              </div>
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">Status Pendaftaran</p>
              <div className="relative w-full">
                <select value={bootcampStatus} onChange={(e) => setBootcampStatus(e.target.value)} className={`${inputCls} appearance-none pr-10`}>
                  {BOOTCAMP_STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {filterType === "MANUAL" && (
          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Daftar Email (satu per baris, atau pisah koma)
            </p>
            <textarea
              rows={4}
              value={manualEmails}
              onChange={(e) => setManualEmails(e.target.value)}
              placeholder={"contoh1@email.com\ncontoh2@email.com"}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 py-3 outline-none focus:border-[#148F89] transition-all text-[#1E293B] text-[13.5px] resize-none"
            />
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={handleCheckRecipients}
            disabled={checking || !isFilterReady()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#F1F5F9] text-[#334155] font-semibold text-[13px] hover:bg-[#E2E8F0] transition-colors disabled:opacity-50"
          >
            <Users size={15} />
            {checking ? "Mengecek..." : "Cek Jumlah Penerima"}
          </button>
          {preview && (
            <span className={`text-[13px] font-semibold ${preview.count > 0 ? "text-[#148F89]" : "text-[#EF4444]"}`}>
              {preview.count > 0
                ? `${preview.count} penerima cocok dengan filter ini`
                : "Gak ada penerima yang cocok dengan filter ini"}
            </span>
          )}
        </div>

        {preview && preview.sample_emails?.length > 0 && (
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 py-3">
            <p className="text-[#64748B] text-[11px] uppercase font-bold tracking-wider mb-1.5">
              Contoh Penerima {preview.count > preview.sample_emails.length ? `(10 dari ${preview.count})` : ""}
            </p>
            <p className="text-[#334155] text-[12.5px] leading-relaxed">{preview.sample_emails.join(", ")}</p>
          </div>
        )}
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 flex flex-col gap-5">
        <h2 className="text-[16px] font-semibold text-[#0F172A]">2. Tulis Email</h2>
        <div className="flex flex-col gap-2">
          <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">Subjek</p>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subjek email"
            className={inputCls}
          />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">Isi Pesan</p>
          <textarea
            rows={8}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tulis isi email di sini..."
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 py-3 outline-none focus:border-[#148F89] transition-all text-[#1E293B] text-[13.5px] resize-none"
          />
        </div>

        <button
          onClick={() => setConfirmOpen(true)}
          disabled={!canOpenConfirm}
          className="self-start flex items-center gap-2 px-5 py-2.5 rounded-[8px] bg-[#148F89] text-white font-bold text-[13px] hover:bg-[#117A75] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={15} />
          Kirim Email
        </button>
        {!preview && (
          <p className="text-[#94A3B8] text-[11.5px] -mt-3">
            Cek jumlah penerima dulu sebelum bisa kirim.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-[16px] font-semibold text-[#0F172A] flex items-center gap-2">
          <History size={17} /> Riwayat Pengiriman
        </h2>
        {!loadingHistory && history.length === 0 ? (
          <EmptyState message="Belum ada email broadcast yang dikirim." />
        ) : (
          <div className="rounded-[12px] overflow-hidden border border-[#E2E8F0] shadow-sm bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] text-left">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-6 py-3.5 font-bold text-[#64748B] text-[11px] tracking-wider uppercase">SUBJEK</th>
                    <th className="px-6 py-3.5 font-bold text-[#64748B] text-[11px] tracking-wider uppercase">FILTER</th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] text-[11px] tracking-wider uppercase" style={{ width: "110px" }}>PENERIMA</th>
                    <th className="px-6 py-3.5 font-bold text-[#64748B] text-[11px] tracking-wider uppercase" style={{ width: "140px" }}>ADMIN</th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] text-[11px] tracking-wider uppercase" style={{ width: "150px" }}>TANGGAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {history.map((b) => (
                    <tr key={b.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-6 py-4 align-top font-semibold text-[#1E293B]">{b.subject}</td>
                      <td className="px-6 py-4 align-top text-[#64748B] text-[12.5px]">{b.filter_summary || FILTER_LABELS[b.filter_type]}</td>
                      <td className="px-6 py-4 align-top text-center text-[#1E293B] font-semibold">{b.recipient_count}</td>
                      <td className="px-6 py-4 align-top text-[#64748B] text-[12.5px]">{b.admin_name}</td>
                      <td className="px-6 py-4 align-top text-center text-[#64748B] text-[12px] whitespace-nowrap">{formatDate(b.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !sending && setConfirmOpen(false)} />
          <div style={{ width: "460px", maxWidth: "100%" }} className="relative bg-white rounded-[12px] shadow-2xl z-10 p-6 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F59E0B]/10 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-[#F59E0B]" />
              </div>
              <div>
                <p className="text-[#0F172A] font-bold text-[15px]">Kirim email ke {preview?.count} orang?</p>
                <p className="text-[#64748B] text-[12.5px] mt-1">
                  Aksi ini gak bisa dibatalkan setelah dikirim. Pastikan subjek, isi pesan, dan filter penerima sudah benar.
                </p>
              </div>
              <button onClick={() => !sending && setConfirmOpen(false)} className="ml-auto text-[#94A3B8] hover:text-[#0F172A]">
                <X size={18} />
              </button>
            </div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-3.5">
              <p className="text-[#334155] font-semibold text-[13px]">{subject}</p>
              <p className="text-[#64748B] text-[12px] mt-1 line-clamp-3 whitespace-pre-line">{message}</p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={sending}
                className="px-4 py-2.5 bg-white border border-[#E2E8F0] text-[#475569] font-bold text-[13px] rounded-[8px] hover:bg-[#F1F5F9] transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="px-4 py-2.5 bg-[#148F89] text-white font-bold text-[13px] rounded-[8px] hover:bg-[#117A75] transition-colors disabled:opacity-60"
              >
                {sending ? "Mengirim..." : `Ya, Kirim ke ${preview?.count} Orang`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
