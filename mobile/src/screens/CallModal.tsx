import React, { useState, useEffect, useMemo } from "react";
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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { THEME } from "../constants/theme";
import { CallDisposition, CallRecord, Lead, WEGROW_STAFF_MEMBERS, StaffMember } from "../types";
import { ApiService } from "../services/api";
import { StorageService } from "../services/storage";
import { DEGREES_LIST, TN_COLLEGES_LIST } from "../data/academicData";
import { WEGROW_INSTITUTE_COURSES, WegrowCourseItem } from "../data/instituteCourses";
import { LiveClock } from "../components/LiveClock";
import { User, UserCheck, Sparkles, GraduationCap, Building2, XCircle, Clock, PhoneMissed, Check, Calendar, Phone } from "lucide-react-native";

interface CallModalProps {
  visible: boolean;
  lead: Lead | null;
  durationSeconds: number;
  onClose: () => void;
  onSaveSuccess: () => void;
}

// Inquired Person Mindset Options
const MINDSET_OPTIONS: { key: CallDisposition; label: string; color: string; icon: string }[] = [
  { key: "Interested", label: "Interested", color: THEME.colors.emerald, icon: "🌟" },
  { key: "Visit to Institute", label: "Visit to Institute", color: THEME.colors.gold, icon: "🏫" },
  { key: "Joined", label: "Joined", color: THEME.colors.sky, icon: "🎓" },
  { key: "Not Interested", label: "Not Interested", color: THEME.colors.danger, icon: "❌" },
  { key: "Call Later", label: "Call Later", color: THEME.colors.amber, icon: "⏰" },
  { key: "Busy", label: "Busy / No Answer", color: THEME.colors.textMuted, icon: "📵" },
];

