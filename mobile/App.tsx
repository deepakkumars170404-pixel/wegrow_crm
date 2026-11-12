import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, LogBox, Platform, StatusBar as RNStatusBar } from "react-native";
import { ListFilter, PhoneCall, BarChart3, Settings } from "lucide-react-native";

LogBox.ignoreAllLogs(true);
import { StatusBar } from "expo-status-bar";
import { THEME } from "./src/constants/theme";
import { QueueScreen } from "./src/screens/QueueScreen";
import { DialerScreen } from "./src/screens/DialerScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { ActiveCallOverlay } from "./src/components/ActiveCallOverlay";
import { CallModal } from "./src/screens/CallModal";
import { Lead, StaffMember } from "./src/types";
import { ApiService } from "./src/services/api";

type Tab = "queue" | "dialer" | "dashboard" | "settings";

export default function App() {
  const [currentTab, setCurrentTab] = useState<Tab>("queue");
  const [modalLead, setModalLead] = useState<Lead | null>(null);
  const [modalDuration, setModalDuration] = useState<number>(0);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [activeStaff, setActiveStaff] = useState<StaffMember>("MuthuSelvi");

  // Auto-sync any offline pending calls whenever app opens
  useEffect(() => {
    ApiService.syncPendingCalls().catch(() => {});
  }, []);

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
      <StatusBar style="dark" backgroundColor="#FFFFFF" />

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
          <ListFilter
            size={22}
            color={currentTab === "queue" ? "#2563EB" : "#94A3B8"}
            strokeWidth={currentTab === "queue" ? 2.5 : 2}
          />
          <Text style={[styles.navLabel, currentTab === "queue" && styles.activeNavLabel]}>
            Queue
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab("dialer")}
          activeOpacity={0.7}
        >
          <PhoneCall
            size={22}
            color={currentTab === "dialer" ? "#2563EB" : "#94A3B8"}
            strokeWidth={currentTab === "dialer" ? 2.5 : 2}
          />
          <Text style={[styles.navLabel, currentTab === "dialer" && styles.activeNavLabel]}>
            Dialer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab("dashboard")}
          activeOpacity={0.7}
        >
          <BarChart3
            size={22}
            color={currentTab === "dashboard" ? "#2563EB" : "#94A3B8"}
            strokeWidth={currentTab === "dashboard" ? 2.5 : 2}
          />
          <Text style={[styles.navLabel, currentTab === "dashboard" && styles.activeNavLabel]}>
            Metrics
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab("settings")}
          activeOpacity={0.7}
        >
          <Settings
            size={22}
            color={currentTab === "settings" ? "#2563EB" : "#94A3B8"}
            strokeWidth={currentTab === "settings" ? 2.5 : 2}
          />
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
    backgroundColor: "#F8FAFC",
    paddingTop: Platform.OS === "android" ? (RNStatusBar.currentHeight || 28) : 0,
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
    color: "#64748B",
    fontWeight: "600",
    marginTop: 4,
  },
  activeNavLabel: {
    color: "#2563EB",
    fontWeight: "800",
  },
});
