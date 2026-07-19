"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Award, Download, Eye, Search } from "lucide-react";
import DashboardLayout from "@/component/mentor/DashboardLayout";
import EmptyState from "@/component/mentor/EmptyState";
import { apiRequest } from "@/lib/api";

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default function MentorCertificates() {
  const [searchQuery, setSearchQuery] = useState("");
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    apiRequest("/api/products/certificates/me/")
      .then((res) => setCertificates((res?.certificates || []).filter((c) => c.type === "instructor")))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const sectionReveal = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: shouldReduceMotion ? 0.2 : 0.4 },
    viewport: { once: true },
  };

  const cardReveal = (index) => ({
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: {
      duration: shouldReduceMotion ? 0.2 : 0.4,
      delay: shouldReduceMotion ? 0 : index * 0.05,
    },
    viewport: { once: true },
  });

  const hasAnyCertificate = certificates.length > 0;

  const filteredCertificates = certificates.filter((cert) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      (cert.product_title || "").toLowerCase().includes(query) ||
      cert.number.toLowerCase().includes(query)
    );
  });

  return (
    <DashboardLayout title="Certificates">
      {/* Intro */}
      <motion.div {...sectionReveal} className="flex flex-col gap-1">
        <h2 className="text-[22px] sm:text-[25px] font-bold text-white">
          Sertifikat Pemateri
        </h2>
        <p className="text-[#9CA3AF] text-[13px]">
          Sertifikat diterbitkan setelah kamu menuntaskan peranmu sebagai
          pemateri pada sebuah program bootcamp di Mark-Up.
        </p>
      </motion.div>

      {/* Search, cuma muncul kalau memang ada sertifikat untuk dicari */}
      {hasAnyCertificate && (
        <motion.div
          {...sectionReveal}
          className="relative w-full sm:max-w-[360px]"
        >
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama bootcamp atau no. sertifikat..."
            className="w-full bg-[#170F26] border border-[#2D2342] rounded-[8px] pl-10 pr-4 py-2.5 text-[13px] text-white placeholder:text-[#6B7280] outline-none focus:border-[#148F89]/60 transition-colors"
          />
        </motion.div>
      )}

      {!hasAnyCertificate ? (
        <EmptyState
          message="Kamu belum punya sertifikat pemateri. Selesaikan tugasmu di sebuah bootcamp untuk mendapatkan sertifikat pertamamu."
          ctaLabel="Lihat Active Classes"
          ctaHref="/mentor/active-classes"
        />
      ) : filteredCertificates.length === 0 ? (
        <EmptyState
          message={`Sertifikat dengan kata kunci "${searchQuery}" tidak ditemukan.`}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCertificates.map((cert, index) => (
            <motion.div
              key={cert.id}
              {...cardReveal(index)}
              className="flex flex-col rounded-[12px] overflow-hidden shadow-lg border border-[#2D2342] hover:border-[#148F89]/50 transition-colors"
            >
              {/* Seal / ribbon area */}
              <div className="h-[120px] bg-gradient-to-br from-[#4C1D95] to-[#0D9488] flex items-center justify-center">
                <Award size={40} className="text-white/90" />
              </div>

              <div className="bg-[#170F26] p-5 flex flex-col gap-3 flex-1">
                <h4 className="font-bold text-[15px] text-white leading-snug line-clamp-2 min-h-[40px]">
                  {cert.product_title || "Sertifikat"}
                </h4>

                <div className="flex flex-col gap-0.5 text-[12px] text-[#9CA3AF]">
                  <p>No. Sertifikat: {cert.number}</p>
                  <p>Diterbitkan: {formatDate(cert.issued_at)}</p>
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <a
                    href={cert.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-[#148F89] text-white text-[12px] font-semibold hover:bg-[#117A75] transition-colors"
                  >
                    <Eye size={14} />
                    Lihat
                  </a>
                  <a
                    href={cert.file_url}
                    download
                    className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] border border-[#2D2342] text-[#E2E8F0] text-[12px] font-semibold hover:border-[#148F89]/50 hover:text-white transition-colors"
                  >
                    <Download size={14} />
                    Unduh
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
