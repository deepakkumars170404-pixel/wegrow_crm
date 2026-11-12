"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  Grid,
  ChevronDown,
  ChevronUp,
  X,
  RotateCcw,
  Sparkles,
  Delete,
  ShieldCheck,
  CheckCircle2,
  User,
  Wifi,
  WifiOff,
  RefreshCw,
  Smartphone,
  Zap,
} from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import { Lead } from "@/types";

// DTMF Tone Generator using standard dual-tone frequencies
const playDTMFTone = (digit: string) => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const dtmfFreqs: Record<string, [number, number]> = {
      "1": [697, 1209],
      "2": [697, 1336],
      "3": [697, 1477],
      "4": [770, 1209],
      "5": [770, 1336],
      "6": [770, 1477],
      "7": [852, 1209],
      "8": [852, 1336],
      "9": [852, 1477],
      "*": [941, 1209],
      "0": [941, 1336],
      "#": [941, 1477],
    };
    const freqs = dtmfFreqs[digit] || [700, 1200];
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.frequency.value = freqs[0];
    osc2.frequency.value = freqs[1];
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.13);
    osc2.stop(ctx.currentTime + 0.13);
  } catch (e) {}
};

export const PhoneBridgeWidget: React.FC = () => {
  const {
    leads,
    activeCallLead,
    setActiveCallLead,
    isCallConnected,
    callPhase,
    callDuration,
    lastCallDuration,
    activePhoneNumber,
    initiateCall,
    endCallSession,
    openCallModal,
    addToast,
    telephonyStatus,
    telephonyMode,
    setTelephonyMode,
    refreshTelephonyStatus,
    reconnectTelephony,
  } = useCRM();

  // Selected lead for dialer (defaults to active lead or first lead)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(
    activeCallLead || leads[0] || null
  );

  // Dialpad popup state - starts clean so typing any number dials THAT number
  const [isDialpadOpen, setIsDialpadOpen] = useState(false);
  const [dialerNumber, setDialerNumber] = useState("");
  const [isWidgetDialing, setIsWidgetDialing] = useState(false);

  useEffect(() => {
    if (callPhase === "idle" && !isCallConnected) {
      setIsWidgetDialing(false);
    }
  }, [callPhase, isCallConnected]);

  const isInActiveCall = isCallConnected || isWidgetDialing || callPhase !== "idle";

  const dialInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus input and capture physical keyboard / numpad strokes when dialpad is open
  useEffect(() => {
    if (!isDialpadOpen) return;

    const timer = setTimeout(() => {
      if (dialInputRef.current) {
        dialInputRef.current.focus();
        const len = dialInputRef.current.value.length;
        dialInputRef.current.setSelectionRange(len, len);
      }
    }, 100);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement &&
        (document.activeElement.tagName === "TEXTAREA" ||
          (document.activeElement.tagName === "INPUT" &&
            document.activeElement !== dialInputRef.current))
      ) {
        return;
      }

      const key = e.key;
      if (/^[0-9*#+]$/.test(key)) {
        playDTMFTone(key);
        if (document.activeElement !== dialInputRef.current) {
          setDialerNumber((prev) => prev + key);
        }
      } else if (key === "Enter") {
        e.preventDefault();
        handleCall();
      } else if (key === "Escape") {
        e.preventDefault();
        setIsDialpadOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDialpadOpen]);

  // Format seconds to mm:ss
  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Global Escape key listener: Pressing Escape cuts the call immediately (stops IVR or active call)
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && (isCallConnected || callPhase !== "idle")) {
        e.preventDefault();
        handleHangup();
      }
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, [isCallConnected, callPhase]);

  // Sync selected lead when activeCallLead changes (preserves custom dialer input)
  useEffect(() => {
    if (activeCallLead) {
      setSelectedLead(activeCallLead);
    }
  }, [activeCallLead]);

  // Dialpad Key Click
  const handleKeyClick = (key: string) => {
    playDTMFTone(key);
    setDialerNumber((prev) => prev + key);
  };

  const handleBackspace = () => {
    setDialerNumber((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setDialerNumber("");
    setSelectedLead(null);
  };

  // Dynamic Call Handler: Always resolves the accurate number and lead
  const handleCall = (numberToCall?: string) => {
    // CRITICAL: Prioritize numberToCall, then dialerNumber
    const num = (numberToCall || dialerNumber || "").trim();
    if (!num || num === "+91" || num === "+") {
      addToast("Please enter a phone number to call", "warning");
      return;
    }

    const cleanDigits = num.replace(/\D/g, "");
    if (cleanDigits.length < 7) {
      addToast("Please enter a valid phone number (at least 7 to 10 digits)", "warning");
      return;
    }

    // Always take the exact 10 digits entered
    const exact10 = cleanDigits.slice(-10);

    // 1. Check if number matches any existing lead in the CRM database (EXACT 10-digit match ONLY)
    const matchingLead = leads.find((l) => {
      const leadDigits = l.phone.replace(/\D/g, "").slice(-10);
      return leadDigits === exact10;
    });

    // 2. Always bind to the EXACT number entered by the user
    const validLead: Lead = matchingLead
      ? {
          ...matchingLead,
          phone: exact10, // Always use the exact number requested!
        }
      : {
          id: `LD-DIRECT-${Date.now()}`,
          studentName: `Direct Dial (${exact10})`,
          phone: exact10,
          email: "direct@dial.local",
          courseInterested: "Direct Dial",
          leadSource: "Phone" as const,
          enquiryDate: new Date().toISOString().split("T")[0],
          nextFollowUpDate: "",
          nextFollowUpTime: "",
          assignedCaller: "Priya Sharma",
          status: "New" as const,
          priority: "Hot" as const,
          stage: "New Enquiry" as const,
          notes: [],
          callHistory: [],
          callCount: 1,
        };

    setSelectedLead(validLead);
    setActiveCallLead(validLead);
    setIsWidgetDialing(true);
    initiateCall(validLead);
    // Keep dialpad open so caller can see in-call controls and cut button
  };

  const handleHangup = () => {
    setIsWidgetDialing(false);
    endCallSession();
  };

  const isCustomNumber = Boolean(
    dialerNumber &&
      dialerNumber !== "+91" &&
      dialerNumber !== "+" &&
      dialerNumber.replace(/\D/g, "").length >= 7
  );
  const currentDisplayLead: Partial<Lead> = activePhoneNumber
    ? {
        studentName: activeCallLead?.studentName || `Direct: ${activePhoneNumber}`,
        phone: activePhoneNumber,
      }
    : isCustomNumber
    ? {
        studentName: `Direct: ${dialerNumber}`,
        phone: dialerNumber,
      }
    : activeCallLead || selectedLead || leads[0];
  const initialLetter = currentDisplayLead?.studentName?.charAt(0) || "D";
  const displayedPhone = activePhoneNumber || (isCustomNumber ? dialerNumber : currentDisplayLead?.phone || "");

  return (
    <>
      {/* 0. Floating Top In-Call Action Bar (Always visible on all screens during any call / IVR announcement) */}
      {isCallConnected && callPhase !== "idle" && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-top-4 duration-200 pointer-events-auto select-none">
          <div className={`bg-[#0B1528] text-white px-6 py-3 rounded-full shadow-2xl border-2 ${
            callPhase === "connected" ? "border-emerald-500 ring-4 ring-emerald-500/20" : "border-rose-500 ring-4 ring-rose-500/20"
          } flex items-center gap-5 backdrop-blur-xl`}>
            <div className="flex items-center gap-3">
              <span className={`w-3.5 h-3.5 rounded-full ${callPhase === "connected" ? "bg-emerald-400" : "bg-rose-500"} animate-ping`} />
              <div>
                <span className="text-xs font-bold text-white block">
                  {currentDisplayLead?.studentName || "Dialing"} ({displayedPhone})
                </span>
                <span className={`text-[11px] font-mono font-semibold ${callPhase === "connected" ? "text-emerald-400" : "text-[#E5B842]"}`}>
                  {callPhase === "ringing" ? "Ringing Student's Phone..." : `Connected • Live Talk: ${formatTimer(callDuration)}`}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleHangup}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-black uppercase tracking-wider rounded-full shadow-lg shadow-rose-600/50 flex items-center gap-2 transition-all cursor-pointer border border-rose-300 animate-pulse"
              title="Instantly Cut Call (Hangup) [Esc]"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Cut Call (Hangup)</span>
            </button>
          </div>
        </div>
      )}

      {/* 1. In-Page MicroSIP Calling Dialpad Drawer (Opens above the dock bar) */}
      {isDialpadOpen && (
        <div className="fixed bottom-24 right-5 z-[999] w-84 sm:w-[380px] bg-gradient-to-b from-[#112340] via-[#0E1E38] to-[#081220] text-white rounded-[28px] shadow-2xl border border-[#244B7A] overflow-hidden animate-in slide-in-from-bottom-5 duration-200 select-none">
          {/* MicroSIP Title Header */}
          <div className="bg-[#142B52] p-4 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#E5B842] text-[#142B52] flex items-center justify-center font-black shadow-md">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
                  {callPhase === "ringing" ? (
                    <span className="text-amber-300 animate-pulse">Ringing Student...</span>
                  ) : isCallConnected || callPhase === "connected" ? (
                    <span className="text-emerald-400">Live Call Active</span>
                  ) : (
                    <span>📱 Mobile SIM Dialer</span>
                  )}
                  <span
                    className={`w-2 h-2 rounded-full ${
                      callPhase === "ringing"
                        ? "bg-amber-400 animate-ping"
                        : isCallConnected || callPhase === "connected"
                        ? "bg-emerald-400 animate-pulse"
                        : telephonyStatus.connected
                        ? "bg-emerald-400"
                        : "bg-rose-500 animate-pulse"
                    }`}
                  />
                </h4>
                <p
                  className={`text-[10px] font-mono font-medium flex items-center gap-1 ${
                    callPhase === "ringing"
                      ? "text-amber-200"
                      : isCallConnected || callPhase === "connected"
                      ? "text-emerald-300 font-bold"
                      : telephonyStatus.connected
                      ? "text-emerald-300"
                      : "text-rose-300"
                  }`}
                >
                  {isCallConnected || callPhase === "connected" ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>Duration: {formatTimer(callDuration)}</span>
                    </>
                  ) : telephonyStatus.connected ? (
                    <>
                      <Wifi className="w-2.5 h-2.5 text-emerald-400" />
                      <span>Online • {telephonyStatus.wifiSSID || "Mobile SIM Online"}</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-2.5 h-2.5 text-rose-400" />
                      <span>Phone Disconnected • Click Refresh</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => reconnectTelephony()}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Sync / Reconnect Mobile Phone SIM Bridge"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsDialpadOpen(false)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Close Dialpad"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Lead Quick Selector */}
          <div className="p-3 bg-[#0B1728] border-b border-white/10">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select Lead:
              </span>
              <select
                className="flex-1 text-[11px] font-semibold px-2.5 py-1.5 bg-white/10 border border-white/15 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-[#E5B842]"
                value={selectedLead?.id}
                onChange={(e) => {
                  const lead = leads.find((l) => l.id === e.target.value);
                  if (lead) {
                    setSelectedLead(lead);
                    setActiveCallLead(lead);
                    setDialerNumber(lead.phone.replace(/[^0-9+]/g, ""));
                  }
                }}
              >
                {leads.map((l) => (
                  <option key={l.id} value={l.id} className="bg-slate-900 text-white">
                    {l.studentName} ({l.phone})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Number Display Screen with Backspace & Clear */}
          <div className="p-4 pb-2 bg-[#081220]/80">
            <div className="flex items-center justify-between bg-black/60 border border-white/10 rounded-2xl px-4 py-3 shadow-inner">
              <input
                ref={dialInputRef}
                type="text"
                value={dialerNumber}
                onChange={(e) => {
                  const val = e.target.value;
                  const lastChar = val.slice(-1);
                  if (/^[0-9*#+]$/.test(lastChar) && val.length > dialerNumber.length) {
                    playDTMFTone(lastChar);
                  }
                  setDialerNumber(val);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCall();
                  }
                }}
                placeholder="+91..."
                className="w-full bg-transparent text-xl font-mono font-bold text-[#E5B842] focus:outline-none tracking-widest"
              />
              <div className="flex items-center gap-1.5 ml-2">
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                  title="Backspace"
                >
                  <Delete className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-white bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                  title="Clear"
                >
                  C
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between px-2 pt-1.5 text-[10px] text-slate-400">
              <span>Numpad & Keyboard active</span>
              <span className="text-[#E5B842] font-semibold">Enter ↵ to Call</span>
            </div>
          </div>

          {/* Dialpad Matrix 3x4 */}
          <div className="p-4 pt-1 grid grid-cols-3 gap-2.5">
            {[
              { num: "1", sub: "" },
              { num: "2", sub: "ABC" },
              { num: "3", sub: "DEF" },
              { num: "4", sub: "GHI" },
              { num: "5", sub: "JKL" },
              { num: "6", sub: "MNO" },
              { num: "7", sub: "PQRS" },
              { num: "8", sub: "TUV" },
              { num: "9", sub: "WXYZ" },
              { num: "*", sub: "" },
              { num: "0", sub: "+" },
              { num: "#", sub: "" },
            ].map((key) => (
              <button
                key={key.num}
                type="button"
                onClick={() => handleKeyClick(key.num)}
                className="flex flex-col items-center justify-center py-2.5 rounded-2xl bg-white/[0.07] hover:bg-white/[0.16] active:bg-[#E5B842]/30 border border-white/5 active:scale-95 transition-all text-white group"
              >
                <span className="text-lg font-bold group-hover:text-[#E5B842] leading-tight">
                  {key.num}
                </span>
                {key.sub && (
                  <span className="text-[9px] font-bold text-slate-400 group-hover:text-white tracking-widest">
                    {key.sub}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Action Call & Hangup Button: Strictly Green when idle, Strictly Red when in call */}
          <div className="p-3 bg-[#0B1728] flex items-center">
            {isInActiveCall ? (
              <button
                type="button"
                onClick={handleHangup}
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 active:scale-98 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40 transition-all animate-pulse cursor-pointer"
                title="Cut Call / End Call"
              >
                <PhoneOff className="w-4 h-4" />
                <span>
                  🔴 Hangup Call (Cut) •{" "}
                  {callPhase === "ringing" ? "Ringing..." : formatTimer(callDuration)}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleCall()}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
                title="Call via Mobile SIM"
              >
                <Phone className="w-4 h-4 fill-white" />
                <span>🟢 Call via Mobile SIM</span>
              </button>
            )}
          </div>

          {/* Mobile Calling Auto-Sync Info Strip */}
          <div className="p-3 bg-[#0B1728] border-t border-white/10 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mobile SIM Calling</span>
              </span>
              <span className="text-[10px] text-amber-300 font-mono font-medium flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Auto-Saves Talk Time</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-snug">
              Speak directly on your mobile phone. Immediately after cutting the call on your phone, the exact spoken duration will be automatically added to the CRM!
            </p>
          </div>
        </div>
      )}

      {/* 2. Sleek Floating Softphone Dock Bar */}
      <div className="fixed bottom-4 right-5 z-40 select-none">
        <div className="bg-[#0F1E36] text-white rounded-2xl shadow-2xl border border-[#244B7A]/80 px-4 py-2.5 flex items-center gap-3.5 backdrop-blur-md">
          {/* Avatar Letter Circle */}
          <div
            onClick={openCallModal}
            className="w-10 h-10 rounded-full bg-[#E5B842] text-[#142B52] font-black text-lg flex items-center justify-center shadow-md cursor-pointer hover:scale-105 transition-transform"
            title="Open Call Disposition Modal"
          >
            {initialLetter}
          </div>

          {/* Lead Name & Phone */}
          <div
            onClick={openCallModal}
            className="cursor-pointer hover:opacity-90 transition-opacity"
            title="Open Call Disposition Modal"
          >
            <h4 className="text-sm font-bold text-white tracking-tight leading-tight flex items-center gap-1.5">
              {currentDisplayLead?.studentName || "Direct Dial"}
            </h4>
            <p className="text-[11px] text-slate-300 font-mono leading-tight mt-0.5">
              {displayedPhone || "+91..."}
            </p>
          </div>

          {/* Call Timer (Bright Gold Font) */}
          <div className="px-2">
            <span className="text-sm font-mono font-bold text-[#E5B842] tracking-wider">
              {isCallConnected
                ? formatTimer(callDuration)
                : lastCallDuration
                ? `Ended • ${lastCallDuration}`
                : "00:00"}
            </span>
          </div>

          {/* Control Buttons Row (Dialpad & Call/End) */}
          <div className="flex items-center gap-1.5">
            {/* Dialpad Toggle Button */}
            <button
              type="button"
              onClick={() => setIsDialpadOpen(!isDialpadOpen)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isDialpadOpen
                  ? "bg-[#E5B842] text-[#142B52] shadow-md shadow-[#E5B842]/30"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
              title="Toggle Mobile Dialpad"
            >
              <Grid className="w-4 h-4" />
            </button>

            {/* End Call Button / Start Call Button: Strictly Green when idle, Strictly Red when in call */}
            {isInActiveCall ? (
              <button
                type="button"
                onClick={handleHangup}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-full shadow-md shadow-rose-950/40 transition-transform active:scale-95 flex items-center gap-1.5 animate-pulse cursor-pointer"
                title="End Active Call (Cut)"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                <span>🔴 Cut Call ({callPhase === "ringing" ? "Ringing..." : formatTimer(callDuration)})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const hasCustom = Boolean(
                    dialerNumber &&
                      dialerNumber !== "+91" &&
                      dialerNumber !== "+" &&
                      dialerNumber.replace(/\D/g, "").length >= 7
                  );
                  if (hasCustom) {
                    handleCall(dialerNumber);
                  } else if (currentDisplayLead?.phone) {
                    handleCall(currentDisplayLead.phone);
                  } else if (dialerNumber && dialerNumber !== "+91") {
                    handleCall(dialerNumber);
                  }
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-full shadow-md shadow-emerald-950/40 transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
                title="Start Call via Mobile SIM"
              >
                <Phone className="w-3.5 h-3.5 fill-white" />
                <span>🟢 Call SIM</span>
              </button>
            )}
          </div>

          {/* Telephony Presence Indicator & Quick Sync */}
          {telephonyStatus.connected ? (
            <button
              type="button"
              onClick={() => refreshTelephonyStatus(true)}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-all"
              title="Click to Refresh telephony connection"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{telephonyMode === "mobile" ? "Mobile SIM Online" : `JioFiber Online (${telephonyStatus.wifiSSID})`}</span>
              <RefreshCw className="w-2.5 h-2.5 text-emerald-400 ml-0.5" />
            </button>
          ) : telephonyStatus.status === "wifi_disconnected" || !telephonyStatus.connected ? (
            <button
              type="button"
              onClick={() => reconnectTelephony()}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/40 text-[11px] font-semibold text-rose-300 animate-pulse hover:bg-rose-500/25 transition-all cursor-pointer"
              title="Click to Connect Phone"
            >
              <WifiOff className="w-3 h-3 text-rose-400" />
              <span>{telephonyMode === "mobile" ? "Sync Mobile Phone" : "Sync Office Wi-Fi"}</span>
              <RefreshCw className="w-2.5 h-2.5 text-rose-400 ml-0.5" />
            </button>
          ) : (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-semibold text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Connecting Telephony...</span>
            </div>
          )}

          {/* Chevron / Drawer Toggle */}
          <button
            type="button"
            onClick={() => setIsDialpadOpen(!isDialpadOpen)}
            className="p-1 rounded text-slate-400 hover:text-white transition-colors"
            title="Toggle Dialpad Drawer"
          >
            {isDialpadOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </>
  );
};