export const CallModal: React.FC<CallModalProps> = ({
  visible,
  lead,
  durationSeconds,
  onClose,
  onSaveSuccess,
}) => {
  // Staff Selection (Who Took The Inquiry?)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember>("MuthuSelvi");

  // Inquired Person Mindset (Disposition)
  const [selectedMindset, setSelectedMindset] = useState<CallDisposition>("Interested");

  // Student & Academic Details
  const [studentName, setStudentName] = useState("");
  const [courseInterested, setCourseInterested] = useState("");
  const [qualification, setQualification] = useState("");
  const [passedOutYear, setPassedOutYear] = useState("");
  const [collegeName, setCollegeName] = useState("");

  // Only ONE dropdown can ever be open at a time. Opening another automatically closes the previous one!
  const [activeDropdown, setActiveDropdown] = useState<"course" | "degree" | "college" | null>(null);
  const showCourseDropdown = activeDropdown === "course";
  const showDegreeDropdown = activeDropdown === "degree";
  const showCollegeDropdown = activeDropdown === "college";

  // Exact Phone Call Hardware Duration & Timestamps
  const [effectiveDuration, setEffectiveDuration] = useState(durationSeconds);
  const [callStartTimeStr, setCallStartTimeStr] = useState("");
  const [callEndTimeStr, setCallEndTimeStr] = useState("");

  const [notes, setNotes] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [nextFollowUpTime, setNextFollowUpTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);

  // Mini Calendar & Mini Clock State for Follow-up
  const [showMiniCalendar, setShowMiniCalendar] = useState(false);
  const [showMiniClock, setShowMiniClock] = useState(false);
  const [clockHour, setClockHour] = useState("03");
  const [clockMinute, setClockMinute] = useState("30");
  const [clockAmPm, setClockAmPm] = useState<"AM" | "PM">("PM");

  // Helper to format ISO date string
  const formatOffsetDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // Generate next 14 calendar days for 1-tap mini calendar
  const next14Days = useMemo(() => {
    const list: { dateStr: string; dayName: string; dayNum: number; monthName: string }[] = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      list.push({
        dateStr: `${y}-${m}-${day}`,
        dayName: dayNames[d.getDay()],
        dayNum: d.getDate(),
        monthName: monthNames[d.getMonth()],
      });
    }
    return list;
  }, []);

  // Check if this student is already registered with an existing profile
  const isExistingStudent = Boolean(
    lead &&
    lead.studentName &&
    !lead.studentName.startsWith("Direct Dial") &&
    !lead.studentName.startsWith("Inquiry Student") &&
    !lead.studentName.startsWith("New Enquiry") &&
    (lead.qualification || lead.collegeName || (lead.callCount && lead.callCount > 0) || (lead.courseInterested && lead.courseInterested !== "Direct Dial" && lead.courseInterested !== "General Enquiry"))
  );

  // Sync duration and fetch true Android hardware call duration & exact start/end time
  useEffect(() => {
    if (visible) {
      setEffectiveDuration(durationSeconds);

      // Query true phone hardware duration and timeline from server bridge with automatic retry
      let attempts = 0;
      const fetchStatus = () => {
        ApiService.fetchCallStatus().then((res) => {
          if (res.success && res.data) {
            if (res.data.lastCallDurationSeconds && res.data.lastCallDurationSeconds > 0) {
              setEffectiveDuration(res.data.lastCallDurationSeconds);
            }
            if (res.data.lastCallStartTime) {
              setCallStartTimeStr(res.data.lastCallStartTime);
            }
            if (res.data.lastCallEndTime) {
              setCallEndTimeStr(res.data.lastCallEndTime);
            }
          } else if (attempts < 2) {
            attempts++;
            setTimeout(fetchStatus, 1200);
          }
        });
      };
      fetchStatus();
      const retryTimer = setTimeout(fetchStatus, 1500);

      // Load saved staff
      StorageService.getSettings().then((s) => {
        if (s.callerName && (WEGROW_STAFF_MEMBERS as readonly string[]).includes(s.callerName)) {
          setSelectedStaff(s.callerName as StaffMember);
        } else if (lead?.assignedCaller && (WEGROW_STAFF_MEMBERS as readonly string[]).includes(lead.assignedCaller)) {
          setSelectedStaff(lead.assignedCaller as StaffMember);
        }
      });

      // User requirement: A student already attended once does NOT get asked for inquiry form again!
      if (isExistingStudent && lead) {
        setStudentName(lead.studentName);
        setCourseInterested(lead.courseInterested || "");
        setQualification(lead.qualification || "");
        setPassedOutYear(lead.passedOutYear || "");
        setCollegeName(lead.collegeName || "");
        setIsEditingDetails(false);
      } else {
        // First inquiry for this number: Open blank boxes for staff to type
        setStudentName("");
        setCourseInterested("");
        setQualification("");
        setPassedOutYear("");
        setCollegeName("");
        setIsEditingDetails(true);
      }

      setNotes("");
      setSelectedMindset("Interested");
      setActiveDropdown(null);

      return () => clearTimeout(retryTimer);
    }
  }, [visible, lead, durationSeconds, isExistingStudent]);

  // Smart normalize & fuzzy search helper
  const matchSmart = (item: string, query: string) => {
    if (!query) return true;
    const qClean = query.toLowerCase().replace(/[^a-z0-9]/g, "");
    const itemClean = item.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (qClean && itemClean.includes(qClean)) return true;

    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return words.some((w) => {
      const cleanW = w.replace(/[^a-z0-9]/g, "");
      if (!cleanW) return false;
      if (itemClean.includes(cleanW)) return true;
      if (cleanW.length > 4 && itemClean.includes(cleanW.slice(0, -1))) return true;
      return false;
    });
  };

  // Real-time courses suggestions (01 to 34 from brochure) - ONLY computed when dropdown is active
  const filteredCourses = useMemo(() => {
    if (activeDropdown !== "course") return [];
    const q = courseInterested.trim();
    if (!q) return WEGROW_INSTITUTE_COURSES;
    return WEGROW_INSTITUTE_COURSES.filter((c) =>
      matchSmart(`${c.code} ${c.name} ${c.track} ${c.category} ${c.details || ""}`, q)
    );
  }, [courseInterested, activeDropdown]);

  // Real-time degree suggestions (fuzzy matching) - ONLY computed when dropdown is active
  const filteredDegrees = useMemo(() => {
    if (activeDropdown !== "degree") return [];
    const q = qualification.trim();
    if (!q) return DEGREES_LIST.slice(0, 30);
    return DEGREES_LIST.filter((d) => matchSmart(d, q)).slice(0, 35);
  }, [qualification, activeDropdown]);

  // Real-time college suggestions (fuzzy matching all Tamil Nadu colleges) - ONLY computed when dropdown is active
  const filteredColleges = useMemo(() => {
    if (activeDropdown !== "college") return [];
    const q = collegeName.trim();
    if (!q) return TN_COLLEGES_LIST.slice(0, 30);
    return TN_COLLEGES_LIST.filter((c) => matchSmart(c, q)).slice(0, 35);
  }, [collegeName, activeDropdown]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSave = async () => {
    if (!lead) return;
    setSaving(true);
    try {
      // Remember selected staff for future calls
      const currentSettings = await StorageService.getSettings();
      await StorageService.saveSettings({
        ...currentSettings,
        callerName: selectedStaff,
      });

      const finalStudentName = studentName.trim() || lead.studentName;
      const finalCourse = courseInterested.trim() || lead.courseInterested;
      const academicNotes = [
        finalCourse ? `Course: ${finalCourse}` : "",
        qualification.trim() ? `Qualification: ${qualification.trim()}` : "",
        passedOutYear.trim() ? `Passed Out: ${passedOutYear.trim()}` : "",
        collegeName.trim() ? `College: ${collegeName.trim()}` : "",
      ]
        .filter(Boolean)
        .join(" • ");

      const record: CallRecord = {
        id: `CR-${Date.now()}`,
        leadId: lead.id,
        studentName: finalStudentName,
        phone: lead.phone,
        callerName: selectedStaff,
        disposition: selectedMindset,
        durationSeconds: effectiveDuration,
        formattedDuration: formatTime(effectiveDuration),
        courseInterested: finalCourse,
        qualification: qualification.trim(),
        passedOutYear: passedOutYear.trim(),
        collegeName: collegeName.trim(),
        callStartTime: callStartTimeStr,
        callEndTime: callEndTimeStr,
        notes: notes.trim()
          ? `${notes.trim()}${academicNotes ? ` (${academicNotes})` : ""}`
          : `Inquiry handled by ${selectedStaff}. Spoke for ${formatTime(effectiveDuration)} (${callStartTimeStr || "11:59 AM"} - ${callEndTimeStr || "11:59 AM"}). Mindset: ${selectedMindset}${academicNotes ? ` • ${academicNotes}` : ""}`,
        nextFollowUpDate,
        nextFollowUpTime,
        timestamp: Date.now(),
        syncedToCrm: false,
      };

      const result = await ApiService.logCallOutcome(record);
      await StorageService.saveSettings({ callerName: selectedStaff }).catch(() => {});
      if (result.success) {
        Alert.alert("Success", `Inquiry saved for ${finalStudentName} by ${selectedStaff}!`);
      } else {
        Alert.alert("Saved Locally", result.error || "Saved offline. Will sync when online.");
      }

      setNotes("");
      setNextFollowUpDate("");
      setNextFollowUpTime("");
      setActiveDropdown(null);
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>
                {studentName.trim() || lead.studentName}
              </Text>
              <Text style={styles.phone}>
                {lead.phone} • {courseInterested || lead.courseInterested}
              </Text>
            </View>
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>Talk: {formatTime(effectiveDuration)}</Text>
            </View>
          </View>

          {/* Live Clock & Exact SIM Hardware Timeline Bar */}
          <View style={styles.liveClockBanner}>
            <View style={styles.liveClockRow}>
              <LiveClock style={styles.liveClockText} prefix="🕒 Live Clock: " />
              {callStartTimeStr && (
                <Text style={styles.hardwareTimeText}>
                  📞 Call: {callStartTimeStr} - {callEndTimeStr}
                </Text>
              )}
            </View>
          </View>

          <ScrollView
            style={styles.body}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={() => setActiveDropdown(null)}
          >
            {/* 1. STAFF SELECTION (Who Took The Inquiry?) */}
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <User size={15} color="#2563EB" />
                <Text style={styles.sectionLabel}>1. SELECT STAFF (WHO TOOK THE INQUIRY?)</Text>
              </View>
              <Text style={styles.selectedBadgeText}>Active: {selectedStaff}</Text>
            </View>
            <View style={styles.staffGrid}>
              {WEGROW_STAFF_MEMBERS.map((staff) => {
                const isSelected = selectedStaff === staff;
                return (
                  <TouchableOpacity
                    key={staff}
                    style={[styles.staffButton, isSelected && styles.staffButtonActive]}
                    onPress={() => {
                      setSelectedStaff(staff);
                      StorageService.saveSettings({ callerName: staff }).catch(() => {});
                      setActiveDropdown(null);
                    }}
                    activeOpacity={0.7}
                  >
                    {isSelected ? (
                      <UserCheck size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    ) : (
                      <User size={14} color="#64748B" style={{ marginRight: 6 }} />
                    )}
                    <Text style={[styles.staffText, isSelected && styles.staffTextActive]}>
                      {staff}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 2. INQUIRED PERSON MINDSET SELECTION */}
            <Text style={styles.sectionLabel}>2. INQUIRED PERSON MINDSET (STUDENT STATUS)</Text>
            <View style={styles.dispGrid}>
              {MINDSET_OPTIONS.map((m) => {
                const isSelected = selectedMindset === m.key;
                return (
                  <TouchableOpacity
                    key={m.key}
                    style={[
                      styles.dispButton,
                      isSelected && {
                        borderColor: m.color,
                        backgroundColor: THEME.colors.surfaceLight,
                        borderWidth: 2,
                      },
                    ]}
                    onPress={() => {
                      setSelectedMindset(m.key);
                      setActiveDropdown(null);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dispIcon}>{m.icon}</Text>
                    <Text
                      style={[
                        styles.dispText,
                        isSelected && { color: m.color, fontWeight: "700" },
                      ]}
                    >
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 3. STUDENT & COURSE & ACADEMIC DETAILS */}
            {isExistingStudent && !isEditingDetails ? (
              <View style={styles.registeredCard}>
                <View style={styles.registeredCardHeader}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={styles.registeredCardTitle}>🎓 REGISTERED STUDENT PROFILE</Text>
                    <View style={styles.knownPill}>
                      <Text style={styles.knownPillText}>Known Student</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.editToggleBtn}
                    onPress={() => setIsEditingDetails(true)}
                  >
                    <Text style={styles.editToggleText}>✏️ Edit Details</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.registeredInfoBox}>
                  <Text style={styles.registeredName}>👤 {lead.studentName}</Text>
                  <Text style={styles.registeredPhone}>📞 {lead.phone}</Text>

                  <View style={styles.registeredDivider} />

                  <View style={styles.registeredDetailRow}>
                    <Text style={styles.registeredDetailLabel}>📚 Course:</Text>
                    <Text style={styles.registeredDetailVal}>{lead.courseInterested || "General Enquiry"}</Text>
                  </View>

                  {(lead.qualification || lead.passedOutYear) ? (
                    <View style={styles.registeredDetailRow}>
                      <Text style={styles.registeredDetailLabel}>🎓 Degree:</Text>
                      <Text style={styles.registeredDetailVal}>
                        {lead.qualification || "Not specified"} {lead.passedOutYear ? `(${lead.passedOutYear})` : ""}
                      </Text>
                    </View>
                  ) : null}

                  {lead.collegeName ? (
                    <View style={styles.registeredDetailRow}>
                      <Text style={styles.registeredDetailLabel}>🏛️ College:</Text>
                      <Text style={styles.registeredDetailVal}>{lead.collegeName}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.registeredNotice}>
                  <Text style={styles.registeredNoticeText}>
                    ✅ Student profile is already registered. This call history will be saved directly under {lead.studentName}&apos;s name.
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.academicCard}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <Text style={styles.academicCardTitle}>
                    {isExistingStudent ? "✏️ EDIT STUDENT DETAILS" : "🎓 STUDENT & COURSE INQUIRY DETAILS"}
                  </Text>
                  {isExistingStudent && (
                    <TouchableOpacity
                      style={styles.editToggleBtn}
                      onPress={() => setIsEditingDetails(false)}
                    >
                      <Text style={styles.editToggleText}>✕ Done Editing</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Student Name */}
                <Text style={styles.fieldLabel}>Student / Inquired Person Name:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Student Name (e.g. Rohith, Ramesh...)"
                  placeholderTextColor={THEME.colors.textMuted}
                  value={studentName}
                  onChangeText={setStudentName}
                  onFocus={() => setActiveDropdown(null)}
                  onTouchStart={() => setActiveDropdown(null)}
                />

              {/* Course Enquired Selection (01 to 34 from Curriculum) */}
              <View style={styles.fieldHeaderRow}>
                <Text style={styles.fieldLabel}>Course Enquired (WeGrow Curriculum 01-34):</Text>
                <View style={styles.fieldActionGroup}>
                  {courseInterested ? (
                    <TouchableOpacity
                      onPress={() => {
                        setCourseInterested("");
                        setActiveDropdown("course");
                      }}
                      style={styles.actionPill}
                    >
                      <Text style={styles.clearBtnText}>Clear</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity
                    onPress={() => setActiveDropdown(activeDropdown === "course" ? null : "course")}
                    style={styles.dropdownToggleBtn}
                  >
                    <Text style={styles.dropdownToggleText}>
                      {activeDropdown === "course" ? "▲ Close" : "▼ List"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={[styles.inputWrapper, activeDropdown === "course" && styles.inputWrapperActive]}>
                <TextInput
                  style={styles.innerInput}
                  placeholder="Type or select course (e.g. Python, Full Stack, Java, AI, Flutter)..."
                  placeholderTextColor={THEME.colors.textMuted}
                  value={courseInterested}
                  onChangeText={(text) => {
                    setCourseInterested(text);
                    setActiveDropdown("course");
                  }}
                  onFocus={() => setActiveDropdown("course")}
                  onTouchStart={() => setActiveDropdown("course")}
                />
                <TouchableOpacity
                  style={styles.arrowIconBtn}
                  onPress={() => setActiveDropdown(activeDropdown === "course" ? null : "course")}
                >
                  <Text style={[styles.arrowIconText, activeDropdown === "course" && { color: THEME.colors.gold }]}>
                    {activeDropdown === "course" ? "▲" : "▼"}
                  </Text>
                </TouchableOpacity>
              </View>

              {showCourseDropdown && (
                <View style={styles.dropdownContainer}>
                  <Text style={styles.dropdownHeader}>
                    Select WeGrow Course ({filteredCourses.length} available • Scroll list):
                  </Text>
                  <ScrollView
                    style={styles.dropdownScrollView}
                    nestedScrollEnabled={true}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={true}
                  >
                    {filteredCourses.length === 0 && (
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => setActiveDropdown(null)}
                      >
                        <Text style={[styles.dropdownItemText, { color: THEME.colors.gold }]}>
                          ✍️ Use &quot;{courseInterested}&quot; (Custom Course)
                        </Text>
                      </TouchableOpacity>
                    )}
                    {filteredCourses.map((c) => (
                      <TouchableOpacity
                        key={c.code}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setCourseInterested(c.displayName);
                          setActiveDropdown(null);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>
                          🏷️ <Text style={{ fontWeight: "bold", color: THEME.colors.goldLight }}>{c.displayName}</Text>
                        </Text>
                        {c.details ? (
                          <Text style={styles.dropdownSubText}>({c.details} • {c.category.slice(3)})</Text>
                        ) : (
                          <Text style={styles.dropdownSubText}>({c.track} • {c.category.slice(3)})</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TouchableOpacity
                    style={styles.dropdownCloseBtn}
                    onPress={() => setActiveDropdown(null)}
                  >
                    <Text style={styles.dropdownCloseText}>Done / Close List ✕</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Qualification / Degree with Scrollable Autocomplete */}
              <View style={styles.fieldHeaderRow}>
                <Text style={styles.fieldLabel}>Qualification / Degree (UG / PG):</Text>
                <View style={styles.fieldActionGroup}>
                  {qualification ? (
                    <TouchableOpacity
                      onPress={() => {
                        setQualification("");
                        setActiveDropdown("degree");
                      }}
                      style={styles.actionPill}
                    >
                      <Text style={styles.clearBtnText}>Clear</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity
                    onPress={() => setActiveDropdown(activeDropdown === "degree" ? null : "degree")}
                    style={styles.dropdownToggleBtn}
                  >
                    <Text style={styles.dropdownToggleText}>
                      {activeDropdown === "degree" ? "▲ Close" : "▼ List"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={[styles.inputWrapper, activeDropdown === "degree" && styles.inputWrapperActive]}>
                <TextInput
                  style={styles.innerInput}
                  placeholder="Type or select degree (e.g. B.E CSE, B.Sc, BCA, MCA, MBA)"
                  placeholderTextColor={THEME.colors.textMuted}
                  value={qualification}
                  onChangeText={(text) => {
                    setQualification(text);
                    setActiveDropdown("degree");
                  }}
                  onFocus={() => setActiveDropdown("degree")}
                  onTouchStart={() => setActiveDropdown("degree")}
                />
                <TouchableOpacity
                  style={styles.arrowIconBtn}
                  onPress={() => setActiveDropdown(activeDropdown === "degree" ? null : "degree")}
                >
                  <Text style={[styles.arrowIconText, activeDropdown === "degree" && { color: THEME.colors.gold }]}>
                    {activeDropdown === "degree" ? "▲" : "▼"}
                  </Text>
                </TouchableOpacity>
              </View>

              {showDegreeDropdown && (
                <View style={styles.dropdownContainer}>
                  <Text style={styles.dropdownHeader}>
                    Select Degree ({filteredDegrees.length} available • Scroll list):
                  </Text>
                  <ScrollView
                    style={styles.dropdownScrollView}
                    nestedScrollEnabled={true}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={true}
                  >
                    {filteredDegrees.length === 0 && (
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => setActiveDropdown(null)}
                      >
                        <Text style={[styles.dropdownItemText, { color: THEME.colors.gold }]}>
                          ✍️ Use &quot;{qualification}&quot; (Custom Qualification)
                        </Text>
                      </TouchableOpacity>
                    )}
                    {filteredDegrees.map((deg, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setQualification(deg);
                          setActiveDropdown(null);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>📚 {deg}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TouchableOpacity
                    style={styles.dropdownCloseBtn}
                    onPress={() => setActiveDropdown(null)}
                  >
                    <Text style={styles.dropdownCloseText}>Done / Close List ✕</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Passed Out Year (Type Option Only) */}
              <Text style={styles.fieldLabel}>Passed Out Year (Type Year):</Text>
              <TextInput
                style={styles.input}
                placeholder="Passed out year (e.g. 2023, 2024, 2025, 2026)"
                placeholderTextColor={THEME.colors.textMuted}
                value={passedOutYear}
                onChangeText={setPassedOutYear}
                keyboardType="numeric"
                maxLength={4}
                onFocus={() => setActiveDropdown(null)}
                onTouchStart={() => setActiveDropdown(null)}
              />

              {/* College Name with Scrollable Autocomplete of Tamil Nadu Colleges */}
              <View style={styles.fieldHeaderRow}>
                <Text style={styles.fieldLabel}>College Name (All Tamil Nadu Colleges):</Text>
                <View style={styles.fieldActionGroup}>
                  {collegeName ? (
                    <TouchableOpacity
                      onPress={() => {
                        setCollegeName("");
                        setActiveDropdown("college");
                      }}
                      style={styles.actionPill}
                    >
                      <Text style={styles.clearBtnText}>Clear</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity
                    onPress={() => setActiveDropdown(activeDropdown === "college" ? null : "college")}
                    style={styles.dropdownToggleBtn}
                  >
                    <Text style={styles.dropdownToggleText}>
                      {activeDropdown === "college" ? "▲ Close" : "▼ List"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={[styles.inputWrapper, activeDropdown === "college" && styles.inputWrapperActive]}>
                <TextInput
                  style={styles.innerInput}
                  placeholder="Type college name (e.g. Mepco, ANJAC, SFRC, PSG, TCE, Anna Univ)"
                  placeholderTextColor={THEME.colors.textMuted}
                  value={collegeName}
                  onChangeText={(text) => {
                    setCollegeName(text);
                    setActiveDropdown("college");
                  }}
                  onFocus={() => setActiveDropdown("college")}
                  onTouchStart={() => setActiveDropdown("college")}
                />
                <TouchableOpacity
                  style={styles.arrowIconBtn}
                  onPress={() => setActiveDropdown(activeDropdown === "college" ? null : "college")}
                >
                  <Text style={[styles.arrowIconText, activeDropdown === "college" && { color: THEME.colors.gold }]}>
                    {activeDropdown === "college" ? "▲" : "▼"}
                  </Text>
                </TouchableOpacity>
              </View>

              {showCollegeDropdown && (
                <View style={styles.dropdownContainer}>
                  <Text style={styles.dropdownHeader}>
                    Select College ({filteredColleges.length} available • Scroll list):
                  </Text>
                  <ScrollView
                    style={styles.dropdownScrollView}
                    nestedScrollEnabled={true}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={true}
                  >
                    {filteredColleges.length === 0 && (
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => setActiveDropdown(null)}
                      >
                        <Text style={[styles.dropdownItemText, { color: THEME.colors.gold }]}>
                          ✍️ Use &quot;{collegeName}&quot; (Custom College)
                        </Text>
                      </TouchableOpacity>
                    )}
                    {filteredColleges.map((col, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setCollegeName(col);
                          setActiveDropdown(null);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>🏛️ {col}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TouchableOpacity
                    style={styles.dropdownCloseBtn}
                    onPress={() => setActiveDropdown(null)}
                  >
                    <Text style={styles.dropdownCloseText}>Done / Close List ✕</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

            {/* 4. Next Follow-up Schedule (Interactive Mini Calendar & Mini Clock) */}
            {(selectedMindset === "Call Later" ||
              selectedMindset === "Interested" ||
              selectedMindset === "Visit to Institute") && (
              <View style={styles.scheduleBox}>
                <View style={styles.scheduleHeaderRow}>
                  <Text style={styles.sectionLabel}>📅 SCHEDULE NEXT FOLLOW-UP</Text>
                  {(Boolean(nextFollowUpDate) || Boolean(nextFollowUpTime)) && (
                    <TouchableOpacity
                      style={styles.clearFollowUpBtn}
                      onPress={() => {
                        setNextFollowUpDate("");
                        setNextFollowUpTime("");
                      }}
                    >
                      <Text style={styles.clearFollowUpText}>✕ Clear</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Selected Date & Time Badge / Text preview */}
                {(Boolean(nextFollowUpDate) || Boolean(nextFollowUpTime)) ? (
                  <View style={styles.scheduleSummaryBar}>
                    <Text style={styles.scheduleSummaryText}>
                      📌 Scheduled:{" "}
                      <Text style={styles.scheduleSummaryHighlight}>
                        {nextFollowUpDate || "No Date"}
                      </Text>{" "}
                      at{" "}
                      <Text style={styles.scheduleSummaryHighlight}>
                        {nextFollowUpTime || "No Time"}
                      </Text>
                    </Text>
                  </View>
                ) : null}

                {/* --- A. MINI CALENDAR --- */}
                <View style={styles.pickerSection}>
                  <View style={styles.pickerLabelRow}>
                    <Text style={styles.pickerSubLabel}>🗓️ DATE (Choose 1-Tap):</Text>
                    <TouchableOpacity
                      style={styles.pickerToggleBtn}
                      onPress={() => setShowMiniCalendar((prev) => !prev)}
                    >
                      <Text style={styles.pickerToggleText}>
                        {showMiniCalendar ? "▲ Close Calendar" : "▼ 14-Day Calendar"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Quick Date Chips */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipsScrollContainer}
                  >
                    {[
                      { label: "Today", days: 0 },
                      { label: "Tomorrow", days: 1 },
                      { label: "+2 Days", days: 2 },
                      { label: "+3 Days", days: 3 },
                      { label: "+5 Days", days: 5 },
                      { label: "Next Week", days: 7 },
                    ].map((item) => {
                      const targetDate = formatOffsetDate(item.days);
                      const isSelected = nextFollowUpDate === targetDate;
                      return (
                        <TouchableOpacity
                          key={item.label}
                          style={[styles.dateChip, isSelected && styles.dateChipActive]}
                          onPress={() => setNextFollowUpDate(targetDate)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.dateChipText, isSelected && styles.dateChipTextActive]}>
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* Expandable 14-Day Calendar Horizontal Strip */}
                  {showMiniCalendar && (
                    <View style={styles.calendarContainer}>
                      <Text style={styles.calendarHeaderInfo}>Select from next 14 days:</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.calendarDaysRow}
                      >
                        {next14Days.map((day) => {
                          const isSelected = nextFollowUpDate === day.dateStr;
                          return (
                            <TouchableOpacity
                              key={day.dateStr}
                              style={[styles.dayCard, isSelected && styles.dayCardActive]}
                              onPress={() => {
                                setNextFollowUpDate(day.dateStr);
                                setShowMiniCalendar(false);
                              }}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={[styles.dayCardDayName, isSelected && styles.dayCardTextActive]}
                              >
                                {day.dayName}
                              </Text>
                              <Text
                                style={[styles.dayCardDayNum, isSelected && styles.dayCardTextActive]}
                              >
                                {day.dayNum}
                              </Text>
                              <Text
                                style={[styles.dayCardMonth, isSelected && styles.dayCardTextActive]}
                              >
                                {day.monthName}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}
                </View>

                {/* --- B. MINI CLOCK --- */}
                <View style={[styles.pickerSection, { marginTop: 8 }]}>
                  <View style={styles.pickerLabelRow}>
                    <Text style={styles.pickerSubLabel}>⏰ TIME (Choose 1-Tap):</Text>
                    <TouchableOpacity
                      style={styles.pickerToggleBtn}
                      onPress={() => setShowMiniClock((prev) => !prev)}
                    >
                      <Text style={styles.pickerToggleText}>
                        {showMiniClock ? "▲ Close Clock" : "▼ Custom Clock"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Quick Common Follow-up Times */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipsScrollContainer}
                  >
                    {[
                      "10:30 AM",
                      "11:30 AM",
                      "12:30 PM",
                      "02:30 PM",
                      "03:30 PM",
                      "04:30 PM",
                      "05:30 PM",
                      "06:30 PM",
                    ].map((timeOption) => {
                      const isSelected = nextFollowUpTime === timeOption;
                      return (
                        <TouchableOpacity
                          key={timeOption}
                          style={[styles.timeChip, isSelected && styles.timeChipActive]}
                          onPress={() => setNextFollowUpTime(timeOption)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.timeChipText, isSelected && styles.timeChipTextActive]}>
                            {timeOption}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* Expandable Interactive Mini Clock Picker */}
                  {showMiniClock && (
                    <View style={styles.clockPickerContainer}>
                      <View style={styles.clockAmPmRow}>
                        <Text style={styles.clockPickerHeader}>AM / PM:</Text>
                        <View style={styles.amPmBtnGroup}>
                          <TouchableOpacity
                            style={[styles.amPmBtn, clockAmPm === "AM" && styles.amPmBtnActive]}
                            onPress={() => {
                              setClockAmPm("AM");
                              setNextFollowUpTime(`${clockHour}:${clockMinute} AM`);
                            }}
                          >
                            <Text
                              style={[
                                styles.amPmBtnText,
                                clockAmPm === "AM" && styles.amPmBtnTextActive,
                              ]}
                            >
                              AM (Morning)
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.amPmBtn, clockAmPm === "PM" && styles.amPmBtnActive]}
                            onPress={() => {
                              setClockAmPm("PM");
                              setNextFollowUpTime(`${clockHour}:${clockMinute} PM`);
                            }}
                          >
                            <Text
                              style={[
                                styles.amPmBtnText,
                                clockAmPm === "PM" && styles.amPmBtnTextActive,
                              ]}
                            >
                              PM (Afternoon/Eve)
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Hour Row */}
                      <Text style={styles.clockRowTitle}>Hour:</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.clockNumberRow}
                      >
                        {["09", "10", "11", "12", "01", "02", "03", "04", "05", "06", "07", "08"].map(
                          (h) => {
                            const isHourSelected = clockHour === h;
                            return (
                              <TouchableOpacity
                                key={h}
                                style={[
                                  styles.clockHourBtn,
                                  isHourSelected && styles.clockHourBtnActive,
                                ]}
                                onPress={() => {
                                  setClockHour(h);
                                  setNextFollowUpTime(`${h}:${clockMinute} ${clockAmPm}`);
                                }}
                              >
                                <Text
                                  style={[
                                    styles.clockHourText,
                                    isHourSelected && styles.clockHourTextActive,
                                  ]}
                                >
                                  {h}
                                </Text>
                              </TouchableOpacity>
                            );
                          }
                        )}
                      </ScrollView>

                      {/* Minute Row */}
                      <Text style={styles.clockRowTitle}>Minute:</Text>
                      <View style={styles.clockMinuteRow}>
                        {["00", "15", "30", "45"].map((m) => {
                          const isMinSelected = clockMinute === m;
                          return (
                            <TouchableOpacity
                              key={m}
                              style={[
                                styles.clockMinBtn,
                                isMinSelected && styles.clockMinBtnActive,
                              ]}
                              onPress={() => {
                                setClockMinute(m);
                                setNextFollowUpTime(`${clockHour}:${m} ${clockAmPm}`);
                              }}
                            >
                              <Text
                                style={[
                                  styles.clockMinText,
                                  isMinSelected && styles.clockMinTextActive,
                                ]}
                              >
                                :{m}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>

                {/* Direct Manual Input Fallback */}
                <View style={[styles.row, { marginTop: 8 }]}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginRight: 8 }]}
                    placeholder="Date (YYYY-MM-DD)"
                    placeholderTextColor={THEME.colors.textMuted}
                    value={nextFollowUpDate}
                    onChangeText={setNextFollowUpDate}
                    onFocus={() => setActiveDropdown(null)}
                    onTouchStart={() => setActiveDropdown(null)}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Time (e.g. 03:30 PM)"
                    placeholderTextColor={THEME.colors.textMuted}
                    value={nextFollowUpTime}
                    onChangeText={setNextFollowUpTime}
                    onFocus={() => setActiveDropdown(null)}
                    onTouchStart={() => setActiveDropdown(null)}
                  />
                </View>
              </View>
            )}

            {/* 5. Notes / Remarks */}
            <Text style={styles.sectionLabel}>COUNSELLOR REMARKS / NOTES</Text>
            <TextInput
              style={styles.textArea}
              placeholder={`e.g. Student spoke with ${selectedStaff}. Discussed syllabus, course fees, and lab batches...`}
              placeholderTextColor={THEME.colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline={true}
              numberOfLines={3}
              onFocus={() => setActiveDropdown(null)}
              onTouchStart={() => setActiveDropdown(null)}
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
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveText}>
                  {isExistingStudent
                    ? `Save Call to ${lead.studentName}'s Profile ➔`
                    : `Save as ${selectedStaff} ➔`}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: THEME.colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "94%",
    padding: 16,
    borderTopWidth: 2,
    borderTopColor: "#2563EB",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    paddingBottom: 8,
  },
  title: {
    color: THEME.colors.textPrimary,
    fontSize: 17,
    fontWeight: "bold",
  },
  phone: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  durationBadge: {
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.emerald,
  },
  durationText: {
    color: THEME.colors.emerald,
    fontSize: 12,
    fontWeight: "bold",
  },
  liveClockBanner: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  liveClockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  liveClockText: {
    color: "#1D4ED8",
    fontSize: 11,
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  hardwareTimeText: {
    color: THEME.colors.emerald,
    fontSize: 11,
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  body: {
    paddingVertical: 8,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    marginTop: 4,
  },
  sectionLabel: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  selectedBadgeText: {
    color: "#2563EB",
    fontSize: 12,
    fontWeight: "800",
  },
  staffGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  staffButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
  },
  staffButtonActive: {
    borderColor: "#1D4ED8",
    backgroundColor: "#2563EB",
    borderWidth: 1.5,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  staffIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  staffText: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "700",
  },
  staffTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  dispGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  dispButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  dispIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  dispText: {
    color: THEME.colors.textPrimary,
    fontSize: 12,
    fontWeight: "500",
  },
  academicCard: {
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginVertical: 6,
  },
  registeredCard: {
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    padding: 14,
    marginVertical: 6,
    borderWidth: 1.5,
    borderColor: "#A7F3D0",
  },
  registeredCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  registeredCardTitle: {
    color: "#065F46",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  knownPill: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  knownPillText: {
    color: "#047857",
    fontSize: 9,
    fontWeight: "bold",
  },
  editToggleBtn: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  editToggleText: {
    color: "#2563EB",
    fontSize: 10,
    fontWeight: "bold",
  },
  registeredInfoBox: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  registeredName: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "bold",
  },
  registeredPhone: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  registeredDivider: {
    height: 1,
    backgroundColor: THEME.colors.border,
    marginVertical: 8,
  },
  registeredDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  registeredDetailLabel: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    width: 65,
    fontWeight: "600",
  },
  registeredDetailVal: {
    color: THEME.colors.textPrimary,
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  registeredNotice: {
    marginTop: 8,
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    padding: 8,
    borderRadius: 6,
  },
  registeredNoticeText: {
    color: THEME.colors.emerald,
    fontSize: 11,
    lineHeight: 15,
  },
  academicCardTitle: {
    color: THEME.colors.gold,
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  fieldHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 4,
  },
  fieldLabel: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 3,
    marginTop: 5,
  },
  clearBtnText: {
    color: THEME.colors.danger,
    fontSize: 11,
    fontWeight: "600",
  },
  fieldActionGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionPill: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  dropdownToggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: THEME.colors.surfaceLight,
    borderWidth: 1,
    borderColor: THEME.colors.gold,
  },
  dropdownToggleText: {
    color: THEME.colors.gold,
    fontSize: 10,
    fontWeight: "bold",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  inputWrapperActive: {
    borderColor: THEME.colors.gold,
    borderWidth: 1.5,
  },
  innerInput: {
    flex: 1,
    color: THEME.colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
  },
  arrowIconBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  arrowIconText: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    fontWeight: "bold",
  },
  dropdownContainer: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#2563EB",
    borderRadius: 10,
    marginTop: 4,
    marginBottom: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownHeader: {
    color: "#2563EB",
    fontSize: 10,
    padding: 6,
    backgroundColor: "#EFF6FF",
    fontWeight: "bold",
  },
  dropdownScrollView: {
    maxHeight: 220,
  },
  dropdownItem: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  dropdownItemText: {
    color: THEME.colors.textPrimary,
    fontSize: 12,
  },
  dropdownSubText: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    marginTop: 2,
    marginLeft: 20,
  },
  dropdownCloseBtn: {
    paddingVertical: 7,
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  dropdownCloseText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  scheduleBox: {
    marginBottom: 8,
  },
  scheduleHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  clearFollowUpBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.4)",
  },
  clearFollowUpText: {
    color: "#EF4444",
    fontSize: 10,
    fontWeight: "700",
  },
  scheduleSummaryBar: {
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    marginBottom: 6,
    marginTop: 2,
  },
  scheduleSummaryText: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
  },
  scheduleSummaryHighlight: {
    color: THEME.colors.gold,
    fontWeight: "bold",
  },
  pickerSection: {
    backgroundColor: "#F8FAFC",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  pickerLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  pickerSubLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: THEME.colors.textSecondary,
    letterSpacing: 0.5,
  },
  pickerToggleBtn: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: "#F1F5F9",
    borderRadius: 5,
  },
  pickerToggleText: {
    fontSize: 10,
    color: "#2563EB",
    fontWeight: "600",
  },
  chipsScrollContainer: {
    flexDirection: "row",
    gap: 6,
    paddingBottom: 2,
  },
  dateChip: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  dateChipActive: {
    backgroundColor: "#2563EB",
    borderColor: "#1D4ED8",
  },
  dateChipText: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    fontWeight: "600",
  },
  dateChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  calendarContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  calendarHeaderInfo: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    marginBottom: 6,
  },
  calendarDaysRow: {
    flexDirection: "row",
    gap: 6,
  },
  dayCard: {
    width: 44,
    height: 54,
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  dayCardActive: {
    backgroundColor: "#2563EB",
    borderColor: "#1D4ED8",
  },
  dayCardDayName: {
    fontSize: 9,
    color: THEME.colors.textMuted,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  dayCardDayNum: {
    fontSize: 15,
    fontWeight: "bold",
    color: THEME.colors.textPrimary,
  },
  dayCardMonth: {
    fontSize: 8,
    color: THEME.colors.textSecondary,
  },
  dayCardTextActive: {
    color: "#FFFFFF",
  },
  timeChip: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  timeChipActive: {
    backgroundColor: "#2563EB",
    borderColor: "#1D4ED8",
  },
  timeChipText: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    fontWeight: "600",
  },
  timeChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  clockPickerContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  clockAmPmRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  clockPickerHeader: {
    fontSize: 10,
    color: THEME.colors.textSecondary,
    fontWeight: "bold",
  },
  amPmBtnGroup: {
    flexDirection: "row",
    gap: 6,
  },
  amPmBtn: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  amPmBtnActive: {
    backgroundColor: "#2563EB",
    borderColor: "#1D4ED8",
  },
  amPmBtnText: {
    fontSize: 10,
    color: THEME.colors.textSecondary,
    fontWeight: "600",
  },
  amPmBtnTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  clockRowTitle: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    marginTop: 4,
    marginBottom: 4,
    fontWeight: "600",
  },
  clockNumberRow: {
    flexDirection: "row",
    gap: 5,
    paddingBottom: 4,
  },
  clockHourBtn: {
    width: 32,
    height: 32,
    backgroundColor: "#F1F5F9",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  clockHourBtnActive: {
    backgroundColor: "#2563EB",
    borderColor: "#1D4ED8",
  },
  clockHourText: {
    fontSize: 11,
    color: THEME.colors.textPrimary,
    fontWeight: "700",
  },
  clockHourTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  clockMinuteRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  clockMinBtn: {
    flex: 1,
    paddingVertical: 6,
    backgroundColor: "#F1F5F9",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  clockMinBtnActive: {
    backgroundColor: "#2563EB",
    borderColor: "#1D4ED8",
  },
  clockMinText: {
    fontSize: 11,
    color: THEME.colors.textPrimary,
    fontWeight: "700",
  },
  clockMinTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
  },
  input: {
    backgroundColor: "#F8FAFC",
    color: THEME.colors.textPrimary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    fontSize: 12,
  },
  textArea: {
    backgroundColor: "#F8FAFC",
    color: THEME.colors.textPrimary,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    fontSize: 12,
    textAlignVertical: "top",
    minHeight: 55,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  cancelText: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
  },
  saveButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  saveText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },
});
