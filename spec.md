# AI MYSTERY ROOM
## Master Product & Technical Specification

**Document:** `SPEC.md`  
**Project:** AI Mystery Room  
**Specification Version:** 1.0.0  
**Status:** Initial implementation specification  
**Development Methodology:** Spec-Driven Development (SDD)  
**Primary Implementation Agent:** OpenAI Codex  
**Application Type:** AI-powered interactive mystery investigation web application

---

# 1. PURPOSE OF THIS DOCUMENT

This document defines the complete requirements, architecture, functionality, data models, API contracts, AI behavior, security requirements, user experience, testing strategy, and implementation rules for AI Mystery Room.

It is the project's single source of truth.

Codex must use this specification to:
- Understand the project before writing code.
- Design the application architecture.
- Implement frontend and backend features.
- Integrate the Gemini API.
- Generate coherent mysteries and fictional evidence.
- Implement database models and API endpoints.
- Validate functionality and security.
- Write automated tests.
- Track implementation progress.
- Prevent unnecessary redesigns and scope changes.

## 1.1 Authority

The following precedence applies:

1. `SPEC.md` — authoritative product and technical requirements.
2. `DECISIONS.md` — approved decisions that formally amend or clarify `SPEC.md`.
3. `IMPLEMENTATION_PLAN.md` — implementation sequence derived from the specification.
4. Source code — implementation of the approved requirements.
5. `README.md` — setup instructions and project overview.

If a conflict is discovered, Codex must not silently choose an interpretation. It must identify the conflict and request clarification when the decision materially affects architecture, security, data integrity, or product behavior.

Small implementation details that do not conflict with the specification may be decided by Codex using established engineering practices.

---

# 2. PROJECT OVERVIEW

## 2.1 Product concept

AI Mystery Room is an interactive mystery-solving website where users create investigations from short stories or scenarios.

A user supplies a scenario describing an incident, location, event, or suspicious situation.

The backend uses Google's Gemini API to transform that scenario into a fictional investigation.

The generated investigation contains:
- A case introduction.
- A crime or mysterious incident.
- Multiple suspects.
- Suspect profiles and statements.
- An investigation timeline.
- Evidence and clues.
- Simulated WhatsApp-style conversations.
- AI-generated photographs where supported.
- Simulated CCTV footage or surveillance-style evidence where supported.
- Contradictions and hidden clues.
- One intended culprit.
- A hidden explanation of what happened.

The player examines the evidence, compares statements, develops a theory, and selects the person they believe is responsible.

After submission, the application evaluates the accusation and reveals the solution.

## 2.2 Product vision

Create an immersive, accessible, and logically consistent mystery-solving experience in which AI generates the investigation while the player performs the reasoning.

The application should feel like an interactive detective investigation rather than a chatbot conversation.

## 2.3 Core product loop

**Create scenario → Generate case → Investigate evidence → Analyze suspects → Submit accusation → Reveal solution → Review result**

This loop defines the minimum viable product.

## 2.4 Target audience

- Mystery and detective-story enthusiasts.
- Casual gamers.
- Students who enjoy logic and reasoning challenges.
- Users interested in interactive AI-generated stories.
- Groups who want to solve fictional mysteries together in the future.

## 2.5 Product principles

1. Mystery quality is more important than generating content quickly.
2. Every important accusation must be supported by discoverable evidence.
3. Evidence must be internally consistent.
4. The culprit must be selected from the generated suspects.
5. Players must not be able to access the hidden solution through ordinary client requests.
6. AI generation failures must not corrupt saved cases.
7. Expensive AI and media operations must be controlled.
8. The application must work even when optional media generation is unavailable.
9. All investigation artifacts must be fictional and clearly labeled.
10. The core experience must remain usable on desktop and mobile.

---

# 3. TECHNOLOGY STACK

## 3.1 Required stack

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend | React | User interface |
| Language | TypeScript | Type safety across the application |
| Frontend build tool | Vite | Development server and production builds |
| Styling | Tailwind CSS | Responsive styling |
| UI components | Accessible reusable React components | Consistent interface |
| Client routing | React Router | Navigation |
| Server state | TanStack Query | API fetching, caching, and mutations |
| HTTP client | Axios or native Fetch | Frontend-to-backend communication |
| Backend | Node.js | Server runtime |
| Backend framework | Express | REST API |
| Backend language | TypeScript | Server-side type safety |
| Database | MongoDB | Persistent application data |
| ODM | Mongoose | MongoDB schemas, validation, and queries |
| AI | Google Gemini API | Mystery and evidence generation |
| Authentication | JWT-based authentication | Optional account authentication |
| Password hashing | Argon2id or bcrypt | Secure password storage |
| Media storage | Object storage adapter | Generated image and video assets |
| Testing | Vitest, React Testing Library, Supertest | Unit and integration testing |
| Code quality | ESLint and Prettier | Consistent code quality |

The specific supported Gemini model and SDK must be selected from the current official Google documentation when implementation begins.

Codex must not hard-code an assumed model identifier without verifying that the model supports the required operation.

Official references:

- Google Gemini API documentation: https://ai.google.dev/gemini-api/docs
- Gemini structured outputs: https://ai.google.dev/gemini-api/docs/structured-output
- Google Gen AI JavaScript SDK: https://github.com/googleapis/js-genai
- MongoDB documentation: https://www.mongodb.com/docs/
- Express documentation: https://expressjs.com/
- React documentation: https://react.dev/

## 3.2 Architecture

Use a modular MERN architecture.

```text
┌──────────────────────────────────────┐
│            React Frontend            │
│                                      │
│  Home / Create / Case / Evidence     │
│  Suspects / Accusation / Results     │
└──────────────────┬───────────────────┘
                   │ HTTPS REST API
                   ▼
┌──────────────────────────────────────┐
│          Express Backend             │
│                                      │
│ Authentication and Authorization     │
│ Input Validation                     │
│ Mystery Generation Orchestration     │
│ Evidence Management                  │
│ Investigation and Accusation Logic   │
│ Rate Limiting and Security           │
└──────────┬──────────────┬────────────┘
           │              │
           ▼              ▼
┌──────────────────┐  ┌──────────────────┐
│    MongoDB       │  │  Gemini Service  │
│                  │  │                  │
│ Users            │  │ Case generation  │
│ Mysteries        │  │ Evidence text    │
│ Investigations   │  │ Structured data  │
│ Evidence         │  │ Validation repair│
│ Attempts         │  │ Optional media   │
└──────────────────┘  └────────┬─────────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │ Object Storage   │
                    │ Generated Media  │
                    └──────────────────┘
```

