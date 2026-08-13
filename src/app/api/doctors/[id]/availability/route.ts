import { NextRequest } from "next/server";
import { checkDoctorAvailability } from "@/services/appointmentService";
import { ApiResponses } from "@/lib/api-response";
import { getCorsHeaders, handleOptionsRequest } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return handleOptionsRequest(request.headers.get("origin"));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: doctorId } = await params;
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || "Today";

  try {
    const slots = await checkDoctorAvailability(doctorId, date);
    return ApiResponses.success({ doctorId, date, slots });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch availability";
    return ApiResponses.error(msg, 400);
  }
}
