import { NextRequest } from "next/server";
import { getRealQueueStatus } from "@/services/queueService";
import { ApiResponses } from "@/lib/api-response";
import { getCorsHeaders, handleOptionsRequest } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return handleOptionsRequest(request.headers.get("origin"));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  const { appointmentId } = await params;

  try {
    const queueStatus = await getRealQueueStatus(appointmentId);
    return ApiResponses.success(queueStatus);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch queue status";
    return ApiResponses.error(msg, 400);
  }
}
