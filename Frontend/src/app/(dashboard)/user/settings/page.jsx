"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Camera,
  FileText,
  Upload,
  Trash2,
  ChevronRight,
  ShieldAlert,
  X,
} from "lucide-react";
import { apiRequest, getAccessToken, API_BASE } from "@/lib/api";
import { toast } from "sonner";
import AttentionBanner from "@/component/AttentionBanner";

/**
 * `anchor` + `perluDiisi` dipakai untuk menyorot kolom yang bikin badge angka
 * di sidebar menyala. Sorotannya hilang sendiri begitu kolomnya diketik,
 * bukan menunggu disimpan -- supaya terasa langsung terjawab.
 */
function Field({ label, value, onChange, disabled, note, type = "text", anchor, perluDiisi }) {
  const kosong = perluDiisi && !(value || "").trim();
  return (
    <div className="flex flex-col gap-1.5 scroll-mt-32" id={anchor}>
      <label className="text-[#E2E8F0] text-[13px] font-medium flex items-center gap-2">
        {label}
        {kosong && (
          <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#FBBF24] border border-[#F59E0B]/30">
            Belum diisi
          </span>
        )}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        disabled={disabled}
        aria-invalid={kosong || undefined}
        className={`w-full bg-[#0F081C] border rounded-[8px] px-4 py-3 text-[14px] outline-none transition-colors ${
          kosong ? "border-[#F59E0B]/70" : "border-[#2D2342]"
        } ${
          disabled
            ? "text-[#6B7280] cursor-not-allowed"
            : "text-white focus:border-[#148F89]/60"
        }`}
      />
      {note && <p className="text-[#6B7280] text-[11px]">{note}</p>}
    </div>
  );
}

const SHOW_CV_SECTION = false;

// Orang biasanya ngetik "linkedin.com/in/nama" tanpa skema. Dulu field ini
// pakai type="url", jadi validasi bawaan browser NGEBLOKIR submit -- field yang
// ditulis "opsional" malah kerasa wajib. Sekarang dirapikan di sini saja.
function normalizeUrl(v) {
  const t = (v || "").trim();
  if (!t) return "";
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

export default function Settings() {
  const shouldReduceMotion = useReducedMotion();

  const [email, setEmail] = useState("");
  const [initialInfo, setInitialInfo] = useState({
    fullName: "",
    phone: "",
    institution: "",
    currentStatus: "",
    linkedIn: "",
  });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [institution, setInstitution] = useState("");
  const [currentStatus, setCurrentStatus] = useState("");
  const [linkedIn, setLinkedIn] = useState("");

  const [profileImage, setProfileImage] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState(null);

  const [missingFields, setMissingFields] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Sebuah kolom disorot hanya kalau backend memang menandainya kurang. Nilai
  // kosongnya sendiri dicek ulang di dalam <Field>, jadi sorotannya lenyap
  // begitu diketik tanpa perlu menunggu tersimpan.
  const perluDiisi = (key) => missingFields.some((f) => f.key === key);
  const [isSaving, setIsSaving] = useState(false);


  const [cvUrl, setCvUrl] = useState(null);
  const [cvFileName, setCvFileName] = useState(null);
  const [isUploadingCv, setIsUploadingCv] = useState(false);
  const [cvError, setCvError] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const isInfoDirty =
    fullName !== initialInfo.fullName ||
    phone !== initialInfo.phone ||
    institution !== initialInfo.institution ||
    currentStatus !== initialInfo.currentStatus ||
    linkedIn !== initialInfo.linkedIn;

  const sectionReveal = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: shouldReduceMotion ? 0.2 : 0.4 },
    viewport: { once: true },
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteConfirmText("");
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    try {
      const res = await apiRequest("/api/accounts/me/profile/", {
        method: "PATCH",
        body: {
          fullname: fullName,
          phone,
          institution,
          current_status: currentStatus,
          linkedin_url: normalizeUrl(linkedIn),
        },
      });
      const u = res.user;
      setInitialInfo({
        fullName: u.fullname,
        phone: u.phone,
        institution: u.institution,
        currentStatus: u.current_status,
        linkedIn: u.linkedin_url,
      });
      toast.success("Berhasil", { description: "Perubahan berhasil disimpan." });
    } catch (err) {
      toast.error("Gagal", { description: err?.message || "Gagal menyimpan perubahan." });
    } finally {
      setIsSaving(false);
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
    if (!res.ok) {
      throw new Error(data?.detail || "Gagal mengunggah foto.");
    }

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
    await apiRequest("/api/accounts/me/profile/photo/delete/", {
      method: "POST",
    });
    setProfileImage(null);
  } catch (err) {
    setPhotoError(err.message || "Gagal menghapus foto.");
  } finally {
    setIsUploadingPhoto(false);
  }
};

