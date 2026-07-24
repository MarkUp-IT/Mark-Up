"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Lock,
  Check,
} from "lucide-react";
import DashboardLayout from "@/component/mentor/DashboardLayout";
import { apiRequest } from "@/lib/api";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#148F89] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F081C]";

const allTimeSlots = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00",
];

const daysOfWeek = ["MIN", "SEN", "SEL", "RAB", "KAM", "JUM", "SAB"];
const monthLabels = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function pad2(n) {
  return String(n).padStart(2, "0");
}

// Ekstrak tanggal & jam dalam zona WIB dari ISO string, terlepas dari zona
// waktu browser yang buka halaman ini.
function toJakartaParts(isoString) {
  const d = new Date(isoString);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const map = {};
  parts.forEach((p) => {
    map[p.type] = p.value;
  });
  const hour = map.hour === "24" ? "00" : map.hour;
  return {
    dateStr: `${map.year}-${map.month}-${map.day}`,
    time: `${hour}:${map.minute}`,
  };
}

function nextHour(time) {
  const [h] = time.split(":").map(Number);
  return `${pad2((h + 1) % 24)}:00`;
}

function buildMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay(); // 0 = Minggu
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const todayStr = toJakartaParts(new Date().toISOString()).dateStr;

  const cells = [];
  for (let i = 0; i < startOffset; i++) {
    const date = daysInPrevMonth - startOffset + i + 1;
    const d = new Date(year, month - 1, date);
    cells.push({
      date,
      isCurrentMonth: false,
      dateStr: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(date)}`,
    });
  }
  for (let date = 1; date <= daysInMonth; date++) {
    const dateStr = `${year}-${pad2(month + 1)}-${pad2(date)}`;
    cells.push({
      date,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      dateStr,
    });
  }
  let nextDate = 1;
  while (cells.length % 7 !== 0 || cells.length < 42) {
    const d = new Date(year, month + 1, nextDate);
    cells.push({
      date: nextDate,
      isCurrentMonth: false,
      dateStr: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(nextDate)}`,
    });
    nextDate++;
    if (cells.length >= 42) break;
  }
  return cells;
}

