import React, { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Search, User, Plus, LogOut, CheckCircle2, AlertTriangle, Check, BellOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../config";

function formatTimeAgo(dateString) {
  if (!dateString) return "";
  const now = Date.now();
  const past = new Date(dateString).getTime();
  const diffSec = Math.max(0, Math.floor((now - past) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function Header({
  onAddClick,
  searchTerm,
  setSearchTerm,
}) {
  const { user, logout, authFetch } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);

  const fetchNotifications = useCallback(
    async (isBackground = false) => {
      if (!isBackground) setIsLoading(true);
      setError(null);
      try {
        const response = await authFetch(`${API_URL}/api/notifications`);
        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
        } else if (response.status !== 401) {
          throw new Error("Failed to load notifications");
        }
      } catch (err) {
        console.error("Error loading notifications:", err);
        setError("Could not load notifications");
      } finally {
        if (!isBackground) setIsLoading(false);
      }
    },
    [authFetch]
  );

  useEffect(() => {
    fetchNotifications();

    // 30 second polling interval
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id) => {
    try {
      const response = await authFetch(`${API_URL}/api/notifications/${id}/read`, {
        method: "PATCH",
      });
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await authFetch(`${API_URL}/api/notifications/read-all`, {
        method: "PATCH",
      });
      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10 px-8 flex items-center justify-between">
      <div className="relative w-96">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          size={18}
        />

        <input
          className="w-full bg-accent/50 border border-border rounded-md py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500 text-zinc-200 placeholder-zinc-500"
          placeholder="Search APIs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onAddClick}
          className="bg-white text-black hover:bg-zinc-200 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 cursor-pointer"
        >
          <Plus size={16} />
          Add Monitor
        </button>

        {/* Notification Bell Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-accent/50 transition-colors relative cursor-pointer"
            title="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Panel */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Header */}
              <div className="p-3.5 px-4 border-b border-border flex items-center justify-between bg-accent/30">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Check size={12} />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-[380px] overflow-y-auto divide-y divide-border/60">
                {isLoading && notifications.length === 0 ? (
                  <div className="p-8 text-center text-zinc-400 text-xs">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading notifications...
                  </div>
                ) : error ? (
                  <div className="p-6 text-center text-red-400 text-xs">{error}</div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-zinc-400 space-y-2">
                    <BellOff size={28} className="mx-auto text-zinc-600 mb-1" />
                    <p className="text-xs font-medium text-zinc-300">No notifications yet</p>
                    <p className="text-[11px] text-zinc-500">
                      You'll be notified here when an API goes down or recovers.
                    </p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const isDown = n.type === "INCIDENT_OPENED";
                    return (
                      <div
                        key={n.id}
                        onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                        className={`p-3.5 px-4 transition-colors cursor-pointer flex items-start gap-3 ${
                          n.isRead
                            ? "hover:bg-accent/20 opacity-70"
                            : "bg-accent/30 hover:bg-accent/50"
                        }`}
                      >
                        <div
                          className={`mt-0.5 h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                            isDown
                              ? "bg-red-500/15 text-red-400 border border-red-500/30"
                              : "bg-green-500/15 text-green-400 border border-green-500/30"
                          }`}
                        >
                          {isDown ? (
                            <AlertTriangle size={14} />
                          ) : (
                            <CheckCircle2 size={14} />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className={`text-xs font-semibold truncate ${
                                isDown ? "text-red-400" : "text-green-400"
                              }`}
                            >
                              {n.title}
                            </p>
                            <span className="text-[10px] text-zinc-500 shrink-0">
                              {formatTimeAgo(n.createdAt)}
                            </span>
                          </div>

                          <p className="text-xs text-zinc-300 mt-0.5 truncate">
                            {n.message}
                          </p>
                        </div>

                        {!n.isRead && (
                          <span
                            className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2"
                            title="Unread"
                          ></span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {user && (
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <div className="h-8 w-8 rounded-full bg-zinc-800 border border-border flex items-center justify-center text-zinc-400">
              <User size={18} />
            </div>
            <span className="hidden md:inline font-medium text-xs">
              {user.name || user.email}
            </span>
          </div>
        )}

        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white bg-accent/40 hover:bg-accent border border-border px-3 py-1.5 rounded-md transition-colors cursor-pointer"
          title="Sign Out"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}