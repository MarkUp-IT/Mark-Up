"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Pencil, Check, X, Shuffle, Users } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/formErrors";

export default function BootcampTeamPanel({ productId }) {
  const [teams, setTeams] = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newTeamName, setNewTeamName] = useState("");
  const [addingTeam, setAddingTeam] = useState(false);

  const [editingTeamId, setEditingTeamId] = useState(null);
  const [editingName, setEditingName] = useState("");

  const [pickerTeamId, setPickerTeamId] = useState(null);
  const [pickerValue, setPickerValue] = useState("");

  const [showRandomize, setShowRandomize] = useState(false);
  const [teamCount, setTeamCount] = useState(2);
  const [randomizing, setRandomizing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/api/products/${productId}/teams/`);
      setTeams(res?.teams || []);
      setUnassigned(res?.unassigned || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddTeam = async () => {
    setAddingTeam(true);
    try {
      await apiRequest(`/api/products/${productId}/teams/add/`, {
        method: "POST", body: { name: newTeamName.trim() },
      });
      setNewTeamName("");
      fetchData();
    } catch (err) {
      toast.error("Gagal Membuat Tim", { description: extractErrorMessage(err, "Terjadi kesalahan.") });
    } finally {
      setAddingTeam(false);
    }
  };

  const handleRenameTeam = async (teamId) => {
    if (!editingName.trim()) return;
    try {
      await apiRequest(`/api/products/bootcamp-teams/${teamId}/`, {
        method: "PATCH", body: { name: editingName.trim() },
      });
      setEditingTeamId(null);
      fetchData();
    } catch (err) {
      toast.error("Gagal Mengubah Nama Tim", { description: extractErrorMessage(err, "Terjadi kesalahan.") });
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!confirm("Hapus tim ini? Semua anggotanya bakal balik ke daftar belum-punya-tim.")) return;
    try {
      await apiRequest(`/api/products/bootcamp-teams/${teamId}/`, { method: "DELETE" });
      toast.success("Tim Dihapus");
      fetchData();
    } catch (err) {
      toast.error("Gagal Menghapus Tim", { description: extractErrorMessage(err, "Terjadi kesalahan.") });
    }
  };

  const handleAssign = async (teamId) => {
    if (!pickerValue) return;
    try {
      await apiRequest(`/api/products/bootcamp-teams/${teamId}/members/`, {
        method: "POST", body: { user_library_id: pickerValue },
      });
      setPickerTeamId(null);
      setPickerValue("");
      fetchData();
    } catch (err) {
      toast.error("Gagal Menambahkan Anggota", { description: extractErrorMessage(err, "Terjadi kesalahan.") });
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await apiRequest(`/api/products/bootcamp-team-members/${memberId}/`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      toast.error("Gagal Mengeluarkan Peserta", { description: extractErrorMessage(err, "Terjadi kesalahan.") });
    }
  };

  const handleRandomize = async () => {
    const count = Number(teamCount);
    if (!count || count < 1) return;
    if (!confirm(`Ini bakal HAPUS semua tim yang ada sekarang dan bikin ${count} tim baru dengan anggota diacak ulang. Lanjut?`)) return;
    setRandomizing(true);
    try {
      const res = await apiRequest(`/api/products/${productId}/teams/randomize/`, {
        method: "POST", body: { team_count: count },
      });
      toast.success("Tim Berhasil Diacak", { description: res?.detail });
      setShowRandomize(false);
      fetchData();
    } catch (err) {
      toast.error("Gagal Mengacak Tim", { description: extractErrorMessage(err, "Terjadi kesalahan.") });
    } finally {
      setRandomizing(false);
    }
  };

  if (loading) return null;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-[15px] text-[#0F172A]">Team Pairing</h2>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#148F89]/10 text-[#148F89] text-[10.5px] font-semibold">
            <Users size={11} /> {unassigned.length} belum punya tim
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRandomize((s) => !s)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-[#E2E8F0] text-[#475569] text-[12px] font-semibold hover:bg-[#F8FAFC] transition-colors"
          >
            <Shuffle size={13} /> Acak Ulang
          </button>
        </div>
      </div>
      <p className="text-[#94A3B8] text-[11.5px] -mt-2">
        Cuma peserta yang paketnya punya benefit Team Pairing yang bisa dimasukkan tim.
      </p>

      {showRandomize && (
        <div className="flex items-center gap-2 p-3.5 rounded-[8px] bg-[#FEF3C7] border border-[#FDE68A]">
          <span className="text-[#92400E] text-[12px] font-medium">Jumlah tim:</span>
          <input
            type="number"
            min={1}
            value={teamCount}
            onChange={(e) => setTeamCount(e.target.value)}
            className="w-16 bg-white border border-[#FDE68A] rounded-[6px] px-2 h-8 text-[12.5px] text-[#1E293B] outline-none"
          />
          <button
            onClick={handleRandomize}
            disabled={randomizing}
            className="ml-auto px-3 py-1.5 rounded-[6px] bg-[#B45309] text-white text-[12px] font-semibold hover:bg-[#92400E] transition-colors disabled:opacity-50"
          >
            {randomizing ? "Mengacak..." : "Reset & Acak Sekarang"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {teams.map((team) => (
          <div key={team.id} className="flex flex-col gap-2 p-3.5 rounded-[8px] border border-[#E2E8F0]">
            <div className="flex items-center justify-between gap-2">
              {editingTeamId === team.id ? (
                <div className="flex items-center gap-1.5 flex-1">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-2 h-7 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
                  />
                  <button onClick={() => handleRenameTeam(team.id)} className="p-1 text-[#148F89]"><Check size={14} /></button>
                  <button onClick={() => setEditingTeamId(null)} className="p-1 text-[#64748B]"><X size={14} /></button>
                </div>
              ) : (
                <span className="text-[#1E293B] font-semibold text-[13.5px]">{team.name}</span>
              )}
              {editingTeamId !== team.id && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => { setEditingTeamId(team.id); setEditingName(team.name); }}
                    className="p-1.5 rounded-[6px] text-[#64748B] hover:text-[#148F89] hover:bg-[#148F89]/5 transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDeleteTeam(team.id)} className="p-1.5 rounded-[6px] text-[#DC2626] hover:bg-red-50 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>

            {team.members.length === 0 ? (
              <p className="text-[#94A3B8] text-[11.5px] italic">Belum ada anggota.</p>
            ) : (
              <div className="flex flex-col gap-1">
                {team.members.map((m) => (
                  <div key={m.member_id} className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-[6px] bg-[#F8FAFC]">
                    <span className="text-[#1E293B] text-[12px] truncate">{m.user_name}</span>
                    <button onClick={() => handleRemoveMember(m.member_id)} className="p-0.5 text-[#94A3B8] hover:text-[#DC2626] transition-colors shrink-0">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {pickerTeamId === team.id ? (
              <div className="flex items-center gap-1.5">
                <select
                  value={pickerValue}
                  onChange={(e) => setPickerValue(e.target.value)}
                  className="flex-1 bg-white border border-[#E2E8F0] rounded-[6px] px-2 h-8 text-[11.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
                >
                  <option value="">Pilih peserta...</option>
                  {unassigned.map((u) => (
                    <option key={u.user_library_id} value={u.user_library_id}>{u.user_name}</option>
                  ))}
                </select>
                <button onClick={() => handleAssign(team.id)} className="p-1.5 text-[#148F89]"><Check size={14} /></button>
                <button onClick={() => setPickerTeamId(null)} className="p-1.5 text-[#64748B]"><X size={14} /></button>
              </div>
            ) : (
              <button
                onClick={() => { setPickerTeamId(team.id); setPickerValue(""); }}
                disabled={unassigned.length === 0}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-dashed border-[#CBD5E1] text-[#64748B] text-[11.5px] font-semibold hover:border-[#148F89] hover:text-[#148F89] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus size={12} /> Tambah Anggota
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder={'Nama tim baru (kosongkan buat auto "Tim N")'}
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
          className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-3 h-9 text-[12.5px] text-[#1E293B] outline-none focus:border-[#148F89]"
        />
        <button
          onClick={handleAddTeam}
          disabled={addingTeam}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#148F89] text-white text-[12px] font-semibold hover:bg-[#117A75] transition-colors disabled:opacity-50"
        >
          <Plus size={13} /> Tambah Tim
        </button>
      </div>
    </div>
  );
}
