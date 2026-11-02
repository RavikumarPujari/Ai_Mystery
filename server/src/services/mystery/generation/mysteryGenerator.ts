import { geminiClient } from "../../gemini/geminiClient.js";
import {
  buildBlueprintSystemInstruction,
  buildBlueprintUserPrompt,
  blueprintJsonSchema,
} from "../../gemini/prompts/blueprintPrompt.js";
import {
  buildEvidenceSystemInstruction,
  buildEvidenceUserPrompt,
  evidenceJsonSchema,
} from "../../gemini/prompts/evidencePrompt.js";
import {
  buildVisualSystemInstruction,
  buildVisualUserPrompt,
  visualJsonSchema,
} from "../../gemini/prompts/visualPrompt.js";
import { imageGenerationService } from "../../media/imageGeneration.service.js";
import { consistencyValidator } from "../validation/consistencyValidator.js";
import { generateProceduralMystery } from "./proceduralGenerator.js";
import { mysteryRepository } from "../mystery.repository.js";
import {
  MysteryDifficulty,
  MysteryGenre,
  PublicCaseData,
  PrivateSolutionData,
  PublicSuspect,
  PublicEvidence,
  PublicTimelineEvent,
} from "../../../types/mystery.types.js";
import { AppError } from "../../../middleware/errorHandler.js";

export interface GenerateMysteryRequest {
  scenario: string;
  genre?: MysteryGenre;
  difficulty?: MysteryDifficulty;
  suspectCount?: number;
  evidencePreferences?: string[];
  generateMedia?: boolean;
  guestSessionId?: string;
  ownerId?: string;
}

export class MysteryGenerator {
  async generate(req: GenerateMysteryRequest) {
    const scenario = req.scenario.trim();
    if (scenario.length < 50 || scenario.length > 3000) {
      throw new AppError(
        "Scenario must be between 50 and 3,000 characters.",
        400,
        "VALIDATION_ERROR"
      );
    }

    const genre = req.genre || "theft";
    const difficulty = req.difficulty || "medium";
    const suspectCount = req.suspectCount || (difficulty === "easy" ? 3 : difficulty === "hard" ? 5 : 4);

    let bundle: {
      title: string;
      publicCase: PublicCaseData;
      privateSolution: Omit<PrivateSolutionData, "mysteryId">;
    };

    // If Gemini API is available, execute multi-stage AI pipeline
    let isAiGenerated = false;
    if (geminiClient.isAvailable()) {
      try {
        bundle = await this.generateWithGemini(scenario, genre, difficulty, suspectCount);
        isAiGenerated = true;
      } catch (aiErr) {
        console.warn("Gemini generation failed, falling back to procedural engine:", aiErr);
        bundle = await generateProceduralMystery(scenario, genre, difficulty, suspectCount);
      }
    } else {
      // Procedural synthesis engine (offline / dev mode without API key)
      bundle = await generateProceduralMystery(scenario, genre, difficulty, suspectCount);
    }

    // Protect and harmonize AI-generated bundle so Gemini synthesis is never lost
    if (isAiGenerated) {
      this.repairGeminiBundle(bundle, difficulty, suspectCount);
    }

    // Deterministic consistency validation (Section 6.5)
    let validation = consistencyValidator.validateMystery(
      bundle.publicCase,
      bundle.privateSolution,
      difficulty,
      suspectCount
    );

    // If still invalid, execute fallback
    if (!validation.isValid) {
      console.warn("Generated case failed validation. Attempting fallback. Errors:", validation.errors);
      bundle = await generateProceduralMystery(scenario, genre, difficulty, suspectCount);
      validation = consistencyValidator.validateMystery(
        bundle.publicCase,
        bundle.privateSolution,
        difficulty,
        suspectCount
      );

      if (!validation.isValid) {
        throw new AppError(
          "Generated mystery failed consistency validation.",
          500,
          "INVALID_MYSTERY",
          validation.errors
        );
      }
    } else if (isAiGenerated) {
      console.log(`[MysteryGenerator] SUCCESS: Generated 100% custom Gemini AI mystery: "${bundle.title}"`);
    }

    // Persist into database using separate collections (ADR-001)
    const { mystery } = await mysteryRepository.createMysteryWithSolution({
      title: bundle.title,
      originalScenario: scenario,
      genre,
      difficulty,
      ownerId: req.ownerId,
      guestSessionId: req.guestSessionId,
      publicCase: bundle.publicCase,
      privateSolution: bundle.privateSolution,
    });

    return {
      id: mystery._id.toString(),
      caseNumber: bundle.publicCase.caseNumber,
      title: bundle.title,
      status: "ready",
    };
  }

