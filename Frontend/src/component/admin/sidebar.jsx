"use client";

import {LayoutDashboard, Archive, Trophy, ScrollText, MessagesSquare, History} from 'lucide-react';
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar(){

    const pathname = usePathname();
    const daftarMenu = [
        { 
            nama: "Dashboard", 
            url: "/admin",
            icon: LayoutDashboard
        },
        { 
            nama: "Produk", 
            url: "/admin/produk",
            icon: Archive
        },
        { 
            nama: "Info Lomba", 
            url: "/admin/lomba",
            icon: Trophy
        },
        { 
            nama: "Transaksi", 
            url: "/admin/transaksi",
            icon: ScrollText
        },
        { 
            nama: "Ulasan", 
            url: "/admin/ulasan",
            icon: MessagesSquare
        },
        { 
            nama: "Audit Trail", 
            url: "/admin/audit",
            icon: History
        },
    ];

    return (
    <div className="fixed left-0 top-0 h-screen bg-[#E2E8F0] w-[288px] flex flex-col pt-5 pl-5 pr-5">

        <div className="pl-5 mb-5">
            <p className="font-bold text-[22.5px]">
                MARK-UP
            </p>
            <p className="text-[#43474D] text-[12.37px] tracking-[1.24px]">
                ADMIN
            </p>
        </div>

        <div className="hidden lg:flex menus flex flex-col items-center">
            {daftarMenu.map((menu, index) => {
            const menuAktif = pathname === menu.url;
            const Icon = menu.icon;

            return (
                <Link
                    key={index}
                    href={menu.url}
                    className={`flex flex-row gap-4 w-full h-[54px] items-center rounded-[6.75px] pl-5 transition-colors ${
                        menuAktif
                        ? "bg-white text-[#2563EB]"
                        : "text-[#475569] hover:bg-white"
                    }`}
                    >
                    <Icon
                        className={
                        menuAktif
                            ? "text-[#2563EB]"
                            : "text-[#475569]"
                        }
                    />

                    <span
                        className={
                        menuAktif
                            ? "font-medium text-[#2563EB]"
                            : ""
                        }
                    >
                        {menu.nama}
                    </span>
                </Link>
            );
            })}
        </div>

        <div className="w-full h-[54px] bg-[#EB2528] flex justify-center items-center rounded-[6.75px] mt-50 hover:bg-[#EB2528]/80">
            <p className="text-white font-semibold ">Keluar</p>
        </div>

    </div>

)};
