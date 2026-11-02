# AI Mystery Room — Scenario-Based Visual Evidence & Evidence Locker Verification Report

**Date:** 2026-11-01  
**Target Application:** AI Mystery Room (MERN Full-Stack Detective Investigation System)  
**Status:** ALL PHASES VERIFIED & OPERATIONAL  

---

## 1. Executive Summary

This report documents the architectural inspection, root-cause diagnosis, code implementation, and end-to-end verification of scenario-specific AI image generation, Evidence Locker visual rendering, and zero-budget asset persistence for the AI Mystery Room platform.

All five test scenarios generated 100% unique, scenario-specific visual assets with **zero cross-investigation collisions** and **zero budget expenditure**.

---

## 2. Root Cause Analysis of Previous Image Issues

Prior to this intervention, the Evidence Locker and suspect dossiers frequently suffered from missing images, repeated placeholders, or broken visual connections:

1. **Helmet Cross-Origin Resource Policy (CORP) Blocking:**  
   The backend server used Helmet with default configuration (`crossOriginResourcePolicy: same-origin`), which prevented the frontend client (`localhost:5173`) from loading media assets from the backend (`localhost:5001/uploads/*`) across origins.
2. **Missing Structured Schema for Visual Clues:**  
   The Gemini evidence prompt schema lacked explicit typing for `cctv` frames (`cameraTag`, `timestamp`, `observedEntities`, `imageUrl`) and photographic forensic evidence (`image` type with `caption`, `location`, `imageUrl`). As a result, Gemini rarely generated visual clue metadata.
3. **Evidence Locker Missing Visual Tabs & Previews:**  
   `EvidenceLocker.tsx` only had filter tabs for `document`, `witness_statement`, `chat`, and `cctv`. It lacked an `image` category for forensic photographs, and evidence cards only displayed generic icon placeholders without visual thumbnail previews.
4. **Lack of Suspect-to-Evidence Visual Continuity:**  
   When CCTV footage was generated, there was no cross-referencing of suspect physical descriptions (age, hair, clothing) into CCTV visual prompts.
5. **Silent Exception Swallowing:**  
   The mystery generation pipeline had an empty `catch (visErr) {}` block that silently swallowed failures if external image APIs were unavailable, leaving suspects and evidence with undefined image fields.
6. **Procedural Fallback Static Placeholder Collision:**  
   The offline procedural generator referenced hardcoded image URLs rather than generating dynamic, scenario-slugged assets for each unique investigation.

---

## 3. Implemented Architectural Changes

### A. Three-Tier Zero-Budget Image Generation Pipeline
Implemented in `server/src/services/media/imageGeneration.service.ts`:
- **Tier 1 (Hugging Face FLUX.1-schnell):** Primary endpoint using free serverless inference API (`black-forest-labs/FLUX.1-schnell`) with 18s bounded abort controller and image magic-byte validation.
- **Tier 2 (Pollinations FLUX & Turbo):** Free zero-config open-access endpoints with sequential retry (FLUX 16s timeout -> Turbo 12s timeout) and magic-byte checks (`FF D8 FF` for JPEG, `89 50 4E 47` for PNG).
- **Tier 3 (Scenario-Specific Dynamic SVG Fallback):** 100% reliable, zero-budget, offline dynamic SVG generator producing high-contrast cinematic noir cards customized with suspect name, role, clothing color palette, CCTV night-vision scanlines, camera timestamps, and forensic evidence tags.

### B. Persistent Dual-Storage & Render Free Ephemeral Disk Recovery
- **Local Disk Cache:** `./uploads/` directory for zero-latency local development and container-local serving.
- **MongoDB Atlas Binary Persistence:** Every generated asset is stored in the `MediaAssetModel` collection in MongoDB Atlas (Base64 payload + metadata).
- **Auto-Recovery on Ephemeral Wipe:** When Render Free spins down or restarts a container, wiping the local filesystem, the server automatically recovers the binary asset from MongoDB Atlas on the first request and restores the file to the local disk.

### C. Scenario & Character Consistency Pipeline
- `server/src/services/gemini/prompts/evidencePrompt.ts`: Added schema requirements for structured CCTV multi-frame sequences and photographic forensic items.
- `server/src/services/gemini/prompts/visualPrompt.ts`: Directs Gemini to produce consistent physical trait profiles (age, hair, wardrobe, colors) for each suspect.
- `server/src/services/mystery/generation/mysteryGenerator.ts`: Cross-references suspect physical profiles into CCTV frame prompts to preserve visual continuity (e.g., suspect clothing colors and hair match CCTV observation notes).

### D. Evidence Locker & Inspection UI Enhancements
- `client/src/features/investigation/EvidenceLocker.tsx`:
  - Added filter tab: **"Crime Scene & Clues"** (`image` type) with camera icon.
  - Added rich thumbnail previews directly on evidence cards for CCTV and photographic evidence.
  - Added media type badge overlays and hover-zoom effects.
