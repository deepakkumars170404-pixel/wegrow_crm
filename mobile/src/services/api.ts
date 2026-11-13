import { CallRecord, Lead } from "../types";
import { StorageService } from "./storage";
import { supabaseMobile, isSupabaseReady } from "./supabase";

export const ApiService = {
  async getBaseUrl(): Promise<string> {
    const settings = await StorageService.getSettings();
    let url = settings.crmServerUrl.trim();
    if (url.endsWith("/")) url = url.slice(0, -1);
    return url;
  },

  async fetchTodayQueue(): Promise<{ success: boolean; leads: Lead[]; error?: string }> {
    // 1. First try Supabase Cloud (Works from ANYWHERE in the world on 4G/5G mobile data or any Wi-Fi!)
    if (isSupabaseReady() && supabaseMobile) {
      try {
        const { data: dbLeads, error } = await supabaseMobile
          .from("leads")
          .select("*, calls(*)")
          .order("created_at", { ascending: false });

        // Also fetch active follow-ups from Supabase follow_ups table
        let dbFollowUps: any[] = [];
        try {
          const { data: fuData } = await supabaseMobile
            .from("follow_ups")
            .select("*")
            .neq("status", "Completed");
          if (fuData) dbFollowUps = fuData;
        } catch {}

        if (!error && dbLeads && dbLeads.length > 0) {
          const leads: Lead[] = dbLeads.map((l: any) => {
            const clean = (l.phone || "").replace(/\D/g, "").slice(-10);
            const matchingFu = dbFollowUps.find(
              (fu: any) =>
                fu.lead_id === l.id ||
                (fu.phone && String(fu.phone).replace(/\D/g, "").endsWith(clean))
            );

            const fuDate = l.next_follow_up_date || (matchingFu ? matchingFu.scheduled_date || matchingFu.follow_up_date : "") || "";
            const fuTime = l.next_follow_up_time || (matchingFu ? matchingFu.scheduled_time || matchingFu.follow_up_time : "") || "";

            return {
              id: l.id,
              studentName: l.student_name,
              phone: l.phone,
              email: l.email || "",
              courseInterested: l.course_interested || "",
              leadSource: l.lead_source || "Phone",
              enquiryDate: l.enquiry_date || "",
              nextFollowUpDate: fuDate,
              nextFollowUpTime: fuTime,
              assignedCaller: l.assigned_caller || (matchingFu ? matchingFu.caller_name : "") || "",
              status: l.status || "Interested",
              priority: l.priority || "Warm",
              stage: l.stage || (fuDate ? "Call Scheduled" : "Interested"),
              callCount: l.call_count || (l.calls ? l.calls.length : 0),
              qualification: l.qualification || "",
              passedOutYear: l.passed_out_year || "",
              collegeName: l.college_name || "",
              notes: [],
            };
          });
        // Deduplicate leads by 10-digit phone number, keeping the freshest
        const seenPhones = new Set<string>();
        const dedupedLeads: Lead[] = [];
        for (const l of leads) {
          const cleanPhone = (l.phone || "").replace(/\D/g, "").slice(-10);
          const key = cleanPhone || l.id;
          if (!seenPhones.has(key)) {
            seenPhones.add(key);
            dedupedLeads.push(l);
          }
        }

        await StorageService.saveCachedLeads(dedupedLeads);
        return { success: true, leads: dedupedLeads };
        }
      } catch (sbErr) {
        console.warn("Supabase fetch queue error:", sbErr);
      }
    }

    // 2. Try Local CRM Server Wi-Fi (if reachable on same network)
    try {
      const baseUrl = await this.getBaseUrl();
      const res = await fetch(`${baseUrl}/api/leads`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
        const rawLeads: any[] = Array.isArray(data) ? data : data.leads || [];
        const rawFu: any[] = Array.isArray(data.followUps) ? data.followUps : [];

        const seenPhones = new Set<string>();
        const dedupedLeads: Lead[] = [];
        for (const l of rawLeads) {
          const cleanPhone = (l.phone || "").replace(/\D/g, "").slice(-10);
          const matchingFu = rawFu.find(
            (fu: any) =>
              fu.leadId === l.id ||
              (fu.phone && String(fu.phone).replace(/\D/g, "").endsWith(cleanPhone))
          );

          const fuDate = l.nextFollowUpDate || (matchingFu ? matchingFu.followUpDate || matchingFu.scheduled_date : "") || "";
          const fuTime = l.nextFollowUpTime || (matchingFu ? matchingFu.followUpTime || matchingFu.scheduled_time : "") || "";

          const formattedLead: Lead = {
            ...l,
            nextFollowUpDate: fuDate,
            nextFollowUpTime: fuTime,
            stage: l.stage || (fuDate ? "Call Scheduled" : "Interested"),
          };

          const key = cleanPhone || l.id;
          if (!seenPhones.has(key)) {
            seenPhones.add(key);
            dedupedLeads.push(formattedLead);
          }
        }
        if (dedupedLeads.length > 0) {
          await StorageService.saveCachedLeads(dedupedLeads);
        }
        return { success: true, leads: dedupedLeads };
      }
    } catch {}

    // 3. Fallback to offline cached leads on phone storage
    const cached = await StorageService.getCachedLeads();
    return {
      success: false,
      leads: cached,
      error: "Loaded offline cache.",
    };
  },

  async fetchAllCalls(): Promise<{ success: boolean; calls: CallRecord[]; error?: string }> {
    const collectedCalls: CallRecord[] = [];
    const seenCallKeys = new Set<string>();

    const addUniqueCall = (c: CallRecord) => {
      const cleanPhone = (c.phone || c.studentPhone || "").replace(/\D/g, "").slice(-10);
      const key = c.id || `${cleanPhone}_${c.callDate || ""}_${c.callTime || ""}_${c.duration || c.formattedDuration || ""}`;
      if (!seenCallKeys.has(key)) {
        seenCallKeys.add(key);
        collectedCalls.push(c);
      }
    };

    // 1. First fetch directly from Supabase Cloud `calls` table
    if (isSupabaseReady() && supabaseMobile) {
      try {
        const { data: dbCalls, error: cErr } = await supabaseMobile
          .from("calls")
          .select("*")
          .order("created_at", { ascending: false });

        if (!cErr && dbCalls && dbCalls.length > 0) {
          dbCalls.forEach((c: any) => {
            const rawDur = c.duration_seconds ?? c.durationSeconds;
            const parsedDur = typeof rawDur === "number" ? rawDur : (typeof c.duration === "string" && c.duration.includes(":") ? c.duration.split(":").reduce((acc: number, time: string) => (60 * acc) + +time, 0) : 0);
            const formatted = c.duration || `${Math.floor(parsedDur / 60).toString().padStart(2, "0")}:${(parsedDur % 60).toString().padStart(2, "0")}`;
            const timeVal = c.call_time || c.from_time || "";
            const dateVal = c.call_date || "";

            addUniqueCall({
              id: c.id || `cr-${Date.now()}-${Math.random()}`,
              leadId: c.lead_id || "",
              studentName: c.student_name || "Student Inquiry",
              phone: c.phone || "",
              studentPhone: c.phone || "",
              callerName: c.caller_name || "Staff",
              disposition: c.mindset || c.outcome || "Interested",
              outcome: c.outcome || (parsedDur > 0 ? "Attended Call" : "Not Attended Call"),
              mindset: c.mindset || c.outcome || "",
              durationSeconds: parsedDur,
              duration_seconds: parsedDur,
              formattedDuration: formatted,
              duration: formatted,
              durationFormatted: c.duration_formatted || `${parsedDur} seconds`,
              qualification: c.qualification || "",
              passedOutYear: c.passed_out_year || "",
              collegeName: c.college_name || "",
              courseInterested: c.course_interested || "",
              studentCourse: c.course_interested || "",
              callStartTime: c.from_time || timeVal,
              callEndTime: c.end_time || timeVal,
              callDate: dateVal,
              callTime: timeVal,
              fromTime: c.from_time || timeVal,
              endTime: c.end_time || timeVal,
              notes: c.remarks || "",
              remarks: c.remarks || "",
              timestamp: c.created_at ? new Date(c.created_at).getTime() : Date.now(),
              syncedToCrm: true,
            });
          });
        }
      } catch (sbCallsErr) {
        console.warn("Supabase fetch calls error:", sbCallsErr);
      }

      // Also fetch leads with calls to catch any calls embedded in lead call history
      try {
        const { data: dbLeads, error: lErr } = await supabaseMobile
          .from("leads")
          .select("*, calls(*)")
          .order("created_at", { ascending: false });

        if (!lErr && dbLeads && dbLeads.length > 0) {
          dbLeads.forEach((lead: any) => {
            if (Array.isArray(lead.calls)) {
              lead.calls.forEach((c: any) => {
                const rawDur = c.duration_seconds ?? c.durationSeconds;
                const parsedDur = typeof rawDur === "number" ? rawDur : 0;
                const formatted = c.duration || "00:00";
                addUniqueCall({
                  id: c.id,
                  leadId: lead.id,
                  studentName: c.student_name || lead.student_name || "Student",
                  phone: c.phone || lead.phone || "",
                  studentPhone: lead.phone || c.phone || "",
                  callerName: c.caller_name || lead.assigned_caller || "Staff",
                  disposition: c.mindset || c.outcome || "Interested",
                  outcome: c.outcome || (parsedDur > 0 ? "Attended Call" : "Not Attended Call"),
                  mindset: c.mindset || c.outcome || "",
                  durationSeconds: parsedDur,
                  duration_seconds: parsedDur,
                  formattedDuration: formatted,
                  duration: formatted,
                  qualification: c.qualification || lead.qualification || "",
                  passedOutYear: c.passed_out_year || lead.passed_out_year || "",
                  collegeName: c.college_name || lead.college_name || "",
                  courseInterested: c.course_interested || lead.course_interested || "",
                  studentCourse: lead.course_interested || "",
                  callDate: c.call_date || "",
                  callTime: c.call_time || "",
                  fromTime: c.from_time || "",
                  endTime: c.end_time || "",
                  notes: c.remarks || "",
                  remarks: c.remarks || "",
                  timestamp: c.created_at ? new Date(c.created_at).getTime() : Date.now(),
                  syncedToCrm: true,
                });
              });
            }
          });
        }
      } catch (sbLeadsErr) {
        console.warn("Supabase fetch leads calls error:", sbLeadsErr);
      }
    }

    // 2. Fallback / Merge with CRM Server API (/api/leads)
    try {
      const baseUrl = await this.getBaseUrl();
      if (baseUrl && baseUrl.startsWith("http")) {
        const res = await fetch(`${baseUrl}/api/leads`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          const data = await res.json();
          const rawLeads = Array.isArray(data) ? data : data.leads || [];
          rawLeads.forEach((lead: any) => {
            if (Array.isArray(lead.callHistory)) {
              lead.callHistory.forEach((c: any) => {
                const rawDur = String(c.duration || "").replace(/[^\d:]/g, "");
                let durSec = 0;
                if (rawDur.includes(":")) {
                  const parts = rawDur.split(":").map(Number);
                  durSec = (parts[0] || 0) * 60 + (parts[1] || 0);
                } else {
                  durSec = parseInt(rawDur, 10) || 0;
                }
                addUniqueCall({
                  id: c.id || `cr-${Date.now()}-${Math.random()}`,
                  leadId: lead.id,
                  studentName: c.studentName || lead.studentName || "Student",
                  phone: lead.phone || c.studentPhone || "",
                  studentPhone: lead.phone || "",
                  callerName: c.callerName || lead.assignedCaller || "Staff",
                  disposition: c.mindset || c.outcome || "Interested",
                  outcome: c.outcome || (durSec > 0 ? "Attended Call" : "Not Attended Call"),
                  mindset: c.mindset || c.outcome || "",
                  durationSeconds: durSec,
                  duration_seconds: durSec,
                  formattedDuration: c.duration || "00:00",
                  duration: c.duration || "00:00",
                  qualification: c.qualification || lead.qualification || "",
                  passedOutYear: c.passedOutYear || lead.passedOutYear || "",
                  collegeName: c.collegeName || lead.collegeName || "",
                  courseInterested: c.courseInterested || lead.courseInterested || "",
                  studentCourse: lead.courseInterested || "",
                  callDate: c.callDate || "",
                  callTime: c.callTime || "",
                  fromTime: c.fromTime || "",
                  endTime: c.endTime || "",
                  notes: c.remarks || "",
                  remarks: c.remarks || "",
                  timestamp: c.id && c.id.replace(/\D/g, "") ? parseInt(c.id.replace(/\D/g, ""), 10) : Date.now(),
                  syncedToCrm: true,
                });
              });
            }
          });
        }
      }
    } catch {}

    // 3. Merge with local offline calls so unsynced calls also show up immediately
    try {
      const localCalls = await StorageService.getCallHistory();
      localCalls.forEach((local) => {
        addUniqueCall(local);
      });
    } catch {}

    // Sort calls newest first
    collectedCalls.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    if (collectedCalls.length > 0) {
      await StorageService.saveCallHistory(collectedCalls);
      return { success: true, calls: collectedCalls };
    }

    // 4. Final offline fallback to cached local calls
    const cachedHistory = await StorageService.getCallHistory();
    return { success: false, calls: cachedHistory, error: "Offline mode. Showing saved calls." };
  },

  async fetchCallStatus(): Promise<{ success: boolean; data?: any }> {
    try {
      const baseUrl = await this.getBaseUrl();
      const res = await fetch(`${baseUrl}/api/mobile/status`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
      return { success: false };
    } catch {
      return { success: false };
    }
  },

  async logCallOutcome(record: CallRecord): Promise<{ success: boolean; error?: string }> {
    let cloudSynced = false;

    // Ensure a safe, valid lead ID exists
    const safeLeadId = record.leadId || `LD-MOB-${Date.now()}`;
    record.leadId = safeLeadId;

    const mappedStatus =
      record.disposition === "Not Interested"
        ? "Lost"
        : record.disposition === "Visit to Institute"
        ? "Counselling Scheduled"
        : record.disposition === "Joined"
        ? "Admitted"
        : record.disposition;

    const dateStr = new Date().toISOString().split("T")[0];
    const timeStr =
      record.callStartTime ||
      new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    // 1. DIRECT SYNC TO SUPABASE CLOUD (Zero dependency on same Wi-Fi!)
    // Works wherever phone is connected: Jio/Airtel 4G/5G, Hotspot, or any Wi-Fi!
    if (isSupabaseReady() && supabaseMobile) {
      try {
        // STEP 1: UPSERT LEAD FIRST (CRITICAL: Satisfies foreign key constraint in calls table!)
        const { error: lErr } = await supabaseMobile.from("leads").upsert(
          {
            id: safeLeadId,
            student_name: record.studentName,
            phone: record.phone,
            course_interested: record.courseInterested || null,
            status: mappedStatus,
            stage: mappedStatus,
            assigned_caller: record.callerName,
            last_call_date: dateStr,
            last_call_outcome: record.disposition,
            qualification: record.qualification || null,
            passed_out_year: record.passedOutYear || null,
            college_name: record.collegeName || null,
            next_follow_up_date: record.nextFollowUpDate || null,
            next_follow_up_time: record.nextFollowUpTime || null,
          },
          { onConflict: "id" }
        );

        if (lErr) {
          console.warn("Mobile Supabase lead upsert error:", lErr);
        }

        // STEP 2: UPSERT CALL SECOND (with valid lead_id)
        const callId = record.id || `cr-mob-${Date.now()}`;
        const { error: cErr } = await supabaseMobile.from("calls").upsert(
          {
            id: callId,
            lead_id: safeLeadId,
            student_name: record.studentName,
            phone: record.phone,
            caller_name: record.callerName,
            call_date: dateStr,
            call_time: timeStr,
            duration: record.formattedDuration,
            duration_formatted: `${record.durationSeconds} seconds`,
            duration_seconds: record.durationSeconds,
            from_time: record.callStartTime || timeStr,
            end_time: record.callEndTime || timeStr,
            outcome: record.durationSeconds > 0 ? "Attended Call" : "Not Attended Call",
            mindset: record.disposition,
            course_interested: record.courseInterested || null,
            qualification: record.qualification || null,
            passed_out_year: record.passedOutYear || null,
            college_name: record.collegeName || null,
            remarks: record.notes || null,
          },
          { onConflict: "id" }
        );

        if (cErr) {
          console.warn("Mobile Supabase call upsert error:", cErr);
        }

        // STEP 3: UPSERT FOLLOW-UP TASK IF SCHEDULED
        if (record.nextFollowUpDate) {
          await supabaseMobile.from("follow_ups").upsert(
            {
              id: `fu-${safeLeadId}-${Date.now()}`,
              lead_id: safeLeadId,
              student_name: record.studentName,
              phone: record.phone,
              caller_name: record.callerName,
              course: record.courseInterested || null,
              scheduled_date: record.nextFollowUpDate,
              scheduled_time: record.nextFollowUpTime || "10:30 AM",
              status: "Pending",
              remarks: record.notes || null,
            },
            { onConflict: "id" }
          );
        }

        if (!cErr && !lErr) {
          cloudSynced = true;
        }
      } catch (sbErr) {
        console.warn("Mobile Supabase direct sync error:", sbErr);
      }
    }

    // 2. Also try CRM Server API (Vercel or local Wi-Fi) with timeout
    try {
      const baseUrl = await this.getBaseUrl();
      if (baseUrl && baseUrl.startsWith("http")) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(`${baseUrl}/api/calls/log`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            leadId: safeLeadId,
            studentName: record.studentName,
            phone: record.phone,
            callerName: record.callerName,
            disposition: record.disposition,
            durationSeconds: record.durationSeconds,
            courseInterested: record.courseInterested,
            callStartTime: record.callStartTime,
            callEndTime: record.callEndTime,
            qualification: record.qualification,
            passedOutYear: record.passedOutYear,
            collegeName: record.collegeName,
            notes: record.notes,
            nextFollowUpDate: record.nextFollowUpDate,
            nextFollowUpTime: record.nextFollowUpTime,
            channel: "Mobile SIM Dialer",
          }),
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          cloudSynced = true;
        }
      }
    } catch {}

    record.syncedToCrm = cloudSynced;
    await StorageService.addCallRecord(record);

    if (cloudSynced) {
      return { success: true };
    } else {
      // Offline fallback: save into pending queue
      await StorageService.addPendingCall(record);
      return { success: false, error: "Saved locally. Will sync when online." };
    }
  },

  async syncPendingCalls(): Promise<{ syncedCount: number }> {
    const pending = await StorageService.getPendingCalls();
    if (pending.length === 0) return { syncedCount: 0 };

    let successCount = 0;
    const remaining: CallRecord[] = [];

    for (const record of pending) {
      const res = await this.logCallOutcome(record);
      if (res.success) {
        successCount++;
      } else {
        remaining.push(record);
      }
    }

    if (remaining.length === 0) {
      await StorageService.clearPendingCalls();
    } else {
      await StorageService.savePendingCalls(remaining);
    }
    return { syncedCount: successCount };
  },
};
