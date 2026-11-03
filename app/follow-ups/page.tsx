"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  Calendar,
  ListFilter,
  CheckCircle2,
  Clock,
  Phone,
  PhoneCall,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
  Edit2,
  Check,
} from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { FollowUpTask } from "@/types";

export default function FollowUpsPage() {
  const { followUps, markFollowUpCompleted, rescheduleFollowUp } = useCRM();

  const [activeTab, setActiveTab] = useState<
    "Today" | "Tomorrow" | "Overdue" | "Upcoming" | "Completed"
  >("Today");

  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [rescheduleModalTask, setRescheduleModalTask] = useState<FollowUpTask | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("11:00 AM");
  const [rescheduleRemarks, setRescheduleRemarks] = useState("");

  // Counts for tabs
  const todayCount = followUps.filter((f) => f.status === "Today").length;
  const tomorrowCount = followUps.filter((f) => f.status === "Tomorrow").length;
  const overdueCount = followUps.filter((f) => f.status === "Overdue").length;
  const upcomingCount = followUps.filter((f) => f.status === "Upcoming").length;
  const completedCount = followUps.filter((f) => f.status === "Completed").length;

  // Filtered by tab
  const displayedTasks = followUps.filter((f) => f.status === activeTab);

  const handleOpenReschedule = (task: FollowUpTask) => {
    setRescheduleModalTask(task);
    setNewDate(task.followUpDate !== "-" ? task.followUpDate : "2026-10-31");
    setNewTime(task.followUpTime || "11:00 AM");
    setRescheduleRemarks(task.remarks);
  };

  const handleSaveReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleModalTask || !newDate) return;
    rescheduleFollowUp(
      rescheduleModalTask.id,
      newDate,
      newTime,
      rescheduleRemarks
    );
    setRescheduleModalTask(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">
              Follow-up Task Management
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              {todayCount + overdueCount} Urgent Callbacks
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track student promises, scheduled consultations, and overdue callbacks across counselors
          </p>
        </div>

        {/* View Switcher: List vs Calendar */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "list"
                ? "bg-white text-[#142B52] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>List View</span>
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "calendar"
                ? "bg-white text-[#142B52] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Calendar View</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200/90 shadow-soft flex flex-wrap gap-2">
        {[
          { id: "Today", label: "Today's Follow-ups", count: todayCount, color: "text-amber-700 bg-amber-50" },
          { id: "Tomorrow", label: "Tomorrow", count: tomorrowCount, color: "text-blue-700 bg-blue-50" },
          { id: "Overdue", label: "Overdue Tasks", count: overdueCount, color: "text-rose-700 bg-rose-50 font-bold" },
          { id: "Upcoming", label: "Upcoming", count: upcomingCount, color: "text-purple-700 bg-purple-50" },
          { id: "Completed", label: "Completed", count: completedCount, color: "text-emerald-700 bg-emerald-50" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? "bg-[#142B52] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === tab.id ? "bg-white/20 text-white" : tab.color
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content based on view mode */}
      {viewMode === "list" ? (
        /* LIST VIEW TABLE */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">Student Name & Phone</th>
                  <th className="py-3.5 px-4">Course</th>
                  <th className="py-3.5 px-4">Assigned Caller</th>
                  <th className="py-3.5 px-4">Last Contacted</th>
                  <th className="py-3.5 px-4">Follow-up Date & Time</th>
                  <th className="py-3.5 px-4">Priority & Remarks</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedTasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <CalendarClock className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="text-sm font-semibold text-slate-700">
                        No follow-up tasks in {activeTab}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        All clear for this category. Check other tabs or schedule new callbacks.
                      </p>
                    </td>
                  </tr>
                ) : (
                  displayedTasks.map((task) => (
                    <tr
                      key={task.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        task.status === "Overdue" ? "bg-rose-50/30" : ""
                      }`}
                    >
                      {/* Student details */}
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/leads/${task.leadId}`}
                          className="font-bold text-slate-900 hover:text-[#244B7A]"
                        >
                          {task.studentName}
                        </Link>
                        <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                          {task.phone}
                        </span>
                      </td>

                      {/* Course */}
                      <td className="py-3.5 px-4 text-slate-700 font-medium max-w-[170px] truncate">
                        {task.course}
                      </td>

                      {/* Caller */}
                      <td className="py-3.5 px-4 text-slate-800 font-medium">
                        {task.assignedCaller}
                      </td>

                      {/* Last contacted */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {task.lastContacted}
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <Clock className="w-3.5 h-3.5 text-[#D5A52B]" />
                          <span>{task.followUpTime}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {task.followUpDate}
                        </span>
                      </td>

                      {/* Remarks & Priority */}
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <div className="flex items-center gap-1.5 mb-1">
                          <StatusBadge status={task.priority} type="priority" />
                        </div>
                        <p className="text-[11px] text-slate-600 italic line-clamp-1">
                          "{task.remarks}"
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={task.status} type="followup" />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {task.status !== "Completed" && (
                            <button
                              onClick={() => markFollowUpCompleted(task.id)}
                              title="Mark as Completed"
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                            >
                              <Check className="w-4 h-4 stroke-[2.5]" />
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenReschedule(task)}
                            title="Reschedule Follow-up"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <Link
                            href="/calls"
                            title="Call Now in Telecaller Workspace"
                            className="p-1.5 rounded-lg bg-[#142B52] text-white hover:bg-[#1E3B6E] transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5 text-[#D5A52B]" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CALENDAR VIEW */
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                October / November 2026 Schedule
              </h3>
              <p className="text-xs text-slate-500">
                Follow-up distributions across calling schedule
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">October 2026</span>
              <button className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Grid of days */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <span key={day} className="font-bold text-slate-400 uppercase text-[10px] py-1">
                {day}
              </span>
            ))}

            {/* Days 25 to 31 */}
            {[
              { day: 25, count: 2, label: "2 Completed", color: "bg-slate-50 border-slate-200" },
              { day: 26, count: 5, label: "5 Completed", color: "bg-slate-50 border-slate-200" },
              { day: 27, count: 6, label: "6 Done", color: "bg-slate-50 border-slate-200" },
              { day: 28, count: 9, label: "9 Done", color: "bg-slate-50 border-slate-200" },
              { day: 29, count: 12, label: "2 Overdue", color: "bg-rose-50 border-rose-200 text-rose-800" },
              { day: 30, count: 8, label: "8 Today (Active)", color: "bg-[#FDF8ED] border-[#D5A52B] ring-2 ring-[#D5A52B]/40" },
              { day: 31, count: 4, label: "4 Tomorrow", color: "bg-blue-50 border-blue-200 text-blue-800" },
            ].map((d) => (
              <div
                key={d.day}
                className={`min-h-[90px] rounded-xl border p-2 text-left flex flex-col justify-between ${d.color}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">{d.day}</span>
                  {d.day === 30 && (
                    <span className="w-2 h-2 rounded-full bg-[#D5A52B]" />
                  )}
                </div>
                <div className="text-[10px] font-semibold mt-1">
                  {d.label}
                </div>
                <span className="text-[9px] text-slate-500 mt-2 block">
                  {d.count} tasks
                </span>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-400 text-center pt-3 border-t border-slate-100">
            Click on any day card to view scheduled callback list for that date.
          </p>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-[#142B52] text-white">
              <div>
                <h3 className="font-bold text-sm">Reschedule Student Callback</h3>
                <p className="text-xs text-slate-300">
                  Student: {rescheduleModalTask.studentName}
                </p>
              </div>
              <button
                onClick={() => setRescheduleModalTask(null)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReschedule} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  New Follow-up Date *
                </label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Time Slot
                </label>
                <select
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-white"
                >
                  <option value="10:00 AM">10:00 AM (Morning)</option>
                  <option value="11:30 AM">11:30 AM (Mid-day)</option>
                  <option value="02:30 PM">02:30 PM (Afternoon)</option>
                  <option value="04:00 PM">04:00 PM (Tea-time)</option>
                  <option value="05:30 PM">05:30 PM (Evening)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Reschedule / Updated Note
                </label>
                <textarea
                  rows={2}
                  value={rescheduleRemarks}
                  onChange={(e) => setRescheduleRemarks(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setRescheduleModalTask(null)}
                  className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#142B52] hover:bg-[#1E3B6E] text-white rounded-xl font-bold"
                >
                  Update Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

