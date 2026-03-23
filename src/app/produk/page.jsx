"use client";

import GlassSurface from "@/component/GlassSurface";
import Navbar from "@/component/navbar";
import dynamic from "next/dynamic";
import Image from "next/image";

export default function ProdukPage() {
  const GlassSurfaceDynamic = dynamic(
    () => import("@/component/GlassSurface"),
    {
      ssr: false,
    },
  );
  return (
    <div className="w-full bg-gradient-to-b from-black to-purple-800 min-h-screen relative flex flex-col">
      <div className="absolute z-10 flex w-full justify-center mt-4">
        <Navbar />

        <GlassSurfaceDynamic
          width="100%"
          height="100%"
          borderRadius={16}
          className="flex items-center justify-between w-full border border-white/10 shadow-lg"
          distortionScale={300}
        >
          asdasd
        </GlassSurfaceDynamic>
      </div>
    </div>
  );
}
