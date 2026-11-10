"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import {
  startIndianRingbackCadence,
  stopRingbackCadence,
  playCallEndTone,
} from "@/utils/softphoneAudio";
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

export type TelephonyMode = "jio" | "airtel" | "presentation";

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
  callPhase: "idle" | "ringing" | "connected";
  callDuration: number;
  lastCallDuration: string | null;
  setLastCallDuration: (dur: string | null) => void;
  activePhoneNumber: string;
  initiateCall: (lead: Lead) => void;
  endCallSession: () => void;

  // Telephony Presence & Reconnect
  telephonyStatus: TelephonyStatus;
  telephonyMode: TelephonyMode;
  setTelephonyMode: (mode: TelephonyMode) => void;
  refreshTelephonyStatus: (force?: boolean) => Promise<void>;
  reconnectTelephony: () => Promise<void>;

  // AI Voice Telecalling & Batch Auto-Dialer Session State
  isAiCallModalOpen: boolean;
  aiCallLead: Lead | null;
  aiCallPhone: string;
  isAiInbound: boolean;
  openAiCallModal: (lead?: Lead | null, phone?: string, isInbound?: boolean) => void;
  closeAiCallModal: () => void;
  isAiBatchDialerOpen: boolean;
  aiBatchSelectedLeadIds: string[];
  openAiBatchDialer: (leadIds?: string[]) => void;
  closeAiBatchDialer: () => void;

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
  const [callPhase, setCallPhase] = useState<"idle" | "ringing" | "connected">("idle");
  const [callDuration, setCallDuration] = useState(0);
  const [lastCallDuration, setLastCallDuration] = useState<string | null>(null);
  const [activePhoneNumber, setActivePhoneNumber] = useState<string>("");
  const ringingTimeoutRef = useRef<any>(null);
  const callStartTimeRef = useRef<number>(0);
  const activePhoneRef = useRef<string>("");
  const callDurationRef = useRef<number>(0);

  // AI Voice Telecalling & Batch Auto-Dialer State
  const [isAiCallModalOpen, setIsAiCallModalOpen] = useState(false);
  const [aiCallLead, setAiCallLead] = useState<Lead | null>(null);
  const [aiCallPhone, setAiCallPhone] = useState<string>("+91 98431 73678");
  const [isAiInbound, setIsAiInbound] = useState(false);
  const [isAiBatchDialerOpen, setIsAiBatchDialerOpen] = useState(false);
  const [aiBatchSelectedLeadIds, setAiBatchSelectedLeadIds] = useState<string[]>([]);

  const openAiCallModal = useCallback(
    (lead?: Lead | null, phone?: string, isInbound?: boolean) => {
      setAiCallLead(lead || null);
      setAiCallPhone(phone || lead?.phone || "+91 98431 73678");
      setIsAiInbound(Boolean(isInbound));
      setIsAiCallModalOpen(true);
    },
    []
  );

  const closeAiCallModal = useCallback(() => {
    setIsAiCallModalOpen(false);
  }, []);

  const openAiBatchDialer = useCallback((leadIds?: string[]) => {
    setAiBatchSelectedLeadIds(leadIds || []);
    setIsAiBatchDialerOpen(true);
  }, []);

  const closeAiBatchDialer = useCallback(() => {
    setIsAiBatchDialerOpen(false);
  }, []);

  // Live MicroSIP Telephony & Wi-Fi Network Presence
  const [telephonyMode, setTelephonyModeState] = useState<TelephonyMode>("jio");
  const telephonyModeRef = useRef<TelephonyMode>("jio");

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

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const savedMode = localStorage.getItem("wegrow_telephony_mode") as TelephonyMode;
        if (savedMode === "jio" || savedMode === "airtel" || savedMode === "presentation") {
          setTelephonyModeState(savedMode);
          telephonyModeRef.current = savedMode;
        }
      }
    } catch {}
  }, []);

  const setTelephonyMode = (mode: TelephonyMode) => {
    setTelephonyModeState(mode);
    telephonyModeRef.current = mode;
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("wegrow_telephony_mode", mode);
      }
    } catch {}
    if (mode === "airtel") {
      setTelephonyStatus({
        connected: true,
        status: "online",
        message: "Main Office Airtel Mode • Presentation Ready",
        wifiSSID: "Airtel Office Wi-Fi",
        wifiState: "connected",
        gatewayReachable: true,
        microsipRunning: true,
        account: "Airtel Office / Presentation SIP",
      });
      addToast("Switched to Main Office (Airtel Wi-Fi Mode)", "success");
    } else if (mode === "presentation") {
      setTelephonyStatus({
        connected: true,
        status: "online",
        message: "Presentation / Demo Mode • 100% Reliable",
        wifiSSID: "Any Network / Wi-Fi",
        wifiState: "connected",
        gatewayReachable: true,
        microsipRunning: true,
        account: "Interactive Presentation Mode",
      });
      addToast("Switched to Presentation / Demo Mode", "success");
    } else {
      addToast("Switched to Local Branch (JioFiber SIP)", "info");
      refreshTelephonyStatus(true);
    }
  };

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
          setLeads(data.leads);
          try {
            if (typeof window !== "undefined") {
              localStorage.setItem(LOCAL_STORAGE_LEADS_KEY, JSON.stringify(data.leads));
              if (data.followUps) {
                localStorage.setItem(LOCAL_STORAGE_FOLLOWUPS_KEY, JSON.stringify(data.followUps));
              }
            }
          } catch {}
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
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setTelephonyStatus(data);
        if (data.connected) {
          // If Office JioFiber Wi-Fi is actively connected, always ensure JioFiber SIP mode
          setTelephonyModeState("jio");
          telephonyModeRef.current = "jio";
          try {
            if (typeof window !== "undefined") {
              localStorage.setItem("wegrow_telephony_mode", "jio");
            }
          } catch {}
          return;
        }
      }
    } catch {}

    // Fallback configurations if JioFiber is not reachable
    if (telephonyModeRef.current === "airtel") {
      setTelephonyStatus({
        connected: false,
        status: "wifi_disconnected",
        message: "Main Office Airtel Mode (Simulation)",
        wifiSSID: "Airtel Office Wi-Fi",
        wifiState: "connected",
        gatewayReachable: false,
        microsipRunning: true,
        account: "Airtel Office / Presentation SIP",
      });
      return;
    }
    if (telephonyModeRef.current === "presentation") {
      setTelephonyStatus({
        connected: false,
        status: "wifi_disconnected",
        message: "Presentation / Demo Mode (Simulation)",
        wifiSSID: "Any Network / Wi-Fi",
        wifiState: "connected",
        gatewayReachable: false,
        microsipRunning: false,
        account: "Interactive Presentation Mode",
      });
      return;
    }

    setTelephonyStatus((prev) => ({
      ...prev,
      connected: false,
      status: "offline",
      message: "MicroSIP Telephony Offline",
    }));
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

  // Periodic status poll (every 30 seconds, ultra-lightweight via route memory cache)
  useEffect(() => {
    refreshTelephonyStatus();
    const interval = setInterval(() => {
      refreshTelephonyStatus();
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshTelephonyStatus]);

  // Synchronized Call Timer (ticks continuously while in call)
  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    let timer: any = null;
    if (isCallConnected && callPhase === "connected") {
      timer = setInterval(() => {
        setCallDuration((prev) => {
          const next = prev + 1;
          callDurationRef.current = next;
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isCallConnected, callPhase]);

  const hasRungOnceRef = useRef<boolean>(false);
  const idleConfirmCountRef = useRef<number>(0);

  // Real-time MicroSIP Call State Detector (Automatic answer detection & automatic hangup on remote cut)
  useEffect(() => {
    let interval: any = null;
    if (isCallConnected) {
      interval = setInterval(async () => {
        try {
          const targetPhone = activePhoneRef.current || "";
          const res = await fetch(
            `/api/microsip/call-state?phone=${encodeURIComponent(targetPhone)}&_t=${Date.now()}`,
            {
              cache: "no-store",
              headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
            }
          );
          if (!res.ok) return;
          const data = await res.json();

          if (data.state === "connected") {
            // Opposite person has ANSWERED the call! Locked in active state.
            idleConfirmCountRef.current = 0;
            hasRungOnceRef.current = true;
            stopRingbackCadence();
            setCallPhase("connected");
          } else if (data.state === "ringing") {
            idleConfirmCountRef.current = 0;
            hasRungOnceRef.current = true;
            setCallPhase("ringing");

            // Automatic 50-second ring timeout if recipient never answers
            const timeRinging = Date.now() - (callStartTimeRef.current || 0);
            if (timeRinging > 50000) {
              stopRingbackCadence();
              playCallEndTone();
              setCallPhase("idle");
              setIsCallConnected(false);
              hasRungOnceRef.current = false;
              addToast("Ring Timeout • Student did not answer the phone", "warning");
              fetch("/api/microsip/hangup", { method: "POST" }).catch(() => {});
            }
          } else if (data.state === "idle") {
            const timeSinceStart = Date.now() - (callStartTimeRef.current || 0);

            // While initial dialing, give MicroSIP up to 3 seconds to initiate the SIP transaction
            if (!hasRungOnceRef.current && timeSinceStart < 3000) {
              return;
            }

            // If call is actively connected, require 3 consecutive idle polls (~1.2s) to prevent any premature blip
            idleConfirmCountRef.current += 1;
            const threshold = callPhase === "connected" ? 3 : 2;
            if (idleConfirmCountRef.current < threshold) {
              return;
            }

            // Remote party has CUT / REJECTED / ENDED the call (or call dropped)
            idleConfirmCountRef.current = 0;
            stopRingbackCadence();
            playCallEndTone();
            const dur = callDurationRef.current;
            const formatted = formatTimer(dur > 0 ? dur : 0);
            setLastCallDuration(formatted);
            setCallPhase("idle");
            setIsCallConnected(false);
            hasRungOnceRef.current = false;

            if (data.lastOutcome) {
              addToast(data.lastOutcome, "warning");
            } else {
              addToast(`Call ended (${formatted})`, "info");
            }
          }
        } catch {}
      }, 400); // Fast 400ms polling for instant UI reactivity
    } else {
      hasRungOnceRef.current = false;
      idleConfirmCountRef.current = 0;
    }
    return () => clearInterval(interval);
  }, [isCallConnected, callPhase]);

  // Unified Call Initiator with Real Audio & Smooth SIP Bridging
  const initiateCall = (lead: Lead) => {
    callStartTimeRef.current = Date.now();
    callDurationRef.current = 0;
    hasRungOnceRef.current = false;
    idleConfirmCountRef.current = 0;
    setActiveCallLead(lead);
    setIsCallConnected(true);
    setCallPhase("ringing");
    setCallDuration(0);
    setLastCallDuration(null);

    // Ensure any leftover browser ringback audio is completely stopped so it doesn't clash with MicroSIP
    stopRingbackCadence();

    // Format phone with mandatory +91 or 0 for JioFiber SIP (+91XXXXXXXXXX) - strictly remove all spaces/symbols
    const rawDigits = lead.phone.replace(/\D/g, "");

    // STRICT SAFETY CHECK: PERMANENTLY BLOCK 9952337331 (NEVER CALL)
    if (rawDigits.includes("9952337331")) {
      stopRingbackCadence();
      setCallPhase("idle");
      setIsCallConnected(false);
      addToast("Calling 9952337331 is strictly and permanently blocked.", "error");
      return;
    }

    let cleanPhone = "";
    if (rawDigits.length === 10) {
      cleanPhone = `0${rawDigits}`;
    } else if (rawDigits.length === 12 && rawDigits.startsWith("91")) {
      cleanPhone = `0${rawDigits.substring(2)}`;
    } else if (rawDigits.length === 11 && rawDigits.startsWith("0")) {
      cleanPhone = rawDigits;
    } else {
      cleanPhone = rawDigits;
    }

    activePhoneRef.current = cleanPhone;
    setActivePhoneNumber(cleanPhone);

    // Presentation / Airtel Demo Mode (ONLY if JioFiber is NOT connected)
    if (!telephonyStatus.connected && (telephonyMode === "airtel" || telephonyMode === "presentation")) {
      addToast(
        telephonyMode === "airtel"
          ? `Airtel Office Mode (Simulation): Calling ${lead.studentName} (${cleanPhone})...`
          : `Presentation Mode (Simulation): Calling ${lead.studentName} (${cleanPhone})...`,
        "info"
      );
      // Realistic Indian telecom ringback tone
      startIndianRingbackCadence();

      // Automatically connect call after 2.8s for presentation demo
      ringingTimeoutRef.current = setTimeout(() => {
        stopRingbackCadence();
        hasRungOnceRef.current = true;
        setCallPhase("connected");
        addToast(`Call connected with ${lead.studentName}`, "success");
      }, 2800);
      return;
    }

    if (!telephonyStatus.connected && telephonyStatus.status === "wifi_disconnected") {
      addToast(
        "Warning: Wi-Fi disconnected from JioFiber. Please connect to Office Wi-Fi to call.",
        "warning"
      );
    } else {
      addToast(`Dialing ${lead.studentName} (${cleanPhone}) via JioFiber MicroSIP...`, "info");
    }

    // Trigger local MicroSIP Bridge (100% background, zero visible window)
    fetch("/api/microsip/call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: cleanPhone }),
    }).catch((err) => {
      console.warn("Direct MicroSIP API call error:", err);
    });
  };

  // Unified Call Hangup (Stops audio, plays disconnect chime, triggers SIP hangup)
  const endCallSession = () => {
    if (ringingTimeoutRef.current) {
      clearTimeout(ringingTimeoutRef.current);
      ringingTimeoutRef.current = null;
    }
    hasRungOnceRef.current = false;
    idleConfirmCountRef.current = 0;
    stopRingbackCadence();
    playCallEndTone();

    const formatted = formatTimer(callDuration > 0 ? callDuration : 1);
    setLastCallDuration(formatted);
    setCallPhase("idle");
    setIsCallConnected(false);
    setActivePhoneNumber("");

    // Always trigger background MicroSIP hangup
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
        callPhase,
        callDuration,
        lastCallDuration,
        setLastCallDuration,
        activePhoneNumber,
        initiateCall,
        endCallSession,
        telephonyStatus,
        telephonyMode,
        setTelephonyMode,
        refreshTelephonyStatus,
        reconnectTelephony,
        isAiCallModalOpen,
        aiCallLead,
        aiCallPhone,
        isAiInbound,
        openAiCallModal,
        closeAiCallModal,
        isAiBatchDialerOpen,
        aiBatchSelectedLeadIds,
        openAiBatchDialer,
        closeAiBatchDialer,
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
