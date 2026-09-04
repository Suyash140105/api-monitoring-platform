import { spawn } from "child_process";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runLiveTest() {
  console.log("\n=== Starting Live E2E Integration Test ===");

  // 1. Start test target server on port 5000
  const testServerProc = spawn("node", ["testServer.js"], {
    cwd: "c:\\Users\\Shree\\Desktop\\api-monitoring-platform\\backend",
    stdio: "inherit",
  });

  // 2. Start main server on port 3000
  const mainServerProc = spawn("node", ["server.js"], {
    cwd: "c:\\Users\\Shree\\Desktop\\api-monitoring-platform\\backend",
    stdio: "inherit",
  });

  // Give servers 2 seconds to bind ports
  await sleep(2000);

  try {
    // Verify servers are up
    const healthRes = await fetch("http://localhost:3000/api/health");
    if (!healthRes.ok) throw new Error("Main server not healthy");
    console.log("Servers are up and responding.");

    // Case 1: Create a monitor with 1-minute interval
    console.log("\n-- Case 1: Creating monitor with 1-minute interval --");
    const createRes = await fetch("http://localhost:3000/api/monitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "E2E Test API",
        url: "http://localhost:5000/",
        interval: "1",
      }),
    });
    const createdMonitor = await createRes.json();
    console.log("Created monitor:", {
      id: createdMonitor.id,
      name: createdMonitor.name,
      interval: createdMonitor.interval,
      status: createdMonitor.status,
      totalChecks: createdMonitor.totalChecks,
      lastChecked: createdMonitor.lastChecked,
    });

    // Case 2: Verify it was checked immediately
    if (createdMonitor.totalChecks !== 1 || createdMonitor.status !== "Healthy") {
      throw new Error(`Immediate check failed: totalChecks=${createdMonitor.totalChecks}, status=${createdMonitor.status}`);
    }
    console.log("✅ Case 1 & 2 PASSED: Created and checked immediately (totalChecks = 1).");

    const firstCheckedTime = createdMonitor.lastChecked;

    // Case 3: Verify it is not checked again before 1 minute
    console.log("\n-- Case 3: Waiting 15s to verify scheduler ticks but skips monitor --");
    await sleep(15000);

    const checkRes1 = await fetch("http://localhost:3000/api/monitors");
    const monitors1 = await checkRes1.json();
    const monitorAfter15s = monitors1.find((m) => m.id === createdMonitor.id);

    if (monitorAfter15s.totalChecks !== 1) {
      throw new Error(`Monitor was checked prematurely! totalChecks=${monitorAfter15s.totalChecks}`);
    }
    console.log("✅ Case 3 PASSED: At t=15s (after 10s tick), monitor was NOT checked prematurely (totalChecks = 1).");

    // Case 4: Verify it becomes due after approximately 1 minute
    console.log("\n-- Case 4: Waiting for monitor to become due after ~1 minute --");
    let monitorAfter1Min = null;
    const startWait = Date.now();
    while (Date.now() - startWait < 60000) { // wait up to 60s more (total ~75s)
      await sleep(2000);
      const res = await fetch("http://localhost:3000/api/monitors");
      const monitors = await res.json();
      const m = monitors.find((item) => item.id === createdMonitor.id);
      if (m && m.totalChecks >= 2) {
        monitorAfter1Min = m;
        break;
      }
    }

    if (!monitorAfter1Min || monitorAfter1Min.totalChecks < 2) {
      throw new Error(`Monitor was not checked after 1 minute! totalChecks=${monitorAfter1Min?.totalChecks}`);
    }
    const elapsedSinceCreation = Math.round((Date.now() - new Date(firstCheckedTime).getTime()) / 1000);
    console.log(`✅ Case 4 PASSED: Monitor became due after ~1 min (checked at ~${elapsedSinceCreation}s from creation, totalChecks = ${monitorAfter1Min.totalChecks}).`);

    // Case 5: Pause it and verify it is skipped
    console.log("\n-- Case 5: Pausing monitor --");
    const pauseRes = await fetch(`http://localhost:3000/api/monitors/${createdMonitor.id}/pause`, {
      method: "PATCH",
    });
    const pausedMonitor = await pauseRes.json();
    if (!pausedMonitor.isPaused) throw new Error("Monitor pause failed");

    console.log("Monitor paused. Waiting 15s to ensure scheduler skips it...");
    await sleep(15000);

    const checkRes3 = await fetch("http://localhost:3000/api/monitors");
    const monitors3 = await checkRes3.json();
    const monitorAfterPause = monitors3.find((m) => m.id === createdMonitor.id);

    if (monitorAfterPause.totalChecks !== monitorAfter1Min.totalChecks) {
      throw new Error("Paused monitor was checked while paused!");
    }
    console.log(`✅ Case 5 PASSED: Paused monitor was skipped by scheduler (totalChecks remained ${monitorAfterPause.totalChecks}).`);

    // Case 6: Change interval to 5 minutes, resume, and verify
    console.log("\n-- Case 6: Changing interval to 5 minutes and resuming --");
    const editRes = await fetch(`http://localhost:3000/api/monitors/${createdMonitor.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "E2E Test API Updated",
        url: "http://localhost:5000/",
        interval: "5",
      }),
    });
    const updatedMonitor = await editRes.json();
    if (updatedMonitor.interval !== 5) {
      throw new Error(`Interval not updated to 5: got ${updatedMonitor.interval}`);
    }

    // Resume monitor
    await fetch(`http://localhost:3000/api/monitors/${createdMonitor.id}/pause`, {
      method: "PATCH",
    });

    console.log("Resumed with 5m interval. Waiting 15s to verify not checked early...");
    await sleep(15000);

    const checkRes4 = await fetch("http://localhost:3000/api/monitors");
    const monitors4 = await checkRes4.json();
    const monitorAfter5mUpdate = monitors4.find((m) => m.id === createdMonitor.id);

    if (monitorAfter5mUpdate.totalChecks !== monitorAfter1Min.totalChecks) {
      throw new Error("Monitor with 5m interval was checked too early!");
    }
    console.log(`✅ Case 6 PASSED: 5-minute interval is respected, no premature checks (totalChecks remained ${monitorAfter5mUpdate.totalChecks}).`);

    console.log("\n🎉 ALL 6 TEST CASES PASSED SUCCESSFULLY!");
  } finally {
    testServerProc.kill();
    mainServerProc.kill();
    await sleep(500);
  }
}

runLiveTest().catch((err) => {
  console.error("❌ Live test error:", err);
  process.exit(1);
});
