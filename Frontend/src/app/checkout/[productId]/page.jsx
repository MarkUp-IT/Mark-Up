"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Star,
  Linkedin,
  Briefcase,
  Ticket,
  AlertCircle,
  ShieldCheck,
  Search,
  CalendarClock,
} from "lucide-react";
import Navbar from "@/component/Navbar";

// Jarak & lebar krusial dipaksa lewat inline style (bukan class Tailwind) --
// biar dijamin kepakai apa pun kondisi build/cache Tailwind di project ini.
const NAVBAR_CLEARANCE = 150; // px, jarak aman dari Navbar yang fixed
const CONTENT_WIDTH = 640; // px, satu kolom di tengah
const MENTOR_LIST_MAX_HEIGHT = 380; // px, tinggi scroll internal list mentor

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#148F89] focus-visible:ring-offset-2 focus-visible:ring-offset-[#060010]";

const formatIDR = (val) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);

const getInitials = (name) =>
  name
    .replace(/^Kak\s+/i, "")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const PRODUCT = {
  id: "MT-010",
  type: "mentoring",
  title: "Bundling PowerPack (Newbie Friendly)",
  price: 300000,
  image: "/images/bund.png",
};

// --- MOCK DATA (nanti ganti query mentor_profiles + mentor_expertises,
// filter yang punya keahlian relevan sama produk ini). Sengaja dibikin agak
// banyak (10) biar search & scroll internal kepakai beneran, sesuai
// skenario "mentor ada puluhan" yang diomongin. ---
const MENTORS = [
  {
    id: "M1",
    name: "Kak Budi Santoso",
    headline: "Senior UI/UX Designer",
    rating: 4.9,
    reviewCount: 32,
    avatarGradient: "from-[#4C1D95] to-[#0D9488]",
    bio: "Praktisi desain produk dengan pengalaman 6+ tahun membangun produk digital di startup dan korporasi.",
    linkedin: "https://linkedin.com/in/budisantoso",
    expertise: ["Business Case Competition", "Career Mentoring"],
    experience: [
      { title: "Senior Product Designer, Gojek", period: "2022 — Sekarang" },
      { title: "UI/UX Designer, Tokopedia", period: "2019 — 2022" },
    ],
    slots: [
      { id: "S1", date: "Sab, 12 Jul", time: "18:00" },
      { id: "S2", date: "Min, 13 Jul", time: "10:00" },
      { id: "S3", date: "Sen, 14 Jul", time: "14:00" },
    ],
  },
  {
    id: "M2",
    name: "Kak Siska Wijaya",
    headline: "Product Design Lead",
    rating: 4.8,
    reviewCount: 21,
    avatarGradient: "from-[#4C1D95] to-[#CA8A04]",
    bio: "Membimbing 50+ tim dalam kompetisi bisnis nasional dan internasional, fokus di business case dan pitching.",
    linkedin: "https://linkedin.com/in/siskawijaya",
    expertise: ["Business Plan Competition", "Career Mentoring"],
    experience: [
      { title: "Design Lead, Traveloka", period: "2021 — Sekarang" },
      { title: "Business Consultant, PT Konsultan Maju", period: "2018 — 2021" },
    ],
    slots: [
      { id: "S4", date: "Sel, 15 Jul", time: "09:00" },
      { id: "S5", date: "Rab, 16 Jul", time: "16:00" },
    ],
  },
  {
    id: "M3",
    name: "Kak Alya Hamidah",
    headline: "Business Consultant",
    rating: 5.0,
    reviewCount: 47,
    avatarGradient: "from-[#4C1D95] to-[#B45309]",
    bio: "Konsultan bisnis dengan pengalaman membimbing tim juara di kompetisi BCC nasional dan internasional.",
    linkedin: "https://linkedin.com/in/alyahamidah",
    expertise: ["Business Case Competition"],
    experience: [
      { title: "Business Consultant, PT Konsultan Maju Bersama", period: "2023 — Sekarang" },
    ],
    slots: [
      { id: "S6", date: "Kam, 17 Jul", time: "13:00" },
      { id: "S7", date: "Jum, 18 Jul", time: "19:00" },
    ],
  },
  {
    id: "M4",
    name: "Kak Adena Laksita",
    headline: "Debate Coach & Public Speaking Trainer",
    rating: 4.7,
    reviewCount: 18,
    avatarGradient: "from-[#4C1D95] to-[#0D9488]",
    bio: "Mantan juara debat nasional, sekarang aktif melatih tim debat dan public speaking untuk kompetisi.",
    linkedin: "https://linkedin.com/in/adenalaksita",
    expertise: ["Career Mentoring"],
    experience: [{ title: "Debate Coach, Freelance", period: "2020 — Sekarang" }],
    slots: [{ id: "S8", date: "Sab, 19 Jul", time: "10:00" }],
  },
  {
    id: "M5",
    name: "Kak Fahri Ramadhan",
    headline: "Startup Founder & Business Plan Mentor",
    rating: 4.9,
    reviewCount: 29,
    avatarGradient: "from-[#4C1D95] to-[#CA8A04]",
    bio: "Founder startup dengan pengalaman menyusun business plan yang berhasil meraih pendanaan.",
    linkedin: "https://linkedin.com/in/fahriramadhan",
    expertise: ["Business Plan Competition"],
    experience: [{ title: "Co-Founder, RintisTech", period: "2021 — Sekarang" }],
    slots: [
      { id: "S9", date: "Min, 20 Jul", time: "15:00" },
      { id: "S10", date: "Sen, 21 Jul", time: "11:00" },
    ],
  },
  {
    id: "M6",
    name: "Kak Nadia Putri",
    headline: "HR Business Partner",
    rating: 4.6,
    reviewCount: 15,
    avatarGradient: "from-[#4C1D95] to-[#B45309]",
    bio: "Berpengalaman di rekrutmen dan pengembangan karier, sering jadi mentor persiapan interview kerja.",
    linkedin: "https://linkedin.com/in/nadiaputri",
    expertise: ["Career Mentoring"],
    experience: [{ title: "HR Business Partner, Bank Mandiri", period: "2020 — Sekarang" }],
    slots: [{ id: "S11", date: "Sel, 22 Jul", time: "16:00" }],
  },
  {
    id: "M7",
    name: "Kak Reza Firmansyah",
    headline: "Management Consultant",
    rating: 4.8,
    reviewCount: 24,
    avatarGradient: "from-[#4C1D95] to-[#0D9488]",
    bio: "Konsultan manajemen di firma consulting Big 4, spesialis case study dan problem solving framework.",
    linkedin: "https://linkedin.com/in/rezafirmansyah",
    expertise: ["Business Case Competition"],
    experience: [{ title: "Associate Consultant, Deloitte Indonesia", period: "2022 — Sekarang" }],
    slots: [{ id: "S12", date: "Rab, 23 Jul", time: "18:00" }],
  },
  {
    id: "M8",
    name: "Kak Clarissa Wijaya",
    headline: "Venture Capital Analyst",
    rating: 4.9,
    reviewCount: 20,
    avatarGradient: "from-[#4C1D95] to-[#CA8A04]",
    bio: "Analis VC yang sering menilai business plan startup, paham banget apa yang bikin proposal menang.",
    linkedin: "https://linkedin.com/in/clarissawijaya",
    expertise: ["Business Plan Competition"],
    experience: [{ title: "Investment Analyst, East Ventures", period: "2021 — Sekarang" }],
    slots: [{ id: "S13", date: "Kam, 24 Jul", time: "10:00" }],
  },
  {
    id: "M9",
    name: "Kak Gilang Ramadhan",
    headline: "Career Coach",
    rating: 4.7,
    reviewCount: 33,
    avatarGradient: "from-[#4C1D95] to-[#B45309]",
    bio: "Career coach bersertifikat, udah bantu 100+ mahasiswa dapat pekerjaan pertama mereka.",
    linkedin: "https://linkedin.com/in/gilangramadhan",
    expertise: ["Career Mentoring"],
    experience: [{ title: "Career Coach, Independen", period: "2019 — Sekarang" }],
    slots: [{ id: "S14", date: "Jum, 25 Jul", time: "14:00" }],
  },
  {
    id: "M10",
    name: "Kak Intan Permatasari",
    headline: "Strategy Consultant",
    rating: 5.0,
    reviewCount: 41,
    avatarGradient: "from-[#4C1D95] to-[#0D9488]",
    bio: "Konsultan strategi bisnis, mentor tetap buat tim BCC juara di beberapa kompetisi nasional.",
    linkedin: "https://linkedin.com/in/intanpermatasari",
    expertise: ["Business Case Competition", "Business Plan Competition"],
    experience: [{ title: "Strategy Consultant, McKinsey & Company", period: "2022 — Sekarang" }],
    slots: [{ id: "S15", date: "Sab, 26 Jul", time: "09:00" }],
  },
];

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-1">
      <Star size={12} className="fill-[#F59E0B] text-[#F59E0B]" />
      <span className="text-[#E2E8F0] text-[11px] font-semibold">{rating}</span>
    </div>
  );
}

