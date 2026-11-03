"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Search,
  Send,
  Paperclip,
  Check,
  CheckCheck,
  FileText,
  Download,
  BookOpen,
  Phone,
  User,
  Sparkles,
  Info,
  Clock,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import { initialWhatsAppTemplates } from "@/data/dummy-data";
import { WhatsAppChat, WhatsAppTemplate } from "@/types";

export default function WhatsAppPage() {
  const { whatsappChats, sendWhatsAppMessage, courses } = useCRM();

  const [activeChatId, setActiveChatId] = useState<string>(whatsappChats[0]?.id || "chat-1");
  const [chatSearch, setChatSearch] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);

  const activeChat = whatsappChats.find((c) => c.id === activeChatId) || whatsappChats[0];

  // Filtered chats
  const filteredChats = whatsappChats.filter((c) => {
    return (
      c.studentName.toLowerCase().includes(chatSearch.toLowerCase()) ||
      c.phone.includes(chatSearch) ||
      c.course.toLowerCase().includes(chatSearch.toLowerCase())
    );
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeChat) return;

    sendWhatsAppMessage(activeChat.id, messageInput.trim());
    setMessageInput("");
  };

  const handleApplyTemplate = (tpl: WhatsAppTemplate) => {
    if (!activeChat) return;
    const personalized = tpl.message
      .replace("{StudentName}", activeChat.studentName)
      .replace("{CourseName}", activeChat.course)
      .replace("{CourseFee}", "45,000")
      .replace("{MonthlyEMI}", "3,750");

    setMessageInput(personalized);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">
              WhatsApp Student Engagement Desk
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              WeGrow Official WhatsApp Business API (Simulated Demo)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Send instant course brochures, fee breakdowns, webinar reminders, and admission onboarding docs
          </p>
        </div>

        <Link
          href="/leads"
          className="text-xs font-semibold text-[#142B52] hover:underline self-start sm:self-auto"
        >
          View all registered student phone numbers
        </Link>
      </div>

      {/* Main 3-Panel Chat Workspace */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden grid grid-cols-1 lg:grid-cols-12 h-[720px]">
        {/* PANEL 1: Conversation List (3 Cols) */}
        <div className="lg:col-span-3 border-r border-slate-200 flex flex-col h-full bg-slate-50/50">
          {/* Search Header */}
          <div className="p-3 border-b border-slate-200 bg-white space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Chats ({filteredChats.length})
              </h3>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search student or phone..."
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 bg-slate-100 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* List of Contacts */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredChats.map((chat) => {
              const isSelected = chat.id === activeChatId;
              return (
                <div
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  className={`p-3 cursor-pointer transition-all ${
                    isSelected ? "bg-emerald-50/70 border-l-4 border-l-emerald-600" : "hover:bg-slate-100/60"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <p className="text-xs font-bold text-slate-900 leading-tight">
                      {chat.studentName}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {chat.lastMessageTime}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {chat.phone}
                  </p>

                  <p className="text-[11px] text-slate-600 truncate mt-1">
                    {chat.lastMessage}
                  </p>

                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[10px] text-[#B88A1B] font-semibold bg-[#D5A52B]/10 px-1.5 py-0.2 rounded">
                      {chat.course}
                    </span>
                    {chat.unreadCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PANEL 2: Chat Main Center (6 Cols) */}
        <div className="lg:col-span-6 flex flex-col h-full bg-[#EFEAE2] relative">
          {/* Header */}
          <div className="p-3.5 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#142B52] text-[#D5A52B] font-bold flex items-center justify-center text-sm shadow-xs">
                {activeChat?.studentName.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  {activeChat?.studentName}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  {activeChat?.phone} • {activeChat?.course}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/leads/${activeChat?.leadId}`}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Profile
              </Link>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F0F2F5]/80">
            {activeChat?.messages.map((m) => {
              const isCaller = m.sender === "caller";
              return (
                <div
                  key={m.id}
                  className={`flex ${isCaller ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs shadow-xs relative ${
                      isCaller
                        ? "bg-[#D9FDD3] text-slate-800 rounded-tr-none"
                        : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>

                    {m.attachment && (
                      <div className="mt-2 p-2 rounded-xl bg-black/5 border border-black/10 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-rose-600" />
                          <div>
                            <p className="font-bold text-[11px] text-slate-800 truncate max-w-[150px]">
                              {m.attachment.name}
                            </p>
                            <span className="text-[9px] text-slate-500">
                              {m.attachment.size} • PDF Document
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => alert(`Downloading ${m.attachment?.name}...`)}
                          className="p-1 text-slate-600 hover:text-slate-900"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-400">
                      <span>{m.timestamp}</span>
                      {isCaller && <CheckCheck className="w-3.5 h-3.5 text-sky-500" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Message Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <button
              type="button"
              onClick={() => {
                setMessageInput((prev) =>
                  prev
                    ? `${prev} [Attachment: WeGrow_Brochure.pdf]`
                    : `Hi ${activeChat?.studentName}, sharing our official WeGrow Skill Campus course brochure & syllabus.`
                );
              }}
              title="Attach Official Course Brochure"
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              placeholder="Type message or click a pre-approved template on the right..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />

            <button
              type="submit"
              className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-transform active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* PANEL 3: Message Templates & Course Assets (3 Cols) */}
        <div className="lg:col-span-3 border-l border-slate-200 p-4 overflow-y-auto space-y-5 bg-white">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Quick Templates
              </h3>
              <Sparkles className="w-3.5 h-3.5 text-[#D5A52B]" />
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              One-click personalized WhatsApp message drafts
            </p>

            <div className="space-y-2">
              {initialWhatsAppTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => handleApplyTemplate(tpl)}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 cursor-pointer transition-all text-xs group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 group-hover:text-emerald-700">
                      {tpl.title}
                    </span>
                    <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      {tpl.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                    {tpl.message}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Brochure Placeholder */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">
              Course Collateral
            </h4>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#142B52]" />
                <span className="font-bold text-slate-800">{activeChat?.course}</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Official syllabus, placement metrics, and admission guidelines ready to share.
              </p>
              <button
                onClick={() =>
                  sendWhatsAppMessage(
                    activeChat.id,
                    `Attached: WeGrow_${activeChat.course.replace(/\s+/g, "_")}_Brochure_2026.pdf`
                  )
                }
                className="w-full py-1.5 px-2 bg-[#142B52] hover:bg-[#1E3B6E] text-white rounded-lg text-[11px] font-bold transition-colors"
              >
                Send Brochure PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

