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
  CallRecord,
} from "@/types";
import {
  initialLeads,
  initialFollowUps,
  initialWhatsAppChats,
  initialCourses,
  initialTelecallers,
  initialUsers,
} from "@/data/dummy-data";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

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

export type TelephonyMode = "mobile" | "jio" | "airtel" | "presentation";

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
  callPhase: "idle" | "ringing" | "connected" | "ended";
  callDuration: number;
  lastCallDuration: string | null;
  setLastCallDuration: (dur: string | null) => void;
  activePhoneNumber: string;
  initiateCall: (lead: Lead) => void;
  answerCall: () => void;
  endCallSession: () => void;

  // Telephony Presence & Reconnect
  telephonyStatus: TelephonyStatus;
  telephonyMode: TelephonyMode;
  setTelephonyMode: (mode: TelephonyMode) => void;
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
      mindset?: string;
      duration: string;
      remarks: string;
      nextFollowUpDate?: string;
      nextFollowUpTime?: string;
      qualification?: string;
      passedOutYear?: string;
      collegeName?: string;
      studentName?: string;
    }
  ) => void;
  markFollowUpCompleted: (id: string) => void;
  completeLeadFollowUp: (leadId: string) => void;
  rescheduleFollowUp: (id: string, newDate: string, newTime: string, remarks?: string) => void;
  addNewFollowUp: (task: Omit<FollowUpTask, "id">) => void;
  sendWhatsAppMessage: (chatId: string, text: string) => void;
  addUser: (user: Omit<AppUser, "id" | "assignedLeads" | "joinedDate" | "lastActive">) => void;
  updateUserRole: (id: string, newRole: AppUser["role"]) => void;
  toggleUserStatus: (id: string) => void;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

