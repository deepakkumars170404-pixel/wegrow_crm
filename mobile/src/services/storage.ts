import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppSettings, CallRecord, Lead } from "../types";

const KEYS = {
  SETTINGS: "@wegrow_settings",
  LEADS_CACHE: "@wegrow_leads_cache",
  PENDING_CALLS: "@wegrow_pending_calls",
  CALL_HISTORY: "@wegrow_call_history",
};

export const DEFAULT_SETTINGS: AppSettings = {
  crmServerUrl: "http://192.168.29.60:3000",
  callerName: "MuthuSelvi",
  autoPopupDisposition: true,
  strictSafetyBlock: true,
  vibrateOnCall: true,
};

export const StorageService = {
  async getSettings(): Promise<AppSettings> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SETTINGS);
      if (data) return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {}
    return DEFAULT_SETTINGS;
  },

  async saveSettings(settings: Partial<AppSettings>): Promise<void> {
    const current = await StorageService.getSettings();
    const merged = { ...current, ...settings };
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(merged));
  },

  async getCachedLeads(): Promise<Lead[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.LEADS_CACHE);
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  },

  async saveCachedLeads(leads: Lead[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.LEADS_CACHE, JSON.stringify(leads));
  },

  async getCallHistory(): Promise<CallRecord[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.CALL_HISTORY);
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  },

  async addCallRecord(record: CallRecord): Promise<void> {
    const list = await this.getCallHistory();
    const updated = [record, ...list.slice(0, 99)];
    await AsyncStorage.setItem(KEYS.CALL_HISTORY, JSON.stringify(updated));
  },

  async getPendingCalls(): Promise<CallRecord[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.PENDING_CALLS);
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  },

  async addPendingCall(record: CallRecord): Promise<void> {
    const list = await this.getPendingCalls();
    await AsyncStorage.setItem(KEYS.PENDING_CALLS, JSON.stringify([...list, record]));
  },

  async clearPendingCalls(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.PENDING_CALLS);
  },

  async savePendingCalls(records: CallRecord[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.PENDING_CALLS, JSON.stringify(records));
  },
};
