"use client";

import {
  Search,
  Calendar,
  ChevronDown,
  ListFilter,
  Eye,
  X,
  CreditCard,
  Landmark,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import Sidebar from "@/component/admin/Sidebar";
import Header from "@/component/admin/Header";

export default function Transactions() {
  // Mock Data Transaksi
  const transactions = [
    {
      id: "#ME003",
      userId: "#prabrorosub",
      productId: "#A001",
      date: "Oct 24, 2023 · 14:22",
      amount: "Rp299.000,00",
      method: "Visa ending 4242",
      methodType: "card",
      status: "SUCCESS",
    },
    {
      id: "#BO001",
      userId: "#affanfathir",
      productId: "#A001",
      date: "Oct 24, 2023 · 14:14",
      amount: "Rp299.000,00",
      method: "Bank Transfer",
      methodType: "bank",
      status: "FAILED",
    },
    {
      id: "#MO001",
      userId: "#fathir0775",
      productId: "#A001",
      date: "Oct 24, 2023 · 14:02",
      amount: "Rp299.000,00",
      method: "PayPal",
      methodType: "wallet",
      status: "PENDING",
    },
  ];

  // State untuk Modal Popup
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);

  // Lock scroll saat modal terbuka
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isModalOpen]);

  // Helper render ikon payment
  const renderPaymentIcon = (type) => {
    switch (type) {
      case "card":
        return <CreditCard size={14} className="text-[#94A3B8]" />;
      case "bank":
        return <Landmark size={14} className="text-[#94A3B8]" />;
      case "wallet":
        return <Wallet size={14} className="text-[#94A3B8]" />;
      default:
        return null;
    }
  };

  const openDetail = (tx) => {
    setSelectedTx(tx);
    setIsModalOpen(true);
  };

  return (
    <div className="w-full font-inter text-black bg-[#F8FAFC] min-h-screen relative flex flex-row overflow-x-hidden">
      <Sidebar />
      <div className="ml-[288px] flex-1">
        <Header judulHalaman="Transactions" />
        <div className="flex-1 flex items-center py-5 flex-col gap-5 px-10 bg-white min-h-screen">
          {/* Title Area */}
          <div className="flex flex-row items-center justify-between w-[1158px] mt-2">
            <div>
              <p className="font-bold text-[25px]">
                Transaction & Payment Logs
              </p>
              <p className="text-[#43474D] text-[15px] mt-1">
                Real-time audit of all system financial activities.
              </p>
            </div>
            <Link
              href="#"
              className="text-[#2E1065] font-bold text-[14.62px] cursor-pointer hover:underline mb-2"
            >
              View All Transactions
            </Link>
          </div>

          {/* Filters Area */}
          <div className="w-[1158px] flex justify-between items-end mt-2">
            <div className="bg-[#F8FAFC] p-4 rounded-[8px] flex flex-row gap-4 border border-[#E2E8F0] shadow-sm w-full">
              {/* Search */}
              <div className="flex-1 relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                />
                <input
                  type="text"
                  placeholder="Search by ID, user or product..."
                  className="w-full h-[36px] pl-9 pr-3 border border-[#CBD5E1] rounded-[6px] text-[13px] text-[#475569] outline-none focus:border-[#2E1065]"
                />
              </div>

              {/* Date Range */}
              <div className="relative w-[240px]">
                <Calendar
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]"
                />
                <select className="w-full h-[36px] pl-9 pr-8 border border-[#CBD5E1] rounded-[6px] text-[13px] text-[#475569] appearance-none outline-none focus:border-[#2E1065] bg-white cursor-pointer">
                  <option>Oct 01, 2023 - Oct 31, 2023</option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none"
                />
              </div>

              {/* Payment Method */}
              <div className="relative w-[180px]">
                <select className="w-full h-[36px] pl-3 pr-8 border border-[#CBD5E1] rounded-[6px] text-[13px] text-[#475569] appearance-none outline-none focus:border-[#2E1065] bg-white cursor-pointer">
                  <option>Payment Method: All</option>
                  <option>Bank Transfer</option>
                  <option>Credit Card</option>
                  <option>E-Wallet</option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none"
                />
              </div>

              {/* Status */}
              <div className="relative w-[140px]">
                <select className="w-full h-[36px] pl-3 pr-8 border border-[#CBD5E1] rounded-[6px] text-[13px] text-[#475569] appearance-none outline-none focus:border-[#2E1065] bg-white cursor-pointer">
                  <option>Status: All</option>
                  <option>Success</option>
                  <option>Failed</option>
                  <option>Pending</option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none"
                />
              </div>

              {/* Filter Button */}
              <button className="w-[36px] h-[36px] flex items-center justify-center border border-[#CBD5E1] rounded-[6px] bg-white text-[#64748B] hover:bg-[#F1F5F9] transition-colors shadow-sm">
                <ListFilter size={16} />
              </button>
            </div>
          </div>

          {/* Table Area */}
          <div className="w-[1158px] rounded-[8px] overflow-hidden mt-4 border border-[#E2E8F0] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                      TRANSACTION ID
                    </th>
                    <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                      USER ID
                    </th>
                    <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                      PRODUCT ID
                    </th>
                    <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                      DATE/TIME
                    </th>
                    <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                      AMOUNT
                    </th>
                    <th className="px-6 py-4 text-center font-bold text-[#43474D] tracking-wider text-[12px]">
                      METHOD
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
                  {transactions.map((item, index) => (
                    <tr
                      key={index}
                      className="hover:bg-[#F8FAFC] transition-colors h-[80px]"
                    >
                      <td className="px-6 text-center text-[#64748B] font-medium">
                        {item.id}
                      </td>
                      <td className="px-6 text-center text-[#64748B] font-medium">
                        {item.userId}
                      </td>
                      <td className="px-6 text-center text-[#64748B] font-medium">
                        {item.productId}
                      </td>
                      <td className="px-6 text-center text-[#1E293B] font-semibold">
                        {item.date}
                      </td>
                      <td className="px-6 text-center text-[#1E293B] font-bold">
                        {item.amount}
                      </td>
                      <td className="px-6 text-center">
                        <div className="flex items-center justify-center gap-2 text-[#64748B] font-medium">
                          {renderPaymentIcon(item.methodType)}
                          {item.method}
                        </div>
                      </td>
                      <td className="px-6 text-center">
                        <span
                          className={`inline-flex items-center justify-center px-4 py-1.5 text-[11px] rounded-full font-bold uppercase ${
                            item.status === "SUCCESS"
                              ? "bg-[#DCFCE7] text-[#166534]"
                              : item.status === "FAILED"
                                ? "bg-[#FEE2E2] text-[#991B1B]"
                                : "bg-[#F1F5F9] text-[#475569]"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 text-center">
                        <button
                          onClick={() => openDetail(item)}
                          className="text-[#94A3B8] hover:text-[#2E1065] transition-colors p-2 rounded-full hover:bg-[#F3E8FF]"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center mt-6 mb-10 gap-2 text-[#64748B] text-[14px]">
            <span className="w-8 h-8 flex items-center justify-center bg-white border border-[#2E1065] text-[#2E1065] font-bold rounded-[6px] cursor-pointer hover:bg-[#F3E8FF] shadow-sm">
              1
            </span>
            <span className="w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded-[6px] font-medium">
              2
            </span>
            <span className="w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded-[6px] font-medium">
              3
            </span>
            <span className="font-medium tracking-widest px-1">...</span>
            <span className="w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded-[6px] font-medium">
              12
            </span>
          </div>
        </div>
      </div>

      {/* --- MODAL POPUP DETAIL TRANSAKSI --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="relative bg-white w-[500px] rounded-[12px] shadow-2xl flex flex-col overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#F8FAFC] px-6 py-5 border-b border-[#E2E8F0] flex justify-between items-center">
              <div>
                <p className="text-[#1E293B] font-bold text-[18px]">
                  Detail Transaksi
                </p>
                <p className="text-[#64748B] text-[13px] mt-0.5">
                  {selectedTx?.id}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#E2E8F0] rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-6 flex flex-col gap-5">
              <div
                className={`w-full py-3 rounded-[6px] flex justify-center items-center font-bold text-[13px] uppercase tracking-wider ${
                  selectedTx?.status === "SUCCESS"
                    ? "bg-[#DCFCE7] text-[#166534]"
                    : selectedTx?.status === "FAILED"
                      ? "bg-[#FEE2E2] text-[#991B1B]"
                      : "bg-[#F1F5F9] text-[#475569]"
                }`}
              >
                TRANSACTION {selectedTx?.status}
              </div>

              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[#64748B] text-[12px] font-bold uppercase tracking-wider">
                    User ID
                  </span>
                  <span className="text-[#1E293B] font-medium text-[14px]">
                    {selectedTx?.userId}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[#64748B] text-[12px] font-bold uppercase tracking-wider">
                    Product ID
                  </span>
                  <span className="text-[#1E293B] font-medium text-[14px]">
                    {selectedTx?.productId}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[#64748B] text-[12px] font-bold uppercase tracking-wider">
                    Date & Time
                  </span>
                  <span className="text-[#1E293B] font-medium text-[14px]">
                    {selectedTx?.date}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[#64748B] text-[12px] font-bold uppercase tracking-wider">
                    Payment Method
                  </span>
                  <div className="flex items-center gap-2 text-[#1E293B] font-medium text-[14px]">
                    {renderPaymentIcon(selectedTx?.methodType)}
                    {selectedTx?.method}
                  </div>
                </div>
              </div>

              <div className="mt-2 bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-[6px] flex justify-between items-center">
                <span className="text-[#475569] font-bold text-[14px]">
                  Total Dibayar
                </span>
                <span className="text-[#0F172A] font-bold text-[20px]">
                  {selectedTx?.amount}
                </span>
              </div>
            </div>

            <div className="px-6 py-5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 bg-white border border-[#CBD5E1] text-[#475569] font-bold text-[13px] rounded-[6px] hover:bg-[#F1F5F9] transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