- `client/src/components/evidence/CctvViewer.tsx`:
  - Added animated loading skeleton (`Loader2`).
  - Added friendly error state with retry button.
  - Added full-screen modal zoom inspection when clicking CCTV frames.
- `client/src/components/evidence/DocumentViewer.tsx`:
  - Added dedicated photo preview mode for `type === "image"`.
  - Added full-screen zoom modal and loading skeleton.
- `client/src/features/investigation/SuspectsPanel.tsx`:
  - Added full-resolution portrait zoom modal when clicking suspect avatars.

---

## 4. End-to-End Verification Across 5 Diverse Scenarios

A test suite (`server/scripts/runFiveScenariosTest.ts`) was executed against the live application and database across 5 distinct genres:

| # | Scenario Title | Genre | Case ID | Generated Assets | Overlaps | Status |
|---|----------------|-------|---------|------------------|----------|--------|
| 1 | The St. Regis Shadow Flicker (Missing Diamond Necklace) | Theft | `6ae78234a9370d1777c6daee` | 6 (4 Suspects, 1 CCTV, 1 Photo) | 0 | PASS |
| 2 | The Astronomer's Vanishing Act (Museum Painting Theft) | Museum | `6ae7824da9370d1777c6db09` | 6 (4 Suspects, 1 CCTV, 1 Photo) | 0 | PASS |
| 3 | The Ghost in the Kensington Code (Missing Person) | Disappearance | `6ae78264a9370d1777c6db24` | 6 (4 Suspects, 1 CCTV, 1 Photo) | 0 | PASS |
| 4 | The Null-Byte Breach (Office Data Theft) | Corporate | `6ae78344a9370d1777c6db3f` | 6 (4 Suspects, 1 CCTV, 1 Photo) | 0 | PASS |
| 5 | The Zero-Kelvin Heist (Suspicious Laboratory Incident) | Suspicious Incident | `6ae78356a9370d1777c6db5a` | 6 (4 Suspects, 1 CCTV, 1 Photo) | 0 | PASS |

### Key Results:
- **Total Cases Created:** 5
- **Total Unique Visual Assets Synthesized:** 30
- **Cross-Mystery Duplicate Image Overlaps:** 0 (100% visual uniqueness across investigations)
- **Suspect Portrait Coverage:** 20 / 20 (100% of suspects have verified avatar URLs)
- **CCTV & Photographic Evidence Coverage:** 10 / 10 (100% of visual evidence items have verified image assets)
- **Real Image Generation Verified:** Tier 2 Pollinations generated valid JPEG assets (e.g. `asset_d665f2ae70054254.jpg`, 36.8 KB; `asset_3d2152a773a94da4.jpg`, 34.9 KB).
- **Ephemeral Disk Wipe Recovery Verified:** Simulated ephemeral container wipe by deleting local asset `asset_c92d0a5260c14e0c.svg`; the server restored the 2,086-byte file from MongoDB Atlas and re-cached it to disk.

---

## 5. Automated Unit & Integration Test Results

All 7 test files and 31 unit/integration tests passed:

```
 RUN  v3.2.7 D:/Projects/AI_MYSTERY/server

 ✓ tests/imageGeneration.test.ts (7 tests)
 ✓ tests/consistencyValidator.test.ts (6 tests)
 ✓ tests/health.test.ts (3 tests)
 ✓ tests/history.api.test.ts (2 tests)
 ✓ tests/accusation.scoring.test.ts (3 tests)
 ✓ tests/mystery.api.test.ts (3 tests)
 ✓ tests/mystery.model.test.ts (7 tests)

 Test Files  7 passed (7)
      Tests  31 passed (31)
```

Both TypeScript compilers (`tsc` for server and `vite build` for client) completed with zero errors.

---

## 6. Zero-Budget & Storage Limitations Documentation

1. **API Cost:** \$0.00. No paid APIs (OpenAI, Stability AI, Midjourney) or subscriptions are used.
2. **Free-Tier Limits:**
   - Pollinations: Free open-access endpoints; subject to intermittent network load. When unavailable, Tier 3 SVG fallback activates instantly with zero downtime.
   - Hugging Face FLUX.1-schnell: Free serverless inference rate limits vary by IP. Fallback gracefully transfers to Tier 2/3.
3. **Storage Limitations:**
   - Render Free provides ephemeral local storage. Any files saved only to disk are destroyed on spin-down.
   - MongoDB Atlas Free Tier provides 512 MB of persistent storage. Storing optimized SVG and compressed JPEG assets consumes under 50 KB per investigation, allowing over 10,000 complete investigations before approaching storage limits.

