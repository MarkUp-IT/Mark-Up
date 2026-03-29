"use client";

import CountUp from "@/component/CountUp";
import DarkVeil from "@/component/DarkVeil";
import Navbar from "@/component/navbar";
import Footer from "@/component/Footer";
import dynamic from "next/dynamic";
import Image from "next/image";

const hashtagsRow1 = [
  "#Mentoring",
  "#Lomba",
  "#SiapJuara",
  "#Belajar",
  "#Terbaik",
  "#Prestasi",
  "#RaihMimpi",
  "#PersiapanJuara",
];
const hashtagsRow2 = [
  "#MentalJuara",
  "#JadiJuara",
  "#Strategi",
  "#Produktif",
  "#Unggul",
  "#Latihan",
  "#Intensif",
  "#Lolos",
];

// Data Testimoni Sesuai Request (Real)
const testimonials = [
  {
    name: "Dhika Riski Wahyuda",
    role: "S1 Akuntansi",
    text: "Saya merasa lebih lancar dari sebelumnya dalam menyusun paper untuk kompetisi.",
  },
  {
    name: "Muhammad Nazzar Maulana",
    role: "S1 Akuntansi",
    text: "Saya lebih percaya diri dalam menyampaikan ide dan memahami kasus menyeluruh.",
  },
  {
    name: "Marsya Putri Salsabila",
    role: "Law, Unpad '24",
    text: "At first, I felt insecure about joining the BCC competition because my background is accounting and I didn't understand the world of marketing and consulting. But after talking with a senior who had participated before, it turned out there are many ways to learn step by step. What's important is having someone who can guide you, so you don't struggle alone.",
  },
  {
    name: "Keisha Sahab",
    role: "Psychology, UNAIR '22",
    text: "When I first wanted to join the Business Case Competition (BCC), I honestly didn't know where to start. I'm from an International Relations major, so I felt my basic business knowledge wasn't strong enough. Eventually, I tried reaching out to people who had competed before so I could get guidance and step-by-step sharing.",
  },
  {
    name: "I Made Aravida",
    role: "Business Digital, ITS '24",
    text: "I became more confident in presenting ideas and understanding business cases comprehensively.",
  },
  {
    name: "Jaisy H. Abraham",
    role: "Law, Unpad '24",
    text: "I feel much more fluent than before mentoring when preparing competition papers.",
  },
];

// Array untuk Logo Partner (9.png sampai 16.png)
const partnerLogos = [9, 10, 11, 12, 13, 14, 15, 16];

// Komponen TestiCard (Teks max 4 baris, ada ellipsis "...")
const TestiCard = ({ data, dark }) => (
  <div
    className={`w-[320px] md:w-[450px] h-[220px] md:h-[260px] ${
      dark ? "bg-[#0A0514]" : "bg-[#120822]"
    } border border-white/10 rounded-[24px] p-6 md:p-8 flex flex-col justify-between hover:border-[#B19EEF]/50 transition-colors mx-2 md:mx-3 shadow-md shrink-0`}
  >
    {/* Kutipan Teks: Ditambah line-clamp-4, tanda kutip pakai string biasa */}
    <p className="text-gray-300 text-xs md:text-sm leading-relaxed italic relative z-10 line-clamp-4">
      `{data.text}`
    </p>

    <div className="flex flex-col mt-6 border-t border-white/5 pt-4">
      <p className="font-poppins font-bold text-sm md:text-base text-white">
        {data.name}
      </p>
      <p className="text-[#B19EEF] font-medium text-[10px] md:text-xs tracking-wide">
        {data.role}
      </p>

      {/* 5 Bintang */}
      <div className="flex gap-1 mt-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-3 h-3 md:w-4 md:h-4 text-yellow-400"
          >
            <path
              fillRule="evenodd"
              d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.006z"
              clipRule="evenodd"
            />
          </svg>
        ))}
      </div>
    </div>
  </div>
);

