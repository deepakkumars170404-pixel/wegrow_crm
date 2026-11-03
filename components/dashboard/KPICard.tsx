import React from "react";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  subtext?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  isPositive = true,
  subtext,
  icon: Icon,
  iconColor = "text-[#142B52]",
  iconBg = "bg-[#142B52]/10",
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-soft hover:shadow-card transition-all">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
            {value}
          </h3>
        </div>
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", iconBg)}>
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
      </div>

      <div className="mt-3.5 flex items-center justify-between text-xs pt-3 border-t border-slate-100">
        {change && (
          <div className="flex items-center gap-1 font-semibold">
            {isPositive ? (
              <span className="flex items-center text-emerald-600 gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" />
                {change}
              </span>
            ) : (
              <span className="flex items-center text-rose-600 gap-0.5">
                <TrendingDown className="w-3.5 h-3.5" />
                {change}
              </span>
            )}
            <span className="text-slate-400 font-normal">vs last period</span>
          </div>
        )}
        {subtext && !change && (
          <span className="text-slate-500 font-medium">{subtext}</span>
        )}
      </div>
    </div>
  );
};

