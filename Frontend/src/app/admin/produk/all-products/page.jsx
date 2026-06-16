"use client";

import {
  Bell,
  Settings,
  Search,
  Download,
  Eye,
  EyeOff,
  PenLine,
  SquareArrowOutUpRight,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import Sidebar from "@/component/admin/sidebar";

export default function AllProducts() {
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
      status: "REMOVED",
      sold: 5,
    },
    {
      product_id: "#MO001",
      title: "Full-Throttle Coaching",
      price: "Rp110.000",
      category: "Module",
      status: "HIDE",
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
      status: "REMOVED",
      sold: 5,
    },
    {
      product_id: "#MO001",
      title: "Full-Throttle Coaching",
      price: "Rp110.000",
      category: "Module",
      status: "HIDE",
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
    {
      product_id: "#BO001",
      title: "Essential Sprint Registration",
      price: "Rp110.000",
      category: "Bootcamp",
      status: "REMOVED",
      sold: 5,
    },
  ];

  const [isCategoryActive, setIsCategoryActive] = useState("semua");
  const [isStatusActive, setIsStatusActive] = useState("semua");

  return (
    <div className="w-full font-inter text-black bg-[#F8FAFC] min-h-screen relative flex flex-row overflow-x-hidden">
      <Sidebar />
      <div className="flex-1 flex items-center ml-[288px] py-5 flex-col gap-5 px-10 bg-white">
        <div className="w-[1158px] h-[72px] bg-[#E2E8F0] flex flex-row items-center justify-center gap-15 rounded-[8px]">
          <div className="flex gap-20 items-center">
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
                className="bg-white w-[511px] h-[36px] rounded-[6.75px] pl-10 border-none outline-none focus:ring-2 focus:ring-[#2563EB]/20"
              />
            </div>
          </div>

          <div className="flex flex-row gap-4 items-center">
            <Bell
              color="#64748B"
              className="cursor-pointer hover:text-black transition-colors"
            />
            <Settings
              color="#64748B"
              className="cursor-pointer hover:text-black transition-colors"
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

        <div className="w-[1158px] flex flex-col mt-6">
          <div className="flex justify-between items-end">
            <div className="flex flex-col gap-1">
              <p className="text-[25px] font-bold text-black">
                Products Catalog
              </p>
              <p className="text-[#43474D] text-[15px]">
                Manage MARK-UP bootcamps, modules, and mentoring sessions from a
                unified interface.
              </p>
            </div>
            <Link
              href="/admin/produk"
              className="text-[#2563EB] font-bold text-[14.62px] cursor-pointer hover:underline"
            >
              View Less Products
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
                  onClick={() => setIsStatusActive("hide")}
                  className={`px-4 py-1.5 rounded-[4px] font-medium text-[13px] transition-all ${isStatusActive === "hide" ? "bg-white text-black shadow-sm" : "text-[#43474D] hover:bg-[#E2E8F0]"}`}
                >
                  Hide
                </button>
                <button
                  onClick={() => setIsStatusActive("removed")}
                  className={`px-4 py-1.5 rounded-[4px] font-medium text-[13px] transition-all ${isStatusActive === "removed" ? "bg-white text-black shadow-sm" : "text-[#43474D] hover:bg-[#E2E8F0]"}`}
                >
                  Removed
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
                              : item.status === "REMOVED"
                                ? "bg-[#FFE4E6] text-[#E11D48]"
                                : "bg-[#F1F5F9] text-[#64748B]"
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
                          {item.status === "HIDE" ? (
                            <EyeOff
                              className="cursor-pointer text-[#64748B] hover:text-[#2563EB] transition-colors"
                              size={18}
                            />
                          ) : (
                            <Eye
                              className="cursor-pointer text-[#64748B] hover:text-[#2563EB] transition-colors"
                              size={18}
                            />
                          )}
                          <PenLine
                            size={18}
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
  );
}
