"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  PhoneCall,
  Clock,
  Search,
  MessageSquare,
  User,
  GraduationCap,
  ShieldCheck,
  Filter,
  ArrowRight,
  Smartphone,
  CheckCircle2,
} from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import { CallRecord, WEGROW_STAFF_MEMBERS } from "@/types";

export default function CallManagementPage() {
  const { leads, activeUserRole } = useCRM();

  // Filters for Audit Oversight Desk
  const [ownerStaffFilter, setOwnerStaffFilter] = useState<string>("All");
  const [ownerStatusFilter, setOwnerStatusFilter] = useState<"All" | "Attended" | "Not Attended">("All");
  const [ownerSearch, setOwnerSearch] = useState<string>("");

  // Determine if call was attended (spoken duration > 0) or not attended
  const isCallAttended = (call: CallRecord) => {
    const raw = String(call.duration || "").replace(/[^\d:]/g, "");
    let isSpoken = false;
    if (raw.includes(":")) {
      const [m, s] = raw.split(":").map(Number);
      isSpoken = (m || 0) > 0 || (s || 0) > 0;
    } else {
      const num = parseInt(raw, 10);
      isSpoken = !isNaN(num) && num > 0;
    }
    if (
      call.outcome === "Not Attended Call" ||
      call.outcome === "Missed" ||
      call.outcome === "Missed / Cut" ||
      call.outcome === "Not Answered"
    ) {
      return false;
    }
    if (call.outcome === "Attended Call" || isSpoken) {
      return true;
    }
    return false;
  };

  const parseCallDurationSec = (c: { duration?: string; durationSeconds?: number; duration_seconds?: number }): number => {
    if (typeof c.durationSeconds === "number" && c.durationSeconds >= 0) return c.durationSeconds;
    if (typeof c.duration_seconds === "number" && c.duration_seconds >= 0) return c.duration_seconds;
    const raw = String(c.duration || "").trim();
    if (raw.includes(":")) {
      const parts = raw.split(":").map((n) => parseInt(n.replace(/\D/g, ""), 10) || 0);
      if (parts.length === 2) return parts[0] * 60 + parts[1];
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    const digits = parseInt(raw.replace(/\D/g, ""), 10);
    return isNaN(digits) ? 0 : digits;
  };

  const formatSpokenMinutes = (totalSec: number) => {
    if (totalSec <= 0) return "0s";
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs.toString().padStart(2, "0")}s`;
  };

  // Get clear From Time -> End Time range
  const getCallTimeRange = (call: CallRecord) => {
    if (call.fromTime && call.endTime) {
      return `${call.fromTime} → ${call.endTime}`;
    }
    if (call.callTime) {
      return `Started at ${call.callTime}`;
    }
    return "";
  };

  // Aggregate all calls from all leads across the CRM
  const allCalls = useMemo(() => {
    const list: (CallRecord & {
      studentName: string;
      studentPhone: string;
      studentCourse: string;
      leadId: string;
    })[] = [];

    leads.forEach((l) => {
      if (l.callHistory) {
        l.callHistory.forEach((c) => {
          list.push({
            ...c,
            studentName: c.studentName || l.studentName,
            studentPhone: l.phone,
            studentCourse: l.courseInterested,
            qualification: c.qualification || l.qualification || "",
            passedOutYear: c.passedOutYear || l.passedOutYear || "",
            collegeName: c.collegeName || l.collegeName || "",
            leadId: l.id,
          });
        });
      }
    });

    return list.sort((a, b) => {
      const aTime = a.id ? parseInt(a.id.replace(/\D/g, ""), 10) || 0 : 0;
      const bTime = b.id ? parseInt(b.id.replace(/\D/g, ""), 10) || 0 : 0;
      return bTime - aTime;
    });
  }, [leads]);

  // Filtered Calls for Audit View
  const filteredOwnerCalls = useMemo(() => {
    return allCalls.filter((c) => {
      if (ownerStaffFilter !== "All") {
        if (!c.callerName || !c.callerName.toLowerCase().includes(ownerStaffFilter.toLowerCase())) {
          return false;
        }
      }
      const attended = isCallAttended(c);
      if (ownerStatusFilter === "Attended" && !attended) return false;
      if (ownerStatusFilter === "Not Attended" && attended) return false;

      if (ownerSearch.trim()) {
        const q = ownerSearch.toLowerCase();
        const matches =
          c.studentName.toLowerCase().includes(q) ||
          c.studentPhone.includes(q) ||
          c.studentCourse.toLowerCase().includes(q) ||
          (c.qualification && c.qualification.toLowerCase().includes(q)) ||
          (c.collegeName && c.collegeName.toLowerCase().includes(q)) ||
          (c.callerName && c.callerName.toLowerCase().includes(q)) ||
          (c.remarks && c.remarks.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [allCalls, ownerStaffFilter, ownerStatusFilter, ownerSearch]);

  const ownerTotalCalls = allCalls.length;
  const ownerAttendedCalls = allCalls.filter((c) => isCallAttended(c)).length;
  const ownerNotAttendedCalls = ownerTotalCalls - ownerAttendedCalls;
  const totalAcademySeconds = useMemo(() => {
    return allCalls.reduce((acc, c) => acc + parseCallDurationSec(c), 0);
  }, [allCalls]);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <PhoneCall className="w-6 h-6 text-[#142B52]" />
              <span>Staff Telecalling Audit Feed & Live Monitor</span>
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Mobile SIM Calls Live</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time feed of calls made from the Wegrow Telecaller phone app. Displays spoken staff, student academic details, exact phone duration, and counsellor remarks.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/whatsapp"
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>WhatsApp Desk</span>
          </Link>
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200">
            📊 {ownerTotalCalls} Calls Recorded
          </span>
        </div>
      </div>

      {/* 2. Top 5 Executive KPI Cards including Total Talk Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-soft space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Academy Calls</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#142B52]">{ownerTotalCalls}</span>
            <span className="text-xs font-semibold text-slate-500">All Telecallers</span>
          </div>
          <p className="text-[11px] text-slate-400">Total calls recorded across CRM</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-emerald-300/80 shadow-soft space-y-1 bg-gradient-to-br from-white to-emerald-50/50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider">Total Spoken Minutes</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-700">{formatSpokenMinutes(totalAcademySeconds)}</span>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
              Live Talk
            </span>
          </div>
          <p className="text-[11px] text-emerald-600/90 font-medium">Synced from Wegrow Telecaller App</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-emerald-200/80 shadow-soft space-y-1 bg-gradient-to-br from-white to-emerald-50/30">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Attended Calls (Spoken)</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-700">{ownerAttendedCalls}</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              {ownerTotalCalls > 0 ? ((ownerAttendedCalls / ownerTotalCalls) * 100).toFixed(0) : 0}% Picked
            </span>
          </div>
          <p className="text-[11px] text-emerald-600/80">Students who attended and spoke</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-rose-200/80 shadow-soft space-y-1 bg-gradient-to-br from-white to-rose-50/30">
          <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Not Attended / Rejected</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-700">{ownerNotAttendedCalls}</span>
            <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
              {ownerTotalCalls > 0 ? ((ownerNotAttendedCalls / ownerTotalCalls) * 100).toFixed(0) : 0}% Missed
            </span>
          </div>
          <p className="text-[11px] text-rose-600/80">Disconnected / Not Answered</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-soft space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Telecaller Staff</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{WEGROW_STAFF_MEMBERS.length} Active</span>
            <span className="text-xs font-semibold text-emerald-600">Online</span>
          </div>
          <p className="text-[11px] text-slate-400 truncate">{WEGROW_STAFF_MEMBERS.join(", ")}</p>
        </div>
      </div>

      {/* 3. Filters & Search Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-soft space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          {/* Staff Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              <span>Staff:</span>
            </span>
            <button
              type="button"
              onClick={() => setOwnerStaffFilter("All")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                ownerStaffFilter === "All"
                  ? "bg-[#142B52] text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              All Staff ({ownerTotalCalls})
            </button>
            {WEGROW_STAFF_MEMBERS.map((staff) => {
              const count = allCalls.filter((c) => c.callerName && c.callerName.includes(staff)).length;
              const isSelected = ownerStaffFilter === staff;
              return (
                <button
                  key={staff}
                  type="button"
                  onClick={() => setOwnerStaffFilter(staff)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#142B52] text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {staff} ({count})
                </button>
              );
            })}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Call Status:</span>
            </span>
            {(["All", "Attended", "Not Attended"] as const).map((st) => {
              const isSelected = ownerStatusFilter === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setOwnerStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? st === "Attended"
                        ? "bg-emerald-600 text-white"
                        : st === "Not Attended"
                        ? "bg-rose-600 text-white"
                        : "bg-slate-800 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {st === "All" ? "All" : st === "Attended" ? "🟢 Attended" : "🔴 Not Attended / Rejected"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={ownerSearch}
            onChange={(e) => setOwnerSearch(e.target.value)}
            placeholder="Search student name, phone (+91...), staff member, course, or callback notes..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#142B52]/20 font-medium"
          />
        </div>
      </div>

      {/* 4. Live Call Audit Feed / Logs */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-soft space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Staff Telecalling Audit Feed ({filteredOwnerCalls.length} Calls)
              </h3>
              <p className="text-[11px] text-slate-400">
                Detailed inspection of call outcome, spoken duration, staff handler, and student responses
              </p>
            </div>
          </div>

          <span className="text-xs text-slate-500 font-semibold">
            Showing {filteredOwnerCalls.length} of {ownerTotalCalls} calls
          </span>
        </div>

        {filteredOwnerCalls.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
            <PhoneCall className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-slate-700 text-sm">No calls found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your staff or call status filter above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOwnerCalls.map((call, idx) => {
              const attended = isCallAttended(call);
              const displayStatus = attended ? "Attended Call" : "Not Attended Call";
              const mindsetVal = call.mindset || (call.outcome !== "Attended Call" && call.outcome !== "Not Attended Call" ? call.outcome : null);

              return (
                <div
                  key={`${call.leadId}-${call.id || "call"}-${idx}`}
                  className="p-4 rounded-xl bg-slate-50/80 hover:bg-slate-100/90 border border-slate-200/80 transition-all space-y-3 text-xs"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Left: Student Name & Course */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#142B52] text-[#E5B842] font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                        {call.studentName.charAt(0) || "S"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">{call.studentName}</h4>
                          <span className="font-mono text-xs font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {call.studentPhone}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Course: <strong className="text-slate-700">{call.studentCourse}</strong>
                        </p>
                        {(call.qualification || call.collegeName) && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px]">
                            {call.qualification && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/80 font-bold">
                                <GraduationCap className="w-3 h-3 text-amber-600" />
                                <span>{call.qualification}</span>
                                {call.passedOutYear && <span className="text-amber-800">({call.passedOutYear})</span>}
                              </span>
                            )}
                            {call.collegeName && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                                <span>🏛️ {call.collegeName}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Speaked Staff Name Badge */}
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-200 flex items-center gap-1.5 shadow-xs">
                        <User className="w-3.5 h-3.5 text-purple-700" />
                        <span>Caller: <strong>{call.callerName || "Staff"}</strong></span>
                      </span>

                      {/* Attended vs Not Attended */}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs ${
                          attended
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-rose-100 text-rose-800 border border-rose-300"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            attended ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                          }`}
                        />
                        {displayStatus}
                      </span>

                      {/* Spoken Duration */}
                      <span className="px-2.5 py-1 rounded-lg font-mono font-bold text-xs bg-emerald-600 text-white shadow-xs">
                        ⏱️ {call.duration || "00:00"}
                      </span>

                      {/* Timeline */}
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="font-semibold text-slate-700">
                          {getCallTimeRange(call)}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500">{call.callDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Mindset & Staff Notes + Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-200/70 text-[11px] gap-2">
                    <div className="flex items-center gap-2">
                      {mindsetVal && (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#142B52]/10 text-[#142B52] font-bold">
                          Mindset: {mindsetVal}
                        </span>
                      )}
                      <span className="text-slate-500">
                        Inquiry handled by <strong className="text-slate-700">{call.callerName || "Staff"}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {call.remarks && (
                        <p className="text-slate-700 italic max-w-md truncate mr-2">
                          &quot;{call.remarks}&quot;
                        </p>
                      )}
                      <a
                        href={`https://wa.me/91${call.studentPhone.replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(
                          `Hello ${call.studentName}, greeting from Wegrow Academy.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                        title="Open WhatsApp Chat"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>
                      <Link
                        href={`/leads/${call.leadId}`}
                        className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg font-bold transition-colors"
                      >
                        Profile
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
