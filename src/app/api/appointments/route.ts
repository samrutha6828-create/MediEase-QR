import { NextRequest } from "next/server";
import { createAppointment } from "@/services/appointmentService";
import { ApiResponses } from "@/lib/api-response";
import { getCorsHeaders, handleOptionsRequest } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return handleOptionsRequest(request.headers.get("origin"));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const appointment = await createAppointment({
      patientId: body.patientId,
      doctorId: body.doctorId,
      hospitalCode: body.hospitalCode,
      date: body.date,
      time: body.time,
    });

    return ApiResponses.success(appointment, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to book appointment";
    return ApiResponses.error(msg, 400);
  }
}
