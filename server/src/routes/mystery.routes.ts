import { Router, Request, Response } from "express";
import { z } from "zod";
import { createRateLimiter } from "../middleware/rateLimiter.js";
import { mysteryGenerator } from "../services/mystery/generation/mysteryGenerator.js";
import { mysteryRepository } from "../services/mystery/mystery.repository.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  toInvestigationResultDto,
} from "../utils/dto/mysteryDto.js";
import { InvestigationModel } from "../models/Investigation.model.js";
import { MysterySolutionModel } from "../models/MysterySolution.model.js";
import { MysteryModel } from "../models/Mystery.model.js";

const router = Router();

// Zod validation schemas
const createMysterySchema = z.object({
  scenario: z.string().min(50).max(3000),
  genre: z
    .enum([
      "theft",
      "murder",
      "disappearance",
      "corporate",
      "museum",
      "digital",
      "suspicious_incident",
      "general",
    ])
    .optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  suspectCount: z.number().int().min(3).max(5).optional(),
  evidencePreferences: z.array(z.string()).optional(),
  generateMedia: z.boolean().optional(),
});

const progressSchema = z.object({
  reviewedEvidenceIds: z.array(z.string()),
});

const accusationSchema = z.object({
  suspectId: z.string().min(1),
  reasoning: z.string().max(2000).optional(),
});

const mysteryCreationLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 10,
  message: "Too many mystery creation requests. Please wait before creating another case.",
});

/**
 * POST /api/v1/mysteries - Create/synthesize an investigation
 */
router.post("/mysteries", mysteryCreationLimiter, async (req: Request, res: Response, next) => {
  try {
    const validated = createMysterySchema.parse(req.body);
    const guestSessionId = (req.headers["x-guest-session-id"] as string) || "guest_default";

    const result = await mysteryGenerator.generate({
      ...validated,
      guestSessionId,
    });

    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/mysteries/:id/status - Retrieve generation status
 */
router.get("/mysteries/:id/status", async (req: Request, res: Response, next) => {
  try {
    const mystery = await mysteryRepository.findPublicMysteryById(req.params.id);
    if (!mystery) {
      throw new AppError("Mystery not found", 404, "NOT_FOUND");
    }

    sendSuccess(res, {
      id: mystery.id,
      status: mystery.status,
      stage: "ready",
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/mysteries/:id - Retrieve public investigation dossier
 */
router.get("/mysteries/:id", async (req: Request, res: Response, next) => {
  try {
    const publicDto = await mysteryRepository.findPublicMysteryById(req.params.id);
    if (!publicDto) {
      throw new AppError("Mystery not found", 404, "NOT_FOUND");
    }

    sendSuccess(res, publicDto);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/mysteries/:id/evidence/:evidenceId - Retrieve single evidence item
 */
router.get("/mysteries/:id/evidence/:evidenceId", async (req: Request, res: Response, next) => {
  try {
    const publicDto = await mysteryRepository.findPublicMysteryById(req.params.id);
    if (!publicDto) {
      throw new AppError("Mystery not found", 404, "NOT_FOUND");
    }

    const item = publicDto.evidence.find((e) => e.id === req.params.evidenceId);
    if (!item) {
      throw new AppError("Evidence item not found", 404, "NOT_FOUND");
    }

    sendSuccess(res, item);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/mysteries/:id/timeline - Retrieve public timeline
 */
router.get("/mysteries/:id/timeline", async (req: Request, res: Response, next) => {
  try {
    const publicDto = await mysteryRepository.findPublicMysteryById(req.params.id);
    if (!publicDto) {
      throw new AppError("Mystery not found", 404, "NOT_FOUND");
    }

    sendSuccess(res, publicDto.timeline);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/investigations/start/:mysteryId - Start or resume an investigation session
 */
router.post("/investigations/start/:mysteryId", async (req: Request, res: Response, next) => {
  try {
    const guestSessionId = (req.headers["x-guest-session-id"] as string) || "guest_default";
    const investigation = await mysteryRepository.findOrCreateInvestigation(
      req.params.mysteryId,
      guestSessionId
    );

    sendSuccess(res, {
      investigationId: investigation._id.toString(),
      mysteryId: investigation.mysteryId.toString(),
      status: investigation.status,
      reviewedEvidenceIds: investigation.reviewedEvidenceIds,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/investigations/:id/progress - Update reviewed evidence
 */
router.patch("/investigations/:id/progress", async (req: Request, res: Response, next) => {
  try {
    const validated = progressSchema.parse(req.body);
    const guestSessionId = (req.headers["x-guest-session-id"] as string) || "guest_default";

    const updated = await mysteryRepository.updateInvestigationProgress(
      req.params.id,
      validated.reviewedEvidenceIds,
      guestSessionId
    );

    sendSuccess(res, {
      investigationId: updated._id.toString(),
      reviewedEvidenceIds: updated.reviewedEvidenceIds,
      status: updated.status,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/investigations/:id/accusation - Final accusation submission
 */
router.post("/investigations/:id/accusation", async (req: Request, res: Response, next) => {
  try {
    const validated = accusationSchema.parse(req.body);
    const guestSessionId = (req.headers["x-guest-session-id"] as string) || "guest_default";

    const result = await mysteryRepository.submitAccusation(
      req.params.id,
      validated.suspectId,
      validated.reasoning,
      guestSessionId
    );

    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/investigations/:id/result - Retrieve solution post-accusation (Section 9.11)
 */
router.get("/investigations/:id/result", async (req: Request, res: Response, next) => {
  try {
    const guestSessionId = (req.headers["x-guest-session-id"] as string) || "guest_default";
    const resultPayload = await mysteryRepository.getInvestigationResult(
      req.params.id,
      guestSessionId
    );
    sendSuccess(res, resultPayload);
  } catch (err) {
    next(err);
  }
});

export default router;

