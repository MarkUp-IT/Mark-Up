"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function DashboardLayout({ title, children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="w-full min-h-screen bg-[#0F081C] font-inter text-white">
      <Sidebar isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
        />
      )}

      <div className="flex flex-col min-h-screen lg:ml-[288px]">
        <Header title={title} onMenuClick={() => setMobileNavOpen(true)} />

        <main className="flex-1 flex flex-col py-8 px-4 sm:px-6 lg:px-10">
          <div className="w-full max-w-[1158px] mx-auto flex flex-col gap-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
