"use client";

import React, { useState, useEffect } from "react";
import {
  PhoneOff,
  PhoneCall,
  Phone,
  X,
  CheckCircle2,
  Calendar,
  Clock,
  RotateCcw,
  Smartphone,
  Zap,
  User,
  GraduationCap,
} from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import { WEGROW_STAFF_MEMBERS, StaffMember } from "@/types";

const MINDSET_OPTIONS = [
  { key: "Interested", label: "Interested", icon: "🌟" },
  { key: "Visit to Institute", label: "Visit to Institute", icon: "🏫" },
  { key: "Joined", label: "Joined", icon: "🎓" },
  { key: "Not Interested", label: "Not Interested", icon: "❌" },
  { key: "Call Later", label: "Call Later", icon: "⏰" },
  { key: "Busy", label: "Busy / No Answer", icon: "📵" },
];

export const LiveCallModal: React.FC = () => {
  const {
    activeCallLead,
    isCallModalOpen,
    isCallConnected,
    callPhase,
    callDuration,
    lastCallDuration,
    initiateCall,
    answerCall,
    endCallSession,
    closeCallModal,
    addCallRecord,
    updateLeadStatus,
    addNewFollowUp,
    addToast,
  } = useCRM();

  // Staff Selection (Who Took The Inquiry?)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember>("MuthuSelvi");

  // Disposition Form State
  const [outcome, setOutcome] = useState("Interested");
  const [remarks, setRemarks] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("2026-11-13");
  const [nextFollowUpTime, setNextFollowUpTime] = useState("11:00 AM");
  const [isDialing, setIsDialing] = useState(false);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!isCallModalOpen || !activeCallLead) {
      return;
    }

    // Default follow-up date: Tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");
    setNextFollowUpDate(`${yyyy}-${mm}-${dd}`);

    if (
      activeCallLead.assignedCaller &&
      (WEGROW_STAFF_MEMBERS as readonly string[]).includes(activeCallLead.assignedCaller)
    ) {
      setSelectedStaff(activeCallLead.assignedCaller as StaffMember);
    }

    setRemarks("");
    setOutcome("Interested");
  }, [isCallModalOpen, activeCallLead]);

  const handleRedial = () => {
    if (!activeCallLead) return;
    setIsDialing(true);
    initiateCall(activeCallLead);
    setTimeout(() => setIsDialing(false), 1200);
  };

  const handleHangup = () => {
    endCallSession();
  };

  const handleSetQuickDate = (daysAhead: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysAhead);
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, "0");
    const dd = String(target.getDate()).padStart(2, "0");
    setNextFollowUpDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleSaveCallRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCallLead) return;

    const finalDuration = lastCallDuration || (callDuration > 0 ? formatTimer(callDuration) : "00:00");
    const rawDur = String(finalDuration || "").replace(/[^\d:]/g, "");
    let isSpoken = false;
    if (rawDur.includes(":")) {
      const [m, s] = rawDur.split(":").map(Number);
      isSpoken = (m || 0) > 0 || (s || 0) > 0;
    } else {
      const num = parseInt(rawDur, 10);
      isSpoken = !isNaN(num) && num > 0;
    }
    const callOutcome = isSpoken ? "Attended Call" : "Not Attended Call";

    addCallRecord(activeCallLead.id, {
      callerName: selectedStaff,
      outcome: callOutcome,
      mindset: outcome,
      duration: finalDuration,
      remarks: remarks || `Inquiry handled by ${selectedStaff}. Mindset: ${outcome}`,
      nextFollowUpDate: nextFollowUpDate,
      nextFollowUpTime: nextFollowUpTime,
      studentName: activeCallLead.studentName,
      qualification: activeCallLead.qualification,
      passedOutYear: activeCallLead.passedOutYear,
      collegeName: activeCallLead.collegeName,
    });

    if (outcome === "Joined" || outcome === "Admitted") {
      updateLeadStatus(activeCallLead.id, "Admitted", "Admitted");
    } else if (outcome === "Interested") {
      updateLeadStatus(activeCallLead.id, "Interested", "Interested");
    } else if (outcome === "Visit to Institute" || outcome === "Counselling Scheduled") {
      updateLeadStatus(activeCallLead.id, "Counselling Scheduled", "Counselling Scheduled");
    } else if (outcome === "Busy" || outcome === "Call Later") {
      updateLeadStatus(activeCallLead.id, "Call Later");
    } else if (outcome === "Not Interested") {
      updateLeadStatus(activeCallLead.id, "Lost", "Lost");
    }

    if (nextFollowUpDate) {
      addNewFollowUp({
        leadId: activeCallLead.id,
        studentName: activeCallLead.studentName,
        phone: activeCallLead.phone,
        course: activeCallLead.courseInterested,
        assignedCaller: selectedStaff,
        lastContacted: "Today",
        followUpDate: nextFollowUpDate,
        followUpTime: nextFollowUpTime,
        status: "Upcoming",
        priority: activeCallLead.priority,
        remarks: remarks || `Follow up scheduled by ${selectedStaff}: ${outcome}`,
      });
    }

    addToast(`Inquiry saved by ${selectedStaff} for ${activeCallLead.studentName}!`, "success");
    closeCallModal();
  };

  if (!isCallModalOpen || !activeCallLead) {
    return null;
  }

  const cleanPhone = activeCallLead.phone.replace(/[^0-9+]/g, "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-[26px] shadow-2xl border border-slate-200/90 w-full max-w-[475px] overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        
        {/* Softphone Top Header */}
        <div className="bg-[#142B52] text-white p-5 text-center relative select-none">
          <button
            onClick={closeCallModal}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Telephony Connection Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#0B3B30] text-emerald-300 border border-emerald-400/30 mb-2.5 shadow-xs">
            <span className={`w-2 h-2 rounded-full ${callPhase === "ringing" ? "bg-amber-400 animate-ping" : callPhase === "connected" ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`} />
            <span>📱 Mobile Telephony ({cleanPhone})</span>
          </div>

          {/* Golden / Green Avatar Circle with Letter */}
          <div className="relative w-16 h-16 mx-auto mb-2 flex items-center justify-center">
            {callPhase === "ringing" && (
              <span className="absolute inset-0 rounded-full bg-[#E5B842]/40 animate-ping" />
            )}
            {callPhase === "connected" && (
              <span className="absolute inset-0 rounded-full bg-emerald-400/40 animate-pulse" />
            )}
            <div className={`w-16 h-16 rounded-full font-black text-2xl flex items-center justify-center shadow-md relative z-10 transition-colors ${
              callPhase === "connected"
                ? "bg-emerald-500 text-white"
                : "bg-[#E5B842] text-[#142B52]"
            }`}>
              {activeCallLead.studentName.charAt(0)}
            </div>
          </div>

          <h3 className="text-xl font-bold text-white tracking-tight">
            {activeCallLead.studentName}
          </h3>
          <p className="text-xs text-slate-300 font-mono mt-0.5">
            +91 {cleanPhone} • {activeCallLead.courseInterested}
          </p>

          {/* Status Badge */}
          <div className="mt-2.5 inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-black/40 border border-white/10 shadow-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                callPhase === "connected"
                  ? "bg-emerald-400 animate-pulse"
                  : callPhase === "ringing"
                  ? "bg-amber-400 animate-ping"
                  : "bg-rose-400"
              }`}
            />
            <span className="font-mono">
              {callPhase === "ringing"
                ? "🔔 Ringing Student's Phone (Indian Cadence)..."
                : callPhase === "connected"
                ? `🟢 Connected • Live: ${formatTimer(callDuration)}`
                : `🔴 Call Ended • Spoke for ${lastCallDuration || (callDuration > 0 ? formatTimer(callDuration) : "00:00")}`}
            </span>
          </div>
        </div>

        {/* ========================================================
            PHASE 1: RINGING SCREEN (REAL PHONE CALL EXPERIENCE)
        ======================================================== */}
        {callPhase === "ringing" && (
          <div className="p-6 text-center space-y-6 flex-1 flex flex-col justify-center items-center">
            <div className="space-y-2">
              <div className="inline-flex p-4 rounded-full bg-amber-50 text-amber-600 ring-8 ring-amber-100 animate-bounce">
                <PhoneCall className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Calling {activeCallLead.studentName}...</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Playing Indian telecom ringback cadence tone. Student phone is ringing.
              </p>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full inline-block border border-emerald-200">
                ⚡ Auto-connects when picked up (~3s)...
              </span>
            </div>

            {/* Answer and Cut Call Action Buttons */}
            <div className="flex items-center justify-center gap-3 w-full pt-2">
              <button
                type="button"
                onClick={answerCall}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Phone className="w-5 h-5" />
                <span>Pick Up / Answer</span>
              </button>
              <button
                type="button"
                onClick={handleHangup}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-sm shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <PhoneOff className="w-5 h-5" />
                <span>Cut Call</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            PHASE 2: CONNECTED SCREEN (LIVE DURATION TIMER COUNTING)
        ======================================================== */}
        {callPhase === "connected" && (
          <div className="p-6 text-center space-y-5 flex-1 flex flex-col justify-center items-center">
            {/* Big Digital Monotonic Running Timer */}
            <div className="space-y-1">
              <div className="text-5xl font-black font-mono tracking-tight text-emerald-600 animate-pulse">
                {formatTimer(callDuration)}
              </div>
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Call Connected • Speaking with Student</span>
              </div>
            </div>

            {/* Student Academic Details Card */}
            <div className="w-full bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-left space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Interested Course:</span>
                <span className="font-bold text-slate-800 text-right max-w-[220px] truncate">{activeCallLead.courseInterested}</span>
              </div>
              {activeCallLead.qualification && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Qualification:</span>
                  <span className="font-semibold text-slate-700">{activeCallLead.qualification} {activeCallLead.passedOutYear ? `(${activeCallLead.passedOutYear})` : ""}</span>
                </div>
              )}
              {activeCallLead.collegeName && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">College:</span>
                  <span className="font-semibold text-slate-700 truncate max-w-[210px]">{activeCallLead.collegeName}</span>
                </div>
              )}
            </div>

            {/* Big Red Hangup Button */}
            <div className="w-full pt-1">
              <button
                type="button"
                onClick={handleHangup}
                className="w-full py-3.5 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-sm shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
              >
                <PhoneOff className="w-5 h-5" />
                <span>🔴 Cut Call (Hangup)</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            PHASE 3: CALL ENDED & INQUIRY DISPOSITION FORM
        ======================================================== */}
        {(callPhase === "ended" || callPhase === "idle") && (
          <>
            {/* Green Notification Banner */}
            <div className="mx-6 mt-4 p-3 bg-[#ECFDF5] border border-emerald-200/90 rounded-2xl flex items-center justify-between text-emerald-950">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="font-semibold text-xs">
                  Call Ended • Spoke for {lastCallDuration || (callDuration > 0 ? formatTimer(callDuration) : "00:00")}
                </span>
              </div>
              <button
                type="button"
                onClick={handleRedial}
                className="text-[11px] font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-300 hover:bg-emerald-50 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Redial</span>
              </button>
            </div>

            {/* Content Body: Form */}
            <form onSubmit={handleSaveCallRecord} className="p-6 pt-3 overflow-y-auto space-y-4 text-xs flex-1">
              {/* 1. Staff Member Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-900">
                    1. Staff Member (Who Took This Inquiry?):
                  </label>
                  <span className="text-[11px] font-semibold text-[#142B52] bg-[#142B52]/10 px-2.5 py-0.5 rounded-full">
                    Active Staff: <strong>{selectedStaff}</strong>
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {WEGROW_STAFF_MEMBERS.map((staff) => {
                    const isSelected = selectedStaff === staff;
                    return (
                      <button
                        key={staff}
                        type="button"
                        onClick={() => setSelectedStaff(staff)}
                        className={`py-2 px-2.5 rounded-xl border text-center font-bold text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          isSelected
                            ? "bg-[#142B52] text-white border-[#142B52] shadow-sm ring-2 ring-[#142B52]/20 font-black"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>{staff}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Inquired Person Mindset (Student Status) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-900">
                    2. Inquired Person Mindset (Student Status):
                  </label>
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Mindset: <strong>{outcome}</strong>
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MINDSET_OPTIONS.map((m) => {
                    const isSelected = outcome === m.key;
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setOutcome(m.key)}
                        className={`p-2.5 rounded-xl border text-center font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? "bg-[#E5B842] text-[#142B52] border-[#E5B842] shadow-sm font-black ring-2 ring-[#E5B842]/30"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span>{m.icon}</span>
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Follow-up Date with Quick Chips */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Next Follow-up Date
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleSetQuickDate(1)}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      Tomorrow
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetQuickDate(3)}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      +3 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetQuickDate(7)}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      Next Week
                    </button>
                  </div>
                </div>
                <input
                  type="date"
                  value={nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#142B52]/20"
                />
              </div>

              {/* Follow-up Time with Quick Chips */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Next Follow-up Time
                  </label>
                  <div className="flex items-center gap-1">
                    {["10:30 AM", "02:30 PM", "04:30 PM", "06:00 PM"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNextFollowUpTime(t)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          nextFollowUpTime === t
                            ? "bg-[#142B52] text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <select
                  value={nextFollowUpTime}
                  onChange={(e) => setNextFollowUpTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#142B52]/20"
                >
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="10:30 AM">10:30 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="12:00 PM">12:00 PM</option>
                  <option value="02:30 PM">02:30 PM</option>
                  <option value="04:00 PM">04:00 PM</option>
                  <option value="04:30 PM">04:30 PM</option>
                  <option value="06:00 PM">06:00 PM</option>
                </select>
              </div>

              {/* Call Remarks & Discussion Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Call Remarks & Discussion Notes
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Student expressed interest in course, visit scheduled..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#142B52]/20 resize-none"
                />
              </div>

              {/* Action Footer */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeCallModal}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#142B52] hover:bg-[#1E3B6E] text-white font-bold text-xs transition-all shadow-md shadow-[#142B52]/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Save Call to Student Profile ➔</span>
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
