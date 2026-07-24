import { useEffect, useState } from "react";

function App() {
  const [status, setStatus] = useState("Checking...");

  useEffect(() => {
    fetch("http://localhost:3000/api/health")
      .then((response) => response.json())
      .then((data) => {
        setStatus(data.status);
      })
      .catch((error) => {
        console.error(error);
        setStatus("Backend unavailable");
      });
  }, []);

  return (
    <div>
      <h1>API Monitoring Platform</h1>
      <p>Backend Status: {status}</p>
    </div>
  );
}

export default App;