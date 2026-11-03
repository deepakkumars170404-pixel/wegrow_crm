"use client";

import React, { useState } from "react";
import {
  PhoneCall,
  Phone,
  PhoneOff,
  ChevronDown,
  ChevronUp,
  X,
  Volume2,
  Mic,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { useCRM } from "@/context/CRMContext";

export const PhoneBridgeWidget: React.FC = () => {
  const { leads, activeUserRole, initiateCall, addToast } = useCRM();

  // Owner only has data monitoring & analytics view
  if (activeUserRole === "Owner" || activeUserRole === "Owner / MD") {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [activeLead, setActiveLead] = useState<any>(leads[0] || null);

  const handleStartCall = (lead = activeLead) => {
    setActiveLead(lead);
    if (lead) {
      initiateCall(lead);
    }
  };

  const handleHangup = () => {
    fetch("/api/microsip/hangup", { method: "POST" }).catch(() => {});
    addToast("MicroSIP call ended", "info");
  };

  return (
    <div className="fixed bottom-4 right-5 z-40 select-none">
      {/* Minimized Docked Bar */}
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full shadow-2xl border transition-all duration-200 transform hover:scale-105 bg-[#142B52] hover:bg-[#1E3B6E] text-white border-[#244B7A]"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>

          <PhoneCall className="w-4 h-4 text-[#D5A52B]" />
          <span className="text-xs font-bold tracking-tight">
            JioFiber Telephony: Online (+91 4562 355214)
          </span>
          <ChevronUp className="w-3.5 h-3.5 text-slate-300 ml-1" />
        </button>
      ) : (
        /* Expanded Floating Softphone Window */
        <div className="w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-[#142B52] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#D5A52B] text-[#142B52] flex items-center justify-center font-bold">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold tracking-tight">
                  JioFiber MicroSIP Telephony
                </h4>
                <p className="text-[10px] text-slate-300">
                  Line: <span className="text-emerald-400 font-bold">+91 4562 355214</span> (Active)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
                title="Minimize"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Dialer Box */}
          <div className="p-4 space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Select Lead to Call
              </label>
              <select
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                value={activeLead?.id}
                onChange={(e) => {
                  const found = leads.find((l) => l.id === e.target.value);
                  if (found) setActiveLead(found);
                }}
              >
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.studentName} ({l.phone}) - {l.courseInterested}
                  </option>
                ))}
              </select>
            </div>

            {activeLead && (
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">{activeLead.studentName}</h5>
                    <p className="text-[11px] font-mono text-slate-500">{activeLead.phone}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {activeLead.priority}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStartCall(activeLead)}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call in MicroSIP</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleHangup}
                    className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-semibold text-xs flex items-center gap-1 transition-all"
                    title="End Call in MicroSIP"
                  >
                    <PhoneOff className="w-3.5 h-3.5 text-rose-600" />
                    <span>Hangup</span>
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Mic className="w-3 h-3 text-emerald-500" /> PC Headset Ready
              </span>
              <span className="flex items-center gap-1">
                <Volume2 className="w-3 h-3 text-blue-500" /> Speaker Ready
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
