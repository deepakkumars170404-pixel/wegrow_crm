"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Download,
  Calendar,
  FileSpreadsheet,
  FileText,
  PhoneCall,
  Users,
  GraduationCap,
  TrendingUp,
  Percent,
  Sparkles,
  ArrowUpRight,
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
import { useCRM } from "@/context/CRMContext";
import { formatINR } from "@/lib/utils";

const courseWiseEnquiriesData = [
  { course: "AI Explorer & GenAI", enquiries: 345, admissions: 28, revenue: 1260000 },
  { course: "Full Stack (MERN)", enquiries: 298, admissions: 24, revenue: 1320000 },
  { course: "Data Science & ML", enquiries: 220, admissions: 16, revenue: 768000 },
  { course: "Digital Marketing", enquiries: 190, admissions: 11, revenue: 352000 },
  { course: "UI/UX Masterclass", enquiries: 115, admissions: 7, revenue: 266000 },
  { course: "Cloud & DevOps", enquiries: 80, admissions: 3, revenue: 156000 },
];

const callingVolumeData = [
  { day: "Mon", total: 240, connected: 185, interested: 42 },
  { day: "Tue", total: 265, connected: 202, interested: 48 },
  { day: "Wed", total: 250, connected: 195, interested: 45 },
  { day: "Thu", total: 280, connected: 218, interested: 56 },
  { day: "Fri", total: 310, connected: 245, interested: 64 },
  { day: "Sat", total: 340, connected: 275, interested: 72 },
  { day: "Sun", total: 110, connected: 82, interested: 18 },
];

