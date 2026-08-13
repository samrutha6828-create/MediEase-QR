import { NextRequest } from "next/server";
import { STAFF_KEY } from "@/lib/staff-auth";
import { ApiResponses } from "@/lib/api-response";
import { getCorsHeaders, handleOptionsRequest } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return handleOptionsRequest(request.headers.get("origin"));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const accessKey = body.passcode || body.accessKey;

    if (!accessKey || accessKey.trim() !== STAFF_KEY) {
      return ApiResponses.error("Invalid staff passcode or access key", 401);
    }

    return ApiResponses.success({
      authenticated: true,
      accessKey: STAFF_KEY,
      hospitalCode: "MEDIEASE-HOSP-01",
      hospitalName: "MediEase General Hospital",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Staff login failed";
    return ApiResponses.error(msg, 400);
  }
}