### Architecture rules

- The browser must never call Gemini directly.
- The Gemini API key must exist only on the backend.
- Database access must remain on the backend.
- AI generation must be handled by a dedicated service layer.
- Business logic must not be placed directly inside route handlers.
- Media storage must be abstracted behind a service interface.
- The frontend must consume explicit API response DTOs.
- The hidden solution must never be included in public case responses.
- The database must be the source of truth for saved investigation state.

## 3.3 Proposed project structure

```text
ai-mystery-room/
│
├── SPEC.md
├── DECISIONS.md
├── IMPLEMENTATION_PLAN.md
├── README.md
├── .gitignore
├── .env.example
├── package.json
│
├── client/
│   ├── package.json
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── layout/
│   │   │   ├── mystery/
│   │   │   ├── evidence/
│   │   │   └── suspects/
│   │   ├── pages/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── mystery-creation/
│   │   │   ├── investigation/
│   │   │   └── results/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── styles/
│   │   └── main.tsx
│   └── tests/
│
├── server/
│   ├── package.json
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── config/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   │   ├── gemini/
│   │   │   ├── mystery/
│   │   │   ├── evidence/
│   │   │   ├── media/
│   │   │   └── investigation/
│   │   ├── models/
│   │   ├── middleware/
│   │   ├── validators/
│   │   ├── schemas/
│   │   ├── utils/
│   │   └── types/
│   └── tests/
│
└── docs/
    ├── API.md
    ├── DATA_MODEL.md
    ├── SECURITY.md
    └── TESTING.md
```

Codex may adjust the exact structure when necessary, but must preserve clear frontend, backend, database, AI, and media boundaries.

---

# 4. USER EXPERIENCE AND APPLICATION PAGES

## 4.1 Home page

Purpose: Introduce the product and invite the user to start an investigation.

Required elements:

- Product name and branding.
- Short explanation of the experience.
- Primary button: "Create a Mystery".
- Secondary button: "Explore Mysteries", if a public case library is implemented.
- Feature overview.
- Example mystery or demonstration case.
- Footer with privacy, terms, and fictional-content disclaimer.

The primary call to action must navigate to the mystery creation page.

## 4.2 Create Mystery page

This is the starting point for a new investigation.

Required fields:

| Field | Requirement |
|---|---|
| Scenario | Required; minimum 50 characters and maximum 3,000 characters |
| Mystery genre | Optional selection |
| Difficulty | Required selection |
| Number of suspects | Configurable within supported limits |
| Evidence preference | Optional selection |
| Media generation | Optional selection |

### Supported genres

- Murder mystery.
- Theft.
- Disappearance.
- Corporate intrigue.
- Art or museum mystery.
- Digital mystery.
- Suspicious incident.
- General detective investigation.

Murder-related cases must remain fictional and must not provide actionable instructions for committing real-world violence.

### Difficulty levels

**Easy**
- Three suspects by default.
- Clear but not trivial clues.
- Limited timeline complexity.
- Obvious contradictions once evidence is compared.

**Medium**
- Four suspects by default.
- Multiple evidence types.
- More than one plausible theory initially.
- Contradictions requiring cross-referencing.

**Hard**
- Five suspects by default.
- Interconnected evidence.
- More subtle contradictions.
- Multiple timelines or indirect clues.
- Requires careful reasoning rather than guessing.

The difficulty determines case complexity, not whether the solution is logically valid.

### Evidence preferences

The user can select one or more:

- Chat conversations.
- Photographs.
- CCTV-style evidence.
- Witness statements.
- Digital records.
- Documents.
- Timeline records.

If no preference is selected, the system generates a balanced combination.

### Media controls

Media generation must be optional because image and video generation can be slower or more expensive than text generation.

The user should be informed that media availability depends on the configured generation providers.

### Submission behavior

On submission:

1. Validate the scenario.
2. Validate selected options.
3. Show a loading state.
4. Submit the request to the backend.
5. Create a generation job.
6. Display generation progress.
7. Navigate to the case when generation succeeds.

If generation fails, display a recoverable error and provide a retry action.

The frontend must not create the culprit or solution itself.

## 4.3 Mystery generation screen

Show meaningful progress states, such as:

- Understanding the scenario.
- Creating suspects.
- Constructing the timeline.
- Generating evidence.
- Checking consistency.
- Preparing the investigation.

These are user-interface progress indicators. They must not falsely claim that a particular AI operation is complete unless the backend has confirmed it.

If generation takes longer than a normal HTTP request, use asynchronous jobs and polling.

## 4.4 Investigation page

This is the primary gameplay interface.

The layout should resemble a modern detective case-management workspace.

### Main sections

**A. Case overview**
- Case title.
- Case number.
- Incident summary.
- Incident location.
- Incident time or date.
- Case difficulty.
- Investigation status.

**B. Suspects**
- Suspect name.
- Portrait or avatar, when available.
- Role in the scenario.
- Relationship to the incident.
- Known motive.
- Initial statement.
- Relevant alibi information.

**C. Evidence locker**
- Evidence identifier.
- Evidence title.
- Evidence category.
- Evidence description.
- Discovery context.
- Evidence preview.
- Time and source, where relevant.
- Read, unread, or reviewed status.

**D. Investigation timeline**
- Events in chronological order.
- Event times.
- Related suspects.
- Related evidence references.

**E. Final accusation**
- Button to open the accusation interface.
- List of eligible suspects.
- Confirmation before submission.

### Gameplay requirements

- Evidence must be readable and accessible.
- Evidence must not be revealed only through color.
- Players must be able to revisit previously viewed evidence.
- Evidence ordering must not expose the solution accidentally.
- The UI must distinguish confirmed facts from suspect claims.
- Contradictions should be discoverable from evidence, not arbitrarily invented by the interface.
- The interface must not display hidden reasoning or internal AI prompts.

## 4.5 Evidence viewer

Each evidence item opens in a dedicated viewer or modal.

Supported evidence types:

| Type | Presentation |
|---|---|
| Chat transcript | Messaging interface with timestamps and sender names |
| Photograph | Image viewer with caption and source |
| CCTV-style artifact | Video player or static storyboard |
| Witness statement | Document-style layout |
| Digital record | Log or record viewer |
| Timeline entry | Chronological event card |
| General document | Document viewer |

### Chat evidence

