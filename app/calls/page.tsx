"use client";

import React, { useState, useEffect } from "react";
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
  Bot,
  PhoneIncoming,
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
    callPhase,
    callDuration,
    lastCallDuration,
    openCallModal,
    updateLeadStatus,
    activeCallLead,
    setActiveCallLead,
    telephonyStatus,
    refreshTelephonyStatus,
    reconnectTelephony,
    openAiCallModal,
    openAiBatchDialer,
  } = useCRM();

  // Calling Interface Type Switcher: "station" (Image 3) or "modal" (Image 2)
  const [callingMode, setCallingMode] = useState<"station" | "modal">("station");

  // Selected lead in call queue
  const [selectedLeadId, setSelectedLeadId] = useState<string>(
    activeCallLead?.id || leads[0]?.id || "LD-1001"
  );
  const selectedLead = leads.find((l) => l.id === selectedLeadId) || activeCallLead || leads[0];

  // Queue Filter
  const [queueFilter, setQueueFilter] = useState<"All" | "Hot" | "Today" | "Pending">("All");
  const [queueSearch, setQueueSearch] = useState("");

  // Call Result Form State
  const [selectedOutcome, setSelectedOutcome] = useState("Interested");
  const [callRemarks, setCallRemarks] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [nextFollowUpTime, setNextFollowUpTime] = useState("03:30 PM");

  // Format mm:ss
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Sync selected lead when activeCallLead changes elsewhere (e.g. from dock or search)
  useEffect(() => {
    if (activeCallLead && activeCallLead.id !== selectedLeadId) {
      setSelectedLeadId(activeCallLead.id);
    }
  }, [activeCallLead]);

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
    setCallRemarks("");
    if (selectedLead) {
      setActiveCallLead(selectedLead);
      initiateCall(selectedLead);
      if (callingMode === "modal") {
        openCallModal();
      }
    }
  };

  const handleEndCall = () => {
    endCallSession();
  };

  const handleSaveCall = (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedLead) return;

    const finalDuration = lastCallDuration || formatTimer(callDuration || 1);

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
    } else if (selectedOutcome === "Counselling") {
      updateLeadStatus(selectedLead.id, "Counselling Scheduled", "Counselling Scheduled");
    } else if (selectedOutcome === "Busy" || selectedOutcome === "Call Later") {
      updateLeadStatus(selectedLead.id, "Call Later");
    } else if (selectedOutcome === "Lost") {
      updateLeadStatus(selectedLead.id, "Lost", "Lost");
    }

    endCallSession();
    setCallRemarks("");

    // Advance to next lead in queue automatically (Advance Queue)
    const currentIndex = queueLeads.findIndex((l) => l.id === selectedLead.id);
    if (currentIndex >= 0 && currentIndex < queueLeads.length - 1) {
      const nextLead = queueLeads[currentIndex + 1];
      setSelectedLeadId(nextLead.id);
      setActiveCallLead(nextLead);
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

            {/* Office Reconnect & Sync Button */}
            <button
              type="button"
              onClick={() => reconnectTelephony()}
              title="Connect or Reconnect to Office JioFiber Wi-Fi"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#142B52] hover:bg-[#1E3B6E] text-white transition-all shadow-xs active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync Office JioFiber</span>
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

      {/* Gemini AI Voice Telecalling Suite Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-indigo-800 rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
            <Bot className="w-6 h-6 text-emerald-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold">Kavya — Gemini AI Telecalling Suite</h3>
              <span className="bg-white/20 text-emerald-100 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                24/7 AI Counselor
              </span>
            </div>
            <p className="text-xs text-emerald-100/90 mt-0.5">
              Automated Tanglish/English call answering, course counseling, lead qualification & demo booking
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => openAiCallModal(selectedLead, selectedLead?.phone, false)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-emerald-900 hover:bg-emerald-50 transition-all shadow-sm flex items-center gap-1.5 hover:scale-105 active:scale-95"
            title="AI Voice Agent calls this selected lead"
          >
            <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
            <span>AI Call (This Lead)</span>
          </button>

          <button
            type="button"
            onClick={() => openAiCallModal(null, "+91 98431 73678", true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500/30 hover:bg-emerald-500/40 text-white border border-white/20 transition-all flex items-center gap-1.5 active:scale-95"
            title="Simulate incoming student call to test 24/7 AI Auto-Answer"
          >
            <PhoneIncoming className="w-3.5 h-3.5 text-emerald-200" />
            <span>Simulate Inbound Call</span>
          </button>

          <button
            type="button"
            onClick={() => openAiBatchDialer()}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-500/40 hover:bg-indigo-500/60 text-white border border-white/20 transition-all flex items-center gap-1.5 active:scale-95"
            title="Open Bulk Outbound Auto-Dialer"
          >
            <Bot className="w-3.5 h-3.5 text-indigo-200" />
            <span>AI Batch Auto-Dialer</span>
          </button>
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
                JioFiber landline calls cannot be initiated because your PC is disconnected from your office Wi-Fi. Please connect to <strong>WegrowskillCampus</strong> to enable telecalling.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => reconnectTelephony()}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 shadow-sm transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sync Office JioFiber</span>
          </button>
        </div>
      )}

      {/* Main Calling Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Telecaller Queue (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-soft overflow-hidden flex flex-col h-[680px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Calling Queue</h3>
                <p className="text-xs text-slate-500">{queueLeads.length} students waiting</p>
              </div>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-bold">
                Auto-prioritized
              </span>
            </div>

            {/* Queue Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
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
                    setActiveCallLead(lead);
                    if (isCallConnected) handleEndCall();
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
                    <span className="text-slate-500 font-semibold">{lead.status}</span>
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
                {/* Direct Call & End Call Button in Lead Banner: Strictly Green when idle, Strictly Red when in call */}
                {isCallConnected || callPhase !== "idle" ? (
                  <button
                    type="button"
                    onClick={handleEndCall}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 animate-pulse"
                    title="End Call in MicroSIP (Cut Call)"
                  >
                    <PhoneOff className="w-3.5 h-3.5" />
                    <span>Cut Call ({callPhase === "ringing" ? "Ringing..." : formatTimer(callDuration)})</span>
                  </button>
                ) : !telephonyStatus.connected && telephonyStatus.status === "wifi_disconnected" ? (
                  <button
                    type="button"
                    onClick={() => reconnectTelephony()}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
                    title="JioFiber Wi-Fi disconnected. Click to sync."
                  >
                    <WifiOff className="w-3.5 h-3.5" />
                    <span>Sync Office Wi-Fi</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartCall}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
                    title="Call via MicroSIP in Background"
                  >
                    <Phone className="w-3.5 h-3.5 fill-white" />
                    <span>Call Lead</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => openAiCallModal(selectedLead, selectedLead?.phone, false)}
                  className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
                  title="Call using Gemini AI Voice Counselor"
                >
                  <Bot className="w-3.5 h-3.5 text-emerald-200" />
                  <span>AI Voice Call</span>
                </button>

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
                <span className="font-semibold text-slate-800">{selectedLead?.city || "Tamil Nadu"}</span>
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
                <button
                  type="button"
                  onClick={() => reconnectTelephony()}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-xs hover:bg-emerald-100 transition-all"
                  title="Click to refresh connection"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm" />
                  <span>JioFiber Online</span>
                </button>
              ) : telephonyStatus.status === "wifi_disconnected" ? (
                <button
                  type="button"
                  onClick={() => reconnectTelephony()}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold shadow-xs animate-pulse hover:bg-rose-100 transition-all"
                  title="Click to sync office Wi-Fi"
                >
                  <WifiOff className="w-3 h-3 text-rose-600" />
                  <span>Sync Office Wi-Fi</span>
                </button>
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

              {/* Softphone Status & Timer */}
              <div className="flex flex-col items-center gap-1.5 pt-0.5 min-h-[32px]">
                {callPhase === "ringing" ? (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>Ringing Student&apos;s Phone...</span>
                  </span>
                ) : isCallConnected || callPhase === "connected" ? (
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-sm font-mono font-bold text-emerald-400 tracking-wider">
                      Live Call Active • {formatTimer(callDuration)}
                    </span>
                  </div>
                ) : lastCallDuration ? (
                  <span className="text-sm font-mono font-bold text-[#E5B842] tracking-wider">
                    Call Ended • {lastCallDuration}
                  </span>
                ) : (
                  <span className="text-sm font-mono font-bold text-slate-300 tracking-wider">
                    00:00 • Ready to Call
                  </span>
                )}
              </div>

              {/* Station Call & Cut Button: Strictly Green when idle, Strictly Red when in call */}
              <div className="pt-1 flex items-center justify-center gap-2">
                {isCallConnected || callPhase !== "idle" ? (
                  <button
                    type="button"
                    onClick={handleEndCall}
                    className="px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-full font-bold text-sm shadow-md transition-transform active:scale-95 flex items-center gap-2 animate-pulse"
                    title="End Call / Cut Call in MicroSIP"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span>Cut Call (Hangup)</span>
                  </button>
                ) : !telephonyStatus.connected && telephonyStatus.status === "wifi_disconnected" ? (
                  <button
                    type="button"
                    onClick={() => reconnectTelephony()}
                    className="px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-full font-bold text-sm shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
                    title="JioFiber Wi-Fi is disconnected. Click to sync."
                  >
                    <WifiOff className="w-4 h-4" />
                    <span>Sync Office Jio Wi-Fi</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartCall}
                    className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold text-sm shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
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
