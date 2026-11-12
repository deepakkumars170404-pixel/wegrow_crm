"use client";

import React, { useState } from "react";
import {
  Settings,
  Building2,
  MapPin,
  CheckCircle2,
  Bell,
  PhoneCall,
  MessageSquare,
  User,
  Sliders,
  Sparkles,
  Save,
  } from "lucide-react";
import { useCRM } from "@/context/CRMContext";

export default function SettingsPage() {
  const { showToast, telephonyMode, setTelephonyMode } = useCRM();

  const [activeTab, setActiveTab] = useState<
    | "company"
    | "branches"
    | "statuses"
    | "followup"
    | "notifications"
    | "calling"
    | "whatsapp"
      >("company");

  // Company Profile State
  const [companyName, setCompanyName] = useState("WeGrow Skill Campus");
  const [tagline, setTagline] = useState("Empowering Careers Through Advanced Tech & Industry Skills");
  const [website, setWebsite] = useState("https://wegrow.edu.in");
  const [supportEmail, setSupportEmail] = useState("admissions@wegrow.edu.in");
  const [gstNumber, setGstNumber] = useState("29ABCDE1234F1Z5");

  // Follow-up Settings
  const [defaultFollowupDays, setDefaultFollowupDays] = useState("2");
  const [escalationHours, setEscalationHours] = useState("4");
  const [autoReminder, setAutoReminder] = useState(true);

  // Calling Preferences
  const [dailyTarget, setDailyTarget] = useState("60");
  const [autoNextLead, setAutoNextLead] = useState(true);
  const [recordCalls, setRecordCalls] = useState(true);

  // Notification Toggles
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [whatsAppAlerts, setWhatsAppAlerts] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(false);

  const handleSave = (section: string) => {
    showToast({
      type: "success",
      title: "Settings Saved",
      message: `${section} configuration updated successfully in WeGrow CRM.`,
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">
              System Settings & Configuration
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D5A52B]/15 text-[#B88A1B]">
              Campus Admin Panel
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage WeGrow campus branches, dialer rules, WhatsApp notification templates, and lead routing parameters
          </p>
        </div>
      </div>

      {/* Main Settings Layout: Side Tabs & Form Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Settings Navigation Menu (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-2 border border-slate-200/90 shadow-soft h-fit space-y-1 text-xs">
          {[
            { id: "company", label: "Company & Brand Profile", icon: Building2 },
            { id: "branches", label: "Campus Branches & Centers", icon: MapPin },
            { id: "statuses", label: "Lead Pipeline Statuses", icon: Sliders },
            { id: "followup", label: "Follow-up & SLA Settings", icon: CheckCircle2 },
            { id: "notifications", label: "Notification Preferences", icon: Bell },
            { id: "calling", label: "Telecalling Dialer Settings", icon: PhoneCall },
            { id: "whatsapp", label: "WhatsApp Template Settings", icon: MessageSquare },
                      ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-left transition-all ${
                  isActive
                    ? "bg-[#142B52] text-white shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 ${
                    isActive ? "text-[#D5A52B]" : "text-slate-400"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Settings Form Container (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-soft">
          {/* TAB 1: COMPANY PROFILE */}
          {activeTab === "company" && (
            <div className="space-y-5 text-xs">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="font-bold text-base text-slate-900">
                  WeGrow Skill Campus Organization Profile
                </h3>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  General institutional details and branding information
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Institution / Brand Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Brand Tagline
                  </label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Official Portal Website
                    </label>
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Admissions Support Email
                    </label>
                    <input
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    GSTIN / Tax Identification
                  </label>
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSave("Company Profile")}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-[#142B52] hover:bg-[#1E3B6E] text-white rounded-xl font-bold shadow-xs"
                >
                  <Save className="w-4 h-4 text-[#D5A52B]" />
                  <span>Save Organization Profile</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: BRANCHES */}
          {activeTab === "branches" && (
            <div className="space-y-5 text-xs">
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    WeGrow Physical Campuses & Learning Centers
                  </h3>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Physical offline classroom lab facilities
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => alert("Add Campus Center Modal (Demo)")}
                  className="px-3 py-1.5 bg-[#142B52] text-white rounded-lg text-xs font-bold"
                >
                  + Add Center
                </button>
              </div>

              <div className="space-y-3">
                {[
                  {
                    name: "Bangalore Main Campus (Koramangala)",
                    address: "80 Feet Rd, 4th Block, Koramangala, Bengaluru, Karnataka 560034",
                    head: "Priya Sharma",
                    phone: "+91 80 4123 4567",
                    status: "Headquarters",
                  },
                  {
                    name: "Pune Tech Center (Hinjawadi)",
                    address: "Phase 1, Hinjawadi Rajiv Gandhi Infotech Park, Pune, Maharashtra 411057",
                    head: "Rahul Deshmukh",
                    phone: "+91 20 6789 0123",
                    status: "Regional Center",
                  },
                  {
                    name: "Hyderabad Center (HITEC City)",
                    address: "Madhapur, HITEC City, Hyderabad, Telangana 500081",
                    head: "Sneha Patel",
                    phone: "+91 40 2345 6789",
                    status: "Branch Center",
                  },
                ].map((branch) => (
                  <div
                    key={branch.name}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm">
                        {branch.name}
                      </h4>
                      <span className="text-[10px] font-bold bg-[#D5A52B]/15 text-[#B88A1B] px-2 py-0.5 rounded">
                        {branch.status}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px]">{branch.address}</p>
                    <div className="flex items-center gap-4 text-slate-600 text-[11px] pt-1">
                      <span>Center In-charge: <strong>{branch.head}</strong></span>
                      <span>Desk: <strong>{branch.phone}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PIPELINE STATUSES */}
          {activeTab === "statuses" && (
            <div className="space-y-4 text-xs">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="font-bold text-base text-slate-900">
                  Lead Disposition & Funnel Statuses
                </h3>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Standardized stages used across telecalling workflows
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  "New",
                  "Contacted",
                  "Interested",
                  "Busy",
                  "Call Later",
                  "Not Interested",
                  "Counselling Scheduled",
                  "Visited Campus",
                  "Fee Discussion",
                  "Admitted",
                  "Lost",
                ].map((status, i) => (
                  <div
                    key={status}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                  >
                    <span className="font-bold text-slate-800">
                      {i + 1}. {status}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                      Enabled
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-slate-400 pt-2">
                All 10 core statuses are standardized for consistent reporting and cannot be removed in demo mode.
              </p>
            </div>
          )}

          {/* TAB 4: FOLLOW-UP SETTINGS */}
          {activeTab === "followup" && (
            <div className="space-y-5 text-xs">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="font-bold text-base text-slate-900">
                  Follow-up Scheduling & SLA Configuration
                </h3>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Automatic escalation timers and reminder alerts for counselors
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Default Callback Reschedule Interval (Days)
                  </label>
                  <input
                    type="number"
                    value={defaultFollowupDays}
                    onChange={(e) => setDefaultFollowupDays(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    When a telecaller marks "Call Later", default date pre-fills to +2 days.
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Overdue Escalation Trigger (Hours)
                  </label>
                  <input
                    type="number"
                    value={escalationHours}
                    onChange={(e) => setEscalationHours(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Leads uncalled after scheduled time slot are flagged red after 4 hours.
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="font-bold text-slate-800">Auto-Remind Telecallers</p>
                    <p className="text-[11px] text-slate-500">
                      Show in-app alert banner 15 minutes before scheduled call time
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoReminder}
                    onChange={(e) => setAutoReminder(e.target.checked)}
                    className="w-4 h-4 accent-[#142B52]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSave("Follow-up Rules")}
                  className="px-5 py-2.5 bg-[#142B52] text-white rounded-xl font-bold"
                >
                  Save SLA Rules
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="space-y-5 text-xs">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="font-bold text-base text-slate-900">
                  Staff Alert & Notification Preferences
                </h3>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Select triggers for immediate enquiry alerts and daily summaries
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="font-bold text-slate-800">New Inbound Lead Alerts</p>
                    <p className="text-[11px] text-slate-500">
                      Receive instant notification on incoming website or ad enquiries
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="w-4 h-4 accent-[#142B52]"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="font-bold text-slate-800">WhatsApp Student Enquiries</p>
                    <p className="text-[11px] text-slate-500">
                      Alert counsellors when student replies on official WhatsApp channel
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={whatsAppAlerts}
                    onChange={(e) => setWhatsAppAlerts(e.target.checked)}
                    className="w-4 h-4 accent-[#142B52]"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="font-bold text-slate-800">Audio Chime on Call Reminders</p>
                    <p className="text-[11px] text-slate-500">
                      Play chime when follow-up time arrives
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={soundAlerts}
                    onChange={(e) => setSoundAlerts(e.target.checked)}
                    className="w-4 h-4 accent-[#142B52]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSave("Notification Preferences")}
                  className="px-5 py-2.5 bg-[#142B52] text-white rounded-xl font-bold"
                >
                  Save Notification Toggles
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: CALLING SETTINGS */}
          {activeTab === "calling" && (
            <div className="space-y-5 text-xs">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="font-bold text-base text-slate-900">
                  Telecalling Workspace & Dialer Settings
                </h3>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Parameters for daily calling targets and call disposition flows
                </p>
              </div>

                            <div className="space-y-4">
                {/* Office Network Profile Switcher */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">Active Office Network Profile</h4>
                      <p className="text-[11px] text-slate-500">Switch calling configuration when moving between campus branches</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {telephonyMode === "mobile"
                        ? "📱 Mobile SIM (Android)"
                        : "Presentation Mode"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setTelephonyMode("mobile")}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        telephonyMode === "mobile"
                          ? "bg-[#142B52] text-white border-[#142B52] shadow-sm"
                          : "bg-white text-slate-800 border-slate-200 hover:bg-slate-100/70"
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center justify-between">
                        <span>📱 Mobile Phone SIM (Android Bridge)</span>
                        {telephonyMode === "mobile" && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                      </div>
                      <p className={`text-[10px] mt-1 ${telephonyMode === "mobile" ? "text-slate-300" : "text-slate-500"}`}>
                        Dials directly through your Android phone SIM card with live talk duration sync
                      </p>
                    </button>

                    {/* MicroSIP & Landline options kept in code only as comments - not visible on webpage */}
                    {/*
                    <button
                      type="button"
                      onClick={() => setTelephonyMode("jio")}
                      className="p-3 rounded-xl border text-left"
                    >
                      <span>🏢 Local Branch MicroSIP</span>
                    </button>
                    */}

                    <button
                      type="button"
                      onClick={() => setTelephonyMode("presentation")}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        telephonyMode === "presentation"
                          ? "bg-[#142B52] text-white border-[#142B52] shadow-sm"
                          : "bg-white text-slate-800 border-slate-200 hover:bg-slate-100/70"
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center justify-between">
                        <span>🎯 Presentation / Demo Mode</span>
                        {telephonyMode === "presentation" && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                      </div>
                      <p className={`text-[10px] mt-1 ${telephonyMode === "presentation" ? "text-slate-300" : "text-slate-500"}`}>
                        100% reliable simulated demo for presentations on any Wi-Fi/Hotspot
                      </p>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Daily Call Target Per Telecaller
                  </label>
                  <input
                    type="number"
                    value={dailyTarget}
                    onChange={(e) => setDailyTarget(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Default target: 60 connected / attempted calls per day
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="font-bold text-slate-800">Auto-Select Next Lead in Queue</p>
                    <p className="text-[11px] text-slate-500">
                      Automatically advance to the next priority student after saving disposition
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoNextLead}
                    onChange={(e) => setAutoNextLead(e.target.checked)}
                    className="w-4 h-4 accent-[#142B52]"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="font-bold text-slate-800">Simulate Call Recording</p>
                    <p className="text-[11px] text-slate-500">
                      Show call recording active indicator during simulated calls
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={recordCalls}
                    onChange={(e) => setRecordCalls(e.target.checked)}
                    className="w-4 h-4 accent-[#142B52]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSave("Calling Rules")}
                  className="px-5 py-2.5 bg-[#142B52] text-white rounded-xl font-bold"
                >
                  Save Calling Parameters
                </button>
              </div>
            </div>
          )}

          {/* TAB 7: WHATSAPP SETTINGS */}
          {activeTab === "whatsapp" && (
            <div className="space-y-5 text-xs">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="font-bold text-base text-slate-900">
                  WhatsApp Business API Configuration
                </h3>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Official verified sender details and default message footer
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    WhatsApp Display Name
                  </label>
                  <input
                    type="text"
                    defaultValue="WeGrow Skill Campus Admissions"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Official WhatsApp Sender Number
                  </label>
                  <input
                    type="text"
                    defaultValue="+91 80 4123 4567"
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Standard Message Signoff / Footer
                  </label>
                  <textarea
                    rows={2}
                    defaultValue="Warm regards, WeGrow Skill Campus Admissions Office | www.wegrow.edu.in"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSave("WhatsApp Settings")}
                  className="px-5 py-2.5 bg-[#142B52] text-white rounded-xl font-bold"
                >
                  Save WhatsApp Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

