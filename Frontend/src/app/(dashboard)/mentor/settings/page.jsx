"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Camera,
  ChevronRight,
  Link2,
  Briefcase,
  Pencil,
  Trash2,
  Plus,
  X,
  Landmark,
} from "lucide-react";
import DashboardLayout from "@/component/mentor/DashboardLayout";
import { apiRequest, getAccessToken, API_BASE } from "@/lib/api";

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
          value={value ?? ""}
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

const formatMonthYear = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
};

export default function MentorSettings() {
  const shouldReduceMotion = useReducedMotion() ?? false;

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");

  const [initialInfo, setInitialInfo] = useState({ fullName: "", phone: "", linkedin: "", bio: "" });
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [bio, setBio] = useState("");
  const [infoSaved, setInfoSaved] = useState(false);

  const [expertiseOptions, setExpertiseOptions] = useState([]);
  const [initialExpertise, setInitialExpertise] = useState([]);
  const [selectedExpertise, setSelectedExpertise] = useState([]);
  const [expertiseSaved, setExpertiseSaved] = useState(false);

  const [initialBank, setInitialBank] = useState({ bankName: "", accountNumber: "", accountHolder: "" });
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [bankSaved, setBankSaved] = useState(false);

  const [profileImage, setProfileImage] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState(null);

  const [experiences, setExperiences] = useState([]);
  const [showExpModal, setShowExpModal] = useState(false);
  const [editingExpId, setEditingExpId] = useState(null);
  const [expForm, setExpForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    isOngoing: false,
  });

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

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [profileRes, expertiseRes, meRes] = await Promise.all([
          apiRequest("/api/mentors/me/profile/"),
          apiRequest("/api/mentors/expertise/", { auth: false }),
          apiRequest("/api/accounts/me/profile/"),
        ]);

        setExpertiseOptions(expertiseRes?.expertise || []);

        setEmail(meRes?.user?.email || "");
        setProfileImage(meRes?.user?.profile_image || null);

        const info = {
          fullName: profileRes.fullname,
          phone: profileRes.phone,
          linkedin: profileRes.linkedin_url,
          bio: profileRes.bio,
        };
        setInitialInfo(info);
        setFullName(info.fullName);
        setPhone(info.phone);
        setLinkedin(info.linkedin);
        setBio(info.bio);

        setInitialExpertise(profileRes.expertise || []);
        setSelectedExpertise(profileRes.expertise || []);

        const bank = {
          bankName: profileRes.bank_name || "",
          accountNumber: profileRes.bank_account || "",
          accountHolder: profileRes.bank_account_holder || "",
        };
        setInitialBank(bank);
        setBankName(bank.bankName);
        setAccountNumber(bank.accountNumber);
        setAccountHolder(bank.accountHolder);

        setExperiences(
          (profileRes.experiences || []).map((exp) => ({
            id: exp.id,
            title: exp.title,
            description: exp.description,
            startDate: exp.start_date,
            endDate: exp.end_date,
          })),
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const closeExpModal = () => setShowExpModal(false);

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    try {
      await apiRequest("/api/mentors/me/profile/", {
        method: "PATCH",
        body: { fullname: fullName, phone, linkedin_url: linkedin, bio },
      });
      setInitialInfo({ fullName, phone, linkedin, bio });
      setInfoSaved(true);
      setTimeout(() => setInfoSaved(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleExpertise = (id) => {
    setSelectedExpertise((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSaveExpertise = async (e) => {
    e.preventDefault();
    if (!isExpertiseValid) return;
    try {
      await apiRequest("/api/mentors/me/expertise/", {
        method: "PUT",
        body: { expertise_ids: selectedExpertise },
      });
      setInitialExpertise(selectedExpertise);
      setExpertiseSaved(true);
      setTimeout(() => setExpertiseSaved(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveBank = async (e) => {
    e.preventDefault();
    try {
      await apiRequest("/api/mentors/me/profile/", {
        method: "PATCH",
        body: {
          bank_name: bankName,
          bank_account: accountNumber,
          bank_account_holder: accountHolder,
        },
      });
      setInitialBank({ bankName, accountNumber, accountHolder });
      setBankSaved(true);
      setTimeout(() => setBankSaved(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadPhoto = async (file) => {
    if (!file) return;
    setIsUploadingPhoto(true);
    setPhotoError(null);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const token = getAccessToken();
      const res = await fetch(`${API_BASE}/api/accounts/me/profile/photo/`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.detail || "Gagal mengunggah foto.");
      setProfileImage(data.profile_image);
    } catch (err) {
      setPhotoError(err.message || "Gagal mengunggah foto.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
    setIsUploadingPhoto(true);
    setPhotoError(null);
    try {
      await apiRequest("/api/accounts/me/profile/photo/delete/", { method: "POST" });
      setProfileImage(null);
    } catch (err) {
      setPhotoError(err.message || "Gagal menghapus foto.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const openAddExperience = () => {
    setEditingExpId(null);
    setExpForm({ title: "", description: "", startDate: "", endDate: "", isOngoing: false });
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

  const handleDeleteExperience = async (id) => {
    try {
      await apiRequest(`/api/mentors/me/experiences/${id}/`, { method: "DELETE" });
      setExperiences((prev) => prev.filter((exp) => exp.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitExperience = async (e) => {
    e.preventDefault();
    if (!expForm.title.trim() || !expForm.startDate) return;

    const body = {
      title: expForm.title.trim(),
      description: expForm.description.trim(),
      start_date: expForm.startDate,
      end_date: expForm.isOngoing ? null : expForm.endDate || null,
    };

    try {
      if (editingExpId) {
        const res = await apiRequest(`/api/mentors/me/experiences/${editingExpId}/`, {
          method: "PATCH",
          body,
        });
        setExperiences((prev) =>
          prev.map((exp) =>
            exp.id === editingExpId
              ? { id: res.id, title: res.title, description: res.description, startDate: res.start_date, endDate: res.end_date }
              : exp,
          ),
        );
      } else {
        const res = await apiRequest("/api/mentors/me/experiences/", {
          method: "POST",
          body,
        });
        setExperiences((prev) => [
          ...prev,
          { id: res.id, title: res.title, description: res.description, startDate: res.start_date, endDate: res.end_date },
        ]);
      }
      setShowExpModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Settings">
        <p className="text-[#6B7280] text-[13px]">Memuat pengaturan...</p>
      </DashboardLayout>
    );
  }

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
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#2D2342] bg-[#0F081C] flex items-center justify-center">
            <img
              src={profileImage || "/images/default-avatar.svg"}
              alt="Foto profil"
              className="w-full h-full object-cover"
            />
          </div>
          <label
            aria-label="Ganti foto"
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#148F89] flex items-center justify-center border-2 border-[#170F26] hover:bg-[#117A75] transition-colors cursor-pointer"
          >
            <Camera size={13} className="text-white" />
            <input
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={(e) => handleUploadPhoto(e.target.files?.[0])}
            />
          </label>
        </div>
        <div className="flex-1">
          <h3 className="text-white font-semibold text-[15px]">Foto Profil</h3>
          <p className="text-[#9CA3AF] text-[12px] mt-1">
            Ditampilkan di halaman Mentors publik. JPG/PNG, maksimal 2MB.
          </p>
          {photoError && <p className="text-red-400 text-[11px] mt-1">{photoError}</p>}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <label className="px-4 py-2 rounded-[8px] bg-[#148F89] text-white text-[12px] font-semibold hover:bg-[#117A75] transition-colors cursor-pointer">
            {isUploadingPhoto ? "Memproses..." : "Unggah Foto"}
            <input
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={(e) => handleUploadPhoto(e.target.files?.[0])}
            />
          </label>
          <button
            onClick={handleDeletePhoto}
            disabled={!profileImage || isUploadingPhoto}
            className="px-4 py-2 rounded-[8px] border border-[#2D2342] text-[#9CA3AF] text-[12px] font-semibold hover:text-white hover:border-red-500/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
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
          <h3 className="text-white font-semibold text-[15px]">Informasi Pribadi</h3>
          <p className="text-[#9CA3AF] text-[12px] mt-1">
            Bio dan LinkedIn ditampilkan di halaman Mentors publik agar mentee
            bisa mengenalmu lebih baik.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nama Lengkap" value={fullName} onChange={setFullName} />
          <Field label="Email" value={email} disabled note="Hubungi support untuk mengubah email." />
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

      {/* Keahlian */}
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
          {expertiseOptions.map((opt) => {
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
                {opt.name}
              </button>
            );
          })}
        </div>
        {!isExpertiseValid && (
          <p className="text-[#EF4444] text-[12px]">Pilih minimal 1 keahlian.</p>
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

      {/* Pengalaman */}
      <motion.div
        {...sectionReveal}
        className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-6 flex flex-col gap-4"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Briefcase size={17} className="text-[#148F89]" />
            <div>
              <h3 className="text-white font-semibold text-[15px]">Pengalaman</h3>
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
          <p className="text-[#6B7280] text-[12px] italic">Belum ada pengalaman ditambahkan.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {experiences.map((exp) => (
              <div
                key={exp.id}
                className="bg-[#0F081C] border border-[#2D2342] rounded-[8px] p-4 flex items-start justify-between gap-3"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <h4 className="text-white font-semibold text-[14px] line-clamp-2">{exp.title}</h4>
                  <p className="text-[#9CA3AF] text-[12px]">
                    {formatMonthYear(exp.startDate)} &ndash;{" "}
                    {exp.endDate ? formatMonthYear(exp.endDate) : "Sekarang"}
                  </p>
                  {exp.description && (
                    <p className="text-[#9CA3AF] text-[12px] mt-1 leading-relaxed">{exp.description}</p>
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

      {/* Rekening Bank */}
      <motion.form
        {...sectionReveal}
        onSubmit={handleSaveBank}
        className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-6 flex flex-col gap-5"
      >
        <div className="flex items-center gap-2">
          <Landmark size={17} className="text-[#148F89]" />
          <div>
            <h3 className="text-white font-semibold text-[15px]">Rekening Bank</h3>
            <p className="text-[#9CA3AF] text-[12px] mt-1">
              Tujuan transfer pendapatanmu dari sesi bootcamp dan mentoring.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nama Bank" value={bankName} onChange={setBankName} />
          <Field label="Nomor Rekening" value={accountNumber} onChange={setAccountNumber} />
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
          <h3 className="text-white font-semibold text-[15px]">Keamanan Akun</h3>
        </div>
        <Link
          href="/mentor/settings/change-password"
          className="flex items-center justify-between px-4 py-3.5 rounded-[8px] border border-[#2D2342] hover:border-[#148F89]/50 transition-colors group"
        >
          <span className="text-white text-[13px] font-medium">Ubah Kata Sandi</span>
          <ChevronRight size={16} className="text-[#9CA3AF] group-hover:text-[#148F89] transition-colors" />
        </Link>
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
                  <label className="text-[#E2E8F0] text-[13px] font-medium">Mulai</label>
                  <input
                    type="date"
                    value={expForm.startDate}
                    onChange={(e) => setExpForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="w-full bg-[#0F081C] border border-[#2D2342] rounded-[8px] px-4 py-3 text-[13px] text-white outline-none focus:border-[#148F89]/60 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[#E2E8F0] text-[13px] font-medium">Selesai</label>
                  <input
                    type="date"
                    value={expForm.endDate}
                    disabled={expForm.isOngoing}
                    onChange={(e) => setExpForm((f) => ({ ...f, endDate: e.target.value }))}
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
                <span className="text-[#E2E8F0] text-[13px]">Masih berlangsung sampai sekarang</span>
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
    </DashboardLayout>
  );
}
