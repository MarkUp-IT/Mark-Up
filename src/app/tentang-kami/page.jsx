"use client";

import Navbar from "@/component/navbar";
import Footer from "@/component/Footer";

export default function TentangKamiPage(){
    return (
        <div className="w-full font-jakarta text-white bg-[#060010] min-h-screen relative flex flex-col">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1900px] h-[300px] rounded-b-full"
                style={{
                    background: 'radial-gradient(ellipse at top, rgba(255,255,255,0.15) 0%, transparent 70%)',
                    filter: 'blur(20px)',
                }}
            />
            <Navbar />
            <div className="main-content flex flex-col gap-20 items-center mt-28 relative z-40">
                <div className="hero-section py-[8vh] w-full px-[30vh] flex flex-col gap-7 items-center">
                    <div className="bg-[#08C7E1]/25 w-[175px] h-[40px] rounded-[24px] flex justify-center items-center">
                        <p className="text-[#08C7E1] font-bold z-20 text-[20px]" >
                            Tentang Kami
                        </p>
                    </div>
                    <h1 className="main-title inline text-6xl text-center text-white font-bold font-poppins">
                    Mencetak{" "}
                    <span className="text-transparent bg-gradient-to-br bg-clip-text from-[#006FFF] via-[#00C6D1] to-[#31f5ff]">
                        Juara
                    </span>
                    </h1>
                    <h1 className="w-[60%] text-center font-light">
                    Berdiri sejak 2023, Akademi Competition berkomitmen mencetak juara-juara lomba bergengsi secara inklusif untuk seluruh mahasiswa Indonesia
                    </h1>
                </div>
                <div className="founder-section flex flex-col gap-15">
                    <div className="flex flex-col items-center gap-1">
                        <p className="font-bold text-xs">
                            LEADERSHIP
                        </p>
                        <p className="font-poppins text-4xl font-bold">
                            <span className="text-[#B19EEF]">
                                Founder{" "}
                            </span>
                            dan Co-Founder
                        </p>
                    </div>
                    <div className="flex flex-row gap-5">
                        <div className="bg-[#34303C]/90 w-[503px] h-[250px] rounded-[24px] border border-[0.5px] border-[#958F9E]/40 flex flex-row gap-5 items-center justify-center">
                            <div className="w-[127px] h-[190px] bg-gradient-to-br from-[#4A2CA1] to-[#17A9D4]">
                            </div>
                            <div className="w-[297px] flex flex-col">
                                <p className="text-sm text-[#EDEDF3]">
                                    “Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,”
                                </p>
                                <p className="font-poppins font-semibold text-3xl mt-4">
                                    Nicco Cahyo
                                </p>
                                <p className="text-[#B19EEF] font-semibold text-base">
                                    Founder
                                </p>
                            </div>
                        </div>
                        <div className="bg-[#34303C]/90 w-[503px] h-[250px] rounded-[24px] border border-[0.5px] border-[#958F9E]/40 flex flex-row gap-5 items-center justify-center">
                            <div className="w-[127px] h-[190px] bg-gradient-to-br from-[#4A2CA1] to-[#17A9D4]">
                            </div>
                            <div className="w-[297px] flex flex-col">
                                <p className="text-sm text-[#EDEDF3]">
                                    “Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,”
                                </p>
                                <p className="font-poppins font-semibold text-3xl mt-4">
                                    Nicco Cahyo
                                </p>
                                <p className="text-[#B19EEF] font-semibold text-base">
                                    Founder
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <div className="flex flex-col items-center gap-1">
                        <p className="font-bold text-xs">
                            EXECUTIVE TEAM
                        </p>
                        <p className="font-poppins text-4xl font-bold">
                            Our
                            <span className="text-[#B19EEF]">
                                {" "}Teams
                            </span>
                        </p>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    )
}