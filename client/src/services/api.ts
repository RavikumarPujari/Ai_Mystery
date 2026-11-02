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

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("X-Guest-Session-Id", getGuestSessionId());

  const response = await fetch(endpoint, {
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

