"use client";

import { Eye, X, Mail } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/component/admin/DashboardLayout";
import StatCard from "@/component/admin/StatCard";
import EmptyState from "@/component/admin/EmptyState";
import { apiRequest } from "@/lib/api";

const STATUS_META = {
  new: { label: "BARU", className: "bg-[#DBEAFE] text-[#1D4ED8]" },
  read: { label: "DIBACA", className: "bg-[#F1F5F9] text-[#475569]" },
};

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function ContactMessages() {
  const heightFix = `.adm-h-42 { height: 42px; }`;

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/api/accounts/contact-messages/");
      setMessages(res?.messages || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    document.body.style.overflow = isModalOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isModalOpen]);

  const openDetail = async (msg) => {
    setSelectedMsg(msg);
    setIsModalOpen(true);
    if (msg.status === "new") {
      try {
        await apiRequest(`/api/accounts/contact-messages/${msg.id}/`);
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, status: "read" } : m)));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const newCount = messages.filter((m) => m.status === "new").length;

  return (
    <DashboardLayout title="Pesan Masuk">
      <style>{heightFix}</style>

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bold text-[22px] text-[#0F172A]">Pesan Masuk</h1>
          <p className="text-[#64748B] text-[14px] mt-1">
            Pesan yang dikirim lewat form Contact Us di halaman publik.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <StatCard label="Total Pesan" value={messages.length} unit="pesan" loading={loading} />
        <StatCard label="Belum Dibaca" value={newCount} unit="pesan" variant="warning" loading={loading} />
        <StatCard label="Sudah Dibaca" value={messages.length - newCount} unit="pesan" variant="success" loading={loading} />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-[16px] font-semibold text-[#0F172A]">Daftar Pesan</h2>

        {!loading && messages.length === 0 ? (
          <EmptyState message="Belum ada pesan masuk." />
        ) : (
          <div className="rounded-[12px] overflow-hidden border border-[#E2E8F0] shadow-sm bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] text-left">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-6 py-3.5 font-bold text-[#64748B] text-[11px] tracking-wider uppercase" style={{ width: "220px" }}>PENGIRIM</th>
                    <th className="px-6 py-3.5 font-bold text-[#64748B] text-[11px] tracking-wider uppercase">SUBJEK & PESAN</th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] text-[11px] tracking-wider uppercase" style={{ width: "130px" }}>TANGGAL</th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] text-[11px] tracking-wider uppercase" style={{ width: "100px" }}>STATUS</th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] text-[11px] tracking-wider uppercase" style={{ width: "80px" }}>AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {messages.map((item) => (
                    <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-6 py-5 align-top">
                        <p className="font-bold text-[#1E293B] text-[13.5px]">{item.name}</p>
                        <p className="text-[#94A3B8] text-[12px]">{item.email}</p>
                      </td>
                      <td className="px-6 py-5 align-top" style={{ maxWidth: "420px" }}>
                        <p className="font-semibold text-[#1E293B] mb-1">{item.subject}</p>
                        <p className="text-[#64748B] text-[12.5px] leading-relaxed line-clamp-2">{item.message}</p>
                      </td>
                      <td className="px-6 py-5 align-top text-center text-[#1E293B] font-semibold whitespace-nowrap">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-6 py-5 align-top text-center">
                        <span className={`inline-flex px-3 py-1 text-[10px] rounded-full font-bold ${STATUS_META[item.status].className}`}>
                          {STATUS_META[item.status].label}
                        </span>
                      </td>
                      <td className="px-6 py-5 align-top text-center">
                        <button
                          onClick={() => openDetail(item)}
                          className="text-[#94A3B8] hover:text-[#148F89] transition-colors p-2 rounded-full hover:bg-[#148F89]/10"
                        >
                          <Eye size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div style={{ width: "480px", maxWidth: "100%", maxHeight: "85vh" }} className="relative bg-white overflow-y-auto rounded-[12px] shadow-2xl z-10">
            <div className="px-6 py-5 border-b border-[#E2E8F0] flex justify-between items-center">
              <div>
                <p className="text-[#1E293B] font-bold text-[17px]">{selectedMsg?.subject}</p>
                <p className="text-[#64748B] text-[12px] mt-0.5">{formatDate(selectedMsg?.created_at)}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-6 flex flex-col gap-5">
              <div className="flex items-center gap-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-4">
                <div style={{ width: "40px", height: "40px" }} className="rounded-full bg-[#148F89]/10 flex items-center justify-center shrink-0">
                  <span className="text-[#148F89] font-bold text-[15px]">{selectedMsg?.name?.[0]}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[#1E293B] font-semibold text-[13px]">{selectedMsg?.name}</span>
                  <span className="text-[#64748B] text-[12px]">{selectedMsg?.email}</span>
                </div>
              </div>

              <p className="text-[#334155] text-[13.5px] leading-relaxed">{selectedMsg?.message}</p>
            </div>

            <div className="px-6 py-5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 bg-white border border-[#E2E8F0] text-[#475569] font-bold text-[13px] rounded-[8px] hover:bg-[#F1F5F9] transition-colors"
              >
                Tutup
              </button>
              <a
                href={`mailto:${selectedMsg?.email}?subject=Re: ${selectedMsg?.subject}`}
                className="px-5 py-2.5 bg-[#148F89] text-white font-bold text-[13px] rounded-[8px] hover:bg-[#117A75] transition-colors flex items-center gap-1.5"
              >
                <Mail size={14} />
                Balas via Email
              </a>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
