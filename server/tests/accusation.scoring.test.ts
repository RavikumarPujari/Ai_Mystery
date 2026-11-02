import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { InvestigationModel } from "../src/models/Investigation.model.js";
import { MysteryModel } from "../src/models/Mystery.model.js";
import { MysterySolutionModel } from "../src/models/MysterySolution.model.js";
import { mysteryRepository } from "../src/services/mystery/mystery.repository.js";
import { Types } from "mongoose";

describe("Accusation Scoring & Result Reveal (Phase 6, Section 9.10 & 9.11)", () => {
  const fakeMysteryId = new Types.ObjectId();
  const fakeInvestigationId = new Types.ObjectId();
  const guestSession = "guest_scorer_123";

  const mockPublicCase = {
    caseNumber: "CASE-2026-SCORING",
    title: "The St. Jude Gallery Blackout",
    summary: "A canvas was taken during power outage.",
    location: "Gallery Foyer",
    incidentTime: "23:45",
    difficulty: "medium",
    genre: "theft",
    suspects: [
      {
        id: "suspect_001",
        name: "Arthur Finch",
        role: "Head Teller",
        relationship: "Access to codes",
        initialStatement: "I left at 6 PM.",
      },
      {
        id: "suspect_002",
        name: "Elena Rostova",
        role: "Security Guard",
        relationship: "On duty",
        initialStatement: "Camera flickered.",
      },
    ],
    evidence: [],
    timeline: [],
  };

  const mockSolution = {
    mysteryId: fakeMysteryId,
    culpritSuspectId: "suspect_002",
    motive: "Syndicate debt.",
    opportunity: "Alone in corridor.",
    method: "Key bypass.",
    explanation: "Elena tampered with the sensor.",
    authoritativeTimeline: [
      {
        id: "auth_1",
        time: "23:45",
        trueEvent: "Elena extracted the canvas.",
        actors: ["suspect_002"],
        isContradictedByLies: true,
        correspondingEvidenceIds: ["evidence_001"],
      },
    ],
    decisiveEvidenceIds: ["evidence_001"],
    redHerringExplanations: ["Arthur Finch was in his office."],
    suspectTruthRecords: [],
  };

  it("disallows early access to results before accusation submission (Section 9.11)", async () => {
    vi.spyOn(InvestigationModel, "findById").mockResolvedValue({
      _id: fakeInvestigationId,
      mysteryId: fakeMysteryId,
      status: "in_progress", // Not completed yet!
      guestSessionId: guestSession,
    } as any);

    const res = await request(app)
      .get(`/api/v1/investigations/${fakeInvestigationId}/result`)
      .set("X-Guest-Session-Id", guestSession);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("RESULT_NOT_AVAILABLE");

    vi.restoreAllMocks();
  });

  it("scores accusation accurately: evaluates isCorrect and returns solution", async () => {
    vi.spyOn(mysteryRepository, "submitAccusation").mockResolvedValue({
      investigationId: fakeInvestigationId.toString(),
      mysteryId: fakeMysteryId.toString(),
      status: "completed",
      isCorrect: true,
      submittedSuspectId: "suspect_002",
      actualCulpritId: "suspect_002",
      actualCulpritName: "Elena Rostova",
      motive: "Syndicate debt.",
      explanation: "Elena tampered with the sensor.",
      decisiveEvidenceIds: ["evidence_001"],
      redHerringExplanations: ["Arthur Finch was in his office."],
      authoritativeTimeline: mockSolution.authoritativeTimeline,
      completedAt: new Date().toISOString(),
    });

    const res = await request(app)
      .post(`/api/v1/investigations/${fakeInvestigationId}/accusation`)
      .set("X-Guest-Session-Id", guestSession)
      .send({
        suspectId: "suspect_002",
        reasoning: "Her alibi conflicts with the CCTV log.",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isCorrect).toBe(true);
    expect(res.body.data.actualCulpritId).toBe("suspect_002");
    expect(res.body.data.explanation).toContain("Elena tampered");
    expect(res.body.data.decisiveEvidenceIds).toContain("evidence_001");

    vi.restoreAllMocks();
  });

  it("allows retrieval of results after submission via GET /investigations/:id/result", async () => {
    vi.spyOn(InvestigationModel, "findById").mockResolvedValue({
      _id: fakeInvestigationId,
      mysteryId: fakeMysteryId,
      status: "completed", // Completed!
      submittedSuspectId: "suspect_002",
      isCorrect: true,
      completedAt: new Date(),
      guestSessionId: guestSession,
    } as any);

    vi.spyOn(MysteryModel, "findById").mockResolvedValue({
      _id: fakeMysteryId,
      publicCase: mockPublicCase,
    } as any);

    vi.spyOn(MysterySolutionModel, "findOne").mockResolvedValue({
      ...mockSolution,
      _id: new Types.ObjectId(),
    } as any);

    const res = await request(app)
      .get(`/api/v1/investigations/${fakeInvestigationId}/result`)
      .set("X-Guest-Session-Id", guestSession);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("completed");
    expect(res.body.data.actualCulpritName).toBe("Elena Rostova");
    expect(res.body.data.decisiveEvidenceIds).toContain("evidence_001");

    vi.restoreAllMocks();
  });
});

