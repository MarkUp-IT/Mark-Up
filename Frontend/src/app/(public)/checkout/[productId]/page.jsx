"use client";

import { useState, useMemo, useEffect } from "react";
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
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { useCheckoutFormStore } from "@/store/formstore";

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



const AVATAR_GRADIENTS = [
  "from-[#4C1D95] to-[#0D9488]",
  "from-[#4C1D95] to-[#CA8A04]",
  "from-[#4C1D95] to-[#B45309]",
];

function pickAvatarGradient(id) {
  // hash sederhana dari id supaya gradient-nya konsisten tiap render,
  // bukan random tiap kali komponen re-render
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash + id.charCodeAt(i)) % AVATAR_GRADIENTS.length;
  }
  return AVATAR_GRADIENTS[hash];
}

function formatExperiencePeriod(exp) {
  const startYear = new Date(exp.start_date).getFullYear();
  const endYear = exp.end_date ? new Date(exp.end_date).getFullYear() : "Sekarang";
  return `${startYear} — ${endYear}`;
}

function mapMentorFromApi(m) {
  return {
    id: m.id,
    name: m.name,
    headline: m.headline || "Mentor",
    rating: m.rating,
    reviewCount: m.review_count,
    bio: m.bio,
    linkedin: m.linkedin,
    expertise: m.expertise,
    avatarGradient: pickAvatarGradient(m.id),
    experience: m.experience.map((exp) => ({
      title: exp.title,
      period: formatExperiencePeriod(exp),
    })),
    slots: m.slots, // sudah sesuai bentuk {id, date, time}
  };
}

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
      <span
        className={
          current === 1 ? "text-white font-semibold" : "text-[#6B7280]"
        }
      >
        1. Detail
      </span>
      <span className="text-[#3A3545]">→</span>
      <span
        className={
          current === 2 ? "text-white font-semibold" : "text-[#6B7280]"
        }
      >
        2. Bayar
      </span>
    </div>
  );
}



