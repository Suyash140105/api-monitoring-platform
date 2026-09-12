import React, { useEffect, useState, useCallback, useMemo } from "react";
import { API_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Server,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Activity,
  RefreshCw,
  AlertCircle,
  ChevronDown,
} from "lucide-react";

export default function Analytics() {
  const { authFetch } = useAuth();
  const [data, setData] = useState({
    overview: {
      totalMonitors: 0,
      overallUptime: 0,
      totalChecks: 0,
      successChecks: 0,
      failedChecks: 0,
      avgResponseTime: 0,
    },
    latencySeries: [],
    monitorPerformance: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMonitor, setSelectedMonitor] = useState("ALL");

  const fetchAnalytics = useCallback(
    async (isBackground = false) => {
      if (!isBackground) {
        setIsRefreshing(true);
      }
      setError(null);

      try {
        const response = await authFetch(`${API_URL}/api/analytics`);
        if (!response.ok) {
          throw new Error(`Failed to load analytics (HTTP ${response.status})`);
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError(err.message || "Failed to load analytics data.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [authFetch]
  );

  useEffect(() => {
    fetchAnalytics();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchAnalytics(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  // Filter latency data by selected monitor
  const filteredLatencyData = useMemo(() => {
    if (!data.latencySeries || data.latencySeries.length === 0) return [];
    if (selectedMonitor === "ALL") {
      return data.latencySeries;
    }
    return data.latencySeries.filter(
      (point) => point.monitorId === Number(selectedMonitor)
    );
  }, [data.latencySeries, selectedMonitor]);

  const { overview, monitorPerformance } = data;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Real-time performance metrics, uptime calculations, and latency distributions.
          </p>
        </div>

        <button
          onClick={() => fetchAnalytics(false)}
          disabled={isRefreshing || isLoading}
          className="self-start sm:self-auto bg-card hover:bg-accent border border-border text-zinc-300 hover:text-white px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
          title="Refresh analytics"
        >
          <RefreshCw
            size={16}
            className={isRefreshing ? "animate-spin text-zinc-400" : "text-zinc-400"}
          />
          <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between text-red-400 text-sm">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchAnalytics(false)}
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
          <p className="text-sm font-medium">Loading performance analytics...</p>
        </div>
      ) : (
        <>
          {/* Overview Metrics Cards */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-3">
              Analytics Overview
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* Total Monitors */}
              <div className="bg-card border border-border p-5 rounded-xl flex flex-col justify-between shadow-sm">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-xs font-medium uppercase tracking-wider">
                    Total Monitors
                  </span>
                  <Server size={18} />
                </div>
                <div className="text-2xl font-bold text-white mt-2">
                  {overview.totalMonitors}
                </div>
              </div>

              {/* Overall Uptime */}
              <div className="bg-card border border-border p-5 rounded-xl flex flex-col justify-between shadow-sm">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-xs font-medium uppercase tracking-wider">
                    Overall Uptime
                  </span>
                  <CheckCircle2 size={18} className="text-green-500" />
                </div>
                <div className="text-2xl font-bold text-green-400 mt-2">
                  {overview.overallUptime}%
                </div>
              </div>

              {/* Total Checks */}
              <div className="bg-card border border-border p-5 rounded-xl flex flex-col justify-between shadow-sm">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-xs font-medium uppercase tracking-wider">
                    Total Checks
                  </span>
                  <Activity size={18} />
                </div>
                <div className="text-2xl font-bold text-white mt-2">
                  {overview.totalChecks}
                </div>
              </div>

              {/* Successful Checks */}
              <div className="bg-card border border-border p-5 rounded-xl flex flex-col justify-between shadow-sm">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-xs font-medium uppercase tracking-wider">
                    Successful Checks
                  </span>
                  <CheckCircle2 size={18} className="text-green-500" />
                </div>
                <div className="text-2xl font-bold text-white mt-2">
                  {overview.successChecks}
                </div>
              </div>

              {/* Failed Checks */}
              <div className="bg-card border border-border p-5 rounded-xl flex flex-col justify-between shadow-sm">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-xs font-medium uppercase tracking-wider">
                    Failed Checks
                  </span>
                  <XCircle
                    size={18}
                    className={overview.failedChecks > 0 ? "text-red-500" : "text-zinc-500"}
                  />
                </div>
                <div
                  className={`text-2xl font-bold mt-2 ${
                    overview.failedChecks > 0 ? "text-red-400" : "text-zinc-300"
                  }`}
                >
                  {overview.failedChecks}
                </div>
              </div>

              {/* Average Response Time */}
              <div className="bg-card border border-border p-5 rounded-xl flex flex-col justify-between shadow-sm">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-xs font-medium uppercase tracking-wider">
                    Avg Response Time
                  </span>
                  <Zap size={18} className="text-yellow-400" />
                </div>
                <div className="text-2xl font-bold text-white mt-2">
                  {overview.avgResponseTime} ms
                </div>
              </div>
            </div>
          </div>

          {/* Latency Chart Section */}
          <div className="bg-card border border-border p-6 rounded-xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Recent Latency</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Chronological response time from check logs
                </p>
              </div>

              {/* Monitor Filter Dropdown */}
              {monitorPerformance && monitorPerformance.length > 0 && (
                <div className="relative inline-block">
                  <select
                    value={selectedMonitor}
                    onChange={(e) => setSelectedMonitor(e.target.value)}
                    className="bg-accent/70 border border-border text-xs text-zinc-200 py-1.5 pl-3 pr-8 rounded-lg appearance-none cursor-pointer focus:outline-none focus:border-zinc-500"
                  >
                    <option value="ALL">All Monitors</option>
                    {monitorPerformance.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                  />
                </div>
              )}
            </div>

            {/* Recharts Chart or Empty State */}
            {filteredLatencyData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[280px] text-zinc-400 space-y-2 border border-dashed border-border rounded-lg bg-zinc-950/40">
                <Clock size={32} className="text-zinc-500 mb-1" />
                <p className="text-sm font-semibold text-zinc-300">
                  Not enough monitoring data yet
                </p>
                <p className="text-xs text-zinc-500 text-center max-w-sm">
                  Latency data will populate automatically as health checks are executed.
                </p>
              </div>
            ) : (
              <div className="h-[280px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={filteredLatencyData}
                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffffff" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#ffffff" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#27272a"
                    />

                    <XAxis
                      dataKey="time"
                      stroke="#71717a"
                      fontSize={11}
                      tickLine={false}
                    />

                    <YAxis
                      stroke="#71717a"
                      fontSize={11}
                      tickLine={false}
                      unit="ms"
                    />

                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="bg-zinc-900 border border-zinc-700 p-3 rounded-lg shadow-xl text-xs space-y-1.5">
                              <p className="font-semibold text-white">{item.monitorName}</p>
                              <p className="text-zinc-400">Time: {item.time}</p>
                              <p className="text-zinc-200">
                                Latency:{" "}
                                <span className="font-mono font-semibold text-white">
                                  {item.latency !== null ? `${item.latency} ms` : "Failed / Timeout"}
                                </span>
                              </p>
                              <div className="flex items-center gap-1.5 pt-0.5">
                                <span
                                  className={`inline-block w-2 h-2 rounded-full ${
                                    item.status === "Healthy"
                                      ? "bg-green-500"
                                      : "bg-red-500"
                                  }`}
                                />
                                <span className="text-zinc-300">{item.status}</span>
                                {item.statusCode && (
                                  <span className="text-zinc-500">
                                    (HTTP {item.statusCode})
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />

                    <Area
                      type="monotone"
                      dataKey="latency"
                      stroke="#ffffff"
                      strokeWidth={1.5}
                      fillOpacity={1}
                      fill="url(#latencyGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Monitor Performance Section */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-white">Monitor Performance</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Detailed uptime and response time metrics broken down by service
              </p>
            </div>

            {monitorPerformance.length === 0 ? (
              <div className="p-12 text-center text-zinc-400 space-y-2">
                <Server size={32} className="mx-auto text-zinc-500 mb-1" />
                <p className="text-sm font-semibold text-zinc-300">No monitors configured</p>
                <p className="text-xs text-zinc-500">
                  Add monitors from the Dashboard to start tracking per-service performance.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-accent/40 text-zinc-400 text-xs uppercase font-medium">
                    <tr>
                      <th className="px-6 py-3.5">Monitor Name</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Uptime %</th>
                      <th className="px-6 py-3.5">Avg Latency</th>
                      <th className="px-6 py-3.5">Total Checks</th>
                      <th className="px-6 py-3.5">Failed Checks</th>
                      <th className="px-6 py-3.5">Last Checked</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {monitorPerformance.map((monitor) => (
                      <tr key={monitor.id} className="hover:bg-accent/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-white">{monitor.name}</div>
                          <div className="text-xs text-zinc-500 font-mono truncate max-w-xs">
                            {monitor.url}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              monitor.isPaused
                                ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                                : monitor.status === "Healthy"
                                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}
                          >
                            {monitor.isPaused ? "Paused" : monitor.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 font-mono text-zinc-200">
                          {monitor.uptime}%
                        </td>

                        <td className="px-6 py-4 text-zinc-300">
                          {monitor.avgResponseTime > 0
                            ? `${monitor.avgResponseTime} ms`
                            : "—"}
                        </td>

                        <td className="px-6 py-4 text-zinc-300">
                          {monitor.totalChecks}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={
                              monitor.failedChecks > 0
                                ? "text-red-400 font-semibold"
                                : "text-zinc-400"
                            }
                          >
                            {monitor.failedChecks}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-xs text-zinc-400">
                          {monitor.lastChecked
                            ? new Date(monitor.lastChecked).toLocaleString()
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}