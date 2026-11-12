import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { initialLeads, initialFollowUps } from "@/data/dummy-data";
import { CallRecord, Lead, FollowUpTask } from "@/types";
import { MobileBridge } from "@/lib/mobileBridge";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const DATA_DIR = path.join(process.cwd(), "data");
const STORAGE_FILE = path.join(DATA_DIR, "crm_storage.json");

function ensureStorage(): { leads: Lead[]; followUps: FollowUpTask[] } {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORAGE_FILE)) {
    const initialData = {
      leads: initialLeads,
      followUps: initialFollowUps,
      savedAt: new Date().toISOString(),
    };
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(initialData, null, 2), "utf8");
    return { leads: initialLeads, followUps: initialFollowUps };
  }
  try {
    const raw = fs.readFileSync(STORAGE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return {
      leads: parsed.leads || initialLeads,
      followUps: parsed.followUps || initialFollowUps,
    };
  } catch {
    return { leads: initialLeads, followUps: initialFollowUps };
  }
}

// Convert seconds into human-readable duration e.g. "1 minute 30 seconds"
function formatHumanDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0 seconds";
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m > 0 && s > 0) return `${m} minute${m > 1 ? "s" : ""} ${s} second${s > 1 ? "s" : ""}`;
  if (m > 0) return `${m} minute${m > 1 ? "s" : ""}`;
  return `${s} second${s > 1 ? "s" : ""}`;
}

