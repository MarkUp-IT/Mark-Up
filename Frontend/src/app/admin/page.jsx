"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Archive, Trophy, ScrollText, MessagesSquare, History, Bell, Settings } from 'lucide-react';

export default function admin() {

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
        <div className="w-full font-inter text-black bg-white min-h-screen relative flex flex-row overflow-x-hidden">
            <div className="bg-[#E2E8F0] w-[288px] flex flex-col pt-5 pl-5 pr-5">

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
                        <div className="flex flex-row gap-4 w-full h-[54px] flex items-center rounded-[6.75px] pl-5  text-[#475569]">
                            <Icon />
                            <Link
                            key={index}
                            href={menu.url}
                            className={
                                menuAktif
                                ? ""
                                : ""
                            }
                            >
                            {menu.nama}
                            </Link>
                        </div>
                    );
                    })}
                </div>

                <div className="w-full h-[54px] bg-[#EB2528] flex justify-center items-center rounded-[6.75px] mt-40">
                    <p className="text-white font-semibold ">Keluar</p>
                </div>

            </div>
            <div className="bg-blue-500 flex-1 flex justify-center ">
                <div className="w-[1158px] h-[72px] bg-[#E2E8F0] flex flex-row items-center justify-center">
                    <p className="text-black font-bold text-[20.25px]">
                        Dashboard
                    </p>
                    <input
                    type="text"
                    placeholder="Search analytics..."
                    className="bg-white w-[511px] h-[36px] rounded-[6.75px]"
                    />

                    <Bell />
                    <Settings />

                </div>

            </div>
        </div>
    );
}