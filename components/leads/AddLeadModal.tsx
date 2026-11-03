"use client";

import React, { useState } from "react";
import { X, UserPlus, Sparkles } from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import { LeadPriority, LeadStatus } from "@/types";

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({ isOpen, onClose }) => {
  const { addLead, courses, telecallers } = useCRM();

  const [studentName, setStudentName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [courseInterested, setCourseInterested] = useState(courses[0]?.name || "AI Explorer & Generative AI");
  const [leadSource, setLeadSource] = useState<any>("Website");
  const [assignedCaller, setAssignedCaller] = useState(telecallers[0]?.name || "Priya Sharma");
  const [priority, setPriority] = useState<LeadPriority>("Hot");
  const [status, setStatus] = useState<LeadStatus>("New");
  const [city, setCity] = useState("Bangalore");
  const [education, setEducation] = useState("");
  const [noteContent, setNoteContent] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !phone.trim()) return;

    const today = new Date().toISOString().split("T")[0];

    addLead({
      studentName,
      phone,
      email: email || `${studentName.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
      courseInterested,
      leadSource,
      assignedCaller,
      priority,
      status,
      enquiryDate: today,
      nextFollowUpDate: today,
      nextFollowUpTime: "11:00 AM",
      city,
      education,
      notes: noteContent.trim()
        ? [
            {
              id: "nt-" + Date.now(),
              author: assignedCaller,
              timestamp: "Just now",
              content: noteContent.trim(),
            },
          ]
        : [],
    });

    // Reset and close
    setStudentName("");
    setPhone("");
    setEmail("");
    setEducation("");
    setNoteContent("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#142B52] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D5A52B] text-[#142B52] flex items-center justify-center font-bold">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Add New Student Enquiry
              </h2>
              <p className="text-xs text-slate-300">
                Register fresh enquiry into WeGrow Telecalling CRM
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Row 1: Name and Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Aarav Sharma"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#142B52]/20 focus:border-[#142B52]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number (WhatsApp) *
              </label>
              <input
                type="text"
                required
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#142B52]/20 focus:border-[#142B52]"
              />
            </div>
          </div>

          {/* Row 2: Email and Course Interested */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="aarav.sharma@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#142B52]/20 focus:border-[#142B52]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Course Interested *
              </label>
              <select
                value={courseInterested}
                onChange={(e) => setCourseInterested(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#142B52]/20 focus:border-[#142B52] bg-white"
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.name}>
                    {course.name} (₹{(course.fee / 1000).toFixed(0)}k)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Lead Source and Assigned Caller */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lead Source
              </label>
              <select
                value={leadSource}
                onChange={(e) => setLeadSource(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#142B52]/20 focus:border-[#142B52] bg-white"
              >
                <option value="Website">Website Form</option>
                <option value="Instagram">Instagram Ad</option>
                <option value="Facebook">Facebook Campaign</option>
                <option value="Google Ads">Google Search Ads</option>
                <option value="Walk-in">Campus Walk-in</option>
                <option value="Referral">Student Referral</option>
                <option value="Phone">Inbound Direct Phone</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assign Telecaller
              </label>
              <select
                value={assignedCaller}
                onChange={(e) => setAssignedCaller(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#142B52]/20 focus:border-[#142B52] bg-white"
              >
                {telecallers.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name} ({t.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4: Priority & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lead Priority
              </label>
              <div className="flex gap-2">
                {(["Hot", "Warm", "Cold"] as LeadPriority[]).map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                      priority === p
                        ? p === "Hot"
                          ? "bg-rose-50 text-rose-700 border-rose-400 ring-2 ring-rose-200"
                          : p === "Warm"
                          ? "bg-amber-50 text-amber-700 border-amber-400 ring-2 ring-amber-200"
                          : "bg-sky-50 text-sky-700 border-sky-400 ring-2 ring-sky-200"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LeadStatus)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#142B52]/20 focus:border-[#142B52] bg-white"
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Interested">Interested</option>
                <option value="Counselling Scheduled">Counselling Scheduled</option>
                <option value="Visited Campus">Visited Campus</option>
              </select>
            </div>
          </div>

          {/* Row 5: City & Education */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                City / Location
              </label>
              <input
                type="text"
                placeholder="e.g. Bangalore, Pune, Hyderabad"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#142B52]/20 focus:border-[#142B52]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Highest Qualification
              </label>
              <input
                type="text"
                placeholder="e.g. B.Tech CS 2024 / Working Professional"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#142B52]/20 focus:border-[#142B52]"
              />
            </div>
          </div>

          {/* Row 6: Initial Caller Remark */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Initial Note / Requirement Details
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Inquired about weekend batch timing and placement tie-ups..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#142B52]/20 focus:border-[#142B52]"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-[#142B52] hover:bg-[#1E3B6E] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#142B52]/20"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D5A52B]" />
              Save Enquiry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

