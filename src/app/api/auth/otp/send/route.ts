import { NextRequest } from "next/server";
import { sendOtp } from "@/services/otpService";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleOptionsRequest } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return handleOptionsRequest(request.headers.get("origin"));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return errorResponse("Mobile phone number is required", 400);
    }

    const result = await sendOtp(phone);
    return successResponse(result, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send verification code";
    return errorResponse(message, 400);
  }
}
