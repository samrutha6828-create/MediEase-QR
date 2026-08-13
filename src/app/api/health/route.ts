import { NextRequest } from "next/server";
import { checkSystemHealth } from "@/services/healthService";
import { ApiResponses } from "@/lib/api-response";
import { getCorsHeaders, handleOptionsRequest } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return handleOptionsRequest(request.headers.get("origin"));
}

export async function GET(request: NextRequest) {
  const health = await checkSystemHealth();
  const corsHeaders = getCorsHeaders(request.headers.get("origin"));

  if (health.status === "ok") {
    return ApiResponses.success(health, 200);
  }

  return ApiResponses.error("Database connection failed", 500);
}
