import { NextRequest } from "next/server";
import { validateStaffAuth } from "@/lib/staff-auth";
import { getHospitalAssistanceRequests } from "@/services/assistanceService";
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
  const hospitalCode = searchParams.get("hospitalCode") || "MEDIEASE-HOSP-01";

  try {
    const requests = await getHospitalAssistanceRequests(hospitalCode);
    return ApiResponses.success(requests);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch staff assistance alerts";
    return ApiResponses.error(msg, 500);
  }
}
