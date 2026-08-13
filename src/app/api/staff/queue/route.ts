import { NextRequest } from "next/server";
import { validateStaffAuth } from "@/lib/staff-auth";
import { getStaffDashboardData } from "@/services/staffService";
import { ApiResponses } from "@/lib/api-response";
import { getCorsHeaders, handleOptionsRequest } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return handleOptionsRequest(request.headers.get("origin"));
}

export async function GET(request: NextRequest) {
  if (!validateStaffAuth(request)) {
    return ApiResponses.error("Unauthorized: Invalid or missing staff access key", 401);
  }

  const { searchParams } = new URL(request.url);
  const hospitalCode = searchParams.get("hospitalCode") || "MEDIEASE-HOSP-01";

  try {
    const data = await getStaffDashboardData(hospitalCode);
    return ApiResponses.success(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load staff queue data";
    return ApiResponses.error(msg, 500);
  }
}
