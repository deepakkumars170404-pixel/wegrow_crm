import React from "react";
import { LeadPriority, LeadStatus, PipelineStage } from "@/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status?: LeadStatus | PipelineStage | string;
  type?: "status" | "priority" | "role" | "followup";
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = "status",
  className,
}) => {
  if (!status) return null;

  if (type === "priority") {
    const priority = status as LeadPriority;
    let colorClass = "bg-slate-100 text-slate-700 border-slate-200";
    let dotClass = "bg-slate-400";

    if (priority === "Hot") {
      colorClass = "bg-rose-50 text-rose-700 border-rose-200";
      dotClass = "bg-rose-500";
    } else if (priority === "Warm") {
      colorClass = "bg-amber-50 text-amber-700 border-amber-200";
      dotClass = "bg-amber-500";
    } else if (priority === "Cold") {
      colorClass = "bg-sky-50 text-sky-700 border-sky-200";
      dotClass = "bg-sky-500";
    }

    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border",
          colorClass,
          className
        )}
      >
        <span className={cn("w-1.5 h-1.5 rounded-full", dotClass)} />
        {priority}
      </span>
    );
  }

  // Follow-up status
  if (type === "followup") {
    let colorClass = "bg-slate-100 text-slate-700 border-slate-200";
    if (status === "Today") colorClass = "bg-amber-50 text-amber-700 border-amber-300";
    if (status === "Tomorrow") colorClass = "bg-blue-50 text-blue-700 border-blue-200";
    if (status === "Overdue") colorClass = "bg-rose-50 text-rose-700 border-rose-300 font-bold animate-pulse";
    if (status === "Upcoming") colorClass = "bg-purple-50 text-purple-700 border-purple-200";
    if (status === "Completed") colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";

    return (
      <span
        className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
          colorClass,
          className
        )}
      >
        {status}
      </span>
    );
  }

  // Lead status styling
  let badgeStyle = "bg-slate-100 text-slate-700 border-slate-200";

  switch (status) {
    case "New":
    case "New Enquiry":
      badgeStyle = "bg-blue-50 text-blue-700 border-blue-200";
      break;
    case "Contacted":
      badgeStyle = "bg-indigo-50 text-indigo-700 border-indigo-200";
      break;
    case "Interested":
      badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
      break;
    case "Busy":
      badgeStyle = "bg-orange-50 text-orange-700 border-orange-200";
      break;
    case "Call Later":
      badgeStyle = "bg-amber-50 text-amber-700 border-amber-200";
      break;
    case "Not Interested":
    case "Lost":
      badgeStyle = "bg-rose-50 text-rose-700 border-rose-200";
      break;
    case "Counselling Scheduled":
      badgeStyle = "bg-purple-50 text-purple-700 border-purple-200";
      break;
    case "Visited Campus":
    case "Campus Visited":
      badgeStyle = "bg-teal-50 text-teal-700 border-teal-200";
      break;
    case "Fee Discussion":
      badgeStyle = "bg-yellow-50 text-yellow-800 border-yellow-300";
      break;
    case "Admitted":
      badgeStyle = "bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold";
      break;
    default:
      badgeStyle = "bg-slate-100 text-slate-700 border-slate-200";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border whitespace-nowrap",
        badgeStyle,
        className
      )}
    >
      {status}
    </span>
  );
};