Chat conversations must include:
- Fictional participants.
- Message text.
- Timestamps.
- Conversation identifier.
- Optional attachment references.
- Evidence source context.

The interface may resemble a familiar messaging application, but must not use branding or presentation that falsely implies an authentic WhatsApp export.

Display a visible label such as:

**SIMULATED CHAT — AI-GENERATED FICTIONAL EVIDENCE**

### CCTV evidence

CCTV-style evidence may consist of:
- A generated video.
- A sequence of generated still images.
- A storyboard.
- A textual surveillance log.

The system must never claim to have generated a playable video when it only has still images.

If a provider cannot generate video, the application must fall back to a storyboard or textual surveillance record.

Display:

**SIMULATED SURVEILLANCE — AI-GENERATED FICTIONAL EVIDENCE**

### Photographic evidence

Images must be linked to the case and evidence item that use them.

If image generation fails, show a meaningful placeholder and preserve the textual evidence.

Generated media must not be required for a case to remain playable.

## 4.6 Accusation page or modal

The player selects one suspect.

Required elements:

- Clear case reference.
- Suspect selection cards.
- Selected suspect confirmation.
- Optional reasoning field.
- Final submission button.
- Warning that the submitted answer will be evaluated.

The reasoning field is optional and must not be required to score the accusation.

After final submission, the accusation becomes immutable for that investigation attempt.

If multiple attempts are introduced in a future version, they must be modeled explicitly rather than silently allowing repeated submissions.

## 4.7 Results page

Display:

- Correct or incorrect result.
- The player's selected suspect.
- The actual culprit.
- The culprit's motive.
- What happened.
- Reconstructed timeline.
- Evidence supporting the conclusion.
- Contradictions that exposed the culprit.
- Explanation of misleading clues.
- Investigation completion status.

The solution must be returned only after a valid accusation submission.

The results page must explain the conclusion using evidence already present in the case.

A case must not introduce an entirely new, decisive piece of evidence only after the answer is submitted.

## 4.8 History page

Authenticated users can view their own investigations.

Display:
- Case title.
- Creation date.
- Difficulty.
- Status.
- Final result, if completed.
- Link to resume or review the case.

Users must not be able to access another user's private cases by changing an identifier.

Guest investigations may be supported without accounts, but their storage and recovery behavior must be documented and implemented explicitly.

---

# 5. CORE FUNCTIONAL REQUIREMENTS

Requirements use stable identifiers so they can be referenced by implementation tasks and tests.

## 5.1 Mystery creation

**FR-001:** The system must accept a user-written scenario.

**FR-002:** The system must validate the scenario before starting AI generation.

**FR-003:** The system must support the configured genres, difficulty levels, and evidence preferences.

**FR-004:** The system must generate a unique case identifier.

**FR-005:** The system must save the generated case to MongoDB.

**FR-006:** A case must not become playable until its required structured content has passed validation.

**FR-007:** Generation failure must leave the case in a recoverable failed state or remove the incomplete draft safely.

**FR-008:** Retrying a generation request must not accidentally create duplicate cases from the same idempotency key.

## 5.2 Suspect generation

**FR-009:** Every playable case must contain at least three suspects.

**FR-010:** The configured suspect count must be respected.

**FR-011:** Every suspect must have a unique identifier within the case.

**FR-012:** The culprit must be one of the generated suspects.

**FR-013:** Suspects must have distinguishable profiles, relationships, statements, and relevant facts.

**FR-014:** Suspect statements must agree with the authoritative timeline except where an intentional lie, mistake, or unreliable account is explicitly represented.

## 5.3 Evidence generation

**FR-015:** Every playable case must contain multiple evidence items.

**FR-016:** Every evidence item must have a unique identifier within its case.

**FR-017:** Every evidence item must reference its associated case.

**FR-018:** Evidence must have a type, title, description, and source context.

**FR-019:** Evidence must be linked to relevant suspects, events, or other evidence where appropriate.

**FR-020:** Generated evidence must not contradict the authoritative solution accidentally.

**FR-021:** Media-generation failure must not prevent text-based investigation.

**FR-022:** All AI-generated media must be identified as fictional.

## 5.4 Investigation

**FR-023:** The user must be able to open any available evidence item.

**FR-024:** The user must be able to revisit evidence.

**FR-025:** The user must be able to inspect suspect profiles.

**FR-026:** The user must be able to inspect the case timeline.

**FR-027:** The investigation state must be saved when the case is persistent.

## 5.5 Accusation and scoring

**FR-028:** The user must select a suspect from the case's valid suspect list.

**FR-029:** The backend must validate the selected suspect.

**FR-030:** The backend must evaluate the accusation against the stored solution.

**FR-031:** The result must be saved to the investigation attempt.

**FR-032:** The result endpoint must return the explanation after submission.

**FR-033:** The backend must not expose the culprit through ordinary case retrieval endpoints.

**FR-034:** The same submitted accusation must not be processed repeatedly in a way that produces duplicate attempts.

## 5.6 Reliability

**FR-035:** All API endpoints must return consistent error responses.

**FR-036:** All external AI requests must have timeouts and bounded retries.

**FR-037:** The system must log generation failures without logging secrets or unnecessary personal information.

**FR-038:** The application must handle invalid AI output safely.

**FR-039:** A failed media request must not destroy a successfully generated mystery.

---

# 6. AI MYSTERY GENERATION ENGINE

This section defines the most important backend subsystem.

## 6.1 Generation strategy

Use a multi-stage generation pipeline rather than asking Gemini to produce an entire mystery as an unvalidated block of prose.

The pipeline is:

```text
User Scenario
     |
     v
Input Validation
     |
     v
Case Blueprint Generation
     |
     v
Hidden Solution and Timeline
     |
     v
Suspects and Relationships
     |
     v
Evidence and Statements
     |
     v
Consistency Validation
     |
     +---- Invalid ---> Bounded Repair Attempt
     |                         |
     |                         v
     |                    Revalidation
     |
     v
Playable Case Assembly
     |
     v
Optional Media Generation
     |
     v
Persistence and Ready State
```

The system should generate the authoritative case blueprint and solution before generating evidence.

This reduces contradictions between evidence items.

## 6.2 Authoritative case blueprint

The blueprint must contain:

- Case title.
- Scenario interpretation.
- Incident summary.
- Incident type.
- Location.
- Incident time.
- Victim or affected party, if applicable.
- Suspect identifiers.
- Actual culprit identifier.
- Motive.
- Opportunity.
- Method or sequence of events, at a non-instructional fictional level.
- Authoritative timeline.
- Facts known to the culprit.
- Facts known to each suspect.
- True statements.
- False or misleading statements.
- Required clues.
- Red herrings.
- Expected conclusion.
- Explanation of the solution.

