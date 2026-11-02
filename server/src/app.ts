import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { requestIdMiddleware } from "./middleware/requestId.js";
import { errorHandler } from "./middleware/errorHandler.js";
import healthRoutes from "./routes/health.routes.js";
import mysteryRoutes from "./routes/mystery.routes.js";
import historyRoutes from "./routes/history.routes.js";
import { imageGenerationService } from "./services/media/imageGeneration.service.js";

export function createApp(): express.Application {
  const app = express();

  // Security Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  // CORS Configuration
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id", "X-Guest-Session-Id"],
    })
  );

  // Request ID
  app.use(requestIdMiddleware);

  // Body Parsing with size limits
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(cookieParser());

  // Base Health Endpoint
  app.use("/health", healthRoutes);
  app.use(`${env.API_PREFIX}/health`, healthRoutes);

  // Mystery and Investigation Endpoints
  app.use(env.API_PREFIX, mysteryRoutes);
  app.use(env.API_PREFIX, historyRoutes);

  // Static files for media storage if local, with seamless MongoDB Atlas fallback for Render Free
  if (env.MEDIA_STORAGE_PROVIDER === "local") {
    app.use("/uploads", express.static(env.MEDIA_STORAGE_PATH));
    app.use("/uploads/:key", async (req, res, next) => {
      try {
        const key = req.params.key;
        const media = await imageGenerationService.getMediaBuffer(key);
        if (media) {
          res.setHeader("Content-Type", media.mimeType);
          res.setHeader("Cache-Control", "public, max-age=86400");
          return res.send(media.buffer);
        }
        next();
      } catch (err) {
        next(err);
      }
    });
  }

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Resource not found",
      },
      requestId: (_req as unknown as { id?: string }).id || "req_unknown",
    });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();

