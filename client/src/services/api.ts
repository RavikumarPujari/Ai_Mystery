export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId: string;
}

export class ApiError extends Error {
  public code: string;
  public details?: unknown;
  public requestId?: string;

  constructor(message: string, code = "API_ERROR", details?: unknown, requestId?: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

// Guest session ID management in localStorage / header
const GUEST_SESSION_KEY = "ai_mystery_guest_session_id";

export function getGuestSessionId(): string {
  let id = localStorage.getItem(GUEST_SESSION_KEY);
  if (!id) {
    id = "guest_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem(GUEST_SESSION_KEY, id);
  }
  return id;
}

/**
 * Returns the configured backend API base URL.
 * - In local development: defaults to empty string "", delegating to the Vite dev proxy.
 * - In production (Vercel): reads `VITE_API_BASE_URL` (e.g. https://your-backend.onrender.com).
 */
export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (!envUrl || typeof envUrl !== "string") {
    return "";
  }
  return envUrl.trim().replace(/\/+$/, "");
}

/**
 * Builds the full target URL for an API endpoint.
 * Prevents accidental duplicate /api or /api/v1 prefixes and respects absolute URLs.
 */
export function buildApiUrl(endpoint: string): string {
  // If endpoint is already an absolute HTTP/HTTPS URL, return as-is
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }

  const base = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  // If no base URL is defined (local dev), return relative path for Vite proxy
  if (!base) {
    return cleanEndpoint;
  }

  // Prevent duplicate /api/v1 prefix if the base URL already includes it
  if (base.endsWith("/api/v1") && cleanEndpoint.startsWith("/api/v1")) {
    return `${base.replace(/\/api\/v1$/, "")}${cleanEndpoint}`;
  }
  if (base.endsWith("/api") && cleanEndpoint.startsWith("/api")) {
    return `${base.replace(/\/api$/, "")}${cleanEndpoint}`;
  }

  return `${base}${cleanEndpoint}`;
}

/**
 * Resolves static media and upload URLs (e.g. /uploads/key.png).
 * - In local development: returns relative /uploads/... (handled by Vite proxy).
 * - In production (Vercel): prepends the Render backend origin so images load cross-origin.
 * - Preserves already absolute URLs, data URIs, and SVGs.
 */
export function resolveMediaUrl(url?: string | null): string {
  if (!url) return "";

  // If already absolute URL (http://, https://, data:, blob:) return as-is
  if (/^(?:[a-z]+:)?\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }

  const base = getApiBaseUrl();
  const cleanUrl = url.startsWith("/") ? url : `/${url}`;

  // If base URL has a trailing /api/v1 or /api, strip it to point to server root
  const serverOrigin = base.replace(/\/api(?:\/v1)?\/?$/, "");

  return serverOrigin ? `${serverOrigin}${cleanUrl}` : cleanUrl;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = buildApiUrl(endpoint);

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("X-Guest-Session-Id", getGuestSessionId());

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const json: ApiResponse<T> = await response.json().catch(() => ({
    success: false,
    error: {
      code: "PARSE_ERROR",
      message: "Failed to parse server response",
    },
    requestId: "unknown",
  }));

  if (!response.ok || !json.success) {
    throw new ApiError(
      json.error?.message || `Request failed with HTTP status ${response.status}`,
      json.error?.code || "HTTP_ERROR",
      json.error?.details,
      json.requestId
    );
  }

  return json.data as T;
}

