import React, { useEffect, useState, useCallback } from "react";
import IncidentTable from "../components/IncidentTable";
import { API_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import { RefreshCw, AlertCircle, AlertTriangle, CheckCircle2, Flame } from "lucide-react";

export default function Incidents() {
  const { authFetch } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchIncidents = useCallback(
    async (isBackground = false) => {
      if (!isBackground) {
        setIsRefreshing(true);
      }
      setError(null);

      try {
        const response = await authFetch(`${API_URL}/api/incidents`);
        if (!response.ok) {
          throw new Error(`Failed to fetch incidents (HTTP ${response.status})`);
        }
        const data = await response.json();
        setIncidents(data);
      } catch (err) {
        console.error("Error fetching incidents:", err);
        setError(err.message || "Failed to load incidents. Please check your connection.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [authFetch]
  );

  useEffect(() => {
    fetchIncidents();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchIncidents(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchIncidents]);

  // Derived metrics
  const totalCount = incidents.length;
  const openCount = incidents.filter((i) => i.status === "Open").length;
  const resolvedCount = incidents.filter((i) => i.status === "Resolved").length;

  const filteredIncidents = incidents.filter((incident) => {
    if (statusFilter === "Open") return incident.status === "Open";
    if (statusFilter === "Resolved") return incident.status === "Resolved";
    return true;
  });

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Incidents</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Historical record and live status of outages across your monitored services.
          </p>
        </div>

        <button
          onClick={() => fetchIncidents(false)}
          disabled={isRefreshing || isLoading}
          className="self-start sm:self-auto bg-card hover:bg-accent border border-border text-zinc-300 hover:text-white px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
          title="Refresh incidents"
        >
          <RefreshCw
            size={16}
            className={isRefreshing ? "animate-spin text-zinc-400" : "text-zinc-400"}
          />
          <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border p-5 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
              Total Incidents
            </p>
            <p className="text-2xl font-bold text-white mt-1">{totalCount}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-zinc-800/80 border border-border flex items-center justify-center text-zinc-400">
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
              Active Outages
            </p>
            <p
              className={`text-2xl font-bold mt-1 ${
                openCount > 0 ? "text-red-400" : "text-zinc-300"
              }`}
            >
              {openCount}
            </p>
          </div>
          <div
            className={`h-10 w-10 rounded-lg border flex items-center justify-center ${
              openCount > 0
                ? "bg-red-500/15 border-red-500/30 text-red-400"
                : "bg-zinc-800/80 border-border text-zinc-400"
            }`}
          >
            <Flame size={20} className={openCount > 0 ? "animate-pulse" : ""} />
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
              Resolved Incidents
            </p>
            <p className="text-2xl font-bold text-white mt-1">{resolvedCount}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setStatusFilter("All")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            statusFilter === "All"
              ? "bg-white text-black font-semibold"
              : "bg-card border border-border text-zinc-400 hover:text-white"
          }`}
        >
          All ({totalCount})
        </button>

        <button
          onClick={() => setStatusFilter("Open")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
            statusFilter === "Open"
              ? "bg-red-600 text-white font-semibold"
              : "bg-card border border-border text-zinc-400 hover:text-white"
          }`}
        >
          {openCount > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
          )}
          Open ({openCount})
        </button>

        <button
          onClick={() => setStatusFilter("Resolved")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            statusFilter === "Resolved"
              ? "bg-green-600 text-white font-semibold"
              : "bg-card border border-border text-zinc-400 hover:text-white"
          }`}
        >
          Resolved ({resolvedCount})
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between text-red-400 text-sm">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchIncidents(false)}
            className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-1.5 rounded-md font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="bg-card border border-border rounded-xl p-16 flex flex-col items-center justify-center text-zinc-400 space-y-3">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Loading incidents...</p>
        </div>
      ) : (
        <IncidentTable incidents={filteredIncidents} />
      )}
    </div>
  );
}