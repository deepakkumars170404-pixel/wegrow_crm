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
  ScrollView,
} from "react-native";
import { THEME } from "../constants/theme";
import { Lead } from "../types";
import { ApiService } from "../services/api";
import { TelephonyService } from "../services/telephony";
import {
  Phone,
  MessageCircle,
  FileEdit,
  Clock,
  Search,
  Users,
  GraduationCap,
  Building2,
  X,
  Filter,
  RefreshCw,
} from "lucide-react-native";

interface QueueScreenProps {
  onOpenCallModal?: (lead: Lead) => void;
}

export const QueueScreen: React.FC<QueueScreenProps> = ({ onOpenCallModal }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<"All" | "Hot" | "Warm" | "Follow-up">("All");

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
    await TelephonyService.dialViaSIM(lead.phone, lead.studentName);
  };

  const handleWhatsApp = (lead: Lead) => {
    TelephonyService.openWhatsAppChat(lead.phone, lead.studentName, lead.courseInterested);
  };

  const isFollowUpLead = useCallback((l: Lead): boolean => {
    const hasFollowUpDate = Boolean(
      l.nextFollowUpDate &&
      String(l.nextFollowUpDate).trim().length > 0 &&
      l.nextFollowUpDate !== "-" &&
      l.nextFollowUpDate !== "null" &&
      l.nextFollowUpDate !== "undefined"
    );
    const hasFollowUpTime = Boolean(
      l.nextFollowUpTime &&
      String(l.nextFollowUpTime).trim().length > 0 &&
      l.nextFollowUpTime !== "-"
    );
    const isStatusFollowUp =
      l.status === "Follow-up" ||
      (l.status as string) === "Call Later" ||
      (l.status as string) === "Counselling Scheduled";
    const isStageFollowUp =
      l.stage === "Call Scheduled" ||
      (l.stage as string) === "Follow-up";

    return hasFollowUpDate || hasFollowUpTime || isStatusFollowUp || isStageFollowUp;
  }, []);

  // Filter and DEDUPLICATE leads by 10-digit phone number so no student appears twice
  const uniqueLeads = useMemo(() => {
    const q = search.toLowerCase().trim();
    const filtered = leads.filter((l) => {
      // 1. Search Query
      if (q) {
        const student = (l.studentName || "").toLowerCase();
        const phone = (l.phone || "").toLowerCase();
        const course = (l.courseInterested || "").toLowerCase();
        const college = (l.collegeName || "").toLowerCase();
        const qual = (l.qualification || "").toLowerCase();
        const matches =
          student.includes(q) ||
          phone.includes(q) ||
          course.includes(q) ||
          college.includes(q) ||
          qual.includes(q);
        if (!matches) return false;
      }

      // 2. Priority / Stage Filter
      if (priorityFilter === "Hot" && l.priority !== "Hot") return false;
      if (priorityFilter === "Warm" && l.priority !== "Warm") return false;
      if (priorityFilter === "Follow-up" && !isFollowUpLead(l)) {
        return false;
      }

      return true;
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
  }, [leads, search, priorityFilter, isFollowUpLead]);

  const totalCount = leads.length;
  const hotCount = useMemo(() => leads.filter((l) => l.priority === "Hot").length, [leads]);
  const warmCount = useMemo(() => leads.filter((l) => l.priority === "Warm").length, [leads]);
  const followUpCount = useMemo(
    () => leads.filter(isFollowUpLead).length,
    [leads, isFollowUpLead]
  );

  const renderLeadCard = useCallback(({ item }: { item: Lead }) => {
    const isHot = item.priority === "Hot";
    const initial = (item.studentName || "S").trim().charAt(0).toUpperCase();

    return (
      <View style={[styles.card, isHot && styles.hotCardBorder]}>
        {/* Top Row: Avatar, Student Name, Phone & Priority */}
        <View style={styles.cardHeader}>
          <View style={styles.studentInfoLeft}>
            <View style={[styles.avatarCircle, isHot ? styles.avatarHot : styles.avatarNormal]}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.leadName} numberOfLines={1}>
                  {item.studentName}
                </Text>
                <View style={styles.phonePill}>
                  <Text style={styles.phoneText}>{item.phone}</Text>
                </View>
              </View>
              <Text style={styles.courseText} numberOfLines={1}>
                Course: <Text style={styles.courseHighlight}>{item.courseInterested || "General Inquiry"}</Text>
              </Text>
            </View>
          </View>

          {/* Badges: Priority & Stage */}
          <View style={styles.badgeCol}>
            <View
              style={[
                styles.priorityBadge,
                item.priority === "Hot"
                  ? styles.badgeHot
                  : item.priority === "Warm"
                  ? styles.badgeWarm
                  : styles.badgeCold,
              ]}
            >
              <Text
                style={[
                  styles.priorityText,
                  item.priority === "Hot"
                    ? styles.textHot
                    : item.priority === "Warm"
                    ? styles.textWarm
                    : styles.textCold,
                ]}
              >
                {item.priority || "Warm"}
              </Text>
            </View>
            <View style={styles.stageBadge}>
              <Text style={styles.stageText} numberOfLines={1}>
                {item.stage || item.status || "New"}
              </Text>
            </View>
          </View>
        </View>

        {/* Academic Row (College & Qualification) */}
        {(item.qualification || item.collegeName) && (
          <View style={styles.academicRow}>
            {item.qualification ? (
              <View style={styles.academicBadge}>
                <GraduationCap size={11} color="#92400E" strokeWidth={2} />
                <Text style={styles.academicBadgeText}>
                  {item.qualification} {item.passedOutYear ? `(${item.passedOutYear})` : ""}
                </Text>
              </View>
            ) : null}
            {item.collegeName ? (
              <View style={styles.collegeBadge}>
                <Building2 size={11} color="#475569" strokeWidth={2} />
                <Text style={styles.collegeBadgeText} numberOfLines={1}>
                  {item.collegeName}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Counselor & Follow-up Info */}
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            Counselor: <Text style={{ fontWeight: "700", color: "#334155" }}>{item.assignedCaller || "Unassigned"}</Text>
            {item.callCount !== undefined ? ` • Calls: ${item.callCount}` : ""}
          </Text>
          {item.nextFollowUpDate ? (
            <View style={styles.followUpTag}>
              <Clock size={10} color="#B45309" strokeWidth={2.2} />
              <Text style={styles.followUpTagText}>
                Due: {item.nextFollowUpDate} {item.nextFollowUpTime || ""}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Action Buttons: 1-Tap SIM Call, 1-Tap WhatsApp, Log */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => handleCallLead(item)}
            activeOpacity={0.8}
          >
            <Phone size={13} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.callButtonText}>Call SIM</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.waButton}
            onPress={() => handleWhatsApp(item)}
            activeOpacity={0.8}
          >
            <MessageCircle size={13} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.waButtonText}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dispButton}
            onPress={() => {
              if (onOpenCallModal) onOpenCallModal(item);
            }}
            activeOpacity={0.7}
          >
            <FileEdit size={13} color="#475569" strokeWidth={2.2} />
            <Text style={styles.dispButtonText}>Log</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [onOpenCallModal]);

  return (
    <View style={styles.container}>
      {/* 1. Header Banner */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.headerTitleRow}>
            <Users size={18} color="#1E40AF" strokeWidth={2.5} />
            <Text style={styles.headerTitle}>Student Call Queue</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Wegrow Skill Campus • Daily Telecalling
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshHeaderBtn} onPress={onRefresh} activeOpacity={0.7}>
          <RefreshCw size={12} color="#1D4ED8" strokeWidth={2.4} style={{ marginRight: 4 }} />
          <Text style={styles.refreshHeaderText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Offline Notice if CRM is unreachable */}
      {errorMsg && (
        <View style={styles.noticeBar}>
          <Text style={styles.noticeText}>Offline Mode: Showing cached student queue</Text>
        </View>
      )}

      {/* 2. Priority Filter Tabs */}
      <View style={styles.filterTabsRow}>
        <TouchableOpacity
          style={[styles.filterTab, priorityFilter === "All" && styles.filterTabActive]}
          onPress={() => setPriorityFilter("All")}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterTabText, priorityFilter === "All" && styles.filterTabTextActive]}>
            All ({totalCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, priorityFilter === "Hot" && styles.filterTabHot]}
          onPress={() => setPriorityFilter("Hot")}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterTabText, priorityFilter === "Hot" && styles.filterTextHot]}>
            🔥 Hot ({hotCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, priorityFilter === "Warm" && styles.filterTabWarm]}
          onPress={() => setPriorityFilter("Warm")}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterTabText, priorityFilter === "Warm" && styles.filterTextWarm]}>
            ⭐ Warm ({warmCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, priorityFilter === "Follow-up" && styles.filterTabFu]}
          onPress={() => setPriorityFilter("Follow-up")}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterTabText, priorityFilter === "Follow-up" && styles.filterTextFu]}>
            📅 Follow-up ({followUpCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. Search Bar */}
      <View style={styles.searchBox}>
        <View style={styles.searchInputWrapper}>
          <Search size={15} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by student name, phone, course..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            clearButtonMode="while-editing"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} style={{ padding: 4 }}>
              <X size={14} color="#64748B" strokeWidth={2.5} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 4. Queue List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Syncing leads with Wegrow CRM...</Text>
        </View>
      ) : (
        <FlatList
          data={uniqueLeads}
          keyExtractor={(item) => item.id}
          renderItem={renderLeadCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews={Platform.OS === "android"}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#2563EB"
              colors={["#2563EB"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.centerEmpty}>
              <Users size={36} color="#CBD5E1" strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>No Students in Queue</Text>
              <Text style={styles.emptySub}>
                {search ? "No leads matched your search query." : "Pull down to refresh from Wegrow Cloud CRM."}
              </Text>
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
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 2,
  },
  refreshHeaderBtn: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    flexDirection: "row",
    alignItems: "center",
  },
  refreshHeaderText: {
    color: "#1D4ED8",
    fontSize: 11,
    fontWeight: "800",
  },
  noticeBar: {
    backgroundColor: "#FEF3C7",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#FDE68A",
  },
  noticeText: {
    color: "#92400E",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  filterTabsRow: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingTop: 10,
    gap: 6,
  },
  filterTab: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  filterTabActive: {
    backgroundColor: "#1E40AF",
    borderColor: "#1E40AF",
  },
  filterTabHot: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  filterTabWarm: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  filterTabFu: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
  },
  filterTabText: {
    color: "#475569",
    fontSize: 10.5,
    fontWeight: "700",
  },
  filterTabTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  filterTextHot: {
    color: "#B91C1C",
    fontWeight: "800",
  },
  filterTextWarm: {
    color: "#B45309",
    fontWeight: "800",
  },
  filterTextFu: {
    color: "#4338CA",
    fontWeight: "800",
  },
  searchBox: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 11,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    height: 38,
  },
  searchInput: {
    flex: 1,
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "500",
    paddingVertical: 0,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 13,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1.5,
  },
  hotCardBorder: {
    borderColor: "#FCA5A5",
    borderLeftWidth: 3.5,
    borderLeftColor: "#EF4444",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  studentInfoLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    flex: 1,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  avatarHot: {
    backgroundColor: "#DC2626",
  },
  avatarNormal: {
    backgroundColor: "#1E40AF",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  leadName: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
  },
  phonePill: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 5,
  },
  phoneText: {
    color: "#475569",
    fontSize: 10.5,
    fontFamily: "monospace",
    fontWeight: "700",
  },
  courseText: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 2,
  },
  courseHighlight: {
    color: "#1E3A8A",
    fontWeight: "700",
  },
  badgeCol: {
    alignItems: "flex-end",
    gap: 3,
    marginLeft: 6,
  },
  priorityBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeHot: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  badgeWarm: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  badgeCold: {
    backgroundColor: "#F0F9FF",
    borderColor: "#BAE6FD",
  },
  priorityText: {
    fontSize: 9.5,
    fontWeight: "800",
  },
  textHot: {
    color: "#DC2626",
  },
  textWarm: {
    color: "#D97706",
  },
  textCold: {
    color: "#0284C7",
  },
  stageBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  stageText: {
    color: "#475569",
    fontSize: 9.5,
    fontWeight: "600",
  },
  academicRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 3,
    marginBottom: 5,
  },
  academicBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3.5,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  academicBadgeText: {
    color: "#92400E",
    fontSize: 10,
    fontWeight: "700",
  },
  collegeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3.5,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: "90%",
  },
  collegeBadgeText: {
    color: "#475569",
    fontSize: 10,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
    marginBottom: 6,
  },
  metaText: {
    color: "#64748B",
    fontSize: 10.5,
  },
  followUpTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  followUpTagText: {
    color: "#92400E",
    fontSize: 9.5,
    fontWeight: "700",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 7,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  callButton: {
    flex: 2,
    backgroundColor: "#2563EB",
    borderRadius: 8,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  callButtonText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "800",
  },
  waButton: {
    flex: 2,
    backgroundColor: "#059669",
    borderRadius: 8,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  waButtonText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "800",
  },
  dispButton: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  dispButtonText: {
    color: "#334155",
    fontSize: 11,
    fontWeight: "700",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },
  centerEmpty: {
    paddingVertical: 50,
    alignItems: "center",
    paddingHorizontal: 30,
  },
  emptyTitle: {
    color: "#475569",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 10,
  },
  emptySub: {
    color: "#94A3B8",
    fontSize: 11.5,
    textAlign: "center",
    marginTop: 4,
  },
});
