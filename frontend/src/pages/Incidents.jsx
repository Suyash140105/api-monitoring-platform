import React, { useEffect, useState } from "react";
import IncidentTable from "../components/IncidentTable";
import { API_URL } from "../config";
import { useAuth } from "../context/AuthContext";

export default function Incidents() {
  const { authFetch } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const response = await authFetch(`${API_URL}/api/incidents`);
        if (response.ok) {
          const data = await response.json();
          setIncidents(data);
        }
      } catch (error) {
        console.error("Error fetching incidents:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIncidents();
  }, [authFetch]);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Incidents</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Historical record of downtime and recovery incidents for your monitored APIs.
        </p>
      </div>

      {isLoading ? (
        <div className="text-zinc-500 text-sm">Loading incidents...</div>
      ) : (
        <IncidentTable incidents={incidents} />
      )}
    </div>
  );
}