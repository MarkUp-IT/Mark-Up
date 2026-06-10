"use client";


import { Bell, Settings, Search, Calendar, Download, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState } from "react";
import Sidebar from "@/component/admin/sidebar";

export default function admin() {

    

    

    const data = [
        { day: "29/03", revenue: 400 },
        { day: "30/03", revenue: 300 },
        { day: "31/03", revenue: 600 },
        { day: "01/04", revenue: 500 },
        { day: "02/04", revenue: 300 },
        { day: "03/04", revenue: 500 },
    ];

    const logs = [
        {
            log_id: "#A001",
            username: "Nicco C. P.",
            role: "CIO",
            action: "Add Product #B0001",
            target_entity: "Products/Bootcamp",
            timestamp: "Oct 24, 2026 · 14:22",
            status: "PUBLISHED",
        },
        {
            log_id: "#U011",
            username: "Faisal A.",
            role: "Associate IT",
            action: "Edit Product #ME003",
            target_entity: "Products/Mentoring",
            timestamp: "Oct 24, 2026 · 11:05",
            status: "SCHEDULED",
        },
        {
            log_id: "#A101",
            username: "Muhammad A.",
            role: "Associate IT",
            action: "Add Competition #W001",
            target_entity: "Competition/UI_UX",
            timestamp: "Oct 23, 2026 · 09:25",
            status: "PUBLISHED",
        },
        {
            log_id: "#R121",
            username: "Affan F. D.",
            role: "Associate IT",
            action: "Remove Competition #H005",
            target_entity: "Competition/Hackathon",
            timestamp: "Oct 23, 2026 · 04:28",
            status: "REMOVED",
        },
    ];

    const [isActive , setIsActive] = useState("all");

    return (
        <div className="w-full font-inter text-black bg-white min-h-screen relative flex flex-row overflow-x-hidden">
            
            <Sidebar/>
            <div className=" flex-1 flex items-center ml-[288px] py-5 flex-col gap-5 px-10">
                <div className="w-[1158px] h-[72px] bg-[#E2E8F0] flex flex-row items-center justify-center gap-15">
                    <div className="flex gap-20">
                        <p className="text-black font-bold text-[20.25px]">
                            Dashboard
                        </p>
                        <div className="relative">
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                size={18}
                            />

                            <input
                                type="text"
                                placeholder="Search analytics..."
                                className="bg-white w-[511px] h-[36px] rounded-[6.75px] pl-10"
                            />
                        </div>

                    </div>
                    
                    <div className="flex flex-row gap-4">
                        <Bell color="#64748B"/>
                        <Settings color="#64748B"/>
                    </div>

                    <div className="flex flex-row gap-4">
                        <div className="flex flex-col ">
                            <p className="font-semibold text-[14.62px]">
                                Affan Fathir D.
                            </p>
                            <p className="text-[12.37px] text-[#64748B]">
                                Associate IT
                            </p>

                        </div>
                        <div className="bg-[#2B3034] w-[36px] h-[36px] rounded-[13.5px]">
                        </div>
                    </div>

                </div>

                <div className="flex flex-row items-center gap-45">
                    <div>
                        <p className="font-bold text-[25px]">
                            Dashboard Overview
                        </p>
                        <p className="text-[#43474D] text-[15px]">
                            Real-time performance metrics for MARK-UP products
                        </p>
                    </div>
                    <div className="flex flex-row gap-4">
                        <div className="w-[412px] h-[43.5px] bg-[#F0F4F8] rounded-[4.5px] flex justify-center items-center gap-1">
                            <button 
                            onClick={() => setIsActive("all")}
                            className={`px-2 h-[33.75px] rounded-[6.75px] ${isActive === "all" ? "bg-white" : ""}`}>
                                All Time
                            </button>
                            <button 
                            onClick={() => setIsActive("day")}
                            className={`px-2 h-[33.75px] rounded-[6.75px] ${isActive === "day" ? "bg-white" : ""}`}>
                                Day
                            </button>
                            <button 
                            onClick={() => setIsActive("week")}
                            className={`px-2 h-[33.75px] rounded-[6.75px] ${isActive === "week" ? "bg-white" : ""}`}>
                                Week
                            </button>
                            <button 
                            onClick={() => setIsActive("month")}
                            className={`px-2 h-[33.75px] rounded-[6.75px] ${isActive === "month" ? "bg-white" : ""}`}>
                                Month
                            </button>
                            <div className="relative">
                                <button
                                onClick={() => setIsActive("custom")} 
                                className={`w-[100px] h-[33.75px] pr-5 rounded-[6.75px] ${isActive === "custom" ? "bg-white" : ""}`}>
                                    Custom
                                </button>
                                <Calendar
                                className="absolute left-19 top-1/2 -translate-y-1/2"
                                size={18}
                                />
                            </div>

                        </div>
                        <div className="relative">
                            <Download 
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-white"
                            size={18}
                            />    
                            <button className="bg-[#2563EB] w-[163px] h-[43.5px] text-white font-semibold pl-5 rounded-[6.75px] hover:bg-[#2563EB]/80">
                                Export to PDF
                            </button>
                        </div>
                    </div>
                </div>
                <div className="w-full flex justify-center gap-7">
                    <div className="bg-[#FDFFE7] w-[370px] h-[146px] rounded-[9px] flex flex-col justify-center px-7">
                        <p className="text-[#43474D] font-bold text-[16px]">
                            PRIVATE MENTORING SALES
                        </p>
                        <div className="flex flex-row">
                            <p className="font-bold text-[43.87px]">19</p>
                            <span className="text-[#43474D] pt-8 pl-2">units</span>
                        </div>
                    </div>
                    <div className=" bg-[#E7FFFC] w-[370px] h-[146px] rounded-[9px] flex flex-col justify-center px-7">
                        <p className="text-[#43474D] font-bold text-[16px]">
                            INTENSIVE BOOTCAMP SALES
                        </p>
                        <div className="flex flex-row">
                            <p className="font-bold text-[43.87px]">1</p>
                            <span className="text-[#43474D] pt-8 pl-2">units</span>
                        </div>
                    </div>
                    <div className=" bg-[#FFE7FD] w-[370px] h-[146px] rounded-[9px] flex flex-col justify-center px-7">
                        <p className="text-[#43474D] font-bold text-[16px]">
                            E-LEARNING & MODUL SALES
                        </p>
                        <div className="flex flex-row">
                            <p className="font-bold text-[43.87px]">23</p>
                            <span className="text-[#43474D] pt-8 pl-2">units</span>
                        </div>
                    </div>
                </div>

                <div className="w-full flex justify-center gap-7">
                    <div className="w-[763px] h-[360px] bg-[#F1F5F9] rounded-[9px] px-5 py-5 flex flex-col">
                        <div className="flex flex-col">
                            <div className="flex flex-row w-full justify-between items-center ">
                                <p className="text-[12.37px] font-bold text-[#43474D]">
                                    TOTAL REVENUE
                                </p>
                                <div className="flex flex-row w-[100px] h-[30px] rounded-[13.5px] bg-[#C8D8F6] items-center justify-center gap-1">
                                    <TrendingUp className="text-[#2563EB]" size={18}/>
                                    <p className="font-bold text-[#2563EB]">
                                        +12.5%
                                    </p>
                                </div>
                            </div>
                            <p className="font-bold text-[45px]">
                                Rp284,912.00
                            </p>
                        </div>
                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                
                                <BarChart data={data}>

                                    <XAxis dataKey="day" />

                                    <YAxis hide/>

                                    <Tooltip />

                                    <Bar
                                        dataKey="revenue"
                                        radius={[2.25, 2.25, 0, 0]}
                                    >
                                        {data.map((entry, index) => (
                                        <Cell
                                            key={index}
                                            fill={
                                            index === data.length - 1
                                                ? "#2563EB" 
                                                : "#C8D8F6"
                                            }
                                        />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="flex flex-col gap-10">
                        <div className=" bg-[#E7FFE9] w-[370px] h-[146px] rounded-[9px] flex flex-col justify-center px-7">
                            <p className="text-[#43474D] font-bold text-[16px]">
                                TODAY SALES
                            </p>
                            <div className="flex flex-row">
                                <p className="font-bold text-[43.87px]">43</p>
                                <span className="text-[#43474D] pt-8 pl-2">units</span>
                            </div>
                        </div>
                        <div className=" w-[370px] h-[146px] rounded-[9px] flex flex-col justify-center px-7">
                            <p className="text-[#43474D] font-bold text-[16px]">
                                ACTIVE USERS
                            </p>
                            <div className="flex flex-row">
                                <p className="font-bold text-[43.87px]">42.8k</p>
                                <span className="text-[#43474D] pt-8 pl-2">online</span>
                            </div>
                        </div>
                        
                    </div>
                </div>
                <div className=" w-full flex flex-col ">
                    <div className="flex justify-between">
                        <p className="text-[18px]">
                            Audit Trail
                        </p>
                        <p className="text-[#2563EB] font-bold text-[14.62px]">
                            View All Logs
                        </p>
                    </div>
                    <p className="text-[#43474D]">
                        Review recent administrative activities across the platform.
                    </p>
                    <div className="rounded-[8px] overflow-hidden mt-5">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm ">
                                <thead className="bg-[#F0F4F8]">
                                    <tr>
                                        <th className="px-6 py-3 text-center">LOG ID</th>
                                        <th className="px-6 py-3 text-center">
                                            ADMIN USERNAME
                                            <br />
                                            ADMIN USERID
                                        </th>
                                        <th className="px-6 py-3 text-center">ACTION</th>
                                        <th className="px-6 py-3 text-center">TARGET ENTITY</th>
                                        <th className="px-6 py-3 text-center">TIMESTAMP</th>
                                        <th className="px-6 py-3 text-center">STATUS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F0F4F8]">
                                    {logs.map((item) =>(
                                        <tr key={item.log_id}>
                                            <td className="px-6 py-4 text-center">{item.log_id}</td>
                                            <td className="px-6 py-4 text-center">{item.username}</td>
                                            <td className="px-6 py-4 text-center">{item.action}</td>
                                            <td className="px-6 py-4 text-center">{item.target_entity}</td>
                                            <td className="px-6 py-4 text-center">{item.timestamp}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center justify-center px-3 py-1 text-xs rounded-[13.5px] font-bold ${
                                                    item.status === "PUBLISHED" ? "bg-[#D6FFD8] text-[#024816]"  
                                                    : item.status === "SCHEDULED" ? "bg-[#E0E9FF] text-[#00356D]"
                                                    : "bg-[#FFD6D7] text-[#480203]"
                                                    }`}>
                                                        {item.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>

                            </table>
                        </div>
                    </div>
                </div>
                    

            </div>
        </div>
    );
}