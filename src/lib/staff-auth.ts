import { NextRequest } from "next/server";

const DEFAULT_STAFF_KEY = process.env.STAFF_ACCESS_KEY || "mediease-staff-2026";

export function validateStaffAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("x-staff-access-key") || request.headers.get("authorization");
  if (!authHeader) return false;

  const key = authHeader.replace("Bearer ", "").trim();
  return key === DEFAULT_STAFF_KEY;
}

export const STAFF_KEY = DEFAULT_STAFF_KEY;
