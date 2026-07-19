"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  Trash2,
  Plus,
  ChevronDown,
  X,
} from "lucide-react";
import DashboardLayout from "@/component/admin/DashboardLayout";
import EmptyState from "@/component/admin/EmptyState";
import { apiRequest } from "@/lib/api";

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

  const fetchDetail = useCallback(async () => {
    try {
      const res = await apiRequest(`/api/programs/bootcamp-batches/${params.id}/`);
      setTitle(res?.title || "");
      setSessions(res?.sessions || []);
      const nextDrafts = {};
      (res?.sessions || []).forEach((s) => {
        nextDrafts[s.id] = { mentor_id: s.mentor_id || "", meeting_link: s.meeting_link || "" };
      });
      setDrafts(nextDrafts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchDetail();
    apiRequest("/api/mentors/", { auth: false })
      .then((res) => setMentors(res?.mentors || []))
      .catch(console.error);
  }, [fetchDetail]);

  const updateDraft = (sessionId, field, value) => {
    setDrafts((prev) => ({ ...prev, [sessionId]: { ...prev[sessionId], [field]: value } }));
  };

  const saveSession = async (sessionId) => {
    setSaving(true);
    try {
      const draft = drafts[sessionId];
      await apiRequest(`/api/programs/bootcamp-sessions/${sessionId}/`, {
        method: "PATCH",
        body: { mentor_id: draft.mentor_id || null, meeting_link: draft.meeting_link },
      });
      fetchDetail();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const deleteSession = async (sessionId) => {
    if (!confirm("Hapus sesi ini?")) return;
    try {
      await apiRequest(`/api/programs/bootcamp-sessions/${sessionId}/`, { method: "DELETE" });
      fetchDetail();
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const needsAction = (session) => {
    const flags = [];
    if (!drafts[session.id]?.mentor_id) flags.push("MENTOR");
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

      <div>
        <h1 className="font-bold text-[22px] text-[#0F172A]">{title}</h1>
        <p className="text-[#64748B] text-[14px] mt-1">ID Batch: {params?.id}</p>
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
                        <div className="relative w-full">
                          <select
                            value={drafts[item.id]?.mentor_id || ""}
                            onChange={(e) => updateDraft(item.id, "mentor_id", e.target.value)}
                            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] pl-3 pr-8 text-[13px] font-medium text-[#475569] appearance-none outline-none focus:border-[#148F89]"
                            style={{ height: "36px" }}
                          >
                            <option value="">-- Pilih Mentor --</option>
                            {mentors.map((m) => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
                        </div>
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
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="text"
                            placeholder="Masukkan link zoom..."
                            value={drafts[item.id]?.meeting_link || ""}
                            onChange={(e) => updateDraft(item.id, "meeting_link", e.target.value)}
                            style={{ width: "150px", height: "36px" }}
                            className="bg-[#F8FAFC] rounded-[6px] px-3 text-[12px] outline-none border border-[#E2E8F0] text-[#334155] focus:border-[#148F89] transition-colors"
                          />
                          <button
                            onClick={() => saveSession(item.id)}
                            disabled={saving}
                            style={{ width: "36px", height: "36px" }}
                            className="rounded-[6px] flex items-center justify-center transition-colors shrink-0 bg-[#148F89] text-white hover:bg-[#117A75] disabled:opacity-50"
                          >
                            <Send size={15} />
                          </button>
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
    </DashboardLayout>
  );
}
