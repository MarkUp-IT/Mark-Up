"use client";

import { Eye, EyeOff, ChevronDown, Star } from "lucide-react";
import { useState } from "react";
import DashboardLayout from "@/component/admin/DashboardLayout";
import StatCard from "@/component/admin/StatCard";
import EmptyState from "@/component/admin/EmptyState";

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={13}
          className={
            n <= rating ? "fill-[#F59E0B] text-[#F59E0B]" : "text-[#E2E8F0]"
          }
        />
      ))}
    </div>
  );
}

export default function Feedbacks() {
  const [feedbacks, setFeedbacks] = useState([
    {
      id: 1,
      name: "Anisa Rahmawati",
      email: "anisa.rahma@gmail.com",
      avatar: "/images/pp.png",
      rating: 5,
      review:
        "Mentornya sabar banget jelasinnya, banyak insight baru soal business case yang sebelumnya aku nggak kepikiran. Worth it banget buat persiapan lomba.",
      date: "12 Jan 2026",
      isHidden: false,
    },
    {
      id: 2,
      name: "Fathir Ramadhan",
      email: "fathir.r@gmail.com",
      avatar: "/images/pp.png",
      rating: 4,
      review:
        "Materinya lengkap, cuma agak kepadetan buat 1 sesi doang. Overall bagus sih buat yang baru mulai.",
      date: "10 Jan 2026",
      isHidden: false,
    },
    {
      id: 3,
      name: "Prabroro Subriantoro",
      email: "prabroro@gmail.com",
      avatar: "/images/pp.png",
      rating: 2,
      review:
        "Jadwalnya beberapa kali kepepet banget sama waktu real acara, agak kurang koordinasinya.",
      date: "8 Jan 2026",
      isHidden: true,
    },
  ]);

  const [roleFilter, setRoleFilter] = useState("Semua");

  const toggleHidden = (id) => {
    setFeedbacks((prev) =>
      prev.map((f) => (f.id === id ? { ...f, isHidden: !f.isHidden } : f)),
    );
  };

  const visibleCount = feedbacks.filter((f) => !f.isHidden).length;
  const hiddenCount = feedbacks.filter((f) => f.isHidden).length;

  return (
    <DashboardLayout title="Ulasan">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bold text-[22px] text-[#0F172A]">Ulasan</h1>
          <p className="text-[#64748B] text-[14px] mt-1">
            Kelola ulasan mentor yang tampil di halaman publik MARK-UP.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <StatCard label="Total Ulasan" value={feedbacks.length} unit="ulasan" />
        <StatCard
          label="Ulasan Terlihat"
          value={visibleCount}
          unit="ulasan"
          variant="success"
        />
        <StatCard
          label="Disembunyikan"
          value={hiddenCount}
          unit="ulasan"
          variant="warning"
        />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-[16px] font-semibold text-[#0F172A]">
            Daftar Ulasan
          </h2>
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-[#64748B]">Filter Mentor:</span>
            <div className="relative flex items-center">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="pl-2 pr-7 py-1.5 font-semibold text-[#1E293B] appearance-none outline-none cursor-pointer bg-transparent"
              >
                <option>Semua</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-0 text-[#64748B] pointer-events-none"
              />
            </div>
          </div>
        </div>

        {feedbacks.length === 0 ? (
          <EmptyState message="Belum ada ulasan yang masuk." />
        ) : (
          <div className="rounded-[12px] overflow-hidden border border-[#E2E8F0] shadow-sm bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] text-left">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr>
                    <th
                      className="px-6 py-3.5 font-bold text-[#64748B] text-[11px] tracking-wider uppercase"
                      style={{ width: "230px" }}
                    >
                      USER
                    </th>
                    <th
                      className="px-6 py-3.5 font-bold text-[#64748B] text-[11px] tracking-wider uppercase"
                      style={{ width: "100px" }}
                    >
                      RATING
                    </th>
                    <th className="px-6 py-3.5 font-bold text-[#64748B] text-[11px] tracking-wider uppercase">
                      ULASAN
                    </th>
                    <th
                      className="px-6 py-3.5 text-center font-bold text-[#64748B] text-[11px] tracking-wider uppercase"
                      style={{ width: "110px" }}
                    >
                      TANGGAL
                    </th>
                    <th
                      className="px-6 py-3.5 text-center font-bold text-[#64748B] text-[11px] tracking-wider uppercase"
                      style={{ width: "90px" }}
                    >
                      AKSI
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {feedbacks.map((item) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-[#F8FAFC] transition-colors ${item.isHidden ? "opacity-50" : ""}`}
                    >
                      <td className="px-6 py-5 align-top">
                        <div className="flex items-start gap-3">
                          <div
                            style={{ width: "38px", height: "38px" }}
                            className="rounded-full overflow-hidden border border-[#E2E8F0] shrink-0"
                          >
                            <img
                              src={item.avatar}
                              alt={item.name}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-[#1E293B] text-[13.5px]">
                              {item.name}
                            </span>
                            <span className="text-[#94A3B8] text-[12px]">
                              {item.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <StarRating rating={item.rating} />
                      </td>
                      <td
                        className="px-6 py-5 align-top text-[#475569] leading-relaxed"
                        style={{ maxWidth: "420px" }}
                      >
                        {item.review}
                      </td>
                      <td className="px-6 py-5 align-top text-center text-[#1E293B] font-semibold whitespace-nowrap">
                        {item.date}
                      </td>
                      <td className="px-6 py-5 align-top text-center">
                        <button
                          onClick={() => toggleHidden(item.id)}
                          title={
                            item.isHidden
                              ? "Tampilkan ulasan"
                              : "Sembunyikan ulasan"
                          }
                          className={`p-2 rounded-full transition-colors ${
                            item.isHidden
                              ? "text-[#94A3B8] hover:bg-[#F1F5F9]"
                              : "text-[#148F89] hover:bg-[#148F89]/10"
                          }`}
                        >
                          {item.isHidden ? (
                            <EyeOff size={17} />
                          ) : (
                            <Eye size={17} />
                          )}
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
