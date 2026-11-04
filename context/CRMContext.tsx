"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
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

export interface TelephonyStatus {
  connected: boolean;
  status: "online" | "wifi_disconnected" | "connecting" | "offline";
  message: string;
  wifiSSID: string;
  wifiState: string;
  gatewayReachable: boolean;
  microsipRunning: boolean;
  account: string;
  checkedAt?: string;
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

  // Live Calling Session State
  activeCallLead: Lead | null;
  setActiveCallLead: (lead: Lead | null) => void;
  isCallModalOpen: boolean;
  openCallModal: () => void;
  closeCallModal: () => void;
  isCallConnected: boolean;
  setIsCallConnected: (connected: boolean) => void;
  callDuration: number;
  lastCallDuration: string | null;
  setLastCallDuration: (dur: string | null) => void;
  initiateCall: (lead: Lead) => void;
  endCallSession: () => void;

  // Telephony Presence & Reconnect
  telephonyStatus: TelephonyStatus;
  refreshTelephonyStatus: (force?: boolean) => Promise<void>;
  reconnectTelephony: () => Promise<void>;

  // Leads & Data Actions
  addLead: (lead: Omit<Lead, "id" | "callCount">) => void;
  updateLead: (id: string, updated: Partial<Lead>) => void;
  updateLeadStatus: (id: string, status: LeadStatus, stage?: PipelineStage) => void;
  assignCaller: (leadId: string, callerName: string) => void;
  addLeadNote: (leadId: string, note: string, author?: string) => void;
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
  markFollowUpCompleted: (id: string) => void;
  rescheduleFollowUp: (id: string, newDate: string, newTime: string, remarks?: string) => void;
  addNewFollowUp: (task: Omit<FollowUpTask, "id">) => void;
  sendWhatsAppMessage: (chatId: string, text: string) => void;
  addUser: (user: Omit<AppUser, "id" | "assignedLeads" | "joinedDate" | "lastActive">) => void;
  updateUserRole: (id: string, newRole: AppUser["role"]) => void;
  toggleUserStatus: (id: string) => void;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

const LOCAL_STORAGE_LEADS_KEY = "wegrow_crm_leads_v2";
const LOCAL_STORAGE_FOLLOWUPS_KEY = "wegrow_crm_followups_v2";

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
  const [lastCallDuration, setLastCallDuration] = useState<string | null>(null);

  // Live MicroSIP Telephony & Wi-Fi Network Presence
  const [telephonyStatus, setTelephonyStatus] = useState<TelephonyStatus>({
    connected: true,
    status: "online",
    message: "JioFiber SIP Online (+91 4562 355214) • Ready to Call",
    wifiSSID: "WegrowskillCampus",
    wifiState: "connected",
    gatewayReachable: true,
    microsipRunning: true,
    account: "+914562355214@tn.wln.ims.jio.com",
  });

