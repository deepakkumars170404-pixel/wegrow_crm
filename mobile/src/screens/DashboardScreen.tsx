import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { THEME } from "../constants/theme";
import { CallRecord, TelecallerStats } from "../types";
import { StorageService } from "../services/storage";
import { ApiService } from "../services/api";

export const DashboardScreen: React.FC = () => {
  const [history, setHistory] = useState<CallRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<TelecallerStats>({
    todayCallsCount: 0,
    todayTalkTimeSeconds: 0,
    interestedCount: 0,
    counsellingScheduledCount: 0,
    targetCalls: 50,
  });

  const loadData = async () => {
    const list = await StorageService.getCallHistory();
    setHistory(list);

    // Calculate today's stats
    const today = new Date().toDateString();
    const todayRecords = list.filter(
      (r) => new Date(r.timestamp).toDateString() === today
    );

    const callsCount = todayRecords.length;
    const talkSecs = todayRecords.reduce((acc, cur) => acc + (cur.durationSeconds || 0), 0);
    const interested = todayRecords.filter((r) => r.disposition === "Interested").length;
    const counselling = todayRecords.filter(
      (r) => r.disposition === "Counselling Scheduled"
    ).length;

    setStats({
      todayCallsCount: callsCount,
      todayTalkTimeSeconds: talkSecs,
      interestedCount: interested,
      counsellingScheduledCount: counselling,
      targetCalls: 50,
    });
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSyncNow = async () => {
    const res = await ApiService.syncPendingCalls();
    if (res.syncedCount > 0) {
      Alert.alert("Synced", `Successfully uploaded ${res.syncedCount} offline call records to CRM!`);
    } else {
      Alert.alert("All Synced", "All call records are up to date with the server.");
    }
    loadData();
  };

  const formatTalkTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${s}s`;
  };

  const renderHistoryItem = ({ item }: { item: CallRecord }) => {
    const dateStr = new Date(item.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <View style={styles.historyCard}>
        <View style={styles.historyHeader}>
          <View>
            <Text style={styles.histStudent}>{item.studentName}</Text>
            <Text style={styles.histPhone}>{item.phone}</Text>
          </View>
          <View style={styles.histRight}>
            <Text style={styles.histDuration}>Talk: {item.formattedDuration || "00:00"}</Text>
            <Text style={styles.histTime}>{dateStr}</Text>
          </View>
        </View>

        <View style={styles.histFooter}>
          <View style={styles.dispPill}>
            <Text style={styles.dispPillText}>{item.disposition}</Text>
          </View>
          <Text style={[styles.syncStatus, item.syncedToCrm ? styles.synced : styles.pending]}>
            {item.syncedToCrm ? "✓ Synced" : "⏳ Local"}
          </Text>
        </View>

        {item.notes ? (
          <Text style={styles.histNotes} numberOfLines={2}>
            "{item.notes}"
          </Text>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Telecaller Dashboard</Text>
          <Text style={styles.headerSubtitle}>Daily Performance & Metrics</Text>
        </View>
        <TouchableOpacity style={styles.syncBtn} onPress={handleSyncNow}>
          <Text style={styles.syncBtnText}>Sync Cloud</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderHistoryItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            tintColor={THEME.colors.gold}
          />
        }
        ListHeaderComponent={
          <View>
            {/* KPI 2x2 Grid */}
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiValue}>{stats.todayCallsCount}</Text>
                <Text style={styles.kpiLabel}>TODAY'S CALLS</Text>
                <Text style={styles.kpiTarget}>Target: {stats.targetCalls}</Text>
              </View>

              <View style={styles.kpiCard}>
                <Text style={[styles.kpiValue, { color: THEME.colors.emerald }]}>
                  {formatTalkTime(stats.todayTalkTimeSeconds)}
                </Text>
                <Text style={styles.kpiLabel}>TOTAL TALK TIME</Text>
                <Text style={styles.kpiTarget}>Live SIM voice</Text>
              </View>

              <View style={styles.kpiCard}>
                <Text style={[styles.kpiValue, { color: THEME.colors.gold }]}>
                  {stats.interestedCount}
                </Text>
                <Text style={styles.kpiLabel}>INTERESTED</Text>
                <Text style={styles.kpiTarget}>Warm prospects</Text>
              </View>

              <View style={styles.kpiCard}>
                <Text style={[styles.kpiValue, { color: THEME.colors.sky }]}>
                  {stats.counsellingScheduledCount}
                </Text>
                <Text style={styles.kpiLabel}>COUNSELLING</Text>
                <Text style={styles.kpiTarget}>Demos booked</Text>
              </View>
            </View>

            {/* Target Progress Bar */}
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Daily Calling Goal</Text>
                <Text style={styles.progressPercent}>
                  {Math.round((stats.todayCallsCount / stats.targetCalls) * 100)}%
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(
                        100,
                        (stats.todayCallsCount / stats.targetCalls) * 100
                      )}%`,
                    },
                  ]}
                />
              </View>
            </View>

            <Text style={styles.sectionTitle}>RECENT CALL ACTIVITY</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No calls logged yet today.</Text>
            <Text style={styles.emptySub}>Calls made via SIM will appear here.</Text>
          </View>
        }
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  syncBtn: {
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.gold,
  },
  syncBtnText: {
    color: THEME.colors.gold,
    fontSize: 12,
    fontWeight: "bold",
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: THEME.colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  kpiValue: {
    color: THEME.colors.textPrimary,
    fontSize: 24,
    fontWeight: "bold",
  },
  kpiLabel: {
    color: THEME.colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: 4,
  },
  kpiTarget: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  progressCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: "bold",
  },
  progressPercent: {
    color: THEME.colors.gold,
    fontSize: 13,
    fontWeight: "bold",
  },
  progressBarBg: {
    height: 8,
    backgroundColor: THEME.colors.surface,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: THEME.colors.gold,
    borderRadius: 4,
  },
  sectionTitle: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  historyCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  histStudent: {
    color: THEME.colors.textPrimary,
    fontSize: 15,
    fontWeight: "bold",
  },
  histPhone: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  histRight: {
    alignItems: "flex-end",
  },
  histDuration: {
    color: THEME.colors.emerald,
    fontSize: 12,
    fontWeight: "bold",
  },
  histTime: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  histFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  dispPill: {
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dispPillText: {
    color: THEME.colors.gold,
    fontSize: 11,
    fontWeight: "600",
  },
  syncStatus: {
    fontSize: 11,
    fontWeight: "600",
  },
  synced: {
    color: THEME.colors.emerald,
  },
  pending: {
    color: THEME.colors.amber,
  },
  histNotes: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 6,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
    fontWeight: "bold",
  },
  emptySub: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
});
