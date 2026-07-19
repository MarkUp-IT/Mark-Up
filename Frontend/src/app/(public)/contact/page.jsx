"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Mail, Phone, MapPin, Send, ExternalLink } from "lucide-react";
import Navbar from "@/component/Navbar";
import Footer from "@/component/Footer";
import { apiRequest } from "@/lib/api";

const ALAMAT =
  "Jl. Sutorejo Prima Indah Utara VII, No. 20, Kelurahan Dukuh Sutorejo, Kec. Mulyorejo, Kota Surabaya, Provinsi Jawa Timur";

export default function ContactPage() {
  const shouldReduceMotion = useReducedMotion();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const sectionReveal = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: shouldReduceMotion ? 0.2 : 0.4 },
    viewport: { once: true },
  };

  const handleChange = (field) => (e) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const isFormValid =
    formData.name.trim() &&
    formData.email.trim() &&
    formData.subject.trim() &&
    formData.message.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await apiRequest("/api/accounts/contact/", {
        method: "POST",
        auth: false,
        body: formData,
      });
      setIsSuccess(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setIsSuccess(false), 4000);
    } catch (err) {
      setSubmitError(err?.message || "Gagal mengirim pesan. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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

      <div className="main-content flex flex-col gap-12 items-center mt-28 md:mt-36 mb-24 relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6">
        {/* Hero */}
        <div className="flex flex-col gap-4 md:gap-6 items-center w-full">
          <div className="bg-[#08C7E1]/10 border border-[#08C7E1]/20 px-4 md:px-5 py-1.5 rounded-full flex justify-center items-center">
            <p className="text-[#08C7E1] font-semibold tracking-wide text-[11px] md:text-[13px]">
              Hubungi Kami
            </p>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-[56px] text-center text-white font-bold font-poppins leading-tight tracking-tight">
            Contact{" "}
            <span className="text-transparent bg-gradient-to-br bg-clip-text from-[#FF9FFC] to-[#a98fff]">
              Us
            </span>
          </h1>
        </div>

        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Kolom Kiri: Info Kontak */}
          <motion.div {...sectionReveal} className="flex flex-col gap-8">
            <p className="text-[#A19DAB] text-sm md:text-base leading-relaxed">
              Punya pertanyaan tentang kurikulum, kendala teknis, atau kemitraan
              profesional? Tim kami siap memberikan solusi terbaik.
            </p>

            {/* Kontak Kami */}
            <div className="flex flex-col gap-4">
              <h3 className="font-poppins font-bold text-lg text-white">
                Kontak Kami
              </h3>
              <div className="flex flex-col gap-4">
                <a
                  href="mailto:markup.ofc@gmail.com"
                  className="flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#1A132F] border border-[#B19EEF]/20 flex items-center justify-center shrink-0 group-hover:border-[#B19EEF]/50 transition-colors">
                    <Mail size={16} className="text-[#B19EEF]" />
                  </div>
                  <span className="text-sm md:text-[15px] text-white group-hover:text-[#B19EEF] transition-colors">
                    markup.ofc@gmail.com
                  </span>
                </a>
                <a
                  href="https://wa.me/62895414588925"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#1A132F] border border-[#B19EEF]/20 flex items-center justify-center shrink-0 group-hover:border-[#B19EEF]/50 transition-colors">
                    <Phone size={16} className="text-[#B19EEF]" />
                  </div>
                  <span className="text-sm md:text-[15px] text-white group-hover:text-[#B19EEF] transition-colors">
                    0895-4145-88925
                  </span>
                </a>
                <a
                  href="https://www.instagram.com/markup_official/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#1A132F] border border-[#B19EEF]/20 flex items-center justify-center shrink-0 group-hover:border-[#B19EEF]/50 transition-colors">
                    <Image
                      src="/images/instagram.svg"
                      width={15}
                      height={15}
                      alt=""
                      className="invert opacity-70"
                    />
                  </div>
                  <span className="text-sm md:text-[15px] text-white group-hover:text-[#B19EEF] transition-colors">
                    @markup_official
                  </span>
                </a>
                <a
                  href="https://www.linkedin.com/company/markupcom/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#1A132F] border border-[#B19EEF]/20 flex items-center justify-center shrink-0 group-hover:border-[#B19EEF]/50 transition-colors">
                    <Image
                      src="/images/linkedin.svg"
                      width={15}
                      height={15}
                      alt=""
                      className="invert opacity-70"
                    />
                  </div>
                  <span className="text-sm md:text-[15px] text-white group-hover:text-[#B19EEF] transition-colors">
                    Mark-Up
                  </span>
                </a>
              </div>
            </div>

            {/* Alamat Kami */}
            <div className="flex flex-col gap-4">
              <h3 className="font-poppins font-bold text-lg text-white">
                Alamat Kami
              </h3>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1A132F] border border-[#B19EEF]/20 flex items-center justify-center shrink-0">
                  <MapPin size={16} className="text-[#B19EEF]" />
                </div>
                <p className="text-sm md:text-[15px] text-white leading-relaxed pt-2">
                  {ALAMAT}
                </p>
              </div>

              {/* Placeholder peta -- link ke pencarian Google Maps pakai teks
                  alamat, jadi selalu akurat tanpa perlu koordinat manual */}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ALAMAT)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="relative w-full h-[220px] rounded-md md:rounded-lg border border-[#B19EEF]/20 bg-[#1A132F] flex flex-col items-center justify-center gap-2 overflow-hidden group hover:border-[#B19EEF]/50 transition-colors"
              >
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(177,158,239,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(177,158,239,0.15) 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                  }}
                />
                <MapPin
                  size={28}
                  className="text-[#B19EEF] relative z-10 group-hover:scale-110 transition-transform"
                />
                <span className="text-sm text-white font-semibold flex items-center gap-1.5 relative z-10">
                  Buka di Google Maps
                  <ExternalLink size={13} />
                </span>
              </a>
            </div>
          </motion.div>

          {/* Kolom Kanan: Form */}
          <motion.div
            {...sectionReveal}
            className="rounded-md md:rounded-lg bg-gradient-to-br from-[#160C32] to-[#0F0A1F] border border-[#B19EEF]/20 p-6 md:p-8 h-fit"
          >
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#A19DAB]">Nama Lengkap</label>
                  <input
                    value={formData.name}
                    onChange={handleChange("name")}
                    placeholder="Masukkan nama Anda"
                    className="bg-transparent border-b border-[#3A3545] focus:border-[#08C7E1] outline-none py-2 text-sm text-white placeholder-[#6B6577] transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#A19DAB]">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={handleChange("email")}
                    placeholder="nama@email.com"
                    className="bg-transparent border-b border-[#3A3545] focus:border-[#08C7E1] outline-none py-2 text-sm text-white placeholder-[#6B6577] transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[#A19DAB]">Subjek</label>
                <input
                  value={formData.subject}
                  onChange={handleChange("subject")}
                  placeholder="Topik pembicaraan"
                  className="bg-transparent border-b border-[#3A3545] focus:border-[#08C7E1] outline-none py-2 text-sm text-white placeholder-[#6B6577] transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[#A19DAB]">Pesan</label>
                <textarea
                  value={formData.message}
                  onChange={handleChange("message")}
                  placeholder="Tuliskan pesan Anda di sini..."
                  rows={5}
                  className="bg-transparent border-b border-[#3A3545] focus:border-[#08C7E1] outline-none py-2 text-sm text-white placeholder-[#6B6577] resize-none transition-colors"
                />
              </div>

              <div className="flex items-center gap-4 mt-2">
                <button
                  type="submit"
                  disabled={!isFormValid || isSubmitting}
                  className="flex items-center gap-2 bg-[#E5DFFF] hover:bg-white text-[#530D8E] font-bold text-sm py-3 px-7 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Mengirim..." : "Kirim Pesan"}
                  <Send size={15} />
                </button>
                <AnimatePresence>
                  {isSuccess && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-[#08C7E1] text-sm font-medium"
                    >
                      Pesan terkirim, terima kasih!
                    </motion.span>
                  )}
                  {submitError && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-red-400 text-sm font-medium"
                    >
                      {submitError}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </form>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
