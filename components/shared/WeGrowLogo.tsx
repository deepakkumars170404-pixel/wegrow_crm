import React from "react";
import { GraduationCap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface WeGrowLogoProps {
  collapsed?: boolean;
  theme?: "dark" | "light";
  className?: string;
}

export const WeGrowLogo: React.FC<WeGrowLogoProps> = ({
  collapsed = false,
  theme = "dark",
  className,
}) => {
  const isDark = theme === "dark";

  return (
    <div className={cn("flex items-center gap-3 select-none", className)}>
      {/* Icon Emblem */}
      <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#D5A52B] to-[#B88A1B] text-[#142B52] shadow-md shadow-[#D5A52B]/20 flex-shrink-0">
        <GraduationCap className="w-6 h-6 stroke-[2.2]" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#D5A52B]"></span>
        </span>
      </div>

      {!collapsed && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={cn(
                "font-extrabold text-lg tracking-tight",
                isDark ? "text-white" : "text-[#142B52]"
              )}
            >
              WE<span className="text-[#D5A52B]">GROW</span>
            </span>
            <span className="bg-[#D5A52B]/15 text-[#D5A52B] border border-[#D5A52B]/30 text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase">
              CRM
            </span>
          </div>
          <span
            className={cn(
              "text-[10px] tracking-wider uppercase font-medium mt-0.5",
              isDark ? "text-slate-400" : "text-slate-500"
            )}
          >
            Skill Campus
          </span>
        </div>
      )}
    </div>
  );
};

