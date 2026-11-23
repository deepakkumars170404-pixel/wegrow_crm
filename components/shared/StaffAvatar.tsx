"use client";

import React, { useRef } from "react";
import { Camera, X, User } from "lucide-react";

interface StaffAvatarProps {
  name: string;
  avatar?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  ringColor?: string;
  editable?: boolean;
  onUpload?: (dataUrl: string) => void;
  onRemove?: () => void;
  title?: string;
}

const SIZE_CLASSES = {
  xs: { box: "w-7 h-7 text-xs", text: "text-xs font-bold", icon: "w-3 h-3" },
  sm: { box: "w-8 h-8 text-xs", text: "text-xs font-bold", icon: "w-3.5 h-3.5" },
  md: { box: "w-10 h-10 text-sm", text: "text-sm font-bold", icon: "w-4 h-4" },
  lg: { box: "w-12 h-12 text-base", text: "text-base font-extrabold", icon: "w-4 h-4" },
  xl: { box: "w-14 h-14 text-xl", text: "text-xl font-black", icon: "w-5 h-5" },
  "2xl": { box: "w-16 h-16 text-2xl", text: "text-2xl font-black", icon: "w-6 h-6" },
};

/**
 * Returns consistent, high-contrast, professional colors based on the staff member's name initial.
 */
export const getAvatarColor = (name: string) => {
  const char = (name || "W").trim().charAt(0).toUpperCase();

  switch (char) {
    case "T": // Thavabalan (Owner - WeGrow Navy & Gold)
      return {
        bg: "bg-[#142B52]",
        text: "text-[#D5A52B]",
        ring: "ring-[#142B52]/20",
        border: "border-[#D5A52B]/40",
      };
    case "L": // LakshmiPriya (Admin / GM & Telecaller)
      return {
        bg: "bg-purple-600",
        text: "text-white",
        ring: "ring-purple-200",
        border: "border-purple-300",
      };
    case "G": // Gopinath (HR & Admin)
      return {
        bg: "bg-teal-600",
        text: "text-white",
        ring: "ring-teal-200",
        border: "border-teal-300",
      };
    case "M": // MuthuSelvi (Senior Telecaller)
      return {
        bg: "bg-emerald-600",
        text: "text-white",
        ring: "ring-emerald-200",
        border: "border-emerald-300",
      };
    case "D": // Devi Priya (Senior Telecaller)
      return {
        bg: "bg-blue-600",
        text: "text-white",
        ring: "ring-blue-200",
        border: "border-blue-300",
      };
    case "S": // Subhashini (Telecaller)
      return {
        bg: "bg-amber-600",
        text: "text-white",
        ring: "ring-amber-200",
        border: "border-amber-300",
      };
    case "P": // Priya
      return {
        bg: "bg-rose-600",
        text: "text-white",
        ring: "ring-rose-200",
        border: "border-rose-300",
      };
    case "R": // Rahul
      return {
        bg: "bg-cyan-700",
        text: "text-white",
        ring: "ring-cyan-200",
        border: "border-cyan-300",
      };
    default:
      return {
        bg: "bg-indigo-600",
        text: "text-white",
        ring: "ring-indigo-200",
        border: "border-indigo-300",
      };
  }
};

export const StaffAvatar: React.FC<StaffAvatarProps> = ({
  name,
  avatar,
  size = "md",
  className = "",
  ringColor,
  editable = false,
  onUpload,
  onRemove,
  title,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sizeConfig = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const colors = getAvatarColor(name);
  const initial = (name || "W").trim().charAt(0).toUpperCase();

  const hasCustomImage = Boolean(
    avatar &&
      (avatar.startsWith("data:image") ||
        (avatar.startsWith("http") && !avatar.includes("images.unsplash.com")))
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 3MB)
    if (file.size > 3 * 1024 * 1024) {
      alert("Image size should be less than 3MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl && onUpload) {
        onUpload(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative inline-flex items-center justify-center flex-shrink-0 group select-none">
      {hasCustomImage ? (
        <img
          src={avatar}
          alt={name}
          title={title || name}
          className={`rounded-full object-cover shadow-sm ${sizeConfig.box} ${
            ringColor || colors.ring
          } ${className}`}
        />
      ) : (
        <div
          title={title || `${name} (Initial Avatar)`}
          className={`rounded-full flex items-center justify-center shadow-sm border ${colors.bg} ${colors.text} ${colors.border} ${sizeConfig.box} ${className}`}
        >
          <span className={sizeConfig.text}>{initial}</span>
        </div>
      )}

      {/* Editable Overlay / Camera Badge */}
      {editable && onUpload && (
        <>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Upload / Change Staff Photo"
            className="absolute -bottom-1 -right-1 bg-white hover:bg-slate-100 text-slate-700 p-1 rounded-full shadow-md border border-slate-200 transition-transform active:scale-90 cursor-pointer z-10"
          >
            <Camera className="w-3 h-3 text-[#142B52]" />
          </button>
        </>
      )}
    </div>
  );
};
