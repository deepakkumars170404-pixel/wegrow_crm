"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Lead,
  FollowUpTask,
  WhatsAppChat,
  Course,
  Telecaller,
  AppUser,
  LeadStatus,
  LeadPriority,
  PipelineStage,
} from "@/types";
import {
  initialLeads,
  initialFollowUps,
  initialWhatsAppChats,
  initialCourses,
  initialTelecallers,
  initialUsers,
} from "@/data/dummy-data";

export interface ToastMessage {
  id: string;
  type: "success" | "info" | "warning" | "error";
  title: string;
  message?: string;
}

interface CRMContextType {
  leads: Lead[];
  followUps: FollowUpTask[];
  whatsappChats: WhatsAppChat[];
  courses: Course[];
  telecallers: Telecaller[];
  users: AppUser[];
  activeUserRole: string;
  setActiveUserRole: (role: string) => void;
  toasts: ToastMessage[];
  showToast: (toast: Omit<ToastMessage, "id">) => void;
  addToast: (title: string, type?: "success" | "info" | "warning" | "error") => void;
  dismissToast: (id: string) => void;

  // Global Live Calling state
  activeCallLead: Lead | null;
  setActiveCallLead: (lead: Lead | null) => void;
  isCallModalOpen: boolean;
  openCallModal: () => void;
  isCallConnected: boolean;
  setIsCallConnected: (connected: boolean) => void;
  callDuration: number;
  initiateCall: (lead: Lead) => void;
  endCallSession: () => void;
  closeCallModal: () => void;
  
  // Leads actions
  addLead: (lead: Omit<Lead, "id" | "callCount">) => void;
  updateLead: (id: string, updated: Partial<Lead>) => void;
  updateLeadStatus: (id: string, status: LeadStatus, stage?: PipelineStage) => void;
  assignCaller: (leadId: string, callerName: string) => void;
  addLeadNote: (leadId: string, noteContent: string, author?: string) => void;
  addCallRecord: (
    leadId: string,
    record: {
      callerName: string;
      outcome: string;
      duration: string;
      remarks: string;
      nextFollowUpDate?: string;
      nextFollowUpTime?: string;
    }
  ) => void;

  // Follow-up actions
  markFollowUpCompleted: (id: string) => void;
  rescheduleFollowUp: (id: string, newDate: string, newTime: string, remarks?: string) => void;
  addNewFollowUp: (task: Omit<FollowUpTask, "id">) => void;

  // WhatsApp actions
  sendWhatsAppMessage: (chatId: string, text: string) => void;

