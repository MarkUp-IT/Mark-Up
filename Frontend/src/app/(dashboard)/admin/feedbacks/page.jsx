"use client";

import { Eye, EyeOff, Star } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/component/admin/DashboardLayout";
import StatCard from "@/component/admin/StatCard";
import EmptyState from "@/component/admin/EmptyState";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/formErrors";

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={13}
          className={n <= rating ? "fill-[#F59E0B] text-[#F59E0B]" : "text-[#E2E8F0]"}
        />
      ))}
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function Feedbacks() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/api/products/reviews/");
      setFeedbacks(res?.reviews || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const toggleHidden = async (id) => {
    try {
      await apiRequest(`/api/products/reviews/${id}/toggle/`, { method: "PATCH" });
      fetchReviews();
      toast.success("Status Ulasan Diperbarui");
    } catch (err) {
      toast.error("Gagal Mengubah Status Ulasan", {
        description: extractErrorMessage(err, "Terjadi kesalahan."),
      });
    }
  };

  const visibleCount = feedbacks.filter((f) => !f.is_hidden).length;
  const hiddenCount = feedbacks.filter((f) => f.is_hidden).length;

  return (
    <DashboardLayout title="Ulasan">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bold text-[22px] text-[#0F172A]">Ulasan</h1>
          <p className="text-[#64748B] text-[14px] mt-1">
            Kelola ulasan yang tampil di halaman publik MARK-UP.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <StatCard label="Total Ulasan" value={feedbacks.length} unit="ulasan" />
        <StatCard label="Ulasan Terlihat" value={visibleCount} unit="ulasan" variant="success" />
        <StatCard label="Disembunyikan" value={hiddenCount} unit="ulasan" variant="warning" />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-[16px] font-semibold text-[#0F172A]">Daftar Ulasan</h2>

        {!loading && feedbacks.length === 0 ? (
          <EmptyState message="Belum ada ulasan yang masuk." />
        ) : (
          <div className="rounded-[12px] overflow-hidden border border-[#E2E8F0] shadow-sm bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] text-left">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-6 py-3.5 font-bold text-[#64748B] text-[11px] tracking-wider uppercase" style={{ width: "230px" }}>USER</th>
                    <th className="px-6 py-3.5 font-bold text-[#64748B] text-[11px] tracking-wider uppercase" style={{ width: "100px" }}>RATING</th>
                    <th className="px-6 py-3.5 font-bold text-[#64748B] text-[11px] tracking-wider uppercase">ULASAN</th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] text-[11px] tracking-wider uppercase" style={{ width: "110px" }}>TANGGAL</th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] text-[11px] tracking-wider uppercase" style={{ width: "90px" }}>AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {feedbacks.map((item) => (
                    <tr key={item.id} className={`hover:bg-[#F8FAFC] transition-colors ${item.is_hidden ? "opacity-50" : ""}`}>
                      <td className="px-6 py-5 align-top">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#1E293B] text-[13.5px]">{item.reviewer_name}</span>
                          <span className="text-[#94A3B8] text-[12px]">{item.reviewer_email}</span>
                          <span className="text-[#94A3B8] text-[11px] mt-0.5">{item.product_title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <StarRating rating={Math.round(item.rating)} />
                      </td>
                      <td className="px-6 py-5 align-top text-[#475569] leading-relaxed" style={{ maxWidth: "420px" }}>
                        {item.review_text}
                      </td>
                      <td className="px-6 py-5 align-top text-center text-[#1E293B] font-semibold whitespace-nowrap">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-6 py-5 align-top text-center">
                        <button
                          onClick={() => toggleHidden(item.id)}
                          title={item.is_hidden ? "Tampilkan ulasan" : "Sembunyikan ulasan"}
                          className={`p-2 rounded-full transition-colors ${
                            item.is_hidden ? "text-[#94A3B8] hover:bg-[#F1F5F9]" : "text-[#148F89] hover:bg-[#148F89]/10"
                          }`}
                        >
                          {item.is_hidden ? <EyeOff size={17} /> : <Eye size={17} />}
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
    </DashboardLayout>
  );
}
