"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  UserPlus,
  Shield,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  Sparkles,
  Users,
  Lock,
} from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import { AppUser } from "@/types";

export default function UsersRolesPage() {
  const {
    users,
    addUser,
    updateUserRole,
    toggleUserStatus,
    activeUserRole,
    setActiveUserRole,
  } = useCRM();

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  // New user form state
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserRole, setNewUserRole] = useState<AppUser["role"]>("Telecaller");

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    addUser({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      phone: newUserPhone.trim() || "+91 98000 00000",
      role: newUserRole,
      status: "Active",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    });

    setNewUserName("");
    setNewUserEmail("");
    setNewUserPhone("");
    setIsAddUserModalOpen(false);
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    updateUserRole(editingUser.id, editingUser.role);
    setEditingUser(null);
  };

  // Role permissions matrix - 3 Roles: Owner, Admin, Telecaller
  const rolePermissions = [
    {
      role: "Owner",
      desc: "Institution Owner with executive revenue oversight, campus P&L analytics, and strategic branch-wide reporting.",
      canAccessAllLeads: "Yes (All Campuses)",
      canViewRevenue: "Yes (₹43.25L Revenue)",
      canAssignLeads: "Oversight",
      canManageUsers: "Full Privilege",
      callingDeskAccess: "Executive Audit",
    },
    {
      role: "Admin",
      desc: "Operations administrator in charge of user invitations, data imports, system settings, and syllabus library configurations.",
      canAccessAllLeads: "Yes",
      canViewRevenue: "Aggregated Metrics",
      canAssignLeads: "Yes",
      canManageUsers: "Yes",
      callingDeskAccess: "Full Access",
    },
    {
      role: "Telecaller",
      desc: "Frontline student counsellor working on assigned call queues, follow-ups, disposition logging, and WhatsApp engagement.",
      canAccessAllLeads: "All Leads & Assigned Leads",
      canViewRevenue: "No",
      canAssignLeads: "Self / Queue",
      canManageUsers: "No",
      callingDeskAccess: "Dedicated Dialer",
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">
              Users & Role Permissions
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#142B52]/10 text-[#142B52]">
              {users.length} Active Staff Members
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Role-based access control (RBAC), telecaller assignments, and team security privileges
          </p>
        </div>

        <button
          onClick={() => setIsAddUserModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#142B52] hover:bg-[#1E3B6E] text-white rounded-xl text-xs font-bold transition-colors shadow-sm self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4 text-[#D5A52B]" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Role-Based Dashboard Preview Selector */}
      <div className="bg-[#142B52] text-white rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D5A52B] mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Role Permission Preview</span>
            </div>
            <h3 className="text-base font-bold text-white">
              Currently simulating CRM interface as:{" "}
              <span className="text-[#D5A52B]">{activeUserRole}</span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Switch roles instantly to preview customized dashboards and navigation permissions
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["Owner", "Admin", "Telecaller"] as const).map(
              (role) => {
                const isActive = (role === "Owner" && (activeUserRole === "Owner" || activeUserRole === "Owner / MD")) || activeUserRole === role;
                return (
                  <button
                    key={role}
                    onClick={() => setActiveUserRole(role)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? "bg-[#D5A52B] text-[#142B52] shadow-md"
                        : "bg-white/10 text-slate-300 hover:text-white hover:bg-white/20"
                    }`}
                  >
                    {role}
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Selected Role Matrix Highlight (3 Columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          {rolePermissions.map((rp) => {
            const isMatch = (rp.role === "Owner" && (activeUserRole === "Owner" || activeUserRole === "Owner / MD")) || activeUserRole === rp.role;
            return (
              <div
                key={rp.role}
                className={`p-3.5 rounded-xl border transition-all ${
                  isMatch
                    ? "bg-white/15 border-[#D5A52B] ring-1 ring-[#D5A52B]"
                    : "bg-white/5 border-white/10 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-white">{rp.role}</span>
                  {isMatch && (
                    <span className="text-[10px] bg-[#D5A52B] text-[#142B52] font-bold px-1.5 py-0.2 rounded">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-300 line-clamp-2 mb-2 leading-relaxed">
                  {rp.desc}
                </p>
                <div className="text-[10px] space-y-1 pt-2 border-t border-white/10">
                  <div>Leads Scope: <strong className="text-white">{rp.canAccessAllLeads}</strong></div>
                  <div>Revenue View: <strong className="text-white">{rp.canViewRevenue}</strong></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-soft overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900">
            Registered CRM Staff & Counsellor Accounts
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">User Name</th>
                <th className="py-3 px-4">Email & Phone</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Assigned Leads</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100"
                      />
                      <div>
                        <p className="font-bold text-slate-900">{u.name}</p>
                        <span className="text-[10px] text-slate-400">
                          Last active: {u.lastActive}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <p className="text-slate-800 font-medium">{u.email}</p>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {u.phone}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        u.role === "Owner" || u.role === "Owner / MD"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : u.role === "Admin"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      {u.role === "Owner / MD" ? "Owner" : u.role}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    {u.assignedLeads} leads
                  </td>

                  <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                    {u.joinedDate}
                  </td>

                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => toggleUserStatus(u.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all ${
                        u.status === "Active"
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          u.status === "Active" ? "bg-emerald-500" : "bg-rose-500"
                        }`}
                      />
                      <span>{u.status}</span>
                    </button>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setEditingUser(u)}
                        title="Edit User Role"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-[#142B52] text-white">
              <h3 className="font-bold text-sm">Add New Staff Member</h3>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kulkarni"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Official Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="ramesh.k@wegrow.edu"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+91 98450 12345"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Assigned CRM Role
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-xl bg-white"
                >
                  <option value="Telecaller">Telecaller (Dialer Workspace)</option>
                  <option value="Admin">Admin (Full Operations Control)</option>
                  <option value="Owner">Owner (Executive Overview)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#142B52] hover:bg-[#1E3B6E] text-white rounded-xl font-bold"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-[#142B52] text-white">
              <h3 className="font-bold text-sm">Edit User Privileges</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="p-6 space-y-4 text-xs">
              <p className="font-bold text-slate-900 text-sm">{editingUser.name}</p>
              <p className="text-slate-500 font-mono">{editingUser.email}</p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Update Role
                </label>
                <select
                  value={editingUser.role === "Owner / MD" ? "Owner" : editingUser.role}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, role: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border rounded-xl bg-white"
                >
                  <option value="Telecaller">Telecaller</option>
                  <option value="Admin">Admin</option>
                  <option value="Owner">Owner</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#142B52] hover:bg-[#1E3B6E] text-white rounded-xl font-bold"
                >
                  Save Privileges
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

