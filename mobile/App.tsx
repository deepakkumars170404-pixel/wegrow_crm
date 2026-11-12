import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, LogBox } from "react-native";

LogBox.ignoreAllLogs(true);
import { StatusBar } from "expo-status-bar";
import { THEME } from "./src/constants/theme";
import { QueueScreen } from "./src/screens/QueueScreen";
import { DialerScreen } from "./src/screens/DialerScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { StaffSelectorBar } from "./src/components/StaffSelectorBar";
import { ActiveCallOverlay } from "./src/components/ActiveCallOverlay";
import { CallModal } from "./src/screens/CallModal";
import { Lead, StaffMember } from "./src/types";

type Tab = "queue" | "dialer" | "dashboard" | "settings";

export default function App() {
  const [currentTab, setCurrentTab] = useState<Tab>("queue");
  const [modalLead, setModalLead] = useState<Lead | null>(null);
  const [modalDuration, setModalDuration] = useState<number>(0);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [activeStaff, setActiveStaff] = useState<StaffMember>("MuthuSelvi");

  const handleCallEnded = (callData: {
    phoneNumber: string;
    studentName: string;
    durationSeconds: number;
    lead: Lead | null;
  }) => {
    const targetLead: Lead = callData.lead || {
      id: `inq-${Date.now()}`,
      studentName: callData.studentName || "Student Inquiry",
      phone: callData.phoneNumber,
      email: "",
      courseInterested: "",
      leadSource: "Direct Phone Call",
      enquiryDate: new Date().toISOString().split("T")[0],
      nextFollowUpDate: "",
      nextFollowUpTime: "",
      assignedCaller: activeStaff,
      status: "New",
      priority: "Warm",
      stage: "New Enquiry",
    };

    setModalLead(targetLead);
    setModalDuration(callData.durationSeconds);
    setIsModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor={THEME.colors.background} />

      {/* 1 Phone / 5 Staff Quick Selector Header */}
      <StaffSelectorBar onStaffChanged={(staff) => setActiveStaff(staff)} />

      {/* Screen Body */}
      <View style={styles.screenArea}>
        {currentTab === "queue" && (
          <QueueScreen
            onOpenCallModal={(lead) => {
              setModalLead(lead);
              setModalDuration(0);
              setIsModalVisible(true);
            }}
          />
        )}
        {currentTab === "dialer" && <DialerScreen />}
        {currentTab === "dashboard" && <DashboardScreen />}
        {currentTab === "settings" && <SettingsScreen />}
      </View>

      {/* Global In-Call / Incoming Call Full-Screen UI */}
      <ActiveCallOverlay onCallEnded={handleCallEnded} />

      {/* Global Post-Call Disposition Modal (Opens after any call ends) */}
      {modalLead && (
        <CallModal
          visible={isModalVisible}
          lead={modalLead}
          durationSeconds={modalDuration}
          onClose={() => {
            setIsModalVisible(false);
            setModalLead(null);
          }}
          onSaveSuccess={() => {
            setIsModalVisible(false);
            setModalLead(null);
          }}
        />
      )}

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab("queue")}
          activeOpacity={0.7}
        >
          <Text style={[styles.navIcon, currentTab === "queue" && styles.activeNavText]}>
            📋
          </Text>
          <Text style={[styles.navLabel, currentTab === "queue" && styles.activeNavLabel]}>
            Queue
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab("dialer")}
          activeOpacity={0.7}
        >
          <Text style={[styles.navIcon, currentTab === "dialer" && styles.activeNavText]}>
            🔢
          </Text>
          <Text style={[styles.navLabel, currentTab === "dialer" && styles.activeNavLabel]}>
            Dialer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab("dashboard")}
          activeOpacity={0.7}
        >
          <Text style={[styles.navIcon, currentTab === "dashboard" && styles.activeNavText]}>
            📊
          </Text>
          <Text style={[styles.navLabel, currentTab === "dashboard" && styles.activeNavLabel]}>
            Metrics
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab("settings")}
          activeOpacity={0.7}
        >
          <Text style={[styles.navIcon, currentTab === "settings" && styles.activeNavText]}>
            ⚙️
          </Text>
          <Text style={[styles.navLabel, currentTab === "settings" && styles.activeNavLabel]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  screenArea: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: THEME.colors.card,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 2,
    opacity: 0.6,
  },
  activeNavText: {
    opacity: 1,
  },
  navLabel: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontWeight: "500",
  },
  activeNavLabel: {
    color: THEME.colors.gold,
    fontWeight: "700",
  },
});
