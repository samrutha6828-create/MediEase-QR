import { NextRequest } from "next/server";
import { getAppointmentById } from "@/services/appointmentService";
import { ApiResponses } from "@/lib/api-response";
import { getCorsHeaders, handleOptionsRequest } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return handleOptionsRequest(request.headers.get("origin"));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const appointment = await getAppointmentById(id);
    if (!appointment) {
      return ApiResponses.error("Appointment record not found", 404);
    }
    return ApiResponses.success(appointment);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch appointment";
    return ApiResponses.error(msg, 500);
  }
}
