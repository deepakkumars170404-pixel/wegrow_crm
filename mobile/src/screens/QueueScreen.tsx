import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  AppState,
  AppStateStatus,
  Platform,
} from "react-native";
import { THEME } from "../constants/theme";
import { Lead } from "../types";
import { ApiService } from "../services/api";
import { TelephonyService, NativeCallStateEvent } from "../services/telephony";
import { CallModal } from "./CallModal";
import { LiveClock } from "../components/LiveClock";

export const QueueScreen: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active call session tracking
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [callModalVisible, setCallModalVisible] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Precise call phases: "IDLE" -> "RINGING" -> "CONNECTED" -> "IDLE"
  const [callPhase, setCallPhase] = useState<"IDLE" | "RINGING" | "CONNECTED">("IDLE");
  const [liveTimerSec, setLiveTimerSec] = useState(0);

  const callPhaseRef = useRef<"IDLE" | "RINGING" | "CONNECTED">("IDLE");
  const activeCallStartRef = useRef<number | null>(null);
  const dialStartTimeRef = useRef<number | null>(null);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Live talk timer: ticks ONLY while call is answered & active (callPhase === "CONNECTED")!
  // Timer stays at 00:00 while ringing!
  useEffect(() => {
    let interval: any = null;
    if (callPhase === "CONNECTED") {
      interval = setInterval(() => {
        if (activeCallStartRef.current) {
          const elapsed = Math.max(1, Math.round((Date.now() - activeCallStartRef.current) / 1000));
          setLiveTimerSec(elapsed);
        }
      }, 1000);
    } else {
      setLiveTimerSec(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callPhase]);

  // Listen to native Android Telecom InCallService events (RINGING vs. ACTIVE vs. DISCONNECTED)
  useEffect(() => {
    const sub = TelephonyService.onCallStateChanged((event: NativeCallStateEvent) => {
      if (event.state === "ACTIVE") {
        // Remote party picked up / answered!
        if (callPhaseRef.current !== "CONNECTED") {
          callPhaseRef.current = "CONNECTED";
          setCallPhase("CONNECTED");
          activeCallStartRef.current = Date.now();
          setLiveTimerSec(1);
        }
      } else if (
        event.state === "DIALING" ||
        event.state === "RINGING" ||
        event.state === "CONNECTING"
      ) {
        if (callPhaseRef.current !== "CONNECTED") {
          callPhaseRef.current = "RINGING";
          setCallPhase("RINGING");
          setLiveTimerSec(0);
        }
      } else if (event.state === "DISCONNECTED") {
        if (callPhaseRef.current !== "IDLE") {
          const wasConnected = callPhaseRef.current === "CONNECTED";
          const start = activeCallStartRef.current;
          let finalSecs = 0;

          if (event.durationSeconds && event.durationSeconds > 0) {
            finalSecs = event.durationSeconds;
          } else if (wasConnected && start) {
            finalSecs = Math.max(1, Math.round((Date.now() - start) / 1000));
          }

          callPhaseRef.current = "IDLE";
          setCallPhase("IDLE");
          setCallDuration(finalSecs);
          setCallModalVisible(true);
        }
      }
    });

    return () => {
      sub.remove();
    };
  }, []);

  const handleInAppHangup = async () => {
    await TelephonyService.endCall();
    const wasConnected = callPhaseRef.current === "CONNECTED";
    const start = activeCallStartRef.current;
    let finalSecs = 0;
    if (wasConnected && start) {
      finalSecs = Math.max(1, Math.round((Date.now() - start) / 1000));
    }
    callPhaseRef.current = "IDLE";
    setCallPhase("IDLE");
    setCallDuration(finalSecs);
    setCallModalVisible(true);
  };

  // Re-check call state if app returns from background / default dialer
  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (nextAppState: AppStateStatus) => {
      if (nextAppState === "active" && callPhaseRef.current !== "IDLE") {
        const state = await TelephonyService.getCurrentCallState();
        if (state && (state.state === "DISCONNECTED" || state.state === "UNKNOWN")) {
          const wasConnected = callPhaseRef.current === "CONNECTED";
          const start = activeCallStartRef.current;
          let finalSecs = 0;
          if (state.durationSeconds && state.durationSeconds > 0) {
            finalSecs = state.durationSeconds;
          } else if (wasConnected && start) {
            finalSecs = Math.max(1, Math.round((Date.now() - start) / 1000));
          }
          callPhaseRef.current = "IDLE";
          setCallPhase("IDLE");
          setCallDuration(finalSecs);
          setCallModalVisible(true);
        }
      }
    });

    return () => subscription.remove();
  }, []);

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
    const now = Date.now();
    dialStartTimeRef.current = now;
    activeCallStartRef.current = null;
    callPhaseRef.current = "RINGING";
    setCallPhase("RINGING");
    setLiveTimerSec(0);

    // Dial directly via Android SIM card
    const res = await TelephonyService.dialViaSIM(lead.phone, lead.studentName);
    if (!res.success) {
      callPhaseRef.current = "IDLE";
      setCallPhase("IDLE");
    }
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
            <Text style={styles.callButtonText}>📞 Call SIM</Text>
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
          <LiveClock style={styles.liveClockText} prefix="🕒 " />
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

      {/* In-App Active Call Screen Overlay: keeps Wegrow Telecaller in foreground */}
      {callPhase !== "IDLE" && activeLead && (
        <View style={styles.inAppCallOverlay}>
          <View style={styles.inAppCallCard}>
            <View style={styles.inAppCallHeader}>
              <View
                style={[
                  styles.inAppCallLiveBadge,
                  callPhase === "RINGING" && styles.inAppCallRingingBadge,
                ]}
              >
                <View
                  style={[
                    styles.inAppCallLiveDot,
                    callPhase === "RINGING" && styles.inAppCallRingingDot,
                  ]}
                />
                <Text
                  style={[
                    styles.inAppCallLiveText,
                    callPhase === "RINGING" && styles.inAppCallRingingText,
                  ]}
                >
                  {callPhase === "RINGING" ? "🔔 RINGING... (WAITING FOR ANSWER)" : "🟢 SPEAKING • LIVE CALL"}
                </Text>
              </View>
              <Text
                style={[
                  styles.inAppCallTimer,
                  callPhase === "RINGING" && styles.inAppCallTimerRinging,
                ]}
              >
                ⏱️ {callPhase === "RINGING" ? "00:00" : formatTimer(liveTimerSec)}
              </Text>
            </View>

            <Text style={styles.inAppCallName}>{activeLead.studentName}</Text>
            <Text style={styles.inAppCallPhone}>📞 {activeLead.phone}</Text>
            <Text style={styles.inAppCallCourse}>Course: {activeLead.courseInterested}</Text>
            <Text style={styles.inAppCallHint}>
              {callPhase === "RINGING"
                ? "Connecting via Wegrow SIM • Timer starts when student answers"
                : "Call connected • Counting live spoken minutes"}
            </Text>

            <View style={styles.inAppCallActions}>
              <TouchableOpacity
                style={styles.inAppHangupBtn}
                onPress={handleInAppHangup}
                activeOpacity={0.8}
              >
                <Text style={styles.inAppHangupText}>🔴 Cut Call (Hangup & Save Notes)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  liveClockBadge: {
    backgroundColor: "#0d1b2a",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.gold,
  },
  liveClockText: {
    color: THEME.colors.gold,
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
