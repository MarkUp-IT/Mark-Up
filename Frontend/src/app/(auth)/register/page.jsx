"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import Toast from "@/component/Toast";
import { api, ApiError } from "@/lib/api";

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

function Field({ label, type = "text", value, onChange, error, rightIcon }) {
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
      {error && <p className="text-red-400 text-[12px]">{error}</p>}
    </div>
  );
}

export default function Register() {
  const router = useRouter();

  // Catatan: field "Username" dihapus -- skema tabel `users` cuma punya
  // kolom `email` sebagai identitas unik buat login, nggak ada kolom
  // `username` sama sekali. Field di bawah ini disamakan sama kolom yang
  // beneran ada: fullname (user_profiles), email & password_hash (users).
  const [namaLengkap, setNamaLengkap] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isChecked, setIsChecked] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const isValid =
    namaLengkap.trim() !== "" &&
    email.trim() !== "" &&
    password.trim() !== "" &&
    confirm.trim() !== "" &&
    isChecked;

  const showToast = (type, title, message) => {
    setToast({ open: true, type, title, message });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setFieldErrors({});
    setFormError("");
    setIsSubmitting(true);

    try {
      const payload = {
        fullname: namaLengkap,
        email,
        password,
        confirm_password: confirm,
      };

      await api.post("/api/accounts/register/", payload, { auth: false });

      showToast(
        "success",
        "Akun berhasil dibuat",
        "Mengalihkan ke halaman login...",
      );

      window.setTimeout(() => {
        router.push("/login");
      }, 1600);
    } catch (err) {
      if (err instanceof ApiError && err.status === 400 && err.data?.errors) {
        const errors = err.data.errors;
        const mapped = {};
        Object.entries(errors).forEach(([key, val]) => {
          mapped[key] = Array.isArray(val) ? val.join(" ") : String(val);
        });
        setFieldErrors(mapped);
        if (mapped.non_field_errors) {
          setFormError(mapped.non_field_errors);
        }
        showToast(
          "error",
          "Registrasi gagal",
          mapped.non_field_errors || "Cek kembali data yang kamu masukkan.",
        );
      } else if (err instanceof ApiError) {
        setFormError(err.message);
        showToast("error", "Registrasi gagal", err.message);
      } else {
        setFormError("Terjadi kesalahan. Coba lagi.");
        showToast("error", "Registrasi gagal", "Terjadi kesalahan. Coba lagi.");
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

      <div
        className="relative z-10 w-full min-h-screen flex items-center justify-center px-6 py-16"
        style={{ gap: "60px", flexWrap: "wrap" }}
      >
        <form
          onSubmit={handleSubmit}
          style={{ width: "100%", maxWidth: "380px", flexShrink: 0 }}
          className="flex flex-col gap-3.5"
        >
          <div className="flex flex-col gap-1.5">
            <img
              src="/images/logo-markup.svg"
              alt="Mark-Up"
              className="w-[150px]"
            />
            <p className="font-bold text-[#B19EEF] text-[28px] font-poppins mt-2">
              Registrasi
            </p>
            <p className="text-[13px] text-[#9CA3AF]">
              Buat akun untuk menggunakan platform MARK-UP
            </p>
          </div>

          {formError && <p className="text-red-400 text-[13px]">{formError}</p>}

          <Field
            label="Nama Lengkap"
            value={namaLengkap}
            onChange={(e) => setNamaLengkap(e.target.value)}
            error={fieldErrors.fullname}
          />

          <Field
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
          />

          <Field
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
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

          <Field
            label="Konfirmasi Password"
            type={showConfirm ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={fieldErrors.confirm_password}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B19EEF]"
                tabIndex={-1}
              >
                {showConfirm ? (
                  <EyeOff className="w-[18px] h-[18px]" />
                ) : (
                  <Eye className="w-[18px] h-[18px]" />
                )}
              </button>
            }
          />

          <label className="flex flex-row gap-2.5 items-start cursor-pointer">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="w-[15px] h-[15px] mt-0.5 shrink-0 appearance-none border border-white bg-transparent checked:bg-transparent checked:border-white relative checked:after:content-['✔'] checked:after:text-white checked:after:absolute checked:after:text-[10px] checked:after:left-[3px] checked:after:top-[-2px]"
            />
            <p className="text-[12px] text-[#9CA3AF] leading-relaxed">
              Saya menyetujui{" "}
              <Link
                href="/terms-and-conditions"
                target="_blank"
                className="text-[#08C7E1] hover:underline"
              >
                Syarat &amp; Ketentuan
              </Link>{" "}
              serta{" "}
              <Link
                href="/privacy-policy"
                target="_blank"
                className="text-[#08C7E1] hover:underline"
              >
                Kebijakan Privasi
              </Link>
            </p>
          </label>

          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="bg-[#B19EEF] flex items-center justify-center w-full h-[48px] rounded-[12px] text-black font-bold text-[14px] disabled:bg-[#635983] disabled:cursor-not-allowed transition-colors mt-1"
          >
            {isSubmitting ? "Memproses..." : "Buat akun"}
          </button>

          <p className="text-[13px] text-center text-[#9CA3AF]">
            Sudah memiliki akun?{" "}
            <Link href="/login" className="text-[#08C7E1] hover:underline">
              Login
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
