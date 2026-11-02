import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import { sendSuccess } from "../utils/response.js";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  const dbStateMap: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const dbStatus = dbStateMap[mongoose.connection.readyState] || "unknown";

  sendSuccess(res, {
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      api: "healthy",
      database: dbStatus,
    },
  });
});

export default router;

