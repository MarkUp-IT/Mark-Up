"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuthGuard } from "@/lib/useAuthGuard";

export default function DashboardLayout({ title, children }) {
  const { profile, checked } = useAuthGuard(["MENTOR"]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (!checked) {
    return <div style={{ backgroundColor: "#0F081C" }} className="w-full min-h-screen" />;
  }

  return (
    <div
      style={{ backgroundColor: "#0F081C" }}
      className="w-full min-h-screen font-inter text-white"
    >
      <div className="fixed inset-x-0 top-0 h-[400px] overflow-hidden pointer-events-none z-0">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[150vw] md:w-[120vw] h-[300px] md:h-[400px] rounded-b-[100%]"
          style={{
            background:
              "radial-gradient(ellipse at top, rgba(177, 158, 239, 0.15) 0%, transparent 60%)",
            filter: "blur(40px)",
          }}
        />
      </div>
      <Sidebar isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
        />
      )}

      <div className="flex flex-col min-h-screen lg:ml-[288px] relative z-10">
        <Header
          title={title}
          onMenuClick={() => setMobileNavOpen(true)}
          profileName={profile?.profile_name}
          email={profile?.email}
          avatarSrc={profile?.avatar_src}
        />

        <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8">
          <div
            style={{ maxWidth: "1158px" }}
            className="w-full mx-auto flex flex-col gap-6"
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