export default function ReportsPage() {
  const { telecallers, showToast } = useCRM();
  const [activeTab, setActiveTab] = useState<
    "enquiry" | "calling" | "admission" | "performance"
  >("enquiry");
  const [timeRange, setTimeRange] = useState("This Month");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleExport = (format: "PDF" | "Excel") => {
    showToast({
      type: "success",
      title: `Export ${format} Initiated`,
      message: `WeGrow Skill Campus ${activeTab} report (${timeRange}) generated and ready for presentation.`,
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Date Filter */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">
              Reports & Executive Analytics
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#142B52]/10 text-[#142B52]">
              Management Briefing
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Comprehensive metrics on enquiry intake, dialer reach, counsellor productivity, and batch admissions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time range selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
          >
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
            <option value="This Quarter">This Quarter (Q4 2026)</option>
            <option value="Year to Date">Year to Date (2026)</option>
          </select>

          {/* Export PDF */}
          <button
            onClick={() => handleExport("PDF")}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>

          {/* Export Excel */}
          <button
            onClick={() => handleExport("Excel")}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200/90 shadow-soft flex flex-wrap gap-2">
        {[
          { id: "enquiry", label: "Enquiry Reports", icon: Users },
          { id: "calling", label: "Calling Reports", icon: PhoneCall },
          { id: "admission", label: "Admission Reports", icon: GraduationCap },
          { id: "performance", label: "Performance Reports", icon: TrendingUp },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-[#142B52] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-4 h-4 text-[#D5A52B]" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ENQUIRY REPORTS */}
      {activeTab === "enquiry" && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-soft">
              <span className="text-slate-500 font-semibold uppercase text-[10px]">Total Inbound Leads</span>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">1,248</h3>
              <p className="text-emerald-600 font-semibold mt-1">+18.4% vs previous month</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-soft">
              <span className="text-slate-500 font-semibold uppercase text-[10px]">Top Performing Course</span>
              <h3 className="text-base font-bold text-[#142B52] mt-1">AI Explorer & GenAI</h3>
              <p className="text-slate-400 mt-1">345 enquiries (27.6%)</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-soft">
              <span className="text-slate-500 font-semibold uppercase text-[10px]">Primary Lead Source</span>
              <h3 className="text-base font-bold text-slate-900 mt-1">Website Organic</h3>
              <p className="text-slate-400 mt-1">436 student forms (35%)</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-soft">
              <span className="text-slate-500 font-semibold uppercase text-[10px]">Avg. Response Time</span>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">14 Mins</h3>
              <p className="text-slate-400 mt-1">SLA: Under 30 minutes</p>
            </div>
          </div>

          {/* Course-wise Enquiries Chart */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-soft">
            <h3 className="font-bold text-base text-slate-900 mb-1">
              Course-wise Enquiry Volume vs Admissions
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Distribution of prospective tech students across programs
            </p>

            <div className="h-80 w-full">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={courseWiseEnquiriesData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="course" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#142B52",
                        color: "#fff",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: "10px" }} />
                    <Bar dataKey="enquiries" name="Total Enquiries" fill="#142B52" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="admissions" name="Admissions Converted" fill="#D5A52B" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CALLING REPORTS */}
      {activeTab === "calling" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-soft">
              <span className="text-slate-500 font-semibold uppercase text-[10px]">Total Dials Logged</span>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">1,800</h3>
              <p className="text-slate-400 mt-1">Across 5 active telecallers</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-soft">
              <span className="text-slate-500 font-semibold uppercase text-[10px]">Total Connected Calls</span>
              <h3 className="text-2xl font-bold text-indigo-700 mt-1">1,402</h3>
              <p className="text-emerald-600 font-semibold mt-1">77.8% connection rate</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-soft">
              <span className="text-slate-500 font-semibold uppercase text-[10px]">Missed / Unanswered</span>
              <h3 className="text-2xl font-bold text-slate-600 mt-1">398</h3>
              <p className="text-slate-400 mt-1">Queued for retry callback</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-soft">
              <span className="text-slate-500 font-semibold uppercase text-[10px]">Avg Calls / Caller / Day</span>
              <h3 className="text-2xl font-bold text-[#142B52] mt-1">52.4</h3>
              <p className="text-emerald-600 font-semibold mt-1">Above target (50/day)</p>
            </div>
          </div>

          {/* Daily Calling Volume Trend */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-soft">
            <h3 className="font-bold text-base text-slate-900 mb-1">
              Calling Volume & Lead Engagement Trend
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Daily calling activity breakdown
            </p>

            <div className="h-80 w-full">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={callingVolumeData}>
                    <defs>
                      <linearGradient id="totalColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#142B52" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#142B52" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="connColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D5A52B" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#D5A52B" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#142B52",
                        color: "#fff",
                        borderRadius: "12px",
                      }}
                    />
                    <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: "10px" }} />
                    <Area type="monotone" dataKey="total" name="Total Calls Dialed" stroke="#142B52" fill="url(#totalColor)" strokeWidth={2} />
                    <Area type="monotone" dataKey="connected" name="Connected Calls" stroke="#D5A52B" fill="url(#connColor)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ADMISSION REPORTS */}
      {activeTab === "admission" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-soft">
              <span className="text-slate-500 font-semibold uppercase text-[10px]">Total Admissions Won</span>
              <h3 className="text-2xl font-bold text-emerald-700 mt-1">89 Students</h3>
              <p className="text-emerald-600 font-semibold mt-1">+24.2% month-on-month</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-soft">
              <span className="text-slate-500 font-semibold uppercase text-[10px]">Gross Fee Booked</span>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">₹43,25,000</h3>
              <p className="text-slate-400 mt-1">INR Course Revenue</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-soft">
              <span className="text-slate-500 font-semibold uppercase text-[10px]">Conversion Ratio</span>
              <h3 className="text-2xl font-bold text-[#D5A52B] mt-1">7.13%</h3>
              <p className="text-slate-400 mt-1">Enquiry to Paid Admission</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-soft">
              <span className="text-slate-500 font-semibold uppercase text-[10px]">Avg Fee / Student</span>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">₹48,595</h3>
              <p className="text-slate-400 mt-1">Average order value</p>
            </div>
          </div>

          {/* Revenue Breakdown Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-soft">
            <h3 className="font-bold text-base text-slate-900 mb-4">
              Program-wise Admission & Tuition Revenue Breakdown
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Course Name</th>
                    <th className="py-2.5 px-3">Enquiries</th>
                    <th className="py-2.5 px-3">Admissions</th>
                    <th className="py-2.5 px-3">Conversion %</th>
                    <th className="py-2.5 px-3 text-right">Fee Revenue Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {courseWiseEnquiriesData.map((row) => (
                    <tr key={row.course} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-slate-800">{row.course}</td>
                      <td className="py-3 px-3 text-slate-600">{row.enquiries}</td>
                      <td className="py-3 px-3 font-bold text-emerald-700">{row.admissions}</td>
                      <td className="py-3 px-3 font-semibold text-[#142B52]">
                        {((row.admissions / row.enquiries) * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                        {formatINR(row.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PERFORMANCE REPORTS */}
      {activeTab === "performance" && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Individual Counsellor Performance Audit
              </h3>
              <p className="text-xs text-slate-500">
                Targets, calling speed, follow-up diligence, and student conversions
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-3">Telecaller Name</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Assigned Leads</th>
                  <th className="py-3 px-3">Calls Done</th>
                  <th className="py-3 px-3">Follow-ups Completed</th>
                  <th className="py-3 px-3">Interested Leads</th>
                  <th className="py-3 px-3">Admissions Won</th>
                  <th className="py-3 px-3 text-right">Conv. Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {telecallers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={t.avatar}
                          alt={t.name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <span className="font-bold text-slate-900">{t.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-500">{t.role}</td>
                    <td className="py-3 px-3 font-semibold text-slate-700">{t.assignedLeads}</td>
                    <td className="py-3 px-3 font-semibold text-[#142B52]">
                      {t.callsCompleted} / {t.dailyTarget}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{t.followUpsCompleted}</td>
                    <td className="py-3 px-3 font-bold text-indigo-700">{t.interestedLeads}</td>
                    <td className="py-3 px-3 font-bold text-emerald-700">{t.admissionsGenerated}</td>
                    <td className="py-3 px-3 text-right font-extrabold text-[#142B52]">
                      {t.conversionRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

