"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Phone,
  PhoneOff,
  PhoneForwarded,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Bot,
  User,
  Clock,
  Calendar,
  Send,
  Flame,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Share2,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  Award,
  Zap,
  MapPin,
  X,
  Languages,
  Globe,
} from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import { Lead } from "@/types";

interface Message {
  id: string;
  sender: "user" | "ai" | "system";
  text: string;
  time: string;
  sentiment?: string;
  lang?: "English" | "Tamil" | "Tanglish";
}

interface DemoDetails {
  date: string;
  time: string;
  mode: string;
}

interface AIVoiceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: Lead | null;
  phoneNumber?: string;
  isInbound?: boolean;
  autoAnswerDelaySeconds?: number;
}

export const AIVoiceCallModal: React.FC<AIVoiceCallModalProps> = ({
  isOpen,
  onClose,
  lead,
  phoneNumber = "+91 99523 37331",
  isInbound = false,
  autoAnswerDelaySeconds = 2,
}) => {
  const {
    leads,
    addLead,
    updateLead,
    addCallRecord,
    addNewFollowUp,
    addToast,
  } = useCRM();

  // Call Lifecycle States
  const [callState, setCallState] = useState<
    "ringing" | "connected" | "human_transferred" | "ended"
  >("ringing");
  const [callSeconds, setCallSeconds] = useState(0);
  const [autoAnswerTimer, setAutoAnswerTimer] = useState(autoAnswerDelaySeconds);

  // Voice Persona: Male vs Female Switch
  const [voiceGender, setVoiceGender] = useState<"female" | "male">("female");
  const voiceGenderRef = useRef<"female" | "male">("female");
  useEffect(() => {
    voiceGenderRef.current = voiceGender;
  }, [voiceGender]);

  // Trilingual Mode: Auto, English, Tanglish, Tamil
  const [languageMode, setLanguageMode] = useState<"auto" | "en" | "tanglish" | "ta">("auto");
  const [activeCallLang, setActiveCallLang] = useState<"English" | "Tamil" | "Tanglish">("Tanglish");

  // AI & Voice Conversation State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputQuery, setInputQuery] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isMicListening, setIsMicListening] = useState(false);
  const [isMicActive, setIsMicActive] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  // Qualification & Demo State
  const [qualification, setQualification] = useState<{
    score: number;
    tag: "HOT" | "WARM" | "COLD";
    reason: string;
  }>({
    score: 55,
    tag: "WARM",
    reason: "Call initiated",
  });
  const [detectedCourse, setDetectedCourse] = useState(
    lead?.courseInterested || "General Enquiry"
  );
  const [demoBooked, setDemoBooked] = useState(false);
  const [demoDetails, setDemoDetails] = useState<DemoDetails | null>(null);
  const [callSummary, setCallSummary] = useState<string[]>([
    "Intent: Student enquired about WeGrow programs",
    "Key Discussion: Discussed curriculum and Sivakasi campus visit",
    "Next Action: Follow up with course brochure on WhatsApp",
  ]);

  // Audio & Speech Synthesis Refs (Single-source controller)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isAiSpeakingRef = useRef<boolean>(false);
  const isCallActiveRef = useRef<boolean>(false);

  // Sound Wave Animation Level
  const [waveLevels, setWaveLevels] = useState<number[]>([15, 25, 40, 60, 30, 75, 45, 20]);

  // Format Duration mm:ss
  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    isAiSpeakingRef.current = isAiSpeaking;
  }, [isAiSpeaking]);

  useEffect(() => {
    isCallActiveRef.current = callState === "connected";
  }, [callState]);

  // Speech Recognition Language Mapping
  const getRecognitionLang = useCallback(() => {
    if (languageMode === "ta") return "ta-IN";
    if (languageMode === "en") return "en-IN";
    // For auto or tanglish, Indian English accurately parses both Tanglish and English
    return "en-IN";
  }, [languageMode]);

  // Initialize Speech Recognition with Auto-Restart Loop
  const initSpeechRecognition = useCallback(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Web SpeechRecognition is not supported on this browser.");
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }

      const reco = new SpeechRecognition();
      reco.continuous = true;
      reco.interimResults = true;
      reco.lang = getRecognitionLang();

      reco.onstart = () => {
        setIsMicListening(true);
      };

      let recognitionTimer: NodeJS.Timeout | null = null;
      let finalSpeech = "";

      reco.onresult = (event: any) => {
        // Discard any sound picked up while AI itself is talking
        if (isAiSpeakingRef.current) return;

        let interimText = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalSpeech += event.results[i][0].transcript + " ";
          } else {
            interimText += event.results[i][0].transcript;
          }
        }

        const candidateText = (finalSpeech + interimText).trim();
        if (candidateText) {
          setInputQuery(candidateText);

          // Automatically send after user finishes talking (1.1s silence pause)
          if (recognitionTimer) clearTimeout(recognitionTimer);
          recognitionTimer = setTimeout(() => {
            if (candidateText && !isAiSpeakingRef.current && isCallActiveRef.current) {
              const toSend = candidateText;
              finalSpeech = "";
              setInputQuery("");
              handleUserUtterance(toSend);
            }
          }, 1100);
        }
      };

      reco.onerror = (err: any) => {
        if (err.error !== "no-speech") {
          console.warn("Speech recognition event:", err.error);
        }
      };

      reco.onend = () => {
        setIsMicListening(false);
        // Continuous listening auto-restart loop
        if (isCallActiveRef.current && !isAiSpeakingRef.current && isMicActive && !isMuted) {
          try {
            reco.start();
          } catch (e) {}
        }
      };

      recognitionRef.current = reco;
    } catch (e) {
      console.warn("Recognition init error:", e);
    }
  }, [getRecognitionLang, isMicActive, isMuted]);

  useEffect(() => {
    initSpeechRecognition();
  }, [initSpeechRecognition]);

  // Start Mic Listening Safely
  const startMicListening = () => {
    if (!recognitionRef.current || !isMicActive || isMuted || isAiSpeakingRef.current) return;
    try {
      recognitionRef.current.start();
      setIsMicListening(true);
    } catch (e) {}
  };

  const stopMicListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsMicListening(false);
  };

  // Stop ALL voice output completely (Guarantees zero overlapping audio)
  const stopVoice = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current.src = "";
      } catch (e) {}
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsAiSpeaking(false);
  };

  // Real Fluent Neural Audio Player (Strict Single Voice Playback, No Overlapping)
  const speakAI = (audioText: string, ttsLang: "en" | "ta" = "ta") => {
    if (isMuted) return;

    // 1. Temporarily mute mic so AI doesn't pick up its own speaker sound
    stopMicListening();
    setIsAiSpeaking(true);

    // 2. Terminate any previous audio completely
    stopVoice();
    setIsAiSpeaking(true);

    try {
      const cleanText = (audioText || "").trim();
      if (!cleanText) {
        setIsAiSpeaking(false);
        startMicListening();
        return;
      }

      const ttsUrl = `/api/ai/telecalling/tts?text=${encodeURIComponent(
        cleanText
      )}&lang=${encodeURIComponent(ttsLang)}`;

      const audio = new Audio(ttsUrl);
      audioRef.current = audio;

      // Male vs Female Voice Tone Cadence:
      // Female (Kavya): 1.02x crisp, bright friendly counselor cadence
      // Male (Vikram): 0.90x deeper, steady authoritative counseling tone
      const currentGender = voiceGenderRef.current;
      audio.playbackRate = currentGender === "female" ? 1.02 : 0.90;

      audio.onended = () => {
        setIsAiSpeaking(false);
        audioRef.current = null;
        // Reactivate Mic immediately so student can speak next!
        setTimeout(() => {
          if (isCallActiveRef.current && isMicActive && !isMuted) {
            startMicListening();
          }
        }, 300);
      };

      audio.onerror = (e) => {
        console.warn("TTS audio streaming error:", e);
        setIsAiSpeaking(false);
        audioRef.current = null;
        setTimeout(() => {
          if (isCallActiveRef.current && isMicActive && !isMuted) {
            startMicListening();
          }
        }, 300);
      };

      audio.play().catch((playErr) => {
        if (playErr.name !== "AbortError") {
          console.warn("Audio play issue:", playErr);
        }
      });
    } catch (e) {
      console.warn("Audio exception:", e);
      setIsAiSpeaking(false);
      startMicListening();
    }
  };

  // Modal Open Lifecycle (Triggered ONLY when modal opens or lead changes)
  useEffect(() => {
    if (!isOpen) {
      handleEndCall(false);
      return;
    }

    // Reset Call States
    setCallState("ringing");
    setCallSeconds(0);
    setAutoAnswerTimer(autoAnswerDelaySeconds);
    setDemoBooked(false);
    setDemoDetails(null);
    setQualification({ score: 55, tag: "WARM", reason: "Incoming call connection" });

    const currentGender = voiceGenderRef.current;
    const personaName = currentGender === "female" ? "Kavya" : "Vikram";

    // Initial greeting in natural Tanglish + Tamil
    const initialWelcomeTanglish = `Vanakkam! Welcome to WeGrow Skill Campus, Sivakasi. Naan ${personaName}, WeGrow Admissions Counselor. Ungalukku entha course pathi details venum — Full Stack, AI, or Digital Marketing-ah?`;
    const initialWelcomeTamil = `வணக்கம்! வீக்ரோ ஸ்கில் கேம்பஸுக்கு உங்களை அன்போடு வரவேற்கிறோம். நான் உங்கள் கவுன்சிலர் ${
      currentGender === "female" ? "காவ்யா" : "விக்ரம்"
    }. உங்களுக்கு எந்த கோர்ஸ் பத்தி விவரங்கள் வேணும் — ஃபுல் ஸ்டேக், ஏஐ, அல்லது டிஜிட்டல் மார்க்கெட்டிங்கா?`;

    setMessages([
      {
        id: "msg-0",
        sender: "ai",
        text: initialWelcomeTanglish,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sentiment: "Positive",
        lang: "Tanglish",
      },
    ]);

    // Handle Auto-Answer Countdown (If staff doesn't answer within 2s, AI picks up automatically!)
    let countdownInterval: NodeJS.Timeout | null = null;
    countdownInterval = setInterval(() => {
      setAutoAnswerTimer((prev) => {
        if (prev <= 1) {
          if (countdownInterval) clearInterval(countdownInterval);
          connectCall(initialWelcomeTamil, "ta");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownInterval) clearInterval(countdownInterval);
      stopTimer();
      stopVoice();
    };
  }, [isOpen, lead]); // Note: voiceGender is intentionally NOT here to prevent restarting the call!

  // Connect Call & Start AI Speaking
  const connectCall = (welcomeSpeech: string, ttsLang: "en" | "ta" = "ta") => {
    setCallState("connected");
    startTimer();
    speakAI(welcomeSpeech, ttsLang);
  };

  // Timer Handlers
  const startTimer = () => {
    stopTimer();
    timerIntervalRef.current = setInterval(() => {
      setCallSeconds((s) => s + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  // Waveform Animation Loop
  useEffect(() => {
    let animId: NodeJS.Timeout;
    if (isAiSpeaking || isMicListening) {
      animId = setInterval(() => {
        setWaveLevels((prev) =>
          prev.map(() => Math.floor(Math.random() * 65) + 15)
        );
      }, 100);
    } else {
      setWaveLevels([15, 20, 15, 20, 15, 20, 15, 20]);
    }
    return () => clearInterval(animId);
  }, [isAiSpeaking, isMicListening]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiThinking]);

  // Handle User Message (via Mic or Typed Input)
  const handleUserUtterance = async (queryText: string) => {
    if (!queryText.trim() || callState === "ended") return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: queryText,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsAiThinking(true);

    try {
      const savedApiKey =
        typeof window !== "undefined"
          ? localStorage.getItem("wegrow_gemini_api_key") || ""
          : "";

      // Call Gemini Telecalling Trilingual Route
      const res = await fetch("/api/ai/telecalling/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: queryText,
          apiKey: savedApiKey,
          voiceGender: voiceGender,
          conversationHistory: messages.map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
          leadInfo: {
            name: lead?.studentName || "Prospective Student",
            phone: phoneNumber,
            course: detectedCourse || lead?.courseInterested,
          },
        }),
      });

      const data = await res.json();
      setIsAiThinking(false);

      if (data && (data.reply || data.spokenAudioText || data.tamilSpeech)) {
        const displayText = data.reply || data.spokenAudioText;
        const speechAudio = data.spokenAudioText || data.tamilSpeech || data.reply;
        const ttsLang = data.ttsLang || (data.detectedLanguage === "English" ? "en" : "ta");

        if (data.detectedLanguage) {
          setActiveCallLang(data.detectedLanguage);
        }

        const aiMsg: Message = {
          id: `msg-${Date.now() + 1}`,
          sender: "ai",
          text: displayText,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          sentiment: data.sentiment || "Positive",
          lang: data.detectedLanguage || "Tanglish",
        };

        setMessages((prev) => [...prev, aiMsg]);

        // Speak response in matching language audio (English for English, Tamil for Tamil/Tanglish)
        speakAI(speechAudio, ttsLang);

        // Update qualification score & badges
        if (data.leadQualification) {
          setQualification(data.leadQualification);
        }
        if (data.detectedCourse) {
          setDetectedCourse(data.detectedCourse);
        }

        // Demo Booking Trigger
        if (data.demoBooked && data.demoDetails) {
          setDemoBooked(true);
          setDemoDetails(data.demoDetails);
          addToast("🎉 Free Demo Class Booked via AI!", "success");
        }

        // Human Takeover Trigger
        if (data.transferToHuman) {
          triggerHumanTakeover();
        }

        // Update Summary Bullets
        if (data.summaryBullets && data.summaryBullets.length) {
          setCallSummary(data.summaryBullets);
        }
      }
    } catch (err) {
      console.error("AI Telecalling chat error:", err);
      setIsAiThinking(false);
      const fallbackReply =
        "Kandippa! Ungaloda enquiry note pannitten. Namma Sivakasi counselor ungalukku syllabus & fees WhatsApp-la share pannuvaanga.";
      const fallbackTamil =
        "கண்டிப்பா! உங்களோட விவரங்களை பதிவு பண்ணிட்டேன். சிவகாசி கேம்பஸ் கவுன்சிலர் உங்களுக்கு பாடத்திட்டம் மற்றும் கட்டண விவரங்களை வாட்ஸ்அப்பில் அனுப்புவாங்க.";

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          sender: "ai",
          text: fallbackReply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      speakAI(fallbackTamil, "ta");
    }
  };

  // Trigger Human Takeover
  const triggerHumanTakeover = () => {
    setCallState("human_transferred");
    stopVoice();
    addToast("📞 Call Handed Over to Human Counselor!", "info");
    const systemMsg: Message = {
      id: `sys-${Date.now()}`,
      sender: "system",
      text: "⚡ Call Handed Over to Human Counselor. AI is now silently transcribing in the background.",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, systemMsg]);
  };

  // End Call & Synchronize with CRM Database
  const handleEndCall = (shouldSave = true) => {
    stopTimer();
    stopVoice();
    setCallState("ended");

    if (!shouldSave) return;

    const callerPhone = lead?.phone || phoneNumber || "+91 99523 37331";
    const studentName = lead?.studentName || "Incoming Lead (AI Call)";
    const durationStr = `${Math.floor(callSeconds / 60)}m ${callSeconds % 60}s`;

    // 1. Auto-create new Lead if not already existing
    let targetLeadId = lead?.id;
    const existingLead = leads.find((l) => l.phone.replace(/\D/g, "") === callerPhone.replace(/\D/g, ""));

    if (existingLead) {
      targetLeadId = existingLead.id;
      updateLead(existingLead.id, {
        priority: qualification.tag === "HOT" ? "Hot" : qualification.tag === "WARM" ? "Warm" : "Cold",
        status: demoBooked ? "Counselling Scheduled" : "Interested",
        courseInterested: detectedCourse || existingLead.courseInterested,
      });
    } else {
      addLead({
        studentName,
        phone: callerPhone,
        email: "enquiry@wegrow.edu",
        courseInterested: detectedCourse || "Full Stack Web Development (MERN + Next.js)",
        leadSource: "Phone",
        status: demoBooked ? "Counselling Scheduled" : "Interested",
        priority: qualification.tag === "HOT" ? "Hot" : qualification.tag === "WARM" ? "Warm" : "Cold",
        stage: demoBooked ? "Counselling Scheduled" : "Interested",
        assignedCaller: "Priya Sharma",
        city: "Sivakasi",
        enquiryDate: new Date().toISOString().split("T")[0],
        nextFollowUpDate: demoDetails ? demoDetails.date : new Date().toISOString().split("T")[0],
        nextFollowUpTime: demoDetails ? demoDetails.time : "11:00 AM",
        notes: [
          {
            id: `note-${Date.now()}`,
            content: `[AI Telecalling Summary] ${callSummary.join(" | ")}`,
            timestamp: new Date().toISOString(),
            author: `${voiceGender === "female" ? "Kavya" : "Vikram"} (AI Voice Agent)`,
          },
        ],
      });
    }

    // 2. Add Call Record Log
    if (targetLeadId) {
      addCallRecord(targetLeadId, {
        callerName: `${voiceGender === "female" ? "Kavya" : "Vikram"} (AI Voice Agent)`,
        outcome: demoBooked ? "Demo Booked" : qualification.tag === "HOT" ? "Highly Interested" : "Enquiry Completed",
        duration: durationStr,
        remarks: `[AI Telecaller] ${callSummary.join(" | ")}`,
        nextFollowUpDate: demoDetails ? demoDetails.date : new Date().toISOString().split("T")[0],
        nextFollowUpTime: demoDetails ? demoDetails.time : "11:00 AM",
      });
    }

    // 3. Auto-Schedule Demo Class in Follow-ups
    if (demoBooked && demoDetails && targetLeadId) {
      addNewFollowUp({
        leadId: targetLeadId,
        studentName,
        phone: callerPhone,
        course: detectedCourse || "WeGrow Courses",
        assignedCaller: "Priya Sharma",
        lastContacted: "Just now",
        followUpDate: demoDetails.date,
        followUpTime: demoDetails.time,
        status: "Upcoming",
        priority: "Hot",
        remarks: `Free Demo Class booked by AI Voice Agent. Campus: Sivakasi Parasakthi Colony. Mode: ${demoDetails.mode}`,
      });
    }

    addToast(`AI Call Summary saved (${durationStr})`, "success");
  };

  // Instant WhatsApp Message Dispatch
  const handleSendWhatsApp = () => {
    const callerPhone = lead?.phone || phoneNumber || "+91 99523 37331";
    const cleanPhone = callerPhone.replace(/\D/g, "");
    const studentName = lead?.studentName || "Student";

    const text = `Vanakkam ${studentName}! Thank you for calling WeGrow Skill Campus, Sivakasi.

Here are the details for your interested course:
📘 Course: ${detectedCourse}
📍 Campus: Parasakthi Colony, Opp. Ayyappan Kovil, Sivakasi
${demoBooked && demoDetails ? `🎉 Free Demo Class: ${demoDetails.date} at ${demoDetails.time}` : "🎓 Free 2-Day Demo Class Available This Weekend!"}

Download Syllabus & Fee Structure: https://wegrow.edu/syllabus
Reach our Admissions Desk: +91 99523 37331`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`, "_blank");
    addToast("WhatsApp Follow-up Message Triggered!", "success");
  };

  // Switch Voice Gender (Female / Male) — Strictly switches ONLY the active persona
  const handleToggleVoiceGender = (newGender: "female" | "male") => {
    if (newGender === voiceGender) return;
    stopVoice();
    setVoiceGender(newGender);

    const isEnglish = activeCallLang === "English" || languageMode === "en";
    const textToSpeak = isEnglish
      ? newGender === "female"
        ? "Voice switched to Kavya, Admissions Counselor."
        : "Voice switched to Vikram, Admissions Lead."
      : newGender === "female"
      ? "வணக்கம்! நான் காவ்யா, வீக்ரோ சேர்க்கை ஆலோசகர்."
      : "வணக்கம்! நான் விக்ரம், வீக்ரோ சேர்க்கை பிரிவு.";

    const ttsLang = isEnglish ? "en" : "ta";

    addToast(
      `Voice switched to ${newGender === "female" ? "👩 Kavya (Female)" : "👨 Vikram (Male)"}`,
      "info"
    );

    // Short delay to ensure previous audio stream is fully disposed
    setTimeout(() => {
      speakAI(textToSpeak, ttsLang);
    }, 100);
  };

  // Change Language Mode
  const handleSetLanguageMode = (mode: "auto" | "en" | "tanglish" | "ta") => {
    setLanguageMode(mode);
    const labels = {
      auto: "🌐 Auto (Detects Tamil / English / Tanglish)",
      en: "🇬🇧 English Mode",
      tanglish: "🇮🇳 Tanglish Mode",
      ta: "🇮🇳 தமிழ் Mode",
    };
    addToast(`Language set to ${labels[mode]}`, "info");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* ========================================================================= */}
        {/* HEADER: AI Persona, Voice Switcher (Male/Female), and 3-Language Selector */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 px-6 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center shadow-inner">
                <Bot className="w-6 h-6 text-emerald-200 animate-pulse" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight">
                  {voiceGender === "female" ? "Kavya" : "Vikram"} — WeGrow AI Counselor
                </h3>
                <span className="bg-white/20 text-emerald-100 text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  Gemini 3.5
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/80 font-medium mt-0.5">
                <span>{isInbound ? "Inbound Call" : "Outbound Call"}:</span>
                <span className="text-white font-bold">{phoneNumber}</span>
                {lead && <span className="opacity-75">({lead.studentName})</span>}
                <span className="bg-white/25 text-white px-2 py-0.2 rounded text-[10px] font-bold">
                  {activeCallLang}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            
            {/* 👩/👨 MALE & FEMALE VOICE SWITCHER BUTTONS (Only chosen one speaks!) */}
            <div className="bg-white/15 backdrop-blur border border-white/20 p-0.5 rounded-xl flex items-center text-xs font-bold text-white">
              <button
                type="button"
                onClick={() => handleToggleVoiceGender("female")}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  voiceGender === "female"
                    ? "bg-white text-emerald-900 shadow-xs"
                    : "text-white/80 hover:text-white"
                }`}
                title="Switch to Kavya (Female Voice)"
              >
                <span>👩 Kavya</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleVoiceGender("male")}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  voiceGender === "male"
                    ? "bg-white text-indigo-900 shadow-xs"
                    : "text-white/80 hover:text-white"
                }`}
                title="Switch to Vikram (Male Voice)"
              >
                <span>👨 Vikram</span>
              </button>
            </div>

            {/* 🌐 3-LANGUAGE SELECTOR: Auto, English, Tanglish, Tamil */}
            <div className="bg-white/15 backdrop-blur border border-white/20 p-0.5 rounded-xl flex items-center text-xs font-semibold text-white">
              <button
                type="button"
                onClick={() => handleSetLanguageMode("auto")}
                className={`px-2 py-1 rounded-lg transition-all text-[11px] ${
                  languageMode === "auto"
                    ? "bg-white text-emerald-950 font-bold shadow-xs"
                    : "text-white/80 hover:text-white"
                }`}
                title="Auto-Detect (Tamil / English / Tanglish)"
              >
                🌐 Auto
              </button>
              <button
                type="button"
                onClick={() => handleSetLanguageMode("en")}
                className={`px-2 py-1 rounded-lg transition-all text-[11px] ${
                  languageMode === "en"
                    ? "bg-white text-emerald-950 font-bold shadow-xs"
                    : "text-white/80 hover:text-white"
                }`}
                title="English Speech & Audio"
              >
                English
              </button>
              <button
                type="button"
                onClick={() => handleSetLanguageMode("tanglish")}
                className={`px-2 py-1 rounded-lg transition-all text-[11px] ${
                  languageMode === "tanglish"
                    ? "bg-white text-emerald-950 font-bold shadow-xs"
                    : "text-white/80 hover:text-white"
                }`}
                title="Tanglish Speech & Audio"
              >
                Tanglish
              </button>
              <button
                type="button"
                onClick={() => handleSetLanguageMode("ta")}
                className={`px-2 py-1 rounded-lg transition-all text-[11px] ${
                  languageMode === "ta"
                    ? "bg-white text-emerald-950 font-bold shadow-xs"
                    : "text-white/80 hover:text-white"
                }`}
                title="தமிழ் (Pure Tamil Speech & Audio)"
              >
                தமிழ்
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                handleEndCall(true);
                onClose();
              }}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SUBHEADER: Call Timer, Real-time Mic Activity & Waveform */}
        {/* ========================================================================= */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {callState === "ringing" ? (
              <div className="flex items-center gap-2 text-amber-600 font-semibold text-xs">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping"></span>
                <span>Ringing... Staff not answered &rarr; AI Auto-connecting in {autoAnswerTimer}s</span>
              </div>
            ) : callState === "human_transferred" ? (
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>Human Counselor Active</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span>Live Call Connected</span>
                <span className="text-slate-400 font-normal">|</span>
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-mono text-slate-800">{formatTimer(callSeconds)}</span>
              </div>
            )}

            {/* Live Mic Listening Status Indicator */}
            {callState === "connected" && (
              <div
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all ${
                  isAiSpeaking
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                    : isMicListening
                    ? "bg-indigo-50 border-indigo-300 text-indigo-800 animate-pulse"
                    : "bg-slate-100 border-slate-200 text-slate-600"
                }`}
              >
                {isAiSpeaking ? (
                  <>
                    <Volume2 className="w-3 h-3 text-emerald-600 animate-bounce" />
                    <span>
                      {voiceGender === "female" ? "Kavya Speaking" : "Vikram Speaking"} ({activeCallLang})
                    </span>
                  </>
                ) : isMicListening ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <Mic className="w-3 h-3 text-indigo-600" />
                    <span>Mic Listening (Speak in Tamil, English, or Tanglish)</span>
                  </>
                ) : (
                  <>
                    <MicOff className="w-3 h-3 text-slate-400" />
                    <span>Mic Standby</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Sound Wave Animation */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-end gap-1 h-5 w-20">
              {waveLevels.map((lvl, idx) => (
                <div
                  key={idx}
                  style={{ height: `${lvl}%` }}
                  className={`w-1.5 rounded-full transition-all duration-100 ${
                    isAiSpeaking
                      ? "bg-emerald-500"
                      : isMicListening
                      ? "bg-indigo-500"
                      : "bg-slate-300"
                  }`}
                ></div>
              ))}
            </div>

            {/* Qualification Flame Badge */}
            <div
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs ${
                qualification.tag === "HOT"
                  ? "bg-rose-500 text-white animate-pulse"
                  : qualification.tag === "WARM"
                  ? "bg-amber-400 text-slate-900"
                  : "bg-blue-400 text-white"
              }`}
            >
              <Flame className="w-3 h-3 fill-current" />
              <span>{qualification.tag} ({qualification.score}%)</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DEMO CLASS BOOKED BANNER (Conditional) */}
        {/* ========================================================================= */}
        {demoBooked && demoDetails && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 flex items-center justify-between text-xs font-semibold text-emerald-800 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                Free Demo Class Booked: <strong>{demoDetails.date}</strong> at <strong>{demoDetails.time}</strong> ({demoDetails.mode})
              </span>
            </div>
            <span className="bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded text-[10px] font-bold">
              Synced to CRM Follow-ups
            </span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* BODY: Live Call Subtitles & Transcript */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 bg-slate-100/50 min-h-[280px] max-h-[350px]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.sender === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                  msg.sender === "ai"
                    ? voiceGender === "female"
                      ? "bg-emerald-600 text-white"
                      : "bg-indigo-600 text-white"
                    : msg.sender === "user"
                    ? "bg-slate-700 text-white"
                    : "bg-amber-600 text-white"
                }`}
              >
                {msg.sender === "ai" ? (
                  <Bot className="w-4 h-4" />
                ) : msg.sender === "user" ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-sm ${
                  msg.sender === "user"
                    ? "bg-indigo-600 text-white rounded-tr-none"
                    : msg.sender === "ai"
                    ? "bg-white text-slate-800 border border-slate-200/80 rounded-tl-none"
                    : "bg-amber-50 text-amber-900 border border-amber-200 text-xs italic"
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold text-[11px] ${
                        msg.sender === "user" ? "text-indigo-200" : "text-slate-500"
                      }`}
                    >
                      {msg.sender === "ai"
                        ? `${voiceGender === "female" ? "Kavya" : "Vikram"} (WeGrow AI)`
                        : msg.sender === "user"
                        ? "Student"
                        : "System"}
                    </span>
                    {msg.lang && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-medium">
                        {msg.lang}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] ${
                      msg.sender === "user" ? "text-indigo-200" : "text-slate-400"
                    }`}
                  >
                    {msg.time}
                  </span>
                </div>
                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}

          {isAiThinking && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-white/80 border border-slate-200 px-3 py-2 rounded-xl w-fit">
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
              <span>{voiceGender === "female" ? "Kavya" : "Vikram"} is thinking...</span>
            </div>
          )}

          <div ref={transcriptEndRef} />
        </div>

        {/* ========================================================================= */}
        {/* QUICK QUESTION PILLS (For 1-click testing in English, Tanglish, Tamil) */}
        {/* ========================================================================= */}
        <div className="bg-white border-t border-slate-200 px-4 py-2 flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Test Prompts:
          </span>
          <button
            onClick={() => handleUserUtterance("What are the fees for Full Stack Web Development course?")}
            className="shrink-0 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 px-2.5 py-1 rounded-full text-[11px] transition-colors"
            title="Test English"
          >
            🇬🇧 Full Stack Fees? (EN)
          </button>
          <button
            onClick={() => handleUserUtterance("Full stack web development fees and duration evvalavu?")}
            className="shrink-0 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 px-2.5 py-1 rounded-full text-[11px] transition-colors"
            title="Test Tanglish"
          >
            🇮🇳 Full Stack Fees? (Tanglish)
          </button>
          <button
            onClick={() => handleUserUtterance("வணக்கம், கோர்ஸ் கட்டணம் மற்றும் வேலைவாய்ப்பு உதவி பற்றி சொல்லுங்கள்")}
            className="shrink-0 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 px-2.5 py-1 rounded-full text-[11px] transition-colors"
            title="Test Tamil"
          >
            🇮🇳 கட்டணம் & வேலைவாய்ப்பு? (தமிழ்)
          </button>
          <button
            onClick={() => handleUserUtterance("Can you tell me about the AI & GenAI syllabus and placements?")}
            className="shrink-0 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 px-2.5 py-1 rounded-full text-[11px] transition-colors"
            title="Test English"
          >
            🤖 AI Placements? (EN)
          </button>
          <button
            onClick={() => handleUserUtterance("Free Demo class attend panna virumburen, Saturday batch book pannunga")}
            className="shrink-0 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 px-2.5 py-1 rounded-full text-[11px] transition-colors"
            title="Test Demo Booking"
          >
            📅 Book Saturday Demo
          </button>
          <button
            onClick={() => handleUserUtterance("Manager or senior counselor kitta direct-ah pesanum transfer pannunga")}
            className="shrink-0 bg-amber-50 hover:bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-[11px] transition-colors"
            title="Test Human Takeover"
          >
            👤 Request Human Transfer
          </button>
        </div>

        {/* ========================================================================= */}
        {/* FOOTER: Microphone Controls, Text Input & Actions */}
        {/* ========================================================================= */}
        <div className="bg-white border-t border-slate-200 p-4 sm:p-5 flex flex-col gap-3">
          
          {/* Query Input Row with Push-to-Talk Mic */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUserUtterance(inputQuery);
            }}
            className="flex items-center gap-2"
          >
            {/* Live Mic Button */}
            <button
              type="button"
              onClick={() => {
                if (isMicListening) {
                  stopMicListening();
                  setIsMicActive(false);
                } else {
                  setIsMicActive(true);
                  startMicListening();
                }
              }}
              className={`p-2.5 rounded-xl border font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
                isMicListening
                  ? "bg-rose-500 text-white border-rose-600 shadow-rose-500/20 animate-pulse"
                  : "bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
              }`}
              title={isMicListening ? "Click to Pause Mic" : "Click to Speak via Microphone"}
            >
              {isMicListening ? <Mic className="w-4 h-4 fill-white" /> : <Mic className="w-4 h-4 text-emerald-600" />}
              <span className="hidden sm:inline font-bold">
                {isMicListening ? "Mic On" : "Speak (Mic)"}
              </span>
            </button>

            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Speak via Mic in Tamil, English or Tanglish, or type here..."
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />

            <button
              type="submit"
              disabled={!inputQuery.trim() || isAiThinking}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>

          {/* Bottom Action Controls */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              {/* Silence AI Button */}
              <button
                type="button"
                onClick={stopVoice}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                title="Silence AI Voice"
              >
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Stop Audio</span>
              </button>

              {/* Transfer to Human */}
              {callState !== "human_transferred" && (
                <button
                  type="button"
                  onClick={triggerHumanTakeover}
                  className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <PhoneForwarded className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Transfer to Human</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* WhatsApp Brochure */}
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">WhatsApp Brochure</span>
              </button>

              {/* End Call */}
              <button
                type="button"
                onClick={() => {
                  handleEndCall(true);
                  onClose();
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition-all hover:scale-105"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                <span>End Call</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
