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
    callDuration,
    lastCallDuration,
    initiateCall,
    endCallSession,
    openCallModal,
    addToast,
    telephonyStatus,
    refreshTelephonyStatus,
  } = useCRM();

  // Selected lead for dialer (defaults to active lead or first lead)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(
    activeCallLead || leads[0] || null
  );

  // Dialpad popup state
  const [isDialpadOpen, setIsDialpadOpen] = useState(false);
  const [dialerNumber, setDialerNumber] = useState(
    selectedLead ? selectedLead.phone.replace(/[^0-9+]/g, "") : "+91"
  );

  // Softphone modes
  const [dndActive, setDndActive] = useState(false);
  const [autoAnswer, setAutoAnswer] = useState(false);
  const [recordingActive, setRecordingActive] = useState(false);
  const [speakerTested, setSpeakerTested] = useState(false);

  // Real Mic & Speaker state
  const [isMuted, setIsMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Format seconds to mm:ss
  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Sync selected lead when activeCallLead changes
  useEffect(() => {
    if (activeCallLead) {
      setSelectedLead(activeCallLead);
      setDialerNumber(activeCallLead.phone.replace(/[^0-9+]/g, ""));
    }
  }, [activeCallLead]);

  // Request browser mic when widget is active
  useEffect(() => {
    if (isCallConnected || isDialpadOpen) {
      startMicStream();
    } else {
      stopMicStream();
    }
    return () => stopMicStream();
  }, [isCallConnected, isDialpadOpen]);

  const startMicStream = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        micStreamRef.current = stream;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateAudioMeter = () => {
            if (!micStreamRef.current) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            const level = Math.min(100, Math.round((avg / 255) * 160));
            setAudioLevel(level);
            animFrameRef.current = requestAnimationFrame(updateAudioMeter);
          };
          updateAudioMeter();
        }
      }
    } catch (e) {}
  };

  const stopMicStream = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    setAudioLevel(0);
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (micStreamRef.current) {
      micStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = !next));
    }
    addToast(next ? "Microphone Muted" : "Microphone Live", "info");
  };

  const testSpeaker = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.45);

        setSpeakerTested(true);
        addToast("Speaker / Headset chime played", "success");
        setTimeout(() => setSpeakerTested(false), 2000);
      }
    } catch (e) {}
  };

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
  };

  const handleCall = (numberToCall?: string) => {
    const num = (numberToCall || dialerNumber).trim();
    if (!num) {
      addToast("Please enter a phone number to call", "warning");
      return;
    }

    const currentLead =
      selectedLead ||
      leads.find((l) => l.phone.replace(/\D/g, "") === num.replace(/\D/g, "")) || {
        id: `LD-CUSTOM`,
        studentName: "Direct Dial",
        phone: num,
        email: "direct@dial.local",
        courseInterested: "Direct Calling",
        leadSource: "Phone" as const,
        enquiryDate: new Date().toISOString().split("T")[0],
        nextFollowUpDate: "",
        nextFollowUpTime: "",
        assignedCaller: "Priya Sharma",
        status: "New" as const,
        priority: "Hot" as const,
        stage: "New Enquiry" as const,
        leadScore: 70,
        tags: ["MicroSIP"],
        timeline: [],
        notes: [],
        callHistory: [],
        createdDate: new Date().toISOString().split("T")[0],
        lastContacted: "Just now",
        callCount: 1,
      };

    initiateCall(currentLead);
    setIsDialpadOpen(false);
  };

  const handleHangup = () => {
    endCallSession();
  };

  const currentDisplayLead = activeCallLead || selectedLead || leads[0];
  const initialLetter = currentDisplayLead?.studentName?.charAt(0) || "V";

  return (
    <>
      {/* 1. In-Page MicroSIP Calling Dialpad Drawer (Opens above the dock bar) */}
      {isDialpadOpen && (
        <div className="fixed bottom-24 right-5 z-40 w-84 sm:w-[380px] bg-gradient-to-b from-[#112340] via-[#0E1E38] to-[#081220] text-white rounded-[28px] shadow-2xl border border-[#244B7A] overflow-hidden animate-in slide-in-from-bottom-5 duration-200 select-none">
          {/* MicroSIP Title Header */}
          <div className="bg-[#142B52] p-4 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#E5B842] text-[#142B52] flex items-center justify-center font-black shadow-md">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
                  MicroSIP Executive Dialer
                  <span
                    className={`w-2 h-2 rounded-full ${
                      telephonyStatus.connected
                        ? "bg-emerald-400 animate-pulse"
                        : "bg-rose-500 animate-pulse"
                    }`}
                  />
                </h4>
                <p
                  className={`text-[10px] font-mono font-medium flex items-center gap-1 ${
                    telephonyStatus.connected ? "text-emerald-300" : "text-rose-300"
                  }`}
                >
                  {telephonyStatus.connected ? (
                    <>
                      <Wifi className="w-2.5 h-2.5" />
                      <span>Online • {telephonyStatus.wifiSSID}</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-2.5 h-2.5" />
                      <span>Wi-Fi Offline • No Calling</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
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
          <div className="p-4 bg-[#081220]/80">
            <div className="flex items-center justify-between bg-black/60 border border-white/10 rounded-2xl px-4 py-3 shadow-inner">
              <input
                type="text"
                value={dialerNumber}
                onChange={(e) => setDialerNumber(e.target.value)}
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
          </div>

          {/* Circular Luxury Softphone Keypad Grid */}
          <div className="px-5 py-2 grid grid-cols-3 gap-3 justify-items-center">
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
                className="w-16 h-14 bg-white/5 hover:bg-white/15 active:scale-90 border border-white/10 hover:border-[#E5B842]/50 rounded-2xl flex flex-col items-center justify-center transition-all duration-100 group shadow-md"
              >
                <span className="text-xl font-bold text-white group-hover:text-[#E5B842] leading-none transition-colors">
                  {key.num}
                </span>
                {key.sub && (
                  <span className="text-[9px] font-semibold text-[#E5B842] tracking-wider mt-0.5 leading-none">
                    {key.sub}
                  </span>
                )}
              </button>
            ))}

            {/* Utility Row: Redial (R), Plus (+), and Clear (C) */}
            <button
              type="button"
              onClick={() => {
                if (selectedLead) handleCall(selectedLead.phone);
              }}
              className="w-16 h-10 bg-white/5 hover:bg-white/15 active:scale-95 border border-white/10 rounded-xl flex items-center justify-center text-xs font-bold text-slate-300"
              title="Redial Selected Lead"
            >
              R
            </button>
            <button
              type="button"
              onClick={() => handleKeyClick("+")}
              className="w-16 h-10 bg-white/5 hover:bg-white/15 active:scale-95 border border-white/10 rounded-xl flex items-center justify-center text-base font-bold text-[#E5B842]"
            >
              +
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="w-16 h-10 bg-white/5 hover:bg-white/15 active:scale-95 border border-white/10 rounded-xl flex items-center justify-center text-xs font-bold text-rose-300"
            >
              C
            </button>
          </div>

          {/* Action Row: Call via MicroSIP & Hangup */}
          <div className="px-5 py-3 flex items-center gap-2">
            {isCallConnected ? (
              <button
                type="button"
                onClick={handleHangup}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 active:scale-98 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40 transition-all"
              >
                <PhoneOff className="w-4 h-4" />
                <span>Hangup Call ({formatTimer(callDuration)})</span>
              </button>
            ) : !telephonyStatus.connected && telephonyStatus.status === "wifi_disconnected" ? (
              <button
                type="button"
                onClick={() => handleCall()}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 active:scale-98 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 transition-all"
                title="JioFiber Wi-Fi is disconnected. Please connect to Wi-Fi to call."
              >
                <WifiOff className="w-4 h-4" />
                <span>Connect Wi-Fi to Call</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleCall()}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all"
                >
                  <Phone className="w-4 h-4 fill-white" />
                  <span>Call via MicroSIP</span>
                </button>
                <button
                  type="button"
                  onClick={handleHangup}
                  className="py-3 px-4 bg-rose-600 hover:bg-rose-500 active:scale-98 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950/40 transition-all"
                  title="Cut Call / End Call"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>Hangup</span>
                </button>
              </>
            )}
          </div>

          {/* Audio Sliders & Status Strip (Like MicroSIP in user image) */}
          <div className="p-3 bg-[#0B1728] border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <Volume2 className="w-3 h-3 text-[#E5B842]" />
                <button
                  type="button"
                  onClick={testSpeaker}
                  className="hover:text-white underline font-semibold"
                >
                  {speakerTested ? "Chime Playing..." : "Test Speaker"}
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <Mic className="w-3 h-3 text-emerald-400" />
                <span>Live Mic Level:</span>
                <div className="w-12 h-1.5 bg-black/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-75"
                    style={{ width: `${audioLevel}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Toggle Modes: DND, AA, CONF, REC */}
            <div className="flex items-center justify-between gap-1 pt-1 border-t border-white/5 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setDndActive(!dndActive)}
                className={`flex-1 py-1 rounded border transition-colors ${
                  dndActive
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                    : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
                }`}
              >
                DND
              </button>
              <button
                type="button"
                onClick={() => setAutoAnswer(!autoAnswer)}
                className={`flex-1 py-1 rounded border transition-colors ${
                  autoAnswer
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                    : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
                }`}
              >
                AA
              </button>
              <button
                type="button"
                className="flex-1 py-1 rounded border bg-white/5 text-slate-400 border-white/10 hover:text-white"
              >
                CONF
              </button>
              <button
                type="button"
                onClick={() => setRecordingActive(!recordingActive)}
                className={`flex-1 py-1 rounded border transition-colors ${
                  recordingActive
                    ? "bg-red-500/20 text-red-300 border-red-500/40"
                    : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
                }`}
              >
                REC
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Sleek Floating Softphone Dock Bar (Exact match to user's picture) */}
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
              {currentDisplayLead?.studentName || "Vijay (Live Test)"}
            </h4>
            <p className="text-[11px] text-slate-300 font-mono leading-tight mt-0.5">
              {currentDisplayLead?.phone || "+91 90923 22803"}
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

          {/* Control Buttons Row (Mic, Dialpad, Speaker, End Call) */}
          <div className="flex items-center gap-1.5">
            {/* Microphone Toggle */}
            <button
              type="button"
              onClick={toggleMute}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                isMuted
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
              title={isMuted ? "Unmute Mic" : "Mute Mic"}
            >
              {isMuted ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Dialpad Toggle Button */}
            <button
              type="button"
              onClick={() => setIsDialpadOpen(!isDialpadOpen)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                isDialpadOpen
                  ? "bg-[#E5B842] text-[#142B52] shadow-md shadow-[#E5B842]/30"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
              title="Toggle MicroSIP Calling Dialpad"
            >
              <Grid className="w-4 h-4" />
            </button>

            {/* Speaker Test Button */}
            <button
              type="button"
              onClick={testSpeaker}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
              title="Test Headset Speaker Audio"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            {/* End Call Button / Start Call Button */}
            {isCallConnected ? (
              <button
                type="button"
                onClick={handleHangup}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-full shadow-md shadow-rose-950/40 transition-transform active:scale-95 flex items-center gap-1.5"
                title="End Active Call"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                <span>End Call</span>
              </button>
            ) : !telephonyStatus.connected && telephonyStatus.status === "wifi_disconnected" ? (
              <button
                type="button"
                onClick={() => {
                  if (currentDisplayLead) handleCall(currentDisplayLead.phone);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-full shadow-md shadow-amber-950/40 transition-transform active:scale-95 flex items-center gap-1.5"
                title="JioFiber Wi-Fi is disconnected"
              >
                <WifiOff className="w-3.5 h-3.5" />
                <span>Wi-Fi Offline</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (currentDisplayLead) handleCall(currentDisplayLead.phone);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-full shadow-md shadow-emerald-950/40 transition-transform active:scale-95 flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5 fill-white" />
                <span>Call Lead</span>
              </button>
            )}
          </div>

          {/* MicroSIP JioFiber Presence Indicator */}
          {telephonyStatus.connected ? (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-semibold text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>JioFiber Online ({telephonyStatus.wifiSSID})</span>
            </div>
          ) : telephonyStatus.status === "wifi_disconnected" ? (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/40 text-[11px] font-semibold text-rose-300 animate-pulse">
              <WifiOff className="w-3 h-3 text-rose-400" />
              <span>Wi-Fi Disconnected</span>
            </div>
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
