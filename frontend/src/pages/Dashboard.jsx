import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import MonitorTable from "../components/MonitorTable";
import MonitorModal from "../components/MonitorModal";
import IncidentTable from "../components/IncidentTable";
import StatCard from "../components/StatCard";
import { API_URL } from "../config";
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




export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Add Monitor form state
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
 const [checkInterval, setCheckInterval] = useState("5");
 const [editingMonitor, setEditingMonitor] = useState(null);
  const [monitors, setMonitors] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [incidents, setIncidents] = useState([]);
  const { searchTerm, registerAddClick } = useOutletContext();
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
  registerAddClick(() => setIsModalOpen(true));
  return () => registerAddClick(null);
}, [registerAddClick]);
useEffect(() => {
  const fetchMonitors = async () => {
    console.log("Fetching monitors...");
    try {
      const response = await fetch(`${API_URL}/api/monitors`);
      const data = await response.json();
      setMonitors(data);
    } catch (error) {
      console.error("Error fetching monitors:", error);
    }
  };
  const fetchIncidents = async () => {
  try {
    const response = await fetch(
      `${API_URL}/api/incidents`
    );

    const data = await response.json();

    setIncidents(data);
    console.log("Incidents:", data);
  } catch (error) {
    console.error("Error fetching incidents:", error);
  }
};

  // Initial fetch
  fetchMonitors();
  fetchIncidents();

  // Refresh every 30 seconds
 const interval = setInterval(() => {
  console.log("Interval running...");
  fetchMonitors();
  fetchIncidents();
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
    `${API_URL}/api/monitors/${editingMonitor.id}`,
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
    const response = await fetch(`${API_URL}/api/monitors`, {
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
      `${API_URL}/api/monitors/${id}`,
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
      `${API_URL}/api/monitors/${id}/pause`,
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
    <>
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
         <MonitorTable
  monitors={filteredMonitors}
  onEdit={handleEditClick}
  onDelete={handleDeleteMonitor}
  onPause={handlePauseMonitor}
  
/>

<IncidentTable incidents={incidents} />
        </div>

    <MonitorModal
  isOpen={isModalOpen}
  editingMonitor={editingMonitor}
  name={name}
  setName={setName}
  url={url}
  setUrl={setUrl}
  checkInterval={checkInterval}
  setCheckInterval={setCheckInterval}
  onClose={() => setIsModalOpen(false)}
  onSubmit={handleCreateMonitor}
/>
    </>
  );
}

