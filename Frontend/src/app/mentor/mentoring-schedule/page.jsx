"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import DashboardLayout from "@/component/mentor/DashboardLayout";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#148F89] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F081C]";

export default function MentoringSchedule() {
  // modalMode: null (tertutup) | "single" (klik 1 tanggal, cuma pilih jam)
  // | "range" (klik tombol "Pilih Rentang", ada pilihan rentang tanggal + jam)
  const [modalMode, setModalMode] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  const [selectedTimeSlots, setSelectedTimeSlots] = useState([
    "08.00 WIB",
    "12.00 WIB",
    "14.00 WIB",
    "15.00 WIB",
    "18.00 WIB",
    "21.00 WIB",
  ]);

  useEffect(() => {
    if (modalMode) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [modalMode]);

  const openSingleDateModal = (dateItem) => {
    setSelectedDate(dateItem.date);
    setModalMode("single");
  };

  const openRangeModal = () => {
    setModalMode("range");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedDate(null);
  };

  // --- MOCK DATA: Calendar Grid (Juni 2026) ---
  const daysOfWeek = ["MIN", "SEN", "SEL", "RAB", "KAM", "JUM", "SAB"];

  const calendarData = [
    { date: "31", isCurrentMonth: false, slots: [] },
    { date: "1", isCurrentMonth: true, slots: [] },
    {
      date: "2",
      isCurrentMonth: true,
      slots: [
        "09:00",
        "10:00",
        "13:00",
        "14:00",
        "18:00",
        "19:00",
        "20:00",
        "21:00",
      ],
    },
    { date: "3", isCurrentMonth: true, slots: [] },
    { date: "4", isCurrentMonth: true, slots: [] },
    { date: "5", isCurrentMonth: true, slots: [] },
    {
      date: "6",
      isCurrentMonth: true,
      slots: ["09:00", "10:00", "13:00", "14:00", "18:00", "19:00", "20:00"],
    },
    {
      date: "7",
      isCurrentMonth: true,
      slots: ["09:00", "10:00", "20:00", "21:00"],
    },
    { date: "8", isCurrentMonth: true, slots: [] },
    { date: "9", isCurrentMonth: true, slots: [] },
    { date: "10", isCurrentMonth: true, slots: [] },
    { date: "11", isCurrentMonth: true, slots: [] },
    { date: "12", isCurrentMonth: true, slots: [] },
    { date: "13", isCurrentMonth: true, slots: [] },
    { date: "14", isCurrentMonth: true, slots: [] },
    { date: "15", isCurrentMonth: true, slots: [] },
    { date: "16", isCurrentMonth: true, slots: [] },
    { date: "17", isCurrentMonth: true, slots: [] },
    { date: "18", isCurrentMonth: true, slots: [] },
    {
      date: "19",
      isCurrentMonth: true,
      isHighlighted: true,
      slots: ["09:00", "10:00", "13:00", "14:00", "18:00"],
    },
    { date: "20", isCurrentMonth: true, slots: [] },
    { date: "21", isCurrentMonth: true, slots: [] },
    { date: "22", isCurrentMonth: true, slots: [] },
    { date: "23", isCurrentMonth: true, slots: [] },
    { date: "24", isCurrentMonth: true, slots: [] },
    { date: "25", isCurrentMonth: true, slots: [] },
    { date: "26", isCurrentMonth: true, slots: [] },
    { date: "27", isCurrentMonth: true, slots: [] },
    { date: "28", isCurrentMonth: true, slots: [] },
    { date: "29", isCurrentMonth: true, slots: [] },
    { date: "30", isCurrentMonth: true, slots: [] },
    { date: "1", isCurrentMonth: false, slots: [] },
    { date: "2", isCurrentMonth: false, slots: [] },
    { date: "3", isCurrentMonth: false, slots: [] },
    { date: "4", isCurrentMonth: false, slots: [] },
  ];

  const allTimeSlots = [
    "07.00 WIB",
    "08.00 WIB",
    "09.00 WIB",
    "10.00 WIB",
    "11.00 WIB",
    "12.00 WIB",
    "13.00 WIB",
    "14.00 WIB",
    "15.00 WIB",
    "16.00 WIB",
    "17.00 WIB",
    "18.00 WIB",
    "19.00 WIB",
    "20.00 WIB",
    "21.00 WIB",
  ];

  const toggleTimeSlot = (slot) => {
    if (selectedTimeSlots.includes(slot)) {
      setSelectedTimeSlots(selectedTimeSlots.filter((s) => s !== slot));
    } else {
      setSelectedTimeSlots([...selectedTimeSlots, slot]);
    }
  };

  return (
    <DashboardLayout title="Jadwal Mentoring">
      {/* Title Area */}
      <div className="flex flex-col gap-1">
        <h1 className="font-bold text-[22px] sm:text-[25px] text-white">
          Jadwal Mentoring
        </h1>
        <p className="text-[#9CA3AF] text-[14px] sm:text-[15px]">
          Atur hari dan jam ketersediaanmu untuk melakukan sesi mentoring
        </p>
      </div>

      {/* Calendar Controls */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-bold text-[20px] sm:text-[24px] text-white">
            Juni 2026
          </h2>
          <p className="text-[#9CA3AF] text-[13px] italic">
            *Klik tanggal untuk atur jam di hari itu saja, atau pakai
            &quot;Pilih Rentang&quot; untuk atur banyak tanggal sekaligus
          </p>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <button
              aria-label="Bulan sebelumnya"
              className={`w-[36px] h-[36px] rounded-[8px] bg-[#170F26] border border-[#2D2342] flex items-center justify-center text-[#9CA3AF] hover:text-white hover:bg-[#2D1B4E] transition-colors ${focusRing}`}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              aria-label="Bulan berikutnya"
              className={`w-[36px] h-[36px] rounded-[8px] bg-[#170F26] border border-[#2D2342] flex items-center justify-center text-[#9CA3AF] hover:text-white hover:bg-[#2D1B4E] transition-colors ${focusRing}`}
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <button
            onClick={openRangeModal}
            className={`bg-[#148F89] text-white text-[13px] font-bold px-5 sm:px-6 py-2.5 rounded-[8px] hover:bg-[#117A75] transition-colors shadow-sm whitespace-nowrap ${focusRing}`}
          >
            Pilih Rentang
          </button>
        </div>
      </div>

      {/* Calendar Grid -- di layar sempit di-scroll horizontal */}
      <div className="w-full overflow-x-auto bg-[#170F26] rounded-[12px] border border-[#2D2342] shadow-lg">
        <div className="min-w-[700px]">
          {/* Days Header */}
          <div className="grid grid-cols-7 bg-[#1A1128] border-b border-[#2D2342]">
            {daysOfWeek.map((day, index) => (
              <div
                key={index}
                className={`py-4 text-center text-[12px] font-bold text-[#9CA3AF] uppercase tracking-widest ${
                  index !== 6 ? "border-r border-[#2D2342]" : ""
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Dates Grid */}
          <div className="grid grid-cols-7">
            {calendarData.map((item, index) => {
              const isRightEdge = (index + 1) % 7 === 0;
              const isBottomRow = index >= calendarData.length - 7;

              return (
                <button
                  key={index}
                  onClick={() => openSingleDateModal(item)}
                  className={`
                    min-h-[140px] p-3 flex flex-col gap-2 text-left cursor-pointer transition-colors hover:bg-[#1A1128]
                    ${!isRightEdge ? "border-r border-[#2D2342]" : ""}
                    ${!isBottomRow ? "border-b border-[#2D2342]" : ""}
                  `}
                >
                  <div className="flex justify-start">
                    <span
                      className={`
                      w-7 h-7 flex items-center justify-center rounded-full text-[14px] font-bold
                      ${
                        item.isHighlighted
                          ? "bg-[#148F89] text-white"
                          : item.isCurrentMonth
                            ? "text-[#E2E8F0]"
                            : "text-[#4B5563]"
                      }
                    `}
                    >
                      {item.date}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-1">
                    {item.slots.map((slot, slotIndex) => (
                      <span
                        key={slotIndex}
                        className="px-2 py-1 rounded-full text-[10px] font-bold bg-[#148F89]/10 text-[#148F89] border border-[#148F89]/30"
                      >
                        {slot}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- MODAL: mode "single" (cuma pilih jam) atau "range" (rentang tanggal + jam) --- */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={closeModal}
          ></div>

          <div className="relative bg-[#170F26] w-full max-w-[600px] max-h-[90vh] overflow-y-auto rounded-[12px] border border-[#2D2342] flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-6 sm:p-8 flex flex-col gap-6">
              {modalMode === "range" ? (
                /* --- Mode Rentang: tampil setelah klik tombol "Pilih Rentang" --- */
                <div className="flex flex-col gap-3">
                  <h3 className="text-white font-bold text-[16px]">
                    Pilih Rentang Tanggal
                  </h3>
                  <div className="flex flex-col bg-[#0F081C] rounded-[12px] border border-[#2D2342] overflow-hidden">
                    <div className="flex justify-between items-center px-5 py-4 border-b border-[#2D2342]">
                      <div className="flex flex-col gap-1">
                        <span className="text-[#9CA3AF] text-[12px] font-semibold">
                          Tanggal Mulai
                        </span>
                        <span className="text-[#E2E8F0] font-bold text-[14px]">
                          Jumat, 19 Juni 2026
                        </span>
                      </div>
                      <CalendarIcon
                        size={20}
                        className="text-[#148F89] shrink-0"
                      />
                    </div>
                    <div className="flex justify-between items-center px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[#9CA3AF] text-[12px] font-semibold">
                          Tanggal Selesai
                        </span>
                        <span className="text-[#E2E8F0] font-bold text-[14px]">
                          Selasa, 23 Juni 2026
                        </span>
                      </div>
                      <CalendarIcon
                        size={20}
                        className="text-[#148F89] shrink-0"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* --- Mode Single: tampil setelah klik satu tanggal di kalender --- */
                <div className="flex flex-col gap-3">
                  <h3 className="text-white font-bold text-[16px]">
                    Atur Jam untuk Tanggal Ini
                  </h3>
                  <div className="flex justify-between items-center px-5 py-4 bg-[#0F081C] rounded-[12px] border border-[#2D2342]">
                    <div className="flex flex-col gap-1">
                      <span className="text-[#9CA3AF] text-[12px] font-semibold">
                        Tanggal
                      </span>
                      <span className="text-[#E2E8F0] font-bold text-[14px]">
                        {selectedDate} Juni 2026
                      </span>
                    </div>
                    <CalendarIcon
                      size={20}
                      className="text-[#148F89] shrink-0"
                    />
                  </div>
                </div>
              )}

              {/* Jam Section -- sama untuk kedua mode */}
              <div className="flex flex-col gap-3">
                <h3 className="text-white font-bold text-[16px]">
                  Pilih Jam Ketersediaan
                </h3>
                <div className="bg-[#0F081C] border border-[#2D2342] rounded-[12px] p-4 sm:p-6 grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {allTimeSlots.map((slot, index) => {
                    const isSelected = selectedTimeSlots.includes(slot);
                    return (
                      <button
                        key={index}
                        onClick={() => toggleTimeSlot(slot)}
                        className={`py-2 rounded-[8px] text-[11px] font-bold border transition-colors ${focusRing} ${
                          isSelected
                            ? "bg-[#148F89]/10 border-[#148F89] text-[#148F89]"
                            : "bg-transparent border-[#2D2342] text-[#9CA3AF] hover:border-[#9CA3AF] hover:text-white"
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                <button
                  onClick={closeModal}
                  className={`px-6 py-2.5 bg-transparent border border-[#2D2342] text-[#9CA3AF] font-bold text-[13px] rounded-[8px] hover:bg-[#2D2342] hover:text-white transition-colors ${focusRing}`}
                >
                  Batal
                </button>
                <button
                  onClick={closeModal}
                  className={`px-6 py-2.5 bg-[#148F89] text-white font-bold text-[13px] rounded-[8px] hover:bg-[#117A75] transition-colors shadow-sm ${focusRing}`}
                >
                  Terapkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
