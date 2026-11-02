import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { env } from "../src/config/env.js";
import { mysteryGenerator } from "../src/services/mystery/generation/mysteryGenerator.js";
import { mysteryRepository } from "../src/services/mystery/mystery.repository.js";
import { imageGenerationService } from "../src/services/media/imageGeneration.service.js";
import { MediaAssetModel } from "../src/models/MediaAsset.model.js";

interface ScenarioDefinition {
  name: string;
  genre: "theft" | "museum" | "disappearance" | "corporate" | "suspicious_incident";
  scenario: string;
}

const FIVE_SCENARIOS: ScenarioDefinition[] = [
  {
    name: "Missing Diamond Necklace (Hotel Penthouse Investigation)",
    genre: "theft",
    scenario:
      "A priceless heirloom diamond necklace with 45 carats of cut diamonds disappears from Lady Eleanor's secure penthouse display vault at the Grand St. Regis Hotel during an intimate high-society dinner. At 21:15, a brief electrical flicker deactivated secondary laser tripwires, and at 21:20 the glass vault stood open and vacant with no sign of forced lock fracture. Four guests were present with conflicting alibis.",
  },
  {
    name: "Museum Painting Theft (National Gallery Art Heist)",
    genre: "museum",
    scenario:
      "During a private preview evening at the Vane Institute of Contemporary Art, the Renaissance masterwork 'The Solitary Astronomer' was cleanly razor-sliced and removed from its gilded frame in Gallery Hall 3. Security guards were distracted by an anomalous fire alarm pulled in the east sculpture rotunda at 22:40. Four gallery staff and conservationists were inside the wing.",
  },
  {
    name: "Missing Person (Kensington Residential Disappearance)",
    genre: "disappearance",
    scenario:
      "Eminent software founder Julian Vance vanished without warning from his Kensington townhouse on a rainy Tuesday evening. His study window was left unlatched, his study tea was still warm on his mahogany desk, and his encrypted personal phone and passport remained in the room, but his daily security logs showed anomalous backdoor access at 20:30.",
  },
  {
    name: "Office Data Theft (Corporate Espionage Investigation)",
    genre: "corporate",
    scenario:
      "Confidential source algorithms for an autonomous drone navigational system were exfiltrated via a physical hardware bypass at Apex Dynamics Headquarters between 23:00 and 23:30. The biometric server room airlock logged an authorized badge swipe, yet internal security network cables were physically severed to delay automated data alerts.",
  },
  {
    name: "Suspicious Laboratory Incident (Aegis Bio-Research Facility)",
    genre: "suspicious_incident",
    scenario:
      "A sealed cryogenic containment vial holding an experimental biocatalyst enzyme cracked and vanished from the sub-level 2 cleanroom laboratory at Aegis Biotherapeutics. The incident triggered a regional chemical decontamination lockdown at 02:15 AM, during which only night-shift research associates and hazmat safety officers had access credentials.",
  },
];

