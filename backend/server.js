import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

let monitors = [];
async function checkMonitor(url) {
  const start = Date.now();

  try {
    const response = await fetch(url);

    const responseTime = Date.now() - start;

    return {
      status: response.ok ? "Healthy" : "Down",
      responseTime,
      statusCode: response.status,
      lastChecked: new Date().toISOString(),
    };
  } catch {
    return {
      status: "Down",
      responseTime: null,
      statusCode: null,
      lastChecked: new Date().toISOString(),
    };
  }
}
async function checkAllMonitors() {
  for (const monitor of monitors) {
    const result = await checkMonitor(monitor.url);

    monitor.status = result.status;
    monitor.responseTime = result.responseTime;
    monitor.statusCode = result.statusCode;
    monitor.lastChecked = result.lastChecked;

    monitor.totalChecks++;

    if (result.status === "Healthy") {
      monitor.successChecks++;
    }

    monitor.uptime = (
      (monitor.successChecks / monitor.totalChecks) *
      100
    ).toFixed(2);

    monitor.history.push({
      time: new Date().toLocaleTimeString(),
      latency: result.responseTime ?? 0,
    });

    if (monitor.history.length > 20) {
      monitor.history.shift();
    }
  }

  console.log("All monitors checked");
}
app.post("/api/monitors", async(request, response) => {
  const { name, url, interval } = request.body;
  if (!name || !url) {
  return response.status(400).json({
    error: "Name and URL are required",
  });
}try {
  new URL(url);
} catch {
  return response.status(400).json({
    error: "Invalid URL",
  });
}

  const result = await checkMonitor(url);

const monitor = {
  id: Date.now(),
  name,
  url,
  interval,
  status: result.status,
  responseTime: result.responseTime,
  statusCode: result.statusCode,
  lastChecked: result.lastChecked,

  successChecks: result.status === "Healthy" ? 1 : 0,
  totalChecks: 1,
  uptime: result.status === "Healthy" ? 100 : 0,
  history: [],
};

monitors.push(monitor);

response.status(201).json(monitor);
});app.delete("/api/monitors/:id", (request, response) => {
  const id = Number(request.params.id);

  const index = monitors.findIndex(
    (monitor) => monitor.id === id
  );

  if (index === -1) {
    return response.status(404).json({
      error: "Monitor not found",
    });
  }

  monitors.splice(index, 1);

  response.json({
    message: "Monitor deleted successfully",
  });
});

app.get("/api/monitors", (request, response) => {
  response.json(monitors);
});

app.get("/api/health", (request, response) => {
  response.json({
    status: "ok"
  });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
setInterval(async () => {
  await checkAllMonitors();
}, 30000);