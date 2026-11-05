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

INTELLIGENT TRILINGUAL ADAPTATION (Tamil, English, Tanglish):
Listen carefully to the language the student or parent is speaking and match their language naturally:
1. IF USER SPEAKS IN ENGLISH:
   - "detectedLanguage": "English"
   - "ttsLang": "en"
   - "reply": Natural, professional, friendly English (max 2-3 sentences).
   - "spokenAudioText": Clean English text without special symbols (e.g., "Welcome to WeGrow Skill Campus! Our Full Stack MERN program is a 6-month intensive course. The fee is 55,000 rupees payable in 3 installments.")
2. IF USER SPEAKS IN TAMIL (தமிழ் எழுத்துக்களில் அல்லது தூய தமிழில்):
   - "detectedLanguage": "Tamil"
   - "ttsLang": "ta"
   - "reply": Pure, polite spoken Tamil in Tamil script (max 2-3 sentences).
   - "spokenAudioText": Pure Tamil Unicode script (தமிழ் எழுத்துக்கள்).
3. IF USER SPEAKS IN TANGLISH (Tamil mixed with English words, e.g. "fees evvalavu?", "placement irukka?"):
   - "detectedLanguage": "Tanglish"
   - "ttsLang": "ta"
   - "reply": Conversational Tanglish for on-screen subtitles (e.g. "WeGrow-la Full Stack MERN 6 months program irukku. Fees ₹55,000, installments-la kattalaam.")
   - "spokenAudioText": Natural spoken Tamil written strictly in TAMIL UNICODE SCRIPT (தமிழ் எழுத்துக்களில்) so the speech engine pronounces real fluid words and NEVER spells out English letters! (e.g. "வீக்ரோவில் ஃபுல் ஸ்டேக் மெர்ன் ஆறு மாத பயிற்சி இருக்கு. கட்டணம் ஐம்பத்தைந்தாயிரம் ரூபாய், தவணைகளில் கட்டலாம்.")

GENERAL GUIDELINES:
- Keep replies CONCISE and PHONE-FRIENDLY (2 to 3 short sentences max). People are listening on a phone call.
- Always encourage booking a Free Demo Class or visiting the Sivakasi campus.
- If the user asks for a human counselor or manager ("transfer pannunga", "manager", "human person"), acknowledge politely and set "transferToHuman": true.
- Answer accurately regarding WeGrow courses, fees, duration, batches, placement support, and Sivakasi campus location.

INSTITUTE KNOWLEDGE BASE:
${JSON.stringify(WEGROW_KNOWLEDGE, null, 2)}

