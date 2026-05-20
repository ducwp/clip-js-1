"use client";

import { useState } from "react";
import { useAppSelector, useAppDispatch } from "@/store";
import { setAspectRatio } from "@/store/slices/projectSlice";
import { ChevronDown, Check } from "lucide-react";

const ratios = [
  {
    label: "To",
    ratio: "16:9",
    width: 1280,
    height: 720,
    desc: "YouTube và các site phát trực tuyến",
    iconClass: "w-[28px] h-[16px]",
  },
  {
    label: "Dọc",
    ratio: "9:16",
    width: 720,
    height: 1280,
    desc: "Thước phim trên Instagram và TikTok",
    iconClass: "w-[16px] h-[28px]",
  },
  {
    label: "Hình vuông",
    ratio: "1:1",
    width: 800,
    height: 800,
    desc: "Bài đăng Instagram",
    iconClass: "w-[20px] h-[20px]",
  },
  {
    label: "Cổ điển",
    ratio: "4:3",
    width: 800,
    height: 600,
    desc: "Truyền hình và máy chiếu cũ",
    iconClass: "w-[24px] h-[18px]",
  },
  {
    label: "Mạng xã hội",
    ratio: "4:5",
    width: 640,
    height: 800,
    desc: "",
    iconClass: "w-[20px] h-[25px]",
  },
  {
    label: "Điện ảnh",
    ratio: "21:9",
    width: 1680,
    height: 720,
    desc: "",
    iconClass: "w-[32px] h-[14px]",
  },
  {
    label: "Chân dung",
    ratio: "2:3",
    width: 720,
    height: 1080,
    desc: "",
    iconClass: "w-[16px] h-[24px]",
  },
];

export default function AspectRatiosDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { aspectRatio } = useAppSelector((state) => state.projectState);
  const dispatch = useAppDispatch();

  const handleSelect = (ratio: string) => {
    dispatch(setAspectRatio(ratio));
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left z-50">
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex justify-center items-center w-full rounded-md border border-gray-700 shadow-sm px-2 py-1 bg-[#1E1D21] text-sm font-medium text-white hover:bg-[#27272A] focus:outline-hidden"
          id="menu-button"
          aria-expanded="true"
          aria-haspopup="true">
          <span className="mr-2">Kích cỡ</span>
          <span className="text-gray-400 text-xs">{aspectRatio}</span>
          <ChevronDown
            className="ml-2 h-4 w-4 text-gray-400"
            aria-hidden="true"
          />
        </button>
      </div>

      {isOpen && (
        <div
          className="origin-top-left absolute right-0 mt-2 w-72 rounded-md shadow-lg bg-[#1E1D21] border border-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-hidden"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button">
          <div className="py-1" role="none">
            {ratios.map((item) => (
              <button
                key={item.ratio}
                onClick={() => handleSelect(item.ratio)}
                className={`w-full text-left p-2 text-sm flex items-center justify-between hover:bg-[#27272A] transition-colors ${
                  aspectRatio === item.ratio
                    ? "bg-[#27272A] text-white"
                    : "text-gray-300"
                } cursor-pointer`}
                role="menuitem">
                <div className="flex items-center gap-2">
                  {/* Icon representation of aspect ratio */}
                  <div className="w-8 flex justify-center items-center">
                    <div
                      className={`border-2 border-current rounded-sm ${item.iconClass}`}></div>
                  </div>
                  <div>
                    <div className="font-medium flex items-center gap-1">
                      {item.label}{" "}
                      <span className="text-gray-500 text-xs">
                        {item.ratio}
                      </span>
                    </div>
                    {item.desc && (
                      <div className="text-xs text-gray-500 truncate max-w-[220px]">
                        {item.desc}
                      </div>
                    )}
                  </div>
                </div>
                {aspectRatio === item.ratio && (
                  <Check className="h-4 w-4 text-blue-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
