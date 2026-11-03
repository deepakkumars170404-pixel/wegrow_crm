"use client";

import React, { useState } from "react";
import {
  GraduationCap,
  Clock,
  IndianRupee,
  BookOpen,
  Award,
  Sparkles,
  Download,
  CheckCircle2,
  X,
  Code2,
  BrainCircuit,
  BarChart3,
  TrendingUp,
  Palette,
  Cloud,
  FileText,
} from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import { formatINR } from "@/lib/utils";
import { Course } from "@/types";

export default function CourseLibraryPage() {
  const { courses } = useCRM();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("All");

  const categories = ["All", "Artificial Intelligence", "Software Development", "Data & Analytics", "Digital Marketing", "Design & Media", "Cloud & DevOps"];

  const filteredCourses = courses.filter((c) => {
    if (categoryFilter === "All") return true;
    return c.category === categoryFilter;
  });

  const getCourseIcon = (iconName: string) => {
    switch (iconName) {
      case "BrainCircuit":
        return BrainCircuit;
      case "Code2":
        return Code2;
      case "BarChart3":
        return BarChart3;
      case "TrendingUp":
        return TrendingUp;
      case "Palette":
        return Palette;
      case "Cloud":
        return Cloud;
      default:
        return GraduationCap;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">
              WeGrow Course Library & Curriculum
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D5A52B]/15 text-[#B88A1B]">
              {courses.length} Active Programs
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official curriculum blueprints, tuition structures, batch schedules, and brochure downloads for telecalling staff
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-slate-500">Total Campus Enrolments</p>
          <p className="text-base font-bold text-[#142B52]">1,090+ Graduated Alumni</p>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition-all ${
              categoryFilter === cat
                ? "bg-[#142B52] text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => {
          const Icon = getCourseIcon(course.iconName);

          return (
            <div
              key={course.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-soft hover:shadow-card transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-6 space-y-4">
                {/* Header Icon & Tag */}
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-[#142B52]/10 text-[#142B52] group-hover:bg-[#142B52] group-hover:text-[#D5A52B] transition-colors flex items-center justify-center">
                    <Icon className="w-6 h-6 stroke-[2]" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    {course.category}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-900 group-hover:text-[#244B7A] transition-colors">
                    {course.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {course.shortDescription}
                  </p>
                </div>

                {/* Key Course Stats */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Duration</span>
                    <span className="font-semibold text-slate-800">{course.duration}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Investment (Fee)</span>
                    <span className="font-bold text-[#142B52]">
                      {formatINR(course.fee)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Enrolled: <strong className="text-slate-800">{course.enrolledStudents}</strong></span>
                  <span className="text-amber-600 font-semibold">★ {course.rating} Rating</span>
                </div>
              </div>

              {/* Card Footer Button */}
              <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">
                  {course.mode}
                </span>
                <button
                  onClick={() => setSelectedCourse(course)}
                  className="px-4 py-2 bg-[#142B52] hover:bg-[#1E3B6E] text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  View Details
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Course Detail Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-[#142B52] text-white p-6 relative flex-shrink-0">
              <button
                onClick={() => setSelectedCourse(null)}
                className="absolute top-4 right-4 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <span className="text-xs font-bold uppercase tracking-wider text-[#D5A52B] block mb-1">
                {selectedCourse.category} • {selectedCourse.mode}
              </span>
              <h2 className="text-xl font-bold text-white">
                {selectedCourse.name}
              </h2>
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-300">
                <span>Duration: <strong className="text-white">{selectedCourse.duration}</strong></span>
                <span>•</span>
                <span>Tuition Fee: <strong className="text-[#D5A52B] font-bold text-sm">{formatINR(selectedCourse.fee)}</strong></span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">
                  Program Overview
                </h4>
                <p className="text-slate-600 leading-relaxed">
                  {selectedCourse.fullDescription}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">
                  Candidate Eligibility
                </h4>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-700">
                  {selectedCourse.eligibility}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">
                  Comprehensive Curriculum Modules
                </h4>
                <div className="space-y-2">
                  {selectedCourse.curriculum.map((mod, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="font-medium text-slate-800">{mod}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">
                  Campus Program Highlights
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedCourse.highlights.map((hl, i) => (
                    <div key={i} className="flex items-center gap-2 text-slate-700">
                      <Sparkles className="w-3.5 h-3.5 text-[#D5A52B]" />
                      <span>{hl}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
              <button
                onClick={() =>
                  alert(`Demo: Downloaded official ${selectedCourse.name} Brochure PDF.`)
                }
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 hover:bg-white text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>Download Brochure PDF</span>
              </button>

              <button
                onClick={() => setSelectedCourse(null)}
                className="px-5 py-2 bg-[#142B52] hover:bg-[#1E3B6E] text-white rounded-xl text-xs font-bold transition-colors"
              >
                Close Program
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

