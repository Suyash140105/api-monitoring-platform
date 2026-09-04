import http from "http";

// Function under test: exact checkMonitor logic from server.js
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

// Set up a mock HTTP server with fast and slow routes
const mockServer = http.createServer((req, res) => {
  if (req.url === "/fast") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
  } else if (req.url === "/slow") {
    // Deliberately delay response by 12 seconds (exceeding 10s timeout)
    setTimeout(() => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "too slow" }));
    }, 12000);
  } else {
    res.writeHead(404);
    res.end();
  }
});

mockServer.listen(5050, async () => {
  console.log("Mock test server running on port 5050");

  try {
    // Case 1: Normal fast API
    console.log("\n-- Test 1: Fast API (healthy) --");
    const fastStart = Date.now();
    const fastResult = await checkMonitor("http://localhost:5050/fast");
    const fastDuration = Date.now() - fastStart;

    console.log("Fast API result:", fastResult, `(took ${fastDuration}ms)`);
    if (fastResult.status !== "Healthy" || fastResult.statusCode !== 200) {
      throw new Error("Fast API did not return Healthy / 200");
    }
    console.log("✅ Test 1 PASSED: Fast API returned Healthy with response time.");

    // Case 2: Unreachable API
    console.log("\n-- Test 2: Unreachable API --");
    const unreachableStart = Date.now();
    const unreachableResult = await checkMonitor("http://127.0.0.1:59999/unreachable");
    const unreachableDuration = Date.now() - unreachableStart;

    console.log("Unreachable API result:", unreachableResult, `(took ${unreachableDuration}ms)`);
    if (unreachableResult.status !== "Down" || unreachableResult.statusCode !== null) {
      throw new Error("Unreachable API did not return Down with null statusCode");
    }
    console.log("✅ Test 2 PASSED: Unreachable API returned Down correctly.");

    // Case 3: Deliberately slow API (> 10s)
    console.log("\n-- Test 3: Deliberately slow API (12s delay) --");
    const slowStart = Date.now();
    const slowResult = await checkMonitor("http://localhost:5050/slow");
    const slowDuration = Date.now() - slowStart;

    console.log("Slow API result:", slowResult, `(aborted after ${slowDuration}ms)`);
    if (slowResult.status !== "Down" || slowResult.statusCode !== null) {
      throw new Error("Slow API was not marked as Down");
    }
    if (slowDuration < 9500 || slowDuration > 11500) {
      throw new Error(`Expected timeout around 10000ms, but took ${slowDuration}ms`);
    }
    console.log(`✅ Test 3 PASSED: Request aborted at ~${slowDuration}ms (marked Down, did not wait for 12s response).`);

    console.log("\n🎉 ALL TIMEOUT TESTS PASSED SUCCESSFULLY!");
  } catch (err) {
    console.error("❌ Test failed:", err);
    process.exit(1);
  } finally {
    mockServer.close();
  }
});
