"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Kanban,
  ArrowRight,
  User,
  Phone,
  Sparkles,
  CheckCircle2,
  Filter,
  DollarSign,
  ChevronRight,
  MoveRight,
  TrendingUp,
  Percent,
  BadgePercent,
  Layers,
} from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PipelineStage, Lead } from "@/types";

interface StageConfig {
  stage: PipelineStage;
  label: string;
  probability: number; // Stage Probability %
  color: string;
  badgeBg: string;
}

const STAGES: StageConfig[] = [
  { stage: "New Enquiry", label: "New Enquiry", probability: 10, color: "text-blue-700", badgeBg: "bg-blue-50 border-blue-200" },
  { stage: "Contacted", label: "Contacted", probability: 25, color: "text-indigo-700", badgeBg: "bg-indigo-50 border-indigo-200" },
  { stage: "Interested", label: "Interested", probability: 40, color: "text-emerald-700", badgeBg: "bg-emerald-50 border-emerald-200" },
  { stage: "Counselling Scheduled", label: "Counselling", probability: 60, color: "text-purple-700", badgeBg: "bg-purple-50 border-purple-200" },
  { stage: "Campus Visited", label: "Campus Visited", probability: 75, color: "text-teal-700", badgeBg: "bg-teal-50 border-teal-200" },
  { stage: "Fee Discussion", label: "Fee Discussion", probability: 90, color: "text-amber-800", badgeBg: "bg-amber-50 border-amber-300" },
  { stage: "Admitted", label: "Admitted (Won)", probability: 100, color: "text-emerald-800", badgeBg: "bg-emerald-100 border-emerald-400" },
  { stage: "Lost", label: "Lost (Closed)", probability: 0, color: "text-rose-700", badgeBg: "bg-rose-50 border-rose-200" },
];

// Approximate tuition deal values by course
const COURSE_TUITION_MAP: Record<string, number> = {
  "AI Explorer": 48000,
  "Full Stack Web Development": 42000,
  "Data Analytics & Python": 38000,
  "Digital Marketing Pro": 32000,
  "Cloud & DevOps Engineer": 45000,
  "UI/UX Product Design": 35000,
};

const getLeadDealValue = (courseName: string): number => {
  return COURSE_TUITION_MAP[courseName] || 40000;
};

