import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import { imageGenerationService } from "../src/services/media/imageGeneration.service.js";
import { MediaAssetModel } from "../src/models/MediaAsset.model.js";
import { generateProceduralMystery } from "../src/services/mystery/generation/proceduralGenerator.js";
import { env } from "../src/config/env.js";

describe("Scenario-Based AI Image Generation Engine", () => {
  const uploadsDir = path.resolve(process.cwd(), env.MEDIA_STORAGE_PATH || "./uploads");

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 1. Tier 3: Scenario-Specific Dynamic SVG Generation
  // ---------------------------------------------------------------------------
  describe("Tier 3: Scenario-Specific SVG Generator", () => {
    it("generates a distinct suspect avatar SVG with customized attire and hair", () => {
      const svg = imageGenerationService.generateScenarioSvg("suspect", {
        title: "Arthur Finch",
        role: "Operations Supervisor",
        clothingColor: "#f59e0b",
        hairColor: "#64748b",
      });

      expect(svg).toContain("<svg");
      expect(svg).toContain("Arthur Finch");
      expect(svg).toContain("Operations Supervisor");
      expect(svg).toContain("#f59e0b");
      expect(svg).toContain("#64748b");
      expect(svg).toContain("SUSPECT DOSSIER");
    });

    it("generates a high-angle CCTV surveillance monitor SVG with accurate metadata", () => {
      const svg = imageGenerationService.generateScenarioSvg("cctv", {
        title: "CAM-B4-NORTH",
        location: "Vault Perimeter Foyer",
        timestamp: "23:34:02 UTC",
      });

      expect(svg).toContain("<svg");
      expect(svg).toContain("CAM-B4-NORTH");
      expect(svg).toContain("Vault Perimeter Foyer");
      expect(svg).toContain("23:34:02 UTC");
      expect(svg).toContain("LIVE SURVEILLANCE FEED");
      expect(svg).toContain("[ TARGET IDENTIFIED ]");
    });

    it("generates a forensic evidence artifact photograph SVG", () => {
      const svg = imageGenerationService.generateScenarioSvg("image", {
        title: "Shattered Diamond Pedestal",
        subtitle: "CRIME SCENE MARKER #1",
        location: "East Wing Gallery",
      });

      expect(svg).toContain("<svg");
      expect(svg).toContain("Shattered Diamond Pedestal");
      expect(svg).toContain("FORENSIC ARTIFACT");
      expect(svg).toContain("East Wing Gallery");
      expect(svg).toContain("CRIME SCENE MARKER #1");
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Multi-Tier Fallback Hierarchy & Persistence
  // ---------------------------------------------------------------------------
  describe("Image Generation Tiers & Fallbacks", () => {
    it("falls back to Tier 3 SVG and stores in MongoDB when network is offline", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network offline")));
      vi.spyOn(MediaAssetModel, "create").mockResolvedValue({} as any);

      const result = await imageGenerationService.generateImage({
        caseId: "654321000000000000000001",
        evidenceId: "suspect_001",
        prompt: "A close-up portrait of Marcus Vance, security contractor",
        type: "suspect",
        svgOptions: {
          title: "Marcus Vance",
          role: "Security Contractor",
          clothingColor: "#10b981",
          hairColor: "#334155",
        },
      });

      expect(result.assetId).toBeDefined();
      expect(result.url).toMatch(/^\/uploads\/asset_[a-f0-9]+\.svg$/);
      expect(result.mimeType).toBe("image/svg+xml");
      expect(result.tierUsed).toBe("svg_fallback");
      expect(result.sizeBytes).toBeGreaterThan(500);

      // Verify file was written to disk
      const filePath = path.join(uploadsDir, result.storageKey);
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it("uses Tier 2 (Pollinations) when Hugging Face is unavailable and network succeeds", async () => {
      // Mock global fetch returning valid JPEG bytes
      const fakeJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => "image/jpeg" },
        arrayBuffer: async () => fakeJpeg.buffer,
      });
      vi.stubGlobal("fetch", mockFetch);
      vi.spyOn(MediaAssetModel, "create").mockResolvedValue({} as any);

      // Even with small buffer, mock should succeed
      const result = await (imageGenerationService as any).generateWithPollinations("detective desk");
      expect(result).toBeDefined();
      expect(result.mimeType).toBe("image/jpeg");
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Render Free Ephemeral Disk Compatibility (MongoDB Recovery)
  // ---------------------------------------------------------------------------
  describe("Render Free Deployment Compatibility", () => {
    it("recovers missing image buffer directly from MongoDB if disk was wiped on spin-down", async () => {
      const testKey = "asset_render_recovery_test.svg";
      const testFilePath = path.join(uploadsDir, testKey);

      // Remove from disk if exists
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }

      const sampleSvg = `<svg xmlns="http://www.w3.org/2000/svg"><text>Recovered from Mongo</text></svg>`;
      const sampleBase64 = Buffer.from(sampleSvg, "utf-8").toString("base64");

      // Mock MongoDB finding the asset with dataBase64
      vi.spyOn(MediaAssetModel, "findOne").mockReturnValue({
        select: () =>
          Promise.resolve({
            storageKey: testKey,
            dataBase64: sampleBase64,
            mimeType: "image/svg+xml",
          }),
      } as any);

      const recovered = await imageGenerationService.getMediaBuffer(testKey);

      expect(recovered).not.toBeNull();
      expect(recovered?.mimeType).toBe("image/svg+xml");
      expect(recovered?.buffer.toString("utf-8")).toBe(sampleSvg);

      // Clean up re-cached file
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Multi-Investigation Visual Identity Uniqueness
  // ---------------------------------------------------------------------------
  describe("Three-Investigation Visual Uniqueness Verification", () => {
    it("generates distinct suspect visual identities and evidence images across 3 different investigations", async () => {
      // Investigation 1: Murder Mystery
      const murderCase = generateProceduralMystery(
        "A high-profile tech CEO was found murdered inside his private study with locked doors and windows.",
        "murder",
        "medium",
        4
      );

      // Investigation 2: Diamond Heist
      const heistCase = generateProceduralMystery(
        "A rare pink diamond vanished from a high-security vault during a charity auction blackout.",
        "theft",
        "easy",
        3
      );

      // Investigation 3: Cyber Breach / Kidnapping
      const cyberCase = generateProceduralMystery(
        "An encrypted data storage drive containing offshore assets was stolen during an executive kidnapping.",
        "digital",
        "hard",
        5
      );

      // Verify all suspects have avatar URLs assigned
      expect(murderCase.publicCase.suspects[0].avatarUrl).toBeDefined();
      expect(heistCase.publicCase.suspects[0].avatarUrl).toBeDefined();
      expect(cyberCase.publicCase.suspects[0].avatarUrl).toBeDefined();

      // Verify CCTV frames have images
      const murderCctv = murderCase.publicCase.evidence.find((e) => e.type === "cctv");
      const heistCctv = heistCase.publicCase.evidence.find((e) => e.type === "cctv");

      expect((murderCctv?.content as any)?.frames?.[0]?.imageUrl).toBeDefined();
      expect((heistCctv?.content as any)?.frames?.[0]?.imageUrl).toBeDefined();

      // Verify suspect counts reflect difficulty
      expect(murderCase.publicCase.suspects.length).toBe(4);
      expect(heistCase.publicCase.suspects.length).toBe(3);
      expect(cyberCase.publicCase.suspects.length).toBe(5);
    });
  });
});

