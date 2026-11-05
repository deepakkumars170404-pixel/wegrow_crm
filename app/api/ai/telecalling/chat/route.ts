import { NextRequest, NextResponse } from "next/server";
import { initialCourses } from "@/data/dummy-data";

// Comprehensive WeGrow Institute Counseling Knowledge
const WEGROW_KNOWLEDGE = {
  name: "WeGrow Skill Campus",
  location: "Parasakthi Colony, Opposite Ayyappan Kovil, Sivakasi - 626123, Tamil Nadu",
  phone: "+91 99523 37331",
  email: "admissions@wegrow.edu",
  courses: initialCourses.map((c) => ({
    name: c.name,
    category: c.category,
    duration: c.duration,
    fee: c.fee,
    mode: c.mode,
    highlights: c.highlights,
    syllabus: c.curriculum,
  })),
  admissions: {
    batches:
      "Weekday Batches (Morning 9:30 AM - 1:00 PM, Evening 4:00 PM - 7:30 PM) & Weekend Batches (Sat/Sun 10:00 AM - 4:00 PM)",
    installments: "2 to 3 easy installments allowed without interest.",
    scholarships:
      "Up to 15% merit scholarship for early registrations and college toppers.",
    placements:
      "100% Placement Assistance with 50+ hiring partner companies across Chennai, Bangalore, and Madurai. Mock interviews and resume building included.",
    demoClass:
      "Free 2-day live interactive demo class available every Saturday and Sunday at Sivakasi campus.",
  },
};

