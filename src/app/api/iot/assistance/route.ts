import { NextRequest } from "next/server";
import { validateIotAuth } from "@/lib/iot-auth";
import { createOrUpdateAssistanceRequest } from "@/services/assistanceService";
import { identifyOrCreatePatient } from "@/services/patientService";
import { ApiResponses } from "@/lib/api-response";
import { getCorsHeaders, handleOptionsRequest } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return handleOptionsRequest(request.headers.get("origin"));
}

export async function POST(request: NextRequest) {
  if (!validateIotAuth(request)) {
    return ApiResponses.error("Unauthorized IoT device: Invalid or missing x-iot-device-token", 401);
  }

  try {
    const body = await request.json();
    const hospitalCode = body.hospitalCode || "MEDIEASE-HOSP-01";
    const deviceCode = body.deviceCode || "ESP32-WAITING-ROOM";
    const requestType = body.requestType || "Wheelchair Support";

    let patientId = body.patientId;

    // If physical button press without patientId (e.g. wall button in Waiting Room A)
    if (!patientId) {
      const iotPatient = await identifyOrCreatePatient({
        name: `Hardware Button (${deviceCode})`,
        phone: "0000000000",
      });
      patientId = iotPatient.id;
    }

    const assistance = await createOrUpdateAssistanceRequest({
      patientId,
      hospitalCode,
      requestType: `${requestType} [Device: ${deviceCode}]`,
    });

    return ApiResponses.success(
      {
        message: "IoT assistance event received and logged",
        deviceCode,
        hospitalCode,
        assistance,
      },
      201
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to process IoT assistance event";
    return ApiResponses.error(msg, 400);
  }
}
