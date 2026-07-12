"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import Toast from "@/component/Toast";
import { api, ApiError } from "@/lib/api";

export default function Register() {
  const router = useRouter();

  const [namaLengkap, setNamaLengkap] = useState("");
  const [username, setUsername] = useState("");
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
    username.trim() !== "" &&
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
        username,
        email,
        password,
        confirm_password: confirm,
      };

      await api.post("/api/accounts/register/", payload, { auth: false });

      showToast(
        "success",
        "Akun berhasil dibuat",
        "Akun Anda berhasil dibuat. Mengalihkan ke halaman login..."
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
          mapped.non_field_errors || "Cek kembali data yang Anda masukkan."
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

      <button
        onClick={() => router.push("/")}
        className="absolute top-6 left-6 z-20 flex items-center justify-center w-[40px] h-[40px] rounded-full bg-[#2B2B2B] hover:bg-[#3a3a3a] transition-colors"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
      </button>

      <div className="w-full min-h-screen flex flex-row ">
        <div className="w-1/2 flex justify-center">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-[18px] mt-5 mb-3"
          >
            <div className="flex flex-col gap-[2px] mt-5">
              <img src="/images/logo-markup.svg" className="w-[200px]" />
              <p className="font-bold text-[#B19EEF] text-[60px] font-poppins">
                Registrasi
              </p>
              <p className="text-[18px] font-regular w-[450px]">
                Buat akun untuk menggunakan platform MARK-UP
              </p>
            </div>

            {formError && (
              <p className="text-red-400 text-[13px] -mb-2">{formError}</p>
            )}

            {/* Nama Lengkap */}
            <div className="relative">
              {namaLengkap !== "" && (
                <label className="absolute -top-3 left-5 text-[12px] text-[#B19EEF] bg-transparent px-2 z-10">
                  Nama Lengkap
                </label>
              )}
              <input
                type="text"
                id="namaLengkap"
                placeholder="Nama Lengkap"
                required
                value={namaLengkap}
                onChange={(e) => setNamaLengkap(e.target.value)}
                className="w-[452px] h-[50px] bg-[#2B2B2B] rounded-[14px] pl-10 text-[14px] font-poppins focus:outline-none"
              />
              {fieldErrors.fullname && (
                <p className="text-red-400 text-[12px] mt-1 pl-2">
                  {fieldErrors.fullname}
                </p>
              )}
            </div>

            {/* Username */}
            <div className="relative">
              {username !== "" && (
                <label className="absolute -top-3 left-5 text-[12px] text-[#B19EEF] bg-transparent px-2 z-10">
                  Username
                </label>
              )}
              <input
                type="text"
                id="username"
                name="user_name"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-[452px] h-[50px] bg-[#2B2B2B] rounded-[14px] pl-10 text-[14px] font-poppins focus:outline-none"
              />
              {fieldErrors.username && (
                <p className="text-red-400 text-[12px] mt-1 pl-2">
                  {fieldErrors.username}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="relative">
              {email !== "" && (
                <label className="absolute -top-3 left-5 text-[12px] text-[#B19EEF] bg-transparent px-2 z-10">
                  Email
                </label>
              )}
              <input
                type="email"
                id="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-[452px] h-[50px] bg-[#2B2B2B] rounded-[14px] pl-10 text-[14px] font-poppins focus:outline-none"
              />
              {fieldErrors.email && (
                <p className="text-red-400 text-[12px] mt-1 pl-2">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="relative">
              {password !== "" && (
                <label className="absolute -top-3 left-5 text-[12px] text-[#B19EEF] bg-transparent px-2 z-10">
                  Password
                </label>
              )}
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-[452px] h-[50px] bg-[#2B2B2B] rounded-[14px] pl-10 pr-12 text-[14px] font-poppins focus:outline-none"
              />
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
              {fieldErrors.password && (
                <p className="text-red-400 text-[12px] mt-1 pl-2">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Konfirmasi Password */}
            <div className="relative">
              {confirm !== "" && (
                <label className="absolute -top-3 left-5 text-[12px] text-[#B19EEF] bg-transparent px-2 z-10">
                  Konfirmasi Password
                </label>
              )}
              <input
                type={showConfirm ? "text" : "password"}
                id="confirm"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Konfirmasi Password"
                required
                className="w-[452px] h-[50px] bg-[#2B2B2B] rounded-[16px] pl-10 pr-12 text-[14px] font-poppins focus:outline-none"
              />
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
              {fieldErrors.confirm_password && (
                <p className="text-red-400 text-[12px] mt-1 pl-2">
                  {fieldErrors.confirm_password}
                </p>
              )}
            </div>

            <div className="flex flex-row gap-3 items-center">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                className="w-[15px] h-[15px] appearance-none border border-white bg-transparent checked:bg-transparent checked:border-white relative checked:after:content-['✔'] checked:after:text-white checked:after:absolute checked:after:text-[10px] checked:after:left-[3px] checked:after:top-[-2px]"
              />
              <p className="text-[12px]">
                Saya sudah memahamai penjelasan terkait{" "}
                <span className="text-[#08C7E1]">kebijakan privasi</span>
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="bg-[#B19EEF] flex items-center justify-center w-[452px] h-[52px] rounded-[14px] text-[#000000] font-bold disabled:bg-[#635983] disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Memproses..." : "Buat akun"}
              </button>
            </div>

            <p className="text-[13px] text-center -mt-1">
              Sudah memiliki akun?{" "}
              <span
                onClick={() => router.push("/login")}
                className="text-[#08C7E1] cursor-pointer hover:underline"
              >
                Login
              </span>
            </p>
          </form>
        </div>
        <div className="w-1/2 flex justify-center items-center">
          <img
            src="/images/placeholder_auth.png"
            className=" w-[635px] h-[661px]"
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