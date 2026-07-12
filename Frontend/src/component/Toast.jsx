"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, CircleAlert, Sparkles, X } from "lucide-react";

export default function Toast({
  open = false,
  type = "success",
  title = "Berhasil",
  message = "Tindakan selesai dengan baik.",
  onClose,
  duration = 4000,
  position = "bottom-right",
}) {
  useEffect(() => {
    if (!open || !onClose || !duration) return;

    const timer = window.setTimeout(() => {
      onClose();
    }, duration);

    return () => window.clearTimeout(timer);
  }, [open, duration, onClose]);

  if (!open) return null;

  const config =
    type === "error"
      ? {
          icon: CircleAlert,
          iconBg: "bg-rose-100",
          iconColor: "text-rose-600",
          accent: "from-rose-500 via-red-500 to-orange-400",
          titleColor: "text-rose-700",
          ring: "ring-rose-100",
        }
      : {
          icon: CheckCircle2,
          iconBg: "bg-emerald-100",
          iconColor: "text-emerald-600",
          accent: "from-emerald-500 via-green-500 to-lime-400",
          titleColor: "text-emerald-700",
          ring: "ring-emerald-100",
        };

  const positionClasses = {
    "top-right": "items-start justify-end",
    "top-left": "items-start justify-start",
    "bottom-right": "items-end justify-end",
    "bottom-left": "items-end justify-start",
    center: "items-center justify-center",
  };

  const Icon = config.icon;

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-[999] flex p-4 sm:p-6 ${positionClasses[position] || positionClasses["bottom-right"]}`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className={`pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.35)] backdrop-blur-xl ring-4 ${config.ring}`}
        >
          <div className={`h-1.5 w-full bg-gradient-to-r ${config.accent}`} />

          <div className="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${config.iconBg}`}>
                <Icon className={`h-5 w-5 ${config.iconColor}`} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm font-semibold ${config.titleColor}`}>{title}</h3>
                      <Sparkles className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <p className="mt-1 text-sm leading-5 text-slate-600">{message}</p>
                  </div>

                  {onClose ? (
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                      aria-label="Tutup toast"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
