"use client";

import React, { useState, useEffect } from "react";
import {
  PhoneCall,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  Grid,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  CheckCircle2,
  Clock,
  User,
} from "lucide-react";
import { useCRM } from "@/context/CRMContext";

export const PhoneBridgeWidget: React.FC = () => {
  const { leads, addCallRecord, activeUserRole, initiateCall } = useCRM();

  // Owner only has data monitoring & analytics view, not operational telephony dialer
  if (activeUserRole === "Owner" || activeUserRole === "Owner / MD") {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [activeLead, setActiveLead] = useState<any>(leads[0] || null);
  const [disposition, setDisposition] = useState("Interested");
  const [remarks, setRemarks] = useState("");
  const [agentStatus, setAgentStatus] = useState<"Online" | "In Call" | "Break">("Online");

  useEffect(() => {
    let timer: any = null;
    if (isCallActive) {
      setAgentStatus("In Call");
      timer = setInterval(() => setCallDuration((s) => s + 1), 1000);
    } else {
      setAgentStatus("Online");
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [isCallActive]);

  const formatSecs = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleStartCall = (lead = activeLead) => {
    setActiveLead(lead);
    if (lead) {
      initiateCall(lead);
    }
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    fetch('/api/microsip/hangup', { method: 'POST' }).catch(() => {});
  };

  const handleSaveCall = () => {
    if (!activeLead) return;
    addCallRecord(activeLead.id, {
      callerName: "Priya Sharma",
      outcome: disposition,
      duration: formatSecs(callDuration || 90),
      remarks: remarks || `WeGrow Telephony Call logged as ${disposition}`,
      nextFollowUpDate: "2026-10-31",
      nextFollowUpTime: "11:00 AM",
    });
    setIsCallActive(false);
    setRemarks("");
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-4 right-5 z-40 select-none">
      {/* Minimized Docked Bar */}
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-full shadow-2xl border transition-all duration-200 transform hover:scale-105 ${
            isCallActive
              ? "bg-[#142B52] text-white border-[#D5A52B] ring-4 ring-[#D5A52B]/30"
              : "bg-[#142B52] hover:bg-[#1E3B6E] text-white border-[#244B7A]"
          }`}
        >
          <span className="relative flex h-3 w-3">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isCallActive ? "bg-[#D5A52B]" : "bg-emerald-400"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                isCallActive ? "bg-[#D5A52B]" : "bg-emerald-500"
              }`}
            />
          </span>

          <PhoneCall className="w-4 h-4 text-[#D5A52B]" />
          <span className="text-xs font-bold tracking-tight">
            WeGrow Telephony™: {isCallActive ? `Call in Progress (${formatSecs(callDuration)})` : "Softphone Ready"}
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
                  WeGrow Telephony™ Softphone
                </h4>
                <p className="text-[10px] text-slate-300">
                  Agent: Priya Sharma • Status: <span className="text-emerald-400 font-bold">{agentStatus}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
                title="Minimize Softphone"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setIsCallActive(false);
                  setIsOpen(false);
                }}
                className="p-1 rounded text-slate-400 hover:text-white"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Call or Idle State */}
          <div className="p-4 space-y-3">
            {isCallActive ? (
              /* Active In-Call Controls */
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#142B52] text-[#D5A52B] font-bold text-lg flex items-center justify-center mx-auto calling-pulse">
                  {activeLead?.studentName.charAt(0) || "S"}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {activeLead?.studentName}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {activeLead?.phone} • {activeLead?.courseInterested}
                  </p>
                  <p className="text-lg font-mono font-bold text-[#142B52] mt-1.5">
                    {formatSecs(callDuration)}
                  </p>
                </div>

                {/* Softphone In-Call Controls */}
                <div className="flex items-center justify-center gap-3 pt-1">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-2.5 rounded-full transition-colors ${
                      isMuted ? "bg-rose-100 text-rose-600" : "bg-white border text-slate-700"
                    }`}
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={handleEndCall}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-bold shadow-md transition-transform active:scale-95"
                  >
                    End Call
                  </button>
                </div>
              </div>
            ) : (
              /* Idle / Ready to Call */
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Select Student to Dial:
                </label>
                <select
                  value={activeLead?.id}
                  onChange={(e) => {
                    const l = leads.find((lead) => lead.id === e.target.value);
                    if (l) setActiveLead(l);
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 bg-white"
                >
                  {leads.slice(0, 10).map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.studentName} ({l.phone}) - {l.courseInterested}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => handleStartCall()}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-white" />
                  <span>Start In-Browser Call ({activeLead?.phone})</span>
                </button>
              </div>
            )}

            {/* Quick Call Disposition Picker */}
            <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
              <label className="block font-bold text-slate-700">
                Call Outcome (Disposition):
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  "Interested",
                  "Busy",
                  "Call Tomorrow",
                  "Not Answered",
                  "Counselling",
                  "Not Interested",
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setDisposition(item)}
                    className={`py-1.5 px-1.5 rounded-lg text-[10px] font-bold border transition-all text-center ${
                      disposition === item
                        ? "bg-[#142B52] text-white border-[#142B52]"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Call Notes:
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Discussed course curriculum and fees..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1.5 text-slate-500 hover:text-slate-800 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCall}
                  className="px-4 py-2 bg-[#142B52] hover:bg-[#1E3B6E] text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Save Call Log
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

