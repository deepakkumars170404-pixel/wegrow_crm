"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  PhoneCall,
  CheckCircle2,
  HeartHandshake,
  CalendarClock,
  GraduationCap,
  ArrowUpRight,
  ArrowRight,
  Filter,
  Download,
  Phone,
  Sparkles,
  Clock,
  ChevronRight,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  Server,
  Layers,
  Flame,
  Award,
  Zap,
  Building2,
  MapPin,
  MessageSquare,
  Mic,
  MicOff,
  Volume2,
  FileText,
  Percent,
  PhoneOff,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { KPICard } from "@/components/dashboard/KPICard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useCRM } from "@/context/CRMContext";
import {
  leadGrowthChartData,
  monthlyGrowthChartData,
  leadSourceDistribution,
  admissionFunnelData,
  recentActivityTimeline,
  dashboardStats,
} from "@/data/dummy-data";
import { formatINR } from "@/lib/utils";
import { WEGROW_STAFF_MEMBERS } from "@/types";

export default function DashboardPage() {
  const {
    leads,
    followUps,
    telecallers,
    users,
    activeUserRole,
    setActiveUserRole,
    addCallRecord,
    updateLeadStatus,
    activeCallLead,
    setActiveCallLead,
    isCallConnected,
    callPhase,
    callDuration: crmCallDuration,
    lastCallDuration,
    activePhoneNumber,
    initiateCall,
    endCallSession,
    telephonyStatus,
    telephonyMode,
    setTelephonyMode,
    reconnectTelephony,
  } = useCRM();

  const [dateFilter, setDateFilter] = useState<"Today" | "This Week" | "This Month" | "Custom Range">("This Week");
  const [growthTimeframe, setGrowthTimeframe] = useState<"Weekly" | "Monthly">("Weekly");
  const [mounted, setMounted] = useState(false);

  // Softphone state for Telecaller view
  const [selectedQueueLead, setSelectedQueueLead] = useState<any>(leads[0] || null);
  const dialerLead = activeCallLead || selectedQueueLead || leads[0] || null;
  const [customPhone, setCustomPhone] = useState<string | null>(null);
  const setDialerLead = (lead: any) => {
    setSelectedQueueLead(lead);
    setActiveCallLead(lead);
    if (lead?.phone) setCustomPhone(lead.phone);
  };
  const [callDisposition, setCallDisposition] = useState("Interested");
  const [callerRemarks, setCallerRemarks] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Aggregate all calls across all leads for Owner overview
  const ownerAllCalls = useMemo(() => {
    const list: any[] = [];
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

  const isAttendedCall = (c: { duration?: string; outcome?: string }) => {
    const raw = String(c.duration || "").replace(/[^\d:]/g, "");
    let isSpoken = false;
    if (raw.includes(":")) {
      const [m, s] = raw.split(":").map(Number);
      isSpoken = (m || 0) > 0 || (s || 0) > 0;
    } else {
      const num = parseInt(raw, 10);
      isSpoken = !isNaN(num) && num > 0;
    }
    if (
      c.outcome === "Not Attended Call" ||
      c.outcome === "Missed" ||
      c.outcome === "Missed / Cut" ||
      c.outcome === "Not Answered"
    ) {
      return false;
    }
    if (c.outcome === "Attended Call" || isSpoken) {
      return true;
    }
    return false;
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };
  const formatSecs = formatTimer;

  // Extract spoken duration in integer seconds from any call record
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

  // Format total seconds into human-readable minutes and seconds (e.g. "14m 23s", "45s")
  const formatSpokenMinutes = (totalSec: number) => {
    if (totalSec <= 0) return "0s";
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs.toString().padStart(2, "0")}s`;
  };

  // Aggregate stats across all logged calls
  const ownerTotalSeconds = useMemo(() => {
    return ownerAllCalls.reduce((acc, c) => acc + parseCallDurationSec(c), 0);
  }, [ownerAllCalls]);

  const ownerTotalAttended = useMemo(() => {
    return ownerAllCalls.filter((c) => isAttendedCall(c)).length;
  }, [ownerAllCalls]);

  const ownerAvgDurationSec = useMemo(() => {
    if (ownerTotalAttended === 0) return 0;
    return Math.round(ownerTotalSeconds / ownerTotalAttended);
  }, [ownerTotalSeconds, ownerTotalAttended]);

  // Per-staff calling minutes and performance breakdown
  const staffCallingStats = useMemo(() => {
    return WEGROW_STAFF_MEMBERS.map((staffName) => {
      const staffCalls = ownerAllCalls.filter(
        (c) => c.callerName && c.callerName.toLowerCase().includes(staffName.toLowerCase())
      );
      const totalSec = staffCalls.reduce((acc, c) => acc + parseCallDurationSec(c), 0);
      const attended = staffCalls.filter((c) => isAttendedCall(c)).length;
      const notAttended = staffCalls.length - attended;
      const avgSec = attended > 0 ? Math.round(totalSec / attended) : 0;
      return {
        name: staffName,
        totalCalls: staffCalls.length,
        attended,
        notAttended,
        totalSec,
        formattedMinutes: formatSpokenMinutes(totalSec),
        avgDurationFormatted: formatSpokenMinutes(avgSec),
      };
    });
  }, [ownerAllCalls]);

  const handleStartCall = () => {
    const rawTarget = (customPhone !== null ? customPhone : (dialerLead?.phone || "")).trim();
    if (rawTarget) {
      const clean = rawTarget.replace(/\D/g, "");
      const exact10 = clean.slice(-10);
      const targetLead = {
        ...(dialerLead || {}),
        phone: exact10,
        studentName: customPhone ? `Direct Dial (${exact10})` : dialerLead?.studentName || "Direct Dial",
      };
      setActiveCallLead(targetLead);
      initiateCall(targetLead);
    }
  };

  const handleEndCall = () => {
    endCallSession();
  };

  const handleSaveCallerDisposition = () => {
    if (!dialerLead) return;
    const finalDuration = lastCallDuration || formatSecs(crmCallDuration || 1);
    const rawDur = String(finalDuration || "").replace(/[^\d:]/g, "");
    let isSpoken = false;
    if (rawDur.includes(":")) {
      const [m, s] = rawDur.split(":").map(Number);
      isSpoken = (m || 0) > 0 || (s || 0) > 0;
    } else {
      const num = parseInt(rawDur, 10);
      isSpoken = !isNaN(num) && num > 0;
    }
    const callStatus = isSpoken ? "Attended Call" : "Not Attended Call";

    addCallRecord(dialerLead.id, {
      callerName: "Priya Sharma",
      outcome: callStatus,
      mindset: callDisposition,
      duration: finalDuration,
      remarks: callerRemarks || `Inquiry Mindset: ${callDisposition}`,
      nextFollowUpDate: "2026-10-31",
      nextFollowUpTime: "03:00 PM",
    });

    if (callDisposition === "Interested") {
      updateLeadStatus(dialerLead.id, "Interested", "Interested");
    } else if (callDisposition === "Counselling") {
      updateLeadStatus(dialerLead.id, "Counselling Scheduled", "Counselling Scheduled");
    } else if (callDisposition === "Busy" || callDisposition === "Call Later") {
      updateLeadStatus(dialerLead.id, "Call Later");
    } else if (callDisposition === "Lost") {
      updateLeadStatus(dialerLead.id, "Lost", "Lost");
    }

    endCallSession();
    setCallerRemarks("");

    // Advance to next lead in queue
    const currentIndex = leads.findIndex((l) => l.id === dialerLead.id);
    if (currentIndex >= 0 && currentIndex < leads.length - 1) {
      const nextLead = leads[currentIndex + 1];
      setSelectedQueueLead(nextLead);
      setActiveCallLead(nextLead);
    }
  };

  const todayFollowUps = (followUps || [])
    .filter((f) => f.status === "Today" || f.status === "Overdue")
    .slice(0, 5);

  const recentEnquiries = (leads || []).slice(0, 5);

  // Selected counselor persona for Telecaller view
  const [selectedTelecallerName, setSelectedTelecallerName] = useState<string>("Muthumeena");

  // Current telecaller data for Telecaller view
  const myCallerData = useMemo(() => {
    const found = telecallers?.find(
      (t) => t.name.toLowerCase() === selectedTelecallerName.toLowerCase()
    );
    if (found) return found;
    return (
      telecallers?.[0] || {
        id: "caller-muthumeena",
        name: selectedTelecallerName || "Muthumeena",
        email: "muthumeena@wegrow.edu",
        phone: "+91 98431 73678",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        role: "Senior Counselor",
        assignedLeads: 84,
        dailyTarget: 60,
        callsCompleted: 58,
        connectedCalls: 44,
        interestedLeads: 21,
        followUpsCompleted: 34,
        admissionsGenerated: 16,
        conversionRate: 19.0,
        rank: 1,
      }
    );
  }, [telecallers, selectedTelecallerName]);

  const myCallerStats = useMemo(() => {
    const callerName = myCallerData.name;
    const calls = ownerAllCalls.filter(
      (c) => c.callerName && c.callerName.toLowerCase().includes(callerName.toLowerCase())
    );
    const totalSec = calls.reduce((acc, c) => acc + parseCallDurationSec(c), 0);
    return {
      totalCalls: calls.length,
      attended: calls.filter((c) => isAttendedCall(c)).length,
      totalSec,
      formattedMinutes: formatSpokenMinutes(totalSec),
    };
  }, [ownerAllCalls, myCallerData]);

  return (
    <div className="space-y-6 pb-12">
      {/* ========================================================
          ROLE SELECTOR & CONTEXTUAL HEADER BANNER
      ======================================================== */}
      <div className="bg-gradient-to-r from-[#142B52] via-[#1E3B6E] to-[#244B7A] rounded-2xl p-6 sm:p-7 text-white shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
        {/* Subtle decorative gold glow */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-[#D5A52B]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#D5A52B] text-xs font-semibold backdrop-blur-sm border border-white/10">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dedicated Perspective • {activeUserRole}</span>
          </div>

          {(activeUserRole === "Owner" || activeUserRole === "Owner / MD") && (
            <>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                Owner Executive Command
              </h2>
              <p className="text-xs sm:text-sm text-slate-200 max-w-xl">
                Institution-wide revenue (₹43.25L), gross admission margin, campus seat occupancy, and branch profitability.
              </p>
            </>
          )}

          {activeUserRole === "Telecaller" && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  My Calling Station & Target Desk
                </h2>
                <div className="inline-flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded-lg text-xs">
                  <span className="text-slate-300 font-medium">Active Counselor:</span>
                  <select
                    value={selectedTelecallerName}
                    onChange={(e) => setSelectedTelecallerName(e.target.value)}
                    className="bg-[#0E1E38] text-[#D5A52B] font-bold rounded px-2 py-0.5 border border-white/20 focus:outline-none cursor-pointer"
                  >
                    {WEGROW_STAFF_MEMBERS.map((staff) => (
                      <option key={staff} value={staff} className="bg-[#142B52] text-white">
                        {staff}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 max-w-xl">
                Logged in as <strong>{myCallerData.name}</strong> • Talk time today: <strong className="text-[#D5A52B]">{myCallerStats.formattedMinutes}</strong> ({myCallerStats.attended} attended calls).
              </p>
            </>
          )}

          {activeUserRole === "Admin" && (
            <>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                Systems & Operations Control Console
              </h2>
              <p className="text-xs sm:text-sm text-slate-200 max-w-xl">
                Lead ingestion webhooks, round-robin allocation rules, counselor user credentials, and campus center config.
              </p>
            </>
          )}
        </div>

        {/* Quick Role Switcher Buttons - 3 Options: Owner, Admin, Telecaller */}
        <div className="relative z-10 flex flex-col items-start md:items-end gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5 bg-[#0E1E38]/85 p-1.5 rounded-xl border border-white/15 backdrop-blur-md">
            <span className="text-[11px] font-semibold text-slate-300 px-2 hidden sm:inline">
              Switch Persona:
            </span>
            {(["Owner", "Admin", "Telecaller"] as const).map(
              (role) => {
                const isActive = (role === "Owner" && (activeUserRole === "Owner" || activeUserRole === "Owner / MD")) || activeUserRole === role;
                return (
                  <button
                    key={role}
                    onClick={() => setActiveUserRole(role)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? "bg-[#D5A52B] text-[#142B52] shadow-sm font-extrabold"
                        : "text-slate-300 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {role}
                  </button>
                );
              }
            )}
          </div>

          <span className="text-[11px] text-slate-300">
            {(activeUserRole === "Owner" || activeUserRole === "Owner / MD") && "🔒 Showing Financial & Branch ROI"}
            {activeUserRole === "Admin" && "⚙️ Showing Webhooks & System Operations"}
            {activeUserRole === "Telecaller" && "📞 Showing Personal Dialer & Leads"}
          </span>
        </div>
      </div>

      {/* ========================================================
          1. OWNER DASHBOARD VIEW (FINANCIAL & ROI COMMAND)
      ======================================================== */}
      {(activeUserRole === "Owner" || activeUserRole === "Owner / MD") && (
        <div className="space-y-6">
          {/* Executive 6 Top KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <KPICard
              title="Gross Tuition Booked"
              value="₹43,25,000"
              change="+24.2%"
              isPositive={true}
              icon={DollarSign}
              iconColor="text-emerald-700"
              iconBg="bg-emerald-50"
            />
            <KPICard
              title="Total Admissions Won"
              value="89 Seats"
              change="+18.5%"
              isPositive={true}
              icon={GraduationCap}
              iconColor="text-[#D5A52B]"
              iconBg="bg-[#FAF1D6]"
            />
            <KPICard
              title="Avg Ticket Value"
              value="₹48,595"
              subtext="Per enrolled student"
              icon={Award}
              iconColor="text-indigo-600"
              iconBg="bg-indigo-50"
            />
            <KPICard
              title="Overall Conversion"
              value="7.13%"
              subtext="Enquiry to Paid"
              icon={Percent}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-50"
            />
            <KPICard
              title="Total Inbound Enquiries"
              value="1,248"
              change="+18.4%"
              isPositive={true}
              icon={Users}
              iconColor="text-[#142B52]"
              iconBg="bg-blue-50"
            />
            <KPICard
              title="Customer Acq. Cost"
              value="₹1,420"
              subtext="CAC per paid seat"
              icon={TrendingUp}
              iconColor="text-purple-600"
              iconBg="bg-purple-50"
            />
          </div>

          {/* Branch-Wise Campus Performance Comparison Matrix */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-soft">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Campus Branch Performance & Revenue Matrix
                </h3>
                <p className="text-xs text-slate-500">
                  Physical offline learning lab revenue, admissions count, and seat occupancy
                </p>
              </div>
              <span className="text-xs font-bold text-[#142B52] bg-slate-100 px-3 py-1 rounded-lg">
                3 Operational Campuses
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  campus: "Bangalore Main Campus",
                  location: "Koramangala 4th Block",
                  admissions: 44,
                  revenue: 2150000,
                  occupancy: 82,
                  head: "Priya Sharma",
                  badge: "Flagship Center",
                },
                {
                  campus: "Pune Tech Center",
                  location: "Hinjawadi Rajiv Gandhi Tech Park",
                  admissions: 28,
                  revenue: 1380000,
                  occupancy: 74,
                  head: "Rahul Deshmukh",
                  badge: "Regional Hub",
                },
                {
                  campus: "Hyderabad Center",
                  location: "HITEC City / Madhapur",
                  admissions: 17,
                  revenue: 795000,
                  occupancy: 70,
                  head: "Sneha Patel",
                  badge: "Branch Center",
                },
              ].map((b) => (
                <div
                  key={b.campus}
                  className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#B88A1B] bg-[#D5A52B]/15 px-2 py-0.5 rounded">
                      {b.badge}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {b.occupancy}% Seat Capacity
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{b.campus}</h4>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {b.location}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-xl border border-slate-200/80 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Admissions</span>
                      <span className="font-bold text-slate-900 text-sm">{b.admissions} Students</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Revenue Generated</span>
                      <span className="font-bold text-emerald-700 text-sm">{formatINR(b.revenue)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Center Lead: <strong>{b.head}</strong></span>
                    <Link href="/reports" className="text-[#142B52] font-bold hover:underline">
                      Audit →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue vs Target Chart & Lead Source Mix */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-soft">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    6-Month Admissions & Tuition Growth
                  </h3>
                  <p className="text-xs text-slate-500">Total monthly student intake across programs</p>
                </div>
                <Link href="/reports" className="text-xs font-bold text-[#244B7A] hover:underline flex items-center gap-1">
                  <span>View Full P&L</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="h-72 w-full">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyGrowthChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="period" stroke="#64748B" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "#142B52", color: "#fff", borderRadius: "12px", fontSize: "12px" }} />
                      <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: "12px", fontSize: "12px" }} />
                      <Bar dataKey="enquiries" name="Total Inbound Enquiries" fill="#142B52" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="admissions" name="Confirmed Admissions" fill="#D5A52B" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
            </div>

            {/* Donut Chart */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-soft flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-base text-slate-900">Channel Attribution</h3>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    1,248 Leads
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-4">Admissions channel origin</p>

                <div className="h-48 w-full relative">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={leadSourceDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                          {leadSourceDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "#142B52", color: "#fff", borderRadius: "10px", fontSize: "11px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : null}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-lg font-bold text-slate-900">35%</span>
                    <span className="text-[10px] text-slate-500">Website</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 mt-3 pt-3 border-t border-slate-100 text-[11px]">
                {leadSourceDistribution.map((source) => (
                  <div key={source.name} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: source.color }} />
                    <span className="text-slate-600 truncate">{source.name}</span>
                    <span className="text-slate-900 font-bold ml-auto">{source.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 7-Stage Funnel */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">Enquiry-to-Admission Pipeline Funnel</h3>
                <p className="text-xs text-slate-500">Drop-off inspection across customer journey</p>
              </div>
              <span className="px-2.5 py-1 bg-[#D5A52B]/15 text-[#B88A1B] text-xs font-bold rounded-lg">
                Net Won: 7.13%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {admissionFunnelData.map((item, idx) => (
                <div key={item.stage} className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">STAGE 0{idx + 1}</span>
                    <p className="text-xs font-bold text-slate-800 line-clamp-1">{item.stage}</p>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-lg font-extrabold text-[#142B52]">{item.count}</span>
                      <span className="text-[11px] font-bold text-[#D5A52B]">{item.percentage}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-3">
                    <div className="bg-[#142B52] h-full rounded-full" style={{ width: `${item.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Executive Telecalling Activity & Live Call Audit Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-soft space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                  <PhoneCall className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Live Telecalling Activity & Staff Call Audit
                  </h3>
                  <p className="text-xs text-slate-500">
                    Real-time feed of attended and rejected calls made by staff across all campuses
                  </p>
                </div>
              </div>

              <Link
                href="/calls"
                className="text-xs font-bold text-[#142B52] hover:text-[#244B7A] flex items-center gap-1 bg-slate-100 px-3.5 py-2 rounded-xl hover:bg-slate-200 transition-colors"
              >
                <span>View Full Calls Oversight Desk ({ownerAllCalls.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Quick 5 Stat Counters including Total Spoken Minutes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Calls Logged</span>
                  <p className="text-xl font-black text-slate-900">{ownerAllCalls.length}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center">
                  <PhoneCall className="w-4 h-4" />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-300/60 flex items-center justify-between shadow-2xs">
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">Total Talk Time</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <p className="text-xl font-black text-emerald-700">{formatSpokenMinutes(ownerTotalSeconds)}</p>
                  <span className="text-[10px] text-emerald-700/80 font-semibold">Live SIM Minutes</span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Attended Calls</span>
                  <p className="text-xl font-black text-emerald-800">
                    {ownerTotalAttended}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    {ownerAllCalls.length > 0 ? ((ownerTotalAttended / ownerAllCalls.length) * 100).toFixed(0) : 0}% Picked
                  </span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Avg Call Duration</span>
                  <p className="text-xl font-black text-indigo-800">
                    {formatSpokenMinutes(ownerAvgDurationSec)}
                  </p>
                  <span className="text-[10px] text-indigo-600 font-semibold">Per picked call</span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Not Attended / Cut</span>
                  <p className="text-xl font-black text-rose-800">
                    {ownerAllCalls.length - ownerTotalAttended}
                  </p>
                  <span className="text-[10px] text-rose-600 font-semibold">Missed / Busy</span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              </div>
            </div>

            {/* Staff Calling Minutes Breakdown Matrix */}
            <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#142B52]" />
                  <span>Telecaller Spoken Minutes & Staff Breakdown</span>
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Total Academy Talk Time: {formatSpokenMinutes(ownerTotalSeconds)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1">
                {staffCallingStats.map((staff) => (
                  <div
                    key={staff.name}
                    className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 truncate">{staff.name}</span>
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                        ⏱️ {staff.formattedMinutes}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Dials: <strong className="text-slate-800">{staff.totalCalls}</strong></span>
                      <span>Picked: <strong className="text-emerald-700">{staff.attended}</strong></span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                      <span>Avg: {staff.avgDurationFormatted}</span>
                      <span className="text-indigo-600 font-semibold">
                        {staff.totalCalls > 0 ? ((staff.attended / staff.totalCalls) * 100).toFixed(0) : 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Calls Feed */}
            <div className="space-y-2.5 pt-1 max-h-[380px] overflow-y-auto pr-1">
              {ownerAllCalls.slice(0, 8).map((c, idx) => {
                const attended = isAttendedCall(c);
                const displayStatus = attended ? "Attended Call" : "Not Attended Call";
                const mindsetVal = c.mindset || (c.outcome !== "Attended Call" && c.outcome !== "Not Attended Call" ? c.outcome : null);

                return (
                  <div
                    key={c.id || idx}
                    className="p-3.5 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#142B52] text-[#E5B842] font-black text-xs flex items-center justify-center shrink-0">
                        {c.studentName?.charAt(0) || "S"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900">{c.studentName}</h4>
                          <span className="font-mono text-[11px] text-slate-500">{c.studentPhone}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Speaked Staff: <strong className="text-purple-700 font-bold">{c.callerName || "Staff"}</strong> • {c.studentCourse}
                        </p>
                        {(c.qualification || c.collegeName) && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px]">
                            {c.qualification && (
                              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200/80 font-bold">
                                🎓 {c.qualification} {c.passedOutYear ? `(${c.passedOutYear})` : ""}
                              </span>
                            )}
                            {c.collegeName && (
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold truncate max-w-[200px]">
                                🏛️ {c.collegeName}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 ${
                          attended
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-rose-100 text-rose-800 border border-rose-300"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${attended ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                        {displayStatus}
                      </span>

                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-600 text-white">
                        ⏱️ {c.duration}
                      </span>

                      {mindsetVal && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#142B52]/10 text-[#142B52]">
                          {mindsetVal}
                        </span>
                      )}

                      <span className="text-[10px] font-mono text-slate-400">
                        {c.callDate}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          2. TELECALLER DASHBOARD VIEW (PERSONAL PRODUCTIVITY DESK)
      ======================================================== */}
      {activeUserRole === "Telecaller" && (
        <div className="space-y-6">
          {/* Telecaller Personal Target Progress Banner */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#D5A52B] text-[#142B52] flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  Today's Target Streak (96.6%)
                </span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  2 calls to unlock ₹500 Daily Bonus!
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {myCallerData.name}&apos;s Daily Calling Progress: {myCallerData.callsCompleted} / {myCallerData.dailyTarget} Calls Completed
              </h3>
            </div>

            <div className="w-full sm:w-72 space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Progress: 96.6%</span>
                <span>Goal: 60 Dials</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div className="bg-[#142B52] h-full rounded-full" style={{ width: "96.6%" }} />
              </div>
            </div>
          </div>

          {/* Telecaller 5 Top Personal KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <KPICard
              title="My Assigned Leads"
              value={myCallerData.assignedLeads}
              subtext="Under active communication"
              icon={Users}
              iconColor="text-[#142B52]"
              iconBg="bg-blue-50"
            />
            <KPICard
              title="Calls Completed Today"
              value={`${myCallerData.callsCompleted} / ${myCallerData.dailyTarget}`}
              subtext="Target almost achieved!"
              icon={PhoneCall}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-50"
            />
            <KPICard
              title="My Talk Time Today"
              value={myCallerStats.formattedMinutes}
              subtext="Live SIM calling minutes"
              icon={Clock}
              iconColor="text-emerald-700"
              iconBg="bg-emerald-50"
            />
            <KPICard
              title="My Interested Leads"
              value={myCallerData.interestedLeads}
              subtext="High intent students"
              icon={HeartHandshake}
              iconColor="text-indigo-600"
              iconBg="bg-indigo-50"
            />
            <KPICard
              title="My Admissions Won"
              value={myCallerData.admissionsGenerated}
              subtext="Rank #1 in Team 🏆"
              icon={Award}
              iconColor="text-[#D5A52B]"
              iconBg="bg-[#FAF1D6]"
            />
          </div>

          {/* Telecaller Main Workspace: Calling Queue + Interactive Softphone */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Priority Calling Queue */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-soft space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-base text-slate-900">My Priority Calling Queue (Today)</h3>
                  <p className="text-xs text-slate-500">Pick next student lead to call or send WhatsApp message</p>
                </div>
                <span className="text-xs font-bold text-[#142B52] bg-slate-100 px-2.5 py-1 rounded-lg">
                  {leads.length} in queue
                </span>
              </div>

              <div className="space-y-3">
                {leads.slice(0, 5).map((lead) => {
                  const isSelected = dialerLead?.id === lead.id;
                  return (
                    <div
                      key={lead.id}
                      onClick={() => setDialerLead(lead)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#FDF8ED] border-[#D5A52B] ring-2 ring-[#D5A52B]/40"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100/70"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{lead.studentName}</span>
                            <StatusBadge status={lead.priority} type="priority" />
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">{lead.phone}</p>
                        </div>
                        <StatusBadge status={lead.status} />
                      </div>

                      <p className="text-[11px] text-slate-700 font-medium truncate mt-1">
                        {lead.courseInterested}
                      </p>

                      <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">Follow-up: {lead.nextFollowUpTime || "11:30 AM"}</span>
                        <div className="flex items-center gap-1.5">
                          {(isCallConnected || callPhase === "ringing" || callPhase === "connected") && (activeCallLead?.id === lead.id || (activePhoneNumber && activePhoneNumber.endsWith(lead.phone.replace(/\D/g, "").slice(-10)))) ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                endCallSession();
                              }}
                              className="px-2.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer animate-pulse"
                              title="Hangup Call"
                            >
                              <PhoneOff className="w-3 h-3" />
                              <span>Cut ({crmCallDuration > 0 ? formatTimer(crmCallDuration) : "Ring"})</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDialerLead(lead);
                                setActiveCallLead(lead);
                                initiateCall(lead);
                              }}
                              className="px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                              title="Call Student"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Call</span>
                            </button>
                          )}
                          <Link
                            href={`/leads/${lead.id}`}
                            className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 font-semibold hover:bg-slate-50"
                          >
                            Profile
                          </Link>
                          <a
                            href={`https://wa.me/91${lead.phone.replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(
                              `Hello ${lead.studentName}, greeting from Wegrow Academy.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-2.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold flex items-center gap-1 shadow-xs"
                            title="Open WhatsApp Chat"
                          >
                            WhatsApp
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 5 Cols: Selected Student Profile & Telecaller Desk */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-soft space-y-4 flex flex-col justify-between">
              <div>
                <div className="pb-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#142B52]/10 text-[#142B52] flex items-center justify-center font-bold">
                      <GraduationCap className="w-5 h-5 text-[#142B52]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900">Student Profile & Notes</h3>
                      <p className="text-xs text-slate-500">Academic details, mobile sync & WhatsApp</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Mobile Sync Live</span>
                    </span>
                  </div>
                </div>

                {/* Selected Student Card */}
                {dialerLead ? (
                  <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#142B52] to-[#1E3B6E] text-[#D5A52B] font-black text-lg flex items-center justify-center shadow-xs shrink-0">
                          {dialerLead.studentName?.charAt(0) || "S"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm">{dialerLead.studentName}</h4>
                            <StatusBadge status={dialerLead.priority} type="priority" />
                          </div>
                          <p className="font-mono text-xs font-semibold text-slate-600 mt-0.5">
                            +91 {dialerLead.phone}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <Link
                          href={`/leads/${dialerLead.id}`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#142B52] hover:underline"
                        >
                          <span>Full Profile</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/70 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Interested Course:</span>
                        <span className="font-bold text-slate-800 text-right max-w-[220px] truncate">
                          {dialerLead.courseInterested}
                        </span>
                      </div>
                      {(dialerLead.qualification || dialerLead.collegeName) && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {dialerLead.qualification && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/80 font-bold text-[10px]">
                              <GraduationCap className="w-3 h-3 text-amber-600" />
                              <span>{dialerLead.qualification}</span>
                              {dialerLead.passedOutYear && <span>({dialerLead.passedOutYear})</span>}
                            </span>
                          )}
                          {dialerLead.collegeName && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-[10px] truncate max-w-[200px]">
                              <span>🏛️ {dialerLead.collegeName}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Live Call In-Progress Status Banner */}
                    {(isCallConnected || callPhase === "ringing" || callPhase === "connected") && (
                      <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between animate-in fade-in">
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${callPhase === "connected" ? "bg-emerald-500 animate-pulse" : "bg-amber-400 animate-ping"}`} />
                          <span className="font-bold text-xs text-emerald-900">
                            {callPhase === "connected" ? "🟢 Live Call in Progress • Speaking" : "🔔 Ringing Student's Phone..."}
                          </span>
                        </div>
                        <span className="font-mono font-black text-sm text-emerald-800 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200">
                          ⏱️ {formatTimer(crmCallDuration)}
                        </span>
                      </div>
                    )}

                    {/* Quick 1-Tap Actions: Call Student & WhatsApp */}
                    <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      {(isCallConnected || callPhase === "ringing" || callPhase === "connected") ? (
                        <button
                          type="button"
                          onClick={endCallSession}
                          className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer animate-pulse"
                        >
                          <PhoneOff className="w-4 h-4" />
                          <span>🔴 Cut Call (Hangup) • {crmCallDuration > 0 ? formatTimer(crmCallDuration) : "Ringing..."}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (dialerLead) {
                              setActiveCallLead(dialerLead);
                              initiateCall(dialerLead);
                            }
                          }}
                          className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <Phone className="w-4 h-4" />
                          <span>📞 Call Student (+91 {dialerLead.phone.replace(/\D/g, "").slice(-10)})</span>
                        </button>
                      )}

                      <a
                        href={`https://wa.me/91${dialerLead.phone.replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(
                          `Hello ${dialerLead.studentName}, this is Wegrow Academy following up regarding your inquiry for ${dialerLead.courseInterested}.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    Select a student from the calling queue on the left
                  </div>
                )}

                {/* Outcome Disposition */}
                <div className="mt-4 space-y-2 text-xs">
                  <label className="block font-bold text-slate-700">Inquiry Mindset / Outcome:</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {["Interested", "Busy", "Call Later", "Not Answered", "Counselling", "Lost"].map((out) => (
                      <button
                        key={out}
                        type="button"
                        onClick={() => setCallDisposition(out)}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                          callDisposition === out
                            ? "bg-[#142B52] text-white border-[#142B52]"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {out}
                      </button>
                    ))}
                  </div>

                  <div className="pt-2">
                    <label className="block font-semibold text-slate-700 mb-1">Counsellor Remarks / Follow-up Notes:</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Student interested in weekend GenAI batch, will visit campus..."
                      value={callerRemarks}
                      onChange={(e) => setCallerRemarks(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#142B52]/20"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveCallerDisposition}
                  className="w-full py-2.5 bg-[#142B52] hover:bg-[#1E3B6E] active:scale-98 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  Save Disposition & Advance Queue
                </button>

                {dialerLead?.callHistory && dialerLead.callHistory.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 text-left space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Past Calls with {dialerLead.studentName} ({dialerLead.callHistory.length}):
                    </span>
                    <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                      {dialerLead.callHistory.slice(0, 4).map((c: any, i: number) => {
                        const raw = String(c.duration || "").replace(/[^\d:]/g, "");
                        let isAttended = false;
                        if (raw.includes(":")) {
                          const [m, s] = raw.split(":").map(Number);
                          isAttended = (m || 0) > 0 || (s || 0) > 0;
                        } else {
                          const num = parseInt(raw, 10);
                          isAttended = !isNaN(num) && num > 0;
                        }
                        if (
                          c.outcome === "Not Attended Call" ||
                          c.outcome === "Missed" ||
                          c.outcome === "Missed / Cut" ||
                          c.outcome === "Not Answered"
                        ) {
                          isAttended = false;
                        } else if (c.outcome === "Attended Call") {
                          isAttended = true;
                        }
                        const displayStatus = isAttended ? "Attended Call" : "Not Attended Call";

                        return (
                          <div
                            key={c.id || i}
                            className="flex items-center justify-between text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-200/60"
                          >
                            <span
                              className={`font-bold px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1.5 ${
                                isAttended
                                  ? "text-emerald-800 bg-emerald-100/90 border border-emerald-300"
                                  : "text-rose-700 bg-rose-100/90 border border-rose-300"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isAttended ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                                }`}
                              />
                              {displayStatus}
                            </span>
                            <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 text-[10px]">
                              ⏱️ {c.duration}
                            </span>
                            <span className="text-slate-400 font-mono text-[10px]">{c.callDate}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          3. ADMIN DASHBOARD VIEW (OPERATIONS & INFRASTRUCTURE)
      ======================================================== */}
      {activeUserRole === "Admin" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <KPICard
              title="Total System Leads"
              value={leads.length}
              subtext="Across all 3 campuses"
              icon={Users}
              iconColor="text-[#142B52]"
              iconBg="bg-blue-50"
            />
            <KPICard
              title="Telecalling Talk Time"
              value={formatSpokenMinutes(ownerTotalSeconds)}
              subtext="Total minutes spoken today"
              icon={Clock}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-50"
            />
            <KPICard
              title="Attended Calls Ratio"
              value={`${ownerTotalAttended} / ${ownerAllCalls.length}`}
              subtext="Live SIM calls picked"
              icon={PhoneCall}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-50"
            />
            <KPICard
              title="Active Staff Logins"
              value={users.filter((u) => u.status === "Active").length}
              subtext="5 Telecallers, 1 TL, 2 Admins"
              icon={UserCheck}
              iconColor="text-indigo-600"
              iconBg="bg-indigo-50"
            />
            <KPICard
              title="Unassigned Inbound Leads"
              value="0"
              subtext="Auto-assigned within SLA"
              icon={ShieldCheck}
              iconColor="text-purple-600"
              iconBg="bg-purple-50"
            />
            <KPICard
              title="CRM API Webhooks"
              value="100% Online"
              subtext="WordPress, Meta Ads, Google Ads"
              icon={Server}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-50"
            />
          </div>

          {/* Admin Counselor Telecalling Minutes & Staff Oversight Matrix */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Telecaller Spoken Minutes & Daily Staff Audit Desk
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live calling minutes and attendance logged from Wegrow Telecaller phone app per staff counselor
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                  Total Spoken: {formatSpokenMinutes(ownerTotalSeconds)}
                </span>
                <Link
                  href="/calls"
                  className="text-xs font-bold text-[#142B52] hover:text-[#244B7A] flex items-center gap-1 bg-slate-100 px-3.5 py-1.5 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  <span>View All {ownerAllCalls.length} Call Logs →</span>
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="pb-2.5 font-bold">Staff Counselor</th>
                    <th className="pb-2.5 font-bold">Designation</th>
                    <th className="pb-2.5 font-bold text-center">Total Dials</th>
                    <th className="pb-2.5 font-bold text-center">Picked Calls</th>
                    <th className="pb-2.5 font-bold text-center">Total Talk Time (Minutes)</th>
                    <th className="pb-2.5 font-bold text-center">Avg Duration</th>
                    <th className="pb-2.5 font-bold text-right">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffCallingStats.map((staff) => (
                    <tr key={staff.name} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#142B52] text-[#E5B842] flex items-center justify-center font-bold text-xs">
                          {staff.name.charAt(0)}
                        </div>
                        <span>{staff.name}</span>
                        {staff.name === "Muthumeena" && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                            Head
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-slate-500">
                        {staff.name === "Muthumeena"
                          ? "Telecall Head / Senior Counselor"
                          : staff.name === "LakshmiPriya"
                          ? "Admissions Counselor / Admin"
                          : "Telecalling Executive"}
                      </td>
                      <td className="py-3 text-center font-bold text-slate-800">{staff.totalCalls}</td>
                      <td className="py-3 text-center">
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                          {staff.attended} ({staff.totalCalls > 0 ? ((staff.attended / staff.totalCalls) * 100).toFixed(0) : 0}%)
                        </span>
                      </td>
                      <td className="py-3 text-center font-mono font-extrabold text-emerald-800">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800">
                          ⏱️ {staff.formattedMinutes}
                        </span>
                      </td>
                      <td className="py-3 text-center font-mono text-slate-600">{staff.avgDurationFormatted}</td>
                      <td className="py-3 text-right">
                        <Link
                          href="/calls"
                          className="text-[#142B52] font-bold hover:underline text-[11px]"
                        >
                          Audit Calls →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-soft space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Lead Ingestion & Webhook Health</h3>
                  <p className="text-xs text-slate-500">Real-time status of lead capture webhooks and round-robin allocation</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                  All Systems Operational
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {[
                  { channel: "Website Inbound Forms (WordPress / Next.js)", status: "Connected", syncTime: "2s ago", leadsToday: 18 },
                  { channel: "Instagram & Facebook Lead Ads (Meta Graph API)", status: "Connected", syncTime: "1m ago", leadsToday: 24 },
                  { channel: "Google Search Ads Webhook", status: "Connected", syncTime: "5m ago", leadsToday: 12 },
                  { channel: "Campus Walk-in Reception Desk Tablet", status: "Active", syncTime: "Just now", leadsToday: 8 },
                ].map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">{item.channel}</p>
                      <p className="text-[11px] text-slate-400">Last sync: {item.syncTime}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[#142B52] block">{item.leadsToday} leads today</span>
                      <span className="text-[10px] text-emerald-600 font-semibold">{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft space-y-4">
              <h3 className="font-bold text-base text-slate-900">Admin Quick Controls</h3>
              <div className="space-y-2 text-xs">
                <Link href="/users" className="block p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-semibold text-slate-800">
                  👥 Manage Counsellor Logins & Roles
                </Link>
                <Link href="/settings" className="block p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-semibold text-slate-800">
                  🏢 Configure Campus Branches & Centers
                </Link>
                <Link href="/leads" className="block p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-semibold text-slate-800">
                  📥 Bulk Import Leads (CSV / Excel)
                </Link>
                <Link href="/courses" className="block p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-semibold text-slate-800">
                  📚 Update Course Syllabus & Fees
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
