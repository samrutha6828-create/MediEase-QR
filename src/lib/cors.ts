import { NextResponse } from "next/server";

export function getCorsHeaders(requestOrigin?: string | null) {
  const envAllowed = process.env.ALLOWED_ORIGINS;
  let allowedOrigin = "*";

  if (envAllowed) {
    const allowedList = envAllowed.split(",").map((s) => s.trim());
    if (requestOrigin && allowedList.includes(requestOrigin)) {
      allowedOrigin = requestOrigin;
    } else {
      allowedOrigin = allowedList[0] || "*";
    }
  } else if (requestOrigin) {
    allowedOrigin = requestOrigin;
  }

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-staff-access-key, x-iot-device-token",
    "Access-Control-Max-Age": "86400",
  };
}

export function handleOptionsRequest(origin?: string | null) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}
