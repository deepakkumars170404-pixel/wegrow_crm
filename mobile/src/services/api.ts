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

        if (!error && dbLeads && dbLeads.length > 0) {
          const leads: Lead[] = dbLeads.map((l: any) => ({
            id: l.id,
            studentName: l.student_name,
            phone: l.phone,
            email: l.email || "",
            courseInterested: l.course_interested || "",
            leadSource: l.lead_source || "Phone",
            enquiryDate: l.enquiry_date || "",
            nextFollowUpDate: l.next_follow_up_date || "",
            nextFollowUpTime: l.next_follow_up_time || "",
            assignedCaller: l.assigned_caller || "",
            status: l.status || "Interested",
            priority: l.priority || "Warm",
            stage: l.stage || "Interested",
            callCount: l.call_count || (l.calls ? l.calls.length : 0),
            qualification: l.qualification || "",
            passedOutYear: l.passed_out_year || "",
            collegeName: l.college_name || "",
            notes: [],
          }));
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
        const rawLeads: Lead[] = Array.isArray(data) ? data : data.leads || [];
        const seenPhones = new Set<string>();
        const dedupedLeads: Lead[] = [];
        for (const l of rawLeads) {
          const cleanPhone = (l.phone || "").replace(/\D/g, "").slice(-10);
          const key = cleanPhone || l.id;
          if (!seenPhones.has(key)) {
            seenPhones.add(key);
            dedupedLeads.push(l);
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
