"use client";


import { Bell, Settings, Search, Plus, TrendingUp, Download, Eye, PenLine, SquareArrowOutUpRight, X, CloudUpload, ChevronDown, CalendarDays } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState, useEffect } from "react";
import Sidebar from "@/component/admin/sidebar";

export default function produk() {

    

    

    const data = [
        { product: "PRIVATE MENTORING", revenue: 200 },
        { product: "INTENSIVE BOOTCAMP", revenue: 700 },
        { product: "E-LEARNING & MODUL", revenue: 300 },
        
    ];

    const products = [
        {
            product_id: "#ME003",
            title: "101 Career Mentoring",
            price: "Rp110.000",
            category: "Mentoring",
            status: "ACTIVE",
            sold: 12,
        },
        {
            product_id: "#BO001",
            title: "Essential Sprint Registration",
            price: "Rp110.000",
            category: "Bootcamp",
            status: "DEACTIVE",
            sold: 5,
        },
        {
            product_id: "#MO001",
            title: "Full-Throttle Coaching",
            price: "Rp110.000",
            category: "Module",
            status: "DEACTIVE",
            sold: 8,
        },
        {
            product_id: "#BO003",
            title: "Bundling PowerPack (Newbie Friendly)",
            price: "Rp110.000",
            category: "Bootcamp",
            status: "ACTIVE",
            sold: 10,
        },
    ];

    const [isActive , setIsActive] = useState("semua");
    const [aktif , setAktif] = useState("semua");
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }

        return () => {
            document.body.style.overflow = "auto";
        };
    }, [isOpen]);

    return (
        <div className="w-full font-inter text-black bg-white min-h-screen relative flex flex-row overflow-x-hidden">
            
            <Sidebar/>
            <div className=" flex-1 flex items-center ml-[288px] py-5 flex-col gap-5 px-10">
                <div className="w-[1158px] h-[72px] bg-[#E2E8F0] flex flex-row items-center justify-center gap-15">
                    <div className="flex gap-20">
                        <p className="text-black font-bold text-[20.25px]">
                            Manajemen Produk
                        </p>
                        <div className="relative">
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                size={18}
                            />

                            <input
                                type="text"
                                placeholder="Search products..."
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

                <div className="flex flex-row items-center justify-between w-full">
                    <div>
                        <p className="font-bold text-[25px]">
                            Products Catalog
                        </p>
                        <p className="text-[#43474D] text-[15px]">
                            Manage MARK-UP bootcamps, modules, and mentoring sessions from a unified interface.
                        </p>
                    </div>
                    <div className="flex flex-row gap-4">
                        
                        <div className="relative">
                            <Plus 
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-white"
                            size={18}
                            />    
                            <button 
                            onClick={() => setIsOpen(true)}
                            className="bg-[#2563EB] w-[163px] h-[43.5px] text-white font-semibold pl-5 rounded-[6.75px] hover:bg-[#2563EB]/80">
                                New Product
                            </button>
                        </div>
                    </div>
                </div>
                <div className="w-full flex justify-between ">
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
                                
                                <BarChart data={data} barCategoryGap={5}>

                                    <XAxis dataKey="product" />

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
                                            index === 0
                                                ? "#FFEE00" 
                                            : index === 1
                                                ? "#2563EB"
                                            : "#A301A2"
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
                                ACTIVE PRODUCTS NOW
                            </p>
                            <div className="flex flex-row">
                                <p className="font-bold text-[43.87px]">32</p>
                                <span className="text-[#43474D] pt-8 pl-2">products</span>
                            </div>
                        </div>
                        <div className=" w-[370px] h-[146px] rounded-[9px] flex flex-col justify-center px-7">
                            <p className="text-[#43474D] font-bold text-[16px]">
                                TOTAL PRODUCTS ALL TIME
                            </p>
                            <div className="flex flex-row">
                                <p className="font-bold text-[43.87px]">1.28k</p>
                                <span className="text-[#43474D] pt-8 pl-2">products</span>
                            </div>
                        </div>
                        
                    </div>
                </div>
                <div className=" w-full flex flex-col">
                    <div className="flex justify-between">
                        <p className="text-[18px]">
                            List Products
                        </p>
                        <p className="text-[#2563EB] font-bold text-[14.62px]">
                            View All Products
                        </p>
                    </div>
                    <p className="text-[#43474D]">
                        List of MARK-UP products all time
                    </p>
                    <div className='flex flex-row justify-between mt-5'>
                        <div className='flex flex-row gap-5'>
                            <div className="w-[370px] h-[43.5px] bg-[#F0F4F8] rounded-[4.5px] flex justify-center items-center gap-1">
                                <button 
                                onClick={() => setIsActive("semua")}
                                className={`px-2 h-[33.75px] rounded-[6.75px] font-medium text-[#43474D] ${isActive === "semua" ? "bg-white text-black" : ""}`}>
                                    Semua
                                </button>
                                <button 
                                onClick={() => setIsActive("mentoring")}
                                className={`px-2 h-[33.75px] rounded-[6.75px] font-medium text-[#43474D] ${isActive === "mentoring" ? "bg-white text-black" : ""}`}>
                                    Mentoring
                                </button>
                                <button 
                                onClick={() => setIsActive("bootcamp")}
                                className={`px-2 h-[33.75px] rounded-[6.75px] font-medium text-[#43474D] ${isActive === "bootcamp" ? "bg-white text-black" : ""}`}>
                                    Bootcamp
                                </button>
                                <button 
                                onClick={() => setIsActive("module")}
                                className={`px-2 h-[33.75px] rounded-[6.75px] font-medium text-[#43474D] ${isActive === "module" ? "bg-white text-black" : ""}`}>
                                    Module
                                </button>
                            </div>
                            <div className="w-[270px] h-[43.5px] bg-[#F0F4F8] rounded-[4.5px] flex justify-center items-center gap-1">
                                <button 
                                onClick={() => setAktif("semua")}
                                className={`px-2 h-[33.75px] rounded-[6.75px] font-medium text-[#43474D] ${aktif === "semua" ? "bg-white text-black" : ""}`}>
                                    Semua
                                </button>
                                <button 
                                onClick={() => setAktif("active")}
                                className={`px-2 h-[33.75px] rounded-[6.75px] font-medium text-[#43474D] ${aktif === "active" ? "bg-white text-black" : ""}`}>
                                    Active
                                </button>
                                <button 
                                onClick={() => setAktif("deactivate")}
                                className={`px-2 h-[33.75px] rounded-[6.75px] font-medium text-[#43474D] ${aktif === "deactivate" ? "bg-white text-black" : ""}`}>
                                    Deactivate
                                </button>
                            </div>
                        </div>
                        <div className='relative flex items-center'>
                            <Download 
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-black "
                            size={15}
                            />  
                            <button className='w-[121px] h-[35px] bg-[#F0F4F8] text-[12px] pl-5 font-medium rounded-[4px] hover:bg-[#E8E8E9]'>
                                Export .CSV
                            </button>
                        </div>
                    </div>
                    <div className="rounded-[8px] overflow-hidden mt-5">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm ">
                                <thead className="bg-[#F0F4F8]">
                                    <tr>
                                        <th className="px-6 py-3 text-center">PRODUCT ID</th>
                                        <th className="px-6 py-3 text-center">PRODUCT TITLE</th>
                                        <th className="px-6 py-3 text-center">PRICE</th>
                                        <th className="px-6 py-3 text-center">CATEGORY</th>
                                        <th className="px-6 py-3 text-center">STATUS</th>
                                        <th className="px-6 py-3 text-center">SOLD</th>
                                        <th className="px-6 py-3 text-center">ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F0F4F8]">
                                    {products.map((item) =>(
                                        <tr key={item.log_id}>
                                            <td className="px-6 py-4 text-center">{item.product_id}</td>
                                            <td className="px-6 py-4 text-center">{item.title}</td>
                                            <td className="px-6 py-4 text-center">{item.price}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center justify-center px-3 py-1 text-xs rounded-[2.25px] font-medium text-black ${
                                                    item.category === "Mentoring" ? "bg-[#FDFFE7]"  
                                                    : item.category === "Bootcamp" ? "bg-[#E7FFFC]"
                                                    : "bg-[#FFE7FD]"
                                                }`}>
                                                        {item.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center justify-center px-3 py-1 text-xs rounded-[13.5px] font-bold ${
                                                    item.status === "ACTIVE" ? "bg-[#D6FFD8] text-[#024816]"  
                                                    : "bg-[#FFD6D7] text-[#480203]"
                                                }`}>
                                                        {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">{item.sold}</td>
                                            <td className='flex px-6 py-4  justify-center '>
                                                <div className='flex flex-row items-center gap-2'>
                                                    <Eye size={20}/>
                                                    <PenLine size={20}/>
                                                    <SquareArrowOutUpRight size={20}/>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>

                            </table>
                        </div>
                    </div>
                </div>
                    

            </div>

            {isOpen && (
                <div className="fixed inset-0 bg-black/30 z-40" />
            )}

            <div 
            className={`
                fixed top-0 right-0 h-screen w-[700px]
                bg-white shadow-xl z-50
                transition-transform duration-300 ease-in-out
                flex flex-col
                overflow-y-auto
                ${isOpen ? "translate-x-0" : "translate-x-full"}
            `}>
                <div className='w-full h-[115px] shrink-0 bg-[#F0F4F8] flex flex-col justify-center px-10 gap-1'>
                    <div className='flex flex-row w-full justify-between'>
                        <p className='text-black text-[19.23px]'>
                            New Product
                        </p>
                        <X 
                        onClick={() => setIsOpen(false)}
                        />
                    </div>
                    <p className='text-[#43474D]'>
                        Fill in the details to create a new offering.
                    </p>
                </div>

                <div className='mx-10 my-10 flex flex-col gap-5'>
                    <div className='flex flex-col gap-2'>
                        <p className='text-[#43474D] text-[19px]'> 
                            PRODUCT THUMBNAIL
                        </p>
                        <div className='bg-[#F0F4F8] w-[623px] h-[220px] rounded-[9.61px] flex flex-col items-center justify-center border-2 border-dashed border-gray-300'>
                            <div className='bg-white rounded-[14.42px] w-[78px] h-[70px] flex justify-center items-center mb-5'>
                                <CloudUpload size={30} className='text-[#285FA0]'/>
                            </div>
                            <p className='text-black font-semibold text-[16.82px] mb-2'>
                                Click to upload or drag and drop
                            </p>
                            <p className='text-[#43474D] text-[14.42px]'>
                                Recommended: 1280x590px (Max 5MB)
                            </p>
                        </div>
                    </div>
                    <div className='flex flex-col gap-2'>
                        <p className='text-[#43474D] text-[19px]'> 
                            TITLE
                        </p>
                        <div className='relative'>
                            <input
                            type="text"
                            placeholder='Enter product name...'
                            className='w-[623px] h-[58px] bg-[#F0F4F8] shadow-md pl-5'
                            />
                        </div>
                    </div>
                    <div className='flex flex-col gap-2'>
                        <p className='text-[#43474D] text-[19px]'> 
                            CATEGORY
                        </p>
                        <div className="relative w-[623px]">
                            <select
                                className="
                                w-full h-[58px]
                                bg-[#F0F4F8]
                                shadow-md
                                px-5
                                appearance-none
                                "
                            >
                                <option>Bootcamp</option>
                                <option>Mentoring</option>
                                <option>Module</option>
                            </select>

                            <ChevronDown
                                size={20}
                                className="
                                absolute
                                right-5
                                top-1/2
                                -translate-y-1/2
                                pointer-events-none
                                "
                            />
                        </div>
                    </div>
                    <div className='flex flex-col gap-2'>
                        <p className='text-[#43474D] text-[19px]'> 
                            REGISTRATION LINK (URL)
                        </p>
                        <div className='relative'>
                            <input
                            type="text"
                            placeholder='Enter product transaction link...'
                            className='w-[623px] h-[58px] bg-[#F0F4F8] shadow-md pl-5'
                            />
                        </div>
                    </div>
                    <div className='flex flex-col gap-2'>
                        <p className='text-[#43474D] text-[19px]'> 
                            SHORT DESCRIPTION
                        </p>
                        <div className='relative'>
                            <input
                            type="text"
                            placeholder='Write short description (max 100 characters)...'
                            className='w-[623px] h-[58px] bg-[#F0F4F8] shadow-md pl-5'
                            />
                        </div>
                    </div>
                    <div className='flex flex-col gap-2'>
                        <p className='text-[#43474D] text-[19px]'> 
                            EXPLANATION
                        </p>
                        <div className='relative'>
                            <input
                            type="text"
                            placeholder='Write product explanation (no limit)...'
                            className='w-[623px] h-[58px] bg-[#F0F4F8] shadow-md pl-5'
                            />
                        </div>
                    </div>
                    <div className="flex gap-5">
                        <div className="flex flex-col gap-2 flex-1">
                            <p className="text-[#43474D] text-[19px]">
                            PUBLISHED AT
                            </p>

                            <div className="relative">
                            <input
                                type="date"
                                className="
                                w-full h-[58px]
                                bg-[#F0F4F8]
                                shadow-md
                                px-5
                                "
                            />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 w-[200px]">
                            <p className="text-[#43474D] text-[19px]">
                            TIME
                            </p>

                            <div className="relative">
                            <input
                                type="time"
                                className="
                                w-full h-[58px]
                                bg-[#F0F4F8]
                                shadow-md
                                px-5
                                "
                            />
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-5">
                        <div className="flex flex-col gap-2 flex-1">
                            <p className="text-[#43474D] text-[19px]">
                            PRICE (Rp)
                            </p>

                            <input
                            type="number"
                            placeholder="0"
                            className="
                                w-full h-[58px]
                                bg-[#F0F4F8]
                                shadow-md
                                px-5
                            "
                            />
                        </div>

                        <div className="flex flex-col gap-2 flex-1">
                            <p className="text-[#43474D] text-[19px]">
                            DISCOUNT (%)
                            </p>

                            <input
                            type="number"
                            placeholder="0"
                            className="
                                w-full h-[58px]
                                bg-[#F0F4F8]
                                shadow-md
                                px-5
                            "
                            />
                        </div>

                        <div className="flex flex-col gap-2 flex-1">
                            <p className="text-[#43474D] text-[19px]">
                            STOCK
                            </p>

                            <input
                            type="number"
                            placeholder="0"
                            className="
                                w-full h-[58px]
                                bg-[#F0F4F8]
                                shadow-md
                                px-5
                            "
                            />
                        </div>
                    </div>
                </div>

                <div className='flex flex-row justify-center items-center gap-5 w-full h-[100px] mb-10'>
                    <button className='text-[#2563EB] bg-white rounded-[9.61px] w-[251px] h-[69px] border border-2 border-[#C3C6CE] font-bold'>
                        Discard Draft
                    </button>
                    <button className='text-white bg-[#2563EB] rounded-[9.61px] w-[251px] h-[69px] font-bold'>
                        Publish Product
                    </button>
                </div>

            </div>
        </div>
    );
}