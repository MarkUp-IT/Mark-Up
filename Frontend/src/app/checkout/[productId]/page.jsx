"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Ticket,
  X,
  Upload,
  Image as ImageIcon,
  Copy,
  CheckCircle2,
  AlertCircle,
  Landmark,
  Trash2,
} from "lucide-react";
import Link from "next/link";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#148F89] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F081C]";

export default function CheckoutPage({ params }) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  // --- 1. STATE FORM PEMBELI & MENTORING ---
  const [buyerInfo, setBuyerInfo] = useState({
    email: "prabrorosub@gmail.com",
    fullName: "Prabroro Subriantoro",
    phone: "",
  });
  const [selectedMentor, setSelectedMentor] = useState("");

  // --- 2. STATE VOUCHER ---
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);

  // --- 3. STATE PAYMENT (MODAL) ---
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lock body scroll saat modal apapun terbuka
  useEffect(() => {
    if (isVoucherModalOpen || isPaymentModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isVoucherModalOpen, isPaymentModalOpen]);

  // --- MOCK DATA ---
  const product = {
    id: "PROD-001",
    type: "mentoring", // "bootcamp" | "modul" | "mentoring"
    title: "1-on-1 Mentoring: UI/UX Career Preparation",
    price: 16250,
  };

  const mentors = [
    { id: "M1", name: "Budi Santoso - Senior UI/UX Designer" },
    { id: "M2", name: "Siska Wijaya - Product Design Lead" },
  ];

  const mockBank = {
    name: "Bank Central Asia (BCA)",
    account: "1234567890",
    holder: "PT Mark Up Edukasi",
  };

  // --- KALKULASI HARGA ---
  const discount = appliedVoucher ? 250 : 0; // Logika diskon mock
  const total = product.price - discount;

  // --- HANDLERS ---
  const handleApplyVoucher = () => {
    if (voucherCode.trim() !== "") {
      setAppliedVoucher(voucherCode);
      setIsVoucherModalOpen(false);
    }
  };

  const handleCopyBank = () => {
    navigator.clipboard.writeText(mockBank.account);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleOpenPayment = () => {
    // Validasi basic sebelum buka modal bayar
    if (!buyerInfo.fullName || !buyerInfo.email || !buyerInfo.phone) {
      alert("Harap lengkapi Informasi Pembeli terlebih dahulu!");
      return;
    }
    if (product.type === "mentoring" && !selectedMentor) {
      alert("Harap pilih Mentor terlebih dahulu!");
      return;
    }
    // Jika aman, buka modal pembayaran
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = () => {
    setIsSubmitting(true);
    // Simulasi request API ke backend
    setTimeout(() => {
      setIsSubmitting(false);
      setIsPaymentModalOpen(false);
      // Redirect ke riwayat transaksi setelah sukses
      router.push("/user/transactions");
    }, 1500);
  };

  // --- ANIMATIONS & UTILS ---
  const sectionReveal = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: shouldReduceMotion ? 0.2 : 0.4 },
  };

  const formatIDR = (val) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="min-h-screen bg-[#0F081C] font-inter text-white pb-32">
      {/* HEADER KHUSUS CHECKOUT */}
      <header className="sticky top-0 z-40 w-full h-[72px] bg-[#1A1128] border-b border-[#2D2342] flex items-center justify-between px-6 lg:px-12 shadow-sm">
        <button
          onClick={() => router.back()}
          className={`flex items-center gap-3 text-white hover:text-[#148F89] transition-colors rounded-[8px] px-2 py-1 ${focusRing}`}
        >
          <ArrowLeft size={20} />
          <span className="font-bold text-[18px]">Checkout</span>
        </button>

        <div className="flex flex-row gap-4 items-center border-l border-[#2D2342] pl-6">
          <div className="hidden sm:flex flex-col text-right">
            <p className="font-semibold text-white text-[13px]">
              {buyerInfo.fullName}
            </p>
            <p className="text-[11px] text-[#9CA3AF]">{buyerInfo.email}</p>
          </div>
          <div className="w-[36px] h-[36px] rounded-full overflow-hidden border-2 border-[#148F89]">
            <img
              src="https://api.dicebear.com/7.x/notionists/svg?seed=Prabroro&backgroundColor=2B3034"
              alt="avatar"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </header>

      {/* MAIN CONTENT (pb-24 agar tidak terlalu mepet bawah layar) */}
      <main className="max-w-[1158px] mx-auto mt-8 px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8 pb-24">
        {/* KOLOM KIRI (Detail Produk & Form Pembeli) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Section 1: Produk Card */}
          <motion.div
            {...sectionReveal}
            className="rounded-[12px] overflow-hidden border border-[#2D2342] bg-[#170F26] shadow-lg"
          >
            <div className="h-[220px] bg-gradient-to-br from-[#4C1D95] to-[#0D9488]"></div>
            <div className="px-6 py-4 flex items-center justify-between bg-[#1A1128]">
              <span className="font-bold text-[16px] text-[#E2E8F0]">
                {product.title}
              </span>
              <Link
                href={`/produk/${product.id}`}
                className="text-[#148F89] text-[13px] font-semibold hover:underline"
              >
                Lihat Detail Produk
              </Link>
            </div>
          </motion.div>

          {/* Section 2: Detail Mentoring (Dinamis hanya jika type === 'mentoring') */}
          {product.type === "mentoring" && (
            <motion.div
              {...sectionReveal}
              className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-6 flex flex-col gap-5"
            >
              <h2 className="font-bold text-[18px] text-white">
                Detail Mentoring
              </h2>

              <div className="flex flex-col gap-1.5">
                <label className="text-[#E2E8F0] text-[13px] font-semibold">
                  Pilih Mentor dan Jadwal
                </label>
                <div className="relative">
                  <select
                    value={selectedMentor}
                    onChange={(e) => setSelectedMentor(e.target.value)}
                    className={`w-full bg-[#0F081C] border border-[#2D2342] rounded-[8px] px-4 py-3.5 text-[13px] text-[#E2E8F0] appearance-none outline-none transition-colors focus:border-[#148F89] cursor-pointer ${focusRing}`}
                  >
                    <option value="" disabled>
                      -- Pilih Mentor --
                    </option>
                    {mentors.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[#64748B] text-[11px] mt-0.5">
                  Pilih Mentor yang Sesuai denganmu
                </p>
              </div>

              <div className="flex flex-col gap-1.5 mt-1">
                <button
                  className={`w-full bg-[#148F89] text-white text-[13px] font-bold py-3.5 rounded-[8px] hover:bg-[#10756F] transition-colors shadow-sm ${focusRing}`}
                >
                  Pilih Jadwal
                </button>
                <p className="text-[#64748B] text-[11px] mt-0.5">
                  Pilih jadwal ketersediaan sesi untuk mentoring.
                </p>
              </div>
            </motion.div>
          )}

          {/* Section 3: Informasi Pembeli */}
          <motion.div
            {...sectionReveal}
            className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-6 flex flex-col gap-5"
          >
            <h2 className="font-bold text-[18px] text-white">
              Informasi Pembeli
            </h2>

            <div className="flex flex-col gap-1.5">
              <label className="text-[#E2E8F0] text-[13px] font-semibold">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={buyerInfo.email}
                onChange={(e) =>
                  setBuyerInfo({ ...buyerInfo, email: e.target.value })
                }
                placeholder="Ketik Email Anda"
                className={`w-full bg-[#0F081C] border border-[#2D2342] rounded-[8px] px-4 py-3.5 text-[13px] text-white placeholder:text-[#64748B] outline-none focus:border-[#148F89] transition-colors ${focusRing}`}
              />
              <p className="text-[#64748B] text-[11px] mt-0.5">
                Pastikan email yang Anda masukkan benar, karena kami akan
                mengirimkan informasi kelas ke email ini.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[#E2E8F0] text-[13px] font-semibold">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={buyerInfo.fullName}
                onChange={(e) =>
                  setBuyerInfo({ ...buyerInfo, fullName: e.target.value })
                }
                placeholder="Ketik Nama Lengkap Anda"
                className={`w-full bg-[#0F081C] border border-[#2D2342] rounded-[8px] px-4 py-3.5 text-[13px] text-white placeholder:text-[#64748B] outline-none focus:border-[#148F89] transition-colors ${focusRing}`}
              />
              <p className="text-[#64748B] text-[11px] mt-0.5">
                Gunakan nama yang sesuai dengan KTP atau Kartu Keluarga, karena
                akan diterapkan pada sertifikat.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[#E2E8F0] text-[13px] font-semibold">
                Nomor Handphone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={buyerInfo.phone}
                onChange={(e) =>
                  setBuyerInfo({ ...buyerInfo, phone: e.target.value })
                }
                placeholder="+62 | Ketik Nomor Handphone Anda"
                className={`w-full bg-[#0F081C] border border-[#2D2342] rounded-[8px] px-4 py-3.5 text-[13px] text-white placeholder:text-[#64748B] outline-none focus:border-[#148F89] transition-colors ${focusRing}`}
              />
            </div>
          </motion.div>
        </div>

        {/* KOLOM KANAN (Order Summary Sidebar) */}
        <div className="lg:col-span-1">
          <motion.div
            {...sectionReveal}
            className="sticky top-[104px] bg-[#170F26] border border-[#2D2342] rounded-[12px] p-6 flex flex-col gap-6 shadow-lg"
          >
            <h2 className="font-bold text-[18px] text-white">
              Detail Pembelian
            </h2>

            <div className="flex flex-col gap-4 text-[14px]">
              <div className="flex justify-between items-center text-[#E2E8F0]">
                <span>Judul Produk</span>
                <span className="font-semibold">
                  {formatIDR(product.price)}
                </span>
              </div>
              {appliedVoucher && (
                <div className="flex justify-between items-center text-[#9CA3AF]">
                  <span>Diskon ({appliedVoucher})</span>
                  <span className="font-semibold text-red-500">
                    -{formatIDR(discount)}
                  </span>
                </div>
              )}

              <div className="border-t border-[#2D2342] my-1"></div>

              <div className="flex justify-between items-center text-white">
                <span className="font-bold text-[16px]">Total</span>
                <span className="font-bold text-[18px] text-[#148F89]">
                  {formatIDR(total)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-2">
              <button
                onClick={() => setIsVoucherModalOpen(true)}
                className={`flex items-center justify-center gap-2 w-full bg-transparent border border-[#2D2342] text-[#E2E8F0] text-[13px] font-semibold py-3.5 rounded-[8px] hover:bg-[#2D1B4E] transition-colors ${focusRing}`}
              >
                <Ticket size={16} />
                Gunakan Voucher
              </button>

              <button
                onClick={handleOpenPayment}
                className={`w-full bg-[#148F89] text-white text-[14px] font-bold py-4 rounded-[8px] hover:bg-[#10756F] transition-colors shadow-[0_0_15px_rgba(20,143,137,0.3)] ${focusRing}`}
              >
                Bayar Sekarang - {formatIDR(total)}
              </button>
            </div>
          </motion.div>
        </div>
      </main>

      {/* ============================================================== */}
      {/* MODAL 1: INPUT VOUCHER */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isVoucherModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <div
              className="absolute inset-0"
              onClick={() => setIsVoucherModalOpen(false)}
            ></div>
            <motion.div
              initial={{
                scale: shouldReduceMotion ? 1 : 0.95,
                opacity: 0,
                y: 10,
              }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: shouldReduceMotion ? 1 : 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="relative bg-[#170F26] w-full max-w-[500px] rounded-[16px] border border-[#2D2342] p-6 sm:p-8 flex flex-col gap-4 shadow-2xl z-10"
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-white text-[14px] font-bold">
                  Masukan kode voucher
                </label>
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  placeholder="Ketik Kode Voucher Anda"
                  className={`w-full bg-[#0F081C] border border-[#2D2342] rounded-[8px] px-4 py-3.5 text-[13px] text-white placeholder:text-[#64748B] outline-none focus:border-[#148F89] transition-colors uppercase ${focusRing}`}
                />
              </div>
              <div className="flex justify-end gap-3 mt-2">
                <button
                  onClick={() => setIsVoucherModalOpen(false)}
                  className={`px-6 py-2.5 rounded-[8px] bg-[#2D2342] text-[#E2E8F0] text-[13px] font-semibold hover:bg-[#3D3159] transition-colors ${focusRing}`}
                >
                  Batal
                </button>
                <button
                  onClick={handleApplyVoucher}
                  className={`px-6 py-2.5 rounded-[8px] bg-[#148F89] text-white text-[13px] font-semibold hover:bg-[#10756F] transition-colors shadow-sm ${focusRing}`}
                >
                  Terapkan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* MODAL 2: PEMBAYARAN & UPLOAD BUKTI (Integrated Payment Page) */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <div
              className="absolute inset-0"
              onClick={() => setIsPaymentModalOpen(false)}
            ></div>
            <motion.div
              initial={{
                scale: shouldReduceMotion ? 1 : 0.95,
                opacity: 0,
                y: 15,
              }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: shouldReduceMotion ? 1 : 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
              // Max-h-[90vh] dan custom-scrollbar agar rapi di layar kecil
              className="relative bg-[#170F26] w-full max-w-[600px] max-h-[90vh] overflow-y-auto rounded-[16px] border border-[#2D2342] shadow-2xl z-10 flex flex-col no-scrollbar"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-[#120B1C] px-6 py-5 border-b border-[#2D2342] flex items-center justify-between z-20">
                <h3 className="text-white font-bold text-[18px]">
                  Selesaikan Pembayaran
                </h3>
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="p-1.5 rounded-[8px] text-[#9CA3AF] hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 flex flex-col gap-6">
                {/* Nominal Section */}
                <div className="flex flex-col items-center gap-1 border-b border-[#2D2342] pb-6">
                  <span className="text-[#9CA3AF] text-[13px] font-medium uppercase tracking-widest">
                    Total Tagihan
                  </span>
                  <span className="text-[#148F89] font-bold text-[36px]">
                    {formatIDR(total)}
                  </span>
                </div>

                {/* Bank Info */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Landmark size={18} className="text-[#E2E8F0]" />
                    <span className="font-bold text-[15px] text-white">
                      Transfer Bank
                    </span>
                  </div>

                  <div className="bg-[#0F081C] border border-[#2D2342] rounded-[8px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[#9CA3AF] text-[12px] font-semibold">
                        {mockBank.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-[20px] tracking-widest font-mono">
                          {mockBank.account}
                        </span>
                      </div>
                      <span className="text-[#E2E8F0] text-[13px] mt-0.5">
                        a.n <span className="font-bold">{mockBank.holder}</span>
                      </span>
                    </div>

                    <button
                      onClick={handleCopyBank}
                      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-[6px] border ${
                        isCopied
                          ? "border-[#10B981] text-[#10B981] bg-[#10B981]/10"
                          : "border-[#2D2342] text-[#9CA3AF] hover:text-white hover:bg-[#2D1B4E]"
                      } transition-colors text-[12px] font-bold shrink-0 ${focusRing}`}
                    >
                      {isCopied ? (
                        <>
                          <CheckCircle2 size={16} /> Disalin
                        </>
                      ) : (
                        <>
                          <Copy size={16} /> Salin No. Rekening
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-[#F59E0B]/10 border border-[#F59E0B]/30 p-4 rounded-[8px]">
                  <AlertCircle
                    size={18}
                    className="text-[#F59E0B] shrink-0 mt-0.5"
                  />
                  <p className="text-[#FBBF24] text-[12px] leading-relaxed">
                    Pastikan nominal transfer sesuai hingga{" "}
                    <span className="font-bold">3 digit terakhir</span>.
                    Kesalahan nominal dapat menghambat proses verifikasi.
                  </p>
                </div>

                {/* File Upload Section */}
                <div className="flex flex-col gap-3">
                  <div>
                    <h2 className="font-bold text-[15px] text-white">
                      Unggah Bukti Transfer
                    </h2>
                    <p className="text-[#9CA3AF] text-[12px] mt-0.5">
                      Format JPG, PNG, atau PDF (maks. 5MB)
                    </p>
                  </div>

                  {proofFile ? (
                    <div className="flex items-center justify-between gap-3 bg-[#0F081C] border border-[#148F89]/50 rounded-[8px] px-4 py-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <ImageIcon
                          size={20}
                          className="text-[#148F89] shrink-0"
                        />
                        <div className="flex flex-col">
                          <span className="text-white text-[13px] font-medium truncate max-w-[200px] sm:max-w-[300px]">
                            {proofFile.name}
                          </span>
                          <span className="text-[#10B981] text-[11px] font-semibold mt-0.5">
                            Berhasil diunggah
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setProofFile(null)}
                        className="p-2 text-[#9CA3AF] hover:bg-red-500/10 hover:text-red-400 rounded-full transition-colors shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        setProofFile({ name: "Bukti_Transfer_MarkUp.jpg" })
                      } // Mock simulasi klik unggah file
                      className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[#2D2342] rounded-[12px] py-10 text-[#9CA3AF] hover:border-[#148F89]/50 hover:bg-[#148F89]/5 transition-all ${focusRing}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-[#1A1128] flex items-center justify-center">
                        <Upload size={18} className="text-[#148F89]" />
                      </div>
                      <span className="text-[13px] font-semibold text-[#E2E8F0]">
                        Klik untuk memilih file bukti transfer
                      </span>
                    </button>
                  )}
                </div>

                {/* Final Submit Button */}
                <button
                  onClick={handleConfirmPayment}
                  disabled={!proofFile || isSubmitting}
                  className={`w-full py-3.5 rounded-[8px] font-bold text-[14px] transition-all flex justify-center items-center gap-2 mt-2 ${
                    !proofFile
                      ? "bg-[#2D2342] text-[#64748B] cursor-not-allowed"
                      : isSubmitting
                        ? "bg-[#148F89]/70 text-white cursor-wait"
                        : "bg-[#148F89] text-white hover:bg-[#10756F] shadow-[0_0_15px_rgba(20,143,137,0.3)]"
                  } ${focusRing}`}
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Memverifikasi...
                    </>
                  ) : (
                    "Konfirmasi Pembayaran"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
