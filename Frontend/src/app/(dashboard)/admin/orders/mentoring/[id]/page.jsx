"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Users, Check } from "lucide-react";
import EmptyState from "@/component/admin/EmptyState";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/formErrors";

const STATUS_META = {
  completed: { label: "SELESAI", className: "bg-[#DCFCE7] text-[#166534]" },
  scheduled: { label: "TERJADWAL", className: "bg-[#DBEAFE] text-[#1D4ED8]" },
  waiting_schedule: { label: "BELUM DIJADWALKAN", className: "bg-[#FEF3C7] text-[#92400E]" },
};

function formatDateTime(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta",
  }) + " WIB";
}

export default function MentoringOrderDetail() {
  const params = useParams();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState({});
  const [saving, setSaving] = useState(null);

  const fetchDetail = useCallback(async () => {
    try {
      const res = await apiRequest(`/api/products/mentoring-orders/${params.id}/`);
      setPkg(res);
      const nextLinks = {};
      (res?.sessions || []).forEach((s) => { nextLinks[s.id] = s.zoom_link || ""; });
      setLinks(nextLinks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const saveLink = async (sessionId) => {
    setSaving(sessionId);
    try {
      await apiRequest(`/api/products/mentoring-orders/sessions/${sessionId}/`, {
        method: "PATCH",
        body: { zoom_link: links[sessionId] },
      });
      fetchDetail();
      toast.success("Link Disimpan", { description: "Link sesi berhasil diperbarui." });
    } catch (err) {
      toast.error("Gagal Menyimpan Link", {
        description: extractErrorMessage(err, "Terjadi kesalahan."),
      });
    } finally {
      setSaving(null);
    }
  };

  const markComplete = async (sessionId) => {
    setSaving(sessionId);
    try {
      await apiRequest(`/api/products/mentoring-orders/sessions/${sessionId}/`, {
        method: "PATCH",
        body: { status: "completed" },
      });
      fetchDetail();
      toast.success("Sesi Ditandai Selesai");
    } catch (err) {
      toast.error("Gagal Menandai Sesi Selesai", {
        description: extractErrorMessage(err, "Terjadi kesalahan."),
      });
    } finally {
      setSaving(null);
    }
  };

  // Koreksi: sesi yang (otomatis/keliru) ditandai selesai ternyata tidak jadi
  // berlangsung. Honor mentornya ikut dibatalkan di server.
  const batalkanSelesai = async (sessionId) => {
    if (!window.confirm("Batalkan status selesai sesi ini? Honor mentor untuk sesi ini akan ikut dibatalkan.")) return;
    setSaving(sessionId);
    try {
      await apiRequest(`/api/products/mentoring-orders/sessions/${sessionId}/`, {
        method: "PATCH",
        body: { status: "scheduled" },
      });
      fetchDetail();
      toast.success("Status Selesai Dibatalkan");
    } catch (err) {
      toast.error("Gagal Membatalkan", {
        description: extractErrorMessage(err, "Terjadi kesalahan."),
      });
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <>
        <p className="text-[#64748B] text-[14px]">Memuat...</p>
      </>
    );
  }

  if (!pkg) {
    return (
      <>
        <Link
          href="/admin/orders/mentoring"
          className="inline-flex items-center gap-2 text-[#64748B] hover:text-[#148F89] text-[13px] font-medium transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          Kembali ke Daftar Paket
        </Link>
        <p className="text-[#64748B] text-[14px]">
          Paket dengan ID &ldquo;{params?.id}&rdquo; tidak ditemukan.
        </p>
      </>
    );
  }

  return (
    <>
      <Link
        href="/admin/orders/mentoring"
        className="inline-flex items-center gap-2 text-[#64748B] hover:text-[#148F89] text-[13px] font-medium transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        Kembali ke Daftar Paket
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bold text-[22px] text-[#0F172A]">{pkg.product_title}</h1>
          <p className="text-[#64748B] text-[14px] mt-1">ID Paket: {params?.id}</p>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-[12px] px-5 py-4 flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider">User</span>
            <span className="text-[#1E293B] font-semibold text-[13px]">{pkg.user_name}</span>
            <span className="text-[#94A3B8] text-[11px]">{pkg.user_email}</span>
            {pkg.user_phone && <span className="text-[#94A3B8] text-[11px]">WA {pkg.user_phone}</span>}
          </div>
          <div className="w-px self-stretch bg-[#E2E8F0]" />
          <div className="flex flex-col">
            <span className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider">Mentor</span>
            <span className="text-[#1E293B] font-semibold text-[13px] flex items-center gap-1.5">
              <Users size={13} className="text-[#148F89]" />
              {pkg.sessions[0]?.mentor_name || "-"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-[16px] font-semibold text-[#0F172A]">Daftar Sesi</h2>

        {pkg.sessions.length === 0 ? (
          <EmptyState message="Belum ada sesi untuk paket mentoring ini." />
        ) : (
        <div className="flex flex-col gap-3">
          {pkg.sessions.map((session) => (
            <div
              key={session.id}
              className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 flex items-center justify-between gap-4 flex-wrap shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div
                  style={{ width: "40px", height: "40px" }}
                  className="rounded-full bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center shrink-0 text-[#64748B] font-bold text-[14px]"
                >
                  {session.order}
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-[14px] text-[#1E293B]">Sesi {session.order}</span>
                  {session.start_time ? (
                    <span className="text-[#64748B] text-[13px]">{formatDateTime(session.start_time)}</span>
                  ) : (
                    <span className="text-[#94A3B8] text-[13px] italic">Menunggu user pilih jadwal</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 flex-wrap max-w-full">
                <span className={`inline-flex px-3 py-1.5 text-[10px] rounded-full font-bold whitespace-nowrap ${STATUS_META[session.status].className}`}>
                  {STATUS_META[session.status].label}
                </span>

                {session.status === "scheduled" && (
                  <div className="flex items-center gap-2 max-w-full">
                    <input
                      type="text"
                      placeholder="Masukkan link zoom..."
                      value={links[session.id] || ""}
                      onChange={(e) => setLinks((prev) => ({ ...prev, [session.id]: e.target.value }))}
                      style={{ width: "200px", height: "38px" }}
                      className="min-w-0 shrink bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-3 text-[12px] text-[#334155] outline-none focus:border-[#148F89] transition-colors"
                    />
                    <button
                      onClick={() => saveLink(session.id)}
                      disabled={saving === session.id}
                      style={{ width: "38px", height: "38px" }}
                      className="rounded-[8px] flex items-center justify-center bg-[#148F89] text-white hover:bg-[#117A75] transition-colors shrink-0 disabled:opacity-50"
                      title="Simpan link"
                    >
                      <Send size={15} />
                    </button>
                    <button
                      onClick={() => markComplete(session.id)}
                      disabled={saving === session.id}
                      style={{ height: "38px" }}
                      className="px-3 rounded-[8px] flex items-center gap-1.5 border border-[#148F89]/40 text-[#148F89] text-[12px] font-semibold hover:bg-[#148F89]/10 transition-colors shrink-0 disabled:opacity-50"
                      title="Tandai selesai"
                    >
                      <Check size={14} />
                      Selesai
                    </button>
                  </div>
                )}
                {session.status === "completed" && (
                  <button
                    onClick={() => batalkanSelesai(session.id)}
                    disabled={saving === session.id}
                    className="text-[#94A3B8] hover:text-[#DC2626] text-[12px] font-medium underline underline-offset-2 transition-colors disabled:opacity-50"
                    title="Sesi ternyata tidak berlangsung? Batalkan status selesainya."
                  >
                    Batalkan Selesai
                  </button>
                )}
                {session.status === "scheduled" && !session.zoom_link && session.zoom_error && (
                  <span className="basis-full text-[#B45309] text-[11.5px]">
                    Link Zoom otomatis gagal dibuat: {session.zoom_error}
                  </span>
                )}
                {session.feedback && (
                  <div className="basis-full bg-[#FFFBEB] border border-[#FDE68A] rounded-[8px] px-3 py-2 text-[12px]">
                    <span className="font-semibold text-[#92400E]">
                      Feedback mentee: {"★".repeat(session.feedback.rating)}
                      <span className="text-[#E5D3A6]">{"★".repeat(5 - session.feedback.rating)}</span>{" "}
                      ({session.feedback.rating}/5)
                    </span>
                    {session.feedback.comment && (
                      <p className="text-[#78350F] mt-0.5 whitespace-pre-line">&ldquo;{session.feedback.comment}&rdquo;</p>
                    )}
                  </div>
                )}
                {session.status === "completed" && !session.feedback && (
                  <span className="basis-full text-[#94A3B8] text-[11.5px] italic">Mentee belum memberi feedback.</span>
                )}
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-[16px] font-semibold text-[#0F172A]">Riwayat Kabar Otomatis</h2>
          <p className="text-[#64748B] text-[12.5px] mt-0.5">
            Pengingat dan kabar yang sudah dikirim sistem (email + notifikasi) untuk paket ini.
          </p>
        </div>
        {(pkg.messages || []).length === 0 ? (
          <p className="text-[#94A3B8] text-[13px] italic">Belum ada kabar otomatis yang terkirim.</p>
        ) : (
          <div className="bg-white border border-[#E2E8F0] rounded-[12px] divide-y divide-[#E2E8F0] shadow-sm">
            {pkg.messages.map((m, idx) => (
              <div key={idx} className="px-5 py-3 flex items-center justify-between gap-3 flex-wrap text-[12.5px]">
                <div className="flex flex-col min-w-0">
                  <span className="text-[#1E293B] font-medium">
                    {m.label}
                    {m.session_order ? ` (Sesi ${m.session_order})` : ""}
                  </span>
                  {m.recipient && m.recipient !== "tim" && (
                    <span className="text-[#94A3B8] text-[11.5px] truncate">ke {m.recipient}</span>
                  )}
                </div>
                <span className="text-[#64748B] whitespace-nowrap">{formatDateTime(m.sent_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
