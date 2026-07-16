"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Landmark,
  Copy,
  CheckCircle2,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Trash2,
  Timer,
} from "lucide-react";
import Navbar from "@/component/Navbar";
import { getAccessToken, API_BASE } from "@/lib/api";
import { useCheckoutFormStore } from "@/store/formstore";
import Toast from "@/component/Toast";

const NAVBAR_CLEARANCE = 150;
const CONTENT_WIDTH = 640;
const RESERVATION_SECONDS = 5 * 60;

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#148F89] focus-visible:ring-offset-2 focus-visible:ring-offset-[#060010]";

const formatIDR = (val) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);

const formatCountdown = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const getInitials = (name) =>
  name
    .replace(/^Kak\s+/i, "")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const mockBank = {
  name: "Bank Central Asia (BCA)",
  account: "1234567890",
  holder: "PT Mark Up Edukasi",
};

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

export default function CheckoutPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const checkoutSummary = useCheckoutFormStore((s) => s.checkoutSummary);
  const buyerInfo = useCheckoutFormStore((s) => s.buyerInfo);
  const voucherCode = useCheckoutFormStore((s) => s.voucherCode);
  const selectedMentor = useCheckoutFormStore((s) => s.selectedMentor);
  const selectedSlot = useCheckoutFormStore((s) => s.selectedSlot);
  const proofFile = useCheckoutFormStore((s) => s.proofFile);
  const setProofFile = useCheckoutFormStore((s) => s.setProofFile);
  const reset = useCheckoutFormStore((s) => s.reset);

  const isMentoring = Boolean(selectedMentor && selectedSlot);
  const total = checkoutSummary.total;

  const [isCopied, setIsCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(RESERVATION_SECONDS);
  const [isExpired, setIsExpired] = useState(false);

  const [toast, setToast] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const [isLeavingAfterSuccess, setIsLeavingAfterSuccess] = useState(false);

  useEffect(() => {
    if (!checkoutSummary.productId && !isLeavingAfterSuccess) {
      router.replace(`/checkout/${params.productId}`);
    }
  }, [checkoutSummary.productId, isLeavingAfterSuccess, params.productId, router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          setIsExpired(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyBank = () => {
    navigator.clipboard.writeText(mockBank.account);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleConfirmPayment = async () => {
      if (!proofFile || isExpired) return;

      setIsSubmitting(true);
      setSubmitError("");

      try {
        const formData = new FormData();
        formData.append("product_id", checkoutSummary.productId);
        formData.append("buyer_phone", buyerInfo.phone);

        if (voucherCode) {
          formData.append("voucher_code", voucherCode);
        }

        if (selectedSlot?.id) {
          formData.append("availability_slot_id", selectedSlot.id);
        }

        formData.append("proof_of_payment", proofFile);

        const token = getAccessToken();
        const res = await fetch(`${API_BASE}/api/transactions/checkout/`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          // JANGAN set Content-Type manual di sini -- browser yang harus
          // generate boundary multipart-nya sendiri.
          body: formData,
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.detail || "Gagal mengonfirmasi pembayaran.");
        }

        setToast({
          open: true,
          type: "success",
          title: "Pembayaran Berhasil",
          message: "Pembayaran berhasil dikonfirmasi. Mengalihkan ke halaman transaksi...",
        });

        setIsLeavingAfterSuccess(true);

        setTimeout(() => {
          reset();
          router.push("/user/transactions");
        }, 1500);
      } catch (err) {
        setSubmitError(err.message || "Gagal mengonfirmasi pembayaran.");

        setToast({
          open: true,
          type: "error",
          title: "Checkout Gagal",
          message: err.message || "Gagal mengonfirmasi pembayaran.",
        });
      }finally {
        setIsSubmitting(false);
      }
    };
  const fadeIn = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: shouldReduceMotion ? 0.15 : 0.3 },
  };

  if (!checkoutSummary.productId) {
    return null; // lagi redirect, lihat useEffect guard di atas
  }

  return (
    <div style={{ backgroundColor: "#060010", minHeight: "100vh" }}>
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
            <div className="flex items-center justify-between">
              <Link
                href={`/checkout/${params.productId}`}
                className={`inline-flex items-center gap-1.5 text-[#A19DAB] hover:text-white text-[13px] transition-colors rounded-[6px] ${focusRing}`}
              >
                <ArrowLeft size={15} />
                Kembali
              </Link>
              <StepPill current={2} />
            </div>

            <motion.div {...fadeIn} className="flex flex-col gap-1">
              <h1 className="text-[28px] font-bold font-poppins leading-tight">
                Transfer & Unggah Bukti
              </h1>
              <p className="text-[#A19DAB] text-[13px]">
                Transfer sesuai nominal, unggah bukti sebelum waktu habis.
              </p>
            </motion.div>

            {isExpired ? (
              <motion.div
                {...fadeIn}
                className="bg-[#170F26] border border-red-500/30 rounded-[12px] p-8 flex flex-col items-center text-center gap-4"
              >
                <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                  <Timer size={26} className="text-red-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-[16px]">
                    Waktu Reservasi Habis
                  </h3>
                  <p className="text-[#9CA3AF] text-[12px] mt-2 leading-relaxed">
                    {isMentoring
                      ? "5 menit reservasi jadwal mentor sudah lewat dan slotnya dilepas kembali. Silakan checkout ulang."
                      : "5 menit waktu pembayaran sudah lewat. Silakan checkout ulang."}
                  </p>
                </div>
                <Link
                  href={`/checkout/${params.productId}`}
                  className="w-full py-3 rounded-[8px] bg-[#148F89] text-white font-semibold text-[13px] hover:bg-[#117A75] transition-colors text-center"
                >
                  Checkout Ulang
                </Link>
              </motion.div>
            ) : (
              <>
                <motion.div
                  {...fadeIn}
                  className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-5 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-white font-semibold text-[14px]">
                      {checkoutSummary.productTitle}
                    </span>
                    <span className="text-[#148F89] font-bold text-[16px] whitespace-nowrap">
                      {formatIDR(total)}
                    </span>
                  </div>
                  {isMentoring && selectedMentor && (
                    <div className="flex items-center gap-2.5 border-t border-[#2D2342] pt-3">
                      <div
                        className={`w-8 h-8 rounded-full bg-gradient-to-br ${selectedMentor.avatarGradient} flex items-center justify-center text-white text-[11px] font-bold shrink-0`}
                      >
                        {getInitials(selectedMentor.name)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-white text-[12px] font-medium truncate">
                          {selectedMentor.name}
                        </span>
                        {selectedSlot && (
                          <span className="text-[#9CA3AF] text-[11px] truncate">
                            {selectedSlot.date}, {selectedSlot.time}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {voucherCode && (
                    <div className="flex justify-between text-[#9CA3AF] text-[12px] border-t border-[#2D2342] pt-3">
                      <span>Voucher</span>
                      <span className="font-semibold text-[#148F89]">
                        {voucherCode}
                      </span>
                    </div>
                  )}
                </motion.div>

                <motion.div
                  {...fadeIn}
                  className={`flex items-center justify-center gap-2.5 rounded-[8px] px-4 py-3 border ${
                    secondsLeft <= 60
                      ? "bg-red-500/10 border-red-500/30 text-red-400"
                      : "bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#FBBF24]"
                  }`}
                >
                  <Timer size={15} className="shrink-0" />
                  <p className="text-[12px] font-medium">
                    {isMentoring ? "Jadwal direservasi selama" : "Selesaikan dalam"}{" "}
                    <span className="font-mono font-bold text-[14px]">
                      {formatCountdown(secondsLeft)}
                    </span>
                  </p>
                </motion.div>

                <motion.div
                  {...fadeIn}
                  className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-5 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-2">
                    <Landmark size={16} className="text-[#E2E8F0]" />
                    <span className="font-bold text-[14px] text-white">
                      Transfer Bank
                    </span>
                  </div>

                  <div className="bg-[#0F081C] border border-[#2D2342] rounded-[8px] p-4 flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[#9CA3AF] text-[11px] font-semibold">
                        {mockBank.name}
                      </span>
                      <span className="text-white font-bold text-[19px] tracking-widest font-mono">
                        {mockBank.account}
                      </span>
                      <span className="text-[#E2E8F0] text-[12px] mt-0.5">
                        a.n <span className="font-bold">{mockBank.holder}</span>
                      </span>
                    </div>
                    <button
                      onClick={handleCopyBank}
                      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-[6px] border transition-colors text-[11px] font-bold w-fit ${focusRing} ${
                        isCopied
                          ? "border-[#10B981] text-[#10B981] bg-[#10B981]/10"
                          : "border-[#2D2342] text-[#9CA3AF] hover:text-white hover:bg-[#2D1B4E]"
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <CheckCircle2 size={14} /> Disalin
                        </>
                      ) : (
                        <>
                          <Copy size={14} /> Salin No. Rekening
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-start gap-2 bg-[#F59E0B]/10 border border-[#F59E0B]/30 p-3 rounded-[8px]">
                    <AlertCircle size={15} className="text-[#F59E0B] shrink-0 mt-0.5" />
                    <p className="text-[#FBBF24] text-[11px] leading-relaxed">
                      Transfer sesuai nominal persis sampai{" "}
                      <span className="font-bold">3 digit terakhir</span>.
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  {...fadeIn}
                  className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-5 flex flex-col gap-3"
                >
                  <div>
                    <h2 className="font-bold text-[14px] text-white">
                      Unggah Bukti Transfer
                    </h2>
                    <p className="text-[#9CA3AF] text-[11px] mt-0.5">
                      Format JPG, PNG, atau PDF (maks. 5MB)
                    </p>
                  </div>

                  {proofFile ? (
                    <div className="flex items-center justify-between gap-3 bg-[#0F081C] border border-[#148F89]/50 rounded-[8px] px-4 py-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <ImageIcon size={18} className="text-[#148F89] shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-white text-[12px] font-medium truncate">
                            {proofFile.name}
                          </span>
                          <span className="text-[#10B981] text-[10px] font-semibold mt-0.5">
                            Berhasil diunggah
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setProofFile(null)}
                        className="p-1.5 text-[#9CA3AF] hover:bg-red-500/10 hover:text-red-400 rounded-full transition-colors shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : (
                    <label
                      className={`flex flex-col items-center justify-center gap-2.5 border-2 border-dashed border-[#2D2342] rounded-[10px] py-8 text-[#9CA3AF] hover:border-[#148F89]/50 hover:bg-[#148F89]/5 transition-all cursor-pointer ${focusRing}`}
                    >
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setProofFile(file); // simpan File object aslinya di store
                        }}
                      />
                      <div className="w-9 h-9 rounded-full bg-[#1A1128] flex items-center justify-center">
                        <Upload size={16} className="text-[#148F89]" />
                      </div>
                      <span className="text-[12px] font-semibold text-[#E2E8F0]">
                        Klik untuk memilih file
                      </span>
                    </label>
                  )}

                  {submitError && (
                    <p className="flex items-start gap-2 text-red-400 text-[11px] bg-red-500/10 border border-red-500/30 rounded-[8px] px-3 py-2.5">
                      <AlertCircle size={13} className="shrink-0 mt-0.5" />
                      {submitError}
                    </p>
                  )}

                  <button
                    onClick={handleConfirmPayment}
                    disabled={!proofFile || isSubmitting}
                    className={`w-full py-3.5 rounded-[8px] font-bold text-[13px] transition-all ${focusRing} ${
                      !proofFile
                        ? "bg-[#2D2342] text-[#64748B] cursor-not-allowed"
                        : isSubmitting
                          ? "bg-[#148F89]/70 text-white cursor-wait"
                          : "bg-[#148F89] text-white hover:bg-[#117A75]"
                    }`}
                  >
                    {isSubmitting ? "Mengirim..." : "Konfirmasi Pembayaran"}
                  </button>
                  <p className="text-[#6B7280] text-[10px] text-center">
                    Status jadi &ldquo;Menunggu Verifikasi&rdquo; sampai admin
                    mengecek, biasanya 1x24 jam.
                  </p>
                </motion.div>
              </>
            )}
          </div>
        </main>
      </div>
      <Toast
        open={toast.open}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={() =>
          setToast((prev) => ({
            ...prev,
            open: false,
          }))
        }
      />
    </div>
  );
}