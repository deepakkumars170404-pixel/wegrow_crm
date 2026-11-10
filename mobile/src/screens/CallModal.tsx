import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { THEME } from "../constants/theme";
import { CallDisposition, CallRecord, Lead } from "../types";
import { ApiService } from "../services/api";
import { StorageService } from "../services/storage";

interface CallModalProps {
  visible: boolean;
  lead: Lead | null;
  durationSeconds: number;
  onClose: () => void;
  onSaveSuccess: () => void;
}

const DISPOSITIONS: { key: CallDisposition; label: string; color: string }[] = [
  { key: "Interested", label: "Interested", color: THEME.colors.emerald },
  { key: "Counselling Scheduled", label: "Counselling Scheduled", color: THEME.colors.gold },
  { key: "Call Later", label: "Call Later", color: THEME.colors.sky },
  { key: "Busy", label: "Line Busy", color: THEME.colors.amber },
  { key: "Not Answered", label: "Not Answered", color: THEME.colors.danger },
  { key: "Lost", label: "Not Interested / Lost", color: THEME.colors.textMuted },
];

export const CallModal: React.FC<CallModalProps> = ({
  visible,
  lead,
  durationSeconds,
  onClose,
  onSaveSuccess,
}) => {
  const [selectedDisposition, setSelectedDisposition] = useState<CallDisposition>("Interested");
  const [notes, setNotes] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [nextFollowUpTime, setNextFollowUpTime] = useState("");
  const [saving, setSaving] = useState(false);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSave = async () => {
    if (!lead) return;
    setSaving(true);
    try {
      const settings = await StorageService.getSettings();
      const record: CallRecord = {
        id: `CR-${Date.now()}`,
        leadId: lead.id,
        studentName: lead.studentName,
        phone: lead.phone,
        callerName: settings.callerName || "Telecaller",
        disposition: selectedDisposition,
        durationSeconds,
        formattedDuration: formatTime(durationSeconds),
        notes,
        nextFollowUpDate,
        nextFollowUpTime,
        timestamp: Date.now(),
        syncedToCrm: false,
      };

      const result = await ApiService.logCallOutcome(record);
      if (result.success) {
        Alert.alert("Success", "Call disposition synced to Wegrow CRM!");
      } else {
        Alert.alert("Saved Locally", result.error || "Saved offline. Will sync when online.");
      }

      setNotes("");
      setNextFollowUpDate("");
      setNextFollowUpTime("");
      onSaveSuccess();
      onClose();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save call disposition");
    } finally {
      setSaving(false);
    }
  };

  if (!lead) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{lead.studentName}</Text>
              <Text style={styles.phone}>{lead.phone} • {lead.courseInterested}</Text>
            </View>
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>Talk: {formatTime(durationSeconds)}</Text>
            </View>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Disposition Selector */}
            <Text style={styles.sectionLabel}>CALL OUTCOME DISPOSITION</Text>
            <View style={styles.dispGrid}>
              {DISPOSITIONS.map((d) => {
                const isSelected = selectedDisposition === d.key;
                return (
                  <TouchableOpacity
                    key={d.key}
                    style={[
                      styles.dispButton,
                      isSelected && { borderColor: d.color, backgroundColor: THEME.colors.surfaceLight },
                    ]}
                    onPress={() => setSelectedDisposition(d.key)}
                  >
                    <View style={[styles.dot, { backgroundColor: d.color }]} />
                    <Text
                      style={[
                        styles.dispText,
                        isSelected && { color: d.color, fontWeight: "700" },
                      ]}
                    >
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Next Follow-up Schedule (Optional) */}
            {(selectedDisposition === "Call Later" ||
              selectedDisposition === "Interested" ||
              selectedDisposition === "Counselling Scheduled") && (
              <View style={styles.scheduleBox}>
                <Text style={styles.sectionLabel}>SCHEDULE NEXT FOLLOW-UP</Text>
                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginRight: 8 }]}
                    placeholder="Date (YYYY-MM-DD)"
                    placeholderTextColor={THEME.colors.textMuted}
                    value={nextFollowUpDate}
                    onChangeText={setNextFollowUpDate}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Time (e.g. 03:30 PM)"
                    placeholderTextColor={THEME.colors.textMuted}
                    value={nextFollowUpTime}
                    onChangeText={setNextFollowUpTime}
                  />
                </View>
              </View>
            )}

            {/* Notes / Remarks */}
            <Text style={styles.sectionLabel}>COUNSELLOR REMARKS / NOTES</Text>
            <TextInput
              style={styles.textArea}
              placeholder="e.g. Student interested in weekend GenAI batch, requested fee discount..."
              placeholderTextColor={THEME.colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline={true}
              numberOfLines={4}
            />
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#0A1128" />
              ) : (
                <Text style={styles.saveText}>Save & Advance Lead</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: THEME.colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    paddingBottom: 14,
  },
  title: {
    color: THEME.colors.textPrimary,
    fontSize: 18,
    fontWeight: "bold",
  },
  phone: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  durationBadge: {
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.emerald,
  },
  durationText: {
    color: THEME.colors.emerald,
    fontSize: 12,
    fontWeight: "bold",
  },
  body: {
    paddingVertical: 16,
  },
  sectionLabel: {
    color: THEME.colors.gold,
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 6,
  },
  dispGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  dispButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  dispText: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
  },
  scheduleBox: {
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
  },
  input: {
    backgroundColor: THEME.colors.surface,
    color: THEME.colors.textPrimary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    fontSize: 13,
  },
  textArea: {
    backgroundColor: THEME.colors.surface,
    color: THEME.colors.textPrimary,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    fontSize: 13,
    textAlignVertical: "top",
    minHeight: 80,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cancelText: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: THEME.colors.gold,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 10,
  },
  saveText: {
    color: "#0A1128",
    fontSize: 14,
    fontWeight: "bold",
  },
});
