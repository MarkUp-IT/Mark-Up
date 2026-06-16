"use client";

import {
  Bell,
  Settings,
  Search,
  Plus,
  Download,
  PenLine,
  SquareArrowOutUpRight,
  X,
  CloudUpload,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect } from "react";
import Sidebar from "@/component/admin/sidebar";

export default function InfoLomba() {
  const competitions = [
    {
      competition_id: "#ME003",
      title: "KOPMAVATION 1.0 Business Plan Competition",
      organizer: "Kopma UMY",
      category: "Business Plan",
      status: "ACTIVE",
    },
    {
      competition_id: "#BO001",
      title: "LDBI ASFERA 2k26 (Lomba Debat Bahasa Indonesia)",
      organizer: "As-Syifa Boarding School Wanareja",
      category: "Debat",
      status: "EXPIRED",
    },
    {
      competition_id: "#MO001",
      title: "DreamCareer Mini Case Competition",
      organizer: "DreamCareer",
      category: "Business Case",
      status: "ACTIVE",
    },
    {
      competition_id: "#BO003",
      title: "DWDG BINUS X PWC X UNIQLO X MAD FOR MAKEU",
      organizer: "Binus University",
      category: "Business Case",
      status: "ACTIVE",
    },
  ];

  const [isCategoryActive, setIsCategoryActive] = useState("semua");
  const [isStatusActive, setIsStatusActive] = useState("semua");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState(null);

  useEffect(() => {
    if (isAddOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isAddOpen]);

  useEffect(() => {
    if (isEditOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isEditOpen]);

  return (
    <div className="w-full font-inter text-black bg-white min-h-screen relative flex flex-row overflow-x-hidden">
      <Sidebar />
      <div className="flex-1 flex items-center ml-[288px] py-5 flex-col gap-5 px-10">
        <div className="w-[1158px] h-[72px] bg-[#E2E8F0] flex flex-row items-center justify-center gap-15 rounded-[8px]">
          <div className="flex gap-20 items-center">
            <p className="text-black font-bold text-[20.25px]">
              Manajemen Lomba
            </p>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search competition..."
                className="bg-white w-[511px] h-[36px] rounded-[6.75px] pl-10 border-none outline-none focus:ring-2 focus:ring-[#2563EB]/20"
              />
            </div>
          </div>

          <div className="flex flex-row gap-4 items-center">
            <Bell color="#64748B" className="cursor-pointer hover:text-black" />
            <Settings
              color="#64748B"
              className="cursor-pointer hover:text-black"
            />
          </div>

          <div className="flex flex-row gap-4 items-center">
            <div className="flex flex-col text-right">
              <p className="font-semibold text-[14.62px]">Affan Fathir D.</p>
              <p className="text-[12.37px] text-[#64748B]">Associate IT</p>
            </div>
            <div className="bg-[#2B3034] w-[36px] h-[36px] rounded-[13.5px] flex items-center justify-center overflow-hidden">
              <img
                src="https://api.dicebear.com/7.x/notionists/svg?seed=Affan&backgroundColor=2B3034"
                alt="avatar"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-row items-center justify-between w-[1158px] mt-2">
          <div>
            <p className="font-bold text-[25px]">Info Lomba</p>
            <p className="text-[#43474D] text-[15px]">
              Kelola informasi info lomba pada website MARK-UP
            </p>
          </div>
          <div className="flex flex-row gap-4">
            <div className="relative">
              <Plus
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white pointer-events-none"
                size={18}
              />
              <button
                onClick={() => setIsAddOpen(true)}
                className="bg-[#2563EB] w-[190px] h-[43.5px] text-white font-semibold pl-6 rounded-[6.75px] hover:bg-[#2563EB]/80 transition-colors shadow-sm"
              >
                New Competitions
              </button>
            </div>
          </div>
        </div>

        <div className="w-[1158px] flex justify-between gap-5 mt-2">
          <div className="bg-[#EFE2C2] flex-1 h-[146px] rounded-[9px] flex flex-col justify-center px-7 shadow-sm">
            <p className="text-[#43474D] font-bold text-[14px] tracking-wide">
              TOTAL COMPETITIONS
            </p>
            <div className="flex flex-row items-baseline gap-2 mt-2">
              <p className="font-bold text-[48px] text-black leading-none">
                15
              </p>
              <span className="text-[#43474D] text-[16px] font-medium">
                competitions
              </span>
            </div>
          </div>
          <div className="bg-[#2563EB] flex-1 h-[146px] rounded-[9px] flex flex-col justify-center px-7 shadow-sm">
            <p className="text-white font-bold text-[14px] tracking-wide">
              ACTIVE
            </p>
            <div className="flex flex-row items-baseline gap-2 mt-2">
              <p className="font-bold text-[48px] text-white leading-none">
                12
              </p>
              <span className="text-white text-[16px] font-medium">
                competitions
              </span>
            </div>
          </div>
          <div className="bg-[#F0564A] flex-1 h-[146px] rounded-[9px] flex flex-col justify-center px-7 shadow-sm">
            <p className="text-white font-bold text-[14px] tracking-wide">
              EXPIRED
            </p>
            <div className="flex flex-row items-baseline gap-2 mt-2">
              <p className="font-bold text-[48px] text-white leading-none">3</p>
              <span className="text-white text-[16px] font-medium">
                competitions
              </span>
            </div>
          </div>
        </div>

        <div className="w-[1158px] flex flex-col mt-5">
          <div className="flex justify-between items-end">
            <div className="flex flex-col gap-1">
              <p className="text-[18px] font-semibold text-black">
                List Competitions
              </p>
              <p className="text-[#43474D] text-[14px]">
                List of MARK-UP competitions all time
              </p>
            </div>
            <p className="text-[#2563EB] font-bold text-[14.62px] cursor-pointer hover:underline">
              View All Products
            </p>
          </div>

          <div className="flex flex-row justify-between mt-6">
            <div className="flex flex-row gap-5">
              <div className="h-[43.5px] bg-[#F0F4F8] px-2 rounded-[6px] flex justify-center items-center gap-1 shadow-sm">
                <button
                  onClick={() => setIsCategoryActive("semua")}
                  className={`px-3 py-1.5 rounded-[4px] font-medium text-[13px] ${isCategoryActive === "semua" ? "bg-white text-black shadow-sm" : "text-[#43474D] hover:bg-[#E2E8F0]"}`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setIsCategoryActive("business-case")}
                  className={`px-3 py-1.5 rounded-[4px] font-medium text-[13px] ${isCategoryActive === "business-case" ? "bg-white text-black shadow-sm" : "text-[#43474D] hover:bg-[#E2E8F0]"}`}
                >
                  Business Case
                </button>
                <button
                  onClick={() => setIsCategoryActive("business-plan")}
                  className={`px-3 py-1.5 rounded-[4px] font-medium text-[13px] ${isCategoryActive === "business-plan" ? "bg-white text-black shadow-sm" : "text-[#43474D] hover:bg-[#E2E8F0]"}`}
                >
                  Business Plan
                </button>
                <button
                  onClick={() => setIsCategoryActive("debat")}
                  className={`px-3 py-1.5 rounded-[4px] font-medium text-[13px] ${isCategoryActive === "debat" ? "bg-white text-black shadow-sm" : "text-[#43474D] hover:bg-[#E2E8F0]"}`}
                >
                  Debat
                </button>
                <button
                  onClick={() => setIsCategoryActive("lkti")}
                  className={`px-3 py-1.5 rounded-[4px] font-medium text-[13px] ${isCategoryActive === "lkti" ? "bg-white text-black shadow-sm" : "text-[#43474D] hover:bg-[#E2E8F0]"}`}
                >
                  LKTI
                </button>
                <button
                  onClick={() => setIsCategoryActive("ui-ux")}
                  className={`px-3 py-1.5 rounded-[4px] font-medium text-[13px] ${isCategoryActive === "ui-ux" ? "bg-white text-black shadow-sm" : "text-[#43474D] hover:bg-[#E2E8F0]"}`}
                >
                  UI/UX
                </button>
                <button
                  onClick={() => setIsCategoryActive("hackathon")}
                  className={`px-3 py-1.5 rounded-[4px] font-medium text-[13px] ${isCategoryActive === "hackathon" ? "bg-white text-black shadow-sm" : "text-[#43474D] hover:bg-[#E2E8F0]"}`}
                >
                  Hackathon
                </button>
              </div>
              <div className="h-[43.5px] bg-[#F0F4F8] px-2 rounded-[6px] flex justify-center items-center gap-1 shadow-sm">
                <button
                  onClick={() => setIsStatusActive("semua")}
                  className={`px-3 py-1.5 rounded-[4px] font-medium text-[13px] ${isStatusActive === "semua" ? "bg-white text-black shadow-sm" : "text-[#43474D] hover:bg-[#E2E8F0]"}`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setIsStatusActive("active")}
                  className={`px-3 py-1.5 rounded-[4px] font-medium text-[13px] ${isStatusActive === "active" ? "bg-white text-black shadow-sm" : "text-[#43474D] hover:bg-[#E2E8F0]"}`}
                >
                  Active
                </button>
                <button
                  onClick={() => setIsStatusActive("expired")}
                  className={`px-3 py-1.5 rounded-[4px] font-medium text-[13px] ${isStatusActive === "expired" ? "bg-white text-black shadow-sm" : "text-[#43474D] hover:bg-[#E2E8F0]"}`}
                >
                  Expired
                </button>
              </div>
            </div>
            <div className="relative flex items-center">
              <Download
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#43474D]"
                size={15}
              />
              <button className="w-[130px] h-[43.5px] bg-[#F0F4F8] text-[13px] pl-6 pr-2 font-medium rounded-[6px] hover:bg-[#E2E8F0] shadow-sm transition-colors text-[#43474D]">
                Export .CSV
              </button>
            </div>
          </div>

          <div className="rounded-[8px] overflow-hidden mt-6 border border-[#E2E8F0] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                      COMPETITION ID
                    </th>
                    <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                      COMPETITION TITLE
                    </th>
                    <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                      ORGANIZER
                    </th>
                    <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                      CATEGORY
                    </th>
                    <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                      STATUS
                    </th>
                    <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] bg-white">
                  {competitions.map((item, index) => (
                    <tr
                      key={index}
                      className="hover:bg-[#F8FAFC] transition-colors"
                    >
                      <td className="px-6 py-5 text-center text-[#64748B] font-medium">
                        {item.competition_id}
                      </td>
                      <td className="px-6 py-5 text-center text-[#1E293B] font-semibold max-w-[250px] break-words">
                        {item.title}
                      </td>
                      <td className="px-6 py-5 text-center text-[#43474D] font-medium">
                        {item.organizer}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="inline-flex items-center justify-center px-3 py-1.5 text-[12px] rounded-[6px] font-semibold bg-[#F1F5F9] text-[#475569]">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span
                          className={`inline-flex items-center justify-center px-4 py-1.5 text-[12px] rounded-full font-bold ${
                            item.status === "ACTIVE"
                              ? "bg-[#DCFCE7] text-[#166534]"
                              : "bg-[#FEE2E2] text-[#991B1B]"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex flex-row items-center justify-center gap-4">
                          <PenLine
                            size={18}
                            onClick={() => {
                              setSelectedCompetition(item);
                              setIsEditOpen(true);
                            }}
                            className="cursor-pointer text-[#64748B] hover:text-[#2563EB] transition-colors"
                          />
                          <SquareArrowOutUpRight
                            className="cursor-pointer text-[#64748B] hover:text-[#2563EB] transition-colors"
                            size={18}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-center items-center mt-6 mb-10 gap-2 text-[#64748B] text-[14px]">
            <span className="w-8 h-8 flex items-center justify-center bg-white border border-[#2563EB] text-[#2563EB] font-bold rounded-md cursor-pointer hover:bg-[#EFF6FF] shadow-sm">
              1
            </span>
            <span className="w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded-md font-medium">
              2
            </span>
            <span className="w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded-md font-medium">
              3
            </span>
            <span className="font-medium tracking-widest">...</span>
            <span className="w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded-md font-medium">
              12
            </span>
          </div>
        </div>
      </div>

      {isAddOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsAddOpen(false)}
        />
      )}

      <div
        className={`
                fixed top-0 right-0 h-screen w-[600px]
                bg-white shadow-2xl z-50
                transition-transform duration-300 ease-in-out
                flex flex-col
                overflow-y-auto
                ${isAddOpen ? "translate-x-0" : "translate-x-full"}
            `}
      >
        <div className="w-full h-[120px] shrink-0 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col justify-center px-10 gap-1">
          <div className="flex flex-row w-full justify-between items-center">
            <p className="text-[#1E293B] text-[20px] font-bold">
              New Competitions
            </p>
            <button
              onClick={() => setIsAddOpen(false)}
              className="p-2 hover:bg-[#E2E8F0] rounded-full transition-colors"
            >
              <X className="cursor-pointer text-[#64748B]" size={20} />
            </button>
          </div>
          <p className="text-[#64748B] text-[14px]">
            Fill in the details to post a new competition info.
          </p>
        </div>

        <div className="px-10 py-8 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
              COMPETITION POSTER
            </p>
            <div className="bg-[#F8FAFC] w-full h-[180px] rounded-[8px] flex flex-col items-center justify-center border-2 border-dashed border-[#CBD5E1] hover:bg-[#F1F5F9] hover:border-[#94A3B8] transition-all cursor-pointer">
              <div className="bg-white rounded-[12px] w-[56px] h-[56px] flex justify-center items-center mb-3 shadow-sm border border-[#E2E8F0]">
                <CloudUpload size={24} className="text-[#2563EB]" />
              </div>
              <p className="text-[#1E293B] font-semibold text-[15px] mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-[#64748B] text-[13px]">(Max 5MB)</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
              COMPETITION TITLE
            </p>
            <input
              type="text"
              placeholder="Enter competition title..."
              className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B] placeholder:text-[#94A3B8]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
              COMPETITION ORGANIZER
            </p>
            <input
              type="text"
              placeholder="Enter competition organizer..."
              className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B] placeholder:text-[#94A3B8]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
              CATEGORY
            </p>
            <div className="relative w-full">
              <select
                className="
                                w-full h-[48px]
                                bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px]
                                px-4 pr-10
                                appearance-none outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B]
                                "
              >
                <option>Business Case</option>
                <option>Business Plan</option>
                <option>Debat</option>
                <option>LKTI</option>
                <option>UI/UX</option>
                <option>Hackathon</option>
              </select>
              <ChevronDown
                size={18}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
              COMPETITION LEVEL
            </p>
            <input
              type="text"
              placeholder='"Surabaya", "Nasional", "Internasional"'
              className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B] placeholder:text-[#94A3B8]"
            />
          </div>

          <div className="flex gap-4 w-full">
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
                EVENT DATE
              </p>
              <input
                type="date"
                className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B]"
              />
            </div>

            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
                REGISTRATION DEADLINE
              </p>
              <input
                type="date"
                className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
              TARGET PARTICIPANTS
            </p>
            <input
              type="text"
              placeholder='"Mahasiswa Aktif S1", "Siswa SMA"'
              className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B] placeholder:text-[#94A3B8]"
            />
          </div>

          <div className="flex gap-4 w-full">
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
                PRIZEPOOL
              </p>
              <input
                type="text"
                placeholder="Rp 0"
                className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B] placeholder:text-[#94A3B8]"
              />
            </div>

            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
                REGISTRATION FEE
              </p>
              <input
                type="text"
                placeholder="Rp 0"
                className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B] placeholder:text-[#94A3B8]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
              REGISTRATION LINK (URL)
            </p>
            <input
              type="url"
              placeholder="https://..."
              className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B] placeholder:text-[#94A3B8]"
            />
          </div>
        </div>

        <div className="mt-auto p-6 bg-white border-t border-[#E2E8F0] flex gap-4">
          <button
            onClick={() => setIsAddOpen(false)}
            className="flex-1 py-3 bg-white border border-[#CBD5E1] text-[#475569] font-bold rounded-[8px] hover:bg-[#F8FAFC] transition-colors"
          >
            Discard Draft
          </button>
          <button className="flex-1 py-3 bg-[#2563EB] text-white font-bold rounded-[8px] hover:bg-[#1D4ED8] transition-colors shadow-sm">
            Publish Competition
          </button>
        </div>
      </div>

      {isEditOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsEditOpen(false)}
        />
      )}

      <div
        className={`
                fixed top-0 right-0 h-screen w-[600px]
                bg-white shadow-2xl z-50
                transition-transform duration-300 ease-in-out
                flex flex-col
                overflow-y-auto
                ${isEditOpen ? "translate-x-0" : "translate-x-full"}
            `}
      >
        <div className="w-full h-[120px] shrink-0 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col justify-center px-10 gap-1">
          <div className="flex flex-row w-full justify-between items-center">
            <p className="text-[#1E293B] text-[20px] font-bold">
              Edit Competition
            </p>
            <button
              onClick={() => setIsEditOpen(false)}
              className="p-2 hover:bg-[#E2E8F0] rounded-full transition-colors"
            >
              <X className="cursor-pointer text-[#64748B]" size={20} />
            </button>
          </div>
          <p className="text-[#64748B] text-[14px]">
            Edit the details to update this competition info.
          </p>
        </div>

        <div
          key={selectedCompetition?.competition_id}
          className="px-10 py-8 flex flex-col gap-6"
        >
          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
              COMPETITION POSTER
            </p>
            <div className="bg-[#F8FAFC] w-full h-[180px] rounded-[8px] flex flex-col items-center justify-center border-2 border-dashed border-[#CBD5E1] hover:bg-[#F1F5F9] hover:border-[#94A3B8] transition-all cursor-pointer">
              <div className="bg-white rounded-[12px] w-[56px] h-[56px] flex justify-center items-center mb-3 shadow-sm border border-[#E2E8F0]">
                <CloudUpload size={24} className="text-[#2563EB]" />
              </div>
              <p className="text-[#1E293B] font-semibold text-[15px] mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-[#64748B] text-[13px]">(Max 5MB)</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
              COMPETITION TITLE
            </p>
            <input
              type="text"
              defaultValue={selectedCompetition?.title || ""}
              placeholder="Enter competition title..."
              className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
              COMPETITION ORGANIZER
            </p>
            <input
              type="text"
              defaultValue={selectedCompetition?.organizer || ""}
              placeholder="Enter competition organizer..."
              className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
              CATEGORY
            </p>
            <div className="relative w-full">
              <select
                defaultValue={selectedCompetition?.category || "Business Case"}
                className="
                                w-full h-[48px]
                                bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px]
                                px-4 pr-10
                                appearance-none outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B]
                                "
              >
                <option>Business Case</option>
                <option>Business Plan</option>
                <option>Debat</option>
                <option>LKTI</option>
                <option>UI/UX</option>
                <option>Hackathon</option>
              </select>
              <ChevronDown
                size={18}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
              COMPETITION LEVEL
            </p>
            <input
              type="text"
              placeholder='"Surabaya", "Nasional", "Internasional"'
              className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B]"
            />
          </div>

          <div className="flex gap-4 w-full">
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
                EVENT DATE
              </p>
              <input
                type="date"
                className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B]"
              />
            </div>

            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
                REGISTRATION DEADLINE
              </p>
              <input
                type="date"
                className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
              TARGET PARTICIPANTS
            </p>
            <input
              type="text"
              placeholder='"Mahasiswa Aktif S1", "Siswa SMA"'
              className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B]"
            />
          </div>

          <div className="flex gap-4 w-full">
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
                PRIZEPOOL
              </p>
              <input
                type="text"
                placeholder="Rp 0"
                className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B]"
              />
            </div>

            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
                REGISTRATION FEE
              </p>
              <input
                type="text"
                placeholder="Rp 0"
                className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
              REGISTRATION LINK (URL)
            </p>
            <input
              type="url"
              placeholder="https://..."
              className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B]"
            />
          </div>
        </div>

        <div className="mt-auto p-6 bg-white border-t border-[#E2E8F0] flex gap-4">
          <button
            onClick={() => setIsEditOpen(false)}
            className="flex-1 py-3 bg-white border border-[#CBD5E1] text-[#475569] font-bold rounded-[8px] hover:bg-[#F8FAFC] transition-colors"
          >
            Discard Changes
          </button>
          <button className="flex-1 py-3 bg-[#2563EB] text-white font-bold rounded-[8px] hover:bg-[#1D4ED8] transition-colors shadow-sm">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