export default function CheckoutDetailPage() {
  const params = useParams();
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const [product, setProduct] = useState(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [productError, setProductError] = useState("");
  
  const [mentors, setMentors] = useState([]);
  const [isLoadingMentors, setIsLoadingMentors] = useState(false);
  const [mentorsError, setMentorsError] = useState("");


  const isMentoring = product?.type === "MENTORING";

  const buyerInfo = useCheckoutFormStore((s) => s.buyerInfo);
  const setBuyerInfo = useCheckoutFormStore((s) => s.setBuyerInfo);

  const notes = useCheckoutFormStore((s) => s.notes);
  const setNotes = useCheckoutFormStore((s) => s.setNotes);

  const voucherCode = useCheckoutFormStore((s) => s.voucherCode);
  const setVoucherCode = useCheckoutFormStore((s) => s.setVoucherCode);

  const setCheckoutSummary = useCheckoutFormStore((s) => s.setCheckoutSummary);
  const setMentorSelection = useCheckoutFormStore((s) => s.setMentorSelection);
  const clearMentorSelection = useCheckoutFormStore((s) => s.clearMentorSelection);

  const [mentorSearch, setMentorSearch] = useState("");
  const [selectedMentorId, setSelectedMentorId] = useState("");
  const [expandedMentorId, setExpandedMentorId] = useState(null);
  const [selectedSlotId, setSelectedSlotId] = useState("");

  const [showVoucherInput, setShowVoucherInput] = useState(false);
  const [voucherInput, setVoucherInput] = useState("");

  const [formError, setFormError] = useState("");

  // Semua tipe produk (bukan cuma mentoring) sekarang wajib profil lengkap
  // sebelum bisa checkout -- kalau belum, langsung diarahkan ke Pengaturan
  // begitu halaman ini dibuka (lihat useEffect checkProfileCompleteness di
  // bawah), jadi nggak perlu banner/nunggu tombol diklik dulu.
  const [checkingProfile, setCheckingProfile] = useState(true);

  const selectedMentor = mentors.find((m) => m.id === selectedMentorId) || null;
  const selectedSlot =
    selectedMentor?.slots.find((s) => s.id === selectedSlotId) || null;

  const filteredMentors = useMemo(() => {
    const query = mentorSearch.trim().toLowerCase();
    if (!query) return mentors;
    return mentors.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.headline.toLowerCase().includes(query) ||
        m.expertise.some((e) => e.toLowerCase().includes(query)),
    );
  }, [mentorSearch, mentors]);

  const price = product?.new_price ?? 0;

  const discount = voucherCode ? Math.round(price * 0.1) : 0;
  const total = price - discount;

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
    setVoucherCode(voucherInput.trim().toUpperCase());
    setVoucherInput("");
    setShowVoucherInput(false);
  };

  const handleProceed = () => {
    if (
      !buyerInfo.fullName.trim() ||
      !buyerInfo.email.trim() ||
      !buyerInfo.phone.trim()
    ) {
      setFormError(
        "Lengkapi dulu Informasi Pembeli sebelum lanjut ke pembayaran.",
      );
      return;
    }
    if (isMentoring && (!selectedMentorId || !selectedSlotId)) {
      setFormError(
        "Pilih mentor dan jadwal sesi dulu sebelum lanjut ke pembayaran.",
      );
      return;
    }
    setFormError("");

    setCheckoutSummary({
      productId: product.id,
      productTitle: product.title,
      total,
    });

    if (isMentoring) {
      setMentorSelection(selectedMentor, selectedSlot);
    } else {
      clearMentorSelection();
    }

    router.push(`/checkout/${product.id}/payment`);
  };

  useEffect(() => {
    if (!params.productId) return;

    async function fetchProduct() {
      setIsLoadingProduct(true);
      setProductError("");
      try {
        const data = await api.get(`/api/products/${params.productId}/`, { auth: false });
        setProduct(data);
      } catch (err) {
        if (err instanceof ApiError) {
          setProductError(err.message);
        } else {
          setProductError("Gagal memuat produk.");
        }
      } finally {
        setIsLoadingProduct(false);
      }
    }

    fetchProduct();
  }, [params.productId]);

  useEffect(() => {
    if (!isMentoring) return;

    async function fetchMentors() {
      setIsLoadingMentors(true);
      setMentorsError("");
      try {
        const data = await api.get(
          `/api/mentors/?product_id=${params.productId}`,
          { auth: false },
        );
        setMentors(data.mentors.map(mapMentorFromApi));
      } catch (err) {
        setMentorsError(
          err instanceof ApiError ? err.message : "Gagal memuat daftar mentor."
        );
      } finally {
        setIsLoadingMentors(false);
      }
    }

    fetchMentors();
  }, [isMentoring, params.productId]);

  useEffect(() => {
    let cancelled = false;

    async function checkProfileCompleteness() {
      try {
        const data = await api.get("/api/accounts/me/profile/");
        if (cancelled) return;

        if (!data) {
          // Belum login -- biarin lanjut, nanti keblokir wajar pas submit
          // checkout beneran (butuh token).
          setCheckingProfile(false);
          return;
        }

        const REQUIRED_FIELDS = {
          phone: "Nomor WhatsApp",
          institution: "Institusi",
          current_status: "Status Saat Ini",
          linkedin_url: "LinkedIn",
        };
        const missingFields = Object.entries(REQUIRED_FIELDS)
          .filter(([field]) => !data.user?.[field]?.trim())
          .map(([, label]) => label);
        if (!data.user?.profile_image) {
          missingFields.push("Foto Profil");
        }

        if (missingFields.length > 0) {
          toast.error("Lengkapi profil kamu dulu", {
            description: `Sebelum membeli produk, lengkapi dulu: ${missingFields.join(", ")}.`,
          });
          router.replace("/user/settings");
          return;
        }

        setCheckingProfile(false);
      } catch {
        if (!cancelled) setCheckingProfile(false);
      }
    }

    checkProfileCompleteness();
    return () => {
      cancelled = true;
    };
  }, [router]);


  if (isLoadingProduct || checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  if (productError) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-400">
        {productError}
      </div>
    );
  }

  if (!product) {
    return null;
  }
  return (
    <div style={{ backgroundColor: "#060010", minHeight: "100vh" }}>
      <style>{`
        .mentor-scroll::-webkit-scrollbar { width: 6px; }
        .mentor-scroll::-webkit-scrollbar-track { background: transparent; }
        .mentor-scroll::-webkit-scrollbar-thumb { background: #2D2342; border-radius: 999px; }
        .mentor-scroll::-webkit-scrollbar-thumb:hover { background: #3D3159; }
      `}</style>

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
              href="/products"
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
            <div className="px-5 py-4 flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-[15px] text-white">
                  {product.title}
                </span>
                <span className="text-[#148F89] font-bold text-[15px] whitespace-nowrap">
                  {formatIDR(product.new_price)}
                </span>
              </div>
              {product.sessionCount > 1 && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#08C7E1]/10 text-[#08C7E1] border border-[#08C7E1]/20 w-fit">
                  Paket {product.sessionCount} Sesi
                </span>
              )}
            </div>
          </motion.div>

          {isMentoring && (
            <>
              {/* Widget pilih mentor -- search + list scroll internal sendiri */}
              <motion.div
                {...fadeIn}
                className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-5 flex flex-col gap-3"
              >
                <h2 className="font-bold text-[15px] text-white">
                  Pilih Mentor
                </h2>

                {isLoadingMentors && (
                  <p className="text-[#6B7280] text-[12px] text-center py-4">
                    Memuat daftar mentor...
                  </p>
                )}

                {mentorsError && (
                  <p className="flex items-start gap-2 text-red-400 text-[11px] bg-red-500/10 border border-red-500/30 rounded-[8px] px-3 py-2.5">
                    <AlertCircle size={13} className="shrink-0 mt-0.5" />
                    {mentorsError}
                  </p>
                )}

                {!isLoadingMentors && !mentorsError && (
                  <>
                    {/* Search input, mentor terpilih, dan list mentor tetap di sini seperti sebelumnya */}
                  </>
                )}

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
                      <span className="text-[#9CA3AF] text-[11px]">
                        Mentor terpilih
                      </span>
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
                    <div className="flex flex-col items-center gap-2 text-center py-10 px-4">
                      <Search size={22} className="text-[#4B3B6B]" />
                      <p className="text-[#6B7280] text-[12px]">
                        {mentors.length === 0
                          ? "Belum ada mentor yang tersedia untuk sesi ini. Coba lagi beberapa saat lagi ya."
                          : `Mentor "${mentorSearch}" nggak ketemu.`}
                      </p>
                    </div>
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
                                  setExpandedMentorId(
                                    isExpanded ? null : mentor.id,
                                  )
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
                                  <Briefcase
                                    size={11}
                                    className="text-[#148F89]"
                                  />
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
                      {product.sessionCount > 1
                        ? `Jadwal Sesi Pertama — ${selectedMentor.name}`
                        : `Jadwal Tersedia — ${selectedMentor.name}`}
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

                  {product.sessionCount > 1 && (
                    <p className="flex items-start gap-2 text-[#9CA3AF] text-[11px] bg-[#0F081C] border border-[#2D2342] rounded-[8px] px-3.5 py-3 leading-relaxed">
                      <AlertCircle
                        size={13}
                        className="shrink-0 mt-0.5 text-[#08C7E1]"
                      />
                      Paket ini {product.sessionCount} sesi. Jadwal di atas cuma
                      buat{" "}
                      <span className="text-white font-medium">
                        sesi pertama
                      </span>{" "}
                      — sisanya ({product.sessionCount - 1} sesi lagi) bisa kamu
                      pilih sendiri nanti di halaman{" "}
                      <span className="text-white font-medium">
                        Produk Saya
                      </span>
                      , begitu pembayaran ini udah dikonfirmasi.
                    </p>
                  )}
                </motion.div>
              )}
            </>
          )}

          {/* Informasi Pembeli */}
          <motion.div
            {...fadeIn}
            className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-5 flex flex-col gap-4"
          >
            <h2 className="font-bold text-[15px] text-white">
              Informasi Pembeli
            </h2>

            <div className="flex flex-col gap-1.5">
              <label className="text-[#E2E8F0] text-[12px] font-semibold">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={buyerInfo.email}
                onChange={(e) =>
                  setBuyerInfo({ ...buyerInfo, email: e.target.value })
                }
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
                onChange={(e) =>
                  setBuyerInfo({ ...buyerInfo, fullName: e.target.value })
                }
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
                onChange={(e) =>
                  setBuyerInfo({ ...buyerInfo, phone: e.target.value })
                }
                placeholder="+62"
                className={`w-full bg-[#0F081C] border border-[#2D2342] rounded-[8px] px-3.5 py-3 text-[13px] text-white placeholder:text-[#64748B] outline-none focus:border-[#148F89] transition-colors ${focusRing}`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[#E2E8F0] text-[12px] font-semibold">
                Catatan <span className="text-[#6B7280] font-normal">(opsional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Contoh: kalau ini pesanan tim, tulis nama-nama anggota di sini."
                className={`w-full bg-[#0F081C] border border-[#2D2342] rounded-[8px] px-3.5 py-3 text-[13px] text-white placeholder:text-[#64748B] outline-none focus:border-[#148F89] transition-colors resize-none ${focusRing}`}
              />
              <p className="text-[#6B7280] text-[10px]">
                Kalau produk ini dipesan buat tim/kelompok, tuliskan nama-nama anggotanya di sini biar mentor tahu.
              </p>
            </div>
          </motion.div>

          {/* Ringkasan + Voucher + CTA */}
          <motion.div
            {...fadeIn}
            className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-5 flex flex-col gap-4"
          >
            <h2 className="font-bold text-[15px] text-white">
              Ringkasan Pesanan
            </h2>

            <div className="flex flex-col gap-2 text-[13px]">
              <div className="flex justify-between text-[#E2E8F0]">
                <span>Harga Produk</span>
                <span className="font-semibold">
                  {formatIDR(product.new_price)}
                </span>
              </div>
              {voucherCode && (
                <div className="flex justify-between text-[#9CA3AF]">
                  <span>Diskon ({voucherCode})</span>
                  <span className="font-semibold text-red-400">
                    -{formatIDR(discount)}
                  </span>
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
                {voucherCode ? `Voucher: ${voucherCode}` : "Punya kode voucher?"}
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
              className={`w-full bg-[#148F89] text-white text-[14px] font-bold py-3.5 rounded-[8px] hover:bg-[#117A75] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#148F89] ${focusRing}`}
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
  );
}
