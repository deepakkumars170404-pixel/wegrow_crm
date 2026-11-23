"use client";

import React, { useState } from "react";
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  ShieldCheck,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import { StaffAvatar } from "@/components/shared/StaffAvatar";

export const ChangePinModal: React.FC = () => {
  const {
    currentStaff,
    isChangePinModalOpen,
    closeChangePinModal,
    changeStaffPin,
  } = useCRM();

  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showOldPin, setShowOldPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isChangePinModalOpen || !currentStaff) {
    return null;
  }

  const handleClose = () => {
    setOldPin("");
    setNewPin("");
    setConfirmPin("");
    setErrorMsg("");
    setIsSuccess(false);
    closeChangePinModal();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!oldPin.trim()) {
      setErrorMsg("Please enter your current PIN (default: 1234).");
      return;
    }

    if (!/^\d{4}$/.test(newPin.trim())) {
      setErrorMsg("New PIN must be exactly 4 numeric digits.");
      return;
    }

    if (newPin.trim() !== confirmPin.trim()) {
      setErrorMsg("New PIN and Confirm PIN do not match.");
      return;
    }

    if (oldPin.trim() === newPin.trim()) {
      setErrorMsg("New PIN must be different from your current PIN.");
      return;
    }

    const result = changeStaffPin(currentStaff.id, oldPin.trim(), newPin.trim());
    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } else {
      setErrorMsg(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#071326]/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0E1E38] via-[#142B52] to-[#1E3B6E] text-white p-5 sm:p-6 relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-slate-300 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#D5A52B]/20 border border-[#D5A52B]/40 flex items-center justify-center flex-shrink-0">
              <KeyRound className="w-5 h-5 text-[#D5A52B]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#D5A52B]/20 text-[#D5A52B] text-[10px] font-bold uppercase tracking-wider mb-0.5">
                <Sparkles className="w-3 h-3" />
                <span>Security Settings</span>
              </div>
              <h2 className="text-lg font-black text-white">Change Security PIN</h2>
              <p className="text-xs text-slate-300">Set your personal 4-digit desk login PIN</p>
            </div>
          </div>
        </div>

        {/* Current Staff Badge */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StaffAvatar name={currentStaff.name} avatar={currentStaff.avatar} size="sm" />
            <div>
              <div className="text-xs font-bold text-slate-900">{currentStaff.name}</div>
              <div className="text-[11px] text-slate-500 font-medium">{currentStaff.role}</div>
            </div>
          </div>
          <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>Active Desk</span>
          </span>
        </div>

        {/* Form Body */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-3 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900">PIN Changed Successfully!</h3>
            <p className="text-xs text-slate-500">
              Your new 4-digit security PIN is active. Use it for your next shift logins.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Field 1: Current PIN */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Current PIN <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showOldPin ? "text" : "password"}
                  maxLength={4}
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter current PIN (Default: 1234)"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#142B52] focus:bg-white transition-all pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowOldPin(!showOldPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                >
                  {showOldPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Default is 1234 if you haven't set a custom PIN.</p>
            </div>

            {/* Field 2: New 4-Digit PIN */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                New 4-Digit PIN <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPin ? "text" : "password"}
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 5824"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#142B52] focus:bg-white transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPin(!showNewPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                >
                  {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Choose a private 4-digit number only you know.</p>
            </div>

            {/* Field 3: Confirm New PIN */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Confirm New PIN <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPin ? "text" : "password"}
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="Re-enter new PIN"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#142B52] focus:bg-white transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPin(!showConfirmPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                >
                  {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold text-white bg-[#142B52] hover:bg-[#1E3B6E] rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-[#D5A52B]" />
                <span>Save New PIN</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
