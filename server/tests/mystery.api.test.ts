import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { mysteryGenerator } from "../src/services/mystery/generation/mysteryGenerator.js";
import { mysteryRepository } from "../src/services/mystery/mystery.repository.js";

describe("Mystery & Investigation API Endpoints", () => {
  it("POST /api/v1/mysteries rejects scenario with fewer than 50 characters", async () => {
    const res = await request(app)
      .post("/api/v1/mysteries")
      .send({
        scenario: "Too short.",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("POST /api/v1/mysteries generates mystery and returns 201 with id", async () => {
    vi.spyOn(mysteryGenerator, "generate").mockResolvedValue({
      id: "507f1f77bcf86cd799439011",
      caseNumber: "CASE-2026-TEST",
      title: "The Gallery Heist",
      status: "ready",
    });

    const res = await request(app)
      .post("/api/v1/mysteries")
      .set("X-Guest-Session-Id", "guest_test_session")
      .send({
        scenario:
          "During an invitation-only preview at the St. Jude Contemporary Gallery, a 14-minute power grid failure disabled secondary sensors.",
        genre: "theft",
        difficulty: "medium",
        suspectCount: 4,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe("507f1f77bcf86cd799439011");
    expect(res.body.data.status).toBe("ready");

    vi.restoreAllMocks();
  });

  it("GET /api/v1/mysteries/:id returns public case dossier without private solution", async () => {
    vi.spyOn(mysteryRepository, "findPublicMysteryById").mockResolvedValue({
      id: "507f1f77bcf86cd799439011",
      caseNumber: "CASE-2026-TEST",
      title: "The Gallery Heist",
      originalScenario: "A valuable painting was stolen.",
      genre: "theft",
      difficulty: "medium",
      status: "ready",
      summary: "Case summary",
      location: "Gallery Foyer",
      incidentTime: "23:45",
      suspects: [
        {
          id: "suspect_001",
          name: "Arthur Finch",
          role: "Curator",
          relationship: "Has keys",
          initialStatement: "I was in the office.",
        },
      ],
      evidence: [
        {
          id: "evidence_001",
          type: "chat",
          title: "Dispatch chat",
          description: "Chat log",
          source: "Radio",
          relatedSuspectIds: ["suspect_001"],
          content: {},
        },
      ],
      timeline: [
        {
          id: "time_001",
          time: "23:40",
          description: "Lights flickered",
          relatedSuspectIds: ["suspect_001"],
          relatedEvidenceIds: ["evidence_001"],
          isVerified: true,
        },
      ],
      createdAt: new Date().toISOString(),
    });

    const res = await request(app).get("/api/v1/mysteries/507f1f77bcf86cd799439011");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe("The Gallery Heist");
    expect(res.body.data.suspects).toHaveLength(1);

    // Verify culprit and private solution are NOT present in the response
    expect(res.body.data.culpritSuspectId).toBeUndefined();
    expect(res.body.data.motive).toBeUndefined();
    expect(res.body.data.authoritativeTimeline).toBeUndefined();

    vi.restoreAllMocks();
  });
});

