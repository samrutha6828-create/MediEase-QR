import { NextRequest } from "next/server";
import { resolveHospitalByCode } from "@/services/qrService";
import { ApiResponses } from "@/lib/api-response";
import { getCorsHeaders, handleOptionsRequest } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return handleOptionsRequest(request.headers.get("origin"));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code") || "MEDIEASE-HOSP-01";

  try {
    const hospital = await resolveHospitalByCode(code);
    return ApiResponses.success(hospital);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Hospital QR code not recognized";
    return ApiResponses.error(msg, 404);
  }
}
