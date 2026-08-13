import { NextRequest } from "next/server";

const DEFAULT_IOT_SECRET = process.env.IOT_DEVICE_SECRET || "mediease-iot-secret-key-2026";

export function validateIotAuth(request: NextRequest): boolean {
  const token = request.headers.get("x-iot-device-token") || request.headers.get("authorization");
  if (!token) return false;

  const cleanToken = token.replace("Bearer ", "").trim();
  return cleanToken === DEFAULT_IOT_SECRET;
}

export const IOT_SECRET = DEFAULT_IOT_SECRET;
