import { CallRecord, Lead } from "../types";
import { StorageService } from "./storage";

export const ApiService = {
  async getBaseUrl(): Promise<string> {
    const settings = await StorageService.getSettings();
    let url = settings.crmServerUrl.trim();
    if (url.endsWith("/")) url = url.slice(0, -1);
    return url;
  },

  async fetchTodayQueue(): Promise<{ success: boolean; leads: Lead[]; error?: string }> {
    try {
      const baseUrl = await this.getBaseUrl();
      const res = await fetch(`${baseUrl}/api/leads`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      const leads: Lead[] = Array.isArray(data) ? data : data.leads || [];

      // Cache locally for offline resilience
      if (leads.length > 0) {
        await StorageService.saveCachedLeads(leads);
      }
      return { success: true, leads };
    } catch (err: any) {
      // Fallback to offline cached leads
      const cached = await StorageService.getCachedLeads();
      return {
        success: false,
        leads: cached,
        error: err.message || "Failed to reach CRM server. Loaded offline cache.",
      };
    }
  },

  async logCallOutcome(record: CallRecord): Promise<{ success: boolean; error?: string }> {
    try {
      const baseUrl = await this.getBaseUrl();
      const res = await fetch(`${baseUrl}/api/calls/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: record.leadId,
          studentName: record.studentName,
          phone: record.phone,
          callerName: record.callerName,
          disposition: record.disposition,
          durationSeconds: record.durationSeconds,
          notes: record.notes,
          nextFollowUpDate: record.nextFollowUpDate,
          nextFollowUpTime: record.nextFollowUpTime,
          channel: "Mobile SIM Dialer",
        }),
      });

      if (res.ok) {
        record.syncedToCrm = true;
        await StorageService.addCallRecord(record);
        return { success: true };
      } else {
        throw new Error(`CRM API HTTP ${res.status}`);
      }
    } catch (err: any) {
      // Offline fallback: save into pending queue
      record.syncedToCrm = false;
      await StorageService.addPendingCall(record);
      await StorageService.addCallRecord(record);
      return { success: false, error: "Saved locally. Will sync when server is reachable." };
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
    }
    return { syncedCount: successCount };
  },
};
