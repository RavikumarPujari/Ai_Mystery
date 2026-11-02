# Master Implementation Plan

**Project:** AI Mystery Room  
**Methodology:** Spec-Driven Development (SDD)  
**Specification Version:** 1.0.0  
**Status:** Approved for Implementation  
**Governing Documents:** `spec.md`, `DECISIONS.md`

---

## Overview

This implementation plan defines the ordered sequence of phases to build AI Mystery Room. Each phase contains clear objectives, requirements mapped from `spec.md`, files to create or modify, testing criteria, and explicit acceptance criteria.

---

## Phase 0: Repository Inspection and Planning

- **Status:** Completed
- **Objectives:**
  - Verify workspace state and environment capabilities (Node.js v24.12.0, npm v11.6.2).
  - Analyze `spec.md`.
  - Author `DECISIONS.md` establishing core architectural records (ADR-001 through ADR-006).
  - Author this master `IMPLEMENTATION_PLAN.md`.
- **Deliverables:**
  - `DECISIONS.md`
  - `IMPLEMENTATION_PLAN.md`

---

## Phase 1: Project Foundation & Architecture Scaffolding

- **Goal:** Set up the monorepo structure, backend Express server, frontend Vite/React client, database connection, health endpoint, testing harness, and environment configuration.
- **Requirements Covered:** FR-035, AC-015, AC-016.
- **Tasks:**
  1. **Root Scaffolding**:
     - `package.json` with npm workspaces (`client`, `server`) and top-level scripts.
     - `.gitignore`, `.env.example`, `README.md`.
  2. **Server Foundation (`server/`)**:
     - Initialize TypeScript configuration (`tsconfig.json`).
     - Setup Express app in `server/src/app.ts` and entry point `server/src/server.ts`.
     - Configure middleware: `cors`, `helmet`, `express.json` with size limits, request ID tagging.
     - Configure environment variable validation with `zod` (`server/src/config/env.ts`).
     - Setup MongoDB connection with Mongoose (`server/src/config/database.ts`).
     - Implement standard response handler (`success` and `error` formats from Section 9.1).
     - Implement `GET /health` (`server/src/routes/health.routes.ts`).
     - Configure Vitest + Supertest testing harness with `mongodb-memory-server`.
  3. **Client Foundation (`client/`)**:
     - Initialize Vite + React + TypeScript app (`tsconfig.json`, `vite.config.ts`).
     - Configure Tailwind CSS with the detective dark theme palette (charcoal, slate, amber, crimson).
     - Install and configure TanStack Query, React Router, Lucide React icons.
     - Setup client API HTTP client with standard response interceptor.
  4. **Acceptance Criteria**:
     - Server starts and responds with `{ "success": true, "data": { "status": "ok" } }` on `GET /health`.
     - Client builds and runs cleanly with Vite.
     - Vitest runs and passes baseline health tests in `server/`.
     - Zero secrets in repository.

---

## Phase 2: UI Foundation & Detective Design System

- **Goal:** Build the responsive detective design system, accessible navigation, layout, home page, and scenario creation form.
- **Requirements Covered:** FR-001, FR-002, FR-003, AC-001, AC-014.
- **Tasks:**
  1. **Detective Design System Components (`client/src/components/common/`)**:
     - Button, Card, Badge, Modal, Input, Textarea, Select, Tabs, Spinner, SkeletonLoader.
     - Prominent disclaimer banner: `SIMULATED EVIDENCE — AI-GENERATED FICTIONAL EVIDENCE`.
  2. **App Layout (`client/src/components/layout/`)**:
     - Header / Navbar with case status pill and navigation links.
     - Footer with disclaimers, privacy notes, and fictional entertainment statement.
  3. **Pages**:
     - **Home Page (`client/src/pages/HomePage.tsx`)**: Hero section, mystery showcase, "Create a Mystery" CTA, explanation of mechanics.
     - **Create Mystery Page (`client/src/pages/CreateMysteryPage.tsx`)**:
       - Scenario text area (validated 50–3,000 characters).
       - Genre selector (theft, murder mystery, disappearance, corporate intrigue, museum, digital).
       - Difficulty selector (easy, medium, hard).
       - Suspect count selector (3 to 5).
       - Evidence preferences checkboxes (chat, photograph, CCTV, witness statements, digital records).
       - Media generation toggle (with clear notice on provider dependencies).
     - **Loading / Generation State (`client/src/features/mystery-creation/GenerationProgress.tsx`)**:
       - Stage indicators (Analyzing scenario, Drafting suspects, Constructing timeline, Generating evidence, Validating consistency).
  4. **Acceptance Criteria**:
     - Responsive across mobile, tablet, and desktop viewports.
     - Scenario form performs client-side validation according to specification.
     - Accessible keyboard navigation and contrast ratios meeting WCAG 2.2 AA.

