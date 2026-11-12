// Migration script: Transfers all data from data/crm_storage.json to Supabase
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// Read .env.local
const envPath = path.join(__dirname, "..", ".env.local");
let envConfig = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [k, ...v] = trimmed.split("=");
      if (k && v.length) envConfig[k.trim()] = v.join("=").trim();
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || envConfig.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  envConfig.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ ERROR: Supabase URL or Key not found in .env.local!");
  console.error("Please add the following to .env.local:");
  console.error("NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co");
  console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log("🚀 Starting WeGrow CRM to Supabase Migration...");
  console.log(`🔗 Target Supabase: ${supabaseUrl}`);

  const storagePath = path.join(__dirname, "..", "data", "crm_storage.json");
  if (!fs.existsSync(storagePath)) {
    console.error("❌ crm_storage.json not found!");
    process.exit(1);
  }

  const raw = fs.readFileSync(storagePath, "utf-8");
  const data = JSON.parse(raw);
  const leads = data.leads || [];
  const followUps = data.followUps || [];

  console.log(`📦 Found ${leads.length} leads and ${followUps.length} follow-ups in local JSON database.`);

  // 1. Migrate Leads
  console.log("⏳ Uploading Leads to Supabase...");
  const leadsToInsert = leads.map((l) => ({
    id: l.id,
    student_name: l.studentName || "Inquiry Student",
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

  const { error: leadsErr } = await supabase.from("leads").upsert(leadsToInsert, { onConflict: "id" });
  if (leadsErr) {
    console.error("❌ Error migrating leads:", leadsErr.message);
  } else {
    console.log(`✅ Successfully migrated ${leadsToInsert.length} leads!`);
  }

  // 2. Migrate Call Histories
  console.log("⏳ Extracting and uploading Call Logs...");
  const callsToInsert = [];
  leads.forEach((l) => {
    if (Array.isArray(l.callHistory)) {
      l.callHistory.forEach((c, idx) => {
        callsToInsert.push({
          id: c.id || `cr-${l.id}-${idx}`,
          lead_id: l.id,
          student_name: c.studentName || l.studentName,
          phone: l.phone,
          caller_name: c.callerName || "Staff",
          call_date: c.callDate || "2026-11-11",
          call_time: c.callTime || null,
          duration: c.duration || "00:00",
          duration_formatted: c.durationFormatted || null,
          from_time: c.fromTime || null,
          end_time: c.endTime || null,
          outcome: c.outcome || "Attended Call",
          mindset: c.mindset || "Interested",
          course_interested: c.courseInterested || l.courseInterested || null,
          qualification: c.qualification || l.qualification || null,
          passed_out_year: c.passedOutYear || l.passedOutYear || null,
          college_name: c.collegeName || l.collegeName || null,
          remarks: c.remarks || null,
        });
      });
    }
  });

  if (callsToInsert.length > 0) {
    const { error: callsErr } = await supabase.from("calls").upsert(callsToInsert, { onConflict: "id" });
    if (callsErr) {
      console.error("❌ Error migrating calls:", callsErr.message);
    } else {
      console.log(`✅ Successfully migrated ${callsToInsert.length} call records!`);
    }
  }

  // 3. Migrate Follow-ups
  console.log("⏳ Uploading Follow-up Tasks...");
  if (followUps.length > 0) {
    const followUpsToInsert = followUps.map((f, idx) => ({
      id: f.id || `fu-${idx}-${Date.now()}`,
      lead_id: f.leadId || null,
      student_name: f.studentName || "Student",
      phone: f.phone,
      caller_name: f.callerName || "Staff",
      course: f.course || null,
      scheduled_date: f.scheduledDate || f.date || "2026-11-12",
      scheduled_time: f.scheduledTime || f.time || "10:30 AM",
      status: f.status || "Pending",
      remarks: f.remarks || f.notes || null,
    }));

    const { error: fuErr } = await supabase.from("follow_ups").upsert(followUpsToInsert, { onConflict: "id" });
    if (fuErr) {
      console.error("❌ Error migrating follow-ups:", fuErr.message);
    } else {
      console.log(`✅ Successfully migrated ${followUpsToInsert.length} follow-ups!`);
    }
  }

  console.log("\n🎉 ALL WEGROW CRM DATA SUCCESSFULLY MIGRATED TO SUPABASE!");
}

runMigration().catch((err) => {
  console.error("Fatal Migration Error:", err);
  process.exit(1);
});
