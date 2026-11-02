import { Response } from "express";

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

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): Response {
  const requestId = (res.req as unknown as { id?: string }).id || "req_unknown";
  const payload: ApiResponse<T> = {
    success: true,
    data,
    requestId,
  };
  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
  details?: unknown
): Response {
  const requestId = (res.req as unknown as { id?: string }).id || "req_unknown";
  const payload: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
    requestId,
  };
  return res.status(statusCode).json(payload);
}

