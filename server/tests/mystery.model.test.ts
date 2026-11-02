import { describe, it, expect, vi } from "vitest";
import { Types } from "mongoose";
import { MysteryModel } from "../src/models/Mystery.model.js";
import { MysterySolutionModel } from "../src/models/MysterySolution.model.js";
import { InvestigationModel } from "../src/models/Investigation.model.js";
import {
  toPublicMysteryDto,
  toPublicEvidenceDto,
  toInvestigationResultDto,
} from "../src/utils/dto/mysteryDto.js";
import { PublicCaseData, PrivateSolutionData } from "../src/types/mystery.types.js";
import { mysteryRepository } from "../src/services/mystery/mystery.repository.js";

describe("Mystery Domain & DTO Layer (ADR-001 Zero-Leak Architecture)", () => {
  const mockPublicCase: PublicCaseData = {
    caseNumber: "CASE-2026-TEST",
    title: "The Midnight Vault Heist",
    summary: "A private bank vault was opened without triggering alarms.",
    location: "Zurich Private Bank",
    incidentTime: "2026-10-25 23:45",
    difficulty: "medium",
    genre: "theft",
    suspects: [
      {
        id: "suspect_001",
        name: "Arthur Finch",
        role: "Head Teller",
        relationship: "Access to vault combination",
        initialStatement: "I left the bank at 6 PM sharp.",
      },
      {
        id: "suspect_002",
        name: "Elena Rostova",
        role: "Night Security Guard",
        relationship: "On duty during the incident",
        initialStatement: "I noticed the camera flicker at 11:40 PM.",
      },
      {
        id: "suspect_003",
        name: "Marcus Vance",
        role: "Vault Technician",
        relationship: "Serviced the lock two days prior",
        initialStatement: "I was at a dinner party across town.",
      },
    ],
    evidence: [
      {
        id: "evidence_001",
        type: "chat",
        title: "Security Guard Shift Handover Chat",
        description: "Simulated messaging between guards",
        source: "Guard station terminal",
        relatedSuspectIds: ["suspect_002"],
        content: {
          conversationId: "conv_001",
          channelName: "Security Night Shift",
          participants: ["Elena Rostova", "Day Dispatch"],
          messages: [
            {
              id: "msg_1",
              senderName: "Elena Rostova",
              timestamp: "23:42",
              text: "Power fluctuated on sector 4.",
            },
          ],
          disclaimer: "SIMULATED EVIDENCE",
        },
      },
    ],
    timeline: [
      {
        id: "time_001",
        time: "23:40",
        description: "Sector 4 camera feed drops off.",
        relatedSuspectIds: ["suspect_002"],
        relatedEvidenceIds: ["evidence_001"],
        isVerified: true,
      },
    ],
  };

  const mockPrivateSolution: Omit<PrivateSolutionData, "mysteryId"> = {
    culpritSuspectId: "suspect_002",
    motive: "Financial debt to a syndicate.",
    opportunity: "Sole security officer unmonitored between 23:30 and 00:00.",
    method: "Used a bypass key while reporting false camera flicker.",
    explanation: "Elena tampered with the security circuit herself.",
    authoritativeTimeline: [
      {
        id: "auth_time_001",
        time: "23:40",
        trueEvent: "Elena disconnected the camera power feed manually.",
        actors: ["suspect_002"],
        isContradictedByLies: true,
        correspondingEvidenceIds: ["evidence_001"],
      },
    ],
    decisiveEvidenceIds: ["evidence_001"],
    redHerringExplanations: [
      "Arthur Finch left at 6 PM as confirmed by transit records.",
    ],
    suspectTruthRecords: [
      {
        suspectId: "suspect_002",
        isCulprit: true,
        trueAlibi: "Inside the vault.",
        statedAlibi: "At the guard console.",
        liesTold: ["Camera flickered by itself"],
        factsKnown: ["Vault alarm code"],
      },
    ],
  };

  it("validates MysteryModel schema successfully with valid publicCase", async () => {
    const mysteryDoc = new MysteryModel({
      title: "The Midnight Vault Heist",
      originalScenario: "A bank vault was breached during the night shift.",
      genre: "theft",
      difficulty: "medium",
      guestSessionId: "guest_session_123",
      status: "ready",
      publicCase: mockPublicCase,
    });

    const error = mysteryDoc.validateSync();
    expect(error).toBeUndefined();
    expect(mysteryDoc.title).toBe("The Midnight Vault Heist");
    expect(mysteryDoc.publicCase.suspects.length).toBe(3);
  });

  it("rejects MysteryModel when required title or publicCase is missing", () => {
    const invalidDoc = new MysteryModel({
      originalScenario: "No title provided",
    });

    const error = invalidDoc.validateSync();
    expect(error).toBeDefined();
    expect(error?.errors.title).toBeDefined();
    expect(error?.errors.publicCase).toBeDefined();
  });

  it("validates MysterySolutionModel schema independently (ADR-001)", () => {
    const fakeMysteryId = new Types.ObjectId();
    const solutionDoc = new MysterySolutionModel({
      mysteryId: fakeMysteryId,
      culpritSuspectId: mockPrivateSolution.culpritSuspectId,
      motive: mockPrivateSolution.motive,
      opportunity: mockPrivateSolution.opportunity,
      method: mockPrivateSolution.method,
      explanation: mockPrivateSolution.explanation,
      authoritativeTimeline: mockPrivateSolution.authoritativeTimeline,
      decisiveEvidenceIds: mockPrivateSolution.decisiveEvidenceIds,
      redHerringExplanations: mockPrivateSolution.redHerringExplanations,
      suspectTruthRecords: mockPrivateSolution.suspectTruthRecords,
    });

    const error = solutionDoc.validateSync();
    expect(error).toBeUndefined();
    expect(solutionDoc.culpritSuspectId).toBe("suspect_002");
    expect(solutionDoc.mysteryId).toEqual(fakeMysteryId);
  });

  it("enforces Zero-Leak Guarantee in toPublicMysteryDto", () => {
    const mysteryDoc = new MysteryModel({
      _id: new Types.ObjectId(),
      title: "The Midnight Vault Heist",
      originalScenario: "A bank vault was breached during the night shift.",
      genre: "theft",
      difficulty: "medium",
      guestSessionId: "guest_session_123",
      status: "ready",
      publicCase: mockPublicCase,
      createdAt: new Date(),
    });

    const publicDto = toPublicMysteryDto(mysteryDoc);

    // Verify allowed public fields
    expect(publicDto.title).toBe("The Midnight Vault Heist");
    expect(publicDto.caseNumber).toBe("CASE-2026-TEST");
    expect(publicDto.suspects.length).toBe(3);
    expect(publicDto.evidence.length).toBe(1);
    expect(publicDto.timeline.length).toBe(1);

    // Strict security assertions: ZERO private solution fields
    const keys = Object.keys(publicDto);
    expect(keys).not.toContain("culpritSuspectId");
    expect(keys).not.toContain("motive");
    expect(keys).not.toContain("opportunity");
    expect(keys).not.toContain("method");
    expect(keys).not.toContain("explanation");
    expect(keys).not.toContain("authoritativeTimeline");
    expect(keys).not.toContain("suspectTruthRecords");
    expect(keys).not.toContain("decisiveEvidenceIds");
    expect(keys).not.toContain("redHerringExplanations");
  });

  it("allows retrieving specific evidence with toPublicEvidenceDto", () => {
    const mysteryDoc = new MysteryModel({
      _id: new Types.ObjectId(),
      title: "The Midnight Vault Heist",
      originalScenario: "A bank vault was breached during the night shift.",
      publicCase: mockPublicCase,
      createdAt: new Date(),
    });

    const evidence = toPublicEvidenceDto(mysteryDoc, "evidence_001");
    expect(evidence).not.toBeNull();
    expect(evidence?.id).toBe("evidence_001");
    expect(evidence?.type).toBe("chat");

    const nonExistent = toPublicEvidenceDto(mysteryDoc, "evidence_999");
    expect(nonExistent).toBeNull();
  });

  it("formats post-accusation outcome correctly with toInvestigationResultDto", () => {
    const fakeMysteryId = new Types.ObjectId();
    const investigationDoc = new InvestigationModel({
      _id: new Types.ObjectId(),
      mysteryId: fakeMysteryId,
      status: "completed",
      submittedSuspectId: "suspect_002",
      isCorrect: true,
      completedAt: new Date(),
    });

    const solutionDoc = new MysterySolutionModel({
      mysteryId: fakeMysteryId,
      culpritSuspectId: "suspect_002",
      motive: "Financial debt to a syndicate.",
      opportunity: "Sole security officer on duty.",
      method: "Key bypass.",
      explanation: "Elena tampered with the security circuit herself.",
      authoritativeTimeline: mockPrivateSolution.authoritativeTimeline,
      decisiveEvidenceIds: mockPrivateSolution.decisiveEvidenceIds,
      redHerringExplanations: mockPrivateSolution.redHerringExplanations,
    });

    const culpritSuspect = mockPublicCase.suspects[1]; // Elena Rostova

    const result = toInvestigationResultDto(investigationDoc, solutionDoc, culpritSuspect);

    expect(result.status).toBe("completed");
    expect(result.isCorrect).toBe(true);
    expect(result.actualCulpritId).toBe("suspect_002");
    expect(result.actualCulpritName).toBe("Elena Rostova");
    expect(result.motive).toBe("Financial debt to a syndicate.");
    expect(result.decisiveEvidenceIds).toContain("evidence_001");
  });

  it("rejects accusations for invalid suspects not in the case", async () => {
    const fakeMysteryId = new Types.ObjectId();
    const fakeInvestigationId = new Types.ObjectId();

    // Mock findById for Investigation and Mystery
    vi.spyOn(InvestigationModel, "findById").mockResolvedValue({
      _id: fakeInvestigationId,
      mysteryId: fakeMysteryId,
      status: "in_progress",
      guestSessionId: "session_abc",
    } as any);

    vi.spyOn(MysteryModel, "findById").mockResolvedValue({
      _id: fakeMysteryId,
      publicCase: mockPublicCase,
    } as any);

    await expect(
      mysteryRepository.submitAccusation(
        fakeInvestigationId.toString(),
        "unrelated_suspect_id",
        "Reasoning",
        "session_abc"
      )
    ).rejects.toThrow("does not belong to this mystery");

    vi.restoreAllMocks();
  });
});

