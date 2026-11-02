import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/response.js";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
}) {
  const store = new Map<string, RateLimitRecord>();

  // Periodic cleanup of expired entries
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (record.resetAt <= now) {
        store.delete(key);
      }
    }
  }, 60000);

  return (req: Request, res: Response, next: NextFunction): void => {
    // Determine client identifier: session ID or IP
    const clientId =
      (req.headers["x-guest-session-id"] as string) ||
      req.ip ||
      "anonymous_client";

    const now = Date.now();
    const record = store.get(clientId);

    if (!record || record.resetAt <= now) {
      store.set(clientId, {
        count: 1,
        resetAt: now + options.windowMs,
      });
      next();
      return;
    }

    if (record.count >= options.maxRequests) {
      sendError(
        res,
        "RATE_LIMITED",
        options.message || "Too many requests. Please slow down.",
        429,
        {
          retryAfterMs: Math.max(0, record.resetAt - now),
        }
      );
      return;
    }

    record.count += 1;
    next();
  };
}

