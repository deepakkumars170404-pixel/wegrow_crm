"use client";

import React, { useState } from "react";
import {
  PhoneCall,
  ShieldCheck,
  Crown,
  KeyRound,
  ArrowRight,
  Sparkles,
  Lock,
  CheckCircle2,
  X,
  LogOut,
  Users,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import { StaffAvatar } from "@/components/shared/StaffAvatar";
import { WeGrowLogo } from "@/components/shared/WeGrowLogo";
import { AppUser } from "@/types";

export const StaffLoginModal: React.FC = () => {
  const {
    users,
    currentStaff,
    isStaffLoggedIn,
    isLoginModalOpen,
    loginStaff,
    closeLoginModal,
  } = useCRM();

  // If user is already logged in and the login modal was not manually opened, do not render
  if (isStaffLoggedIn && !isLoginModalOpen) {
    return null;
  }

  // Currently selected staff on the login screen
  const [selectedUserId, setSelectedUserId] = useState<string>(
    currentStaff?.id || users[3]?.id || users[0]?.id || ""
  );
  const [pinInput, setPinInput] = useState<string>("");
  const [showPin, setShowPin] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const selectedUser = users.find((u) => u.id === selectedUserId) || users[0];

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg("");

    if (!pinInput.trim()) {
      setErrorMsg("Please enter your 4-digit security PIN (Default: 1234 or your custom PIN).");
      return;
    }

    const ok = loginStaff(selectedUserId, pinInput.trim());
    if (!ok) {
      setErrorMsg("Incorrect PIN. Please try again or ask Admin/Owner to reset your PIN to 1234.");
      return;
    }
  };

  // Group staff into categories
  const telecallers = users.filter((u) => u.role === "Telecaller");
  const admins = users.filter((u) => u.role === "Admin");
  const owners = users.filter((u) => u.role === "Owner" || u.role === "Owner / MD");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#071326]/95 backdrop-blur-md overflow-y-auto p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Header Branding */}
        <div className="bg-gradient-to-r from-[#0E1E38] via-[#142B52] to-[#1E3B6E] text-white p-6 sm:p-8 relative">
          {/* Close button only available if someone is already logged in */}
          {isStaffLoggedIn && (
            <button
              onClick={closeLoginModal}
              className="absolute top-5 right-5 text-slate-300 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
              title="Close and resume current session"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-1 rounded-2xl">
                <WeGrowLogo theme="dark" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D5A52B]/20 text-[#D5A52B] text-[11px] font-bold uppercase tracking-wider mb-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Official Staff Authentication</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  WeGrow Telecalling Staff Portal
                </h1>
                <p className="text-xs text-slate-300">
                  Select your caller or management profile to log in to your dedicated desk
                </p>
              </div>
            </div>

            {currentStaff && (
              <div className="self-start sm:self-auto px-3 py-1.5 bg-white/10 border border-white/15 rounded-xl text-right">
                <span className="text-[10px] text-slate-300 block">Previous Caller</span>
                <span className="text-xs font-bold text-[#D5A52B]">{currentStaff.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Content Body: Left Column Staff Selection, Right Column Login Card */}
        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Staff Selector Grid (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Telecallers Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <PhoneCall className="w-4 h-4 text-[#142B52]" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Frontline Telecallers ({telecallers.length})
                </h3>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                  Dialer Workspaces
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {telecallers.map((staff) => {
                  const isSelected = staff.id === selectedUserId;
                  return (
                    <button
                      key={staff.id}
                      type="button"
                      onClick={() => {
                        setSelectedUserId(staff.id);
                        setPinInput("");
                        setErrorMsg("");
                      }}
                      className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#142B52] text-white border-[#142B52] shadow-md ring-2 ring-[#D5A52B]"
                          : "bg-slate-50/80 hover:bg-slate-100/80 border-slate-200 text-slate-800"
                      }`}
                    >
                      <StaffAvatar
                        name={staff.name}
                        avatar={staff.avatar}
                        size="md"
                        ringColor={isSelected ? "ring-2 ring-[#D5A52B]" : ""}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-xs truncate ${isSelected ? "text-white" : "text-slate-900"}`}>
                          {staff.name}
                        </p>
                        <p className={`text-[10px] truncate ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                          {staff.email}
                        </p>
                        <span className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          isSelected ? "bg-white/20 text-[#D5A52B]" : "bg-emerald-50 text-emerald-700"
                        }`}>
                          Telecaller
                        </span>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-[#D5A52B] flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Administrators Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-blue-700" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Branch Administrators ({admins.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {admins.map((staff) => {
                  const isSelected = staff.id === selectedUserId;
                  return (
                    <button
                      key={staff.id}
                      type="button"
                      onClick={() => {
                        setSelectedUserId(staff.id);
                        setPinInput("");
                        setErrorMsg("");
                      }}
                      className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#142B52] text-white border-[#142B52] shadow-md ring-2 ring-[#D5A52B]"
                          : "bg-slate-50/80 hover:bg-slate-100/80 border-slate-200 text-slate-800"
                      }`}
                    >
                      <StaffAvatar
                        name={staff.name}
                        avatar={staff.avatar}
                        size="md"
                        ringColor={isSelected ? "ring-2 ring-[#D5A52B]" : ""}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-xs truncate ${isSelected ? "text-white" : "text-slate-900"}`}>
                          {staff.name}
                        </p>
                        <p className={`text-[10px] truncate ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                          {staff.email}
                        </p>
                        <span className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          isSelected ? "bg-white/20 text-[#D5A52B]" : "bg-blue-50 text-blue-700"
                        }`}>
                          Operations Admin
                        </span>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-[#D5A52B] flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Owner Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Crown className="w-4 h-4 text-purple-700" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Executive Leadership ({owners.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {owners.map((staff) => {
                  const isSelected = staff.id === selectedUserId;
                  return (
                    <button
                      key={staff.id}
                      type="button"
                      onClick={() => {
                        setSelectedUserId(staff.id);
                        setPinInput("");
                        setErrorMsg("");
                      }}
                      className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#142B52] text-white border-[#142B52] shadow-md ring-2 ring-[#D5A52B]"
                          : "bg-slate-50/80 hover:bg-slate-100/80 border-slate-200 text-slate-800"
                      }`}
                    >
                      <StaffAvatar
                        name={staff.name}
                        avatar={staff.avatar}
                        size="md"
                        ringColor={isSelected ? "ring-2 ring-[#D5A52B]" : ""}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-xs truncate ${isSelected ? "text-white" : "text-slate-900"}`}>
                          {staff.name}
                        </p>
                        <p className={`text-[10px] truncate ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                          {staff.email}
                        </p>
                        <span className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          isSelected ? "bg-white/20 text-[#D5A52B]" : "bg-purple-50 text-purple-700"
                        }`}>
                          Owner / Leadership
                        </span>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-[#D5A52B] flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Selected Staff Login Action Card (5 cols) */}
          <form
            onSubmit={handleLogin}
            className="lg:col-span-5 bg-slate-50 rounded-3xl p-6 border border-slate-200 flex flex-col justify-between"
          >
            <div>
              <div className="text-center pb-5 border-b border-slate-200">
                <div className="inline-block relative mb-3">
                  <StaffAvatar
                    name={selectedUser?.name || "Staff"}
                    avatar={selectedUser?.avatar}
                    size="2xl"
                    ringColor="ring-4 ring-[#142B52]"
                  />
                  <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
                <h2 className="text-base font-extrabold text-slate-900">
                  {selectedUser?.name}
                </h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {selectedUser?.email}
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#142B52]/10 text-[#142B52]">
                  {selectedUser?.role} Desk
                </div>
              </div>

              {/* Mandatory 4-Digit Security PIN Section */}
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#142B52]" />
                    <span>Enter 4-Digit Security PIN</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Default: 1234
                  </span>
                </div>

                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPin ? "text" : "password"}
                    maxLength={4}
                    autoFocus
                    placeholder="••••"
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value.replace(/\D/g, ""));
                      setErrorMsg("");
                    }}
                    className="w-full pl-10 pr-10 py-3 bg-white border border-slate-300 rounded-xl text-center font-mono text-xl tracking-[0.3em] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#142B52] shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {errorMsg ? (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs font-medium animate-in fade-in">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                    Enter your PIN to verify identity and unlock your calling desk.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-200 space-y-2">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3.5 px-5 bg-[#142B52] hover:bg-[#1E3B6E] text-white rounded-2xl font-bold text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                <span>Unlock & Enter as {selectedUser?.name}</span>
                <ArrowRight className="w-4 h-4 text-[#D5A52B]" />
              </button>

              <p className="text-[10px] text-slate-400 text-center">
                WeGrow Skill Campus • Dedicated Desk PIN Authentication
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
