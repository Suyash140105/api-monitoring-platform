import React from "react";
import { ShieldCheck, Clock } from "lucide-react";

export function formatDuration(startedAt, resolvedAt) {
  if (!startedAt) return "—";
  const start = new Date(startedAt).getTime();
  const end = resolvedAt ? new Date(resolvedAt).getTime() : Date.now();
  const diffMs = Math.max(0, end - start);
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) {
    return `${diffSec}s${!resolvedAt ? " (ongoing)" : ""}`;
  }
  const minutes = Math.floor(diffSec / 60);
  const remSec = diffSec % 60;
  if (minutes < 60) {
    return `${minutes}m ${remSec}s${!resolvedAt ? " (ongoing)" : ""}`;
  }
  const hours = Math.floor(minutes / 60);
  const remMin = minutes % 60;
  if (hours < 24) {
    return `${hours}h ${remMin}m${!resolvedAt ? " (ongoing)" : ""}`;
  }
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return `${days}d ${remHours}h${!resolvedAt ? " (ongoing)" : ""}`;
}

export default function IncidentTable({ incidents = [] }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Incidents
        </h3>
        <span className="text-xs text-zinc-400">
          {incidents.length} {incidents.length === 1 ? "incident" : "incidents"} recorded
        </span>
      </div>

      {incidents.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 mb-3">
            <ShieldCheck size={24} />
          </div>
          <p className="font-medium text-white">No incidents recorded</p>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm">
            All monitored services are operating smoothly without any recorded downtime.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-accent/50 text-zinc-400 text-xs uppercase font-medium">
              <tr>
                <th className="px-6 py-4">API</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Started</th>
                <th className="px-6 py-4">Recovered</th>
                <th className="px-6 py-4">Duration</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {incidents.map((incident) => {
                const isOpen = incident.status === "Open";
                return (
                  <tr
                    key={incident.id}
                    className={`transition-colors ${
                      isOpen
                        ? "bg-red-500/[0.03] hover:bg-red-500/[0.07]"
                        : "hover:bg-accent/30"
                    }`}
                  >
                    <td className="px-6 py-4 font-medium text-white">
                      {incident.monitorName}
                    </td>

                    <td className="px-6 py-4">
                      {isOpen ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-red-500/15 text-red-400 border border-red-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
                          Open
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-green-500/15 text-green-400 border border-green-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                          Resolved
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-sm text-zinc-400 whitespace-nowrap">
                      {incident.startedAt
                        ? new Date(incident.startedAt).toLocaleString()
                        : "—"}
                    </td>

                    <td className="px-6 py-4 text-sm text-zinc-400 whitespace-nowrap">
                      {incident.resolvedAt
                        ? new Date(incident.resolvedAt).toLocaleString()
                        : "—"}
                    </td>

                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 ${
                          isOpen ? "text-red-300 font-medium" : "text-zinc-300"
                        }`}
                      >
                        <Clock size={14} className="text-zinc-500" />
                        {formatDuration(incident.startedAt, incident.resolvedAt)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}