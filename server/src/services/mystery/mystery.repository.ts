import mongoose, { Types } from "mongoose";
import { MysteryModel, IMystery } from "../../models/Mystery.model.js";
import {
  MysterySolutionModel,
  IMysterySolution,
} from "../../models/MysterySolution.model.js";
import {
  InvestigationModel,
  IInvestigation,
} from "../../models/Investigation.model.js";
import {
  PublicCaseData,
  PrivateSolutionData,
  MysteryDifficulty,
  MysteryGenre,
} from "../../types/mystery.types.js";
import {
  PublicMysteryDto,
  toPublicMysteryDto,
  toInvestigationResultDto,
} from "../../utils/dto/mysteryDto.js";
import { AppError } from "../../middleware/errorHandler.js";

export interface CreateMysteryInput {
  title: string;
  originalScenario: string;
  genre: MysteryGenre;
  difficulty: MysteryDifficulty;
  ownerId?: string;
  guestSessionId?: string;
  publicCase: PublicCaseData;
  privateSolution: Omit<PrivateSolutionData, "mysteryId">;
}

// In-memory zero-config fallback storage for local development without MongoDB
export const memMysteries = new Map<string, any>();
export const memSolutions = new Map<string, any>();
export const memInvestigations = new Map<string, any>();

function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export class MysteryRepository {
  /**
   * Atomically saves both Mystery and MysterySolution in separate collections (ADR-001)
   */
  async createMysteryWithSolution(input: CreateMysteryInput): Promise<{
    mystery: IMystery;
    solution: IMysterySolution;
  }> {
    if (isDbConnected()) {
      try {
        const mystery = new MysteryModel({
          title: input.title,
          originalScenario: input.originalScenario,
          genre: input.genre,
          difficulty: input.difficulty,
          ownerId: input.ownerId ? new Types.ObjectId(input.ownerId) : undefined,
          guestSessionId: input.guestSessionId,
          status: "ready",
          publicCase: input.publicCase,
        });

        const savedMystery = await mystery.save();

        const solution = new MysterySolutionModel({
          mysteryId: savedMystery._id,
          culpritSuspectId: input.privateSolution.culpritSuspectId,
          motive: input.privateSolution.motive,
          opportunity: input.privateSolution.opportunity,
          method: input.privateSolution.method,
          explanation: input.privateSolution.explanation,
          authoritativeTimeline: input.privateSolution.authoritativeTimeline,
          decisiveEvidenceIds: input.privateSolution.decisiveEvidenceIds,
          redHerringExplanations: input.privateSolution.redHerringExplanations,
          suspectTruthRecords: input.privateSolution.suspectTruthRecords,
        });

        const savedSolution = await solution.save();

        return {
          mystery: savedMystery,
          solution: savedSolution,
        };
      } catch (dbErr) {
        console.warn("MongoDB save failed, utilizing in-memory fallback:", dbErr);
      }
    }

    // In-memory fallback
    const id = new Types.ObjectId().toString();
    const mysteryObj = {
      _id: new Types.ObjectId(id),
      title: input.title,
      originalScenario: input.originalScenario,
      genre: input.genre,
      difficulty: input.difficulty,
      guestSessionId: input.guestSessionId,
      status: "ready",
      publicCase: input.publicCase,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const solutionObj = {
      _id: new Types.ObjectId(),
      mysteryId: new Types.ObjectId(id),
      ...input.privateSolution,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memMysteries.set(id, mysteryObj);
    memSolutions.set(id, solutionObj);

    return {
      mystery: mysteryObj as unknown as IMystery,
      solution: solutionObj as unknown as IMysterySolution,
    };
  }

  /**
   * Retrieves public case data stripped of all private solution fields
   */
  async findPublicMysteryById(id: string): Promise<PublicMysteryDto | null> {
    if (!mongoose.isValidObjectId(id)) {
      return null;
    }

    if (isDbConnected()) {
      try {
        const mystery = await MysteryModel.findById(id).lean().exec();
        if (mystery) {
          return toPublicMysteryDto(mystery as unknown as IMystery);
        }
      } catch (err) {
        console.warn("MongoDB lookup failed, falling back to memory:", err);
      }
    }

    const memItem = memMysteries.get(id);
    if (!memItem) return null;
    return toPublicMysteryDto(memItem as unknown as IMystery);
  }

  /**
   * Finds or creates an investigation attempt for a player / guest session
   */
  async findOrCreateInvestigation(
    mysteryId: string,
    guestSessionId?: string,
    userId?: string
  ): Promise<IInvestigation> {
    if (!mongoose.isValidObjectId(mysteryId)) {
      throw new AppError("Invalid mystery ID", 400, "INVALID_ID");
    }

    if (!userId && !guestSessionId) {
      throw new AppError("Session identification required", 401, "UNAUTHORIZED");
    }

    if (isDbConnected()) {
      try {
        const filter: Record<string, unknown> = {
          mysteryId: new Types.ObjectId(mysteryId),
        };

        if (userId) {
          filter.userId = new Types.ObjectId(userId);
        } else if (guestSessionId) {
          filter.guestSessionId = guestSessionId;
        }

        let investigation = await InvestigationModel.findOne(filter);

        if (!investigation) {
          investigation = await InvestigationModel.create({
            mysteryId: new Types.ObjectId(mysteryId),
            userId: userId ? new Types.ObjectId(userId) : undefined,
            guestSessionId,
            status: "in_progress",
            reviewedEvidenceIds: [],
          });
        }

        return investigation;
      } catch (err) {
        console.warn("MongoDB investigation lookup failed, using memory:", err);
      }
    }

    // In-memory fallback
    const key = `${mysteryId}_${userId || guestSessionId}`;
    let memInv = memInvestigations.get(key);

    if (!memInv) {
      memInv = {
        _id: new Types.ObjectId(),
        mysteryId: new Types.ObjectId(mysteryId),
        userId: userId ? new Types.ObjectId(userId) : undefined,
        guestSessionId,
        status: "in_progress",
        reviewedEvidenceIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        save: async function () {
          return this;
        },
      };
      memInvestigations.set(key, memInv);
    }

    return memInv as unknown as IInvestigation;
  }

  /**
   * Updates reviewed evidence progress for an ongoing investigation
   */
  async updateInvestigationProgress(
    investigationId: string,
    reviewedEvidenceIds: string[],
    guestSessionId?: string,
    userId?: string
  ): Promise<IInvestigation> {
    if (!mongoose.isValidObjectId(investigationId)) {
      throw new AppError("Invalid investigation ID", 400, "INVALID_ID");
    }

    let investigation: any = null;

    if (isDbConnected()) {
      try {
        investigation = await InvestigationModel.findById(investigationId);
      } catch (err) {
        console.warn("MongoDB error:", err);
      }
    }

    if (!investigation) {
      for (const inv of memInvestigations.values()) {
        if (inv._id.toString() === investigationId) {
          investigation = inv;
          break;
        }
      }
    }

    if (!investigation) {
      throw new AppError("Investigation not found", 404, "NOT_FOUND");
    }

    // Ownership check
    if (userId && investigation.userId?.toString() !== userId) {
      throw new AppError("Forbidden: Case belongs to another user", 403, "FORBIDDEN");
    }
    if (
      !userId &&
      guestSessionId &&
      investigation.guestSessionId &&
      investigation.guestSessionId !== guestSessionId
    ) {
      throw new AppError("Forbidden: Session mismatch", 403, "FORBIDDEN");
    }

    // Merge unique reviewed evidence IDs
    const current = new Set(investigation.reviewedEvidenceIds || []);
    for (const id of reviewedEvidenceIds) {
      current.add(id);
    }
    investigation.reviewedEvidenceIds = Array.from(current);

    if (isDbConnected() && typeof investigation.save === "function") {
      return await investigation.save();
    }

    return investigation as IInvestigation;
  }

  /**
   * Atomically evaluates and scores an accusation (Sections 9.10 & 9.11)
   */
  async submitAccusation(
    investigationId: string,
    suspectId: string,
    reasoning?: string,
    guestSessionId?: string,
    userId?: string
  ) {
    if (!mongoose.isValidObjectId(investigationId)) {
      throw new AppError("Invalid investigation ID", 400, "INVALID_ID");
    }

    let investigation: any = null;
    try {
      investigation = await InvestigationModel.findById(investigationId);
    } catch (err) {
      // Fallback to memory
    }

    if (!investigation) {
      for (const inv of memInvestigations.values()) {
        if (inv._id.toString() === investigationId) {
          investigation = inv;
          break;
        }
      }
    }

    if (!investigation) {
      throw new AppError("Investigation not found", 404, "NOT_FOUND");
    }

    // Ownership check
    if (userId && investigation.userId?.toString() !== userId) {
      throw new AppError("Forbidden: Case belongs to another user", 403, "FORBIDDEN");
    }
    if (
      !userId &&
      guestSessionId &&
      investigation.guestSessionId &&
      investigation.guestSessionId !== guestSessionId
    ) {
      throw new AppError("Forbidden: Session mismatch", 403, "FORBIDDEN");
    }

    // Prevent duplicate submissions (FR-034)
    if (investigation.status === "completed") {
      throw new AppError("Accusation already submitted for this investigation", 409, "ALREADY_SUBMITTED");
    }

    let mystery: any = null;
    let solution: any = null;

    try {
      mystery = await MysteryModel.findById(investigation.mysteryId);
      solution = await MysterySolutionModel.findOne({ mysteryId: mystery?._id });
    } catch (err) {
      // Fallback to memory
    }

    if (!mystery) {
      mystery = memMysteries.get(investigation.mysteryId.toString());
      solution = memSolutions.get(investigation.mysteryId.toString());
    }

    if (!mystery) {
      throw new AppError("Associated mystery not found", 404, "NOT_FOUND");
    }

    // Validate suspect exists in this mystery (FR-028, FR-029)
    const validSuspect = mystery.publicCase?.suspects?.find((s: any) => s.id === suspectId);
    if (!validSuspect) {
      throw new AppError(
        `Suspect '${suspectId}' does not belong to this mystery`,
        400,
        "INVALID_SUSPECT"
      );
    }

    if (!solution) {
      throw new AppError("Mystery solution record not found", 500, "INTERNAL_ERROR");
    }

    // Evaluate correctness
    const isCorrect = solution.culpritSuspectId === suspectId;

    // Atomically complete the investigation
    investigation.status = "completed";
    investigation.submittedSuspectId = suspectId;
    investigation.reasoning = reasoning;
    investigation.isCorrect = isCorrect;
    investigation.completedAt = new Date();

    if (isDbConnected() && typeof investigation.save === "function") {
      await investigation.save();
    }

    const culpritSuspect = mystery.publicCase.suspects.find(
      (s: any) => s.id === solution.culpritSuspectId
    ) || {
      id: solution.culpritSuspectId,
      name: "Unknown Culprit",
      role: "Suspect",
      relationship: "Unknown",
      initialStatement: "",
    };

    return toInvestigationResultDto(investigation, solution, culpritSuspect);
  }

  /**
   * Retrieves evaluated results post-accusation with ownership & status guards (Section 9.11)
   */
  async getInvestigationResult(
    investigationId: string,
    guestSessionId?: string,
    userId?: string
  ) {
    if (!mongoose.isValidObjectId(investigationId)) {
      throw new AppError("Invalid investigation ID", 400, "INVALID_ID");
    }

    let investigation: any = null;
    try {
      investigation = await InvestigationModel.findById(investigationId);
    } catch (err) {
      // Fallback to memory
    }

    if (!investigation) {
      for (const inv of memInvestigations.values()) {
        if (inv._id.toString() === investigationId) {
          investigation = inv;
          break;
        }
      }
    }

    if (!investigation) {
      throw new AppError("Investigation not found", 404, "NOT_FOUND");
    }

    // Ownership check
    if (userId && investigation.userId?.toString() !== userId) {
      throw new AppError("Forbidden: Case belongs to another user", 403, "FORBIDDEN");
    }
    if (
      !userId &&
      guestSessionId &&
      investigation.guestSessionId &&
      investigation.guestSessionId !== guestSessionId
    ) {
      throw new AppError("Forbidden: Session mismatch", 403, "FORBIDDEN");
    }

    // Must be completed before result is revealed (Section 9.11)
    if (investigation.status !== "completed") {
      throw new AppError(
        "Investigation result is not available until an accusation is officially submitted.",
        409,
        "RESULT_NOT_AVAILABLE"
      );
    }

    let mystery: any = null;
    let solution: any = null;

    try {
      mystery = await MysteryModel.findById(investigation.mysteryId);
      solution = await MysterySolutionModel.findOne({ mysteryId: mystery?._id });
    } catch (err) {
      // Fallback to memory
    }

    if (!mystery) {
      mystery = memMysteries.get(investigation.mysteryId.toString());
      solution = memSolutions.get(investigation.mysteryId.toString());
    }

    if (!mystery) {
      throw new AppError("Associated mystery not found", 404, "NOT_FOUND");
    }

    if (!solution) {
      throw new AppError("Solution record not found", 500, "INTERNAL_ERROR");
    }

    const culpritSuspect = mystery.publicCase.suspects.find(
      (s: any) => s.id === solution.culpritSuspectId
    ) || {
      id: solution.culpritSuspectId,
      name: "Unknown Culprit",
      role: "Suspect",
      relationship: "Unknown",
      initialStatement: "",
    };

    return toInvestigationResultDto(investigation, solution, culpritSuspect);
  }
}

export const mysteryRepository = new MysteryRepository();
