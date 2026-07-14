"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Camera,
  ChevronRight,
  ShieldAlert,
  X,
  Landmark,
  Link2,
  Briefcase,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";
import DashboardLayout from "@/component/mentor/DashboardLayout";

function Field({ label, value, onChange, disabled, note, textarea, icon }) {
  const Component = textarea ? "textarea" : "input";
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[#E2E8F0] text-[13px] font-medium">{label}</label>
      <div className="relative">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]">
            {icon}
          </span>
        )}
        <Component
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          disabled={disabled}
          rows={textarea ? 3 : undefined}
          className={`w-full bg-[#0F081C] border border-[#2D2342] rounded-[8px] px-4 py-3 ${
            icon ? "pl-11" : ""
          } text-[14px] outline-none transition-colors resize-none ${
            disabled
              ? "text-[#6B7280] cursor-not-allowed"
              : "text-white focus:border-[#148F89]/60"
          }`}
        />
      </div>
      {note && <p className="text-[#6B7280] text-[11px]">{note}</p>}
    </div>
  );
}

// Pilihan keahlian -- mapping ke tabel expertises/mentor_expertises. Mentor
// wajib pilih minimal 1, bisa pilih lebih dari satu.
const EXPERTISE_OPTIONS = [
  { id: "bcc", label: "Business Case Competition (BCC)" },
  { id: "bpc", label: "Business Plan Competition (BPC)" },
  { id: "career", label: "Career Mentoring" },
];

const formatMonthYear = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
};

