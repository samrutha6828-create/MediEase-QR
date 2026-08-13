import { config } from "./config";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  
  // In the browser, use relative path `/api/...` to avoid CORS or port mismatch
  const baseUrl =
    typeof window !== "undefined"
      ? "/api"
      : config.apiBaseUrl || "http://localhost:3000/api";

  const url = `${baseUrl}${cleanEndpoint}`;

  try {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    const data = await res.json();
    return data as ApiResponse<T>;
  } catch (err) {
    console.error(`API Fetch Error [${endpoint}]:`, err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network or server error",
      timestamp: new Date().toISOString(),
    };
  }
}
