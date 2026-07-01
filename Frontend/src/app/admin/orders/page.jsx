"use client";

import {
  Bell,
  Settings,
  Search,
  Plus,
  TrendingUp,
  Download,
  Eye,
  PenLine,
  SquareArrowOutUpRight,
  X,
  CloudUpload,
  ChevronDown,
} from "lucide-react";
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
import Link from "next/link";
import Sidebar from "@/component/admin/Sidebar";
import Header from "@/component/admin/Header";

export default function Produk() {
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

  const [isCategoryActive, setIsCategoryActive] = useState("semua");
  const [isStatusActive, setIsStatusActive] = useState("semua");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

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
    <div className="w-full font-inter text-black bg-[#F8FAFC] min-h-screen relative flex flex-row overflow-x-hidden">
      <Sidebar />
      <div className="ml-[288px]">
        <Header judulHalaman="Orders" />
        <div className="flex-1 flex items-center py-5 flex-col gap-5 px-10 bg-white">
          <div className="flex flex-row items-center justify-between w-[1158px] mt-2">
            <div>
              <p className="font-bold text-[25px]">Order Management</p>
              <p className="text-[#43474D] text-[15px]">
                Manage MARK-UP bootcamps, modules, and mentoring sessions from a
                unified interface.
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
                  className="bg-[#2563EB] w-[163px] h-[43.5px] text-white font-semibold pl-6 rounded-[6.75px] hover:bg-[#2563EB]/80 transition-colors shadow-sm"
                >
                  New Product
                </button>
              </div>
            </div>
          </div>

          {/* --- GRID LAYOUT YANG SUDAH DIRAPIKAN --- */}
          <div className="w-[1158px] grid grid-cols-3 gap-5 mt-4">
            <div className="bg-[#FDFFE7] h-[140px] rounded-[9px] flex flex-col justify-center px-7 shadow-sm border border-[#E2E8F0]/50">
              <p className="text-[#43474D] font-bold text-[14px] tracking-wide">
                PRIVATE MENTORING SALES
              </p>
              <div className="flex flex-row items-baseline gap-2 mt-2">
                <p className="font-bold text-[40px] text-black leading-none">
                  19
                </p>
                <span className="text-[#43474D] text-[15px] font-medium">
                  units
                </span>
              </div>
            </div>

            <div className="bg-[#E7FFFC] h-[140px] rounded-[9px] flex flex-col justify-center px-7 shadow-sm border border-[#E2E8F0]/50">
              <p className="text-[#43474D] font-bold text-[14px] tracking-wide">
                INTENSIVE BOOTCAMP SALES
              </p>
              <div className="flex flex-row items-baseline gap-2 mt-2">
                <p className="font-bold text-[40px] text-black leading-none">
                  1
                </p>
                <span className="text-[#43474D] text-[15px] font-medium">
                  units
                </span>
              </div>
            </div>

            <div className="bg-[#FFE7FD] h-[140px] rounded-[9px] flex flex-col justify-center px-7 shadow-sm border border-[#E2E8F0]/50">
              <p className="text-[#43474D] font-bold text-[14px] tracking-wide">
                E-LEARNING & MODUL SALES
              </p>
              <div className="flex flex-row items-baseline gap-2 mt-2">
                <p className="font-bold text-[40px] text-black leading-none">
                  23
                </p>
                <span className="text-[#43474D] text-[15px] font-medium">
                  units
                </span>
              </div>
            </div>

            {/* Chart Section (col-span-2 & row-span-2) */}
            <div className="col-span-2 row-span-2 bg-white border border-[#E2E8F0] shadow-sm rounded-[9px] p-6 flex flex-col min-h-[320px]">
              <div className="flex flex-col mb-4">
                <div className="flex flex-row w-full justify-between items-center">
                  <p className="text-[13px] font-bold text-[#64748B] tracking-wider">
                    TOTAL REVENUE
                  </p>
                  <div className="flex flex-row w-[100px] h-[30px] rounded-[13.5px] bg-[#EFF6FF] items-center justify-center gap-1 border border-[#BFDBFE]">
                    <TrendingUp className="text-[#2563EB]" size={16} />
                    <p className="font-bold text-[#2563EB] text-[13px]">
                      +12.5%
                    </p>
                  </div>
                </div>
                <p className="font-bold text-[36px] text-[#1E293B] mt-1">
                  Rp284,912.00
                </p>
              </div>
              <div className="flex-1 min-h-0 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data}
                    barCategoryGap={30}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="product"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748B", fontSize: 12, fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ fill: "#F8FAFC" }}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                      {data.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            index === 0
                              ? "#EAB308"
                              : index === 1
                                ? "#2563EB"
                                : "#9333EA"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right Sidebar Cards */}
            <div className="bg-[#F0FDF4] rounded-[9px] flex flex-col justify-center px-7 shadow-sm border border-[#DCFCE7] min-h-[150px]">
              <p className="text-[#166534] font-bold text-[14px] tracking-wide">
                ACTIVE PRODUCTS NOW
              </p>
              <div className="flex flex-row items-baseline gap-2 mt-2">
                <p className="font-bold text-[44px] text-[#15803D] leading-none">
                  32
                </p>
                <span className="text-[#166534] text-[15px] font-medium">
                  products
                </span>
              </div>
            </div>

            <div className="bg-white rounded-[9px] flex flex-col justify-center px-7 shadow-sm border border-[#E2E8F0] min-h-[150px]">
              <p className="text-[#64748B] font-bold text-[14px] tracking-wide">
                TOTAL PRODUCTS ALL TIME
              </p>
              <div className="flex flex-row items-baseline gap-2 mt-2">
                <p className="font-bold text-[44px] text-[#1E293B] leading-none">
                  1.28k
                </p>
                <span className="text-[#64748B] text-[15px] font-medium">
                  products
                </span>
              </div>
            </div>
          </div>

          <div className="w-[1158px] flex flex-col mt-6">
            <div className="flex justify-between items-end">
              <div className="flex flex-col gap-1">
                <p className="text-[18px] font-semibold text-black">
                  List Products
                </p>
                <p className="text-[#43474D] text-[14px]">
                  List of MARK-UP products all time
                </p>
              </div>
              {/* --- DIGANTI MENGGUNAKAN LINK NEXT.JS --- */}
              <Link
                href="/admin/produk/all-products"
                className="text-[#2563EB] font-bold text-[14.62px] cursor-pointer hover:underline"
              >
                View All Products
              </Link>
            </div>

            <div className="flex flex-row justify-between mt-6">
              <div className="flex flex-row gap-5">
                <div className="h-[43.5px] bg-[#F0F4F8] px-2 rounded-[6px] flex justify-center items-center gap-1 shadow-sm">
                  <button
                    onClick={() => setIsCategoryActive("semua")}
                    className={`px-4 py-1.5 rounded-[4px] font-medium text-[13px] transition-all ${isCategoryActive === "semua" ? "bg-white text-black shadow-sm" : "text-[#43474D] hover:bg-[#E2E8F0]"}`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setIsCategoryActive("mentoring")}
                    className={`px-4 py-1.5 rounded-[4px] font-medium text-[13px] transition-all ${isCategoryActive === "mentoring" ? "bg-white text-black shadow-sm" : "text-[#43474D] hover:bg-[#E2E8F0]"}`}
                  >
                    Mentoring
                  </button>
                  <button
                    onClick={() => setIsCategoryActive("bootcamp")}
                    className={`px-4 py-1.5 rounded-[4px] font-medium text-[13px] transition-all ${isCategoryActive === "bootcamp" ? "bg-white text-black shadow-sm" : "text-[#43474D] hover:bg-[#E2E8F0]"}`}
                  >
                    Bootcamp
                  </button>
                  <button
                    onClick={() => setIsCategoryActive("module")}
                    className={`px-4 py-1.5 rounded-[4px] font-medium text-[13px] transition-all ${isCategoryActive === "module" ? "bg-white text-black shadow-sm" : "text-[#43474D] hover:bg-[#E2E8F0]"}`}
                  >
                    Module
                  </button>
                </div>
                <div className="h-[43.5px] bg-[#F0F4F8] px-2 rounded-[6px] flex justify-center items-center gap-1 shadow-sm">
                  <button
                    onClick={() => setIsStatusActive("semua")}
                    className={`px-4 py-1.5 rounded-[4px] font-medium text-[13px] transition-all ${isStatusActive === "semua" ? "bg-white text-black shadow-sm" : "text-[#43474D] hover:bg-[#E2E8F0]"}`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setIsStatusActive("active")}
                    className={`px-4 py-1.5 rounded-[4px] font-medium text-[13px] transition-all ${isStatusActive === "active" ? "bg-white text-black shadow-sm" : "text-[#43474D] hover:bg-[#E2E8F0]"}`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setIsStatusActive("deactivate")}
                    className={`px-4 py-1.5 rounded-[4px] font-medium text-[13px] transition-all ${isStatusActive === "deactivate" ? "bg-white text-black shadow-sm" : "text-[#43474D] hover:bg-[#E2E8F0]"}`}
                  >
                    Deactivate
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
                        PRODUCT ID
                      </th>
                      <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                        PRODUCT TITLE
                      </th>
                      <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                        PRICE
                      </th>
                      <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                        CATEGORY
                      </th>
                      <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                        STATUS
                      </th>
                      <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                        SOLD
                      </th>
                      <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                        ACTIONS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] bg-white">
                    {products.map((item, index) => (
                      <tr
                        key={index}
                        className="hover:bg-[#F8FAFC] transition-colors"
                      >
                        <td className="px-6 py-5 text-center text-[#64748B] font-medium">
                          {item.product_id}
                        </td>
                        <td className="px-6 py-5 text-center text-[#1E293B] font-semibold">
                          {item.title}
                        </td>
                        <td className="px-6 py-5 text-center text-[#43474D] font-medium">
                          {item.price}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span
                            className={`inline-flex items-center justify-center px-3 py-1.5 text-[12px] rounded-[6px] font-semibold border ${
                              item.category === "Mentoring"
                                ? "bg-[#FDFFE7] text-[#854D0E] border-[#FEF08A]"
                                : item.category === "Bootcamp"
                                  ? "bg-[#E7FFFC] text-[#0F766E] border-[#A7F3D0]"
                                  : "bg-[#FFE7FD] text-[#9D174D] border-[#FBCFE8]"
                            }`}
                          >
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
                        <td className="px-6 py-5 text-center text-[#43474D] font-medium">
                          {item.sold}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className="flex flex-row items-center justify-center gap-4">
                            <Eye
                              className="cursor-pointer text-[#64748B] hover:text-[#2563EB] transition-colors"
                              size={18}
                            />
                            <PenLine
                              size={18}
                              onClick={() => {
                                setSelectedProduct(item);
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
            <p className="text-[#1E293B] text-[20px] font-bold">New Product</p>
            <button
              onClick={() => setIsAddOpen(false)}
              className="p-2 hover:bg-[#E2E8F0] rounded-full transition-colors"
            >
              <X className="cursor-pointer text-[#64748B]" size={20} />
            </button>
          </div>
          <p className="text-[#64748B] text-[14px]">
            Fill in the details to create a new offering.
          </p>
        </div>

        <div className="px-10 py-8 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
              PRODUCT THUMBNAIL
            </p>
            <div className="bg-[#F8FAFC] w-full h-[180px] rounded-[8px] flex flex-col items-center justify-center border-2 border-dashed border-[#CBD5E1] hover:bg-[#F1F5F9] hover:border-[#94A3B8] transition-all cursor-pointer">
              <div className="bg-white rounded-[12px] w-[56px] h-[56px] flex justify-center items-center mb-3 shadow-sm border border-[#E2E8F0]">
                <CloudUpload size={24} className="text-[#2563EB]" />
              </div>
              <p className="text-[#1E293B] font-semibold text-[15px] mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-[#64748B] text-[13px]">
                Recommended: 1280x590px (Max 5MB)
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
              TITLE
            </p>
            <input
              type="text"
              placeholder="Enter product name..."
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
                <option>Bootcamp</option>
                <option>Mentoring</option>
                <option>Module</option>
              </select>
              <ChevronDown
                size={18}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
              REGISTRATION LINK (URL)
            </p>
            <input
              type="url"
              placeholder="Enter product transaction link..."
              className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B] placeholder:text-[#94A3B8]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
              SHORT DESCRIPTION
            </p>
            <input
              type="text"
              placeholder="Write short description (max 100 characters)..."
              className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B] placeholder:text-[#94A3B8]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
              EXPLANATION
            </p>
            <textarea
              placeholder="Write product explanation (no limit)..."
              className="w-full h-[120px] py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B] placeholder:text-[#94A3B8] resize-none"
            />
          </div>

          <div className="flex gap-4 w-full">
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
                PUBLISHED AT
              </p>
              <input
                type="date"
                className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B]"
              />
            </div>

            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
                TIME
              </p>
              <input
                type="time"
                className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B]"
              />
            </div>
          </div>

          <div className="flex gap-4 w-full">
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
                PRICE (Rp)
              </p>
              <input
                type="number"
                placeholder="0"
                className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B] placeholder:text-[#94A3B8]"
              />
            </div>

            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
                DISCOUNT (%)
              </p>
              <input
                type="number"
                placeholder="0"
                className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B] placeholder:text-[#94A3B8]"
              />
            </div>

            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
                STOCK
              </p>
              <input
                type="number"
                placeholder="0"
                className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B] placeholder:text-[#94A3B8]"
              />
            </div>
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
            Publish Product
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
            <p className="text-[#1E293B] text-[20px] font-bold">Edit Product</p>
            <button
              onClick={() => setIsEditOpen(false)}
              className="p-2 hover:bg-[#E2E8F0] rounded-full transition-colors"
            >
              <X className="cursor-pointer text-[#64748B]" size={20} />
            </button>
          </div>
          <p className="text-[#64748B] text-[14px]">
            Fill in the details to update this offering.
          </p>
        </div>

        <div
          key={selectedProduct?.product_id}
          className="px-10 py-8 flex flex-col gap-6"
        >
          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
              PRODUCT THUMBNAIL
            </p>
            <div className="bg-[#F8FAFC] w-full h-[180px] rounded-[8px] flex flex-col items-center justify-center border-2 border-dashed border-[#CBD5E1] hover:bg-[#F1F5F9] hover:border-[#94A3B8] transition-all cursor-pointer">
              <div className="bg-white rounded-[12px] w-[56px] h-[56px] flex justify-center items-center mb-3 shadow-sm border border-[#E2E8F0]">
                <CloudUpload size={24} className="text-[#2563EB]" />
              </div>
              <p className="text-[#1E293B] font-semibold text-[15px] mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-[#64748B] text-[13px]">
                Recommended: 1280x590px (Max 5MB)
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
              TITLE
            </p>
            <input
              type="text"
              defaultValue={selectedProduct?.title || ""}
              placeholder="Enter product name..."
              className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
              CATEGORY
            </p>
            <div className="relative w-full">
              <select
                defaultValue={selectedProduct?.category || "Bootcamp"}
                className="
                                w-full h-[48px]
                                bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px]
                                px-4 pr-10
                                appearance-none outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B]
                                "
              >
                <option>Bootcamp</option>
                <option>Mentoring</option>
                <option>Module</option>
              </select>
              <ChevronDown
                size={18}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
              REGISTRATION LINK (URL)
            </p>
            <input
              type="url"
              placeholder="Enter product transaction link..."
              className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
              SHORT DESCRIPTION
            </p>
            <input
              type="text"
              placeholder="Write short description (max 100 characters)..."
              className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
              EXPLANATION
            </p>
            <textarea
              placeholder="Write product explanation (no limit)..."
              className="w-full h-[120px] py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B] resize-none"
            />
          </div>

          <div className="flex gap-4 w-full">
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
                PUBLISHED AT
              </p>
              <input
                type="date"
                className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B]"
              />
            </div>

            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
                TIME
              </p>
              <input
                type="time"
                className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B]"
              />
            </div>
          </div>

          <div className="flex gap-4 w-full">
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
                PRICE (Rp)
              </p>
              <input
                type="number"
                defaultValue={
                  selectedProduct?.price?.replace(/[^0-9]/g, "") || 0
                }
                placeholder="0"
                className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B]"
              />
            </div>

            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
                DISCOUNT (%)
              </p>
              <input
                type="number"
                placeholder="0"
                className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B]"
              />
            </div>

            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[#64748B] text-[13px] uppercase font-bold tracking-wider">
                STOCK
              </p>
              <input
                type="number"
                placeholder="0"
                className="w-full h-[48px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-4 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[#1E293B]"
              />
            </div>
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
