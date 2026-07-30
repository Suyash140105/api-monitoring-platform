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
};

monitors.push(monitor);

response.status(201).json(monitor);
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