import React from "react";

export default function MonitorModal({
  isOpen,
  editingMonitor,
  name,
  setName,
  url,
  setUrl,
  checkInterval,
  setCheckInterval,
  onClose,
  onSubmit,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border w-full max-w-md rounded-xl p-6 space-y-4">
        <h2 className="text-xl font-bold">
          {editingMonitor
            ? "Edit Monitor"
            : "Add New Monitor"}
        </h2>

        <div className="space-y-4">
          {/* API NAME */}
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">
              API Name
            </label>

            <input
              className="w-full bg-accent/50 border border-border rounded-md p-2"
              placeholder="e.g. Payment API"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
            />
          </div>

          {/* URL */}
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">
              URL
            </label>

            <input
              className="w-full bg-accent/50 border border-border rounded-md p-2"
              placeholder="https://api.domain.com/v1"
              value={url}
              onChange={(e) =>
                setUrl(e.target.value)
              }
            />
          </div>

          {/* INTERVAL */}
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">
              Check Interval
            </label>

            <select
              className="w-full bg-accent/50 border border-border rounded-md p-2"
              value={checkInterval}
              onChange={(e) =>
                setCheckInterval(e.target.value)
              }
            >
              <option value="1">
                Every 1 minute
              </option>

              <option value="5">
                Every 5 minutes
              </option>

              <option value="15">
                Every 15 minutes
              </option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-accent hover:bg-zinc-800 rounded-md"
          >
            Cancel
          </button>

          <button
            onClick={onSubmit}
            className="flex-1 px-4 py-2 bg-white text-black rounded-md font-bold"
          >
            {editingMonitor
              ? "Save Changes"
              : "Create Monitor"}
          </button>
        </div>
      </div>
    </div>
  );
}