This blueprint is private server-side data.

## 6.3 Gemini structured output

Use Gemini structured output with a JSON schema where supported.

Do not rely on free-form text parsing for the core case structure.

Validate all generated data on the backend even when Gemini reports that the response follows the requested schema.

Validation must include:
- Required fields.
- Correct data types.
- Allowed enumerations.
- Valid identifiers.
- Unique suspect IDs.
- Unique evidence IDs.
- Valid timestamps.
- Valid references.
- Maximum content lengths.
- Valid culprit references.
- Timeline consistency.
- Evidence-to-solution consistency.

A schema-valid response is not necessarily a logically valid mystery.

## 6.4 Generation quality rules

Every playable case must satisfy the following.

### One intended culprit

There must be one authoritative culprit for the standard game mode.

The culprit must be a member of the suspect list.

### Sufficient proof

The case must include enough evidence to support the intended accusation.

At least two independent pieces of evidence should support the central conclusion, where the scenario permits this.

### No impossible timeline

A suspect must not be conclusively located in two incompatible places at the same time unless the inconsistency is an intentional clue.

### Fair red herrings

Misleading clues may create suspicion but must not make an innocent suspect equally well-supported by the decisive evidence.

### No arbitrary solution

The final explanation must follow from the supplied evidence.

### Stable identifiers

The model must generate stable IDs for entities within a case or the backend must assign and normalize them.

All references must resolve correctly before persistence.

## 6.5 Consistency validator

Implement a dedicated validator service.

It should check:

1. The culprit exists.
2. All evidence references valid suspects or events.
3. All timestamps can be parsed.
4. The timeline is chronologically representable.
5. Essential events are covered by evidence.
6. Suspect statements do not contain unintended contradictions.
7. Intentional lies are marked in private solution metadata.
8. The final explanation references actual evidence IDs.
9. The case has sufficient clues to support the culprit.
10. Public and private fields are separated.

Use deterministic application logic for checks that can be verified programmatically.

An additional Gemini review may be used to identify semantic contradictions, but it must not replace deterministic validation.

If validation fails, allow a small, configurable number of repair attempts. The default should be one repair attempt, followed by a generation failure if validation still fails.

Never silently publish a case that fails mandatory checks.

## 6.6 Gemini service design

Create a backend interface such as:

```typescript
interface MysteryAIService {
  generateBlueprint(input: MysteryInput): Promise<MysteryBlueprint>;

  generateEvidence(
    blueprint: MysteryBlueprint
  ): Promise<GeneratedEvidenceBundle>;

  validateMystery(
    blueprint: MysteryBlueprint,
    evidence: GeneratedEvidenceBundle
  ): Promise<AIValidationReport>;
}
```

The actual implementation must include error handling, timeouts, typed results, and structured-output validation.

This interface is a design contract, not a requirement to use exactly these method names.

## 6.7 AI failure handling

Handle these cases explicitly:

- Gemini API key missing.
- Rate limit exceeded.
- Temporary provider outage.
- Request timeout.
- Invalid structured output.
- Content rejected by safety controls.
- Model unavailable.
- Repeated generation failure.
- Unexpected provider response.

The application must return a meaningful error to the frontend without exposing internal prompts, stack traces, or secrets.

Do not automatically retry permanent errors such as invalid API configuration.

## 6.8 Prompt security

All user-submitted scenarios are untrusted input.

The backend must instruct the model to treat the scenario as story material, not as instructions that override the mystery-generation contract.

Do not insert user input into system instructions as though it were trusted policy.

The model must not be allowed to:
- Override application security rules.
- Select arbitrary external tools.
- Execute code.
- Access server secrets.
- Choose arbitrary file paths.
- Change database records directly.

The backend, not Gemini, controls persistence, authorization, scoring, and access to the hidden solution.

---

# 7. AI-GENERATED MEDIA SYSTEM

## 7.1 Media architecture

Media generation must be a separate subsystem.

The mystery-generation engine produces a list of desired media assets, including:
- Asset type.
- Associated evidence ID.
- Visual description.
- Narrative purpose.
- Required visible details.
- Fictional timestamp, where applicable.

A media service then attempts to generate the assets using an appropriate configured provider.

The application must not assume that Gemini text generation automatically produces image or video files.

## 7.2 Media provider abstraction

Define a provider interface that allows different supported image or video generation models to be configured.

For example:

```typescript
interface MediaGenerationProvider {
  generateImage(
    request: ImageGenerationRequest
  ): Promise<GeneratedMediaResult>;

  generateVideo?(
    request: VideoGenerationRequest
  ): Promise<GeneratedMediaResult>;
}
```

Implement only operations supported by the selected provider.

Provider model names, capabilities, quotas, and pricing must be confirmed against current documentation before implementation.

## 7.3 MVP media requirements

The MVP must support:

- AI-generated textual evidence.
- AI-generated chat transcripts.
- AI-generated suspect descriptions.
- AI-generated witness statements.
- AI-generated incident timelines.
- Optional AI-generated images when a supported provider is configured.
- Simulated CCTV-style evidence using generated stills, storyboards, or text.

Actual video generation is optional and must not block the MVP.

If a video provider is added, the application must track whether an asset is pending, ready, or failed.

## 7.4 Media storage

Store media files in object storage rather than storing large binary assets directly inside MongoDB documents.

The database should store metadata such as:

```typescript
interface MediaAsset {
  id: string;
  caseId: string;
  evidenceId: string;
  type: "image" | "video" | "audio";
  status: "pending" | "ready" | "failed";
  storageKey?: string;
  mimeType?: string;
  sizeBytes?: number;
  createdAt: Date;
}
```

This is a conceptual contract. The final database model may use MongoDB ObjectIds and Mongoose-specific types.

Storage must support private objects or controlled access URLs.

Do not assume that an obscure file URL is a sufficient authorization mechanism.

## 7.5 Media safety

- All generated media must be presented as fictional.
- Do not generate explicit sexual content.
- Do not use real private individuals as suspects without an appropriate and lawful basis.
- Do not portray generated images as authenticated evidence of real wrongdoing.
- Prevent executable uploads and unsafe file handling.
- Validate media MIME types, file sizes, and provider responses.
- Never expose provider credentials in media URLs or frontend code.

---

