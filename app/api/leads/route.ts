import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { initialLeads, initialFollowUps } from "@/data/dummy-data";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const DATA_DIR = path.join(process.cwd(), "data");
const STORAGE_FILE = path.join(DATA_DIR, "crm_storage.json");

function ensureStorage() {
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
  }
}

export async function GET() {
  try {
    // 1. If Supabase is configured, fetch live from Supabase Cloud
    if (isSupabaseConfigured() && supabase) {
      const { data: dbLeads, error: lErr } = await supabase
        .from("leads")
        .select("*, calls(*)")
        .order("created_at", { ascending: false });

      const { data: dbFollowUps, error: fErr } = await supabase
        .from("follow_ups")
        .select("*")
        .order("scheduled_date", { ascending: true });

      if (!lErr && dbLeads) {
        const mappedLeads = dbLeads.map((l: any) => ({
          id: l.id,
          studentName: l.student_name,
          phone: l.phone,
          email: l.email || "",
          courseInterested: l.course_interested || "",
          leadSource: l.lead_source || "Phone",
          status: l.status || "Interested",
          priority: l.priority || "Warm",
          stage: l.stage || "Interested",
          assignedCaller: l.assigned_caller || "",
          city: l.city || "Tamil Nadu",
          enquiryDate: l.enquiry_date || "",
          nextFollowUpDate: l.next_follow_up_date || "",
          nextFollowUpTime: l.next_follow_up_time || "",
          callCount: l.call_count || (l.calls ? l.calls.length : 0),
          qualification: l.qualification || "",
          passedOutYear: l.passed_out_year || "",
          collegeName: l.college_name || "",
          lastCallDate: l.last_call_date || "",
          lastCallOutcome: l.last_call_outcome || "",
          notes: [],
          callHistory: (l.calls || []).map((c: any) => ({
            id: c.id,
            callDate: c.call_date,
            callTime: c.call_time,
            callerName: c.caller_name,
            duration: c.duration,
            durationFormatted: c.duration_formatted,
            fromTime: c.from_time,
            endTime: c.end_time,
            outcome: c.outcome,
            mindset: c.mindset,
            courseInterested: c.course_interested,
            qualification: c.qualification,
            passedOutYear: c.passed_out_year,
            collegeName: c.college_name,
            studentName: c.student_name,
            remarks: c.remarks,
          })),
        }));

        const mappedFollowUps = (dbFollowUps || []).map((f: any) => ({
          id: f.id,
          leadId: f.lead_id,
          studentName: f.student_name,
          phone: f.phone,
          course: f.course,
          assignedCaller: f.caller_name,
          lastContacted: f.created_at,
          followUpDate: f.scheduled_date,
          followUpTime: f.scheduled_time || "10:30 AM",
          status: f.status || "Pending",
          priority: "Hot",
          remarks: f.remarks || "",
        }));

        // Deduplicate leads by 10-digit phone number, keeping the richest record
        const seenPhones = new Set<string>();
        const dedupedLeads: any[] = [];
        for (const l of mappedLeads) {
          const clean = String(l.phone || "").replace(/\D/g, "").slice(-10);
          const key = clean || l.id;
          if (!seenPhones.has(key)) {
            seenPhones.add(key);
            dedupedLeads.push(l);
          }
        }

        return NextResponse.json({
          leads: dedupedLeads,
          followUps: mappedFollowUps,
          source: "supabase",
        });
      }
    }

    // 2. Fallback to local storage file
    ensureStorage();
    const raw = fs.readFileSync(STORAGE_FILE, "utf8");
    const data = JSON.parse(raw);
    const localLeads = Array.isArray(data.leads) ? data.leads : [];
    const seenLocal = new Set<string>();
    const dedupedLocal: any[] = [];
    for (const l of localLeads) {
      const clean = String(l.phone || "").replace(/\D/g, "").slice(-10);
      const key = clean || l.id;
      if (!seenLocal.has(key)) {
        seenLocal.add(key);
        dedupedLocal.push(l);
      }
    }
    return NextResponse.json({
      ...data,
      leads: dedupedLocal,
    });
  } catch (error: any) {
    return NextResponse.json(
      { leads: initialLeads, followUps: initialFollowUps, error: error.message },
      { status: 200 }
    );
  }
}

