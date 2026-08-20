"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, GripVertical, Mail } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/formErrors";
import FieldLabel from "./FieldLabel";

const PLACEHOLDER_DITERIMA =
  "{nama} {bootcamp} {paket} {total} {commitment_fee} {link_bayar} {catatan_admin}";
const PLACEHOLDER_DITOLAK = "{nama} {bootcamp} {paket} {catatan_admin}";

const CONTOH_DITERIMA =
  "Halo {nama},\n\nSelamat! Kamu diterima di {bootcamp} paket {paket}.\nSilakan lakukan pembayaran {total} melalui:\n{link_bayar}";
const CONTOH_DITOLAK =
  "Halo {nama},\n\nTerima kasih sudah mendaftar {bootcamp}.\nMohon maaf, kali ini kami belum bisa menerimamu.\n\n{catatan_admin}";

/**
 * Panel pengaturan formulir pendaftaran bootcamp.
 *
 * Menggabungkan tiga hal yang selalu dilihat bersamaan: apa yang harus diisi
 * pendaftar, pertanyaannya apa saja, dan apa yang dia terima lewat email
 * setelah diputuskan.
 */
export default function BootcampRegistrationFormPanel({ productId }) {
  const [pengaturan, setPengaturan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menyimpan, setMenyimpan] = useState(false);

  const [tambahTampil, setTambahTampil] = useState(false);
  const [teksBaru, setTeksBaru] = useState("");
  const [bantuanBaru, setBantuanBaru] = useState("");
  const [wajibBaru, setWajibBaru] = useState(true);
  const [batasKataBaru, setBatasKataBaru] = useState(0);

  const [emailDiterimaJudul, setEmailDiterimaJudul] = useState("");
  const [emailDiterimaIsi, setEmailDiterimaIsi] = useState("");
  const [emailDitolakJudul, setEmailDitolakJudul] = useState("");
  const [emailDitolakIsi, setEmailDitolakIsi] = useState("");

  const muat = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/api/products/${productId}/registration-settings/`);
      const s = res?.settings;
      setPengaturan(s);
      setEmailDiterimaJudul(s?.email_accepted_subject || "");
      setEmailDiterimaIsi(s?.email_accepted_body || "");
      setEmailDitolakJudul(s?.email_rejected_subject || "");
      setEmailDitolakIsi(s?.email_rejected_body || "");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    muat();
  }, [muat]);

  const simpanPengaturan = async (perubahan, pesanSukses) => {
    setMenyimpan(true);
    try {
      const res = await apiRequest(`/api/products/${productId}/registration-settings/`, {
        method: "PATCH",
        body: perubahan,
      });
      setPengaturan(res?.settings);
      if (pesanSukses) toast.success(pesanSukses);
    } catch (err) {
      toast.error("Gagal Menyimpan", {
        description: extractErrorMessage(err, "Terjadi kesalahan."),
      });
    } finally {
      setMenyimpan(false);
    }
  };

  const tambahPertanyaan = async () => {
    if (!teksBaru.trim()) return;
    try {
      await apiRequest(`/api/products/${productId}/registration-questions/add/`, {
        method: "POST",
        body: {
          text: teksBaru.trim(),
          helper_text: bantuanBaru.trim(),
          is_required: wajibBaru,
          max_words: Number(batasKataBaru) || 0,
        },
      });
      toast.success("Pertanyaan Ditambahkan");
      setTeksBaru("");
      setBantuanBaru("");
      setWajibBaru(true);
      setBatasKataBaru(0);
      setTambahTampil(false);
      muat();
    } catch (err) {
      toast.error("Gagal Menambah Pertanyaan", {
        description: extractErrorMessage(err, "Terjadi kesalahan."),
      });
    }
  };

  const ubahPertanyaan = async (id, perubahan) => {
    try {
      await apiRequest(`/api/products/registration-questions/${id}/`, {
        method: "PATCH",
        body: perubahan,
      });
      muat();
    } catch (err) {
      toast.error("Gagal Mengubah Pertanyaan", {
        description: extractErrorMessage(err, "Terjadi kesalahan."),
      });
    }
  };

  const hapusPertanyaan = async (id) => {
    if (
      !confirm(
        "Hapus pertanyaan ini? Jawaban yang sudah masuk dari pendaftar TETAP tersimpan dan tetap bisa kamu baca."
      )
    )
      return;
    try {
      await apiRequest(`/api/products/registration-questions/${id}/`, { method: "DELETE" });
      toast.success("Pertanyaan Dihapus");
      muat();
    } catch (err) {
      toast.error("Gagal Menghapus", {
        description: extractErrorMessage(err, "Terjadi kesalahan."),
      });
    }
  };

  if (loading || !pengaturan) return null;

  const pertanyaan = pengaturan.questions || [];
  const adaAktif = pertanyaan.some((q) => q.is_active);
  const tidakAdaIsian =
    !pengaturan.require_commitment_letter && !pengaturan.enable_registration_questions;

  return (
    <div className="flex flex-col gap-5">
      {/* ---------- Apa yang harus diisi pendaftar ---------- */}
      <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 flex flex-col gap-4">
        <div>
          <h2 className="font-bold text-[15px] text-[#0F172A]">Isian Formulir Pendaftaran</h2>
          <p className="text-[#94A3B8] text-[11.5px] mt-1">
            Keduanya bisa dinyalakan bersamaan, salah satu saja, atau dimatikan semua. Dokumen
            syarat dan CV tetap wajib, tidak terpengaruh pengaturan ini.
          </p>
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={pengaturan.require_commitment_letter}
            onChange={(e) =>
              simpanPengaturan({ require_commitment_letter: e.target.checked }, "Pengaturan Disimpan")
            }
            disabled={menyimpan}
            className="accent-[#148F89] mt-0.5"
          />
          <span>
            <span className="text-[13px] text-[#1E293B] font-medium">
              Wajib unggah commitment letter (PDF)
            </span>
            <span className="block text-[#94A3B8] text-[11.5px]">
              Pendaftar menulis sendiri lalu mengunggahnya sebagai satu berkas PDF.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={pengaturan.enable_registration_questions}
            onChange={(e) =>
              simpanPengaturan(
                { enable_registration_questions: e.target.checked },
                "Pengaturan Disimpan"
              )
            }
            disabled={menyimpan}
            className="accent-[#148F89] mt-0.5"
          />
          <span>
            <span className="text-[13px] text-[#1E293B] font-medium">
              Tampilkan pertanyaan isian
            </span>
            <span className="block text-[#94A3B8] text-[11.5px]">
              Pendaftar menjawab langsung di formulir, tanpa perlu membuat PDF.
            </span>
          </span>
        </label>

        {tidakAdaIsian && (
          <p className="text-[#B45309] text-[11.5px] bg-[#FEF3C7] border border-[#FCD34D] rounded-[8px] px-3 py-2">
            Keduanya dimatikan. Pendaftar hanya perlu mengunggah dokumen syarat dan CV.
          </p>
        )}
        {pengaturan.enable_registration_questions && !adaAktif && (
          <p className="text-[#B45309] text-[11.5px] bg-[#FEF3C7] border border-[#FCD34D] rounded-[8px] px-3 py-2">
            Pertanyaan dinyalakan tapi belum ada satu pun yang aktif. Tambahkan di bawah, atau
            formulirnya akan tampil tanpa pertanyaan.
          </p>
        )}
      </div>

      {/* ---------- Daftar pertanyaan ---------- */}
      <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-[15px] text-[#0F172A]">Pertanyaan Pendaftaran</h2>
          <button
            onClick={() => setTambahTampil((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#148F89] text-white text-[12px] font-semibold hover:bg-[#117A75] transition-colors"
          >
            <Plus size={13} /> Tambah Pertanyaan
          </button>
        </div>

        {pertanyaan.length === 0 ? (
          <p className="text-[#94A3B8] text-[12.5px] italic">Belum ada pertanyaan.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {pertanyaan.map((q, i) => (
              <div
                key={q.id}
                className={`flex items-start gap-3 px-3.5 py-3 rounded-[8px] border ${
                  q.is_active ? "border-[#E2E8F0]" : "border-[#E2E8F0] bg-[#F8FAFC] opacity-60"
                }`}
              >
                <span className="flex items-center gap-1.5 shrink-0 text-[#94A3B8] text-[11.5px] font-bold mt-0.5">
                  <GripVertical size={13} /> {i + 1}
                </span>
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <p className="text-[#1E293B] text-[13px] font-medium">{q.text}</p>
                  {q.helper_text && (
                    <p className="text-[#94A3B8] text-[11.5px]">{q.helper_text}</p>
                  )}
                  <p className="text-[#64748B] text-[11px]">
                    {q.is_required ? "Wajib dijawab" : "Boleh dilewati"}
                    {q.max_words > 0
                      ? ` · maksimal ${q.max_words} kata`
                      : " · tanpa batas kata"}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => ubahPertanyaan(q.id, { is_active: !q.is_active })}
                    className="px-2 py-1 rounded-[6px] text-[#64748B] text-[11px] font-semibold hover:text-[#148F89] hover:bg-[#148F89]/5 transition-colors"
                  >
                    {q.is_active ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                  <button
                    onClick={() => hapusPertanyaan(q.id)}
                    className="p-1.5 rounded-[6px] text-[#DC2626] hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tambahTampil && (
          <div className="flex flex-col gap-2.5 p-3.5 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Pertanyaan</FieldLabel>
              <textarea
                rows={2}
                value={teksBaru}
                onChange={(e) => setTeksBaru(e.target.value)}
                placeholder="Contoh: Kenapa kamu ingin mengikuti bootcamp ini?"
                className="w-full bg-white border border-[#E2E8F0] rounded-[6px] px-3 py-2 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89] resize-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel hint="opsional">Keterangan Kecil</FieldLabel>
              <input
                type="text"
                value={bantuanBaru}
                onChange={(e) => setBantuanBaru(e.target.value)}
                placeholder="Contoh: Ceritakan sespesifik mungkin"
                className="w-full bg-white border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
              />
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1 flex flex-col gap-1.5">
                <FieldLabel hint="0 = tanpa batas">Batas Kata Jawaban</FieldLabel>
                <input
                  type="number"
                  min={0}
                  value={batasKataBaru}
                  onChange={(e) => setBatasKataBaru(e.target.value)}
                  className="w-full bg-white border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
                />
              </div>
              <label className="flex items-center gap-2 h-9 px-3 rounded-[6px] border border-[#E2E8F0] bg-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={wajibBaru}
                  onChange={(e) => setWajibBaru(e.target.checked)}
                  className="accent-[#148F89]"
                />
                <span className="text-[12.5px] text-[#1E293B]">Wajib dijawab</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setTambahTampil(false)}
                className="flex-1 h-9 rounded-[6px] border border-[#E2E8F0] text-[#64748B] text-[12.5px] font-semibold hover:bg-white transition-colors"
              >
                Batal
              </button>
              <button
                onClick={tambahPertanyaan}
                disabled={!teksBaru.trim()}
                className="flex-1 h-9 rounded-[6px] bg-[#148F89] text-white text-[12.5px] font-semibold hover:bg-[#117A75] transition-colors disabled:opacity-50"
              >
                Simpan
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ---------- Email hasil seleksi ---------- */}
      <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Mail size={16} className="text-[#148F89]" />
          <h2 className="font-bold text-[15px] text-[#0F172A]">Email Hasil Seleksi</h2>
        </div>
        <p className="text-[#94A3B8] text-[11.5px] -mt-2">
          Dikirim otomatis begitu kamu menerima atau menolak pendaftar.
          <span className="text-[#64748B]"> Kosongkan isinya untuk memakai teks bawaan.</span>
        </p>

        <div className="flex flex-col gap-2.5">
          <FieldLabel>Saat Pendaftar DITERIMA</FieldLabel>
          <input
            type="text"
            value={emailDiterimaJudul}
            onChange={(e) => setEmailDiterimaJudul(e.target.value)}
            placeholder="Judul email, mis. Selamat! Kamu diterima di {bootcamp}"
            className="w-full bg-white border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
          />
          <textarea
            rows={7}
            value={emailDiterimaIsi}
            onChange={(e) => setEmailDiterimaIsi(e.target.value)}
            placeholder={CONTOH_DITERIMA}
            className="w-full bg-white border border-[#E2E8F0] rounded-[6px] px-3 py-2 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89] resize-y font-mono"
          />
          <p className="text-[#94A3B8] text-[11px]">
            Bisa dipakai:{" "}
            <span className="font-mono text-[#64748B]">{PLACEHOLDER_DITERIMA}</span>
          </p>
        </div>

        <div className="flex flex-col gap-2.5 border-t border-[#E2E8F0] pt-4">
          <FieldLabel>Saat Pendaftar DITOLAK</FieldLabel>
          <input
            type="text"
            value={emailDitolakJudul}
            onChange={(e) => setEmailDitolakJudul(e.target.value)}
            placeholder="Judul email, mis. Hasil seleksi {bootcamp}"
            className="w-full bg-white border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
          />
          <textarea
            rows={7}
            value={emailDitolakIsi}
            onChange={(e) => setEmailDitolakIsi(e.target.value)}
            placeholder={CONTOH_DITOLAK}
            className="w-full bg-white border border-[#E2E8F0] rounded-[6px] px-3 py-2 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89] resize-y font-mono"
          />
          <p className="text-[#94A3B8] text-[11px]">
            Bisa dipakai: <span className="font-mono text-[#64748B]">{PLACEHOLDER_DITOLAK}</span>
          </p>
        </div>

        <button
          onClick={() =>
            simpanPengaturan(
              {
                email_accepted_subject: emailDiterimaJudul,
                email_accepted_body: emailDiterimaIsi,
                email_rejected_subject: emailDitolakJudul,
                email_rejected_body: emailDitolakIsi,
              },
              "Teks Email Disimpan"
            )
          }
          disabled={menyimpan}
          className="h-9 rounded-[6px] bg-[#148F89] text-white text-[12.5px] font-semibold hover:bg-[#117A75] transition-colors disabled:opacity-50"
        >
          {menyimpan ? "Menyimpan..." : "Simpan Teks Email"}
        </button>
      </div>
    </div>
  );
}
