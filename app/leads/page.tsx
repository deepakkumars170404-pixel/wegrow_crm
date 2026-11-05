"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users2,
  Search,
  Filter,
  PlusCircle,
  Upload,
  Download,
  Phone,
  PhoneCall,
  MessageSquare,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  X,
  FileSpreadsheet,
  Lock,
  ShieldAlert,
  ChevronDown,
  ListFilter,
  Sparkles,
  Flame,
  CheckCircle,
  Bot,
} from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AddLeadModal } from "@/components/leads/AddLeadModal";
import { Lead, LeadPriority, LeadStatus } from "@/types";

type LeadCustomView =
  | "all_leads"
  | "my_leads"
  | "hot_leads"
  | "today_followups"
  | "unassigned"
  | "admitted";

export default function LeadsPage() {
  const {
    leads,
    courses,
    telecallers,
    updateLead,
    updateLeadStatus,
    activeUserRole,
    addToast,
    initiateCall,
    openAiCallModal,
    openAiBatchDialer,
  } = useCRM();

  const isOwnerMD = activeUserRole === "Owner" || activeUserRole === "Owner / MD";
  const isTelecaller = activeUserRole === "Telecaller";

  // Custom View state
  // Default to "all_leads"
  const [customView, setCustomView] = useState<LeadCustomView>("all_leads");

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("All");
  const [selectedSource, setSelectedSource] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedCaller, setSelectedCaller] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Role Permissions
  const canExport = activeUserRole === "Admin" || activeUserRole === "Owner" || activeUserRole === "Owner / MD";

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // 1. Custom View Filter
      if (customView === "my_leads" && lead.assignedCaller !== "Priya Sharma") {
        return false;
      }
      if (customView === "hot_leads" && lead.priority !== "Hot") {
        return false;
      }
      if (customView === "today_followups" && (!lead.nextFollowUpDate || lead.nextFollowUpDate === "-")) {
        return false;
      }
      if (customView === "unassigned" && lead.assignedCaller && lead.assignedCaller !== "Unassigned") {
        return false;
      }
      if (customView === "admitted" && lead.status !== "Admitted") {
        return false;
      }

      // 2. Search
      const matchesSearch =
        searchQuery === "" ||
        lead.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.includes(searchQuery) ||
        lead.email.toLowerCase().includes(searchQuery.toLowerCase());

      // 3. Course
      const matchesCourse =
        selectedCourse === "All" || lead.courseInterested === selectedCourse;

      // 4. Source
      const matchesSource =
        selectedSource === "All" || lead.leadSource === selectedSource;

      // 5. Status
      const matchesStatus =
        selectedStatus === "All" || lead.status === selectedStatus;

      // 6. Caller
      const matchesCaller =
        selectedCaller === "All" || lead.assignedCaller === selectedCaller;

      // 7. Priority
      const matchesPriority =
        selectedPriority === "All" || lead.priority === selectedPriority;

      return (
        matchesSearch &&
        matchesCourse &&
        matchesSource &&
        matchesStatus &&
        matchesCaller &&
        matchesPriority
      );
    });
  }, [
    leads,
    customView,
    searchQuery,
    selectedCourse,
    selectedSource,
    selectedStatus,
    selectedCaller,
    selectedPriority,
  ]);

  // Paginated Leads
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage) || 1;
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLeads.slice(start, start + itemsPerPage);
  }, [filteredLeads, currentPage]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCourse("All");
    setSelectedSource("All");
    setSelectedStatus("All");
    setSelectedCaller("All");
    setSelectedPriority("All");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedCourse !== "All" ||
    selectedSource !== "All" ||
    selectedStatus !== "All" ||
    selectedCaller !== "All" ||
    selectedPriority !== "All";

  // Handle Edit Lead submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    updateLead(editingLead.id, {
      studentName: editingLead.studentName,
      phone: editingLead.phone,
      email: editingLead.email,
      courseInterested: editingLead.courseInterested,
      leadSource: editingLead.leadSource,
      assignedCaller: editingLead.assignedCaller,
      priority: editingLead.priority,
      status: editingLead.status,
      nextFollowUpDate: editingLead.nextFollowUpDate,
      nextFollowUpTime: editingLead.nextFollowUpTime,
    });
    setEditingLead(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Actions & Role-Based Views */}
      {isOwnerMD ? (
        /* ================= OWNER / MD EXECUTIVE DATA SHOW & AUDIT VIEW ================= */
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-soft space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">
                  Student Enquiries Repository & Audit
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#142B52] text-[#D5A52B]">
                  Executive Oversight Mode
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Executive data dashboard: Total enquiry volume, telecaller floor allocation, and admission conversions
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  addToast("Export: Executive Lead Audit Report generated in Excel format.", "success");
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#142B52] hover:bg-[#1E3B6E] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-[#D5A52B]" />
                <span>Download Executive Audit Report</span>
              </button>
            </div>
          </div>

          {/* MD Executive Summary KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Campus Enquiries
              </span>
              <p className="text-lg font-bold text-slate-900 mt-0.5 font-mono">
                {leads.length} Students
              </p>
              <span className="text-[10px] text-slate-500">All sources combined</span>
            </div>

            <div className="bg-emerald-50/70 rounded-xl p-3 border border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                Admissions Won
              </span>
              <p className="text-lg font-bold text-emerald-900 mt-0.5 font-mono">
                {leads.filter((l) => l.status === "Admitted").length} Enrolled
              </p>
              <span className="text-[10px] text-emerald-700 font-semibold">
                {((leads.filter((l) => l.status === "Admitted").length / leads.length) * 100).toFixed(1)}% Conversion Rate
              </span>
            </div>

            <div className="bg-blue-50/70 rounded-xl p-3 border border-blue-100">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                Active In-Pipeline
              </span>
              <p className="text-lg font-bold text-blue-900 mt-0.5 font-mono">
                {leads.filter((l) => l.status !== "Admitted" && l.status !== "Lost").length} Students
              </p>
              <span className="text-[10px] text-blue-600 font-medium">Under active telecalling</span>
            </div>

            <div className="bg-amber-50/70 rounded-xl p-3 border border-amber-100">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                Caller Floor Distribution
              </span>
              <p className="text-lg font-bold text-amber-950 mt-0.5 font-mono">
                {telecallers.length} Active Callers
              </p>
              <span className="text-[10px] text-amber-800 font-medium">Balanced floor pacing</span>
            </div>
          </div>
        </div>
      ) : (
        /* ================= TELECALLING TEAM & STAFF OPERATIONAL VIEW ================= */
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Custom View Dropdown */}
              <div className="relative inline-block">
                <select
                  value={customView}
                  onChange={(e) => {
                    setCustomView(e.target.value as LeadCustomView);
                    setCurrentPage(1);
                  }}
                  className="appearance-none bg-slate-100 hover:bg-slate-200/80 text-slate-900 font-bold text-lg rounded-xl pl-3.5 pr-8 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#142B52]/20 border border-slate-300/80"
                >
                  <option value="all_leads">📋 All Enquiries ({leads.length})</option>
                  <option value="my_leads">🎯 My Assigned Leads ({leads.filter((l) => l.assignedCaller === "Priya Sharma").length})</option>
                  <option value="hot_leads">🔥 Hot Priority Leads ({leads.filter((l) => l.priority === "Hot").length})</option>
                  <option value="today_followups">📅 Today's Follow-ups ({leads.filter((l) => l.nextFollowUpDate && l.nextFollowUpDate !== "-").length})</option>
                  <option value="unassigned">⚠️ Unassigned Leads ({leads.filter((l) => !l.assignedCaller || l.assignedCaller === "Unassigned").length})</option>
                  <option value="admitted">🎓 Admitted Students ({leads.filter((l) => l.status === "Admitted").length})</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#142B52]/10 text-[#142B52]">
                {filteredLeads.length} Leads Active
              </span>
            </div>

            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
              <span>Operational Desk: <strong className="text-slate-700">Telecalling Team</strong></span>
              <span>•</span>
              <span className="text-[#244B7A] font-semibold">Active Staff: Priya Sharma</span>
              {!canExport && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                    <Lock className="w-3 h-3" />
                    Anti-leak Policy Active (Export restricted)
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {canExport ? (
              <button
                onClick={() => {
                  addToast("Export: Downloaded student leads dataset to Excel.", "success");
                }}
                className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                title="Export all filtered student leads to Excel / CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export Excel</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  addToast("Security Policy: Telecallers cannot export contact database to prevent student lead leakages.", "warning");
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 border border-slate-200 text-slate-400 rounded-xl text-xs font-semibold cursor-not-allowed"
                title="🔒 Export Restricted by Campus Security Policy"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span className="line-through">Export Excel</span>
              </button>
            )}

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Import Leads</span>
            </button>

            <button
              onClick={() => openAiBatchDialer()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-indigo-700 hover:from-emerald-700 hover:to-indigo-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:scale-105 active:scale-95"
              title="Launch Autonomous AI Batch Calling"
            >
              <Bot className="w-3.5 h-3.5 text-emerald-200" />
              <span>AI Batch Dialer</span>
            </button>

            <button
              onClick={() => setIsAddLeadModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#142B52] hover:bg-[#1E3B6E] text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-[#142B52]/20"
            >
              <PlusCircle className="w-4 h-4 text-[#D5A52B]" />
              <span>Add New Lead</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar Panel */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-soft space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name or phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#142B52]/20 focus:border-[#142B52]"
            />
          </div>

          {/* Filter Course */}
          <div>
            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#142B52]/20 focus:border-[#142B52]"
            >
              <option value="All">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#142B52]/20 focus:border-[#142B52]"
            >
              <option value="All">All Statuses</option>
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

          {/* Filter Caller */}
          <div>
            <select
              value={selectedCaller}
              onChange={(e) => {
                setSelectedCaller(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#142B52]/20 focus:border-[#142B52]"
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

        {/* Secondary Filter Row: Source & Priority + Clear Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Source:</span>
              <select
                value={selectedSource}
                onChange={(e) => {
                  setSelectedSource(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
              >
                <option value="All">All Sources</option>
                <option value="Website">Website</option>
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
                <option value="Google Ads">Google Ads</option>
                <option value="Walk-in">Walk-in</option>
                <option value="Referral">Referral</option>
                <option value="Phone">Phone</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Priority:</span>
              <div className="flex gap-1">
                {(["All", "Hot", "Warm", "Cold"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setSelectedPriority(p);
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      selectedPriority === p
                        ? "bg-[#142B52] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Priority Quick Guide for Telecallers */}
        <div className="flex flex-wrap items-center gap-4 pt-2 text-[11px] text-slate-500 border-t border-slate-100">
          <span className="font-semibold text-slate-700">Priority Guide:</span>
          <span className="flex items-center gap-1 text-rose-700">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <strong>Hot:</strong> High intent / Wants demo or seat confirmation
          </span>
          <span className="flex items-center gap-1 text-amber-700">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <strong>Warm:</strong> Positive call / Discussing course fee & timings
          </span>
          <span className="flex items-center gap-1 text-sky-700">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            <strong>Cold:</strong> Early stage / Requires nurture follow-up
          </span>
        </div>
      </div>

      {/* Leads Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Student Details</th>
                <th className="py-3.5 px-4">Course Interested</th>
                <th className="py-3.5 px-4">Lead Source</th>
                <th className="py-3.5 px-4">Assigned Caller</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Enquiry Date</th>
                <th className="py-3.5 px-4">Next Follow-up</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Users2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-600">
                      No leads match your filter criteria
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try adjusting the search query or clearing filters.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Student Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div>
                          <Link
                            href={`/leads/${lead.id}`}
                            className="font-bold text-slate-900 hover:text-[#244B7A] transition-colors"
                          >
                            {lead.studentName}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-slate-500 font-mono">
                              {lead.phone}
                            </span>
                            {lead.city && (
                              <span className="text-[10px] text-slate-400">
                                • {lead.city}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Course */}
                    <td className="py-3.5 px-4 text-slate-700 font-medium max-w-[180px]">
                      <span className="line-clamp-1" title={lead.courseInterested}>
                        {lead.courseInterested}
                      </span>
                    </td>

                    {/* Source */}
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                        {lead.leadSource}
                      </span>
                    </td>

                    {/* Assigned Caller */}
                    <td className="py-3.5 px-4 text-slate-800 font-medium">
                      {lead.assignedCaller}
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4">
                      <StatusBadge status={lead.priority} type="priority" />
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <StatusBadge status={lead.status} />
                    </td>

                    {/* Enquiry Date */}
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {lead.enquiryDate}
                    </td>

                    {/* Next Follow-up */}
                    <td className="py-3.5 px-4">
                      {lead.nextFollowUpDate && lead.nextFollowUpDate !== "-" ? (
                        <span className="text-slate-700 font-medium text-[11px]">
                          {lead.nextFollowUpDate}
                          <span className="text-slate-400 block text-[10px]">
                            {lead.nextFollowUpTime}
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Actions - Role Adapted */}
                    <td className="py-3.5 px-4 text-right">
                      {isOwnerMD ? (
                        /* MD / Owner: Data Audit Dossier View Only */
                        <div className="flex items-center justify-end">
                          <Link
                            href={`/leads/${lead.id}`}
                            title="Audit Student Enquiry Dossier"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-[#142B52] hover:text-white rounded-lg transition-colors text-[11px] font-semibold"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Audit Dossier</span>
                          </Link>
                        </div>
                      ) : (
                        /* Telecaller / Staff: Full Management & Calling Controls */
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/leads/${lead.id}`}
                            title="View Full Profile & History"
                            className="p-1.5 text-slate-500 hover:text-[#142B52] hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => setEditingLead(lead)}
                            title="Edit Lead Details & Status"
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => initiateCall(lead)}
                            title={`Call ${lead.studentName} via device (${lead.phone})`}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors font-bold"
                          >
                            <PhoneCall className="w-4 h-4 text-emerald-600" />
                          </button>

                          <button
                            onClick={() => openAiCallModal(lead, lead.phone, false)}
                            title={`AI Voice Call ${lead.studentName} with Kavya`}
                            className="p-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors font-bold"
                          >
                            <Bot className="w-4 h-4 text-indigo-600" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-5 py-3.5 border-t border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-800">{filteredLeads.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> to{" "}
            <span className="font-bold text-slate-800">
              {Math.min(currentPage * itemsPerPage, filteredLeads.length)}
            </span>{" "}
            of <span className="font-bold text-slate-800">{filteredLeads.length}</span> filtered leads
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                  currentPage === page
                    ? "bg-[#142B52] text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Lead Modal */}
      <AddLeadModal
        isOpen={isAddLeadModalOpen}
        onClose={() => setIsAddLeadModalOpen(false)}
      />

      {/* Edit Lead Modal */}
      {editingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#142B52] text-white">
              <div>
                <h3 className="font-bold text-sm">Edit Enquiry Details</h3>
                <p className="text-xs text-slate-300">Lead ID: #{editingLead.id}</p>
              </div>
              <button
                onClick={() => setEditingLead(null)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Student Name
                </label>
                <input
                  type="text"
                  required
                  value={editingLead.studentName}
                  onChange={(e) =>
                    setEditingLead({ ...editingLead, studentName: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    required
                    value={editingLead.phone}
                    onChange={(e) =>
                      setEditingLead({ ...editingLead, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editingLead.email}
                    onChange={(e) =>
                      setEditingLead({ ...editingLead, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Course
                </label>
                <select
                  value={editingLead.courseInterested}
                  onChange={(e) =>
                    setEditingLead({
                      ...editingLead,
                      courseInterested: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-xl bg-white"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Lead Status
                  </label>
                  <select
                    value={editingLead.status}
                    onChange={(e) =>
                      setEditingLead({
                        ...editingLead,
                        status: e.target.value as LeadStatus,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-xl bg-white"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Interested">Interested</option>
                    <option value="Busy">Busy</option>
                    <option value="Call Later">Call Later</option>
                    <option value="Not Interested">Not Interested</option>
                    <option value="Counselling Scheduled">
                      Counselling Scheduled
                    </option>
                    <option value="Visited Campus">Visited Campus</option>
                    <option value="Admitted">Admitted</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={editingLead.priority}
                    onChange={(e) =>
                      setEditingLead({
                        ...editingLead,
                        priority: e.target.value as LeadPriority,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-xl bg-white"
                  >
                    <option value="Hot">Hot</option>
                    <option value="Warm">Warm</option>
                    <option value="Cold">Cold</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Assigned Caller
                  </label>
                  <select
                    value={editingLead.assignedCaller}
                    onChange={(e) =>
                      setEditingLead({
                        ...editingLead,
                        assignedCaller: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-xl bg-white"
                  >
                    {telecallers.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Next Follow-up Date
                  </label>
                  <input
                    type="date"
                    value={editingLead.nextFollowUpDate}
                    onChange={(e) =>
                      setEditingLead({
                        ...editingLead,
                        nextFollowUpDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingLead(null)}
                  className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#142B52] text-white rounded-xl font-bold hover:bg-[#1E3B6E]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Leads Modal (UI Demo) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#142B52] text-white">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#D5A52B]" />
                <h3 className="font-bold text-sm">Import Student Leads (CSV / Excel)</h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 text-center space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 hover:border-[#142B52] transition-colors bg-slate-50/50 cursor-pointer">
                <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800">
                  Click or drag Excel / CSV file here
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supports columns: Student Name, Phone, Email, Course, Source
                </p>
              </div>

              <div className="text-left bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <span className="font-semibold text-slate-700 block mb-1">
                  Sample template:
                </span>
                <span className="text-[11px] text-slate-500">
                  Download the official WeGrow student upload format before uploading bulk enquiries.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setIsImportModalOpen(false);
                    alert("Demo: 42 leads from Excel successfully imported into active queue.");
                  }}
                  className="px-4 py-2 bg-[#142B52] text-white rounded-xl text-xs font-bold hover:bg-[#1E3B6E]"
                >
                  Simulate Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

