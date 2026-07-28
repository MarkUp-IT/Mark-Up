"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Pencil, Check, X, Lock, Clock } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/formErrors";

// ISO (UTC di server) -> "YYYY-MM-DDTHH:mm" WIB, format buat datetime-local.
function toWIBLocalInputValue(dateStr) {
  if (!dateStr) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date(dateStr));
  const get = (type) => parts.find((p) => p.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateTimeWIB(dateStr) {
  if (!dateStr) return "Tanpa batas";
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta",
  }) + " WIB";
}

const STATUS_META = {
  open: { label: "Terbuka", cls: "bg-[#DCFCE7] text-[#166534]" },
  not_open_yet: { label: "Belum Dibuka", cls: "bg-[#FEF3C7] text-[#92400E]" },
  closed: { label: "Ditutup", cls: "bg-[#FEE2E2] text-[#991B1B]" },
};

export default function BootcampTimelinePanel({ productId }) {
  const [timeline, setTimeline] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({ title: "", start_date: "", end_date: "" });
  const [savingMilestone, setSavingMilestone] = useState(false);
  const [editingMilestoneId, setEditingMilestoneId] = useState(null);

  const [editingPackageId, setEditingPackageId] = useState(null);
  const [packageForm, setPackageForm] = useState({
    registration_opens_at: "", registration_closes_at: "", payment_deadline_at: "",
    requires_selection: false, selection_quota: "",
    quiz_duration_minutes: "", quiz_passing_score_percent: "",
    name: "", price: "", commitment_fee: "", min_attendance_sessions: "",
    benefits: {},
  });
  const [savingPackage, setSavingPackage] = useState(false);

  const [showAddPackage, setShowAddPackage] = useState(false);
  const [newPackageForm, setNewPackageForm] = useState({
    name: "", price: "", commitment_fee: "", requires_selection: false,
  });
  const [savingNewPackage, setSavingNewPackage] = useState(false);
  const [extraBenefitDraft, setExtraBenefitDraft] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [timelineRes, packagesRes] = await Promise.all([
        apiRequest(`/api/products/${productId}/timeline/`, { auth: false }),
        apiRequest(`/api/products/${productId}/packages/`, { auth: false }),
      ]);
      setTimeline(timelineRes?.timeline || []);
      setPackages(packagesRes?.packages || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openAddMilestone = () => {
    setEditingMilestoneId(null);
    setMilestoneForm({ title: "", start_date: "", end_date: "" });
    setShowAddMilestone(true);
  };

  const openEditMilestone = (item) => {
    setEditingMilestoneId(item.id);
    setMilestoneForm({ title: item.title, start_date: item.start_date, end_date: item.end_date || "" });
    setShowAddMilestone(true);
  };

  const handleSaveMilestone = async () => {
    if (!milestoneForm.title.trim() || !milestoneForm.start_date || savingMilestone) return;
    setSavingMilestone(true);
    try {
      const body = {
        title: milestoneForm.title.trim(),
        start_date: milestoneForm.start_date,
        end_date: milestoneForm.end_date || null,
      };
      if (editingMilestoneId) {
        await apiRequest(`/api/products/bootcamp-timeline/${editingMilestoneId}/`, { method: "PATCH", body });
      } else {
        await apiRequest(`/api/products/${productId}/timeline/add/`, { method: "POST", body });
      }
      toast.success("Milestone Tersimpan");
      setShowAddMilestone(false);
      fetchData();
    } catch (err) {
      toast.error("Gagal Menyimpan Milestone", { description: extractErrorMessage(err, "Terjadi kesalahan.") });
    } finally {
      setSavingMilestone(false);
    }
  };

  const handleDeleteMilestone = async (id) => {
    if (!confirm("Hapus milestone ini?")) return;
    try {
      await apiRequest(`/api/products/bootcamp-timeline/${id}/`, { method: "DELETE" });
      toast.success("Milestone Dihapus");
      fetchData();
    } catch (err) {
      toast.error("Gagal Menghapus Milestone", { description: extractErrorMessage(err, "Terjadi kesalahan.") });
    }
  };

  const openEditPackage = (pkg) => {
    setEditingPackageId(pkg.id);
    const benefits = {};
    (pkg.benefits || []).forEach((b) => { benefits[b.key] = b.included; });
    setPackageForm({
      registration_opens_at: toWIBLocalInputValue(pkg.registration_opens_at),
      registration_closes_at: toWIBLocalInputValue(pkg.registration_closes_at),
      payment_deadline_at: toWIBLocalInputValue(pkg.payment_deadline_at),
      requires_selection: Boolean(pkg.requires_selection),
      selection_quota: pkg.selection_quota ?? "",
      quiz_duration_minutes: pkg.quiz_duration_minutes ?? 30,
      quiz_passing_score_percent: pkg.quiz_passing_score_percent ?? 70,
      name: pkg.name || "",
      price: pkg.price ?? "",
      commitment_fee: pkg.commitment_fee ?? "",
      min_attendance_sessions: pkg.min_attendance_sessions ?? 0,
      benefits,
    });
  };

  const toggleBenefit = (key) => {
    setPackageForm((f) => ({ ...f, benefits: { ...f.benefits, [key]: !f.benefits[key] } }));
  };

  const handleAddPackage = async () => {
    if (savingNewPackage || !newPackageForm.name.trim()) return;
    setSavingNewPackage(true);
    try {
      await apiRequest(`/api/products/${productId}/packages/add/`, {
        method: "POST",
        body: {
          name: newPackageForm.name.trim(),
          price: Number(newPackageForm.price) || 0,
          commitment_fee: Number(newPackageForm.commitment_fee) || 0,
          requires_selection: newPackageForm.requires_selection,
        },
      });
      toast.success("Paket Dibuat");
      setShowAddPackage(false);
      setNewPackageForm({ name: "", price: "", commitment_fee: "", requires_selection: false });
      fetchData();
    } catch (err) {
      toast.error("Gagal Membuat Paket", { description: extractErrorMessage(err, "Terjadi kesalahan.") });
    } finally {
      setSavingNewPackage(false);
    }
  };

  const handleDeletePackage = async (pkg) => {
    if (!confirm(`Hapus paket "${pkg.name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      await apiRequest(`/api/products/bootcamp-packages/${pkg.id}/delete/`, { method: "DELETE" });
      toast.success("Paket Dihapus");
      fetchData();
    } catch (err) {
      // Backend nolak kalau paketnya udah punya pendaftar/pembelian -- pesannya
      // udah menjelaskan alasannya, jadi tampilin apa adanya.
      toast.error("Gagal Menghapus Paket", { description: extractErrorMessage(err, "Terjadi kesalahan.") });
    }
  };

  const handleAddExtraBenefit = async (pkgId) => {
    const label = (extraBenefitDraft[pkgId] || "").trim();
    if (!label) return;
    try {
      await apiRequest(`/api/products/bootcamp-packages/${pkgId}/extra-benefits/add/`, {
        method: "POST",
        body: { label },
      });
      setExtraBenefitDraft((d) => ({ ...d, [pkgId]: "" }));
      fetchData();
    } catch (err) {
      toast.error("Gagal Menambah Benefit", { description: extractErrorMessage(err, "Terjadi kesalahan.") });
    }
  };

  const handleDeleteExtraBenefit = async (benefitId) => {
    try {
      await apiRequest(`/api/products/bootcamp-extra-benefits/${benefitId}/`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      toast.error("Gagal Menghapus Benefit", { description: extractErrorMessage(err, "Terjadi kesalahan.") });
    }
  };

  const handleSavePackage = async () => {
    if (savingPackage) return;
    setSavingPackage(true);
    try {
      const body = {
        registration_opens_at: packageForm.registration_opens_at || null,
        registration_closes_at: packageForm.registration_closes_at || null,
        payment_deadline_at: packageForm.payment_deadline_at || null,
        name: packageForm.name.trim(),
        price: Number(packageForm.price) || 0,
        commitment_fee: Number(packageForm.commitment_fee) || 0,
        requires_selection: packageForm.requires_selection,
        benefits: packageForm.benefits,
      };
      if (packageForm.requires_selection) {
        body.selection_quota = packageForm.selection_quota === "" ? null : Number(packageForm.selection_quota) || null;
        body.quiz_duration_minutes = Number(packageForm.quiz_duration_minutes) || 30;
        body.quiz_passing_score_percent = Number(packageForm.quiz_passing_score_percent) || 0;
      } else {
        body.selection_quota = null;
      }
      if (Number(packageForm.commitment_fee) > 0) {
        body.min_attendance_sessions = Number(packageForm.min_attendance_sessions) || 0;
      }
      await apiRequest(`/api/products/bootcamp-packages/${editingPackageId}/`, {
        method: "PATCH",
        body,
      });
      toast.success("Paket Tersimpan");
      setEditingPackageId(null);
      fetchData();
    } catch (err) {
      toast.error("Gagal Menyimpan", { description: extractErrorMessage(err, "Terjadi kesalahan.") });
    } finally {
      setSavingPackage(false);
    }
  };

  if (loading) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Timeline utama */}
      <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-[15px] text-[#0F172A]">Timeline Utama</h2>
          <button
            onClick={openAddMilestone}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#148F89] text-white text-[12px] font-semibold hover:bg-[#117A75] transition-colors"
          >
            <Plus size={13} /> Tambah
          </button>
        </div>

        {timeline.length === 0 ? (
          <p className="text-[#94A3B8] text-[12.5px] italic">Belum ada milestone. Tambahkan garis waktu utama program ini.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {timeline.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-[8px] border border-[#E2E8F0]">
                <div className="flex flex-col min-w-0">
                  <span className="text-[#1E293B] font-medium text-[13px] truncate">{item.title}</span>
                  <span className="text-[#64748B] text-[11.5px]">
                    {formatDate(item.start_date)}
                    {item.end_date && item.end_date !== item.start_date ? ` – ${formatDate(item.end_date)}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => openEditMilestone(item)} className="p-1.5 rounded-[6px] text-[#64748B] hover:text-[#148F89] hover:bg-[#148F89]/5 transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDeleteMilestone(item.id)} className="p-1.5 rounded-[6px] text-[#DC2626] hover:bg-red-50 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showAddMilestone && (
          <div className="flex flex-col gap-2.5 p-3.5 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0]">
            <input
              type="text"
              placeholder="Judul milestone, mis. Pendaftaran Mentee"
              value={milestoneForm.title}
              onChange={(e) => setMilestoneForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full bg-white border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
            />
            <div className="flex gap-2">
              <input
                type="date"
                value={milestoneForm.start_date}
                onChange={(e) => setMilestoneForm((f) => ({ ...f, start_date: e.target.value }))}
                className="flex-1 bg-white border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
              />
              <input
                type="date"
                placeholder="Tanggal selesai (opsional)"
                value={milestoneForm.end_date}
                min={milestoneForm.start_date || undefined}
                onChange={(e) => setMilestoneForm((f) => ({ ...f, end_date: e.target.value }))}
                className="flex-1 bg-white border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddMilestone(false)}
                className="flex-1 h-9 rounded-[6px] border border-[#E2E8F0] text-[#64748B] text-[12.5px] font-semibold hover:bg-white transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveMilestone}
                disabled={!milestoneForm.title.trim() || !milestoneForm.start_date || savingMilestone}
                className="flex-1 h-9 rounded-[6px] bg-[#148F89] text-white text-[12.5px] font-semibold hover:bg-[#117A75] transition-colors disabled:opacity-50"
              >
                {savingMilestone ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Jendela pendaftaran per paket */}
      <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-[15px] text-[#0F172A]">Jendela Pendaftaran Paket</h2>
          <button
            onClick={() => setShowAddPackage((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#148F89] text-white text-[12px] font-semibold hover:bg-[#117A75] transition-colors"
          >
            <Plus size={13} /> Tambah Paket
          </button>
        </div>

        {showAddPackage && (
          <div className="flex flex-col gap-2.5 p-3.5 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0]">
            <input
              type="text"
              placeholder="Nama paket baru, mis. Kelas Alumni"
              value={newPackageForm.name}
              onChange={(e) => setNewPackageForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full bg-white border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
            />
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                placeholder="Harga (Rp)"
                value={newPackageForm.price}
                onChange={(e) => setNewPackageForm((f) => ({ ...f, price: e.target.value }))}
                className="flex-1 bg-white border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
              />
              <input
                type="number"
                min={0}
                placeholder="Commitment fee (Rp)"
                value={newPackageForm.commitment_fee}
                onChange={(e) => setNewPackageForm((f) => ({ ...f, commitment_fee: e.target.value }))}
                className="flex-1 bg-white border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
              />
            </div>
            <label className="flex items-center gap-2 text-[12.5px] text-[#1E293B] cursor-pointer">
              <input
                type="checkbox"
                checked={newPackageForm.requires_selection}
                onChange={(e) => setNewPackageForm((f) => ({ ...f, requires_selection: e.target.checked }))}
                className="accent-[#148F89]"
              />
              Butuh Seleksi (Tes BCC)?
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddPackage(false)}
                className="flex-1 h-9 rounded-[6px] border border-[#E2E8F0] text-[#64748B] text-[12.5px] font-semibold hover:bg-white transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleAddPackage}
                disabled={!newPackageForm.name.trim() || savingNewPackage}
                className="flex-1 h-9 rounded-[6px] bg-[#148F89] text-white text-[12.5px] font-semibold hover:bg-[#117A75] transition-colors disabled:opacity-50"
              >
                {savingNewPackage ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        )}

        {packages.length === 0 ? (
          <p className="text-[#94A3B8] text-[12.5px] italic">Belum ada paket.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {packages.map((pkg) => {
              const meta = STATUS_META[pkg.registration_status] || STATUS_META.open;
              const isEditing = editingPackageId === pkg.id;
              return (
                <div key={pkg.id} className="flex flex-col gap-2 px-3.5 py-2.5 rounded-[8px] border border-[#E2E8F0]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[#1E293B] font-semibold text-[13px]">{pkg.name}</span>
                      {pkg.requires_selection && <Lock size={11} className="text-[#B45309]" />}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold ${meta.cls}`}>{meta.label}</span>
                      {!isEditing && (
                        <>
                          <button onClick={() => openEditPackage(pkg)} className="p-1.5 rounded-[6px] text-[#64748B] hover:text-[#148F89] hover:bg-[#148F89]/5 transition-colors">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => handleDeletePackage(pkg)} className="p-1.5 rounded-[6px] text-[#DC2626] hover:bg-red-50 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {!isEditing ? (
                    <>
                      <p className="text-[#64748B] text-[11.5px] flex items-center gap-1.5">
                        <Clock size={11} className="shrink-0" />
                        {formatDateTimeWIB(pkg.registration_opens_at)} s.d. {formatDateTimeWIB(pkg.registration_closes_at)}
                      </p>
                      {pkg.requires_selection && (
                        <>
                          <p className="text-[#64748B] text-[11.5px]">
                            Tes BCC: {pkg.quiz_duration_minutes} menit, lulus ≥ {pkg.quiz_passing_score_percent}%
                          </p>
                          <p className="text-[#64748B] text-[11.5px]">
                            {pkg.selection_quota
                              ? `${pkg.accepted_count}/${pkg.selection_quota} diterima`
                              : `${pkg.accepted_count} diterima (gak ada kuota)`}
                          </p>
                        </>
                      )}
                      {pkg.payment_deadline_at && (
                        <p className="text-[#64748B] text-[11.5px]">
                          Batas bayar: {formatDateTimeWIB(pkg.payment_deadline_at)}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[#64748B] text-[10.5px] font-semibold uppercase">Nama Paket</label>
                        <input
                          type="text"
                          value={packageForm.name}
                          onChange={(e) => setPackageForm((f) => ({ ...f, name: e.target.value }))}
                          className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
                        />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 flex flex-col gap-1">
                          <label className="text-[#64748B] text-[10.5px] font-semibold uppercase">Harga (Rp)</label>
                          <input
                            type="number"
                            min={0}
                            value={packageForm.price}
                            onChange={(e) => setPackageForm((f) => ({ ...f, price: e.target.value }))}
                            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
                          />
                        </div>
                        <div className="flex-1 flex flex-col gap-1">
                          <label className="text-[#64748B] text-[10.5px] font-semibold uppercase">Commitment Fee (Rp)</label>
                          <input
                            type="number"
                            min={0}
                            value={packageForm.commitment_fee}
                            onChange={(e) => setPackageForm((f) => ({ ...f, commitment_fee: e.target.value }))}
                            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[#64748B] text-[10.5px] font-semibold uppercase">Buka</label>
                        <input
                          type="datetime-local"
                          value={packageForm.registration_opens_at}
                          onChange={(e) => setPackageForm((f) => ({ ...f, registration_opens_at: e.target.value }))}
                          style={{ colorScheme: "light" }}
                          className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[#64748B] text-[10.5px] font-semibold uppercase">Tutup</label>
                        <input
                          type="datetime-local"
                          value={packageForm.registration_closes_at}
                          onChange={(e) => setPackageForm((f) => ({ ...f, registration_closes_at: e.target.value }))}
                          style={{ colorScheme: "light" }}
                          className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[#64748B] text-[10.5px] font-semibold uppercase">Batas Waktu Bayar (setelah Diterima)</label>
                        <input
                          type="datetime-local"
                          value={packageForm.payment_deadline_at}
                          onChange={(e) => setPackageForm((f) => ({ ...f, payment_deadline_at: e.target.value }))}
                          style={{ colorScheme: "light" }}
                          className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
                        />
                        <span className="text-[#94A3B8] text-[10.5px]">Kosongkan kalau gak ada batas waktu otomatis.</span>
                      </div>
                      <label className="flex items-center gap-2 px-3 h-9 rounded-[6px] bg-[#F8FAFC] border border-[#E2E8F0] cursor-pointer w-fit">
                        <input
                          type="checkbox"
                          checked={packageForm.requires_selection}
                          onChange={(e) => setPackageForm((f) => ({ ...f, requires_selection: e.target.checked }))}
                          className="accent-[#148F89]"
                        />
                        <span className="text-[12.5px] text-[#1E293B] font-medium">Butuh Seleksi (Tes BCC)?</span>
                      </label>
                      {packageForm.requires_selection && (
                        <>
                          <div className="flex gap-2">
                            <div className="flex-1 flex flex-col gap-1">
                              <label className="text-[#64748B] text-[10.5px] font-semibold uppercase">Durasi Tes (menit)</label>
                              <input
                                type="number"
                                min={5}
                                max={180}
                                value={packageForm.quiz_duration_minutes}
                                onChange={(e) => setPackageForm((f) => ({ ...f, quiz_duration_minutes: e.target.value }))}
                                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
                              />
                            </div>
                            <div className="flex-1 flex flex-col gap-1">
                              <label className="text-[#64748B] text-[10.5px] font-semibold uppercase">Skor Kelulusan (%)</label>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={packageForm.quiz_passing_score_percent}
                                onChange={(e) => setPackageForm((f) => ({ ...f, quiz_passing_score_percent: e.target.value }))}
                                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
                              />
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[#64748B] text-[10.5px] font-semibold uppercase">Kuota Diterima (opsional)</label>
                            <input
                              type="number"
                              min={1}
                              placeholder="Kosongkan = gak ada batas"
                              value={packageForm.selection_quota}
                              onChange={(e) => setPackageForm((f) => ({ ...f, selection_quota: e.target.value }))}
                              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
                            />
                            <span className="text-[#94A3B8] text-[10.5px]">
                              Cuma indikator progres -- gak ngunci tombol Terima di halaman Tinjau Pendaftaran.
                            </span>
                          </div>
                        </>
                      )}
                      {Number(packageForm.commitment_fee) > 0 && (
                        <div className="flex flex-col gap-1">
                          <label className="text-[#64748B] text-[10.5px] font-semibold uppercase">
                            Syarat Kehadiran buat Refund Commitment Fee (jumlah sesi)
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={packageForm.min_attendance_sessions}
                            onChange={(e) => setPackageForm((f) => ({ ...f, min_attendance_sessions: e.target.value }))}
                            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
                          />
                          <span className="text-[#94A3B8] text-[10.5px]">0 = gak ada syarat kehadiran.</span>
                        </div>
                      )}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[#64748B] text-[10.5px] font-semibold uppercase">Benefit</label>
                        <span className="text-[#94A3B8] text-[10.5px] -mt-1">
                          Yang ini ngatur hak akses beneran (unduh file, sesi mana yang kelihatan, team pairing).
                        </span>
                        <div className="flex flex-col gap-1">
                          {(pkg.benefits || []).map((b) => (
                            <label key={b.key} className="flex items-center gap-2 text-[12px] text-[#334155] cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!packageForm.benefits[b.key]}
                                onChange={() => toggleBenefit(b.key)}
                                className="accent-[#148F89]"
                              />
                              {b.label}
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Benefit tambahan: bebas, cuma buat ditampilin di kartu paket.
                          Disimpan langsung pas ditambah/hapus (bukan nunggu tombol
                          Simpan) supaya beda perlakuannya jelas dari benefit bawaan. */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[#64748B] text-[10.5px] font-semibold uppercase">Benefit Tambahan</label>
                        <span className="text-[#94A3B8] text-[10.5px] -mt-1">
                          Bebas, cuma tampilan di kartu paket. Langsung tersimpan begitu ditambah/dihapus.
                        </span>
                        {(pkg.extra_benefits || []).length > 0 && (
                          <div className="flex flex-col gap-1">
                            {pkg.extra_benefits.map((b) => (
                              <div key={b.id} className="flex items-center justify-between gap-2 text-[12px] text-[#334155] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-2.5 py-1.5">
                                <span className="truncate">{b.label}</span>
                                <button
                                  onClick={() => handleDeleteExtraBenefit(b.id)}
                                  className="p-1 rounded-[4px] text-[#DC2626] hover:bg-red-50 transition-colors shrink-0"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="mis. Akses Grup Alumni"
                            value={extraBenefitDraft[pkg.id] || ""}
                            onChange={(e) => setExtraBenefitDraft((d) => ({ ...d, [pkg.id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddExtraBenefit(pkg.id); } }}
                            className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-3 h-8 text-[12px] text-[#1E293B] outline-none focus:border-[#148F89]"
                          />
                          <button
                            onClick={() => handleAddExtraBenefit(pkg.id)}
                            disabled={!(extraBenefitDraft[pkg.id] || "").trim()}
                            className="px-3 h-8 rounded-[6px] bg-[#148F89] text-white text-[12px] font-semibold hover:bg-[#117A75] transition-colors disabled:opacity-50"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingPackageId(null)}
                          className="flex-1 h-9 rounded-[6px] border border-[#E2E8F0] text-[#64748B] text-[12px] font-semibold hover:bg-[#F8FAFC] transition-colors"
                        >
                          <X size={13} className="inline mr-1" /> Batal
                        </button>
                        <button
                          onClick={handleSavePackage}
                          disabled={savingPackage}
                          className="flex-1 h-9 rounded-[6px] bg-[#148F89] text-white text-[12px] font-semibold hover:bg-[#117A75] transition-colors disabled:opacity-50"
                        >
                          <Check size={13} className="inline mr-1" /> {savingPackage ? "Menyimpan..." : "Simpan"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
