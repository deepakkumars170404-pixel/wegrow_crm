import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
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

      {/* LCD Number Screen */}
      <View style={styles.screenContainer}>
        <Text style={styles.screenText}>
          {phoneNumber || "Enter Phone Number"}
        </Text>
        {phoneNumber.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearBadge}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Instant Recognized Student Banner if number already known in CRM */}
      {recognizedLead && (
        <View style={styles.recognizedLeadCard}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={styles.recognizedTitle}>
              🎓 <Text style={{ color: THEME.colors.gold, fontWeight: "bold" }}>{recognizedLead.studentName}</Text>
            </Text>
            <View style={styles.recognizedTag}>
              <Text style={styles.recognizedTagText}>Registered Student</Text>
            </View>
          </View>
          <Text style={styles.recognizedSubtitle} numberOfLines={1}>
            {recognizedLead.courseInterested || "General Enquiry"} {recognizedLead.qualification ? `• ${recognizedLead.qualification}` : ""}
          </Text>
        </View>
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
            <Text style={styles.backspaceText}>⌫</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dialButton}
            onPress={handleCall}
            activeOpacity={0.8}
          >
            <Text style={styles.dialButtonText}>📞 Call SIM</Text>
          </TouchableOpacity>

          <View style={{ width: 64 }} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
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
    backgroundColor: "#0d1b2a",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.gold,
  },
  liveClockText: {
    color: THEME.colors.gold,
    fontSize: 11,
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  screenContainer: {
    backgroundColor: THEME.colors.card,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 85,
    position: "relative",
  },
  recognizedLeadCard: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: "#0d2137",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.emerald,
  },
  recognizedTitle: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  recognizedTag: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.emerald,
  },
  recognizedTagText: {
    color: THEME.colors.emerald,
    fontSize: 10,
    fontWeight: "bold",
  },
  recognizedSubtitle: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  screenText: {
    color: THEME.colors.gold,
    fontSize: 26,
    fontWeight: "bold",
    letterSpacing: 2,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  clearBadge: {
    position: "absolute",
    right: 14,
    top: 14,
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  clearText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  keypadContainer: {
    marginTop: 20,
    paddingHorizontal: 30,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  key: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: THEME.colors.card,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  keyText: {
    color: THEME.colors.textPrimary,
    fontSize: 28,
    fontWeight: "bold",
  },
  bottomControlRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  backspaceButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  backspaceText: {
    color: THEME.colors.textSecondary,
    fontSize: 24,
  },
  dialButton: {
    backgroundColor: THEME.colors.emerald,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 32,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: THEME.colors.emerald,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
