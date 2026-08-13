import { NextRequest } from "next/server";
import { getDoctors } from "@/services/doctorService";
import { ApiResponses } from "@/lib/api-response";
import { getCorsHeaders, handleOptionsRequest } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return handleOptionsRequest(request.headers.get("origin"));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hospitalCode = searchParams.get("hospitalCode") || "MEDIEASE-HOSP-01";
  const corsHeaders = getCorsHeaders(request.headers.get("origin"));

  try {
    const doctors = await getDoctors(hospitalCode);
    return ApiResponses.success(doctors);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch doctors";
    return ApiResponses.error(msg, 400);
  }
}