# 8. DATABASE DESIGN

Use MongoDB with Mongoose.

All persistent models must have schema validation, timestamps where appropriate, and indexes for common queries.

## 8.1 User

```typescript
interface User {
  _id: ObjectId;
  displayName: string;
  email: string;
  passwordHash?: string;
  authProvider: "local" | "guest";
  createdAt: Date;
  updatedAt: Date;
}
```

Requirements:
- Normalize email addresses before checking uniqueness.
- Never store plaintext passwords.
- Never return password hashes through API responses.
- Guest sessions must use a separate secure mechanism if implemented.
- Account authentication is not required for the initial guest-first gameplay experience.

## 8.2 Mystery

```typescript
interface Mystery {
  _id: ObjectId;
  ownerId?: ObjectId;

  title: string;
  originalScenario: string;
  genre: string;
  difficulty: "easy" | "medium" | "hard";

  status:
    | "generating"
    | "validating"
    | "generating_media"
    | "ready"
    | "failed";

  generationVersion: string;

  publicCase: PublicCaseData;

  privateSolution: PrivateSolutionData;

  createdAt: Date;
  updatedAt: Date;
}
```

`PublicCaseData` and `PrivateSolutionData` must be separate typed structures.

They may be stored as separate fields in the same document for MVP simplicity, provided the backend uses strict allowlisted response DTOs and never serializes the complete document into a public response.

For stronger isolation, the solution may be stored in a separate collection.

The final choice must be documented in `DECISIONS.md`.

## 8.3 Public case data

Contains:
- Case summary.
- Location and incident information.
- Public suspect profiles.
- Evidence metadata and public evidence content.
- Public timeline.
- Case difficulty.
- Available media metadata.

It must not contain:
- Actual culprit identifier.
- Hidden motive explanation.
- Private solution timeline.
- Private lie classifications.
- Internal AI prompts.
- Validation reports containing hidden solution details.

## 8.4 Private solution data

```typescript
interface PrivateSolutionData {
  culpritSuspectId: string;
  motive: string;
  explanation: string;
  authoritativeTimeline: TimelineEvent[];
  decisiveEvidenceIds: string[];
  redHerringExplanations: string[];
  suspectTruthRecords: SuspectTruthRecord[];
}
```

The private solution must remain server-side until a valid accusation has been submitted.

## 8.5 Investigation

```typescript
interface Investigation {
  _id: ObjectId;
  mysteryId: ObjectId;
  userId?: ObjectId;

  status: "in_progress" | "completed" | "abandoned";

  reviewedEvidenceIds: string[];

  submittedSuspectId?: string;

  isCorrect?: boolean;

  completedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}
```

If guest investigations are supported, they must be associated with a secure guest session or equivalent ownership mechanism.

## 8.6 Evidence

Evidence may be embedded in the mystery document for the MVP, or stored in a separate collection if independent updates and media processing require it.

Conceptual structure:

```typescript
interface Evidence {
  id: string;
  type:
    | "chat"
    | "image"
    | "cctv"
    | "witness_statement"
    | "document"
    | "digital_record"
    | "timeline";

  title: string;
  description: string;
  source: string;

  occurredAt?: Date;

  relatedSuspectIds: string[];
  relatedEventIds: string[];

  content: Record<string, unknown>;

  mediaAssetIds: string[];
}
```

The actual implementation must use discriminated TypeScript types and runtime validation instead of relying on arbitrary unvalidated objects.

## 8.7 Indexes

Create indexes for:
- Unique normalized user email.
- Mystery owner and creation date.
- Mystery status and creation date.
- Investigation owner and creation date.
- Investigation mystery identifier.
- Media asset mystery and evidence identifiers.

Use compound indexes only when they support actual query patterns.

Do not add unnecessary indexes without a reason.

---

# 9. API SPECIFICATION

Base path:

`/api/v1`

All endpoints must use consistent JSON responses.

## 9.1 Standard response format

Success:

```json
{
  "success": true,
  "data": {},
  "requestId": "request-id"
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check the submitted information."
  },
  "requestId": "request-id"
}
```

Do not expose stack traces, database internals, API keys, or internal prompts.

## 9.2 Health

### GET `/health`

Returns service health information.

The endpoint must not expose secrets, connection strings, or detailed infrastructure configuration.

## 9.3 Create mystery

### POST `/mysteries`

Request:

```json
{
  "scenario": "A valuable painting disappears from a private gallery during a power outage.",
  "genre": "theft",
  "difficulty": "medium",
  "suspectCount": 4,
  "evidencePreferences": [
    "chat",
    "image",
    "cctv",
    "witness_statement"
  ],
  "generateMedia": true
}
```

Expected behavior:
- Validate input.
- Apply rate limits.
- Check ownership and idempotency.
- Create a generation job.
- Return a job or case identifier.

For asynchronous generation, return HTTP `202 Accepted`.

The request must not return the private solution.

## 9.4 Generation status

### GET `/mysteries/:id/status`

Returns:
- Generation status.
- Safe progress stage.
- Public error code if failed.
- Retry availability where supported.

It must not return the culprit or private blueprint.

## 9.5 List mysteries

### GET `/mysteries`

Returns only cases the authenticated user is authorized to access.

Support pagination and safe sorting.

Do not expose private cases belonging to other users.

## 9.6 Retrieve mystery

### GET `/mysteries/:id`

Returns the public investigation data.

This endpoint must use an explicit response DTO that excludes private solution fields.

It must not return the complete Mongoose document.

## 9.7 Retrieve evidence

### GET `/mysteries/:id/evidence/:evidenceId`

Returns the requested evidence after authorization.

The response must not include hidden evidence classifications, private annotations, or the intended culprit.

## 9.8 Retrieve timeline

### GET `/mysteries/:id/timeline`

Returns the public investigation timeline.

The authoritative private timeline must never be returned through this endpoint.

## 9.9 Update investigation progress

### PATCH `/investigations/:id/progress`

Request:

```json
{
  "reviewedEvidenceIds": [
    "evidence_001",
    "evidence_003"
  ]
}
```

The backend must:
- Verify ownership.
- Validate every evidence ID.
- Persist progress safely.
- Reject modifications to completed investigations where inappropriate.

## 9.10 Submit accusation

### POST `/investigations/:id/accusation`

Request:

```json
{
  "suspectId": "suspect_003",
  "reasoning": "The timestamp conflicts with the suspect's statement."
}
```

