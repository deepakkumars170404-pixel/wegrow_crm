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
} from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import { Lead } from "@/types";

interface Message {
  id: string;
  sender: "user" | "ai" | "system";
  text: string;
  time: string;
  sentiment?: string;
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
  const [micLanguage, setMicLanguage] = useState<"en-IN" | "ta-IN">("en-IN");

  // AI & Voice Conversation State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputQuery, setInputQuery] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isMicListening, setIsMicListening] = useState(false);
  const [isMicActive, setIsMicActive] = useState(true); // Toggle mic on/off
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

  // Audio & Speech Synthesis Refs
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isAiSpeakingRef = useRef<boolean>(false);
  const isCallActiveRef = useRef<boolean>(false);
  const activeUtterancesRef = useRef<SpeechSynthesisUtterance[]>([]);

  // Sound Wave Animation Level
  const [waveLevels, setWaveLevels] = useState<number[]>([15, 25, 40, 60, 30, 75, 45, 20]);

  // Format Duration mm:ss
  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Keep ref synchronized
  useEffect(() => {
    isAiSpeakingRef.current = isAiSpeaking;
  }, [isAiSpeaking]);

  useEffect(() => {
    isCallActiveRef.current = callState === "connected";
  }, [callState]);

  // Load voices asynchronously and reliably
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;

      const updateVoices = () => {
        const v = window.speechSynthesis.getVoices();
        if (v && v.length) {
          setAvailableVoices(v);
        }
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

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
      reco.lang = micLanguage; // "en-IN" or "ta-IN"

      reco.onstart = () => {
        setIsMicListening(true);
      };

      let finalSpeech = "";

      reco.onresult = (event: any) => {
        let interimText = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalSpeech += event.results[i][0].transcript + " ";
          } else {
            interimText += event.results[i][0].transcript;
          }
        }

        const candidateText = (finalSpeech + interimText).trim();
        if (candidateText && !isAiSpeakingRef.current) {
          setInputQuery(candidateText);
        }

