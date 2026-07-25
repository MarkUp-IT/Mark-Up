"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Trash2,
  Plus,
  ChevronDown,
  X,
  Check,
  Users,
} from "lucide-react";
import DashboardLayout from "@/component/admin/DashboardLayout";
import EmptyState from "@/component/admin/EmptyState";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/formErrors";

const PARTICIPANT_STATUS_META = {
  completed: { label: "SELESAI", className: "bg-[#DCFCE7] text-[#166534]" },
  scheduled: { label: "TERJADWAL", className: "bg-[#DBEAFE] text-[#1D4ED8]" },
  waiting_schedule: { label: "BELUM DIJADWALKAN", className: "bg-[#FEF3C7] text-[#92400E]" },
};

function MentorMultiSelect({ mentors, selectedIds, onChange }) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const btnRef = useRef(null);
  const selectedNames = mentors
    .filter((m) => selectedIds.includes(m.id))
    .map((m) => m.name);

  const toggle = (id) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  // Dropdown-nya position: fixed (dihitung dari posisi tombol) -- kalau pakai
  // absolute biasa, dia keclip sama container tabel yang overflow-x-auto +
  // overflow-hidden. Fixed bikin dia "lepas" dari container itu. Tutup pas
  // di-scroll biar posisinya gak nyasar.
  const openDropdown = () => {
    if (btnRef.current) setRect(btnRef.current.getBoundingClientRect());
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <div className="relative w-full">
      <button
        ref={btnRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openDropdown())}
        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] pl-3 pr-8 text-[13px] font-medium text-[#475569] text-left outline-none focus:border-[#148F89] truncate"
        style={{ height: "36px" }}
      >
        {selectedNames.length > 0 ? selectedNames.join(", ") : "-- Pilih Mentor --"}
      </button>
      <ChevronDown
        size={14}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none"
      />
      {open && rect && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
          <div
            className="fixed z-[61] max-h-52 overflow-y-auto bg-white border border-[#E2E8F0] rounded-[8px] shadow-lg py-1"
            style={{ top: rect.bottom + 4, left: rect.left, width: rect.width }}
          >
            {mentors.length === 0 && (
              <p className="px-3 py-2 text-[12px] text-[#94A3B8]">Tidak ada mentor</p>
            )}
            {mentors.map((m) => (
              <label
                key={m.id}
                className="flex items-center gap-2 px-3 py-2 text-[12.5px] text-[#334155] hover:bg-[#F8FAFC] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(m.id)}
                  onChange={() => toggle(m.id)}
                  className="accent-[#148F89]"
                />
                {m.name}
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function formatSessionDateTime(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta",
  }) + " WIB";
}

export default function BootcampOrderDetail() {
  const params = useParams();
  const [title, setTitle] = useState("");
  const [sessions, setSessions] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSession, setNewSession] = useState({ title: "", start_time: "", end_time: "" });
  const [saving, setSaving] = useState(false);

  const [participants, setParticipants] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(true);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [participantDetail, setParticipantDetail] = useState(null);
  const [participantLoading, setParticipantLoading] = useState(false);
  const [savingSession, setSavingSession] = useState(null);

  const fetchDetail = useCallback(async () => {
    try {
      const res = await apiRequest(`/api/programs/bootcamp-batches/${params.id}/`);
      setTitle(res?.title || "");
      setSessions(res?.sessions || []);
      const nextDrafts = {};
      (res?.sessions || []).forEach((s) => {
        nextDrafts[s.id] = { mentor_ids: s.mentor_ids || [], meeting_link: s.meeting_link || "" };
      });
      setDrafts(nextDrafts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const fetchParticipants = useCallback(async () => {
    try {
      const res = await apiRequest(`/api/products/bootcamp-orders/?product_id=${params.id}`);
      setParticipants(res?.packages || []);
    } catch (err) {
      console.error(err);
    } finally {
      setParticipantsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchDetail();
    fetchParticipants();
    apiRequest("/api/mentors/", { auth: false })
      .then((res) => setMentors(res?.mentors || []))
      .catch(console.error);
  }, [fetchDetail, fetchParticipants]);

  const openParticipant = async (userLibraryId) => {
    setSelectedParticipant(userLibraryId);
    setParticipantLoading(true);
    try {
      const res = await apiRequest(`/api/products/bootcamp-orders/${userLibraryId}/`);
      setParticipantDetail(res);
    } catch (err) {
      console.error(err);
      toast.error("Gagal Memuat Detail Peserta", {
        description: extractErrorMessage(err, "Terjadi kesalahan."),
      });
      setSelectedParticipant(null);
    } finally {
      setParticipantLoading(false);
    }
  };

  const closeParticipant = () => {
    setSelectedParticipant(null);
    setParticipantDetail(null);
  };

  const refreshParticipantDetail = async () => {
    if (!selectedParticipant) return;
    const res = await apiRequest(`/api/products/bootcamp-orders/${selectedParticipant}/`);
    setParticipantDetail(res);
    fetchParticipants();
  };

  const markParticipantSessionComplete = async (sessionId) => {
    setSavingSession(sessionId);
    try {
      await apiRequest(`/api/products/bootcamp-orders/sessions/${sessionId}/`, {
        method: "PATCH",
        body: { status: "completed" },
      });
      await refreshParticipantDetail();
      toast.success("Sesi Ditandai Selesai");
    } catch (err) {
      toast.error("Gagal Menandai Sesi Selesai", {
        description: extractErrorMessage(err, "Terjadi kesalahan."),
      });
    } finally {
      setSavingSession(null);
    }
  };

  const updateDraft = (sessionId, field, value) => {
    setDrafts((prev) => ({ ...prev, [sessionId]: { ...prev[sessionId], [field]: value } }));
  };

  const saveAllSessions = async () => {
    setSaving(true);
    try {
      // Simpan semua sesi sekaligus (mentor + link) -- gantiin tombol panah
      // per-baris. Dikirim berurutan biar gak nembak rate-limit rame-rame.
      for (const s of sessions) {
        const draft = drafts[s.id];
        if (!draft) continue;
        await apiRequest(`/api/programs/bootcamp-sessions/${s.id}/`, {
          method: "PATCH",
          body: { mentor_ids: draft.mentor_ids || [], meeting_link: draft.meeting_link },
        });
      }
      await fetchDetail();
      toast.success("Tersimpan", { description: "Semua sesi (mentor & link) berhasil disimpan." });
    } catch (err) {
      toast.error("Gagal Menyimpan", {
        description: extractErrorMessage(err, "Terjadi kesalahan."),
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteSession = async (sessionId) => {
    if (!confirm("Hapus sesi ini?")) return;
    try {
      await apiRequest(`/api/programs/bootcamp-sessions/${sessionId}/`, { method: "DELETE" });
      fetchDetail();
      toast.success("Sesi Dihapus");
    } catch (err) {
      toast.error("Gagal Menghapus Sesi", {
        description: extractErrorMessage(err, "Terjadi kesalahan."),
      });
    }
  };

  const addSession = async () => {
    if (!newSession.title.trim() || !newSession.start_time || !newSession.end_time) return;
    setSaving(true);
    try {
      await apiRequest(`/api/programs/bootcamp-batches/${params.id}/sessions/add/`, {
        method: "POST",
        body: newSession,
      });
      setShowAddModal(false);
      setNewSession({ title: "", start_time: "", end_time: "" });
      fetchDetail();
      toast.success("Sesi Ditambahkan", { description: `"${newSession.title.trim()}" berhasil ditambahkan.` });
    } catch (err) {
      toast.error("Gagal Menambahkan Sesi", {
        description: extractErrorMessage(err, "Terjadi kesalahan."),
      });
    } finally {
      setSaving(false);
    }
  };

  const needsAction = (session) => {
    const flags = [];
    if (!drafts[session.id]?.mentor_ids?.length) flags.push("MENTOR");
    if (!drafts[session.id]?.meeting_link) flags.push("LINK");
    return flags.length > 0 ? flags : null;
  };

  return (
    <DashboardLayout title="Detail Bootcamp">
      <Link
        href="/admin/orders/bootcamp"
        className="inline-flex items-center gap-2 text-[#64748B] hover:text-[#148F89] text-[13px] font-medium transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        Kembali ke Daftar Batch
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bold text-[22px] text-[#0F172A]">{title}</h1>
          <p className="text-[#64748B] text-[14px] mt-1">ID Batch: {params?.id}</p>
        </div>
        {!loading && sessions.length > 0 && (
          <button
            onClick={saveAllSessions}
            disabled={saving}
            className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-[8px] bg-[#148F89] text-white text-[13px] font-semibold hover:bg-[#117A75] transition-colors disabled:opacity-50"
          >
            <Check size={16} />
            {saving ? "Menyimpan..." : "Simpan Semua"}
          </button>
        )}
      </div>

      {!loading && sessions.length === 0 ? (
        <EmptyState message="Belum ada sesi untuk bootcamp ini." />
      ) : (
        <div className="rounded-[12px] overflow-hidden border border-[#E2E8F0] shadow-sm bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] border-collapse">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-4 py-3.5 text-left font-bold text-[#64748B] text-[11px] tracking-wider">JUDUL SESI</th>
                  <th className="px-4 py-3.5 text-left font-bold text-[#64748B] text-[11px] tracking-wider" style={{ width: "190px" }}>MENTOR</th>
                  <th className="px-4 py-3.5 text-center font-bold text-[#64748B] text-[11px] tracking-wider" style={{ width: "150px" }}>JADWAL</th>
                  <th className="px-4 py-3.5 text-center font-bold text-[#64748B] text-[11px] tracking-wider" style={{ width: "230px" }}>LINK ZOOM</th>
                  <th className="px-4 py-3.5 text-center font-bold text-[#64748B] text-[11px] tracking-wider" style={{ width: "140px" }}>STATUS</th>
                  <th className="px-4 py-3.5 text-center font-bold text-[#64748B] text-[11px] tracking-wider" style={{ width: "90px" }}>AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {sessions.map((item) => {
                  const flags = needsAction(item);
                  return (
                    <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-4 py-4 text-left text-[#1E293B] font-medium">{item.title}</td>
                      <td className="px-4 py-4">
                        <MentorMultiSelect
                          mentors={mentors}
                          selectedIds={drafts[item.id]?.mentor_ids || []}
                          onChange={(ids) => updateDraft(item.id, "mentor_ids", ids)}
                        />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <p className="text-[#1E293B] font-bold text-[12px]">
                          {new Date(item.start_time).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                        <p className="text-[#94A3B8] text-[11px]">
                          {new Date(item.start_time).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })} WIB
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center">
                          <input
                            type="text"
                            placeholder="Masukkan link zoom..."
                            value={drafts[item.id]?.meeting_link || ""}
                            onChange={(e) => updateDraft(item.id, "meeting_link", e.target.value)}
                            style={{ width: "200px", height: "36px" }}
                            className="bg-[#F8FAFC] rounded-[6px] px-3 text-[12px] outline-none border border-[#E2E8F0] text-[#334155] focus:border-[#148F89] transition-colors"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1 items-center justify-center">
                          {flags ? (
                            flags.map((stat, i) => (
                              <span key={i} className="inline-flex px-3 py-1 text-[10px] rounded-full font-bold bg-[#FEE2E2] text-[#991B1B] tracking-wide whitespace-nowrap">
                                {stat === "MENTOR" ? "MENTOR KOSONG" : "LINK KOSONG"}
                              </span>
                            ))
                          ) : (
                            <span className="inline-flex px-3 py-1 text-[10px] rounded-full font-bold border border-[#148F89] text-[#148F89] whitespace-nowrap">
                              LENGKAP
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-3">
                          <Trash2
                            size={17}
                            onClick={() => deleteSession(item.id)}
                            className="text-[#DC2626] cursor-pointer hover:text-[#991B1B] transition-colors"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <button
        onClick={() => setShowAddModal(true)}
        className="w-full bg-white border border-dashed border-[#CBD5E1] shadow-sm rounded-[12px] flex items-center justify-center gap-2 text-[#475569] font-bold hover:bg-[#F8FAFC] hover:border-[#148F89] transition-colors"
        style={{ height: "56px" }}
      >
        <Plus size={18} />
        Tambah Sesi Baru
      </button>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div style={{ width: "440px", maxWidth: "100%" }} className="relative bg-white rounded-[12px] shadow-2xl z-10">
            <div className="px-6 py-5 border-b border-[#E2E8F0] flex justify-between items-center">
              <p className="text-[#1E293B] font-bold text-[17px]">Tambah Sesi Baru</p>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[#334155] text-[13px] font-medium">Judul Sesi</label>
                <input
                  type="text"
                  value={newSession.title}
                  onChange={(e) => setNewSession((f) => ({ ...f, title: e.target.value }))}
                  style={{ height: "42px" }}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 text-[13.5px] text-[#1E293B] outline-none focus:border-[#148F89] transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[#334155] text-[13px] font-medium">Mulai</label>
                <input
                  type="datetime-local"
                  value={newSession.start_time}
                  onChange={(e) => setNewSession((f) => ({ ...f, start_time: e.target.value }))}
                  style={{ height: "42px" }}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 text-[13.5px] text-[#1E293B] outline-none focus:border-[#148F89] transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[#334155] text-[13px] font-medium">Selesai</label>
                <input
                  type="datetime-local"
                  value={newSession.end_time}
                  onChange={(e) => setNewSession((f) => ({ ...f, end_time: e.target.value }))}
                  style={{ height: "42px" }}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 text-[13.5px] text-[#1E293B] outline-none focus:border-[#148F89] transition-colors"
                />
              </div>
            </div>
            <div className="px-6 py-5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 bg-white border border-[#E2E8F0] text-[#475569] font-bold text-[13px] rounded-[8px] hover:bg-[#F1F5F9] transition-colors"
              >
                Batal
              </button>
              <button
                onClick={addSession}
                disabled={saving}
                className="flex-1 py-2.5 bg-[#148F89] text-white font-bold text-[13px] rounded-[8px] hover:bg-[#117A75] transition-colors disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Tambah"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-[16px] font-semibold text-[#0F172A]">Progres Peserta</h2>
          <p className="text-[#64748B] text-[13px] mt-1">
            Pantau progres tiap pembelian bootcamp ini per peserta, dan tandai sesi selesai supaya mentor bisa dapat pencairan dana.
          </p>
        </div>

        {!participantsLoading && participants.length === 0 ? (
          <EmptyState message="Belum ada peserta yang membeli bootcamp ini." />
        ) : (
          <div className="flex flex-col gap-3">
            {participants.map((pkg) => (
              <div
                key={pkg.user_library_id}
                className="w-full bg-white border border-[#E2E8F0] rounded-[12px] p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-5">
                  <div
                    style={{ width: "40px", height: "40px" }}
                    className="rounded-full bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center shrink-0 text-[#64748B]"
                  >
                    <Users size={16} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="font-bold text-[15px] text-[#1E293B]">
                      {pkg.user_name}
                      <span className="ml-2 text-[#148F89] text-[12px] font-semibold">
                        ({pkg.completed_sessions}/{pkg.total_sessions} sesi selesai)
                      </span>
                    </p>
                    <p className="text-[13px] text-[#64748B] font-medium">
                      {pkg.unscheduled_sessions > 0 && (
                        <>
                          <span className="text-[#DC2626] font-bold">{pkg.unscheduled_sessions}</span> Belum Dijadwalkan
                        </>
                      )}
                      {pkg.pending_links > 0 && (
                        <>
                          {pkg.unscheduled_sessions > 0 && " · "}
                          <span className="text-[#DC2626] font-bold">{pkg.pending_links}</span> Link Tertunda
                        </>
                      )}
                      {pkg.unscheduled_sessions === 0 && pkg.pending_links === 0 && "Semua sesi terjadwal"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => openParticipant(pkg.user_library_id)}
                  className="font-bold text-[#148F89] text-[13px] hover:underline shrink-0"
                >
                  Lihat Detail
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeParticipant} />
          <div style={{ width: "620px", maxWidth: "100%", maxHeight: "85vh" }} className="relative bg-white rounded-[12px] shadow-2xl z-10 flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-[#E2E8F0] flex justify-between items-center shrink-0">
              <div>
                <p className="text-[#1E293B] font-bold text-[17px]">
                  {participantDetail?.user_name || "Memuat..."}
                </p>
                <p className="text-[#94A3B8] text-[12px]">{participantDetail?.user_email}</p>
              </div>
              <button onClick={closeParticipant} className="p-2 text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 flex flex-col gap-3 overflow-y-auto">
              {participantLoading ? (
                <p className="text-[#64748B] text-[13px]">Memuat detail sesi...</p>
              ) : (
                (participantDetail?.sessions || []).map((session) => (
                  <div
                    key={session.id}
                    className="border border-[#E2E8F0] rounded-[10px] p-4 flex items-center justify-between gap-4 flex-wrap"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-[13.5px] text-[#1E293B]">
                        Sesi {session.order} · {session.title}
                      </span>
                      <span className="text-[#64748B] text-[12px]">
                        {formatSessionDateTime(session.start_time) || "Jadwal belum di-set"}
                        {session.mentor_name ? ` · ${session.mentor_name}` : ""}
                      </span>
                      {session.meeting_link ? (
                        <a
                          href={session.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#148F89] text-[12px] hover:underline truncate max-w-[280px]"
                        >
                          {session.meeting_link}
                        </a>
                      ) : (
                        <span className="text-[#94A3B8] text-[12px] italic">
                          Link belum diatur -- atur di tabel Kelola Sesi di atas
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex px-3 py-1.5 text-[10px] rounded-full font-bold whitespace-nowrap ${PARTICIPANT_STATUS_META[session.status].className}`}>
                        {PARTICIPANT_STATUS_META[session.status].label}
                      </span>
                      {session.status !== "completed" && (
                        <button
                          onClick={() => markParticipantSessionComplete(session.id)}
                          disabled={savingSession === session.id}
                          style={{ height: "36px" }}
                          className="px-3 rounded-[6px] flex items-center gap-1.5 border border-[#148F89]/40 text-[#148F89] text-[12px] font-semibold hover:bg-[#148F89]/10 transition-colors shrink-0 disabled:opacity-50"
                          title="Tandai selesai"
                        >
                          <Check size={13} />
                          Selesai
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
