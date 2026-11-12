"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Menu,
  Search,
  Bell,
  Calendar,
  Plus,
  ChevronDown,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  PhoneCall,
  X,
  Settings,
  Lock,
  PhoneForwarded,
  UserPlus,
  CalendarPlus,
  Radio,
  Coffee,
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import { recentActivityTimeline } from "@/data/dummy-data";

interface HeaderProps {
  onMobileMenuToggle: () => void;
  onOpenAddLeadModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onMobileMenuToggle,
  onOpenAddLeadModal,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { leads, activeUserRole, addToast, telephonyStatus, reconnectTelephony } = useCRM();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [agentStatus, setAgentStatus] = useState<"available" | "in_call" | "break" | "offline">("available");
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);

  // Check if current role has setup permission
  const hasSetupAccess = activeUserRole === "Admin" || activeUserRole === "Owner" || activeUserRole === "Owner / MD";
  const isOwnerMD = activeUserRole === "Owner" || activeUserRole === "Owner / MD";

  // Format today's date
  const todayDateFormatted = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Page title mapping
  const getPageMeta = () => {
    switch (pathname) {
      case "/":
        return { title: "Executive Dashboard", breadcrumb: "Overview" };
      case "/leads":
        return { title: "Lead Management", breadcrumb: "Leads" };
      case "/calls":
        return { title: "Telecaller Workspace", breadcrumb: "Call Queue" };
      case "/follow-ups":
        return { title: "Follow-up Tasks", breadcrumb: "Follow-ups" };
      case "/admissions":
        return { title: "Admission Pipeline", breadcrumb: "Kanban Funnel" };
      case "/whatsapp":
        return { title: "WhatsApp Messaging", breadcrumb: "Chat Center" };
      case "/reports":
        return { title: "Reports & Analytics", breadcrumb: "Business Insights" };
      case "/team":
        return { title: "Team Performance", breadcrumb: "Telecaller Leaderboard" };
      case "/courses":
        return { title: "Course Library", breadcrumb: "Programs & Fees" };
      case "/users":
        return { title: "Users & Roles", breadcrumb: "Team Access" };
      case "/settings":
        return { title: "System Settings", breadcrumb: "Configuration" };
      default:
        if (pathname.startsWith("/leads/")) {
          return { title: "Student Enquiry Profile", breadcrumb: "Leads / Profile" };
        }
        return { title: "WeGrow CRM", breadcrumb: "Dashboard" };
    }
  };

  const meta = getPageMeta();

  // Search matching leads
  const searchResults = searchQuery.trim()
    ? leads
        .filter(
          (l) =>
            l.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.phone.includes(searchQuery) ||
            l.courseInterested.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5)
    : [];

  const handleSetupClick = () => {
    if (hasSetupAccess) {
      router.push("/settings");
    } else {
      addToast(
        "Access Restriction: Setup & System Configurations are restricted to Admin & Owner profiles.",
        "warning"
      );
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/80 shadow-xs flex items-center justify-between px-3 sm:px-6">
      {/* Left side: Hamburger + Page Titles */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          aria-label="Open navigation menu"
          className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span>WeGrow Skill Campus</span>
            <span>/</span>
            <span className="text-[#244B7A] font-semibold">{meta.breadcrumb}</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 leading-tight">
            {meta.title}
          </h1>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="relative hidden md:block w-72 lg:w-96">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search student by name, phone or course..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#142B52]/20 focus:border-[#142B52] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setIsSearchOpen(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Global Search Results Dropdown */}
        {isSearchOpen && searchQuery.trim() && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-dropdown border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Enquiries Found ({searchResults.length})
            </div>
            {searchResults.length === 0 ? (
              <div className="px-3 py-4 text-xs text-center text-slate-500">
                No matching student lead found for "{searchQuery}"
              </div>
            ) : (
              searchResults.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  onClick={() => setIsSearchOpen(false)}
                  className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      {lead.studentName}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {lead.phone} • {lead.courseInterested}
                    </p>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                    {lead.status}
                  </span>
                </Link>
              ))
            )}
            <div className="border-t border-slate-100 mt-1 pt-1 px-3">
              <Link
                href="/leads"
                onClick={() => setIsSearchOpen(false)}
                className="text-xs text-[#244B7A] font-semibold hover:underline flex items-center justify-between py-1"
              >
                <span>View all in Leads directory</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Right side: Telephony Status (Staff only), Quick Create, Setup, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Telephony Agent Status Selector (For calling staff / telecallers only) */}
        {!isOwnerMD ? (
          <div className="relative hidden sm:block">
            <button
              onClick={() => {
                setIsStatusMenuOpen(!isStatusMenuOpen);
                setIsQuickCreateOpen(false);
                setIsNotificationsOpen(false);
                setIsProfileOpen(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-colors ${
                agentStatus === "available"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : agentStatus === "in_call"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : agentStatus === "break"
                  ? "bg-orange-50 text-orange-700 border-orange-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
              title="WeGrow Telephony Presence"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  agentStatus === "available"
                    ? "bg-emerald-500 animate-pulse"
                    : agentStatus === "in_call"
                    ? "bg-amber-500"
                    : agentStatus === "break"
                    ? "bg-orange-500"
                    : "bg-slate-400"
                }`}
              />
              <span className="capitalize font-semibold">
                {agentStatus === "available"
                  ? "Available"
                  : agentStatus === "in_call"
                  ? "In Call"
                  : agentStatus === "break"
                  ? "Break"
                  : "Offline"}
              </span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {isStatusMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl shadow-dropdown border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1">
                <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  PhoneBridge Status
                </div>
                <button
                  onClick={() => {
                    setAgentStatus("available");
                    setIsStatusMenuOpen(false);
                    addToast("Telephony: Marked as Available (Inbound ready)", "success");
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex items-center gap-2 text-emerald-700"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Available (Ready)</span>
                </button>
                <button
                  onClick={() => {
                    setAgentStatus("in_call");
                    setIsStatusMenuOpen(false);
                    addToast("Telephony: Marked as Busy in Call", "info");
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex items-center gap-2 text-amber-700"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>In a Call</span>
                </button>
                <button
                  onClick={() => {
                    setAgentStatus("break");
                    setIsStatusMenuOpen(false);
                    addToast("Telephony: Tea / Lunch Break logged", "warning");
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex items-center gap-2 text-orange-700"
                >
                  <Coffee className="w-3 h-3 text-orange-500" />
                  <span>Tea / Lunch Break</span>
                </button>
                <button
                  onClick={() => {
                    setAgentStatus("offline");
                    setIsStatusMenuOpen(false);
                    addToast("Telephony: Signed out from softphone queue", "info");
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-600"
                >
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>Offline</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-lg text-[11px] font-bold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-[#D5A52B]" />
            <span>Executive Oversight</span>
          </div>
        )}

        {/* Quick Create Dropdown (+) */}
        <div className="relative">
          <button
            onClick={() => {
              setIsQuickCreateOpen(!isQuickCreateOpen);
              setIsNotificationsOpen(false);
              setIsProfileOpen(false);
              setIsStatusMenuOpen(false);
            }}
            className="flex items-center justify-center w-8 h-8 sm:w-auto sm:px-3 sm:py-1.5 bg-[#142B52] hover:bg-[#1E3B6E] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            title="Quick Create (+)"
          >
            <Plus className="w-4 h-4 text-[#D5A52B]" />
            <span className="hidden sm:inline sm:ml-1 font-bold">Create</span>
            <ChevronDown className="w-3 h-3 ml-1 text-slate-300 hidden sm:inline" />
          </button>

          {isQuickCreateOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-dropdown border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Quick Create
              </div>
              <button
                onClick={() => {
                  setIsQuickCreateOpen(false);
                  onOpenAddLeadModal();
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
              >
                <UserPlus className="w-4 h-4 text-[#142B52]" />
                <span>New Student Lead</span>
              </button>
              <Link
                href="/calls"
                onClick={() => setIsQuickCreateOpen(false)}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
              >
                <PhoneCall className="w-4 h-4 text-emerald-600" />
                <span>Log Phone Call</span>
              </Link>
              <Link
                href="/follow-ups"
                onClick={() => setIsQuickCreateOpen(false)}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
              >
                <CalendarPlus className="w-4 h-4 text-[#D5A52B]" />
                <span>Schedule Follow-up</span>
              </Link>
              <Link
                href="/whatsapp"
                onClick={() => setIsQuickCreateOpen(false)}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
              >
                <PhoneForwarded className="w-4 h-4 text-[#244B7A]" />
                <span>Send WhatsApp Template</span>
              </Link>
            </div>
          )}
        </div>

        {/* Setup Gear Icon (Admin / Restricted) */}
        <button
          onClick={handleSetupClick}
          title={
            hasSetupAccess
              ? "System Setup: Branches, Lead Rules & Automation (Admin)"
              : "🔒 Setup Restricted: Only Admin & Owner have access"
          }
          className={`p-2 rounded-xl transition-colors relative ${
            hasSetupAccess
              ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              : "text-slate-300 hover:bg-rose-50 hover:text-rose-600"
          }`}
        >
          <Settings className="w-4.5 h-4.5" />
          {!hasSetupAccess && (
            <Lock className="w-2.5 h-2.5 text-rose-500 absolute top-1.5 right-1.5" />
          )}
        </button>

        {/* Notifications Popover Toggle */}
        <div className="relative">
          <button
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsProfileOpen(false);
              setIsQuickCreateOpen(false);
              setIsStatusMenuOpen(false);
            }}
            aria-label="Open notifications"
            className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-dropdown border border-slate-200/90 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-900">Notifications</h3>
                  <span className="bg-[#D5A52B]/15 text-[#B88A1B] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    3 New
                  </span>
                </div>
                <button
                  onClick={() => setIsNotificationsOpen(false)}
                  className="text-xs text-slate-400 hover:text-slate-700"
                >
                  Mark all read
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {recentActivityTimeline.slice(0, 4).map((activity) => (
                  <div
                    key={activity.id}
                    className="p-3 hover:bg-slate-50 transition-colors flex gap-3 text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#142B52]/10 flex items-center justify-center flex-shrink-0 text-[#142B52]">
                      {activity.type === "admission" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : activity.type === "call" ? (
                        <PhoneCall className="w-4 h-4 text-[#D5A52B]" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-[#244B7A]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800">
                        {activity.title}
                      </p>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                        {activity.desc}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {activity.time} • by {activity.user}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-4 pt-2 border-t border-slate-100 text-center">
                <Link
                  href="/follow-ups"
                  onClick={() => setIsNotificationsOpen(false)}
                  className="text-xs font-semibold text-[#244B7A] hover:underline"
                >
                  View Today's Follow-up Queue
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsNotificationsOpen(false);
              setIsQuickCreateOpen(false);
              setIsStatusMenuOpen(false);
            }}
            className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
              alt="User Avatar"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-200"
            />
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-dropdown border border-slate-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">
                  {activeUserRole === "Owner" || activeUserRole === "Owner / MD"
                    ? "Thavabalan"
                    : activeUserRole === "Admin"
                    ? "LakshmiPriya (GM)"
                    : activeUserRole === "HR"
                    ? "Gopi (HR)"
                    : "Muthumeena (Head Telecaller)"}
                </p>
                <p className="text-[11px] text-slate-500">
                  {activeUserRole === "Owner" || activeUserRole === "Owner / MD"
                    ? "thavabalan@wegrow.edu"
                    : activeUserRole === "Admin"
                    ? "lakshmipriya@wegrow.edu"
                    : activeUserRole === "HR"
                    ? "gopi@wegrow.edu"
                    : "muthumeena@wegrow.edu"}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D5A52B]/15 text-[#B88A1B]">
                    Role: {activeUserRole}
                  </span>
                  <span className="text-[10px] text-slate-400">Enterprise RBAC</span>
                </div>
              </div>

              <div className="py-1">
                <Link
                  href="/team"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  My Calling Stats
                </Link>
                <Link
                  href="/users"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  Role Permissions Preview
                </Link>
                {hasSetupAccess ? (
                  <Link
                    href="/settings"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    System Setup & Branches
                  </Link>
                ) : (
                  <div className="px-4 py-2 text-xs text-slate-400 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      Setup (Admin Only)
                    </span>
                    <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">Locked</span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-1.5 px-4 py-1 text-slate-400 text-[11px]">
                WeGrow Telecalling CRM • Enterprise Mode
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

