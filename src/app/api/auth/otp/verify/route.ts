import { NextRequest } from "next/server";
import { verifyOtp } from "@/services/otpService";
import { identifyOrCreatePatient } from "@/services/patientService";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleOptionsRequest } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return handleOptionsRequest(request.headers.get("origin"));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, code, name, age } = body;

    if (!phone || !code) {
      return errorResponse("Phone number and verification code are required", 400);
    }

    // 1. Authoritative Backend OTP Verification
    await verifyOtp(phone, code);

    // 2. Identify or Create Patient Record
    const patientName = name && name.trim().length > 0 ? name.trim() : "Verified Patient";
    const patient = await identifyOrCreatePatient({
      phone,
      name: patientName,
      age: age ? parseInt(age.toString(), 10) : undefined,
    });

    return successResponse(
      {
        verified: true,
        patient,
      },
      200
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verification failed";
    return errorResponse(message, 400);
  }
}
