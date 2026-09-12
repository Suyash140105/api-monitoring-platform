import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "./prisma.js";

const app = express();

app.use(cors());
app.use(express.json());

function formatMonitor(monitor) {
  const recentLogs = [...(monitor.checkLogs || [])].reverse();
  const history = recentLogs.map((log) => ({
    time: new Date(log.createdAt).toLocaleTimeString(),
    latency: log.latency ?? 0,
  }));

  const uptime = monitor.totalChecks > 0
    ? ((monitor.successChecks / monitor.totalChecks) * 100).toFixed(2)
    : (monitor.status === "Healthy" ? "100.00" : "0.00");

  return {
    id: monitor.id,
    userId: monitor.userId,
    name: monitor.name,
    url: monitor.url,
    interval: monitor.interval,
    isPaused: monitor.isPaused,
    status: monitor.status,
    responseTime: monitor.responseTime,
    statusCode: monitor.statusCode,
    lastChecked: monitor.lastChecked ? monitor.lastChecked.toISOString() : null,
    totalChecks: monitor.totalChecks,
    successChecks: monitor.successChecks,
    uptime,
    history,
  };
}

function formatIncident(incident) {
  return {
    id: incident.id,
    monitorId: incident.monitorId,
    monitorName: incident.monitor?.name || "Unknown",
    startedAt: incident.startedAt ? incident.startedAt.toISOString() : null,
    resolvedAt: incident.resolvedAt ? incident.resolvedAt.toISOString() : null,
    status: incident.status,
  };
}

function formatNotification(notification) {
  return {
    id: notification.id,
    userId: notification.userId,
    monitorId: notification.monitorId,
    incidentId: notification.incidentId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    isRead: notification.isRead,
    createdAt: notification.createdAt ? notification.createdAt.toISOString() : null,
  };
}

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
  const monitors = await prisma.monitor.findMany({
    where: { isPaused: false },
  });

  const now = Date.now();

  for (const monitor of monitors) {
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
      const existingOpenIncident = await prisma.incident.findFirst({
        where: {
          monitorId: monitor.id,
          status: "Open",
        },
      });

      if (!existingOpenIncident) {
        console.log(`Incident started: ${monitor.name}`);
        const newIncident = await prisma.incident.create({
          data: {
            monitorId: monitor.id,
            startedAt: new Date(),
            status: "Open",
          },
        });

        await prisma.notification.create({
          data: {
            userId: monitor.userId,
            monitorId: monitor.id,
            incidentId: newIncident.id,
            type: "INCIDENT_OPENED",
            title: "Monitor Down",
            message: `${monitor.name} is down.`,
          },
        });
      }
    }

    if (previousStatus === "Down" && currentStatus === "Healthy") {
      console.log(`Incident resolved: ${monitor.name}`);

      const openIncident = await prisma.incident.findFirst({
        where: {
          monitorId: monitor.id,
          status: "Open",
        },
        orderBy: { startedAt: "desc" },
      });

      if (openIncident) {
        await prisma.incident.update({
          where: { id: openIncident.id },
          data: {
            resolvedAt: new Date(),
            status: "Resolved",
          },
        });

        await prisma.notification.create({
          data: {
            userId: monitor.userId,
            monitorId: monitor.id,
            incidentId: openIncident.id,
            type: "INCIDENT_RESOLVED",
            title: "Monitor Recovered",
            message: `${monitor.name} has recovered.`,
          },
        });
      }
    }

    const isHealthy = currentStatus === "Healthy";
    await prisma.monitor.update({
      where: { id: monitor.id },
      data: {
        status: isHealthy ? "Healthy" : "Down",
        responseTime: result.responseTime,
        statusCode: result.statusCode,
        lastChecked: result.lastChecked ? new Date(result.lastChecked) : new Date(),
        totalChecks: { increment: 1 },
        successChecks: isHealthy ? { increment: 1 } : undefined,
        checkLogs: {
          create: {
            latency: result.responseTime,
            statusCode: result.statusCode,
            status: isHealthy ? "Healthy" : "Down",
          },
        },
      },
    });
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegisterInput(body) {
  const { name, email, password } = body || {};

  if (typeof name !== "string" || name.trim().length === 0) {
    return {
      isValid: false,
      error: "Name is required and cannot be empty",
    };
  }

  if (typeof email !== "string" || email.trim().length === 0) {
    return {
      isValid: false,
      error: "Email is required",
    };
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return {
      isValid: false,
      error: "Invalid email format",
    };
  }

  if (typeof password !== "string" || password.length < 6) {
    return {
      isValid: false,
      error: "Password must be at least 6 characters long",
    };
  }

  return {
    isValid: true,
    data: {
      name: name.trim(),
      email: normalizedEmail,
      password,
    },
  };
}

