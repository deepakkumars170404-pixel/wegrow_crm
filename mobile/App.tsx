import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { THEME } from "./src/constants/theme";
import { QueueScreen } from "./src/screens/QueueScreen";
import { DialerScreen } from "./src/screens/DialerScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";

type Tab = "queue" | "dialer" | "dashboard" | "settings";

export default function App() {
  const [currentTab, setCurrentTab] = useState<Tab>("queue");

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor={THEME.colors.background} />

      {/* Screen Body */}
      <View style={styles.screenArea}>
        {currentTab === "queue" && <QueueScreen />}
        {currentTab === "dialer" && <DialerScreen />}
        {currentTab === "dashboard" && <DashboardScreen />}
        {currentTab === "settings" && <SettingsScreen />}
      </View>

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
    paddingBottom: 14,
    justifyContent: "space-around",
    alignItems: "center",
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
    opacity: 0.6,
  },
  navLabel: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },
  activeNavText: {
    opacity: 1,
  },
  activeNavLabel: {
    color: THEME.colors.gold,
    fontWeight: "bold",
  },
});
