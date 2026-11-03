"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users2,
  PhoneCall,
  CalendarClock,
  Kanban,
  MessageSquare,
  BarChart3,
  Trophy,
  GraduationCap,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  UserCheck,
  Sparkles,
} from "lucide-react";
import { WeGrowLogo } from "@/components/shared/WeGrowLogo";
import { useCRM } from "@/context/CRMContext";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen = false,
  onMobileClose,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
}) => {
  const pathname = usePathname();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const handleToggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed(!internalCollapsed);
    }
  };
  const { followUps, whatsappChats, activeUserRole, setActiveUserRole } = useCRM();

  // Badges calculation
  const pendingFollowUpCount = followUps.filter(
    (f) => f.status === "Today" || f.status === "Overdue"
  ).length;

  const unreadWhatsAppCount = whatsappChats.reduce(
    (sum, c) => sum + c.unreadCount,
    0
  );

  const getNavItemsForRole = () => {
    switch (activeUserRole) {
      case "Telecaller":
        return [
          {
            title: "Calling Workspace",
            href: "/",
            icon: LayoutDashboard,
          },
          {
            title: "Student Leads",
            href: "/leads",
            icon: Users2,
          },
          {
            title: "Calling Desk",
            href: "/calls",
            icon: PhoneCall,
            highlight: true,
          },
          {
            title: "Follow-up Tasks",
            href: "/follow-ups",
            icon: CalendarClock,
            badge: pendingFollowUpCount > 0 ? pendingFollowUpCount : undefined,
            badgeColor: "bg-rose-500",
          },
          {
            title: "Admission Funnel",
            href: "/admissions",
            icon: Kanban,
          },
          {
            title: "WhatsApp Chat",
            href: "/whatsapp",
            icon: MessageSquare,
            badge: unreadWhatsAppCount > 0 ? unreadWhatsAppCount : undefined,
            badgeColor: "bg-emerald-500",
          },
          {
            title: "Course Library",
            href: "/courses",
            icon: GraduationCap,
          },
        ];

      case "Owner":
      case "Owner / MD":
        return [
          {
            title: "Executive Overview",
            href: "/",
            icon: LayoutDashboard,
          },
          {
            title: "Revenue & Analytics",
            href: "/reports",
            icon: BarChart3,
          },
          {
            title: "Admission Pipeline",
            href: "/admissions",
            icon: Kanban,
          },
          {
            title: "Enquiries Audit",
            href: "/leads",
            icon: Users2,
          },
          {
            title: "Team Performance",
            href: "/team",
            icon: Trophy,
          },
          {
            title: "Course Programs",
            href: "/courses",
            icon: GraduationCap,
          },
          {
            title: "Users & Roles",
            href: "/users",
            icon: ShieldCheck,
          },
          {
            title: "System Settings",
            href: "/settings",
            icon: Settings,
          },
        ];

      case "Admin":
      default:
        return [
          {
            title: "System Dashboard",
            href: "/",
            icon: LayoutDashboard,
          },
          {
            title: "Leads Database",
            href: "/leads",
            icon: Users2,
          },
          {
            title: "Call Operations",
            href: "/calls",
            icon: PhoneCall,
          },
          {
            title: "Follow-up SLA",
            href: "/follow-ups",
            icon: CalendarClock,
            badge: pendingFollowUpCount > 0 ? pendingFollowUpCount : undefined,
            badgeColor: "bg-rose-500",
          },
          {
            title: "Admission Pipeline",
            href: "/admissions",
            icon: Kanban,
          },
          {
            title: "WhatsApp Desk",
            href: "/whatsapp",
            icon: MessageSquare,
            badge: unreadWhatsAppCount > 0 ? unreadWhatsAppCount : undefined,
            badgeColor: "bg-emerald-500",
          },
          {
            title: "Reports & Analytics",
            href: "/reports",
            icon: BarChart3,
          },
          {
            title: "Team Performance",
            href: "/team",
            icon: Trophy,
          },
          {
            title: "Course Library",
            href: "/courses",
            icon: GraduationCap,
          },
          {
            title: "Users & Roles",
            href: "/users",
            icon: ShieldCheck,
          },
          {
            title: "Settings",
            href: "/settings",
            icon: Settings,
          },
        ];
    }
  };

  const navItems = getNavItemsForRole();

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#142B52] text-slate-200 transition-all duration-300 ease-in-out border-r border-[#244B7A]/50 select-none shadow-2xl lg:shadow-none",
          collapsed ? "w-20" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-[#244B7A]/60 bg-[#0E1E38]/50">
          <Link href="/" className="flex items-center" onClick={onMobileClose}>
            <WeGrowLogo collapsed={collapsed} theme="dark" />
          </Link>
          <button
            onClick={handleToggleCollapse}
            aria-label="Toggle Sidebar"
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-[#244B7A] transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Role Demo Indicator */}
        {!collapsed && (
          <div className="px-3 pt-3 pb-1">
            <div className="bg-[#0E1E38]/80 border border-[#244B7A]/70 rounded-lg p-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-300">
                <UserCheck className="w-3.5 h-3.5 text-[#D5A52B]" />
                <span className="text-[11px] font-medium">Viewing as:</span>
              </div>
              <select
                value={activeUserRole === "Owner / MD" ? "Owner" : activeUserRole}
                onChange={(e) => setActiveUserRole(e.target.value)}
                className="bg-[#142B52] text-[#D5A52B] font-semibold text-[11px] rounded px-1.5 py-0.5 border border-[#244B7A] focus:outline-none focus:ring-1 focus:ring-[#D5A52B] cursor-pointer"
              >
                <option value="Owner">Owner</option>
                <option value="Admin">Admin</option>
                <option value="Telecaller">Telecaller</option>
              </select>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150",
                  isActive
                    ? "bg-[#244B7A] text-white shadow-md shadow-[#142B52]/40 font-semibold"
                    : "text-slate-300 hover:text-white hover:bg-[#1E3B6E]/60",
                  collapsed && "justify-center px-0"
                )}
                title={collapsed ? item.title : undefined}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#D5A52B] rounded-r-full" />
                )}

                <Icon
                  className={cn(
                    "w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-105",
                    isActive ? "text-[#D5A52B]" : "text-slate-400 group-hover:text-slate-200"
                  )}
                />

                {!collapsed && (
                  <span className="truncate flex-1">{item.title}</span>
                )}

                {!collapsed && item.badge !== undefined && (
                  <span
                    className={cn(
                      "px-2 py-0.5 text-[10px] font-bold rounded-full text-white",
                      item.badgeColor || "bg-[#D5A52B]"
                    )}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Collapsed Badge Dot */}
                {collapsed && item.badge !== undefined && (
                  <span
                    className={cn(
                      "absolute top-1.5 right-2 w-2 h-2 rounded-full",
                      item.badgeColor || "bg-[#D5A52B]"
                    )}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Footer Section */}
        <div className="p-3 border-t border-[#244B7A]/60 bg-[#0E1E38]/60">
          <div
            className={cn(
              "flex items-center gap-3 p-2 rounded-xl hover:bg-[#1E3B6E]/50 transition-colors",
              collapsed && "justify-center p-1"
            )}
          >
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
                alt="Priya Sharma"
                className="w-9 h-9 rounded-full object-cover ring-2 ring-[#D5A52B]/80 flex-shrink-0"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#142B52]" />
            </div>

            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-white truncate leading-tight">
                    Priya Sharma
                  </p>
                  <Sparkles className="w-3 h-3 text-[#D5A52B] flex-shrink-0" />
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {activeUserRole}
                </p>
              </div>
            )}

            {!collapsed && (
              <Link
                href="/settings"
                title="Account Settings"
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#244B7A]"
              >
                <Settings className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

