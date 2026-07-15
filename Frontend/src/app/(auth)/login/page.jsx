"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import Toast from "@/component/Toast";
import { api, ApiError, setTokens } from "@/lib/api";

// Paksa background input autofill browser tetap gelap -- browser (Chrome dkk)
// otomatis kasih background terang ke field yang di-autofill/diinget, dan itu
// nggak bisa dioverride cuma pakai bg-[] class biasa. Ini yang bikin label
// "nabrak" sama teks kemarin: warna background field berubah jadi terang tanpa
// sepengetahuan kita, sementara warna masking label tetap gelap.
const autofillFix = `
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0px 1000px #2B2B2B inset;
    -webkit-text-fill-color: #ffffff;
    transition: background-color 5000s ease-in-out 0s;
  }
  .auth-illustration { display: none; }
  @media (min-width: 1024px) {
    .auth-illustration { display: block; }
  }
`;

function Field({ label, type = "text", value, onChange, rightIcon }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] text-[#B19EEF] font-medium">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={onChange}
          className={`w-full h-[48px] bg-[#2B2B2B] rounded-[12px] px-4 ${
            rightIcon ? "pr-12" : ""
          } text-[14px] text-white outline-none focus:ring-2 focus:ring-[#B19EEF]/50 transition-shadow`}
        />
        {rightIcon}
      </div>
    </div>
  );
}

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const isValid = email.trim() !== "" && password.trim() !== "";

  const showToast = (type, title, message) => {
    setToast({ open: true, type, title, message });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setFormError("");
    setIsSubmitting(true);

    try {
      const data = await api.post(
        "/api/accounts/login/",
        { email, password },
        { auth: false },
      );

      setTokens({
        access: data.access,
        refresh: data.refresh,
      });

      showToast(
        "success",
        "Login berhasil",
        "Kamu akan diarahkan ke dashboard.",
      );

      const role = data.user?.role;

      window.setTimeout(() => {
        switch (role) {
          case "ADMIN":
            router.push("/admin");
            break;

          case "MENTOR":
            router.push("/mentor/active-classes");
            break;

          case "STUDENT":
          default:
            router.push("/user/my-products");
            break;
        }
      }, 1600);
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
        showToast("error", "Login gagal", err.message);
      } else {
        setFormError("Terjadi kesalahan. Coba lagi.");
        showToast("error", "Login gagal", "Terjadi kesalahan. Coba lagi.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#0F081C] font-inter text-white relative">
      <style>{autofillFix}</style>

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

      {/* Form + gambar dikelompokkan jadi satu klaster di tengah dengan gap
          wajar -- BUKAN split 50/50 (itu yang bikin gambar keliatan
          terdampar jauh di kanan kemarin). */}
      <div
        className="relative z-10 w-full min-h-screen flex items-center justify-center px-6 py-16"
        style={{ gap: "60px", flexWrap: "wrap" }}
      >
        <form
          onSubmit={handleSubmit}
          style={{ width: "100%", maxWidth: "380px", flexShrink: 0 }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <img
              src="/images/logo-markup.svg"
              alt="Mark-Up"
              className="w-[150px]"
            />
            <p className="font-bold text-[#B19EEF] text-[28px] font-poppins mt-2">
              Login
            </p>
            <p className="text-[13px] text-[#9CA3AF]">
              Selamat datang di platform MARK-UP
            </p>
          </div>

          {formError && <p className="text-red-400 text-[13px]">{formError}</p>}

          <Field
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Field
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B19EEF]"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-[18px] h-[18px]" />
                ) : (
                  <Eye className="w-[18px] h-[18px]" />
                )}
              </button>
            }
          />

          <Link
            href="/forgot-password"
            className="text-[#08C7E1] text-[13px] hover:underline -mt-1 w-fit"
          >
            Lupa password?
          </Link>

          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="bg-[#B19EEF] flex items-center justify-center w-full h-[48px] rounded-[12px] text-black font-bold text-[14px] disabled:bg-[#635983] disabled:cursor-not-allowed transition-colors mt-1"
          >
            {isSubmitting ? "Memproses..." : "Masuk"}
          </button>

          <p className="text-[13px] text-center text-[#9CA3AF]">
            Belum memiliki akun?{" "}
            <Link href="/register" className="text-[#08C7E1] hover:underline">
              Daftarkan Akun
            </Link>
          </p>
        </form>

        <div
          className="auth-illustration"
          style={{ width: "380px", height: "460px", flexShrink: 0 }}
        >
          <img
            src="/images/placeholder_auth.png"
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>
      </div>

      <Toast
        open={toast.open}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        position="top-right"
      />
    </div>
  );
  }

