import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { sendError } from "../utils/response.js";

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: unknown;

  constructor(message: string, statusCode = 400, code = "BAD_REQUEST", details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    sendError(res, "VALIDATION_ERROR", "Validation failed for the request payload", 400, err.errors);
    return;
  }

  // Known custom AppError
  if (err instanceof AppError) {
    sendError(res, err.code, err.message, err.statusCode, err.details);
    return;
  }

  // Syntax error (e.g. malformed JSON body)
  if ("type" in err && err.type === "entity.parse.failed") {
    sendError(res, "VALIDATION_ERROR", "Malformed JSON body in request", 400);
    return;
  }

  // Generic unexpected internal error (hide internal stack/details from client)
  console.error("Unhandled Server Error:", err);
  sendError(res, "INTERNAL_ERROR", "An unexpected internal error occurred", 500);
}

