# Architecture & Product Decision Records

**Project:** AI Mystery Room  
**Methodology:** Spec-Driven Development (SDD)  
**Status:** Approved  
**Related Document:** `spec.md`

This document records formal architectural, security, and design decisions amending or detailing `spec.md`.

---

## ADR-001: Separation of Public Case Data and Private Solution Data

### Context
`spec.md` (Section 8.2 & 8.4) permits either:
1. Embedding `privateSolution` inside the `Mystery` document with strict DTO filtering.
2. Storing `privateSolution` in a separate `mystery_solutions` collection linked by `mysteryId`.

### Decision
We will store `privateSolution` in a **dedicated, separate collection** (`MysterySolution`), associated by foreign key `mysteryId`.

### Rationale
- **Zero-Leak Guarantee**: Queries returning public mystery data from the `Mystery` collection physically cannot leak the solution payload (culprit ID, motives, authoritative timeline, lies), even if an endpoint omits an explicit projection or DTO filter.
- **Access Control Isolation**: Controller methods serving public investigations never touch the `MysterySolution` model; only the accusation scoring service has access to read the solution.
- **Auditability**: Accusation evaluation accesses the solution once upon final submission and caches the evaluated result into the `Investigation` document.

---

## ADR-002: Google Gen AI SDK and Model Selection

### Context
`spec.md` (Section 3.1 & 6.3) requires using the official Google Gen AI JavaScript SDK and structured outputs via JSON schema.

### Decision
- Use the official Google Gen AI JavaScript SDK: `@google/genai`.
- Default target model: `gemini-2.5-flash` for high-speed, cost-effective structured output generation, with `gemini-1.5-flash` / `gemini-2.5-pro` as configurable options via the `GEMINI_MODEL` environment variable.
- For optional image generation: Abstract behind `MediaGenerationProvider` with support for `imagen-3.0-generate-002` or compatible provider, defaulting to local simulated assets / storyboards when not configured.

### Rationale
- `@google/genai` is the unified modern Google Gen AI SDK supporting full structured JSON schema outputs (`responseMimeType: "application/json"`, `responseSchema`).
- `gemini-2.5-flash` provides rapid reasoning and low latency necessary for multi-stage mystery blueprints and evidence consistency checks.

---

## ADR-003: Monorepo Project Structure & Dependency Management

### Context
`spec.md` (Section 3.3) defines a project structure comprising `client/`, `server/`, and root documentation.

### Decision
We will organize the repository using npm workspaces:
- Root: `package.json` configuring workspaces `["client", "server"]` with shared development commands (`npm run dev`, `npm run build`, `npm run test`, `npm run lint`).
- `client/`: Vite, React 18+, TypeScript, Tailwind CSS, TanStack Query, React Router, Lucide icons.
- `server/`: Node.js, Express, TypeScript, Mongoose, Zod for request/response validation, `@google/genai`.

### Rationale
- Keeps frontend and backend dependencies clean and isolated while allowing single-command local development.
- Shared script ergonomics for automated testing and CI.

---

## ADR-004: Guest Session Identification

### Context
`spec.md` (Section 4.8 & 8.5) requires a guest-first MVP experience where users can play without immediately creating an account, while preventing cross-session tampering.

### Decision
- Issue a cryptographically signed guest session identifier (`guestSessionId`) via an HttpOnly cookie or custom header `X-Guest-Session-Id`.
- Investigations created by a guest store `guestSessionId`.
- Progress updates and accusation submissions require matching this session identifier until or unless transferred to an authenticated user account.

### Rationale
- Completely frictionless onboarding for new players.
- Prevents malicious users from overwriting or submitting accusations on ongoing cases that do not belong to them.

---

## ADR-005: Media Generation & Resilient Fallback Strategy

### Context
`spec.md` (Section 7.3 & 7.4) requires that AI-generated media (photos, surveillance CCTV) must be optional and must never cause game generation failure or block text gameplay.

### Decision
- CCTV is modeled as structured text events, surveillance logs, and storyboard frames (timestamp + camera label + observation summary).
- If image generation is enabled and an API key/quota is available, frames/photos are rendered into image assets.
- If image generation is disabled, times out, or errors out, the UI gracefully renders dark-theme terminal surveillance logs and SVG/CSS storyboard wireframes with explicit fictional disclaimers.

### Rationale
- Total resilience against AI rate limits, image provider billing restrictions, or network failures.
- Preserves 100% of the clue integrity and reasoning requirements regardless of media status.

---

## ADR-006: In-Memory Database for Automated Testing

### Context
`spec.md` (Section 14) mandates automated unit and integration testing with Vitest and Supertest. Local developer machines or CI environments may not always have a running native MongoDB daemon.

### Decision
- Use `mongodb-memory-server` for server integration test suites.
- Production and local runtime use standard MongoDB connection strings via `MONGODB_URI`.

### Rationale
- Allows tests to execute completely isolated, with automatic teardown and no external daemon dependency.
- Fast, reproducible, and zero-pollution test execution.

