import React from "react";

export default function MonitorTable({
  monitors,
  onEdit,
  onDelete,
  onPause,
}) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-accent/50 text-zinc-400 text-xs uppercase font-medium">
          <tr>
            <th className="px-6 py-4">
              API Name
            </th>

            <th className="px-6 py-4">
              Status
            </th>

            <th className="px-6 py-4">
              Response Time
            </th>

            <th className="px-6 py-4">
              Uptime %
            </th>

            <th className="px-6 py-4">
              Last Checked
            </th>

            <th className="px-6 py-4">
              Action
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {monitors.map((m) => (
            <tr
              key={m.id}
              className="hover:bg-accent/30 transition-colors"
            >
              <td className="px-6 py-4">
                <div className="font-medium">
                  {m.name}
                </div>

                <div className="text-xs text-zinc-500">
                  {m.url}
                </div>
              </td>

              <td className="px-6 py-4">
                <span
                  className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                    m.isPaused
                      ? "bg-yellow-500/10 text-yellow-500"
                      : m.status === "Healthy"
                      ? "bg-green-500/10 text-green-500"
                      : "bg-red-500/10 text-red-500"
                  }`}
                >
                  {m.isPaused ? "Paused" : m.status}
                </span>
              </td>

              <td className="px-6 py-4 text-sm text-zinc-300">
                {m.responseTime !== null &&
                m.responseTime !== undefined
                  ? `${m.responseTime} ms`
                  : "-"}
              </td>

              <td className="px-6 py-4 text-sm text-zinc-300">
                {m.uptime}%
              </td>

              <td className="px-6 py-4 text-sm text-zinc-500">
                {m.lastChecked
                  ? new Date(
                      m.lastChecked
                    ).toLocaleString()
                  : "-"}
              </td>

              <td className="px-6 py-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(m)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => onDelete(m.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>

                  <button
                    onClick={() => onPause(m.id)}
                    className={`px-3 py-1 rounded text-white ${
                      m.isPaused
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-yellow-600 hover:bg-yellow-700"
                    }`}
                  >
                    {m.isPaused ? "Resume" : "Pause"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}