Expected behavior:
1. Authenticate or validate guest-session ownership.
2. Confirm the investigation exists.
3. Confirm the investigation is not already completed.
4. Validate the selected suspect against the case.
5. Compare the selection with the private solution.
6. Save the result atomically.
7. Return the permitted result payload.

The endpoint must prevent duplicate submissions using transaction-safe logic or an equivalent atomic update.

A completed investigation must not be silently overwritten.

## 9.11 Retrieve result

### GET `/investigations/:id/result`

Before submission, return a conflict response or another documented response that does not disclose the solution.

After submission, return:
- Correctness.
- Selected suspect.
- Culprit.
- Explanation.
- Decisive evidence.
- Timeline reconstruction.
- Red-herring explanation.

The backend must verify ownership before returning the result.

## 9.12 API security

All endpoints that access private data must enforce authorization.

Use request schemas and allowlisted fields.

Never trust:
- A client-provided user ID.
- A client-provided culprit ID.
- A client-provided correctness flag.
- A client-provided solution explanation.
- A client-provided investigation completion state.

The backend determines all authoritative results.

---

# 10. AUTHENTICATION AND AUTHORIZATION

Authentication is optional for the first guest-first MVP, but private case ownership must still be enforced.

If authentication is implemented:

- Use a secure registration and login flow.
- Hash passwords with a suitable password-hashing algorithm.
- Use short-lived access tokens.
- Protect refresh-token handling.
- Prefer secure, HttpOnly cookies for browser sessions where practical.
- Configure SameSite and Secure cookie attributes appropriately.
- Add CSRF protection when required by the chosen cookie-based authentication design.
- Rate-limit login and registration.
- Do not store long-lived authentication tokens in browser local storage without a documented security justification.

For every protected resource, enforce ownership on the backend.

Knowing a case ID must not grant access to the case.

Guest mode must not mean unrestricted access.

---

# 11. FRONTEND DESIGN SYSTEM

## 11.1 Visual direction

The interface should feel like a modern detective investigation dashboard.

Recommended visual identity:
- Dark charcoal backgrounds.
- Muted gray surfaces.
- Restrained red accents for alerts.
- Warm amber accents for clues.
- Clear typography.
- Subtle borders.
- Evidence cards.
- Case-file panels.
- Timeline visualization.
- Consistent spacing.
- Carefully limited animation.

Avoid excessive neon, constant animations, cluttered dashboards, or decorative elements that interfere with reading clues.

## 11.2 Responsive design

The application must support:
- Desktop screens.
- Laptop screens.
- Tablets.
- Mobile phones.

On desktop, the investigation page may use a multi-column layout.

On mobile:
- Suspects and evidence must be accessible through tabs or collapsible panels.
- The evidence viewer must fit the screen.
- Accusation controls must remain usable.
- Horizontal scrolling must not be required for normal gameplay.

## 11.3 Accessibility

Follow WCAG 2.2 AA as the accessibility target.

Requirements include:
- Keyboard navigation.
- Visible focus indicators.
- Semantic HTML.
- Accessible modal behavior.
- Sufficient color contrast.
- Labels for form fields.
- Screen-reader-friendly error messages.
- Text alternatives for meaningful images.
- Captions or text alternatives for relevant video information.
- Reduced-motion support.

---

# 12. SECURITY REQUIREMENTS

## 12.1 Secrets

Use environment variables for:
- MongoDB connection string.
- Gemini API key.
- JWT or session secrets.
- Object-storage credentials.
- Optional media-provider credentials.

Never commit real secrets.

Provide `.env.example` with placeholder values only.

## 12.2 Backend protections

Implement:
- Input validation.
- Request-size limits.
- Rate limiting.
- Security headers.
- CORS allowlisting.
- Authentication and authorization where required.
- Safe error handling.
- MongoDB query protections.
- Dependency auditing.
- Request timeouts.
- Controlled logging.

## 12.3 AI cost protection

- Limit scenario length.
- Limit suspect count.
- Limit evidence count.
- Limit media generation requests.
- Apply per-user or per-session rate limits.
- Bound retries.
- Use asynchronous generation for expensive work.
- Prevent users from starting unlimited concurrent jobs.
- Track provider usage and generation failures.

## 12.4 Privacy

Do not request unnecessary personal information.

Users must be informed that scenarios are processed by an external AI provider.

Do not include user emails, session tokens, or other private information in AI prompts unless strictly necessary.

The application must have a documented retention policy for cases, generated media, and user data.

## 12.5 Fictional evidence disclaimer

Display an appropriate notice in the application and on generated evidence:

"AI Mystery Room creates fictional investigations and simulated evidence for entertainment. Messages, photographs, surveillance-style recordings, and other case materials are AI-generated or simulated and must not be treated as authentic evidence of real-world events."

The disclaimer must not be hidden solely in the terms of service.

---

# 13. ERROR HANDLING AND OBSERVABILITY

## 13.1 Standard error codes

Support consistent codes, including:

- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `RATE_LIMITED`
- `GENERATION_IN_PROGRESS`
- `GENERATION_FAILED`
- `INVALID_MYSTERY`
- `INVALID_SUSPECT`
- `ALREADY_SUBMITTED`
- `RESULT_NOT_AVAILABLE`
- `AI_PROVIDER_UNAVAILABLE`
- `MEDIA_GENERATION_FAILED`
- `INTERNAL_ERROR`

Use appropriate HTTP status codes.

## 13.2 Logging

Log:
- Request ID.
- Operation name.
- Generation job ID.
- Safe provider status.
- Processing duration.
- Validation failures.
- Retry counts.
- Media-generation status.
- API error codes.

Do not log:
- Passwords.
- API keys.
- Authentication tokens.
- Full private solution objects.
- Sensitive user data.
- Full prompts containing unnecessary personal information.

## 13.3 Reliability

The application must distinguish:
- Request accepted.
- Case generation in progress.
- Case validation in progress.
- Media generation in progress.
- Case ready.
- Case failed.

A failed optional media operation must not mark an otherwise valid mystery as failed.

---

# 14. TESTING REQUIREMENTS

Testing is mandatory.

A feature is not complete merely because the development server starts.

## 14.1 Unit tests

Test:
- Input validators.
- Mystery schema validation.
- Suspect identifier uniqueness.
- Evidence reference validation.
- Timeline validation.
- Culprit membership validation.
- Solution visibility filtering.
- Accusation scoring.
- Authorization helpers.
- Retry logic.
- Error mapping.

## 14.2 Integration tests

