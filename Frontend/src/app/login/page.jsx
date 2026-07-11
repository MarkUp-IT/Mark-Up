"use client";

import { useState } from "react";

export default function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isValid = email.trim() !== "" && password.trim() !== "";
 

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

      <div className="w-full min-h-screen flex flex-row ">
        <div className="w-1/2 flex justify-center items-center">
          <div className="flex flex-col gap-[18px] mt-5 mb-5">
            <div className="flex flex-col gap-[2px]">
              <img src="/images/logo-markup.svg" className="w-[200px]" />
              <p className="font-bold text-[#B19EEF] text-[60px] font-poppins">
                Login
              </p>
              <p className="text-[22px] font-regular w-[450px]">
                Selamat datang di platform MARK-UP
              </p>
            </div>

            <div className="relative">
              {email !== "" && (
                <label
                  className="
                          absolute
                          -top-3
                          left-5
                          text-[16px]
                          text-[#B19EEF]
                          bg-transparent
                          px-2
                          z-10
                        "
                >
                  Email
                </label>
              )}

              <input
                type="text"
                id="username"
                name="user_name"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-[452px] h-[52px] bg-[#2B2B2B] rounded-[16px] pl-10 text-[19px] font-poppins focus:outline-none"
              />
            </div>
            <div className="relative">
              {password !== "" && (
                <label
                  className="
                          absolute
                          -top-3
                          left-5
                          text-[16px]
                          text-[#B19EEF]
                          bg-transparent
                          px-2
                          z-10
                        "
                >
                  Password
                </label>
              )}

              <input
                type="text"
                id="username"
                name="user_name"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-[452px] h-[52px] bg-[#2B2B2B] rounded-[16px] pl-10 text-[19px] font-poppins focus:outline-none"
              />
            </div>
            <div className="flex flex-row gap-3 items-center"></div>
            <div>
              <button
                disabled={!isValid}
                className="bg-[#B19EEF] flex items-center justify-center w-[452px] h-[52px] rounded-[14px] text-[#000000] font-bold disabled:bg-[#635983] disabled:cursor-not-allowed"
              >
                Masuk
              </button>
            </div>
          </div>
        </div>
        <div className="w-1/2 flex justify-center items-center">
          <img
            src="/images/placeholder_auth.png"
            className=" w-[635px] h-[661px]"
          />
        </div>
      </div>
    </div>
  );
}
