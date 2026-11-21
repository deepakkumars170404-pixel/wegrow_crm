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
  Smartphone,
  X,
  Trash2,
  Plus,
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
    // Physical Campuses State with real WeGrow locations
  const [campuses, setCampuses] = useState([
    {
      id: "camp-sivakasi-main",
      name: "Sivakasi (Main Branch)",
      address: "193, 1A, Ayyappan kovil opposite / Naturals Salon & Spa Downstairs, Parasakthi Colony, Sivakasi, Tamil Nadu 626123",
      head: "Thavabalan",
      phone: "+91 98431 73678",
      status: "Headquarters / Main Branch",
    },
    {
      id: "camp-sivakasi-thiruthangal",
      name: "Sivakasi (Thiruthangal Road)",
      address: "100A/5, 1st Floor, Thiruthangal Road, Opposite Bell Hotel, IBACO Upstairs, Sivakasi – 626 123",
      head: "LakshmiPriya (GM)",
      phone: "+91 98431 73678",
      status: "Branch Center",
    },
    {
      id: "camp-srivilliputtur",
      name: "Srivilliputtur Branch",
      address: "129, North Car Street, Opposite Bombay Textiles, Upstairs Pathras Kids & Gift Shop, Srivilliputtur – 626 125",
      head: "Gopinath (HR)",
      phone: "+91 99438 77948",
      status: "Learning Center",
    },
  ]);

  const [isAddCampusModalOpen, setIsAddCampusModalOpen] = useState(false);
  const [newCampusName, setNewCampusName] = useState("");
  const [newCampusAddress, setNewCampusAddress] = useState("");
  const [newCampusHead, setNewCampusHead] = useState("");
  const [newCampusPhone, setNewCampusPhone] = useState("+91 ");
  const [newCampusStatus, setNewCampusStatus] = useState("Branch Center");

  // Lead Pipeline & Funnel Statuses State
  const [statuses, setStatuses] = useState<string[]>([
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
  ]);
  const [isAddStatusModalOpen, setIsAddStatusModalOpen] = useState(false);
  const [newStatusInput, setNewStatusInput] = useState("");

  // WhatsApp Gateway API Configuration (MyDreamsTechnology)
  const [waLicenseNumber, setWaLicenseNumber] = useState("90093749600");
  const [waApiKey, setWaApiKey] = useState("kPHm6t2y5cW78qhKGvZYefQ3E");
  const [waGatewayUrl, setWaGatewayUrl] = useState("https://wa.mydreamstechnology.in/api/sendtemplate.php");

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
                    Physical offline classroom lab facilities & branch offices
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddCampusModalOpen(true)}
                  className="px-3.5 py-2 bg-[#142B52] hover:bg-[#1E3B6E] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <span>+ Add Center</span>
                </button>
              </div>

              {/* Add Center Modal */}
              {isAddCampusModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-lg space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-[#0284c7]" />
                        <span>Add New WeGrow Campus Center</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => setIsAddCampusModalOpen(false)}
                        className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Center / Branch Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Sivakasi (Main Branch)"
                          value={newCampusName}
                          onChange={(e) => setNewCampusName(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Full Physical Address</label>
                        <textarea
                          rows={2}
                          placeholder="Building, street, landmark, city, pincode"
                          value={newCampusAddress}
                          onChange={(e) => setNewCampusAddress(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Center In-Charge</label>
                          <input
                            type="text"
                            placeholder="e.g. Thavabalan"
                            value={newCampusHead}
                            onChange={(e) => setNewCampusHead(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Desk Phone</label>
                          <input
                            type="text"
                            placeholder="+91 98431 73678"
                            value={newCampusPhone}
                            onChange={(e) => setNewCampusPhone(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Campus Type / Status</label>
                        <select
                          value={newCampusStatus}
                          onChange={(e) => setNewCampusStatus(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-medium"
                        >
                          <option value="Headquarters / Main Branch">Headquarters / Main Branch</option>
                          <option value="Branch Center">Branch Center</option>
                          <option value="Learning Center">Learning Center</option>
                          <option value="Regional Office">Regional Office</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setIsAddCampusModalOpen(false)}
                        className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!newCampusName.trim()) return;
                          setCampuses((prev) => [
                            ...prev,
                            {
                              id: `camp-${Date.now()}`,
                              name: newCampusName.trim(),
                              address: newCampusAddress.trim(),
                              head: newCampusHead.trim() || "Thavabalan",
                              phone: newCampusPhone.trim() || "+91 98431 73678",
                              status: newCampusStatus,
                            },
                          ]);
                          setNewCampusName("");
                          setNewCampusAddress("");
                          setNewCampusHead("");
                          setIsAddCampusModalOpen(false);
                          showToast({
                            type: "success",
                            title: "Campus Added",
                            message: `${newCampusName} has been added to WeGrow Campus network.`,
                          });
                        }}
                        className="px-4 py-2 bg-[#142B52] text-white rounded-xl text-xs font-bold hover:bg-[#1E3B6E]"
                      >
                        Save Center
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {campuses.map((branch) => (
                  <div
                    key={branch.id || branch.name}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#0284c7]" />
                        <span>{branch.name}</span>
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-[#D5A52B]/15 text-[#B88A1B] px-2.5 py-0.5 rounded-full">
                          {branch.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Remove ${branch.name}?`)) {
                              setCampuses((prev) => prev.filter((c) => (c.id || c.name) !== (branch.id || branch.name)));
                            }
                          }}
                          className="text-slate-400 hover:text-rose-600 text-xs px-1.5 py-0.5 rounded"
                          title="Remove Campus"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed pl-6">{branch.address}</p>
                    <div className="flex items-center gap-5 text-slate-600 text-[11px] pt-1 pl-6">
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
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Lead Disposition & Funnel Statuses
                  </h3>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Pipeline stages used across telecalling queues and admission tracking
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddStatusModalOpen(true)}
                  className="px-3.5 py-2 bg-[#142B52] hover:bg-[#1E3B6E] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <span>+ Add New Stage</span>
                </button>
              </div>

              {/* Add New Status Modal */}
              {isAddStatusModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-sm space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <h4 className="font-bold text-sm text-slate-900">Add New Pipeline Stage</h4>
                      <button
                        type="button"
                        onClick={() => setIsAddStatusModalOpen(false)}
                        className="text-slate-400 hover:text-slate-600 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Stage / Disposition Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Document Verification / Aptitude Test"
                        value={newStatusInput}
                        onChange={(e) => setNewStatusInput(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setIsAddStatusModalOpen(false)}
                        className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!newStatusInput.trim()) return;
                          setStatuses((prev) => [...prev, newStatusInput.trim()]);
                          setNewStatusInput("");
                          setIsAddStatusModalOpen(false);
                          showToast({
                            type: "success",
                            title: "Stage Added",
                            message: `New status "${newStatusInput.trim()}" enabled.`,
                          });
                        }}
                        className="px-4 py-1.5 bg-[#142B52] text-white rounded-xl text-xs font-bold"
                      >
                        Add Stage
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                {statuses.map((status, i) => (
                  <div
                    key={status}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                  >
                    <span className="font-bold text-slate-800">
                      {i + 1}. {status}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                        Active
                      </span>
                      {i >= 11 && (
                        <button
                          type="button"
                          onClick={() => setStatuses((prev) => prev.filter((s) => s !== status))}
                          className="text-slate-400 hover:text-rose-600 px-1 font-bold"
                          title="Remove custom stage"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-slate-400 pt-2">
                Custom stages are automatically synchronized across Telecaller Call Logs, Leads Table, and the Admission Pipeline.
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
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      📱 Mobile SIM (Android Bridge) Active
                    </span>
                  </div>

                  <div className="pt-1">
                    <div className="p-4 rounded-xl border bg-[#142B52] text-white border-[#142B52] shadow-sm space-y-1">
                      <div className="font-bold text-xs flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-emerald-400" />
                          <span>Mobile Phone SIM (Android Bridge) — 100% Operational</span>
                        </span>
                        <span className="flex items-center gap-1.5 text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          Live Calling Active
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        All telecalling dials directly through the assigned counsellor's Android SIM card. Spoken call duration, timestamps, and recording indicators sync automatically to the CRM Cloud.
                      </p>
                    </div>
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
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Official WhatsApp Cloud Gateway Configuration
                  </h3>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Powered by MyDreamsTechnology Official Template Gateway
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Gateway Connected
                </span>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      License Number
                    </label>
                    <input
                      type="text"
                      value={waLicenseNumber}
                      onChange={(e) => setWaLicenseNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      API Secret Key
                    </label>
                    <input
                      type="text"
                      value={waApiKey}
                      onChange={(e) => setWaApiKey(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    API Gateway Endpoint URL
                  </label>
                  <input
                    type="text"
                    value={waGatewayUrl}
                    onChange={(e) => setWaGatewayUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs text-slate-600"
                  />
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <p className="font-bold text-slate-800 text-xs">Direct Template Dispatch Format:</p>
                  <code className="text-[10px] text-[#0284c7] block overflow-x-auto whitespace-pre font-mono p-2 bg-white rounded border border-slate-200">
                    https://wa.mydreamstechnology.in/api/sendtemplate.php?LicenseNumber={waLicenseNumber}&APIKey={waApiKey}&Contact=91...&Template=...
                  </code>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Standard Message Signoff / Campus Signature
                  </label>
                  <textarea
                    rows={2}
                    defaultValue="Warm regards, WeGrow Skill Campus Admissions Office • Sivakasi & Srivilliputtur | www.wegrow.edu.in"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSave("WhatsApp Official API Settings")}
                  className="px-5 py-2.5 bg-[#142B52] hover:bg-[#1E3B6E] text-white rounded-xl font-bold cursor-pointer transition-all"
                >
                  Save WhatsApp Gateway Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

