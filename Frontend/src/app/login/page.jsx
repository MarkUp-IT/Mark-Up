"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import Toast from "@/component/Toast";
import { api, ApiError, setTokens } from "@/lib/api";

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
        { auth: false }
      );

      setTokens({ access: data.access, refresh: data.refresh });

      showToast(
        "success",
        "Login berhasil",
        "Anda akan diarahkan ke dashboard user."
      );

      window.setTimeout(() => {
        router.push("/user/my-products");
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
        <div className="w-1/2 flex justify-center items-center">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-[18px] mt-5 mb-5"
          >
            <div className="flex flex-col gap-[2px]">
              <img src="/images/logo-markup.svg" className="w-[200px]" />
              <p className="font-bold text-[#B19EEF] text-[60px] font-poppins">
                Login
              </p>
              <p className="text-[18px] font-regular w-[450px]">
                Selamat datang di platform MARK-UP
              </p>
            </div>

            {formError && (
              <p className="text-red-400 text-[13px] -mb-2">{formError}</p>
            )}

            {/* Email */}
            <div className="relative">
              {email !== "" && (
                <label className="absolute -top-3 left-5 text-[12px] text-[#B19EEF] bg-transparent px-2 z-10">
                  Email
                </label>
              )}
              <input
                type="text"
                id="email"
                name="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-[452px] h-[50px] bg-[#2B2B2B] rounded-[16px] pl-10 text-[14px] font-poppins focus:outline-none"
              />
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
                name="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-[452px] h-[50px] bg-[#2B2B2B] rounded-[16px] pl-10 pr-12 text-[14px] font-poppins focus:outline-none"
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
            </div>

            <div className="flex flex-row gap-3 items-center"></div>

            <div>
              <button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="bg-[#B19EEF] flex items-center justify-center w-[452px] h-[52px] rounded-[14px] text-[#000000] font-bold disabled:bg-[#635983] disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Memproses..." : "Masuk"}
              </button>
            </div>

            <p className="text-[13px] text-center -mt-1">
              Belum Memiliki Akun?{" "}
              <span
                onClick={() => router.push("/register")}
                className="text-[#08C7E1] cursor-pointer hover:underline"
              >
                Daftarkan Akun
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