Test:
- Mystery creation endpoint.
- Generation job lifecycle.
- Gemini response parsing.
- Database persistence.
- Evidence retrieval.
- Investigation progress updates.
- Accusation submission.
- Result retrieval.
- Media-generation failure handling.
- Unauthorized access.
- Duplicate submission prevention.

Mock Gemini and media providers in ordinary automated tests.

Do not require live AI API calls for every test run.

## 14.3 Frontend tests

Test:
- Scenario form validation.
- Loading states.
- Generation failure states.
- Suspect selection.
- Evidence viewer behavior.
- Mobile-friendly interaction.
- Accusation confirmation.
- Results display.
- Error messages.
- Empty states.

## 14.4 Security tests

Verify:
- Public mystery responses do not expose the culprit.
- Private solution fields never appear in public DTOs.
- Users cannot access other users' cases.
- Invalid suspect IDs are rejected.
- Client-supplied correctness values are ignored.
- Duplicate accusations are prevented.
- Rate limits are enforced.
- Secrets do not appear in frontend bundles.
- Failed authentication does not reveal private resources.

## 14.5 Mystery-quality tests

Create deterministic fixtures with known solutions.

Verify that:
- Every case has one intended culprit.
- The culprit exists.
- Every decisive evidence reference resolves.
- Timeline contradictions are intentional.
- Every red herring has an explanation.
- The result explanation cites actual evidence.
- A player cannot win by submitting an unrelated suspect ID.
- Generation failure does not create a playable incomplete case.

## 14.6 Definition of done

A feature is complete only when:
1. Its requirements are implemented.
2. Validation and error handling exist.
3. Relevant automated tests pass.
4. Security implications are reviewed.
5. The frontend handles success and failure states.
6. Documentation is updated where necessary.
7. No unrelated functionality is broken.

---

# 15. IMPLEMENTATION ROADMAP

Codex must implement the application incrementally.

Do not generate the entire codebase in one uncontrolled operation.

## Phase 0 — Repository inspection and planning

Tasks:
- Inspect the existing repository.
- Read `SPEC.md`.
- Check existing package files and dependencies.
- Identify whether the repository is empty or already contains code.
- Produce `IMPLEMENTATION_PLAN.md`.
- Identify ambiguities, technical risks, and provider requirements.
- Confirm the current Gemini SDK and supported model capabilities.

Deliverable: Approved implementation plan.

Do not overwrite existing working code without first understanding it.

## Phase 1 — Project foundation

Tasks:
- Initialize the frontend and backend if needed.
- Configure TypeScript.
- Configure linting and formatting.
- Configure environment-variable loading.
- Configure Express.
- Configure MongoDB and Mongoose.
- Add health endpoint.
- Add consistent API response handling.
- Add basic tests.
- Document local development setup.

Acceptance criteria:
- Frontend starts.
- Backend starts.
- Database connection works.
- Health endpoint responds.
- No secrets are committed.

## Phase 2 — UI foundation

Tasks:
- Implement application layout.
- Implement home page.
- Implement create-mystery form.
- Implement responsive styling.
- Implement loading and error states.
- Add accessible common components.

Acceptance criteria:
- Navigation works.
- Forms validate correctly.
- The interface works on desktop and mobile.
- No real AI generation is required yet.

## Phase 3 — Database and mystery domain

Tasks:
- Implement Mongoose models.
- Implement public and private case structures.
- Implement repository and service layers.
- Implement case ownership.
- Implement case retrieval and pagination.
- Add database indexes.

Acceptance criteria:
- Valid cases can be stored and retrieved.
- Invalid references are rejected.
- Private solution data is excluded from public API responses.

## Phase 4 — Gemini integration

Tasks:
- Implement Gemini client.
- Implement structured-output generation.
- Implement blueprint generation.
- Implement suspect generation.
- Implement evidence generation.
- Implement timeline generation.
- Implement deterministic validation.
- Implement bounded repair attempts.
- Implement generation jobs and failure handling.

Acceptance criteria:
- A valid scenario produces a playable mystery.
- Invalid model output is rejected.
- Generation failures are recoverable.
- The culprit is not exposed publicly.

## Phase 5 — Investigation experience

Tasks:
- Implement case overview.
- Implement suspect cards.
- Implement evidence locker.
- Implement evidence viewer.
- Implement chat transcript presentation.
- Implement timeline.
- Implement saved investigation progress.

Acceptance criteria:
- The user can inspect all required evidence.
- Previously viewed evidence remains accessible.
- The investigation works without image or video generation.

## Phase 6 — Accusation and results

Tasks:
- Implement suspect selection.
- Implement accusation submission.
- Implement authoritative server-side scoring.
- Implement result persistence.
- Implement solution reveal.
- Implement evidence-based explanations.
- Implement duplicate submission protection.

Acceptance criteria:
- Correct accusations succeed.
- Incorrect accusations fail.
- The correct solution is revealed after submission.
- Unauthorized users cannot access results.
- The frontend cannot manipulate the result.

## Phase 7 — Optional AI media

Tasks:
- Implement the media provider abstraction.
- Integrate a supported image-generation provider.
- Store assets in object storage.
- Add media status tracking.
- Implement simulated CCTV presentation.
- Add failure fallbacks.
- Display fictional-evidence labels.

Acceptance criteria:
- Available media renders correctly.
- Missing media does not break the case.
- Media is associated with the correct evidence.
- Private storage permissions work correctly.

Actual video generation may remain deferred.

## Phase 8 — Authentication and history

Tasks:
- Implement registration and login if required.
- Implement secure session handling.
- Implement case history.
- Implement ownership checks.
- Implement logout and session expiration.

Acceptance criteria:
- Users can access their own cases.
- Cross-user access is denied.
- Passwords and tokens are handled securely.

## Phase 9 — Quality assurance and deployment

Tasks:
- Run all automated tests.
- Run TypeScript checks.
- Run linting.
- Run production builds.
- Perform security checks.
- Test the full mystery-solving flow.
- Configure deployment.
- Configure production environment variables.
- Document operational requirements.

Acceptance criteria:
- The production build succeeds.
- Core gameplay works end to end.
- Required tests pass.
- Secrets are not exposed.
- Deployment and rollback instructions exist.

---

# 16. MVP SCOPE

The MVP must include:

- Scenario submission.
- Genre and difficulty selection.
- AI-generated mystery blueprint.
- At least three suspects.
- Multiple evidence items.
- AI-generated chat transcripts.
- Suspect statements.
- Investigation timeline.
- Evidence browsing.
- A single intended culprit.
- Final accusation.
- Server-side scoring.
- Solution reveal.
- Database persistence.
- Generation loading and error states.
- Fictional-content disclaimers.
- Core security protections.
- Automated tests.

