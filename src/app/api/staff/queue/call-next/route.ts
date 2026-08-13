import { NextRequest } from "next/server";
import { validateStaffAuth } from "@/lib/staff-auth";
import { callNextPatient } from "@/services/staffService";
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
    const body = await request.json().catch(() => ({}));
    const hospitalCode = body.hospitalCode || "MEDIEASE-HOSP-01";

    const nextPatientItem = await callNextPatient(hospitalCode);

    if (!nextPatientItem) {
      return ApiResponses.success({ message: "No waiting patients in queue", calledPatient: null });
    }

    return ApiResponses.success({
      message: `Called patient ${nextPatientItem.appointment.patient.name} (Token ${nextPatientItem.queueToken})`,
      calledPatient: nextPatientItem,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to call next patient";
    return ApiResponses.error(msg, 400);
  }
}
