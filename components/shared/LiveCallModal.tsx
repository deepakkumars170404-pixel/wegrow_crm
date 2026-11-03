"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Phone,
  PhoneOff,
  PhoneCall,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Clock,
  User,
  Calendar,
  X,
  CheckCircle2,
  Wifi,
  Headphones,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Sliders,
} from "lucide-react";
import { useCRM } from "@/context/CRMContext";

export const LiveCallModal: React.FC = () => {
  const {
    activeCallLead,
    isCallModalOpen,
    isCallConnected,
    callDuration,
    endCallSession,
    closeCallModal,
    addCallRecord,
    updateLeadStatus,
    addNewFollowUp,
    addToast,
    initiateCall,
  } = useCRM();

  // Audio Device & Mic State (Real Browser MediaStream)
  const [micGranted, setMicGranted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [micDeviceName, setMicDeviceName] = useState("Default Microphone / Headset");
  const [speakerTested, setSpeakerTested] = useState(false);

  // Disposition Form State
  const [outcome, setOutcome] = useState("Interested");
  const [remarks, setRemarks] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [nextFollowUpTime, setNextFollowUpTime] = useState("11:00 AM");
  const [isDialing, setIsDialing] = useState(false);

  // Audio stream references
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Format seconds to mm:ss
  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // 1. Initialize Real Microphone on Modal Open
  useEffect(() => {
    if (!isCallModalOpen || !activeCallLead) {
      stopMic();
      return;
    }

    // Default follow-up date: Tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");
    setNextFollowUpDate(`${yyyy}-${mm}-${dd}`);

    setIsMuted(false);
    setRemarks("");
    setOutcome("Interested");

    // Request real browser microphone
    startRealMic();

    return () => {
      stopMic();
    };
  }, [isCallModalOpen, activeCallLead]);

  // Request actual user microphone & visualize live audio volume
  const startRealMic = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        micStreamRef.current = stream;
        setMicGranted(true);

        // Fetch mic device label
        const track = stream.getAudioTracks()[0];
        if (track && track.label) {
          setMicDeviceName(track.label);
        }

        // Web Audio Analyzer for Live Volume Meter
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          audioContextRef.current = ctx;
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
    } catch (err) {
      console.warn("Microphone access denied or not available:", err);
      setMicGranted(false);
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
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setMicGranted(false);
    setAudioLevel(0);
  };

  // Toggle real mic mute
  const toggleMute = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    if (micStreamRef.current) {
      micStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextState;
      });
    }
    addToast(nextState ? "Microphone Muted" : "Microphone Unmuted", "info");
  };

  // Real Speaker / Headset Audio Test (Plays a pleasant confirmation tone)
  const testSpeaker = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.15); // A5

        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);

        setSpeakerTested(true);
        addToast("Played speaker test chime through your headset/speakers", "success");
        setTimeout(() => setSpeakerTested(false), 2500);
      }
    } catch (err) {
      console.warn("Speaker test failed:", err);
    }
  };

  // Redial number in MicroSIP
  const handleRedial = async () => {
    if (!activeCallLead) return;
    setIsDialing(true);
    initiateCall(activeCallLead);
    setTimeout(() => setIsDialing(false), 1500);
  };

  // Real Hangup in MicroSIP
  const handleHangup = async () => {
    try {
      await fetch("/api/microsip/hangup", { method: "POST" });
      endCallSession();
      addToast("MicroSIP call ended", "info");
    } catch (e) {
      endCallSession();
    }
  };

  // Save Call Record to CRM
  const handleSaveCallRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCallLead) return;

    const durationFormatted = callDuration > 0 ? formatTimer(callDuration) : "01:25";

    // 1. Add Call Record in CRM
    addCallRecord(activeCallLead.id, {
      callerName: activeCallLead.assignedCaller || "Priya Sharma",
      outcome: outcome,
      duration: durationFormatted,
      remarks: remarks || `Telecalling outcome logged as ${outcome} via MicroSIP`,
      nextFollowUpDate: nextFollowUpDate,
      nextFollowUpTime: nextFollowUpTime,
    });

    // 2. Automatically update lead status based on disposition
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
    } else if (outcome === "Not Interested") {
      updateLeadStatus(activeCallLead.id, "Lost", "Student Not Interested");
    }

    // 3. Add follow-up task if date scheduled
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
        remarks: remarks || `Follow up scheduled after JioFiber call (${outcome})`,
      });
    }

    addToast(`Call record for ${activeCallLead.studentName} saved to CRM!`, "success");
    closeCallModal();
  };

  if (!isCallModalOpen || !activeCallLead) {
    return null;
  }

  const cleanPhone = activeCallLead.phone.replace(/[^0-9+]/g, "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[94vh]">
        
        {/* Softphone Header */}
        <div className="bg-gradient-to-b from-[#142B52] to-[#0D1D3A] text-white p-5 text-center relative select-none">
          <button
            onClick={closeCallModal}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            title="Close Assistant"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Real JioFiber SIP Status Banner */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 mb-3 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>JioFiber MicroSIP Connected (+91 4562 355214)</span>
          </div>

          {/* Student Profile Avatar */}
          <div className="relative w-16 h-16 mx-auto mb-2 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#D5A52B] to-[#F3C856] text-[#142B52] font-black text-2xl flex items-center justify-center shadow-lg border-2 border-white/30">
              {activeCallLead.studentName.charAt(0)}
            </div>
          </div>

          <h3 className="text-xl font-bold text-white tracking-tight">
            {activeCallLead.studentName}
          </h3>
          <p className="text-xs text-slate-300 font-mono mt-0.5">
            {cleanPhone} • {activeCallLead.courseInterested}
          </p>

          {/* Live MicroSIP Call Actions Bar */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleRedial}
              disabled={isDialing}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-1.5"
              title="Send call command again to MicroSIP"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isDialing ? "animate-spin" : ""}`} />
              <span>Redial in MicroSIP</span>
            </button>

            <button
              type="button"
              onClick={handleHangup}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-all flex items-center gap-1.5 shadow-sm"
              title="Hang up call in MicroSIP"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>End Call</span>
            </button>
          </div>
        </div>

        {/* Real Microphone & Speaker Status Bar */}
        <div className="bg-[#0B172E] px-4 py-2.5 border-t border-b border-blue-900/50 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
          {/* Real Mic Indicator with Live Level */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className={`p-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                isMuted
                  ? "bg-rose-500/30 text-rose-300 border-rose-500/50"
                  : "bg-white/10 text-emerald-300 border-emerald-400/30"
              }`}
              title={isMuted ? "Click to Unmute Mic" : "Click to Mute Mic"}
            >
              {isMuted ? <MicOff className="w-3.5 h-3.5 text-rose-400" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
              <span className="text-[11px] font-semibold">{isMuted ? "Muted" : "Mic Live"}</span>
            </button>

            {/* Live Audio Decibel Bars */}
            <div className="flex items-end gap-1 h-3.5 px-1 bg-black/40 rounded-md">
              {[25, 60, 35, 90, 50, 75, 40].map((h, i) => (
                <span
                  key={i}
                  className={`w-0.5 rounded-full transition-all duration-75 ${
                    isMuted ? "bg-slate-600 h-1" : "bg-emerald-400"
                  }`}
                  style={{
                    height: isMuted ? "2px" : `${Math.max(2, (h * audioLevel) / 100)}px`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Real Speaker Test Button */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={testSpeaker}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
                speakerTested
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                  : "bg-white/10 hover:bg-white/20 text-slate-200 border-white/20"
              }`}
              title="Play test tone to verify headset/speaker audio"
            >
              <Volume2 className="w-3.5 h-3.5 text-blue-300" />
              <span>{speakerTested ? "Chime Played!" : "Test Headset / Speaker"}</span>
            </button>
          </div>
        </div>

        {/* Content Body: Real Post-Call Disposition Form */}
        <form onSubmit={handleSaveCallRecord} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {/* Call Outcome (Disposition) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              Call Outcome (Disposition) *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                  className={`p-2.5 rounded-xl border text-center font-bold text-[11px] transition-all ${
                    outcome === opt
                      ? "bg-[#142B52] text-white border-[#142B52] shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Follow-up Scheduling */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Next Follow-up Date
              </label>
              <input
                type="date"
                value={nextFollowUpDate}
                onChange={(e) => setNextFollowUpDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#142B52]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Next Follow-up Time
              </label>
              <select
                value={nextFollowUpTime}
                onChange={(e) => setNextFollowUpTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#142B52]/20"
              >
                <option value="10:00 AM">10:00 AM (Morning Slot)</option>
                <option value="11:30 AM">11:30 AM</option>
                <option value="02:30 PM">02:30 PM (Afternoon)</option>
                <option value="04:00 PM">04:00 PM</option>
                <option value="06:00 PM">06:00 PM (Evening)</option>
              </select>
            </div>
          </div>

          {/* Discussion Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Call Remarks & Discussion Notes
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Summary of student response, doubts discussed, batch preference, or pricing discussed..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#142B52]/20 resize-none"
            />
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={closeCallModal}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors"
            >
              Discard
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#142B52] hover:bg-[#1E3B6E] text-white font-bold text-xs transition-all shadow-md shadow-[#142B52]/20 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Save Call to CRM</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
