"use client";

import CountUp from "@/component/CountUp";
import GlassSurface from "@/component/GlassSurface";
import GradientText from "@/component/GradientText";
import Navbar from "@/component/navbar";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="w-full font-jakarta text-white bg-black min-h-screen relative flex flex-col">
      <Navbar />
      <div className="w-full h-full flex flex-col absolute z-0">
        <div className="w-full h-[160vh] bg-gradient-to-b from-black via-[#791BB0]/70 to-black"></div>
      </div>
      <div className="main-content flex flex-col gap-20 items-center mt-28 relative z-40">
        <div className="hero-section py-[8vh] w-full px-[30vh] flex flex-col gap-7 items-center">
          <h1 className="main-title inline text-6xl text-center text-white font-bold font-poppins">
            Tingkatkan{" "}
            <span className="text-transparent bg-gradient-to-br bg-clip-text from-[#FF9FFC] to-[#a98fff]">
              Potensimu
            </span>
            , Dominasi Kompetisi Bersama{" "}
            <span className="text-transparent bg-gradient-to-br bg-clip-text from-[#006FFF] via-[#00C6D1] to-[#31f5ff]">
              MARK-UP!
            </span>
          </h1>
          <h1 className="w-[60%] text-center font-light">
            Maksimalkan{" "}
            <span className="font-bold text-transparent bg-gradient-to-br bg-clip-text from-[#FF9FFC] to-[#a98fff]">
              potensimu
            </span>{" "}
            untuk menang. Dapatkan bimbingan personal, kelas terarah, dan modul
            praktis yang dirancang khusus untuk{" "}
            <span className="font-bold">mencetak para juara.</span>
          </h1>
          <a
            href=""
            className="bg-white py-2 px-5 rounded-md hover:pl-6 hover:pr-4 transition-all ease-in-out duration-200 overflow-hidden items-center flex text-black text-base font-bold gap-3"
          >
            <h1>Gabung MarkUp Sekarang</h1>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              fill="#a98fff"
              viewBox="0 0 256 256"
            >
              <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,109.66-32,32a8,8,0,0,1-11.32-11.32L148.69,136H88a8,8,0,0,1,0-16h60.69l-18.35-18.34a8,8,0,0,1,11.32-11.32l32,32A8,8,0,0,1,173.66,133.66Z"></path>
            </svg>
          </a>
          <div className="numbering flex gap-5">
            <div className="alumni flex flex-col gap-1 items-center">
              <div className="alumni-num text-transparent bg-gradient-to-br bg-clip-text from-[#FF9FFC] to-[#a98fff] text-4xl font-bold flex items-center">
                <CountUp
                  from={0}
                  to={100}
                  separator=","
                  direction="up"
                  duration={1}
                  className="count-up-text"
                  startCounting={false}
                />
                <h1>+</h1>
              </div>
              <h1 className="font-light">Alumni Hebat</h1>
            </div>
            <div className="w-1 h-auto bg-gradient-to-b from-white to-transparent"></div>
            <div className="modul flex flex-col gap-1 items-center">
              <div className="modul-num text-transparent bg-gradient-to-br bg-clip-text from-[#FF9FFC] to-[#a98fff] text-4xl font-bold flex items-center">
                <CountUp
                  from={0}
                  to={10}
                  separator=","
                  direction="up"
                  duration={1}
                  className="count-up-text"
                  startCounting={false}
                />
                <h1>+</h1>
              </div>
              <h1 className="font-light">Modul Premium</h1>
            </div>
            <div className="w-1 h-auto bg-gradient-to-b from-white to-transparent"></div>
            <div className="mentor flex flex-col gap-1 items-center">
              <div className="mentor-num text-transparent bg-gradient-to-br bg-clip-text from-[#FF9FFC] to-[#a98fff] text-4xl font-bold flex items-center">
                <CountUp
                  from={0}
                  to={10}
                  separator=","
                  direction="up"
                  duration={1}
                  className="count-up-text"
                  startCounting={false}
                />
                <h1>+</h1>
              </div>
              <h1 className="font-light">Mentor Praktisi</h1>
            </div>
          </div>
        </div>
        <div className="why-markup flex flex-col bg-gradient-to-br from-[#160C32] to-[#071526] w-[90%] p-10 justify-center items-center bg-red-100 rounded-3xl gap-8">
          <div className="why-markup-title flex flex-col items-center gap-1">
            <h1 className="uppercase font-bold text-sm">Keunggulan Kami</h1>
            <h1 className="uppercase font-bold text-3xl">
              Mengapa Harus dengan{" "}
              <span className="text-transparent bg-gradient-to-br bg-clip-text from-[#FF9FFC] to-[#a98fff]">
                MARK-UP
              </span>
              ?
            </h1>
          </div>
          <div className="why-markup-content grid grid-rows-3 grid-cols-3 gap-3 w-full">
            <div className="row-span-3 p-8 gap-5 justify-center rounded-xl border flex flex-col border-white/30 col-span-1 bg-white text-black">
              <div className="top flex items-center gap-3">
                <div className="p-3 w-16 h-16 aspect-square rounded-md flex items-center justify-center bg-gradient-to-br from-[#FF9FFC] to-[#a98fff]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="36"
                    height="36"
                    fill="#ffffff"
                    viewBox="0 0 256 256"
                  >
                    <path d="M242.63,96.44l-184-64A8,8,0,0,0,48,40V216a8,8,0,0,0,16,0V173.69l178.63-62.13a8,8,0,0,0,0-15.12ZM64,156.75V51.25L215.65,104Z"></path>
                  </svg>
                </div>
                <h1 className="font-bold text-2xl">Belajar dari Para Ahli</h1>
              </div>
              <h1 className="font-light text-justify">
                Dapatkan arahan tajam dari mentor yang memiliki rekam jejak
                juara dan pengalaman mendalam di industrinya.
              </h1>
              <a
                href="#"
                className="w-full py-3 flex justify-center text-white bg-black rounded-md"
              >
                <h1 className="text-sm font-semibold">Kenalan dengan mentor</h1>
              </a>
            </div>
            <div className="row-span-2 p-8 gap-3 rounded-xl border flex flex-col border-white/30 col-span-1 bg-gradient-to-t from-white/35 via-white/30 to-white/25">
              <div className="top flex items-center gap-3">
                <div className="p-3 w-16 h-16 aspect-square rounded-md flex items-center justify-center bg-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="36"
                    height="36"
                    fill="#0"
                    viewBox="0 0 256 256"
                  >
                    <path d="M248,92.68a15.86,15.86,0,0,0-4.69-11.31L174.63,12.68a16,16,0,0,0-22.63,0L123.57,41.11l-58,21.77A16.06,16.06,0,0,0,55.35,75.23L32.11,214.68A8,8,0,0,0,40,224a8.4,8.4,0,0,0,1.32-.11l139.44-23.24a16,16,0,0,0,12.35-10.17l21.77-58L243.31,104A15.87,15.87,0,0,0,248,92.68Zm-69.87,92.19L63.32,204l47.37-47.37a28,28,0,1,0-11.32-11.32L52,192.7,71.13,77.86,126,57.29,198.7,130ZM112,132a12,12,0,1,1,12,12A12,12,0,0,1,112,132Zm96-15.32L139.31,48l24-24L232,92.68Z"></path>
                  </svg>
                </div>
                <h1 className="font-bold text-2xl">
                  Kurikulum Yang Terstruktur
                </h1>
              </div>
              <h1 className="font-light text-justify">
                Materi yang terarah dengan studi kasus nyata untuk asah
                kemampuan kompetisimu.
              </h1>
            </div>
            <div className="row-span-2 p-8 gap-3 rounded-xl border flex flex-col border-white/30 col-span-1 bg-gradient-to-tr from-[#570A93] to-[#082CE1]">
              <div className="top flex items-center gap-3">
                <div className="p-3 w-16 h-16 aspect-square rounded-md flex items-center justify-center bg-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="36"
                    height="36"
                    fill="#0"
                    viewBox="0 0 256 256"
                  >
                    <path d="M184,112a8,8,0,0,1-8,8H112a8,8,0,0,1,0-16h64A8,8,0,0,1,184,112Zm-8,24H112a8,8,0,0,0,0,16h64a8,8,0,0,0,0-16Zm48-88V208a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V48A16,16,0,0,1,48,32H208A16,16,0,0,1,224,48ZM48,208H72V48H48Zm160,0V48H88V208H208Z"></path>
                  </svg>
                </div>
                <h1 className="font-bold text-2xl">Modul Praktis dan Teruji</h1>
              </div>
              <h1 className="font-light text-justify">
                Akses materi pembelajaran mandiri, kerangka penyelesaian
                masalah, serta template presentasi yang siap pakai.
              </h1>
            </div>
            <div className="row-span-1 p-8 rounded-xl border border-white/30 col-span-2 bg-gradient-to-r from-[#4E4C53] to-black">
              asd
            </div>
          </div>
        </div>
        <div className="partner flex flex-col items-center gap-8">
          <div className="partner-title flex flex-col items-center gap-1">
            <h1 className="uppercase font-bold text-sm">PARTNER KAMI</h1>
            <h1 className="uppercase font-bold text-3xl">
              Dipercaya oleh{" "}
              <span className="text-transparent bg-gradient-to-br bg-clip-text from-[#FF9FFC] to-[#a98fff]">
                Ekosistem Hebat
              </span>
            </h1>
          </div>
          <div className="partner-content flex items-center justify-center gap-5 px-[5vh]">
            <div className="w-44 h-44 bg-white"></div>
            <div className="w-44 h-44 bg-white"></div>
            <div className="w-44 h-44 bg-white"></div>
            <div className="w-44 h-44 bg-white"></div>
            <div className="w-44 h-44 bg-white"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
