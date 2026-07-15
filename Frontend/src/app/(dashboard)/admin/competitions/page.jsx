"use client";

import {
  Plus,
  Download,
  ChevronDown,
  X,
  ImageIcon,
  PenLine,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/component/admin/DashboardLayout";
import StatCard from "@/component/admin/StatCard";
import EmptyState from "@/component/admin/EmptyState";
import Toast from "@/component/Toast";
import { api, ApiError } from "@/lib/api";

const STATUS_FILTERS = ["Semua", "Aktif", "Kedaluwarsa"];

// endpoint di-mount di urls.py lewat: path('api/programs/', include('programs.urls'))
const COMPETITIONS_PATH = "/api/programs";

const EMPTY_FORM = {
  title: "",
  organizer: "",
  category: "",
  level: "",
  event_date: "",
  deadline: "",
  target_participant: "",
  registration_fee: "",
  prizepool: "",
  registration_link: "",
  image_url: "",
};

// status turunan dari deadline vs sekarang, sama persis kayak logic di
// get_competition_summary (deadline__gt=now => aktif)
function getStatus(deadlineIso) {
  if (!deadlineIso) return "Aktif";
  return new Date(deadlineIso) > new Date() ? "Aktif" : "Kedaluwarsa";
}

function formatDate(iso) {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// yyyy-mm-dd buat value input type="date"
function toDateInputValue(iso) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function extractErrorMessage(err, fallback) {
  if (err instanceof ApiError) {
    if (err.data?.errors) {
      return Object.values(err.data.errors).flat().join(" ");
    }
    return err.message || fallback;
  }
  return fallback;
}

export default function Competitions() {
  const heightFix = `.adm-h-42 { height: 42px; } .adm-h-48 { height: 48px; }`;

  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [summary, setSummary] = useState({
    total: null,
    total_active: null,
    total_expired: null,
  });

  const [categories, setCategories] = useState([]);

  const [categoryFilter, setCategoryFilter] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState(null);

  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState(null);

  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState(null);

  const fetchCompetitions = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      // GET /api/programs/ nggak butuh auth (view-nya nggak di-decorate jwt_required)
      const data = await api.get(`${COMPETITIONS_PATH}/?page_size=100`, {
        auth: false,
      });
      setCompetitions(data?.competitions || []);
    } catch (err) {
      setLoadError(extractErrorMessage(err, "Gagal memuat data lomba."));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const data = await api.get(`${COMPETITIONS_PATH}/summary/`);
      if (data) setSummary(data);
    } catch {
      // fallback ke hitungan lokal, nggak perlu ganggu UI
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get(`${COMPETITIONS_PATH}/categories/`, {
        auth: false,
      });
      setCategories(res?.categories || []);
    } catch {
      setCategories([]);
    }
  }, []);

  const [toast, setToast] =useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  function showToast(type, title, message) {
    setToast({
      open: true,
      type,
      title,
      message,
    });
  }

  useEffect(() => {
    fetchCompetitions();
    fetchSummary();
    fetchCategories();
  }, [fetchCompetitions, fetchSummary, fetchCategories]);

  // Begitu daftar kategori kelar di-fetch, pastikan form Tambah selalu punya
  // kategori terpilih (default: kategori pertama). Kalau dibiarkan "",
  // <select> tetap nampilin opsi pertama secara visual (perilaku default
  // browser saat controlled value nggak cocok opsi manapun), tapi state-nya
  // tetap kosong sampai user benar-benar klik dropdown -- jadi payload yang
  // ke-submit berisi category: "" dan backend nolak dengan
  // "This field is required."
  useEffect(() => {
    if (categories.length === 0) return;
    setAddForm((prev) =>
      prev.category ? prev : { ...prev, category: String(categories[0].id) }
    );
  }, [categories]);

  useEffect(() => {
    document.body.style.overflow = isAddOpen || isEditOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isAddOpen, isEditOpen]);

  useEffect(() => {
    if (!selectedCompetition) return;
    setEditForm({
      title: selectedCompetition.title || "",
      organizer: selectedCompetition.organizer || "",
      category:
        selectedCompetition.category?.id != null
          ? String(selectedCompetition.category.id)
          : categories[0]
          ? String(categories[0].id)
          : "",
      level: selectedCompetition.level || "",
      event_date: toDateInputValue(selectedCompetition.date),
      deadline: toDateInputValue(selectedCompetition.deadline),
      target_participant: selectedCompetition.target || "",
      registration_fee: selectedCompetition.fee ?? "",
      prizepool: selectedCompetition.prize ?? "",
      registration_link: selectedCompetition.link || "",
      image_url: selectedCompetition.image || "",
    });
    setEditError(null);
  }, [selectedCompetition, categories]);

  const filtered = competitions.filter((c) => {
    const status = getStatus(c.deadline);
    const matchCategory =
      categoryFilter === "Semua" || c.category?.name === categoryFilter;
    const matchStatus = statusFilter === "Semua" || status === statusFilter;
    return matchCategory && matchStatus;
  });

  const totalCount = competitions.length;
  const activeCount = competitions.filter(
    (c) => getStatus(c.deadline) === "Aktif"
  ).length;
  const expiredCount = totalCount - activeCount;

  function buildPayload(form) {
    return {
      title: form.title,
      organizer: form.organizer,
      category: form.category,
      level: form.level || null,
      event_date: form.event_date || null,
      deadline: form.deadline || null,
      target_participant: form.target_participant || null,
      registration_fee:
        form.registration_fee !== "" ? Number(form.registration_fee) : null,
      prizepool: form.prizepool !== "" ? Number(form.prizepool) : null,
      registration_link: form.registration_link || null,
      image_url: form.image_url || null,
    };
  }

  function handleAddChange(e) {
    const { name, value } = e.target;
    setAddForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleAddSubmit(e) {
    e.preventDefault();
    setAddSubmitting(true);
    setAddError(null);

    try {
      const data = await api.post(
        `${COMPETITIONS_PATH}/add/`,
        buildPayload(addForm)
      );

      if (data === null) {
        showToast(
          "error",
          "Sesi Berakhir",
          "Silakan login kembali."
        );
        return;
      }

      setIsAddOpen(false);

      setAddForm({
        ...EMPTY_FORM,
        category: categories[0] ? String(categories[0].id) : "",
      });

      await Promise.all([
        fetchCompetitions(),
        fetchSummary(),
      ]);

      showToast(
        "success",
        "Lomba Berhasil Ditambahkan",
        `"${addForm.title}" berhasil dipublikasikan.`
      );
    } catch (err) {
      showToast(
        "error",
        "Gagal Menambahkan Lomba",
        extractErrorMessage(err, "Terjadi kesalahan.")
      );
    } finally {
      setAddSubmitting(false);
    }
  }

  async function handleEditSubmit(e) {
    e.preventDefault();

    if (!selectedCompetition) return;

    setEditSubmitting(true);
    setEditError(null);

    try {
      const data = await api.patch(
        `${COMPETITIONS_PATH}/${selectedCompetition.id}/`,
        buildPayload(editForm)
      );

      if (data === null) {
        showToast(
          "error",
          "Sesi Berakhir",
          "Silakan login kembali."
        );
        return;
      }

      setIsEditOpen(false);
      setSelectedCompetition(null);

      await Promise.all([
        fetchCompetitions(),
        fetchSummary(),
      ]);

      showToast(
        "success",
        "Perubahan Disimpan",
        `"${editForm.title}" berhasil diperbarui.`
      );
    } catch (err) {
      showToast(
        "error",
        "Gagal Memperbarui Lomba",
        extractErrorMessage(err, "Terjadi kesalahan.")
      );
    } finally {
      setEditSubmitting(false);
    }
  }

  function handleExportCsv() {
    const header = ["ID", "Judul", "Penyelenggara", "Kategori", "Deadline", "Status"];
    const rows = filtered.map((c) => [
      c.id,
      c.title,
      c.organizer,
      c.category?.name,
      formatDate(c.deadline),
      getStatus(c.deadline),
    ]);
    const csv = [header, ...rows]
      .map((row) =>
        row.map((field) => `"${String(field ?? "").replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "daftar-lomba.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <DashboardLayout title="Info Lomba">
      <style>{heightFix}</style>

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bold text-[22px] text-[#0F172A]">Info Lomba</h1>
          <p className="text-[#64748B] text-[14px] mt-1">
            Kelola informasi lomba yang tampil di halaman publik MARK-UP.
          </p>
        </div>
        <button
          onClick={() => {
            setAddError(null);
            setAddForm({
              ...EMPTY_FORM,
              category: categories[0] ? String(categories[0].id) : "",
            });
            setIsAddOpen(true);
          }}
          className="adm-h-42 flex items-center gap-2 px-5 rounded-[8px] bg-[#148F89] text-white text-[13px] font-semibold hover:bg-[#117A75] transition-colors"
        >
          <Plus size={16} />
          Lomba Baru
        </button>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <StatCard
          label="Total Lomba"
          value={summary.total ?? totalCount}
          unit="lomba"
        />
        <StatCard
          label="Aktif"
          value={summary.total_active ?? activeCount}
          unit="lomba"
          variant="primary"
        />
        <StatCard
          label="Kedaluwarsa"
          value={summary.total_expired ?? expiredCount}
          unit="lomba"
        />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-[16px] font-semibold text-[#0F172A]">
              Daftar Lomba
            </h2>
            <p className="text-[#64748B] text-[13px] mt-0.5">
              Seluruh lomba yang pernah dipublikasikan.
            </p>
          </div>
          <button
            onClick={handleExportCsv}
            className="adm-h-42 flex items-center gap-2 px-4 bg-[#F1F5F9] text-[13px] font-medium rounded-[8px] hover:bg-[#E2E8F0] transition-colors text-[#475569]"
          >
            <Download size={15} />
            Ekspor .CSV
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="adm-h-42 bg-[#F1F5F9] px-1.5 rounded-[8px] flex items-center gap-1 flex-wrap">
            {["Semua", ...categories.map((c) => c.name)].map((f) => (
              <button
                key={f}
                onClick={() => setCategoryFilter(f)}
                className={`px-3 py-2 rounded-[6px] font-medium text-[12.5px] transition-colors whitespace-nowrap ${categoryFilter === f ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B] hover:bg-white/60"}`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="adm-h-42 bg-[#F1F5F9] px-1.5 rounded-[8px] flex items-center gap-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-2 rounded-[6px] font-medium text-[12.5px] transition-colors ${statusFilter === f ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B] hover:bg-white/60"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-[#64748B] text-[13px]">
            <Loader2 size={16} className="animate-spin" />
            Memuat data lomba...
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center gap-3 py-16 text-[13px]">
            <p className="text-[#991B1B]">{loadError}</p>
            <button
              onClick={fetchCompetitions}
              className="px-4 py-2 bg-[#F1F5F9] rounded-[8px] text-[#475569] font-medium hover:bg-[#E2E8F0] transition-colors"
            >
              Coba lagi
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState message="Nggak ada lomba yang cocok sama filter ini." />
        ) : (
          <div className="rounded-[12px] overflow-hidden border border-[#E2E8F0] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-6 py-3.5 text-left font-bold text-[#64748B] tracking-wider text-[11px]">
                      ID
                    </th>
                    <th className="px-6 py-3.5 text-left font-bold text-[#64748B] tracking-wider text-[11px]">
                      JUDUL LOMBA
                    </th>
                    <th className="px-6 py-3.5 text-left font-bold text-[#64748B] tracking-wider text-[11px]">
                      PENYELENGGARA
                    </th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                      KATEGORI
                    </th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                      DEADLINE
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
                  {filtered.map((item) => {
                    const status = getStatus(item.deadline);
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-[#F8FAFC] transition-colors"
                      >
                        <td className="px-6 py-4 text-[#64748B] font-medium">
                          #{item.id?.slice(0, 6).toUpperCase()}
                        </td>
                        <td
                          className="px-6 py-4 text-[#1E293B] font-semibold"
                          style={{ maxWidth: "260px" }}
                        >
                          {item.title}
                        </td>
                        <td className="px-6 py-4 text-[#475569] font-medium">
                          {item.organizer}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex px-3 py-1.5 text-[11px] rounded-[6px] font-semibold bg-[#F1F5F9] text-[#475569]">
                            {item.category?.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-[#475569] font-medium whitespace-nowrap">
                          {formatDate(item.deadline)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex px-3 py-1.5 text-[11px] rounded-full font-bold ${status === "Aktif" ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#FEE2E2] text-[#991B1B]"}`}
                          >
                            {status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <PenLine
                              size={17}
                              onClick={() => {
                                setSelectedCompetition(item);
                                setIsEditOpen(true);
                              }}
                              className="cursor-pointer text-[#94A3B8] hover:text-[#148F89] transition-colors"
                            />
                            <ExternalLink
                              size={17}
                              onClick={() =>
                                item.link && window.open(item.link, "_blank")
                              }
                              className="cursor-pointer text-[#94A3B8] hover:text-[#148F89] transition-colors"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL TAMBAH --- */}
      {isAddOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setIsAddOpen(false)}
        />
      )}
      <form
        onSubmit={handleAddSubmit}
        style={{ width: "560px", maxWidth: "100%" }}
        className={`fixed top-0 right-0 h-screen bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out flex flex-col overflow-y-auto ${isAddOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="w-full shrink-0 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col justify-center px-8 py-6 gap-1">
          <div className="flex justify-between items-center">
            <p className="text-[#1E293B] text-[19px] font-bold">Lomba Baru</p>
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="p-2 hover:bg-[#E2E8F0] rounded-full transition-colors"
            >
              <X className="text-[#64748B]" size={20} />
            </button>
          </div>
          <p className="text-[#64748B] text-[13px]">
            Isi detail buat publikasikan lomba baru.
          </p>
        </div>

        <div className="px-8 py-6 flex flex-col gap-5">
          {addError && (
            <div className="px-4 py-3 rounded-[8px] bg-[#FEE2E2] text-[#991B1B] text-[13px] font-medium">
              {addError}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              URL Poster Lomba (opsional)
            </p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 shrink-0 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center">
                <ImageIcon size={18} className="text-[#94A3B8]" />
              </div>
              <input
                type="url"
                name="image_url"
                value={addForm.image_url}
                onChange={handleAddChange}
                placeholder="https://...poster.jpg"
                className="flex-1 adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Judul Lomba
            </p>
            <input
              type="text"
              name="title"
              value={addForm.title}
              onChange={handleAddChange}
              required
              placeholder="Masukkan judul lomba..."
              className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Penyelenggara
            </p>
            <input
              type="text"
              name="organizer"
              value={addForm.organizer}
              onChange={handleAddChange}
              required
              placeholder="Masukkan penyelenggara..."
              className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Kategori
            </p>
            <div className="relative w-full">
              <select
                name="category"
                value={addForm.category}
                onChange={handleAddChange}
                required
                disabled={categories.length === 0}
                className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 pr-10 appearance-none outline-none focus:border-[#148F89] transition-all text-[#1E293B] disabled:opacity-60"
              >
                {categories.length === 0 && (
                  <option value="">Memuat kategori...</option>
                )}
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={18}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Tingkat Lomba
            </p>
            <input
              type="text"
              name="level"
              value={addForm.level}
              onChange={handleAddChange}
              placeholder='"Surabaya", "Nasional", "Internasional"'
              className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
            />
          </div>

          <div className="flex gap-4 w-full">
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
                Tanggal Event
              </p>
              <input
                type="date"
                name="event_date"
                value={addForm.event_date}
                onChange={handleAddChange}
                className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
              />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
                Deadline Pendaftaran
              </p>
              <input
                type="date"
                name="deadline"
                value={addForm.deadline}
                onChange={handleAddChange}
                required
                className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Target Peserta
            </p>
            <input
              type="text"
              name="target_participant"
              value={addForm.target_participant}
              onChange={handleAddChange}
              placeholder='"Mahasiswa Aktif S1", "Siswa SMA"'
              className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
            />
          </div>

          <div className="flex gap-4 w-full">
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
                Biaya Pendaftaran (Rp)
              </p>
              <input
                type="number"
                name="registration_fee"
                value={addForm.registration_fee}
                onChange={handleAddChange}
                placeholder="0"
                className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
              />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
                Total Hadiah / Prizepool (Rp)
              </p>
              <input
                type="number"
                name="prizepool"
                value={addForm.prizepool}
                onChange={handleAddChange}
                placeholder="Kalau ada"
                className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Link Pendaftaran
            </p>
            <input
              type="url"
              name="registration_link"
              value={addForm.registration_link}
              onChange={handleAddChange}
              placeholder="https://..."
              className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
            />
          </div>
        </div>

        <div className="mt-auto p-6 bg-white border-t border-[#E2E8F0] flex gap-3">
          <button
            type="button"
            onClick={() => setIsAddOpen(false)}
            className="flex-1 py-3 bg-white border border-[#E2E8F0] text-[#475569] font-bold rounded-[8px] hover:bg-[#F8FAFC] transition-colors"
          >
            Batalkan
          </button>
          <button
            type="submit"
            disabled={addSubmitting}
            className="flex-1 py-3 bg-[#148F89] text-white font-bold rounded-[8px] hover:bg-[#117A75] transition-colors disabled:opacity-60"
          >
            {addSubmitting ? "Menyimpan..." : "Publikasikan"}
          </button>
        </div>
      </form>

      {/* --- MODAL EDIT --- */}
      {isEditOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setIsEditOpen(false)}
        />
      )}
      <form
        onSubmit={handleEditSubmit}
        style={{ width: "560px", maxWidth: "100%" }}
        className={`fixed top-0 right-0 h-screen bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out flex flex-col overflow-y-auto ${isEditOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="w-full shrink-0 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col justify-center px-8 py-6 gap-1">
          <div className="flex justify-between items-center">
            <p className="text-[#1E293B] text-[19px] font-bold">Edit Lomba</p>
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="p-2 hover:bg-[#E2E8F0] rounded-full transition-colors"
            >
              <X className="text-[#64748B]" size={20} />
            </button>
          </div>
          <p className="text-[#64748B] text-[13px]">
            Ubah detail {selectedCompetition?.title || "lomba terpilih"}.
          </p>
        </div>

        <div className="px-8 py-6 flex flex-col gap-5">
          {editError && (
            <div className="px-4 py-3 rounded-[8px] bg-[#FEE2E2] text-[#991B1B] text-[13px] font-medium">
              {editError}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Judul Lomba
            </p>
            <input
              type="text"
              name="title"
              value={editForm.title}
              onChange={handleEditChange}
              required
              className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
            />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Penyelenggara
            </p>
            <input
              type="text"
              name="organizer"
              value={editForm.organizer}
              onChange={handleEditChange}
              required
              className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
            />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Kategori
            </p>
            <div className="relative w-full">
              <select
                name="category"
                value={editForm.category}
                onChange={handleEditChange}
                required
                disabled={categories.length === 0}
                className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 pr-10 appearance-none outline-none focus:border-[#148F89] transition-all text-[#1E293B] disabled:opacity-60"
              >
                {categories.length === 0 && (
                  <option value="">Memuat kategori...</option>
                )}
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={18}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Tanggal Event
            </p>
            <input
              type="date"
              name="event_date"
              value={editForm.event_date}
              onChange={handleEditChange}
              className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
            />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Deadline Pendaftaran
            </p>
            <input
              type="date"
              name="deadline"
              value={editForm.deadline}
              onChange={handleEditChange}
              required
              className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
            />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Link Pendaftaran
            </p>
            <input
              type="url"
              name="registration_link"
              value={editForm.registration_link}
              onChange={handleEditChange}
              className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
            />
          </div>
        </div>

        <div className="mt-auto p-6 bg-white border-t border-[#E2E8F0] flex gap-3">
          <button
            type="button"
            onClick={() => setIsEditOpen(false)}
            className="flex-1 py-3 bg-white border border-[#E2E8F0] text-[#475569] font-bold rounded-[8px] hover:bg-[#F8FAFC] transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={editSubmitting}
            className="flex-1 py-3 bg-[#148F89] text-white font-bold rounded-[8px] hover:bg-[#117A75] transition-colors disabled:opacity-60"
          >
            {editSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>
      <Toast
        open={toast.open}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={() =>
          setToast((prev) => ({
            ...prev,
            open: false,
          }))
        }
      />
    </DashboardLayout>
  );
}