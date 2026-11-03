"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import { cn } from "@/lib/utils";

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useCRM();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => {
        let Icon = Info;
        let borderClass = "border-sky-300";
        let iconClass = "text-sky-500";

        if (toast.type === "success") {
          Icon = CheckCircle2;
          borderClass = "border-emerald-300";
          iconClass = "text-emerald-500";
        } else if (toast.type === "warning") {
          Icon = AlertTriangle;
          borderClass = "border-amber-300";
          iconClass = "text-amber-500";
        } else if (toast.type === "error") {
          Icon = XCircle;
          borderClass = "border-rose-300";
          iconClass = "text-rose-500";
        }

        return (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto bg-white rounded-xl shadow-lg border p-3.5 flex items-start gap-3 transform transition-all duration-300 animate-in slide-in-from-bottom-3",
              borderClass
            )}
          >
            <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", iconClass)} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900">{toast.title}</p>
              {toast.message && (
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  {toast.message}
                </p>
              )}
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

