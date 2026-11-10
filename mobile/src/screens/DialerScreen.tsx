import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { THEME } from "../constants/theme";
import { TelephonyService } from "../services/telephony";
import { CallModal } from "./CallModal";
import { Lead } from "../types";

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["*", "0", "#"],
];

export const DialerScreen: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [callModalVisible, setCallModalVisible] = useState(false);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

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

    const res = await TelephonyService.dialViaSIM(clean);
    if (res.success) {
      const syntheticLead: Lead = {
        id: `LD-MOB-${Date.now()}`,
        studentName: `Direct Dial (${clean})`,
        phone: clean,
        email: "direct@mobile.local",
        courseInterested: "Direct Dial",
        leadSource: "Mobile Dialer",
        enquiryDate: new Date().toISOString().split("T")[0],
        nextFollowUpDate: "",
        nextFollowUpTime: "",
        assignedCaller: "Telecaller",
        status: "New",
        priority: "Warm",
        stage: "New Enquiry",
      };

      setActiveLead(syntheticLead);
      setTimeout(() => {
        setCallModalVisible(true);
      }, 1000);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Direct Dialpad</Text>
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

      {/* Post-Call Modal */}
      <CallModal
        visible={callModalVisible}
        lead={activeLead}
        durationSeconds={1}
        onClose={() => setCallModalVisible(false)}
        onSaveSuccess={() => {
          setPhoneNumber("");
        }}
      />
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
  screenContainer: {
    backgroundColor: THEME.colors.card,
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 90,
    position: "relative",
  },
  screenText: {
    color: THEME.colors.gold,
    fontSize: 28,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },
  clearBadge: {
    position: "absolute",
    right: 14,
    top: 14,
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  clearText: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
  },
  keypadContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 36,
    paddingBottom: 30,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  key: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  keyText: {
    color: THEME.colors.textPrimary,
    fontSize: 26,
    fontWeight: "bold",
  },
  bottomControlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  backspaceButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  backspaceText: {
    color: THEME.colors.textSecondary,
    fontSize: 24,
  },
  dialButton: {
    backgroundColor: THEME.colors.emerald,
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: THEME.colors.emerald,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dialButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});