---

## Phase 3: Database Models & Mystery Domain Layer

- **Goal:** Implement Mongoose schemas and domain models enforcing strict separation of public case data and private solution data.
- **Requirements Covered:** FR-004, FR-005, FR-011, FR-016, FR-017, FR-033, AC-010, AC-012.
- **Tasks:**
  1. **Mongoose Schemas (`server/src/models/`)**:
     - `UserModel` (`_id`, `displayName`, `email`, `authProvider`, `passwordHash`).
     - `MysteryModel` (`_id`, `ownerId`, `guestSessionId`, `title`, `originalScenario`, `genre`, `difficulty`, `status`, `publicCase`, `createdAt`).
     - `MysterySolutionModel` (`_id`, `mysteryId`, `culpritSuspectId`, `motive`, `explanation`, `authoritativeTimeline`, `decisiveEvidenceIds`, `redHerringExplanations`, `suspectTruthRecords`).
     - `InvestigationModel` (`_id`, `mysteryId`, `userId`, `guestSessionId`, `status`, `reviewedEvidenceIds`, `submittedSuspectId`, `isCorrect`, `completedAt`).
     - `MediaAssetModel` (`_id`, `caseId`, `evidenceId`, `type`, `status`, `storageKey`, `mimeType`).
  2. **DTO Layer & Serializers (`server/src/utils/dto/`)**:
     - Public Case DTO mapper: guarantees zero leakage of culprit ID, solution timeline, or lies.
     - Public Evidence DTO mapper.
     - Result DTO mapper (revealed strictly post-accusation).
  3. **Repository & Service Layer (`server/src/services/mystery/`)**:
     - `MysteryRepository` & `InvestigationRepository` with indexed queries and session verification.
  4. **Acceptance Criteria**:
     - Model tests verify that saving a mystery and retrieving it via public DTO never includes `MysterySolution` fields.
     - Database indexes created on `email`, `guestSessionId`, `status`, and `createdAt`.

---

## Phase 4: Gemini AI Integration & Consistency Validation Engine

- **Goal:** Implement the multi-stage AI generation pipeline using `@google/genai` structured outputs, backed by deterministic logical validation and bounded repair.
- **Requirements Covered:** FR-006, FR-007, FR-008, FR-009, FR-010, FR-012, FR-013, FR-014, FR-015, FR-018, FR-019, FR-020, FR-036, FR-038, AC-002, AC-003, AC-004, AC-005.
- **Tasks:**
  1. **Gemini Client Service (`server/src/services/gemini/`)**:
     - SDK configuration (`@google/genai`).
     - Structured JSON schema definitions for Blueprint, Suspects, Evidence, and Timeline.
     - Robust error handling (rate limits, timeouts, API outages, safety blocks).
  2. **Multi-Stage Generation Pipeline (`server/src/services/mystery/generation/`)**:
     - Stage 1: Case Blueprint generation (Scenario analysis, incident, single culprit, motive, authoritative sequence).
     - Stage 2: Suspects & Timeline construction (Statements, profiles, alibis).
     - Stage 3: Evidence bundle creation (Simulated chat logs, CCTV storyboards, witness statements, documents).
  3. **Deterministic Consistency Validator (`server/src/services/mystery/validation/`)**:
     - Programmatic check: Culprit ID exists in suspect list.
     - Programmatic check: All evidence items have unique IDs and reference valid suspects/events.
     - Programmatic check: Authoritative timeline timestamps are chronologically valid.
     - Programmatic check: At least 2 independent pieces of evidence point to the culprit.
     - Programmatic check: Red herrings have explicit explanations.
  4. **Bounded Repair Loop**:
     - If validation fails: 1 targeted repair prompt fed back to Gemini. If still invalid: fail safely without saving a corrupt case.
  5. **Endpoints**:
     - `POST /api/v1/mysteries` (Async generation trigger).
     - `GET /api/v1/mysteries/:id/status` (Polling generation status).
  6. **Acceptance Criteria**:
     - Valid scenario produces a complete, structurally sound mystery.
     - Schema validation failures trigger repair or fail safely.
     - Automated test suite tests the validator against valid cases and deliberate bad fixtures (e.g. missing culprit, disjoint evidence).

