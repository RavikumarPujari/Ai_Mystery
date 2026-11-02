# AI Mystery Room — API Specification

**Base Path:** `/api/v1`  
**Standard Envelope:** All API responses adhere to the standard envelope defined in Section 9.1 of `spec.md`.

```json
{
  "success": true,
  "data": {},
  "requestId": "req_uuid"
}
```

Error responses return:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  },
  "requestId": "req_uuid"
}
```

---

## 1. System Health

### `GET /health` or `GET /api/v1/health`
Returns service availability and database connection status without exposing server secrets.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-10-27T14:15:00.000Z",
    "services": {
      "api": "healthy",
      "database": "connected"
    }
  },
  "requestId": "req_123"
}
```

---

## 2. Mysteries & Investigation Dossiers

### `POST /api/v1/mysteries`
Synthesizes a new fictional mystery from user premise.

**Headers:**
- `X-Guest-Session-Id`: (Optional) Client guest session token.

**Request Body:**
```json
{
  "scenario": "A valuable painting disappears from a private gallery during a 14-minute blackout...",
  "genre": "theft",
  "difficulty": "medium",
  "suspectCount": 4,
  "evidencePreferences": ["chat", "cctv", "witness_statement", "digital_record"],
  "generateMedia": false
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "671e3b...",
    "caseNumber": "CASE-2026-MR4819",
    "title": "The Theft Incident at Gallery Foyer",
    "status": "ready"
  },
  "requestId": "req_123"
}
```

### `GET /api/v1/mysteries/:id`
Retrieves public case dossier. **Guaranteed zero solution leaks**; never exposes `culpritSuspectId`, `motive`, or `authoritativeTimeline`.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "671e3b...",
    "caseNumber": "CASE-2026-MR4819",
    "title": "The Theft Incident at Gallery Foyer",
    "summary": "...",
    "location": "Gallery Foyer",
    "incidentTime": "23:30 - 23:50 Incident Window",
    "difficulty": "medium",
    "genre": "theft",
    "suspects": [
      {
        "id": "suspect_001",
        "name": "Arthur Finch",
        "role": "Operations Supervisor",
        "relationship": "Controlled security access",
        "initialStatement": "I was in office 4B until 23:45.",
        "knownMotive": "Audit issues",
        "alibiInfo": "Office 4B, alone."
      }
    ],
    "evidence": [
      {
        "id": "evidence_001",
        "type": "chat",
        "title": "Internal Team Chat",
        "description": "...",
        "source": "Terminal",
        "content": {}
      }
    ],
    "timeline": []
  },
  "requestId": "req_123"
}
```

### `GET /api/v1/mysteries/:id/status`
Returns case generation stage.

---

## 3. Player Investigations & Deduction

### `POST /api/v1/investigations/start/:mysteryId`
Initializes or resumes a player's investigation attempt.

### `PATCH /api/v1/investigations/:id/progress`
Saves reviewed evidence progress.

**Request Body:**
```json
{
  "reviewedEvidenceIds": ["evidence_001", "evidence_002"]
}
```

### `POST /api/v1/investigations/:id/accusation`
Submits final suspect designation. Evaluates deduction server-side. Permanently marks investigation as `completed`. Re-attempts return HTTP 409 `ALREADY_SUBMITTED`.

**Request Body:**
```json
{
  "suspectId": "suspect_002",
  "reasoning": "The turnstile logs prove she never departed at 23:30."
}
```

### `GET /api/v1/investigations/:id/result`
Returns solution post-accusation. Returns HTTP 409 `RESULT_NOT_AVAILABLE` if accessed prior to official accusation submission.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "investigationId": "...",
    "mysteryId": "...",
    "status": "completed",
    "isCorrect": true,
    "submittedSuspectId": "suspect_002",
    "actualCulpritId": "suspect_002",
    "actualCulpritName": "Elena Rostova",
    "motive": "Syndicate debt...",
    "explanation": "Elena tampered with the sensor...",
    "decisiveEvidenceIds": ["evidence_001", "evidence_002"],
    "redHerringExplanations": ["Arthur was working on private business..."],
    "authoritativeTimeline": []
  },
  "requestId": "req_123"
}
```

---

## 4. History & Archives

### `GET /api/v1/investigations`
Returns case history belonging to the current `X-Guest-Session-Id` or authenticated user.

