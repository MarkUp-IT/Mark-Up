"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Check, Clock, ShieldCheck, AlertTriangle } from "lucide-react";
import Navbar from "@/component/Navbar";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";

function formatCountdown(totalSeconds) {
  if (totalSeconds <= 0) return "00:00";
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function BootcampQuizPage() {
  const params = useParams();
  const { productId, registrationId } = params;

  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const autoSubmitTriggered = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiRequest(`/api/products/bootcamp-registrations/${registrationId}/quiz/start/`, {
          method: "POST",
        });
        if (cancelled) return;
        setAttempt(res.attempt);
        const initialAnswers = {};
        res.attempt.questions.forEach((q) => {
          if (q.selected_choice) initialAnswers[q.question_id] = q.selected_choice;
        });
        setAnswers(initialAnswers);
      } catch (err) {
        if (!cancelled) setError(err?.message || "Gagal memuat tes.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [registrationId]);

  const handleSubmit = useCallback(async () => {
    if (!attempt || submitting) return;
    setSubmitting(true);
    try {
      const res = await apiRequest(`/api/products/bootcamp-quiz-attempts/${attempt.id}/submit/`, { method: "POST" });
      setAttempt(res.attempt);
      toast.success("Tes Berhasil Dikumpulkan", { description: "Hasil seleksi akan diinformasikan admin." });
    } catch (err) {
      toast.error("Gagal Mengumpulkan Tes", { description: err?.message || "Coba lagi." });
    } finally {
      setSubmitting(false);
    }
  }, [attempt, submitting]);

  // Countdown -- tampilan doang, deadline sebenarnya ditegakkan server.
  useEffect(() => {
    if (!attempt || attempt.status !== "in_progress") return;
    const deadline = new Date(attempt.deadline).getTime();

    const tick = () => {
      const secs = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setRemainingSeconds(secs);
      if (secs <= 0 && !autoSubmitTriggered.current) {
        autoSubmitTriggered.current = true;
        handleSubmit();
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [attempt, handleSubmit]);

  const handleSelect = async (questionId, choiceKey) => {
    if (!attempt || attempt.status !== "in_progress" || submitting) return;
    const prev = answers[questionId];
    setAnswers((a) => ({ ...a, [questionId]: choiceKey }));
    try {
      await apiRequest(`/api/products/bootcamp-quiz-attempts/${attempt.id}/answer/`, {
        method: "POST",
        body: { question_id: questionId, selected_choice: choiceKey },
      });
    } catch (err) {
      setAnswers((a) => ({ ...a, [questionId]: prev }));
      toast.error("Gagal Menyimpan Jawaban", { description: err?.message || "Coba pilih lagi." });
    }
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = attempt?.questions?.length || 0;
  const isDone = attempt && attempt.status !== "in_progress";

  return (
    <div className="w-full min-h-screen bg-[#0F081C] font-inter text-white">
      <Navbar variant="solid" />

      <div className="max-w-[720px] mx-auto px-4 pt-32 pb-16 flex flex-col gap-6">
        {loading ? (
          <p className="text-[#9CA3AF] text-[14px]">Memuat tes...</p>
        ) : error ? (
          <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-6 flex flex-col items-center gap-3 text-center">
            <AlertTriangle size={28} className="text-[#EF4444]" />
            <p className="text-[#E2E8F0] text-[14px]">{error}</p>
            <Link href={`/bootcamp/${productId}/register`} className="text-[#148F89] text-[13px] font-semibold hover:underline">
              Kembali ke halaman pendaftaran
            </Link>
          </div>
        ) : isDone ? (
          <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-8 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-[#148F89]/15 flex items-center justify-center">
              <Check size={26} className="text-[#148F89]" />
            </div>
            <h1 className="font-bold text-[18px]">Tes Sudah Dikumpulkan</h1>
            <p className="text-[#9CA3AF] text-[13px] max-w-[440px]">
              Jawabanmu sudah tersimpan dan tidak bisa diubah lagi. Hasil seleksi akan diinformasikan
              lewat status pendaftaranmu setelah ditinjau admin.
            </p>
            <Link
              href={`/bootcamp/${productId}/register`}
              className="mt-2 px-4 py-2 rounded-[8px] bg-[#148F89] text-white text-[13px] font-semibold hover:bg-[#117A75] transition-colors"
            >
              Kembali ke Halaman Pendaftaran
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-5 flex items-center justify-between gap-4 sticky top-20 z-10">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#148F89]" />
                <div className="flex flex-col">
                  <span className="font-bold text-[14px]">Tes BCC General Knowledge</span>
                  <span className="text-[#9CA3AF] text-[11.5px]">{answeredCount} / {totalQuestions} soal dijawab</span>
                </div>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] font-bold text-[13px] ${remainingSeconds <= 60 ? "bg-[#EF4444]/15 text-[#EF4444]" : "bg-[#148F89]/15 text-[#148F89]"}`}>
                <Clock size={14} /> {formatCountdown(remainingSeconds)}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {attempt.questions.map((q, idx) => (
                <div key={q.question_id} className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-5 flex flex-col gap-3">
                  <p className="text-[14px] font-medium leading-relaxed">
                    <span className="text-[#9CA3AF]">{idx + 1}.</span> {q.question_text}
                  </p>
                  <div className="flex flex-col gap-2">
                    {q.choices.map((c) => {
                      const selected = answers[q.question_id] === c.key;
                      return (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => handleSelect(q.question_id, c.key)}
                          className={`text-left px-4 py-2.5 rounded-[8px] border text-[13px] transition-colors ${
                            selected
                              ? "border-[#148F89] bg-[#148F89]/10 text-white"
                              : "border-[#2D2342] text-[#E2E8F0] hover:border-[#148F89]/50"
                          }`}
                        >
                          {c.text}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3 rounded-[8px] bg-[#148F89] text-white font-semibold text-[14px] hover:bg-[#117A75] transition-colors disabled:opacity-50"
            >
              {submitting ? "Mengumpulkan..." : "Kumpulkan Jawaban"}
            </button>
            <p className="text-[#6B7280] text-[11px] text-center -mt-3">
              Jawabanmu tersimpan otomatis tiap kamu memilih. Tes akan otomatis dikumpulkan saat waktu habis.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