const SYSTEM_PROMPT = `You are an AI Admissions Counselor at "WeGrow Skill Campus", located in Sivakasi, Tamil Nadu.
You are talking on a real-time phone call with a prospective student or parent.

GUIDELINES FOR YOUR SPEECH & TONE:
1. "reply": Output conversational, natural Tanglish / English (mix of Tamil and English as spoken naturally in Tamil Nadu) for the on-screen live subtitles (max 2-3 sentences).
2. "tamilSpeech": CRITICAL! Provide the exact spoken text in NATURAL SPOKEN TAMIL UNICODE SCRIPT (தமிழ் எழுத்துக்களில்). This will be fed directly to the Tamil neural voice synthesizer.
   - It MUST be written in natural Tamil script (தமிழ் வார்த்தைகள்). E.g. "வணக்கம்! வீக்ரோ ஸ்கில் கேம்பஸ்ல உங்களுக்கு எந்த கோர்ஸ் பத்தி விவரங்கள் வேணும்?"
   - Do NOT use English letters in "tamilSpeech" because English letters get spelled letter-by-letter (like V-A-N-A-K-K-A-M). Write genuine Tamil words!
3. Keep replies CONCISE and PHONE-FRIENDLY (2 to 3 short sentences maximum). Do not give long essay answers because people are listening on a phone call!
4. Be warm, enthusiastic, and encouraging.
5. Always guide the student towards booking a Free Demo Class or visiting the Sivakasi campus.
6. If the user asks for a human counselor or manager ("transfer pannunga", "manager kitta pesanum", "human"), acknowledge politely and set "transferToHuman": true.
7. Answer accurately about WeGrow courses, fees, duration, batches, placement support, and Sivakasi campus location.

INSTITUTE KNOWLEDGE BASE:
${JSON.stringify(WEGROW_KNOWLEDGE, null, 2)}

OUTPUT FORMAT:
Respond strictly in JSON format with these exact keys:
{
  "reply": "Your conversational voice reply in natural Tanglish (max 2-3 sentences) for UI subtitles",
  "tamilSpeech": "The voice script in pure natural Tamil Unicode letters (தமிழ் எழுத்துக்கள்) for realistic voice playback",
  "detectedCourse": "Name of course student is interested in (or 'General Enquiry')",
  "leadQualification": {
    "score": 85,
    "tag": "HOT", // "HOT" (score >= 75), "WARM" (score 40-74), or "COLD" (score < 40)
    "reason": "Brief reason for qualification"
  },
  "sentiment": "Positive" | "Neutral" | "Skeptical" | "Interested",
  "demoBooked": true or false,
  "demoDetails": {
    "date": "YYYY-MM-DD",
    "time": "HH:MM AM/PM",
    "mode": "Campus Visit" | "Online Demo"
  } or null,
  "transferToHuman": true or false,
  "summaryBullets": [
    "Intent: Why they called",
    "Key Discussion: Topics covered",
    "Next Action: What needs to be done next"
  ]
}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userMessage,
      conversationHistory = [],
      leadInfo = {},
      apiKey = "",
      voiceGender = "female",
    } = body;

    const geminiKey = apiKey || process.env.GEMINI_API_KEY || "";
    const counselorName = voiceGender === "male" ? "Vikram" : "Kavya";

    // If Gemini API Key is provided, call Google Gemini Flash-Lite
    if (geminiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${geminiKey}`;

        const personaPrompt = SYSTEM_PROMPT.replace(
          'You are an AI Admissions Counselor',
          `You are "${counselorName}", a friendly and professional AI Admissions Counselor`
        );

        const contents = [
          {
            role: "user",
            parts: [{ text: personaPrompt }],
          },
          {
            role: "model",
            parts: [
              {
                text: JSON.stringify({
                  reply: `Vanakkam! Welcome to WeGrow Skill Campus, Sivakasi. Naan ungaloda counselor ${counselorName}. Ungalukku entha course pathi details venum?`,
                  tamilSpeech: `வணக்கம்! வீக்ரோ ஸ்கில் கேம்பஸுக்கு உங்களை அன்போடு வரவேற்கிறோம். நான் உங்கள் கவுன்சிலர் ${
                    voiceGender === "male" ? "விக்ரம்" : "காவ்யா"
                  }. உங்களுக்கு எந்த கோர்ஸ் பத்தி விவரங்கள் வேணும்?`,
                  detectedCourse: "General Enquiry",
                  leadQualification: {
                    score: 50,
                    tag: "WARM",
                    reason: "Initial call greeting",
                  },
                  sentiment: "Interested",
                  demoBooked: false,
                  demoDetails: null,
                  transferToHuman: false,
                  summaryBullets: [
                    "Intent: Incoming call received",
                    "Key Discussion: Welcomed caller to WeGrow",
                    "Next Action: Identify interested course",
                  ],
                }),
              },
            ],
          },
          ...conversationHistory.map((m: any) => ({
            role: m.sender === "user" ? "user" : "model",
            parts: [
              {
                text:
                  typeof m.text === "string"
                    ? m.text
                    : JSON.stringify(m.text),
              },
            ],
          })),
          {
            role: "user",
            parts: [
              {
                text: `Lead context: Name: ${
                  leadInfo.name || "Caller"
                }, Phone: ${leadInfo.phone || "Unknown"}, Course: ${
                  leadInfo.course || "Not specified"
                }.
Student said: "${userMessage}".
Generate your next phone call response in the specified JSON structure with both "reply" (Tanglish) and "tamilSpeech" (pure Tamil script).`,
              },
            ],
          },
        ];

        const response = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 700,
              responseMimeType: "application/json",
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const rawText =
            data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (rawText) {
            const parsed = JSON.parse(rawText);
            // Ensure tamilSpeech exists
            if (!parsed.tamilSpeech) {
              parsed.tamilSpeech = convertToTamilSpeechFallback(parsed.reply);
            }
            return NextResponse.json(parsed);
          }
        }
      } catch (geminiErr) {
        console.warn(
          "Gemini direct API call failed, falling back to neural rules engine:",
          geminiErr
        );
      }
    }

    // =========================================================================
    // Intelligent Fallback Neural Counseling Engine (Works offline without API key)
    // =========================================================================
    const fallbackResponse = generateIntelligentFallback(
      userMessage,
      conversationHistory,
      leadInfo,
      counselorName
    );
    return NextResponse.json(fallbackResponse);
  } catch (error: any) {
    console.error("AI Telecalling route error:", error);
    return NextResponse.json(
      {
        reply:
          "Kandippa! Ungaloda enquiry namma WeGrow system-la note pannitten. Sivakasi campus counselor ungalukku detailed details WhatsApp-la anupuvaanga.",
        tamilSpeech:
          "கண்டிப்பா! உங்களோட விவரங்களை வீக்ரோ சிஸ்டத்தில் பதிவு பண்ணிட்டேன். சிவகாசி கேம்பஸ் கவுன்சிலர் உங்களுக்கு கூடுதல் விவரங்களை வாட்ஸ்அப்பில் அனுப்புவாங்க.",
        detectedCourse: "General Enquiry",
        leadQualification: {
          score: 60,
          tag: "WARM",
          reason: "Standard enquiry",
        },
        sentiment: "Interested",
        demoBooked: false,
        demoDetails: null,
        transferToHuman: false,
        summaryBullets: [
          "Intent: General enquiry call",
          "Key Discussion: Shared institute overview",
          "Next Action: Follow up with course brochure",
        ],
      },
      { status: 200 }
    );
  }
}

