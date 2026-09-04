import { spawn } from "child_process";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runValidationTests() {
  console.log("\n=== Starting Backend Input Validation Tests ===");

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

  await sleep(2000);

  try {
    const post = async (body) => {
      const res = await fetch("http://localhost:3000/api/monitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      return { status: res.status, data };
    };

    const put = async (id, body) => {
      const res = await fetch(`http://localhost:3000/api/monitors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      return { status: res.status, data };
    };

    // 1. Invalid Name tests
    console.log("\n-- 1. Testing Invalid Names --");
    let res = await post({ url: "http://localhost:5000/", interval: 1 });
    if (res.status !== 400 || !res.data.error.includes("Name is required")) throw new Error("Failed missing name");
    console.log("✅ Missing name correctly rejected with 400:", res.data.error);

    res = await post({ name: "   ", url: "http://localhost:5000/", interval: 1 });
    if (res.status !== 400 || !res.data.error.includes("whitespace")) throw new Error("Failed whitespace name");
    console.log("✅ Whitespace-only name correctly rejected with 400:", res.data.error);

    // 2. Invalid URL tests
    console.log("\n-- 2. Testing Invalid URLs --");
    res = await post({ name: "Test API", interval: 1 });
    if (res.status !== 400 || !res.data.error.includes("URL is required")) throw new Error("Failed missing url");
    console.log("✅ Missing URL correctly rejected with 400:", res.data.error);

    res = await post({ name: "Test API", url: "not-a-valid-url", interval: 1 });
    if (res.status !== 400 || !res.data.error.includes("Invalid URL format")) throw new Error("Failed malformed url");
    console.log("✅ Malformed URL correctly rejected with 400:", res.data.error);

    res = await post({ name: "Test API", url: "ftp://example.com", interval: 1 });
    if (res.status !== 400 || !res.data.error.includes("HTTP or HTTPS")) throw new Error("Failed ftp url");
    console.log("✅ FTP URL correctly rejected with 400:", res.data.error);

    res = await post({ name: "Test API", url: "javascript:alert(1)", interval: 1 });
    if (res.status !== 400 || !res.data.error.includes("HTTP or HTTPS")) throw new Error("Failed javascript url");
    console.log("✅ Javascript pseudo-URL correctly rejected with 400:", res.data.error);

    // 3. Invalid Interval tests
    console.log("\n-- 3. Testing Invalid Intervals --");
    res = await post({ name: "Test API", url: "http://localhost:5000/", interval: 3 });
    if (res.status !== 400 || !res.data.error.includes("1, 5, or 15")) throw new Error("Failed unsupported interval 3");
    console.log("✅ Interval 3 correctly rejected with 400:", res.data.error);

    res = await post({ name: "Test API", url: "http://localhost:5000/", interval: -5 });
    if (res.status !== 400 || !res.data.error.includes("1, 5, or 15")) throw new Error("Failed negative interval");
    console.log("✅ Negative interval correctly rejected with 400:", res.data.error);

    res = await post({ name: "Test API", url: "http://localhost:5000/", interval: "invalid" });
    if (res.status !== 400 || !res.data.error.includes("1, 5, or 15")) throw new Error("Failed string interval");
    console.log("✅ Non-numeric interval correctly rejected with 400:", res.data.error);

    // 4. Valid Creation and Trimming test
    console.log("\n-- 4. Testing Valid Creation with Trimming --");
    res = await post({
      name: "   User Service   ",
      url: "   http://localhost:5000/   ",
      interval: "5",
    });
    if (res.status !== 201) throw new Error("Valid creation failed");
    if (res.data.name !== "User Service") throw new Error("Name was not trimmed");
    if (res.data.url !== "http://localhost:5000/") throw new Error("URL was not trimmed");
    if (res.data.interval !== 5) throw new Error("Interval was not stored as numeric 5");
    const createdId = res.data.id;
    console.log("✅ Valid monitor created with trimmed values and numeric interval:", {
      id: res.data.id,
      name: res.data.name,
      url: res.data.url,
      interval: res.data.interval,
    });

    // 5. Valid Update (PUT)
    console.log("\n-- 5. Testing Valid Update (PUT) --");
    res = await put(createdId, {
      name: "   Updated User Service   ",
      url: "   http://localhost:5000/v2   ",
      interval: 15,
    });
    if (res.status !== 200) throw new Error("Valid update failed");
    if (res.data.name !== "Updated User Service") throw new Error("Updated name was not trimmed");
    if (res.data.url !== "http://localhost:5000/v2") throw new Error("Updated url was not trimmed");
    if (res.data.interval !== 15) throw new Error("Updated interval was not 15");
    console.log("✅ Valid monitor updated with trimmed values:", res.data);

    // 6. Invalid Update (PUT) fails and does not modify monitor
    console.log("\n-- 6. Testing Invalid Update (PUT) fails safely --");
    res = await put(createdId, {
      name: "Hacked Name",
      url: "http://localhost:5000/",
      interval: 99,
    });
    if (res.status !== 400 || !res.data.error.includes("1, 5, or 15")) throw new Error("Failed rejecting invalid interval on PUT");
    console.log("✅ Invalid PUT correctly rejected with 400:", res.data.error);

    // Verify monitor was NOT modified
    const listRes = await fetch("http://localhost:3000/api/monitors");
    const monitors = await listRes.json();
    const current = monitors.find((m) => m.id === createdId);
    if (current.name !== "Updated User Service" || current.interval !== 15) {
      throw new Error("Monitor state was corrupted by failed PUT!");
    }
    console.log("✅ Monitor array remained untouched after rejected PUT.");

    console.log("\n🎉 ALL VALIDATION TESTS PASSED SUCCESSFULLY!");
  } finally {
    testServerProc.kill();
    mainServerProc.kill();
    await sleep(500);
  }
}

runValidationTests().catch((err) => {
  console.error("❌ Validation test error:", err);
  process.exit(1);
});
