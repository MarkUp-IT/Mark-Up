// "use client";

// import Navbar from "@/component/navbar";
// import Footer from "@/component/Footer";
// import TeamCard from "@/component/TeamCard";
// import { motion } from "framer-motion";

// const teams = [
//   {
//     name: "Ahmad Reva Dany Fawwaz",
//     position: "CEO",
//     instagram: "https://instagram.com/username",
//     linkedin: "https://linkedin.com/in/username",
//   },
//   {
//     name: "Nayla R. Mawardi",
//     position: "CMO",
//     instagram: "https://instagram.com/username",
//     linkedin: "https://linkedin.com/in/username",
//   },
//   {
//     name: "Nicco Cahya Permana",
//     position: "CTO",
//     instagram: "https://instagram.com/username",
//     linkedin: "https://linkedin.com/in/username",
//   },
//   {
//     name: "Maulidina D. S.",
//     position: "COO",
//     instagram: "https://instagram.com/username",
//     linkedin: "https://linkedin.com/in/username",
//   },
//   {
//     name: "Sebastian Rafael",
//     position: "CPD",
//     instagram: "https://instagram.com/username",
//     linkedin: "https://linkedin.com/in/username",
//   },
// ];

// export default function TentangKamiPage() {
//   return (
//     <div className="w-full font-jakarta text-white bg-[#060010] min-h-screen relative flex flex-col overflow-x-hidden">
//       {/* Background Glow */}
//       <div
//         className="absolute top-0 left-1/2 -translate-x-1/2 w-[150vw] md:w-[120vw] h-[300px] md:h-[400px] rounded-b-[100%]"
//         style={{
//           background:
//             "radial-gradient(ellipse at top, rgba(177, 158, 239, 0.15) 0%, transparent 60%)",
//           filter: "blur(40px)",
//           zIndex: 0,
//         }}
//       />

//       <Navbar />

//       <div className="main-content flex flex-col gap-24 md:gap-32 items-center mt-28 md:mt-36 mb-24 relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6">
//         {/* Hero Section */}
//         <div className="hero-section flex flex-col gap-4 md:gap-6 items-center w-full">
//           <div className="bg-[#08C7E1]/10 border border-[#08C7E1]/20 px-4 md:px-5 py-1.5 rounded-full flex justify-center items-center">
//             <p className="text-[#08C7E1] font-semibold tracking-wide text-[11px] md:text-[13px]">
//               Tentang Kami
//             </p>
//           </div>
//           <h1 className="text-4xl sm:text-5xl md:text-[56px] text-center text-white font-bold font-poppins leading-tight tracking-tight">
//             Tokoh di Balik{" "}
//             <span className="text-transparent bg-gradient-to-br bg-clip-text from-[#FF9FFC] to-[#a98fff] block sm:inline">
//               MARK-UP
//             </span>
//           </h1>
//           <p className="w-full max-w-[800px] text-center font-light text-[#A19DAB] text-sm md:text-base leading-relaxed px-2">
//             MARK-UP hadir sebagai pusat pengembangan talenta yang berdedikasi
//             membimbing mahasiswa indonesia untuk meraih prestasi tertinggi di
//             berbagai ajang bergengsi
//           </p>
//         </div>

//         {/* Founder Section */}
//         <div className="founder-section flex flex-col items-center gap-8 md:gap-12 w-full">
//           <div className="flex flex-col items-center gap-1 md:gap-2 text-center">
//             <p className="font-bold text-[10px] md:text-[11px] uppercase tracking-[0.25em] text-[#958F9E]">
//               LEADERSHIP
//             </p>
//             <p className="font-poppins text-2xl md:text-3xl font-bold tracking-tight">
//               <span className="text-transparent bg-gradient-to-br bg-clip-text from-[#FF9FFC] to-[#a98fff]">
//                 Founder{" "}
//               </span>
//               <br className="sm:hidden" />
//               dan Co-Founder
//             </p>
//           </div>