async function runEndToEndScenarioTesting() {
  console.log("================================================================================");
  console.log("AI MYSTERY ROOM — 5-SCENARIO SCENARIO-SPECIFIC IMAGE GENERATION & LOCKER TEST");
  console.log("================================================================================\n");

  if (!mongoose.connection || mongoose.connection.readyState !== 1) {
    console.log(`Connecting to database at ${env.MONGODB_URI}...`);
    await mongoose.connect(env.MONGODB_URI);
    console.log("Connected to MongoDB successfully.\n");
  }

  const results: any[] = [];
  const uploadsDir = path.resolve(process.cwd(), env.MEDIA_STORAGE_PATH || "./uploads");
  const allGeneratedImageUrls = new Set<string>();
  let duplicateCount = 0;

  for (let i = 0; i < FIVE_SCENARIOS.length; i++) {
    const sc = FIVE_SCENARIOS[i];
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`[Scenario ${i + 1}/5] ${sc.name}`);
    console.log(`Genre: ${sc.genre}`);
    console.log(`Scenario Prompt: "${sc.scenario.substring(0, 90)}..."`);
    console.log(`--------------------------------------------------------------------------------`);

    const startTime = Date.now();
    const mysteryBundle = await mysteryGenerator.generate({
      scenario: sc.scenario,
      genre: sc.genre,
      difficulty: "medium",
      suspectCount: 4,
      generateMedia: true,
      guestSessionId: `test_e2e_session_${Date.now()}`,
    });

    const elapsedMs = Date.now() - startTime;
    console.log(`Case Synthesized: ${mysteryBundle.title} (ID: ${mysteryBundle.id}, Case #: ${mysteryBundle.caseNumber}) in ${elapsedMs}ms`);

    // Fetch the stored public mystery dossier
    const publicCase = await mysteryRepository.findPublicMysteryById(mysteryBundle.id);
    if (!publicCase) {
      throw new Error(`Failed to retrieve generated case ${mysteryBundle.id}`);
    }

    console.log(`Suspects Synthesized: ${publicCase.suspects.length}`);
    console.log(`Evidence Items Synthesized: ${publicCase.evidence.length}`);

    // Inspect suspect portraits
    const suspectReport: any[] = [];
    for (const suspect of publicCase.suspects) {
      const avatarUrl = suspect.avatarUrl;
      let fileExists = false;
      let fileSize = 0;
      let mediaDoc = null;

      if (avatarUrl) {
        if (allGeneratedImageUrls.has(avatarUrl)) {
          console.warn(`WARNING: Duplicate image URL detected across scenarios: ${avatarUrl}`);
          duplicateCount++;
        }
        allGeneratedImageUrls.add(avatarUrl);

        const storageKey = avatarUrl.replace("/uploads/", "");
        const localPath = path.join(uploadsDir, storageKey);
        fileExists = fs.existsSync(localPath);
        if (fileExists) {
          fileSize = fs.statSync(localPath).size;
        }
        mediaDoc = await MediaAssetModel.findOne({ storageKey });
      }

      console.log(`  - Suspect: ${suspect.name} (${suspect.role})`);
      console.log(`    Avatar URL: ${avatarUrl || "NONE"}`);
      console.log(`    Local File Exists: ${fileExists} (${fileSize} bytes), Tier: ${mediaDoc?.tierUsed || "unknown"}`);

      suspectReport.push({
        id: suspect.id,
        name: suspect.name,
        role: suspect.role,
        avatarUrl,
        fileExists,
        fileSize,
        tierUsed: mediaDoc?.tierUsed || "svg_fallback",
      });
    }

    // Inspect visual evidence (CCTV frames, photographic items)
    const evidenceReport: any[] = [];
    for (const ev of publicCase.evidence) {
      let visualUrl: string | null = null;
      let visualType: string = ev.type;

      if (ev.type === "cctv" && (ev.content as any)?.frames) {
        const frames = (ev.content as any).frames;
        visualUrl = frames[0]?.imageUrl || null;
        console.log(`  - CCTV Evidence: "${ev.title}" (${frames.length} frames)`);
        for (let f = 0; f < frames.length; f++) {
          const frame = frames[f];
          if (frame.imageUrl) {
            allGeneratedImageUrls.add(frame.imageUrl);
            const storageKey = frame.imageUrl.replace("/uploads/", "");
            const localPath = path.join(uploadsDir, storageKey);
            const exists = fs.existsSync(localPath);
            const size = exists ? fs.statSync(localPath).size : 0;
            console.log(`    Frame #${f + 1} (${frame.timestamp}): ${frame.imageUrl} [Exists: ${exists}, ${size} bytes]`);
          }
        }
      } else if (ev.type === "image") {
        visualUrl = (ev.content as any)?.imageUrl || null;
        if (visualUrl) {
          allGeneratedImageUrls.add(visualUrl);
          const storageKey = visualUrl.replace("/uploads/", "");
          const localPath = path.join(uploadsDir, storageKey);
          const exists = fs.existsSync(localPath);
          const size = exists ? fs.statSync(localPath).size : 0;
          console.log(`  - Photo Evidence: "${ev.title}" -> ${visualUrl} [Exists: ${exists}, ${size} bytes]`);
        }
      } else {
        console.log(`  - Documentary Evidence: "${ev.title}" (Type: ${ev.type})`);
      }

      evidenceReport.push({
        id: ev.id,
        type: ev.type,
        title: ev.title,
        hasVisualThumbnail: !!visualUrl,
        thumbnailUrl: visualUrl,
      });
    }

    results.push({
      scenarioNumber: i + 1,
      title: mysteryBundle.title,
      caseNumber: mysteryBundle.caseNumber,
      id: mysteryBundle.id,
      genre: sc.genre,
      elapsedMs,
      suspects: suspectReport,
      evidence: evidenceReport,
    });

    console.log(`Scenario ${i + 1} inspection completed successfully.\n`);
  }

  // Test Render Free ephemeral recovery: wipe an asset from disk and test getMediaBuffer
  console.log("--------------------------------------------------------------------------------");
  console.log("TESTING RENDER FREE EPHEMERAL DISK PERSISTENCE RECOVERY");
  console.log("--------------------------------------------------------------------------------");
  const sampleMediaAsset = await MediaAssetModel.findOne({ status: "ready" }).select("+dataBase64");
  let recoverySuccess = false;

  if (sampleMediaAsset && sampleMediaAsset.storageKey && sampleMediaAsset.dataBase64) {
    const key = sampleMediaAsset.storageKey;
    const diskPath = path.join(uploadsDir, key);
    let originalBuffer: Buffer | null = null;

    if (fs.existsSync(diskPath)) {
      originalBuffer = fs.readFileSync(diskPath);
      // Simulate ephemeral disk wipe
      fs.unlinkSync(diskPath);
      console.log(`Simulated container ephemeral wipe: deleted ${diskPath}`);
    }

    // Call getMediaBuffer - should pull directly from MongoDB
    const recovered = await imageGenerationService.getMediaBuffer(key);
    if (recovered && recovered.buffer && recovered.buffer.length > 0) {
      console.log(`SUCCESS: Recovered ${recovered.buffer.length} bytes of ${recovered.mimeType} from MongoDB Atlas!`);
      recoverySuccess = true;
      // Confirm it re-cached to disk
      console.log(`Re-cached to disk: ${fs.existsSync(diskPath)}`);
    } else {
      console.error(`FAILURE: Could not recover ${key} from MongoDB Atlas.`);
    }

    if (originalBuffer && !fs.existsSync(diskPath)) {
      fs.writeFileSync(diskPath, originalBuffer);
    }
  }

  console.log("\n================================================================================");
  console.log("FIVE SCENARIOS END-TO-END SUMMARY");
  console.log("================================================================================");
  console.log(`Total Cases Created: ${results.length}`);
  console.log(`Total Unique Generated Visual Assets: ${allGeneratedImageUrls.size}`);
  console.log(`Cross-Mystery Duplicate Image Overlaps: ${duplicateCount} (Expected: 0)`);
  console.log(`Ephemeral Disk Wipe Recovery Verified: ${recoverySuccess}`);
  console.log("================================================================================\n");

  return { results, duplicateCount, recoverySuccess, totalImages: allGeneratedImageUrls.size };
}

runEndToEndScenarioTesting()
  .then((data) => {
    fs.writeFileSync(
      path.resolve(process.cwd(), "scenario_test_results.json"),
      JSON.stringify(data, null, 2),
      "utf-8"
    );
    console.log("Wrote full diagnostic results to scenario_test_results.json");
    process.exit(0);
  })
  .catch((err) => {
    console.error("End-to-End Testing Encountered An Error:", err);
    process.exit(1);
  });

