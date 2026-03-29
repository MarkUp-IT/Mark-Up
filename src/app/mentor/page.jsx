"use client";

import Navbar from "@/component/navbar";
import Footer from "@/component/Footer";
import { motion } from "framer-motion";

// Data Mentor digabung semua karena All Role, format FULL CAPSLOCK
const allMentors = [
  { name: "VITTORIO SALIM, FMVA" },
  { name: "MUHAMMAD NABIL RAZHIN" },
  { name: "ANDI ALIYAH SHABRINA" },
  { name: "SYONA HANA ARDITAPUTRI" },
  { name: "PRATISARA KHANSA TEGES PALUPI" },
  { name: "IMELDA FELICIA DHARMAWAN" },
  { name: "AARIEF FAWWAZ SATRIAHUTAMA" },
  { name: "DHILLA AVRYLIA UTOMO" },
  { name: "MUHAMMAD ADNAN BAYU" },
  { name: "CATHERINE HARIJANTO" },
  { name: "ADENA LAKSITA PARAMESTI" },
];

export default function MentorPage() {
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

      <Navbar />

      <div className="main-content flex flex-col gap-16 md:gap-24 items-center mt-28 md:mt-36 mb-24 relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6">
        {/* Hero Section */}
        <div className="hero-section flex flex-col gap-4 md:gap-6 items-center w-full">
          <div className="bg-[#08C7E1]/10 border border-[#08C7E1]/20 px-4 md:px-5 py-1.5 rounded-full flex justify-center items-center">
            <p className="text-[#08C7E1] font-semibold tracking-wide text-[11px] md:text-[13px]">
              Tim Expert
            </p>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-[56px] text-center text-white font-bold font-poppins leading-tight tracking-tight">
            Expert{" "}
            <span className="text-transparent bg-gradient-to-br bg-clip-text from-[#FF9FFC] to-[#a98fff]">
              Mentor
            </span>
          </h1>
          <p className="w-full max-w-[800px] text-center font-light text-[#A19DAB] text-sm md:text-base leading-relaxed px-2">
            Kolaborasi para ahli dan praktisi yang bekerja di balik layar untuk
            memastikan pengalaman belajarmu di MARK-UP berjalan optimal.
          </p>
        </div>

        {/* Mentor List Section (Hanya Grid, Tanpa Judul Kategori) */}
        <div className="mentor-content flex flex-col items-center w-full max-w-[1200px]">
          {/* Grid responsif: 1 kolom (HP), 2 kolom (Tablet), 3 atau 4 kolom (Desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6 w-full justify-items-center">
            {allMentors.map((mentor, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="w-full max-w-[320px] group cursor-default"
              >
                {/* Desain Card Minimalis Elegan */}
                <div className="bg-[#120822]/60 backdrop-blur-md rounded-[16px] border border-white/10 p-6 flex flex-col items-center text-center hover:border-[#B19EEF]/60 transition-all duration-300 hover:-translate-y-2 relative overflow-hidden h-full min-h-[120px] justify-center shadow-lg">
                  {/* Efek Glow Tipis di dalam card saat di-hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#B19EEF]/0 to-[#00C6D1]/0 group-hover:from-[#B19EEF]/10 group-hover:to-[#00C6D1]/5 transition-all duration-500"></div>

                  {/* Teks Nama Mentor (Lebih Bold & Rapi) */}
                  <h3 className="font-poppins font-bold text-[17px] md:text-lg text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-[#FF9FFC] group-hover:to-[#a98fff] group-hover:bg-clip-text transition-all duration-300 relative z-10 px-2 tracking-wide leading-snug">
                    {mentor.name}
                  </h3>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
