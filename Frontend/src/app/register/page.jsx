"use client";


export default function Register() {
 

  return (
    <div className="w-full font-jakarta text-white bg-[#060010] min-h-screen relative flex flex-col overflow-x-hidden">
      {/* Background Glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[150vw] md:w-[120vw] h-[300px] md:h-[400px] rounded-b-[100%]"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(177, 158, 239, 0.15) 0%, transparent 60%)",
          filter: "blur(40px)",
          zIndex: 0,
        }}
      />

      <div className="w-full min-h-screen flex flex-row ">
        <div className="w-1/2 flex justify-center">
            <div className="flex flex-col gap-[18px] mt-5 mb-5">
                <div className="flex flex-col gap-[2px]">
                    <img src="/images/logo-markup.svg" className="w-[200px]"/>
                    <p className="font-bold text-[#B19EEF] text-[60px] font-poppins">
                        Registrasi
                    </p>
                    <p className="text-[22px] font-regular w-[450px]">
                        Buat akun untuk menggunakan platform MARK-UP
                    </p>
                </div>
                
                <div>
                    <input type="text" id="username" name="user_name" placeholder="Nama Lengkap" required className="w-[452px] h-[52px] bg-[#2B2B2B] rounded-[16px] pl-10 text-[19px] font-poppins"/>
                </div>
                <div>
                    <input type="text" id="username" name="user_name" placeholder="Username" required className="w-[452px] h-[52px] bg-[#2B2B2B] rounded-[16px] pl-10 text-[19px] font-poppins"/>
                </div>
                <div>
                    <input type="text" id="username" name="user_name" placeholder="Email" required className="w-[452px] h-[52px] bg-[#2B2B2B] rounded-[16px] pl-10 text-[19px] font-poppins"/>
                </div>
                <div>
                    <input type="text" id="username" name="user_name" placeholder="Password" required className="w-[452px] h-[52px] bg-[#2B2B2B] rounded-[16px] pl-10 text-[19px] font-poppins"/>
                </div>
                <div>
                    <input type="text" id="username" name="user_name" placeholder="Konfirmasi Password" required className="w-[452px] h-[52px] bg-[#2B2B2B] rounded-[16px] pl-10 text-[19px] font-poppins"/>
                </div>
                <div className="flex flex-row gap-3 items-center">
                    <input
                    type="checkbox"
                    className="
                        w-[15px]
                        h-[15px]
                        appearance-none
                        border
                        border-white
                        bg-transparent
                        checked:bg-transparent
                        checked:border-white
                        relative
                        checked:after:content-['✔']
                        checked:after:text-white
                        checked:after:absolute
                        checked:after:text-[10px]
                        checked:after:left-[3px]
                        checked:after:top-[-2px]
                    "
                    />
                    <p>
                        Saya sudah memahamai penjelasan terkait <span className="text-[#08C7E1]">
                            kebijakan privasi
                            </span>
                    </p>
                </div>
                <div>
                    <button className="bg-[#B19EEF] flex items-center justify-center w-[452px] h-[52px] rounded-[14px] text-[#000000] font-bold">
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