export default function MentoringSchedule() {
  const darkModeFix = `
    .ms-panel { background-color: #170F26; }
    .ms-header-row { background-color: #1A1128; }
    .ms-inset { background-color: #0F081C; }
    .ms-accent { background-color: #148F89; }
  `;

  const today = new Date();
  const [cursor, setCursor] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalMode, setModalMode] = useState(null);
  const [activeDateStr, setActiveDateStr] = useState(null);
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

  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/api/mentors/me/availability/");
      setSlots(res?.availability || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  const slotsByDate = useMemo(() => {
    const map = {};
    for (const slot of slots) {
      const { dateStr, time } = toJakartaParts(slot.start_time);
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push({
        id: slot.id,
        time,
        status: slot.is_booked ? "booked" : "available",
        menteeName: slot.mentee_name,
        isPendingPayment: slot.is_pending_payment,
      });
    }
    Object.values(map).forEach((arr) => arr.sort((a, b) => a.time.localeCompare(b.time)));
    return map;
  }, [slots]);

  const calendarData = useMemo(
    () =>
      buildMonthGrid(cursor.year, cursor.month).map((cell) => ({
        ...cell,
        slots: slotsByDate[cell.dateStr] || [],
      })),
    [cursor, slotsByDate],
  );

  useEffect(() => {
    document.body.style.overflow = modalMode ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [modalMode]);

  const closeModal = () => {
    setModalMode(null);
    setActiveDateStr(null);
    setSelectedTimeSlots([]);
  };

  const goPrevMonth = () => {
    setCursor((c) => {
      const m = c.month - 1;
      return m < 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: m };
    });
  };
  const goNextMonth = () => {
    setCursor((c) => {
      const m = c.month + 1;
      return m > 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: m };
    });
  };

  const openSingleDateModal = (cell) => {
    if (!cell.isCurrentMonth) return;
    setActiveDateStr(cell.dateStr);
    setSelectedTimeSlots(
      cell.slots.filter((s) => s.status === "available").map((s) => s.time),
    );
    setModalMode("single");
  };

  const openRangeModal = () => {
    setSelectedTimeSlots([]);
    setRangeStart("");
    setRangeEnd("");
    setModalMode("range");
  };

  const activeCell = calendarData.find((c) => c.dateStr === activeDateStr) || null;
  const bookedTimes = (activeCell?.slots || [])
    .filter((s) => s.status === "booked")
    .map((s) => s.time);

  const toggleTimeSlot = (time) => {
    if (modalMode === "single" && bookedTimes.includes(time)) return;
    setSelectedTimeSlots((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time],
    );
  };

  async function addSlot(dateStr, time) {
    await apiRequest("/api/mentors/availability/add/", {
      method: "POST",
      body: {
        start_date: dateStr,
        end_date: dateStr,
        start_time: time,
        end_time: nextHour(time),
      },
    });
  }

  async function removeSlot(id) {
    await apiRequest(`/api/mentors/me/availability/${id}/`, { method: "DELETE" });
  }

  const handleApplySingle = async () => {
    if (!activeCell) return;
    setSaving(true);
    try {
      const existingAvailable = activeCell.slots.filter((s) => s.status === "available");
      const existingTimes = existingAvailable.map((s) => s.time);

      const toAdd = selectedTimeSlots.filter((t) => !existingTimes.includes(t));
      const toRemove = existingAvailable.filter((s) => !selectedTimeSlots.includes(s.time));

      await Promise.all([
        ...toAdd.map((time) => addSlot(activeDateStr, time)),
        ...toRemove.map((s) => removeSlot(s.id)),
      ]);

      await fetchAvailability();
      closeModal();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleApplyRange = async () => {
    if (!rangeStart || !rangeEnd || selectedTimeSlots.length === 0) return;
    setSaving(true);
    try {
      const start = new Date(`${rangeStart}T00:00:00`);
      const end = new Date(`${rangeEnd}T00:00:00`);
      const calls = [];

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
        const existingTimes = (slotsByDate[dateStr] || []).map((s) => s.time);
        for (const time of selectedTimeSlots) {
          if (!existingTimes.includes(time)) {
            calls.push(addSlot(dateStr, time));
          }
        }
      }

      await Promise.all(calls);
      await fetchAvailability();
      closeModal();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

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
            {monthLabels[cursor.month]} {cursor.year}
          </h2>
          <p className="text-[#9CA3AF] text-[13px] italic">
            *Klik tanggal buat atur jam di hari itu, atau pakai &quot;Pilih
            Rentang&quot; buat banyak tanggal sekaligus
          </p>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={goPrevMonth}
              aria-label="Bulan sebelumnya"
              className={`w-[36px] h-[36px] rounded-[8px] ms-panel border border-[#2D2342] flex items-center justify-center text-[#9CA3AF] hover:text-white hover:bg-[#2D1B4E] transition-colors ${focusRing}`}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={goNextMonth}
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
                  onClick={() => openSingleDateModal(item)}
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
                          title={
                            slot.menteeName
                              ? `Dibooking ${slot.menteeName}`
                              : slot.isPendingPayment
                                ? "Menunggu verifikasi pembayaran"
                                : "Sudah dibooking"
                          }
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

      {loading && (
        <p className="text-[#6B7280] text-[13px] text-center">Memuat jadwal...</p>
      )}

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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[#9CA3AF] text-[12px] font-semibold">
                        Tanggal Mulai
                      </label>
                      <input
                        type="date"
                        value={rangeStart}
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
                        min={rangeStart || undefined}
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
                        {activeDateStr}
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
                    saving ||
                    (modalMode === "range"
                      ? !rangeStart || !rangeEnd || selectedTimeSlots.length === 0
                      : false)
                  }
                  className={`px-6 py-2.5 ms-accent text-white font-bold text-[13px] rounded-[8px] hover:bg-[#117A75] transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${focusRing}`}
                >
                  {saving ? "Menyimpan..." : "Terapkan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
