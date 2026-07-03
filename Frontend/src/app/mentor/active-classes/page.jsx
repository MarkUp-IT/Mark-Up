"use client";

import { useState, useEffect } from "react";
import { X, Video, Clock, Calendar as CalendarIcon, User } from "lucide-react";
import Sidebar from "@/component/mentor/Sidebar";
import Header from "@/component/mentor/Header";

export default function MentorDashboard() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedBootcamp, setSelectedBootcamp] = useState(null);
  const [selectedMentoring, setSelectedMentoring] = useState(null);

  useEffect(() => {
    if (selectedBootcamp || selectedMentoring) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [selectedBootcamp, selectedMentoring]);

  // --- MOCK DATA ---
  const bootcampClasses = [
    {
      id: "BC-001",
      title: "Winner Class Dan Module (Debate)",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor.",
      currentSession: 5,
      totalSessions: 8,
      sessions: [
        {
          id: 2,
          title: "Introduction to Startup Ecosystem",
          date: "Jul 6, 2026 - 10:00 AM",
          status: "completed",
        },
        {
          id: 3,
          title: "Ideation & Value Proposition",
          date: "Jul 6, 2026 - 10:00 AM",
          status: "completed",
        },
        {
          id: 4,
          title: "Market Research & Validation",
          date: "Jul 6, 2026 - 10:00 AM",
          status: "completed",
        },
        {
          id: 5,
          title: "Market Research & Validation",
          date: "Jul 6, 2026 - 10:00 AM",
          status: "active",
        },
        {
          id: 6,
          title: "Market Research & Validation",
          date: "Jul 6, 2026 - 10:00 AM",
          status: "locked",
        },
      ],
    },
    {
      id: "BC-002",
      title: "Frontend Engineering Sprint",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor.",
      currentSession: 2,
      totalSessions: 6,
      sessions: [
        {
          id: 1,
          title: "HTML & CSS Fundamentals",
          date: "Jul 2, 2026 - 08:00 AM",
          status: "completed",
        },
        {
          id: 2,
          title: "React JS Deep Dive",
          date: "Jul 9, 2026 - 08:00 AM",
          status: "active",
        },
        {
          id: 3,
          title: "Next JS Framework",
          date: "Jul 16, 2026 - 08:00 AM",
          status: "locked",
        },
      ],
    },
  ];

  const mentoringClasses = [
    {
      id: "MT-001",
      packageTitle: "Winner Class Dan Module (Debate)",
      menteeName: "Affan Fathir D.",
      date: "Jul 12, 2026",
      time: "14:00 - 15:00 WIB",
      zoomLink: "https://zoom.us/j/1234567890",
      status: "upcoming",
      notes:
        "Student wants to discuss advanced validation strategies and startup pitching.",
    },
    {
      id: "MT-002",
      packageTitle: "1-on-1 Career Mentoring",
      menteeName: "Sarah Jenkins",
      date: "Jul 14, 2026",
      time: "10:00 - 11:30 WIB",
      zoomLink: "https://zoom.us/j/0987654321",
      status: "upcoming",
      notes: "Reviewing resume and preparing for technical interviews.",
    },
  ];

  const renderSessionButton = (status) => {
    switch (status) {
      case "completed":
        return (
          <button className="px-5 py-2 bg-[#2D3748] text-[#A0AEC0] text-[13px] font-medium rounded-[6px] cursor-not-allowed">
            Completed
          </button>
        );
      case "active":
        return (
          <button className="px-5 py-2 bg-[#148F89] text-white text-[13px] font-bold rounded-[6px] hover:bg-[#10756F] transition-colors shadow-sm">
            Join Session
          </button>
        );
      case "locked":
        return (
          <button className="px-5 py-2 bg-[#2D3748] text-[#A0AEC0] text-[13px] font-medium rounded-[6px] cursor-not-allowed">
            Room Unavailable
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full font-inter text-white bg-[#0F081C] min-h-screen relative flex flex-row overflow-x-hidden">
      <Sidebar />
      <div className="ml-[288px] flex-1 flex flex-col absolute">
        <Header pageTitle="Active Classes" />

        {/* Main Content Area mirroring Admin's `flex-1 flex items-center py-5 flex-col gap-5 px-10` */}
        <div className="flex-1 flex items-center py-5 flex-col gap-5 px-10 bg-[#0F081C]">
          {/* Title Area */}
          <div className="flex flex-col w-[1158px] mt-2 gap-1">
            <p className="font-bold text-[25px]">Active Classes Overview</p>
            <p className="text-[#9CA3AF] text-[15px]">
              Manage your active classes and upcoming mentoring sessions.
            </p>
          </div>

          {/* Stats Cards Section (Matched h-[140px], rounded-[9px], px-7) */}
          <div className="w-[1158px] grid grid-cols-3 gap-5 mt-2">
            <div className="bg-[#170F26] h-[140px] rounded-[9px] flex flex-col justify-center px-7 shadow-sm border border-[#2D2342] relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#148F89]/10 rounded-full blur-2xl"></div>
              <p className="text-[#9CA3AF] font-bold text-[14px] tracking-wide uppercase">
                WELCOME BACK
              </p>
              <div className="flex flex-col mt-2">
                <p className="font-bold text-[28px] text-white leading-tight">
                  Hi Prabroro!
                </p>
                <span className="text-[#A0AEC0] text-[13px] font-medium mt-1">
                  Ready for your next session?
                </span>
              </div>
            </div>

            <div className="bg-[#170F26] h-[140px] rounded-[9px] flex flex-col justify-center px-7 shadow-sm border border-[#2D2342]">
              <p className="text-[#9CA3AF] font-bold text-[14px] tracking-wide uppercase">
                TOTAL NEXT CLASSES
              </p>
              <div className="flex flex-row items-baseline gap-2 mt-2">
                <p className="font-bold text-[40px] text-[#148F89] leading-none">
                  6
                </p>
                <span className="text-[#9CA3AF] text-[15px] font-medium lowercase">
                  sessions
                </span>
              </div>
            </div>

            <div className="bg-[#170F26] h-[140px] rounded-[9px] flex flex-col justify-center px-7 shadow-sm border border-[#2D2342]">
              <p className="text-[#9CA3AF] font-bold text-[14px] tracking-wide uppercase">
                TOTAL COMPLETED
              </p>
              <div className="flex flex-row items-baseline gap-2 mt-2">
                <p className="font-bold text-[40px] text-[#148F89] leading-none">
                  3
                </p>
                <span className="text-[#9CA3AF] text-[15px] font-medium lowercase">
                  classes
                </span>
              </div>
            </div>
          </div>

          {/* Filters matched to Admin's rounded-[4px] and h-[43.5px] styling */}
          <div className="w-[1158px] flex flex-row items-center justify-between mt-4">
            <p className="font-bold text-[18px] text-white">
              My Active Classes
            </p>
            <div className="h-[43.5px] bg-[#170F26] border border-[#2D2342] px-2 rounded-[6px] flex justify-center items-center gap-1 shadow-sm shrink-0">
              {["all", "bootcamp", "mentoring"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`px-4 py-1.5 rounded-[4px] font-medium text-[13px] transition-all capitalize ${
                    activeFilter === tab
                      ? "bg-[#2D1B4E] text-white shadow-sm"
                      : "text-[#A0AEC0] hover:bg-[#2D2342]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* --- BOOTCAMP SECTION --- */}
          {(activeFilter === "all" || activeFilter === "bootcamp") && (
            <div className="flex flex-col gap-4 w-[1158px] mt-2">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`w-[3px] md:w-1 h-5 md:h-6 rounded-full bg-[#00C6D1]`}
                ></div>
                <h1 className="font-semibold">Intensive Bootcamp</h1>
              </div>
              <div className="grid grid-cols-3 gap-5">
                {bootcampClasses.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col rounded-[9px] overflow-hidden cursor-pointer group shadow-sm border border-[#2D2342] hover:border-[#4C1D95] transition-colors"
                    onClick={() => setSelectedBootcamp(item)}
                  >
                    <div className="h-[120px] bg-gradient-to-br from-[#4C1D95] to-[#0D9488] relative">
                      <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                        <p className="text-[11px] font-bold text-white tracking-wider">
                          SESSION {item.currentSession} / {item.totalSessions}
                        </p>
                      </div>
                    </div>
                    <div className="bg-[#170F26] p-5 flex flex-col flex-1">
                      <h4 className="font-bold text-[16px] text-white leading-snug group-hover:text-[#148F89] transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[#9CA3AF] text-[13px] mt-2 leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- PRIVATE MENTORING SECTION --- */}
          {(activeFilter === "all" || activeFilter === "mentoring") && (
            <div className="flex flex-col gap-4 w-[1158px] mt-2">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`w-[3px] md:w-1 h-5 md:h-6 rounded-full bg-[#D1D83E]`}
                ></div>
                <h1 className="font-semibold">Private Mentoring</h1>
              </div>
              <div className="grid grid-cols-3 gap-5">
                {mentoringClasses.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col rounded-[9px] overflow-hidden cursor-pointer group shadow-sm border border-[#2D2342] hover:border-[#FBBF24]/50 transition-colors"
                    onClick={() => setSelectedMentoring(item)}
                  >
                    <div className="h-[120px] bg-gradient-to-br from-[#4C1D95] to-[#2563EB]"></div>
                    <div className="bg-[#170F26] p-5 flex flex-col flex-1 gap-3">
                      <h4 className="font-bold text-[16px] text-white leading-snug group-hover:text-[#FBBF24] transition-colors line-clamp-2">
                        {item.packageTitle}
                      </h4>
                      <div className="flex flex-col gap-2 mt-1">
                        <div className="flex items-center gap-2 text-[#CBD5E1]">
                          <User size={14} className="text-[#FBBF24]" />
                          <span className="text-[12px] font-medium">
                            {item.menteeName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[#CBD5E1]">
                          <CalendarIcon size={14} className="text-[#FBBF24]" />
                          <span className="text-[12px]">{item.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#CBD5E1]">
                          <Clock size={14} className="text-[#FBBF24]" />
                          <span className="text-[12px]">{item.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="h-10"></div>
        </div>
      </div>

      {/* --- MODALS --- */}
      {selectedBootcamp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedBootcamp(null)}
          ></div>
          <div className="relative bg-[#170F26] w-full max-w-[800px] max-h-[85vh] rounded-[16px] border border-[#2D2342] flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
            <div className="px-8 py-6 border-b border-[#2D2342] flex justify-between items-start bg-[#120B1C] rounded-t-[16px]">
              <div className="flex flex-col gap-1 pr-6">
                <h2 className="text-[20px] font-bold text-white">
                  {selectedBootcamp.title}
                </h2>
                <p className="text-[#9CA3AF] text-[14px]">
                  Manage and access all available sessions.
                </p>
              </div>
              <button
                onClick={() => setSelectedBootcamp(null)}
                className="p-2 bg-[#2D2342] text-[#A0AEC0] hover:text-white rounded-[8px] transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-8 overflow-y-scroll no-scrollbar flex flex-col gap-4 overflow-y-auto custom-scrollbar">
              {selectedBootcamp.sessions.map((session) => (
                <div
                  key={session.id}
                  className={`flex flex-row items-center justify-between p-5 rounded-[9px] border ${session.status === "active" ? "border-[#148F89] bg-[#148F89]/5" : "border-[#2D2342] bg-[#1A1128]"}`}
                >
                  <div className="flex items-center gap-6">
                    <div className="w-[80px]">
                      <span className="text-[#E2E8F0] font-bold text-[14px] tracking-wide">
                        SESSION {session.id}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span
                        className={`font-bold text-[15px] ${session.status === "active" ? "text-white" : "text-[#E2E8F0]"}`}
                      >
                        {session.title}
                      </span>
                      <span className="text-[#9CA3AF] text-[13px]">
                        {session.date}
                      </span>
                    </div>
                  </div>
                  <div>{renderSessionButton(session.status)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedMentoring && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedMentoring(null)}
          ></div>
          <div className="relative bg-[#170F26] w-[550px] rounded-[16px] border border-[#2D2342] flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
            <div className="px-8 py-6 border-b border-[#2D2342] flex justify-between items-start bg-[#120B1C] rounded-t-[16px]">
              <div className="flex flex-col gap-1">
                <h2 className="text-[20px] font-bold text-white">
                  Mentoring Session
                </h2>
                <p className="text-[#148F89] text-[14px] font-semibold">
                  {selectedMentoring.packageTitle}
                </p>
              </div>
              <button
                onClick={() => setSelectedMentoring(null)}
                className="p-2 bg-[#2D2342] text-[#A0AEC0] hover:text-white rounded-[8px] transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-8 flex flex-col gap-6">
              <div className="flex items-center gap-4 bg-[#1A1128] border border-[#2D2342] p-4 rounded-[9px]">
                <div className="w-12 h-12 bg-gradient-to-tr from-[#FBBF24] to-[#F59E0B] rounded-[11.5px] flex items-center justify-center text-white font-bold text-lg">
                  {selectedMentoring.menteeName.charAt(0)}
                </div>
                <div className="flex flex-col">
                  <span className="text-[#9CA3AF] text-[12px] uppercase tracking-wider font-bold">
                    Mentee
                  </span>
                  <span className="text-white text-[15px] font-semibold">
                    {selectedMentoring.menteeName}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[#64748B] text-[12px] font-bold uppercase tracking-wider">
                    Date
                  </span>
                  <div className="flex items-center gap-2 text-white font-medium bg-[#1A1128] border border-[#2D2342] px-4 py-2.5 rounded-[6px] text-[13px]">
                    <CalendarIcon size={16} className="text-[#FBBF24]" />
                    {selectedMentoring.date}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[#64748B] text-[12px] font-bold uppercase tracking-wider">
                    Time
                  </span>
                  <div className="flex items-center gap-2 text-white font-medium bg-[#1A1128] border border-[#2D2342] px-4 py-2.5 rounded-[6px] text-[13px]">
                    <Clock size={16} className="text-[#FBBF24]" />
                    {selectedMentoring.time}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[#64748B] text-[12px] font-bold uppercase tracking-wider">
                  Session Notes
                </span>
                <p className="text-[#E2E8F0] bg-[#1A1128] border border-[#2D2342] p-4 rounded-[6px] text-[13px] leading-relaxed">
                  `{selectedMentoring.notes}`
                </p>
              </div>
              <div className="mt-4 pt-6 border-t border-[#2D2342]">
                <a
                  href={selectedMentoring.zoomLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#148F89] hover:bg-[#10756F] text-[13px] text-white font-bold rounded-[6px] transition-colors shadow-sm"
                >
                  <Video size={18} /> Join Zoom Meeting
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
