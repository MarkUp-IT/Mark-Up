"use client";

import { em } from "framer-motion/client";
import { useState } from "react";


export default function Register() {

    const [namaLengkap , setNamaLengkap] = useState("");
    const [username , setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm , setConfirm] = useState("");
    const [isChecked, setIsChecked] = useState(false);

    const isValid = namaLengkap.trim() !== "" && username.trim() !== "" && email.trim() !== "" && password.trim() !== "" && confirm.trim() !== "" && isChecked;
 

  return (
    <div className="w-full font-jakarta text-white bg-[#060010] min-h-screen relative flex flex-col overflow-x-hidden">
      {/* Background Glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[150vw] md:w-[120vw] h-[300px] md:h-[400px] rounded-b-[100%] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(177, 158, 239, 0.15) 0%, transparent 60%)",
          filter: "blur(40px)",
          zIndex: 0,
        }}
      />

      <div className="w-full min-h-screen flex flex-row ">
        <div className="w-1/2 flex justify-center">
            <div className="flex flex-col gap-[18px] mt-5 mb-3">
                <div className="flex flex-col gap-[2px]">
                    <img src="/images/logo-markup.svg" className="w-[200px]"/>
                    <p className="font-bold text-[#B19EEF] text-[60px] font-poppins">
                        Registrasi
                    </p>
                    <p className="text-[22px] font-regular w-[450px]">
                        Buat akun untuk menggunakan platform MARK-UP
                    </p>
                </div>
                
                <div className="relative">
                    {namaLengkap !== "" && (
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
                        Nama Lengkap
                      </label>
                    )}


                    <input 
                    type="text" 
                    id="namaLengkap" 
                    placeholder="Nama Lengkap" required 
                    value={namaLengkap}
                    onChange={(e) => setNamaLengkap(e.target.value)}
                    className="w-[452px] h-[52px] bg-[#2B2B2B] rounded-[16px] pl-10 text-[19px] font-poppins focus:outline-none"/>
                </div>
                <div className="relative">
                    {username !== "" && (
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
                    className="w-[452px] h-[52px] bg-[#2B2B2B] rounded-[16px] pl-10 text-[19px] font-poppins focus:outline-none"/>
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
                    id="email" 
                    placeholder="Email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-[452px] h-[52px] bg-[#2B2B2B] rounded-[16px] pl-10 text-[19px] font-poppins focus:outline-none"/>
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
                    id="password"  
                    placeholder="Password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)} 
                    className="w-[452px] h-[52px] bg-[#2B2B2B] rounded-[16px] pl-10 text-[19px] font-poppins focus:outline-none"/>
                </div>
                <div className="relative">
                    {confirm !== "" && (
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
                        Konfirmasi Password
                      </label>
                    )}

                    <input 
                    type="text" 
                    id="confirm" 
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)} 
                    placeholder="Konfirmasi Password" required 
                    className="w-[452px] h-[52px] bg-[#2B2B2B] rounded-[16px] pl-10 text-[19px] font-poppins focus:outline-none"/>
                </div>
                <div className="flex flex-row gap-3 items-center">
                    <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => setIsChecked(e.target.checked)}
                    className="w-[15px] h-[15px] appearance-none border border-white bg-transparent checked:bg-transparent checked:border-white relative checked:after:content-['✔'] checked:after:text-white checked:after:absolute checked:after:text-[10px] checked:after:left-[3px] checked:after:top-[-2px]"
                    />
                    <p>
                        Saya sudah memahamai penjelasan terkait <span className="text-[#08C7E1]">
                            kebijakan privasi
                            </span>
                    </p>
                </div>
                <div>
                    <button 
                    disabled={!isValid}
                    className="bg-[#B19EEF] flex items-center justify-center w-[452px] h-[52px] rounded-[14px] text-[#000000] font-bold disabled:bg-[#635983] disabled:cursor-not-allowed">
                        Buat akun
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