OUTPUT FORMAT:
Respond strictly in JSON format with these exact keys:
{
  "detectedLanguage": "English" | "Tamil" | "Tanglish",
  "ttsLang": "en" | "ta",
  "reply": "Conversational reply in caller's matched language (for UI display)",
  "spokenAudioText": "Exact text for speech audio (English for English; pure Tamil script for Tamil/Tanglish)",
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

    // Detect input language heuristically
    const detectedInputLang = detectUserLanguage(userMessage);

    // If Gemini API Key is provided, call Google Gemini 3.5 Flash-Lite
    if (geminiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${geminiKey}`;

        const personaPrompt = SYSTEM_PROMPT.replace(
          'You are an AI Admissions Counselor',
          `You are "${counselorName}", a friendly and professional AI Admissions Counselor (${
            voiceGender === "male" ? "Male voice" : "Female voice"
          })`
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
                  detectedLanguage: "Tanglish",
                  ttsLang: "ta",
                  reply: `Vanakkam! Welcome to WeGrow Skill Campus, Sivakasi. Naan ungaloda counselor ${counselorName}. Ungalukku entha course pathi details venum?`,
                  spokenAudioText: `வணக்கம்! வீக்ரோ ஸ்கில் கேம்பஸுக்கு உங்களை அன்போடு வரவேற்கிறோம். நான் உங்கள் கவுன்சிலர் ${
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
                text: `Lead context: Name: ${leadInfo.name || "Caller"}, Phone: ${
                  leadInfo.phone || "Unknown"
                }, Course: ${leadInfo.course || "Not specified"}.
Student said: "${userMessage}".
Language detected from user utterance: ${detectedInputLang}.
Respond matching this language with accurate "detectedLanguage", "ttsLang" ("en" or "ta"), "reply", and "spokenAudioText" in valid JSON.`,
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
              maxOutputTokens: 750,
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

            // Backward compatibility fields
            if (!parsed.tamilSpeech && parsed.spokenAudioText) {
              parsed.tamilSpeech = parsed.spokenAudioText;
            }
            if (!parsed.ttsLang) {
              parsed.ttsLang = parsed.detectedLanguage === "English" ? "en" : "ta";
            }
            return NextResponse.json(parsed);
          }
        }
      } catch (geminiErr) {
        console.warn(
          "Gemini API call failed, falling back to intelligent multilingual engine:",
          geminiErr
        );
      }
    }

    // =========================================================================
    // Intelligent Trilingual Fallback Engine (English / Tamil / Tanglish)
    // =========================================================================
    const fallbackResponse = generateTrilingualFallback(
      userMessage,
      conversationHistory,
      leadInfo,
      counselorName,
      detectedInputLang
    );
    return NextResponse.json(fallbackResponse);
  } catch (error: any) {
    console.error("AI Telecalling chat route error:", error);
    return NextResponse.json(
      {
        detectedLanguage: "Tanglish",
        ttsLang: "ta",
        reply:
          "Kandippa! Ungaloda enquiry note pannitten. Namma Sivakasi counselor ungalukku syllabus & fees WhatsApp-la anupuvaanga.",
        spokenAudioText:
          "கண்டிப்பா! உங்களோட விவரங்களை பதிவு பண்ணிட்டேன். சிவகாசி கேம்பஸ் கவுன்சிலர் உங்களுக்கு பாடத்திட்டம் மற்றும் கட்டண விவரங்களை வாட்ஸ்அப்பில் அனுப்புவாங்க.",
        tamilSpeech:
          "கண்டிப்பா! உங்களோட விவரங்களை பதிவு பண்ணிட்டேன். சிவகாசி கேம்பஸ் கவுன்சிலர் உங்களுக்கு பாடத்திட்டம் மற்றும் கட்டண விவரங்களை வாட்ஸ்அப்பில் அனுப்புவாங்க.",
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

// Helper to detect if user input is English, Pure Tamil, or Tanglish
function detectUserLanguage(text: string): "English" | "Tamil" | "Tanglish" {
  const trimmed = (text || "").trim();
  if (!trimmed) return "Tanglish";

  // Check for Tamil Unicode characters
  if (/[\u0B80-\u0BFF]/.test(trimmed)) {
    return "Tamil";
  }

  const lower = trimmed.toLowerCase();
  const englishPhrases = [
    "what is",
    "how much",
    "can you",
    "tell me",
    "details about",
    "fees for",
    "duration of",
    "i want to",
    "hello",
    "good morning",
    "good evening",
    "placement assistance",
    "eligibility",
    "admission procedure",
    "syllabus",
    "certification",
  ];

  const tanglishPhrases = [
    "vanakkam",
    "evvalavu",
    "panam",
    "irukka",
    "solreenga",
    "sollunga",
    "theriyuma",
    "varen",
    "kattalaam",
    "velai",
    "engalukku",
    "ungaloda",
    "kitta",
    "pesanum",
    "mudiyuma",
    "kandippa",
    "pannunga",
  ];

  const hasTanglish = tanglishPhrases.some((tp) => lower.includes(tp));
  if (hasTanglish) return "Tanglish";

  const hasEnglish = englishPhrases.some((ep) => lower.includes(ep));
  if (hasEnglish) return "English";

  // Check word letter structure
  return "Tanglish";
}

// Built-in Trilingual Fallback Engine
function generateTrilingualFallback(
  input: string,
  history: any[],
  leadInfo: any,
  counselorName: string,
  lang: "English" | "Tamil" | "Tanglish"
): any {
  const text = (input || "").toLowerCase();

  // 1. Human Transfer Request
  if (
    text.includes("human") ||
    text.includes("manager") ||
    text.includes("transfer") ||
    text.includes("counselor kitta") ||
    text.includes("direct ah pesanum") ||
    text.includes("நேரில் பேச")
  ) {
    if (lang === "English") {
      return {
        detectedLanguage: "English",
        ttsLang: "en",
        reply: `Certainly! Please stay on the line for a moment, I am transferring your call directly to our Senior Admissions Counselor right now.`,
        spokenAudioText: `Certainly! Please stay on the line for a moment, I am transferring your call directly to our Senior Admissions Counselor right now.`,
        tamilSpeech: `கண்டிப்பா! ஒரு நிமிடம் லைனில் இருங்கள், எங்கள் சீனியர் கவுன்சிலரிடம் காலை இணைக்கிறேன்.`,
        detectedCourse: leadInfo?.course || "General Enquiry",
        leadQualification: { score: 85, tag: "HOT", reason: "Direct counselor transfer requested" },
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

    return {
      detectedLanguage: lang,
      ttsLang: "ta",
      reply:
        lang === "Tamil"
          ? "கண்டிப்பா! ஒரு நிமிடம் லைனில் இருங்கள், எங்கள் சீனியர் சேர்க்கை ஆலோசகரிடம் உங்களை இணைக்கிறேன்."
          : "Kandippa! Oru second line-la irunga, namma WeGrow senior counselor-kitta call-ah immediate-ah transfer panren.",
      spokenAudioText:
        "கண்டிப்பா! ஒரு நிமிஷம் லைன்ல இருங்க, நம்ம வீக்ரோ சீனியர் கவுன்சிலரிடம் காலை உடனே டிரான்ஸ்பர் பண்றேன்.",
      tamilSpeech:
        "கண்டிப்பா! ஒரு நிமிஷம் லைன்ல இருங்க, நம்ம வீக்ரோ சீனியர் கவுன்சிலரிடம் காலை உடனே டிரான்ஸ்பர் பண்றேன்.",
      detectedCourse: leadInfo?.course || "General Enquiry",
      leadQualification: { score: 85, tag: "HOT", reason: "Direct counselor transfer requested" },
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
    text.includes("வகுப்பு") ||
    text.includes("வருகிறேன்")
  ) {
    const today = new Date();
    const demoDate = new Date(today);
    demoDate.setDate(today.getDate() + 2);
    const dateStr = demoDate.toISOString().split("T")[0];

    if (lang === "English") {
      return {
        detectedLanguage: "English",
        ttsLang: "en",
        reply: `Awesome! I have scheduled a Free Demo Class and Campus Visit for you this Saturday at 10:30 AM at our Sivakasi campus. Shall I WhatsApp you the location pin and invite pass?`,
        spokenAudioText: `Awesome! I have scheduled a Free Demo Class and Campus Visit for you this Saturday at 10:30 AM at our Sivakasi campus. Shall I WhatsApp you the location pin and invite pass?`,
        tamilSpeech: `சூப்பர்! உங்களுக்கு வர்ற சனிக்கிழமை காலை பத்து முப்பது மணிக்கு சிவகாசி கேம்பஸ்ல இலவச டெமோ கிளாஸ் புக் பண்ணிட்டேன்.`,
        detectedCourse: leadInfo?.course || "Full Stack Web Development",
        leadQualification: { score: 92, tag: "HOT", reason: "Confirmed free demo class booking" },
        sentiment: "Interested",
        demoBooked: true,
        demoDetails: { date: dateStr, time: "10:30 AM", mode: "Campus Visit" },
        transferToHuman: false,
        summaryBullets: [
          "Intent: Free Demo Class Booking",
          `Key Discussion: Scheduled campus demo for ${dateStr} at 10:30 AM`,
          "Next Action: Send WhatsApp campus location pin and demo invite card",
        ],
      };
    }

    return {
      detectedLanguage: lang,
      ttsLang: "ta",
      reply:
        lang === "Tamil"
          ? "அருமை! வரும் சனிக்கிழமை காலை 10:30 மணிக்கு சிவகாசி கேம்பஸில் இலவச டெமோ கிளாஸ் பதிவு செய்துள்ளேன். வாட்ஸ்அப்பில் அழைப்பிதழ் அனுப்பவா?"
          : "Super! Ungalukku intha Saturday morning 10:30 AM Sivakasi campus-la Free Demo Class & Counselor meeting book pannittaen. WhatsApp-la location & invite link anupava?",
      spokenAudioText:
        "சூப்பர்! உங்களுக்கு வர்ற சனிக்கிழமை காலை பத்து முப்பது மணிக்கு சிவகாசி கேம்பஸ்ல இலவச டெமோ கிளாஸ் மற்றும் கவுன்சிலர் சந்திப்பு புக் பண்ணிட்டேன். வாட்ஸ்அப்ல லொகேஷன் அனுப்பவா?",
      tamilSpeech:
        "சூப்பர்! உங்களுக்கு வர்ற சனிக்கிழமை காலை பத்து முப்பது மணிக்கு சிவகாசி கேம்பஸ்ல இலவச டெமோ கிளாஸ் மற்றும் கவுன்சிலர் சந்திப்பு புக் பண்ணிட்டேன். வாட்ஸ்அப்ல லொகேஷன் அனுப்பவா?",
      detectedCourse: leadInfo?.course || "Full Stack Web Development",
      leadQualification: { score: 92, tag: "HOT", reason: "Confirmed free demo class booking" },
      sentiment: "Interested",
      demoBooked: true,
      demoDetails: { date: dateStr, time: "10:30 AM", mode: "Campus Visit" },
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
    text.includes("coding") ||
    text.includes("இணைய உருவாக்க")
  ) {
    if (lang === "English") {
      return {
        detectedLanguage: "English",
        ttsLang: "en",
        reply: `We offer a 6-month intensive Full Stack MERN and Next.js program covering React, Node.js, and live client projects with 100% placement support. The fee is ₹55,000, payable in 2 to 3 easy installments. Would you prefer weekday or weekend batches?`,
        spokenAudioText: `We offer a 6-month intensive Full Stack MERN and Next.js program covering React, Node.js, and live client projects with 100 percent placement support. The fee is 55,000 rupees, payable in 2 to 3 easy installments. Would you prefer weekday or weekend batches?`,
        tamilSpeech: `வீக்ரோவில் ஃபுல் ஸ்டேக் மெர்ன் ஆறு மாத தீவிர பயிற்சி உள்ளது. கட்டணம் ஐம்பத்தைந்தாயிரம் ரூபாய்.`,
        detectedCourse: "Full Stack Web Development (MERN + Next.js)",
        leadQualification: { score: 80, tag: "HOT", reason: "Specific interest in Full Stack MERN program" },
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

    return {
      detectedLanguage: lang,
      ttsLang: "ta",
      reply:
        lang === "Tamil"
          ? "வீக்ரோவில் ஃபுல் ஸ்டேக் வெப் டெவலப்மென்ட் 6 மாத பயிற்சி உள்ளது. ரியாக்ட், நோட் ஜேஎஸ், மற்றும் நெக்ஸ்ட் ஜேஎஸ் கற்றுத் தருகிறோம். கட்டணம் ₹55,000, தவணைகளில் கட்டலாம். உங்களுக்கு வீக்கெண்ட் பேட்ச் வேணுமா?"
          : "WeGrow-la Full Stack MERN + Next.js 6 Months intensive program irukku. React, Node.js, Next.js, and live enterprise projects kooda 100% placement support tharom. Fees ₹55,000, 2-3 installments-la kattalaam. Weekend batch venuma, weekday-ah?",
      spokenAudioText:
        "வீக்ரோவில் ஃபுல் ஸ்டேக் மெர்ன் மற்றும் நெக்ஸ்ட் ஜேஎஸ் ஆறு மாத தீவிர பயிற்சி இருக்கு. ரியாக்ட், நோட் ஜேஎஸ், மற்றும் நேரடி ப்ராஜெக்ட்களுடன் நூறு சதவீத வேலைவாய்ப்பு உதவி தருகிறோம். கட்டணம் ஐம்பத்தைந்தாயிரம் ரூபாய், தவணைகளில் கட்டலாம். உங்களுக்கு வீக்கெண்ட் பேட்ச் வேணுமா அல்லது வீக்டேவா?",
      tamilSpeech:
        "வீக்ரோவில் ஃபுல் ஸ்டேக் மெர்ன் மற்றும் நெக்ஸ்ட் ஜேஎஸ் ஆறு மாத தீவிர பயிற்சி இருக்கு. ரியாக்ட், நோட் ஜேஎஸ், மற்றும் நேரடி ப்ராஜெக்ட்களுடன் நூறு சதவீத வேலைவாய்ப்பு உதவி தருகிறோம். கட்டணம் ஐம்பத்தைந்தாயிரம் ரூபாய், தவணைகளில் கட்டலாம். உங்களுக்கு வீக்கெண்ட் பேட்ச் வேணுமா அல்லது வீக்டேவா?",
      detectedCourse: "Full Stack Web Development (MERN + Next.js)",
      leadQualification: { score: 80, tag: "HOT", reason: "Specific interest in Full Stack MERN program" },
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
    text.includes("python") ||
    text.includes("செயற்கை நுண்ணறிவு")
  ) {
    if (lang === "English") {
      return {
        detectedLanguage: "English",
        ttsLang: "en",
        reply: `Our AI Explorer & GenAI course is a 4-month program for ₹45,000, and Data Science & Machine Learning is 5 months for ₹48,000. It includes hands-on labs with LLMs and real datasets. Are you a college student or working professional?`,
        spokenAudioText: `Our AI Explorer and GenAI course is a 4-month program for 45,000 rupees, and Data Science and Machine Learning is 5 months for 48,000 rupees. It includes hands-on labs with LLMs and real datasets. Are you a college student or working professional?`,
        tamilSpeech: `வீக்ரோவில் ஏஐ மற்றும் டேட்டா சயின்ஸ் கோர்ஸ் நான்கு முதல் ஐந்து மாத பயிற்சி.`,
        detectedCourse: "AI Explorer & Generative AI",
        leadQualification: { score: 78, tag: "HOT", reason: "Interested in GenAI & Data Science" },
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

    return {
      detectedLanguage: lang,
      ttsLang: "ta",
      reply:
        lang === "Tamil"
          ? "நமது ஏஐ மற்றும் ஜென் ஏஐ கோர்ஸ் 4 மாத பயிற்சி, கட்டணம் ₹45,000. டேட்டா சயின்ஸ் 5 மாத பயிற்சி. இதில் மெஷின் லேர்னிங் மற்றும் லார்ஜ் லாங்குவேஜ் மாடல்ஸ் பிராக்டிகலாக சொல்லித்தரப்படும். நீங்கள் மாணவரா?"
          : "Namma WeGrow AI Explorer & GenAI course 4 months duration, fee ₹45,000. Data Science & ML course 5 months, fee ₹48,000. Hands-on labs, LLMs, and real Kaggle datasets cover aagum. Neenga fresh graduate-ah allathu working professional-ah?",
      spokenAudioText:
        "நம்ம வீக்ரோ ஏஐ மற்றும் ஜென் ஏஐ கோர்ஸ் நான்கு மாத பயிற்சி, கட்டணம் நாற்பத்தைந்தாயிரம் ரூபாய். டேட்டா சயின்ஸ் மற்றும் மெஷின் லேர்னிங் ஐந்து மாத பயிற்சி. நீங்க கல்லூரி முடித்தவரா அல்லது வேலை பார்ப்பவரா?",
      tamilSpeech:
        "நம்ம வீக்ரோ ஏஐ மற்றும் ஜென் ஏஐ கோர்ஸ் நான்கு மாத பயிற்சி, கட்டணம் நாற்பத்தைந்தாயிரம் ரூபாய். டேட்டா சயின்ஸ் மற்றும் மெஷின் லேர்னிங் ஐந்து மாத பயிற்சி. நீங்க கல்லூரி முடித்தவரா அல்லது வேலை பார்ப்பவரா?",
      detectedCourse: "AI Explorer & Generative AI",
      leadQualification: { score: 78, tag: "HOT", reason: "Interested in GenAI & Data Science" },
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

  // 5. Fees / Discount / Installments Question
  if (
    text.includes("fee") ||
    text.includes("fees") ||
    text.includes("cost") ||
    text.includes("discount") ||
    text.includes("installment") ||
    text.includes("panam") ||
    text.includes("evvalavu") ||
    text.includes("கட்டணம்") ||
    text.includes("விலை")
  ) {
    if (lang === "English") {
      return {
        detectedLanguage: "English",
        ttsLang: "en",
        reply: `Our professional courses start from ₹32,000 onwards. You don't have to pay all at once — we offer 2 to 3 interest-free installments, plus up to 15% merit scholarship discounts. Which specific course fees would you like to know?`,
        spokenAudioText: `Our professional courses start from 32,000 rupees onwards. You do not have to pay all at once, we offer 2 to 3 interest-free installments, plus up to 15 percent merit scholarship discounts. Which specific course fees would you like to know?`,
        tamilSpeech: `நமது பயிற்சிகள் முப்பத்திரண்டாயிரம் ரூபாயில் இருந்து தொடங்குகின்றன. தவணைகளில் கட்டலாம்.`,
        detectedCourse: leadInfo?.course || "General Enquiry",
        leadQualification: { score: 70, tag: "WARM", reason: "Budget & installment enquiry" },
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

    return {
      detectedLanguage: lang,
      ttsLang: "ta",
      reply:
        lang === "Tamil"
          ? "எங்கள் கோர்ஸ்கள் ₹32,000 முதல் தொடங்குகின்றன. மொத்த தொகையையும் ஒரே நேரத்தில் கட்ட வேண்டியதில்லை, 2 அல்லது 3 எளிய தவணைகளில் செலுத்தலாம். உங்களுக்கு எந்த கோர்ஸ் கட்டணம் தெரிய வேண்டும்?"
          : "Namma courses ₹32,000-la irunthu start aaguthu. Full fees ore thadava katta vendam — 2 or 3 easy installments-la kattalaam. Intha week enroll panna special scholarship discount-um irukku. Ungalukku entha course-oda fees venum?",
      spokenAudioText:
        "நம்ம கோர்ஸ்கள் முப்பத்திரண்டாயிரம் ரூபாயில் இருந்து தொடங்குது. மொத்த தொகையையும் ஒரே நேரத்தில் கட்ட வேண்டாம், இரண்டு அல்லது மூன்று தவணைகளில் கட்டலாம். மேலும் சிறப்பு உதவித்தொகையும் உண்டு. உங்களுக்கு எந்த கோர்ஸ் கட்டணம் தெரியணும்?",
      tamilSpeech:
        "நம்ம கோர்ஸ்கள் முப்பத்திரண்டாயிரம் ரூபாயில் இருந்து தொடங்குது. மொத்த தொகையையும் ஒரே நேரத்தில் கட்ட வேண்டாம், இரண்டு அல்லது மூன்று தவணைகளில் கட்டலாம். மேலும் சிறப்பு உதவித்தொகையும் உண்டு. உங்களுக்கு எந்த கோர்ஸ் கட்டணம் தெரியணும்?",
      detectedCourse: leadInfo?.course || "General Enquiry",
      leadQualification: { score: 70, tag: "WARM", reason: "Budget & installment enquiry" },
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

  // 6. Placement / Job Guarantee Question
  if (
    text.includes("job") ||
    text.includes("placement") ||
    text.includes("salary") ||
    text.includes("company") ||
    text.includes("interview") ||
    text.includes("velai") ||
    text.includes("வேலைவாய்ப்பு")
  ) {
    if (lang === "English") {
      return {
        detectedLanguage: "English",
        ttsLang: "en",
        reply: `We have a dedicated Placement Cell with 50+ hiring partner companies across Chennai, Bangalore, and Madurai! We provide resume optimization, mock interviews, and guaranteed placement drive access with an average salary package of ₹3.5 to ₹6 LPA.`,
        spokenAudioText: `We have a dedicated Placement Cell with 50 plus hiring partner companies across Chennai, Bangalore, and Madurai! We provide resume optimization, mock interviews, and guaranteed placement drive access with an average salary package of 3.5 to 6 LPA.`,
        tamilSpeech: `வீக்ரோவில் பிரத்யேக வேலைவாய்ப்பு பிரிவு செயல்படுகிறது. ஐம்பதுக்கும் மேற்பட்ட நிறுவனங்களுடன் கூட்டு வைத்துள்ளோம்.`,
        detectedCourse: leadInfo?.course || "General Enquiry",
        leadQualification: { score: 82, tag: "HOT", reason: "Career-oriented lead looking for placements" },
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

    return {
      detectedLanguage: lang,
      ttsLang: "ta",
      reply:
        lang === "Tamil"
          ? "வீக்ரோவில் பிரத்யேக வேலைவாய்ப்பு பிரிவு உள்ளது. 50-க்கும் மேற்பட்ட நிறுவனங்களுடன் நேரடி கூட்டு வைத்துள்ளோம். நேர்முகத் தேர்வு பயிற்சி மற்றும் ரெஸ்யூம் தயாரிப்பு உதவி உண்டு. சராசரி சம்பளம் ₹3.5 முதல் ₹6 லட்சம் வரை கிடைக்கும்."
          : "WeGrow-la dedicated Placement Cell irukku! 50+ hiring partner companies kooda tie-up irukku. Course mudinja udane resume preparation, mock interviews, and guaranteed placement drive access tharom. Average package ₹3.5 LPA to ₹6 LPA kedaikkum!",
      spokenAudioText:
        "வீக்ரோவில் பிரத்யேக வேலைவாய்ப்பு பிரிவு செயல்படுகிறது! ஐம்பதுக்கும் மேற்பட்ட நிறுவனங்களுடன் கூட்டு வைத்துள்ளோம். ரெஸ்யூம் தயாரிப்பு மற்றும் இன்டர்வியூ பயிற்சி உண்டு. சராசரி சம்பளம் ஆண்டுக்கு மூன்றரை முதல் ஆறு லட்சம் ரூபாய் வரை கிடைக்கும்!",
      tamilSpeech:
        "வீக்ரோவில் பிரத்யேக வேலைவாய்ப்பு பிரிவு செயல்படுகிறது! ஐம்பதுக்கும் மேற்பட்ட நிறுவனங்களுடன் கூட்டு வைத்துள்ளோம். ரெஸ்யூம் தயாரிப்பு மற்றும் இன்டர்வியூ பயிற்சி உண்டு. சராசரி சம்பளம் ஆண்டுக்கு மூன்றரை முதல் ஆறு லட்சம் ரூபாய் வரை கிடைக்கும்!",
      detectedCourse: leadInfo?.course || "General Enquiry",
      leadQualification: { score: 82, tag: "HOT", reason: "Career-oriented lead looking for placements" },
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

  // 7. Location / Campus Address Question
  if (
    text.includes("address") ||
    text.includes("location") ||
    text.includes("enga irukku") ||
    text.includes("sivakasi") ||
    text.includes("branch") ||
    text.includes("hostel") ||
    text.includes("முகவரி") ||
    text.includes("எங்கே")
  ) {
    if (lang === "English") {
      return {
        detectedLanguage: "English",
        ttsLang: "en",
        reply: `Our campus is located at Parasakthi Colony, Opposite Ayyappan Temple, Sivakasi. For outstation students, we also have verified nearby hostel facilities. When would you like to visit our campus in person?`,
        spokenAudioText: `Our campus is located at Parasakthi Colony, Opposite Ayyappan Temple, Sivakasi. For outstation students, we also have verified nearby hostel facilities. When would you like to visit our campus in person?`,
        tamilSpeech: `எங்கள் கேம்பஸ் சிவகாசியில் பராசக்தி காலனியில் உள்ளது. தங்கும் விடுதி வசதியும் உண்டு.`,
        detectedCourse: leadInfo?.course || "General Enquiry",
        leadQualification: { score: 76, tag: "WARM", reason: "Location & campus enquiry" },
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

    return {
      detectedLanguage: lang,
      ttsLang: "ta",
      reply:
        lang === "Tamil"
          ? "எங்கள் வீக்ரோ ஸ்கில் கேம்பஸ் சிவகாசியில் பராசக்தி காலனி, ஐயப்பன் கோவில் எதிரில் அமைந்துள்ளது. வெளியூர் மாணவர்களுக்கு தங்கும் விடுதி வசதியும் உண்டு. நீங்கள் எப்போது நேரில் வரலாம்?"
          : "Namma WeGrow Skill Campus Sivakasi-la Parasakthi Colony, Ayyappan Kovil Opposite-la irukku. Outstation students-ku nearby verified hostel facilities-um irukku. Neenga eppo direct-ah visit panna mudiyum?",
      spokenAudioText:
        "நம்ம வீக்ரோ ஸ்கில் கேம்பஸ் சிவகாசியில் பராசக்தி காலனி, ஐயப்பன் கோவில் எதிரில் அமைந்துள்ளது. வெளியூர் மாணவர்களுக்கு தங்கும் விடுதி வசதியும் உண்டு. நீங்க எப்போ நேரில் வர முடியும்?",
      tamilSpeech:
        "நம்ம வீக்ரோ ஸ்கில் கேம்பஸ் சிவகாசியில் பராசக்தி காலனி, ஐயப்பன் கோவில் எதிரில் அமைந்துள்ளது. வெளியூர் மாணவர்களுக்கு தங்கும் விடுதி வசதியும் உண்டு. நீங்க எப்போ நேரில் வர முடியும்?",
      detectedCourse: leadInfo?.course || "General Enquiry",
      leadQualification: { score: 76, tag: "WARM", reason: "Location & campus enquiry" },
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

  // 8. Default Greeting in Caller's Language
  if (lang === "English") {
    return {
      detectedLanguage: "English",
      ttsLang: "en",
      reply: `Hello and welcome to WeGrow Skill Campus, Sivakasi! I am ${counselorName}, your AI Admissions Counselor. We offer career-focused programs in Full Stack, AI, Data Science, and Digital Marketing. Which career track are you interested in?`,
      spokenAudioText: `Hello and welcome to WeGrow Skill Campus, Sivakasi! I am ${counselorName}, your AI Admissions Counselor. We offer career-focused programs in Full Stack, AI, Data Science, and Digital Marketing. Which career track are you interested in?`,
      tamilSpeech: `வணக்கம்! நான் உங்கள் கவுன்சிலர். உங்களுக்கு எந்த கோர்ஸ் விவரங்கள் வேண்டும்?`,
      detectedCourse: leadInfo?.course || "General Enquiry",
      leadQualification: { score: 65, tag: "WARM", reason: "Initial exploratory conversation" },
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

  return {
    detectedLanguage: lang,
    ttsLang: "ta",
    reply:
      lang === "Tamil"
        ? `வணக்கம்! வீக்ரோ ஸ்கில் கேம்பஸுக்கு உங்களை அன்போடு வரவேற்கிறோம். நான் உங்கள் சேர்க்கை ஆலோசகர் ${
            counselorName === "Vikram" ? "விக்ரம்" : "காவ்யா"
          }. உங்களுக்கு எந்த துறையில் ஆர்வம் உள்ளது?`
        : `Vanakkam! WeGrow Skill Campus-ku welcome. Naan ${counselorName}, WeGrow AI counselor. Namma campus-la Full Stack, AI & GenAI, Data Science, and Digital Marketing courses offer panrom. Ungalukku entha field-la career build panna interest irukku?`,
    spokenAudioText: `வணக்கம்! வீக்ரோ ஸ்கில் கேம்பஸுக்கு உங்களை அன்போடு வரவேற்கிறோம். நான் உங்கள் கவுன்சிலர் ${
      counselorName === "Vikram" ? "விக்ரம்" : "காவ்யா"
    }. நம்ம கேம்பஸ்ல ஃபுல் ஸ்டேக், ஏஐ, டேட்டா சயின்ஸ் கோர்ஸ்கள் உள்ளன. உங்களுக்கு எந்த துறையில் ஆர்வம் உள்ளது?`,
    tamilSpeech: `வணக்கம்! வீக்ரோ ஸ்கில் கேம்பஸுக்கு உங்களை அன்போடு வரவேற்கிறோம். நான் உங்கள் கவுன்சிலர் ${
      counselorName === "Vikram" ? "விக்ரம்" : "காவ்யா"
    }. நம்ம கேம்பஸ்ல ஃபுல் ஸ்டேக், ஏஐ, டேட்டா சயின்ஸ் கோர்ஸ்கள் உள்ளன. உங்களுக்கு எந்த துறையில் ஆர்வம் உள்ளது?`,
    detectedCourse: leadInfo?.course || "General Enquiry",
    leadQualification: { score: 65, tag: "WARM", reason: "Initial exploratory conversation" },
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