---

## Phase 5: Investigation Experience (Detective Workspace)

- **Goal:** Build the primary detective investigation interface where players examine suspect dossiers, read chat logs, inspect CCTV storyboards, and review timelines.
- **Requirements Covered:** FR-023, FR-024, FR-025, FR-026, FR-027, AC-006.
- **Tasks:**
  1. **Investigation Dashboard (`client/src/features/investigation/`)**:
     - Case summary banner (Case #, title, location, incident time, difficulty badge).
     - Tabbed / modular layout: **Suspects**, **Evidence Locker**, **Timeline**, **Accuse**.
  2. **Suspects Dossier (`client/src/features/investigation/SuspectsPanel.tsx`)**:
     - Suspect profile cards with role, relationship, initial statement, known motive, and alibi info.
  3. **Evidence Locker (`client/src/features/investigation/EvidenceLocker.tsx`)**:
     - Filter by evidence type (chat, statement, surveillance, digital, photo).
     - Read/Unread tracking synced with backend (`PATCH /api/v1/investigations/:id/progress`).
  4. **Dedicated Evidence Viewers (`client/src/components/evidence/`)**:
     - **Chat Viewer**: WhatsApp-style conversational layout with fictional badges, timestamps, sender bubbles.
     - **CCTV / Surveillance Viewer**: Storyboard frame sequence with timecodes, camera tags, and observation notes.
     - **Document & Statement Viewer**: Formal detective file layout with paper styling and timestamps.
  5. **Investigation Timeline (`client/src/features/investigation/TimelineView.tsx`)**:
     - Chronological event timeline displaying verified public events linked to suspects and evidence.
  6. **Acceptance Criteria**:
     - Player can open, read, and revisit any evidence item.
     - Reviewed evidence state persists to the server.
     - Mobile layout allows effortless switching between dossiers, evidence, and timeline.

---

## Phase 6: Accusation, Atomic Scoring & Solution Reveal

- **Goal:** Implement suspect accusation submission, atomic server-side evaluation against `MysterySolution`, duplicate-submission protection, and comprehensive solution reveal.
- **Requirements Covered:** FR-028, FR-029, FR-030, FR-031, FR-032, FR-034, AC-007, AC-008, AC-009.
- **Tasks:**
  1. **Accusation Interface (`client/src/features/investigation/AccusationModal.tsx`)**:
     - Suspect selection cards with prominent radio selection.
     - Optional "Detective's Reasoning" text field.
     - Confirmation modal before submission warning that answers are final.
  2. **Accusation API (`POST /api/v1/investigations/:id/accusation`)**:
     - Session / ownership verification.
     - Atomic evaluation using MongoDB findOneAndUpdate/transactions: checks if already completed (`ALREADY_SUBMITTED`).
     - Evaluates suspect against `MysterySolutionModel.culpritSuspectId`.
     - Marks investigation as completed, records `isCorrect`, `submittedSuspectId`, `completedAt`.
  3. **Results Page (`client/src/pages/ResultsPage.tsx`)**:
     - Big verdict banner: "Case Solved" (Victory) or "Wrong Suspect" (Defeat).
     - Culprit reveal, real motive, and sequence of events.
     - "How the Clues Add Up": Explains decisive evidence and how contradictions exposed the culprit.
     - "Red Herrings Explained": Reveals why false leads looked suspicious.
  4. **Acceptance Criteria**:
     - Accusation succeeds only once per investigation; repeated requests return conflict.
     - Solution details are strictly inaccessible prior to accusation submission.
     - Both correct and incorrect outcomes correctly show the full evidence-backed explanation.

---

## Phase 7: Optional AI Media & Resilient Fallbacks

- **Goal:** Implement the media provider abstraction for AI-generated images/surveillance assets with graceful fallback to storyboards and text when media is unavailable.
- **Requirements Covered:** FR-021, FR-022, FR-039, AC-011.
- **Tasks:**
  1. **Media Provider Interface (`server/src/services/media/`)**:
     - `MediaGenerationProvider` interface: `generateImage()`, `generateStoryboard()`.
     - Local mock/fallback provider generating thematic SVG/CSS detective illustrations and wireframes.
     - Gemini Imagen provider integration (`@google/genai` Image Generation).
  2. **Media Storage Adapter (`server/src/services/media/storage/`)**:
     - Local filesystem object storage adapter for development (`server/uploads/`).
     - S3 / GCS abstraction interface for production.
  3. **Resilience & Fallback Handling**:
     - Media generation runs asynchronously post-case generation.
     - Any media error or timeout marks asset as `failed` without interrupting the playable mystery.
  4. **Acceptance Criteria**:
     - Cases generate and play completely even with `GEMINI_API_KEY` missing image permissions.
     - All media renders with mandatory `SIMULATED EVIDENCE` disclaimer.

---

## Phase 8: User Accounts, Authentication & Case History

- **Goal:** Optional user registration/login, JWT token authentication, guest-to-user investigation claiming, and case history.
- **Requirements Covered:** Section 10, Section 4.8, AC-012, AC-013.
- **Tasks:**
  1. **Authentication Backend (`server/src/routes/auth.routes.ts`)**:
     - `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`.
     - Password hashing with `bcryptjs`.
     - HttpOnly cookie token or Authorization Bearer token.
     - Guest session claim endpoint (`POST /api/v1/auth/claim-guest-cases`).
  2. **Frontend Auth & History (`client/src/features/auth/`, `client/src/pages/HistoryPage.tsx`)**:
     - Login & Register modals.
     - History page displaying list of past investigations, status, difficulty, and outcomes.
  3. **Acceptance Criteria**:
     - Users can view their own investigations.
     - Cross-user access is strictly forbidden (403/404).

---

## Phase 9: Quality Assurance, Security Hardening & Production Build

- **Goal:** Comprehensive automated test coverage, type checks, linting, rate limiting, security auditing, and deployment build verification.
- **Requirements Covered:** Section 14, AC-015, AC-016.
- **Tasks:**
  1. **Automated Test Suites**:
     - Unit tests for validation, scoring, DTO serialization, and retry logic.
     - Integration tests for end-to-end mystery creation, investigation, accusation, and scoring.
     - Security tests verifying zero solution leak in public responses.
  2. **Security & Production Hardening**:
     - Rate limiting on `/api/v1/mysteries` and `/api/v1/auth/`.
     - Helmet security headers and CORS configuration.
  3. **Build & Documentation**:
     - Root build script: `npm run build` builds both `client` and `server`.
     - Verify full clean build on Node.js v24.
     - Author comprehensive `README.md` with startup and test instructions.
  4. **Acceptance Criteria**:
     - All automated tests pass (`npm run test`).
     - Clean build with zero TypeScript or ESLint errors.
     - All 16 Master Acceptance Criteria (`AC-001` through `AC-016`) verified.