The MVP should support optional image generation when the configured provider permits it.

## Explicitly deferred features

Unless separately approved, do not implement these as part of the MVP:

- Multiplayer investigations.
- Real-time collaborative detective rooms.
- Public leaderboards.
- Competitive ranking.
- Payments and subscriptions.
- User-generated public case marketplaces.
- Social sharing of private investigations.
- AI detective chat that reveals additional clues dynamically.
- Complex inventory systems.
- Voice-controlled investigations.
- Actual video generation as a mandatory dependency.
- Mobile applications.
- Administrative analytics dashboards.

These features may be added later through formal specification changes.

---

# 17. CONFIGURATION AND ENVIRONMENT VARIABLES

Provide an `.env` file.

Example:

```dotenv
# Application
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
API_PREFIX=/api/v1

# Database
MONGODB_URI=mongodb://localhost:27017/ai-mystery-room

# Gemini
GEMINI_API_KEY=
GEMINI_MODEL=

# Authentication
JWT_SECRET=
SESSION_SECRET=

# Media storage
MEDIA_STORAGE_PROVIDER=
MEDIA_STORAGE_BUCKET=
MEDIA_STORAGE_REGION=
MEDIA_STORAGE_ACCESS_KEY=
MEDIA_STORAGE_SECRET_KEY=

# Generation limits
MAX_SCENARIO_LENGTH=3000
MAX_CONCURRENT_GENERATION_JOBS=3
MAX_GENERATION_RETRIES=1
```

This list is illustrative. Codex must add, remove, or rename variables according to the selected implementations.

The actual application must validate required environment variables at startup.

Production must fail safely when mandatory configuration is missing.

Never place server-only variables in frontend-prefixed environment variables.

---

# 18. SPEC-DRIVEN DEVELOPMENT RULES FOR CODEX

These rules are mandatory.

## 18.1 Before implementation

Codex must:
1. Read `SPEC.md` completely.
2. Inspect the repository.
3. Identify existing conventions and dependencies.
4. Produce an implementation plan.
5. Identify external provider dependencies.
6. Identify security-sensitive components.
7. List any material ambiguities.
8. Avoid modifying files until planning is complete.

## 18.2 Before every phase

Codex must provide:
- Phase objective.
- Requirements being implemented.
- Files expected to change.
- Data model or API changes.
- Security implications.
- Tests to add or update.
- Acceptance criteria.
- Potential regressions.

## 18.3 During implementation

Codex must:
- Implement only the approved phase.
- Follow the existing architecture.
- Prefer small, reviewable changes.
- Use TypeScript types and runtime validation.
- Keep secrets server-side.
- Use the official Gemini SDK where appropriate.
- Avoid unnecessary dependencies.
- Avoid unrelated refactoring.
- Add tests alongside functionality.
- Update documentation when contracts change.

## 18.4 After every phase

Codex must report:
- What was implemented.
- Which requirements were completed.
- Which files changed.
- Which tests were run.
- Test results.
- Build and type-check results.
- Known limitations.
- Remaining work.
- Any deviation from the specification.

Codex must never claim that tests passed if they were not actually executed.

## 18.5 Handling ambiguities

If a decision materially changes:
- Security.
- Data architecture.
- Authentication.
- API contracts.
- Privacy.
- Provider selection.
- Product scope.
- Backwards compatibility.

Codex must explain the options and ask for approval.

For ordinary implementation details, Codex should select the simplest maintainable approach consistent with this specification.

## 18.6 Specification updates

When a new requirement is approved:

1. Update `SPEC.md`.
2. Record the reason and date in `DECISIONS.md`.
3. Update the implementation plan.
4. Identify affected APIs, schemas, tests, and frontend components.
5. Implement the change in a separate phase.
6. Verify that previously completed requirements remain satisfied.

Do not silently redefine requirements through code changes.

---

# 19. ACCEPTANCE CRITERIA FOR THE COMPLETE APPLICATION

The application is ready for its initial release only when all mandatory criteria below pass.

### AC-001: Scenario submission

A user can enter a valid scenario and request a mystery.

### AC-002: Generation

The backend can generate and validate a structured mystery using Gemini.

### AC-003: Suspects

The case contains the configured number of valid suspects.

### AC-004: Evidence

The case contains multiple evidence items with valid references.

### AC-005: Logical consistency

The case passes deterministic structural validation and the required consistency checks.

### AC-006: Investigation

The user can inspect suspect profiles, evidence, and the public timeline.

### AC-007: Accusation

The user can select a valid suspect and submit an accusation.

### AC-008: Scoring

The backend determines whether the accusation is correct.

### AC-009: Solution reveal

The application reveals the culprit and explanation after a valid submission.

### AC-010: Solution privacy

Public endpoints do not disclose the culprit or private solution before submission.

### AC-011: Media fallback

A mystery remains playable when optional image or video generation fails.

### AC-012: Persistence

Saved cases and completed investigations can be retrieved by authorized users.

### AC-013: Security

Authentication, ownership, rate limiting, input validation, and secret management meet the applicable requirements.

### AC-014: Responsive experience

The core experience works on desktop, tablet, and mobile.

### AC-015: Testing

Required automated tests pass, and the production build succeeds.

### AC-016: Documentation

Setup, architecture, API contracts, environment variables, and operational requirements are documented.

---

# 20. FINAL IMPLEMENTATION DIRECTIVE

AI Mystery Room must be built as a reliable, maintainable, AI-powered investigation application, not as a collection of screens connected to unvalidated model output.

The authoritative flow is:

**User scenario → Gemini-generated case blueprint → Suspects and evidence → Structural and logical validation → Optional media generation → Persisted playable case → Evidence investigation → Server-side accusation evaluation → Solution reveal.**

The most important engineering priorities are:

1. Mystery consistency.
2. Separation of public case data and private solution data.
3. Secure server-side Gemini integration.
4. Correct accusation evaluation.
5. Reliable persistence and generation recovery.
6. Clear evidence presentation.
7. Responsive and accessible UI.
8. Automated verification.

Codex must treat this document as the implementation contract.

**Do not begin by generating the entire application at once. Begin with repository inspection, confirm the implementation plan, and build the project phase by phase.**

A phase is complete only when its acceptance criteria have been verified.

**End of Specification — `SPEC.md`**
