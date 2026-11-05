"use client";

import React, { useState, useEffect } from "react";
import {
  Bot,
  Sparkles,
  Key,
  Volume2,
  Clock,
  PhoneIncoming,
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Play,
  Settings2,
} from "lucide-react";
import { useCRM } from "@/context/CRMContext";

export const AITelecallingSettings: React.FC<{ onTriggerTestCall?: () => void }> = ({
  onTriggerTestCall,
}) => {
  const { addToast } = useCRM();

  const [apiKey, setApiKey] = useState("");
  const [autoAnswer, setAutoAnswer] = useState(true);
  const [ringDelay, setRingDelay] = useState(2);
  const [voicePersona, setVoicePersona] = useState("Kavya (Friendly Female - Tanglish)");
  const [speechSpeed, setSpeechSpeed] = useState(1.0);
  const [demoBookingEnabled, setDemoBookingEnabled] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("wegrow_gemini_api_key") || "";
      const savedAutoAnswer = localStorage.getItem("wegrow_ai_auto_answer");
      const savedDelay = localStorage.getItem("wegrow_ai_ring_delay");
      const savedVoice = localStorage.getItem("wegrow_ai_voice_persona");

      if (savedKey) setApiKey(savedKey);
      if (savedAutoAnswer !== null) setAutoAnswer(savedAutoAnswer === "true");
      if (savedDelay) setRingDelay(Number(savedDelay));
      if (savedVoice) setVoicePersona(savedVoice);
    }
  }, []);

  const handleSaveSettings = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("wegrow_gemini_api_key", apiKey.trim());
      localStorage.setItem("wegrow_ai_auto_answer", String(autoAnswer));
      localStorage.setItem("wegrow_ai_ring_delay", String(ringDelay));
      localStorage.setItem("wegrow_ai_voice_persona", voicePersona);
    }
    setIsSaved(true);
    addToast("AI Telecalling Settings Saved Successfully!", "success");
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-800">Gemini AI Voice Telecalling Engine</h3>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated 24/7 call answering, course counseling, lead qualification & demo booking
            </p>
          </div>
        </div>

        {onTriggerTestCall && (
          <button
            onClick={onTriggerTestCall}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Test AI Inbound Call</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: API & Answering */}
        <div className="space-y-4">
          
          {/* Gemini API Key */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                Google Gemini API Key
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-indigo-600 hover:underline flex items-center gap-0.5 font-normal"
              >
                Get free key <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy... (Optional: built-in neural engine runs offline)"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              If left blank, our offline WeGrow Institute counseling engine answers automatically.
            </p>
          </div>

          {/* Auto Answer Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
            <div>
              <span className="text-xs font-bold text-slate-800 block">24/7 AI Inbound Auto-Answer</span>
              <span className="text-[11px] text-slate-500 block">
                Automatically pick up calls when counselors are busy or outside office hours
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAutoAnswer(!autoAnswer)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                autoAnswer ? "bg-emerald-600" : "bg-slate-300"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  autoAnswer ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Ring Delay */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Auto-Answer Pickup Delay
            </label>
            <select
              value={ringDelay}
              onChange={(e) => setRingDelay(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value={1}>Instant (1 Ring — 1 Second)</option>
              <option value={2}>Fast (2 Rings — 2 Seconds - Recommended)</option>
              <option value={3}>Standard (3 Rings — 3 Seconds)</option>
              <option value={5}>Delayed (5 Rings — Allows human to pick up first)</option>
            </select>
          </div>

        </div>

        {/* Right Column: Voice & Persona */}
        <div className="space-y-4">
          
          {/* Voice Persona */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-slate-400" />
              AI Voice Persona & Language Cadence
            </label>
            <select
              value={voicePersona}
              onChange={(e) => setVoicePersona(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Kavya (Friendly Female - Tanglish)">
                Kavya (Friendly Female — Tanglish & Tamil Nadu Accent)
              </option>
              <option value="Vikram (Professional Male - Tanglish)">
                Vikram (Professional Male — Technical & Career Guide)
              </option>
              <option value="Priya (Empathetic Senior Counselor)">
                Priya (Senior Admissions Counselor — Soft & Polite)
              </option>
            </select>
          </div>

          {/* Speech Rate */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Voice Speed Cadence: {speechSpeed}x
            </label>
            <input
              type="range"
              min="0.8"
              max="1.3"
              step="0.05"
              value={speechSpeed}
              onChange={(e) => setSpeechSpeed(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0.8x (Slow & Clear)</span>
              <span>1.0x (Natural)</span>
              <span>1.3x (Fast)</span>
            </div>
          </div>

          {/* Automatic Free Demo Booking */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Auto-Book Free Demo Class</span>
              <span className="text-[11px] text-slate-500 block">
                Automatically schedule campus visits in CRM Follow-ups calendar
              </span>
            </div>
            <button
              type="button"
              onClick={() => setDemoBookingEnabled(!demoBookingEnabled)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                demoBookingEnabled ? "bg-emerald-600" : "bg-slate-300"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  demoBookingEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

        </div>

      </div>

      {/* Save Button */}
      <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
        {isSaved && (
          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" /> Settings Saved!
          </span>
        )}
        <button
          onClick={handleSaveSettings}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all hover:scale-105"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save AI Settings</span>
        </button>
      </div>

    </div>
  );
};