  // User management
  addUser: (user: Omit<AppUser, "id" | "assignedLeads" | "joinedDate" | "lastActive">) => void;
  updateUserRole: (id: string, newRole: AppUser["role"]) => void;
  toggleUserStatus: (id: string) => void;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [followUps, setFollowUps] = useState<FollowUpTask[]>(initialFollowUps);
  const [whatsappChats, setWhatsappChats] = useState<WhatsAppChat[]>(initialWhatsAppChats);
  const [courses] = useState<Course[]>(initialCourses);
  const [telecallers, setTelecallers] = useState<Telecaller[]>(initialTelecallers);
  const [users, setUsers] = useState<AppUser[]>(initialUsers);
  const [activeUserRole, setActiveUserRole] = useState<string>("Owner");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Live Calling Session State
  const [activeCallLead, setActiveCallLead] = useState<Lead | null>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isCallConnected, setIsCallConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    let timer: any = null;
    if (isCallConnected) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isCallConnected]);

  const initiateCall = (lead: Lead) => {
    setActiveCallLead(lead);
    setIsCallConnected(true);
    setIsCallModalOpen(false); // Dock softphone handles active call
    setCallDuration(0);

    // Format phone with mandatory +91 or 0 for JioFiber SIP (+91XXXXXXXXXX)
    const rawDigits = lead.phone.replace(/\D/g, "");
    let cleanPhone = "";
    if (rawDigits.length === 10) {
      cleanPhone = `+91${rawDigits}`;
    } else if (rawDigits.length === 12 && rawDigits.startsWith("91")) {
      cleanPhone = `+${rawDigits}`;
    } else if (rawDigits.length === 11 && rawDigits.startsWith("0")) {
      cleanPhone = `+91${rawDigits.substring(1)}`;
    } else {
      cleanPhone = lead.phone.trim().startsWith("+") ? lead.phone.trim() : `+91${rawDigits}`;
    }

    addToast(`Dialing ${lead.studentName} (${cleanPhone}) via JioFiber MicroSIP...`, "info");

    // 1. Trigger MicroSIP directly via local Next.js PC Telephony API
    fetch("/api/microsip/call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: cleanPhone }),
    }).catch((err) => {
      console.warn("Direct MicroSIP API call:", err);
    });

    // 2. Fallback to tel: link handler
    try {
      window.location.href = `tel:${cleanPhone}`;
    } catch (e) {
      // Browser protocol handler fallback
    }
  };

  const endCallSession = () => {
    setIsCallConnected(false);
    fetch("/api/microsip/hangup", { method: "POST" }).catch(() => {});
    setIsCallModalOpen(true); // Automatically open disposition modal on call end
  };

  const openCallModal = () => {
    setIsCallModalOpen(true);
  };

  const closeCallModal = () => {
    setIsCallConnected(false);
    setIsCallModalOpen(false);
  };

  const showToast = (toast: Omit<ToastMessage, "id">) => {
    const id = "t-" + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  };

  const addToast = (title: string, type: "success" | "info" | "warning" | "error" = "info") => {
    showToast({ title, type });
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addLead = (newLeadData: Omit<Lead, "id" | "callCount">) => {
    const newId = `LD-${1000 + leads.length + 1}`;
    const newLead: Lead = {
      ...newLeadData,
      id: newId,
      callCount: 0,
      notes: newLeadData.notes || [],
      callHistory: [],
    };
    setLeads((prev) => [newLead, ...prev]);
    showToast({
      type: "success",
      title: "Lead Added Successfully",
      message: `${newLead.studentName} has been enrolled in the CRM lead pool.`,
    });
  };

  const updateLead = (id: string, updated: Partial<Lead>) => {
    setLeads((prev) =>
      prev.map((lead) => (lead.id === id ? { ...lead, ...updated } : lead))
    );
    showToast({
      type: "info",
      title: "Lead Updated",
      message: `Details updated for lead #${id}.`,
    });
  };

  const updateLeadStatus = (id: string, status: LeadStatus, stage?: PipelineStage) => {
    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id === id) {
          return {
            ...lead,
            status,
            stage: stage || (status as unknown as PipelineStage),
          };
        }
        return lead;
      })
    );
    showToast({
      type: "success",
      title: "Status Changed",
      message: `Lead #${id} status updated to ${status}.`,
    });
  };

  const assignCaller = (leadId: string, callerName: string) => {
    setLeads((prev) =>
      prev.map((lead) => (lead.id === leadId ? { ...lead, assignedCaller: callerName } : lead))
    );
    showToast({
      type: "info",
      title: "Caller Reassigned",
      message: `Lead #${leadId} assigned to ${callerName}.`,
    });
  };

  const addLeadNote = (leadId: string, noteContent: string, author = "Priya Sharma") => {
    const newNote = {
      id: "nt-" + Date.now(),
      author,
      timestamp: "Just now",
      content: noteContent,
    };
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId
          ? { ...lead, notes: [newNote, ...(lead.notes || [])] }
          : lead
      )
    );
    showToast({
      type: "success",
      title: "Note Added",
      message: "Internal telecaller remark saved.",
    });
  };

  const addCallRecord = (
    leadId: string,
    record: {
      callerName: string;
      outcome: string;
      duration: string;
      remarks: string;
      nextFollowUpDate?: string;
      nextFollowUpTime?: string;
    }
  ) => {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const newRecord = {
      id: "ch-" + Date.now(),
      callDate: dateStr,
      callTime: timeStr,
      callerName: record.callerName,
      duration: record.duration,
      outcome: record.outcome,
      remarks: record.remarks,
    };

    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id === leadId) {
          return {
            ...lead,
            callCount: lead.callCount + 1,
            lastCallDate: dateStr,
            lastCallOutcome: record.remarks || record.outcome,
            nextFollowUpDate: record.nextFollowUpDate || lead.nextFollowUpDate,
            nextFollowUpTime: record.nextFollowUpTime || lead.nextFollowUpTime,
            callHistory: [newRecord, ...(lead.callHistory || [])],
          };
        }
        return lead;
      })
    );

    // If follow-up date specified, schedule follow up
    if (record.nextFollowUpDate) {
      const targetLead = leads.find((l) => l.id === leadId);
      if (targetLead) {
        const newFu: FollowUpTask = {
          id: "fu-" + Date.now(),
          leadId,
          studentName: targetLead.studentName,
          phone: targetLead.phone,
          course: targetLead.courseInterested,
          assignedCaller: record.callerName,
          lastContacted: `${dateStr} ${timeStr}`,
          followUpDate: record.nextFollowUpDate,
          followUpTime: record.nextFollowUpTime || "11:00 AM",
          status: "Today",
          priority: targetLead.priority,
          remarks: record.remarks,
        };
        setFollowUps((prev) => [newFu, ...prev]);
      }
    }

    showToast({
      type: "success",
      title: "Call Logged",
      message: `Call result "${record.outcome}" saved successfully.`,
    });
  };

  const markFollowUpCompleted = (id: string) => {
    setFollowUps((prev) =>
      prev.map((fu) => (fu.id === id ? { ...fu, status: "Completed" } : fu))
    );
    showToast({
      type: "success",
      title: "Follow-up Marked Completed",
      message: "Task has been moved to completed follow-ups.",
    });
  };

  const rescheduleFollowUp = (
    id: string,
    newDate: string,
    newTime: string,
    remarks?: string
  ) => {
    setFollowUps((prev) =>
      prev.map((fu) =>
        fu.id === id
          ? {
              ...fu,
              followUpDate: newDate,
              followUpTime: newTime,
              status: "Upcoming",
              remarks: remarks || fu.remarks,
            }
          : fu
      )
    );
    showToast({
      type: "info",
      title: "Follow-up Rescheduled",
      message: `Follow-up updated to ${newDate} at ${newTime}.`,
    });
  };

  const addNewFollowUp = (task: Omit<FollowUpTask, "id">) => {
    const newTask: FollowUpTask = {
      ...task,
      id: "fu-" + Date.now(),
    };
    setFollowUps((prev) => [newTask, ...prev]);
    showToast({
      type: "success",
      title: "Follow-up Scheduled",
      message: `Scheduled for ${task.studentName} on ${task.followUpDate}.`,
    });
  };

  const sendWhatsAppMessage = (chatId: string, text: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const newMsg = {
      id: "msg-" + Date.now(),
      sender: "caller" as const,
      text,
      timestamp: timeStr,
      status: "sent" as const,
    };

    setWhatsappChats((prev) =>
      prev.map((chat) => {
        if (chat.id === chatId) {
          return {
            ...chat,
            lastMessage: text,
            lastMessageTime: timeStr,
            messages: [...chat.messages, newMsg],
          };
        }
        return chat;
      })
    );

    showToast({
      type: "success",
      title: "Message Sent",
      message: "Simulated WhatsApp message delivered to student.",
    });
  };

  const addUser = (userData: Omit<AppUser, "id" | "assignedLeads" | "joinedDate" | "lastActive">) => {
    const newUser: AppUser = {
      ...userData,
      id: "usr-" + (users.length + 1),
      assignedLeads: 0,
      joinedDate: "Today",
      lastActive: "Just now",
    };
    setUsers((prev) => [...prev, newUser]);
    showToast({
      type: "success",
      title: "User Created",
      message: `${newUser.name} added as ${newUser.role}.`,
    });
  };

  const updateUserRole = (id: string, newRole: AppUser["role"]) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role: newRole } : u))
    );
    showToast({
      type: "info",
      title: "Role Updated",
      message: `User role changed to ${newRole}.`,
    });
  };

  const toggleUserStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const newStatus = u.status === "Active" ? "Inactive" : "Active";
          return { ...u, status: newStatus };
        }
        return u;
      })
    );
    showToast({
      type: "info",
      title: "Status Changed",
      message: "User status toggled.",
    });
  };

  return (
    <CRMContext.Provider
      value={{
        leads,
        followUps,
        whatsappChats,
        courses,
        telecallers,
        users,
        activeUserRole,
        setActiveUserRole,
        toasts,
        showToast,
        addToast,
        dismissToast,
        activeCallLead,
        setActiveCallLead,
        isCallModalOpen,
        openCallModal,
        isCallConnected,
        setIsCallConnected,
        callDuration,
        initiateCall,
        endCallSession,
        closeCallModal,
        addLead,
        updateLead,
        updateLeadStatus,
        assignCaller,
        addLeadNote,
        addCallRecord,
        markFollowUpCompleted,
        rescheduleFollowUp,
        addNewFollowUp,
        sendWhatsAppMessage,
        addUser,
        updateUserRole,
        toggleUserStatus,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error("useCRM must be used within a CRMProvider");
  }
  return context;
};

