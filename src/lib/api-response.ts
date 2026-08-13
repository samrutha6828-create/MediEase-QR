import { NextResponse } from "next/server";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export class ApiResponses {
  static success<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
    return NextResponse.json(
      {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      },
      { status }
    );
  }

  static error(message: string, status = 400): NextResponse<ApiResponse<null>> {
    return NextResponse.json(
      {
        success: false,
        error: message,
        timestamp: new Date().toISOString(),
      },
      { status }
    );
  }
}

export const successResponse = ApiResponses.success;
export const errorResponse = ApiResponses.error;