        // Check if final utterance completed
        if (finalSpeech.trim() && !isAiSpeakingRef.current) {
          const toSend = finalSpeech.trim();
          finalSpeech = "";
          handleUserUtterance(toSend);
        }
      };

      reco.onerror = (err: any) => {
        // Ignorable non-critical events
        if (err.error !== "no-speech") {
          console.warn("Speech recognition event:", err.error);
        }
      };

      reco.onend = () => {
        setIsMicListening(false);
        // Auto-restart loop if call is active and AI is not speaking!
        if (isCallActiveRef.current && !isAiSpeakingRef.current && isMicActive && !isMuted) {
          try {
            reco.start();
          } catch (e) {
            // Already active
          }
        }
      };

      recognitionRef.current = reco;
    } catch (e) {
      console.warn("Recognition init error:", e);
    }
  }, [micLanguage, isMicActive, isMuted]);

  useEffect(() => {
    initSpeechRecognition();
  }, [initSpeechRecognition]);

  // Start Mic Listening Safely
  const startMicListening = () => {
    if (!recognitionRef.current || !isMicActive || isMuted) return;
    try {
      recognitionRef.current.start();
      setIsMicListening(true);
    } catch (e) {
      // Might already be running
    }
  };

  const stopMicListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsMicListening(false);
  };

  // High Quality Human-like Speech Synthesizer (Sentence Chunker to prevent stutter)
  const speakAI = (rawText: string) => {
    if (!synthRef.current || isMuted) return;

    // Temporarily pause mic so AI doesn't hear itself
    stopMicListening();
    setIsAiSpeaking(true);

    try {
      synthRef.current.cancel();
      activeUtterancesRef.current = [];

      // Clean text: strip markdown symbols, asterisks, brackets, and format money
      const cleanText = rawText
        .replace(/[\*_~#]/g, "")
        .replace(/₹\s*(\d+)/g, "$1 rupees")
        .replace(/Rs\.?\s*(\d+)/gi, "$1 rupees")
        .replace(/\s+/g, " ")
        .trim();

      // Split into short, natural human sentences/clauses (max 15-20 words)
      // This prevents the Windows Chromium speech synthesis stutter bug!
      const clauses = cleanText
        .split(/(?<=[.?!,])\s+/)
        .filter((c) => c.trim().length > 0);

      if (!clauses.length) {
        clauses.push(cleanText);
      }

      // Find the best realistic Natural Human Voice
      const voices = availableVoices.length
        ? availableVoices
        : synthRef.current.getVoices();

      let chosenVoice: SpeechSynthesisVoice | null = null;

      if (voiceGender === "female") {
        // Preferred Female Natural Voices (Indian English / Tamil / UK / US)
        chosenVoice =
          voices.find(
            (v) =>
              v.name.includes("Neerja") ||
              v.name.includes("Swara") ||
              v.name.includes("Heera") ||
              (v.lang.includes("en-IN") && v.name.toLowerCase().includes("female"))
          ) ||
          voices.find((v) => v.lang.includes("ta-IN")) ||
          voices.find((v) => v.name.includes("Google UK English Female")) ||
          voices.find((v) => v.name.includes("Zira")) ||
          voices.find((v) => v.name.toLowerCase().includes("female")) ||
          null;
      } else {
        // Preferred Male Natural Voices (Indian English / Tamil / UK / US)
        chosenVoice =
          voices.find(
            (v) =>
              v.name.includes("Prabhat") ||
              v.name.includes("Valluvar") ||
              v.name.includes("Ravi") ||
              (v.lang.includes("en-IN") && v.name.toLowerCase().includes("male"))
          ) ||
          voices.find((v) => v.name.includes("Google UK English Male")) ||
          voices.find((v) => v.name.includes("David")) ||
          voices.find((v) => v.name.toLowerCase().includes("male")) ||
          null;
      }

      let currentIdx = 0;

      const speakNextClause = () => {
        if (!synthRef.current) return;

        if (currentIdx >= clauses.length) {
          setIsAiSpeaking(false);
          // AI finished speaking -> Immediately reactivate Mic so user can talk!
          setTimeout(() => {
            if (isCallActiveRef.current && isMicActive && !isMuted) {
              startMicListening();
            }
          }, 200);
          return;
        }

        const clauseText = clauses[currentIdx];
        currentIdx++;

        const utterance = new SpeechSynthesisUtterance(clauseText);
        if (chosenVoice) utterance.voice = chosenVoice;

        // Smooth human cadence
        utterance.rate = voiceGender === "female" ? 1.02 : 0.98;
        utterance.pitch = voiceGender === "female" ? 1.05 : 0.95;

        // Prevent Chrome GC bug by holding reference
        activeUtterancesRef.current.push(utterance);
        (window as any).__activeUtterance = utterance;

        utterance.onend = () => {
          // Natural 40ms human breathing pause between sentences
          setTimeout(speakNextClause, 40);
        };

        utterance.onerror = (e) => {
          console.warn("Utterance error:", e);
          speakNextClause();
        };

        synthRef.current.speak(utterance);
      };

      speakNextClause();
    } catch (e) {
      console.warn("TTS speak error:", e);
      setIsAiSpeaking(false);
      startMicListening();
    }
  };

  const stopVoice = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    activeUtterancesRef.current = [];
    setIsAiSpeaking(false);
    stopMicListening();
  };

  // Modal Open Lifecycle
  useEffect(() => {
    if (!isOpen) {
      handleEndCall(false);
      return;
    }

    // Reset State
    setCallState("ringing");
    setCallSeconds(0);
    setAutoAnswerTimer(autoAnswerDelaySeconds);
    setDemoBooked(false);
    setDemoDetails(null);
    setQualification({ score: 55, tag: "WARM", reason: "Incoming call connection" });

    const personaName = voiceGender === "female" ? "Kavya" : "Vikram";
    const initialWelcomeText = `Vanakkam! Welcome to WeGrow Skill Campus, Sivakasi. Naan ${personaName}, WeGrow Admissions Counselor. Ungalukku entha course pathi details venum — Full Stack, AI, or Digital Marketing-ah?`;

    setMessages([
      {
        id: "msg-0",
        sender: "ai",
        text: initialWelcomeText,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sentiment: "Positive",
      },
    ]);

    // Handle Auto-Answer Countdown
    let countdownInterval: NodeJS.Timeout | null = null;
    countdownInterval = setInterval(() => {
      setAutoAnswerTimer((prev) => {
        if (prev <= 1) {
          if (countdownInterval) clearInterval(countdownInterval);
          connectCall(initialWelcomeText);
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
  }, [isOpen, lead, voiceGender]);

  // Connect Call
  const connectCall = (welcomeText: string) => {
    setCallState("connected");
    startTimer();
    speakAI(welcomeText);
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

      // Call Gemini Telecalling API Route
      const res = await fetch("/api/ai/telecalling/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: queryText,
          apiKey: savedApiKey,
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

      if (data && data.reply) {
        const aiMsg: Message = {
          id: `msg-${Date.now() + 1}`,
          sender: "ai",
          text: data.reply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          sentiment: data.sentiment || "Positive",
        };

        setMessages((prev) => [...prev, aiMsg]);

        // Speak response with clean fluid voice
        speakAI(data.reply);

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
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          sender: "ai",
          text: fallbackReply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      speakAI(fallbackReply);
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

  // Switch Voice Gender (Female / Male)
  const handleToggleVoiceGender = (newGender: "female" | "male") => {
    if (newGender === voiceGender) return;
    setVoiceGender(newGender);
    synthRef.current?.cancel();
    setIsAiSpeaking(false);
    const greeting =
      newGender === "female"
        ? "Switched to Kavya (Female Counselor Voice). Epdi help panna mudiyum?"
        : "Switched to Vikram (Male Admissions Lead Voice). Sollunga, enna details venum?";
    addToast(`Switched Voice to ${newGender === "female" ? "Kavya (Female)" : "Vikram (Male)"}`, "info");
    speakAI(greeting);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* ========================================================================= */}
        {/* HEADER: AI Persona, Voice Switcher (Male/Female), and Language Toggle */}
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
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 👩/👨 MALE & FEMALE VOICE SWITCHER BUTTONS */}
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

            {/* Language Recognition Switcher (English vs Tamil) */}
            <button
              type="button"
              onClick={() => {
                const nextLang = micLanguage === "en-IN" ? "ta-IN" : "en-IN";
                setMicLanguage(nextLang);
                addToast(`Mic Language set to ${nextLang === "ta-IN" ? "தமிழ் (Tamil)" : "English / Tanglish"}`, "info");
              }}
              className="bg-white/15 hover:bg-white/25 border border-white/20 px-2.5 py-1 rounded-xl text-xs font-bold text-white flex items-center gap-1 transition-colors"
              title="Toggle Speech Recognition Language"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{micLanguage === "en-IN" ? "Tanglish" : "தமிழ்"}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={() => {
                handleEndCall(true);
                onClose();
              }}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors ml-1"
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
                <span>Ringing... Auto-answering in {autoAnswerTimer}s</span>
              </div>
            ) : callState === "human_transferred" ? (
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>Human Counselor Active</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span>Live Call</span>
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
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : isMicListening
                    ? "bg-indigo-50 border-indigo-300 text-indigo-800 animate-pulse"
                    : "bg-slate-100 border-slate-200 text-slate-600"
                }`}
              >
                {isAiSpeaking ? (
                  <>
                    <Volume2 className="w-3 h-3 text-emerald-600 animate-bounce" />
                    <span>{voiceGender === "female" ? "Kavya Speaking" : "Vikram Speaking"}</span>
                  </>
                ) : isMicListening ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <Mic className="w-3 h-3 text-indigo-600" />
                    <span>Mic Listening (Speak Now)</span>
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
        {/* QUICK QUESTION PILLS (For 1-click testing) */}
        {/* ========================================================================= */}
        <div className="bg-white border-t border-slate-200 px-4 py-2 flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Test Prompts:
          </span>
          <button
            onClick={() => handleUserUtterance("Full stack web development fees and duration evvalavu?")}
            className="shrink-0 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 px-2.5 py-1 rounded-full text-[11px] transition-colors"
          >
            💰 Full Stack Fees?
          </button>
          <button
            onClick={() => handleUserUtterance("AI and Data Science course syllabus sollunga")}
            className="shrink-0 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 px-2.5 py-1 rounded-full text-[11px] transition-colors"
          >
            🤖 AI Syllabus?
          </button>
          <button
            onClick={() => handleUserUtterance("Free Demo class attend panna virumburen, Saturday batch book pannunga")}
            className="shrink-0 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 px-2.5 py-1 rounded-full text-[11px] transition-colors"
          >
            📅 Book Saturday Demo
          </button>
          <button
            onClick={() => handleUserUtterance("Sivakasi campus address enga irukku? Hostel facility irukka?")}
            className="shrink-0 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 px-2.5 py-1 rounded-full text-[11px] transition-colors"
          >
            📍 Campus & Hostel?
          </button>
          <button
            onClick={() => handleUserUtterance("Manager or senior counselor kitta direct-ah pesanum transfer pannunga")}
            className="shrink-0 bg-amber-50 hover:bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-[11px] transition-colors"
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
              placeholder="Speak via Mic, or type message here..."
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
                onClick={() => {
                  synthRef.current?.cancel();
                  setIsAiSpeaking(false);
                  startMicListening();
                }}
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
