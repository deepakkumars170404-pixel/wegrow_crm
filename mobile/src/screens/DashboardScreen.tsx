import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  PhoneCall,
  Phone,
  Clock,
  Search,
  MessageCircle,
  User,
  GraduationCap,
  Building2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  X,
  Filter,
  Sparkles,
} from "lucide-react-native";
import { THEME } from "../constants/theme";
import { CallRecord, WEGROW_STAFF_MEMBERS } from "../types";
import { ApiService } from "../services/api";
import { TelephonyService } from "../services/telephony";

export const DashboardScreen: React.FC = () => {
  const [allCalls, setAllCalls] = useState<CallRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Filters matching Web Telecaller Audit Desk
  const [staffFilter, setStaffFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Attended" | "Not Attended">("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const parseCallDurationSec = (c: {
    duration?: string;
    durationSeconds?: number;
    duration_seconds?: number;
    formattedDuration?: string;
  }): number => {
    if (typeof c.durationSeconds === "number" && c.durationSeconds >= 0) return c.durationSeconds;
    if (typeof c.duration_seconds === "number" && c.duration_seconds >= 0) return c.duration_seconds;
    const raw = String(c.duration || c.formattedDuration || "").trim();
    if (raw.includes(":")) {
      const parts = raw.split(":").map((n) => parseInt(n.replace(/\D/g, ""), 10) || 0);
      if (parts.length === 2) return parts[0] * 60 + parts[1];
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    const digits = parseInt(raw.replace(/\D/g, ""), 10);
    return isNaN(digits) ? 0 : digits;
  };

  const isCallAttended = useCallback((call: CallRecord) => {
    const durSec = parseCallDurationSec(call);
    if (
      call.outcome === "Not Attended Call" ||
      call.outcome === "Missed" ||
      call.outcome === "Missed / Cut" ||
      call.outcome === "Not Answered"
    ) {
      return false;
    }
    if (call.outcome === "Attended Call" || durSec > 0) {
      return true;
    }
    return false;
  }, []);

  const formatSpokenMinutes = (totalSec: number) => {
    if (totalSec <= 0) return "0s";
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs.toString().padStart(2, "0")}s`;
  };

  const getCallTimeRange = (call: CallRecord) => {
    const from = call.fromTime || call.callStartTime;
    const to = call.endTime || call.callEndTime;
    if (from && to && from !== to) {
      return `${from} → ${to}`;
    }
    if (from) {
      return `At ${from}`;
    }
    if (call.callTime) {
      return `At ${call.callTime}`;
    }
    if (call.timestamp) {
      return new Date(call.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return "";
  };

  const loadData = useCallback(async () => {
    try {
      const result = await ApiService.fetchAllCalls();
      if (result.calls) {
        setAllCalls(result.calls);
      }
    } catch (e) {
      console.warn("Failed to load calls:", e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSyncCloud = async () => {
    setSyncing(true);
    try {
      const res = await ApiService.syncPendingCalls();
      const fresh = await ApiService.fetchAllCalls();
      if (fresh.calls) {
        setAllCalls(fresh.calls);
      }
      if (res.syncedCount > 0) {
        Alert.alert("Cloud Synced", `Uploaded ${res.syncedCount} offline calls to Supabase CRM!`);
      } else {
        Alert.alert("All Synced", `Fetched ${fresh.calls.length} calls across CRM.`);
      }
    } catch {
      Alert.alert("Sync Notice", "Refreshed calls from server & cache.");
    } finally {
      setSyncing(false);
    }
  };

  const handleSIMCall = (phone: string, studentName: string) => {
    TelephonyService.dialViaSIM(phone, studentName);
  };

  const handleWhatsApp = (phone: string, studentName: string, course?: string) => {
    TelephonyService.openWhatsAppChat(phone, studentName, course);
  };

  // Top Executive KPI Calculations
  const totalAcademyCalls = allCalls.length;
  const attendedCallsCount = useMemo(() => {
    return allCalls.filter(isCallAttended).length;
  }, [allCalls, isCallAttended]);

  const notAttendedCallsCount = totalAcademyCalls - attendedCallsCount;

  const totalAcademySeconds = useMemo(() => {
    return allCalls.reduce((acc, c) => acc + parseCallDurationSec(c), 0);
  }, [allCalls]);

  const pickedPercentage = totalAcademyCalls > 0 ? Math.round((attendedCallsCount / totalAcademyCalls) * 100) : 0;
  const missedPercentage = totalAcademyCalls > 0 ? Math.round((notAttendedCallsCount / totalAcademyCalls) * 100) : 0;

  // Filtered Calls list for audit feed
  const filteredCalls = useMemo(() => {
    return allCalls.filter((c) => {
      // 1. Staff Filter
      if (staffFilter !== "All") {
        if (!c.callerName || !c.callerName.toLowerCase().includes(staffFilter.toLowerCase())) {
          return false;
        }
      }

      // 2. Call Status Filter
      const attended = isCallAttended(c);
      if (statusFilter === "Attended" && !attended) return false;
      if (statusFilter === "Not Attended" && attended) return false;

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const student = (c.studentName || "").toLowerCase();
        const phone = (c.phone || c.studentPhone || "").toLowerCase();
        const course = (c.courseInterested || c.studentCourse || "").toLowerCase();
        const staff = (c.callerName || "").toLowerCase();
        const college = (c.collegeName || "").toLowerCase();
        const qual = (c.qualification || "").toLowerCase();
        const notes = (c.notes || c.remarks || "").toLowerCase();
        const disp = (c.disposition || c.mindset || "").toLowerCase();

        const matches =
          student.includes(q) ||
          phone.includes(q) ||
          course.includes(q) ||
          staff.includes(q) ||
          college.includes(q) ||
          qual.includes(q) ||
          notes.includes(q) ||
          disp.includes(q);

        if (!matches) return false;
      }

      return true;
    });
  }, [allCalls, staffFilter, statusFilter, searchQuery, isCallAttended]);

  const renderCallCard = ({ item }: { item: CallRecord }) => {
    const attended = isCallAttended(item);
    const durSec = parseCallDurationSec(item);
    const timeRangeStr = getCallTimeRange(item);
    const initial = (item.studentName || "S").trim().charAt(0).toUpperCase();
    const phoneDisplay = item.phone || item.studentPhone || "";
    const courseDisplay = item.courseInterested || item.studentCourse || "";
    const mindset = item.mindset || item.disposition || (attended ? "Attended" : "Not Answered");
    const remarks = item.remarks || item.notes || "";
    const dateDisplay = item.callDate || (item.timestamp ? new Date(item.timestamp).toISOString().split("T")[0] : "");

    return (
      <View style={styles.card}>
        {/* Card Header: Student Avatar, Name, Phone & Duration */}
        <View style={styles.cardHeader}>
          <View style={styles.studentInfoLeft}>
            <View style={[styles.avatarCircle, attended ? styles.avatarAttended : styles.avatarMissed]}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.studentName} numberOfLines={1}>
                  {item.studentName || "Student Inquiry"}
                </Text>
                <View style={styles.phonePill}>
                  <Text style={styles.phoneText}>{phoneDisplay}</Text>
                </View>
              </View>
              {courseDisplay ? (
                <Text style={styles.courseText} numberOfLines={1}>
                  Course: <Text style={styles.courseHighlight}>{courseDisplay}</Text>
                </Text>
              ) : null}
            </View>
          </View>

          {/* Talk Duration Badge */}
          <View style={[styles.durationBadge, attended ? styles.durationAttended : styles.durationZero]}>
            <Clock size={11} color={attended ? "#065F46" : "#64748B"} strokeWidth={2.2} />
            <Text style={[styles.durationText, attended ? styles.durationTextAttended : styles.durationTextZero]}>
              {durSec > 0 ? formatTalkDuration(durSec) : "00:00"}
            </Text>
          </View>
        </View>

        {/* Academic Details (College & Qualification) */}
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

        {/* Audit Meta Badges (Staff, Status, Time Range, Mindset) */}
        <View style={styles.badgesWrap}>
          {/* Caller Staff Badge */}
          <View style={styles.staffBadge}>
            <User size={11} color="#4338CA" strokeWidth={2.2} />
            <Text style={styles.staffBadgeText}>
              Caller: <Text style={{ fontWeight: "800" }}>{item.callerName || "Staff"}</Text>
            </Text>
          </View>

          {/* Attended vs Not Attended */}
          <View style={[styles.statusBadge, attended ? styles.statusAttended : styles.statusMissed]}>
            <View style={[styles.statusDot, attended ? styles.dotAttended : styles.dotMissed]} />
            <Text style={[styles.statusText, attended ? styles.statusTextAttended : styles.statusTextMissed]}>
              {attended ? "Attended Call" : "Not Attended"}
            </Text>
          </View>

          {/* Mindset Pill */}
          {mindset ? (
            <View style={styles.mindsetBadge}>
              <Text style={styles.mindsetText}>Mindset: {mindset}</Text>
            </View>
          ) : null}

          {/* Time & Date */}
          {timeRangeStr || dateDisplay ? (
            <View style={styles.timeBadge}>
              <Text style={styles.timeBadgeText}>
                {timeRangeStr} {dateDisplay ? `• ${dateDisplay}` : ""}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Remarks / Notes Quote Box */}
        {remarks ? (
          <View style={styles.remarksBox}>
            <Text style={styles.remarksText} numberOfLines={3}>
              "{remarks}"
            </Text>
          </View>
        ) : null}

        {/* Bottom Actions: 1-Tap SIM Call & 1-Tap WhatsApp */}
        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.actionCallBtn}
            onPress={() => handleSIMCall(phoneDisplay, item.studentName)}
            activeOpacity={0.8}
          >
            <Phone size={13} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.actionCallText}>SIM Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionWaBtn}
            onPress={() => handleWhatsApp(phoneDisplay, item.studentName, courseDisplay)}
            activeOpacity={0.8}
          >
            <MessageCircle size={13} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.actionWaText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const formatTalkDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      {/* 1. Header Bar with Cloud Sync */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.headerTitleRow}>
            <PhoneCall size={20} color="#1E40AF" strokeWidth={2.5} />
            <Text style={styles.headerTitle}>Telecaller Audit Feed</Text>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>
            Real-time feed of all academy calls synced from CRM
          </Text>
        </View>

        <TouchableOpacity
          style={styles.syncBtn}
          onPress={handleSyncCloud}
          disabled={syncing}
          activeOpacity={0.7}
        >
          {syncing ? (
            <ActivityIndicator size="small" color="#1D4ED8" />
          ) : (
            <>
              <RefreshCw size={13} color="#1D4ED8" strokeWidth={2.4} style={{ marginRight: 4 }} />
              <Text style={styles.syncBtnText}>Sync Cloud</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Main Scrollable Content */}
      <FlatList
        data={filteredCalls}
        keyExtractor={(item, index) => `${item.id || item.phone || "call"}-${index}`}
        renderItem={renderCallCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            tintColor="#2563EB"
            colors={["#2563EB"]}
          />
        }
        ListHeaderComponent={
          <View style={styles.topSection}>
            {/* 2. Top 5 Executive KPI Cards (Web Telecaller Audit Desk Match) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.kpiScroll}
            >
              {/* KPI 1: Total Calls */}
              <View style={[styles.kpiCard, styles.kpiCardNavy]}>
                <Text style={styles.kpiLabel}>TOTAL CALLS</Text>
                <Text style={styles.kpiValueNavy}>{totalAcademyCalls}</Text>
                <Text style={styles.kpiSub}>All Telecallers</Text>
              </View>

              {/* KPI 2: Total Spoken Minutes */}
              <View style={[styles.kpiCard, styles.kpiCardEmerald]}>
                <View style={styles.kpiHeaderRow}>
                  <Text style={[styles.kpiLabel, { color: "#065F46" }]}>TOTAL TALK TIME</Text>
                  <View style={styles.pulseDot} />
                </View>
                <Text style={styles.kpiValueEmerald}>{formatSpokenMinutes(totalAcademySeconds)}</Text>
                <View style={styles.liveTalkBadge}>
                  <Text style={styles.liveTalkText}>Live SIM Voice</Text>
                </View>
              </View>

              {/* KPI 3: Attended Calls */}
              <View style={[styles.kpiCard, styles.kpiCardEmeraldLight]}>
                <Text style={[styles.kpiLabel, { color: "#065F46" }]}>ATTENDED (SPOKEN)</Text>
                <Text style={styles.kpiValueEmerald}>{attendedCallsCount}</Text>
                <View style={styles.pctBadgeEmerald}>
                  <Text style={styles.pctTextEmerald}>{pickedPercentage}% Picked</Text>
                </View>
              </View>

              {/* KPI 4: Not Attended / Rejected */}
              <View style={[styles.kpiCard, styles.kpiCardRose]}>
                <Text style={[styles.kpiLabel, { color: "#991B1B" }]}>MISSED / CUT</Text>
                <Text style={styles.kpiValueRose}>{notAttendedCallsCount}</Text>
                <View style={styles.pctBadgeRose}>
                  <Text style={styles.pctTextRose}>{missedPercentage}% Missed</Text>
                </View>
              </View>

              {/* KPI 5: Active Telecaller Staff */}
              <View style={[styles.kpiCard, styles.kpiCardPurple]}>
                <Text style={[styles.kpiLabel, { color: "#3730A3" }]}>TELECALLER TEAM</Text>
                <Text style={styles.kpiValuePurple}>{WEGROW_STAFF_MEMBERS.length} Active</Text>
                <Text style={styles.kpiSubPurple}>Online & Synced</Text>
              </View>
            </ScrollView>

            {/* 3. Staff Filter Horizontal Selector */}
            <View style={styles.filterSection}>
              <View style={styles.filterTitleRow}>
                <User size={13} color="#475569" strokeWidth={2.2} />
                <Text style={styles.filterSectionTitle}>Filter by Telecaller Staff:</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterChipsRow}
              >
                <TouchableOpacity
                  style={[styles.chip, staffFilter === "All" && styles.chipActive]}
                  onPress={() => setStaffFilter("All")}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, staffFilter === "All" && styles.chipTextActive]}>
                    All Staff ({totalAcademyCalls})
                  </Text>
                </TouchableOpacity>

                {WEGROW_STAFF_MEMBERS.map((staff) => {
                  const count = allCalls.filter((c) => (c.callerName || "").toLowerCase().includes(staff.toLowerCase())).length;
                  const isSelected = staffFilter === staff;
                  return (
                    <TouchableOpacity
                      key={staff}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => setStaffFilter(staff)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {staff} ({count})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* 4. Call Status Filter (All | Attended | Missed) */}
            <View style={styles.statusFilterRow}>
              <TouchableOpacity
                style={[styles.statusTabBtn, statusFilter === "All" && styles.statusTabBtnActive]}
                onPress={() => setStatusFilter("All")}
                activeOpacity={0.7}
              >
                <Text style={[styles.statusTabText, statusFilter === "All" && styles.statusTabTextActive]}>
                  All Calls ({totalAcademyCalls})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusTabBtn, statusFilter === "Attended" && styles.statusTabBtnAttended]}
                onPress={() => setStatusFilter("Attended")}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.statusTabText,
                    statusFilter === "Attended" && styles.statusTabTextAttended,
                  ]}
                >
                  🟢 Attended ({attendedCallsCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusTabBtn, statusFilter === "Not Attended" && styles.statusTabBtnMissed]}
                onPress={() => setStatusFilter("Not Attended")}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.statusTabText,
                    statusFilter === "Not Attended" && styles.statusTabTextMissed,
                  ]}
                >
                  🔴 Missed ({notAttendedCallsCount})
                </Text>
              </TouchableOpacity>
            </View>

            {/* 5. Live Search Input */}
            <View style={styles.searchBox}>
              <Search size={15} color="#94A3B8" strokeWidth={2} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search student, phone, staff, course, remarks..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearBtn}>
                  <X size={14} color="#64748B" strokeWidth={2.5} />
                </TouchableOpacity>
              )}
            </View>

            {/* Feed Counter Banner */}
            <View style={styles.feedHeader}>
              <Text style={styles.feedCountText}>
                Showing <Text style={{ fontWeight: "800", color: "#0F172A" }}>{filteredCalls.length}</Text> of{" "}
                {totalAcademyCalls} calls
              </Text>
              {staffFilter !== "All" && (
                <View style={styles.activeStaffTag}>
                  <Text style={styles.activeStaffTagText}>Staff: {staffFilter}</Text>
                </View>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <PhoneCall size={36} color="#CBD5E1" strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No calls found</Text>
            <Text style={styles.emptySub}>
              Try clearing your search query or switching staff filter to "All Staff".
            </Text>
          </View>
        }
      />
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
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  liveText: {
    color: "#065F46",
    fontSize: 10,
    fontWeight: "800",
  },
  headerSubtitle: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 2,
  },
  syncBtn: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    flexDirection: "row",
    alignItems: "center",
  },
  syncBtnText: {
    color: "#1D4ED8",
    fontSize: 11,
    fontWeight: "800",
  },
  listContent: {
    paddingBottom: 36,
  },
  topSection: {
    paddingTop: 12,
  },

  // KPI Scroll
  kpiScroll: {
    paddingHorizontal: 14,
    gap: 10,
    paddingBottom: 12,
  },
  kpiCard: {
    width: 138,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    justifyContent: "space-between",
  },
  kpiCardNavy: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CBD5E1",
  },
  kpiCardEmerald: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  kpiCardEmeraldLight: {
    backgroundColor: "#FFFFFF",
    borderColor: "#86EFAC",
  },
  kpiCardRose: {
    backgroundColor: "#FFF1F2",
    borderColor: "#FECDD3",
  },
  kpiCardPurple: {
    backgroundColor: "#F5F3FF",
    borderColor: "#DDD6FE",
  },
  kpiHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  kpiLabel: {
    color: "#64748B",
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  kpiValueNavy: {
    color: "#1E3A8A",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 4,
  },
  kpiValueEmerald: {
    color: "#047857",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 4,
  },
  kpiValueRose: {
    color: "#B91C1C",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 4,
  },
  kpiValuePurple: {
    color: "#4338CA",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4,
  },
  kpiSub: {
    color: "#94A3B8",
    fontSize: 10,
    marginTop: 2,
    fontWeight: "600",
  },
  kpiSubPurple: {
    color: "#6D28D9",
    fontSize: 10,
    marginTop: 2,
    fontWeight: "600",
  },
  liveTalkBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 3,
  },
  liveTalkText: {
    color: "#15803D",
    fontSize: 9,
    fontWeight: "800",
  },
  pctBadgeEmerald: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 3,
  },
  pctTextEmerald: {
    color: "#15803D",
    fontSize: 9.5,
    fontWeight: "800",
  },
  pctBadgeRose: {
    backgroundColor: "#FFE4E6",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 3,
  },
  pctTextRose: {
    color: "#BE123C",
    fontSize: 9.5,
    fontWeight: "800",
  },

  // Filter Section
  filterSection: {
    paddingHorizontal: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  filterTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 6,
  },
  filterSectionTitle: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "800",
  },
  filterChipsRow: {
    gap: 6,
  },
  chip: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 10,
  },
  chipActive: {
    backgroundColor: "#1E40AF",
    borderColor: "#1E40AF",
  },
  chipText: {
    color: "#334155",
    fontSize: 11,
    fontWeight: "700",
  },
  chipTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  // Status Filter Tabs
  statusFilterRow: {
    flexDirection: "row",
    paddingHorizontal: 14,
    gap: 6,
    marginBottom: 8,
  },
  statusTabBtn: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 7,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  statusTabBtnActive: {
    backgroundColor: "#0F172A",
    borderColor: "#0F172A",
  },
  statusTabBtnAttended: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  statusTabBtnMissed: {
    backgroundColor: "#DC2626",
    borderColor: "#DC2626",
  },
  statusTabText: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "700",
  },
  statusTabTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  statusTabTextAttended: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  statusTabTextMissed: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  // Search Box
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    marginHorizontal: 14,
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: "#0F172A",
    fontWeight: "500",
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },

  // Feed Header
  feedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  feedCountText: {
    color: "#64748B",
    fontSize: 11.5,
    fontWeight: "500",
  },
  activeStaffTag: {
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeStaffTagText: {
    color: "#4338CA",
    fontSize: 10,
    fontWeight: "700",
  },

  // Call Card
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 13,
    marginHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1.5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
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
  avatarAttended: {
    backgroundColor: "#1E40AF",
  },
  avatarMissed: {
    backgroundColor: "#475569",
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
  studentName: {
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
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 7,
    borderWidth: 1,
    marginLeft: 6,
  },
  durationAttended: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  durationZero: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
  },
  durationText: {
    fontSize: 11,
    fontFamily: "monospace",
    fontWeight: "800",
  },
  durationTextAttended: {
    color: "#065F46",
  },
  durationTextZero: {
    color: "#64748B",
  },

  // Academic Badges
  academicRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 2,
    marginBottom: 6,
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

  // Badges Wrap
  badgesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginVertical: 4,
  },
  staffBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3.5,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  staffBadgeText: {
    color: "#3730A3",
    fontSize: 10,
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusAttended: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  statusMissed: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  dotAttended: {
    backgroundColor: "#10B981",
  },
  dotMissed: {
    backgroundColor: "#EF4444",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  statusTextAttended: {
    color: "#065F46",
  },
  statusTextMissed: {
    color: "#991B1B",
  },
  mindsetBadge: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mindsetText: {
    color: "#1E40AF",
    fontSize: 10,
    fontWeight: "700",
  },
  timeBadge: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  timeBadgeText: {
    color: "#64748B",
    fontSize: 9.5,
    fontFamily: "monospace",
  },

  // Remarks Box
  remarksBox: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderLeftWidth: 3,
    borderLeftColor: "#2563EB",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    marginTop: 5,
    marginBottom: 6,
  },
  remarksText: {
    color: "#334155",
    fontSize: 10.5,
    fontStyle: "italic",
    lineHeight: 15,
  },

  // Card Footer Actions
  cardFooter: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    marginTop: 4,
  },
  actionCallBtn: {
    flex: 1,
    backgroundColor: "#2563EB",
    borderRadius: 8,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  actionCallText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "800",
  },
  actionWaBtn: {
    flex: 1,
    backgroundColor: "#059669",
    borderRadius: 8,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  actionWaText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "800",
  },

  // Empty State
  emptyContainer: {
    paddingVertical: 45,
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
    lineHeight: 16,
  },
});
