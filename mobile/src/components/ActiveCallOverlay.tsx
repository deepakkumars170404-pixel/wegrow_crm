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
  Platform,
} from "react-native";
import { THEME } from "../constants/theme";
import {
  Phone,
  PhoneCall,
  PhoneOff,
  PhoneIncoming,
  ChevronsLeft,
  ChevronsRight,
  Mic,
  MicOff,
  Volume2,
  Grid3X3,
  UserPlus,
  Users,
  ArrowLeftRight,
  UserCheck,
  GraduationCap,
  User,
  X,
  Delete,
  Sparkles,
} from "lucide-react-native";
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

  // Multi-Call / Conference Support
  const [hasHeldCall, setHasHeldCall] = useState<boolean>(false);
  const [heldPhoneNumber, setHeldPhoneNumber] = useState<string>("");
  const [heldContactName, setHeldContactName] = useState<string>("");
  const [isConference, setIsConference] = useState<boolean>(false);
  const [heldCallBackup, setHeldCallBackup] = useState<{
    phone: string;
    name: string;
    duration: number;
    lead: Lead | null;
  } | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;
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

  // Radar Pulse Waves Animation for Incoming Calls
  useEffect(() => {
    if (callState === "RINGING" || callState === "DIALING") {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
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
      pulseLoop.start();

      const waveLoop = Animated.loop(
        Animated.stagger(450, [
          Animated.timing(waveAnim1, {
            toValue: 1,
            duration: 1600,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim2, {
            toValue: 1,
            duration: 1600,
            useNativeDriver: true,
          }),
        ])
      );
      waveLoop.start();

      return () => {
        pulseLoop.stop();
        waveLoop.stop();
        waveAnim1.setValue(0);
        waveAnim2.setValue(0);
      };
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
      if (event.hasHeldCall !== undefined) {
        setHasHeldCall(event.hasHeldCall);
      }
      if (event.heldPhoneNumber !== undefined) {
        setHeldPhoneNumber(event.heldPhoneNumber);
      }
      if (event.heldContactName !== undefined) {
        setHeldContactName(event.heldContactName);
      }
      if (event.isConference !== undefined) {
        setIsConference(event.isConference);
      }

      if (state === "ACTIVE") {
        if (callState !== "ACTIVE") {
          activeCallStartRef.current = Date.now();
          setLiveDurationSec(1);
        }
        setCallState("ACTIVE");
      } else if (state === "HOLDING") {
        setCallState("HOLDING");
      } else if (state === "RINGING" || state === "DIALING" || state === "CONNECTING") {
        setCallState("RINGING");
        lookupLead(phone);
        if (event.isIncoming) {
          Vibration.vibrate([0, 500, 400, 500]);
        }
      } else if (state === "DISCONNECTED") {
        // If there is still a held call in background, seamlessly restore Call 1!
        if (event.hasHeldCall || hasHeldCall || heldCallBackup) {
          const backup = heldCallBackup;
          if (backup) {
            setPhoneNumber(backup.phone);
            currentPhoneNumberRef.current = backup.phone;
            setContactName(backup.name);
            setLiveDurationSec(backup.duration);
            setMatchedLead(backup.lead);
          }
          setHeldCallBackup(null);
          setHasHeldCall(false);
          setCallState("ACTIVE");
          TelephonyService.unholdCall().catch(() => {});
          return;
        }

        const finalSecs = activeCallStartRef.current
          ? Math.max(1, Math.round((Date.now() - activeCallStartRef.current) / 1000))
          : event.durationSeconds || 0;

        const resolvedName = contactName || matchedLead?.studentName || "Student Enquiry";
        const currentPhone = phone || currentPhoneNumberRef.current;

        setCallState("IDLE");
        activeCallStartRef.current = null;
        setShowKeypad(false);
        setShowAddCallSheet(false);
        setHeldCallBackup(null);
        setHasHeldCall(false);
        setIsConference(false);

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
  }, [callState, contactName, matchedLead, hasHeldCall, heldCallBackup]);

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
      // 1. Save backup snapshot of Call 1
      setHeldCallBackup({
        phone: phoneNumber,
        name: displayName,
        duration: liveDurationSec,
        lead: matchedLead,
      });

      // 2. Put first call on hold
      await TelephonyService.holdCall();

      // 3. 300ms buffer for carrier hold transition
      await new Promise((r) => setTimeout(r, 300));

      // 4. Dial second call via SIM
      await TelephonyService.dialViaSIM(addCallNumber.trim());

      setShowAddCallSheet(false);
      setAddCallNumber("");
    } catch (e: any) {
      Alert.alert("Call Error", e.message || "Failed to place second call");
    }
  };

  const handleMergeConference = async () => {
    try {
      Vibration.vibrate(60);
      const res = await TelephonyService.mergeCalls();
      if (res) {
        setIsConference(true);
        setHasHeldCall(false);
        setHeldCallBackup(null);
        Alert.alert("Conference Active", "Both calls are now merged into a 3-way conference call!");
      }
    } catch (e: any) {
      Alert.alert("Conference", e.message || "Failed to merge calls into conference");
    }
  };

  const handleSwapCalls = async () => {
    try {
      Vibration.vibrate(60);
      await TelephonyService.swapCalls();
      // Swap local display state
      const prevActivePhone = phoneNumber;
      const prevActiveName = displayName;
      const prevActiveDuration = liveDurationSec;
      const prevActiveLead = matchedLead;

      if (heldCallBackup) {
        setPhoneNumber(heldCallBackup.phone);
        currentPhoneNumberRef.current = heldCallBackup.phone;
        setContactName(heldCallBackup.name);
        setLiveDurationSec(heldCallBackup.duration);
        setMatchedLead(heldCallBackup.lead);
        setHeldCallBackup({
          phone: prevActivePhone,
          name: prevActiveName,
          duration: prevActiveDuration,
          lead: prevActiveLead,
        });
      } else if (heldPhoneNumber) {
        setPhoneNumber(heldPhoneNumber);
        currentPhoneNumberRef.current = heldPhoneNumber;
        setContactName(heldContactName);
        setHeldPhoneNumber(prevActivePhone);
        setHeldContactName(prevActiveName);
      }
    } catch (e: any) {
      Alert.alert("Swap Error", e.message || "Failed to swap calls");
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
    callState === "HOLDING" ||
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
          <View style={styles.staffDutyBadge}>
            <User size={13} color="#2563EB" style={{ marginRight: 5 }} />
            <Text style={styles.staffDutyText}>
              Staff on Duty: <Text style={{ color: "#2563EB", fontWeight: "800" }}>{activeStaff}</Text>
            </Text>
          </View>
          {matchedLead?.courseInterested ? (
            <View style={styles.courseBadge}>
              <GraduationCap size={13} color="#065F46" style={{ marginRight: 5 }} />
              <Text style={styles.courseBadgeText}>{matchedLead.courseInterested}</Text>
            </View>
          ) : null}
        </View>

        {/* Center Caller Info & High-End Radar Wave Avatar */}
        <View style={styles.centerArea}>
          <View style={styles.avatarWrapper}>
            {isIncoming && (
              <>
                <Animated.View
                  style={[
                    styles.radarRing,
                    {
                      transform: [
                        {
                          scale: waveAnim1.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.55],
                          }),
                        },
                      ],
                      opacity: waveAnim1.interpolate({
                        inputRange: [0, 0.7, 1],
                        outputRange: [0.55, 0.25, 0],
                      }),
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.radarRing,
                    {
                      transform: [
                        {
                          scale: waveAnim2.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.35],
                          }),
                        },
                      ],
                      opacity: waveAnim2.interpolate({
                        inputRange: [0, 0.7, 1],
                        outputRange: [0.65, 0.35, 0],
                      }),
                    },
                  ]}
                />
              </>
            )}

            <Animated.View
              style={[
                styles.avatarContainer,
                (callState === "RINGING" || callState === "DIALING") && {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <View style={[styles.avatarInner, isIncoming ? styles.avatarIncoming : styles.avatarActive]}>
                {isIncoming ? (
                  matchedLead || contactName ? (
                    <UserCheck size={52} color="#FFFFFF" strokeWidth={2.3} />
                  ) : (
                    <PhoneIncoming size={50} color="#FFFFFF" strokeWidth={2.3} />
                  )
                ) : (
                  <PhoneCall size={50} color="#FFFFFF" strokeWidth={2.3} />
                )}
                {isIncoming && (
                  <View style={styles.floatingIncomingBadge}>
                    <Phone size={13} color="#FFFFFF" strokeWidth={2.5} />
                  </View>
                )}
              </View>
            </Animated.View>
          </View>

          <Text style={styles.callerName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.callerPhone}>{phoneNumber || "Unknown Number"}</Text>

          {/* Status & Live Timer */}
          <View style={styles.statusBox}>
            {isConference ? (
              <View style={styles.activeTimerRow}>
                <View style={styles.greenPulseDot} />
                <Text style={styles.liveTimerText}>{formatTimer(liveDurationSec)}</Text>
                <Text style={[styles.callStateLabel, { color: "#10B981" }]}>3-WAY CONFERENCE</Text>
              </View>
            ) : callState === "ACTIVE" ? (
              <View style={styles.activeTimerRow}>
                <View style={styles.greenPulseDot} />
                <Text style={styles.liveTimerText}>{formatTimer(liveDurationSec)}</Text>
                <Text style={styles.callStateLabel}>LIVE CALL</Text>
              </View>
            ) : callState === "HOLDING" ? (
              <View style={styles.activeTimerRow}>
                <View style={[styles.greenPulseDot, { backgroundColor: "#F59E0B" }]} />
                <Text style={[styles.liveTimerText, { color: "#D97706" }]}>{formatTimer(liveDurationSec)}</Text>
                <Text style={[styles.callStateLabel, { color: "#D97706" }]}>CALL ON HOLD</Text>
              </View>
            ) : isIncoming ? (
              <View style={styles.incomingBadgePill}>
                <View style={styles.liveGreenDot} />
                <Text style={styles.incomingLabel}>INCOMING CALL • SIM 1</Text>
              </View>
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
            /* Modern Symmetrical Swipe-to-Answer / Swipe-to-Decline Gesture Bar */
            <View style={styles.swipeContainer}>
              <View style={styles.swipeTrack}>
                {/* Left 50% Decline Zone */}
                <TouchableOpacity
                  style={styles.leftTrackZone}
                  onPress={handleHangup}
                  activeOpacity={0.7}
                >
                  <PhoneOff size={18} color="#EF4444" strokeWidth={2.5} />
                  <ChevronsLeft size={16} color="#EF4444" strokeWidth={2.5} />
                  <Text style={styles.declineText}>Decline</Text>
                </TouchableOpacity>

                {/* Right 50% Attend Zone */}
                <TouchableOpacity
                  style={styles.rightTrackZone}
                  onPress={handleAnswer}
                  activeOpacity={0.7}
                >
                  <Text style={styles.attendText}>Answer</Text>
                  <ChevronsRight size={16} color="#10B981" strokeWidth={2.5} />
                  <PhoneCall size={18} color="#10B981" strokeWidth={2.5} />
                </TouchableOpacity>

                {/* Centered Draggable Knob */}
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
                    <Phone size={24} color="#2563EB" strokeWidth={2.5} />
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
              {/* Held Call Card (When in a 2-call session or call on hold) */}
              {(hasHeldCall || heldCallBackup) && (
                <View style={styles.heldCallCard}>
                  <View style={styles.heldCallHeader}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
                      <View style={styles.heldPulseDot} />
                      <Text style={styles.heldCallTitle} numberOfLines={1}>
                        On Hold: <Text style={{ fontWeight: "800", color: "#166534" }}>
                          {heldContactName || heldCallBackup?.name || heldPhoneNumber || "Call 1"}
                        </Text>
                      </Text>
                    </View>
                    <Text style={styles.heldCallPhone}>
                      {heldPhoneNumber || heldCallBackup?.phone}
                    </Text>
                  </View>

                  <View style={styles.heldCallActionRow}>
                    <TouchableOpacity
                      style={styles.mergeConfBtn}
                      onPress={handleMergeConference}
                      activeOpacity={0.8}
                    >
                      <Users size={16} color="#FFFFFF" strokeWidth={2.3} style={{ marginRight: 6 }} />
                      <Text style={styles.mergeConfText}>Merge Conference 👥</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.swapCallBtn}
                      onPress={handleSwapCalls}
                      activeOpacity={0.8}
                    >
                      <ArrowLeftRight size={15} color="#2563EB" strokeWidth={2.3} style={{ marginRight: 5 }} />
                      <Text style={styles.swapCallText}>Swap 🔄</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.controlsGrid}>
                {/* Mute Button */}
                <TouchableOpacity
                  style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
                  onPress={handleToggleMute}
                  activeOpacity={0.7}
                >
                  {isMuted ? (
                    <MicOff size={22} color="#EF4444" strokeWidth={2.2} />
                  ) : (
                    <Mic size={22} color="#334155" strokeWidth={2.2} />
                  )}
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
                  <Volume2
                    size={22}
                    color={isSpeaker ? "#2563EB" : "#334155"}
                    strokeWidth={2.2}
                  />
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
                  <Grid3X3
                    size={22}
                    color={showKeypad ? "#2563EB" : "#334155"}
                    strokeWidth={2.2}
                  />
                  <Text style={[styles.controlLabel, showKeypad && styles.controlLabelActive]}>
                    Keypad
                  </Text>
                </TouchableOpacity>

                {/* Add Call Button */}
                <TouchableOpacity
                  style={styles.controlBtn}
                  onPress={handleOpenAddCall}
                  activeOpacity={0.7}
                >
                  <UserPlus size={22} color="#334155" strokeWidth={2.2} />
                  <Text style={styles.controlLabel}>Add Call</Text>
                </TouchableOpacity>
              </View>

              {/* Sleek Crimson End Call Button */}
              <TouchableOpacity
                style={styles.hangupButton}
                onPress={handleHangup}
                activeOpacity={0.8}
              >
                <PhoneOff size={20} color="#FFFFFF" strokeWidth={2.5} />
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
                  <X size={16} color="#64748B" strokeWidth={2.5} />
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
                    <Delete size={20} color="#64748B" />
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
                  activeOpacity={0.8}
                >
                  <PhoneCall size={16} color="#FFFFFF" strokeWidth={2.3} style={{ marginRight: 6 }} />
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  staffDutyText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  courseBadge: {
    flexDirection: "row",
    alignItems: "center",
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
  avatarWrapper: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 16,
  },
  radarRing: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(37, 99, 235, 0.22)",
    borderWidth: 2,
    borderColor: "rgba(59, 130, 246, 0.45)",
  },
  avatarContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
    position: "relative",
  },
  floatingIncomingBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  avatarIncoming: {
    backgroundColor: "#2563EB",
    shadowColor: "#2563EB",
  },
  avatarActive: {
    backgroundColor: "#059669",
    shadowColor: "#059669",
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
  incomingBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveGreenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  heldCallCard: {
    backgroundColor: "#F0FDF4",
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#86EFAC",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  heldCallHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  heldPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F59E0B",
  },
  heldCallTitle: {
    fontSize: 13,
    color: "#166534",
  },
  heldCallPhone: {
    fontSize: 12,
    fontWeight: "700",
    color: "#15803D",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  heldCallActionRow: {
    flexDirection: "row",
    gap: 8,
  },
  mergeConfBtn: {
    flex: 1.4,
    backgroundColor: "#10B981",
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  mergeConfText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  swapCallBtn: {
    flex: 1,
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  swapCallText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#2563EB",
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
    height: 70,
    backgroundColor: "#F1F5F9",
    borderRadius: 35,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    overflow: "hidden",
  },
  leftTrackZone: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingRight: 24,
  },
  declineText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#EF4444",
    letterSpacing: 0.5,
  },
  rightTrackZone: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingLeft: 24,
  },
  attendText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#10B981",
    letterSpacing: 0.5,
  },
  draggableKnob: {
    position: "absolute",
    left: "50%",
    marginLeft: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
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
