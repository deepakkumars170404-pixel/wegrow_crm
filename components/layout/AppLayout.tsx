"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ToastContainer } from "./ToastContainer";
import { AddLeadModal } from "@/components/leads/AddLeadModal";
import { PhoneBridgeWidget } from "@/components/shared/PhoneBridgeWidget";
import { LiveCallModal } from "@/components/shared/LiveCallModal";
import { AIVoiceCallModal } from "@/components/ai-telecalling/AIVoiceCallModal";
import { AIBatchDialerModal } from "@/components/ai-telecalling/AIBatchDialerModal";
import { useCRM } from "@/context/CRMContext";
import { cn } from "@/lib/utils";

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const {
    isAiCallModalOpen,
    closeAiCallModal,
    aiCallLead,
    aiCallPhone,
    isAiInbound,
    isAiBatchDialerOpen,
    closeAiBatchDialer,
    aiBatchSelectedLeadIds,
  } = useCRM();

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

      {/* Global Notifications, Live Calling Modal, PhoneBridge Softphone and Modals */}
      <ToastContainer />
      <LiveCallModal />
      <PhoneBridgeWidget />
      <AddLeadModal
        isOpen={isAddLeadModalOpen}
        onClose={() => setIsAddLeadModalOpen(false)}
      />

      {/* Gemini AI Voice Telecalling Modals */}
      <AIVoiceCallModal
        isOpen={isAiCallModalOpen}
        onClose={closeAiCallModal}
        lead={aiCallLead}
        phoneNumber={aiCallPhone}
        isInbound={isAiInbound}
      />
      <AIBatchDialerModal
        isOpen={isAiBatchDialerOpen}
        onClose={closeAiBatchDialer}
        initialSelectedLeadIds={aiBatchSelectedLeadIds}
      />
    </div>
  );
};
