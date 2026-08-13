import { NextRequest } from "next/server";
import { validateStaffAuth } from "@/lib/staff-auth";
import { updateQueueStatus } from "@/services/staffService";
import { ApiResponses } from "@/lib/api-response";
import { getCorsHeaders, handleOptionsRequest } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return handleOptionsRequest(request.headers.get("origin"));
}

export async function POST(request: NextRequest) {
  if (!validateStaffAuth(request)) {
    return ApiResponses.error("Unauthorized: Invalid or missing staff access key", 401);
  }

  try {
    const body = await request.json();
    if (!body.queueItemId || !body.status) {
      return ApiResponses.error("queueItemId and status parameters are required", 400);
    }

    const updated = await updateQueueStatus(body.queueItemId, body.status);
    return ApiResponses.success(updated);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update status";
    return ApiResponses.error(msg, 400);
  }
}