export default function HomePage() {
  return (
    <div className="w-full font-jakarta text-white bg-black min-h-screen relative flex flex-col overflow-x-hidden">
      <Navbar className="bg-white/10" />
      <div className="absolute top-0 left-0 w-full h-[100dvh] md:h-screen flex flex-col z-0 overflow-hidden pointer-events-none">
        <DarkVeil
          hueShift={337}
          noiseIntensity={0}
          scanlineIntensity={0}
          speed={0.5}
          scanlineFrequency={0.5}
          warpAmount={0}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="main-content flex flex-col gap-24 md:gap-32 items-center mt-24 md:mt-28 relative z-40 mb-24 w-full">
        {/* HERO SECTION */}
        <div className="hero-section py-8 md:py-[8vh] w-full px-6 md:px-[10vh] lg:px-[30vh] flex flex-col gap-4 md:gap-6 items-center">
          <h1 className="main-title inline text-4xl sm:text-5xl md:text-6xl text-center text-white font-bold font-poppins leading-tight">
            Tingkatkan{" "}
            <span className="text-transparent bg-gradient-to-br bg-clip-text from-[#FF9FFC] to-[#a98fff] block sm:inline">
              Potensimu
            </span>
            <span className="hidden sm:inline">,</span> Dominasi Kompetisi
            <br className="hidden md:block" /> Bersama{" "}
            <span className="text-transparent bg-gradient-to-br bg-clip-text from-[#006FFF] via-[#00C6D1] to-[#31f5ff]">
              MARK-UP!
            </span>
          </h1>
          <h1 className="w-full max-w-[700px] text-center font-light text-sm md:text-base leading-relaxed px-2">
            Maksimalkan{" "}
            <span className="font-bold text-transparent bg-gradient-to-br bg-clip-text from-[#FF9FFC] to-[#a98fff]">
              potensimu
            </span>{" "}
            untuk menang. Dapatkan bimbingan personal, kelas terarah, dan modul
            praktis yang dirancang khusus untuk{" "}
            <span className="font-bold">mencetak para juara.</span>
          </h1>
          <a
            href="/produk"
            className="bg-white py-3 px-6 md:py-2 md:px-5 rounded-xl md:rounded-md hover:scale-105 transition-all ease-in-out duration-200 overflow-hidden items-center flex text-black text-sm md:text-base font-bold gap-3 shadow-lg shadow-white/10"
          >
            <h1>Gabung MarkUp Sekarang</h1>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              className="md:w-[32px] md:h-[32px]"
              fill="#a98fff"
              viewBox="0 0 256 256"
            >
              <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,109.66-32,32a8,8,0,0,1-11.32-11.32L148.69,136H88a8,8,0,0,1,0-16h60.69l-18.35-18.34a8,8,0,0,1,11.32-11.32l32,32A8,8,0,0,1,173.66,133.66Z"></path>
            </svg>
          </a>

          <div className="numbering flex flex-row justify-center gap-8 md:gap-10 mt-4 w-full bg-white/5 md:bg-transparent py-4 rounded-2xl md:rounded-none backdrop-blur-sm md:backdrop-blur-none px-2">
            <div className="alumni flex flex-col gap-1 items-center">
              <div className="alumni-num text-transparent bg-gradient-to-br bg-clip-text from-[#FF9FFC] to-[#a98fff] text-2xl md:text-4xl font-bold flex items-center">
                <CountUp
                  from={0}
                  to={100}
                  separator=","
                  direction="up"
                  duration={1}
                  startCounting={false}
                />
                <h1>+</h1>
              </div>
              <h1 className="font-light text-[10px] md:text-sm text-center">
                Alumni Hebat
              </h1>
            </div>
            <div className="w-[1px] h-auto bg-gradient-to-b from-white/30 md:from-white to-transparent"></div>
            <div className="modul flex flex-col gap-1 items-center">
              <div className="modul-num text-transparent bg-gradient-to-br bg-clip-text from-[#FF9FFC] to-[#a98fff] text-2xl md:text-4xl font-bold flex items-center">
                <CountUp
                  from={0}
                  to={10}
                  separator=","
                  direction="up"
                  duration={1}
                  startCounting={false}
                />
                <h1>+</h1>
              </div>
              <h1 className="font-light text-[10px] md:text-sm text-center">
                Program & Layanan
              </h1>
            </div>
            <div className="w-[1px] h-auto bg-gradient-to-b from-white/30 md:from-white to-transparent"></div>
            <div className="mentor flex flex-col gap-1 items-center">
              <div className="mentor-num text-transparent bg-gradient-to-br bg-clip-text from-[#FF9FFC] to-[#a98fff] text-2xl md:text-4xl font-bold flex items-center">
                <CountUp
                  from={0}
                  to={10}
                  separator=","
                  direction="up"
                  duration={1}
                  startCounting={false}
                />
                <h1>+</h1>
              </div>
              <h1 className="font-light text-[10px] md:text-sm text-center">
                Mentor Praktisi
              </h1>
            </div>
          </div>
        </div>

        {/* KEUNGGULAN SECTION */}
        <div className="why-markup flex flex-col bg-gradient-to-br from-[#160C32] to-[#071526] w-[90%] md:w-full max-w-[1050px] p-6 md:p-10 justify-center items-center rounded-[24px] md:rounded-3xl gap-6 md:gap-8 mx-auto overflow-hidden relative shadow-2xl">
          <div className="why-markup-title flex flex-col items-center gap-1 text-center">
            <h1 className="uppercase font-bold text-[10px] md:text-xs tracking-widest text-gray-300">
              Keunggulan Kami
            </h1>
            <h1 className="font-poppins font-bold text-2xl md:text-3xl">
              Mengapa Harus dengan{" "}
              <span className="text-transparent bg-gradient-to-br bg-clip-text from-[#FF9FFC] to-[#a98fff]">
                MARK-UP
              </span>
              ?
            </h1>
          </div>

          <div className="why-markup-content grid grid-cols-1 md:grid-cols-3 gap-4 w-full relative z-10">
            {/* Card 1 */}
            <div className="md:row-span-3 p-6 md:p-8 gap-4 md:gap-5 justify-center rounded-[20px] md:rounded-[24px] border flex flex-col border-white/30 md:col-span-1 bg-white text-black">
              <div className="top flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
                <div className="p-3 w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#FF9FFC] to-[#a98fff]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    className="md:w-[36px] md:h-[36px]"
                    fill="#ffffff"
                    viewBox="0 0 256 256"
                  >
                    <path d="M242.63,96.44l-184-64A8,8,0,0,0,48,40V216a8,8,0,0,0,16,0V173.69l178.63-62.13a8,8,0,0,0,0-15.12ZM64,156.75V51.25L215.65,104Z"></path>
                  </svg>
                </div>
                <h1 className="font-poppins font-bold text-lg md:text-xl leading-tight">
                  Belajar dari Para Ahli
                </h1>
              </div>
              <h1 className="font-light text-sm text-justify">
                Dapatkan arahan tajam dari mentor yang memiliki rekam jejak
                juara dan pengalaman mendalam di industrinya.
              </h1>
              <a
                href="/mentor"
                className="w-full py-3 mt-4 md:mt-auto flex justify-center text-white bg-black rounded-xl hover:bg-gray-800 transition-colors"
              >
                <h1 className="text-xs md:text-sm font-semibold">
                  Kenalan dengan mentor
                </h1>
              </a>
            </div>

            {/* Card 2 */}
            <div className="md:row-span-2 p-6 md:p-8 gap-3 md:gap-4 rounded-[20px] md:rounded-[24px] border flex flex-col border-white/30 md:col-span-1 bg-gradient-to-t from-white/10 via-white/5 to-transparent">
              <div className="top flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
                <div className="p-3 w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-xl flex items-center justify-center bg-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    className="md:w-[36px] md:h-[36px]"
                    fill="#160C32"
                    viewBox="0 0 256 256"
                  >
                    <path d="M248,92.68a15.86,15.86,0,0,0-4.69-11.31L174.63,12.68a16,16,0,0,0-22.63,0L123.57,41.11l-58,21.77A16.06,16.06,0,0,0,55.35,75.23L32.11,214.68A8,8,0,0,0,40,224a8.4,8.4,0,0,0,1.32-.11l139.44-23.24a16,16,0,0,0,12.35-10.17l21.77-58L243.31,104A15.87,15.87,0,0,0,248,92.68Zm-69.87,92.19L63.32,204l47.37-47.37a28,28,0,1,0-11.32-11.32L52,192.7,71.13,77.86,126,57.29,198.7,130ZM112,132a12,12,0,1,1,12,12A12,12,0,0,1,112,132Zm96-15.32L139.31,48l24-24L232,92.68Z"></path>
                  </svg>
                </div>
                <h1 className="font-poppins font-bold text-lg md:text-xl leading-tight">
                  Kurikulum Yang Terstruktur
                </h1>
              </div>
              <h1 className="font-light text-sm text-gray-300 text-justify">
                Materi yang terarah dengan studi kasus nyata untuk asah
                kemampuan kompetisimu.
              </h1>
            </div>

            {/* Card 3 */}
            <div className="md:row-span-2 p-6 md:p-8 gap-3 md:gap-4 rounded-[20px] md:rounded-[24px] border flex flex-col border-white/30 md:col-span-1 bg-gradient-to-tr from-[#570A93] to-[#082CE1]">
              <div className="top flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
                <div className="p-3 w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-xl flex items-center justify-center bg-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    className="md:w-[36px] md:h-[36px]"
                    fill="#082CE1"
                    viewBox="0 0 256 256"
                  >
                    <path d="M184,112a8,8,0,0,1-8,8H112a8,8,0,0,1,0-16h64A8,8,0,0,1,184,112Zm-8,24H112a8,8,0,0,0,0,16h64a8,8,0,0,0,0-16Zm48-88V208a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V48A16,16,0,0,1,48,32H208A16,16,0,0,1,224,48ZM48,208H72V48H48Zm160,0V48H88V208H208Z"></path>
                  </svg>
                </div>
                <h1 className="font-poppins font-bold text-lg md:text-xl leading-tight">
                  Modul Praktis dan Teruji
                </h1>
              </div>
              <h1 className="font-light text-sm text-gray-200 text-justify">
                Akses materi pembelajaran mandiri, kerangka penyelesaian
                masalah, serta template presentasi yang siap pakai.
              </h1>
            </div>

            {/* MARQUEE HASHTAGS */}
            <div className="md:row-span-1 py-5 md:py-0 rounded-[20px] md:rounded-[24px] border border-white/30 md:col-span-2 bg-gradient-to-r from-[#2A2438] to-[#100A19] flex flex-col justify-center gap-2 md:gap-3 overflow-hidden w-full relative">
              <div className="absolute left-0 top-0 bottom-0 w-8 md:w-12 bg-gradient-to-r from-[#2A2438] to-transparent z-10 rounded-l-[24px]"></div>
              <div className="absolute right-0 top-0 bottom-0 w-8 md:w-12 bg-gradient-to-l from-[#100A19] to-transparent z-10 rounded-r-[24px]"></div>

              {/* Baris 1: Ke Kiri */}
              <div className="flex w-full pt-1 md:pt-2 overflow-hidden">
                <div className="flex gap-2 md:gap-3 whitespace-nowrap animate-marquee-left">
                  {[...hashtagsRow1, ...hashtagsRow1, ...hashtagsRow1].map(
                    (tag, idx) => (
                      <span
                        key={`r1-${idx}`}
                        className="border border-white/20 text-white/70 px-3 md:px-4 py-1 rounded-full text-[9px] md:text-[11px] hover:border-[#B19EEF] hover:text-[#B19EEF] transition-colors cursor-default"
                      >
                        {tag}
                      </span>
                    ),
                  )}
                </div>
              </div>

              {/* Baris 2: Ke Kanan */}
              <div className="flex w-full pb-1 md:pb-2 overflow-hidden">
                <div
                  className="flex gap-2 md:gap-3 whitespace-nowrap animate-marquee-right"
                  style={{ transform: "translateX(-50%)" }}
                >
                  {[...hashtagsRow2, ...hashtagsRow2, ...hashtagsRow2].map(
                    (tag, idx) => (
                      <span
                        key={`r2-${idx}`}
                        className="border border-white/20 text-white/70 px-3 md:px-4 py-1 rounded-full text-[9px] md:text-[11px] hover:border-[#B19EEF] hover:text-[#B19EEF] transition-colors cursor-default"
                      >
                        {tag}
                      </span>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 1: PARTNER KAMI */}
        <div className="partner flex flex-col items-center gap-6 md:gap-10 w-full max-w-[800px] px-4">
          <div className="partner-title flex flex-col items-center gap-1 text-center">
            <h1 className="uppercase font-bold text-[10px] md:text-xs tracking-widest text-gray-400">
              PARTNER KAMI
            </h1>
            <h1 className="font-poppins font-bold text-2xl md:text-3xl">
              Dipercaya oleh{" "}
              <span className="text-transparent bg-gradient-to-br bg-clip-text from-[#B19EEF] to-[#a98fff]">
                Ekosistem Hebat
              </span>
            </h1>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full mt-2">
            {partnerLogos.map((num) => (
              <div
                key={num}
                className="bg-[#1A132F] border border-[#B19EEF]/30 rounded-[20px] md:rounded-[24px] flex-col hover:border-[#B19EEF]/80 relative shadow-[0_0_30px_rgba(177,158,239,0.1)] hover:scale-105 transition-all duration-300 flex items-center justify-center overflow-hidden p-3 md:p-4"
              >
                <img
                  src={`/images/${num}.png`}
                  alt={`Partner ${num}`}
                  className="w-full h-full object-contain transition-all duration-300"
                />
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2: MATERI KOMPREHENSIF (BENTO GRID) */}
        <div className="flex flex-col items-center gap-8 md:gap-10 w-full max-w-[1050px] px-4">
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="uppercase font-bold text-[10px] md:text-xs tracking-widest text-gray-400">
              MATERI KOMPREHENSIF
            </h1>
            <h1 className="font-poppins font-bold text-2xl md:text-4xl">
              Rancang Strategi{" "}
              <span className="text-transparent bg-gradient-to-br bg-clip-text from-[#FF9FFC] to-[#a98fff]">
                Menuju Kemenangan
              </span>
            </h1>
          </div>

          <div className="flex flex-col md:flex-row gap-4 md:gap-5 w-full">
            {/* Kiri: Studi Kasus */}
            <div className="w-full md:w-[35%] bg-gradient-to-br from-[#3B0E76] to-[#1A0A3A] border border-[#B19EEF]/20 rounded-[20px] md:rounded-[24px] p-6 md:p-8 flex flex-col justify-between hover:border-[#B19EEF]/50 transition-colors min-h-[220px] md:min-h-auto">
              <div>
                <div className="flex gap-2 mb-4 md:mb-6">
                  <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-[#B19EEF]"></div>
                  <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-[#00C6E0]"></div>
                  <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-white"></div>
                </div>
                <h2 className="font-poppins font-bold text-2xl md:text-3xl mb-3 md:mb-4 leading-tight">
                  Studi Kasus
                  <br />
                  Komprehensif
                </h2>
                <p className="text-gray-300 text-xs text-justify md:text-sm leading-relaxed mb-6 md:mb-8">
                  Bedah tuntas berbagai framework analisis bisnis, mulai dari
                  SWOT, Porter`s Five Forces, hingga strategi implementasi
                  solusi yang inovatif dan aplikatif.
                </p>
              </div>
            </div>

            {/* Kanan: Stack Vertical */}
            <div className="w-full md:w-[65%] flex flex-col gap-4 md:gap-5">
              <div className="w-full bg-gradient-to-br from-[#3B0E76] to-[#1A0A3A] border border-[#B19EEF]/20 rounded-[20px] md:rounded-[24px] p-6 md:p-8 flex flex-col items-center justify-center text-center hover:border-[#B19EEF]/50 transition-colors min-h-[180px] md:min-h-[200px]">
                <h2 className="font-poppins font-bold text-2xl md:text-3xl mb-3 md:mb-4">
                  Mentoring Eksklusif
                </h2>
                <p className="text-gray-300 text-justify text-xs md:text-sm leading-relaxed max-w-[500px]">
                  Dapatkan bimbingan intensif langsung dari para pemenang
                  kompetisi nasional dan internasional. Kami siap membantu
                  memvalidasi ide, mempertajam argumen, hingga memperbaiki
                  struktur solusi tim kamu secara personal.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 flex-1">
                <div className="w-full bg-gradient-to-br from-[#3B0E76] to-[#1A0A3A] border border-[#B19EEF]/20 rounded-[20px] md:rounded-[24px] p-6 md:p-8 flex flex-col items-center justify-center text-center hover:border-[#B19EEF]/50 transition-colors min-h-[160px] md:min-h-[200px]">
                  <h2 className="font-poppins font-bold text-xl md:text-2xl mb-2 md:mb-3">
                    Materi Digital
                  </h2>
                  <p className="text-gray-300 text-justify text-xs md:text-sm leading-relaxed">
                    Akses eksklusif ke berbagai template winning deck, e-book
                    analisis, dan tutorial riset pasar mendalam.
                  </p>
                </div>
                <div className="w-full bg-gradient-to-br from-[#3B0E76] to-[#1A0A3A] border border-[#B19EEF]/20 rounded-[20px] md:rounded-[24px] p-6 md:p-8 flex flex-col items-center justify-center text-center hover:border-[#B19EEF]/50 transition-colors min-h-[160px] md:min-h-[200px]">
                  <h1 className="font-poppins font-bold text-6xl sm:text-7xl md:text-8xl tracking-tighter mb-1 md:mb-2">
                    24/7
                  </h1>
                  <h2 className="font-poppins font-bold text-sm md:text-xl text-[#B19EEF]">
                    Akses Materi
                  </h2>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: PRODUK & PANDUAN (Deskripsi Singkat per Kategori) */}
        <div className="flex flex-col items-center gap-8 md:gap-12 w-full max-w-[1050px] px-4 mt-6 md:mt-10">
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="uppercase font-bold text-[10px] md:text-xs tracking-widest text-gray-400">
              LAYANAN UTAMA KAMI
            </h1>
            <h1 className="font-poppins font-bold text-2xl md:text-4xl">
              Eksplorasi{" "}
              <span className="text-transparent bg-gradient-to-br bg-clip-text from-[#B19EEF] to-[#a98fff]">
                Produk dan Program
              </span>{" "}
              Mark-Up
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 w-full">
            {/* Card 1: Mentoring */}
            <div className="bg-[#1A132F] border border-[#B19EEF]/30 rounded-[20px] md:rounded-[24px] p-6 md:p-8 flex flex-col hover:border-[#B19EEF]/80 transition-colors relative shadow-[0_0_30px_rgba(177,158,239,0.1)]">
              <span className="bg-[#3A3610] text-[#D1D83E] text-[10px] font-bold px-3 py-1 rounded-md self-start mb-4 md:mb-5">
                Mentoring
              </span>
              <h2 className="font-poppins font-bold text-xl md:text-2xl mb-2 md:mb-3">
                Private Mentoring
              </h2>
              <p className="text-gray-400 text-xs md:text-sm text-justify leading-relaxed flex-1">
                Bimbingan eksklusif secara 1-on-1 bersama para juara kompetisi.
                Mulai dari validasi ide, penyusunan strategi, bedah framework,
                hingga simulasi pitching untuk mematangkan persiapan
                kompetisimu.
              </p>
            </div>

            {/* Card 2: Bootcamp */}
            <div className="bg-[#1A132F] border border-[#B19EEF]/30 rounded-[20px] md:rounded-[24px] p-6 md:p-8 flex flex-col hover:border-[#B19EEF]/80 transition-colors relative shadow-[0_0_30px_rgba(177,158,239,0.1)]">
              <span className="bg-[#0A4A5C] text-[#00C6D1] text-[10px] font-bold px-3 py-1 rounded-md self-start mb-4 md:mb-5">
                Bootcamp
              </span>
              <h2 className="font-poppins font-bold text-xl md:text-2xl mb-2 md:mb-3">
                Intensive Bootcamp
              </h2>
              <p className="text-gray-300 text-xs md:text-sm text-justify leading-relaxed flex-1">
                Program pelatihan intensif berbasis project nyata. Dirancang
                untuk membimbingmu dari pemahaman dasar hingga mahir dengan
                kurikulum terstruktur, sesi kelas interaktif, dan penugasan
                evaluatif.
              </p>
            </div>

            {/* Card 3: Modul */}
            <div className="bg-[#1A132F] border border-[#B19EEF]/30 rounded-[20px] md:rounded-[24px] p-6 md:p-8 flex flex-col hover:border-[#B19EEF]/80 transition-colors relative shadow-[0_0_30px_rgba(177,158,239,0.1)]">
              <span className="bg-[#3B0E76] text-[#B19EEF] text-[10px] font-bold px-3 py-1 rounded-md self-start mb-4 md:mb-5">
                Modul
              </span>
              <h2 className="font-poppins font-bold text-xl md:text-2xl mb-2 md:mb-3">
                E-Learning & Modul
              </h2>
              <p className="text-gray-400 text-xs md:text-sm text-justify leading-relaxed flex-1">
                Akses mandiri ke berbagai aset pembelajaran digital. Dapatkan
                modul materi komprehensif, template presentasi juara (winning
                pitch deck), bank soal kompetisi, dan panduan framework
                analisis.
              </p>
            </div>
          </div>

          <a
            href="/produk"
            className="bg-[#E5DFFF] hover:bg-white text-[#530D8E] font-bold text-xs md:text-sm py-3 px-6 md:px-8 rounded-xl transition-colors"
          >
            Lihat Semua Paket
          </a>
        </div>

        <div className="flex flex-col items-center gap-12 w-full max-w-[1050px] px-4 mt-6 md:mt-10">
          <div className="w-full bg-gradient-to-r from-[#1E163B] to-[#121B3D] border border-white/10 rounded-[24px] md:rounded-[32px] p-8 md:p-14 mt-6 relative overflow-hidden">
            <div className="flex flex-col items-center gap-1 md:gap-2 text-center mb-10 md:mb-16 relative z-10">
              <h1 className="uppercase font-bold text-[10px] md:text-xs tracking-widest text-gray-400">
                PANDUAN MEMULAI
              </h1>
              <h1 className="font-poppins font-bold text-2xl md:text-4xl">
                Mulai dalam{" "}
                <span className="text-[#B19EEF]">4 Tahapan Mudah</span>
              </h1>
            </div>

            <div className="relative z-10 w-full flex flex-col md:flex-row justify-between items-start gap-8 md:gap-4">
              <div className="hidden md:block absolute top-[24px] lg:top-[28px] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-[#B19EEF]/20 via-[#00C6D1]/50 to-[#B19EEF]/20 z-[-1]"></div>

              {[
                {
                  num: "1",
                  title: "Daftar Akun",
                  desc: "Buat akun di platform kami dan lengkapi profil untuk menyesuaikan perjalananmu.",
                },
                {
                  num: "2",
                  title: "Pilih Program",
                  desc: "Temukan program yang sesuai dengan kompetisi yang ingin kamu menangkan.",
                },
                {
                  num: "3",
                  title: "Belajar & Konsultasi",
                  desc: "Ikuti sesi pembelajaran dan konsultasikan strategi terbaikmu bersama mentor.",
                },
                {
                  num: "4",
                  title: "Terapkan & Menang",
                  desc: "Terapkan ilmu dari program bimbingan dan raih kemenangan kompetisimu.",
                },
              ].map((step, idx) => (
                <div
                  key={idx}
                  className="flex md:flex-col items-center md:items-center text-left md:text-center w-full md:w-1/4 gap-4 md:gap-0"
                >
                  <div className="w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-full bg-gradient-to-br from-[#4A2CA1] to-[#17A9D4] flex items-center justify-center font-bold text-xl md:text-2xl shadow-[0_0_20px_rgba(23,169,212,0.4)] md:mb-5">
                    {step.num}
                  </div>
                  <div>
                    <h3 className="font-poppins font-bold text-base md:text-lg mb-1 md:mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-400 text-[11px] md:text-xs leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 4: TESTIMONIAL ALUMNI (RUNNING/MARQUEE 3 BARIS) */}
        <div className="flex flex-col items-center gap-8 md:gap-10 w-full mt-4 md:mt-10 overflow-hidden relative">
          <div className="flex flex-col items-center gap-1 text-center px-4">
            <h1 className="uppercase font-bold text-[10px] md:text-xs tracking-widest text-gray-400">
              SAATNYA KAMU YANG ADA DI ANTARANYA
            </h1>
            <h1 className="font-poppins font-bold text-2xl md:text-4xl">
              Bukti Nyata dari{" "}
              <span className="text-transparent bg-gradient-to-br bg-clip-text from-[#B19EEF] to-[#a98fff]">
                Alumni MarkUp
              </span>
            </h1>
          </div>

          <div className="w-full flex flex-col gap-4 md:gap-5 py-2 md:py-4 relative">
            {/* Fade edges Testimoni */}
            <div className="absolute left-0 top-0 bottom-0 w-8 md:w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 md:w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none"></div>

            {/* Baris 1: Jalan Kiri */}
            <div className="flex overflow-hidden">
              <div className="flex animate-marquee-left">
                {[...testimonials, ...testimonials].map((t, i) => (
                  <TestiCard key={`row1-${i}`} data={t} dark={false} />
                ))}
              </div>
            </div>

            {/* Baris 2: Jalan Kanan */}
            <div className="flex overflow-hidden">
              <div
                className="flex animate-marquee-right"
                style={{ transform: "translateX(-50%)" }}
              >
                {[...testimonials.reverse(), ...testimonials].map((t, i) => (
                  <TestiCard key={`row2-${i}`} data={t} dark={false} />
                ))}
              </div>
            </div>

            {/* Baris 3: Jalan Kiri (Disembunyikan di Mobile biar ga kepanjangan) */}
            <div className="flex overflow-hidden hidden md:flex">
              <div className="flex animate-marquee-left-fast">
                {[...testimonials.reverse(), ...testimonials].map((t, i) => (
                  <TestiCard key={`row3-${i}`} data={t} dark={false} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* GLOBAL CSS ANIMATION */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* KEYFRAMES FOR MARQUEE */
        @keyframes marqueeLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marqueeRight {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }

        /* ANIMATION CLASSES */
        /* Hashtag Marquee Speed */
        .animate-marquee-left {
          animation: marqueeLeft 100s linear infinite;
          width: max-content;
        }
        
        /* Testimonial Rows Speed */
        .animate-marquee-right {
          animation: marqueeRight 100s linear infinite;
          width: max-content;
        }
        .animate-marquee-left-fast {
          animation: marqueeLeft 100s linear infinite;
          width: max-content;
        }
        
        /* Pause on Hover */
        .animate-marquee-left:hover,
        .animate-marquee-right:hover,
        .animate-marquee-left-fast:hover {
          animation-play-state: paused;
        }

        /* Responsive Animation Speed Adjustment for Mobile */
        @media (max-width: 768px) {
           .animate-marquee-left, .animate-marquee-right { animation-duration: 50s; }
        }
      `,
        }}
      />
    </div>
  );
}
