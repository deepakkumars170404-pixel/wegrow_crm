"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  Calendar,
  Clock,
  UserCheck,
  Tag,
  Mail,
  MapPin,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  PhoneForwarded,
  PhoneCall,
  PlusCircle,
  FileText,
  Send,
  AlertCircle,
  Mic,
  MicOff,
  Volume2,
  X,
} from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LeadPriority, LeadStatus, PipelineStage } from "@/types";

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;

  const {
    leads,
    telecallers,
    courses,
    updateLeadStatus,
    assignCaller,
    addLeadNote,
    addCallRecord,
    markFollowUpCompleted,
    addNewFollowUp,
    activeUserRole,
    addToast,
    initiateCall,
  } = useCRM();

  const isOwnerMD = activeUserRole === "Owner" || activeUserRole === "Owner / MD";

  const lead = leads.find((l) => l.id === leadId) || leads[0];

  const [activeTab, setActiveTab] = useState<
    "overview" | "calls" | "followups" | "messages" | "notes"
  >("overview");

  // Notes state
  const [newNote, setNewNote] = useState("");

  // WhatsApp demo messages state
  const [chatMessages, setChatMessages] = useState([
    {
      id: "cm-1",
      sender: "caller",
      text: `Hello ${lead?.studentName || "Student"}! Thank you for inquiring about ${
        lead?.courseInterested || "our courses"
      } at WeGrow Skill Campus.`,
      time: "Yesterday, 11:30 AM",
    },
    {
      id: "cm-2",
      sender: "student",
      text: "Hi, can you share the updated curriculum and batch timing for working professionals?",
      time: "Yesterday, 02:15 PM",
    },
    {
      id: "cm-3",
      sender: "caller",
      text: "Sure! We have weekend classroom batches (Sat & Sun 10 AM to 2 PM) with 100% lab access and 1:1 mentor doubt clearing.",
      time: "Yesterday, 03:00 PM",
    },
  ]);
  const [chatInput, setChatInput] = useState("");

  // Simulated calling modal state
  const [isCallingModalOpen, setIsCallingModalOpen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isCallMuted, setIsCallMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callOutcome, setCallOutcome] = useState("Interested");
  const [callRemarks, setCallRemarks] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("03:00 PM");

  // Schedule follow up modal state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [schedDate, setSchedDate] = useState("");
  const [schedTime, setSchedTime] = useState("11:00 AM");
  const [schedRemarks, setSchedRemarks] = useState("");

  if (!lead) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Lead Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">The requested enquiry could not be loaded.</p>
        <Link
          href="/leads"
          className="inline-block mt-4 px-4 py-2 bg-[#142B52] text-white rounded-xl text-xs font-semibold"
        >
          Return to Leads
        </Link>
      </div>
    );
  }

  // Handle Note Submission
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    addLeadNote(lead.id, newNote.trim(), lead.assignedCaller);
    setNewNote("");
  };

  // Handle WhatsApp Message Send
  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setChatMessages((prev) => [
      ...prev,
      {
        id: "cm-" + Date.now(),
        sender: "caller",
        text: chatInput.trim(),
        time: now,
      },
    ]);
    setChatInput("");
  };

  // Start in-browser VoIP call via CRM Softphone
  const startSimulatedCall = () => {
    if (lead) {
      initiateCall(lead);
    }
  };

  // Save call result
  const handleSaveCallResult = () => {
    addCallRecord(lead.id, {
      callerName: lead.assignedCaller,
      outcome: callOutcome,
      duration: `${Math.floor(callDuration / 60)}m ${callDuration % 60}s`,
      remarks: callRemarks || `Call completed with outcome: ${callOutcome}`,
      nextFollowUpDate: followUpDate || undefined,
      nextFollowUpTime: followUpTime || undefined,
    });
    setIsCallingModalOpen(false);
  };

  // Save Scheduled Follow-up
  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedDate) return;
    addNewFollowUp({
      leadId: lead.id,
      studentName: lead.studentName,
      phone: lead.phone,
      course: lead.courseInterested,
      assignedCaller: lead.assignedCaller,
      lastContacted: "Scheduled",
      followUpDate: schedDate,
      followUpTime: schedTime,
      status: "Upcoming",
      priority: lead.priority,
      remarks: schedRemarks || "Scheduled follow-up reminder.",
    });
    setIsScheduleModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/leads"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#142B52] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Leads</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Lead ID: #{lead.id}</span>
          <StatusBadge status={lead.priority} type="priority" />
          <StatusBadge status={lead.status} />
        </div>
      </div>

      {/* Student Profile Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-soft">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#142B52] text-white flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-md shadow-[#142B52]/20">
              {lead.studentName.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900">
                  {lead.studentName}
                </h2>
                <span className="text-xs font-semibold text-[#B88A1B] bg-[#D5A52B]/15 px-2.5 py-0.5 rounded-full border border-[#D5A52B]/30">
                  {lead.courseInterested}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-2 text-xs text-slate-500">
                <span className="flex items-center gap-1 font-mono text-slate-700 font-semibold">
                  <Phone className="w-3.5 h-3.5 text-[#142B52]" />
                  {lead.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {lead.email}
                </span>
                {lead.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {lead.city}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  Source: {lead.leadSource}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Contact Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={startSimulatedCall}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#142B52] hover:bg-[#1E3B6E] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#142B52]/20"
            >
              <PhoneCall className="w-4 h-4 text-[#D5A52B]" />
              <span>Call Now (Demo)</span>
            </button>

            <button
              onClick={() => setActiveTab("messages")}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
            >
              <MessageSquare className="w-4 h-4 text-emerald-200" />
              <span>WhatsApp Chat</span>
            </button>

            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>Schedule Follow-up</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Tabs & Action Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Tabs Content (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs Navigation Header */}
          <div className="bg-white rounded-2xl p-1.5 border border-slate-200/90 shadow-soft flex flex-wrap gap-1">
            {[
              { id: "overview", label: "Overview" },
              { id: "calls", label: `Call History (${lead.callHistory?.length || 0})` },
              { id: "followups", label: "Follow-ups" },
              { id: "messages", label: "WhatsApp Messages" },
              { id: "notes", label: `Internal Notes (${lead.notes?.length || 0})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-[#142B52] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-soft space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Student Enquiry Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block mb-0.5">Academic Qualification</span>
                    <span className="font-semibold text-slate-800">
                      {lead.education || "Bachelor of Technology / Graduate"}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block mb-0.5">Enquiry Date</span>
                    <span className="font-semibold text-slate-800">{lead.enquiryDate}</span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block mb-0.5">Next Scheduled Follow-up</span>
                    <span className="font-semibold text-[#142B52]">
                      {lead.nextFollowUpDate} at {lead.nextFollowUpTime}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block mb-0.5">Lead Assigned Telecaller</span>
                    <span className="font-semibold text-slate-800">{lead.assignedCaller}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Target Program Details
                </h3>
                <div className="bg-[#142B52]/5 rounded-xl p-4 border border-[#142B52]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-[#142B52] text-sm">{lead.courseInterested}</p>
                    <p className="text-slate-500 mt-0.5">
                      Classroom Lab Training • 100% Practical Capstone Projects • Placement Support
                    </p>
                  </div>
                  <Link
                    href="/courses"
                    className="px-3 py-1.5 bg-[#142B52] text-white rounded-lg text-xs font-semibold hover:bg-[#1E3B6E] whitespace-nowrap self-start sm:self-auto"
                  >
                    View Course Syllabus
                  </Link>
                </div>
              </div>

              {/* Latest Call Summary */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Latest Call Outcome
                </h3>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-700">
                      Outcome: {lead.lastCallOutcome || "Interested"}
                    </span>
                    <span className="text-slate-400">{lead.lastCallDate || "Yesterday"}</span>
                  </div>
                  <p className="text-slate-600 mt-1">
                    Total call touchpoints logged: <strong className="text-slate-900">{lead.callCount} calls</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CALL HISTORY */}
          {activeTab === "calls" && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Telecalling Touchpoint Logs
                  </h3>
                  <p className="text-xs text-slate-500">
                    Audit trail of all telecalling conversations with this student
                  </p>
                </div>
                <button
                  onClick={startSimulatedCall}
                  className="px-3 py-1.5 bg-[#142B52] text-white rounded-lg text-xs font-semibold hover:bg-[#1E3B6E]"
                >
                  + Log Call
                </button>
              </div>

              {!lead.callHistory || lead.callHistory.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No previous call records logged yet. Click "Call Now" to log the first call.
                </div>
              ) : (
                <div className="space-y-3">
                  {lead.callHistory.map((call) => (
                    <div
                      key={call.id}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                            <PhoneCall className="w-3.5 h-3.5" />
                          </span>
                          <span className="font-bold text-slate-800">
                            {call.callerName}
                          </span>
                          <span className="text-slate-400">• Duration: {call.duration}</span>
                        </div>
                        <span className="text-slate-500 font-medium">
                          {call.callDate} at {call.callTime}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-[#142B52] font-semibold text-[11px]">
                          {call.outcome}
                        </span>
                      </div>

                      <p className="text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200/60 italic">
                        "{call.remarks}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FOLLOW-UPS */}
          {activeTab === "followups" && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Scheduled Follow-up Reminders
                  </h3>
                  <p className="text-xs text-slate-500">
                    Never miss a promised callback with the prospective student
                  </p>
                </div>
                <button
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="px-3 py-1.5 bg-[#142B52] text-white rounded-lg text-xs font-semibold hover:bg-[#1E3B6E]"
                >
                  + Schedule Callback
                </button>
              </div>

              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">
                      Next Follow-up Due
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                      Scheduled
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1">
                    Date: <strong className="text-slate-900">{lead.nextFollowUpDate}</strong> at{" "}
                    <strong className="text-slate-900">{lead.nextFollowUpTime}</strong>
                  </p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Assigned Caller: {lead.assignedCaller}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      alert("Follow-up marked completed!");
                    }}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700"
                  >
                    Mark Done
                  </button>
                  <button
                    onClick={() => setIsScheduleModalOpen(true)}
                    className="px-3 py-1.5 border border-slate-300 bg-white text-slate-700 rounded-lg font-semibold hover:bg-slate-50"
                  >
                    Reschedule
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WHATSAPP MESSAGES */}
          {activeTab === "messages" && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-soft overflow-hidden flex flex-col h-[520px]">
              {/* Chat Header */}
              <div className="px-4 py-3 bg-[#142B52] text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
                    WA
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight">{lead.studentName}</p>
                    <p className="text-[10px] text-emerald-300 font-mono">{lead.phone}</p>
                  </div>
                </div>
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-200">
                  Simulated WhatsApp
                </span>
              </div>

              {/* Chat Body */}
              <div className="flex-1 p-4 bg-[#F0F2F5] overflow-y-auto space-y-3">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender === "caller" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs shadow-xs ${
                        msg.sender === "caller"
                          ? "bg-[#D9FDD3] text-slate-800 rounded-tr-none"
                          : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                      }`}
                    >
                      <p className="leading-relaxed">{msg.text}</p>
                      <span className="text-[9px] text-slate-400 mt-1 block text-right">
                        {msg.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Template pills */}
              <div className="px-3 py-1.5 bg-slate-100 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[11px]">
                <span className="text-slate-400 font-semibold flex-shrink-0">Quick:</span>
                <button
                  onClick={() =>
                    setChatInput(
                      `Hi ${lead.studentName}, here is the curriculum syllabus and schedule for ${lead.courseInterested}. Let me know if you need any clarification!`
                    )
                  }
                  className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 whitespace-nowrap hover:bg-slate-50"
                >
                  Send Syllabus
                </button>
                <button
                  onClick={() =>
                    setChatInput(
                      `Namaste ${lead.studentName}, would you like to visit WeGrow Skill Campus tomorrow at 4 PM for a free 1:1 counselling session?`
                    )
                  }
                  className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 whitespace-nowrap hover:bg-slate-50"
                >
                  Campus Visit Invite
                </button>
              </div>

              {/* Chat Input */}
              <form
                onSubmit={handleSendChatMessage}
                className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Type WhatsApp message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: NOTES */}
          {activeTab === "notes" && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-soft space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Internal Telecaller Notes
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Confidential notes visible only to WeGrow counselling staff
                </p>

                <form onSubmit={handleAddNote} className="space-y-2">
                  <textarea
                    rows={3}
                    placeholder="Add an internal observation, objection raised, or negotiation detail..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#142B52]/20 focus:border-[#142B52]"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#142B52] hover:bg-[#1E3B6E] text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Save Internal Note
                    </button>
                  </div>
                </form>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100">
                {!lead.notes || lead.notes.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">
                    No notes recorded yet.
                  </p>
                ) : (
                  lead.notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-[#142B52]">{note.author}</span>
                        <span className="text-slate-400">{note.timestamp}</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{note.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Quick Action Panel - Role Adapted */}
        <div className="space-y-4">
          {isOwnerMD ? (
            /* ================= OWNER / MD: EXECUTIVE AUDIT & DOSSIER SUMMARY ================= */
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-soft space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">
                  Executive Dossier & Audit
                </h3>
                <span className="text-[10px] font-bold bg-[#142B52] text-[#D5A52B] px-2 py-0.5 rounded">
                  Read Only
                </span>
              </div>

              {/* Admission Value & Forecast */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Course Program:</span>
                  <span className="font-bold text-slate-800">{lead.courseInterested}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Estimated Tuition:</span>
                  <span className="font-bold font-mono text-[#142B52]">₹45,000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Current Stage:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                    {lead.status}
                  </span>
                </div>
              </div>

              {/* Telecalling Activity Audit */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-700 block">Touchpoint Audit</span>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-base font-bold text-slate-900 block font-mono">
                      {lead.callHistory?.length || 2}
                    </span>
                    <span className="text-[10px] text-slate-400">Calls Logged</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-base font-bold text-slate-900 block font-mono">
                      {chatMessages.length}
                    </span>
                    <span className="text-[10px] text-slate-400">WhatsApp Messages</span>
                  </div>
                </div>
              </div>

              {/* MD Notice */}
              <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100 text-[11px] text-blue-900 leading-relaxed">
                <p className="font-semibold mb-0.5">Campus Floor Protocol:</p>
                Direct telecalling, stage updates, and follow-up executions are assigned to telecaller <strong className="font-bold text-[#142B52]">{lead.assignedCaller}</strong>.
              </div>

              {/* Export Button for MD */}
              <button
                onClick={() => {
                  addToast(`Exported complete student dossier for ${lead.studentName}.`, "success");
                }}
                className="w-full py-2.5 px-3 bg-[#142B52] hover:bg-[#1E3B6E] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4 text-[#D5A52B]" />
                <span>Export Student Dossier (PDF)</span>
              </button>
            </div>
          ) : (
            /* ================= TELECALLING TEAM & STAFF OPERATIONAL CONTROLS ================= */
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-soft space-y-5">
              <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
                Lead Workflow Controls
              </h3>

              {/* Change Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Change Pipeline Status
                </label>
                <select
                  value={lead.status}
                  onChange={(e) =>
                    updateLeadStatus(
                      lead.id,
                      e.target.value as LeadStatus,
                      e.target.value as PipelineStage
                    )
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#142B52]/20 focus:border-[#142B52]"
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Interested">Interested</option>
                  <option value="Busy">Busy</option>
                  <option value="Call Later">Call Later</option>
                  <option value="Not Interested">Not Interested</option>
                  <option value="Counselling Scheduled">Counselling Scheduled</option>
                  <option value="Visited Campus">Visited Campus</option>
                  <option value="Admitted">Admitted</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>

              {/* Assign Caller */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign Telecaller
                </label>
                <select
                  value={lead.assignedCaller}
                  onChange={(e) => assignCaller(lead.id, e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#142B52]/20 focus:border-[#142B52]"
                >
                  {telecallers.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} ({t.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Action Buttons */}
              <div className="pt-2 space-y-2">
                <a
                  href={`https://wa.me/91${lead.phone.replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(
                    `Hello ${lead.studentName}, greeting from Wegrow Academy.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-200" />
                  <span>Chat on WhatsApp</span>
                </a>

                <button
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>Reschedule Follow-up</span>
                </button>
              </div>
            </div>
          )}

          {/* Telecaller Assigned Card */}
          <div className="bg-[#142B52] text-white rounded-2xl p-5 shadow-card">
            <span className="text-[10px] font-bold text-[#D5A52B] uppercase tracking-wider block mb-2">
              Assigned Telecaller
            </span>
            <div className="flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
                alt={lead.assignedCaller}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-[#D5A52B]"
              />
              <div>
                <p className="text-xs font-bold text-white">{lead.assignedCaller}</p>
                <p className="text-[11px] text-slate-300">WeGrow Skill Campus Team</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simulated Call Modal */}
      {isCallingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Call Header */}
            <div className="bg-[#142B52] text-white p-6 text-center relative overflow-hidden">
              <div className="absolute top-3 right-3">
                <button
                  onClick={() => setIsCallingModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Pulse Avatar */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#D5A52B] to-[#FAF1D6] text-[#142B52] font-extrabold text-2xl flex items-center justify-center mx-auto mb-3 shadow-lg calling-pulse">
                {lead.studentName.charAt(0)}
              </div>

              <h3 className="text-base font-bold text-white">{lead.studentName}</h3>
              <p className="text-xs text-slate-300 font-mono mt-0.5">{lead.phone}</p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold mt-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Call in progress (Demo: 01m 24s)</span>
              </div>
            </div>

            {/* Call Control Simulation Buttons */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-around">
              <button
                onClick={() => setIsCallMuted(!isCallMuted)}
                className={`p-3 rounded-full transition-colors ${
                  isCallMuted ? "bg-rose-100 text-rose-600" : "bg-white text-slate-700 hover:bg-slate-100"
                }`}
                title="Mute / Unmute"
              >
                {isCallMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                className={`p-3 rounded-full transition-colors ${
                  isSpeakerOn ? "bg-blue-100 text-[#142B52]" : "bg-white text-slate-700"
                }`}
                title="Speaker"
              >
                <Volume2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCallOutcome("Interested")}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-bold shadow-md"
              >
                End Call
              </button>
            </div>

            {/* Post-Call Outcome Form */}
            <div className="p-5 space-y-3 text-xs">
              <h4 className="font-bold text-slate-900">Log Call Result & Next Steps</h4>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Call Outcome
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    "Interested",
                    "Busy",
                    "Call Later",
                    "Not Interested",
                    "Counselling Scheduled",
                    "Admitted",
                  ].map((outcome) => (
                    <button
                      type="button"
                      key={outcome}
                      onClick={() => setCallOutcome(outcome)}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all ${
                        callOutcome === outcome
                          ? "bg-[#142B52] text-white border-[#142B52]"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {outcome}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Remarks / Summary
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Student interested in weekend Full Stack batch..."
                  value={callRemarks}
                  onChange={(e) => setCallRemarks(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Next Follow-up Date
                  </label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full px-2 py-1.5 border rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Follow-up Time
                  </label>
                  <input
                    type="text"
                    value={followUpTime}
                    onChange={(e) => setFollowUpTime(e.target.value)}
                    className="w-full px-2 py-1.5 border rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsCallingModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleSaveCallResult}
                  className="px-4 py-1.5 bg-[#142B52] hover:bg-[#1E3B6E] text-white rounded-lg font-bold"
                >
                  Save Call Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Follow-up Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-[#142B52] text-white">
              <h3 className="font-bold text-sm">Schedule Follow-up Call</h3>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Follow-up Date *
                </label>
                <input
                  type="date"
                  required
                  value={schedDate}
                  onChange={(e) => setSchedDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Time Slot
                </label>
                <select
                  value={schedTime}
                  onChange={(e) => setSchedTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-white"
                >
                  <option value="10:00 AM">10:00 AM (Morning)</option>
                  <option value="11:30 AM">11:30 AM (Pre-noon)</option>
                  <option value="02:30 PM">02:30 PM (Afternoon)</option>
                  <option value="04:00 PM">04:00 PM (Tea time)</option>
                  <option value="05:30 PM">05:30 PM (Evening)</option>
                  <option value="07:00 PM">07:00 PM (Post-work)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Discussion Goal / Reminder Note
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Check on loan application or campus visit timing..."
                  value={schedRemarks}
                  onChange={(e) => setSchedRemarks(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#142B52] hover:bg-[#1E3B6E] text-white rounded-lg font-bold"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

