import { Router, Request, Response } from "express";
import { InvestigationModel } from "../models/Investigation.model.js";
import { MysteryModel } from "../models/Mystery.model.js";
import { memInvestigations, memMysteries } from "../services/mystery/mystery.repository.js";
import { sendSuccess } from "../utils/response.js";

const router = Router();

export interface InvestigationHistoryItem {
  investigationId: string;
  mysteryId: string;
  caseTitle: string;
  caseNumber: string;
  genre: string;
  difficulty: string;
  status: "in_progress" | "completed" | "abandoned";
  isCorrect?: boolean;
  reviewedEvidenceCount: number;
  totalEvidenceCount: number;
  createdAt: string;
  completedAt?: string;
}

/**
 * GET /api/v1/investigations - List current player's case investigation history (Section 4.8)
 */
router.get("/investigations", async (req: Request, res: Response, next) => {
  try {
    const guestSessionId = (req.headers["x-guest-session-id"] as string) || "guest_default";
    const historyItems: InvestigationHistoryItem[] = [];

    let investigations: any[] = [];
    try {
      investigations = await InvestigationModel.find({
        guestSessionId,
      })
        .sort({ createdAt: -1 })
        .lean()
        .exec();
    } catch (dbErr) {
      // Fallback
    }

    if (investigations && investigations.length > 0) {
      const mysteryIds = investigations.map((inv) => inv.mysteryId);
      let mysteries: any[] = [];
      try {
        mysteries = await MysteryModel.find({ _id: { $in: mysteryIds } })
          .lean()
          .exec();
      } catch {
        // Fallback
      }

      const mysteryMap = new Map<string, any>();
      for (const m of mysteries || []) {
        mysteryMap.set(m._id.toString(), m);
      }

      for (const inv of investigations) {
        const mystery = mysteryMap.get(inv.mysteryId.toString()) || memMysteries.get(inv.mysteryId.toString());
        historyItems.push({
          investigationId: inv._id.toString(),
          mysteryId: inv.mysteryId.toString(),
          caseTitle: mystery?.publicCase?.title || mystery?.title || "Classified Incident",
          caseNumber: mystery?.publicCase?.caseNumber || "CASE-UNKNOWN",
          genre: mystery?.publicCase?.genre || mystery?.genre || "theft",
          difficulty: mystery?.publicCase?.difficulty || mystery?.difficulty || "medium",
          status: inv.status,
          isCorrect: inv.isCorrect,
          reviewedEvidenceCount: inv.reviewedEvidenceIds?.length || 0,
          totalEvidenceCount: mystery?.publicCase?.evidence?.length || 0,
          createdAt: inv.createdAt ? new Date(inv.createdAt).toISOString() : new Date().toISOString(),
          completedAt: inv.completedAt ? new Date(inv.completedAt).toISOString() : undefined,
        });
      }
    } else {
      // In-memory fallback
      for (const inv of memInvestigations.values()) {
        if (inv.guestSessionId === guestSessionId) {
          const mystery = memMysteries.get(inv.mysteryId.toString());
          historyItems.push({
            investigationId: inv._id.toString(),
            mysteryId: inv.mysteryId.toString(),
            caseTitle: mystery?.publicCase?.title || mystery?.title || "Classified Incident",
            caseNumber: mystery?.publicCase?.caseNumber || "CASE-MEM",
            genre: mystery?.publicCase?.genre || mystery?.genre || "theft",
            difficulty: mystery?.publicCase?.difficulty || mystery?.difficulty || "medium",
            status: inv.status,
            isCorrect: inv.isCorrect,
            reviewedEvidenceCount: inv.reviewedEvidenceIds?.length || 0,
            totalEvidenceCount: mystery?.publicCase?.evidence?.length || 0,
            createdAt: inv.createdAt ? new Date(inv.createdAt).toISOString() : new Date().toISOString(),
            completedAt: inv.completedAt ? new Date(inv.completedAt).toISOString() : undefined,
          });
        }
      }
    }

    sendSuccess(res, historyItems);
  } catch (err) {
    next(err);
  }
});

export default router;
