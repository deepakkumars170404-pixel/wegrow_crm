import React from "react";
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
      {/* Official App Logo Emblem */}
      <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-white overflow-hidden shadow-md shadow-blue-500/10 border border-slate-200 dark:border-slate-700/60 flex-shrink-0 p-0.5">
        <img
          src="/wegrow-logo.png"
          alt="WeGrow Telecalling App Logo"
          className="w-full h-full object-cover rounded-[10px]"
        />
        <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#0284c7]"></span>
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
              WE<span className="text-[#0284c7]">GROW</span>
            </span>
            <span className="bg-[#0284c7]/15 text-[#0284c7] border border-[#0284c7]/30 text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase">
              CRM
            </span>
          </div>
          <span
            className={cn(
              "text-[10px] tracking-wider uppercase font-semibold mt-0.5",
              isDark ? "text-slate-400" : "text-slate-500"
            )}
          >
            Telecalling App
          </span>
        </div>
      )}
    </div>
  );
};