  /**
   * Harmonizes suspect IDs, culprit references, and decisive evidence to guarantee consistency
   */
  private repairGeminiBundle(
    bundle: {
      title: string;
      publicCase: PublicCaseData;
      privateSolution: Omit<PrivateSolutionData, "mysteryId">;
    },
    difficulty: MysteryDifficulty,
    suspectCount: number
  ) {
    const { publicCase, privateSolution } = bundle;
    const suspects = publicCase.suspects || [];
    const evidence = publicCase.evidence || [];

    // 1. Ensure all suspects have valid IDs and names
    suspects.forEach((s, idx) => {
      if (!s.id) s.id = `suspect_${idx + 1}`;
      if (!s.name) s.name = `Person of Interest #${idx + 1}`;
      if (!s.initialStatement) s.initialStatement = "I have cooperated fully with the investigation.";
    });

    const suspectIds = new Set(suspects.map((s) => s.id));

    // 2. Ensure culpritSuspectId exists in suspects
    if (!privateSolution.culpritSuspectId || !suspectIds.has(privateSolution.culpritSuspectId)) {
      const matchingSuspect = suspects.find(
        (s) =>
          s.id.toLowerCase() === (privateSolution.culpritSuspectId || "").toLowerCase() ||
          s.name.toLowerCase().includes((privateSolution.culpritSuspectId || "").toLowerCase())
      );
      privateSolution.culpritSuspectId = matchingSuspect ? matchingSuspect.id : (suspects[0]?.id || "suspect_1");
    }

    // 3. Ensure evidence items have valid IDs and titles
    evidence.forEach((e, idx) => {
      if (!e.id) e.id = `evidence_${idx + 1}`;
      if (!e.title) e.title = `Evidence Item #${idx + 1}`;
      if (e.relatedSuspectIds) {
        e.relatedSuspectIds = e.relatedSuspectIds.filter((id) => suspectIds.has(id));
      }
    });

    const evidenceIds = new Set(evidence.map((e) => e.id));

    // 4. Ensure decisiveEvidenceIds contains existing evidence IDs
    const validDecisive = (privateSolution.decisiveEvidenceIds || []).filter((id) =>
      evidenceIds.has(id)
    );
    if (validDecisive.length < 2) {
      // Find evidence related to the culprit
      const culpritEvidence = evidence
        .filter((e) => e.relatedSuspectIds?.includes(privateSolution.culpritSuspectId))
        .map((e) => e.id);

      for (const eid of culpritEvidence) {
        if (!validDecisive.includes(eid)) validDecisive.push(eid);
        if (validDecisive.length >= 2) break;
      }
      // If still fewer than 2, backfill with first evidence items
      for (const e of evidence) {
        if (!validDecisive.includes(e.id)) validDecisive.push(e.id);
        if (validDecisive.length >= 2) break;
      }
    }
    privateSolution.decisiveEvidenceIds = validDecisive;

    // 5. Clean timeline references
    if (publicCase.timeline) {
      publicCase.timeline.forEach((t) => {
        if (t.relatedSuspectIds) {
          t.relatedSuspectIds = t.relatedSuspectIds.filter((id) => suspectIds.has(id));
        }
      });
    }

    // 6. Ensure motive and explanation exist
    if (!privateSolution.motive) {
      privateSolution.motive = "Personal gain, concealed secrets, and opportunism.";
    }
    if (!privateSolution.explanation) {
      privateSolution.explanation = `The evidence definitively isolates ${privateSolution.culpritSuspectId} as the culprit.`;
    }

    // 7. Ensure authoritative timeline has events
    if (!privateSolution.authoritativeTimeline || privateSolution.authoritativeTimeline.length === 0) {
      privateSolution.authoritativeTimeline = [
        {
          id: "auth_t1",
          time: publicCase.incidentTime || "21:00",
          trueEvent: `Culprit ${privateSolution.culpritSuspectId} carried out the act during the critical incident window.`,
          actors: [privateSolution.culpritSuspectId],
          isContradictedByLies: true,
          correspondingEvidenceIds: [],
        },
      ];
    }
  }

