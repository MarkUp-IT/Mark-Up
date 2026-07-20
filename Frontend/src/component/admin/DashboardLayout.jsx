"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuthGuard } from "@/lib/useAuthGuard";

export default function DashboardLayout({ title, children }) {
  const { profile, checked } = useAuthGuard(["ADMIN"]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (!checked) {
    return <div className="w-full min-h-screen bg-white" />;
  }

  return (
    <div className="w-full min-h-screen bg-white font-inter text-[#1E293B]">
      <Sidebar isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="lg:ml-[288px] flex flex-col min-h-screen">
        <Header
          judulHalaman={title}
          onMenuClick={() => setMobileNavOpen(true)}
          profileName={profile?.profile_name}
          role="Admin"
          avatarSrc={profile?.avatar_src}
        />
        <main className="flex-1 bg-[#F8FAFC] px-8 py-6">
          <div
            style={{ maxWidth: "1240px" }}
            className="w-full mx-auto flex flex-col gap-6"
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
