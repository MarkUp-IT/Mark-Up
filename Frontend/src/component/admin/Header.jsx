import React from "react";
import { Bell, Settings } from "lucide-react";

const Header = ({
  judulHalaman,
  namaProfil = "Affan Fathir D.",
  role = "Associate IT",
}) => {
  return (
    <div className="sticky top-0 z-30 w-full h-[72px] bg-[#E2E8F0] flex flex-row items-center justify-between px-8 shadow-sm">
      <div className="flex items-center">
        <p className="text-black font-bold text-[20.25px]">{judulHalaman}</p>
      </div>

      <div className="flex items-center gap-8">
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

        <div className="flex flex-row gap-4 items-center border-l border-[#CBD5E1] pl-8">
          <div className="flex flex-col text-right">
            <p className="font-semibold text-[14.62px]">{namaProfil}</p>
            <p className="text-[12.37px] text-[#64748B]">{role}</p>
          </div>
          <div className="bg-[#2B3034] w-[36px] h-[36px] rounded-[13.5px] flex items-center justify-center overflow-hidden">
            <img
              src={`https://api.dicebear.com/7.x/notionists/svg?seed=${namaProfil}&backgroundColor=2B3034`}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
