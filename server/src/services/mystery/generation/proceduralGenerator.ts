import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { env } from "../../../config/env.js";
import { imageGenerationService } from "../../media/imageGeneration.service.js";
import { MediaAssetModel } from "../../../models/MediaAsset.model.js";
import {
  PublicCaseData,
  PrivateSolutionData,
  MysteryDifficulty,
  MysteryGenre,
} from "../../../types/mystery.types.js";

interface ProceduralMysteryBundle {
  title: string;
  publicCase: PublicCaseData;
  privateSolution: Omit<PrivateSolutionData, "mysteryId">;
}

// Background helper to back up generated procedural SVGs into MongoDB Atlas
function persistSvgInDb(storageKey: string, evidenceId: string, svgContent: string, prompt: string) {
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    const dataBase64 = Buffer.from(svgContent, "utf-8").toString("base64");
    MediaAssetModel.create({
      caseId: new mongoose.Types.ObjectId(),
      evidenceId,
      type: "image",
      status: "ready",
      storageKey,
      url: `/uploads/${storageKey}`,
      mimeType: "image/svg+xml",
      sizeBytes: Buffer.byteLength(svgContent, "utf-8"),
      promptUsed: prompt,
      dataBase64,
      tierUsed: "svg_fallback",
    }).catch(() => {
      // ignore background persistence errors
    });
  }
}

