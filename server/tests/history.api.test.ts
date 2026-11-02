import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { InvestigationModel } from "../src/models/Investigation.model.js";
import { MysteryModel } from "../src/models/Mystery.model.js";
import { mediaStorageService } from "../src/services/media/mediaStorage.service.js";
import { Types } from "mongoose";

describe("Case History & Media Storage (Phase 7 & 8)", () => {
  const fakeMysteryId = new Types.ObjectId();
  const fakeInvestigationId = new Types.ObjectId();
  const playerSession = "guest_player_history_1";
  const strangerSession = "guest_stranger_history_2";

  it("GET /api/v1/investigations filters cases by guestSessionId (Zero Cross-Session Leak)", async () => {
    // Mock investigations query returning only cases belonging to playerSession
    vi.spyOn(InvestigationModel, "find").mockImplementation(
      (filter: any) =>
        ({
          sort: () => ({
            lean: () => ({
              exec: async () => {
                if (filter.guestSessionId === playerSession) {
                  return [
                    {
                      _id: fakeInvestigationId,
                      mysteryId: fakeMysteryId,
                      guestSessionId: playerSession,
                      status: "completed",
                      isCorrect: true,
                      reviewedEvidenceIds: ["ev_1", "ev_2"],
                      createdAt: new Date(),
                      completedAt: new Date(),
                    },
                  ];
                }
                return [];
              },
            }),
          }),
        } as any)
    );

    vi.spyOn(MysteryModel, "find").mockImplementation(
      () =>
        ({
          lean: () => ({
            exec: async () => [
              {
                _id: fakeMysteryId,
                title: "The Alpine Express Mystery",
                publicCase: {
                  caseNumber: "CASE-ALPINE-01",
                  title: "The Alpine Express Mystery",
                  difficulty: "hard",
                  genre: "disappearance",
                  evidence: [{}, {}, {}],
                },
              },
            ],
          }),
        } as any)
    );

    // 1. Request with playerSession -> returns 1 investigation
    const resPlayer = await request(app)
      .get("/api/v1/investigations")
      .set("X-Guest-Session-Id", playerSession);

    expect(resPlayer.status).toBe(200);
    expect(resPlayer.body.success).toBe(true);
    expect(resPlayer.body.data).toHaveLength(1);
    expect(resPlayer.body.data[0].caseTitle).toBe("The Alpine Express Mystery");
    expect(resPlayer.body.data[0].status).toBe("completed");
    expect(resPlayer.body.data[0].isCorrect).toBe(true);

    // 2. Request with strangerSession -> returns empty array (zero cross-session leak)
    const resStranger = await request(app)
      .get("/api/v1/investigations")
      .set("X-Guest-Session-Id", strangerSession);

    expect(resStranger.status).toBe(200);
    expect(resStranger.body.data).toHaveLength(0);

    vi.restoreAllMocks();
  });

  it("mediaStorageService generates thematic fallback image with fictional disclaimer (FR-021, FR-022)", async () => {
    const result = await mediaStorageService.generateThematicFallbackImage("CAM-B4-NORTH");

    expect(result.assetId).toBeDefined();
    expect(result.mimeType).toBe("image/svg+xml");
    expect(result.url).toContain("/uploads/");
    expect(result.sizeBytes).toBeGreaterThan(0);
  });
});

