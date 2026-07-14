"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Lock,
  Check,
} from "lucide-react";
import DashboardLayout from "@/component/mentor/DashboardLayout";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#148F89] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F081C]";

const allTimeSlots = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
];

const daysOfWeek = ["MIN", "SEN", "SEL", "RAB", "KAM", "JUM", "SAB"];

// Juni 2026: 31 Mei jatuh di hari Minggu, jadi 1 Juni di kolom Senin --
// dipetain ke Date asli beneran biar mode "Pilih Rentang" bisa dihitung
// presisi terhadap tanggal kalender ini, bukan cuma teks statis.
function cellToRealDate(item) {
  if (item.isCurrentMonth) return new Date(2026, 5, parseInt(item.date, 10));
  return parseInt(item.date, 10) > 20
    ? new Date(2026, 4, parseInt(item.date, 10))
    : new Date(2026, 6, parseInt(item.date, 10));
}

// --- MOCK DATA: slot sekarang objek { time, status, menteeName }, bukan
// cuma array string -- status "booked" dikunci, nggak bisa dimatiin mentor
// sendiri (itu udah ada mentee yang janjian di jam itu).
const initialCalendarData = [
  { date: "31", isCurrentMonth: false, slots: [] },
  { date: "1", isCurrentMonth: true, slots: [] },
  {
    date: "2",
    isCurrentMonth: true,
    slots: [
      { time: "09:00", status: "available" },
      { time: "10:00", status: "available" },
      { time: "13:00", status: "booked", menteeName: "Fathir Ramadhan" },
      { time: "14:00", status: "available" },
    ],
  },
  { date: "3", isCurrentMonth: true, slots: [] },
  { date: "4", isCurrentMonth: true, slots: [] },
  { date: "5", isCurrentMonth: true, slots: [] },
  {
    date: "6",
    isCurrentMonth: true,
    slots: [
      { time: "09:00", status: "available" },
      { time: "18:00", status: "booked", menteeName: "Sarah Jenkins" },
    ],
  },
  {
    date: "7",
    isCurrentMonth: true,
    slots: [
      { time: "09:00", status: "available" },
      { time: "20:00", status: "available" },
    ],
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
    isToday: true,
    slots: [
      { time: "09:00", status: "available" },
      { time: "13:00", status: "available" },
      { time: "18:00", status: "available" },
    ],
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

export default function MentoringSchedule() {
  const darkModeFix = `
    .ms-panel { background-color: #170F26; }
    .ms-header-row { background-color: #1A1128; }
    .ms-inset { background-color: #0F081C; }
    .ms-accent { background-color: #148F89; }
  `;

  const [calendarData, setCalendarData] = useState(initialCalendarData);

  // modalMode: null (tertutup) | "single" (1 tanggal) | "range" (banyak tanggal)
  const [modalMode, setModalMode] = useState(null);
  const [activeCellIndex, setActiveCellIndex] = useState(null);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");

  const shouldReduceMotion = useReducedMotion() ?? false;

  const sectionReveal = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: shouldReduceMotion ? 0.2 : 0.4 },
    viewport: { once: true },
  };

  useEffect(() => {
    document.body.style.overflow = modalMode ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [modalMode]);

  const closeModal = () => {
    setModalMode(null);
    setActiveCellIndex(null);
    setSelectedTimeSlots([]);
  };

  // Buka modal buat SATU tanggal -- slot yang udah "available" di tanggal
  // itu langsung ke-preselect (sebelumnya selalu nampilin 6 jam hardcode
  // yang sama nggak peduli tanggal mana yang diklik).
  const openSingleDateModal = (item, index) => {
    if (!item.isCurrentMonth) return;
    setActiveCellIndex(index);
    setSelectedTimeSlots(
      item.slots.filter((s) => s.status === "available").map((s) => s.time),
    );
    setModalMode("single");
  };

  const openRangeModal = () => {
    setSelectedTimeSlots([]);
    setRangeStart("");
    setRangeEnd("");
    setModalMode("range");
  };

  // Jam yang statusnya "booked" di tanggal aktif -- ini yang dikunci,
  // mentor nggak bisa matiin slot yang udah ada mentee-nya.
  const bookedSlotsForActiveCell =
    activeCellIndex !== null
      ? calendarData[activeCellIndex].slots.filter((s) => s.status === "booked")
      : [];
  const bookedTimes = bookedSlotsForActiveCell.map((s) => s.time);

  const toggleTimeSlot = (time) => {
    if (bookedTimes.includes(time)) return; // terkunci, nggak bisa diapa-apain
    setSelectedTimeSlots((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time],
    );
  };

  const handleApplySingle = () => {
    setCalendarData((prev) =>
      prev.map((item, idx) => {
        if (idx !== activeCellIndex) return item;
        const booked = item.slots.filter((s) => s.status === "booked");
        const newAvailable = selectedTimeSlots.map((time) => ({
          time,
          status: "available",
        }));
        return {
          ...item,
          slots: [...booked, ...newAvailable].sort((a, b) =>
            a.time.localeCompare(b.time),
          ),
        };
      }),
    );
    closeModal();
  };

  const handleApplyRange = () => {
    if (!rangeStart || !rangeEnd || selectedTimeSlots.length === 0) return;
    const start = new Date(rangeStart);
    const end = new Date(rangeEnd);

    setCalendarData((prev) =>
      prev.map((item) => {
        if (!item.isCurrentMonth) return item;
        const cellDate = cellToRealDate(item);
        if (cellDate < start || cellDate > end) return item;

        const existingTimes = item.slots.map((s) => s.time);
        const additions = selectedTimeSlots
          .filter((t) => !existingTimes.includes(t))
          .map((time) => ({ time, status: "available" }));

        return {
          ...item,
          slots: [...item.slots, ...additions].sort((a, b) =>
            a.time.localeCompare(b.time),
          ),
        };
      }),
    );
    closeModal();
  };

  const activeCell =
    activeCellIndex !== null ? calendarData[activeCellIndex] : null;

  return (
    <DashboardLayout title="Jadwal Mentoring">
      <style>{darkModeFix}</style>
      <motion.div {...sectionReveal} className="flex flex-col gap-1">
        <h1 className="font-bold text-[22px] sm:text-[25px] text-white">
          Jadwal Mentoring
        </h1>
        <p className="text-[#9CA3AF] text-[14px] sm:text-[15px]">
          Buka jam-jam yang kamu luangin buat sesi mentoring -- mentee bakal
          milih dari slot ini pas checkout atau ganti jadwal.
        </p>
      </motion.div>

      <motion.div
        {...sectionReveal}
        className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4"
      >
        <div className="flex flex-col gap-1">
          <h2 className="font-bold text-[20px] sm:text-[24px] text-white">
            Juni 2026
          </h2>
          <p className="text-[#9CA3AF] text-[13px] italic">
            *Klik tanggal buat atur jam di hari itu, atau pakai &quot;Pilih
            Rentang&quot; buat banyak tanggal sekaligus
          </p>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <button
              aria-label="Bulan sebelumnya"
              className={`w-[36px] h-[36px] rounded-[8px] ms-panel border border-[#2D2342] flex items-center justify-center text-[#9CA3AF] hover:text-white hover:bg-[#2D1B4E] transition-colors ${focusRing}`}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              aria-label="Bulan berikutnya"
              className={`w-[36px] h-[36px] rounded-[8px] ms-panel border border-[#2D2342] flex items-center justify-center text-[#9CA3AF] hover:text-white hover:bg-[#2D1B4E] transition-colors ${focusRing}`}
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <button
            onClick={openRangeModal}
            className={`ms-accent text-white text-[13px] font-bold px-5 sm:px-6 py-2.5 rounded-[8px] hover:bg-[#117A75] transition-colors shadow-sm whitespace-nowrap ${focusRing}`}
          >
            Pilih Rentang
          </button>
        </div>
      </motion.div>

      {/* Legenda -- biar dua warna badge (available vs booked) kebaca jelas */}
      <div className="flex items-center gap-5 text-[12px] text-[#9CA3AF]">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#148F89]/20 border border-[#148F89]/50" />
          Slot Kosong
        </span>
        <span className="flex items-center gap-1.5">
          <Lock size={11} className="text-[#D1D83E]" />
          Sudah Dibooking
        </span>
      </div>

      <div className="w-full overflow-x-auto ms-panel rounded-[12px] border border-[#2D2342] shadow-lg">
        <div style={{ minWidth: "700px" }}>
          <div className="grid grid-cols-7 ms-header-row border-b border-[#2D2342]">
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

          <div className="grid grid-cols-7">
            {calendarData.map((item, index) => {
              const isRightEdge = (index + 1) % 7 === 0;
              const isBottomRow = index >= calendarData.length - 7;

              return (
                <button
                  key={index}
                  onClick={() => openSingleDateModal(item, index)}
                  disabled={!item.isCurrentMonth}
                  style={{ minHeight: "140px" }}
                  className={`p-3 flex flex-col gap-2 text-left transition-colors ${
                    item.isCurrentMonth
                      ? "cursor-pointer hover:bg-[#1A1128]"
                      : "cursor-default"
                  } ${!isRightEdge ? "border-r border-[#2D2342]" : ""} ${!isBottomRow ? "border-b border-[#2D2342]" : ""}`}
                >
                  <div className="flex justify-start">
                    <span
                      style={{ width: "28px", height: "28px" }}
                      className={`flex items-center justify-center rounded-full text-[14px] font-bold ${
                        item.isToday
                          ? "ms-accent text-white"
                          : item.isCurrentMonth
                            ? "text-[#E2E8F0]"
                            : "text-[#4B5563]"
                      }`}
                    >
                      {item.date}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {item.slots.map((slot, slotIndex) =>
                      slot.status === "booked" ? (
                        <span
                          key={slotIndex}
                          title={`Dibooking ${slot.menteeName}`}
                          className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-[#D1D83E]/10 text-[#D1D83E] border border-[#D1D83E]/30"
                        >
                          <Lock size={9} />
                          {slot.time}
                        </span>
                      ) : (
                        <span
                          key={slotIndex}
                          className="px-2 py-1 rounded-full text-[10px] font-bold bg-[#148F89]/10 text-[#148F89] border border-[#148F89]/30"
                        >
                          {slot.time}
                        </span>
                      ),
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- MODAL: single/range --- */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeModal}
          />

          <div
            style={{ maxWidth: "600px", maxHeight: "90vh" }}
            className="relative ms-panel w-full overflow-y-auto rounded-[12px] border border-[#2D2342] flex flex-col shadow-2xl"
          >
            <div className="p-6 sm:p-8 flex flex-col gap-6">
              {modalMode === "range" ? (
                <div className="flex flex-col gap-3">
                  <h3 className="text-white font-bold text-[16px]">
                    Pilih Rentang Tanggal
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[#9CA3AF] text-[12px] font-semibold">
                        Tanggal Mulai
                      </label>
                      <input
                        type="date"
                        value={rangeStart}
                        min="2026-06-01"
                        max="2026-06-30"
                        onChange={(e) => setRangeStart(e.target.value)}
                        style={{ height: "46px" }}
                        className={`w-full ms-inset border border-[#2D2342] rounded-[8px] px-3.5 text-[13px] text-white outline-none focus:border-[#148F89] transition-colors ${focusRing}`}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[#9CA3AF] text-[12px] font-semibold">
                        Tanggal Selesai
                      </label>
                      <input
                        type="date"
                        value={rangeEnd}
                        min={rangeStart || "2026-06-01"}
                        max="2026-06-30"
                        onChange={(e) => setRangeEnd(e.target.value)}
                        style={{ height: "46px" }}
                        className={`w-full ms-inset border border-[#2D2342] rounded-[8px] px-3.5 text-[13px] text-white outline-none focus:border-[#148F89] transition-colors ${focusRing}`}
                      />
                    </div>
                  </div>
                  <p className="text-[#6B7280] text-[11px]">
                    Jam yang kamu pilih di bawah bakal ditambahin ke tiap
                    tanggal dalam rentang ini (nggak ngilangin slot yang udah
                    ada, termasuk yang udah dibooking).
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <h3 className="text-white font-bold text-[16px]">
                    Atur Jam untuk Tanggal Ini
                  </h3>
                  <div className="flex justify-between items-center px-5 py-4 ms-inset rounded-[12px] border border-[#2D2342]">
                    <div className="flex flex-col gap-1">
                      <span className="text-[#9CA3AF] text-[12px] font-semibold">
                        Tanggal
                      </span>
                      <span className="text-[#E2E8F0] font-bold text-[14px]">
                        {activeCell?.date} Juni 2026
                      </span>
                    </div>
                    <CalendarIcon
                      size={20}
                      className="text-[#148F89] shrink-0"
                    />
                  </div>
                  {bookedTimes.length > 0 && (
                    <p className="flex items-start gap-2 text-[#D1D83E] text-[11px] bg-[#D1D83E]/5 border border-[#D1D83E]/20 rounded-[8px] px-3.5 py-2.5">
                      <Lock size={12} className="shrink-0 mt-0.5" />
                      {bookedTimes.length} jam di tanggal ini udah ada mentee
                      yang booking, jadi nggak bisa dimatiin dari sini.
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <h3 className="text-white font-bold text-[16px]">
                  Pilih Jam Ketersediaan
                </h3>
                <div
                  style={{ padding: "16px" }}
                  className="ms-inset border border-[#2D2342] rounded-[12px] grid grid-cols-3 sm:grid-cols-5 gap-3"
                >
                  {allTimeSlots.map((slot, index) => {
                    const isSelected = selectedTimeSlots.includes(slot);
                    const isLocked =
                      modalMode === "single" && bookedTimes.includes(slot);
                    return (
                      <button
                        key={index}
                        type="button"
                        disabled={isLocked}
                        onClick={() => toggleTimeSlot(slot)}
                        className={`py-2 rounded-[8px] text-[11px] font-bold border transition-colors flex items-center justify-center gap-1 ${focusRing} ${
                          isLocked
                            ? "bg-[#D1D83E]/5 border-[#D1D83E]/30 text-[#D1D83E] cursor-not-allowed"
                            : isSelected
                              ? "bg-[#148F89]/10 border-[#148F89] text-[#148F89]"
                              : "bg-transparent border-[#2D2342] text-[#9CA3AF] hover:border-[#9CA3AF] hover:text-white"
                        }`}
                      >
                        {isLocked && <Lock size={9} />}
                        {isSelected && !isLocked && <Check size={11} />}
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                <button
                  onClick={closeModal}
                  className={`px-6 py-2.5 bg-transparent border border-[#2D2342] text-[#9CA3AF] font-bold text-[13px] rounded-[8px] hover:bg-[#2D2342] hover:text-white transition-colors ${focusRing}`}
                >
                  Batal
                </button>
                <button
                  onClick={
                    modalMode === "range" ? handleApplyRange : handleApplySingle
                  }
                  disabled={
                    modalMode === "range"
                      ? !rangeStart ||
                        !rangeEnd ||
                        selectedTimeSlots.length === 0
                      : false
                  }
                  className={`px-6 py-2.5 ms-accent text-white font-bold text-[13px] rounded-[8px] hover:bg-[#117A75] transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${focusRing}`}
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
