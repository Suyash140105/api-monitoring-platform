import React from "react";
import { useAuth } from "../context/AuthContext";
import {
  User,
  Mail,
  Shield,
  Key,
  LogOut,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Lock,
  Info,
} from "lucide-react";

export default function Settings() {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-4xl">
        <div className="bg-card border border-border rounded-xl p-16 flex flex-col items-center justify-center text-zinc-400 space-y-3">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Loading account settings...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 space-y-6 max-w-4xl">
        <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl space-y-4 text-red-400">
          <div className="flex items-center gap-3">
            <AlertCircle size={22} className="shrink-0" />
            <div>
              <h2 className="text-base font-semibold text-white">
                Account Information Unavailable
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Your user session could not be verified or has expired.
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="bg-white text-black hover:bg-zinc-200 px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Active Session";

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <div className="p-8 space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Manage your account profile and view security details.
        </p>
      </div>

      {/* Account Section */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <User size={18} className="text-zinc-400" />
            <h2 className="text-base font-semibold text-white">Account Profile</h2>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
            Authenticated
          </span>
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-accent/80 border border-border flex items-center justify-center text-white font-bold text-lg shadow-sm">
            {initials}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{user.name}</h3>
            <p className="text-sm text-zinc-400">{user.email}</p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="bg-accent/30 border border-border/80 rounded-lg p-4 space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-400">
              <User size={14} />
              <span>Full Name</span>
            </div>
            <p className="text-sm font-medium text-white pt-1">{user.name}</p>
          </div>

          <div className="bg-accent/30 border border-border/80 rounded-lg p-4 space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-400">
              <Mail size={14} />
              <span>Email Address</span>
            </div>
            <p className="text-sm font-medium text-white pt-1">{user.email}</p>
          </div>

          <div className="bg-accent/30 border border-border/80 rounded-lg p-4 space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-400">
              <CheckCircle2 size={14} />
              <span>Account Status</span>
            </div>
            <p className="text-sm font-medium text-green-400 pt-1">Active</p>
          </div>

          <div className="bg-accent/30 border border-border/80 rounded-lg p-4 space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-400">
              <Calendar size={14} />
              <span>Member Since</span>
            </div>
            <p className="text-sm font-medium text-white pt-1">{memberSince}</p>
          </div>
        </div>

        {/* Logout Action */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h4 className="text-sm font-semibold text-white">Log Out of PulseMonitor</h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              End your current authenticated session and return to the login screen.
            </p>
          </div>
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 bg-red-600/15 hover:bg-red-600/25 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            <LogOut size={16} />
            <span>Log out</span>
          </button>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <Shield size={18} className="text-zinc-400" />
          <h2 className="text-base font-semibold text-white">Security & Session</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-accent/20 border border-border/60 rounded-lg p-4">
            <Key size={18} className="text-zinc-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white">JSON Web Token (JWT) Authentication</p>
              <p className="text-xs text-zinc-400 mt-1">
                Requests to protected API routes are authorized using an HMAC-SHA256 signed bearer token stored in your browser session.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-accent/20 border border-border/60 rounded-lg p-4">
            <Lock size={18} className="text-zinc-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white">Bcrypt Password Hashing</p>
              <p className="text-xs text-zinc-400 mt-1">
                Your password is protected using a salted one-way hash algorithm and is never stored or transmitted in plain text.
              </p>
            </div>
          </div>

          {/* Password Changes Notice */}
          <div className="flex items-start gap-3 bg-zinc-900/60 border border-border rounded-lg p-4 text-zinc-300">
            <Info size={18} className="text-zinc-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-zinc-200">Credential Updates</p>
              <p className="text-xs text-zinc-400 mt-1">
                Password changes are not currently available.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}