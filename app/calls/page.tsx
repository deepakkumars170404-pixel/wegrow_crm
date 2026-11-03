"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  PhoneCall,
  Phone,
  PhoneOff,
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
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Lead } from "@/types";

export default function CallManagementPage() {
  const {
    leads,
    addCallRecord,
    initiateCall,
    endCallSession,
    isCallConnected,
    callDuration,
    lastCallDuration,
    openCallModal,
    updateLeadStatus,
    activeCallLead,
    telephonyStatus,
    refreshTelephonyStatus,
  } = useCRM();

  // Calling Interface Type Switcher: "station" (Image 3) or "modal" (Image 2)
  const [callingMode, setCallingMode] = useState<"station" | "modal">("station");

  // Selected lead in call queue
  const [selectedLeadId, setSelectedLeadId] = useState<string>(leads[0]?.id || "LD-1001");
  const selectedLead = leads.find((l) => l.id === selectedLeadId) || leads[0];

  // Queue Filter
  const [queueFilter, setQueueFilter] = useState<"All" | "Hot" | "Today" | "Pending">("All");
  const [queueSearch, setQueueSearch] = useState("");

  // Simulated Call State & Persistent Duration
  const [isCallActive, setIsCallActive] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [callEndedDuration, setCallEndedDuration] = useState<string | null>(null);
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
    if (isCallActive || isCallConnected) {
      interval = setInterval(() => {
        setCallTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive, isCallConnected]);

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
    setCallEndedDuration(null); // Clear previous ended call duration
    setCallTimer(0);
    setIsMuted(false);
    setKeypadInput("");
    setCallRemarks("");
    if (selectedLead) {
      initiateCall(selectedLead);
      if (callingMode === "modal") {
        openCallModal();
      }
    }
  };

  const handleEndCall = () => {
    const finalSeconds = callTimer > 0 ? callTimer : (callDuration > 0 ? callDuration : 1);
    const finalFormatted = formatTimer(finalSeconds);
    setCallEndedDuration(finalFormatted); // Preserve the exact call time!
    setIsCallActive(false);
    endCallSession();
  };

  const handleSaveCall = (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedLead) return;

    const finalDuration = callEndedDuration || formatTimer(callTimer || callDuration || 1);

    addCallRecord(selectedLead.id, {
      callerName: selectedLead.assignedCaller || "Priya Sharma",
      outcome: selectedOutcome,
      duration: finalDuration,
      remarks: callRemarks || `Call logged as ${selectedOutcome}`,
      nextFollowUpDate: nextFollowUpDate || undefined,
      nextFollowUpTime: nextFollowUpTime || undefined,
    });

    if (selectedOutcome === "Interested") {
      updateLeadStatus(selectedLead.id, "Interested", "Interested");
    } else if (selectedOutcome === "Lost") {
      updateLeadStatus(selectedLead.id, "Lost", "Lost");
    } else if (selectedOutcome === "Counselling") {
      updateLeadStatus(selectedLead.id, "Counselling Scheduled", "Counselling Scheduled");
    } else if (selectedOutcome === "Busy" || selectedOutcome === "Call Later") {
      updateLeadStatus(selectedLead.id, "Call Later");
    }

    setIsCallActive(false);
    endCallSession();
    setCallEndedDuration(null);
    setCallTimer(0);
    setCallRemarks("");

    // Advance to next lead in queue automatically (Advance Queue)
    const currentIndex = queueLeads.findIndex((l) => l.id === selectedLead.id);
    if (currentIndex >= 0 && currentIndex < queueLeads.length - 1) {
      setSelectedLeadId(queueLeads[currentIndex + 1].id);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Telecaller Status */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">
              Telecaller Calling Workspace
            </h2>

            {/* Live MicroSIP & JioFiber Presence Indicator */}
            {telephonyStatus.connected ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1.5 border border-emerald-200 shadow-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm" />
                <span>JioFiber SIP: Online</span>
              </span>
            ) : telephonyStatus.status === "wifi_disconnected" ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 flex items-center gap-1.5 border border-rose-200 shadow-xs animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shadow-sm" />
                <span>Wi-Fi Disconnected • Offline</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1.5 border border-amber-200 shadow-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Connecting Telephony...</span>
              </span>
            )}

            {/* Wi-Fi SSID Badge */}
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              {telephonyStatus.connected ? (
                <Wifi className="w-3 h-3 text-emerald-600" />
              ) : (
                <WifiOff className="w-3 h-3 text-rose-600" />
              )}
              <span>{telephonyStatus.wifiSSID}</span>
            </span>

            {/* Manual Refresh Button */}
            <button
              type="button"
              onClick={() => refreshTelephonyStatus()}
              title="Refresh connection status"
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {telephonyStatus.connected
              ? `Connected via ${telephonyStatus.account} • Outcome disposition & follow-up tracking active`
              : telephonyStatus.message}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Calling Interface Mode Switcher: In-Page Station (Image 3) vs In-Browser Modal (Image 2) */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold text-slate-600 border border-slate-200">
            <button
              type="button"
              onClick={() => setCallingMode("station")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                callingMode === "station"
                  ? "bg-[#142B52] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Calling Station directly on page (Image 3)"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${callingMode === "station" ? "bg-emerald-400" : "bg-slate-400"}`} />
              <span>In-Page Station</span>
            </button>
            <button
              type="button"
              onClick={() => setCallingMode("modal")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                callingMode === "modal"
                  ? "bg-[#142B52] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Softphone Modal Popup (Image 2)"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${callingMode === "modal" ? "bg-emerald-400" : "bg-slate-400"}`} />
              <span>In-Browser Modal</span>
            </button>
          </div>

          <Link
            href="/whatsapp"
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>Open WhatsApp Desk</span>
          </Link>
        </div>
      </div>

      {/* Wi-Fi Disconnected Critical Warning Alert */}
      {!telephonyStatus.connected && telephonyStatus.status === "wifi_disconnected" && (
        <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50 border-2 border-rose-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20">
              <WifiOff className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-rose-900">
                  MicroSIP Offline: Registered Wi-Fi Disconnected
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-200 text-rose-800">
                  No Calling
                </span>
              </div>
              <p className="text-xs text-rose-800 mt-0.5">
                JioFiber landline calls cannot be initiated because your PC is disconnected from your registered Wi-Fi. Please turn on Wi-Fi and reconnect to <strong>{telephonyStatus.wifiSSID || "Deepakkumar-5G"}</strong> to enable telecalling.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => refreshTelephonyStatus()}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 shadow-sm transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Re-check Connection</span>
          </button>
        </div>
      )}

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
                {/* Direct Call & End Call Button in Lead Banner */}
                {isCallConnected || isCallActive ? (
                  <button
                    type="button"
                    onClick={handleEndCall}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
                    title="End Call in MicroSIP (Cut Call)"
                  >
                    <PhoneOff className="w-3.5 h-3.5" />
                    <span>End Call ({formatTimer(callTimer || callDuration)})</span>
                  </button>
                ) : !telephonyStatus.connected && telephonyStatus.status === "wifi_disconnected" ? (
                  <button
                    type="button"
                    onClick={handleStartCall}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
                    title="JioFiber Wi-Fi disconnected. Connect to Wi-Fi to call."
                  >
                    <WifiOff className="w-3.5 h-3.5" />
                    <span>Connect Wi-Fi to Call</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartCall}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
                    title="Call via MicroSIP in Background"
                  >
                    <Phone className="w-3.5 h-3.5 fill-white" />
                    <span>Call Lead</span>
                  </button>
                )}

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

          {/* Softphone Calling Station (Exact Replica of Image 3) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Softphone Calling Station
                </h3>
                <p className="text-xs text-slate-400">
                  Live dialer with call outcome logging
                </p>
              </div>

              {/* Dynamic Telephony & Wi-Fi Presence Badge */}
              {telephonyStatus.connected ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm" />
                  <span>JioFiber Online</span>
                </div>
              ) : telephonyStatus.status === "wifi_disconnected" ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold shadow-xs animate-pulse">
                  <WifiOff className="w-3 h-3 text-rose-600" />
                  <span>Wi-Fi Disconnected</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Connecting...</span>
                </div>
              )}
            </div>

            {/* Black Calling Station Card */}
            <div className="bg-[#142B52] text-white rounded-3xl p-6 text-center space-y-3 shadow-md">
              <div className="w-16 h-16 rounded-full bg-[#E5B842] text-[#142B52] font-black text-2xl flex items-center justify-center mx-auto shadow-md">
                {selectedLead?.studentName.charAt(0) || "V"}
              </div>

              <div>
                <h4 className="text-base font-bold text-white tracking-tight">
                  {selectedLead?.studentName}
                </h4>
                <p className="text-xs text-slate-300 font-mono mt-0.5">
                  {selectedLead?.phone}
                </p>
              </div>

              <div className="text-sm font-mono font-bold text-[#E5B842] tracking-wider pt-0.5">
                {isCallActive || isCallConnected
                  ? formatTimer(callTimer || callDuration)
                  : lastCallDuration || callEndedDuration
                  ? `Call Ended • ${lastCallDuration || callEndedDuration}`
                  : "00:00"}
              </div>

              <div className="pt-1 flex items-center justify-center gap-2">
                {isCallActive || isCallConnected ? (
                  <button
                    type="button"
                    onClick={handleEndCall}
                    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full font-bold text-xs shadow-md transition-transform active:scale-95 flex items-center gap-2"
                    title="End Call / Cut Call in MicroSIP"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span>End Call (Cut)</span>
                  </button>
                ) : !telephonyStatus.connected && telephonyStatus.status === "wifi_disconnected" ? (
                  <button
                    type="button"
                    onClick={handleStartCall}
                    className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-full font-bold text-xs shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
                    title="JioFiber Wi-Fi is disconnected. Please reconnect Wi-Fi to call."
                  >
                    <WifiOff className="w-4 h-4" />
                    <span>Connect Wi-Fi to Call</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartCall}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold text-xs shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
                    title="Call via JioFiber MicroSIP in Background"
                  >
                    <Phone className="w-4 h-4 fill-white" />
                    <span>Call via MicroSIP</span>
                  </button>
                )}
              </div>
            </div>

            {/* Call Outcome Disposition: */}
            <div className="mt-5 space-y-2.5">
              <label className="block text-xs font-bold text-slate-800">
                Call Outcome Disposition:
              </label>

              <div className="grid grid-cols-3 gap-2">
                {["Interested", "Busy", "Call Later", "Not Answered", "Counselling", "Lost"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSelectedOutcome(opt)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                      selectedOutcome === opt
                        ? "bg-[#142B52] text-white border-[#142B52] shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Remarks / Callback Notes: */}
            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Remarks / Callback Notes:
              </label>
              <textarea
                rows={3}
                value={callRemarks}
                onChange={(e) => setCallRemarks(e.target.value)}
                placeholder="e.g. Student interested in weekend GenAI batch..."
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#142B52]/20 resize-none"
              />
            </div>

            {/* Save Disposition & Advance Queue Button */}
            <div className="mt-5">
              <button
                type="button"
                onClick={handleSaveCall}
                className="w-full py-3 bg-[#142B52] hover:bg-[#1E3B6E] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#142B52]/20 text-center"
              >
                Save Disposition & Advance Queue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

