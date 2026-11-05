import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { leadIds = [], leads = [] } = await req.json();

    if (!leads.length && !leadIds.length) {
      return NextResponse.json({ error: "No leads provided for batch calling" }, { status: 400 });
    }

    const targetLeads = leads.length ? leads : [];

    // Simulate intelligent batch AI dialing for each lead
    const results = targetLeads.map((lead: any, index: number) => {
      // Deterministic yet varied realistic outcomes based on lead data
      const randomSeed = (lead.id || "").charCodeAt(lead.id.length - 1) || index;
      let outcome = "Interested";
      let qualificationTag: "HOT" | "WARM" | "COLD" = "WARM";
      let qualificationScore = 70;
      let durationSecs = 75 + (randomSeed % 60);
      let remarks = "";
      let demoBooked = false;

      if (randomSeed % 3 === 0) {
        outcome = "Interested";
        qualificationTag = "HOT";
        qualificationScore = 88;
        demoBooked = true;
        remarks = "AI Voice Pitch: Student showed high interest in upcoming batch. Booked Free Demo Class for this Saturday 10:30 AM at Sivakasi campus.";
      } else if (randomSeed % 3 === 1) {
        outcome = "Follow-up Required";
        qualificationTag = "WARM";
        qualificationScore = 65;
        remarks = "AI Voice Pitch: Parent enquired about course fees and installment options. Requested syllabus brochure on WhatsApp.";
      } else {
        outcome = "Call Later";
        qualificationTag = "COLD";
        qualificationScore = 35;
        remarks = "AI Voice Pitch: Caller was travelling, requested callback tomorrow morning at 11:00 AM.";
      }

      return {
        leadId: lead.id,
        studentName: lead.studentName,
        phone: lead.phone,
        courseInterested: lead.courseInterested,
        status: demoBooked ? "Scheduled" : "Follow-up",
        priority: qualificationTag === "HOT" ? "Hot" : qualificationTag === "WARM" ? "Warm" : "Cold",
        qualificationScore,
        outcome,
        duration: `${Math.floor(durationSecs / 60)}m ${durationSecs % 60}s`,
        remarks,
        demoBooked,
        processedAt: new Date().toISOString(),
      };
    });

    const hotCount = results.filter((r: any) => r.priority === "Hot").length;
    const warmCount = results.filter((r: any) => r.priority === "Warm").length;
    const coldCount = results.filter((r: any) => r.priority === "Cold").length;
    const demosCount = results.filter((r: any) => r.demoBooked).length;

    return NextResponse.json({
      success: true,
      totalDialed: results.length,
      connected: results.length,
      hotLeads: hotCount,
      warmLeads: warmCount,
      coldLeads: coldCount,
      demosBooked: demosCount,
      conversionRate: Math.round((hotCount / results.length) * 100),
      campaignResults: results,
    });
  } catch (error: any) {
    console.error("Batch calling error:", error);
    return NextResponse.json({ error: error.message || "Failed to process batch calling" }, { status: 500 });
  }
}
