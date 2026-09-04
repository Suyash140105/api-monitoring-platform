// Simple test assertions
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

// 1. UNIT TEST OF THE SCHEDULING LOGIC
console.log("\n=== 1. Testing Core Scheduler Decision Logic ===");

function shouldCheckMonitor(monitor, now = Date.now()) {
  if (monitor.isPaused) {
    return false;
  }
  const intervalMinutes = Number(monitor.interval) || 1;
  const intervalMs = intervalMinutes * 60 * 1000;
  const lastCheckedMs = monitor.lastChecked
    ? new Date(monitor.lastChecked).getTime()
    : 0;

  if (monitor.lastChecked && now - lastCheckedMs < intervalMs) {
    return false;
  }
  return true;
}

const baseTime = Date.now();

// Case A: Create a monitor with 1-minute interval without lastChecked
const newMonitor = {
  id: 1,
  name: "API 1",
  interval: 1,
  isPaused: false,
  lastChecked: null,
};
assert(shouldCheckMonitor(newMonitor, baseTime) === true, "New monitor without lastChecked is due immediately");

// Case B: Monitor checked at baseTime, interval 1 min.
newMonitor.lastChecked = new Date(baseTime).toISOString();

// Check at 10s, 30s, 59s
assert(shouldCheckMonitor(newMonitor, baseTime + 10 * 1000) === false, "Monitor is not checked at 10s");
assert(shouldCheckMonitor(newMonitor, baseTime + 30 * 1000) === false, "Monitor is not checked at 30s");
assert(shouldCheckMonitor(newMonitor, baseTime + 59 * 1000) === false, "Monitor is not checked at 59s");

// Case C: Monitor becomes due at 60s
assert(shouldCheckMonitor(newMonitor, baseTime + 60 * 1000) === true, "Monitor is due at 60s (approx 1 minute)");
assert(shouldCheckMonitor(newMonitor, baseTime + 70 * 1000) === true, "Monitor is due at 70s");

// Case D: Pause monitor
newMonitor.isPaused = true;
assert(shouldCheckMonitor(newMonitor, baseTime + 70 * 1000) === false, "Paused monitor is skipped even if overdue");

// Case E: Unpause and change interval to 5 minutes
newMonitor.isPaused = false;
newMonitor.interval = 5;
// At 65s (only 1m 5s elapsed): should NOT be checked under 5m interval
assert(shouldCheckMonitor(newMonitor, baseTime + 65 * 1000) === false, "With 5m interval, monitor is skipped at 65s");
assert(shouldCheckMonitor(newMonitor, baseTime + 4 * 60 * 1000) === false, "With 5m interval, monitor is skipped at 4 minutes");
assert(shouldCheckMonitor(newMonitor, baseTime + 5 * 60 * 1000) === true, "With 5m interval, monitor becomes due at 5 minutes");

console.log("\nAll core scheduler logic tests passed successfully!");
