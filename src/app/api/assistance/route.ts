import { NextRequest } from "next/server";
import { createOrUpdateAssistanceRequest, getActiveAssistanceForPatient } from "@/services/assistanceService";
import { ApiResponses } from "@/lib/api-response";
import { getCorsHeaders, handleOptionsRequest } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return handleOptionsRequest(request.headers.get("origin"));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.patientId || !body.requestType) {
      return ApiResponses.error("patientId and requestType parameters are required", 400);
    }

    const assistance = await createOrUpdateAssistanceRequest({
      patientId: body.patientId,
      hospitalCode: body.hospitalCode,
      requestType: body.requestType,
    });

    return ApiResponses.success(assistance, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create assistance request";
    return ApiResponses.error(msg, 400);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId");

  if (!patientId) {
    return ApiResponses.error("patientId parameter is required", 400);
  }

  try {
    const assistance = await getActiveAssistanceForPatient(patientId);
    return ApiResponses.success(assistance);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch active assistance";
    return ApiResponses.error(msg, 500);
  }
}
