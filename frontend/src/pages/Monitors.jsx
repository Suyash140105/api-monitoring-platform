import { useEffect, useState } from "react";
import MonitorTable from "../components/MonitorTable";
import MonitorModal from "../components/MonitorModal";
import { API_URL } from "../config";

export default function Monitors() {
  const [monitors, setMonitors] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [checkInterval, setCheckInterval] = useState("5");

  const [editingMonitor, setEditingMonitor] = useState(null);

  useEffect(() => {
    fetchMonitors();
  }, []);

  const fetchMonitors = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/monitors`
      );

      const data = await response.json();

      setMonitors(data);
    } catch (error) {
      console.error("Error fetching monitors:", error);
    }
  };

  const handleSubmit = async () => {
    try {
      const urlEndpoint = editingMonitor
        ? `${API_URL}/api/monitors/${editingMonitor.id}`
        : `${API_URL}/api/monitors`;

      const method = editingMonitor ? "PUT" : "POST";

      const response = await fetch(urlEndpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          url,
          interval: checkInterval,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error(error);
        return;
      }

      const data = await response.json();

      if (editingMonitor) {
        setMonitors((current) =>
          current.map((monitor) =>
            monitor.id === data.id ? data : monitor
          )
        );
      } else {
        setMonitors((current) => [...current, data]);
      }

      closeModal();
    } catch (error) {
      console.error("Error saving monitor:", error);
    }
  };

  const handleEdit = (monitor) => {
    setEditingMonitor(monitor);
    setName(monitor.name);
    setUrl(monitor.url);
    setCheckInterval(monitor.interval);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
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

      setMonitors((current) =>
        current.filter((monitor) => monitor.id !== id)
      );
    } catch (error) {
      console.error("Error deleting monitor:", error);
    }
  };

  const handlePause = async (id) => {
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

      setMonitors((current) =>
        current.map((monitor) =>
          monitor.id === id ? updatedMonitor : monitor
        )
      );
    } catch (error) {
      console.error("Error pausing monitor:", error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMonitor(null);
    setName("");
    setUrl("");
    setCheckInterval("5");
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Monitors
          </h1>

          <p className="text-sm text-zinc-400 mt-1">
            Manage and monitor your APIs.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-white text-black px-4 py-2 rounded-md font-medium"
        >
          + Add Monitor
        </button>
      </div>

      <MonitorTable
        monitors={monitors}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPause={handlePause}
      />

      <MonitorModal
        isOpen={isModalOpen}
        editingMonitor={editingMonitor}
        name={name}
        setName={setName}
        url={url}
        setUrl={setUrl}
        checkInterval={checkInterval}
        setCheckInterval={setCheckInterval}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}