  // 1. Initial Load of persistent leads from localStorage and /api/leads
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const localLeads = localStorage.getItem(LOCAL_STORAGE_LEADS_KEY);
        if (localLeads) {
          const parsed = JSON.parse(localLeads);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLeads(parsed);
          }
        }
        const localFu = localStorage.getItem(LOCAL_STORAGE_FOLLOWUPS_KEY);
        if (localFu) {
          const parsedFu = JSON.parse(localFu);
          if (Array.isArray(parsedFu) && parsedFu.length > 0) {
            setFollowUps(parsedFu);
          }
        }
      }
    } catch {}

    // Also fetch server storage
    fetch("/api/leads")
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.leads) && data.leads.length > 0) {
          setLeads((prev) => {
            // Keep existing leads or merge
            const existingIds = new Set(prev.map((l) => l.id));
            const newFromDisk = data.leads.filter((l: Lead) => !existingIds.has(l.id));
            const merged = [...prev, ...newFromDisk];
            return merged;
          });
        }
      })
      .catch(() => {});
  }, []);

  // Helper to persist leads to localStorage and backend
  const persistLeads = useCallback((updatedLeads: Lead[], updatedFu?: FollowUpTask[]) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(LOCAL_STORAGE_LEADS_KEY, JSON.stringify(updatedLeads));
        if (updatedFu) {
          localStorage.setItem(LOCAL_STORAGE_FOLLOWUPS_KEY, JSON.stringify(updatedFu));
        }
      } catch {}
    }
    fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leads: updatedLeads,
        ...(updatedFu ? { followUps: updatedFu } : {}),
      }),
    }).catch(() => {});
  }, []);

  // Telephony Refresh Function
  const refreshTelephonyStatus = useCallback(async (force = false) => {
    try {
      const url = force ? "/api/microsip/status?force=true" : "/api/microsip/status";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTelephonyStatus(data);
      }
    } catch {
      setTelephonyStatus((prev) => ({
        ...prev,
        connected: false,
        status: "offline",
        message: "MicroSIP Telephony Offline",
      }));
    }
  }, []);

  // Office Reconnect Function (Triggered when user arrives at office from home)
  const reconnectTelephony = useCallback(async () => {
    showToast({
      type: "info",
      title: "Connecting to Office JioFiber...",
      message: "Probing JioFiber gateway & starting MicroSIP telephony...",
    });
    try {
      const res = await fetch("/api/microsip/status?force=true&reconnect=true");
      if (res.ok) {
        const data = await res.json();
        setTelephonyStatus(data);
        if (data.connected) {
          showToast({
            type: "success",
            title: "Connected to Office JioFiber!",
            message: `SSID: ${data.wifiSSID} • Landline ready (+91 4562 355214)`,
          });
        } else {
          showToast({
            type: "warning",
            title: "JioFiber Wi-Fi Not Detected",
            message: "Please ensure your laptop is connected to your Office JioFiber Wi-Fi network.",
          });
        }
      }
    } catch {
      showToast({
        type: "error",
        title: "Connection Failed",
        message: "Could not reach local telephony server.",
      });
    }
  }, []);

  // Periodic status poll (every 6 seconds, ultra-lightweight via route memory cache)
  useEffect(() => {
    refreshTelephonyStatus();
    const interval = setInterval(() => {
      refreshTelephonyStatus();
    }, 6000);
    return () => clearInterval(interval);
  }, [refreshTelephonyStatus]);

  // Synchronized Call Timer
  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    let timer: any = null;
    if (isCallConnected) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isCallConnected]);

  // Unified Call Initiator
  const initiateCall = (lead: Lead) => {
    setActiveCallLead(lead);
    setIsCallConnected(true);
    setCallDuration(0);
    setLastCallDuration(null);

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

    if (!telephonyStatus.connected && telephonyStatus.status === "wifi_disconnected") {
      addToast(
        "Warning: Wi-Fi disconnected from JioFiber. Please connect to Office Wi-Fi to call.",
        "warning"
      );
    } else {
      addToast(`Dialing ${lead.studentName} (${cleanPhone}) via JioFiber MicroSIP...`, "info");
    }

    // Exclusively trigger local MicroSIP Bridge (100% background, zero visible window)
    fetch("/api/microsip/call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: cleanPhone }),
    }).catch((err) => {
      console.warn("Direct MicroSIP API call error:", err);
    });
  };

  // Unified Call Hangup
  const endCallSession = () => {
    const formatted = formatTimer(callDuration > 0 ? callDuration : 1);
    setLastCallDuration(formatted);
    setIsCallConnected(false);
    fetch("/api/microsip/hangup", { method: "POST" }).catch(() => {});
    addToast(`Call ended (${formatted}). Please log disposition.`, "info");
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

  // Add Lead with permanent persistence
  const addLead = (newLeadData: Omit<Lead, "id" | "callCount">) => {
    const newId = `LD-${1000 + leads.length + 1}`;
    const newLead: Lead = {
      ...newLeadData,
      id: newId,
      callCount: 0,
      notes: newLeadData.notes || [],
      callHistory: [],
    };
    const updated = [newLead, ...leads];
    setLeads(updated);
    setActiveCallLead(newLead);
    persistLeads(updated);

    showToast({
      type: "success",
      title: "Lead Saved Permanently",
      message: `${newLead.studentName} (${newLead.phone}) saved to database. Ready to call!`,
    });
  };

  const updateLead = (id: string, updated: Partial<Lead>) => {
    const newLeads = leads.map((lead) => (lead.id === id ? { ...lead, ...updated } : lead));
    setLeads(newLeads);
    persistLeads(newLeads);
    showToast({
      type: "info",
      title: "Lead Updated",
      message: `Details updated for lead #${id}.`,
    });
  };

  const updateLeadStatus = (id: string, status: LeadStatus, stage?: PipelineStage) => {
    const newLeads = leads.map((lead) => {
      if (lead.id === id) {
        return {
          ...lead,
          status,
          stage: stage || (status as unknown as PipelineStage),
        };
      }
      return lead;
    });
    setLeads(newLeads);
    persistLeads(newLeads);
    showToast({
      type: "success",
      title: "Status Changed",
      message: `Lead #${id} status updated to ${status}.`,
    });
  };

  const assignCaller = (leadId: string, callerName: string) => {
    const newLeads = leads.map((lead) =>
      lead.id === leadId ? { ...lead, assignedCaller: callerName } : lead
    );
    setLeads(newLeads);
    persistLeads(newLeads);
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
    const newLeads = leads.map((lead) =>
      lead.id === leadId ? { ...lead, notes: [newNote, ...(lead.notes || [])] } : lead
    );
    setLeads(newLeads);
    persistLeads(newLeads);
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

    let updatedFu = [...followUps];
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
        updatedFu = [newFu, ...updatedFu];
        setFollowUps(updatedFu);
      }
    }

    const newLeads = leads.map((lead) => {
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
    });

    setLeads(newLeads);
    persistLeads(newLeads, updatedFu);

    showToast({
      type: "success",
      title: "Call Logged",
      message: `Call result "${record.outcome}" saved permanently.`,
    });
  };

  const markFollowUpCompleted = (id: string) => {
    const updated = followUps.map((fu) => (fu.id === id ? { ...fu, status: "Completed" as const } : fu));
    setFollowUps(updated);
    persistLeads(leads, updated);
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
    const updated = followUps.map((fu) =>
      fu.id === id
        ? {
            ...fu,
            followUpDate: newDate,
            followUpTime: newTime,
            status: "Upcoming" as const,
            remarks: remarks || fu.remarks,
          }
        : fu
    );
    setFollowUps(updated);
    persistLeads(leads, updated);
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
    const updated = [newTask, ...followUps];
    setFollowUps(updated);
    persistLeads(leads, updated);
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
        closeCallModal,
        isCallConnected,
        setIsCallConnected,
        callDuration,
        lastCallDuration,
        setLastCallDuration,
        initiateCall,
        endCallSession,
        telephonyStatus,
        refreshTelephonyStatus,
        reconnectTelephony,
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
