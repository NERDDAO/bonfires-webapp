/**
 * Server-side API Utilities
 *
 * Reusable utilities for Next.js API routes that proxy to the Delve backend.
 * These utilities handle timeout, error handling, logging, CORS, and auth.
 */
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";

// Server-side timeout (60s for Vercel Pro compatibility)
const DEFAULT_TIMEOUT_MS = 60000;

// Get backend URL - prefer non-public env var for server-side
const getBackendUrl = (): string => {
  return (
    process.env["DELVE_API_URL"] ??
    process.env["NEXT_PUBLIC_DELVE_API_URL"] ??
    "http://localhost:8000"
  );
};

/**
 * Standard API error response format
 */
export interface ApiErrorResponse {
  error: string;
  details?: unknown;
  code?: string;
}

/**
 * Options for proxy requests
 */
export interface ProxyOptions {
  /** HTTP method */
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  /** Request body (will be JSON stringified) */
  body?: unknown;
  /** Additional headers */
  headers?: Record<string, string>;
  /** Timeout in milliseconds (default: 60000) */
  timeout?: number;
  /** Query parameters to append */
  queryParams?: Record<string, string | number | boolean | undefined>;
  /** Include Clerk auth headers (default: true) */
  includeAuth?: boolean;
}

/**
 * Result from proxy request
 */
export interface ProxyResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiErrorResponse;
  status: number;
}

/**
 * CORS headers for API responses
 */
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Payment-Header",
} as const;

/**
 * Get Clerk authentication headers for backend requests
 *
 * Gets the Clerk session JWT token and returns it as a Bearer token header.
 * The backend verifies the JWT signature using Clerk's JWKS endpoint.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const authResult = await auth();
    const { getToken, userId, orgId, sessionId } = authResult;

    console.debug(
      `[Auth Headers] userId=${userId ?? "null"} orgId=${orgId ?? "null"} sessionId=${sessionId ?? "null"}`
    );

    // Strategy 1: Use getToken() (preferred — generates a fresh JWT)
    const token = await getToken();
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }

    // Strategy 2: Read Clerk's __session cookie directly.
    // This cookie IS the Clerk JWT and can be forwarded to the backend.
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session");
    if (sessionCookie?.value) {
      return { Authorization: `Bearer ${sessionCookie.value}` };
    }

    console.debug(
      "[Auth Headers] No Clerk token available (getToken=null, no __session cookie)"
    );
    return {};
  } catch (error) {
    console.debug("[Auth Headers] auth() threw:", error);
    return {};
  }
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: string,
  status: number,
  details?: unknown,
  code?: string
): NextResponse<ApiErrorResponse> {
  const body: ApiErrorResponse = { error };
  if (details !== undefined) body.details = details;
  if (code !== undefined) body.code = code;

  return NextResponse.json(body, {
    status,
    headers: CORS_HEADERS,
  });
}

/**
 * Create a success response with CORS headers
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): NextResponse<T> {
  return NextResponse.json(data, {
    status,
    headers: CORS_HEADERS,
  });
}

/**
 * Handle CORS preflight OPTIONS request
 */
export function handleCorsOptions(): NextResponse {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}

/**
 * Parse error from backend response
 */
async function parseErrorFromResponse(response: Response): Promise<{
  message: string;
  details?: unknown;
}> {
  let message = `Request failed with status ${response.status}`;
  let details: unknown = undefined;

  try {
    const errorData = await response.json();
    if (errorData.error) {
      message =
        typeof errorData.error === "string"
          ? errorData.error
          : JSON.stringify(errorData.error);
    } else if (errorData.message) {
      message = errorData.message;
    } else if (errorData.detail) {
      // FastAPI style errors
      message =
        typeof errorData.detail === "string"
          ? errorData.detail
          : JSON.stringify(errorData.detail);
    }

    if (errorData.details) {
      details = errorData.details;
    }
  } catch {
    // If response body is not JSON, try to get text
    try {
      const text = await response.text();
      if (text) {
        message = text.substring(0, 500);
      }
    } catch {
      message = response.statusText || message;
    }
  }

  return { message, details };
}

