"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  PhoneCall,
  CheckCircle2,
  HeartHandshake,
  CalendarClock,
  GraduationCap,
  ArrowUpRight,
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

export default function DashboardPage() {
  const { leads, followUps, telecallers, users, activeUserRole, setActiveUserRole, addCallRecord } = useCRM();
  const [dateFilter, setDateFilter] = useState<"Today" | "This Week" | "This Month" | "Custom Range">("This Week");
  const [growthTimeframe, setGrowthTimeframe] = useState<"Weekly" | "Monthly">("Weekly");
  const [mounted, setMounted] = useState(false);

  // Softphone state for Telecaller view
  const [dialerLead, setDialerLead] = useState<any>(leads[0] || null);
  const [isDialing, setIsDialing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callDisposition, setCallDisposition] = useState("Interested");
  const [callerRemarks, setCallerRemarks] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let timer: any = null;
    if (isDialing) {
      timer = setInterval(() => setCallDuration((p) => p + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [isDialing]);

  const formatSecs = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSaveCallerDisposition = () => {
    if (!dialerLead) return;
    addCallRecord(dialerLead.id, {
      callerName: "Priya Sharma",
      outcome: callDisposition,
      duration: formatSecs(callDuration || 94),
      remarks: callerRemarks || `Student marked as ${callDisposition}`,
      nextFollowUpDate: "2026-10-31",
      nextFollowUpTime: "03:00 PM",
    });
    setIsDialing(false);
    setCallerRemarks("");
  };

  const todayFollowUps = (followUps || [])
    .filter((f) => f.status === "Today" || f.status === "Overdue")
    .slice(0, 5);

  const recentEnquiries = (leads || []).slice(0, 5);

  // Current telecaller data for Telecaller view
  const myCallerData = telecallers?.[0] || {
    id: "caller-1",
    name: "Priya Sharma",
    email: "priya.sharma@wegrow.edu",
    phone: "+91 98201 44321",
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
  };

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
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                My Calling Station & Target Desk
              </h2>
              <p className="text-xs sm:text-sm text-slate-200 max-w-xl">
                Logged in as <strong>{myCallerData.name}</strong> • 58 of 60 calls completed today (96.6% target achieved).
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
                Priya's Daily Calling Progress: 58 / 60 Calls Completed
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

          {/* Telecaller 4 Top Personal KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                          <Link
                            href={`/leads/${lead.id}`}
                            className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 font-semibold"
                          >
                            Profile
                          </Link>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDialerLead(lead);
                              setIsDialing(true);
                            }}
                            className="px-2.5 py-0.5 bg-[#142B52] text-white rounded font-bold hover:bg-[#1E3B6E]"
                          >
                            Call Now
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 5 Cols: Integrated Softphone Dialer */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-soft space-y-4 flex flex-col justify-between">
              <div>
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Softphone Calling Station</h3>
                    <p className="text-xs text-slate-500">Live dialer with call outcome logging</p>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>

                {isDialing ? (
                  /* Active Call Mode */
                  <div className="bg-[#142B52] text-white rounded-2xl p-5 text-center space-y-3 mt-3">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#D5A52B] to-[#FAF1D6] text-[#142B52] font-black text-xl flex items-center justify-center mx-auto calling-pulse">
                      {dialerLead?.studentName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">{dialerLead?.studentName}</h4>
                      <p className="text-xs text-slate-300 font-mono">{dialerLead?.phone}</p>
                      <p className="text-base font-mono font-bold text-[#D5A52B] mt-1">{formatSecs(callDuration)}</p>
                    </div>

                    <div className="flex justify-center gap-3 pt-1">
                      <button
                        onClick={() => setIsDialing(false)}
                        className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-bold shadow-md"
                      >
                        End Call
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Idle Mode */
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-3 text-center space-y-2">
                    <p className="text-xs font-bold text-slate-800">
                      Selected: {dialerLead?.studentName}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {dialerLead?.phone} • {dialerLead?.courseInterested}
                    </p>
                    <button
                      onClick={() => setIsDialing(true)}
                      className="px-5 py-2.5 bg-[#142B52] hover:bg-[#1E3B6E] text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 mx-auto"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-[#D5A52B]" />
                      <span>Start Call</span>
                    </button>
                  </div>
                )}

                {/* Outcome Disposition */}
                <div className="mt-4 space-y-2 text-xs">
                  <label className="block font-bold text-slate-700">Call Outcome Disposition:</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {["Interested", "Busy", "Call Later", "Not Answered", "Counselling", "Lost"].map((out) => (
                      <button
                        key={out}
                        type="button"
                        onClick={() => setCallDisposition(out)}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all ${
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
                    <label className="block font-semibold text-slate-700 mb-1">Remarks / Callback Notes:</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Student interested in weekend GenAI batch..."
                      value={callerRemarks}
                      onChange={(e) => setCallerRemarks(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveCallerDisposition}
                className="w-full py-2.5 bg-[#142B52] hover:bg-[#1E3B6E] text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Save Disposition & Advance Queue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          3. ADMIN DASHBOARD VIEW (OPERATIONS & INFRASTRUCTURE)
      ======================================================== */}
      {activeUserRole === "Admin" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Total System Leads"
              value={leads.length}
              subtext="Across all 3 campuses"
              icon={Users}
              iconColor="text-[#142B52]"
              iconBg="bg-blue-50"
            />
            <KPICard
              title="Active Staff Logins"
              value={users.filter((u) => u.status === "Active").length}
              subtext="5 Telecallers, 1 TL, 2 Admins"
              icon={UserCheck}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-50"
            />
            <KPICard
              title="Unassigned Inbound Leads"
              value="0"
              subtext="Auto-assigned within SLA"
              icon={ShieldCheck}
              iconColor="text-indigo-600"
              iconBg="bg-indigo-50"
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
