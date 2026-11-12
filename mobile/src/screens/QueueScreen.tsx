import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from "react-native";
import { THEME } from "../constants/theme";
import { Lead } from "../types";
import { ApiService } from "../services/api";
import { TelephonyService } from "../services/telephony";
import { LiveClock } from "../components/LiveClock";
import { Phone, MessageCircle, FileEdit, Clock, Search } from "lucide-react-native";

interface QueueScreenProps {
  onOpenCallModal?: (lead: Lead) => void;
}

export const QueueScreen: React.FC<QueueScreenProps> = ({ onOpenCallModal }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

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
    setActiveLead(lead);
    await TelephonyService.dialViaSIM(lead.phone, lead.studentName);
  };

  const handleWhatsApp = (lead: Lead) => {
    TelephonyService.openWhatsAppChat(lead.phone, lead.studentName, lead.courseInterested);
  };

  // Filter and DEDUPLICATE leads by 10-digit phone number so Deepak never appears twice!
  const uniqueLeads = useMemo(() => {
    const q = search.toLowerCase().trim();
    const filtered = leads.filter((l) => {
      if (!q) return true;
      return (
        l.studentName.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        l.courseInterested.toLowerCase().includes(q)
      );
    });

    const seenPhones = new Set<string>();
    const result: Lead[] = [];
    for (const lead of filtered) {
      const cleanPhone = (lead.phone || "").replace(/\D/g, "").slice(-10);
      const key = cleanPhone || lead.id;
      if (!seenPhones.has(key)) {
        seenPhones.add(key);
        result.push(lead);
      }
    }
    return result;
  }, [leads, search]);

  const renderLeadCard = useCallback(({ item }: { item: Lead }) => {
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
              <Text style={styles.stageText}>{item.stage || item.status}</Text>
            </View>
          </View>
        </View>

        {/* Middle Row: Course & Source */}
        <View style={styles.cardDetails}>
          <Text style={styles.courseText}>Course: {item.courseInterested}</Text>
          <Text style={styles.metaText}>
            Counselor: {item.assignedCaller || "Unassigned"} • Calls: {item.callCount || 0}
          </Text>
        </View>

        {/* Action Buttons: 1-Tap SIM Call, 1-Tap WhatsApp, Log */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => handleCallLead(item)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 }}>
              <Phone size={14} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.callButtonText}>Call SIM</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.waButton}
            onPress={() => handleWhatsApp(item)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 }}>
              <MessageCircle size={14} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.waButtonText}>WhatsApp</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dispButton}
            onPress={() => {
              if (onOpenCallModal) onOpenCallModal(item);
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <FileEdit size={13} color="#334155" strokeWidth={2.2} />
              <Text style={styles.dispButtonText}>Log</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, []);

  return (
    <View style={styles.container}>
      {/* Header & Stats Banner */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Today's Call Queue</Text>
          <Text style={styles.headerSubtitle}>
            {uniqueLeads.length} Students in queue • Wegrow Skill Campus
          </Text>
        </View>
        <View style={styles.liveClockBadge}>
          <Clock size={12} color="#1D4ED8" style={{ marginRight: 4 }} />
          <LiveClock style={styles.liveClockText} />
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
        <View style={styles.searchInputWrapper}>
          <Search size={16} color="#64748B" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by student name, phone, course..."
            placeholderTextColor={THEME.colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Queue List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={THEME.colors.gold} />
          <Text style={styles.loadingText}>Syncing leads with Wegrow CRM...</Text>
        </View>
      ) : (
        <FlatList
          data={uniqueLeads}
          keyExtractor={(item) => item.id}
          renderItem={renderLeadCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews={Platform.OS === "android"}
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
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
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
    paddingVertical: 10,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  searchInput: {
    flex: 1,
    color: THEME.colors.textPrimary,
    paddingVertical: 10,
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
    backgroundColor: "#25D366",
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
