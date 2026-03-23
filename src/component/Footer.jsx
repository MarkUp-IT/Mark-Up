"use client";

import Image from "next/image";
import Link from "next/link";

export default function Footer(){
    return (
        <div className="bg-[#FFFFFF]/10 flex flex-col font-light text-sm text-[#EDEDF3]">
            <div className="flex flex-row gap-[140px] mt-30 justify-center mb-10">
                <div className="flex flex-col gap-[20px]">
                    <p className="font-Montserrat font-semibold text-3xl">
                        MARK-
                        <span className="text-[#B19EEF]">
                            UP
                        </span>
                    </p>
                    <p className="w-[250px]">
                        Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt
                    </p>
                    <div className="flex flex-row gap-[10px] mt-10">
                        <div className="group rounded-full bg-[#060010] w-[28px] h-[28px] border-1 border-[#EDEDF3]/25 flex justify-center items-center hover:bg-white">
                            <Image
                                src="/images/twitter.svg"
                                width={16}
                                height={16}
                                alt="Twitter"
                                className="invert group-hover:invert-0"
                            />
                        </div>
                        <div className="group rounded-full bg-[#060010] w-[28px] h-[28px] border-1 border-[#EDEDF3]/25 flex justify-center items-center hover:bg-white">
                            <Image
                                src="/images/facebook.svg"
                                width={14}
                                height={14}
                                alt="Facebook"
                                className="invert group-hover:invert-0"
                            />
                        </div>
                        <Link href="https://www.instagram.com/markup_official/" target="_blank">
                            <div className="group rounded-full bg-[#060010] w-[28px] h-[28px] border-1 border-[#EDEDF3]/25 flex justify-center items-center hover:bg-white">
                                <Image
                                    src="/images/instagram.svg"
                                    width={16}
                                    height={16}
                                    alt="Instagram"
                                    className="invert group-hover:invert-0"
                                />
                            </div>
                        </Link>
                        <Link href="https://github.com/MarkUp-IT " target="_blank">
                            <div className="group rounded-full bg-[#060010] w-[28px] h-[28px] border-1 border-[#EDEDF3]/25 flex justify-center items-center hover:bg-white">
                                <Image
                                    src="/images/github.svg"
                                    width={16}
                                    height={16}
                                    alt="Github"
                                    className="invert translate-x-[1px] group-hover:invert-0"
                                />
                            </div>
                        </Link>
                    </div>
                </div>
                <div className="flex flex-col gap-[30px]">
                    <p className="font-bold font-poppins tracking-widest">
                        NAVIGASI
                    </p>
                    <div className="flex flex-col gap-[15px]">
                            <Link href="/">
                                <p className="hover:font-semibold">
                                    Beranda
                                </p>
                            </Link>
                            <Link href="/info-lomba">
                                <p className="hover:font-semibold">
                                    Info Lomba
                                </p>
                            </Link>
                            <Link href="/produk">
                                <p className="hover:font-semibold">
                                    Produk
                                </p>
                            </Link>
                            <Link href="/mentor">
                                <p className="hover:font-semibold">
                                    Mentor
                                </p>
                            </Link>
                            <Link href="/tentang-kami">
                                <p className="relative font-light hover:font-semibold">
                                    Tentang Kami
                                    <span className="invisible font-semibold block h-0 overflow-hidden">Tentang Kami</span>
                                </p>
                            </Link>
                        </div>
                    </div>
                <div className="flex flex-col gap-[30px]">
                    <p className="font-bold font-poppins tracking-widest">
                        BANTUAN
                    </p>
                    <div className="flex flex-col gap-[15px]">
                        <p className="hover:font-semibold">
                            Customer Support
                        </p>
                        <p className="hover:font-semibold">
                            Delivery Details
                        </p>
                        <p className="hover:font-semibold">
                            Terms & Conditions
                            <span className="invisible font-semibold block h-0 overflow-hidden">Terms & Conditions</span>
                        </p>
                        <p className="hover:font-semibold">
                            Privacy Policy
                        </p>
                    </div>
                </div>
                <div className="flex flex-col gap-[30px]">
                    <p className="font-bold font-poppins tracking-widest">
                        HUBUNGI KAMI
                    </p>
                    <div className="flex flex-col gap-[15px]">
                        <div className="flex flex-row gap-[7px]">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                            </svg>
                            <p>
                                markup@gmail.com
                            </p>
                        </div>
                        <div className="flex flex-row gap-[7px]">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                            </svg>
                            <p>
                                1234567890 (Cahyo)
                            </p>
                        </div>
                        <div className="flex flex-row gap-[7px]">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                            </svg>

                            <p className="w-[280px]">
                                Jl. Veteran No.10-11, Ketawanggede, Kec. Lowokwaru, Kota Malang, Jawa Timur 65145
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex flex-col items-center">
                <div>
                    <hr className="w-300 border-t border-white/20 my-4" />  
                </div>
                <div className="mb-10 w-300">
                    <p className="text-xs">
                        MARK-UP © 2026
                    </p>
                </div>
            </div>
        </div>
    );
}