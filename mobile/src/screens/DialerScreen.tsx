import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
} from "react-native";
import { Phone, Delete, X, GraduationCap } from "lucide-react-native";
import { THEME } from "../constants/theme";
import { TelephonyService } from "../services/telephony";
import { StorageService } from "../services/storage";
import { ApiService } from "../services/api";
import { LiveClock } from "../components/LiveClock";
import { Lead } from "../types";

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["*", "0", "#"],
];

export const DialerScreen: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [currentStaff, setCurrentStaff] = useState<string>("Muthumeena");

  // Load registered leads from cache & CRM server and saved staff
  useEffect(() => {
    StorageService.getSettings().then((s) => {
      if (s.callerName) setCurrentStaff(s.callerName);
    });
    StorageService.getCachedLeads().then((cached) => {
      if (cached && cached.length > 0) setLeads(cached);
    });
    ApiService.fetchTodayQueue().then((res) => {
      if (res.leads && res.leads.length > 0) setLeads(res.leads);
    });
  }, []);

  // Match dialed phone number against known CRM students
  const cleanNumber = TelephonyService.formatIndianPhoneNumber(phoneNumber);
  const clean10 = cleanNumber.slice(-10);

  const recognizedLead = useMemo(() => {
    if (clean10.length < 7) return null;
    return (
      leads.find((l) => {
        const lClean = TelephonyService.formatIndianPhoneNumber(l.phone);
        return lClean && (lClean.endsWith(clean10) || clean10.endsWith(lClean.slice(-10)));
      }) || null
    );
  }, [clean10, leads]);

  const handleKeyPress = (key: string) => {
    if (phoneNumber.length < 15) {
      setPhoneNumber((prev) => prev + key);
    }
  };

  const handleBackspace = () => {
    setPhoneNumber((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPhoneNumber("");
  };

  const handleCall = async () => {
    if (!phoneNumber) {
      Alert.alert("Empty Number", "Please enter a phone number to dial.");
      return;
    }

    // STRICT SAFETY GUARD
    if (TelephonyService.isBlockedNumber(phoneNumber)) {
      Alert.alert(
        "Call Blocked",
        "Calling 9952337331 is strictly and permanently blocked."
      );
      return;
    }

    const clean = TelephonyService.formatIndianPhoneNumber(phoneNumber);
    if (clean.length < 7) {
      Alert.alert("Invalid Number", "Phone number must have at least 7 to 10 digits.");
      return;
    }

    await TelephonyService.dialViaSIM(clean, recognizedLead?.studentName);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={styles.headerTitle}>Direct Dialpad</Text>
          <View style={styles.liveClockBadge}>
            <LiveClock style={styles.liveClockText} prefix="🕒 " />
          </View>
        </View>
        <Text style={styles.headerSubtitle}>SIM Card Voice Dialer • Wegrow Skill Campus</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* LCD Number Screen */}
        <View style={styles.screenContainer}>
          <Text style={styles.screenText}>
            {phoneNumber || "Enter Phone Number"}
          </Text>
          {phoneNumber.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearBadge}>
              <X size={12} color="#64748B" strokeWidth={2.5} style={{ marginRight: 3 }} />
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Instant Recognized Student Banner if number already known in CRM */}
        {recognizedLead && (
          <TouchableOpacity
            style={styles.recognizedLeadCard}
            onPress={handleCall}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 8 }}>
                <GraduationCap size={15} color="#2563EB" style={{ marginRight: 6 }} />
                <Text style={styles.recognizedTitle} numberOfLines={1}>
                  {recognizedLead.studentName}
                </Text>
              </View>
              <View style={styles.recognizedTag}>
                <Phone size={10} color="#2563EB" style={{ marginRight: 4 }} />
                <Text style={styles.recognizedTagText}>Tap to Call</Text>
              </View>
            </View>
            <Text style={styles.recognizedSubtitle} numberOfLines={1}>
              {recognizedLead.courseInterested || "General Enquiry"} {recognizedLead.qualification ? `• ${recognizedLead.qualification}` : ""}
            </Text>
          </TouchableOpacity>
        )}

        {/* Dialpad Matrix */}
        <View style={styles.keypadContainer}>
          {KEYS.map((row, rIdx) => (
            <View key={rIdx} style={styles.row}>
              {row.map((k) => (
                <TouchableOpacity
                  key={k}
                  style={styles.key}
                  onPress={() => handleKeyPress(k)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.keyText}>{k}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}

          {/* Bottom Control Row: Clear / Backspace / Call */}
          <View style={styles.bottomControlRow}>
            <TouchableOpacity
              style={styles.backspaceButton}
              onPress={handleBackspace}
              onLongPress={() => setPhoneNumber("")}
              delayLongPress={350}
              activeOpacity={0.7}
            >
              <Delete size={22} color="#475569" strokeWidth={2} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dialButton}
              onPress={handleCall}
              activeOpacity={0.8}
            >
              <Phone size={18} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 8 }} />
              <Text style={styles.dialButtonText}>Call SIM</Text>
            </TouchableOpacity>

            <View style={{ width: 54 }} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollContent: {
    paddingBottom: 24,
    flexGrow: 1,
    justifyContent: "space-between",
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: THEME.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
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
  liveClockBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  liveClockText: {
    color: "#1D4ED8",
    fontSize: 11,
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  screenContainer: {
    backgroundColor: THEME.colors.card,
    marginHorizontal: 20,
    marginTop: 6,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  recognizedLeadCard: {
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 2,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  recognizedTitle: {
    color: "#1E3A8A",
    fontSize: 13,
    fontWeight: "bold",
  },
  recognizedTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(37, 99, 235, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  recognizedTagText: {
    color: "#2563EB",
    fontSize: 10,
    fontWeight: "bold",
  },
  recognizedSubtitle: {
    color: "#475569",
    fontSize: 11,
    marginTop: 1,
  },
  screenText: {
    color: THEME.colors.textPrimary,
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: 2,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  clearBadge: {
    position: "absolute",
    right: 12,
    top: 10,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
  },
  clearText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  keypadContainer: {
    marginTop: 4,
    paddingHorizontal: 28,
    gap: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  key: {
    width: 64,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  keyText: {
    color: THEME.colors.textPrimary,
    fontSize: 24,
    fontWeight: "bold",
  },
  bottomControlRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    paddingHorizontal: 4,
  },
  backspaceButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dialButton: {
    backgroundColor: THEME.colors.emerald,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 27,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: THEME.colors.emerald,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  dialButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  inAppCallOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(10, 17, 40, 0.98)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1.5,
    borderColor: THEME.colors.gold,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 30,
    zIndex: 999,
  },
  inAppCallCard: {
    gap: 8,
  },
  inAppCallHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inAppCallLiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#10B981",
    gap: 6,
  },
  inAppCallRingingBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    borderColor: "#F59E0B",
  },
  inAppCallLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  inAppCallRingingDot: {
    backgroundColor: "#F59E0B",
  },
  inAppCallLiveText: {
    color: "#10B981",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  inAppCallRingingText: {
    color: "#F59E0B",
  },
  inAppCallTimer: {
    color: THEME.colors.gold,
    fontSize: 17,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontWeight: "bold",
  },
  inAppCallTimerRinging: {
    color: "#F59E0B",
  },
  inAppCallName: {
    color: THEME.colors.textPrimary,
    fontSize: 18,
    fontWeight: "bold",
  },
  inAppCallPhone: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  inAppCallCourse: {
    color: THEME.colors.textMuted,
    fontSize: 12,
  },
  inAppCallHint: {
    color: THEME.colors.gold,
    fontSize: 11,
    fontStyle: "italic",
    marginTop: 2,
  },
  inAppCallActions: {
    marginTop: 10,
  },
  inAppHangupBtn: {
    backgroundColor: THEME.colors.danger,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: THEME.colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  inAppHangupText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
});
