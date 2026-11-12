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
  const [matchedLead, setMatchedLead] = useState<Lead | null>(null);
  const [activeStaff, setActiveStaff] = useState<StaffMember>("MuthuSelvi");

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const activeCallStartRef = useRef<number | null>(null);
  const currentPhoneNumberRef = useRef<string>("");

  // Load active staff
  useEffect(() => {
    StorageService.getSettings().then((s) => {
      if (s.callerName) setActiveStaff(s.callerName as StaffMember);
    });
  }, []);

  // Pulsing animation for ringing
  useEffect(() => {
    if (callState === "RINGING" || callState === "DIALING") {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
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
    await TelephonyService.answerCall();
    activeCallStartRef.current = Date.now();
    setCallState("ACTIVE");
    setLiveDurationSec(1);
  };

  const handleHangup = async () => {
    await TelephonyService.endCall();
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
            👤 Staff on Duty: <Text style={{ color: THEME.colors.gold }}>{activeStaff}</Text>
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
            /* Incoming Call Controls: Big Green Attend + Big Red Decline */
            <View style={styles.incomingActionRow}>
              {/* Decline Button */}
              <TouchableOpacity
                style={[styles.bigCallButton, styles.declineButton]}
                onPress={handleHangup}
                activeOpacity={0.8}
              >
                <Text style={styles.bigButtonIcon}>❌</Text>
                <Text style={styles.bigButtonLabel}>DECLINE</Text>
              </TouchableOpacity>

              {/* Attend Button */}
              <TouchableOpacity
                style={[styles.bigCallButton, styles.attendButton]}
                onPress={handleAnswer}
                activeOpacity={0.8}
              >
                <Text style={styles.bigButtonIcon}>📞</Text>
                <Text style={styles.bigButtonLabel}>ATTEND</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Active Call Controls: Mute, Speaker, Keypad, End Call */
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

                {/* Add Call Button */}
                <TouchableOpacity
                  style={styles.controlBtn}
                  onPress={() => {}}
                  activeOpacity={0.7}
                >
                  <Text style={styles.controlIcon}>➕</Text>
                  <Text style={styles.controlLabel}>Add Call</Text>
                </TouchableOpacity>
              </View>

              {/* Big Red End Call Button */}
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
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1528",
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
    color: THEME.colors.textSecondary,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  courseBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: THEME.colors.emerald,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },
  courseBadgeText: {
    color: THEME.colors.emerald,
    fontSize: 12,
    fontWeight: "700",
  },
  centerArea: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  avatarContainer: {
    marginBottom: 24,
  },
  avatarInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  avatarIncoming: {
    backgroundColor: "#1D4ED8",
    shadowColor: "#3B82F6",
  },
  avatarActive: {
    backgroundColor: "#047857",
    shadowColor: "#10B981",
  },
  avatarIcon: {
    fontSize: 48,
  },
  callerName: {
    fontSize: 28,
    fontWeight: "800",
    color: THEME.colors.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  callerPhone: {
    fontSize: 18,
    fontWeight: "600",
    color: THEME.colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 16,
  },
  statusBox: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "center",
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
    backgroundColor: "#10B981",
  },
  liveTimerText: {
    fontSize: 26,
    fontWeight: "800",
    color: "#10B981",
    letterSpacing: 1.5,
  },
  callStateLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#10B981",
    letterSpacing: 1,
    marginLeft: 4,
  },
  incomingLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#60A5FA",
    letterSpacing: 0.5,
  },
  dialingLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: THEME.colors.gold,
    letterSpacing: 0.5,
  },
  keypadOverlay: {
    backgroundColor: "rgba(11, 21, 40, 0.95)",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  keypadGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  keypadBtn: {
    width: "30%",
    aspectRatio: 1.6,
    backgroundColor: THEME.colors.surfaceLight,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  keypadDigit: {
    fontSize: 20,
    fontWeight: "800",
    color: THEME.colors.textPrimary,
  },
  bottomArea: {
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  incomingActionRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  bigCallButton: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  declineButton: {
    backgroundColor: "#DC2626",
    shadowColor: "#EF4444",
  },
  attendButton: {
    backgroundColor: "#16A34A",
    shadowColor: "#22C55E",
  },
  bigButtonIcon: {
    fontSize: 38,
    marginBottom: 4,
  },
  bigButtonLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  activeControlsContainer: {
    gap: 24,
  },
  controlsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  controlBtn: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: THEME.colors.surfaceLight,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  controlBtnActive: {
    backgroundColor: "rgba(213, 165, 43, 0.25)",
    borderColor: THEME.colors.gold,
  },
  controlIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  controlLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: THEME.colors.textSecondary,
  },
  controlLabelActive: {
    color: THEME.colors.gold,
    fontWeight: "800",
  },
  hangupButton: {
    backgroundColor: "#DC2626",
    borderRadius: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  hangupIcon: {
    fontSize: 22,
  },
  hangupLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
});