/**
 * Build URL with query parameters
 */
function buildUrl(
  baseUrl: string,
  endpoint: string,
  queryParams?: Record<string, string | number | boolean | undefined>
): string {
  const url = new URL(endpoint, baseUrl);

  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}

/**
 * Proxy a request to the Delve backend
 *
 * @param endpoint - Backend endpoint (e.g., "/agents" or "/bonfires")
 * @param options - Proxy options
 * @returns ProxyResult with success status and data or error
 */
export async function proxyToBackend<T = unknown>(
  endpoint: string,
  options: ProxyOptions = {}
): Promise<ProxyResult<T>> {
  const {
    method = "GET",
    body,
    headers = {},
    timeout = DEFAULT_TIMEOUT_MS,
    queryParams,
    includeAuth = true,
  } = options;

  const backendUrl = getBackendUrl();
  const url = buildUrl(backendUrl, endpoint, queryParams);

  // Get auth headers if requested
  const authHeaders = includeAuth ? await getAuthHeaders() : {};

  const hasClerkJwt = !!authHeaders["Authorization"];
  console.debug(
    `[API Proxy] ${method} ${url} | clerkJwt=${hasClerkJwt} includeAuth=${includeAuth}`
  );

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeout),
    });

    if (!response.ok) {
      const { message, details } = await parseErrorFromResponse(response);
      console.error(`[API Proxy] Error ${response.status}: ${message}`);

      return {
        success: false,
        error: { error: message, details },
        status: response.status,
      };
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return {
        success: true,
        data: undefined as T,
        status: 204,
      };
    }

    const data = (await response.json()) as T;
    console.log(`[API Proxy] Success ${response.status}`);

    return {
      success: true,
      data,
      status: response.status,
    };
  } catch (error) {
    console.error(`[API Proxy] Exception:`, error);

    // Handle timeout errors
    if (error instanceof Error && error.name === "TimeoutError") {
      return {
        success: false,
        error: {
          error: "Request timeout. Backend did not respond in time.",
          code: "TIMEOUT",
        },
        status: 503,
      };
    }

    // Handle network errors
    if (error instanceof Error) {
      const isNetworkError =
        error.message.includes("fetch") ||
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("network");

      if (isNetworkError) {
        return {
          success: false,
          error: {
            error:
              "Failed to connect to backend. Please check the backend is running.",
            code: "CONNECTION_ERROR",
          },
          status: 503,
        };
      }
    }

    // Generic error
    return {
      success: false,
      error: {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
        code: "INTERNAL_ERROR",
      },
      status: 500,
    };
  }
}

/**
 * Handle a proxy request and return appropriate NextResponse
 *
 * Convenience wrapper that combines proxyToBackend with response creation.
 *
 * @param endpoint - Backend endpoint
 * @param options - Proxy options
 * @param successStatus - HTTP status for success (default: 200)
 */
export async function handleProxyRequest<T = unknown>(
  endpoint: string,
  options: ProxyOptions = {},
  successStatus: number = 200
): Promise<NextResponse> {
  const result = await proxyToBackend<T>(endpoint, options);

  if (!result.success) {
    return createErrorResponse(
      result.error?.error ?? "Unknown error",
      result.status,
      result.error?.details,
      result.error?.code
    );
  }

  return createSuccessResponse(result.data, successStatus);
}

/**
 * Extract query parameters from a Next.js request URL
 */
export function extractQueryParams(
  request: Request,
  paramNames: string[]
): Record<string, string | undefined> {
  const url = new URL(request.url);
  const params: Record<string, string | undefined> = {};

  for (const name of paramNames) {
    const value = url.searchParams.get(name);
    params[name] = value ?? undefined;
  }

  return params;
}

/**
 * Parse JSON body from request with error handling
 */
export async function parseJsonBody<T = unknown>(
  request: Request
): Promise<{ data?: T; error?: string }> {
  try {
    const data = (await request.json()) as T;
    return { data };
  } catch {
    return { error: "Invalid JSON in request body" };
  }
}
