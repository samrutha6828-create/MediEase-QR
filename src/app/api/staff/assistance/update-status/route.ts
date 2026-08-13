import { NextRequest } from "next/server";
import { validateStaffAuth } from "@/lib/staff-auth";
import { updateAssistanceStatus } from "@/services/assistanceService";
import { ApiResponses } from "@/lib/api-response";
import { getCorsHeaders, handleOptionsRequest } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return handleOptionsRequest(request.headers.get("origin"));
}

export async function POST(request: NextRequest) {
  if (!validateStaffAuth(request)) {
    return ApiResponses.error("Unauthorized staff access", 401);
  }

  try {
    const body = await request.json();
    if (!body.requestId || !body.status) {
      return ApiResponses.error("requestId and status parameters are required", 400);
    }

    const updated = await updateAssistanceStatus(body.requestId, body.status);
    return ApiResponses.success(updated);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update assistance status";
    return ApiResponses.error(msg, 400);
  }
}
