"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Pencil, Check, X, ShieldCheck } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/formErrors";

const EMPTY_FORM = {
  question_text: "", choice_a: "", choice_b: "", choice_c: "", choice_d: "", correct_choice: "a",
};

const CHOICE_KEYS = ["a", "b", "c", "d"];

export default function BootcampQuizPanel({ productId }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/api/products/${productId}/quiz-questions/`);
      setQuestions(res?.questions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        await apiRequest(`/api/products/${productId}/quiz-questions/add/`, { method: "POST", body });
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
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-[15px] text-[#0F172A]">Bank Soal Tes BCC</h2>
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
      <p className="text-[#94A3B8] text-[11.5px] -mt-2">
        Semua pendaftar Mentee dapat soal yang persis sama -- yang diacak cuma urutan tampil soal & pilihan jawaban per orang.
      </p>

      {questions.length === 0 ? (
        <p className="text-[#94A3B8] text-[12.5px] italic">Belum ada soal. Peserta gak bisa mulai tes sebelum ada minimal 1 soal.</p>
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
          <textarea
            placeholder="Pertanyaan"
            value={form.question_text}
            onChange={(e) => setForm((f) => ({ ...f, question_text: e.target.value }))}
            rows={2}
            className="w-full bg-white border border-[#E2E8F0] rounded-[6px] px-3 py-2 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89] resize-none"
          />
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
          <p className="text-[#94A3B8] text-[10.5px]">Klik huruf di kiri buat tandai pilihan jawaban yang benar.</p>
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
