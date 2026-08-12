const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('Starting MediEase QR API Tests...\n');

  try {
    // 1. Health check
    console.log('Test 1: GET /api/health');
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    console.log('Result:', healthData);
    if (healthData.status !== 'ok') throw new Error('Health check failed');
    console.log('✓ Health check passed\n');

    // 2. Retrieve doctors
    console.log('Test 2: GET /api/doctors');
    const doctorsRes = await fetch(`${BASE_URL}/api/doctors`);
    const doctorsData = await doctorsRes.json();
    console.log('Result (Doctors Count):', doctorsData.length);
    console.log('Doctors List:', doctorsData);
    if (doctorsData.length !== 3) throw new Error('Doctors seeding failed');
    console.log('✓ Doctors retrieval passed\n');

    // 3. Create a patient
    console.log('Test 3: POST /api/patients');
    const patientRes = await fetch(`${BASE_URL}/api/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ravi',
        phone: '9876543210',
        age: 67
      })
    });
    const patientData = await patientRes.json();
    console.log('Result:', patientData);
    if (!patientData.id || patientData.name !== 'Ravi') throw new Error('Create patient failed');
    console.log('✓ Create patient passed\n');

    // 4. Create an appointment
    console.log('Test 4: POST /api/appointments');
    const apptRes = await fetch(`${BASE_URL}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: patientData.id,
        doctorId: doctorsData[0].id,
        date: '2026-08-12'
      })
    });
    const apptData = await apptRes.json();
    console.log('Result:', apptData);
    if (!apptData.token || !apptData.appointment) throw new Error('Create appointment failed');
    console.log('✓ Create appointment passed\n');

    // 5. Retrieve the queue
    console.log('Test 5: GET /api/queue');
    const queueRes = await fetch(`${BASE_URL}/api/queue`);
    const queueData = await queueRes.json();
    console.log('Result (Queue Count):', queueData.length);
    console.log('Queue List:', JSON.stringify(queueData, null, 2));
    if (queueData.length === 0) throw new Error('Queue is empty');
    console.log('✓ Queue retrieval passed\n');

    // 6. Call the next patient (makes Ravi current)
    console.log('Test 6: POST /api/queue/next');
    const nextRes = await fetch(`${BASE_URL}/api/queue/next`, { method: 'POST' });
    const nextData = await nextRes.json();
    console.log('Result:', nextData);
    if (!nextData.token || nextData.status !== 'current') throw new Error('Call next patient failed');
    console.log('✓ Call next patient passed\n');

    // 7. Create an assistance alert
    console.log('Test 7: POST /api/iot/assistance-button');
    const alertRes = await fetch(`${BASE_URL}/api/iot/assistance-button`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: 'ESP32-001',
        patientId: patientData.id
      })
    });
    const alertData = await alertRes.json();
    console.log('Result:', alertData);
    if (alertData.type !== 'assistance' || alertData.status !== 'active') throw new Error('Create alert failed');
    console.log('✓ Create alert passed\n');

    // 8. Retrieve active alerts
    console.log('Test 8: GET /api/alerts');
    const activeAlertsRes = await fetch(`${BASE_URL}/api/alerts`);
    const activeAlertsData = await activeAlertsRes.json();
    console.log('Result (Active Alerts Count):', activeAlertsData.length);
    console.log('Active Alerts:', activeAlertsData);
    if (activeAlertsData.length === 0) throw new Error('Active alerts list is empty');
    console.log('✓ Retrieve active alerts passed\n');

    // 9. Resolve alert
    console.log(`Test 9: POST /api/alerts/${alertData.id}/resolve`);
    const resolveRes = await fetch(`${BASE_URL}/api/alerts/${alertData.id}/resolve`, { method: 'POST' });
    const resolveData = await resolveRes.json();
    console.log('Result:', resolveData);
    console.log('✓ Resolve alert passed\n');

    // 10. Verify active alerts count is 0
    console.log('Test 10: GET /api/alerts (after resolving)');
    const finalAlertsRes = await fetch(`${BASE_URL}/api/alerts`);
    const finalAlertsData = await finalAlertsRes.json();
    console.log('Result (Active Alerts Count):', finalAlertsData.length);
    if (finalAlertsData.length !== 0) throw new Error('Alert was not resolved properly');
    console.log('✓ Verify resolve alert passed\n');

    console.log('=================================');
    console.log('ALL TESTS PASSED SUCCESSFULLY! ✓');
    console.log('=================================');
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    process.exit(1);
  }
}

runTests();