const LOCAL_STORAGE_LEADS_KEY = "wegrow_crm_leads_v5_clean";
const LOCAL_STORAGE_FOLLOWUPS_KEY = "wegrow_crm_followups_v5";

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const leadsRef = useRef<Lead[]>(initialLeads);
  useEffect(() => {
    leadsRef.current = leads;
  }, [leads]);

  const [followUps, setFollowUps] = useState<FollowUpTask[]>(initialFollowUps);
  const [whatsappChats, setWhatsappChats] = useState<WhatsAppChat[]>(initialWhatsAppChats);
  const [courses] = useState<Course[]>(initialCourses);
  const [telecallers, setTelecallers] = useState<Telecaller[]>(initialTelecallers);
  const [users, setUsers] = useState<AppUser[]>(initialUsers);
  const [activeUserRole, setActiveUserRole] = useState<string>("Owner");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = "t-" + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  }, [dismissToast]);

  const addToast = useCallback((title: string, type: "success" | "info" | "warning" | "error" = "info") => {
    showToast({ title, type });
  }, [showToast]);

  // Live Calling Session State
  const [activeCallLead, setActiveCallLeadState] = useState<Lead | null>(null);
  const activeCallLeadRef = useRef<Lead | null>(null);
  const setActiveCallLead = useCallback((lead: Lead | null) => {
    activeCallLeadRef.current = lead;
    setActiveCallLeadState(lead);
  }, []);

  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isCallConnected, setIsCallConnected] = useState(false);
  const [callPhase, setCallPhase] = useState<"idle" | "ringing" | "connected" | "ended">("idle");
  const callPhaseRef = useRef<"idle" | "ringing" | "connected" | "ended">("idle");
  const callConnectedAtRef = useRef<number | null>(null);
  const consecutiveIdleCountRef = useRef<number>(0);

  const setCallPhaseSynced = useCallback((phase: "idle" | "ringing" | "connected" | "ended") => {
    callPhaseRef.current = phase;
    setCallPhase(phase);
  }, []);

  const [callDuration, setCallDuration] = useState(0);
  const [lastCallDuration, setLastCallDuration] = useState<string | null>(null);
  const [activePhoneNumber, setActivePhoneNumber] = useState<string>("");
  const ringingTimeoutRef = useRef<any>(null);
  const callStartTimeRef = useRef<number>(0);
  const activePhoneRef = useRef<string>("");
  const callDurationRef = useRef<number>(0);
  const lastProcessedCallTimestampRef = useRef<number>(0);

  
  // Live Telephony & Network Presence (Mobile SIM Bridge / MicroSIP / Demo)
  const [telephonyMode, setTelephonyModeState] = useState<TelephonyMode>("mobile");
  const telephonyModeRef = useRef<TelephonyMode>("mobile");

  const [telephonyStatus, setTelephonyStatus] = useState<TelephonyStatus>({
    connected: true,
    status: "online",
    message: "Mobile SIM Bridge Online • Direct SIM Calling Ready",
    wifiSSID: "Mobile Bridge (ADB)",
    wifiState: "connected",
    gatewayReachable: true,
    microsipRunning: false,
    account: "Android SIM Dialer",
  });

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const savedMode = localStorage.getItem("wegrow_telephony_mode") as TelephonyMode;
        if (savedMode === "airtel" || savedMode === "presentation" || savedMode === "mobile") {
          setTelephonyModeState(savedMode);
          telephonyModeRef.current = savedMode;
        } else {
          // Default to mobile (Mobile Phone SIM Bridge)
          setTelephonyModeState("mobile");
          telephonyModeRef.current = "mobile";
          try {
            localStorage.setItem("wegrow_telephony_mode", "mobile");
          } catch {}
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
    if (mode === "mobile") {
      setTelephonyStatus({
        connected: true,
        status: "online",
        message: "Mobile SIM Bridge Online • Direct SIM Calling Ready",
        wifiSSID: "Mobile Bridge (ADB)",
        wifiState: "connected",
        gatewayReachable: true,
        microsipRunning: false,
        account: "Android SIM Dialer",
      });
      addToast("Switched to Mobile Phone SIM Bridge (No MicroSIP)", "success");
      fetch("/api/mobile/status")
        .then((res) => res.json())
        .then((data) => {
          if (data.connected) {
            setTelephonyStatus((prev) => ({
              ...prev,
              message: `Mobile SIM Bridge Online (${data.model || "Android"} • ${data.device})`,
            }));
          } else {
            addToast("Warning: No mobile device connected via ADB.", "warning");
          }
        })
        .catch(() => {});
    } else if (mode === "airtel") {
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
      addToast("Switched to Local Branch (JioFiber SIP MicroSIP)", "info");
      refreshTelephonyStatus(true);
    }
  };

  // 1. Initial Load of persistent leads from localStorage and /api/leads
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        // Clear any old legacy dummy localStorage caches from previous tests
        ["wegrow_crm_leads_v1", "wegrow_crm_leads_v2", "wegrow_crm_leads_v3", "wegrow_crm_leads_v4", "wegrow_crm_followups_v1", "wegrow_crm_followups_v2"].forEach((k) => {
          localStorage.removeItem(k);
        });

        const localLeads = localStorage.getItem(LOCAL_STORAGE_LEADS_KEY);
        if (localLeads) {
          const parsed = JSON.parse(localLeads);
          const isDummy = Array.isArray(parsed) && parsed.some((l: any) => l.id?.startsWith("LD-00") || l.studentName?.includes("Ramesh"));
          if (!isDummy && Array.isArray(parsed) && parsed.length > 0) {
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

    // Also fetch server storage (Supabase backed)
    fetch("/api/leads")
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.leads)) {
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

    // Supabase Cloud Realtime Channel for instant live updates across devices
    const sb = supabase;
    if (isSupabaseConfigured() && sb) {
      const channel = sb
        .channel("realtime:crm-live")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "leads" },
          () => {
            fetch("/api/leads")
              .then((res) => res.json())
              .then((data) => {
                if (data && Array.isArray(data.leads)) setLeads(data.leads);
                if (data && Array.isArray(data.followUps)) setFollowUps(data.followUps);
              })
              .catch(() => {});
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "calls" },
          () => {
            fetch("/api/leads")
              .then((res) => res.json())
              .then((data) => {
                if (data && Array.isArray(data.leads)) setLeads(data.leads);
              })
              .catch(() => {});
          }
        )
        .subscribe();

      return () => {
        sb.removeChannel(channel);
      };
    }
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
    if (telephonyModeRef.current === "mobile") {
      try {
        const res = await fetch("/api/mobile/status", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.connected) {
            setTelephonyStatus({
              connected: true,
              status: "online",
              message: `Mobile SIM Bridge Online (${data.model || "Android"} • ${data.device})`,
              wifiSSID: "Mobile Bridge (ADB)",
              wifiState: "connected",
              gatewayReachable: true,
              microsipRunning: false,
              account: "Android SIM Dialer",
            });
            return;
          }
        }
      } catch {}

      setTelephonyStatus({
        connected: false,
        status: "offline",
        message: "Mobile Phone Disconnected (ADB)",
        wifiSSID: "Mobile Bridge",
        wifiState: "disconnected",
        gatewayReachable: false,
        microsipRunning: false,
        account: "Android SIM Dialer",
      });
      return;
    }

    try {
      const url = force ? "/api/microsip/status?force=true" : "/api/microsip/status";
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setTelephonyStatus(data);
        return;
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

  // Reconnect Function (Mobile Phone Bridge or Office Wi-Fi)
  const reconnectTelephony = useCallback(async () => {
    if (telephonyModeRef.current === "mobile") {
      showToast({
        type: "info",
        title: "Connecting Mobile Bridge...",
        message: "Checking ADB connection to Android Phone SIM...",
      });
      try {
        const res = await fetch("/api/mobile/status?refresh=true", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.connected) {
            setTelephonyStatus({
              connected: true,
              status: "online",
              message: `Mobile SIM Bridge Online (${data.model || "Android"} • ${data.device})`,
              wifiSSID: "Mobile Bridge (ADB)",
              wifiState: "connected",
              gatewayReachable: true,
              microsipRunning: false,
              account: "Android SIM Dialer",
            });
            showToast({
              type: "success",
              title: "Mobile Phone Connected!",
              message: `Device: ${data.model || "Android Phone"} • SIM Call Ready`,
            });
            return;
          }
        }
      } catch {}
      showToast({
        type: "error",
        title: "Phone Disconnected",
        message: "Please check Wireless Debugging or plug phone via USB.",
      });
      return;
    }

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

  // Convert seconds into human-readable duration like "1 minute 30 seconds"
  const formatHumanDuration = (totalSeconds: number): string => {
    if (totalSeconds <= 0) return "0 seconds";
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    if (m > 0 && s > 0) {
      return `${m} minute${m > 1 ? "s" : ""} ${s} second${s > 1 ? "s" : ""}`;
    }
    if (m > 0) {
      return `${m} minute${m > 1 ? "s" : ""}`;
    }
    return `${s} second${s > 1 ? "s" : ""}`;
  };

  // Master Monotonic Call Timer - Strictly derived from hardware wall-clock (Date.now())
  // Never jumps backwards, never resets to 0 mid-call
  useEffect(() => {
    let timer: any = null;
    if (isCallConnected && callPhase === "connected") {
      if (!callConnectedAtRef.current) {
        callConnectedAtRef.current = Date.now();
      }
      timer = setInterval(() => {
        const elapsed = Math.max(
          1,
          Math.floor((Date.now() - (callConnectedAtRef.current || Date.now())) / 1000)
        );
        setCallDuration(elapsed);
        callDurationRef.current = elapsed;
      }, 500);
    } else if (callPhase === "idle") {
      callConnectedAtRef.current = null;
    }
    return () => clearInterval(timer);
  }, [isCallConnected, callPhase]);

  // Real-time Mobile SIM Call State & Remote Cut / Hangup Detector
  useEffect(() => {
    let interval: any = null;
    if (isCallConnected) {
      interval = setInterval(async () => {
        try {
          const targetPhone = activePhoneRef.current || "";
          const url =
            telephonyModeRef.current === "mobile"
              ? `/api/mobile/status?_t=${Date.now()}`
              : `/api/microsip/call-state?phone=${encodeURIComponent(targetPhone)}&_t=${Date.now()}`;
          const res = await fetch(url, {
            cache: "no-store",
            headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
          });
          if (!res.ok) return;
          const data = await res.json();

          const timeSinceStart = Date.now() - (callStartTimeRef.current || 0);

          // CRITICAL SAFETY GUARD:
          // If the phone is NOT connected via ADB (Wi-Fi drop, packet loss, or proximity sleep),
          // NEVER cut the call! The user is actively speaking on their mobile SIM card!
          if (!data.connected) {
            consecutiveIdleCountRef.current = 0;
            return;
          }

          // 1. If call is IDLE on phone -> user cut call on phone, or remote party hung up!
          if (data.state === "idle") {
            const isCallActive = callPhaseRef.current === "connected";

            // If still in dialing/ringing phase, give modem initial 5s to dispatch dialing
            if (!isCallActive && timeSinceStart < 5000) {
              return;
            }

            // Once the call was connected (active talk), fast instant cut:
            // 2 consecutive confirmed idle polls (~800ms) is enough to immediately cut the web call!
            consecutiveIdleCountRef.current += 1;
            const requiredIdlePolls = isCallActive ? 2 : 3;
            if (consecutiveIdleCountRef.current < requiredIdlePolls) {
              return;
            }

            consecutiveIdleCountRef.current = 0;
            stopRingbackCadence();
            playCallEndTone();

            // Accurate duration: ALWAYS prioritize the phone's official hardware duration if > 0!
            const spokenSecs = callConnectedAtRef.current
              ? Math.max(1, Math.floor((Date.now() - callConnectedAtRef.current) / 1000))
              : callDurationRef.current || 0;
            const finalSecs =
              data.lastCallDurationSeconds && data.lastCallDurationSeconds > 0
                ? data.lastCallDurationSeconds
                : spokenSecs;
            const formatted = formatTimer(finalSecs);

            setLastCallDuration(formatted);
            callDurationRef.current = finalSecs;
            setCallDuration(finalSecs);
            callConnectedAtRef.current = null;
            setCallPhaseSynced("idle");
            setIsCallConnected(false);

            // Stamp baseline so background poller NEVER adds a duplicate record!
            if (data.lastCallTimestamp) {
              lastProcessedCallTimestampRef.current = data.lastCallTimestamp;
            } else {
              lastProcessedCallTimestampRef.current = Date.now();
            }

            // IMMEDIATELY AUTO-ADD TALK TIMING TO CRM Call History
            const currentLead =
              activeCallLeadRef.current ||
              leadsRef.current.find((l) => {
                const targetDigits = (data.lastCallNumber || activePhoneRef.current || "").replace(/\D/g, "");
                return targetDigits && l.phone.replace(/\D/g, "").endsWith(targetDigits.slice(-10));
              });

            if (currentLead) {
              const endNow = new Date();
              const startNow = new Date(endNow.getTime() - Math.max(1, finalSecs) * 1000);
              const dateStr = endNow.toISOString().split("T")[0];
              const fromTime = startNow.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
              const endTime = endNow.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
              const timeStr = fromTime;
              const durationLong = formatHumanDuration(finalSecs);

              const autoCallRecord: CallRecord = {
                id: "ch-" + Date.now(),
                callDate: dateStr,
                callTime: timeStr,
                callerName: currentLead.assignedCaller || telecallers?.[0]?.name || "Muthumeena",
                duration: formatted,
                durationFormatted: durationLong,
                fromTime: fromTime,
                endTime: endTime,
                outcome: finalSecs > 0 ? "Attended Call" : "Not Attended Call",
                remarks:
                  finalSecs > 0
                    ? `Mobile SIM Call (Attended): Spoke for ${durationLong} (${fromTime} - ${endTime}).`
                    : "Mobile SIM Call (Not Attended): Cut before connecting.",
              };

              setLeads((prevLeads) => {
                const targetDigits = (currentLead.phone || data.lastCallNumber || activePhoneRef.current || "").replace(/\D/g, "");
                const exists = prevLeads.some(
                  (l) => l.id === currentLead.id || (targetDigits && l.phone.replace(/\D/g, "").endsWith(targetDigits.slice(-10)))
                );
                let updated: Lead[];
                if (exists) {
                  updated = prevLeads.map((l) => {
                    if (l.id === currentLead.id || (targetDigits && l.phone.replace(/\D/g, "").endsWith(targetDigits.slice(-10)))) {
                      return {
                        ...l,
                        callCount: (l.callCount || 0) + 1,
                        lastCallDate: dateStr,
                        lastCallOutcome: autoCallRecord.outcome,
                        callHistory: [autoCallRecord, ...(l.callHistory || [])],
                      };
                    }
                    return l;
                  });
                } else {
                  // Direct Dial New Lead: Auto-create permanently in CRM database
                  const newCreatedLead: Lead = {
                    ...currentLead,
                    id: currentLead.id && !currentLead.id.startsWith("LD-DIRECT") ? currentLead.id : `LD-${Date.now()}`,
                    phone: currentLead.phone.startsWith("+91") ? currentLead.phone : `+91 ${targetDigits.slice(-10)}`,
                    callCount: 1,
                    lastCallDate: dateStr,
                    lastCallOutcome: autoCallRecord.outcome,
                    callHistory: [autoCallRecord],
                  };
                  activeCallLeadRef.current = newCreatedLead;
                  updated = [newCreatedLead, ...prevLeads];
                }
                persistLeads(updated);
                return updated;
              });

              addToast(
                `⚡ Talk time (${formatted}) automatically added to ${currentLead.studentName}'s CRM profile!`,
                "success"
              );
            } else {
              addToast(`Call ended (${formatted}). Duration: ${formatted}`, "info");
            }
            return;
          }

          // Reset idle count when phone is in call
          consecutiveIdleCountRef.current = 0;

          // 2. Call answered: explicit connected state from Android modem
          const isAnswered = data.state === "connected";

          if (isAnswered) {
            if (callPhaseRef.current !== "connected") {
              stopRingbackCadence();
              if (!callConnectedAtRef.current) {
                callConnectedAtRef.current = Date.now();
              }
              setCallPhaseSynced("connected");
              setCallDuration(1);
              callDurationRef.current = 1;
            }
          } else {
            // Still ringing / dialing on phone - NEVER downgrade if already answered/connected!
            if (callPhaseRef.current === "idle") {
              setCallPhaseSynced("ringing");
            }
          }
        } catch {}
      }, 400);
    } else {
      consecutiveIdleCountRef.current = 0;
      setCallPhaseSynced("idle");
    }
    return () => clearInterval(interval);
  }, [isCallConnected, setCallPhaseSynced]);

  // Explicitly Answer Call (User clicks Pick Up button or Auto-connects)
  const answerCall = useCallback(() => {
    if (ringingTimeoutRef.current) {
      clearTimeout(ringingTimeoutRef.current);
      ringingTimeoutRef.current = null;
    }
    stopRingbackCadence();
    if (!callConnectedAtRef.current) {
      callConnectedAtRef.current = Date.now();
    }
    setCallPhaseSynced("connected");
    setIsCallConnected(true);
    setCallDuration(1);
    callDurationRef.current = 1;
    addToast("📞 Call Connected! Live conversation active.", "success");
  }, [addToast, setCallPhaseSynced]);

  // Unified Call Initiator with Real Indian Telecom Audio Cadence & Softphone
  const initiateCall = (lead: Lead) => {
    callStartTimeRef.current = Date.now();
    callDurationRef.current = 0;
    callConnectedAtRef.current = null;
    consecutiveIdleCountRef.current = 0;
    setActiveCallLead(lead);
    setIsCallConnected(true);
    setCallPhaseSynced("ringing");
    setCallDuration(0);
    setLastCallDuration(null);
    setIsCallModalOpen(true);

    // Play authentic Indian Ringback audio cadence (Trrrr... Trrrr...)
    stopRingbackCadence();
    startIndianRingbackCadence();

    // In demo/presentation mode only: auto-connect after ~3.2s
    if (telephonyModeRef.current !== "mobile") {
      if (ringingTimeoutRef.current) {
        clearTimeout(ringingTimeoutRef.current);
      }
      ringingTimeoutRef.current = setTimeout(() => {
        answerCall();
      }, 3200);
    }

    // Format phone with mandatory +91 or 0 for JioFiber SIP (+91XXXXXXXXXX) - strictly remove all spaces/symbols
    const rawDigits = lead.phone.replace(/\D/g, "");

    // STRICT SAFETY CHECK: PERMANENTLY BLOCK 9952337331 (NEVER CALL)
    if (rawDigits.includes("9952337331")) {
      stopRingbackCadence();
      setCallPhaseSynced("idle");
      setIsCallConnected(false);
      addToast("Calling 9952337331 is strictly and permanently blocked.", "error");
      return;
    }

    let cleanPhone = "";
    if (telephonyModeRef.current === "mobile") {
      // For Mobile Phone Cellular SIM: Standard 10-digit Indian mobile number
      if (rawDigits.length === 10) {
        cleanPhone = rawDigits;
      } else if (rawDigits.length === 12 && rawDigits.startsWith("91")) {
        cleanPhone = rawDigits.substring(2);
      } else if (rawDigits.length === 11 && rawDigits.startsWith("0")) {
        cleanPhone = rawDigits.substring(1);
      } else if (rawDigits.length > 10) {
        cleanPhone = rawDigits.slice(-10);
      } else {
        cleanPhone = rawDigits;
      }
    } else {
      // For Landline SIP Trunk (MicroSIP): Require leading 0
      if (rawDigits.length === 10) {
        cleanPhone = `0${rawDigits}`;
      } else if (rawDigits.length === 12 && rawDigits.startsWith("91")) {
        cleanPhone = `0${rawDigits.substring(2)}`;
      } else if (rawDigits.length === 11 && rawDigits.startsWith("0")) {
        cleanPhone = rawDigits;
      } else {
        cleanPhone = rawDigits;
      }
    }

    activePhoneRef.current = cleanPhone;
    setActivePhoneNumber(cleanPhone);

    // For mobile SIM bridge, ALWAYS send clean 10-digit phone
    const mobileDigits = rawDigits.length >= 10 ? rawDigits.slice(-10) : rawDigits;

    // Trigger direct mobile device SIM call bridge
    fetch("/api/mobile/call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: mobileDigits, studentName: lead.studentName }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          addToast(`📲 SIM Call triggered on mobile phone! (${mobileDigits})`, "success");
        } else {
          console.warn("Mobile call bridge note:", data.error);
          addToast(`⚠️ Mobile Bridge: ${data.error || "Phone not reachable. Check phone Wi-Fi."}`, "warning");
        }
      })
      .catch((err) => {
        console.warn("Direct Mobile Call API note:", err);
      });
  };

  // Unified Call Hangup (Stops audio, plays disconnect chime, triggers SIP hangup)
  const endCallSession = () => {
    if (ringingTimeoutRef.current) {
      clearTimeout(ringingTimeoutRef.current);
      ringingTimeoutRef.current = null;
    }
    stopRingbackCadence();
    playCallEndTone();

    const wasConnected = callPhaseRef.current === "connected";
    const spokenSecs = wasConnected && callConnectedAtRef.current
      ? Math.max(1, Math.floor((Date.now() - callConnectedAtRef.current) / 1000))
      : wasConnected ? Math.max(1, callDurationRef.current || callDuration) : 0;
    const finalSecs = spokenSecs;
    const formatted = formatTimer(finalSecs);
    setLastCallDuration(formatted);
    callConnectedAtRef.current = null;
    consecutiveIdleCountRef.current = 0;
    setCallPhaseSynced("ended");
    setIsCallConnected(false);
    setActivePhoneNumber("");

    // Trigger hangup on mobile phone
    fetch("/api/mobile/hangup", { method: "POST" }).catch(() => {});

    // IMMEDIATELY AUTO-ADD TALK TIMING TO CRM Call History
    const currentLead =
      activeCallLeadRef.current ||
      leadsRef.current.find((l) => {
        const cleanTarget = activePhoneRef.current.replace(/\D/g, "");
        const leadClean = l.phone.replace(/\D/g, "");
        return cleanTarget && (leadClean.endsWith(cleanTarget.slice(-10)) || cleanTarget.endsWith(leadClean.slice(-10)));
      });

    if (currentLead) {
      const endNow = new Date();
      const startNow = new Date(endNow.getTime() - Math.max(1, finalSecs) * 1000);
      const dateStr = endNow.toISOString().split("T")[0];
      const fromTime = startNow.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const endTime = endNow.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const timeStr = fromTime;
      const durationLong = formatHumanDuration(finalSecs);

      const autoCallRecord: CallRecord = {
        id: "ch-" + Date.now(),
        callDate: dateStr,
        callTime: timeStr,
        callerName: currentLead.assignedCaller || "Priya Sharma (Mobile SIM)",
        duration: formatted,
        durationFormatted: durationLong,
        fromTime: fromTime,
        endTime: endTime,
        outcome: finalSecs > 0 ? "Attended Call" : "Not Attended Call",
        remarks:
          finalSecs > 0
            ? `Mobile SIM Call (Attended): Spoke for ${durationLong} (${fromTime} - ${endTime}).`
            : "Mobile SIM Call (Not Attended): Cut before connecting.",
      };

      setLeads((prevLeads) => {
        const updated = prevLeads.map((l) => {
          if (l.id === currentLead.id) {
            return {
              ...l,
              callCount: (l.callCount || 0) + 1,
              lastCallDate: dateStr,
              lastCallOutcome: autoCallRecord.outcome,
              callHistory: [autoCallRecord, ...(l.callHistory || [])],
            };
          }
          return l;
        });
        persistLeads(updated);
        return updated;
      });

      addToast(
        `⚡ Spoken duration (${formatted}) automatically saved to ${currentLead.studentName}'s Call History!`,
        "success"
      );
    } else {
      addToast(`Call ended (${formatted}). Duration: ${formatted}`, "info");
    }
  };

  const openCallModal = () => {
    setIsCallModalOpen(true);
  };

  const closeCallModal = () => {
    if (ringingTimeoutRef.current) {
      clearTimeout(ringingTimeoutRef.current);
      ringingTimeoutRef.current = null;
    }
    stopRingbackCadence();
    setCallPhaseSynced("idle");
    setIsCallConnected(false);
    setIsCallModalOpen(false);
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
      mindset?: string;
      duration: string;
      remarks: string;
      nextFollowUpDate?: string;
      nextFollowUpTime?: string;
      qualification?: string;
      passedOutYear?: string;
      collegeName?: string;
      studentName?: string;
    }
  ) => {
    const endNow = new Date();
    const parts = (record.duration || "").split(":").map(Number);
    let totalSecs = 0;
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      totalSecs = parts[0] * 60 + parts[1];
    } else {
      totalSecs = parseInt(record.duration, 10) || 0;
    }
    const startNow = new Date(endNow.getTime() - Math.max(1, totalSecs) * 1000);
    const dateStr = endNow.toISOString().split("T")[0];
    const fromTime = startNow.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const endTime = endNow.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const timeStr = fromTime;
    const durationLong = formatHumanDuration(totalSecs);

    const newRecord: CallRecord = {
      id: "ch-" + Date.now(),
      callDate: dateStr,
      callTime: timeStr,
      callerName: record.callerName,
      duration: record.duration,
      durationFormatted: durationLong,
      fromTime: fromTime,
      endTime: endTime,
      outcome: record.outcome,
      mindset: record.mindset,
      qualification: record.qualification || "",
      passedOutYear: record.passedOutYear || "",
      collegeName: record.collegeName || "",
      studentName: record.studentName || "",
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

    const exists = leads.some((lead) => lead.id === leadId);
    let newLeads: Lead[];
    if (exists) {
      newLeads = leads.map((lead) => {
        if (lead.id === leadId) {
          const history = lead.callHistory ? [...lead.callHistory] : [];
          let isRecentMerge = false;

          if (history.length > 0) {
            const latest = history[0];
            const idTimestampMatch = latest.id.match(/\d{10,}/);
            const recordAgeMs = idTimestampMatch ? Date.now() - parseInt(idTimestampMatch[0], 10) : 9999999;

            if (recordAgeMs < 300000 || (latest.callDate === dateStr && recordAgeMs < 600000)) {
              isRecentMerge = true;
              const latestParts = (latest.duration || "").split(":").map(Number);
              const latestSecs = latestParts.length === 2 ? latestParts[0] * 60 + latestParts[1] : 0;
              const mergedSecs = Math.max(latestSecs, totalSecs);
              const mergedFormatted = formatTimer(mergedSecs);
              const mergedLong = formatHumanDuration(mergedSecs);

              history[0] = {
                ...latest,
                callerName: record.callerName || latest.callerName,
                mindset: record.mindset || latest.mindset,
                duration: mergedFormatted,
                durationFormatted: mergedLong,
                outcome: mergedSecs > 0 ? "Attended Call" : "Not Attended Call",
                qualification: record.qualification || latest.qualification || lead.qualification || "",
                passedOutYear: record.passedOutYear || latest.passedOutYear || lead.passedOutYear || "",
                collegeName: record.collegeName || latest.collegeName || lead.collegeName || "",
                studentName: record.studentName || latest.studentName || lead.studentName || "",
                remarks: record.remarks || latest.remarks,
              };
            }
          }

          if (!isRecentMerge) {
            history.unshift({
              ...newRecord,
              qualification: record.qualification || lead.qualification || "",
              passedOutYear: record.passedOutYear || lead.passedOutYear || "",
              collegeName: record.collegeName || lead.collegeName || "",
              studentName: record.studentName || lead.studentName || "",
            });
          }

          let mappedStatus: LeadStatus = lead.status;
          let mappedStage: PipelineStage = lead.stage || "New Enquiry";
          if (record.mindset === "Not Interested") {
            mappedStatus = "Lost";
            mappedStage = "Lost";
          } else if (record.mindset === "Interested") {
            mappedStatus = "Interested";
            mappedStage = "Interested";
          } else if (record.mindset === "Visit to Institute") {
            mappedStatus = "Counselling Scheduled";
            mappedStage = "Counselling Scheduled";
          } else if (record.mindset === "Joined") {
            mappedStatus = "Admitted";
            mappedStage = "Admitted";
          } else if (record.mindset === "Call Later") {
            mappedStatus = "Call Later";
            mappedStage = "Contacted";
          } else if (record.mindset === "Busy") {
            mappedStatus = "Busy";
            mappedStage = "Contacted";
          }

          return {
            ...lead,
            studentName: record.studentName && !record.studentName.startsWith("Inquiry") ? record.studentName : lead.studentName,
            assignedCaller: record.callerName || lead.assignedCaller,
            status: mappedStatus,
            stage: mappedStage,
            callCount: isRecentMerge ? lead.callCount : (lead.callCount || 0) + 1,
            lastCallDate: dateStr,
            lastCallOutcome: record.mindset || record.remarks || record.outcome,
            qualification: record.qualification || lead.qualification || "",
            passedOutYear: record.passedOutYear || lead.passedOutYear || "",
            collegeName: record.collegeName || lead.collegeName || "",
            nextFollowUpDate: record.nextFollowUpDate || lead.nextFollowUpDate,
            nextFollowUpTime: record.nextFollowUpTime || lead.nextFollowUpTime,
            callHistory: history,
          };
        }
        return lead;
      });
    } else {
      const fallback = activeCallLeadRef.current || {
        id: leadId,
        studentName: `Inquiry (${leadId})`,
        phone: leadId,
        email: `inquiry.${leadId}@wegrow.local`,
        courseInterested: "Full Stack Web Development (MERN + Next.js)",
        leadSource: "Phone" as const,
        enquiryDate: dateStr,
        nextFollowUpDate: record.nextFollowUpDate || "",
        nextFollowUpTime: record.nextFollowUpTime || "",
        assignedCaller: record.callerName,
        status: "Interested" as const,
        priority: "Hot" as const,
        stage: "Interested" as const,
        notes: [],
        callHistory: [],
        callCount: 0,
      };
      const createdLead: Lead = {
        ...fallback,
        assignedCaller: record.callerName || fallback.assignedCaller,
        callCount: (fallback.callCount || 0) + 1,
        lastCallDate: dateStr,
        lastCallOutcome: record.remarks || record.outcome,
        nextFollowUpDate: record.nextFollowUpDate || fallback.nextFollowUpDate,
        nextFollowUpTime: record.nextFollowUpTime || fallback.nextFollowUpTime,
        callHistory: [newRecord, ...(fallback.callHistory || [])],
      };
      newLeads = [createdLead, ...leads];
    }

    setLeads(newLeads);
    persistLeads(newLeads, updatedFu);

    showToast({
      type: "success",
      title: "Call Logged",
      message: `Call result "${record.outcome}" saved permanently.`,
    });
  };

  const markFollowUpCompleted = (id: string) => {
    const targetTask = followUps.find((fu) => fu.id === id);
    const updated = followUps.map((fu) => (fu.id === id ? { ...fu, status: "Completed" as const } : fu));
    setFollowUps(updated);

    let updatedLeads = leads;
    if (targetTask && targetTask.leadId) {
      updatedLeads = leads.map((l) =>
        l.id === targetTask.leadId
          ? {
              ...l,
              nextFollowUpDate: "",
              nextFollowUpTime: "",
              stage: l.stage === "Counselling Scheduled" ? "Interested" : l.stage,
            }
          : l
      );
      setLeads(updatedLeads);
    }

    persistLeads(updatedLeads, updated);
    showToast({
      type: "success",
      title: "Follow-up Marked Completed",
      message: "Task has been moved to completed follow-ups.",
    });
  };

  const completeLeadFollowUp = (leadId: string) => {
    const updatedLeads = leads.map((l) =>
      l.id === leadId
        ? {
            ...l,
            nextFollowUpDate: "",
            nextFollowUpTime: "",
            stage: l.stage === "Counselling Scheduled" ? "Interested" : l.stage,
          }
        : l
    );
    setLeads(updatedLeads);

    const updatedFu = followUps.map((fu) =>
      fu.leadId === leadId && fu.status !== "Completed"
        ? { ...fu, status: "Completed" as const }
        : fu
    );
    setFollowUps(updatedFu);

    persistLeads(updatedLeads, updatedFu);
    showToast({
      type: "success",
      title: "Follow-up Accepted & Completed",
      message: "Scheduled follow-up has been marked completed successfully.",
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
        answerCall,
        endCallSession,
        telephonyStatus,
        telephonyMode,
        setTelephonyMode,
        refreshTelephonyStatus,
        reconnectTelephony,
                addLead,
        updateLead,
        updateLeadStatus,
        assignCaller,
        addLeadNote,
        addCallRecord,
        markFollowUpCompleted,
        completeLeadFollowUp,
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
