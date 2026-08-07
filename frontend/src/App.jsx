import React, { useState,useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
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
  CheckCircle2,
  XCircle,
  Clock,
  Server,
} from "lucide-react";




export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Add Monitor form state
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
 const [checkInterval, setCheckInterval] = useState("5");
 const [editingMonitor, setEditingMonitor] = useState(null);
  const [monitors, setMonitors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
const filteredMonitors = monitors.filter((monitor) => {
  const matchesSearch = monitor.name
    .toLowerCase()
    .includes(searchTerm.toLowerCase());

  const matchesStatus =
    statusFilter === "All" ||
    monitor.status === statusFilter;

  return matchesSearch && matchesStatus;
});
  const totalApis = monitors.length;

const healthyApis = monitors.filter(
  (m) => m.status === "Healthy"
).length;

const downApis = monitors.filter(
  (m) => m.status === "Down"
).length;

const avgLatency =
  monitors.length > 0
    ? Math.round(
        monitors.reduce(
          (sum, m) => sum + (m.responseTime || 0),
          0
        ) / monitors.length
      )
    : 0;
  const chartData = monitors.length > 0 ? monitors[0].history : [];
useEffect(() => {
  const fetchMonitors = async () => {
    console.log("Fetching monitors...");
    try {
      const response = await fetch("http://localhost:3000/api/monitors");
      const data = await response.json();
      setMonitors(data);
    } catch (error) {
      console.error("Error fetching monitors:", error);
    }
  };

  // Initial fetch
  fetchMonitors();

  // Refresh every 30 seconds
 const interval = setInterval(() => {
  console.log("Interval running...");
  fetchMonitors();
}, 30000);

console.log("Interval ID:", interval);

  // Cleanup when component unmounts
  return () => clearInterval(interval);
}, []);
  // Send new monitor to Express backend
  const handleCreateMonitor = async () => {
  console.log("FORM VALUES:", { name, url,   checkInterval });
  if (editingMonitor) {
  const response = await fetch(
    `http://localhost:3000/api/monitors/${editingMonitor.id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        url,
        interval: checkInterval,
      }),
    }
  );

  const updatedMonitor = await response.json();

  setMonitors((current) =>
    current.map((monitor) =>
      monitor.id === updatedMonitor.id
        ? updatedMonitor
        : monitor
    )
  );

  setEditingMonitor(null);
  setIsModalOpen(false);

  setName("");
  setUrl("");
  setCheckInterval("5");

  return;
}

  try {
    const response = await fetch("http://localhost:3000/api/monitors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
     body: JSON.stringify({
  name,
  url,
  interval: checkInterval,
}),
    });

    const data = await response.json();

    console.log("Monitor created:", data);

    // Add returned monitor to the dashboard
    setMonitors((currentMonitors) => [
      ...currentMonitors,
      data,
    ]);

    // Close modal
    setIsModalOpen(false);

    // Clear form
    setName("");
    setUrl("");
    setCheckInterval("5");

  } catch (error) {
    console.error("Error creating monitor:", error);
  }
};
const handleDeleteMonitor = async (id) => {
  try {
    const response = await fetch(
      `http://localhost:3000/api/monitors/${id}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete monitor");
    }

    // Remove monitor from React state
    setMonitors((currentMonitors) =>
      currentMonitors.filter((monitor) => monitor.id !== id)
    );

    console.log("Monitor deleted successfully");
  } catch (error) {
    console.error("Error deleting monitor:", error);
  }
};
const handleEditClick = (monitor) => {
  setEditingMonitor(monitor);

  setName(monitor.name);
  setUrl(monitor.url);
  setCheckInterval(monitor.interval);
  setIsModalOpen(true);
};
const handlePauseMonitor = async (id) => {
  try {
    const response = await fetch(
      `http://localhost:3000/api/monitors/${id}/pause`,
      {
        method: "PATCH",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to pause monitor");
    }

    const updatedMonitor = await response.json();

    setMonitors((currentMonitors) =>
      currentMonitors.map((monitor) =>
        monitor.id === id ? updatedMonitor : monitor
      )
    );
  } catch (error) {
    console.error("Error pausing monitor:", error);
  }
};

  return (
    <div className="flex min-h-screen bg-background text-foreground dark">
      <Sidebar />

      <main className="flex-1">
<Header
  onAddClick={() => setIsModalOpen(true)}
  searchTerm={searchTerm}
  setSearchTerm={setSearchTerm}
/>

        <div className="p-8 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           <StatCard
  title="Total APIs"
  value={totalApis}
  icon={<Server size={20} />}
/>

<StatCard
  title="Healthy"
  value={healthyApis}
  icon={
    <CheckCircle2
      className="text-green-500"
      size={20}
    />
  }
/>

<StatCard
  title="Down"
  value={downApis}
  icon={
    <XCircle
      className="text-red-500"
      size={20}
    />
  }
/>

<StatCard
  title="Avg Latency"
  value={`${avgLatency} ms`}
  icon={<Clock size={20} />}
/>
          </div>

          {/* Chart Section */}
          <div className="bg-card border border-border p-6 rounded-xl">
            <h3 className="text-lg font-semibold mb-6">
              Global Response Time (Last 6 Hours)
            </h3>

            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="colorLatency"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#ffffff"
                        stopOpacity={0.1}
                      />

                      <stop
                        offset="95%"
                        stopColor="#ffffff"
                        stopOpacity={0}
                      />
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
                    fontSize={12}
                  />

                  <YAxis
                    stroke="#71717a"
                    fontSize={12}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #27272a",
                    }}
                    itemStyle={{
                      color: "#fff",
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="latency"
                    stroke="#ffffff"
                    fillOpacity={1}
                    fill="url(#colorLatency)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
<div className="flex gap-3">
  <button
    onClick={() => setStatusFilter("All")}
    className={`px-4 py-2 rounded-md ${
      statusFilter === "All"
        ? "bg-white text-black"
        : "bg-accent text-white"
    }`}
  >
    All
  </button>

  <button
    onClick={() => setStatusFilter("Healthy")}
    className={`px-4 py-2 rounded-md ${
      statusFilter === "Healthy"
        ? "bg-green-600 text-white"
        : "bg-accent text-white"
    }`}
  >
    Healthy
  </button>

  <button
    onClick={() => setStatusFilter("Down")}
    className={`px-4 py-2 rounded-md ${
      statusFilter === "Down"
        ? "bg-red-600 text-white"
        : "bg-accent text-white"
    }`}
  >
    Down
  </button>
</div>
          {/* Monitor Table */}
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
                   <th className="px-6 py-4">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {filteredMonitors.map((m) =>(
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
                          m.status === "Healthy"
                            ? "bg-green-500/10 text-green-500"
                            : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-zinc-300">
  {m.responseTime !== null && m.responseTime !== undefined
    ? `${m.responseTime} ms`
    : "-"}
</td>
<td className="px-6 py-4 text-sm text-zinc-300">
  {m.uptime}%
</td>

<td className="px-6 py-4 text-sm text-zinc-500">
  {m.lastChecked
    ? new Date(m.lastChecked).toLocaleString()
    : "-"}
</td>  <td className="px-6 py-4">
  <div className="flex gap-2">
    <button
      onClick={() => handleEditClick(m)}
      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
    >
      Edit
    </button>

    <button
      onClick={() => handleDeleteMonitor(m.id)}
      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
    >
      Delete
    </button>

    <button
      onClick={() => handlePauseMonitor(m.id)}
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
        </div>
      </main>

      {/* Add Monitor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-bold">
  {editingMonitor ? "Edit Monitor" : "Add New Monitor"}
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
                 onChange={(e) => setCheckInterval(e.target.value)}
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
                onClick={() =>
                  setIsModalOpen(false)
                }
                className="flex-1 px-4 py-2 bg-accent hover:bg-zinc-800 rounded-md"
              >
                Cancel
              </button>

              <button
  onClick={handleCreateMonitor}
  className="flex-1 px-4 py-2 bg-white text-black rounded-md font-bold"
>
  {editingMonitor ? "Save Changes" : "Create Monitor"}
</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon }) {
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