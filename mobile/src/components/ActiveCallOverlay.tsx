import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  Vibration,
  PanResponder,
  Alert,
  ScrollView,
} from "react-native";
import { THEME } from "../constants/theme";
import { TelephonyService, NativeCallStateEvent } from "../services/telephony";
import { StorageService } from "../services/storage";
import { Lead, StaffMember } from "../types";

interface ActiveCallOverlayProps {
  onCallEnded: (callData: {
    phoneNumber: string;
    studentName: string;
    durationSeconds: number;
    lead: Lead | null;
  }) => void;
}

export const ActiveCallOverlay: React.FC<ActiveCallOverlayProps> = ({ onCallEnded }) => {
  const [callState, setCallState] = useState<string>("IDLE");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [contactName, setContactName] = useState<string>("");
  const [isIncoming, setIsIncoming] = useState<boolean>(false);
  const [isSpeaker, setIsSpeaker] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [liveDurationSec, setLiveDurationSec] = useState<number>(0);
  const [showKeypad, setShowKeypad] = useState<boolean>(false);
  const [showAddCallSheet, setShowAddCallSheet] = useState<boolean>(false);
  const [addCallNumber, setAddCallNumber] = useState<string>("");
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [matchedLead, setMatchedLead] = useState<Lead | null>(null);
  const [activeStaff, setActiveStaff] = useState<StaffMember>("MuthuSelvi");

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const activeCallStartRef = useRef<number | null>(null);
  const currentPhoneNumberRef = useRef<string>("");

  // Swipe gesture for incoming call: left = decline, right = answer
  const swipePan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  // Load active staff and leads cache
  useEffect(() => {
    StorageService.getSettings().then((s) => {
      if (s.callerName) setActiveStaff(s.callerName as StaffMember);
    });
    StorageService.getCachedLeads().then((leads) => {
      if (leads && leads.length > 0) setRecentLeads(leads.slice(0, 10));
    });
  }, []);

  // Pulsing animation for ringing
  useEffect(() => {
    if (callState === "RINGING" || callState === "DIALING") {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [callState]);

  // Live talk timer: ticks ONLY while call is ACTIVE!
  useEffect(() => {
    let interval: any = null;
    if (callState === "ACTIVE") {
      interval = setInterval(() => {
        if (activeCallStartRef.current) {
          const elapsed = Math.max(1, Math.round((Date.now() - activeCallStartRef.current) / 1000));
          setLiveDurationSec(elapsed);
        }
      }, 1000);
    } else {
      setLiveDurationSec(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState]);

  // Lookup lead from cached storage when phone number arrives
  const lookupLead = async (rawPhone: string) => {
    if (!rawPhone) return;
    const cleanDigits = rawPhone.replace(/\D/g, "");
    const last10 = cleanDigits.slice(-10);
    const leads = await StorageService.getCachedLeads();
    const found = leads.find((l) => l.phone.replace(/\D/g, "").slice(-10) === last10);
    if (found) {
      setMatchedLead(found);
      if (!contactName) {
        setContactName(found.studentName);
      }
    } else {
      setMatchedLead(null);
    }
  };

  // Listen to native InCallService events
  useEffect(() => {
    const sub = TelephonyService.onCallStateChanged(async (event: NativeCallStateEvent) => {
      const state = event.state || "UNKNOWN";
      const phone = event.phoneNumber || currentPhoneNumberRef.current;
      currentPhoneNumberRef.current = phone;
      setPhoneNumber(phone);

      if (event.contactName) {
        setContactName(event.contactName);
      }
      if (event.isIncoming !== undefined) {
        setIsIncoming(event.isIncoming);
      }
      if (event.isSpeaker !== undefined) {
        setIsSpeaker(event.isSpeaker);
      }
      if (event.isMuted !== undefined) {
        setIsMuted(event.isMuted);
      }

      if (state === "ACTIVE") {
        if (callState !== "ACTIVE") {
          activeCallStartRef.current = Date.now();
          setLiveDurationSec(1);
        }
        setCallState("ACTIVE");
      } else if (state === "RINGING" || state === "DIALING" || state === "CONNECTING") {
        setCallState("RINGING");
        lookupLead(phone);
        if (event.isIncoming) {
          Vibration.vibrate([0, 500, 400, 500]);
        }
      } else if (state === "DISCONNECTED") {
        const finalSecs = activeCallStartRef.current
          ? Math.max(1, Math.round((Date.now() - activeCallStartRef.current) / 1000))
          : event.durationSeconds || 0;

        const resolvedName = contactName || matchedLead?.studentName || "Student Enquiry";
        const currentPhone = phone || currentPhoneNumberRef.current;

        setCallState("IDLE");
        activeCallStartRef.current = null;
        setShowKeypad(false);
        setShowAddCallSheet(false);

        if (currentPhone) {
          onCallEnded({
            phoneNumber: currentPhone,
            studentName: resolvedName,
            durationSeconds: finalSecs,
            lead: matchedLead,
          });
        }
      }
    });

    return () => sub.remove();
  }, [callState, contactName, matchedLead]);

  const handleAnswer = async () => {
    try {
      Vibration.vibrate(70);
      await TelephonyService.answerCall();
      activeCallStartRef.current = Date.now();
      setCallState("ACTIVE");
      setLiveDurationSec(1);
    } catch {}
  };

  const handleHangup = async () => {
    try {
      Vibration.vibrate(70);
      await TelephonyService.endCall();
    } catch {}
  };

  const handleToggleSpeaker = async () => {
    const next = !isSpeaker;
    setIsSpeaker(next);
    await TelephonyService.setSpeaker(next);
  };

  const handleToggleMute = async () => {
    const next = !isMuted;
    setIsMuted(next);
    await TelephonyService.setMute(next);
  };

  const handleDtmf = async (digit: string) => {
    await TelephonyService.sendDtmf(digit);
  };

  // Add Call Handler
  const handleOpenAddCall = async () => {
    setShowAddCallSheet(true);
    const leads = await StorageService.getCachedLeads();
    if (leads && leads.length > 0) setRecentLeads(leads.slice(0, 10));
  };

  const handleAddCallKeyPress = (digit: string) => {
    if (addCallNumber.length < 15) {
      setAddCallNumber((prev) => prev + digit);
    }
  };

  const handleDialSecondCall = async () => {
    if (!addCallNumber || addCallNumber.trim().length < 5) {
      Alert.alert("Invalid Number", "Please enter a valid phone number to call.");
      return;
    }
    if (TelephonyService.isBlockedNumber(addCallNumber)) {
      Alert.alert("Blocked", "Calling 9952337331 is permanently blocked.");
      return;
    }

    try {
      // Put first call on hold
      await TelephonyService.holdCall();
      // Dial second call
      await TelephonyService.dialViaSIM(addCallNumber.trim());
      setShowAddCallSheet(false);
      setAddCallNumber("");
    } catch (e: any) {
      Alert.alert("Call Error", e.message || "Failed to place second call");
    }
  };

  // PanResponder for Swipe-to-Answer / Swipe-to-Decline
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        const clampedX = Math.max(-120, Math.min(120, gestureState.dx));
        swipePan.setValue({ x: clampedX, y: 0 });
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 75) {
          // Swiped Right -> Answer
          Animated.timing(swipePan, {
            toValue: { x: 120, y: 0 },
            duration: 120,
            useNativeDriver: false,
          }).start(() => {
            handleAnswer();
            swipePan.setValue({ x: 0, y: 0 });
          });
        } else if (gestureState.dx < -75) {
          // Swiped Left -> Decline
          Animated.timing(swipePan, {
            toValue: { x: -120, y: 0 },
            duration: 120,
            useNativeDriver: false,
          }).start(() => {
            handleHangup();
            swipePan.setValue({ x: 0, y: 0 });
          });
        } else {
          // Snap back to center
          Animated.spring(swipePan, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            tension: 40,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const isVisible =
    callState === "RINGING" ||
    callState === "DIALING" ||
    callState === "ACTIVE" ||
    callState === "CONNECTING";

  if (!isVisible) return null;

  const displayName =
    contactName ||
    matchedLead?.studentName ||
    (isIncoming ? "Incoming Student Call" : "Calling Student...");

  return (
    <Modal visible={isVisible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <Text style={styles.staffDutyBadge}>
            👤 Staff on Duty: <Text style={{ color: "#2563EB", fontWeight: "800" }}>{activeStaff}</Text>
          </Text>
          {matchedLead?.courseInterested ? (
            <View style={styles.courseBadge}>
              <Text style={styles.courseBadgeText}>🎓 {matchedLead.courseInterested}</Text>
            </View>
          ) : null}
        </View>

        {/* Center Caller Info & Pulsing Avatar */}
        <View style={styles.centerArea}>
          <Animated.View
            style={[
              styles.avatarContainer,
              (callState === "RINGING" || callState === "DIALING") && {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <View style={[styles.avatarInner, isIncoming ? styles.avatarIncoming : styles.avatarActive]}>
              <Text style={styles.avatarIcon}>{isIncoming ? "🔔" : "📞"}</Text>
            </View>
          </Animated.View>

          <Text style={styles.callerName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.callerPhone}>{phoneNumber || "Unknown Number"}</Text>

          {/* Status & Live Timer */}
          <View style={styles.statusBox}>
            {callState === "ACTIVE" ? (
              <View style={styles.activeTimerRow}>
                <View style={styles.greenPulseDot} />
                <Text style={styles.liveTimerText}>{formatTimer(liveDurationSec)}</Text>
                <Text style={styles.callStateLabel}>LIVE CALL</Text>
              </View>
            ) : isIncoming ? (
              <Text style={styles.incomingLabel}>INCOMING CALL • RINGING...</Text>
            ) : (
              <Text style={styles.dialingLabel}>DIALING • CONNECTING...</Text>
            )}
          </View>
        </View>

        {/* Keypad Overlay (if open) */}
        {showKeypad && callState === "ACTIVE" && (
          <View style={styles.keypadOverlay}>
            <View style={styles.keypadGrid}>
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={styles.keypadBtn}
                  onPress={() => handleDtmf(d)}
                  activeOpacity={0.6}
                >
                  <Text style={styles.keypadDigit}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Bottom Control Controls */}
        <View style={styles.bottomArea}>
          {isIncoming && callState === "RINGING" ? (
            /* Modern Swipe-to-Answer / Swipe-to-Decline Gesture Bar */
            <View style={styles.swipeContainer}>
              <View style={styles.swipeTrack}>
                {/* Left Decline Zone */}
                <TouchableOpacity
                  style={styles.leftTrackZone}
                  onPress={handleHangup}
                  activeOpacity={0.7}
                >
                  <Text style={styles.declineChevron}>««</Text>
                  <Text style={styles.declineText}>Decline</Text>
                </TouchableOpacity>

                {/* Right Attend Zone */}
                <TouchableOpacity
                  style={styles.rightTrackZone}
                  onPress={handleAnswer}
                  activeOpacity={0.7}
                >
                  <Text style={styles.attendText}>Answer</Text>
                  <Text style={styles.attendChevron}>»»</Text>
                </TouchableOpacity>

                {/* Draggable Knob */}
                <Animated.View
                  style={[
                    styles.draggableKnob,
                    {
                      transform: [{ translateX: swipePan.x }],
                    },
                  ]}
                  {...panResponder.panHandlers}
                >
                  <View style={styles.knobInner}>
                    <Text style={styles.knobIcon}>📞</Text>
                  </View>
                </Animated.View>
              </View>

              {/* Swipe Guidance Subtitle */}
              <Text style={styles.swipeHelpText}>
                ⇦ Swipe Left to Decline  •  Swipe Right to Answer ⇨
              </Text>
            </View>
          ) : (
            /* Active Call Controls: Mute, Speaker, Keypad, Add Call, End Call */
            <View style={styles.activeControlsContainer}>
              <View style={styles.controlsGrid}>
                {/* Mute Button */}
                <TouchableOpacity
                  style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
                  onPress={handleToggleMute}
                  activeOpacity={0.7}
                >
                  <Text style={styles.controlIcon}>{isMuted ? "🔇" : "🎤"}</Text>
                  <Text style={[styles.controlLabel, isMuted && styles.controlLabelActive]}>
                    {isMuted ? "Muted" : "Mute"}
                  </Text>
                </TouchableOpacity>

                {/* Speaker Button */}
                <TouchableOpacity
                  style={[styles.controlBtn, isSpeaker && styles.controlBtnActive]}
                  onPress={handleToggleSpeaker}
                  activeOpacity={0.7}
                >
                  <Text style={styles.controlIcon}>{isSpeaker ? "🔊" : "🔈"}</Text>
                  <Text style={[styles.controlLabel, isSpeaker && styles.controlLabelActive]}>
                    {isSpeaker ? "Speaker On" : "Speaker"}
                  </Text>
                </TouchableOpacity>

                {/* Keypad Button */}
                <TouchableOpacity
                  style={[styles.controlBtn, showKeypad && styles.controlBtnActive]}
                  onPress={() => setShowKeypad(!showKeypad)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.controlIcon}>🔢</Text>
                  <Text style={[styles.controlLabel, showKeypad && styles.controlLabelActive]}>
                    Keypad
                  </Text>
                </TouchableOpacity>

                {/* Add Call Button (Now Fully Functional!) */}
                <TouchableOpacity
                  style={styles.controlBtn}
                  onPress={handleOpenAddCall}
                  activeOpacity={0.7}
                >
                  <Text style={styles.controlIcon}>➕</Text>
                  <Text style={styles.controlLabel}>Add Call</Text>
                </TouchableOpacity>
              </View>

              {/* Sleek Crimson End Call Button */}
              <TouchableOpacity
                style={styles.hangupButton}
                onPress={handleHangup}
                activeOpacity={0.8}
              >
                <Text style={styles.hangupIcon}>📵</Text>
                <Text style={styles.hangupLabel}>END CALL</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Add Call Modal Sheet */}
        <Modal
          visible={showAddCallSheet}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAddCallSheet(false)}
        >
          <View style={styles.addCallModalBackdrop}>
            <View style={styles.addCallSheet}>
              {/* Sheet Header */}
              <View style={styles.addCallHeader}>
                <View>
                  <Text style={styles.addCallTitle}>➕ Add Second Call</Text>
                  <Text style={styles.addCallSubtitle}>
                    Current call ({displayName}) will be put on Hold
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.closeSheetBtn}
                  onPress={() => setShowAddCallSheet(false)}
                >
                  <Text style={styles.closeSheetText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Phone Number Display */}
              <View style={styles.addCallInputBox}>
                <Text style={styles.addCallInputText}>
                  {addCallNumber || "Enter phone number"}
                </Text>
                {addCallNumber.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setAddCallNumber((prev) => prev.slice(0, -1))}
                    style={styles.addCallBackspace}
                  >
                    <Text style={styles.addCallBackspaceText}>⌫</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Quick Select from Today's Leads */}
              {recentLeads.length > 0 && (
                <View style={styles.quickLeadSection}>
                  <Text style={styles.quickLeadTitle}>QUICK SELECT STUDENT:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {recentLeads.map((ld) => (
                      <TouchableOpacity
                        key={ld.id}
                        style={styles.quickLeadChip}
                        onPress={() => setAddCallNumber(ld.phone)}
                      >
                        <Text style={styles.quickLeadName}>{ld.studentName}</Text>
                        <Text style={styles.quickLeadPhone}>{ld.phone}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Compact Keypad */}
              <View style={styles.addCallKeypad}>
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((k) => (
                  <TouchableOpacity
                    key={k}
                    style={styles.addCallKey}
                    onPress={() => handleAddCallKeyPress(k)}
                  >
                    <Text style={styles.addCallKeyText}>{k}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Action Buttons */}
              <View style={styles.addCallActionRow}>
                <TouchableOpacity
                  style={styles.cancelAddCallBtn}
                  onPress={() => setShowAddCallSheet(false)}
                >
                  <Text style={styles.cancelAddCallText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dialAddCallBtn}
                  onPress={handleDialSecondCall}
                >
                  <Text style={styles.dialAddCallIcon}>📞</Text>
                  <Text style={styles.dialAddCallText}>Dial Second Call</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "space-between",
  },
  topHeader: {
    alignItems: "center",
    paddingTop: 16,
    paddingHorizontal: 20,
    gap: 8,
  },
  staffDutyBadge: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  courseBadge: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },
  courseBadgeText: {
    color: "#065F46",
    fontSize: 12,
    fontWeight: "700",
  },
  centerArea: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatarInner: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarIncoming: {
    backgroundColor: "#2563EB",
    shadowColor: "#2563EB",
  },
  avatarActive: {
    backgroundColor: "#059669",
    shadowColor: "#059669",
  },
  avatarIcon: {
    fontSize: 44,
  },
  callerName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 6,
  },
  callerPhone: {
    fontSize: 17,
    fontWeight: "600",
    color: "#475569",
    letterSpacing: 1,
    marginBottom: 14,
  },
  statusBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  activeTimerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  greenPulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#059669",
  },
  liveTimerText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#059669",
    letterSpacing: 1.5,
  },
  callStateLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#059669",
    letterSpacing: 1,
    marginLeft: 4,
  },
  incomingLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563EB",
    letterSpacing: 0.5,
  },
  dialingLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#D97706",
    letterSpacing: 0.5,
  },
  keypadOverlay: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  keypadGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  keypadBtn: {
    width: "30%",
    aspectRatio: 1.6,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  keypadDigit: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  bottomArea: {
    paddingBottom: 36,
    paddingHorizontal: 20,
  },

  /* Modern Swipe-to-Answer / Swipe-to-Decline Track */
  swipeContainer: {
    alignItems: "center",
    width: "100%",
  },
  swipeTrack: {
    width: "100%",
    height: 68,
    backgroundColor: "#F1F5F9",
    borderRadius: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    position: "relative",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    overflow: "hidden",
  },
  leftTrackZone: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  declineChevron: {
    fontSize: 16,
    color: "#EF4444",
    fontWeight: "900",
  },
  declineText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#EF4444",
    letterSpacing: 0.5,
  },
  rightTrackZone: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  attendText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#10B981",
    letterSpacing: 0.5,
  },
  attendChevron: {
    fontSize: 16,
    color: "#10B981",
    fontWeight: "900",
  },
  draggableKnob: {
    position: "absolute",
    left: "50%",
    marginLeft: -28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  knobInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  knobIcon: {
    fontSize: 26,
  },
  swipeHelpText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 12,
    textAlign: "center",
  },

  /* Active Call Controls */
  activeControlsContainer: {
    gap: 20,
  },
  controlsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  controlBtn: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  controlBtnActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#3B82F6",
  },
  controlIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  controlLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  controlLabelActive: {
    color: "#2563EB",
    fontWeight: "800",
  },
  hangupButton: {
    backgroundColor: "#EF4444",
    borderRadius: 20,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  hangupIcon: {
    fontSize: 20,
  },
  hangupLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1,
  },

  /* Add Call Modal Sheet Styles */
  addCallModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  addCallSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderTopWidth: 2,
    borderTopColor: "#2563EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20,
  },
  addCallHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  addCallTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#0F172A",
  },
  addCallSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  closeSheetBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  closeSheetText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#64748B",
  },
  addCallInputBox: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addCallInputText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0F172A",
    letterSpacing: 1,
  },
  addCallBackspace: {
    padding: 4,
  },
  addCallBackspaceText: {
    fontSize: 20,
    color: "#64748B",
  },
  quickLeadSection: {
    marginBottom: 12,
  },
  quickLeadTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  quickLeadChip: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
  },
  quickLeadName: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  quickLeadPhone: {
    fontSize: 10,
    color: "#64748B",
  },
  addCallKeypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 16,
  },
  addCallKey: {
    width: "30%",
    aspectRatio: 1.8,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  addCallKeyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0F172A",
  },
  addCallActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  cancelAddCallBtn: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cancelAddCallText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
  },
  dialAddCallBtn: {
    flex: 2,
    backgroundColor: "#10B981",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  dialAddCallIcon: {
    fontSize: 16,
  },
  dialAddCallText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});
