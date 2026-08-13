const BASE_URL = "http://localhost:3000";

async function testLiveServer() {
  console.log("==================================================");
  console.log("  Testing MediEase Live Production Server Server  ");
  console.log(`  Target: ${BASE_URL}                            `);
  console.log("==================================================\n");

  let passed = 0;
  let total = 0;

  async function check(name: string, fn: () => Promise<boolean>) {
    total++;
    try {
      const ok = await fn();
      if (ok) {
        console.log(`✅ [PASS] ${name}`);
        passed++;
      } else {
        console.error(`❌ [FAIL] ${name}`);
      }
    } catch (err) {
      console.error(`❌ [ERROR] ${name}:`, err);
    }
  }

  // 1. Health Endpoint
  await check("1. GET /api/health returns 200 and DB connected", async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    const json = await res.json();
    return res.status === 200 && json.success === true && json.data.database === "connected";
  });

  // 2. Hospital QR
  await check("2. GET /api/hospitals/qr resolves hospital code", async () => {
    const res = await fetch(`${BASE_URL}/api/hospitals/qr?code=MEDIEASE-HOSP-01`);
    const json = await res.json();
    return res.status === 200 && json.data.code === "MEDIEASE-HOSP-01";
  });

  // 3. Doctors List
  let testDocId = "";
  await check("3. GET /api/doctors returns active doctors", async () => {
    const res = await fetch(`${BASE_URL}/api/doctors`);
    const json = await res.json();
    if (json.data && json.data.length > 0) {
      testDocId = json.data[0].id;
      return true;
    }
    return false;
  });

  // 4. Patient Identification
  let patientId = "";
  const phone = `9${Date.now().toString().slice(-9)}`;
  await check("4. POST /api/patients creates/identifies patient record", async () => {
    const res = await fetch(`${BASE_URL}/api/patients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Live Test Patient",
        phone,
        age: 69,
      }),
    });
    const json = await res.json();
    if (json.success && json.data.id) {
      patientId = json.data.id;
      return true;
    }
    return false;
  });

  // 5. Appointment Booking
  let appointmentId = "";
  const liveDate = `LiveDate-${Date.now()}`;
  await check("5. POST /api/appointments creates appointment and linked queue", async () => {
    const res = await fetch(`${BASE_URL}/api/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId,
        doctorId: testDocId,
        date: liveDate,
        time: "11:30 AM",
        hospitalCode: "MEDIEASE-HOSP-01",
      }),
    });
    const json = await res.json();
    if (json.success && json.data.id && json.data.queueItem) {
      appointmentId = json.data.id;
      return true;
    }
    return false;
  });

  // 6. Double Booking Rejection
  await check("6. POST /api/appointments rejects duplicate slot booking with 400", async () => {
    const res = await fetch(`${BASE_URL}/api/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId,
        doctorId: testDocId,
        date: liveDate,
        time: "11:30 AM",
        hospitalCode: "MEDIEASE-HOSP-01",
      }),
    });
    const json = await res.json();
    return res.status === 400 && json.success === false && json.error.includes("already booked");
  });

  // 7. Patient Queue Polling
  await check("7. GET /api/queue/[appointmentId] returns live queue status", async () => {
    const res = await fetch(`${BASE_URL}/api/queue/${appointmentId}`);
    const json = await res.json();
    return res.status === 200 && json.success === true && json.data.queueToken.startsWith("A-");
  });

  // 8. Staff Login
  let staffKey = "";
  await check("8. POST /api/staff/login validates staff credentials", async () => {
    const res = await fetch(`${BASE_URL}/api/staff/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode: "mediease-staff-2026" }),
    });
    const json = await res.json();
    if (json.success && json.data.accessKey) {
      staffKey = json.data.accessKey;
      return true;
    }
    return false;
  });

  // 9. Staff Queue Retrieval
  await check("9. GET /api/staff/queue requires staff authorization header", async () => {
    const unauth = await fetch(`${BASE_URL}/api/staff/queue`);
    const auth = await fetch(`${BASE_URL}/api/staff/queue`, {
      headers: { "x-staff-access-key": staffKey },
    });
    return unauth.status === 401 && auth.status === 200;
  });

  // 10. Staff Advance Queue
  await check("10. POST /api/staff/queue/call-next advances waiting patient to SERVING", async () => {
    const res = await fetch(`${BASE_URL}/api/staff/queue/call-next`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-staff-access-key": staffKey,
      },
      body: JSON.stringify({ hospitalCode: "MEDIEASE-HOSP-01" }),
    });
    const json = await res.json();
    return res.status === 200 && json.success === true;
  });

  // 11. Patient Assistance Request
  await check("11. POST /api/assistance submits patient assistance request", async () => {
    const res = await fetch(`${BASE_URL}/api/assistance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId,
        requestType: "Wheelchair Support",
      }),
    });
    const json = await res.json();
    return res.status === 201 && json.success === true && json.data.status === "PENDING";
  });

  // 12. IoT / ESP32 Device Webhook
  await check("12. POST /api/iot/assistance ingests authenticated ESP32 hardware event", async () => {
    const unauth = await fetch(`${BASE_URL}/api/iot/assistance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceCode: "ESP32-UNIT-1" }),
    });
    const auth = await fetch(`${BASE_URL}/api/iot/assistance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-iot-device-token": "mediease-iot-secret-key-2026",
      },
      body: JSON.stringify({
        deviceCode: "ESP32-TEST-UNIT",
        requestType: "Nurse Call Button",
        hospitalCode: "MEDIEASE-HOSP-01",
      }),
    });
    const authJson = await auth.json();
    return unauth.status === 401 && auth.status === 201 && authJson.success === true;
  });

  // 13. All 5 Major Development URLs Responding with HTTP 200
  const pages = [
    "/patient",
    "/staff",
    "/queue",
    "/assistance",
    "/iot",
    "/entry",
    "/identify",
    "/dashboard",
    "/book",
    "/confirmation",
  ];

  for (const page of pages) {
    await check(`13. Page route ${page} responds with 200 OK HTML`, async () => {
      const res = await fetch(`${BASE_URL}${page}`);
      const text = await res.text();
      return res.status === 200 && text.includes("<!DOCTYPE html>");
    });
  }

  console.log("\n==================================================");
  console.log(`  LIVE TEST RESULTS: ${passed} / ${total} CHECKS PASSED!  `);
  console.log("==================================================");
}

testLiveServer();
