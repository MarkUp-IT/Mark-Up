'use client'

import Navbar from "@/components/navbar";
import Image from "next/image";

export default function ProdukPage() {
  return (
    <div className="w-full bg-gradient-to-b from-black to-purple-800 min-h-screen relative flex flex-col">
      <div className="absolute z-10 flex w-full justify-center mt-4">
        <Navbar />
      </div>
    </div>
  );
}
