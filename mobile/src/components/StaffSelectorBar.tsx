import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { THEME } from "../constants/theme";
import { WEGROW_STAFF_MEMBERS, StaffMember } from "../types";
import { StorageService } from "../services/storage";

interface StaffSelectorBarProps {
  onStaffChanged?: (staff: StaffMember) => void;
}

export const StaffSelectorBar: React.FC<StaffSelectorBarProps> = ({ onStaffChanged }) => {
  const [activeStaff, setActiveStaff] = useState<StaffMember>("MuthuSelvi");

  useEffect(() => {
    StorageService.getSettings().then((s) => {
      if (s.callerName && (WEGROW_STAFF_MEMBERS as readonly string[]).includes(s.callerName)) {
        setActiveStaff(s.callerName as StaffMember);
      }
    });
  }, []);

  const handleSelectStaff = async (staff: StaffMember) => {
    setActiveStaff(staff);
    const s = await StorageService.getSettings();
    await StorageService.saveSettings({ ...s, callerName: staff });
    if (onStaffChanged) {
      onStaffChanged(staff);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.phoneIcon}>📱</Text>
        <Text style={styles.label}>STAFF ON DUTY (1 PHONE / 5 STAFF):</Text>
        <Text style={styles.activePill}>{activeStaff}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {WEGROW_STAFF_MEMBERS.map((staff) => {
          const isSelected = activeStaff === staff;
          return (
            <TouchableOpacity
              key={staff}
              style={[styles.staffChip, isSelected && styles.staffChipActive]}
              onPress={() => handleSelectStaff(staff)}
              activeOpacity={0.7}
            >
              <Text style={[styles.staffText, isSelected && styles.staffTextActive]}>
                {isSelected ? "✓ " : ""}{staff}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  phoneIcon: {
    fontSize: 13,
    marginRight: 5,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: THEME.colors.textMuted,
    letterSpacing: 0.5,
  },
  activePill: {
    marginLeft: "auto",
    fontSize: 11,
    fontWeight: "800",
    color: THEME.colors.gold,
    backgroundColor: "rgba(213, 165, 43, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  scrollList: {
    flexDirection: "row",
    gap: 6,
    paddingRight: 8,
  },
  staffChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  staffChipActive: {
    backgroundColor: "#2563EB",
    borderColor: "#1D4ED8",
  },
  staffText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  staffTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
});
