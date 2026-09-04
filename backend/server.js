import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

let monitors = [];
let incidents = [];
let incidentId = 1;
async function checkMonitor(url) {
  const start = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 10000);

  try {
    const response = await fetch(url, { signal: controller.signal });

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
  } finally {
    clearTimeout(timeoutId);
  }
}
async function checkAllMonitors() {
  const now = Date.now();

  for (const monitor of monitors) {
    if (monitor.isPaused) {
      continue;
    }

    const intervalMinutes = Number(monitor.interval) || 1;
    const intervalMs = intervalMinutes * 60 * 1000;
    const lastCheckedMs = monitor.lastChecked
      ? new Date(monitor.lastChecked).getTime()
      : 0;

    if (monitor.lastChecked && now - lastCheckedMs < intervalMs) {
      continue;
    }

    const result = await checkMonitor(monitor.url);

    const previousStatus = monitor.status;
    const currentStatus = result.status;
console.log(
  "STATUS CHECK:",
  monitor.name,
  "Previous:",
  previousStatus,
  "Current:",
  currentStatus
);
    if (previousStatus === "Healthy" && currentStatus === "Down") {
      console.log(`Incident started: ${monitor.name}`);

      incidents.push({
        id: incidentId++,
        monitorId: monitor.id,
        monitorName: monitor.name,
        startedAt: new Date().toISOString(),
        resolvedAt: null,
        status: "Open",
      });
    }

    if (previousStatus === "Down" && currentStatus === "Healthy") {
      console.log(`Incident resolved: ${monitor.name}`);

      const incident = incidents.find(
        (incident) =>
          incident.monitorId === monitor.id &&
          incident.status === "Open"
      );

      if (incident) {
        incident.resolvedAt = new Date().toISOString();
        incident.status = "Resolved";
      }
    }

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

const ALLOWED_INTERVALS = [1, 5, 15];

function validateMonitorInput(body) {
  const { name, url, interval } = body || {};

  if (typeof name !== "string" || name.trim().length === 0) {
    return {
      isValid: false,
      error: "Name is required and cannot be empty or whitespace",
    };
  }

  if (typeof url !== "string" || url.trim().length === 0) {
    return {
      isValid: false,
      error: "URL is required",
    };
  }

  const trimmedUrl = url.trim();
  let parsedUrl;
  try {
    parsedUrl = new URL(trimmedUrl);
  } catch {
    return {
      isValid: false,
      error: "Invalid URL format",
    };
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return {
      isValid: false,
      error: "URL must use HTTP or HTTPS protocol",
    };
  }

  const numInterval = Number(interval);
  if (!Number.isInteger(numInterval) || !ALLOWED_INTERVALS.includes(numInterval)) {
    return {
      isValid: false,
      error: "Interval must be 1, 5, or 15 minutes",
    };
  }

  return {
    isValid: true,
    data: {
      name: name.trim(),
      url: trimmedUrl,
      interval: numInterval,
    },
  };
}

app.post("/api/monitors", async (request, response, next) => {
  try {
    const validation = validateMonitorInput(request.body);
    if (!validation.isValid) {
      return response.status(400).json({
        error: validation.error,
      });
    }

    const { name, url, interval } = validation.data;

    const result = await checkMonitor(url);

    const monitor = {
      id: Date.now(),
      name,
      url,
      interval,
      isPaused: false,
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
  } catch (error) {
    next(error);
  }
});

app.delete("/api/monitors/:id", (request, response, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
});

app.put("/api/monitors/:id", async (request, response, next) => {
  try {
    const id = Number(request.params.id);

    const monitor = monitors.find(
      (monitor) => monitor.id === id
    );

    if (!monitor) {
      return response.status(404).json({
        error: "Monitor not found",
      });
    }

    const validation = validateMonitorInput(request.body);
    if (!validation.isValid) {
      return response.status(400).json({
        error: validation.error,
      });
    }

    const { name, url, interval } = validation.data;

    monitor.name = name;
    monitor.url = url;
    monitor.interval = interval;

    response.json(monitor);
  } catch (error) {
    next(error);
  }
});

app.patch("/api/monitors/:id/pause", (request, response, next) => {
  try {
    const id = Number(request.params.id);

    const monitor = monitors.find(
      (monitor) => monitor.id === id
    );

    if (!monitor) {
      return response.status(404).json({
        error: "Monitor not found",
      });
    }

    monitor.isPaused = !monitor.isPaused;

    response.json(monitor);
  } catch (error) {
    next(error);
  }
});

app.get("/api/monitors", (request, response, next) => {
  try {
    response.json(monitors);
  } catch (error) {
    next(error);
  }
});

app.get("/api/incidents", (request, response, next) => {
  try {
    response.json(incidents);
  } catch (error) {
    next(error);
  }
});

app.get("/api/health", (request, response, next) => {
  try {
    response.json({
      status: "ok",
    });
  } catch (error) {
    next(error);
  }
});

// 404 Route Not Found Handler
app.use((request, response) => {
  response.status(404).json({
    error: "Route not found",
  });
});

// Centralized Error Handling Middleware
app.use((error, request, response, next) => {
  console.error("Unhandled error:", error);

  // Handle invalid JSON body syntax from express.json()
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return response.status(400).json({
      error: "Invalid JSON payload",
    });
  }

  const statusCode = error.status || error.statusCode || 500;
  const errorMessage =
    statusCode >= 500 ? "Internal server error" : (error.message || "An error occurred");

  response.status(statusCode).json({
    error: errorMessage,
  });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

setInterval(async () => {
  try {
    await checkAllMonitors();
  } catch (error) {
    console.error("Error in background monitoring loop:", error);
  }
}, 10000);