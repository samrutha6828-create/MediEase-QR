import { NextRequest } from "next/server";
import { generateHospitalQrCode } from "@/services/qrService";
import { validateStaffAuth } from "@/lib/staff-auth";
import { ApiResponses } from "@/lib/api-response";
import { getCorsHeaders, handleOptionsRequest } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return handleOptionsRequest(request.headers.get("origin"));
}

export async function GET(request: NextRequest) {
  if (!validateStaffAuth(request)) {
    return ApiResponses.error("Unauthorized staff access", 401);
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code") || "MEDIEASE-HOSP-01";

  try {
    const result = await generateHospitalQrCode(code);
    return ApiResponses.success(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to generate hospital QR";
    return ApiResponses.error(msg, 400);
  }
}