export function generateProceduralMystery(
  scenario: string,
  genre: MysteryGenre,
  difficulty: MysteryDifficulty,
  suspectCount = 4
): ProceduralMysteryBundle {
  const caseNumber = `CASE-2026-MR${Math.floor(1000 + Math.random() * 9000)}`;

  const suspectTemplates = [
    {
      id: "suspect_001",
      name: "Arthur Finch",
      role: "Operations Supervisor",
      relationship: "Controlled auxiliary security access",
      initialStatement: "I was reviewing shipping invoices in Office 4B until 23:45.",
      knownMotive: "Pending performance audit and recent bonus denial.",
      statedAlibi: "Office 4B, alone.",
      trueAlibi: "Office 4B, working on private laptop.",
      isCulprit: false,
      liesTold: ["Was working strictly on official company invoices"],
    },
    {
      id: "suspect_002",
      name: "Elena Rostova",
      role: "Lead Systems Engineer",
      relationship: "Possessed emergency override credentials",
      initialStatement: "I left the server room at 23:30 and went straight home.",
      knownMotive: "Recruited by rival firm; heavy financial debts.",
      statedAlibi: "Left building at 23:30; in transit home.",
      trueAlibi: "Inside the vault corridor executing unauthorized manual transfer.",
      isCulprit: true,
      liesTold: [
        "Claimed to have departed at 23:30",
        "Claimed camera flicker was caused by external power grid",
      ],
    },
    {
      id: "suspect_003",
      name: "Marcus Vance",
      role: "Contract Security Specialist",
      relationship: "Monitored secondary camera consoles",
      initialStatement: "I reported the optical sensor glitch at 23:40 immediately.",
      knownMotive: "Dispute over unpaid contractor retainers.",
      statedAlibi: "Console Station B throughout the shift.",
      trueAlibi: "Stepped away to buy coffee between 23:35 and 23:42.",
      isCulprit: false,
      liesTold: ["Claimed never to have left Console Station B"],
    },
    {
      id: "suspect_004",
      name: "Diana Chen",
      role: "Corporate Auditor",
      relationship: "Initiated surprise vault inventory check",
      initialStatement: "I was in the archives on the third floor all evening.",
      knownMotive: "Undercover whistleblower seeking confidential records.",
      statedAlibi: "Archive reading room from 22:00 to midnight.",
      trueAlibi: "Archive reading room copying unredacted documents.",
      isCulprit: false,
      liesTold: ["Denies having any interest in the vault manifests"],
    },
    {
      id: "suspect_005",
      name: "Julian Cross",
      role: "Senior Facilities Custodian",
      relationship: "Master keys for all maintenance corridors",
      initialStatement: "I was locking up the rear loading dock between 23:30 and 23:50.",
      knownMotive: "Brother dismissed by management two weeks ago.",
      statedAlibi: "Loading dock rear bay.",
      trueAlibi: "Smoking near the loading bay exit.",
      isCulprit: false,
      liesTold: ["Claimed loading bay lock was jammed"],
    },
  ];

  const activeSuspects = suspectTemplates.slice(0, Math.max(3, Math.min(5, suspectCount)));

  const uploadsDir = path.resolve(process.cwd(), env.MEDIA_STORAGE_PATH || "./uploads");
  if (!fs.existsSync(uploadsDir)) {
    try {
      fs.mkdirSync(uploadsDir, { recursive: true });
    } catch {
      // ignore directory creation error
    }
  }

  const caseSlug = caseNumber.toLowerCase().replace(/[^a-z0-9]/g, "");

  const publicSuspects = activeSuspects.map((s, idx) => {
    const colors = ["#38bdf8", "#c084fc", "#f59e0b", "#34d399", "#f43f5e"];
    const hairColors = ["#cbd5e1", "#e2e8f0", "#94a3b8", "#64748b", "#fde047"];
    const filename = `proc_${s.id}_${caseSlug}.svg`;
    const filepath = path.join(uploadsDir, filename);

    if (!fs.existsSync(filepath)) {
      try {
        const svg = imageGenerationService.generateScenarioSvg("suspect", {
          title: s.name,
          role: s.role,
          clothingColor: colors[idx % colors.length],
          hairColor: hairColors[idx % hairColors.length],
        });
        fs.writeFileSync(filepath, svg, "utf-8");
        persistSvgInDb(filename, `suspect_${s.id}`, svg, `Procedural portrait of ${s.name}`);
      } catch {
        // ignore disk write error in read-only environment
      }
    }

    return {
      id: s.id,
      name: s.name,
      role: s.role,
      relationship: s.relationship,
      initialStatement: s.initialStatement,
      knownMotive: s.knownMotive,
      alibiInfo: s.statedAlibi,
      avatarUrl: `/uploads/${filename}`,
    };
  });

  const publicEvidence = [
    {
      id: "evidence_001",
      type: "chat" as const,
      title: "Encrypted Internal Messaging Log",
      description: "Automated archive of security dispatch chat during the incident",
      source: "Internal Team Network (Channel: #ops-incident)",
      occurredAt: "23:38 - 23:48",
      relatedSuspectIds: ["suspect_002", "suspect_003"],
      content: {
        conversationId: "conv_ops_44",
        channelName: "#ops-incident",
        participants: ["Elena Rostova", "Marcus Vance"],
        messages: [
          {
            id: "msg_101",
            senderName: "Marcus Vance",
            timestamp: "23:38",
            text: "Sector 4 optical feed just dropped frame rate. Did you trip a circuit breaker?",
          },
          {
            id: "msg_102",
            senderName: "Elena Rostova",
            timestamp: "23:41",
            text: "No idea, I already left the facility 10 mins ago. Probably external grid instability.",
          },
          {
            id: "msg_103",
            senderName: "Marcus Vance",
            timestamp: "23:44",
            text: "Wait, the keycard reader on Vault Access Door 2 just registered your bypass code.",
          },
        ],
        disclaimer: "SIMULATED CHAT — AI-GENERATED FICTIONAL EVIDENCE",
      },
    },
    {
      id: "evidence_002",
      type: "cctv" as const,
      title: "Surveillance Camera Log (Corridor B-4)",
      description: "Restored CCTV log capturing transit outside the vault foyer",
      source: "Security Archive System",
      occurredAt: "23:30 - 23:50",
      relatedSuspectIds: ["suspect_002"],
      content: {
        cameraTag: "CAM-B4-NORTH",
        location: "Vault Perimeter Foyer",
        timeRange: "23:30 - 23:50",
        frames: [
          (() => {
            const f1Filename = `proc_cctv_frame_1_${caseSlug}.svg`;
            const f1Path = path.join(uploadsDir, f1Filename);
            if (!fs.existsSync(f1Path)) {
              try {
                const svg = imageGenerationService.generateScenarioSvg("cctv", {
                  title: "CAM-B4 • NORTH FOYER",
                  location: "Vault Perimeter Foyer",
                  timestamp: "23:34:02 UTC",
                });
                fs.writeFileSync(f1Path, svg, "utf-8");
                persistSvgInDb(f1Filename, "evidence_002_frame_0", svg, "Procedural CCTV Frame 1");
              } catch {
                // ignore
              }
            }
            return {
              frameId: "f_01",
              timestamp: "23:34",
              cameraLocation: "CAM-B4-NORTH",
              cameraTag: "CAM-B4",
              description: "A figure matching Elena Rostova's distinctive gray security blazer enters Vault Foyer.",
              observedEntities: ["Elena Rostova"],
              imageUrl: `/uploads/${f1Filename}`,
            };
          })(),
          (() => {
            const f2Filename = `proc_cctv_frame_2_${caseSlug}.svg`;
            const f2Path = path.join(uploadsDir, f2Filename);
            if (!fs.existsSync(f2Path)) {
              try {
                const svg = imageGenerationService.generateScenarioSvg("cctv", {
                  title: "CAM-B4 • NORTH FOYER",
                  location: "Vault Perimeter Foyer",
                  timestamp: "23:45:18 UTC",
                });
                fs.writeFileSync(f2Path, svg, "utf-8");
                persistSvgInDb(f2Filename, "evidence_002_frame_1", svg, "Procedural CCTV Frame 2");
              } catch {
                // ignore
              }
            }
            return {
              frameId: "f_02",
              timestamp: "23:45",
              cameraLocation: "CAM-B4-NORTH",
              cameraTag: "CAM-B4",
              description: "Corridor lighting abruptly flickers; figure exits holding a slim thermal transport canister.",
              observedEntities: ["Unidentified Figure in Gray Blazer"],
              imageUrl: `/uploads/${f2Filename}`,
            };
          })(),
        ],
        surveillanceLog: "23:34:02 - Motion detected CAM-B4. Person enters.\n23:45:18 - Secondary sensor override logged.\n23:46:01 - Exit registered.",
        disclaimer: "SIMULATED SURVEILLANCE — AI-GENERATED FICTIONAL EVIDENCE",
      },
    },
    {
      id: "evidence_003",
      type: "digital_record" as const,
      title: "Electronic Turnstile Badge Telemetry",
      description: "Building perimeter turnstile access records for all personnel",
      source: "Facilities Access Database",
      occurredAt: "23:00 - 00:00",
      relatedSuspectIds: ["suspect_001", "suspect_002", "suspect_003"],
      content: {
        systemName: "BioGate Pro Access Manager",
        recordType: "access_log" as const,
        entries: [
          {
            timestamp: "23:28",
            action: "ENTRY",
            actor: "Arthur Finch",
            status: "Office 4B Sensor",
          },
          {
            timestamp: "23:30",
            action: "SCHEDULED_DEPARTURE",
            actor: "Elena Rostova",
            status: "NOT_SCANNED_AT_EXIT_TURNSTILE",
          },
          {
            timestamp: "23:49",
            action: "EXIT_REAR",
            actor: "Elena Rostova",
            status: "Emergency Exit Sensor Triggered",
          },
        ],
      },
    },
    {
      id: "evidence_004",
      type: "witness_statement" as const,
      title: "Interrogation Transcript: Arthur Finch",
      description: "Initial interview conducted by lead investigator",
      source: "Case Audio Recording Desk",
      occurredAt: "01:15 Following Incident",
      relatedSuspectIds: ["suspect_001"],
      content: {
        witnessName: "Arthur Finch",
        witnessRole: "Operations Supervisor",
        recordedAt: "01:15 AM",
        interrogator: "Investigator Thorne",
        transcript:
          "Q: When did you last see Ms. Rostova?\nA: I saw her head down toward the basement stairs around 23:32. She looked rushed and carried an equipment satchel. I assumed it was standard maintenance until the alarms went off.",
      },
    },
    {
      id: "evidence_005",
      type: "image" as const,
      title: "Crime Scene Forensic Still: Bypassed Vault Security Panel",
      description: "Forensic photographic evidence of the Vault Door 2 casing showing physical thermal decoupling marks.",
      source: "Forensic Crime Scene Unit (Field Unit Delta)",
      occurredAt: "23:55 Incident Night",
      relatedSuspectIds: ["suspect_002"],
      content: (() => {
        const photoFilename = `proc_photo_vault_${caseSlug}.svg`;
        const photoPath = path.join(uploadsDir, photoFilename);
        if (!fs.existsSync(photoPath)) {
          try {
            const svg = imageGenerationService.generateScenarioSvg("image", {
              title: "VAULT DOOR 2 • BREACH CASING",
              subtitle: "FORENSIC STILL",
              location: "Vault Perimeter Foyer",
              iconType: "evidence",
            });
            fs.writeFileSync(photoPath, svg, "utf-8");
            persistSvgInDb(photoFilename, "evidence_005", svg, "Procedural Crime Scene Photo of Vault Casing");
          } catch {
            // ignore
          }
        }
        return {
          caption: "Bypassed electronic access housing on Vault Door 2 showing manual decoupling marks.",
          location: "Vault Perimeter Foyer",
          capturedAt: "23:55 UTC",
          imageUrl: `/uploads/${photoFilename}`,
        };
      })(),
    },
  ];

  const publicTimeline = [
    {
      id: "time_001",
      time: "23:30",
      description: "Elena Rostova claims she completed her shift and exited the premises.",
      relatedSuspectIds: ["suspect_002"],
      relatedEvidenceIds: ["evidence_003"],
      isVerified: true,
    },
    {
      id: "time_002",
      time: "23:34",
      description: "CCTV Camera CAM-B4 records a person in a gray blazer entering the Vault Foyer.",
      relatedSuspectIds: ["suspect_002"],
      relatedEvidenceIds: ["evidence_002"],
      isVerified: true,
    },
    {
      id: "time_003",
      time: "23:41",
      description: "Chat log reveals Elena claiming she is offsite, while keycard telemetry indicates vault activity.",
      relatedSuspectIds: ["suspect_002", "suspect_003"],
      relatedEvidenceIds: ["evidence_001"],
      isVerified: true,
    },
    {
      id: "time_004",
      time: "23:49",
      description: "Emergency exit sensor activates at the rear corridor.",
      relatedSuspectIds: ["suspect_002"],
      relatedEvidenceIds: ["evidence_003"],
      isVerified: true,
    },
  ];

  const privateSolution: Omit<PrivateSolutionData, "mysteryId"> = {
    culpritSuspectId: "suspect_002",
    motive:
      "Deep personal financial liabilities and an illicit contract with an offshore syndicate to deliver the target artifact.",
    opportunity:
      "Elena leveraged her knowledge of the 23:30 shift change, fabricating an early departure while quietly staying inside the facility.",
    method:
      "She used an emergency maintenance bypass code to decouple the vault sensors while telling Marcus Vance the camera drop was an external grid glitch.",
    explanation:
      "Elena Rostova is the sole perpetrator. Her statement claiming she was home by 23:30 is contradicted by two independent pieces of evidence: (1) The Turnstile Telemetry proves she never scanned out at 23:30 and only exited through the rear emergency door at 23:49; (2) The CCTV footage at 23:34 captures her heading into the vault foyer in her distinctive gray blazer. Furthermore, her chat message at 23:41 claiming she was offsite occurred simultaneously with her bypass key registering on Vault Access Door 2.",
    decisiveEvidenceIds: ["evidence_001", "evidence_002", "evidence_003"],
    redHerringExplanations: [
      "Arthur Finch was alone in office 4B working on unauthorized private business, which made him appear evasive, but telemetry proves he stayed in his office.",
      "Marcus Vance stepped away from his console for 7 minutes to fetch coffee, which allowed Elena's initial entry to go unnoted on the live monitor, but Marcus did not participate in the crime.",
    ],
    authoritativeTimeline: [
      {
        id: "auth_01",
        time: "23:30",
        trueEvent: "Elena pretended to depart but hid in the utility stairway.",
        actors: ["suspect_002"],
        isContradictedByLies: true,
        correspondingEvidenceIds: ["evidence_003"],
      },
      {
        id: "auth_02",
        time: "23:34",
        trueEvent: "Elena entered the vault corridor with a transport satchel.",
        actors: ["suspect_002"],
        isContradictedByLies: true,
        correspondingEvidenceIds: ["evidence_002"],
      },
      {
        id: "auth_03",
        time: "23:41",
        trueEvent: "Elena messaged Marcus claiming she was offsite while inputting bypass codes.",
        actors: ["suspect_002"],
        isContradictedByLies: true,
        correspondingEvidenceIds: ["evidence_001"],
      },
      {
        id: "auth_04",
        time: "23:49",
        trueEvent: "Elena exited through the rear emergency fire door with the stolen item.",
        actors: ["suspect_002"],
        isContradictedByLies: true,
        correspondingEvidenceIds: ["evidence_003"],
      },
    ],
    suspectTruthRecords: activeSuspects.map((s) => ({
      suspectId: s.id,
      isCulprit: s.isCulprit,
      trueAlibi: s.trueAlibi,
      statedAlibi: s.statedAlibi,
      liesTold: s.liesTold,
      factsKnown: [s.relationship],
    })),
  };

  const title = `The ${genre.charAt(0).toUpperCase() + genre.slice(1)} Incident at ${publicEvidence[1].content.location}`;

  return {
    title,
    publicCase: {
      caseNumber,
      title,
      summary: scenario.slice(0, 400),
      location: "Metropolitan Facility - Sector 4",
      incidentTime: "23:30 - 23:50 Incident Window",
      difficulty,
      genre,
      suspects: publicSuspects,
      evidence: publicEvidence,
      timeline: publicTimeline,
    },
    privateSolution,
  };
}

