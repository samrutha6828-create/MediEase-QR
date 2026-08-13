import { NextRequest } from "next/server";
import { identifyOrCreatePatient, getPatientById } from "@/services/patientService";
import { ApiResponses } from "@/lib/api-response";
import { getCorsHeaders, handleOptionsRequest } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return handleOptionsRequest(request.headers.get("origin"));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const patient = await identifyOrCreatePatient({
      name: body.name,
      phone: body.phone,
      age: body.age ? parseInt(body.age, 10) : undefined,
    });

    return ApiResponses.success(patient, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to identify patient";
    return ApiResponses.error(msg, 400);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return ApiResponses.error("Patient ID parameter is required", 400);
  }

  try {
    const patient = await getPatientById(id);
    if (!patient) {
      return ApiResponses.error("Patient not found", 404);
    }
    return ApiResponses.success(patient);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch patient";
    return ApiResponses.error(msg, 500);
  }
}