function MentorAvatar({ mentor, size = 48 }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`shrink-0 rounded-full bg-gradient-to-br ${mentor.avatarGradient} flex items-center justify-center text-white font-bold`}
    >
      <span style={{ fontSize: size * 0.32 }}>{getInitials(mentor.name)}</span>
    </div>
  );
}

function StepPill({ current }) {
  return (
    <div className="flex items-center gap-2 text-[12px]">
      <span className={current === 1 ? "text-white font-semibold" : "text-[#6B7280]"}>
        1. Detail
      </span>
      <span className="text-[#3A3545]">→</span>
      <span className={current === 2 ? "text-white font-semibold" : "text-[#6B7280]"}>
        2. Bayar
      </span>
    </div>
  );
}

export default function CheckoutDetailPage() {
  const params = useParams();
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const product = { ...PRODUCT, id: params.productId || PRODUCT.id };
  const isMentoring = product.type === "mentoring";

  const [buyerInfo, setBuyerInfo] = useState({
    email: "prabrorosub@gmail.com",
    fullName: "Prabroro Subriantoro",
    phone: "",
  });

  const [mentorSearch, setMentorSearch] = useState("");
  const [selectedMentorId, setSelectedMentorId] = useState("");
  const [expandedMentorId, setExpandedMentorId] = useState(null);
  const [selectedSlotId, setSelectedSlotId] = useState("");

  const [showVoucherInput, setShowVoucherInput] = useState(false);
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);

  const [formError, setFormError] = useState("");

  const selectedMentor = MENTORS.find((m) => m.id === selectedMentorId) || null;
  const selectedSlot = selectedMentor?.slots.find((s) => s.id === selectedSlotId) || null;

  const filteredMentors = useMemo(() => {
    const query = mentorSearch.trim().toLowerCase();
    if (!query) return MENTORS;
    return MENTORS.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.headline.toLowerCase().includes(query) ||
        m.expertise.some((e) => e.toLowerCase().includes(query)),
    );
  }, [mentorSearch]);

  const discount = appliedVoucher ? Math.round(product.price * 0.1) : 0;
  const total = product.price - discount;

  const fadeIn = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: shouldReduceMotion ? 0.15 : 0.3 },
  };

  const selectMentor = (mentorId) => {
    setSelectedMentorId(mentorId);
    setSelectedSlotId("");
    setExpandedMentorId(null);
  };

  const applyVoucher = () => {
    if (!voucherInput.trim()) return;
    setAppliedVoucher(voucherInput.trim().toUpperCase());
    setVoucherInput("");
    setShowVoucherInput(false);
  };

  const handleProceed = () => {
    if (!buyerInfo.fullName.trim() || !buyerInfo.email.trim() || !buyerInfo.phone.trim()) {
      setFormError("Lengkapi dulu Informasi Pembeli sebelum lanjut ke pembayaran.");
      return;
    }
    if (isMentoring && (!selectedMentorId || !selectedSlotId)) {
      setFormError("Pilih mentor dan jadwal sesi dulu sebelum lanjut ke pembayaran.");
      return;
    }
    setFormError("");
    const query = new URLSearchParams({
      total: String(total),
      ...(appliedVoucher ? { voucher: appliedVoucher } : {}),
      ...(selectedMentorId ? { mentor: selectedMentorId } : {}),
      ...(selectedSlotId ? { schedule: selectedSlotId } : {}),
    });
    router.push(`/checkout/${product.id}/payment?${query.toString()}`);
  };

  return (
    <div style={{ backgroundColor: "#060010", minHeight: "100vh" }}>
      <style>{`
        .mentor-scroll::-webkit-scrollbar { width: 6px; }
        .mentor-scroll::-webkit-scrollbar-track { background: transparent; }
        .mentor-scroll::-webkit-scrollbar-thumb { background: #2D2342; border-radius: 999px; }
        .mentor-scroll::-webkit-scrollbar-thumb:hover { background: #3D3159; }
      `}</style>

      <div className="w-full min-h-screen bg-[#0F081C] font-inter text-white relative overflow-x-hidden">
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[150vw] md:w-[120vw] h-[300px] md:h-[400px] rounded-b-[100%] pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(177, 158, 239, 0.15) 0%, transparent 60%)",
          filter: "blur(40px)",
        }}
      />
       <Navbar />

      <main
        style={{
          maxWidth: `${CONTENT_WIDTH}px`,
          marginLeft: "auto",
          marginRight: "auto",
          paddingTop: `${NAVBAR_CLEARANCE}px`,
          paddingBottom: "96px",
          paddingLeft: "20px",
          paddingRight: "20px",
        }}
      >
        <div className="flex flex-col gap-6 font-jakarta text-white">
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <Link
              href="/produk"
              className={`inline-flex items-center gap-1.5 text-[#A19DAB] hover:text-white text-[13px] transition-colors rounded-[6px] ${focusRing}`}
            >
              <ArrowLeft size={15} />
              Kembali
            </Link>
            <StepPill current={1} />
          </div>

          {/* Heading */}
          <motion.div {...fadeIn} className="flex flex-col gap-1">
            <h1 className="text-[28px] font-bold font-poppins leading-tight">
              Selesaikan Pesananmu
            </h1>
            <p className="text-[#A19DAB] text-[13px]">
              Isi data di bawah, lalu lanjut ke pembayaran.
            </p>
          </motion.div>

          {/* Produk */}
          <motion.div
            {...fadeIn}
            className="rounded-[12px] overflow-hidden border border-[#2D2342] bg-[#170F26]"
          >
            <div className="h-[160px] bg-[#120822]">
              <img
                src={product.image}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="px-5 py-4 flex items-center justify-between gap-3">
              <span className="font-bold text-[15px] text-white">{product.title}</span>
              <span className="text-[#148F89] font-bold text-[15px] whitespace-nowrap">
                {formatIDR(product.price)}
              </span>
            </div>
          </motion.div>

          {isMentoring && (
            <>
              {/* Widget pilih mentor -- search + list scroll internal sendiri */}
              <motion.div
                {...fadeIn}
                className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-5 flex flex-col gap-3"
              >
                <h2 className="font-bold text-[15px] text-white">Pilih Mentor</h2>

                {/* Search */}
                <div className="relative">
                  <Search
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none"
                  />
                  <input
                    type="text"
                    value={mentorSearch}
                    onChange={(e) => setMentorSearch(e.target.value)}
                    placeholder="Cari nama atau keahlian mentor..."
                    className={`w-full bg-[#0F081C] border border-[#2D2342] rounded-[8px] pl-10 pr-3.5 py-2.5 text-[12px] text-white placeholder:text-[#6B7280] outline-none focus:border-[#148F89] transition-colors ${focusRing}`}
                  />
                </div>

                {/* Mentor terpilih -- ditaro di luar area scroll biar tetap
                    keliatan meski lagi nyari/scroll mentor lain */}
                {selectedMentor && (
                  <div className="flex items-center gap-3 bg-[#148F89]/5 border border-[#148F89]/40 rounded-[10px] p-3">
                    <MentorAvatar mentor={selectedMentor} size={38} />
                    <div className="flex-1 min-w-0">
                      <span className="text-white text-[13px] font-semibold truncate block">
                        {selectedMentor.name}
                      </span>
                      <span className="text-[#9CA3AF] text-[11px]">Mentor terpilih</span>
                    </div>
                    <Check size={16} className="text-[#148F89] shrink-0" />
                  </div>
                )}

                {/* List -- scroll di dalam box sendiri, TIDAK ikut nge-scroll
                    seluruh halaman */}
                <div
                  className="mentor-scroll flex flex-col gap-2 overflow-y-auto pr-1"
                  style={{ maxHeight: `${MENTOR_LIST_MAX_HEIGHT}px` }}
                >
                  {filteredMentors.length === 0 ? (
                    <p className="text-[#6B7280] text-[12px] text-center py-8">
                      Mentor &ldquo;{mentorSearch}&rdquo; nggak ketemu.
                    </p>
                  ) : (
                    filteredMentors.map((mentor) => {
                      const isSelected = selectedMentorId === mentor.id;
                      const isExpanded = expandedMentorId === mentor.id;
                      return (
                        <div
                          key={mentor.id}
                          className={`rounded-[10px] border overflow-hidden transition-colors shrink-0 ${
                            isSelected ? "border-[#148F89]" : "border-[#2D2342]"
                          } bg-[#0F081C]`}
                        >
                          <div className="p-3 flex items-center gap-2.5">
                            <MentorAvatar mentor={mentor} size={40} />
                            <div className="flex-1 min-w-0">
                              <span className="text-white font-semibold text-[12px] truncate block">
                                {mentor.name}
                              </span>
                              <p className="text-[#9CA3AF] text-[10px] truncate">
                                {mentor.headline}
                              </p>
                              <div className="mt-0.5">
                                <StarRating rating={mentor.rating} />
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <button
                                onClick={() => selectMentor(mentor.id)}
                                className={`px-2.5 py-1 rounded-[6px] text-[10px] font-semibold transition-colors ${focusRing} ${
                                  isSelected
                                    ? "bg-[#148F89]/15 text-[#148F89] border border-[#148F89]/40"
                                    : "bg-[#148F89] text-white hover:bg-[#117A75]"
                                }`}
                              >
                                {isSelected ? "Terpilih" : "Pilih"}
                              </button>
                              <button
                                onClick={() =>
                                  setExpandedMentorId(isExpanded ? null : mentor.id)
                                }
                                className="flex items-center gap-0.5 text-[#9CA3AF] hover:text-white text-[9px] transition-colors"
                              >
                                Detail
                                {isExpanded ? (
                                  <ChevronUp size={10} />
                                ) : (
                                  <ChevronDown size={10} />
                                )}
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="px-3 pb-3 pt-1 border-t border-[#2D2342] flex flex-col gap-2.5">
                              <p className="text-[#E2E8F0] text-[11px] leading-relaxed pt-2.5">
                                {mentor.bio}
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {mentor.expertise.map((exp) => (
                                  <span
                                    key={exp}
                                    className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-[#148F89]/10 text-[#148F89] border border-[#148F89]/30"
                                  >
                                    {exp}
                                  </span>
                                ))}
                              </div>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 text-[#E2E8F0]">
                                  <Briefcase size={11} className="text-[#148F89]" />
                                  <span className="text-[10px] font-semibold">
                                    Pengalaman
                                  </span>
                                </div>
                                {mentor.experience.map((exp, idx) => (
                                  <div key={idx} className="pl-4">
                                    <p className="text-white text-[10px] font-medium">
                                      {exp.title}
                                    </p>
                                    <p className="text-[#6B7280] text-[9px]">
                                      {exp.period}
                                    </p>
                                  </div>
                                ))}
                              </div>
                              <a
                                href={mentor.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-[#08C7E1] text-[10px] hover:underline w-fit"
                              >
                                <Linkedin size={11} />
                                Lihat Profil LinkedIn
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>

              {/* Section jadwal -- terpisah, cuma muncul setelah mentor kepilih */}
              {selectedMentor && (
                <motion.div
                  {...fadeIn}
                  className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-5 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-2">
                    <CalendarClock size={16} className="text-[#148F89]" />
                    <h2 className="font-bold text-[15px] text-white">
                      Jadwal Tersedia — {selectedMentor.name}
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedMentor.slots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlotId(slot.id)}
                        className={`px-3.5 py-2.5 rounded-[8px] border text-[12px] transition-colors ${focusRing} ${
                          selectedSlotId === slot.id
                            ? "border-[#148F89] bg-[#148F89]/10 text-white"
                            : "border-[#2D2342] text-[#9CA3AF] hover:border-[#148F89]/50 hover:text-white"
                        }`}
                      >
                        {slot.date}, {slot.time}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </>
          )}

          {/* Informasi Pembeli */}
          <motion.div
            {...fadeIn}
            className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-5 flex flex-col gap-4"
          >
            <h2 className="font-bold text-[15px] text-white">Informasi Pembeli</h2>

            <div className="flex flex-col gap-1.5">
              <label className="text-[#E2E8F0] text-[12px] font-semibold">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={buyerInfo.email}
                onChange={(e) => setBuyerInfo({ ...buyerInfo, email: e.target.value })}
                className={`w-full bg-[#0F081C] border border-[#2D2342] rounded-[8px] px-3.5 py-3 text-[13px] text-white outline-none focus:border-[#148F89] transition-colors ${focusRing}`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[#E2E8F0] text-[12px] font-semibold">
                Nama Lengkap <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={buyerInfo.fullName}
                onChange={(e) => setBuyerInfo({ ...buyerInfo, fullName: e.target.value })}
                className={`w-full bg-[#0F081C] border border-[#2D2342] rounded-[8px] px-3.5 py-3 text-[13px] text-white outline-none focus:border-[#148F89] transition-colors ${focusRing}`}
              />
              <p className="text-[#6B7280] text-[10px]">
                Sesuai KTP/KK, dipakai buat sertifikat.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[#E2E8F0] text-[12px] font-semibold">
                Nomor WhatsApp <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                value={buyerInfo.phone}
                onChange={(e) => setBuyerInfo({ ...buyerInfo, phone: e.target.value })}
                placeholder="+62"
                className={`w-full bg-[#0F081C] border border-[#2D2342] rounded-[8px] px-3.5 py-3 text-[13px] text-white placeholder:text-[#64748B] outline-none focus:border-[#148F89] transition-colors ${focusRing}`}
              />
            </div>
          </motion.div>

          {/* Ringkasan + Voucher + CTA */}
          <motion.div
            {...fadeIn}
            className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-5 flex flex-col gap-4"
          >
            <h2 className="font-bold text-[15px] text-white">Ringkasan Pesanan</h2>

            <div className="flex flex-col gap-2 text-[13px]">
              <div className="flex justify-between text-[#E2E8F0]">
                <span>Harga Produk</span>
                <span className="font-semibold">{formatIDR(product.price)}</span>
              </div>
              {appliedVoucher && (
                <div className="flex justify-between text-[#9CA3AF]">
                  <span>Diskon ({appliedVoucher})</span>
                  <span className="font-semibold text-red-400">-{formatIDR(discount)}</span>
                </div>
              )}
            </div>

            {showVoucherInput ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={voucherInput}
                  onChange={(e) => setVoucherInput(e.target.value)}
                  placeholder="Kode voucher"
                  className={`flex-1 min-w-0 bg-[#0F081C] border border-[#2D2342] rounded-[8px] px-3.5 py-2.5 text-[12px] text-white uppercase outline-none focus:border-[#148F89] transition-colors ${focusRing}`}
                />
                <button
                  onClick={applyVoucher}
                  className={`px-4 py-2.5 rounded-[8px] bg-[#148F89] text-white text-[12px] font-semibold hover:bg-[#117A75] transition-colors shrink-0 ${focusRing}`}
                >
                  Pakai
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowVoucherInput(true)}
                className={`flex items-center gap-2 text-[#9CA3AF] hover:text-white text-[12px] font-medium transition-colors w-fit ${focusRing}`}
              >
                <Ticket size={14} />
                {appliedVoucher ? `Voucher: ${appliedVoucher}` : "Punya kode voucher?"}
              </button>
            )}

            <div className="border-t border-[#2D2342] pt-3 flex justify-between items-center">
              <span className="text-white font-bold text-[14px]">Total</span>
              <span className="text-[#148F89] font-bold text-[19px]">
                {formatIDR(total)}
              </span>
            </div>

            {formError && (
              <p className="flex items-start gap-2 text-red-400 text-[11px] bg-red-500/10 border border-red-500/30 rounded-[8px] px-3 py-2.5">
                <AlertCircle size={13} className="shrink-0 mt-0.5" />
                {formError}
              </p>
            )}

            <button
              onClick={handleProceed}
              className={`w-full bg-[#148F89] text-white text-[14px] font-bold py-3.5 rounded-[8px] hover:bg-[#117A75] transition-colors ${focusRing}`}
            >
              Lanjut ke Pembayaran
            </button>

            <p className="flex items-center justify-center gap-1.5 text-[#6B7280] text-[10px]">
              <ShieldCheck size={12} className="text-[#148F89]" />
              Transfer manual, diverifikasi tim kami dalam 1x24 jam
            </p>
          </motion.div>
        </div>
      </main>
      </div>

    </div>
  );
}