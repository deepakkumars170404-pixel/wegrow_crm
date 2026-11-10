import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { THEME } from "../constants/theme";
import { Lead } from "../types";
import { ApiService } from "../services/api";
import { TelephonyService } from "../services/telephony";
import { CallModal } from "./CallModal";

export const QueueScreen: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active call session tracking
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [callModalVisible, setCallModalVisible] = useState(false);
  const [callStartTime, setCallStartTime] = useState<number | null>(null);
  const [callDuration, setCallDuration] = useState(0);

  const loadQueue = useCallback(async () => {
    setErrorMsg(null);
    const result = await ApiService.fetchTodayQueue();
    if (result.leads) {
      setLeads(result.leads);
    }
    if (result.error) {
      setErrorMsg(result.error);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const onRefresh = () => {
    setRefreshing(true);
    loadQueue();
  };

  const handleCallLead = async (lead: Lead) => {
    // 1. Dial directly via Android SIM card
    const res = await TelephonyService.dialViaSIM(lead.phone, lead.studentName);
    if (res.success) {
      // Record start time and prepare post-call disposition modal
      setActiveLead(lead);
      const start = Date.now();
      setCallStartTime(start);
      setCallDuration(1); // will be updated when user returns to app

      // Open disposition modal after call returns
      setTimeout(() => {
        const elapsed = Math.round((Date.now() - start) / 1000);
        setCallDuration(elapsed > 0 ? elapsed : 1);
        setCallModalVisible(true);
      }, 1000);
    }
  };

  const handleWhatsApp = (lead: Lead) => {
    TelephonyService.openWhatsAppChat(lead.phone, lead.studentName, lead.courseInterested);
  };

  const filteredLeads = leads.filter((l) => {
    const q = search.toLowerCase();
    return (
      l.studentName.toLowerCase().includes(q) ||
      l.phone.includes(q) ||
      l.courseInterested.toLowerCase().includes(q)
    );
  });

  const renderLeadCard = ({ item }: { item: Lead }) => {
    const isHot = item.priority === "Hot";
    return (
      <View style={[styles.card, isHot && styles.hotCardBorder]}>
        {/* Top Row: Name, Course, Priority Badge */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.leadName}>{item.studentName}</Text>
            <Text style={styles.leadPhone}>{item.phone}</Text>
          </View>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.priorityBadge,
                {
                  backgroundColor:
                    item.priority === "Hot"
                      ? THEME.colors.danger
                      : item.priority === "Warm"
                      ? THEME.colors.amber
                      : THEME.colors.sky,
                },
              ]}
            >
              <Text style={styles.badgeText}>{item.priority}</Text>
            </View>
            <View style={styles.stageBadge}>
              <Text style={styles.stageText}>{item.stage}</Text>
            </View>
          </View>
        </View>

        {/* Middle Row: Course & Source */}
        <View style={styles.cardDetails}>
          <Text style={styles.courseText}>Course: {item.courseInterested}</Text>
          <Text style={styles.metaText}>Source: {item.leadSource} • Calls: {item.callCount || 0}</Text>
        </View>

        {/* Action Buttons: 1-Tap SIM Call & 1-Tap WhatsApp */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => handleCallLead(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.callButtonText}>📞 Call via SIM</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.waButton}
            onPress={() => handleWhatsApp(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.waButtonText}>💬 WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dispButton}
            onPress={() => {
              setActiveLead(item);
              setCallDuration(0);
              setCallModalVisible(true);
            }}
          >
            <Text style={styles.dispButtonText}>Log</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header & Stats Banner */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Today's Call Queue</Text>
          <Text style={styles.headerSubtitle}>
            {filteredLeads.length} Leads in queue • Wegrow Skill Campus
          </Text>
        </View>
      </View>

      {/* Offline Notice if CRM is unreachable */}
      {errorMsg && (
        <View style={styles.noticeBar}>
          <Text style={styles.noticeText}>Offline Mode: Showing cached leads</Text>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by student name, phone, course..."
          placeholderTextColor={THEME.colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Queue List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={THEME.colors.gold} />
          <Text style={styles.loadingText}>Syncing leads with Wegrow CRM...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredLeads}
          keyExtractor={(item) => item.id}
          renderItem={renderLeadCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={THEME.colors.gold}
            />
          }
          ListEmptyComponent={
            <View style={styles.centerEmpty}>
              <Text style={styles.emptyTitle}>No Leads Found</Text>
              <Text style={styles.emptySub}>Pull down to refresh from CRM</Text>
            </View>
          }
        />
      )}

      {/* Post-Call Disposition Modal */}
      <CallModal
        visible={callModalVisible}
        lead={activeLead}
        durationSeconds={callDuration}
        onClose={() => setCallModalVisible(false)}
        onSaveSuccess={() => {
          loadQueue();
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
  noticeBar: {
    backgroundColor: THEME.colors.amber,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  noticeText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  searchBox: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    backgroundColor: THEME.colors.card,
    color: THEME.colors.textPrimary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  hotCardBorder: {
    borderColor: THEME.colors.gold,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  leadName: {
    color: THEME.colors.textPrimary,
    fontSize: 16,
    fontWeight: "bold",
  },
  leadPhone: {
    color: THEME.colors.gold,
    fontSize: 14,
    marginTop: 2,
    fontWeight: "600",
  },
  badgeRow: {
    alignItems: "flex-end",
    gap: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  stageBadge: {
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stageText: {
    color: THEME.colors.textSecondary,
    fontSize: 10,
  },
  cardDetails: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  courseText: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: "500",
  },
  metaText: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  callButton: {
    flex: 2,
    backgroundColor: THEME.colors.emerald,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  callButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  waButton: {
    flex: 2,
    backgroundColor: "#25D366", // WhatsApp Green
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  waButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  dispButton: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  dispButtonText: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: THEME.colors.textSecondary,
    marginTop: 12,
    fontSize: 13,
  },
  centerEmpty: {
    paddingVertical: 50,
    alignItems: "center",
  },
  emptyTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 16,
    fontWeight: "bold",
  },
  emptySub: {
    color: THEME.colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
});