export default function MentorSettings() {
  const shouldReduceMotion = useReducedMotion() ?? false;

  // TODO: ganti semua data ini dengan data mentor dari session/auth context
  const email = "prabrorosub@gmail.com"; // readonly, ganti email lewat support
  const initialInfo = {
    fullName: "Prabroro Subriantoro",
    phone: "0812-3456-7890",
    linkedin: "https://linkedin.com/in/prabroro-subriantoro",
    bio: "Praktisi konsultan bisnis dengan pengalaman membimbing 50+ tim di berbagai kompetisi nasional dan internasional.",
  };
  const initialBank = {
    bankName: "BCA",
    accountNumber: "1234567890",
    accountHolder: "Prabroro Subriantoro",
  };
  const initialExpertise = ["bcc", "career"];

  const [fullName, setFullName] = useState(initialInfo.fullName);
  const [phone, setPhone] = useState(initialInfo.phone);
  const [linkedin, setLinkedin] = useState(initialInfo.linkedin);
  const [bio, setBio] = useState(initialInfo.bio);
  const [infoSaved, setInfoSaved] = useState(false);

  const [selectedExpertise, setSelectedExpertise] = useState(initialExpertise);
  const [expertiseSaved, setExpertiseSaved] = useState(false);

  const [bankName, setBankName] = useState(initialBank.bankName);
  const [accountNumber, setAccountNumber] = useState(initialBank.accountNumber);
  const [accountHolder, setAccountHolder] = useState(initialBank.accountHolder);
  const [bankSaved, setBankSaved] = useState(false);

  // --- Pengalaman (mentor_experiences: title, description, start_date, end_date) ---
  const [experiences, setExperiences] = useState([
    {
      id: "exp-1",
      title: "Business Consultant, PT Konsultan Maju",
      description:
        "Membimbing 50+ tim dalam kompetisi bisnis nasional dan internasional.",
      startDate: "2023-01-01",
      endDate: null, // null = masih berlangsung
    },
  ]);
  const [showExpModal, setShowExpModal] = useState(false);
  const [editingExpId, setEditingExpId] = useState(null);
  const [expForm, setExpForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    isOngoing: false,
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const isInfoDirty =
    fullName !== initialInfo.fullName ||
    phone !== initialInfo.phone ||
    linkedin !== initialInfo.linkedin ||
    bio !== initialInfo.bio;

  const isExpertiseDirty =
    JSON.stringify([...selectedExpertise].sort()) !==
    JSON.stringify([...initialExpertise].sort());
  const isExpertiseValid = selectedExpertise.length >= 1;

  const isBankDirty =
    bankName !== initialBank.bankName ||
    accountNumber !== initialBank.accountNumber ||
    accountHolder !== initialBank.accountHolder;

  const sectionReveal = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: shouldReduceMotion ? 0.2 : 0.4 },
    viewport: { once: true },
  };

  const modalMotion = shouldReduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : {
        initial: { opacity: 0, scale: 0.96, y: 12 },
        animate: { opacity: 1, scale: 1, y: 0 },
      };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteConfirmText("");
  };

  const handleSaveInfo = (e) => {
    e.preventDefault();
    // TODO: panggil API update profil mentor beneran
    setInfoSaved(true);
    setTimeout(() => setInfoSaved(false), 3000);
  };

  const toggleExpertise = (id) => {
    setSelectedExpertise((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSaveExpertise = (e) => {
    e.preventDefault();
    if (!isExpertiseValid) return;
    // TODO: sinkronkan ke tabel mentor_expertises (hapus yang di-uncheck,
    // insert yang baru dicentang)
    setExpertiseSaved(true);
    setTimeout(() => setExpertiseSaved(false), 3000);
  };

  const handleSaveBank = (e) => {
    e.preventDefault();
    // TODO: panggil API update rekening beneran, idealnya perlu verifikasi
    // tambahan (OTP/re-login) karena ini data sensitif buat payout
    setBankSaved(true);
    setTimeout(() => setBankSaved(false), 3000);
  };

  const openAddExperience = () => {
    setEditingExpId(null);
    setExpForm({
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      isOngoing: false,
    });
    setShowExpModal(true);
  };

  const openEditExperience = (exp) => {
    setEditingExpId(exp.id);
    setExpForm({
      title: exp.title,
      description: exp.description || "",
      startDate: exp.startDate || "",
      endDate: exp.endDate || "",
      isOngoing: !exp.endDate,
    });
    setShowExpModal(true);
  };

  const closeExpModal = () => setShowExpModal(false);

  const handleDeleteExperience = (id) => {
    setExperiences((prev) => prev.filter((exp) => exp.id !== id));
  };

  const handleSubmitExperience = (e) => {
    e.preventDefault();
    if (!expForm.title.trim() || !expForm.startDate) return;
    const payload = {
      id: editingExpId || `exp-${Date.now()}`,
      title: expForm.title.trim(),
      description: expForm.description.trim(),
      startDate: expForm.startDate,
      endDate: expForm.isOngoing ? null : expForm.endDate || null,
    };
    // TODO: panggil API create/update ke tabel mentor_experiences
    if (editingExpId) {
      setExperiences((prev) =>
        prev.map((exp) => (exp.id === editingExpId ? payload : exp)),
      );
    } else {
      setExperiences((prev) => [...prev, payload]);
    }
    setShowExpModal(false);
  };

  return (
    <DashboardLayout title="Settings">
      <motion.div {...sectionReveal} className="flex flex-col gap-1">
        <h1 className="text-[28px] sm:text-[32px] font-bold text-white leading-tight">
          Pengaturan Akun
        </h1>
        <p className="text-[#9CA3AF] text-[14px] mt-1">
          Kelola profil publik, rekening pencairan, dan keamanan akun mentor-mu.
        </p>
      </motion.div>

      {/* Foto Profil */}
      <motion.div
        {...sectionReveal}
        className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-6 flex flex-col sm:flex-row sm:items-center gap-5"
      >
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#2D2342]">
            <img
              src="/images/pp.png"
              alt="Foto profil"
              className="w-full h-full object-cover"
            />
          </div>
          <button
            aria-label="Ganti foto"
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#148F89] flex items-center justify-center border-2 border-[#170F26] hover:bg-[#117A75] transition-colors"
          >
            <Camera size={13} className="text-white" />
          </button>
        </div>
        <div className="flex-1">
          <h3 className="text-white font-semibold text-[15px]">Foto Profil</h3>
          <p className="text-[#9CA3AF] text-[12px] mt-1">
            Ditampilkan di halaman Mentors publik. JPG/PNG, maksimal 2MB.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button className="px-4 py-2 rounded-[8px] bg-[#148F89] text-white text-[12px] font-semibold hover:bg-[#117A75] transition-colors">
            Unggah Foto
          </button>
          <button className="px-4 py-2 rounded-[8px] border border-[#2D2342] text-[#9CA3AF] text-[12px] font-semibold hover:text-white hover:border-red-500/40 transition-colors">
            Hapus
          </button>
        </div>
      </motion.div>

      {/* Informasi Pribadi */}
      <motion.form
        {...sectionReveal}
        onSubmit={handleSaveInfo}
        className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-6 flex flex-col gap-5"
      >
        <div>
          <h3 className="text-white font-semibold text-[15px]">
            Informasi Pribadi
          </h3>
          <p className="text-[#9CA3AF] text-[12px] mt-1">
            Bio dan LinkedIn ditampilkan di halaman Mentors publik agar mentee
            bisa mengenalmu lebih baik.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nama Lengkap" value={fullName} onChange={setFullName} />
          <Field
            label="Email"
            value={email}
            disabled
            note="Hubungi support untuk mengubah email."
          />
          <Field label="Nomor WhatsApp" value={phone} onChange={setPhone} />
          <Field
            label="LinkedIn"
            value={linkedin}
            onChange={setLinkedin}
            icon={<Link2 size={16} />}
            note="Tautan profil LinkedIn-mu."
          />
        </div>
        <Field label="Bio Singkat" value={bio} onChange={setBio} textarea />

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!isInfoDirty}
            className="px-5 py-2.5 rounded-[8px] bg-[#148F89] text-white text-[13px] font-semibold hover:bg-[#117A75] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#148F89]"
          >
            Simpan Perubahan
          </button>
          {infoSaved && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[#148F89] text-[12px] font-medium"
            >
              Perubahan tersimpan.
            </motion.span>
          )}
        </div>
      </motion.form>

      {/* Keahlian -- mapping ke expertises/mentor_expertises, wajib pilih min 1 */}
      <motion.form
        {...sectionReveal}
        onSubmit={handleSaveExpertise}
        className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-6 flex flex-col gap-4"
      >
        <div>
          <h3 className="text-white font-semibold text-[15px]">Keahlian</h3>
          <p className="text-[#9CA3AF] text-[12px] mt-1">
            Pilih minimal 1. Ini menentukan produk/kelas mana yang bisa kamu
            ditugaskan sebagai mentor.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {EXPERTISE_OPTIONS.map((opt) => {
            const isSelected = selectedExpertise.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleExpertise(opt.id)}
                className={`px-4 py-2.5 rounded-[8px] text-[13px] font-medium border transition-colors ${
                  isSelected
                    ? "bg-[#148F89]/15 border-[#148F89] text-[#148F89]"
                    : "bg-[#0F081C] border-[#2D2342] text-[#9CA3AF] hover:border-[#9CA3AF] hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        {!isExpertiseValid && (
          <p className="text-[#EF4444] text-[12px]">
            Pilih minimal 1 keahlian.
          </p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!isExpertiseDirty || !isExpertiseValid}
            className="px-5 py-2.5 rounded-[8px] bg-[#148F89] text-white text-[13px] font-semibold hover:bg-[#117A75] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#148F89]"
          >
            Simpan Keahlian
          </button>
          {expertiseSaved && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[#148F89] text-[12px] font-medium"
            >
              Keahlian tersimpan.
            </motion.span>
          )}
        </div>
      </motion.form>

      {/* Pengalaman -- mapping ke mentor_experiences, CRUD via modal */}
      <motion.div
        {...sectionReveal}
        className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-6 flex flex-col gap-4"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Briefcase size={17} className="text-[#148F89]" />
            <div>
              <h3 className="text-white font-semibold text-[15px]">
                Pengalaman
              </h3>
              <p className="text-[#9CA3AF] text-[12px] mt-1">
                Ditampilkan di halaman Mentors publik sebagai riwayat kerja.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openAddExperience}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] bg-[#148F89]/10 border border-[#148F89]/40 text-[#148F89] text-[12px] font-semibold hover:bg-[#148F89]/20 transition-colors shrink-0"
          >
            <Plus size={14} />
            Tambah
          </button>
        </div>

        {experiences.length === 0 ? (
          <p className="text-[#6B7280] text-[12px] italic">
            Belum ada pengalaman ditambahkan.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {experiences.map((exp) => (
              <div
                key={exp.id}
                className="bg-[#0F081C] border border-[#2D2342] rounded-[8px] p-4 flex items-start justify-between gap-3"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <h4 className="text-white font-semibold text-[14px] line-clamp-2">
                    {exp.title}
                  </h4>
                  <p className="text-[#9CA3AF] text-[12px]">
                    {formatMonthYear(exp.startDate)} &ndash;{" "}
                    {exp.endDate ? formatMonthYear(exp.endDate) : "Sekarang"}
                  </p>
                  {exp.description && (
                    <p className="text-[#9CA3AF] text-[12px] mt-1 leading-relaxed">
                      {exp.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openEditExperience(exp)}
                    aria-label="Edit pengalaman"
                    className="text-[#9CA3AF] hover:text-white transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteExperience(exp.id)}
                    aria-label="Hapus pengalaman"
                    className="text-[#9CA3AF] hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Rekening Bank -- khusus mentor, dipakai buat pencairan pendapatan
          (lihat "Dicairkan ke [bank]" di halaman Transactions) */}
      <motion.form
        {...sectionReveal}
        onSubmit={handleSaveBank}
        className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-6 flex flex-col gap-5"
      >
        <div className="flex items-center gap-2">
          <Landmark size={17} className="text-[#148F89]" />
          <div>
            <h3 className="text-white font-semibold text-[15px]">
              Rekening Bank
            </h3>
            <p className="text-[#9CA3AF] text-[12px] mt-1">
              Tujuan transfer pendapatanmu dari sesi bootcamp dan mentoring.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nama Bank" value={bankName} onChange={setBankName} />
          <Field
            label="Nomor Rekening"
            value={accountNumber}
            onChange={setAccountNumber}
          />
        </div>
        <Field
          label="Nama Pemilik Rekening"
          value={accountHolder}
          onChange={setAccountHolder}
          note="Harus sama persis dengan nama di buku tabungan/rekening."
        />

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!isBankDirty}
            className="px-5 py-2.5 rounded-[8px] bg-[#148F89] text-white text-[13px] font-semibold hover:bg-[#117A75] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#148F89]"
          >
            Simpan Rekening
          </button>
          {bankSaved && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[#148F89] text-[12px] font-medium"
            >
              Rekening tersimpan.
            </motion.span>
          )}
        </div>
      </motion.form>

      {/* Keamanan Akun */}
      <motion.div
        {...sectionReveal}
        className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-6 flex flex-col gap-4"
      >
        <div>
          <h3 className="text-white font-semibold text-[15px]">
            Keamanan Akun
          </h3>
          <p className="text-[#9CA3AF] text-[12px] mt-1">
            Kata sandi terakhir diubah 2 bulan lalu.
          </p>
        </div>
        <Link
          href="/mentor/settings/change-password"
          className="flex items-center justify-between px-4 py-3.5 rounded-[8px] border border-[#2D2342] hover:border-[#148F89]/50 transition-colors group"
        >
          <span className="text-white text-[13px] font-medium">
            Ubah Kata Sandi
          </span>
          <ChevronRight
            size={16}
            className="text-[#9CA3AF] group-hover:text-[#148F89] transition-colors"
          />
        </Link>
      </motion.div>

      {/* Zona Berbahaya */}
      <motion.div
        {...sectionReveal}
        className="bg-[#170F26] border border-red-500/20 rounded-[12px] p-6 flex flex-col gap-4"
      >
        <div className="flex items-center gap-2">
          <ShieldAlert size={17} className="text-red-400" />
          <h3 className="text-red-400 font-semibold text-[15px]">
            Zona Berbahaya
          </h3>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-white text-[13px] font-medium">Hapus Akun</p>
            <p className="text-[#9CA3AF] text-[12px] mt-0.5">
              Semua data, sertifikat, dan riwayat pendapatan akan dihapus
              permanen.
            </p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2.5 rounded-[8px] border border-red-500/40 text-red-400 text-[13px] font-semibold hover:bg-red-500/10 transition-colors shrink-0"
          >
            Hapus Akun
          </button>
        </div>
      </motion.div>

      {/* --- MODAL: Tambah/Edit Pengalaman --- */}
      {showExpModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={closeExpModal}
        >
          <motion.form
            {...modalMotion}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmitExperience}
            className="bg-[#170F26] w-full max-w-[460px] max-h-[85vh] overflow-y-auto rounded-[16px] border border-[#2D2342] shadow-2xl"
          >
            <div className="sticky top-0 bg-[#170F26] px-6 py-5 border-b border-[#2D2342] flex items-center justify-between">
              <h3 className="text-white font-bold text-[17px]">
                {editingExpId ? "Edit Pengalaman" : "Tambah Pengalaman"}
              </h3>
              <button
                type="button"
                onClick={closeExpModal}
                aria-label="Tutup"
                className="p-1.5 rounded-[8px] text-[#9CA3AF] hover:text-white hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <Field
                label="Judul / Posisi"
                value={expForm.title}
                onChange={(v) => setExpForm((f) => ({ ...f, title: v }))}
              />
              <Field
                label="Deskripsi"
                value={expForm.description}
                onChange={(v) => setExpForm((f) => ({ ...f, description: v }))}
                textarea
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[#E2E8F0] text-[13px] font-medium">
                    Mulai
                  </label>
                  <input
                    type="date"
                    value={expForm.startDate}
                    onChange={(e) =>
                      setExpForm((f) => ({
                        ...f,
                        startDate: e.target.value,
                      }))
                    }
                    className="w-full bg-[#0F081C] border border-[#2D2342] rounded-[8px] px-4 py-3 text-[13px] text-white outline-none focus:border-[#148F89]/60 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[#E2E8F0] text-[13px] font-medium">
                    Selesai
                  </label>
                  <input
                    type="date"
                    value={expForm.endDate}
                    disabled={expForm.isOngoing}
                    onChange={(e) =>
                      setExpForm((f) => ({ ...f, endDate: e.target.value }))
                    }
                    className={`w-full bg-[#0F081C] border border-[#2D2342] rounded-[8px] px-4 py-3 text-[13px] outline-none transition-colors ${
                      expForm.isOngoing
                        ? "text-[#6B7280] cursor-not-allowed"
                        : "text-white focus:border-[#148F89]/60"
                    }`}
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={expForm.isOngoing}
                  onChange={(e) =>
                    setExpForm((f) => ({
                      ...f,
                      isOngoing: e.target.checked,
                      endDate: e.target.checked ? "" : f.endDate,
                    }))
                  }
                  className="w-4 h-4 rounded accent-[#148F89]"
                />
                <span className="text-[#E2E8F0] text-[13px]">
                  Masih berlangsung sampai sekarang
                </span>
              </label>

              <button
                type="submit"
                disabled={!expForm.title.trim() || !expForm.startDate}
                className="w-full py-3 rounded-[8px] bg-[#148F89] text-white font-semibold text-[13px] hover:bg-[#117A75] transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              >
                {editingExpId ? "Simpan Perubahan" : "Tambah Pengalaman"}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}

      {/* --- MODAL: Konfirmasi Hapus Akun --- */}
      {showDeleteModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={closeDeleteModal}
        >
          <motion.div
            {...modalMotion}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#170F26] w-full max-w-[420px] rounded-[16px] border border-red-500/30 shadow-2xl p-6 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-[17px]">
                Hapus Akun Permanen
              </h3>
              <button
                onClick={closeDeleteModal}
                aria-label="Tutup"
                className="text-[#9CA3AF] hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-[#9CA3AF] text-[13px] leading-relaxed">
              Tindakan ini tidak bisa dibatalkan. Semua sertifikat, riwayat
              pendapatan, dan profil publikmu di halaman Mentors akan dihapus
              permanen dari Mark-Up.
            </p>
            <div className="flex flex-col gap-1.5">
              <label className="text-[#E2E8F0] text-[12px]">
                Ketik <span className="font-bold text-white">HAPUS</span> untuk
                konfirmasi
              </label>
              <input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full bg-[#0F081C] border border-[#2D2342] rounded-[8px] px-4 py-2.5 text-[13px] text-white outline-none focus:border-red-500/50 transition-colors"
              />
            </div>
            <div className="flex items-center gap-3 mt-1">
              <button
                onClick={closeDeleteModal}
                className="flex-1 py-2.5 rounded-[8px] border border-[#2D2342] text-[#9CA3AF] text-[13px] font-semibold hover:text-white transition-colors"
              >
                Batal
              </button>
              <button
                disabled={deleteConfirmText !== "HAPUS"}
                className="flex-1 py-2.5 rounded-[8px] bg-red-500 text-white text-[13px] font-semibold hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Hapus Akun
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </DashboardLayout>
  );
}