function validateLoginInput(body) {
  const { email, password } = body || {};

  if (typeof email !== "string" || email.trim().length === 0) {
    return {
      isValid: false,
      error: "Email is required",
    };
  }

  if (typeof password !== "string" || password.length === 0) {
    return {
      isValid: false,
      error: "Password is required",
    };
  }

  return {
    isValid: true,
    data: {
      email: email.trim().toLowerCase(),
      password,
    },
  };
}

// Authentication Routes
app.post("/api/auth/register", async (request, response, next) => {
  try {
    const validation = validateRegisterInput(request.body);
    if (!validation.isValid) {
      return response.status(400).json({
        error: validation.error,
      });
    }

    const { name, email, password } = validation.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return response.status(409).json({
        error: "Email already registered",
      });
    }

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    response.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", async (request, response, next) => {
  try {
    const validation = validateLoginInput(request.body);
    if (!validation.isValid) {
      return response.status(400).json({
        error: validation.error,
      });
    }

    const { email, password } = validation.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return response.status(401).json({
        error: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return response.status(401).json({
        error: "Invalid email or password",
      });
    }

    const secret = process.env.JWT_SECRET || "pulsemonitor_jwt_dev_secret_key_2026";
    const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      secret,
      { expiresIn }
    );

    response.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Authentication Middleware
async function requireAuth(request, response, next) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return response.status(401).json({
        error: "Authentication token required",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return response.status(401).json({
        error: "Authentication token required",
      });
    }

    const secret = process.env.JWT_SECRET || "pulsemonitor_jwt_dev_secret_key_2026";
    const decoded = jwt.verify(token, secret);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return response.status(401).json({
        error: "User not found or invalid token",
      });
    }

    request.user = user;
    next();
  } catch (error) {
    return response.status(401).json({
      error: "Invalid or expired token",
    });
  }
}

// Protected Monitor Routes
app.post("/api/monitors", requireAuth, async (request, response, next) => {
  try {
    const validation = validateMonitorInput(request.body);
    if (!validation.isValid) {
      return response.status(400).json({
        error: validation.error,
      });
    }

    const { name, url, interval } = validation.data;
    const userId = request.user.id;

    const result = await checkMonitor(url);
    const isHealthy = result.status === "Healthy";

    const monitor = await prisma.monitor.create({
      data: {
        userId,
        name,
        url,
        interval,
        isPaused: false,
        status: isHealthy ? "Healthy" : "Down",
        responseTime: result.responseTime,
        statusCode: result.statusCode,
        lastChecked: result.lastChecked ? new Date(result.lastChecked) : new Date(),
        totalChecks: 1,
        successChecks: isHealthy ? 1 : 0,
        checkLogs: {
          create: {
            latency: result.responseTime,
            statusCode: result.statusCode,
            status: isHealthy ? "Healthy" : "Down",
          },
        },
      },
      include: {
        checkLogs: {
          take: 20,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    response.status(201).json(formatMonitor(monitor));
  } catch (error) {
    next(error);
  }
});

app.delete("/api/monitors/:id", requireAuth, async (request, response, next) => {
  try {
    const id = Number(request.params.id);
    if (isNaN(id)) {
      return response.status(400).json({ error: "Invalid monitor ID" });
    }

    const existing = await prisma.monitor.findFirst({
      where: {
        id,
        userId: request.user.id,
      },
    });

    if (!existing) {
      return response.status(404).json({
        error: "Monitor not found",
      });
    }

    await prisma.monitor.delete({
      where: { id: existing.id },
    });

    response.json({
      message: "Monitor deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

app.put("/api/monitors/:id", requireAuth, async (request, response, next) => {
  try {
    const id = Number(request.params.id);
    if (isNaN(id)) {
      return response.status(400).json({ error: "Invalid monitor ID" });
    }

    const existing = await prisma.monitor.findFirst({
      where: {
        id,
        userId: request.user.id,
      },
    });

    if (!existing) {
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

    const updated = await prisma.monitor.update({
      where: { id: existing.id },
      data: {
        name,
        url,
        interval,
      },
      include: {
        checkLogs: {
          take: 20,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    response.json(formatMonitor(updated));
  } catch (error) {
    next(error);
  }
});

app.patch("/api/monitors/:id/pause", requireAuth, async (request, response, next) => {
  try {
    const id = Number(request.params.id);
    if (isNaN(id)) {
      return response.status(400).json({ error: "Invalid monitor ID" });
    }

    const existing = await prisma.monitor.findFirst({
      where: {
        id,
        userId: request.user.id,
      },
    });

    if (!existing) {
      return response.status(404).json({
        error: "Monitor not found",
      });
    }

    const updated = await prisma.monitor.update({
      where: { id: existing.id },
      data: {
        isPaused: !existing.isPaused,
      },
      include: {
        checkLogs: {
          take: 20,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    response.json(formatMonitor(updated));
  } catch (error) {
    next(error);
  }
});

app.get("/api/monitors", requireAuth, async (request, response, next) => {
  try {
    const monitors = await prisma.monitor.findMany({
      where: { userId: request.user.id },
      orderBy: { id: "asc" },
      include: {
        checkLogs: {
          take: 20,
          orderBy: { createdAt: "desc" },
        },
      },
    });
    response.json(monitors.map(formatMonitor));
  } catch (error) {
    next(error);
  }
});

app.get("/api/incidents", requireAuth, async (request, response, next) => {
  try {
    const incidents = await prisma.incident.findMany({
      where: {
        monitor: {
          userId: request.user.id,
        },
      },
      orderBy: { startedAt: "desc" },
      include: {
        monitor: {
          select: { name: true },
        },
      },
    });
    response.json(incidents.map(formatIncident));
  } catch (error) {
    next(error);
  }
});

app.get("/api/analytics", requireAuth, async (request, response, next) => {
  try {
    const userId = request.user.id;

    // Fetch user's monitors with recent checkLogs
    const monitors = await prisma.monitor.findMany({
      where: { userId },
      orderBy: { id: "asc" },
      include: {
        checkLogs: {
          orderBy: { createdAt: "desc" },
          take: 30,
        },
      },
    });

    const totalMonitors = monitors.length;
    let totalChecks = 0;
    let successChecks = 0;

    for (const m of monitors) {
      totalChecks += m.totalChecks;
      successChecks += m.successChecks;
    }

    const failedChecks = totalChecks - successChecks;

    // Overall uptime percentage across all checks
    const overallUptime =
      totalChecks > 0
        ? Number(((successChecks / totalChecks) * 100).toFixed(2))
        : (totalMonitors > 0 && monitors.every((m) => m.status === "Healthy") ? 100 : 0);

    // Global average response time from database CheckLog
    const avgResponseAgg = await prisma.checkLog.aggregate({
      where: {
        monitor: { userId },
        latency: { not: null },
      },
      _avg: {
        latency: true,
      },
    });

    const avgResponseTime = avgResponseAgg._avg.latency
      ? Math.round(avgResponseAgg._avg.latency)
      : 0;

    // Monitor performance list
    const monitorPerformance = monitors.map((m) => {
      const validLogs = m.checkLogs.filter(
        (l) => l.latency !== null && l.latency !== undefined
      );
      const monitorAvgLatency =
        validLogs.length > 0
          ? Math.round(
              validLogs.reduce((acc, curr) => acc + curr.latency, 0) /
                validLogs.length
            )
          : (m.responseTime ?? 0);

      const monitorUptime =
        m.totalChecks > 0
          ? ((m.successChecks / m.totalChecks) * 100).toFixed(2)
          : (m.status === "Healthy" ? "100.00" : "0.00");

      return {
        id: m.id,
        name: m.name,
        url: m.url,
        status: m.status,
        isPaused: m.isPaused,
        uptime: monitorUptime,
        avgResponseTime: monitorAvgLatency,
        totalChecks: m.totalChecks,
        successChecks: m.successChecks,
        failedChecks: m.totalChecks - m.successChecks,
        lastChecked: m.lastChecked ? m.lastChecked.toISOString() : null,
      };
    });

    // Recent latency time series across user's monitors (limit 40)
    const recentLogs = await prisma.checkLog.findMany({
      where: {
        monitor: { userId },
      },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        monitor: {
          select: { name: true },
        },
      },
    });

    // Chronological order for chart display
    const latencySeries = recentLogs.reverse().map((log) => ({
      id: log.id,
      monitorId: log.monitorId,
      monitorName: log.monitor?.name || "Unknown",
      time: new Date(log.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      timestamp: log.createdAt.toISOString(),
      latency: log.latency,
      statusCode: log.statusCode,
      status: log.status,
    }));

    response.json({
      overview: {
        totalMonitors,
        overallUptime,
        totalChecks,
        successChecks,
        failedChecks,
        avgResponseTime,
      },
      latencySeries,
      monitorPerformance,
    });
  } catch (error) {
    next(error);
  }
});

// Notifications API
app.get("/api/notifications", requireAuth, async (request, response, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: request.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    response.json(notifications.map(formatNotification));
  } catch (error) {
    next(error);
  }
});

app.patch("/api/notifications/read-all", requireAuth, async (request, response, next) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: request.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
    response.json({ message: "All notifications marked as read" });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/notifications/:id/read", requireAuth, async (request, response, next) => {
  try {
    const id = Number(request.params.id);
    if (isNaN(id)) {
      return response.status(400).json({ error: "Invalid notification ID" });
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId: request.user.id,
      },
    });

    if (!notification) {
      return response.status(404).json({ error: "Notification not found" });
    }

    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data: { isRead: true },
    });

    response.json(formatNotification(updated));
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

let isChecking = false;
setInterval(async () => {
  if (isChecking) return;
  isChecking = true;
  try {
    await checkAllMonitors();
  } catch (error) {
    console.error("Error in background monitoring loop:", error);
  } finally {
    isChecking = false;
  }
}, 10000);