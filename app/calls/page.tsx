"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  PhoneCall,
  Phone,
  PhoneForwarded,
  PhoneMissed,
  CheckCircle2,
  Clock,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Grid,
  Calendar,
  Sparkles,
  ArrowRight,
  UserCheck,
  Search,
  AlertCircle,
  MessageSquare,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Lead } from "@/types";

export default function CallManagementPage() {
  const { leads, addCallRecord, initiateCall, endCallSession, isCallConnected, callDuration } = useCRM();

  // Selected lead in call queue
  const [selectedLeadId, setSelectedLeadId] = useState<string>(leads[0]?.id || "LD-1001");
  const selectedLead = leads.find((l) => l.id === selectedLeadId) || leads[0];

  // Queue Filter
  const [queueFilter, setQueueFilter] = useState<"All" | "Hot" | "Today" | "Pending">("All");
  const [queueSearch, setQueueSearch] = useState("");

  // Simulated Call State
  const [isCallActive, setIsCallActive] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [showKeypad, setShowKeypad] = useState(false);
  const [keypadInput, setKeypadInput] = useState("");

  // Call Result Form State
  const [selectedOutcome, setSelectedOutcome] = useState("Interested");
  const [callRemarks, setCallRemarks] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [nextFollowUpTime, setNextFollowUpTime] = useState("03:30 PM");

  // Timer interval simulation
  React.useEffect(() => {
    let interval: any = null;
    if (isCallActive) {
      interval = setInterval(() => {
        setCallTimer((prev) => prev + 1);
      }, 1000);
    } else {
      setCallTimer(0);
    }
    return () => clearInterval(interval);
  }, [isCallActive]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Filtered Queue
  const queueLeads = leads.filter((l) => {
    const matchesSearch =
      queueSearch === "" ||
      l.studentName.toLowerCase().includes(queueSearch.toLowerCase()) ||
      l.phone.includes(queueSearch) ||
      l.courseInterested.toLowerCase().includes(queueSearch.toLowerCase());

    if (!matchesSearch) return false;

    if (queueFilter === "Hot") return l.priority === "Hot";
    if (queueFilter === "Today") return l.nextFollowUpDate === "2026-10-30";
    if (queueFilter === "Pending") return l.status === "New" || l.status === "Call Later" || l.status === "Busy";
    return true;
  });

  const handleStartCall = () => {
    setIsCallActive(true);
    setIsMuted(false);
    setKeypadInput("");
    setCallRemarks("");
    if (selectedLead) {
      initiateCall(selectedLead);
    }
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    endCallSession();
  };

  const handleSaveCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    addCallRecord(selectedLead.id, {
      callerName: selectedLead.assignedCaller || "Priya Sharma",
      outcome: selectedOutcome,
      duration: isCallActive ? formatTimer(callTimer) : "03m 12s",
      remarks: callRemarks || `Call logged as ${selectedOutcome}`,
      nextFollowUpDate: nextFollowUpDate || undefined,
      nextFollowUpTime: nextFollowUpTime || undefined,
    });

    setIsCallActive(false);
    setCallRemarks("");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Telecaller Status */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">
              Telecaller Calling Workspace
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Caller Ready (Online)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Simulated dialer, live queue prioritization, outcome disposition, and follow-up logging
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/whatsapp"
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>Open WhatsApp Desk</span>
          </Link>
        </div>
      </div>

      {/* How it Works / 4-Step Caller Workflow Guide */}
      <div className="bg-[#142B52]/5 border border-[#142B52]/15 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2 text-[#142B52]">
          <Sparkles className="w-4 h-4 text-[#D5A52B]" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Telecaller Workflow Guide (Quick 4 Steps)
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="flex items-start gap-2.5 bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="w-5 h-5 rounded-full bg-[#142B52] text-[#D5A52B] font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
              1
            </span>
            <div>
              <p className="font-bold text-slate-800">Select Student</p>
              <p className="text-[11px] text-slate-500">Pick next lead from priority queue on the left</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="w-5 h-5 rounded-full bg-[#142B52] text-[#D5A52B] font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
              2
            </span>
            <div>
              <p className="font-bold text-slate-800">Click Call Now</p>
              <p className="text-[11px] text-slate-500">Initiate live softphone conversation</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="w-5 h-5 rounded-full bg-[#142B52] text-[#D5A52B] font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
              3
            </span>
            <div>
              <p className="font-bold text-slate-800">Pick Disposition</p>
              <p className="text-[11px] text-slate-500">Select Interested, Busy, Call Later, etc.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="w-5 h-5 rounded-full bg-[#D5A52B] text-[#142B52] font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
              4
            </span>
            <div>
              <p className="font-bold text-slate-800">Save & Follow-up</p>
              <p className="text-[11px] text-slate-500">Enter remarks and schedule callback</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">My Assigned Leads</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">84</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#142B52] flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Active queue under Priya Sharma</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Calls Completed Today</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">58 <span className="text-sm font-normal text-slate-400">/ 60</span></h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: "96%" }} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Connected Calls</p>
              <h3 className="text-2xl font-bold text-indigo-700 mt-1">44</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <PhoneCall className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-2">75.8% connection rate</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Pending Queue</p>
              <h3 className="text-2xl font-bold text-amber-700 mt-1">26</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-2">12 scheduled for this afternoon</p>
        </div>
      </div>

      {/* Main Calling Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Call Queue (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-soft overflow-hidden flex flex-col h-[700px]">
          {/* Queue Header & Filters */}
          <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">Today's Call Queue</h3>
                <span className="bg-[#142B52] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {queueLeads.length}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">Auto-prioritized</span>
            </div>

            {/* Search Queue */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search lead in queue..."
                value={queueSearch}
                onChange={(e) => setQueueSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#142B52]"
              />
            </div>

            {/* Queue Filter Tabs */}
            <div className="flex items-center gap-1">
              {(["All", "Hot", "Today", "Pending"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setQueueFilter(filter)}
                  className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-semibold transition-all ${
                    queueFilter === filter
                      ? "bg-[#142B52] text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Queue List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {queueLeads.map((lead) => {
              const isSelected = lead.id === selectedLeadId;
              return (
                <div
                  key={lead.id}
                  onClick={() => {
                    setSelectedLeadId(lead.id);
                    if (isCallActive) setIsCallActive(false);
                  }}
                  className={`p-3.5 cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#FDF8ED] border-l-4 border-l-[#D5A52B]"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900 leading-tight">
                        {lead.studentName}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {lead.phone}
                      </p>
                    </div>
                    <StatusBadge status={lead.priority} type="priority" />
                  </div>

                  <p className="text-[11px] text-slate-600 font-medium truncate mt-1.5">
                    {lead.courseInterested}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#D5A52B]" />
                      Follow-up: {lead.nextFollowUpTime || "11:00 AM"}
                    </span>
                    <StatusBadge status={lead.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Selected Lead Details & Calling Workspace (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Selected Lead Profile Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-soft">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedLead?.studentName}
                  </h3>
                  <StatusBadge status={selectedLead?.priority} type="priority" />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Interested in: <strong className="text-slate-800">{selectedLead?.courseInterested}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/leads/${selectedLead?.id}`}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Full Profile
                </Link>
                <Link
                  href="/whatsapp"
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-1"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  WhatsApp
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl">
                <span className="text-slate-400 block text-[10px]">Phone Number</span>
                <span className="font-bold text-slate-800 font-mono">{selectedLead?.phone}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl">
                <span className="text-slate-400 block text-[10px]">Lead Source</span>
                <span className="font-semibold text-slate-800">{selectedLead?.leadSource}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl">
                <span className="text-slate-400 block text-[10px]">Previous Calls</span>
                <span className="font-bold text-[#142B52]">{selectedLead?.callCount} calls logged</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl">
                <span className="text-slate-400 block text-[10px]">City / Location</span>
                <span className="font-semibold text-slate-800">{selectedLead?.city || "Bangalore"}</span>
              </div>
            </div>
          </div>

          {/* MicroSIP Telephony Control */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                JioFiber MicroSIP Telephony
              </h4>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Line: +91 4562 355214 (Online)
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Call {selectedLead?.studentName} via MicroSIP
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {selectedLead?.phone} • {selectedLead?.courseInterested}
                  </p>
                  <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">
                    {isCallConnected
                      ? `⚡ MicroSIP Call Active (${formatTimer(callTimer || callDuration)})`
                      : "⚡ Direct PC Dialing via MicroSIP (+91 prefix enforced)"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleStartCall}
                  className="flex-1 sm:flex-initial px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  <PhoneCall className="w-4 h-4 text-white" />
                  <span>Call in MicroSIP ({selectedLead?.phone})</span>
                </button>

                {isCallConnected && (
                  <button
                    type="button"
                    onClick={handleEndCall}
                    className="px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5"
                    title="End Call in MicroSIP"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span>Hangup</span>
                  </button>
                )}
              </div>
            </div>

            {/* Call Outcome Disposition Buttons */}
            <div className="mt-5 space-y-3">
              <label className="block text-xs font-bold text-slate-800">
                Quick Disposition Outcomes:
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {[
                  { name: "Interested", color: "hover:border-emerald-500 hover:text-emerald-700" },
                  { name: "Busy", color: "hover:border-amber-500 hover:text-amber-700" },
                  { name: "Call Tomorrow", color: "hover:border-blue-500 hover:text-blue-700" },
                  { name: "Call Later", color: "hover:border-indigo-500 hover:text-indigo-700" },
                  { name: "Not Answered", color: "hover:border-slate-500 hover:text-slate-700" },
                  { name: "Not Interested", color: "hover:border-rose-500 hover:text-rose-700" },
                ].map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setSelectedOutcome(item.name)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                      selectedOutcome === item.name
                        ? "bg-[#142B52] text-white border-[#142B52] shadow-xs"
                        : `bg-slate-50 text-slate-700 border-slate-200 ${item.color}`
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Post-Call Form: Remarks & Next Follow-up */}
            <form onSubmit={handleSaveCall} className="mt-5 pt-4 border-t border-slate-100 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Call Remarks & Student Response *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Student inquired regarding weekend batches, placement support, and fee structure. Requested syllabus brochure on WhatsApp..."
                  value={callRemarks}
                  onChange={(e) => setCallRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#142B52]/20 focus:border-[#142B52]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Next Follow-up Date
                  </label>
                  <input
                    type="date"
                    value={nextFollowUpDate}
                    onChange={(e) => setNextFollowUpDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Next Follow-up Time
                  </label>
                  <select
                    value={nextFollowUpTime}
                    onChange={(e) => setNextFollowUpTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white"
                  >
                    <option value="10:30 AM">10:30 AM (Morning)</option>
                    <option value="12:00 PM">12:00 PM (Noon)</option>
                    <option value="02:30 PM">02:30 PM (Early Afternoon)</option>
                    <option value="04:00 PM">04:00 PM (Afternoon)</option>
                    <option value="05:30 PM">05:30 PM (Evening)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#142B52] hover:bg-[#1E3B6E] text-white rounded-xl font-bold transition-all shadow-md shadow-[#142B52]/20 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#D5A52B]" />
                  <span>Save Call Update</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

