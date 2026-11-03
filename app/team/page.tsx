"use client";

import React, { useState } from "react";
import {
  Trophy,
  Medal,
  Award,
  PhoneCall,
  UserCheck,
  GraduationCap,
  Sparkles,
  TrendingUp,
  X,
  Target,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import { Telecaller } from "@/types";

export default function TeamPerformancePage() {
  const { telecallers } = useCRM();
  const [selectedCaller, setSelectedCaller] = useState<Telecaller | null>(null);

  // Sorted by rank or admissions
  const sortedCallers = [...telecallers].sort((a, b) => a.rank - b.rank);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">
              Telecalling Team Leaderboard
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D5A52B]/15 text-[#B88A1B] flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" />
              October 2026 Season
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time counsellor rankings, milestone achievements, call speed, and student enrollment conversions
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-slate-500">Team Daily Calling Target</p>
          <p className="text-lg font-bold text-[#142B52]">237 / 260 Calls Done (91.1%)</p>
        </div>
      </div>

      {/* Top 3 Podium Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sortedCallers.slice(0, 3).map((caller, index) => {
          let badgeColor = "bg-[#D5A52B] text-[#142B52]";
          let ringColor = "ring-[#D5A52B]";
          let rankLabel = "🏆 Rank 1 • Top Performer";

          if (index === 1) {
            badgeColor = "bg-slate-300 text-slate-800";
            ringColor = "ring-slate-300";
            rankLabel = "🥈 Rank 2 • Silver";
          } else if (index === 2) {
            badgeColor = "bg-amber-700 text-white";
            ringColor = "ring-amber-700";
            rankLabel = "🥉 Rank 3 • Bronze";
          }

          return (
            <div
              key={caller.id}
              onClick={() => setSelectedCaller(caller)}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-soft hover:shadow-card cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${badgeColor}`}>
                    {rankLabel}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {caller.conversionRate}% Conv.
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={caller.avatar}
                    alt={caller.name}
                    className={`w-14 h-14 rounded-full object-cover ring-4 ${ringColor}`}
                  />
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-[#244B7A] transition-colors">
                      {caller.name}
                    </h3>
                    <p className="text-xs text-slate-500">{caller.role}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {caller.phone}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl text-center text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Calls Done</span>
                    <span className="font-bold text-slate-800">{caller.callsCompleted}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Interested</span>
                    <span className="font-bold text-indigo-700">{caller.interestedLeads}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Admissions</span>
                    <span className="font-bold text-emerald-700">{caller.admissionsGenerated}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Daily Target Progress</span>
                <span className="font-bold text-[#142B52]">
                  {Math.round((caller.callsCompleted / caller.dailyTarget) * 100)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Complete Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-soft overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Team Productivity & Conversion Matrix
            </h3>
            <p className="text-xs text-slate-500">
              Click any counsellor row to view in-depth performance audit
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Rank & Counsellor</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Assigned Leads</th>
                <th className="py-3 px-4">Today Calls (Target)</th>
                <th className="py-3 px-4">Connected Calls</th>
                <th className="py-3 px-4">Interested</th>
                <th className="py-3 px-4">Follow-ups Done</th>
                <th className="py-3 px-4">Admissions</th>
                <th className="py-3 px-4 text-right">Conversion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedCallers.map((c) => {
                const targetPct = Math.min(
                  100,
                  Math.round((c.callsCompleted / c.dailyTarget) * 100)
                );

                return (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCaller(c)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                            c.rank === 1
                              ? "bg-[#D5A52B] text-[#142B52]"
                              : c.rank === 2
                              ? "bg-slate-300 text-slate-800"
                              : c.rank === 3
                              ? "bg-amber-700 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {c.rank}
                        </span>
                        <img
                          src={c.avatar}
                          alt={c.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{c.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {c.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {c.role}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {c.assignedLeads}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">
                          {c.callsCompleted}
                        </span>
                        <span className="text-slate-400">/ {c.dailyTarget}</span>
                      </div>
                      <div className="w-24 bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                        <div
                          className="bg-[#142B52] h-full rounded-full"
                          style={{ width: `${targetPct}%` }}
                        />
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {c.connectedCalls}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-indigo-700">
                      {c.interestedLeads}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {c.followUpsCompleted}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      {c.admissionsGenerated}
                    </td>

                    <td className="py-3.5 px-4 text-right font-extrabold text-[#142B52]">
                      {c.conversionRate}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual Caller Detail Modal */}
      {selectedCaller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-[#142B52] text-white p-6 relative">
              <button
                onClick={() => setSelectedCaller(null)}
                className="absolute top-4 right-4 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4">
                <img
                  src={selectedCaller.avatar}
                  alt={selectedCaller.name}
                  className="w-16 h-16 rounded-full object-cover ring-4 ring-[#D5A52B]"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">
                      {selectedCaller.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D5A52B] text-[#142B52]">
                      Rank #{selectedCaller.rank}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{selectedCaller.role}</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {selectedCaller.email} • {selectedCaller.phone}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Cumulative Performance Metrics
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Calls Completed</span>
                  <span className="text-base font-bold text-slate-800">
                    {selectedCaller.callsCompleted}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Connected Calls</span>
                  <span className="text-base font-bold text-indigo-700">
                    {selectedCaller.connectedCalls}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Interested Leads</span>
                  <span className="text-base font-bold text-emerald-700">
                    {selectedCaller.interestedLeads}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Follow-ups Logged</span>
                  <span className="text-base font-bold text-slate-800">
                    {selectedCaller.followUpsCompleted}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Admissions Closed</span>
                  <span className="text-base font-bold text-[#D5A52B]">
                    {selectedCaller.admissionsGenerated}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Conversion Rate</span>
                  <span className="text-base font-bold text-[#142B52]">
                    {selectedCaller.conversionRate}%
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="font-semibold text-slate-700 block mb-1">
                  Manager Review:
                </span>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Consistently exceeds daily dialer goals. Outstanding student relationship management and high conversion on GenAI and Full Stack technical courses.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedCaller(null)}
                  className="px-5 py-2 bg-[#142B52] hover:bg-[#1E3B6E] text-white rounded-xl font-bold"
                >
                  Close Audit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