export async function POST(request: Request) {
  try {
    ensureStorage();
    const body = await request.json();
    const { leads, followUps } = body;

    let existingData: any = { leads: initialLeads, followUps: initialFollowUps };
    try {
      existingData = JSON.parse(fs.readFileSync(STORAGE_FILE, "utf8"));
    } catch {}

    const updatedData = {
      ...existingData,
      ...(leads ? { leads } : {}),
      ...(followUps ? { followUps } : {}),
      savedAt: new Date().toISOString(),
    };

    fs.writeFileSync(STORAGE_FILE, JSON.stringify(updatedData, null, 2), "utf8");

    // Also sync to Supabase if configured
    if (isSupabaseConfigured() && supabase && Array.isArray(leads)) {
      const leadsToUpsert = leads.map((l: any) => ({
        id: l.id,
        student_name: l.studentName,
        phone: l.phone,
        email: l.email || null,
        course_interested: l.courseInterested || null,
        lead_source: l.leadSource || "Phone",
        status: l.status || "Interested",
        priority: l.priority || "Warm",
        stage: l.stage || "Interested",
        assigned_caller: l.assignedCaller || null,
        city: l.city || "Tamil Nadu",
        enquiry_date: l.enquiryDate || null,
        next_follow_up_date: l.nextFollowUpDate || null,
        next_follow_up_time: l.nextFollowUpTime || null,
        call_count: l.callCount || 0,
        qualification: l.qualification || null,
        passed_out_year: l.passedOutYear || null,
        college_name: l.collegeName || null,
        last_call_date: l.lastCallDate || null,
        last_call_outcome: l.lastCallOutcome || null,
      }));
      await supabase.from("leads").upsert(leadsToUpsert, { onConflict: "id" });

      // Upsert each call in callHistory to Supabase calls table
      const callsToUpsert: any[] = [];
      leads.forEach((l: any) => {
        if (Array.isArray(l.callHistory)) {
          l.callHistory.forEach((c: any) => {
            const raw = String(c.duration || "").replace(/[^\d:]/g, "");
            let secs = 0;
            if (raw.includes(":")) {
              const [m, s] = raw.split(":").map(Number);
              secs = (m || 0) * 60 + (s || 0);
            } else {
              secs = parseInt(raw, 10) || 0;
            }

            callsToUpsert.push({
              id: c.id,
              lead_id: l.id,
              student_name: c.studentName || l.studentName,
              phone: l.phone,
              caller_name: c.callerName || "Staff",
              call_date: c.callDate || new Date().toISOString().split("T")[0],
              call_time: c.callTime || "12:00 PM",
              duration: c.duration || "00:00",
              duration_formatted: c.durationFormatted || `${secs} seconds`,
              duration_seconds: secs,
              from_time: c.fromTime || c.callTime || null,
              end_time: c.endTime || null,
              outcome: c.outcome || (secs > 0 ? "Attended Call" : "Not Attended Call"),
              mindset: c.mindset || null,
              course_interested: c.courseInterested || l.courseInterested || null,
              qualification: c.qualification || l.qualification || null,
              passed_out_year: c.passedOutYear || l.passedOutYear || null,
              college_name: c.collegeName || l.collegeName || null,
              remarks: c.remarks || null,
            });
          });
        }
      });

      if (callsToUpsert.length > 0) {
        await supabase.from("calls").upsert(callsToUpsert, { onConflict: "id" });
      }
    }

    return NextResponse.json({ success: true, count: updatedData.leads.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
