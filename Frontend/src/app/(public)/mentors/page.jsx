"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "@/component/Navbar";
import Footer from "@/component/Footer";
import { motion, useReducedMotion } from "framer-motion";
import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import { api, ApiError } from "@/lib/api";

// --- DATA MENTOR ---
// role/photo/linkedin/instagram sengaja dikosongkan dulu (bukan di-invent) --
// isi field ini dengan data asli begitu tersedia. Selama masih kosong, UI-nya
// otomatis fallback ke avatar inisial (bukan foto) dan icon sosial jadi nonaktif
// (bukan link mati yang keliatan aktif tapi nggak beneran nyambung ke mana-mana).

// Beberapa gradient dari palet Mark-Up yang udah ada, dipakai bergantian buat
// background avatar inisial biar nggak monoton semua kartu sama persis.
const AVATAR_GRADIENTS = [
  "from-[#4A2CA1] to-[#17A9D4]",
  "from-[#FF9FFC] to-[#a98fff]",
  "from-[#3B0E76] to-[#1A0A3A]",
  "from-[#570A93] to-[#082CE1]",
];

const CARD_BASE =
  "rounded-md md:rounded-lg border border-[#B19EEF]/20 shadow-[0_0_30px_rgba(177,158,239,0.1)] hover:border-[#B19EEF]/50 transition-colors duration-300";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B19EEF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#060010]";


function mapApiMentor(item) {
  return {
    name: item.name,
    role: item.headline || "",
    photo: item.photo || "",
    linkedin: item.linkedin || "",
    instagram: item.instagram || "",
  };
}
// Ambil 2 huruf pertama dari nama depan+tengah, buang gelar (mis. ", FMVA")
function getInitials(name) {
  const cleanName = name.split(",")[0].trim();
  const parts = cleanName.split(" ").filter(Boolean);
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

// Tombol icon sosial: kalau URL belum ada, tetap ditampilkan (bukan disembunyikan)
// tapi non-interaktif & pudar -- biar layout-nya kelihatan lengkap sambil jujur
// soal mana yang belum siap dipakai.
function SocialIcon({ href, iconSrc, label }) {
  const iconButton = (
    <div className="group/icon rounded-full bg-[#060010] w-8 h-8 border border-white/20 flex items-center justify-center hover:bg-white transition-colors">
      <Image
        src={iconSrc}
        width={14}
        height={14}
        alt=""
        className={
          href
            ? "invert group-hover/icon:invert-0 transition-all"
            : "invert opacity-30"
        }
      />
    </div>
  );

  if (!href) {
    return (
      <span title="Belum tersedia" className="cursor-not-allowed">
        {iconButton}
      </span>
    );
  }

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={`rounded-full ${focusRing}`}
    >
      {iconButton}
    </Link>
  );
}

export default function MentorPage() {
  const shouldReduceMotion = useReducedMotion();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMentors() {
      try {
        setLoading(true);
        const json = await api.get("/api/mentors/", { auth: false });
        console.log(json);
        const mapped = (json.mentors || []).map(mapApiMentor);
        setMentors(mapped);
        setError(null);
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : "Gagal memuat data mentor. Silakan coba lagi.",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchMentors();
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#0F081C] font-inter text-white relative overflow-x-hidden">
      {/* Background Glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[150vw] md:w-[120vw] h-[300px] md:h-[400px] rounded-b-[100%] pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(177, 158, 239, 0.15) 0%, transparent 60%)",
          filter: "blur(40px)",
        }}
      />

      <Navbar />

      <div className="main-content flex flex-col gap-16 md:gap-24 items-center mt-28 md:mt-36 mb-24 relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6">
        {/* Hero Section */}
        <div className="hero-section flex flex-col gap-4 md:gap-6 items-center w-full">
          <div className="bg-[#08C7E1]/10 border border-[#08C7E1]/20 px-4 md:px-5 py-1.5 rounded-full flex justify-center items-center">
            <p className="text-[#08C7E1] font-semibold tracking-wide text-[11px] md:text-[13px]">
              Tim Expert
            </p>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-[56px] text-center text-white font-bold font-poppins leading-tight tracking-tight">
            Expert{" "}
            <span className="text-transparent bg-gradient-to-br bg-clip-text from-[#FF9FFC] to-[#a98fff]">
              Mentor
            </span>
          </h1>
          <p className="w-full max-w-[800px] text-center font-light text-[#A19DAB] text-sm md:text-base leading-relaxed px-2">
            Kolaborasi para ahli dan praktisi yang bekerja di balik layar untuk
            memastikan pengalaman belajarmu di MARK-UP berjalan optimal.
          </p>
        </div>

        {/* Mentor List Section */}
        <div className="mentor-content flex flex-col items-center w-full max-w-[1200px]">
          {loading && (
            <p className="text-[#A19DAB] text-sm">Memuat data mentor...</p>
          )}

          {!loading && error && <p className="text-red-400 text-sm">{error}</p>}

          {!loading && !error && mentors.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 text-center py-16 px-6 border border-dashed border-[#B19EEF]/20 rounded-md w-full">
              <Users size={32} className="text-[#A19DAB]" />
              <p className="text-[#A19DAB] text-sm max-w-[320px]">
                Belum ada mentor yang bisa ditampilkan saat ini.
              </p>
            </div>
          )}

          {!loading && !error && mentors.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6 w-full">
              {mentors.map((mentor, index) => (
                <motion.div
                  key={mentor.name}
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: shouldReduceMotion ? 0.2 : 0.4,
                    delay: shouldReduceMotion ? 0 : index * 0.05,
                  }}
                  viewport={{ once: true }}
                  className={`bg-[#120822]/60 backdrop-blur-md p-6 flex flex-col items-center text-center gap-3 ${CARD_BASE}`}
                >
                  {/* Avatar: foto asli kalau ada, fallback ke inisial */}
                  <div
                    className={`w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden shrink-0 ring-2 ring-white/10 flex items-center justify-center bg-gradient-to-br ${
                      AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length]
                    }`}
                  >
                    {mentor.photo ? (
                      <img
                        src={mentor.photo}
                        alt={mentor.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-poppins font-bold text-lg md:text-xl">
                        {getInitials(mentor.name)}
                      </span>
                    )}
                  </div>

                  {/* Nama */}
                  <h3 className="font-poppins font-bold text-[15px] md:text-base text-white leading-snug px-1">
                    {mentor.name}
                  </h3>

                  {/* Role, cuma tampil kalau datanya ada */}
                  {mentor.role && (
                    <p className="text-[#A19DAB] text-xs -mt-2">
                      {mentor.role}
                    </p>
                  )}

                  {/* Sosial media */}
                  <div className="flex items-center gap-3 mt-1">
                    <SocialIcon
                      href={mentor.linkedin}
                      iconSrc="/images/linkedin.svg"
                      label={`LinkedIn ${mentor.name}`}
                    />
                    <SocialIcon
                      href={mentor.instagram}
                      iconSrc="/images/instagram.svg"
                      label={`Instagram ${mentor.name}`}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