export default function AdmissionTrackingPage() {
  const { leads, updateLeadStatus, courses, telecallers, activeUserRole, addToast } = useCRM();

  const [selectedCourse, setSelectedCourse] = useState("All");
  const [selectedCaller, setSelectedCaller] = useState("All");

  const filteredLeads = leads.filter((l) => {
    if (selectedCourse !== "All" && l.courseInterested !== selectedCourse) return false;
    if (selectedCaller !== "All" && l.assignedCaller !== selectedCaller) return false;
    return true;
  });

  // Pipeline Financial Metrics
  const totalPipelineValue = filteredLeads.reduce((acc, lead) => {
    return acc + getLeadDealValue(lead.courseInterested);
  }, 0);

  const weightedForecastRevenue = filteredLeads.reduce((acc, lead) => {
    const stageObj = STAGES.find((s) => s.stage === (lead.stage || lead.status));
    const prob = stageObj ? stageObj.probability : 20;
    const val = getLeadDealValue(lead.courseInterested);
    return acc + (val * prob) / 100;
  }, 0);

  const wonAdmissionsValue = filteredLeads
    .filter((l) => (l.stage || l.status) === "Admitted")
    .reduce((acc, lead) => acc + getLeadDealValue(lead.courseInterested), 0);

  // Calculate next stage in the pipeline
  const getNextStage = (currentStage: PipelineStage): PipelineStage | null => {
    const stageIndex = STAGES.findIndex((s) => s.stage === currentStage);
    if (stageIndex >= 0 && stageIndex < STAGES.length - 2) {
      return STAGES[stageIndex + 1].stage;
    }
    return null;
  };

  const handleAdvanceStage = (leadId: string, currentStage: PipelineStage) => {
    const next = getNextStage(currentStage);
    if (next) {
      updateLeadStatus(leadId, next as any, next);
      addToast(`Deal advanced to "${next}"!`, "success");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner with Deal Revenue Metrics */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-soft space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">
                Admission Deals Pipeline
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D5A52B]/15 text-[#B88A1B]">
                Stage Conversion Probabilities
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Track deal progression, stage conversion probabilities, and weighted tuition revenue
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
            >
              <option value="All">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={selectedCaller}
              onChange={(e) => setSelectedCaller(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
            >
              <option value="All">All Telecallers</option>
              {telecallers.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Deals KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 block">Total Pipeline Value</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-base font-bold text-slate-900 font-mono">
                ₹{(totalPipelineValue / 100000).toFixed(2)} Lakhs
              </span>
              <span className="text-[11px] text-slate-500">{filteredLeads.length} Candidates</span>
            </div>
          </div>

          <div className="bg-indigo-50/70 rounded-xl p-3 border border-indigo-100">
            <span className="text-[11px] font-semibold text-indigo-700 block">Weighted Forecast Revenue</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-base font-bold text-indigo-900 font-mono">
                ₹{(weightedForecastRevenue / 100000).toFixed(2)} Lakhs
              </span>
              <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded">
                Prob Weighted
              </span>
            </div>
          </div>

          <div className="bg-emerald-50/70 rounded-xl p-3 border border-emerald-100">
            <span className="text-[11px] font-semibold text-emerald-700 block">Closed-Won (Admitted)</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-base font-bold text-emerald-900 font-mono">
                ₹{(wonAdmissionsValue / 100000).toFixed(2)} Lakhs
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded">
                100% Won
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Pipeline Columns */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x">
        {STAGES.map((s) => {
          const leadsInStage = filteredLeads.filter(
            (l) => (l.stage || l.status) === s.stage
          );

          const stageTotalValue = leadsInStage.reduce(
            (acc, l) => acc + getLeadDealValue(l.courseInterested),
            0
          );

          return (
            <div
              key={s.stage}
              className="w-72 flex-shrink-0 bg-slate-100/70 rounded-2xl p-3 border border-slate-200 flex flex-col max-h-[750px]"
            >
              {/* Column Header */}
              <div className="mb-3 px-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${s.badgeBg} ${s.color}`}>
                      {s.label}
                    </span>
                    <span className="w-5 h-5 rounded-full bg-white text-slate-700 text-[11px] font-bold flex items-center justify-center shadow-xs">
                      {leadsInStage.length}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold font-mono text-slate-500 bg-white/80 px-1.5 py-0.5 rounded">
                    {s.probability}% Prob
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium px-0.5">
                  <span>Stage Deal Sum:</span>
                  <span className="font-bold text-slate-700 font-mono">
                    ₹{(stageTotalValue / 1000).toFixed(0)}k
                  </span>
                </div>
              </div>

              {/* Cards Container */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {leadsInStage.length === 0 ? (
                  <div className="py-8 text-center text-[11px] text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                    No deals in this stage
                  </div>
                ) : (
                  leadsInStage.map((lead) => {
                    const nextStage = getNextStage((lead.stage || lead.status) as PipelineStage);
                    const dealValue = getLeadDealValue(lead.courseInterested);

                    return (
                      <div
                        key={lead.id}
                        className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs hover:shadow-soft transition-all space-y-2 group"
                      >
                        <div className="flex items-start justify-between">
                          <Link
                            href={`/leads/${lead.id}`}
                            className="font-bold text-xs text-slate-900 hover:text-[#244B7A] leading-tight block"
                          >
                            {lead.studentName}
                          </Link>
                          <StatusBadge status={lead.priority} type="priority" />
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-600 font-medium line-clamp-1">
                            {lead.courseInterested}
                          </span>
                          <span className="font-bold font-mono text-[#142B52] bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                            ₹{(dealValue / 1000).toFixed(0)}k
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between">
                          <span>{lead.phone}</span>
                          <span className="text-slate-400">
                            {lead.city || "Bangalore"}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-medium text-slate-600 truncate max-w-[100px]">
                            {lead.assignedCaller}
                          </span>

                          {/* Move to next stage button */}
                          {nextStage && (
                            <button
                              onClick={() =>
                                handleAdvanceStage(
                                  lead.id,
                                  (lead.stage || lead.status) as PipelineStage
                                )
                              }
                              title={`Advance to ${nextStage}`}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-[#142B52] hover:text-[#D5A52B] bg-slate-50 hover:bg-[#142B52]/10 px-2 py-0.5 rounded transition-colors"
                            >
                              <span>Advance</span>
                              <MoveRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

