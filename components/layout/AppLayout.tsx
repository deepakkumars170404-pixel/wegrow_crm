"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ToastContainer } from "./ToastContainer";
import { AddLeadModal } from "@/components/leads/AddLeadModal";
import { LiveCallModal } from "@/components/shared/LiveCallModal";
import { cn } from "@/lib/utils";

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-slate-800 antialiased flex">
      {/* Sidebar Navigation */}
      <Sidebar
        isMobileOpen={isMobileNavOpen}
        onMobileClose={() => setIsMobileNavOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Area - dynamically adjusts padding when sidebar collapses */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out",
          isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
        )}
      >
        {/* Top Header */}
        <Header
          onMobileMenuToggle={() => setIsMobileNavOpen(!isMobileNavOpen)}
          onOpenAddLeadModal={() => setIsAddLeadModalOpen(true)}
        />

        {/* Page Body - Full-width layout without restrictive padding */}
        <main className="flex-1 w-full px-3 py-4 sm:px-6 sm:py-6">
          {children}
        </main>
      </div>

      {/* Global Notifications and Modals */}
      <ToastContainer />
      <LiveCallModal />
      <AddLeadModal
        isOpen={isAddLeadModalOpen}
        onClose={() => setIsAddLeadModalOpen(false)}
      />
    </div>
  );
};
