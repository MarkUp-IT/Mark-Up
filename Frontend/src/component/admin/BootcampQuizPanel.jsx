"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Pencil, Check, X, ShieldCheck } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/formErrors";
import FieldLabel from "./FieldLabel";

const EMPTY_FORM = {
  question_text: "", choice_a: "", choice_b: "", choice_c: "", choice_d: "", correct_choice: "a",
};

const CHOICE_KEYS = ["a", "b", "c", "d"];

export default function BootcampQuizPanel({ productId }) {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddQuiz, setShowAddQuiz] = useState(false);
  const [quizForm, setQuizForm] = useState({
    title: "", duration_minutes: 30, passing_score_percent: 70, timeline_item_id: "",
  });
  const [savingQuiz, setSavingQuiz] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const fetchQuizzes = useCallback(async () => {
    setLoading(true);
    try {
      const [quizRes, tlRes] = await Promise.all([
        apiRequest(`/api/products/${productId}/quizzes/`),
        apiRequest(`/api/products/${productId}/timeline/`, { auth: false }),
      ]);
      const list = quizRes?.quizzes || [];
      setQuizzes(list);
      setTimeline(tlRes?.timeline || []);
      setSelectedQuizId((cur) => (cur && list.some((q) => q.id === cur) ? cur : list[0]?.id || null));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  // Soal diambil per tes -- kunci jawaban cuma ikut di endpoint admin ini.
  const fetchData = useCallback(async () => {
    if (!selectedQuizId) {
      setQuestions([]);
      return;
    }
    try {
      const res = await apiRequest(`/api/products/bootcamp-quizzes/${selectedQuizId}/questions/`);
      setQuestions(res?.questions || []);
    } catch (err) {
      console.error(err);
    }
  }, [selectedQuizId]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddQuiz = async () => {
    if (savingQuiz || !quizForm.title.trim()) return;
    setSavingQuiz(true);
    try {
      const res = await apiRequest(`/api/products/${productId}/quizzes/add/`, {
        method: "POST",
        body: {
          title: quizForm.title.trim(),
          duration_minutes: Number(quizForm.duration_minutes) || 30,
          passing_score_percent: Number(quizForm.passing_score_percent) || 0,
          timeline_item_id: quizForm.timeline_item_id || null,
        },
      });
      toast.success("Tes Dibuat");
      setShowAddQuiz(false);
      setQuizForm({ title: "", duration_minutes: 30, passing_score_percent: 70, timeline_item_id: "" });
      await fetchQuizzes();
      if (res?.quiz?.id) setSelectedQuizId(res.quiz.id);
    } catch (err) {
      toast.error("Gagal Membuat Tes", { description: extractErrorMessage(err, "Terjadi kesalahan.") });
    } finally {
      setSavingQuiz(false);
    }
  };

  const handleToggleQuizActive = async (quiz) => {
    try {
      await apiRequest(`/api/products/bootcamp-quizzes/${quiz.id}/`, {
        method: "PATCH",
        body: { is_active: !quiz.is_active },
      });
      fetchQuizzes();
    } catch (err) {
      toast.error("Gagal Mengubah Tes", { description: extractErrorMessage(err, "Terjadi kesalahan.") });
    }
  };

  const handleDeleteQuiz = async (quiz) => {
    if (!confirm(`Hapus tes "${quiz.title}" beserta soal-soalnya?`)) return;
    try {
      await apiRequest(`/api/products/bootcamp-quizzes/${quiz.id}/`, { method: "DELETE" });
      toast.success("Tes Dihapus");
      fetchQuizzes();
    } catch (err) {
      // Backend nolak kalau tesnya udah dikerjakan peserta -- pesannya udah jelas.
      toast.error("Gagal Menghapus Tes", { description: extractErrorMessage(err, "Terjadi kesalahan.") });
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowAdd(true);
  };

  const openEdit = (q) => {
    setEditingId(q.id);
    setForm({
      question_text: q.question_text, choice_a: q.choice_a, choice_b: q.choice_b,
      choice_c: q.choice_c, choice_d: q.choice_d, correct_choice: q.correct_choice,
    });
    setShowAdd(true);
  };

  const isFormValid = form.question_text.trim() && form.choice_a.trim() && form.choice_b.trim()
    && form.choice_c.trim() && form.choice_d.trim();

  const handleSave = async () => {
    if (!isFormValid || saving) return;
    setSaving(true);
    try {
      const body = {
        question_text: form.question_text.trim(),
        choice_a: form.choice_a.trim(),
        choice_b: form.choice_b.trim(),
        choice_c: form.choice_c.trim(),
        choice_d: form.choice_d.trim(),
        correct_choice: form.correct_choice,
      };
      if (editingId) {
        await apiRequest(`/api/products/bootcamp-quiz-questions/${editingId}/`, { method: "PATCH", body });
      } else {
        await apiRequest(`/api/products/bootcamp-quizzes/${selectedQuizId}/questions/add/`, { method: "POST", body });
      }
      toast.success("Soal Tersimpan");
      setShowAdd(false);
      fetchData();
    } catch (err) {
      toast.error("Gagal Menyimpan Soal", { description: extractErrorMessage(err, "Terjadi kesalahan.") });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Hapus soal ini? Soal yang sudah pernah dikerjakan peserta tetap tersimpan di riwayat jawaban mereka.")) return;
    try {
      await apiRequest(`/api/products/bootcamp-quiz-questions/${id}/`, { method: "DELETE" });
      toast.success("Soal Dihapus");
      fetchData();
    } catch (err) {
      toast.error("Gagal Menghapus Soal", { description: extractErrorMessage(err, "Terjadi kesalahan.") });
    }
  };

  const toggleActive = async (q) => {
    try {
      await apiRequest(`/api/products/bootcamp-quiz-questions/${q.id}/`, {
        method: "PATCH", body: { is_active: !q.is_active },
      });
      fetchData();
    } catch (err) {
      toast.error("Gagal Memperbarui Soal", { description: extractErrorMessage(err, "Terjadi kesalahan.") });
    }
  };

  if (loading) return null;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-[15px] text-[#0F172A]">Tes Seleksi</h2>
        <button
          onClick={() => setShowAddQuiz((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#148F89] text-white text-[12px] font-semibold hover:bg-[#117A75] transition-colors"
        >
          <Plus size={13} /> Tambah Tes
        </button>
      </div>
      <p className="text-[#94A3B8] text-[11.5px] -mt-2">
        Satu bootcamp dapat memiliki beberapa tes, misalnya tahap awal dan tahap akhir. Setiap tes
        dapat ditautkan ke milestone timeline, dan setiap peserta hanya memperoleh satu kali
        percobaan untuk masing-masing tes.
      </p>

      {showAddQuiz && (
        <div className="flex flex-col gap-2.5 p-3.5 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0]">
          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Judul Tes</FieldLabel>
            <input
              type="text"
              placeholder="Contoh: Tes Seleksi Tahap 1"
              value={quizForm.title}
              onChange={(e) => setQuizForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full bg-white border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1 flex flex-col gap-1.5">
              <FieldLabel hint="5-180">Durasi Pengerjaan (menit)</FieldLabel>
              <input
                type="number" min={5} max={180}
                value={quizForm.duration_minutes}
                onChange={(e) => setQuizForm((f) => ({ ...f, duration_minutes: e.target.value }))}
                className="w-full bg-white border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
              />
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              <FieldLabel hint="0-100">Ambang Nilai Lulus (%)</FieldLabel>
              <input
                type="number" min={0} max={100}
                value={quizForm.passing_score_percent}
                onChange={(e) => setQuizForm((f) => ({ ...f, passing_score_percent: e.target.value }))}
                className="w-full bg-white border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
              />
            </div>
          </div>
          <span className="text-[#94A3B8] text-[10.5px] -mt-1">
            Ambang nilai hanya menandai lulus atau tidak secara otomatis. Keputusan akhir menerima
            atau menolak pendaftar tetap sepenuhnya di tangan admin.
          </span>
          <div className="flex flex-col gap-1.5">
            <FieldLabel hint="opsional">Tautkan ke Milestone Timeline</FieldLabel>
            <select
              value={quizForm.timeline_item_id}
              onChange={(e) => setQuizForm((f) => ({ ...f, timeline_item_id: e.target.value }))}
              className="w-full bg-white border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
            >
              <option value="">Tanpa tautan milestone</option>
              {timeline.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddQuiz(false)}
              className="flex-1 h-9 rounded-[6px] border border-[#E2E8F0] text-[#64748B] text-[12.5px] font-semibold hover:bg-white transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleAddQuiz}
              disabled={!quizForm.title.trim() || savingQuiz}
              className="flex-1 h-9 rounded-[6px] bg-[#148F89] text-white text-[12.5px] font-semibold hover:bg-[#117A75] transition-colors disabled:opacity-50"
            >
              {savingQuiz ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      )}

      {quizzes.length === 0 ? (
        <p className="text-[#94A3B8] text-[12.5px] italic">Belum ada tes. Tambahkan tes terlebih dahulu sebelum menyusun soal.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {quizzes.map((qz) => (
            <div
              key={qz.id}
              className={`flex items-center justify-between gap-2 px-3 py-2 rounded-[8px] border cursor-pointer transition-colors ${
                selectedQuizId === qz.id ? "border-[#148F89] bg-[#148F89]/5" : "border-[#E2E8F0] hover:border-[#148F89]/40"
              }`}
              onClick={() => setSelectedQuizId(qz.id)}
            >
              <div className="flex flex-col min-w-0">
                <span className="text-[#1E293B] font-semibold text-[12.5px] truncate">
                  {qz.title}
                  {!qz.is_active && <span className="text-[#94A3B8] font-normal"> (nonaktif)</span>}
                </span>
                <span className="text-[#64748B] text-[11px]">
                  {qz.question_count} soal &middot; {qz.duration_minutes} menit &middot; lulus &ge; {qz.passing_score_percent}%
                  {qz.timeline_item_title ? ` · ${qz.timeline_item_title}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); handleToggleQuizActive(qz); }}
                  className="px-2 py-1 rounded-[6px] text-[#64748B] text-[11px] font-semibold hover:text-[#148F89] hover:bg-[#148F89]/5 transition-colors"
                >
                  {qz.is_active ? "Nonaktifkan" : "Aktifkan"}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteQuiz(qz); }}
                  className="p-1.5 rounded-[6px] text-[#DC2626] hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedQuizId && (
        <div className="flex items-center justify-between border-t border-[#E2E8F0] pt-4">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-[14px] text-[#0F172A]">Bank Soal</h3>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#148F89]/10 text-[#148F89] text-[10.5px] font-semibold">
              <ShieldCheck size={11} /> {questions.length} soal
            </span>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#148F89] text-white text-[12px] font-semibold hover:bg-[#117A75] transition-colors"
          >
            <Plus size={13} /> Tambah Soal
          </button>
        </div>
      )}

      {questions.length === 0 ? (
        <p className="text-[#94A3B8] text-[12.5px] italic">Belum ada soal. Peserta tidak dapat memulai tes sebelum tersedia minimal satu soal.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {questions.map((q, idx) => (
            <div key={q.id} className={`flex flex-col gap-2 px-3.5 py-2.5 rounded-[8px] border ${q.is_active ? "border-[#E2E8F0]" : "border-[#E2E8F0] bg-[#F8FAFC] opacity-60"}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-[#1E293B] font-medium text-[13px]">
                  <span className="text-[#94A3B8] font-normal">{idx + 1}.</span> {q.question_text}
                </p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => toggleActive(q)}
                    className={`px-2 py-1 rounded-full text-[10px] font-bold ${q.is_active ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#F1F5F9] text-[#64748B]"}`}
                  >
                    {q.is_active ? "Aktif" : "Nonaktif"}
                  </button>
                  <button onClick={() => openEdit(q)} className="p-1.5 rounded-[6px] text-[#64748B] hover:text-[#148F89] hover:bg-[#148F89]/5 transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(q.id)} className="p-1.5 rounded-[6px] text-[#DC2626] hover:bg-red-50 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                {CHOICE_KEYS.map((key) => (
                  <span
                    key={key}
                    className={`text-[11.5px] px-2 py-1 rounded-[5px] ${q.correct_choice === key ? "bg-[#DCFCE7] text-[#166534] font-semibold" : "text-[#64748B]"}`}
                  >
                    {key.toUpperCase()}. {q[`choice_${key}`]}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="flex flex-col gap-2.5 p-3.5 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0]">
          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Pertanyaan</FieldLabel>
            <textarea
              placeholder="Tulis pertanyaan di sini"
              value={form.question_text}
              onChange={(e) => setForm((f) => ({ ...f, question_text: e.target.value }))}
              rows={2}
              className="w-full bg-white border border-[#E2E8F0] rounded-[6px] px-3 py-2 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89] resize-none"
            />
          </div>
          <FieldLabel hint="klik huruf untuk menandai kunci jawaban" required>Pilihan Jawaban</FieldLabel>
          {CHOICE_KEYS.map((key) => (
            <div key={key} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, correct_choice: key }))}
                title="Tandai sebagai kunci jawaban"
                className={`shrink-0 w-7 h-9 rounded-[6px] text-[12px] font-bold border transition-colors ${
                  form.correct_choice === key
                    ? "bg-[#148F89] text-white border-[#148F89]"
                    : "bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#148F89]"
                }`}
              >
                {key.toUpperCase()}
              </button>
              <input
                type="text"
                placeholder={`Pilihan ${key.toUpperCase()}`}
                value={form[`choice_${key}`]}
                onChange={(e) => setForm((f) => ({ ...f, [`choice_${key}`]: e.target.value }))}
                className="flex-1 bg-white border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
              />
            </div>
          ))}
          <p className="text-[#94A3B8] text-[10.5px]">
            Huruf yang berwarna hijau adalah kunci jawaban. Klik huruf lain untuk memindahkannya.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAdd(false)}
              className="flex-1 h-9 rounded-[6px] border border-[#E2E8F0] text-[#64748B] text-[12.5px] font-semibold hover:bg-white transition-colors"
            >
              <X size={13} className="inline mr-1" /> Batal
            </button>
            <button
              onClick={handleSave}
              disabled={!isFormValid || saving}
              className="flex-1 h-9 rounded-[6px] bg-[#148F89] text-white text-[12.5px] font-semibold hover:bg-[#117A75] transition-colors disabled:opacity-50"
            >
              <Check size={13} className="inline mr-1" /> {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