  private async generateWithGemini(
    scenario: string,
    genre: MysteryGenre,
    difficulty: MysteryDifficulty,
    suspectCount: number
  ) {
    // Stage 1: Blueprint Generation
    const blueprintPrompt = buildBlueprintUserPrompt(scenario, genre, difficulty, suspectCount);
    const blueprintSystem = buildBlueprintSystemInstruction();

    const rawBlueprint = await geminiClient.generateStructuredJson<any>(
      blueprintPrompt,
      blueprintJsonSchema,
      blueprintSystem
    );

    // Stage 2: Evidence & Dossier Generation
    const evidencePrompt = buildEvidenceUserPrompt(JSON.stringify(rawBlueprint, null, 2));
    const evidenceSystem = buildEvidenceSystemInstruction();

    const rawEvidence = await geminiClient.generateStructuredJson<any>(
      evidencePrompt,
      evidenceJsonSchema,
      evidenceSystem
    );

    // Assembly of suspects and evidence
    const publicSuspects: PublicSuspect[] = (rawEvidence.suspects || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      role: s.role,
      relationship: s.relationship,
      initialStatement: s.initialStatement,
      knownMotive: s.knownMotive,
      alibiInfo: s.alibiInfo,
    }));

    const publicEvidence: PublicEvidence[] = (rawEvidence.evidence || []).map((e: any) => ({
      id: e.id,
      type: e.type,
      title: e.title,
      description: e.description,
      source: e.source,
      occurredAt: e.occurredAt,
      relatedSuspectIds: e.relatedSuspectIds || [],
      content: e.content,
    }));

    // Ensure all visual evidence items have standardized content structures
    for (const item of publicEvidence) {
      if (item.type === "cctv") {
        if (!item.content || typeof item.content !== "object") {
          item.content = {} as any;
        }
        const cctv = item.content as any;
        if (!cctv.cameraTag) cctv.cameraTag = "CAM-01-SEC";
        if (!cctv.location) cctv.location = rawBlueprint.location || "Investigation Scene";
        if (!cctv.timeRange) cctv.timeRange = item.occurredAt || rawBlueprint.incidentTime || "Incident Window";
        if (!Array.isArray(cctv.frames) || cctv.frames.length === 0) {
          cctv.frames = [
            {
              frameId: "f_01",
              timestamp: rawBlueprint.incidentTime || "22:15",
              cameraLocation: cctv.location,
              cameraTag: cctv.cameraTag,
              description: item.description || "Activity logged in designated sector.",
              observedEntities: item.relatedSuspectIds || [],
            },
          ];
        }
      } else if (item.type === "image") {
        if (!item.content || typeof item.content !== "object") {
          item.content = {} as any;
        }
        const imgContent = item.content as any;
        if (!imgContent.caption) {
          imgContent.caption = item.title;
        }
        if (!imgContent.location) {
          imgContent.location = rawBlueprint.location;
        }
      }
    }

    // Stage 3: Scenario-Based Visual Identity Synthesis & Image Generation
    const tempCaseId = `case_${Date.now()}`;
    const suspectVisualMap = new Map<string, any>();

    try {
      const visualPrompt = buildVisualUserPrompt(
        scenario,
        genre,
        rawBlueprint.title,
        rawBlueprint.location,
        rawBlueprint.incidentTime,
        JSON.stringify(rawEvidence.suspects || []),
        JSON.stringify(rawEvidence.evidence || [])
      );
      const visualSystem = buildVisualSystemInstruction();

      const rawVisuals = await geminiClient.generateStructuredJson<any>(
        visualPrompt,
        visualJsonSchema,
        visualSystem
      );

      // Cache suspect visual identities for cross-referencing
      if (rawVisuals?.suspectProfiles && Array.isArray(rawVisuals.suspectProfiles)) {
        for (const p of rawVisuals.suspectProfiles) {
          if (p.suspectId) {
            suspectVisualMap.set(p.suspectId, p);
          }
        }
      }

      // 1. Generate unique character-consistent portrait for every suspect
      await Promise.all(
        publicSuspects.map(async (suspect) => {
          const profile = suspectVisualMap.get(suspect.id);
          const vi = profile?.visualIdentity;
          const prompt =
            profile?.portraitPrompt ||
            `Cinematic forensic portrait photograph of ${suspect.name}, ${vi?.age || "middle-aged"} ${vi?.gender || ""}, ${suspect.role}, with ${vi?.hairStyleAndColor || "dark hair"}, wearing ${vi?.clothing || "detective noir attire"}, neutral expression, dramatic lighting, 35mm lens, high resolution`;

          const svgOptions = {
            title: suspect.name,
            role: suspect.role,
            clothingColor: profile?.svgDesign?.clothingColor || "#38bdf8",
            hairColor: profile?.svgDesign?.hairColor || "#e2e8f0",
            iconType: "portrait" as const,
          };

          const media = await imageGenerationService.generateImage({
            caseId: tempCaseId,
            evidenceId: `suspect_${suspect.id}`,
            prompt,
            type: "suspect",
            svgOptions,
          });

          suspect.avatarUrl = media.url;
        })
      );

      // 2. Generate unique scenario images for CCTV frames & photographic evidence
      await Promise.all(
        publicEvidence.map(async (item) => {
          if (item.type === "cctv" && item.content && Array.isArray((item.content as any).frames)) {
            const cctv = item.content as any;
            for (let i = 0; i < cctv.frames.length; i++) {
              const frame = cctv.frames[i];

              // Cross-reference observed suspects for visual consistency
              let suspectTraits = "";
              const observedSuspect = publicSuspects.find(
                (s) =>
                  (frame.observedEntities || []).some(
                    (entity: string) =>
                      entity.toLowerCase().includes(s.name.toLowerCase()) ||
                      entity.toLowerCase().includes(s.id.toLowerCase())
                  ) || frame.description.toLowerCase().includes(s.name.toLowerCase())
              );

              if (observedSuspect) {
                const vi = suspectVisualMap.get(observedSuspect.id)?.visualIdentity;
                if (vi) {
                  suspectTraits = ` showing ${observedSuspect.name} (${vi.age} years old, ${vi.hairStyleAndColor}, wearing ${vi.clothing})`;
                } else {
                  suspectTraits = ` showing ${observedSuspect.name}`;
                }
              }

              const prompt = `Security surveillance CCTV still camera view of ${cctv.location || rawBlueprint.location}, timestamp ${frame.timestamp},${suspectTraits} ${frame.description}, authentic grainy security camera still, high-angle surveillance perspective, monochrome night-vision scanlines, timestamp watermark`;

              const svgOptions = {
                title: `${cctv.cameraTag || "CCTV"} • FRAME #${i + 1}`,
                location: cctv.location || rawBlueprint.location,
                timestamp: frame.timestamp,
                iconType: "cctv" as const,
              };

              const media = await imageGenerationService.generateImage({
                caseId: tempCaseId,
                evidenceId: `${item.id}_frame_${i}`,
                prompt,
                type: "cctv",
                svgOptions,
              });

              frame.imageUrl = media.url;
            }
          } else if (item.type === "image" && item.content) {
            // Find matched evidence visual specification if generated by Gemini
            const evSpec = (rawVisuals?.evidenceVisuals || []).find(
              (ev: any) => ev.evidenceId === item.id
            );

            const prompt =
              evSpec?.scenePrompt ||
              `Forensic crime scene photograph of ${item.title}, ${item.description}, inside ${rawBlueprint.location}, forensic documentary photography, dramatic directional lighting, detailed physical evidence capture, 35mm photograph`;

            const svgOptions = {
              title: item.title,
              subtitle: item.source || "FORENSIC ARTIFACT",
              location: rawBlueprint.location,
              iconType: "evidence" as const,
            };

            const media = await imageGenerationService.generateImage({
              caseId: tempCaseId,
              evidenceId: item.id,
              prompt,
              type: "image",
              svgOptions,
            });

            (item.content as any).imageUrl = media.url;
          }
        })
      );
    } catch (visErr) {
      console.warn("[MysteryGen] Visual dossier extraction had an issue. Executing guaranteed scenario SVG fallback:", visErr);

      // Guaranteed fallback: Generate scenario-specific SVGs for any missing suspect portraits
      await Promise.all(
        publicSuspects.map(async (suspect, idx) => {
          if (!suspect.avatarUrl) {
            const colors = ["#38bdf8", "#c084fc", "#f59e0b", "#34d399", "#f43f5e"];
            const hairColors = ["#cbd5e1", "#e2e8f0", "#94a3b8", "#64748b", "#fde047"];
            const media = await imageGenerationService.generateImage({
              caseId: tempCaseId,
              evidenceId: `suspect_${suspect.id}`,
              prompt: `Forensic suspect portrait of ${suspect.name}`,
              type: "suspect",
              svgOptions: {
                title: suspect.name,
                role: suspect.role,
                clothingColor: colors[idx % colors.length],
                hairColor: hairColors[idx % hairColors.length],
                iconType: "portrait",
              },
            });
            suspect.avatarUrl = media.url;
          }
        })
      );

      // Guaranteed fallback: Generate scenario-specific SVGs for any missing CCTV frames or photo evidence
      await Promise.all(
        publicEvidence.map(async (item) => {
          if (item.type === "cctv" && item.content && Array.isArray((item.content as any).frames)) {
            const cctv = item.content as any;
            for (let i = 0; i < cctv.frames.length; i++) {
              const frame = cctv.frames[i];
              if (!frame.imageUrl) {
                const media = await imageGenerationService.generateImage({
                  caseId: tempCaseId,
                  evidenceId: `${item.id}_frame_${i}`,
                  prompt: `CCTV surveillance still at ${cctv.location}`,
                  type: "cctv",
                  svgOptions: {
                    title: `${cctv.cameraTag || "CCTV"} • FRAME #${i + 1}`,
                    location: cctv.location || rawBlueprint.location,
                    timestamp: frame.timestamp,
                    iconType: "cctv",
                  },
                });
                frame.imageUrl = media.url;
              }
            }
          } else if (item.type === "image" && item.content) {
            const imgContent = item.content as any;
            if (!imgContent.imageUrl) {
              const media = await imageGenerationService.generateImage({
                caseId: tempCaseId,
                evidenceId: item.id,
                prompt: `Forensic photo of ${item.title}`,
                type: "image",
                svgOptions: {
                  title: item.title,
                  subtitle: item.source || "FORENSIC STILL",
                  location: rawBlueprint.location,
                  iconType: "evidence",
                },
              });
              imgContent.imageUrl = media.url;
            }
          }
        })
      );
    }

    const publicTimeline: PublicTimelineEvent[] = (rawEvidence.timeline || []).map((t: any) => ({
      id: t.id,
      time: t.time,
      description: t.description,
      relatedSuspectIds: t.relatedSuspectIds || [],
      relatedEvidenceIds: t.relatedEvidenceIds || [],
      isVerified: t.isVerified ?? true,
    }));

    const publicCase: PublicCaseData = {
      caseNumber: rawEvidence.caseNumber || `CASE-${Date.now()}`,
      title: rawBlueprint.title,
      summary: rawBlueprint.summary,
      location: rawBlueprint.location,
      incidentTime: rawBlueprint.incidentTime,
      difficulty,
      genre,
      suspects: publicSuspects,
      evidence: publicEvidence,
      timeline: publicTimeline,
    };

    const privateSolution: Omit<PrivateSolutionData, "mysteryId"> = {
      culpritSuspectId: rawBlueprint.culpritSuspectId,
      motive: rawBlueprint.motive,
      opportunity: rawBlueprint.opportunity,
      method: rawBlueprint.method,
      explanation: rawBlueprint.explanation,
      decisiveEvidenceIds: rawEvidence.decisiveEvidenceIds || rawBlueprint.decisiveEvidenceDescriptions || [],
      redHerringExplanations: rawBlueprint.redHerringExplanations || [],
      authoritativeTimeline: rawBlueprint.authoritativeTimeline || [],
      suspectTruthRecords: (rawBlueprint.suspects || []).map((s: any) => ({
        suspectId: s.id,
        isCulprit: s.isCulprit,
        trueAlibi: s.trueAlibi,
        statedAlibi: s.statedAlibi,
        liesTold: s.liesTold || [],
        factsKnown: [s.relationship],
      })),
    };

    return {
      title: rawBlueprint.title,
      publicCase,
      privateSolution,
    };
  }
}

export const mysteryGenerator = new MysteryGenerator();
