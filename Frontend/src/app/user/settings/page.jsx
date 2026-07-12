"use client";

import { useState } from "react";
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
import DashboardLayout from "@/component/user/DashboardLayout";

function Field({ label, value, onChange, disabled, note, type = "text" }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[#E2E8F0] text-[13px] font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        disabled={disabled}
        className={`w-full bg-[#0F081C] border border-[#2D2342] rounded-[8px] px-4 py-3 text-[14px] outline-none transition-colors ${
          disabled
            ? "text-[#6B7280] cursor-not-allowed"
            : "text-white focus:border-[#148F89]/60"
        }`}
      />
      {note && <p className="text-[#6B7280] text-[11px]">{note}</p>}
    </div>
  );
}

export default function Settings() {
  const shouldReduceMotion = useReducedMotion();

  // TODO: ganti semua data ini dengan data user dari session/auth context
  const email = "prabrorosub@gmail.com"; // readonly, ganti email lewat support
  const initialInfo = {
    fullName: "Prabroro Subriantoro",
    phone: "0812-3456-7890",
    institution: "Universitas Airlangga",
    currentStatus: "5", // Tambahan Data
    linkedIn: "linkedin.com/in/prabrorosub", // Tambahan Data
  };

  const [fullName, setFullName] = useState(initialInfo.fullName);
  const [phone, setPhone] = useState(initialInfo.phone);
  const [institution, setInstitution] = useState(initialInfo.institution);
  const [currentStatus, setCurrentStatus] = useState(initialInfo.currentStatus); // State Baru
  const [linkedIn, setLinkedIn] = useState(initialInfo.linkedIn); // State Baru

  const [infoSaved, setInfoSaved] = useState(false);

  const [cvFileName, setCvFileName] = useState("CV_Prabroro_2026.pdf");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

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

  const handleSaveInfo = (e) => {
    e.preventDefault();
    // TODO: panggil API update profil beneran
    setInfoSaved(true);
    setTimeout(() => setInfoSaved(false), 3000);
  };

  return (
    <DashboardLayout title="Pengaturan Akun">
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
            JPG atau PNG, maksimal 2MB.
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
            Data ini dipakai di sertifikat dan saat kamu berinteraksi dengan
            mentor.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nama Lengkap" value={fullName} onChange={setFullName} />
          <Field
            label="Email"
            value={email}
            disabled
            type="email"
            note="Hubungi support untuk mengubah email."
          />
          <Field label="Nomor WhatsApp" value={phone} onChange={setPhone} />

          {/* Mulai Tambahan Data Baris #11, #13 */}
          <Field
            label="Universitas / Institusi Asal"
            value={institution}
            onChange={setInstitution}
          />
          <Field
            label="Semester Saat Ini"
            value={currentStatus}
            onChange={setCurrentStatus}
            note="Contoh: Mahasiswa Semester 5, Fresh Graduate, dll."
          />
          <Field
            label="URL LinkedIn"
            value={linkedIn}
            onChange={setLinkedIn}
            type="url"
            note="Format: linkedin.com/in/username"
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
          <AnimatePresence>
            {infoSaved && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[#148F89] text-[12px] font-medium"
              >
                Perubahan tersimpan.
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </motion.form>

      {/* CV / Portofolio */}
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

        {cvFileName ? (
          <div className="flex items-center justify-between gap-3 bg-[#0F081C] border border-[#2D2342] rounded-[8px] px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <FileText size={18} className="text-[#148F89] shrink-0" />
              <span className="text-white text-[13px] truncate">
                {cvFileName}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button className="text-[#9CA3AF] hover:text-white text-[12px] font-medium transition-colors">
                Ganti
              </button>
              <button
                onClick={() => setCvFileName("")}
                aria-label="Hapus CV"
                className="text-[#9CA3AF] hover:text-red-400 transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ) : (
          <button className="flex items-center justify-center gap-2 border border-dashed border-[#2D2342] rounded-[8px] py-6 text-[#9CA3AF] hover:border-[#148F89]/50 hover:text-white transition-colors text-[13px]">
            <Upload size={16} />
            Unggah CV (PDF, maks 5MB)
          </button>
        )}
      </motion.div>

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
            Kata sandi terakhir diubah 3 bulan lalu.
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
              Semua data, sertifikat, dan riwayat transaksi akan dihapus
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
                transaksi, dan data profilmu akan dihapus permanen dari Mark-Up.
              </p>
              <div className="flex flex-col gap-1.5">
                <label className="text-[#E2E8F0] text-[12px]">
                  Ketik <span className="font-bold text-white">HAPUS</span>{" "}
                  untuk konfirmasi
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
      </AnimatePresence>
    </DashboardLayout>
  );
}
