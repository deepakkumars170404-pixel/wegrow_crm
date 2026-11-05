"use client";

import React, { useState, useEffect } from "react";
import {
  PhoneCall,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
  Flame,
  Calendar,
  Users,
  Sparkles,
  Bot,
  ArrowRight,
  TrendingUp,
  Download,
  Filter,
} from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import { Lead } from "@/types";

interface AIBatchDialerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSelectedLeadIds?: string[];
}

export const AIBatchDialerModal: React.FC<AIBatchDialerModalProps> = ({
  isOpen,
  onClose,
  initialSelectedLeadIds = [],
}) => {
  const { leads, updateLead, addCallRecord, addNewFollowUp, addToast } = useCRM();

  // Selected Leads
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [isDialing, setIsDialing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Campaign Progress & Results
  const [completedResults, setCompletedResults] = useState<any[]>([]);
  const [campaignStats, setCampaignStats] = useState({
    total: 0,
    connected: 0,
    hot: 0,
    warm: 0,
    cold: 0,
    demos: 0,
  });

  // Filter Type for Lead Selection
  const [leadFilter, setLeadFilter] = useState<"All" | "New" | "Interested" | "Hot">("New");

  useEffect(() => {
    if (initialSelectedLeadIds.length) {
      setSelectedLeadIds(initialSelectedLeadIds);
    } else {
      // Default: select first 5-10 new or pending leads
      const defaults = leads.filter((l) => l.status === "New" || l.status === "Contacted" || l.status === "Call Later").slice(0, 8);
      setSelectedLeadIds(defaults.map((l) => l.id));
    }
    setCompletedResults([]);
    setCurrentIndex(0);
    setIsDialing(false);
  }, [isOpen, initialSelectedLeadIds, leads]);

  // Filtered Leads available for selection
  const availableLeads = leads.filter((l) => {
    if (leadFilter === "New") return l.status === "New";
    if (leadFilter === "Interested") return l.status === "Interested" || l.status === "Call Later";
    if (leadFilter === "Hot") return l.priority === "Hot";
    return true;
  });

  const toggleSelectLead = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    const ids = availableLeads.map((l) => l.id);
    setSelectedLeadIds(ids);
  };

  const deselectAll = () => {
    setSelectedLeadIds([]);
  };

  // Start Batch Campaign Loop
  const startCampaign = async () => {
    if (!selectedLeadIds.length) {
      addToast("Please select at least 1 lead to start batch calling", "warning");
      return;
    }

    setIsDialing(true);
    setIsPaused(false);
    setCompletedResults([]);
    setCurrentIndex(0);

    const targetLeads = leads.filter((l) => selectedLeadIds.includes(l.id));

    // Call Batch API
    try {
      const res = await fetch("/api/ai/telecalling/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: targetLeads }),
      });
      const data = await res.json();

      if (data.success && data.campaignResults) {
        // Sequentially reveal and sync into CRM state
        const results = data.campaignResults;
        for (let i = 0; i < results.length; i++) {
          if (!isDialing) break; // Check if cancelled
          setCurrentIndex(i + 1);

          const r = results[i];
          setCompletedResults((prev) => [...prev, r]);

          // Sync with CRM state
          updateLead(r.leadId, {
            priority: r.priority,
            status: r.demoBooked ? "Counselling Scheduled" : "Interested",
            callCount: 1,
          });

          // Add call record
          addCallRecord(r.leadId, {
            callerName: "Kavya (AI Batch Dialer)",
            outcome: r.outcome,
            duration: r.duration,
            remarks: r.remarks,
            nextFollowUpDate: r.demoBooked ? "2026-11-08" : "2026-11-06",
            nextFollowUpTime: "10:30 AM",
          });

          // Add Demo task if booked
          if (r.demoBooked) {
            addNewFollowUp({
              leadId: r.leadId,
              studentName: r.studentName,
              phone: r.phone,
              course: r.courseInterested,
              assignedCaller: "Priya Sharma",
              lastContacted: "Just now",
              followUpDate: "2026-11-08",
              followUpTime: "10:30 AM",
              status: "Upcoming",
              priority: "Hot",
              remarks: "Free Demo Class scheduled by AI Batch Calling Agent at Sivakasi campus.",
            });
          }

          // Small delay for realistic animation
          await new Promise((res) => setTimeout(res, 900));
        }

        setCampaignStats({
          total: data.totalDialed,
          connected: data.connected,
          hot: data.hotLeads,
          warm: data.warmLeads,
          cold: data.coldLeads,
          demos: data.demosBooked,
        });

        setIsDialing(false);
        addToast(`🎉 AI Batch Dialing Completed: ${data.hotLeads} Hot Leads, ${data.demosBooked} Demos Booked!`, "success");
      }
    } catch (e) {
      console.error("Batch calling error:", e);
      setIsDialing(false);
      addToast("Failed to process batch campaign", "error");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* ========================================================================= */}
        {/* HEADER */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center shadow-inner">
              <Bot className="w-6 h-6 text-purple-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight">AI Outbound Batch Auto-Dialer</h3>
                <span className="bg-white/20 text-purple-100 text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  Autonomous Agent
                </span>
              </div>
              <p className="text-xs text-indigo-100 mt-0.5">
                Automatically pitches WeGrow courses, qualifies prospects & books demo classes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* CAMPAIGN METRICS BAR (When active or completed) */}
        {/* ========================================================================= */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-sm">
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">Selected Leads</span>
            <span className="text-lg font-bold text-slate-800">{selectedLeadIds.length}</span>
          </div>
          <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-sm">
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">Dialed / Connect</span>
            <span className="text-lg font-bold text-indigo-600">
              {currentIndex} / {selectedLeadIds.length}
            </span>
          </div>
          <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl shadow-sm">
            <span className="text-[10px] text-rose-700 font-semibold uppercase block flex items-center gap-1">
              <Flame className="w-3 h-3 fill-rose-600 text-rose-600" />
              Hot Leads
            </span>
            <span className="text-lg font-bold text-rose-700">
              {completedResults.filter((r) => r.priority === "Hot").length}
            </span>
          </div>
          <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl shadow-sm">
            <span className="text-[10px] text-amber-700 font-semibold uppercase block">Warm Leads</span>
            <span className="text-lg font-bold text-amber-700">
              {completedResults.filter((r) => r.priority === "Warm").length}
            </span>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl shadow-sm">
            <span className="text-[10px] text-emerald-700 font-semibold uppercase block flex items-center gap-1">
              <Calendar className="w-3 h-3 text-emerald-600" />
              Demos Booked
            </span>
            <span className="text-lg font-bold text-emerald-700">
              {completedResults.filter((r) => r.demoBooked).length}
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BODY: Split View (Lead Selector vs Live Dialing Results) */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-5 min-h-[340px]">
          
          {/* LEFT COLUMN: Lead Queue Selector */}
          <div className="flex flex-col border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm">
            <div className="bg-slate-50 border-b border-slate-200 p-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800">Lead Queue</span>
                <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {selectedLeadIds.length} chosen
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  onClick={selectAllFiltered}
                  className="text-indigo-600 hover:underline font-semibold"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={deselectAll}
                  className="text-slate-500 hover:underline font-semibold"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="p-2 border-b border-slate-100 flex items-center gap-1 text-[11px] bg-slate-50/50">
              {(["All", "New", "Interested", "Hot"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setLeadFilter(filter)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    leadFilter === filter
                      ? "bg-indigo-600 text-white"
                      : "text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Lead Checkbox List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 max-h-[300px]">
              {availableLeads.map((l) => {
                const isSelected = selectedLeadIds.includes(l.id);
                return (
                  <div
                    key={l.id}
                    onClick={() => toggleSelectLead(l.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer border transition-all text-xs ${
                      isSelected
                        ? "bg-indigo-50/70 border-indigo-200"
                        : "hover:bg-slate-50 border-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                      />
                      <div>
                        <span className="font-bold text-slate-800 block">{l.studentName}</span>
                        <span className="text-[11px] text-slate-500">{l.phone} • {l.courseInterested}</span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        l.priority === "Hot"
                          ? "bg-rose-100 text-rose-700"
                          : l.priority === "Warm"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {l.priority}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: Live Execution Stream & Report */}
          <div className="flex flex-col border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm">
            <div className="bg-slate-50 border-b border-slate-200 p-3 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Live Campaign Feed
              </span>
              {isDialing && (
                <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-bold">
                  <span className="w-2 h-2 bg-indigo-600 rounded-full animate-ping"></span>
                  <span>Dialing #{currentIndex}...</span>
                </div>
              )}
            </div>

            {/* Campaign Results List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[340px] bg-slate-50/30">
              {completedResults.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <Bot className="w-10 h-10 mb-2 opacity-40 text-indigo-600" />
                  <p className="text-xs font-semibold text-slate-600">No active campaign yet</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                    Select leads on the left and click "Start AI Batch Campaign" to let Kavya call and qualify automatically.
                  </p>
                </div>
              ) : (
                completedResults.map((r, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-slate-200 bg-white shadow-xs text-xs animate-in slide-in-from-bottom-2"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{r.studentName}</span>
                        <span className="text-[11px] text-slate-500 font-mono">({r.phone})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                            r.priority === "Hot"
                              ? "bg-rose-500 text-white"
                              : r.priority === "Warm"
                              ? "bg-amber-400 text-slate-900"
                              : "bg-blue-400 text-white"
                          }`}
                        >
                          <Flame className="w-2.5 h-2.5 fill-current" />
                          {r.priority} ({r.qualificationScore}%)
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed mb-1.5">{r.remarks}</p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                      <span>Duration: {r.duration}</span>
                      {r.demoBooked ? (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                          ✓ Free Demo Booked
                        </span>
                      ) : (
                        <span>Status: {r.status}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* FOOTER ACTIONS */}
        {/* ========================================================================= */}
        <div className="bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {isDialing ? (
              <span className="font-bold text-indigo-600">
                AI Agent is currently auto-dialing and qualifying leads...
              </span>
            ) : (
              <span>Ready to dial {selectedLeadIds.length} candidate leads</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Close
            </button>

            <button
              onClick={startCampaign}
              disabled={isDialing || !selectedLeadIds.length}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all hover:scale-105"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isDialing ? "Dialing in Progress..." : "Start AI Batch Campaign"}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