// Convert Tanglish reply into Tamil Unicode speech if missing
function convertToTamilSpeechFallback(reply: string): string {
  // If it already contains Tamil characters, return it
  if (/[\u0B80-\u0BFF]/.test(reply)) return reply;

  // Simple phrase substitutions
  let t = reply;
  t = t.replace(/vanakkam/gi, "வணக்கம்");
  t = t.replace(/kandippa/gi, "கண்டிப்பா");
  t = t.replace(/super/gi, "சூப்பர்");
  t = t.replace(/full stack/gi, "ஃபுல் ஸ்டேக் வெப் டெவலப்மென்ட்");
  t = t.replace(/mern/gi, "மெர்ன் ஸ்டேக்");
  t = t.replace(/fees/gi, "கட்டணம்");
  t = t.replace(/duration/gi, "பயிற்சி காலம்");
  t = t.replace(/sivakasi/gi, "சிவகாசி");
  t = t.replace(/placement/gi, "வேலைவாய்ப்பு உதவி");
  t = t.replace(/demo/gi, "டெமோ கிளாஸ்");
  return t;
}

// Built-in intelligent heuristic engine for offline or fallback operation
function generateIntelligentFallback(
  input: string,
  history: any[],
  leadInfo: any,
  counselorName: string
): any {
  const text = (input || "").toLowerCase();

  // 1. Human Transfer Request
  if (
    text.includes("human") ||
    text.includes("manager") ||
    text.includes("real person") ||
    text.includes("transfer") ||
    text.includes("counselor kitta") ||
    text.includes("direct ah pesanum")
  ) {
    return {
      reply:
        "Kandippa! Oru second line-la irunga, namma WeGrow senior counselor-kitta call-ah immediate-ah transfer panren.",
      tamilSpeech:
        "கண்டிப்பா! ஒரு நிமிஷம் லைன்ல இருங்க, நம்ம வீக்ரோ சீனியர் கவுன்சிலரிடம் காலை உடனே டிரான்ஸ்பர் பண்றேன்.",
      detectedCourse: leadInfo?.course || "General Enquiry",
      leadQualification: {
        score: 85,
        tag: "HOT",
        reason: "Requested direct counselor discussion",
      },
      sentiment: "Interested",
      demoBooked: false,
      demoDetails: null,
      transferToHuman: true,
      summaryBullets: [
        "Intent: Requested human counselor transfer",
        "Key Discussion: Handed over live call to senior admissions staff",
        "Next Action: Human counselor attending call",
      ],
    };
  }

  // 2. Demo Class Booking
  if (
    text.includes("demo") ||
    text.includes("trial") ||
    text.includes("visit") ||
    text.includes("saturday") ||
    text.includes("sunday") ||
    text.includes("tomorrow") ||
    text.includes("direct ah varen") ||
    text.includes("varren")
  ) {
    const today = new Date();
    const demoDate = new Date(today);
    demoDate.setDate(today.getDate() + 2);
    const dateStr = demoDate.toISOString().split("T")[0];

    return {
      reply:
        "Super! Ungalukku intha Saturday morning 10:30 AM Sivakasi campus-la Free Demo Class & Counselor meeting book pannittaen. WhatsApp-la location & invite link anupava?",
      tamilSpeech:
        "சூப்பர்! உங்களுக்கு வர்ற சனிக்கிழமை காலை பத்து முப்பது மணிக்கு சிவகாசி கேம்பஸ்ல இலவச டெமோ கிளாஸ் மற்றும் கவுன்சிலர் சந்திப்பு புக் பண்ணிட்டேன். வாட்ஸ்அப்ல லொகேஷன் அனுப்பவா?",
      detectedCourse: leadInfo?.course || "Full Stack Web Development",
      leadQualification: {
        score: 92,
        tag: "HOT",
        reason: "Confirmed free demo class booking",
      },
      sentiment: "Interested",
      demoBooked: true,
      demoDetails: {
        date: dateStr,
        time: "10:30 AM",
        mode: "Campus Visit",
      },
      transferToHuman: false,
      summaryBullets: [
        "Intent: Free Demo Class Booking",
        `Key Discussion: Scheduled campus demo for ${dateStr} at 10:30 AM`,
        "Next Action: Send WhatsApp campus location pin and demo invite card",
      ],
    };
  }

  // 3. Course: Full Stack Web Development (MERN + Next.js)
  if (
    text.includes("full stack") ||
    text.includes("mern") ||
    text.includes("react") ||
    text.includes("web development") ||
    text.includes("coding")
  ) {
    return {
      reply:
        "WeGrow-la Full Stack MERN + Next.js 6 Months intensive program irukku. React, Node.js, Next.js, and live enterprise projects kooda 100% placement support tharom. Fees ₹55,000, 2-3 installments-la kattalaam. Weekend batch venuma, weekday-ah?",
      tamilSpeech:
        "வீக்ரோவில் ஃபுல் ஸ்டேக் மெர்ன் மற்றும் நெக்ஸ்ட் ஜேஎஸ் ஆறு மாத தீவிர பயிற்சி இருக்கு. ரியாக்ட், நோட் ஜேஎஸ், மற்றும் நேரடி ப்ராஜெக்ட்களுடன் நூறு சதவீத வேலைவாய்ப்பு உதவி தருகிறோம். கட்டணம் ஐம்பத்தைந்தாயிரம் ரூபாய், தவணைகளில் கட்டலாம். உங்களுக்கு வீக்கெண்ட் பேட்ச் வேணுமா அல்லது வீக்டேவா?",
      detectedCourse: "Full Stack Web Development (MERN + Next.js)",
      leadQualification: {
        score: 80,
        tag: "HOT",
        reason: "Specific interest in Full Stack MERN program",
      },
      sentiment: "Positive",
      demoBooked: false,
      demoDetails: null,
      transferToHuman: false,
      summaryBullets: [
        "Intent: Full Stack MERN course enquiry",
        "Key Discussion: Shared syllabus, 6 months duration, ₹55,000 fees with installment options",
        "Next Action: Enquire about batch timing (weekday vs weekend)",
      ],
    };
  }

  // 4. Course: AI / Generative AI / Data Science
  if (
    text.includes("ai") ||
    text.includes("artificial intelligence") ||
    text.includes("data science") ||
    text.includes("machine learning") ||
    text.includes("python")
  ) {
    return {
      reply:
        "Namma WeGrow AI Explorer & GenAI course 4 months duration, fee ₹45,000. Data Science & ML course 5 months, fee ₹48,000. Hands-on labs, LLMs, and real Kaggle datasets cover aagum. Neenga fresh graduate-ah allathu working professional-ah?",
      tamilSpeech:
        "நம்ம வீக்ரோ ஏஐ மற்றும் ஜென் ஏஐ கோர்ஸ் நான்கு மாத பயிற்சி, கட்டணம் நாற்பத்தைந்தாயிரம் ரூபாய். டேட்டா சயின்ஸ் மற்றும் மெஷின் லேர்னிங் ஐந்து மாத பயிற்சி. நீங்க கல்லூரி முடித்தவரா அல்லது வேலை பார்ப்பவரா?",
      detectedCourse: "AI Explorer & Generative AI",
      leadQualification: {
        score: 78,
        tag: "HOT",
        reason: "Interested in high-demand GenAI & Data Science",
      },
      sentiment: "Positive",
      demoBooked: false,
      demoDetails: null,
      transferToHuman: false,
      summaryBullets: [
        "Intent: GenAI and Data Science course enquiry",
        "Key Discussion: Shared curriculum highlights, ₹45,000/₹48,000 fees",
        "Next Action: Check graduation background for batch allotment",
      ],
    };
  }

  // 5. Course: Digital Marketing / UI/UX Design
  if (
    text.includes("digital marketing") ||
    text.includes("seo") ||
    text.includes("ui") ||
    text.includes("ux") ||
    text.includes("design") ||
    text.includes("figma")
  ) {
    const isUIUX =
      text.includes("ui") || text.includes("ux") || text.includes("design");
    const courseName = isUIUX
      ? "UI/UX Design Masterclass"
      : "Digital Marketing & Performance Growth";
    const fee = isUIUX ? "₹38,000 (4 Months)" : "₹32,000 (3 Months)";

    return {
      reply: `Super! Namma ${courseName} course ${fee}. Live real client campaigns, portfolio design, and certifications include aagidum. Neenga Sivakasi nearby-la irukeengala?`,
      tamilSpeech: isUIUX
        ? "சூப்பர்! நம்ம யுஐ யூக்ச் டிசைன் மாஸ்டர் கிளாஸ் நான்கு மாத பயிற்சி, கட்டணம் முப்பத்தெட்டாயிரம் ரூபாய். ஃபிக்மா மற்றும் லைவ் போர்ட்ஃபோலியோ டிசைன் கற்றுத் தருகிறோம். நீங்க சிவகாசி அருகில் இருக்கீங்களா?"
        : "சூப்பர்! நம்ம டிஜிட்டல் மார்க்கெட்டிங் பயிற்சி மூன்று மாதம், கட்டணம் முப்பத்திரண்டாயிரம் ரூபாய். கூகுள் விளம்பரங்கள் மற்றும் சமூக ஊடக விளம்பரங்கள் கற்றுத் தருகிறோம். நீங்க சிவகாசி அருகில் இருக்கீங்களா?",
      detectedCourse: courseName,
      leadQualification: {
        score: 75,
        tag: "HOT",
        reason: `Enquired about ${courseName}`,
      },
      sentiment: "Positive",
      demoBooked: false,
      demoDetails: null,
      transferToHuman: false,
      summaryBullets: [
        `Intent: ${courseName} enquiry`,
        `Key Discussion: Explained practical portfolio work and fees (${fee})`,
        "Next Action: Invite for campus portfolio review demo",
      ],
    };
  }

  // 6. Fees / Discount / Installments Question
  if (
    text.includes("fee") ||
    text.includes("fees") ||
    text.includes("cost") ||
    text.includes("discount") ||
    text.includes("installment") ||
    text.includes("panam") ||
    text.includes("evvalavu")
  ) {
    return {
      reply:
        "Namma courses ₹32,000-la irunthu start aaguthu. Full fees ore thadava katta vendam — 2 or 3 easy installments-la kattalaam. Intha week enroll panna special scholarship discount-um irukku. Ungalukku entha course-oda fees venum?",
      tamilSpeech:
        "நம்ம கோர்ஸ்கள் முப்பத்திரண்டாயிரம் ரூபாயில் இருந்து தொடங்குது. மொத்த தொகையையும் ஒரே நேரத்தில் கட்ட வேண்டாம், இரண்டு அல்லது மூன்று தவணைகளில் கட்டலாம். மேலும் சிறப்பு உதவித்தொகையும் உண்டு. உங்களுக்கு எந்த கோர்ஸ் கட்டணம் தெரியணும்?",
      detectedCourse: leadInfo?.course || "General Enquiry",
      leadQualification: {
        score: 70,
        tag: "WARM",
        reason: "Budget & installment enquiry",
      },
      sentiment: "Interested",
      demoBooked: false,
      demoDetails: null,
      transferToHuman: false,
      summaryBullets: [
        "Intent: Fee structure & installment enquiry",
        "Key Discussion: Explained 2-3 installments policy and merit scholarship eligibility",
        "Next Action: Provide exact course quotation on WhatsApp",
      ],
    };
  }

  // 7. Placement / Job Guarantee Question
  if (
    text.includes("job") ||
    text.includes("placement") ||
    text.includes("salary") ||
    text.includes("company") ||
    text.includes("interview") ||
    text.includes("velai")
  ) {
    return {
      reply:
        "WeGrow-la dedicated Placement Cell irukku! 50+ hiring partner companies kooda tie-up irukku. Course mudinja udane resume preparation, mock interviews, and guaranteed placement drive access tharom. Average package ₹3.5 LPA to ₹6 LPA kedaikkum!",
      tamilSpeech:
        "வீக்ரோவில் பிரத்யேக வேலைவாய்ப்பு பிரிவு செயல்படுகிறது! ஐம்பதுக்கும் மேற்பட்ட நிறுவனங்களுடன் கூட்டு வைத்துள்ளோம். ரெஸ்யூம் தயாரிப்பு மற்றும் இன்டர்வியூ பயிற்சி உண்டு. சராசரி சம்பளம் ஆண்டுக்கு மூன்றரை முதல் ஆறு லட்சம் ரூபாய் வரை கிடைக்கும்!",
      detectedCourse: leadInfo?.course || "General Enquiry",
      leadQualification: {
        score: 82,
        tag: "HOT",
        reason: "Career-oriented lead looking for placements",
      },
      sentiment: "Positive",
      demoBooked: false,
      demoDetails: null,
      transferToHuman: false,
      summaryBullets: [
        "Intent: Placement assistance enquiry",
        "Key Discussion: Highlighted 50+ hiring partners, ₹3.5 - ₹6 LPA average CTC, mock interviews",
        "Next Action: Share placement success stories brochure",
      ],
    };
  }

  // 8. Location / Campus Address Question
  if (
    text.includes("address") ||
    text.includes("location") ||
    text.includes("enga irukku") ||
    text.includes("sivakasi") ||
    text.includes("branch") ||
    text.includes("hostel")
  ) {
    return {
      reply:
        "Namma WeGrow Skill Campus Sivakasi-la Parasakthi Colony, Ayyappan Kovil Opposite-la irukku. Outstation students-ku nearby verified hostel facilities-um irukku. Neenga eppo direct-ah visit panna mudiyum?",
      tamilSpeech:
        "நம்ம வீக்ரோ ஸ்கில் கேம்பஸ் சிவகாசியில் பராசக்தி காலனி, ஐயப்பன் கோவில் எதிரில் அமைந்துள்ளது. வெளியூர் மாணவர்களுக்கு தங்கும் விடுதி வசதியும் உண்டு. நீங்க எப்போ நேரில் வர முடியும்?",
      detectedCourse: leadInfo?.course || "General Enquiry",
      leadQualification: {
        score: 76,
        tag: "WARM",
        reason: "Location & campus enquiry",
      },
      sentiment: "Interested",
      demoBooked: false,
      demoDetails: null,
      transferToHuman: false,
      summaryBullets: [
        "Intent: Campus address & hostel facility enquiry",
        "Key Discussion: Provided Sivakasi Parasakthi Colony location details and hostel options",
        "Next Action: Invite for direct campus walk-in tour",
      ],
    };
  }

  // 9. Default Warm Conversational Greeting
  return {
    reply: `Vanakkam! WeGrow Skill Campus-ku welcome. Naan ${counselorName}, WeGrow AI counselor. Namma campus-la Full Stack, AI & GenAI, Data Science, and Digital Marketing courses offer panrom. Ungalukku entha field-la career build panna interest irukku?`,
    tamilSpeech: `வணக்கம்! வீக்ரோ ஸ்கில் கேம்பஸுக்கு உங்களை அன்போடு வரவேற்கிறோம். நான் உங்கள் கவுன்சிலர் ${
      counselorName === "Vikram" ? "விக்ரம்" : "காவ்யா"
    }. நம்ம கேம்பஸ்ல ஃபுல் ஸ்டேக், ஏஐ, டேட்டா சயின்ஸ் கோர்ஸ்கள் உள்ளன. உங்களுக்கு எந்த துறையில் ஆர்வம் உள்ளது?`,
    detectedCourse: leadInfo?.course || "General Enquiry",
    leadQualification: {
      score: 65,
      tag: "WARM",
      reason: "Initial exploratory conversation",
    },
    sentiment: "Interested",
    demoBooked: false,
    demoDetails: null,
    transferToHuman: false,
    summaryBullets: [
      "Intent: Course exploration call",
      "Key Discussion: Introduced top career tracks and offered counseling guidance",
      "Next Action: Qualify student background and career interest",
    ],
  };
}