function formatTimer(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function parseDurationSecs(durStr?: string): number {
  if (!durStr) return 0;
  const parts = durStr.split(":").map(Number);
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      leadId,
      studentName,
      phone,
      callerName = "Staff",
      disposition = "Interested",
      courseInterested = "",
      qualification = "",
      passedOutYear = "",
      collegeName = "",
      callStartTime = "",
      callEndTime = "",
      notes = "",
      nextFollowUpDate,
      nextFollowUpTime,
    } = body;

    let durationSeconds = Number(body.durationSeconds) || 0;

    const { leads, followUps } = ensureStorage();

    const cleanInputPhone = String(phone || "").replace(/\D/g, "");

    // Query mobile bridge for true hardware call duration & exact start/end time
    let hardwareStartTimeStr = callStartTime || "";
    let hardwareEndTimeStr = callEndTime || "";
    let hardwareDateStr = "";

    try {
      const bridgeStatus = await MobileBridge.getStatus();
      if (bridgeStatus && bridgeStatus.lastCallDurationSeconds && bridgeStatus.lastCallDurationSeconds > 0) {
        const lastNum = String(bridgeStatus.lastCallNumber || "").replace(/\D/g, "");
        if (!cleanInputPhone || lastNum.endsWith(cleanInputPhone.slice(-10)) || cleanInputPhone.endsWith(lastNum.slice(-10))) {
          durationSeconds = bridgeStatus.lastCallDurationSeconds || durationSeconds;
          if (bridgeStatus.lastCallStartTime && bridgeStatus.lastCallEndTime) {
            hardwareStartTimeStr = hardwareStartTimeStr || bridgeStatus.lastCallStartTime;
            hardwareEndTimeStr = hardwareEndTimeStr || bridgeStatus.lastCallEndTime;
            if (bridgeStatus.lastCallTimestamp) {
              hardwareDateStr = new Date(bridgeStatus.lastCallTimestamp).toISOString().split("T")[0];
            }
          }
        }
      }
    } catch {}

    const endNow = new Date();
    const startNow = new Date(endNow.getTime() - Math.max(1, durationSeconds) * 1000);
    const dateStr = hardwareDateStr || endNow.toISOString().split("T")[0];
    const fromTime = hardwareStartTimeStr || startNow.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const endTime = hardwareEndTimeStr || endNow.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const formattedDuration = formatTimer(durationSeconds);
    const durationLong = formatHumanDuration(durationSeconds);

    // Find lead by ID or phone match
    let matchedLeadIndex = leads.findIndex((l) => l.id === leadId);
    if (matchedLeadIndex === -1 && cleanInputPhone) {
      matchedLeadIndex = leads.findIndex((l) => {
        const clean = l.phone.replace(/\D/g, "");
        return clean && (clean.endsWith(cleanInputPhone.slice(-10)) || cleanInputPhone.endsWith(clean.slice(-10)));
      });
    }

    // Determine mapped lead status and stage from student mindset
    let mappedStatus: any = "Interested";
    let mappedStage: any = "Interested";

    if (disposition === "Interested") {
      mappedStatus = "Interested";
      mappedStage = "Interested";
    } else if (disposition === "Visit to Institute") {
      mappedStatus = "Counselling Scheduled";
      mappedStage = "Counselling Scheduled";
    } else if (disposition === "Joined") {
      mappedStatus = "Admitted";
      mappedStage = "Admitted";
    } else if (disposition === "Not Interested" || disposition === "Lost") {
      mappedStatus = "Lost";
      mappedStage = "Lost";
    } else if (disposition === "Call Later") {
      mappedStatus = "Call Later";
      mappedStage = "Call Scheduled";
    } else if (disposition === "Busy" || disposition === "Not Answered") {
      mappedStatus = "Busy";
    }

    let updatedLeads = [...leads];
    let updatedFollowUps = [...followUps];

    // Build academic tag string for remarks
    const academicInfo = [
      courseInterested ? `Course: ${courseInterested}` : "",
      qualification ? `Qualification: ${qualification}` : "",
      passedOutYear ? `Passed Out: ${passedOutYear}` : "",
      collegeName ? `College: ${collegeName}` : "",
    ]
      .filter(Boolean)
      .join(" • ");

    const defaultRemarks = notes
      ? notes
      : `Inquiry handled by ${callerName}. Mindset: ${disposition}${academicInfo ? ` [${academicInfo}]` : ""}`;

    if (matchedLeadIndex >= 0) {
      const existing = updatedLeads[matchedLeadIndex];
      const history = existing.callHistory ? [...existing.callHistory] : [];

      // Check if there is a matching call record logged recently (e.g. auto-logged by the bridge)
      let mergeTargetIndex = -1;
      for (let i = 0; i < history.length; i++) {
        const item = history[i];
        const itemDurSecs = parseDurationSecs(item.duration);
        const idTimestampMatch = item.id.match(/\d{10,}/);
        const recordAgeMs = idTimestampMatch ? Date.now() - parseInt(idTimestampMatch[0], 10) : 9999999;
        if (
          recordAgeMs < 600000 ||
          (item.callDate === dateStr && (itemDurSecs === durationSeconds || Math.abs(itemDurSecs - durationSeconds) <= 5))
        ) {
          mergeTargetIndex = i;
          break;
        }
      }

      let isRecentMerge = mergeTargetIndex >= 0;
      if (isRecentMerge) {
        const target = history[mergeTargetIndex];
        const targetDurSecs = parseDurationSecs(target.duration);
        const actualCallDuration = durationSeconds > 0 ? durationSeconds : targetDurSecs;
        const finalFormattedDur = formatTimer(actualCallDuration);
        const finalHumanDur = formatHumanDuration(actualCallDuration);
        const isAttended = actualCallDuration > 0;

        history[mergeTargetIndex] = {
          ...target,
          callerName: callerName,
          mindset: disposition,
          outcome: isAttended ? "Attended Call" : "Not Attended Call",
          callTime: fromTime || target.callTime,
          fromTime: fromTime || target.fromTime,
          endTime: endTime || target.endTime,
          callDate: dateStr || target.callDate,
          duration: finalFormattedDur,
          durationFormatted: finalHumanDur,
          courseInterested: courseInterested || target.courseInterested || existing.courseInterested,
          qualification: qualification || target.qualification || existing.qualification || "",
          passedOutYear: passedOutYear || target.passedOutYear || existing.passedOutYear || "",
          collegeName: collegeName || target.collegeName || existing.collegeName || "",
          studentName: studentName || target.studentName || existing.studentName || "",
          remarks: notes
            ? `${notes}${academicInfo ? ` • ${academicInfo}` : ""}`
            : `Inquiry handled by ${callerName}. Spoke for ${finalHumanDur} (${fromTime} - ${endTime}). Mindset: ${disposition}${academicInfo ? ` • ${academicInfo}` : ""}`,
        };
      }

      if (!isRecentMerge) {
        // Create new call record
        const isAttended = durationSeconds > 0;
        const newCallRecord: CallRecord = {
          id: "cr-mob-" + Date.now(),
          callDate: dateStr,
          callTime: fromTime,
          callerName: callerName,
          duration: formattedDuration,
          durationFormatted: durationLong,
          fromTime: fromTime,
          endTime: endTime,
          outcome: isAttended ? "Attended Call" : "Not Attended Call",
          mindset: disposition,
          courseInterested: courseInterested || existing.courseInterested,
          qualification: qualification || existing.qualification || "",
          passedOutYear: passedOutYear || existing.passedOutYear || "",
          collegeName: collegeName || existing.collegeName || "",
          studentName: studentName || existing.studentName || "",
          remarks: defaultRemarks,
        };
        history.unshift(newCallRecord);
      }

      // Update student name if a custom name was provided
      const resolvedStudentName =
        studentName &&
        !studentName.startsWith("Direct Dial") &&
        !studentName.startsWith("Direct Caller") &&
        !studentName.startsWith("Inquiry Student")
          ? studentName
          : existing.studentName;

      updatedLeads[matchedLeadIndex] = {
        ...existing,
        studentName: resolvedStudentName || existing.studentName,
        courseInterested: courseInterested || existing.courseInterested,
        assignedCaller: callerName,
        status: mappedStatus,
        stage: mappedStage,
        callCount: isRecentMerge ? existing.callCount : (existing.callCount || 0) + 1,
        lastCallDate: dateStr,
        lastCallOutcome: disposition,
        qualification: qualification || existing.qualification || "",
        passedOutYear: passedOutYear || existing.passedOutYear || "",
        collegeName: collegeName || existing.collegeName || "",
        nextFollowUpDate: nextFollowUpDate || existing.nextFollowUpDate,
        nextFollowUpTime: nextFollowUpTime || existing.nextFollowUpTime,
        callHistory: history,
      };
    } else if (phone) {
      // Create a new direct enquiry lead if not in system
      const isAttended = durationSeconds > 0;
      const newCallRecord: CallRecord = {
        id: "cr-mob-" + Date.now(),
        callDate: dateStr,
        callTime: fromTime,
        callerName: callerName,
        duration: formattedDuration,
        durationFormatted: durationLong,
        fromTime: fromTime,
        endTime: endTime,
        outcome: isAttended ? "Attended Call" : "Not Attended Call",
        mindset: disposition,
        courseInterested: courseInterested || "General Enquiry",
        qualification: qualification || "",
        passedOutYear: passedOutYear || "",
        collegeName: collegeName || "",
        studentName: studentName || `Inquiry Student (${cleanInputPhone.slice(-10)})`,
        remarks: defaultRemarks,
      };

      const newLead: Lead = {
        id: `LD-MOB-${Date.now()}`,
        studentName: studentName || `Inquiry Student (${cleanInputPhone.slice(-10)})`,
        phone: cleanInputPhone.slice(-10),
        email: "direct@mobile.local",
        courseInterested: courseInterested || "General Enquiry",
        leadSource: "Phone",
        assignedCaller: callerName,
        priority: "Hot",
        status: mappedStatus,
        stage: mappedStage,
        enquiryDate: dateStr,
        qualification: qualification || "",
        passedOutYear: passedOutYear || "",
        collegeName: collegeName || "",
        nextFollowUpDate: nextFollowUpDate || "",
        nextFollowUpTime: nextFollowUpTime || "",
        callCount: 1,
        lastCallDate: dateStr,
        lastCallOutcome: disposition,
        notes: [],
        callHistory: [newCallRecord],
      };
      updatedLeads.unshift(newLead);
    }

    // Add follow-up task if date provided
    if (nextFollowUpDate) {
      const leadForFu = matchedLeadIndex >= 0 ? updatedLeads[matchedLeadIndex] : updatedLeads[0];
      const newFu: FollowUpTask = {
        id: "fu-" + Date.now(),
        leadId: leadForFu.id,
        studentName: leadForFu.studentName,
        phone: leadForFu.phone,
        course: leadForFu.courseInterested,
        assignedCaller: callerName,
        lastContacted: `${dateStr} ${fromTime}`,
        followUpDate: nextFollowUpDate,
        followUpTime: nextFollowUpTime || "11:00 AM",
        status: "Today",
        priority: leadForFu.priority || "Hot",
        remarks: `Follow up scheduled by ${callerName} after call (${disposition}): ${notes}`,
      };
      updatedFollowUps = [newFu, ...updatedFollowUps];
    }

    const payload = {
      leads: updatedLeads,
      followUps: updatedFollowUps,
      savedAt: new Date().toISOString(),
    };

    fs.writeFileSync(STORAGE_FILE, JSON.stringify(payload, null, 2), "utf8");

    // Live Sync to Supabase Cloud Database
    if (isSupabaseConfigured() && supabase) {
      try {
        const activeLead = matchedLeadIndex >= 0 ? updatedLeads[matchedLeadIndex] : updatedLeads[0];
        // 1. Upsert lead
        await supabase.from("leads").upsert({
          id: activeLead.id,
          student_name: activeLead.studentName,
          phone: activeLead.phone,
          email: activeLead.email || null,
          course_interested: activeLead.courseInterested || null,
          lead_source: activeLead.leadSource || "Phone",
          status: activeLead.status || "Interested",
          priority: activeLead.priority || "Warm",
          stage: activeLead.stage || "Interested",
          assigned_caller: callerName,
          city: activeLead.city || "Tamil Nadu",
          enquiry_date: activeLead.enquiryDate || null,
          next_follow_up_date: nextFollowUpDate || activeLead.nextFollowUpDate || null,
          next_follow_up_time: nextFollowUpTime || activeLead.nextFollowUpTime || null,
          call_count: activeLead.callCount || 1,
          qualification: activeLead.qualification || null,
          passed_out_year: activeLead.passedOutYear || null,
          college_name: activeLead.collegeName || null,
          last_call_date: dateStr,
          last_call_outcome: disposition,
        }, { onConflict: "id" });

        // 2. Insert call record
        const latestCall = activeLead.callHistory && activeLead.callHistory[0];
        if (latestCall) {
          await supabase.from("calls").upsert({
            id: latestCall.id || `cr-${Date.now()}`,
            lead_id: activeLead.id,
            student_name: latestCall.studentName || activeLead.studentName,
            phone: activeLead.phone,
            caller_name: latestCall.callerName || callerName,
            call_date: latestCall.callDate || dateStr,
            call_time: latestCall.callTime || fromTime,
            duration: latestCall.duration || formattedDuration,
            duration_formatted: latestCall.durationFormatted || durationLong,
            duration_seconds: durationSeconds,
            from_time: latestCall.fromTime || fromTime,
            end_time: latestCall.endTime || endTime,
            outcome: latestCall.outcome || (durationSeconds > 0 ? "Attended Call" : "Not Attended Call"),
            mindset: latestCall.mindset || disposition,
            course_interested: latestCall.courseInterested || activeLead.courseInterested || null,
            qualification: latestCall.qualification || activeLead.qualification || null,
            passed_out_year: latestCall.passedOutYear || activeLead.passedOutYear || null,
            college_name: latestCall.collegeName || activeLead.collegeName || null,
            remarks: latestCall.remarks || null,
          }, { onConflict: "id" });
        }

        // 3. Upsert follow-up if scheduled
        if (nextFollowUpDate) {
          await supabase.from("follow_ups").upsert({
            id: `fu-${activeLead.id}-${Date.now()}`,
            lead_id: activeLead.id,
            student_name: activeLead.studentName,
            phone: activeLead.phone,
            caller_name: callerName,
            course: activeLead.courseInterested || null,
            scheduled_date: nextFollowUpDate,
            scheduled_time: nextFollowUpTime || "11:00 AM",
            status: "Pending",
            remarks: `Follow up scheduled by ${callerName} after call (${disposition}): ${notes}`,
          });
        }
      } catch (sbErr) {
        console.error("Supabase sync warning:", sbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Call logged by ${callerName} (${disposition})`,
      lead: matchedLeadIndex >= 0 ? updatedLeads[matchedLeadIndex] : updatedLeads[0],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to log call outcome" }, { status: 500 });
  }
}
