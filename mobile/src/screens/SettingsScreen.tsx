import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Globe, User, ShieldAlert, Smartphone, RefreshCw, Zap, Check, CheckCircle2 } from "lucide-react-native";
import { THEME } from "../constants/theme";
import { StorageService } from "../services/storage";
import { ApiService } from "../services/api";
import { TelephonyService } from "../services/telephony";
import { AppSettings, WEGROW_STAFF_MEMBERS } from "../types";

export const SettingsScreen: React.FC = () => {
  const [serverUrl, setServerUrl] = useState("http://192.168.29.60:3000");
  const [callerName, setCallerName] = useState("Muthumeena");
  const [testing, setTesting] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isDefaultDialer, setIsDefaultDialer] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await StorageService.getSettings();
      setServerUrl(s.crmServerUrl);
      setCallerName(s.callerName);
      const pending = await StorageService.getPendingCalls();
      setPendingCount(pending.length);
      const isDef = await TelephonyService.checkIsDefaultDialer();
      setIsDefaultDialer(isDef);
    })();
  }, []);

  const handleSetDefaultDialer = async () => {
    const isAlready = await TelephonyService.checkIsDefaultDialer();
    if (isAlready) {
      Alert.alert(
        "Already Default",
        "Wegrow Telecaller is already your phone's default phone app! All calls stay inside Wegrow Telecaller."
      );
      setIsDefaultDialer(true);
      return;
    }
    await TelephonyService.promptSetAsDefaultDialer();
    setTimeout(async () => {
      const check = await TelephonyService.checkIsDefaultDialer();
      setIsDefaultDialer(check);
    }, 1500);
  };

  const handleSave = async () => {
    const updated: AppSettings = {
      crmServerUrl: serverUrl.trim(),
      callerName: callerName.trim(),
      autoPopupDisposition: true,
      strictSafetyBlock: true,
      vibrateOnCall: true,
    };
    await StorageService.saveSettings(updated);
    Alert.alert("Saved", "Settings saved successfully!");
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      let url = serverUrl.trim();
      if (url.endsWith("/")) url = url.slice(0, -1);
      const res = await fetch(`${url}/api/microsip/status`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        Alert.alert(
          "Connection Successful! ✓",
          `Connected to Wegrow CRM Server.\nWiFi: ${data.wifiSSID || "Connected"}\nServer IP: ${data.localIp || "OK"}`
        );
      } else {
        Alert.alert("Server Reachable", `Server responded with HTTP ${res.status}`);
      }
    } catch (err: any) {
      Alert.alert(
        "Connection Failed",
        `Could not reach ${serverUrl}.\nEnsure phone is on same Wi-Fi or check IP address.\n\nError: ${err.message}`
      );
    } finally {
      setTesting(false);
    }
  };

  const handleSyncPending = async () => {
    const res = await ApiService.syncPendingCalls();
    const pending = await StorageService.getPendingCalls();
    setPendingCount(pending.length);
    Alert.alert("Sync Result", `Synced ${res.syncedCount} records. Remaining pending: ${pending.length}`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>App Settings</Text>
        <Text style={styles.headerSubtitle}>Wegrow CRM Connection & Caller Profile</Text>
      </View>

      {/* CRM Server URL */}
      <View style={styles.card}>
        <Text style={styles.label}>WEGROW CRM SERVER URL</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. http://192.168.29.60:3000"
          placeholderTextColor={THEME.colors.textMuted}
          value={serverUrl}
          onChangeText={setServerUrl}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.helpText}>
          Enter your computer's local IP address or production CRM domain.
        </Text>

        <TouchableOpacity
          style={styles.testBtn}
          onPress={handleTestConnection}
          disabled={testing}
        >
          {testing ? (
            <ActivityIndicator color="#1D4ED8" />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Zap size={15} color="#1D4ED8" />
              <Text style={styles.testBtnText}>Test Connection to CRM</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Telecaller Identity */}
      <View style={styles.card}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <User size={15} color="#2563EB" />
          <Text style={styles.label}>TELECALLER NAME (SELECT OR TYPE)</Text>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {WEGROW_STAFF_MEMBERS.map((staff) => {
            const isSel = callerName === staff;
            return (
              <TouchableOpacity
                key={staff}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  backgroundColor: isSel ? "#2563EB" : "#F1F5F9",
                  borderWidth: 1.5,
                  borderColor: isSel ? "#1D4ED8" : "#CBD5E1",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  shadowColor: isSel ? "#2563EB" : "transparent",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isSel ? 0.25 : 0,
                  shadowRadius: 4,
                  elevation: isSel ? 3 : 0,
                }}
                onPress={() => setCallerName(staff)}
                activeOpacity={0.7}
              >
                {isSel && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: isSel ? "800" : "700",
                    color: isSel ? "#FFFFFF" : "#0F172A",
                  }}
                >
                  {staff === "Muthumeena" ? "👑 Muthumeena (Head)" : staff}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TextInput
          style={styles.input}
          placeholder="e.g. Muthumeena"
          placeholderTextColor={THEME.colors.textMuted}
          value={callerName}
          onChangeText={setCallerName}
        />
        <Text style={styles.helpText}>
          This staff name will be automatically tagged on all call logs and follow-up activities in Supabase CRM.
        </Text>
      </View>

      {/* Safety Guard Status */}
      <View style={styles.card}>
        <View style={styles.guardHeader}>
          <Text style={styles.label}>STRICT SAFETY GUARD</Text>
          <View style={styles.lockedBadge}>
            <Text style={styles.lockedText}>LOCKED ON</Text>
          </View>
        </View>
        <Text style={styles.guardDesc}>
          • Number <Text style={styles.boldRed}>9952337331</Text> is strictly and permanently blocked from being dialed or messaged on this device.
        </Text>
      </View>

      {/* Default Dialer Section */}
      <View style={styles.card}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <Text style={styles.label}>DEFAULT PHONE APP (BYPASS GOOGLE DIALER)</Text>
          {isDefaultDialer && (
            <View style={{ backgroundColor: "rgba(16, 185, 129, 0.2)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, borderWidth: 1, borderColor: "#10B981" }}>
              <Text style={{ color: "#10B981", fontSize: 10, fontWeight: "bold" }}>ACTIVE DEFAULT</Text>
            </View>
          )}
        </View>
        <Text style={styles.helpText}>
          {isDefaultDialer
            ? "✅ Wegrow Telecaller is currently the Default Phone App on this device! Calls will stay strictly inside Wegrow Telecaller without Google Dialer opening."
            : "Set Wegrow Telecaller as your phone's default Phone App so all SIM calls stay inside Wegrow Telecaller without Google Dialer ever opening."}
        </Text>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: isDefaultDialer ? THEME.colors.emerald : THEME.colors.gold, marginTop: 12 }]}
          onPress={handleSetDefaultDialer}
        >
          <Text style={styles.saveBtnText}>
            {isDefaultDialer ? "✅ Default Phone App Active" : "📱 Set Wegrow Telecaller as Default Phone App"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Offline Sync Status */}
      <View style={styles.card}>
        <Text style={styles.label}>OFFLINE QUEUE & SYNC</Text>
        <View style={styles.syncRow}>
          <Text style={styles.syncCountText}>
            {pendingCount} offline calls waiting to sync
          </Text>
          <TouchableOpacity
            style={[styles.syncNowBtn, pendingCount === 0 && styles.syncNowDisabled]}
            onPress={handleSyncPending}
            disabled={pendingCount === 0}
          >
            <Text style={styles.syncNowText}>Sync Now</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <CheckCircle2 size={18} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.saveBtnText}>Save Settings</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    paddingTop: 14,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: THEME.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    marginBottom: 16,
  },
  headerTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 22,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  label: {
    color: "#2563EB",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F8FAFC",
    color: THEME.colors.textPrimary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  helpText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    marginTop: 6,
  },
  testBtn: {
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  testBtnText: {
    color: "#1D4ED8",
    fontSize: 13,
    fontWeight: "bold",
  },
  guardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lockedBadge: {
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.emerald,
  },
  lockedText: {
    color: THEME.colors.emerald,
    fontSize: 10,
    fontWeight: "bold",
  },
  guardDesc: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  boldRed: {
    color: THEME.colors.danger,
    fontWeight: "bold",
  },
  syncRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  syncCountText: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
  },
  syncNowBtn: {
    backgroundColor: THEME.colors.emerald,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  syncNowDisabled: {
    opacity: 0.4,
  },
  syncNowText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  saveBtn: {
    backgroundColor: "#2563EB",
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
});
