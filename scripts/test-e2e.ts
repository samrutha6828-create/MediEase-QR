import { db } from "../src/lib/db";
import { resolveHospitalByCode, generateHospitalQrCode } from "../src/services/qrService";
import { identifyOrCreatePatient } from "../src/services/patientService";
import { getDoctors } from "../src/services/doctorService";
import { checkDoctorAvailability, createAppointment } from "../src/services/appointmentService";
import { getRealQueueStatus } from "../src/services/queueService";
import { getStaffDashboardData, callNextPatient, updateQueueStatus } from "../src/services/staffService";
import { createOrUpdateAssistanceRequest, getActiveAssistanceForPatient, updateAssistanceStatus } from "../src/services/assistanceService";
import { checkSystemHealth } from "../src/services/healthService";
import { sendOtp, verifyOtp } from "../src/services/otpService";

async function runE2ETests() {
  console.log("==================================================");
  console.log("  MediEase Final E2E Suite (OTP, Calendar, UI)    ");
  console.log("==================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ""}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  try {
    // ----------------------------------------------------------------
    // 1. Patient OTP Verification Flow
    // ----------------------------------------------------------------
    console.log("--- Test Section 1: Patient OTP Authentication ---");
    const testPhone = `98${Date.now().toString().slice(-8)}`;

    const otpSendResult = await sendOtp(testPhone);
    assert(otpSendResult.success === true, "OTP generated and sent successfully");
    assert(otpSendResult.devOtp !== undefined && otpSendResult.devOtp.length === 6, "Dev OTP code available in development mode");

    const validCode = otpSendResult.devOtp!;

    // Test Invalid OTP rejection
    let invalidOtpCaught = false;
    try {
      await verifyOtp(testPhone, "000000");
    } catch (err: any) {
      if (err.message.includes("Invalid verification code")) {
        invalidOtpCaught = true;
      }
    }
    assert(invalidOtpCaught, "Backend correctly rejects invalid OTP code");

    // Test Valid OTP verification
    const verifyResult = await verifyOtp(testPhone, validCode);
    assert(verifyResult === true, "Backend successfully verifies correct OTP code");

    // ----------------------------------------------------------------
    // 2. Future Date Appointment Booking (Up to 6 Months)
    // ----------------------------------------------------------------
    console.log("\n--- Test Section 2: Future Date Booking & Calendar Validation ---");
    const doctors = await getDoctors("MEDIEASE-HOSP-01");
    const doctor = doctors[0];

    const patient = await identifyOrCreatePatient({
      name: "Calendar Test Patient",
      phone: testPhone,
      age: 70,
    });

    // Date 1: Valid future date (2 months from now with unique time slot)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + (Math.floor(Math.random() * 60) + 10));
    const validFutureDateStr = `${futureDate.getFullYear()}-${(futureDate.getMonth() + 1).toString().padStart(2, "0")}-${futureDate.getDate().toString().padStart(2, "0")}`;

    const apptFuture = await createAppointment({
      patientId: patient.id,
      doctorId: doctor.id,
      date: validFutureDateStr,
      time: "02:30 PM",
      hospitalCode: "MEDIEASE-HOSP-01",
    });
    assert(apptFuture.status === "CONFIRMED", "Successfully booked appointment for future date");
    assert(apptFuture.date === validFutureDateStr, "Appointment date persists exact future calendar date");

    // Date 2: Past date rejection check
    const pastDate = new Date();
    pastDate.setMonth(pastDate.getMonth() - 1);
    const pastDateStr = `${pastDate.getFullYear()}-${(pastDate.getMonth() + 1).toString().padStart(2, "0")}-${pastDate.getDate().toString().padStart(2, "0")}`;

    let pastDateRejected = false;
    try {
      await createAppointment({
        patientId: patient.id,
        doctorId: doctor.id,
        date: pastDateStr,
        time: "10:30 AM",
        hospitalCode: "MEDIEASE-HOSP-01",
      });
    } catch (err: any) {
      if (err.message.includes("past date")) {
        pastDateRejected = true;
      }
    }
    assert(pastDateRejected, "Backend rejects appointment booking for past dates");

    // Date 3: > 6 months rejection check
    const tooFarDate = new Date();
    tooFarDate.setMonth(tooFarDate.getMonth() + 8);
    const tooFarDateStr = `${tooFarDate.getFullYear()}-${(tooFarDate.getMonth() + 1).toString().padStart(2, "0")}-${tooFarDate.getDate().toString().padStart(2, "0")}`;

    let tooFarRejected = false;
    try {
      await createAppointment({
        patientId: patient.id,
        doctorId: doctor.id,
        date: tooFarDateStr,
        time: "10:30 AM",
        hospitalCode: "MEDIEASE-HOSP-01",
      });
    } catch (err: any) {
      if (err.message.includes("6 months")) {
        tooFarRejected = true;
      }
    }
    assert(tooFarRejected, "Backend rejects appointment booking beyond 6-month limit");

    // ----------------------------------------------------------------
    // 3. Hospital QR Resolution
    // ----------------------------------------------------------------
    console.log("\n--- Test Section 3: Hospital QR System ---");
    const validHospital = await resolveHospitalByCode("MEDIEASE-HOSP-01");
    assert(validHospital.name === "MediEase General Hospital", "Valid QR resolves correct hospital name");

    // ----------------------------------------------------------------
    // 4. Staff Dashboard & Queue Advancement
    // ----------------------------------------------------------------
    console.log("\n--- Test Section 4: Staff Queue Operations ---");
    const staffData = await getStaffDashboardData("MEDIEASE-HOSP-01");
    assert(staffData.hospital.code === "MEDIEASE-HOSP-01", "Staff dashboard loads hospital data");

    const calledPatient = await callNextPatient("MEDIEASE-HOSP-01");
    assert(calledPatient !== null, "Staff callNextPatient successfully advances queue");

    // ----------------------------------------------------------------
    // 5. Patient Assistance & IoT Hardware Webhook
    // ----------------------------------------------------------------
    console.log("\n--- Test Section 5: Assistance & IoT ---");
    const assist = await createOrUpdateAssistanceRequest({
      patientId: patient.id,
      hospitalCode: "MEDIEASE-HOSP-01",
      requestType: "Wheelchair Support",
    });
    assert(assist.status === "PENDING", "Patient assistance request created with PENDING status");

    await updateAssistanceStatus(assist.id, "ACKNOWLEDGED");
    const activeAssist = await getActiveAssistanceForPatient(patient.id);
    assert(activeAssist?.status === "ACKNOWLEDGED", "Patient sees ACKNOWLEDGED status");

    await updateAssistanceStatus(assist.id, "RESOLVED");
    const resolvedAssist = await getActiveAssistanceForPatient(patient.id);
    assert(resolvedAssist === null, "Resolved assistance cleared from active queue");

    console.log("\n==================================================");
    console.log(`  ALL ${passedTests} OF ${totalTests} TESTS PASSED CLEANLY!  `);
    console.log("==================================================");
  } catch (err) {
    console.error("\n❌ E2E Test Suite Failure:", err);
    process.exit(1);
  }
}

runE2ETests();
