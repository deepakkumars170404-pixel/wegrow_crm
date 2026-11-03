"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Clock,
  User,
  Calendar,
  X,
  CheckCircle2,
  Sparkles,
  Phone,
  FileText,
  Grid,
  Radio,
  Wifi,
  Headphones,
} from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import {
  startRingbackTone,
  stopRingbackTone,
  playDTMFTone,
  playConnectedTone,
  playDisconnectTone,
} from "@/utils/telephonyAudio";

export const LiveCallModal: React.FC = () => {
  const {
    activeCallLead,
    isCallModalOpen,
    isCallConnected,
    setIsCallConnected,
    callDuration,
    endCallSession,
    closeCallModal,
    addCallRecord,
    updateLeadStatus,
    addNewFollowUp,
    addToast,
  } = useCRM();

  // Call Lifecycle: 'dialing' -> 'ringing' -> 'connected' -> 'ended'
  const [callPhase, setCallPhase] = useState<"dialing" | "ringing" | "connected" | "ended">("dialing");
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [showKeypad, setShowKeypad] = useState(false);
  const [keypadInput, setKeypadInput] = useState("");
  const [micActive, setMicActive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(15);

  // Disposition Form State
  const [outcome, setOutcome] = useState("Interested");
  const [remarks, setRemarks] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [nextFollowUpTime, setNextFollowUpTime] = useState("11:00 AM");

  // Web Audio & Media Stream References
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Initialize call sequence when modal opens
  useEffect(() => {
    if (!isCallModalOpen || !activeCallLead) {
      stopRingbackTone();
      stopMic();
      return;
    }

    // Reset state
    setCallPhase("dialing");
    setIsMuted(false);
    setShowKeypad(false);
    setKeypadInput("");
    setRemarks("");
    setOutcome("Interested");

    // Tomorrow default date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");
    setNextFollowUpDate(`${yyyy}-${mm}-${dd}`);

    // Step 1: Dialing (0.7s) -> Ringing
    const dialingTimer = setTimeout(() => {
      setCallPhase("ringing");
      startRingbackTone();
    }, 700);

    // Step 2: Auto-connect student after 3.2s of ringing
    const connectTimer = setTimeout(() => {
      stopRingbackTone();
      playConnectedTone();
      setCallPhase("connected");
      setIsCallConnected(true);
      startMic();
    }, 3600);

    return () => {
      clearTimeout(dialingTimer);
      clearTimeout(connectTimer);
      stopRingbackTone();
      stopMic();
    };
  }, [isCallModalOpen, activeCallLead]);

  // Request & capture user's browser microphone for realistic visualizer
  const startMic = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        setMicActive(true);

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateAudioMeter = () => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            // Scale to 10 - 95
            const level = Math.min(95, Math.max(12, Math.round((avg / 255) * 100)));
            setAudioLevel(level);
            animFrameRef.current = requestAnimationFrame(updateAudioMeter);
          };
          updateAudioMeter();
        }
      }
    } catch {
      // Permission not granted or unsupported - fallback to ambient pulse
      setMicActive(false);
    }
  };

  const stopMic = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    setMicActive(false);
  };

  const toggleMute = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    if (micStreamRef.current) {
      micStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextState;
      });
    }
  };

  const handleKeypadPress = (digit: string) => {
    playDTMFTone(digit);
    setKeypadInput((prev) => prev + digit);
  };

  const handleEndCall = () => {
    stopRingbackTone();
    playDisconnectTone();
    stopMic();
    setCallPhase("ended");
    endCallSession();
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSaveCallRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCallLead) return;

    const durationFormatted = formatTimer(callDuration || 35);

    // 1. Add Call Record in CRM
    addCallRecord(activeCallLead.id, {
      callerName: "Priya Sharma",
      outcome: outcome,
      duration: durationFormatted,
      remarks: remarks || `Telecalling outcome logged as ${outcome}. In-browser call completed.`,
      nextFollowUpDate: nextFollowUpDate,
      nextFollowUpTime: nextFollowUpTime,
    });

    // 2. Automatically update lead status based on outcome
    if (outcome === "Admitted") {
      updateLeadStatus(activeCallLead.id, "Admitted", "Admitted");
    } else if (outcome === "Interested") {
      updateLeadStatus(activeCallLead.id, "Interested", "Interested");
    } else if (outcome === "Counselling Scheduled") {
      updateLeadStatus(activeCallLead.id, "Counselling Scheduled", "Counselling Scheduled");
    } else if (outcome === "Fee Discussion") {
      updateLeadStatus(activeCallLead.id, "Fee Discussion", "Fee Discussion");
    } else if (outcome === "Busy" || outcome === "Call Tomorrow") {
      updateLeadStatus(activeCallLead.id, "Call Later");
    }

    // 3. Add follow up task if scheduled
    if (nextFollowUpDate) {
      addNewFollowUp({
        leadId: activeCallLead.id,
        studentName: activeCallLead.studentName,
        phone: activeCallLead.phone,
        course: activeCallLead.courseInterested,
        assignedCaller: activeCallLead.assignedCaller || "Priya Sharma",
        lastContacted: "Today",
        followUpDate: nextFollowUpDate,
        followUpTime: nextFollowUpTime,
        status: "Tomorrow",
        priority: activeCallLead.priority,
        remarks: remarks || `Follow up scheduled after in-browser call (${outcome})`,
      });
    }

    addToast(`Call record for ${activeCallLead.studentName} (${durationFormatted}) saved!`, "success");
    closeCallModal();
  };

  if (!isCallModalOpen || !activeCallLead) {
    return null;
  }

  const cleanPhone = activeCallLead.phone.replace(/[^0-9+]/g, "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        
        {/* Softphone Header */}
        <div className="bg-gradient-to-b from-[#142B52] to-[#0D1D3A] text-white p-5 text-center relative overflow-hidden select-none">
          <button
            onClick={() => {
              handleEndCall();
              closeCallModal();
            }}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            title="Close Softphone"
          >
            <X className="w-5 h-5" />
          </button>

          {/* In-Browser VoIP Banner */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 text-emerald-300 border border-emerald-400/20 mb-3">
            <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>CRM In-Browser WebRTC Softphone</span>
          </div>

          {/* Avatar with Status Wave */}
          <div className="relative w-20 h-20 mx-auto mb-2 flex items-center justify-center">
            {callPhase === "ringing" && (
              <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60 animate-ping" />
            )}
            {callPhase === "connected" && (
              <span
                className="absolute inline-flex rounded-full bg-emerald-400 opacity-40 transition-all duration-75"
                style={{
                  width: `${60 + audioLevel * 0.4}px`,
                  height: `${60 + audioLevel * 0.4}px`,
                }}
              />
            )}
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-[#D5A52B] to-[#F3C856] text-[#142B52] font-black text-2xl flex items-center justify-center shadow-xl border-2 border-white/20">
              {activeCallLead.studentName.charAt(0)}
            </div>
          </div>

          <h3 className="text-xl font-bold text-white tracking-tight">
            {activeCallLead.studentName}
          </h3>
          <p className="text-xs text-slate-300 font-mono mt-0.5">
            {cleanPhone} • {activeCallLead.courseInterested}
          </p>

          {/* Live Status Indicator */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold mt-3 bg-black/30 backdrop-blur-md border border-white/15">
            {callPhase === "dialing" && (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-blue-200">Dialing VoIP Line...</span>
              </>
            )}
            {callPhase === "ringing" && (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="text-amber-200">Ringing Student Device (Synthesized)...</span>
              </>
            )}
            {callPhase === "connected" && (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-300 font-mono tracking-wider">
                  Live: {formatTimer(callDuration)}
                </span>
              </>
            )}
            {callPhase === "ended" && (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="text-rose-200">Call Ended • {formatTimer(callDuration)}</span>
              </>
            )}
          </div>
        </div>

        {/* Live Audio Visualizer Bar (when Connected) */}
        {callPhase === "connected" && (
          <div className="bg-[#0B172E] px-5 py-2.5 border-t border-b border-blue-900/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Headphones className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px]">
                {micActive ? "Microphone Live & Streaming" : "Simulated Audio Channel Active"}
              </span>
            </div>

            {/* Equalizer Bars */}
            <div className="flex items-end gap-1 h-4">
              {[40, 70, 30, 90, 60, 85, 45, 100, 50, 75].map((h, i) => (
                <span
                  key={i}
                  className="w-1 bg-emerald-400 rounded-full transition-all duration-100"
                  style={{
                    height: isMuted
                      ? "3px"
                      : `${Math.max(3, (h * (audioLevel || 20)) / 100)}px`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {/* Active Call Controls */}
          {(callPhase === "dialing" || callPhase === "ringing" || callPhase === "connected") && (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 text-center space-y-3">
              <div className="flex items-center justify-center gap-3 sm:gap-4">
                {/* Mute */}
                <button
                  type="button"
                  onClick={toggleMute}
                  className={`p-3 rounded-full border transition-all ${
                    isMuted
                      ? "bg-rose-100 text-rose-700 border-rose-300 shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 shadow-xs"
                  }`}
                  title={isMuted ? "Unmute Mic" : "Mute Mic"}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {/* Speaker */}
                <button
                  type="button"
                  onClick={() => setIsSpeaker(!isSpeaker)}
                  className={`p-3 rounded-full border transition-all ${
                    isSpeaker
                      ? "bg-blue-50 text-blue-700 border-blue-200 shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 shadow-xs"
                  }`}
                  title={isSpeaker ? "Speaker On" : "Speaker Off"}
                >
                  {isSpeaker ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>

                {/* Keypad Toggle */}
                <button
                  type="button"
                  onClick={() => setShowKeypad(!showKeypad)}
                  className={`p-3 rounded-full border transition-all ${
                    showKeypad
                      ? "bg-[#142B52] text-white border-[#142B52] shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 shadow-xs"
                  }`}
                  title="DTMF Keypad"
                >
                  <Grid className="w-5 h-5" />
                </button>

                {/* End Call */}
                <button
                  type="button"
                  onClick={handleEndCall}
                  className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-2 shadow-md hover:shadow transition-all"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>End Call</span>
                </button>
              </div>

              {/* In-Call Keypad (Plays real DTMF tones) */}
              {showKeypad && (
                <div className="pt-3 border-t border-slate-200 animate-in fade-in duration-150">
                  <div className="text-center font-mono text-base font-bold text-slate-800 mb-2 h-6">
                    {keypadInput || "Touch Tones"}
                  </div>
                  <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleKeypadPress(key)}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 hover:bg-blue-50 hover:border-blue-300 active:scale-95 transition-all text-sm shadow-xs"
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Ended Call Banner */}
          {callPhase === "ended" && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between text-emerald-950">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-xs">
                  In-Browser Call Completed ({formatTimer(callDuration)})
                </span>
              </div>
              <span className="text-[11px] text-emerald-700 font-medium">
                Log disposition below
              </span>
            </div>
          )}

          {/* Call Outcome Disposition Form */}
          <form onSubmit={handleSaveCallRecord} className="space-y-4">
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                Call Outcome (Disposition) *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  "Interested",
                  "Busy",
                  "Call Tomorrow",
                  "Counselling Scheduled",
                  "Fee Discussion",
                  "Not Answered",
                  "Not Interested",
                  "Admitted",
                ].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setOutcome(opt)}
                    className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                      outcome === opt
                        ? "bg-[#142B52] text-white border-[#142B52] shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Next Follow-up Scheduling */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50/70 p-3 rounded-2xl border border-slate-200/80">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                  Next Follow-up Date
                </label>
                <input
                  type="date"
                  value={nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#142B52]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                  Next Follow-up Time
                </label>
                <select
                  value={nextFollowUpTime}
                  onChange={(e) => setNextFollowUpTime(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#142B52]"
                >
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="04:00 PM">04:00 PM</option>
                  <option value="06:00 PM">06:00 PM</option>
                </select>
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Call Remarks & Discussion Notes
              </label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Student expressed interest in Full Stack course, demo scheduled tomorrow morning..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#142B52]/20 focus:border-[#142B52]"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  handleEndCall();
                  closeCallModal();
                }}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Discard
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#142B52] hover:bg-[#1E3B6E] text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-[#142B52]/20 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-[#D5A52B]" />
                <span>Save Call to CRM</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
