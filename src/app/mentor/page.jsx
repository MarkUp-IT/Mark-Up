"use client";

import Navbar from "@/component/navbar";
import Footer from "@/component/Footer";
import CountUp from "@/component/CountUp";
import MentorCard from "@/component/MentorCard";
import dynamic from "next/dynamic";

const GlassSurface = dynamic(() => import("@/component/GlassSurface"), { 
    ssr: false 
});

const businessCaseMentor = [
    {name: "Affan Fathir", description: "1st Winner National Business Case ..."},
    {name: "Affan Fathir", description: "1st Winner National Business Case ..."},
    {name: "Affan Fathir", description: "1st Winner National Business Case ..."},
    {name: "Affan Fathir", description: "1st Winner National Business Case ..."}
]

const debateMentor = [
    {name: "Affan Fathir", description: "1st Winner National Business Case ..."},
    {name: "Affan Fathir", description: "1st Winner National Business Case ..."},
    {name: "Affan Fathir", description: "1st Winner National Business Case ..."}
]
const uiuxMentor = [
    {name: "Affan Fathir", description: "1st Winner National Business Case ..."},
    {name: "Affan Fathir", description: "1st Winner National Business Case ..."}
]

const hackathonMentor = [
    {name: "Affan Fathir", description: "1st Winner National Business Case ..."}
]

export default function MentorPage() {
  return (
    <div className="w-full font-jakarta text-white bg-[#060010] min-h-screen relative flex flex-col">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[300px] rounded-b-full"
            style={{
                background: 'radial-gradient(ellipse at top, rgba(255,255,255,0.15) 0%, transparent 70%)',
                filter: 'blur(20px)',
            }}
        />
        <Navbar />
        
        <div className="main-content flex flex-col gap-20 items-center mt-28 relative z-40">
            <div className="hero-section py-[8vh] w-full px-[30vh] flex flex-col gap-7 items-center">
                <div className="bg-[#08C7E1]/25 w-[147px] rounded-[24px] flex justify-center">
                    <p className="text-[#08C7E1] font-bold z-20 text-[20px]" >
                        Tim Expert
                    </p>
                </div>
                <h1 className="main-title inline text-6xl text-center text-white font-bold font-poppins">
                Expert{" "}
                <span className="text-transparent bg-gradient-to-br bg-clip-text from-[#006FFF] via-[#00C6D1] to-[#31f5ff]">
                    Mentor
                </span>
                </h1>
                <h1 className="w-[60%] text-center font-light">
                Para juara kompetisi yang siap membimbingmu meraih prestasi impian
                </h1>
                <GlassSurface
                    width="634px"
                    height={48}
                    borderRadius={12}
                    blur={15}
                    opacity={0.3}
                    backgroundOpacity={0.1}
                    className="w-[634px]"
                >
                    <div className="relative flex items-center w-full px-4">
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            strokeWidth="1.5" 
                            stroke="currentColor" 
                            className="size-5 absolute left-0 text-white/50"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                        </svg>
                        <input 
                            type="search" 
                            className="w-full bg-transparent pl-8 text-white placeholder:text-white/50 outline-none" 
                            placeholder="Cari nama mentor atau bidang"
                        />
                    </div>
                </GlassSurface>

                <div className="numbering flex gap-5">
                <div className="alumni flex flex-col gap-1 items-center">
                    <div className="alumni-num text-transparent bg-gradient-to-br bg-clip-text from-[#FF9FFC] to-[#a98fff] text-4xl font-bold flex items-center">
                    <CountUp
                        from={0}
                        to={50}
                        separator=","
                        direction="up"
                        duration={1}
                        className="count-up-text"
                        startCounting={false}
                    />
                    <h1>+</h1>
                    </div>
                    <h1 className="font-light">Mentor Expert</h1>
                </div>
                <div className="w-1 h-auto bg-gradient-to-b from-white to-transparent"></div>
                <div className="modul flex flex-col gap-1 items-center">
                    <div className="modul-num text-transparent bg-gradient-to-br bg-clip-text from-[#FF9FFC] to-[#a98fff] text-4xl font-bold flex items-center">
                    <CountUp
                        from={0}
                        to={5}
                        separator=","
                        direction="up"
                        duration={1}
                        className="count-up-text"
                        startCounting={false}
                    />
                    <h1>+</h1>
                    </div>
                    <h1 className="font-light">Kategori Lomba</h1>
                </div>
                <div className="w-1 h-auto bg-gradient-to-b from-white to-transparent"></div>
                    <div className="mentor flex flex-col gap-1 items-center">
                        <div className="mentor-num text-transparent bg-gradient-to-br bg-clip-text from-[#FF9FFC] to-[#a98fff] text-4xl font-bold flex items-center">
                            <CountUp
                                from={0}
                                to={89}
                                separator=","
                                direction="up"
                                duration={1}
                                className="count-up-text"
                                startCounting={false}
                            />
                            <h1>%</h1>
                        </div>
                        <h1 className="font-light">Win Rate</h1>
                    </div>
                </div>
            </div>
            <div className="mentor-content flex flex-col gap-20 items-center mb-40">
                <div>
                    <div className="flex flex-col items-center mb-10">
                        <p className="font-poppins font-bold text-4xl">
                            Business Case
                        </p>
                        <p className="text-[#B19EEF] font-bold text-xs ">
                            4 MENTOR
                        </p>
                    </div>
                    <div className="flex flex-row gap-7 items-center">
                        <div className="flex flex-wrap gap-4">
                            {businessCaseMentor.map((mentor, index) => (
                                <MentorCard
                                key={index}
                                name={mentor.name}
                                description={mentor.description}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <div>
                    <div className="flex flex-col items-center mb-10">
                        <p className="font-poppins font-bold text-4xl">
                            Debate
                        </p>
                        <p className="text-[#B19EEF] font-bold text-xs ">
                            3 MENTOR
                        </p>
                    </div>
                    <div className="flex flex-row gap-7 items-center">
                        <div className="flex flex-wrap gap-4">
                            {debateMentor.map((mentor, index) => (
                                <MentorCard
                                key={index}
                                name={mentor.name}
                                description={mentor.description}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <div>
                    <div className="flex flex-col items-center mb-10">
                        <p className="font-poppins font-bold text-4xl">
                            UI/UX
                        </p>
                        <p className="text-[#B19EEF] font-bold text-xs ">
                            2 MENTOR
                        </p>
                    </div>
                    <div className="flex flex-row gap-7 items-center">
                        <div className="flex flex-wrap gap-4">
                            {uiuxMentor.map((mentor, index) => (
                                <MentorCard
                                key={index}
                                name={mentor.name}
                                description={mentor.description}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <div>
                    <div className="flex flex-col items-center mb-10">
                        <p className="font-poppins font-bold text-4xl">
                            Hackathon
                        </p>
                        <p className="text-[#B19EEF] font-bold text-xs ">
                            1 MENTOR
                        </p>
                    </div>
                    <div className="flex flex-row gap-7 items-center">
                        <div className="flex flex-wrap gap-4">
                            {hackathonMentor.map((mentor, index) => (
                                <MentorCard
                                key={index}
                                name={mentor.name}
                                description={mentor.description}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <Footer />
    </div>
  );
}
