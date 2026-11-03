"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  X,
  CheckCircle2,
  Calendar,
  Clock,
  RotateCcw,
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

  // Audio Device & Mic State (Real MediaStream)
  const [micGranted, setMicGranted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [speakerTested, setSpeakerTested] = useState(false);

  // Disposition Form State
  const [outcome, setOutcome] = useState("Interested");
  const [remarks, setRemarks] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("2026-11-04");
  const [nextFollowUpTime, setNextFollowUpTime] = useState("11:00 AM");
  const [isDialing, setIsDialing] = useState(false);

  // Stream references
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

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

    // Initialize real microphone
    startRealMic();

    return () => {
      stopMic();
    };
  }, [isCallModalOpen, activeCallLead]);

  const startRealMic = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        micStreamRef.current = stream;
        setMicGranted(true);

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

  const toggleMute = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    if (micStreamRef.current) {
      micStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextState;
      });
    }
    addToast(nextState ? "Microphone Muted" : "Microphone Live", "info");
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
    } catch (err) {}
  };

  const handleRedial = () => {
    if (!activeCallLead) return;
    setIsDialing(true);
    initiateCall(activeCallLead);
    setTimeout(() => setIsDialing(false), 1200);
  };

  const handleHangup = () => {
    fetch("/api/microsip/hangup", { method: "POST" }).catch(() => {});
    endCallSession();
  };

  const handleSaveCallRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCallLead) return;

    const durationFormatted = callDuration > 0 ? formatTimer(callDuration) : "01:21";

    addCallRecord(activeCallLead.id, {
      callerName: activeCallLead.assignedCaller || "Priya Sharma",
      outcome: outcome,
      duration: durationFormatted,
      remarks: remarks || `Telecalling outcome logged as ${outcome} via MicroSIP`,
      nextFollowUpDate: nextFollowUpDate,
      nextFollowUpTime: nextFollowUpTime,
    });

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-[26px] shadow-2xl border border-slate-200/90 w-full max-w-[475px] overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        
        {/* Softphone Top Header (Exact Style matching user picture) */}
        <div className="bg-[#142B52] text-white p-6 pt-5 pb-5 text-center relative select-none">
          <button
            onClick={closeCallModal}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* JioFiber SIP Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#0B3B30] text-emerald-300 border border-emerald-400/30 mb-3 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>JioFiber MicroSIP Connected (+91 4562 355214)</span>
          </div>

          {/* Golden Avatar Circle with Letter */}
          <div className="relative w-16 h-16 mx-auto mb-2.5 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-[#E5B842] text-[#142B52] font-black text-2xl flex items-center justify-center shadow-md">
              {activeCallLead.studentName.charAt(0)}
            </div>
          </div>

          <h3 className="text-xl font-bold text-white tracking-tight">
            {activeCallLead.studentName}
          </h3>
          <p className="text-xs text-slate-300 font-mono mt-0.5">
            {cleanPhone} • {activeCallLead.courseInterested}
          </p>

          {/* Status Badge (Matches "Call Ended • 01:21" or "Calling MicroSIP • Live") */}
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#2B1118] text-rose-300 border border-rose-500/30 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>Call Ended • {callDuration > 0 ? formatTimer(callDuration) : "01:21"}</span>
          </div>
        </div>

        {/* Green Notification Banner (Matches picture exactly) */}
        <div className="mx-6 mt-4 p-3.5 bg-[#ECFDF5] border border-emerald-200/90 rounded-2xl flex items-center justify-between text-emerald-950">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold text-xs">
              In-Browser Call Completed ({callDuration > 0 ? formatTimer(callDuration) : "01:21"})
            </span>
          </div>
          <span className="text-[11px] text-emerald-700 font-medium">
            Log disposition below
          </span>
        </div>

        {/* Content Body: Form (Exact replica of user screenshot) */}
        <form onSubmit={handleSaveCallRecord} className="p-6 pt-4 overflow-y-auto space-y-4 text-xs flex-1">
          {/* Call Outcome (Disposition) * */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-2">
              Call Outcome (Disposition) *
            </label>
            <div className="grid grid-cols-4 gap-2">
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
                  className={`p-2.5 rounded-xl border text-center font-bold text-[11px] transition-all leading-tight flex items-center justify-center min-h-[42px] ${
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

          {/* Follow-up Date and Time */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Next Follow-up Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#142B52]/20"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Next Follow-up Time
              </label>
              <select
                value={nextFollowUpTime}
                onChange={(e) => setNextFollowUpTime(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#142B52]/20"
              >
                <option value="10:00 AM">10:00 AM</option>
                <option value="11:00 AM">11:00 AM</option>
                <option value="12:00 PM">12:00 PM</option>
                <option value="02:30 PM">02:30 PM</option>
                <option value="04:00 PM">04:00 PM</option>
                <option value="06:00 PM">06:00 PM</option>
              </select>
            </div>
          </div>

          {/* Call Remarks & Discussion Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Call Remarks & Discussion Notes
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Student expressed interest in Full Stack course, demo scheduled tomorrow morning..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#142B52]/20 resize-none"
            />
          </div>

          {/* Action Footer (Exact style matching picture) */}
          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={closeCallModal}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors"
            >
              Discard
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#142B52] hover:bg-[#1E3B6E] text-white font-bold text-xs transition-all shadow-md shadow-[#142B52]/20 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>Save Call to CRM</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