const handleUploadCv = async (file) => {
  if (!file) return;
  setIsUploadingCv(true);
  setCvError(null);
  try {
    const formData = new FormData();
    formData.append("cv", file);

    const token = getAccessToken();
    const res = await fetch(`${API_BASE}/api/accounts/me/cv/`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.detail || "Gagal mengunggah CV.");
    }

    setCvUrl(data.cv_url);
    setCvFileName(data.cv_filename);
  } catch (err) {
    setCvError(err.message || "Gagal mengunggah CV.");
  } finally {
    setIsUploadingCv(false);
  }
};

const handleDeleteCv = async () => {
  setIsUploadingCv(true);
  setCvError(null);
  try {
    await apiRequest("/api/accounts/me/cv/delete/", { method: "POST" });
    setCvUrl(null);
    setCvFileName(null);
  } catch (err) {
    setCvError(err.message || "Gagal menghapus CV.");
  } finally {
    setIsUploadingCv(false);
  }
};

const handleDeleteAccount = async () => {
  if (isDeletingAccount) return;
  setIsDeletingAccount(true);
  try {
    // Ini cuma MINTA hapus akun -- backend kirim link konfirmasi ke email.
    // Akun baru beneran dihapus setelah user klik link di email itu.
    const res = await apiRequest("/api/accounts/me/delete/", { method: "POST" });
    setShowDeleteModal(false);
    toast.success("Periksa email kamu", {
      description:
        res?.detail ||
        "Tautan konfirmasi penghapusan akun sudah dikirim ke email kamu.",
    });
  } catch (err) {
    toast.error("Gagal mengirim konfirmasi", { description: err?.message || "Terjadi kesalahan." });
  } finally {
    setIsDeletingAccount(false);
  }
};


  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoadingProfile(true);
        const res = await apiRequest("/api/accounts/me/profile/");
        const u = res.user;
        setEmail(u.email);
        // Daftar kolom yang bikin badge angka di sidebar menyala. Datang dari
        // backend, memakai aturan yang sama dengan badge-nya.
        setMissingFields(u.missing_profile_fields || []);
        setProfileImage(u.profile_image || null); // BARU
        setCvUrl(u.cv_url || null);
        setCvFileName(u.cv_filename || null);
        const info = {
          fullName: u.fullname,
          phone: u.phone,
          institution: u.institution,
          currentStatus: u.current_status,
          linkedIn: u.linkedin_url,
        };
        setInitialInfo(info);
        setFullName(info.fullName);
        setPhone(info.phone);
        setInstitution(info.institution);
        setCurrentStatus(info.currentStatus);
        setLinkedIn(info.linkedIn);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingProfile(false);
      }
    }
    fetchProfile();
  }, []);

  return (
    <>
      <motion.div {...sectionReveal} className="flex flex-col gap-1">
        <h1 className="text-[28px] sm:text-[32px] font-bold text-white leading-tight">
          Pengaturan Akun
        </h1>
        <p className="text-[#9CA3AF] text-[14px] mt-1">
          Kelola informasi profil, keamanan, dan preferensi akunmu.
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
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/images/default-avatar.svg";
              }}
            />
          </div>
          <label
            aria-label="Ganti foto"
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#148F89] flex items-center justify-center border-2 border-[#170F26] hover:bg-[#117A75] transition-colors cursor-pointer"
          >
            <input
              type="file"
              accept=".jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadPhoto(file);
              }}
            />
            <Camera size={13} className="text-white" />
          </label>
        </div>
        <div className="flex-1">
          <h3 className="text-white font-semibold text-[15px]">Foto Profil</h3>
          <p className="text-[#9CA3AF] text-[12px] mt-1">
            JPG atau PNG, maksimal 2MB.
          </p>
          {photoError && (
            <p className="text-red-400 text-[11px] mt-1">{photoError}</p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <label
            className={`px-4 py-2 rounded-[8px] text-white text-[12px] font-semibold transition-colors cursor-pointer ${
              isUploadingPhoto
                ? "bg-[#148F89]/60 cursor-wait"
                : "bg-[#148F89] hover:bg-[#117A75]"
            }`}
          >
            <input
              type="file"
              accept=".jpg,.jpeg,.png"
              className="hidden"
              disabled={isUploadingPhoto}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadPhoto(file);
              }}
            />
            {isUploadingPhoto ? "Mengunggah..." : "Unggah Foto"}
          </label>
          <button
            onClick={handleDeletePhoto}
            disabled={isUploadingPhoto || !profileImage}
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
          <h3 className="text-white font-semibold text-[15px]">
            Informasi Pribadi
          </h3>
          <p className="text-[#9CA3AF] text-[12px] mt-1">
            Data ini dipakai di sertifikat dan saat kamu berinteraksi dengan
            mentor.
          </p>
        </div>

        <AttentionBanner
          judul={`${missingFields.length} data wajib belum diisi`}
          keterangan="Ini yang membuat angka merah muncul di menu Pengaturan Akun. Klik salah satu untuk langsung menuju kolomnya."
          butir={missingFields.map((f) => ({
            key: f.key,
            label: f.label,
            anchor: `profil-${f.key}`,
          }))}
          dismissKey="user-settings-lengkapi"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Nama Lengkap"
            value={fullName}
            onChange={setFullName}
            anchor="profil-fullname"
            perluDiisi={perluDiisi("fullname")}
          />
          <Field
            label="Email"
            value={email}
            disabled
            type="email"
            note="Hubungi support untuk mengubah email."
          />
          <Field
            label="Nomor WhatsApp"
            value={phone}
            onChange={setPhone}
            anchor="profil-phone"
            perluDiisi={perluDiisi("phone")}
          />

          {/* Mulai Tambahan Data Baris #11, #13 */}
          <Field
            label="Universitas / Institusi Asal"
            value={institution}
            onChange={setInstitution}
            anchor="profil-institution"
            perluDiisi={perluDiisi("institution")}
          />
          <Field
            label="Semester Saat Ini"
            value={currentStatus}
            onChange={setCurrentStatus}
            note="Contoh: Mahasiswa Semester 5, Fresh Graduate, dll."
            anchor="profil-current_status"
            perluDiisi={perluDiisi("current_status")}
          />
          <Field
            label="URL LinkedIn (opsional)"
            value={linkedIn}
            onChange={setLinkedIn}
            note="Boleh ditulis singkat, contoh: linkedin.com/in/namamu"
          />
          {/* Akhir Tambahan Data */}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!isInfoDirty}
            className="px-5 py-2.5 rounded-[8px] bg-[#148F89] text-white text-[13px] font-semibold hover:bg-[#117A75] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#148F89]"
          >
            Simpan Perubahan
          </button>
        </div>
      </motion.form>

      {/* CV sekarang diminta pas daftar bootcamp (per pendaftaran, biar selalu
          versi terbaru), bukan sekali-seumur-hidup di profil. Section ini
          dimatikan lewat flag -- bukan dihapus -- supaya gampang dihidupkan
          lagi kalau nanti dibutuhkan. */}
      {SHOW_CV_SECTION && (
        <>
      <motion.div
        {...sectionReveal}
        className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-6 flex flex-col gap-4"
      >
        <div>
          <h3 className="text-white font-semibold text-[15px]">
            CV / Portofolio
          </h3>
          <p className="text-[#9CA3AF] text-[12px] mt-1">
            Membantu mentor mengenalmu lebih baik sebelum sesi mentoring.
          </p>
        </div>

        {cvError && <p className="text-red-400 text-[11px]">{cvError}</p>}

        {cvFileName ? (
          <div className="flex items-center justify-between gap-3 bg-[#0F081C] border border-[#2D2342] rounded-[8px] px-4 py-3">
            <a
              href={cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity"
            >
              <FileText size={18} className="text-[#148F89] shrink-0" />
              <span className="text-white text-[13px] truncate">
                {cvFileName}
              </span>
            </a>
            <div className="flex items-center gap-3 shrink-0">
              <label
                className={`text-[12px] font-medium transition-colors cursor-pointer ${
                  isUploadingCv ? "text-[#6B7280] cursor-wait" : "text-[#9CA3AF] hover:text-white"
                }`}
              >
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  disabled={isUploadingCv}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadCv(file);
                  }}
                />
                {isUploadingCv ? "Mengunggah..." : "Ganti"}
              </label>
              <button
                onClick={handleDeleteCv}
                disabled={isUploadingCv}
                aria-label="Hapus CV"
                className="text-[#9CA3AF] hover:text-red-400 transition-colors disabled:opacity-40"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 border border-dashed border-[#2D2342] rounded-[8px] py-6 text-[#9CA3AF] hover:border-[#148F89]/50 hover:text-white transition-colors text-[13px] cursor-pointer">
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              disabled={isUploadingCv}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadCv(file);
              }}
            />
            <Upload size={16} />
            {isUploadingCv ? "Mengunggah..." : "Unggah CV (PDF, maks 5MB)"}
          </label>
        )}
      </motion.div>

        </>
      )}

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
            Ganti kata sandi secara berkala dan pakai yang kuat untuk menjaga keamanan akunmu.
          </p>
        </div>
        <Link
          href="/user/settings/change-password"
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
              Ingin menghapus akun? Tekan tombol di samping. Kami akan mengirim
              tautan konfirmasi ke email kamu, dan akun baru dihapus setelah kamu
              membuka tautan tersebut. Riwayat transaksi dan sertifikat tetap
              tersimpan.
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

      {/* --- MODAL: Konfirmasi Hapus Akun --- */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={closeDeleteModal}
          >
            <motion.div
              initial={{
                opacity: 0,
                scale: shouldReduceMotion ? 1 : 0.96,
                y: shouldReduceMotion ? 0 : 12,
              }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{
                opacity: 0,
                scale: shouldReduceMotion ? 1 : 0.96,
                y: shouldReduceMotion ? 0 : 12,
              }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#170F26] w-full max-w-[420px] rounded-[16px] border border-red-500/30 shadow-2xl p-6 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-[17px]">
                  Hapus Akun
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
                Kami akan mengirim{" "}
                <span className="text-white font-medium">tautan konfirmasi</span>{" "}
                ke email{" "}
                <span className="text-white font-medium">{email || "kamu"}</span>.
                Akun kamu{" "}
                <span className="text-white font-medium">
                  baru dihapus setelah kamu membuka tautan pada email tersebut
                </span>
                , sehingga akun aman dari penghapusan yang tidak disengaja.
                Riwayat transaksi dan sertifikat tetap tersimpan.
              </p>
              <div className="flex items-center gap-3 mt-1">
                <button
                  onClick={closeDeleteModal}
                  className="flex-1 py-2.5 rounded-[8px] border border-[#2D2342] text-[#9CA3AF] text-[13px] font-semibold hover:text-white transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount}
                  className="flex-1 py-2.5 rounded-[8px] bg-red-500 text-white text-[13px] font-semibold hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isDeletingAccount ? "Mengirim..." : "Kirim Link Konfirmasi"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
