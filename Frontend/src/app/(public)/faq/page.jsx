"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Search, ChevronDown, Headphones, Mail } from "lucide-react";
import Footer from "@/component/Footer";

import { categories, faqData } from "@/lib/faqData";

const allFaqs = Object.entries(faqData).flatMap(([category, items]) =>
  items.map((item) => ({ ...item, category })),
);

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState("General");
  const [openIndex, setOpenIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const shouldReduceMotion = useReducedMotion();

  const selectCategory = (cat) => {
    setActiveCategory(cat);
    setSearchQuery("");
    setOpenIndex(0);
  };

  const query = searchQuery.trim().toLowerCase();
  const searchResults = query
    ? allFaqs.filter(
        (item) =>
          item.q.toLowerCase().includes(query) ||
          item.a.toLowerCase().includes(query),
      )
    : null;

  const displayedFaqs = searchResults ?? faqData[activeCategory];

  const sectionReveal = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: shouldReduceMotion ? 0.2 : 0.4 },
    viewport: { once: true },
  };

  return (
    <div className="w-full font-jakarta text-white bg-[#060010] min-h-screen relative flex flex-col">
      {/* Background Glow -- overflow-hidden di-scope ke wrapper kecil ini
          doang (bukan di root), biar nggak ganggu scroll/sticky halaman. */}
      <div className="absolute inset-x-0 top-0 h-[400px] overflow-hidden pointer-events-none z-0">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[150vw] md:w-[120vw] h-[300px] md:h-[400px] rounded-b-[100%]"
          style={{
            background:
              "radial-gradient(ellipse at top, rgba(177, 158, 239, 0.15) 0%, transparent 60%)",
            filter: "blur(40px)",
          }}
        />
      </div>


      <div className="main-content flex flex-col gap-12 md:gap-16 items-center mt-28 md:mt-36 mb-24 relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6">
        {/* Hero */}
        <div className="flex flex-col gap-4 md:gap-6 items-center w-full">
          <div className="bg-[#08C7E1]/10 border border-[#08C7E1]/20 px-4 md:px-5 py-1.5 rounded-full flex justify-center items-center">
            <p className="text-[#08C7E1] font-semibold tracking-wide text-[11px] md:text-[13px]">
              Pertanyaan yang Sering Diajukan
            </p>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-[56px] text-center text-white font-bold font-poppins leading-tight tracking-tight">
            Frequently Asked{" "}
            <span className="text-transparent bg-gradient-to-br bg-clip-text from-[#FF9FFC] to-[#a98fff]">
              Questions
            </span>
          </h1>

          <div className="relative w-full max-w-[600px] mt-2">
            <Search
              size={18}
              className="absolute left-5 top-1/2 -translate-y-1/2 text-[#A19DAB]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Temukan jawaban instan untuk setiap pertanyaanmu seputar layanan kami."
              className="w-full bg-[#1A1625] border border-[#3A3545] rounded-full py-3 pl-12 pr-6 text-sm text-white placeholder-[#A19DAB] outline-none focus:border-[#08C7E1]/50 transition-colors"
            />
          </div>
        </div>

        {/* Kategori + Accordion */}
        <div className="w-full flex flex-col md:flex-row gap-8 md:gap-10">
          {/* Sidebar kategori -- disembunyikan efeknya (tapi tetap kelihatan)
              pas lagi search, karena hasil search nge-gabung semua kategori */}
          <div className="w-full md:w-[200px] shrink-0 flex md:flex-col gap-2 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => selectCategory(cat)}
                className={`shrink-0 text-left px-4 py-3 rounded-md md:rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                  activeCategory === cat && !searchResults
                    ? "bg-[#B19EEF]/15 text-[#B19EEF]"
                    : "text-[#A19DAB] hover:text-white hover:bg-white/5"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Daftar pertanyaan */}
          <div className="flex-1 flex flex-col gap-4">
            {searchResults && (
              <p className="text-[#A19DAB] text-sm mb-1">
                {searchResults.length} hasil untuk &ldquo;{searchQuery}&rdquo;
              </p>
            )}

            {displayedFaqs.length === 0 ? (
              <div className="border border-dashed border-[#3A3545] rounded-md md:rounded-lg py-12 px-6 text-center">
                <p className="text-[#A19DAB] text-sm">
                  Belum ada jawaban yang cocok. Coba kata kunci lain, atau
                  hubungi tim support kami langsung.
                </p>
              </div>
            ) : (
              displayedFaqs.map((item, idx) => {
                const isOpen = searchResults ? true : openIndex === idx;
                return (
                  <motion.div
                    key={`${item.q}-${idx}`}
                    {...sectionReveal}
                    className="rounded-md md:rounded-lg border border-[#B19EEF]/20 bg-gradient-to-br from-[#160C32] to-[#0F0A1F] overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        !searchResults && setOpenIndex(isOpen ? -1 : idx)
                      }
                      className="w-full flex items-center justify-between gap-4 px-5 md:px-7 py-4 md:py-5 text-left"
                    >
                      <div className="flex flex-col gap-1">
                        {searchResults && (
                          <span className="text-[#08C7E1] text-[11px] font-semibold uppercase tracking-wide">
                            {item.category}
                          </span>
                        )}
                        <span className="font-poppins font-bold text-[15px] md:text-[17px] text-white">
                          {item.q}
                        </span>
                      </div>
                      {!searchResults && (
                        <ChevronDown
                          size={20}
                          className={`shrink-0 text-[#A19DAB] transition-transform ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{
                            duration: shouldReduceMotion ? 0 : 0.25,
                          }}
                          className="overflow-hidden"
                        >
                          <p className="px-5 md:px-7 pb-5 md:pb-6 text-[#A19DAB] text-sm leading-relaxed">
                            {item.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* CTA Bantuan */}
        <motion.div
          {...sectionReveal}
          className="w-full rounded-md md:rounded-lg bg-gradient-to-br from-[#160C32] to-[#071526] border border-[#B19EEF]/20 py-14 px-6 flex flex-col items-center text-center gap-4"
        >
          <div className="w-14 h-14 rounded-full bg-[#B19EEF]/10 border border-[#B19EEF]/20 flex items-center justify-center">
            <Headphones size={24} className="text-[#B19EEF]" />
          </div>
          <div>
            <h2 className="font-poppins font-bold text-2xl text-white">
              Masih butuh bantuan?
            </h2>
            <p className="text-[#A19DAB] text-sm mt-2 max-w-[420px]">
              Tim support kami siap membantu kamu melalui WhatsApp atau email.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
            <a
              href="https://wa.me/62895414588925"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#E5DFFF] hover:bg-white text-[#530D8E] font-bold text-sm py-3 px-6 rounded-full transition-colors"
            >
              <Headphones size={16} />
              Hubungi Support
            </a>
            <a
              href="mailto:markup.ofc@gmail.com"
              className="flex items-center gap-2 border border-white/20 text-white font-bold text-sm py-3 px-6 rounded-full hover:bg-white/10 transition-colors"
            >
              <Mail size={16} />
              Kirim Email
            </a>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