//           <div className="flex flex-col lg:flex-row gap-6 justify-center w-full max-w-[1050px]">
//             {/* Card Founder */}
//             <motion.div
//               initial={{ opacity: 0, y: 30 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.8, ease: "easeOut" }}
//               viewport={{ once: true, margin: "-100px" }}
//               className="bg-[#1A1625] w-full lg:w-1/2 rounded-[24px] border border-[#3A3545] flex flex-col sm:flex-row p-5 md:p-6 hover:border-[#B19EEF]/50 transition-colors duration-300"
//             >
//               <div className="w-full sm:w-[140px] h-[200px] sm:h-[190px] bg-gradient-to-br from-[#4A2CA1] to-[#17A9D4] rounded-xl shrink-0">
//                 {/* Kalau nanti ada foto beneran, taruh tag <Image> di sini. Pastikan class-nya: object-cover w-full h-full rounded-xl */}
//               </div>
//               <div className="flex flex-col justify-center sm:pl-6 mt-4 sm:mt-0">
//                 <p className="text-[12px] md:text-[13px] text-[#A19DAB] italic leading-relaxed text-center sm:text-left">
//                   “Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed
//                   do eiusmod tempor incididunt ut labore et dolore magna aliqua.
//                   Ut enim ad minim veniam,”
//                 </p>
//                 <p className="font-poppins font-bold text-2xl md:text-[28px] mt-4 md:mt-5 leading-none text-center sm:text-left">
//                   Alya Hamidah
//                 </p>
//                 <p className="text-transparent bg-gradient-to-br bg-clip-text from-[#FF9FFC] to-[#a98fff] font-semibold text-[14px] md:text-[15px] mt-2 text-center sm:text-left">
//                   Founder
//                 </p>
//               </div>
//             </motion.div>

//             {/* Card Co-Founder */}
//             <motion.div
//               initial={{ opacity: 0, y: 30 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
//               viewport={{ once: true, margin: "-100px" }}
//               className="bg-[#1A1625] w-full lg:w-1/2 rounded-[24px] border border-[#3A3545] flex flex-col sm:flex-row p-5 md:p-6 hover:border-[#B19EEF]/50 transition-colors duration-300"
//             >
//               <div className="w-full sm:w-[140px] h-[200px] sm:h-[190px] bg-gradient-to-br from-[#4A2CA1] to-[#17A9D4] rounded-xl shrink-0">
//                 {/* Kalau nanti ada foto beneran, taruh tag <Image> di sini */}
//               </div>
//               <div className="flex flex-col justify-center sm:pl-6 mt-4 sm:mt-0">
//                 <p className="text-[12px] md:text-[13px] text-[#A19DAB] italic leading-relaxed text-center sm:text-left">
//                   “Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed
//                   do eiusmod tempor incididunt ut labore et dolore magna aliqua.
//                   Ut enim ad minim veniam,”
//                 </p>
//                 <p className="font-poppins font-bold text-2xl md:text-[28px] mt-4 md:mt-5 leading-none text-center sm:text-left">
//                   Ahmad Reva Dany F.
//                 </p>
//                 <p className="text-transparent bg-gradient-to-br bg-clip-text from-[#FF9FFC] to-[#a98fff] font-semibold text-[14px] md:text-[15px] mt-2 text-center sm:text-left">
//                   Co-Founder
//                 </p>
//               </div>
//             </motion.div>
//           </div>
//         </div>

//         {/* Executive Team Section */}
//         <div className="w-full flex flex-col items-center">
//           <div className="flex flex-col items-center gap-1 md:gap-2 mb-8 md:mb-12 text-center">
//             <p className="font-bold text-[10px] md:text-[11px] uppercase tracking-[0.25em] text-[#958F9E]">
//               EXECUTIVE TEAM
//             </p>
//             <p className="font-poppins text-2xl md:text-3xl font-bold tracking-tight">
//               Our
//               <span className="text-transparent bg-gradient-to-br bg-clip-text from-[#FF9FFC] to-[#a98fff]">
//                 {" "}
//                 Teams
//               </span>
//             </p>
//           </div>

//           {/* Grid responsif: 1 kolom (HP), 2 kolom (Tablet/Desktop) */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 justify-center w-full max-w-[1050px]">
//             {teams.map((team, index) => (
//               <TeamCard
//                 key={index}
//                 name={team.name}
//                 position={team.position}
//                 instagram={team.instagram}
//                 linkedin={team.linkedin}
//               />
//             ))}
//           </div>
//         </div>
//       </div>

//       <Footer />
//     </div>
//   );
// }
