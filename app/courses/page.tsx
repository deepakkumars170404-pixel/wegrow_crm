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
  PlusCircle,
  Edit2,
  Trash2,
  Lock,
  Plus,
} from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import { formatINR } from "@/lib/utils";
import { Course } from "@/types";

export default function CourseLibraryPage() {
  const { courses, activeUserRole, showToast } = useCRM();
  const [courseList, setCourseList] = useState<Course[]>(courses);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("All");

  // RBAC Permission: Owner and Admin ONLY can Add, Edit, or Delete Courses
  const canManageCourses =
    activeUserRole === "Owner" ||
    activeUserRole === "Owner / MD" ||
    activeUserRole === "Admin";

  // Add Course Modal State
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseCategory, setNewCourseCategory] = useState("01 IT & Development");
  const [newCourseDuration, setNewCourseDuration] = useState("6 Months");
  const [newCourseFee, setNewCourseFee] = useState("45000");
  const [newCourseDesc, setNewCourseDesc] = useState("");
  const [newCourseEligibility, setNewCourseEligibility] = useState(
    "Any Degree / Diploma / Engineering / Arts & Science"
  );

  // Edit Course Modal State
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const categories = [
    "All",
    "01 IT & Development",
    "02 Tech, Business & Communication",
    "03 Creative, AI & Future Tech",
  ];

  const filteredCourses = courseList.filter((c) => {
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

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageCourses) {
      alert("Access Denied: Only Owner and Admin can add courses.");
      return;
    }
    if (!newCourseName.trim()) return;

    const newCrs: Course = {
      id: `crs-custom-${Date.now()}`,
      name: newCourseName.trim(),
      category: newCourseCategory,
      duration: newCourseDuration,
      fee: parseInt(newCourseFee, 10) || 35000,
      shortDescription:
        newCourseDesc.trim() ||
        `${newCourseName.trim()} industry training program at WeGrow Skill Campus. Duration: ${newCourseDuration}.`,
      fullDescription:
        newCourseDesc.trim() ||
        `Comprehensive curriculum for ${newCourseName.trim()} at WeGrow Skill Campus with live projects and placement assistance.`,
      eligibility: newCourseEligibility.trim(),
      curriculum: [
        `Module 1: Foundations & Core Concepts of ${newCourseName.trim()}`,
        `Module 2: Practical Lab Workflows & Real-time Exercises`,
        `Module 3: Advanced Industry Frameworks & Live Projects`,
        `Module 4: Capstone Execution, Portfolio & Interview Prep`,
      ],
      highlights: [
        "100% Practical Lab Training",
        "Real-time Industry Project Guidance",
        "WeGrow Certificate of Completion",
        "Placement & Career Support",
      ],
      mode: "Classroom / Offline",
      enrolledStudents: 0,
      rating: 5.0,
      iconName:
        newCourseCategory.includes("01")
          ? "Code2"
          : newCourseCategory.includes("02")
          ? "TrendingUp"
          : "BrainCircuit",
    };

    setCourseList([newCrs, ...courseList]);
    setIsAddCourseModalOpen(false);
    setNewCourseName("");
    setNewCourseDesc("");
    showToast({
      type: "success",
      title: "Course Added",
      message: `${newCrs.name} has been added to WeGrow Curriculum.`,
    });
  };

  const handleSaveEditCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageCourses) {
      alert("Access Denied: Only Owner and Admin can modify courses.");
      return;
    }
    if (!editingCourse) return;

    setCourseList(courseList.map((c) => (c.id === editingCourse.id ? editingCourse : c)));
    showToast({
      type: "success",
      title: "Course Updated",
      message: `${editingCourse.name} curriculum has been updated.`,
    });
    setEditingCourse(null);
  };

  const handleDeleteCourse = (courseId: string, courseName: string) => {
    if (!canManageCourses) {
      alert("Access Denied: Only Owner and Admin can delete courses.");
      return;
    }
    if (confirm(`Are you sure you want to remove "${courseName}" from WeGrow Course Library?`)) {
      setCourseList(courseList.filter((c) => c.id !== courseId));
      showToast({
        type: "info",
        title: "Course Removed",
        message: `${courseName} was removed from the course library.`,
      });
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
              {courseList.length} Active Programs
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official curriculum blueprints, tuition structures, batch schedules, and brochure downloads
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {canManageCourses ? (
            <button
              onClick={() => setIsAddCourseModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#142B52] hover:bg-[#1E3B6E] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-[#D5A52B]" />
              <span>Add New Course</span>
            </button>
          ) : (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-400 rounded-xl text-xs font-semibold select-none"
              title="🔒 Telecaller mode: Course additions and curriculum edits restricted to Owner and Admin"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Course Management (Owner/Admin Only)</span>
            </div>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
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
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      {course.category}
                    </span>
                    {canManageCourses && (
                      <div className="flex items-center gap-1 ml-1">
                        <button
                          onClick={() => setEditingCourse(course)}
                          title="Edit Course"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course.id, course.name)}
                          title="Delete Course"
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
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
                    <span className="font-bold text-[#142B52]">{formatINR(course.fee)}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Button */}
              <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">
                  {course.mode}
                </span>
                <button
                  onClick={() => setSelectedCourse(course)}
                  className="px-4 py-2 bg-[#142B52] hover:bg-[#1E3B6E] text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
                >
                  View Details
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Course Modal (Owner / Admin Only) */}
      {isAddCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-[#142B52] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#D5A52B]" />
                <h3 className="font-bold text-sm">Add New Curriculum Course</h3>
              </div>
              <button
                onClick={() => setIsAddCourseModalOpen(false)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Course / Program Title *
                </label>
                <input
                  type="text"
                  required
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder="e.g. Master in Generative AI & Automation"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#142B52]/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Track Category</label>
                  <select
                    value={newCourseCategory}
                    onChange={(e) => setNewCourseCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#142B52]/20"
                  >
                    <option value="01 IT & Development">01 IT & Development</option>
                    <option value="02 Tech, Business & Communication">02 Tech, Business & Communication</option>
                    <option value="03 Creative, AI & Future Tech">03 Creative, AI & Future Tech</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration</label>
                  <select
                    value={newCourseDuration}
                    onChange={(e) => setNewCourseDuration(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#142B52]/20"
                  >
                    <option value="3 Months">3 Months</option>
                    <option value="4 Months">4 Months</option>
                    <option value="6 Months">6 Months</option>
                    <option value="9 Months">9 Months</option>
                    <option value="12 Months">12 Months</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tuition Fee (₹)</label>
                <input
                  type="number"
                  required
                  value={newCourseFee}
                  onChange={(e) => setNewCourseFee(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#142B52]/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Short Description</label>
                <textarea
                  rows={2}
                  value={newCourseDesc}
                  onChange={(e) => setNewCourseDesc(e.target.value)}
                  placeholder="Overview of tools covered, practical lab work, and job role outcomes..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#142B52]/20 resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Student Eligibility</label>
                <input
                  type="text"
                  value={newCourseEligibility}
                  onChange={(e) => setNewCourseEligibility(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#142B52]/20"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddCourseModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#142B52] hover:bg-[#1E3B6E] text-white rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Course Modal (Owner / Admin Only) */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-[#142B52] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#D5A52B]" />
                <h3 className="font-bold text-sm">Edit Curriculum: {editingCourse.name}</h3>
              </div>
              <button
                onClick={() => setEditingCourse(null)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCourse} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  value={editingCourse.name}
                  onChange={(e) => setEditingCourse({ ...editingCourse, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#142B52]/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration</label>
                  <input
                    type="text"
                    required
                    value={editingCourse.duration}
                    onChange={(e) => setEditingCourse({ ...editingCourse, duration: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#142B52]/20"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tuition Fee (₹)</label>
                  <input
                    type="number"
                    required
                    value={editingCourse.fee}
                    onChange={(e) =>
                      setEditingCourse({
                        ...editingCourse,
                        fee: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#142B52]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingCourse.shortDescription}
                  onChange={(e) =>
                    setEditingCourse({ ...editingCourse, shortDescription: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#142B52]/20 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#142B52] hover:bg-[#1E3B6E] text-white rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  alert(`Downloaded official ${selectedCourse.name} Curriculum & Brochure PDF.`)
                }
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 hover:bg-white text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>Download Brochure PDF</span>
              </button>

              <button
                onClick={() => setSelectedCourse(null)}
                className="px-5 py-2 bg-[#142B52] hover:bg-[#1E3B6E] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
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
