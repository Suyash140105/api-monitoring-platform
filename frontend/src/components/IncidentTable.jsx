import React from "react";

export default function IncidentTable({ incidents }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold">
          Incidents
        </h3>
      </div>

      <table className="w-full text-left">
        <thead className="bg-accent/50 text-zinc-400 text-xs uppercase font-medium">
          <tr>
            <th className="px-6 py-4">
              API
            </th>

            <th className="px-6 py-4">
              Started
            </th>

            <th className="px-6 py-4">
              Recovered
            </th>

            <th className="px-6 py-4">
              Status
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {incidents.length === 0 ? (
            <tr>
              <td
                colSpan="4"
                className="px-6 py-8 text-center text-zinc-500"
              >
                No incidents recorded
              </td>
            </tr>
          ) : (
            incidents.map((incident) => (
              <tr
                key={incident.id}
                className="hover:bg-accent/30 transition-colors"
              >
                <td className="px-6 py-4 font-medium">
                  {incident.monitorName}
                </td>

                <td className="px-6 py-4 text-sm text-zinc-500">
                  {incident.startedAt
                    ? new Date(
                        incident.startedAt
                      ).toLocaleString()
                    : "-"}
                </td>

                <td className="px-6 py-4 text-sm text-zinc-500">
                  {incident.resolvedAt
                    ? new Date(
                        incident.resolvedAt
                      ).toLocaleString()
                    : "-"}
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      incident.status === "Open"
                        ? "bg-red-500/10 text-red-500"
                        : "bg-green-500/10 text-green-500"
                    }`}
                  >
                    {incident.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}