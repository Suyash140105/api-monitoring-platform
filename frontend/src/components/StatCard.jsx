import React from "react";

export default function StatCard({ title, value, icon }) {
  return (
    <div className="bg-card border border-border p-6 rounded-xl space-y-2">
      <div className="flex justify-between items-center text-zinc-400">
        <span className="text-xs font-medium uppercase tracking-wider">
          {title}
        </span>

        {icon}
      </div>

      <div className="text-2xl font-bold tracking-tight">
        {value}
      </div>
    </div>
  );
}