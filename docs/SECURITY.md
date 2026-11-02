# AI Mystery Room — Security & Privacy Architecture

This document outlines the security controls, cheat-prevention mechanisms, prompt injection defenses, and privacy policies implemented in accordance with Section 12 of `spec.md`.

---

## 1. Cheat Prevention & Zero Solution Leaks

1. **Physical Collection Separation (ADR-001)**:
   - Solution fields (`culpritSuspectId`, `motive`, `authoritativeTimeline`, `liesTold`) are stored in `MysterySolutionModel`, completely separated from the `MysteryModel`.
   - Public dossier queries physically cannot return solution data.
2. **Explicit DTO Allowlisting**:
   - `toPublicMysteryDto` maps only explicitly allowlisted fields.
   - Raw Mongoose documents are never serialized into API responses.
3. **Pre-Accusation Lockout**:
   - `GET /api/v1/investigations/:id/result` returns HTTP 409 `RESULT_NOT_AVAILABLE` if accessed prior to official accusation submission.
4. **Server-Authoritative Scoring**:
   - The frontend never evaluates or checks answers. Accusations are submitted to the server, evaluated atomically against `MysterySolutionModel`, and permanently recorded.
5. **Immutable Submissions**:
   - Once submitted, an investigation is marked as `completed`. Re-attempts return HTTP 409 `ALREADY_SUBMITTED`.

---

## 2. Prompt Injection Defense

All user scenarios are treated as **untrusted narrative story material**:
- System directives clearly instruct the model that user inputs are creative premises only.
- Scenarios are wrapped inside isolated delimiters.
- The model is not equipped with external code-execution tools or server access.
- Generated output is parsed against strict JSON schema definitions; invalid schemas are rejected by the consistency validator.

---

## 3. Rate Limiting & AI Cost Protection

- `createRateLimiter` enforces sliding-window limits on `/api/v1/mysteries` (max 10 requests per 5 minutes per session/IP).
- Scenario length is strictly bounded between 50 and 3,000 characters.
- Suspect count is constrained between 3 and 5.
- Media generation is asynchronous and decoupled, preventing long-running blocking requests.

---

## 4. Fictional Content Safety & Disclaimers

In accordance with Section 12.5 of `spec.md`:
- Prominent disclaimers appear on all evidence views, headers, and footers:  
  `SIMULATED EVIDENCE — AI-GENERATED FICTIONAL EVIDENCE`
- Prohibits actionable instructions for committing real-world violence.

