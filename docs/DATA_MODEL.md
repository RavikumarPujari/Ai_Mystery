# AI Mystery Room — Data Model Documentation

This document describes the MongoDB collections, Mongoose schemas, foreign keys, and indexes implemented in AI Mystery Room.

---

## 1. Zero-Leak Architecture (ADR-001)

To strictly enforce Section 8.2 and Section 9.6 of `spec.md`, public case data and private solution data are stored in **separate physical MongoDB collections**.

```text
┌───────────────────────────────┐          ┌───────────────────────────────┐
│           Mystery             │          │        MysterySolution        │
├───────────────────────────────┤          ├───────────────────────────────┤
│ _id (ObjectId)                │◄─────────│ mysteryId (ObjectId, unique)  │
│ title                         │          │ culpritSuspectId              │
│ originalScenario              │          │ motive                        │
│ genre                         │          │ opportunity                   │
│ difficulty                    │          │ method                        │
│ status                        │          │ explanation                   │
│ publicCase {                  │          │ authoritativeTimeline []      │
│   caseNumber                  │          │ decisiveEvidenceIds []        │
│   summary                     │          │ redHerringExplanations []     │
│   suspects []                 │          │ suspectTruthRecords []        │
│   evidence []                 │          └───────────────────────────────┘
│   timeline []                 │                 (Access restricted strictly
│ }                             │                  to accusation scoring service)
└───────────────────────────────┘
```

---

## 2. Collections Overview

### `Mystery` (`server/src/models/Mystery.model.ts`)
- Stores metadata and the public investigation dossier.
- **Indexes**:
  - `{ status: 1, createdAt: -1 }`
  - `{ ownerId: 1, createdAt: -1 }`
  - `{ guestSessionId: 1, createdAt: -1 }`

### `MysterySolution` (`server/src/models/MysterySolution.model.ts`)
- Stores the hidden truth, perpetrator ID, motives, and proof connections.
- **Indexes**:
  - `{ mysteryId: 1 }` (unique)

### `Investigation` (`server/src/models/Investigation.model.ts`)
- Tracks player progress, reviewed evidence IDs, submitted suspect, and final scoring outcome.
- **Indexes**:
  - `{ userId: 1, createdAt: -1 }`
  - `{ guestSessionId: 1, createdAt: -1 }`
  - `{ mysteryId: 1, guestSessionId: 1 }`

### `MediaAsset` (`server/src/models/MediaAsset.model.ts`)
- Tracks generated photographs, storyboard frames, and storage paths.
- **Indexes**:
  - `{ caseId: 1, evidenceId: 1 }`

### `User` (`server/src/models/User.model.ts`)
- User accounts with normalized email index and hidden password hashes.
- **Indexes**:
  - `{ email: 1 }` (unique, lowercase, normalized)

